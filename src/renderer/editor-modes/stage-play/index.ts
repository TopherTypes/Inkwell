import StarterKit from '@tiptap/starter-kit';
import type { EditorMode } from '../registry';

// TODO: Implement custom stage play nodes
export const stagePlayMode: EditorMode = {
  kind: 'stage_play',
  displayName: 'Stage Play',
  extensions: [StarterKit],
  defaultContent: {
    type: 'doc',
    content: [],
  },
  availableExports: ['pdf', 'rtf'],
};
