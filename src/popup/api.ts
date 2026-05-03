import type { Prompt, Settings, MessageResponse } from "@/shared/types";

async function send<T>(message: object): Promise<T> {
  const response = (await chrome.runtime.sendMessage(message)) as MessageResponse<T>;
  if (!response.success) throw new Error(response.error);
  return response.data as T;
}

export const api = {
  getPrompts: () => send<Prompt[]>({ type: "GET_ALL_PROMPTS" }),

  savePrompt: (
    payload: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "usageCount">
  ) => send<Prompt>({ type: "SAVE_PROMPT", payload }),

  updatePrompt: (payload: Partial<Prompt> & { id: string }) =>
    send<Prompt>({ type: "UPDATE_PROMPT", payload }),

  deletePrompt: (id: string) =>
    send<null>({ type: "DELETE_PROMPT", payload: { id } }),

  incrementUsage: (id: string) =>
    send<null>({ type: "INCREMENT_USAGE", payload: { id } }),

  getSettings: () => send<Settings>({ type: "GET_SETTINGS" }),

  updateSettings: (payload: Partial<Settings>) =>
    send<Settings>({ type: "UPDATE_SETTINGS", payload }),

  insertPrompt: (text: string) =>
    send<null>({ type: "INSERT_PROMPT", payload: { text } }),
};
