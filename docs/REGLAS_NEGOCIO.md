# Reglas de Negocio - INVEB

Este documento contiene las reglas de negocio extraídas del sistema Laravel original.

---

## 1. Clientes e Instalaciones

### Regla 1.1: Relación Cliente-Instalación
- Un cliente puede tener múltiples instalaciones
- Cada instalación pertenece a un único cliente
- **Fuente Laravel:** `app/Client.php` relación `instalaciones()`

### Regla 1.2: Contactos por Instalación
- Los contactos están asociados a instalaciones específicas
- Al seleccionar instalación, se cargan sus contactos
- **Fuente Laravel:** `ClientController@getContactosCliente`

---

## 2. Cascadas de Validación

### Regla 2.1: Impresión (Issue 20)
- Filtrar ID=1 (Offset) de las opciones
- NO mostrar: "Sin Impresión (Solo OF)" ID=6, "Sin Impresión (Trazabilidad Completa)" ID=7
- Solo mostrar: Flexografía y variantes
- **Fuente Laravel:** `WorkOrderController.php` línea 710: `Impresion::where('status', 1)->whereNotIn('id', [1])`
- **Endpoint FastAPI:** GET /cascades/impresiones

### Regla 2.2: CINTA → Recubrimiento Interno (Issue 22)
- Cuando CINTA=SI (1): Solo mostrar "No Aplica" (ID=1) y "Barniz Hidropelente" (ID=2)
- Cuando CINTA=NO (0): Mostrar todas las opciones activas
- **Fuente Laravel:** `WorkOrderController@getRecubrimientoInterno` líneas 10100-10113
- **Endpoint FastAPI:** GET /cascades/recubrimiento-interno?cinta=1

### Regla 2.3: Impresión → Recubrimiento Externo (Issue 23)
- Las opciones de recubrimiento externo dependen de la impresión seleccionada
- Se usa tabla `relacion_filtro_ingresos_principales` para filtrar
- **Fuente Laravel:** `WorkOrderController@getRecubrimientoExterno` líneas 10117-10143
- **Endpoint FastAPI:** GET /cascades/recubrimiento-externo?impresion_id=X

### Regla 2.4: Planta Objetivo (Issue 24)
- Solo mostrar plantas activas (`active=1`)
- Filtrar según recubrimiento interno, impresión y recubrimiento externo seleccionados
- Se usa campo `planta_id` en `coverage_internal` y `relacion_filtro_ingresos_principales`
- **Fuente Laravel:** `WorkOrderController@getPlantaObjetivo` líneas 10146-10160
- **Endpoint FastAPI:** GET /cascades/plantas-objetivo?recubrimiento_interno_id=X&impresion_id=Y&recubrimiento_externo_id=Z

---

## 3. CAD (Diseño)

### Regla 3.1: Carga automática de datos
Al seleccionar un CAD, cargar automáticamente:
- Largura HM
- Anchura HM
- Área Producto
- Recorte Adicional
- Rayados
- Veces item
- Medidas interiores (largo, ancho, alto)
- Medidas exteriores (largo, ancho, alto)

**Fuente Laravel:** `WorkOrderController@getCad`

---

## 4. Formularios

### Regla 4.1: Formato de decimales (Issues 37, 38)
- Aceptar coma (,) como separador decimal
- Convertir a punto (.) antes de guardar
- **Campos:** ECT MIN (LB/PULG), FCT (LB/PULG2)
- **Fuente Laravel:** `str_replace(",", ".", $valor)` antes de guardar
- **Implementación FastAPI:** Utilidad `normalizeDecimalInput()` en `frontend/src/utils/decimal.ts`
- **Uso en CreateWorkOrder.tsx:**
  ```typescript
  import { normalizeDecimalInput } from '../../utils/decimal';
  // Input con type="text" e inputMode="decimal" para permitir coma
  <Input
    type="text"
    inputMode="decimal"
    placeholder="Ej: 12,5 o 12.5"
    value={formState.ect_min_lb_pulg !== null ? String(formState.ect_min_lb_pulg).replace('.', ',') : ''}
    onChange={(e) => handleInputChange('ect_min_lb_pulg', normalizeDecimalInput(e.target.value))}
  />
  ```
- **Estado:** ✅ Implementado

### Regla 4.2: Archivos obligatorios (Issue 8)
- Cuando OC=SI, archivo OC es obligatorio
- **Fuente Laravel:** Validación en `ot-form-validation.js` líneas 872-875
- **Implementación FastAPI:** Validación en `validateForm()` de CreateWorkOrder.tsx
- **UI:** Indicador visual cuando OC=SI muestra "*Obligatorio" y cambia color del icono
- **Estado:** ✅ Implementado

### Regla 4.3: Campos Distancia Cinta (Issue 42)
- Solo mostrar cuando CINTA=SI
- Campos: corte_liner, tipo_cinta, cintas_x_caja, distancia_cinta_1 a distancia_cinta_6
- **Fuente Laravel:** `WorkOrderController` líneas 3183-3247

### Regla 4.4: Planta en Secuencia Operacional (Issue 50)
- La planta en Sección 12 hereda de la Sección 6
- Campo es de solo lectura (no se puede cambiar)
- **Fuente Laravel:** `ot-creation.js` líneas 720-770, campo `sec_ope_planta_orig_id` heredado de `planta_id`
- **Implementación FastAPI:**
  - `useEffect` en CreateWorkOrder.tsx sincroniza `so_planta_original` con `cascadeData.plantaId`
  - Campo `disabled={true}` con estilo visual "Heredado de Sección 6"
- **Estado:** ✅ Implementado

---

## 5. Opciones de Catálogos

### Regla 5.1: Proceso (Issue 47)
- Cargar desde tabla `processes` donde `active=1` y `type='EV'`
- **Endpoint FastAPI:** GET /form-options/procesos
- **Fuente Laravel:** `form_options.py:173-193`

### Regla 5.2: Armado (Issue 48)
- Cargar desde tabla `armados` donde `active=1`
- Opciones esperadas según Excel: "Armado a máquina", "Sin armado", "Dual"
- **Nota:** Verificar datos en BD - seeder Laravel tiene: "Armado a Maquina", "Con/Sin Armado", "Manual"
- **Endpoint FastAPI:** GET /form-options/armados
- **Fuente Laravel:** `ArmadosTableSeeder.php`

### Regla 5.3: Servicios Maquila (Issue 49)
- Cargar desde tabla `maquila_servicios` donde `active=1`
- Filtrar por `product_type_id` segun tipo de producto seleccionado
- Opciones esperadas para Caja: "PM CJ Chica entre 0 y 30 Cm", "PM CJ Grande entre 70 y 100 Cm", "PM CJ mediana entre 30 y 70 Cm"
- **Endpoint FastAPI:** GET /mantenedores/generic/maquila_servicios
- **Fuente Laravel:** `DetalleCotizacionController@getServiciosMaquila`

### Regla 5.4: Certificado Calidad (Issue 29)
- Cargar desde tabla `pallet_qas` donde `active=1`
- **Endpoint FastAPI:** GET /work-orders/form-options (campo pallet_qas)
- **Fuente Laravel:** `Installation.php` relacion `qa()`

---

## 6. Fórmula McKee (Issue 25)

### Regla 6.1: Visibilidad por Rol
- Solo visible para roles 5 (Jefe Desarrollo) y 6 (Ingeniero)
- **Fuente Laravel:** `ficha-form.blade.php` líneas 1243-1277

### Regla 6.2: Flujo de Cálculo
1. Usuario ingresa: Largo, Ancho, Alto (mm)
2. Sistema calcula: Perímetro = (Largo + Ancho) × 2
3. Usuario selecciona: Cartón (debe coincidir con el de la OT)
4. Sistema obtiene del cartón: ECT y Espesor
5. Sistema calcula BCT usando Fórmula McKee

### Regla 6.3: Fórmula BCT
```
bct_kilos = 0.325 × ECT × ((Espesor - 0.2) ^ 0.508) × ((Perímetro / 10) ^ 0.492)
bct_lb = bct_kilos / 0.454
```
- **Fuente Laravel:** `ot-creation.js` línea 3750

### Regla 6.4: Validación de Cartón
- El cartón seleccionado DEBE ser el mismo que el de la OT
- Si difiere, mostrar alerta y no calcular
- **Fuente Laravel:** `ot-creation.js` líneas 3766-3772

### Regla 6.5: Aplicar Valores
- Al hacer clic en "Aplicar", los valores BCT se copian a los campos principales
- Se registra fecha y hora de aplicación
- **Fuente Laravel:** `ot-creation.js` líneas 3795-3807

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| largo_mckee | int | Largo en mm |
| ancho_mckee | int | Ancho en mm |
| alto_mckee | int | Alto en mm |
| perimetro_mckee | int | Calculado: (largo + ancho) × 2 |
| carton_id_mckee | int | Hereda de carton_id |
| ect_mckee | int | ECT del cartón |
| espesor_mckee | float | Espesor del cartón |
| bct_lib_mckee | int | BCT en libras (calculado) |
| bct_kilos_mckee | int | BCT en kilos (calculado) |
| fecha_mckee | string | Fecha de aplicación |
| aplicar_mckee | int | Flag de aplicación |

**Endpoint FastAPI:** GET /work-orders/carton/{carton_id}

**Estado:** ✅ Implementado

---

## 7. Archivo SPEC (Issue 11)

### Regla 7.1: Checkbox con archivo adjunto
- El checkbox "Spec" permite adjuntar un archivo cuando está marcado
- **Fuente Laravel:** `ficha-form.blade.php` líneas 556-573
- **Campo BD Laravel:** `ant_des_speed`, `ant_des_speed_file`
- **Campo FastAPI:** `ant_des_spec`, archivo tipo `'speed'`

### Regla 7.2: Comportamiento UI
- Cuando checkbox "Spec" está marcado: mostrar icono 📎 para adjuntar archivo
- Cuando hay archivo adjunto: mostrar nombre del archivo en verde
- El archivo se sube al guardar la OT (igual que otros archivos)

**Estado:** ✅ Implementado

---

---

## 8. Cálculos Automáticos (Accessors)

### Regla 8.1: Dimensiones HC
**Fuente:** `WorkOrder.php` líneas 375-498

#### Largura HC
```
largura_hc = (largura_hm × golpes_largo) + ((golpes_largo - 1) × separacion_golpes_largo) + suma

Donde suma depende del proceso y tipo de cartón:
- DIECUTTER/FLEXO + SIMPLES/POWER PLY/MONOTAPA: +20
- DIECUTTER + DOBLES/DOBLE MONOTAPA: +25
- OFFSET + cualquier cartón: +24
- CORRUGADO: largura_hm (sin modificación)
- S/PROCESO: largura_hm × golpes_largo
```

#### Anchura HC
Misma fórmula que Largura HC pero con anchura_hm, golpes_ancho y separacion_golpes_ancho.

**Estado:** ⚠️ Falta implementar en FastAPI

---

### Regla 8.2: Áreas
**Fuente:** `WorkOrder.php` líneas 339-373

```
área_hm = (largura_hm × anchura_hm) / 1,000,000
área_hc = ((largura_hc × anchura_hc) / 1,000,000) / (golpes_largo × golpes_ancho)
área_hc_semielaborado = (largura_hc × anchura_hc) / 1,000,000
```

**Estado:** ⚠️ Falta implementar en FastAPI

---

### Regla 8.3: Pesos
**Fuente:** `WorkOrder.php` líneas 554-580

```
peso_bruto = área_hc × gramaje_cartón / 1,000
peso_neto = área_producto × gramaje_cartón / 1,000
peso_esquinero = largura_hm × gramaje_cartón / 1,000,000
```

**Estado:** ⚠️ Falta implementar en FastAPI

---

### Regla 8.4: Volumen Unitario
**Fuente:** `WorkOrder.php` líneas 582-598

```
volumen_unitario = (largura_hc × anchura_hc × espesor_cartón) / (golpes_largo × golpes_ancho) / 1,000
```

**Estado:** ⚠️ Falta implementar en FastAPI

---

### Regla 8.5: Consumos de Materiales
**Fuente:** `WorkOrder.php` líneas 619-750

```
CONSTANTES:
- CONSUMO_TINTA = 5
- CONSUMO_BARNIZ_UV = 20
- CONSUMO_CERA = 28
- CONSUMO_ADHESIVO = 4
- CONSUMO_HIDROPELENTE = 25

consumo_tinta_N = (área_hm × %impresión_N × CONSUMO_TINTA / 100) × (golpes_largo × golpes_ancho)
consumo_barniz_uv = (área_hm × %barniz_uv × CONSUMO_BARNIZ_UV / 100) × (golpes_largo × golpes_ancho)
consumo_pegado = (longitud_pegado / 1,000) × CONSUMO_ADHESIVO × golpes_largo × golpes_ancho
consumo_cera = (área_hm × %cobertura × CONSUMO_CERA / 100) × (golpes_largo × golpes_ancho)
```

**Estado:** ⚠️ Falta implementar en FastAPI

---

### Regla 8.6: Recorte Característico
**Fuente:** `WorkOrder.php` líneas 515-537

```
Si proceso = 'S/PROCESO': recorte = 0
Sino: recorte = área_hm - área_producto - recorte_adicional
```

**Estado:** ⚠️ Falta implementar en FastAPI

---

## 9. Aprobación de Cotizaciones

### Regla 9.1: Niveles de Aprobación según Margen
**Fuente:** `CotizacionController.php` líneas 1088-1141 y 1859-1931

```
Si margen ≤ 0:
  → Estado = 3 (Liberada/Aprobada)
  → No requiere aprobación

Si margen < 4%:
  → Nivel 1: Solo Jefe de Ventas (rol 3)
  → Si usuario es Jefe Venta: Aprobación directa
  → Sino: role_can_show = 3

Si margen ≥ 4%:
  → Nivel 2: Gerente Comercial (rol 15)
  → role_can_show = 15
```

**Estado:** ⚠️ Documentado pero verificar implementación

---

### Regla 9.2: Rechazo Automático Clasificación 4
**Fuente:** `CotizacionController.php` líneas 1859-1870

```
Si clasificación_cliente = 4 (Presencia Rentable) Y margen ≠ 0:
  → Estado = 6 (Rechazada)
  → Motivo = "Presencia Rentable y no se pone margen >= minimo"
```

**Estado:** ❌ NO implementado en FastAPI

---

### Regla 9.3: Margen Sugerido por Rol
**Fuente:** `CotizacionController.php` líneas 915-1001

```
Si rubro_id = 5 (Esquineros):
  → margen_sugerido = 0 (no aplica)

Si rol = 19 (Vendedor Externo):
  → margen_sugerido = cliente.margen_minimo_vendedor_externo

Otros roles:
  → margen_sugerido = obtenerMargenSugeridoNew() basado en tabla margenes_minimos
```

**Estado:** ⚠️ Verificar implementación

---

## 10. Visibilidad por Rol

### Regla 10.1: Estados Visibles según Rol
**Fuente:** `WorkOrderController.php` líneas 240-258

```
Jefe de Muestras (13) o Técnico Muestras (14):
  → Solo estado 17 (Sala de Muestras)

Super Administrador (18):
  → Todos los estados (1-22)

Otros roles:
  → Estados: [1,2,3,4,5,6,7,10,12,13,14,15,16,17,18,20,21,22]
```

**Estado:** ⚠️ Verificar implementación

---

### Regla 10.2: Técnico Muestras - Filtro por Sala de Corte
**Fuente:** `WorkOrderController.php` líneas 349-416

```
Técnico de Muestras solo ve OTs donde:
  - muestras.sala_corte_vendedor = usuario.sala_corte_id
  - muestras.sala_corte_disenador = usuario.sala_corte_id
  - muestras.sala_corte_laboratorio = usuario.sala_corte_id
  - muestras.sala_corte_cliente_1 = usuario.sala_corte_id
  - muestras.sala_corte_cliente_2 = usuario.sala_corte_id
  - muestras.sala_corte_cliente_3 = usuario.sala_corte_id
```

**Estado:** ❌ NO implementado en FastAPI

---

### Regla 10.3: Técnico Muestras - Campos Editables
**Fuente:** `MuestraController.php` líneas 148-180

```
Técnico de Muestras (rol 14) SOLO puede editar:
- fecha_corte_vendedor
- fecha_corte_diseñador
- fecha_corte_laboratorio
- fecha_corte_1, fecha_corte_2, fecha_corte_3
- comentarios de corte

NO puede:
- Crear muestras nuevas
- Editar otros campos
```

**Estado:** ⚠️ Verificar implementación

---

## 11. Validaciones Condicionales

### Regla 11.1: Checkboxes de Muestras
**Fuente:** `WorkOrderController.php` líneas 1362-1398

```
Si checkboxes = null:
  → check_entregadas_todas = null
  → check_entregadas_algunas = null
  → muestra = null
  → numero_muestras = null

Si 'check_entregadas_todas' en checkboxes:
  → check_entregadas_todas = 1

Si 'check_entregadas_algunas' en checkboxes:
  → check_entregadas_algunas = 1

Si 'muestra' en checkboxes:
  → muestra = 1
  → numero_muestras = valor ingresado
```

**Estado:** ⚠️ Verificar implementación

---

### Regla 11.2: Largo Máximo Descripción
**Fuente:** `WorkOrderController.php` líneas 1239-1240

```
Campo: descripcion
Validación: max:40 caracteres
```

**Estado:** ⚠️ Verificar en schema Pydantic

---

## 12. Tiempos de Gestión

### Regla 12.1: Cálculo de Tiempos por Área
**Fuente:** `WorkOrderController.php` líneas 199-233

```
Para cada OT, calcular suma de duracion_segundos donde:
- management_type_id = 1 (Cambio de estado)
- mostrar = 1
- Agrupado por work_space_id

Áreas:
- Venta (work_space_id = 1)
- Desarrollo (work_space_id = 2)
- Diseño (work_space_id = 3)
- Catalogación (work_space_id = 4)
- Producción (work_space_id = 5)
- Muestras (work_space_id = 6)
```

**Estado:** ⚠️ Verificar implementación

---

*Este documento se actualiza a medida que se migran funcionalidades.*
*Última actualización: 2026-02-17*
