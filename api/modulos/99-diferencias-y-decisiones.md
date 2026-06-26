# Diferencias encontradas y decisiones tomadas

## Documentación faltante
En el ZIP analizado no existen las carpetas:

- `docs/arquitectura/`
- `docs/testing/`
- `docs/arquitectura/estructura-proyecto.md`

La implementación se realizó con base en:

- `docs/pollo/analisis-pollo.txt`
- `docs/pollo/modulo-1/analisis-sistema-modulo-piloto.txt`
- `docs/pollo/modulo-2/analisis-modulo-2a-operativo.txt`
- `docs/pollo/modulo-2/analisis-modulo-2b-administrativo.txt`
- `docs/pollo/modulo-3/analisis-estructura-financiera-utilidades.txt`
- `docs/pollo/proyeccion.txt`
- `docs/pollo/sistema-completo-clientes-distribuidores.txt`
- `docs/api/endpoints-avicola.md`
- Vistas y menú actual del frontend

## Diferencia 1: endpoints piloto sin versionado
El archivo piloto usa rutas tipo `/api/pilot/lotes`. Se recomienda mantener compatibilidad o migrar a `/api/v1/pilot/lots` para uniformidad.

## Diferencia 2: menú actual tenía menos módulos que la documentación
La documentación menciona operación, clientes, ventas, cobros, reportes, finanzas e infraestructura. El menú solo tenía piloto, ciclo, pagos, balance y perfil. Se agregaron vistas y navegación para cubrir los módulos principales.

## Diferencia 3: ventas y facturas no estaban separadas en la UI
La documentación administrativa habla de ventas por lote y cobros. Se creó el módulo `/dashboard/invoices` como punto visual para ventas/facturas.

## Diferencia 4: granjas/galpones estaban implícitos
La documentación habla de galpón, zonas, capacidad e infraestructura, pero no había vista dedicada. Se creó `/dashboard/farms`.

## Diferencia 5: inventario de alimento tenía ruta planeada pero sin vista completa
La navegación contenía inventario, pero faltaba una vista preparada. Se creó `/dashboard/cycle/inventory`.

## Decisión final de módulos
Se definió una primera versión visual funcional con módulos navegables, datos mock centralizados y documentación API por módulo.
