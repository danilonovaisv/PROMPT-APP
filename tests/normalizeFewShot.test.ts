/* ======================================================
   Unit Tests — normalizeFewShotExamples
   ====================================================== */

import { describe, it, expect } from '@jest/globals';
import { normalizeFewShotExamples, isValidFewShotExample } from '../src/utils/normalizeFewShot';

describe('normalizeFewShotExamples', () => {
  describe('Strict Mode (default)', () => {
    it('should return empty array for non-array inputs', () => {
      expect(normalizeFewShotExamples(undefined)).toEqual([]);
      expect(normalizeFewShotExamples(null)).toEqual([]);
      expect(normalizeFewShotExamples({})).toEqual([]);
      expect(normalizeFewShotExamples("string")).toEqual([]);
      expect(normalizeFewShotExamples(123)).toEqual([]);
    });

    it('should filter out examples with only whitespace', () => {
      const input = [
        { input: "  ", output: "" },
        { input: "\t\n", output: "   " },
      ];
      expect(normalizeFewShotExamples(input)).toEqual([]);
    });

    it('should keep examples with valid input or output', () => {
      const input = [
        { input: "hello", output: "world" },
        { input: "test", output: "" },
        { input: "", output: "response" },
      ];
      const result = normalizeFewShotExamples(input);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ input: "hello", output: "world" });
      expect(result[1]).toEqual({ input: "test", output: "" });
      expect(result[2]).toEqual({ input: "", output: "response" });
    });

    it('should filter out examples with non-string types in strict mode', () => {
      const input = [
        { input: 123, output: "" },
        { input: true, output: "ok" },
        { input: {}, output: [] },
        { input: "valid", output: "ok" },
      ];
      const result = normalizeFewShotExamples(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ input: "valid", output: "ok" });
    });

    it('should handle mixed valid and invalid examples', () => {
      const input = [
        { input: "ok", output: "response" },
        { input: "  ", output: "" },
        { input: 123, output: 456 },
        { input: "", output: "valid" },
        { input: {}, output: [] },
      ];
      const result = normalizeFewShotExamples(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ input: "ok", output: "response" });
      expect(result[1]).toEqual({ input: "", output: "valid" });
    });

    it('should trim whitespace from valid strings', () => {
      const input = [
        { input: "  hello  ", output: "  world  " },
      ];
      const result = normalizeFewShotExamples(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ input: "hello", output: "world" });
    });

    it('should handle undefined/null fields gracefully', () => {
      const input = [
        { input: undefined, output: "ok" },
        { input: "ok", output: null },
        { input: null, output: undefined },
      ];
      const result = normalizeFewShotExamples(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ input: "", output: "ok" });
      expect(result[1]).toEqual({ input: "ok", output: "" });
    });
  });

  describe('Coercion Mode', () => {
    it('should convert numbers to strings when coercePrimitives is true', () => {
      const input = [
        { input: 123, output: "ok" },
        { input: "test", output: 456 },
        { input: 0, output: 0 },
      ];
      const result = normalizeFewShotExamples(input, { coercePrimitives: true });
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ input: "123", output: "ok" });
      expect(result[1]).toEqual({ input: "test", output: "456" });
      expect(result[2]).toEqual({ input: "0", output: "0" });
    });

    it('should convert booleans to strings when coercePrimitives is true', () => {
      const input = [
        { input: true, output: "ok" },
        { input: "test", output: false },
      ];
      const result = normalizeFewShotExamples(input, { coercePrimitives: true });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ input: "true", output: "ok" });
      expect(result[1]).toEqual({ input: "test", output: "false" });
    });

    it('should still filter out objects and arrays even with coercion', () => {
      const input = [
        { input: {}, output: "ok" },
        { input: [], output: "ok" },
        { input: "valid", output: {} },
      ];
      const result = normalizeFewShotExamples(input, { coercePrimitives: true });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ input: "valid", output: "" });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array', () => {
      expect(normalizeFewShotExamples([])).toEqual([]);
    });

    it('should handle examples with extra properties', () => {
      const input = [
        { input: "test", output: "ok", extra: "field", another: 123 },
      ];
      const result = normalizeFewShotExamples(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ input: "test", output: "ok" });
    });

    it('should handle very long strings', () => {
      const longString = "a".repeat(10000);
      const input = [
        { input: longString, output: "ok" },
      ];
      const result = normalizeFewShotExamples(input);
      expect(result).toHaveLength(1);
      expect(result[0].input).toBe(longString);
    });

    it('should handle special characters and unicode', () => {
      const input = [
        { input: "Hello 世界 🌍", output: "Olá 🇧🇷" },
        { input: "Test\n\t\r", output: "Response" },
      ];
      const result = normalizeFewShotExamples(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ input: "Hello 世界 🌍", output: "Olá 🇧🇷" });
      expect(result[1]).toEqual({ input: "Test", output: "Response" });
    });
  });
});

describe('isValidFewShotExample', () => {
  it('should return true for valid examples', () => {
    expect(isValidFewShotExample({ input: "test", output: "ok" })).toBe(true);
    expect(isValidFewShotExample({ input: "test", output: "" })).toBe(true);
    expect(isValidFewShotExample({ input: "", output: "ok" })).toBe(true);
  });

  it('should return false for invalid examples', () => {
    expect(isValidFewShotExample({ input: "", output: "" })).toBe(false);
    expect(isValidFewShotExample({ input: "  ", output: "  " })).toBe(false);
    expect(isValidFewShotExample({ input: 123, output: 456 })).toBe(false);
    expect(isValidFewShotExample(null)).toBe(false);
    expect(isValidFewShotExample(undefined)).toBe(false);
    expect(isValidFewShotExample("string")).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(isValidFewShotExample({})).toBe(false);
    expect(isValidFewShotExample({ input: null, output: null })).toBe(false);
    expect(isValidFewShotExample({ input: undefined, output: undefined })).toBe(false);
  });
});
