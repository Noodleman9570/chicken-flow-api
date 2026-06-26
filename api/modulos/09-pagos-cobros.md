# 09 - Pagos y cobros

## Objetivo
Registrar pagos de clientes, abonos, saldos pendientes, vencimientos y gestión de cobranza.

## Vistas frontend
- `/dashboard/payments`
- `/dashboard/clients`
- `/dashboard/invoices`

## Entidad principal
```ts
interface PaymentCollection {
  id: string
  invoiceNumber: string
  customerName: string
  expectedDate: string
  paymentMethod: 'efectivo' | 'transferencia' | 'nequi' | 'daviplata' | 'credito'
  amount: number
  paidAmount: number
  pendingAmount: number
  status: 'pendiente' | 'abonado' | 'pagado' | 'vencido'
  collector: string
}
```

## GET /api/v1/payments
Lista pagos y cobros.

## POST /api/v1/payments
Registra pago o abono.

### Body
```json
{
  "invoiceId": "inv-001",
  "amount": 200000,
  "paymentMethod": "transferencia",
  "paymentDate": "2026-06-13",
  "reference": "TRX-88912"
}
```

## GET /api/v1/payments/summary
Resumen: cobrado, pendiente, vencido, clientes con deuda.

## POST /api/v1/payments/:id/reminder
Genera recordatorio de cobro.
