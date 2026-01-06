"""
Spending Patterns Analyzer

Analyzes transaction history to identify:
- Spending trends by category
- Weekly/monthly patterns
- Category distribution
- Spending velocity changes
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class SpendingPattern:
    """Represents a detected spending pattern."""
    category: str
    pattern_type: str  # "increasing", "decreasing", "stable", "irregular"
    avg_amount: float
    trend_percentage: float  # % change over period
    frequency: str  # "daily", "weekly", "monthly", "occasional"
    confidence: float  # 0-1


@dataclass
class CategoryBreakdown:
    """Category spending breakdown."""
    category: str
    total: float
    percentage: float
    transaction_count: int
    avg_transaction: float


class SpendingPatternAnalyzer:
    """Analyzes spending patterns from transaction data."""

    def __init__(self, transactions_df: pd.DataFrame):
        self.df = transactions_df.copy()
        self._preprocess()

    def _preprocess(self):
        """Preprocess the transaction data."""
        if self.df.empty:
            return

        # Ensure date is datetime
        self.df["date"] = pd.to_datetime(self.df["date"])

        # Add time-based features
        self.df["week"] = self.df["date"].dt.isocalendar().week
        self.df["month"] = self.df["date"].dt.month
        self.df["year"] = self.df["date"].dt.year
        self.df["day_of_week"] = self.df["date"].dt.dayofweek
        self.df["is_weekend"] = self.df["day_of_week"].isin([5, 6])

        # Filter to expenses only for spending analysis
        self.expenses = self.df[self.df["type"] == "EXPENSE"].copy()
        self.income = self.df[self.df["type"] == "INCOME"].copy()

    def get_category_breakdown(self, months: int = 3) -> List[Dict[str, Any]]:
        """Get spending breakdown by category."""
        if self.expenses.empty:
            return []

        cutoff_date = datetime.now() - timedelta(days=months * 30)
        recent = self.expenses[self.expenses["date"] >= cutoff_date]

        if recent.empty:
            return []

        total_spending = recent["amount"].sum()

        breakdown = []
        for category, group in recent.groupby("category"):
            cat_total = group["amount"].sum()
            breakdown.append({
                "category": category or "Uncategorized",
                "total": round(float(cat_total), 2),
                "percentage": round(float(cat_total / total_spending * 100), 1) if total_spending > 0 else 0,
                "transactionCount": len(group),
                "avgTransaction": round(float(group["amount"].mean()), 2),
            })

        # Sort by total descending
        breakdown.sort(key=lambda x: x["total"], reverse=True)
        return breakdown

    def get_monthly_trend(self, months: int = 6) -> List[Dict[str, Any]]:
        """Get monthly spending trend."""
        if self.expenses.empty:
            return []

        # Group by year-month
        self.expenses["year_month"] = self.expenses["date"].dt.to_period("M")
        monthly = self.expenses.groupby("year_month").agg({
            "amount": "sum",
            "id": "count"
        }).reset_index()

        monthly.columns = ["period", "total", "count"]
        monthly = monthly.tail(months)

        trend = []
        for _, row in monthly.iterrows():
            trend.append({
                "month": str(row["period"]),
                "total": round(float(row["total"]), 2),
                "transactionCount": int(row["count"]),
            })

        return trend

    def get_weekly_pattern(self) -> Dict[str, Any]:
        """Analyze spending by day of week."""
        if self.expenses.empty:
            return {"days": [], "peakDay": None, "quietestDay": None}

        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        daily = self.expenses.groupby("day_of_week")["amount"].agg(["sum", "mean", "count"])
        daily = daily.reindex(range(7), fill_value=0)

        days = []
        for i, row in daily.iterrows():
            days.append({
                "day": day_names[i],
                "total": round(float(row["sum"]), 2),
                "average": round(float(row["mean"]), 2) if row["mean"] > 0 else 0,
                "count": int(row["count"]),
            })

        # Find peak and quietest days
        if daily["sum"].sum() > 0:
            peak_idx = daily["sum"].idxmax()
            quiet_idx = daily["sum"].idxmin()
            peak_day = day_names[peak_idx]
            quietest_day = day_names[quiet_idx]
        else:
            peak_day = None
            quietest_day = None

        return {
            "days": days,
            "peakDay": peak_day,
            "quietestDay": quietest_day,
            "weekendVsWeekday": self._weekend_vs_weekday(),
        }

    def _weekend_vs_weekday(self) -> Dict[str, float]:
        """Compare weekend vs weekday spending."""
        if self.expenses.empty:
            return {"weekend": 0, "weekday": 0, "ratio": 0}

        weekend = self.expenses[self.expenses["is_weekend"]]["amount"].mean() or 0
        weekday = self.expenses[~self.expenses["is_weekend"]]["amount"].mean() or 0

        ratio = weekend / weekday if weekday > 0 else 0

        return {
            "weekendAvg": round(float(weekend), 2),
            "weekdayAvg": round(float(weekday), 2),
            "ratio": round(float(ratio), 2),
        }

    def detect_trends(self, months: int = 3) -> List[Dict[str, Any]]:
        """Detect spending trends by category."""
        if self.expenses.empty:
            return []

        cutoff = datetime.now() - timedelta(days=months * 30)
        recent = self.expenses[self.expenses["date"] >= cutoff]

        if recent.empty:
            return []

        trends = []
        for category, group in recent.groupby("category"):
            if len(group) < 3:
                continue

            # Calculate trend using linear regression
            group = group.sort_values("date")
            x = np.arange(len(group))
            y = group["amount"].values

            if len(x) > 1:
                slope, _ = np.polyfit(x, y, 1)
                avg = y.mean()
                trend_pct = (slope * len(x)) / avg * 100 if avg > 0 else 0

                if abs(trend_pct) < 10:
                    pattern_type = "stable"
                elif trend_pct > 0:
                    pattern_type = "increasing"
                else:
                    pattern_type = "decreasing"

                trends.append({
                    "category": category or "Uncategorized",
                    "patternType": pattern_type,
                    "avgAmount": round(float(avg), 2),
                    "trendPercentage": round(float(trend_pct), 1),
                    "transactionCount": len(group),
                })

        # Sort by absolute trend percentage
        trends.sort(key=lambda x: abs(x["trendPercentage"]), reverse=True)
        return trends

    def get_summary(self) -> Dict[str, Any]:
        """Get overall spending summary."""
        if self.expenses.empty:
            return {
                "totalSpending": 0,
                "avgMonthlySpending": 0,
                "topCategory": None,
                "transactionCount": 0,
                "dateRange": None,
            }

        total = self.expenses["amount"].sum()
        date_range = (self.expenses["date"].max() - self.expenses["date"].min()).days
        months = max(date_range / 30, 1)

        top_category = self.expenses.groupby("category")["amount"].sum().idxmax() if not self.expenses.empty else None

        return {
            "totalSpending": round(float(total), 2),
            "avgMonthlySpending": round(float(total / months), 2),
            "topCategory": top_category or "Uncategorized",
            "transactionCount": len(self.expenses),
            "dateRange": {
                "start": self.expenses["date"].min().isoformat() if not self.expenses.empty else None,
                "end": self.expenses["date"].max().isoformat() if not self.expenses.empty else None,
                "days": int(date_range),
            },
        }

    def analyze(self) -> Dict[str, Any]:
        """Run full spending analysis."""
        return {
            "summary": self.get_summary(),
            "categoryBreakdown": self.get_category_breakdown(),
            "monthlyTrend": self.get_monthly_trend(),
            "weeklyPattern": self.get_weekly_pattern(),
            "trends": self.detect_trends(),
        }
