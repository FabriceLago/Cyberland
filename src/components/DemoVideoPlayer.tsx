import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Cloud,
  Download,
  Flag,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Star,
  Subtitles,
  Terminal,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  DEMO_CHAPTERS,
  DemoChapter,
  formatTimecode,
  getChapterAtTime,
  TOTAL_DEMO_DURATION_SEC,
} from '../data/demoVideoData';
import { AppRoute } from './Header';
import { EASE_SWISS } from './MotionPrimitives';
import { playClick, playSuccess } from '../utils/sound';

interface DemoVideoPlayerProps {
  onNavigate?: (route: AppRoute) => void;
  onOpenIsland?: (islandId: number) => void;
  onCloseModal?: () => void;
  autoPlay?: boolean;
}

const SPEEDS = [1, 1.25, 1.5] as const;

export const DemoVideoPlayer: React.FC<DemoVideoPlayerProps> = ({
  onNavigate,
  onOpenIsland,
  onCloseModal,
  autoPlay = false,
}) => {
  const [currentSec, setCurrentSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);

  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const spokenChapterIdRef = useRef<string | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const activeChapter = useMemo(() => getChapterAtTime(currentSec), [currentSec]);
  const chapterElapsed = Math.max(0, currentSec - activeChapter.startSec);
  const chapterProgress = Math.min(1, chapterElapsed / activeChapter.durationSec);

  const activeCaption = useMemo(() => {
    let text = activeChapter.captions[0]?.text ?? '';
    for (const cue of activeChapter.captions) {
      if (chapterElapsed >= cue.offsetSec) {
        text = cue.text;
      }
    }
    return text;
  }, [activeChapter, chapterElapsed]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speakChapter = useCallback(
    (chapter: DemoChapter, rate: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(chapter.narration);
      utterance.lang = 'fr-FR';
      utterance.rate = rate;
      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find((v) => v.lang.toLowerCase().startsWith('fr'));
      if (frVoice) {
        utterance.voice = frVoice;
      }
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  // Playback timer driving the exact 00:00 -> 05:00 timeline
  useEffect(() => {
    if (!isPlaying) {
      lastTickRef.current = null;
      return;
    }

    lastTickRef.current = performance.now();
    const intervalId = window.setInterval(() => {
      const now = performance.now();
      const prev = lastTickRef.current ?? now;
      lastTickRef.current = now;
      const deltaSec = ((now - prev) / 1000) * speed;

      setCurrentSec((curr) => {
        const next = curr + deltaSec;
        if (next >= TOTAL_DEMO_DURATION_SEC) {
          setIsPlaying(false);
          return TOTAL_DEMO_DURATION_SEC;
        }
        return next;
      });
    }, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, speed]);

  // Synchronized French voice-over when entering a chapter while playing
  useEffect(() => {
    if (!isPlaying || !voiceEnabled) {
      stopSpeech();
      spokenChapterIdRef.current = null;
      return;
    }

    if (spokenChapterIdRef.current !== activeChapter.id) {
      spokenChapterIdRef.current = activeChapter.id;
      speakChapter(activeChapter, speed);
    }
  }, [activeChapter, isPlaying, voiceEnabled, speed, speakChapter, stopSpeech]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  // Listen to fullscreen exit
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleTogglePlay = () => {
    playClick();
    if (currentSec >= TOTAL_DEMO_DURATION_SEC) {
      setCurrentSec(0);
      spokenChapterIdRef.current = null;
      setIsPlaying(true);
      return;
    }
    setIsPlaying((p) => !p);
  };

  const handleJumpToChapter = (chapter: DemoChapter) => {
    playClick();
    spokenChapterIdRef.current = null;
    setCurrentSec(chapter.startSec);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  const handlePrevChapter = () => {
    const prevIdx = Math.max(0, activeChapter.index - 2);
    handleJumpToChapter(DEMO_CHAPTERS[prevIdx]);
  };

  const handleNextChapter = () => {
    const nextIdx = Math.min(DEMO_CHAPTERS.length - 1, activeChapter.index);
    handleJumpToChapter(DEMO_CHAPTERS[nextIdx]);
  };

  const handleRestart = () => {
    playClick();
    spokenChapterIdRef.current = null;
    setCurrentSec(0);
    setIsPlaying(true);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    spokenChapterIdRef.current = null;
    setCurrentSec(val);
  };

  const handleToggleFullscreen = async () => {
    playClick();
    const el = stageContainerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen restrictions in embedded iframes
    }
  };

  const handleDownloadScript = () => {
    playSuccess();
    const lines = [
      '# Vidéo Démo Cyberland — Fonctionnement & Utilisation (05:00)',
      '',
      'Durée totale : 05:00 (300 secondes) · 8 chapitres chronométrés',
      '',
      ...DEMO_CHAPTERS.flatMap((ch) => [
        `## ${ch.index}. ${ch.title} (${ch.timecodeLabel})`,
        '',
        `**Voix off :**`,
        `« ${ch.narration} »`,
        '',
        '**Points montrés à l’écran :**',
        ...ch.highlights.map((h) => `- ${h}`),
        '',
      ]),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cyberland-video-demo-5min-script.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setScriptCopied(true);
    window.setTimeout(() => setScriptCopied(false), 2500);
  };

  const handleTryChapterFeature = () => {
    playClick();
    stopSpeech();
    setIsPlaying(false);
    if (activeChapter.targetRoute === 'island' && activeChapter.targetIslandId && onOpenIsland) {
      onOpenIsland(activeChapter.targetIslandId);
    } else if (onNavigate) {
      onNavigate(activeChapter.targetRoute);
    }
    onCloseModal?.();
  };

  const progressPct = (currentSec / TOTAL_DEMO_DURATION_SEC) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-cyan-500/25 bg-white dark:bg-slate-900 overflow-hidden shadow-xl">
      {/* Top Bar */}
      <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#070D19] border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-700 dark:bg-cyan-500/20 border border-sky-600 dark:border-cyan-400/40 text-white dark:text-cyan-300 flex items-center justify-center shrink-0">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              Démo Vidéo Interactive · Fonctionnement &amp; Utilisation (05:00)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              8 chapitres animés avec voix off française synchronisée, sous-titres et accès direct aux outils
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadScript}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
          >
            {scriptCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Download className="w-3.5 h-3.5" />}
            {scriptCopied ? 'Script téléchargé' : 'Script 5 min (.md)'}
          </button>
          {onCloseModal && (
            <button
              type="button"
              onClick={() => {
                stopSpeech();
                setIsPlaying(false);
                onCloseModal();
              }}
              aria-label="Fermer la vidéo démo"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Split: 16:9 Stage (Left 8 cols) + Chapter Guide (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Broadcast Stage + Scrubber + Transport Controls */}
        <div ref={stageContainerRef} className="lg:col-span-8 bg-[#060B16] flex flex-col">
          {/* 16:9 Animated Screen */}
          <div className="relative aspect-video w-full overflow-hidden bg-[#070E1D] select-none">
            {/* Subtle SOC Grid Backdrop */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(56,189,248,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.09) 1px, transparent 1px)',
                backgroundSize: '36px 36px',
              }}
            />

            {/* Top HUD inside Video Frame */}
            <div className="relative z-10 px-4 sm:px-6 pt-3.5 pb-2 flex items-center justify-between text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-2 min-w-0">
                <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-bold text-white">CYBERLAND DÉMO</span>
                <span className="text-slate-500" aria-hidden="true">
                  ·
                </span>
                <span className="text-cyan-300 truncate">
                  Chapitre {activeChapter.index}/8 — {activeChapter.shortLabel}
                </span>
              </div>
              <span className="tabular-nums text-slate-400 shrink-0">
                {formatTimecode(currentSec)} / 05:00
              </span>
            </div>

            {/* Animated Scene Content */}
            <div className="relative z-10 px-4 sm:px-8 pb-16 pt-2 h-[calc(100%-44px)] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeChapter.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: EASE_SWISS }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <DemoAnimatedScene
                    chapterId={activeChapter.id}
                    chapterProgress={chapterProgress}
                    isPlaying={isPlaying}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Click-to-Play Overlay when paused at 00:00 */}
            {!isPlaying && currentSec === 0 && (
              <button
                type="button"
                onClick={handleTogglePlay}
                className="absolute inset-0 z-20 bg-slate-950/50 hover:bg-slate-950/35 transition-colors flex flex-col items-center justify-center gap-3 group"
              >
                <span className="w-16 h-16 rounded-full bg-cyan-400 group-hover:scale-105 transition-transform text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                </span>
                <span className="text-sm font-bold text-white">
                  Lancer la démo complète (05:00)
                </span>
                <span className="text-xs text-slate-300">
                  Narration française synchronisée + schémas interactifs
                </span>
              </button>
            )}

            {/* Synchronized Subtitles Overlay */}
            {showCaptions && (
              <div className="absolute inset-x-4 sm:inset-x-10 bottom-3 z-20 pointer-events-none flex justify-center">
                <div className="px-4 py-2 rounded-lg bg-slate-950/88 border border-slate-700/70 text-center max-w-2xl shadow-lg">
                  <p className="text-xs sm:text-sm text-slate-100 leading-snug font-medium">
                    {activeCaption}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Timeline Scrubber with Chapter Markers */}
          <div className="px-4 pt-3 pb-1 bg-[#091020] border-t border-slate-800/90 space-y-1.5">
            <div className="relative h-5 flex items-center">
              {/* Background Track */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
                <div
                  className="h-full bg-cyan-400 transition-[width] duration-100"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Chapter Divider Ticks */}
              {DEMO_CHAPTERS.slice(1).map((ch) => (
                <span
                  key={ch.id}
                  aria-hidden="true"
                  style={{ left: `${(ch.startSec / TOTAL_DEMO_DURATION_SEC) * 100}%` }}
                  className="absolute top-1.5 bottom-1.5 w-0.5 bg-slate-950/90 pointer-events-none"
                />
              ))}

              {/* Accessible Range Input */}
              <input
                type="range"
                min={0}
                max={TOTAL_DEMO_DURATION_SEC}
                step={0.5}
                value={currentSec}
                onChange={handleScrub}
                aria-label="Position dans la vidéo démo de 5 minutes"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Video Transport Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  aria-label={isPlaying ? 'Mettre en pause' : 'Lire la démo'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-colors"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  {isPlaying ? 'Pause' : currentSec >= TOTAL_DEMO_DURATION_SEC ? 'Revoir' : 'Lire'}
                </button>
                <button
                  type="button"
                  onClick={handlePrevChapter}
                  title="Chapitre précédent"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextChapter}
                  title="Chapitre suivant"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  title="Recommencer à 00:00"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono tabular-nums text-slate-300 pl-1">
                  {formatTimecode(currentSec)} / 05:00
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setVoiceEnabled((v) => !v);
                  }}
                  title={voiceEnabled ? 'Couper la voix off' : 'Activer la voix off'}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors ${
                    voiceEnabled
                      ? 'bg-slate-800 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Voix off</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setShowCaptions((c) => !c);
                  }}
                  title="Afficher ou masquer les sous-titres"
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors ${
                    showCaptions
                      ? 'bg-slate-800 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <Subtitles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CC</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    const nextIdx = (SPEEDS.indexOf(speed) + 1) % SPEEDS.length;
                    setSpeed(SPEEDS[nextIdx]);
                    spokenChapterIdRef.current = null;
                  }}
                  title="Vitesse de lecture"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 font-mono font-semibold text-slate-200 tabular-nums transition-colors"
                >
                  {speed}x
                </button>

                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  title="Plein écran"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 8-Chapter Playlist & Active Takeaways */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                Sommaire de la démo (05:00)
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                {activeChapter.index} / {DEMO_CHAPTERS.length}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[260px] lg:max-h-[290px] overflow-y-auto pr-1">
              {DEMO_CHAPTERS.map((ch) => {
                const isCurrent = ch.id === activeChapter.id;
                const isPast = currentSec >= ch.startSec + ch.durationSec;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleJumpToChapter(ch)}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors flex items-center justify-between gap-2 ${
                      isCurrent
                        ? 'bg-sky-50 dark:bg-cyan-950/50 border-sky-500 dark:border-cyan-500/60 text-sky-950 dark:text-cyan-100'
                        : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span
                        className={`font-mono text-[11px] font-bold tabular-nums shrink-0 ${
                          isPast
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isCurrent
                              ? 'text-sky-700 dark:text-cyan-300'
                              : 'text-slate-400'
                        }`}
                      >
                        {isPast ? '✓' : String(ch.index).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-semibold truncate">{ch.shortLabel}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                      {formatTimecode(ch.startSec)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Chapter Details & Direct Action */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 space-y-3">
            <div>
              <div className="text-[11px] font-mono font-semibold text-sky-700 dark:text-cyan-400">
                {activeChapter.timecodeLabel} · Chapitre {activeChapter.index}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {activeChapter.title}
              </h3>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {activeChapter.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {(onNavigate || onOpenIsland) && (
              <button
                type="button"
                onClick={handleTryChapterFeature}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-bold transition-colors"
              >
                {activeChapter.actionLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface DemoAnimatedSceneProps {
  chapterId: string;
  chapterProgress: number;
  isPlaying: boolean;
}

const DemoAnimatedScene: React.FC<DemoAnimatedSceneProps> = ({
  chapterId,
  chapterProgress,
  isPlaying,
}) => {
  // Scene 1: Welcome, Personalization & Pace
  if (chapterId === 'welcome') {
    const activePaceIdx = chapterProgress < 0.35 ? 0 : chapterProgress < 0.7 ? 1 : 2;
    const paces = [
      { label: 'Tranquille', time: '10 min / jour' },
      { label: 'Régulier', time: '20 min / jour' },
      { label: 'Prépa entretien', time: '45 min / jour' },
    ];
    return (
      <div className="w-full max-w-xl space-y-4">
        <div className="rounded-xl border border-cyan-500/30 bg-slate-900/90 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-cyan-300 font-semibold">Bonjour, ravi de vous retrouver</span>
            <span className="font-mono text-slate-400">Profil actif</span>
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-white">
            L&apos;Archipel de Cyberland
          </div>
          <div className="grid grid-cols-3 gap-2">
            {paces.map((p, idx) => (
              <motion.div
                key={p.label}
                animate={{
                  scale: activePaceIdx === idx ? 1.03 : 1,
                  borderColor: activePaceIdx === idx ? 'rgb(34 211 238)' : 'rgb(30 41 59)',
                }}
                className={`rounded-lg border p-2.5 ${
                  activePaceIdx === idx ? 'bg-cyan-500/15' : 'bg-slate-950/60'
                }`}
              >
                <div className="text-xs font-bold text-white">{p.label}</div>
                <div className="text-[11px] font-mono text-slate-400">{p.time}</div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5 text-center">
          {[
            { label: 'Étapes', val: '22 modules' },
            { label: 'Laboratoires', val: '30 ateliers' },
            { label: 'Succès', val: '12 médailles' },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-lg border border-slate-800 bg-slate-900/80 p-2.5">
              <div className="text-[11px] text-slate-400">{kpi.label}</div>
              <div className="text-sm font-mono font-bold text-cyan-300 mt-0.5">{kpi.val}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Scene 2: 5-Phase Analyst Roadmap
  if (chapterId === 'analyst-roadmap') {
    const activePhase = Math.min(4, Math.floor(chapterProgress * 5));
    const phases = [
      { n: '01', name: 'Fondations Réseau', detail: 'Paquets, OSI, IPv4/IPv6, TCP/UDP' },
      { n: '02', name: 'Systèmes & Identité', detail: 'VLAN 802.1Q, VPN, Linux DMZ, AD' },
      { n: '03', name: 'Crypto, Menaces & API', detail: 'TLS, Phishing/Zero Trust, OAuth2/JWT' },
      { n: '04', name: 'Cloud & Conteneurs', detail: 'IaaS/PaaS/SaaS, Docker, K8s, CI/CD' },
      { n: '05', name: 'Investigation & SOC', detail: 'Wireshark, Azure KQL, SIEM/SOAR' },
    ];
    return (
      <div className="w-full max-w-xl space-y-2.5">
        {phases.map((p, idx) => {
          const lit = idx <= activePhase;
          const current = idx === activePhase;
          return (
            <motion.div
              key={p.n}
              animate={{
                opacity: lit ? 1 : 0.45,
                x: current ? 6 : 0,
              }}
              transition={{ duration: 0.25 }}
              className={`rounded-lg border px-3.5 py-2 flex items-center justify-between gap-3 ${
                current
                  ? 'bg-cyan-500/15 border-cyan-400/70'
                  : lit
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`font-mono text-xs font-bold ${
                    current ? 'text-cyan-300' : lit ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  PALIER {p.n}
                </span>
                <span className="text-xs sm:text-sm font-bold text-white truncate">{p.name}</span>
              </div>
              <span className="text-[11px] text-slate-300 hidden sm:inline truncate">
                {p.detail}
              </span>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Scene 3: Lesson 3-Step Flow (Animation -> Practice -> Notions)
  if (chapterId === 'lesson-flow') {
    const activeTab = chapterProgress < 0.34 ? 0 : chapterProgress < 0.68 ? 1 : 2;
    const tabs = ['1. Animation commentée', '2. Atelier pratique', '3. Notions clés'];
    return (
      <div className="w-full max-w-xl rounded-xl border border-slate-700/80 bg-slate-900/90 p-4 space-y-4">
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800">
          {tabs.map((t, idx) => (
            <div
              key={t}
              className={`text-center py-1.5 px-2 rounded-md text-[11px] font-semibold transition-colors ${
                activeTab === idx
                  ? 'bg-cyan-400 text-slate-950 font-bold'
                  : 'text-slate-400'
              }`}
            >
              {t}
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-[#070D19] border border-slate-800 p-4 min-h-[120px] flex flex-col items-center justify-center gap-3">
          {activeTab === 0 && (
            <div className="w-full flex items-center justify-between px-4">
              <div className="px-3 py-2 rounded-lg bg-slate-800 border border-cyan-500/40 text-xs font-mono text-white">
                Source
              </div>
              <div className="flex-1 mx-3 relative h-1 bg-slate-800 rounded-full overflow-hidden">
                {isPlaying && (
                  <motion.div
                    className="absolute top-0 bottom-0 w-10 bg-cyan-400 rounded-full"
                    animate={{ left: ['-15%', '100%'] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
              <div className="px-3 py-2 rounded-lg bg-slate-800 border border-emerald-500/40 text-xs font-mono text-emerald-300">
                4 Paquets OK
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-amber-400">
                {[0, 1, 2].map((s) => (
                  <motion.span
                    key={s}
                    initial={{ scale: 0.6, opacity: 0.3 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: s * 0.15 }}
                  >
                    <Star className="w-6 h-6 fill-amber-400" />
                  </motion.span>
                ))}
              </div>
              <div className="text-sm font-bold text-white">Atelier réussi · 3/3 étoiles</div>
              <div className="text-xs font-mono text-emerald-400">+150 XP ajoutés au profil</div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="w-full grid grid-cols-3 gap-2 text-center text-xs">
              {['Découpage TCP', 'Routage IP', 'Résilience'].map((n) => (
                <div
                  key={n}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-semibold"
                >
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Scene 4: Live SOC Telemetry (Nominal -> DDoS -> WAF Mitigation)
  if (chapterId === 'soc-telemetry') {
    const phase = chapterProgress < 0.32 ? 'nominal' : chapterProgress < 0.68 ? 'ddos' : 'mitigated';
    const isDdos = phase === 'ddos';
    const isMitigated = phase === 'mitigated';
    return (
      <div className="w-full max-w-xl rounded-xl border border-cyan-500/30 bg-slate-950 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-bold text-white">
            {isDdos ? (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            ) : isMitigated ? (
              <Zap className="w-4 h-4 text-cyan-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            {isDdos
              ? 'Simulation SYN Flood (DDoS)'
              : isMitigated
                ? 'Mitigation WAF Active'
                : 'Flux DMZ Nominal'}
          </span>
          <span
            className={`font-mono font-bold ${
              isDdos ? 'text-rose-400' : isMitigated ? 'text-cyan-300' : 'text-emerald-400'
            }`}
          >
            {isDdos ? '8,40 Gbps · Santé 64%' : isMitigated ? '4,15 Gbps · Santé 99,4%' : '1,40 Gbps · Santé 99,8%'}
          </span>
        </div>

        <svg viewBox="0 0 420 110" className="w-full h-28 rounded-lg bg-[#070D19] border border-slate-800">
          <line x1="88" y1="55" x2="176" y2="55" stroke={isDdos ? '#FB7185' : '#38BDF8'} strokeWidth="2.5" strokeDasharray="5 5" />
          <line x1="252" y1="55" x2="332" y2="55" stroke={isDdos ? '#FB7185' : '#34D399'} strokeWidth="2.5" strokeDasharray="5 5" />
          <rect x="16" y="33" width="72" height="44" rx="8" fill="#0F172A" stroke={isDdos ? '#F43F5E' : '#38BDF8'} />
          <text x="52" y="59" textAnchor="middle" className="fill-white text-[10px] font-bold">INTERNET</text>
          <rect x="176" y="25" width="76" height="60" rx="8" fill={isDdos ? '#2A0F18' : '#082A36'} stroke={isDdos ? '#F43F5E' : '#22D3EE'} strokeWidth="2" />
          <text x="214" y="52" textAnchor="middle" className="fill-white text-[10px] font-bold">FW-01 WAF</text>
          <text x="214" y="68" textAnchor="middle" className={`text-[9px] font-mono ${isDdos ? 'fill-rose-300' : 'fill-cyan-300'}`}>
            {isDdos ? 'SURCHARGE' : isMitigated ? 'SYN COOKIES' : 'ACL OK'}
          </text>
          <rect x="332" y="33" width="72" height="44" rx="8" fill="#0F172A" stroke="#34D399" />
          <text x="368" y="59" textAnchor="middle" className="fill-white text-[10px] font-bold">DMZ / DB</text>
        </svg>
      </div>
    );
  }

  // Scene 5: 30 Labs Hub
  if (chapterId === 'labs-hub') {
    const activeCard = chapterProgress < 0.34 ? 0 : chapterProgress < 0.67 ? 1 : 2;
    const cards = [
      { icon: Terminal, title: 'CyberShell CLI', desc: 'Linux, PowerShell, ping, ss, tcpdump' },
      { icon: Flag, title: 'CTF Guidé & Survie SOC', desc: '5 drapeaux techniques & triage live' },
      { icon: Zap, title: 'Auditeurs & Speedrun', desc: 'JWT/TLS, Docker & boost ×2 XP' },
    ];
    return (
      <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          const highlighted = idx === activeCard;
          return (
            <motion.div
              key={c.title}
              animate={{ scale: highlighted ? 1.04 : 0.98, opacity: highlighted ? 1 : 0.7 }}
              className={`rounded-xl border p-4 space-y-2.5 ${
                highlighted
                  ? 'bg-cyan-500/15 border-cyan-400 text-white'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}
            >
              <Icon className="w-6 h-6 text-cyan-300" />
              <div className="text-sm font-bold text-white">{c.title}</div>
              <p className="text-xs text-slate-300 leading-relaxed">{c.desc}</p>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Scene 6: Debug Express & Timed Exam
  if (chapterId === 'debug-exam') {
    const showExam = chapterProgress >= 0.5;
    return (
      <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900/90 p-5">
        {!showExam ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-300">
                <Wrench className="w-4 h-4" />
                Ticket Debug Express #04
              </span>
              <span className="font-mono text-emerald-400">Incident résolu ✓</span>
            </div>
            <p className="text-sm font-semibold text-white">
              Le site répond par IP mais échoue sur son nom de domaine.
            </p>
            <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-3 py-2 text-xs text-emerald-200">
              Diagnostic validé : enregistrement DNS A manquant ou serveur résolveur bloqué (port 53).
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2.5">
            <div className="text-xs font-mono text-cyan-300">EXAMEN BLANC CHRONOMÉTRÉ</div>
            <div className="text-4xl font-mono font-black text-white tabular-nums">18 / 20</div>
            <div className="text-xs font-semibold text-emerald-400">
              Mention Très Bien · Compétences validées pour le diplôme
            </div>
          </div>
        )}
      </div>
    );
  }

  // Scene 7: Achievements, Cloud Sync & Diploma
  if (chapterId === 'profile-cloud') {
    const medals = ['Premier pas', 'Expert Réseau', 'Cyber-Détective'];
    return (
      <div className="w-full max-w-xl space-y-3">
        <div className="grid grid-cols-3 gap-2.5">
          {medals.map((m, idx) => (
            <motion.div
              key={m}
              initial={{ opacity: 0.4, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.12 }}
              className="rounded-xl border border-amber-400/50 bg-amber-500/10 p-3 text-center space-y-1.5"
            >
              <Award className="w-6 h-6 text-amber-300 mx-auto" />
              <div className="text-xs font-bold text-white">{m}</div>
              <div className="text-[10px] font-mono text-amber-300">Débloqué ✓</div>
            </motion.div>
          ))}
        </div>
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-2 text-emerald-200 font-semibold">
            <Cloud className="w-4 h-4 text-emerald-400" />
            Sauvegarde Google Cloud active
          </span>
          <span className="font-mono text-slate-300">Diplôme SVG / PDF prêt</span>
        </div>
      </div>
    );
  }

  // Scene 8: 3-Click Quickstart Plan
  const stepDone = chapterProgress < 0.33 ? 1 : chapterProgress < 0.66 ? 2 : 3;
  const steps = [
    '1. Indiquez votre prénom et votre rythme sur l’accueil',
    '2. Lancez l’Étape 1 du Palier 1 pour obtenir « Premier pas »',
    '3. Alternez un module et un atelier SOC pour ancrer vos réflexes',
  ];
  return (
    <div className="w-full max-w-xl rounded-xl border border-cyan-500/40 bg-slate-900/90 p-5 space-y-3">
      <div className="text-xs font-mono font-bold text-cyan-300">VOTRE PLAN D&apos;ACTION</div>
      <div className="space-y-2">
        {steps.map((s, idx) => {
          const active = idx < stepDone;
          return (
            <div
              key={s}
              className={`rounded-lg border px-3.5 py-2.5 flex items-center gap-2.5 text-xs sm:text-sm transition-colors ${
                active
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-white font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-400' : 'text-slate-600'}`}
              />
              <span>{s}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
  onOpenIsland: (islandId: number) => void;
}

export const DemoVideoModal: React.FC<DemoVideoModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenIsland,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vidéo démo interactive Cyberland de 5 minutes"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-6xl my-auto">
        <DemoVideoPlayer
          autoPlay
          onNavigate={onNavigate}
          onOpenIsland={onOpenIsland}
          onCloseModal={onClose}
        />
      </div>
    </div>
  );
};
