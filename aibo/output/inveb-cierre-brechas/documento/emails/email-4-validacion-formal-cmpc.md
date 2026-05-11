# Email 4 — Validación formal CMPC (las 6 preguntas + OK escrito)

**Destinatario:** Admin CMPC + jefatura comercial CMPC (validación de negocio)
**CC:** punto de contacto operacional INVEB · Daniela Llano (Tecno Andina)
**Prioridad:** 🚨 **CRÍTICA — bloqueador principal del cierre formal del proyecto**

---

## Asunto sugerido

> **[CMPC] Validación formal del refactor INVEB — 6 preguntas + OK de cierre (proyecto técnicamente cerrado, 22 PRs, 31 brechas)**

---

## Cuerpo del email

Estimad\@ [nombre admin CMPC],

Te escribo desde Tecno Andina con el **paquete final de validación** del proyecto **INVEB Cierre de Brechas Legacy vs Refactor**. El proyecto está **técnicamente cerrado** y solo falta tu validación formal de negocio para considerarlo cerrado por completo.

A continuación detallo: (1) un resumen de lo entregado, (2) las **6 preguntas formales** que necesitamos respondas, (3) el OK escrito de las 31 brechas cerradas en código, y (4) el plan post-validación.

---

### 1. Resumen de lo entregado

El proyecto reescribió la plataforma cotizador/OTs sobre **FastAPI + React + MySQL Railway**, partiendo del sistema legacy CMPC. Trabajamos en 2 motores paralelos:

- **Motor A** — Catalogación de issues reportados por vos en los 5 Excels admin (134 issues)
- **Motor B** — Diff bilateral legacy vs refactor en 4 iteraciones exhaustivas

Ambos convergieron en un catálogo unificado de **77 brechas atómicas**, de las cuales:

| Categoría | Cantidad |
|---|---|
| **Brechas cerradas en código** (22 PRs mergeados a `main`) | **31** |
| Brechas Tier 2/3 backlog (no críticas, post-validación si CMPC requiere) | 16 |
| Brechas escaladas a este paso para tu definición | 3 (BRC-059, BRC-062, BRC-065) |
| Variantes admin v3.0/v3.1 cubiertas | 26 |

Adicionalmente:

- **Certificación E2E final:** 99.1% de endpoints OK (107/108 celdas), 0 regresiones
- **Auditoría RBAC:** 18 roles × 19 endpoints destructivos verificados, 0 leaks de seguridad
- **17 documentos técnicos** producidos con trazabilidad completa
- **Suite de tests:** 424 passed, sin regresiones
- **Login admin Railway:** funcional con tu RUT 22222222-2

Toda la evidencia está disponible en el repositorio GitHub (auditoría de PRs uno por uno) y en los documentos adjuntos a este email.

---

### 2. Las 6 preguntas formales que CMPC debe responder

Estas son **restricciones de negocio implícitas** que el legacy "sabe hacer" pero nunca se documentaron por escrito. Necesitamos tu respuesta explícita para que el refactor las soporte de manera **trazable y auditable**.

Cada pregunta incluye: (a) la pregunta concreta, (b) lo que el refactor ya implementó como hipótesis, (c) lo que necesitamos confirmes o ajustes.

---

#### CMPC-Q1 — Múltiples destinos de una Muestra

> **Pregunta:** Cuando un Diseñador Técnico crea una **Muestra con múltiples destinos** (por ejemplo: destinos = [Vendedor, Diseñador, Cliente_X, Cliente_Y]), ¿esperás que el sistema genere **1 muestra master + N réplicas para cada Cliente** (comportamiento del legacy, "Mundo A"), o **1 sola muestra con un array de destinos** (refactor simplificado, "Mundo B")?

| | Detalle |
|---|---|
| **Pre-validación interna** | El refactor implementa **Mundo A** (1 master + N réplicas) — replica exacto del legacy |
| **PR ejecutado** | Sprint 5 PR #6 (cierra BRC-022 a BRC-027 = 6 brechas) |
| **Tu acción** | ✅ Confirmar Mundo A · o solicitar cambio a Mundo B |

---

#### CMPC-Q2 — Sec 12 Sección Operacional Plantas

> **Pregunta:** El campo `so_planta_original` en la Sección 12 de la OT, ¿debe **auto-heredar el valor de `planta_id`** (Sec 6 Asistente de Ingresos) cuando el operador selecciona Planta en Sec 6, o son **campos completamente independientes** que el operador rellena manualmente?

**Sub-preguntas operativas:**
- ¿Cuántas plantas alternativas se usan típicamente en producción? (1, 2, 3, más, variable)
- ¿Hay reglas de negocio implícitas — por ejemplo, planta_alt1 debe ser de la misma región que planta_original?
- ¿Qué información concreta va en las "filas de detalle" por planta alternativa?

| | Detalle |
|---|---|
| **Pre-validación interna** | La hipótesis inicial del refactor era **incorrecta** (asumía auto-herencia, pero el cross-check inveb-h1 mostró que son módulos distintos) |
| **Bloquea** | **BRC-065** (escalada directamente a este paso) |
| **Tu acción** | Coordinar un workshop con un operador INVEB que use Sec 12 (Tecno Andina lo gestiona — ver email separado a INVEB) |

> ⚠️ **Nota:** esta pregunta se resuelve en paralelo con un workshop INVEB. Tu rol acá es indicar la **dirección de negocio** (auto-herencia vs independiente), y el workshop INVEB confirma los detalles operativos.

---

#### CMPC-Q3 — Filtros de cascadas en Sec 6 Asistente

> **Pregunta:** Los listados de Recubrimiento Interno/Externo, Planta Objetivo y Cartón en la Sec 6 Asistente deben **filtrarse según el contexto de la OT** (ejemplo: si CINTA=SI, algunas opciones se excluyen; si FSC=valor X, otras se filtran). Las reglas de filtrado documentadas en la BD legacy (campos `coverage_internal.cinta_si_aplica`, `cinta_no_aplica`, etc.) ¿son las correctas y exhaustivas?

| | Detalle |
|---|---|
| **Pre-validación interna** | Verificación runtime: los filtros backend YA están aplicados según las reglas de la BD legacy |
| **Bloquea** | **BRC-028 a BRC-038** — 11 brechas. Sprint 7 verificó que NO es bug backend |
| **Causa raíz hipotética** | Si CMPC confirma reglas correctas → investigación frontend (cache, params) |
| **Tu acción** | ✅ Confirmar reglas correctas · o ❌ indicar reglas distintas que se deban implementar |

---

#### CMPC-Q4 — Scope del audit trail (compliance)

> **Pregunta:** Para compliance y auditoría, ¿es suficiente con audit trail (historial de cambios) sobre **5 entidades críticas** — Cotizacion, WorkOrder, Client, User, CotizacionEstado — o CMPC requiere el audit trail completo sobre las **103 entidades** del legacy?

| | Detalle |
|---|---|
| **Pre-validación interna** | Tecno Andina autorizó **5 entidades** como suficientes |
| **Plan ejecutable disponible** | `specs/sprint9-audit-trail-plan.md` (~16 horas de implementación si se confirma scope 5 entidades) |
| **Tu acción** | ✅ Confirmar 5 entidades · o solicitar expansión a N entidades específicas (decir cuáles) |

---

#### CMPC-Q5 — Tipos de OT (catálogo real)

> **Pregunta:** El refactor maneja actualmente **5 tipos de solicitud** confirmados en código (1, 3, 5, 6, 7). El README del legacy declaraba **11 tipos**. ¿Cuál es el catálogo **real** de tipos de OT que CMPC opera hoy?

| | Detalle |
|---|---|
| **Pre-validación interna** | Constraint Pydantic `ge=1, le=7` implementado (PR #2 ya en main) |
| **Tu acción** | Confirmar catálogo real. Si hay tipos en uso fuera del rango 1-7, ajustamos el constraint |

---

#### CMPC-Q6 — Deploy productivo y backup Railway

> **Pregunta:** El deploy productivo final ¿queda en Railway **plan Hobby** ($5/mes, sin backup nativo), Railway **plan Pro** ($20/mes con backup nativo), o se migra a **infraestructura CMPC propia** (on-premise / cloud propio)? Esto define si necesitamos implementar nuestro propio backup vía `mysqldump` automatizado.

| | Detalle |
|---|---|
| **Pre-validación interna** | Flag T-006 abierto desde Obj 0 |
| **Plan preventivo** | `specs/backup-railway-mysqldump.md` ya creado para el escenario Hobby (sin backup nativo) |
| **Tu acción** | Decidir plan de infraestructura: Hobby / Pro / Propio |

---

### 3. OK escrito de las 31 brechas cerradas

Necesito tu **OK escrito formal** confirmando que aceptas como cerradas las **31 brechas implementadas en código**. La lista completa con número de PR y commit hash está en el anexo `documento/04-catalogo-unificado-brechas.md` (lo adjunto en PDF al final del email).

**Para facilitar tu revisión**, te resumo las brechas por sprint:

| Sprint | PR | Brechas cerradas |
|---|---|---|
| Quick wins | #1, #2 | Drifts documentación + Pydantic strict |
| Sprint 0 | #3 | Active_contacto normalizer |
| Sprint H2 | #5 | BRC-067 + 4 validaciones |
| Sprint 5 Muestras | #6 | BRC-022 a 027 (multi-dest) |
| Sprint 1 Cliente | #8 | BRC-001 a 008 (mantenedor cliente) |
| Sprint 2 Instalación | #9 | BRC-009 a 013 |
| Sprint 4 Usuarios | #10 | BRC-014 a 017 (bug clean_telefono) |
| Sprint 8 Tier 1 | #11 | BRC-040 (cert. calidad) |
| Sprint 8 Tier 2 | #12 | BRC-046 a 050 (pallet pull) |
| Sprints UI + RBAC + E2E | #13-22 | Saneamiento listboxes, hook reutilizable, audit RBAC, hardening, certificación final |
| Cambios runtime BD prod | manual | Cleanup OT 26682 + UPDATE armados id=2 |

**Formato sugerido para tu OK:**

```
Confirmo aceptar como CERRADAS las 31 brechas implementadas
en código, según el detalle del documento 04-catalogo-unificado-brechas.md
y los 22 PRs mergeados a main en el repositorio
https://github.com/dpllano/inveb-sistema.

Fecha: [DD/MM/2026]
Firmante CMPC: [nombre + cargo]
```

Un email o documento firmado digitalmente sirve perfecto. No hace falta firma manuscrita salvo que CMPC requiera ese formato por compliance interno.

---

### 4. Plan post-validación

Una vez tengamos tus respuestas a Q1-Q6 + el OK escrito de las 31 brechas:

| Si CMPC… | Acción de Tecno Andina |
|---|---|
| Confirma Mundo A (Q1) + 5 entities (Q4) + plan Railway (Q6) | Ejecutar Sprint 9 Audit Trail (~16h) |
| Define Q2 (Sec 12 Plantas) | Coordinar workshop INVEB → ajustar lógica según definición |
| Define Q3 (cascadas Sec 6) | Si reglas correctas → investigar frontend · Si reglas distintas → ajustar `cascades.py` |
| Confirma Q5 (tipos OT) | Si catálogo ≠ 5 tipos → ajustar constraint Pydantic |
| Define Q6 (Railway) | Implementar backup según plan o documentar uso de backup nativo |

**Estimación total post-validación:** entre 16h (mínimo: solo Sprint 9 audit trail) y ~40h (máximo: Q3 ajustes + Q2 implementación + Q6 backup).

---

### 5. Formato y modalidad de la respuesta

Lo ideal es:

1. **Una reunión de 60-90 minutos** con vos + jefatura CMPC + Daniela (Tecno Andina) para repasar las 6 preguntas en vivo y consensuar respuestas
2. **Acta de la reunión** con las respuestas a Q1-Q6 + el OK escrito de las 31 brechas
3. **Confirmación por email** post-reunión con el acta firmada

Alternativamente, si preferís contestar por escrito, podés responder este email con tus definiciones para Q1-Q6 + adjuntar el OK escrito. En ese caso, una reunión corta posterior puede ser útil para aclarar dudas.

### 6. Disponibilidad

¿Podés indicarme **2-3 ventanas** de 1.5 horas en las próximas 2-3 semanas? Yo me adapto a la agenda de CMPC y coordino que Daniela esté disponible.

---

Quedo a tu disposición para cualquier consulta sobre el contenido del paquete, ampliación de evidencia técnica, o coordinar la reunión.

Muchas gracias por el tiempo durante todo el proyecto.

Saludos cordiales,
**Daniela Llano**
Tecno Andina · `daniela.llano@tecnoandina.cl`

---

## Anexo — Credenciales para probar la app antes de la reunión

Para que el equipo CMPC pueda **explorar el sistema en producción antes de la reunión formal**, dejo 16 usuarios fixture activos, uno por cada rol del catálogo. La password es común: `test123`.

**URL app productiva:** https://inveb-frontend-production-307c.up.railway.app

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
| Técnico de Muestras (Stgo) | `16161617-2` | `tecnicomuestras@inveb.cl` |
| Técnico de Muestras (Pte Alto) | `16161618-3` | `tecnicomuestraspuentealto@inveb.cl` |
| Técnico de Muestras (Osorno) | `16161619-4` | `tecnicomuestrasosorno@inveb.cl` |
| Vendedor Externo | `8827783-K` | `pablo.rodriguez@cmpc.com` |

Sugerencia: probar al menos con 1 rol operativo (ej Vendedor) y 1 jefatura (ej Jefe de Ventas) para validar la **visibilidad RBAC** del sistema antes de la reunión.

> ⚠️ **Nota:** estos son usuarios de DEMO. Los usuarios reales operativos de CMPC mantienen sus passwords propias. Si CMPC requiere que cambiemos las passwords de demo o las desactivemos post-cierre, indicarlo.

---

## Anexos sugeridos (PDFs adjuntos al email)

1. **`13-resumen-ejecutivo-1pag.md`** (resumen ejecutivo 1 página con métricas + URLs + credenciales)
2. **`11-validacion-admin-cmpc.md`** (este documento en versión completa con tablas detalladas)
3. **`10-informe-ejecutivo.md`** (síntesis ejecutiva del proyecto)
4. **`04-catalogo-unificado-brechas.md`** (las 77 brechas con IDs y status)
5. **`tests/certificacion-e2e-20260511.md`** (informe certificación final)
6. **`tests/auditoria-rbac-20260509.md`** (informe RBAC)
7. **(Opcional)** Listado de PRs `#1` a `#23` con links GitHub directos

---

## Notas para Daniela antes de enviar

- **Identificar al admin CMPC correcto:** este es el contacto que originalmente reportó los 5 Excels de issues. Si hay jefatura por encima (gerente comercial CMPC, compliance officer), conviene incluir en CC desde el inicio.
- **Tono:** formal pero amigable. CMPC es cliente, no contraparte adversarial. El proyecto entrega valor concreto y eso debe transmitirse.
- **Adjuntos:** convertir los `.md` a PDF para envío email (Word, Markdown-PDF, o screenshot). Los `.json` son anexos opcionales solo si CMPC los pide.
- **Si CMPC pide la reunión pero no responde por mail Q1-Q6:** llevar este documento impreso a la reunión y trabajarlo punto por punto en vivo.
- **OK escrito:** este es el documento legal que valida el cierre. Insistir en que sea explícito por email o documento firmado, no verbal.
- **Si CMPC pide tiempo para revisar antes de responder:** ofrecer 2 semanas para que internamente discutan Q1-Q6. Coordinar segunda reunión si hace falta.
- **Backup plan si CMPC no responde:** documentar formalmente la "validación pasiva" — si CMPC no objeta en 30 días tras recibir este paquete, el proyecto se considera cerrado por consenso tácito. Esto requiere acuerdo legal previo, consultar antes de invocarlo.
