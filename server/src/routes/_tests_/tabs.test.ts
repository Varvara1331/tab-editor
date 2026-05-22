import request from 'supertest';
import express from 'express';
import tabsRoutes from '../tabs';
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
app.use('/api/tabs', tabsRoutes);

describe('Tabs Routes', () => {
  const mockTab = {
    id: 1,
    userId: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    isPublic: false,
  };

  const mockPublicTab = {
    ...mockTab,
    isPublic: true,
    userId: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tabs/favorites', () => {
    it('должен возвращать список избранных табулатур', async () => {
      (LibraryModel.getFavoritesByUserId as jest.Mock).mockResolvedValue([mockTab]);

      const response = await request(app).get('/api/tabs/favorites');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('должен обрабатывать ошибку сервера', async () => {
      (LibraryModel.getFavoritesByUserId as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/tabs/favorites');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при получении избранного');
    });
  });

  describe('GET /api/tabs', () => {
    it('должен возвращать табулатуры текущего пользователя', async () => {
      (TabModel.findByUserId as jest.Mock).mockResolvedValue([mockTab]);

      const response = await request(app).get('/api/tabs');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('должен обрабатывать ошибку сервера', async () => {
      (TabModel.findByUserId as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/tabs');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при получении табулатур');
    });
  });

  describe('GET /api/tabs/:id', () => {
    it('должен возвращать свою табулатуру по ID', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(mockTab);

      const response = await request(app).get('/api/tabs/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTab);
    });

    it('должен возвращать публичную табулатуру другого пользователя', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(mockPublicTab);

      const response = await request(app).get('/api/tabs/2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('должен возвращать 404 если табулатура не найдена', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/tabs/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена');
    });

    it('должен возвращать 403 если нет доступа к приватной табулатуре', async () => {
      const privateTab = { ...mockTab, userId: 2, isPublic: false };
      (TabModel.findById as jest.Mock).mockResolvedValue(privateTab);

      const response = await request(app).get('/api/tabs/2');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Нет доступа к этой табулатуре');
    });

    it('должен обрабатывать ошибку сервера', async () => {
      (TabModel.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/tabs/1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при получении табулатуры');
    });
  });

  describe('POST /api/tabs', () => {
    it('должен создавать новую табулатуру', async () => {
      (TabModel.create as jest.Mock).mockResolvedValue(mockTab);

      const response = await request(app)
        .post('/api/tabs')
        .send({ title: 'Test Song', artist: 'Test Artist' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTab);
    });

    it('должен обрабатывать ошибку сервера', async () => {
      (TabModel.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .post('/api/tabs')
        .send({ title: 'Test Song' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при создании табулатуры');
    });
  });

  describe('PUT /api/tabs/:id', () => {
    it('должен обновлять табулатуру', async () => {
      (TabModel.update as jest.Mock).mockResolvedValue({ ...mockTab, title: 'Updated' });

      const response = await request(app)
        .put('/api/tabs/1')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated');
    });

    it('должен возвращать 404 если табулатура не найдена', async () => {
      (TabModel.update as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/tabs/999')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена');
    });

    it('должен обрабатывать ошибку сервера', async () => {
      (TabModel.update as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .put('/api/tabs/1')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при обновлении табулатуры');
    });
  });

  describe('DELETE /api/tabs/:id', () => {
    it('должен удалять табулатуру', async () => {
      (TabModel.delete as jest.Mock).mockResolvedValue(true);

      const response = await request(app).delete('/api/tabs/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Табулатура успешно удалена');
    });

    it('должен возвращать 404 если табулатура не найдена', async () => {
      (TabModel.delete as jest.Mock).mockResolvedValue(false);

      const response = await request(app).delete('/api/tabs/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена');
    });

    it('должен обрабатывать ошибку сервера', async () => {
      (TabModel.delete as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).delete('/api/tabs/1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при удалении табулатуры');
    });
  });
});