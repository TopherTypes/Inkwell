import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import type { EditorMode } from '../registry';

export const larpPropMode: EditorMode = {
  kind: 'larp_prop',
  displayName: 'LARP Prop',
  extensions: [StarterKit, Image.configure()],
  defaultContent: {
    type: 'doc',
    content: [],
  },
  availableExports: ['pdf', 'rtf'],
};
