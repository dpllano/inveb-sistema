/**
 * Jerarquías List - Componente para mantenedor de Jerarquías (Nivel 1, 2, 3)
 */
import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import {
  jerarquiasApi,
  type Jerarquia1Item,
  type Jerarquia2Item,
  type Jerarquia3Item,
  type ParentOption,
} from '../../services/api';

// =============================================
// STYLED COMPONENTS
// =============================================

const Container = styled.div`
  background: white;
  border-radius: ${theme.radius.lg};
  box-shadow: ${theme.shadows.sm};
  padding: ${theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
`;

const Title = styled.h2`
  color: ${theme.colors.textPrimary};
  font-size: ${theme.typography.sizes.h2};
  margin: 0;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.lg};
  border-bottom: 2px solid ${theme.colors.border};
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border: none;
  background: ${({ $active }) => $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active }) => $active ? 'white' : theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.body};
  font-weight: ${theme.typography.weights.medium};
  cursor: pointer;
  border-radius: ${theme.radius.md} ${theme.radius.md} 0 0;
  transition: all 0.2s;

  &:hover {
    background: ${({ $active }) => $active ? theme.colors.primary : theme.colors.bgLight};
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'success' | 'danger' | 'secondary' }>`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: none;
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.small};
  font-weight: ${theme.typography.weights.medium};
  cursor: pointer;
  transition: all 0.2s;

  ${({ $variant = 'primary' }) => {
    switch ($variant) {
      case 'success':
        return `background: ${theme.colors.success}; color: white;`;
      case 'danger':
        return `background: ${theme.colors.danger}; color: white;`;
      case 'secondary':
        return `background: ${theme.colors.bgLight}; color: ${theme.colors.textSecondary}; border: 1px solid ${theme.colors.border};`;
      default:
        return `background: ${theme.colors.primary}; color: white;`;
    }
  }}

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FiltersRow = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  flex-wrap: wrap;
`;

const Input = styled.input`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const Select = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.bgLight};
  border-bottom: 2px solid ${theme.colors.border};
  font-weight: ${theme.typography.weights.semibold};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.small};
`;

const Td = styled.td`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
  font-size: ${theme.typography.sizes.body};
`;

const Tr = styled.tr`
  &:hover {
    background: ${theme.colors.bgLight};
  }
`;

const Badge = styled.span<{ $active: boolean }>`
  padding: 2px 8px;
  border-radius: ${theme.radius.full};
  font-size: ${theme.typography.sizes.small};
  background: ${({ $active }) => $active ? `${theme.colors.success}20` : `${theme.colors.danger}20`};
  color: ${({ $active }) => $active ? theme.colors.success : theme.colors.danger};
`;

const CountBadge = styled.span`
  padding: 2px 8px;
  border-radius: ${theme.radius.full};
  font-size: ${theme.typography.sizes.small};
  background: ${theme.colors.primary}20;
  color: ${theme.colors.primary};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
`;

const IconButton = styled.button<{ $color?: string }>`
  padding: ${theme.spacing.xs};
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ $color }) => $color || theme.colors.textSecondary};
  font-size: 16px;

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.lg};
`;

const PageInfo = styled.span`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.small};
`;

const Message = styled.div<{ $type: 'success' | 'error' }>`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.radius.md};
  margin-bottom: ${theme.spacing.md};
  background: ${({ $type }) => $type === 'success' ? `${theme.colors.success}15` : `${theme.colors.danger}15`};
  color: ${({ $type }) => $type === 'success' ? theme.colors.success : theme.colors.danger};
`;

const Modal = styled.div`
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

const ModalContent = styled.div`
  background: white;
  border-radius: ${theme.radius.lg};
  padding: ${theme.spacing.xl};
  min-width: 400px;
  max-width: 500px;
`;

const ModalTitle = styled.h3`
  margin: 0 0 ${theme.spacing.lg};
  color: ${theme.colors.textPrimary};
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${theme.spacing.xs};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.small};
  font-weight: ${theme.typography.weights.medium};
`;

const FormInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  box-sizing: border-box;
  background: white;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.lg};
`;

const LoadingOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.xl};
  color: ${theme.colors.textSecondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xl};
  color: ${theme.colors.textSecondary};
`;

// =============================================
// COMPONENT
// =============================================

type NivelType = 1 | 2 | 3;

interface JerarquiasListProps {
  nivel: NivelType;
  onNavigate?: (page: string) => void;
}

export default function JerarquiasList({ nivel: initialNivel }: JerarquiasListProps) {
  const [nivel, setNivel] = useState<NivelType>(initialNivel);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterActivo, setFilterActivo] = useState<string>('');
  const [filterParent, setFilterParent] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Data
  const [items1, setItems1] = useState<Jerarquia1Item[]>([]);
  const [items2, setItems2] = useState<Jerarquia2Item[]>([]);
  const [items3, setItems3] = useState<Jerarquia3Item[]>([]);
  const [parents1, setParents1] = useState<ParentOption[]>([]);
  const [parents2, setParents2] = useState<ParentOption[]>([]);

  // Form
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formJerarquiaSap, setFormJerarquiaSap] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');

  // Cargar padres
  useEffect(() => {
    const loadParents = async () => {
      try {
        if (nivel >= 2) {
          const p1 = await jerarquiasApi.getNivel2Parents();
          setParents1(p1);
        }
        if (nivel === 3) {
          const p2 = await jerarquiasApi.getNivel3Parents();
          setParents2(p2);
        }
      } catch (error) {
        console.error('Error loading parents:', error);
      }
    };
    loadParents();
  }, [nivel]);

  // Cargar datos
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        page,
        page_size: 20,
        search: search || undefined,
        activo: filterActivo ? parseInt(filterActivo) : undefined,
        hierarchy_id: filterParent && nivel >= 2 ? parseInt(filterParent) : undefined,
        subhierarchy_id: filterParent && nivel === 3 ? parseInt(filterParent) : undefined,
      };

      if (nivel === 1) {
        const res = await jerarquiasApi.listNivel1(filters);
        setItems1(res.items);
        setTotalPages(res.total_pages);
        setTotal(res.total);
      } else if (nivel === 2) {
        const res = await jerarquiasApi.listNivel2(filters);
        setItems2(res.items);
        setTotalPages(res.total_pages);
        setTotal(res.total);
      } else {
        const res = await jerarquiasApi.listNivel3(filters);
        setItems3(res.items);
        setTotalPages(res.total_pages);
        setTotal(res.total);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setErrorMessage('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [nivel, page, search, filterActivo, filterParent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset al cambiar nivel
  useEffect(() => {
    setPage(1);
    setSearch('');
    setFilterActivo('');
    setFilterParent('');
  }, [nivel]);

  // Handlers
  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormDescripcion('');
    setFormJerarquiaSap('');
    setFormParentId('');
    setShowModal(true);
  };

  const handleOpenEdit = async (id: number) => {
    try {
      if (nivel === 1) {
        const detail = await jerarquiasApi.getNivel1(id);
        setFormDescripcion(detail.descripcion);
      } else if (nivel === 2) {
        const detail = await jerarquiasApi.getNivel2(id);
        setFormDescripcion(detail.descripcion);
        setFormParentId(detail.hierarchy_id.toString());
      } else {
        const detail = await jerarquiasApi.getNivel3(id);
        setFormDescripcion(detail.descripcion);
        setFormJerarquiaSap(detail.jerarquia_sap || '');
        setFormParentId(detail.subhierarchy_id.toString());
      }
      setEditingId(id);
      setShowModal(true);
    } catch (error) {
      console.error('Error loading item:', error);
      setErrorMessage('Error al cargar el item');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formDescripcion.trim()) {
      setErrorMessage('La descripción es requerida');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      if (nivel === 1) {
        if (editingId) {
          await jerarquiasApi.updateNivel1(editingId, { descripcion: formDescripcion });
        } else {
          await jerarquiasApi.createNivel1({ descripcion: formDescripcion });
        }
      } else if (nivel === 2) {
        if (!formParentId) {
          setErrorMessage('Debe seleccionar una Jerarquía 1');
          setSaving(false);
          return;
        }
        if (editingId) {
          await jerarquiasApi.updateNivel2(editingId, {
            descripcion: formDescripcion,
            hierarchy_id: parseInt(formParentId),
          });
        } else {
          await jerarquiasApi.createNivel2({
            descripcion: formDescripcion,
            hierarchy_id: parseInt(formParentId),
          });
        }
      } else {
        if (!formParentId) {
          setErrorMessage('Debe seleccionar una Jerarquía 2');
          setSaving(false);
          return;
        }
        if (editingId) {
          await jerarquiasApi.updateNivel3(editingId, {
            descripcion: formDescripcion,
            jerarquia_sap: formJerarquiaSap || undefined,
            subhierarchy_id: parseInt(formParentId),
          });
        } else {
          await jerarquiasApi.createNivel3({
            descripcion: formDescripcion,
            jerarquia_sap: formJerarquiaSap || undefined,
            subhierarchy_id: parseInt(formParentId),
          });
        }
      }
      setSuccessMessage(editingId ? 'Actualizado exitosamente' : 'Creado exitosamente');
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Error saving:', error);
      setErrorMessage('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      if (nivel === 1) await jerarquiasApi.activateNivel1(id);
      else if (nivel === 2) await jerarquiasApi.activateNivel2(id);
      else await jerarquiasApi.activateNivel3(id);
      setSuccessMessage('Activado');
      loadData();
    } catch (error) {
      console.error('Error activating:', error);
      setErrorMessage('Error al activar');
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      if (nivel === 1) await jerarquiasApi.deactivateNivel1(id);
      else if (nivel === 2) await jerarquiasApi.deactivateNivel2(id);
      else await jerarquiasApi.deactivateNivel3(id);
      setSuccessMessage('Desactivado');
      loadData();
    } catch (error) {
      console.error('Error deactivating:', error);
      setErrorMessage('Error al desactivar');
    }
  };

  // Limpiar mensajes
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const getNivelTitle = () => {
    switch (nivel) {
      case 1: return 'Jerarquías Nivel 1';
      case 2: return 'Jerarquías Nivel 2';
      case 3: return 'Jerarquías Nivel 3';
    }
  };

  // Render
  return (
    <Container>
      <Header>
        <Title>{getNivelTitle()}</Title>
        <Button onClick={handleOpenCreate}>+ Nueva Jerarquía</Button>
      </Header>

      <TabsContainer>
        <Tab $active={nivel === 1} onClick={() => setNivel(1)}>Nivel 1</Tab>
        <Tab $active={nivel === 2} onClick={() => setNivel(2)}>Nivel 2</Tab>
        <Tab $active={nivel === 3} onClick={() => setNivel(3)}>Nivel 3</Tab>
      </TabsContainer>

      {successMessage && <Message $type="success">{successMessage}</Message>}
      {errorMessage && <Message $type="error">{errorMessage}</Message>}

      <FiltersRow>
        <Input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        {nivel >= 2 && (
          <Select value={filterParent} onChange={(e) => { setFilterParent(e.target.value); setPage(1); }}>
            <option value="">Todas las Jerarquías {nivel === 2 ? '1' : '2'}</option>
            {(nivel === 2 ? parents1 : parents2).map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </Select>
        )}
        <Select value={filterActivo} onChange={(e) => { setFilterActivo(e.target.value); setPage(1); }}>
          <option value="">Todos</option>
          <option value="1">Activos</option>
          <option value="0">Inactivos</option>
        </Select>
        <Button onClick={handleSearch}>Filtrar</Button>
      </FiltersRow>

      <PageInfo>Mostrando {nivel === 1 ? items1.length : nivel === 2 ? items2.length : items3.length} de {total} registros</PageInfo>

      {loading ? (
        <LoadingOverlay>Cargando...</LoadingOverlay>
      ) : (nivel === 1 ? items1.length : nivel === 2 ? items2.length : items3.length) === 0 ? (
        <EmptyState>No hay registros</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Descripción</Th>
              {nivel === 3 && <Th>SAP</Th>}
              {nivel >= 2 && <Th>Padre</Th>}
              {nivel < 3 && <Th>Hijos</Th>}
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {nivel === 1 && items1.map((item) => (
              <Tr key={item.id}>
                <Td>{item.id}</Td>
                <Td>{item.descripcion}</Td>
                <Td><CountBadge>{item.count_children}</CountBadge></Td>
                <Td><Badge $active={item.active === 1}>{item.active === 1 ? 'Activo' : 'Inactivo'}</Badge></Td>
                <Td>
                  <ActionButtons>
                    <IconButton onClick={() => handleOpenEdit(item.id)} title="Editar">✏️</IconButton>
                    {item.active === 1 ? (
                      <IconButton $color={theme.colors.danger} onClick={() => handleDeactivate(item.id)} title="Desactivar">✗</IconButton>
                    ) : (
                      <IconButton $color={theme.colors.success} onClick={() => handleActivate(item.id)} title="Activar">✓</IconButton>
                    )}
                  </ActionButtons>
                </Td>
              </Tr>
            ))}
            {nivel === 2 && items2.map((item) => (
              <Tr key={item.id}>
                <Td>{item.id}</Td>
                <Td>{item.descripcion}</Td>
                <Td>{item.hierarchy_nombre}</Td>
                <Td><CountBadge>{item.count_children}</CountBadge></Td>
                <Td><Badge $active={item.active === 1}>{item.active === 1 ? 'Activo' : 'Inactivo'}</Badge></Td>
                <Td>
                  <ActionButtons>
                    <IconButton onClick={() => handleOpenEdit(item.id)} title="Editar">✏️</IconButton>
                    {item.active === 1 ? (
                      <IconButton $color={theme.colors.danger} onClick={() => handleDeactivate(item.id)} title="Desactivar">✗</IconButton>
                    ) : (
                      <IconButton $color={theme.colors.success} onClick={() => handleActivate(item.id)} title="Activar">✓</IconButton>
                    )}
                  </ActionButtons>
                </Td>
              </Tr>
            ))}
            {nivel === 3 && items3.map((item) => (
              <Tr key={item.id}>
                <Td>{item.id}</Td>
                <Td>{item.descripcion}</Td>
                <Td>{item.jerarquia_sap || '-'}</Td>
                <Td>{item.subhierarchy_nombre}</Td>
                <Td><Badge $active={item.active === 1}>{item.active === 1 ? 'Activo' : 'Inactivo'}</Badge></Td>
                <Td>
                  <ActionButtons>
                    <IconButton onClick={() => handleOpenEdit(item.id)} title="Editar">✏️</IconButton>
                    {item.active === 1 ? (
                      <IconButton $color={theme.colors.danger} onClick={() => handleDeactivate(item.id)} title="Desactivar">✗</IconButton>
                    ) : (
                      <IconButton $color={theme.colors.success} onClick={() => handleActivate(item.id)} title="Activar">✓</IconButton>
                    )}
                  </ActionButtons>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {totalPages > 1 && (
        <Pagination>
          <Button $variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Anterior
          </Button>
          <PageInfo>Página {page} de {totalPages}</PageInfo>
          <Button $variant="secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Siguiente
          </Button>
        </Pagination>
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <Modal onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{editingId ? 'Editar' : 'Crear'} Jerarquía Nivel {nivel}</ModalTitle>

            <FormGroup>
              <Label>Descripción *</Label>
              <FormInput
                type="text"
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                placeholder="Ingrese descripción"
              />
            </FormGroup>

            {nivel >= 2 && (
              <FormGroup>
                <Label>Jerarquía {nivel === 2 ? '1' : '2'} (Padre) *</Label>
                <FormSelect value={formParentId} onChange={(e) => setFormParentId(e.target.value)}>
                  <option value="">Seleccione...</option>
                  {(nivel === 2 ? parents1 : parents2).map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </FormSelect>
              </FormGroup>
            )}

            {nivel === 3 && (
              <FormGroup>
                <Label>Código SAP</Label>
                <FormInput
                  type="text"
                  value={formJerarquiaSap}
                  onChange={(e) => setFormJerarquiaSap(e.target.value)}
                  placeholder="Código SAP (opcional)"
                />
              </FormGroup>
            )}

            <ModalButtons>
              <Button $variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}
