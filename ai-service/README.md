# AI Service - Financial Analytics Engine

ML-powered financial analytics for the Budget App.

## Features

### Analyzers

1. **Spending Patterns** (`/api/analytics/spending-patterns/{user_id}`)
   - Category breakdown with percentages
   - Monthly spending trends
   - Day-of-week patterns
   - Weekend vs weekday comparison
   - Trend detection (increasing/decreasing)

2. **Goal Predictor** (`/api/analytics/goal-predictions/{user_id}`)
   - Predicted completion dates
   - On-track status
   - Savings velocity calculation
   - Required monthly savings
   - Personalized recommendations

3. **Anomaly Detector** (`/api/analytics/anomalies/{user_id}`)
   - Unusual transaction amounts (z-score)
   - Category-specific anomalies
   - Frequency anomalies
   - Spending spikes
   - ML-based detection (Isolation Forest)

4. **Recommendations** (`/api/analytics/recommendations/{user_id}`)
   - Spending reduction opportunities
   - Goal progress advice
   - Emergency fund guidance
   - Savings rate improvement
   - Prioritized action items

5. **Full Analysis** (`/api/analytics/full-analysis/{user_id}`)
   - Combines all analyzers
   - Comprehensive financial health check

## Setup

```bash
cd ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (uses same DATABASE_URL as main app)
cp ../.env .env
```

## Running

```bash
# Development
uvicorn src.main:app --reload --port 8000

# Production
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/health/ready` | GET | Readiness check |
| `/api/analytics/spending-patterns/{user_id}` | GET | Spending analysis |
| `/api/analytics/goal-predictions/{user_id}` | GET | Goal predictions |
| `/api/analytics/anomalies/{user_id}` | GET | Anomaly detection |
| `/api/analytics/recommendations/{user_id}` | GET | Recommendations |
| `/api/analytics/full-analysis/{user_id}` | GET | Full analysis |

## Architecture

```
ai-service/
├── src/
│   ├── main.py              # FastAPI app
│   ├── analyzers/           # ML analyzers
│   │   ├── spending_patterns.py
│   │   ├── goal_predictor.py
│   │   ├── anomaly_detector.py
│   │   └── recommendations.py
│   ├── routes/              # API routes
│   │   ├── analytics.py
│   │   └── health.py
│   ├── services/            # Business logic
│   │   └── database.py
│   └── models/              # Pydantic models
└── requirements.txt
```

## Integration with Node.js Backend

The AI service can be called from the Node.js backend:

```typescript
// server/src/services/analytics.ts
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

export async function getSpendingPatterns(userId: string) {
  const response = await fetch(`${AI_SERVICE_URL}/api/analytics/spending-patterns/${userId}`)
  return response.json()
}
```

## Tech Stack

- **FastAPI** - Modern Python web framework
- **pandas** - Data manipulation
- **scikit-learn** - ML algorithms
- **SQLAlchemy** - Async database access
- **asyncpg** - PostgreSQL driver
