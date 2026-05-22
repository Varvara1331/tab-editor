import { NextFunction } from 'express';
import { protect } from '../auth';
import { UserModel } from '../../models/User';
import { verifyToken } from '../../utils/jwt';

jest.mock('../../models/User');
jest.mock('../../utils/jwt');

describe('Auth Middleware', () => {
  let req: any;
  let res: any;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('protect', () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@test.com' };

    it('должен возвращать 401 при отсутствии заголовка авторизации', async () => {
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Не авторизован, токен отсутствует',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен возвращать 401 если заголовок не начинается с Bearer', async () => {
      req.headers.authorization = 'Basic token';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Не авторизован, токен отсутствует',
      });
    });

    it('должен возвращать 401 если токен отсутствует после Bearer', async () => {
      req.headers.authorization = 'Bearer';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Не авторизован',
      });
    });

    it('должен возвращать 401 если верификация токена не удалась', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      (verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Не авторизован',
      });
    });

    it('должен возвращать 401 если пользователь не найден', async () => {
      req.headers.authorization = 'Bearer valid-token';
      (verifyToken as jest.Mock).mockReturnValue({ id: 999 });
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Пользователь не найден',
      });
    });

    it('должен вызывать next и устанавливать req.user при успешной авторизации', async () => {
      req.headers.authorization = 'Bearer valid-token';
      (verifyToken as jest.Mock).mockReturnValue({ id: 1 });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await protect(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});