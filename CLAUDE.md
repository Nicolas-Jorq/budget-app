# Budget App

A full-stack budget tracking application built with React, Express, and PostgreSQL.

## Project Structure

```
budget-app/
├── package.json          # Root workspace config
├── .env.example          # Environment template
├── prisma/               # Database schema
│   └── schema.prisma
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API client
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   └── ...config files
├── server/               # Express backend
│   ├── src/
│   │   ├── config/       # App configuration
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   └── ...config files
└── ai-service/           # Python AI (placeholder)
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your database URL and JWT secret

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate
```

### Development

```bash
# Run both client and server
npm run dev

# Run client only
npm run dev:client

# Run server only
npm run dev:server
```

### Database Commands

```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:push        # Push schema changes
npm run db:studio      # Open Prisma Studio
```

## API Endpoints

Base URL: `http://localhost:3001/api`

| Endpoint | Description |
|----------|-------------|
| `/auth` | Authentication (login, register) |
| `/users` | User management |
| `/budgets` | Budget CRUD operations |
| `/transactions` | Transaction CRUD operations |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `JWT_EXPIRES_IN` | Token expiration (e.g., "7d") |
| `PORT` | Server port (default: 3001) |
| `CLIENT_URL` | Frontend URL for CORS |

## Development Notes

- Client runs on port 5173 (Vite default)
- Server runs on port 3001
- API requests from client are proxied to server
- JWT tokens stored in localStorage
