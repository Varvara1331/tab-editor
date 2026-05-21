import { UserService } from '../userService';
import { db } from '../../database';
import bcrypt from 'bcryptjs';

jest.mock('../../database');
jest.mock('bcryptjs');

describe('UserService', () => {
  const mockUserRow = {
    Id: 1,
    Username: 'testuser',
    Email: 'test@test.com',
    PasswordHash: 'hashedpassword',
    CreatedAt: '2024-01-01T00:00:00.000Z',
    LastLogin: null,
    Settings: null,
  };

  const mockUserRowWithLastLogin = {
    ...mockUserRow,
    LastLogin: '2024-01-15T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (db.run as jest.Mock).mockResolvedValue({ lastID: 1 });
      (db.get as jest.Mock).mockResolvedValue(mockUserRow);

      const result = await UserService.create('testuser', 'test@test.com', 'password123');

      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@test.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw error when user creation fails', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (db.run as jest.Mock).mockResolvedValue({ lastID: 1 });
      (db.get as jest.Mock).mockResolvedValue(null);

      await expect(UserService.create('testuser', 'test@test.com', 'password123'))
        .rejects.toThrow('Failed to create user');
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockUserRow);

      const result = await UserService.findByEmail('test@test.com');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('test@test.com');
      expect(result?.id).toBe(1);
    });

    it('should return null when user not found', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await UserService.findByEmail('nonexistent@test.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return user when found', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockUserRow);

      const result = await UserService.findByUsername('testuser');

      expect(result).not.toBeNull();
      expect(result?.username).toBe('testuser');
    });

    it('should return null when user not found', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await UserService.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockUserRow);

      const result = await UserService.findById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.username).toBe('testuser');
    });

    it('should return null when user not found', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await UserService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });

      await UserService.updateLastLogin(1);

      expect(db.run).toHaveBeenCalledWith(
        'UPDATE Users SET LastLogin = datetime("now") WHERE Id = ?',
        [1]
      );
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const user = { passwordHash: 'hashed' } as any;
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await UserService.comparePassword(user, 'password123');

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = { passwordHash: 'hashed' } as any;
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await UserService.comparePassword(user, 'wrong');

      expect(result).toBe(false);
    });
  });

  describe('mapUser', () => {
    it('should correctly map database row to IUser', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockUserRow);

      const result = await UserService.findById(1);

      expect(result).toMatchObject({
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        passwordHash: 'hashedpassword',
      });
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.lastLogin).toBeUndefined();
    });

    it('should handle lastLogin date correctly', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockUserRowWithLastLogin);

      const result = await UserService.findById(1);

      expect(result?.lastLogin).toBeInstanceOf(Date);
    });

    it('should parse settings JSON when present', async () => {
      const rowWithSettings = {
        ...mockUserRow,
        Settings: '{"theme":"dark"}',
      };
      (db.get as jest.Mock).mockResolvedValue(rowWithSettings);

      const result = await UserService.findById(1);

      expect(result?.settings).toEqual({ theme: 'dark' });
    });
  });
});