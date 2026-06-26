// src/app.ts
// Servidor principal de la API Chicken Flow

import 'dotenv/config';
import express from 'express';
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

// Endpoints de usuarios adicionales
app.get(`${v1}/permissions`, authenticate, listPermissions);
app.get(`${v1}/profile`, authenticate, getProfile);

// ─── Manejo de errores ───────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Inicio del servidor ──────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║     🐔 Chicken Flow API v1.0.0               ║
  ║     Puerto: ${PORT}                               ║
  ║     Entorno: ${process.env.NODE_ENV ?? 'development'}                 ║
  ╚══════════════════════════════════════════════╝
  
  Endpoints disponibles:
  → GET  /health
  → POST /api/v1/auth/login
  → POST /api/v1/auth/register
  → GET  /api/v1/dashboard/summary
  → ...y muchos más. Ver README.md para la lista completa.
  `);
});

export default app;
