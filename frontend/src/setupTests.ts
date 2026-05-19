// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Настройка Testing Library
configure({ testIdAttribute: 'data-testid' });

// Мок для matchMedia (необходим для компонентов с медиа-запросами)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Мок для localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Мок для AudioContext (необходим для компонента TabPlayer)
const mockAudioContext = {
  close: () => Promise.resolve(),
  resume: () => Promise.resolve(),
  state: 'suspended',
  destination: {},
  currentTime: 0,
};

// Используем any для обхода типов, так как jest доступен глобально
(window as any).AudioContext = function() {
  return mockAudioContext;
};

// Подавление ошибок консоли во время тестов (опционально, для чистоты вывода)
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = () => {};
  console.warn = () => {};
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});