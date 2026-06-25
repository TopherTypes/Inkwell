interface EditorHostProps {
  entityId: string | null;
}

export function EditorHost({ entityId }: EditorHostProps) {
  return <div key={entityId}>Editor Host</div>;
}
