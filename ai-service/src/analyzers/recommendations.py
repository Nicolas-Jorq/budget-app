"""
Recommendations Engine

Generates personalized financial recommendations based on:
- Spending patterns
- Goal progress
- Anomalies detected
- Financial best practices
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

from .spending_patterns import SpendingPatternAnalyzer
from .goal_predictor import GoalPredictor
from .anomaly_detector import AnomalyDetector


@dataclass
class Recommendation:
    """A financial recommendation."""
    category: str  # "savings", "spending", "goals", "general"
    priority: str  # "high", "medium", "low"
    title: str
    description: str
    potential_impact: Optional[float]
    action_items: List[str]


class RecommendationEngine:
    """Generates personalized financial recommendations."""

    def __init__(
        self,
        transactions_df: pd.DataFrame,
        goals_df: pd.DataFrame,
        contributions_df: pd.DataFrame
    ):
        self.transactions = transactions_df
        self.goals = goals_df
        self.contributions = contributions_df

        # Initialize analyzers
        self.spending_analyzer = SpendingPatternAnalyzer(transactions_df)
        self.goal_predictor = GoalPredictor(goals_df, contributions_df)
        self.anomaly_detector = AnomalyDetector(transactions_df)

    def generate_spending_recommendations(self) -> List[Dict[str, Any]]:
        """Generate recommendations based on spending patterns."""
        recommendations = []
        patterns = self.spending_analyzer.analyze()

        # Check for high spending categories
        breakdown = patterns.get("categoryBreakdown", [])
        if breakdown:
            top_category = breakdown[0]
            if top_category["percentage"] > 40:
                recommendations.append({
                    "category": "spending",
                    "priority": "high",
                    "title": f"High {top_category['category']} Spending",
                    "description": f"{top_category['category']} makes up {top_category['percentage']}% of your expenses. Consider setting a budget for this category.",
                    "potentialImpact": round(top_category["total"] * 0.15, 2),  # 15% reduction
                    "actionItems": [
                        f"Review your {top_category['category']} transactions",
                        "Identify non-essential purchases",
                        f"Set a monthly budget of ${top_category['total'] * 0.85:,.0f}"
                    ]
                })

        # Check for increasing trends
        trends = patterns.get("trends", [])
        for trend in trends[:3]:  # Top 3 trending categories
            if trend["patternType"] == "increasing" and trend["trendPercentage"] > 20:
                recommendations.append({
                    "category": "spending",
                    "priority": "medium",
                    "title": f"Rising {trend['category']} Costs",
                    "description": f"Your {trend['category']} spending has increased by {trend['trendPercentage']:.0f}% recently.",
                    "potentialImpact": round(trend["avgAmount"] * trend["trendPercentage"] / 100, 2),
                    "actionItems": [
                        f"Review recent {trend['category']} transactions",
                        "Look for alternatives or ways to reduce costs",
                        "Consider if this increase is temporary or ongoing"
                    ]
                })

        # Weekend vs weekday spending
        weekly = patterns.get("weeklyPattern", {})
        weekend_ratio = weekly.get("weekendVsWeekday", {}).get("ratio", 1)
        if weekend_ratio > 1.5:
            recommendations.append({
                "category": "spending",
                "priority": "low",
                "title": "Weekend Spending Pattern",
                "description": f"You spend {weekend_ratio:.1f}x more on weekends than weekdays.",
                "potentialImpact": None,
                "actionItems": [
                    "Plan weekend activities in advance",
                    "Set a weekend spending allowance",
                    "Look for free weekend activities"
                ]
            })

        return recommendations

    def generate_goal_recommendations(self) -> List[Dict[str, Any]]:
        """Generate recommendations based on goal progress."""
        recommendations = []
        goal_analysis = self.goal_predictor.analyze()

        predictions = goal_analysis.get("predictions", [])

        for pred in predictions:
            if pred.get("error"):
                continue

            # Goal behind schedule
            if pred.get("onTrack") is False:
                required = pred.get("requiredMonthlyRate", 0)
                current = pred.get("savingsVelocity", {}).get("monthly", 0)
                shortfall = required - current if required else 0

                recommendations.append({
                    "category": "goals",
                    "priority": "high",
                    "title": f"'{pred['goalName']}' Needs Attention",
                    "description": f"You're behind on this goal. Increase monthly savings by ${shortfall:,.0f} to meet your deadline.",
                    "potentialImpact": shortfall * 12,  # Annual impact
                    "actionItems": [
                        f"Increase monthly contribution to ${required:,.0f}",
                        "Review and reduce non-essential expenses",
                        "Consider extending your deadline if needed"
                    ]
                })

            # Goal with no recent activity
            elif pred.get("savingsVelocity", {}).get("monthly", 0) == 0 and pred.get("progressPercent", 0) < 100:
                recommendations.append({
                    "category": "goals",
                    "priority": "medium",
                    "title": f"Inactive Goal: {pred['goalName']}",
                    "description": "No recent contributions detected. Regular savings help build momentum.",
                    "potentialImpact": None,
                    "actionItems": [
                        "Set up automatic contributions",
                        "Start with a small weekly amount",
                        "Link contributions to payday"
                    ]
                })

            # Goal almost complete
            elif 80 <= pred.get("progressPercent", 0) < 100:
                remaining = pred.get("remainingAmount", 0)
                recommendations.append({
                    "category": "goals",
                    "priority": "low",
                    "title": f"Almost There: {pred['goalName']}",
                    "description": f"You're {pred['progressPercent']:.0f}% to your goal! Just ${remaining:,.0f} to go.",
                    "potentialImpact": remaining,
                    "actionItems": [
                        "Consider a one-time boost to finish early",
                        "Redirect any windfalls to this goal",
                        "Celebrate your progress!"
                    ]
                })

        return recommendations

    def generate_anomaly_recommendations(self) -> List[Dict[str, Any]]:
        """Generate recommendations based on detected anomalies."""
        recommendations = []
        anomaly_analysis = self.anomaly_detector.analyze()

        summary = anomaly_analysis.get("summary", {})
        anomalies = anomaly_analysis.get("anomalies", [])

        if summary.get("hasHighPriority"):
            high_count = summary.get("bySeverity", {}).get("high", 0)
            recommendations.append({
                "category": "spending",
                "priority": "high",
                "title": "Unusual Spending Detected",
                "description": f"We found {high_count} unusual transaction(s) that may need your attention.",
                "potentialImpact": sum(a["amount"] for a in anomalies if a["severity"] == "high"),
                "actionItems": [
                    "Review flagged transactions",
                    "Verify all charges are legitimate",
                    "Consider setting spending alerts"
                ]
            })

        # Check for recurring anomalies in same category
        anomaly_categories = {}
        for a in anomalies:
            cat = a.get("category", "Other")
            anomaly_categories[cat] = anomaly_categories.get(cat, 0) + 1

        for cat, count in anomaly_categories.items():
            if count >= 3 and cat not in ["Multiple", "Daily Total"]:
                recommendations.append({
                    "category": "spending",
                    "priority": "medium",
                    "title": f"Frequent Unusual {cat} Spending",
                    "description": f"Multiple unusual transactions detected in {cat}. This might indicate a pattern.",
                    "potentialImpact": None,
                    "actionItems": [
                        f"Review all {cat} expenses",
                        "Check for subscription or recurring charges",
                        "Consider setting a category budget"
                    ]
                })

        return recommendations

    def generate_general_recommendations(self) -> List[Dict[str, Any]]:
        """Generate general financial health recommendations."""
        recommendations = []

        # Check for emergency fund
        has_emergency_fund = False
        if not self.goals.empty:
            emergency = self.goals[self.goals["type"] == "EMERGENCY_FUND"]
            if not emergency.empty:
                has_emergency_fund = True
                progress = (emergency.iloc[0]["currentAmount"] / emergency.iloc[0]["targetAmount"]) * 100
                if progress < 100:
                    recommendations.append({
                        "category": "general",
                        "priority": "high" if progress < 50 else "medium",
                        "title": "Build Your Emergency Fund",
                        "description": f"Your emergency fund is {progress:.0f}% funded. Aim for 3-6 months of expenses.",
                        "potentialImpact": None,
                        "actionItems": [
                            "Prioritize emergency savings",
                            "Automate weekly contributions",
                            "Keep funds in high-yield savings"
                        ]
                    })

        if not has_emergency_fund:
            recommendations.append({
                "category": "general",
                "priority": "high",
                "title": "Start an Emergency Fund",
                "description": "An emergency fund protects you from unexpected expenses. Start with a $1,000 goal.",
                "potentialImpact": None,
                "actionItems": [
                    "Create an Emergency Fund goal",
                    "Start with $50-100 per month",
                    "Build up to 3-6 months of expenses"
                ]
            })

        # Check savings rate
        if not self.transactions.empty:
            income = self.transactions[self.transactions["type"] == "INCOME"]["amount"].sum()
            expenses = self.transactions[self.transactions["type"] == "EXPENSE"]["amount"].sum()

            if income > 0:
                savings_rate = ((income - expenses) / income) * 100
                if savings_rate < 20:
                    recommendations.append({
                        "category": "general",
                        "priority": "medium",
                        "title": "Improve Your Savings Rate",
                        "description": f"Your savings rate is {savings_rate:.0f}%. Financial experts recommend saving 20% or more.",
                        "potentialImpact": income * 0.2 - (income - expenses) if savings_rate < 20 else None,
                        "actionItems": [
                            "Review discretionary spending",
                            "Automate savings transfers",
                            "Look for ways to increase income"
                        ]
                    })

        return recommendations

    def generate_all(self) -> List[Dict[str, Any]]:
        """Generate all recommendations, sorted by priority."""
        all_recs = []

        all_recs.extend(self.generate_spending_recommendations())
        all_recs.extend(self.generate_goal_recommendations())
        all_recs.extend(self.generate_anomaly_recommendations())
        all_recs.extend(self.generate_general_recommendations())

        # Sort by priority
        priority_order = {"high": 0, "medium": 1, "low": 2}
        all_recs.sort(key=lambda x: priority_order.get(x["priority"], 3))

        return all_recs

    def get_summary(self) -> Dict[str, Any]:
        """Get recommendation summary."""
        recs = self.generate_all()

        high = sum(1 for r in recs if r["priority"] == "high")
        medium = sum(1 for r in recs if r["priority"] == "medium")
        low = sum(1 for r in recs if r["priority"] == "low")

        by_category = {}
        for r in recs:
            cat = r["category"]
            by_category[cat] = by_category.get(cat, 0) + 1

        total_impact = sum(r.get("potentialImpact", 0) or 0 for r in recs)

        return {
            "totalRecommendations": len(recs),
            "byPriority": {"high": high, "medium": medium, "low": low},
            "byCategory": by_category,
            "potentialSavings": round(total_impact, 2),
            "topPriority": recs[0] if recs else None,
        }

    def analyze(self) -> Dict[str, Any]:
        """Run full recommendation analysis."""
        return {
            "summary": self.get_summary(),
            "recommendations": self.generate_all(),
        }
