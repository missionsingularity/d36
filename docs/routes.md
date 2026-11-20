# Current application routes

The root and catch-all App Router entrypoints render the shared workspace. Existing destinations include Chat, Work records, Projects, Documents, Tasks, Customize, Notifications and Profile. Typed conversations use `/conversations/{id}`. Existing workflow chat and work records remain at `/chat/{id}` and `/work/{id}`.

`/api/demo` handles scoped reads, immutable original downloads, exports, uploads, workflow execution and actions, settings, project creation and membership, local sharing and restrictions. The typed-message operation stores independent conversations. The conversation-work operation creates or reuses an associated illustrative office-note run. The server returns consistent JSON error messages with HTTP status codes.

Stored data is currently atomic JSON under the configured private data directory. Existing originals and outputs remain content-addressed files. Migration to SQLite and broader case CRUD are pending. Use one app process per data directory.
