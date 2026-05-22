import { Request, Response, NextFunction } from 'express';
import { validate, sanitize } from '../validation';

describe('Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('validate', () => {
    it('должен проходить валидацию для корректных данных', () => {
      req.body = { email: 'test@test.com', password: 'password123' };
      const schema = {
        email: { required: true, validator: 'email' as const },
        password: { required: true, minLength: 6 },
      };

      const middleware = validate(schema);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('должен возвращать ошибку для отсутствующего обязательного поля', () => {
      req.body = { email: 'test@test.com' };
      const schema = {
        email: { required: true },
        password: { required: true },
      };

      const middleware = validate(schema);
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.arrayContaining(['Поле password обязательно']),
        })
      );
    });

    it('должен возвращать ошибку для неверного формата email', () => {
      req.body = { email: 'invalid-email' };
      const schema = {
        email: { required: true, validator: 'email' as const },
      };

      const middleware = validate(schema);
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('должен возвращать ошибку для слишком короткого пароля', () => {
      req.body = { password: '123' };
      const schema = {
        password: { required: true, minLength: 6 },
      };

      const middleware = validate(schema);
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining(['Поле password должно содержать минимум 6 символов']),
        })
      );
    });

    it('должен пропускать валидацию для отсутствующих необязательных полей', () => {
      req.body = { email: 'test@test.com' };
      const schema = {
        email: { required: true },
        optionalField: { required: false, minLength: 3 },
      };

      const middleware = validate(schema);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('sanitize', () => {
    it('должен обрезать пробелы и удалять HTML теги из строк', () => {
      req.body = {
        name: '  <script>alert("xss")</script>John  ',
        age: 25,
      };

      const middleware = sanitize(['name']);
      middleware(req as Request, res as Response, next);

      expect(req.body.name).not.toContain('<');
      expect(req.body.name).not.toContain('>');
      expect(req.body.name.trim()).toBeTruthy();
      expect(req.body.age).toBe(25);
      expect(next).toHaveBeenCalled();
    });

    it('должен очищать все строковые поля если не указаны конкретные', () => {
      req.body = {
        name: '  John  ',
        city: '  New York  ',
        age: 25,
      };

      const middleware = sanitize();
      middleware(req as Request, res as Response, next);

      expect(req.body.name).toBe('John');
      expect(req.body.city).toBe('New York');
      expect(req.body.age).toBe(25);
    });

    it('должен обрезать длинные строки', () => {
      const longString = 'a'.repeat(2000);
      req.body = { text: longString };

      const middleware = sanitize(['text']);
      middleware(req as Request, res as Response, next);

      expect(req.body.text.length).toBeLessThanOrEqual(1000);
    });
  });
});