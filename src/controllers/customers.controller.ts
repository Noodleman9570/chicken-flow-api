// src/controllers/customers.controller.ts
// Módulo 07: Clientes

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import {
  sendSuccess, sendPaginated, sendError, sendNotFound, sendServerError, getPaginationParams,
} from '../utils/response';

const pid = (id: string | string[]): string => (Array.isArray(id) ? id[0] : id);

export async function listCustomers(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const { search, status, customerType } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (customerType) where.customerType = customerType;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { document: { contains: search } },
        { phone: { contains: search } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.customer.count({ where }),
    ]);
    sendPaginated(res, customers, total, page, limit);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getCustomer(req: Request, res: Response): Promise<void> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: pid(req.params.id) },
      include: {
        invoices: {
          orderBy: { issueDate: 'desc' },
          take: 10,
          include: { payments: true },
        },
      },
    });
    if (!customer) { sendNotFound(res, 'Cliente'); return; }
    sendSuccess(res, customer);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function createCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { name, document, phone, email, city, customerType, creditLimit = 0, notes } = req.body as Record<string, unknown>;

    if (!name || !customerType) {
      sendError(res, 'Nombre y tipo de cliente son requeridos', 'VALIDATION_ERROR', 400);
      return;
    }

    const customer = await prisma.customer.create({
      data: {
        name: String(name),
        document: document ? String(document) : undefined,
        phone: phone ? String(phone) : undefined,
        email: email ? String(email) : undefined,
        city: city ? String(city) : undefined,
        customerType: customerType as 'restaurante' | 'distribuidor' | 'vecino' | 'asadero' | 'minorista',
        creditLimit: Number(creditLimit),
        notes: notes ? String(notes) : undefined,
      },
    });
    sendSuccess(res, customer, 'Cliente creado', 201);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      sendError(res, 'Ya existe un cliente con ese documento', 'VALIDATION_ERROR', 409);
      return;
    }
    sendServerError(res, err);
  }
}

export async function updateCustomer(req: Request, res: Response): Promise<void> {
  try {
    const existing = await prisma.customer.findUnique({ where: { id: pid(req.params.id) } });
    if (!existing) { sendNotFound(res, 'Cliente'); return; }

    const { name, phone, email, city, status, creditLimit, reliability, notes } = req.body;

    const customer = await prisma.customer.update({
      where: { id: pid(req.params.id) },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(city !== undefined && { city }),
        ...(status && { status }),
        ...(creditLimit !== undefined && { creditLimit: Number(creditLimit) }),
        ...(reliability && { reliability }),
        ...(notes !== undefined && { notes }),
      },
    });
    sendSuccess(res, customer, 'Cliente actualizado');
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getCustomerOptions(req: Request, res: Response): Promise<void> {
  try {
    const customers = await prisma.customer.findMany({
      where: { status: 'activo' },
      select: { id: true, name: true, document: true, customerType: true, balanceDue: true, creditLimit: true },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, customers);
  } catch (err) {
    sendServerError(res, err);
  }
}

export async function getCustomerStatement(req: Request, res: Response): Promise<void> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: pid(req.params.id) },
      include: {
        invoices: {
          include: { payments: true },
          orderBy: { issueDate: 'desc' },
        },
      },
    });
    if (!customer) { sendNotFound(res, 'Cliente'); return; }

    const totalFacturado = customer.invoices.reduce((a: number, inv: { subtotal: number }) => a + inv.subtotal, 0);
    const totalPagado = customer.invoices.reduce((a: number, inv: { paidAmount: number }) => a + inv.paidAmount, 0);
    const totalPendiente = totalFacturado - totalPagado;

    sendSuccess(res, {
      cliente: { id: customer.id, name: customer.name, document: customer.document },
      resumen: {
        totalFacturado,
        totalPagado,
        totalPendiente,
        creditLimit: customer.creditLimit,
        cupoDisponible: customer.creditLimit - totalPendiente,
      },
      facturas: customer.invoices,
    });
  } catch (err) {
    sendServerError(res, err);
  }
}
