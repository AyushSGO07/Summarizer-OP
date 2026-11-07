import React, { useState } from "react";
import { SourceChunk } from "../types";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

interface SourceCardsProps {
  sources: SourceChunk[];
}

export const SourceCards: React.FC<SourceCardsProps> = ({ sources }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3.5 pt-3.5 border-t border-slate-200 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
        <BookOpen className="w-3.5 h-3.5" />
        <span>Retrieved Source Chunks ({sources.length})</span>
      </div>

      <div className="space-y-1.5">
        {sources.map((src, idx) => {
          const isExpanded = expandedIndex === idx;
          const chunkId = src.chunk_index !== undefined ? src.chunk_index : idx + 1;

          return (
            <div
              key={idx}
              className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden text-xs shadow-sm"
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full flex items-center justify-between p-2.5 text-left text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <span className="font-semibold text-purple-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Source Segment #{idx + 1} &bull; Chunk #{chunkId}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {isExpanded && (
                <div className="p-3 bg-white border-t border-slate-200 text-slate-700 leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
                  {src.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
