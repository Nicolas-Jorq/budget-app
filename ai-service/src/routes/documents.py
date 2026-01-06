"""
Document Processing Routes - Bank statement upload and extraction.

Endpoints for:
- Uploading PDF bank statements
- Processing documents with LLM extraction
- Managing extracted transactions
"""

import os
import uuid
import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from sqlalchemy import text

from ..services.database import async_session
from ..extractors import StatementExtractor
from ..providers import create_llm_provider, get_available_providers
from ..providers.registry import get_best_available_provider


router = APIRouter()

# Configure upload directory
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/budget-app-uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class ProcessDocumentRequest(BaseModel):
    """Request to process an uploaded document."""
    document_id: str
    llm_provider: Optional[str] = None  # Override default provider


class ProviderInfo(BaseModel):
    """LLM provider information."""
    name: str
    available: bool


@router.get("/providers")
async def list_providers():
    """List available LLM providers and their status."""
    providers = get_available_providers()
    result = []

    for key, config in providers.items():
        provider = create_llm_provider(key)
        available = await provider.is_available()
        result.append({
            "id": key,
            "name": config["name"],
            "description": config["description"],
            "available": available,
            "setup_url": config.get("setup_url"),
            "setup_steps": config.get("setup_steps", [])
        })

    return {"providers": result}


@router.post("/extract")
async def extract_transactions(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    document_id: str = Form(...),
    llm_provider: Optional[str] = Form(None)
):
    """
    Extract transactions from a PDF bank statement.

    This endpoint is called by the Node.js server after the file is uploaded.
    It extracts transactions using LLM and returns the results.
    The Node.js server handles database storage.
    """
    # Validate file type
    if not file.content_type or "pdf" not in file.content_type.lower():
        raise HTTPException(400, "Only PDF files are supported")

    # Read file content
    content = await file.read()

    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large. Maximum size is 10MB")

    try:
        # Get LLM provider
        if llm_provider:
            provider = create_llm_provider(llm_provider)
            if not await provider.is_available():
                raise HTTPException(400, f"Provider '{llm_provider}' is not available")
        else:
            provider = await get_best_available_provider()

        # Extract transactions
        extractor = StatementExtractor(provider)
        result = await extractor.extract(content)
        result_dict = extractor.to_dict(result)

        return {
            "success": result_dict["success"],
            "document_id": document_id,
            "provider": provider.name,
            "model": provider.model,
            "processing_time_ms": result_dict["processing_time_ms"],
            "transaction_count": result_dict["transaction_count"],
            "statement_info": result_dict["statement_info"],
            "transactions": result_dict["transactions"],
            "error": result_dict.get("error")
        }

    except Exception as e:
        raise HTTPException(500, f"Extraction failed: {str(e)}")


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    bank_account_id: Optional[str] = Form(None)
):
    """
    Upload a bank statement PDF for processing.

    Returns document ID for subsequent processing.
    """
    # Validate file type
    if not file.content_type or "pdf" not in file.content_type.lower():
        raise HTTPException(400, "Only PDF files are supported")

    # Validate file size (max 10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large. Maximum size is 10MB")

    # Generate unique filename
    file_id = str(uuid.uuid4())
    filename = f"{file_id}.pdf"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(content)

    # Create database record
    if async_session is None:
        raise HTTPException(500, "Database not initialized")

    async with async_session() as session:
        result = await session.execute(
            text("""
                INSERT INTO bank_documents (
                    id, filename, "originalName", "fileSize", "mimeType",
                    "filePath", status, "bankAccountId", "userId", "uploadedAt", "updatedAt"
                ) VALUES (
                    :id, :filename, :original_name, :file_size, :mime_type,
                    :file_path, 'PENDING', :bank_account_id, :user_id, NOW(), NOW()
                )
                RETURNING id
            """),
            {
                "id": file_id,
                "filename": filename,
                "original_name": file.filename,
                "file_size": len(content),
                "mime_type": file.content_type,
                "file_path": file_path,
                "bank_account_id": bank_account_id,
                "user_id": user_id
            }
        )
        await session.commit()

    return {
        "success": True,
        "document_id": file_id,
        "filename": file.filename,
        "size": len(content),
        "status": "PENDING",
        "message": "Document uploaded. Call /process to extract transactions."
    }


@router.post("/process/{document_id}")
async def process_document(
    document_id: str,
    llm_provider: Optional[str] = None
):
    """
    Process an uploaded document to extract transactions.

    Uses LLM to parse the bank statement and extract transaction data.
    """
    if async_session is None:
        raise HTTPException(500, "Database not initialized")

    # Get document from database
    async with async_session() as session:
        result = await session.execute(
            text("""
                SELECT id, filename, "filePath", status, "userId"
                FROM bank_documents
                WHERE id = :id
            """),
            {"id": document_id}
        )
        row = result.fetchone()

        if not row:
            raise HTTPException(404, "Document not found")

        doc_id, filename, file_path, status, user_id = row

        if status not in ["PENDING", "FAILED"]:
            raise HTTPException(400, f"Document already processed (status: {status})")

        # Update status to processing
        await session.execute(
            text("""
                UPDATE bank_documents
                SET status = 'PROCESSING', "updatedAt" = NOW()
                WHERE id = :id
            """),
            {"id": document_id}
        )
        await session.commit()

    try:
        # Read PDF file
        with open(file_path, "rb") as f:
            pdf_bytes = f.read()

        # Get LLM provider
        if llm_provider:
            provider = create_llm_provider(llm_provider)
            if not await provider.is_available():
                raise HTTPException(400, f"Provider '{llm_provider}' is not available")
        else:
            provider = await get_best_available_provider()

        # Extract transactions
        extractor = StatementExtractor(provider)
        extraction_result = extractor.to_dict(await extractor.extract(pdf_bytes))

        # Update database with results
        async with async_session() as session:
            if extraction_result["success"]:
                # Update document record
                await session.execute(
                    text("""
                        UPDATE bank_documents
                        SET
                            status = 'EXTRACTED',
                            "extractedData" = :extracted_data,
                            "transactionCount" = :transaction_count,
                            "llmProvider" = :llm_provider,
                            "llmModel" = :llm_model,
                            "processingTimeMs" = :processing_time,
                            "statementStartDate" = :start_date,
                            "statementEndDate" = :end_date,
                            "processedAt" = NOW(),
                            "updatedAt" = NOW()
                        WHERE id = :id
                    """),
                    {
                        "id": document_id,
                        "extracted_data": json.dumps(extraction_result),
                        "transaction_count": extraction_result["transaction_count"],
                        "llm_provider": provider.name,
                        "llm_model": provider.model,
                        "processing_time": extraction_result["processing_time_ms"],
                        "start_date": extraction_result["statement_info"].get("statement_start"),
                        "end_date": extraction_result["statement_info"].get("statement_end")
                    }
                )

                # Insert pending transactions
                for txn in extraction_result["transactions"]:
                    await session.execute(
                        text("""
                            INSERT INTO pending_transactions (
                                id, "documentId", date, description, "originalDescription",
                                amount, type, category, "suggestedCategories", confidence,
                                "lineNumber", status, "createdAt", "updatedAt"
                            ) VALUES (
                                :id, :document_id, :date, :description, :original_desc,
                                :amount, :type, :category, :suggested_categories, :confidence,
                                :line_number, 'PENDING', NOW(), NOW()
                            )
                        """),
                        {
                            "id": str(uuid.uuid4()),
                            "document_id": document_id,
                            "date": txn["date"],
                            "description": txn["description"],
                            "original_desc": txn["original_description"],
                            "amount": txn["amount"],
                            "type": txn["type"].upper(),
                            "category": txn["category"],
                            "suggested_categories": json.dumps([
                                {"category": txn["category"], "confidence": txn["confidence"]}
                            ]),
                            "confidence": txn["confidence"],
                            "line_number": txn.get("line_number")
                        }
                    )

                await session.commit()

            else:
                # Mark as failed
                await session.execute(
                    text("""
                        UPDATE bank_documents
                        SET
                            status = 'FAILED',
                            "processingError" = :error,
                            "llmProvider" = :llm_provider,
                            "processingTimeMs" = :processing_time,
                            "processedAt" = NOW(),
                            "updatedAt" = NOW()
                        WHERE id = :id
                    """),
                    {
                        "id": document_id,
                        "error": extraction_result["error"],
                        "llm_provider": provider.name,
                        "processing_time": extraction_result["processing_time_ms"]
                    }
                )
                await session.commit()

        return {
            "success": extraction_result["success"],
            "document_id": document_id,
            "provider": provider.name,
            "model": provider.model,
            "processing_time_ms": extraction_result["processing_time_ms"],
            "transaction_count": extraction_result["transaction_count"],
            "statement_info": extraction_result["statement_info"],
            "error": extraction_result.get("error")
        }

    except Exception as e:
        # Mark document as failed
        async with async_session() as session:
            await session.execute(
                text("""
                    UPDATE bank_documents
                    SET status = 'FAILED', "processingError" = :error, "updatedAt" = NOW()
                    WHERE id = :id
                """),
                {"id": document_id, "error": str(e)}
            )
            await session.commit()

        raise HTTPException(500, f"Processing failed: {str(e)}")


@router.get("/document/{document_id}")
async def get_document(document_id: str):
    """Get document details and its pending transactions."""
    if async_session is None:
        raise HTTPException(500, "Database not initialized")

    async with async_session() as session:
        # Get document
        result = await session.execute(
            text("""
                SELECT
                    d.id, d.filename, d."originalName", d."fileSize",
                    d.status, d."statementStartDate", d."statementEndDate",
                    d."transactionCount", d."llmProvider", d."llmModel",
                    d."processingTimeMs", d."processingError", d."uploadedAt",
                    b.name as "bankAccountName", b."bankName"
                FROM bank_documents d
                LEFT JOIN bank_accounts b ON d."bankAccountId" = b.id
                WHERE d.id = :id
            """),
            {"id": document_id}
        )
        doc = result.fetchone()

        if not doc:
            raise HTTPException(404, "Document not found")

        # Get pending transactions
        result = await session.execute(
            text("""
                SELECT
                    id, date, description, "originalDescription",
                    amount, type, category, confidence, status,
                    "userCategory", "userNotes"
                FROM pending_transactions
                WHERE "documentId" = :document_id
                ORDER BY date, "lineNumber"
            """),
            {"document_id": document_id}
        )
        transactions = result.fetchall()

        return {
            "document": {
                "id": doc[0],
                "filename": doc[1],
                "originalName": doc[2],
                "fileSize": doc[3],
                "status": doc[4],
                "statementStartDate": doc[5].isoformat() if doc[5] else None,
                "statementEndDate": doc[6].isoformat() if doc[6] else None,
                "transactionCount": doc[7],
                "llmProvider": doc[8],
                "llmModel": doc[9],
                "processingTimeMs": doc[10],
                "processingError": doc[11],
                "uploadedAt": doc[12].isoformat() if doc[12] else None,
                "bankAccountName": doc[13],
                "bankName": doc[14]
            },
            "transactions": [
                {
                    "id": t[0],
                    "date": t[1].isoformat() if t[1] else None,
                    "description": t[2],
                    "originalDescription": t[3],
                    "amount": float(t[4]) if t[4] else 0,
                    "type": t[5],
                    "category": t[6],
                    "confidence": float(t[7]) if t[7] else 0,
                    "status": t[8],
                    "userCategory": t[9],
                    "userNotes": t[10]
                }
                for t in transactions
            ]
        }


@router.get("/user/{user_id}/documents")
async def list_user_documents(user_id: str):
    """List all documents for a user."""
    if async_session is None:
        raise HTTPException(500, "Database not initialized")

    async with async_session() as session:
        result = await session.execute(
            text("""
                SELECT
                    d.id, d."originalName", d.status, d."transactionCount",
                    d."uploadedAt", d."processedAt",
                    b.name as "bankAccountName"
                FROM bank_documents d
                LEFT JOIN bank_accounts b ON d."bankAccountId" = b.id
                WHERE d."userId" = :user_id
                ORDER BY d."uploadedAt" DESC
            """),
            {"user_id": user_id}
        )
        documents = result.fetchall()

        return {
            "documents": [
                {
                    "id": d[0],
                    "originalName": d[1],
                    "status": d[2],
                    "transactionCount": d[3],
                    "uploadedAt": d[4].isoformat() if d[4] else None,
                    "processedAt": d[5].isoformat() if d[5] else None,
                    "bankAccountName": d[6]
                }
                for d in documents
            ]
        }
