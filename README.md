# Inkwell — A Desktop Writing Application

Inkwell is a distraction-free desktop writing application for Windows 11. Manage multiple writing projects (novels, screenplays, stage plays, poems, letters, documents, LARP props) in an intuitive three-panel interface with an encrypted local file format.

**Note:** This is a personal tool. No cloud sync, no account required, no telemetry. Your writing stays on your machine.

---

## Quick Start

### For Users: Installation

**System Requirements:**
- Windows 11 (x64)
- ~200 MB free disk space
- No admin rights required

**Installation:**

1. Download the latest `.exe` installer from the [Releases](../../releases) page
2. Run the installer and follow the prompts
3. Inkwell will open automatically after installation
4. Create a new entity or open an existing `.inkwell` file to get started

**Uninstallation:**
- Open Settings → Apps → Apps & features
- Find "Inkwell" and click Uninstall

---

### For Developers: Building from Source

#### Prerequisites

You'll need:
- **Node.js** (v18 or higher) — [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, only if cloning the repo)

**Check your installation:**
```bash
node --version  # Should show v18 or higher
npm --version
```

#### Step 1: Get the Source Code

**Option A: Clone the repository**
```bash
git clone https://github.com/tophertypes/inkwell.git
cd inkwell
```

**Option B: Download as ZIP**
- Click the green "Code" button on GitHub → "Download ZIP"
- Extract the folder
- Open Command Prompt in that folder

#### Step 2: Install Dependencies

In the `inkwell` folder, run:
```bash
npm install
```

This downloads all required libraries (~500 MB). It may take 2–5 minutes. **Be patient — this is normal.**

#### Step 3: Build the Application

```bash
npm run build
```

This compiles TypeScript, bundles the React UI, and generates a Windows installer. **First build takes 3–5 minutes.**

When complete, you'll see a message like:
```
Building for x64
  • electron-builder version 25.0.0
  • Writing effective config file to ...
  • Building nsis installer
  • Installer done. It's in dist/Inkwell.exe
```

#### Step 4: Run the Installer

Navigate to the `dist` folder and double-click `Inkwell.exe` to install. Then launch Inkwell from your Start menu.

**That's it!** You now have a development build.

---

## Development Workflow

### Running in Development Mode

For a faster iteration cycle (auto-reload on file changes):

```bash
npm run dev
```

This starts the dev server and opens Inkwell with hot reloading. Changes to TypeScript and React files reflect immediately. **Leave this running while you work.**

### Code Quality Checks

**Type checking:**
```bash
npm run typecheck
```

Always run this before committing changes.

### Project Structure

```
inkwell/
├── src/
│   ├── main/           # Electron main process (file I/O, IPC, encryption)
│   ├── renderer/       # React UI
│   └── shared/         # Types and constants shared between main and renderer
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript config for renderer
├── tsconfig.main.json  # TypeScript config for main process
├── electron-builder.yml # Windows installer config
└── vite.config.ts      # Vite bundler config
```

### Important Files

- **`CLAUDE.md`** — Complete product specification (read this first)
- **`src/shared/entity-types.ts`** — Data model for all writing types
- **`src/main/file-format/`** — AES-256-GCM encryption and `.inkwell` file format

---

## Features

### Supported Writing Types
- **Novel chapters** — Track chapter number, POV, tension, story arc position
- **Screenplays** — Fountain export, formatting rules for scenes, dialogue, transitions
- **Stage plays** — Speaker names, stage directions
- **Poems** — Hard line breaks, stanza support
- **Letters** — In-character or regular correspondence
- **Documents** — General prose with metadata
- **LARP props** — Facsimiles, in-character documents

### Editor Capabilities
- Rich text formatting (bold, italic, headings)
- Word count tracking with targets
- Auto-save (saves 60 seconds after last edit)
- Tagging and metadata per entity
- Support for images in LARP prop mode

### Export Formats
- **PDF** — For all entity types (editing, beta, final modes)
- **RTF** — For prose entities (opens in Microsoft Word)
- **Fountain** — For screenplays (standard screenplay format)

### File Formats
- **`.inkwell`** — Single encrypted entity file (AES-256-GCM)
- **`.inkwellp`** — Encrypted project file (contains multiple entities)

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Ctrl+S</kbd> | Save current file |
| <kbd>Ctrl+Shift+S</kbd> | Save as |
| <kbd>Ctrl+O</kbd> | Open file |
| <kbd>Ctrl+N</kbd> | New entity |
| <kbd>Ctrl+Shift+N</kbd> | New project |
| <kbd>Ctrl+E</kbd> | Export |
| <kbd>Ctrl+\</kbd> | Toggle navigator panel |
| <kbd>Ctrl+Shift+\</kbd> | Toggle metadata panel |
| <kbd>F11</kbd> | Distraction-free mode |

---

## Security & Privacy

- **Encryption:** Files are encrypted with AES-256-GCM (military-grade). Encryption key is derived from a fixed application secret.
- **No network access:** Inkwell never phones home, never syncs, never uploads.
- **No telemetry:** Your writing stays on your machine.
- **File location:** Windows only restricts read/write access to your user folder by default. Save files wherever you like.

---

## Troubleshooting

### "npm install" fails
- Ensure Node.js is installed: `node --version`
- Try deleting `node_modules` folder and `package-lock.json`, then run `npm install` again
- If behind a corporate proxy, configure npm: `npm config set https-proxy [proxy-url]`

### "npm run build" produces no `.exe`
- Check console output for TypeScript errors
- Ensure `npm run typecheck` passes first
- On some systems, closing other apps frees up resources for the 5-minute build

### App crashes on launch
- Delete the local app data: `%APPDATA%\Inkwell`
- Reinstall via the `.exe` installer

### Can't open old `.inkwell` files
- Verify the file extension is correct (should be `.inkwell` or `.inkwellp`)
- Ensure it's not corrupted (try opening in a hex editor; should start with bytes `49 4E 4B 57` for "INKW")

### Still stuck?
- Open an issue on [GitHub](https://github.com/tophertypes/inkwell/issues)
- Include your Windows version (`winver`), Node.js version (`node --version`), and the full error message from the console

---

## Contributing

Development setup:
```bash
git clone https://github.com/tophertypes/inkwell.git
cd inkwell
npm install
npm run dev
```

Before submitting changes:
```bash
npm run typecheck  # Catch TypeScript errors
```

See `CLAUDE.md` for the full product specification and architectural guidelines.

---

## License

Personal tool — not for public distribution.

---

## Credits

Built with:
- **Electron 33** — Desktop framework
- **React 18** — UI framework
- **TipTap 2** — Rich text editor
- **Zustand 5** — State management
- **Vite** — Build tool

For detailed credits and library info, see `package.json`.
