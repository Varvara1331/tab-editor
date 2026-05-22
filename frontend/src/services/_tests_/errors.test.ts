import { ApiError, ApiErrorType, normalizeError, getErrorMessage } from '../errors';
import axios from 'axios';

jest.mock('axios', () => ({
  isAxiosError: jest.fn(),
}));

describe('errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ApiError', () => {
    it('должен создавать ошибку с типом UNKNOWN по умолчанию', () => {
      const error = new ApiError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ApiErrorType.UNKNOWN);
      expect(error.name).toBe('ApiError');
    });

    it('должен создавать ошибку с указанным типом и статус кодом', () => {
      const error = new ApiError('Server error', ApiErrorType.SERVER, 500);
      expect(error.type).toBe(ApiErrorType.SERVER);
      expect(error.statusCode).toBe(500);
    });

    it('должен сохранять ссылку на оригинальную ошибку', () => {
      const original = new Error('Original');
      const error = new ApiError('Wrapped', ApiErrorType.NETWORK, undefined, original);
      expect(error.originalError).toBe(original);
    });
  });

  describe('normalizeError', () => {
    it('должен возвращать ApiError без изменений', () => {
      const apiError = new ApiError('Test');
      const result = normalizeError(apiError, 'Default');
      expect(result).toBe(apiError);
    });

    it('должен преобразовывать стандартную Error в ApiError', () => {
      const error = new Error('Original error');
      const result = normalizeError(error, 'Default');
      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Original error');
    });

    it('должен преобразовывать строку в ApiError', () => {
      const result = normalizeError('String error', 'Default');
      expect(result.message).toBe('String error');
    });

    it('должен преобразовывать неизвестную ошибку в ApiError с сообщением по умолчанию', () => {
      const result = normalizeError({}, 'Default message');
      expect(result.message).toBe('Default message');
    });
  });

  describe('getErrorMessage', () => {
    it('должен возвращать сообщение из ApiError', () => {
      const error = new ApiError('Custom message');
      expect(getErrorMessage(error)).toBe('Custom message');
    });

    it('должен возвращать сообщение из стандартной Error', () => {
      const error = new Error('JS Error');
      expect(getErrorMessage(error)).toBe('JS Error');
    });

    it('должен возвращать строку как есть', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('должен извлекать сообщение из ответа Axios-подобной ошибки', () => {
      const axiosError = new Error('Axios error') as any;
      axiosError.isAxiosError = true;
      axiosError.response = { data: { error: 'Axios error' } };
      
      expect(getErrorMessage(axiosError)).toBe('Axios error');
    });

    it('должен возвращать сообщение по умолчанию для пустого объекта', () => {
      expect(getErrorMessage({}, 'Fallback')).toBe('Fallback');
    });
  });
});