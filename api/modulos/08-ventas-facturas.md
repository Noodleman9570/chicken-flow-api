# 08 - Ventas y facturas

## Objetivo
Registrar ventas por lote, facturas, peso vendido, precio por libra, estado de pago y documentos asociados.

## Vista frontend
- `/dashboard/invoices`

## Entidad principal
```ts
interface Invoice {
  id: string
  number: string
  customerName: string
  lotCode: string
  issueDate: string
  dueDate: string
  chickensSold: number
  totalWeightLb: number
  pricePerLb: number
  subtotal: number
  paidAmount: number
  status: 'borrador' | 'emitida' | 'pagada' | 'vencida' | 'anulada'
}
```

## GET /api/v1/invoices
Lista facturas.

### Query params
| Parámetro | Tipo | Requerido | Descripción |
|---|---:|---:|---|
| customerId | string | No | Cliente |
| lotId | string | No | Lote |
| status | string | No | Estado |
| dateFrom | date | No | Desde |
| dateTo | date | No | Hasta |

## POST /api/v1/invoices
Crea factura/venta.

### Body
```json
{
  "customerId": "cus-001",
  "lotId": "lot-004",
  "issueDate": "2026-06-12",
  "dueDate": "2026-06-27",
  "chickensSold": 12,
  "totalWeightLb": 63.5,
  "pricePerLb": 7000,
  "paymentCondition": "credito_15_dias"
}
```

## PATCH /api/v1/invoices/:id/status
Cambia estado: borrador, emitida, pagada, vencida, anulada.

## GET /api/v1/invoices/:id/pdf
Devuelve PDF o URL del documento.
