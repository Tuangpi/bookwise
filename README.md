# Bookwise

Multi-tenant SaaS for salons, clinics, barbershops, and other service-based businesses to manage appointments, staff, customers, and bookings.

## Structure

- `client/` — React + Vite + TypeScript frontend
- `server/` — Express + Node + TypeScript backend (Prisma + PostgreSQL)
- `docs/` — architecture, database, API docs

## Setup

### Database

Create Postgres DB/user (see server/.env.example). Default: bookwise/bookwise.

### Server

```
cd server
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Client

```
cd client
npm install
npm run dev
```

Client: http://localhost:5173 — Server: http://localhost:4000

## Docs

See docs/ and IMPLEMENTATION_PLAN.md.
