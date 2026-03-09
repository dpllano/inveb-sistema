/**
 * CargaMasivaDetallesModal.tsx
 * Modal para carga masiva de detalles de cotizacion desde Excel
 * Sprint N: Replica modal-carga-masiva-detalles.blade.php de Laravel
 */
import { useState, useCallback } from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import { cotizacionesApi, type DetalleCotizacionCreateData, type CargaMasivaDetallesResponse } from '../../services/api';

// =============================================
// TIPOS
// =============================================

interface CargaMasivaDetallesModalProps {
  cotizacionId: number;
  onClose: () => void;
  onSuccess: (response: CargaMasivaDetallesResponse) => void;
}

interface DetalleRow {
  tipo_detalle: string;  // 'Corrugado' o 'Esquinero'
  cantidad: number;
  area_hc?: number;
  carton_codigo?: string;
  carton_id?: number;
  product_type?: string;
  product_type_id?: number;
  proceso?: string;
  process_id?: number;
  golpes_ancho?: number;
  golpes_largo?: number;
  numero_colores?: number;
  impresion?: number;
  porcentaje_cera_interno?: number;
  porcentaje_cera_externo?: number;
  matriz?: number;
  clisse?: number;
  royalty?: number;
  maquila?: number;
  armado_automatico?: number;
  // Esquinero
  largo_esquinero?: number;
  carton_esquinero_codigo?: string;
  carton_esquinero_id?: number;
  // Tracking
  linea_excel: number;
  errores: string[];
}

// =============================================
// ESTILOS
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
  border-radius: 8px;
  width: 100%;
  max-width: 1200px;
  margin: 20px auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  border-radius: 8px 8px 0 0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  &:hover { opacity: 0.8; }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  background: #f8f9fa;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  margin-bottom: 1rem;
`;

const CardBody = styled.div`
  padding: 1rem;
`;

const Row = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const Col = styled.div<{ $size?: number }>`
  flex: ${props => props.$size || 1};
  min-width: 250px;
`;

const DownloadSection = styled.div`
  text-align: center;
`;

const DownloadTitle = styled.div`
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: #495057;
`;

const DownloadButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

const DownloadButton = styled.a`
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.875rem;
  &:hover { background: #218838; }
`;

const FileInput = styled.input`
  display: block;
  width: 100%;
  padding: 0.75rem;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
  &:hover { border-color: #007bff; }
`;

const ResultsSection = styled.div`
  margin-top: 1.5rem;
`;

const InfoBox = styled.div`
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const InfoBoxTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #e9ecef;
  padding: 0.75rem 1rem;
  font-weight: 500;
  border-radius: 8px 8px 0 0;
`;

const Badge = styled.span<{ $variant?: 'success' | 'danger' }>`
  background: ${props => props.$variant === 'danger' ? '#dc3545' : '#28a745'};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.8rem;
`;

const TableContainer = styled.div`
  max-height: 250px;
  overflow-y: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;

  th, td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
  }

  th {
    background: #f8f9fa;
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tr:hover td { background: #f8f9fa; }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #dee2e6;
  background: white;
  border-radius: 0 0 8px 8px;
`;

const Button = styled.button<{ $variant?: 'success' | 'secondary' }>`
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;

  ${props => props.$variant === 'success' ? `
    background: #28a745;
    color: white;
    &:hover:not(:disabled) { background: #218838; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  ` : `
    background: #6c757d;
    color: white;
    &:hover { background: #5a6268; }
  `}
`;

const LoadingSpinner = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorRow = styled.tr`
  background: #fff5f5 !important;
`;

// =============================================
// CONSTANTES DE MAPEO
// =============================================

const TIPO_DETALLE_MAP: Record<string, number> = {
  'CORRUGADO': 1,
  'CORRUG.': 1,
  'CORRUG': 1,
  'ESQUINERO': 2,
  'ESQ.': 2,
  'ESQ': 2,
};

// =============================================
// COMPONENTE
// =============================================

export default function CargaMasivaDetallesModal({
  cotizacionId,
  onClose,
  onSuccess,
}: CargaMasivaDetallesModalProps) {
  const [_file, setFile] = useState<File | null>(null);  // Prefixed to suppress unused warning
  const [detallesValidos, setDetallesValidos] = useState<DetalleRow[]>([]);
  const [detallesInvalidos, setDetallesInvalidos] = useState<DetalleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Procesar archivo Excel
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setDetallesValidos([]);
    setDetallesInvalidos([]);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON con headers (header: 1 devuelve arrays)
      const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        setError('El archivo no contiene datos');
        setLoading(false);
        return;
      }

      // Primera fila es header
      const headers = (jsonData[0] || []).map((h: unknown) => String(h || '').toLowerCase().trim());
      const rows = jsonData.slice(1);

      const validos: DetalleRow[] = [];
      const invalidos: DetalleRow[] = [];

      rows.forEach((row, index) => {
        const rowData = row || [];
        const linea_excel = index + 2; // +2 porque empezamos en fila 2 (1 es header)

        // Ignorar filas vacías
        if (!rowData || rowData.every(cell => cell === null || cell === undefined || cell === '')) {
          return;
        }

        const errores: string[] = [];

        // Crear objeto de detalle basado en headers
        const detalle: DetalleRow = {
          tipo_detalle: '',
          cantidad: 0,
          linea_excel,
          errores: [],
        };

        // Mapear columnas según headers
        headers.forEach((header, colIndex) => {
          const value = rowData[colIndex];

          switch (header) {
            case 'tipo':
            case 'tipo producto':
            case 'tipo_producto':
              detalle.tipo_detalle = String(value || '').toUpperCase();
              break;
            case 'cantidad':
              detalle.cantidad = Number(value) || 0;
              break;
            case 'area':
            case 'area_hc':
            case 'areahc':
              detalle.area_hc = Number(value) || undefined;
              break;
            case 'carton':
            case 'carton_codigo':
            case 'codigo_carton':
              detalle.carton_codigo = String(value || '');
              break;
            case 'item':
            case 'product_type':
            case 'tipo_item':
              detalle.product_type = String(value || '');
              break;
            case 'proceso':
            case 'process':
              detalle.proceso = String(value || '');
              break;
            case 'golpes_ancho':
            case 'golpes ancho':
              detalle.golpes_ancho = Number(value) || undefined;
              break;
            case 'golpes_largo':
            case 'golpes largo':
              detalle.golpes_largo = Number(value) || undefined;
              break;
            case 'colores':
            case 'numero_colores':
            case 'n colores':
              detalle.numero_colores = Number(value) || undefined;
              break;
            case 'impresion':
            case '% impr':
            case '% impresion':
              detalle.impresion = Number(value) || undefined;
              break;
            case 'cera':
            case '% cera':
              const ceraVal = Number(value) || 0;
              detalle.porcentaje_cera_interno = ceraVal / 2;
              detalle.porcentaje_cera_externo = ceraVal / 2;
              break;
            case 'matriz':
              detalle.matriz = value === 'SI' || value === 1 || value === '1' ? 1 : 0;
              break;
            case 'clisse':
              detalle.clisse = value === 'SI' || value === 1 || value === '1' ? 1 : 0;
              break;
            case 'royalty':
              detalle.royalty = value === 'SI' || value === 1 || value === '1' ? 1 : 0;
              break;
            case 'maquila':
              detalle.maquila = value === 'SI' || value === 1 || value === '1' ? 1 : 0;
              break;
            case 'armado':
            case 'armado_automatico':
              detalle.armado_automatico = value === 'SI' || value === 1 || value === '1' ? 1 : 0;
              break;
            // Esquineros
            case 'largo':
            case 'largo_esquinero':
              detalle.largo_esquinero = Number(value) || undefined;
              break;
          }
        });

        // Validaciones
        const tipoDetalleId = TIPO_DETALLE_MAP[detalle.tipo_detalle];
        if (!tipoDetalleId) {
          errores.push(`Tipo de producto invalido: "${detalle.tipo_detalle}". Use "Corrugado" o "Esquinero"`);
        }

        if (!detalle.cantidad || detalle.cantidad <= 0) {
          errores.push('Cantidad es requerida y debe ser mayor a 0');
        }

        // Validaciones específicas por tipo
        if (tipoDetalleId === 1) { // Corrugado
          if (!detalle.carton_codigo) {
            errores.push('Codigo de carton es requerido para Corrugado');
          }
        } else if (tipoDetalleId === 2) { // Esquinero
          if (!detalle.largo_esquinero) {
            errores.push('Largo es requerido para Esquinero');
          }
        }

        detalle.errores = errores;

        if (errores.length === 0) {
          validos.push(detalle);
        } else {
          invalidos.push(detalle);
        }
      });

      setDetallesValidos(validos);
      setDetallesInvalidos(invalidos);

    } catch (err) {
      setError(`Error al procesar archivo: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Enviar detalles validos a la API
  const handleSincronizar = useCallback(async () => {
    if (detallesValidos.length === 0) {
      setError('No hay detalles validos para sincronizar');
      return;
    }

    setProcesando(true);
    setError(null);

    try {
      // Convertir a formato de API
      const detallesAPI: DetalleCotizacionCreateData[] = detallesValidos.map(d => {
        const tipoDetalleId = TIPO_DETALLE_MAP[d.tipo_detalle] || 1;

        return {
          tipo_detalle_id: tipoDetalleId,
          cantidad: d.cantidad,
          product_type_id: d.product_type_id || 1, // Default
          planta_id: 1, // Default
          area_hc: d.area_hc,
          golpes_largo: d.golpes_largo,
          golpes_ancho: d.golpes_ancho,
          numero_colores: d.numero_colores,
          impresion: d.impresion,
          porcentaje_cera_interno: d.porcentaje_cera_interno,
          porcentaje_cera_externo: d.porcentaje_cera_externo,
          matriz: d.matriz,
          clisse: d.clisse,
          royalty: d.royalty,
          maquila: d.maquila,
          armado_automatico: d.armado_automatico,
          process_id: d.process_id,
          carton_id: d.carton_id,
          // Esquinero
          largo_esquinero: d.largo_esquinero,
          carton_esquinero_id: d.carton_esquinero_id,
        };
      });

      const response = await cotizacionesApi.cargaMasivaDetalles(cotizacionId, detallesAPI);
      onSuccess(response);

    } catch (err) {
      setError(`Error al sincronizar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProcesando(false);
    }
  }, [cotizacionId, detallesValidos, onSuccess]);

  const showResults = detallesValidos.length > 0 || detallesInvalidos.length > 0;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Cargar Detalles</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        <ModalBody>
          <Card>
            <CardBody>
              <Row>
                <Col $size={1}>
                  <DownloadSection>
                    <DownloadTitle>Descargar Archivos de Ejemplo</DownloadTitle>
                    <DownloadButtons>
                      <DownloadButton href="/files/Carga Masiva Corrugados.xlsx" download>
                        Corrugados
                      </DownloadButton>
                      <DownloadButton href="/files/Carga Masiva Esquineros.xlsx" download>
                        Esquineros
                      </DownloadButton>
                    </DownloadButtons>
                  </DownloadSection>
                </Col>
                <Col $size={2}>
                  <DownloadSection>
                    <DownloadTitle>Carga Masiva</DownloadTitle>
                    <FileInput
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                  </DownloadSection>
                </Col>
              </Row>

              {loading && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <LoadingSpinner /> Procesando archivo...
                </div>
              )}

              {error && (
                <div style={{ color: '#dc3545', marginTop: '1rem', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              {showResults && (
                <ResultsSection>
                  {/* Detalles Validos */}
                  <InfoBox>
                    <InfoBoxTitle>
                      Detalles Ingresados
                      <Badge $variant="success">{detallesValidos.length}</Badge>
                    </InfoBoxTitle>
                    <TableContainer>
                      <Table>
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Area</th>
                            <th>Carton</th>
                            <th>Item</th>
                            <th>Proceso</th>
                            <th>G.Ancho</th>
                            <th>G.Largo</th>
                            <th>Colores</th>
                            <th>%Impr</th>
                            <th>%Cera</th>
                            <th>Matriz</th>
                            <th>Clisse</th>
                            <th>Royalty</th>
                            <th>Maquila</th>
                            <th>Armado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detallesValidos.map((d, i) => (
                            <tr key={i}>
                              <td>{d.tipo_detalle === 'CORRUGADO' ? 'Corrug.' : 'Esq.'}</td>
                              <td>{d.cantidad.toLocaleString()}</td>
                              <td>{d.area_hc?.toFixed(2) || ''}</td>
                              <td>{d.carton_codigo || ''}</td>
                              <td>{d.product_type || ''}</td>
                              <td>{d.proceso || ''}</td>
                              <td>{d.golpes_ancho || ''}</td>
                              <td>{d.golpes_largo || ''}</td>
                              <td>{d.numero_colores || ''}</td>
                              <td>{d.impresion ? `${d.impresion}%` : ''}</td>
                              <td>{(d.porcentaje_cera_interno || 0) + (d.porcentaje_cera_externo || 0)}%</td>
                              <td>{d.matriz ? 'SI' : 'NO'}</td>
                              <td>{d.clisse ? 'SI' : 'NO'}</td>
                              <td>{d.royalty ? 'SI' : 'NO'}</td>
                              <td>{d.maquila ? 'SI' : 'NO'}</td>
                              <td>{d.armado_automatico ? 'SI' : 'NO'}</td>
                            </tr>
                          ))}
                          {detallesValidos.length === 0 && (
                            <tr>
                              <td colSpan={16} style={{ textAlign: 'center', color: '#6c757d' }}>
                                No hay detalles validos
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </TableContainer>
                  </InfoBox>

                  {/* Detalles Invalidos */}
                  {detallesInvalidos.length > 0 && (
                    <InfoBox>
                      <InfoBoxTitle>
                        Detalles Invalidos
                        <Badge $variant="danger">{detallesInvalidos.length}</Badge>
                      </InfoBoxTitle>
                      <TableContainer>
                        <Table>
                          <thead>
                            <tr>
                              <th style={{ width: '80px' }}>Linea Excel</th>
                              <th>Motivos</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detallesInvalidos.map((d, i) => (
                              <ErrorRow key={i}>
                                <td>{d.linea_excel}</td>
                                <td>{d.errores.join('; ')}</td>
                              </ErrorRow>
                            ))}
                          </tbody>
                        </Table>
                      </TableContainer>
                    </InfoBox>
                  )}
                </ResultsSection>
              )}
            </CardBody>
          </Card>
        </ModalBody>

        <ModalFooter>
          <Button $variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          {showResults && detallesValidos.length > 0 && (
            <Button
              $variant="success"
              onClick={handleSincronizar}
              disabled={procesando}
            >
              {procesando && <LoadingSpinner />}
              Sincronizar Detalles ({detallesValidos.length})
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
