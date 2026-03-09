# INVEB Frontend - React

Aplicacion web para el Sistema de Gestion de Ordenes de Trabajo.

---

## Estructura

```
frontend/
├── src/
│   ├── components/            # Componentes reutilizables
│   │   ├── common/            # Tooltip, FileAttachments, etc.
│   │   ├── forms/             # FormInput, FormSelect, etc.
│   │   └── layout/            # Header, Sidebar, etc.
│   ├── pages/                 # Vistas principales
│   │   ├── WorkOrders/
│   │   ├── Cotizaciones/
│   │   ├── Mantenedores/
│   │   └── Reports/
│   ├── hooks/                 # Hooks personalizados
│   ├── validation/            # Schemas Yup
│   │   ├── validators.ts
│   │   ├── workOrderSchema.ts
│   │   └── cotizacionSchema.ts
│   ├── context/               # Contextos React
│   │   └── UserContext.tsx
│   ├── services/              # Llamadas API
│   └── types/                 # Tipos TypeScript
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── nginx.conf                 # Config para produccion
```

---

## Instalacion Local

```bash
# Instalar dependencias
npm install

# Configurar variables
cp .env.example .env
nano .env

# Iniciar servidor desarrollo
npm run dev

# Build produccion
npm run build
```

---

## Variables de Entorno

```env
VITE_API_URL=http://localhost:8000
```

---

## Tests

```bash
npm test
npm run test:coverage
```

---

## Dependencias Principales

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.0.0",
  "vite": "^5.0.0",
  "@mui/material": "^5.14.0",
  "react-hook-form": "^7.71.0",
  "yup": "^1.7.0",
  "@hookform/resolvers": "^5.2.0",
  "styled-components": "^6.1.0",
  "axios": "^1.6.0"
}
```

---

## Componentes Clave

| Componente | Descripcion |
|------------|-------------|
| Tooltip.tsx | Tooltips con 6 variantes |
| FileAttachments.tsx | Gestion de archivos adjuntos |
| FormInput.tsx | Input con validacion |
| FormSelect.tsx | Select con validacion |
| ProtectedRoute.tsx | Rutas protegidas por permisos |
| UserContext.tsx | Contexto global de usuario |

---

## Copiar Codigo Fuente

Para completar la carpeta frontend, copiar desde el proyecto original:

```bash
cp -r invebchile-envases-ot-00e7b5a341a2/invebchile-envases-ot-00e7b5a341a2/msw-envases-ot/frontend/* frontend/
```

---

*Version 2.0.0*
