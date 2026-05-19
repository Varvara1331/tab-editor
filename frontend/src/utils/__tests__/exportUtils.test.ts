import { exportTab, getDownloadUrl, isFormatSupported, getSupportedFormats } from '../export/exportUtils';
import { TabData } from '../../types/tab';

// Моки для функций из exportFormats
jest.mock('../export/exportFormats', () => ({
  exportToMusicXML: jest.fn().mockReturnValue('<xml>mock</xml>'),
  exportToPDF: jest.fn().mockResolvedValue(new Blob(['mock pdf'], { type: 'application/pdf' })),
  exportToText: jest.fn().mockReturnValue('mock text'),
  exportToJSON: jest.fn().mockReturnValue(new Blob(['{"mock":"json"}'], { type: 'application/json' })),
  exportToGP: jest.fn().mockReturnValue(new Blob(['{"gp":"json"}'], { type: 'application/json' })),
}));

// Мок для URL.createObjectURL
const mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
const mockRevokeObjectURL = jest.fn();

// Сохраняем оригинальные функции
const originalCreateObjectURL = global.URL.createObjectURL;
const originalRevokeObjectURL = global.URL.revokeObjectURL;

describe('exportUtils', () => {
  const mockTabData: TabData = {
    id: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    measures: [],
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(() => {
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
  });

  afterAll(() => {
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSupportedFormats', () => {
    it('should return array of supported formats', () => {
      const formats = getSupportedFormats();
      expect(formats).toEqual(['pdf', 'txt', 'json', 'gp', 'xml']);
    });
  });

  describe('isFormatSupported', () => {
    it('should return true for supported formats', () => {
      expect(isFormatSupported('pdf')).toBe(true);
      expect(isFormatSupported('txt')).toBe(true);
      expect(isFormatSupported('json')).toBe(true);
      expect(isFormatSupported('gp')).toBe(true);
      expect(isFormatSupported('xml')).toBe(true);
    });

    it('should return false for unsupported formats', () => {
      expect(isFormatSupported('unsupported')).toBe(false);
      expect(isFormatSupported('')).toBe(false);
    });
  });

  describe('exportTab', () => {
    it('should export to PDF format', async () => {
      const result = await exportTab(mockTabData, 'pdf');
      expect(result).toBeInstanceOf(Blob);
    });

    it('should export to TXT format', async () => {
      const result = await exportTab(mockTabData, 'txt');
      expect(result).toBeInstanceOf(Blob);
    });

    it('should export to JSON format', async () => {
      const result = await exportTab(mockTabData, 'json');
      expect(result).toBeInstanceOf(Blob);
    });

    it('should export to GP format', async () => {
      const result = await exportTab(mockTabData, 'gp');
      expect(result).toBeInstanceOf(Blob);
    });

    it('should export to XML format', async () => {
      const result = await exportTab(mockTabData, 'xml');
      expect(result).toBeInstanceOf(Blob);
    });

    it('should throw error for unsupported format', async () => {
      await expect(exportTab(mockTabData, 'unsupported' as any)).rejects.toThrow('Unsupported format');
    });
  });
});