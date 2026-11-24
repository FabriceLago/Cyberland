import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Play,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  Radio,
  Cloud,
  Server,
  Leaf,
  Star,
  Moon,
  Sun,
  Type,
  Users,
  Network,
  Layers,
  Box,
  ShieldAlert,
  Monitor,
  Trophy,
  Lock,
  KeyRound,
  GitMerge,
  FileText,
  Radar,
  MonitorCheck,
  FolderTree,
  Siren,
  Boxes,
  Briefcase,
  Check,
  Clock,
  Pencil,
} from 'lucide-react';
import {
  ANALYST_LEARNING_PHASES,
  ASSETS,
  CAREER_TRACKS,
  CareerTrack,
  getAnalystPhaseForIsland,
  getAnalystStepNumber,
  getOrderedIslandsForTrack,
  ISLANDS,
} from '../data/courseData';
import { getHighestUnlockedBadge } from '../data/expertiseBadges';
import {
  getFriendlyFirstName,
  getHumanEncouragement,
  getTimeGreeting,
  LEARNING_PACES,
  LearningPaceId,
} from '../data/mentors';
import { GemiBotGuide } from './GemiBotGuide';
import { ExpertiseBadgesShowcase } from './ExpertiseBadgesShowcase';
import {
  AnimatedNumber,
  EASE_SWISS,
} from './MotionPrimitives';
import { TacticalSocTelemetryBoard } from './TacticalSocTelemetryBoard';
import { playClick } from '../utils/sound';

interface ArchipelagoViewProps {
  learnerName?: string;
  learningPace?: LearningPaceId;
  onChangeLearnerName?: (name: string) => void;
  onChangeLearningPace?: (pace: LearningPaceId) => void;
  completedIslands: number[];
  starsByIsland: Record<number, number>;
  solvedDebugCount: number;
  ctfFlagsCount?: number;
  bestExamScore: number | null;
  passedExamsCount: number;
  ddosWon: boolean;
  terminalCompleted: boolean;
  crisisContained: boolean;
  speedrunsCompleted?: number;
  neutralizedAttacksCount?: number;
  selectedTrackId: CareerTrack['id'];
  xp: number;
  quizBonusXp: number;
  debugBonusXp: number;
  extraBonusXp: number;
  darkMode: boolean;
  readableMode: boolean;
  projectionMode: boolean;
  speechRate: number;
  onSelectTrack: (trackId: CareerTrack['id']) => void;
  onToggleDarkMode: () => void;
  onToggleReadableMode: () => void;
  onToggleProjectionMode: () => void;
  onChangeSpeechRate: (rate: number) => void;
  onSelectIsland: (islandId: number) => void;
  onOpenSimulator: () => void;
  onOpenExam: () => void;
  onOpenCertificate: () => void;
  onOpenTransfer: () => void;
  onOpenCheatsheet: () => void;
  onOpenDemoVideo?: () => void;
  onResetProgress: () => void;
}

export const ArchipelagoView: React.FC<ArchipelagoViewProps> = ({
  learnerName = 'Architecte Explorateur',
  learningPace = 'regulier',
  onChangeLearnerName,
  onChangeLearningPace,
  completedIslands,
  starsByIsland,
  solvedDebugCount,
  ctfFlagsCount = 0,
  bestExamScore,
  passedExamsCount,
  ddosWon,
  terminalCompleted,
  crisisContained,
  speedrunsCompleted = 0,
  neutralizedAttacksCount = 0,
  selectedTrackId,
  xp,
  quizBonusXp,
  debugBonusXp,
  extraBonusXp,
  darkMode,
  readableMode,
  projectionMode,
  speechRate,
  onSelectTrack,
  onToggleDarkMode,
  onToggleReadableMode,
  onToggleProjectionMode,
  onChangeSpeechRate,
  onSelectIsland,
  onOpenSimulator,
  onOpenExam,
  onOpenCertificate,
  onOpenTransfer,
  onOpenCheatsheet,
  onOpenDemoVideo,
  onResetProgress,
}) => {
  const [hoveredIslandId, setHoveredIslandId] = useState<number | null>(null);
  const [mapImgError, setMapImgError] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');

  const greeting = getTimeGreeting();
  const firstName = getFriendlyFirstName(learnerName);
  const encouragementLine = getHumanEncouragement(
    completedIslands.length,
    ISLANDS.length,
    learningPace,
    solvedDebugCount
  );

  const handleStartEditName = () => {
    playClick();
    setDraftName(firstName);
    setEditingName(true);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    if (onChangeLearnerName) {
      onChangeLearnerName(draftName.trim());
    }
    setEditingName(false);
  };

  const totalXp = xp + quizBonusXp + debugBonusXp + extraBonusXp;
  const highestMedal = getHighestUnlockedBadge(
    totalXp,
    passedExamsCount,
    bestExamScore,
    speedrunsCompleted,
    neutralizedAttacksCount
  );

  const activeTrack =
    CAREER_TRACKS.find((t) => t.id === selectedTrackId) ?? CAREER_TRACKS[0];
  const visibleIslands = getOrderedIslandsForTrack(selectedTrackId);
  const trackCompletedCount = activeTrack.islandIds.filter((id) =>
    completedIslands.includes(id)
  ).length;

  const nextIsland =
    visibleIslands.find((i) => !completedIslands.includes(i.id)) ??
    visibleIslands[visibleIslands.length - 1] ??
    ISLANDS[0];
  const nextStepNumber = getAnalystStepNumber(nextIsland.id, selectedTrackId);
  const totalPossibleXp = ISLANDS.reduce((acc, i) => acc + i.xpReward, 0);
  const totalStars = Object.values(starsByIsland).reduce((a, b) => a + b, 0);
  const maxStars = ISLANDS.length * 3;
  const progressPercent = Math.round((completedIslands.length / ISLANDS.length) * 100);

  const activeIslandInfo =
    ISLANDS.find((i) => i.id === hoveredIslandId) ?? nextIsland;
  const activeIslandPhase = getAnalystPhaseForIsland(activeIslandInfo.id);
  const activeIslandStep = getAnalystStepNumber(activeIslandInfo.id, selectedTrackId);

  const groupedPhases = ANALYST_LEARNING_PHASES.map((phase) => {
    const phaseIslands = visibleIslands.filter((island) => phase.islandIds.includes(island.id));
    const phaseDoneCount = phaseIslands.filter((i) => completedIslands.includes(i.id)).length;
    return {
      ...phase,
      islands: phaseIslands,
      doneCount: phaseDoneCount,
    };
  }).filter((p) => p.islands.length > 0);

  const mapConnections: [number, number][] = [
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [2, 5],
    [1, 6],
    [6, 4],
    [2, 7],
    [5, 7],
    [1, 8],
    [8, 5],
    [4, 9],
    [9, 7],
    [6, 10],
    [10, 4],
    [6, 11],
    [11, 10],
    [4, 12],
    [12, 9],
    [5, 13],
    [13, 7],
    [6, 14],
    [14, 10],
    [11, 15],
    [15, 1],
    [10, 16],
    [16, 12],
    [9, 17],
    [17, 7],
    [13, 18],
    [18, 7],
  ];

  const perfectStarsCount = Object.values(starsByIsland).filter((s) => s === 3).length;
  const achievements = [
    {
      id: 'ach-perfectionist',
      title: 'Perfectionniste 3★',
      detail: 'Obtenir 3 étoiles sur au moins 3 îles différentes.',
      unlocked: perfectStarsCount >= 3,
      progress: `${Math.min(perfectStarsCount, 3)}/3`,
    },
    {
      id: 'ach-green',
      title: 'Champion Green IT',
      detail: 'Obtenir 3 étoiles sur l’Île 06 (Éco-Cloud & FinOps).',
      unlocked: (starsByIsland[6] ?? 0) === 3,
      progress: `${starsByIsland[6] ?? 0}/3 ★`,
    },
    {
      id: 'ach-cyber',
      title: 'Gardien Cyber & Anti-DDoS',
      detail: 'Valider l’Île 10 (Zero Trust) ou repousser l’attaque Anti-DDoS.',
      unlocked: completedIslands.includes(10) || ddosWon,
      progress: completedIslands.includes(10) || ddosWon ? 'Validé' : '0/1',
    },
    {
      id: 'ach-crisis',
      title: 'Commandant de Crise SOC',
      detail: 'Contenir l’attaque temps réel dans le labo Gestion de Crise Live.',
      unlocked: crisisContained,
      progress: crisisContained ? 'Contenue' : '0/1',
    },
    {
      id: 'ach-cli',
      title: 'Hacker Éthique CLI',
      detail: 'Réussir les 4 missions dans CyberShell (Linux / PowerShell).',
      unlocked: terminalCompleted,
      progress: terminalCompleted ? '4/4' : 'En attente',
    },
    {
      id: 'ach-debug',
      title: 'Pompiers du Réseau',
      detail: 'Résoudre au moins 4 tickets d’incidents dans Debug Express.',
      unlocked: solvedDebugCount >= 4,
      progress: `${Math.min(solvedDebugCount, 4)}/4`,
    },
    {
      id: 'ach-exam',
      title: 'Mention d’Honneur',
      detail: 'Décrocher au moins 16/20 (Très Bien) à l’Examen Blanc chronométré.',
      unlocked: bestExamScore !== null && bestExamScore >= 16,
      progress: bestExamScore !== null ? `${bestExamScore}/20` : 'Non passé',
    },
  ];
  const unlockedAchievementsCount = achievements.filter((a) => a.unlocked).length;

  const getIslandById = (id: number) => ISLANDS.find((i) => i.id === id)!;

  return (
    <div className="space-y-12 pb-16">
      {/* Split Hero + Interactive Archipelago Map */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Warm Personalized Greeting & Inline First-Name Personalization */}
            <div className="space-y-2 pb-3 border-b border-slate-200 dark:border-slate-800/90">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-sky-700 dark:text-sky-400">
                  {firstName ? `${greeting} ${firstName}` : `${greeting}, ravi de vous retrouver`}
                </p>
                {!editingName && onChangeLearnerName && (
                  <button
                    type="button"
                    onClick={handleStartEditName}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    {firstName ? 'Modifier' : 'Personnaliser mon prénom'}
                  </button>
                )}
              </div>

              {editingName && (
                <form onSubmit={handleSaveName} className="flex items-center gap-2 pt-0.5">
                  <input
                    type="text"
                    maxLength={32}
                    autoFocus
                    placeholder="Votre prénom ou pseudo..."
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 text-white transition-colors shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    OK
                  </button>
                </form>
              )}

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {encouragementLine}
              </p>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.08]">
              L&apos;Archipel de Cyberland
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-prose">
              Apprenez les réseaux, le Cloud et la cybersécurité comme sur le terrain :{' '}
              {ISLANDS.length} étapes progressives, des schémas vivants et des ateliers concrets où
              vous avez le droit de tester et d&apos;essayer.
            </p>

            {/* Compact Daily Pace Selector */}
            {onChangeLearningPace && (
              <div className="pt-1 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Votre rythme du moment :</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {LEARNING_PACES.map((pace) => {
                    const active = learningPace === pace.id;
                    return (
                      <button
                        key={pace.id}
                        type="button"
                        onClick={() => {
                          playClick();
                          onChangeLearningPace(pace.id);
                        }}
                        className={`text-left px-2.5 py-2 rounded-lg border transition-colors ${
                          active
                            ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-600 text-sky-950 dark:text-sky-100'
                            : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-semibold leading-tight">{pace.label}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                          {pace.duration}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                onSelectIsland(nextIsland.id);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Play className="w-4 h-4" />
              {trackCompletedCount === 0
                ? 'Démarrer · Étape 1'
                : trackCompletedCount === visibleIslands.length
                ? 'Revoir le Centre SOC & SIEM'
                : `Continuer · Étape ${nextStepNumber}/${visibleIslands.length}`}
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                onOpenSimulator();
              }}
              className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Laboratoires
              <ArrowRight className="w-4 h-4" />
            </button>
            {onOpenDemoVideo && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onOpenDemoVideo();
                }}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-sky-800 dark:text-cyan-300 bg-sky-50 dark:bg-cyan-950/50 border border-sky-200 dark:border-cyan-500/40 hover:bg-sky-100 dark:hover:bg-cyan-900/50 rounded-lg transition-colors whitespace-nowrap"
              >
                <PlayCircle className="w-4 h-4" />
                Démo vidéo · 5 min
              </button>
            )}
          </div>

          {/* Active Map Preview Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 min-h-[158px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIslandInfo.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: EASE_SWISS }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="tabular-nums">
                    {activeIslandPhase ? `Palier ${activeIslandPhase.phaseNumber} · ` : ''}Étape{' '}
                    {activeIslandStep}/{visibleIslands.length}
                  </span>
                  <span className="font-mono tabular-nums text-sky-700 dark:text-sky-400 font-medium">
                    +{activeIslandInfo.xpReward} XP
                  </span>
                </div>
                <p className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {activeIslandInfo.title.replace(/^\d+\.\s*/, '')}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeIslandInfo.summary}
                </p>
                <div className="pt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Mini-jeu : {activeIslandInfo.gameTitle}</span>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      onSelectIsland(activeIslandInfo.id);
                    }}
                    className="font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 transition-colors"
                  >
                    Ouvrir le module →
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Interactive Illustrated Archipelago Map */}
        <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-slate-200 bg-sky-950 min-h-[380px] lg:h-full flex flex-col">
          {!mapImgError ? (
            <img
              src={ASSETS.archipelagoMap}
              alt={`Carte illustrée de l'Archipel de Cyberland et ses ${ISLANDS.length} îles`}
              referrerPolicy="no-referrer"
              onError={() => setMapImgError(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-sky-800 via-sky-900 to-slate-900 flex items-center justify-center">
              <Compass className="w-16 h-16 text-sky-300/40" />
            </div>
          )}

          {/* Subtle measured legibility vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/15 to-slate-950/20 pointer-events-none" />

          {/* SVG submarine cable links between islands */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            {mapConnections.map(([aId, bId]) => {
              const a = getIslandById(aId).mapPosition;
              const b = getIslandById(bId).mapPosition;
              const inTrack =
                activeTrack.islandIds.includes(aId) && activeTrack.islandIds.includes(bId);
              const isConnected =
                completedIslands.includes(aId) && completedIslands.includes(bId);
              const isPartial =
                completedIslands.includes(aId) || completedIslands.includes(bId);
              return (
                <line
                  key={`${aId}-${bId}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={
                    !inTrack
                      ? 'rgba(255,255,255,0.16)'
                      : isConnected
                      ? '#34d399'
                      : isPartial
                      ? '#7dd3fc'
                      : 'rgba(255,255,255,0.55)'
                  }
                  strokeWidth={inTrack && isConnected ? '0.65' : '0.45'}
                  strokeDasharray={isConnected ? '1.8 1.4' : '1.4 1.2'}
                  className={inTrack && (isConnected || isPartial) ? 'flow-dash' : ''}
                />
              );
            })}
          </svg>

          {/* Clickable Island Beacons */}
          {ISLANDS.map((island) => {
            const done = completedIslands.includes(island.id);
            const inTrack = activeTrack.islandIds.includes(island.id);
            const isNext = nextIsland.id === island.id && !done;
            const stepNum = getAnalystStepNumber(island.id, selectedTrackId);
            return (
              <button
                key={island.id}
                type="button"
                title={`Étape ${stepNum} · ${island.title.replace(/^\d+\.\s*/, '')}`}
                onMouseEnter={() => setHoveredIslandId(island.id)}
                onFocus={() => setHoveredIslandId(island.id)}
                onClick={() => {
                  playClick();
                  onSelectIsland(island.id);
                }}
                style={{
                  left: `${island.mapPosition.x}%`,
                  top: `${island.mapPosition.y}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 group flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-left transition-all duration-150 hover:scale-105 focus-visible:scale-105 shadow-md ${
                  !inTrack
                    ? 'opacity-35 bg-slate-900/75 border-white/20 text-white/80 hover:opacity-90'
                    : done
                    ? 'bg-emerald-700 border-emerald-300 text-white'
                    : isNext
                    ? 'bg-sky-700 border-white text-white'
                    : 'bg-slate-900/90 border-white/40 text-white hover:bg-slate-900'
                }`}
              >
                <span className="font-mono text-xs font-semibold tabular-nums">
                  {done ? '✓' : String(stepNum).padStart(2, '0')}
                </span>
                <span className="text-[11px] font-semibold whitespace-nowrap hidden xl:inline">
                  {island.title.replace(/^\d+\.\s*/, '')}
                </span>
              </button>
            );
          })}

          {/* Bottom map legend */}
          <div className="relative mt-auto p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-white/95">
            <span className="font-medium">
              Cliquez sur une île pour ouvrir son animation et son mini-jeu
            </span>
            <span className="font-mono tabular-nums text-white/90">
              Liaisons restaurées : {completedIslands.length}/{ISLANDS.length}
            </span>
          </div>
        </div>
      </section>

      {/* Full-width 4-column Progress KPI Strip below Hero Split */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Expérience accumulée</p>
          <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            <AnimatedNumber value={totalXp} />{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">XP</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Objectif parcours : {totalPossibleXp.toLocaleString('fr-FR')} XP
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Îles reconnectées</p>
          <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            <AnimatedNumber value={completedIslands.length} /> / {ISLANDS.length}
          </p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
            <motion.div
              className="h-full bg-sky-700 dark:bg-sky-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.55, ease: EASE_SWISS }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Étoiles de maîtrise</p>
          <p className="font-mono text-2xl font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
            <AnimatedNumber value={totalStars} /> / {maxStars} ★
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            1 à 3 étoiles selon votre optimisation
          </p>
        </div>

        <div className="space-y-2 flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {highestMedal ? 'Médaille d’Expertise active' : "Rang d'Architecte"}
            </p>
            <p className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              {highestMedal
                ? highestMedal.title
                : completedIslands.length === 0
                ? 'Apprenti Explorateur'
                : completedIslands.length < 3
                ? 'Technicien Réseau'
                : completedIslands.length < ISLANDS.length
                ? 'Ingénieur Cloud'
                : 'Grand Architecte Céleste'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                onOpenCertificate();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              Mon diplôme
            </button>
            {completedIslands.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onResetProgress();
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Direction 2 — Tactical SOC & Telemetry Operations Board */}
      <TacticalSocTelemetryBoard
        completedIslandsCount={completedIslands.length}
        totalIslandsCount={ISLANDS.length}
        neutralizedAttacksCount={neutralizedAttacksCount}
        solvedDebugCount={solvedDebugCount}
        ctfFlagsCount={ctfFlagsCount}
        onOpenLabs={onOpenSimulator}
      />

      {/* Virtual Expertise Medals Showcase on Home Page */}
      <ExpertiseBadgesShowcase
        totalXp={totalXp}
        passedExamsCount={passedExamsCount}
        bestExamScore={bestExamScore}
        speedrunsCompleted={speedrunsCompleted}
        neutralizedAttacksCount={neutralizedAttacksCount}
        onOpenExam={onOpenExam}
      />

      {/* Comfort, Accessibility & Classroom Transfer Toolbar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playClick();
              onToggleDarkMode();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            {darkMode ? 'Mode Clair' : 'Mode Sombre'}
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              onToggleReadableMode();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
              readableMode
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-600 text-sky-900 dark:text-sky-200'
                : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Lecture facilitée {readableMode ? '(ON)' : ''}
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              onToggleProjectionMode();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
              projectionMode
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-600 text-sky-900 dark:text-sky-200'
                : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Mode Projection {projectionMode ? '(ON)' : ''}
          </button>

          <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 pl-1">
            <span>Voix off :</span>
            <select
              value={speechRate}
              onChange={(e) => onChangeSpeechRate(Number(e.target.value))}
              className="px-2 py-1 text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200"
            >
              <option value={0.85}>0.85x</option>
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playClick();
              onOpenCheatsheet();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            Antisèche A4
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              onOpenTransfer();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5" />
            Code de transfert &amp; Mode Classe
          </button>
        </div>
      </section>

      {/* Direct Practical Guidance Strip */}
      <GemiBotGuide
        contextLabel="Pour bien démarrer"
        hints={[
          "Bienvenue sur Cyberland ! Commencez sereinement par l'Île 1 pour voir comment circule un signal, puis avancez à votre rythme jusqu'au Cloud.",
          "Pas besoin de tout mémoriser du premier coup : chaque île combine une courte animation commentée et un atelier pratique où l'erreur aide à comprendre.",
          "Si vous préférez pratiquer tout de suite, ouvrez le simulateur de paquets pour suivre une requête de bout en bout.",
        ]}
      />

      {/* Career Tracks Selector Bar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Briefcase className="w-5 h-5 text-sky-700 dark:text-sky-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Parcours Métiers Guidés
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Filtrez la carte et les îles selon votre objectif professionnel, puis éditez le
                diplôme correspondant.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {trackCompletedCount} / {activeTrack.islandIds.length} îles du parcours validées
            </span>
            <button
              type="button"
              onClick={() => {
                playClick();
                onOpenCertificate();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Award className="w-3.5 h-3.5" />
              Diplôme du parcours
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CAREER_TRACKS.map((track) => {
            const active = track.id === selectedTrackId;
            const doneInTrack = track.islandIds.filter((id) =>
              completedIslands.includes(id)
            ).length;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => {
                  playClick();
                  onSelectTrack(track.id);
                }}
                className={`text-left p-4 rounded-xl border transition-colors space-y-1.5 ${
                  active
                    ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-950 dark:text-sky-100'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold">{track.label}</span>
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-sky-700 dark:text-sky-400">
                    {doneInTrack}/{track.islandIds.length}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {track.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Curriculum List — Ordered by Analyst Progression (5 Phases) */}
      <section id="parcours-iles" className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
              Ordre progressif recommandé pour devenir analyste
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {selectedTrackId === 'all'
                ? `Feuille de route Analyste en ${groupedPhases.length} Paliers (${visibleIslands.length} étapes)`
                : `${activeTrack.label} (${visibleIslands.length} étapes)`}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Des fondamentaux réseau (paquets, OSI, IP/IPv6) aux systèmes cloisonnés (VLAN, VPN,
              Linux, Active Directory), puis menaces/API, Cloud/K8s et enfin investigation terrain
              (Wireshark, KQL, SOC/SIEM).
            </p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
            {trackCompletedCount} / {visibleIslands.length} étape
            {visibleIslands.length > 1 ? 's' : ''} validée{trackCompletedCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Interactive 5-Phase Analyst Roadmap Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {groupedPhases.map((phase) => {
            const phasePct = Math.round((phase.doneCount / phase.islands.length) * 100);
            const isPhaseComplete = phase.doneCount === phase.islands.length;
            const containsNext = phase.islands.some((i) => i.id === nextIsland.id);
            return (
              <a
                key={phase.id}
                href={`#${phase.id}`}
                onClick={() => playClick()}
                className={`rounded-xl border p-3.5 transition-colors space-y-2 ${
                  isPhaseComplete
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : containsNext
                    ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-500/80 dark:border-sky-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-mono">
                  <span
                    className={`font-bold ${
                      isPhaseComplete
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : containsNext
                        ? 'text-sky-700 dark:text-sky-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Palier {phase.phaseNumber}
                  </span>
                  <span className="tabular-nums text-slate-600 dark:text-slate-400">
                    {phase.doneCount}/{phase.islands.length}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {phase.title.replace(/^Palier \d+\s*·\s*/, '')}
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isPhaseComplete ? 'bg-emerald-600' : 'bg-sky-600'
                    }`}
                    style={{ width: `${phasePct}%` }}
                  />
                </div>
              </a>
            );
          })}
        </div>

        {/* Phases & Ordered Module Cards */}
        <div className="space-y-10">
          {groupedPhases.map((phase) => {
            const isPhaseComplete = phase.doneCount === phase.islands.length;
            return (
              <div key={phase.id} id={phase.id} className="space-y-4 scroll-mt-24">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span
                        className={`font-bold ${
                          isPhaseComplete
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-sky-700 dark:text-sky-400'
                        }`}
                      >
                        PALIER 0{phase.phaseNumber}
                      </span>
                      <span className="text-slate-400" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">{phase.subtitle}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                      {phase.title.replace(/^Palier \d+\s*·\s*/, '')}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Compétence analyste visée :
                      </span>{' '}
                      {phase.analystGoal}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 tabular-nums shrink-0">
                    {phase.doneCount} / {phase.islands.length} validée
                    {phase.doneCount > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {phase.islands.map((island, idx) => {
                    const isCompleted = completedIslands.includes(island.id);
                    const isRecommendedNext = !isCompleted && island.id === nextIsland.id;
                    const stepNum = getAnalystStepNumber(island.id, selectedTrackId);
                    const stars = starsByIsland[island.id] ?? 0;
                    const IconComp =
                      island.id === 1
                        ? Radio
                        : island.id === 2
                        ? Compass
                        : island.id === 3
                        ? ShieldCheck
                        : island.id === 4
                        ? Cloud
                        : island.id === 5
                        ? Server
                        : island.id === 6
                        ? Leaf
                        : island.id === 7
                        ? Network
                        : island.id === 8
                        ? Layers
                        : island.id === 9
                        ? Box
                        : island.id === 10
                        ? ShieldAlert
                        : island.id === 11
                        ? KeyRound
                        : island.id === 12
                        ? GitMerge
                        : island.id === 13
                        ? Radar
                        : island.id === 14
                        ? MonitorCheck
                        : island.id === 15
                        ? FolderTree
                        : island.id === 16
                        ? Siren
                        : island.id === 17
                        ? Boxes
                        : Lock;

                    return (
                      <motion.article
                        key={island.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -3 }}
                        transition={{
                          duration: 0.22,
                          delay: Math.min(idx * 0.025, 0.25),
                          ease: EASE_SWISS,
                        }}
                        className={`bg-white dark:bg-slate-900/90 border rounded-xl p-6 flex flex-col justify-between gap-5 transition-colors ${
                          isRecommendedNext
                            ? 'border-sky-500 dark:border-cyan-400 ring-1 ring-sky-500/20 shadow-md dark:shadow-cyan-950/50'
                            : 'border-slate-200 dark:border-slate-800 hover:border-sky-400/80 dark:hover:border-cyan-500/50 hover:shadow-md dark:hover:shadow-cyan-950/40'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="tabular-nums">
                              <strong className="font-mono text-sky-700 dark:text-sky-400">
                                Étape {String(stepNum).padStart(2, '0')}
                              </strong>{' '}
                              · {island.duration} · +{island.xpReward} XP
                            </span>
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                                {stars > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-amber-500">
                                    {[1, 2, 3].map((s) => (
                                      <Star
                                        key={s}
                                        className={`w-3.5 h-3.5 ${
                                          s <= stars
                                            ? 'fill-amber-400 text-amber-500'
                                            : 'text-slate-300 dark:text-slate-700'
                                        }`}
                                      />
                                    ))}
                                  </span>
                                )}
                              </span>
                            ) : isRecommendedNext ? (
                              <span className="text-[11px] font-semibold text-sky-700 dark:text-cyan-300">
                                Prochaine étape
                              </span>
                            ) : (
                              <IconComp className="w-4 h-4 text-slate-400" />
                            )}
                          </div>

                          <div>
                            <h4 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                              {island.title.replace(/^\d+\.\s*/, '')}
                            </h4>
                            <p className="text-sm font-medium text-sky-800 dark:text-sky-400 mt-0.5">
                              {island.subtitle}
                            </p>
                          </div>

                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {island.summary}
                          </p>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <p>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                Animation :
                              </span>{' '}
                              {island.videoTitle} ({island.videoDuration})
                            </p>
                            <p>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                Atelier pratique :
                              </span>{' '}
                              {island.gameTitle}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 pt-1">
                              {island.notions.join(' · ')}
                            </p>
                          </div>
                        </div>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            playClick();
                            onSelectIsland(island.id);
                          }}
                          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                            isCompleted
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700'
                              : 'bg-sky-700 text-white hover:bg-sky-800'
                          }`}
                        >
                          {isCompleted
                            ? 'Revoir ce module'
                            : isRecommendedNext
                            ? `Démarrer l'étape ${stepNum}`
                            : 'Ouvrir ce module'}
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      </motion.article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Editorial Highlight Card for Badges & Certificate */}
          <div className="md:col-span-2 lg:col-span-3 bg-slate-900 text-white rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Tableau des distinctions &amp; Diplôme personnalisable</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-white">
                Badges d&apos;Architecte ({completedIslands.length}/{ISLANDS.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm pt-1">
                {ISLANDS.map((island) => {
                  const unlocked = completedIslands.includes(island.id);
                  const s = starsByIsland[island.id] ?? 0;
                  return (
                    <div
                      key={island.id}
                      className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2"
                    >
                      <span className={unlocked ? 'text-white font-medium' : 'text-slate-400'}>
                        {island.badgeTitle}
                      </span>
                      <span
                        className={`text-xs font-mono shrink-0 ${
                          unlocked ? 'text-amber-300' : 'text-slate-500'
                        }`}
                      >
                        {unlocked ? `${'★'.repeat(s || 1)}` : 'À débloquer'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onOpenCertificate();
                }}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <Award className="w-4 h-4 text-sky-700" />
                Générer mon diplôme d&apos;Architecte
              </button>
              <p className="text-xs text-slate-400">
                Téléchargeable en SVG ou imprimable en PDF.
              </p>
            </div>
          </div>

          {/* Quests & Hidden Achievements Board */}
          <div className="md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                    Quêtes &amp; Succès d&apos;Explorateur
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Défis transverses récompensant votre curiosité dans les îles, les labos et
                    l&apos;examen blanc.
                  </p>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-sky-700 dark:text-sky-400 tabular-nums">
                {unlockedAchievementsCount} / {achievements.length} débloqués
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-4 rounded-xl border space-y-1.5 transition-colors ${
                    ach.unlocked
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                      {ach.unlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      {ach.title}
                    </span>
                    <span
                      className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 ${
                        ach.unlocked
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {ach.progress}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {ach.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
