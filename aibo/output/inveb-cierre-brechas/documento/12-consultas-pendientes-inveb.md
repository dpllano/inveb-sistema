# Consultas pendientes a INVEB (operación)

**Fecha:** 2026-05-11
**Proyecto:** INVEB Cierre de Brechas Legacy vs Refactor
**Cliente:** CMPC · **Stakeholder técnico:** Daniela Llano (Tecno Andina)
**Audiencia:** equipo INVEB (operación)
**Doc origen:** `documento/11-validacion-admin-cmpc.md` §3 Decisiones INVEB

---

## Email template

**Asunto:** Consultas técnico-operativas para cierre formal del proyecto INVEB Cierre de Brechas

---

Estimado equipo INVEB,

En el marco del cierre formal del proyecto **INVEB Cierre de Brechas Legacy vs Refactor** (refactor de la plataforma cotizador/OTs sobre FastAPI + React), necesitamos coordinar **3 consultas técnico-operativas** que dependen de su conocimiento del flujo de operación.

A modo de contexto: el proyecto está **técnicamente cerrado** con 22 PRs mergeados a `main`, 31 brechas funcionales resueltas, certificación E2E con 99.1% de endpoints OK, y auditoría RBAC verificada. El único bloqueador pendiente es de coordinación humana — específicamente, las preguntas a CMPC (validación de negocio) y los 3 items operativos detallados a continuación.

A continuación detallo cada consulta, su origen, el impacto en operación y la respuesta requerida.

---

## Item 1 — Workshop BRC-065: semántica de `so_planta_original` (Sec 12)

### Contexto

Durante la catalogación de brechas, el campo `so_planta_original` en la **Sección 12 "Sección Operacional Plantas"** de la OT fue identificado como una posible duplicación del campo `planta_id` (Sec 6 Asistente de Ingresos). El análisis técnico inicial (`inveb-h1/planta-heredada-sec12-decision.md`) reveló que **no son duplicados sino campos para módulos distintos**: Daniela (Tecno Andina) reconoce no conocer la lógica de negocio detrás de Sec 12.

Por esta razón, la brecha **BRC-065** fue escalada formalmente al Obj 9 Validación Admin como una pregunta para INVEB, no como una brecha técnica resoluble por ingeniería.

### Lo que necesitamos resolver

Workshop corto con un operador o supervisor que use activamente la Sec 12 en su día a día, para responder:

1. **¿`so_planta_original` debe auto-heredar el valor de `planta_id` de Sec 6** cuando el operador selecciona Planta en Sec 6, o **son campos completamente independientes** que el operador rellena manualmente?

2. **¿Cuántas plantas alternativas se usan en producción típica?** ¿1, 2, 3, más? Esto define la UI: lista fija vs lista dinámica.

3. **¿Hay reglas de negocio implícitas** entre planta_original y plantas alternativas? Por ejemplo:
   - ¿planta_alt1 debe ser de la misma región que planta_original?
   - ¿Existe un orden de prioridad obligatorio entre las alternativas?
   - ¿Las alternativas se generan automáticamente según el cliente/producto, o el operador elige libremente?

4. **¿Qué información concreta va en las "filas de detalle" por planta?** Necesitamos los campos exactos que el operador registra por cada planta alternativa.

### Formato sugerido

- **Sesión:** 45-60 minutos vía Teams/Meet
- **Participantes:** 1 operador con experiencia en Sec 12 + 1 supervisor + Daniela (Tecno Andina) + opcional CMPC
- **Output esperado:** acta corta confirmando reglas de operación, que Daniela transcribe a una spec técnica

### Impacto si no se resuelve

El refactor preserva los campos legacy de Sec 12 sin tocarlos (Schema H2 + Pydantic model_validator conservador). Funciona, pero no podemos garantizar que la lógica de negocio implícita esté correctamente espejada hasta no tener la respuesta de INVEB.

### Referencias técnicas
- BRC-065 en [`documento/catalogo-unificado.json`](../documento/catalogo-unificado.json) líneas 273-300
- Análisis previo: [`documento/06-cross-check-inveb-h1.md`](../documento/06-cross-check-inveb-h1.md) líneas 33, 113
- Comprensión: [`documento/07-comprension-brechas.md`](../documento/07-comprension-brechas.md) líneas 141-187

---

## Item 2 — Confirmación de SHA de deploy Railway (10/03 y 13/03 de 2026)

### Contexto

Durante la **catalogación de issues del admin (Obj 2)** procesamos 5 archivos Excel con observaciones reportadas por el administrador CMPC: 134 issues totales, de los cuales 66 figuran como NOK al 13/03/2026.

Algunos issues podrían estar **ya resueltos en commits posteriores** a la fecha de observación pero anteriores al deploy productivo de esa fecha. Sin saber qué SHA estaba desplegado en Railway en cada fecha de observación, debemos asumir worst-case (= issue sigue vivo), lo que infla el catálogo de brechas y nos obliga a tratar como "abierto" algo que ya podría estar cerrado.

### Lo que necesitamos resolver

Confirmar desde el dashboard de Railway:

| Fecha | Información necesaria |
|---|---|
| **10/03/2026** | SHA del commit que estaba desplegado en producción ese día |
| **13/03/2026** | SHA del commit que estaba desplegado en producción ese día |

Idealmente con timestamp UTC y, si está disponible, un screenshot del historial de deploys de Railway.

### Formato sugerido

Captura de pantalla del Deployments tab de Railway con los SHAs visibles + fecha/hora. Si Railway expone API podríamos consultar directamente, pero acceso al dashboard es lo más rápido.

### Impacto si no se resuelve

**Opcional pero recomendado.** Permite refinar la catalogación de issues admin: identificar cuáles NOK del 13/03 ya estaban resueltos en código antes de ese día (= problema de timing de deploy, no de funcionalidad) versus los realmente abiertos.

Sin este dato, el reporte ejecutivo asume worst-case (66 NOK vivos al 13/03), pero el catálogo refinado podría bajar ese número significativamente.

### Referencias técnicas
- 5 Excels procesados: `documento/catalogo-issues-admin-clasificado.json`
- Total contexto: [`documento/10-informe-ejecutivo.md`](../documento/10-informe-ejecutivo.md) líneas 95-100
- Item documentado en [`documento/11-validacion-admin-cmpc.md`](../documento/11-validacion-admin-cmpc.md) §3 fila 2

---

## Item 3 — Activación de procesos post-validación CMPC

### Contexto

Una vez CMPC responda las preguntas de validación (Q1-Q6 detalladas en `documento/11-validacion-admin-cmpc.md`), INVEB necesitará **activar procesos operativos** según la dirección que CMPC defina. Específicamente, las dependencias son:

#### Si CMPC confirma Mundo A (CMPC-Q1 — Múltiples destinos de Muestra)

> Pregunta CMPC: *"Cuando un Diseñador Técnico crea una Muestra con destinos = [Vendedor, Diseñador, Cliente_X], ¿espera ver 1 muestra master + N réplicas para los Clientes (legacy) o 1 sola muestra con array de destinos (refactor simplificado)?"*

→ INVEB debe **activar el flujo operativo de múltiples muestras** en el área de Muestras: cada réplica para Cliente va a un destinatario distinto y requiere tracking individual de fechas/observaciones por réplica. El refactor implementa Mundo A (legacy) en Sprint 5 PR #6 ([BRC-022 a BRC-027](../documento/catalogo-unificado.json)).

#### Si CMPC define reglas de cascadas Sec 6 (CMPC-Q3)

> Pregunta CMPC: *"Los listados de Recubrimiento Interno/Externo, Planta Objetivo y Cartón en Sec 6 Asistente deben filtrarse por el contexto de la OT (CINTA=SI excluye opciones X, FSC excluye opciones Y, etc). ¿Las reglas de filtrado documentadas en `coverage_internal.cinta_si_aplica/cinta_no_aplica` son las correctas y exhaustivas?"*

→ Si CMPC confirma las reglas como correctas, INVEB debe **comunicar a los usuarios finales** que el filtrado de listas en Sec 6 funcionará según esas reglas. Si CMPC define reglas distintas, INVEB participa de la **redocumentación operativa** (qué combinaciones de OT producen qué listas filtradas).

Este item afecta 11 brechas catalogadas: **BRC-028 a BRC-038**. Sprint 7 verificó que el backend ya aplica filtros, pero el comportamiento puede no coincidir con la operación real.

### Lo que necesitamos resolver

Compromiso de un punto de contacto INVEB que, una vez recibida la respuesta CMPC:

1. **Coordine la activación operativa** del flujo Mundo A en Muestras (si aplica)
2. **Comunique a los usuarios** las reglas finales de filtrado Sec 6 (si aplica)
3. **Confirme con Daniela** la fecha objetivo de activación efectiva

### Formato sugerido

- Reunión de **30 minutos** post-validación CMPC, con Daniela presente, para repasar las definiciones y acordar fechas
- No requiere preparación previa de INVEB — se trabaja sobre las respuestas CMPC

### Impacto si no se resuelve

Las preguntas CMPC pueden quedar respondidas pero la operación INVEB no se actualiza. Eso deja un gap entre "lo decidido formalmente" y "lo que el operador hace cada día", el problema original que motivó este proyecto.

### Referencias técnicas
- CMPC-Q1 detalle: [`documento/11-validacion-admin-cmpc.md`](../documento/11-validacion-admin-cmpc.md) líneas 75-87
- CMPC-Q3 detalle: [`documento/11-validacion-admin-cmpc.md`](../documento/11-validacion-admin-cmpc.md) líneas 100-115
- Brechas afectadas BRC-022 a 027 (Q1) + BRC-028 a 038 (Q3): [`documento/catalogo-unificado.json`](../documento/catalogo-unificado.json)

---

## Orden sugerido de coordinación

1. **PRIMERO — Reunión CMPC** (bloqueador principal del cierre formal del proyecto)
   - 6 preguntas Q1-Q6 + OK escrito de las 31 brechas cerradas en código
   - Entry point: `documento/11-validacion-admin-cmpc.md`

2. **SEGUNDO — Item 1 INVEB (Workshop BRC-065)**
   - Puede hacerse en paralelo a la reunión CMPC si hay disponibilidad
   - Independiente del resto

3. **TERCERO — Item 2 INVEB (Deploy SHA Railway)**
   - Solo si se decide refinar la catalogación de issues admin (opcional)
   - No bloquea el cierre, lo refina

4. **CUARTO — Item 3 INVEB (Activación de procesos)**
   - Recién después de tener las respuestas CMPC (depende de Q1 y Q3)
   - Cierra el bucle entre decisión formal y operación

---

## Resumen ejecutivo

| Item | Tipo | Esfuerzo INVEB | Dependencia | Criticidad |
|---|---|---|---|---|
| 1. Workshop BRC-065 | Sesión técnica 60min | 1 operador + 1 supervisor | Independiente | Alta (Obj 9) |
| 2. Deploy SHA Railway | Captura dashboard | 5-15 min | Independiente | Media (refinamiento) |
| 3. Activación procesos | Reunión 30min | 1 punto de contacto | Depende de respuesta CMPC | Alta (post-CMPC) |

**Total esfuerzo INVEB:** ~2-3 horas distribuidas en 2-3 sesiones cortas.

---

## Datos de contacto y artefactos

- **Repositorio GitHub:** https://github.com/dpllano/inveb-sistema
- **PRs auditables:** `#1` a `#22` (todos mergeados a `main`)
- **Documentos técnicos del proyecto:** `aibo/output/inveb-cierre-brechas/`
  - 17 documentos físicos (contexto, mapeo, catálogo, diff, comprensión, specs, validación)
  - 2 informes de certificación (RBAC + E2E final)
- **Stack del proyecto:** FastAPI 0.109 + SQLModel 0.0.14 + React 18 + Vite 5 + MySQL Railway
- **Punto de contacto técnico:** Daniela Llano (`daniela.llano@tecnoandina.cl`)

Quedo a disposición para coordinar fechas, ampliar contexto sobre cualquiera de los 3 items, o adjuntar documentación adicional según necesiten.

Saludos cordiales,
Daniela Llano
Tecno Andina

---

## Anexo: cómo usar este template

1. **Personalizar el saludo** según destinatarios INVEB específicos (incluir nombres si aplica)
2. **Ajustar fechas sugeridas** según disponibilidad
3. **Adjuntar como PDF** los docs físicos referenciados (especialmente `11-validacion-admin-cmpc.md` y `10-informe-ejecutivo.md`)
4. **Considerar split en 3 emails** si los items van a destinatarios diferentes:
   - Item 1 → operador/supervisor Sec 12
   - Item 2 → DevOps INVEB / acceso Railway dashboard
   - Item 3 → punto de contacto comercial/operacional INVEB
