export type EntityKind = "novel_chapter" | "screenplay" | "stage_play" | "poem" | "letter" | "document" | "larp_prop";
export type TipTapJSON = {
    type: "doc";
    content: unknown[];
};
export type ExportFormat = "pdf" | "rtf" | "fountain";
export type ExportMode = "editing" | "beta" | "final";
export interface BaseEntity {
    id: string;
    kind: EntityKind;
    title: string;
    createdAt: string;
    updatedAt: string;
    schemaVersion: number;
    content: TipTapJSON;
    tags: string[];
    wordCount: number;
}
export interface NovelChapterEntity extends BaseEntity {
    kind: "novel_chapter";
    metadata: {
        chapterNumber?: number;
        pointOfView?: string;
        tension?: 1 | 2 | 3 | 4 | 5;
        arcPosition?: "setup" | "rising" | "climax" | "falling" | "resolution";
        characters: string[];
        location?: string;
        timelineDate?: string;
        wordCountTarget?: number;
        notes?: string;
    };
}
export interface ScreenplayEntity extends BaseEntity {
    kind: "screenplay";
    metadata: {
        format?: "feature" | "short" | "tv_pilot" | "tv_episode";
        genre?: string;
        logline?: string;
        draftVersion?: string;
        characters: string[];
        estimatedRuntime?: number;
        notes?: string;
    };
}
export interface StagePlayEntity extends BaseEntity {
    kind: "stage_play";
    metadata: {
        actNumber?: number;
        sceneNumber?: number;
        setting?: string;
        characters: string[];
        stageDirectionsStyle?: "inline" | "block";
        notes?: string;
    };
}
export interface PoemEntity extends BaseEntity {
    kind: "poem";
    metadata: {
        form?: string;
        rhymeScheme?: string;
        meterNotes?: string;
        collection?: string;
        notes?: string;
    };
}
export interface LetterEntity extends BaseEntity {
    kind: "letter";
    metadata: {
        recipient?: string;
        sender?: string;
        date?: string;
        isInCharacter?: boolean;
        characterSender?: string;
        characterRecipient?: string;
        notes?: string;
    };
}
export interface DocumentEntity extends BaseEntity {
    kind: "document";
    metadata: {
        documentType?: string;
        version?: string;
        status?: "draft" | "review" | "final";
        author?: string;
        notes?: string;
    };
}
export interface LarpPropEntity extends BaseEntity {
    kind: "larp_prop";
    metadata: {
        system?: string;
        propType?: string;
        inCharacterDate?: string;
        author?: string;
        recipient?: string;
        isFacsimile?: boolean;
        materialNotes?: string;
        notes?: string;
    };
}
export type WritingEntity = NovelChapterEntity | ScreenplayEntity | StagePlayEntity | PoemEntity | LetterEntity | DocumentEntity | LarpPropEntity;
export interface EntityRef {
    id: string;
    kind: EntityKind;
    title: string;
    order: number;
    externalPath?: string;
}
export interface Project {
    id: string;
    title: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    schemaVersion: number;
    entities: EntityRef[];
    embeddedEntities: WritingEntity[];
    metadata: {
        author?: string;
        genre?: string;
        status?: "active" | "complete" | "archived";
        notes?: string;
    };
}
export interface FileHeader {
    containerVersion: number;
    fileKind: "entity" | "project";
    entityKind?: EntityKind;
    id: string;
    title: string;
    schemaVersion: number;
    createdAt: string;
    updatedAt: string;
}
export type IpcResult<T> = {
    ok: true;
    data: T;
} | {
    ok: false;
    error: string;
};
export interface ExportOptions {
    format: ExportFormat;
    mode: ExportMode;
    includeMetadata: boolean;
    pageSize: "a4" | "letter";
}
