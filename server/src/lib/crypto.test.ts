import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt } from './crypto';

describe('Crypto Library', () => {
  it('should encrypt and decrypt a string correctly', () => {
    const text = 'secret-erp-key-123';
    const encrypted = encrypt(text);
    
    expect(encrypted).toContain(':');
    
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  it('should generate different IVs for same text', () => {
    const text = 'test';
    const enc1 = encrypt(text);
    const enc2 = encrypt(text);
    
    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(text);
    expect(decrypt(enc2)).toBe(text);
  });
  
  it('should throw error for invalid format', () => {
    expect(() => decrypt('invalidformat')).toThrow('Invalid encrypted text format');
  });
});
