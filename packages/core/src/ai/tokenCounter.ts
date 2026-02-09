/**
 * Token Counter - Estimation-based token counting for MVP
 *
 * Uses heuristic estimation:
 * - Chinese characters: chars × 1.5
 * - English/other words: words × 1.3
 *
 * This avoids pulling in heavy tokenizer libraries.
 * Future enhancement (M4+): use provider-specific tokenizers for precise counting.
 */

// Regex for CJK Unified Ideographs (covers most Chinese characters)
const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g;

/**
 * Estimate token count for a given text.
 *
 * @param text - The text to estimate tokens for
 * @returns Estimated token count
 */
export function countTokens(text: string): number {
  if (!text) return 0;

  // Count CJK characters
  const cjkMatches = text.match(CJK_REGEX);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;

  // Remove CJK chars and count remaining words
  const nonCjkText = text.replace(CJK_REGEX, ' ');
  const words = nonCjkText.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  return Math.ceil(cjkCount * 1.5 + wordCount * 1.3);
}
