# Paquete de Comunicación Final — INVEB Cierre de Brechas

**Fecha:** 2026-05-11
**Proyecto:** INVEB Cierre de Brechas Legacy vs Refactor
**Cliente:** CMPC · **Stakeholder técnico:** Daniela Llano (Tecno Andina)

Este directorio contiene los **4 emails listos para enviar** que cierran formalmente el proyecto. Cada uno está auto-contenido (no requiere contexto adicional para el destinatario) y tiene su propia sección de **"Notas para Daniela antes de enviar"** al final con tips prácticos.

---

## Resumen ejecutivo de los 4 emails

| # | Archivo | Destinatario | Prioridad | Bloquea | Cuándo enviar |
|---|---|---|---|---|---|
| **4** | [email-4-validacion-formal-cmpc.md](email-4-validacion-formal-cmpc.md) | **Admin CMPC + jefatura comercial** | 🚨 **CRÍTICA** | Cierre formal del proyecto | **PRIMERO** — bloqueador principal |
| **1** | [email-1-workshop-sec12-plantas.md](email-1-workshop-sec12-plantas.md) | Operador / supervisor Sec 12 INVEB | 🔴 Alta | Obj 9 (resuelve BRC-065) | En paralelo a CMPC si hay disponibilidad |
| **2** | [email-2-deploy-sha-railway.md](email-2-deploy-sha-railway.md) | DevOps INVEB / acceso Railway | 🟡 Media | Refinamiento opcional | Cuando guste — no urgente |
| **3** | [email-3-activacion-procesos-post-cmpc.md](email-3-activacion-procesos-post-cmpc.md) | Contacto comercial/operacional INVEB | 🔴 Alta | Cierre operativo del proyecto | **SOLO post-respuesta CMPC** |

---

## Orden de envío recomendado

### Fase 1 — Apertura del cierre (esta semana)

```
┌─────────────────────────────────────────┐
│  Email 4 (CMPC)  →  reunión validación  │  ← 🚨 lo más importante
│                                          │
│  Email 1 (Sec 12)  →  workshop INVEB     │  ← en paralelo, no depende de CMPC
└─────────────────────────────────────────┘
```

Estos 2 emails se pueden enviar **el mismo día**. Email 1 a INVEB y Email 4 a CMPC. Coordinar agendas en paralelo.

### Fase 2 — Opcional (sin presión)

```
┌─────────────────────────────────────────┐
│  Email 2 (Railway SHA)  → DevOps INVEB  │  ← refinamiento, no urgente
└─────────────────────────────────────────┘
```

Si tenés contacto fluido con el DevOps INVEB y la captura es trivial, mandar Email 2 cuando convenga. Si toma esfuerzo, postergar o saltar.

### Fase 3 — Post-CMPC

```
┌─────────────────────────────────────────┐
│  ⚠️  ESPERAR respuestas CMPC Q1-Q6      │
│       y workshop INVEB BRC-065          │
│                                          │
│  Email 3 (Activación)  →  contacto INVEB │  ← coordina la operativa
└─────────────────────────────────────────┘
```

Email 3 se envía **únicamente** cuando ya tenemos las respuestas CMPC (al menos Q1 y Q3) y, idealmente, el resultado del workshop INVEB Sec 12.

---

## Resumen del contenido de cada email

### 📧 Email 4 — CMPC (validación formal)

**Lo más importante.** Contiene:

- Las **6 preguntas Q1-Q6** desarrolladas con (a) pregunta concreta, (b) qué implementó el refactor, (c) acción esperada de CMPC
- Solicitud de **OK escrito** para las 31 brechas cerradas
- Plan post-validación según respuestas
- Propuesta de modalidad: reunión 60-90 min + acta firmada

**Anexos sugeridos (5 PDFs):**
- `11-validacion-admin-cmpc.md` (paquete completo)
- `10-informe-ejecutivo.md`
- `04-catalogo-unificado-brechas.md`
- `tests/certificacion-e2e-20260511.md`
- `tests/auditoria-rbac-20260509.md`

### 📧 Email 1 — INVEB Workshop Sec 12

Workshop operativo 45-60 min con operador de Sec 12 para resolver **BRC-065 / `so_planta_original`**. 4 preguntas concretas self-contained:

1. Auto-herencia vs independencia con planta de Sec 6
2. Cantidad de plantas alternativas típicas en producción
3. Reglas de negocio implícitas (región, orden, dependencias)
4. Información en filas de detalle por planta

### 📧 Email 2 — INVEB DevOps Railway SHA

Consulta breve al dashboard Railway para capturar **SHA del deploy productivo** en 10/03 y 13/03/2026. Refinamiento opcional que permite separar los 66 NOK del admin entre:

- Cerrados en código + ya desplegados → bug real
- Cerrados en código pero no desplegados → falso positivo (issue de timing)

Marcado explícitamente como NO bloqueador.

### 📧 Email 3 — INVEB Activación procesos

Reunión 30 min **post-CMPC** para coordinar la **activación operativa** de las definiciones que CMPC tome en Q1 (Mundo A muestras) y Q3 (reglas cascadas Sec 6). Cierra el bucle entre decisión formal y operación en piso.

---

## Stakeholders y matriz de comunicación

| Stakeholder | Email asociado | Responsabilidad |
|---|---|---|
| **Admin CMPC** | Email 4 | Valida las 6 preguntas + da OK escrito de 31 brechas |
| **Jefatura CMPC** (gerente comercial/operación) | Email 4 (CC) | Aprueba formalmente el cierre del proyecto |
| **Compliance CMPC** (si aplica) | Email 4 (CC) | Define scope de audit trail Q4 |
| **Infraestructura CMPC** | Email 4 (CC) | Decide Q6 (Railway vs propio) |
| **Operador Sec 12 INVEB** | Email 1 | Workshop sobre `so_planta_original` |
| **DevOps INVEB / Railway** | Email 2 | Consulta SHA deploys (opcional) |
| **Contacto operacional INVEB** | Email 3 | Activa procesos en Muestras + Sec 6 |
| **Daniela Llano (Tecno Andina)** | Emite los 4 emails | Coordinación + acta + cierre formal |

---

## Estado del proyecto al momento de enviar

| Capa | Estado |
|---|---|
| Objetivos del flujo metodología | **10/10 = 100% ✅** |
| PRs mergeados a main | **22** (`#1` a `#22`) |
| Brechas cerradas en código | **31** |
| Documentos físicos producidos | **18** (en `aibo/output/inveb-cierre-brechas/`) |
| Tests | 424 passed, sin regresiones |
| Certificación E2E | 99.1% OK (107/108 endpoints) |
| Auditoría RBAC | 0 leaks, 0 bloqueos falsos |

**Bloqueador único:** coordinación humana con CMPC + INVEB (este paquete de emails).

---

## Checklist pre-envío

Antes de enviar cada email, verificar:

- [ ] **Destinatario correcto identificado** (preguntar al contacto INVEB/CMPC si no sabés quién)
- [ ] **Adjuntos preparados** (los `.md` referenciados convertidos a PDF)
- [ ] **Tono ajustado** según relación con destinatario (formal vs informal)
- [ ] **Email enviado desde casilla de Tecno Andina** (no personal)
- [ ] **CC apropiados** según matriz de comunicación arriba
- [ ] **Calendario actualizado** con bloque para respuestas esperadas (CMPC ~2 semanas)

---

## Si necesitás iterar sobre algún email

Cualquiera de los 4 emails se puede ajustar libremente:

- Personalizar saludo y cierre con nombres reales
- Ajustar fechas según disponibilidad efectiva
- Agregar/quitar anexos según necesite el destinatario
- Cambiar tono (más informal si la relación lo permite, más formal si es primer contacto)

Las "Notas para Daniela antes de enviar" al final de cada archivo tienen sugerencias específicas.

---

## Persistencia en MCP memoria

Estos 4 emails están persistidos como post-its sobre el aprendizaje final del proyecto:

- **Aprendizaje ancla:** `apr-h9uf9r-1778511300156` (Sprint 4 Final cierre técnico)
- **Post-its asociados:**
  - `postit-palpito-n6f2ws-1778511676981-0` (template inicial `12-consultas-pendientes-inveb.md`)
  - `postit-palpito-r2bnwa-1778511890474-0` (split 3 emails INVEB)

El email CMPC (Email 4) se persiste a continuación como tercer post-it sobre el mismo aprendizaje.

---

**Cualquier ajuste o duda, los archivos `.md` son tu fuente. Cada uno es self-contained.**
