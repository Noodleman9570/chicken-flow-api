// src/controllers/invoices.controller.ts
// Módulo 08: Ventas y Facturas

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import {
  sendSuccess, sendPaginated, sendError, sendNotFound, sendServerError, getPaginationParams,
} from '../utils/response';

const pid = (id: string | string[]): string => (Array.isArray(id) ? id[0] : id);

async function generateInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  return `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
}

export async function listInvoices(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const { customerId, lotId, status, dateFrom, dateTo } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (customerId) where.customerId = customerId;
    if (lotId) where.lotId = lotId;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.issueDate = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issueDate: 'desc' },
        include: {
          customer: { select: { name: true, document: true } },
          lot: { select: { code: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);
    sendPaginated(res, invoices, total, page, limit);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function createInvoice(req: Request, res: Response): Promise<void> {
  try {
    const {
      customerId, lotId, issueDate, dueDate, chickensSold,
      totalWeightLb, pricePerLb, paymentCondition = 'contado', notes,
    } = req.body as Record<string, unknown>;

    if (!customerId || !chickensSold || !totalWeightLb || !pricePerLb) {
      sendError(res, 'customerId, chickensSold, totalWeightLb y pricePerLb son requeridos', 'VALIDATION_ERROR', 400);
      return;
    }

    const customer = await prisma.customer.findUnique({ where: { id: String(customerId) } });
    if (!customer) { sendNotFound(res, 'Cliente'); return; }

    const subtotal = Number(totalWeightLb) * Number(pricePerLb);

    // Verificar límite de crédito si es crédito
    if (paymentCondition !== 'contado' && customer.balanceDue + subtotal > customer.creditLimit) {
      sendError(res, 'El cliente excede su límite de crédito', 'BUSINESS_ERROR', 400);
      return;
    }

    const number = await generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        number,
        customerId: String(customerId),
        lotId: lotId ? String(lotId) : undefined,
        issueDate: issueDate ? new Date(String(issueDate)) : new Date(),
        dueDate: dueDate ? new Date(String(dueDate)) : undefined,
        chickensSold: Number(chickensSold),
        totalWeightLb: Number(totalWeightLb),
        pricePerLb: Number(pricePerLb),
        subtotal,
        paymentCondition: paymentCondition as 'contado' | 'credito_8_dias' | 'credito_15_dias' | 'credito_30_dias',
        status: 'emitida',
        notes: notes ? String(notes) : undefined,
      },
      include: { customer: { select: { name: true } }, lot: { select: { code: true } } },
    });

    // Actualizar saldo del cliente
    if (paymentCondition !== 'contado') {
      await prisma.customer.update({
        where: { id: String(customerId) },
        data: {
          balanceDue: customer.balanceDue + subtotal,
          lastPurchaseDate: new Date(),
        },
      });
    } else {
      await prisma.customer.update({
        where: { id: String(customerId) },
        data: { lastPurchaseDate: new Date() },
      });
    }

    sendSuccess(res, invoice, 'Factura creada', 201);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function updateInvoiceStatus(req: Request, res: Response): Promise<void> {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: pid(req.params.id) } });
    if (!invoice) { sendNotFound(res, 'Factura'); return; }

    const { status } = req.body as { status: string };
    const validStatuses = ['borrador', 'emitida', 'pagada', 'vencida', 'anulada'];
    if (!validStatuses.includes(status)) {
      sendError(res, `Estado inválido. Use: ${validStatuses.join(', ')}`, 'VALIDATION_ERROR', 400);
      return;
    }

    const updated = await prisma.invoice.update({
      where: { id: pid(req.params.id) },
      data: { status: status as 'borrador' | 'emitida' | 'pagada' | 'vencida' | 'anulada' },
    });
    sendSuccess(res, updated, 'Estado de factura actualizado');
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getInvoicePdf(req: Request, res: Response): Promise<void> {
  // Stub: En producción se generaría con librería como pdfkit o puppeteer
  const invoice = await prisma.invoice.findUnique({
    where: { id: pid(req.params.id) },
    include: { customer: true, lot: { select: { code: true } } },
  });
  if (!invoice) { sendNotFound(res, 'Factura'); return; }
  sendSuccess(res, {
    message: 'Generación de PDF disponible próximamente',
    invoiceNumber: invoice.number,
    downloadUrl: `/api/v1/invoices/${invoice.id}/pdf/download`,
  });
}
