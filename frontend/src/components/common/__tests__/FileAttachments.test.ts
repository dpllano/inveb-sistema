/**
 * Tests para FileAttachments Component - Sprint T.2
 * Prueba la funcionalidad del componente de filtrado de adjuntos.
 */

import { describe, it, expect } from 'vitest';

// =============================================================================
// CONSTANTES (Replicando las del componente)
// =============================================================================

const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'png', 'jpg', 'jpeg', 'gif',
  'dwg', 'dxf',
  'ai', 'eps', 'psd'
] as const;

const FILE_TYPE_LABELS: Record<string, string> = {
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

const FILE_CATEGORIES = {
  documentos: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
  imagenes: ['png', 'jpg', 'jpeg', 'gif'],
  cad: ['dwg', 'dxf'],
  diseno: ['ai', 'eps', 'psd'],
} as const;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// =============================================================================
// TIPOS
// =============================================================================

interface FileAttachment {
  id: number;
  url: string;
  filename: string;
  tipo: string;
  peso: number;
  created_at?: string;
  file_type?: string;
}

interface OTFiles {
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

type FileCategory = keyof typeof FILE_CATEGORIES;

// =============================================================================
// FUNCIONES A TESTEAR
// =============================================================================

function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function isAllowedExtension(extension: string): boolean {
  return ALLOWED_EXTENSIONS.includes(extension.toLowerCase() as any);
}

function getFileCategory(extension: string): FileCategory | null {
  const ext = extension.toLowerCase();
  for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
    if ((extensions as readonly string[]).includes(ext)) {
      return category as FileCategory;
    }
  }
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function validateFile(file: { name: string; size: number }): { valid: boolean; error?: string } {
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

function getFileIcon(extension: string): string {
  const ext = extension.toLowerCase();

  if (['pdf'].includes(ext)) return '📄';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (['xls', 'xlsx'].includes(ext)) return '📊';
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return '🖼️';
  if (['dwg', 'dxf'].includes(ext)) return '📐';
  if (['ai', 'eps', 'psd'].includes(ext)) return '🎨';

  return '📎';
}

function otFilesToAttachments(otFiles: OTFiles): FileAttachment[] {
  const attachments: FileAttachment[] = [];
  const fields = [
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
    const url = (otFiles as any)[key];
    if (url && typeof url === 'string') {
      const filename = url.split('/').pop() || '';
      const ext = getExtension(filename);
      attachments.push({
        id: idCounter++,
        url,
        filename,
        tipo: ext,
        peso: 0,
        file_type: type,
      });
    }
  }

  return attachments;
}

function filterByCategory(
  files: FileAttachment[],
  category: FileCategory | 'all'
): FileAttachment[] {
  if (category === 'all') return files;

  const allowedExtensions = FILE_CATEGORIES[category];
  return files.filter(file =>
    (allowedExtensions as readonly string[]).includes(file.tipo.toLowerCase())
  );
}

function filterByFileType(
  files: FileAttachment[],
  fileType: string | 'all'
): FileAttachment[] {
  if (fileType === 'all') return files;
  return files.filter(file => file.file_type === fileType);
}

function groupByCategory(files: FileAttachment[]): Record<FileCategory | 'otros', FileAttachment[]> {
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
// TESTS
// =============================================================================

describe('FileAttachments - Sprint T.2', () => {
  describe('ALLOWED_EXTENSIONS', () => {
    it('debe incluir extensiones de documentos', () => {
      expect(ALLOWED_EXTENSIONS).toContain('pdf');
      expect(ALLOWED_EXTENSIONS).toContain('doc');
      expect(ALLOWED_EXTENSIONS).toContain('docx');
      expect(ALLOWED_EXTENSIONS).toContain('xls');
      expect(ALLOWED_EXTENSIONS).toContain('xlsx');
    });

    it('debe incluir extensiones de imágenes', () => {
      expect(ALLOWED_EXTENSIONS).toContain('png');
      expect(ALLOWED_EXTENSIONS).toContain('jpg');
      expect(ALLOWED_EXTENSIONS).toContain('jpeg');
      expect(ALLOWED_EXTENSIONS).toContain('gif');
    });

    it('debe incluir extensiones CAD', () => {
      expect(ALLOWED_EXTENSIONS).toContain('dwg');
      expect(ALLOWED_EXTENSIONS).toContain('dxf');
    });

    it('debe incluir extensiones de diseño', () => {
      expect(ALLOWED_EXTENSIONS).toContain('ai');
      expect(ALLOWED_EXTENSIONS).toContain('eps');
      expect(ALLOWED_EXTENSIONS).toContain('psd');
    });

    it('debe tener 14 extensiones permitidas', () => {
      expect(ALLOWED_EXTENSIONS).toHaveLength(14);
    });
  });

  describe('FILE_TYPE_LABELS', () => {
    it('debe tener 10 tipos de archivo OT', () => {
      expect(Object.keys(FILE_TYPE_LABELS)).toHaveLength(10);
    });

    it('debe tener labels en español', () => {
      expect(FILE_TYPE_LABELS.plano).toBe('Plano/Diseño');
      expect(FILE_TYPE_LABELS.boceto).toBe('Boceto');
      expect(FILE_TYPE_LABELS.oc).toBe('Orden de Compra');
      expect(FILE_TYPE_LABELS.licitacion).toBe('Licitación');
    });
  });

  describe('getExtension', () => {
    it('debe extraer extensión de archivo normal', () => {
      expect(getExtension('documento.pdf')).toBe('pdf');
      expect(getExtension('imagen.PNG')).toBe('png');
      expect(getExtension('archivo.docx')).toBe('docx');
    });

    it('debe manejar múltiples puntos', () => {
      expect(getExtension('archivo.backup.pdf')).toBe('pdf');
      expect(getExtension('mi.documento.final.xlsx')).toBe('xlsx');
    });

    it('debe retornar vacío para archivos sin extensión', () => {
      expect(getExtension('archivo')).toBe('');
      expect(getExtension('README')).toBe('');
    });

    it('debe convertir a minúsculas', () => {
      expect(getExtension('ARCHIVO.PDF')).toBe('pdf');
      expect(getExtension('Imagen.JPG')).toBe('jpg');
    });
  });

  describe('isAllowedExtension', () => {
    it('debe aceptar extensiones permitidas', () => {
      expect(isAllowedExtension('pdf')).toBe(true);
      expect(isAllowedExtension('doc')).toBe(true);
      expect(isAllowedExtension('png')).toBe(true);
      expect(isAllowedExtension('dwg')).toBe(true);
    });

    it('debe rechazar extensiones no permitidas', () => {
      expect(isAllowedExtension('exe')).toBe(false);
      expect(isAllowedExtension('bat')).toBe(false);
      expect(isAllowedExtension('sh')).toBe(false);
      expect(isAllowedExtension('mp3')).toBe(false);
    });

    it('debe ser case-insensitive', () => {
      expect(isAllowedExtension('PDF')).toBe(true);
      expect(isAllowedExtension('Pdf')).toBe(true);
      expect(isAllowedExtension('pDf')).toBe(true);
    });
  });

  describe('getFileCategory', () => {
    it('debe categorizar documentos', () => {
      expect(getFileCategory('pdf')).toBe('documentos');
      expect(getFileCategory('doc')).toBe('documentos');
      expect(getFileCategory('docx')).toBe('documentos');
      expect(getFileCategory('xls')).toBe('documentos');
      expect(getFileCategory('xlsx')).toBe('documentos');
    });

    it('debe categorizar imágenes', () => {
      expect(getFileCategory('png')).toBe('imagenes');
      expect(getFileCategory('jpg')).toBe('imagenes');
      expect(getFileCategory('jpeg')).toBe('imagenes');
      expect(getFileCategory('gif')).toBe('imagenes');
    });

    it('debe categorizar archivos CAD', () => {
      expect(getFileCategory('dwg')).toBe('cad');
      expect(getFileCategory('dxf')).toBe('cad');
    });

    it('debe categorizar archivos de diseño', () => {
      expect(getFileCategory('ai')).toBe('diseno');
      expect(getFileCategory('eps')).toBe('diseno');
      expect(getFileCategory('psd')).toBe('diseno');
    });

    it('debe retornar null para extensiones desconocidas', () => {
      expect(getFileCategory('exe')).toBe(null);
      expect(getFileCategory('mp3')).toBe(null);
      expect(getFileCategory('zip')).toBe(null);
    });
  });

  describe('formatFileSize', () => {
    it('debe formatear bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500.0 B');
    });

    it('debe formatear kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(5 * 1024)).toBe('5.0 KB');
    });

    it('debe formatear megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(50 * 1024 * 1024)).toBe('50.0 MB');
    });

    it('debe formatear gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    });

    it('debe mostrar decimales', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB'); // 1.5 KB
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });
  });

  describe('validateFile', () => {
    it('debe aceptar archivos válidos', () => {
      const result = validateFile({ name: 'documento.pdf', size: 1024 });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('debe rechazar extensiones no permitidas', () => {
      const result = validateFile({ name: 'malware.exe', size: 1024 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Extensión no permitida');
    });

    it('debe rechazar archivos muy grandes', () => {
      const result = validateFile({ name: 'grande.pdf', size: 100 * 1024 * 1024 }); // 100 MB
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Archivo muy grande');
      expect(result.error).toContain('50.0 MB');
    });

    it('debe aceptar archivos en el límite de tamaño', () => {
      const result = validateFile({ name: 'limite.pdf', size: MAX_FILE_SIZE });
      expect(result.valid).toBe(true);
    });

    it('debe rechazar archivos 1 byte sobre el límite', () => {
      const result = validateFile({ name: 'sobrelimite.pdf', size: MAX_FILE_SIZE + 1 });
      expect(result.valid).toBe(false);
    });
  });

  describe('getFileIcon', () => {
    it('debe retornar icono de documento para PDF', () => {
      expect(getFileIcon('pdf')).toBe('📄');
    });

    it('debe retornar icono de documento para Word', () => {
      expect(getFileIcon('doc')).toBe('📝');
      expect(getFileIcon('docx')).toBe('📝');
    });

    it('debe retornar icono de hoja para Excel', () => {
      expect(getFileIcon('xls')).toBe('📊');
      expect(getFileIcon('xlsx')).toBe('📊');
    });

    it('debe retornar icono de imagen', () => {
      expect(getFileIcon('png')).toBe('🖼️');
      expect(getFileIcon('jpg')).toBe('🖼️');
      expect(getFileIcon('jpeg')).toBe('🖼️');
      expect(getFileIcon('gif')).toBe('🖼️');
    });

    it('debe retornar icono de CAD', () => {
      expect(getFileIcon('dwg')).toBe('📐');
      expect(getFileIcon('dxf')).toBe('📐');
    });

    it('debe retornar icono de diseño', () => {
      expect(getFileIcon('ai')).toBe('🎨');
      expect(getFileIcon('eps')).toBe('🎨');
      expect(getFileIcon('psd')).toBe('🎨');
    });

    it('debe retornar icono genérico para desconocidos', () => {
      expect(getFileIcon('xyz')).toBe('📎');
      expect(getFileIcon('')).toBe('📎');
    });
  });

  describe('otFilesToAttachments', () => {
    it('debe convertir OTFiles vacío a array vacío', () => {
      const otFiles: OTFiles = { ot_id: 1 };
      const result = otFilesToAttachments(otFiles);
      expect(result).toHaveLength(0);
    });

    it('debe convertir archivos presentes', () => {
      const otFiles: OTFiles = {
        ot_id: 1,
        plano_actual: '/uploads/ot_1/plano.pdf',
        boceto_actual: '/uploads/ot_1/boceto.png',
      };
      const result = otFilesToAttachments(otFiles);
      expect(result).toHaveLength(2);
    });

    it('debe extraer filename y tipo correctamente', () => {
      const otFiles: OTFiles = {
        ot_id: 1,
        plano_actual: '/uploads/ot_1/20260222_abc123.pdf',
      };
      const result = otFilesToAttachments(otFiles);
      expect(result[0].filename).toBe('20260222_abc123.pdf');
      expect(result[0].tipo).toBe('pdf');
      expect(result[0].file_type).toBe('plano');
    });

    it('debe ignorar valores null/undefined', () => {
      const otFiles: OTFiles = {
        ot_id: 1,
        plano_actual: null,
        boceto_actual: undefined,
        ficha_tecnica: '/uploads/ot_1/ficha.pdf',
      };
      const result = otFilesToAttachments(otFiles);
      expect(result).toHaveLength(1);
      expect(result[0].file_type).toBe('ficha_tecnica');
    });

    it('debe asignar IDs incrementales', () => {
      const otFiles: OTFiles = {
        ot_id: 1,
        plano_actual: '/uploads/plano.pdf',
        boceto_actual: '/uploads/boceto.png',
        oc_file: '/uploads/oc.pdf',
      };
      const result = otFilesToAttachments(otFiles);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
    });
  });

  describe('filterByCategory', () => {
    const testFiles: FileAttachment[] = [
      { id: 1, url: '', filename: 'doc.pdf', tipo: 'pdf', peso: 0 },
      { id: 2, url: '', filename: 'img.png', tipo: 'png', peso: 0 },
      { id: 3, url: '', filename: 'cad.dwg', tipo: 'dwg', peso: 0 },
      { id: 4, url: '', filename: 'design.ai', tipo: 'ai', peso: 0 },
    ];

    it('debe retornar todos para "all"', () => {
      const result = filterByCategory(testFiles, 'all');
      expect(result).toHaveLength(4);
    });

    it('debe filtrar por documentos', () => {
      const result = filterByCategory(testFiles, 'documentos');
      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('pdf');
    });

    it('debe filtrar por imágenes', () => {
      const result = filterByCategory(testFiles, 'imagenes');
      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('png');
    });

    it('debe filtrar por CAD', () => {
      const result = filterByCategory(testFiles, 'cad');
      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('dwg');
    });

    it('debe filtrar por diseño', () => {
      const result = filterByCategory(testFiles, 'diseno');
      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('ai');
    });
  });

  describe('filterByFileType', () => {
    const testFiles: FileAttachment[] = [
      { id: 1, url: '', filename: 'a.pdf', tipo: 'pdf', peso: 0, file_type: 'plano' },
      { id: 2, url: '', filename: 'b.pdf', tipo: 'pdf', peso: 0, file_type: 'oc' },
      { id: 3, url: '', filename: 'c.png', tipo: 'png', peso: 0, file_type: 'boceto' },
    ];

    it('debe retornar todos para "all"', () => {
      const result = filterByFileType(testFiles, 'all');
      expect(result).toHaveLength(3);
    });

    it('debe filtrar por tipo plano', () => {
      const result = filterByFileType(testFiles, 'plano');
      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('a.pdf');
    });

    it('debe filtrar por tipo oc', () => {
      const result = filterByFileType(testFiles, 'oc');
      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('b.pdf');
    });

    it('debe retornar vacío para tipo inexistente', () => {
      const result = filterByFileType(testFiles, 'licitacion');
      expect(result).toHaveLength(0);
    });
  });

  describe('groupByCategory', () => {
    const testFiles: FileAttachment[] = [
      { id: 1, url: '', filename: 'a.pdf', tipo: 'pdf', peso: 0 },
      { id: 2, url: '', filename: 'b.docx', tipo: 'docx', peso: 0 },
      { id: 3, url: '', filename: 'c.png', tipo: 'png', peso: 0 },
      { id: 4, url: '', filename: 'd.dwg', tipo: 'dwg', peso: 0 },
      { id: 5, url: '', filename: 'e.ai', tipo: 'ai', peso: 0 },
      { id: 6, url: '', filename: 'f.xyz', tipo: 'xyz', peso: 0 },
    ];

    it('debe agrupar correctamente', () => {
      const result = groupByCategory(testFiles);
      expect(result.documentos).toHaveLength(2);
      expect(result.imagenes).toHaveLength(1);
      expect(result.cad).toHaveLength(1);
      expect(result.diseno).toHaveLength(1);
      expect(result.otros).toHaveLength(1);
    });

    it('debe incluir archivos desconocidos en "otros"', () => {
      const result = groupByCategory(testFiles);
      expect(result.otros[0].tipo).toBe('xyz');
    });
  });

  describe('MAX_FILE_SIZE', () => {
    it('debe ser 50 MB', () => {
      expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
    });

    it('debe ser 52428800 bytes exactos', () => {
      expect(MAX_FILE_SIZE).toBe(52428800);
    });
  });
});
