"""Analytics API endpoints."""

from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime

from ..services.database import (
    fetch_user_transactions,
    fetch_user_goals,
    fetch_user_contributions,
)
from ..analyzers import (
    SpendingPatternAnalyzer,
    GoalPredictor,
    AnomalyDetector,
    RecommendationEngine,
)

router = APIRouter()


@router.get("/spending-patterns/{user_id}")
async def get_spending_patterns(user_id: str, months: int = 6):
    """
    Analyze spending patterns for a user.

    Returns:
    - Category breakdown
    - Monthly trends
    - Weekly patterns
    - Spending velocity changes
    """
    try:
        transactions = await fetch_user_transactions(user_id, limit=2000)

        if transactions.empty:
            return {
                "message": "No transaction data found",
                "analysis": None,
            }

        analyzer = SpendingPatternAnalyzer(transactions)
        analysis = analyzer.analyze()

        return {
            "userId": user_id,
            "analyzedAt": datetime.now().isoformat(),
            "analysis": analysis,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/goal-predictions/{user_id}")
async def get_goal_predictions(user_id: str, goal_id: Optional[str] = None):
    """
    Predict savings goal completion.

    Returns:
    - Predicted completion dates
    - On-track status
    - Required savings rate
    - Personalized recommendations
    """
    try:
        goals = await fetch_user_goals(user_id)
        contributions = await fetch_user_contributions(user_id, goal_id)

        if goals.empty:
            return {
                "message": "No goals found",
                "analysis": None,
            }

        predictor = GoalPredictor(goals, contributions)

        if goal_id:
            prediction = predictor.predict_completion(goal_id)
            return {
                "userId": user_id,
                "analyzedAt": datetime.now().isoformat(),
                "prediction": prediction,
            }
        else:
            analysis = predictor.analyze()
            return {
                "userId": user_id,
                "analyzedAt": datetime.now().isoformat(),
                "analysis": analysis,
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/anomalies/{user_id}")
async def get_anomalies(user_id: str, days: int = 90):
    """
    Detect unusual spending patterns.

    Returns:
    - Unusual transactions
    - Spending spikes
    - Frequency anomalies
    - Severity ratings
    """
    try:
        transactions = await fetch_user_transactions(user_id, limit=2000)

        if transactions.empty:
            return {
                "message": "No transaction data found",
                "analysis": None,
            }

        detector = AnomalyDetector(transactions)
        analysis = detector.analyze()

        return {
            "userId": user_id,
            "analyzedAt": datetime.now().isoformat(),
            "analysis": analysis,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/{user_id}")
async def get_recommendations(user_id: str):
    """
    Get personalized financial recommendations.

    Combines insights from:
    - Spending patterns
    - Goal progress
    - Detected anomalies
    - Financial best practices

    Returns prioritized, actionable recommendations.
    """
    try:
        transactions = await fetch_user_transactions(user_id, limit=2000)
        goals = await fetch_user_goals(user_id)
        contributions = await fetch_user_contributions(user_id)

        engine = RecommendationEngine(transactions, goals, contributions)
        analysis = engine.analyze()

        return {
            "userId": user_id,
            "analyzedAt": datetime.now().isoformat(),
            "analysis": analysis,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/full-analysis/{user_id}")
async def get_full_analysis(user_id: str):
    """
    Run comprehensive financial analysis.

    Combines all analyzers into a single response:
    - Spending patterns
    - Goal predictions
    - Anomalies
    - Recommendations
    """
    try:
        transactions = await fetch_user_transactions(user_id, limit=2000)
        goals = await fetch_user_goals(user_id)
        contributions = await fetch_user_contributions(user_id)

        # Run all analyzers
        spending_analyzer = SpendingPatternAnalyzer(transactions)
        goal_predictor = GoalPredictor(goals, contributions)
        anomaly_detector = AnomalyDetector(transactions)
        recommendation_engine = RecommendationEngine(transactions, goals, contributions)

        return {
            "userId": user_id,
            "analyzedAt": datetime.now().isoformat(),
            "spendingPatterns": spending_analyzer.analyze() if not transactions.empty else None,
            "goalPredictions": goal_predictor.analyze() if not goals.empty else None,
            "anomalies": anomaly_detector.analyze() if not transactions.empty else None,
            "recommendations": recommendation_engine.analyze(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
