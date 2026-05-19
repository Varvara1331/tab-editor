import { importTabFromFile, canImportFile } from '../import/importUtils';
import { validateFile, readFileAsText } from '../fileUtils';

// Моки для функций из fileUtils
jest.mock('../fileUtils', () => ({
  validateFile: jest.fn(),
  readFileAsText: jest.fn(),
  getFileExtension: jest.fn(),
  isGpJsonFile: jest.fn(),
}));

// Моки для функций из importParsers
jest.mock('../import/importParsers', () => ({
  importFromJson: jest.fn().mockReturnValue({ id: 1, title: 'Imported Tab' }),
  importFromGpJson: jest.fn().mockReturnValue({ id: 2, title: 'GP Imported' }),
  importFromMusicXML: jest.fn().mockResolvedValue({ id: 3, title: 'XML Imported' }),
}));

const mockValidateFile = validateFile as jest.Mock;
const mockReadFileAsText = readFileAsText as jest.Mock;

describe('importUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('canImportFile', () => {
    it('should return true for valid file', () => {
      mockValidateFile.mockReturnValue({ valid: true });
      const file = new File([''], 'test.json', { type: 'application/json' });
      expect(canImportFile(file)).toBe(true);
    });

    it('should return false for invalid file', () => {
      mockValidateFile.mockReturnValue({ valid: false, error: 'Invalid format' });
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(canImportFile(file)).toBe(false);
    });
  });

  describe('importTabFromFile', () => {
    it('should return error for invalid file', async () => {
      mockValidateFile.mockReturnValue({ valid: false, error: 'File too large' });
      const file = new File([''], 'test.json', { type: 'application/json' });
      const result = await importTabFromFile(file);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('File too large');
    });

    it('should handle JSON file', async () => {
      mockValidateFile.mockReturnValue({ valid: true });
      mockReadFileAsText.mockResolvedValue('{"title":"Song"}');
      
      const { getFileExtension } = require('../fileUtils');
      getFileExtension.mockReturnValue('json');
      
      const file = new File(['{"title":"Song"}'], 'test.json', { type: 'application/json' });
      const result = await importTabFromFile(file);
      
      expect(result.success).toBe(true);
      expect(result.format).toBe('JSON');
    });

    it('should handle GP JSON file', async () => {
      mockValidateFile.mockReturnValue({ valid: true });
      mockReadFileAsText.mockResolvedValue('{"format":"guitar-pro-compatible"}');
      
      const { isGpJsonFile } = require('../fileUtils');
      isGpJsonFile.mockReturnValue(true);
      
      const file = new File(['{}'], 'test.gp.json', { type: 'application/json' });
      const result = await importTabFromFile(file);
      
      expect(result.success).toBe(true);
      expect(result.format).toBe('Guitar Pro JSON');
    });
  });
});