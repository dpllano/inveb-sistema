/**
 * CotizacionForm Component
 * Formulario para crear/editar cotizaciones - Diseño Laravel
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DetalleForm from './DetalleForm';
import CargaMasivaDetallesModal from './CargaMasivaDetallesModal';
import SearchableSelect from '../../components/SearchableSelect';
import {
  cotizacionesApi,
  cascadesApi,
  clientsApi,
  authApi,
  type CotizacionCreate,
  type InstalacionOption,
  type ContactoOption,
  type CostosResumenResponse,
} from '../../services/api';

// Types for form options
interface ClientOption {
  id: number;
  nombre_sap: string;
  codigo?: string;
  rut?: string;
}

// === Styled Components - Diseño Laravel ===
const Container = styled.div`
  padding: 1.5rem;
  max-width: 100%;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
`;

const HeaderLeft = styled.div``;

const BackLink = styled.button`
  background: none;
  border: none;
  color: #17a2b8;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    text-decoration: underline;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 400;
  color: #333;
  margin: 0;
`;

// Pasos numerados a la derecha
const StepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
`;

const Step = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #666;
`;

const StepNumber = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #17a2b8;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
`;

// Cards
const FormCard = styled.div`
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 1.5rem;
`;

const CardHeader = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #ddd;
  background: #fafafa;
`;

const CardTitle = styled.h3`
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin: 0;
  letter-spacing: 0.5px;
`;

const CardBody = styled.div`
  padding: 1rem;
`;

// Formulario
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-size: 0.7rem;
  font-weight: 600;
  color: #17a2b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #17a2b8;
    box-shadow: 0 0 0 2px rgba(23, 162, 184, 0.15);
  }
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;

  &:focus {
    outline: none;
    border-color: #17a2b8;
    box-shadow: 0 0 0 2px rgba(23, 162, 184, 0.15);
  }

  &:disabled {
    background: #f5f5f5;
    color: #666;
  }
`;

// TextArea reserved for future use
// const TextArea = styled.textarea`
//   padding: 0.5rem;
//   border: 1px solid #ddd;
//   border-radius: 4px;
//   font-size: 0.85rem;
//   resize: vertical;
//   min-height: 80px;

//   &:focus {
//     outline: none;
//     border-color: #17a2b8;
//     box-shadow: 0 0 0 2px rgba(23, 162, 184, 0.15);
//   }
// `;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: #17a2b8;
`;

const HelpIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #17a2b8;
  color: white;
  font-size: 0.7rem;
  cursor: help;
`;

// Detalles
const DetallesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #ddd;
  background: #fafafa;
`;

const DetallesActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'success' | 'outline' | 'danger' }>`
  padding: 0.45rem 1rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
          color: white;
          border: none;
          &:hover { background: linear-gradient(135deg, #138496 0%, #117a8b 100%); }
        `;
      case 'success':
        return `
          background: linear-gradient(135deg, #28a745 0%, #218838 100%);
          color: white;
          border: none;
          &:hover { background: linear-gradient(135deg, #218838 0%, #1e7e34 100%); }
        `;
      case 'outline':
        return `
          background: white;
          color: #17a2b8;
          border: 1px solid #17a2b8;
          &:hover { background: #f0f9fa; }
        `;
      case 'danger':
        return `
          background: #dc3545;
          color: white;
          border: none;
          &:hover { background: #c82333; }
        `;
      default:
        return `
          background: #f0f0f0;
          color: #333;
          border: 1px solid #ddd;
          &:hover { background: #e0e0e0; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Tabla de detalles
const DetallesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
`;

const Th = styled.th`
  background: linear-gradient(135deg, #343a40 0%, #23272b 100%);
  color: white;
  padding: 0.6rem 0.4rem;
  text-align: center;
  font-weight: 500;
  font-size: 0.7rem;
  white-space: nowrap;
  border: none;
`;

const Td = styled.td`
  padding: 0.5rem 0.4rem;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
  text-align: center;
  font-size: 0.8rem;
  color: #333;
`;

const Tr = styled.tr`
  &:hover {
    background: #f8f9fa;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

// Secciones adicionales
const MonedaSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
`;

const MonedaGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MonedaLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #17a2b8;
  text-transform: uppercase;
`;

const MonedaSelect = styled.select`
  padding: 0.4rem 0.75rem;
  border: none;
  border-bottom: 1px solid #17a2b8;
  font-size: 0.85rem;
  background: transparent;
  color: #333;

  &:focus {
    outline: none;
    border-bottom-color: #138496;
  }
`;

const MonedaInput = styled.input`
  padding: 0.4rem 0.5rem;
  border: none;
  border-bottom: 1px solid #17a2b8;
  font-size: 0.85rem;
  width: 80px;
  background: transparent;

  &:focus {
    outline: none;
    border-bottom-color: #138496;
  }
`;

const SmallNote = styled.span`
  font-size: 0.7rem;
  color: #666;
`;

// Observaciones
const ObservacionesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ObservacionCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const ObservacionHeader = styled.div`
  padding: 0.5rem 0.75rem;
  background: #fafafa;
  border-bottom: 1px solid #ddd;
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
`;

const ObservacionBody = styled.div`
  padding: 0;
`;

const ObservacionTextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  border: none;
  font-size: 0.85rem;
  resize: vertical;

  &:focus {
    outline: none;
  }
`;

// Warnings
const WarningMessage = styled.div`
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 1rem;
`;

// Footer
const FormFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const Alert = styled.div<{ $type: 'success' | 'error' }>`
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.875rem;

  ${props => props.$type === 'success' && `
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  `}

  ${props => props.$type === 'error' && `
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  `}
`;

const IconButton = styled.button<{ $color?: string }>`
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  background: ${props => props.$color || '#6c757d'};
  color: white;
  margin: 0 2px;

  &:hover {
    opacity: 0.85;
  }
`;

// === Cost Summary Styled Components ===
const CostSummarySection = styled.div`
  margin-top: 2rem;
  border-top: 2px solid #28a745;
  padding-top: 1rem;
`;

const CostSummaryTitle = styled.h1`
  font-size: 1.3rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 1.5rem;
`;

const CostCard = styled.div`
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const CostCardHeader = styled.div`
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
`;

const CostCardBody = styled.div`
  padding: 0;
`;

const CostTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;

  th, td {
    border: 1px solid #dee2e6;
    padding: 0.4rem 0.5rem;
    text-align: left;
  }

  th {
    background: #f8f9fa;
    font-weight: 600;
    color: #495057;
    white-space: nowrap;
  }

  td {
    vertical-align: middle;
  }

  tbody tr:hover {
    background: #f1f3f5;
  }
`;

const ApprovalButtonSection = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const ApprovalButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #218838;
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

// === Types ===
interface DetalleDisplay {
  id?: number;
  numero: number;
  descripcion: string;
  cad_id: number | null;
  cad_nombre: string;
  tipo_producto_id: number | null;
  tipo_producto_nombre: string;
  cantidad: number;
  area: number;
  carton_id: number | null;
  carton_nombre: string;
  item: string;
  proceso_id: number | null;
  proceso_nombre: string;
  colores: number;
  pct_impresion: number;
  pct_cobertura: number;
  matriz: string;
  clisse: string;
  royalty: number;
  maquila: number;
  armado: string;
  ot_id: number | null;
  muestra: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DetalleFormData = Record<string, any>;

interface CotizacionFormData {
  cliente_id: number | null;
  instalacion_id: number | null;
  contacto_id: number | null;
  nombre_contacto: string;
  email_contacto: string;
  telefono_contacto: string;
  clasificacion_id: number | null;
  moneda_id: number;
  dias_pago: number;
  comision: number;
  observacion_interna: string;
  observacion_cliente: string;
  detalles: DetalleDisplay[];
  detallesData: DetalleFormData[];  // Datos originales del formulario para enviar al API
}

interface CotizacionFormProps {
  cotizacionId?: number;
  onNavigate: (page: string, id?: number) => void;
  isExterno?: boolean;
}

// Monedas hardcoded (standard options)
const MONEDAS = [
  { id: 1, codigo: 'USD', nombre: 'Dolar' },
  { id: 2, codigo: 'CLP', nombre: 'Peso Chileno' },
];

// === Component ===
export default function CotizacionForm({ cotizacionId, onNavigate, isExterno = false }: CotizacionFormProps) {
  const isEditing = !!cotizacionId;
  const listPage = isExterno ? 'cotizador-externo' : 'cotizaciones';
  const queryClient = useQueryClient();  // Sprint N: Para refrescar detalles

  // Form state
  const [formData, setFormData] = useState<CotizacionFormData>({
    cliente_id: null,
    instalacion_id: null,
    contacto_id: null,
    nombre_contacto: '',
    email_contacto: '',
    telefono_contacto: '',
    clasificacion_id: null,
    moneda_id: 1,
    dias_pago: 0,
    comision: 2,
    observacion_interna: '',
    observacion_cliente: '',
    detalles: [],
    detallesData: [],
  });

  const [useCustomContact, setUseCustomContact] = useState(true);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showCargaMasivaModal, setShowCargaMasivaModal] = useState(false);  // Sprint N
  const [editingDetalle, setEditingDetalle] = useState<DetalleDisplay | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAreaEstimada] = useState(false);
  const [hasCartonEstimado] = useState(false);

  // Cost summary state
  const [showCostSummary, setShowCostSummary] = useState(false);
  const [costData, setCostData] = useState<CostosResumenResponse | null>(null);
  const [isLoadingCosts, setIsLoadingCosts] = useState(false);

  // ========== API Data Fetching ==========

  // Fetch clients list
  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients-for-cotizacion'],
    queryFn: async () => {
      const response = await clientsApi.list({ page_size: 2000, activo: true });
      return response.items as ClientOption[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sort clients by codigo numerically (like Laravel)
  const clientes = useMemo(() => {
    const data = clientsData || [];
    return [...data].sort((a, b) => {
      const codigoA = a.codigo ? parseInt(a.codigo, 10) : Infinity;
      const codigoB = b.codigo ? parseInt(b.codigo, 10) : Infinity;
      if (isNaN(codigoA) && isNaN(codigoB)) return 0;
      if (isNaN(codigoA)) return 1;
      if (isNaN(codigoB)) return -1;
      return codigoA - codigoB;
    });
  }, [clientsData]);

  // Fetch instalaciones when client is selected (incluye clasificación del cliente)
  const { data: instalacionesData, isLoading: isLoadingInstalaciones } = useQuery({
    queryKey: ['instalaciones-cotiza', formData.cliente_id],
    queryFn: async () => {
      if (!formData.cliente_id) return { instalaciones: [], clasificacion_id: null };
      return cascadesApi.getInstalacionesClienteCotiza(formData.cliente_id);
    },
    enabled: !!formData.cliente_id,
  });

  const instalaciones: InstalacionOption[] = instalacionesData?.instalaciones || [];

  // Fetch contactos when installation is selected
  const { data: contactosData, isLoading: isLoadingContactos } = useQuery({
    queryKey: ['contactos', formData.cliente_id, formData.instalacion_id],
    queryFn: async () => {
      if (!formData.cliente_id) return [];
      return cascadesApi.getContactosCliente(formData.cliente_id, formData.instalacion_id || undefined);
    },
    enabled: !!formData.cliente_id,
  });

  const contactos: ContactoOption[] = contactosData || [];

  // Load existing cotizacion
  useEffect(() => {
    if (cotizacionId) {
      console.log('Loading cotizacion:', cotizacionId);
      // TODO: Fetch existing cotizacion and populate form
    }
  }, [cotizacionId]);

  // Update clasificacion when client changes
  useEffect(() => {
    if (instalacionesData?.clasificacion_id && !formData.clasificacion_id) {
      setFormData(prev => ({
        ...prev,
        clasificacion_id: instalacionesData.clasificacion_id || null,
      }));
    }
  }, [instalacionesData, formData.clasificacion_id]);

  // Load existing cotizacion data when editing
  useEffect(() => {
    if (!isEditing || !cotizacionId) return;

    const loadCotizacion = async () => {
      try {
        const cotizacion = await cotizacionesApi.get(cotizacionId);
        console.log('Loaded cotizacion:', cotizacion);

        // Map detalles to DetalleDisplay format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detallesDisplay: DetalleDisplay[] = (cotizacion.detalles || []).map((d: any, idx: number) => ({
          id: d.id,
          numero: idx + 1,
          descripcion: d.descripcion_material_detalle || `Detalle ${idx + 1}`,
          cad_id: d.cad_material_id || null,
          cad_nombre: d.cad_material_detalle || '-',
          tipo_producto_id: d.tipo_detalle_id,
          tipo_producto_nombre: d.tipo_detalle_id === 1 ? 'Corrugado' : 'Esquinero',
          cantidad: d.cantidad || 0,
          area: d.area_hc ? parseFloat(String(d.area_hc)) : 0,
          carton_id: d.carton_id || null,
          carton_nombre: d.carton_codigo || (d.carton_id ? `Carton ${d.carton_id}` : '-'),
          item: '-',
          proceso_id: d.process_id || null,
          proceso_nombre: d.proceso_nombre || '-',
          colores: d.numero_colores || 0,
          pct_impresion: Number(d.impresion) || 0,
          pct_cobertura: 0,
          matriz: d.matriz ? 'Si' : '-',
          clisse: d.clisse ? 'Si' : '-',
          royalty: d.royalty || 0,
          maquila: d.maquila || 0,
          armado: d.armado_automatico ? 'Auto' : '-',
          ot_id: d.work_order_id || null,
          muestra: false,
        }));

        setFormData(prev => ({
          ...prev,
          cliente_id: cotizacion.client_id,
          nombre_contacto: cotizacion.nombre_contacto || '',
          email_contacto: cotizacion.email_contacto || '',
          telefono_contacto: cotizacion.telefono_contacto || '',
          moneda_id: cotizacion.moneda_id || 1,
          dias_pago: cotizacion.dias_pago || 0,
          comision: cotizacion.comision || 2,
          observacion_interna: cotizacion.observacion_interna || '',
          observacion_cliente: cotizacion.observacion_cliente || '',
          detalles: detallesDisplay,
          detallesData: cotizacion.detalles || [],
        }));
      } catch (error) {
        console.error('Error loading cotizacion:', error);
        setErrorMessage('Error al cargar la cotización');
      }
    };

    loadCotizacion();
  }, [isEditing, cotizacionId]);

  // Handlers
  const handleClienteChange = useCallback((clienteId: number | null) => {
    setFormData(prev => ({
      ...prev,
      cliente_id: clienteId,
      instalacion_id: null,
      contacto_id: null,
      nombre_contacto: '',
      email_contacto: '',
      telefono_contacto: '',
      clasificacion_id: null, // Will be set by useEffect when instalacionesData loads
    }));
  }, []);

  const handleInstalacionChange = useCallback((instalacionId: number | null) => {
    setFormData(prev => ({
      ...prev,
      instalacion_id: instalacionId,
      contacto_id: null,
      nombre_contacto: '',
      email_contacto: '',
      telefono_contacto: '',
    }));
  }, []);

  const handleContactoChange = useCallback((contactoId: number | null) => {
    const contacto = contactos.find(c => c.id === contactoId);

    setFormData(prev => ({
      ...prev,
      contacto_id: contactoId,
      nombre_contacto: contacto?.nombre || prev.nombre_contacto,
      email_contacto: contacto?.email || '',
      telefono_contacto: contacto?.telefono || '',
    }));
  }, [contactos]);

  const handleFieldChange = useCallback((field: keyof CotizacionFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAddDetalle = useCallback(() => {
    setEditingDetalle(null);
    setShowDetalleModal(true);
  }, []);

  const handleEditDetalle = useCallback((detalle: DetalleDisplay) => {
    setEditingDetalle(detalle);
    setShowDetalleModal(true);
  }, []);

  const handleDeleteDetalle = useCallback((index: number) => {
    if (!window.confirm('¿Está seguro de eliminar este detalle?')) return;
    setFormData(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index),
      detallesData: prev.detallesData.filter((_, i) => i !== index),
    }));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDetalleSubmit = useCallback((detalle: any) => {
    const newDetalle: DetalleDisplay = {
      numero: formData.detalles.length + 1,
      descripcion: detalle.descripcion || `Detalle ${formData.detalles.length + 1}`,
      cad_id: detalle.cad_id,
      cad_nombre: detalle.cad_id ? `CAD-${detalle.cad_id}` : '-',
      tipo_producto_id: detalle.tipo_detalle_id,
      tipo_producto_nombre: detalle.tipo_detalle_id === 1 ? 'Corrugado' : 'Esquinero',
      cantidad: detalle.cantidad || 0,
      area: detalle.area_hc || 0,
      carton_id: detalle.carton_id,
      carton_nombre: detalle.carton_id ? `Carton ${detalle.carton_id}` : '-',
      item: '-',
      proceso_id: detalle.process_id,
      proceso_nombre: detalle.process_id ? `Proceso ${detalle.process_id}` : '-',
      colores: detalle.colores || 0,
      pct_impresion: detalle.pct_impresion || 0,
      pct_cobertura: detalle.pct_cobertura || 0,
      matriz: '-',
      clisse: '-',
      royalty: 0,
      maquila: 0,
      armado: '-',
      ot_id: null,
      muestra: false,
    };

    setFormData(prev => {
      if (editingDetalle) {
        const index = prev.detalles.findIndex(d => d.numero === editingDetalle.numero);
        if (index >= 0) {
          const updatedDetalles = [...prev.detalles];
          updatedDetalles[index] = { ...newDetalle, numero: editingDetalle.numero };
          const updatedData = [...prev.detallesData];
          updatedData[index] = detalle;
          return { ...prev, detalles: updatedDetalles, detallesData: updatedData };
        }
      }
      return {
        ...prev,
        detalles: [...prev.detalles, newDetalle],
        detallesData: [...prev.detallesData, detalle]  // Guardar datos originales
      };
    });

    setShowDetalleModal(false);
    setEditingDetalle(null);
  }, [formData.detalles.length, editingDetalle]);

  const handleSave = useCallback(async () => {
    if (!formData.cliente_id) {
      setErrorMessage('Debe seleccionar un cliente');
      return;
    }

    // Get current user
    const currentUser = authApi.getStoredUser();
    if (!currentUser) {
      setErrorMessage('No hay usuario autenticado');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      // Prepare data for API
      const cotizacionData: CotizacionCreate = {
        client_id: formData.cliente_id,
        nombre_contacto: formData.nombre_contacto || undefined,
        email_contacto: formData.email_contacto || undefined,
        telefono_contacto: formData.telefono_contacto || undefined,
        moneda_id: formData.moneda_id || undefined,
        dias_pago: formData.dias_pago || undefined,
        comision: formData.comision || undefined,
        observacion_interna: formData.observacion_interna || undefined,
        observacion_cliente: formData.observacion_cliente || undefined,
        user_id: currentUser.id,
      };

      console.log('Saving cotizacion:', cotizacionData);

      let savedCotizacionId: number;

      if (isEditing && cotizacionId) {
        // Update existing cotizacion
        await cotizacionesApi.update(cotizacionId, cotizacionData);
        savedCotizacionId = cotizacionId;
        setSuccessMessage('Cotización actualizada correctamente');
      } else {
        // Create new cotizacion
        const result = await cotizacionesApi.create(cotizacionData);
        savedCotizacionId = result.id;
        console.log('Cotizacion created:', result);

        // Save detalles after cotizacion is created
        if (formData.detallesData.length > 0) {
          console.log(`Saving ${formData.detallesData.length} detalles...`);
          let detallesGuardados = 0;
          const erroresDetalles: string[] = [];

          for (const detalleData of formData.detallesData) {
            try {
              // Map form data to API format
              const detalleApi = {
                tipo_detalle_id: detalleData.tipo_detalle_id || 1,
                cantidad: detalleData.cantidad || 1,
                product_type_id: detalleData.product_type_id || 1,
                planta_id: detalleData.planta_id || 1,
                variable_cotizador_id: detalleData.variable_cotizador_id || 1,
                numero_colores: detalleData.numero_colores,
                largo: detalleData.largo,
                ancho: detalleData.ancho,
                alto: detalleData.alto,
                area_hc: detalleData.area_hc,
                anchura: detalleData.anchura,
                largura: detalleData.largura,
                carton_id: detalleData.carton_id,
                impresion: detalleData.impresion,
                golpes_largo: detalleData.golpes_largo,
                golpes_ancho: detalleData.golpes_ancho,
                process_id: detalleData.process_id,
                rubro_id: detalleData.rubro_id,
                printing_machine_id: detalleData.printing_machine_id,
                print_type_id: detalleData.print_type_id,
                ink_type_id: detalleData.ink_type_id,
                barniz_type_id: detalleData.barniz_type_id,
                pegado_id: detalleData.pegado_id,
                cinta_desgarro: detalleData.cinta_desgarro,
                matriz: detalleData.matriz,
                clisse: detalleData.clisse,
                royalty: detalleData.royalty,
                maquila: detalleData.maquila,
                maquila_servicio_id: detalleData.maquila_servicio_id,
                armado_automatico: detalleData.armado_automatico,
                armado_usd_caja: detalleData.armado_usd_caja,
                pallet: detalleData.pallet,
                pallet_height_id: detalleData.pallet_height_id,
                zuncho: detalleData.zuncho,
                funda: detalleData.funda,
                stretch_film: detalleData.stretch_film,
                ciudad_id: detalleData.ciudad_id,
                margen: detalleData.margen,
                descripcion_material_detalle: detalleData.descripcion_material_detalle,
                cad_material_id: detalleData.cad_material_id,
                largo_esquinero: detalleData.largo_esquinero,
                carton_esquinero_id: detalleData.carton_esquinero_id,
              };

              await cotizacionesApi.createDetalle(savedCotizacionId, detalleApi);
              detallesGuardados++;
            } catch (detalleError) {
              console.error('Error saving detalle:', detalleError);
              erroresDetalles.push(`Error en detalle ${detallesGuardados + 1}`);
            }
          }

          if (erroresDetalles.length > 0) {
            setSuccessMessage(`Pre-Cotización generada. ${detallesGuardados}/${formData.detallesData.length} detalles guardados.`);
          } else {
            setSuccessMessage(`Pre-Cotización generada con ${detallesGuardados} detalle(s)`);
          }
        } else {
          setSuccessMessage('Pre-Cotización generada correctamente');
        }
      }

      // Fetch cost summary data
      setIsLoadingCosts(true);
      try {
        const costsResponse = await cotizacionesApi.getCostosResumen(savedCotizacionId);
        setCostData(costsResponse);
        setShowCostSummary(true);
      } catch (costError) {
        console.error('Error fetching cost summary:', costError);
        // Still show success, just without cost data
      } finally {
        setIsLoadingCosts(false);
      }
    } catch (error) {
      console.error('Error saving cotizacion:', error);
      setErrorMessage('Error al guardar la cotización');
    } finally {
      setIsSaving(false);
    }
  }, [formData, isEditing, cotizacionId, onNavigate, listPage]);

  // Render detalle modal
  if (showDetalleModal) {
    return (
      <DetalleForm
        detalle={null}  // Always create new - editing from display to form conversion pending
        plantaId={1}
        onSubmit={handleDetalleSubmit}
        onCancel={() => {
          setShowDetalleModal(false);
          setEditingDetalle(null);
        }}
      />
    );
  }

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <BackLink onClick={() => onNavigate(listPage)}>
            &lt; Volver
          </BackLink>
          <Title>{isEditing ? `Editar Cotización #${cotizacionId}` : 'Ingreso Cotización'}</Title>
        </HeaderLeft>

        <StepsContainer>
          <Step>
            <span>Seleccionar Cliente</span>
            <StepNumber>1</StepNumber>
          </Step>
          <Step>
            <span>Agregar Detalles</span>
            <StepNumber>2</StepNumber>
          </Step>
          <Step>
            <span>Completar Cotización</span>
            <StepNumber>3</StepNumber>
          </Step>
          <Step>
            <span>Guardar Cotización</span>
            <StepNumber>4</StepNumber>
          </Step>
        </StepsContainer>
      </Header>

      {successMessage && <Alert $type="success">{successMessage}</Alert>}
      {errorMessage && <Alert $type="error">{errorMessage}</Alert>}

      {/* DATOS COMERCIALES */}
      <FormCard>
        <CardHeader>
          <CardTitle>Datos Comerciales</CardTitle>
        </CardHeader>
        <CardBody>
          <FormGrid>
            <FormGroup>
              <Label>Cliente</Label>
              <SearchableSelect
                options={clientes}
                value={formData.cliente_id}
                onChange={(value) => handleClienteChange(value as number | null)}
                getOptionValue={(c) => c.id}
                getOptionLabel={(c) => `${c.nombre_sap}${c.codigo ? ` - ${c.codigo}` : ''}`}
                placeholder="Seleccionar..."
                disabled={isLoadingClients}
                loading={isLoadingClients}
              />
            </FormGroup>

            <FormGroup>
              <Label>Instalación</Label>
              <Select
                value={formData.instalacion_id || ''}
                onChange={(e) => handleInstalacionChange(e.target.value ? Number(e.target.value) : null)}
                disabled={!formData.cliente_id || isLoadingInstalaciones}
              >
                <option value="">{isLoadingInstalaciones ? 'Cargando...' : '-'}</option>
                {instalaciones.map(i => (
                  <option key={i.id} value={i.id}>{i.nombre}</option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Contactos</Label>
              <Select
                value={formData.contacto_id || ''}
                onChange={(e) => handleContactoChange(e.target.value ? Number(e.target.value) : null)}
                disabled={!formData.cliente_id || isLoadingContactos}
              >
                <option value="">{isLoadingContactos ? 'Cargando...' : '-'}</option>
                {contactos.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Nombre:</Label>
              <CheckboxContainer>
                <Checkbox
                  type="checkbox"
                  checked={useCustomContact}
                  onChange={(e) => setUseCustomContact(e.target.checked)}
                />
                <Input
                  value={formData.nombre_contacto}
                  onChange={(e) => handleFieldChange('nombre_contacto', e.target.value)}
                  disabled={!useCustomContact}
                  placeholder="Nombre contacto"
                />
                <HelpIcon title="Puede ingresar nombre personalizado">?</HelpIcon>
              </CheckboxContainer>
            </FormGroup>
          </FormGrid>

          <FormRow>
            <FormGroup>
              <Label>Email:</Label>
              <Input
                value={formData.email_contacto}
                onChange={(e) => handleFieldChange('email_contacto', e.target.value)}
                disabled
              />
            </FormGroup>

            <FormGroup>
              <Label>Teléfono:</Label>
              <Input
                value={formData.telefono_contacto}
                onChange={(e) => handleFieldChange('telefono_contacto', e.target.value)}
                disabled
              />
            </FormGroup>

            <FormGroup>
              <Label>Clasificación</Label>
              <Select
                value={formData.clasificacion_id || ''}
                onChange={(e) => handleFieldChange('clasificacion_id', e.target.value ? Number(e.target.value) : null)}
                disabled={!!formData.cliente_id}
              >
                <option value="">-</option>
                {/* Solo mostrar la clasificación del cliente seleccionado (comportamiento Laravel) */}
                {instalacionesData?.clasificacion_id && (
                  <option value={instalacionesData.clasificacion_id}>
                    {instalacionesData.clasificacion_nombre || 'Sin clasificación'}
                  </option>
                )}
              </Select>
            </FormGroup>
          </FormRow>
        </CardBody>
      </FormCard>

      {/* DETALLES */}
      <FormCard>
        <DetallesHeader>
          <CardTitle>Detalles</CardTitle>
          <DetallesActions>
            <Button
              $variant="outline"
              onClick={() => setShowCargaMasivaModal(true)}
              disabled={!cotizacionId}
              title={!cotizacionId ? 'Guarde la cotización primero' : 'Cargar detalles desde Excel'}
            >
              Carga Masiva
            </Button>
            <Button $variant="success" onClick={handleAddDetalle}>
              Crear Detalle +
            </Button>
          </DetallesActions>
        </DetallesHeader>
        <CardBody style={{ padding: 0 }}>
          {formData.detalles.length === 0 ? (
            <EmptyState>
              <p>No hay detalles agregados</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Haga clic en "Crear Detalle +" para agregar items
              </p>
            </EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <DetallesTable>
                <thead>
                  <tr>
                    <Th>N°</Th>
                    <Th>Descrip.</Th>
                    <Th>CAD</Th>
                    <Th>Tipo Producto</Th>
                    <Th>Cantidad</Th>
                    <Th>Área</Th>
                    <Th>Cartón</Th>
                    <Th>Item</Th>
                    <Th>Proceso</Th>
                    <Th>Colores</Th>
                    <Th>% Impr.</Th>
                    <Th>%Cob.</Th>
                    <Th>Matriz</Th>
                    <Th>Clisse</Th>
                    <Th>Royalty</Th>
                    <Th>Maquila</Th>
                    <Th>Armado</Th>
                    <Th>OT</Th>
                    <Th></Th>
                    <Th>Acciones</Th>
                  </tr>
                </thead>
                <tbody>
                  {formData.detalles.map((detalle, index) => (
                    <Tr key={index}>
                      <Td>{detalle.numero}</Td>
                      <Td>{detalle.descripcion}</Td>
                      <Td>{detalle.cad_nombre}</Td>
                      <Td>{detalle.tipo_producto_nombre}</Td>
                      <Td>{detalle.cantidad.toLocaleString()}</Td>
                      <Td>{detalle.area.toFixed(2)}</Td>
                      <Td>{detalle.carton_nombre}</Td>
                      <Td>{detalle.item}</Td>
                      <Td>{detalle.proceso_nombre}</Td>
                      <Td>{detalle.colores}</Td>
                      <Td>{detalle.pct_impresion}%</Td>
                      <Td>{detalle.pct_cobertura}%</Td>
                      <Td>{detalle.matriz}</Td>
                      <Td>{detalle.clisse}</Td>
                      <Td>{detalle.royalty}</Td>
                      <Td>{detalle.maquila}</Td>
                      <Td>{detalle.armado}</Td>
                      <Td>{detalle.ot_id || '-'}</Td>
                      <Td>{detalle.muestra ? '🚩' : ''}</Td>
                      <Td>
                        <IconButton $color="#ffc107" onClick={() => handleEditDetalle(detalle)} title="Editar">
                          ✏️
                        </IconButton>
                        <IconButton $color="#dc3545" onClick={() => handleDeleteDetalle(index)} title="Eliminar">
                          🗑️
                        </IconButton>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </DetallesTable>
            </div>
          )}
        </CardBody>
      </FormCard>

      {/* MONEDA - DIAS PAGO - % COMISION */}
      <FormCard>
        <CardHeader>
          <CardTitle>Moneda - Días Pago - % Comisión</CardTitle>
        </CardHeader>
        <CardBody>
          <MonedaSection>
            <MonedaGroup>
              <MonedaLabel>Moneda</MonedaLabel>
              <MonedaSelect
                value={formData.moneda_id}
                onChange={(e) => handleFieldChange('moneda_id', Number(e.target.value))}
              >
                {MONEDAS.map(m => (
                  <option key={m.id} value={m.id}>{m.codigo}</option>
                ))}
              </MonedaSelect>
            </MonedaGroup>

            <MonedaGroup>
              <MonedaLabel>Días Pago</MonedaLabel>
              <MonedaSelect
                value={formData.dias_pago}
                onChange={(e) => handleFieldChange('dias_pago', Number(e.target.value))}
              >
                <option value="0">0</option>
                <option value="30">30</option>
                <option value="60">60</option>
                <option value="90">90</option>
              </MonedaSelect>
            </MonedaGroup>

            <MonedaGroup>
              <MonedaLabel>Comisión %:</MonedaLabel>
              <MonedaInput
                type="number"
                value={formData.comision}
                onChange={(e) => handleFieldChange('comision', Number(e.target.value))}
              />
              <SmallNote>*Solo para Exportacion</SmallNote>
            </MonedaGroup>
          </MonedaSection>
        </CardBody>
      </FormCard>

      {/* OBSERVACIONES */}
      <ObservacionesGrid>
        <ObservacionCard>
          <ObservacionHeader>Observación Interna</ObservacionHeader>
          <ObservacionBody>
            <ObservacionTextArea
              value={formData.observacion_interna}
              onChange={(e) => handleFieldChange('observacion_interna', e.target.value)}
              placeholder="Observaciones internas..."
            />
          </ObservacionBody>
        </ObservacionCard>

        <ObservacionCard>
          <ObservacionHeader>Observación Cliente</ObservacionHeader>
          <ObservacionBody>
            <ObservacionTextArea
              value={formData.observacion_cliente}
              onChange={(e) => handleFieldChange('observacion_cliente', e.target.value)}
              placeholder="Observaciones para el cliente..."
            />
          </ObservacionBody>
        </ObservacionCard>
      </ObservacionesGrid>

      {/* Warnings */}
      {(hasAreaEstimada || hasCartonEstimado) && (
        <>
          {hasAreaEstimada && (
            <WarningMessage>
              Recuerde que esta cotizacion contiene un Área Hoja Corrugada estimada, favor validar este dato con desarrollo
            </WarningMessage>
          )}
          {hasCartonEstimado && (
            <WarningMessage>
              Recuerde que esta cotizacion contiene un Cartón estimado, favor validar este dato con desarrollo
            </WarningMessage>
          )}
        </>
      )}

      {/* Footer - Generate Button */}
      {!showCostSummary && (
        <FormFooter>
          <Button onClick={() => onNavigate(listPage)}>
            Cancelar
          </Button>
          <Button $variant="success" onClick={handleSave} disabled={isSaving || isLoadingCosts}>
            {isSaving ? 'Guardando...' : isLoadingCosts ? 'Cargando...' : 'Generar Pre-Cotización'}
          </Button>
        </FormFooter>
      )}

      {/* ========== RESUMEN DE COSTOS SECTION ========== */}
      {showCostSummary && costData && (
        <CostSummarySection>
          <CostSummaryTitle>Resumen de Costos por producto</CostSummaryTitle>

          {/* Table 1: Parametros Por Producto */}
          <CostCard>
            <CostCardHeader>Parametros Por Producto</CostCardHeader>
            <CostCardBody>
              <CostTable>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>N°</th>
                    <th>Descripción</th>
                    <th>CAD</th>
                    <th>Planta</th>
                    <th>Tipo Producto</th>
                    <th>Item</th>
                    <th>Cartón</th>
                    <th>Flete</th>
                    <th>Margen Papeles (USD/Mm2)</th>
                    <th>Margen (USD/Mm2)</th>
                    <th>Margen MÍNIMO (USD/Mm2)</th>
                    <th>Precio (USD/Mm2)</th>
                    <th>Precio (USD/Ton)</th>
                    <th>Precio (USD/UN)</th>
                    <th>Precio ($/UN)</th>
                    <th>Cantidad</th>
                    <th>Precio Total (MUSD)</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.parametros_producto.length > 0 ? (
                    costData.parametros_producto.map((row) => (
                      <tr key={row.numero}>
                        <td>{row.numero}</td>
                        <td>{row.descripcion}</td>
                        <td>{row.cad}</td>
                        <td>{row.planta}</td>
                        <td>{row.tipo_producto}</td>
                        <td>{row.item}</td>
                        <td>{row.carton}</td>
                        <td>{row.flete}</td>
                        <td>{typeof row.margen_papeles === 'number' ? row.margen_papeles.toFixed(2) : row.margen_papeles}</td>
                        <td>{typeof row.margen === 'number' ? row.margen.toFixed(2) : row.margen}</td>
                        <td>{typeof row.margen_minimo === 'number' ? row.margen_minimo.toFixed(2) : row.margen_minimo}</td>
                        <td>{typeof row.precio_usd_mm2 === 'number' ? row.precio_usd_mm2.toFixed(2) : row.precio_usd_mm2}</td>
                        <td>{typeof row.precio_usd_ton === 'number' ? row.precio_usd_ton.toFixed(2) : row.precio_usd_ton}</td>
                        <td>{typeof row.precio_usd_un === 'number' ? row.precio_usd_un.toFixed(3) : row.precio_usd_un}</td>
                        <td>{typeof row.precio_clp_un === 'number' ? row.precio_clp_un.toFixed(2) : row.precio_clp_un}</td>
                        <td>{row.cantidad}</td>
                        <td>{typeof row.precio_total_musd === 'number' ? row.precio_total_musd.toFixed(3) : row.precio_total_musd}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={17} style={{ textAlign: 'center', color: '#666' }}>
                        Sin datos de costos calculados
                      </td>
                    </tr>
                  )}
                </tbody>
              </CostTable>
              <span style={{ color: '#025902', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                * En verde: Promedios ponderados por columna
              </span>
            </CostCardBody>
          </CostCard>

          {/* Table 2: Nuevos Detalles Cotizacion */}
          <CostCard>
            <CostCardHeader>Nuevos Detalles Cotizacion</CostCardHeader>
            <CostCardBody>
              <CostTable>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>N°</th>
                    <th>Descripción</th>
                    <th>CAD</th>
                    <th>Tipo Producto</th>
                    <th>Item</th>
                    <th>Cartón</th>
                    <th>MC (USD/Mm2)</th>
                    <th>Margen bruto sin flete (USD/Mm2)</th>
                    <th>Margen de servir (USD/Mm2)</th>
                    <th>Mg EBITDA (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.nuevos_detalles.length > 0 ? (
                    costData.nuevos_detalles.map((row) => (
                      <tr key={row.numero}>
                        <td>{row.numero}</td>
                        <td>{row.descripcion}</td>
                        <td>{row.cad}</td>
                        <td>{row.tipo_producto}</td>
                        <td>{row.item}</td>
                        <td>{row.carton}</td>
                        <td>{typeof row.mc_usd_mm2 === 'number' ? row.mc_usd_mm2.toFixed(2) : row.mc_usd_mm2}</td>
                        <td>{typeof row.margen_bruto_sin_flete === 'number' ? row.margen_bruto_sin_flete.toFixed(2) : row.margen_bruto_sin_flete}</td>
                        <td>{typeof row.margen_servir === 'number' ? row.margen_servir.toFixed(2) : row.margen_servir}</td>
                        <td>{typeof row.mg_ebitda === 'number' ? row.mg_ebitda.toFixed(2) : row.mg_ebitda}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', color: '#666' }}>
                        Sin datos de costos calculados
                      </td>
                    </tr>
                  )}
                </tbody>
              </CostTable>
            </CostCardBody>
          </CostCard>

          {/* Table 3: Costos Productos (USD/MM2) */}
          <CostCard>
            <CostCardHeader>Costos Productos (USD/MM2)</CostCardHeader>
            <CostCardBody>
              <CostTable>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>N°</th>
                    <th>Descripción</th>
                    <th>CAD</th>
                    <th>Tipo Producto</th>
                    <th>Item</th>
                    <th>Cartón</th>
                    <th>Costo Directo</th>
                    <th>Costo Indirecto</th>
                    <th>GVV</th>
                    <th>Costo Fijo</th>
                    <th>Costo Total</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.costos_productos.length > 0 ? (
                    costData.costos_productos.map((row) => (
                      <tr key={row.numero}>
                        <td>{row.numero}</td>
                        <td>{row.descripcion}</td>
                        <td>{row.cad}</td>
                        <td>{row.tipo_producto}</td>
                        <td>{row.item}</td>
                        <td>{row.carton}</td>
                        <td>{typeof row.costo_directo === 'number' ? row.costo_directo.toFixed(2) : row.costo_directo}</td>
                        <td>{typeof row.costo_indirecto === 'number' ? row.costo_indirecto.toFixed(2) : row.costo_indirecto}</td>
                        <td>{typeof row.gvv === 'number' ? row.gvv.toFixed(2) : row.gvv}</td>
                        <td>{typeof row.costo_fijo === 'number' ? row.costo_fijo.toFixed(2) : row.costo_fijo}</td>
                        <td>{typeof row.costo_total === 'number' ? row.costo_total.toFixed(2) : row.costo_total}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', color: '#666' }}>
                        Sin datos de costos calculados
                      </td>
                    </tr>
                  )}
                </tbody>
              </CostTable>
            </CostCardBody>
          </CostCard>

          {/* Table 4: Costos Servicios (USD/MM2) */}
          <CostCard>
            <CostCardHeader>Costos Servicios (USD/MM2)</CostCardHeader>
            <CostCardBody>
              <CostTable>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>N°</th>
                    <th>Descripción</th>
                    <th>CAD</th>
                    <th>Tipo Producto</th>
                    <th>Item</th>
                    <th>Cartón</th>
                    <th>Maquila</th>
                    <th>Armado</th>
                    <th>Clisses</th>
                    <th>Matriz</th>
                    <th>Mano de Obra</th>
                    <th>Flete</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.costos_servicios.length > 0 ? (
                    costData.costos_servicios.map((row) => (
                      <tr key={row.numero}>
                        <td>{row.numero}</td>
                        <td>{row.descripcion}</td>
                        <td>{row.cad}</td>
                        <td>{row.tipo_producto}</td>
                        <td>{row.item}</td>
                        <td>{row.carton}</td>
                        <td>{typeof row.maquila === 'number' ? row.maquila.toFixed(2) : row.maquila}</td>
                        <td>{typeof row.armado === 'number' ? row.armado.toFixed(2) : row.armado}</td>
                        <td>{typeof row.clisses === 'number' ? row.clisses.toFixed(2) : row.clisses}</td>
                        <td>{typeof row.matriz === 'number' ? row.matriz.toFixed(2) : row.matriz}</td>
                        <td>{typeof row.mano_obra === 'number' ? row.mano_obra.toFixed(2) : row.mano_obra}</td>
                        <td>{typeof row.flete === 'number' ? row.flete.toFixed(2) : row.flete}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', color: '#666' }}>
                        Sin datos de costos calculados
                      </td>
                    </tr>
                  )}
                </tbody>
              </CostTable>
            </CostCardBody>
          </CostCard>

          {/* Approval Button */}
          <ApprovalButtonSection>
            <ApprovalButton onClick={() => {
              // TODO: Implement solicitar aprobación
              alert('Funcionalidad de Solicitar Aprobación próximamente');
            }}>
              Solicitar Aprobación
            </ApprovalButton>
          </ApprovalButtonSection>

          {/* Back to list button */}
          <FormFooter>
            <Button onClick={() => onNavigate(listPage)}>
              Volver al listado
            </Button>
          </FormFooter>
        </CostSummarySection>
      )}

      {/* Sprint N: Modal Carga Masiva Detalles */}
      {showCargaMasivaModal && cotizacionId && (
        <CargaMasivaDetallesModal
          cotizacionId={cotizacionId}
          onClose={() => setShowCargaMasivaModal(false)}
          onSuccess={(response) => {
            setShowCargaMasivaModal(false);
            setSuccessMessage(`${response.total_exitosos} detalles cargados exitosamente`);
            // Refresh detalles list
            queryClient.invalidateQueries({ queryKey: ['cotizacion-detalles', cotizacionId] });
          }}
        />
      )}
    </Container>
  );
}
