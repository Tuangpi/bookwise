# API

Base: /api/v1. Auth: Bearer access token.

## Auth
- POST /auth/register {businessName, ownerName, email, password, timezone?}
- POST /auth/login {email, password}
- POST /auth/refresh {refreshToken}
- POST /auth/logout {refreshToken}
- GET /auth/me

## Business
- GET /business/me
- PATCH /business/me

## Services
- GET /services
- POST /services
- PATCH /services/:id
- DELETE /services/:id

## Staff
- GET /staff
- POST /staff
- PATCH /staff/:id
- DELETE /staff/:id
