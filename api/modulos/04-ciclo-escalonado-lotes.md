# 04 - Ciclo escalonado y lotes activos

## Objetivo
Gestionar lotes simultáneos, edades, zonas del galpón, fechas de entrada, sacrificio y estado operativo.

## Vistas frontend
- `/dashboard/cycle/active`
- `/dashboard/cycle/calendar`

## Entidad principal
```ts
interface ChickenLot {
  id: string
  code: string
  farmId: string
  farmName: string
  zone: string
  birdsInitial: number
  birdsAlive: number
  day: number
  durationDays: number
  startDate: string
  expectedHarvestDate: string
  feedType: 'iniciador' | 'finalizador' | 'mixto'
  mortalityRate: number
  averageWeightKg: number
  fcr: number
  status: 'programado' | 'activo' | 'en_revision' | 'finalizado' | 'cancelado'
  riskLevel: 'bajo' | 'medio' | 'alto'
}
```

## GET /api/v1/lots

### Query params
| Parámetro | Tipo | Requerido | Descripción |
|---|---:|---:|---|
| farmId | string | No | Granja |
| status | string | No | Estado del lote |
| activeOnly | boolean | No | Solo lotes activos |
| dateFrom | date | No | Fecha inicial |
| dateTo | date | No | Fecha final |

### Response esperado
```json
{
  "success": true,
  "data": [
    {
      "id": "lot-001",
      "code": "L-2026-001",
      "farmName": "Granja Las Palmas",
      "zone": "Zona 1",
      "birdsInitial": 24,
      "birdsAlive": 23,
      "day": 34,
      "durationDays": 42,
      "feedType": "finalizador",
      "mortalityRate": 4.17,
      "averageWeightKg": 2.18,
      "fcr": 1.74,
      "status": "activo"
    }
  ]
}
```

## POST /api/v1/lots
Crea o programa lote. Debe validar máximo de lotes activos por granja/zona.

## PATCH /api/v1/lots/:id/status
Cambia estado: programado, activo, en_revision, finalizado, cancelado.

## GET /api/v1/lots/calendar
Devuelve agenda operativa de entradas, vacunas, pesajes, cambios de alimento, compras y sacrificios.

## POST /api/v1/lots/calendar-events
Crea actividad manual asociada a lote o inventario.
