import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuditService } from '@/features/audit/services/audit.service';
import { CertificateService } from '@/features/certificates/services/certificate.service';

type ReportCell = string | number | boolean | null | undefined;
type ReportRow = Record<string, ReportCell>;

export interface CsvReportOptions {
  filename: string;
  title?: string;
  generatedBy?: string;
  filters?: Record<string, ReportCell>;
}

export interface PdfSummaryItem {
  label: string;
  value: string | number;
}

export interface PdfReportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  generatedBy?: string;
  institution?: string;
  summary?: PdfSummaryItem[];
  columns: string[];
  rows: Array<Array<ReportCell>>;
  filters?: Record<string, ReportCell>;
  footerNote?: string;
}

const JOMAR_LOGO_PATH = '/assets/JOMAR/logoTexto.png';
let logoDataUrlCache: string | null = null;

function sanitizeFilename(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function formatReportFilename(context: string, extension = 'csv'): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${sanitizeFilename(context || 'reporte')}-${date}.${extension.replace(/^\./, '')}`;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (value instanceof Date) return value.toLocaleString('es-CO');
  return String(value);
}

async function getLogoDataUrl(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (logoDataUrlCache) return logoDataUrlCache;

  try {
    const response = await fetch(JOMAR_LOGO_PATH);
    const blob = await response.blob();
    logoDataUrlCache = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return logoDataUrlCache;
  } catch {
    return null;
  }
}

function buildMetadataRows(options: CsvReportOptions): string[][] {
  const rows: string[][] = [];
  if (options.title) rows.push(['Reporte', options.title]);
  rows.push(['Generado', new Date().toLocaleString('es-CO')]);
  if (options.generatedBy) rows.push(['Generado por', options.generatedBy]);
  if (options.filters) {
    Object.entries(options.filters)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .forEach(([key, value]) => rows.push([key, formatCell(value)]));
  }
  return rows.length ? [...rows, []] : [];
}

export function downloadCsvReport(data: ReportRow[], options: CsvReportOptions): void {
  const rows = data.map((row) => {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, formatCell(value)]),
    );
  });
  const csv = Papa.unparse({
    fields: rows.length ? Object.keys(rows[0]) : [],
    data: rows,
  });
  const metadata = buildMetadataRows(options);
  const metadataCsv = metadata.length ? `${Papa.unparse(metadata)}\r\n` : '';
  const blob = new Blob([metadataCsv + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = options.filename.endsWith('.csv') ? options.filename : `${options.filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  AuditService.record({
    action: 'export.csv',
    resource: 'report',
    resourceId: options.filename,
    metadata: {
      title: options.title,
      rows: data.length,
      filters: options.filters || {},
    },
  });
}

export function downloadCsv(data: ReportRow[], filename: string): void {
  downloadCsvReport(data, { filename });
}

export async function downloadPdfReport(options: PdfReportOptions): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const generatedAt = new Date().toLocaleString('es-CO');
  const logo = await getLogoDataUrl();

  doc.setFillColor(24, 0, 173);
  doc.rect(0, 0, pageWidth, 82, 'F');
  if (logo) doc.addImage(logo, 'PNG', marginX, 14, 155, 52);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(options.title, logo ? 215 : marginX, 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(options.subtitle || 'Reporte SIERCP', logo ? 215 : marginX, 54);
  doc.text(`Generado: ${generatedAt}`, pageWidth - marginX, 34, { align: 'right' });
  if (options.generatedBy) {
    doc.text(`Responsable: ${options.generatedBy}`, pageWidth - marginX, 54, { align: 'right' });
  }

  let y = 108;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(options.institution || 'SIERCP / JOMAR SEGURID', marginX, y);
  y += 18;

  if (options.filters) {
    const activeFilters = Object.entries(options.filters)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}: ${formatCell(value)}`);
    if (activeFilters.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Filtros: ${activeFilters.join(' | ')}`, marginX, y, { maxWidth: pageWidth - marginX * 2 });
      y += 20;
    }
  }

  if (options.summary?.length) {
    const visibleSummary = options.summary.slice(0, 4);
    const cardWidth = (pageWidth - marginX * 2 - 24) / visibleSummary.length;
    visibleSummary.forEach((item, index) => {
      const x = marginX + index * (cardWidth + 8);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, cardWidth, 48, 6, 6, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(item.label.toUpperCase(), x + 12, y + 17);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(formatCell(item.value), x + 12, y + 37);
    });
    y += 70;
  }

  autoTable(doc, {
    startY: y,
    head: [options.columns],
    body: options.rows.map((row) => row.map(formatCell)),
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 6,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [24, 0, 173],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: marginX, right: marginX },
    didDrawPage: () => {
      const pageNumber = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        options.footerNote || 'Documento generado por SIERCP / JOMAR SEGURID.',
        marginX,
        pageHeight - 24,
      );
      doc.text(`Pagina ${pageNumber}`, pageWidth - marginX, pageHeight - 24, { align: 'right' });
    },
  });

  doc.save(options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`);
  AuditService.record({
    action: 'export.pdf',
    resource: 'report',
    resourceId: options.filename,
    metadata: {
      title: options.title,
      rows: options.rows.length,
      filters: options.filters || {},
    },
  });
}

export function downloadSessionPdfReport(options: Omit<PdfReportOptions, 'footerNote'>): Promise<void> {
  return downloadPdfReport({
    ...options,
    footerNote: 'Reporte de entrenamiento RCP basado en metricas AHA registradas en SIERCP.',
  });
}

export function downloadCertificatePdf(options: {
  filename: string;
  studentName: string;
  certification: string;
  score: number;
  issuedAt: Date;
  sessionId?: string;
  instructorOrInstitution?: string;
  institutionId?: string;
}): Promise<void> {
  return CertificateService.issue({
    id: options.sessionId,
    studentName: options.studentName,
    certification: options.certification,
    score: options.score,
    issuedAt: options.issuedAt,
    sessionId: options.sessionId,
    institutionId: options.institutionId,
  }).catch(() => options.sessionId || options.filename.replace(/\.pdf$/i, '')).then((certificateId) => {
    const verificationUrl = CertificateService.buildVerificationUrl(certificateId);
    AuditService.record({
      action: 'certificate.generate',
      resource: 'certificate',
      resourceId: certificateId,
      institutionId: options.institutionId,
      metadata: {
        studentName: options.studentName,
        certification: options.certification,
        score: options.score,
      },
    });
    return downloadPdfReport({
      filename: options.filename,
      title: 'Certificado de entrenamiento RCP',
      subtitle: 'Constancia de cumplimiento de criterio minimo de calidad AHA',
      institution: options.instructorOrInstitution || 'SIERCP / JOMAR SEGURID',
      summary: [
        { label: 'Participante', value: options.studentName },
        { label: 'Calidad AHA', value: `${Math.round(options.score)}%` },
        { label: 'Emision', value: options.issuedAt.toLocaleDateString('es-CO') },
        { label: 'Folio', value: certificateId },
      ],
      columns: ['Campo', 'Valor'],
      rows: [
        ['Participante', options.studentName],
        ['Certificacion', options.certification],
        ['Puntaje de calidad', `${Math.round(options.score)}%`],
        ['Fecha de emision', options.issuedAt.toLocaleDateString('es-CO')],
        ['Folio verificable', certificateId],
        ['URL de validacion', verificationUrl],
      ],
      footerNote: 'Certificado generado por SIERCP / JOMAR SEGURID. Validacion publica disponible por folio.',
    });
  });
}
