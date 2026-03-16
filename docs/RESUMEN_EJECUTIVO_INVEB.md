# Resumen Ejecutivo - Proyecto INVEB

**Fecha:** 2026-03-16
**Versión:** 1.0
**Autor:** Equipo de Desarrollo

---

## Contexto del Proyecto

**INVEB** es un sistema de gestión de Órdenes de Trabajo (OT) para una empresa de envases de cartón corrugado.

### Migración Tecnológica

| Aspecto | Sistema Original | Sistema Nuevo |
|---------|------------------|---------------|
| **Backend** | Laravel 5.8 (PHP) | FastAPI (Python) |
| **Frontend** | Blade Templates | React + TypeScript |
| **Base de Datos** | MySQL | MySQL (misma) |
| **Hosting** | Servidor tradicional | Railway (Cloud) |

### Objetivo

Migrar todas las funcionalidades del sistema Laravel a FastAPI/React manteniendo **paridad funcional** - el usuario final no debe notar diferencias en el comportamiento.

---

## Problemas de Calidad de Datos en BD

### Hallazgo Crítico: Inconsistencia en Campos Booleanos

Durante la migración se descubrió que la base de datos MySQL tiene **inconsistencias en los tipos de datos** que el código Laravel manejaba de forma flexible pero que causan problemas en FastAPI/Python.

| Campo | Esperado | Encontrado | Impacto |
|-------|----------|------------|---------|
| `active` | 0, 1 | 0, 1, timestamps, texto | Queries fallan o retornan datos incorrectos |
| `status` | 0, 1 | 0, 1, NULL, texto | Filtros no funcionan como esperado |
| `deleted` | 0, 1 | 0, 1, timestamps | Registros "eliminados" aparecen como activos |
| `type` (processes) | 'EV', 'XX' | timestamps, NULL | Filtrado por tipo falla |

### Ejemplo Concreto: Tabla `processes`

**Código Laravel (flexible):**
```php
Process::where('type', 'EV')->where('active', 1)->get();
```

**Problema en BD:**
```sql
SELECT * FROM processes WHERE type = 'EV';
-- Retorna 0 registros porque `type` contiene valores como:
-- '2023-01-15 10:30:00', NULL, '1', etc.
```

**Solución temporal en FastAPI:**
```python
# Se eliminó el filtro por type y solo se filtra por active
cursor.execute("""
    SELECT id, descripcion as nombre
    FROM processes
    WHERE active = 1
    ORDER BY orden ASC
""")
```

### Tablas Afectadas Identificadas

1. **processes** - campo `type` con timestamps en lugar de códigos
2. **maquila_servicios** - campo `active` con valores no-booleanos
3. **impresion** - usa `status` en lugar de `active`
4. **coverage_internal/external** - usa `status` en lugar de `active`
5. **cartons** - campo `carton_muestra` para filtrar cartones de muestra

### Impacto en la Migración

```
┌─────────────────────────────────────────────────────────────────┐
│  Laravel (PHP)                                                  │
│  - Tipado débil: "1" == 1 == true                              │
│  - Maneja NULL graciosamente                                    │
│  - Convierte tipos automáticamente                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  FastAPI (Python)                                               │
│  - Tipado estricto: "1" != 1 != True                           │
│  - NULL causa errores si no se maneja                          │
│  - Requiere conversión explícita                                │
│  - Pydantic valida tipos estrictamente                          │
└─────────────────────────────────────────────────────────────────┘
```

### Recomendación a Futuro

1. **Corto plazo:** Adaptar queries en FastAPI para manejar inconsistencias
2. **Mediano plazo:** Script de limpieza de datos para normalizar campos booleanos
3. **Largo plazo:** Migración de schema con tipos estrictos y constraints

---

## Issues Trabajados - Sesión Actual

### Issue Principal: Modal de Muestra - Sección "Envío Cliente VB"

**Problema Reportado:**
- Los campos "Contacto Cliente" y "Comuna" no mostraban opciones en el modal de características de muestra
- El modal se abría automáticamente al seleccionar "Muestra con CAD", antes de que el usuario pudiera completar datos necesarios

**Diagnóstico:**

| Campo | Causa Raíz | Estado |
|-------|------------|--------|
| **Contacto Cliente** | Se carga dinámicamente cuando hay un cliente seleccionado. Modal se abría antes de seleccionar cliente | Identificado |
| **Comuna** | Endpoint no incluía `comunas` correctamente | Corregido |
| **Salas de Corte** | Faltaba en endpoint `form-options-complete` | Corregido |
| **Modal automático** | useEffect abría modal sin esperar datos | Corregido |

**Correcciones Implementadas:**

1. **Backend (`work_orders.py`):**
   - Comunas desde `ciudades_fletes` (10 opciones)
   - Salas de corte desde `salas_cortes` (3 opciones)

2. **Backend (`cascades.py`):**
   - `ContactoOption` incluye `comuna_id` y `direccion` para autocompletado

3. **Frontend (`CreateWorkOrder.tsx`):**
   - Eliminada apertura automática del modal
   - Botón "Configurar Muestra" para control manual

4. **Frontend (`MuestraModal.tsx`):**
   - Campos Fecha/Planta de Corte con restricción por roles
   - Autocompletado al seleccionar contacto

---

## Arquitectura Técnica

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│    MySQL        │
│   React/TS      │     │    FastAPI      │     │    (Laravel DB) │
│   Railway       │     │    Railway      │     │    Railway      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     inveb-frontend         inveb-api              (compartida)
```

### Flujo del Modal de Muestra (Corregido)

```
1. Usuario selecciona tipo_solicitud = "Muestra con CAD"
2. Sistema marca checkbox "Muestra" automáticamente
3. Usuario completa datos de OT (cliente, instalación)
4. Sistema carga contactos del cliente vía API
5. Usuario hace clic en "Configurar Muestra"
6. Modal se abre con datos disponibles
7. Contactos y Comunas están poblados
```

---

## Estado Actual

### ✅ Completado
- Correcciones en código local
- Commit `5e0a94a` en GitHub
- Redeploy backend y frontend en Railway

### ❌ Problema Pendiente
El código en Railway **no refleja los cambios** - posible problema de sincronización entre GitHub y Railway.

**Evidencia:**
- Log muestra: `MuestraModal props: cads=X, cartones=X, cartonesMuestra=X, roleId=4`
- Debería mostrar: `comunas=X, salasCortes=X` (campos agregados)

---

## Próximos Pasos Recomendados

1. **Verificar configuración de Railway:**
   - Confirmar que el repositorio GitHub conectado es `dpllano/inveb-sistema`
   - Verificar que el branch es `main`
   - Revisar logs de build para errores

2. **Limpiar caché:**
   - Forzar rebuild completo en Railway (no solo redeploy)
   - Limpiar caché del navegador completamente

3. **Validar deployment:**
   - Verificar que los archivos en el contenedor de Railway coinciden con GitHub

---

## Resumen para Comunicación Gerencial

> **Proyecto:** Migración INVEB de Laravel a FastAPI/React
>
> **Estado:** En progreso con complicaciones
>
> **Hallazgo principal:** La base de datos heredada contiene inconsistencias en los tipos de datos (campos booleanos con texto, timestamps donde debería haber códigos). Laravel manejaba esto de forma flexible, pero FastAPI requiere datos consistentes. Esto está causando comportamientos inesperados en varios módulos.
>
> **Issue actual:** Modal de Muestras no carga opciones de contacto y ubicación. Causa identificada y corregida en código, pero existe un problema de deployment que impide ver los cambios en producción.
>
> **Riesgo:** Sin limpieza de datos, seguirán apareciendo issues similares en otros módulos.
>
> **Recomendación:** Planificar sprint de calidad de datos antes de continuar con nuevas funcionalidades.

---

## Historial de Cambios

| Fecha | Versión | Descripción |
|-------|---------|-------------|
| 2026-03-16 | 1.0 | Documento inicial |

---

*Documento generado como parte del proceso de migración INVEB.*
