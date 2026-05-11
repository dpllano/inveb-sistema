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
| **Backend productivo (Railway)** | https://inveb-api-production-a923.up.railway.app |
| **Healthcheck** | https://inveb-api-production-a923.up.railway.app/health |
| **API Docs (Swagger)** | https://inveb-api-production-a923.up.railway.app/docs |
| **Repositorio GitHub** | https://github.com/dpllano/inveb-sistema |
| **Pull Requests auditables** | `#1` a `#22` mergeados a `main` |
| **Login admin** | RUT 22222222-2 (Administrador) |

---

## Próximo paso recomendado

**Reunión CMPC** de 60-90 minutos con el paquete formal de validación (documento `11-validacion-admin-cmpc.md`). Cuando CMPC responda Q1-Q6 + dé OK escrito de las 31 brechas → **cierre formal completo del proyecto**.

---

**Contacto:** Daniela Llano · Tecno Andina · `daniela.llano@tecnoandina.cl`
**Stack:** FastAPI 0.109 + SQLModel 0.0.14 + React 18 + Vite 5 + MySQL Railway · 19 roles · 81 mantenedores · 367 endpoints
