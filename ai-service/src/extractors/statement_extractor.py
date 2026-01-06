"""
Bank Statement Extractor - LLM-powered transaction extraction.

Uses LLM to parse bank statement text and extract structured transactions.
Supports multiple bank formats through intelligent parsing.
"""

import json
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

from .pdf_parser import PDFParser, PDFContent
from ..providers import LLMProvider, LLMMessage, LLMCompletionParams
from ..providers.types import MessageRole


@dataclass
class ExtractedTransaction:
    """A single transaction extracted from a bank statement."""
    date: str  # ISO format YYYY-MM-DD
    description: str
    original_description: str  # Raw description from PDF
    amount: float
    type: str  # 'income' or 'expense'
    category: Optional[str] = None
    confidence: float = 0.0
    raw_text: Optional[str] = None
    line_number: Optional[int] = None


@dataclass
class StatementInfo:
    """Metadata about the bank statement."""
    bank_name: Optional[str] = None
    account_type: Optional[str] = None  # credit_card, checking, savings
    last_four: Optional[str] = None
    statement_start: Optional[str] = None
    statement_end: Optional[str] = None


@dataclass
class ExtractionResult:
    """Complete extraction result from a bank statement."""
    success: bool
    statement_info: StatementInfo
    transactions: List[ExtractedTransaction]
    raw_llm_response: str
    error: Optional[str] = None
    processing_time_ms: int = 0


# Categories for transaction classification
TRANSACTION_CATEGORIES = [
    "Groceries",
    "Dining",
    "Transportation",
    "Utilities",
    "Entertainment",
    "Shopping",
    "Healthcare",
    "Subscriptions",
    "Travel",
    "Housing",
    "Insurance",
    "Education",
    "Personal Care",
    "Gifts & Donations",
    "Income",
    "Transfer",
    "Fees & Charges",
    "Other"
]


class StatementExtractor:
    """
    Extracts transactions from bank statements using LLM.

    Process:
    1. Parse PDF to extract text
    2. Send text to LLM with extraction prompt
    3. Parse LLM response into structured transactions
    4. Validate and clean results
    """

    def __init__(self, llm_provider: LLMProvider):
        self.llm = llm_provider
        self.pdf_parser = PDFParser()

    async def extract(self, pdf_bytes: bytes) -> ExtractionResult:
        """
        Extract transactions from a bank statement PDF.

        Args:
            pdf_bytes: Raw PDF file content

        Returns:
            ExtractionResult with transactions and metadata
        """
        start_time = datetime.now()

        try:
            # Step 1: Parse PDF
            pdf_content = await self.pdf_parser.parse(pdf_bytes)

            if not pdf_content.full_text.strip():
                return ExtractionResult(
                    success=False,
                    statement_info=StatementInfo(),
                    transactions=[],
                    raw_llm_response="",
                    error="Could not extract text from PDF. The document may be scanned/image-based.",
                    processing_time_ms=self._elapsed_ms(start_time)
                )

            # Step 2: Prepare prompt for LLM
            formatted_text = self.pdf_parser.format_for_llm(pdf_content)
            prompt = self._build_extraction_prompt(formatted_text)

            # Step 3: Call LLM
            params = LLMCompletionParams(
                messages=[
                    LLMMessage(
                        role=MessageRole.SYSTEM,
                        content=self._get_system_prompt()
                    ),
                    LLMMessage(
                        role=MessageRole.USER,
                        content=prompt
                    )
                ],
                temperature=0.1,  # Low temp for consistent extraction
                max_tokens=8192,
                json_mode=True
            )

            llm_response = await self.llm.complete(params)

            # Step 4: Parse response
            result = self._parse_llm_response(llm_response)
            result.raw_llm_response = llm_response
            result.processing_time_ms = self._elapsed_ms(start_time)

            return result

        except Exception as e:
            return ExtractionResult(
                success=False,
                statement_info=StatementInfo(),
                transactions=[],
                raw_llm_response="",
                error=f"Extraction failed: {str(e)}",
                processing_time_ms=self._elapsed_ms(start_time)
            )

    def _get_system_prompt(self) -> str:
        """System prompt for the LLM."""
        return """You are a financial document parser specializing in bank statement extraction.
Your task is to extract transaction data from bank statements accurately.

IMPORTANT RULES:
1. Extract ALL transactions you can find in the document
2. Dates should be in YYYY-MM-DD format
3. Amounts should be positive numbers (indicate income/expense in the type field)
4. Identify the transaction type: 'expense' for charges/purchases, 'income' for credits/deposits
5. Categorize each transaction using these categories: """ + ", ".join(TRANSACTION_CATEGORIES) + """
6. Include confidence scores (0.0 to 1.0) based on how certain you are about each extraction
7. Preserve the original description exactly as it appears

OUTPUT FORMAT (JSON):
{
  "statement_info": {
    "bank_name": "string or null",
    "account_type": "credit_card|checking|savings|null",
    "last_four": "string (last 4 digits) or null",
    "statement_start": "YYYY-MM-DD or null",
    "statement_end": "YYYY-MM-DD or null"
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "cleaned description",
      "original_description": "exact text from statement",
      "amount": 123.45,
      "type": "expense|income",
      "category": "category name",
      "confidence": 0.95
    }
  ]
}"""

    def _build_extraction_prompt(self, document_text: str) -> str:
        """Build the extraction prompt with document text."""
        # Truncate if too long (most LLMs have token limits)
        max_chars = 50000
        if len(document_text) > max_chars:
            document_text = document_text[:max_chars] + "\n\n[Document truncated due to length]"

        return f"""Please extract all transactions from this bank statement.

{document_text}

Extract every transaction you can find and return the JSON response."""

    def _parse_llm_response(self, response: str) -> ExtractionResult:
        """Parse the LLM's JSON response into structured data."""
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if not json_match:
                return ExtractionResult(
                    success=False,
                    statement_info=StatementInfo(),
                    transactions=[],
                    raw_llm_response=response,
                    error="No JSON found in LLM response"
                )

            data = json.loads(json_match.group())

            # Parse statement info
            info_data = data.get("statement_info", {})
            statement_info = StatementInfo(
                bank_name=info_data.get("bank_name"),
                account_type=info_data.get("account_type"),
                last_four=info_data.get("last_four"),
                statement_start=info_data.get("statement_start"),
                statement_end=info_data.get("statement_end")
            )

            # Parse transactions
            transactions = []
            for idx, t in enumerate(data.get("transactions", [])):
                try:
                    transaction = ExtractedTransaction(
                        date=self._normalize_date(t.get("date", "")),
                        description=t.get("description", "Unknown"),
                        original_description=t.get("original_description", t.get("description", "")),
                        amount=abs(float(t.get("amount", 0))),
                        type=t.get("type", "expense").lower(),
                        category=t.get("category"),
                        confidence=float(t.get("confidence", 0.5)),
                        line_number=idx + 1
                    )

                    # Validate transaction
                    if transaction.amount > 0 and transaction.date:
                        transactions.append(transaction)

                except (ValueError, TypeError) as e:
                    print(f"Skipping invalid transaction: {e}")
                    continue

            return ExtractionResult(
                success=True,
                statement_info=statement_info,
                transactions=transactions,
                raw_llm_response=response
            )

        except json.JSONDecodeError as e:
            return ExtractionResult(
                success=False,
                statement_info=StatementInfo(),
                transactions=[],
                raw_llm_response=response,
                error=f"Failed to parse JSON: {str(e)}"
            )

    def _normalize_date(self, date_str: str) -> str:
        """Normalize various date formats to YYYY-MM-DD."""
        if not date_str:
            return ""

        # Already in correct format
        if re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
            return date_str

        # Try common formats
        formats = [
            "%m/%d/%Y",
            "%m/%d/%y",
            "%d/%m/%Y",
            "%d/%m/%y",
            "%m-%d-%Y",
            "%m-%d-%y",
            "%B %d, %Y",
            "%b %d, %Y",
            "%d %B %Y",
            "%d %b %Y",
        ]

        for fmt in formats:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue

        # Return original if can't parse
        return date_str

    def _elapsed_ms(self, start: datetime) -> int:
        """Calculate elapsed time in milliseconds."""
        return int((datetime.now() - start).total_seconds() * 1000)

    def to_dict(self, result: ExtractionResult) -> Dict[str, Any]:
        """Convert extraction result to dictionary for API response."""
        return {
            "success": result.success,
            "error": result.error,
            "processing_time_ms": result.processing_time_ms,
            "statement_info": asdict(result.statement_info),
            "transaction_count": len(result.transactions),
            "transactions": [asdict(t) for t in result.transactions]
        }
