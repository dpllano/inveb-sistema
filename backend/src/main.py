"""
INVEB Envases OT - Microservicio Principal
API para gestión de Órdenes de Trabajo y reglas de cascada.

Stack: Python 3.12 + FastAPI + MySQL
Estándar: Monitor One
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
import os

from app.config import get_settings
from app.routers import ROUTERS

settings = get_settings()

# Configurar CORS - permitir todos los origenes de Railway y localhost
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173",
    "http://localhost:8000",
    "https://inveb-frontend-production.up.railway.app",
    "https://inveb-api-production.up.railway.app",
    "https://inveb-api-production-a4a9.up.railway.app",
]


class CORSMiddlewareCustom(BaseHTTPMiddleware):
    """Middleware personalizado para asegurar CORS en todas las respuestas."""

    async def dispatch(self, request: Request, call_next):
        # Manejar preflight OPTIONS
        if request.method == "OPTIONS":
            origin = request.headers.get("origin", "")
            if origin in CORS_ORIGINS or "*" in CORS_ORIGINS:
                return JSONResponse(
                    content={},
                    headers={
                        "Access-Control-Allow-Origin": origin,
                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                        "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Origin, X-Requested-With",
                        "Access-Control-Allow-Credentials": "true",
                        "Access-Control-Max-Age": "600",
                    }
                )

        # Procesar request normal
        response = await call_next(request)

        # Agregar headers CORS a todas las respuestas
        origin = request.headers.get("origin", "")
        if origin in CORS_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, Origin, X-Requested-With"

        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle management."""
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="""
    API de INVEB Envases para gestión de Órdenes de Trabajo.

    ## Funcionalidades

    * **Cascade Rules**: Reglas de habilitación/deshabilitación de campos
    * **Valid Combinations**: Combinaciones válidas de producto/impresión/FSC
    * **Validation Endpoints**: Validación en tiempo real del formulario

    ## Estándares

    Desarrollado siguiendo estándares Monitor One de Tecnoandina.
    """,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Agregar middleware CORS personalizado PRIMERO (se ejecuta ultimo)
app.add_middleware(CORSMiddlewareCustom)

# Tambien agregar el CORSMiddleware estandar como fallback
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Registrar routers
for router in ROUTERS:
    app.include_router(router, prefix=settings.API_PREFIX)

# Montar archivos estáticos (para servir archivos subidos)
# Usar directorio relativo en local, /app/files en Docker
FILES_DIR = Path(os.environ.get("FILES_DIR", str(Path(__file__).parent.parent / "files")))
FILES_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/files", StaticFiles(directory=str(FILES_DIR)), name="files")


@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy"
    }


@app.get("/health")
def health_check():
    """Health check para Kubernetes."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
