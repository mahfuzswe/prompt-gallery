import { useState } from "react";
import { Copy, Check, Zap, Pencil, Trash2 } from "lucide-react";
import type { Prompt } from "@/shared/types";
import { usePopupStore } from "../store";
import { api } from "../api";

const SOURCE_COLORS: Record<string, string> = {
  chatgpt:    "#10a37f",
  claude:     "#d97706",
  gemini:     "#4285f4",
  perplexity: "#20b2aa",
  grok:       "#888",
  manual:     "var(--accent)",
  other:      "var(--text-3)",
};

interface Props {
  prompt: Prompt;
  variant: "list" | "grid";
}

export function PromptCard({ prompt, variant }: Props) {
  const [copied, setCopied]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { setPrompts, setView, setEditingPrompt, showToast, prompts } = usePopupStore();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt.text);
      void api.incrementUsage(prompt.id);
      setPrompts(prompts.map((p) => p.id === prompt.id ? { ...p, usageCount: p.usageCount + 1 } : p));
      setCopied(true);
      showToast("Copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch { showToast("Copy failed", "error"); }
  }

  async function handleInsert() {
    try {
      await api.insertPrompt(prompt.text);
      void api.incrementUsage(prompt.id);
      window.close();
    } catch { showToast("No active AI page found", "error"); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deletePrompt(prompt.id);
      setPrompts(prompts.filter((p) => p.id !== prompt.id));
      showToast("Deleted");
    } catch { showToast("Delete failed", "error"); setDeleting(false); }
  }

  function handleEdit() { setEditingPrompt(prompt); setView("edit"); }

  if (variant === "grid") return <GridCard {...{ prompt, copied, deleting, handleCopy, handleInsert, handleEdit, handleDelete }} />;
  return <ListCard {...{ prompt, copied, deleting, handleCopy, handleInsert, handleEdit, handleDelete }} />;
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  if (!category) return null;
  return (
    <span className="tag" style={{ background: "var(--accent-dim)", color: "var(--accent-text)", fontSize: 10 }}>
      {category}
    </span>
  );
}

function TagList({ tags, max = 3 }: { tags: string[]; max?: number }) {
  return (
    <>
      {tags.slice(0, max).map((tag) => (
        <span key={tag} className="tag"
              style={{ background: "var(--surface3)", color: "var(--text-2)", fontSize: 10 }}>
          #{tag}
        </span>
      ))}
      {tags.length > max && (
        <span style={{ fontSize: 10, color: "var(--text-3)" }}>+{tags.length - max}</span>
      )}
    </>
  );
}

type CardActions = {
  copied: boolean;
  deleting: boolean;
  handleCopy: () => void;
  handleInsert: () => void;
  handleEdit: () => void;
  handleDelete: () => void;
};

// ── List card ─────────────────────────────────────────────────────────────────

function ListCard({ prompt, copied, deleting, handleCopy, handleInsert, handleEdit, handleDelete }: { prompt: Prompt } & CardActions) {
  return (
    <div
      className="list-row group"
      style={{ opacity: deleting ? 0.4 : 1, pointerEvents: deleting ? "none" : "auto" }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title + source */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)",
                         letterSpacing: "-0.01em", flex: 1, overflow: "hidden",
                         textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {prompt.title}
          </span>
          <span style={{ fontSize: 10, fontWeight: 500, color: SOURCE_COLORS[prompt.source] ?? "var(--text-3)",
                         flexShrink: 0, textTransform: "capitalize" }}>
            {prompt.source}
          </span>
        </div>

        {/* Preview */}
        <p className="clamp-2" style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.45, margin: 0 }}>
          {prompt.text}
        </p>

        {/* Tags */}
        {(prompt.category || prompt.tags.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            <CategoryBadge category={prompt.category} />
            <TagList tags={prompt.tags} />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
          <ActionBtn icon={copied ? <Check size={11} color="var(--green)" strokeWidth={3} /> : <Copy size={11} strokeWidth={2} />}
                     label={copied ? "Copied!" : "Copy"} onClick={handleCopy}
                     style={copied ? { color: "var(--green)" } : {}} />
          <ActionBtn icon={<Zap size={11} strokeWidth={2} />} label="Insert" onClick={handleInsert} />
          <div style={{ flex: 1 }} />
          {/* Edit / Delete — fade in on hover via CSS group */}
          <HoverActions onEdit={handleEdit} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}

// ── Gallery card ──────────────────────────────────────────────────────────────

function GridCard({ prompt, copied, deleting, handleCopy, handleInsert, handleEdit, handleDelete }: { prompt: Prompt } & CardActions) {
  return (
    <div
      className="card group"
      style={{
        padding: "10px 11px 9px",
        opacity: deleting ? 0.4 : 1,
        pointerEvents: deleting ? "none" : "auto",
        display: "flex", flexDirection: "column", gap: 6,
        cursor: "default", position: "relative",
        minHeight: 120,
      }}
    >
      {/* Source dot */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <CategoryBadge category={prompt.category} />
        <span style={{ fontSize: 9.5, fontWeight: 500, color: SOURCE_COLORS[prompt.source] ?? "var(--text-3)",
                       textTransform: "capitalize" }}>
          {prompt.source}
        </span>
      </div>

      {/* Title */}
      <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)",
                  letterSpacing: "-0.01em", lineHeight: 1.35, margin: 0,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {prompt.title}
      </p>

      {/* Preview */}
      <p style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.4, margin: 0, flex: 1,
                  display: "-webkit-box", WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {prompt.text}
      </p>

      {/* Tags */}
      {prompt.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <TagList tags={prompt.tags} max={2} />
        </div>
      )}

      {/* Hover overlay with actions */}
      <div
        className="pg-grid-overlay"
        style={{
          position: "absolute", inset: 0, borderRadius: 11,
          background: "var(--surface)", opacity: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 6, transition: "opacity 0.16s",
          pointerEvents: "none",
        }}
        ref={(el) => {
          if (!el) return;
          const card = el.parentElement;
          if (!card) return;
          const show = () => { el.style.opacity = "0.97"; el.style.pointerEvents = "auto"; };
          const hide = () => { el.style.opacity = "0";    el.style.pointerEvents = "none"; };
          card.addEventListener("mouseenter", show);
          card.addEventListener("mouseleave", hide);
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "80%" }}>
          <button onClick={handleCopy} className="btn-tonal"
                  style={{ justifyContent: "center", fontSize: 12, padding: "7px 12px",
                           color: copied ? "var(--green)" : "var(--text-1)" }}>
            {copied ? <Check size={13} color="var(--green)" strokeWidth={3} /> : <Copy size={13} strokeWidth={2} />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={handleInsert} className="btn-primary"
                  style={{ justifyContent: "center", fontSize: 12, padding: "7px 12px" }}>
            <Zap size={13} strokeWidth={2} />
            Insert
          </button>
          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={handleEdit} className="btn-tonal"
                    style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "6px" }}>
              <Pencil size={12} strokeWidth={2} />
            </button>
            <button onClick={handleDelete} className="btn-tonal"
                    style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "6px",
                             color: "var(--red)" }}>
              <Trash2 size={12} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function ActionBtn({
  icon, label, onClick, style: extraStyle,
}: { icon: React.ReactNode; label: string; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      className="btn-tonal"
      style={{ padding: "4px 9px", fontSize: 11.5, gap: 4, ...extraStyle }}
    >
      {icon}{label}
    </button>
  );
}

function HoverActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div
      style={{ display: "flex", gap: 2, opacity: 0, transition: "opacity 0.15s" }}
      ref={(el) => {
        if (!el) return;
        const row = el.closest(".group") as HTMLElement | null;
        if (!row) return;
        const show = () => { el.style.opacity = "1"; };
        const hide = () => { el.style.opacity = "0"; };
        row.addEventListener("mouseenter", show);
        row.addEventListener("mouseleave", hide);
      }}
    >
      <button onClick={onEdit} className="btn-icon" style={{ width: 26, height: 26 }} title="Edit">
        <Pencil size={12} strokeWidth={2} />
      </button>
      <button onClick={onDelete} className="btn-icon"
              style={{ width: 26, height: 26, color: "var(--red)" }} title="Delete">
        <Trash2 size={12} strokeWidth={2} />
      </button>
    </div>
  );
}
