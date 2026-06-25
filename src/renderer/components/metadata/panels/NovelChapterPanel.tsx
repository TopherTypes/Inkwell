import type { NovelChapterEntity } from '@shared/entity-types';

interface Props {
  entity: NovelChapterEntity;
}

export function NovelChapterPanel({ entity }: Props) {
  return <div style={{ padding: '16px' }}>Novel Chapter Metadata</div>;
}
