export type PromptSource =
  | "manual"
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "grok"
  | "other";

export interface Prompt {
  id: string;
  text: string;
  title: string;
  category: string;
  tags: string[];
  source: PromptSource;
  usageCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  syncEnabled: boolean;
  driveBackupEnabled: boolean;
  theme: "light" | "dark" | "system";
  lastSyncedAt: number | null;
}

export interface AppState {
  prompts: Prompt[];
  categories: string[];
  settings: Settings;
}

export const DEFAULT_CATEGORIES = [
  "Writing",
  "Coding",
  "Research",
  "Marketing",
  "Design",
  "Learning",
  "Business",
  "Personal",
];

export const DEFAULT_SETTINGS: Settings = {
  syncEnabled: false,
  driveBackupEnabled: false,
  theme: "system",
  lastSyncedAt: null,
};

export type MessageType =
  | { type: "SAVE_PROMPT"; payload: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "usageCount"> }
  | { type: "GET_ALL_PROMPTS" }
  | { type: "DELETE_PROMPT"; payload: { id: string } }
  | { type: "UPDATE_PROMPT"; payload: Partial<Prompt> & { id: string } }
  | { type: "INCREMENT_USAGE"; payload: { id: string } }
  | { type: "INSERT_PROMPT"; payload: { text: string } }
  | { type: "GET_SETTINGS" }
  | { type: "UPDATE_SETTINGS"; payload: Partial<Settings> };

export type MessageResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
