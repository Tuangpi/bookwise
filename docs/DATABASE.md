# Database

PostgreSQL + Prisma. Schema: server/prisma/schema.prisma.

Key entities: User, Business, BusinessMember, RefreshToken, Service, ServiceCategory, Staff, StaffService, WorkingHours, TimeOff, Customer, Booking, Notification, Plan, Subscription.

All business-scoped tables carry businessId + index. Migrations in server/prisma/migrations.
