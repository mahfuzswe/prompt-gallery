import { useEffect } from "react";
import { usePopupStore } from "./store";
import { api } from "./api";
import { getCategories } from "@/storage/promptStore";
import { ListView } from "./components/ListView";
import { PromptForm } from "./components/PromptForm";
import { SettingsView } from "./components/SettingsView";
import { Toast } from "./components/Toast";
import { Header } from "./components/Header";

function applyTheme(theme: "light" | "dark" | "system") {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = theme === "dark" || (theme === "system" && mq.matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export default function App() {
  const { view, toast, setPrompts, setCategories, setSettings, setIsLoading, settings } =
    usePopupStore();

  // Load all data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [prompts, s, storedCats] = await Promise.all([
          api.getPrompts(),
          api.getSettings(),
          getCategories(), // loads the authoritative category list from storage
        ]);
        setPrompts(prompts);
        setSettings(s);
        // Merge stored categories with any prompt categories not yet in the list
        // (handles imported data or edge cases where categories drifted)
        const promptCats = prompts.map((p) => p.category).filter(Boolean);
        const merged = [...new Set([...storedCats, ...promptCats])].sort();
        setCategories(merged);
        applyTheme(s.theme);
      } catch (e) {
        console.error("Prompt Gallery: failed to load data", e);
      } finally {
        setIsLoading(false);
      }
    }
    void loadData();
  }, [setPrompts, setCategories, setSettings, setIsLoading]);

  // Re-apply whenever the stored theme preference changes
  useEffect(() => {
    if (!settings) return;
    applyTheme(settings.theme);

    // For "system" mode, re-apply if the OS preference changes while popup is open
    if (settings.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [settings?.theme]);

  // Escape → back to list
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && view !== "list") {
        usePopupStore.getState().setView("list");
        usePopupStore.getState().setEditingPrompt(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view]);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text-1)" }}
         className="flex flex-col w-full h-full overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden flex flex-col">
        {view === "list" && <ListView />}
        {(view === "add" || view === "edit") && <PromptForm />}
        {view === "settings" && <SettingsView />}
      </main>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
