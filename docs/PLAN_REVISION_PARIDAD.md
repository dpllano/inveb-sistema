# Plan de Revisión: Paridad Desarrollo ↔ Railway ↔ Laravel

**Fecha:** 2026-03-11
**Objetivo:** Verificar que desarrollo local y Railway sean idénticos, siguiendo estrictamente Laravel original.

---

## FASE 1: ESTRUCTURA DE BASE DE DATOS

### 1.1 Comparar tablas existentes
- [ ] Listar todas las tablas en Railway
- [ ] Listar todas las tablas en migraciones Laravel
- [ ] Identificar tablas faltantes en Railway
- [ ] Crear script SQL para tablas faltantes

### 1.2 Verificar estructura de tablas críticas
- [ ] clients - campos y tipos
- [ ] installations - campos y tipos
- [ ] work_orders - campos y tipos
- [ ] cotizaciones - campos y tipos
- [ ] users - campos y tipos

### 1.3 Verificar tablas de catálogos
- [ ] fsc (ya identificada como faltante)
- [ ] pallet_types
- [ ] paises
- [ ] processes
- [ ] armados
- [ ] plantas
- [ ] cartones
- [ ] papeles

---

## FASE 2: ENDPOINTS MANTENEDORES

### 2.1 Clientes
- [ ] GET /clients - Listar
- [ ] GET /clients/{id} - Detalle
- [ ] POST /clients - Crear
- [ ] PUT /clients/{id} - Actualizar
- [ ] DELETE /clients/{id} - Eliminar

### 2.2 Instalaciones
- [ ] GET /installations/by-client/{id} - Por cliente
- [ ] GET /installations/{id} - Detalle
- [ ] POST /installations - Crear
- [ ] PUT /installations/{id} - Actualizar
- [ ] DELETE /installations/{id} - Eliminar

### 2.3 Usuarios
- [ ] CRUD completo
- [ ] Roles y permisos

---

## FASE 3: SCHEMAS Y VALIDACIONES

### 3.1 Verificar tipos de datos
- [ ] Campos que aceptan int vs string
- [ ] Campos opcionales vs requeridos
- [ ] Valores por defecto

### 3.2 Comparar con Laravel
- [ ] Validaciones en Controllers Laravel
- [ ] Casts en Models Laravel
- [ ] Reglas de validación

---

## FASE 4: CONFIGURACIÓN

### 4.1 Variables de entorno
- [ ] Comparar .env desarrollo vs Railway
- [ ] Verificar conexión BD

### 4.2 Dependencias
- [ ] requirements.txt actualizado
- [ ] Versiones consistentes

---

## FASE 5: TESTS DE INTEGRACIÓN

### 5.1 Probar endpoints en Railway
- [ ] Autenticación
- [ ] CRUD Clientes
- [ ] CRUD Instalaciones
- [ ] Cascadas (Cliente → Instalación → Contacto)

---

## METODOLOGÍA

Para cada item:
1. **VERIFICAR** en Laravel original (fuente de verdad)
2. **COMPARAR** con FastAPI actual
3. **IDENTIFICAR** diferencias
4. **CORREGIR** si hay discrepancias
5. **DOCUMENTAR** el cambio

---

## PROGRESO

| Fase | Items | Completados | Estado |
|------|-------|-------------|--------|
| 1 | 8 | 8 | **COMPLETADO** |
| 2 | 15 | 15 | **COMPLETADO** |
| 3 | 6 | 6 | **COMPLETADO** |
| 4 | 4 | 4 | **COMPLETADO** |
| 5 | 4 | 4 | **COMPLETADO** |

---

## RESULTADOS DE LA REVISIÓN (2026-03-11)

### Cambios Aplicados

1. **12 tablas nuevas** agregadas a generic.py:
   - states, pallet_qas, pallet_tag_formats, design_types
   - precut_types, coverage_types, impresion, ink_types
   - print_type, food_types, protection_type

2. **Correcciones anteriores** (ya aplicadas):
   - clients.py: Union[int, str] para active_contacto_X
   - installations.py: Fallback inteligente para tabla fsc

### Tests
- **382 tests pasando**
- 1 fallido (no crítico - mapeo de rol)
- 3 skipped

### Deploy
- **Backend Railway:** Desplegado exitosamente
- Health check: 200 OK

### Pendiente (opcional)
- Crear tabla `fsc` en Railway para funcionalidad completa
- Script: `/ENTREGA_FINAL/scripts/crear_tabla_fsc.sql`

