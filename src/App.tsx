import { useEffect, useMemo, useState } from 'react';
import { CareerTrack, DEBUG_TICKETS, ISLANDS } from './data/courseData';
import { AppRoute, Header } from './components/Header';
import { ArchipelagoView } from './components/ArchipelagoView';
import { IslandLessonView } from './components/IslandLessonView';
import { LabsHubView } from './components/LabsHubView';
import { DebugExpressView } from './components/DebugExpressView';
import { StoryboardsView } from './components/StoryboardsView';
import { QuizAndSheetsView } from './components/QuizAndSheetsView';
import { CertificateModal } from './components/CertificateModal';
import { TransferAndClassModal, TransferPayload } from './components/TransferAndClassModal';
import { CheatsheetModal } from './components/CheatsheetModal';

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
}

const DEFAULT_PROGRESS: StoredProgress = {
  learnerName: 'Architecte Explorateur',
  completedIslands: [],
  starsByIsland: {},
  quizBonusXp: 0,
  solvedDebugIds: [],
  extraBonusXp: 0,
  darkMode: false,
  readableMode: false,
  projectionMode: false,
  speechRate: 1,
  bestExamScore: null,
  passedExamsCount: 0,
  ddosWon: false,
  terminalCompleted: false,
  crisisContained: false,
  selectedTrackId: 'all',
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
          ? parsed.learnerName
          : DEFAULT_PROGRESS.learnerName,
      completedIslands: Array.isArray(parsed.completedIslands) ? parsed.completedIslands : [],
      starsByIsland:
        parsed.starsByIsland && typeof parsed.starsByIsland === 'object'
          ? parsed.starsByIsland
          : {},
      quizBonusXp: typeof parsed.quizBonusXp === 'number' ? parsed.quizBonusXp : 0,
      solvedDebugIds: Array.isArray(parsed.solvedDebugIds) ? parsed.solvedDebugIds : [],
      extraBonusXp: typeof parsed.extraBonusXp === 'number' ? parsed.extraBonusXp : 0,
      darkMode: Boolean(parsed.darkMode),
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
  const [progress, setProgress] = useState<StoredProgress>(() => loadProgress());

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

  const nextIslandId = useMemo(() => {
    const next = ISLANDS.find((i) => !progress.completedIslands.includes(i.id));
    return next ? next.id : ISLANDS.length;
  }, [progress.completedIslands]);

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
      const completedIslands = prev.completedIslands.includes(islandId)
        ? prev.completedIslands
        : [...prev.completedIslands, islandId].sort((a, b) => a - b);
      const prevStars = prev.starsByIsland[islandId] ?? 0;
      return {
        ...prev,
        completedIslands,
        starsByIsland: {
          ...prev.starsByIsland,
          [islandId]: Math.max(prevStars, stars),
        },
      };
    });
  };

  const handleAwardQuizXp = (xpGain: number) => {
    setProgress((prev) => ({
      ...prev,
      quizBonusXp: Math.max(prev.quizBonusXp, xpGain),
    }));
  };

  const handleAddExtraXp = (xpGain: number) => {
    setProgress((prev) => ({
      ...prev,
      extraBonusXp: Math.min(500, prev.extraBonusXp + xpGain),
    }));
  };

  const handleFinishExam = (scoreOutOf20: number) => {
    setProgress((prev) => ({
      ...prev,
      bestExamScore:
        prev.bestExamScore === null ? scoreOutOf20 : Math.max(prev.bestExamScore, scoreOutOf20),
      passedExamsCount:
        scoreOutOf20 >= 10 ? prev.passedExamsCount + 1 : prev.passedExamsCount,
      extraBonusXp: Math.min(500, prev.extraBonusXp + Math.round(scoreOutOf20 * 5)),
    }));
  };

  const handleSolveDebugTicket = (ticketId: string) => {
    setProgress((prev) => {
      if (prev.solvedDebugIds.includes(ticketId)) return prev;
      return {
        ...prev,
        solvedDebugIds: [...prev.solvedDebugIds, ticketId],
      };
    });
  };

  const handleImportProgress = (payload: TransferPayload) => {
    setProgress((prev) => ({
      ...prev,
      learnerName: payload.name,
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
      darkMode: prev.darkMode,
      readableMode: prev.readableMode,
      projectionMode: prev.projectionMode,
      speechRate: prev.speechRate,
    }));
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#F7F9FC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors ${
        progress.readableMode ? 'readable-mode' : ''
      } ${progress.projectionMode ? 'projection-mode' : ''}`}
    >
      <Header
        activeRoute={route}
        onNavigate={handleNavigate}
        nextIslandId={nextIslandId}
        onOpenIsland={handleOpenIsland}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        {route === 'archipel' && (
          <ArchipelagoView
            completedIslands={progress.completedIslands}
            starsByIsland={progress.starsByIsland}
            solvedDebugCount={progress.solvedDebugIds.length}
            bestExamScore={progress.bestExamScore}
            passedExamsCount={progress.passedExamsCount}
            ddosWon={progress.ddosWon}
            terminalCompleted={progress.terminalCompleted}
            crisisContained={progress.crisisContained}
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
            onResetProgress={handleResetProgress}
          />
        )}

        {route === 'island' && (
          <IslandLessonView
            island={activeIsland}
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
              setProgress((p) => ({ ...p, ddosWon: true }));
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
          />
        )}

        {route === 'debug' && (
          <DebugExpressView
            completedIslands={progress.completedIslands}
            solvedDebugIds={progress.solvedDebugIds}
            onSolveDebugTicket={handleSolveDebugTicket}
          />
        )}

        {route === 'storyboards' && <StoryboardsView />}

        {route === 'quiz' && (
          <QuizAndSheetsView
            initialSection={quizInitialSection}
            bestExamScore={progress.bestExamScore}
            onAwardQuizXp={handleAwardQuizXp}
            onAwardCaseXp={(xp) => handleAddExtraXp(xp)}
            onFinishExam={handleFinishExam}
            onOpenIsland={handleOpenIsland}
          />
        )}
      </main>

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
          </div>
        </div>
      </footer>
    </div>
  );
}
