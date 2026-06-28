-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'operator', 'client', 'develop');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('activo', 'pendiente', 'bloqueado');

-- CreateEnum
CREATE TYPE "FarmStatus" AS ENUM ('activa', 'mantenimiento', 'inactiva');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('programado', 'activo', 'en_revision', 'finalizado', 'cancelado');

-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('iniciador', 'finalizador', 'mixto', 'preiniciador');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('bajo', 'medio', 'alto');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('suficiente', 'bajo', 'critico');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('restaurante', 'distribuidor', 'vecino', 'asadero', 'minorista');

-- CreateEnum
CREATE TYPE "CustomerReliability" AS ENUM ('alta', 'media', 'baja');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('activo', 'observacion', 'inactivo');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('borrador', 'emitida', 'pagada', 'vencida', 'anulada');

-- CreateEnum
CREATE TYPE "PaymentCondition" AS ENUM ('contado', 'credito_8_dias', 'credito_15_dias', 'credito_30_dias');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('efectivo', 'transferencia', 'nequi', 'daviplata', 'credito');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pendiente', 'abonado', 'pagado', 'vencido');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('operativo', 'financiero', 'clientes', 'produccion');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('listo', 'programado', 'pendiente');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('pdf', 'excel', 'dashboard');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'operator',
    "status" "UserStatus" NOT NULL DEFAULT 'pendiente',
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "area_m2" DOUBLE PRECISION NOT NULL,
    "zones" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "FarmStatus" NOT NULL DEFAULT 'activa',
    "next_maintenance" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_users" (
    "farm_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_responsible" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "farm_users_pkey" PRIMARY KEY ("farm_id","user_id")
);

-- CreateTable
CREATE TABLE "lots" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "zone" TEXT,
    "birds_initial" INTEGER NOT NULL,
    "birds_alive" INTEGER NOT NULL,
    "duration_days" INTEGER NOT NULL DEFAULT 42,
    "start_date" TIMESTAMP(3) NOT NULL,
    "expected_harvest_date" TIMESTAMP(3) NOT NULL,
    "status" "LotStatus" NOT NULL DEFAULT 'programado',
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'bajo',
    "price_pollito" DOUBLE PRECISION NOT NULL,
    "price_iniciador" DOUBLE PRECISION NOT NULL,
    "price_finalizador" DOUBLE PRECISION NOT NULL,
    "price_viruta" DOUBLE PRECISION NOT NULL,
    "price_vacunas" DOUBLE PRECISION NOT NULL,
    "cost_calefaccion" DOUBLE PRECISION NOT NULL,
    "cost_transporte" DOUBLE PRECISION NOT NULL,
    "cost_procesamiento" DOUBLE PRECISION NOT NULL,
    "cost_entrega" DOUBLE PRECISION NOT NULL,
    "price_sale_lb" DOUBLE PRECISION NOT NULL,
    "expected_weight_kg" DOUBLE PRECISION,
    "expected_carcass_kg" DOUBLE PRECISION,
    "observations_initial" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_records" (
    "id" TEXT NOT NULL,
    "lot_id" TEXT NOT NULL,
    "cycle_day" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "birds_alive_start" INTEGER NOT NULL,
    "dead_birds" INTEGER NOT NULL DEFAULT 0,
    "death_cause" TEXT,
    "feed_kg" DOUBLE PRECISION NOT NULL,
    "feed_type" "FeedType" NOT NULL,
    "water_changed" BOOLEAN NOT NULL DEFAULT true,
    "temperature_morning" DOUBLE PRECISION,
    "temperature_afternoon" DOUBLE PRECISION,
    "observations" TEXT,
    "operator_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_records" (
    "id" TEXT NOT NULL,
    "lot_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "start_day" INTEGER NOT NULL,
    "end_day" INTEGER NOT NULL,
    "weighing_date" DATE NOT NULL,
    "bird_1_weight_g" DOUBLE PRECISION NOT NULL,
    "bird_2_weight_g" DOUBLE PRECISION NOT NULL,
    "bird_3_weight_g" DOUBLE PRECISION NOT NULL,
    "bird_4_weight_g" DOUBLE PRECISION NOT NULL,
    "bird_5_weight_g" DOUBLE PRECISION NOT NULL,
    "avg_weight_g" DOUBLE PRECISION,
    "feed_consumed_kg" DOUBLE PRECISION NOT NULL,
    "dead_birds_week" INTEGER NOT NULL DEFAULT 0,
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_inventory" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "feed_type" "FeedType" NOT NULL,
    "brand" TEXT NOT NULL,
    "stock_kg" DOUBLE PRECISION NOT NULL,
    "reserved_kg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit_cost" DOUBLE PRECISION NOT NULL,
    "storage_location" TEXT,
    "expiration_date" DATE,
    "status" "InventoryStatus" NOT NULL DEFAULT 'suficiente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_purchases" (
    "id" TEXT NOT NULL,
    "inventory_id" TEXT NOT NULL,
    "quantity_kg" DOUBLE PRECISION NOT NULL,
    "unit_cost" DOUBLE PRECISION NOT NULL,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "purchase_date" DATE NOT NULL,
    "supplier" TEXT,
    "invoice_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "city" TEXT,
    "customer_type" "CustomerType" NOT NULL,
    "credit_limit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance_due" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reliability" "CustomerReliability" NOT NULL DEFAULT 'media',
    "status" "CustomerStatus" NOT NULL DEFAULT 'activo',
    "last_purchase_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "lot_id" TEXT,
    "issue_date" DATE NOT NULL,
    "due_date" DATE,
    "chickens_sold" INTEGER NOT NULL,
    "total_weight_lb" DOUBLE PRECISION NOT NULL,
    "price_per_lb" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'borrador',
    "payment_condition" "PaymentCondition" NOT NULL DEFAULT 'contado',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_date" DATE NOT NULL,
    "reference" TEXT,
    "collector_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_distributions" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "gross_income" DOUBLE PRECISION NOT NULL,
    "operating_costs" DOUBLE PRECISION NOT NULL,
    "salaries_and_services" DOUBLE PRECISION NOT NULL,
    "net_profit" DOUBLE PRECISION NOT NULL,
    "reinvestment_pct" DOUBLE PRECISION NOT NULL,
    "emergency_fund_pct" DOUBLE PRECISION NOT NULL,
    "dividends_pct" DOUBLE PRECISION NOT NULL,
    "founder_share_pct" DOUBLE PRECISION NOT NULL,
    "operator_share_pct" DOUBLE PRECISION NOT NULL,
    "reinvestment_amount" DOUBLE PRECISION NOT NULL,
    "emergency_fund_amount" DOUBLE PRECISION NOT NULL,
    "dividends_amount" DOUBLE PRECISION NOT NULL,
    "founder_share_amount" DOUBLE PRECISION NOT NULL,
    "operator_share_amount" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "included_lots" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "period" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'pendiente',
    "format" "ReportFormat" NOT NULL DEFAULT 'pdf',
    "owner_id" TEXT NOT NULL,
    "file_path" TEXT,
    "filters" JSONB,
    "generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "lots_code_key" ON "lots"("code");

-- CreateIndex
CREATE UNIQUE INDEX "daily_records_lot_id_cycle_day_key" ON "daily_records"("lot_id", "cycle_day");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_records_lot_id_week_number_key" ON "weekly_records"("lot_id", "week_number");

-- CreateIndex
CREATE UNIQUE INDEX "customers_document_key" ON "customers"("document");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE UNIQUE INDEX "financial_distributions_period_key" ON "financial_distributions"("period");

-- AddForeignKey
ALTER TABLE "farm_users" ADD CONSTRAINT "farm_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_users" ADD CONSTRAINT "farm_users_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_records" ADD CONSTRAINT "weekly_records_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_inventory" ADD CONSTRAINT "feed_inventory_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_purchases" ADD CONSTRAINT "feed_purchases_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "feed_inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================
-- MÓDULO 13: NOTIFICACIONES
-- ============================

-- CreateEnum
CREATE TYPE "NotificationModule" AS ENUM ('pilot', 'cycle', 'collections', 'general');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('task', 'alert', 'collection_due', 'info', 'manual');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('high', 'medium', 'low');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_by" TEXT,
    "module" "NotificationModule" NOT NULL DEFAULT 'general',
    "type" "NotificationType" NOT NULL DEFAULT 'info',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT NOT NULL DEFAULT '/dashboard',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
