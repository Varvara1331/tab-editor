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
    it('should generate token with user id', () => {
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
    it('should verify and decode valid token', () => {
      const mockDecoded = { id: 123, iat: 1234567890, exp: 1234567890 };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const result = verifyToken('valid-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(result).toEqual(mockDecoded);
    });

    it('should throw error for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });
  });
});