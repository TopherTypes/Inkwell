import { create } from 'zustand';
import type { WritingEntity, Project, EntityKind } from '@shared/entity-types';

interface NavigatorState {
  project: Project | null;
  openEntities: WritingEntity[];
  selectedEntityId: string | null;
}

interface NavigatorActions {
  selectEntity: (id: string) => void;
  addEntityToProject: (kind: EntityKind) => WritingEntity;
  removeEntity: (id: string) => void;
  reorderEntities: (ids: string[]) => void;
  setProject: (project: Project | null) => void;
}

type NavigatorStore = NavigatorState & NavigatorActions;

export const useNavigatorStore = create<NavigatorStore>((set) => ({
  project: null,
  openEntities: [],
  selectedEntityId: null,

  selectEntity: (id: string) => {
    set({ selectedEntityId: id });
  },

  addEntityToProject: (kind: EntityKind) => {
    // TODO: Implement entity creation
    const entity = {} as WritingEntity;
    set((state) => ({
      openEntities: [...state.openEntities, entity],
      selectedEntityId: entity.id,
    }));
    return entity;
  },

  removeEntity: (id: string) => {
    set((state) => ({
      openEntities: state.openEntities.filter((e) => e.id !== id),
      selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId,
    }));
  },

  reorderEntities: (ids: string[]) => {
    set((state) => {
      const orderMap = new Map(ids.map((id, i) => [id, i]));
      const sorted = [...state.openEntities].sort((a, b) => {
        const aOrder = orderMap.get(a.id) ?? Infinity;
        const bOrder = orderMap.get(b.id) ?? Infinity;
        return aOrder - bOrder;
      });
      return { openEntities: sorted };
    });
  },

  setProject: (project: Project | null) => {
    set({ project });
  },
}));
