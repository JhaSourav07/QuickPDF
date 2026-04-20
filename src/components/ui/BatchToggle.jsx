import React from "react";
import { Layers, FileText } from "lucide-react";

/**
 * Small toggle that switches between single-file and batch mode.
 */
export function BatchToggle({ isBatchMode, onChange, disabled }) {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-zinc-900 border border-white/10 rounded-xl">
      <button
        onClick={() => onChange(false)}
        disabled={disabled}
        className={[
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
          !isBatchMode
            ? "bg-white text-black shadow"
            : "text-zinc-500 hover:text-white",
        ].join(" ")}
      >
        <FileText className="w-3.5 h-3.5" />
        Single
      </button>
      <button
        onClick={() => onChange(true)}
        disabled={disabled}
        className={[
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
          isBatchMode
            ? "bg-white text-black shadow"
            : "text-zinc-500 hover:text-white",
        ].join(" ")}
      >
        <Layers className="w-3.5 h-3.5" />
        Batch
      </button>
    </div>
  );
}
