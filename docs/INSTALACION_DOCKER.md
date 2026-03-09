# Guia de Instalacion con Docker - INVEB

Esta guia explica paso a paso como instalar y ejecutar el sistema INVEB usando Docker.

---

## Requisitos Previos

### Software Requerido
| Software | Version Minima | Verificar |
|----------|----------------|-----------|
| Docker | 20.10+ | `docker --version` |
| Docker Compose | 2.0+ | `docker compose version` |
| Git | 2.30+ | `git --version` |

### Instalacion de Docker

#### macOS
```bash
# Opcion 1: Docker Desktop (recomendado)
# Descargar de: https://www.docker.com/products/docker-desktop

# Opcion 2: Homebrew
brew install --cask docker

# Iniciar Docker Desktop desde Aplicaciones
```

#### Linux (Ubuntu/Debian)
```bash
# Actualizar repositorios
sudo apt-get update

# Instalar dependencias
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Agregar clave GPG de Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Agregar repositorio
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Agregar usuario al grupo docker (evitar sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verificar
docker --version
docker compose version
```

#### Windows
```powershell
# Opcion 1: Docker Desktop (recomendado)
# Descargar de: https://www.docker.com/products/docker-desktop
# Requiere: Windows 10/11 Pro con WSL2 habilitado

# Habilitar WSL2 primero:
wsl --install

# Reiniciar y luego instalar Docker Desktop
```

---

## Estructura de Archivos

```
ENTREGA_FINAL/
├── backend/              # Codigo FastAPI
│   ├── src/
│   └── requirements.txt
├── frontend/             # Codigo React
│   ├── src/
│   └── package.json
├── docker/               # Configuracion Docker
│   ├── docker-compose.yml          # Produccion
│   ├── docker-compose.local.yml    # Desarrollo
│   ├── Dockerfile.backend
│   ├── Dockerfile.backend.local
│   ├── Dockerfile.frontend
│   ├── Dockerfile.frontend.local
│   ├── .env.example
│   ├── nginx/
│   │   └── nginx.conf
│   └── mysql/
│       └── init/                   # Scripts SQL iniciales
├── database/
│   └── envases_ot.sql    # Dump de BD
└── scripts/
    └── setup.sh          # Script automatizado
```

---

## Instalacion Paso a Paso

### Paso 1: Obtener el Codigo

```bash
# Navegar al directorio de trabajo
cd /ruta/donde/quieres/el/proyecto

# Copiar carpeta ENTREGA_FINAL
# (o clonar si esta en repositorio)
cp -r /origen/ENTREGA_FINAL ./

cd ENTREGA_FINAL
```

### Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp docker/.env.example docker/.env

# Editar con tu editor preferido
nano docker/.env
# o: code docker/.env
# o: vim docker/.env
```

**Configuracion minima requerida:**
```env
# Base de Datos
DB_HOST=db
DB_PORT=3306
DB_NAME=envases_ot
DB_USER=inveb_user
DB_PASSWORD=tu_password_seguro
DB_ROOT_PASSWORD=tu_root_password_seguro

# JWT (IMPORTANTE: cambiar en produccion)
JWT_SECRET=genera-una-clave-segura-de-al-menos-32-caracteres

# Entorno
ENVIRONMENT=development
DEBUG=true
```

**Generar clave JWT segura:**
```bash
# Linux/Mac
openssl rand -hex 32

# Resultado ejemplo: a1b2c3d4e5f6...
# Copiar y pegar en JWT_SECRET
```

### Paso 3: Preparar Base de Datos

```bash
# Crear directorio para scripts SQL iniciales
mkdir -p docker/mysql/init

# Copiar dump de base de datos
cp database/envases_ot.sql docker/mysql/init/01_schema.sql
```

**Nota:** Los archivos en `docker/mysql/init/` se ejecutan automaticamente al crear el contenedor por primera vez, en orden alfabetico.

### Paso 4: Iniciar Servicios (Desarrollo Local)

```bash
# Desde la raiz de ENTREGA_FINAL
cd docker

# Construir e iniciar contenedores
docker compose -f docker-compose.local.yml up -d --build

# Ver estado de contenedores
docker compose -f docker-compose.local.yml ps

# Ver logs en tiempo real
docker compose -f docker-compose.local.yml logs -f
```

**Resultado esperado:**
```
NAME                  STATUS    PORTS
inveb-mysql-local     running   0.0.0.0:3306->3306/tcp
inveb-backend-local   running   0.0.0.0:8000->8000/tcp
inveb-frontend-local  running   0.0.0.0:3000->3000/tcp
```

### Paso 5: Verificar Instalacion

```bash
# Backend API
curl http://localhost:8000/health
# Respuesta: {"status":"healthy"}

# Frontend
# Abrir en navegador: http://localhost:3000

# API Docs
# Abrir en navegador: http://localhost:8000/docs
```

---

## Comandos Utiles

### Gestionar Contenedores

```bash
# Iniciar
docker compose -f docker/docker-compose.local.yml up -d

# Detener
docker compose -f docker/docker-compose.local.yml down

# Reiniciar
docker compose -f docker/docker-compose.local.yml restart

# Ver logs
docker compose -f docker/docker-compose.local.yml logs -f

# Ver logs de un servicio especifico
docker compose -f docker/docker-compose.local.yml logs -f backend

# Reconstruir despues de cambios
docker compose -f docker/docker-compose.local.yml up -d --build
```

### Acceder a Contenedores

```bash
# Entrar al contenedor backend
docker exec -it inveb-backend-local bash

# Entrar al contenedor MySQL
docker exec -it inveb-mysql-local mysql -u root -p

# Ejecutar comando en contenedor
docker exec inveb-backend-local python -c "print('Hello')"
```

### Base de Datos

```bash
# Conectar a MySQL
docker exec -it inveb-mysql-local mysql -u root -p envases_ot

# Backup de base de datos
docker exec inveb-mysql-local mysqldump -u root -p envases_ot > backup.sql

# Restaurar base de datos
docker exec -i inveb-mysql-local mysql -u root -p envases_ot < backup.sql
```

### Limpiar

```bash
# Detener y eliminar contenedores
docker compose -f docker/docker-compose.local.yml down

# Eliminar volumenes (CUIDADO: borra datos)
docker compose -f docker/docker-compose.local.yml down -v

# Limpiar imagenes no usadas
docker image prune -a

# Limpiar todo (CUIDADO)
docker system prune -a
```

---

## Desarrollo con Hot-Reload

El setup local incluye hot-reload para desarrollo:

### Backend (FastAPI)
- Los cambios en `backend/src/` se reflejan automaticamente
- Uvicorn detecta cambios y reinicia el servidor

### Frontend (React)
- Los cambios en `frontend/src/` se reflejan automaticamente
- Vite HMR actualiza el navegador sin recargar

---

## Produccion

### Iniciar en Modo Produccion

```bash
cd docker

# Configurar variables de produccion
cp .env.example .env
nano .env  # Cambiar ENVIRONMENT=production, DEBUG=false

# Iniciar
docker compose -f docker-compose.yml up -d --build

# El sistema estara disponible en:
# http://localhost (puerto 80)
```

### Configuracion SSL/HTTPS

Para produccion con HTTPS:

1. Obtener certificados SSL (Let's Encrypt o comercial)
2. Colocar en `docker/nginx/ssl/`:
   - `cert.pem` (certificado)
   - `key.pem` (clave privada)
3. Actualizar `nginx.conf` para usar SSL

---

## Solucion de Problemas

### Puerto ya en uso

```bash
# Error: port 3306 is already allocated

# Verificar que usa el puerto
lsof -i :3306

# Opcion 1: Detener el servicio que usa el puerto
sudo systemctl stop mysql

# Opcion 2: Cambiar puerto en .env
DB_EXTERNAL_PORT=3307
```

### Contenedor no inicia

```bash
# Ver logs del contenedor
docker compose -f docker/docker-compose.local.yml logs backend

# Errores comunes:
# - "Connection refused to MySQL" -> Esperar que MySQL inicie primero
# - "Permission denied" -> Verificar permisos de archivos
```

### Base de datos vacia

```bash
# Verificar que el dump SQL esta en la ubicacion correcta
ls docker/mysql/init/

# Reiniciar contenedor MySQL desde cero
docker compose -f docker/docker-compose.local.yml down -v
docker compose -f docker/docker-compose.local.yml up -d
```

### Reset completo

```bash
# Eliminar todo y empezar de nuevo
docker compose -f docker/docker-compose.local.yml down -v
docker system prune -a --volumes

# Reconstruir
docker compose -f docker/docker-compose.local.yml up -d --build
```

---

## Verificacion Final

Despues de la instalacion, verificar:

| Servicio | URL | Esperado |
|----------|-----|----------|
| Frontend | http://localhost:3000 | Pagina de login |
| API | http://localhost:8000/health | `{"status":"healthy"}` |
| API Docs | http://localhost:8000/docs | Swagger UI |
| MySQL | localhost:3306 | Conexion exitosa |

---

## Soporte

Si encuentras problemas:

1. Verificar logs: `docker compose logs -f`
2. Verificar estado: `docker compose ps`
3. Verificar variables: `docker compose config`
4. Consultar documentacion de Docker

---

*Guia actualizada: 2026-02-23*
