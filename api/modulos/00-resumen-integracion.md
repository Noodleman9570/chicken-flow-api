# Resumen de integración API por módulos - Chicken Flow Portal

## Propósito

Este directorio separa la documentación de endpoints por módulo para que el backend pueda implementar la API de acuerdo con lo que realmente consume el frontend.

## Fuente de análisis

Se revisaron los documentos disponibles en `docs/pollo/`, el archivo piloto `docs/api/endpoints-avicola.md`, la navegación actual del portal y las vistas creadas en `src/app/dashboard/`.

> Nota: en el ZIP actual no existen `docs/arquitectura/`, `docs/testing/` ni `docs/arquitectura/estructura-proyecto.md`. La decisión funcional se tomó con los documentos disponibles y las necesidades reales de las vistas.

## Módulos definidos

1. Dashboard general
2. Granjas e infraestructura
3. Módulo piloto
4. Ciclo escalonado / lotes activos
5. Producción diaria multi-lote
6. Inventario de alimento
7. Clientes
8. Ventas y facturas
9. Pagos y cobros
10. Finanzas y utilidades
11. Reportes
12. Usuarios y permisos

## Convenciones generales

Base sugerida:

```txt
/api/v1
```

Autenticación:

```txt
Authorization: Bearer <token>
```

Formato estándar:

```json
{
  "success": true,
  "data": {},
  "message": "Operación exitosa"
}
```

Formato paginado:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

Formato error:

```json
{
  "success": false,
  "message": "Error al consultar la información",
  "error": "ERROR_CODE"
}
```

## Parámetros comunes para listados

| Parámetro | Tipo | Requerido | Descripción |
|---|---:|---:|---|
| page | number | No | Página actual. Default: 1 |
| limit | number | No | Registros por página. Default: 10 |
| search | string | No | Búsqueda general |
| sortBy | string | No | Campo de ordenamiento |
| sortOrder | asc/desc | No | Dirección del ordenamiento |
| status | string | No | Estado del registro |

## Tipos frontend base

```ts
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```
