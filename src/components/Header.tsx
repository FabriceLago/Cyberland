import React from 'react';
import { motion } from 'motion/react';
import { Cloud, GraduationCap, PlayCircle, Shield, Trophy, UserCircle2, Zap } from 'lucide-react';
import { getCourseName, getShortCourseName } from '../data/courseData';
import { SPRING_SNAPPY } from './MotionPrimitives';

export type AppRoute =
  | 'archipel'
  | 'island'
  | 'defense'
  | 'immersion'
  | 'missions'
  | 'simulateur'
  | 'debug'
  | 'storyboards'
  | 'quiz'
  | 'classement';

interface HeaderProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  nextIslandId: number;
  nextStepNumber?: number;
  onOpenIsland: (islandId: number) => void;
  onOpenDemoVideo?: () => void;
  learningTourActive?: boolean;
  onToggleLearningTour?: () => void;
  workspaceScope?: 'essential' | 'full';
  xpBoostMultiplier?: number;
  xpBoostRemainingSec?: number;
  isSignedIn?: boolean;
  userLabel?: string | null;
}

function formatBoostCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const Header: React.FC<HeaderProps> = ({
  activeRoute,
  onNavigate,
  nextIslandId,
  nextStepNumber,
  onOpenIsland,
  onOpenDemoVideo,
  learningTourActive = false,
  onToggleLearningTour,
  workspaceScope = 'essential',
  xpBoostMultiplier = 1,
  xpBoostRemainingSec = 0,
  isSignedIn = false,
  userLabel = null,
}) => {
  const navItems: { id: AppRoute; label: string }[] =
    workspaceScope === 'essential'
      ? [
          { id: 'archipel', label: 'Parcours' },
          { id: 'immersion', label: 'Immersion' },
          { id: 'missions', label: 'Missions' },
          { id: 'defense', label: 'Défense' },
          { id: 'simulateur', label: 'Labos' },
          { id: 'quiz', label: 'Quiz' },
        ]
      : [
          { id: 'archipel', label: 'Archipel' },
          { id: 'defense', label: 'Défense' },
          { id: 'immersion', label: 'Immersion' },
          { id: 'missions', label: 'Missions' },
          { id: 'simulateur', label: 'Labos' },
          { id: 'debug', label: 'Debug' },
          { id: 'quiz', label: 'Quiz' },
          { id: 'classement', label: 'Classement' },
        ];

  const boostActive = xpBoostRemainingSec > 0 && xpBoostMultiplier > 1;

  return (
    <header
      data-tour="tour-header"
      className="sticky top-0 z-40 bg-white/95 dark:bg-[#080F1E]/95 backdrop-blur-md border-b border-slate-200 dark:border-cyan-500/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => onNavigate('archipel')}
          className="inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 hover:text-sky-700 dark:hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0"
        >
          <Shield className="w-5 h-5 text-sky-700 dark:text-cyan-400 shrink-0" />
          Cyberland
        </button>

        <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-3.5">
          {navItems.map((item) => {
            const isActive =
              activeRoute === item.id || (item.id === 'archipel' && activeRoute === 'island');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-2 text-[13px] xl:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-sky-700 dark:text-cyan-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="cyberland-nav-underline"
                    transition={SPRING_SNAPPY}
                    className="absolute left-0 right-0 bottom-0 h-0.5 rounded-full bg-sky-700 dark:bg-cyan-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {boostActive && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('simulateur')}
              title="Multiplicateur d'XP Speedrun actif"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold tabular-nums hover:bg-amber-500/25 transition-colors whitespace-nowrap shrink-0"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>×{xpBoostMultiplier.toFixed(2).replace(/\.00$/, '.0')} XP</span>
              <span className="text-amber-700/80 dark:text-amber-200/80">
                {formatBoostCountdown(xpBoostRemainingSec)}
              </span>
            </motion.button>
          )}
          {onToggleLearningTour && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={onToggleLearningTour}
              aria-pressed={learningTourActive}
              title={
                learningTourActive
                  ? 'Quitter le tutoriel guidé'
                  : 'Lancer le tutoriel guidé pas à pas de l’archipel'
              }
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                learningTourActive
                  ? 'border-sky-600 dark:border-cyan-400 bg-sky-100 dark:bg-cyan-500/20 text-sky-900 dark:text-cyan-200'
                  : 'border-sky-200 dark:border-cyan-500/40 bg-sky-50 dark:bg-cyan-950/40 text-sky-800 dark:text-cyan-300 hover:border-sky-500 dark:hover:border-cyan-400 hover:bg-sky-100 dark:hover:bg-cyan-900/50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-sky-700 dark:text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">Mode Apprentissage</span>
            </motion.button>
          )}
          {onOpenDemoVideo && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={onOpenDemoVideo}
              title="Regarder la vidéo démo de 5 minutes"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-cyan-500/35 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-cyan-300 hover:border-sky-400 dark:hover:border-cyan-400 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <PlayCircle className="w-3.5 h-3.5 text-sky-700 dark:text-cyan-400 shrink-0" />
              <span className="hidden 2xl:inline">Démo 5 min</span>
            </motion.button>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('classement')}
            title={isSignedIn ? 'Compte Cloud connecté & Classement' : 'Se connecter & Classement'}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isSignedIn
                ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-sky-400 dark:hover:border-cyan-400/60'
            }`}
          >
            {isSignedIn ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="hidden sm:inline max-w-[110px] truncate">
                  {userLabel || 'Cloud actif'}
                </span>
              </>
            ) : (
              <>
                <UserCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Compte</span>
              </>
            )}
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onOpenIsland(nextIslandId)}
            title={`Ouvrir le cours : ${nextStepNumber ? `${String(nextStepNumber).padStart(2, '0')}. ` : ''}${getCourseName(nextIslandId)}`}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-white dark:text-slate-950 bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 max-w-[205px] truncate tabular-nums"
          >
            {nextStepNumber ? `${String(nextStepNumber).padStart(2, '0')} · ` : ''}
            {getShortCourseName(nextIslandId)}
          </motion.button>
        </div>
      </div>

      {/* Compact mobile/tablet navigation row */}
      <nav
        aria-label="Navigation mobile"
        className="lg:hidden border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto"
      >
        {navItems.map((item) => {
          const isActive =
            activeRoute === item.id || (item.id === 'archipel' && activeRoute === 'island');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-sky-800 dark:text-cyan-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="cyberland-nav-mobile"
                  transition={SPRING_SNAPPY}
                  className="absolute inset-0 rounded-md bg-sky-50 dark:bg-cyan-950/60"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1">
                {item.id === 'classement' && <Trophy className="w-3 h-3 text-amber-500" />}
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
