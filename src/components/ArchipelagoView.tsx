import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Play,
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
} from 'lucide-react';
import { ASSETS, CAREER_TRACKS, CareerTrack, ISLANDS } from '../data/courseData';
import { getHighestUnlockedBadge } from '../data/expertiseBadges';
import { GemiBotGuide } from './GemiBotGuide';
import { ExpertiseBadgesShowcase } from './ExpertiseBadgesShowcase';
import { playClick } from '../utils/sound';

interface ArchipelagoViewProps {
  completedIslands: number[];
  starsByIsland: Record<number, number>;
  solvedDebugCount: number;
  bestExamScore: number | null;
  passedExamsCount: number;
  ddosWon: boolean;
  terminalCompleted: boolean;
  crisisContained: boolean;
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
  onResetProgress: () => void;
}

export const ArchipelagoView: React.FC<ArchipelagoViewProps> = ({
  completedIslands,
  starsByIsland,
  solvedDebugCount,
  bestExamScore,
  passedExamsCount,
  ddosWon,
  terminalCompleted,
  crisisContained,
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
  onResetProgress,
}) => {
  const [hoveredIslandId, setHoveredIslandId] = useState<number | null>(null);
  const [mapImgError, setMapImgError] = useState(false);

  const totalXp = xp + quizBonusXp + debugBonusXp + extraBonusXp;
  const highestMedal = getHighestUnlockedBadge(totalXp, passedExamsCount, bestExamScore);

  const activeTrack =
    CAREER_TRACKS.find((t) => t.id === selectedTrackId) ?? CAREER_TRACKS[0];
  const visibleIslands = ISLANDS.filter((i) => activeTrack.islandIds.includes(i.id));
  const trackCompletedCount = activeTrack.islandIds.filter((id) =>
    completedIslands.includes(id)
  ).length;

  const nextIsland =
    visibleIslands.find((i) => !completedIslands.includes(i.id)) ??
    ISLANDS.find((i) => !completedIslands.includes(i.id)) ??
    ISLANDS[ISLANDS.length - 1];
  const totalPossibleXp = ISLANDS.reduce((acc, i) => acc + i.xpReward, 0);
  const totalStars = Object.values(starsByIsland).reduce((a, b) => a + b, 0);
  const maxStars = ISLANDS.length * 3;
  const progressPercent = Math.round((completedIslands.length / ISLANDS.length) * 100);

  const activeIslandInfo =
    ISLANDS.find((i) => i.id === hoveredIslandId) ?? nextIsland;

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
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <p className="text-xs font-medium text-sky-700 dark:text-sky-400 tracking-wide">
              Parcours interactif · Réseaux &amp; Informatique en nuage
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.08]">
              L&apos;Archipel de Cyberland
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-prose">
              Une tempête numérique a coupé les communications de l&apos;archipel. En tant
              qu&apos;Architecte-Explorateur, reconnectez les {ISLANDS.length} îles, maîtrisez les
              types de réseaux et déployez le Nuage Céleste à travers des animations guidées et des
              mini-jeux d&apos;action.
            </p>
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
              {completedIslands.length === 0
                ? "Démarrer sur l'Île 1"
                : completedIslands.length === ISLANDS.length
                ? 'Explorer l’Île 18 · VPN & NAT'
                : `Continuer : Île ${nextIsland.id}`}
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                onOpenSimulator();
              }}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Laboratoires techniques
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Active Map Preview Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>Cap sélectionné sur la carte</span>
              <span className="font-mono tabular-nums text-sky-700 dark:text-sky-400 font-medium">
                +{activeIslandInfo.xpReward} XP
              </span>
            </div>
            <p className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              {activeIslandInfo.title}
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
                  strokeDasharray={isConnected ? 'none' : '1.4 1.2'}
                />
              );
            })}
          </svg>

          {/* Clickable Island Beacons */}
          {ISLANDS.map((island) => {
            const done = completedIslands.includes(island.id);
            const inTrack = activeTrack.islandIds.includes(island.id);
            const isNext = nextIsland.id === island.id && !done;
            return (
              <button
                key={island.id}
                type="button"
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
                  {done ? '✓' : String(island.id).padStart(2, '0')}
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
            {xp + quizBonusXp + debugBonusXp + extraBonusXp}{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">XP</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Objectif parcours : {totalPossibleXp} XP
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Îles reconnectées</p>
          <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {completedIslands.length} / {ISLANDS.length}
          </p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-sky-700 dark:bg-sky-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Étoiles de maîtrise</p>
          <p className="font-mono text-2xl font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
            {totalStars} / {maxStars} ★
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

      {/* Virtual Expertise Medals Showcase on Home Page */}
      <ExpertiseBadgesShowcase
        totalXp={totalXp}
        passedExamsCount={passedExamsCount}
        bestExamScore={bestExamScore}
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

      {/* GemiBot Guide */}
      <GemiBotGuide
        contextLabel="Briefing de l'Archipel"
        hints={[
          "Bienvenue sur Cyberland ! Commence par l'Île 1 pour câbler le village, puis remonte jusqu'au Sommet Céleste.",
          "Chaque île propose une capsule animée interactive suivie d'un mini-jeu d'action pour débloquer ton badge et tes XP.",
          "Tu peux aussi tester le Simulateur de paquets à tout moment pour voir un vrai paquet traverser DNS, Routeur, Pare-feu et Cloud !",
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

      {/* Curriculum List */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {selectedTrackId === 'all'
                ? `Parcours pédagogique en ${ISLANDS.length} Îles`
                : `${activeTrack.label} (${visibleIslands.length} Îles)`}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Fondamentaux, OSI, Cloud, Docker, Kubernetes, Active Directory, SOC/SIEM, VPN/NAT,
              Wireshark/tcpdump et Azure Monitor — chacun avec animation voix off synchronisée et
              mini-jeu noté en étoiles.
            </p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
            {visibleIslands.length} module{visibleIslands.length > 1 ? 's' : ''} affiché
            {visibleIslands.length > 1 ? 's' : ''} · {visibleIslands.length * 3} étoiles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleIslands.map((island) => {
            const isCompleted = completedIslands.includes(island.id);
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
              <article
                key={island.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between gap-5 hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {island.category} · {island.duration} · +{island.xpReward} XP
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
                                  s <= stars ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-700'
                                }`}
                              />
                            ))}
                          </span>
                        )}
                      </span>
                    ) : (
                      <IconComp className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                      {island.title}
                    </h3>
                    <p className="text-sm font-medium text-sky-800 dark:text-sky-400 mt-0.5">
                      {island.subtitle}
                    </p>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {island.summary}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <p>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Animation :</span>{' '}
                      {island.videoTitle} ({island.videoDuration})
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Mini-jeu :</span>{' '}
                      {island.gameTitle}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 pt-1">
                      {island.notions.join(' · ')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
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
                  {isCompleted ? "Revoir l'île" : 'Lancer le module'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </article>
            );
          })}

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
