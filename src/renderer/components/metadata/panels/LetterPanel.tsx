import type { LetterEntity } from '@shared/entity-types';

interface Props {
  entity: LetterEntity;
}

export function LetterPanel({ entity }: Props) {
  return <div style={{ padding: '16px' }}>Letter Metadata</div>;
}
