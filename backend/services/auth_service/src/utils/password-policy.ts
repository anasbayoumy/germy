import { logger } from './logger';
import { securityLoggingService } from '../services/security-logging.service';

/**
 * Enhanced password policy service
 */
export class PasswordPolicyService {
  // Common weak passwords that should be rejected
  private static readonly COMMON_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
    'qwerty123', 'dragon', 'master', 'hello', 'freedom', 'whatever',
    'qazwsx', 'trustno1', '654321', 'jordan23', 'harley', 'password1',
    'shadow', 'superman', 'qwertyuiop', 'michael', 'football', 'jesus',
    'ninja', 'mustang', 'password1', '123123', 'adobe123', 'admin123',
    'root', 'toor', 'pass', 'test', 'guest', 'user', 'login', 'welcome123'
  ];

  // Password strength requirements
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;
  private static readonly REQUIRE_UPPERCASE = true;
  private static readonly REQUIRE_LOWERCASE = true;
  private static readonly REQUIRE_NUMBERS = true;
  private static readonly REQUIRE_SPECIAL_CHARS = true;
  private static readonly MAX_CONSECUTIVE_CHARS = 3;
  private static readonly MAX_REPEATED_CHARS = 2;

  /**
   * Validate password against enhanced policy
   */
  static validatePassword(password: string): {
    isValid: boolean;
    score: number;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Check if password exists
    if (!password || typeof password !== 'string') {
      return {
        isValid: false,
        score: 0,
        errors: ['Password is required'],
        suggestions: ['Please provide a password'],
      };
    }

    // Check length
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
      suggestions.push(`Add ${this.MIN_LENGTH - password.length} more characters`);
    } else if (password.length > this.MAX_LENGTH) {
      errors.push(`Password must be no more than ${this.MAX_LENGTH} characters long`);
      suggestions.push('Use a shorter password');
    } else {
      score += 20; // Length score
    }

    // Check for common passwords
    if (this.COMMON_PASSWORDS.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
      suggestions.push('Use a unique password that is not commonly used');
    } else {
      score += 15; // Uniqueness score
    }

    // Check character requirements
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (this.REQUIRE_UPPERCASE && !hasUppercase) {
      errors.push('Password must contain at least one uppercase letter');
      suggestions.push('Add an uppercase letter (A-Z)');
    } else if (hasUppercase) {
      score += 10;
    }

    if (this.REQUIRE_LOWERCASE && !hasLowercase) {
      errors.push('Password must contain at least one lowercase letter');
      suggestions.push('Add a lowercase letter (a-z)');
    } else if (hasLowercase) {
      score += 10;
    }

    if (this.REQUIRE_NUMBERS && !hasNumbers) {
      errors.push('Password must contain at least one number');
      suggestions.push('Add a number (0-9)');
    } else if (hasNumbers) {
      score += 10;
    }

    if (this.REQUIRE_SPECIAL_CHARS && !hasSpecialChars) {
      errors.push('Password must contain at least one special character');
      suggestions.push('Add a special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    } else if (hasSpecialChars) {
      score += 15;
    }

    // Check for consecutive characters
    if (this.hasConsecutiveCharacters(password)) {
      errors.push(`Password cannot contain more than ${this.MAX_CONSECUTIVE_CHARS} consecutive characters`);
      suggestions.push('Avoid sequences like "abc" or "123"');
    } else {
      score += 10;
    }

    // Check for repeated characters
    if (this.hasRepeatedCharacters(password)) {
      errors.push(`Password cannot contain more than ${this.MAX_REPEATED_CHARS} repeated characters`);
      suggestions.push('Avoid repeated characters like "aaa" or "111"');
    } else {
      score += 10;
    }

    // Check for keyboard patterns
    if (this.hasKeyboardPatterns(password)) {
      errors.push('Password contains common keyboard patterns');
      suggestions.push('Avoid patterns like "qwerty" or "asdf"');
    } else {
      score += 10;
    }

    // Check for personal information patterns
    if (this.hasPersonalInfoPatterns(password)) {
      errors.push('Password appears to contain personal information');
      suggestions.push('Avoid using names, dates, or personal information');
    } else {
      score += 10;
    }

    // Calculate final score and determine validity
    const isValid = errors.length === 0;
    const finalScore = Math.min(score, 100);

    // Add general suggestions if password is weak
    if (finalScore < 60) {
      suggestions.push('Consider using a passphrase with multiple words');
      suggestions.push('Mix different types of characters for better security');
    }

    return {
      isValid,
      score: finalScore,
      errors,
      suggestions,
    };
  }

  /**
   * Check for consecutive characters
   */
  private static hasConsecutiveCharacters(password: string): boolean {
    for (let i = 0; i < password.length - this.MAX_CONSECUTIVE_CHARS; i++) {
      const sequence = password.substring(i, i + this.MAX_CONSECUTIVE_CHARS + 1);
      if (this.isConsecutive(sequence)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a sequence is consecutive
   */
  private static isConsecutive(sequence: string): boolean {
    const chars = sequence.split('');
    for (let i = 1; i < chars.length; i++) {
      const prev = chars[i - 1].charCodeAt(0);
      const curr = chars[i].charCodeAt(0);
      if (curr !== prev + 1) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check for repeated characters
   */
  private static hasRepeatedCharacters(password: string): boolean {
    for (let i = 0; i < password.length - this.MAX_REPEATED_CHARS; i++) {
      const char = password[i];
      let count = 1;
      for (let j = i + 1; j < password.length; j++) {
        if (password[j] === char) {
          count++;
          if (count > this.MAX_REPEATED_CHARS) {
            return true;
          }
        } else {
          break;
        }
      }
    }
    return false;
  }

  /**
   * Check for keyboard patterns
   */
  private static hasKeyboardPatterns(password: string): boolean {
    const keyboardPatterns = [
      'qwerty', 'asdf', 'zxcv', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
      '123456789', 'abcdefghij', 'qwertyuiopasdfghjklzxcvbnm'
    ];

    const lowerPassword = password.toLowerCase();
    return keyboardPatterns.some(pattern => lowerPassword.includes(pattern));
  }

  /**
   * Check for personal information patterns
   */
  private static hasPersonalInfoPatterns(password: string): boolean {
    // Common personal info patterns
    const personalPatterns = [
      /(19|20)\d{2}/, // Years 1900-2099
      /(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/, // MM/DD or DD/MM
      /(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /(admin|administrator|root|user|guest|test)/i,
    ];

    return personalPatterns.some(pattern => pattern.test(password));
  }

  /**
   * Generate password strength feedback
   */
  static getPasswordStrength(password: string): {
    strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
    color: string;
    message: string;
  } {
    const validation = this.validatePassword(password);
    const score = validation.score;

    if (score < 20) {
      return {
        strength: 'very-weak',
        color: '#dc2626', // red
        message: 'Very weak password',
      };
    } else if (score < 40) {
      return {
        strength: 'weak',
        color: '#ea580c', // orange
        message: 'Weak password',
      };
    } else if (score < 60) {
      return {
        strength: 'fair',
        color: '#d97706', // amber
        message: 'Fair password',
      };
    } else if (score < 80) {
      return {
        strength: 'good',
        color: '#16a34a', // green
        message: 'Good password',
      };
    } else if (score < 95) {
      return {
        strength: 'strong',
        color: '#059669', // emerald
        message: 'Strong password',
      };
    } else {
      return {
        strength: 'very-strong',
        color: '#047857', // emerald-700
        message: 'Very strong password',
      };
    }
  }

  /**
   * Generate secure password suggestions
   */
  static generatePasswordSuggestions(): string[] {
    return [
      'Use a mix of uppercase and lowercase letters',
      'Include numbers and special characters',
      'Make it at least 12 characters long',
      'Avoid common words and patterns',
      'Consider using a passphrase with multiple words',
      'Don\'t use personal information like names or dates',
      'Use unique passwords for different accounts',
      'Consider using a password manager',
    ];
  }

  /**
   * Check if password meets minimum requirements for registration
   */
  static meetsMinimumRequirements(password: string): boolean {
    const validation = this.validatePassword(password);
    return validation.isValid;
  }

  /**
   * Log password policy violations for security monitoring
   */
  static async logPasswordViolation(
    email: string,
    violation: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Log to security service
    await securityLoggingService.logPasswordPolicyViolation(email, violation, ipAddress, userAgent);
    
    logger.warn('Password policy violation detected', {
      email,
      violation,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  }
}
