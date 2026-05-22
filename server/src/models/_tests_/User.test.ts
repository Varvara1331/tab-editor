import { UserModel } from '../User';
import { UserService } from '../../services/userService';

jest.mock('../../services/userService');

describe('UserModel', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@test.com',
    passwordHash: 'hashedpassword',
    createdAt: '2024-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('должен вызывать UserService.create при создании нового пользователя', async () => {
      (UserService.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserModel.create('testuser', 'test@test.com', 'password123');

      expect(UserService.create).toHaveBeenCalledWith('testuser', 'test@test.com', 'password123');
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('должен вызывать UserService.findByEmail при поиске пользователя по email', async () => {
      (UserService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserModel.findByEmail('test@test.com');

      expect(UserService.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByUsername', () => {
    it('должен вызывать UserService.findByUsername при поиске пользователя по имени пользователя', async () => {
      (UserService.findByUsername as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserModel.findByUsername('testuser');

      expect(UserService.findByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('должен вызывать UserService.findById при поиске пользователя по ID', async () => {
      (UserService.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserModel.findById(1);

      expect(UserService.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateLastLogin', () => {
    it('должен вызывать UserService.updateLastLogin при обновлении времени последнего входа', async () => {
      (UserService.updateLastLogin as jest.Mock).mockResolvedValue(undefined);

      await UserModel.updateLastLogin(1);

      expect(UserService.updateLastLogin).toHaveBeenCalledWith(1);
    });
  });

  describe('comparePassword', () => {
    it('должен вызывать UserService.comparePassword при сравнении паролей', async () => {
      (UserService.comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await UserModel.comparePassword(mockUser as any, 'password123');

      expect(UserService.comparePassword).toHaveBeenCalledWith(mockUser, 'password123');
      expect(result).toBe(true);
    });
  });
});