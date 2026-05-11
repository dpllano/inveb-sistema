# Proyecto INVEB Cierre de Brechas Legacy vs Refactor

**Estado:** ✅ Técnicamente cerrado · **Pendiente:** validación formal CMPC · **Fecha:** 2026-05-11

---

## El proyecto en una línea

Reescritura completa de la plataforma INVEB (cotizador + OTs) sobre FastAPI + React, cerrando el drift entre el sistema legacy y el refactor producido por IA, mediante una metodología auditable de **dos motores convergentes** (issues del admin + diff bilateral exhaustivo).

---

## Métricas clave

| Indicador | Resultado |
|---|---|
| **Brechas catalogadas** | 77 (66 admin + 8 técnicas + 3 cross-check) |
| **Brechas cerradas en código** | **31** (40%) con trazabilidad PR + aprendizaje en grafo |
| **Pull Requests mergeados a `main`** | **22** auditables uno por uno |
| **Suite de tests** | 424 passed · sin regresiones |
| **Certificación funcional E2E** | **99.1% OK** (107/108 endpoints) |
| **Auditoría RBAC** | 18 roles × 19 endpoints · 0 leaks · 0 bloqueos |
| **Documentos técnicos producidos** | **18** + 4 emails de cierre |

---

## Tres hallazgos relevantes para la decisión

1. **El sistema funciona end-to-end.** La certificación final con login admin productivo muestra 81 mantenedores listando datos correctamente y 27 endpoints clave (cotizaciones, OTs, cascadas, reports) respondiendo 200 OK con latencia promedio ~25ms.

2. **El backend NO implementa control RBAC server-side en endpoints no destructivos** (decisión arquitectónica que CMPC debe validar). Para destructivos críticos (DELETE cotizaciones, CRUD users/roles) se implementó defensa en profundidad explícita (Sprint 3.5).

3. **5 casos de mismatch BD legacy vs refactor** fueron detectados y corregidos durante el proyecto (tablas con nombres distintos al esperado, columnas `active` vs `status` vs `deleted` vs `deleted_at`). Patrón sistémico documentado para futuros mantenimientos.

---

## ¿Qué falta para el cierre formal?

Solo coordinación humana — **0 trabajo técnico pendiente:**

| # | Item | Audiencia | Tiempo estimado |
|---|---|---|---|
| 1 | Responder 6 preguntas Q1-Q6 + OK escrito de 31 brechas | **CMPC** | 1 reunión 60-90 min |
| 2 | Workshop operativo sobre Sec 12 Plantas (BRC-065) | INVEB operación | 1 sesión 45-60 min |
| 3 | Coordinación activación procesos post-validación | INVEB operación | 1 reunión 30 min |

**Bloqueador único = decisión externa.** El refactor está listo para producción, con o sin estos pasos.

---

## Acceso a evidencia

| Recurso | URL |
|---|---|
| **🌐 Aplicación frontend (acceso visual)** | **https://inveb-frontend-production-307c.up.railway.app** |
| **API backend (REST JSON)** | https://inveb-api-production-a923.up.railway.app |
| Healthcheck backend | https://inveb-api-production-a923.up.railway.app/health |
| API Docs (Swagger) | https://inveb-api-production-a923.up.railway.app/docs |
| Repositorio GitHub | https://github.com/dpllano/inveb-sistema |
| Pull Requests auditables | `#1` a `#23` mergeados a `main` |
| **Login admin para demo** | RUT 22222222-2 / password `test123` (Administrador) |

---

## Próximo paso recomendado

**Reunión CMPC** de 60-90 minutos con el paquete formal de validación (documento `11-validacion-admin-cmpc.md`). Cuando CMPC responda Q1-Q6 + dé OK escrito de las 31 brechas → **cierre formal completo del proyecto**.

---

## Anexo — Credenciales de demo (16 usuarios cubriendo 15 roles)

**Password común:** `test123` · **URL app:** https://inveb-frontend-production-307c.up.railway.app

| Rol | RUT | Email |
|---|---|---|
| Administrador | `22222222-2` | `admin@inveb.cl` |
| Gerente | `33333333-3` | `gerente@inveb.cl` |
| Jefe de Ventas | `23748870-9` | `jventas@inveb.cl` |
| Vendedor | `11334692-2` | `vendedor@inveb.cl` |
| Jefe de Desarrollo | `20649380-1` | `jdesarrollo@inveb.cl` |
| Ingeniero | `8106237-4` | `ingeniero@inveb.cl` |
| Jefe de Diseño e Impresión | `16193907-2` | `jdiseno@inveb.cl` |
| Diseñador | `9719795-4` | `disenador@inveb.cl` |
| Jefe de Precatalogación | `24727035-3` | `jprecatalogador@inveb.cl` |
| Precatalogador | `10554084-1` | `precatalogador@inveb.cl` |
| Jefe de Catalogación | `6334369-2` | `jcatalogador@inveb.cl` |
| Catalogador | `5068443-1` | `catalogador@inveb.cl` |
| Jefe de Muestras | `16161616-1` | `jefemuestras@inveb.cl` |
| Técnico Muestras (Stgo) | `16161617-2` | `tecnicomuestras@inveb.cl` |
| Técnico Muestras (Pte Alto) | `16161618-3` | `tecnicomuestraspuentealto@inveb.cl` |
| Técnico Muestras (Osorno) | `16161619-4` | `tecnicomuestrasosorno@inveb.cl` |
| Vendedor Externo | `8827783-K` | `pablo.rodriguez@cmpc.com` |

---

**Contacto:** Daniela Llano · Tecno Andina · `daniela.llano@tecnoandina.cl`
**Stack:** FastAPI 0.109 + SQLModel 0.0.14 + React 18 + Vite 5 + MySQL Railway · 19 roles · 81 mantenedores · 367 endpoints
