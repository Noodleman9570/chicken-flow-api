# Documentación API - Sistema Avícola Chicken Flow

> Actualización: este archivo se conserva como base histórica del módulo piloto. La documentación final por módulo está separada en `docs/api/modulos/`. Revisar especialmente `docs/api/modulos/00-resumen-integracion.md` y `docs/api/modulos/03-modulo-piloto.md`.


## Visión General

Esta documentación describe los endpoints que el backend debe implementar para el sistema avícola. El frontend ya está desarrollado con toda la lógica de cálculo y validación, pero los datos deben persistir en una base de datos a través de una API REST.

## Arquitectura

- **Frontend**: React/Next.js con cálculos en tiempo real
- **Backend**: Node.js/Express con persistencia en base de datos
- **Base de Datos**: PostgreSQL o MySQL recomendada

## Autenticación

Todos los endpoints requieren token JWT en el header:
```
Authorization: Bearer <token>
```

## Estructura de Datos

### Lote (lote)
```typescript
interface Lote {
  id_lote: number;
  numero_lote: number;
  cantidad_pollitos: number;
  fecha_inicio: string;
  fecha_fin_esperada: string;
  duracion_dias: number;
  estado: 'activo' | 'finalizado' | 'cancelado';
  precio_pollito: number;
  precio_iniciador: number;
  precio_finalizador: number;
  precio_viruta: number;
  precio_vacunas: number;
  costo_calefaccion: number;
  costo_transporte: number;
  costo_procesamiento: number;
  costo_entrega: number;
  precio_venta_lb: number;
  peso_esperado_pollo?: number;
  peso_esperado_canal?: number;
  observaciones_iniciales?: string;
  fecha_creacion: string;
  usuario_creador: string;
}
```

### Registro Diario (registro_diario)
```typescript
interface RegistroDiario {
  id_registro: number;
  id_lote: number;
  dia_ciclo: number;
  fecha_registro: string;
  pollos_vivos_inicio: number;
  pollos_muertos: number;
  causa_muerte?: string;
  alimento_echado_kg: number;
  tipo_alimento: 'iniciador' | 'finalizador';
  agua_cambiada?: boolean;
  temperatura_manana?: number;
  temperatura_tarde?: number;
  observaciones?: string;
  fecha_registro_sistema: string;
}
```

### Registro Semanal (registro_semanal)
```typescript
interface RegistroSemanal {
  id_registro_semanal: number;
  id_lote: number;
  semana_numero: number;
  dia_inicio: number;
  dia_fin: number;
  fecha_pesaje: string;
  pollo_1_peso: number;
  pollo_2_peso: number;
  pollo_3_peso: number;
  pollo_4_peso: number;
  pollo_5_peso: number;
  peso_promedio?: number;
  alimento_consumido_sem: number;
  pollos_muertos_semana: number;
  observaciones?: string;
}
```

## Endpoints del Módulo Piloto

### 1. Gestión de Lotes

#### GET /api/pilot/lotes
Obtener todos los lotes del usuario
```json
{
  "success": true,
  "data": [
    {
      "id_lote": 1,
      "numero_lote": 1,
      "cantidad_pollitos": 24,
      "fecha_inicio": "2026-06-13",
      "estado": "activo",
      // ... resto de campos
    }
  ]
}
```

#### GET /api/pilot/lotes/:id
Obtener un lote específico
```json
{
  "success": true,
  "data": {
    "id_lote": 1,
    // ... todos los campos del lote
  }
}
```

#### POST /api/pilot/lotes
Crear un nuevo lote
```json
{
  "cantidad_pollitos": 24,
  "duracion_dias": 42,
  "precio_pollito": 3500,
  "precio_iniciador": 95000,
  "precio_finalizador": 90000,
  "precio_viruta": 15000,
  "precio_vacunas": 80000,
  "costo_calefaccion": 50000,
  "costo_transporte": 30000,
  "costo_procesamiento": 20000,
  "costo_entrega": 25000,
  "precio_venta_lb": 6500,
  "peso_esperado_pollo": 2.5,
  "peso_esperado_canal": 1.9,
  "observaciones_iniciales": "Lote de prueba piloto"
}
```

#### PUT /api/pilot/lotes/:id
Actualizar un lote
```json
{
  "estado": "finalizado",
  "observaciones_iniciales": "Actualización del lote"
}
```

### 2. Registros Diarios

#### GET /api/pilot/lotes/:id/registros-diarios
Obtener todos los registros diarios de un lote
```json
{
  "success": true,
  "data": [
    {
      "id_registro": 1,
      "id_lote": 1,
      "dia_ciclo": 1,
      "fecha_registro": "2026-06-13",
      "pollos_vivos_inicio": 24,
      "pollos_muertos": 0,
      "alimento_echado_kg": 1.2,
      "tipo_alimento": "iniciador",
      // ... resto de campos
    }
  ]
}
```

#### POST /api/pilot/lotes/:id/registros-diarios
Crear un nuevo registro diario
```json
{
  "dia_ciclo": 2,
  "pollos_vivos_inicio": 24,
  "pollos_muertos": 0,
  "causa_muerte": null,
  "alimento_echado_kg": 1.3,
  "tipo_alimento": "iniciador",
  "agua_cambiada": true,
  "temperatura_manana": 28,
  "temperatura_tarde": 30,
  "observaciones": "Buen comportamiento"
}
```

#### PUT /api/pilot/registros-diarios/:id
Actualizar un registro diario
```json
{
  "pollos_muertos": 1,
  "observaciones": "Se encontró un pollo muerto"
}
```

### 3. Registros Semanales

#### GET /api/pilot/lotes/:id/registros-semanales
Obtener todos los registros semanales de un lote
```json
{
  "success": true,
  "data": [
    {
      "id_registro_semanal": 1,
      "id_lote": 1,
      "semana_numero": 1,
      "dia_inicio": 1,
      "dia_fin": 7,
      "fecha_pesaje": "2026-06-20",
      "pollo_1_peso": 850,
      "pollo_2_peso": 870,
      "pollo_3_peso": 860,
      "pollo_4_peso": 880,
      "pollo_5_peso": 865,
      "peso_promedio": 865,
      "alimento_consumido_sem": 8.4,
      "pollos_muertos_semana": 0
    }
  ]
}
```

#### POST /api/pilot/lotes/:id/registros-semanales
Crear un nuevo registro semanal
```json
{
  "semana_numero": 2,
  "dia_inicio": 8,
  "dia_fin": 14,
  "fecha_pesaje": "2026-06-27",
  "pollo_1_peso": 1200,
  "pollo_2_peso": 1180,
  "pollo_3_peso": 1195,
  "pollo_4_peso": 1210,
  "pollo_5_peso": 1185,
  "alimento_consumido_sem": 12.6,
  "pollos_muertos_semana": 1,
  "observaciones": "Buen crecimiento"
}
```

### 4. Reportes y Estadísticas

#### GET /api/pilot/lotes/:id/resumen
Obtener resumen completo del lote
```json
{
  "success": true,
  "data": {
    "lote": { /* datos del lote */ },
    "resumen": {
      "pollos_vivos_actuales": 22,
      "mortalidad_acumulada": 8.33,
      "alimento_consumido_total": 45.2,
      "peso_promedio_actual": 1850,
      "fcr_actual": 1.72,
      "costo_acumulado": 2850000,
      "ingresos_estimados": 3200000,
      "ganancia_estimada": 350000,
      "rentabilidad": 12.28
    },
    "registros_diarios": [ /* registros */ ],
    "registros_semanales": [ /* registros */ ]
  }
}
```

#### GET /api/pilot/lotes/:id/reporte-final
Generar reporte final del lote
```json
{
  "success": true,
  "data": {
    "datos_finales": {
      "pollos_iniciales": 24,
      "pollos_finales": 22,
      "mortalidad_final": 8.33,
      "peso_final": 2500,
      "fcr_final": 1.72,
      "ciclo_dias": 42
    },
    "analisis_financiero": {
      "costos_totales": 2850000,
      "ingresos_totales": 3200000,
      "ganancia_neta": 350000,
      "rentabilidad": 12.28,
      "costo_por_pollo": 129545,
      "ingreso_por_pollo": 145455
    },
    "indicadores_clave": {
      "mortalidad": { "valor": 8.33, "estado": "advertencia" },
      "fcr": { "valor": 1.72, "estado": "optimo" },
      "peso": { "valor": 2500, "estado": "optimo" },
      "rentabilidad": { "valor": 12.28, "estado": "bueno" }
    },
    "recomendaciones": [
      "Reducir mortalidad: Revisar bioseguridad",
      "Considerar escalar a ciclos escalonados"
    ]
  }
}
```

### 5. Cálculos Automáticos (Endpoints de utilidad)

#### GET /api/pilot/calculos/alimento/:cantidadPollitos
Calcular alimento necesario
```json
{
  "success": true,
  "data": {
    "iniciador_necesario": 24,
    "finalizador_necesario": 79.2,
    "iniciador_bultos_sugeridos": 1,
    "finalizador_bultos_sugeridos": 2,
    "costo_total_alimento": 275000
  }
}
```

#### POST /api/pilot/calculos/viabilidad
Validar viabilidad del lote
```json
{
  "cantidad_pollitos": 24,
  "precio_pollito": 3500,
  "precio_iniciador": 95000,
  "precio_finalizador": 90000,
  "precio_venta_lb": 6500
}
```
```json
{
  "success": true,
  "data": {
    "viable": true,
    "ganancia_estimada": 350000,
    "rentabilidad": 12.28,
    "inversion_inicial": 1500000,
    "alertas": [],
    "recomendaciones": ["Buen potencial de rentabilidad"]
  }
}
```

## Estructura de Respuestas

### Éxito
```json
{
  "success": true,
  "data": { /* datos solicitados */ },
  "message": "Operación exitosa"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos inválidos",
    "details": {
      "cantidad_pollitos": ["Debe ser mayor a 0"],
      "precio_pollito": ["Debe ser mayor a 0"]
    }
  }
}
```

## Códigos de Error Comunes

- `AUTH_REQUIRED`: Token no proporcionado
- `AUTH_INVALID`: Token inválido
- `NOT_FOUND`: Recurso no encontrado
- `VALIDATION_ERROR`: Datos inválidos
- `BUSINESS_ERROR`: Error de reglas de negocio
- `INTERNAL_ERROR`: Error interno del servidor

## Validaciones de Negocio

El backend debe implementar las mismas validaciones que el frontend:

1. **Configuración de lote**:
   - Cantidad de pollitos: múltiplos de 12, entre 12 y 500
   - Duración: entre 35 y 49 días
   - Precios: mayores a 0, rangos razonables

2. **Registro diario**:
   - Día del ciclo: entre 1 y duración del lote
   - Pollos vivos: no puede aumentar respecto al día anterior
   - Temperatura: entre 10°C y 45°C

3. **Registro semanal**:
   - Pesos: mayores a 0, rangos realistas (100g - 5000g)
   - Mortalidad semanal: no mayor al 20%

## Base de Datos - Schema Sugerido

```sql
-- Tabla de lotes
CREATE TABLE lotes (
  id_lote SERIAL PRIMARY KEY,
  numero_lote INT NOT NULL,
  cantidad_pollitos INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin_esperada DATE NOT NULL,
  duracion_dias INT NOT NULL DEFAULT 42,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo',
  precio_pollito DECIMAL(10,2) NOT NULL,
  precio_iniciador DECIMAL(10,2) NOT NULL,
  precio_finalizador DECIMAL(10,2) NOT NULL,
  precio_viruta DECIMAL(10,2) NOT NULL,
  precio_vacunas DECIMAL(10,2) NOT NULL,
  costo_calefaccion DECIMAL(10,2) NOT NULL,
  costo_transporte DECIMAL(10,2) NOT NULL,
  costo_procesamiento DECIMAL(10,2) NOT NULL,
  costo_entrega DECIMAL(10,2) NOT NULL,
  precio_venta_lb DECIMAL(10,2) NOT NULL,
  peso_esperado_pollo DECIMAL(5,2),
  peso_esperado_canal DECIMAL(5,2),
  observaciones_iniciales TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_creador VARCHAR(100) NOT NULL
);

-- Tabla de registros diarios
CREATE TABLE registros_diarios (
  id_registro SERIAL PRIMARY KEY,
  id_lote INT NOT NULL REFERENCES lotes(id_lote),
  dia_ciclo INT NOT NULL,
  fecha_registro DATE NOT NULL,
  pollos_vivos_inicio INT NOT NULL,
  pollos_muertos INT NOT NULL DEFAULT 0,
  causa_muerte VARCHAR(100),
  alimento_echado_kg DECIMAL(8,2) NOT NULL,
  tipo_alimento VARCHAR(15) NOT NULL CHECK (tipo_alimento IN ('iniciador', 'finalizador')),
  agua_cambiada BOOLEAN DEFAULT TRUE,
  temperatura_manana DECIMAL(4,1),
  temperatura_tarde DECIMAL(4,1),
  observaciones TEXT,
  fecha_registro_sistema TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_lote, dia_ciclo)
);

-- Tabla de registros semanales
CREATE TABLE registros_semanales (
  id_registro_semanal SERIAL PRIMARY KEY,
  id_lote INT NOT NULL REFERENCES lotes(id_lote),
  semana_numero INT NOT NULL,
  dia_inicio INT NOT NULL,
  dia_fin INT NOT NULL,
  fecha_pesaje DATE NOT NULL,
  pollo_1_peso DECIMAL(6,1) NOT NULL,
  pollo_2_peso DECIMAL(6,1) NOT NULL,
  pollo_3_peso DECIMAL(6,1) NOT NULL,
  pollo_4_peso DECIMAL(6,1) NOT NULL,
  pollo_5_peso DECIMAL(6,1) NOT NULL,
  peso_promedio DECIMAL(6,1),
  alimento_consumido_sem DECIMAL(8,2) NOT NULL,
  pollos_muertos_semana INT NOT NULL DEFAULT 0,
  observaciones TEXT,
  UNIQUE(id_lote, semana_numero)
);
```

## Notas para el Desarrollador Backend

1. **Cálculos en Frontend**: Todo el cálculo de indicadores (FCR, mortalidad, proyecciones) ya está implementado en el frontend. El backend solo debe persistir los datos brutos.

2. **Validaciones**: Implementar las mismas validaciones que están en `poultry-validations.ts` para mantener consistencia.

3. **Transacciones**: Usar transacciones para operaciones complejas (ej: crear lote con sus registros iniciales).

4. **Auditoría**: Incluir campos de auditoría como `fecha_creacion`, `usuario_creador`, `fecha_actualizacion`.

5. **Performance**: Considerar índices en `id_lote` para consultas de registros diarios/semanales.

6. **Upload de Archivos**: Para futuras versiones, considerar endpoints para subir fotos o documentos.

## Próximos Módulos

Esta API es la base para los siguientes módulos:
- Módulo 2: Ciclos Escalonados (múltiples lotes simultáneos)
- Módulo 3: Gestión Financiera (distribución de utilidades)
- Módulo 4: Clientes y Distribuidores

La estructura actual está preparada para escalabilidad sin cambios mayores.
