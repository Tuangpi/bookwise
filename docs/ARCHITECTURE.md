# Architecture

Modular monolith. Two apps: `client/` (React+Vite+TS) and `server/` (Express+Node+TS).

## Server modules

`src/modules/*`: auth, business, service, staff. Each has schema (Zod), service, controller, routes.
Shared: `src/shared` (db, middleware, errors, utils).

## Multi-tenancy

`businessId` resolved from JWT (access token claim) and injected into `req.businessId` by auth middleware. All business-scoped queries filter by businessId. Tenant isolation enforced server-side.

## Auth

JWT access (15m) + refresh (7d, rotated, stored in DB, revocable). Roles: PLATFORM_ADMIN, BUSINESS_OWNER, STAFF, CUSTOMER.
