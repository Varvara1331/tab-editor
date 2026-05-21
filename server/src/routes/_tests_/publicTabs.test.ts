import request from 'supertest';
import express from 'express';
import publicTabsRoutes from '../publicTabs';
import { TabModel } from '../../models/Tab';
import { LibraryModel } from '../../models/Library';

jest.mock('../../models/Tab');
jest.mock('../../models/Library');
jest.mock('../../middleware/auth', () => ({
  protect: (req: any, _res: any, next: any) => {
    req.user = { id: 1, username: 'testuser' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/public-tabs', publicTabsRoutes);

describe('Public Tabs Routes', () => {
  const mockPublicTab = {
    id: 1,
    userId: 2,
    title: 'Public Song',
    artist: 'Public Artist',
    isPublic: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/public-tabs', () => {
    it('should return public tabs with pagination', async () => {
      (TabModel.findPublicTabs as jest.Mock).mockResolvedValue([mockPublicTab]);
      (LibraryModel.findByUserId as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/public-tabs?limit=10&offset=0&search=rock');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toEqual({
        limit: 10,
        offset: 0,
        total: 1,
      });
    });

    it('should use default pagination values', async () => {
      (TabModel.findPublicTabs as jest.Mock).mockResolvedValue([mockPublicTab]);
      (LibraryModel.findByUserId as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/public-tabs');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(50);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('should handle server error', async () => {
      (TabModel.findPublicTabs as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/public-tabs');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при получении публикаций');
    });
  });

  describe('GET /api/public-tabs/:id', () => {
    it('should return public tab by id', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(mockPublicTab);
      (TabModel.incrementViews as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).get('/api/public-tabs/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPublicTab);
    });

    it('should return 404 if tab not found', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/public-tabs/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена');
    });

    it('should return 403 if tab is not public', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue({ ...mockPublicTab, isPublic: false });

      const response = await request(app).get('/api/public-tabs/1');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Эта табулатура не является публичной');
    });

    it('should handle server error', async () => {
      (TabModel.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/public-tabs/1');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Ошибка сервера при получении табулатуры');
    });
  });

  describe('POST /api/public-tabs/:id/library', () => {
    it('should add tab to library', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(mockPublicTab);
      (LibraryModel.checkExists as jest.Mock).mockResolvedValue(false);
      (LibraryModel.addFromPublication as jest.Mock).mockResolvedValue({ id: 1 });

      const response = await request(app).post('/api/public-tabs/1/library');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Табулатура добавлена в библиотеку');
    });

    it('should return 404 if tab not found', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).post('/api/public-tabs/999/library');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена');
    });

    it('should return 403 if tab is not public', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue({ ...mockPublicTab, isPublic: false });

      const response = await request(app).post('/api/public-tabs/1/library');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Эта табулатура не является публичной');
    });

    it('should return 400 if tab already in library', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(mockPublicTab);
      (LibraryModel.checkExists as jest.Mock).mockResolvedValue(true);

      const response = await request(app).post('/api/public-tabs/1/library');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Табулатура уже добавлена в библиотеку');
    });

    it('should handle server error', async () => {
      (TabModel.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).post('/api/public-tabs/1/library');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Ошибка сервера при добавлении в библиотеку');
    });
  });

  describe('DELETE /api/public-tabs/:id/library', () => {
    it('should remove tab from library', async () => {
      (LibraryModel.removeFromLibrary as jest.Mock).mockResolvedValue(true);

      const response = await request(app).delete('/api/public-tabs/1/library');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Табулатура удалена из библиотеки');
    });

    it('should return 404 if tab not in library', async () => {
      (LibraryModel.removeFromLibrary as jest.Mock).mockResolvedValue(false);

      const response = await request(app).delete('/api/public-tabs/999/library');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена в библиотеке');
    });

    it('should handle server error', async () => {
      (LibraryModel.removeFromLibrary as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).delete('/api/public-tabs/1/library');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Ошибка сервера при удалении из библиотеки');
    });
  });

  describe('GET /api/public-tabs/:id/library/check', () => {
    it('should return true if tab in library', async () => {
      (LibraryModel.checkExists as jest.Mock).mockResolvedValue(true);

      const response = await request(app).get('/api/public-tabs/1/library/check');

      expect(response.status).toBe(200);
      expect(response.body.data.exists).toBe(true);
    });

    it('should return false if tab not in library', async () => {
      (LibraryModel.checkExists as jest.Mock).mockResolvedValue(false);

      const response = await request(app).get('/api/public-tabs/1/library/check');

      expect(response.status).toBe(200);
      expect(response.body.data.exists).toBe(false);
    });

    it('should handle server error', async () => {
      (LibraryModel.checkExists as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/public-tabs/1/library/check');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Ошибка сервера при проверке');
    });
  });

  describe('GET /api/public-tabs/:id/download', () => {
    it('should download public tab', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(mockPublicTab);

      const response = await request(app).get('/api/public-tabs/1/download');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPublicTab);
    });

    it('should return 404 if tab not found', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/public-tabs/999/download');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена');
    });

    it('should return 404 if tab is not public', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue({ ...mockPublicTab, isPublic: false });

      const response = await request(app).get('/api/public-tabs/1/download');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена');
    });

    it('should handle server error', async () => {
      (TabModel.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/public-tabs/1/download');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Ошибка сервера при скачивании');
    });
  });
});