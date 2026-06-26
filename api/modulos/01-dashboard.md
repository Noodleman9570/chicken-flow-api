# 01 - Dashboard general

## Objetivo
Mostrar un resumen inicial del negocio avícola: lotes activos, pollos vivos, mortalidad, margen estimado, tasa, accesos rápidos y alertas.

## Vistas frontend
- `/dashboard`

## Entidades principales
- DashboardMetric
- DashboardAlert
- ExchangeRate

## TypeScript sugerido
```ts
interface DashboardMetric {
  id: string
  label: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  description?: string
}
```

## GET /api/v1/dashboard/summary

### Descripción
Devuelve las métricas principales del tablero inicial.

### Query params
| Parámetro | Tipo | Requerido | Descripción |
|---|---:|---:|---|
| farmId | string | No | Filtrar por granja |
| period | string | No | today, week, month |

### Response esperado
```json
{
  "success": true,
  "data": {
    "metrics": [
      { "id": "active-lots", "label": "Lotes activos", "value": 3, "unit": "lotes", "trend": "up" }
    ],
    "alerts": [
      { "id": "a1", "type": "warning", "message": "Próximo sacrificio en 3 días" }
    ]
  }
}
```

### Notas frontend
Alimenta las cards superiores del dashboard y los avisos rápidos.

## GET /api/v1/dashboard/quick-modules

Devuelve accesos rápidos, estados y módulos disponibles según permisos.

### Response esperado
```json
{
  "success": true,
  "data": [
    { "label": "Ciclo de 42 días", "href": "/dashboard/cycle/active", "enabled": true }
  ]
}
```
