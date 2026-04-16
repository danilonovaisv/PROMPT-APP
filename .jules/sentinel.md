## 2026-03-27 - Unnecessary target=_blank changes\n**Vulnerability:** None originally. Added `target="_blank"` simply to add `rel="noopener noreferrer"`.\n**Learning:** Don't introduce arbitrary UX changes to force a security enhancement. If a link doesn't open in a new tab, it's not vulnerable to reverse tabnabbing, so modifying its UX just to add `noopener noreferrer` is unnecessary.\n**Prevention:** Carefully review if a given element actually requires the security enhancement before modifying it.

## 2025-02-28 - [Insecure Deserialization in LocalStorage]
**Vulnerability:** Unvalidated deserialized JSON object from `localStorage` casted blindly as an `AppSnapshot`.
**Learning:** `JSON.parse` output from `localStorage` is untrusted data and can be tampered with. Blindly casting it to an interface bypasses type safety and can cause unhandled `TypeError` exceptions if the application attempts to access deeply nested properties that are `undefined` or `null`.
**Prevention:** Always implement a custom type guard or use Zod schemas to structurally validate the object parsed from `JSON.parse` before accessing its nested properties.
