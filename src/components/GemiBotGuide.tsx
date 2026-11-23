import React, { useState } from 'react';
import { Volume2, VolumeX, RefreshCw, Bot } from 'lucide-react';
import { ASSETS } from '../data/courseData';
import { isSoundEnabled, setSoundEnabled, playClick } from '../utils/sound';

interface GemiBotGuideProps {
  hints: string[];
  contextLabel: string;
}

export const GemiBotGuide: React.FC<GemiBotGuideProps> = ({ hints, contextLabel }) => {
  const [hintIndex, setHintIndex] = useState(0);
  const [muted, setMuted] = useState(!isSoundEnabled());
  const [imgError, setImgError] = useState(false);

  const safeIndex = hints.length > 0 ? hintIndex % hints.length : 0;
  const activeHint = hints[safeIndex] ?? "Prêt à reconnecter l'archipel Cyberland ?";

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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3.5 shrink-0">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
          {!imgError ? (
            <img
              src={ASSETS.gemiBot}
              alt="GemiBot, drone compagnon de Cyberland"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <Bot className="w-6 h-6 text-sky-700 dark:text-sky-400" />
          )}
        </div>
        <div className="sm:hidden">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">GemiBot</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{contextLabel}</p>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-0.5">
          <span className="font-semibold text-slate-800 dark:text-slate-200">GemiBot</span>
          <span aria-hidden="true">·</span>
          <span>{contextLabel}</span>
          {hints.length > 1 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Indice {safeIndex + 1}/{hints.length}
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
            Autre indice
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
