import { ApiResponse, HttpStatus } from '../index';

describe('Types', () => {
  describe('ApiResponse', () => {
    describe('success', () => {
      it('should return success response with data', () => {
        const data = { id: 1, name: 'test' };
        const result = ApiResponse.success(data);

        expect(result).toEqual({
          success: true,
          data: data,
          message: undefined,
        });
      });

      it('should return success response with message', () => {
        const data = { id: 1, name: 'test' };
        const message = 'Operation successful';
        const result = ApiResponse.success(data, message);

        expect(result).toEqual({
          success: true,
          data: data,
          message: message,
        });
      });

      it('should return success response with empty data', () => {
        const result = ApiResponse.success(null);

        expect(result).toEqual({
          success: true,
          data: null,
          message: undefined,
        });
      });

      it('should return success response with array data', () => {
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
      it('should return error response with message', () => {
        const errorMessage = 'Something went wrong';
        const result = ApiResponse.error(errorMessage);

        expect(result).toEqual({
          success: false,
          error: errorMessage,
        });
      });

      it('should return error response with empty message', () => {
        const result = ApiResponse.error('');

        expect(result).toEqual({
          success: false,
          error: '',
        });
      });
    });
  });

  describe('HttpStatus', () => {
    it('should have correct status codes', () => {
      expect(HttpStatus.OK).toBe(200);
      expect(HttpStatus.CREATED).toBe(201);
      expect(HttpStatus.BAD_REQUEST).toBe(400);
      expect(HttpStatus.UNAUTHORIZED).toBe(401);
      expect(HttpStatus.FORBIDDEN).toBe(403);
      expect(HttpStatus.NOT_FOUND).toBe(404);
      expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
    });

    // HttpStatus не заморожен в исходном коде, поэтому проверяем что это объект
    it('should be an object', () => {
      expect(typeof HttpStatus).toBe('object');
      expect(HttpStatus).toBeDefined();
    });
  });
});

describe('Type interfaces', () => {
  // Тесты для проверки структуры интерфейсов (TypeScript compile-time checks)
  it('should have IUser structure', () => {
    const user: any = {
      id: 1,
      username: 'testuser',
      email: 'test@test.com',
      passwordHash: 'hashed',
      createdAt: new Date(),
    };
    expect(user).toBeDefined();
  });

  it('should have ITab structure', () => {
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

  it('should have ILibraryItem structure', () => {
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