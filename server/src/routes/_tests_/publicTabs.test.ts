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
    it('должен возвращать публичные табулатуры с пагинацией', async () => {
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

    it('должен использовать значения пагинации по умолчанию', async () => {
      (TabModel.findPublicTabs as jest.Mock).mockResolvedValue([mockPublicTab]);
      (LibraryModel.findByUserId as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/public-tabs');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(50);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('должен обрабатывать ошибку сервера', async () => {
      (TabModel.findPublicTabs as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/public-tabs');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при получении публикаций');
    });
  });

  describe('GET /api/public-tabs/:id', () => {
    it('должен возвращать публичную табулатуру по ID', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(mockPublicTab);
      (TabModel.incrementViews as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).get('/api/public-tabs/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPublicTab);
    });

    it('должен возвращать 404 если табулатура не найдена', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/public-tabs/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена');
    });

    it('должен возвращать 403 если табулатура не является публичной', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue({ ...mockPublicTab, isPublic: false });

      const response = await request(app).get('/api/public-tabs/1');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Эта табулатура не является публичной');
    });

    it('должен обрабатывать ошибку сервера', async () => {
      (TabModel.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/public-tabs/1');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Ошибка сервера при получении табулатуры');
    });
  });

  describe('POST /api/public-tabs/:id/library', () => {
    it('должен добавлять табулатуру в библиотеку', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(mockPublicTab);
      (LibraryModel.checkExists as jest.Mock).mockResolvedValue(false);
      (LibraryModel.addFromPublication as jest.Mock).mockResolvedValue({ id: 1 });

      const response = await request(app).post('/api/public-tabs/1/library');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Табулатура добавлена в библиотеку');
    });

    it('должен возвращать 404 если табулатура не найдена', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).post('/api/public-tabs/999/library');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена');
    });

    it('должен возвращать 403 если табулатура не является публичной', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue({ ...mockPublicTab, isPublic: false });

      const response = await request(app).post('/api/public-tabs/1/library');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Эта табулатура не является публичной');
    });

    it('должен возвращать 400 если табулатура уже в библиотеке', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(mockPublicTab);
      (LibraryModel.checkExists as jest.Mock).mockResolvedValue(true);

      const response = await request(app).post('/api/public-tabs/1/library');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Табулатура уже добавлена в библиотеку');
    });

    it('должен обрабатывать ошибку сервера', async () => {
      (TabModel.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).post('/api/public-tabs/1/library');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Ошибка сервера при добавлении в библиотеку');
    });
  });

  describe('DELETE /api/public-tabs/:id/library', () => {
    it('должен удалять табулатуру из библиотеки', async () => {
      (LibraryModel.removeFromLibrary as jest.Mock).mockResolvedValue(true);

      const response = await request(app).delete('/api/public-tabs/1/library');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Табулатура удалена из библиотеки');
    });

    it('должен возвращать 404 если табулатура не в библиотеке', async () => {
      (LibraryModel.removeFromLibrary as jest.Mock).mockResolvedValue(false);

      const response = await request(app).delete('/api/public-tabs/999/library');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена в библиотеке');
    });

    it('должен обрабатывать ошибку сервера', async () => {
      (LibraryModel.removeFromLibrary as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).delete('/api/public-tabs/1/library');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Ошибка сервера при удалении из библиотеки');
    });
  });

  describe('GET /api/public-tabs/:id/library/check', () => {
    it('должен возвращать true если табулатура в библиотеке', async () => {
      (LibraryModel.checkExists as jest.Mock).mockResolvedValue(true);

      const response = await request(app).get('/api/public-tabs/1/library/check');

      expect(response.status).toBe(200);
      expect(response.body.data.exists).toBe(true);
    });

    it('должен возвращать false если табулатура не в библиотеке', async () => {
      (LibraryModel.checkExists as jest.Mock).mockResolvedValue(false);

      const response = await request(app).get('/api/public-tabs/1/library/check');

      expect(response.status).toBe(200);
      expect(response.body.data.exists).toBe(false);
    });

    it('должен обрабатывать ошибку сервера', async () => {
      (LibraryModel.checkExists as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/public-tabs/1/library/check');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Ошибка сервера при проверке');
    });
  });

  describe('GET /api/public-tabs/:id/download', () => {
    it('должен скачивать публичную табулатуру', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(mockPublicTab);

      const response = await request(app).get('/api/public-tabs/1/download');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPublicTab);
    });

    it('должен возвращать 404 если табулатура не найдена', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/public-tabs/999/download');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена');
    });

    it('должен возвращать 404 если табулатура не является публичной', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue({ ...mockPublicTab, isPublic: false });

      const response = await request(app).get('/api/public-tabs/1/download');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена');
    });

    it('должен обрабатывать ошибку сервера', async () => {
      (TabModel.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/public-tabs/1/download');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Ошибка сервера при скачивании');
    });
  });
});