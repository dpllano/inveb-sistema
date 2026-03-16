# Informe de Comparación: Tablas Laravel vs FastAPI

**Fecha:** 2026-03-11
**Fase:** 1.1 - Comparación de Tablas

---

## Resumen

| Métrica | Cantidad |
|---------|----------|
| Tablas en Laravel (migraciones) | 97 |
| Tablas en FastAPI generic.py | 69 |
| Tablas con routers específicos | 8 |
| **Tablas potencialmente faltantes** | **20** |

---

## 1. Tablas con Routers Específicos en FastAPI

Estas tablas NO están en generic.py porque tienen su propio router con lógica especializada:

| Router | Tablas que maneja |
|--------|-------------------|
| `clients.py` | clients |
| `installations.py` | installations |
| `users.py` | users |
| `roles.py` | roles |
| `jerarquias.py` | hierarchies, subhierarchies, subsubhierarchies |
| `work_orders.py` | work_orders, user_work_orders, cads |
| `cotizaciones.py` | cotizacions, cotizacion_approvals, cotizacion_estados, detalle_cotizacions |
| `muestras.py` | muestras |
| `gestiones.py` | managements, management_types |
| `uploads.py` | files |
| `notifications.py` | notifications |
| `cascades.py` | Lecturas de múltiples tablas para cascadas |
| `form_options.py` | Lecturas de múltiples tablas para opciones de formulario |

---

## 2. Tablas en generic.py (69 tablas)

Estas tablas tienen CRUD genérico funcionando:

```
additional_characteristics_type, adhesivos, almacenes, areahcs, armados,
audits, bitacora_campos_modificados, canals, cantidad_base, cardboards,
carton_esquineros, cartons, cebes, changelogs, ciudades_fletes,
clasificacion_clientes, codigo_materials, colors, consumo_adhesivo_pegados,
consumo_adhesivos, consumo_energias, detalle_precio_palletizados, envases,
factores_desarrollos, factores_ondas, factores_seguridads, fletes,
formato_bobinas, fsc, grupo_imputacion_materiales, grupo_materiales_1,
grupo_materiales_2, grupo_plantas, insumos_palletizados, maquila_servicios,
margenes_minimos, materials, matrices, mercados, merma_convertidoras,
merma_corrugadoras, organizaciones_ventas, paises, pallet_box_quantities,
pallet_patrons, pallet_protections, pallet_status_types, pallet_types,
papers, pegados, plantas, prefijo_materials, processes, product_types,
rayados, rechazo_conjunto, recubrimiento_types, reference_types, rubros,
sectors, secuencias_operacionales, styles, sufijo_materials, tarifario,
tarifario_margens, tiempo_tratamiento, tipo_ondas, tipos_cintas,
variables_cotizadors
```

---

## 3. Tablas Potencialmente Faltantes (Requieren Revisión)

Estas tablas existen en Laravel pero NO tienen endpoint en FastAPI:

### 3.1 Tablas de Catálogos (AGREGAR a generic.py)

| Tabla | Descripción | Prioridad |
|-------|-------------|-----------|
| `answers` | Respuestas | Media |
| `coverage_types` | Tipos de cobertura | Alta |
| `coverage_external` | Cobertura externa | Alta |
| `coverage_internal` | Cobertura interna | Alta |
| `design_types` | Tipos de diseño | Alta |
| `food_types` | Tipos de alimentos | Media |
| `impresion` | Opciones de impresión | Alta |
| `ink_types` | Tipos de tintas | Media |
| `pallet_qas` | QA de pallet | Alta |
| `pallet_tag_formats` | Formatos de etiqueta | Alta |
| `precut_types` | Tipos de precorte | Media |
| `print_type` | Tipos de impresión | Alta |
| `protection_type` | Tipos de protección | Media |
| `states` | Estados de OT | **Crítica** |

### 3.2 Tablas de Configuración (AGREGAR a generic.py)

| Tabla | Descripción | Prioridad |
|-------|-------------|-----------|
| `class_substance_packed` | Clasificación sustancia | Baja |
| `expected_use` | Uso esperado | Baja |
| `product_type_developing` | Desarrollo tipo producto | Baja |
| `recycled_use` | Uso reciclado | Baja |
| `system_variables` | Variables del sistema | Media |
| `target_market` | Mercado objetivo | Baja |
| `transportation_way` | Vías de transporte | Baja |

### 3.3 Tablas No Necesarias (Ya cubiertas o legacy)

| Tabla | Razón |
|-------|-------|
| `password_resets` | Manejado por auth.py |
| `materials_codes` | Ya existe codigo_materials |
| `work_spaces` | No usado en nueva versión |

---

## 4. Tablas Críticas a Agregar

### 4.1 `states` - Estados de OT (CRÍTICA)

**Fuente Laravel:** `app/State.php`

```php
// Usado para estados de OT
class State extends Model {
    protected $fillable = ['descripcion', 'status', 'active'];
}
```

**Acción:** Agregar a generic.py

### 4.2 `pallet_qas` - QA de Pallet

**Fuente Laravel:** Migración `2020_01_08_132024_create_pallet_qas_table.php`

```php
Schema::create('pallet_qas', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('descripcion');
    $table->tinyInteger('active')->default(1);
    $table->timestamps();
});
```

**Acción:** Agregar a generic.py

### 4.3 `pallet_tag_formats` - Formatos de Etiqueta

**Fuente Laravel:** Migración `2020_01_08_131837_create_pallet_tag_formats_table.php`

**Acción:** Agregar a generic.py

### 4.4 `design_types` - Tipos de Diseño

**Fuente Laravel:** Migración `2022_01_04_110638_create_table_design_types.php`

**Acción:** Agregar a generic.py

### 4.5 Tablas de Coverage

**Tablas:** coverage_types, coverage_external, coverage_internal

**Acción:** Agregar a generic.py

---

## 5. Plan de Acción

### Prioridad 1 - Críticas (Agregar inmediatamente)
1. [ ] `states` - Usado en toda la aplicación
2. [ ] `pallet_qas` - Usado en instalaciones
3. [ ] `pallet_tag_formats` - Usado en instalaciones
4. [ ] `design_types` - Usado en OT

### Prioridad 2 - Alta (Agregar pronto)
5. [ ] `coverage_types`
6. [ ] `coverage_external`
7. [ ] `coverage_internal`
8. [ ] `impresion`
9. [ ] `print_type`

### Prioridad 3 - Media (Agregar después)
10. [ ] `answers`
11. [ ] `food_types`
12. [ ] `ink_types`
13. [ ] `precut_types`
14. [ ] `protection_type`
15. [ ] `system_variables`

### Prioridad 4 - Baja (Opcional)
16. [ ] `class_substance_packed`
17. [ ] `expected_use`
18. [ ] `product_type_developing`
19. [ ] `recycled_use`
20. [ ] `target_market`
21. [ ] `transportation_way`

---

## 6. Verificación de Tabla FSC en Railway

**Estado:** La tabla `fsc` está configurada en generic.py pero puede no existir en Railway.

**Script de verificación:** `/ENTREGA_FINAL/scripts/crear_tabla_fsc.sql`

**Acción:** Ejecutar script en Railway MySQL.

