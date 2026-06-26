# 05 - Producción diaria multi-lote

## Objetivo
Registrar día a día alimento, mortalidad, temperatura, agua y observaciones por lote activo.

## Vista frontend
- `/dashboard/cycle/daily`

## Entidad principal
```ts
interface ProductionRecord {
  id: string
  date: string
  lotCode: string
  farmName: string
  day: number
  birdsAliveStart: number
  deadBirds: number
  feedKg: number
  waterChanged: boolean
  temperatureMorning: number
  temperatureAfternoon: number
  observations: string
  operator: string
}
```

## GET /api/v1/production/daily-records
Lista registros diarios multi-lote.

### Query params
| Parámetro | Tipo | Requerido | Descripción |
|---|---:|---:|---|
| date | date | No | Día exacto |
| lotId | string | No | Lote |
| farmId | string | No | Granja |
| operatorId | string | No | Operador |

## POST /api/v1/production/daily-records

### Body
```json
{
  "lotId": "lot-001",
  "date": "2026-06-13",
  "deadBirds": 0,
  "feedKg": 6.2,
  "waterChanged": true,
  "temperatureMorning": 25.8,
  "temperatureAfternoon": 28.4,
  "observations": "Consumo normal"
}
```

## PUT /api/v1/production/daily-records/:id
Actualiza registro.

## GET /api/v1/production/summary
Devuelve totales diarios: alimento usado, mortalidad, temperatura promedio y registros pendientes.

## Validaciones
- Un lote no debe tener dos registros para la misma fecha.
- `deadBirds` no puede ser negativo.
- `feedKg` debe ser mayor o igual a 0.
