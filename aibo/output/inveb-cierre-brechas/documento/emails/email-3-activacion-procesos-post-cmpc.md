# Email 3 — Activación de procesos post-validación CMPC

**Destinatario:** Punto de contacto comercial / operacional INVEB (perfil de coordinación, no técnico)
**CC:** Daniela Llano (Tecno Andina) · (opcional CMPC si ya hubo reunión)
**Prioridad:** Alta, pero **post-CMPC** (no enviar hasta tener respuestas CMPC en mano)

---

## Asunto sugerido

> **[INVEB] Coordinación operativa — activación de procesos post-validación CMPC del refactor**

---

## Cuerpo del email

Estimad\@ [nombre contacto operacional INVEB],

Te escribo para coordinar la **última etapa operativa** del cierre del proyecto refactor INVEB que viene ejecutando Tecno Andina con CMPC. El proyecto está técnicamente cerrado (22 PRs mergeados, certificación E2E con 99.1% de cobertura), y ya tuvimos / vamos a tener la reunión de validación con CMPC. **El siguiente paso depende de INVEB.**

### Contexto en 3 líneas

1. El refactor tomó decisiones de diseño que estaban implícitas en el legacy y nunca documentadas formalmente.
2. CMPC respondió **6 preguntas formales** validando o ajustando esas decisiones.
3. Algunas respuestas tienen impacto operativo en el día a día de INVEB → necesitamos coordinar la activación.

### Lo que necesito de tu lado

Una reunión de **30 minutos** post-respuesta CMPC para repasar dos definiciones concretas y acordar fechas de activación operativa:

#### Definición 1 — Flujo de múltiples destinos de Muestra (CMPC-Q1)

Pregunta que CMPC validó:

> *"Cuando un Diseñador Técnico crea una Muestra con destinos = [Vendedor, Diseñador, Cliente_X], el sistema debe ver **1 muestra master + N réplicas para los Clientes** (Mundo A, comportamiento legacy) o **1 sola muestra con array de destinos** (Mundo B, simplificado)."*

**Si CMPC confirma Mundo A** (que es lo que el refactor ya tiene implementado):
- INVEB necesita **comunicar al área de Muestras** que cada réplica para un Cliente es una entidad propia
- Cada réplica tiene tracking individual de fechas, observaciones y estado
- Los operadores del área deben saber que verán múltiples filas (una por destino Cliente) en lugar de una sola
- **Brechas cerradas en código:** BRC-022 a BRC-027 (6 brechas)

**Si CMPC cambia a Mundo B**:
- Aplicar un hotfix en código (Tecno Andina ejecuta)
- INVEB comunica el cambio de modelo a operadores

#### Definición 2 — Reglas de filtrado de listas en Sec 6 Asistente (CMPC-Q3)

Pregunta que CMPC validó:

> *"Los listados de Recubrimiento Interno/Externo, Planta Objetivo y Cartón en Sec 6 deben filtrarse por contexto de la OT. Por ejemplo: si CINTA=SI, algunas opciones quedan excluidas; si FSC=valor X, otras se filtran. Las reglas documentadas en la BD legacy (campos `cinta_si_aplica`, `cinta_no_aplica`, etc.) ¿son las correctas y exhaustivas?"*

**Si CMPC confirma las reglas como correctas:**
- INVEB comunica a los usuarios finales que el filtrado funcionará según esas reglas
- Recomendable un mensaje breve por email interno o un cartel breve en la app
- **Brechas cerradas en código:** BRC-028 a BRC-038 (11 brechas)

**Si CMPC define reglas distintas:**
- Tecno Andina implementa los cambios en `cascades.py`
- INVEB participa de la **redocumentación operativa** — qué combinaciones de OT producen qué listas filtradas
- Posiblemente requiera capacitación corta a operadores

### Lo que pido concretamente

1. **Designar un punto de contacto INVEB** (si no sos vos directamente) que pueda coordinar la activación con las áreas de Muestras y Operaciones (Sec 6)
2. **Agendar reunión de 30 minutos** dentro de los 5-7 días posteriores a la respuesta de CMPC, con Daniela presente
3. **Acordar fecha objetivo** de activación efectiva en producción (típicamente 1-2 semanas post-reunión)

### Formato

- **No requiere preparación previa de INVEB** — se trabaja sobre las respuestas CMPC en vivo
- **Output esperado:** acta corta con (a) confirmación del modelo Q1 (b) confirmación de reglas Q3 (c) responsable de comunicación interna por cada área (d) fecha objetivo
- **Participantes mínimos:** vos (o el contacto designado) + Daniela. Si querés invitar a un referente de Muestras u Operaciones, mejor

### Impacto si no se coordina

Las preguntas de CMPC pueden quedar respondidas formalmente pero la operación INVEB no se actualizar a la nueva forma de trabajar. Eso deja exactamente el **gap original** que motivó este proyecto: una decisión existe, pero el operador en piso no la conoce y sigue trabajando como antes. Cerrar este paso es lo que convierte el cierre formal del refactor en un cierre **efectivo**.

### Estado actual del proyecto

A modo de referencia rápida:

- **22 PRs** mergeados a main (auditables en GitHub)
- **31 brechas** cerradas en código
- **17 documentos técnicos** producidos
- **99.1% E2E OK** en certificación final
- **Bloqueador único:** este item + respuesta formal CMPC

Quedo a la espera de tu confirmación para agendar la reunión, idealmente dentro de las próximas **2 semanas** luego de la respuesta CMPC.

Muchas gracias y buen día.

Saludos cordiales,
**Daniela Llano**
Tecno Andina · `daniela.llano@tecnoandina.cl`

---

## Anexos sugeridos

- [`documento/11-validacion-admin-cmpc.md`](../11-validacion-admin-cmpc.md) — solo si el destinatario quiere ver las 6 preguntas CMPC completas para contexto
- [`documento/10-informe-ejecutivo.md`](../10-informe-ejecutivo.md) — informe ejecutivo del proyecto

## Notas para Daniela antes de enviar

- **NO enviar antes de tener al menos un avance con CMPC.** Si CMPC todavía no respondió, este email pierde sentido y crea ruido.
- **Tono ajustable según relación con el destinatario:** si es un contacto frecuente, podés bajar la formalidad. Si es primer contacto, mantener el tono actual.
- **Adaptar el grado de detalle de las definiciones según el perfil:**
  - Si es perfil técnico → mantener el detalle de Mundo A/B y `cascades.py`
  - Si es perfil pura coordinación → podés simplificar a "necesitamos coordinar comunicación a operadores de Muestras y Sec 6"
- **Si una de las preguntas CMPC quedó sin responder:** mencionarlo en el email para que INVEB sepa que esa parte queda pendiente
