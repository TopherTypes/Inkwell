import { create } from 'zustand';
import type { ExportOptions } from '@shared/entity-types';

interface UIState {
  navigatorWidth: number;
  metadataWidth: number;
  navigatorVisible: boolean;
  metadataVisible: boolean;
  exportModalOpen: boolean;
  activeExportOptions: ExportOptions;
}

interface UIActions {
  setNavigatorWidth: (width: number) => void;
  setMetadataWidth: (width: number) => void;
  setNavigatorVisible: (visible: boolean) => void;
  setMetadataVisible: (visible: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setActiveExportOptions: (options: ExportOptions) => void;
}

type UIStore = UIState & UIActions;

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'pdf',
  mode: 'final',
  includeMetadata: false,
  pageSize: 'a4',
};

export const useUIStore = create<UIStore>((set) => ({
  navigatorWidth: 260,
  metadataWidth: 280,
  navigatorVisible: true,
  metadataVisible: true,
  exportModalOpen: false,
  activeExportOptions: DEFAULT_EXPORT_OPTIONS,

  setNavigatorWidth: (width: number) => {
    set({ navigatorWidth: width });
    localStorage.setItem('navigatorWidth', String(width));
  },

  setMetadataWidth: (width: number) => {
    set({ metadataWidth: width });
    localStorage.setItem('metadataWidth', String(width));
  },

  setNavigatorVisible: (visible: boolean) => {
    set({ navigatorVisible: visible });
    localStorage.setItem('navigatorVisible', String(visible));
  },

  setMetadataVisible: (visible: boolean) => {
    set({ metadataVisible: visible });
    localStorage.setItem('metadataVisible', String(visible));
  },

  setExportModalOpen: (open: boolean) => {
    set({ exportModalOpen: open });
  },

  setActiveExportOptions: (options: ExportOptions) => {
    set({ activeExportOptions: options });
  },
}));

// Load persisted values from localStorage
const savedNavigatorWidth = localStorage.getItem('navigatorWidth');
const savedMetadataWidth = localStorage.getItem('metadataWidth');
const savedNavigatorVisible = localStorage.getItem('navigatorVisible');
const savedMetadataVisible = localStorage.getItem('metadataVisible');

if (savedNavigatorWidth) {
  useUIStore.setState({ navigatorWidth: parseInt(savedNavigatorWidth) });
}
if (savedMetadataWidth) {
  useUIStore.setState({ metadataWidth: parseInt(savedMetadataWidth) });
}
if (savedNavigatorVisible !== null) {
  useUIStore.setState({ navigatorVisible: savedNavigatorVisible === 'true' });
}
if (savedMetadataVisible !== null) {
  useUIStore.setState({ metadataVisible: savedMetadataVisible === 'true' });
}
