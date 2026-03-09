/**
 * EditWorkOrder Component
 * Formulario completo para editar una Orden de Trabajo existente
 * Incluye secciones 1-14 como en Laravel original
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { theme } from '../../theme';
import { CascadeForm } from '../../components/CascadeForm';
import { workOrdersApi, type WorkOrderUpdateData } from '../../services/api';
import { useWorkOrderDetail, useWorkOrderFilterOptions, useFormOptionsComplete } from '../../hooks/useWorkOrders';
import type { CascadeFormData } from '../../types/cascade';

// Styled Components
const Container = styled.div`
  padding: 1.5rem;
  max-width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid ${theme.colors.primary};
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const BackButton = styled.button`
  padding: 0.5rem 1.25rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 50px;
  background: white;
  color: ${theme.colors.textSecondary};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }
`;

const FormSection = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const SectionHeader = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 0.75rem 1rem;
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: 8px 8px 0 0;
`;

const SectionBody = styled.div`
  padding: 1rem;
`;

const FormGrid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.$columns || 3}, 1fr);
  gap: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// Grid específico para Sección 8 con 4 columnas
const FormGridSection8 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 0.75rem;
  width: 100%;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// Contenedor para secciones 9, 10 y 11 en fila horizontal
const SectionsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  width: 100%;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormSectionCompact = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  margin-bottom: 0.25rem;
  text-transform: uppercase;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${theme.colors.textPrimary};
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const SubmitButton = styled.button`
  padding: 0.75rem 2rem;
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #002d66;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid ${theme.colors.border};
`;

const Alert = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: 1rem;
  border-radius: 8px;
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

  ${props => props.$type === 'info' && `
    background: #cce5ff;
    color: #004085;
    border: 1px solid #b8daff;
  `}
`;

const LoadingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: ${theme.colors.textSecondary};
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.border};
  border-top-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 0.75rem;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const InfoBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: ${theme.colors.primary}15;
  color: ${theme.colors.primary};
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
`;

// Types
interface EditWorkOrderProps {
  otId: number;
  onNavigate: (page: string, otId?: number) => void;
}

interface FormState {
  // Datos Comerciales (Sección 1)
  client_id: number | null;
  descripcion: string;
  tipo_solicitud: number | null;
  canal_id: number | null;
  org_venta_id: number | null;
  nombre_contacto: string;
  email_contacto: string;
  telefono_contacto: string;
  volumen_venta_anual: number | null;
  codigo_producto: string;
  // Jerarquías
  hierarchy_id: number | null;
  subhierarchy_id: number | null;
  subsubhierarchy_id: number | null;
  // Antecedentes Desarrollo (Sección 2)
  ant_des_correo_cliente: boolean;
  ant_des_plano_actual: boolean;
  ant_des_boceto_actual: boolean;
  ant_des_spec: boolean;
  ant_des_otro: boolean;
  ant_des_cj_referencia_de: boolean;
  ant_des_cj_referencia_dg: boolean;
  ant_des_envase_primario: boolean;
  ant_des_conservar_muestra: boolean | null;
  armado_automatico: boolean | null;
  // Solicita
  analisis: boolean;
  prueba_industrial: boolean;
  muestra: boolean;
  numero_muestras: number | null;
  // Cascade fields (Sección 6)
  cascadeData: CascadeFormData;
  // Sección 7: Características
  cad_id: number | null;
  style_id: number | null;
  items_set: number | null;
  veces_item: number | null;
  largura_hm: number | null;
  anchura_hm: number | null;
  area_producto: number | null;
  recorte_adicional: number | null;
  longitud_pegado: number | null;
  golpes_largo: number | null;
  golpes_ancho: number | null;
  separacion_golpes_largo: number | null;
  separacion_golpes_ancho: number | null;
  rayado_c1r1: number | null;
  rayado_r1_r2: number | null;
  rayado_r2_c2: number | null;
  pallet_qa_id: number | null;
  pais_id: number | null;
  restriccion_pallet: number | null;
  tamano_pallet_type_id: number | null;
  altura_pallet: number | null;
  permite_sobresalir_carga: number | null;
  // Especificaciones técnicas
  bct_min_lb: number | null;
  bct_min_kg: number | null;
  bct_humedo_lb: number | null;
  ect: number | null;
  gramaje: number | null;
  mullen: number | null;
  fct: number | null;
  espesor: number | null;
  cobb_interior: number | null;
  cobb_exterior: number | null;
  flexion_aleta: number | null;
  peso: number | null;
  // Sección 8: Color-Cera-Barniz
  trazabilidad: number | null;
  design_type_id: number | null;
  complejidad: string;
  numero_colores: number | null;
  color_1_id: number | null;
  color_2_id: number | null;
  color_3_id: number | null;
  color_4_id: number | null;
  color_5_id: number | null;
  color_6_id: number | null;
  impresion_1: number | null;
  impresion_2: number | null;
  impresion_3: number | null;
  impresion_4: number | null;
  impresion_5: number | null;
  impresion_6: number | null;
  barniz_uv: number | null;
  porcentanje_barniz_uv: number | null;
  cera_exterior: number | null;
  porcentaje_cera_exterior: number | null;
  cera_interior: number | null;
  porcentaje_cera_interior: number | null;
  barniz_interior: number | null;
  porcentaje_barniz_interior: number | null;
  percentage_coverage_internal: number | null;
  percentage_coverage_external: number | null;
  // Medidas (Secciones 9-10)
  interno_largo: number | null;
  interno_ancho: number | null;
  interno_alto: number | null;
  externo_largo: number | null;
  externo_ancho: number | null;
  externo_alto: number | null;
  // Terminaciones (Sección 11)
  process_id: number | null;
  armado_id: number | null;
  sentido_armado: number | null;
  pegado_terminacion: number | null;
  maquila: number | null;
  maquila_servicio_id: number | null;
  // Sección 13: Datos para desarrollo
  product_type_developing_id: number | null;
  food_type_id: number | null;
  expected_use_id: number | null;
  recycled_use_id: number | null;
  class_substance_packed_id: number | null;
  transportation_way_id: number | null;
  peso_contenido_caja: number | null;
  envase_id: number | null;
  autosoportante: boolean;
  cajas_altura: number | null;
  pallet_sobre_pallet: boolean | null;
  cantidad: number | null;
  target_market_id: number | null;
  // Material asignado
  material_asignado: string;
  descripcion_material: string;
  observacion: string;
  planta_id: number | null;
}

const TIPO_SOLICITUD_OPTIONS = [
  { id: 1, nombre: 'Desarrollo Completo' },
  { id: 3, nombre: 'Muestra con CAD' },
  { id: 5, nombre: 'Arte con Material' },
  { id: 6, nombre: 'Otras Solicitudes Desarrollo' },
  { id: 7, nombre: 'OT Proyectos Innovación' },
];

export default function EditWorkOrder({ otId, onNavigate }: EditWorkOrderProps) {
  const [formState, setFormState] = useState<FormState | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: otData, isLoading: otLoading, error: otError } = useWorkOrderDetail(otId);
  const { data: filterOptions, isLoading: optionsLoading } = useWorkOrderFilterOptions();
  const { data: formOptions, isLoading: formOptionsLoading } = useFormOptionsComplete();

  // Filtrar subjerarquías basado en jerarquía seleccionada
  const filteredSubhierarchies = useMemo(() => {
    if (!formOptions?.subhierarchies || !formState?.hierarchy_id) return [];
    return formOptions.subhierarchies.filter(
      sh => sh.hierarchy_id === formState.hierarchy_id
    );
  }, [formOptions?.subhierarchies, formState?.hierarchy_id]);

  // Filtrar subsubjerarquías basado en subjerarquía seleccionada
  const filteredSubsubhierarchies = useMemo(() => {
    if (!formOptions?.subsubhierarchies || !formState?.subhierarchy_id) return [];
    return formOptions.subsubhierarchies.filter(
      ssh => ssh.subhierarchy_id === formState.subhierarchy_id
    );
  }, [formOptions?.subsubhierarchies, formState?.subhierarchy_id]);

  // Cargar datos de la OT al formulario
  useEffect(() => {
    if (otData) {
      const ot = otData as Record<string, unknown>;
      setFormState({
        client_id: ot.client_id as number | null,
        descripcion: (ot.descripcion as string) || '',
        tipo_solicitud: ot.tipo_solicitud as number | null,
        canal_id: ot.canal_id as number | null,
        org_venta_id: ot.org_venta_id as number | null,
        nombre_contacto: (ot.nombre_contacto as string) || '',
        email_contacto: (ot.email_contacto as string) || '',
        telefono_contacto: (ot.telefono_contacto as string) || '',
        volumen_venta_anual: ot.volumen_venta_anual as number | null,
        codigo_producto: (ot.codigo_producto as string) || '',
        // Jerarquías
        hierarchy_id: ot.hierarchy_id as number | null,
        subhierarchy_id: ot.subhierarchy_id as number | null,
        subsubhierarchy_id: ot.subsubhierarchy_id as number | null,
        // Antecedentes Desarrollo
        ant_des_correo_cliente: ot.ant_des_correo_cliente === 1,
        ant_des_plano_actual: ot.ant_des_plano_actual === 1,
        ant_des_boceto_actual: ot.ant_des_boceto_actual === 1,
        ant_des_spec: ot.ant_des_spec === 1,
        ant_des_otro: ot.ant_des_otro === 1,
        ant_des_cj_referencia_de: ot.ant_des_cj_referencia_de === 1,
        ant_des_cj_referencia_dg: ot.ant_des_cj_referencia_dg === 1,
        ant_des_envase_primario: ot.ant_des_envase_primario === 1,
        ant_des_conservar_muestra: ot.ant_des_conservar_muestra === null ? null : ot.ant_des_conservar_muestra === 1,
        armado_automatico: ot.armado_automatico === null ? null : ot.armado_automatico === 1,
        // Solicita
        analisis: ot.analisis === 1,
        prueba_industrial: ot.prueba_industrial === 1,
        muestra: ot.muestra === 1,
        numero_muestras: ot.numero_muestras as number | null,
        // Cascade fields
        cascadeData: {
          productTypeId: ot.product_type_id as number | null,
          impresion: ot.impresion != null ? String(ot.impresion) : null,
          fsc: ot.fsc as string | null,
          cinta: ot.cinta != null ? String(ot.cinta) : null,
          coverageInternalId: ot.coverage_internal_id as number | null,
          coverageExternalId: ot.coverage_external_id as number | null,
          plantaId: ot.planta_id as number | null,
          cartonColor: ot.carton_color != null ? String(ot.carton_color) : null,
          cartonId: ot.carton_id as number | null,
        },
        // Sección 7
        cad_id: ot.cad_id as number | null,
        style_id: ot.style_id as number | null,
        items_set: ot.items_set as number | null,
        veces_item: ot.veces_item as number | null,
        largura_hm: ot.largura_hm as number | null,
        anchura_hm: ot.anchura_hm as number | null,
        area_producto: ot.area_producto as number | null,
        recorte_adicional: ot.recorte_adicional as number | null,
        longitud_pegado: ot.longitud_pegado as number | null,
        golpes_largo: ot.golpes_largo as number | null,
        golpes_ancho: ot.golpes_ancho as number | null,
        separacion_golpes_largo: ot.separacion_golpes_largo as number | null,
        separacion_golpes_ancho: ot.separacion_golpes_ancho as number | null,
        rayado_c1r1: ot.rayado_c1r1 as number | null,
        rayado_r1_r2: ot.rayado_r1_r2 as number | null,
        rayado_r2_c2: ot.rayado_r2_c2 as number | null,
        pallet_qa_id: ot.pallet_qa_id as number | null,
        pais_id: ot.pais_id as number | null,
        restriccion_pallet: ot.restriccion_pallet as number | null,
        tamano_pallet_type_id: ot.tamano_pallet_type_id as number | null,
        altura_pallet: ot.altura_pallet as number | null,
        permite_sobresalir_carga: ot.permite_sobresalir_carga as number | null,
        // Especificaciones técnicas
        bct_min_lb: ot.bct_min_lb as number | null,
        bct_min_kg: ot.bct_min_kg as number | null,
        bct_humedo_lb: ot.bct_humedo_lb as number | null,
        ect: ot.ect as number | null,
        gramaje: ot.gramaje as number | null,
        mullen: ot.mullen as number | null,
        fct: ot.fct as number | null,
        espesor: ot.espesor as number | null,
        cobb_interior: ot.cobb_interior as number | null,
        cobb_exterior: ot.cobb_exterior as number | null,
        flexion_aleta: ot.flexion_aleta as number | null,
        peso: ot.peso as number | null,
        // Sección 8
        trazabilidad: ot.trazabilidad as number | null,
        design_type_id: ot.design_type_id as number | null,
        complejidad: (ot.complejidad as string) || '',
        numero_colores: ot.numero_colores as number | null,
        color_1_id: ot.color_1_id as number | null,
        color_2_id: ot.color_2_id as number | null,
        color_3_id: ot.color_3_id as number | null,
        color_4_id: ot.color_4_id as number | null,
        color_5_id: ot.color_5_id as number | null,
        color_6_id: ot.color_6_id as number | null,
        impresion_1: ot.impresion_1 as number | null,
        impresion_2: ot.impresion_2 as number | null,
        impresion_3: ot.impresion_3 as number | null,
        impresion_4: ot.impresion_4 as number | null,
        impresion_5: ot.impresion_5 as number | null,
        impresion_6: ot.impresion_6 as number | null,
        barniz_uv: ot.barniz_uv as number | null,
        porcentanje_barniz_uv: ot.porcentanje_barniz_uv as number | null,
        cera_exterior: ot.cera_exterior as number | null,
        porcentaje_cera_exterior: ot.porcentaje_cera_exterior as number | null,
        cera_interior: ot.cera_interior as number | null,
        porcentaje_cera_interior: ot.porcentaje_cera_interior as number | null,
        barniz_interior: ot.barniz_interior as number | null,
        porcentaje_barniz_interior: ot.porcentaje_barniz_interior as number | null,
        percentage_coverage_internal: ot.percentage_coverage_internal as number | null,
        percentage_coverage_external: ot.percentage_coverage_external as number | null,
        // Medidas
        interno_largo: ot.interno_largo as number | null,
        interno_ancho: ot.interno_ancho as number | null,
        interno_alto: ot.interno_alto as number | null,
        externo_largo: ot.externo_largo as number | null,
        externo_ancho: ot.externo_ancho as number | null,
        externo_alto: ot.externo_alto as number | null,
        // Terminaciones
        process_id: ot.process_id as number | null,
        armado_id: ot.armado_id as number | null,
        sentido_armado: ot.sentido_armado as number | null,
        pegado_terminacion: ot.pegado_terminacion as number | null,
        maquila: ot.maquila as number | null,
        maquila_servicio_id: ot.maquila_servicio_id as number | null,
        // Sección 13
        product_type_developing_id: ot.product_type_developing_id as number | null,
        food_type_id: ot.food_type_id as number | null,
        expected_use_id: ot.expected_use_id as number | null,
        recycled_use_id: ot.recycled_use_id as number | null,
        class_substance_packed_id: ot.class_substance_packed_id as number | null,
        transportation_way_id: ot.transportation_way_id as number | null,
        peso_contenido_caja: ot.peso_contenido_caja as number | null,
        envase_id: ot.envase_id as number | null,
        autosoportante: ot.autosoportante === 1,
        cajas_altura: ot.cajas_altura as number | null,
        pallet_sobre_pallet: ot.pallet_sobre_pallet === null ? null : ot.pallet_sobre_pallet === 1,
        cantidad: ot.cantidad as number | null,
        target_market_id: ot.target_market_id as number | null,
        material_asignado: (ot.material_asignado as string) || '',
        descripcion_material: (ot.descripcion_material as string) || '',
        observacion: (ot.observacion as string) || '',
        planta_id: ot.planta_id as number | null,
      });
    }
  }, [otData]);

  // Mutation para actualizar OT
  const updateMutation = useMutation({
    mutationFn: (data: WorkOrderUpdateData) => workOrdersApi.update(otId, data),
    onSuccess: (response) => {
      setSuccessMessage(response.message);
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['workOrder', otId] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Error al actualizar la orden de trabajo');
      setSuccessMessage(null);
    },
  });

  // Handlers
  const handleInputChange = useCallback((field: keyof FormState, value: unknown) => {
    setFormState(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const handleCascadeChange = useCallback((data: CascadeFormData) => {
    setFormState(prev => prev ? { ...prev, cascadeData: data } : null);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formState) return;

    // Construir datos para enviar
    const submitData: WorkOrderUpdateData = {
      client_id: formState.client_id || undefined,
      descripcion: formState.descripcion || undefined,
      tipo_solicitud: formState.tipo_solicitud || undefined,
      canal_id: formState.canal_id || undefined,
      org_venta_id: formState.org_venta_id || undefined,
      nombre_contacto: formState.nombre_contacto || undefined,
      email_contacto: formState.email_contacto || undefined,
      telefono_contacto: formState.telefono_contacto || undefined,
      volumen_venta_anual: formState.volumen_venta_anual || undefined,
      codigo_producto: formState.codigo_producto || undefined,
      subsubhierarchy_id: formState.subsubhierarchy_id || undefined,
      // Antecedentes Desarrollo
      ant_des_correo_cliente: formState.ant_des_correo_cliente ? 1 : 0,
      ant_des_plano_actual: formState.ant_des_plano_actual ? 1 : 0,
      ant_des_boceto_actual: formState.ant_des_boceto_actual ? 1 : 0,
      ant_des_spec: formState.ant_des_spec ? 1 : 0,
      ant_des_otro: formState.ant_des_otro ? 1 : 0,
      ant_des_cj_referencia_de: formState.ant_des_cj_referencia_de ? 1 : 0,
      ant_des_cj_referencia_dg: formState.ant_des_cj_referencia_dg ? 1 : 0,
      ant_des_envase_primario: formState.ant_des_envase_primario ? 1 : 0,
      ant_des_conservar_muestra: formState.ant_des_conservar_muestra === null ? undefined : (formState.ant_des_conservar_muestra ? 1 : 0),
      armado_automatico: formState.armado_automatico === null ? undefined : (formState.armado_automatico ? 1 : 0),
      // Solicita
      analisis: formState.analisis ? 1 : 0,
      prueba_industrial: formState.prueba_industrial ? 1 : 0,
      muestra: formState.muestra ? 1 : 0,
      numero_muestras: formState.numero_muestras || undefined,
      // Cascade fields
      product_type_id: formState.cascadeData.productTypeId || undefined,
      impresion: formState.cascadeData.impresion ? Number(formState.cascadeData.impresion) : undefined,
      fsc: formState.cascadeData.fsc || undefined,
      cinta: formState.cascadeData.cinta ? Number(formState.cascadeData.cinta) : undefined,
      coverage_internal_id: formState.cascadeData.coverageInternalId || undefined,
      coverage_external_id: formState.cascadeData.coverageExternalId || undefined,
      carton_color: formState.cascadeData.cartonColor ? Number(formState.cascadeData.cartonColor) : undefined,
      carton_id: formState.cascadeData.cartonId || undefined,
      // Sección 7
      cad_id: formState.cad_id || undefined,
      style_id: formState.style_id || undefined,
      items_set: formState.items_set || undefined,
      veces_item: formState.veces_item || undefined,
      largura_hm: formState.largura_hm || undefined,
      anchura_hm: formState.anchura_hm || undefined,
      area_producto: formState.area_producto || undefined,
      recorte_adicional: formState.recorte_adicional || undefined,
      longitud_pegado: formState.longitud_pegado || undefined,
      golpes_largo: formState.golpes_largo || undefined,
      golpes_ancho: formState.golpes_ancho || undefined,
      pais_id: formState.pais_id || undefined,
      // Sección 8
      design_type_id: formState.design_type_id || undefined,
      numero_colores: formState.numero_colores || undefined,
      color_1_id: formState.color_1_id || undefined,
      color_2_id: formState.color_2_id || undefined,
      color_3_id: formState.color_3_id || undefined,
      color_4_id: formState.color_4_id || undefined,
      color_5_id: formState.color_5_id || undefined,
      barniz_uv: formState.barniz_uv || undefined,
      porcentanje_barniz_uv: formState.porcentanje_barniz_uv || undefined,
      // Medidas
      interno_largo: formState.interno_largo || undefined,
      interno_ancho: formState.interno_ancho || undefined,
      interno_alto: formState.interno_alto || undefined,
      externo_largo: formState.externo_largo || undefined,
      externo_ancho: formState.externo_ancho || undefined,
      externo_alto: formState.externo_alto || undefined,
      // Terminaciones
      process_id: formState.process_id || undefined,
      armado_id: formState.armado_id || undefined,
      sentido_armado: formState.sentido_armado || undefined,
      // Sección 13
      peso_contenido_caja: formState.peso_contenido_caja || undefined,
      envase_id: formState.envase_id || undefined,
      autosoportante: formState.autosoportante ? 1 : 0,
      cantidad: formState.cantidad || undefined,
      observacion: formState.observacion || undefined,
      planta_id: formState.cascadeData.plantaId || formState.planta_id || undefined,
    };

    updateMutation.mutate(submitData);
  }, [formState, updateMutation]);

  if (otLoading) {
    return (
      <Container>
        <LoadingOverlay>
          <Spinner />
          <span>Cargando OT #{otId}...</span>
        </LoadingOverlay>
      </Container>
    );
  }

  if (otError) {
    return (
      <Container>
        <Header>
          <Title>Error</Title>
          <BackButton onClick={() => onNavigate('dashboard')}>
            Volver al Dashboard
          </BackButton>
        </Header>
        <Alert $type="error">
          No se pudo cargar la OT #{otId}. {(otError as Error).message}
        </Alert>
      </Container>
    );
  }

  if (!formState) {
    return null;
  }

  return (
    <Container>
      <Header>
        <Title>
          Editar Orden de Trabajo
          <InfoBadge>OT #{otId}</InfoBadge>
        </Title>
        <BackButton onClick={() => onNavigate('dashboard')}>
          Volver al Dashboard
        </BackButton>
      </Header>

      {successMessage && <Alert $type="success">{successMessage}</Alert>}
      {errorMessage && <Alert $type="error">{errorMessage}</Alert>}

      <form onSubmit={handleSubmit}>
        {/* Sección 1: Datos Comerciales */}
        <FormSection>
          <SectionHeader>1. Datos Comerciales</SectionHeader>
          <SectionBody>
            <FormGrid $columns={3}>
              <FormGroup>
                <Label>Cliente</Label>
                <Select
                  value={formState.client_id || ''}
                  onChange={(e) => handleInputChange('client_id', e.target.value ? Number(e.target.value) : null)}
                  disabled={optionsLoading}
                >
                  <option value="">Seleccione cliente...</option>
                  {filterOptions?.clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Descripción del Producto</Label>
                <Input
                  type="text"
                  maxLength={40}
                  value={formState.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>Tipo de Solicitud</Label>
                <Select
                  value={formState.tipo_solicitud || ''}
                  onChange={(e) => handleInputChange('tipo_solicitud', e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Seleccione tipo...</option>
                  {TIPO_SOLICITUD_OPTIONS.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Canal</Label>
                <Select
                  value={formState.canal_id || ''}
                  onChange={(e) => handleInputChange('canal_id', e.target.value ? Number(e.target.value) : null)}
                  disabled={optionsLoading}
                >
                  <option value="">Seleccione canal...</option>
                  {filterOptions?.canales.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Código Producto</Label>
                <Input
                  type="text"
                  value={formState.codigo_producto}
                  onChange={(e) => handleInputChange('codigo_producto', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>Volumen Anual</Label>
                <Input
                  type="number"
                  value={formState.volumen_venta_anual || ''}
                  onChange={(e) => handleInputChange('volumen_venta_anual', e.target.value ? Number(e.target.value) : null)}
                />
              </FormGroup>
            </FormGrid>

            <FormGrid $columns={3} style={{ marginTop: '1rem' }}>
              <FormGroup>
                <Label>Nombre Contacto</Label>
                <Input
                  type="text"
                  value={formState.nombre_contacto}
                  onChange={(e) => handleInputChange('nombre_contacto', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>Email Contacto</Label>
                <Input
                  type="email"
                  value={formState.email_contacto}
                  onChange={(e) => handleInputChange('email_contacto', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>Teléfono Contacto</Label>
                <Input
                  type="tel"
                  value={formState.telefono_contacto}
                  onChange={(e) => handleInputChange('telefono_contacto', e.target.value)}
                />
              </FormGroup>
            </FormGrid>

            {/* Jerarquías de Producto */}
            <FormGrid $columns={3} style={{ marginTop: '1rem' }}>
              <FormGroup>
                <Label>Jerarquía 1</Label>
                <Select
                  value={formState.hierarchy_id || ''}
                  onChange={(e) => handleInputChange('hierarchy_id', e.target.value ? Number(e.target.value) : null)}
                  disabled={formOptionsLoading}
                >
                  <option value="">Seleccione...</option>
                  {formOptions?.hierarchies.map(h => (
                    <option key={h.id} value={h.id}>{h.nombre}</option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Jerarquía 2</Label>
                <Select
                  value={formState.subhierarchy_id || ''}
                  onChange={(e) => handleInputChange('subhierarchy_id', e.target.value ? Number(e.target.value) : null)}
                  disabled={!formState.hierarchy_id || formOptionsLoading}
                >
                  <option value="">Seleccione...</option>
                  {filteredSubhierarchies.map(sh => (
                    <option key={sh.id} value={sh.id}>{sh.nombre}</option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Jerarquía 3</Label>
                <Select
                  value={formState.subsubhierarchy_id || ''}
                  onChange={(e) => handleInputChange('subsubhierarchy_id', e.target.value ? Number(e.target.value) : null)}
                  disabled={!formState.subhierarchy_id || formOptionsLoading}
                >
                  <option value="">Seleccione...</option>
                  {filteredSubsubhierarchies.map(ssh => (
                    <option key={ssh.id} value={ssh.id}>{ssh.nombre}</option>
                  ))}
                </Select>
              </FormGroup>
            </FormGrid>
          </SectionBody>
        </FormSection>

        {/* Sección 2: Antecedentes Desarrollo */}
        <FormSection>
          <SectionHeader>2. Antecedentes Desarrollo</SectionHeader>
          <SectionBody>
            <div style={{ marginBottom: '1rem' }}>
              <Label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>Documentos:</Label>
              <CheckboxGroup>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    checked={formState.ant_des_correo_cliente}
                    onChange={(e) => handleInputChange('ant_des_correo_cliente', e.target.checked)}
                  />
                  Correo Cliente
                </CheckboxLabel>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    checked={formState.ant_des_plano_actual}
                    onChange={(e) => handleInputChange('ant_des_plano_actual', e.target.checked)}
                  />
                  Plano Actual
                </CheckboxLabel>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    checked={formState.ant_des_boceto_actual}
                    onChange={(e) => handleInputChange('ant_des_boceto_actual', e.target.checked)}
                  />
                  Boceto Actual
                </CheckboxLabel>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    checked={formState.ant_des_spec}
                    onChange={(e) => handleInputChange('ant_des_spec', e.target.checked)}
                  />
                  Spec
                </CheckboxLabel>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    checked={formState.ant_des_otro}
                    onChange={(e) => handleInputChange('ant_des_otro', e.target.checked)}
                  />
                  Otro
                </CheckboxLabel>
              </CheckboxGroup>
            </div>

            <hr style={{ margin: '1rem 0', borderTop: '1px solid #ddd' }} />

            <div style={{ marginBottom: '1rem' }}>
              <Label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>Muestra Competencia:</Label>
              <CheckboxGroup>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    checked={formState.ant_des_cj_referencia_de}
                    onChange={(e) => handleInputChange('ant_des_cj_referencia_de', e.target.checked)}
                  />
                  CJ Referencia DE
                </CheckboxLabel>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    checked={formState.ant_des_cj_referencia_dg}
                    onChange={(e) => handleInputChange('ant_des_cj_referencia_dg', e.target.checked)}
                  />
                  CJ Referencia DG
                </CheckboxLabel>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    checked={formState.ant_des_envase_primario}
                    onChange={(e) => handleInputChange('ant_des_envase_primario', e.target.checked)}
                  />
                  Envase Primario
                </CheckboxLabel>
              </CheckboxGroup>
            </div>

            <hr style={{ margin: '1rem 0', borderTop: '1px solid #ddd' }} />

            <FormGrid $columns={3}>
              <FormGroup>
                <Label>Conservar Muestra:</Label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <CheckboxLabel>
                    <input
                      type="radio"
                      name="conservar_muestra"
                      checked={formState.ant_des_conservar_muestra === true}
                      onChange={() => handleInputChange('ant_des_conservar_muestra', true)}
                    />
                    SI
                  </CheckboxLabel>
                  <CheckboxLabel>
                    <input
                      type="radio"
                      name="conservar_muestra"
                      checked={formState.ant_des_conservar_muestra === false}
                      onChange={() => handleInputChange('ant_des_conservar_muestra', false)}
                    />
                    NO
                  </CheckboxLabel>
                </div>
              </FormGroup>

              <FormGroup>
                <Label>Armado Automático</Label>
                <Select
                  value={formState.armado_automatico === null ? '' : formState.armado_automatico ? '1' : '0'}
                  onChange={(e) => handleInputChange('armado_automatico', e.target.value === '' ? null : e.target.value === '1')}
                >
                  <option value="">Seleccione...</option>
                  <option value="1">Si</option>
                  <option value="0">No</option>
                </Select>
              </FormGroup>

              <FormGroup />
            </FormGrid>
          </SectionBody>
        </FormSection>

        {/* Sección: Solicita */}
        <FormSection>
          <SectionHeader>Solicita</SectionHeader>
          <SectionBody>
            <CheckboxGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={formState.analisis}
                  onChange={(e) => handleInputChange('analisis', e.target.checked)}
                />
                Análisis
              </CheckboxLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={formState.prueba_industrial}
                  onChange={(e) => handleInputChange('prueba_industrial', e.target.checked)}
                />
                Prueba Industrial
              </CheckboxLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={formState.muestra}
                  onChange={(e) => handleInputChange('muestra', e.target.checked)}
                />
                Muestra
              </CheckboxLabel>
            </CheckboxGroup>

            {formState.muestra && (
              <FormGrid $columns={4} style={{ marginTop: '1rem' }}>
                <FormGroup>
                  <Label>Número de Muestras</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formState.numero_muestras || ''}
                    onChange={(e) => handleInputChange('numero_muestras', e.target.value ? Number(e.target.value) : null)}
                  />
                </FormGroup>
              </FormGrid>
            )}
          </SectionBody>
        </FormSection>

        {/* Sección 6: Asistente Para Ingresos Principales */}
        <FormSection>
          <SectionHeader>6.- Asistente Para: Ingresos Principales</SectionHeader>
          <SectionBody>
            <CascadeForm
              values={formState.cascadeData}
              onChange={handleCascadeChange}
              fieldErrors={{}}
            />
          </SectionBody>
        </FormSection>

        {/* Sección 7: Características */}
        <FormSection>
          <SectionHeader>7.- Características</SectionHeader>
          <SectionBody>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              {/* Columna 1 */}
              <div>
                <FormGroup>
                  <Label>CAD</Label>
                  <Select
                    value={formState.cad_id || ''}
                    onChange={(e) => handleInputChange('cad_id', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Seleccionar...</option>
                    {formOptions?.cads?.map((cad) => (
                      <option key={String(cad.id)} value={cad.id}>{cad.codigo || cad.nombre}</option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Tipo Item</Label>
                  <Input
                    type="text"
                    value={formState.cascadeData.productTypeId ?
                      (formOptions?.product_types?.find(p => p.id === formState.cascadeData.productTypeId)?.nombre || '') : ''}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </FormGroup>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <FormGroup>
                    <Label>Items del Set</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formState.items_set || ''}
                      onChange={(e) => handleInputChange('items_set', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Veces Item</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formState.veces_item || ''}
                      onChange={(e) => handleInputChange('veces_item', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                </div>
                <FormGroup>
                  <Label>Cartón</Label>
                  <Input
                    type="text"
                    value={formState.cascadeData.cartonId ?
                      (formOptions?.cartons?.find(c => c.id === formState.cascadeData.cartonId)?.nombre || '') : ''}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Cinta</Label>
                  <Input
                    type="text"
                    value={formState.cascadeData.cinta !== null && formState.cascadeData.cinta !== undefined
                      ? (Number(formState.cascadeData.cinta) === 1 ? 'Si' : 'No')
                      : ''}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>FSC</Label>
                  <Input
                    type="text"
                    value={formState.cascadeData.fsc ?
                      (formOptions?.fsc?.find(f => f.id === Number(formState.cascadeData.fsc))?.nombre || String(formState.cascadeData.fsc)) : ''}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>País/Mercado Destino</Label>
                  <Select
                    value={formState.pais_id || ''}
                    onChange={(e) => handleInputChange('pais_id', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Seleccionar...</option>
                    {formOptions?.pais_referencia?.map((p) => (
                      <option key={String(p.id)} value={p.id}>{p.nombre}</option>
                    ))}
                  </Select>
                </FormGroup>
              </div>

              {/* Columna 2 */}
              <div>
                <FormGroup>
                  <Label>Estilo</Label>
                  <Select
                    value={formState.style_id || ''}
                    onChange={(e) => handleInputChange('style_id', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Seleccionar...</option>
                    {formOptions?.styles?.map((s) => (
                      <option key={String(s.id)} value={s.id}>{s.nombre}</option>
                    ))}
                  </Select>
                </FormGroup>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <FormGroup>
                    <Label>Largura HM</Label>
                    <Input
                      type="number"
                      value={formState.largura_hm || ''}
                      onChange={(e) => handleInputChange('largura_hm', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Anchura HM</Label>
                    <Input
                      type="number"
                      value={formState.anchura_hm || ''}
                      onChange={(e) => handleInputChange('anchura_hm', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                </div>
                <FormGroup>
                  <Label>Área Producto (M2)</Label>
                  <Input
                    type="number"
                    value={formState.area_producto || ''}
                    onChange={(e) => handleInputChange('area_producto', e.target.value ? Number(e.target.value) : null)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Longitud Pegado (MM)</Label>
                  <Input
                    type="number"
                    value={formState.longitud_pegado || ''}
                    onChange={(e) => handleInputChange('longitud_pegado', e.target.value ? Number(e.target.value) : null)}
                  />
                </FormGroup>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <FormGroup>
                    <Label>Golpes al Largo</Label>
                    <Input
                      type="number"
                      value={formState.golpes_largo || ''}
                      onChange={(e) => handleInputChange('golpes_largo', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Golpes al Ancho</Label>
                    <Input
                      type="number"
                      value={formState.golpes_ancho || ''}
                      onChange={(e) => handleInputChange('golpes_ancho', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <FormGroup>
                    <Label>Rayado C1/R1 (MM)</Label>
                    <Input
                      type="number"
                      value={formState.rayado_c1r1 || ''}
                      onChange={(e) => handleInputChange('rayado_c1r1', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Rayado R1/R2 (MM)</Label>
                    <Input
                      type="number"
                      value={formState.rayado_r1_r2 || ''}
                      onChange={(e) => handleInputChange('rayado_r1_r2', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                </div>
              </div>

              {/* Columna 3: Especificaciones Técnicas */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <FormGroup>
                    <Label>BCT MIN (LB)</Label>
                    <Input
                      type="number"
                      value={formState.bct_min_lb || ''}
                      onChange={(e) => handleInputChange('bct_min_lb', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>BCT MIN (KG)</Label>
                    <Input
                      type="number"
                      value={formState.bct_min_kg || ''}
                      onChange={(e) => handleInputChange('bct_min_kg', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <FormGroup>
                    <Label>GRAMAJE (G/M2)</Label>
                    <Input
                      type="number"
                      value={formState.gramaje || ''}
                      onChange={(e) => handleInputChange('gramaje', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>ECT</Label>
                    <Input
                      type="number"
                      value={formState.ect || ''}
                      onChange={(e) => handleInputChange('ect', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <FormGroup>
                    <Label>COBB INTERIOR (G/M2)</Label>
                    <Input
                      type="number"
                      value={formState.cobb_interior || ''}
                      onChange={(e) => handleInputChange('cobb_interior', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>COBB EXTERIOR (G/M2)</Label>
                    <Input
                      type="number"
                      value={formState.cobb_exterior || ''}
                      onChange={(e) => handleInputChange('cobb_exterior', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <FormGroup>
                    <Label>ESPESOR (MM)</Label>
                    <Input
                      type="number"
                      value={formState.espesor || ''}
                      onChange={(e) => handleInputChange('espesor', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>PESO (G)</Label>
                    <Input
                      type="number"
                      value={formState.peso || ''}
                      onChange={(e) => handleInputChange('peso', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                </div>
              </div>
            </div>
          </SectionBody>
        </FormSection>

        {/* Sección 8: Color-Cera-Barniz */}
        <FormSection>
          <SectionHeader>8.- Color-Cera-Barniz</SectionHeader>
          <SectionBody>
            <FormGridSection8>
              {/* Columna 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <FormGroup>
                  <Label>Impresión</Label>
                  <Input
                    type="text"
                    value={formState.cascadeData.impresion ?
                      (formOptions?.impresiones?.find(i => String(i.id) === String(formState.cascadeData.impresion))?.nombre || formState.cascadeData.impresion) : ''}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Tipo Diseño</Label>
                  <Select
                    value={formState.design_type_id || ''}
                    onChange={(e) => handleInputChange('design_type_id', e.target.value ? Number(e.target.value) : null)}
                    disabled={formOptionsLoading}
                  >
                    <option value="">Seleccione...</option>
                    {formOptions?.design_types?.map(dt => (
                      <option key={dt.id} value={dt.id}>{dt.nombre}</option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Número Colores</Label>
                  <Select
                    value={formState.numero_colores !== null ? formState.numero_colores : ''}
                    onChange={(e) => handleInputChange('numero_colores', e.target.value !== '' ? Number(e.target.value) : null)}
                  >
                    <option value="">Seleccione...</option>
                    {[0,1,2,3,4,5,6,7].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Recubrimiento Interno</Label>
                  <Input
                    type="text"
                    value={formState.cascadeData.coverageInternalId ?
                      (formOptions?.coverages_internal?.find(c => c.id === formState.cascadeData.coverageInternalId)?.nombre || '') : ''}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>% Recubrimiento Interno</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formState.percentage_coverage_internal || ''}
                    onChange={(e) => handleInputChange('percentage_coverage_internal', e.target.value ? Number(e.target.value) : null)}
                  />
                </FormGroup>
              </div>

              {/* Columna 2: Colores */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {formState.numero_colores && formState.numero_colores >= 1 && (
                  <FormGroup>
                    <Label>Color 1</Label>
                    <Select
                      value={formState.color_1_id || ''}
                      onChange={(e) => handleInputChange('color_1_id', e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Seleccione...</option>
                      {formOptions?.colors?.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </Select>
                  </FormGroup>
                )}
                {formState.numero_colores && formState.numero_colores >= 2 && (
                  <FormGroup>
                    <Label>Color 2</Label>
                    <Select
                      value={formState.color_2_id || ''}
                      onChange={(e) => handleInputChange('color_2_id', e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Seleccione...</option>
                      {formOptions?.colors?.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </Select>
                  </FormGroup>
                )}
                {formState.numero_colores && formState.numero_colores >= 3 && (
                  <FormGroup>
                    <Label>Color 3</Label>
                    <Select
                      value={formState.color_3_id || ''}
                      onChange={(e) => handleInputChange('color_3_id', e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Seleccione...</option>
                      {formOptions?.colors?.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </Select>
                  </FormGroup>
                )}
                {formState.numero_colores && formState.numero_colores >= 4 && (
                  <FormGroup>
                    <Label>Color 4</Label>
                    <Select
                      value={formState.color_4_id || ''}
                      onChange={(e) => handleInputChange('color_4_id', e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Seleccione...</option>
                      {formOptions?.colors?.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </Select>
                  </FormGroup>
                )}
                {formState.numero_colores && formState.numero_colores >= 5 && (
                  <FormGroup>
                    <Label>Color 5</Label>
                    <Select
                      value={formState.color_5_id || ''}
                      onChange={(e) => handleInputChange('color_5_id', e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Seleccione...</option>
                      {formOptions?.colors?.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </Select>
                  </FormGroup>
                )}
              </div>

              {/* Columna 3: Barniz y Cera */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <FormGroup>
                  <Label>Barniz UV</Label>
                  <Select
                    value={formState.barniz_uv === null ? '' : formState.barniz_uv}
                    onChange={(e) => handleInputChange('barniz_uv', e.target.value === '' ? null : Number(e.target.value))}
                  >
                    <option value="">Seleccione...</option>
                    <option value="1">Si</option>
                    <option value="0">No</option>
                  </Select>
                </FormGroup>
                {formState.barniz_uv === 1 && (
                  <FormGroup>
                    <Label>% Barniz UV</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formState.porcentanje_barniz_uv || ''}
                      onChange={(e) => handleInputChange('porcentanje_barniz_uv', e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormGroup>
                )}
                <FormGroup>
                  <Label>Recubrimiento Externo</Label>
                  <Input
                    type="text"
                    value={formState.cascadeData.coverageExternalId ?
                      (formOptions?.coverages_external?.find(c => c.id === formState.cascadeData.coverageExternalId)?.nombre || '') : ''}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>% Recubrimiento Externo</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formState.percentage_coverage_external || ''}
                    onChange={(e) => handleInputChange('percentage_coverage_external', e.target.value ? Number(e.target.value) : null)}
                  />
                </FormGroup>
              </div>

              {/* Columna 4 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <FormGroup>
                  <Label>Complejidad</Label>
                  <Input
                    type="text"
                    value={formState.complejidad}
                    onChange={(e) => handleInputChange('complejidad', e.target.value)}
                  />
                </FormGroup>
              </div>
            </FormGridSection8>
          </SectionBody>
        </FormSection>

        {/* Secciones 9, 10 y 11 en fila horizontal */}
        <SectionsRow>
          {/* Sección 9: Medidas Interiores */}
          <FormSectionCompact>
            <SectionHeader>9.- Medidas Interiores</SectionHeader>
            <SectionBody>
              <FormGrid $columns={1}>
                <FormGroup>
                  <Label>Largo (mm)</Label>
                  <Input
                    type="number"
                    value={formState.interno_largo || ''}
                    onChange={(e) => handleInputChange('interno_largo', e.target.value ? Number(e.target.value) : null)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Ancho (mm)</Label>
                  <Input
                    type="number"
                    value={formState.interno_ancho || ''}
                    onChange={(e) => handleInputChange('interno_ancho', e.target.value ? Number(e.target.value) : null)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Alto (mm)</Label>
                  <Input
                    type="number"
                    value={formState.interno_alto || ''}
                    onChange={(e) => handleInputChange('interno_alto', e.target.value ? Number(e.target.value) : null)}
                  />
                </FormGroup>
              </FormGrid>
            </SectionBody>
          </FormSectionCompact>

          {/* Sección 10: Medidas Exteriores */}
          <FormSectionCompact>
            <SectionHeader>10.- Medidas Exteriores</SectionHeader>
            <SectionBody>
              <FormGrid $columns={1}>
                <FormGroup>
                  <Label>Largo (mm)</Label>
                  <Input
                    type="number"
                    value={formState.externo_largo || ''}
                    onChange={(e) => handleInputChange('externo_largo', e.target.value ? Number(e.target.value) : null)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Ancho (mm)</Label>
                  <Input
                    type="number"
                    value={formState.externo_ancho || ''}
                    onChange={(e) => handleInputChange('externo_ancho', e.target.value ? Number(e.target.value) : null)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Alto (mm)</Label>
                  <Input
                    type="number"
                    value={formState.externo_alto || ''}
                    onChange={(e) => handleInputChange('externo_alto', e.target.value ? Number(e.target.value) : null)}
                  />
                </FormGroup>
              </FormGrid>
            </SectionBody>
          </FormSectionCompact>

          {/* Sección 11: Terminaciones */}
          <FormSectionCompact>
            <SectionHeader>11.- Terminaciones</SectionHeader>
            <SectionBody>
              <FormGrid $columns={1}>
                <FormGroup>
                  <Label>Proceso</Label>
                  <Select
                    value={formState.process_id || ''}
                    onChange={(e) => handleInputChange('process_id', e.target.value ? Number(e.target.value) : null)}
                    disabled={optionsLoading}
                  >
                    <option value="">Seleccione...</option>
                    {filterOptions?.procesos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Armado</Label>
                  <Select
                    value={formState.armado_id || ''}
                    onChange={(e) => handleInputChange('armado_id', e.target.value ? Number(e.target.value) : null)}
                    disabled={formOptionsLoading}
                  >
                    <option value="">Seleccione...</option>
                    {formOptions?.armados?.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Sentido de Armado</Label>
                  <Select
                    value={formState.sentido_armado || ''}
                    onChange={(e) => handleInputChange('sentido_armado', e.target.value ? Number(e.target.value) : null)}
                    disabled={formOptionsLoading}
                  >
                    <option value="">Seleccione...</option>
                    {formOptions?.sentidos_armado?.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                    ))}
                  </Select>
                </FormGroup>
              </FormGrid>
            </SectionBody>
          </FormSectionCompact>
        </SectionsRow>

        {/* Sección 13: Material Asignado */}
        <FormSection>
          <SectionHeader>13.- Material Asignado</SectionHeader>
          <SectionBody>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '100%' }}>
              <FormGroup>
                <Label>MATERIAL ASIGNADO</Label>
                <Input
                  type="text"
                  value={formState.material_asignado}
                  onChange={(e) => handleInputChange('material_asignado', e.target.value)}
                  placeholder="Código de material..."
                />
              </FormGroup>

              <FormGroup>
                <Label>DESCRIPCIÓN</Label>
                <Input
                  type="text"
                  value={formState.descripcion_material}
                  onChange={(e) => handleInputChange('descripcion_material', e.target.value)}
                  placeholder="Descripción del material..."
                />
              </FormGroup>
            </div>
          </SectionBody>
        </FormSection>

        {/* Secciones 13 y 14 lado a lado */}
        <div style={{ display: 'grid', gridTemplateColumns: '65% 35%', gap: '0.5rem', maxWidth: '100%', overflow: 'hidden' }}>
          {/* Sección 13: Datos para Desarrollo */}
          <FormSection style={{ margin: 0, minWidth: 0, overflow: 'hidden', maxWidth: '100%' }}>
            <SectionHeader>13.- Datos para desarrollo</SectionHeader>
            <SectionBody style={{ overflow: 'hidden', padding: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.7rem', maxWidth: '100%' }}>
                {/* Fila 1 */}
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 1fr', gap: '0.25rem', alignItems: 'center' }}>
                  <Label style={{ margin: 0, fontWeight: '600', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>TIPO PRODUCTO:</Label>
                  <Select
                    value={formState.product_type_developing_id || ''}
                    onChange={(e) => handleInputChange('product_type_developing_id', e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', fontSize: '0.7rem', padding: '0.15rem' }}
                  >
                    <option value="">Seleccionar...</option>
                    {formOptions?.product_type_developing?.map(pt => (
                      <option key={pt.id} value={pt.id}>{pt.nombre}</option>
                    ))}
                  </Select>
                  <Label style={{ margin: 0, fontWeight: '600', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>PESO CAJA (KG):</Label>
                  <Input
                    type="number"
                    value={formState.peso_contenido_caja || ''}
                    onChange={(e) => handleInputChange('peso_contenido_caja', e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', fontSize: '0.7rem', padding: '0.15rem' }}
                  />
                </div>

                {/* Fila 2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 1fr', gap: '0.25rem', alignItems: 'center' }}>
                  <Label style={{ margin: 0, fontWeight: '600', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>TIPO ALIMENTO:</Label>
                  <Select
                    value={formState.food_type_id || ''}
                    onChange={(e) => handleInputChange('food_type_id', e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', fontSize: '0.7rem', padding: '0.15rem' }}
                  >
                    <option value="">Seleccionar...</option>
                    {formOptions?.food_types?.map(ft => (
                      <option key={ft.id} value={ft.id}>{ft.nombre}</option>
                    ))}
                  </Select>
                  <Label style={{ margin: 0, fontWeight: '600', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>AUTOSOPORTANTE:</Label>
                  <Select
                    value={formState.autosoportante ? '1' : '0'}
                    onChange={(e) => handleInputChange('autosoportante', e.target.value === '1')}
                    style={{ width: '100%', fontSize: '0.7rem', padding: '0.15rem' }}
                  >
                    <option value="0">No</option>
                    <option value="1">Si</option>
                  </Select>
                </div>

                {/* Fila 3 */}
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 1fr', gap: '0.25rem', alignItems: 'center' }}>
                  <Label style={{ margin: 0, fontWeight: '600', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>USO PREVISTO:</Label>
                  <Select
                    value={formState.expected_use_id || ''}
                    onChange={(e) => handleInputChange('expected_use_id', e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', fontSize: '0.7rem', padding: '0.15rem' }}
                  >
                    <option value="">Seleccionar...</option>
                    {formOptions?.expected_uses?.map(eu => (
                      <option key={eu.id} value={eu.id}>{eu.nombre}</option>
                    ))}
                  </Select>
                  <Label style={{ margin: 0, fontWeight: '600', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>ENVASE PRIMARIO:</Label>
                  <Select
                    value={formState.envase_id || ''}
                    onChange={(e) => handleInputChange('envase_id', e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', fontSize: '0.7rem', padding: '0.15rem' }}
                  >
                    <option value="">Seleccionar...</option>
                    {formOptions?.envases?.map(env => (
                      <option key={env.id} value={env.id}>{env.nombre}</option>
                    ))}
                  </Select>
                </div>

                {/* Fila 4 */}
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 1fr', gap: '0.25rem', alignItems: 'center' }}>
                  <Label style={{ margin: 0, fontWeight: '600', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>CLASE SUSTANCIA:</Label>
                  <Select
                    value={formState.class_substance_packed_id || ''}
                    onChange={(e) => handleInputChange('class_substance_packed_id', e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', fontSize: '0.7rem', padding: '0.15rem' }}
                  >
                    <option value="">Seleccionar...</option>
                    {formOptions?.class_substance_packeds?.map(cs => (
                      <option key={cs.id} value={cs.id}>{cs.nombre}</option>
                    ))}
                  </Select>
                  <Label style={{ margin: 0, fontWeight: '600', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>CANTIDAD:</Label>
                  <Input
                    type="number"
                    value={formState.cantidad || ''}
                    onChange={(e) => handleInputChange('cantidad', e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', fontSize: '0.7rem', padding: '0.15rem' }}
                  />
                </div>

                {/* Fila 5 */}
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 1fr', gap: '0.25rem', alignItems: 'center' }}>
                  <Label style={{ margin: 0, fontWeight: '600', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>MEDIO TRANSPORTE:</Label>
                  <Select
                    value={formState.transportation_way_id || ''}
                    onChange={(e) => handleInputChange('transportation_way_id', e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', fontSize: '0.7rem', padding: '0.15rem' }}
                  >
                    <option value="">Seleccionar...</option>
                    {formOptions?.transportation_ways?.map(tw => (
                      <option key={tw.id} value={tw.id}>{tw.nombre}</option>
                    ))}
                  </Select>
                  <Label style={{ margin: 0, fontWeight: '600', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>MERCADO DESTINO:</Label>
                  <Select
                    value={formState.target_market_id || ''}
                    onChange={(e) => handleInputChange('target_market_id', e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', fontSize: '0.7rem', padding: '0.15rem' }}
                  >
                    <option value="">Seleccionar...</option>
                    {formOptions?.target_markets?.map(tm => (
                      <option key={tm.id} value={tm.id}>{tm.nombre}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </SectionBody>
          </FormSection>

          {/* Sección 14: Observación del trabajo */}
          <FormSection style={{ margin: 0, minWidth: 0, overflow: 'hidden' }}>
            <SectionHeader>14.- Observación del trabajo a realizar</SectionHeader>
            <SectionBody style={{ padding: '0.5rem', overflow: 'hidden' }}>
              <TextArea
                value={formState.observacion}
                onChange={(e) => handleInputChange('observacion', e.target.value)}
                placeholder="Observaciones adicionales..."
                style={{ width: '100%', height: '200px', resize: 'none', fontSize: '0.75rem', boxSizing: 'border-box' }}
              />
            </SectionBody>
          </FormSection>
        </div>

        {/* Botones de acción */}
        <ButtonGroup>
          <BackButton type="button" onClick={() => onNavigate('dashboard')}>
            Cancelar
          </BackButton>
          <SubmitButton
            type="submit"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </SubmitButton>
        </ButtonGroup>
      </form>
    </Container>
  );
}
