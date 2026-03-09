/**
 * ClientsList Component
 * Mantenedor de Clientes - Lista con CRUD
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import {
  useClientsList,
  useClasificaciones,
  useCreateClient,
  useUpdateClient,
  useActivateClient,
  useDeactivateClient,
  useClientDetail,
} from '../../hooks/useMantenedores';
import type { ClientFilters, ClientCreate, ClientUpdate } from '../../services/api';
import ClientForm from './ClientForm';

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
  padding: 0.5rem 1.25rem;
  border-radius: 50px;
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
          &:hover { background: #002d66; }
        `;
      case 'success':
        return `
          background: ${theme.colors.success};
          color: white;
          border-color: ${theme.colors.success};
          &:hover { background: #218838; }
        `;
      case 'danger':
        return `
          background: ${theme.colors.danger};
          color: white;
          border-color: ${theme.colors.danger};
          &:hover { background: #c82333; }
        `;
      default:
        return `
          background: white;
          color: ${theme.colors.textSecondary};
          border-color: ${theme.colors.border};
          &:hover {
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

const FiltersCard = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
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
  font-size: 0.875rem;
`;

const Th = styled.th`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 0.75rem;
  text-align: left;
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid ${theme.colors.border};
  vertical-align: middle;
`;

const Tr = styled.tr`
  &:hover {
    background: ${theme.colors.bgLight};
  }

  &:last-child td {
    border-bottom: none;
  }
`;

const Badge = styled.span<{ $type?: 'active' | 'inactive' | 'info' }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 500;

  ${props => {
    switch (props.$type) {
      case 'active':
        return `
          background: ${theme.colors.success}15;
          color: ${theme.colors.success};
        `;
      case 'inactive':
        return `
          background: ${theme.colors.danger}15;
          color: ${theme.colors.danger};
        `;
      default:
        return `
          background: ${theme.colors.primary}15;
          color: ${theme.colors.primary};
        `;
    }
  }}
`;

const ActionButton = styled.button<{ $variant?: 'edit' | 'activate' | 'deactivate' }>`
  padding: 0.35rem 0.65rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 0.25rem;

  ${props => {
    switch (props.$variant) {
      case 'edit':
        return `
          background: ${theme.colors.primary};
          color: white;
          &:hover { background: #002d66; }
        `;
      case 'activate':
        return `
          background: ${theme.colors.success};
          color: white;
          &:hover { background: #218838; }
        `;
      case 'deactivate':
        return `
          background: ${theme.colors.danger};
          color: white;
          &:hover { background: #c82333; }
        `;
      default:
        return `
          background: ${theme.colors.border};
          color: ${theme.colors.textPrimary};
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

const ResultsInfo = styled.div`
  margin-bottom: 1rem;
  color: ${theme.colors.textSecondary};
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

const TruncatedText = styled.span`
  display: block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Types
interface ClientsListProps {
  onNavigate: (page: string, id?: number) => void;
}

export default function ClientsList({ onNavigate }: ClientsListProps) {
  // State
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [clasificacionFilter, setClasificacionFilter] = useState<number | null>(null);
  const [activoFilter, setActivoFilter] = useState<boolean | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debounce search term for automatic filtering - 500ms para dar tiempo de escribir
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Build filters with debounced search
  const filters: ClientFilters = useMemo(() => ({
    page,
    page_size: 20,
    search: debouncedSearchTerm || undefined,
    clasificacion_id: clasificacionFilter || undefined,
    activo: activoFilter,
  }), [page, debouncedSearchTerm, clasificacionFilter, activoFilter]);

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, clasificacionFilter, activoFilter]);

  // Hooks
  const { data, isLoading, error } = useClientsList(filters);
  const { data: clasificaciones } = useClasificaciones();
  // Issue 3: Obtener datos completos del cliente para edición
  const { data: editingClient, isLoading: isLoadingClient } = useClientDetail(editingClientId);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const activateMutation = useActivateClient();
  const deactivateMutation = useDeactivateClient();

  // Handlers
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setClasificacionFilter(null);
    setActivoFilter(undefined);
    setPage(1);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingClientId(null);
    setShowForm(true);
  }, []);

  // Issue 3: Obtener datos completos del cliente al editar
  const handleEdit = useCallback((clientId: number) => {
    setEditingClientId(clientId);
    setShowForm(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingClientId(null);
  }, []);

  const handleFormSubmit = useCallback(async (formData: ClientCreate | ClientUpdate) => {
    try {
      if (editingClientId && editingClient) {
        await updateMutation.mutateAsync({ id: editingClient.id, data: formData as ClientUpdate });
        setSuccessMessage('Cliente actualizado correctamente');
      } else {
        await createMutation.mutateAsync(formData as ClientCreate);
        setSuccessMessage('Cliente creado correctamente');
      }
      setShowForm(false);
      setEditingClientId(null);
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Error al guardar cliente');
      setSuccessMessage(null);
    }
  }, [editingClientId, editingClient, createMutation, updateMutation]);

  const handleActivate = useCallback(async (id: number) => {
    try {
      await activateMutation.mutateAsync(id);
      setSuccessMessage('Cliente activado correctamente');
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Error al activar cliente');
    }
  }, [activateMutation]);

  const handleDeactivate = useCallback(async (id: number) => {
    if (!window.confirm('¿Está seguro de desactivar este cliente?')) return;
    try {
      await deactivateMutation.mutateAsync(id);
      setSuccessMessage('Cliente desactivado correctamente');
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Error al desactivar cliente');
    }
  }, [deactivateMutation]);

  // Ya no hacemos early return por loading para mantener el input de busqueda visible
  const clients = data?.items || [];
  const totalPages = data?.total_pages || 1;
  const total = data?.total || 0;

  // Render form modal
  if (showForm) {
    // Si estamos editando y aún no se cargan los datos, mostrar loading
    if (editingClientId && isLoadingClient) {
      return (
        <Container>
          <Header>
            <Title>Editar Cliente</Title>
            <HeaderActions>
              <Button onClick={handleFormClose}>
                ← Cancelar
              </Button>
            </HeaderActions>
          </Header>
          <LoadingOverlay>
            <Spinner />
            <span>Cargando datos del cliente...</span>
          </LoadingOverlay>
        </Container>
      );
    }

    return (
      <Container>
        <Header>
          <Title>{editingClientId ? 'Editar Cliente' : 'Nuevo Cliente'}</Title>
          <HeaderActions>
            <Button onClick={handleFormClose}>
              ← Cancelar
            </Button>
          </HeaderActions>
        </Header>
        <ClientForm
          client={editingClient || null}
          clasificaciones={clasificaciones || []}
          onSubmit={handleFormSubmit}
          onCancel={handleFormClose}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Mantenedor de Clientes</Title>
        <HeaderActions>
          <Button $variant="primary" onClick={handleCreate}>
            + Nuevo Cliente
          </Button>
          <Button onClick={() => onNavigate('dashboard')}>
            ← Volver al Dashboard
          </Button>
        </HeaderActions>
      </Header>

      {successMessage && <Alert $type="success">{successMessage}</Alert>}
      {errorMessage && <Alert $type="error">{errorMessage}</Alert>}

      {/* Filters - Issue 1-2: Búsqueda automática sin botón */}
      <FiltersCard>
        <FiltersGrid>
          <FormGroup>
            <Label>Buscar (filtra automáticamente)</Label>
            <Input
              type="text"
              placeholder="RUT, nombre, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label>Clasificacion</Label>
            <Select
              value={clasificacionFilter || ''}
              onChange={(e) => setClasificacionFilter(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Todas</option>
              {clasificaciones?.map(c => (
                <option key={c.id} value={c.id}>{c.descripcion}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Estado</Label>
            <Select
              value={activoFilter === undefined ? '' : activoFilter ? 'true' : 'false'}
              onChange={(e) => setActivoFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>&nbsp;</Label>
            <Button type="button" onClick={handleClearFilters}>Limpiar Filtros</Button>
          </FormGroup>
        </FiltersGrid>
      </FiltersCard>

      <ResultsInfo>
        {isLoading ? 'Buscando...' : `Mostrando ${clients.length} de ${total} clientes`}
      </ResultsInfo>

      {error && <Alert $type="error">Error al cargar clientes. Intente nuevamente.</Alert>}

      <TableContainer>
        {isLoading ? (
          <LoadingOverlay>
            <Spinner />
            <span>Cargando clientes...</span>
          </LoadingOverlay>
        ) : clients.length === 0 ? (
          <EmptyState>
            <p>No se encontraron clientes</p>
          </EmptyState>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>RUT</Th>
                  <Th>Nombre</Th>
                  <Th>Clasificacion</Th>
                  <Th>Email</Th>
                  <Th>Telefono</Th>
                  <Th>Estado</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <Tr key={client.id}>
                    <Td>{client.id}</Td>
                    <Td>{client.rut}</Td>
                    <Td>
                      <TruncatedText title={client.nombre_sap}>
                        {client.nombre_sap}
                      </TruncatedText>
                    </Td>
                    <Td>
                      {client.clasificacion_nombre && (
                        <Badge $type="info">{client.clasificacion_nombre}</Badge>
                      )}
                    </Td>
                    <Td>
                      <TruncatedText title={client.email_contacto_1 || ''}>
                        {client.email_contacto_1 || '-'}
                      </TruncatedText>
                    </Td>
                    <Td>{client.phone_contacto_1 || '-'}</Td>
                    <Td>
                      <Badge $type={client.active === 1 ? 'active' : 'inactive'}>
                        {client.active === 1 ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </Td>
                    <Td>
                      <ActionButton
                        $variant="edit"
                        onClick={() => handleEdit(client.id)}
                        title="Editar"
                      >
                        Editar
                      </ActionButton>
                      {client.active === 1 ? (
                        <ActionButton
                          $variant="deactivate"
                          onClick={() => handleDeactivate(client.id)}
                          disabled={deactivateMutation.isPending}
                          title="Desactivar"
                        >
                          Desactivar
                        </ActionButton>
                      ) : (
                        <ActionButton
                          $variant="activate"
                          onClick={() => handleActivate(client.id)}
                          disabled={activateMutation.isPending}
                          title="Activar"
                        >
                          Activar
                        </ActionButton>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>

            {totalPages > 1 && (
              <Pagination>
                <PageButton
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Anterior
                </PageButton>
                <PageInfo>
                  Pagina {page} de {totalPages}
                </PageInfo>
                <PageButton
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
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
