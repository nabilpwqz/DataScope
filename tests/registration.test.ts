import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'analyst', 'viewer']).default('analyst'),
  department: z.string().optional(),
});

describe('User Registration & Credential Validation', () => {
  it('should accept valid registration payloads', () => {
    const validData = {
      name: 'Sarah Chen',
      email: 'schen@datascope.enterprise',
      password: 'StrongPassword123!',
      role: 'analyst',
      department: 'Quantitative Analytics',
    };
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('schen@datascope.enterprise');
      expect(result.data.role).toBe('analyst');
    }
  });

  it('should reject passwords shorter than 8 characters', () => {
    const invalidData = {
      name: 'John Doe',
      email: 'jdoe@datascope.enterprise',
      password: 'short',
      role: 'viewer',
    };
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid email formats', () => {
    const invalidEmail = {
      name: 'Alex Rivera',
      email: 'not-an-email',
      password: 'ValidPassword2026!',
      role: 'analyst',
    };
    const result = registerSchema.safeParse(invalidEmail);
    expect(result.success).toBe(false);
  });

  it('should hash passwords deterministically using bcrypt', async () => {
    const rawPassword = 'ProductionSecurePassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2')).toBe(true);

    const matches = await bcrypt.compare(rawPassword, hash);
    expect(matches).toBe(true);

    const nonMatches = await bcrypt.compare('WrongPassword!', hash);
    expect(nonMatches).toBe(false);
  });
});
