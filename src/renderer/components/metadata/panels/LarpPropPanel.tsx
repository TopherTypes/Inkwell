import type { LarpPropEntity } from '@shared/entity-types';

interface Props {
  entity: LarpPropEntity;
}

export function LarpPropPanel({ entity }: Props) {
  return <div style={{ padding: '16px' }}>LARP Prop Metadata</div>;
}
