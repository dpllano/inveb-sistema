# INVEB - Sistema de Gestion de Ordenes de Trabajo

Sistema completo de gestion de ordenes de trabajo (OT) para empresa de envases de carton corrugado.
Migracion exitosa de Laravel 5.8 a FastAPI + React.

---

## Estado del Proyecto

| Metrica | Valor |
|---------|-------|
| **Version** | 2.0.0 |
| **Fecha** | 2026-02-23 |
| **Cobertura Funcional** | 100% |
| **Tests Backend** | 383 pasando |
| **Tests Frontend** | 150 pasando |
| **Endpoints API** | 450+ |
| **Componentes React** | 78 |

---

## Funcionalidades Principales

### Gestion de OTs
- CRUD completo de Ordenes de Trabajo
- 11 tipos de solicitud (Desarrollo Completo, Arte, Cotizacion, etc.)
- Flujo de aprobacion multinivel
- Asignacion dinamica por area

### Cotizador
- Cotizaciones con detalles (corrugados + esquineros)
- Sistema de versionado automatico
- Aprobacion 3 niveles segun margen
- Generacion PDF (Carta + Acuerdo + Ficha Tecnica)

### Mantenedores
- 69 tablas via endpoints genericos
- 24 tablas con import/export Excel masivo
- CRUD clientes, instalaciones, contactos
- Gestion de usuarios y roles

### Reportes
- 25+ endpoints de reportes
- Exportacion Excel
- KPIs y estadisticas

### Integraciones
- Exportacion SAP
- Envio de emails
- API Mobile

---

## Tecnologias

### Backend (FastAPI)
```
- Python 3.9+
- FastAPI 0.109.0
- SQLModel (ORM)
- PyMySQL
- PyJWT (autenticacion)
- ReportLab (PDFs)
- OpenPyXL (Excel)
```

### Frontend (React)
```
- React 18
- TypeScript 5
- Vite
- Material UI
- React Hook Form + Yup
- Styled Components
```

### Base de Datos
```
- MySQL 8.0
- 69+ tablas
- Charset: utf8mb4
```

---

## Estructura del Proyecto

```
ENTREGA_FINAL/
├── backend/                    # API FastAPI
│   ├── src/
│   │   ├── app/
│   │   │   ├── routers/       # Endpoints (26 routers)
│   │   │   ├── services/      # Logica de negocio
│   │   │   ├── schemas/       # Validaciones Pydantic
│   │   │   ├── middleware/    # Roles y permisos
│   │   │   └── config.py      # Configuracion
│   │   └── main.py
│   ├── tests/                 # Tests unitarios
│   └── requirements.txt
│
├── frontend/                   # React App
│   ├── src/
│   │   ├── components/        # 78 componentes
│   │   ├── pages/             # Vistas principales
│   │   ├── hooks/             # Hooks personalizados
│   │   ├── validation/        # Schemas Yup
│   │   ├── context/           # UserContext
│   │   └── services/          # API calls
│   └── package.json
│
├── docker/                     # Configuracion Docker
│   ├── docker-compose.yml     # Produccion
│   ├── docker-compose.local.yml # Desarrollo local
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx/
│
├── scripts/                    # Scripts de utilidad
│   ├── setup.sh               # Instalacion automatica
│   ├── start-local.sh         # Iniciar en local
│   └── backup-db.sh           # Backup de BD
│
├── docs/                       # Documentacion
│   ├── ARQUITECTURA.md
│   ├── INSTALACION.md
│   ├── INSTALACION_DOCKER.md
│   ├── API.md
│   ├── REGLAS_NEGOCIO.md
│   └── CHANGELOG.md
│
└── database/
    └── envases_ot.sql         # Script SQL completo
```

---

## Inicio Rapido con Docker

### Requisitos
- Docker 20.10+
- Docker Compose 2.0+

### Paso 1: Clonar y configurar
```bash
cd ENTREGA_FINAL

# Copiar archivo de configuracion
cp docker/.env.example docker/.env

# Editar variables (BD, JWT, etc.)
nano docker/.env
```

### Paso 2: Iniciar servicios
```bash
# Desarrollo local
docker compose -f docker/docker-compose.local.yml up -d

# Ver logs
docker compose -f docker/docker-compose.local.yml logs -f
```

### Paso 3: Acceder
- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000
- **Docs API:** http://localhost:8000/docs

---

## Inicio Rapido Sin Docker

### Backend
```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o: venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables
cp .env.example .env
nano .env

# Iniciar servidor
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables
cp .env.example .env
nano .env

# Iniciar servidor
npm run dev
```

---

## Variables de Entorno

### Backend (.env)
```env
# Base de Datos
LARAVEL_MYSQL_HOST=localhost
LARAVEL_MYSQL_PORT=3306
LARAVEL_MYSQL_USER=root
LARAVEL_MYSQL_PASSWORD=your_password
LARAVEL_MYSQL_DATABASE=envases_ot

# JWT
JWT_SECRET_KEY=your-super-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Entorno
ENVIRONMENT=development
DEBUG=true
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

---

## Documentacion

| Documento | Descripcion |
|-----------|-------------|
| [INSTALACION.md](docs/INSTALACION.md) | Guia de instalacion manual |
| [INSTALACION_DOCKER.md](docs/INSTALACION_DOCKER.md) | Guia de instalacion con Docker |
| [ARQUITECTURA.md](docs/ARQUITECTURA.md) | Diseno del sistema |
| [API.md](docs/API.md) | Documentacion de endpoints |
| [REGLAS_NEGOCIO.md](docs/REGLAS_NEGOCIO.md) | Reglas de negocio |
| [CHANGELOG.md](docs/CHANGELOG.md) | Historial de cambios |

---

## Endpoints Principales

### Autenticacion
```
POST /auth/login         # Login
POST /auth/logout        # Logout
GET  /auth/me            # Usuario actual
```

### Ordenes de Trabajo
```
GET    /work-orders           # Listar OTs
POST   /work-orders           # Crear OT
GET    /work-orders/{id}      # Obtener OT
PUT    /work-orders/{id}      # Actualizar OT
DELETE /work-orders/{id}      # Eliminar OT
POST   /work-orders/{id}/aprobar    # Aprobar
POST   /work-orders/{id}/rechazar   # Rechazar
```

### Cotizaciones
```
GET    /cotizaciones              # Listar
POST   /cotizaciones              # Crear
GET    /cotizaciones/{id}         # Obtener
PUT    /cotizaciones/{id}         # Actualizar
POST   /cotizaciones/{id}/aprobar # Aprobar
GET    /pdfs/cotizacion/{id}      # PDF
```

### Mantenedores
```
GET    /mantenedores/{tabla}           # Listar
POST   /mantenedores/{tabla}           # Crear
PUT    /mantenedores/{tabla}/{id}      # Actualizar
DELETE /mantenedores/{tabla}/{id}      # Eliminar
POST   /mantenedores/masivos/{tabla}/import  # Import Excel
GET    /mantenedores/masivos/{tabla}/descargar-excel  # Export
```

---

## Roles y Permisos

| ID | Rol | Permisos |
|----|-----|----------|
| 1 | SuperAdmin | Acceso total |
| 2 | Admin | Administracion |
| 3 | JefeVenta | Aprobar OTs, gestionar vendedores |
| 4 | Vendedor | Crear OTs |
| 5 | JefeDesarrollo | Gestionar ingenieros |
| 6 | Ingeniero | Desarrollo de productos |
| 7 | JefeDiseno | Gestionar disenadores |
| 8 | Disenador | Diseno grafico |
| 9 | JefeCatalogador | Gestionar catalogacion |
| 10 | Catalogador | Catalogar productos |
| 13 | JefeMuestras | Gestionar muestras |
| 14 | TecnicoMuestras | Producir muestras |
| 15 | VendedorExterno | Solo tipos 1, 5 |

---

## Tests

### Backend
```bash
cd backend
pytest tests/ -v --cov=src
```

### Frontend
```bash
cd frontend
npm test
```

---

## Contacto

**INVEB Chile**
- Web: www.inveb.cl
- Sistema desarrollado: 2026

---

*Version 2.0.0 - Migracion completa Laravel a FastAPI/React*
