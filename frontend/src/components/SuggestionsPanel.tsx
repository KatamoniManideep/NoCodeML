import React from 'react';
import { AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';

interface ModelSuggestion {
  name: string;
  reason: string;
}

interface PreprocessingSuggestion {
  step: string;
  reason: string;
}

interface Suggestions {
  task_type: string;
  models: ModelSuggestion[];
  preprocessing: PreprocessingSuggestion[];
  warnings: string[];
}

interface SuggestionsPanelProps {
  suggestions: Suggestions | null;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ suggestions, enabled, onToggle }) => {
  return (
    <section id="smart-suggestions" className="mt-8">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200/70">
        <div className="flex items-center gap-3">
          <div className="w-[28px] h-[28px] rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
            <Sparkles className="w-[14px] h-[14px] text-white" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-zinc-900 tracking-[-0.01em] leading-none">
              Smart Suggestions
            </h3>
            <p className="text-[12px] text-zinc-400 mt-[3px] leading-none">
              AI-powered dataset analysis
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className="relative inline-flex h-[26px] w-[46px] shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          style={{ backgroundColor: enabled ? '#18181b' : '#d4d4d8' }}
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle smart suggestions"
        >
          <span
            className="pointer-events-none block h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)] ring-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              transform: enabled ? 'translateX(21px) translateY(1px)' : 'translateX(1px) translateY(1px)',
            }}
          />
        </button>
      </div>

      {enabled && (
        <div
          className="mt-6"
          style={{ animation: 'suggestionsFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        >
          {!suggestions ? (
            <div className="rounded-xl border border-zinc-200/80 bg-[#f9fafb] px-6 py-8 flex items-center gap-3">
              <span className="w-[6px] h-[6px] rounded-full bg-zinc-300 animate-pulse shrink-0" />
              <p className="text-[13px] text-zinc-400 leading-none">
                Select a target column and features to see suggestions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 rounded-xl border border-zinc-200/80 overflow-hidden bg-[#f9fafb]">

              <div className="p-6 border-b md:border-b-0 md:border-r border-zinc-200/70 space-y-6">

                <div>
                  <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.07em]">
                    Detected Task
                  </p>
                  <div className="mt-2 flex items-center gap-[10px]">
                    <span className="inline-flex items-center px-[10px] py-[5px] rounded-md text-[12px] font-semibold bg-zinc-900 text-white tracking-tight capitalize">
                      {suggestions.task_type}
                    </span>
                    <span className="text-[12px] text-zinc-400">auto-detected</span>
                  </div>
                </div>

                {suggestions.warnings.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.07em]">
                      Warnings
                    </p>
                    <div className="mt-3 space-y-2">
                      {suggestions.warnings.map((w, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-[10px] px-3 py-[9px] rounded-lg bg-amber-50/70 border border-amber-200/50"
                        >
                          <AlertTriangle className="w-[13px] h-[13px] text-amber-500 shrink-0 mt-[1px]" />
                          <p className="text-[12px] text-amber-800 leading-[1.55] font-medium">
                            {w}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.07em]">
                      Status
                    </p>
                    <p className="mt-2 text-[13px] text-zinc-500 leading-[1.5]">
                      No issues detected — data looks clean.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">

                <div>
                  <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.07em]">
                    Recommended Models
                  </p>
                  <ul className="mt-3 divide-y divide-zinc-200/60">
                    {suggestions.models.map((m, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-[10px] py-[10px] group"
                      >
                        <ChevronRight className="w-[13px] h-[13px] text-zinc-300 shrink-0 mt-[2px] transition-colors group-hover:text-zinc-500" />
                        <div>
                          <p className="text-[13px] font-semibold text-zinc-900 tracking-[-0.01em] font-mono leading-tight">
                            {m.name}
                          </p>
                          <p className="text-[12px] text-zinc-400 mt-[3px] leading-[1.5]">
                            {m.reason}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.07em]">
                    Preprocessing Steps
                  </p>
                  <div className="mt-3 space-y-[2px]">
                    {suggestions.preprocessing.map((p, i) => (
                      <div key={i} className="flex items-start gap-3 py-[8px]">
                        <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-zinc-200/70 text-[10px] font-bold text-zinc-500 shrink-0 mt-[1px]">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-[13px] font-medium text-zinc-700 leading-tight">
                            {p.step}
                          </p>
                          <p className="text-[12px] text-zinc-400 mt-[3px] leading-[1.5]">
                            {p.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default SuggestionsPanel;
