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
- GET /staff/:id/hours
- PUT /staff/:id/hours

## Business opening hours
- GET /business/me/hours
- PUT /business/me/hours

### Hours request body (PUT)
Replace the full weekly schedule in one transaction. `breaks` are optional and must fall within `[startTime, endTime]`.

```json
{
  "hours": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00", "breaks": [{ "start": "12:00", "end": "13:00" }] },
    { "dayOfWeek": 2, "startTime": "09:00", "endTime": "17:00" }
  ]
}
```
- `dayOfWeek`: 0 (Sun) – 6 (Sat), must be unique within the request
- `startTime`/`endTime`: `HH:MM`, `endTime` after `startTime`
- Omitting a day means closed that day
