"""
Goal Predictor

Predicts when users will reach their savings goals based on:
- Historical contribution patterns
- Savings velocity
- Goal deadlines
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class GoalPrediction:
    """Prediction for a savings goal."""
    goal_id: str
    goal_name: str
    target_amount: float
    current_amount: float
    deadline: Optional[datetime]
    predicted_completion_date: Optional[datetime]
    on_track: bool
    monthly_savings_rate: float
    required_monthly_rate: float
    confidence: float
    recommendation: str


class GoalPredictor:
    """Predicts savings goal completion."""

    def __init__(self, goals_df: pd.DataFrame, contributions_df: pd.DataFrame):
        self.goals = goals_df.copy()
        self.contributions = contributions_df.copy()
        self._preprocess()

    def _preprocess(self):
        """Preprocess data."""
        if not self.contributions.empty:
            self.contributions["createdAt"] = pd.to_datetime(self.contributions["createdAt"])
            self.contributions["month"] = self.contributions["createdAt"].dt.to_period("M")

    def calculate_savings_velocity(self, goal_id: str) -> Dict[str, float]:
        """Calculate monthly savings rate for a goal."""
        if self.contributions.empty:
            return {"monthly": 0, "weekly": 0, "daily": 0}

        goal_contrib = self.contributions[self.contributions["goalId"] == goal_id]

        if goal_contrib.empty:
            return {"monthly": 0, "weekly": 0, "daily": 0}

        # Calculate time span
        date_range = (goal_contrib["createdAt"].max() - goal_contrib["createdAt"].min()).days
        total = goal_contrib["amount"].sum()

        if date_range <= 0:
            # Single contribution - assume it's monthly
            return {
                "monthly": float(total),
                "weekly": float(total / 4),
                "daily": float(total / 30),
            }

        daily_rate = total / date_range
        return {
            "monthly": round(float(daily_rate * 30), 2),
            "weekly": round(float(daily_rate * 7), 2),
            "daily": round(float(daily_rate), 2),
        }

    def predict_completion(self, goal_id: str) -> Dict[str, Any]:
        """Predict when a goal will be completed."""
        goal_row = self.goals[self.goals["id"] == goal_id]

        if goal_row.empty:
            return {"error": "Goal not found"}

        goal = goal_row.iloc[0]
        target = float(goal["targetAmount"])
        current = float(goal["currentAmount"])
        remaining = target - current
        deadline = pd.to_datetime(goal["deadline"]) if pd.notna(goal["deadline"]) else None

        velocity = self.calculate_savings_velocity(goal_id)
        monthly_rate = velocity["monthly"]

        # Calculate predicted completion
        if monthly_rate > 0:
            months_to_complete = remaining / monthly_rate
            predicted_date = datetime.now() + timedelta(days=months_to_complete * 30)
        else:
            months_to_complete = None
            predicted_date = None

        # Check if on track
        if deadline and predicted_date:
            on_track = predicted_date <= deadline
            days_until_deadline = (deadline - datetime.now()).days
            months_until_deadline = days_until_deadline / 30
            required_monthly = remaining / months_until_deadline if months_until_deadline > 0 else float("inf")
        else:
            on_track = None
            required_monthly = None

        # Generate recommendation
        recommendation = self._generate_recommendation(
            current, target, monthly_rate, required_monthly, on_track
        )

        # Calculate confidence based on data quality
        contrib_count = len(self.contributions[self.contributions["goalId"] == goal_id])
        confidence = min(0.95, 0.3 + (contrib_count * 0.1))  # More data = higher confidence

        return {
            "goalId": goal_id,
            "goalName": goal["name"],
            "targetAmount": target,
            "currentAmount": current,
            "remainingAmount": round(remaining, 2),
            "progressPercent": round(current / target * 100, 1) if target > 0 else 0,
            "deadline": deadline.isoformat() if deadline else None,
            "predictedCompletionDate": predicted_date.isoformat() if predicted_date else None,
            "monthsToComplete": round(months_to_complete, 1) if months_to_complete else None,
            "onTrack": on_track,
            "savingsVelocity": velocity,
            "requiredMonthlyRate": round(required_monthly, 2) if required_monthly and required_monthly != float("inf") else None,
            "confidence": round(confidence, 2),
            "recommendation": recommendation,
        }

    def _generate_recommendation(
        self,
        current: float,
        target: float,
        monthly_rate: float,
        required_rate: Optional[float],
        on_track: Optional[bool]
    ) -> str:
        """Generate a recommendation based on goal status."""
        progress = current / target * 100 if target > 0 else 0

        if progress >= 100:
            return "Congratulations! You've reached your goal!"

        if monthly_rate == 0:
            return "Start making regular contributions to build momentum toward your goal."

        if on_track is True:
            return f"You're on track! Keep saving ${monthly_rate:,.0f}/month to reach your goal."

        if on_track is False and required_rate:
            increase_needed = required_rate - monthly_rate
            if increase_needed > 0:
                return f"To meet your deadline, increase monthly savings by ${increase_needed:,.0f} to ${required_rate:,.0f}/month."

        if progress < 25:
            return f"Good start! At ${monthly_rate:,.0f}/month, you're building toward your goal."
        elif progress < 50:
            return f"Making progress! You're {progress:.0f}% of the way there."
        elif progress < 75:
            return f"Over halfway! Keep up the ${monthly_rate:,.0f}/month pace."
        else:
            return f"Almost there! Just ${target - current:,.0f} to go."

    def predict_all_goals(self) -> List[Dict[str, Any]]:
        """Predict completion for all goals."""
        predictions = []
        for goal_id in self.goals["id"].unique():
            prediction = self.predict_completion(goal_id)
            predictions.append(prediction)

        # Sort by progress percentage
        predictions.sort(key=lambda x: x.get("progressPercent", 0), reverse=True)
        return predictions

    def get_savings_summary(self) -> Dict[str, Any]:
        """Get overall savings summary across all goals."""
        if self.goals.empty:
            return {
                "totalGoals": 0,
                "totalTarget": 0,
                "totalSaved": 0,
                "overallProgress": 0,
                "goalsOnTrack": 0,
                "goalsBehind": 0,
            }

        total_target = self.goals["targetAmount"].sum()
        total_saved = self.goals["currentAmount"].sum()

        predictions = self.predict_all_goals()
        on_track = sum(1 for p in predictions if p.get("onTrack") is True)
        behind = sum(1 for p in predictions if p.get("onTrack") is False)

        return {
            "totalGoals": len(self.goals),
            "totalTarget": round(float(total_target), 2),
            "totalSaved": round(float(total_saved), 2),
            "overallProgress": round(float(total_saved / total_target * 100), 1) if total_target > 0 else 0,
            "goalsOnTrack": on_track,
            "goalsBehind": behind,
        }

    def analyze(self) -> Dict[str, Any]:
        """Run full goal prediction analysis."""
        return {
            "summary": self.get_savings_summary(),
            "predictions": self.predict_all_goals(),
        }
