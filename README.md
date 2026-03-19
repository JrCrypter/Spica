# SpicaPay Unified SaaS v2

Upgraded full-stack starter that combines:
- AI Collections
- Payment orchestration
- WhatsApp conversion layer
- Utility bill payments
- Mobile/DTH recharges

## New in v2
- bill payment APIs
- recharge APIs
- utility transactions table
- provider simulation layer
- frontend tabs for invoices, bills, and recharge flows

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Payments: Stripe Checkout starter
- Messaging: Meta WhatsApp Cloud API starter
- Utility rails: provider simulation layer designed to swap for BBPS / recharge partners

## Structure
- apps/web -> frontend
- apps/api -> backend
- db/schema.sql -> PostgreSQL schema
- docker-compose.yml -> local Postgres

## Quick start
npm install
docker compose up -d
psql postgresql://postgres:postgres@localhost:5432/spicapay -f db/schema.sql
npm run dev

Web: http://localhost:5173
API: http://localhost:4000

## Production note
For real launch, replace the simulated utility provider with a real BBPS / recharge integration and add auth, queues, retries, RBAC, and audit logs.
