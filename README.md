# Budget App

A full-stack personal finance application built with React, Express, TypeScript, and PostgreSQL. Features AI-powered bank statement processing, savings goals with house-hunting tools, recurring transactions, and a sleek dark theme.

## Features

### Core Features
- **User authentication** - Register/login with JWT tokens
- **Dashboard** - Spending overview, statistics, and visual charts
- **Budget management** - Create, edit, delete budgets by category
- **Transaction tracking** - Track income and expenses with category assignment
- **User-configurable categories** - Customize expense and income categories
- **Recurring transactions** - Schedule bills and income (daily, weekly, monthly, etc.)
- **Dark theme** - Batman-inspired dark UI with gold accents

### Savings Goals
- Create savings goals with target amounts and deadlines
- Track progress with visual indicators
- Automatic savings rate calculations
- Support for different goal types:
  - **Emergency Fund** - Standard savings tracking
  - **Vacation** - Travel planning
  - **House** - Property search integration
  - **Baby** - Milestone tracking with projections
  - **Custom** - Flexible goal configuration

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
│   │   │   ├── Layout.tsx          # Main layout with sidebar
│   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   ├── Navbar.tsx          # Top navigation bar
│   │   │   ├── TransactionForm.tsx # Transaction create/edit
│   │   │   ├── BudgetForm.tsx      # Budget create/edit
│   │   │   ├── CategoryForm.tsx    # Category create/edit
│   │   │   ├── RecurringTransactionForm.tsx
│   │   │   └── ...
│   │   ├── pages/          # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Budgets.tsx
│   │   │   ├── Categories.tsx
│   │   │   ├── Transactions.tsx
│   │   │   ├── RecurringTransactions.tsx
│   │   │   ├── Goals.tsx
│   │   │   ├── BankStatements.tsx
│   │   │   └── ...
│   │   ├── hooks/          # Custom React hooks
│   │   │   └── useCategories.ts
│   │   ├── context/        # React context (auth, theme)
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
│   ├── schema.prisma
│   └── migrations/
└── .env.example            # Environment template
```

## Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Python** (v3.9 or higher) - For AI service (optional)
- **npm** (comes with Node.js)

## Getting Started

### 1. Clone and Install

```bash
# Navigate to the project
cd budget-app

# Install Node.js dependencies
npm install
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
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
CLIENT_URL="http://localhost:5173"

# AI Service (optional - for bank statement import)
AI_SERVICE_URL="http://localhost:8000"

# LLM Provider: ollama, openai, or mock
LLM_PROVIDER=mock

# For Ollama (local, free, private)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# For OpenAI (cloud)
# OPENAI_API_KEY=sk-your-key-here

# Real Estate Provider: simplyrets, rapidapi_zillow, or mock
REAL_ESTATE_PROVIDER=mock
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
# Start both client and server
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

### 6. (Optional) Set Up AI Service

Only needed for bank statement import feature:

```bash
# Set up Python AI service
cd ai-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start the AI service
python -m uvicorn src.main:app --reload --port 8000
```

**AI Service**: http://localhost:8000

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
   - **Dashboard** - View spending overview and charts
   - **Budgets** - Create and manage spending limits
   - **Categories** - Customize expense and income categories
   - **Transactions** - Track income and expenses
   - **Recurring** - Set up recurring bills and income
   - **Savings Goals** - Set and track savings targets
   - **Statements** - Import transactions from PDF statements

### Setting Up Categories
Categories are automatically seeded with defaults when you first access them. To customize:
1. Navigate to **Categories** in the sidebar
2. Add new categories with custom names and colors
3. Edit or delete existing categories
4. Use "Reset to Defaults" to restore original categories

### Setting Up Recurring Transactions
1. Navigate to **Recurring** in the sidebar
2. Click "Add Recurring"
3. Set the frequency (daily, weekly, monthly, etc.)
4. Choose the day of week/month for scheduling
5. Optionally link to a budget

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

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | List all budgets |
| POST | `/api/budgets` | Create a budget |
| PUT | `/api/budgets/:id` | Update a budget |
| DELETE | `/api/budgets/:id` | Delete a budget |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| GET | `/api/categories?type=expense` | List expense categories |
| GET | `/api/categories?type=income` | List income categories |
| POST | `/api/categories` | Create a category |
| PUT | `/api/categories/:id` | Update a category |
| DELETE | `/api/categories/:id` | Delete a category |
| POST | `/api/categories/reset` | Reset to defaults |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List all transactions |
| POST | `/api/transactions` | Create a transaction |
| PUT | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |

### Recurring Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recurring` | List recurring transactions |
| POST | `/api/recurring` | Create recurring transaction |
| PUT | `/api/recurring/:id` | Update recurring transaction |
| DELETE | `/api/recurring/:id` | Delete recurring transaction |
| POST | `/api/recurring/process` | Process due transactions |
| GET | `/api/recurring/upcoming` | Get upcoming transactions |

### Savings Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | List all savings goals |
| POST | `/api/goals` | Create a savings goal |
| PUT | `/api/goals/:id` | Update a goal |
| DELETE | `/api/goals/:id` | Delete a goal |
| POST | `/api/goals/:id/contributions` | Add contribution |
| GET | `/api/goals/summary` | Get goals summary |

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

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics |
| GET | `/api/dashboard/charts` | Get chart data |

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

If port 5173 or 3001 is in use:
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Prisma errors

Try regenerating the client:
```bash
npm run db:generate
npm run db:push
```

### Categories not loading

Categories are auto-seeded on first access. If issues persist:
1. Check server logs for errors
2. Verify database connection
3. Try resetting categories via the UI or API

### AI Service not working

1. Check if the AI service is running: `curl http://localhost:8000/health`
2. Check provider availability: `curl http://localhost:8000/api/documents/providers`
3. For Ollama: ensure `ollama serve` is running

## Database Schema

Key models:
- **User** - Authentication and user data
- **Budget** - Spending limits by category
- **Category** - User-configurable expense/income categories
- **Transaction** - Income and expense records
- **RecurringTransaction** - Scheduled recurring transactions
- **SavingsGoal** - Savings targets with contributions
- **BankAccount** - Connected bank accounts
- **BankDocument** - Uploaded PDF statements

## License

MIT
