"""
Transaction Review Routes - Review and approve extracted transactions.

Endpoints for:
- Reviewing pending transactions
- Approving/rejecting transactions
- Importing approved transactions to main transaction table
- Duplicate detection
"""

import uuid
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from ..services.database import async_session


router = APIRouter()


class TransactionUpdate(BaseModel):
    """Update a pending transaction."""
    category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    notes: Optional[str] = None


class BulkAction(BaseModel):
    """Bulk action on multiple transactions."""
    transaction_ids: List[str]
    action: str  # 'approve', 'reject', 'delete'


class ImportRequest(BaseModel):
    """Request to import approved transactions."""
    document_id: str
    budget_id: Optional[str] = None  # Optional default budget


@router.put("/{transaction_id}")
async def update_transaction(transaction_id: str, update: TransactionUpdate):
    """Update a pending transaction's details."""
    if async_session is None:
        raise HTTPException(500, "Database not initialized")

    async with async_session() as session:
        # Check transaction exists
        result = await session.execute(
            text("SELECT id, status FROM pending_transactions WHERE id = :id"),
            {"id": transaction_id}
        )
        row = result.fetchone()

        if not row:
            raise HTTPException(404, "Transaction not found")

        if row[1] == "IMPORTED":
            raise HTTPException(400, "Cannot modify imported transaction")

        # Build update query
        updates = []
        params = {"id": transaction_id}

        if update.category is not None:
            updates.append('"userCategory" = :category')
            params["category"] = update.category
        if update.description is not None:
            updates.append('description = :description')
            params["description"] = update.description
        if update.amount is not None:
            updates.append('amount = :amount')
            params["amount"] = update.amount
        if update.type is not None:
            updates.append('type = :type')
            params["type"] = update.type.upper()
        if update.notes is not None:
            updates.append('"userNotes" = :notes')
            params["notes"] = update.notes

        if updates:
            updates.append('"updatedAt" = NOW()')
            query = f"UPDATE pending_transactions SET {', '.join(updates)} WHERE id = :id"
            await session.execute(text(query), params)
            await session.commit()

        return {"success": True, "message": "Transaction updated"}


@router.post("/{transaction_id}/approve")
async def approve_transaction(transaction_id: str):
    """Approve a pending transaction for import."""
    if async_session is None:
        raise HTTPException(500, "Database not initialized")

    async with async_session() as session:
        result = await session.execute(
            text("""
                UPDATE pending_transactions
                SET status = 'APPROVED', "updatedAt" = NOW()
                WHERE id = :id AND status = 'PENDING'
                RETURNING id
            """),
            {"id": transaction_id}
        )
        row = result.fetchone()
        await session.commit()

        if not row:
            raise HTTPException(400, "Transaction not found or not in pending status")

        return {"success": True, "message": "Transaction approved"}


@router.post("/{transaction_id}/reject")
async def reject_transaction(transaction_id: str):
    """Reject a pending transaction."""
    if async_session is None:
        raise HTTPException(500, "Database not initialized")

    async with async_session() as session:
        result = await session.execute(
            text("""
                UPDATE pending_transactions
                SET status = 'REJECTED', "updatedAt" = NOW()
                WHERE id = :id AND status IN ('PENDING', 'APPROVED')
                RETURNING id
            """),
            {"id": transaction_id}
        )
        row = result.fetchone()
        await session.commit()

        if not row:
            raise HTTPException(400, "Transaction not found or cannot be rejected")

        return {"success": True, "message": "Transaction rejected"}


@router.post("/bulk")
async def bulk_action(action: BulkAction):
    """Perform bulk action on multiple transactions."""
    if async_session is None:
        raise HTTPException(500, "Database not initialized")

    if not action.transaction_ids:
        raise HTTPException(400, "No transaction IDs provided")

    new_status = {
        "approve": "APPROVED",
        "reject": "REJECTED"
    }.get(action.action)

    if not new_status and action.action != "delete":
        raise HTTPException(400, f"Invalid action: {action.action}")

    async with async_session() as session:
        if action.action == "delete":
            # Delete transactions
            result = await session.execute(
                text("""
                    DELETE FROM pending_transactions
                    WHERE id = ANY(:ids) AND status != 'IMPORTED'
                """),
                {"ids": action.transaction_ids}
            )
        else:
            # Update status
            result = await session.execute(
                text("""
                    UPDATE pending_transactions
                    SET status = :status, "updatedAt" = NOW()
                    WHERE id = ANY(:ids) AND status IN ('PENDING', 'APPROVED')
                """),
                {"ids": action.transaction_ids, "status": new_status}
            )

        await session.commit()

        return {
            "success": True,
            "message": f"Processed {len(action.transaction_ids)} transactions",
            "action": action.action
        }


@router.post("/import")
async def import_transactions(request: ImportRequest):
    """
    Import approved transactions to the main transactions table.

    Only imports transactions with APPROVED status.
    """
    if async_session is None:
        raise HTTPException(500, "Database not initialized")

    async with async_session() as session:
        # Get document and user info
        result = await session.execute(
            text("""
                SELECT d."userId", d.status
                FROM bank_documents d
                WHERE d.id = :document_id
            """),
            {"document_id": request.document_id}
        )
        doc = result.fetchone()

        if not doc:
            raise HTTPException(404, "Document not found")

        user_id = doc[0]

        # Get approved transactions
        result = await session.execute(
            text("""
                SELECT id, date, description, amount, type, category, "userCategory"
                FROM pending_transactions
                WHERE "documentId" = :document_id AND status = 'APPROVED'
            """),
            {"document_id": request.document_id}
        )
        pending = result.fetchall()

        if not pending:
            raise HTTPException(400, "No approved transactions to import")

        imported_count = 0
        imported_ids = []

        for p in pending:
            pending_id = p[0]
            # Use user category if set, otherwise LLM category
            final_category = p[6] if p[6] else p[5] or "Other"
            # Convert type to lowercase for main transaction table
            final_type = "expense" if p[4] == "EXPENSE" else "income"

            # Create transaction
            new_id = str(uuid.uuid4())
            await session.execute(
                text("""
                    INSERT INTO transactions (
                        id, description, amount, type, category, date,
                        "budgetId", "userId", "createdAt", "updatedAt"
                    ) VALUES (
                        :id, :description, :amount, :type, :category, :date,
                        :budget_id, :user_id, NOW(), NOW()
                    )
                """),
                {
                    "id": new_id,
                    "description": p[2],
                    "amount": float(p[3]),
                    "type": final_type,
                    "category": final_category,
                    "date": p[1],
                    "budget_id": request.budget_id,
                    "user_id": user_id
                }
            )

            # Update pending transaction status
            await session.execute(
                text("""
                    UPDATE pending_transactions
                    SET status = 'IMPORTED', "importedTransactionId" = :new_id, "updatedAt" = NOW()
                    WHERE id = :pending_id
                """),
                {"new_id": new_id, "pending_id": pending_id}
            )

            imported_count += 1
            imported_ids.append(new_id)

        # Update document status
        await session.execute(
            text("""
                UPDATE bank_documents
                SET status = 'IMPORTED', "updatedAt" = NOW()
                WHERE id = :document_id
            """),
            {"document_id": request.document_id}
        )

        await session.commit()

        return {
            "success": True,
            "imported_count": imported_count,
            "transaction_ids": imported_ids,
            "message": f"Successfully imported {imported_count} transactions"
        }


@router.post("/check-duplicates")
async def check_duplicates(document_id: str, user_id: str):
    """
    Check for potential duplicate transactions.

    Compares pending transactions against existing transactions
    based on date, amount, and description similarity.
    """
    if async_session is None:
        raise HTTPException(500, "Database not initialized")

    async with async_session() as session:
        # Get pending transactions
        result = await session.execute(
            text("""
                SELECT id, date, description, amount
                FROM pending_transactions
                WHERE "documentId" = :document_id AND status = 'PENDING'
            """),
            {"document_id": document_id}
        )
        pending = result.fetchall()

        duplicates = []

        for p in pending:
            pending_id, p_date, p_desc, p_amount = p

            # Check for exact matches (same date, amount)
            result = await session.execute(
                text("""
                    SELECT id, description, date, amount
                    FROM transactions
                    WHERE "userId" = :user_id
                    AND date = :date
                    AND ABS(amount - :amount) < 0.01
                """),
                {
                    "user_id": user_id,
                    "date": p_date,
                    "amount": float(p_amount)
                }
            )
            matches = result.fetchall()

            if matches:
                duplicates.append({
                    "pending_id": pending_id,
                    "pending_description": p_desc,
                    "pending_date": p_date.isoformat() if p_date else None,
                    "pending_amount": float(p_amount),
                    "potential_duplicates": [
                        {
                            "id": m[0],
                            "description": m[1],
                            "date": m[2].isoformat() if m[2] else None,
                            "amount": float(m[3])
                        }
                        for m in matches
                    ]
                })

        # Mark found duplicates
        if duplicates:
            for dup in duplicates:
                await session.execute(
                    text("""
                        UPDATE pending_transactions
                        SET status = 'DUPLICATE',
                            "duplicateOfId" = :duplicate_id,
                            "updatedAt" = NOW()
                        WHERE id = :pending_id
                    """),
                    {
                        "pending_id": dup["pending_id"],
                        "duplicate_id": dup["potential_duplicates"][0]["id"]
                    }
                )
            await session.commit()

        return {
            "total_checked": len(pending),
            "duplicates_found": len(duplicates),
            "duplicates": duplicates
        }


@router.get("/summary/{document_id}")
async def get_document_summary(document_id: str):
    """Get summary of pending transactions for a document."""
    if async_session is None:
        raise HTTPException(500, "Database not initialized")

    async with async_session() as session:
        # Count by status
        result = await session.execute(
            text("""
                SELECT
                    status,
                    COUNT(*) as count,
                    COALESCE(SUM(amount), 0) as total
                FROM pending_transactions
                WHERE "documentId" = :document_id
                GROUP BY status
            """),
            {"document_id": document_id}
        )
        status_counts = {row[0]: {"count": row[1], "total": float(row[2])} for row in result.fetchall()}

        # Category breakdown for pending/approved
        result = await session.execute(
            text("""
                SELECT
                    COALESCE("userCategory", category, 'Uncategorized') as cat,
                    COUNT(*) as count,
                    SUM(amount) as total
                FROM pending_transactions
                WHERE "documentId" = :document_id
                AND status IN ('PENDING', 'APPROVED')
                GROUP BY COALESCE("userCategory", category, 'Uncategorized')
                ORDER BY total DESC
            """),
            {"document_id": document_id}
        )
        categories = [
            {"category": row[0], "count": row[1], "total": float(row[2])}
            for row in result.fetchall()
        ]

        return {
            "document_id": document_id,
            "by_status": status_counts,
            "by_category": categories,
            "ready_to_import": status_counts.get("APPROVED", {}).get("count", 0)
        }
