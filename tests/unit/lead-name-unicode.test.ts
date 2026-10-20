import { describe, expect, it } from 'vitest';
import { leadFormSchema } from '../../src/lib/validation/lead';
const nameSchema = leadFormSchema.shape.name;
describe('name NFC and PostgreSQL character length agreement', () => {
  it('rejects one astral character', () => {
    expect(nameSchema.safeParse('😀').success).toBe(false);
  });
  it('accepts 120 astral code points without counting UTF-16 units twice', () => {
    expect(nameSchema.parse('😀'.repeat(120))).toBe('😀'.repeat(120));
  });
  it('normalizes before enforcing the character maximum', () => {
    expect(nameSchema.parse('e\u0301'.repeat(120))).toBe('é'.repeat(120));
  });
  it('rejects 121 characters after normalization', () => {
    expect(nameSchema.safeParse('א'.repeat(121)).success).toBe(false);
  });
  it('normalizes trim and retains the two-character minimum', () => {
    expect(nameSchema.parse(' e\u0301x ')).toBe('éx');
    expect(nameSchema.safeParse('e\u0301').success).toBe(false);
  });
});
