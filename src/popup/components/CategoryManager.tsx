import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, X, FolderOpen, Pencil, Check } from "lucide-react";
import { usePopupStore } from "../store";
import { addCategory, deleteCategory, renameCategory } from "@/storage/promptStore";

export function CategoryManager() {
  const {
    categories,
    setCategories,
    setCategoryManagerOpen,
    prompts,
    showToast,
    setPrompts,
    selectedCategory,
    setSelectedCategory,
  } = usePopupStore();

  const [newName,    setNewName]    = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue,  setEditValue]  = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { if (editingCat) editRef.current?.focus(); }, [editingCat]);

  // Prompt count per category for display
  const countMap: Record<string, number> = {};
  prompts.forEach((p) => {
    if (p.category) countMap[p.category] = (countMap[p.category] ?? 0) + 1;
  });

  // ── Add ─────────────────────────────────────────────────────────────────────

  function handleAdd() {
    const name = newName.trim();
    if (!name || categories.includes(name)) { setNewName(""); return; }

    // Optimistic: update store immediately
    const prev = [...categories];
    setCategories([...categories, name].sort());
    setNewName("");

    // Persist in background
    addCategory(name)
      .then((updated) => {
        setCategories([...updated].sort());
        showToast(`"${name}" added`);
      })
      .catch(() => {
        setCategories(prev); // revert
        setNewName(name);
        showToast("Failed to add category", "error");
      });
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  function handleDelete(cat: string) {
    const prevCats    = [...categories];
    const prevPrompts = [...prompts];

    // Optimistic: update store immediately
    setCategories(categories.filter((c) => c !== cat));
    setPrompts(prompts.map((p) => (p.category === cat ? { ...p, category: "" } : p)));
    // Clear filter if the deleted category was selected
    if (selectedCategory === cat) setSelectedCategory("");

    // Persist in background
    deleteCategory(cat)
      .then((updated) => {
        setCategories([...updated].sort());
        showToast(`"${cat}" removed`);
      })
      .catch(() => {
        setCategories(prevCats);    // revert
        setPrompts(prevPrompts);
        showToast("Failed to remove category", "error");
      });
  }

  // ── Rename ───────────────────────────────────────────────────────────────────

  function startEdit(cat: string) {
    setEditingCat(cat);
    setEditValue(cat);
  }

  function confirmRename() {
    if (!editingCat) return;
    const trimmed = editValue.trim();

    // No-op cases
    if (!trimmed || trimmed === editingCat) { setEditingCat(null); return; }
    if (categories.includes(trimmed)) {
      showToast(`"${trimmed}" already exists`, "error");
      setEditingCat(null);
      return;
    }

    const prevCats    = [...categories];
    const prevPrompts = [...prompts];
    const oldName     = editingCat;

    // Optimistic: rename in store immediately and close edit mode
    setCategories(categories.map((c) => (c === oldName ? trimmed : c)).sort());
    setPrompts(prompts.map((p) => (p.category === oldName ? { ...p, category: trimmed } : p)));
    if (selectedCategory === oldName) setSelectedCategory(trimmed);
    setEditingCat(null);

    // Persist in background
    renameCategory(oldName, trimmed)
      .then((updated) => {
        setCategories([...updated].sort());
        showToast(`Renamed to "${trimmed}"`);
      })
      .catch(() => {
        setCategories(prevCats);    // revert
        setPrompts(prevPrompts);
        if (selectedCategory === trimmed) setSelectedCategory(oldName);
        showToast("Failed to rename category", "error");
      });
  }

  // ── Keyboard handlers ────────────────────────────────────────────────────────

  function handleAddKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
    if (e.key === "Escape") setCategoryManagerOpen(false);
  }

  function handleEditKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); confirmRename(); }
    if (e.key === "Escape") setEditingCat(null);
  }

  const sep: React.CSSProperties = {
    height: 1,
    background: "var(--separator)",
    margin: "0 12px",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setCategoryManagerOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(3px)",
          animation: "pgFadeIn 0.15s ease",
        }}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 101,
          background: "var(--surface)",
          borderRadius: "16px 16px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          border: "1px solid var(--border)",
          borderBottom: "none",
          animation: "pgSlideUp 0.22s cubic-bezier(0.34,1.2,0.64,1)",
          maxHeight: "72%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <style>{`
          @keyframes pgFadeIn  { from { opacity: 0; } to { opacity: 1; } }
          @keyframes pgSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        `}</style>

        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 2px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--border)" }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 14px 10px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: "var(--accent-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FolderOpen size={13} style={{ color: "var(--accent)" }} />
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-1)",
                letterSpacing: "-0.01em",
              }}
            >
              Categories
            </span>
            {categories.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  background: "var(--surface2)",
                  borderRadius: 99,
                  padding: "1px 7px",
                }}
              >
                {categories.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setCategoryManagerOpen(false)}
            className="btn-icon"
            style={{ width: 26, height: 26, borderRadius: 99 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Add input */}
        <div style={{ padding: "0 12px 10px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleAddKey}
              placeholder="New category name…"
              className="field"
              style={{ padding: "8px 12px", flex: 1 }}
              maxLength={40}
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="btn-primary"
              style={{ padding: "8px 13px", flexShrink: 0 }}
            >
              <Plus size={13} strokeWidth={2.5} />
              Add
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--separator)", flexShrink: 0 }} />

        {/* Category list */}
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", padding: "8px 0 16px" }}>
          {categories.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "var(--text-3)",
                fontSize: 13,
                padding: "28px 0",
              }}
            >
              No categories yet — add one above.
            </p>
          ) : (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                margin: "0 12px",
                overflow: "hidden",
              }}
            >
              {categories.map((cat, i) => (
                <div key={cat}>
                  {i > 0 && <div style={sep} />}

                  {editingCat === cat ? (
                    /* Inline rename row */
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "7px 10px",
                        background: "var(--accent-dim)",
                      }}
                    >
                      <input
                        ref={editRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleEditKey}
                        className="field"
                        style={{ flex: 1, padding: "6px 10px", fontSize: 13 }}
                        maxLength={40}
                      />
                      <button
                        onClick={confirmRename}
                        className="btn-primary"
                        style={{ padding: "6px 10px", fontSize: 12, flexShrink: 0 }}
                      >
                        <Check size={12} strokeWidth={3} />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCat(null)}
                        className="btn-tonal"
                        style={{ padding: "6px 10px", fontSize: 12, flexShrink: 0 }}
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    /* Normal row */
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "9px 12px",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                    >
                      {/* Left: dot + name + count */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 99,
                            background: "var(--accent)",
                            flexShrink: 0,
                            opacity: 0.75,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            color: "var(--text-1)",
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cat}
                        </span>
                        {countMap[cat] ? (
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--text-3)",
                              background: "var(--surface2)",
                              borderRadius: 99,
                              padding: "1px 7px",
                              flexShrink: 0,
                            }}
                          >
                            {countMap[cat]}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--text-3)",
                              flexShrink: 0,
                              fontStyle: "italic",
                            }}
                          >
                            empty
                          </span>
                        )}
                      </div>

                      {/* Right: edit + delete */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          flexShrink: 0,
                        }}
                      >
                        <button
                          onClick={() => startEdit(cat)}
                          className="btn-icon"
                          style={{ width: 28, height: 28 }}
                          title="Rename"
                        >
                          <Pencil size={12} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="btn-icon"
                          style={{ width: 28, height: 28, color: "var(--red)" }}
                          title="Delete"
                        >
                          <Trash2 size={12} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
