## 2026-03-27 - Unnecessary target=_blank changes\n**Vulnerability:** None originally. Added `target="_blank"` simply to add `rel="noopener noreferrer"`.\n**Learning:** Don't introduce arbitrary UX changes to force a security enhancement. If a link doesn't open in a new tab, it's not vulnerable to reverse tabnabbing, so modifying its UX just to add `noopener noreferrer` is unnecessary.\n**Prevention:** Carefully review if a given element actually requires the security enhancement before modifying it.

## 2025-02-12 - Insecure Deserialization in LocalStorage
**Vulnerability:** Application blindly trusted data parsed from `localStorage` (`JSON.parse` cast directly with `as AppSnapshot`).
**Learning:** `localStorage` is susceptible to tampering by users or malicious scripts. Accessing nested properties on unvalidated deserialized data can cause unhandled `TypeError` crashes or potentially expose logic flaws.
**Prevention:** Always implement runtime type validation (e.g., a type guard like `isValidSnapshot` or Zod schemas) immediately after `JSON.parse` before asserting types or accessing deeply nested properties.
