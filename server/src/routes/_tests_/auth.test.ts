import request from 'supertest';
import express from 'express';
import authRoutes from '../auth';
import { UserModel } from '../../models/User';
import { generateToken } from '../../utils/jwt';

jest.mock('../../models/User');
jest.mock('../../utils/jwt');

// Правильный мок для protect middleware
jest.mock('../../middleware/auth', () => ({
  protect: (req: any, _res: any, next: any) => {
    // Добавляем пользователя в запрос для тестов
    req.user = { id: 1, username: 'testuser', email: 'test@test.com' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@test.com',
    password: 'hashedpassword',
    createdAt: '2024-01-01',
    lastLogin: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register user successfully', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
      (UserModel.findByUsername as jest.Mock).mockResolvedValue(null);
      (UserModel.create as jest.Mock).mockResolvedValue(mockUser);
      (generateToken as jest.Mock).mockReturnValue('jwt-token');

      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'test@test.com', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBe('jwt-token');
    });

    it('should return 400 if email already exists', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'test@test.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Пользователь с таким email уже существует');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.comparePassword as jest.Mock).mockResolvedValue(true);
      (UserModel.updateLastLogin as jest.Mock).mockResolvedValue(undefined);
      (generateToken as jest.Mock).mockReturnValue('jwt-token');

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBe('jwt-token');
    });

    it('should return 401 for invalid credentials', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Неверный email или пароль');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info when authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
    });
  });
});