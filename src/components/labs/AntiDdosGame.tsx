import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, Play, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface AntiDdosGameProps {
  onWinBonusXp: () => void;
}

type DefenseState = 'READY' | 'PLAYING' | 'VICTORY' | 'DEFEAT';

// 20 ticks (~20 seconds): calm, medium botnet, massive DDoS, calm recovery
const BOTNET_WAVE = [
  15, 20, 45, 95, 180, 260, 310, 220, 90, 40, 25, 110, 290, 380, 420, 360, 190, 80, 35, 15,
];
const LEGIT_WAVE = [
  60, 65, 70, 75, 80, 85, 80, 75, 70, 65, 60, 70, 85, 90, 85, 80, 75, 70, 65, 60,
];

export const AntiDdosGame: React.FC<AntiDdosGameProps> = ({ onWinBonusXp }) => {
  const [state, setState] = useState<DefenseState>('READY');
  const [tick, setTick] = useState(0);
  const [serverHp, setServerHp] = useState(100);
  const [cdnActive, setCdnActive] = useState(false);
  const [rateLimitActive, setRateLimitActive] = useState(false);
  const [wafBotnetActive, setWafBotnetActive] = useState(false);
  const [legitServed, setLegitServed] = useState(0);
  const [legitTotal, setLegitTotal] = useState(0);
  const [statusLog, setStatusLog] = useState(
    'Activez vos boucliers au bon moment pour absorber les pics DDoS sans bloquer les visiteurs légitimes.'
  );

  const botTraffic = BOTNET_WAVE[Math.min(tick, BOTNET_WAVE.length - 1)];
  const legitTraffic = LEGIT_WAVE[Math.min(tick, LEGIT_WAVE.length - 1)];

  // Filtered traffic reaching origin server
  const botFiltered =
    botTraffic *
    (wafBotnetActive ? 0.25 : 1) *
    (rateLimitActive ? 0.45 : 1) *
    (cdnActive ? 0.75 : 1);

  const originLoad = Math.round(legitTraffic * (cdnActive ? 0.5 : 1) + botFiltered);
  const serverCapacity = 135;

  const startGame = () => {
    playClick();
    setState('PLAYING');
    setTick(0);
    setServerHp(100);
    setCdnActive(false);
    setRateLimitActive(false);
    setWafBotnetActive(false);
    setLegitServed(0);
    setLegitTotal(0);
    setStatusLog('Surveillance du port active : attention à la première vague botnet !');
  };

  useEffect(() => {
    if (state !== 'PLAYING') return;
    const timer = window.setInterval(() => {
      setTick((prevTick) => {
        const bot = BOTNET_WAVE[prevTick];
        const legit = LEGIT_WAVE[prevTick];

        const residualBot =
          bot *
          (wafBotnetActive ? 0.25 : 1) *
          (rateLimitActive ? 0.45 : 1) *
          (cdnActive ? 0.75 : 1);

        const load = legit * (cdnActive ? 0.5 : 1) + residualBot;
        const overload = Math.max(0, load - serverCapacity);
        const hpLoss = overload > 0 ? Math.ceil(overload / 14) : 0;

        // Slight false positive penalty if strict WAF+RateLimit both active when botnet is very low
        const falsePositiveRatio =
          bot < 40 && wafBotnetActive && rateLimitActive ? 0.78 : overload > 40 ? 0.55 : 0.98;

        const nextLegitServed = legitServed + Math.round(legit * falsePositiveRatio);
        const nextLegitTotal = legitTotal + legit;
        setLegitServed(nextLegitServed);
        setLegitTotal(nextLegitTotal);

        const nextHp = Math.max(0, serverHp - hpLoss);
        setServerHp(nextHp);

        if (hpLoss > 0) {
          playError();
          setStatusLog(
            `Surcharge DDoS (${Math.round(load)} req/s > ${serverCapacity}) ! Activez CDN, Rate Limiting et WAF !`
          );
        } else if (bot >= 200) {
          setStatusLog('Attaque DDoS massive contenue par vos boucliers !');
        } else {
          setStatusLog('Trafic normal : gardez un œil sur la prochaine vague.');
        }

        if (nextHp <= 0) {
          playError();
          setState('DEFEAT');
          setStatusLog('Le serveur du port a cédé sous l’attaque DDoS !');
          return prevTick;
        }

        if (prevTick >= BOTNET_WAVE.length - 1) {
          playVictory();
          setState('VICTORY');
          setStatusLog('Toutes les vagues DDoS ont été repoussées avec succès (+100 XP) !');
          onWinBonusXp();
          return prevTick;
        }

        return prevTick + 1;
      });
    }, 900);

    return () => window.clearInterval(timer);
  }, [
    state,
    cdnActive,
    rateLimitActive,
    wafBotnetActive,
    serverHp,
    legitServed,
    legitTotal,
    onWinBonusXp,
  ]);

  const legitDeliveryPct =
    legitTotal === 0 ? 100 : Math.round((legitServed / legitTotal) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 65% Defense Radar */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-semibold">Mini-jeu · Bouclier Anti-DDoS</span>
          <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
            <span>
              Vague : <strong>{tick + 1}/{BOTNET_WAVE.length}</strong>
            </span>
            <span>
              Santé serveur :{' '}
              <strong className={serverHp <= 35 ? 'text-red-300' : 'text-emerald-300'}>
                {serverHp}%
              </strong>
            </span>
            <span>
              Clients servis : <strong>{legitDeliveryPct}%</strong>
            </span>
          </div>
        </div>

        <div className="p-6 bg-[#EEF5FA] dark:bg-slate-950/60 min-h-[320px] flex flex-col justify-center space-y-5">
          {state === 'READY' && (
            <div className="max-w-md mx-auto text-center space-y-4">
              <ShieldAlert className="w-10 h-10 text-sky-700 dark:text-sky-400 mx-auto" />
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                Repoussez la vague de botnets
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Un botnet tente de saturer le port de Cyberland. Combinez <strong>Cache CDN</strong>,{' '}
                <strong>Rate Limiting</strong> et <strong>WAF Botnet</strong> pour maintenir la
                charge sous {serverCapacity} req/s pendant 20 secondes.
              </p>
              <button
                type="button"
                onClick={startGame}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                Activer le radar DDoS
              </button>
            </div>
          )}

          {state === 'PLAYING' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Trafic légitime</p>
                  <p className="font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {legitTraffic} req/s
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Attaque Botnet brute</p>
                  <p className="font-mono text-xl font-bold text-red-700 dark:text-red-400 tabular-nums">
                    {botTraffic} req/s
                  </p>
                </div>
                <div
                  className={`border rounded-lg p-3.5 ${
                    originLoad > serverCapacity
                      ? 'bg-red-50 dark:bg-red-950/50 border-red-400 text-red-950 dark:text-red-100'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-950 dark:text-emerald-100'
                  }`}
                >
                  <p className="text-xs opacity-80">Charge atteignant le serveur</p>
                  <p className="font-mono text-xl font-bold tabular-nums">
                    {originLoad} / {serverCapacity}
                  </p>
                </div>
              </div>

              {/* Health bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-400">
                  <span>Santé du serveur d&apos;origine</span>
                  <span>{serverHp} %</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      serverHp <= 35 ? 'bg-red-600' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${serverHp}%` }}
                  />
                </div>
              </div>
            </>
          )}

          {(state === 'VICTORY' || state === 'DEFEAT') && (
            <div className="max-w-md mx-auto text-center space-y-4">
              {state === 'VICTORY' ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
              )}
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                {state === 'VICTORY' ? 'Attaque DDoS neutralisée !' : 'Serveur saturé'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {state === 'VICTORY'
                  ? `Santé restante : ${serverHp} % · Visiteurs légitimes servis : ${legitDeliveryPct} %. Bonus +100 XP attribué !`
                  : 'Pensez à activer rapidement le Cache CDN, le Rate Limiting et le filtre WAF lors des pics > 200 req/s.'}
              </p>
              <button
                type="button"
                onClick={startGame}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Rejouer la défense
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
          {statusLog}
        </div>
      </div>

      {/* Right 35% Shield Controls */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            Contre-mesures actives
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Activez vos filtres en direct pendant la vague d&apos;attaque.
          </p>
        </div>

        {[
          {
            label: 'Cache CDN en bordure',
            desc: 'Absorbe 50 % du trafic légitime et 25 % du bruit avant le serveur.',
            active: cdnActive,
            toggle: () => {
              playSuccess();
              setCdnActive((v) => !v);
            },
          },
          {
            label: 'Rate Limiting (Limitation de débit)',
            desc: 'Plafonne les requêtes répétitives par IP (-55 % botnet).',
            active: rateLimitActive,
            toggle: () => {
              playSuccess();
              setRateLimitActive((v) => !v);
            },
          },
          {
            label: 'Filtre WAF Anti-Botnet',
            desc: 'Inspecte les signatures et bloque 75 % des requêtes automatisées.',
            active: wafBotnetActive,
            toggle: () => {
              playSuccess();
              setWafBotnetActive((v) => !v);
            },
          },
        ].map((shield) => (
          <button
            key={shield.label}
            type="button"
            onClick={shield.toggle}
            className={`w-full text-left p-3.5 rounded-lg border transition-colors flex items-start justify-between gap-3 ${
              shield.active
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="space-y-0.5">
              <p className="text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {shield.label}
              </p>
              <p className="text-[11px] opacity-80">{shield.desc}</p>
            </div>
            <span className="font-mono text-[11px] font-bold shrink-0">
              {shield.active ? 'ON' : 'OFF'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
