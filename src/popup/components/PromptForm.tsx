import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { usePopupStore } from "../store";
import { api } from "../api";

export function PromptForm() {
  const {
    view, editingPrompt, setView, setEditingPrompt,
    prompts, setPrompts, showToast, categories, setCategories,
  } = usePopupStore();

  const isEditing = view === "edit" && editingPrompt != null;
  const [text, setText]           = useState(editingPrompt?.text ?? "");
  const [title, setTitle]         = useState(editingPrompt?.title ?? "");
  const [category, setCategory]   = useState(editingPrompt?.category ?? "");
  const [tagInput, setTagInput]   = useState("");
  const [tags, setTags]           = useState<string[]>(editingPrompt?.tags ?? []);
  const [isSaving, setIsSaving]   = useState(false);
  const textareaRef               = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  // categories from store is already the authoritative sorted list (includes defaults)
  const allCategories = categories;

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !tags.includes(tag)) setTags((t) => [...t, tag]);
    setTagInput("");
  }

  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((t) => t.slice(0, -1));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSaving(true);
    try {
      if (isEditing && editingPrompt) {
        const updated = await api.updatePrompt({
          id: editingPrompt.id, text: text.trim(),
          title: title.trim() || undefined, category, tags,
        });
        if (updated) {
          setPrompts(prompts.map((p) => p.id === updated.id ? updated : p));
          // Sync category into store if it's new (e.g. typed in a custom value)
          if (category && !categories.includes(category)) {
            setCategories([...categories, category].sort());
          }
        }
        showToast("Prompt updated!");
      } else {
        const saved = await api.savePrompt({
          text: text.trim(), title: title.trim(), category, tags, source: "manual",
        });
        setPrompts([saved, ...prompts]);
        // Sync category into store immediately (savePrompt also persists it)
        if (category && !categories.includes(category)) {
          setCategories([...categories, category].sort());
        }
        showToast("Prompt saved!");
      }
      setView("list");
      setEditingPrompt(null);
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setIsSaving(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: "var(--text-2)",
    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5, display: "block",
  };

  const fieldStyle: React.CSSProperties = { padding: "8px 12px" };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col flex-1 overflow-hidden"
    >
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "thin", padding: "16px 12px 8px" }}
      >
        <div className="flex flex-col gap-4">

          {/* Prompt text */}
          <div>
            <label style={labelStyle}>
              Prompt <span style={{ color: "var(--red)", fontWeight: 400 }}>*</span>
            </label>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your prompt…"
              rows={5}
              required
              className="field"
              style={{ ...fieldStyle, resize: "none", lineHeight: 1.5 }}
            />
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>
              Title <span style={{ color: "var(--text-3)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Auto-generated from text"
              className="field"
              style={fieldStyle}
            />
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field"
              style={{ ...fieldStyle, appearance: "none",
                       backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236e6e73' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                       backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
            >
              <option value="">No category</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags</label>
            <div
              className="field"
              style={{
                ...fieldStyle, display: "flex", flexWrap: "wrap",
                gap: 5, minHeight: 40, alignItems: "center", cursor: "text",
              }}
              onClick={() => (document.querySelector(".pg-tag-input") as HTMLElement)?.focus()}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="tag"
                  style={{ background: "var(--accent-dim)", color: "var(--accent-text)", fontSize: 11 }}
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    style={{ background: "none", border: "none", cursor: "pointer",
                             padding: 0, display: "flex", color: "inherit", opacity: 0.6 }}
                  >
                    <X size={9} strokeWidth={3} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                placeholder={tags.length === 0 ? "seo, creative… (Enter to add)" : ""}
                className="pg-tag-input"
                style={{
                  flex: 1, minWidth: 80, border: "none", outline: "none",
                  background: "transparent", fontSize: 13, color: "var(--text-1)",
                  fontFamily: "var(--font)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div
        style={{
          display: "flex", gap: 8, padding: "10px 12px 12px",
          borderTop: "1px solid var(--separator)", flexShrink: 0,
          background: "var(--surface)",
        }}
      >
        <button
          type="button"
          onClick={() => { setView("list"); setEditingPrompt(null); }}
          className="btn-tonal"
          style={{ flex: 1, justifyContent: "center", padding: "8px" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!text.trim() || isSaving}
          className="btn-primary"
          style={{ flex: 1, justifyContent: "center", padding: "8px" }}
        >
          {isSaving ? "Saving…" : isEditing ? "Update" : "Save Prompt"}
        </button>
      </div>
    </form>
  );
}
