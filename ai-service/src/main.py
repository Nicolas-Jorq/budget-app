"""
AI Service - Financial Analytics Engine

Provides ML-powered insights for the Budget App:
- Spending pattern analysis
- Goal predictions
- Anomaly detection
- Personalized recommendations
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from .routes import analytics, health, documents, transactions
from .services.database import init_db, close_db

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    await init_db()
    print("AI Service started")
    yield
    # Shutdown
    await close_db()
    print("AI Service stopped")


app = FastAPI(
    title="Budget App AI Service",
    description="ML-powered financial analytics and insights",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("CLIENT_URL", "http://localhost:5173"),
        "http://localhost:5174",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health.router, tags=["Health"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])


@app.get("/")
async def root():
    return {
        "service": "Budget App AI Service",
        "version": "1.1.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "analytics": {
                "spending_patterns": "/api/analytics/spending-patterns/{user_id}",
                "goal_predictions": "/api/analytics/goal-predictions/{user_id}",
                "anomalies": "/api/analytics/anomalies/{user_id}",
                "recommendations": "/api/analytics/recommendations/{user_id}",
            },
            "documents": {
                "providers": "/api/documents/providers",
                "upload": "/api/documents/upload",
                "process": "/api/documents/process/{document_id}",
                "get_document": "/api/documents/document/{document_id}",
                "user_documents": "/api/documents/user/{user_id}/documents",
            },
            "transactions": {
                "update": "/api/transactions/{transaction_id}",
                "approve": "/api/transactions/{transaction_id}/approve",
                "reject": "/api/transactions/{transaction_id}/reject",
                "bulk": "/api/transactions/bulk",
                "import": "/api/transactions/import",
                "check_duplicates": "/api/transactions/check-duplicates",
                "summary": "/api/transactions/summary/{document_id}",
            },
        },
    }
