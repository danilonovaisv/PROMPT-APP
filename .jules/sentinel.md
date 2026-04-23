## 2024-05-18 - Information Exposure in ErrorBoundary
**Vulnerability:** The `<ErrorBoundary />` component was rendering the raw error message (`this.state.error.message`) inside a `<pre>` tag directly to the user interface.
**Learning:** React Error Boundaries often catch unexpected internal errors. Exposing these messages directly to the UI can unintentionally leak sensitive system details, stack traces, file paths, or API keys to end users, creating an Information Exposure vulnerability.
**Prevention:** Always catch and log raw error details securely via `console.error` (or a secure logging service) and display only a sanitized, generic error message to the user interface in Error Boundary components.
