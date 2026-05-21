import { validators, validationMessages, validateWithMessage } from '../validation';

describe('Validation Utils', () => {
  describe('validators', () => {
    describe('email', () => {
      it('should return true for valid email', () => {
        expect(validators.email('test@example.com')).toBe(true);
        expect(validators.email('user.name@domain.co.uk')).toBe(true);
      });

      it('should return false for invalid email', () => {
        expect(validators.email('invalid')).toBe(false);
        expect(validators.email('test@')).toBe(false);
        expect(validators.email('@example.com')).toBe(false);
        expect(validators.email('test@example')).toBe(false);
      });
    });

    describe('password', () => {
      it('should return true for password with 6+ characters', () => {
        expect(validators.password('123456')).toBe(true);
        expect(validators.password('longpassword')).toBe(true);
      });

      it('should return false for short password', () => {
        expect(validators.password('12345')).toBe(false);
        expect(validators.password('')).toBe(false);
      });
    });

    describe('username', () => {
      it('should return true for username between 3 and 50 chars', () => {
        expect(validators.username('abc')).toBe(true);
        expect(validators.username('valid_username')).toBe(true);
        expect(validators.username('a'.repeat(50))).toBe(true);
      });

      it('should return false for username too short or too long', () => {
        expect(validators.username('ab')).toBe(false);
        expect(validators.username('a'.repeat(51))).toBe(false);
      });
    });

    describe('title', () => {
      it('should return true for title between 1 and 200 chars', () => {
        expect(validators.title('My Song')).toBe(true);
        expect(validators.title('a')).toBe(true);
        expect(validators.title('a'.repeat(200))).toBe(true);
      });

      it('should return false for empty title', () => {
        expect(validators.title('')).toBe(false);
      });
    });
  });

  describe('validationMessages', () => {
    it('should have messages for all validators', () => {
      expect(validationMessages.email).toBe('Неверный формат email');
      expect(validationMessages.password).toBe('Пароль должен содержать минимум 6 символов');
      expect(validationMessages.username).toBe('Имя пользователя должно содержать от 3 до 50 символов');
      expect(validationMessages.title).toBe('Название должно содержать от 1 до 200 символов');
    });
  });

  describe('validateWithMessage', () => {
    it('should return isValid true for valid email', () => {
      const result = validateWithMessage('test@example.com', 'email');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return isValid false with error for invalid email', () => {
      const result = validateWithMessage('invalid', 'email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Неверный формат email');
    });

    it('should return isValid false with error for short password', () => {
      const result = validateWithMessage('12345', 'password');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Пароль должен содержать минимум 6 символов');
    });

    it('should return isValid false with error for short username', () => {
      const result = validateWithMessage('ab', 'username');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Имя пользователя должно содержать от 3 до 50 символов');
    });

    it('should return isValid false with error for empty title', () => {
      const result = validateWithMessage('', 'title');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Название должно содержать от 1 до 200 символов');
    });
  });
});