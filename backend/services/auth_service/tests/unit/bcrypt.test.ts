import { hashPassword, comparePassword, validatePasswordStrength } from '../../src/utils/bcrypt';

describe('Bcrypt Utility Unit Tests', () => {
  const testPassword = 'TestPassword123!';
  const weakPassword = '123';
  const strongPassword = 'StrongPassword123!@#';

  describe('hashPassword', () => {
    test('should hash password successfully', async () => {
      const hashedPassword = await hashPassword(testPassword);
      
      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(testPassword);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
    });

    test('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty password', async () => {
      const hashedPassword = await hashPassword('');
      
      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
    });

    test('should handle special characters', async () => {
      const specialPassword = 'P@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hashedPassword = await hashPassword(specialPassword);
      
      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
    });

    test('should handle unicode characters', async () => {
      const unicodePassword = 'Pássw0rd测试';
      const hashedPassword = await hashPassword(unicodePassword);
      
      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
    });
  });

  describe('comparePassword', () => {
    test('should return true for correct password', async () => {
      const hashedPassword = await hashPassword(testPassword);
      const isMatch = await comparePassword(testPassword, hashedPassword);
      
      expect(isMatch).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const hashedPassword = await hashPassword(testPassword);
      const isMatch = await comparePassword('wrongpassword', hashedPassword);
      
      expect(isMatch).toBe(false);
    });

    test('should return false for empty password', async () => {
      const hashedPassword = await hashPassword(testPassword);
      const isMatch = await comparePassword('', hashedPassword);
      
      expect(isMatch).toBe(false);
    });

    test('should throw error for null password', async () => {
      const hashedPassword = await hashPassword(testPassword);
      
      await expect(comparePassword(null as any, hashedPassword)).rejects.toThrow();
    });

    test('should handle case sensitivity', async () => {
      const hashedPassword = await hashPassword(testPassword);
      const isMatch = await comparePassword(testPassword.toLowerCase(), hashedPassword);
      
      expect(isMatch).toBe(false);
    });

    test('should handle whitespace sensitivity', async () => {
      const hashedPassword = await hashPassword(testPassword);
      const isMatch = await comparePassword(` ${testPassword} `, hashedPassword);
      
      expect(isMatch).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    test('should return true for strong password', () => {
      const result = validatePasswordStrength(strongPassword);
      expect(result.valid).toBe(true);
    });

    test('should return false for weak password', () => {
      const result = validatePasswordStrength(weakPassword);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });

    test('should return false for password without uppercase', () => {
      const password = 'password123!';
      const result = validatePasswordStrength(password);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('uppercase letter');
    });

    test('should return false for password without lowercase', () => {
      const password = 'PASSWORD123!';
      const result = validatePasswordStrength(password);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('lowercase letter');
    });

    test('should return false for password without numbers', () => {
      const password = 'Password!';
      const result = validatePasswordStrength(password);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('number');
    });

    test('should return true for password without special characters (not required)', () => {
      const password = 'Password123';
      const result = validatePasswordStrength(password);
      expect(result.valid).toBe(true);
    });

    test('should return false for password too short', () => {
      const password = 'Pa1!';
      const result = validatePasswordStrength(password);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });

    test('should return false for empty password', () => {
      const result = validatePasswordStrength('');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });

    test('should handle null password gracefully', () => {
      expect(() => validatePasswordStrength(null as any)).toThrow();
    });

    test('should accept password with minimum length', () => {
      const password = 'Password123'; // 12 characters, meets all requirements
      const result = validatePasswordStrength(password);
      expect(result.valid).toBe(true);
    });

    test('should accept password with various special characters', () => {
      const passwords = [
        'Password123!',
        'Password123@',
        'Password123#',
        'Password123$',
        'Password123%',
        'Password123^',
        'Password123&',
        'Password123*',
        'Password123(',
        'Password123)',
        'Password123-',
        'Password123_',
        'Password123+',
        'Password123=',
        'Password123[',
        'Password123]',
        'Password123{',
        'Password123}',
        'Password123|',
        'Password123\\',
        'Password123:',
        'Password123;',
        'Password123"',
        'Password123\'',
        'Password123<',
        'Password123>',
        'Password123,',
        'Password123.',
        'Password123?',
        'Password123/'
      ];

      passwords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Integration Tests', () => {
    test('should hash and verify password correctly', async () => {
      const hashedPassword = await hashPassword(testPassword);
      const isMatch = await comparePassword(testPassword, hashedPassword);
      
      expect(isMatch).toBe(true);
    });

    test('should work with validated strong password', async () => {
      const result = validatePasswordStrength(strongPassword);
      expect(result.valid).toBe(true);
      
      const hashedPassword = await hashPassword(strongPassword);
      const isMatch = await comparePassword(strongPassword, hashedPassword);
      
      expect(isMatch).toBe(true);
    });

    test('should reject weak password in validation but still hash it', async () => {
      const result = validatePasswordStrength(weakPassword);
      expect(result.valid).toBe(false);
      
      // Even weak passwords can be hashed (validation is separate concern)
      const hashedPassword = await hashPassword(weakPassword);
      expect(hashedPassword).toBeDefined();
      
      const isMatch = await comparePassword(weakPassword, hashedPassword);
      expect(isMatch).toBe(true);
    });
  });
});
