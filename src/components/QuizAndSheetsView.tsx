import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Download, Check, Award, Briefcase, Timer, Users } from 'lucide-react';
import {
  ACTIVITY_SHEETS,
  AUDIENCE_QUIZZES,
  AudienceLevel,
} from '../data/courseData';
import { CaseStudiesPanel } from './CaseStudiesPanel';
import { ExamBlancPanel } from './ExamBlancPanel';
import { ClassroomDuelPanel } from './ClassroomDuelPanel';
import { playClick, playError, playSuccess, playVictory } from '../utils/sound';

interface QuizAndSheetsViewProps {
  initialSection?: 'quiz' | 'cases' | 'exam' | 'duel';
  bestExamScore: number | null;
  onAwardQuizXp: (xpGain: number) => void;
  onAwardCaseXp?: (xpGain: number) => void;
  onFinishExam?: (scoreOutOf20: number) => void;
  onOpenIsland?: (islandId: number) => void;
}

export const QuizAndSheetsView: React.FC<QuizAndSheetsViewProps> = ({
  initialSection = 'quiz',
  bestExamScore,
  onAwardQuizXp,
  onAwardCaseXp,
  onFinishExam,
  onOpenIsland,
}) => {
  const [section, setSection] = useState<'quiz' | 'cases' | 'exam' | 'duel'>(initialSection);
  const [audience, setAudience] = useState<AudienceLevel>('collegiens');

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sheetExported, setSheetExported] = useState(false);
  const [quizExportStatus, setQuizExportStatus] = useState<'none' | 'gift' | 'csv'>('none');

  const questions = AUDIENCE_QUIZZES[audience];
  const sheet = ACTIVITY_SHEETS[audience];

  const handleAudienceChange = (next: AudienceLevel) => {
    playClick();
    setAudience(next);
    setAnswers({});
    setSubmitted(false);
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (submitted) return;
    playClick();
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter((q) => answers[q.id] === q.correctIndex).length;

  const handleSubmitQuiz = () => {
    setSubmitted(true);
    const earned = correctCount * 30;
    if (correctCount >= 4) {
      playVictory();
    } else if (correctCount >= 2) {
      playSuccess();
    } else {
      playError();
    }
    if (earned > 0) {
      onAwardQuizXp(earned);
    }
  };

  const handleResetQuiz = () => {
    playClick();
    setAnswers({});
    setSubmitted(false);
  };

  const handleDownloadSheet = () => {
    playSuccess();
    const md = [
      `# Fiche d'activité Cyberland — ${sheet.audienceLabel}`,
      '',
      `- **Durée :** ${sheet.duration}`,
      `- **Objectif pédagogique :** ${sheet.objective}`,
      `- **Prérequis :** ${sheet.prerequisites}`,
      '',
      '## Déroulé de la séance',
      ...sheet.steps.map(
        (s) => `### ${s.title} (${s.duration})\n${s.instructions}\n`
      ),
      '## Livrable attendu',
      sheet.deliverable,
      '',
      "## Critères d'évaluation",
      ...sheet.evaluationCriteria.map((c) => `- ${c}`),
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fiche-activite-cyberland-${audience}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSheetExported(true);
    window.setTimeout(() => setSheetExported(false), 2500);
  };

  const handleExportMoodleGift = () => {
    playSuccess();
    const escapeGift = (str: string) =>
      str.replace(/([~=#{}:])/g, '\\$1');

    const giftBlocks = questions.map((q, idx) => {
      const choices = q.options
        .map((opt, optIdx) =>
          optIdx === q.correctIndex
            ? `  =${escapeGift(opt)} #${escapeGift(q.explanation)}`
            : `  ~${escapeGift(opt)}`
        )
        .join('\n');
      return `::Cyberland-${audience}-Q${idx + 1}:: ${escapeGift(q.question)} {\n${choices}\n}`;
    });

    const blob = new Blob([giftBlocks.join('\n\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-cyberland-${audience}.gift`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setQuizExportStatus('gift');
    window.setTimeout(() => setQuizExportStatus('none'), 2500);
  };

  const handleExportKahootCsv = () => {
    playSuccess();
    const csvCell = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const header = [
      'Question',
      'Answer 1',
      'Answer 2',
      'Answer 3',
      'Answer 4',
      'Time limit (sec)',
      'Correct answer(s)',
    ].join(',');

    const rows = questions.map((q) =>
      [
        csvCell(q.question),
        csvCell(q.options[0] ?? ''),
        csvCell(q.options[1] ?? ''),
        csvCell(q.options[2] ?? ''),
        csvCell(q.options[3] ?? ''),
        '30',
        String(q.correctIndex + 1),
      ].join(',')
    );

    const blob = new Blob([[header, ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kahoot-cyberland-${audience}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setQuizExportStatus('csv');
    window.setTimeout(() => setQuizExportStatus('none'), 2500);
  };

  return (
    <div className="space-y-10 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-2">
          <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
            Évaluation &amp; Animation de séance · Contenu adaptatif
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            Quiz gamifiés &amp; Fiches d&apos;activités
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
            Sélectionnez votre public cible pour adapter automatiquement le vocabulaire du quiz et
            la fiche pédagogique clé en main.
          </p>
        </div>

        {/* Audience or Mode segmented selector */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => {
                playClick();
                setSection('quiz');
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                section === 'quiz'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Quiz &amp; Fiches
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setSection('cases');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                section === 'cases'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Études de cas (3)
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setSection('exam');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                section === 'exam'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              Examen Blanc (/20)
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setSection('duel');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                section === 'duel'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Défi Classe (2 Équipes)
            </button>
          </div>

          {section === 'quiz' && (
            <div
              role="tablist"
              aria-label="Choisir le public cible"
              className="inline-flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-lg"
            >
              {(
                [
                  { id: 'collegiens' as AudienceLevel, label: 'Collégiens / Lycéens' },
                  { id: 'etudiants' as AudienceLevel, label: 'Étudiants' },
                  { id: 'reconversion' as AudienceLevel, label: 'Reconversion pro' },
                ]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={audience === item.id}
                  onClick={() => handleAudienceChange(item.id)}
                  className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    audience === item.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {section === 'cases' ? (
        <CaseStudiesPanel onAwardCaseXp={(xp) => onAwardCaseXp?.(xp)} />
      ) : section === 'exam' ? (
        <ExamBlancPanel
          bestExamScore={bestExamScore}
          onFinishExam={(score20) => onFinishExam?.(score20)}
          onOpenIsland={onOpenIsland}
        />
      ) : section === 'duel' ? (
        <ClassroomDuelPanel />
      ) : (
      /* Main Split: Quiz on left (7 cols), Activity Sheet on right (5 cols) */
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Interactive Quiz */}
        <section className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                Quiz interactif ({questions.length} questions)
              </h2>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {answeredCount}/{questions.length} répondues · +30 XP / bonne réponse
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportMoodleGift}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                {quizExportStatus === 'gift' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {quizExportStatus === 'gift' ? 'GIFT exporté' : 'Export Moodle (.gift)'}
              </button>
              <button
                type="button"
                onClick={handleExportKahootCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                {quizExportStatus === 'csv' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {quizExportStatus === 'csv' ? 'CSV exporté' : 'Export Kahoot (.csv)'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, qIdx) => {
              const chosen = answers[q.id];
              const isCorrect = chosen === q.correctIndex;

              return (
                <article
                  key={q.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
                >
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Question {String(qIdx + 1).padStart(2, '0')} · {q.islandRef}
                    </p>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                      {q.question}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const selected = chosen === optIdx;
                      let optionStyle =
                        'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800';
                      if (submitted) {
                        if (optIdx === q.correctIndex) {
                          optionStyle =
                            'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-semibold';
                        } else if (selected && optIdx !== q.correctIndex) {
                          optionStyle =
                            'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-950 dark:text-red-200';
                        } else {
                          optionStyle =
                            'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500';
                        }
                      } else if (selected) {
                        optionStyle =
                          'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-950 dark:text-sky-200 font-semibold';
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={submitted}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`w-full text-left px-4 py-3 text-sm rounded-lg border transition-colors flex items-center justify-between gap-3 ${optionStyle}`}
                        >
                          <span>{opt}</span>
                          {submitted && optIdx === q.correctIndex && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                          {submitted && selected && optIdx !== q.correctIndex && (
                            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <div
                      className={`p-3.5 rounded-lg text-xs leading-relaxed ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <strong>{isCorrect ? 'Exact !' : 'Explication :'}</strong> {q.explanation}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Quiz Submit / Result Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
            {!submitted ? (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {answeredCount < questions.length
                    ? `Répondez aux ${questions.length - answeredCount} question(s) restante(s) pour valider.`
                    : 'Toutes les réponses sont prêtes : validez pour obtenir vos XP !'}
                </p>
                <button
                  type="button"
                  disabled={answeredCount < questions.length}
                  onClick={handleSubmitQuiz}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-45 rounded-lg transition-colors"
                >
                  Valider mes réponses
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <p className="font-display text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      Score : {correctCount} / {questions.length} (+{correctCount * 30} XP)
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {correctCount >= 4
                        ? 'Excellente maîtrise des fondamentaux Réseaux & Cloud !'
                        : 'Relisez les explications ci-dessus puis retentez le défi.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetQuiz}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Recommencer
                </button>
              </>
            )}
          </div>
        </section>

        {/* Printable / Downloadable Activity Sheet */}
        <aside className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
          <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Fiche d&apos;activité clé en main</span>
              <span className="font-mono">{sheet.duration}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              {sheet.audienceLabel}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {sheet.objective}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <strong>Prérequis :</strong> {sheet.prerequisites}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Déroulé pédagogique conseillé
            </h3>
            <div className="space-y-3">
              {sheet.steps.map((step) => (
                <div
                  key={step.title}
                  className="p-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {step.title}
                    </p>
                    <span className="font-mono text-xs text-sky-800 dark:text-sky-400 shrink-0">
                      {step.duration}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {step.instructions}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Livrable attendu</p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {sheet.deliverable}
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Critères d&apos;évaluation
            </p>
            <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc pl-4">
              {sheet.evaluationCriteria.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={handleDownloadSheet}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 dark:bg-sky-700 hover:bg-slate-800 dark:hover:bg-sky-800 rounded-lg transition-colors"
          >
            {sheetExported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {sheetExported ? 'Fiche exportée (.md)' : 'Télécharger la fiche (.md)'}
          </button>
        </aside>
      </div>
      )}
    </div>
  );
};
