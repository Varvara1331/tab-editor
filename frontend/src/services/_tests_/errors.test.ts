import { ApiError, ApiErrorType, normalizeError, getErrorMessage } from '../errors';

describe('errors', () => {
  describe('ApiError', () => {
    it('should create error with default type', () => {
      const error = new ApiError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ApiErrorType.UNKNOWN);
      expect(error.name).toBe('ApiError');
    });

    it('should create error with specified type', () => {
      const error = new ApiError('Server error', ApiErrorType.SERVER, 500);
      expect(error.type).toBe(ApiErrorType.SERVER);
      expect(error.statusCode).toBe(500);
    });

    it('should preserve original error', () => {
      const original = new Error('Original');
      const error = new ApiError('Wrapped', ApiErrorType.NETWORK, undefined, original);
      expect(error.originalError).toBe(original);
    });
  });

  describe('normalizeError', () => {
    it('should return ApiError as is', () => {
      const apiError = new ApiError('Test');
      const result = normalizeError(apiError, 'Default');
      expect(result).toBe(apiError);
    });

    it('should convert Error to ApiError', () => {
      const error = new Error('Original error');
      const result = normalizeError(error, 'Default');
      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Original error');
    });

    it('should convert string to ApiError', () => {
      const result = normalizeError('String error', 'Default');
      expect(result.message).toBe('String error');
    });

    it('should convert unknown error to ApiError with default message', () => {
      const result = normalizeError({}, 'Default message');
      expect(result.message).toBe('Default message');
    });
  });

  describe('getErrorMessage', () => {
    it('should return message from ApiError', () => {
      const error = new ApiError('Custom message');
      expect(getErrorMessage(error)).toBe('Custom message');
    });

    it('should return message from Error', () => {
      const error = new Error('JS Error');
      expect(getErrorMessage(error)).toBe('JS Error');
    });

    it('should return string as is', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should extract error from Axios-like response', () => {
      const error = { response: { data: { error: 'Axios error' } } };
      expect(getErrorMessage(error)).toBe('Axios error');
    });

    it('should return fallback for empty object', () => {
      expect(getErrorMessage({}, 'Fallback')).toBe('Fallback');
    });
  });
});