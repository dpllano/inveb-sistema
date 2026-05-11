# Email 1 — Workshop Sec 12 Plantas (BRC-065)

**Destinatario:** Operador / supervisor con experiencia operativa en **Sec 12 Sección Operacional Plantas** de las OTs INVEB
**CC:** punto de contacto operacional INVEB · Daniela Llano (Tecno Andina)
**Prioridad:** Alta (bloquea cierre formal del Obj 9)

---

## Asunto sugerido

> **[INVEB] Workshop 45 min — clarificación operativa Sec 12 Plantas (campo `so_planta_original`)**

---

## Cuerpo del email

Estimad\@ [nombre operador/supervisor],

Te escribo desde Tecno Andina, equipo a cargo del refactor de la plataforma INVEB de cotizaciones y OTs. Estamos en la **etapa final** de cierre del proyecto (22 PRs ya mergeados, certificación E2E con 99.1% de cobertura OK), y nos queda **una sola consulta operativa** que necesita tu experiencia directa con el sistema.

Durante la revisión técnica detectamos un módulo que ningún integrante actual del equipo técnico conoce a fondo: la **Sección 12 "Sección Operacional Plantas"** de las OTs, específicamente el campo `so_planta_original` y sus campos relacionados de plantas alternativas. Los nombres sugieren una relación con la Planta de Sec 6 Asistente de Ingresos, pero no podemos asumirlo sin confirmación de alguien que use Sec 12 en su día a día.

**Te pido 45-60 minutos** vía Teams/Meet para responder 4 preguntas concretas. Si preferís, podés contestarlas también por escrito, pero un workshop corto suele ser más eficiente porque las respuestas suelen abrir sub-preguntas.

### Las 4 preguntas

1. **¿`so_planta_original` debe auto-heredar el valor que el operador seleccionó como Planta en Sec 6 Asistente, o son campos completamente independientes que el operador rellena a mano cada vez?**
   - Si es auto-herencia: necesitamos saber si se puede sobreescribir manualmente después.
   - Si es independiente: necesitamos saber por qué tienen nombres similares y qué los diferencia operativamente.

2. **¿Cuántas plantas alternativas se usan típicamente en producción?**
   - 1 (solo la original)
   - 2 (original + 1 alternativa)
   - 3 o más
   - Variable según el caso
   - Esto define si la UI debe mostrar campos fijos (planta_alt1, planta_alt2…) o una lista dinámica donde se agregan filas.

3. **¿Hay reglas de negocio implícitas entre planta_original y las alternativas?**
   - ¿Las alternativas deben ser de la misma región/zona que la original?
   - ¿Hay un orden de prioridad obligatorio (ej: planta_alt1 siempre debe ser más cercana que planta_alt2)?
   - ¿Las alternativas se sugieren automáticamente según el cliente o producto, o el operador elige libremente del catálogo?

4. **¿Qué información concreta va en las "filas de detalle" por planta alternativa?**
   - ¿Es solo la planta, o también capacidad, fecha disponible, prioridad, observaciones?
   - ¿Esos campos de detalle son los mismos para la planta original?

### Formato de la sesión

- **Duración:** 45 minutos (extendemos a 60 si hace falta)
- **Modalidad:** Teams o Meet, lo que les sea más cómodo
- **Participantes mínimos:** vos + Daniela Llano (Tecno Andina). Si podés invitar a un colega con experiencia complementaria en Sec 12, mejor.
- **Output:** Daniela documenta las respuestas como acta corta + spec técnica para implementar (o confirmar que la implementación actual ya es correcta)
- **Sin preparación previa:** las preguntas se trabajan en vivo, basta con tu conocimiento del día a día

### Impacto si no podemos resolverlo

El refactor actualmente **preserva** los campos legacy de Sec 12 sin modificarlos (conservador). Funciona correctamente para los casos comunes, pero no podemos garantizar que la lógica de negocio implícita esté correctamente representada hasta que tengamos tu input. Sin esta sesión, el campo queda como **brecha BRC-065 sin cerrar formalmente** en la auditoría del proyecto.

### Disponibilidad

¿Podés indicarme 2-3 ventanas de 1 hora en las próximas 2 semanas? Yo me adapto a tu agenda. Si preferís delegar a otra persona del equipo con más exposición a Sec 12, también funciona.

Quedo atent\@ y muchas gracias por el tiempo.

Saludos,
**Daniela Llano**
Tecno Andina · `daniela.llano@tecnoandina.cl`

---

## Anexos sugeridos

- (Opcional) Screenshot de la Sec 12 actual de las OTs en producción Railway, para que el operador confirme visualmente de qué módulo hablamos
- (Opcional) Documento [`07-comprension-brechas.md`](../07-comprension-brechas.md) líneas 141-187 — solo si el destinatario es técnico y quiere ver el análisis previo

## Notas para Daniela antes de enviar

- **Identificar al destinatario correcto:** este email asume un perfil "operador con experiencia Sec 12". Si no sabés quién, preguntá primero al punto de contacto INVEB general por la persona indicada.
- **El email puede ir en frío:** no requiere conocimiento previo del proyecto refactor, las 4 preguntas son self-contained.
- **Si la respuesta es "el módulo nunca se usó en producción":** ese también es un output válido (significa que se puede borrar del refactor sin riesgo).
