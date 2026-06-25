# Inkwell — Product Requirements Document
**For:** Claude Code (context document — not a human-readable spec)  
**Architecture spec:** `inkwell-architecture-spec.md` (read it; this doc supersedes where they conflict)  
**Schema version:** 1  
**Build target:** Windows 11 x64

---

## PROJECT CONTEXT

Build a single-user desktop writing application called **Inkwell** for Windows 11. It manages
multiple writing types (novel chapters, screenplays, stage plays, poems, letters, documents,
LARP props) in a unified three-panel UI: navigator sidebar | editor | metadata inspector.
Files are saved in a custom AES-256-GCM encrypted binary container format with extension
`.inkwell` (entities) or `.inkwellp` (projects). Export targets: PDF, RTF, Fountain (screenplay only).

This is a personal tool. No auth, no sync, no server, no telemetry.

---

## HARD CONSTRAINTS

- Language: TypeScript throughout. `strict: true` in all tsconfig files. No `any` except
  where unavoidable at IPC boundaries (validate immediately on receipt).
- Runtime: Electron 33+. Never use deprecated Electron APIs. Context isolation ON.
  `nodeIntegration: false` in renderer. All Node.js calls go through IPC.
- Frontend: React 18 with hooks only. No class components.
- Editor: TipTap 2. No other editor library.
- State: Zustand 5. No Redux, no Context for global state, no prop-drilling past two levels.
- Styling: CSS Modules or plain CSS with CSS custom properties. No Tailwind, no CSS-in-JS.
  Define all colour tokens as CSS variables on `:root` from day one (enables future theming).
  Dark mode only for v1.
- File I/O: Main process only. Renderer never calls `fs` directly. Use IPC channels defined
  in `src/shared/ipc-channels.ts`.
- Encryption: Node.js built-in `crypto` only. `aes-256-gcm`. No third-party crypto library.
- Build: `npm run build` must produce a working `.exe` with no manual steps.
- Backwards compatibility: Every schema change requires a migration function. A file with
  schemaVersion < CURRENT_SCHEMA_VERSION must load successfully.

---

## REPOSITORY STRUCTURE

Scaffold exactly this structure. Do not deviate.

```
inkwell/
├── package.json
├── electron-builder.yml
├── vite.config.ts
├── tsconfig.json              # Renderer (browser context)
├── tsconfig.main.json         # Main process (Node.js context)
│
├── src/
│   ├── main/
│   │   ├── index.ts           # Entry: creates BrowserWindow, registers IPC handlers
│   │   ├── window.ts          # BrowserWindow factory and lifecycle
│   │   ├── menu.ts            # Native app menu
│   │   ├── ipc/
│   │   │   ├── file-handlers.ts
│   │   │   └── export-handlers.ts
│   │   └── file-format/
│   │       ├── container.ts   # Binary read/write
│   │       ├── encryption.ts  # AES-256-GCM
│   │       └── migration.ts   # Migration chain
│   │
│   ├── renderer/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
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
│   │   │   │   ├── EditorHost.tsx
│   │   │   │   ├── EditorToolbar.tsx
│   │   │   │   └── StatusBar.tsx
│   │   │   └── metadata/
│   │   │       ├── MetadataInspector.tsx
│   │   │       └── panels/
│   │   │           ├── NovelChapterPanel.tsx
│   │   │           ├── ScreenplayPanel.tsx
│   │   │           ├── StagePlayPanel.tsx
│   │   │           ├── PoemPanel.tsx
│   │   │           ├── LetterPanel.tsx
│   │   │           ├── DocumentPanel.tsx
│   │   │           └── LarpPropPanel.tsx
│   │   ├── editor-modes/
│   │   │   ├── registry.ts
│   │   │   ├── prose/
│   │   │   │   ├── index.ts
│   │   │   │   └── extensions.ts
│   │   │   ├── screenplay/
│   │   │   │   ├── index.ts
│   │   │   │   ├── nodes.ts
│   │   │   │   └── keyboard.ts
│   │   │   ├── stage-play/
│   │   │   │   ├── index.ts
│   │   │   │   └── nodes.ts
│   │   │   ├── poetry/
│   │   │   │   ├── index.ts
│   │   │   │   └── extensions.ts
│   │   │   └── larp-prop/
│   │   │       ├── index.ts
│   │   │       └── extensions.ts
│   │   ├── export/
│   │   │   ├── pipeline.ts
│   │   │   ├── pdf.ts
│   │   │   ├── rtf.ts
│   │   │   └── fountain.ts
│   │   └── store/
│   │       ├── file-store.ts
│   │       ├── navigator-store.ts
│   │       ├── editor-store.ts
│   │       └── ui-store.ts
│   │
│   └── shared/
│       ├── entity-types.ts
│       ├── ipc-channels.ts
│       └── schema-version.ts
│
└── dist/
```

---

## DATA MODEL

Use these types verbatim in `src/shared/entity-types.ts`. Do not rename fields.

```typescript
// ── Primitives ───────────────────────────────────────────────────────────────

export type EntityKind =
  | "novel_chapter"
  | "screenplay"
  | "stage_play"
  | "poem"
  | "letter"
  | "document"
  | "larp_prop";

export type TipTapJSON = {
  type: "doc";
  content: unknown[];
};

export type ExportFormat = "pdf" | "rtf" | "fountain";

export type ExportMode = "editing" | "beta" | "final";

// ── Base ─────────────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;            // UUID v4, immutable after creation
  kind: EntityKind;
  title: string;
  createdAt: string;     // ISO 8601
  updatedAt: string;     // ISO 8601
  schemaVersion: number;
  content: TipTapJSON;
  tags: string[];
  wordCount: number;     // Cached; recompute on every save
}

// ── Per-kind entities ────────────────────────────────────────────────────────

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

export interface ScreenplayEntity extends BaseEntity {
  kind: "screenplay";
  metadata: {
    format?: "feature" | "short" | "tv_pilot" | "tv_episode";
    genre?: string;
    logline?: string;
    draftVersion?: string;
    characters: string[];
    estimatedRuntime?: number;
    notes?: string;
  };
}

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

export interface PoemEntity extends BaseEntity {
  kind: "poem";
  metadata: {
    form?: string;
    rhymeScheme?: string;
    meterNotes?: string;
    collection?: string;
    notes?: string;
  };
}

export interface LetterEntity extends BaseEntity {
  kind: "letter";
  metadata: {
    recipient?: string;
    sender?: string;
    date?: string;
    isInCharacter?: boolean;
    characterSender?: string;
    characterRecipient?: string;
    notes?: string;
  };
}

export interface DocumentEntity extends BaseEntity {
  kind: "document";
  metadata: {
    documentType?: string;
    version?: string;
    status?: "draft" | "review" | "final";
    author?: string;
    notes?: string;
  };
}

export interface LarpPropEntity extends BaseEntity {
  kind: "larp_prop";
  metadata: {
    system?: string;
    propType?: string;
    inCharacterDate?: string;
    author?: string;
    recipient?: string;
    isFacsimile?: boolean;
    materialNotes?: string;
    notes?: string;
  };
}

export type WritingEntity =
  | NovelChapterEntity
  | ScreenplayEntity
  | StagePlayEntity
  | PoemEntity
  | LetterEntity
  | DocumentEntity
  | LarpPropEntity;

// ── Project ──────────────────────────────────────────────────────────────────

export interface EntityRef {
  id: string;
  kind: EntityKind;
  title: string;
  order: number;
  externalPath?: string;   // Absent = entity embedded in project body
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
  entities: EntityRef[];
  embeddedEntities: WritingEntity[];   // Empty array when all refs are external
  metadata: {
    author?: string;
    genre?: string;
    status?: "active" | "complete" | "archived";
    notes?: string;
  };
}

// ── File header (plaintext section of container) ─────────────────────────────

export interface FileHeader {
  containerVersion: number;
  fileKind: "entity" | "project";
  entityKind?: EntityKind;
  id: string;
  title: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

// ── IPC result wrapper ────────────────────────────────────────────────────────

export type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

---

## SCHEMA VERSIONING

```typescript
// src/shared/schema-version.ts
export const CURRENT_SCHEMA_VERSION = 1;
export const CONTAINER_VERSION = 1;
```

Increment `CURRENT_SCHEMA_VERSION` with every change to entity or project shape.
Every increment requires a corresponding entry in the `migrations` array in
`src/main/file-format/migration.ts`. Build fails if a version gap exists.

---

## FILE FORMAT IMPLEMENTATION

### Container binary layout

```
Offset  Length   Content
──────────────────────────────────────────────────────────────
0       4        Magic: bytes [0x49, 0x4E, 0x4B, 0x57] ("INKW")
4       4        Container version (uint32, LE)
8       4        Header length in bytes (uint32, LE)
12      N        Plaintext JSON header (UTF-8)
12+N    12       GCM nonce (random, generated fresh per write)
24+N    16       GCM auth tag
40+N    M        AES-256-GCM ciphertext (JSON body)
```

### container.ts — required exports

```typescript
export function writeContainer(header: FileHeader, body: unknown): Buffer;
export function readContainer(buf: Buffer): { header: FileHeader; body: unknown };
// readContainer throws if magic bytes are wrong or GCM auth fails.
// It does not run migration — caller is responsible.
```

### encryption.ts — implement exactly this

```typescript
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

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

export function decrypt(data: Buffer): string {
  const key = deriveKey();
  const nonce = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const body = data.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}
```

### migration.ts — required structure

```typescript
import { CURRENT_SCHEMA_VERSION } from "../../shared/schema-version";

interface Migration {
  from: number;
  to: number;
  transform: (data: unknown) => unknown;
}

// APPEND ONLY. Never edit existing entries.
const migrations: Migration[] = [];

export function migrate(data: unknown, fromVersion: number): unknown {
  let current = data;
  let version = fromVersion;
  while (version < CURRENT_SCHEMA_VERSION) {
    const m = migrations.find(m => m.from === version);
    if (!m) throw new Error(`No migration from schema v${version} to v${version + 1}`);
    current = m.transform(current);
    version = m.to;
  }
  return current;
}

export function needsMigration(v: number): boolean {
  return v < CURRENT_SCHEMA_VERSION;
}
```

### File open flow (main process)

```
1. Read file bytes from path
2. readContainer(bytes) → { header, encryptedBody }
3. If header.containerVersion !== CONTAINER_VERSION → throw version error
4. Verify magic (readContainer handles this)
5. Decrypt body → JSON string → parse → rawData
6. If needsMigration(header.schemaVersion) → migrate(rawData, header.schemaVersion)
7. Validate shape (runtime check key fields exist)
8. Return IpcResult<WritingEntity | Project>
```

---

## IPC CHANNELS

```typescript
// src/shared/ipc-channels.ts — use these string constants everywhere, no literals

export const IPC = {
  FILE_OPEN_ENTITY:      "file:open-entity",
  FILE_OPEN_PROJECT:     "file:open-project",
  FILE_SAVE_ENTITY:      "file:save-entity",
  FILE_SAVE_PROJECT:     "file:save-project",
  FILE_SAVE_ENTITY_AS:   "file:save-entity-as",
  FILE_SAVE_PROJECT_AS:  "file:save-project-as",
  FILE_NEW_ENTITY:       "file:new-entity",
  FILE_NEW_PROJECT:      "file:new-project",
  FILE_GET_RECENT:       "file:get-recent",
  EXPORT_PDF:            "export:pdf",
  EXPORT_RTF:            "export:rtf",
  EXPORT_FOUNTAIN:       "export:fountain",
  MENU_ACTION:           "app:menu-action",
  WINDOW_CLOSE:          "app:window-close",
} as const;

export type IpcChannel = typeof IPC[keyof typeof IPC];
```

IPC handler pattern in main process:

```typescript
ipcMain.handle(IPC.FILE_OPEN_ENTITY, async (_event, path: string) => {
  try {
    const entity = await openEntity(path);
    return { ok: true, data: entity } satisfies IpcResult<WritingEntity>;
  } catch (err) {
    return { ok: false, error: String(err) } satisfies IpcResult<WritingEntity>;
  }
});
```

Renderer invocation pattern (create a typed wrapper in `renderer/ipc.ts`):

```typescript
export async function invokeOpenEntity(path: string): Promise<WritingEntity> {
  const result: IpcResult<WritingEntity> = await window.electron.ipcRenderer.invoke(
    IPC.FILE_OPEN_ENTITY, path
  );
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
```

Create one wrapper per channel. Components call wrappers, never `invoke` directly.

---

## STATE MANAGEMENT

Four Zustand stores. Cross-store access: import the other store's hook, do not nest state.

### file-store.ts

```typescript
interface FileState {
  currentEntityPath: string | null;
  currentProjectPath: string | null;
  isDirty: boolean;
  recentFiles: Array<{ path: string; title: string; kind: "entity" | "project"; openedAt: string }>;
}

interface FileActions {
  openEntity: (path: string) => Promise<void>;
  openProject: (path: string) => Promise<void>;
  saveCurrentEntity: () => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  markDirty: () => void;
  markClean: () => void;
}
```

### navigator-store.ts

```typescript
interface NavigatorState {
  project: Project | null;
  openEntities: WritingEntity[];      // Entities currently loaded in memory
  selectedEntityId: string | null;
}

interface NavigatorActions {
  selectEntity: (id: string) => void;
  addEntityToProject: (kind: EntityKind) => WritingEntity;
  removeEntity: (id: string) => void;
  reorderEntities: (ids: string[]) => void;
  setProject: (project: Project | null) => void;
}
```

### editor-store.ts

```typescript
interface EditorState {
  activeEntity: WritingEntity | null;
  pendingContent: TipTapJSON | null;    // Live editor state, not yet saved to entity
}

interface EditorActions {
  setActiveEntity: (entity: WritingEntity | null) => void;
  setPendingContent: (content: TipTapJSON) => void;
  commitContent: () => void;            // Merges pendingContent into activeEntity
}
```

`commitContent` must: update `activeEntity.content`, update `activeEntity.updatedAt`,
recompute `activeEntity.wordCount`, and call `fileStore.markDirty()`.

### ui-store.ts

```typescript
interface UIState {
  navigatorWidth: number;      // default 260
  metadataWidth: number;       // default 280
  navigatorVisible: boolean;
  metadataVisible: boolean;
  exportModalOpen: boolean;
  activeExportOptions: ExportOptions;
}
```

Persist `navigatorWidth`, `metadataWidth`, `navigatorVisible`, `metadataVisible`
to `localStorage` on change. These are not sensitive.

---

## EDITOR SYSTEM

### Mode registry — registry.ts

```typescript
import { EntityKind, ExportFormat, TipTapJSON } from "../../shared/entity-types";
import { Extensions } from "@tiptap/core";

export interface EditorMode {
  kind: EntityKind;
  displayName: string;
  extensions: Extensions;
  defaultContent: TipTapJSON;
  availableExports: ExportFormat[];
}

const registry = new Map<EntityKind, EditorMode>();

export const registerMode = (mode: EditorMode): void => { registry.set(mode.kind, mode); };
export const getMode = (kind: EntityKind): EditorMode => {
  const m = registry.get(kind);
  if (!m) throw new Error(`No mode for: ${kind}`);
  return m;
};
export const getAllModes = (): EditorMode[] => Array.from(registry.values());
```

Register all modes in `renderer/main.tsx` before `ReactDOM.render`.

### EditorHost.tsx — required behaviour

- Receives `entityId: string | null` prop.
- When `entityId` changes: call `editorStore.commitContent()` first, then mount fresh
  TipTap instance with the new entity's mode extensions and content.
- On TipTap `onUpdate`: call `editorStore.setPendingContent(editor.getJSON())`. Debounce
  60 seconds, then call `fileStore.saveCurrentEntity()` automatically.
- Never reuse a TipTap instance across entity kind changes. Destroy and recreate.
- Use React `key={entityId}` on the TipTap wrapper to force remount.

### Prose mode (novel_chapter, letter, document)

Extensions: StarterKit, Typography, Placeholder, CharacterCount.  
No custom nodes required.

### Screenplay mode — custom TipTap nodes

Define five block nodes: `SceneHeading`, `Action`, `Character`, `Parenthetical`, `Dialogue`,
`Transition`. Each is a ProseMirror block node (not inline).

Keyboard state machine in `screenplay/keyboard.ts` — implement this table exactly:

```
Current node       Enter →             Tab →
────────────────────────────────────────────────────────
SceneHeading       Action              Action
Action             Action              Character
Character          Dialogue            Parenthetical
Parenthetical      Dialogue            Dialogue
Dialogue           Action              Character
Transition         SceneHeading        SceneHeading
```

"Enter on empty node" exception: if current node is empty and Enter is pressed,
promote to the next logical parent type (e.g. empty Dialogue → Action).

Formatting rules enforced on node type via CSS class, not inline style:
- `SceneHeading`: all-caps, bold
- `Character`: all-caps, centred, no bold
- `Parenthetical`: centred, italic, wrapped in parentheses (CSS `::before`/`::after`)
- `Transition`: right-aligned, all-caps
- `Action`, `Dialogue`: left-aligned, normal

### Stage play mode

Two custom nodes: `SpeakerName`, `StageDirection`.  
`SpeakerName`: bold, left-aligned.  
`StageDirection`: italic.  
Enter after `SpeakerName` → `Dialogue` (prose paragraph).  
Tab from `Dialogue` → `StageDirection`.

### Poetry mode

Override Enter to insert `<br>` (hard line break within paragraph), not a new paragraph.  
Shift+Enter inserts a new paragraph (new stanza).  
Use TipTap `HardBreak` extension with swapped key bindings.

### LARP prop mode

Prose mode extensions plus Image embedding (`@tiptap/extension-image`). No custom nodes.

---

## EXPORT SYSTEM

### ExportOptions type

```typescript
export interface ExportOptions {
  format: ExportFormat;
  mode: ExportMode;
  includeMetadata: boolean;
  pageSize: "a4" | "letter";
}
```

### Export modes

| Mode | Behaviour |
|---|---|
| `editing` | Include line numbers, section word counts, TOC, scene markers |
| `beta` | Clean prose, chapter headings visible, no markup or counts |
| `final` | Print-ready typography, no metadata exposed, correct screenplay margins |

### Pipeline (pipeline.ts)

```typescript
export async function exportEntity(
  entity: WritingEntity,
  options: ExportOptions
): Promise<Buffer> {
  // 1. Select serializer by format
  // 2. Serializer produces intermediate IR
  // 3. Renderer converts IR to Buffer
  // 4. Return Buffer — caller writes to disk via IPC
}
```

### PDF export — pdfmake

Use `pdfmake`. Do not use puppeteer or any headless browser.  
Define document definition objects per entity kind.  
Screenplay PDF: A4, 12pt Courier, standard Hollywood margins (left: 1.5in, others: 1in).  
Prose PDF: A4 or Letter per options, 12pt serif font (Times New Roman or similar).

### RTF export

Use `rtf-builder` npm package if it supports the required output; otherwise implement a
minimal RTF serializer. Required RTF features: paragraph styles, bold, italic, page breaks,
headers/footers. RTF files must open correctly in Microsoft Word.

### Fountain export (screenplay only)

Fountain spec: https://fountain.io/syntax  
Map TipTap nodes to Fountain tokens:

```
SceneHeading   →  INT./EXT. text in all-caps (Fountain auto-detects)
Action         →  Plain paragraph
Character      →  Character name in all-caps on its own line
Parenthetical  →  (text)
Dialogue       →  Plain paragraph after character line
Transition     →  > text (Fountain right-align marker)
```

Output is plain UTF-8 text with `.fountain` extension. Title page metadata sourced from
entity metadata fields.

---

## UI COMPONENTS

### Layout

```
<App>
  <TitleBar />                          // Custom frameless window chrome
  <MainLayout>
    <NavigatorPanel width={navigatorWidth}>
      <ProjectTree />
      <EntityList />
      <NavigatorActions />              // New entity / new project buttons
    </NavigatorPanel>
    <ResizeHandle onDrag={setNavigatorWidth} />
    <EditorPanel>
      <EditorToolbar />
      <EditorHost entityId={selectedEntityId} />
    </EditorPanel>
    <ResizeHandle onDrag={setMetadataWidth} />
    <MetadataPanel width={metadataWidth}>
      <MetadataInspector />             // Renders correct panel for entity.kind
    </MetadataPanel>
  </MainLayout>
  <StatusBar />
</App>
```

`MainLayout` uses CSS grid: `grid-template-columns: {navigatorWidth}px 4px 1fr 4px {metadataWidth}px`.

### MetadataInspector.tsx — dispatch pattern

```typescript
const MetadataInspector = () => {
  const entity = useEditorStore(s => s.activeEntity);
  if (!entity) return <EmptyState />;

  switch (entity.kind) {
    case "novel_chapter": return <NovelChapterPanel entity={entity} />;
    case "screenplay":    return <ScreenplayPanel entity={entity} />;
    case "stage_play":    return <StagePlayPanel entity={entity} />;
    case "poem":          return <PoemPanel entity={entity} />;
    case "letter":        return <LetterPanel entity={entity} />;
    case "document":      return <DocumentPanel entity={entity} />;
    case "larp_prop":     return <LarpPropPanel entity={entity} />;
    // TypeScript will error here if a kind is unhandled — do not add a default.
  }
};
```

Each metadata panel receives the typed entity and must call `navigatorStore.updateEntityMetadata`
on field change. Changes are committed immediately (no Save button in metadata panel).
Treat metadata changes as dirty for the purposes of file-save state.

### TitleBar.tsx

Use Electron frameless window (`frame: false`). Implement custom drag region via CSS
`-webkit-app-region: drag` on title bar. Provide minimise / maximise / close buttons.
Show dirty indicator (dot or asterisk) next to file name when `isDirty === true`.

### StatusBar.tsx

Display from left to right: entity kind badge | word count | word count target (if set,
show "1,234 / 5,000") | save state ("Saved" / "Unsaved changes") | schema version.

---

## KEYBOARD SHORTCUTS

Implement these globally via Electron's `globalShortcut` or `Menu` accelerators.

| Shortcut | Action |
|---|---|
| Ctrl+S | Save current entity/project |
| Ctrl+Shift+S | Save as |
| Ctrl+O | Open file |
| Ctrl+N | New entity (show kind picker) |
| Ctrl+Shift+N | New project |
| Ctrl+E | Open export modal |
| Ctrl+\ | Toggle navigator panel |
| Ctrl+Shift+\ | Toggle metadata panel |
| F11 | Distraction-free mode (hide both panels) |

---

## AUTO-SAVE

- Auto-save triggers: focus leaves the editor panel; 60 seconds of inactivity.
- Auto-save writes to the current file path if one exists.
- If no path exists (new unsaved entity), auto-save does nothing and leaves `isDirty: true`.
- Auto-save failures are non-fatal: log to console, show transient error in StatusBar,
  do not crash or show a modal.

---

## WINDOW STATE

On close, persist to a JSON file in `app.getPath('userData')`:

```typescript
interface WindowState {
  x: number; y: number;
  width: number; height: number;
  isMaximized: boolean;
}
```

Restore on next launch. If saved state is off-screen (monitor disconnected), reset to
centred 1280×800.

---

## PACKAGE.JSON SCRIPTS

```json
{
  "scripts": {
    "dev":   "vite-electron dev",
    "build": "tsc -p tsconfig.main.json && vite build && electron-builder",
    "preview": "electron dist-electron/index.js"
  }
}
```

---

## ELECTRON-BUILDER.YML

```yaml
appId: com.inkwell.app
productName: Inkwell
copyright: Private — not for distribution
directories:
  output: dist
win:
  target:
    - target: nsis
      arch: [x64]
  icon: assets/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  installerIcon: assets/icon.ico
  uninstallerIcon: assets/icon.ico
files:
  - dist-electron/**
  - dist-renderer/**
  - package.json
asarUnpack:
  - "**/*.node"
```

---

## IMPLEMENTATION PHASES

Build in this order. Do not start a phase until the previous compiles and runs.

### Phase 1 — Skeleton (target: app window opens)
1. `package.json` with all dependencies
2. `vite.config.ts`, `tsconfig.json`, `tsconfig.main.json`, `electron-builder.yml`
3. `src/main/index.ts` — creates BrowserWindow, loads renderer
4. `src/main/window.ts` — window factory
5. `src/main/menu.ts` — minimal File menu
6. `src/shared/` — all shared types and constants
7. `src/renderer/index.html`, `main.tsx`, `App.tsx` — renders "Inkwell" text only
8. Confirm: `npm run dev` opens a window; `npm run build` produces an `.exe`

### Phase 2 — File Format (target: save and load a file)
1. `encryption.ts`
2. `container.ts`
3. `migration.ts`
4. `file-handlers.ts` IPC handlers (open entity, save entity)
5. Renderer IPC wrapper functions
6. `file-store.ts`
7. Confirm: can create, save, close, and reopen a `NovelChapterEntity`

### Phase 3 — UI Shell (target: three-panel layout visible)
1. `MainLayout.tsx` with CSS grid
2. `NavigatorPanel.tsx`, `EditorPanel.tsx`, `MetadataPanel.tsx` (empty shells)
3. `TitleBar.tsx`
4. `StatusBar.tsx`
5. `ResizeHandle.tsx`
6. `ui-store.ts`
7. `navigator-store.ts`
8. Confirm: layout renders, panels resize, widths persist across reload

### Phase 4 — Core Editor (target: write and save prose)
1. `registry.ts`
2. `prose/` editor mode
3. `EditorHost.tsx`
4. `EditorToolbar.tsx` (bold, italic, heading buttons)
5. `editor-store.ts`
6. `NovelChapterPanel.tsx` metadata panel
7. `MetadataInspector.tsx` dispatch
8. `EntityList.tsx` — shows open entities, click to switch
9. Auto-save implementation
10. Confirm: create novel chapter, write content, set metadata, save, reload, data intact

### Phase 5 — Remaining Editor Modes
1. `screenplay/` — custom nodes + keyboard state machine
2. `stage-play/`
3. `poetry/`
4. `larp-prop/`
5. Remaining metadata panels
6. Confirm: each mode opens; screenplay Tab/Enter cycling works correctly

### Phase 6 — Projects
1. `ProjectTree.tsx`
2. `NavigatorActions.tsx`
3. Project IPC handlers (`file-handlers.ts`)
4. Project save/load in `file-store.ts`
5. Entity embedding vs external refs
6. Confirm: create project, add entities, save as `.inkwellp`, reload

### Phase 7 — Export
1. `pipeline.ts`
2. `pdf.ts` — prose entities first, then screenplay with correct margins
3. `rtf.ts`
4. `fountain.ts`
5. Export modal UI
6. `export-handlers.ts` IPC
7. Confirm: export novel chapter to PDF in all three modes; export screenplay to Fountain

### Phase 8 — Polish
1. Global keyboard shortcuts
2. Recent files list
3. Window state persistence
4. `letter` and `document` editor modes
5. Distraction-free mode (F11)
6. Error boundaries in renderer
7. Confirm: full user flow from new entity → write → save → export works end to end

---

## INVARIANTS — NEVER VIOLATE THESE

- Never call `fs`, `path`, `crypto`, or any Node built-in from the renderer process.
- Never pass raw `Error` objects across the IPC boundary. Serialise to string first.
- Never store plaintext entity content anywhere outside an encrypted container (no
  unencrypted autosave temp files, no clipboard writes of raw JSON).
- Never reuse a TipTap editor instance across entity kind changes.
- Never modify existing migration entries. Append only.
- Never hard-code file extension strings — use constants.
- Never show a blocking modal for auto-save errors. StatusBar notification only.
- Never skip the `commitContent()` call before switching active entities. Data loss results.
- `WritingEntity` switch statements must have no `default` branch. Exhaustiveness is
  the mechanism for catching unhandled new entity kinds at compile time.

---

*End of PRD*
