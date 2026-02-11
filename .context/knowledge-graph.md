# Knowledge Graph - PROMPT-APP

## Nodes

### Core

- **Database** (`src/db/database.ts`): IndexedDB abstraction using Dexie. Handles persistence for Prompts, Categories, and Menus.
- **Models** (`src/models/types.ts`): TypeScript interfaces for the entire application (Category, Prompt, Menu, ContextMenu).
- **Draft System**: Persistent rascunho (draft) mechanism in `EditorPage.tsx` using `localStorage` to prevent data loss during editing.

### Context

- **ToastContext** (`src/context/ToastContext.tsx`): Provides global notification system.

### Pages

- **HomePage** (`src/pages/HomePage.tsx`): Main dashboard showing categories.
- **CategoryPage** (`src/pages/CategoryPage.tsx`): Displays prompts within a selected category.
- **EditorPage** (`src/pages/EditorPage.tsx`): Advanced prompt editor with syntax highlighting, metadata support, and automatic draft saving.
- **MenuManagerPage** (`src/pages/MenuManagerPage.tsx`): Management of context menus and snippets.
- **CategoryManagerPage** (`src/pages/CategoryManagerPage.tsx`): CRUD for prompt categories.

### Components

- **Layout** (`src/components/Layout.tsx`): Main application wrapper with sidebar navigation.
- **SEO** (`src/components/SEO.tsx`): Meta tag management for search engine optimization.
- **ImportExportModal** (`src/components/ImportExportModal.tsx`): Global data management.
- **ImportMenusModal** (`src/components/ImportMenusModal.tsx`): Specific JSON import for context menus.

### Utils

- **backupManager** (`src/utils/backupManager.ts`): Logic for automated and manual data backups.
- **importJson/exportJson**: JSON file handling logic.

### Design Patterns

- **Local-First Architecture**: Use of Dexie.js for heavy local data management.
- **Atomic Components**: Reusable UI elements for buttons, cards, and forms.
- **CSS Refactor**: No inline styles. Dynamic colors are handled via CSS Variables mapped to utility classes (e.g., `.util-cat-color-*`).
- **Chunking Strategy**: Systematic splitting of vendor dependencies (React, DB, Supabase, Icons) for optimized loading and caching.

## Relationships

- **Pages** depend on **Database** for data fetching.
- **Components** depend on **Models** for type safety.
- **Layout** wraps all **Pages**.
- **BackupManager** interacts with **Database**.
