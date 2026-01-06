# Budget App

A full-stack budget tracking application built with React, Express, TypeScript, and PostgreSQL.

## Features

- User authentication (register/login with JWT)
- Dashboard with spending overview and statistics
- Budget management (create, edit, delete budgets)
- Transaction tracking (income and expenses)
- Link transactions to budgets for automatic spending updates
- Responsive UI with Tailwind CSS

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript |
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
│   │   ├── middleware/     # Auth middleware
│   │   └── lib/            # Prisma client
│   └── ...
├── prisma/                 # Database schema
│   └── schema.prisma
└── ai-service/             # Python AI (placeholder)
```

## Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

## Getting Started

### 1. Clone and Install

```bash
# Navigate to the project
cd budget-app

# Install all dependencies
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

Edit `.env` with your database credentials:

```env
# For local PostgreSQL (Homebrew)
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/budget_app?schema=public"

# For Docker
DATABASE_URL="postgresql://budget_user:budget_pass@localhost:5432/budget_app?schema=public"

# JWT Secret (change this in production!)
JWT_SECRET="your-secret-key-here"
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
# Run both frontend and backend
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## Usage

1. Open http://localhost:5173 in your browser
2. Click "Sign up" to create a new account
3. After registering, you'll be taken to the Dashboard
4. Use the sidebar to navigate:
   - **Dashboard** - View spending overview
   - **Budgets** - Create and manage budgets
   - **Transactions** - Track income and expenses

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/budgets` | List all budgets |
| POST | `/api/budgets` | Create a budget |
| PUT | `/api/budgets/:id` | Update a budget |
| DELETE | `/api/budgets/:id` | Delete a budget |
| GET | `/api/transactions` | List all transactions |
| POST | `/api/transactions` | Create a transaction |
| PUT | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |
| GET | `/api/dashboard/stats` | Get dashboard statistics |

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

## License

MIT
