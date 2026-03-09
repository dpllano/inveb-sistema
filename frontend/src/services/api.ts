/**
 * API Service for Cascade endpoints
 * Incluye autenticacion contra Laravel MySQL
 */

import axios from 'axios';
import type { CascadeRule, ValidateCombinationParams, ValidationResult, FormOptionsResponse } from '../types/cascade';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';
const API_ROOT_URL = import.meta.env.VITE_API_ROOT_URL || 'http://localhost:8001';

// Token storage key
const TOKEN_KEY = 'inveb_cascade_token';
const USER_KEY = 'inveb_cascade_user';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para endpoints de raiz (health check)
const rootApi = axios.create({
  baseURL: API_ROOT_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el error es 401, limpiar token
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth types
export interface LoginRequest {
  rut: string;
  password: string;
}

export interface UserInfo {
  id: number;
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  role_id: number;
  role_nombre: string;
  sala_corte_id?: number | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserInfo;
}

// Auth API
export const authApi = {
  /**
   * Login con RUT y password contra MySQL de Laravel
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    // Guardar token y usuario en localStorage
    localStorage.setItem(TOKEN_KEY, response.data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    return response.data;
  },

  /**
   * Logout - limpia token local
   */
  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Obtener usuario actual del token
   */
  getCurrentUser: async (): Promise<UserInfo> => {
    const response = await api.get<UserInfo>('/auth/me');
    return response.data;
  },

  /**
   * Verificar si hay token valido
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Obtener usuario guardado localmente
   */
  getStoredUser: (): UserInfo | null => {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Verificar token con el servidor
   */
  verifyToken: async (): Promise<boolean> => {
    try {
      const response = await api.post<{ valid: boolean }>('/auth/verify');
      return response.data.valid;
    } catch {
      return false;
    }
  },

  /**
   * Cambiar contraseña del usuario autenticado
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  /**
   * Solicitar recuperación de contraseña
   */
  forgotPassword: async (email: string): Promise<{
    message: string;
    success: boolean;
    _dev_token?: string;
    _dev_reset_url?: string;
  }> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Validar token de reset
   */
  validateResetToken: async (token: string, email: string): Promise<{
    valid: boolean;
    message: string;
    email?: string;
  }> => {
    const response = await api.post('/auth/validate-reset-token', { token, email });
    return response.data;
  },

  /**
   * Restablecer contraseña con token
   */
  resetPassword: async (token: string, email: string, newPassword: string): Promise<{
    message: string;
    success: boolean;
  }> => {
    const response = await api.post('/auth/reset-password', {
      token,
      email,
      new_password: newPassword,
    });
    return response.data;
  },
};

// Work Order types
export interface WorkOrderListItem {
  id: number;
  created_at: string;
  client_name: string;
  descripcion: string;
  canal: string | null;
  item_tipo: string | null;
  estado: string;
  estado_abrev: string;
  creador_nombre: string;
  tiempo_total: number | null;
  tiempo_venta: number | null;
  tiempo_desarrollo: number | null;
  tiempo_muestra: number | null;
  tiempo_diseno: number | null;
  tiempo_externo: number | null;
  tiempo_precatalogacion: number | null;
  tiempo_catalogacion: number | null;
  tipo_solicitud: number | null;
  current_area_id: number | null;
  ultimo_cambio_area: string | null;
  cad: string | null;
  carton: string | null;
  material_codigo: string | null;
}

export interface WorkOrderListResponse {
  items: WorkOrderListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FilterOption {
  id: number | string;
  nombre: string;
  abreviatura?: string;
  codigo?: string | null;
}

export interface FilterOptions {
  estados: FilterOption[];
  areas: FilterOption[];
  canales: FilterOption[];
  clientes: FilterOption[];
  vendedores: FilterOption[];
  plantas: FilterOption[];
  impresiones: FilterOption[];
  procesos: FilterOption[];
  estilos: FilterOption[];
  fsc: FilterOption[];
  org_ventas?: FilterOption[];
}

export interface WorkOrderFilters {
  page?: number;
  page_size?: number;
  id_ot?: number;
  date_desde?: string;
  date_hasta?: string;
  client_id?: number[];
  estado_id?: number[];
  area_id?: number[];
  canal_id?: number[];
  vendedor_id?: number[];
  cad?: string;
  carton?: string;
  material?: string;
  descripcion?: string;
  planta_id?: number[];
  tipo_solicitud?: number[];
}

// Tipos para crear OT
export interface WorkOrderCreateData {
  // Datos Comerciales (requeridos)
  client_id: number;
  descripcion: string;
  tipo_solicitud: number;
  canal_id: number;
  // Datos Comerciales (opcionales)
  org_venta_id?: number;
  subsubhierarchy_id?: number;
  nombre_contacto?: string;
  email_contacto?: string;
  telefono_contacto?: string;
  volumen_venta_anual?: number;
  usd?: number;
  oc?: number;
  codigo_producto?: string;
  dato_sub_cliente?: string;
  instalacion_cliente?: number;
  // Antecedentes Desarrollo - Documentos
  ant_des_correo_cliente?: number;
  ant_des_plano_actual?: number;
  ant_des_boceto_actual?: number;
  ant_des_spec?: number;
  ant_des_otro?: number;
  // Antecedentes Desarrollo - Muestra Competencia
  ant_des_cj_referencia_de?: number;
  ant_des_cj_referencia_dg?: number;
  ant_des_envase_primario?: number;
  // Antecedentes Desarrollo - Conservar Muestra
  ant_des_conservar_muestra?: number;
  // Armado Automático
  armado_automatico?: number;
  // Solicita
  analisis?: number;
  prueba_industrial?: number;
  muestra?: number;
  numero_muestras?: number;
  // Referencia
  reference_type?: number;
  reference_id?: number;
  // Caracteristicas (Cascade)
  product_type_id?: number;
  impresion?: number;
  fsc?: string;
  cinta?: number;
  coverage_internal_id?: number;
  coverage_external_id?: number;
  carton_color?: number;
  carton_id?: number;
  cad_id?: number;
  cad?: string;
  style_id?: number;
  items_set?: number;
  veces_item?: number;
  largura_hm?: number;
  anchura_hm?: number;
  area_producto?: number;
  recorte_adicional?: number;
  longitud_pegado?: number;
  golpes_largo?: number;
  golpes_ancho?: number;
  separacion_golpes_largo?: number;
  separacion_golpes_ancho?: number;
  rayado_c1r1?: number;
  rayado_r1_r2?: number;
  rayado_r2_c2?: number;
  pallet_qa_id?: number;
  pais_id?: number;
  restriccion_pallet?: number;
  tamano_pallet_type_id?: number;
  altura_pallet?: number;
  permite_sobresalir_carga?: number;
  // Especificaciones técnicas
  bct_min_lb?: number;
  bct_min_kg?: number;
  bct_humedo_lb?: number;
  ect?: number;
  gramaje?: number;
  mullen?: number;
  fct?: number;
  espesor?: number;
  cobb_interior?: number;
  cobb_exterior?: number;
  flexion_aleta?: number;
  peso?: number;
  // Diseño y acabados
  design_type_id?: number;
  barniz_uv?: number;
  porcentanje_barniz_uv?: number;
  // Medidas
  interno_largo?: number;
  interno_ancho?: number;
  interno_alto?: number;
  externo_largo?: number;
  externo_ancho?: number;
  externo_alto?: number;
  // Terminaciones
  process_id?: number;
  armado_id?: number;
  sentido_armado?: number;
  tipo_sentido_onda?: string;
  // Colores
  numero_colores?: number;
  color_1_id?: number;
  color_2_id?: number;
  color_3_id?: number;
  color_4_id?: number;
  color_5_id?: number;
  // Desarrollo
  peso_contenido_caja?: number;
  autosoportante?: number;
  envase_id?: number;
  cantidad?: number;
  observacion?: string;
  // Planta
  planta_id?: number;
}

export interface WorkOrderCreateResponse {
  id: number;
  message: string;
}

// Tipo para actualizar OT (todos los campos son opcionales)
export type WorkOrderUpdateData = Partial<WorkOrderCreateData>;

export interface WorkOrderUpdateResponse {
  id: number;
  message: string;
}

// Tipos para gestion de OT (workflow)
export interface ManagementHistoryItem {
  id: number;
  work_space: string;
  state: string;
  user_name: string;
  observation: string | null;
  created_at: string;
}

export interface ManagementHistoryResponse {
  ot_id: number;
  current_area: string;
  current_state: string;
  history: ManagementHistoryItem[];
}

export interface WorkflowOptions {
  areas: Array<{ id: number; nombre: string }>;
  states: Array<{ id: number; nombre: string; abreviatura?: string }>;
  management_types: Array<{ id: number; nombre: string }>;
  // Sprint N: Condicionales ManageWorkOrder
  motives?: Array<{ id: number; nombre: string }>;  // Motivos de rechazo (state_id=12)
  proveedores?: Array<{ id: number; nombre: string }>;  // Proveedores externos (management_type 9 o 10)
}

export interface TransitionRequest {
  management_type_id: number;
  work_space_id?: number;
  state_id?: number;
  observation?: string;
  // Sprint N: Condicionales ManageWorkOrder
  motive_id?: number;  // Motivo de rechazo cuando state_id=12
  proveedor_id?: number;  // Proveedor externo cuando management_type 9 o 10
}

export interface TransitionResponse {
  id: number;
  message: string;
  new_area: string;
  new_state: string;
}

export interface AnswerRequest {
  content: string;
  observation?: string;
}

// Approval types
export interface ApprovalListItem {
  id: number;
  created_at: string;
  client_name: string;
  descripcion: string;
  canal: string | null;
  item_tipo: string | null;
  estado: string;
  estado_abrev: string;
  creador_nombre: string;
}

export interface ApprovalListResponse {
  items: ApprovalListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApprovalActionResponse {
  id: number;
  message: string;
  new_state: string;
}

// Issue 26, 45-46: Respuesta de detalles de CAD
export interface CADDetailsResponse {
  id: number;
  cad: string;
  // Medidas interiores
  interno_largo: number;
  interno_ancho: number;
  interno_alto: number;
  // Medidas exteriores
  externo_largo: number;
  externo_ancho: number;
  externo_alto: number;
  // Otros datos del CAD
  area_producto: number;
  largura_hm: number;
  anchura_hm: number;
  largura_hc: number;
  anchura_hc: number;
  area_hm: number;
  area_hc_unitario: number;
  rayado_c1r1: number;
  rayado_r1_r2: number;
  rayado_r2_c2: number;
  recorte_caracteristico: number;
  recorte_adicional: number;
  veces_item: number;
}

// Issue 25: Fórmula McKee - Respuesta de detalles de Cartón
export interface CartonDetailsResponse {
  id: number;
  codigo: string | null;
  nombre: string | null;
  ect_min: number | null;
  espesor: number | null;
}

// Work Orders API
export const workOrdersApi = {
  /**
   * Lista OTs con filtros y paginacion
   */
  list: async (filters: WorkOrderFilters = {}): Promise<WorkOrderListResponse> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.id_ot) params.append('id_ot', filters.id_ot.toString());
    if (filters.date_desde) params.append('date_desde', filters.date_desde);
    if (filters.date_hasta) params.append('date_hasta', filters.date_hasta);
    if (filters.cad) params.append('cad', filters.cad);
    if (filters.carton) params.append('carton', filters.carton);
    if (filters.material) params.append('material', filters.material);
    if (filters.descripcion) params.append('descripcion', filters.descripcion);

    // Arrays
    filters.client_id?.forEach(id => params.append('client_id', id.toString()));
    filters.estado_id?.forEach(id => params.append('estado_id', id.toString()));
    filters.area_id?.forEach(id => params.append('area_id', id.toString()));
    filters.canal_id?.forEach(id => params.append('canal_id', id.toString()));
    filters.vendedor_id?.forEach(id => params.append('vendedor_id', id.toString()));
    filters.planta_id?.forEach(id => params.append('planta_id', id.toString()));
    filters.tipo_solicitud?.forEach(id => params.append('tipo_solicitud', id.toString()));

    const response = await api.get<WorkOrderListResponse>(`/work-orders/?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtiene opciones para los filtros
   */
  getFilterOptions: async (): Promise<FilterOptions> => {
    const response = await api.get<FilterOptions>('/work-orders/filter-options');
    return response.data;
  },

  /**
   * Obtiene detalle de una OT
   */
  get: async (id: number): Promise<Record<string, unknown>> => {
    const response = await api.get(`/work-orders/${id}`);
    return response.data;
  },

  /**
   * Crea una nueva OT
   */
  create: async (data: WorkOrderCreateData): Promise<WorkOrderCreateResponse> => {
    const response = await api.post<WorkOrderCreateResponse>('/work-orders/', data);
    return response.data;
  },

  /**
   * Actualiza una OT existente
   */
  update: async (id: number, data: WorkOrderUpdateData): Promise<WorkOrderUpdateResponse> => {
    const response = await api.put<WorkOrderUpdateResponse>(`/work-orders/${id}`, data);
    return response.data;
  },

  /**
   * Obtiene historial de gestion de una OT
   */
  getManagementHistory: async (id: number): Promise<ManagementHistoryResponse> => {
    const response = await api.get<ManagementHistoryResponse>(`/work-orders/${id}/management`);
    return response.data;
  },

  /**
   * Obtiene opciones de workflow para transicion
   */
  getWorkflowOptions: async (id: number): Promise<WorkflowOptions> => {
    const response = await api.get<WorkflowOptions>(`/work-orders/${id}/workflow-options`);
    return response.data;
  },

  /**
   * Realiza transicion de OT
   */
  transition: async (id: number, data: TransitionRequest): Promise<TransitionResponse> => {
    const response = await api.post<TransitionResponse>(`/work-orders/${id}/transition`, data);
    return response.data;
  },

  /**
   * Lista OTs pendientes de aprobación
   */
  getPendingApproval: async (page: number = 1, pageSize: number = 20): Promise<ApprovalListResponse> => {
    const response = await api.get<ApprovalListResponse>(`/work-orders/pending-approval?page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  /**
   * Aprueba una OT
   */
  approve: async (id: number): Promise<ApprovalActionResponse> => {
    const response = await api.put<ApprovalActionResponse>(`/work-orders/${id}/approve`);
    return response.data;
  },

  /**
   * Rechaza una OT
   */
  reject: async (id: number): Promise<ApprovalActionResponse> => {
    const response = await api.put<ApprovalActionResponse>(`/work-orders/${id}/reject`);
    return response.data;
  },

  /**
   * Obtiene archivos por área (stub para futuro desarrollo)
   */
  getFilesByArea: async (_id: number): Promise<Record<string, unknown>[]> => {
    // TODO: Implementar endpoint real
    return [];
  },

  /**
   * Crea una respuesta a una consulta (stub para futuro desarrollo)
   */
  createAnswer: async (_otId: number, _managementId: number, _data: AnswerRequest): Promise<{ id: number; message: string }> => {
    // TODO: Implementar endpoint real
    return { id: 0, message: 'No implementado' };
  },
};

// =============================================
// EXPORTS API - Descarga Excel/SAP
// =============================================

export const exportsApi = {
  /**
   * Descarga OT individual en formato Excel
   */
  downloadOTExcel: async (otId: number): Promise<void> => {
    const response = await api.get(`/exports/ot/${otId}/excel`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `OT_${otId}_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Descarga OT individual en formato SAP
   */
  downloadOTSAP: async (otId: number): Promise<void> => {
    const response = await api.get(`/exports/ot/${otId}/sap`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SAP_OT_${otId}_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Descarga lista de OTs en formato Excel
   */
  downloadOTsListExcel: async (filters: {
    estado_id?: number;
    area_id?: number;
    canal_id?: number;
    client_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  } = {}): Promise<void> => {
    const params = new URLSearchParams();
    if (filters.estado_id) params.append('estado_id', filters.estado_id.toString());
    if (filters.area_id) params.append('area_id', filters.area_id.toString());
    if (filters.canal_id) params.append('canal_id', filters.canal_id.toString());
    if (filters.client_id) params.append('client_id', filters.client_id.toString());
    if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);

    const response = await api.get(`/exports/ots/excel?${params.toString()}`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Lista_OTs_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Obtiene el log de modificaciones de una OT (bitácora)
   */
  getOTLog: async (otId: number, filters: {
    date_desde?: string;
    date_hasta?: string;
    user_id?: number;
    page?: number;
    page_size?: number;
  } = {}): Promise<{
    items: Array<{
      id: number;
      work_order_id: number;
      operacion: string;
      observacion: string;
      datos_modificados: Record<string, unknown>;
      usuario: string;
      created_at: string;
    }>;
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    usuarios_filtro: Array<{ id: number; nombre: string }>;
  }> => {
    const params = new URLSearchParams();
    if (filters.date_desde) params.append('date_desde', filters.date_desde);
    if (filters.date_hasta) params.append('date_hasta', filters.date_hasta);
    if (filters.user_id) params.append('user_id', filters.user_id.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());

    const response = await api.get(`/exports/ot/${otId}/log?${params.toString()}`);
    return response.data;
  },

  /**
   * Descarga log de OT en formato Excel
   */
  downloadOTLogExcel: async (otId: number, filters: {
    date_desde?: string;
    date_hasta?: string;
    user_id?: number;
  } = {}): Promise<void> => {
    const params = new URLSearchParams();
    if (filters.date_desde) params.append('date_desde', filters.date_desde);
    if (filters.date_hasta) params.append('date_hasta', filters.date_hasta);
    if (filters.user_id) params.append('user_id', filters.user_id.toString());

    const response = await api.get(`/exports/ot/${otId}/log/excel?${params.toString()}`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Log_OT_${otId}_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// =============================================
// PDFS API - Generación de PDFs
// =============================================

export const pdfsApi = {
  /**
   * Descarga etiqueta de muestra (producto o cliente)
   */
  downloadEtiquetaMuestra: async (muestraId: number, tipo: 'producto' | 'cliente' = 'producto'): Promise<void> => {
    const response = await api.get(`/pdfs/etiqueta-muestra/${muestraId}?tipo=${tipo}`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Etiqueta_${tipo === 'producto' ? 'Producto' : 'Cliente'}_${muestraId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Descarga ficha de diseño de OT
   */
  downloadFichaDiseno: async (otId: number): Promise<void> => {
    const response = await api.get(`/pdfs/ficha-diseno/${otId}`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ficha_Diseno_OT_${otId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Descarga solicitud de estudio de benchmarking
   */
  downloadEstudioBench: async (otId: number): Promise<void> => {
    const response = await api.get(`/pdfs/estudio-bench/${otId}`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Estudio_Benchmarking_OT_${otId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Descarga PDF de cotización
   */
  downloadCotizacion: async (cotizacionId: number): Promise<void> => {
    const response = await api.get(`/pdfs/cotizacion/${cotizacionId}`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cotizacion_${cotizacionId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// =============================================
// CASCADES API - Cascadas AJAX para formularios
// =============================================

// Types para cascadas
export interface InstalacionOption {
  id: number;
  nombre: string;
  direccion?: string;
}

export interface ContactoOption {
  id: number;
  nombre: string;
  cargo?: string;  // Issue 6: Incluir cargo del contacto
  email?: string;
  telefono?: string;
}

export interface InstalacionInfo {
  contactos: ContactoOption[];
  tipo_pallet_id?: number;
  altura_pallet?: number;
  sobresalir_carga?: number;
  bulto_zunchado?: number;
  formato_etiqueta?: string;
  etiquetas_pallet?: number;
  termocontraible?: number;
  fsc?: number;
  pais_mercado_destino?: string;
  certificado_calidad?: number;
}

export interface ContactoInfo {
  nombre_contacto: string;
  email_contacto?: string;
  telefono_contacto?: string;
  comuna_contacto?: string;
  direccion_contacto?: string;
}

export interface ClienteCotizaResponse {
  instalaciones: InstalacionOption[];
  clasificacion_id?: number;
  clasificacion_nombre?: string;
}

export interface SelectOption {
  id: number;
  nombre: string;
}

export const cascadesApi = {
  /**
   * Obtiene instalaciones de un cliente
   */
  getInstalacionesCliente: async (clientId: number): Promise<InstalacionOption[]> => {
    const response = await api.get<InstalacionOption[]>(`/cascades/clientes/${clientId}/instalaciones`);
    return response.data;
  },

  /**
   * Obtiene instalaciones y clasificación para cotización
   */
  getInstalacionesClienteCotiza: async (clientId: number): Promise<ClienteCotizaResponse> => {
    const response = await api.get<ClienteCotizaResponse>(`/cascades/clientes/${clientId}/instalaciones-cotiza`);
    return response.data;
  },

  /**
   * Obtiene contactos de un cliente/instalación
   */
  getContactosCliente: async (clientId: number, instalacionId?: number): Promise<ContactoOption[]> => {
    const params = instalacionId ? `?instalacion_id=${instalacionId}` : '';
    const response = await api.get<ContactoOption[]>(`/cascades/clientes/${clientId}/contactos${params}`);
    return response.data;
  },

  /**
   * Obtiene información completa de una instalación
   */
  getInformacionInstalacion: async (instalacionId: number): Promise<InstalacionInfo> => {
    const response = await api.get<InstalacionInfo>(`/cascades/instalaciones/${instalacionId}`);
    return response.data;
  },

  /**
   * Obtiene datos de un contacto
   */
  getDatosContacto: async (contactoId: number): Promise<ContactoInfo> => {
    const response = await api.get<ContactoInfo>(`/cascades/contactos/${contactoId}`);
    return response.data;
  },

  /**
   * Obtiene servicios de maquila según tipo de producto
   */
  getServiciosMaquila: async (tipoProductoId: number): Promise<SelectOption[]> => {
    const response = await api.get<SelectOption[]>(`/cascades/productos/${tipoProductoId}/servicios-maquila`);
    return response.data;
  },

  /**
   * Obtiene rubro de una jerarquía nivel 3
   */
  getRubro: async (subsubhierarchyId: number): Promise<{ rubro_id: number | null }> => {
    const response = await api.get<{ rubro_id: number | null }>(`/cascades/jerarquias/${subsubhierarchyId}/rubro`);
    return response.data;
  },

  /**
   * Obtiene jerarquías nivel 2 filtradas por rubro
   */
  getJerarquia2Rubro: async (hierarchyId: number, rubroId?: number): Promise<SelectOption[]> => {
    const params = rubroId ? `&rubro_id=${rubroId}` : '';
    const response = await api.get<SelectOption[]>(`/cascades/jerarquias/nivel2-rubro?hierarchy_id=${hierarchyId}${params}`);
    return response.data;
  },

  /**
   * Obtiene jerarquías nivel 3 filtradas por rubro
   */
  getJerarquia3Rubro: async (subhierarchyId: number, rubroId?: number): Promise<SelectOption[]> => {
    const params = rubroId ? `&rubro_id=${rubroId}` : '';
    const response = await api.get<SelectOption[]>(`/cascades/jerarquias/nivel3-rubro?subhierarchy_id=${subhierarchyId}${params}`);
    return response.data;
  },
};

export const cascadeApi = {
  /**
   * Get all cascade rules
   */
  getRules: async (): Promise<CascadeRule[]> => {
    const response = await api.get<CascadeRule[]>('/cascade-rules/');
    return response.data;
  },

  /**
   * Get a single cascade rule by ID
   */
  getRule: async (id: number): Promise<CascadeRule> => {
    const response = await api.get<CascadeRule>(`/cascade-rules/${id}`);
    return response.data;
  },

  /**
   * Get cascade rules by trigger field
   */
  getRulesByTrigger: async (field: string): Promise<CascadeRule[]> => {
    const response = await api.get<CascadeRule[]>(`/cascade-rules/trigger/${field}`);
    return response.data;
  },

  /**
   * Validate a product combination
   */
  validateCombination: async (params: ValidateCombinationParams): Promise<ValidationResult> => {
    const response = await api.get<ValidationResult>('/cascade-combinations/validate/', {
      params,
    });
    return response.data;
  },

  /**
   * Health check (usa rootApi porque /health esta en la raiz, no bajo /api/v1)
   */
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await rootApi.get<{ status: string }>('/health');
    return response.data;
  },

  /**
   * Get all form options in one call
   */
  getFormOptions: async (): Promise<FormOptionsResponse> => {
    const response = await api.get<FormOptionsResponse>('/form-options/');
    return response.data;
  },

  /**
   * Issue 26, 45-46: Obtiene detalles de un CAD específico
   */
  getCADDetails: async (cadId: number): Promise<CADDetailsResponse> => {
    const response = await api.get<CADDetailsResponse>(`/work-orders/cad/${cadId}`);
    return response.data;
  },

  /**
   * Issue 25: Fórmula McKee - Obtiene detalles de un Cartón (ECT, Espesor)
   * Fuente Laravel: /getCarton
   */
  getCartonDetails: async (cartonId: number): Promise<CartonDetailsResponse> => {
    const response = await api.get<CartonDetailsResponse>(`/work-orders/carton/${cartonId}`);
    return response.data;
  },
};

// Notification types
export interface NotificationItem {
  id: number;
  work_order_id: number;
  motivo: string;
  observacion: string | null;
  created_at: string;
  generador_nombre: string;
  ot_descripcion: string;
  client_name: string;
  item_tipo: string | null;
  estado: string;
  area: string | null;
  dias_total: number | null;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MarkReadResponse {
  id: number;
  message: string;
}

export interface CreateNotificationRequest {
  work_order_id: number;
  user_id?: number;
  motivo: string;
  observacion?: string;
}

export interface CreateNotificationResponse {
  id: number;
  message: string;
}

export interface NotificationCountResponse {
  count: number;
}

// Notifications API
export const notificationsApi = {
  /**
   * Lista notificaciones del usuario autenticado
   */
  list: async (page: number = 1, pageSize: number = 20): Promise<NotificationListResponse> => {
    const response = await api.get<NotificationListResponse>('/notifications/', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  /**
   * Marca una notificacion como leida
   */
  markAsRead: async (id: number): Promise<MarkReadResponse> => {
    const response = await api.put<MarkReadResponse>(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Crea una nueva notificacion
   */
  create: async (data: CreateNotificationRequest): Promise<CreateNotificationResponse> => {
    const response = await api.post<CreateNotificationResponse>('/notifications/', data);
    return response.data;
  },

  /**
   * Obtiene el conteo de notificaciones activas
   */
  getCount: async (): Promise<NotificationCountResponse> => {
    const response = await api.get<NotificationCountResponse>('/notifications/count');
    return response.data;
  },
};

// ============================================
// MANTENEDORES API - Clientes
// ============================================

// Client types
export interface ClientListItem {
  id: number;
  rut: string;
  nombre_sap: string;
  codigo: string | null;
  clasificacion_nombre: string | null;
  email_contacto_1: string | null;
  phone_contacto_1: string | null;
  active: number;
  created_at: string | null;
}

export interface ClientListResponse {
  items: ClientListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Issue 3: ClientDetail con TODOS los campos de contacto (según Laravel)
export interface ClientDetail {
  id: number;
  rut: string;
  nombre_sap: string;
  codigo: string | null;
  // Contacto 1
  nombre_contacto_1: string | null;
  cargo_contacto_1: string | null;
  email_contacto_1: string | null;
  phone_contacto_1: string | null;
  direccion_contacto_1: string | null;
  comuna_contacto_1: number | null;
  active_contacto_1: string | null;
  // Contacto 2
  nombre_contacto_2: string | null;
  cargo_contacto_2: string | null;
  email_contacto_2: string | null;
  phone_contacto_2: string | null;
  direccion_contacto_2: string | null;
  comuna_contacto_2: number | null;
  active_contacto_2: string | null;
  // Contacto 3
  nombre_contacto_3: string | null;
  cargo_contacto_3: string | null;
  email_contacto_3: string | null;
  phone_contacto_3: string | null;
  direccion_contacto_3: string | null;
  comuna_contacto_3: number | null;
  active_contacto_3: string | null;
  // Contacto 4
  nombre_contacto_4: string | null;
  cargo_contacto_4: string | null;
  email_contacto_4: string | null;
  phone_contacto_4: string | null;
  direccion_contacto_4: string | null;
  comuna_contacto_4: number | null;
  active_contacto_4: string | null;
  // Contacto 5
  nombre_contacto_5: string | null;
  cargo_contacto_5: string | null;
  email_contacto_5: string | null;
  phone_contacto_5: string | null;
  direccion_contacto_5: string | null;
  comuna_contacto_5: number | null;
  active_contacto_5: string | null;
  // Clasificacion y estado
  clasificacion_id: number | null;
  clasificacion_nombre: string | null;
  active: number;
  created_at: string | null;
  updated_at: string | null;
}

// Issue 3: ClientCreate con campos de contacto completos
export interface ClientCreate {
  rut: string;
  nombre_sap: string;
  codigo?: string;
  // Contacto 1
  nombre_contacto_1?: string;
  cargo_contacto_1?: string;
  email_contacto_1?: string;
  phone_contacto_1?: string;
  direccion_contacto_1?: string;
  // Contacto 2
  nombre_contacto_2?: string;
  cargo_contacto_2?: string;
  email_contacto_2?: string;
  phone_contacto_2?: string;
  direccion_contacto_2?: string;
  // Contacto 3
  nombre_contacto_3?: string;
  cargo_contacto_3?: string;
  email_contacto_3?: string;
  phone_contacto_3?: string;
  direccion_contacto_3?: string;
  clasificacion_id?: number;
}

// Issue 3: ClientUpdate con campos de contacto completos
export interface ClientUpdate {
  nombre_sap?: string;
  codigo?: string;
  // Contacto 1
  nombre_contacto_1?: string;
  cargo_contacto_1?: string;
  email_contacto_1?: string;
  phone_contacto_1?: string;
  direccion_contacto_1?: string;
  // Contacto 2
  nombre_contacto_2?: string;
  cargo_contacto_2?: string;
  email_contacto_2?: string;
  phone_contacto_2?: string;
  direccion_contacto_2?: string;
  // Contacto 3
  nombre_contacto_3?: string;
  cargo_contacto_3?: string;
  email_contacto_3?: string;
  phone_contacto_3?: string;
  direccion_contacto_3?: string;
  clasificacion_id?: number;
}

export interface ClientResponse {
  id: number;
  message: string;
}

export interface ClasificacionOption {
  id: number;
  descripcion: string;
}

export interface ClientFilters {
  page?: number;
  page_size?: number;
  search?: string;
  clasificacion_id?: number;
  activo?: boolean;
}

// Clients API
export const clientsApi = {
  /**
   * Lista clientes con filtros y paginacion
   */
  list: async (filters: ClientFilters = {}): Promise<ClientListResponse> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.clasificacion_id) params.append('clasificacion_id', filters.clasificacion_id.toString());
    if (filters.activo !== undefined) params.append('activo', filters.activo.toString());

    const response = await api.get<ClientListResponse>(`/mantenedores/clients/?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtiene detalle de un cliente
   */
  get: async (id: number): Promise<ClientDetail> => {
    const response = await api.get<ClientDetail>(`/mantenedores/clients/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo cliente
   */
  create: async (data: ClientCreate): Promise<ClientResponse> => {
    const response = await api.post<ClientResponse>('/mantenedores/clients/', data);
    return response.data;
  },

  /**
   * Actualiza un cliente existente
   */
  update: async (id: number, data: ClientUpdate): Promise<ClientResponse> => {
    const response = await api.put<ClientResponse>(`/mantenedores/clients/${id}`, data);
    return response.data;
  },

  /**
   * Activa un cliente
   */
  activate: async (id: number): Promise<ClientResponse> => {
    const response = await api.put<ClientResponse>(`/mantenedores/clients/${id}/activate`);
    return response.data;
  },

  /**
   * Desactiva un cliente
   */
  deactivate: async (id: number): Promise<ClientResponse> => {
    const response = await api.put<ClientResponse>(`/mantenedores/clients/${id}/deactivate`);
    return response.data;
  },

  /**
   * Obtiene opciones de clasificacion
   */
  getClasificaciones: async (): Promise<ClasificacionOption[]> => {
    const response = await api.get<ClasificacionOption[]>('/mantenedores/clients/clasificaciones');
    return response.data;
  },
};

// ============================================
// MANTENEDORES API - Instalaciones (Issue 4)
// ============================================

// Installation types
export interface InstallationListItem {
  id: number;
  nombre: string | null;
  client_id: number;
  tipo_pallet_nombre: string | null;
  fsc_nombre: string | null;
  pais_nombre: string | null;
  active: number | null;
}

export interface InstallationDetail {
  id: number;
  client_id: number;
  nombre: string | null;
  tipo_pallet: number | null;
  tipo_pallet_nombre: string | null;
  altura_pallet: number | null;
  sobresalir_carga: number | null;
  bulto_zunchado: number | null;
  formato_etiqueta: number | null;
  formato_etiqueta_nombre: string | null;
  etiquetas_pallet: number | null;
  termocontraible: number | null;
  fsc: number | null;
  fsc_nombre: string | null;
  pais_mercado_destino: number | null;
  pais_nombre: string | null;
  certificado_calidad: number | null;
  certificado_calidad_nombre: string | null;
  active: number | null;
  // Contacto 1
  nombre_contacto: string | null;
  cargo_contacto: string | null;
  email_contacto: string | null;
  phone_contacto: string | null;
  direccion_contacto: string | null;
  comuna_contacto: number | null;
  active_contacto: string | null;
  // Contacto 2
  nombre_contacto_2: string | null;
  cargo_contacto_2: string | null;
  email_contacto_2: string | null;
  phone_contacto_2: string | null;
  direccion_contacto_2: string | null;
  comuna_contacto_2: number | null;
  active_contacto_2: string | null;
  // Contacto 3
  nombre_contacto_3: string | null;
  cargo_contacto_3: string | null;
  email_contacto_3: string | null;
  phone_contacto_3: string | null;
  direccion_contacto_3: string | null;
  comuna_contacto_3: number | null;
  active_contacto_3: string | null;
  // Contacto 4
  nombre_contacto_4: string | null;
  cargo_contacto_4: string | null;
  email_contacto_4: string | null;
  phone_contacto_4: string | null;
  direccion_contacto_4: string | null;
  comuna_contacto_4: number | null;
  active_contacto_4: string | null;
  // Contacto 5
  nombre_contacto_5: string | null;
  cargo_contacto_5: string | null;
  email_contacto_5: string | null;
  phone_contacto_5: string | null;
  direccion_contacto_5: string | null;
  comuna_contacto_5: number | null;
  active_contacto_5: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface InstallationCreate {
  client_id: number;
  nombre?: string;
  tipo_pallet?: number;
  altura_pallet?: number;
  sobresalir_carga?: number;
  bulto_zunchado?: number;
  formato_etiqueta?: number;
  etiquetas_pallet?: number;
  termocontraible?: number;
  fsc?: number;
  pais_mercado_destino?: number;
  certificado_calidad?: number;
  active?: number;
  // Contactos opcionales
  nombre_contacto?: string;
  cargo_contacto?: string;
  email_contacto?: string;
  phone_contacto?: string;
  direccion_contacto?: string;
}

export interface InstallationUpdate {
  nombre?: string;
  tipo_pallet?: number;
  altura_pallet?: number;
  sobresalir_carga?: number;
  bulto_zunchado?: number;
  formato_etiqueta?: number;
  etiquetas_pallet?: number;
  termocontraible?: number;
  fsc?: number;
  pais_mercado_destino?: number;
  certificado_calidad?: number;
  active?: number;
  // Contactos opcionales
  nombre_contacto?: string;
  cargo_contacto?: string;
  email_contacto?: string;
  phone_contacto?: string;
  direccion_contacto?: string;
}

export interface InstallationResponse {
  id: number;
  message: string;
}

// Installations API
export const installationsApi = {
  /**
   * Lista instalaciones de un cliente
   * Issue 4: Obtener instalaciones para mostrar en mantenedor
   */
  getByClient: async (clientId: number): Promise<InstallationListItem[]> => {
    const response = await api.get<InstallationListItem[]>(`/mantenedores/installations/by-client/${clientId}`);
    return response.data;
  },

  /**
   * Obtiene detalle de una instalación
   */
  get: async (id: number): Promise<InstallationDetail> => {
    const response = await api.get<InstallationDetail>(`/mantenedores/installations/${id}`);
    return response.data;
  },

  /**
   * Crea una nueva instalación
   * Issue 4: Crear instalación desde mantenedor cliente
   */
  create: async (data: InstallationCreate): Promise<InstallationResponse> => {
    const response = await api.post<InstallationResponse>('/mantenedores/installations/', data);
    return response.data;
  },

  /**
   * Actualiza una instalación existente
   */
  update: async (id: number, data: InstallationUpdate): Promise<InstallationResponse> => {
    const response = await api.put<InstallationResponse>(`/mantenedores/installations/${id}`, data);
    return response.data;
  },

  /**
   * Elimina una instalación (soft delete)
   */
  delete: async (id: number): Promise<InstallationResponse> => {
    const response = await api.delete<InstallationResponse>(`/mantenedores/installations/${id}`);
    return response.data;
  },
};

// ============================================
// MANTENEDORES API - Usuarios
// ============================================

// User types
export interface UserListItem {
  id: number;
  rut: string;
  nombre: string;
  apellido: string;
  email: string | null;
  role_nombre: string | null;
  active: boolean;
}

export interface UserListResponse {
  items: UserListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserDetail {
  id: number;
  rut: string;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  role_id: number | null;
  role_nombre: string | null;
  active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserCreate {
  rut: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  password: string;
  role_id?: number;
}

export interface UserUpdate {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  password?: string;
  role_id?: number;
}

export interface UserResponse {
  id: number;
  message: string;
}

export interface RoleOption {
  id: number;
  nombre: string;
}

export interface WorkSpaceOption {
  id: number;
  nombre: string;
}

export interface UserFilters {
  page?: number;
  page_size?: number;
  search?: string;
  role_id?: number;
  active?: boolean;
}

// Users API
export const usersApi = {
  /**
   * Lista usuarios con filtros y paginacion
   */
  list: async (filters: UserFilters = {}): Promise<UserListResponse> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.role_id) params.append('role_id', filters.role_id.toString());
    if (filters.active !== undefined) params.append('active', filters.active.toString());

    const response = await api.get<UserListResponse>(`/mantenedores/users/?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtiene detalle de un usuario
   */
  get: async (id: number): Promise<UserDetail> => {
    const response = await api.get<UserDetail>(`/mantenedores/users/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo usuario
   */
  create: async (data: UserCreate): Promise<UserResponse> => {
    const response = await api.post<UserResponse>('/mantenedores/users/', data);
    return response.data;
  },

  /**
   * Actualiza un usuario existente
   */
  update: async (id: number, data: UserUpdate): Promise<UserResponse> => {
    const response = await api.put<UserResponse>(`/mantenedores/users/${id}`, data);
    return response.data;
  },

  /**
   * Activa un usuario
   */
  activate: async (id: number): Promise<UserResponse> => {
    const response = await api.put<UserResponse>(`/mantenedores/users/${id}/activate`);
    return response.data;
  },

  /**
   * Desactiva un usuario
   */
  deactivate: async (id: number): Promise<UserResponse> => {
    const response = await api.put<UserResponse>(`/mantenedores/users/${id}/deactivate`);
    return response.data;
  },

  /**
   * Obtiene opciones de roles
   */
  getRoles: async (): Promise<RoleOption[]> => {
    const response = await api.get<RoleOption[]>('/mantenedores/users/roles');
    return response.data;
  },

  /**
   * Obtiene opciones de areas de trabajo
   */
  getWorkSpaces: async (): Promise<WorkSpaceOption[]> => {
    const response = await api.get<WorkSpaceOption[]>('/mantenedores/users/workspaces');
    return response.data;
  },
};

// ============================================
// MANTENEDORES API - Genérico
// ============================================

// Generic mantenedor types
export interface GenericListItem {
  id: number;
  nombre: string;
  codigo?: string | null;
  active?: number;
  extra_fields?: Record<string, unknown>;
}

export interface GenericListResponse {
  items: GenericListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface GenericDetail {
  id: number;
  data: Record<string, unknown>;
}

export interface TablaInfo {
  key: string;
  table: string;
  display_name: string;
  columns: string[];
  has_active: boolean;
}

export interface GenericFilters {
  page?: number;
  page_size?: number;
  search?: string;
  activo?: number;
}

// Generic API
export const genericApi = {
  /**
   * Obtiene lista de tablas disponibles
   */
  getTablas: async (): Promise<TablaInfo[]> => {
    const response = await api.get<TablaInfo[]>('/mantenedores/generic/tablas');
    return response.data;
  },

  /**
   * Lista items de una tabla
   */
  list: async (tablaKey: string, filters: GenericFilters = {}): Promise<GenericListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.activo !== undefined) params.append('activo', filters.activo.toString());

    const response = await api.get<GenericListResponse>(`/mantenedores/generic/${tablaKey}?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtiene detalle de un item
   */
  get: async (tablaKey: string, id: number): Promise<GenericDetail> => {
    const response = await api.get<GenericDetail>(`/mantenedores/generic/${tablaKey}/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo item
   */
  create: async (tablaKey: string, data: Record<string, unknown>): Promise<GenericDetail> => {
    const response = await api.post<GenericDetail>(`/mantenedores/generic/${tablaKey}`, { data });
    return response.data;
  },

  /**
   * Actualiza un item
   */
  update: async (tablaKey: string, id: number, data: Record<string, unknown>): Promise<GenericDetail> => {
    const response = await api.put<GenericDetail>(`/mantenedores/generic/${tablaKey}/${id}`, { data });
    return response.data;
  },

  /**
   * Activa un item
   */
  activate: async (tablaKey: string, id: number): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/mantenedores/generic/${tablaKey}/${id}/activate`);
    return response.data;
  },

  /**
   * Desactiva un item
   */
  deactivate: async (tablaKey: string, id: number): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/mantenedores/generic/${tablaKey}/${id}/deactivate`);
    return response.data;
  },

  /**
   * Carga masiva de items
   */
  bulkUpload: async (tablaKey: string, items: Array<{ data: Record<string, unknown> }>): Promise<{
    total_recibidos: number;
    insertados: number;
    errores: number;
    detalles_errores: Array<{ fila: number; error: string; data?: Record<string, unknown> }>;
  }> => {
    const response = await api.post(`/mantenedores/generic/${tablaKey}/bulk`, { items });
    return response.data;
  },
};

// ============================================
// MANTENEDORES API - Jerarquías
// ============================================

// Jerarquía types
export interface Jerarquia1Item {
  id: number;
  descripcion: string;
  active: number;
  count_children: number;
}

export interface Jerarquia1Response {
  items: Jerarquia1Item[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Jerarquia1Detail {
  id: number;
  descripcion: string;
  active: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Jerarquia2Item {
  id: number;
  descripcion: string;
  hierarchy_id: number;
  hierarchy_nombre: string;
  active: number;
  count_children: number;
}

export interface Jerarquia2Response {
  items: Jerarquia2Item[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Jerarquia2Detail {
  id: number;
  descripcion: string;
  hierarchy_id: number;
  hierarchy_nombre: string;
  active: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Jerarquia3Item {
  id: number;
  descripcion: string;
  jerarquia_sap?: string | null;
  subhierarchy_id: number;
  subhierarchy_nombre: string;
  hierarchy_id: number;
  hierarchy_nombre: string;
  active: number;
}

export interface Jerarquia3Response {
  items: Jerarquia3Item[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Jerarquia3Detail {
  id: number;
  descripcion: string;
  jerarquia_sap?: string | null;
  subhierarchy_id: number;
  subhierarchy_nombre: string;
  hierarchy_id: number;
  hierarchy_nombre: string;
  active: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ParentOption {
  id: number;
  nombre: string;
}

export interface JerarquiaFilters {
  page?: number;
  page_size?: number;
  search?: string;
  activo?: number;
  hierarchy_id?: number;
  subhierarchy_id?: number;
}

// Jerarquías API
export const jerarquiasApi = {
  // Nivel 1
  listNivel1: async (filters: JerarquiaFilters = {}): Promise<Jerarquia1Response> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.activo !== undefined) params.append('activo', filters.activo.toString());

    const response = await api.get<Jerarquia1Response>(`/mantenedores/jerarquias/nivel1?${params.toString()}`);
    return response.data;
  },

  getNivel1: async (id: number): Promise<Jerarquia1Detail> => {
    const response = await api.get<Jerarquia1Detail>(`/mantenedores/jerarquias/nivel1/${id}`);
    return response.data;
  },

  createNivel1: async (data: { descripcion: string }): Promise<Jerarquia1Detail> => {
    const response = await api.post<Jerarquia1Detail>('/mantenedores/jerarquias/nivel1', data);
    return response.data;
  },

  updateNivel1: async (id: number, data: { descripcion?: string }): Promise<Jerarquia1Detail> => {
    const response = await api.put<Jerarquia1Detail>(`/mantenedores/jerarquias/nivel1/${id}`, data);
    return response.data;
  },

  activateNivel1: async (id: number): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/mantenedores/jerarquias/nivel1/${id}/activate`);
    return response.data;
  },

  deactivateNivel1: async (id: number): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/mantenedores/jerarquias/nivel1/${id}/deactivate`);
    return response.data;
  },

  // Nivel 2
  getNivel2Parents: async (): Promise<ParentOption[]> => {
    const response = await api.get<ParentOption[]>('/mantenedores/jerarquias/nivel2/parents');
    return response.data;
  },

  listNivel2: async (filters: JerarquiaFilters = {}): Promise<Jerarquia2Response> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.activo !== undefined) params.append('activo', filters.activo.toString());
    if (filters.hierarchy_id) params.append('hierarchy_id', filters.hierarchy_id.toString());

    const response = await api.get<Jerarquia2Response>(`/mantenedores/jerarquias/nivel2?${params.toString()}`);
    return response.data;
  },

  getNivel2: async (id: number): Promise<Jerarquia2Detail> => {
    const response = await api.get<Jerarquia2Detail>(`/mantenedores/jerarquias/nivel2/${id}`);
    return response.data;
  },

  createNivel2: async (data: { descripcion: string; hierarchy_id: number }): Promise<Jerarquia2Detail> => {
    const response = await api.post<Jerarquia2Detail>('/mantenedores/jerarquias/nivel2', data);
    return response.data;
  },

  updateNivel2: async (id: number, data: { descripcion?: string; hierarchy_id?: number }): Promise<Jerarquia2Detail> => {
    const response = await api.put<Jerarquia2Detail>(`/mantenedores/jerarquias/nivel2/${id}`, data);
    return response.data;
  },

  activateNivel2: async (id: number): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/mantenedores/jerarquias/nivel2/${id}/activate`);
    return response.data;
  },

  deactivateNivel2: async (id: number): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/mantenedores/jerarquias/nivel2/${id}/deactivate`);
    return response.data;
  },

  // Nivel 3
  getNivel3Parents: async (hierarchy_id?: number): Promise<ParentOption[]> => {
    const params = new URLSearchParams();
    if (hierarchy_id) params.append('hierarchy_id', hierarchy_id.toString());
    const response = await api.get<ParentOption[]>(`/mantenedores/jerarquias/nivel3/parents?${params.toString()}`);
    return response.data;
  },

  listNivel3: async (filters: JerarquiaFilters = {}): Promise<Jerarquia3Response> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.activo !== undefined) params.append('activo', filters.activo.toString());
    if (filters.hierarchy_id) params.append('hierarchy_id', filters.hierarchy_id.toString());
    if (filters.subhierarchy_id) params.append('subhierarchy_id', filters.subhierarchy_id.toString());

    const response = await api.get<Jerarquia3Response>(`/mantenedores/jerarquias/nivel3?${params.toString()}`);
    return response.data;
  },

  getNivel3: async (id: number): Promise<Jerarquia3Detail> => {
    const response = await api.get<Jerarquia3Detail>(`/mantenedores/jerarquias/nivel3/${id}`);
    return response.data;
  },

  createNivel3: async (data: { descripcion: string; jerarquia_sap?: string; subhierarchy_id: number }): Promise<Jerarquia3Detail> => {
    const response = await api.post<Jerarquia3Detail>('/mantenedores/jerarquias/nivel3', data);
    return response.data;
  },

  updateNivel3: async (id: number, data: { descripcion?: string; jerarquia_sap?: string; subhierarchy_id?: number }): Promise<Jerarquia3Detail> => {
    const response = await api.put<Jerarquia3Detail>(`/mantenedores/jerarquias/nivel3/${id}`, data);
    return response.data;
  },

  activateNivel3: async (id: number): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/mantenedores/jerarquias/nivel3/${id}/activate`);
    return response.data;
  },

  deactivateNivel3: async (id: number): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/mantenedores/jerarquias/nivel3/${id}/deactivate`);
    return response.data;
  },
};

// ============================================
// COTIZACIONES API
// ============================================

export interface CotizacionListItem {
  id: number;
  client_id: number;
  nombre_contacto: string | null;
  email_contacto: string | null;
  telefono_contacto: string | null;
  moneda_id: number | null;
  dias_pago: number | null;
  comision: number | null;
  observacion_interna: string | null;
  observacion_cliente: string | null;
  user_id: number;
  estado_id: number;
  role_can_show: number | null;
  nivel_aprobacion: number | null;
  previous_version_id: number | null;
  original_version_id: number | null;
  version_number: number | null;
  active: number;
  created_at: string;
  updated_at: string;
  cliente_nombre: string | null;
  usuario_nombre: string | null;
  total_detalles: number;
  // Campos adicionales para vista externa
  detalles_ganados?: number;
  detalles_perdidos?: number;
  fecha_primera_version?: string;
  primer_detalle_descripcion?: string;
  primer_detalle_cad?: string;
  primer_detalle_ot?: number | string;
}

export interface CotizacionListResponse {
  items: CotizacionListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DetalleCotizacion {
  id: number;
  cotizacion_id: number;
  tipo_detalle_id: number | null;
  cantidad: number;
  product_type_id: number | null;
  numero_colores: number | null;
  area_hc: string | null;
  anchura: number | null;
  largura: number | null;
  carton_id: number | null;
  impresion: string | null;
  golpes_largo: number | null;
  golpes_ancho: number | null;
  process_id: number | null;
  rubro_id: number | null;
  planta_id: number | null;
  margen: number | null;
  ciudad_id: number | null;
  pallet: boolean;
  zuncho: boolean;
  funda: boolean;
  stretch_film: boolean;
  matriz: boolean;
  clisse: boolean;
  maquila: boolean;
  armado_automatico: boolean;
  variable_cotizador_id: number | null;
  planta_nombre: string | null;
  carton_codigo: string | null;
  proceso_nombre: string | null;
  rubro_nombre: string | null;
}

// Sprint N: Respuesta de carga masiva de detalles
export interface CargaMasivaDetallesResponse {
  success: boolean;
  total_procesados: number;
  total_exitosos: number;
  total_errores: number;
  errores: Array<{ index: number; error: string }>;
}

export interface CotizacionConDetalles extends CotizacionListItem {
  detalles: DetalleCotizacion[];
  detalles_ganados_count: number;
  detalles_perdidos_count: number;
}

export interface CotizacionCreate {
  client_id: number;
  nombre_contacto?: string;
  email_contacto?: string;
  telefono_contacto?: string;
  moneda_id?: number;
  dias_pago?: number;
  comision?: number;
  observacion_interna?: string;
  observacion_cliente?: string;
  user_id: number;
}

export interface CotizacionUpdate {
  client_id?: number;
  nombre_contacto?: string;
  email_contacto?: string;
  telefono_contacto?: string;
  moneda_id?: number;
  dias_pago?: number;
  comision?: number;
  observacion_interna?: string;
  observacion_cliente?: string;
}

export interface CotizacionApproval {
  id: number;
  cotizacion_id: number;
  user_id: number;
  role_do_action: number;
  action_made: string;
  motivo: string | null;
  created_at: string;
  usuario_nombre: string | null;
}

export interface CotizacionFilters {
  estado_id?: number[];
  client_id?: number[];
  user_id?: number;
  cotizacion_id?: number;
  date_desde?: string;
  date_hasta?: string;
  page?: number;
  page_size?: number;
  cad?: string;
}

export interface CotizacionEstado {
  id: number;
  nombre: string;
}

export const cotizacionesApi = {
  /**
   * Lista cotizaciones con filtros y paginacion
   */
  list: async (filters: CotizacionFilters = {}): Promise<CotizacionListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.user_id) params.append('user_id', filters.user_id.toString());
    if (filters.cotizacion_id) params.append('cotizacion_id', filters.cotizacion_id.toString());
    if (filters.date_desde) params.append('date_desde', filters.date_desde);
    if (filters.date_hasta) params.append('date_hasta', filters.date_hasta);
    if (filters.cad) params.append('cad', filters.cad);
    if (filters.estado_id) {
      filters.estado_id.forEach(id => params.append('estado_id', id.toString()));
    }
    if (filters.client_id) {
      filters.client_id.forEach(id => params.append('client_id', id.toString()));
    }

    const response = await api.get<CotizacionListResponse>(`/cotizaciones/?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtiene detalle de una cotizacion con sus detalles
   */
  get: async (id: number): Promise<CotizacionConDetalles> => {
    const response = await api.get<CotizacionConDetalles>(`/cotizaciones/${id}`);
    return response.data;
  },

  /**
   * Crea una nueva cotizacion
   */
  create: async (data: CotizacionCreate): Promise<CotizacionListItem> => {
    const response = await api.post<CotizacionListItem>('/cotizaciones/', data);
    return response.data;
  },

  /**
   * Actualiza una cotizacion existente
   */
  update: async (id: number, data: CotizacionUpdate): Promise<CotizacionListItem> => {
    const response = await api.put<CotizacionListItem>(`/cotizaciones/${id}`, data);
    return response.data;
  },

  /**
   * Elimina (desactiva) una cotizacion
   */
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/cotizaciones/${id}`);
    return response.data;
  },

  /**
   * Solicita aprobacion para una cotizacion
   */
  solicitarAprobacion: async (id: number): Promise<{ message: string; cotizacion_id: number; nivel_aprobacion: number }> => {
    const response = await api.post<{ message: string; cotizacion_id: number; nivel_aprobacion: number }>(`/cotizaciones/${id}/solicitar-aprobacion`);
    return response.data;
  },

  /**
   * Gestiona aprobacion (aprobar o rechazar)
   */
  gestionarAprobacion: async (id: number, action: 'aprobar' | 'rechazar', motivo?: string): Promise<{ message: string; cotizacion_id: number; nuevo_estado: number }> => {
    const response = await api.post<{ message: string; cotizacion_id: number; nuevo_estado: number }>(
      `/cotizaciones/${id}/gestionar-aprobacion`,
      { action, motivo }
    );
    return response.data;
  },

  /**
   * Obtiene historial de aprobaciones
   */
  getAprobaciones: async (id: number): Promise<CotizacionApproval[]> => {
    const response = await api.get<CotizacionApproval[]>(`/cotizaciones/${id}/aprobaciones`);
    return response.data;
  },

  /**
   * Duplica una cotizacion
   */
  duplicar: async (id: number): Promise<{ message: string; original_id: number; nueva_id: number }> => {
    const response = await api.post<{ message: string; original_id: number; nueva_id: number }>(`/cotizaciones/${id}/duplicar`);
    return response.data;
  },

  /**
   * Crea nueva version de cotizacion
   */
  versionar: async (id: number): Promise<{ message: string; original_id: number; nueva_id: number; version_number: number }> => {
    const response = await api.post<{ message: string; original_id: number; nueva_id: number; version_number: number }>(`/cotizaciones/${id}/versionar`);
    return response.data;
  },

  /**
   * Retoma cotizacion rechazada
   */
  retomar: async (id: number): Promise<{ message: string; original_id: number; nueva_id: number; version_number: number }> => {
    const response = await api.post<{ message: string; original_id: number; nueva_id: number; version_number: number }>(`/cotizaciones/${id}/retomar`);
    return response.data;
  },

  /**
   * Lista estados de cotizacion
   */
  getEstados: async (): Promise<CotizacionEstado[]> => {
    const response = await api.get<CotizacionEstado[]>('/cotizaciones/estados/');
    return response.data;
  },

  /**
   * Lista cotizaciones pendientes de aprobacion
   */
  getPendientesAprobacion: async (role_id?: number): Promise<CotizacionListItem[]> => {
    const params = new URLSearchParams();
    if (role_id) params.append('role_id', role_id.toString());

    const response = await api.get<CotizacionListItem[]>(`/cotizaciones/pendientes-aprobacion/?${params.toString()}`);
    return response.data;
  },

  /**
   * Exporta una cotizacion a PDF
   */
  exportPdf: async (id: number): Promise<void> => {
    const response = await api.get(`/cotizaciones/${id}/export-pdf`, {
      responseType: 'blob',
    });

    // Crear blob y descargar
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Obtener nombre del archivo del header o usar default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `cotizacion_${id}.pdf`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename=(.+)/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // =============================================
  // APROBACIÓN EXTERNA
  // =============================================

  /**
   * Lista cotizaciones pendientes de aprobación por vendedor externo
   */
  getPendientesAprobacionExterno: async (filters: Record<string, string | number> = {}): Promise<{
    items: CotizacionListItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/cotizaciones/pendientes-aprobacion-externo/?${params.toString()}`);
    return response.data;
  },

  /**
   * Solicita aprobación de cotización por vendedor externo
   */
  solicitarAprobacionExterno: async (id: number, userId: number): Promise<{
    success: boolean;
    message: string;
    cotizacion_id: number;
    redirect_url: string;
  }> => {
    const response = await api.post(`/cotizaciones/${id}/solicitar-aprobacion-externo?user_id=${userId}`);
    return response.data;
  },

  /**
   * Gestiona aprobación externa (aprobar o rechazar)
   */
  gestionarAprobacionExterno: async (
    id: number,
    data: { action: 'aprobar' | 'aprobar_parcial' | 'rechazar'; motivo?: string; user_id?: number }
  ): Promise<{
    success: boolean;
    message: string;
    cotizacion_id: number;
    nuevo_estado: number;
    action_made: string;
    redirect_url: string;
  }> => {
    const response = await api.post(`/cotizaciones/${id}/gestionar-aprobacion-externo`, data);
    return response.data;
  },

  /**
   * Obtiene historial completo de aprobaciones (internas y externas)
   */
  getHistorialAprobaciones: async (id: number): Promise<{
    cotizacion_id: number;
    total_aprobaciones: number;
    historial: Array<{
      id: number;
      usuario_nombre: string;
      rol_nombre: string;
      action_made: string;
      motivo: string | null;
      created_at: string;
    }>;
  }> => {
    const response = await api.get(`/cotizaciones/${id}/historial-aprobaciones`);
    return response.data;
  },

  /**
   * Obtiene datos de un detalle de cotización para crear OT
   */
  getDetalleParaOT: async (detalleId: number, tipoSolicitud: number): Promise<{
    success: boolean;
    detalle_id: number;
    cotizacion_id: number;
    tipo_solicitud: number;
    datos_ot: DatosOTFromCotizacion;
    mensaje: string;
  }> => {
    const response = await api.get(`/cotizaciones/detalle/${detalleId}/para-ot`, {
      params: { tipo_solicitud: tipoSolicitud }
    });
    return response.data;
  },

  /**
   * Lista detalles de cotizaciones que pueden convertirse en OT
   */
  getDetallesParaOT: async (cotizacionId?: number, page = 1, pageSize = 20): Promise<{
    items: DetalleParaOTItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    if (cotizacionId) {
      params.append('cotizacion_id', cotizacionId.toString());
    }
    const response = await api.get(`/cotizaciones/detalles-para-ot/?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtiene resumen de costos para mostrar las tablas de resultado
   */
  getCostosResumen: async (id: number): Promise<CostosResumenResponse> => {
    const response = await api.get<CostosResumenResponse>(`/cotizaciones/${id}/costos-resumen`);
    return response.data;
  },

  /**
   * Crea un detalle para una cotización
   */
  createDetalle: async (cotizacionId: number, data: DetalleCotizacionCreateData): Promise<DetalleCotizacion> => {
    const response = await api.post<DetalleCotizacion>(`/cotizaciones/${cotizacionId}/detalles`, data);
    return response.data;
  },

  /**
   * Lista detalles de una cotización
   */
  getDetalles: async (cotizacionId: number): Promise<DetalleCotizacion[]> => {
    const response = await api.get<DetalleCotizacion[]>(`/cotizaciones/${cotizacionId}/detalles`);
    return response.data;
  },

  /**
   * Carga masiva de detalles desde array
   * Sprint N: Modal Carga Masiva Detalles
   */
  cargaMasivaDetalles: async (cotizacionId: number, detalles: DetalleCotizacionCreateData[]): Promise<CargaMasivaDetallesResponse> => {
    const response = await api.post<CargaMasivaDetallesResponse>(
      `/cotizaciones/${cotizacionId}/detalles/carga-masiva`,
      { cotizacion_id: cotizacionId, detalles }
    );
    return response.data;
  },

  /**
   * Crea una cotización a partir de una OT existente
   * El endpoint copia datos del cliente, contacto y características de la OT
   */
  createFromOT: async (workOrderId: number, data?: { observacion_interna?: string; observacion_cliente?: string }): Promise<{ success: boolean; cotizacion_id: number; message: string; work_order_id: number }> => {
    const response = await api.post<{ success: boolean; cotizacion_id: number; message: string; work_order_id: number }>(
      `/cotizaciones/from-ot/${workOrderId}`,
      data || {}
    );
    return response.data;
  },
};

// Interface para crear detalle de cotización
export interface DetalleCotizacionCreateData {
  tipo_detalle_id: number;
  cantidad: number;
  product_type_id: number;
  planta_id?: number;
  variable_cotizador_id?: number;
  numero_colores?: number | null;

  // Dimensiones
  largo?: number | null;
  ancho?: number | null;
  alto?: number | null;

  // Corrugado
  area_hc?: number | null;
  anchura?: number | null;
  largura?: number | null;
  carton_id?: number | null;
  impresion?: number | null;
  golpes_largo?: number | null;
  golpes_ancho?: number | null;
  process_id?: number | null;
  rubro_id?: number | null;
  porcentaje_cera_interno?: number | null;
  porcentaje_cera_externo?: number | null;

  // Impresión
  printing_machine_id?: number | null;
  print_type_id?: number | null;
  ink_type_id?: number | null;
  barniz?: number | null;
  barniz_type_id?: number | null;

  // Pegado
  pegado_id?: number | null;
  cinta_desgarro?: number | null;

  // Servicios
  matriz?: number | null;
  clisse?: number | null;
  royalty?: number | null;
  maquila?: number | null;
  maquila_servicio_id?: number | null;
  armado_automatico?: number | null;
  armado_usd_caja?: number | null;

  // Embalaje
  pallet?: number | null;
  pallet_height_id?: number | null;
  zuncho?: number | null;
  funda?: number | null;
  stretch_film?: number | null;

  // Comercial
  ciudad_id?: number | null;
  margen?: number | null;

  // Material
  descripcion_material_detalle?: string | null;
  cad_material_id?: number | null;
  material_id?: number | null;

  // Esquinero
  largo_esquinero?: number | null;
  carton_esquinero_id?: number | null;
  funda_esquinero?: number | null;
  tipo_destino_esquinero?: number | null;
  tipo_camion_esquinero?: number | null;
}

// Interface para Resumen de Costos
export interface ParametroProducto {
  numero: number;
  descripcion: string;
  cad: string;
  planta: string;
  tipo_producto: string;
  item: string;
  carton: string;
  flete: number;
  margen_papeles: number;
  margen: number;
  margen_minimo: number;
  precio_usd_mm2: number;
  precio_usd_ton: number;
  precio_usd_un: number;
  precio_clp_un: number;
  cantidad: number;
  precio_total_musd: number;
}

export interface NuevoDetalle {
  numero: number;
  descripcion: string;
  cad: string;
  tipo_producto: string;
  item: string;
  carton: string;
  mc_usd_mm2: number;
  margen_bruto_sin_flete: number;
  margen_bruto_sin_flete_pct: number;
  margen_servir: number;
  margen_servir_pct: number;
  ebitda_usd_mm2: number;
  mg_ebitda: number;
  diferencia_margen: number;
}

export interface CostoProducto {
  numero: number;
  descripcion: string;
  cad: string;
  tipo_producto: string;
  item: string;
  carton: string;
  costo_directo: number;
  costo_indirecto: number;
  gvv: number;
  costo_fijo: number;
  costo_total: number;
}

export interface CostoServicio {
  numero: number;
  descripcion: string;
  cad: string;
  tipo_producto: string;
  item: string;
  carton: string;
  maquila: number;
  armado: number;
  clisses: number;
  matriz: number;
  mano_obra: number;
  flete: number;
}

export interface CostosResumenResponse {
  cotizacion_id: number;
  estado_id: number;
  estado_nombre: string;
  cliente_nombre: string;
  tiene_resultados: boolean;
  parametros_producto: ParametroProducto[];
  nuevos_detalles: NuevoDetalle[];
  costos_productos: CostoProducto[];
  costos_servicios: CostoServicio[];
}

// Interfaces para Detalle a OT
export interface DatosOTFromCotizacion {
  detalle_cotizacion_id: number;
  cotizacion_id: number;
  tipo_solicitud: number;
  client_id: number;
  cliente_nombre: string;
  nombre_contacto?: string;
  email_contacto?: string;
  telefono_contacto?: string;
  descripcion?: string;
  carton_id?: number;
  carton_codigo?: string;
  hierarchy_id?: number;
  subhierarchy_id?: number;
  subsubhierarchy_id?: number;
  jerarquia_1_nombre?: string;
  jerarquia_2_nombre?: string;
  jerarquia_3_nombre?: string;
  largo_externo?: number;
  ancho_externo?: number;
  alto_externo?: number;
  largo_interno?: number;
  ancho_interno?: number;
  alto_interno?: number;
  cantidad?: number;
  // Campos específicos por tipo
  reference_id?: number;
  material_codigo?: string;
  cad_id?: number;
  cad_codigo?: string;
  bct_min_lb?: number;
  bct_min_kg?: number;
  bct?: number;
  unidad_medida_bct?: string;
  product_type_id?: number;
  product_type_nombre?: string;
  maquila?: number;
  maquila_servicio_id?: number;
  maquila_servicio_nombre?: string;
  golpes_ancho?: number;
  golpes_largo?: number;
  numero_colores?: number;
  process_id?: number;
  proceso_nombre?: string;
}

export interface DetalleParaOTItem {
  detalle_id: number;
  cotizacion_id: number;
  descripcion?: string;
  descripcion_material_detalle?: string;
  cantidad?: number;
  largura?: number;
  anchura?: number;
  altura?: number;
  client_id: number;
  cliente_nombre: string;
  estado_id: number;
  estado_nombre: string;
  cotizacion_fecha: string;
  cad_codigo?: string;
  carton_codigo?: string;
  tiene_ot: number;
  work_order_id?: number;
}

// ============================================
// ASIGNACIONES API
// ============================================

export interface AssignmentListItem {
  id: number;
  created_at: string;
  client_name: string;
  vendedor_nombre: string;
  tipo_solicitud: string;
  canal: string | null;
  jerarquia_1: string | null;
  jerarquia_2: string | null;
  jerarquia_3: string | null;
  cad: string | null;
  profesional_asignado: string | null;
  dias_sin_asignar: number;
}

export interface AssignmentListResponse {
  items: AssignmentListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AssignmentFilters {
  page?: number;
  page_size?: number;
  asignado?: 'SI' | 'NO';
  tipo_solicitud?: string;
  canal_id?: number;
  vendedor_id?: number;
  estado_id?: number;
  date_desde?: string;
  date_hasta?: string;
}

export interface Professional {
  id: number;
  nombre: string;
  rol: string;
}

export interface AssignmentActionResponse {
  id: number;
  message: string;
  profesional_nombre: string;
  es_reasignacion?: boolean;
  notificacion_creada?: boolean;
}

export interface AssignRequest {
  profesional_id: number;
  area_id?: number;
  observacion?: string;
  generar_notificacion?: boolean;
}

export const assignmentsApi = {
  /**
   * Lista OTs pendientes de asignacion
   */
  getPendingAssignment: async (filters: AssignmentFilters = {}): Promise<AssignmentListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.asignado) params.append('asignado', filters.asignado);
    if (filters.tipo_solicitud) params.append('tipo_solicitud', filters.tipo_solicitud);
    if (filters.canal_id) params.append('canal_id', filters.canal_id.toString());
    if (filters.vendedor_id) params.append('vendedor_id', filters.vendedor_id.toString());
    if (filters.estado_id) params.append('estado_id', filters.estado_id.toString());
    if (filters.date_desde) params.append('date_desde', filters.date_desde);
    if (filters.date_hasta) params.append('date_hasta', filters.date_hasta);

    const response = await api.get<AssignmentListResponse>(`/work-orders/pending-assignment?${params.toString()}`);
    return response.data;
  },

  /**
   * Asigna un profesional a una OT (version simple sin mensaje)
   */
  assign: async (otId: number, profesionalId: number): Promise<AssignmentActionResponse> => {
    const response = await api.put<AssignmentActionResponse>(`/work-orders/${otId}/assign`, {
      profesional_id: profesionalId,
    });
    return response.data;
  },

  /**
   * Asigna un profesional a una OT con mensaje/observacion
   * FASE 6.28 - Asignaciones con mensaje
   */
  assignWithMessage: async (otId: number, data: AssignRequest): Promise<AssignmentActionResponse> => {
    const response = await api.put<AssignmentActionResponse>(`/work-orders/${otId}/assign`, data);
    return response.data;
  },

  /**
   * Lista profesionales disponibles para asignacion
   */
  getProfessionals: async (): Promise<Professional[]> => {
    const response = await api.get<Professional[]>('/work-orders/professionals');
    return response.data;
  },
};

// ============================================
// REPORTES API
// ============================================

// Reports types
export interface OTsPorUsuarioItem {
  usuario_id: number;
  usuario_nombre: string;
  area_id: number | null;
  area_nombre: string;
  total_ots: number;
  ots_activas: number;
  ots_completadas: number;
  tiempo_promedio: number;
}

export interface OTsPorUsuarioResponse {
  items: OTsPorUsuarioItem[];
  total_usuarios: number;
  total_ots: number;
  areas: Array<{ id: number; nombre: string }>;
}

export interface OTsCompletadasItem {
  id: number;
  created_at: string;
  completed_at: string;
  client_name: string;
  descripcion: string;
  tiempo_total: number;
  estado: string;
  area_nombre?: string;
  en_plazo?: boolean;
  dias_proceso?: number;
}

export interface OTsCompletadasResponse {
  items: OTsCompletadasItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  resumen: {
    total_completadas: number;
    tiempo_promedio: number;
    tiempo_minimo: number;
    tiempo_maximo: number;
    total?: number;
    en_plazo?: number;
    fuera_plazo?: number;
    promedio_dias?: number;
  };
}

export interface TiempoPorAreaItem {
  mes: string;
  area_id: number;
  area_nombre: string;
  tiempo_promedio: number;
  total_ots: number;
}

export interface TiempoPorAreaResponse {
  items: TiempoPorAreaItem[];
  areas: Array<{ id: number; nombre: string }>;
  meses: string[];
}

export interface CargaMensualItem {
  mes: string;
  total_ots: number;
  ots_nuevas: number;
  ots_completadas: number;
  ots_activas: number;
}

export interface CargaMensualResponse {
  items: CargaMensualItem[];
  total_anual: number;
  promedio_mensual: number;
}

export interface RechazosMesItem {
  mes: string;
  total_rechazos: number;
  area_id: number | null;
  area_nombre: string | null;
}

export interface RechazosMesResponse {
  items: RechazosMesItem[];
  total_rechazos: number;
  promedio_mensual: number;
  por_area: Array<{ area: string; cantidad: number }>;
}

export interface AnulacionItem {
  id: number;
  fecha: string;
  client_name: string;
  descripcion: string;
  motivo: string | null;
  usuario: string;
}

export interface AnulacionesResponse {
  items: AnulacionItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  por_mes: Array<{ mes: string; cantidad: number }>;
}

export interface MotivoRechazoItem {
  motivo: string;
  cantidad: number;
  porcentaje: number;
}

export interface MotivosRechazoResponse {
  items: MotivoRechazoItem[];
  total: number;
  por_mes: Array<{ mes: string; cantidad: number }>;
}

export interface TiempoPrimeraMuestraItem {
  id: number;
  client_name: string;
  descripcion: string;
  created_at: string;
  primera_muestra_at: string | null;
  dias_hasta_muestra: number | null;
}

export interface TiempoPrimeraMuestraResponse {
  items: TiempoPrimeraMuestraItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  promedio_dias: number;
  minimo_dias: number;
  maximo_dias: number;
}

export interface GestionOTsActivasResponse {
  total_activas: number;
  por_area: Array<{
    area_id: number | null;
    area_nombre: string;
    total_ots: number;
    dias_promedio: number;
    ots_atrasadas: number;
  }>;
}

export interface IndicadoresSalaMuestraResponse {
  year: number;
  total_muestras: number;
  tiempo_promedio: number;
  por_mes: Array<{
    mes: string;
    total_muestras: number;
    tiempo_promedio: number;
    completadas: number;
    rechazadas: number;
  }>;
}

export interface DisenoEstructuralSalaResponse {
  year: number;
  por_mes: Array<{
    mes: string;
    total_ots: number;
    tiempo_diseno: number;
    tiempo_muestra: number;
  }>;
}

export interface TiempoDisenadorExternoResponse {
  disenadores: Array<{
    id: number;
    nombre: string;
    total_ots: number;
    tiempo_promedio: number;
  }>;
  total_disenadores: number;
}

export interface MuestraItem {
  id: number;
  ot_id: number;
  tipo: string;
  estado: string;
  responsable: string;
  created_at: string;
  completed_at: string | null;
}

export interface MuestrasResponse {
  items: MuestraItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  por_tipo: Array<{ tipo: string; cantidad: number }>;
  por_estado: Array<{ estado: string; cantidad: number }>;
}

export interface ReportFilters {
  page?: number;
  page_size?: number;
  date_desde?: string;
  date_hasta?: string;
  year?: number;
  area_id?: number;
  client_id?: number;
  estado?: string;
}

// Reports API
export const reportsApi = {
  /**
   * OTs por usuario y area
   */
  getOTsPorUsuario: async (filters: ReportFilters = {}): Promise<OTsPorUsuarioResponse> => {
    const params = new URLSearchParams();
    if (filters.date_desde) params.append('date_desde', filters.date_desde);
    if (filters.date_hasta) params.append('date_hasta', filters.date_hasta);
    if (filters.area_id) params.append('area_id', filters.area_id.toString());

    const response = await api.get<OTsPorUsuarioResponse>(`/reports/ots-por-usuario?${params.toString()}`);
    return response.data;
  },

  /**
   * OTs completadas con metricas
   */
  getOTsCompletadas: async (filters: ReportFilters = {}): Promise<OTsCompletadasResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.date_desde) params.append('date_desde', filters.date_desde);
    if (filters.date_hasta) params.append('date_hasta', filters.date_hasta);
    if (filters.client_id) params.append('client_id', filters.client_id.toString());

    const response = await api.get<OTsCompletadasResponse>(`/reports/ots-completadas?${params.toString()}`);
    return response.data;
  },

  /**
   * Tiempo promedio por area
   */
  getTiempoPorArea: async (year?: number): Promise<TiempoPorAreaResponse> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await api.get<TiempoPorAreaResponse>(`/reports/tiempo-por-area?${params.toString()}`);
    return response.data;
  },

  /**
   * Carga mensual de OTs
   */
  getCargaMensual: async (year?: number): Promise<CargaMensualResponse> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await api.get<CargaMensualResponse>(`/reports/carga-mensual?${params.toString()}`);
    return response.data;
  },

  /**
   * Rechazos por mes
   */
  getRechazosMes: async (year?: number): Promise<RechazosMesResponse> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await api.get<RechazosMesResponse>(`/reports/rechazos-mes?${params.toString()}`);
    return response.data;
  },

  /**
   * Anulaciones
   */
  getAnulaciones: async (filters: ReportFilters = {}): Promise<AnulacionesResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.date_desde) params.append('date_desde', filters.date_desde);
    if (filters.date_hasta) params.append('date_hasta', filters.date_hasta);

    const response = await api.get<AnulacionesResponse>(`/reports/anulaciones?${params.toString()}`);
    return response.data;
  },

  /**
   * Motivos de rechazo
   */
  getMotivosRechazo: async (filters: ReportFilters = {}): Promise<MotivosRechazoResponse> => {
    const params = new URLSearchParams();
    if (filters.date_desde) params.append('date_desde', filters.date_desde);
    if (filters.date_hasta) params.append('date_hasta', filters.date_hasta);

    const response = await api.get<MotivosRechazoResponse>(`/reports/motivos-rechazo?${params.toString()}`);
    return response.data;
  },

  /**
   * Tiempo primera muestra
   */
  getTiempoPrimeraMuestra: async (filters: ReportFilters = {}): Promise<TiempoPrimeraMuestraResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.date_desde) params.append('date_desde', filters.date_desde);
    if (filters.date_hasta) params.append('date_hasta', filters.date_hasta);

    const response = await api.get<TiempoPrimeraMuestraResponse>(`/reports/tiempo-primera-muestra?${params.toString()}`);
    return response.data;
  },

  /**
   * Gestion OTs activas
   */
  getGestionOTsActivas: async (area_id?: number): Promise<GestionOTsActivasResponse> => {
    const params = new URLSearchParams();
    if (area_id) params.append('area_id', area_id.toString());

    const response = await api.get<GestionOTsActivasResponse>(`/reports/gestion-ots-activas?${params.toString()}`);
    return response.data;
  },

  /**
   * Indicadores sala muestra
   */
  getIndicadoresSalaMuestra: async (year?: number): Promise<IndicadoresSalaMuestraResponse> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await api.get<IndicadoresSalaMuestraResponse>(`/reports/indicadores-sala-muestra?${params.toString()}`);
    return response.data;
  },

  /**
   * Diseno estructural y sala muestra
   */
  getDisenoEstructuralSala: async (year?: number): Promise<DisenoEstructuralSalaResponse> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await api.get<DisenoEstructuralSalaResponse>(`/reports/diseno-estructural-sala?${params.toString()}`);
    return response.data;
  },

  /**
   * Tiempo disenador externo
   */
  getTiempoDisenadorExterno: async (filters: ReportFilters = {}): Promise<TiempoDisenadorExternoResponse> => {
    const params = new URLSearchParams();
    if (filters.date_desde) params.append('date_desde', filters.date_desde);
    if (filters.date_hasta) params.append('date_hasta', filters.date_hasta);

    const response = await api.get<TiempoDisenadorExternoResponse>(`/reports/tiempo-disenador-externo?${params.toString()}`);
    return response.data;
  },

  /**
   * Muestras
   */
  getMuestras: async (filters: ReportFilters = {}): Promise<MuestrasResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.date_desde) params.append('date_desde', filters.date_desde);
    if (filters.date_hasta) params.append('date_hasta', filters.date_hasta);
    if (filters.estado) params.append('estado', filters.estado);

    const response = await api.get<MuestrasResponse>(`/reports/muestras?${params.toString()}`);
    return response.data;
  },
};

// ============================================
// MUESTRAS API - Módulo de Muestras
// ============================================

// Estados de muestra
export const ESTADO_MUESTRA = {
  0: 'Sin Asignar',
  1: 'En Proceso',
  2: 'Rechazada',
  3: 'Terminada',
  4: 'Anulada',
  5: 'Devuelta',
  6: 'Sala de Corte',
} as const;

// Muestra types
export interface MuestraListItem {
  id: number;
  work_order_id: number;
  ot_descripcion: string | null;
  client_name: string | null;
  estado: number;
  estado_nombre: string;
  prioritaria: boolean;
  sala_corte: string | null;
  cad: string | null;
  carton: string | null;
  tipo_pegado: string | null;
  created_at: string;
  cantidad_total: number;
  creador_nombre: string | null;
  // Campos para validación de permisos por sala_corte (como Laravel línea 120)
  sala_corte_vendedor?: number | null;
  sala_corte_disenador?: number | null;
  sala_corte_laboratorio?: number | null;
  sala_corte_1?: number | null;
  sala_corte_2?: number | null;
  sala_corte_3?: number | null;
  sala_corte_4?: number | null;
  sala_corte_disenador_revision?: number | null;
}

export interface MuestraListResponse {
  items: MuestraListItem[];
  total: number;
}

export interface MuestraDetalle {
  id: number;
  work_order_id: number;
  ot_descripcion: string | null;
  client_name: string | null;
  estado: number;
  estado_nombre: string;
  prioritaria: boolean;
  observacion_muestra: string | null;
  // Destinatarios (para el modal de edición dinámico)
  destinatarios_id: string[];  // ["1"], ["2"], etc.
  destinatario_nombre: string | null;  // "Retira Ventas VB", etc.
  sala_corte_id: number | null;
  sala_corte_nombre: string | null;
  cad_id: number | null;
  cad_codigo: string | null;
  carton_id: number | null;
  carton_codigo: string | null;
  // Pegado y tiempo
  pegado_id: number | null;
  pegado_nombre: string | null;
  tiempo_unitario: string | null;
  // Comentarios (forma de entrega)
  comentario_vendedor: string | null;
  comentario_disenador: string | null;
  comentario_laboratorio: string | null;
  comentario_disenador_revision: string | null;
  // Destinos
  vendedor_nombre: string | null;
  vendedor_direccion: string | null;
  vendedor_ciudad: string | null;
  vendedor_check: boolean;
  cantidad_vendedor: number;
  disenador_nombre: string | null;
  disenador_direccion: string | null;
  disenador_ciudad: string | null;
  disenador_check: boolean;
  cantidad_disenador: number;
  laboratorio_check: boolean;
  cantidad_laboratorio: number;
  cliente_check: boolean;
  cantidad_cliente: number;
  disenador_revision_nombre: string | null;
  disenador_revision_direccion: string | null;
  disenador_revision_check: boolean;
  cantidad_disenador_revision: number;
  created_at: string;
  updated_at: string | null;
  creador_id: number | null;
  creador_nombre: string | null;
}

export interface MuestraCreate {
  work_order_id: number;
  sala_corte_id?: number;
  cad_id?: number;
  carton_id?: number;
  observacion_muestra?: string;
  vendedor_nombre?: string;
  vendedor_direccion?: string;
  vendedor_ciudad?: string;
  vendedor_ciudad_flete_id?: number;
  vendedor_check?: number;
  cantidad_vendedor?: number;
  disenador_nombre?: string;
  disenador_direccion?: string;
  disenador_ciudad?: string;
  disenador_ciudad_flete_id?: number;
  disenador_check?: number;
  cantidad_disenador?: number;
  laboratorio_check?: number;
  cantidad_laboratorio?: number;
  cliente_check?: number;
  cantidad_cliente?: number;
  disenador_revision_nombre?: string;
  disenador_revision_direccion?: string;
  disenador_revision_check?: number;
  cantidad_disenador_revision?: number;
}

export interface MuestraCreateResponse {
  id: number;
  message: string;
}

export interface MuestraActionResponse {
  id: number;
  message: string;
  nuevo_estado: string;
}

export interface MuestraUpdate {
  cad?: string;
  cad_id?: number;
  carton_id?: number;
  carton_muestra_id?: number;
  pegado_id?: number;
  tiempo_unitario?: string;
  cantidad_vendedor?: number;
  cantidad_disenador?: number;
  cantidad_laboratorio?: number;
  cantidad_disenador_revision?: number;
  cantidad_1?: number;
  sala_corte_vendedor?: number;
  sala_corte_disenador?: number;
  sala_corte_laboratorio?: number;
  sala_corte_disenador_revision?: number;
  sala_corte_1?: number;
}

export interface MuestraUpdateResponse {
  id: number;
  message: string;
}

export interface MuestraOptions {
  salas_corte: Array<{ id: number; nombre: string }>;
  cads: Array<{ id: number; codigo: string }>;
  cartones: Array<{ id: number; codigo: string }>;
  ciudades_flete: Array<{ id: number; nombre: string }>;
  pegados: Array<{ id: number; nombre: string }>;
}

// Muestras API
export const muestrasApi = {
  /**
   * Lista muestras de una OT
   */
  listByOT: async (otId: number): Promise<MuestraListResponse> => {
    const response = await api.get<MuestraListResponse>(`/muestras/ot/${otId}`);
    return response.data;
  },

  /**
   * Obtiene opciones para el formulario de muestras
   */
  getOptions: async (): Promise<MuestraOptions> => {
    const response = await api.get<MuestraOptions>('/muestras/options');
    return response.data;
  },

  /**
   * Obtiene detalle de una muestra
   */
  get: async (id: number): Promise<MuestraDetalle> => {
    const response = await api.get<MuestraDetalle>(`/muestras/${id}`);
    return response.data;
  },

  /**
   * Crea una nueva muestra
   */
  create: async (data: MuestraCreate): Promise<MuestraCreateResponse> => {
    const response = await api.post<MuestraCreateResponse>('/muestras/', data);
    return response.data;
  },

  /**
   * Actualiza una muestra existente
   */
  update: async (id: number, data: MuestraUpdate): Promise<MuestraUpdateResponse> => {
    const response = await api.put<MuestraUpdateResponse>(`/muestras/${id}`, data);
    return response.data;
  },

  /**
   * Terminar muestra (estado 3)
   */
  terminar: async (id: number): Promise<MuestraActionResponse> => {
    const response = await api.put<MuestraActionResponse>(`/muestras/${id}/terminar`);
    return response.data;
  },

  /**
   * Rechazar muestra (estado 2)
   */
  rechazar: async (id: number, observacion?: string): Promise<MuestraActionResponse> => {
    const response = await api.put<MuestraActionResponse>(`/muestras/${id}/rechazar`, { observacion });
    return response.data;
  },

  /**
   * Anular muestra (estado 4)
   */
  anular: async (id: number): Promise<MuestraActionResponse> => {
    const response = await api.put<MuestraActionResponse>(`/muestras/${id}/anular`);
    return response.data;
  },

  /**
   * Devolver muestra (estado 5)
   */
  devolver: async (id: number, observacion?: string): Promise<MuestraActionResponse> => {
    const response = await api.put<MuestraActionResponse>(`/muestras/${id}/devolver`, { observacion });
    return response.data;
  },

  /**
   * Alternar prioridad de muestra
   */
  togglePrioritaria: async (id: number): Promise<MuestraActionResponse> => {
    const response = await api.put<MuestraActionResponse>(`/muestras/${id}/prioritaria`);
    return response.data;
  },

  /**
   * Eliminar muestra (solo si está sin asignar)
   */
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/muestras/${id}`);
    return response.data;
  },

  /**
   * Asignar sala de corte (estado 6)
   */
  asignarSalaCorte: async (id: number, salaCorteId: number): Promise<MuestraActionResponse> => {
    const response = await api.put<MuestraActionResponse>(`/muestras/${id}/sala-corte?sala_corte_id=${salaCorteId}`);
    return response.data;
  },

  /**
   * Iniciar proceso (estado 1)
   */
  iniciarProceso: async (id: number): Promise<MuestraActionResponse> => {
    const response = await api.put<MuestraActionResponse>(`/muestras/${id}/en-proceso`);
    return response.data;
  },
};


// ============================================
// CARGA MASIVA COTIZADOR API - FASE 6.27
// ============================================

export interface TablaCotizador {
  key: string;
  nombre: string;
  columnas: string[];
}

export interface BulkResultItem {
  linea: number;
  [key: string]: unknown;
}

export interface BulkErrorItem {
  linea: number;
  errores: string[];
  datos: Record<string, unknown>;
}

export interface BulkResult {
  total_filas: number;
  insertados: number;
  actualizados: number;
  errores: number;
  items_nuevos: BulkResultItem[];
  items_actualizados: BulkResultItem[];
  items_error: BulkErrorItem[];
}

export const bulkCotizadorApi = {
  /**
   * Lista las tablas disponibles para carga masiva
   */
  getTablas: async (): Promise<TablaCotizador[]> => {
    const response = await api.get<TablaCotizador[]>('/bulk-cotizador/tablas');
    return response.data;
  },

  /**
   * Descarga plantilla Excel para una tabla
   */
  downloadPlantilla: async (tablaKey: string): Promise<void> => {
    const response = await api.get(`/bulk-cotizador/plantilla/${tablaKey}`, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `plantilla_${tablaKey}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Carga archivo Excel para una tabla
   * modo='preview' para validar sin guardar
   * modo='ejecutar' para guardar los cambios
   */
  cargarArchivo: async (tablaKey: string, archivo: File, modo: 'preview' | 'ejecutar' = 'preview'): Promise<BulkResult> => {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const response = await api.post<BulkResult>(`/bulk-cotizador/cargar/${tablaKey}?modo=${modo}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Descarga datos actuales de una tabla en Excel
   */
  downloadDatosActuales: async (tablaKey: string): Promise<void> => {
    const response = await api.get(`/bulk-cotizador/descargar/${tablaKey}`, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const contentDisposition = response.headers['content-disposition'];
    let filename = `${tablaKey}.xlsx`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename=(.+)/);
      if (match) filename = match[1];
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// ============================================================================
// API MOBILE - FASE 6.29
// Endpoints optimizados para aplicaciones moviles
// ============================================================================

export interface MobileOT {
  id: number;
  item: string | null;
  cliente_id: number;
  cliente: string;
  descripcion: string | null;
  area: string | null;
  area_abreviatura: string | null;
  estado: string;
  dias_area_actual: number;
  created_at: string;
  tiempos?: {
    venta: number;
    desarrollo: number;
    diseno: number;
    catalogacion: number;
    precatalogacion: number;
  };
}

export interface MobileArea {
  id: number;
  nombre: string;
  abreviatura: string | null;
}

export interface MobileEstado {
  id: number;
  nombre: string;
  abreviatura: string | null;
}

export interface ListaOTsResponse {
  code: string;
  message: string;
  data: {
    ots: MobileOT[];
    areas: MobileArea[];
    estados: MobileEstado[];
  };
}

export interface MobileGestion {
  id: number;
  tipo_gestion: string;
  observacion: string | null;
  area: string;
  usuario: string;
  fecha: string;
  archivos_subidos: number;
  color: string;
  nuevo_estado?: string;
  area_consultada?: string;
  estado_consulta?: string;
  respuesta?: string;
  usuario_respuesta?: string;
  fecha_respuesta?: string;
  responder?: boolean;
}

export interface HistorialOTResponse {
  code: string;
  message: string;
  data: {
    gestiones: MobileGestion[];
    estados: Record<number, string>;
    puede_gestionar: boolean;
  };
}

export interface GuardarGestionRequest {
  ot_id: number;
  observacion: string;
  state_id?: number;
  area_id?: number;
}

export interface MobileResumen {
  code: string;
  data: {
    estadisticas: {
      total: number;
      en_ventas: number;
      en_desarrollo: number;
      en_diseno: number;
      en_catalogacion: number;
    };
    ots_recientes: Array<{
      id: number;
      cliente: string;
      descripcion: string;
      area: string;
    }>;
    notificaciones_pendientes: number;
  };
}

export interface MobileNotificacion {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  ot_id: number;
  ot_descripcion: string;
  fecha: string;
}

export const mobileApi = {
  /**
   * Lista OTs del vendedor autenticado (para mobile)
   */
  listarOrdenesOT: async (): Promise<ListaOTsResponse> => {
    const response = await api.get<ListaOTsResponse>('/mobile/listar-ordenes-ot');
    return response.data;
  },

  /**
   * Obtiene detalle de una OT
   */
  obtenerDetallesOT: async (otId: number): Promise<{ code: string; message: string; data: Record<string, unknown> }> => {
    const response = await api.post('/mobile/obtener-detalles-ot', null, {
      params: { ot_id: otId }
    });
    return response.data;
  },

  /**
   * Obtiene historial/gestiones de una OT
   */
  obtenerHistoricoOT: async (otId: number): Promise<HistorialOTResponse> => {
    const response = await api.post<HistorialOTResponse>('/mobile/obtener-historico-ot', null, {
      params: { ot_id: otId }
    });
    return response.data;
  },

  /**
   * Guarda una gestion (cambio estado o consulta)
   */
  guardarGestionOT: async (request: GuardarGestionRequest): Promise<{ code: string; message: string; data: MobileGestion }> => {
    const response = await api.post('/mobile/guardar-gestion-ot', request);
    return response.data;
  },

  /**
   * Guarda respuesta a una consulta
   */
  guardarRespuesta: async (gestionId: number, observacion: string): Promise<{ code: string; message: string }> => {
    const response = await api.post('/mobile/guardar-respuesta', {
      gestion_id: gestionId,
      observacion
    });
    return response.data;
  },

  /**
   * Actualiza token push notification
   */
  actualizarTokenPush: async (token: string): Promise<{ code: string; message: string }> => {
    const response = await api.post('/mobile/actualizar-token-notificacion', {
      token_push_mobile: token
    });
    return response.data;
  },

  /**
   * Lista materiales por RUT de clientes
   */
  listarMaterialesCliente: async (rutClientes: string[]): Promise<{ code: string; data: unknown[] }> => {
    const response = await api.post('/mobile/listar-materiales-cliente', rutClientes);
    return response.data;
  },

  /**
   * Lista materiales con jerarquia
   */
  listarMaterialesJerarquia: async (codigos: string[]): Promise<{ code: string; data: Record<string, { material_descripcion: string; material_jerarquia: string }> }> => {
    const response = await api.post('/mobile/listar-materiales-jerarquia', codigos);
    return response.data;
  },

  /**
   * Lista jerarquias con sub-jerarquias
   */
  listarJerarquias: async (): Promise<{ code: string; data: Record<string, string[]> }> => {
    const response = await api.get('/mobile/listar-jerarquias');
    return response.data;
  },

  /**
   * Resumen rapido para dashboard mobile
   */
  resumenVendedor: async (): Promise<MobileResumen> => {
    const response = await api.get<MobileResumen>('/mobile/resumen-vendedor');
    return response.data;
  },

  /**
   * Lista notificaciones para mobile
   */
  listarNotificaciones: async (limit: number = 20): Promise<{ code: string; data: MobileNotificacion[] }> => {
    const response = await api.get('/mobile/notificaciones', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Marca notificacion como leida
   */
  marcarNotificacionLeida: async (notifId: number): Promise<{ code: string; message: string }> => {
    const response = await api.put(`/mobile/notificaciones/${notifId}/leer`);
    return response.data;
  },
};

// ============================================================================
// OPCIONES FORMULARIO OT COMPLETO - FASE 6.30
// Todos los catálogos necesarios para el formulario de crear/editar OT
// ============================================================================

export interface CatalogOption {
  id: number | string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  planta_id?: number;
}

export interface HierarchyOption extends CatalogOption {
  hierarchy_id?: number;
  subhierarchy_id?: number;
}

export interface ClientOption {
  id: number;
  nombre: string;
  codigo?: string;
  nombre_sap?: string;
  rut?: string;
}

export interface FormOptionsComplete {
  // Catálogos principales
  clients: ClientOption[];
  canals: CatalogOption[];
  vendedores: CatalogOption[];
  org_ventas: CatalogOption[];
  plantas: CatalogOption[];
  // Catálogos de producto
  product_types: CatalogOption[];
  cads: CatalogOption[];
  cartons: CatalogOption[];
  styles: CatalogOption[];
  colors: CatalogOption[];
  envases: CatalogOption[];
  // Catálogos de procesos
  processes: CatalogOption[];
  armados: CatalogOption[];
  impresiones: CatalogOption[];
  fsc: CatalogOption[];
  // Catálogos de materiales
  materials: CatalogOption[];
  recubrimientos: CatalogOption[];
  coverages_internal: CatalogOption[];
  coverages_external: CatalogOption[];
  // Catálogos de referencia
  reference_types: CatalogOption[];
  design_types: CatalogOption[];
  bloqueo_referencia: CatalogOption[];  // Hardcoded: Si/No
  indicador_facturacion: CatalogOption[];  // Hardcoded: RRP, E-Commerce, etc.
  // Catálogos de calidad
  trazabilidad: CatalogOption[];
  tipo_cinta: CatalogOption[];
  pallet_types: CatalogOption[];
  salas_corte: CatalogOption[];
  // Jerarquías
  hierarchies: CatalogOption[];
  subhierarchies: HierarchyOption[];
  subsubhierarchies: HierarchyOption[];
  // Otros
  tipos_solicitud: CatalogOption[];
  maquila_servicios: CatalogOption[];
  comunas: CatalogOption[];
  pais_referencia: CatalogOption[];
  secuencia_operacional: CatalogOption[];
  // Sección 13 - Datos para Desarrollo
  food_types: CatalogOption[];
  expected_uses: CatalogOption[];
  recycled_uses: CatalogOption[];
  class_substance_packeds: CatalogOption[];
  transportation_ways: CatalogOption[];
  target_markets: CatalogOption[];
  // Catálogos adicionales
  pegados: CatalogOption[];
  sentidos_armado: CatalogOption[];
  product_type_developing: CatalogOption[];
  // Sección 7 - Calidad adicionales
  pallet_qas: CatalogOption[];  // Certificado de Calidad
  pallet_tag_formats: CatalogOption[];  // Formato Etiqueta Pallet
  matrices: CatalogOption[];  // Matrices para Sección 7
  // Opciones para Muestras
  tipos_pegado_muestra: CatalogOption[];
  cartons_muestra: CatalogOption[];
  destinatarios_muestra: CatalogOption[];
}

export interface DuplicateOTResponse {
  id: number;
  original_id: number;
  message: string;
}

// Extender workOrdersApi con nuevos métodos
export const workOrdersApiExtended = {
  ...workOrdersApi,

  /**
   * Obtiene TODAS las opciones necesarias para el formulario de crear/editar OT
   */
  getFormOptionsComplete: async (): Promise<FormOptionsComplete> => {
    const response = await api.get<FormOptionsComplete>('/work-orders/form-options-complete');
    return response.data;
  },

  /**
   * Duplica una OT existente
   */
  duplicate: async (otId: number): Promise<DuplicateOTResponse> => {
    const response = await api.post<DuplicateOTResponse>(`/work-orders/${otId}/duplicate`);
    return response.data;
  },
};

// ============================================================================
// EMAIL API - FASE 6.33
// Sistema de envio de correos electronicos
// ============================================================================

export interface EmailResponse {
  success: boolean;
  message: string;
}

export interface PasswordRecoveryRequest {
  rut: string;
}

export interface OTNotificationRequest {
  ot_id: number;
  user_email: string;
  message: string;
  sender_name: string;
  subject?: string;
}

export interface TestEmailRequest {
  to_email: string;
}

export const emailsApi = {
  /**
   * Solicita recuperacion de contrasena
   */
  requestPasswordRecovery: async (rut: string): Promise<EmailResponse> => {
    const response = await api.post<EmailResponse>('/emails/password-recovery', { rut });
    return response.data;
  },

  /**
   * Envia notificacion de OT por email
   */
  sendOTNotification: async (data: OTNotificationRequest): Promise<EmailResponse> => {
    const response = await api.post<EmailResponse>('/emails/notify-ot', data);
    return response.data;
  },

  /**
   * Envia email de prueba para verificar SMTP
   */
  testEmail: async (to_email: string): Promise<EmailResponse> => {
    const response = await api.post<EmailResponse>('/emails/test', { to_email });
    return response.data;
  },

  /**
   * Notifica cotizaciones pendientes (para scheduler)
   */
  notifyPendingQuotations: async (): Promise<EmailResponse> => {
    const response = await api.get<EmailResponse>('/emails/pending-quotations');
    return response.data;
  },

  /**
   * Envia recordatorio de matrices (para scheduler)
   */
  sendMatrixReminder: async (): Promise<EmailResponse> => {
    const response = await api.get<EmailResponse>('/emails/matrix-reminder');
    return response.data;
  },

  /**
   * Notifica nuevo cliente al admin
   */
  notifyNewClient: async (clientId: number): Promise<EmailResponse> => {
    const response = await api.post<EmailResponse>(`/emails/notify-new-client?client_id=${clientId}`);
    return response.data;
  },

  /**
   * Alerta de cotizacion con margen negativo
   */
  notifyNegativeMargin: async (quotationId: number): Promise<EmailResponse> => {
    const response = await api.post<EmailResponse>(`/emails/notify-negative-margin/${quotationId}`);
    return response.data;
  },
};

// ============================================================================
// MATERIALES API - FASE 6.34
// Gestion de materiales y CAD
// ============================================================================

export interface MaterialItem {
  id: number;
  codigo: string;
  descripcion: string | null;
  client_id: number | null;
  cliente_nombre: string | null;
  cad_id: number | null;
  cad_codigo: string | null;
  active: number;
  created_at: string | null;
}

export interface MaterialListResponse {
  items: MaterialItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MaterialDetail extends MaterialItem {
  updated_at: string | null;
}

export interface MaterialCreate {
  codigo: string;
  descripcion?: string;
  client_id?: number;
  cad_id?: number;
}

export interface MaterialUpdate {
  codigo?: string;
  descripcion?: string;
  client_id?: number;
  cad_id?: number;
}

export interface MaterialFilters {
  page?: number;
  page_size?: number;
  search?: string;
  client_id?: number;
  cad_id?: number;
  active?: number;
}

export interface CADItem {
  id: number;
  codigo: string;
  descripcion: string | null;
  client_id: number | null;
  cliente_nombre: string | null;
}

export interface CADAssignRequest {
  ot_id: number;
  cad_id: number;
}

export interface CADAssignResponse {
  success: boolean;
  message: string;
  ot_id: number;
  cad_id: number;
}

export const materialsApi = {
  /**
   * Lista materiales con filtros y paginacion
   */
  list: async (filters: MaterialFilters = {}): Promise<MaterialListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.client_id) params.append('client_id', filters.client_id.toString());
    if (filters.cad_id) params.append('cad_id', filters.cad_id.toString());
    if (filters.active !== undefined) params.append('active', filters.active.toString());

    const response = await api.get<MaterialListResponse>(`/materials/?${params.toString()}`);
    return response.data;
  },

  /**
   * Busqueda rapida de materiales
   */
  search: async (query: string, limit: number = 20): Promise<MaterialItem[]> => {
    const response = await api.get<MaterialItem[]>(`/materials/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  /**
   * Obtiene detalle de un material
   */
  get: async (id: number): Promise<MaterialDetail> => {
    const response = await api.get<MaterialDetail>(`/materials/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo material
   */
  create: async (data: MaterialCreate): Promise<MaterialDetail> => {
    const response = await api.post<MaterialDetail>('/materials/', data);
    return response.data;
  },

  /**
   * Actualiza un material
   */
  update: async (id: number, data: MaterialUpdate): Promise<MaterialDetail> => {
    const response = await api.put<MaterialDetail>(`/materials/${id}`, data);
    return response.data;
  },

  /**
   * Lista CADs disponibles
   */
  listCADs: async (search?: string, limit: number = 50): Promise<CADItem[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit.toString());

    const response = await api.get<CADItem[]>(`/materials/cads/list?${params.toString()}`);
    return response.data;
  },

  /**
   * Busqueda rapida de CADs
   */
  searchCADs: async (query: string, limit: number = 20): Promise<CADItem[]> => {
    const response = await api.get<CADItem[]>(`/materials/cads/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  /**
   * Asigna CAD a una OT
   */
  assignCAD: async (data: CADAssignRequest): Promise<CADAssignResponse> => {
    const response = await api.post<CADAssignResponse>('/materials/assign-cad', data);
    return response.data;
  },

  /**
   * Obtiene material de una OT
   */
  getOTMaterial: async (otId: number): Promise<{ ot_id: number; material: MaterialItem | null }> => {
    const response = await api.get<{ ot_id: number; material: MaterialItem | null }>(`/materials/ot/${otId}/material`);
    return response.data;
  },
};

// ============================================================================
// UPLOADS API - FASE 6.34
// Subida de archivos de diseno
// ============================================================================

export type OTFileType = 'plano' | 'boceto' | 'ficha_tecnica' | 'correo_cliente' | 'speed' | 'otro' | 'oc' | 'licitacion' | 'vb_muestra' | 'vb_boceto';

export interface UploadResponse {
  success: boolean;
  message: string;
  file_id?: number;
  url?: string;
}

export interface OTFilesResponse {
  ot_id: number;
  plano_actual: string | null;
  boceto_actual: string | null;
  ficha_tecnica: string | null;
  correo_cliente: string | null;
  speed_file: string | null;
  otro_file: string | null;
  oc_file: string | null;
  licitacion_file: string | null;
  vb_muestra_file: string | null;
  vb_boceto_file: string | null;
}

export interface FileInfo {
  id: number;
  url: string;
  filename: string | null;
  peso: number;
  peso_readable: string | null;
  tipo: string;
  created_at: string | null;
}

export const uploadsApi = {
  /**
   * Sube un archivo de diseno para una OT
   */
  uploadOTFile: async (otId: number, file: File, fileType: OTFileType): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    const response = await api.post<UploadResponse>(`/uploads/ot/${otId}/file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Obtiene todos los archivos de diseno de una OT
   */
  getOTFiles: async (otId: number): Promise<OTFilesResponse> => {
    const response = await api.get<OTFilesResponse>(`/uploads/ot/${otId}/files`);
    return response.data;
  },

  /**
   * Elimina un archivo de diseno de una OT
   */
  deleteOTFile: async (otId: number, fileType: OTFileType): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/uploads/ot/${otId}/file/${fileType}`);
    return response.data;
  },

  /**
   * Sube un archivo a una gestion
   */
  uploadManagementFile: async (managementId: number, file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>(`/uploads/management/${managementId}/file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Lista archivos de una gestion
   */
  getManagementFiles: async (managementId: number): Promise<FileInfo[]> => {
    const response = await api.get<FileInfo[]>(`/uploads/management/${managementId}/files`);
    return response.data;
  },

  /**
   * Elimina un archivo por ID
   */
  deleteFile: async (fileId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/uploads/file/${fileId}`);
    return response.data;
  },

  /**
   * Obtiene URL de descarga de un archivo
   * Los archivos se sirven desde la ruta /uploads/ en el servidor
   */
  getFileUrl: (relativePath: string): string => {
    const baseUrl = api.defaults.baseURL?.replace('/api/v1', '') || '';
    return `${baseUrl}${relativePath}`;
  },
};

// ============================================================================
// ROLES API - FASE 6.35
// Gestion de roles y permisos del sistema
// ============================================================================

export interface RoleItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  users_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface RoleListResponse {
  items: RoleItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RoleCreate {
  nombre: string;
  descripcion?: string;
}

export interface RoleUpdate {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

export interface RoleFilters {
  page?: number;
  page_size?: number;
  search?: string;
  activo?: boolean;
}

export interface Permission {
  id: number;
  nombre: string;
  codigo: string;
  modulo: string;
  activo: boolean;
}

export interface RolePermissionsResponse {
  role_id: number;
  role_nombre: string;
  permissions: Permission[];
}

export const rolesApi = {
  /**
   * Lista roles con paginacion y filtros
   */
  list: async (filters: RoleFilters = {}): Promise<RoleListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.activo !== undefined) params.append('activo', filters.activo.toString());

    const response = await api.get<RoleListResponse>(`/mantenedores/roles?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtiene detalle de un rol
   */
  get: async (id: number): Promise<RoleItem> => {
    const response = await api.get<RoleItem>(`/mantenedores/roles/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo rol
   */
  create: async (data: RoleCreate): Promise<RoleItem> => {
    const response = await api.post<RoleItem>('/mantenedores/roles', data);
    return response.data;
  },

  /**
   * Actualiza un rol existente
   */
  update: async (id: number, data: RoleUpdate): Promise<RoleItem> => {
    const response = await api.put<RoleItem>(`/mantenedores/roles/${id}`, data);
    return response.data;
  },

  /**
   * Elimina un rol (soft delete)
   */
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/mantenedores/roles/${id}`);
    return response.data;
  },

  /**
   * Obtiene permisos de un rol
   */
  getPermissions: async (id: number): Promise<RolePermissionsResponse> => {
    const response = await api.get<RolePermissionsResponse>(`/mantenedores/roles/${id}/permissions`);
    return response.data;
  },

  /**
   * Actualiza permisos de un rol
   */
  updatePermissions: async (id: number, permissionIds: number[]): Promise<{ message: string; permissions_count: number }> => {
    const response = await api.put<{ message: string; permissions_count: number }>(`/mantenedores/roles/${id}/permissions`, {
      permission_ids: permissionIds,
    });
    return response.data;
  },

  /**
   * Lista todos los permisos disponibles
   */
  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await api.get<Permission[]>('/mantenedores/roles/all/available-permissions');
    return response.data;
  },
};

export default api;
