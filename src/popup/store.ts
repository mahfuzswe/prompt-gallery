import { create } from "zustand";
import Fuse from "fuse.js";
import type { Prompt, Settings } from "@/shared/types";

type ViewMode = "list" | "grid";

interface PopupStore {
  prompts: Prompt[];
  categories: string[];
  settings: Settings | null;
  searchQuery: string;
  selectedCategory: string;
  selectedTag: string;
  isLoading: boolean;
  view: "list" | "add" | "edit" | "settings";
  viewMode: ViewMode;
  editingPrompt: Prompt | null;
  categoryManagerOpen: boolean;
  toast: { message: string; type: "success" | "error" } | null;

  setPrompts: (prompts: Prompt[]) => void;
  setCategories: (cats: string[]) => void;
  setSettings: (s: Settings) => void;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (c: string) => void;
  setSelectedTag: (t: string) => void;
  setIsLoading: (v: boolean) => void;
  setView: (v: PopupStore["view"]) => void;
  setViewMode: (m: ViewMode) => void;
  setEditingPrompt: (p: Prompt | null) => void;
  setCategoryManagerOpen: (v: boolean) => void;
  showToast: (message: string, type?: "success" | "error") => void;
  clearToast: () => void;

  filteredPrompts: () => Prompt[];
  allTags: () => string[];
}

export const usePopupStore = create<PopupStore>((set, get) => ({
  prompts: [],
  categories: [],
  settings: null,
  searchQuery: "",
  selectedCategory: "",
  selectedTag: "",
  isLoading: true,
  view: "list",
  viewMode: "list",
  editingPrompt: null,
  categoryManagerOpen: false,
  toast: null,

  setPrompts: (prompts) => set({ prompts }),
  setCategories: (categories) => set({ categories }),
  setSettings: (settings) => set({ settings }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSelectedTag: (selectedTag) => set({ selectedTag }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setView: (view) => set({ view }),
  setViewMode: (viewMode) => set({ viewMode }),
  setEditingPrompt: (editingPrompt) => set({ editingPrompt }),
  setCategoryManagerOpen: (categoryManagerOpen) => set({ categoryManagerOpen }),
  showToast: (message, type = "success") => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 2500);
  },
  clearToast: () => set({ toast: null }),

  filteredPrompts: () => {
    const { prompts, searchQuery, selectedCategory, selectedTag } = get();
    let results = prompts;
    if (selectedCategory) results = results.filter((p) => p.category === selectedCategory);
    if (selectedTag) results = results.filter((p) => p.tags.includes(selectedTag));
    if (searchQuery.trim()) {
      const fuse = new Fuse(results, {
        keys: ["title", "text", "tags", "category"],
        threshold: 0.35,
        minMatchCharLength: 2,
      });
      return fuse.search(searchQuery).map((r) => r.item);
    }
    return results;
  },

  allTags: () => {
    const { prompts } = get();
    const tagSet = new Set<string>();
    prompts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  },
}));
