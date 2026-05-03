import { BookOpen, Plus } from "lucide-react";
import { usePopupStore } from "../store";

export function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const { setView, setSearchQuery, setSelectedCategory, setSelectedTag } = usePopupStore();

  function clearAll() {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedTag("");
  }

  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center" style={{ paddingTop: 48 }}>
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{ width: 44, height: 44, background: "var(--surface2)" }}
        >
          <BookOpen size={20} style={{ color: "var(--text-3)" }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>No results</p>
          <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>Try a different search or filter</p>
        </div>
        <button
          onClick={clearAll}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 12, color: "var(--accent)", fontFamily: "var(--font)",
          }}
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center" style={{ paddingTop: 56 }}>
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{ width: 52, height: 52, background: "var(--accent-dim)" }}
      >
        <BookOpen size={24} style={{ color: "var(--accent)" }} />
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em" }}>
          No prompts yet
        </p>
        <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, maxWidth: 200, lineHeight: 1.5 }}>
          Save prompts from any AI site, or add them manually.
        </p>
      </div>
      <button
        onClick={() => setView("add")}
        className="btn-primary"
        style={{ marginTop: 4 }}
      >
        <Plus size={13} strokeWidth={2.5} />
        Add first prompt
      </button>
    </div>
  );
}
