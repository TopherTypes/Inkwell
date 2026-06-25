import type { DocumentEntity } from '@shared/entity-types';

interface Props {
  entity: DocumentEntity;
}

export function DocumentPanel({ entity }: Props) {
  return <div style={{ padding: '16px' }}>Document Metadata</div>;
}
