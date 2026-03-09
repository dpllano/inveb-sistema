/**
 * FileAttachments Component - INVEB
 * Sprint T.2 - Filtrado Adjuntos
 *
 * Componente para mostrar, filtrar y gestionar archivos adjuntos de OTs.
 * Replica el comportamiento de Laravel para visualización de archivos.
 */

import { useState, useMemo, ReactNode } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { Tooltip, ActionTooltip } from './Tooltip';

// =============================================================================
// CONSTANTES (Extraídas de uploads.py)
// =============================================================================

export const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'png', 'jpg', 'jpeg', 'gif',
  'dwg', 'dxf',  // CAD files
  'ai', 'eps', 'psd'  // Design files
] as const;

export type AllowedExtension = typeof ALLOWED_EXTENSIONS[number];

export const FILE_TYPE_LABELS: Record<string, string> = {
  plano: 'Plano/Diseño',
  boceto: 'Boceto',
  ficha_tecnica: 'Ficha Técnica',
  correo_cliente: 'Correo Cliente',
  speed: 'Speed/Producción',
  otro: 'Otro Archivo',
  oc: 'Orden de Compra',
  licitacion: 'Licitación',
  vb_muestra: 'VoBo Muestra',
  vb_boceto: 'VoBo Boceto',
};

export const FILE_CATEGORIES = {
  documentos: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
  imagenes: ['png', 'jpg', 'jpeg', 'gif'],
  cad: ['dwg', 'dxf'],
  diseno: ['ai', 'eps', 'psd'],
} as const;

export type FileCategory = keyof typeof FILE_CATEGORIES;

export const CATEGORY_LABELS: Record<FileCategory, string> = {
  documentos: 'Documentos',
  imagenes: 'Imágenes',
  cad: 'Archivos CAD',
  diseno: 'Diseño',
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// =============================================================================
// TIPOS
// =============================================================================

export interface FileAttachment {
  id: number;
  url: string;
  filename: string;
  tipo: string;
  peso: number;
  created_at?: string;
  file_type?: string; // plano, boceto, etc.
}

export interface OTFiles {
  ot_id: number;
  plano_actual?: string | null;
  boceto_actual?: string | null;
  ficha_tecnica?: string | null;
  correo_cliente?: string | null;
  speed_file?: string | null;
  otro_file?: string | null;
  oc_file?: string | null;
  licitacion_file?: string | null;
  vb_muestra_file?: string | null;
  vb_boceto_file?: string | null;
}

export interface FileAttachmentsProps {
  files: FileAttachment[] | OTFiles;
  onDownload?: (file: FileAttachment) => void;
  onDelete?: (file: FileAttachment) => void;
  showFilters?: boolean;
  showCategories?: boolean;
  canDelete?: boolean;
  emptyMessage?: string;
}

// =============================================================================
// FUNCIONES UTILITARIAS
// =============================================================================

/**
 * Obtiene la extensión de un archivo
 */
export function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Verifica si una extensión está permitida
 */
export function isAllowedExtension(extension: string): boolean {
  return ALLOWED_EXTENSIONS.includes(extension.toLowerCase() as AllowedExtension);
}

/**
 * Obtiene la categoría de un archivo por su extensión
 */
export function getFileCategory(extension: string): FileCategory | null {
  const ext = extension.toLowerCase();
  for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
    if ((extensions as readonly string[]).includes(ext)) {
      return category as FileCategory;
    }
  }
  return null;
}

/**
 * Formatea el tamaño del archivo en formato legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Valida un archivo antes de subirlo
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const ext = getExtension(file.name);

  if (!isAllowedExtension(ext)) {
    return {
      valid: false,
      error: `Extensión no permitida: .${ext}. Permitidas: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Archivo muy grande (${formatFileSize(file.size)}). Máximo: ${formatFileSize(MAX_FILE_SIZE)}`,
    };
  }

  return { valid: true };
}

/**
 * Obtiene el icono según el tipo de archivo
 */
export function getFileIcon(extension: string): string {
  const ext = extension.toLowerCase();

  if (['pdf'].includes(ext)) return '📄';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (['xls', 'xlsx'].includes(ext)) return '📊';
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return '🖼️';
  if (['dwg', 'dxf'].includes(ext)) return '📐';
  if (['ai', 'eps', 'psd'].includes(ext)) return '🎨';

  return '📎';
}

/**
 * Convierte OTFiles a array de FileAttachment
 */
export function otFilesToAttachments(otFiles: OTFiles): FileAttachment[] {
  const attachments: FileAttachment[] = [];
  const fields: Array<{ key: keyof OTFiles; type: string }> = [
    { key: 'plano_actual', type: 'plano' },
    { key: 'boceto_actual', type: 'boceto' },
    { key: 'ficha_tecnica', type: 'ficha_tecnica' },
    { key: 'correo_cliente', type: 'correo_cliente' },
    { key: 'speed_file', type: 'speed' },
    { key: 'otro_file', type: 'otro' },
    { key: 'oc_file', type: 'oc' },
    { key: 'licitacion_file', type: 'licitacion' },
    { key: 'vb_muestra_file', type: 'vb_muestra' },
    { key: 'vb_boceto_file', type: 'vb_boceto' },
  ];

  let idCounter = 1;
  for (const { key, type } of fields) {
    const url = otFiles[key];
    if (url && typeof url === 'string') {
      const filename = url.split('/').pop() || '';
      const ext = getExtension(filename);
      attachments.push({
        id: idCounter++,
        url,
        filename,
        tipo: ext,
        peso: 0, // Unknown from OTFiles
        file_type: type,
      });
    }
  }

  return attachments;
}

/**
 * Filtra archivos por categoría
 */
export function filterByCategory(
  files: FileAttachment[],
  category: FileCategory | 'all'
): FileAttachment[] {
  if (category === 'all') return files;

  const allowedExtensions = FILE_CATEGORIES[category];
  return files.filter(file =>
    (allowedExtensions as readonly string[]).includes(file.tipo.toLowerCase())
  );
}

/**
 * Filtra archivos por tipo de archivo OT
 */
export function filterByFileType(
  files: FileAttachment[],
  fileType: string | 'all'
): FileAttachment[] {
  if (fileType === 'all') return files;
  return files.filter(file => file.file_type === fileType);
}

/**
 * Agrupa archivos por categoría
 */
export function groupByCategory(files: FileAttachment[]): Record<FileCategory | 'otros', FileAttachment[]> {
  const groups: Record<string, FileAttachment[]> = {
    documentos: [],
    imagenes: [],
    cad: [],
    diseno: [],
    otros: [],
  };

  for (const file of files) {
    const category = getFileCategory(file.tipo);
    if (category) {
      groups[category].push(file);
    } else {
      groups.otros.push(file);
    }
  }

  return groups as Record<FileCategory | 'otros', FileAttachment[]>;
}

// =============================================================================
// STYLED COMPONENTS
// =============================================================================

const Container = styled.div`
  padding: 16px;
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${({ $active }) => $active ? theme.colors.primary : theme.colors.border};
  background: ${({ $active }) => $active ? theme.colors.primary : 'white'};
  color: ${({ $active }) => $active ? 'white' : theme.colors.textPrimary};
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${theme.colors.primary};
    background: ${({ $active }) => $active ? theme.colors.primary : `${theme.colors.primary}10`};
  }
`;

const FileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
`;

const FileCard = styled.div`
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: white;
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const FileIcon = styled.span`
  font-size: 2rem;
  text-align: center;
`;

const FileName = styled.div`
  font-size: 0.85rem;
  color: ${theme.colors.textPrimary};
  word-break: break-all;
  text-align: center;
`;

const FileInfo = styled.div`
  font-size: 0.75rem;
  color: ${theme.colors.textSecondary};
  text-align: center;
`;

const FileTypeTag = styled.span`
  display: inline-block;
  padding: 2px 8px;
  background: ${theme.colors.primary}15;
  color: ${theme.colors.primary};
  border-radius: 4px;
  font-size: 0.7rem;
  text-align: center;
`;

const FileActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
`;

const ActionButton = styled.button`
  padding: 4px 8px;
  border: 1px solid ${theme.colors.border};
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.15s ease;

  &:hover {
    background: ${theme.colors.backgroundLight};
  }

  &.delete:hover {
    border-color: ${theme.colors.error};
    color: ${theme.colors.error};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${theme.colors.textSecondary};
`;

const CategorySection = styled.div`
  margin-bottom: 24px;
`;

const CategoryTitle = styled.h4`
  margin: 0 0 12px 0;
  color: ${theme.colors.textPrimary};
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Badge = styled.span`
  background: ${theme.colors.primary}20;
  color: ${theme.colors.primary};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
`;

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function FileAttachments({
  files,
  onDownload,
  onDelete,
  showFilters = true,
  showCategories = false,
  canDelete = false,
  emptyMessage = 'No hay archivos adjuntos',
}: FileAttachmentsProps) {
  const [activeFilter, setActiveFilter] = useState<FileCategory | 'all'>('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');

  // Normalizar files a array
  const normalizedFiles = useMemo(() => {
    if (Array.isArray(files)) {
      return files;
    }
    return otFilesToAttachments(files);
  }, [files]);

  // Aplicar filtros
  const filteredFiles = useMemo(() => {
    let result = normalizedFiles;
    result = filterByCategory(result, activeFilter);
    result = filterByFileType(result, activeTypeFilter);
    return result;
  }, [normalizedFiles, activeFilter, activeTypeFilter]);

  // Agrupar por categoría si está habilitado
  const groupedFiles = useMemo(() => {
    if (!showCategories) return null;
    return groupByCategory(filteredFiles);
  }, [filteredFiles, showCategories]);

  // Tipos de archivo únicos presentes
  const fileTypes = useMemo(() => {
    const types = new Set<string>();
    normalizedFiles.forEach(f => {
      if (f.file_type) types.add(f.file_type);
    });
    return Array.from(types);
  }, [normalizedFiles]);

  if (normalizedFiles.length === 0) {
    return (
      <Container>
        <EmptyState>{emptyMessage}</EmptyState>
      </Container>
    );
  }

  const renderFileCard = (file: FileAttachment) => (
    <FileCard key={file.id}>
      <FileIcon>{getFileIcon(file.tipo)}</FileIcon>
      <Tooltip content={file.filename} maxWidth={300}>
        <FileName>
          {file.filename.length > 25
            ? `${file.filename.substring(0, 22)}...`
            : file.filename}
        </FileName>
      </Tooltip>
      {file.peso > 0 && (
        <FileInfo>{formatFileSize(file.peso)}</FileInfo>
      )}
      {file.file_type && (
        <FileTypeTag>{FILE_TYPE_LABELS[file.file_type] || file.file_type}</FileTypeTag>
      )}
      <FileActions>
        {onDownload && (
          <ActionTooltip label="Descargar">
            <ActionButton onClick={() => onDownload(file)}>
              ⬇️ Descargar
            </ActionButton>
          </ActionTooltip>
        )}
        {canDelete && onDelete && (
          <ActionTooltip label="Eliminar">
            <ActionButton className="delete" onClick={() => onDelete(file)}>
              🗑️
            </ActionButton>
          </ActionTooltip>
        )}
      </FileActions>
    </FileCard>
  );

  return (
    <Container>
      {showFilters && (
        <FiltersRow>
          <FilterButton
            $active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
          >
            Todos ({normalizedFiles.length})
          </FilterButton>
          {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
            const count = filterByCategory(normalizedFiles, cat as FileCategory).length;
            if (count === 0) return null;
            return (
              <FilterButton
                key={cat}
                $active={activeFilter === cat}
                onClick={() => setActiveFilter(cat as FileCategory)}
              >
                {label} ({count})
              </FilterButton>
            );
          })}
        </FiltersRow>
      )}

      {fileTypes.length > 1 && (
        <FiltersRow>
          <FilterButton
            $active={activeTypeFilter === 'all'}
            onClick={() => setActiveTypeFilter('all')}
          >
            Todos los tipos
          </FilterButton>
          {fileTypes.map(type => (
            <FilterButton
              key={type}
              $active={activeTypeFilter === type}
              onClick={() => setActiveTypeFilter(type)}
            >
              {FILE_TYPE_LABELS[type] || type}
            </FilterButton>
          ))}
        </FiltersRow>
      )}

      {showCategories && groupedFiles ? (
        Object.entries(groupedFiles).map(([category, catFiles]) => {
          if (catFiles.length === 0) return null;
          return (
            <CategorySection key={category}>
              <CategoryTitle>
                {CATEGORY_LABELS[category as FileCategory] || 'Otros'}
                <Badge>{catFiles.length}</Badge>
              </CategoryTitle>
              <FileGrid>
                {catFiles.map(renderFileCard)}
              </FileGrid>
            </CategorySection>
          );
        })
      ) : (
        <FileGrid>
          {filteredFiles.map(renderFileCard)}
        </FileGrid>
      )}
    </Container>
  );
}

// =============================================================================
// COMPONENTE DE UPLOAD
// =============================================================================

interface FileUploadProps {
  onFileSelect: (file: File, type: string) => void;
  fileType: string;
  label?: string;
  accept?: string;
  disabled?: boolean;
}

const UploadArea = styled.label<{ $disabled: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 2px dashed ${({ $disabled }) => $disabled ? theme.colors.border : theme.colors.primary}50;
  border-radius: 8px;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  background: ${({ $disabled }) => $disabled ? theme.colors.backgroundLight : 'white'};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ $disabled }) => $disabled ? theme.colors.border : theme.colors.primary};
    background: ${({ $disabled }) => $disabled ? theme.colors.backgroundLight : `${theme.colors.primary}05`};
  }
`;

const UploadIcon = styled.span`
  font-size: 2rem;
  margin-bottom: 8px;
`;

const UploadText = styled.span`
  font-size: 0.9rem;
  color: ${theme.colors.textSecondary};
`;

const HiddenInput = styled.input`
  display: none;
`;

export function FileUpload({
  onFileSelect,
  fileType,
  label = 'Arrastra o haz clic para subir',
  accept,
  disabled = false,
}: FileUploadProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    onFileSelect(file, fileType);
    e.target.value = ''; // Reset input
  };

  const acceptString = accept || ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',');

  return (
    <UploadArea $disabled={disabled}>
      <UploadIcon>📤</UploadIcon>
      <UploadText>{label}</UploadText>
      <HiddenInput
        type="file"
        accept={acceptString}
        onChange={handleChange}
        disabled={disabled}
      />
    </UploadArea>
  );
}

export default FileAttachments;
