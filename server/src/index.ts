import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './shared/middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { businessRouter } from './modules/business/business.routes';
import { serviceRouter } from './modules/service/service.routes';
import { staffRouter } from './modules/staff/staff.routes';
import { availabilityRouter } from './modules/availability/availability.routes';
import { bookingRouter } from './modules/booking/booking.routes';
import { customerRouter } from './modules/customer/customer.routes';
import { notificationRouter } from './modules/notification/notification.routes';
import { reportsRouter } from './modules/reports/reports.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/business', businessRouter);
app.use('/api/v1/services', serviceRouter);
app.use('/api/v1/staff', staffRouter);
app.use('/api/v1/availability', availabilityRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/reports', reportsRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Bookwise server running on http://localhost:${env.PORT}`);
});
