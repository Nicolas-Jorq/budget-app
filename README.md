# Budget App

A full-stack budget tracking application built with React, Express, TypeScript, and PostgreSQL. Features AI-powered bank statement processing, savings goals with house-hunting tools, and comprehensive financial analytics.

## Features

### Core Features
- User authentication (register/login with JWT)
- Dashboard with spending overview and statistics
- Budget management (create, edit, delete budgets)
- Transaction tracking (income and expenses)
- Link transactions to budgets for automatic spending updates

### Savings Goals
- Create savings goals with target amounts and deadlines
- Track progress with visual indicators
- Automatic savings rate calculations
- Support for different goal types (Emergency Fund, Vacation, House, Baby, Custom)

### House Savings
- Property search with real estate API integration
- Home valuation lookup
- Mortgage calculator with payment breakdowns
- Save and compare properties
- Provider abstraction (SimplyRETS, RapidAPI Zillow, Mock)

### Bank Statement Import (AI-Powered)
- Upload PDF bank statements
- AI-powered transaction extraction using LLM
- Support for multiple bank accounts
- Transaction review and approval workflow
- Duplicate detection
- Privacy-focused with local LLM option (Ollama)
- Provider abstraction (Ollama, OpenAI, Mock)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript |
| AI Service | Python, FastAPI, pdfplumber |
| Database | PostgreSQL with Prisma ORM |
| Auth | JWT (JSON Web Tokens) |

## Project Structure

```
budget-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context (auth)
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript types
│   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── providers/      # External API providers
│   │   ├── middleware/     # Auth middleware
│   │   └── lib/            # Prisma client
│   └── ...
├── ai-service/             # Python AI service
│   ├── src/
│   │   ├── providers/      # LLM providers (Ollama, OpenAI)
│   │   ├── extractors/     # PDF parsing & extraction
│   │   └── routes/         # FastAPI endpoints
│   └── ...
├── prisma/                 # Database schema
│   └── schema.prisma
└── .env.example            # Environment template
```

## Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Python** (v3.9 or higher) - For AI service
- **npm** (comes with Node.js)

## Getting Started

### 1. Clone and Install

```bash
# Navigate to the project
cd budget-app

# Install Node.js dependencies
npm install

# Set up Python AI service
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 2. Set Up PostgreSQL Database

#### Option A: Using Homebrew (macOS)

```bash
# Install PostgreSQL
brew install postgresql@15

# Start the service
brew services start postgresql@15

# Create the database
createdb budget_app
```

#### Option B: Using Docker

```bash
docker run --name budget-postgres \
  -e POSTGRES_USER=budget_user \
  -e POSTGRES_PASSWORD=budget_pass \
  -e POSTGRES_DB=budget_app \
  -p 5432:5432 \
  -d postgres:16
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Database
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/budget_app?schema=public"

# JWT Secret (change this in production!)
JWT_SECRET="your-secret-key-here"

# AI Service
AI_SERVICE_URL="http://localhost:8000"

# LLM Provider: ollama, openai, or mock
LLM_PROVIDER=mock

# For Ollama (local, free, private)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# For OpenAI (cloud)
# OPENAI_API_KEY=sk-your-key-here

# Real Estate Provider: simplyrets, rapidapi_zillow, or mock
REAL_ESTATE_PROVIDER=simplyrets
```

### 4. Set Up the Database

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate
```

### 5. Start the Application

```bash
# Terminal 1: Start Node.js server and React client
npm run dev

# Terminal 2: Start Python AI service
cd ai-service
source venv/bin/activate
python -m uvicorn src.main:app --reload --port 8000
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **AI Service**: http://localhost:8000

## Setting Up AI Providers

### Option 1: Mock Provider (Default, No Setup)
Uses fake data for testing. No API keys needed.

```env
LLM_PROVIDER=mock
```

### Option 2: Ollama (Recommended for Privacy)
Runs entirely on your machine - free and private.

```bash
# Install Ollama
brew install ollama

# Start Ollama service
ollama serve

# Pull a model (in new terminal)
ollama pull llama3.2
```

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### Option 3: OpenAI (Cloud)
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

## Usage

1. Open http://localhost:5173 in your browser
2. Click "Sign up" to create a new account
3. After registering, you'll be taken to the Dashboard
4. Use the sidebar to navigate:
   - **Dashboard** - View spending overview
   - **Budgets** - Create and manage budgets
   - **Transactions** - Track income and expenses
   - **Savings Goals** - Set and track savings goals
   - **Bank Statements** - Import transactions from PDF statements

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in development mode |
| `npm run dev:client` | Start only the frontend |
| `npm run dev:server` | Start only the backend |
| `npm run build` | Build both client and server for production |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Budgets & Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | List all budgets |
| POST | `/api/budgets` | Create a budget |
| PUT | `/api/budgets/:id` | Update a budget |
| DELETE | `/api/budgets/:id` | Delete a budget |
| GET | `/api/transactions` | List all transactions |
| POST | `/api/transactions` | Create a transaction |
| PUT | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |

### Savings Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | List all savings goals |
| POST | `/api/goals` | Create a savings goal |
| PUT | `/api/goals/:id` | Update a goal |
| DELETE | `/api/goals/:id` | Delete a goal |
| POST | `/api/goals/:id/contributions` | Add contribution |

### Bank Statements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bank-accounts` | List bank accounts |
| POST | `/api/bank-accounts` | Add bank account |
| GET | `/api/documents` | List uploaded documents |
| POST | `/api/documents/upload` | Upload PDF statement |
| POST | `/api/documents/:id/process` | Process with AI |
| GET | `/api/documents/:id` | Get document details |
| POST | `/api/documents/:id/import` | Import approved transactions |

### House Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/house/search` | Search properties |
| GET | `/api/house/property/:id` | Get property details |
| GET | `/api/house/valuation` | Get home valuation |
| POST | `/api/house/mortgage/calculate` | Calculate mortgage |

## Troubleshooting

### Database connection error

Make sure PostgreSQL is running:
```bash
# Homebrew
brew services list | grep postgres

# Docker
docker ps | grep postgres
```

### Port already in use

If port 5173 or 3001 is in use, you can:
- Kill the process using the port
- Or modify the ports in `client/vite.config.ts` and `server/src/config/index.ts`

### Prisma errors

Try regenerating the client:
```bash
npm run db:generate
npm run db:push
```

### AI Service not working

1. Check if the AI service is running: `curl http://localhost:8000/health`
2. Check provider availability: `curl http://localhost:8000/api/documents/providers`
3. For Ollama: ensure `ollama serve` is running

## License

MIT
