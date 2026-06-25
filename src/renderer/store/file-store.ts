import { create } from 'zustand';

interface RecentFile {
  path: string;
  title: string;
  kind: 'entity' | 'project';
  openedAt: string;
}

interface FileState {
  currentEntityPath: string | null;
  currentProjectPath: string | null;
  isDirty: boolean;
  recentFiles: RecentFile[];
}

interface FileActions {
  openEntity: (path: string) => Promise<void>;
  openProject: (path: string) => Promise<void>;
  saveCurrentEntity: () => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  markDirty: () => void;
  markClean: () => void;
}

type FileStore = FileState & FileActions;

export const useFileStore = create<FileStore>((set) => ({
  currentEntityPath: null,
  currentProjectPath: null,
  isDirty: false,
  recentFiles: [],

  openEntity: async (path: string) => {
    // TODO: Implement entity opening via IPC
    set({ currentEntityPath: path });
  },

  openProject: async (path: string) => {
    // TODO: Implement project opening via IPC
    set({ currentProjectPath: path });
  },

  saveCurrentEntity: async () => {
    // TODO: Implement entity saving via IPC
  },

  saveCurrentProject: async () => {
    // TODO: Implement project saving via IPC
  },

  markDirty: () => {
    set({ isDirty: true });
  },

  markClean: () => {
    set({ isDirty: false });
  },
}));
