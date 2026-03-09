# Plantilla de Documentación de Endpoint

## Endpoint: [MÉTODO] /api/[ruta]

### Descripción
[Descripción breve de lo que hace el endpoint]

### Fuente Laravel
```
Archivo: [path]
Método: [nombre_metodo]
Líneas: [X-Y]
```

### Request

#### Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Parámetros URL
| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `id` | int | Sí | ID del recurso |

#### Body (JSON)
```json
{
  "campo1": "string",
  "campo2": 123
}
```

### Response

#### Éxito (200)
```json
{
  "id": 1,
  "campo1": "valor",
  "campo2": 123
}
```

#### Errores
| Código | Descripción |
|--------|-------------|
| 400 | Datos inválidos |
| 401 | No autorizado |
| 404 | No encontrado |

### Schema Pydantic
```python
class [Nombre]Request(BaseModel):
    campo1: str
    campo2: int

class [Nombre]Response(BaseModel):
    id: int
    campo1: str
    campo2: int
```

### Ejemplo de Uso
```bash
curl -X GET "http://localhost:8000/api/[ruta]/1" \
  -H "Authorization: Bearer {token}"
```

---

*Implementado en: src/routers/[nombre].py*
*Issue relacionado: ID [X]*
