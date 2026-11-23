import React, { useEffect, useMemo, useState } from 'react';
import { Timer, Play, RotateCcw, CheckCircle2, XCircle, Award, ArrowRight, Compass } from 'lucide-react';
import { AUDIENCE_QUIZZES, ISLANDS, QuizQuestion } from '../data/courseData';
import { playClick, playError, playSuccess, playVictory } from '../utils/sound';

interface ExamBlancPanelProps {
  bestExamScore: number | null;
  onFinishExam: (scoreOutOf20: number) => void;
  onOpenIsland?: (islandId: number) => void;
}

type ExamFormat = '10q' | '20q';

type DomainKey = 'fundamentals' | 'routing_vpn' | 'cloud_k8s' | 'sec_ad_soc' | 'observability';

const DOMAINS: { key: DomainKey; label: string; shortLabel: string }[] = [
  { key: 'fundamentals', label: 'Fondamentaux & OSI', shortLabel: 'Fondamentaux' },
  { key: 'routing_vpn', label: 'Routage, Types & VPN', shortLabel: 'Routage & VPN' },
  { key: 'cloud_k8s', label: 'Cloud, Docker & K8s', shortLabel: 'Cloud & K8s' },
  { key: 'sec_ad_soc', label: 'Sécurité, AD & SOC', shortLabel: 'Sécurité & SOC' },
  { key: 'observability', label: 'Wireshark & Azure Mon.', shortLabel: 'Observabilité' },
];

const RAPID_CASES: QuizQuestion[] = [
  {
    id: 'exam-case-1',
    islandRef: 'Cas pratique · Île 2 · Diagnostic DNS',
    question:
      'Incident en direct : le ping vers 192.168.1.42 répond en 12 ms, mais le navigateur affiche « Adresse introuvable » sur ile-des-palmiers.gem. Quelle est votre action prioritaire ?',
    options: [
      'Changer le câble Ethernet du poste client',
      'Vérifier la configuration et la disponibilité du serveur DNS',
      'Passer le site web de TCP vers UDP',
      'Augmenter la taille du disque dur du routeur',
    ],
    correctIndex: 1,
    explanation:
      'Le ping direct sur l’IP fonctionne, donc la couche physique et le routage IP sont bons. Seule la traduction Nom → IP (DNS) est en cause.',
  },
  {
    id: 'exam-case-2',
    islandRef: 'Cas pratique · Île 10 · Sécurité Zero Trust',
    question:
      'Une boutique en ligne reçoit un e-mail urgent de "support@cyber-land-securite.xyz" demandant le mot de passe root du serveur. Quel réflexe Zero Trust appliquer ?',
    options: [
      'Répondre rapidement avec le mot de passe pour éviter une coupure',
      'Ouvrir le port 23 (Telnet) pour que le support vérifie',
      'Signaler la tentative de phishing, ne jamais cliquer et conserver MFA + accès SSH restreint',
      'Désactiver le certificat HTTPS pendant 1 heure',
    ],
    correctIndex: 2,
    explanation:
      'Le domaine usurpé (.xyz) et l’urgence artificielle signent un phishing. En Zero Trust, aucun support légitime ne réclame un mot de passe par e-mail.',
  },
];

export function getExamMention(scoreOutOf20: number): string {
  if (scoreOutOf20 >= 18) return 'Félicitations du Jury';
  if (scoreOutOf20 >= 16) return 'Très Bien';
  if (scoreOutOf20 >= 14) return 'Bien';
  if (scoreOutOf20 >= 12) return 'Assez Bien';
  if (scoreOutOf20 >= 10) return 'Passable';
  return 'À consolider';
}

function extractIslandId(islandRef: string): number {
  const match = islandRef.match(/[ÎI]le\s*(\d+)/i);
  if (match) {
    const id = Number(match[1]);
    if (id >= 1 && id <= ISLANDS.length) return id;
  }
  const lower = islandRef.toLowerCase();
  if (lower.includes('dns') || lower.includes('ip')) return 2;
  if (lower.includes('wireshark') || lower.includes('tcpdump')) return 13;
  if (lower.includes('azure')) return 14;
  if (lower.includes('active directory') || lower.includes('kerberos')) return 15;
  if (lower.includes('soc') || lower.includes('siem')) return 16;
  if (lower.includes('kubernetes')) return 17;
  if (lower.includes('vpn') || lower.includes('nat')) return 18;
  return 10;
}

function getDomainForIsland(islandId: number): DomainKey {
  if ([1, 3, 8].includes(islandId)) return 'fundamentals';
  if ([2, 7, 18].includes(islandId)) return 'routing_vpn';
  if ([4, 5, 6, 9, 12, 17].includes(islandId)) return 'cloud_k8s';
  if ([10, 11, 15, 16].includes(islandId)) return 'sec_ad_soc';
  return 'observability'; // 13, 14
}

function buildExamQuestions(format: ExamFormat): QuizQuestion[] {
  const pool = [
    ...AUDIENCE_QUIZZES.collegiens,
    ...AUDIENCE_QUIZZES.etudiants,
    ...AUDIENCE_QUIZZES.reconversion,
  ];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const targetPoolCount = format === '20q' ? 18 : 8;
  return [...shuffled.slice(0, targetPoolCount), ...RAPID_CASES];
}

export const ExamBlancPanel: React.FC<ExamBlancPanelProps> = ({
  bestExamScore,
  onFinishExam,
  onOpenIsland,
}) => {
  const [format, setFormat] = useState<ExamFormat>('10q');
  const [phase, setPhase] = useState<'intro' | 'running' | 'finished'>('intro');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [finalScore, setFinalScore] = useState<number>(0);

  const durationSec = format === '20q' ? 600 : 300;
  const ptsPerQuestion = format === '20q' ? 1 : 2;

  const finalizeExam = (
    currentQuestions: QuizQuestion[],
    currentAnswers: Record<string, number>,
    currentPts: number
  ) => {
    const correct = currentQuestions.filter((q) => currentAnswers[q.id] === q.correctIndex).length;
    const score20 = Math.min(20, Math.round(correct * currentPts));
    setFinalScore(score20);
    setPhase('finished');
    if (score20 >= 16) {
      playVictory();
    } else if (score20 >= 10) {
      playSuccess();
    } else {
      playError();
    }
    onFinishExam(score20);
  };

  useEffect(() => {
    if (phase !== 'running') return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          finalizeExam(questions, answers, ptsPerQuestion);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, questions, answers, ptsPerQuestion]);

  const handleStart = (chosenFormat: ExamFormat = format) => {
    playClick();
    setFormat(chosenFormat);
    setQuestions(buildExamQuestions(chosenFormat));
    setAnswers({});
    setSecondsLeft(chosenFormat === '20q' ? 600 : 300);
    setPhase('running');
  };

  // Compute 5-domain mastery & missed islands when finished
  const radarMetrics = useMemo(() => {
    const stats: Record<DomainKey, { total: number; correct: number }> = {
      fundamentals: { total: 0, correct: 0 },
      routing_vpn: { total: 0, correct: 0 },
      cloud_k8s: { total: 0, correct: 0 },
      sec_ad_soc: { total: 0, correct: 0 },
      observability: { total: 0, correct: 0 },
    };
    const missedIslandIds = new Set<number>();

    questions.forEach((q) => {
      const islandId = extractIslandId(q.islandRef);
      const dom = getDomainForIsland(islandId);
      stats[dom].total += 1;
      if (answers[q.id] === q.correctIndex) {
        stats[dom].correct += 1;
      } else {
        missedIslandIds.add(islandId);
      }
    });

    const domainScores = DOMAINS.map((d) => {
      const st = stats[d.key];
      const pct = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 70;
      return {
        ...d,
        total: st.total,
        correct: st.correct,
        pct,
      };
    });

    const recommendedIslands = Array.from(missedIslandIds)
      .sort((a, b) => a - b)
      .map((id) => ISLANDS.find((i) => i.id === id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return { domainScores, recommendedIslands };
  }, [questions, answers]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const answeredCount = Object.keys(answers).length;

  // SVG pentagon coordinates helper for Radar Chart
  const radarCenter = { x: 150, y: 128 };
  const radarRadius = 82;
  const getPoint = (index: number, ratio: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 5;
    return {
      x: radarCenter.x + Math.cos(angle) * radarRadius * ratio,
      y: radarCenter.y + Math.sin(angle) * radarRadius * ratio,
    };
  };

  const dataPolygonPoints = radarMetrics.domainScores
    .map((d, idx) => {
      const p = getPoint(idx, Math.max(0.15, d.pct / 100));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ');

  if (phase === 'intro') {
    return (
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 max-w-3xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
            Évaluation chronométrée · Note sur 20 &amp; Radar de Compétences
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Examen Blanc Cyberland
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Testez votre maîtrise globale des 18 îles (réseaux, OSI, Active Directory, SOC/SIEM,
            Kubernetes, VPN, Wireshark et Azure Monitor). À l&apos;issue de l&apos;épreuve, obtenez
            votre Radar de Compétences sur 5 domaines et les îles précises à réviser.
          </p>
        </div>

        {/* Format Selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Choisissez le format d&apos;épreuve
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                setFormat('10q');
              }}
              className={`text-left p-4 rounded-xl border transition-colors space-y-1 ${
                format === '10q'
                  ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-950 dark:text-sky-100'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <p className="font-display text-sm font-bold">Format Express · 10 épreuves</p>
              <p className="font-mono text-xs text-sky-700 dark:text-sky-400 tabular-nums">
                05:00 min · 2 pts / bonne réponse
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                8 QCM aléatoires + 2 cas pratiques express
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setFormat('20q');
              }}
              className={`text-left p-4 rounded-xl border transition-colors space-y-1 ${
                format === '20q'
                  ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-950 dark:text-sky-100'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <p className="font-display text-sm font-bold">Format Certification · 20 épreuves</p>
              <p className="font-mono text-xs text-sky-700 dark:text-sky-400 tabular-nums">
                10:00 min · 1 pt / bonne réponse
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                18 QCM couvrant les 5 domaines + 2 cas pratiques
              </p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="text-slate-500 dark:text-slate-400">Épreuve choisie</p>
            <p className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {format === '20q' ? '20 épreuves' : '10 épreuves'}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              {format === '20q' ? 'Couverture complète 18 îles' : 'Entraînement rapide ciblé'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="text-slate-500 dark:text-slate-400">Chronomètre</p>
            <p className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {Math.floor(durationSec / 60)}:00 min
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Barème : {ptsPerQuestion} pt{ptsPerQuestion > 1 ? 's' : ''} par bonne réponse
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="text-slate-500 dark:text-slate-400">Meilleur score</p>
            <p className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {bestExamScore !== null ? `${bestExamScore} / 20` : 'Aucun essai'}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              {bestExamScore !== null ? `Mention : ${getExamMention(bestExamScore)}` : 'Prêt à relever le défi'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleStart(format)}
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          Démarrer l&apos;Examen Blanc ({format === '20q' ? '10 min · 20 Q' : '5 min · 10 Q'})
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sticky Exam Status Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Timer
            className={`w-5 h-5 ${
              phase === 'running' && secondsLeft <= 60
                ? 'text-red-600 dark:text-red-400'
                : 'text-sky-700 dark:text-sky-400'
            }`}
          />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {phase === 'running' ? 'Temps restant' : 'Épreuve terminée'}
            </p>
            <p
              className={`font-mono text-xl font-bold tabular-nums ${
                phase === 'running' && secondsLeft <= 60
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </p>
          </div>
        </div>

        {phase === 'running' ? (
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
              {answeredCount} / {questions.length} répondues
            </span>
            <button
              type="button"
              onClick={() => finalizeExam(questions, answers, ptsPerQuestion)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
            >
              Rendre ma copie
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Award className="w-6 h-6 text-amber-500" />
              <div>
                <p className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  Note : {finalScore} / 20
                </p>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Mention : {getExamMention(finalScore)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleStart(format)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Nouveau tirage
            </button>
          </div>
        )}
      </div>

      {/* Skills Radar Chart & Targeted Island Revision Panel */}
      {phase === 'finished' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          {/* Left: 5-Domain SVG Radar Chart */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-3 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 pb-5 lg:pb-0 lg:pr-6">
            <div className="text-center space-y-0.5">
              <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                Bilan analytique sur 5 pôles
              </p>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Radar de Compétences Cyberland
              </h3>
            </div>

            <svg
              viewBox="0 0 300 256"
              className="w-full max-w-[300px] h-auto"
              role="img"
              aria-label="Radar de compétences sur 5 domaines techniques"
            >
              {[0.25, 0.5, 0.75, 1].map((r) => {
                const pts = DOMAINS.map((_, idx) => {
                  const p = getPoint(idx, r);
                  return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                }).join(' ');
                return (
                  <polygon
                    key={r}
                    points={pts}
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="1"
                  />
                );
              })}
              {DOMAINS.map((d, idx) => {
                const edge = getPoint(idx, 1);
                const lbl = getPoint(idx, 1.24);
                return (
                  <g key={d.key}>
                    <line
                      x1={radarCenter.x}
                      y1={radarCenter.y}
                      x2={edge.x}
                      y2={edge.y}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-700"
                      strokeWidth="1"
                    />
                    <text
                      x={lbl.x}
                      y={lbl.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-slate-700 dark:fill-slate-300 text-[9.5px] font-semibold"
                    >
                      {d.shortLabel}
                    </text>
                  </g>
                );
              })}

              <polygon
                points={dataPolygonPoints}
                fill="rgba(2, 132, 199, 0.25)"
                stroke="#0284C7"
                strokeWidth="2.5"
              />
              {radarMetrics.domainScores.map((d, idx) => {
                const p = getPoint(idx, Math.max(0.15, d.pct / 100));
                return <circle key={d.key} cx={p.x} cy={p.y} r="4" fill="#0369A1" />;
              })}
            </svg>
          </div>

          {/* Right: Domain Breakdown + Clickable Island Revision Plan */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2.5">
              <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Détail par domaine
              </h4>
              <div className="space-y-2">
                {radarMetrics.domainScores.map((d) => (
                  <div key={d.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {d.label}
                      </span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {d.total > 0 ? `${d.correct}/${d.total} (${d.pct} %)` : 'Non tiré (70 %)'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          d.pct >= 80
                            ? 'bg-emerald-600'
                            : d.pct >= 50
                            ? 'bg-sky-600'
                            : 'bg-amber-600'
                        }`}
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Îles conseillées à réviser
                </h4>
              </div>

              {radarMetrics.recommendedIslands.length === 0 ? (
                <p className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                  Sans faute ! Toutes les notions évaluées sur cet examen sont parfaitement maîtrisées.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {radarMetrics.recommendedIslands.map((isl) => (
                    <button
                      key={isl.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        onOpenIsland?.(isl.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-900 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 rounded-lg transition-colors"
                    >
                      <span>Île {isl.id} · {isl.title.replace(/^\d+\.\s*/, '')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Question Cards */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const chosen = answers[q.id];
          const isCorrect = chosen === q.correctIndex;
          const isFinished = phase === 'finished';

          return (
            <article
              key={`${q.id}-${idx}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3.5"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Épreuve {String(idx + 1).padStart(2, '0')} · {q.islandRef}
                </span>
                <span className="font-mono tabular-nums">
                  {ptsPerQuestion} pt{ptsPerQuestion > 1 ? 's' : ''}
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                {q.question}
              </h3>

              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const selected = chosen === optIdx;
                  let style =
                    'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800';
                  if (isFinished) {
                    if (optIdx === q.correctIndex) {
                      style =
                        'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-semibold';
                    } else if (selected) {
                      style =
                        'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-950 dark:text-red-200';
                    } else {
                      style =
                        'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500';
                    }
                  } else if (selected) {
                    style =
                      'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-950 dark:text-sky-200 font-semibold';
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isFinished}
                      onClick={() => {
                        playClick();
                        setAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm rounded-lg border transition-colors flex items-center justify-between gap-3 ${style}`}
                    >
                      <span>{opt}</span>
                      {isFinished && optIdx === q.correctIndex && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      {isFinished && selected && optIdx !== q.correctIndex && (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {isFinished && (
                <div
                  className={`p-3 rounded-lg text-xs leading-relaxed ${
                    isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <strong>
                    {isCorrect ? `+${ptsPerQuestion} pt${ptsPerQuestion > 1 ? 's' : ''} · Exact !` : 'Correction :'}
                  </strong>{' '}
                  {q.explanation}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
