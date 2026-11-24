import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Pause, Play, ShieldAlert, ShieldCheck } from 'lucide-react';
import { playClick } from '../utils/sound';

export const EASE_SWISS = [0.16, 1, 0.3, 1] as const;

export const SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 460,
  damping: 34,
  mass: 0.8,
};

export const SPRING_TOAST = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 30,
};

interface AnimatedNumberProps {
  value: number;
  formatter?: (n: number) => string;
  durationMs?: number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  formatter = (n) => Math.round(n).toLocaleString('fr-FR'),
  durationMs = 480,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (prefersReduced) {
      setDisplayValue(value);
      return;
    }

    let rafId = 0;
    const startValue = displayValue;
    const delta = value - startValue;
    if (delta === 0) return;

    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      // Ease out expo matching Swiss Technical settling curve
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplayValue(startValue + delta * eased);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(value);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs, prefersReduced]);

  return <span className={`tabular-nums ${className}`}>{formatter(displayValue)}</span>;
};

interface InteractiveNetworkFlowBannerProps {
  onOpenLabs: () => void;
}

export const InteractiveNetworkFlowBanner: React.FC<InteractiveNetworkFlowBannerProps> = ({
  onOpenLabs,
}) => {
  const prefersReduced = useReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [trafficMode, setTrafficMode] = useState<'legitimate' | 'attack'>('legitimate');

  const isRunning = playing && !prefersReduced;
  const isAttack = trafficMode === 'attack';

  return (
    <section
      aria-label="Démonstrateur de flux réseau actif"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-sky-700 dark:text-sky-400">
            Visualisation temps réel · Architecture Défense en Profondeur
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Flux réseau actif : Client → Routeur → Pare-feu → API Gateway
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                playClick();
                setTrafficMode('legitimate');
              }}
              className={`relative px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                !isAttack
                  ? 'text-emerald-900 dark:text-emerald-100'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {!isAttack && (
                <motion.span
                  layoutId="network-flow-mode"
                  transition={SPRING_SNAPPY}
                  className="absolute inset-0 rounded-md bg-white dark:bg-slate-900 shadow-sm"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Trafic HTTPS autorisé
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setTrafficMode('attack');
              }}
              className={`relative px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                isAttack
                  ? 'text-rose-900 dark:text-rose-100'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAttack && (
                <motion.span
                  layoutId="network-flow-mode"
                  transition={SPRING_SNAPPY}
                  className="absolute inset-0 rounded-md bg-white dark:bg-slate-900 shadow-sm"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Requête bloquée (WAF)
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              setPlaying((p) => !p);
            }}
            aria-label={playing ? 'Mettre en pause le flux' : 'Relancer le flux'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {playing ? 'Pause' : 'Lire'}
          </button>
        </div>
      </div>

      {/* Interactive Kinetic SVG Diagram */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F8FC] dark:bg-slate-950/75 p-3 sm:p-4 overflow-hidden">
        <svg
          viewBox="0 0 880 176"
          className="w-full h-auto max-h-[176px]"
          role="img"
          aria-label={
            isAttack
              ? 'Flux réseau montrant un paquet malveillant bloqué par le pare-feu WAF'
              : 'Flux réseau montrant un paquet HTTPS valide acheminé jusqu’à la passerelle API'
          }
        >
          {/* Connection tracks */}
          <path
            d="M 142 88 L 280 88"
            fill="none"
            stroke="#0284C7"
            strokeOpacity="0.35"
            strokeWidth="3"
          />
          <path
            d="M 142 88 L 280 88"
            fill="none"
            stroke={isAttack ? '#E11D48' : '#0284C7'}
            strokeWidth="2.5"
            strokeDasharray="6 8"
            className={isRunning ? 'flow-dash' : ''}
          />

          <path
            d="M 380 88 C 430 88, 442 64, 496 78"
            fill="none"
            stroke={isAttack ? '#E11D48' : '#0284C7'}
            strokeOpacity="0.32"
            strokeWidth="3"
          />
          <path
            d="M 380 88 C 430 88, 442 112, 496 98"
            fill="none"
            stroke={isAttack ? '#E11D48' : '#0284C7'}
            strokeWidth="2.5"
            strokeDasharray="6 8"
            className={isRunning ? 'flow-dash' : ''}
          />

          <path
            d="M 596 88 L 724 88"
            fill="none"
            stroke={isAttack ? '#94A3B8' : '#059669'}
            strokeOpacity={isAttack ? '0.28' : '0.4'}
            strokeWidth="3"
          />
          {!isAttack && (
            <path
              d="M 596 88 L 724 88"
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeDasharray="6 8"
              className={isRunning ? 'flow-dash' : ''}
            />
          )}

          {/* Animated Kinetic Packets */}
          {isRunning && (
            <>
              <motion.circle
                r="5.5"
                cy="88"
                fill={isAttack ? '#E11D48' : '#0284C7'}
                initial={{ cx: 146, opacity: 0.9 }}
                animate={{ cx: [146, 276], opacity: [0.3, 1, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              <motion.circle
                r="5.5"
                cy="88"
                fill={isAttack ? '#E11D48' : '#0284C7'}
                initial={{ cx: 382, opacity: 0.9 }}
                animate={{ cx: [382, 494], opacity: [0.3, 1, 1, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.45 }}
              />
              {!isAttack && (
                <motion.circle
                  r="5.5"
                  cy="88"
                  fill="#059669"
                  initial={{ cx: 600, opacity: 0.9 }}
                  animate={{ cx: [600, 720], opacity: [0.3, 1, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.9 }}
                />
              )}
            </>
          )}

          {/* Node 1: Client PC */}
          <g>
            <rect
              x="22"
              y="44"
              width="120"
              height="88"
              rx="14"
              className="fill-white dark:fill-slate-900 stroke-sky-600/60"
              strokeWidth="1.8"
            />
            <text
              x="82"
              y="78"
              textAnchor="middle"
              className="fill-slate-900 dark:fill-slate-100 text-[12px] font-bold"
            >
              Client Poste
            </text>
            <text
              x="82"
              y="98"
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
            >
              192.168.1.42
            </text>
            <text
              x="82"
              y="116"
              textAnchor="middle"
              className={`text-[10px] font-mono font-semibold ${
                isAttack ? 'fill-rose-600 dark:fill-rose-400' : 'fill-sky-700 dark:fill-sky-400'
              }`}
            >
              {isAttack ? 'SQLi / Scan' : 'TLS 1.3 · 443'}
            </text>
          </g>

          {/* Node 2: Router */}
          <g>
            <rect
              x="280"
              y="44"
              width="100"
              height="88"
              rx="14"
              className="fill-white dark:fill-slate-900 stroke-sky-600/60"
              strokeWidth="1.8"
            />
            <text
              x="330"
              y="78"
              textAnchor="middle"
              className="fill-slate-900 dark:fill-slate-100 text-[12px] font-bold"
            >
              Routeur L3
            </text>
            <text
              x="330"
              y="98"
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
            >
              NAT · BGP
            </text>
            <text
              x="330"
              y="116"
              textAnchor="middle"
              className="fill-sky-700 dark:fill-sky-400 text-[10px] font-mono font-semibold"
            >
              Routage IP
            </text>
          </g>

          {/* Node 3: Firewall / WAF */}
          <g>
            <rect
              x="496"
              y="40"
              width="100"
              height="96"
              rx="14"
              className={
                isAttack
                  ? 'fill-rose-50 dark:fill-rose-950/60 stroke-rose-600'
                  : 'fill-emerald-50 dark:fill-emerald-950/50 stroke-emerald-600'
              }
              strokeWidth="2"
            />
            <text
              x="546"
              y="74"
              textAnchor="middle"
              className="fill-slate-900 dark:fill-slate-100 text-[12px] font-bold"
            >
              Pare-feu WAF
            </text>
            <text
              x="546"
              y="96"
              textAnchor="middle"
              className={`text-[10px] font-mono font-bold ${
                isAttack ? 'fill-rose-700 dark:fill-rose-300' : 'fill-emerald-700 dark:fill-emerald-300'
              }`}
            >
              {isAttack ? 'DROP · HTTP 403' : 'ALLOW · ACL OK'}
            </text>
            <text
              x="546"
              y="116"
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400 text-[9.5px] font-mono"
            >
              Inspection L4/L7
            </text>
          </g>

          {/* Node 4: API Gateway & Services */}
          <g opacity={isAttack ? 0.55 : 1}>
            <rect
              x="724"
              y="44"
              width="134"
              height="88"
              rx="14"
              className="fill-white dark:fill-slate-900 stroke-emerald-600/60"
              strokeWidth="1.8"
            />
            <text
              x="791"
              y="78"
              textAnchor="middle"
              className="fill-slate-900 dark:fill-slate-100 text-[12px] font-bold"
            >
              API Gateway
            </text>
            <text
              x="791"
              y="98"
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
            >
              JWT RS256 · DMZ
            </text>
            <text
              x="791"
              y="116"
              textAnchor="middle"
              className="fill-emerald-700 dark:fill-emerald-400 text-[10px] font-mono font-semibold"
            >
              {isAttack ? 'Protégé (0 impact)' : 'HTTP 200 OK'}
            </text>
          </g>

          {/* Status caption */}
          <text
            x="660"
            y="74"
            textAnchor="middle"
            className={`text-[10px] font-mono font-bold ${
              isAttack ? 'fill-rose-700 dark:fill-rose-400' : 'fill-emerald-700 dark:fill-emerald-400'
            }`}
          >
            {isAttack ? 'BLOQUÉ' : 'AUTORISÉ'}
          </text>
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
        <span>
          {isAttack
            ? 'Le pare-feu applicatif intercepte la signature malveillante avant qu’elle n’atteigne la DMZ.'
            : 'Le paquet chiffré TLS 1.3 traverse le routeur, passe l’ACL du pare-feu et valide son jeton JWT sur la passerelle.'}
        </span>
        <button
          type="button"
          onClick={() => {
            playClick();
            onOpenLabs();
          }}
          className="font-semibold text-sky-700 dark:text-sky-400 hover:underline whitespace-nowrap"
        >
          Tester en condition réelle dans les Laboratoires →
        </button>
      </div>
    </section>
  );
};
