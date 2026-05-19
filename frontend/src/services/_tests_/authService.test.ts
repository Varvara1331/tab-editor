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
    it('should register user successfully', async () => {
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

    it('should handle registration error', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));
      const result = await register('test', 'test@test.com', 'password');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
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
    it('should clear session and drafts', () => {
      localStorage.setItem(STORAGE_KEYS.TOKEN, 'token');
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ id: 1, username: 'test' }));
      
      logout();
      
      expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from localStorage', () => {
      const user = { id: 1, username: 'test', email: 'test@test.com', createdAt: '2024-01-01' };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      
      expect(getCurrentUser()).toEqual(user);
    });

    it('should return null if no user', () => {
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if token exists', () => {
      localStorage.setItem(STORAGE_KEYS.TOKEN, 'token');
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false if no token', () => {
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.TOKEN, 'my-token');
      expect(getToken()).toBe('my-token');
    });

    it('should return null if no token', () => {
      expect(getToken()).toBeNull();
    });
  });

  describe('clearEditorDrafts', () => {
    it('should clear drafts for specific user', () => {
      localStorage.setItem('currentTab_123', 'data');
      localStorage.setItem('currentTabData', 'data');
      
      clearEditorDrafts(123);
      
      expect(localStorage.getItem('currentTab_123')).toBeNull();
      expect(localStorage.getItem('currentTabData')).toBeNull();
    });

    it('should clear only general draft without userId', () => {
      localStorage.setItem('currentTabData', 'data');
      
      clearEditorDrafts();
      
      expect(localStorage.getItem('currentTabData')).toBeNull();
    });
  });

  describe('clearEditorState', () => {
    it('should be alias for clearEditorDrafts', () => {
      expect(clearEditorState).toBe(clearEditorDrafts);
    });
  });
});