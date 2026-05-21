// Мок для базы данных
const mockDb = {
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  exec: jest.fn(),
};

jest.mock('../database', () => ({
  initDatabase: jest.fn().mockResolvedValue(undefined),
  db: mockDb,
}));

// Подавление логов во время тестов
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

// Экспорт мока для использования в тестах
export { mockDb };