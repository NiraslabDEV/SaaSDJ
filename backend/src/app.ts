import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { errorHandler } from './middlewares/errorHandler';
import { env } from './config/env';

import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import contractsRoutes from './modules/contracts/contracts.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import logisticsRoutes from './modules/logistics/logistics.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// Trust Railway's reverse proxy
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
const allowedOrigins = [
  env.FRONTEND_URL,
  'https://pulso-musical-production.up.railway.app',
  'https://pulso-musical.up.railway.app',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production for now
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.', code: 'RATE_LIMITED' },
});
app.use('/api', globalLimiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', env: env.NODE_ENV }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/admin', adminRoutes);

const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use(errorHandler);

export default app;
