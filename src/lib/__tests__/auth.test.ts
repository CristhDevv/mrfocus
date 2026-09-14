import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../auth';

describe('Auth Utilities', () => {
  it('should hash and verify password correctly', () => {
    const password = 'my_secure_password_123';
    const hash = hashPassword(password);
    expect(hash).toBeDefined();
    expect(hash.length).toBeGreaterThan(20);
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword('wrong_password', hash)).toBe(false);
  });

  it('should generate and verify JWT token payload', () => {
    const user = { id: 'usr_test_1', email: 'test@example.com', name: 'Test User' };
    const token = generateToken(user);
    expect(token).toBeDefined();
    expect(token).toContain('.');

    const verified = verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(user.id);
    expect(verified?.email).toBe(user.email);
    expect(verified?.name).toBe(user.name);
  });

  it('should reject invalid or tampered token', () => {
    const invalidToken = 'invalid.payload.signature';
    expect(verifyToken(invalidToken)).toBeNull();
  });
});
