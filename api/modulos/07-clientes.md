# 07 - Clientes

## Objetivo
Gestionar compradores, crédito, saldos pendientes, confiabilidad e historial comercial.

## Vista frontend
- `/dashboard/clients`

## Entidad principal
```ts
interface Customer {
  id: string
  name: string
  document: string
  phone: string
  city: string
  customerType: 'restaurante' | 'distribuidor' | 'vecino' | 'asadero' | 'minorista'
  creditLimit: number
  balanceDue: number
  reliability: 'alta' | 'media' | 'baja'
  lastPurchaseDate: string
  status: 'activo' | 'observacion' | 'inactivo'
}
```

## GET /api/v1/customers
Lista clientes con filtros.

## GET /api/v1/customers/:id
Detalle con historial de compras, pagos y deuda.

## POST /api/v1/customers
Crea cliente.

## PUT /api/v1/customers/:id
Actualiza datos, cupo de crédito o estado.

## GET /api/v1/customers/options
Opciones para selects de ventas/facturas.

## GET /api/v1/customers/:id/statement
Estado de cuenta del cliente.
