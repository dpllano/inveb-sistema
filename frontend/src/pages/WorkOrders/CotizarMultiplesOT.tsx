/**
 * CotizarMultiplesOT Component
 * Permite seleccionar múltiples OTs para generar cotización masiva
 * Las OTs deben tener campos completos (area_hc, golpes_largo, golpes_ancho, etc.)
 */

import { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { useQuery } from '@tanstack/react-query';
import { workOrdersApi, type WorkOrderFilters } from '../../services/api';

// Styled Components
const Container = styled.div`
  padding: 1.5rem;
  max-width: 100%;
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-size: 1rem;
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
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0 0 1.5rem 0;
`;

const FiltersCard = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  align-items: end;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-size: 0.7rem;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
`;

const Input = styled.input`
  padding: 0.4rem 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.8rem;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

const FiltersActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'disabled' }>`
  padding: 0.5rem 1.25rem;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: ${theme.colors.primary};
          color: white;
          border-color: ${theme.colors.primary};
          &:hover:not(:disabled) { background: #002d66; }
        `;
      case 'success':
        return `
          background: ${theme.colors.success};
          color: white;
          border-color: ${theme.colors.success};
          &:hover:not(:disabled) { background: #218838; }
        `;
      case 'disabled':
        return `
          background: #ccc;
          color: #666;
          border-color: #ccc;
          cursor: not-allowed;
          opacity: 0.5;
        `;
      default:
        return `
          background: white;
          color: ${theme.colors.textSecondary};
          border-color: ${theme.colors.border};
          &:hover:not(:disabled) {
            border-color: ${theme.colors.primary};
            color: ${theme.colors.primary};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TableContainer = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
`;

const Th = styled.th`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 0.6rem 0.5rem;
  text-align: left;
  font-weight: 500;
  font-size: 0.7rem;
  text-transform: uppercase;
  white-space: nowrap;
`;

const ThCheckbox = styled(Th)`
  text-align: center;
  width: 100px;
`;

const Td = styled.td`
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid ${theme.colors.border};
  vertical-align: middle;
`;

const TdCheckbox = styled(Td)`
  text-align: center;
`;

const Tr = styled.tr<{ $highlighted?: boolean }>`
  ${props => props.$highlighted && `
    background-color: #d1f3d1;
  `}

  &:hover {
    background: ${props => props.$highlighted ? '#c1e3c1' : theme.colors.bgLight};
  }

  &:last-child td {
    border-bottom: none;
  }
`;

const TruncatedText = styled.span`
  display: block;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${theme.colors.textSecondary};
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

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid ${theme.colors.border};
`;

const PageButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  background: white;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: ${theme.colors.textSecondary};
  font-size: 0.875rem;
`;

const SelectionSummary = styled.div`
  background: ${theme.colors.primary}10;
  border: 1px solid ${theme.colors.primary}30;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SelectionText = styled.span`
  color: ${theme.colors.textPrimary};
  font-size: 0.875rem;
`;

const Alert = styled.div<{ $type: 'success' | 'error' }>`
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
`;

interface CotizarMultiplesOTProps {
  onNavigate: (page: string, id?: number) => void;
}

interface OTSelection {
  [otId: number]: {
    corrugado: boolean;
    esquinero: boolean;
  };
}

export default function CotizarMultiplesOT({ onNavigate }: CotizarMultiplesOTProps) {
  // Filters state
  const [filters, setFilters] = useState<WorkOrderFilters>({
    page: 1,
    page_size: 20,
  });
  const [dateDesde, setDateDesde] = useState('');
  const [dateHasta, setDateHasta] = useState('');
  const [otId, setOtId] = useState('');
  const [cad, setCad] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Selection state
  const [selections, setSelections] = useState<OTSelection>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Query para OTs cotizables (con campos completos)
  const { data, isLoading, error } = useQuery({
    queryKey: ['ots-cotizables', filters],
    queryFn: () => workOrdersApi.list(filters),
  });

  // Filtrar solo OTs que tienen los campos necesarios para cotizar
  const cotizableOTs = useMemo(() => {
    if (!data?.items) return [];
    // En producción, el backend debería filtrar esto
    // Por ahora, mostramos todas y asumimos que están completas
    return data.items;
  }, [data?.items]);

  // Handlers
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const newFilters: WorkOrderFilters = {
      ...filters,
      page: 1,
    };

    if (dateDesde) newFilters.date_desde = dateDesde;
    if (dateHasta) newFilters.date_hasta = dateHasta;
    if (otId) newFilters.id_ot = parseInt(otId, 10);
    if (cad) newFilters.cad = cad;
    if (descripcion) newFilters.descripcion = descripcion;

    setFilters(newFilters);
    setSelections({}); // Reset selections on new search
  }, [filters, dateDesde, dateHasta, otId, cad, descripcion]);

  const handleClearFilters = useCallback(() => {
    setDateDesde('');
    setDateHasta('');
    setOtId('');
    setCad('');
    setDescripcion('');
    setFilters({ page: 1, page_size: 20 });
    setSelections({});
  }, []);

  const handleToggleSelection = useCallback((otIdNum: number, type: 'corrugado' | 'esquinero') => {
    setSelections(prev => {
      const current = prev[otIdNum] || { corrugado: false, esquinero: false };
      return {
        ...prev,
        [otIdNum]: {
          ...current,
          [type]: !current[type],
        },
      };
    });
  }, []);

  const handleSelectAllType = useCallback((type: 'corrugado' | 'esquinero', checked: boolean) => {
    setSelections(prev => {
      const newSelections: OTSelection = { ...prev };
      cotizableOTs.forEach(ot => {
        newSelections[ot.id] = {
          ...newSelections[ot.id],
          corrugado: type === 'corrugado' ? checked : (newSelections[ot.id]?.corrugado || false),
          esquinero: type === 'esquinero' ? checked : (newSelections[ot.id]?.esquinero || false),
        };
      });
      return newSelections;
    });
  }, [cotizableOTs]);

  const handleCotizar = useCallback(() => {
    const selectedItems = Object.entries(selections)
      .filter(([_, sel]) => sel.corrugado || sel.esquinero)
      .map(([id, sel]) => ({
        ot_id: parseInt(id, 10),
        tipo_corrugado: sel.corrugado,
        tipo_esquinero: sel.esquinero,
      }));

    if (selectedItems.length === 0) {
      return;
    }

    // TODO: Llamar al API para generar cotización
    console.log('Cotizar OTs:', selectedItems);
    setSuccessMessage(`Se generará cotización para ${selectedItems.length} OT(s)`);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, [selections]);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  // Calculate selection summary
  const selectionSummary = useMemo(() => {
    let corrugadoCount = 0;
    let esquineroCount = 0;

    Object.values(selections).forEach(sel => {
      if (sel.corrugado) corrugadoCount++;
      if (sel.esquinero) esquineroCount++;
    });

    return { corrugadoCount, esquineroCount, total: corrugadoCount + esquineroCount };
  }, [selections]);

  const hasSelections = selectionSummary.total > 0;

  // Check if all are selected for header checkboxes
  const allCorrugadoSelected = cotizableOTs.length > 0 &&
    cotizableOTs.every(ot => selections[ot.id]?.corrugado);
  const allEsquineroSelected = cotizableOTs.length > 0 &&
    cotizableOTs.every(ot => selections[ot.id]?.esquinero);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  // Render loading
  if (isLoading) {
    return (
      <Container>
        <BackLink onClick={() => onNavigate('dashboard')}>← Volver</BackLink>
        <Title>Lista de OT para Cotizar</Title>
        <LoadingOverlay>
          <Spinner />
          <span>Cargando OTs...</span>
        </LoadingOverlay>
      </Container>
    );
  }

  // Render error
  if (error) {
    return (
      <Container>
        <BackLink onClick={() => onNavigate('dashboard')}>← Volver</BackLink>
        <Title>Lista de OT para Cotizar</Title>
        <Alert $type="error">Error al cargar OTs: {(error as Error).message}</Alert>
      </Container>
    );
  }

  const totalPages = data?.total_pages || 1;
  const currentPage = data?.page || 1;

  return (
    <Container>
      <BackLink onClick={() => onNavigate('dashboard')}>← Volver</BackLink>
      <Title>Lista de OT para Cotizar</Title>

      {successMessage && <Alert $type="success">{successMessage}</Alert>}

      {/* Filters */}
      <FiltersCard>
        <form onSubmit={handleSearch}>
          <FiltersGrid>
            <FormGroup>
              <Label>Desde</Label>
              <Input
                type="date"
                value={dateDesde}
                onChange={(e) => setDateDesde(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>Hasta</Label>
              <Input
                type="date"
                value={dateHasta}
                onChange={(e) => setDateHasta(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>OT</Label>
              <Input
                type="number"
                placeholder="ID..."
                value={otId}
                onChange={(e) => setOtId(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>CAD</Label>
              <Input
                type="text"
                placeholder="CAD..."
                value={cad}
                onChange={(e) => setCad(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>Descripción</Label>
              <Input
                type="text"
                placeholder="Descripción..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </FormGroup>
          </FiltersGrid>
          <FiltersActions>
            <Button type="submit" $variant="primary">Filtrar</Button>
            <Button type="button" onClick={handleClearFilters}>Limpiar</Button>
            <Button
              type="button"
              $variant={hasSelections ? 'success' : 'disabled'}
              disabled={!hasSelections}
              onClick={handleCotizar}
            >
              Cotizar
            </Button>
          </FiltersActions>
        </form>
      </FiltersCard>

      {/* Selection Summary */}
      {hasSelections && (
        <SelectionSummary>
          <SelectionText>
            Seleccionados: {selectionSummary.corrugadoCount} Corrugado, {selectionSummary.esquineroCount} Esquinero
          </SelectionText>
          <Button onClick={() => setSelections({})}>
            Limpiar Selección
          </Button>
        </SelectionSummary>
      )}

      <TableContainer>
        {cotizableOTs.length === 0 ? (
          <EmptyState>
            <p>No hay OTs disponibles para cotizar</p>
          </EmptyState>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>OT</Th>
                  <Th>Creación</Th>
                  <Th>Creador</Th>
                  <Th>Cliente</Th>
                  <Th>Descripción</Th>
                  <Th>CAD</Th>
                  <Th>Item</Th>
                  <ThCheckbox>
                    Tipo Corrugado<br />
                    <Checkbox
                      type="checkbox"
                      checked={allCorrugadoSelected}
                      onChange={(e) => handleSelectAllType('corrugado', e.target.checked)}
                    />
                  </ThCheckbox>
                  <ThCheckbox>
                    Tipo Esquinero<br />
                    <Checkbox
                      type="checkbox"
                      checked={allEsquineroSelected}
                      onChange={(e) => handleSelectAllType('esquinero', e.target.checked)}
                    />
                  </ThCheckbox>
                </tr>
              </thead>
              <tbody>
                {cotizableOTs.map((ot) => (
                  <Tr key={ot.id}>
                    <Td><strong>{ot.id}</strong></Td>
                    <Td>{formatDate(ot.created_at)}</Td>
                    <Td>
                      <TruncatedText title={ot.creador_nombre}>
                        {ot.creador_nombre || '-'}
                      </TruncatedText>
                    </Td>
                    <Td>
                      <TruncatedText title={ot.client_name}>
                        {ot.client_name || '-'}
                      </TruncatedText>
                    </Td>
                    <Td>
                      <TruncatedText title={ot.descripcion}>
                        {ot.descripcion || '-'}
                      </TruncatedText>
                    </Td>
                    <Td>
                      <TruncatedText title={ot.cad || '-'}>
                        {ot.cad || '-'}
                      </TruncatedText>
                    </Td>
                    <Td>{ot.item_tipo || '-'}</Td>
                    <TdCheckbox>
                      <Checkbox
                        type="checkbox"
                        checked={selections[ot.id]?.corrugado || false}
                        onChange={() => handleToggleSelection(ot.id, 'corrugado')}
                      />
                    </TdCheckbox>
                    <TdCheckbox>
                      <Checkbox
                        type="checkbox"
                        checked={selections[ot.id]?.esquinero || false}
                        onChange={() => handleToggleSelection(ot.id, 'esquinero')}
                      />
                    </TdCheckbox>
                  </Tr>
                ))}
              </tbody>
            </Table>

            {totalPages > 1 && (
              <Pagination>
                <PageButton
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Anterior
                </PageButton>
                <PageInfo>
                  Página {currentPage} de {totalPages}
                </PageInfo>
                <PageButton
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Siguiente
                </PageButton>
              </Pagination>
            )}
          </>
        )}
      </TableContainer>
    </Container>
  );
}
