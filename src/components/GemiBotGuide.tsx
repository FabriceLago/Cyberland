import React, { useState } from 'react';
import { Volume2, VolumeX, RefreshCw, Lightbulb } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playClick } from '../utils/sound';

interface GemiBotGuideProps {
  hints: string[];
  contextLabel: string;
}

export const GemiBotGuide: React.FC<GemiBotGuideProps> = ({ hints, contextLabel }) => {
  const [hintIndex, setHintIndex] = useState(0);
  const [muted, setMuted] = useState(!isSoundEnabled());

  const safeIndex = hints.length > 0 ? hintIndex % hints.length : 0;
  const activeHint =
    hints[safeIndex] ??
    "Prenez votre temps sur chaque étape : l'important est de comprendre ce qui se passe sous le capot.";

  const handleNextHint = () => {
    playClick();
    setHintIndex((prev) => (prev + 1) % Math.max(1, hints.length));
  };

  const handleToggleSound = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    setSoundEnabled(!nextMuted);
    if (!nextMuted) {
      playClick();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/70 text-sky-700 dark:text-sky-300 shrink-0 flex items-center justify-center">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div className="sm:hidden min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Repère pratique
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{contextLabel}</p>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="hidden sm:flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span className="font-semibold text-slate-900 dark:text-slate-100">Repère pratique</span>
          <span aria-hidden="true">·</span>
          <span>{contextLabel}</span>
          {hints.length > 1 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Conseil {safeIndex + 1}/{hints.length}
              </span>
            </>
          )}
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{activeHint}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {hints.length > 1 && (
          <button
            type="button"
            onClick={handleNextHint}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Autre conseil
          </button>
        )}
        <button
          type="button"
          onClick={handleToggleSound}
          aria-label={muted ? 'Activer les effets sonores' : 'Couper les effets sonores'}
          title={muted ? 'Activer les sons' : 'Couper les sons'}
          className="inline-flex items-center justify-center w-9 h-9 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
