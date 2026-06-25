export declare const IPC: {
    readonly FILE_OPEN_ENTITY: "file:open-entity";
    readonly FILE_OPEN_PROJECT: "file:open-project";
    readonly FILE_SAVE_ENTITY: "file:save-entity";
    readonly FILE_SAVE_PROJECT: "file:save-project";
    readonly FILE_SAVE_ENTITY_AS: "file:save-entity-as";
    readonly FILE_SAVE_PROJECT_AS: "file:save-project-as";
    readonly FILE_NEW_ENTITY: "file:new-entity";
    readonly FILE_NEW_PROJECT: "file:new-project";
    readonly FILE_GET_RECENT: "file:get-recent";
    readonly EXPORT_PDF: "export:pdf";
    readonly EXPORT_RTF: "export:rtf";
    readonly EXPORT_FOUNTAIN: "export:fountain";
    readonly MENU_ACTION: "app:menu-action";
    readonly WINDOW_CLOSE: "app:window-close";
};
export type IpcChannel = typeof IPC[keyof typeof IPC];
