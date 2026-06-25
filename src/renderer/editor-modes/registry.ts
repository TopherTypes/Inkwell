import { Extensions } from '@tiptap/core';
import type { EntityKind, ExportFormat, TipTapJSON } from '@shared/entity-types';

export interface EditorMode {
  kind: EntityKind;
  displayName: string;
  extensions: Extensions;
  defaultContent: TipTapJSON;
  availableExports: ExportFormat[];
}

const registry = new Map<EntityKind, EditorMode>();

export const registerMode = (mode: EditorMode): void => {
  registry.set(mode.kind, mode);
};

export const getMode = (kind: EntityKind): EditorMode => {
  const m = registry.get(kind);
  if (!m) throw new Error(`No mode for: ${kind}`);
  return m;
};

export const getAllModes = (): EditorMode[] => Array.from(registry.values());
