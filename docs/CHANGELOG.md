# Changelog - INVEB Sistema de Gestion OT

Historial de cambios del proyecto de migracion Laravel a FastAPI/React.

---

## [2.0.0] - 2026-02-23

### Migracion Completa Laravel 5.8 a FastAPI/React

**Resultado Final:**
- 100% de funcionalidad migrada
- 450+ endpoints API
- 78 componentes React
- 533+ tests pasando

---

## Sprints Completados

### Sprint 0: Issues Usuario Experto
**Fecha:** 2026-01-10
- 20/20 issues del Excel resueltos
- Mantenedor Cliente/Instalaciones
- Cascadas de formulario
- Carga automatica de CAD

### Sprint 1: Funcionalidades Criticas
**Fecha:** 2026-01-15
- OTs Especiales (Licitacion, Ficha Tecnica, Benchmarking)
- Exportacion Excel SAP
- ~50 formulas de calculo (accessors)
- 8 endpoints nuevos

### Sprint 2: Reportes
**Fecha:** 2026-01-18
- 15+ endpoints de reportes
- Router reports.py
- Exportaciones Excel

### Sprint 3: Cotizador y Gestiones
**Fecha:** 2026-01-22
- CRUD Cotizaciones (10 endpoints)
- Detalles corrugados/esquineros
- Gestiones OT (7 endpoints)
- Sistema de versionado

### Sprint 4: Muestras e Integraciones
**Fecha:** 2026-01-25
- Modulo Muestras (13 endpoints)
- Generacion PDFs (4 endpoints)
- Integraciones externas (10 endpoints)

### Sprint 5: Mantenedores
**Fecha:** 2026-01-28
- 52 tablas via generic.py
- 8 endpoints genericos
- 5 routers especificos

### Sprint C: Gestion OTs
**Fecha:** 2026-01-30
- Aprobacion/Rechazo OTs
- CAD y Material
- Importar Muestras Excel
- Cotizar Multiples

### Sprint D: Mantenedor Masivo
**Fecha:** 2026-02-02
- 24 tablas con import/export Excel
- 48 endpoints (POST import + GET download)
- Validaciones robustas

### Sprint F: Frontend y Mantenedores Adicionales
**Fecha:** 2026-02-05
- 63 componentes React
- 17 reportes con KPIs
- cantidad_base agregado

### Sprint G: Correccion de Brechas
**Fecha:** 2026-02-08

**FASE 1: Selects de BD**
- Reescrito form_options.py completo
- Todas las opciones leen de BD
- Excluye Offset (ID=1)

**FASE 2: Middleware Roles**
- constants.py con 19 roles + 6 areas
- middleware/roles.py con RoleChecker
- Aplicado a work_orders y cotizaciones

**FASE 3: Aprobaciones Multinivel**
- Flujo 3 niveles segun margen
- Nivel 1: Jefe Ventas (margen < 10%)
- Nivel 2: + Gerente Comercial (margen < 25%)
- Nivel 3: + Gerente General (margen >= 25%)

**FASE 4: Correcciones Menores**
- VendedorExterno solo ve cliente ID=8
- Filtrado OTs por rol

### Sprint H: Endpoints Completos
**Fecha:** 2026-02-10
- Verificacion 100% endpoints Laravel vs FastAPI
- 13 tablas opcionales agregadas (69 total)
- 25 endpoints reportes (vs 17 Laravel)

### Sprint K: Frontend Validaciones
**Fecha:** 2026-02-17

**Implementado:**
- react-hook-form + yup
- Schemas de validacion (OT, Cliente, Cotizacion)
- transformDecimal (coma a punto)
- file_oc condicional
- UserContext con 19 roles
- ProtectedRoute, RequirePermission
- 99 tests schemas + 51 tests utils

**Correcciones:**
- TIPOS_SOLICITUD_VENDEDOR_EXTERNO = [1, 5]
- calcular_margen_cotizacion()
- determinar_nivel_aprobacion()
- Endpoint /form-options/cotizador

### Sprint L: PDFs Cotizacion
**Fecha:** 2026-02-18
- Servicio pdf_cotizacion.py
- PDF multi-pagina (Carta + Acuerdo + Ficha HACCP)
- 4 endpoints PDF cotizacion

### Sprint T: UI/UX Mejoras
**Fecha:** 2026-02-22
- Componente Tooltip.tsx (6 variantes)
- Componente FileAttachments.tsx
- 95 tests frontend nuevos

---

## Estadisticas Finales

| Metrica | Valor |
|---------|-------|
| Controladores Laravel | 58 |
| Routers FastAPI | 26 |
| Endpoints Total | 450+ |
| Componentes React | 78 |
| Tests Backend | 383 |
| Tests Frontend | 150 |
| Tablas BD | 69+ |
| Issues Excel Resueltos | 58/58 (100%) |

---

## Archivos de Referencia

- `/AUDITORIA_COMPLETA_LARAVEL_VS_FASTAPI.md` - Comparacion detallada
- `/VERIFICACION_ISSUES_EXCEL_V2.md` - Verificacion issues
- `/INFORME_COMPARACION_ROLES_PERMISOS.md` - Roles y permisos

---

*Ultima actualizacion: 2026-02-23*
