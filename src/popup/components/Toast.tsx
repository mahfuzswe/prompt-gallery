import { CheckCircle, XCircle } from "lucide-react";

interface Props {
  message: string;
  type: "success" | "error";
}

export function Toast({ message, type }: Props) {
  return (
    <div
      style={{
        position: "fixed", bottom: 12, left: "50%", transform: "translateX(-50%)",
        zIndex: 9999, animation: "pgSlideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        pointerEvents: "none", whiteSpace: "nowrap",
      }}
    >
      <style>{`
        @keyframes pgSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(6px) scale(0.96); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);    }
        }
      `}</style>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "8px 14px", borderRadius: 10,
          fontSize: 12.5, fontWeight: 500, fontFamily: "var(--font)",
          background: type === "success" ? "rgba(0,0,0,0.88)" : "rgba(255,59,48,0.92)",
          color: "#fff",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        }}
      >
        {type === "success"
          ? <CheckCircle size={13} color="#30d158" strokeWidth={2.5} />
          : <XCircle size={13} color="#fff" strokeWidth={2.5} />}
        {message}
      </div>
    </div>
  );
}
