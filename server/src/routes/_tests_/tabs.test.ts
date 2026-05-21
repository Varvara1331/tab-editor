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
    it('should return favorites', async () => {
      (LibraryModel.getFavoritesByUserId as jest.Mock).mockResolvedValue([mockTab]);

      const response = await request(app).get('/api/tabs/favorites');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should handle server error', async () => {
      (LibraryModel.getFavoritesByUserId as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/tabs/favorites');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при получении избранного');
    });
  });

  describe('GET /api/tabs', () => {
    it('should return user tabs', async () => {
      (TabModel.findByUserId as jest.Mock).mockResolvedValue([mockTab]);

      const response = await request(app).get('/api/tabs');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should handle server error', async () => {
      (TabModel.findByUserId as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/tabs');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при получении табулатур');
    });
  });

  describe('GET /api/tabs/:id', () => {
    it('should return own tab by id', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(mockTab);

      const response = await request(app).get('/api/tabs/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTab);
    });

    it('should return public tab for other user', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(mockPublicTab);

      const response = await request(app).get('/api/tabs/2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 if tab not found', async () => {
      (TabModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/tabs/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена');
    });

    it('should return 403 if user has no access to private tab', async () => {
      const privateTab = { ...mockTab, userId: 2, isPublic: false };
      (TabModel.findById as jest.Mock).mockResolvedValue(privateTab);

      const response = await request(app).get('/api/tabs/2');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Нет доступа к этой табулатуре');
    });

    it('should handle server error', async () => {
      (TabModel.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/tabs/1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при получении табулатуры');
    });
  });

  describe('POST /api/tabs', () => {
    it('should create new tab', async () => {
      (TabModel.create as jest.Mock).mockResolvedValue(mockTab);

      const response = await request(app)
        .post('/api/tabs')
        .send({ title: 'Test Song', artist: 'Test Artist' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTab);
    });

    it('should handle server error', async () => {
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
    it('should update tab', async () => {
      (TabModel.update as jest.Mock).mockResolvedValue({ ...mockTab, title: 'Updated' });

      const response = await request(app)
        .put('/api/tabs/1')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated');
    });

    it('should return 404 if tab not found', async () => {
      (TabModel.update as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/tabs/999')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена');
    });

    it('should handle server error', async () => {
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
    it('should delete tab', async () => {
      (TabModel.delete as jest.Mock).mockResolvedValue(true);

      const response = await request(app).delete('/api/tabs/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Табулатура успешно удалена');
    });

    it('should return 404 if tab not found', async () => {
      (TabModel.delete as jest.Mock).mockResolvedValue(false);

      const response = await request(app).delete('/api/tabs/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Табулатура не найдена');
    });

    it('should handle server error', async () => {
      (TabModel.delete as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).delete('/api/tabs/1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при удалении табулатуры');
    });
  });
});