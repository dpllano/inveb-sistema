# INVEB Backend - FastAPI

API REST para el Sistema de Gestion de Ordenes de Trabajo.

---

## Estructura

```
backend/
├── src/
│   ├── app/
│   │   ├── routers/           # Endpoints API
│   │   │   ├── work_orders.py
│   │   │   ├── cotizaciones/
│   │   │   ├── mantenedores/
│   │   │   ├── cascades.py
│   │   │   ├── form_options.py
│   │   │   ├── reports.py
│   │   │   ├── pdfs.py
│   │   │   └── ...
│   │   ├── services/          # Logica de negocio
│   │   ├── schemas/           # Validaciones Pydantic
│   │   ├── middleware/        # Roles y permisos
│   │   ├── constants.py       # Roles, areas
│   │   └── config.py          # Configuracion
│   ├── main.py
│   └── requirements.txt
└── tests/                     # Tests unitarios
```

---

## Instalacion Local

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r src/requirements.txt

# Configurar variables
cp .env.example .env
nano .env

# Iniciar servidor
cd src
uvicorn main:app --reload --port 8000
```

---

## Variables de Entorno

```env
LARAVEL_MYSQL_HOST=localhost
LARAVEL_MYSQL_PORT=3306
LARAVEL_MYSQL_USER=inveb_user
LARAVEL_MYSQL_PASSWORD=password
LARAVEL_MYSQL_DATABASE=envases_ot

JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

ENVIRONMENT=development
DEBUG=true
```

---

## Tests

```bash
cd src
pytest tests/ -v --cov=app
```

---

## Routers Principales

| Router | Endpoints | Descripcion |
|--------|-----------|-------------|
| work_orders.py | 15+ | CRUD OTs, aprobaciones |
| cotizaciones/ | 20+ | Cotizaciones, detalles, PDF |
| cascades.py | 12+ | Cascadas AJAX |
| form_options.py | 25+ | Opciones de formulario |
| mantenedores/generic.py | 8 | CRUD 69 tablas |
| mantenedores/masivos.py | 48 | Import/Export Excel |
| reports.py | 25+ | Reportes |
| pdfs.py | 5 | Generacion PDFs |

---

## Copiar Codigo Fuente

Para completar la carpeta backend, copiar desde el proyecto original:

```bash
cp -r invebchile-envases-ot-00e7b5a341a2/invebchile-envases-ot-00e7b5a341a2/msw-envases-ot/src/* backend/src/
```

---

*Version 2.0.0*
