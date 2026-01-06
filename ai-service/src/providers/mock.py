"""
Mock LLM Provider for testing.

Returns predefined responses without any external API calls.
Always available, useful for development and testing.
"""

import json
from datetime import datetime, timedelta
import random
from .types import LLMProvider, LLMCompletionParams


class MockLLMProvider(LLMProvider):
    """
    Mock provider that returns fake but realistic responses.

    Useful for testing the pipeline without LLM costs or setup.
    """

    def __init__(self):
        self._model = "mock-v1"

    @property
    def name(self) -> str:
        return "Mock"

    @property
    def model(self) -> str:
        return self._model

    async def complete(self, params: LLMCompletionParams) -> str:
        """Return mock transaction extraction response."""
        # Check if this looks like a transaction extraction request
        user_message = ""
        for msg in params.messages:
            if msg.role.value == "user":
                user_message = msg.content
                break

        # If it looks like bank statement extraction, return mock transactions
        if "transaction" in user_message.lower() or "statement" in user_message.lower():
            return self._generate_mock_transactions()

        # Default response
        return json.dumps({
            "message": "Mock response",
            "note": "This is a mock LLM provider for testing"
        })

    def _generate_mock_transactions(self) -> str:
        """Generate mock bank statement transactions."""
        categories = [
            "Groceries", "Dining", "Transportation", "Utilities",
            "Entertainment", "Shopping", "Healthcare", "Subscriptions"
        ]

        merchants = {
            "Groceries": ["WALMART", "TRADER JOES", "WHOLE FOODS", "SAFEWAY", "KROGER"],
            "Dining": ["STARBUCKS", "CHIPOTLE", "MCDONALDS", "DOORDASH", "UBER EATS"],
            "Transportation": ["SHELL", "CHEVRON", "UBER", "LYFT", "PARKING"],
            "Utilities": ["PG&E", "COMCAST", "ATT", "WATER UTILITY", "GARBAGE SVC"],
            "Entertainment": ["NETFLIX", "SPOTIFY", "HULU", "AMAZON PRIME", "DISNEY+"],
            "Shopping": ["AMAZON", "TARGET", "BESTBUY", "COSTCO", "HOME DEPOT"],
            "Healthcare": ["CVS PHARMACY", "WALGREENS", "KAISER", "DENTAL OFFICE", "VISION CTR"],
            "Subscriptions": ["GITHUB", "DROPBOX", "ADOBE", "MICROSOFT", "GOOGLE STORAGE"]
        }

        transactions = []
        base_date = datetime.now() - timedelta(days=30)

        # Generate 15-25 mock transactions
        num_transactions = random.randint(15, 25)

        for i in range(num_transactions):
            category = random.choice(categories)
            merchant = random.choice(merchants[category])

            # Generate realistic amounts
            if category in ["Utilities", "Subscriptions"]:
                amount = round(random.uniform(10, 150), 2)
            elif category == "Groceries":
                amount = round(random.uniform(30, 200), 2)
            elif category == "Dining":
                amount = round(random.uniform(8, 80), 2)
            elif category == "Transportation":
                amount = round(random.uniform(15, 100), 2)
            else:
                amount = round(random.uniform(20, 300), 2)

            # Random date within the statement period
            date = base_date + timedelta(days=random.randint(0, 30))

            transactions.append({
                "date": date.strftime("%Y-%m-%d"),
                "description": f"{merchant} #{random.randint(1000, 9999)}",
                "amount": amount,
                "type": "expense",
                "category": category,
                "confidence": round(random.uniform(0.75, 0.98), 2)
            })

        # Sort by date
        transactions.sort(key=lambda x: x["date"])

        return json.dumps({
            "statement_period": {
                "start_date": base_date.strftime("%Y-%m-%d"),
                "end_date": (base_date + timedelta(days=30)).strftime("%Y-%m-%d")
            },
            "account_info": {
                "bank_name": "Mock Bank",
                "account_type": "credit_card",
                "last_four": "1234"
            },
            "transactions": transactions,
            "summary": {
                "total_transactions": len(transactions),
                "total_amount": round(sum(t["amount"] for t in transactions), 2)
            }
        }, indent=2)

    async def is_available(self) -> bool:
        """Mock provider is always available."""
        return True
