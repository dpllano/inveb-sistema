# Guía de Instalación - INVEB

## Requisitos del Sistema

### Software
| Componente | Versión Mínima |
|------------|----------------|
| Python | 3.10+ |
| Node.js | 18+ |
| MySQL | 8.0+ |
| npm | 9+ |

### Hardware Recomendado
- CPU: 2 cores
- RAM: 4 GB
- Disco: 10 GB

---

## Instalación

### 1. Clonar/Copiar el Proyecto
```bash
# Copiar carpeta ENTREGA_FINAL al servidor
cp -r ENTREGA_FINAL /ruta/destino/
cd /ruta/destino/ENTREGA_FINAL
```

### 2. Base de Datos

```bash
# Crear base de datos
mysql -u root -p -e "CREATE DATABASE envases_ot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Importar estructura y datos
mysql -u root -p envases_ot < /ruta/a/01_DATABASE_envases_ot.sql
```

### 3. Backend (FastAPI)

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales de BD
```

#### Variables de Entorno (.env)
```
DATABASE_URL=mysql+pymysql://usuario:password@localhost:3306/envases_ot
SECRET_KEY=tu_clave_secreta_aqui
DEBUG=false
```

#### Iniciar Backend
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 4. Frontend (React)

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar API URL
cp .env.example .env
# Editar VITE_API_URL=http://localhost:8000
```

#### Build de Producción
```bash
npm run build
```

#### Desarrollo
```bash
npm run dev
```

---

## Verificación

### Backend
```bash
# Verificar API funcionando
curl http://localhost:8000/health

# Documentación automática
# Abrir en navegador: http://localhost:8000/docs
```

### Frontend
```bash
# Abrir en navegador: http://localhost:5173
```

---

## Docker (Opcional)

```bash
cd docker
docker-compose up -d
```

---

## Solución de Problemas

### Error de conexión a BD
- Verificar credenciales en .env
- Verificar que MySQL esté corriendo
- Verificar firewall

### Error de CORS
- Verificar configuración de CORS en main.py
- Agregar origen del frontend a la lista permitida

---

*Última actualización: 2026-02-10*
