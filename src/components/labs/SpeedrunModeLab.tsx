import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Gauge,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Timer,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import { CyberAttackId } from '../../data/cyberAttackSimulations';
import { LiveAttackLab } from './LiveAttackLab';
import { AntiDdosGame } from './AntiDdosGame';
import { SqlInjectionLab } from './SqlInjectionLab';
import { playClick, playSuccess, playVictory } from '../../utils/sound';

export type SpeedrunStepId = CyberAttackId | 'ddos' | 'sqli';

export interface SpeedrunCircuit {
  id: string;
  title: string;
  subtitle: string;
  difficulty: 'Rapide' | 'Intermédiaire' | 'Expert';
  steps: {
    id: SpeedrunStepId;
    label: string;
    objective: string;
  }[];
  tiers: {
    goldMaxSec: number;
    goldMultiplier: number;
    goldMinutes: number;
    goldBonusXp: number;
    silverMaxSec: number;
    silverMultiplier: number;
    silverMinutes: number;
    silverBonusXp: number;
    bronzeMultiplier: number;
    bronzeMinutes: number;
    bronzeBonusXp: number;
  };
}

export const SPEEDRUN_CIRCUITS: SpeedrunCircuit[] = [
  {
    id: 'web-sprint',
    title: 'Sprint Web & Identité',
    subtitle: 'Neutralisez 4 attaques applicatives et identitaires à la suite.',
    difficulty: 'Rapide',
    steps: [
      { id: 'xss', label: 'XSS & Cookie', objective: 'Activez les 3 parades XSS' },
      { id: 'bruteforce', label: 'Force Brute', objective: 'Activez Rate Limit, MFA et Argon2id' },
      { id: 'csrf', label: 'Attaque CSRF', objective: 'Activez Jeton CSRF, SameSite et Origin' },
      {
        id: 'sqli',
        label: 'Injection SQL',
        objective: 'Activez les Requêtes Préparées puis exécutez le payload SQLi',
      },
    ],
    tiers: {
      goldMaxSec: 45,
      goldMultiplier: 2.0,
      goldMinutes: 15,
      goldBonusXp: 120,
      silverMaxSec: 80,
      silverMultiplier: 1.5,
      silverMinutes: 12,
      silverBonusXp: 80,
      bronzeMultiplier: 1.25,
      bronzeMinutes: 10,
      bronzeBonusXp: 50,
    },
  },
  {
    id: 'net-cloud-sprint',
    title: 'Sprint Réseau & Cloud',
    subtitle: 'Défendez le LAN, le DNS, le Cloud VPC et absorbez un DDoS en direct.',
    difficulty: 'Intermédiaire',
    steps: [
      { id: 'mitm', label: 'MitM / ARP', objective: 'Activez TLS 1.3, VPN et DAI' },
      { id: 'dns', label: 'DNS Spoofing', objective: 'Activez DNSSEC, DoH et Randomisation' },
      { id: 'ssrf', label: 'SSRF Cloud', objective: 'Activez Liste blanche, IMDSv2 et Egress' },
      {
        id: 'ddos',
        label: 'DDoS (Live)',
        objective: 'Activez les défenses adaptées (WAF + Rate Limit + CDN) pour stabiliser le serveur',
      },
    ],
    tiers: {
      goldMaxSec: 55,
      goldMultiplier: 2.0,
      goldMinutes: 15,
      goldBonusXp: 140,
      silverMaxSec: 95,
      silverMultiplier: 1.5,
      silverMinutes: 12,
      silverBonusXp: 90,
      bronzeMultiplier: 1.25,
      bronzeMinutes: 10,
      bronzeBonusXp: 60,
    },
  },
  {
    id: 'soc-marathon',
    title: 'Marathon SOC Intégral',
    subtitle: '6 incidents majeurs d’affilée pour décrocher le multiplicateur maximal ×2.5 XP.',
    difficulty: 'Expert',
    steps: [
      { id: 'xss', label: 'XSS & Cookie', objective: 'Neutralisez la fuite de cookie' },
      { id: 'phishing', label: 'Phishing / AiTM', objective: 'Déployez DMARC, FIDO2 et Filtre URL' },
      { id: 'ransomware', label: 'Ransomware', objective: 'Isolez EDR, coupez SMB et restaurez 3-2-1' },
      { id: 'mitm', label: 'MitM / ARP', objective: 'Chiffrez TLS/VPN et activez DAI' },
      { id: 'dns', label: 'DNS Spoofing', objective: 'Activez DNSSEC, DoH et Randomisation' },
      { id: 'ddos', label: 'DDoS (Live)', objective: 'Mitigez l’attaque DDoS en direct' },
    ],
    tiers: {
      goldMaxSec: 85,
      goldMultiplier: 2.5,
      goldMinutes: 20,
      goldBonusXp: 220,
      silverMaxSec: 135,
      silverMultiplier: 1.75,
      silverMinutes: 15,
      silverBonusXp: 150,
      bronzeMultiplier: 1.35,
      bronzeMinutes: 12,
      bronzeBonusXp: 100,
    },
  },
];

export interface SpeedrunCompletionResult {
  circuitId: string;
  durationMs: number;
  rank: 'Or' | 'Argent' | 'Bronze';
  multiplier: number;
  durationMinutes: number;
  instantBonusXp: number;
}

interface SpeedrunModeLabProps {
  bestSpeedrunByCircuit: Record<string, number>;
  xpBoostMultiplier: number;
  xpBoostRemainingSec: number;
  onCompleteSpeedrun: (result: SpeedrunCompletionResult) => void;
}

function formatChrono(ms: number): string {
  const totalTenths = Math.floor(ms / 100);
  const tenths = totalTenths % 10;
  const totalSec = Math.floor(totalTenths / 10);
  const secs = totalSec % 60;
  const mins = Math.floor(totalSec / 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const SpeedrunModeLab: React.FC<SpeedrunModeLabProps> = ({
  bestSpeedrunByCircuit,
  xpBoostMultiplier,
  xpBoostRemainingSec,
  onCompleteSpeedrun,
}) => {
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>(SPEEDRUN_CIRCUITS[0].id);
  const [status, setStatus] = useState<'lobby' | 'running' | 'finished'>('lobby');
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [splitsMs, setSplitsMs] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<SpeedrunCompletionResult | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [splitBanner, setSplitBanner] = useState<string | null>(null);
  const [runNonce, setRunNonce] = useState(1);

  const startTimeRef = useRef<number>(0);
  const lastSplitTimeRef = useRef<number>(0);
  const stepHandledRef = useRef<number>(-1);

  const circuit = useMemo(
    () => SPEEDRUN_CIRCUITS.find((c) => c.id === selectedCircuitId) ?? SPEEDRUN_CIRCUITS[0],
    [selectedCircuitId]
  );

  // High-precision 100ms live stopwatch while running
  useEffect(() => {
    if (status !== 'running') return;
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);
    return () => window.clearInterval(id);
  }, [status]);

  const startRun = (circuitIdToStart?: string) => {
    playClick();
    if (circuitIdToStart) {
      setSelectedCircuitId(circuitIdToStart);
    }
    const now = Date.now();
    startTimeRef.current = now;
    lastSplitTimeRef.current = now;
    stepHandledRef.current = -1;
    setCurrentStepIdx(0);
    setElapsedMs(0);
    setSplitsMs([]);
    setLastResult(null);
    setIsNewRecord(false);
    setSplitBanner(null);
    setRunNonce((n) => n + 1);
    setStatus('running');
  };

  const abortRun = () => {
    playClick();
    setStatus('lobby');
    setSplitBanner(null);
  };

  const handleCurrentLabSolved = () => {
    if (status !== 'running') return;
    if (stepHandledRef.current === currentStepIdx) return;
    stepHandledRef.current = currentStepIdx;

    const now = Date.now();
    const totalMs = now - startTimeRef.current;
    const splitDelta = now - lastSplitTimeRef.current;
    lastSplitTimeRef.current = now;

    const nextSplits = [...splitsMs, splitDelta];
    setSplitsMs(nextSplits);
    setElapsedMs(totalMs);

    const completedStep = circuit.steps[currentStepIdx];

    if (currentStepIdx >= circuit.steps.length - 1) {
      // Circuit finished!
      const totalSec = totalMs / 1000;
      const { tiers } = circuit;
      let rank: 'Or' | 'Argent' | 'Bronze' = 'Bronze';
      let multiplier = tiers.bronzeMultiplier;
      let durationMinutes = tiers.bronzeMinutes;
      let instantBonusXp = tiers.bronzeBonusXp;

      if (totalSec <= tiers.goldMaxSec) {
        rank = 'Or';
        multiplier = tiers.goldMultiplier;
        durationMinutes = tiers.goldMinutes;
        instantBonusXp = tiers.goldBonusXp;
      } else if (totalSec <= tiers.silverMaxSec) {
        rank = 'Argent';
        multiplier = tiers.silverMultiplier;
        durationMinutes = tiers.silverMinutes;
        instantBonusXp = tiers.silverBonusXp;
      }

      const prevBest = bestSpeedrunByCircuit[circuit.id];
      const beatRecord = typeof prevBest !== 'number' || totalMs < prevBest;
      setIsNewRecord(beatRecord);

      const res: SpeedrunCompletionResult = {
        circuitId: circuit.id,
        durationMs: totalMs,
        rank,
        multiplier,
        durationMinutes,
        instantBonusXp,
      };
      setLastResult(res);
      setStatus('finished');
      playVictory();
      onCompleteSpeedrun(res);
    } else {
      playSuccess();
      setSplitBanner(`${completedStep.label} validé en ${(splitDelta / 1000).toFixed(1)} s !`);
      window.setTimeout(() => {
        setCurrentStepIdx((idx) => idx + 1);
      }, 380);
    }
  };

  // Current live medal pace while running
  const elapsedSec = elapsedMs / 1000;
  const livePace =
    elapsedSec <= circuit.tiers.goldMaxSec
      ? {
          rank: 'Or',
          mult: circuit.tiers.goldMultiplier,
          remaining: Math.max(0, circuit.tiers.goldMaxSec - elapsedSec),
          color: 'text-amber-600 dark:text-amber-400',
        }
      : elapsedSec <= circuit.tiers.silverMaxSec
        ? {
            rank: 'Argent',
            mult: circuit.tiers.silverMultiplier,
            remaining: Math.max(0, circuit.tiers.silverMaxSec - elapsedSec),
            color: 'text-slate-600 dark:text-slate-300',
          }
        : {
            rank: 'Bronze',
            mult: circuit.tiers.bronzeMultiplier,
            remaining: 0,
            color: 'text-orange-700 dark:text-orange-400',
          };

  const currentStep = circuit.steps[currentStepIdx];

  return (
    <div className="space-y-6">
      {/* Active Temporary XP Multiplier Status Strip */}
      {xpBoostRemainingSec > 0 && xpBoostMultiplier > 1 && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-600/60 bg-amber-50 dark:bg-amber-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base text-amber-950 dark:text-amber-200">
                Multiplicateur Speedrun actif : ×{xpBoostMultiplier.toFixed(2).replace(/\.00$/, '.0')} XP sur tout Cyberland !
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300/90">
                Toutes vos récompenses d’îles, quiz, tickets Debug et laboratoires sont automatiquement multipliées pendant le compte à rebours.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2 font-mono font-black text-lg text-amber-900 dark:text-amber-300 tabular-nums">
            <Clock className="w-4 h-4" />
            {formatCountdown(xpBoostRemainingSec)}
          </div>
        </div>
      )}

      {/* LOBBY VIEW */}
      {status === 'lobby' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-white p-6 sm:p-8 relative overflow-hidden">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                <Timer className="w-4 h-4" />
                Défi Chronométré · Multiplicateur d’XP Temporaire
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                Mode Speedrun Laboratoires
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Enchaînez une série de laboratoires réels sans aide automatique. Plus vous neutralisez vite chaque attaque, plus votre multiplicateur d’XP temporaire (<strong className="text-amber-300">jusqu’à ×2.5 XP pendant 20 min</strong>) est élevé sur tout l’Archipel Cyberland.
              </p>
            </div>
          </div>

          {/* 3 Circuit Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {SPEEDRUN_CIRCUITS.map((c) => {
              const bestMs = bestSpeedrunByCircuit[c.id];
              const isSelected = c.id === selectedCircuitId;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    playClick();
                    setSelectedCircuitId(c.id);
                  }}
                  className={`cursor-pointer rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-amber-500 shadow-md'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-amber-600 dark:text-amber-400">
                        {c.difficulty} · {c.steps.length} labs
                      </span>
                      {typeof bestMs === 'number' && (
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          <Trophy className="w-3.5 h-3.5" />
                          {formatChrono(bestMs)}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {c.subtitle}
                      </p>
                    </div>

                    {/* Step sequence preview */}
                    <div className="space-y-1.5 pt-1">
                      {c.steps.map((step, i) => (
                        <div
                          key={`${c.id}-${step.id}-${i}`}
                          className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                            {i + 1}
                          </span>
                          <span className="font-semibold">{step.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Medal Reward Tiers */}
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3 space-y-1.5 text-[11.5px] font-mono tabular-nums">
                      <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 font-bold">
                        <span>Or (&le; {c.tiers.goldMaxSec}s)</span>
                        <span>
                          ×{c.tiers.goldMultiplier} XP · {c.tiers.goldMinutes} min
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Argent (&le; {c.tiers.silverMaxSec}s)</span>
                        <span>
                          ×{c.tiers.silverMultiplier} XP · {c.tiers.silverMinutes} min
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-orange-700 dark:text-orange-400">
                        <span>Bronze (terminé)</span>
                        <span>
                          ×{c.tiers.bronzeMultiplier} XP · {c.tiers.bronzeMinutes} min
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRun(c.id);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Lancer ce Speedrun
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RUNNING VIEW: Live HUD + Current Lab */}
      {status === 'running' && currentStep && (
        <div className="space-y-5">
          {/* Sticky / Prominent Speedrun HUD */}
          <div className="rounded-2xl border-2 border-amber-500/70 bg-slate-950 text-white p-4 sm:p-5 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
                    Chrono live
                  </div>
                  <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tabular-nums leading-none mt-0.5">
                    {formatChrono(elapsedMs)}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    {circuit.title} · Étape {currentStepIdx + 1}/{circuit.steps.length}
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2 mt-0.5">
                    <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                    {currentStep.label}
                  </div>
                  <div className="text-xs text-amber-200/90 mt-0.5">
                    Objectif : {currentStep.objective}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-right">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Allure actuelle
                  </div>
                  <div className={`text-sm font-extrabold tabular-nums ${livePace.color}`}>
                    {livePace.rank} (×{livePace.mult} XP)
                    {livePace.remaining > 0 && ` · -${livePace.remaining.toFixed(0)}s`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => startRun()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart
                </button>

                <button
                  type="button"
                  onClick={abortRun}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs font-bold transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Abandonner
                </button>
              </div>
            </div>

            {/* Splits Tracker */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {circuit.steps.map((step, idx) => {
                const isDone = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const splitTime = splitsMs[idx];
                return (
                  <div
                    key={`${step.id}-${idx}`}
                    className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      isDone
                        ? 'bg-emerald-950/50 border-emerald-600/60 text-emerald-200'
                        : isCurrent
                          ? 'bg-amber-500/20 border-amber-400 text-white font-bold'
                          : 'bg-slate-900/70 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span className="truncate">
                      {idx + 1}. {step.label}
                    </span>
                    {isDone ? (
                      <span className="font-mono text-[11px] text-emerald-400 tabular-nums shrink-0">
                        {(splitTime / 1000).toFixed(1)}s
                      </span>
                    ) : isCurrent ? (
                      <Gauge className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : null}
                  </div>
                );
              })}
            </div>

            {splitBanner && (
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {splitBanner}
              </div>
            )}
          </div>

          {/* Active Lab Engine */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 sm:p-6">
            {currentStep.id === 'ddos' ? (
              <AntiDdosGame
                key={`sr-${runNonce}-${currentStepIdx}-ddos`}
                speedrunMode
                onWinBonusXp={handleCurrentLabSolved}
              />
            ) : currentStep.id === 'sqli' ? (
              <SqlInjectionLab
                key={`sr-${runNonce}-${currentStepIdx}-sqli`}
                speedrunMode
                onMasterSqli={handleCurrentLabSolved}
              />
            ) : (
              <LiveAttackLab
                key={`sr-${runNonce}-${currentStepIdx}-${currentStep.id}`}
                attackId={currentStep.id}
                neutralizedIds={[]}
                speedrunMode
                onNeutralizeAttack={handleCurrentLabSolved}
                onSelectAttack={() => {}}
              />
            )}
          </div>
        </div>
      )}

      {/* FINISHED RESULTS VIEW */}
      {status === 'finished' && lastResult && (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700/70 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Trophy className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">
                  <span>Speedrun terminé · {circuit.title}</span>
                  {isNewRecord && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      Nouveau record personnel !
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {formatChrono(lastResult.durationMs)} — Médaille {lastResult.rank}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Votre multiplicateur <strong className="text-amber-600 dark:text-amber-400">×{lastResult.multiplier} XP</strong> est désormais actif pendant <strong>{lastResult.durationMinutes} minutes</strong> (+{lastResult.instantBonusXp} XP immédiats) !
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => startRun()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Battre mon record
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setStatus('lobby');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-colors"
              >
                Autres circuits
              </button>
            </div>
          </div>

          {/* Reward Breakdown + Split Table */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 p-4">
              <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Multiplicateur débloqué
              </div>
              <div className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1 tabular-nums">
                ×{lastResult.multiplier} XP
              </div>
              <div className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Actif pendant {lastResult.durationMinutes} minutes
              </div>
            </div>

            <div className="rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                Prime Speedrun
              </div>
              <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1 tabular-nums">
                +{lastResult.instantBonusXp} XP
              </div>
              <div className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                Ajoutés à votre score total
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-indigo-500" />
                Labs validés sans aide
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                {circuit.steps.length}/{circuit.steps.length}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                100 % résolution manuelle
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Temps intermédiaires (Splits)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {circuit.steps.map((step, idx) => (
                <div
                  key={`${step.id}-${idx}`}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {idx + 1}. {step.label}
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{(splitsMs[idx] / 1000).toFixed(2)} s
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
