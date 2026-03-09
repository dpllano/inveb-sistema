/**
 * DetalleLogOT Component
 * Historial detallado de cambios (log/bitacora) de una OT especifica
 * Muestra cada modificacion con campo, valor antiguo, valor nuevo y usuario
 */

import { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { useQuery } from '@tanstack/react-query';

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

const Select = styled.select`
  padding: 0.4rem 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.8rem;
  background: white;

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

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'outline' }>`
  padding: 0.4rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: ${theme.colors.primary};
          color: white;
          &:hover { opacity: 0.9; }
        `;
      case 'outline':
        return `
          background: transparent;
          border: 1px solid ${theme.colors.primary};
          color: ${theme.colors.primary};
          &:hover { background: ${theme.colors.primary}10; }
        `;
      default:
        return `
          background: ${theme.colors.bgLight};
          color: ${theme.colors.textSecondary};
          border: 1px solid ${theme.colors.border};
          &:hover { background: white; }
        `;
    }
  }}
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
`;

const Th = styled.th`
  padding: 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  background: ${theme.colors.bgLight};
  border-bottom: 1px solid ${theme.colors.border};
`;

const Td = styled.td`
  padding: 0.75rem;
  font-size: 0.8rem;
  color: ${theme.colors.textPrimary};
  border-bottom: 1px solid ${theme.colors.border};
  vertical-align: top;
`;

const ValueCell = styled.span<{ $type: 'old' | 'new' }>`
  display: inline-block;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  background: ${({ $type }) => $type === 'old' ? `${theme.colors.danger}10` : `${theme.colors.success}10`};
  color: ${({ $type }) => $type === 'old' ? theme.colors.danger : theme.colors.success};
`;

const EmptyValue = styled.span`
  color: ${theme.colors.textSecondary};
  font-style: italic;
  font-size: 0.75rem;
`;

const LoadingOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: ${theme.colors.textSecondary};
`;

const Spinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid ${theme.colors.border};
  border-top-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.75rem;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${theme.colors.textSecondary};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid ${theme.colors.border};
`;

const PageButton = styled.button<{ $active?: boolean }>`
  padding: 0.4rem 0.75rem;
  border: 1px solid ${({ $active }) => $active ? theme.colors.primary : theme.colors.border};
  background: ${({ $active }) => $active ? theme.colors.primary : 'white'};
  color: ${({ $active }) => $active ? 'white' : theme.colors.textPrimary};
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;

  &:hover:not(:disabled) {
    border-color: ${theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const OperationBadge = styled.span<{ $type: 'Modificación' | 'Insercion' | 'Eliminacion' }>`
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;

  ${({ $type }) => {
    switch ($type) {
      case 'Modificación':
        return `background: ${theme.colors.warning}20; color: ${theme.colors.warning};`;
      case 'Insercion':
        return `background: ${theme.colors.success}20; color: ${theme.colors.success};`;
      case 'Eliminacion':
        return `background: ${theme.colors.danger}20; color: ${theme.colors.danger};`;
      default:
        return `background: ${theme.colors.bgLight}; color: ${theme.colors.textSecondary};`;
    }
  }}
`;

// Types
interface LogEntry {
  id: number;
  work_order_id: number;
  created_at: string;
  observacion: string;
  operacion: 'Modificación' | 'Insercion' | 'Eliminacion';
  user_data: {
    nombre: string;
    apellido: string;
  };
  datos_modificados: {
    texto: string;
    antiguo_valor?: { descripcion: string };
    nuevo_valor?: { descripcion: string };
    valor?: { descripcion: string };
  }[];
}

interface DetalleLogOTProps {
  otId: number;
  onNavigate: (page: string, id?: number) => void;
}

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Función para obtener historial desde API
async function fetchHistorialCambios(otId: number, limite: number = 100): Promise<LogEntry[]> {
  const response = await fetch(`${API_BASE_URL}/work-orders/${otId}/historial-cambios?limite=${limite}`);
  if (!response.ok) {
    throw new Error('Error al cargar historial');
  }
  const data = await response.json();
  // Transformar respuesta del API al formato del componente
  return data.registros.map((reg: {
    id: number;
    work_order_id: number;
    created_at: string;
    observacion: string;
    operacion: string;
    user_data_json: string;
    datos_modificados_json: string;
  }) => {
    const userData = typeof reg.user_data_json === 'string'
      ? JSON.parse(reg.user_data_json || '{}')
      : reg.user_data_json || {};
    const datosModificados = typeof reg.datos_modificados_json === 'string'
      ? JSON.parse(reg.datos_modificados_json || '{}')
      : reg.datos_modificados_json || {};

    // Convertir objeto de cambios a array
    const modificadosArray = Object.entries(datosModificados).map(([campo, valor]) => {
      const v = valor as { texto?: string; antiguo_valor?: { descripcion: string }; nuevo_valor?: { descripcion: string }; valor?: { descripcion: string } };
      return {
        texto: v.texto || campo,
        antiguo_valor: v.antiguo_valor,
        nuevo_valor: v.nuevo_valor,
        valor: v.valor,
      };
    });

    return {
      id: reg.id,
      work_order_id: reg.work_order_id,
      created_at: reg.created_at,
      observacion: reg.observacion,
      operacion: reg.operacion as 'Modificación' | 'Insercion' | 'Eliminacion',
      user_data: {
        nombre: userData.nombre || 'Sistema',
        apellido: userData.apellido || '',
      },
      datos_modificados: modificadosArray.length > 0 ? modificadosArray : [{ texto: reg.observacion, valor: { descripcion: '-' } }],
    };
  });
}

export default function DetalleLogOT({ otId, onNavigate }: DetalleLogOTProps) {
  const [dateDesde, setDateDesde] = useState('');
  const [dateHasta, setDateHasta] = useState('');
  const [cambioId, setCambioId] = useState('');
  const [campoId, setCampoId] = useState('');
  const [userId, setUserId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch historial from real API
  const { data: logEntries, isLoading } = useQuery<LogEntry[]>({
    queryKey: ['ot-log', otId, dateDesde, dateHasta, cambioId, campoId, userId, currentPage],
    queryFn: () => fetchHistorialCambios(otId, 100),
  });

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    // Query will refetch automatically due to queryKey change
  }, []);

  const handleClearFilters = useCallback(() => {
    setDateDesde('');
    setDateHasta('');
    setCambioId('');
    setCampoId('');
    setUserId('');
    setCurrentPage(1);
  }, []);

  const handleExport = useCallback(() => {
    // TODO: Implement Excel export
    console.log('Exporting log for OT:', otId);
    alert('Exportacion en desarrollo');
  }, [otId]);

  // Flatten log entries for table display
  interface FlattenedEntry extends LogEntry {
    modIndex: number;
    campo: string;
    valorAntiguo: string;
    valorNuevo: string;
  }

  const flattenedEntries = useMemo((): FlattenedEntry[] => {
    if (!logEntries) return [];

    return logEntries.flatMap((entry: LogEntry) =>
      entry.datos_modificados.map((mod: LogEntry['datos_modificados'][0], idx: number) => ({
        ...entry,
        modIndex: idx,
        campo: mod.texto,
        valorAntiguo: entry.operacion === 'Modificación'
          ? mod.antiguo_valor?.descripcion || ''
          : 'N/A',
        valorNuevo: entry.operacion === 'Modificación'
          ? mod.nuevo_valor?.descripcion || ''
          : mod.valor?.descripcion || '',
      }))
    );
  }, [logEntries]);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container>
      <BackLink onClick={() => onNavigate('gestionar-ot', otId)}>← Volver a OT #{otId}</BackLink>
      <Title>Historial de Cambios - OT #{otId}</Title>

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
              <Label>ID Cambio</Label>
              <Input
                type="number"
                placeholder="ID..."
                value={cambioId}
                onChange={(e) => setCambioId(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>Campo Modificado</Label>
              <Select value={campoId} onChange={(e) => setCampoId(e.target.value)}>
                <option value="">Todos</option>
                <option value="cliente">Cliente</option>
                <option value="descripcion">Descripcion</option>
                <option value="estado">Estado</option>
                <option value="area">Area</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Usuario</Label>
              <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">Todos</option>
                {/* TODO: Load users from API */}
              </Select>
            </FormGroup>
          </FiltersGrid>
          <FiltersActions>
            <Button type="submit" $variant="primary">Filtrar</Button>
            <Button type="button" onClick={handleClearFilters}>Limpiar</Button>
            <Button type="button" $variant="outline" onClick={handleExport}>Exportar</Button>
          </FiltersActions>
        </form>
      </FiltersCard>

      {/* Results Table */}
      <TableContainer>
        {isLoading ? (
          <LoadingOverlay>
            <Spinner />
            <span>Cargando historial...</span>
          </LoadingOverlay>
        ) : flattenedEntries.length === 0 ? (
          <EmptyState>
            <p>No hay registros de cambios para esta OT</p>
          </EmptyState>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th style={{ width: '8%' }}>OT</Th>
                  <Th style={{ width: '8%' }}>ID Cambio</Th>
                  <Th style={{ width: '12%' }}>Fecha</Th>
                  <Th style={{ width: '15%' }}>Descripcion</Th>
                  <Th style={{ width: '12%' }}>Campo</Th>
                  <Th style={{ width: '15%' }}>Valor Antiguo</Th>
                  <Th style={{ width: '15%' }}>Valor Nuevo</Th>
                  <Th style={{ width: '15%' }}>Usuario</Th>
                </tr>
              </thead>
              <tbody>
                {flattenedEntries.map((entry) => (
                  <tr key={`${entry.id}-${entry.modIndex}`}>
                    <Td>{entry.work_order_id}</Td>
                    <Td>{entry.id}</Td>
                    <Td>{formatDateTime(entry.created_at)}</Td>
                    <Td>
                      <OperationBadge $type={entry.operacion}>{entry.operacion}</OperationBadge>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>{entry.observacion}</div>
                    </Td>
                    <Td>{entry.campo}</Td>
                    <Td>
                      {entry.valorAntiguo === 'N/A' ? (
                        <EmptyValue>N/A</EmptyValue>
                      ) : entry.valorAntiguo ? (
                        <ValueCell $type="old">{entry.valorAntiguo}</ValueCell>
                      ) : (
                        <EmptyValue>Campo Vacio</EmptyValue>
                      )}
                    </Td>
                    <Td>
                      {entry.valorNuevo ? (
                        <ValueCell $type="new">{entry.valorNuevo}</ValueCell>
                      ) : (
                        <EmptyValue>Campo Vacio</EmptyValue>
                      )}
                    </Td>
                    <Td>{entry.user_data.nombre} {entry.user_data.apellido}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Pagination */}
            <Pagination>
              <PageButton
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Anterior
              </PageButton>
              <PageButton $active>{currentPage}</PageButton>
              <PageButton onClick={() => setCurrentPage(p => p + 1)}>
                Siguiente
              </PageButton>
            </Pagination>
          </>
        )}
      </TableContainer>
    </Container>
  );
}
