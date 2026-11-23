import React, { useEffect, useState } from 'react';
import { Play, RotateCcw, Plus, Minus, Cloud, Server, CheckCircle2, AlertTriangle } from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island4CloudTycoonGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

type InfraMode = 'local' | 'cloud-manual' | 'cloud-autoscale';

// 24-hour tourist traffic curve on Cyberland (req/s)
const TRAFFIC_BY_HOUR = [
  25, 20, 18, 18, 22, 35, 55, 85, 115, 145, 170, 195, 205, 185, 150, 130, 140, 165, 180, 145, 105,
  70, 45, 30,
];

const SERVER_CAPACITY = 55; // req/s per server
const COST_PER_SERVER_PER_HOUR = 6; // gold coins

export const Island4CloudTycoonGame: React.FC<Island4CloudTycoonGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [running, setRunning] = useState(false);
  const [hour, setHour] = useState(0);
  const [mode, setMode] = useState<InfraMode>('local');
  const [servers, setServers] = useState(1);
  const [gold, setGold] = useState(500);
  const [healthyHours, setHealthyHours] = useState(0);
  const [history, setHistory] = useState<{ hour: number; traffic: number; capacity: number }[]>([]);
  const [finished, setFinished] = useState<'none' | 'victory' | 'fail'>('none');

  const currentTraffic = TRAFFIC_BY_HOUR[Math.min(hour, 23)];
  const capacity = servers * SERVER_CAPACITY;
  const loadPct = Math.round((currentTraffic / Math.max(1, capacity)) * 100);
  const isOverloaded = currentTraffic > capacity;

  const resetSim = (nextMode: InfraMode = mode) => {
    playClick();
    setRunning(false);
    setHour(0);
    setMode(nextMode);
    setServers(1);
    setGold(500);
    setHealthyHours(0);
    setHistory([]);
    setFinished('none');
  };

  const handleModeSwitch = (nextMode: InfraMode) => {
    playClick();
    setMode(nextMode);
    if (nextMode === 'local') {
      setServers(1);
    }
  };

  useEffect(() => {
    if (!running || finished !== 'none') return;

    const timer = window.setInterval(() => {
      setHour((prevHour) => {
        const traffic = TRAFFIC_BY_HOUR[prevHour];

        setServers((prevServers) => {
          let activeServers = prevServers;
          if (mode === 'local') {
            activeServers = 1;
          } else if (mode === 'cloud-autoscale') {
            activeServers = Math.max(1, Math.min(5, Math.ceil(traffic / SERVER_CAPACITY)));
          }

          const cap = activeServers * SERVER_CAPACITY;
          const ok = traffic <= cap;
          const hourlyCost =
            mode === 'local' ? 12 : activeServers * COST_PER_SERVER_PER_HOUR;

          setGold((g) => Math.max(0, g - hourlyCost));
          setHealthyHours((h) => h + (ok ? 1 : 0));
          setHistory((hist) => [
            ...hist.slice(-23),
            { hour: prevHour, traffic, capacity: cap },
          ]);

          if (prevHour >= 23) {
            setRunning(false);
            const finalHealthy = healthyHours + (ok ? 1 : 0);
            const finalGold = Math.max(0, gold - hourlyCost);
            const uptime = Math.round((finalHealthy / 24) * 100);
            if (uptime >= 90 && finalGold >= 120) {
              const stars =
                uptime >= 98 && finalGold >= 190 ? 3 : uptime >= 95 && finalGold >= 150 ? 2 : 1;
              playVictory();
              setFinished('victory');
              onComplete(stars);
            } else {
              playError();
              setFinished('fail');
            }
          }

          return activeServers;
        });

        return prevHour >= 23 ? 23 : prevHour + 1;
      });
    }, 650);

    return () => window.clearInterval(timer);
  }, [running, finished, mode, healthyHours, gold, onComplete]);

  const uptimePct = hour === 0 && history.length === 0 ? 100 : Math.round((healthyHours / Math.max(1, history.length)) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 65% Simulation Dashboard */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-semibold">Mini-jeu · Cloud Tycoon (Cycle 24h)</span>
          <div className="flex items-center gap-5 text-xs font-mono tabular-nums">
            <span>
              Heure : <strong>{String(hour).padStart(2, '0')}h00</strong>
            </span>
            <span>
              Or : <strong className={gold < 150 ? 'text-amber-300' : 'text-emerald-300'}>{gold}</strong>
            </span>
            <span>
              Dispo : <strong className={uptimePct < 90 ? 'text-red-300' : 'text-emerald-300'}>{uptimePct}%</strong>
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5 bg-[#EEF5FA]">
          {/* Live Telemetry Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3.5">
              <p className="text-xs text-slate-500">Trafic touristes</p>
              <p className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                {currentTraffic} <span className="text-xs font-normal text-slate-500">req/s</span>
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5">
              <p className="text-xs text-slate-500">Capacité ({servers} serv.)</p>
              <p className="font-mono text-xl font-bold text-sky-800 tabular-nums">
                {capacity} <span className="text-xs font-normal text-slate-500">req/s</span>
              </p>
            </div>
            <div
              className={`border rounded-lg p-3.5 ${
                isOverloaded
                  ? 'bg-red-50 border-red-300 text-red-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <p className="text-xs opacity-80">État du site</p>
              <p className="font-mono text-xl font-bold tabular-nums">
                {loadPct}% · {isOverloaded ? 'SATURÉ' : 'FLUIDE'}
              </p>
            </div>
          </div>

          {/* 24-Hour Traffic vs Capacity Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Vague de touristes vs Capacité serveurs (00h → 23h)</span>
              <span className="font-mono">
                Bleu = Trafic · Trait vert = Capacité
              </span>
            </div>
            <div className="h-40 flex items-end gap-1 pt-4">
              {TRAFFIC_BY_HOUR.map((val, idx) => {
                const record = history.find((h) => h.hour === idx);
                const heightPct = Math.round((val / 240) * 100);
                const capPct = record ? Math.min(100, Math.round((record.capacity / 240) * 100)) : null;
                const overloadedBar = record ? record.traffic > record.capacity : false;
                const isCurrent = idx === hour && running;

                return (
                  <div
                    key={idx}
                    className="flex-1 h-full flex flex-col justify-end relative group"
                    title={`${idx}h : ${val} req/s`}
                  >
                    {capPct !== null && (
                      <div
                        className="absolute left-0 right-0 h-1 bg-emerald-600 z-10"
                        style={{ bottom: `${capPct}%` }}
                      />
                    )}
                    <div
                      className={`w-full rounded-t-sm transition-colors ${
                        overloadedBar
                          ? 'bg-red-500'
                          : isCurrent
                          ? 'bg-amber-500'
                          : record
                          ? 'bg-sky-600'
                          : 'bg-slate-200'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>00h (Nuit)</span>
              <span>06h</span>
              <span>12h (Pic midi)</span>
              <span>18h (Pic soir)</span>
              <span>23h</span>
            </div>
          </div>

          {/* Result Banner */}
          {finished !== 'none' && (
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                finished === 'victory'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {finished === 'victory' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
                )}
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm">
                    {finished === 'victory'
                      ? 'Cycle 24h réussi ! Badge Architecte du Nuage débloqué (+250 XP)'
                      : 'Objectif non atteint (visez ≥ 90 % de disponibilité et ≥ 120 or restant)'}
                  </p>
                  <p>
                    Résultat : {uptimePct} % de disponibilité · {gold} pièces d&apos;or restantes.{' '}
                    {mode === 'local'
                      ? 'Le serveur local fixe a saturé au pic de midi ! Essayez le Cloud avec Auto-Scaling.'
                      : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => resetSim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0"
              >
                Rejouer 24h
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right 35% Architecture Controls */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-slate-900">Pilotage d&apos;infrastructure</h3>
          <p className="text-xs text-slate-600">
            Objectif sur 24h : disponibilité ≥ 90 % tout en conservant au moins 120 pièces d&apos;or.
          </p>
        </div>

        {/* Mode selector */}
        <div className="space-y-2">
          {(
            [
              {
                id: 'local' as InfraMode,
                title: 'Serveur local fixe (On-Premise)',
                desc: '1 machine fixe (55 req/s max). Impossible d’augmenter lors des pics.',
                icon: Server,
              },
              {
                id: 'cloud-manual' as InfraMode,
                title: 'Cloud — Scaling manuel',
                desc: 'Ajoutez ou retirez des serveurs virtuels vous-même selon l’heure.',
                icon: Cloud,
              },
              {
                id: 'cloud-autoscale' as InfraMode,
                title: 'Cloud — Auto-Scaling actif',
                desc: 'Ajuste automatiquement les serveurs au pic et les éteint la nuit.',
                icon: Cloud,
              },
            ]
          ).map((item) => {
            const Icon = item.icon;
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleModeSwitch(item.id)}
                className={`w-full text-left p-3.5 rounded-lg border transition-colors flex items-start gap-3 ${
                  active
                    ? 'bg-sky-50 border-sky-600 text-sky-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-sky-700' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-bold">{item.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Manual scaling buttons */}
        {mode === 'cloud-manual' && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-800">
              Serveurs actifs : {servers}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setServers((s) => Math.max(1, s - 1));
                }}
                aria-label="Retirer un serveur"
                className="p-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  playSuccess();
                  setServers((s) => Math.min(5, s + 1));
                }}
                aria-label="Ajouter un serveur"
                className="p-2 bg-sky-700 text-white hover:bg-sky-800 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              playClick();
              if (finished !== 'none') {
                resetSim(mode);
                setRunning(true);
              } else {
                setRunning((r) => !r);
              }
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            {running ? 'Pause' : finished !== 'none' ? 'Relancer 24h' : 'Lancer la journée'}
          </button>
          <button
            type="button"
            onClick={() => resetSim(mode)}
            aria-label="Réinitialiser"
            className="p-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {isCompleted && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
            Badge <strong>Architecte du Nuage</strong> validé !
          </div>
        )}
      </div>
    </div>
  );
};
