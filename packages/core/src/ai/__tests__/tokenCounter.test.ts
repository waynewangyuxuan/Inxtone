import { describe, it, expect } from 'vitest';
import { countTokens } from '../tokenCounter.js';

describe('countTokens', () => {
  it('returns 0 for empty string', () => {
    expect(countTokens('')).toBe(0);
  });

  it('returns 0 for null/undefined-like input', () => {
    expect(countTokens(undefined as unknown as string)).toBe(0);
    expect(countTokens(null as unknown as string)).toBe(0);
  });

  it('counts pure English text (word-based)', () => {
    const text = 'Hello world this is a test';
    // 6 words × 1.3 = 7.8 → ceil = 8
    expect(countTokens(text)).toBe(8);
  });

  it('counts pure Chinese text (character-based)', () => {
    const text = '你好世界';
    // 4 chars × 1.5 = 6
    expect(countTokens(text)).toBe(6);
  });

  it('counts mixed Chinese and English text', () => {
    const text = '你好 hello 世界 world';
    // 4 CJK chars × 1.5 = 6
    // 2 English words × 1.3 = 2.6
    // Total = 8.6 → ceil = 9
    expect(countTokens(text)).toBe(9);
  });

  it('handles punctuation and special characters', () => {
    const text = 'Hello, world! How are you?';
    // 5 words (punctuation attached) × 1.3 = 6.5 → ceil = 7
    expect(countTokens(text)).toBe(7);
  });

  it('handles whitespace-only text', () => {
    expect(countTokens('   ')).toBe(0);
  });

  it('handles single word', () => {
    const text = 'hello';
    // 1 word × 1.3 = 1.3 → ceil = 2
    expect(countTokens(text)).toBe(2);
  });

  it('handles single Chinese character', () => {
    const text = '好';
    // 1 char × 1.5 = 1.5 → ceil = 2
    expect(countTokens(text)).toBe(2);
  });

  it('handles long Chinese text', () => {
    const text = '这是一段比较长的中文文本，用来测试我们的分词估算功能';
    const cjkCount = text.replace(/[^\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, '').length;
    const result = countTokens(text);
    // Should be roughly cjkCount * 1.5 (plus a little for punctuation/non-CJK)
    expect(result).toBeGreaterThan(cjkCount);
  });
});
