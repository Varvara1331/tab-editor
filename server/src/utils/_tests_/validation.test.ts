import { validators, validationMessages, validateWithMessage } from '../validation';

describe('Validation Utils', () => {
  describe('validators', () => {
    describe('email', () => {
      it('должен возвращать true для валидного email', () => {
        expect(validators.email('test@example.com')).toBe(true);
        expect(validators.email('user.name@domain.co.uk')).toBe(true);
      });

      it('должен возвращать false для невалидного email', () => {
        expect(validators.email('invalid')).toBe(false);
        expect(validators.email('test@')).toBe(false);
        expect(validators.email('@example.com')).toBe(false);
        expect(validators.email('test@example')).toBe(false);
      });
    });

    describe('password', () => {
      it('должен возвращать true для пароля длиной 6 и более символов', () => {
        expect(validators.password('123456')).toBe(true);
        expect(validators.password('longpassword')).toBe(true);
      });

      it('должен возвращать false для короткого пароля', () => {
        expect(validators.password('12345')).toBe(false);
        expect(validators.password('')).toBe(false);
      });
    });

    describe('username', () => {
      it('должен возвращать true для имени пользователя от 3 до 50 символов', () => {
        expect(validators.username('abc')).toBe(true);
        expect(validators.username('valid_username')).toBe(true);
        expect(validators.username('a'.repeat(50))).toBe(true);
      });

      it('должен возвращать false для слишком короткого или длинного имени', () => {
        expect(validators.username('ab')).toBe(false);
        expect(validators.username('a'.repeat(51))).toBe(false);
      });
    });

    describe('title', () => {
      it('должен возвращать true для заголовка от 1 до 200 символов', () => {
        expect(validators.title('My Song')).toBe(true);
        expect(validators.title('a')).toBe(true);
        expect(validators.title('a'.repeat(200))).toBe(true);
      });

      it('должен возвращать false для пустого заголовка', () => {
        expect(validators.title('')).toBe(false);
      });
    });
  });

  describe('validationMessages', () => {
    it('должен содержать сообщения для всех валидаторов', () => {
      expect(validationMessages.email).toBe('Неверный формат email');
      expect(validationMessages.password).toBe('Пароль должен содержать минимум 6 символов');
      expect(validationMessages.username).toBe('Имя пользователя должно содержать от 3 до 50 символов');
      expect(validationMessages.title).toBe('Название должно содержать от 1 до 200 символов');
    });
  });

  describe('validateWithMessage', () => {
    it('должен возвращать isValid true для валидного email', () => {
      const result = validateWithMessage('test@example.com', 'email');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('должен возвращать isValid false с ошибкой для невалидного email', () => {
      const result = validateWithMessage('invalid', 'email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Неверный формат email');
    });

    it('должен возвращать isValid false с ошибкой для короткого пароля', () => {
      const result = validateWithMessage('12345', 'password');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Пароль должен содержать минимум 6 символов');
    });

    it('должен возвращать isValid false с ошибкой для короткого имени пользователя', () => {
      const result = validateWithMessage('ab', 'username');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Имя пользователя должно содержать от 3 до 50 символов');
    });

    it('должен возвращать isValid false с ошибкой для пустого заголовка', () => {
      const result = validateWithMessage('', 'title');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Название должно содержать от 1 до 200 символов');
    });
  });
});