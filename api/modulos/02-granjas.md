# 02 - Granjas e infraestructura

## Objetivo
Controlar granjas, galpones, zonas, capacidad, responsables y mantenimiento.

## Vistas frontend
- `/dashboard/farms`

## Entidad principal
```ts
interface Farm {
  id: string
  name: string
  location: string
  areaM2: number
  zones: number
  capacity: number
  activeLots: number
  status: 'activa' | 'mantenimiento' | 'inactiva'
  responsible: string
  nextMaintenance: string
}
```

## GET /api/v1/farms

### Query params
| Parámetro | Tipo | Requerido | Descripción |
|---|---:|---:|---|
| page | number | No | Página |
| limit | number | No | Registros |
| search | string | No | Nombre, ubicación o responsable |
| status | string | No | activa, mantenimiento, inactiva |

### Response esperado
```json
{
  "success": true,
  "data": [
    {
      "id": "farm-001",
      "name": "Granja Las Palmas",
      "location": "Quimbaya, Quindío",
      "areaM2": 18,
      "zones": 3,
      "capacity": 144,
      "activeLots": 3,
      "status": "activa",
      "responsible": "Martha Medina",
      "nextMaintenance": "2026-07-04"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

## GET /api/v1/farms/:id

Devuelve detalle de granja con zonas, lotes activos, historial de mantenimiento e inventario relacionado.

## POST /api/v1/farms

### Body
```json
{
  "name": "Granja Las Palmas",
  "location": "Quimbaya, Quindío",
  "areaM2": 18,
  "zones": 3,
  "capacity": 144,
  "responsibleUserId": "usr-002"
}
```

## PUT /api/v1/farms/:id
Actualiza datos generales, capacidad, responsable o estado.

## GET /api/v1/farms/options
Devuelve opciones para selects: granjas activas, zonas disponibles y responsables.
