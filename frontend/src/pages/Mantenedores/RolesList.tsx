/**
 * RolesList - Gestion de Roles del Sistema
 * CRUD completo para roles con soporte de permisos
 * FASE 6.35
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { theme } from '../../theme';
import { rolesApi, type RoleItem, type RoleFilters, type RoleCreate, type RoleUpdate } from '../../services/api';

// =============================================
// STYLED COMPONENTS
// =============================================

const Container = styled.div`
  padding: 1.5rem;
  max-width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    text-decoration: underline;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${({ $variant = 'primary' }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: ${theme.colors.primary};
          color: white;
          border: none;
          &:hover { background: ${theme.colors.primaryDark}; }
        `;
      case 'secondary':
        return `
          background: white;
          color: ${theme.colors.textPrimary};
          border: 1px solid ${theme.colors.border};
          &:hover { background: ${theme.colors.bgLight}; }
        `;
      case 'danger':
        return `
          background: ${theme.colors.danger};
          color: white;
          border: none;
          &:hover { opacity: 0.9; }
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
  margin-bottom: 1rem;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 200px auto;
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
  padding: 0.5rem 0.75rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

const Select = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const Th = styled.th`
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  background: ${theme.colors.bgLight};
  border-bottom: 1px solid ${theme.colors.border};
`;

const Td = styled.td`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: ${theme.colors.textPrimary};
  border-bottom: 1px solid ${theme.colors.border};
`;

const Badge = styled.span<{ $variant: 'success' | 'danger' | 'info' }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;

  ${({ $variant }) => {
    switch ($variant) {
      case 'success':
        return `background: ${theme.colors.success}20; color: ${theme.colors.success};`;
      case 'danger':
        return `background: ${theme.colors.danger}20; color: ${theme.colors.danger};`;
      case 'info':
        return `background: ${theme.colors.primary}20; color: ${theme.colors.primary};`;
    }
  }}
`;

const ActionButton = styled.button<{ $color?: string }>`
  padding: 0.25rem 0.5rem;
  border: none;
  background: ${({ $color }) => $color ? `${$color}15` : `${theme.colors.primary}15`};
  color: ${({ $color }) => $color || theme.colors.primary};
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  margin-right: 0.25rem;

  &:hover {
    background: ${({ $color }) => $color ? `${$color}25` : `${theme.colors.primary}25`};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
`;

const PaginationInfo = styled.span`
  font-size: 0.875rem;
  color: ${theme.colors.textSecondary};
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0 0 1.5rem 0;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid ${theme.colors.border};
`;

const TextArea = styled.textarea`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 0.875rem;
  min-height: 80px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

const Message = styled.div<{ $type: 'success' | 'error' }>`
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;

  ${({ $type }) => $type === 'success'
    ? `background: ${theme.colors.success}15; color: ${theme.colors.success}; border: 1px solid ${theme.colors.success}30;`
    : `background: ${theme.colors.danger}15; color: ${theme.colors.danger}; border: 1px solid ${theme.colors.danger}30;`
  }
`;

const LoadingOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: ${theme.colors.textSecondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${theme.colors.textSecondary};
`;

// =============================================
// COMPONENT
// =============================================

interface RolesListProps {
  onNavigate?: (page: string) => void;
}

export default function RolesList({ onNavigate }: RolesListProps) {
  const queryClient = useQueryClient();

  // State
  const [filters, setFilters] = useState<RoleFilters>({
    page: 1,
    page_size: 20,
    search: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [formData, setFormData] = useState<RoleCreate>({ nombre: '', descripcion: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['roles', filters],
    queryFn: () => rolesApi.list(filters),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: RoleCreate) => rolesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowModal(false);
      setFormData({ nombre: '', descripcion: '' });
      setMessage({ type: 'success', text: 'Rol creado exitosamente' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: Error) => {
      setMessage({ type: 'error', text: err.message || 'Error al crear rol' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoleUpdate }) => rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowModal(false);
      setEditingRole(null);
      setFormData({ nombre: '', descripcion: '' });
      setMessage({ type: 'success', text: 'Rol actualizado exitosamente' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: Error) => {
      setMessage({ type: 'error', text: err.message || 'Error al actualizar rol' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setMessage({ type: 'success', text: 'Rol eliminado exitosamente' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: Error) => {
      setMessage({ type: 'error', text: err.message || 'Error al eliminar rol' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => rolesApi.update(id, { activo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  // Handlers
  const handleSearch = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  }, []);

  const handleFilterActive = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      activo: value === '' ? undefined : value === 'true',
      page: 1,
    }));
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingRole(null);
    setFormData({ nombre: '', descripcion: '' });
    setShowModal(true);
  }, []);

  const handleOpenEdit = useCallback((role: RoleItem) => {
    setEditingRole(role);
    setFormData({ nombre: role.nombre, descripcion: role.descripcion || '' });
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formData.nombre.trim()) {
      setMessage({ type: 'error', text: 'El nombre es requerido' });
      return;
    }

    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }, [formData, editingRole, createMutation, updateMutation]);

  const handleDelete = useCallback((role: RoleItem) => {
    if (role.users_count > 0) {
      setMessage({ type: 'error', text: `No se puede eliminar: hay ${role.users_count} usuario(s) con este rol` });
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    if (confirm(`¿Eliminar el rol "${role.nombre}"?`)) {
      deleteMutation.mutate(role.id);
    }
  }, [deleteMutation]);

  const handleToggleActive = useCallback((role: RoleItem) => {
    toggleActiveMutation.mutate({ id: role.id, activo: !role.activo });
  }, [toggleActiveMutation]);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  // Pagination info
  const paginationInfo = useMemo(() => {
    if (!data) return null;
    const start = (data.page - 1) * data.page_size + 1;
    const end = Math.min(data.page * data.page_size, data.total);
    return `${start}-${end} de ${data.total} roles`;
  }, [data]);

  return (
    <Container>
      <Header>
        <div>
          <BackButton onClick={() => onNavigate?.('dashboard')}>
            ← Volver al Dashboard
          </BackButton>
          <Title>Gestion de Roles</Title>
        </div>
        <HeaderActions>
          <Button onClick={handleOpenCreate}>
            + Nuevo Rol
          </Button>
        </HeaderActions>
      </Header>

      {message && (
        <Message $type={message.type}>{message.text}</Message>
      )}

      <FiltersCard>
        <FiltersGrid>
          <FormGroup>
            <Label>Buscar</Label>
            <Input
              type="text"
              placeholder="Buscar por nombre..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label>Estado</Label>
            <Select
              value={filters.activo === undefined ? '' : filters.activo.toString()}
              onChange={(e) => handleFilterActive(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </Select>
          </FormGroup>
          <Button
            $variant="secondary"
            onClick={() => setFilters({ page: 1, page_size: 20, search: '' })}
          >
            Limpiar
          </Button>
        </FiltersGrid>
      </FiltersCard>

      {isLoading ? (
        <LoadingOverlay>Cargando roles...</LoadingOverlay>
      ) : error ? (
        <Message $type="error">Error al cargar roles: {String(error)}</Message>
      ) : !data?.items.length ? (
        <EmptyState>
          <p>No se encontraron roles</p>
          <Button onClick={handleOpenCreate} style={{ marginTop: '1rem' }}>
            Crear primer rol
          </Button>
        </EmptyState>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Nombre</Th>
                <Th>Descripcion</Th>
                <Th>Usuarios</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((role) => (
                <tr key={role.id}>
                  <Td>{role.id}</Td>
                  <Td><strong>{role.nombre}</strong></Td>
                  <Td>{role.descripcion || '-'}</Td>
                  <Td>
                    <Badge $variant="info">{role.users_count} usuarios</Badge>
                  </Td>
                  <Td>
                    <Badge $variant={role.activo ? 'success' : 'danger'}>
                      {role.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Td>
                  <Td>
                    <ActionButton onClick={() => handleOpenEdit(role)}>
                      Editar
                    </ActionButton>
                    <ActionButton
                      $color={role.activo ? theme.colors.warning : theme.colors.success}
                      onClick={() => handleToggleActive(role)}
                      disabled={toggleActiveMutation.isPending}
                    >
                      {role.activo ? 'Desactivar' : 'Activar'}
                    </ActionButton>
                    <ActionButton
                      $color={theme.colors.danger}
                      onClick={() => handleDelete(role)}
                      disabled={deleteMutation.isPending || role.users_count > 0}
                      title={role.users_count > 0 ? 'No se puede eliminar: tiene usuarios asignados' : ''}
                    >
                      Eliminar
                    </ActionButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Pagination>
            <PaginationInfo>{paginationInfo}</PaginationInfo>
            <PaginationButtons>
              <Button
                $variant="secondary"
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page <= 1}
              >
                Anterior
              </Button>
              <Button
                $variant="secondary"
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page >= data.total_pages}
              >
                Siguiente
              </Button>
            </PaginationButtons>
          </Pagination>
        </>
      )}

      {/* Modal para crear/editar */}
      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {editingRole ? `Editar Rol: ${editingRole.nombre}` : 'Nuevo Rol'}
            </ModalTitle>
            <ModalBody>
              <FormGroup>
                <Label>Nombre *</Label>
                <Input
                  type="text"
                  placeholder="Nombre del rol"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <Label>Descripcion</Label>
                <TextArea
                  placeholder="Descripcion del rol (opcional)"
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button $variant="secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Guardando...'
                  : editingRole ? 'Actualizar' : 'Crear'
                }
              </Button>
            </ModalFooter>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
}
