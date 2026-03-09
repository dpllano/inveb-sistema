/**
 * UsersList Component
 * Mantenedor de Usuarios - Lista con CRUD
 */

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import {
  useUsersList,
  useRoles,
  useCreateUser,
  useUpdateUser,
  useActivateUser,
  useDeactivateUser,
} from '../../hooks/useMantenedores';
import type { UserFilters, UserCreate, UserUpdate, UserDetail } from '../../services/api';
import UserForm from './UserForm';

// Styled Components (reutilizamos los mismos estilos de ClientsList)
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

const Badge = styled.span<{ $type?: 'active' | 'inactive' | 'info' | 'role' | 'area' }>`
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
      case 'role':
        return `
          background: #6c757d15;
          color: #6c757d;
        `;
      case 'area':
        return `
          background: ${theme.colors.primary}15;
          color: ${theme.colors.primary};
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
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Types
interface UsersListProps {
  onNavigate: (page: string, id?: number) => void;
}

export default function UsersList({ onNavigate }: UsersListProps) {
  // State
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Build filters
  const filters: UserFilters = {
    page,
    page_size: 20,
    search: searchTerm || undefined,
    role_id: roleFilter || undefined,
    active: activeFilter,
  };

  // Hooks
  const { data, isLoading, error } = useUsersList(filters);
  const { data: roles } = useRoles();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const activateMutation = useActivateUser();
  const deactivateMutation = useDeactivateUser();

  // Handlers
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setRoleFilter(null);
    setActiveFilter(undefined);
    setPage(1);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingUser(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((user: UserDetail) => {
    setEditingUser(user);
    setShowForm(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingUser(null);
  }, []);

  const handleFormSubmit = useCallback(async (formData: UserCreate | UserUpdate) => {
    try {
      if (editingUser) {
        await updateMutation.mutateAsync({ id: editingUser.id, data: formData as UserUpdate });
        setSuccessMessage('Usuario actualizado correctamente');
      } else {
        await createMutation.mutateAsync(formData as UserCreate);
        setSuccessMessage('Usuario creado correctamente');
      }
      setShowForm(false);
      setEditingUser(null);
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Error al guardar usuario');
      setSuccessMessage(null);
    }
  }, [editingUser, createMutation, updateMutation]);

  const handleActivate = useCallback(async (id: number) => {
    try {
      await activateMutation.mutateAsync(id);
      setSuccessMessage('Usuario activado correctamente');
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Error al activar usuario');
    }
  }, [activateMutation]);

  const handleDeactivate = useCallback(async (id: number) => {
    if (!window.confirm('¿Está seguro de desactivar este usuario?')) return;
    try {
      await deactivateMutation.mutateAsync(id);
      setSuccessMessage('Usuario desactivado correctamente');
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Error al desactivar usuario');
    }
  }, [deactivateMutation]);

  // Render loading
  if (isLoading) {
    return (
      <Container>
        <Header>
          <Title>Mantenedor de Usuarios</Title>
          <HeaderActions>
            <Button onClick={() => onNavigate('dashboard')}>
              ← Volver al Dashboard
            </Button>
          </HeaderActions>
        </Header>
        <LoadingOverlay>
          <Spinner />
          <span>Cargando usuarios...</span>
        </LoadingOverlay>
      </Container>
    );
  }

  // Render error
  if (error) {
    return (
      <Container>
        <Header>
          <Title>Mantenedor de Usuarios</Title>
          <HeaderActions>
            <Button onClick={() => onNavigate('dashboard')}>
              ← Volver al Dashboard
            </Button>
          </HeaderActions>
        </Header>
        <Alert $type="error">Error al cargar usuarios. Intente nuevamente.</Alert>
      </Container>
    );
  }

  const users = data?.items || [];
  const totalPages = data?.total_pages || 1;
  const total = data?.total || 0;

  // Render form modal
  if (showForm) {
    return (
      <Container>
        <Header>
          <Title>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</Title>
          <HeaderActions>
            <Button onClick={handleFormClose}>
              ← Cancelar
            </Button>
          </HeaderActions>
        </Header>
        {successMessage && <Alert $type="success">{successMessage}</Alert>}
        {errorMessage && <Alert $type="error">{errorMessage}</Alert>}
        <UserForm
          user={editingUser}
          roles={roles || []}
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
        <Title>Mantenedor de Usuarios</Title>
        <HeaderActions>
          <Button $variant="primary" onClick={handleCreate}>
            + Nuevo Usuario
          </Button>
          <Button onClick={() => onNavigate('dashboard')}>
            ← Volver al Dashboard
          </Button>
        </HeaderActions>
      </Header>

      {successMessage && <Alert $type="success">{successMessage}</Alert>}
      {errorMessage && <Alert $type="error">{errorMessage}</Alert>}

      {/* Filters */}
      <FiltersCard>
        <form onSubmit={handleSearch}>
          <FiltersGrid>
            <FormGroup>
              <Label>Buscar</Label>
              <Input
                type="text"
                placeholder="RUT, nombre, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>Rol</Label>
              <Select
                value={roleFilter || ''}
                onChange={(e) => setRoleFilter(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Todos</option>
                {roles?.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Estado</Label>
              <Select
                value={activeFilter === undefined ? '' : activeFilter ? 'true' : 'false'}
                onChange={(e) => setActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>&nbsp;</Label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button type="submit" $variant="primary">Buscar</Button>
                <Button type="button" onClick={handleClearFilters}>Limpiar</Button>
              </div>
            </FormGroup>
          </FiltersGrid>
        </form>
      </FiltersCard>

      <ResultsInfo>
        Mostrando {users.length} de {total} usuarios
      </ResultsInfo>

      <TableContainer>
        {users.length === 0 ? (
          <EmptyState>
            <p>No se encontraron usuarios</p>
          </EmptyState>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>RUT</Th>
                  <Th>Nombre</Th>
                  <Th>Email</Th>
                  <Th>Rol</Th>
                  <Th>Estado</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <Tr key={user.id}>
                    <Td>{user.id}</Td>
                    <Td>{user.rut}</Td>
                    <Td>
                      <TruncatedText title={`${user.nombre} ${user.apellido}`}>
                        {user.nombre} {user.apellido}
                      </TruncatedText>
                    </Td>
                    <Td>
                      <TruncatedText title={user.email || ''}>
                        {user.email || '-'}
                      </TruncatedText>
                    </Td>
                    <Td>
                      {user.role_nombre && (
                        <Badge $type="role">{user.role_nombre}</Badge>
                      )}
                    </Td>
                    <Td>
                      <Badge $type={user.active ? 'active' : 'inactive'}>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </Td>
                    <Td>
                      <ActionButton
                        $variant="edit"
                        onClick={() => handleEdit(user as UserDetail)}
                        title="Editar"
                      >
                        Editar
                      </ActionButton>
                      {user.active ? (
                        <ActionButton
                          $variant="deactivate"
                          onClick={() => handleDeactivate(user.id)}
                          disabled={deactivateMutation.isPending}
                          title="Desactivar"
                        >
                          Desactivar
                        </ActionButton>
                      ) : (
                        <ActionButton
                          $variant="activate"
                          onClick={() => handleActivate(user.id)}
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
