# Arquitectura del Sistema - INVEB

## Visión General

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│    MySQL    │
│  React+TS   │◀────│   FastAPI   │◀────│   Database  │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Backend (FastAPI)

### Estructura
```
backend/
├── src/
│   ├── main.py              # Punto de entrada
│   ├── routers/             # Endpoints organizados por módulo
│   │   ├── auth.py          # Autenticación JWT
│   │   ├── work_orders.py   # CRUD OT
│   │   ├── cascades.py      # Reglas de cascada
│   │   └── mantenedores/    # CRUD catálogos
│   ├── schemas/             # Validación Pydantic
│   ├── models/              # Modelos SQLModel
│   ├── services/            # Lógica de negocio
│   └── utils/               # Utilidades
├── tests/
└── requirements.txt
```

### Patrones Utilizados

#### Repository Pattern
```python
# services/work_order_service.py
class WorkOrderService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: int) -> WorkOrder:
        return self.db.query(WorkOrder).filter(WorkOrder.id == id).first()
```

#### Dependency Injection
```python
# routers/work_orders.py
@router.get("/{id}")
async def get_work_order(
    id: int,
    db: Session = Depends(get_db)
):
    service = WorkOrderService(db)
    return service.get_by_id(id)
```

### Autenticación
- JWT Tokens
- Middleware de autenticación
- Roles: admin, usuario, vendedor

---

## Frontend (React + TypeScript)

### Estructura
```
frontend/
├── src/
│   ├── App.tsx              # Componente raíz
│   ├── components/          # Componentes reutilizables
│   │   ├── forms/           # Formularios
│   │   ├── tables/          # Tablas
│   │   └── modals/          # Modales
│   ├── pages/               # Páginas/vistas
│   ├── hooks/               # Hooks personalizados
│   ├── services/            # Llamadas API
│   └── types/               # Tipos TypeScript
├── package.json
└── vite.config.ts
```

### Patrones Utilizados

#### Custom Hooks
```typescript
// hooks/useWorkOrders.ts
export function useWorkOrders() {
  const [data, setData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const response = await api.get('/work-orders');
    setData(response.data);
    setLoading(false);
  };

  return { data, loading, fetchAll };
}
```

#### Service Layer
```typescript
// services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## Base de Datos

### Tablas Principales
| Tabla | Descripción |
|-------|-------------|
| `work_orders` | Órdenes de trabajo |
| `clients` | Clientes |
| `instalaciones` | Instalaciones de clientes |
| `cads` | Diseños CAD |
| `cartones` | Tipos de cartón |
| `cascade_valid_combinations` | Reglas de cascada |

### Relaciones Clave
```
clients (1) ──── (N) instalaciones
clients (1) ──── (N) work_orders
work_orders (N) ──── (1) cads
cascade_rules (1) ──── (N) cascade_valid_combinations
```

---

## Flujo de Datos

### Creación de OT
```
1. Usuario selecciona Cliente
2. Frontend llama GET /api/clients/{id}/instalaciones
3. Usuario selecciona Instalación
4. Frontend llama GET /api/instalaciones/{id}/contactos
5. Usuario completa formulario
6. Frontend llama POST /api/work-orders
7. Backend valida cascadas
8. Backend guarda en BD
9. Frontend muestra confirmación
```

---

## Seguridad

- HTTPS en producción
- JWT con expiración
- Validación de entrada con Pydantic
- Sanitización de queries SQL
- CORS configurado

---

*Última actualización: 2026-02-10*
