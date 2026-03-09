# Sprint K - Frontend Validaciones

## Resumen

Sprint K implementa validaciones de formularios, contexto de usuario y control de permisos en el frontend React.

## Componentes Implementados

### K.1 - Dependencias

**Paquetes instalados:**
- `react-hook-form@7.71.1` - Manejo de formularios
- `yup@1.7.1` - Validación de schemas
- `@hookform/resolvers@5.2.2` - Integración RHF + Yup

### K.2 - Schemas de Validación

**Ubicación:** `src/schemas/`

#### validators.ts
Validadores específicos para Chile:

```typescript
// Validar RUT chileno (módulo 11)
validarRUT('12345678-5') // true/false

// Validar teléfono chileno (+56 9 XXXX XXXX)
validarTelefonoChileno('+56912345678') // true/false

// Validar email
validarEmail('test@example.com') // true/false

// Formatear RUT (XX.XXX.XXX-X)
formatearRUT('123456785') // '12.345.678-5'

// Formatear teléfono
formatearTelefono('56912345678') // '+56 9 1234 5678'
```

#### workOrderSchema.ts
Schema completo para Work Orders (OTs):

- **11 secciones:** datosComercial, antecedentesDesarrollo, solicita, referencia, caracteristicas, dimensiones, pallet, especificacionesTecnicas, disenoAcabados, medidas, terminaciones
- **Transform decimal:** Convierte coma a punto automáticamente (Issues 37-38)
- **file_oc condicional:** Requerido cuando oc=1 (Issue 8)
- **Validaciones chilenas:** Email y teléfono usan validadores locales

#### clientSchema.ts
Schema para Clientes:
- Validación RUT chileno
- Campos de contacto
- Instalaciones

#### cotizacionSchema.ts
Schema para Cotizaciones:
- **margen.min(0):** No permite valores negativos
- Validación de detalles
- Acciones de aprobación (aprobar, rechazar, solicitar_cambios)

#### userSchema.ts
Schema para Usuarios:
- Validación de credenciales
- Roles y permisos

### K.3 - Hooks de Formularios

**Ubicación:** `src/hooks/useFormValidation.ts`

```typescript
// Hook para Work Orders
const { form, onSubmit, errors, isValid } = useWorkOrderForm({
  onSuccess: (data) => console.log(data),
});

// Hook para Clientes
const { form, onSubmit } = useClientForm({ ... });

// Hook para Cotizaciones
const { form, onSubmit } = useCotizacionForm({ ... });

// Hook para Usuarios
const { form, onSubmit } = useUserForm({ ... });
```

### K.4 - Componentes de Formulario

**Ubicación:** `src/components/common/FormInput.tsx`

```tsx
// Input con validación
<FormInput
  name="descripcion"
  label="Descripción"
  register={register}
  error={errors.descripcion}
  required
/>

// TextArea
<FormTextArea name="observaciones" label="Observaciones" rows={4} />

// Select
<FormSelect name="tipo" label="Tipo" options={opciones} />

// Checkbox
<FormCheckbox name="activo" label="Activo" />
```

### K.5 - Contexto de Usuario

**Ubicación:** `src/contexts/UserContext.tsx`

```tsx
// En App.tsx
<UserProvider>
  <App />
</UserProvider>

// En componentes
const { user, hasRole, hasPermission, isInArea } = useUser();

// Verificar rol
if (hasRole(ROLES.GERENTE_COMERCIAL)) { ... }

// Verificar permiso
if (hasPermission('aprobar_ot')) { ... }

// Verificar área
if (isInArea('comercial')) { ... }
```

#### Roles Disponibles (19)
```typescript
ROLES = {
  ADMIN: 1,
  JEFE_VENTAS: 2,
  VENDEDOR: 3,
  VENDEDOR_EXTERNO: 4,
  GERENTE_COMERCIAL: 5,
  GERENTE_GENERAL: 6,
  JEFE_PRODUCCION: 7,
  PRODUCCION: 8,
  JEFE_DISENO: 9,
  DISENADOR: 10,
  JEFE_CALIDAD: 11,
  CALIDAD: 12,
  JEFE_DESPACHO: 13,
  DESPACHO: 14,
  JEFE_BODEGA: 15,
  BODEGA: 16,
  JEFE_DESARROLLO: 17,
  DESARROLLO: 18,
  CLIENTE: 19,
}
```

#### Areas Disponibles (6)
- comercial
- produccion
- diseno
- calidad
- despacho
- desarrollo

### K.6 - Protección de Rutas

**Ubicación:** `src/components/common/ProtectedRoute.tsx`

```tsx
// Requerir permiso específico
<RequirePermission permiso="crear_ot">
  <CreateWorkOrder />
</RequirePermission>

// Requerir rol específico
<RequireRole roles={[ROLES.ADMIN, ROLES.JEFE_VENTAS]}>
  <AdminPanel />
</RequireRole>

// Requerir área
<RequireArea areas={['comercial', 'produccion']}>
  <AreaContent />
</RequireArea>

// Proteger ruta completa
<ProtectedRoute
  requiredPermission="ver_reportes"
  fallback={<AccessDenied />}
>
  <ReportesPage />
</ProtectedRoute>
```

### K.7 - Navegación con Permisos

**Ubicación:** `src/config/navigation.ts`

```typescript
// Filtrar navegación según permisos del usuario
const menuItems = filterNavigationByPermissions(
  navigationConfig,
  user,
  hasPermission
);

// Configuración de navegación
const navigationConfig: NavSection[] = [
  {
    title: 'OTs',
    items: [
      {
        label: 'Crear OT',
        path: '/ots/create',
        permiso: 'crear_ot', // Solo visible si tiene permiso
      },
    ],
  },
];
```

## Tests

**Ubicación:** `src/schemas/__tests__/`

| Archivo | Tests | Descripción |
|---------|-------|-------------|
| validators.test.ts | 33 | RUT, teléfono, email, formateos |
| workOrderSchema.test.ts | 30 | Validaciones OT, file_oc, decimales |
| cotizacionSchema.test.ts | 36 | Validaciones cotización, margen |

**Total:** 99 tests de schemas + 51 tests existentes = **150 tests pasando**

## Uso Recomendado

### Crear un formulario con validación

```tsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { workOrderSchema, WorkOrderFormData, workOrderDefaultValues } from '@/schemas/workOrderSchema';
import { FormInput, FormSelect } from '@/components/common';

function CreateWorkOrder() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<WorkOrderFormData>({
    resolver: yupResolver(workOrderSchema),
    defaultValues: workOrderDefaultValues,
    mode: 'onChange',
  });

  const onSubmit = (data: WorkOrderFormData) => {
    // Enviar a API
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        name="descripcion"
        label="Descripción"
        register={register}
        error={errors.descripcion}
        required
      />
      {/* ... más campos */}
      <button type="submit" disabled={!isValid}>
        Crear OT
      </button>
    </form>
  );
}
```

### Proteger contenido por permisos

```tsx
import { useUser, RequirePermission } from '@/contexts';

function Dashboard() {
  const { user, hasPermission } = useUser();

  return (
    <div>
      <h1>Bienvenido, {user?.nombre}</h1>

      <RequirePermission permiso="ver_reportes">
        <ReportesWidget />
      </RequirePermission>

      {hasPermission('aprobar_ot') && (
        <PendingApprovals />
      )}
    </div>
  );
}
```

## Archivos del Sprint

```
frontend/src/
├── schemas/
│   ├── validators.ts           # Validadores chilenos
│   ├── workOrderSchema.ts      # Schema OT
│   ├── clientSchema.ts         # Schema Cliente
│   ├── cotizacionSchema.ts     # Schema Cotización
│   ├── userSchema.ts           # Schema Usuario
│   ├── index.ts                # Exports centralizados
│   └── __tests__/
│       ├── validators.test.ts
│       ├── workOrderSchema.test.ts
│       └── cotizacionSchema.test.ts
├── hooks/
│   ├── useFormValidation.ts    # Hooks de formularios
│   └── index.ts                # Exports centralizados
├── contexts/
│   ├── UserContext.tsx         # Contexto de usuario
│   └── index.ts                # Exports centralizados
├── components/common/
│   ├── FormInput.tsx           # Componentes de formulario
│   ├── ProtectedRoute.tsx      # Protección de rutas
│   └── index.ts                # Exports centralizados
└── config/
    ├── navigation.ts           # Configuración de navegación
    └── index.ts                # Exports centralizados
```
