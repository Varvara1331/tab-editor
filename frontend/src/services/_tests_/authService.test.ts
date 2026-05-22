import { 
  register, 
  login, 
  logout, 
  getCurrentUser, 
  isAuthenticated, 
  getToken,
  clearEditorDrafts,
  clearEditorState
} from '../authService';
import { api, STORAGE_KEYS } from '../api';

jest.mock('../api', () => ({
  api: {
    post: jest.fn(),
  },
  STORAGE_KEYS: {
    TOKEN: 'token',
    USER: 'user',
  },
}));

describe('authService', () => {
  const mockApi = api as jest.Mocked<typeof api>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('register', () => {
    it('должен успешно регистрировать пользователя и сохранять токен', async () => {
      const mockResponse = {
        data: {
          success: true,
          token: 'test-token',
          user: { id: 1, username: 'test', email: 'test@test.com', createdAt: '2024-01-01' },
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await register('test', 'test@test.com', 'password');
      expect(result.success).toBe(true);
      expect(result.token).toBe('test-token');
      expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBe('test-token');
    });

    it('должен обрабатывать ошибку при регистрации', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));
      const result = await register('test', 'test@test.com', 'password');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('login', () => {
    it('должен успешно выполнять вход пользователя и сохранять токен', async () => {
      const mockResponse = {
        data: {
          success: true,
          token: 'login-token',
          user: { id: 1, username: 'test', email: 'test@test.com', createdAt: '2024-01-01' },
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await login('test@test.com', 'password');
      expect(result.success).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBe('login-token');
    });
  });

  describe('logout', () => {
    it('должен очищать сессию пользователя и удалять черновики', () => {
      localStorage.setItem(STORAGE_KEYS.TOKEN, 'token');
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ id: 1, username: 'test' }));
      
      logout();
      
      expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('должен возвращать пользователя из localStorage', () => {
      const user = { id: 1, username: 'test', email: 'test@test.com', createdAt: '2024-01-01' };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      
      expect(getCurrentUser()).toEqual(user);
    });

    it('должен возвращать null при отсутствии пользователя', () => {
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('должен возвращать true при наличии токена', () => {
      localStorage.setItem(STORAGE_KEYS.TOKEN, 'token');
      expect(isAuthenticated()).toBe(true);
    });

    it('должен возвращать false при отсутствии токена', () => {
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('должен возвращать токен из localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.TOKEN, 'my-token');
      expect(getToken()).toBe('my-token');
    });

    it('должен возвращать null при отсутствии токена', () => {
      expect(getToken()).toBeNull();
    });
  });

  describe('clearEditorDrafts', () => {
    it('должен удалять черновики для конкретного пользователя', () => {
      localStorage.setItem('currentTab_123', 'data');
      localStorage.setItem('currentTabData', 'data');
      
      clearEditorDrafts(123);
      
      expect(localStorage.getItem('currentTab_123')).toBeNull();
      expect(localStorage.getItem('currentTabData')).toBeNull();
    });

    it('должен удалять только общий черновик без ID пользователя', () => {
      localStorage.setItem('currentTabData', 'data');
      
      clearEditorDrafts();
      
      expect(localStorage.getItem('currentTabData')).toBeNull();
    });
  });

  describe('clearEditorState', () => {
    it('должен быть псевдонимом для clearEditorDrafts', () => {
      expect(clearEditorState).toBe(clearEditorDrafts);
    });
  });
});