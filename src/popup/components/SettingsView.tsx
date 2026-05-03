import { useState } from "react";
import { Download, Upload, Sun, Moon, Monitor, RefreshCw } from "lucide-react";
import { usePopupStore } from "../store";
import { api } from "../api";
import { exportData, importData } from "@/storage/promptStore";

type Theme = "light" | "dark" | "system";

export function SettingsView() {
  const { settings, setSettings, setPrompts, showToast } = usePopupStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  if (!settings) return null;

  async function handleTheme(theme: Theme) {
    const updated = await api.updateSettings({ theme });
    setSettings(updated);
  }

  async function handleSyncToggle() {
    const updated = await api.updateSettings({ syncEnabled: !settings!.syncEnabled });
    setSettings(updated);
    showToast(updated.syncEnabled ? "Sync enabled" : "Sync disabled");
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prompt-gallery-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Exported!");
    } catch { showToast("Export failed", "error"); }
    finally { setIsExporting(false); }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      await importData(await file.text());
      const prompts = await api.getPrompts();
      setPrompts(prompts);
      showToast(`Imported ${prompts.length} prompts!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Import failed", "error");
    } finally { setIsImporting(false); e.target.value = ""; }
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: "var(--text-2)",
    textTransform: "uppercase", letterSpacing: "0.05em",
    padding: "0 4px 6px",
  };

  const groupStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    overflow: "hidden",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "11px 14px", gap: 12,
  };

  const rowLabelStyle: React.CSSProperties = {
    fontSize: 13, color: "var(--text-1)", fontWeight: 500,
  };

  const rowSubStyle: React.CSSProperties = {
    fontSize: 11.5, color: "var(--text-2)", marginTop: 1,
  };

  const divider: React.CSSProperties = {
    height: 1, background: "var(--separator)", margin: "0 14px",
  };

  const THEMES: Array<{ value: Theme; icon: React.ReactNode; label: string }> = [
    { value: "light",  icon: <Sun  size={13} strokeWidth={2} />, label: "Light"  },
    { value: "dark",   icon: <Moon size={13} strokeWidth={2} />, label: "Dark"   },
    { value: "system", icon: <Monitor size={12} strokeWidth={2} />, label: "Auto" },
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: "14px 12px 20px", scrollbarWidth: "thin" }}>
      <div className="flex flex-col gap-5">

        {/* ── Appearance ── */}
        <section>
          <p style={sectionLabel}>Appearance</p>
          <div style={groupStyle}>
            <div style={rowStyle}>
              <span style={rowLabelStyle}>Theme</span>
              {/* Segmented control */}
              <div
                style={{
                  display: "flex", gap: 2, padding: 3,
                  background: "var(--surface2)", borderRadius: 9,
                }}
              >
                {THEMES.map(({ value, icon, label }) => (
                  <button
                    key={value}
                    onClick={() => handleTheme(value)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 7, border: "none",
                      fontFamily: "var(--font)", fontSize: 12, fontWeight: 500,
                      cursor: "pointer", transition: "all 0.15s",
                      background: settings.theme === value ? "var(--surface)" : "transparent",
                      color: settings.theme === value ? "var(--text-1)" : "var(--text-2)",
                      boxShadow: settings.theme === value ? "var(--shadow-xs)" : "none",
                    }}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Sync ── */}
        <section>
          <p style={sectionLabel}>Sync</p>
          <div style={groupStyle}>
            <div style={rowStyle}>
              <div>
                <p style={rowLabelStyle}>Chrome Sync</p>
                <p style={rowSubStyle}>Syncs across Chrome devices (100 KB limit)</p>
              </div>
              <Toggle checked={settings.syncEnabled} onChange={handleSyncToggle} />
            </div>
          </div>
        </section>

        {/* ── Backup ── */}
        <section>
          <p style={sectionLabel}>Backup & Restore</p>
          <div style={groupStyle}>
            <div style={rowStyle}>
              <div>
                <p style={rowLabelStyle}>Export</p>
                <p style={rowSubStyle}>Download all prompts as JSON</p>
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="btn-tonal"
                style={{ padding: "5px 12px", fontSize: 12, flexShrink: 0 }}
              >
                <Download size={12} strokeWidth={2} />
                {isExporting ? "…" : "Export"}
              </button>
            </div>
            <div style={divider} />
            <div style={rowStyle}>
              <div>
                <p style={rowLabelStyle}>Import</p>
                <p style={rowSubStyle}>Merge from a backup file</p>
              </div>
              <label
                className="btn-tonal"
                style={{
                  padding: "5px 12px", fontSize: 12, flexShrink: 0, cursor: "pointer",
                  opacity: isImporting ? 0.5 : 1, pointerEvents: isImporting ? "none" : undefined,
                }}
              >
                <Upload size={12} strokeWidth={2} />
                {isImporting ? "…" : "Import"}
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section>
          <p style={sectionLabel}>About</p>
          <div style={groupStyle}>
            <div style={rowStyle}>
              <div
                className="flex items-center justify-center rounded-[9px] flex-shrink-0"
                style={{ width: 32, height: 32, background: "var(--accent)" }}
              >
                <RefreshCw size={14} color="#fff" strokeWidth={2} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={rowLabelStyle}>Prompt Gallery</p>
                <p style={rowSubStyle}>v1.0.0 · Local-first · Private</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        position: "relative",
        width: 44, height: 26,
        borderRadius: 99, border: "none", cursor: "pointer",
        flexShrink: 0,
        background: checked ? "var(--accent)" : "var(--surface3)",
        transition: "background 0.2s",
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3, left: checked ? 21 : 3,
          width: 20, height: 20,
          borderRadius: 99,
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
          transition: "left 0.2s cubic-bezier(0.34,1.2,0.64,1)",
        }}
      />
    </button>
  );
}
