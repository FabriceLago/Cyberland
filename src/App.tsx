import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { Award, X } from 'lucide-react';
import {
  CareerTrack,
  DEBUG_TICKETS,
  getAnalystStepNumber,
  getOrderedIslandsForTrack,
  ISLANDS,
} from './data/courseData';
import {
  AchievementDefinition,
  AchievementProgressSnapshot,
  evaluateNewlyUnlockedAchievements,
} from './data/achievements';
import { getHighestUnlockedBadge } from './data/expertiseBadges';
import { LearningPaceId } from './data/mentors';
import { AppRoute, Header } from './components/Header';
import { ArchipelagoView } from './components/ArchipelagoView';
import { IslandLessonView } from './components/IslandLessonView';
import { LabsHubView } from './components/LabsHubView';
import { DebugExpressView } from './components/DebugExpressView';
import { StoryboardsView } from './components/StoryboardsView';
import { QuizAndSheetsView } from './components/QuizAndSheetsView';
import { LeaderboardView } from './components/LeaderboardView';
import { CertificateModal } from './components/CertificateModal';
import { TransferAndClassModal, TransferPayload } from './components/TransferAndClassModal';
import { CheatsheetModal } from './components/CheatsheetModal';
import { DemoVideoModal } from './components/DemoVideoPlayer';
import { EASE_SWISS, SPRING_TOAST } from './components/MotionPrimitives';
import { SpeedrunCompletionResult } from './components/labs/SpeedrunModeLab';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

const STORAGE_KEY = 'geminisland_progress_v3';

interface StoredProgress {
  learnerName: string;
  completedIslands: number[];
  starsByIsland: Record<number, number>;
  quizBonusXp: number;
  solvedDebugIds: string[];
  extraBonusXp: number;
  darkMode: boolean;
  readableMode: boolean;
  projectionMode: boolean;
  speechRate: number;
  bestExamScore: number | null;
  passedExamsCount: number;
  ddosWon: boolean;
  terminalCompleted: boolean;
  crisisContained: boolean;
  selectedTrackId: CareerTrack['id'];
  xpBoostMultiplier: number;
  xpBoostExpiresAt: number | null;
  bestSpeedrunByCircuit: Record<string, number>;
  speedrunsCompleted: number;
  neutralizedAttacksCount: number;
  isPublicLeaderboard: boolean;
  dailyCompletedDate: string | null;
  dailyStreak: number;
  claimedQuests: string[];
  ctfCapturedFlagIds: string[];
  bestSocSurvivalScore: number;
  unlockedAchievements: string[];
  achievementUnlockedAt: Record<string, string>;
  learningPace: LearningPaceId;
  socThemeApplied?: boolean;
}

const DEFAULT_PROGRESS: StoredProgress = {
  learnerName: 'Architecte Explorateur',
  completedIslands: [],
  starsByIsland: {},
  quizBonusXp: 0,
  solvedDebugIds: [],
  extraBonusXp: 0,
  darkMode: true,
  readableMode: false,
  projectionMode: false,
  speechRate: 1,
  bestExamScore: null,
  passedExamsCount: 0,
  ddosWon: false,
  terminalCompleted: false,
  crisisContained: false,
  selectedTrackId: 'all',
  xpBoostMultiplier: 1,
  xpBoostExpiresAt: null,
  bestSpeedrunByCircuit: {},
  speedrunsCompleted: 0,
  neutralizedAttacksCount: 0,
  isPublicLeaderboard: true,
  dailyCompletedDate: null,
  dailyStreak: 0,
  claimedQuests: [],
  ctfCapturedFlagIds: [],
  bestSocSurvivalScore: 0,
  unlockedAchievements: [],
  achievementUnlockedAt: {},
  learningPace: 'regulier',
  socThemeApplied: true,
};

function loadProgress(): StoredProgress {
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem('geminisland_progress_v2');
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    return {
      ...DEFAULT_PROGRESS,
      learnerName:
        typeof parsed.learnerName === 'string' && parsed.learnerName.trim()
          ? parsed.learnerName.slice(0, 48)
          : DEFAULT_PROGRESS.learnerName,
      completedIslands: Array.isArray(parsed.completedIslands) ? parsed.completedIslands : [],
      starsByIsland:
        parsed.starsByIsland && typeof parsed.starsByIsland === 'object'
          ? parsed.starsByIsland
          : {},
      quizBonusXp: typeof parsed.quizBonusXp === 'number' ? parsed.quizBonusXp : 0,
      solvedDebugIds: Array.isArray(parsed.solvedDebugIds) ? parsed.solvedDebugIds : [],
      extraBonusXp: typeof parsed.extraBonusXp === 'number' ? parsed.extraBonusXp : 0,
      darkMode: parsed.socThemeApplied ? Boolean(parsed.darkMode) : true,
      socThemeApplied: true,
      readableMode: Boolean(parsed.readableMode),
      projectionMode: Boolean(parsed.projectionMode),
      speechRate: typeof parsed.speechRate === 'number' ? parsed.speechRate : 1,
      bestExamScore: typeof parsed.bestExamScore === 'number' ? parsed.bestExamScore : null,
      passedExamsCount:
        typeof parsed.passedExamsCount === 'number'
          ? parsed.passedExamsCount
          : typeof parsed.bestExamScore === 'number' && parsed.bestExamScore >= 10
          ? 1
          : 0,
      ddosWon: Boolean(parsed.ddosWon),
      terminalCompleted: Boolean(parsed.terminalCompleted),
      crisisContained: Boolean(parsed.crisisContained),
      selectedTrackId:
        parsed.selectedTrackId === 'network' ||
        parsed.selectedTrackId === 'cloud-win' ||
        parsed.selectedTrackId === 'soc-cyber'
          ? parsed.selectedTrackId
          : 'all',
      xpBoostMultiplier:
        typeof parsed.xpBoostMultiplier === 'number' && parsed.xpBoostMultiplier >= 1
          ? parsed.xpBoostMultiplier
          : 1,
      xpBoostExpiresAt:
        typeof parsed.xpBoostExpiresAt === 'number' ? parsed.xpBoostExpiresAt : null,
      bestSpeedrunByCircuit:
        parsed.bestSpeedrunByCircuit && typeof parsed.bestSpeedrunByCircuit === 'object'
          ? parsed.bestSpeedrunByCircuit
          : {},
      speedrunsCompleted:
        typeof parsed.speedrunsCompleted === 'number' ? parsed.speedrunsCompleted : 0,
      neutralizedAttacksCount:
        typeof parsed.neutralizedAttacksCount === 'number' ? parsed.neutralizedAttacksCount : 0,
      isPublicLeaderboard:
        typeof parsed.isPublicLeaderboard === 'boolean' ? parsed.isPublicLeaderboard : true,
      dailyCompletedDate:
        typeof parsed.dailyCompletedDate === 'string' ? parsed.dailyCompletedDate : null,
      dailyStreak: typeof parsed.dailyStreak === 'number' ? parsed.dailyStreak : 0,
      claimedQuests: Array.isArray(parsed.claimedQuests) ? parsed.claimedQuests : [],
      ctfCapturedFlagIds: Array.isArray(parsed.ctfCapturedFlagIds)
        ? parsed.ctfCapturedFlagIds
        : [],
      bestSocSurvivalScore:
        typeof parsed.bestSocSurvivalScore === 'number' ? parsed.bestSocSurvivalScore : 0,
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
        ? parsed.unlockedAchievements.filter((id): id is string => typeof id === 'string')
        : [],
      achievementUnlockedAt:
        parsed.achievementUnlockedAt && typeof parsed.achievementUnlockedAt === 'object'
          ? parsed.achievementUnlockedAt
          : {},
      learningPace:
        parsed.learningPace === 'tranquille' ||
        parsed.learningPace === 'regulier' ||
        parsed.learningPace === 'intensif'
          ? parsed.learningPace
          : 'regulier',
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>('archipel');
  const [quizInitialSection, setQuizInitialSection] = useState<'quiz' | 'cases' | 'exam' | 'duel'>('quiz');
  const [activeIslandId, setActiveIslandId] = useState<number>(1);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [demoVideoOpen, setDemoVideoOpen] = useState(false);
  const [progress, setProgress] = useState<StoredProgress>(() => loadProgress());
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  const [unlockedToastQueue, setUnlockedToastQueue] = useState<AchievementDefinition[]>([]);

  // Firebase Auth & Cloud Sync state
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const cloudLoadedForUidRef = useRef<string | null>(null);

  const xpBoostRemainingSec = useMemo(() => {
    if (!progress.xpBoostExpiresAt || progress.xpBoostMultiplier <= 1) return 0;
    return Math.max(0, Math.ceil((progress.xpBoostExpiresAt - nowTs) / 1000));
  }, [progress.xpBoostExpiresAt, progress.xpBoostMultiplier, nowTs]);

  const activeMultiplier = xpBoostRemainingSec > 0 ? progress.xpBoostMultiplier : 1;

  useEffect(() => {
    if (!progress.xpBoostExpiresAt || progress.xpBoostExpiresAt <= Date.now()) return;
    const id = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [progress.xpBoostExpiresAt]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress]);

  // Sync Tailwind v4 .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (progress.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [progress.darkMode]);

  const islandXp = useMemo(() => {
    return ISLANDS.filter((i) => progress.completedIslands.includes(i.id)).reduce(
      (sum, i) => sum + i.xpReward,
      0
    );
  }, [progress.completedIslands]);

  const debugBonusXp = useMemo(() => {
    return DEBUG_TICKETS.filter((t) => progress.solvedDebugIds.includes(t.id)).reduce(
      (sum, t) => sum + t.xpReward,
      0
    );
  }, [progress.solvedDebugIds]);

  const totalXp = islandXp + progress.quizBonusXp + debugBonusXp + progress.extraBonusXp;

  const { bestSpeedrunMs, bestSpeedrunCircuit } = useMemo(() => {
    const entries = Object.entries(progress.bestSpeedrunByCircuit).filter(
      ([, ms]) => typeof ms === 'number' && ms > 0
    );
    if (entries.length === 0) {
      return { bestSpeedrunMs: 0, bestSpeedrunCircuit: '' };
    }
    entries.sort((a, b) => a[1] - b[1]);
    return {
      bestSpeedrunMs: Math.min(3600000, Math.round(entries[0][1])),
      bestSpeedrunCircuit: entries[0][0].slice(0, 40),
    };
  }, [progress.bestSpeedrunByCircuit]);

  const highestRankTitle = useMemo(() => {
    const badge = getHighestUnlockedBadge(
      totalXp,
      progress.passedExamsCount,
      progress.bestExamScore,
      progress.speedrunsCompleted,
      progress.neutralizedAttacksCount
    );
    return (badge ? badge.title : 'Explorateur Cyberland').slice(0, 56);
  }, [
    totalXp,
    progress.passedExamsCount,
    progress.bestExamScore,
    progress.speedrunsCompleted,
    progress.neutralizedAttacksCount,
  ]);

  const achievementSnapshot: AchievementProgressSnapshot = useMemo(
    () => ({
      completedIslands: progress.completedIslands,
      solvedDebugCount: progress.solvedDebugIds.length,
      ctfFlagsCount: progress.ctfCapturedFlagIds.length,
      neutralizedAttacksCount: progress.neutralizedAttacksCount,
      ddosWon: progress.ddosWon,
      terminalCompleted: progress.terminalCompleted,
      crisisContained: progress.crisisContained,
      speedrunsCompleted: progress.speedrunsCompleted,
      bestExamScore: progress.bestExamScore,
      passedExamsCount: progress.passedExamsCount,
      dailyStreak: progress.dailyStreak,
      claimedQuestsCount: progress.claimedQuests.length,
      bestSocSurvivalScore: progress.bestSocSurvivalScore,
    }),
    [
      progress.completedIslands,
      progress.solvedDebugIds.length,
      progress.ctfCapturedFlagIds.length,
      progress.neutralizedAttacksCount,
      progress.ddosWon,
      progress.terminalCompleted,
      progress.crisisContained,
      progress.speedrunsCompleted,
      progress.bestExamScore,
      progress.passedExamsCount,
      progress.dailyStreak,
      progress.claimedQuests.length,
      progress.bestSocSurvivalScore,
    ]
  );

  // Evaluate and unlock new achievements automatically whenever progress evolves
  useEffect(() => {
    const newlyUnlocked = evaluateNewlyUnlockedAchievements(
      achievementSnapshot,
      progress.unlockedAchievements
    );
    if (newlyUnlocked.length === 0) return;

    const todayIso = new Date().toISOString().slice(0, 10);
    const totalAchievementXp = newlyUnlocked.reduce((sum, a) => sum + a.xpReward, 0);

    setProgress((prev) => {
      const existingSet = new Set(prev.unlockedAchievements);
      const additions = newlyUnlocked.filter((a) => !existingSet.has(a.id));
      if (additions.length === 0) return prev;

      const nextDates = { ...prev.achievementUnlockedAt };
      additions.forEach((a) => {
        if (!nextDates[a.id]) {
          nextDates[a.id] = todayIso;
        }
      });

      return {
        ...prev,
        unlockedAchievements: [...prev.unlockedAchievements, ...additions.map((a) => a.id)],
        achievementUnlockedAt: nextDates,
        extraBonusXp: Math.min(4000, prev.extraBonusXp + totalAchievementXp),
      };
    });

    setUnlockedToastQueue(newlyUnlocked);
  }, [achievementSnapshot, progress.unlockedAchievements]);

  useEffect(() => {
    if (unlockedToastQueue.length === 0) return;
    const timer = window.setTimeout(() => {
      setUnlockedToastQueue([]);
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [unlockedToastQueue]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        cloudLoadedForUidRef.current = null;
        setLastSyncedAt(null);
      }
    });
    return () => unsub();
  }, []);

  // Load and merge Cloud progress once per signed-in user
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) return;
    if (cloudLoadedForUidRef.current === user.uid) return;
    cloudLoadedForUidRef.current = user.uid;

    const hydrateFromCloud = async () => {
      const progressPath = `user_progress/${user.uid}`;
      const boardPath = `leaderboard/${user.uid}`;
      try {
        const [progSnap, boardSnap] = await Promise.all([
          getDoc(doc(db, 'user_progress', user.uid)),
          getDoc(doc(db, 'leaderboard', user.uid)),
        ]);

        setProgress((prev) => {
          let next = { ...prev };

          // Prefer Google displayName if learnerName is still default
          if (
            next.learnerName === DEFAULT_PROGRESS.learnerName &&
            user.displayName &&
            user.displayName.trim()
          ) {
            next.learnerName = user.displayName.trim().slice(0, 48);
          }

          if (progSnap.exists()) {
            const d = progSnap.data();
            const cloudIslands = Array.isArray(d.completedIslands)
              ? d.completedIslands.filter((n): n is number => Number.isInteger(n))
              : [];
            const mergedIslands = Array.from(
              new Set([...next.completedIslands, ...cloudIslands])
            ).sort((a, b) => a - b);

            const cloudBestExam =
              typeof d.bestExamScore === 'number' && d.bestExamScore >= 0
                ? d.bestExamScore
                : null;
            const mergedBestExam =
              next.bestExamScore === null
                ? cloudBestExam
                : cloudBestExam === null
                  ? next.bestExamScore
                  : Math.max(next.bestExamScore, cloudBestExam);

            const cloudName =
              typeof d.learnerName === 'string' && d.learnerName.trim()
                ? d.learnerName.trim().slice(0, 48)
                : next.learnerName;

            const mergedIslandXp = ISLANDS.filter((i) => mergedIslands.includes(i.id)).reduce(
              (sum, i) => sum + i.xpReward,
              0
            );
            const currentDebugXp = DEBUG_TICKETS.filter((t) =>
              next.solvedDebugIds.includes(t.id)
            ).reduce((sum, t) => sum + t.xpReward, 0);
            const currentTotal =
              mergedIslandXp + next.quizBonusXp + currentDebugXp + next.extraBonusXp;
            const cloudXp = typeof d.totalXp === 'number' ? d.totalXp : 0;
            const xpDelta = cloudXp > currentTotal ? Math.round(cloudXp - currentTotal) : 0;

            const nextBestSpeedrun = { ...next.bestSpeedrunByCircuit };
            if (typeof d.bestSpeedrunMs === 'number' && d.bestSpeedrunMs > 0) {
              const prevRecord = nextBestSpeedrun.cloud_record;
              nextBestSpeedrun.cloud_record =
                typeof prevRecord === 'number'
                  ? Math.min(prevRecord, d.bestSpeedrunMs)
                  : d.bestSpeedrunMs;
            }

            next = {
              ...next,
              learnerName:
                next.learnerName === DEFAULT_PROGRESS.learnerName ? cloudName : next.learnerName,
              completedIslands: mergedIslands,
              bestExamScore: mergedBestExam,
              passedExamsCount: Math.max(
                next.passedExamsCount,
                typeof d.passedExamsCount === 'number' ? d.passedExamsCount : 0
              ),
              speedrunsCompleted: Math.max(
                next.speedrunsCompleted,
                typeof d.speedrunsCompleted === 'number' ? d.speedrunsCompleted : 0
              ),
              neutralizedAttacksCount: Math.max(
                next.neutralizedAttacksCount,
                typeof d.neutralizedAttacksCount === 'number' ? d.neutralizedAttacksCount : 0
              ),
              bestSpeedrunByCircuit: nextBestSpeedrun,
              extraBonusXp: Math.min(4000, next.extraBonusXp + xpDelta),
            };
          }

          if (boardSnap.exists()) {
            const bd = boardSnap.data();
            if (typeof bd.isPublic === 'boolean') {
              next.isPublicLeaderboard = bd.isPublic;
            }
          }

          return next;
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `${progressPath} / ${boardPath}`);
      }
    };

    void hydrateFromCloud();
  }, [authReady, user]);

  // Push progress + public leaderboard entry strictly conforming to firestore.rules
  const syncCloudNow = useCallback(async () => {
    if (!user || !user.emailVerified) return;
    setSyncing(true);

    const safeName = (
      progress.learnerName.trim() ||
      user.displayName?.trim() ||
      'Explorateur Cyberland'
    ).slice(0, 48);
    const safeCompleted = progress.completedIslands
      .filter((id) => Number.isInteger(id))
      .slice(0, 25);
    const safeXp = Math.max(0, Math.min(50000, Math.round(totalXp)));
    const safeBestExam =
      progress.bestExamScore === null
        ? -1
        : Math.max(0, Math.min(20, Math.round(progress.bestExamScore)));
    const safePassedExams = Math.max(0, Math.min(500, Math.round(progress.passedExamsCount)));
    const safeSpeedruns = Math.max(0, Math.min(1000, Math.round(progress.speedrunsCompleted)));
    const safeNeutralized = Math.max(
      0,
      Math.min(50, Math.round(progress.neutralizedAttacksCount))
    );
    const safeBestMs = Math.max(0, Math.min(3600000, Math.round(bestSpeedrunMs)));

    const progressRef = doc(db, 'user_progress', user.uid);
    const boardRef = doc(db, 'leaderboard', user.uid);

    try {
      const existingProgress = await getDoc(progressRef);
      const mutableProgress = {
        learnerName: safeName,
        completedIslands: safeCompleted,
        totalXp: safeXp,
        bestExamScore: safeBestExam,
        passedExamsCount: safePassedExams,
        speedrunsCompleted: safeSpeedruns,
        neutralizedAttacksCount: safeNeutralized,
        bestSpeedrunMs: safeBestMs,
        selectedTrackId: progress.selectedTrackId,
        updatedAt: serverTimestamp(),
      };

      if (!existingProgress.exists()) {
        await setDoc(progressRef, {
          userId: user.uid,
          ...mutableProgress,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(progressRef, mutableProgress);
      }

      const existingBoard = await getDoc(boardRef);
      const mutableBoard = {
        displayName: safeName,
        totalXp: safeXp,
        completedIslandsCount: safeCompleted.length,
        bestSpeedrunMs: safeBestMs,
        bestSpeedrunCircuit: bestSpeedrunCircuit.slice(0, 40),
        rankTitle: highestRankTitle.slice(0, 56),
        isPublic: Boolean(progress.isPublicLeaderboard),
        updatedAt: serverTimestamp(),
      };

      if (!existingBoard.exists()) {
        await setDoc(boardRef, {
          userId: user.uid,
          ...mutableBoard,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(boardRef, mutableBoard);
      }

      const now = new Date();
      setLastSyncedAt(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `user_progress/${user.uid}`);
    } finally {
      setSyncing(false);
    }
  }, [
    user,
    progress.learnerName,
    progress.completedIslands,
    progress.bestExamScore,
    progress.passedExamsCount,
    progress.speedrunsCompleted,
    progress.neutralizedAttacksCount,
    progress.selectedTrackId,
    progress.isPublicLeaderboard,
    totalXp,
    bestSpeedrunMs,
    bestSpeedrunCircuit,
    highestRankTitle,
  ]);

  // Auto-sync debounced whenever key stats change while signed in
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) return;
    const timer = window.setTimeout(() => {
      void syncCloudNow();
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [authReady, user, syncCloudNow]);

  const nextIslandId = useMemo(() => {
    const ordered = getOrderedIslandsForTrack(progress.selectedTrackId);
    const next = ordered.find((i) => !progress.completedIslands.includes(i.id));
    return next ? next.id : (ordered[ordered.length - 1]?.id ?? 1);
  }, [progress.completedIslands, progress.selectedTrackId]);

  const nextStepNumber = useMemo(
    () => getAnalystStepNumber(nextIslandId, progress.selectedTrackId),
    [nextIslandId, progress.selectedTrackId]
  );

  const activeIsland = ISLANDS.find((i) => i.id === activeIslandId) ?? ISLANDS[0];

  const handleOpenIsland = (islandId: number) => {
    setActiveIslandId(islandId);
    setRoute('island');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (nextRoute: AppRoute) => {
    if (nextRoute === 'quiz') {
      setQuizInitialSection('quiz');
    }
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenExam = () => {
    setQuizInitialSection('exam');
    setRoute('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteIsland = (islandId: number, stars: number) => {
    setProgress((prev) => {
      const alreadyCompleted = prev.completedIslands.includes(islandId);
      const completedIslands = alreadyCompleted
        ? prev.completedIslands
        : [...prev.completedIslands, islandId].sort((a, b) => a - b);
      const prevStars = prev.starsByIsland[islandId] ?? 0;
      const island = ISLANDS.find((i) => i.id === islandId);
      const mult =
        prev.xpBoostExpiresAt && prev.xpBoostExpiresAt > Date.now() ? prev.xpBoostMultiplier : 1;
      const boostExtra =
        !alreadyCompleted && island && mult > 1
          ? Math.round(island.xpReward * (mult - 1))
          : 0;
      return {
        ...prev,
        completedIslands,
        starsByIsland: {
          ...prev.starsByIsland,
          [islandId]: Math.max(prevStars, stars),
        },
        extraBonusXp: Math.min(4000, prev.extraBonusXp + boostExtra),
      };
    });
  };

  const handleAwardQuizXp = (xpGain: number) => {
    setProgress((prev) => {
      const mult =
        prev.xpBoostExpiresAt && prev.xpBoostExpiresAt > Date.now() ? prev.xpBoostMultiplier : 1;
      const boosted = Math.round(xpGain * mult);
      return {
        ...prev,
        quizBonusXp: Math.max(prev.quizBonusXp, boosted),
      };
    });
  };

  const handleAddExtraXp = (xpGain: number) => {
    setProgress((prev) => {
      const mult =
        prev.xpBoostExpiresAt && prev.xpBoostExpiresAt > Date.now() ? prev.xpBoostMultiplier : 1;
      const boostedGain = Math.round(xpGain * mult);
      return {
        ...prev,
        extraBonusXp: Math.min(4000, prev.extraBonusXp + boostedGain),
      };
    });
  };

  const handleFinishExam = (scoreOutOf20: number) => {
    setProgress((prev) => {
      const mult =
        prev.xpBoostExpiresAt && prev.xpBoostExpiresAt > Date.now() ? prev.xpBoostMultiplier : 1;
      const examXp = Math.round(scoreOutOf20 * 5 * mult);
      return {
        ...prev,
        bestExamScore:
          prev.bestExamScore === null ? scoreOutOf20 : Math.max(prev.bestExamScore, scoreOutOf20),
        passedExamsCount:
          scoreOutOf20 >= 10 ? prev.passedExamsCount + 1 : prev.passedExamsCount,
        extraBonusXp: Math.min(4000, prev.extraBonusXp + examXp),
      };
    });
  };

  const handleSolveDebugTicket = (ticketId: string) => {
    setProgress((prev) => {
      if (prev.solvedDebugIds.includes(ticketId)) return prev;
      const ticket = DEBUG_TICKETS.find((t) => t.id === ticketId);
      const mult =
        prev.xpBoostExpiresAt && prev.xpBoostExpiresAt > Date.now() ? prev.xpBoostMultiplier : 1;
      const boostExtra = ticket && mult > 1 ? Math.round(ticket.xpReward * (mult - 1)) : 0;
      return {
        ...prev,
        solvedDebugIds: [...prev.solvedDebugIds, ticketId],
        extraBonusXp: Math.min(4000, prev.extraBonusXp + boostExtra),
      };
    });
  };

  const handleCompleteSpeedrun = (result: SpeedrunCompletionResult) => {
    const now = Date.now();
    setNowTs(now);
    setProgress((prev) => {
      const prevBest = prev.bestSpeedrunByCircuit[result.circuitId];
      const bestMs =
        typeof prevBest === 'number' ? Math.min(prevBest, result.durationMs) : result.durationMs;
      const nextExpiresAt = now + result.durationMinutes * 60 * 1000;
      const stillActive = prev.xpBoostExpiresAt !== null && prev.xpBoostExpiresAt > now;
      const nextMultiplier = stillActive
        ? Math.max(prev.xpBoostMultiplier, result.multiplier)
        : result.multiplier;
      return {
        ...prev,
        xpBoostMultiplier: nextMultiplier,
        xpBoostExpiresAt: Math.max(prev.xpBoostExpiresAt ?? 0, nextExpiresAt),
        bestSpeedrunByCircuit: {
          ...prev.bestSpeedrunByCircuit,
          [result.circuitId]: bestMs,
        },
        speedrunsCompleted: prev.speedrunsCompleted + 1,
        extraBonusXp: Math.min(4000, prev.extraBonusXp + result.instantBonusXp),
      };
    });
  };

  const handleImportProgress = (payload: TransferPayload) => {
    setProgress((prev) => ({
      ...prev,
      learnerName: payload.name.slice(0, 48),
      completedIslands: payload.completedIslands,
      starsByIsland: payload.starsByIsland,
      quizBonusXp: payload.quizBonusXp,
      solvedDebugIds: payload.solvedDebugIds,
      extraBonusXp: payload.extraBonusXp,
    }));
  };

  const handleResetProgress = () => {
    setProgress((prev) => ({
      ...DEFAULT_PROGRESS,
      learnerName: prev.learnerName,
      learningPace: prev.learningPace,
      darkMode: prev.darkMode,
      readableMode: prev.readableMode,
      projectionMode: prev.projectionMode,
      speechRate: prev.speechRate,
    }));
  };

  return (
    <MotionConfig reducedMotion="user">
    <div
      className={`min-h-screen flex flex-col bg-[#F7F9FC] dark:bg-[#0B1120] soc-grid-bg text-slate-900 dark:text-slate-100 transition-colors ${
        progress.readableMode ? 'readable-mode' : ''
      } ${progress.projectionMode ? 'projection-mode' : ''}`}
    >
      <Header
        activeRoute={route}
        onNavigate={handleNavigate}
        nextIslandId={nextIslandId}
        nextStepNumber={nextStepNumber}
        onOpenIsland={handleOpenIsland}
        onOpenDemoVideo={() => setDemoVideoOpen(true)}
        xpBoostMultiplier={activeMultiplier}
        xpBoostRemainingSec={xpBoostRemainingSec}
        isSignedIn={Boolean(user)}
        userLabel={progress.learnerName || user?.displayName || null}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={route === 'island' ? `island-${activeIslandId}` : route}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: EASE_SWISS }}
          >
        {route === 'archipel' && (
          <ArchipelagoView
            learnerName={progress.learnerName}
            learningPace={progress.learningPace}
            onChangeLearnerName={(name) =>
              setProgress((p) => ({
                ...p,
                learnerName: name.trim().slice(0, 48) || DEFAULT_PROGRESS.learnerName,
              }))
            }
            onChangeLearningPace={(pace) =>
              setProgress((p) => ({ ...p, learningPace: pace }))
            }
            completedIslands={progress.completedIslands}
            starsByIsland={progress.starsByIsland}
            solvedDebugCount={progress.solvedDebugIds.length}
            ctfFlagsCount={progress.ctfCapturedFlagIds.length}
            bestExamScore={progress.bestExamScore}
            passedExamsCount={progress.passedExamsCount}
            ddosWon={progress.ddosWon}
            terminalCompleted={progress.terminalCompleted}
            crisisContained={progress.crisisContained}
            speedrunsCompleted={progress.speedrunsCompleted}
            neutralizedAttacksCount={progress.neutralizedAttacksCount}
            selectedTrackId={progress.selectedTrackId}
            xp={islandXp}
            quizBonusXp={progress.quizBonusXp}
            debugBonusXp={debugBonusXp}
            extraBonusXp={progress.extraBonusXp}
            darkMode={progress.darkMode}
            readableMode={progress.readableMode}
            projectionMode={progress.projectionMode}
            speechRate={progress.speechRate}
            onSelectTrack={(trackId) =>
              setProgress((p) => ({ ...p, selectedTrackId: trackId }))
            }
            onToggleDarkMode={() =>
              setProgress((p) => ({ ...p, darkMode: !p.darkMode }))
            }
            onToggleReadableMode={() =>
              setProgress((p) => ({ ...p, readableMode: !p.readableMode }))
            }
            onToggleProjectionMode={() =>
              setProgress((p) => ({ ...p, projectionMode: !p.projectionMode }))
            }
            onChangeSpeechRate={(rate) =>
              setProgress((p) => ({ ...p, speechRate: rate }))
            }
            onSelectIsland={handleOpenIsland}
            onOpenSimulator={() => handleNavigate('simulateur')}
            onOpenExam={handleOpenExam}
            onOpenCertificate={() => setCertificateOpen(true)}
            onOpenTransfer={() => setTransferOpen(true)}
            onOpenCheatsheet={() => setCheatsheetOpen(true)}
            onOpenDemoVideo={() => setDemoVideoOpen(true)}
            onResetProgress={handleResetProgress}
          />
        )}

        {route === 'island' && (
          <IslandLessonView
            island={activeIsland}
            selectedTrackId={progress.selectedTrackId}
            completedIslands={progress.completedIslands}
            starsByIsland={progress.starsByIsland}
            defaultSpeechRate={progress.speechRate}
            onCompleteIsland={handleCompleteIsland}
            onSelectIsland={handleOpenIsland}
            onBackToMap={() => handleNavigate('archipel')}
          />
        )}

        {route === 'simulateur' && (
          <LabsHubView
            onWinDdosXp={() => {
              setProgress((p) => ({
                ...p,
                ddosWon: true,
                neutralizedAttacksCount: Math.min(50, p.neutralizedAttacksCount + 1),
              }));
              handleAddExtraXp(100);
            }}
            onCompleteTerminalMissions={() => {
              setProgress((p) => ({ ...p, terminalCompleted: true }));
              handleAddExtraXp(50);
            }}
            onContainCrisis={() => {
              setProgress((p) => ({ ...p, crisisContained: true }));
              handleAddExtraXp(120);
            }}
            onMasterSqli={() => {
              setProgress((p) => ({
                ...p,
                neutralizedAttacksCount: Math.min(50, p.neutralizedAttacksCount + 1),
              }));
              handleAddExtraXp(80);
            }}
            onNeutralizeCyberAttack={() => {
              setProgress((p) => ({
                ...p,
                neutralizedAttacksCount: Math.min(50, p.neutralizedAttacksCount + 1),
              }));
              handleAddExtraXp(50);
            }}
            onAwardLabXp={(xp) => handleAddExtraXp(xp)}
            onCaptureCtfFlag={(flagId, xp) => {
              setProgress((p) => {
                if (p.ctfCapturedFlagIds.includes(flagId)) return p;
                return { ...p, ctfCapturedFlagIds: [...p.ctfCapturedFlagIds, flagId] };
              });
              handleAddExtraXp(xp);
            }}
            bestSocSurvivalScore={progress.bestSocSurvivalScore}
            onFinishSocSurvival={(score, xpEarned) => {
              setProgress((p) => ({
                ...p,
                bestSocSurvivalScore: Math.max(p.bestSocSurvivalScore, score),
              }));
              handleAddExtraXp(xpEarned);
            }}
            bestSpeedrunByCircuit={progress.bestSpeedrunByCircuit}
            xpBoostMultiplier={activeMultiplier}
            xpBoostRemainingSec={xpBoostRemainingSec}
            onCompleteSpeedrun={handleCompleteSpeedrun}
          />
        )}

        {route === 'debug' && (
          <DebugExpressView
            completedIslands={progress.completedIslands}
            solvedDebugIds={progress.solvedDebugIds}
            onSolveDebugTicket={handleSolveDebugTicket}
          />
        )}

        {route === 'storyboards' && (
          <StoryboardsView
            onNavigate={handleNavigate}
            onOpenIsland={handleOpenIsland}
          />
        )}

        {route === 'quiz' && (
          <QuizAndSheetsView
            initialSection={quizInitialSection}
            bestExamScore={progress.bestExamScore}
            completedIslands={progress.completedIslands}
            onAwardQuizXp={handleAwardQuizXp}
            onAwardCaseXp={(xp) => handleAddExtraXp(xp)}
            onFinishExam={handleFinishExam}
            onOpenIsland={handleOpenIsland}
          />
        )}

        {route === 'classement' && (
          <LeaderboardView
            user={user}
            authReady={authReady}
            learnerName={progress.learnerName}
            learningPace={progress.learningPace}
            onChangeLearnerName={(name) =>
              setProgress((p) => ({ ...p, learnerName: name.slice(0, 48) }))
            }
            totalXp={totalXp}
            completedIslandsCount={progress.completedIslands.length}
            bestSpeedrunMs={bestSpeedrunMs}
            isPublicLeaderboard={progress.isPublicLeaderboard}
            onTogglePublicLeaderboard={() =>
              setProgress((p) => ({ ...p, isPublicLeaderboard: !p.isPublicLeaderboard }))
            }
            onSyncNow={syncCloudNow}
            syncing={syncing}
            lastSyncedAt={lastSyncedAt}
            dailyCompletedDate={progress.dailyCompletedDate}
            dailyStreak={progress.dailyStreak}
            solvedDebugCount={progress.solvedDebugIds.length}
            neutralizedAttacksCount={progress.neutralizedAttacksCount}
            ctfFlagsCount={progress.ctfCapturedFlagIds.length}
            speedrunsCompleted={progress.speedrunsCompleted}
            claimedQuests={progress.claimedQuests}
            unlockedAchievements={progress.unlockedAchievements}
            achievementUnlockedAt={progress.achievementUnlockedAt}
            achievementSnapshot={achievementSnapshot}
            onClaimQuest={(questId, xpReward) => {
              setProgress((p) => {
                if (p.claimedQuests.includes(questId)) return p;
                return { ...p, claimedQuests: [...p.claimedQuests, questId] };
              });
              handleAddExtraXp(xpReward);
            }}
            onCompleteDailyChallenge={(dateKey, xpBonus) => {
              setProgress((p) => {
                if (p.dailyCompletedDate === dateKey) return p;
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
                const nextStreak = p.dailyCompletedDate === yKey ? p.dailyStreak + 1 : 1;
                return { ...p, dailyCompletedDate: dateKey, dailyStreak: nextStreak };
              });
              handleAddExtraXp(xpBonus);
            }}
          />
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {unlockedToastQueue.length > 0 && (
          <motion.div
            key="achievement-toast"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={SPRING_TOAST}
            className="medal-sheen fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] rounded-2xl border border-amber-300 dark:border-amber-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl p-4 flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="text-xs font-mono font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                {unlockedToastQueue.length === 1
                  ? 'Succès débloqué'
                  : `${unlockedToastQueue.length} succès débloqués`}
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                {unlockedToastQueue.map((a) => a.title).join(' · ')}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                +
                {unlockedToastQueue
                  .reduce((sum, a) => sum + a.xpReward, 0)
                  .toLocaleString('fr-FR')}{' '}
                XP ajoutés à votre profil
              </div>
              {route !== 'classement' && (
                <button
                  type="button"
                  onClick={() => {
                    setUnlockedToastQueue([]);
                    handleNavigate('classement');
                  }}
                  className="mt-1 inline-flex items-center text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline"
                >
                  Voir mes médailles dans le profil →
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setUnlockedToastQueue([])}
              aria-label="Fermer la notification"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CertificateModal
        isOpen={certificateOpen}
        onClose={() => setCertificateOpen(false)}
        completedIslands={progress.completedIslands}
        starsByIsland={progress.starsByIsland}
        totalXp={totalXp}
        bestExamScore={progress.bestExamScore}
        passedExamsCount={progress.passedExamsCount}
        selectedTrackId={progress.selectedTrackId}
      />

      <TransferAndClassModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        currentProgress={{
          name: progress.learnerName,
          completedIslands: progress.completedIslands,
          starsByIsland: progress.starsByIsland,
          quizBonusXp: progress.quizBonusXp,
          solvedDebugIds: progress.solvedDebugIds,
          extraBonusXp: progress.extraBonusXp,
        }}
        onImportProgress={handleImportProgress}
      />

      <CheatsheetModal
        isOpen={cheatsheetOpen}
        onClose={() => setCheatsheetOpen(false)}
      />

      <DemoVideoModal
        isOpen={demoVideoOpen}
        onClose={() => setDemoVideoOpen(false)}
        onNavigate={handleNavigate}
        onOpenIsland={handleOpenIsland}
      />

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>
            L&apos;Archipel de Cyberland · Cours interactif d&apos;introduction aux réseaux et au
            Cloud Computing
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => handleNavigate('archipel')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Archipel
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('simulateur')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Laboratoires
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('debug')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Debug &amp; Cartes Mémo
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('storyboards')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Storyboards
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('quiz')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Quiz &amp; Études de cas
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('classement')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Classement &amp; Compte
            </button>
          </div>
        </div>
      </footer>
    </div>
    </MotionConfig>
  );
}
