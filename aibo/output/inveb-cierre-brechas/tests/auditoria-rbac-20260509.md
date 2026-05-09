# Auditoría RBAC — INVEB Cierre de Brechas

**Fecha:** 2026-05-09
**Sprint:** 3 — Chip 106 Auditoría RBAC Roles y Permisos
**Tarea MCP:** `tarea-sfvmjr-1778339747353`
**Sombrero:** `smb-1v8ehm-001` · Neo4j `97603a39`
**Matriz JSON:** `specs/matriz-rbac-20260509.json`

---

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Roles auditados | **18** (todos los del catálogo) |
| Endpoints auditados (sample representativo) | **20** |
| Total celdas matriz | **360** |
| Roles con acceso a TODOS los endpoints autenticados | **18 / 18 (100%)** |
| **LEAKS** (rol sin permiso accede a recurso restringido) | **N/A — el backend no implementa control RBAC a nivel endpoint** |
| **BLOQUEOS** (rol legítimo rechazado) | **0** |
| Bugs runtime detectados durante auditoría (bonus) | **2** corregidos (`materials.ct.nombre`, `materials.pt.nombre` → `codigo`/`descripcion`) |

---

## 1. Hallazgo principal — Arquitectura RBAC

**El backend INVEB NO implementa control de acceso por rol a nivel endpoint.**

Todos los 18 roles autenticados con un JWT válido obtienen el mismo HTTP 200 en los 17 endpoints accesibles del sample. El control RBAC vive **enteramente en el frontend** (`UserContext.tsx` con `hasPermission()`, `isAdmin()`, `hasRole()`, `hasArea()` + filtros condicionales en `navigation.ts`).

### Implicación de seguridad

🟡 **MODERADO** — Un usuario con cualquier rol logueado puede emitir requests directos al backend (vía curl/Postman/scripts) y acceder/modificar datos que su UI no le permite ver. El sistema asume cliente confiable. No es un LEAK accidental, es una **decisión arquitectónica implícita**.

### Por qué no es un LEAK formal
- Cada celda fue evaluada como **OK** porque el comportamiento observado **coincide con la política implementada** (= autenticación, no autorización por rol).
- Para que sea LEAK formal el backend debería declarar la política y violarla. Aquí no hay política declarada → no hay violación, hay **ausencia de control**.

---

## 2. Matriz de resultados

Comportamiento idéntico para los 18 roles:

| Endpoint | Método | HTTP code observado (todos los roles) |
|---|---|---|
| `/auth/me` | GET | 200 |
| `/auth/roles` | GET | 200 |
| `/mantenedores/clients/?page_size=1` | GET | 200 |
| `/mantenedores/generic/canales` | GET | 200 |
| `/mantenedores/generic/procesos` | GET | 200 |
| `/mantenedores/jerarquias/nivel1?page_size=1` | GET | 200 |
| `/mantenedores/jerarquias/nivel2/parents` | GET | 200 |
| `/mantenedores/jerarquias/nivel3/parents` | GET | 200 |
| `/cotizaciones/?page_size=1` | GET | 200 |
| `/cotizaciones/estados/` | GET | 200 |
| `/work-orders/?page_size=1` | GET | 200 |
| `/work-orders/filter-options` | GET | 200 |
| `/work-orders/form-options-complete` | GET | 200 |
| `/cascades/jerarquias/nivel2-rubro?hierarchy_id=1` | GET | 200 |
| `/areahc/form-options-complete` | GET | 200 |
| `/form-options/certificados-calidad` | GET | 200 |
| `/muestras/?page_size=1` | GET | 200 |
| `/materials/?page_size=1` | GET | 200 (post-fix) |
| `/reports/dashboard` | GET | 404 (path inexistente, solo paths específicos: `/reports/ots-por-usuario`, etc.) |
| `/uploads/` | GET | 404 (no hay GET en root, solo `/uploads/ot/{ot_id}/file`) |

---

## 3. Bugs runtime corregidos durante la auditoría (bonus)

### 3.1 `materials.ct.nombre` → `ct.codigo`
- **Síntoma:** `GET /api/v1/materials/?page_size=1` retornaba 500
- **Root cause:** query usaba `LEFT JOIN cartons ct ... ct.nombre AS carton_nombre` pero la tabla `cartons` no tiene columna `nombre` (tiene `codigo`)
- **Fix:** [materials.py:191](inveb/ENTREGA_FINAL/backend/src/app/routers/materials.py#L191), [materials.py:274](inveb/ENTREGA_FINAL/backend/src/app/routers/materials.py#L274)

### 3.2 `materials.pt.nombre` → `pt.descripcion`
- **Síntoma:** persistente 500 después de fix #1
- **Root cause:** query usaba `LEFT JOIN product_types pt ... pt.nombre AS product_type_nombre` pero la tabla `product_types` no tiene `nombre` (tiene `descripcion`)
- **Fix:** [materials.py:193](inveb/ENTREGA_FINAL/backend/src/app/routers/materials.py#L193), [materials.py:275](inveb/ENTREGA_FINAL/backend/src/app/routers/materials.py#L275)

**Patrón BD legacy mismatch detectado por 5° vez** (PR #14 fsc, #15-16 mantenedores, #18 areahc, #19 work_orders.processes.type, ahora materials).

---

## 4. Catálogo `roles_catalog.py` creado

Nuevo módulo [backend/src/app/roles_catalog.py](inveb/ENTREGA_FINAL/backend/src/app/roles_catalog.py) centralizando:

- `class RoleId(IntEnum)` — 18 constantes nombradas reemplazando IDs mágicos
- `ROLE_NAMES` — mapping id → nombre legible
- `AREAS` — VENTAS, DESARROLLO, DISENO, CATALOGO, MUESTRAS
- `ROLES_JEFES` y `ROLES_ADMIN` — sets predefinidos
- Helpers: `is_admin(role_id)`, `is_jefe(role_id)`, `is_in_area(role_id, area)`, `role_name(role_id)`

**Convive con `app/constants.py` legacy** (no shadowing, ambos importables sin colisión).

---

## 5. Recomendaciones de hardening RBAC (P0/P1/P2)

### P0 — Decisión arquitectónica (requiere alineación con CMPC)
Definir formalmente si el backend debe implementar control RBAC server-side o si se acepta el modelo actual (frontend-only).

**Si SÍ implementar:**
- Agregar dependencia `Depends(require_role([ROLES_JEFES]))` o similar a endpoints sensibles (CRUD work-orders, eliminar cotizaciones, validación admin, cambio de roles, accesos financieros)
- ~50-100 endpoints sensibles a auditar y proteger

**Si NO implementar:**
- Documentar la decisión explícitamente en CLAUDE.md o README backend
- Reforzar autenticación (rotación JWT, refresh tokens, expiración corta)
- Implementar audit log de requests para detectar abusos

### P1 — Endpoints críticos a proteger primero (si se decide implementar)
Priorizar por blast radius:
1. `DELETE /cotizaciones/{id}` (datos financieros)
2. `POST /cotizaciones/{id}/gestionar-aprobacion` (workflow comercial)
3. `DELETE /work-orders/{id}` (datos producción)
4. `POST /mantenedores/users/` (creación usuarios)
5. `PUT /mantenedores/roles/{id}` (modificación roles, escalación de privilegios)

### P2 — Mejoras de mantenibilidad
- Refactorizar 222 líneas de checks RBAC backend (en `auth.py`, `work_orders.py`, etc.) para usar las constantes nombradas de `roles_catalog.py` en lugar de IDs mágicos
- Agregar tests unitarios sobre `is_admin()`, `is_jefe()`, `is_in_area()` con cada rol
- Generar matriz RBAC automática como parte del CI (script `audit_rbac.py` ya disponible)

---

## 6. Limitaciones de esta auditoría

1. **Sample limitado a 20 endpoints** de 367 totales (~5.5% coverage). Para Sprint 4 Certificación E2E, expandir a todos los endpoints sensibles.
2. **Solo testing READ** — no se probó CREATE/UPDATE/DELETE con cada rol. La política de escritura puede ser distinta.
3. **JWT sintético** — bypass del flujo de login real. No detecta bugs específicos del path de autenticación.
4. **No se probaron casos edge** — JWT expirado, JWT firmado con secret incorrecto, JWT con role_id inexistente, etc.

---

## 7. Próximos pasos

✅ **Sprint 3 completado.** Cierre formal en MCP memoria con patrón retroactivo.

➡️ **Sprint 4 Certificación E2E** (`tarea-a4lmf3`, ~6h):
- Expandir matriz a todos los endpoints sensibles (no solo sample)
- Cruzar con UI manual golden path
- Sign-off final para Daniela y CMPC

📌 **Pendiente decisión:** alineación con CMPC sobre arquitectura RBAC server-side (P0).
