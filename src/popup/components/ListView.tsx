import { useRef, useEffect } from "react";
import { Search, X, LayoutList, LayoutGrid } from "lucide-react";
import { usePopupStore } from "../store";
import { PromptCard } from "./PromptCard";
import { FilterBar } from "./FilterBar";
import { EmptyState } from "./EmptyState";
import { CategoryManager } from "./CategoryManager";

export function ListView() {
  const {
    searchQuery, setSearchQuery, isLoading, filteredPrompts,
    selectedCategory, selectedTag, viewMode, setViewMode, categoryManagerOpen,
  } = usePopupStore();

  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { searchRef.current?.focus(); }, []);

  const results   = filteredPrompts();
  const hasFilters = !!(searchQuery || selectedCategory || selectedTag);

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ position: "relative" }}>
      {/* Search + view toggle row */}
      <div className="px-3 pt-2.5 pb-2 flex-shrink-0 flex gap-2 items-center">
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={13}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                     color: "var(--text-3)", pointerEvents: "none" }}
          />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts…"
            className="field"
            style={{ padding: "8px 32px", fontSize: 13, width: "100%" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="btn-icon"
              style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                       width: 22, height: 22, borderRadius: 99 }}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* View mode toggle */}
        <div style={{ display: "flex", background: "var(--surface2)",
                      borderRadius: 9, padding: 3, gap: 2, flexShrink: 0 }}>
          <ViewBtn
            active={viewMode === "list"} icon={<LayoutList size={13} strokeWidth={2} />}
            title="List view" onClick={() => setViewMode("list")}
          />
          <ViewBtn
            active={viewMode === "grid"} icon={<LayoutGrid size={13} strokeWidth={2} />}
            title="Gallery view" onClick={() => setViewMode("grid")}
          />
        </div>
      </div>

      {/* Filters */}
      <FilterBar />

      {/* Prompt list / grid */}
      <div
        className="flex-1 overflow-y-auto px-3 pb-3"
        style={{ scrollbarWidth: "thin" }}
      >
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
            <div
              style={{
                width: 20, height: 20, borderRadius: "50%",
                border: "2px solid var(--accent)", borderTopColor: "transparent",
                animation: "spin 0.7s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : results.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : viewMode === "grid" ? (
          /* ── Gallery grid ─────────────────────────────────────────────── */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 2 }}>
            {results.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} variant="grid" />
            ))}
          </div>
        ) : (
          /* ── List view ────────────────────────────────────────────────── */
          <div className="card overflow-hidden" style={{ marginTop: 2 }}>
            {results.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} variant="list" />
            ))}
          </div>
        )}
      </div>

      {/* Category manager sheet */}
      {categoryManagerOpen && <CategoryManager />}
    </div>
  );
}

function ViewBtn({
  active, icon, title, onClick,
}: { active: boolean; icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 7, border: "none", cursor: "pointer", transition: "all 0.15s",
        background: active ? "var(--surface)" : "transparent",
        color: active ? "var(--text-1)" : "var(--text-3)",
        boxShadow: active ? "var(--shadow-xs)" : "none",
      }}
    >
      {icon}
    </button>
  );
}
