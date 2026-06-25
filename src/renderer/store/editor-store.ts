import { create } from 'zustand';
import type { WritingEntity, TipTapJSON } from '@shared/entity-types';
import { useFileStore } from './file-store';

interface EditorState {
  activeEntity: WritingEntity | null;
  pendingContent: TipTapJSON | null;
}

interface EditorActions {
  setActiveEntity: (entity: WritingEntity | null) => void;
  setPendingContent: (content: TipTapJSON) => void;
  commitContent: () => void;
}

type EditorStore = EditorState & EditorActions;

export const useEditorStore = create<EditorStore>((set) => ({
  activeEntity: null,
  pendingContent: null,

  setActiveEntity: (entity: WritingEntity | null) => {
    set({ activeEntity: entity });
  },

  setPendingContent: (content: TipTapJSON) => {
    set({ pendingContent: content });
  },

  commitContent: () => {
    set((state) => {
      if (state.activeEntity && state.pendingContent) {
        const updated = {
          ...state.activeEntity,
          content: state.pendingContent,
          updatedAt: new Date().toISOString(),
          wordCount: calculateWordCount(state.pendingContent),
        };
        useFileStore.getState().markDirty();
        return { activeEntity: updated };
      }
      return state;
    });
  },
}));

function calculateWordCount(content: TipTapJSON): number {
  // TODO: Implement word count calculation from TipTap JSON
  return 0;
}
