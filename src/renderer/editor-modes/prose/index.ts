import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import type { EditorMode } from '../registry';

export const proseMode: EditorMode = {
  kind: 'novel_chapter',
  displayName: 'Prose',
  extensions: [
    StarterKit,
    Typography,
    Placeholder.configure({
      placeholder: 'Start writing...',
    }),
    CharacterCount.configure({
      limit: null,
    }),
  ],
  defaultContent: {
    type: 'doc',
    content: [],
  },
  availableExports: ['pdf', 'rtf'],
};
