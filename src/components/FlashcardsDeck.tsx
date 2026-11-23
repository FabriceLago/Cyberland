import React, { useEffect, useMemo, useState } from 'react';
import { RotateCw, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { FLASHCARDS } from '../data/extraLabsData';
import { playClick, playSuccess } from '../utils/sound';

type LeitnerBox = 1 | 2 | 3; // 1 = À revoir, 2 = Presque su, 3 = Maîtrisée
type BoxFilter = 'all' | '1' | '2' | '3';

const LEITNER_STORAGE_KEY = 'cyberland_leitner_v1';

function loadBoxes(): Record<string, LeitnerBox> {
  try {
    const raw = window.localStorage.getItem(LEITNER_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    const clean: Record<string, LeitnerBox> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v === 1 || v === 2 || v === 3) clean[k] = v;
    }
    return clean;
  } catch {
    return {};
  }
}

export const FlashcardsDeck: React.FC = () => {
  const [boxByCard, setBoxByCard] = useState<Record<string, LeitnerBox>>(() => loadBoxes());
  const [filter, setFilter] = useState<BoxFilter>('all');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(LEITNER_STORAGE_KEY, JSON.stringify(boxByCard));
    } catch {
      // Ignore storage quota errors
    }
  }, [boxByCard]);

  const getBox = (id: string): LeitnerBox => boxByCard[id] ?? 1;

  const counts = useMemo(() => {
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    for (const card of FLASHCARDS) {
      const b = getBox(card.id);
      if (b === 1) b1++;
      else if (b === 2) b2++;
      else b3++;
    }
    return { b1, b2, b3 };
  }, [boxByCard]);

  const deck = useMemo(() => {
    if (filter === 'all') {
      // Smart Leitner ordering: prioritize Box 1 (À revoir), then Box 2, then Box 3
      return [...FLASHCARDS].sort((a, b) => getBox(a.id) - getBox(b.id));
    }
    const targetBox = Number(filter) as LeitnerBox;
    const filtered = FLASHCARDS.filter((c) => getBox(c.id) === targetBox);
    return filtered.length > 0 ? filtered : FLASHCARDS;
  }, [filter, boxByCard]);

  const safeIndex = Math.min(index, Math.max(0, deck.length - 1));
  const currentCard = deck[safeIndex];
  const currentBox = currentCard ? getBox(currentCard.id) : 1;

  const goNext = () => {
    playClick();
    setFlipped(false);
    setIndex((prev) => (prev + 1) % deck.length);
  };

  const goPrev = () => {
    playClick();
    setFlipped(false);
    setIndex((prev) => (prev - 1 + deck.length) % deck.length);
  };

  const assignBox = (targetBox: LeitnerBox) => {
    if (!currentCard) return;
    if (targetBox === 3) {
      playSuccess();
    } else {
      playClick();
    }
    setBoxByCard((prev) => ({ ...prev, [currentCard.id]: targetBox }));
    setFlipped(false);
    setIndex((prev) => (prev + 1) % Math.max(1, deck.length));
  };

  const masteryPct = Math.round((counts.b3 / FLASHCARDS.length) * 100);

  return (
    <div className="space-y-6">
      {/* Leitner 3-Box Smart Revision Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Révision intelligente Leitner ({counts.b3}/{FLASHCARDS.length} maîtrisées · {masteryPct} %)
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Les cartes « À revoir » passent automatiquement en priorité avant votre Examen Blanc.
            </p>
          </div>

          {Object.keys(boxByCard).length > 0 && (
            <button
              type="button"
              onClick={() => {
                playClick();
                setBoxByCard({});
                setFilter('all');
                setIndex(0);
                setFlipped(false);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Remettre à zéro
            </button>
          )}
        </div>

        {/* 3 Leitner Box Filter Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { id: 'all' as BoxFilter, label: 'Parcours prioritaire', count: FLASHCARDS.length },
              { id: '1' as BoxFilter, label: 'Boîte 1 · À revoir', count: counts.b1 },
              { id: '2' as BoxFilter, label: 'Boîte 2 · Presque su', count: counts.b2 },
              { id: '3' as BoxFilter, label: 'Boîte 3 · Maîtrisée', count: counts.b3 },
            ]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playClick();
                setFilter(tab.id);
                setIndex(0);
                setFlipped(false);
              }}
              className={`px-3 py-2 rounded-lg border text-left transition-colors flex items-center justify-between gap-2 text-xs font-semibold ${
                filter === tab.id
                  ? 'bg-sky-700 text-white border-sky-700'
                  : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              <span className="font-mono tabular-nums shrink-0">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Flashcard Stage */}
      {currentCard && (
        <div className="max-w-2xl mx-auto space-y-5">
          <button
            type="button"
            onClick={() => {
              playClick();
              setFlipped((f) => !f);
            }}
            className="w-full text-left bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-500 rounded-2xl p-8 min-h-[260px] flex flex-col justify-between transition-colors shadow-xs"
          >
            <div className="flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>
                {currentCard.islandRef} · Carte {safeIndex + 1}/{deck.length}
              </span>
              <span className="font-mono font-semibold text-sky-700 dark:text-sky-400">
                {flipped ? 'VERSO · RÉPONSE' : 'RECTO · QUESTION'}
              </span>
            </div>

            <div className="py-6 space-y-3">
              {!flipped ? (
                <p className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {currentCard.front}
                </p>
              ) : (
                <>
                  <p className="text-base text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
                    {currentCard.back}
                  </p>
                  <p className="text-xs text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-lg px-3.5 py-2.5">
                    <strong>Astuce mémo :</strong> {currentCard.memoryTip}
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5" />
                Cliquer pour retourner la carte
              </span>
              <span
                className={`font-semibold ${
                  currentBox === 3
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : currentBox === 2
                    ? 'text-sky-700 dark:text-sky-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {currentBox === 3
                  ? 'Boîte 3 · Maîtrisée'
                  : currentBox === 2
                  ? 'Boîte 2 · Presque su'
                  : 'Boîte 1 · À revoir'}
              </span>
            </div>
          </button>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Carte précédente"
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Carte suivante"
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => assignBox(1)}
                className="px-3.5 py-2.5 text-xs font-semibold text-amber-950 dark:text-amber-100 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900 rounded-lg transition-colors"
              >
                Boîte 1 · À revoir
              </button>
              <button
                type="button"
                onClick={() => assignBox(2)}
                className="px-3.5 py-2.5 text-xs font-semibold text-sky-950 dark:text-sky-100 bg-sky-100 dark:bg-sky-950/60 hover:bg-sky-200 dark:hover:bg-sky-900 rounded-lg transition-colors"
              >
                Boîte 2 · Presque su
              </button>
              <button
                type="button"
                onClick={() => assignBox(3)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Boîte 3 · Maîtrisée
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
