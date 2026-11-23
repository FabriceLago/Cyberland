import React, { useState } from 'react';
import { Briefcase, CheckCircle2, RotateCcw } from 'lucide-react';
import { CASE_STUDIES } from '../data/extraLabsData';
import { playClick, playSuccess, playVictory } from '../utils/sound';

interface CaseStudiesPanelProps {
  onAwardCaseXp: (xp: number) => void;
}

export const CaseStudiesPanel: React.FC<CaseStudiesPanelProps> = ({ onAwardCaseXp }) => {
  const [selectedCaseId, setSelectedCaseId] = useState(CASE_STUDIES[0].id);
  const [choices, setChoices] = useState<Record<string, Record<string, string>>>({});
  const [submittedCases, setSubmittedCases] = useState<Record<string, boolean>>({});

  const activeCase = CASE_STUDIES.find((c) => c.id === selectedCaseId) ?? CASE_STUDIES[0];
  const caseChoices = choices[activeCase.id] ?? {};
  const isSubmitted = submittedCases[activeCase.id] ?? false;

  const answeredAll = activeCase.decisions.every((d) => Boolean(caseChoices[d.id]));

  const totalScore = activeCase.decisions.reduce((sum, d) => {
    const picked = d.options.find((o) => o.id === caseChoices[d.id]);
    return sum + (picked ? picked.score : 0);
  }, 0);
  const maxScore = activeCase.decisions.length * 2;

  const handlePick = (decisionId: string, optionId: string) => {
    if (isSubmitted) return;
    playClick();
    setChoices((prev) => ({
      ...prev,
      [activeCase.id]: {
        ...(prev[activeCase.id] ?? {}),
        [decisionId]: optionId,
      },
    }));
  };

  const handleValidate = () => {
    setSubmittedCases((prev) => ({ ...prev, [activeCase.id]: true }));
    if (totalScore >= maxScore - 1) {
      playVictory();
      onAwardCaseXp(60);
    } else {
      playSuccess();
      if (totalScore >= 3) onAwardCaseXp(30);
    }
  };

  const handleResetCase = () => {
    playClick();
    setChoices((prev) => ({ ...prev, [activeCase.id]: {} }));
    setSubmittedCases((prev) => ({ ...prev, [activeCase.id]: false }));
  };

  return (
    <div className="space-y-6">
      {/* Case selector */}
      <div className="flex flex-wrap items-center gap-2">
        {CASE_STUDIES.map((cs) => (
          <button
            key={cs.id}
            type="button"
            onClick={() => {
              playClick();
              setSelectedCaseId(cs.id);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              cs.id === activeCase.id
                ? 'bg-sky-700 text-white border-sky-700'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {cs.title}
          </button>
        ))}
      </div>

      {/* Case Study Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs text-sky-700 dark:text-sky-400 font-semibold">
            <Briefcase className="w-4 h-4" />
            <span>{activeCase.sector}</span>
          </div>
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            {activeCase.title}
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {activeCase.brief}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{activeCase.budgetHint}</p>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Exigences du client
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc pl-4">
              {activeCase.constraints.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-4">
          {activeCase.decisions.map((decision) => {
            const selectedId = caseChoices[decision.id];
            const pickedOption = decision.options.find((o) => o.id === selectedId);

            return (
              <div
                key={decision.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
              >
                <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  {decision.label}
                </h4>

                <div className="space-y-2">
                  {decision.options.map((opt) => {
                    const active = selectedId === opt.id;
                    let cls =
                      'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800';
                    if (isSubmitted) {
                      if (opt.score === 2) {
                        cls =
                          'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100';
                      } else if (active && opt.score < 2) {
                        cls =
                          'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100';
                      }
                    } else if (active) {
                      cls =
                        'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-950 dark:text-sky-100';
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => handlePick(decision.id, opt.id)}
                        className={`w-full text-left p-3.5 rounded-lg border transition-colors ${cls}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{opt.title}</p>
                          {isSubmitted && opt.score === 2 && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs opacity-80 mt-0.5">{opt.detail}</p>
                      </button>
                    );
                  })}
                </div>

                {isSubmitted && pickedOption && (
                  <p className="text-xs p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <strong>Avis d&apos;architecte ({pickedOption.score}/2 pts) :</strong>{' '}
                    {pickedOption.feedback}
                  </p>
                )}
              </div>
            );
          })}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
            {!isSubmitted ? (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {answeredAll
                    ? 'Toutes vos recommandations sont sélectionnées.'
                    : 'Sélectionnez une recommandation pour chaque point du brief.'}
                </p>
                <button
                  type="button"
                  disabled={!answeredAll}
                  onClick={handleValidate}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-45 rounded-lg transition-colors"
                >
                  Soumettre ma recommandation
                </button>
              </>
            ) : (
              <>
                <div>
                  <p className="font-display text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    Évaluation du dossier : {totalScore} / {maxScore} points
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {totalScore >= maxScore - 1
                      ? 'Architecture professionnelle solide (+60 XP) !'
                      : 'Comparez vos choix avec les recommandations marquées en vert.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetCase}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Refaire ce brief
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
