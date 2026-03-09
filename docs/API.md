# Documentacion de API - INVEB

API REST para el Sistema de Gestion de Ordenes de Trabajo INVEB.

---

## Informacion General

| Parametro | Valor |
|-----------|-------|
| Base URL | `http://localhost:8000` (dev) o `/api` (prod) |
| Formato | JSON |
| Autenticacion | Bearer Token (JWT) |
| Version | 2.0.0 |

### Documentacion Interactiva

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI JSON:** `http://localhost:8000/openapi.json`

---

## Autenticacion

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@inveb.cl",
  "password": "contraseña"
}
```

**Respuesta exitosa (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "usuario@inveb.cl",
    "nombre": "Usuario",
    "role_id": 4
  }
}
```

### Usar Token
```http
GET /work-orders
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Usuario Actual
```http
GET /auth/me
Authorization: Bearer {token}
```

---

## Endpoints Principales

### Health Check
```http
GET /health
```
Respuesta: `{"status": "healthy"}`

---

## Ordenes de Trabajo (OTs)

### Listar OTs
```http
GET /work-orders
Authorization: Bearer {token}
```

**Query Parameters:**
| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| page | int | Pagina (default: 1) |
| per_page | int | Items por pagina (default: 20) |
| status | int | Filtrar por estado |
| client_id | int | Filtrar por cliente |
| user_id | int | Filtrar por usuario asignado |

### Obtener OT
```http
GET /work-orders/{id}
Authorization: Bearer {token}
```

### Crear OT
```http
POST /work-orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "tipo_solicitud": 1,
  "client_id": 1,
  "installation_id": 1,
  "contact_id": 1,
  "nombre_producto": "Caja XYZ",
  "product_type_id": 3,
  "impresion_id": 2,
  "planta_id": 1,
  "carton_id": 5,
  ...
}
```

### Actualizar OT
```http
PUT /work-orders/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre_producto": "Caja XYZ Actualizada",
  ...
}
```

### Aprobar OT
```http
POST /work-orders/{id}/aprobar
Authorization: Bearer {token}
Content-Type: application/json

{
  "comentario": "Aprobado por Jefe de Desarrollo"
}
```

### Rechazar OT
```http
POST /work-orders/{id}/rechazar
Authorization: Bearer {token}
Content-Type: application/json

{
  "motivo": "Especificaciones incompletas"
}
```

### Asignar Usuario
```http
POST /work-orders/{id}/asignar
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 5,
  "area_id": 2
}
```

---

## Cotizaciones

### Listar Cotizaciones
```http
GET /cotizaciones
Authorization: Bearer {token}
```

### Crear Cotizacion
```http
POST /cotizaciones
Authorization: Bearer {token}
Content-Type: application/json

{
  "client_id": 1,
  "vendedor_id": 4,
  "condiciones_pago": "30 dias",
  "moneda": "CLP",
  "detalles": [
    {
      "descripcion": "Caja RSC",
      "cantidad": 1000,
      "precio_unitario": 250.5,
      "tipo": "corrugado"
    }
  ]
}
```

### Aprobar Cotizacion
```http
POST /cotizaciones/{id}/aprobar
Authorization: Bearer {token}
Content-Type: application/json

{
  "nivel": 1,
  "comentario": "Aprobado"
}
```

### Generar PDF
```http
GET /pdfs/cotizacion/{id}?completo=true
Authorization: Bearer {token}
```

Respuesta: Archivo PDF

---

## Mantenedores Genericos

El sistema provee endpoints genericos para 69+ tablas de mantenedores.

### Listar Registros
```http
GET /mantenedores/{tabla}
Authorization: Bearer {token}
```

**Tablas disponibles:**
- clients, users, roles, processes, armados, pegados
- cartones, carton_esquineros, papeles, ondas
- plantas, rubros, styles, envases, hierarchies
- Y 50+ tablas mas...

### Crear Registro
```http
POST /mantenedores/{tabla}
Authorization: Bearer {token}
Content-Type: application/json

{
  "campo1": "valor1",
  "campo2": "valor2"
}
```

### Actualizar Registro
```http
PUT /mantenedores/{tabla}/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "campo1": "nuevo_valor"
}
```

### Eliminar Registro
```http
DELETE /mantenedores/{tabla}/{id}
Authorization: Bearer {token}
```

---

## Mantenedores Masivos (Excel)

### Descargar Plantilla Excel
```http
GET /mantenedores/masivos/{tabla}/descargar-excel
Authorization: Bearer {token}
```

### Importar Excel
```http
POST /mantenedores/masivos/{tabla}/import
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [archivo.xlsx]
```

**Tablas con import masivo:**
- cartones, carton_esquineros, papeles
- fletes_corrugados, fletes_esquineros
- mermas, matrices, materiales, factores
- maquilas, ondas, plantas, variables
- margenes, mano_obra
- Y mas...

---

## Opciones de Formulario

### Todas las Opciones
```http
GET /form-options
Authorization: Bearer {token}
```

Retorna todas las opciones para selectores del formulario OT.

### Opciones Especificas
```http
GET /form-options/product-types
GET /form-options/impresion-types
GET /form-options/plantas
GET /form-options/cartones
GET /form-options/procesos
GET /form-options/armados
...
```

### Opciones Cotizador
```http
GET /form-options/cotizador
Authorization: Bearer {token}
```

Retorna opciones filtradas para el cotizador.

---

## Cascadas AJAX

### Instalaciones de Cliente
```http
GET /cascades/clientes/{client_id}/instalaciones
Authorization: Bearer {token}
```

### Contactos de Cliente/Instalacion
```http
GET /cascades/clientes/{client_id}/contactos?instalacion_id=1
Authorization: Bearer {token}
```

### Datos de CAD
```http
GET /cascades/cads/{cad_id}
Authorization: Bearer {token}
```

### Impresiones (filtradas)
```http
GET /cascades/impresiones
Authorization: Bearer {token}
```

### Recubrimiento Interno
```http
GET /cascades/recubrimiento-interno?cinta=1
Authorization: Bearer {token}
```

### Plantas Objetivo
```http
GET /cascades/plantas-objetivo?impresion_id=2&recubrimiento_interno_id=1
Authorization: Bearer {token}
```

---

## Reportes

### Listar Reportes
```http
GET /reports
Authorization: Bearer {token}
```

### Reporte de OTs
```http
GET /reports/work-orders
Authorization: Bearer {token}
```

### Reporte de Cotizaciones
```http
GET /reports/cotizaciones
Authorization: Bearer {token}
```

### Exportar a Excel
```http
GET /exports/work-orders/excel
Authorization: Bearer {token}
```

---

## PDFs

### Etiqueta OT
```http
GET /pdfs/etiqueta/{ot_id}
Authorization: Bearer {token}
```

### Ficha Tecnica
```http
GET /pdfs/ficha/{ot_id}
Authorization: Bearer {token}
```

### Cotizacion Completa
```http
GET /pdfs/cotizacion/{id}?completo=true&incluir_ficha=true
Authorization: Bearer {token}
```

---

## Codigos de Respuesta

| Codigo | Descripcion |
|--------|-------------|
| 200 | OK - Operacion exitosa |
| 201 | Created - Registro creado |
| 204 | No Content - Eliminado exitosamente |
| 400 | Bad Request - Datos invalidos |
| 401 | Unauthorized - Token invalido o expirado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 422 | Unprocessable Entity - Validacion fallida |
| 500 | Internal Server Error - Error del servidor |

---

## Paginacion

Las respuestas paginadas incluyen:

```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "per_page": 20,
  "pages": 8
}
```

---

## Roles y Permisos

| Role ID | Nombre | Permisos Clave |
|---------|--------|----------------|
| 1 | SuperAdmin | Todo |
| 2 | Admin | Administracion |
| 3 | JefeVenta | Aprobar OTs, gestionar vendedores |
| 4 | Vendedor | Crear OTs (tipos 1-7) |
| 5 | JefeDesarrollo | Gestionar ingenieros |
| 6 | Ingeniero | Desarrollo de productos |
| 7 | JefeDiseno | Gestionar disenadores |
| 8 | Disenador | Diseno grafico |
| 9 | JefeCatalogador | Catalogacion |
| 10 | Catalogador | Catalogar |
| 13 | JefeMuestras | Gestionar muestras |
| 14 | TecnicoMuestras | Producir muestras |
| 15 | VendedorExterno | Solo tipos 1, 5 |

---

*Documentacion actualizada: 2026-02-23*
