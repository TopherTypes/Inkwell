# Inkwell — Architecture Specification
**Version:** 0.1 (pre-build)  
**Working title:** Inkwell (rename via find-and-replace)  
**Last updated:** 2026-06-24

---

## 1. Overview

Inkwell is a single-user desktop writing application for Windows 11. It provides a unified
environment for multiple writing types — novels, screenplays, stage plays, poetry, letters,
documents, and LARP props — with type-appropriate editor modes, rich metadata per entity type,
and export to PDF, RTF, and Fountain.

### 1.1 Tech Stack

| Layer | Technology |
|---|---|
| Desktop runtime | Electron 33+ |
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 6 + `vite-plugin-electron` |
| Editor | TipTap 2 (ProseMirror-based) |
| State management | Zustand 5 |
| Encryption | Node.js built-in `crypto` (AES-256-GCM) |
| PDF export | pdfmake |
| RTF export | `rtf-builder` or custom serializer |
| Packaging | electron-builder |

### 1.2 Key Design Principles

- **One TypeScript throughout.** Main process, renderer, file format, and migration code all
  share types via a `shared/` module. No language boundary except where Electron demands it.
- **Mode, not type.** The application is a host. Each writing type registers an editor mode.
  Adding a new writing type means registering a new mode, not modifying core code.
- **Container file format.** All file I/O uses the same container structure regardless of
  whether it is an individual entity or a project. This keeps encryption, versioning, and
  migration logic in one place.
- **Migration as first-class concern.** Schema versions are integers. Every version increment
  must have a corresponding migration function. Loading a file always migrates before use.

---

## 2. Repository Structure

```
inkwell/
├── package.json
├── electron-builder.yml
├── vite.config.ts
├── tsconfig.json
├── tsconfig.main.json
│
├── src/
│   ├── main/                        # Electron main process (Node.js context)
│   │   ├── index.ts                 # App entry point, BrowserWindow bootstrap
│   │   ├── window.ts                # Window creation and management
│   │   ├── menu.ts                  # Native application menu
│   │   ├── ipc/
│   │   │   ├── file-handlers.ts     # Open, save, save-as, new
│   │   │   └── export-handlers.ts   # PDF, RTF, Fountain export
│   │   └── file-format/
│   │       ├── container.ts         # Read/write .inkwell container
│   │       ├── encryption.ts        # AES-256-GCM implementation
│   │       └── migration.ts         # Schema migration chain
│   │
│   ├── renderer/                    # React application (browser context)
│   │   ├── index.html
│   │   ├── main.tsx                 # React root
│   │   ├── App.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── NavigatorPanel.tsx
│   │   │   │   ├── EditorPanel.tsx
│   │   │   │   └── MetadataPanel.tsx
│   │   │   ├── navigator/
│   │   │   │   ├── ProjectTree.tsx
│   │   │   │   ├── EntityList.tsx
│   │   │   │   └── NavigatorActions.tsx
│   │   │   ├── editor/
│   │   │   │   ├── EditorHost.tsx   # Loads correct mode for entity kind
│   │   │   │   ├── EditorToolbar.tsx
│   │   │   │   └── StatusBar.tsx
│   │   │   └── metadata/
│   │   │       ├── MetadataInspector.tsx   # Dispatcher: renders correct panel
│   │   │       └── panels/
│   │   │           ├── NovelChapterPanel.tsx
│   │   │           ├── ScreenplayPanel.tsx
│   │   │           ├── StagePlayPanel.tsx
│   │   │           ├── PoemPanel.tsx
│   │   │           ├── LetterPanel.tsx
│   │   │           ├── DocumentPanel.tsx
│   │   │           └── LarpPropPanel.tsx
│   │   │
│   │   ├── editor-modes/            # TipTap mode definitions (one dir per kind)
│   │   │   ├── registry.ts          # Mode registration and lookup
│   │   │   ├── prose/               # Novels, letters, documents
│   │   │   │   ├── index.ts
│   │   │   │   └── extensions.ts
│   │   │   ├── screenplay/
│   │   │   │   ├── index.ts
│   │   │   │   ├── extensions.ts    # Slugline, action, character, dialogue nodes
│   │   │   │   └── keyboard.ts      # Tab/Enter state machine
│   │   │   ├── stage-play/
│   │   │   ├── poetry/
│   │   │   └── larp-prop/
│   │   │
│   │   ├── export/
│   │   │   ├── pipeline.ts          # Orchestrates serializer + renderer
│   │   │   ├── pdf.ts
│   │   │   ├── rtf.ts
│   │   │   └── fountain.ts
│   │   │
│   │   └── store/                   # Zustand stores
│   │       ├── file-store.ts
│   │       ├── navigator-store.ts
│   │       ├── editor-store.ts
│   │       └── ui-store.ts
│   │
│   └── shared/                      # Types shared between main and renderer
│       ├── entity-types.ts
│       ├── ipc-channels.ts
│       └── schema-version.ts
│
└── dist/                            # Build output — gitignored
```

---

## 3. Data Model

### 3.1 Entity Kinds

```typescript
// src/shared/entity-types.ts

export type EntityKind =
  | "novel_chapter"
  | "screenplay"
  | "stage_play"
  | "poem"
  | "letter"
  | "document"
  | "larp_prop";
```

### 3.2 Base Entity

Every writing entity shares a base structure. The `content` field is a TipTap/ProseMirror
JSON document whose internal schema depends on `kind`.

```typescript
export interface BaseEntity {
  id: string;              // UUID v4, never changes after creation
  kind: EntityKind;
  title: string;
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
  schemaVersion: number;   // Increments with each format change
  content: TipTapJSON;     // ProseMirror document JSON
  tags: string[];
  wordCount: number;       // Cached, recomputed on save
}

// TipTapJSON is ProseMirror's serialised document format
export type TipTapJSON = {
  type: "doc";
  content: ProseMirrorNode[];
};
```

### 3.3 Entity Metadata (discriminated union)

Metadata is typed per kind. The discriminated union ensures TypeScript exhaustiveness checks
when metadata panels or export serializers switch on `kind`.

```typescript
export type WritingEntity =
  | NovelChapterEntity
  | ScreenplayEntity
  | StagePlayEntity
  | PoemEntity
  | LetterEntity
  | DocumentEntity
  | LarpPropEntity;

// ── Novel Chapter ───────────────────────────────────────────────────────────
export interface NovelChapterEntity extends BaseEntity {
  kind: "novel_chapter";
  metadata: {
    chapterNumber?: number;
    pointOfView?: string;
    tension?: 1 | 2 | 3 | 4 | 5;
    arcPosition?: "setup" | "rising" | "climax" | "falling" | "resolution";
    characters: string[];
    location?: string;
    timelineDate?: string;
    wordCountTarget?: number;
    notes?: string;
  };
}

// ── Screenplay ──────────────────────────────────────────────────────────────
export interface ScreenplayEntity extends BaseEntity {
  kind: "screenplay";
  metadata: {
    format?: "feature" | "short" | "tv_pilot" | "tv_episode";
    genre?: string;
    logline?: string;
    draftVersion?: string;
    characters: string[];
    estimatedRuntime?: number;  // minutes
    notes?: string;
  };
}

// ── Stage Play ──────────────────────────────────────────────────────────────
export interface StagePlayEntity extends BaseEntity {
  kind: "stage_play";
  metadata: {
    actNumber?: number;
    sceneNumber?: number;
    setting?: string;
    characters: string[];
    stageDirectionsStyle?: "inline" | "block";
    notes?: string;
  };
}

// ── Poem ────────────────────────────────────────────────────────────────────
export interface PoemEntity extends BaseEntity {
  kind: "poem";
  metadata: {
    form?: string;           // Sonnet, haiku, villanelle, free verse, etc.
    rhymeScheme?: string;
    meterNotes?: string;
    collection?: string;
    notes?: string;
  };
}

// ── Letter ──────────────────────────────────────────────────────────────────
export interface LetterEntity extends BaseEntity {
  kind: "letter";
  metadata: {
    recipient?: string;
    sender?: string;
    date?: string;
    isInCharacter?: boolean;    // For LARP / fiction letters
    characterSender?: string;
    characterRecipient?: string;
    notes?: string;
  };
}

// ── Document / Artefact ─────────────────────────────────────────────────────
export interface DocumentEntity extends BaseEntity {
  kind: "document";
  metadata: {
    documentType?: string;     // Report, policy, notes, worldbuilding, etc.
    version?: string;
    status?: "draft" | "review" | "final";
    author?: string;
    notes?: string;
  };
}

// ── LARP Prop ───────────────────────────────────────────────────────────────
export interface LarpPropEntity extends BaseEntity {
  kind: "larp_prop";
  metadata: {
    system?: string;           // Empire, V5, etc.
    propType?: string;         // Letter, scroll, journal, etc.
    inCharacterDate?: string;
    author?: string;           // In-character name
    recipient?: string;        // In-character name
    isFacsimile?: boolean;     // Whether it will be printed as a prop
    materialNotes?: string;    // Vellum, wax seal, etc.
    notes?: string;
  };
}
```

### 3.4 Project Model

A project is a named container for entities. It can store either references to external
entity files, or embed entity data directly (for the single-file project save format).

```typescript
export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
  entities: EntityRef[];
  metadata: {
    author?: string;
    genre?: string;
    status?: "active" | "complete" | "archived";
    notes?: string;
  };
}

export interface EntityRef {
  id: string;
  kind: EntityKind;
  title: string;
  order: number;
  // If externalPath is present, entity is stored in a separate file.
  // If absent, entity data is embedded in the project file body.
  externalPath?: string;
}
```

---

## 4. File Format

### 4.1 File Extensions

| Extension | Contents |
|---|---|
| `.inkwell` | Single entity |
| `.inkwellp` | Project (entities embedded or referenced externally) |

Both use the same container format. The container header identifies which it is.

### 4.2 Container Structure

All files use this binary layout:

```
┌─────────────────────────────────────────────────────┐
│  4 bytes   Magic: 0x494E4B57 ("INKW")               │  Identifies file type
├─────────────────────────────────────────────────────┤
│  4 bytes   Format version (uint32, little-endian)   │  Container format version
├─────────────────────────────────────────────────────┤
│  4 bytes   Header length in bytes (uint32)          │  Length of plaintext header
├─────────────────────────────────────────────────────┤
│  N bytes   Plaintext JSON header                    │  See 4.3
├─────────────────────────────────────────────────────┤
│  12 bytes  GCM nonce (random per write)             │  AES-256-GCM initialisation vector
├─────────────────────────────────────────────────────┤
│  16 bytes  GCM auth tag                             │  Integrity verification
├─────────────────────────────────────────────────────┤
│  N bytes   Encrypted body                           │  AES-256-GCM ciphertext
└─────────────────────────────────────────────────────┘
```

### 4.3 Plaintext Header

The header is readable without decryption. It contains only what is needed to display the
file in the navigator and to run schema migration before decryption is attempted.

```typescript
interface FileHeader {
  containerVersion: number;  // Container format version (distinct from schema version)
  fileKind: "entity" | "project";
  entityKind?: EntityKind;   // Present if fileKind === "entity"
  id: string;
  title: string;
  schemaVersion: number;     // Used to select migration path before decrypt
  createdAt: string;
  updatedAt: string;
}
```

### 4.4 Encrypted Body

The body is the JSON-serialised entity or project, encrypted with AES-256-GCM. On
decryption the result is parsed as JSON, migration is applied if needed, then validated
against the current schema.

### 4.5 Encryption Implementation

```typescript
// src/main/file-format/encryption.ts

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// The app key is derived from a fixed salt + app identifier.
// This provides "don't open with other apps" protection without user passwords.
// For future upgrade to user-password protection, replace deriveKey() only.
const APP_SALT = Buffer.from("inkwell-v1-salt-2026", "utf8");
const APP_SECRET = "inkwell-application-key-do-not-share";

function deriveKey(): Buffer {
  return scryptSync(APP_SECRET, APP_SALT, 32);
}

export function encrypt(plaintext: string): Buffer {
  const key = deriveKey();
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([nonce, tag, encrypted]);
}

export function decrypt(ciphertext: Buffer): string {
  const key = deriveKey();
  const nonce = ciphertext.subarray(0, 12);
  const tag = ciphertext.subarray(12, 28);
  const body = ciphertext.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}
```

---

## 5. Schema Migration System

### 5.1 Versioning

- `schemaVersion` is a non-negative integer stored in the plaintext header.
- `CURRENT_SCHEMA_VERSION` is the version the running app understands.
- Every PR that changes entity or project shape must increment this constant and add a
  migration function.

```typescript
// src/shared/schema-version.ts
export const CURRENT_SCHEMA_VERSION = 1;
```

### 5.2 Migration Chain

```typescript
// src/main/file-format/migration.ts

import { CURRENT_SCHEMA_VERSION } from "../../shared/schema-version";

interface Migration {
  from: number;
  to: number;
  transform: (data: unknown) => unknown;
}

// Add new entries here with every schema change.
// Never modify existing entries — add a new one.
const migrations: Migration[] = [
  // Example: v1 → v2 added the `tags` field
  // {
  //   from: 1,
  //   to: 2,
  //   transform: (data: any) => ({ ...data, tags: data.tags ?? [] }),
  // },
];

export function migrate(data: unknown, fromVersion: number): unknown {
  let current = data;
  let version = fromVersion;

  while (version < CURRENT_SCHEMA_VERSION) {
    const migration = migrations.find(m => m.from === version);
    if (!migration) {
      throw new Error(
        `No migration found from schema version ${version}. ` +
        `Cannot load file. Add a migration in migration.ts.`
      );
    }
    current = migration.transform(current);
    version = migration.to;
  }

  return current;
}

export function needsMigration(schemaVersion: number): boolean {
  return schemaVersion < CURRENT_SCHEMA_VERSION;
}
```

### 5.3 Load Flow

```
Read file bytes
  → Verify magic number
  → Parse plaintext header (JSON)
  → Check schemaVersion in header
  → If schemaVersion < CURRENT: run migrate() on decrypted body JSON
  → Validate resulting data against current TypeScript types
  → Return typed entity or project
```

---

## 6. Editor Architecture

### 6.1 Mode Registry

Each writing type registers an editor mode at startup. The registry is the single source of
truth for which modes are available and how they behave.

```typescript
// src/renderer/editor-modes/registry.ts

import { EntityKind } from "../../shared/entity-types";
import { Extensions } from "@tiptap/core";

export interface EditorMode {
  kind: EntityKind;
  displayName: string;
  extensions: Extensions;        // TipTap extensions for this mode
  defaultContent: TipTapJSON;    // Empty document for new entities of this kind
  exportable: ExportFormat[];    // Which export formats are available
}

export type ExportFormat = "pdf" | "rtf" | "fountain";

const registry = new Map<EntityKind, EditorMode>();

export function registerMode(mode: EditorMode): void {
  registry.set(mode.kind, mode);
}

export function getMode(kind: EntityKind): EditorMode {
  const mode = registry.get(kind);
  if (!mode) throw new Error(`No editor mode registered for kind: ${kind}`);
  return mode;
}

export function getAllModes(): EditorMode[] {
  return Array.from(registry.values());
}
```

### 6.2 EditorHost Component

`EditorHost` is responsible for mounting the correct TipTap instance for the current entity.
When the selected entity changes, it destroys and re-creates the editor with the correct mode.

```typescript
// src/renderer/components/editor/EditorHost.tsx

// Key behaviour:
// - Receives the current entity ID from the editor store
// - Looks up the entity kind → fetches the registered EditorMode
// - Passes that mode's extensions to a TipTap <EditorContent> instance
// - On content change, debounces and writes back to the editor store
// - On entity change, commits pending changes before switching
```

### 6.3 Screenplay Mode — Keyboard State Machine

The screenplay editor mode must implement the standard Tab/Enter element cycling behaviour.
This lives entirely inside a TipTap keyboard extension.

```
Current element    Enter →           Tab →
─────────────────────────────────────────────────────
Scene Heading      Action            Action
Action             Action            Character
Character          Dialogue          Parenthetical
Parenthetical      Dialogue          Dialogue
Dialogue           Action (blank)    Character
                   Character (Tab)
Transition         Scene Heading     Scene Heading
```

Each element is a custom TipTap node (`SceneHeading`, `Action`, `Character`,
`Parenthetical`, `Dialogue`, `Transition`). The keyboard extension reads the current
node type and replaces it or inserts the next correct node type.

### 6.4 Poetry Mode — Semantic Line Breaks

In standard rich text, Enter creates a new paragraph (block element). In poetry, a line
break is semantic — a single stanza is one unit. The poetry mode overrides Enter to
insert a hard line break (`<br>`) within the same paragraph, and uses Shift+Enter (or
double Enter) to start a new stanza.

---

## 7. Application Component Structure

### 7.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  TitleBar (custom Electron frameless chrome)                    │
├──────────────────┬──────────────────────┬───────────────────────┤
│                  │                      │                       │
│  NavigatorPanel  │    EditorPanel       │   MetadataPanel       │
│  (260px fixed)   │    (flex: 1)         │   (280px fixed)       │
│                  │                      │                       │
│  ProjectTree     │  EditorToolbar       │  MetadataInspector    │
│  ─────────────   │  ─────────────────   │  (renders kind-       │
│  EntityList      │  EditorHost          │  specific panel)      │
│                  │                      │                       │
│  [+] New Entity  │                      │                       │
│                  │                      │                       │
├──────────────────┴──────────────────────┴───────────────────────┤
│  StatusBar: word count · entity kind · save state · schema ver  │
└─────────────────────────────────────────────────────────────────┘
```

Panels are resizable via drag handles. Widths are persisted to `localStorage` per session
(this is not sensitive data and does not need encryption).

### 7.2 State Management (Zustand)

Four stores. Each is independent — cross-store dependencies go through actions, not direct
reads between stores.

```typescript
// file-store.ts
interface FileStore {
  currentFilePath: string | null;
  isDirty: boolean;                    // Unsaved changes exist
  recentFiles: RecentFile[];
  openEntity: (path: string) => Promise<void>;
  openProject: (path: string) => Promise<void>;
  saveCurrentEntity: () => Promise<void>;
  saveAs: () => Promise<void>;
}

// navigator-store.ts
interface NavigatorStore {
  project: Project | null;
  selectedEntityId: string | null;
  entities: WritingEntity[];           // All loaded/open entities
  selectEntity: (id: string) => void;
  addEntity: (kind: EntityKind) => void;
  removeEntity: (id: string) => void;
}

// editor-store.ts
interface EditorStore {
  activeEntity: WritingEntity | null;
  editorContent: TipTapJSON | null;    // Live editor state, not yet committed
  setContent: (content: TipTapJSON) => void;
  commitContent: () => void;           // Writes editorContent back to activeEntity
}

// ui-store.ts
interface UIStore {
  navigatorWidth: number;
  metadataWidth: number;
  isNavigatorVisible: boolean;
  isMetadataVisible: boolean;
  exportModalOpen: boolean;
  exportOptions: ExportOptions;
}
```

---

## 8. IPC Bridge (Electron Main ↔ Renderer)

All file system operations run in the main process. The renderer communicates via typed IPC
channels. This separation means the renderer never touches the filesystem directly.

```typescript
// src/shared/ipc-channels.ts

export const IPC = {
  // File operations
  FILE_OPEN_ENTITY:    "file:open-entity",
  FILE_OPEN_PROJECT:   "file:open-project",
  FILE_SAVE_ENTITY:    "file:save-entity",
  FILE_SAVE_PROJECT:   "file:save-project",
  FILE_SAVE_AS:        "file:save-as",
  FILE_NEW_ENTITY:     "file:new-entity",
  FILE_NEW_PROJECT:    "file:new-project",

  // Export
  EXPORT_PDF:          "export:pdf",
  EXPORT_RTF:          "export:rtf",
  EXPORT_FOUNTAIN:     "export:fountain",

  // App events
  MENU_ACTION:         "app:menu-action",
  UNSAVED_CHANGES:     "app:unsaved-changes",
} as const;
```

All IPC handlers in `src/main/ipc/` validate their payloads before processing. Return values
are typed `Result<T, Error>` objects — never raw throws across the IPC boundary.

---

## 9. Export System

### 9.1 Export Options

```typescript
// src/renderer/export/pipeline.ts

export interface ExportOptions {
  format: "pdf" | "rtf" | "fountain";
  mode: "editing" | "beta" | "final";
  includeMetadata: boolean;
  pageSize: "a4" | "letter";
}
```

### 9.2 Export Modes

| Mode | Purpose | Includes |
|---|---|---|
| `editing` | Working copy | Line numbers, scene markers, word counts, TOC |
| `beta` | Beta readers | Clean prose, chapter headings, no markup |
| `final` | Print/submit | Correct typography, no metadata, print-ready |

### 9.3 Export Pipeline

```
entity: WritingEntity
  → select serializer by entity.kind + options.format
  → serializer produces intermediate IR (intermediate representation)
  → renderer converts IR → Buffer (PDF bytes / RTF string / Fountain text)
  → main process writes Buffer to user-selected file path via IPC
```

Each writing kind has its own serializer per format. Serializers are pure functions:
`(entity: WritingEntity, options: ExportOptions) => IntermediateRepresentation`.

The IR is a simple tree structure decoupled from any specific output format, making it easy
to add new output formats later without rewriting serializers.

### 9.4 Fountain Export (Screenplay only)

Fountain is the plain-text screenplay standard supported by Final Draft, Highland, and Fade
In. Exporting to Fountain makes screenplay content interoperable with professional tools.
The Fountain serializer maps TipTap screenplay nodes to Fountain syntax elements:

| TipTap node | Fountain syntax |
|---|---|
| `SceneHeading` | `INT. LOCATION - DAY` (auto-uppercased) |
| `Action` | Plain paragraph |
| `Character` | `CHARACTER NAME` (all caps, centred) |
| `Parenthetical` | `(beat)` |
| `Dialogue` | Plain paragraph after character |
| `Transition` | `FADE OUT.` (right-aligned marker) |

---

## 10. Extension Points

Adding a new writing type requires touching four locations only. No core code changes.

**Step 1 — Add to the EntityKind union** (`src/shared/entity-types.ts`)
```typescript
export type EntityKind = ... | "your_new_kind";
```

**Step 2 — Define the entity interface** (`src/shared/entity-types.ts`)
```typescript
export interface YourNewKindEntity extends BaseEntity {
  kind: "your_new_kind";
  metadata: { /* your fields */ };
}
```
Add it to the `WritingEntity` union.

**Step 3 — Create and register an editor mode** (`src/renderer/editor-modes/your-new-kind/`)
```typescript
registerMode({
  kind: "your_new_kind",
  displayName: "Your New Kind",
  extensions: [...],
  defaultContent: { type: "doc", content: [] },
  exportable: ["pdf", "rtf"],
});
```

**Step 4 — Create a metadata panel** (`src/renderer/components/metadata/panels/YourNewKindPanel.tsx`)

Add a case to `MetadataInspector.tsx`'s switch statement.

That is the complete surface area for a new entity type. TypeScript exhaustiveness checks
will catch any missed switch cases at compile time.

---

## 11. Build Configuration

### 11.1 Development

```bash
npm install          # First time only
npm run dev          # Starts Vite + Electron in watch mode
```

### 11.2 Production Build

```bash
npm run build        # TypeScript compile → Vite bundle → electron-builder → /dist
```

Output: `/dist/Inkwell Setup 0.1.0.exe` (NSIS installer for Windows)

### 11.3 electron-builder.yml (key settings)

```yaml
appId: com.inkwell.app
productName: Inkwell
directories:
  output: dist
win:
  target:
    - target: nsis
      arch: [x64]
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
files:
  - dist-electron/**
  - dist-renderer/**
  - node_modules/**
  - package.json
```

### 11.4 vite.config.ts (key settings)

Uses `vite-plugin-electron` to build both the renderer (React app) and the main process
(Electron Node.js entry) in a single Vite pipeline.

---

## 12. Outstanding Decisions (pre-build)

These require confirmation before or during initial build. They do not block the spec but
will affect implementation.

| # | Decision | Default assumption | Notes |
|---|---|---|---|
| 1 | App name | "Inkwell" | Find-and-replace throughout when confirmed |
| 2 | User-facing encryption | Fixed app key (no password) | Upgrade path: add password derivation in `encryption.ts` only |
| 3 | Auto-save behaviour | On focus loss + every 60s | Frequency should be user-configurable |
| 4 | Entity ordering in navigator | Manual drag-and-drop | Could add auto-sort by date or kind |
| 5 | RTF export library | `rtf-builder` npm package | Evaluate at build time; may need custom serializer |
| 6 | Undo/redo scope | Per-entity (TipTap built-in) | Cross-entity undo is out of scope for v1 |
| 7 | Theming | Dark mode only for v1 | TipTap and UI should use CSS variables from day one |

---

*End of Architecture Specification*
