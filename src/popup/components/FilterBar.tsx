import { useRef, useEffect } from "react";
import { FolderPlus, X } from "lucide-react";
import { usePopupStore } from "../store";

export function FilterBar() {
  const {
    categories,
    prompts,
    selectedCategory,
    selectedTag,
    setSelectedCategory,
    setSelectedTag,
    setCategoryManagerOpen,
  } = usePopupStore();

  const rowRef = useRef<HTMLDivElement>(null);

  // Redirect vertical mouse-wheel → horizontal scroll.
  // Must be a non-passive native listener so preventDefault() actually works.
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Tags derived from prompts (not stored separately)
  const tags = Array.from(new Set(prompts.flatMap((p) => p.tags))).sort();

  const hasContent = categories.length > 0 || tags.length > 0;

  return (
    <div
      ref={rowRef}
      className="flex gap-1.5 px-3 pb-2 flex-shrink-0 overflow-x-auto items-center"
      style={{ scrollbarWidth: "none", minHeight: hasContent ? undefined : 0 }}
    >
      {/* Manage categories trigger */}
      <ManageBtn onClick={() => setCategoryManagerOpen(true)} />

      {/* Category chips */}
      {selectedCategory ? (
        <ActiveChip
          label={selectedCategory}
          onRemove={() => setSelectedCategory("")}
          color="accent"
        />
      ) : (
        categories.map((cat) => (
          <InactiveChip key={cat} label={cat} onClick={() => setSelectedCategory(cat)} />
        ))
      )}

      {/* Tag chips — only shown when no category is selected (keeps bar uncluttered) */}
      {!selectedCategory && (
        selectedTag ? (
          <ActiveChip
            label={`#${selectedTag}`}
            onRemove={() => setSelectedTag("")}
            color="violet"
          />
        ) : (
          tags.map((tag) => (
            <InactiveChip key={tag} label={`#${tag}`} onClick={() => setSelectedTag(tag)} />
          ))
        )
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ManageBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Manage categories"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 9px 3px 7px",
        borderRadius: 99,
        border: "1px dashed var(--border)",
        background: "transparent",
        color: "var(--text-2)",
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "var(--font)",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.12s, border-color 0.12s, color 0.12s",
      }}
      onMouseEnter={(e) => {
        const t = e.currentTarget;
        t.style.background = "var(--accent-dim)";
        t.style.borderColor = "var(--accent)";
        t.style.color = "var(--accent-text)";
      }}
      onMouseLeave={(e) => {
        const t = e.currentTarget;
        t.style.background = "transparent";
        t.style.borderColor = "var(--border)";
        t.style.color = "var(--text-2)";
      }}
    >
      <FolderPlus size={11} strokeWidth={2} />
      Categories
    </button>
  );
}

function ActiveChip({
  label,
  onRemove,
  color,
}: {
  label: string;
  onRemove: () => void;
  color: "accent" | "violet";
}) {
  const bg = color === "accent" ? "var(--accent-dim)" : "rgba(175,82,222,0.12)";
  const fg = color === "accent" ? "var(--accent-text)" : "#af52de";
  return (
    <span className="tag flex-shrink-0" style={{ background: bg, color: fg }}>
      {label}
      <button
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          color: "inherit",
          opacity: 0.65,
        }}
      >
        <X size={10} strokeWidth={3} />
      </button>
    </span>
  );
}

function InactiveChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="tag flex-shrink-0"
      style={{
        background: "var(--surface3)",
        color: "var(--text-2)",
        border: "none",
        cursor: "pointer",
        fontFamily: "var(--font)",
        transition: "background 0.12s, color 0.12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--accent-dim)";
        e.currentTarget.style.color = "var(--accent-text)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--surface3)";
        e.currentTarget.style.color = "var(--text-2)";
      }}
    >
      {label}
    </button>
  );
}
