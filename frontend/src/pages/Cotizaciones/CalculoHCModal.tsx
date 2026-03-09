/**
 * CalculoHCModal.tsx
 * Modal para cálculo de HC y Cartón
 * Replica exactamente la funcionalidad y layout de modal-calculo-hc.blade.php de Laravel
 * Updated: 2025-12-26 - Layout exacto como Laravel para todos los modos
 */
import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';

// API Base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

// =============================================
// TIPOS E INTERFACES
// =============================================

interface CalculoHCModalProps {
  mode: 'carton' | 'calculo_hc' | 'ambos';
  onClose: () => void;
  onApply?: (data: CalculoResult) => void;
}

interface CalculoFormData {
  tipo_calculo: number; // 1=Cálculo HC y Cartón, 2=Cálculo HC, 3=Cartón
  // Campos de cálculo HC
  interno_largo: number | null;
  interno_ancho: number | null;
  interno_alto: number | null;
  style_id: number | null;
  traslape: number | null;
  areahc_product_type_id: number | null;
  prepicado_ventilacion: number;
  onda_id: number | null;
  process_id: number | null;
  // Campos para Cartón
  rubro_id: number | null;
  carton_color: number | null;
  ect_min_ingresado: number | null;
  // Campos adicionales
  envase_id: number | null;
  contenido_caja: number | null;
  areahc_pallets_apilados: number | null;
  cajas_apiladas_por_pallet: number | null;
  filas_columnares_por_pallet: number | null;
  numero_colores: number | null;
  rmt: number | null;
}

interface CalculoResult {
  externo_largo: number | null;
  externo_ancho: number | null;
  externo_alto: number | null;
  areahc: number | null;
  rmt_resultado: string | number | null;
  ect_min: string | number | null;
  codigo_carton_id: number | null;
  codigo_carton: string;
  ect_min_carton: number | null;
  // Campos adicionales para transferir al formulario principal (como en Laravel)
  interno_largo: number | null;
  interno_ancho: number | null;
  interno_alto: number | null;
  rubro_id: number | null;
  process_id: number | null;
  product_type_id: number | null;
  numero_colores: number | null;
}

interface FormOptions {
  styles: Array<{ id: number; nombre: string }>;
  product_types: Array<{ id: number; nombre: string }>;
  processes: Array<{ id: number; nombre: string }>;
  rubros: Array<{ id: number; nombre: string }>;
  ondas: Array<{ id: number; nombre: string }>;
  envases: Array<{ id: number; nombre: string }>;
  tipos_calculo: Array<{ id: number; nombre: string }>;
  colores_carton: Array<{ id: number; nombre: string }>;
  prepicado_ventilacion: Array<{ id: number; nombre: string }>;
  numero_colores: Array<{ id: number; nombre: string }>;
}

// =============================================
// ESTILOS - Replicando exactamente Laravel
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
  z-index: 1100;
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 4px;
  width: 100%;
  max-width: 900px;
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
  font-size: 1.25rem;
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
  padding: 24px;
  background-color: #F2F4FD;
`;

const CardContainer = styled.div`
  background: white;
  border-radius: 4px;
  padding: 20px;
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 0 -12px;
`;

const Col = styled.div<{ $size?: number; $offset?: number }>`
  flex: 0 0 ${props => ((props.$size || 12) / 12) * 100}%;
  max-width: ${props => ((props.$size || 12) / 12) * 100}%;
  padding: 0 12px;
  ${props => props.$offset ? `margin-left: ${(props.$offset / 12) * 100}%;` : ''}
  box-sizing: border-box;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const FormRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Label = styled.label<{ $hasError?: boolean }>`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$hasError ? '#dc3545' : '#17a2b8'};
  text-transform: uppercase;
  white-space: nowrap;
  min-width: 100px;
`;

const ResultLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #17a2b8;
  text-transform: uppercase;
  white-space: nowrap;
  min-width: 160px;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  flex: 1;
  padding: 6px 12px;
  border: 1px solid ${props => props.$hasError ? '#dc3545' : '#ced4da'};
  border-radius: 4px;
  font-size: 14px;
  background: ${props => props.$hasError ? '#fff8f8' : 'white'};
  min-width: 0;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#dc3545' : '#17a2b8'};
    box-shadow: 0 0 0 0.2rem ${props => props.$hasError ? 'rgba(220, 53, 69, 0.25)' : 'rgba(23, 162, 184, 0.25)'};
  }

  &:disabled, &[readonly] {
    background: #e9ecef;
  }
`;

const Select = styled.select<{ $hasError?: boolean }>`
  flex: 1;
  padding: 6px 12px;
  border: 1px solid ${props => props.$hasError ? '#dc3545' : '#ced4da'};
  border-radius: 4px;
  font-size: 14px;
  background: ${props => props.$hasError ? '#fff8f8' : 'white'};
  min-width: 0;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#dc3545' : '#17a2b8'};
    box-shadow: 0 0 0 0.2rem ${props => props.$hasError ? 'rgba(220, 53, 69, 0.25)' : 'rgba(23, 162, 184, 0.25)'};
  }
`;

const ButtonSuccess = styled.button`
  background: #17a2b8;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: #138496;
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
  padding: 8px 24px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: #e2e6ea;
  }
`;

const ButtonGreen = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  width: 100%;

  &:hover {
    background: #218838;
  }
`;

const ResultSection = styled.div`
  h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 12px 0;
    color: #333;
  }
`;

const ReadOnlyValue = styled.span`
  flex: 1;
  padding: 6px 0;
  font-size: 14px;
  color: #333;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

// Diálogo de confirmación (igual que en Laravel)
const ConfirmOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1200;
`;

const ConfirmDialog = styled.div`
  background: white;
  border-radius: 4px;
  padding: 20px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  text-align: center;
`;

const ConfirmMessage = styled.p`
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #333;
`;

const ConfirmButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
`;

// =============================================
// VALORES INICIALES
// =============================================

const INITIAL_FORM: CalculoFormData = {
  tipo_calculo: 1,
  interno_largo: null,
  interno_ancho: null,
  interno_alto: null,
  style_id: null,
  traslape: null,
  areahc_product_type_id: null,
  prepicado_ventilacion: 0,
  onda_id: null,
  process_id: null,
  rubro_id: null,
  carton_color: null,
  ect_min_ingresado: null,
  envase_id: null,
  contenido_caja: null,
  areahc_pallets_apilados: null,
  cajas_apiladas_por_pallet: null,
  filas_columnares_por_pallet: null,
  numero_colores: null,
  rmt: null,
};

const INITIAL_RESULT: CalculoResult = {
  externo_largo: null,
  externo_ancho: null,
  externo_alto: null,
  areahc: null,
  rmt_resultado: null,
  ect_min: null,
  codigo_carton_id: null,
  codigo_carton: '',
  ect_min_carton: null,
  interno_largo: null,
  interno_ancho: null,
  interno_alto: null,
  rubro_id: null,
  process_id: null,
  product_type_id: null,
  numero_colores: null,
};

const DEFAULT_OPTIONS: FormOptions = {
  styles: [],
  product_types: [],
  processes: [],
  rubros: [],
  ondas: [],
  envases: [],
  tipos_calculo: [
    { id: 1, nombre: 'Cálculo HC y Cartón' },
    { id: 2, nombre: 'Cálculo HC' },
    { id: 3, nombre: 'Cartón' },
  ],
  colores_carton: [
    { id: 1, nombre: 'Café' },
    { id: 2, nombre: 'Blanco' },
  ],
  prepicado_ventilacion: [
    { id: 0, nombre: 'No' },
    { id: 1, nombre: 'Sí' },
  ],
  numero_colores: [
    { id: 0, nombre: '0' },
    { id: 1, nombre: '1' },
    { id: 2, nombre: '2' },
    { id: 3, nombre: '3' },
    { id: 4, nombre: '4' },
    { id: 5, nombre: '5' },
  ],
};

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export default function CalculoHCModal({
  mode,
  onClose,
  onApply
}: CalculoHCModalProps) {
  const [formData, setFormData] = useState<CalculoFormData>(() => {
    const initialType = mode === 'carton' ? 3 : mode === 'calculo_hc' ? 2 : 1;
    return { ...INITIAL_FORM, tipo_calculo: initialType };
  });
  const [result, setResult] = useState<CalculoResult>(INITIAL_RESULT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [options, setOptions] = useState<FormOptions>(DEFAULT_OPTIONS);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch form options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/areahc/form-options`);
        if (response.ok) {
          const data = await response.json();
          setOptions(prev => ({
            ...prev,
            styles: data.styles || [],
            product_types: data.product_types || [],
            processes: data.processes || [],
            rubros: data.rubros || [],
            ondas: data.ondas || [],
            envases: data.envases || [],
            tipos_calculo: data.tipos_calculo || prev.tipos_calculo,
            colores_carton: data.colores_carton || prev.colores_carton,
            prepicado_ventilacion: data.prepicado_ventilacion || prev.prepicado_ventilacion,
            numero_colores: data.numero_colores || prev.numero_colores,
          }));
        }
      } catch (error) {
        console.error('Error fetching form options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // Determinar qué campos mostrar según tipo de cálculo
  const tipoCalculo = formData.tipo_calculo;
  const isCompleto = tipoCalculo === 1;
  const isCalculoHC = tipoCalculo === 2;
  const isCarton = tipoCalculo === 3;
  const showHCFields = isCompleto || isCalculoHC;
  const showCartonFields = isCompleto || isCarton;

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    let parsedValue: string | number | null = value;

    if (type === 'number') {
      parsedValue = value === '' ? null : parseFloat(value);
    } else if (e.target.tagName === 'SELECT') {
      parsedValue = value === '' ? null : parseInt(value);
    }

    setFormData(prev => ({ ...prev, [name]: parsedValue }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    // Reset results when tipo_calculo changes
    if (name === 'tipo_calculo') {
      setResult(INITIAL_RESULT);
      setShowResults(false);
      setErrors({});
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const tipo = formData.tipo_calculo;

    // Validación para Cálculo HC (tipo 2) y Completo (tipo 1)
    if (tipo === 1 || tipo === 2) {
      if (!formData.interno_largo || formData.interno_largo <= 0) {
        newErrors.interno_largo = 'Campo requerido';
      }
      if (!formData.interno_ancho || formData.interno_ancho <= 0) {
        newErrors.interno_ancho = 'Campo requerido';
      }
      if (!formData.interno_alto || formData.interno_alto <= 0) {
        newErrors.interno_alto = 'Campo requerido';
      }
      if (!formData.style_id) {
        newErrors.style_id = 'Seleccione un estilo';
      }
      // Tipo item (areahc_product_type_id) is NOT required - same as Laravel
      if (!formData.onda_id) {
        newErrors.onda_id = 'Seleccione tipo de onda';
      }
      if (!formData.process_id) {
        newErrors.process_id = 'Seleccione un proceso';
      }
    }

    // Validación para Cartón (tipo 3) y Completo (tipo 1)
    if (tipo === 1 || tipo === 3) {
      if (!formData.onda_id) {
        newErrors.onda_id = 'Seleccione tipo de onda';
      }
      if (!formData.rubro_id) {
        newErrors.rubro_id = 'Seleccione un rubro';
      }
      if (!formData.carton_color) {
        newErrors.carton_color = 'Seleccione color de cartón';
      }
    }

    // ECT solo es requerido en modo Cartón puro (tipo 3)
    if (tipo === 3) {
      if (!formData.ect_min_ingresado || formData.ect_min_ingresado <= 0) {
        newErrors.ect_min_ingresado = 'Ingrese ECT mínimo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleCalcular = useCallback(async () => {
    // Validate first
    if (!validateForm()) {
      return;
    }

    setCalculating(true);

    try {
      const response = await fetch(`${API_BASE}/areahc/calcular`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          setResult({
            externo_largo: data.externo_largo,
            externo_ancho: data.externo_ancho,
            externo_alto: data.externo_alto,
            areahc: data.areahc,
            rmt_resultado: data.rmt,
            ect_min: data.ect_min,
            codigo_carton_id: data.codigo_carton_id,
            codigo_carton: data.codigo_carton || '',
            ect_min_carton: data.ect_min_carton,
            // Campos del formulario (se llenarán en handleConfirmTransfer)
            interno_largo: formData.interno_largo,
            interno_ancho: formData.interno_ancho,
            interno_alto: formData.interno_alto,
            rubro_id: formData.rubro_id,
            process_id: formData.process_id,
            product_type_id: formData.areahc_product_type_id,
            numero_colores: formData.numero_colores,
          });
          setShowResults(true);
        } else {
          console.error('Calculation error:', data.error);
          alert(data.error || 'Error en el cálculo');
        }
      } else {
        console.error('API error:', response.status);
        alert('Error al comunicarse con el servidor');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Error de conexión');
    } finally {
      setCalculating(false);
    }
  }, [formData, validateForm]);

  const handleLimpiar = useCallback(() => {
    const initialType = mode === 'carton' ? 3 : mode === 'calculo_hc' ? 2 : 1;
    setFormData({ ...INITIAL_FORM, tipo_calculo: initialType });
    setResult(INITIAL_RESULT);
    setErrors({});
    setShowResults(false);
  }, [mode]);

  // Mostrar diálogo de confirmación al presionar "Llevar a Detalle"
  const handleLlevarADetalle = useCallback(() => {
    if (showResults) {
      setShowConfirmDialog(true);
    }
  }, [showResults]);

  // Confirmar y transferir datos al formulario principal (como en Laravel)
  const handleConfirmTransfer = useCallback(() => {
    if (onApply && showResults) {
      // Combinar resultados del cálculo con datos del formulario
      const fullResult: CalculoResult = {
        ...result,
        interno_largo: formData.interno_largo,
        interno_ancho: formData.interno_ancho,
        interno_alto: formData.interno_alto,
        rubro_id: formData.rubro_id,
        process_id: formData.process_id,
        product_type_id: formData.areahc_product_type_id,
        numero_colores: formData.numero_colores,
      };
      onApply(fullResult);
      setShowConfirmDialog(false);
      onClose();
    }
  }, [onApply, result, showResults, formData, onClose]);

  const handleCancelTransfer = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  // =============================================
  // RENDER - Modo Cartón (tipo 3)
  // =============================================
  const renderCartonMode = () => (
    <Row>
      {/* Campos de entrada en 2 filas de 2 columnas */}
      <Col $size={8}>
        {/* Fila 1: Tipo de Onda | Color Cartón */}
        <Row style={{ marginBottom: '16px' }}>
          <Col $size={6}>
            <FormGroup>
              <FormRow>
                <Label $hasError={!!errors.onda_id}>Tipo de Onda:</Label>
                <Select
                  name="onda_id"
                  value={formData.onda_id ?? ''}
                  onChange={handleChange}
                  $hasError={!!errors.onda_id}
                  disabled={loading}
                  data-testid="select-onda"
                >
                  <option value="">-</option>
                  {options.ondas.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </Select>
              </FormRow>
            </FormGroup>
          </Col>
          <Col $size={6}>
            <FormGroup>
              <FormRow>
                <Label $hasError={!!errors.carton_color}>Color Cartón:</Label>
                <Select
                  name="carton_color"
                  value={formData.carton_color ?? ''}
                  onChange={handleChange}
                  $hasError={!!errors.carton_color}
                  data-testid="select-color-carton"
                >
                  <option value="">-</option>
                  {options.colores_carton.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </Select>
              </FormRow>
            </FormGroup>
          </Col>
        </Row>

        {/* Fila 2: Rubro | ECT min */}
        <Row>
          <Col $size={6}>
            <FormGroup>
              <FormRow>
                <Label $hasError={!!errors.rubro_id}>Rubro:</Label>
                <Select
                  name="rubro_id"
                  value={formData.rubro_id ?? ''}
                  onChange={handleChange}
                  $hasError={!!errors.rubro_id}
                  disabled={loading}
                  data-testid="select-rubro"
                >
                  <option value="">-</option>
                  {options.rubros.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </Select>
              </FormRow>
            </FormGroup>
          </Col>
          <Col $size={6}>
            <FormGroup>
              <FormRow>
                <Label $hasError={!!errors.ect_min_ingresado}>ECT min (lbf):</Label>
                <Input
                  type="number"
                  name="ect_min_ingresado"
                  value={formData.ect_min_ingresado ?? ''}
                  onChange={handleChange}
                  $hasError={!!errors.ect_min_ingresado}
                  data-testid="input-ect-min"
                />
              </FormRow>
            </FormGroup>
          </Col>
        </Row>
      </Col>

      {/* Columna de Resultados */}
      <Col $size={4}>
        <ResultSection>
          <h3>Resultados</h3>
          <FormGroup>
            <FormRow>
              <ResultLabel>Largo Exterior (mm):</ResultLabel>
              <ReadOnlyValue data-testid="result-largo">{showResults ? (result.externo_largo ?? '') : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>
          <FormGroup>
            <FormRow>
              <ResultLabel>Ancho Exterior (mm):</ResultLabel>
              <ReadOnlyValue data-testid="result-ancho">{showResults ? (result.externo_ancho ?? '') : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>
          <FormGroup>
            <FormRow>
              <ResultLabel>Alto Exterior (mm):</ResultLabel>
              <ReadOnlyValue data-testid="result-alto">{showResults ? (result.externo_alto ?? '') : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>
          <FormGroup>
            <FormRow>
              <ResultLabel>Area HC (m2):</ResultLabel>
              <ReadOnlyValue data-testid="result-areahc">{showResults ? (result.areahc ?? '') : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>
          <FormGroup>
            <FormRow>
              <ResultLabel>RMT (lb):</ResultLabel>
              <ReadOnlyValue data-testid="result-rmt">{showResults ? (result.rmt_resultado ?? '') : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>
          <FormGroup>
            <FormRow>
              <ResultLabel>ECT min (lbf):</ResultLabel>
              <ReadOnlyValue data-testid="result-ect">{showResults ? (result.ect_min ?? '') : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>

          <h3>Cartón Seleccionado</h3>
          <FormGroup>
            <FormRow>
              <ResultLabel>Código Cartón:</ResultLabel>
              <ReadOnlyValue data-testid="result-codigo-carton">{showResults ? result.codigo_carton : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>
          <FormGroup>
            <FormRow>
              <ResultLabel>ECT min (lbf) Cartón:</ResultLabel>
              <ReadOnlyValue data-testid="result-ect-carton">{showResults ? (result.ect_min_carton ?? '') : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>

          {showResults && (
            <ButtonGreen
              type="button"
              onClick={handleLlevarADetalle}
              style={{ marginTop: '16px' }}
              data-testid="btn-llevar-detalle"
            >
              Llevar a Detalle
            </ButtonGreen>
          )}
        </ResultSection>
      </Col>
    </Row>
  );

  // =============================================
  // RENDER - Modo Completo o Cálculo HC (tipo 1 o 2)
  // =============================================
  const renderFullMode = () => (
    <Row>
      {/* Columna 1 - Campos de entrada izquierda */}
      <Col $size={4}>
        {showHCFields && (
          <>
            <FormGroup>
              <FormRow>
                <Label $hasError={!!errors.interno_largo}>Largo (mm):</Label>
                <Input
                  type="number"
                  name="interno_largo"
                  value={formData.interno_largo ?? ''}
                  onChange={handleChange}
                  $hasError={!!errors.interno_largo}
                  data-testid="input-largo"
                />
              </FormRow>
            </FormGroup>

            <FormGroup>
              <FormRow>
                <Label $hasError={!!errors.interno_ancho}>Ancho (mm):</Label>
                <Input
                  type="number"
                  name="interno_ancho"
                  value={formData.interno_ancho ?? ''}
                  onChange={handleChange}
                  $hasError={!!errors.interno_ancho}
                  data-testid="input-ancho"
                />
              </FormRow>
            </FormGroup>

            <FormGroup>
              <FormRow>
                <Label $hasError={!!errors.interno_alto}>Alto (mm):</Label>
                <Input
                  type="number"
                  name="interno_alto"
                  value={formData.interno_alto ?? ''}
                  onChange={handleChange}
                  $hasError={!!errors.interno_alto}
                  data-testid="input-alto"
                />
              </FormRow>
            </FormGroup>

            <FormGroup>
              <FormRow>
                <Label $hasError={!!errors.style_id}>Estilo:</Label>
                <Select
                  name="style_id"
                  value={formData.style_id ?? ''}
                  onChange={handleChange}
                  $hasError={!!errors.style_id}
                  disabled={loading}
                  data-testid="select-estilo"
                >
                  <option value="">Seleccionar...</option>
                  {options.styles.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </Select>
              </FormRow>
            </FormGroup>

            <FormGroup>
              <FormRow>
                <Label>Traslape [mm]:</Label>
                <Input
                  type="number"
                  name="traslape"
                  value={formData.traslape ?? ''}
                  onChange={handleChange}
                  data-testid="input-traslape"
                />
              </FormRow>
            </FormGroup>

            <FormGroup>
              <FormRow>
                <Label $hasError={!!errors.areahc_product_type_id}>Tipo item:</Label>
                <Select
                  name="areahc_product_type_id"
                  value={formData.areahc_product_type_id ?? ''}
                  onChange={handleChange}
                  $hasError={!!errors.areahc_product_type_id}
                  disabled={loading}
                  data-testid="select-tipo-item"
                >
                  <option value="">Seleccionar...</option>
                  {options.product_types.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </Select>
              </FormRow>
            </FormGroup>

            {isCompleto && (
              <FormGroup>
                <FormRow>
                  <Label>Prepicado:</Label>
                  <Select
                    name="prepicado_ventilacion"
                    value={formData.prepicado_ventilacion}
                    onChange={handleChange}
                    data-testid="select-prepicado"
                  >
                    {options.prepicado_ventilacion.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                    ))}
                  </Select>
                </FormRow>
              </FormGroup>
            )}

            <FormGroup>
              <FormRow>
                <Label $hasError={!!errors.onda_id}>Tipo de Onda:</Label>
                <Select
                  name="onda_id"
                  value={formData.onda_id ?? ''}
                  onChange={handleChange}
                  $hasError={!!errors.onda_id}
                  disabled={loading}
                  data-testid="select-onda"
                >
                  <option value="">Seleccionar...</option>
                  {options.ondas.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </Select>
              </FormRow>
            </FormGroup>

            <FormGroup>
              <FormRow>
                <Label $hasError={!!errors.process_id}>Proceso:</Label>
                <Select
                  name="process_id"
                  value={formData.process_id ?? ''}
                  onChange={handleChange}
                  $hasError={!!errors.process_id}
                  disabled={loading}
                  data-testid="select-proceso"
                >
                  <option value="">Seleccionar...</option>
                  {options.processes.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </Select>
              </FormRow>
            </FormGroup>

            {showCartonFields && (
              <FormGroup>
                <FormRow>
                  <Label $hasError={!!errors.rubro_id}>Rubro:</Label>
                  <Select
                    name="rubro_id"
                    value={formData.rubro_id ?? ''}
                    onChange={handleChange}
                    $hasError={!!errors.rubro_id}
                    disabled={loading}
                    data-testid="select-rubro"
                  >
                    <option value="">Seleccionar...</option>
                    {options.rubros.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                    ))}
                  </Select>
                </FormRow>
              </FormGroup>
            )}
          </>
        )}
      </Col>

      {/* Columna 2 - Campos adicionales centro */}
      <Col $size={4}>
        {showHCFields && isCompleto && (
          <>
            <FormGroup>
              <FormRow>
                <Label>Envase Primario:</Label>
                <Select
                  name="envase_id"
                  value={formData.envase_id ?? ''}
                  onChange={handleChange}
                  disabled={loading}
                  data-testid="select-envase"
                >
                  <option value="">Seleccionar...</option>
                  {options.envases.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </Select>
              </FormRow>
            </FormGroup>

            <FormGroup>
              <FormRow>
                <Label>Contenido Caja (Kg):</Label>
                <Input
                  type="number"
                  name="contenido_caja"
                  value={formData.contenido_caja ?? ''}
                  onChange={handleChange}
                  data-testid="input-contenido-caja"
                />
              </FormRow>
            </FormGroup>

            <FormGroup>
              <FormRow>
                <Label>N° Palets apilados:</Label>
                <Input
                  type="number"
                  name="areahc_pallets_apilados"
                  value={formData.areahc_pallets_apilados ?? ''}
                  onChange={handleChange}
                  data-testid="input-pallets"
                />
              </FormRow>
            </FormGroup>

            <FormGroup>
              <FormRow>
                <Label>N° Cajas Apiladas:</Label>
                <Input
                  type="number"
                  name="cajas_apiladas_por_pallet"
                  value={formData.cajas_apiladas_por_pallet ?? ''}
                  onChange={handleChange}
                  data-testid="input-cajas-apiladas"
                />
              </FormRow>
            </FormGroup>

            <FormGroup>
              <FormRow>
                <Label>N° Filas Colum.:</Label>
                <Input
                  type="number"
                  name="filas_columnares_por_pallet"
                  value={formData.filas_columnares_por_pallet ?? ''}
                  onChange={handleChange}
                  data-testid="input-filas"
                />
              </FormRow>
            </FormGroup>

            <FormGroup>
              <FormRow>
                <Label $hasError={!!errors.carton_color}>Color Cartón:</Label>
                <Select
                  name="carton_color"
                  value={formData.carton_color ?? ''}
                  onChange={handleChange}
                  $hasError={!!errors.carton_color}
                  data-testid="select-color-carton"
                >
                  <option value="">Seleccionar...</option>
                  {options.colores_carton.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </Select>
              </FormRow>
            </FormGroup>

            <FormGroup>
              <FormRow>
                <Label>Número Colores:</Label>
                <Select
                  name="numero_colores"
                  value={formData.numero_colores ?? ''}
                  onChange={handleChange}
                  data-testid="select-numero-colores"
                >
                  <option value="">Seleccionar...</option>
                  {options.numero_colores.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </Select>
              </FormRow>
            </FormGroup>

            <FormGroup>
              <FormRow>
                <Label>RMT (Lb):</Label>
                <Input
                  type="number"
                  name="rmt"
                  value={formData.rmt ?? ''}
                  onChange={handleChange}
                  data-testid="input-rmt"
                />
              </FormRow>
            </FormGroup>
          </>
        )}
      </Col>

      {/* Columna 3 - Resultados */}
      <Col $size={4}>
        <ResultSection>
          <h3>Resultados</h3>

          <FormGroup>
            <FormRow>
              <ResultLabel>Largo Exterior (mm):</ResultLabel>
              <ReadOnlyValue data-testid="result-largo">{showResults ? (result.externo_largo ?? '') : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>

          <FormGroup>
            <FormRow>
              <ResultLabel>Ancho Exterior (mm):</ResultLabel>
              <ReadOnlyValue data-testid="result-ancho">{showResults ? (result.externo_ancho ?? '') : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>

          <FormGroup>
            <FormRow>
              <ResultLabel>Alto Exterior (mm):</ResultLabel>
              <ReadOnlyValue data-testid="result-alto">{showResults ? (result.externo_alto ?? '') : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>

          <FormGroup>
            <FormRow>
              <ResultLabel>Area HC (m2):</ResultLabel>
              <ReadOnlyValue data-testid="result-areahc">{showResults ? (result.areahc ?? '') : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>

          <FormGroup>
            <FormRow>
              <ResultLabel>RMT (lb):</ResultLabel>
              <ReadOnlyValue data-testid="result-rmt">{showResults ? (result.rmt_resultado ?? '') : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>

          <FormGroup>
            <FormRow>
              <ResultLabel>ECT min (lbf):</ResultLabel>
              <ReadOnlyValue data-testid="result-ect">{showResults ? (result.ect_min ?? '') : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>

          <h3>Cartón Seleccionado</h3>

          <FormGroup>
            <FormRow>
              <ResultLabel>Código Cartón:</ResultLabel>
              <ReadOnlyValue data-testid="result-codigo-carton">{showResults ? result.codigo_carton : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>

          <FormGroup>
            <FormRow>
              <ResultLabel>ECT min (lbf) Cartón:</ResultLabel>
              <ReadOnlyValue data-testid="result-ect-carton">{showResults ? (result.ect_min_carton ?? '') : ''}</ReadOnlyValue>
            </FormRow>
          </FormGroup>

          {showResults && (
            <ButtonGreen
              type="button"
              onClick={handleLlevarADetalle}
              style={{ marginTop: '16px' }}
              data-testid="btn-llevar-detalle"
            >
              Llevar a Detalle
            </ButtonGreen>
          )}
        </ResultSection>
      </Col>
    </Row>
  );

  return (
    <>
      <ModalOverlay data-testid="modal-calculo-hc">
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Cálculo HC y Cartón</ModalTitle>
            <CloseButton onClick={onClose} data-testid="btn-close">&times;</CloseButton>
          </ModalHeader>

          <ModalBody>
            <CardContainer>
              {/* Tipo de Cálculo - Centrado arriba */}
              <Row style={{ marginBottom: '24px' }}>
                <Col $size={4} $offset={4}>
                  <FormGroup>
                    <FormRow>
                      <Label>Tipo de Cálculo</Label>
                      <Select
                        name="tipo_calculo"
                        value={formData.tipo_calculo}
                        onChange={handleChange}
                        disabled={loading}
                        data-testid="select-tipo-calculo"
                      >
                        {options.tipos_calculo.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                        ))}
                      </Select>
                    </FormRow>
                  </FormGroup>
                </Col>
              </Row>

              {/* Contenido según tipo de cálculo */}
              {isCarton ? renderCartonMode() : renderFullMode()}
            </CardContainer>

            {/* Botones de acción */}
            <ButtonRow>
              <ButtonLight onClick={onClose} data-testid="btn-cancelar">
                Cancelar
              </ButtonLight>
              <ButtonLight onClick={handleLimpiar} data-testid="btn-limpiar">
                Limpiar
              </ButtonLight>
              <ButtonSuccess onClick={handleCalcular} disabled={calculating} data-testid="btn-calcular">
                {calculating ? 'Calculando...' : 'Calcular'}
              </ButtonSuccess>
            </ButtonRow>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>

      {/* Diálogo de confirmación - igual que en Laravel */}
      {showConfirmDialog && (
        <ConfirmOverlay>
          <ConfirmDialog>
            <ConfirmMessage>
              {formData.carton_color
                ? 'Cartón estimado, favor validar este dato con desarrollo'
                : 'Área Hoja Corrugada estimada, favor validar este dato con desarrollo'}
            </ConfirmMessage>
            <ConfirmButtons>
              <ButtonLight onClick={handleCancelTransfer}>
                Cancelar
              </ButtonLight>
              <ButtonSuccess onClick={handleConfirmTransfer}>
                Confirmo
              </ButtonSuccess>
            </ConfirmButtons>
          </ConfirmDialog>
        </ConfirmOverlay>
      )}
    </>
  );
}
