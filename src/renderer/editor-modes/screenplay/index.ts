import StarterKit from '@tiptap/starter-kit';
import type { EditorMode } from '../registry';

// TODO: Implement custom screenplay nodes
export const screenplayMode: EditorMode = {
  kind: 'screenplay',
  displayName: 'Screenplay',
  extensions: [StarterKit],
  defaultContent: {
    type: 'doc',
    content: [],
  },
  availableExports: ['pdf', 'fountain'],
};
