/**
 * DetalleForm.tsx
 * Formulario modal para crear/editar detalles de cotización.
 * Layout idéntico a Laravel (modal-detalle-cotizacion.blade.php)
 * Updated: 2025-12-25 - Estructura exacta Laravel
 * Updated: 2025-12-26 - Added Cálculo HC and Cartón modals
 * Updated: 2025-12-26 - Fetch options from API instead of mock data
 */
import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import CalculoHCModal from './CalculoHCModal';

// API Base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

// =============================================
// TIPOS E INTERFACES
// =============================================

export interface DetalleCotizacion {
  id?: number;
  tipo_detalle_id: number; // 1=Corrugado, 2=Esquinero
  cantidad: number | null;
  product_type_id: number | null;
  numero_colores: number | null;
  planta_id: number;
  variable_cotizador_id: number;

  // Dimensiones caja (opcionales - vacío por defecto en Laravel)
  largo: number | null;
  ancho: number | null;
  alto: number | null;
  tipo_medida: number; // 1=Internas, 2=Externas

  // Corrugado - Hoja Madre (vacío por defecto en Laravel)
  area_hc: number | null;
  anchura: number | null;
  largura: number | null;
  carton_id: number | null;
  golpes_largo: number;
  golpes_ancho: number;

  // Impresión
  printing_machine_id: number | null;
  print_type_id: number | null;
  process_id: number | null;
  ink_type_id: number | null;
  numero_colores_esquinero: number | null;

  // Pegado y Cobertura (seleccionar por defecto en Laravel)
  pegado_id: number | null;
  cinta_desgarro: number | null;
  barniz: number | null;
  barniz_type_id: number | null;
  cobertura_color_percent: number;
  cobertura_barniz_cm2: number;
  cobertura_color_cm2: number; // Clisse por un golpe

  // Palletizado
  pallet: number;
  pallet_height_id: number | null;
  zuncho: number | null;
  funda: number;
  stretch_film: number;
  ensamblado: number | null;
  desgajado_cabezal: number | null;
  rubro_id: number | null;

  // Campos opcionales carta oferta
  bct_min_lb: number | null;
  bct_min_kg: number | null;
  descripcion_material_detalle: string;
  cad_material_detalle: string;
  codigo_cliente: string;
  devolucion_pallets: number;
  ajuste_precios: number;

  // Campos opcionales OT
  codigo_material_detalle: string;
  hierarchy_id: number | null;
  subhierarchy_id: number | null;
  subsubhierarchy_id: number | null;

  // Servicios (seleccionar por defecto en Laravel para matriz, armado)
  matriz: number | null;
  clisse: number;
  royalty: number;
  maquila: number;
  maquila_servicio_id: number | null;
  cuchillos_gomas: number | null;
  armado_automatico: number | null;
  armado_usd_caja: number | null;

  // Esquinero (vacío por defecto en Laravel)
  largo_esquinero: number | null;
  carton_esquinero_id: number | null;
  funda_esquinero: number | null;
  tipo_destino_esquinero: number | null;
  tipo_camion_esquinero: number | null;
  maquila_esquinero: number | null;
  clisse_esquinero: number | null;
  cantidad_esquinero: number | null;

  // Destino (seleccionar por defecto en Laravel)
  ciudad_id: number | null;
  pallets_apilados: number | null;

  // Precios calculados
  precios?: {
    costo_total_usd_caja?: number;
    precio_final_usd_caja?: number;
  };
}

interface DetalleFormProps {
  detalle: DetalleCotizacion | null;
  plantaId: number | null;
  onSubmit: (detalle: DetalleCotizacion) => void;
  onCancel: () => void;
}

// Interfaz para opciones cargadas desde la API
interface FormOptions {
  product_types: Array<{ id: number; nombre: string }>;
  processes: Array<{ id: number; nombre: string }>;
  rubros: Array<{ id: number; nombre: string }>;
  cartons: Array<{ id: number; nombre: string }>;
  printing_machines: Array<{ id: number; nombre: string }>;
  print_types: Array<{ id: number; nombre: string }>;
  pegados: Array<{ id: number; nombre: string }>;
  barniz_types: Array<{ id: number; nombre: string }>;
  ink_types: Array<{ id: number; nombre: string }>;
  pallet_heights: Array<{ id: number; nombre: string }>;
  cities: Array<{ id: number; nombre: string }>;
  hierarchies: Array<{ id: number; nombre: string }>;
  cartons_esquinero: Array<{ id: number; nombre: string }>;
  maquila_servicios: Array<{ id: number; nombre: string }>;
  pallets: Array<{ id: number; nombre: string }>;
  zunchos: Array<{ id: number; nombre: string }>;
  si_no: Array<{ id: number; nombre: string }>;
  numero_colores: Array<{ id: number; nombre: string }>;
  pallets_apilados: Array<{ id: number; nombre: string }>;
  tipo_destino_esquinero: Array<{ id: number; nombre: string }>;
  tipo_camion_esquinero: Array<{ id: number; nombre: string }>;
}

// Opciones vacías por defecto (mientras carga la API)
const DEFAULT_OPTIONS: FormOptions = {
  product_types: [],
  processes: [],
  rubros: [],
  cartons: [],
  printing_machines: [],
  print_types: [],
  pegados: [],
  barniz_types: [],
  ink_types: [],
  pallet_heights: [],
  cities: [],
  hierarchies: [],
  cartons_esquinero: [],
  maquila_servicios: [],
  pallets: [{ id: 0, nombre: 'No' }, { id: 1, nombre: 'Madera' }, { id: 2, nombre: 'Plástico' }],
  zunchos: [{ id: 0, nombre: 'No' }, { id: 1, nombre: '1 zuncho' }, { id: 2, nombre: '2 zunchos' }, { id: 3, nombre: '3 zunchos' }],
  si_no: [{ id: 0, nombre: 'No' }, { id: 1, nombre: 'Si' }],
  numero_colores: Array.from({ length: 7 }, (_, i) => ({ id: i, nombre: String(i) })),
  pallets_apilados: [{ id: 1, nombre: '1' }, { id: 2, nombre: '2' }],
  tipo_destino_esquinero: [{ id: 1, nombre: 'Tarima Nacional' }, { id: 2, nombre: 'Empaque Exportación (Granel)' }, { id: 3, nombre: 'Tarima de Exportación' }],
  tipo_camion_esquinero: [{ id: 1, nombre: 'Camión 7x2,6mts' }],
};

// =============================================
// ESTILOS (Estilo Laravel Bootstrap)
// =============================================

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  z-index: 1000;
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 4px;
  width: 100%;
  max-width: 1400px;
  margin: 20px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #dee2e6;
`;

const ModalTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;

  &:hover {
    color: #333;
  }
`;

const ModalBody = styled.div`
  padding: 16px;
  background: #F2F4FD;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
`;

const Card = styled.div`
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.125);
  border-radius: 4px;
  margin-bottom: 16px;
`;

const CardHeader = styled.div<{ $center?: boolean }>`
  padding: 12px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
  font-weight: 500;
  font-size: 14px;
  color: #333;
  ${props => props.$center && `
    text-align: center;
    font-size: 18px;
  `}
`;

const CardBody = styled.div`
  padding: 20px;
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8px;
`;

const Col = styled.div<{ $size?: number; $offset?: number }>`
  flex: 0 0 ${props => ((props.$size || 12) / 12) * 100}%;
  max-width: ${props => ((props.$size || 12) / 12) * 100}%;
  padding: 0 8px;
  ${props => props.$offset && `margin-left: ${(props.$offset / 12) * 100}%;`}
`;

const FormGroup = styled.div`
  margin-bottom: 12px;
`;

const Label = styled.label`
  font-size: 12px;
  color: #333;
  margin-bottom: 4px;
  display: block;
  min-width: auto;
  white-space: nowrap;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: 6px 12px;
  border: 1px solid ${props => props.$hasError ? '#dc3545' : '#ced4da'};
  border-radius: 4px;
  font-size: 14px;
  background: ${props => props.$hasError ? '#fff8f8' : 'white'};

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#dc3545' : '#80bdff'};
    box-shadow: 0 0 0 0.2rem ${props => props.$hasError ? 'rgba(220, 53, 69, 0.25)' : 'rgba(0, 123, 255, 0.25)'};
  }

  &:disabled, &[readonly] {
    background: #e9ecef;
  }
`;

const Select = styled.select<{ $hasError?: boolean }>`
  width: 100%;
  padding: 6px 12px;
  border: 1px solid ${props => props.$hasError ? '#dc3545' : '#ced4da'};
  border-radius: 4px;
  font-size: 14px;
  background: ${props => props.$hasError ? '#fff8f8' : 'white'};

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#dc3545' : '#80bdff'};
    box-shadow: 0 0 0 0.2rem ${props => props.$hasError ? 'rgba(220, 53, 69, 0.25)' : 'rgba(0, 123, 255, 0.25)'};
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 11px;
  margin-top: 4px;
`;

const ButtonSuccess = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &:hover {
    background: #218838;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const ButtonLight = styled.button`
  background: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: #e2e6ea;
  }
`;

const ButtonSmall = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #218838;
  }
`;

const ButtonBlock = styled(ButtonSuccess)`
  width: 100%;
`;

const HelpIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #6c757d;
  color: white;
  font-size: 12px;
  cursor: help;
  margin-left: 4px;
`;

const InputWithButton = styled.div`
  display: flex;
  gap: 8px;

  input, select {
    flex: 1;
  }
`;

const InputWithHelp = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  input {
    flex: 1;
  }
`;

// =============================================
// VALORES INICIALES Y OPCIONES
// =============================================

// Valores por defecto EXACTOS de Laravel (modal-detalle-cotizacion.blade.php)
const INITIAL_DETALLE: DetalleCotizacion = {
  tipo_detalle_id: 1,           // Corrugado
  cantidad: null,               // Laravel: vacío (no 1000)
  product_type_id: null,        // Laravel: Seleccionar...
  numero_colores: null,         // Laravel: vacío/Seleccionar
  planta_id: 1,
  variable_cotizador_id: 1,
  largo: null,                  // Laravel: vacío (no 0)
  ancho: null,                  // Laravel: vacío (no 0)
  alto: null,                   // Laravel: vacío (no 0)
  tipo_medida: 1,               // Internas
  area_hc: null,                // Laravel: vacío (no 0)
  anchura: null,                // Ancho Hoja Madre - Laravel: vacío
  largura: null,                // Largo Hoja Madre - Laravel: vacío
  carton_id: null,              // Seleccionar...
  golpes_largo: 1,              // Laravel: 1
  golpes_ancho: 1,              // Laravel: 1
  printing_machine_id: null,    // Seleccionar...
  print_type_id: null,          // Seleccionar...
  process_id: null,             // Seleccionar...
  ink_type_id: null,
  numero_colores_esquinero: null,
  pegado_id: null,              // Seleccionar...
  cinta_desgarro: null,         // Laravel: Seleccionar... (no No)
  barniz: null,                 // Laravel: Seleccionar... (no No)
  barniz_type_id: null,         // Seleccionar...
  cobertura_color_percent: 0,   // Laravel: 0
  cobertura_barniz_cm2: 0,      // Laravel: 0
  cobertura_color_cm2: 0,       // Clisse por un golpe - Laravel: 0
  pallet: 1,                    // Laravel: Madera (value=1, no No=0)
  pallet_height_id: null,       // Seleccionar...
  zuncho: null,                 // Seleccionar...
  funda: 0,                     // Laravel: No
  stretch_film: 1,              // Laravel: Si (value=1, no No=0)
  ensamblado: null,             // Laravel: Seleccionar... (no No)
  desgajado_cabezal: null,      // Laravel: Seleccionar... (no No)
  rubro_id: null,               // Seleccionar...
  bct_min_lb: null,             // Laravel: vacío
  bct_min_kg: null,             // Laravel: vacío
  descripcion_material_detalle: '',
  cad_material_detalle: '',
  codigo_cliente: '',
  devolucion_pallets: 1,        // Laravel: Si
  ajuste_precios: 0,            // Laravel: No
  codigo_material_detalle: '',
  hierarchy_id: null,           // Seleccionar...
  subhierarchy_id: null,        // Seleccionar...
  subsubhierarchy_id: null,     // Seleccionar...
  matriz: null,                 // Laravel: Seleccionar... (no No)
  clisse: 0,                    // Laravel: No
  royalty: 0,                   // Laravel: No
  maquila: 0,                   // Laravel: No
  maquila_servicio_id: null,
  cuchillos_gomas: null,        // Laravel: vacío (no 0)
  armado_automatico: null,      // Laravel: Seleccionar...
  armado_usd_caja: null,        // Laravel: vacío (no 0)
  largo_esquinero: null,
  carton_esquinero_id: null,
  funda_esquinero: null,
  tipo_destino_esquinero: null,
  tipo_camion_esquinero: null,
  maquila_esquinero: null,
  clisse_esquinero: null,
  cantidad_esquinero: null,     // Laravel: vacío (no 1000)
  ciudad_id: null,              // Seleccionar...
  pallets_apilados: null,       // Laravel: Seleccionar... (no 2)
};

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export default function DetalleForm({
  detalle,
  plantaId,
  onSubmit,
  onCancel
}: DetalleFormProps) {
  const [formData, setFormData] = useState<DetalleCotizacion>(
    detalle || { ...INITIAL_DETALLE, planta_id: plantaId || 1 }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCalculoModal, setShowCalculoModal] = useState(false);
  const [calculoModalMode, setCalculoModalMode] = useState<'carton' | 'calculo_hc' | 'ambos'>('ambos');
  const [options, setOptions] = useState<FormOptions>(DEFAULT_OPTIONS);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const isEditing = !!detalle?.id;
  const isCorrugado = formData.tipo_detalle_id === 1;

  // Cargar opciones del formulario desde la API
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const response = await fetch(`${API_BASE}/areahc/form-options-complete`);
        if (response.ok) {
          const data = await response.json();
          setOptions(prev => ({ ...prev, ...data }));
        } else {
          console.error('Error fetching form options:', response.status);
        }
      } catch (error) {
        console.error('Error fetching form options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  // NOTA: En Laravel, Area HC NO se calcula automáticamente desde anchura/largura.
  // Solo se modifica mediante el botón "Cálculo AHC" o ingreso manual.
  // El cálculo automático fue removido para igualar el comportamiento de Laravel.

  // Calcular BCT KG desde LB
  useEffect(() => {
    if (formData.bct_min_lb) {
      const kg = formData.bct_min_lb * 0.453592;
      setFormData(prev => ({ ...prev, bct_min_kg: parseFloat(kg.toFixed(2)) }));
    }
  }, [formData.bct_min_lb]);

  // Actualizar planta cuando cambia la prop
  useEffect(() => {
    if (plantaId && plantaId !== formData.planta_id) {
      setFormData(prev => ({ ...prev, planta_id: plantaId }));
    }
  }, [plantaId]);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    let parsedValue: string | number | null = value;

    if (type === 'number') {
      // Laravel: inputs vacíos muestran vacío, no 0
      parsedValue = value === '' ? null : parseFloat(value);
    } else if (e.target.tagName === 'SELECT') {
      parsedValue = value === '' ? null : parseInt(value);
    }

    setFormData(prev => ({ ...prev, [name]: parsedValue }));

    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [errors]);

  const handleTextChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (isCorrugado) {
      // Campos requeridos para Corrugado (igual que Laravel - 13 campos)
      if (!formData.carton_id) {
        newErrors.carton_id = 'Seleccione un cartón';
      }
      if (!formData.area_hc || formData.area_hc <= 0) {
        newErrors.area_hc = 'El área HC es requerida';
      }
      if (!formData.anchura || formData.anchura <= 0) {
        newErrors.anchura = 'El ancho hoja madre es requerido';
      }
      if (!formData.largura || formData.largura <= 0) {
        newErrors.largura = 'El largo hoja madre es requerido';
      }
      if (formData.numero_colores === null || formData.numero_colores === undefined) {
        newErrors.numero_colores = 'Seleccione número de colores';
      }
      if (!formData.process_id) {
        newErrors.process_id = 'Seleccione un proceso';
      }
      if (!formData.cantidad || formData.cantidad <= 0) {
        newErrors.cantidad = 'La cantidad debe ser mayor a 0';
      }
      // Campos adicionales requeridos por Laravel
      if (!formData.product_type_id) {
        newErrors.product_type_id = 'Seleccione un tipo de item';
      }
      if (formData.cinta_desgarro === null || formData.cinta_desgarro === undefined) {
        newErrors.cinta_desgarro = 'Seleccione cinta desgarro';
      }
      if (formData.zuncho === null || formData.zuncho === undefined) {
        newErrors.zuncho = 'Seleccione zunchos';
      }
      if (!formData.rubro_id) {
        newErrors.rubro_id = 'Seleccione un rubro';
      }
      // Matriz NO es requerido - igual que Laravel
      if (!formData.ciudad_id) {
        newErrors.ciudad_id = 'Seleccione una ciudad';
      }
    } else {
      // Campos requeridos para Esquinero
      if (!formData.cantidad_esquinero || formData.cantidad_esquinero <= 0) {
        newErrors.cantidad_esquinero = 'La cantidad debe ser mayor a 0';
      }
      if (!formData.carton_esquinero_id) {
        newErrors.carton_esquinero_id = 'Seleccione un cartón';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isCorrugado]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) {
      return;
    }
    onSubmit(formData);
  }, [formData, validateForm, onSubmit]);

  const handleLimpiar = useCallback(() => {
    setFormData({ ...INITIAL_DETALLE, planta_id: plantaId || 1 });
    setErrors({});
  }, [plantaId]);

  // Abrir modal de Estimación Cartón (modo cartón)
  const handleOpenEstimacionCarton = useCallback(() => {
    setCalculoModalMode('carton');
    setShowCalculoModal(true);
  }, []);

  // Abrir modal de Cálculo AHC (modo cálculo HC)
  const handleOpenCalculoAHC = useCallback(() => {
    setCalculoModalMode('calculo_hc');
    setShowCalculoModal(true);
  }, []);

  // Manejar resultado del cálculo y aplicar a los campos del formulario
  // (Igual que Laravel: areaHC.js -> #confirmarCalculoHC)
  const handleCalculoResult = useCallback((result: {
    externo_largo: number | null;
    externo_ancho: number | null;
    externo_alto: number | null;
    areahc: number | null;
    codigo_carton_id: number | null;
    // Campos adicionales transferidos desde el modal (como en Laravel)
    interno_largo?: number | null;
    interno_ancho?: number | null;
    interno_alto?: number | null;
    rubro_id?: number | null;
    process_id?: number | null;
    product_type_id?: number | null;
    numero_colores?: number | null;
  }) => {
    setFormData(prev => ({
      ...prev,
      // Dimensiones - solo actualizar si hay valor (no sobrescribir datos existentes con null)
      ...(result.interno_largo !== undefined && result.interno_largo !== null && { largo: result.interno_largo }),
      ...(result.interno_ancho !== undefined && result.interno_ancho !== null && { ancho: result.interno_ancho }),
      ...(result.interno_alto !== undefined && result.interno_alto !== null && { alto: result.interno_alto }),
      // Área HC - solo actualizar si hay valor
      ...(result.areahc !== undefined && result.areahc !== null && { area_hc: result.areahc }),
      // Cartón - solo actualizar si hay valor (no borrar cartón seleccionado previamente)
      ...(result.codigo_carton_id !== undefined && result.codigo_carton_id !== null && { carton_id: result.codigo_carton_id }),
      // Campos adicionales del formulario de cálculo (igual que Laravel)
      ...(result.rubro_id !== undefined && result.rubro_id !== null && { rubro_id: result.rubro_id }),
      ...(result.process_id !== undefined && result.process_id !== null && { process_id: result.process_id }),
      ...(result.product_type_id !== undefined && result.product_type_id !== null && { product_type_id: result.product_type_id }),
      ...(result.numero_colores !== undefined && result.numero_colores !== null && { numero_colores: result.numero_colores }),
    }));
    setShowCalculoModal(false);
  }, []);

  // Modal solo se cierra con el botón X (no con Escape ni clic fuera)

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            {isEditing ? 'Editar Detalle' : 'Crear Detalle'}
          </ModalTitle>
          <CloseButton onClick={onCancel}>&times;</CloseButton>
        </ModalHeader>

        <ModalBody>
          {loadingOptions && (
            <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
              Cargando opciones...
            </div>
          )}
          {/* SELECCIONAR TIPO DE PRODUCTO */}
          <Card>
            <CardHeader>SELECCIONAR TIPO DE PRODUCTO</CardHeader>
            <CardBody style={{ padding: '4px 20px' }}>
              <Row>
                <Col $size={4} $offset={4}>
                  <FormGroup>
                    <Label>Tipo de Producto</Label>
                    <Select
                      name="tipo_detalle_id"
                      value={formData.tipo_detalle_id}
                      onChange={handleChange}
                    >
                      <option value={1}>Corrugado</option>
                      <option value={2}>Esquinero</option>
                    </Select>
                  </FormGroup>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* CARACTERISTICAS */}
          <Card>
            <CardHeader $center>{isCorrugado ? 'CORRUGADO' : 'ESQUINERO'}</CardHeader>
            <CardHeader>Caracteristicas</CardHeader>
            <CardBody>
              {/* Buscar por Material */}
              {isCorrugado && (
                <Row style={{ marginBottom: '16px' }}>
                  <Col $size={4}>
                    <ButtonBlock type="button">
                      Buscar por Material 🔍
                    </ButtonBlock>
                  </Col>
                </Row>
              )}

              {isCorrugado ? (
                /* FORMULARIO CORRUGADO */
                <Row>
                  {/* COLUMNA 1 */}
                  <Col $size={4}>
                    {/* Cartón + Estimación Cartón */}
                    <FormGroup>
                      <InputWithButton>
                        <div style={{ flex: 1 }}>
                          <Label>Cartón {errors.carton_id && <span style={{ color: '#dc3545' }}>*</span>}</Label>
                          <Select
                            name="carton_id"
                            value={formData.carton_id || ''}
                            onChange={handleChange}
                            $hasError={!!errors.carton_id}
                          >
                            <option value="">Seleccionar...</option>
                            {options.cartons.map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                            ))}
                          </Select>
                          {errors.carton_id && <ErrorMessage>{errors.carton_id}</ErrorMessage>}
                        </div>
                        <ButtonSmall type="button" style={{ marginTop: '20px' }} onClick={handleOpenEstimacionCarton}>
                          Estimación Cartón
                        </ButtonSmall>
                      </InputWithButton>
                    </FormGroup>

                    {/* Area HC + Cálculo AHC */}
                    <FormGroup>
                      <InputWithButton>
                        <div style={{ flex: 1 }}>
                          <Label>Area HC (m2): {errors.area_hc && <span style={{ color: '#dc3545' }}>*</span>}</Label>
                          <Input
                            type="number"
                            name="area_hc"
                            value={formData.area_hc ?? ''}
                            onChange={handleChange}
                            min={0}
                            max={99}
                            $hasError={!!errors.area_hc}
                          />
                          {errors.area_hc && <ErrorMessage>{errors.area_hc}</ErrorMessage>}
                        </div>
                        <ButtonSmall type="button" style={{ marginTop: '20px' }} onClick={handleOpenCalculoAHC}>
                          Cálculo AHC
                        </ButtonSmall>
                      </InputWithButton>
                    </FormGroup>

                    {/* Ancho Hoja Madre */}
                    <FormGroup>
                      <InputWithHelp>
                        <div style={{ flex: 1 }}>
                          <Label>Ancho Hoja Madre (mm): {errors.anchura && <span style={{ color: '#dc3545' }}>*</span>}</Label>
                          <Input
                            type="number"
                            name="anchura"
                            value={formData.anchura ?? ''}
                            onChange={handleChange}
                            $hasError={!!errors.anchura}
                          />
                          {errors.anchura && <ErrorMessage>{errors.anchura}</ErrorMessage>}
                        </div>
                        <HelpIcon title="Ver imagen de referencia">?</HelpIcon>
                      </InputWithHelp>
                    </FormGroup>

                    {/* Largo Hoja Madre */}
                    <FormGroup>
                      <InputWithHelp>
                        <div style={{ flex: 1 }}>
                          <Label>Largo Hoja Madre (mm): {errors.largura && <span style={{ color: '#dc3545' }}>*</span>}</Label>
                          <Input
                            type="number"
                            name="largura"
                            value={formData.largura ?? ''}
                            onChange={handleChange}
                            $hasError={!!errors.largura}
                          />
                          {errors.largura && <ErrorMessage>{errors.largura}</ErrorMessage>}
                        </div>
                        <HelpIcon title="Ver imagen de referencia">?</HelpIcon>
                      </InputWithHelp>
                    </FormGroup>

                    {/* Tipo Item */}
                    <FormGroup>
                      <Label>Tipo item {errors.product_type_id && <span style={{ color: '#dc3545' }}>*</span>}</Label>
                      <Select
                        name="product_type_id"
                        value={formData.product_type_id || ''}
                        onChange={handleChange}
                        $hasError={!!errors.product_type_id}
                      >
                        <option value="">Seleccionar...</option>
                        {options.product_types.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                      {errors.product_type_id && <ErrorMessage>{errors.product_type_id}</ErrorMessage>}
                    </FormGroup>

                    {/* Máquina Impresora */}
                    <FormGroup>
                      <Label>Máquina Impresora</Label>
                      <Select
                        name="printing_machine_id"
                        value={formData.printing_machine_id || ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        {options.printing_machines.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                    </FormGroup>

                    {/* Impresión */}
                    <FormGroup>
                      <Label>Impresión</Label>
                      <Select
                        name="print_type_id"
                        value={formData.print_type_id || ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        {options.print_types.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                    </FormGroup>

                    {/* Número Colores */}
                    <FormGroup>
                      <Label>Número Colores {errors.numero_colores && <span style={{ color: '#dc3545' }}>*</span>}</Label>
                      <Select
                        name="numero_colores"
                        value={formData.numero_colores ?? ''}
                        onChange={handleChange}
                        $hasError={!!errors.numero_colores}
                      >
                        <option value="">Seleccionar...</option>
                        {[0, 1, 2, 3, 4, 5, 6].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </Select>
                      {errors.numero_colores && <ErrorMessage>{errors.numero_colores}</ErrorMessage>}
                    </FormGroup>

                    {/* Golpes Largo + Ancho */}
                    <Row>
                      <Col $size={6}>
                        <FormGroup>
                          <Label>Golpes largo:</Label>
                          <Input
                            type="number"
                            name="golpes_largo"
                            value={formData.golpes_largo}
                            onChange={handleChange}
                            min={0}
                            max={20}
                          />
                        </FormGroup>
                      </Col>
                      <Col $size={6}>
                        <FormGroup>
                          <Label>Golpes ancho:</Label>
                          <Input
                            type="number"
                            name="golpes_ancho"
                            value={formData.golpes_ancho}
                            onChange={handleChange}
                            min={0}
                            max={20}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </Col>

                  {/* COLUMNA 2 */}
                  <Col $size={4}>
                    {/* Proceso */}
                    <FormGroup>
                      <Label>Proceso {errors.process_id && <span style={{ color: '#dc3545' }}>*</span>}</Label>
                      <Select
                        name="process_id"
                        value={formData.process_id || ''}
                        onChange={handleChange}
                        $hasError={!!errors.process_id}
                      >
                        <option value="">Seleccionar...</option>
                        {options.processes.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                      {errors.process_id && <ErrorMessage>{errors.process_id}</ErrorMessage>}
                    </FormGroup>

                    {/* Tipo de Pegado */}
                    <FormGroup>
                      <Label>Tipo de Pegado</Label>
                      <Select
                        name="pegado_id"
                        value={formData.pegado_id || ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        {options.pegados.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                    </FormGroup>

                    {/* Cinta Desgarro */}
                    <FormGroup>
                      <Label>Cinta Desgarro {errors.cinta_desgarro && <span style={{ color: '#dc3545' }}>*</span>}</Label>
                      <Select
                        name="cinta_desgarro"
                        value={formData.cinta_desgarro ?? ''}
                        onChange={handleChange}
                        $hasError={!!errors.cinta_desgarro}
                      >
                        <option value="">Seleccionar...</option>
                        <option value={0}>No</option>
                        <option value={1}>Si</option>
                      </Select>
                      {errors.cinta_desgarro && <ErrorMessage>{errors.cinta_desgarro}</ErrorMessage>}
                    </FormGroup>

                    {/* Barniz */}
                    <FormGroup>
                      <Label>Barniz</Label>
                      <Select
                        name="barniz"
                        value={formData.barniz ?? ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        <option value={0}>No</option>
                        <option value={1}>Si</option>
                      </Select>
                    </FormGroup>

                    {/* Tipo de Barniz */}
                    <FormGroup>
                      <Label>Tipo de Barniz</Label>
                      <Select
                        name="barniz_type_id"
                        value={formData.barniz_type_id || ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        {options.barniz_types.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                    </FormGroup>

                    {/* Cobertura color (%) */}
                    <FormGroup>
                      <Label>Cobertura color (%):</Label>
                      <Input
                        type="number"
                        name="cobertura_color_percent"
                        value={formData.cobertura_color_percent}
                        onChange={handleChange}
                        min={0}
                      />
                    </FormGroup>

                    {/* Cobertura barniz (cm2) */}
                    <FormGroup>
                      <Label>Cobertura barniz (cm2):</Label>
                      <Input
                        type="number"
                        name="cobertura_barniz_cm2"
                        value={formData.cobertura_barniz_cm2}
                        onChange={handleChange}
                        min={0}
                      />
                    </FormGroup>

                    {/* Clisse por un golpe (cm2) */}
                    <FormGroup>
                      <Label>Clisse por un golpe (cm2):</Label>
                      <Input
                        type="number"
                        name="cobertura_color_cm2"
                        value={formData.cobertura_color_cm2}
                        onChange={handleChange}
                        min={0}
                      />
                    </FormGroup>
                  </Col>

                  {/* COLUMNA 3 */}
                  <Col $size={4}>
                    {/* Pallet */}
                    <FormGroup>
                      <Label>Pallet</Label>
                      <Select
                        name="pallet"
                        value={formData.pallet}
                        onChange={handleChange}
                      >
                        {options.pallets.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                    </FormGroup>

                    {/* Altura Pallet */}
                    <FormGroup>
                      <Label>Altura Pallet</Label>
                      <Select
                        name="pallet_height_id"
                        value={formData.pallet_height_id || ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        {options.pallet_heights.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                    </FormGroup>

                    {/* Zunchos */}
                    <FormGroup>
                      <Label>Zunchos {errors.zuncho && <span style={{ color: '#dc3545' }}>*</span>}</Label>
                      <Select
                        name="zuncho"
                        value={formData.zuncho ?? ''}
                        onChange={handleChange}
                        $hasError={!!errors.zuncho}
                      >
                        <option value="">Seleccionar...</option>
                        {options.zunchos.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                      {errors.zuncho && <ErrorMessage>{errors.zuncho}</ErrorMessage>}
                    </FormGroup>

                    {/* Funda */}
                    <FormGroup>
                      <Label>Funda</Label>
                      <Select
                        name="funda"
                        value={formData.funda}
                        onChange={handleChange}
                      >
                        <option value={0}>No</option>
                        <option value={1}>Si</option>
                      </Select>
                    </FormGroup>

                    {/* Strech Film */}
                    <FormGroup>
                      <Label>Strech Film</Label>
                      <Select
                        name="stretch_film"
                        value={formData.stretch_film}
                        onChange={handleChange}
                      >
                        <option value={0}>No</option>
                        <option value={1}>Si</option>
                      </Select>
                    </FormGroup>

                    {/* Ensamblado */}
                    <FormGroup>
                      <Label>Ensamblado</Label>
                      <Select
                        name="ensamblado"
                        value={formData.ensamblado ?? ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        <option value={0}>No</option>
                        <option value={1}>Si</option>
                      </Select>
                    </FormGroup>

                    {/* Desgajado Cabezal */}
                    <FormGroup>
                      <Label>Desgajado Cabezal</Label>
                      <Select
                        name="desgajado_cabezal"
                        value={formData.desgajado_cabezal ?? ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        <option value={0}>No</option>
                        <option value={1}>Si</option>
                      </Select>
                    </FormGroup>

                    {/* Rubro */}
                    <FormGroup>
                      <Label>Rubro {errors.rubro_id && <span style={{ color: '#dc3545' }}>*</span>}</Label>
                      <Select
                        name="rubro_id"
                        value={formData.rubro_id || ''}
                        onChange={handleChange}
                        $hasError={!!errors.rubro_id}
                      >
                        <option value="">Seleccionar...</option>
                        {options.rubros.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                      {errors.rubro_id && <ErrorMessage>{errors.rubro_id}</ErrorMessage>}
                    </FormGroup>
                  </Col>
                </Row>
              ) : (
                /* FORMULARIO ESQUINERO */
                <Row>
                  <Col $size={4}>
                    <FormGroup>
                      <Label>Largo o medida (m):</Label>
                      <Input
                        type="number"
                        name="largo_esquinero"
                        value={formData.largo_esquinero ?? ''}
                        onChange={handleChange}
                        min={0}
                        max={3}
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label>Cartón {errors.carton_esquinero_id && <span style={{ color: '#dc3545' }}>*</span>}</Label>
                      <Select
                        name="carton_esquinero_id"
                        value={formData.carton_esquinero_id || ''}
                        onChange={handleChange}
                        $hasError={!!errors.carton_esquinero_id}
                      >
                        <option value="">Seleccionar...</option>
                        {options.cartons_esquinero.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                      {errors.carton_esquinero_id && <ErrorMessage>{errors.carton_esquinero_id}</ErrorMessage>}
                    </FormGroup>

                    <FormGroup>
                      <Label>Número Colores</Label>
                      <Select
                        name="numero_colores_esquinero"
                        value={formData.numero_colores_esquinero ?? ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        {[0, 1, 2].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </Select>
                    </FormGroup>

                    <FormGroup>
                      <Label>Incluye funda?</Label>
                      <Select
                        name="funda_esquinero"
                        value={formData.funda_esquinero ?? ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        <option value={0}>No</option>
                        <option value={1}>Si</option>
                      </Select>
                    </FormGroup>
                  </Col>
                </Row>
              )}
            </CardBody>
          </Card>

          {/* CAMPOS OPCIONALES - Solo Corrugado */}
          {isCorrugado && (
            <Row>
              {/* Campos carta oferta */}
              <Col $size={8}>
                <Card style={{ height: '100%' }}>
                  <CardHeader>CAMPOS OPCIONALES (DATOS PARA INCLUIR EN LA CARTA DE OFERTA)</CardHeader>
                  <CardBody>
                    <Row>
                      <Col $size={6}>
                        {/* Medidas */}
                        <FormGroup>
                          <Label>Medidas</Label>
                          <Select
                            name="tipo_medida"
                            value={formData.tipo_medida}
                            onChange={handleChange}
                          >
                            <option value={1}>Internas</option>
                            <option value={2}>Externas</option>
                          </Select>
                        </FormGroup>

                        {/* Largo */}
                        <FormGroup>
                          <Label>Largo (mm):</Label>
                          <Input
                            type="number"
                            name="largo"
                            value={formData.largo ?? ''}
                            onChange={handleChange}
                          />
                        </FormGroup>

                        {/* Ancho */}
                        <FormGroup>
                          <Label>Ancho (mm):</Label>
                          <Input
                            type="number"
                            name="ancho"
                            value={formData.ancho ?? ''}
                            onChange={handleChange}
                          />
                        </FormGroup>

                        {/* Alto */}
                        <FormGroup>
                          <Label>Alto (mm):</Label>
                          <Input
                            type="number"
                            name="alto"
                            value={formData.alto ?? ''}
                            onChange={handleChange}
                          />
                        </FormGroup>

                        {/* BCT MIN */}
                        <Row>
                          <Col $size={6}>
                            <FormGroup>
                              <Label>BCT MIN (LB):</Label>
                              <Input
                                type="number"
                                name="bct_min_lb"
                                value={formData.bct_min_lb || ''}
                                onChange={handleChange}
                              />
                            </FormGroup>
                          </Col>
                          <Col $size={6}>
                            <FormGroup>
                              <Label>BCT MIN (KG):</Label>
                              <Input
                                type="text"
                                value={formData.bct_min_kg || ''}
                                readOnly
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      </Col>

                      <Col $size={6}>
                        {/* Descripción (material) */}
                        <FormGroup>
                          <Label>Descripción (material):</Label>
                          <Input
                            type="text"
                            name="descripcion_material_detalle"
                            value={formData.descripcion_material_detalle}
                            onChange={handleTextChange}
                          />
                        </FormGroup>

                        {/* CAD (material) */}
                        <FormGroup>
                          <Label>CAD (material):</Label>
                          <Input
                            type="text"
                            name="cad_material_detalle"
                            value={formData.cad_material_detalle}
                            onChange={handleTextChange}
                          />
                        </FormGroup>

                        {/* Cod. interno cliente */}
                        <FormGroup>
                          <Label>Cod. interno cliente:</Label>
                          <Input
                            type="text"
                            name="codigo_cliente"
                            value={formData.codigo_cliente}
                            onChange={handleTextChange}
                          />
                        </FormGroup>

                        {/* Cláusula Devolución de Pallets */}
                        <FormGroup>
                          <Label>Cláusula Devolución de Pallets</Label>
                          <Select
                            name="devolucion_pallets"
                            value={formData.devolucion_pallets}
                            onChange={handleChange}
                          >
                            <option value={1}>Si</option>
                            <option value={0}>No</option>
                          </Select>
                        </FormGroup>

                        {/* Cláusula Ajuste de Precios */}
                        <FormGroup>
                          <Label>Cláusula Ajuste de Precios</Label>
                          <Select
                            name="ajuste_precios"
                            value={formData.ajuste_precios}
                            onChange={handleChange}
                          >
                            <option value={0}>No</option>
                            <option value={1}>Si</option>
                          </Select>
                        </FormGroup>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>

              {/* Campos para OT */}
              <Col $size={4}>
                <Card style={{ height: '100%' }}>
                  <CardHeader>CAMPOS OPCIONALES (SOLO EN CASO QUE SE QUIERA CONVERTIR COTIZACIÓN A OT)</CardHeader>
                  <CardBody>
                    {/* Código (material) */}
                    <FormGroup>
                      <Label>Código (material):</Label>
                      <Input
                        type="text"
                        name="codigo_material_detalle"
                        value={formData.codigo_material_detalle}
                        onChange={handleTextChange}
                      />
                    </FormGroup>

                    {/* Jerarquía 1 */}
                    <FormGroup>
                      <Label>Jerarquía 1</Label>
                      <Select
                        name="hierarchy_id"
                        value={formData.hierarchy_id || ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        {options.hierarchies.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                    </FormGroup>

                    {/* Jerarquía 2 */}
                    <FormGroup>
                      <Label>Jerarquía 2</Label>
                      <Select
                        name="subhierarchy_id"
                        value={formData.subhierarchy_id || ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                      </Select>
                    </FormGroup>

                    {/* Jerarquía 3 */}
                    <FormGroup>
                      <Label>Jerarquía 3</Label>
                      <Select
                        name="subsubhierarchy_id"
                        value={formData.subsubhierarchy_id || ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                      </Select>
                    </FormGroup>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}

          {/* SERVICIOS */}
          <Card>
            <CardHeader>Servicios</CardHeader>
            <CardBody>
              {isCorrugado ? (
                <Row>
                  <Col $size={4}>
                    {/* Matriz - NO es requerido */}
                    <FormGroup>
                      <Label>Matriz</Label>
                      <Select
                        name="matriz"
                        value={formData.matriz ?? ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        <option value={0}>No</option>
                        <option value={1}>Si</option>
                      </Select>
                    </FormGroup>

                    {/* Clisse */}
                    <FormGroup>
                      <Label>Clisse</Label>
                      <Select
                        name="clisse"
                        value={formData.clisse}
                        onChange={handleChange}
                      >
                        <option value={0}>No</option>
                        <option value={1}>Si</option>
                      </Select>
                    </FormGroup>

                    {/* Royalty */}
                    <FormGroup>
                      <Label>Royalty</Label>
                      <Select
                        name="royalty"
                        value={formData.royalty}
                        onChange={handleChange}
                      >
                        <option value={0}>No</option>
                        <option value={1}>Si</option>
                      </Select>
                    </FormGroup>
                  </Col>

                  <Col $size={4}>
                    {/* Maquila */}
                    <FormGroup>
                      <Label>Maquila</Label>
                      <Select
                        name="maquila"
                        value={formData.maquila}
                        onChange={handleChange}
                      >
                        <option value={0}>No</option>
                        <option value={1}>Si</option>
                      </Select>
                    </FormGroup>

                    {/* Cuchillos y gomas (m) */}
                    <FormGroup>
                      <Label>Cuchillos y gomas (m):</Label>
                      <Input
                        type="number"
                        name="cuchillos_gomas"
                        value={formData.cuchillos_gomas ?? ''}
                        onChange={handleChange}
                      />
                    </FormGroup>
                  </Col>

                  <Col $size={4}>
                    {/* Armado */}
                    <FormGroup>
                      <Label>Armado</Label>
                      <Select
                        name="armado_automatico"
                        value={formData.armado_automatico ?? ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        <option value={0}>No</option>
                        <option value={1}>Si</option>
                      </Select>
                    </FormGroup>

                    {/* Armado (US$/UN) */}
                    <FormGroup>
                      <Label>Armado (US$/UN):</Label>
                      <Input
                        type="number"
                        name="armado_usd_caja"
                        value={formData.armado_usd_caja ?? ''}
                        onChange={handleChange}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              ) : (
                /* Servicios Esquinero */
                <Row>
                  <Col $size={4}>
                    {/* Tipo Destino (palletizado) */}
                    <FormGroup>
                      <Label>Tipo Destino (palletizado)</Label>
                      <Select
                        name="tipo_destino_esquinero"
                        value={formData.tipo_destino_esquinero || ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        {options.tipo_destino_esquinero.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                    </FormGroup>

                    {/* Tipo Camión */}
                    <FormGroup>
                      <Label>Tipo Camión</Label>
                      <Select
                        name="tipo_camion_esquinero"
                        value={formData.tipo_camion_esquinero || ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        {options.tipo_camion_esquinero.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                    </FormGroup>

                    {/* Maquila */}
                    <FormGroup>
                      <Label>Maquila</Label>
                      <Select
                        name="maquila_esquinero"
                        value={formData.maquila_esquinero ?? ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        <option value={0}>No</option>
                        <option value={1}>Si</option>
                      </Select>
                    </FormGroup>

                    {/* Clisse */}
                    <FormGroup>
                      <Label>Clisse</Label>
                      <Select
                        name="clisse_esquinero"
                        value={formData.clisse_esquinero ?? ''}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar...</option>
                        <option value={0}>No</option>
                        <option value={1}>Si</option>
                      </Select>
                    </FormGroup>
                  </Col>
                </Row>
              )}
            </CardBody>
          </Card>

          {/* DESTINO */}
          <Card>
            <CardHeader>Destino</CardHeader>
            <CardBody>
              <Row>
                <Col $size={3}>
                  <FormGroup>
                    <Label>Lugar de Destino {errors.ciudad_id && <span style={{ color: '#dc3545' }}>*</span>}</Label>
                    <Select
                      name="ciudad_id"
                      value={formData.ciudad_id || ''}
                      onChange={handleChange}
                      $hasError={!!errors.ciudad_id}
                    >
                      <option value="">Seleccionar...</option>
                      {options.cities.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                      ))}
                    </Select>
                    {errors.ciudad_id && <ErrorMessage>{errors.ciudad_id}</ErrorMessage>}
                  </FormGroup>
                </Col>

                {isCorrugado && (
                  <>
                    <Col $size={3}>
                      <FormGroup>
                        <Label>Pallets Apilados</Label>
                        <Select
                          name="pallets_apilados"
                          value={formData.pallets_apilados ?? ''}
                          onChange={handleChange}
                        >
                          <option value="">Seleccionar...</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </Select>
                      </FormGroup>
                    </Col>

                    <Col $size={3}>
                      <FormGroup>
                        <Label>Cantidad (UN): {errors.cantidad && <span style={{ color: '#dc3545' }}>*</span>}</Label>
                        <Input
                          type="number"
                          name="cantidad"
                          value={formData.cantidad ?? ''}
                          onChange={handleChange}
                          min={1}
                          $hasError={!!errors.cantidad}
                        />
                        {errors.cantidad && <ErrorMessage>{errors.cantidad}</ErrorMessage>}
                      </FormGroup>
                    </Col>
                  </>
                )}

                {!isCorrugado && (
                  <Col $size={3}>
                    <FormGroup>
                      <Label>Cantidad (UN): {errors.cantidad_esquinero && <span style={{ color: '#dc3545' }}>*</span>}</Label>
                      <Input
                        type="number"
                        name="cantidad_esquinero"
                        value={formData.cantidad_esquinero ?? ''}
                        onChange={handleChange}
                        min={1}
                        $hasError={!!errors.cantidad_esquinero}
                      />
                      {errors.cantidad_esquinero && <ErrorMessage>{errors.cantidad_esquinero}</ErrorMessage>}
                    </FormGroup>
                  </Col>
                )}
              </Row>

              <Row style={{ marginTop: '16px' }}>
                <Col $size={12} style={{ textAlign: 'center' }}>
                  <ButtonSuccess type="button">
                    Agregar Destino
                  </ButtonSuccess>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* Botones de acción */}
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <ButtonLight onClick={handleLimpiar} style={{ marginRight: '8px' }}>
              Limpiar
            </ButtonLight>
            <ButtonSuccess onClick={handleSubmit}>
              {isEditing ? 'Guardar Detalle' : 'Guardar Detalle'}
            </ButtonSuccess>
          </div>
        </ModalBody>
      </ModalContent>

      {/* Modal de Cálculo HC y Cartón */}
      {showCalculoModal && (
        <CalculoHCModal
          mode={calculoModalMode}
          onClose={() => setShowCalculoModal(false)}
          onApply={handleCalculoResult}
        />
      )}
    </ModalOverlay>
  );
}
