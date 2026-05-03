import { nanoid } from "nanoid";
import type { Prompt, AppState, Settings, PromptSource } from "@/shared/types";
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "@/shared/types";

const STORAGE_KEY = "prompt_gallery_state";

function generateTitle(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, " ");
  return cleaned.length > 60 ? cleaned.substring(0, 57) + "..." : cleaned;
}

async function getState(): Promise<AppState> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY] as AppState | undefined;
      resolve(
        stored ?? {
          prompts: [],
          categories: [...DEFAULT_CATEGORIES],
          settings: { ...DEFAULT_SETTINGS },
        }
      );
    });
  });
}

async function setState(state: AppState): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: state }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

export async function getAllPrompts(): Promise<Prompt[]> {
  const state = await getState();
  return state.prompts;
}

export async function savePrompt(
  data: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "usageCount">
): Promise<Prompt> {
  const state = await getState();
  const now = Date.now();
  const prompt: Prompt = {
    ...data,
    id: nanoid(),
    title: data.title || generateTitle(data.text),
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  state.prompts.unshift(prompt);
  // Auto-register the category so it always appears in the category list
  if (data.category && !state.categories.includes(data.category)) {
    state.categories.push(data.category);
  }
  await setState(state);
  return prompt;
}

export async function updatePrompt(
  id: string,
  updates: Partial<Omit<Prompt, "id" | "createdAt">>
): Promise<Prompt | null> {
  const state = await getState();
  const index = state.prompts.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated: Prompt = {
    ...state.prompts[index],
    ...updates,
    updatedAt: Date.now(),
  };
  if (updates.text && !updates.title) {
    updated.title = generateTitle(updates.text);
  }
  state.prompts[index] = updated;
  await setState(state);
  return updated;
}

export async function deletePrompt(id: string): Promise<void> {
  const state = await getState();
  state.prompts = state.prompts.filter((p) => p.id !== id);
  await setState(state);
}

export async function incrementUsage(id: string): Promise<void> {
  const state = await getState();
  const prompt = state.prompts.find((p) => p.id === id);
  if (prompt) {
    prompt.usageCount += 1;
    prompt.updatedAt = Date.now();
    await setState(state);
  }
}

export async function getCategories(): Promise<string[]> {
  const state = await getState();
  return state.categories;
}

export async function addCategory(name: string): Promise<string[]> {
  const state = await getState();
  const trimmed = name.trim();
  if (trimmed && !state.categories.includes(trimmed)) {
    state.categories.push(trimmed);
    await setState(state);
  }
  return state.categories;
}

export async function deleteCategory(name: string): Promise<string[]> {
  const state = await getState();
  state.categories = state.categories.filter((c) => c !== name);
  state.prompts = state.prompts.map((p) =>
    p.category === name ? { ...p, category: "" } : p
  );
  await setState(state);
  return state.categories;
}

export async function renameCategory(oldName: string, newName: string): Promise<string[]> {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return getCategories();
  const state = await getState();
  if (state.categories.includes(trimmed)) return state.categories;
  const idx = state.categories.indexOf(oldName);
  if (idx !== -1) state.categories[idx] = trimmed;
  else state.categories.push(trimmed);
  state.prompts = state.prompts.map((p) =>
    p.category === oldName ? { ...p, category: trimmed } : p
  );
  await setState(state);
  return state.categories;
}

export async function getSettings(): Promise<Settings> {
  const state = await getState();
  return state.settings;
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const state = await getState();
  state.settings = { ...state.settings, ...updates };
  await setState(state);
  return state.settings;
}

export async function exportData(): Promise<string> {
  const state = await getState();
  return JSON.stringify(state, null, 2);
}

export async function importData(json: string): Promise<void> {
  const parsed = JSON.parse(json) as Partial<AppState>;
  if (!Array.isArray(parsed.prompts)) {
    throw new Error("Invalid backup file: missing prompts array.");
  }
  const state = await getState();
  const existingIds = new Set(state.prompts.map((p) => p.id));
  const newPrompts = (parsed.prompts as Prompt[]).filter(
    (p) => !existingIds.has(p.id)
  );
  state.prompts = [...newPrompts, ...state.prompts];
  if (Array.isArray(parsed.categories)) {
    const merged = new Set([...state.categories, ...parsed.categories]);
    state.categories = Array.from(merged);
  }
  await setState(state);
}

export function detectSource(hostname: string): PromptSource {
  if (hostname.includes("chatgpt") || hostname.includes("openai")) return "chatgpt";
  if (hostname.includes("claude")) return "claude";
  if (hostname.includes("gemini")) return "gemini";
  if (hostname.includes("perplexity")) return "perplexity";
  if (hostname.includes("grok") || hostname.includes("x.ai")) return "grok";
  return "other";
}
