import { generateToken, verifyToken } from '../jwt';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('../../config', () => ({
  config: {
    jwt: {
      secret: 'test-secret',
      expire: '7d',
    },
  },
}));

describe('JWT Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('должен генерировать токен с ID пользователя', () => {
      const mockToken = 'mock-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = generateToken(123);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 123 },
        'test-secret',
        { expiresIn: '7d' }
      );
      expect(result).toBe(mockToken);
    });
  });

  describe('verifyToken', () => {
    it('должен верифицировать и декодировать валидный токен', () => {
      const mockDecoded = { id: 123, iat: 1234567890, exp: 1234567890 };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const result = verifyToken('valid-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(result).toEqual(mockDecoded);
    });

    it('должен выбрасывать ошибку для невалидного токена', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });
  });
});