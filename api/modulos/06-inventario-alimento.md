# 06 - Inventario de alimento

## Objetivo
Controlar alimento iniciador, finalizador, preiniciador, reservas, vencimientos y costos.

## Vista frontend
- `/dashboard/cycle/inventory`

## Entidad principal
```ts
interface FeedInventoryItem {
  id: string
  feedType: 'iniciador' | 'finalizador' | 'preiniciador'
  brand: string
  stockKg: number
  reservedKg: number
  unitCost: number
  storageLocation: string
  expirationDate: string
  status: 'suficiente' | 'bajo' | 'critico'
}
```

## GET /api/v1/feed-inventory
Lista inventario.

## POST /api/v1/feed-inventory/purchases
Registra compra de alimento.

### Body
```json
{
  "feedType": "finalizador",
  "brand": "Engorde Plus 40kg",
  "quantityKg": 80,
  "unitCost": 2375,
  "storageLocation": "Bodega Norte · Tarro B",
  "expirationDate": "2026-08-18"
}
```

## POST /api/v1/feed-inventory/reservations
Reserva alimento para un lote.

## GET /api/v1/feed-inventory/summary
Resumen: stock total, reservado, crítico y valor inventario.
