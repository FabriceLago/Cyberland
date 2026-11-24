import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Code2,
  Flame,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Wand2,
  Zap,
} from 'lucide-react';
import {
  CYBER_ATTACK_LIST,
  CYBER_ATTACK_MAP,
  CyberAttackId,
} from '../../data/cyberAttackSimulations';
import { AttackVisualStage } from './attacks/AttackVisualStage';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface LiveAttackLabProps {
  attackId: CyberAttackId;
  neutralizedIds: CyberAttackId[];
  onNeutralizeAttack: (attackId: CyberAttackId) => void;
  onSelectAttack: (attackId: CyberAttackId) => void;
  speedrunMode?: boolean;
}

interface LogEntry {
  id: number;
  time: string;
  level: 'alert' | 'defense' | 'info' | 'success';
  text: string;
}

interface RiskSample {
  t: number;
  rawThreat: number;
  residualRisk: number;
}

function nowStamp(): string {
  return new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const LiveAttackLab: React.FC<LiveAttackLabProps> = ({
  attackId,
  neutralizedIds,
  onNeutralizeAttack,
  onSelectAttack,
  speedrunMode = false,
}) => {
  const attack = CYBER_ATTACK_MAP[attackId];

  const [isRunning, setIsRunning] = useState(true);
  const [attackActive, setAttackActive] = useState(true);
  const [activeDefenses, setActiveDefenses] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState(0);
  const [damageCounter, setDamageCounter] = useState(attack.attackRatePerTick * 3);
  const [blockedEvents, setBlockedEvents] = useState(0);
  const [stableTicks, setStableTicks] = useState(0);
  const [resolvedNow, setResolvedNow] = useState(false);
  const [isAutoSolving, setIsAutoSolving] = useState(false);
  const [autoStepIdx, setAutoStepIdx] = useState<number | null>(null);
  const [bottomTab, setBottomTab] = useState<'logs' | 'code'>('logs');

  const [history, setHistory] = useState<RiskSample[]>(() =>
    Array.from({ length: 18 }, (_, i) => ({
      t: i,
      rawThreat: 92 + (i % 3) * 3,
      residualRisk: 92 + (i % 3) * 3,
    }))
  );

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 1, time: nowStamp(), level: 'alert', text: attack.initialAlert },
    {
      id: 2,
      time: nowStamp(),
      level: 'info',
      text: 'Activez les contre-mesures à droite ou lancez « Démo : Comment résoudre » pour observer la remédiation en direct.',
    },
  ]);

  const logIdRef = useRef(3);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const appendLog = (level: LogEntry['level'], text: string) => {
    logIdRef.current += 1;
    setLogs((prev) => [{ id: logIdRef.current, time: nowStamp(), level, text }, ...prev].slice(0, 14));
  };

  const mitigation = useMemo(() => {
    let ratio = 0;
    let activeCount = 0;
    attack.defenses.forEach((d) => {
      if (activeDefenses[d.id]) {
        ratio += d.impactWeight;
        activeCount += 1;
      }
    });
    const clamped = Math.min(1, ratio);
    return {
      ratio: clamped,
      pct: Math.round(clamped * 100),
      activeCount,
    };
  }, [attack.defenses, activeDefenses]);

  const residualRisk = attackActive ? Math.max(0, Math.round((1 - mitigation.ratio) * 100)) : 0;

  // Smooth SVG packet animation clock (110ms)
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setPhase((p) => (p + 1) % 1000);
    }, 110);
    return () => window.clearInterval(id);
  }, [isRunning]);

  // Real-time telemetry clock (560ms)
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      const threat = attackActive ? 90 + Math.round(Math.random() * 10) : 0;
      const leakedRatio = Math.max(0, 1 - mitigation.ratio);
      const leakedRisk = attackActive ? Math.round(threat * leakedRatio) : 0;

      if (attackActive) {
        const leakedAmount = Math.round(attack.attackRatePerTick * leakedRatio);
        const blockedAmount = Math.max(0, attack.attackRatePerTick - leakedAmount);
        if (leakedAmount > 0) {
          setDamageCounter((prev) => prev + leakedAmount);
        }
        if (blockedAmount > 0) {
          setBlockedEvents((prev) => prev + blockedAmount);
        }
      }

      setHistory((prev) => {
        const nextT = (prev[prev.length - 1]?.t ?? 0) + 1;
        return [...prev.slice(1), { t: nextT, rawThreat: threat, residualRisk: leakedRisk }];
      });

      const targetTicks = speedrunMode ? 1 : 4;
      if (attackActive && mitigation.pct >= 95) {
        setStableTicks((prev) => {
          const next = Math.min(targetTicks, prev + 1);
          if (next === targetTicks && !resolvedNow) {
            setResolvedNow(true);
            playVictory();
            onNeutralizeAttack(attackId);
          }
          return next;
        });
      } else if (!resolvedNow) {
        setStableTicks((prev) => Math.max(0, prev - 1));
      }
    }, 560);

    return () => window.clearInterval(id);
  }, [isRunning, attackActive, mitigation.ratio, mitigation.pct, attack.attackRatePerTick, resolvedNow, onNeutralizeAttack, attackId, speedrunMode]);

  const toggleDefense = (defenseId: string) => {
    clearTimers();
    setIsAutoSolving(false);
    setAutoStepIdx(null);

    const def = attack.defenses.find((d) => d.id === defenseId);
    if (!def) return;

    setActiveDefenses((prev) => {
      const nextVal = !prev[defenseId];
      if (nextVal) {
        playSuccess();
        appendLog('defense', `${def.name} activé (-${Math.round(def.impactWeight * 100)} % risque) : ${def.detail}`);
      } else {
        playError();
        appendLog('alert', `${def.name} désactivé : la surface d’attaque est de nouveau exposée.`);
      }
      return { ...prev, [defenseId]: nextVal };
    });
  };

  const handleReset = () => {
    playClick();
    clearTimers();
    setIsAutoSolving(false);
    setAutoStepIdx(null);
    setActiveDefenses({});
    setAttackActive(true);
    setIsRunning(true);
    setDamageCounter(attack.attackRatePerTick * 2);
    setBlockedEvents(0);
    setStableTicks(0);
    setResolvedNow(false);
    appendLog('alert', `Simulation réinitialisée : ${attack.initialAlert}`);
  };

  const handleGuidedDemo = () => {
    playClick();
    clearTimers();
    setActiveDefenses({});
    setAttackActive(true);
    setIsRunning(true);
    setDamageCounter(attack.attackRatePerTick * 2);
    setBlockedEvents(0);
    setStableTicks(0);
    setResolvedNow(false);
    setIsAutoSolving(true);
    setAutoStepIdx(0);

    appendLog(
      'info',
      `Démo de résolution guidée démarrée : observation de l’attaque en cours puis déploiement des ${attack.defenses.length} défenses.`
    );

    attack.defenses.forEach((def, idx) => {
      const tId = window.setTimeout(() => {
        playSuccess();
        setAutoStepIdx(idx + 1);
        setActiveDefenses((prev) => ({ ...prev, [def.id]: true }));
        appendLog('defense', `Étape ${idx + 1} · ${def.name} — ${def.detail}`);

        if (idx === attack.defenses.length - 1) {
          const finishId = window.setTimeout(() => {
            setIsAutoSolving(false);
            appendLog('success', attack.resolvedMessage);
          }, 1500);
          timersRef.current.push(finishId);
        }
      }, 1300 + idx * 1900);
      timersRef.current.push(tId);
    });
  };

  const handleNextAttack = () => {
    playClick();
    const idx = CYBER_ATTACK_LIST.findIndex((a) => a.id === attackId);
    const next = CYBER_ATTACK_LIST[(idx + 1) % CYBER_ATTACK_LIST.length];
    onSelectAttack(next.id);
  };

  const isAlreadyNeutralized = resolvedNow || neutralizedIds.includes(attackId);

  // Build SVG risk sparkline
  const chartW = 420;
  const chartH = 96;
  const rawPoints = history
    .map((pt, i) => {
      const x = (i / Math.max(1, history.length - 1)) * chartW;
      const y = chartH - (pt.rawThreat / 105) * chartH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const riskPoints = history
    .map((pt, i) => {
      const x = (i / Math.max(1, history.length - 1)) * chartW;
      const y = chartH - (pt.residualRisk / 105) * chartH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const riskAreaPath = `M 0,${chartH} L ${riskPoints} L ${chartW},${chartH} Z`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
            <span className="text-rose-600 dark:text-rose-400 font-bold">{attack.category}</span>
            <span>·</span>
            <span>Sévérité : {attack.severity}</span>
            <span>·</span>
            <span className="tabular-nums text-emerald-700 dark:text-emerald-400">
              {neutralizedIds.length}/{CYBER_ATTACK_LIST.length} attaques résolues
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
            {attack.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{attack.summary}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!speedrunMode ? (
            <button
              type="button"
              onClick={handleGuidedDemo}
              disabled={isAutoSolving}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              {isAutoSolving ? 'Résolution en cours...' : 'Démo : Comment résoudre'}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              Speedrun · Résolution manuelle
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              playClick();
              setIsRunning((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Pause' : 'Reprendre'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Victory / Resolution Confirmation Banner */}
      {resolvedNow && (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700/70 bg-emerald-50 dark:bg-emerald-950/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold text-sm sm:text-base text-emerald-900 dark:text-emerald-200">
                Attaque neutralisée à 100 % ! (+50 XP Cyberland)
              </div>
              <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300/90 mt-0.5">
                {attack.resolvedMessage}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleNextAttack}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
          >
            Attaque suivante
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4 Live Telemetry KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{attack.attackMetricLabel}</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-1.5 text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {damageCounter.toLocaleString('fr-FR')} {attack.attackMetricUnit}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {residualRisk === 0 ? 'Progression stoppée' : attack.damageLabel}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Taux de protection</span>
            <Shield className="w-4 h-4 text-indigo-500" />
          </div>
          <div
            className={`mt-1.5 text-lg sm:text-xl font-black tabular-nums ${
              mitigation.pct >= 90
                ? 'text-emerald-600 dark:text-emerald-400'
                : mitigation.pct >= 40
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {mitigation.pct} %
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {blockedEvents.toLocaleString('fr-FR')} tentatives bloquées
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Risque résiduel</span>
            <Gauge className="w-4 h-4 text-sky-500" />
          </div>
          <div
            className={`mt-1.5 text-lg sm:text-xl font-black tabular-nums ${
              residualRisk >= 60
                ? 'text-rose-600 dark:text-rose-400'
                : residualRisk >= 20
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {residualRisk} %
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                residualRisk >= 60 ? 'bg-rose-500' : residualRisk >= 20 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(4, residualRisk)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>État du système</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <div
            className={`mt-1.5 text-sm sm:text-base font-extrabold leading-tight ${
              mitigation.pct >= 90
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {mitigation.pct >= 90 ? attack.safeStatusLabel : attack.compromisedStatusLabel}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {isAlreadyNeutralized ? 'Atelier validé' : `Validation : ${Math.round((stableTicks / 4) * 100)} %`}
          </div>
        </div>
      </div>

      {/* Main Split: Live Animated Stage + Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: Live Visual Stage + Risk Graph (7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-4 sm:p-5 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Activity className="w-4 h-4 text-cyan-400" />
                Simulation temps réel · {attack.shortLabel}
              </div>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setAttackActive((v) => !v);
                  appendLog(
                    attackActive ? 'info' : 'alert',
                    attackActive
                      ? 'Flux malveillant mis en pause.'
                      : `Relance de l’attaque ${attack.shortLabel} en temps réel.`
                  );
                }}
                className="text-[11px] font-mono px-2.5 py-1 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors"
              >
                {attackActive ? 'Stopper attaque' : 'Relancer attaque'}
              </button>
            </div>

            <AttackVisualStage
              attackId={attackId}
              activeDefenses={activeDefenses}
              attackActive={attackActive}
              phase={phase}
              mitigationPct={mitigation.pct}
              damageCounter={damageCounter}
            />

            {/* Live Payload / Wire Monitor */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-mono text-[11px] text-rose-300 truncate">
                <span className="text-slate-400 mr-1.5">Payload :</span>
                {attack.payloadPreview}
              </div>
              <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-slate-400 tabular-nums">
                <span>Sécurisation</span>
                <div className="w-20 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${mitigation.pct}%` }}
                  />
                </div>
                <span className="text-white font-bold">{mitigation.pct}%</span>
              </div>
            </div>
          </div>

          {/* Real-Time Threat vs Residual Risk Graph */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Impact temps réel : Menace brute vs Risque résiduel
              </h3>
              <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-400 inline-block" />
                  Tentatives d’attaque
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded-xs bg-emerald-500/70 inline-block" />
                  Exposition réelle
                </span>
              </div>
            </div>

            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-24 overflow-visible">
              <path
                d={riskAreaPath}
                fill={residualRisk >= 50 ? 'rgba(244,63,94,0.22)' : 'rgba(16,185,129,0.22)'}
              />
              <polyline
                fill="none"
                stroke={residualRisk >= 50 ? '#f43f5e' : '#10b981'}
                strokeWidth="2.4"
                points={riskPoints}
              />
              <polyline
                fill="none"
                stroke="#fb7185"
                strokeWidth="1.6"
                strokeDasharray="5 3"
                points={rawPoints}
              />
            </svg>
          </div>
        </div>

        {/* Right: Interactive Defenses & Step-by-step "Comment résoudre" (5 cols) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                Activer les défenses en direct
              </h3>
              <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                {mitigation.activeCount}/{attack.defenses.length} actives
              </span>
            </div>

            <div className="space-y-2.5">
              {attack.defenses.map((def, idx) => {
                const isOn = Boolean(activeDefenses[def.id]);
                const isStepHighlight = autoStepIdx === idx + 1;
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => toggleDefense(def.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isOn
                        ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-400 dark:border-emerald-600/70'
                        : isStepHighlight
                          ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-400'
                          : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {idx + 1}. {def.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {def.layer}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {def.shortEffect}
                        </p>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                            isOn
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isOn ? 'Actif' : 'Inactif'}
                        </span>
                        <span className="text-[10.5px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          -{Math.round(def.impactWeight * 100)} % risque
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mechanism & Guided Resolution Explanation */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Comment fonctionne l’attaque &amp; pourquoi la parade marche
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              {attack.mechanism}
            </p>
            <div className="space-y-2">
              {attack.defenses.map((def, idx) => {
                const isDone = Boolean(activeDefenses[def.id]);
                return (
                  <div
                    key={def.id}
                    className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
                      isDone
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-100'
                        : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 font-bold text-slate-900 dark:text-white mb-0.5">
                      <span>
                        Étape {idx + 1} · {def.name}
                      </span>
                      {isDone && (
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Appliqué
                        </span>
                      )}
                    </div>
                    <p>{def.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Live SOC Logs vs Real Production Code (Avant / Après) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 overflow-hidden">
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 px-4 pt-3">
          <button
            type="button"
            onClick={() => {
              playClick();
              setBottomTab('logs');
            }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
              bottomTab === 'logs'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Journal d’incident en direct
          </button>
          <button
            type="button"
            onClick={() => {
              playClick();
              setBottomTab('code');
            }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
              bottomTab === 'code'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Correction technique (Avant / Après)
          </button>
        </div>

        {bottomTab === 'logs' ? (
          <div className="p-4 space-y-2 max-h-52 overflow-y-auto font-mono text-xs">
            {logs.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 last:border-0"
              >
                <span className="text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                  [{entry.time}]
                </span>
                <span
                  className={`font-bold uppercase shrink-0 ${
                    entry.level === 'alert'
                      ? 'text-rose-600 dark:text-rose-400'
                      : entry.level === 'defense'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : entry.level === 'success'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {entry.level === 'alert'
                    ? 'ALERTE'
                    : entry.level === 'defense'
                      ? 'PARADE'
                      : entry.level === 'success'
                        ? 'RÉSOLU'
                        : 'INFO'}
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-sans">{entry.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {attack.configTitle}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/25 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Avant (Vulnérable)
                </div>
                <pre className="text-[11.5px] font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {attack.vulnerableCode}
                </pre>
              </div>
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/25 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Après (Corrigé en production)
                </div>
                <pre className="text-[11.5px] font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {attack.hardenedCode}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
