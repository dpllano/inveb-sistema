/**
 * INVEB Sistema de Ordenes de Trabajo
 * Main App component con autenticacion real contra Laravel MySQL
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import styled from 'styled-components';
import { GlobalStyles } from './theme/GlobalStyles';
import { theme } from './theme';
import { CascadeForm } from './components/CascadeForm';
import { Login } from './pages';
import WorkOrdersDashboard from './pages/WorkOrders/WorkOrdersDashboard';
import CreateWorkOrder from './pages/WorkOrders/CreateWorkOrder';
import EditWorkOrder from './pages/WorkOrders/EditWorkOrder';
import ManageWorkOrder from './pages/WorkOrders/ManageWorkOrder';
import Notifications from './pages/WorkOrders/Notifications';
import AprobacionOTsList from './pages/WorkOrders/AprobacionOTsList';
import AsignacionesList from './pages/WorkOrders/AsignacionesList';
import CotizarMultiplesOT from './pages/WorkOrders/CotizarMultiplesOT';
import CreateSpecialOT from './pages/WorkOrders/CreateSpecialOT';
import EditSpecialOT from './pages/WorkOrders/EditSpecialOT';
import DetalleLogOT from './pages/WorkOrders/DetalleLogOT';
import { ClientsList, UsersList, MantenedorGenerico, JerarquiasList, BulkUpload } from './pages/Mantenedores';
import { ChangePassword } from './pages/Settings';
import { ForgotPassword, ResetPassword } from './pages/Auth';
import { CotizacionesList, CotizacionForm, AprobacionesList, AprobacionExternaCotizaciones, CrearOTDesdeCotizacion } from './pages/Cotizaciones';
import CotizadorExternoList from './pages/Cotizaciones/CotizadorExternoList';
import { AyudaCotizador } from './pages/Cotizador';
import { MuestrasList, MuestraForm } from './pages/Muestras';
import {
  ReportsDashboard,
  ReportOTsActivasPorUsuario,
  ReportOTsCompletadas,
  ReportTiempoPorArea,
  ReportRechazosPorMes,
  ReportCargaMensual,
  ReportAnulaciones,
  ReportOTsCompletadasFechas,
  ReportGestionOTsActivas,
  ReportTiempoPrimeraMuestra,
  ReportMotivosRechazo,
  ReportTiempoDisenadorExterno,
  ReportSalaMuestra,
  ReportIndicadorSalaMuestra,
  ReportDisenoEstructuralSala,
  ReportMuestras
} from './pages/Reports';
import { authApi, type UserInfo, type DatosOTFromCotizacion } from './services/api';
import type { CascadeFormData } from './types/cascade';
import { UserProvider } from './contexts';

// Constantes de roles (equivalentes a Laravel Constants.php)
const ROLES = {
  Admin: 1,
  Gerente: 2,
  JefeVenta: 3,
  Vendedor: 4,
  JefeDesarrollo: 5,
  Ingeniero: 6,
  JefeDiseño: 7,
  Diseñador: 8,
  JefeCatalogador: 9,
  Catalogador: 10,
  JefePrecatalogador: 11,
  Precatalogador: 12,
  JefeMuestras: 13,
  TecnicoMuestras: 14,
  GerenteComercial: 15,
  API: 17,
  SuperAdministrador: 18,
  VendedorExterno: 19,
} as const;

// Helpers para verificar roles del usuario
const roleHelpers = {
  isAdmin: (roleId: number) => roleId === ROLES.Admin,
  isSuperAdministrador: (roleId: number) => roleId === ROLES.SuperAdministrador,
  isVendedor: (roleId: number) => roleId === ROLES.Vendedor,
  isVendedorExterno: (roleId: number) => roleId === ROLES.VendedorExterno,
  isJefeVenta: (roleId: number) => roleId === ROLES.JefeVenta,
  isJefeDesarrollo: (roleId: number) => roleId === ROLES.JefeDesarrollo,
  isGerenteGeneral: (roleId: number) => roleId === ROLES.Gerente,
  isGerenteComercial: (roleId: number) => roleId === ROLES.GerenteComercial,
  isJefeCatalogador: (roleId: number) => roleId === ROLES.JefeCatalogador,
  isCatalogador: (roleId: number) => roleId === ROLES.Catalogador,
  isIngeniero: (roleId: number) => roleId === ROLES.Ingeniero,
  isJefeDiseño: (roleId: number) => roleId === ROLES.JefeDiseño,
  isDiseñador: (roleId: number) => roleId === ROLES.Diseñador,
  isJefePrecatalogador: (roleId: number) => roleId === ROLES.JefePrecatalogador,
  isPrecatalogador: (roleId: number) => roleId === ROLES.Precatalogador,
  isJefeMuestras: (roleId: number) => roleId === ROLES.JefeMuestras,
  isTecnicoMuestras: (roleId: number) => roleId === ROLES.TecnicoMuestras,
  // Roles con area (work_space_id) segun Laravel RolesTableSeeder
  // Roles SIN area: Admin(1), Gerente(2), GerenteComercial(15), VendedorExterno(19)
  hasArea: (roleId: number) => ([
    ROLES.JefeVenta, ROLES.Vendedor, ROLES.JefeDesarrollo, ROLES.Ingeniero,
    ROLES.JefeDiseño, ROLES.Diseñador, ROLES.JefeCatalogador, ROLES.Catalogador,
    ROLES.JefePrecatalogador, ROLES.Precatalogador, ROLES.JefeMuestras, ROLES.TecnicoMuestras,
    ROLES.SuperAdministrador
  ] as number[]).includes(roleId),
  // Roles con permisos de aprobacion
  canApprove: (roleId: number) => ([ROLES.Admin, ROLES.SuperAdministrador, ROLES.JefeVenta, ROLES.JefeDesarrollo] as number[]).includes(roleId),
  // Roles con acceso a reporteria (Laravel line 32-58: excludes JefeVenta)
  canViewReports: (roleId: number) => ([
    ROLES.Admin, ROLES.SuperAdministrador, ROLES.JefeCatalogador,
    ROLES.Gerente, ROLES.GerenteComercial, ROLES.JefeDesarrollo, ROLES.JefeDiseño
  ] as number[]).includes(roleId),
  // JefeVenta solo ve algunos items de reporteria, no el dropdown completo
  // Roles con acceso completo a mantenedores
  hasFullMantenedores: (roleId: number) => ([ROLES.Admin, ROLES.SuperAdministrador] as number[]).includes(roleId),
  // Roles con acceso al cotizador
  canUseCotizador: (roleId: number) => ([
    ROLES.Admin, ROLES.SuperAdministrador, ROLES.Vendedor,
    ROLES.Gerente, ROLES.GerenteComercial, ROLES.JefeVenta
  ] as number[]).includes(roleId),
  // Roles que pueden aprobar cotizaciones
  canApproveCotizaciones: (roleId: number) => ([ROLES.Gerente, ROLES.GerenteComercial, ROLES.JefeVenta] as number[]).includes(roleId),
  // Roles con acceso a mantenedores (cualquier nivel)
  canAccessMantenedores: (roleId: number) => ([
    ROLES.Admin, ROLES.SuperAdministrador, ROLES.Vendedor, ROLES.JefeVenta,
    ROLES.JefeCatalogador, ROLES.Catalogador, ROLES.Ingeniero,
    ROLES.JefeDesarrollo, ROLES.JefeDiseño, ROLES.Diseñador,
    ROLES.JefePrecatalogador, ROLES.Precatalogador
  ] as number[]).includes(roleId),
  // Roles con acceso a ver sección de muestras (segun Laravel gestionar-ot.blade.php linea 62)
  canViewMuestras: (roleId: number) => ([
    ROLES.Ingeniero, ROLES.JefeVenta, ROLES.Vendedor,
    ROLES.TecnicoMuestras, ROLES.JefeMuestras, ROLES.JefeDesarrollo,
    ROLES.SuperAdministrador, ROLES.Admin
  ] as number[]).includes(roleId),
  // Roles que pueden crear muestras (segun Laravel muestras-ot.blade.php linea 12)
  // Ingeniero puede crear siempre, Vendedor/JefeVenta solo si OT esta en area 1 (Ventas)
  canCreateMuestra: (roleId: number, currentAreaId?: number) => {
    if (roleId === ROLES.Ingeniero || roleId === ROLES.JefeDesarrollo) return true;
    if ((roleId === ROLES.Vendedor || roleId === ROLES.JefeVenta) && currentAreaId === 1) return true;
    return false;
  },
};

// Page types - incluye todos los mantenedores y cotizaciones
type PageType =
  | 'dashboard' | 'crear-ot' | 'crear-ot-especial' | 'editar-ot-especial' | 'cascade-form' | 'gestionar-ot' | 'notificaciones' | 'editar-ot' | 'aprobacion-ots' | 'asignaciones' | 'cotizar-multiples-ot' | 'reportes' | 'detalle-log-ot'
  // Reportes individuales
  | 'reporte-ots-activas' | 'reporte-ots-completadas' | 'reporte-tiempo-area' | 'reporte-rechazos'
  | 'reporte-carga-mensual' | 'reporte-anulaciones'
  | 'reporte-ots-completadas-fechas' | 'reporte-gestion-ots-activas' | 'reporte-tiempo-primera-muestra' | 'reporte-motivos-rechazo'
  | 'reporte-tiempo-disenador-externo' | 'reporte-sala-muestra' | 'reporte-indicador-sala-muestra' | 'reporte-diseno-estructural-sala' | 'reporte-muestras'
  | 'cotizaciones' | 'cotizacion-nueva' | 'cotizacion-editar' | 'aprobaciones' | 'ayuda-cotizador'
  | 'cotizador-externo' | 'cotizacion-externa-nueva' | 'cotizacion-externa-editar'
  | 'aprobacion-externa-cotizaciones'
  | 'detalle-a-ot'
  | 'crear-ot-desde-cotizacion'
  // Muestras
  | 'muestras-list' | 'muestra-nueva'
  | 'clientes' | 'usuarios'
  | 'jerarquias-1' | 'jerarquias-2' | 'jerarquias-3'
  | 'tipo-productos' | 'estilos' | 'colores' | 'canales'
  | 'tipos-cintas' | 'almacenes' | 'tipo-palet'
  | 'organizaciones-ventas' | 'grupo-imputacion-material' | 'matrices'
  // Mantenedores generales
  | 'sectores' | 'cartones' | 'secuencias-operacionales' | 'rechazo-conjunto'
  | 'tiempo-tratamiento' | 'grupo-materiales-1' | 'grupo-materiales-2'
  | 'materiales' | 'grupo-plantas' | 'adhesivos' | 'cebes' | 'clasificaciones-clientes'
  // Mantenedores del cotizador
  | 'armados' | 'procesos' | 'pegados' | 'envases' | 'rayados'
  | 'papeles' | 'cardboards' | 'carton-esquineros'
  | 'plantas' | 'tipo-ondas'
  | 'factores-ondas' | 'factores-desarrollos' | 'factores-seguridads' | 'areahcs'
  | 'consumo-adhesivos' | 'consumo-energias' | 'consumo-adhesivo-pegados'
  | 'merma-corrugadoras' | 'merma-convertidoras'
  | 'mercados' | 'rubros' | 'ciudades-fletes' | 'fletes' | 'maquila-servicios'
  | 'tarifario' | 'tarifario-margens' | 'variables-cotizador'
  | 'insumos-palletizados' | 'detalle-precio-palletizados'
  | 'paises' | 'fsc' | 'reference-types' | 'recubrimiento-types'
  | 'cantidad-base'
  | 'carga-masiva'
  // Configuracion
  | 'cambiar-contrasena';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: ${theme.colors.bgLight};
`;

// Barra superior unificada: Logo + Menu + Usuario en una sola linea
const HeaderBar = styled.header`
  background-color: white;
  border-bottom: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.sm} ${theme.spacing.xl};
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const Logo = styled.h1`
  color: ${theme.colors.primary};
  font-size: ${theme.typography.sizes.h2};
  font-weight: ${theme.typography.weights.bold};
  margin: 0;
`;

const NavTabs = styled.nav`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  flex-wrap: wrap;
  justify-content: center;
  flex: 1;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-shrink: 0;
`;

const UserInfoText = styled.span`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.small};
  white-space: nowrap;
`;

const SettingsButton = styled.button`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background-color: transparent;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.small};
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background-color: ${theme.colors.primary}15;
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }
`;

const LogoutButton = styled.button`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background-color: transparent;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.small};
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background-color: ${theme.colors.danger}15;
    border-color: ${theme.colors.danger};
    color: ${theme.colors.danger};
  }
`;

const Main = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
`;

const NavTab = styled.button<{ $active?: boolean }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: ${({ $active }) => $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active }) => $active ? 'white' : theme.colors.textSecondary};
  border: none;
  border-radius: ${theme.radius.md};
  cursor: pointer;
  font-size: ${theme.typography.sizes.small};
  font-weight: ${theme.typography.weights.medium};
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: ${({ $active }) => $active ? theme.colors.primary : theme.colors.bgLight};
    color: ${({ $active }) => $active ? 'white' : theme.colors.textPrimary};
  }
`;

// Dropdown Menu para Mantenedores
const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button<{ $active?: boolean }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: ${({ $active }) => $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active }) => $active ? 'white' : theme.colors.textSecondary};
  border: none;
  border-radius: ${theme.radius.md};
  cursor: pointer;
  font-size: ${theme.typography.sizes.small};
  font-weight: ${theme.typography.weights.medium};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  white-space: nowrap;

  &:hover {
    background: ${({ $active }) => $active ? theme.colors.primary : theme.colors.bgLight};
    color: ${({ $active }) => $active ? 'white' : theme.colors.textPrimary};
  }
`;

const DropdownArrow = styled.span<{ $open?: boolean }>`
  display: inline-block;
  transition: transform 0.2s;
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const DropdownMenu = styled.div<{ $open?: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 220px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: ${({ $open }) => $open ? 'block' : 'none'};
  max-height: 400px;
  overflow-y: auto;
`;

const DropdownSection = styled.div`
  padding: ${theme.spacing.xs} 0;
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const DropdownSectionTitle = styled.div`
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  font-size: ${theme.typography.sizes.small};
  font-weight: ${theme.typography.weights.semibold};
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DropdownItem = styled.button<{ $active?: boolean }>`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${({ $active }) => $active ? `${theme.colors.primary}15` : 'transparent'};
  color: ${({ $active }) => $active ? theme.colors.primary : theme.colors.textPrimary};
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: ${theme.typography.sizes.small};
  transition: all 0.15s;

  &:hover {
    background: ${theme.colors.bgLight};
    color: ${theme.colors.primary};
  }
`;

// User type ahora viene de authApi (UserInfo)

interface MainContentProps {
  user: UserInfo;
  onLogout: () => void;
}

function MainContent({ user, onLogout }: MainContentProps) {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [editingOtId, setEditingOtId] = useState<number | null>(null);
  const [managingOtId, setManagingOtId] = useState<number | null>(null);
  const [logOtId, setLogOtId] = useState<number | null>(null);
  const [editingCotizacionId, setEditingCotizacionId] = useState<number | null>(null);
  const [datosOTFromCotizacion, setDatosOTFromCotizacion] = useState<DatosOTFromCotizacion | null>(null);
  const [muestrasOtId, setMuestrasOtId] = useState<number | null>(null);
  const [mantenedoresOpen, setMantenedoresOpen] = useState(false);
  const [cotizadorOpen, setCotizadorOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cotizadorRef = useRef<HTMLDivElement>(null);

  // Lista de pages que son mantenedores
  const mantenedorPages: PageType[] = [
    'clientes', 'usuarios',
    'jerarquias-1', 'jerarquias-2', 'jerarquias-3',
    'tipo-productos', 'estilos', 'colores', 'canales',
    'tipos-cintas', 'almacenes', 'tipo-palet',
    'organizaciones-ventas', 'grupo-imputacion-material', 'matrices',
    // Mantenedores generales
    'sectores', 'cartones', 'secuencias-operacionales', 'rechazo-conjunto',
    'tiempo-tratamiento', 'grupo-materiales-1', 'grupo-materiales-2',
    'materiales', 'grupo-plantas', 'adhesivos', 'cebes', 'clasificaciones-clientes',
    // Mantenedores del cotizador
    'armados', 'procesos', 'pegados', 'envases', 'rayados',
    'papeles', 'cardboards', 'carton-esquineros',
    'plantas', 'tipo-ondas',
    'factores-ondas', 'factores-desarrollos', 'factores-seguridads', 'areahcs',
    'consumo-adhesivos', 'consumo-energias', 'consumo-adhesivo-pegados',
    'merma-corrugadoras', 'merma-convertidoras',
    'mercados', 'rubros', 'ciudades-fletes', 'fletes', 'maquila-servicios',
    'tarifario', 'tarifario-margens', 'variables-cotizador',
    'insumos-palletizados', 'detalle-precio-palletizados',
    'paises', 'fsc', 'reference-types', 'recubrimiento-types',
    'cantidad-base'
  ];

  const isMantenedorPage = mantenedorPages.includes(currentPage);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMantenedoresOpen(false);
      }
      if (cotizadorRef.current && !cotizadorRef.current.contains(event.target as Node)) {
        setCotizadorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Estado para CascadeForm standalone (página de prueba)
  const [cascadeFormData, setCascadeFormData] = useState<CascadeFormData>({
    productTypeId: null,
    impresion: null,
    fsc: null,
    cinta: null,
    coverageInternalId: null,
    coverageExternalId: null,
    plantaId: null,
    cartonColor: null,
    cartonId: null,
  });

  const handleCascadeFormChange = (data: CascadeFormData) => {
    setCascadeFormData(data);
    console.log('Form data changed:', data);
  };

  const handleNavigate = useCallback((page: string, id?: number, data?: DatosOTFromCotizacion) => {
    setCurrentPage(page as PageType);
    setMantenedoresOpen(false); // Cerrar dropdown al navegar
    setCotizadorOpen(false); // Cerrar cotizador dropdown al navegar
    if (page === 'editar-ot' && id) {
      setEditingOtId(id);
      setManagingOtId(null);
      setLogOtId(null);
      setEditingCotizacionId(null);
      setDatosOTFromCotizacion(null);
    } else if (page === 'gestionar-ot' && id) {
      setManagingOtId(id);
      setEditingOtId(null);
      setLogOtId(null);
      setEditingCotizacionId(null);
      setDatosOTFromCotizacion(null);
    } else if (page === 'editar-ot-especial' && id) {
      setEditingOtId(id);
      setManagingOtId(null);
      setLogOtId(null);
      setEditingCotizacionId(null);
      setDatosOTFromCotizacion(null);
    } else if (page === 'detalle-log-ot' && id) {
      setLogOtId(id);
      setEditingOtId(null);
      setManagingOtId(null);
      setEditingCotizacionId(null);
      setDatosOTFromCotizacion(null);
    } else if ((page === 'cotizacion-editar' || page === 'cotizacion-externa-editar') && id) {
      setEditingCotizacionId(id);
      setEditingOtId(null);
      setManagingOtId(null);
      setLogOtId(null);
      setDatosOTFromCotizacion(null);
    } else if (page === 'crear-ot-desde-cotizacion' && data) {
      setDatosOTFromCotizacion(data);
      setEditingOtId(null);
      setManagingOtId(null);
      setLogOtId(null);
      setEditingCotizacionId(null);
      setMuestrasOtId(null);
    } else if ((page === 'muestras-list' || page === 'muestra-nueva') && id) {
      setMuestrasOtId(id);
      setEditingOtId(null);
      setManagingOtId(null);
      setLogOtId(null);
      setEditingCotizacionId(null);
      setDatosOTFromCotizacion(null);
    } else {
      setEditingOtId(null);
      setManagingOtId(null);
      setLogOtId(null);
      setEditingCotizacionId(null);
      setDatosOTFromCotizacion(null);
      setMuestrasOtId(null);
    }
  }, []);

  const displayName = `${user.nombre} ${user.apellido}`;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <WorkOrdersDashboard onNavigate={handleNavigate} />;
      case 'crear-ot':
        return <CreateWorkOrder onNavigate={handleNavigate} />;
      case 'crear-ot-especial':
        return <CreateSpecialOT onNavigate={handleNavigate} />;
      case 'editar-ot-especial':
        return editingOtId ? <EditSpecialOT otId={editingOtId} onNavigate={handleNavigate} /> : null;
      case 'editar-ot':
        return editingOtId ? <EditWorkOrder otId={editingOtId} onNavigate={handleNavigate} /> : null;
      case 'cascade-form':
        return <CascadeForm values={cascadeFormData} onChange={handleCascadeFormChange} />;
      case 'gestionar-ot':
        return managingOtId ? <ManageWorkOrder otId={managingOtId} onNavigate={handleNavigate} /> : null;
      case 'notificaciones':
        return <Notifications onNavigate={handleNavigate} />;
      case 'aprobacion-ots':
        return <AprobacionOTsList onNavigate={handleNavigate} />;
      case 'asignaciones':
        return <AsignacionesList onNavigate={handleNavigate} />;
      case 'cotizar-multiples-ot':
        // Solo roles con acceso a cotizador pueden acceder
        if (!roleHelpers.canUseCotizador(user.role_id)) {
          return <WorkOrdersDashboard onNavigate={handleNavigate} />;
        }
        return <CotizarMultiplesOT onNavigate={handleNavigate} />;
      case 'reportes':
        return <ReportsDashboard onNavigate={handleNavigate} />;
      case 'detalle-log-ot':
        return logOtId ? <DetalleLogOT otId={logOtId} onNavigate={handleNavigate} /> : null;
      // Reportes individuales
      case 'reporte-ots-activas':
        return <ReportOTsActivasPorUsuario onNavigate={handleNavigate} />;
      case 'reporte-ots-completadas':
        return <ReportOTsCompletadas onNavigate={handleNavigate} />;
      case 'reporte-tiempo-area':
        return <ReportTiempoPorArea onNavigate={handleNavigate} />;
      case 'reporte-rechazos':
        return <ReportRechazosPorMes onNavigate={handleNavigate} />;
      case 'reporte-carga-mensual':
        return <ReportCargaMensual onNavigate={handleNavigate} />;
      case 'reporte-anulaciones':
        return <ReportAnulaciones onNavigate={handleNavigate} />;
      case 'reporte-ots-completadas-fechas':
        return <ReportOTsCompletadasFechas onNavigate={handleNavigate} />;
      case 'reporte-gestion-ots-activas':
        return <ReportGestionOTsActivas onNavigate={handleNavigate} />;
      case 'reporte-tiempo-primera-muestra':
        return <ReportTiempoPrimeraMuestra onNavigate={handleNavigate} />;
      case 'reporte-motivos-rechazo':
        return <ReportMotivosRechazo onNavigate={handleNavigate} />;
      case 'reporte-tiempo-disenador-externo':
        return <ReportTiempoDisenadorExterno onNavigate={handleNavigate} />;
      case 'reporte-sala-muestra':
        return <ReportSalaMuestra onNavigate={handleNavigate} />;
      case 'reporte-indicador-sala-muestra':
        return <ReportIndicadorSalaMuestra onNavigate={handleNavigate} />;
      case 'reporte-diseno-estructural-sala':
        return <ReportDisenoEstructuralSala onNavigate={handleNavigate} />;
      case 'reporte-muestras':
        return <ReportMuestras onNavigate={handleNavigate} />;
      // Cotizaciones - Solo roles con acceso a cotizador
      case 'cotizaciones':
        if (!roleHelpers.canUseCotizador(user.role_id)) {
          return <WorkOrdersDashboard onNavigate={handleNavigate} />;
        }
        return <CotizacionesList onNavigate={handleNavigate} />;
      case 'cotizacion-nueva':
        if (!roleHelpers.canUseCotizador(user.role_id)) {
          return <WorkOrdersDashboard onNavigate={handleNavigate} />;
        }
        return <CotizacionForm onNavigate={handleNavigate} />;
      case 'cotizacion-editar':
        if (!roleHelpers.canUseCotizador(user.role_id)) {
          return <WorkOrdersDashboard onNavigate={handleNavigate} />;
        }
        return editingCotizacionId ? <CotizacionForm cotizacionId={editingCotizacionId} onNavigate={handleNavigate} /> : null;
      case 'aprobaciones':
        if (!roleHelpers.canUseCotizador(user.role_id)) {
          return <WorkOrdersDashboard onNavigate={handleNavigate} />;
        }
        return <AprobacionesList onNavigate={handleNavigate} />;
      case 'ayuda-cotizador':
        if (!roleHelpers.canUseCotizador(user.role_id)) {
          return <WorkOrdersDashboard onNavigate={handleNavigate} />;
        }
        return <AyudaCotizador onNavigate={handleNavigate} />;
      // Cotizador Externo - Solo roles con acceso a cotizador
      case 'cotizador-externo':
        if (!roleHelpers.canUseCotizador(user.role_id)) {
          return <WorkOrdersDashboard onNavigate={handleNavigate} />;
        }
        return <CotizadorExternoList onNavigate={handleNavigate} />;
      case 'cotizacion-externa-nueva':
        if (!roleHelpers.canUseCotizador(user.role_id)) {
          return <WorkOrdersDashboard onNavigate={handleNavigate} />;
        }
        return <CotizacionForm onNavigate={handleNavigate} isExterno={true} />;
      case 'cotizacion-externa-editar':
        if (!roleHelpers.canUseCotizador(user.role_id)) {
          return <WorkOrdersDashboard onNavigate={handleNavigate} />;
        }
        return editingCotizacionId ? <CotizacionForm cotizacionId={editingCotizacionId} onNavigate={handleNavigate} isExterno={true} /> : null;
      case 'aprobacion-externa-cotizaciones':
        if (!roleHelpers.canUseCotizador(user.role_id)) {
          return <WorkOrdersDashboard onNavigate={handleNavigate} />;
        }
        return <AprobacionExternaCotizaciones onNavigate={handleNavigate} />;
      case 'detalle-a-ot':
        if (!roleHelpers.canUseCotizador(user.role_id)) {
          return <WorkOrdersDashboard onNavigate={handleNavigate} />;
        }
        return <CrearOTDesdeCotizacion onNavigate={handleNavigate} />;
      case 'crear-ot-desde-cotizacion':
        if (!roleHelpers.canUseCotizador(user.role_id)) {
          return <WorkOrdersDashboard onNavigate={handleNavigate} />;
        }
        return datosOTFromCotizacion ? <CreateWorkOrder onNavigate={handleNavigate} initialData={datosOTFromCotizacion} /> : null;
      // Muestras
      case 'muestras-list':
        return muestrasOtId ? (
          <MuestrasList
            otId={muestrasOtId}
            onNavigate={handleNavigate}
            onCreateMuestra={() => handleNavigate('muestra-nueva', muestrasOtId)}
          />
        ) : null;
      case 'muestra-nueva':
        return muestrasOtId ? (
          <MuestraForm
            otId={muestrasOtId}
            onNavigate={handleNavigate}
            onSuccess={() => handleNavigate('muestras-list', muestrasOtId)}
          />
        ) : null;
      // Mantenedores principales
      case 'clientes':
        return <ClientsList onNavigate={handleNavigate} />;
      case 'usuarios':
        return <UsersList onNavigate={handleNavigate} />;
      // Jerarquias - componente especializado
      case 'jerarquias-1':
        return <JerarquiasList nivel={1} onNavigate={handleNavigate} />;
      case 'jerarquias-2':
        return <JerarquiasList nivel={2} onNavigate={handleNavigate} />;
      case 'jerarquias-3':
        return <JerarquiasList nivel={3} onNavigate={handleNavigate} />;
      // Mantenedores genericos - Productos y Caracteristicas
      case 'tipo-productos':
        return <MantenedorGenerico tablaKey="tipo_productos" onNavigate={handleNavigate} />;
      case 'estilos':
        return <MantenedorGenerico tablaKey="estilos" onNavigate={handleNavigate} />;
      case 'colores':
        return <MantenedorGenerico tablaKey="colores" onNavigate={handleNavigate} />;
      case 'canales':
        return <MantenedorGenerico tablaKey="canales" onNavigate={handleNavigate} />;
      // Mantenedores genericos - Logistica
      case 'tipos-cintas':
        return <MantenedorGenerico tablaKey="tipos_cintas" onNavigate={handleNavigate} />;
      case 'almacenes':
        return <MantenedorGenerico tablaKey="almacenes" onNavigate={handleNavigate} />;
      case 'tipo-palet':
        return <MantenedorGenerico tablaKey="tipo_palet" onNavigate={handleNavigate} />;
      // Mantenedores genericos - Comercial
      case 'organizaciones-ventas':
        return <MantenedorGenerico tablaKey="organizaciones_ventas" onNavigate={handleNavigate} />;
      case 'grupo-imputacion-material':
        return <MantenedorGenerico tablaKey="grupo_imputacion_material" onNavigate={handleNavigate} />;
      case 'matrices':
        return <MantenedorGenerico tablaKey="matrices" onNavigate={handleNavigate} />;
      // Nuevos mantenedores - Produccion
      case 'sectores':
        return <MantenedorGenerico tablaKey="sectores" onNavigate={handleNavigate} />;
      case 'cartones':
        return <MantenedorGenerico tablaKey="cartones" onNavigate={handleNavigate} />;
      case 'secuencias-operacionales':
        return <MantenedorGenerico tablaKey="secuencias_operacionales" onNavigate={handleNavigate} />;
      case 'rechazo-conjunto':
        return <MantenedorGenerico tablaKey="rechazo_conjunto" onNavigate={handleNavigate} />;
      case 'tiempo-tratamiento':
        return <MantenedorGenerico tablaKey="tiempo_tratamiento" onNavigate={handleNavigate} />;
      // Nuevos mantenedores - Materiales
      case 'grupo-materiales-1':
        return <MantenedorGenerico tablaKey="grupo_materiales_1" onNavigate={handleNavigate} />;
      case 'grupo-materiales-2':
        return <MantenedorGenerico tablaKey="grupo_materiales_2" onNavigate={handleNavigate} />;
      case 'materiales':
        return <MantenedorGenerico tablaKey="materiales" onNavigate={handleNavigate} />;
      // Nuevos mantenedores - Configuracion
      case 'grupo-plantas':
        return <MantenedorGenerico tablaKey="grupo_plantas" onNavigate={handleNavigate} />;
      case 'adhesivos':
        return <MantenedorGenerico tablaKey="adhesivos" onNavigate={handleNavigate} />;
      case 'cebes':
        return <MantenedorGenerico tablaKey="cebes" onNavigate={handleNavigate} />;
      case 'clasificaciones-clientes':
        return <MantenedorGenerico tablaKey="clasificaciones_clientes" onNavigate={handleNavigate} />;
      // === COTIZADOR ===
      // Produccion y Procesos
      case 'armados':
        return <MantenedorGenerico tablaKey="armados" onNavigate={handleNavigate} />;
      case 'procesos':
        return <MantenedorGenerico tablaKey="procesos" onNavigate={handleNavigate} />;
      case 'pegados':
        return <MantenedorGenerico tablaKey="pegados" onNavigate={handleNavigate} />;
      case 'envases':
        return <MantenedorGenerico tablaKey="envases" onNavigate={handleNavigate} />;
      case 'rayados':
        return <MantenedorGenerico tablaKey="rayados" onNavigate={handleNavigate} />;
      // Papeles y Cartones
      case 'papeles':
        return <MantenedorGenerico tablaKey="papeles" onNavigate={handleNavigate} />;
      case 'cardboards':
        return <MantenedorGenerico tablaKey="cardboards" onNavigate={handleNavigate} />;
      case 'carton-esquineros':
        return <MantenedorGenerico tablaKey="carton_esquineros" onNavigate={handleNavigate} />;
      // Plantas y Ondas
      case 'plantas':
        return <MantenedorGenerico tablaKey="plantas" onNavigate={handleNavigate} />;
      case 'tipo-ondas':
        return <MantenedorGenerico tablaKey="tipo_ondas" onNavigate={handleNavigate} />;
      // Factores y Calculos
      case 'factores-ondas':
        return <MantenedorGenerico tablaKey="factores_ondas" onNavigate={handleNavigate} />;
      case 'factores-desarrollos':
        return <MantenedorGenerico tablaKey="factores_desarrollos" onNavigate={handleNavigate} />;
      case 'factores-seguridads':
        return <MantenedorGenerico tablaKey="factores_seguridads" onNavigate={handleNavigate} />;
      case 'areahcs':
        return <MantenedorGenerico tablaKey="areahcs" onNavigate={handleNavigate} />;
      // Consumos
      case 'consumo-adhesivos':
        return <MantenedorGenerico tablaKey="consumo_adhesivos" onNavigate={handleNavigate} />;
      case 'consumo-energias':
        return <MantenedorGenerico tablaKey="consumo_energias" onNavigate={handleNavigate} />;
      case 'consumo-adhesivo-pegados':
        return <MantenedorGenerico tablaKey="consumo_adhesivo_pegados" onNavigate={handleNavigate} />;
      // Mermas
      case 'merma-corrugadoras':
        return <MantenedorGenerico tablaKey="merma_corrugadoras" onNavigate={handleNavigate} />;
      case 'merma-convertidoras':
        return <MantenedorGenerico tablaKey="merma_convertidoras" onNavigate={handleNavigate} />;
      // Comercial Cotizador
      case 'mercados':
        return <MantenedorGenerico tablaKey="mercados" onNavigate={handleNavigate} />;
      case 'rubros':
        return <MantenedorGenerico tablaKey="rubros" onNavigate={handleNavigate} />;
      case 'ciudades-fletes':
        return <MantenedorGenerico tablaKey="ciudades_fletes" onNavigate={handleNavigate} />;
      case 'fletes':
        return <MantenedorGenerico tablaKey="fletes" onNavigate={handleNavigate} />;
      case 'maquila-servicios':
        return <MantenedorGenerico tablaKey="maquila_servicios" onNavigate={handleNavigate} />;
      // Tarifas
      case 'tarifario':
        return <MantenedorGenerico tablaKey="tarifario" onNavigate={handleNavigate} />;
      case 'tarifario-margens':
        return <MantenedorGenerico tablaKey="tarifario_margens" onNavigate={handleNavigate} />;
      case 'variables-cotizador':
        return <MantenedorGenerico tablaKey="variables_cotizador" onNavigate={handleNavigate} />;
      // Palletizado
      case 'insumos-palletizados':
        return <MantenedorGenerico tablaKey="insumos_palletizados" onNavigate={handleNavigate} />;
      case 'detalle-precio-palletizados':
        return <MantenedorGenerico tablaKey="detalle_precio_palletizados" onNavigate={handleNavigate} />;
      // Catalogos
      case 'paises':
        return <MantenedorGenerico tablaKey="paises" onNavigate={handleNavigate} />;
      case 'fsc':
        return <MantenedorGenerico tablaKey="fsc" onNavigate={handleNavigate} />;
      case 'reference-types':
        return <MantenedorGenerico tablaKey="reference_types" onNavigate={handleNavigate} />;
      case 'recubrimiento-types':
        return <MantenedorGenerico tablaKey="recubrimiento_types" onNavigate={handleNavigate} />;
      case 'cantidad-base':
        return <MantenedorGenerico tablaKey="cantidad_base" onNavigate={handleNavigate} />;
      case 'carga-masiva':
        return <BulkUpload onNavigate={handleNavigate} />;
      // Configuracion
      case 'cambiar-contrasena':
        return <ChangePassword onNavigate={handleNavigate} />;
      default:
        return <WorkOrdersDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <AppContainer>
      <HeaderBar>
        <HeaderContent>
          <LogoSection>
            <Logo>INVEB</Logo>
          </LogoSection>

          <NavTabs>
          {/* Ordenes de Trabajo - visible para todos excepto VendedorExterno y Admin */}
          {!roleHelpers.isVendedorExterno(user.role_id) && !roleHelpers.isAdmin(user.role_id) && (
            <NavTab
              $active={currentPage === 'dashboard'}
              onClick={() => handleNavigate('dashboard')}
            >
              Ordenes de Trabajo
            </NavTab>
          )}

          {/* VendedorExterno solo ve menu simplificado */}
          {roleHelpers.isVendedorExterno(user.role_id) ? (
            <>
              <NavTab
                $active={currentPage === 'dashboard'}
                onClick={() => handleNavigate('dashboard')}
              >
                Ordenes de Trabajo
              </NavTab>
              {/* Cotizador dropdown para VendedorExterno */}
              <DropdownContainer ref={dropdownRef}>
                <DropdownButton
                  $active={currentPage === 'cotizador-externo'}
                  onClick={() => setMantenedoresOpen(!mantenedoresOpen)}
                >
                  Cotizador
                  <DropdownArrow $open={mantenedoresOpen}>▼</DropdownArrow>
                </DropdownButton>
                <DropdownMenu $open={mantenedoresOpen}>
                  <DropdownSection>
                    <DropdownItem
                      $active={currentPage === 'cotizador-externo'}
                      onClick={() => handleNavigate('cotizador-externo')}
                    >
                      Cotizaciones
                    </DropdownItem>
                  </DropdownSection>
                </DropdownMenu>
              </DropdownContainer>
            </>
          ) : (
            <>
              {/* Notificaciones - solo si el rol tiene area (work_space_id) asignada */}
              {/* Laravel: @if(isset(auth()->user()->role->area)) */}
              {roleHelpers.hasArea(user.role_id) && (
                <NavTab
                  $active={currentPage === 'notificaciones'}
                  onClick={() => handleNavigate('notificaciones')}
                >
                  Notificaciones
                </NavTab>
              )}

              {/* Asignaciones - solo roles con area Y que no sean Admin ni Vendedor */}
              {/* Laravel: @if(isset(auth()->user()->role->area) && !Auth()->user()->isAdmin() && !Auth()->user()->isVendedor()) */}
              {roleHelpers.hasArea(user.role_id) && !roleHelpers.isAdmin(user.role_id) && !roleHelpers.isVendedor(user.role_id) && (
                <NavTab
                  $active={currentPage === 'asignaciones'}
                  onClick={() => handleNavigate('asignaciones')}
                >
                  Asignaciones
                </NavTab>
              )}

              {/* Aprobaciones OTs - Admin, SuperAdmin, JefeVenta, JefeDesarrollo */}
              {roleHelpers.canApprove(user.role_id) && (
                <NavTab
                  $active={currentPage === 'aprobacion-ots'}
                  onClick={() => handleNavigate('aprobacion-ots')}
                >
                  Aprobaciones
                </NavTab>
              )}

              {/* Reporteria - solo roles especificos */}
              {roleHelpers.canViewReports(user.role_id) && (
                <NavTab
                  $active={currentPage === 'reportes'}
                  onClick={() => handleNavigate('reportes')}
                >
                  Reporteria
                </NavTab>
              )}

              {/* Mantenedores dropdown - con restricciones */}
              {roleHelpers.canAccessMantenedores(user.role_id) && (
                <DropdownContainer ref={dropdownRef}>
                  <DropdownButton
                    $active={isMantenedorPage}
                    onClick={() => setMantenedoresOpen(!mantenedoresOpen)}
                  >
                    Mantenedores
                    <DropdownArrow $open={mantenedoresOpen}>▼</DropdownArrow>
                  </DropdownButton>
                  <DropdownMenu $open={mantenedoresOpen}>
                    {/* Clientes - visible para todos con acceso a mantenedores */}
                    <DropdownSection>
                      <DropdownSectionTitle>Principales</DropdownSectionTitle>
                      <DropdownItem
                        $active={currentPage === 'clientes'}
                        onClick={() => handleNavigate('clientes')}
                      >
                        Clientes
                      </DropdownItem>
                      {/* Usuarios - solo Admin/SuperAdmin */}
                      {roleHelpers.hasFullMantenedores(user.role_id) && (
                        <DropdownItem
                          $active={currentPage === 'usuarios'}
                          onClick={() => handleNavigate('usuarios')}
                        >
                          Usuarios
                        </DropdownItem>
                      )}
                    </DropdownSection>

                    {/* Secciones adicionales - solo Admin/SuperAdmin */}
                    {roleHelpers.hasFullMantenedores(user.role_id) && (
                      <>
                        {/* Jerarquias */}
                        <DropdownSection>
                          <DropdownSectionTitle>Jerarquias</DropdownSectionTitle>
                          <DropdownItem $active={currentPage === 'jerarquias-1'} onClick={() => handleNavigate('jerarquias-1')}>Jerarquias Nivel 1</DropdownItem>
                          <DropdownItem $active={currentPage === 'jerarquias-2'} onClick={() => handleNavigate('jerarquias-2')}>Jerarquias Nivel 2</DropdownItem>
                          <DropdownItem $active={currentPage === 'jerarquias-3'} onClick={() => handleNavigate('jerarquias-3')}>Jerarquias Nivel 3</DropdownItem>
                        </DropdownSection>

                        {/* Productos */}
                        <DropdownSection>
                          <DropdownSectionTitle>Productos</DropdownSectionTitle>
                          <DropdownItem $active={currentPage === 'tipo-productos'} onClick={() => handleNavigate('tipo-productos')}>Tipo de Productos</DropdownItem>
                          <DropdownItem $active={currentPage === 'estilos'} onClick={() => handleNavigate('estilos')}>Estilos</DropdownItem>
                          <DropdownItem $active={currentPage === 'colores'} onClick={() => handleNavigate('colores')}>Colores</DropdownItem>
                          <DropdownItem $active={currentPage === 'canales'} onClick={() => handleNavigate('canales')}>Canales</DropdownItem>
                        </DropdownSection>

                        {/* Logistica */}
                        <DropdownSection>
                          <DropdownSectionTitle>Logistica</DropdownSectionTitle>
                          <DropdownItem $active={currentPage === 'tipos-cintas'} onClick={() => handleNavigate('tipos-cintas')}>Tipos de Cintas</DropdownItem>
                          <DropdownItem $active={currentPage === 'almacenes'} onClick={() => handleNavigate('almacenes')}>Almacenes</DropdownItem>
                          <DropdownItem $active={currentPage === 'tipo-palet'} onClick={() => handleNavigate('tipo-palet')}>Tipo de Palet</DropdownItem>
                        </DropdownSection>

                        {/* Comercial */}
                        <DropdownSection>
                          <DropdownSectionTitle>Comercial</DropdownSectionTitle>
                          <DropdownItem $active={currentPage === 'organizaciones-ventas'} onClick={() => handleNavigate('organizaciones-ventas')}>Organizaciones de Ventas</DropdownItem>
                          <DropdownItem $active={currentPage === 'grupo-imputacion-material'} onClick={() => handleNavigate('grupo-imputacion-material')}>Grupo Imputacion Material</DropdownItem>
                          <DropdownItem $active={currentPage === 'matrices'} onClick={() => handleNavigate('matrices')}>Matrices</DropdownItem>
                          <DropdownItem $active={currentPage === 'clasificaciones-clientes'} onClick={() => handleNavigate('clasificaciones-clientes')}>Clasificaciones Clientes</DropdownItem>
                        </DropdownSection>

                        {/* Produccion */}
                        <DropdownSection>
                          <DropdownSectionTitle>Produccion</DropdownSectionTitle>
                          <DropdownItem $active={currentPage === 'sectores'} onClick={() => handleNavigate('sectores')}>Sectores</DropdownItem>
                          <DropdownItem $active={currentPage === 'cartones'} onClick={() => handleNavigate('cartones')}>Cartones</DropdownItem>
                          <DropdownItem $active={currentPage === 'secuencias-operacionales'} onClick={() => handleNavigate('secuencias-operacionales')}>Secuencias Operacionales</DropdownItem>
                          <DropdownItem $active={currentPage === 'rechazo-conjunto'} onClick={() => handleNavigate('rechazo-conjunto')}>Rechazo Conjunto</DropdownItem>
                          <DropdownItem $active={currentPage === 'tiempo-tratamiento'} onClick={() => handleNavigate('tiempo-tratamiento')}>Tiempo de Tratamiento</DropdownItem>
                        </DropdownSection>

                        {/* Materiales */}
                        <DropdownSection>
                          <DropdownSectionTitle>Materiales</DropdownSectionTitle>
                          <DropdownItem $active={currentPage === 'materiales'} onClick={() => handleNavigate('materiales')}>Materiales</DropdownItem>
                          <DropdownItem $active={currentPage === 'grupo-materiales-1'} onClick={() => handleNavigate('grupo-materiales-1')}>Grupo Materiales 1</DropdownItem>
                          <DropdownItem $active={currentPage === 'grupo-materiales-2'} onClick={() => handleNavigate('grupo-materiales-2')}>Grupo Materiales 2</DropdownItem>
                        </DropdownSection>

                        {/* Configuracion */}
                        <DropdownSection>
                          <DropdownSectionTitle>Configuracion</DropdownSectionTitle>
                          <DropdownItem $active={currentPage === 'grupo-plantas'} onClick={() => handleNavigate('grupo-plantas')}>Grupo de Plantas</DropdownItem>
                          <DropdownItem $active={currentPage === 'adhesivos'} onClick={() => handleNavigate('adhesivos')}>Adhesivos</DropdownItem>
                          <DropdownItem $active={currentPage === 'cebes'} onClick={() => handleNavigate('cebes')}>CEBES</DropdownItem>
                        </DropdownSection>

                        {/* === COTIZADOR === */}
                        <DropdownSection>
                          <DropdownSectionTitle>Cotizador - Procesos</DropdownSectionTitle>
                          <DropdownItem $active={currentPage === 'armados'} onClick={() => handleNavigate('armados')}>Armados</DropdownItem>
                          <DropdownItem $active={currentPage === 'procesos'} onClick={() => handleNavigate('procesos')}>Procesos</DropdownItem>
                          <DropdownItem $active={currentPage === 'pegados'} onClick={() => handleNavigate('pegados')}>Pegados</DropdownItem>
                          <DropdownItem $active={currentPage === 'envases'} onClick={() => handleNavigate('envases')}>Envases</DropdownItem>
                          <DropdownItem $active={currentPage === 'rayados'} onClick={() => handleNavigate('rayados')}>Rayados</DropdownItem>
                        </DropdownSection>

                        <DropdownSection>
                          <DropdownSectionTitle>Cotizador - Papeles</DropdownSectionTitle>
                          <DropdownItem $active={currentPage === 'papeles'} onClick={() => handleNavigate('papeles')}>Papeles</DropdownItem>
                          <DropdownItem $active={currentPage === 'cardboards'} onClick={() => handleNavigate('cardboards')}>Cardboards</DropdownItem>
                          <DropdownItem $active={currentPage === 'carton-esquineros'} onClick={() => handleNavigate('carton-esquineros')}>Carton Esquineros</DropdownItem>
                          <DropdownItem $active={currentPage === 'tipo-ondas'} onClick={() => handleNavigate('tipo-ondas')}>Tipo Ondas</DropdownItem>
                        </DropdownSection>

                        <DropdownSection>
                          <DropdownSectionTitle>Cotizador - Plantas</DropdownSectionTitle>
                          <DropdownItem $active={currentPage === 'plantas'} onClick={() => handleNavigate('plantas')}>Plantas</DropdownItem>
                          <DropdownItem $active={currentPage === 'factores-ondas'} onClick={() => handleNavigate('factores-ondas')}>Factores Ondas</DropdownItem>
                          <DropdownItem $active={currentPage === 'factores-desarrollos'} onClick={() => handleNavigate('factores-desarrollos')}>Factores Desarrollos</DropdownItem>
                          <DropdownItem $active={currentPage === 'factores-seguridads'} onClick={() => handleNavigate('factores-seguridads')}>Factores Seguridad</DropdownItem>
                          <DropdownItem $active={currentPage === 'areahcs'} onClick={() => handleNavigate('areahcs')}>Area HCs</DropdownItem>
                        </DropdownSection>

                        <DropdownSection>
                          <DropdownSectionTitle>Cotizador - Consumos</DropdownSectionTitle>
                          <DropdownItem $active={currentPage === 'consumo-adhesivos'} onClick={() => handleNavigate('consumo-adhesivos')}>Consumo Adhesivos</DropdownItem>
                          <DropdownItem $active={currentPage === 'consumo-energias'} onClick={() => handleNavigate('consumo-energias')}>Consumo Energias</DropdownItem>
                          <DropdownItem $active={currentPage === 'consumo-adhesivo-pegados'} onClick={() => handleNavigate('consumo-adhesivo-pegados')}>Consumo Adhesivo Pegados</DropdownItem>
                          <DropdownItem $active={currentPage === 'merma-corrugadoras'} onClick={() => handleNavigate('merma-corrugadoras')}>Merma Corrugadoras</DropdownItem>
                          <DropdownItem $active={currentPage === 'merma-convertidoras'} onClick={() => handleNavigate('merma-convertidoras')}>Merma Convertidoras</DropdownItem>
                        </DropdownSection>

                        <DropdownSection>
                          <DropdownSectionTitle>Cotizador - Comercial</DropdownSectionTitle>
                          <DropdownItem $active={currentPage === 'mercados'} onClick={() => handleNavigate('mercados')}>Mercados</DropdownItem>
                          <DropdownItem $active={currentPage === 'rubros'} onClick={() => handleNavigate('rubros')}>Rubros</DropdownItem>
                          <DropdownItem $active={currentPage === 'ciudades-fletes'} onClick={() => handleNavigate('ciudades-fletes')}>Ciudades Fletes</DropdownItem>
                          <DropdownItem $active={currentPage === 'fletes'} onClick={() => handleNavigate('fletes')}>Fletes</DropdownItem>
                          <DropdownItem $active={currentPage === 'maquila-servicios'} onClick={() => handleNavigate('maquila-servicios')}>Maquila Servicios</DropdownItem>
                        </DropdownSection>

                        <DropdownSection>
                          <DropdownSectionTitle>Cotizador - Tarifas</DropdownSectionTitle>
                          <DropdownItem $active={currentPage === 'tarifario'} onClick={() => handleNavigate('tarifario')}>Tarifario</DropdownItem>
                          <DropdownItem $active={currentPage === 'tarifario-margens'} onClick={() => handleNavigate('tarifario-margens')}>Tarifario Margenes</DropdownItem>
                          <DropdownItem $active={currentPage === 'variables-cotizador'} onClick={() => handleNavigate('variables-cotizador')}>Variables Cotizador</DropdownItem>
                          <DropdownItem $active={currentPage === 'insumos-palletizados'} onClick={() => handleNavigate('insumos-palletizados')}>Insumos Palletizados</DropdownItem>
                          <DropdownItem $active={currentPage === 'detalle-precio-palletizados'} onClick={() => handleNavigate('detalle-precio-palletizados')}>Precio Palletizados</DropdownItem>
                        </DropdownSection>

                        <DropdownSection>
                          <DropdownSectionTitle>Cotizador - Catalogos</DropdownSectionTitle>
                          <DropdownItem $active={currentPage === 'paises'} onClick={() => handleNavigate('paises')}>Paises</DropdownItem>
                          <DropdownItem $active={currentPage === 'fsc'} onClick={() => handleNavigate('fsc')}>FSC</DropdownItem>
                          <DropdownItem $active={currentPage === 'reference-types'} onClick={() => handleNavigate('reference-types')}>Tipos Referencia</DropdownItem>
                          <DropdownItem $active={currentPage === 'recubrimiento-types'} onClick={() => handleNavigate('recubrimiento-types')}>Tipos Recubrimiento</DropdownItem>
                          <DropdownItem $active={currentPage === 'cantidad-base'} onClick={() => handleNavigate('cantidad-base')}>Cantidad Base</DropdownItem>
                        </DropdownSection>
                      </>
                    )}
                  </DropdownMenu>
                </DropdownContainer>
              )}

              {/* Cotizador dropdown - para roles con acceso */}
              {roleHelpers.canUseCotizador(user.role_id) && (
                <DropdownContainer ref={cotizadorRef}>
                  <DropdownButton
                    $active={currentPage === 'cotizaciones' || currentPage === 'aprobaciones'}
                    onClick={() => setCotizadorOpen(!cotizadorOpen)}
                  >
                    Cotizador
                    <DropdownArrow $open={cotizadorOpen}>▼</DropdownArrow>
                  </DropdownButton>
                  <DropdownMenu $open={cotizadorOpen}>
                    <DropdownSection>
                      <DropdownItem
                        $active={currentPage === 'cotizaciones'}
                        onClick={() => handleNavigate('cotizaciones')}
                      >
                        Cotizaciones
                      </DropdownItem>
                      {/* Aprobar Cotizaciones - solo Gerentes y JefeVenta */}
                      {roleHelpers.canApproveCotizaciones(user.role_id) && (
                        <DropdownItem
                          $active={currentPage === 'aprobaciones'}
                          onClick={() => handleNavigate('aprobaciones')}
                        >
                          Aprobar Cotizaciones
                        </DropdownItem>
                      )}
                      <DropdownItem
                        $active={currentPage === 'ayuda-cotizador'}
                        onClick={() => handleNavigate('ayuda-cotizador')}
                      >
                        Sección de Ayuda
                      </DropdownItem>
                    </DropdownSection>
                  </DropdownMenu>
                </DropdownContainer>
              )}

              {/* Vendedor ve Notificaciones a traves del bloque general hasArea */}
            </>
          )}
          </NavTabs>

          <UserSection>
            <UserInfoText>{displayName}</UserInfoText>
            <SettingsButton onClick={() => handleNavigate('cambiar-contrasena')}>Clave</SettingsButton>
            <LogoutButton onClick={onLogout}>Salir</LogoutButton>
          </UserSection>
        </HeaderContent>
      </HeaderBar>

      <Main>
        {renderPage()}
      </Main>
    </AppContainer>
  );
}

// Tipos de paginas de autenticacion (sin login)
type AuthPage = 'login' | 'forgot-password' | 'reset-password';

function AppContent() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [resetParams, setResetParams] = useState<{ token?: string; email?: string }>({});

  // Verificar sesion existente al cargar
  useEffect(() => {
    const storedUser = authApi.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = useCallback(async (rut: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login({ rut, password });
      setUser(response.user);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, []);

  const handleLogout = useCallback(() => {
    authApi.logout();
    setUser(null);
    setAuthPage('login');
  }, []);

  // Navegacion de paginas de auth
  const handleAuthNavigate = useCallback((page: string, params?: Record<string, string>) => {
    setAuthPage(page as AuthPage);
    if (params) {
      setResetParams(params);
    }
  }, []);

  if (isLoading) {
    return null; // O un spinner de carga
  }

  // Si no hay usuario, mostrar paginas de autenticacion
  if (!user) {
    switch (authPage) {
      case 'forgot-password':
        return <ForgotPassword onNavigate={handleAuthNavigate} />;
      case 'reset-password':
        return (
          <ResetPassword
            onNavigate={handleAuthNavigate}
            token={resetParams.token}
            email={resetParams.email}
          />
        );
      default:
        return <Login onLogin={handleLogin} onNavigate={handleAuthNavigate} />;
    }
  }

  return <MainContent user={user} onLogout={handleLogout} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <GlobalStyles />
        <AppContent />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
