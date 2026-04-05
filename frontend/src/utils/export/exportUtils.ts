/**
 * @fileoverview Менеджер экспорта табулатур в различные форматы.
 * Управляет доступными форматами и загрузкой файлов.
 * 
 * @module utils/exportUtils
 */

import { TabData } from '../../types/tab';
import { sanitizeFilename } from '../stringUtils';

/**
 * Доступные форматы экспорта
 */
export type ExportFormat = 'pdf' | 'txt' | 'json' | 'gp' | 'xml';

/**
 * Информация о формате экспорта
 */
interface FormatInfo {
  /** Расширение файла */
  extension: string;
  /** MIME тип файла */
  mimeType: string;
  /** Функция экспорта */
  exporter: (tabData: TabData) => Promise<Blob | string> | Blob | string;
}

let exportFormats: Record<ExportFormat, FormatInfo> | null = null;

/**
 * Получение доступных форматов экспорта с ленивой загрузкой
 * 
 * @returns Объект с информацией о форматах
 * @private
 */
const getExportFormats = async (): Promise<Record<ExportFormat, FormatInfo>> => {
  if (!exportFormats) {
    const { exportToMusicXML, exportToPDF, exportToText, exportToJSON, exportToGP } = await import('./exportFormats');
    exportFormats = {
      pdf: { extension: 'pdf', mimeType: 'application/pdf', exporter: (data) => exportToPDF(data) },
      txt: { extension: 'txt', mimeType: 'text/plain', exporter: (data) => exportToText(data) },
      json: { extension: 'json', mimeType: 'application/json', exporter: (data) => exportToJSON(data) },
      gp: { extension: 'gp', mimeType: 'application/json', exporter: (data) => exportToGP(data) },
      xml: { extension: 'musicxml', mimeType: 'application/vnd.recordare.musicxml+xml', exporter: (data) => exportToMusicXML(data) },
    };
  }
  return exportFormats;
};

/**
 * Экспорт табулатуры в указанном формате
 * 
 * @param tabData - Данные табулатуры
 * @param format - Формат экспорта
 * @returns Promise с Blob экспортированных данных
 * @throws {Error} Если формат не поддерживается
 */
export const exportTab = async (tabData: TabData, format: ExportFormat): Promise<Blob> => {
  const formats = await getExportFormats();
  const formatInfo = formats[format];
  if (!formatInfo) throw new Error(`Unsupported format: ${format}`);
  const content = await formatInfo.exporter(tabData);
  return content instanceof Blob ? content : new Blob([content], { type: formatInfo.mimeType });
};

/**
 * Скачивание табулатуры в указанном формате
 * 
 * @param tabData - Данные табулатуры
 * @param format - Формат экспорта
 * @param customFilename - Пользовательское имя файла (опционально)
 */
export const downloadTab = async (tabData: TabData, format: ExportFormat, customFilename?: string): Promise<void> => {
  const blob = await exportTab(tabData, format);
  const formats = await getExportFormats();
  const formatInfo = formats[format];
  const baseFilename = customFilename || tabData.title || 'tab';
  const filename = `${sanitizeFilename(baseFilename)}.${formatInfo.extension}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Получение URL для скачивания табулатуры
 * 
 * @param tabData - Данные табулатуры
 * @param format - Формат экспорта
 * @returns Promise с URL для скачивания
 */
export const getDownloadUrl = async (tabData: TabData, format: ExportFormat): Promise<string> => {
  const blob = await exportTab(tabData, format);
  return URL.createObjectURL(blob);
};

/**
 * Проверка, поддерживается ли указанный формат
 * 
 * @param format - Название формата
 * @returns true если формат поддерживается
 */
export const isFormatSupported = (format: string): format is ExportFormat => {
  return ['pdf', 'txt', 'json', 'gp', 'xml'].includes(format);
};

/**
 * Получение списка поддерживаемых форматов
 * 
 * @returns Массив поддерживаемых форматов
 */
export const getSupportedFormats = (): ExportFormat[] => {
  return ['pdf', 'txt', 'json', 'gp', 'xml'];
};