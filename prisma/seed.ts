// prisma/seed.ts
// Datos iniciales para desarrollo

import 'dotenv/config';
import { prisma } from '../src/config/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // 1. Crear usuario admin
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@chickenflow.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@chickenflow.com',
      passwordHash: adminHash,
      role: 'admin',
      status: 'activo',
    },
  });

  // 2. Crear usuario operador
  const opHash = await bcrypt.hash('op12345', 10);
  const operator = await prisma.user.upsert({
    where: { email: 'operador@chickenflow.com' },
    update: {},
    create: {
      name: 'Carlos Operador',
      email: 'operador@chickenflow.com',
      passwordHash: opHash,
      role: 'operator',
      status: 'activo',
    },
  });

  // 3. Crear granja
  const farm = await prisma.farm.upsert({
    where: { id: 'farm-seed-001' },
    update: {},
    create: {
      id: 'farm-seed-001',
      name: 'Granja Las Palmas',
      location: 'Quimbaya, Quindío',
      areaM2: 18,
      zones: 3,
      capacity: 144,
      status: 'activa',
      nextMaintenance: new Date('2026-07-04'),
    },
  });

  // Asignar operador como responsable de la granja
  await prisma.farmUser.upsert({
    where: { farmId_userId: { farmId: farm.id, userId: operator.id } },
    update: {},
    create: { farmId: farm.id, userId: operator.id, isResponsible: true },
  });

  // 4. Crear lote piloto
  const startDate = new Date('2026-06-13');
  const harvestDate = new Date('2026-07-25');

  const lot = await prisma.lot.upsert({
    where: { code: 'L-2026-001' },
    update: {},
    create: {
      code: 'L-2026-001',
      farmId: farm.id,
      zone: 'Zona 1',
      birdsInitial: 24,
      birdsAlive: 24,
      durationDays: 42,
      startDate,
      expectedHarvestDate: harvestDate,
      status: 'activo',
      pricePollito: 3500,
      priceIniciador: 95000,
      priceFinalizador: 90000,
      priceViruta: 15000,
      priceVacunas: 80000,
      costCalefaccion: 50000,
      costTransporte: 30000,
      costProcesamiento: 20000,
      costEntrega: 25000,
      priceSaleLb: 6500,
      expectedWeightKg: 2.5,
      expectedCarcassKg: 0.76,
      observationsInitial: 'Lote piloto inicial - datos de prueba',
      createdBy: admin.id,
    },
  });

  // 5. Crear cliente de ejemplo
  const client = await prisma.customer.upsert({
    where: { document: '12345678' },
    update: {},
    create: {
      name: 'Restaurante La Mesa',
      document: '12345678',
      phone: '3001234567',
      city: 'Armenia',
      customerType: 'restaurante',
      creditLimit: 2000000,
      reliability: 'alta',
      status: 'activo',
    },
  });

  // 6. Inventario inicial de alimento
  await prisma.feedInventory.upsert({
    where: { id: 'inv-seed-001' },
    update: {},
    create: {
      id: 'inv-seed-001',
      farmId: farm.id,
      feedType: 'iniciador',
      brand: 'Proteína Inicio 40kg',
      stockKg: 80,
      unitCost: 95000,
      storageLocation: 'Bodega Norte · Tarro A',
      status: 'suficiente',
    },
  });

  console.log(`
  ✅ Seed completado:
  → Admin:    admin@chickenflow.com / admin123
  → Operador: operador@chickenflow.com / op12345
  → Granja:   Granja Las Palmas (${farm.id})
  → Lote:     L-2026-001 (24 pollitos, activo)
  → Cliente:  Restaurante La Mesa
  `);
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
