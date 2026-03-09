# Fuentes de Código - Proyecto INVEB

## Repositorios de Origen

### 1. Laravel 5.8 (Fuente de Verdad - Lógica de Negocio)
```
Ruta: /Users/danielallanorecabal/inveb/invebchile-envases-ot-ORIGINAL-LARAVEL58/
```

| Carpeta | Contenido |
|---------|-----------|
| `app/Http/Controllers/` | Controladores con lógica de negocio |
| `app/` | Modelos Eloquent (125 modelos) |
| `routes/web.php` | 524 rutas del sistema |
| `resources/views/` | Vistas Blade |
| `database/migrations/` | Estructura de base de datos |

### 2. FastAPI + React (Destino - Código Refactorizado)
```
Ruta: /Users/danielallanorecabal/inveb/invebchile-envases-ot-00e7b5a341a2/invebchile-envases-ot-00e7b5a341a2/msw-envases-ot/
```

#### Backend (FastAPI)
| Carpeta | Contenido | Estado |
|---------|-----------|--------|
| `src/app/routers/` | Endpoints API | En desarrollo |
| `src/app/schemas/` | Validaciones Pydantic | Parcial |
| `src/app/models/` | Modelos SQLModel | Parcial |
| `src/app/services/` | Lógica de negocio | En desarrollo |
| `src/app/utils/` | Utilidades | Funcional |

**Routers existentes:**
- `auth.py` - Autenticación
- `work_orders.py` - Órdenes de trabajo
- `cascades.py` - Reglas de cascada
- `form_options.py` - Opciones de formularios
- `materials.py` - Materiales
- `uploads.py` - Carga de archivos
- `pdfs.py` - Generación PDFs
- `exports.py` - Exportaciones
- `reports.py` - Reportes
- `emails.py` - Notificaciones email
- `mantenedores/` - CRUD mantenedores

#### Frontend (React + TypeScript)
| Carpeta | Contenido | Estado |
|---------|-----------|--------|
| `frontend/src/components/` | Componentes reutilizables | Funcional |
| `frontend/src/pages/` | Páginas/vistas | En desarrollo |
| `frontend/src/hooks/` | Hooks personalizados | Funcional |
| `frontend/src/services/` | Llamadas API | Funcional |
| `frontend/src/types/` | Tipos TypeScript | Parcial |

---

## Issues del Usuario Experto
```
/Users/danielallanorecabal/Downloads/Revisión v1.0 07012026.xlsx
/Users/danielallanorecabal/Downloads/Revisión v2.0 10012026.xlsx
```

**Estado:** 24 issues pendientes (NOK) de 58 totales

---

## Archivos a Copiar a ENTREGA_FINAL

### Backend
- [ ] `src/main.py`
- [ ] `src/app/routers/*.py`
- [ ] `src/app/schemas/*.py`
- [ ] `src/app/models/*.py`
- [ ] `src/app/services/*.py`
- [ ] `src/app/utils/*.py`
- [ ] `requirements.txt`

### Frontend
- [ ] `frontend/src/App.tsx`
- [ ] `frontend/src/components/*.tsx`
- [ ] `frontend/src/pages/*.tsx`
- [ ] `frontend/src/hooks/*.ts`
- [ ] `frontend/src/services/*.ts`
- [ ] `frontend/src/types/*.ts`
- [ ] `frontend/package.json`

---

*Última actualización: 2026-02-10*
