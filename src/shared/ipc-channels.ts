export const IPC = {
  FILE_OPEN_ENTITY:      "file:open-entity",
  FILE_OPEN_PROJECT:     "file:open-project",
  FILE_SAVE_ENTITY:      "file:save-entity",
  FILE_SAVE_PROJECT:     "file:save-project",
  FILE_SAVE_ENTITY_AS:   "file:save-entity-as",
  FILE_SAVE_PROJECT_AS:  "file:save-project-as",
  FILE_NEW_ENTITY:       "file:new-entity",
  FILE_NEW_PROJECT:      "file:new-project",
  FILE_GET_RECENT:       "file:get-recent",
  EXPORT_PDF:            "export:pdf",
  EXPORT_RTF:            "export:rtf",
  EXPORT_FOUNTAIN:       "export:fountain",
  MENU_ACTION:           "app:menu-action",
  WINDOW_CLOSE:          "app:window-close",
} as const;

export type IpcChannel = typeof IPC[keyof typeof IPC];
