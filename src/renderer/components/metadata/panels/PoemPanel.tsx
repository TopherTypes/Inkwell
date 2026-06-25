import type { PoemEntity } from '@shared/entity-types';

interface Props {
  entity: PoemEntity;
}

export function PoemPanel({ entity }: Props) {
  return <div style={{ padding: '16px' }}>Poem Metadata</div>;
}
