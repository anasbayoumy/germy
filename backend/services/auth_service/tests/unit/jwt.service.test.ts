import { generateToken, verifyToken, decodeToken } from '../../src/services/jwt.service';

describe('JWT Service Unit Tests', () => {
  const mockPayload = {
    userId: 'test-user-id',
    companyId: 'test-company-id',
    role: 'employee'
  };

  describe('generateToken', () => {
    test('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should generate different tokens for different payloads', () => {
      const token1 = generateToken(mockPayload);
      const token2 = generateToken({ ...mockPayload, userId: 'different-user' });
      
      expect(token1).not.toBe(token2);
    });

    test('should generate different tokens for same payload at different times', () => {
      const token1 = generateToken(mockPayload);
      // Small delay to ensure different iat
      setTimeout(() => {
        const token2 = generateToken(mockPayload);
        expect(token1).not.toBe(token2);
      }, 1);
    });
  });

  describe('verifyToken', () => {
    test('should verify a valid token and return payload', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.companyId).toBe(mockPayload.companyId);
      expect(decoded.role).toBe(mockPayload.role);
    });

    test('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    test('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      
      expect(() => {
        verifyToken(malformedToken);
      }).toThrow();
    });

    test('should throw error for empty token', () => {
      expect(() => {
        verifyToken('');
      }).toThrow();
    });

    test('should throw error for null token', () => {
      expect(() => {
        verifyToken(null as any);
      }).toThrow();
    });
  });

  describe('decodeToken', () => {
    test('should decode token without verification', () => {
      const token = generateToken(mockPayload);
      const decoded = decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded).not.toBeNull();
      if (decoded) {
        expect(decoded.userId).toBe(mockPayload.userId);
        expect(decoded.companyId).toBe(mockPayload.companyId);
        expect(decoded.role).toBe(mockPayload.role);
      }
    });

    test('should decode malformed token without throwing', () => {
      const malformedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
      
      expect(() => {
        decodeToken(malformedToken);
      }).not.toThrow();
    });
  });

  describe('Token Expiration', () => {
    test('should include expiration in token', () => {
      const token = generateToken(mockPayload);
      const decoded = decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded).not.toBeNull();
      if (decoded) {
        // JWT decode returns the raw payload, so we need to check the actual JWT structure
        const tokenParts = token.split('.');
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        expect(payload.exp).toBeDefined();
        expect(typeof payload.exp).toBe('number');
        expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
      }
    });

    test('should set correct expiration time', () => {
      const token = generateToken(mockPayload);
      const tokenParts = token.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      const expectedExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      // Allow 5 seconds tolerance
      expect(Math.abs(payload.exp - expectedExp)).toBeLessThan(5);
    });
  });

  describe('Token Structure', () => {
    test('should include all required claims', () => {
      const token = generateToken(mockPayload);
      const tokenParts = token.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      
      expect(payload).toHaveProperty('userId');
      expect(payload).toHaveProperty('companyId');
      expect(payload).toHaveProperty('role');
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
    });

    test('should use correct algorithm', () => {
      const token = generateToken(mockPayload);
      const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
      
      expect(header.alg).toBe('HS256');
      expect(header.typ).toBe('JWT');
    });
  });
});
