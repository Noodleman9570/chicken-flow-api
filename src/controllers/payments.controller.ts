// src/controllers/payments.controller.ts
// Módulo 09: Pagos y Cobros

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess, sendError, sendNotFound, sendServerError } from '../utils/response';

const pid = (id: string | string[]): string => (Array.isArray(id) ? id[0] : id);

export async function listPayments(req: Request, res: Response): Promise<void> {
  try {
    const { invoiceId, status, dateFrom, dateTo } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (invoiceId) where.invoiceId = invoiceId;
    if (dateFrom || dateTo) {
      where.paymentDate = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
        invoice: {
          select: {
            number: true,
            subtotal: true,
            status: true,
            customer: { select: { name: true } },
          },
        },
      },
    });
    sendSuccess(res, payments);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function createPayment(req: Request, res: Response): Promise<void> {
  try {
    const { invoiceId, amount, paymentMethod, paymentDate, reference, notes } = req.body as Record<string, unknown>;

    if (!invoiceId || !amount || !paymentMethod) {
      sendError(res, 'invoiceId, amount y paymentMethod son requeridos', 'VALIDATION_ERROR', 400);
      return;
    }
    if (Number(amount) <= 0) {
      sendError(res, 'El monto del pago debe ser mayor a 0', 'VALIDATION_ERROR', 400);
      return;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: String(invoiceId) },
      include: { customer: true },
    });
    if (!invoice) { sendNotFound(res, 'Factura'); return; }
    if (invoice.status === 'anulada' || invoice.status === 'pagada') {
      sendError(res, 'No se puede registrar pago en una factura anulada o ya pagada', 'BUSINESS_ERROR', 400);
      return;
    }

    const pendiente = invoice.subtotal - invoice.paidAmount;
    if (Number(amount) > pendiente + 1) { // 1 de margen por redondeo
      sendError(res, `El pago excede el saldo pendiente de $${pendiente.toLocaleString()}`, 'BUSINESS_ERROR', 400);
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: String(invoiceId),
        amount: Number(amount),
        paymentMethod: paymentMethod as 'efectivo' | 'transferencia' | 'nequi' | 'daviplata' | 'credito',
        paymentDate: paymentDate ? new Date(String(paymentDate)) : new Date(),
        reference: reference ? String(reference) : undefined,
        collectorId: req.user?.userId,
        notes: notes ? String(notes) : undefined,
      },
    });

    // Actualizar monto pagado y estado de la factura
    const nuevoPagado = invoice.paidAmount + Number(amount);
    const nuevoEstado = nuevoPagado >= invoice.subtotal ? 'pagada' : 'emitida';
    await prisma.invoice.update({
      where: { id: String(invoiceId) },
      data: { paidAmount: nuevoPagado, status: nuevoEstado },
    });

    // Actualizar saldo del cliente
    await prisma.customer.update({
      where: { id: invoice.customerId },
      data: { balanceDue: Math.max(0, invoice.customer.balanceDue - Number(amount)) },
    });

    sendSuccess(res, { payment, nuevoEstadoFactura: nuevoEstado }, 'Pago registrado', 201);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getPaymentsSummary(req: Request, res: Response): Promise<void> {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { status: { in: ['emitida', 'vencida', 'pagada'] } },
    });

    const cobrado = invoices.filter((i: { status: string }) => i.status === 'pagada').reduce((a: number, i: { subtotal: number }) => a + i.subtotal, 0);
    const pendiente = invoices
      .filter((i: { status: string }) => i.status === 'emitida' || i.status === 'vencida')
      .reduce((a: number, i: { subtotal: number; paidAmount: number }) => a + (i.subtotal - i.paidAmount), 0);
    const vencido = invoices.filter((i: { status: string }) => i.status === 'vencida').reduce((a: number, i: { subtotal: number; paidAmount: number }) => a + (i.subtotal - i.paidAmount), 0);

    const clientesConDeuda = await prisma.customer.count({ where: { balanceDue: { gt: 0 } } });

    sendSuccess(res, { cobrado, pendiente, vencido, clientesConDeuda });
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function sendPaymentReminder(req: Request, res: Response): Promise<void> {
  // Stub: En producción enviaría WhatsApp, email, etc.
  const payment = await prisma.invoice.findUnique({
    where: { id: pid(req.params.id) },
    include: { customer: { select: { name: true, phone: true } } },
  });
  if (!payment) { sendNotFound(res, 'Factura'); return; }
  sendSuccess(res, {
    message: 'Recordatorio registrado (envío de notificación disponible próximamente)',
    customer: payment.customer?.name,
    phone: payment.customer?.phone,
    amount: payment.subtotal - payment.paidAmount,
  });
}
