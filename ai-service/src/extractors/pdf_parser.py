"""
PDF Parser - Extracts text content from PDF documents.

Uses pdfplumber for robust table and text extraction.
Falls back to PyPDF2 for simpler documents.
"""

import io
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
import pdfplumber
from PyPDF2 import PdfReader


@dataclass
class PDFPage:
    """Extracted content from a single PDF page."""
    page_number: int
    text: str
    tables: List[List[List[str]]]  # List of tables, each table is list of rows


@dataclass
class PDFContent:
    """Complete extracted content from a PDF."""
    total_pages: int
    pages: List[PDFPage]
    full_text: str
    all_tables: List[List[List[str]]]
    metadata: Dict[str, Any]


class PDFParser:
    """
    Extracts text and tables from PDF documents.

    Optimized for bank statements which typically contain:
    - Transaction tables
    - Account information headers
    - Summary sections
    """

    def __init__(self):
        self.extraction_settings = {
            "x_tolerance": 3,
            "y_tolerance": 3,
        }

    async def parse(self, pdf_bytes: bytes) -> PDFContent:
        """
        Parse a PDF document and extract all content.

        Args:
            pdf_bytes: Raw PDF file content

        Returns:
            PDFContent with extracted text and tables
        """
        pages = []
        all_tables = []
        full_text_parts = []
        metadata = {}

        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                metadata = {
                    "page_count": len(pdf.pages),
                    "metadata": pdf.metadata or {}
                }

                for page_num, page in enumerate(pdf.pages, 1):
                    # Extract text
                    text = page.extract_text(
                        x_tolerance=self.extraction_settings["x_tolerance"],
                        y_tolerance=self.extraction_settings["y_tolerance"]
                    ) or ""

                    # Extract tables
                    tables = []
                    for table in page.extract_tables():
                        if table:
                            # Clean up table cells
                            cleaned_table = [
                                [str(cell).strip() if cell else "" for cell in row]
                                for row in table
                            ]
                            tables.append(cleaned_table)
                            all_tables.append(cleaned_table)

                    pages.append(PDFPage(
                        page_number=page_num,
                        text=text,
                        tables=tables
                    ))
                    full_text_parts.append(f"--- Page {page_num} ---\n{text}")

        except Exception as e:
            # Fall back to PyPDF2 for basic text extraction
            print(f"pdfplumber failed, falling back to PyPDF2: {e}")
            pages, full_text_parts, metadata = await self._fallback_parse(pdf_bytes)

        return PDFContent(
            total_pages=len(pages),
            pages=pages,
            full_text="\n\n".join(full_text_parts),
            all_tables=all_tables,
            metadata=metadata
        )

    async def _fallback_parse(self, pdf_bytes: bytes) -> tuple:
        """Fallback parsing using PyPDF2."""
        pages = []
        full_text_parts = []

        reader = PdfReader(io.BytesIO(pdf_bytes))
        metadata = {
            "page_count": len(reader.pages),
            "metadata": dict(reader.metadata) if reader.metadata else {}
        }

        for page_num, page in enumerate(reader.pages, 1):
            text = page.extract_text() or ""
            pages.append(PDFPage(
                page_number=page_num,
                text=text,
                tables=[]
            ))
            full_text_parts.append(f"--- Page {page_num} ---\n{text}")

        return pages, full_text_parts, metadata

    async def extract_text_only(self, pdf_bytes: bytes) -> str:
        """
        Quick extraction of just the text content.

        Args:
            pdf_bytes: Raw PDF file content

        Returns:
            Combined text from all pages
        """
        content = await self.parse(pdf_bytes)
        return content.full_text

    def format_for_llm(self, content: PDFContent) -> str:
        """
        Format extracted PDF content for LLM processing.

        Combines text and table data in a structured format
        that helps LLMs understand the document structure.

        Args:
            content: Extracted PDF content

        Returns:
            Formatted string optimized for LLM parsing
        """
        parts = []

        parts.append("=== BANK STATEMENT DOCUMENT ===\n")
        parts.append(f"Total Pages: {content.total_pages}\n")

        for page in content.pages:
            parts.append(f"\n--- PAGE {page.page_number} ---\n")
            parts.append(page.text)

            if page.tables:
                parts.append("\n\n[TABLES ON THIS PAGE]")
                for table_idx, table in enumerate(page.tables, 1):
                    parts.append(f"\nTable {table_idx}:")
                    for row in table[:50]:  # Limit rows to avoid token overflow
                        parts.append(" | ".join(row))

        return "\n".join(parts)
