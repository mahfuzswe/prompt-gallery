import { BookMarked, Plus, Settings, ChevronLeft } from "lucide-react";
import { usePopupStore } from "../store";

const VIEW_TITLES: Record<string, string> = {
  add: "New Prompt",
  edit: "Edit Prompt",
  settings: "Settings",
};

export function Header() {
  const { view, setView, setEditingPrompt } = usePopupStore();
  const isDetail = view !== "list";

  return (
    <header
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--separator)",
        flexShrink: 0,
      }}
      className="flex items-center px-3"
    >
      <div className="flex items-center w-full gap-2" style={{ height: 52 }}>
        {/* Back / Logo */}
        {isDetail ? (
          <button
            onClick={() => { setView("list"); setEditingPrompt(null); }}
            className="btn-icon"
            title="Back"
            style={{ marginLeft: -2 }}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
        ) : (
          <div
            className="flex items-center justify-center rounded-[9px] flex-shrink-0"
            style={{ width: 28, height: 28, background: "var(--accent)" }}
          >
            <BookMarked size={13} color="#fff" strokeWidth={2.5} />
          </div>
        )}

        {/* Title */}
        <span
          className="flex-1 font-semibold truncate"
          style={{ fontSize: 15, color: "var(--text-1)", letterSpacing: "-0.01em" }}
        >
          {isDetail ? VIEW_TITLES[view] : "Prompt Gallery"}
        </span>

        {/* Actions (list view only) */}
        {!isDetail && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setEditingPrompt(null); setView("add"); }}
              className="btn-primary"
              style={{ padding: "5px 10px", gap: 4, fontSize: 12 }}
              title="New prompt"
            >
              <Plus size={13} strokeWidth={2.5} />
              New
            </button>
            <button
              onClick={() => setView("settings")}
              className="btn-icon"
              title="Settings"
            >
              <Settings size={15} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
