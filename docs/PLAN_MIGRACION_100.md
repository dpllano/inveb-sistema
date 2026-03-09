# PLAN DE MIGRACION 100% - Laravel a FastAPI

## OBJETIVO: Paridad Funcional Completa

**Fecha**: 2026-02-13
**Estado**: EN PLANIFICACION

---

## INVENTARIO COMPLETO LARAVEL

### Controllers Analizados (57 archivos)

| # | Controller | Metodos | Categoria |
|---|-----------|---------|-----------|
| 1 | WorkOrderController | 59 | CORE |
| 2 | CotizacionController | 28 | CORE |
| 3 | ManagementController | 28 | CORE |
| 4 | MuestraController | 21 | CORE |
| 5 | ClientController | 20 | CORE |
| 6 | UserController | 17 | CORE |
| 7 | DetalleCotizacionController | 13 | CORE |
| 8 | CartonController | 11 | MANTENEDOR |
| 9 | ReportController | 100 | REPORTES |
| 10 | Report2Controller | 104 | REPORTES |
| 11 | Report3Controller | 104 | REPORTES |
| 12 | MantenedorController | 74 | MANTENEDOR |
| 13 | ApiMobileController | 9 | MOBILE |
| 14 | WorkOrderExcelController | 8 | EXPORTS |
| 15-57 | Otros (CRUD basico) | ~7 c/u | MANTENEDOR |

**TOTAL METODOS LARAVEL: ~700+**

---

## INVENTARIO FASTAPI ACTUAL

### Routers Existentes (23 archivos)

| # | Router | Endpoints | Estado |
|---|--------|-----------|--------|
| 1 | work_orders.py | 19 | PARCIAL |
| 2 | cotizaciones.py | 10 | PARCIAL |
| 3 | cotizaciones/router.py | 19 | PARCIAL |
| 4 | cotizaciones/detalles.py | 12 | PARCIAL |
| 5 | gestiones.py | 7 | PARCIAL |
| 6 | muestras.py | 13 | COMPLETO |
| 7 | cascades.py | 14 | COMPLETO |
| 8 | reports.py | 27 | PARCIAL |
| 9 | pdfs.py | 4 | PARCIAL |
| 10 | exports.py | 5 | PARCIAL |
| 11 | auth.py | 8 | COMPLETO |
| 12 | materials.py | 14 | COMPLETO |
| 13 | mobile.py | 12 | COMPLETO |
| 14 | form_options.py | 15 | COMPLETO |
| 15 | emails.py | 8 | COMPLETO |
| 16 | notifications.py | 4 | COMPLETO |
| 17 | uploads.py | 6 | COMPLETO |
| 18 | areahc.py | 3 | COMPLETO |
| 19 | bulk_cotizador.py | 4 | COMPLETO |
| 20 | work_order_excel.py | 3 | COMPLETO |
| 21 | mantenedores/generic.py | 8 | COMPLETO |
| 22 | mantenedores/clients.py | 7 | PARCIAL |
| 23 | mantenedores/installations.py | 5 | COMPLETO |
| 24 | mantenedores/users.py | 8 | PARCIAL |
| 25 | mantenedores/roles.py | 8 | COMPLETO |
| 26 | mantenedores/jerarquias.py | 18 | COMPLETO |

**TOTAL ENDPOINTS FASTAPI: ~262**

---

## MATRIZ DE COMPARACION DETALLADA

### 1. WORK ORDERS (WorkOrderController.php)

| # | Metodo Laravel | Endpoint FastAPI | Estado |
|---|---------------|------------------|--------|
| 1 | index() | GET /work-orders/ | OK |
| 2 | filtro() | GET /work-orders/filter-options | OK |
| 3 | create() | GET /work-orders/form-options-complete | OK |
| 4 | store() | POST /work-orders/ | OK |
| 5 | edit() | GET /work-orders/{id} | OK |
| 6 | update() | PUT /work-orders/{id} | OK |
| 7 | duplicate() | POST /work-orders/{id}/duplicate | OK |
| 8 | listadoAprobacion() | GET /work-orders/pending-approval | OK |
| 9 | aprobarOt() | PUT /work-orders/{id}/approve | OK |
| 10 | rechazarOt() | PUT /work-orders/{id}/reject | OK |
| 11 | getCad() | GET /work-orders/cad/{id} | OK |
| 12 | getCarton() | GET /work-orders/carton/{id} | OK |
| 13 | createLicitacion() | - | FALTA |
| 14 | createFichaTecnica() | - | FALTA |
| 15 | createEstudioBenchmarking() | - | FALTA |
| 16 | select() | - | FALTA |
| 17 | detalleAOt() | - | FALTA |
| 18 | validarExcel() | - | FALTA |
| 19 | importarMuestrasDesdeExcel() | - | FALTA |
| 20 | editOtLicitacion() | - | FALTA |
| 21 | editOtFicha() | - | FALTA |
| 22 | editOtEstudioBench() | - | FALTA |
| 23 | editDescriptionOt() | - | FALTA |
| 24 | updateDescripcion() | - | FALTA |
| 25 | getMatriz() | - | FALTA |
| 26 | getMatrizData() | - | FALTA |
| 27 | getCadByMaterial() | - | FALTA |
| 28 | getCartonColor() | - | FALTA |
| 29 | getMaquilaServicio() | - | FALTA |
| 30 | getDesignType() | - | FALTA |
| 31 | postVerificacionFiltro() | - | FALTA |
| 32 | getRecubrimientoInterno() | GET /cascades/recubrimiento-interno | OK |
| 33 | getRecubrimientoExterno() | GET /cascades/recubrimiento-externo | OK |
| 34 | getPlantaObjetivo() | GET /cascades/plantas-objetivo | OK |
| 35 | getColorCarton() | - | FALTA |
| 36 | getListaCarton() | - | FALTA |
| 37 | getListaCartonEdit() | - | FALTA |
| 38 | getListaCartonOffset() | - | FALTA |
| 39 | createCadMaterial() | - | FALTA |
| 40 | createCodigoMaterial() | - | FALTA |
| 41 | modalOT() | - | N/A (Vista) |
| 42 | modalOTEstudio() | - | N/A (Vista) |
| 43 | modalOTLicitacion() | - | N/A (Vista) |
| 44 | modalOTFichaTecnica() | - | N/A (Vista) |
| 45 | filtroMultiplesOt() | - | FALTA |
| 46 | cotizarMultiplesOt() | - | FALTA |
| 47 | getAplicarMckee() | - | FALTA |
| 48 | generarPdfEstudioBench() | GET /pdfs/estudio-bench/{id} | OK |
| 49 | cargaDetallesEstudio() | - | FALTA |

**Resumen WorkOrders: 15/49 implementados (31%)**
**Faltantes criticos: 21 metodos**

---

### 2. COTIZACIONES (CotizacionController.php)

| # | Metodo Laravel | Endpoint FastAPI | Estado |
|---|---------------|------------------|--------|
| 1 | index() | GET /cotizaciones/ | OK |
| 2 | index_externo() | GET /cotizaciones/pendientes-aprobacion-externo | OK |
| 3 | create() | POST /cotizaciones/ | OK |
| 4 | create_externo() | POST /cotizaciones/from-ot/{id} | PARCIAL |
| 5 | create_externo_aprobacion() | - | FALTA |
| 6 | aprobar_externo() | POST /cotizaciones/{id}/gestionar-aprobacion-externo | OK |
| 7 | cotizarOt() | POST /cotizaciones/from-ot/{id} | OK |
| 8 | calcularDetalleCotizacion() | POST /cotizaciones/detalles/{id}/calcular | OK |
| 9 | generarPrecotizacion() | POST /cotizaciones/ | PARCIAL |
| 10 | generarPrecotizacionExterno() | - | FALTA |
| 11 | solicitarAprobacion() | POST /cotizaciones/{id}/solicitar-aprobacion | OK |
| 12 | solicitarAprobacionExterno() | POST /cotizaciones/{id}/solicitar-aprobacion-externo | OK |
| 13 | calcular_margen() | - | FALTA |
| 14 | versionarCotizacion() | POST /cotizaciones/{id}/versionar | OK |
| 15 | duplicarCotizacion() | POST /cotizaciones/{id}/duplicar | OK |
| 16 | retomarCotizacion() | POST /cotizaciones/{id}/retomar | OK |
| 17 | retomarCotizacionExterno() | - | FALTA |
| 18 | editarCotizacionExterno() | - | FALTA |
| 19 | cargaMateriales() | - | FALTA |
| 20 | generar_pdf() | GET /cotizaciones/{id}/export-pdf | OK |
| 21 | enviar_pdf() | POST /emails/quotation | OK |
| 22 | detalle_costos() | GET /cotizaciones/{id}/costos-resumen | PARCIAL |
| 23 | detalles_corrugados() | - | FALTA |
| 24 | detalles_esquineros() | - | FALTA |
| 25 | ayuda() | - | N/A (Vista) |
| 26 | obtenerMargenPapeles() | - | FALTA |
| 27 | solicitarAprobacionNew() | - | FALTA |
| 28 | calcular_mc_bruto() | - | FALTA |

**Resumen Cotizaciones: 14/28 implementados (50%)**
**Faltantes criticos: 11 metodos**

---

### 3. DETALLE COTIZACION (DetalleCotizacionController.php)

| # | Metodo Laravel | Endpoint FastAPI | Estado |
|---|---------------|------------------|--------|
| 1 | store() | POST /cotizaciones/{id}/detalles | OK |
| 2 | update() | PUT /cotizaciones/detalles/{id} | OK |
| 3 | editarMargenCotizacion() | - | FALTA |
| 4 | delete() | DELETE /cotizaciones/detalles/{id} | OK |
| 5 | detalleCotizacionGanado() | POST /cotizaciones/detalles/{id}/ganado | OK |
| 6 | detalleCotizacionPerdido() | POST /cotizaciones/detalles/{id}/perdido | OK |
| 7 | getServiciosMaquila() | GET /cascades/productos/{id}/servicios-maquila | OK |
| 8 | cargaMasivaDetalles() | POST /cotizaciones/{id}/detalles/carga-masiva | OK |
| 9 | calcularIndiceComplejidad() | POST /cotizaciones/detalles/{id}/calcular-complejidad | OK |
| 10 | guardarMultiplesOt() | - | FALTA |
| 11 | obtieneDatos() | - | FALTA |
| 12 | cartonAltaGrafica() | - | FALTA |
| 13 | cartonGenerico() | - | FALTA |

**Resumen DetalleCotizacion: 8/13 implementados (62%)**
**Faltantes: 5 metodos**

---

### 4. MANAGEMENT/GESTIONES (ManagementController.php)

| # | Metodo Laravel | Endpoint FastAPI | Estado |
|---|---------------|------------------|--------|
| 1 | gestionarOt() | GET /gestiones/{ot_id} | OK |
| 2 | storeRespuesta() | POST /gestiones/{gestion_id}/respuesta | OK |
| 3 | index() | - | N/A (Vista) |
| 4 | create() | - | N/A (Vista) |
| 5 | reactivarOT() | POST /gestiones/{ot_id}/reactivar | OK |
| 6 | retomarOT() | POST /gestiones/{ot_id}/retomar | OK |
| 7 | store() | POST /gestiones/{ot_id}/crear | OK |
| 8 | read_pdf() | - | FALTA |
| 9 | validar_carton() | - | FALTA |
| 10 | store_pdf_read() | - | FALTA |
| 11 | searchValue() | - | FALTA |
| 12 | sanitizeValues() | - | FALTA |
| 13 | store_pdf() | - | FALTA |
| 14 | usuarioAsignadoPorArea() | - | FALTA |
| 15 | crearNotificacion() | POST /notifications/ | PARCIAL |
| 16 | show() | - | FALTA |
| 17 | edit() | - | FALTA |
| 18 | update() | - | FALTA |
| 19 | destroy() | - | FALTA |
| 20 | validation_edition() | - | FALTA |
| 21 | detalleLogOt() | GET /gestiones/{ot_id}/log | OK |
| 22 | descargarDetalleLogExcel() | GET /gestiones/{ot_id}/log/excel | OK |
| 23 | detalleMckee() | - | FALTA |
| 24 | descargarDetalleLogExcelMckee() | - | FALTA |
| 25 | generar_diseño_pdf() | - | FALTA |
| 26 | obtenerProveedorExternoDiseño() | - | FALTA |
| 27 | obtenerDatosPdf() | - | FALTA |
| 28 | store_boceto_pdf() | - | FALTA |

**Resumen Gestiones: 7/28 implementados (25%)**
**Faltantes criticos: 16 metodos**

---

### 5. MUESTRAS (MuestraController.php)

| # | Metodo Laravel | Endpoint FastAPI | Estado |
|---|---------------|------------------|--------|
| 1 | visualizar_muestra_html() | - | N/A (Vista) |
| 2 | create() | - | N/A (Vista) |
| 3 | store() | POST /muestras/ | OK |
| 4 | show() | GET /muestras/{id} | OK |
| 5 | edit() | - | N/A (Vista) |
| 6 | update() | PUT /muestras/{id} | OK |
| 7 | destroy() | DELETE /muestras/{id} | OK |
| 8 | getMuestra() | GET /muestras/{id} | OK |
| 9 | getCartonMuestra() | - | FALTA |
| 10 | delete() | DELETE /muestras/{id} | OK |
| 11 | rechazarMuestra() | PUT /muestras/{id}/rechazar | OK |
| 12 | getMuestrasOt() | GET /muestras/ot/{id} | OK |
| 13 | terminarMuestra_old() | - | DEPRECATED |
| 14 | terminarMuestra() | PUT /muestras/{id}/terminar | OK |
| 15 | anularMuestra() | PUT /muestras/{id}/anular | OK |
| 16 | devolverMuestra() | PUT /muestras/{id}/devolver | OK |
| 17 | usuarioAsignadoPorArea() | - | FALTA |
| 18 | crearNotificacion() | - | INTERNO |
| 19 | muestraPrioritaria() | PUT /muestras/{id}/prioritaria | OK |
| 20 | muestraNoPrioritaria() | - | FALTA |
| 21 | generar_etiqueta_muestra_pdf() | GET /pdfs/etiqueta-muestra/{id} | OK |

**Resumen Muestras: 13/21 implementados (62%)**
**Faltantes: 4 metodos**

---

### 6. CLIENTES (ClientController.php)

| # | Metodo Laravel | Endpoint FastAPI | Estado |
|---|---------------|------------------|--------|
| 1 | index() | GET /mantenedores/clients/ | OK |
| 2 | create() | - | N/A (Vista) |
| 3 | store() | POST /mantenedores/clients/ | OK |
| 4 | store_installation() | POST /mantenedores/installations/ | OK |
| 5 | edit() | GET /mantenedores/clients/{id} | OK |
| 6 | edit_installation() | GET /mantenedores/installations/{id} | OK |
| 7 | update() | PUT /mantenedores/clients/{id} | OK |
| 8 | update_installation() | PUT /mantenedores/installations/{id} | OK |
| 9 | active() | PUT /mantenedores/clients/{id}/activate | OK |
| 10 | inactive() | PUT /mantenedores/clients/{id}/deactivate | OK |
| 11 | getContactosCliente() | GET /cascades/clientes/{id}/contactos | OK |
| 12 | getInstalacionesClienteCotiza() | GET /cascades/clientes/{id}/instalaciones-cotiza | OK |
| 13 | getInstalacionesCliente() | GET /cascades/clientes/{id}/instalaciones | OK |
| 14 | getInformacionInstalacion() | GET /cascades/instalaciones/{id} | OK |
| 15 | getDatosContacto() | GET /cascades/contactos/{id} | OK |
| 16 | getDatosContactoInstalacion() | - | FALTA |
| 17 | store_indicacion() | - | FALTA |
| 18 | edit_indicacion() | - | FALTA |
| 19 | update_indicacion() | - | FALTA |
| 20 | getIndicacionesEspeciales() | - | FALTA |

**Resumen Clientes: 15/20 implementados (75%)**
**Faltantes: 5 metodos (indicaciones especiales)**

---

### 7. USUARIOS (UserController.php)

| # | Metodo Laravel | Endpoint FastAPI | Estado |
|---|---------------|------------------|--------|
| 1 | index() | GET /mantenedores/users/ | OK |
| 2 | create() | - | N/A (Vista) |
| 3 | store() | POST /mantenedores/users/ | OK |
| 4 | show() | GET /mantenedores/users/{id} | OK |
| 5 | edit() | - | N/A (Vista) |
| 6 | update() | PUT /mantenedores/users/{id} | OK |
| 7 | editarContrasena() | - | FALTA |
| 8 | actualizarContrasena() | POST /auth/change-password | OK |
| 9 | destroy() | - | FALTA |
| 10 | active() | PUT /mantenedores/users/{id}/activate | OK |
| 11 | inactive() | PUT /mantenedores/users/{id}/deactivate | OK |
| 12 | cargaUsersForm() | - | FALTA |
| 13 | importUsers() | - | FALTA |
| 14 | getUsersByArea() | - | FALTA |
| 15 | logearUsuario() | POST /auth/login | OK |
| 16 | test() | - | N/A (Debug) |
| 17 | getTiposVendedores() | - | FALTA |

**Resumen Usuarios: 8/17 implementados (47%)**
**Faltantes: 6 metodos**

---

### 8. REPORTES (ReportController + Report2 + Report3)

| Categoria | Metodos Laravel | Implementados | Faltantes |
|-----------|----------------|---------------|-----------|
| OTs Completadas | 5 | 3 | 2 |
| Tiempo por Area | 8 | 2 | 6 |
| Rechazos | 4 | 3 | 1 |
| Anulaciones | 2 | 2 | 0 |
| Muestras | 15 | 4 | 11 |
| Sala Muestra | 10 | 2 | 8 |
| Excel Exports | 8 | 6 | 2 |
| Calculos Aux | 50+ | - | INTERNOS |

**Resumen Reportes: ~22/52 metodos publicos (42%)**

---

### 9. MANTENEDOR MASIVO (MantenedorController.php)

| # | Funcionalidad | Estado |
|---|--------------|--------|
| 1 | Carga Cartones | OK (bulk_cotizador) |
| 2 | Carga Cartones Esquineros | FALTA |
| 3 | Carga Papeles | FALTA |
| 4 | Carga Fletes | FALTA |
| 5 | Carga Mermas Corrugadoras | FALTA |
| 6 | Carga Mermas Convertidoras | FALTA |
| 7 | Carga Paletizados | FALTA |
| 8 | Carga Insumos Paletizados | FALTA |
| 9 | Carga Tarifarios | FALTA |
| 10 | Carga Consumo Adhesivo | FALTA |
| 11 | Carga Consumo Energia | FALTA |
| 12 | Carga Matrices | FALTA |
| 13 | Carga Materiales | FALTA |
| 14 | Carga Factores Desarrollo | FALTA |
| 15 | Carga Factores Seguridad | FALTA |
| 16 | Carga Factores Onda | FALTA |
| 17 | Descargas Excel (16 tablas) | FALTA |

**Resumen Mantenedor: 1/17 implementados (6%)**

---

### 10. OTROS CONTROLLERS

| Controller | Metodos | FastAPI | Estado |
|-----------|---------|---------|--------|
| ApiMobileController | 9 | mobile.py | OK |
| AreahcController | 7 | areahc.py | OK |
| AuthController | 4 | auth.py | OK |
| WorkOrderExcelController | 8 | work_order_excel.py + exports.py | OK |
| NotificationController | 9 | notifications.py | OK |
| CotizacionApprovalController | 11 | cotizaciones/router.py | PARCIAL |
| HierarchyController | 7 | jerarquias.py | OK |
| SubhierarchyController | 9 | jerarquias.py | OK |
| SubsubhierarchyController | 10 | jerarquias.py | OK |
| RoleController | 7 | roles.py | OK |
| SecuenciaOperacionalController | 7 | generic.py | OK |
| UserWorkOrderController | 10 | - | FALTA |
| TarifarioMargenController | 0 | - | VACIO |
| WorkOrderOldController | 27 | - | DEPRECATED |
| WorkSpaceController | 7 | generic.py | OK |

---

## RESUMEN GLOBAL DE BRECHAS

| Modulo | Implementado | Faltante | % Cobertura |
|--------|-------------|----------|-------------|
| Work Orders | 15 | 21 | 42% |
| Cotizaciones | 14 | 11 | 56% |
| Detalle Cotizacion | 8 | 5 | 62% |
| Gestiones | 7 | 16 | 30% |
| Muestras | 13 | 4 | 76% |
| Clientes | 15 | 5 | 75% |
| Usuarios | 8 | 6 | 57% |
| Reportes | 22 | 30 | 42% |
| Mantenedor Masivo | 1 | 16 | 6% |
| Otros | OK | 10 | 90% |
| **TOTAL** | **~103** | **~124** | **45%** |

---

## PLAN DE SPRINTS PARA 100%

### SPRINT A: COTIZACIONES COMPLETAS (3-4 dias)

**Objetivo**: Completar flujo de cotizaciones al 100%

| # | Tarea | Metodo Laravel | Prioridad |
|---|-------|---------------|-----------|
| A1 | calcular_margen() | Calculo agregado de margenes | CRITICA |
| A2 | detalles_corrugados() | Desglose corrugados | ALTA |
| A3 | detalles_esquineros() | Desglose esquineros | ALTA |
| A4 | obtenerMargenPapeles() | Margen papeles | ALTA |
| A5 | calcular_mc_bruto() | Margen contribucion bruto | ALTA |
| A6 | editarMargenCotizacion() | Editar margen individual | MEDIA |
| A7 | guardarMultiplesOt() | Crear OTs desde cotizacion | ALTA |
| A8 | obtieneDatos() | Datos para precotizacion | MEDIA |
| A9 | cartonAltaGrafica() | Carton alta grafica | MEDIA |
| A10 | cartonGenerico() | Carton generico | MEDIA |
| A11 | retomarCotizacionExterno() | Retomar externo | MEDIA |

**Archivos a modificar**:
- src/app/routers/cotizaciones/router.py
- src/app/routers/cotizaciones/detalles.py

---

### SPRINT B: WORK ORDERS COMPLETAS (4-5 dias)

**Objetivo**: Completar funcionalidades de OT al 100%

| # | Tarea | Metodo Laravel | Prioridad |
|---|-------|---------------|-----------|
| B1 | validarExcel() | Validar estructura Excel | CRITICA |
| B2 | importarMuestrasDesdeExcel() | Importar muestras masivo | CRITICA |
| B3 | createCadMaterial() | Crear CAD/Material | ALTA |
| B4 | createCodigoMaterial() | Crear codigo material | ALTA |
| B5 | createLicitacion() | Crear OT tipo licitacion | ALTA |
| B6 | createFichaTecnica() | Crear OT ficha tecnica | ALTA |
| B7 | createEstudioBenchmarking() | Crear OT estudio bench | ALTA |
| B8 | editOtLicitacion() | Editar OT licitacion | MEDIA |
| B9 | editOtFicha() | Editar OT ficha | MEDIA |
| B10 | editOtEstudioBench() | Editar OT estudio | MEDIA |
| B11 | editDescriptionOt() | Editar descripcion | MEDIA |
| B12 | getMatriz() | Obtener matriz | MEDIA |
| B13 | getMatrizData() | Datos matriz | MEDIA |
| B14 | getCadByMaterial() | CAD por material | MEDIA |
| B15 | getListaCarton() | Lista cartones | MEDIA |
| B16 | getListaCartonEdit() | Lista cartones edit | MEDIA |
| B17 | filtroMultiplesOt() | Filtro multiples OT | BAJA |
| B18 | cotizarMultiplesOt() | Cotizar multiples | BAJA |
| B19 | getAplicarMckee() | Aplicar McKee | BAJA |
| B20 | cargaDetallesEstudio() | Cargar detalles | BAJA |

**Archivos a modificar**:
- src/app/routers/work_orders.py

---

### SPRINT C: GESTIONES COMPLETAS (3-4 dias)

**Objetivo**: Completar flujo de gestiones al 100%

| # | Tarea | Metodo Laravel | Prioridad |
|---|-------|---------------|-----------|
| C1 | store_pdf() | Guardar PDF completo | CRITICA |
| C2 | obtenerDatosPdf() | Extraer datos PDF | CRITICA |
| C3 | read_pdf() | Leer PDF | ALTA |
| C4 | validar_carton() | Validar carton PDF | ALTA |
| C5 | store_pdf_read() | Guardar lectura PDF | ALTA |
| C6 | store_boceto_pdf() | Guardar boceto | ALTA |
| C7 | generar_diseño_pdf() | PDF de diseno | MEDIA |
| C8 | detalleMckee() | Detalle McKee | MEDIA |
| C9 | descargarDetalleLogExcelMckee() | Excel McKee | MEDIA |
| C10 | usuarioAsignadoPorArea() | Usuario por area | MEDIA |
| C11 | obtenerProveedorExternoDiseño() | Proveedor externo | BAJA |
| C12 | show/edit/update/destroy | CRUD gestion | BAJA |

**Archivos a modificar**:
- src/app/routers/gestiones.py

---

### SPRINT D: MANTENEDOR MASIVO (4-5 dias)

**Objetivo**: Carga masiva de todas las tablas

| # | Tarea | Tabla | Prioridad |
|---|-------|-------|-----------|
| D1 | Cartones Esquineros | cartones_esquineros | ALTA |
| D2 | Papeles | papeles | ALTA |
| D3 | Fletes | fletes | ALTA |
| D4 | Mermas Corrugadoras | mermas_corrugadoras | ALTA |
| D5 | Mermas Convertidoras | mermas_convertidoras | ALTA |
| D6 | Paletizados | paletizados | ALTA |
| D7 | Insumos Paletizados | insumos_paletizados | ALTA |
| D8 | Tarifarios | tarifarios | ALTA |
| D9 | Consumo Adhesivo | consumo_adhesivo | MEDIA |
| D10 | Consumo Energia | consumo_energia | MEDIA |
| D11 | Matrices | matrices | MEDIA |
| D12 | Materiales | materiales | MEDIA |
| D13 | Factores Desarrollo | factores_desarrollo | MEDIA |
| D14 | Factores Seguridad | factores_seguridad | MEDIA |
| D15 | Factores Onda | factores_onda | MEDIA |
| D16 | Descargas Excel (todas) | * | MEDIA |

**Archivos a modificar**:
- src/app/routers/bulk_cotizador.py (expandir)

---

### SPRINT E: REPORTES COMPLETOS (3-4 dias)

**Objetivo**: Completar todos los reportes

| # | Tarea | Categoria | Prioridad |
|---|-------|-----------|-----------|
| E1 | reportTimeByAreaOtMonth completo | Tiempo | ALTA |
| E2 | reportDisenoEstructuralySalaMuestra | Sala | ALTA |
| E3 | reportSalaMuestra | Sala | ALTA |
| E4 | reportTiempoPrimeraMuestra | Muestras | ALTA |
| E5 | reportTiempoDisenadorExterno | Muestras | ALTA |
| E6 | reportMuestras completo | Muestras | MEDIA |
| E7 | reportIndicadorSalaMuestra | Sala | MEDIA |
| E8 | Funciones auxiliares de calculo | Internos | MEDIA |
| E9 | Excel exports faltantes | Exports | MEDIA |

**Archivos a modificar**:
- src/app/routers/reports.py

---

### SPRINT F: CLIENTES Y USUARIOS (2-3 dias)

**Objetivo**: Completar mantenedores de clientes/usuarios

| # | Tarea | Metodo | Prioridad |
|---|-------|--------|-----------|
| F1 | store_indicacion() | Indicaciones cliente | ALTA |
| F2 | edit_indicacion() | Indicaciones cliente | ALTA |
| F3 | update_indicacion() | Indicaciones cliente | ALTA |
| F4 | getIndicacionesEspeciales() | Indicaciones cliente | ALTA |
| F5 | getDatosContactoInstalacion() | Contacto instalacion | MEDIA |
| F6 | cargaUsersForm() | Import usuarios | MEDIA |
| F7 | importUsers() | Import usuarios | MEDIA |
| F8 | getUsersByArea() | Usuarios por area | MEDIA |
| F9 | getTiposVendedores() | Tipos vendedor | BAJA |
| F10 | editarContrasena() | Cambiar password | BAJA |

**Archivos a modificar**:
- src/app/routers/mantenedores/clients.py
- src/app/routers/mantenedores/users.py
- src/app/routers/cascades.py

---

### SPRINT G: MUESTRAS Y OTROS (2 dias)

**Objetivo**: Completar funcionalidades menores

| # | Tarea | Metodo | Prioridad |
|---|-------|--------|-----------|
| G1 | getCartonMuestra() | Carton muestra | MEDIA |
| G2 | muestraNoPrioritaria() | Quitar prioridad | MEDIA |
| G3 | usuarioAsignadoPorArea() | Muestras por area | MEDIA |
| G4 | UserWorkOrderController CRUD | Asignaciones OT | BAJA |
| G5 | CotizacionApprovalController | Aprobaciones | PARCIAL |

**Archivos a modificar**:
- src/app/routers/muestras.py

---

## CRONOGRAMA ESTIMADO

| Sprint | Dias | Acumulado |
|--------|------|-----------|
| Sprint A: Cotizaciones | 4 | 4 |
| Sprint B: Work Orders | 5 | 9 |
| Sprint C: Gestiones | 4 | 13 |
| Sprint D: Mantenedor Masivo | 5 | 18 |
| Sprint E: Reportes | 4 | 22 |
| Sprint F: Clientes/Usuarios | 3 | 25 |
| Sprint G: Muestras/Otros | 2 | 27 |
| **TOTAL** | **27 dias** | - |

---

## VERIFICACION FINAL

Al completar todos los sprints:

1. **Tests de paridad**: Ejecutar mismo input en Laravel y FastAPI, comparar output
2. **Tests de regresion**: 191 tests actuales deben seguir pasando
3. **Tests nuevos**: Agregar tests para cada funcionalidad nueva
4. **Revision manual**: Validar flujos completos en UI

---

## NOTAS IMPORTANTES

1. **NO INVENTAR**: Solo implementar lo que existe en Laravel
2. **VERIFICAR BD**: Consultar estructura de tablas antes de implementar
3. **DOCUMENTAR**: Cada endpoint nuevo debe tener docstring
4. **TESTS**: Cada sprint debe incluir tests unitarios

---

*Documento generado: 2026-02-13*
*Fuente: Analisis exhaustivo de repositorios Laravel y FastAPI*
