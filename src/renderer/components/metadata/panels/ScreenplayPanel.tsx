import type { ScreenplayEntity } from '@shared/entity-types';

interface Props {
  entity: ScreenplayEntity;
}

export function ScreenplayPanel({ entity }: Props) {
  return <div style={{ padding: '16px' }}>Screenplay Metadata</div>;
}
