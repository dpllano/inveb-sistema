/**
 * Mantenedor Genérico - Componente reutilizable para tablas simples
 * Soporta CRUD para tablas con estructura: id, nombre/codigo, active
 */
import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { genericApi, type GenericListItem, type TablaInfo } from '../../services/api';

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
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
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

interface MantenedorGenericoProps {
  tablaKey: string;
  onNavigate?: (page: string) => void;
}

interface FormData {
  [key: string]: string;
}

export default function MantenedorGenerico({ tablaKey }: MantenedorGenericoProps) {
  // State
  const [items, setItems] = useState<GenericListItem[]>([]);
  const [tablaInfo, setTablaInfo] = useState<TablaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterActivo, setFilterActivo] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GenericListItem | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Cargar info de tabla
  useEffect(() => {
    const loadTablaInfo = async () => {
      try {
        const tablas = await genericApi.getTablas();
        const info = tablas.find(t => t.key === tablaKey);
        if (info) {
          setTablaInfo(info);
        }
      } catch (error) {
        console.error('Error loading tabla info:', error);
      }
    };
    loadTablaInfo();
  }, [tablaKey]);

  // Cargar datos
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await genericApi.list(tablaKey, {
        page,
        page_size: 20,
        search: search || undefined,
        activo: filterActivo ? parseInt(filterActivo) : undefined,
      });
      setItems(response.items);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading data:', error);
      setErrorMessage('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [tablaKey, page, search, filterActivo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
  };

  const handleOpenEdit = async (item: GenericListItem) => {
    try {
      const detail = await genericApi.get(tablaKey, item.id);
      setEditingItem(item);
      // Convertir data a FormData (strings)
      const fd: FormData = {};
      Object.entries(detail.data).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
          fd[key] = value?.toString() || '';
        }
      });
      setFormData(fd);
      setShowModal(true);
    } catch (error) {
      console.error('Error loading item:', error);
      setErrorMessage('Error al cargar el item');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage(null);
    try {
      // Convertir formData a tipos correctos
      const data: Record<string, unknown> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') {
          data[key] = value;
        }
      });

      if (editingItem) {
        await genericApi.update(tablaKey, editingItem.id, data);
        setSuccessMessage('Item actualizado exitosamente');
      } else {
        await genericApi.create(tablaKey, data);
        setSuccessMessage('Item creado exitosamente');
      }
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
      await genericApi.activate(tablaKey, id);
      setSuccessMessage('Item activado');
      loadData();
    } catch (error) {
      console.error('Error activating:', error);
      setErrorMessage('Error al activar');
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await genericApi.deactivate(tablaKey, id);
      setSuccessMessage('Item desactivado');
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

  // Obtener campos editables (excluir id, active, timestamps)
  const getEditableFields = (): string[] => {
    if (!tablaInfo) return [];
    return tablaInfo.columns.filter(c =>
      c !== 'id' && c !== 'active' && c !== 'created_at' && c !== 'updated_at'
    );
  };

  // Render
  return (
    <Container>
      <Header>
        <Title>{tablaInfo?.display_name || tablaKey}</Title>
        <Button onClick={handleOpenCreate}>+ Nuevo</Button>
      </Header>

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
        {tablaInfo?.has_active && (
          <Select value={filterActivo} onChange={(e) => { setFilterActivo(e.target.value); setPage(1); }}>
            <option value="">Todos</option>
            <option value="1">Activos</option>
            <option value="0">Inactivos</option>
          </Select>
        )}
        <Button onClick={handleSearch}>Filtrar</Button>
      </FiltersRow>

      <PageInfo>Mostrando {items.length} de {total} registros</PageInfo>

      {loading ? (
        <LoadingOverlay>Cargando...</LoadingOverlay>
      ) : items.length === 0 ? (
        <EmptyState>No hay registros</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>ID</Th>
              {tablaInfo?.columns.includes('codigo') && <Th>Código</Th>}
              <Th>Nombre</Th>
              {tablaInfo?.has_active && <Th>Estado</Th>}
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <Tr key={item.id}>
                <Td>{item.id}</Td>
                {tablaInfo?.columns.includes('codigo') && <Td>{item.codigo || '-'}</Td>}
                <Td>{item.nombre}</Td>
                {tablaInfo?.has_active && (
                  <Td>
                    <Badge $active={item.active === 1}>
                      {item.active === 1 ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Td>
                )}
                <Td>
                  <ActionButtons>
                    <IconButton onClick={() => handleOpenEdit(item)} title="Editar">
                      ✏️
                    </IconButton>
                    {tablaInfo?.has_active && (
                      item.active === 1 ? (
                        <IconButton $color={theme.colors.danger} onClick={() => handleDeactivate(item.id)} title="Desactivar">
                          ✗
                        </IconButton>
                      ) : (
                        <IconButton $color={theme.colors.success} onClick={() => handleActivate(item.id)} title="Activar">
                          ✓
                        </IconButton>
                      )
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
          <Button
            $variant="secondary"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <PageInfo>Página {page} de {totalPages}</PageInfo>
          <Button
            $variant="secondary"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Siguiente
          </Button>
        </Pagination>
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <Modal onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{editingItem ? 'Editar' : 'Crear'} {tablaInfo?.display_name}</ModalTitle>

            {getEditableFields().map((field) => (
              <FormGroup key={field}>
                <Label>{field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}</Label>
                <FormInput
                  type="text"
                  value={formData[field] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                />
              </FormGroup>
            ))}

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
