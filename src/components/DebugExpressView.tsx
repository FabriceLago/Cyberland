import React, { useMemo, useState } from 'react';
import {
  Terminal,
  BookOpen,
  CheckCircle2,
  XCircle,
  Search,
  Lock,
  Unlock,
  Wrench,
  Layers,
} from 'lucide-react';
import { DEBUG_TICKETS, GLOSSARY_TERMS } from '../data/courseData';
import { FLASHCARDS } from '../data/extraLabsData';
import { GemiBotGuide } from './GemiBotGuide';
import { FlashcardsDeck } from './FlashcardsDeck';
import { playClick, playError, playPacket, playSuccess, playVictory } from '../utils/sound';

interface DebugExpressViewProps {
  completedIslands: number[];
  solvedDebugIds: string[];
  onSolveDebugTicket: (ticketId: string) => void;
}

export const DebugExpressView: React.FC<DebugExpressViewProps> = ({
  completedIslands,
  solvedDebugIds,
  onSolveDebugTicket,
}) => {
  const [activeTab, setActiveTab] = useState<'debug' | 'glossary' | 'flashcards'>('debug');

  // Debug Express state
  const [selectedTicketId, setSelectedTicketId] = useState(DEBUG_TICKETS[0].id);
  const [runOutputs, setRunOutputs] = useState<Record<string, { label: string; output: string }[]>>({});
  const [selectedOption, setSelectedOption] = useState<Record<string, number>>({});
  const [checkedTicket, setCheckedTicket] = useState<Record<string, boolean>>({});

  // Glossary state
  const [searchQuery, setSearchQuery] = useState('');
  const [revealAllGlossary, setRevealAllGlossary] = useState(false);

  const activeTicket =
    DEBUG_TICKETS.find((t) => t.id === selectedTicketId) ?? DEBUG_TICKETS[0];

  const ticketOutputs = runOutputs[activeTicket.id] ?? [];
  const chosenOpt = selectedOption[activeTicket.id];
  const isChecked = checkedTicket[activeTicket.id] ?? false;
  const isAlreadySolved = solvedDebugIds.includes(activeTicket.id);

  const handleRunTool = (tool: { id: string; label: string; output: string }) => {
    playPacket();
    setRunOutputs((prev) => {
      const existing = prev[activeTicket.id] ?? [];
      if (existing.some((item) => item.label === tool.label)) return prev;
      return {
        ...prev,
        [activeTicket.id]: [...existing, { label: tool.label, output: tool.output }],
      };
    });
  };

  const handleCheckDiagnosis = () => {
    if (chosenOpt === undefined) return;
    setCheckedTicket((prev) => ({ ...prev, [activeTicket.id]: true }));
    if (chosenOpt === activeTicket.correctIndex) {
      if (solvedDebugIds.length + (isAlreadySolved ? 0 : 1) === DEBUG_TICKETS.length) {
        playVictory();
      } else {
        playSuccess();
      }
      onSolveDebugTicket(activeTicket.id);
    } else {
      playError();
    }
  };

  const filteredGlossary = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return GLOSSARY_TERMS;
    return GLOSSARY_TERMS.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const unlockedGlossaryCount = GLOSSARY_TERMS.filter(
    (g) => revealAllGlossary || completedIslands.includes(g.islandId) || g.islandId === 1
  ).length;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-2">
          <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
            Entraînement pratique, Révision active &amp; Référence technique
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            Debug Express, Carnet &amp; Cartes Mémo
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
            Diagnostiquez de vrais incidents réseau et Cloud, révisez avec les flashcards
            recto-verso ou consultez votre carnet de bord illustré.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Choisir l'atelier"
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-lg self-start md:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'debug'}
            onClick={() => {
              playClick();
              setActiveTab('debug');
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'debug'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Debug ({solvedDebugIds.length}/{DEBUG_TICKETS.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'flashcards'}
            onClick={() => {
              playClick();
              setActiveTab('flashcards');
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'flashcards'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Cartes Mémo ({FLASHCARDS.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'glossary'}
            onClick={() => {
              playClick();
              setActiveTab('glossary');
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'glossary'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Glossaire ({unlockedGlossaryCount}/{GLOSSARY_TERMS.length})
          </button>
        </div>
      </div>

      {activeTab === 'flashcards' ? (
        <FlashcardsDeck />
      ) : activeTab === 'debug' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Ticket Selector */}
          <aside className="lg:col-span-4 space-y-2.5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              File d&apos;incidents support (+40 XP par ticket résolu)
            </p>
            {DEBUG_TICKETS.map((ticket) => {
              const solved = solvedDebugIds.includes(ticket.id);
              const active = ticket.id === activeTicket.id;
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedTicketId(ticket.id);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-colors space-y-1 ${
                    active
                      ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-950 dark:text-sky-100'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{ticket.islandRef}</span>
                    {solved && (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Résolu
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold leading-snug">{ticket.title}</p>
                </button>
              );
            })}
          </aside>

          {/* Right Investigation Console */}
          <section className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold">{activeTicket.title}</span>
              <span className="font-mono text-xs text-sky-200">+{activeTicket.xpReward} XP</span>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Symptôme signalé
                </p>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {activeTicket.symptom}
                </p>
              </div>

              {/* Diagnostic Command Buttons */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  1. Lancez un ou plusieurs outils de diagnostic
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeTicket.tools.map((tool) => {
                    const alreadyRun = ticketOutputs.some((o) => o.label === tool.label);
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleRunTool(tool)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                          alreadyRun
                            ? 'bg-slate-900 dark:bg-sky-900/60 text-emerald-300 border-slate-900 dark:border-sky-700'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        {tool.label}
                      </button>
                    );
                  })}
                </div>

                {/* Console Output */}
                <div className="bg-slate-950 text-slate-100 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2.5 min-h-[110px]">
                  {ticketOutputs.length === 0 ? (
                    <p className="text-slate-400">
                      Cliquez sur une commande ci-dessus pour inspecter l&apos;incident...
                    </p>
                  ) : (
                    ticketOutputs.map((entry) => (
                      <div key={entry.label} className="space-y-0.5">
                        <p className="text-sky-300">$ {entry.label}</p>
                        <p className="text-slate-100 pl-3">{entry.output}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Root Cause Choice */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  2. Quelle est la cause probable de la panne ?
                </p>
                <div className="space-y-2">
                  {activeTicket.options.map((opt, idx) => {
                    const selected = chosenOpt === idx;
                    let cls =
                      'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800';
                    if (isChecked) {
                      if (idx === activeTicket.correctIndex) {
                        cls =
                          'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-semibold';
                      } else if (selected && idx !== activeTicket.correctIndex) {
                        cls =
                          'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-950 dark:text-red-200';
                      }
                    } else if (selected) {
                      cls =
                        'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-950 dark:text-sky-200 font-semibold';
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          playClick();
                          setSelectedOption((prev) => ({ ...prev, [activeTicket.id]: idx }));
                          setCheckedTicket((prev) => ({ ...prev, [activeTicket.id]: false }));
                        }}
                        className={`w-full text-left px-4 py-3 text-sm rounded-lg border transition-colors flex items-center justify-between gap-3 ${cls}`}
                      >
                        <span>{opt}</span>
                        {isChecked && idx === activeTicket.correctIndex && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        {isChecked && selected && idx !== activeTicket.correctIndex && (
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    disabled={chosenOpt === undefined}
                    onClick={handleCheckDiagnosis}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-45 rounded-lg transition-colors"
                  >
                    Valider mon diagnostic
                  </button>
                  {isAlreadySolved && (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Incident clôturé · +{activeTicket.xpReward} XP acquis
                    </span>
                  )}
                </div>

                {isChecked && (
                  <div
                    className={`p-4 rounded-lg text-xs leading-relaxed ${
                      chosenOpt === activeTicket.correctIndex
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                        : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                    }`}
                  >
                    <strong>
                      {chosenOpt === activeTicket.correctIndex
                        ? 'Excellent diagnostic !'
                        : 'Pas tout à fait — regardez bien les retours console :'}
                    </strong>{' '}
                    {activeTicket.explanation}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* Interactive Illustrated Glossary (Carnet de bord) */
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un terme (DNS, TCP, PaaS, FinOps...)"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={revealAllGlossary}
                onChange={(e) => {
                  playClick();
                  setRevealAllGlossary(e.target.checked);
                }}
                className="w-4 h-4 accent-sky-700"
              />
              Afficher tout le lexique (mode formateur)
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGlossary.map((entry) => {
              const unlocked =
                revealAllGlossary ||
                entry.islandId === 1 ||
                completedIslands.includes(entry.islandId);

              return (
                <article
                  key={entry.id}
                  className={`rounded-xl border p-5 space-y-2.5 ${
                    unlocked
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Île {String(entry.islandId).padStart(2, '0')} · {entry.category}
                    </span>
                    {unlocked ? (
                      <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                    {entry.term}
                  </h3>
                  {unlocked ? (
                    <>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {entry.definition}
                      </p>
                      <p className="text-xs text-sky-800 dark:text-sky-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <strong>Sur Cyberland :</strong> {entry.example}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Complétez l&apos;Île {entry.islandId} (ou activez le mode formateur) pour
                      débloquer cette fiche dans votre carnet de bord.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <GemiBotGuide
        contextLabel="Atelier Debug Express"
        hints={[
          "Réflexe d'ingénieur : exécute toujours les commandes de diagnostic (ping, nslookup, journal pare-feu) avant de conclure !",
          "Un ping vers une IP qui réussit alors que le nom de domaine échoue indique presque toujours un souci DNS.",
        ]}
      />
    </div>
  );
};
