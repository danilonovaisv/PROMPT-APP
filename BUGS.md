# Found Bugs Report

## 1. Test Suite Crashing on TypeScript Error
**Title:** Type error in `tests/setup.ts` preventing Jest tests from running
**Description:** The test environment setup file `tests/setup.ts` contains a type error (`TS2345: Argument of type 'Blob' is not assignable to parameter of type 'AllowSharedBufferSource | undefined'`) on line 21 when overriding `Blob.prototype.text`. Because of this strict typing failure in the polyfill, Jest fails to start the entire test suite.
**Location:** `tests/setup.ts` (Line 21)
**Priority:** High
**Label:** bug

## 2. Unhandled Errors during Import and Payload Parsing
**Title:** Missing safe checks before `.trim()` and `.toLowerCase()` in Prompt Schema
**Description:** In `src/models/promptSchema.ts` (e.g., line 261), the variable `raw` is cast to a string and `(raw || '').trim().toLowerCase()` is executed. If `raw` is a deeply nested object or a number from a malformed JSON payload (since `typeof raw` validation is sometimes skipped for legacy records), `.trim()` will throw a `TypeError: raw.trim is not a function`, crashing the application during import operations.
**Location:** `src/models/promptSchema.ts` (Line 261)
**Priority:** Medium
**Label:** bug

## 3. Unsafe Error Type Casting in Catch Blocks
**Title:** Runtime crash potential due to unsafe `Error` casting in catch blocks
**Description:** Throughout `src/pages/EditorPage.tsx` and `src/pages/MenuManagerPage.tsx` (e.g., EditorPage line 280, 484), caught errors of type `unknown` are unsafely cast using `const error = e as Error;` and then `error.message` is accessed. If the thrown exception is a string or `null` (which can happen with some third-party libraries or network fetch rejections), `error.message` will be `undefined` or throw another error, failing the error-handling fallback logic. A type guard like `error instanceof Error` should be used instead.
**Location:** `src/pages/EditorPage.tsx` (Lines 280, 484); `src/pages/MenuManagerPage.tsx`
**Priority:** Medium
**Label:** bug

## 4. Potential Null Reference Error on File Upload
**Title:** Potential TypeError when accessing `file.name` on null file object
**Description:** In `src/components/ImportExportModal.tsx` on line 55, the file upload handler checks `!file.name.toLowerCase().endsWith('.json')`. Although line 53 has a `if (!file) return;` check, in some edge cases (e.g. drag and drop of non-file items or corrupted file objects from browser extensions), `file.name` might be `undefined`, causing `.toLowerCase()` to throw a `TypeError`.
**Location:** `src/components/ImportExportModal.tsx` (Line 55)
**Priority:** Low
**Label:** bug
