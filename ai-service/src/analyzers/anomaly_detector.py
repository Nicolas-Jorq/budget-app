"""
Anomaly Detector

Detects unusual spending patterns:
- Unusually large transactions
- Unusual category spending
- Frequency anomalies
- Sudden spending spikes
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


@dataclass
class Anomaly:
    """Represents a detected anomaly."""
    transaction_id: str
    amount: float
    category: str
    date: datetime
    anomaly_type: str  # "amount", "frequency", "category", "timing"
    severity: str  # "low", "medium", "high"
    description: str
    z_score: float


class AnomalyDetector:
    """Detects anomalies in transaction data."""

    def __init__(self, transactions_df: pd.DataFrame):
        self.df = transactions_df.copy()
        self._preprocess()

    def _preprocess(self):
        """Preprocess transaction data."""
        if self.df.empty:
            return

        self.df["date"] = pd.to_datetime(self.df["date"])
        self.df["amount"] = pd.to_numeric(self.df["amount"], errors="coerce")
        self.df["day_of_week"] = self.df["date"].dt.dayofweek
        self.df["hour"] = self.df["date"].dt.hour if "time" in str(self.df["date"].dtype) else 12

        # Filter to expenses
        self.expenses = self.df[self.df["type"] == "EXPENSE"].copy()

    def detect_amount_anomalies(self, threshold: float = 2.5) -> List[Dict[str, Any]]:
        """Detect unusually large transactions using z-scores."""
        if self.expenses.empty:
            return []

        anomalies = []

        # Overall anomalies
        mean = self.expenses["amount"].mean()
        std = self.expenses["amount"].std()

        if std == 0:
            return []

        self.expenses["z_score"] = (self.expenses["amount"] - mean) / std

        # Transactions with z-score > threshold
        outliers = self.expenses[self.expenses["z_score"] > threshold]

        for _, row in outliers.iterrows():
            severity = "high" if row["z_score"] > 4 else "medium" if row["z_score"] > 3 else "low"
            anomalies.append({
                "transactionId": row["id"],
                "amount": round(float(row["amount"]), 2),
                "category": row["category"] or "Uncategorized",
                "date": row["date"].isoformat(),
                "anomalyType": "amount",
                "severity": severity,
                "description": f"Transaction ${row['amount']:,.2f} is {row['z_score']:.1f}x above your average of ${mean:,.2f}",
                "zScore": round(float(row["z_score"]), 2),
            })

        return anomalies

    def detect_category_anomalies(self, threshold: float = 2.0) -> List[Dict[str, Any]]:
        """Detect unusual spending within categories."""
        if self.expenses.empty:
            return []

        anomalies = []

        for category, group in self.expenses.groupby("category"):
            if len(group) < 5:  # Need minimum data points
                continue

            mean = group["amount"].mean()
            std = group["amount"].std()

            if std == 0:
                continue

            z_scores = (group["amount"] - mean) / std
            outliers = group[z_scores > threshold]

            for _, row in outliers.iterrows():
                z = (row["amount"] - mean) / std
                severity = "high" if z > 3 else "medium" if z > 2.5 else "low"
                anomalies.append({
                    "transactionId": row["id"],
                    "amount": round(float(row["amount"]), 2),
                    "category": category or "Uncategorized",
                    "date": row["date"].isoformat(),
                    "anomalyType": "category",
                    "severity": severity,
                    "description": f"Unusual {category} expense: ${row['amount']:,.2f} vs avg ${mean:,.2f}",
                    "zScore": round(float(z), 2),
                })

        return anomalies

    def detect_frequency_anomalies(self, window_days: int = 7) -> List[Dict[str, Any]]:
        """Detect unusual transaction frequency."""
        if self.expenses.empty:
            return []

        anomalies = []

        # Count transactions per day
        daily_counts = self.expenses.groupby(self.expenses["date"].dt.date).size()

        if len(daily_counts) < 7:
            return []

        mean_count = daily_counts.mean()
        std_count = daily_counts.std()

        if std_count == 0:
            return []

        # Find days with unusual activity
        for date, count in daily_counts.items():
            z_score = (count - mean_count) / std_count
            if z_score > 2.5:
                day_transactions = self.expenses[self.expenses["date"].dt.date == date]
                total_spent = day_transactions["amount"].sum()

                anomalies.append({
                    "transactionId": None,
                    "amount": round(float(total_spent), 2),
                    "category": "Multiple",
                    "date": datetime.combine(date, datetime.min.time()).isoformat(),
                    "anomalyType": "frequency",
                    "severity": "medium" if z_score < 3.5 else "high",
                    "description": f"Unusual activity: {int(count)} transactions on {date} (avg: {mean_count:.1f}/day)",
                    "zScore": round(float(z_score), 2),
                })

        return anomalies

    def detect_spending_spike(self, window_days: int = 7) -> List[Dict[str, Any]]:
        """Detect sudden spending spikes using rolling windows."""
        if self.expenses.empty or len(self.expenses) < 14:
            return []

        anomalies = []

        # Daily spending totals
        daily = self.expenses.groupby(self.expenses["date"].dt.date)["amount"].sum().reset_index()
        daily.columns = ["date", "total"]
        daily = daily.sort_values("date")

        if len(daily) < window_days * 2:
            return []

        # Calculate rolling average
        daily["rolling_avg"] = daily["total"].rolling(window=window_days, min_periods=3).mean()
        daily["rolling_std"] = daily["total"].rolling(window=window_days, min_periods=3).std()

        # Find spikes
        for _, row in daily.iterrows():
            if pd.isna(row["rolling_avg"]) or pd.isna(row["rolling_std"]) or row["rolling_std"] == 0:
                continue

            z_score = (row["total"] - row["rolling_avg"]) / row["rolling_std"]

            if z_score > 2.5:
                anomalies.append({
                    "transactionId": None,
                    "amount": round(float(row["total"]), 2),
                    "category": "Daily Total",
                    "date": datetime.combine(row["date"], datetime.min.time()).isoformat(),
                    "anomalyType": "spike",
                    "severity": "high" if z_score > 3.5 else "medium",
                    "description": f"Spending spike: ${row['total']:,.2f} vs {window_days}-day avg ${row['rolling_avg']:,.2f}",
                    "zScore": round(float(z_score), 2),
                })

        return anomalies

    def detect_with_isolation_forest(self, contamination: float = 0.1) -> List[Dict[str, Any]]:
        """Use Isolation Forest for advanced anomaly detection."""
        if self.expenses.empty or len(self.expenses) < 20:
            return []

        # Prepare features
        features = self.expenses[["amount", "day_of_week"]].copy()
        features = features.dropna()

        if len(features) < 20:
            return []

        # Scale features
        scaler = StandardScaler()
        X = scaler.fit_transform(features)

        # Train Isolation Forest
        clf = IsolationForest(contamination=contamination, random_state=42)
        predictions = clf.fit_predict(X)

        # Get anomaly scores
        scores = clf.decision_function(X)

        anomalies = []
        anomaly_indices = np.where(predictions == -1)[0]

        for idx in anomaly_indices:
            row = self.expenses.iloc[idx]
            score = abs(scores[idx])
            severity = "high" if score > 0.3 else "medium" if score > 0.2 else "low"

            anomalies.append({
                "transactionId": row["id"],
                "amount": round(float(row["amount"]), 2),
                "category": row["category"] or "Uncategorized",
                "date": row["date"].isoformat(),
                "anomalyType": "ml_detected",
                "severity": severity,
                "description": f"ML-detected unusual pattern in ${row['amount']:,.2f} {row['category']} transaction",
                "zScore": round(float(score * 10), 2),  # Convert to comparable scale
            })

        return anomalies

    def get_summary(self) -> Dict[str, Any]:
        """Get anomaly detection summary."""
        all_anomalies = self.detect_all()

        high = sum(1 for a in all_anomalies if a["severity"] == "high")
        medium = sum(1 for a in all_anomalies if a["severity"] == "medium")
        low = sum(1 for a in all_anomalies if a["severity"] == "low")

        by_type = {}
        for a in all_anomalies:
            t = a["anomalyType"]
            by_type[t] = by_type.get(t, 0) + 1

        return {
            "totalAnomalies": len(all_anomalies),
            "bySeverity": {"high": high, "medium": medium, "low": low},
            "byType": by_type,
            "hasHighPriority": high > 0,
        }

    def detect_all(self) -> List[Dict[str, Any]]:
        """Run all anomaly detection methods."""
        all_anomalies = []
        seen_ids = set()

        # Collect from all detectors
        for anomaly in self.detect_amount_anomalies():
            if anomaly["transactionId"] not in seen_ids:
                all_anomalies.append(anomaly)
                if anomaly["transactionId"]:
                    seen_ids.add(anomaly["transactionId"])

        for anomaly in self.detect_category_anomalies():
            if anomaly["transactionId"] not in seen_ids:
                all_anomalies.append(anomaly)
                if anomaly["transactionId"]:
                    seen_ids.add(anomaly["transactionId"])

        all_anomalies.extend(self.detect_frequency_anomalies())
        all_anomalies.extend(self.detect_spending_spike())

        # Sort by severity and z-score
        severity_order = {"high": 0, "medium": 1, "low": 2}
        all_anomalies.sort(key=lambda x: (severity_order[x["severity"]], -x["zScore"]))

        return all_anomalies

    def analyze(self) -> Dict[str, Any]:
        """Run full anomaly analysis."""
        return {
            "summary": self.get_summary(),
            "anomalies": self.detect_all()[:20],  # Limit to top 20
        }
