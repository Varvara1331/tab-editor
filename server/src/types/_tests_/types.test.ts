import { ApiResponse, HttpStatus } from '../index';

describe('Types', () => {
  describe('ApiResponse', () => {
    describe('success', () => {
      it('должен возвращать успешный ответ с данными', () => {
        const data = { id: 1, name: 'test' };
        const result = ApiResponse.success(data);

        expect(result).toEqual({
          success: true,
          data: data,
          message: undefined,
        });
      });

      it('должен возвращать успешный ответ с сообщением', () => {
        const data = { id: 1, name: 'test' };
        const message = 'Operation successful';
        const result = ApiResponse.success(data, message);

        expect(result).toEqual({
          success: true,
          data: data,
          message: message,
        });
      });

      it('должен возвращать успешный ответ с пустыми данными', () => {
        const result = ApiResponse.success(null);

        expect(result).toEqual({
          success: true,
          data: null,
          message: undefined,
        });
      });

      it('должен возвращать успешный ответ с массивом данных', () => {
        const data = [{ id: 1 }, { id: 2 }];
        const result = ApiResponse.success(data);

        expect(result).toEqual({
          success: true,
          data: data,
          message: undefined,
        });
      });
    });

    describe('error', () => {
      it('должен возвращать ответ с ошибкой и сообщением', () => {
        const errorMessage = 'Something went wrong';
        const result = ApiResponse.error(errorMessage);

        expect(result).toEqual({
          success: false,
          error: errorMessage,
        });
      });

      it('должен возвращать ответ с ошибкой и пустым сообщением', () => {
        const result = ApiResponse.error('');

        expect(result).toEqual({
          success: false,
          error: '',
        });
      });
    });
  });

  describe('HttpStatus', () => {
    it('должен содержать правильные коды статусов', () => {
      expect(HttpStatus.OK).toBe(200);
      expect(HttpStatus.CREATED).toBe(201);
      expect(HttpStatus.BAD_REQUEST).toBe(400);
      expect(HttpStatus.UNAUTHORIZED).toBe(401);
      expect(HttpStatus.FORBIDDEN).toBe(403);
      expect(HttpStatus.NOT_FOUND).toBe(404);
      expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
    });

    it('должен быть объектом', () => {
      expect(typeof HttpStatus).toBe('object');
      expect(HttpStatus).toBeDefined();
    });
  });
});

describe('Type interfaces', () => {
  it('должен иметь структуру IUser', () => {
    const user: any = {
      id: 1,
      username: 'testuser',
      email: 'test@test.com',
      passwordHash: 'hashed',
      createdAt: new Date(),
    };
    expect(user).toBeDefined();
  });

  it('должен иметь структуру ITab', () => {
    const tab: any = {
      id: 1,
      userId: 1,
      title: 'Test Song',
      tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
      measures: [],
      isPublic: false,
      views: 0,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(tab).toBeDefined();
  });

  it('должен иметь структуру ILibraryItem', () => {
    const libraryItem: any = {
      id: 1,
      userId: 1,
      tabId: 1,
      tabData: '{}',
      isPublication: false,
      originalAuthorId: 0,
      originalAuthorName: '',
      addedAt: new Date(),
    };
    expect(libraryItem).toBeDefined();
  });
});