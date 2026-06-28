// src/app.ts
// Servidor principal de la API Chicken Flow

import 'dotenv/config';
import express from 'express';
import os from 'os';
import cors from 'cors';
import morgan from 'morgan';

// Rutas
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import farmsRoutes from './routes/farms.routes';
import pilotRoutes from './routes/pilot.routes';
import productionRoutes from './routes/production.routes';
import inventoryRoutes from './routes/inventory.routes';
import customersRoutes from './routes/customers.routes';
import invoicesRoutes from './routes/invoices.routes';
import paymentsRoutes from './routes/payments.routes';
import financeRoutes from './routes/finance.routes';
import reportsRoutes from './routes/reports.routes';
import usersRoutes from './routes/users.routes';
import notificationsRoutes from './routes/notifications.routes';
import adminRoutes from './routes/admin.routes';
import { initCronJobs } from './utils/cron';

// Middlewares
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { listPermissions } from './controllers/users.controller';
import { getProfile } from './controllers/auth.controller';
import { authenticate } from './middleware/auth.middleware';

const app = express();

// ─── Configuración global ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN ?? '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Ruta raíz ────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status: 'running',
    service: 'Chicken Flow API',
    version: '1.0.0',
    description: 'API Backend del sistema avícola Chicken Flow',
    environment: process.env.NODE_ENV ?? 'development',
    docs: '/api/v1',
    health: '/health',
    timestamp: new Date().toISOString(),
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'chicken-flow-api', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ─── Rutas API v1 ─────────────────────────────────────────────────────────────
const v1 = '/api/v1';

app.use(`${v1}/auth`, authRoutes);
app.use(`${v1}/dashboard`, dashboardRoutes);
app.use(`${v1}/farms`, farmsRoutes);
app.use(`${v1}/pilot`, pilotRoutes);
app.use(`${v1}/production`, productionRoutes);
app.use(`${v1}/feed-inventory`, inventoryRoutes);
app.use(`${v1}/customers`, customersRoutes);
app.use(`${v1}/invoices`, invoicesRoutes);
app.use(`${v1}/payments`, paymentsRoutes);
app.use(`${v1}/finance`, financeRoutes);
app.use(`${v1}/reports`, reportsRoutes);
app.use(`${v1}/users`, usersRoutes);
app.use(`${v1}/notifications`, notificationsRoutes);
app.use(`${v1}/admin`, adminRoutes);

// Endpoints de usuarios adicionales
app.get(`${v1}/permissions`, authenticate, listPermissions);
app.get(`${v1}/profile`, authenticate, getProfile);

// ─── Manejo de errores ───────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Inicio del servidor ──────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3000', 10);

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}

// ─── Iniciar cron jobs ──────────────────────────────────────────────────────
initCronJobs();

app.listen(PORT, () => {
  const ip = getLocalIP();
  const cyan  = '\x1b[36m';
  const green = '\x1b[32m';
  const reset = '\x1b[0m';
  const bold  = '\x1b[1m';
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║   ${bold}🐔 Chicken Flow API v1.0.0${reset}                     ║
  ║   Puerto : ${bold}${PORT}${reset}                                  ║
  ║   Entorno: ${bold}${process.env.NODE_ENV ?? 'development'}${reset}                           ║
  ║                                                  ║
  ║   ${cyan}${bold}URLs de acceso:${reset}                                ║
  ║   ${green}→ Local  ${reset}http://localhost:${PORT}                 ║
  ║   ${green}→ Red    ${reset}http://${ip}:${PORT}             ║
  ╚══════════════════════════════════════════════════╝
  `);
});

export default app;
