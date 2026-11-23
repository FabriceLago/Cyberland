import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BellRing,
  Database,
  Play,
  Pause,
  RotateCcw,
  Terminal,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  Zap,
  Server,
} from 'lucide-react';
import { playClick, playError, playPacket, playSuccess } from '../../utils/sound';

interface TelemetryRow {
  id: number;
  time: string;
  table: 'Event' | 'Perf' | 'AppRequests' | 'Heartbeat';
  computer: string;
  eventId?: number;
  level: 'Info' | 'Warning' | 'Error';
  metricName?: string;
  metricValue?: number;
  statusCode?: number;
  durationMs?: number;
  message: string;
}

const BASE_TELEMETRY: TelemetryRow[] = [
  {
    id: 1,
    time: '14:01:02',
    table: 'Heartbeat',
    computer: 'WIN-WEB-01',
    level: 'Info',
    message: 'Agent AMA actif · Windows Server 2022 · DCR-Cyberland appliquée',
  },
  {
    id: 2,
    time: '14:01:05',
    table: 'Perf',
    computer: 'WIN-WEB-01',
    level: 'Info',
    metricName: '% Processor Time',
    metricValue: 34,
    message: 'Compteur Windows CPU : 34 % · Mémoire libre : 62 %',
  },
  {
    id: 3,
    time: '14:01:08',
    table: 'AppRequests',
    computer: 'APP-BILLETTERIE',
    level: 'Info',
    statusCode: 200,
    durationMs: 42,
    message: 'GET /api/billets · 200 OK · 42 ms (Application Insights)',
  },
  {
    id: 4,
    time: '14:01:12',
    table: 'Event',
    computer: 'WIN-AD-01',
    eventId: 4625,
    level: 'Error',
    message: 'Windows Security EventID 4625 : Échec ouverture session RDP (IP 185.220.101.9)',
  },
  {
    id: 5,
    time: '14:01:14',
    table: 'Event',
    computer: 'WIN-AD-01',
    eventId: 4625,
    level: 'Error',
    message: 'Windows Security EventID 4625 : Échec ouverture session RDP (compte Administrateur)',
  },
  {
    id: 6,
    time: '14:01:18',
    table: 'Perf',
    computer: 'WIN-SQL-02',
    level: 'Warning',
    metricName: '% Processor Time',
    metricValue: 88,
    message: 'Compteur Windows CPU : 88 % · Pic requêtes SQL détecté',
  },
  {
    id: 7,
    time: '14:01:21',
    table: 'AppRequests',
    computer: 'APP-BILLETTERIE',
    level: 'Error',
    statusCode: 503,
    durationMs: 2450,
    message: 'POST /api/paiement · 503 Timeout SQL · 2 450 ms',
  },
  {
    id: 8,
    time: '14:01:25',
    table: 'Perf',
    computer: 'WIN-SQL-02',
    level: 'Error',
    metricName: '% Processor Time',
    metricValue: 94,
    message: 'Compteur Windows CPU : 94 % · Seuil critique dépassé !',
  },
  {
    id: 9,
    time: '14:01:29',
    table: 'Event',
    computer: 'WIN-WEB-01',
    eventId: 7036,
    level: 'Warning',
    message: 'Windows System EventID 7036 : Service W3SVC (IIS) redémarré automatiquement',
  },
  {
    id: 10,
    time: '14:01:33',
    table: 'Heartbeat',
    computer: 'WIN-SQL-02',
    level: 'Info',
    message: 'Agent AMA actif · Action Group Autoscale exécuté (+2 instances)',
  },
];

type KqlPresetId = 'all' | 'security-4625' | 'cpu-high' | 'app-errors' | 'heartbeat';

const KQL_PRESETS: {
  id: KqlPresetId;
  label: string;
  query: string;
  explanation: string;
}[] = [
  {
    id: 'all',
    label: 'Tout (Log Analytics)',
    query: 'union Event, Perf, AppRequests, Heartbeat | sort by TimeGenerated desc',
    explanation: 'Affiche l’ensemble des journaux Windows Server et Application Insights collectés.',
  },
  {
    id: 'security-4625',
    label: 'Brute-force Windows (4625)',
    query: 'Event | where EventID == 4625 | project TimeGenerated, Computer, RenderedDescription',
    explanation: 'Isole les échecs d’authentification Windows (EventID 4625) collectés par l’agent AMA.',
  },
  {
    id: 'cpu-high',
    label: 'Pics CPU Windows (> 80 %)',
    query: 'Perf | where CounterName == "% Processor Time" and CounterValue > 80',
    explanation: 'Filtre les compteurs de performance Windows dépassant 80 % de charge CPU.',
  },
  {
    id: 'app-errors',
    label: 'Erreurs App Insights (5xx)',
    query: 'AppRequests | where ResultCode >= 500 | project TimeGenerated, Url, DurationMs',
    explanation: 'Repère les requêtes web lentes ou en erreur 5xx via Application Insights.',
  },
  {
    id: 'heartbeat',
    label: 'Santé Agents AMA',
    query: 'Heartbeat | summarize LastSeen=max(TimeGenerated) by Computer',
    explanation: 'Vérifie que chaque serveur Windows envoie bien son battement de cœur (Heartbeat).',
  },
];

type ScenarioMode = 'normal' | 'cpu-spike' | 'rdp-attack';

export const AzureMonitorLab: React.FC = () => {
  const [running, setRunning] = useState(true);
  const [scenario, setScenario] = useState<ScenarioMode>('normal');
  const [cpuSeries, setCpuSeries] = useState<number[]>([32, 36, 41, 38, 45, 52, 48, 44]);
  const [alertThreshold, setAlertThreshold] = useState<number>(80);
  const [selectedKql, setSelectedKql] = useState<KqlPresetId>('all');
  const [visibleLogCount, setVisibleLogCount] = useState(5);
  const [actionGroupFired, setActionGroupFired] = useState(false);

  // Continuously animate live Azure Monitor metric sparkline & log ingestion
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setCpuSeries((prev) => {
        const targetBase =
          scenario === 'cpu-spike' ? 91 : scenario === 'rdp-attack' ? 68 : 42;
        const jitter = Math.round((Math.random() - 0.5) * 14);
        const nextVal = Math.max(15, Math.min(99, targetBase + jitter));
        return [...prev.slice(-11), nextVal];
      });
      setVisibleLogCount((c) => (c < BASE_TELEMETRY.length ? c + 1 : c));
    }, 1100);
    return () => window.clearInterval(timer);
  }, [running, scenario]);

  const currentCpu = cpuSeries[cpuSeries.length - 1] ?? 42;
  const isAlertTriggered = currentCpu >= alertThreshold;

  useEffect(() => {
    if (isAlertTriggered) {
      setActionGroupFired(true);
    }
  }, [isAlertTriggered]);

  const visibleLogs = useMemo(() => {
    const slice = BASE_TELEMETRY.slice(0, visibleLogCount);
    if (selectedKql === 'security-4625') {
      return slice.filter((r) => r.table === 'Event' && r.eventId === 4625);
    }
    if (selectedKql === 'cpu-high') {
      return slice.filter((r) => r.table === 'Perf' && (r.metricValue ?? 0) > 80);
    }
    if (selectedKql === 'app-errors') {
      return slice.filter((r) => r.table === 'AppRequests' && (r.statusCode ?? 200) >= 500);
    }
    if (selectedKql === 'heartbeat') {
      return slice.filter((r) => r.table === 'Heartbeat');
    }
    return slice;
  }, [visibleLogCount, selectedKql]);

  const activeKqlObj = KQL_PRESETS.find((k) => k.id === selectedKql) ?? KQL_PRESETS[0];

  // Build SVG polyline points for CPU sparkline
  const chartW = 460;
  const chartH = 140;
  const points = cpuSeries
    .map((val, idx) => {
      const x = (idx / Math.max(1, cpuSeries.length - 1)) * (chartW - 24) + 12;
      const y = chartH - (val / 100) * (chartH - 20) - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const thresholdY = chartH - (alertThreshold / 100) * (chartH - 20) - 10;

  return (
    <div className="space-y-6">
      {/* Top Control & Architecture Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
              Laboratoire animé · Observabilité Windows &amp; Cloud Microsoft Azure
            </p>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              Console Windows Azure Monitor &amp; Log Analytics (KQL)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Simulez la collecte de télémétrie par l&apos;agent <strong>AMA</strong> sur des
              serveurs Windows, ajustez le seuil d&apos;alerte pour déclencher un{' '}
              <strong>Action Group</strong> et exécutez des requêtes <strong>KQL</strong> en direct.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playClick();
                setRunning((r) => !r);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap"
            >
              {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {running ? 'Pause flux' : 'Reprendre flux'}
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setScenario('normal');
                setActionGroupFired(false);
                setVisibleLogCount(4);
                setCpuSeries([32, 36, 41, 38, 45, 52, 48, 44]);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Scenario Injection Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Injecter un scénario Windows / Azure :
            </span>
            {(
              [
                { id: 'normal', label: 'Trafic nominal', icon: Server },
                { id: 'cpu-spike', label: 'Pic CPU Windows VM (94 %)', icon: Cpu },
                { id: 'rdp-attack', label: 'Attaque RDP (EventID 4625)', icon: ShieldAlert },
              ] as const
            ).map((sc) => {
              const Icon = sc.icon;
              const active = scenario === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    if (sc.id === 'normal') playSuccess();
                    else playError();
                    setScenario(sc.id);
                    if (sc.id === 'rdp-attack') {
                      setSelectedKql('security-4625');
                      setVisibleLogCount(BASE_TELEMETRY.length);
                    } else if (sc.id === 'cpu-spike') {
                      setSelectedKql('cpu-high');
                      setVisibleLogCount(BASE_TELEMETRY.length);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                    active
                      ? sc.id === 'normal'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                        : 'bg-red-50 dark:bg-red-950/50 border-red-500 text-red-900 dark:text-red-200'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {sc.label}
                </button>
              );
            })}
          </div>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Agent AMA : actif · DCR : Windows-Perf-Sec
          </span>
        </div>
      </div>

      {/* Main Split: Metrics + Alerting on Left, Log Analytics KQL on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 5 cols: Azure Monitor Metrics & Alert Rule */}
        <section className="xl:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <Activity className="w-4 h-4 text-sky-400" />
              Azure Monitor Metrics (Temps réel)
            </span>
            <span
              className={`font-mono text-xs font-bold tabular-nums ${
                isAlertTriggered ? 'text-red-300' : 'text-emerald-300'
              }`}
            >
              CPU : {currentCpu} % {isAlertTriggered ? '▲ ALERTE' : '● NOMINAL'}
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* Animated Sparkline SVG */}
            <div className="bg-[#F4F8FC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full h-auto"
                role="img"
                aria-label="Courbe CPU Windows Server dans Azure Monitor"
              >
                {/* Horizontal Grid lines */}
                {[25, 50, 75].map((pct) => {
                  const y = chartH - (pct / 100) * (chartH - 20) - 10;
                  return (
                    <line
                      key={pct}
                      x1="12"
                      y1={y}
                      x2={chartW - 12}
                      y2={y}
                      stroke="#CBD5E1"
                      strokeOpacity="0.4"
                      strokeDasharray="3 3"
                    />
                  );
                })}
                {/* Alert Threshold Line */}
                <line
                  x1="12"
                  y1={thresholdY}
                  x2={chartW - 12}
                  y2={thresholdY}
                  stroke="#DC2626"
                  strokeWidth="1.75"
                  strokeDasharray="6 4"
                />
                <text
                  x={chartW - 16}
                  y={Math.max(14, thresholdY - 5)}
                  textAnchor="end"
                  className="fill-red-600 dark:fill-red-400 text-[10px] font-mono font-bold"
                >
                  Seuil alerte : {alertThreshold} %
                </text>
                {/* Live Metric Line */}
                <polyline
                  fill="none"
                  stroke={isAlertTriggered ? '#DC2626' : '#0284C7'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              </svg>
            </div>

            {/* Alert Threshold Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="azure-threshold-slider"
                  className="font-semibold text-slate-700 dark:text-slate-300"
                >
                  Règle d&apos;alerte Metric Alert (% Processor Time)
                </label>
                <span className="font-mono font-bold text-sky-700 dark:text-sky-400 tabular-nums">
                  Seuil : &gt; {alertThreshold} %
                </span>
              </div>
              <input
                id="azure-threshold-slider"
                type="range"
                min={50}
                max={95}
                step={5}
                value={alertThreshold}
                onChange={(e) => {
                  playPacket();
                  setAlertThreshold(Number(e.target.value));
                }}
                className="w-full accent-sky-700"
              />
            </div>

            {/* Action Group Live Reaction Panel */}
            <div
              className={`p-4 rounded-xl border space-y-2.5 transition-colors ${
                isAlertTriggered
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-950 dark:text-red-100'
                  : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold">
                  {isAlertTriggered ? (
                    <BellRing className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {isAlertTriggered
                    ? 'Alerte Sev 1 déclenchée ! Action Group activé'
                    : 'État nominal — Surveillance continue active'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-white/80 dark:bg-slate-900/70 border border-current/15">
                  1. Notification Teams / SMS astreinte :{' '}
                  <strong>{isAlertTriggered ? 'ENVOYÉE' : 'Veille'}</strong>
                </div>
                <div className="p-2 rounded bg-white/80 dark:bg-slate-900/70 border border-current/15">
                  2. Autoscale VM Scale Set :{' '}
                  <strong>{isAlertTriggered ? '+2 VM lancées' : 'Prêt'}</strong>
                </div>
                <div className="p-2 rounded bg-white/80 dark:bg-slate-900/70 border border-current/15">
                  3. Runbook Webhook :{' '}
                  <strong>{actionGroupFired ? 'Exécuté' : 'En attente'}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right 7 cols: Log Analytics Workspace & KQL Query Runner */}
        <section className="xl:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <Database className="w-4 h-4 text-emerald-400" />
              Log Analytics Workspace — Requêtes KQL (Kusto)
            </span>
            <span className="font-mono text-xs text-slate-300 tabular-nums">
              {visibleLogs.length} ligne(s) retournée(s)
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* KQL Preset Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              {KQL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedKql(preset.id);
                    setVisibleLogCount(BASE_TELEMETRY.length);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                    selectedKql === preset.id
                      ? 'bg-sky-700 border-sky-700 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Active KQL Query Code Box */}
            <div className="bg-slate-950 text-sky-300 rounded-xl p-3.5 font-mono text-xs border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Requête Kusto (KQL) exécutée :</span>
              </div>
              <p className="text-emerald-300 font-semibold break-all">{activeKqlObj.query}</p>
              <p className="text-[11px] text-slate-400 font-sans">{activeKqlObj.explanation}</p>
            </div>

            {/* Results Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[290px] overflow-y-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0">
                  <tr>
                    <th className="py-2 px-2.5">Heure</th>
                    <th className="py-2 px-2.5">Table</th>
                    <th className="py-2 px-2.5">Machine</th>
                    <th className="py-2 px-2.5">Détail événement / métrique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500 dark:text-slate-400">
                        Collecte en cours… cliquez sur une requête ou patientez 1 seconde.
                      </td>
                    </tr>
                  ) : (
                    visibleLogs.map((row) => (
                      <tr
                        key={row.id}
                        className={
                          row.level === 'Error'
                            ? 'bg-red-50/75 dark:bg-red-950/30 text-red-950 dark:text-red-200'
                            : row.level === 'Warning'
                            ? 'bg-amber-50/75 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                        }
                      >
                        <td className="py-2 px-2.5 tabular-nums whitespace-nowrap">{row.time}</td>
                        <td className="py-2 px-2.5 font-bold whitespace-nowrap">{row.table}</td>
                        <td className="py-2 px-2.5 whitespace-nowrap">{row.computer}</td>
                        <td className="py-2 px-2.5">{row.message}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Zap className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400 shrink-0" />
              <span>
                <strong>Astuce KQL :</strong> Le symbole <code className="font-mono">|</code> (pipe)
                enchaîne les filtres étape par étape : <em>Table → where → summarize → project</em>.
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
