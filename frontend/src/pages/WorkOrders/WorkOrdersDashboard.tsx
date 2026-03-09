/**
 * Dashboard de Ordenes de Trabajo
 * Replica la funcionalidad de work-orders/index.blade.php de Laravel
 */
import { useState, useEffect, useCallback } from 'react';
import { workOrdersApi, exportsApi, type WorkOrderListItem, type WorkOrderFilters, type FilterOptions } from '../../services/api';
import './WorkOrdersDashboard.css';

interface Props {
  onNavigate?: (page: string, otId?: number) => void;
}

export default function WorkOrdersDashboard({ onNavigate }: Props) {
  // State
  const [ots, setOts] = useState<WorkOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState<WorkOrderFilters>({
    page: 1,
    page_size: 20,
  });

  // Filter form state
  const [filterForm, setFilterForm] = useState({
    id_ot: '',
    date_desde: '',
    date_hasta: '',
    cad: '',
    carton: '',
    material: '',
    descripcion: '',
    client_id: [] as number[],
    estado_id: [] as number[],
    area_id: [] as number[],
    canal_id: [] as number[],
    vendedor_id: [] as number[],
    planta_id: [] as number[],
  });

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await workOrdersApi.getFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };
    loadFilterOptions();
  }, []);

  // Load work orders
  const loadWorkOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await workOrdersApi.list(filters);
      setOts(response.items);
      setTotal(response.total);
      setTotalPages(response.total_pages);
      setPage(response.page);
    } catch (err) {
      setError('Error cargando ordenes de trabajo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  // Handle filter submit
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters: WorkOrderFilters = {
      page: 1,
      page_size: 20,
    };

    if (filterForm.id_ot) newFilters.id_ot = parseInt(filterForm.id_ot);
    if (filterForm.date_desde) newFilters.date_desde = filterForm.date_desde;
    if (filterForm.date_hasta) newFilters.date_hasta = filterForm.date_hasta;
    if (filterForm.cad) newFilters.cad = filterForm.cad;
    if (filterForm.carton) newFilters.carton = filterForm.carton;
    if (filterForm.material) newFilters.material = filterForm.material;
    if (filterForm.descripcion) newFilters.descripcion = filterForm.descripcion;
    if (filterForm.client_id.length) newFilters.client_id = filterForm.client_id;
    if (filterForm.estado_id.length) newFilters.estado_id = filterForm.estado_id;
    if (filterForm.area_id.length) newFilters.area_id = filterForm.area_id;
    if (filterForm.canal_id.length) newFilters.canal_id = filterForm.canal_id;
    if (filterForm.vendedor_id.length) newFilters.vendedor_id = filterForm.vendedor_id;
    if (filterForm.planta_id.length) newFilters.planta_id = filterForm.planta_id;

    setFilters(newFilters);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle view OT
  const handleViewOT = (id: number) => {
    if (onNavigate) {
      onNavigate('gestionar-ot', id);
    }
  };

  // Handle edit OT - comentado para uso futuro
  // const handleEditOT = (id: number) => {
  //   if (onNavigate) {
  //     onNavigate('editar-ot', id);
  //   }
  // };

  // Handle export to Excel
  const [exporting, setExporting] = useState(false);
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportsApi.downloadOTsListExcel({
        estado_id: filterForm.estado_id[0],
        area_id: filterForm.area_id[0],
        canal_id: filterForm.canal_id[0],
        client_id: filterForm.client_id[0],
        fecha_desde: filterForm.date_desde || undefined,
        fecha_hasta: filterForm.date_hasta || undefined,
      });
    } catch (err) {
      console.error('Error exportando a Excel:', err);
      alert('Error al exportar a Excel');
    } finally {
      setExporting(false);
    }
  };

  // Obtener color del semaforo segun area y dias (igual que Laravel)
  const getBadgeColor = (areaId: number, dias: number): string => {
    switch (areaId) {
      case 1: // Ventas
      case 5: // Precatalogacion
        if (dias <= 1) return 'badge-success';
        if (dias <= 2) return 'badge-warning';
        return 'badge-danger';
      case 2: // Desarrollo
        if (dias <= 1) return 'badge-success';
        if (dias <= 2) return 'badge-warning';
        return 'badge-danger';
      case 3: // Diseno
      case 4: // Catalogacion
        if (dias <= 2) return 'badge-success';
        if (dias <= 3) return 'badge-warning';
        return 'badge-danger';
      case 6: // Sala Muestras
        if (dias <= 3) return 'badge-success';
        if (dias <= 5) return 'badge-warning';
        return 'badge-danger';
      default:
        if (dias <= 2) return 'badge-success';
        if (dias <= 5) return 'badge-warning';
        return 'badge-danger';
    }
  };

  // Render time badge
  // Si isCurrentArea es true, muestra "fecha valor" como en Laravel
  const renderTimeBadge = (
    value: number | null,
    label: string,
    isCurrentArea: boolean = false,
    ultimoCambioArea: string | null = null,
    areaId: number = 0
  ) => {
    if (value === null || value === undefined || value === 0) {
      return <span className="badge badge-secondary">0</span>;
    }
    // Colores segun area y umbrales de Laravel
    const className = getBadgeColor(areaId, value);

    // Si es el area actual, mostrar fecha + valor (como Laravel)
    if (isCurrentArea && ultimoCambioArea) {
      return (
        <span className={`badge ${className}`} title={`${label}: ${value} dias (desde ${ultimoCambioArea})`}>
          {ultimoCambioArea} <strong>{value.toFixed(1)}</strong>
        </span>
      );
    }

    return (
      <span className={`badge ${className}`} title={`${label}: ${value} dias`}>
        {value.toFixed(1)}
      </span>
    );
  };

  // Get icon for OT type
  const getOTIcon = (tipoSolicitud: number | null) => {
    switch (tipoSolicitud) {
      case 6:
        return <span className="ot-icon" title="Licitacion">📋</span>;
      case 7:
        return <span className="ot-icon" title="Proyecto Innovacion">💡</span>;
      default:
        return null;
    }
  };

  return (
    <div className="work-orders-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Ordenes de Trabajo</h1>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => onNavigate?.('crear-ot')}
          >
            Crear OT
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onNavigate?.('notificaciones')}
          >
            Notificaciones OT
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExportExcel}
            disabled={exporting}
            title="Exportar lista de OTs a Excel"
          >
            {exporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <form className="filters-form" onSubmit={handleFilterSubmit}>
        <div className="filters-grid">
          {/* Row 1 */}
          <div className="filter-group">
            <label>Desde</label>
            <input
              type="date"
              value={filterForm.date_desde}
              onChange={e => setFilterForm(prev => ({ ...prev, date_desde: e.target.value }))}
            />
          </div>
          <div className="filter-group">
            <label>Hasta</label>
            <input
              type="date"
              value={filterForm.date_hasta}
              onChange={e => setFilterForm(prev => ({ ...prev, date_hasta: e.target.value }))}
            />
          </div>
          <div className="filter-group">
            <label>ID OT</label>
            <input
              type="text"
              value={filterForm.id_ot}
              onChange={e => setFilterForm(prev => ({ ...prev, id_ot: e.target.value }))}
              placeholder="Ej: 26590"
            />
          </div>
          <div className="filter-group">
            <label>Material</label>
            <input
              type="text"
              value={filterForm.material}
              onChange={e => setFilterForm(prev => ({ ...prev, material: e.target.value }))}
            />
          </div>
          <div className="filter-group">
            <label>Creador</label>
            <select
              multiple
              value={filterForm.vendedor_id.map(String)}
              onChange={e => {
                const values = Array.from(e.target.selectedOptions, opt => parseInt(opt.value));
                setFilterForm(prev => ({ ...prev, vendedor_id: values }));
              }}
            >
              {filterOptions?.vendedores.map(v => (
                <option key={v.id} value={v.id}>{v.nombre}</option>
              ))}
            </select>
          </div>

          {/* Row 2 */}
          <div className="filter-group">
            <label>Canal</label>
            <select
              multiple
              value={filterForm.canal_id.map(String)}
              onChange={e => {
                const values = Array.from(e.target.selectedOptions, opt => parseInt(opt.value));
                setFilterForm(prev => ({ ...prev, canal_id: values }));
              }}
            >
              {filterOptions?.canales.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Estado</label>
            <select
              multiple
              value={filterForm.estado_id.map(String)}
              onChange={e => {
                const values = Array.from(e.target.selectedOptions, opt => parseInt(opt.value));
                setFilterForm(prev => ({ ...prev, estado_id: values }));
              }}
            >
              {filterOptions?.estados.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Area</label>
            <select
              multiple
              value={filterForm.area_id.map(String)}
              onChange={e => {
                const values = Array.from(e.target.selectedOptions, opt => parseInt(opt.value));
                setFilterForm(prev => ({ ...prev, area_id: values }));
              }}
            >
              {filterOptions?.areas.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Cliente</label>
            <select
              multiple
              value={filterForm.client_id.map(String)}
              onChange={e => {
                const values = Array.from(e.target.selectedOptions, opt => parseInt(opt.value));
                setFilterForm(prev => ({ ...prev, client_id: values }));
              }}
            >
              {filterOptions?.clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Row 3 */}
          <div className="filter-group">
            <label>CAD</label>
            <input
              type="text"
              value={filterForm.cad}
              onChange={e => setFilterForm(prev => ({ ...prev, cad: e.target.value }))}
            />
          </div>
          <div className="filter-group">
            <label>Carton</label>
            <input
              type="text"
              value={filterForm.carton}
              onChange={e => setFilterForm(prev => ({ ...prev, carton: e.target.value }))}
            />
          </div>
          <div className="filter-group">
            <label>Descripcion</label>
            <input
              type="text"
              value={filterForm.descripcion}
              onChange={e => setFilterForm(prev => ({ ...prev, descripcion: e.target.value }))}
            />
          </div>
          <div className="filter-group">
            <label>Planta</label>
            <select
              multiple
              value={filterForm.planta_id.map(String)}
              onChange={e => {
                const values = Array.from(e.target.selectedOptions, opt => parseInt(opt.value));
                setFilterForm(prev => ({ ...prev, planta_id: values }));
              }}
            >
              {filterOptions?.plantas.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button type="submit" className="btn btn-primary">
            Filtrar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setFilterForm({
                id_ot: '',
                date_desde: '',
                date_hasta: '',
                cad: '',
                carton: '',
                material: '',
                descripcion: '',
                client_id: [],
                estado_id: [],
                area_id: [],
                canal_id: [],
                vendedor_id: [],
                planta_id: [],
              });
              setFilters({ page: 1, page_size: 20 });
            }}
          >
            Limpiar
          </button>
        </div>
      </form>

      {/* Results info */}
      <div className="results-info">
        <span>Mostrando {ots.length} de {total} registros</span>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={loadWorkOrders}>Reintentar</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <span>Cargando...</span>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="ot-table">
          <thead>
            <tr>
              <th>OT</th>
              <th>Creacion</th>
              <th>Cliente</th>
              <th>Descripcion</th>
              <th>Canal</th>
              <th>Item</th>
              <th>Estado</th>
              <th title="Tiempo Total">T</th>
              <th>Ventas</th>
              <th>Dis. Estructural</th>
              <th>Muestra</th>
              <th>Dis. Grafico</th>
              <th>Dis. Externo</th>
              <th>Calc. Paletizado</th>
              <th>Catalogacion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ots.map(ot => (
              <tr key={ot.id}>
                <td>
                  {getOTIcon(ot.tipo_solicitud)}
                  <span title={`Creador: ${ot.creador_nombre}`}>{ot.id}</span>
                </td>
                <td>{ot.created_at}</td>
                <td className="truncate" title={ot.client_name}>{ot.client_name}</td>
                <td className="truncate" title={ot.descripcion}>{ot.descripcion}</td>
                <td className="center">{ot.canal?.charAt(0)}</td>
                <td>{ot.item_tipo}</td>
                <td title={ot.estado}>{ot.estado_abrev}</td>
                <td className="time-cell time-total">
                  <span className="badge badge-total" title={`Tiempo Total: ${ot.tiempo_total} dias`}>
                    ⏱ {Math.round(ot.tiempo_total || 0)}
                  </span>
                </td>
                <td className="time-cell">{renderTimeBadge(ot.tiempo_venta, 'Ventas', ot.current_area_id === 1, ot.ultimo_cambio_area, 1)}</td>
                <td className="time-cell">{renderTimeBadge(ot.tiempo_desarrollo, 'Desarrollo', ot.current_area_id === 2, ot.ultimo_cambio_area, 2)}</td>
                <td className="time-cell">{renderTimeBadge(ot.tiempo_muestra, 'Muestra', ot.current_area_id === 6, ot.ultimo_cambio_area, 6)}</td>
                <td className="time-cell">{renderTimeBadge(ot.tiempo_diseno, 'Diseno', ot.current_area_id === 3, ot.ultimo_cambio_area, 3)}</td>
                <td className="time-cell">{renderTimeBadge(ot.tiempo_externo, 'Externo', false, null, 0)}</td>
                <td className="time-cell">{renderTimeBadge(ot.tiempo_precatalogacion, 'Precatalogacion', ot.current_area_id === 5, ot.ultimo_cambio_area, 5)}</td>
                <td className="time-cell">{renderTimeBadge(ot.tiempo_catalogacion, 'Catalogacion', ot.current_area_id === 4, ot.ultimo_cambio_area, 4)}</td>
                <td className="actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleViewOT(ot.id)}
                    title="Ver OT"
                  >
                    🔍
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Anterior
          </button>
          <span>Pagina {page} de {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
