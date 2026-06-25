import { useEditorStore } from '../../store/editor-store';
import { NovelChapterPanel } from './panels/NovelChapterPanel';
import { ScreenplayPanel } from './panels/ScreenplayPanel';
import { StagePlayPanel } from './panels/StagePlayPanel';
import { PoemPanel } from './panels/PoemPanel';
import { LetterPanel } from './panels/LetterPanel';
import { DocumentPanel } from './panels/DocumentPanel';
import { LarpPropPanel } from './panels/LarpPropPanel';

export function MetadataInspector() {
  const entity = useEditorStore((s) => s.activeEntity);

  if (!entity) {
    return <div style={{ padding: '16px' }}>No entity selected</div>;
  }

  switch (entity.kind) {
    case 'novel_chapter':
      return <NovelChapterPanel entity={entity} />;
    case 'screenplay':
      return <ScreenplayPanel entity={entity} />;
    case 'stage_play':
      return <StagePlayPanel entity={entity} />;
    case 'poem':
      return <PoemPanel entity={entity} />;
    case 'letter':
      return <LetterPanel entity={entity} />;
    case 'document':
      return <DocumentPanel entity={entity} />;
    case 'larp_prop':
      return <LarpPropPanel entity={entity} />;
  }
}
