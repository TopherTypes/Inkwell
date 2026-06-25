import StarterKit from '@tiptap/starter-kit';
import HardBreak from '@tiptap/extension-hard-break';
import type { EditorMode } from '../registry';

export const poetryMode: EditorMode = {
  kind: 'poem',
  displayName: 'Poetry',
  extensions: [StarterKit, HardBreak.configure()],
  defaultContent: {
    type: 'doc',
    content: [],
  },
  availableExports: ['pdf', 'rtf'],
};
