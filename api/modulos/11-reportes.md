# 11 - Reportes

## Objetivo
Generar y consultar reportes operativos, financieros, clientes y producción.

## Vista frontend
- `/dashboard/reports`

## Entidad principal
```ts
interface ReportItem {
  id: string
  name: string
  category: 'operativo' | 'financiero' | 'clientes' | 'produccion'
  period: string
  generatedAt: string
  status: 'listo' | 'programado' | 'pendiente'
  format: 'pdf' | 'excel' | 'dashboard'
  owner: string
}
```

## GET /api/v1/reports
Lista reportes.

## POST /api/v1/reports/generate
Genera reporte bajo demanda.

### Body
```json
{
  "category": "financiero",
  "period": "2026-06",
  "format": "pdf",
  "filters": { "farmId": "farm-001" }
}
```

## GET /api/v1/reports/:id/download
Descarga reporte.

## POST /api/v1/reports/schedules
Programa generación automática.
