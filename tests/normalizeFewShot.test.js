"use strict";
/* ======================================================
   Unit Tests — normalizeFewShotExamples
   ====================================================== */
Object.defineProperty(exports, "__esModule", { value: true });
var globals_1 = require("@jest/globals");
var normalizeFewShot_1 = require("../src/utils/normalizeFewShot");
(0, globals_1.describe)('normalizeFewShotExamples', function () {
    (0, globals_1.describe)('Strict Mode (default)', function () {
        (0, globals_1.it)('should return empty array for non-array inputs', function () {
            (0, globals_1.expect)((0, normalizeFewShot_1.normalizeFewShotExamples)(undefined)).toEqual([]);
            (0, globals_1.expect)((0, normalizeFewShot_1.normalizeFewShotExamples)(null)).toEqual([]);
            (0, globals_1.expect)((0, normalizeFewShot_1.normalizeFewShotExamples)({})).toEqual([]);
            (0, globals_1.expect)((0, normalizeFewShot_1.normalizeFewShotExamples)("string")).toEqual([]);
            (0, globals_1.expect)((0, normalizeFewShot_1.normalizeFewShotExamples)(123)).toEqual([]);
        });
        (0, globals_1.it)('should filter out examples with only whitespace', function () {
            var input = [
                { input: "  ", output: "" },
                { input: "\t\n", output: "   " },
            ];
            (0, globals_1.expect)((0, normalizeFewShot_1.normalizeFewShotExamples)(input)).toEqual([]);
        });
        (0, globals_1.it)('should keep examples with valid input or output', function () {
            var input = [
                { input: "hello", output: "world" },
                { input: "test", output: "" },
                { input: "", output: "response" },
            ];
            var result = (0, normalizeFewShot_1.normalizeFewShotExamples)(input);
            (0, globals_1.expect)(result).toHaveLength(3);
            (0, globals_1.expect)(result[0]).toEqual({ input: "hello", output: "world" });
            (0, globals_1.expect)(result[1]).toEqual({ input: "test", output: "" });
            (0, globals_1.expect)(result[2]).toEqual({ input: "", output: "response" });
        });
        (0, globals_1.it)('should filter out examples with non-string types in strict mode', function () {
            var input = [
                { input: 123, output: "" },
                { input: true, output: "ok" },
                { input: {}, output: [] },
                { input: "valid", output: "ok" },
            ];
            var result = (0, normalizeFewShot_1.normalizeFewShotExamples)(input);
            (0, globals_1.expect)(result).toHaveLength(1);
            (0, globals_1.expect)(result[0]).toEqual({ input: "valid", output: "ok" });
        });
        (0, globals_1.it)('should handle mixed valid and invalid examples', function () {
            var input = [
                { input: "ok", output: "response" },
                { input: "  ", output: "" },
                { input: 123, output: 456 },
                { input: "", output: "valid" },
                { input: {}, output: [] },
            ];
            var result = (0, normalizeFewShot_1.normalizeFewShotExamples)(input);
            (0, globals_1.expect)(result).toHaveLength(2);
            (0, globals_1.expect)(result[0]).toEqual({ input: "ok", output: "response" });
            (0, globals_1.expect)(result[1]).toEqual({ input: "", output: "valid" });
        });
        (0, globals_1.it)('should trim whitespace from valid strings', function () {
            var input = [
                { input: "  hello  ", output: "  world  " },
            ];
            var result = (0, normalizeFewShot_1.normalizeFewShotExamples)(input);
            (0, globals_1.expect)(result).toHaveLength(1);
            (0, globals_1.expect)(result[0]).toEqual({ input: "hello", output: "world" });
        });
        (0, globals_1.it)('should handle undefined/null fields gracefully', function () {
            var input = [
                { input: undefined, output: "ok" },
                { input: "ok", output: null },
                { input: null, output: undefined },
            ];
            var result = (0, normalizeFewShot_1.normalizeFewShotExamples)(input);
            (0, globals_1.expect)(result).toHaveLength(2);
            (0, globals_1.expect)(result[0]).toEqual({ input: "", output: "ok" });
            (0, globals_1.expect)(result[1]).toEqual({ input: "ok", output: "" });
        });
    });
    (0, globals_1.describe)('Coercion Mode', function () {
        (0, globals_1.it)('should convert numbers to strings when coercePrimitives is true', function () {
            var input = [
                { input: 123, output: "ok" },
                { input: "test", output: 456 },
                { input: 0, output: 0 },
            ];
            var result = (0, normalizeFewShot_1.normalizeFewShotExamples)(input, { coercePrimitives: true });
            (0, globals_1.expect)(result).toHaveLength(3);
            (0, globals_1.expect)(result[0]).toEqual({ input: "123", output: "ok" });
            (0, globals_1.expect)(result[1]).toEqual({ input: "test", output: "456" });
            (0, globals_1.expect)(result[2]).toEqual({ input: "0", output: "0" });
        });
        (0, globals_1.it)('should convert booleans to strings when coercePrimitives is true', function () {
            var input = [
                { input: true, output: "ok" },
                { input: "test", output: false },
            ];
            var result = (0, normalizeFewShot_1.normalizeFewShotExamples)(input, { coercePrimitives: true });
            (0, globals_1.expect)(result).toHaveLength(2);
            (0, globals_1.expect)(result[0]).toEqual({ input: "true", output: "ok" });
            (0, globals_1.expect)(result[1]).toEqual({ input: "test", output: "false" });
        });
        (0, globals_1.it)('should still filter out objects and arrays even with coercion', function () {
            var input = [
                { input: {}, output: "ok" },
                { input: [], output: "ok" },
                { input: "valid", output: {} },
            ];
            var result = (0, normalizeFewShot_1.normalizeFewShotExamples)(input, { coercePrimitives: true });
            (0, globals_1.expect)(result).toHaveLength(1);
            (0, globals_1.expect)(result[0]).toEqual({ input: "valid", output: "" });
        });
    });
    (0, globals_1.describe)('Edge Cases', function () {
        (0, globals_1.it)('should handle empty array', function () {
            (0, globals_1.expect)((0, normalizeFewShot_1.normalizeFewShotExamples)([])).toEqual([]);
        });
        (0, globals_1.it)('should handle examples with extra properties', function () {
            var input = [
                { input: "test", output: "ok", extra: "field", another: 123 },
            ];
            var result = (0, normalizeFewShot_1.normalizeFewShotExamples)(input);
            (0, globals_1.expect)(result).toHaveLength(1);
            (0, globals_1.expect)(result[0]).toEqual({ input: "test", output: "ok" });
        });
        (0, globals_1.it)('should handle very long strings', function () {
            var longString = "a".repeat(10000);
            var input = [
                { input: longString, output: "ok" },
            ];
            var result = (0, normalizeFewShot_1.normalizeFewShotExamples)(input);
            (0, globals_1.expect)(result).toHaveLength(1);
            (0, globals_1.expect)(result[0].input).toBe(longString);
        });
        (0, globals_1.it)('should handle special characters and unicode', function () {
            var input = [
                { input: "Hello 世界 🌍", output: "Olá 🇧🇷" },
                { input: "Test\n\t\r", output: "Response" },
            ];
            var result = (0, normalizeFewShot_1.normalizeFewShotExamples)(input);
            (0, globals_1.expect)(result).toHaveLength(2);
            (0, globals_1.expect)(result[0]).toEqual({ input: "Hello 世界 🌍", output: "Olá 🇧🇷" });
            (0, globals_1.expect)(result[1]).toEqual({ input: "Test", output: "Response" });
        });
    });
});
(0, globals_1.describe)('isValidFewShotExample', function () {
    (0, globals_1.it)('should return true for valid examples', function () {
        (0, globals_1.expect)((0, normalizeFewShot_1.isValidFewShotExample)({ input: "test", output: "ok" })).toBe(true);
        (0, globals_1.expect)((0, normalizeFewShot_1.isValidFewShotExample)({ input: "test", output: "" })).toBe(true);
        (0, globals_1.expect)((0, normalizeFewShot_1.isValidFewShotExample)({ input: "", output: "ok" })).toBe(true);
    });
    (0, globals_1.it)('should return false for invalid examples', function () {
        (0, globals_1.expect)((0, normalizeFewShot_1.isValidFewShotExample)({ input: "", output: "" })).toBe(false);
        (0, globals_1.expect)((0, normalizeFewShot_1.isValidFewShotExample)({ input: "  ", output: "  " })).toBe(false);
        (0, globals_1.expect)((0, normalizeFewShot_1.isValidFewShotExample)({ input: 123, output: 456 })).toBe(false);
        (0, globals_1.expect)((0, normalizeFewShot_1.isValidFewShotExample)(null)).toBe(false);
        (0, globals_1.expect)((0, normalizeFewShot_1.isValidFewShotExample)(undefined)).toBe(false);
        (0, globals_1.expect)((0, normalizeFewShot_1.isValidFewShotExample)("string")).toBe(false);
    });
    (0, globals_1.it)('should handle edge cases', function () {
        (0, globals_1.expect)((0, normalizeFewShot_1.isValidFewShotExample)({})).toBe(false);
        (0, globals_1.expect)((0, normalizeFewShot_1.isValidFewShotExample)({ input: null, output: null })).toBe(false);
        (0, globals_1.expect)((0, normalizeFewShot_1.isValidFewShotExample)({ input: undefined, output: undefined })).toBe(false);
    });
});
