import type { StagePlayEntity } from '@shared/entity-types';

interface Props {
  entity: StagePlayEntity;
}

export function StagePlayPanel({ entity }: Props) {
  return <div style={{ padding: '16px' }}>Stage Play Metadata</div>;
}
