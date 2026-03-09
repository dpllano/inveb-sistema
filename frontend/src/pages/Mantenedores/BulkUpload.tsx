/**
 * BulkUpload - Componente para carga masiva de mantenedores
 * Soporta archivos Excel (.xlsx, .xls) y CSV
 * FASE 6.22 - Implementación completa con soporte Excel real
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import { theme } from '../../theme';
import { genericApi, type TablaInfo } from '../../services/api';

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

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-size: ${theme.typography.sizes.body};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};

  &:hover {
    text-decoration: underline;
  }
`;

const StepIndicator = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.radius.md};
  background: ${({ $active, $completed }) =>
    $active ? theme.colors.primary :
    $completed ? `${theme.colors.success}20` :
    theme.colors.bgLight};
  color: ${({ $active, $completed }) =>
    $active ? 'white' :
    $completed ? theme.colors.success :
    theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.small};
  font-weight: ${theme.typography.weights.medium};
`;

const StepNumber = styled.span<{ $active: boolean; $completed: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $active }) => $active ? 'white' : 'transparent'};
  color: ${({ $active }) => $active ? theme.colors.primary : 'inherit'};
  border: 2px solid currentColor;
`;

const Section = styled.div`
  margin-bottom: ${theme.spacing.xl};
`;

const SectionTitle = styled.h3`
  font-size: ${theme.typography.sizes.h4};
  color: ${theme.colors.textPrimary};
  margin: 0 0 ${theme.spacing.md} 0;
`;

const DropZone = styled.div<{ $isDragging: boolean; $hasFile: boolean }>`
  border: 2px dashed ${({ $isDragging, $hasFile }) =>
    $isDragging ? theme.colors.primary :
    $hasFile ? theme.colors.success :
    theme.colors.border};
  border-radius: ${theme.radius.lg};
  padding: ${theme.spacing.xl};
  text-align: center;
  background: ${({ $isDragging }) => $isDragging ? `${theme.colors.primary}05` : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${theme.colors.primary};
    background: ${theme.colors.primary}05;
  }
`;

const DropZoneIcon = styled.div`
  font-size: 48px;
  margin-bottom: ${theme.spacing.md};
`;

const DropZoneText = styled.p`
  color: ${theme.colors.textSecondary};
  margin: 0 0 ${theme.spacing.sm} 0;
`;

const DropZoneHint = styled.span`
  color: ${theme.colors.textMuted};
  font-size: ${theme.typography.sizes.small};
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background: ${theme.colors.bgLight};
  border-radius: ${theme.radius.md};
  margin-top: ${theme.spacing.md};
`;

const FileName = styled.span`
  flex: 1;
  font-weight: ${theme.typography.weights.medium};
`;

const FileSize = styled.span`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.small};
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.danger};
  cursor: pointer;
  padding: ${theme.spacing.xs};

  &:hover {
    opacity: 0.7;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${theme.typography.sizes.small};
`;

const Th = styled.th`
  text-align: left;
  padding: ${theme.spacing.sm};
  background: ${theme.colors.bgLight};
  border: 1px solid ${theme.colors.border};
  font-weight: ${theme.typography.weights.semibold};
  color: ${theme.colors.textSecondary};
`;

const Td = styled.td<{ $error?: boolean }>`
  padding: ${theme.spacing.sm};
  border: 1px solid ${theme.colors.border};
  background: ${({ $error }) => $error ? `${theme.colors.danger}10` : 'transparent'};
`;

const ErrorText = styled.span`
  color: ${theme.colors.danger};
  font-size: ${theme.typography.sizes.tiny};
  display: block;
`;

const PreviewWrapper = styled.div`
  max-height: 400px;
  overflow: auto;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
`;

const Summary = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

const SummaryCard = styled.div<{ $color?: string }>`
  padding: ${theme.spacing.md};
  background: ${({ $color }) => $color ? `${$color}10` : theme.colors.bgLight};
  border-radius: ${theme.radius.md};
  border-left: 4px solid ${({ $color }) => $color || theme.colors.primary};
`;

const SummaryValue = styled.div`
  font-size: ${theme.typography.sizes.h2};
  font-weight: ${theme.typography.weights.bold};
  color: ${theme.colors.textPrimary};
`;

const SummaryLabel = styled.div`
  font-size: ${theme.typography.sizes.small};
  color: ${theme.colors.textSecondary};
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.lg};
`;

const Button = styled.button<{ $variant?: 'primary' | 'success' | 'danger' | 'secondary' }>`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border: none;
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
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

const Message = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: ${theme.spacing.md};
  border-radius: ${theme.radius.md};
  margin-bottom: ${theme.spacing.md};
  background: ${({ $type }) =>
    $type === 'success' ? `${theme.colors.success}15` :
    $type === 'error' ? `${theme.colors.danger}15` :
    `${theme.colors.primary}15`};
  color: ${({ $type }) =>
    $type === 'success' ? theme.colors.success :
    $type === 'error' ? theme.colors.danger :
    theme.colors.primary};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${theme.colors.bgLight};
  border-radius: 4px;
  overflow: hidden;
  margin: ${theme.spacing.md} 0;
`;

const ProgressFill = styled.div<{ $percent: number }>`
  width: ${({ $percent }) => $percent}%;
  height: 100%;
  background: ${theme.colors.primary};
  transition: width 0.3s ease;
`;

const TemplateLink = styled.a`
  color: ${theme.colors.primary};
  text-decoration: none;
  font-size: ${theme.typography.sizes.small};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const Select = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  background: white;
  min-width: 250px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
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

// =============================================
// TYPES
// =============================================

interface ParsedRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
}

interface BulkUploadProps {
  tablaKey?: string;
  onNavigate: (page: string) => void;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

// =============================================
// COMPONENT
// =============================================

export default function BulkUpload({ tablaKey: initialTablaKey, onNavigate }: BulkUploadProps) {
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTabla, setSelectedTabla] = useState(initialTablaKey || '');
  const [tablaInfo, setTablaInfo] = useState<TablaInfo | null>(null);
  const [tablas, setTablas] = useState<TablaInfo[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load available tablas
  useEffect(() => {
    const loadTablas = async () => {
      try {
        const list = await genericApi.getTablas();
        setTablas(list);
        if (initialTablaKey) {
          const info = list.find(t => t.key === initialTablaKey);
          if (info) setTablaInfo(info);
        }
      } catch (err) {
        console.error('Error loading tablas:', err);
      }
    };
    loadTablas();
  }, [initialTablaKey]);

  // Handle tabla selection
  const handleTablaChange = useCallback(async (key: string) => {
    setSelectedTabla(key);
    setFile(null);
    setParsedData([]);
    if (key) {
      const info = tablas.find(t => t.key === key);
      if (info) setTablaInfo(info);
    } else {
      setTablaInfo(null);
    }
  }, [tablas]);

  // File handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('Formato de archivo no valido. Use CSV o Excel (.xlsx, .xls)');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Parse file based on type
    try {
      let rows: string[][];

      if (selectedFile.name.match(/\.(xlsx|xls)$/i)) {
        // Parse Excel file using xlsx library
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to array of arrays
        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
          header: 1,
          raw: false,
          defval: ''
        });
        rows = jsonData as string[][];
      } else {
        // Parse CSV file
        const text = await selectedFile.text();
        rows = parseCSV(text);
      }

      validateAndSetData(rows);
    } catch (err) {
      setError('Error al leer el archivo. Verifique que el formato sea correcto.');
      console.error(err);
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.trim().split('\n');
    return lines.map(line => {
      // Handle quoted values with commas
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === ',' || char === ';') && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const validateAndSetData = (rows: string[][]) => {
    if (rows.length < 2) {
      setError('El archivo debe tener al menos una fila de encabezados y una de datos');
      return;
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const editableColumns = tablaInfo?.columns.filter(c =>
      c !== 'id' && c !== 'active' && c !== 'created_at' && c !== 'updated_at'
    ) || [];

    const parsed: ParsedRow[] = rows.slice(1).map((row, index) => {
      const data: Record<string, string> = {};
      const errors: string[] = [];

      headers.forEach((header, i) => {
        const value = row[i] || '';
        data[header] = value;
      });

      // Validate required fields
      editableColumns.forEach(col => {
        if (!data[col] && col !== 'active') {
          // Check if it's required (simple heuristic: nombre/codigo/descripcion are required)
          if (['nombre', 'codigo', 'descripcion', 'denominacion'].includes(col)) {
            if (!data[col]) {
              errors.push(`Campo "${col}" es requerido`);
            }
          }
        }
      });

      return {
        rowIndex: index + 2, // +2 because of header row and 0-index
        data,
        errors,
        isValid: errors.length === 0
      };
    });

    setParsedData(parsed);
    if (parsed.length > 0) {
      setCurrentStep(2);
    }
  };

  const removeFile = () => {
    setFile(null);
    setParsedData([]);
    setCurrentStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload data using bulk endpoint
  const handleUpload = async () => {
    if (!selectedTabla || parsedData.length === 0) return;

    setUploading(true);
    setUploadProgress(10);
    setUploadResult(null);

    const validRows = parsedData.filter(r => r.isValid);

    try {
      setUploadProgress(30);

      // Use bulk upload endpoint
      const items = validRows.map(row => ({ data: row.data }));
      const response = await genericApi.bulkUpload(selectedTabla, items);

      setUploadProgress(100);

      // Map response to our result format
      const results: UploadResult = {
        success: response.insertados,
        failed: response.errores,
        errors: response.detalles_errores.map(err => ({
          row: err.fila,
          error: err.error
        }))
      };

      setUploadResult(results);
    } catch (err) {
      // Fallback error handling
      const results: UploadResult = {
        success: 0,
        failed: validRows.length,
        errors: [{
          row: 0,
          error: err instanceof Error ? err.message : 'Error en carga masiva'
        }]
      };
      setUploadResult(results);
    }

    setUploading(false);
    setCurrentStep(3);
  };

  // Download template - generates both CSV and Excel formats
  const downloadTemplate = (format: 'csv' | 'xlsx' = 'xlsx') => {
    if (!tablaInfo) return;

    const columns = tablaInfo.columns.filter(c =>
      c !== 'id' && c !== 'active' && c !== 'created_at' && c !== 'updated_at'
    );

    if (format === 'xlsx') {
      // Generate Excel template
      const worksheetData = [columns]; // Headers only
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      worksheet['!cols'] = columns.map(() => ({ wch: 20 }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, tablaInfo.display_name);

      XLSX.writeFile(workbook, `plantilla_${selectedTabla}.xlsx`);
    } else {
      // Generate CSV template
      const csv = columns.join(',') + '\n';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantilla_${selectedTabla}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Stats
  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.filter(r => !r.isValid).length;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={() => onNavigate('mantenedores')}>
          ← Volver a Mantenedores
        </BackButton>
        <Title>Carga Masiva</Title>
      </Header>

      <StepIndicator>
        <Step $active={currentStep === 1} $completed={currentStep > 1}>
          <StepNumber $active={currentStep === 1} $completed={currentStep > 1}>
            {currentStep > 1 ? '✓' : '1'}
          </StepNumber>
          Seleccionar Archivo
        </Step>
        <Step $active={currentStep === 2} $completed={currentStep > 2}>
          <StepNumber $active={currentStep === 2} $completed={currentStep > 2}>
            {currentStep > 2 ? '✓' : '2'}
          </StepNumber>
          Validar Datos
        </Step>
        <Step $active={currentStep === 3} $completed={false}>
          <StepNumber $active={currentStep === 3} $completed={false}>
            3
          </StepNumber>
          Resultados
        </Step>
      </StepIndicator>

      {error && <Message $type="error">{error}</Message>}

      {/* Step 1: Select table and file */}
      {currentStep === 1 && (
        <Section>
          <FormGroup>
            <Label>Seleccione el mantenedor</Label>
            <Select value={selectedTabla} onChange={(e) => handleTablaChange(e.target.value)}>
              <option value="">-- Seleccionar --</option>
              {tablas.map(t => (
                <option key={t.key} value={t.key}>{t.display_name}</option>
              ))}
            </Select>
          </FormGroup>

          {selectedTabla && tablaInfo && (
            <>
              <Message $type="info">
                Columnas esperadas: {tablaInfo.columns.filter(c =>
                  c !== 'id' && c !== 'active' && c !== 'created_at' && c !== 'updated_at'
                ).join(', ')}
              </Message>

              <DropZone
                $isDragging={isDragging}
                $hasFile={!!file}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <DropZoneIcon>📄</DropZoneIcon>
                <DropZoneText>
                  {isDragging ? 'Suelte el archivo aqui' : 'Arrastre un archivo o haga clic para seleccionar'}
                </DropZoneText>
                <DropZoneHint>Formatos soportados: CSV, Excel (.xlsx, .xls)</DropZoneHint>
              </DropZone>

              <div style={{ marginTop: theme.spacing.md, display: 'flex', gap: theme.spacing.md }}>
                <TemplateLink onClick={() => downloadTemplate('xlsx')}>
                  📥 Descargar plantilla Excel
                </TemplateLink>
                <TemplateLink onClick={() => downloadTemplate('csv')}>
                  📥 Descargar plantilla CSV
                </TemplateLink>
              </div>

              {file && (
                <FileInfo>
                  <span>📄</span>
                  <FileName>{file.name}</FileName>
                  <FileSize>{formatFileSize(file.size)}</FileSize>
                  <RemoveButton onClick={removeFile}>✕</RemoveButton>
                </FileInfo>
              )}
            </>
          )}
        </Section>
      )}

      {/* Step 2: Validate and preview */}
      {currentStep === 2 && (
        <Section>
          <SectionTitle>Vista Previa de Datos</SectionTitle>

          <Summary>
            <SummaryCard $color={theme.colors.primary}>
              <SummaryValue>{parsedData.length}</SummaryValue>
              <SummaryLabel>Total Filas</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.success}>
              <SummaryValue>{validCount}</SummaryValue>
              <SummaryLabel>Validos</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.danger}>
              <SummaryValue>{invalidCount}</SummaryValue>
              <SummaryLabel>Con Errores</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.warning}>
              <SummaryValue>{Math.round((validCount / parsedData.length) * 100)}%</SummaryValue>
              <SummaryLabel>Tasa Exito</SummaryLabel>
            </SummaryCard>
          </Summary>

          <PreviewWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>#</Th>
                  {tablaInfo?.columns.filter(c =>
                    c !== 'id' && c !== 'active' && c !== 'created_at' && c !== 'updated_at'
                  ).map(col => (
                    <Th key={col}>{col}</Th>
                  ))}
                  <Th>Estado</Th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 100).map((row, idx) => (
                  <tr key={idx}>
                    <Td>{row.rowIndex}</Td>
                    {tablaInfo?.columns.filter(c =>
                      c !== 'id' && c !== 'active' && c !== 'created_at' && c !== 'updated_at'
                    ).map(col => (
                      <Td key={col} $error={row.errors.some(e => e.includes(col))}>
                        {row.data[col] || '-'}
                        {row.errors.filter(e => e.includes(col)).map((e, i) => (
                          <ErrorText key={i}>{e}</ErrorText>
                        ))}
                      </Td>
                    ))}
                    <Td>
                      {row.isValid ? (
                        <span style={{ color: theme.colors.success }}>✓ Valido</span>
                      ) : (
                        <span style={{ color: theme.colors.danger }}>✕ Error</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </PreviewWrapper>

          {parsedData.length > 100 && (
            <Message $type="info">
              Mostrando primeras 100 filas de {parsedData.length}
            </Message>
          )}

          {uploading && (
            <>
              <ProgressBar>
                <ProgressFill $percent={uploadProgress} />
              </ProgressBar>
              <div style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
                Procesando... {uploadProgress}%
              </div>
            </>
          )}

          <ButtonRow>
            <Button $variant="secondary" onClick={() => setCurrentStep(1)} disabled={uploading}>
              Atras
            </Button>
            <Button
              $variant="success"
              onClick={handleUpload}
              disabled={uploading || validCount === 0}
            >
              {uploading ? 'Procesando...' : `Cargar ${validCount} registros`}
            </Button>
          </ButtonRow>
        </Section>
      )}

      {/* Step 3: Results */}
      {currentStep === 3 && uploadResult && (
        <Section>
          <SectionTitle>Resultados de la Carga</SectionTitle>

          <Summary>
            <SummaryCard $color={theme.colors.success}>
              <SummaryValue>{uploadResult.success}</SummaryValue>
              <SummaryLabel>Exitosos</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.danger}>
              <SummaryValue>{uploadResult.failed}</SummaryValue>
              <SummaryLabel>Fallidos</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.primary}>
              <SummaryValue>
                {Math.round((uploadResult.success / (uploadResult.success + uploadResult.failed)) * 100)}%
              </SummaryValue>
              <SummaryLabel>Tasa Exito</SummaryLabel>
            </SummaryCard>
          </Summary>

          {uploadResult.success > 0 && (
            <Message $type="success">
              Se cargaron {uploadResult.success} registros exitosamente.
            </Message>
          )}

          {uploadResult.errors.length > 0 && (
            <>
              <SectionTitle>Errores Encontrados</SectionTitle>
              <PreviewWrapper style={{ maxHeight: '200px' }}>
                <Table>
                  <thead>
                    <tr>
                      <Th>Fila</Th>
                      <Th>Error</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.errors.map((err, idx) => (
                      <tr key={idx}>
                        <Td>{err.row}</Td>
                        <Td $error>{err.error}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </PreviewWrapper>
            </>
          )}

          <ButtonRow>
            <Button $variant="secondary" onClick={() => {
              setCurrentStep(1);
              setFile(null);
              setParsedData([]);
              setUploadResult(null);
            }}>
              Nueva Carga
            </Button>
            <Button onClick={() => onNavigate('mantenedores')}>
              Volver a Mantenedores
            </Button>
          </ButtonRow>
        </Section>
      )}
    </Container>
  );
}
