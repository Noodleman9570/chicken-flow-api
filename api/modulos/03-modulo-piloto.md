# 03 - Módulo piloto

## Objetivo
Controlar el primer lote de prueba: configuración inicial, registro diario, pesajes semanales y reporte final.

## Vistas frontend
- `/dashboard/pilot`
- `/dashboard/pilot/setup`
- `/dashboard/pilot/daily`
- `/dashboard/pilot/weekly`
- `/dashboard/pilot/final`

## Base existente
Este módulo se basó en `docs/api/endpoints-avicola.md`. Los endpoints originales fueron conservados conceptualmente, pero se recomienda versionarlos bajo `/api/v1`.

## Entidades principales
- PilotLot
- DailyRecord
- WeeklyWeightRecord
- FinalReport

## Endpoints necesarios

### GET /api/v1/pilot/lots
Lista lotes piloto.

### GET /api/v1/pilot/lots/:id
Detalle completo de lote.

### POST /api/v1/pilot/lots
Crea configuración inicial del lote.

### PUT /api/v1/pilot/lots/:id
Actualiza lote.

### GET /api/v1/pilot/lots/:id/daily-records
Lista registros diarios.

### POST /api/v1/pilot/lots/:id/daily-records
Registra día del ciclo.

### PUT /api/v1/pilot/daily-records/:recordId
Actualiza registro diario.

### GET /api/v1/pilot/lots/:id/weekly-records
Lista pesajes semanales.

### POST /api/v1/pilot/lots/:id/weekly-records
Registra pesaje semanal.

### GET /api/v1/pilot/lots/:id/final-report
Calcula o devuelve reporte final.

## Response de resumen esperado
```json
{
  "success": true,
  "data": {
    "lotId": "lot-001",
    "day": 34,
    "birdsAlive": 23,
    "mortalityRate": 4.17,
    "feedConsumedKg": 86.4,
    "averageWeightKg": 2.18,
    "fcr": 1.74,
    "projectedProfit": 428280
  }
}
```

## Validaciones
- No permitir días duplicados por lote.
- No permitir mortalidad mayor que aves vivas.
- Duración recomendada: 42 días, rango permitido 35-49.
- Alertar si mortalidad supera 5%.
