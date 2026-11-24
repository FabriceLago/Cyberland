import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Lock,
  Timer,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  EvaluatedExpertiseBadge,
  MedalTier,
  evaluateExpertiseBadges,
} from '../data/expertiseBadges';
import { playClick } from '../utils/sound';

interface ExpertiseBadgesShowcaseProps {
  totalXp: number;
  passedExamsCount: number;
  bestExamScore: number | null;
  speedrunsCompleted?: number;
  neutralizedAttacksCount?: number;
  onOpenExam: () => void;
}

type MedalFilter = 'all' | 'unlocked' | 'locked';

const TIER_PALETTE: Record<
  MedalTier,
  {
    outer: string;
    inner: string;
    rim: string;
    ribbonLeft: string;
    ribbonRight: string;
    glyph: string;
    accentText: string;
  }
> = {
  bronze: {
    outer: '#D97706',
    inner: '#FEF3C7',
    rim: '#92400E',
    ribbonLeft: '#B45309',
    ribbonRight: '#78350F',
    glyph: '#92400E',
    accentText: 'text-amber-700 dark:text-amber-400',
  },
  silver: {
    outer: '#64748B',
    inner: '#F1F5F9',
    rim: '#334155',
    ribbonLeft: '#0284C7',
    ribbonRight: '#0369A1',
    glyph: '#1E293B',
    accentText: 'text-slate-700 dark:text-slate-300',
  },
  gold: {
    outer: '#EAB308',
    inner: '#FEF9C3',
    rim: '#A16207',
    ribbonLeft: '#DC2626',
    ribbonRight: '#991B1B',
    glyph: '#854D0E',
    accentText: 'text-yellow-700 dark:text-yellow-400',
  },
  platinum: {
    outer: '#0284C7',
    inner: '#E0F2FE',
    rim: '#075985',
    ribbonLeft: '#0369A1',
    ribbonRight: '#0C4A6E',
    glyph: '#0369A1',
    accentText: 'text-sky-700 dark:text-sky-400',
  },
  emerald: {
    outer: '#059669',
    inner: '#D1FAE5',
    rim: '#065F46',
    ribbonLeft: '#047857',
    ribbonRight: '#064E3B',
    glyph: '#065F46',
    accentText: 'text-emerald-700 dark:text-emerald-400',
  },
  diamond: {
    outer: '#4F46E5',
    inner: '#E0E7FF',
    rim: '#312E81',
    ribbonLeft: '#0284C7',
    ribbonRight: '#4338CA',
    glyph: '#312E81',
    accentText: 'text-indigo-700 dark:text-indigo-400',
  },
};

const VirtualMedalSvg: React.FC<{ badge: EvaluatedExpertiseBadge }> = ({ badge }) => {
  const palette = TIER_PALETTE[badge.tier];
  const unlocked = badge.unlocked;

  return (
    <svg
      viewBox="0 0 88 96"
      className="w-16 h-[70px] shrink-0"
      role="img"
      aria-label={`${badge.title} — ${unlocked ? 'Médaille débloquée' : 'Médaille verrouillée'}`}
    >
      {/* Top Ribbons */}
      <polygon
        points="24,4 42,4 46,34 30,34"
        fill={unlocked ? palette.ribbonLeft : '#CBD5E1'}
        opacity={unlocked ? 1 : 0.45}
      />
      <polygon
        points="64,4 46,4 42,34 58,34"
        fill={unlocked ? palette.ribbonRight : '#94A3B8'}
        opacity={unlocked ? 1 : 0.45}
      />

      {/* Outer Medal Ring */}
      <circle
        cx="44"
        cy="58"
        r="32"
        fill={unlocked ? palette.outer : '#E2E8F0'}
        stroke={unlocked ? palette.rim : '#94A3B8'}
        strokeWidth="2.5"
        strokeDasharray={unlocked ? 'none' : '4 3'}
      />

      {/* Inner Medallion Disc */}
      <circle
        cx="44"
        cy="58"
        r="24"
        fill={unlocked ? palette.inner : '#F8FAFC'}
        stroke={unlocked ? palette.rim : '#CBD5E1'}
        strokeWidth="1.5"
      />

      {/* Subtle Gloss Arc when unlocked */}
      {unlocked && (
        <path
          d="M 27 46 A 21 21 0 0 1 56 39"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      )}

      {/* Center Engraved Emblem */}
      <g
        transform="translate(44, 58)"
        stroke={unlocked ? palette.glyph : '#94A3B8'}
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {badge.iconKey === 'compass' && (
          <>
            <circle cx="0" cy="0" r="11" />
            <polygon
              points="0,-7 3,0 0,7 -3,0"
              fill={unlocked ? palette.glyph : 'none'}
            />
          </>
        )}
        {badge.iconKey === 'zap' && (
          <polygon
            points="2,-11 -8,2 0,2 -2,11 8,-2 0,-2"
            fill={unlocked ? palette.glyph : 'none'}
          />
        )}
        {badge.iconKey === 'shield' && (
          <>
            <path d="M 0 -11 L 10 -7 V 1 C 10 7 5 11 0 13 C -5 11 -10 7 -10 1 V -7 Z" />
            <path d="M -4 1 L -1 4 L 5 -3" />
          </>
        )}
        {badge.iconKey === 'cloud' && (
          <path d="M -8 6 H 8 A 5 5 0 0 0 9 -4 A 7 7 0 0 0 -5 -5 A 5.5 5.5 0 0 0 -8 6 Z" />
        )}
        {badge.iconKey === 'radar' && (
          <>
            <circle cx="0" cy="0" r="11" />
            <circle cx="0" cy="0" r="5.5" />
            <line x1="0" y1="0" x2="8" y2="-7" />
          </>
        )}
        {badge.iconKey === 'crown' && (
          <path
            d="M -11 7 L -10 -5 L -4 1 L 0 -8 L 4 1 L 10 -5 L 11 7 Z"
            fill={unlocked ? palette.glyph : 'none'}
          />
        )}
      </g>
    </svg>
  );
};

export const ExpertiseBadgesShowcase: React.FC<ExpertiseBadgesShowcaseProps> = ({
  totalXp,
  passedExamsCount,
  bestExamScore,
  speedrunsCompleted = 0,
  neutralizedAttacksCount = 0,
  onOpenExam,
}) => {
  const [filter, setFilter] = useState<MedalFilter>('all');

  const badges = useMemo(
    () =>
      evaluateExpertiseBadges(
        totalXp,
        passedExamsCount,
        bestExamScore,
        speedrunsCompleted,
        neutralizedAttacksCount
      ),
    [totalXp, passedExamsCount, bestExamScore, speedrunsCompleted, neutralizedAttacksCount]
  );

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const nextLocked = badges.find((b) => !b.unlocked) ?? null;

  const visibleBadges = badges.filter((b) => {
    if (filter === 'unlocked') return b.unlocked;
    if (filter === 'locked') return !b.unlocked;
    return true;
  });

  return (
    <section
      aria-labelledby="expertise-badges-heading"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 space-y-6"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-400">
            <Award className="w-4 h-4 shrink-0" />
            <span>Médailles virtuelles · XP cumulés &amp; Examens Blancs réussis</span>
          </div>
          <h2
            id="expertise-badges-heading"
            className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100"
          >
            Badges d&apos;Expertise
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Débloquez jusqu&apos;à {badges.length} médailles de prestige en accumulant de
            l&apos;expérience dans les îles et en validant les Examens Blancs chronométrés.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-3">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Débloquées</p>
              <p className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {unlockedCount} / {badges.length}
              </p>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Examens réussis</p>
              <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {passedExamsCount}
                {bestExamScore !== null ? ` · Max ${bestExamScore}/20` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onOpenExam();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Timer className="w-4 h-4 shrink-0" />
            Passer l&apos;Examen Blanc
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* Filter Bar + Next Goal Callout */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filtrer les badges d'expertise"
          className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
        >
          {(
            [
              { id: 'all' as MedalFilter, label: `Toutes (${badges.length})` },
              { id: 'unlocked' as MedalFilter, label: `Débloquées (${unlockedCount})` },
              {
                id: 'locked' as MedalFilter,
                label: `À débloquer (${badges.length - unlockedCount})`,
              },
            ]
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  playClick();
                  setFilter(tab.id);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {nextLocked ? (
          <div className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400 shrink-0" />
            <span>
              Prochain palier :{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {nextLocked.title}
              </strong>{' '}
              (<span className="font-mono tabular-nums">{nextLocked.overallProgressPct} %</span>)
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Toutes les médailles d&apos;expertise ont été débloquées !
          </div>
        )}
      </div>

      {/* Medals Grid */}
      {visibleBadges.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
          {filter === 'unlocked'
            ? 'Aucune médaille débloquée pour le moment : complétez votre première île ou un Examen Blanc pour obtenir « Éclaireur Numérique » !'
            : 'Félicitations, vous avez débloqué toutes les médailles d’expertise de Cyberland !'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleBadges.map((badge) => {
            const palette = TIER_PALETTE[badge.tier];
            return (
              <article
                key={badge.id}
                className={`rounded-xl border p-4 flex flex-col justify-between gap-4 transition-colors ${
                  badge.unlocked
                    ? 'bg-gradient-to-br from-white to-sky-50/50 dark:from-slate-900 dark:to-sky-950/30 border-sky-300 dark:border-sky-700'
                    : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <VirtualMedalSvg badge={badge} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className={`font-semibold ${palette.accentText}`}>
                        {badge.tierLabel}
                      </span>
                      {badge.unlocked ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Débloquée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 shrink-0">
                          <Lock className="w-3 h-3" />
                          Verrouillée
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {badge.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>

                {/* Unlock Criteria & Live Progress */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 ${
                          badge.xpMet
                            ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {badge.xpMet ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Lock className="w-3 h-3 shrink-0 text-slate-400" />
                        )}
                        Score XP requis
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        {Math.min(totalXp, badge.minXp)} / {badge.minXp} XP
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          badge.unlocked
                            ? 'bg-emerald-600 dark:bg-emerald-500'
                            : 'bg-sky-600 dark:bg-sky-500'
                        }`}
                        style={{ width: `${badge.xpProgressPct}%` }}
                      />
                    </div>
                  </div>

                  {badge.minPassedExams > 0 && (
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 ${
                          badge.examsMet && badge.scoreMet
                            ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {badge.examsMet && badge.scoreMet ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Lock className="w-3 h-3 shrink-0 text-slate-400" />
                        )}
                        Examen Blanc
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 tabular-nums text-right">
                        {badge.minPassedExams} réussi{badge.minPassedExams > 1 ? 's' : ''}
                        {badge.minExamScore !== null ? ` · ≥ ${badge.minExamScore}/20` : ''}
                      </span>
                    </div>
                  )}

                  {badge.minSpeedruns && (
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 ${
                          speedrunsCompleted >= badge.minSpeedruns
                            ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {speedrunsCompleted >= badge.minSpeedruns ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Lock className="w-3 h-3 shrink-0 text-slate-400" />
                        )}
                        Circuits Speedrun
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        {Math.min(speedrunsCompleted, badge.minSpeedruns)} / {badge.minSpeedruns}
                      </span>
                    </div>
                  )}

                  {badge.minNeutralizedAttacks && (
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 ${
                          neutralizedAttacksCount >= badge.minNeutralizedAttacks
                            ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {neutralizedAttacksCount >= badge.minNeutralizedAttacks ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Lock className="w-3 h-3 shrink-0 text-slate-400" />
                        )}
                        Attaques neutralisées
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        {Math.min(neutralizedAttacksCount, badge.minNeutralizedAttacks)} /{' '}
                        {badge.minNeutralizedAttacks}
                      </span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
