import React, { useMemo, useState } from 'react';
import { CheckCircle2, Leaf, RotateCcw, Coins, Activity, Star } from 'lucide-react';
import { playClick, playSuccess, playVictory } from '../../utils/sound';

interface Island6EcoCloudGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

type RegionChoice = 'charbon' | 'mixte' | 'bas-carbone';
type SizingChoice = 'xxl-fixe' | 'adapte' | 'autoscale';

export const Island6EcoCloudGame: React.FC<Island6EcoCloudGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [region, setRegion] = useState<RegionChoice>('charbon');
  const [sizing, setSizing] = useState<SizingChoice>('xxl-fixe');
  const [nightShutdown, setNightShutdown] = useState(false);
  const [cleanupOrphans, setCleanupOrphans] = useState(false);
  const [validated, setValidated] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const metrics = useMemo(() => {
    // Baseline: charbon + xxl-fixe + no night shutdown + no cleanup = 140 kg CO2, 320 gold, 99.5% uptime
    let co2 = 110;
    let cost = 260;
    let uptime = 99.6;

    if (sizing === 'adapte') {
      co2 -= 32;
      cost -= 80;
      uptime = 99.4;
    } else if (sizing === 'autoscale') {
      co2 -= 48;
      cost -= 105;
      uptime = 99.9;
    }

    if (nightShutdown) {
      co2 -= 20;
      cost -= 45;
    }

    if (cleanupOrphans) {
      co2 -= 12;
      cost -= 30;
    }

    // Region carbon intensity multiplier
    if (region === 'mixte') {
      co2 = Math.round(co2 * 0.72);
    } else if (region === 'bas-carbone') {
      co2 = Math.round(co2 * 0.42);
      cost += 8; // tiny green premium easily offset by right-sizing
    }

    return {
      co2: Math.max(8, co2),
      cost: Math.max(40, cost),
      uptime,
    };
  }, [region, sizing, nightShutdown, cleanupOrphans]);

  const meetsCo2 = metrics.co2 <= 35;
  const meetsCost = metrics.cost <= 160;
  const meetsUptime = metrics.uptime >= 99.0;
  const isOptimal = meetsCo2 && meetsCost && meetsUptime;

  const handleValidate = () => {
    if (!isOptimal) {
      playClick();
      setValidated(true);
      return;
    }

    const stars =
      metrics.co2 <= 18 && metrics.cost <= 100
        ? 3
        : metrics.co2 <= 28 && metrics.cost <= 135
        ? 2
        : 1;

    setEarnedStars(stars);
    setValidated(true);
    playVictory();
    onComplete(stars);
  };

  const handleReset = () => {
    playClick();
    setRegion('charbon');
    setSizing('xxl-fixe');
    setNightShutdown(false);
    setCleanupOrphans(false);
    setValidated(false);
    setEarnedStars(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 65% Interactive Eco-Cloud Telemetry & Levers */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-semibold">Mini-jeu · Défi Éco-Cloud (FinOps &amp; Green IT)</span>
          <span className="font-mono text-xs text-slate-300">
            Cibles : ≤ 35 kg CO₂ · ≤ 160 or · ≥ 99 % dispo
          </span>
        </div>

        <div className="p-6 bg-[#EEF5FA] space-y-6">
          {/* Live KPI gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-xl border ${
                meetsCo2
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between text-xs opacity-75">
                <span>Empreinte carbone</span>
                <Leaf className="w-4 h-4" />
              </div>
              <p className="font-mono text-2xl font-bold tabular-nums mt-1">
                {metrics.co2} <span className="text-xs font-normal">kg CO₂/mois</span>
              </p>
              <p className="text-[11px] mt-1 font-medium">
                {meetsCo2 ? 'Objectif atteint (≤ 35 kg)' : 'Trop élevé (cible ≤ 35 kg)'}
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                meetsCost
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between text-xs opacity-75">
                <span>Facture Cloud</span>
                <Coins className="w-4 h-4" />
              </div>
              <p className="font-mono text-2xl font-bold tabular-nums mt-1">
                {metrics.cost} <span className="text-xs font-normal">or/mois</span>
              </p>
              <p className="text-[11px] mt-1 font-medium">
                {meetsCost ? 'Budget maîtrisé (≤ 160 or)' : 'Dépassement (cible ≤ 160 or)'}
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-300 text-emerald-950">
              <div className="flex items-center justify-between text-xs opacity-75">
                <span>Disponibilité</span>
                <Activity className="w-4 h-4" />
              </div>
              <p className="font-mono text-2xl font-bold tabular-nums mt-1">
                {metrics.uptime.toFixed(1)} %
              </p>
              <p className="text-[11px] mt-1 font-medium">Conforme SLA (≥ 99,0 %)</p>
            </div>
          </div>

          {/* 4 FinOps / Green IT Levers */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            {/* Lever 1: Region */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-900">
                1. Choix de la région du centre de données
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(
                  [
                    { id: 'charbon' as RegionChoice, label: 'Région fossile', sub: 'Électricité très carbonée' },
                    { id: 'mixte' as RegionChoice, label: 'Région mixte', sub: 'Mix énergétique moyen' },
                    { id: 'bas-carbone' as RegionChoice, label: 'Région bas carbone', sub: 'Hydraulique / solaire / décarbonée' },
                  ]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setRegion(item.id);
                      setValidated(false);
                    }}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      region === item.id
                        ? 'bg-sky-50 border-sky-600 text-sky-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[11px] text-slate-600">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Lever 2: Sizing */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-900">
                2. Dimensionnement des serveurs (Right-Sizing)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(
                  [
                    { id: 'xxl-fixe' as SizingChoice, label: 'Serveurs XXL fixes', sub: '15 % CPU utilisé en moyenne' },
                    { id: 'adapte' as SizingChoice, label: 'Taille ajustée', sub: 'Calibré au trafic moyen' },
                    { id: 'autoscale' as SizingChoice, label: 'Right-Sizing + Auto-Scaling', sub: 'Capacité élastique optimale' },
                  ]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setSizing(item.id);
                      setValidated(false);
                    }}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      sizing === item.id
                        ? 'bg-sky-50 border-sky-600 text-sky-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[11px] text-slate-600">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Levers 3 & 4: Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={nightShutdown}
                  onChange={(e) => {
                    playSuccess();
                    setNightShutdown(e.target.checked);
                    setValidated(false);
                  }}
                  className="mt-0.5 w-4 h-4 accent-emerald-700"
                />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-slate-900">3. Extinction nocturne (Dev/Test)</p>
                  <p className="text-slate-600">
                    Coupe automatiquement les serveurs hors production entre 20h et 7h.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanupOrphans}
                  onChange={(e) => {
                    playSuccess();
                    setCleanupOrphans(e.target.checked);
                    setValidated(false);
                  }}
                  className="mt-0.5 w-4 h-4 accent-emerald-700"
                />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-slate-900">4. Purge des stockages orphelins</p>
                  <p className="text-slate-600">
                    Supprime 320 Go d&apos;anciens snapshots inutilisés et logs périmés.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {validated && (
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isOptimal
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-start gap-3 text-xs">
                <CheckCircle2
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    isOptimal ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                />
                <div className="space-y-1">
                  <p className="font-bold text-sm">
                    {isOptimal
                      ? `Architecture Éco-Cloud validée (${earnedStars}/3 étoiles) !`
                      : 'Optimisation encore insuffisante'}
                  </p>
                  <p>
                    {isOptimal
                      ? 'Vous avez divisé par plus de 5 l’empreinte carbone et réduit la facture tout en gardant 99,9 % de disponibilité. Badge Éco-Architecte débloqué (+250 XP) !'
                      : 'Activez une région bas carbone, ajustez le dimensionnement et éliminez les gaspillages nocturnes ou de stockage.'}
                  </p>
                </div>
              </div>
              {isOptimal && (
                <div className="flex items-center gap-1 shrink-0">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${
                        s <= earnedStars
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right 35% Actions & Scoring */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-slate-900">Audit FinOps &amp; Carbone</h3>
          <p className="text-xs text-slate-600">
            Ajustez les 4 leviers à gauche puis déployez votre architecture optimisée.
          </p>
        </div>

        <div className="space-y-2 text-xs border-t border-b border-slate-100 py-4">
          <p className="font-semibold text-slate-900">Barème des étoiles</p>
          <p className="text-slate-600">1 ★ : ≤ 35 kg CO₂ et ≤ 160 or</p>
          <p className="text-slate-600">2 ★ : ≤ 28 kg CO₂ et ≤ 135 or</p>
          <p className="text-slate-600">3 ★ : ≤ 18 kg CO₂ et ≤ 100 or (Sobriété exemplaire)</p>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleValidate}
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
          >
            Déployer cette configuration
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
        </div>

        {isCompleted && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
            Badge <strong>Éco-Architecte Cloud</strong> validé !
          </div>
        )}
      </div>
    </div>
  );
};
