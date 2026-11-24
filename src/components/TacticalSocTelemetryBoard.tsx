import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Activity,
  Flag,
  Info,
  Pause,
  Play,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import { AnimatedNumber, EASE_SWISS, SPRING_SNAPPY } from './MotionPrimitives';
import { playClick, playSuccess } from '../utils/sound';

interface TacticalSocTelemetryBoardProps {
  completedIslandsCount: number;
  totalIslandsCount: number;
  neutralizedAttacksCount: number;
  solvedDebugCount: number;
  ctfFlagsCount: number;
  onOpenLabs: () => void;
}

type TelemetryState = 'nominal' | 'ddos' | 'mitigated';

export const TacticalSocTelemetryBoard: React.FC<TacticalSocTelemetryBoardProps> = ({
  completedIslandsCount,
  totalIslandsCount,
  neutralizedAttacksCount,
  solvedDebugCount,
  ctfFlagsCount,
  onOpenLabs,
}) => {
  const prefersReduced = useReducedMotion();
  const [mode, setMode] = useState<TelemetryState>('nominal');
  const [playing, setPlaying] = useState(true);

  const isRunning = playing && !prefersReduced;
  const isDdos = mode === 'ddos';
  const isMitigated = mode === 'mitigated';

  const explanationNote = isDdos
    ? 'Un pic de requêtes SYN sature le pare-feu. Cliquez sur « Activer Mitigation WAF » pour observer comment les SYN cookies absorbent la charge.'
    : isMitigated
      ? 'Le filtrage WAF absorbe le trafic anormal et vos serveurs DMZ restent sereinement accessibles pour vos utilisateurs.'
      : 'Le trafic sur la DMZ est calme. Testez « SYN Flood (DDoS) » pour voir concrètement comment le réseau réagit sous pression.';

  const healthPct = isDdos ? 64.2 : isMitigated ? 99.4 : 99.8;
  const throughputGbps = isDdos ? 8.4 : isMitigated ? 4.15 : 1.4;
  const blockedRps = isDdos ? 14280 : isMitigated ? 4150 : 128;

  const waveformPath = isDdos
    ? 'M 0 92 L 24 84 L 46 38 L 68 80 L 92 22 L 116 74 L 140 16 L 164 68 L 188 18 L 212 62 L 236 24 L 262 56 L 290 26 L 320 34'
    : isMitigated
      ? 'M 0 92 L 24 82 L 46 42 L 68 74 L 92 28 L 116 64 L 144 50 L 176 52 L 212 49 L 250 53 L 288 50 L 320 52'
      : 'M 0 88 L 32 82 L 64 78 L 96 74 L 128 70 L 160 72 L 192 66 L 224 68 L 256 64 L 288 67 L 320 63';

  const waveformArea = `${waveformPath} L 320 110 L 0 110 Z`;

  return (
    <section
      aria-label="Console Tactique SOC et Télémétrie Réseau"
      className="rounded-2xl border border-slate-200 dark:border-cyan-500/25 bg-slate-950 text-slate-100 overflow-hidden shadow-lg"
    >
      {/* Top Operations Header Strip */}
      <div className="px-5 py-3.5 bg-[#070D19] border-b border-slate-800/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-sm sm:text-base font-bold tracking-tight text-white">
              Salle de Veille SOC &amp; Réseau en Direct
            </h2>
            <p className="text-xs text-slate-400">
              Observez le chemin des paquets en temps réel et testez une protection anti-DDoS sans risque
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Santé DMZ</span>
            <span
              className={`font-bold tabular-nums ${
                isDdos ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {healthPct.toFixed(1)}%
            </span>
          </div>
          <span className="text-slate-700" aria-hidden="true">
            |
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Débit</span>
            <span className="font-bold text-cyan-300 tabular-nums">
              {throughputGbps.toFixed(2)} Gbps
            </span>
          </div>
          <span className="text-slate-700" aria-hidden="true">
            |
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Filtrés/s</span>
            <span className="font-bold text-amber-300 tabular-nums">
              <AnimatedNumber value={blockedRps} />
            </span>
          </div>
        </div>
      </div>

      {/* Mode Controls Bar */}
      <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
          {(
            [
              {
                id: 'nominal',
                label: 'Flux Nominal',
                icon: ShieldCheck,
                activeColor: 'text-emerald-200',
                pillBg: 'bg-emerald-600/25 border border-emerald-500/40',
              },
              {
                id: 'ddos',
                label: 'SYN Flood (DDoS)',
                icon: ShieldAlert,
                activeColor: 'text-rose-200',
                pillBg: 'bg-rose-600/25 border border-rose-500/40',
              },
              {
                id: 'mitigated',
                label: 'Mitigation WAF Active',
                icon: Zap,
                activeColor: 'text-cyan-200',
                pillBg: 'bg-cyan-600/25 border border-cyan-500/40',
              },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'mitigated') {
                    playSuccess();
                  } else {
                    playClick();
                  }
                  setMode(item.id);
                }}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  active ? item.activeColor : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="soc-telemetry-mode"
                    transition={SPRING_SNAPPY}
                    className={`absolute inset-0 rounded-lg ${item.pillBg}`}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {isDdos && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                playSuccess();
                setMode('mitigated');
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors whitespace-nowrap"
            >
              Activer Mitigation WAF
            </motion.button>
          )}
          <button
            type="button"
            onClick={() => {
              playClick();
              setPlaying((p) => !p);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {playing ? 'Pause' : 'Lire'}
          </button>
        </div>
      </div>

      {/* Main Split Telemetry Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/90">
        {/* Left 7 cols: Live Kinetic Network Topology */}
        <div className="lg:col-span-7 p-4 sm:p-5 bg-[#080F1E] relative overflow-hidden">
          {isRunning && (
            <div
              aria-hidden="true"
              className="soc-scan-beam pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-cyan-400/[0.06] to-transparent"
            />
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className="font-medium text-slate-300">Vue en direct du réseau protégé</span>
            <span
              className={
                isDdos
                  ? 'text-rose-400 font-semibold'
                  : isMitigated
                    ? 'text-cyan-300 font-semibold'
                    : 'text-emerald-400 font-semibold'
              }
            >
              {isDdos
                ? 'Alerte · Pic SYN Flood détecté'
                : isMitigated
                  ? 'Protection WAF · Trafic stabilisé'
                  : 'Trafic normal · Chiffrement TLS 1.3'}
            </span>
          </div>

          <svg
            viewBox="0 0 640 216"
            className="w-full h-auto max-h-[216px]"
            role="img"
            aria-label="Topologie tactique SOC entre Internet, Pare-feu WAF, Serveurs Web DMZ et Base de données"
          >
            {/* Subtle coordinate backdrop */}
            <defs>
              <pattern id="socGridPattern" width="32" height="32" patternUnits="userSpaceOnUse">
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="rgba(56,189,248,0.08)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect x="0" y="0" width="640" height="216" rx="12" fill="url(#socGridPattern)" />

            {/* Conduit 1: Internet -> Firewall WAF */}
            <path
              d="M 116 108 L 236 108"
              fill="none"
              stroke={isDdos ? '#FB7185' : '#38BDF8'}
              strokeOpacity="0.3"
              strokeWidth="4"
            />
            <path
              d="M 116 108 L 236 108"
              fill="none"
              stroke={isDdos ? '#F43F5E' : isMitigated ? '#F59E0B' : '#38BDF8'}
              strokeWidth="2.5"
              strokeDasharray="6 8"
              className={isRunning ? 'flow-dash' : ''}
            />

            {/* Conduit 2: Firewall -> DMZ Web Servers (split curved paths) */}
            <path
              d="M 324 108 C 362 108, 368 62, 412 62"
              fill="none"
              stroke={isDdos ? '#F43F5E' : '#10B981'}
              strokeOpacity="0.32"
              strokeWidth="3.5"
            />
            <path
              d="M 324 108 C 362 108, 368 62, 412 62"
              fill="none"
              stroke={isDdos ? '#FB7185' : '#34D399'}
              strokeWidth="2.2"
              strokeDasharray="6 8"
              className={isRunning ? 'flow-dash' : ''}
            />

            <path
              d="M 324 108 C 362 108, 368 154, 412 154"
              fill="none"
              stroke={isDdos ? '#F43F5E' : '#10B981'}
              strokeOpacity="0.32"
              strokeWidth="3.5"
            />
            <path
              d="M 324 108 C 362 108, 368 154, 412 154"
              fill="none"
              stroke={isDdos ? '#FB7185' : '#34D399'}
              strokeWidth="2.2"
              strokeDasharray="6 8"
              className={isRunning ? 'flow-dash' : ''}
            />

            {/* Conduit 3: Web Servers -> Database */}
            <path
              d="M 498 62 C 524 62, 526 108, 544 108"
              fill="none"
              stroke="#22D3EE"
              strokeOpacity="0.35"
              strokeWidth="2.5"
            />
            <path
              d="M 498 154 C 524 154, 526 108, 544 108"
              fill="none"
              stroke="#22D3EE"
              strokeOpacity="0.35"
              strokeWidth="2.5"
            />

            {/* Kinetic animated packets */}
            {isRunning && (
              <>
                <motion.circle
                  r="4.5"
                  cy="108"
                  fill={isDdos ? '#FB7185' : '#38BDF8'}
                  initial={{ cx: 120, opacity: 0.9 }}
                  animate={{ cx: [120, 232], opacity: [0.2, 1, 1, 0.2] }}
                  transition={{
                    duration: isDdos ? 0.65 : 1.35,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
                {isDdos && (
                  <motion.circle
                    r="4"
                    cy="108"
                    fill="#F43F5E"
                    initial={{ cx: 120, opacity: 0.9 }}
                    animate={{ cx: [120, 232], opacity: [0.2, 1, 1, 0.2] }}
                    transition={{
                      duration: 0.65,
                      delay: 0.32,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                )}
                <motion.circle
                  r="4"
                  fill={isDdos ? '#FB7185' : '#34D399'}
                  initial={{ cx: 328, cy: 108, opacity: 0.9 }}
                  animate={{
                    cx: [328, 368, 410],
                    cy: [108, 68, 62],
                    opacity: [0.2, 1, 0.3],
                  }}
                  transition={{ duration: 1.4, delay: 0.25, repeat: Infinity, ease: 'linear' }}
                />
                <motion.circle
                  r="4"
                  fill={isDdos ? '#FB7185' : '#22D3EE'}
                  initial={{ cx: 328, cy: 108, opacity: 0.9 }}
                  animate={{
                    cx: [328, 368, 410],
                    cy: [108, 148, 154],
                    opacity: [0.2, 1, 0.3],
                  }}
                  transition={{ duration: 1.4, delay: 0.7, repeat: Infinity, ease: 'linear' }}
                />
              </>
            )}

            {/* Node: Internet */}
            <rect
              x="18"
              y="72"
              width="98"
              height="72"
              rx="10"
              fill="#0F172A"
              stroke={isDdos ? '#F43F5E' : '#38BDF8'}
              strokeWidth="1.6"
            />
            <text x="67" y="102" textAnchor="middle" className="fill-white text-[11px] font-bold">
              INTERNET
            </text>
            <text
              x="67"
              y="120"
              textAnchor="middle"
              className="fill-slate-400 text-[9.5px] font-mono"
            >
              {isDdos ? 'Botnet /24' : 'Clients WAN'}
            </text>

            {/* Node: Firewall WAF */}
            <rect
              x="236"
              y="62"
              width="88"
              height="92"
              rx="10"
              fill={isDdos ? '#2A0F18' : isMitigated ? '#082A36' : '#09261E'}
              stroke={isDdos ? '#F43F5E' : isMitigated ? '#22D3EE' : '#10B981'}
              strokeWidth="2"
            />
            <text x="280" y="96" textAnchor="middle" className="fill-white text-[11px] font-bold">
              FW-01 WAF
            </text>
            <text
              x="280"
              y="115"
              textAnchor="middle"
              className={`text-[9.5px] font-mono font-bold ${
                isDdos ? 'fill-rose-300' : isMitigated ? 'fill-cyan-300' : 'fill-emerald-300'
              }`}
            >
              {isDdos ? 'SURCHARGE' : isMitigated ? 'SYN COOKIES' : 'ACL ACTIF'}
            </text>
            <text
              x="280"
              y="134"
              textAnchor="middle"
              className="fill-slate-400 text-[9px] font-mono"
            >
              443/TCP
            </text>

            {/* Node: WS-01 */}
            <rect
              x="412"
              y="32"
              width="86"
              height="60"
              rx="10"
              fill="#0F172A"
              stroke="#34D399"
              strokeWidth="1.5"
            />
            <text x="455" y="58" textAnchor="middle" className="fill-white text-[10.5px] font-bold">
              WS-01 DMZ
            </text>
            <text
              x="455"
              y="75"
              textAnchor="middle"
              className="fill-emerald-300 text-[9px] font-mono"
            >
              Nginx · TLS
            </text>

            {/* Node: WS-02 */}
            <rect
              x="412"
              y="124"
              width="86"
              height="60"
              rx="10"
              fill="#0F172A"
              stroke="#22D3EE"
              strokeWidth="1.5"
            />
            <text x="455" y="150" textAnchor="middle" className="fill-white text-[10.5px] font-bold">
              API-02 DMZ
            </text>
            <text
              x="455"
              y="167"
              textAnchor="middle"
              className="fill-cyan-300 text-[9px] font-mono"
            >
              OAuth2 · JWT
            </text>

            {/* Node: DB-01 */}
            <rect
              x="544"
              y="72"
              width="80"
              height="72"
              rx="10"
              fill="#0F172A"
              stroke="#6366F1"
              strokeWidth="1.5"
            />
            <text x="584" y="102" textAnchor="middle" className="fill-white text-[11px] font-bold">
              DB-01
            </text>
            <text
              x="584"
              y="120"
              textAnchor="middle"
              className="fill-indigo-300 text-[9px] font-mono"
            >
              VLAN Privé
            </text>
          </svg>
        </div>

        {/* Right 5 cols: DDoS Mitigation Waveform + Real Learner SOC Readiness */}
        <div className="lg:col-span-5 p-4 sm:p-5 bg-[#0B1222] flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Activité réseau &amp; protection WAF</span>
              <span className={`font-mono ${isDdos ? 'text-rose-400 font-bold' : 'text-cyan-300 font-bold'}`}>
                {isDdos ? 'Pic 8,4 Gbps' : isMitigated ? 'Plafond WAF 4,15 Gbps' : 'Stable 1,40 Gbps'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#070D19] p-2.5 overflow-hidden">
              <svg
                viewBox="0 0 320 112"
                className="w-full h-[96px]"
                role="img"
                aria-label="Courbe télémétrique du trafic réseau et de la mitigation WAF"
              >
                <defs>
                  <linearGradient id="socWaveFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isDdos ? '#F43F5E' : '#22D3EE'}
                      stopOpacity="0.38"
                    />
                    <stop
                      offset="100%"
                      stopColor={isDdos ? '#F43F5E' : '#22D3EE'}
                      stopOpacity="0.02"
                    />
                  </linearGradient>
                </defs>
                {/* Horizontal grid guides */}
                <line x1="0" y1="28" x2="320" y2="28" stroke="rgba(148,163,184,0.12)" />
                <line x1="0" y1="56" x2="320" y2="56" stroke="rgba(148,163,184,0.12)" />
                <line x1="0" y1="84" x2="320" y2="84" stroke="rgba(148,163,184,0.12)" />

                {/* WAF mitigation ceiling line */}
                {isMitigated && (
                  <line
                    x1="0"
                    y1="50"
                    x2="320"
                    y2="50"
                    stroke="#10B981"
                    strokeDasharray="4 4"
                    strokeWidth="1.4"
                  />
                )}

                <motion.path
                  d={waveformArea}
                  fill="url(#socWaveFill)"
                  animate={{ d: waveformArea }}
                  transition={{ duration: 0.45, ease: EASE_SWISS }}
                />
                <motion.path
                  d={waveformPath}
                  fill="none"
                  stroke={isDdos ? '#FB7185' : '#22D3EE'}
                  strokeWidth="2.2"
                  animate={{ d: waveformPath }}
                  transition={{ duration: 0.45, ease: EASE_SWISS }}
                />
              </svg>
            </div>
          </div>

          {/* Real Learner Telemetry Counters (zero mock data) */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
              <div className="text-[11px] text-slate-400">Attaques stoppées</div>
              <div className="text-base font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
                {neutralizedAttacksCount}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Flag className="w-3 h-3 text-amber-400" />
                Drapeaux CTF
              </div>
              <div className="text-base font-mono font-bold text-amber-300 tabular-nums mt-0.5">
                {ctfFlagsCount} / 5
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
              <div className="text-[11px] text-slate-400">Incidents résolus</div>
              <div className="text-base font-mono font-bold text-cyan-300 tabular-nums mt-0.5">
                {solvedDebugCount}
              </div>
            </div>
          </div>

          {/* Direct Plain-French Explanation Note */}
          <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="min-w-0 text-xs leading-relaxed text-slate-300">
              <span className="font-semibold text-white">Ce que vous observez : </span>
              {explanationNote}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400 font-mono tabular-nums">
              Votre avancée : {completedIslandsCount}/{totalIslandsCount} îles
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                playClick();
                onOpenLabs();
              }}
              className="inline-flex items-center gap-1.5 font-semibold text-cyan-300 hover:text-cyan-200 transition-colors whitespace-nowrap"
            >
              <Terminal className="w-3.5 h-3.5" />
              S&apos;entraîner dans les labos SOC →
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
};
