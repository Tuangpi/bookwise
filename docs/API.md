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

## Reports

All reports endpoints require a business context (authenticated owner/staff of the business) and support optional `start`/`end` query parameters (`YYYY-MM-DD`). When omitted, the range defaults to the last 30 days in the business timezone. All business-scoped queries filter by `businessId`.

### GET /api/v1/reports/summary
Key performance indicators for the business.

Response: `{ success: true, data: { totalBookings, totalRevenue, confirmedCount, completedCount, cancelledCount, noShowCount, pendingCount, completionRate, averageRevenuePerBooking, period: { start, end } } }`

`totalRevenue` is the sum of booking prices for `CONFIRMED` and `COMPLETED` bookings.

### GET /api/v1/reports/revenue
Daily revenue and booking time series for the range (includes zero-value days).

Response: `{ success: true, data: { series: [{ date, revenue, bookings }], totalRevenue } }`

### GET /api/v1/reports/staff
Per-staff booking and utilization metrics.

Response: `{ success: true, data: [{ staffId, staffName, active, bookingsCount, revenue, bookedMinutes, workingMinutes, utilizationPercent }] }`

`utilizationPercent` = booked minutes ÷ working minutes (from staff working hours, falling back to business opening hours), capped at 100%.

### GET /api/v1/reports/status
Booking count and booked revenue by status.

Response: `{ success: true, data: [{ status, count, revenue }] }` (one entry per `BookingStatus`)

### GET /api/v1/reports/services
Most booked services in the range.

Response: `{ success: true, data: [{ serviceId, name, bookings, revenue, totalDurationMin }] }`

## Availability
- GET /api/v1/availability
  - Returns available time slots for a service on a given date
  - Query parameters:
    - `serviceId` (required): The service ID
    - `date` (required): Date in YYYY-MM-DD format
    - `staffId` (optional): Filter by specific staff member
  - Response: `{ success: true, data: { date, serviceId, serviceName, durationMin, staff: [{ staffId, staffName, slots: [{ startAt, endAt }] }] } }`
