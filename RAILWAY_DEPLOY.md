# Despliegue en Railway - INVEB Sistema

Esta guía explica cómo desplegar el sistema INVEB en Railway.

## Arquitectura

El sistema consta de 3 servicios:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│      MySQL      │
│   (React/Vite)  │     │    (FastAPI)    │     │    (Railway)    │
│   Puerto $PORT  │     │   Puerto $PORT  │     │   Puerto 3306   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Paso 1: Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Click en **"New Project"**
3. Selecciona **"Empty Project"**

## Paso 2: Agregar Base de Datos MySQL

1. En tu proyecto, click en **"+ New"**
2. Selecciona **"Database"** → **"Add MySQL"**
3. Railway creará la base de datos automáticamente
4. Anota las variables de conexión:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_URL` (URL completa)

## Paso 3: Importar Datos a MySQL

### Opción A: Desde Railway CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Conectar al proyecto
railway link

# Conectar a MySQL
railway connect mysql

# Importar dump
mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < dump.sql
```

### Opción B: Usando Adminer/phpMyAdmin

1. En Railway, agrega el plugin **Adminer**
2. Accede a la URL de Adminer
3. Importa tu archivo SQL

## Paso 4: Desplegar Backend

1. En tu proyecto Railway, click en **"+ New"**
2. Selecciona **"GitHub Repo"**
3. Conecta tu repositorio
4. Configura el servicio:
   - **Root Directory**: `ENTREGA_FINAL/backend`
   - **Build Command**: `pip install -r src/requirements.txt`
   - **Start Command**: `cd src && uvicorn main:app --host 0.0.0.0 --port $PORT`

### Variables de Entorno Backend

En la pestaña **Variables**, agrega:

```env
# Aplicación
APP_NAME=INVEB Envases OT API
APP_VERSION=1.0.0
DEBUG=false
API_PREFIX=/api/v1

# Base de Datos (usar referencia a MySQL)
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}

# JWT
JWT_SECRET_KEY=genera-una-clave-secreta-larga-aqui
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS (actualiza con tu URL de frontend)
CORS_ORIGINS=https://inveb-frontend-production.up.railway.app

# Archivos
FILES_DIR=/app/files
```

## Paso 5: Desplegar Frontend

1. En tu proyecto Railway, click en **"+ New"**
2. Selecciona **"GitHub Repo"** (el mismo repo)
3. Configura el servicio:
   - **Root Directory**: `ENTREGA_FINAL/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve dist -s -l $PORT`

### Variables de Entorno Frontend

```env
# URL del Backend (actualiza con tu URL real)
VITE_API_URL=https://tu-backend.up.railway.app/api/v1
VITE_API_ROOT_URL=https://tu-backend.up.railway.app
```

## Paso 6: Configurar Dominios

1. En cada servicio, ve a **Settings** → **Domains**
2. Railway genera un dominio automático: `*.up.railway.app`
3. Opcionalmente, agrega un dominio personalizado

## Paso 7: Actualizar CORS

Después de obtener la URL del frontend:

1. Ve al servicio Backend → Variables
2. Actualiza `CORS_ORIGINS` con la URL del frontend
3. Redeploy el backend

## Verificación

### Backend
```bash
curl https://tu-backend.up.railway.app/health
# Respuesta: {"status": "ok"}
```

### Frontend
Accede a https://tu-frontend.up.railway.app en el navegador

## Comandos Útiles Railway CLI

```bash
# Ver logs
railway logs

# Conectar a MySQL
railway connect mysql

# Ver variables
railway variables

# Redeploy
railway up

# Ver servicios
railway status
```

## Solución de Problemas

### Error CORS
- Verifica que `CORS_ORIGINS` incluya la URL exacta del frontend
- Asegúrate de no tener slash final (/) en las URLs

### Error de Conexión a BD
- Verifica que las variables de MySQL estén correctamente referenciadas
- Usa `${{MySQL.MYSQL_HOST}}` para referenciar variables del servicio MySQL

### Frontend no carga datos
- Verifica `VITE_API_URL` apunte al backend correcto
- Revisa la consola del navegador para errores de red

### Build falla
- Revisa los logs de build en Railway
- Verifica que todas las dependencias estén en package.json/requirements.txt

## Estructura de Costos

Railway tiene:
- **Free Tier**: $5 de crédito gratis/mes
- **Hobby**: $5/mes + uso
- **Pro**: $20/mes + uso

Para este proyecto (3 servicios pequeños), el costo estimado es ~$10-20/mes.

## Contacto

Para soporte técnico, contactar al equipo de desarrollo.
