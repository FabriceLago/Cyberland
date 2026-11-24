import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Award,
  CheckCircle2,
  Cloud,
  CloudOff,
  Compass,
  Crown,
  Flag,
  Flame,
  GraduationCap,
  Lock,
  LogIn,
  LogOut,
  Map,
  Medal,
  Network,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
  UserCheck,
  Zap,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
  signInWithGoogle,
  signOutUser,
} from '../firebase';
import {
  ACHIEVEMENTS,
  AchievementCategory,
  AchievementIconKey,
  AchievementProgressSnapshot,
  AchievementTier,
} from '../data/achievements';
import { AnimatedNumber, EASE_SWISS, SPRING_SNAPPY } from './MotionPrimitives';
import { LEARNING_PACES, LearningPaceId } from '../data/mentors';
import { playClick, playError, playSuccess, playVictory } from '../utils/sound';

export interface PublicLeaderboardRow {
  userId: string;
  displayName: string;
  totalXp: number;
  completedIslandsCount: number;
  bestSpeedrunMs: number;
  bestSpeedrunCircuit: string;
  rankTitle: string;
  isPublic: boolean;
}

interface DailyChallengeItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

const DAILY_CHALLENGES: DailyChallengeItem[] = [
  {
    topic: 'Pare-feu & DMZ',
    question:
      'Dans une architecture DMZ à deux pare-feux, quel flux doit être strictement bloqué par le pare-feu périmétrique (FW1) ?',
    options: [
      'Internet → Serveur Web DMZ sur le port 443/TCP',
      'Internet → Base de données PostgreSQL (5432/TCP)',
      'Internet → Redirection HTTP 80 vers HTTPS 443',
      'Serveur Web → Réponses HTTPS établies vers les clients',
    ],
    correctIndex: 1,
    explanation:
      'Une base de données ne doit jamais être joignable directement depuis Internet : elle reste derrière le pare-feu interne (FW2).',
  },
  {
    topic: 'Sécurité SSH & Linux',
    question:
      'Quelle combinaison de permissions chmod est requise par OpenSSH sur votre clé privée ~/.ssh/id_ed25519 ?',
    options: ['chmod 777', 'chmod 644', 'chmod 600', 'chmod 755'],
    correctIndex: 2,
    explanation:
      'chmod 600 (rw-------) réserve la lecture/écriture exclusivement au propriétaire ; OpenSSH refuse toute clé privée lisible par d’autres.',
  },
  {
    topic: 'VLAN & Switching 802.1Q',
    question:
      'Sur un switch administrable, quel mode de port utilise-t-on pour transporter simultanément les VLAN 10, 20 et 30 vers un routeur ?',
    options: ['Port Access', 'Port Trunk (802.1Q)', 'Port Half-Duplex', 'Port Telnet'],
    correctIndex: 1,
    explanation:
      'Un port Trunk ajoute une étiquette 802.1Q (VLAN ID) à chaque trame pour transporter plusieurs VLAN sur un seul câble.',
  },
  {
    topic: 'Sauvegarde & PRA',
    question:
      'Si vos sauvegardes tournent toutes les 4 heures et qu’une panne survient à 15h30 (dernier backup à 12h00), que représente ce délai de 3h30 de données perdues ?',
    options: ['Le RTO', 'Le RPO', 'Le SLA', 'Le MTU'],
    correctIndex: 1,
    explanation:
      'Le RPO (Recovery Point Objective) mesure la perte maximale de données tolérée dans le temps ; le RTO mesure le temps d’indisponibilité.',
  },
  {
    topic: 'Défense DDoS & Web',
    question:
      'Quel en-tête de cookie empêche un script JavaScript injecté par XSS de lire le jeton de session via document.cookie ?',
    options: ['SameSite=None', 'HttpOnly', 'Max-Age=3600', 'Cache-Control'],
    correctIndex: 1,
    explanation:
      'L’attribut HttpOnly interdit totalement l’accès au cookie depuis JavaScript (document.cookie), bloquant le vol de session par XSS.',
  },
];

interface LeaderboardViewProps {
  user: User | null;
  authReady: boolean;
  learnerName: string;
  learningPace?: LearningPaceId;
  onChangeLearnerName: (name: string) => void;
  totalXp: number;
  completedIslandsCount: number;
  bestSpeedrunMs: number;
  isPublicLeaderboard: boolean;
  onTogglePublicLeaderboard: () => void;
  onSyncNow: () => Promise<void>;
  syncing: boolean;
  lastSyncedAt: string | null;
  dailyCompletedDate: string | null;
  dailyStreak?: number;
  solvedDebugCount?: number;
  neutralizedAttacksCount?: number;
  ctfFlagsCount?: number;
  speedrunsCompleted?: number;
  claimedQuests?: string[];
  unlockedAchievements?: string[];
  achievementUnlockedAt?: Record<string, string>;
  achievementSnapshot?: AchievementProgressSnapshot;
  onClaimQuest?: (questId: string, xpReward: number) => void;
  onCompleteDailyChallenge: (dateKey: string, xpBonus: number) => void;
}

const TIER_META: Record<
  AchievementTier,
  {
    label: string;
    iconBox: string;
    borderUnlocked: string;
    accentText: string;
  }
> = {
  bronze: {
    label: 'Bronze',
    iconBox: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
    borderUnlocked: 'border-amber-300/80 dark:border-amber-800/80',
    accentText: 'text-amber-800 dark:text-amber-300',
  },
  silver: {
    label: 'Argent',
    iconBox: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200',
    borderUnlocked: 'border-slate-300 dark:border-slate-700',
    accentText: 'text-slate-700 dark:text-slate-300',
  },
  gold: {
    label: 'Or',
    iconBox: 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300',
    borderUnlocked: 'border-yellow-400/80 dark:border-yellow-700/80',
    accentText: 'text-yellow-800 dark:text-yellow-300',
  },
  platinum: {
    label: 'Platine',
    iconBox: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300',
    borderUnlocked: 'border-sky-400/80 dark:border-sky-700/80',
    accentText: 'text-sky-800 dark:text-sky-300',
  },
};

function renderAchievementIcon(icon: AchievementIconKey, className: string) {
  switch (icon) {
    case 'compass':
      return <Compass className={className} />;
    case 'map':
      return <Map className={className} />;
    case 'network':
      return <Network className={className} />;
    case 'search':
      return <Search className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'flag':
      return <Flag className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'activity':
      return <Activity className={className} />;
    case 'graduation':
      return <GraduationCap className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'cloud':
      return <Cloud className={className} />;
    case 'crown':
      return <Crown className={className} />;
  }
}

function formatMs(ms: number): string {
  const totalTenths = Math.floor(ms / 100);
  const tenths = totalTenths % 10;
  const totalSec = Math.floor(totalTenths / 10);
  const secs = totalSec % 60;
  const mins = Math.floor(totalSec / 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatUnlockDate(isoDate?: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  user,
  authReady,
  learnerName,
  learningPace = 'regulier',
  onChangeLearnerName,
  totalXp,
  completedIslandsCount,
  bestSpeedrunMs,
  isPublicLeaderboard,
  onTogglePublicLeaderboard,
  onSyncNow,
  syncing,
  lastSyncedAt,
  dailyCompletedDate,
  dailyStreak = 0,
  solvedDebugCount = 0,
  neutralizedAttacksCount = 0,
  ctfFlagsCount = 0,
  speedrunsCompleted = 0,
  claimedQuests = [],
  unlockedAchievements = [],
  achievementUnlockedAt = {},
  achievementSnapshot,
  onClaimQuest,
  onCompleteDailyChallenge,
}) => {
  const [rows, setRows] = useState<PublicLeaderboardRow[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [boardTab, setBoardTab] = useState<'xp' | 'speedrun'>('xp');
  const [achievementFilter, setAchievementFilter] = useState<
    'all' | 'unlocked' | 'locked' | AchievementCategory
  >('all');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const activePaceMeta =
    LEARNING_PACES.find((p) => p.id === learningPace) ?? LEARNING_PACES[1];

  const unlockedSet = useMemo(() => new Set(unlockedAchievements), [unlockedAchievements]);

  const unlockedMedalList = useMemo(
    () => ACHIEVEMENTS.filter((ach) => unlockedSet.has(ach.id)),
    [unlockedSet]
  );

  const earnedAchievementXp = useMemo(
    () => unlockedMedalList.reduce((sum, a) => sum + a.xpReward, 0),
    [unlockedMedalList]
  );

  const filteredAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter((ach) => {
      const isUnlocked = unlockedSet.has(ach.id);
      if (achievementFilter === 'all') return true;
      if (achievementFilter === 'unlocked') return isUnlocked;
      if (achievementFilter === 'locked') return !isUnlocked;
      return ach.category === achievementFilter;
    });
  }, [achievementFilter, unlockedSet]);

  // Daily challenge state
  const todayKey = useMemo(() => getTodayKey(), []);
  const dailyIndex = useMemo(() => {
    const sum = todayKey.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return sum % DAILY_CHALLENGES.length;
  }, [todayKey]);
  const daily = DAILY_CHALLENGES[dailyIndex];
  const [dailyChoice, setDailyChoice] = useState<number | null>(null);
  const dailyAlreadyDone = dailyCompletedDate === todayKey;

  useEffect(() => {
    if (!authReady) return;
    const boardQuery = query(collection(db, 'leaderboard'), where('isPublic', '==', true));
    const unsub = onSnapshot(
      boardQuery,
      (snapshot) => {
        const list: PublicLeaderboardRow[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (typeof d.displayName === 'string' && typeof d.totalXp === 'number') {
            list.push({
              userId: String(d.userId || docSnap.id),
              displayName: d.displayName,
              totalXp: d.totalXp,
              completedIslandsCount: Number(d.completedIslandsCount || 0),
              bestSpeedrunMs: Number(d.bestSpeedrunMs || 0),
              bestSpeedrunCircuit: String(d.bestSpeedrunCircuit || ''),
              rankTitle: String(d.rankTitle || 'Explorateur Cyberland'),
              isPublic: Boolean(d.isPublic),
            });
          }
        });
        setRows(list);
        setLoadingBoard(false);
      },
      (err) => {
        setLoadingBoard(false);
        handleFirestoreError(err, OperationType.LIST, 'leaderboard');
      }
    );
    return () => unsub();
  }, [authReady]);

  const sortedXpRows = useMemo(
    () => [...rows].sort((a, b) => b.totalXp - a.totalXp).slice(0, 25),
    [rows]
  );

  const sortedSpeedrunRows = useMemo(
    () =>
      rows
        .filter((r) => r.bestSpeedrunMs > 0)
        .sort((a, b) => a.bestSpeedrunMs - b.bestSpeedrunMs)
        .slice(0, 25),
    [rows]
  );

  const handleLogin = async () => {
    playClick();
    setAuthError(null);
    setAuthBusy(true);
    try {
      await signInWithGoogle();
      playSuccess();
    } catch (err) {
      playError();
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Impossible d’ouvrir la fenêtre de connexion Google.'
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    playClick();
    setAuthBusy(true);
    try {
      await signOutUser();
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAnswerDaily = (idx: number) => {
    if (dailyAlreadyDone || dailyChoice !== null) return;
    setDailyChoice(idx);
    if (idx === daily.correctIndex) {
      playVictory();
      onCompleteDailyChallenge(todayKey, 60);
    } else {
      playError();
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
          Votre parcours personnel · Sauvegarde Cloud · Communauté Cyberland
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mt-1">
          Mon Profil, Succès &amp; Communauté
        </h1>
      </div>

      {/* Top Row: User Account Cloud Sync + Défi du Jour */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Account & Cloud Sync Card */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              {user ? (
                <Cloud className="w-5 h-5 text-emerald-500" />
              ) : (
                <CloudOff className="w-5 h-5 text-slate-400" />
              )}
              Compte &amp; Sauvegarde Cloud
            </h2>
            {user && (
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                Connecté
              </span>
            )}
          </div>

          {!user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-slate-700 dark:bg-slate-700 text-white font-bold flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {learnerName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Profil local · {unlockedMedalList.length} / {ACHIEVEMENTS.length} médailles débloquées
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Connectez-vous avec votre compte Google pour sauvegarder automatiquement votre progression (XP, îles validées, examens, records Speedrun) dans le Cloud et apparaître dans le classement en ligne.
              </p>
              {authError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{authError}</p>
              )}
              <button
                type="button"
                onClick={handleLogin}
                disabled={authBusy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-60 text-white text-sm font-bold transition-colors"
              >
                <LogIn className="w-4 h-4" />
                {authBusy ? 'Connexion en cours...' : 'Se connecter avec Google'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user.displayName || learnerName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email} · {lastSyncedAt ? `Sync ${lastSyncedAt}` : 'Synchronisation active'}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Pseudonyme affiché sur le classement public (sans e-mail)
                </label>
                <input
                  type="text"
                  maxLength={48}
                  value={learnerName}
                  onChange={(e) => onChangeLearnerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublicLeaderboard}
                    onChange={() => {
                      playClick();
                      onTogglePublicLeaderboard();
                    }}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  Afficher mon score dans le classement public
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      void onSyncNow();
                    }}
                    disabled={syncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    Synchroniser
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={authBusy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Stats & Earned Medals Strip (visible for both Cloud & Local profiles) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Votre XP</div>
              <div className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                <AnimatedNumber value={totalXp} />
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Îles</div>
              <div className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                {completedIslandsCount} / 22
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Médailles</div>
              <div className="text-sm font-black text-sky-700 dark:text-sky-400 tabular-nums">
                {unlockedMedalList.length} / {ACHIEVEMENTS.length}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Speedrun</div>
              <div className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">
                {bestSpeedrunMs > 0 ? formatMs(bestSpeedrunMs) : '—'}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Medal className="w-4 h-4 text-amber-500" />
                Médailles affichées sur votre profil
              </div>
              <a
                href="#succes-cyberland"
                className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline"
              >
                Tout voir ({ACHIEVEMENTS.length})
              </a>
            </div>

            {unlockedMedalList.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3">
                Aucune médaille débloquée pour l’instant. Validez votre première île pour obtenir la médaille <strong className="text-slate-700 dark:text-slate-200">Premier pas</strong> (+25 XP).
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {unlockedMedalList.slice(0, 6).map((medal) => {
                  const tier = TIER_META[medal.tier];
                  return (
                    <motion.div
                      key={medal.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.16, ease: EASE_SWISS }}
                      title={`${medal.title} — ${medal.description}`}
                      className={`medal-sheen flex items-center gap-2 p-2 rounded-xl border bg-slate-50/70 dark:bg-slate-950/60 ${tier.borderUnlocked}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tier.iconBox}`}
                      >
                        {renderAchievementIcon(medal.icon, 'w-3.5 h-3.5')}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {medal.title}
                        </div>
                        <div className={`text-[10px] font-mono font-semibold ${tier.accentText}`}>
                          {tier.label} · +{medal.xpReward} XP
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Défi du Jour (Daily Challenge) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              Défi Cyber du Jour (+60 XP)
            </h2>
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
              {daily.topic} · {todayKey}
            </span>
          </div>

          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
            {daily.question}
          </p>

          <div className="space-y-2">
            {daily.options.map((opt, idx) => {
              const isSelected = dailyChoice === idx;
              const isRight = idx === daily.correctIndex;
              const revealed = dailyAlreadyDone || dailyChoice !== null;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={revealed}
                  onClick={() => handleAnswerDaily(idx)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
                    revealed
                      ? isRight
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                        : isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-800 dark:text-rose-200'
                          : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-500'
                      : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-sky-400 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {(dailyAlreadyDone || dailyChoice !== null) && (
            <div className="rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                {dailyAlreadyDone ? 'Défi du jour validé ! ' : ''}
                {daily.explanation}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
              <Flame className="w-3.5 h-3.5" />
              Série active :{' '}
              <strong className="font-mono tabular-nums">
                {dailyStreak} jour{dailyStreak > 1 ? 's' : ''}
              </strong>
            </span>
            <span>Revenez chaque jour pour prolonger votre série</span>
          </div>
        </div>
      </div>

      {/* Succès & Médailles de Profil (Achievements Showcase) */}
      <section
        id="succes-cyberland"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Medal className="w-5 h-5 text-amber-500" />
              Succès &amp; Médailles Cyberland
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Débloquez automatiquement des médailles en explorant les îles, en résolvant des incidents et en relevant les défis techniques.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                {unlockedMedalList.length} / {ACHIEVEMENTS.length} médailles
              </div>
              <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                +{earnedAchievementXp.toLocaleString('fr-FR')} XP gagnés
              </div>
            </div>
            <div className="w-24 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{
                  width: `${Math.round((unlockedMedalList.length / ACHIEVEMENTS.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Direct Encouraging Progress Note */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/70 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Rythme choisi :{' '}
              <span className="font-semibold text-sky-700 dark:text-sky-400">
                {activePaceMeta.label} ({activePaceMeta.duration})
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {unlockedMedalList.length === 0
                ? 'Avancez sans pression : validez simplement une première étape aujourd’hui, c’est la régularité qui ancre les réflexes.'
                : `Bravo pour vos ${unlockedMedalList.length} médaille${unlockedMedalList.length > 1 ? 's' : ''} : chacune valide un réflexe concret que vous pourrez expliquer en stage ou en entretien.`}
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: `Tous (${ACHIEVEMENTS.length})` },
              { id: 'unlocked', label: `Débloqués (${unlockedMedalList.length})` },
              {
                id: 'locked',
                label: `À débloquer (${ACHIEVEMENTS.length - unlockedMedalList.length})`,
              },
              { id: 'Exploration', label: 'Exploration' },
              { id: 'Réseau', label: 'Réseau' },
              { id: 'Investigation', label: 'Investigation' },
              { id: 'Défense SOC', label: 'Défense SOC' },
              { id: 'Performance', label: 'Performance' },
              { id: 'Maîtrise', label: 'Maîtrise' },
            ] as const
          ).map((f) => {
            const active = achievementFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  playClick();
                  setAchievementFilter(f.id);
                }}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="ach-filter-pill"
                    transition={SPRING_SNAPPY}
                    className="absolute inset-0 rounded-lg bg-sky-700"
                  />
                )}
                <span className="relative z-10">{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Achievements Grid */}
        {filteredAchievements.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
            Aucun succès dans cette catégorie pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((ach, idx) => {
              const unlocked = unlockedSet.has(ach.id);
              const tier = TIER_META[ach.tier];
              const progressDetail = achievementSnapshot
                ? ach.getProgress(achievementSnapshot)
                : { current: unlocked ? 1 : 0, target: 1, unitLabel: '' };
              const pct = unlocked
                ? 100
                : Math.min(
                    100,
                    Math.round((progressDetail.current / Math.max(1, progressDetail.target)) * 100)
                  );
              const unlockedDate = formatUnlockDate(achievementUnlockedAt[ach.id]);

              return (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={unlocked ? { y: -3 } : undefined}
                  transition={{
                    duration: 0.2,
                    delay: Math.min(idx * 0.025, 0.25),
                    ease: EASE_SWISS,
                  }}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-colors ${
                    unlocked
                      ? `medal-sheen bg-white dark:bg-slate-950/70 hover:shadow-md ${tier.borderUnlocked}`
                      : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-85'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        unlocked
                          ? tier.iconBox
                          : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {unlocked ? (
                        renderAchievementIcon(ach.icon, 'w-5 h-5')
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                        <span className={`font-bold ${unlocked ? tier.accentText : 'text-slate-500 dark:text-slate-400'}`}>
                          {tier.label} · {ach.category}
                        </span>
                        <span className="font-bold text-sky-700 dark:text-sky-400 tabular-nums">
                          +{ach.xpReward} XP
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                        {ach.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {ach.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Objectif : {ach.conditionLabel}
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          unlocked ? 'bg-emerald-600' : 'bg-sky-600'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.45, ease: EASE_SWISS }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      {unlocked ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Débloqué{unlockedDate ? ` le ${unlockedDate}` : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400">
                          <Lock className="w-3 h-3" />
                          Verrouillé
                        </span>
                      )}
                      <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {progressDetail.current} / {progressDetail.target}{' '}
                        {progressDetail.unitLabel}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quêtes Hebdomadaires (Weekly Quests) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            Quêtes de la Semaine (Coffres XP Bonus)
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Validez vos objectifs terrain pour réclamer jusqu&apos;à +260 XP
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              id: 'q-debug-2',
              title: 'Dépanneur Express',
              desc: 'Résoudre 2 tickets Debug Express',
              current: solvedDebugCount,
              target: 2,
              xp: 50,
            },
            {
              id: 'q-attack-2',
              title: 'Défenseur Temps Réel',
              desc: 'Neutraliser 2 cyberattaques Live',
              current: neutralizedAttacksCount,
              target: 2,
              xp: 60,
            },
            {
              id: 'q-ctf-3',
              title: 'Chasseur de Drapeaux',
              desc: 'Capturer 3 drapeaux en CTF Guidé',
              current: ctfFlagsCount,
              target: 3,
              xp: 75,
            },
            {
              id: 'q-speedrun-1',
              title: 'Chrono Éclair',
              desc: 'Terminer 1 circuit Speedrun',
              current: speedrunsCompleted,
              target: 1,
              xp: 75,
            },
          ].map((q) => {
            const done = q.current >= q.target;
            const claimed = claimedQuests.includes(q.id);
            const pct = Math.min(100, Math.round((q.current / q.target) * 100));
            return (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-sky-700 dark:text-sky-400">+{q.xp} XP</span>
                    <span className="text-slate-500 tabular-nums">
                      {Math.min(q.current, q.target)} / {q.target}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{q.title}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{q.desc}</p>
                </div>

                <div className="space-y-2">
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all ${done ? 'bg-emerald-600' : 'bg-sky-600'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {claimed ? (
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Récompense réclamée
                    </div>
                  ) : done ? (
                    <button
                      type="button"
                      onClick={() => {
                        playVictory();
                        onClaimQuest?.(q.id, q.xp);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                    >
                      Réclamer +{q.xp} XP
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      En cours ({pct} %)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Online Leaderboard Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Classement en Ligne Cyberland
            </h2>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
            <button
              type="button"
              onClick={() => {
                playClick();
                setBoardTab('xp');
              }}
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                boardTab === 'xp'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {boardTab === 'xp' && (
                <motion.span
                  layoutId="leaderboard-tab-pill"
                  transition={SPRING_SNAPPY}
                  className="absolute inset-0 rounded-lg bg-white dark:bg-slate-900 shadow-sm"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                Top XP Global
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setBoardTab('speedrun');
              }}
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                boardTab === 'speedrun'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {boardTab === 'speedrun' && (
                <motion.span
                  layoutId="leaderboard-tab-pill"
                  transition={SPRING_SNAPPY}
                  className="absolute inset-0 rounded-lg bg-white dark:bg-slate-900 shadow-sm"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-sky-500" />
                Records Speedrun
              </span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loadingBoard ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Chargement du classement en temps réel...
            </div>
          ) : (boardTab === 'xp' ? sortedXpRows : sortedSpeedrunRows).length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Sparkles className="w-7 h-7 text-amber-500 mx-auto" />
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {boardTab === 'xp'
                  ? 'Aucun profil classé pour le moment'
                  : 'Aucun chrono Speedrun enregistré pour le moment'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connectez-vous avec Google ci-dessus et synchronisez votre progression pour prendre la 1re place !
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs uppercase font-mono text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Rang</th>
                  <th className="py-3 px-4">Apprenant</th>
                  <th className="py-3 px-4">Titre d’expertise</th>
                  {boardTab === 'xp' ? (
                    <>
                      <th className="py-3 px-4 text-right">Îles</th>
                      <th className="py-3 px-4 text-right">XP Total</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4">Circuit</th>
                      <th className="py-3 px-4 text-right">Meilleur Chrono</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(boardTab === 'xp' ? sortedXpRows : sortedSpeedrunRows).map((row, idx) => {
                  const isMe = user?.uid === row.userId;
                  return (
                    <tr
                      key={row.userId}
                      className={
                        isMe
                          ? 'bg-sky-50/80 dark:bg-sky-950/30 font-semibold'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }
                    >
                      <td className="py-3 px-4 font-mono font-bold tabular-nums">
                        {idx === 0 ? (
                          <span className="text-amber-500">#1</span>
                        ) : idx === 1 ? (
                          <span className="text-slate-400">#2</span>
                        ) : idx === 2 ? (
                          <span className="text-orange-500">#3</span>
                        ) : (
                          <span className="text-slate-500">#{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-900 dark:text-white font-bold">
                        {row.displayName}
                        {isMe && (
                          <span className="ml-2 text-[11px] font-mono text-sky-600 dark:text-sky-400">
                            (Vous)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          {row.rankTitle}
                        </span>
                      </td>
                      {boardTab === 'xp' ? (
                        <>
                          <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                            {row.completedIslandsCount}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                            {row.totalXp.toLocaleString('fr-FR')} XP
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                            {row.bestSpeedrunCircuit || 'Speedrun Cyberland'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-amber-600 dark:text-amber-400 tabular-nums">
                            {formatMs(row.bestSpeedrunMs)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          Confidentialité : aucune adresse e-mail ni donnée personnelle n’est publiée dans le classement public.
        </div>
      </div>
    </div>
  );
};
