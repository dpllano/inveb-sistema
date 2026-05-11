# Email 2 — Confirmación deploy SHA Railway (10/03 + 13/03)

**Destinatario:** DevOps INVEB / responsable acceso dashboard Railway
**CC:** punto de contacto operacional INVEB · Daniela Llano (Tecno Andina)
**Prioridad:** Media (refinamiento, no bloqueador del cierre)

---

## Asunto sugerido

> **[INVEB] Consulta DevOps — SHA de deploys Railway productivo 10/03 y 13/03/2026 (5 min)**

---

## Cuerpo del email

Hola [nombre DevOps INVEB],

Te escribo desde Tecno Andina, equipo a cargo del refactor de la plataforma INVEB. Necesito una **consulta rápida al dashboard de Railway** (5-15 minutos de tu tiempo) para refinar el cierre formal del proyecto.

### Contexto breve

Durante la catalogación de issues del admin CMPC procesamos **5 archivos Excel** con observaciones reportadas en distintas fechas. El consolidado da **66 issues marcados como NOK al 13/03/2026**. Sospechamos que **una parte de esos 66 ya estaba resuelta en código** antes del 13/03, pero el deploy productivo en Railway pudo haber ocurrido después de la fecha de observación, dejando al admin viendo un comportamiento ya corregido en el repo pero todavía no desplegado.

Para refinar el catálogo (= bajar el número de "abiertos" reales) necesitamos correlacionar fechas:

| Fecha observación admin | Lo que necesito |
|---|---|
| **10/03/2026** | SHA del commit que estaba desplegado en producción ese día (Railway) |
| **13/03/2026** | SHA del commit que estaba desplegado en producción ese día (Railway) |

### Lo que necesito específicamente

Idealmente:

1. Abrir el dashboard de Railway → proyecto INVEB Sistema → tab **Deployments** o **Activity**
2. Identificar qué deploy estaba **activo** en cada una de las 2 fechas (10/03 y 13/03/2026)
3. Capturar el **SHA del commit** (los primeros 7-10 caracteres alcanzan) y el **timestamp UTC** del deploy
4. Enviarme un screenshot del historial o copiar/pegar los 2 SHAs por respuesta de email

### Formato de la respuesta

```
Deploy activo el 10/03/2026:
  SHA: abc1234...
  Desplegado: 2026-03-09 14:30 UTC (o la fecha real)

Deploy activo el 13/03/2026:
  SHA: def5678...
  Desplegado: 2026-03-12 09:15 UTC (o la fecha real)
```

Un screenshot de la lista de deploys también sirve perfecto.

### Si Railway tiene API expuesta

Si tenés script o acceso a la API REST de Railway que pueda darme el historial completo de deploys del último trimestre, también me sirve. Yo puedo procesarlo del lado nuestro.

### Por qué es importante

Sin estos SHAs, en el informe ejecutivo asumimos **worst-case**: que los 66 NOK al 13/03 siguen abiertos en código. Con los SHAs podemos cruzarlos contra el `git log` del repo y separar:

- **Cerrados en código + ya desplegados al 13/03** → bug real abierto
- **Cerrados en código pero no desplegados al 13/03** → falso positivo del admin (= ya resuelto, solo faltaba deploy)

El número refinado probablemente baje significativamente el catálogo de "abiertos", lo que mejora la presentación del cierre del proyecto a CMPC.

### Importante: NO es bloqueador

Si esto te lleva más de **30 minutos** o requiere coordinar con otra persona (acceso al dashboard, permisos, etc), **no es prioritario**. Es un refinamiento opcional. El proyecto cierra técnicamente igual con worst-case asumido.

Si por contexto te resulta trivial (ej: ya tenés acceso y el historial está visible) → bienvenido, mejoramos el reporte. Si es complicado → me avisás y lo dejamos como tarea pendiente o lo asumimos.

### Disponibilidad

¿Podés contestarme en los próximos 5-7 días hábiles? Si no llegás antes de la reunión final con CMPC, simplemente avisame y seguimos sin esta data.

Muchas gracias por el tiempo.

Saludos,
**Daniela Llano**
Tecno Andina · `daniela.llano@tecnoandina.cl`

---

## Anexos sugeridos

- (Opcional) Lista de los 5 Excels procesados con sus fechas, si el destinatario quiere ver el contexto completo: `documento/catalogo-issues-admin-clasificado.json`

## Notas para Daniela antes de enviar

- **Identificar al DevOps INVEB:** si no hay DevOps dedicado, este email puede ir al responsable de operaciones técnicas o al contacto que históricamente despliega a Railway. Si Railway está gestionado por Tecno Andina y no por INVEB, este email no aplica — la info está del lado tuyo.
- **El email es low-priority:** asumir que puede no responderse antes de la reunión CMPC y no perder tiempo persiguiéndolo.
- **Si Railway ya no tiene los logs del 10-13/03** (retención < 60 días en plan Hobby), responder al destinatario que asumimos worst-case y cerrar el item.
