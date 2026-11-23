import React, { useEffect, useState } from 'react';
import { Gauge, Play, RotateCcw, Info } from 'lucide-react';
import { playClick, playSuccess } from '../../utils/sound';

interface ConnectionProfile {
  id: string;
  label: string;
  mbps: number;
  latencyMs: number;
  usage: string;
  barColor: string;
}

const CONNECTIONS: ConnectionProfile[] = [
  {
    id: 'adsl',
    label: 'ADSL Cuivre',
    mbps: 15,
    latencyMs: 38,
    usage: 'Navigation simple, 1 flux vidéo HD',
    barColor: 'bg-amber-600',
  },
  {
    id: '4g',
    label: '4G Mobile',
    mbps: 60,
    latencyMs: 32,
    usage: 'Télétravail nomade, visioconférence',
    barColor: 'bg-sky-600',
  },
  {
    id: 'wifi6',
    label: 'Wi-Fi 6 (WLAN)',
    mbps: 600,
    latencyMs: 6,
    usage: 'Plusieurs postes & streaming 4K local',
    barColor: 'bg-teal-600',
  },
  {
    id: '5g',
    label: '5G / Fibre 1G',
    mbps: 1000,
    latencyMs: 12,
    usage: 'Cloud, sauvegardes rapides, jeux',
    barColor: 'bg-indigo-600',
  },
  {
    id: 'fibre10g',
    label: 'Fibre 10 Gbit/s',
    mbps: 10000,
    latencyMs: 3,
    usage: 'Interconnexion Datacenter / MAN',
    barColor: 'bg-emerald-600',
  },
];

const FILE_PRESETS = [
  { label: 'Photo HD (10 Mo)', mb: 10 },
  { label: 'Mise à jour OS (500 Mo)', mb: 500 },
  { label: 'Film 4K (4 000 Mo)', mb: 4000 },
  { label: 'Backup Serveur (20 000 Mo)', mb: 20000 },
];

function formatDuration(seconds: number): string {
  if (seconds < 0.1) return '< 0,1 s';
  if (seconds < 60) return `${seconds.toFixed(1).replace('.', ',')} s`;
  const mins = Math.floor(seconds / 60);
  const rem = Math.round(seconds % 60);
  if (mins < 60) return `${mins} min ${rem < 10 ? '0' : ''}${rem} s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs} h ${remMins} min`;
}

export const BandwidthCalculatorLab: React.FC = () => {
  const [fileSizeMb, setFileSizeMb] = useState<number>(500);
  const [racing, setRacing] = useState(false);
  const [elapsedSimSec, setElapsedSimSec] = useState(0);

  // Compute slowest reasonable reference time so the visual race completes within ~8 seconds real time
  const maxTransferSeconds = (fileSizeMb * 8) / CONNECTIONS[0].mbps;
  const speedMultiplier = Math.max(1, maxTransferSeconds / 7);

  useEffect(() => {
    if (!racing) return;
    const interval = window.setInterval(() => {
      setElapsedSimSec((prev) => {
        const next = prev + 0.08 * speedMultiplier;
        if (next >= maxTransferSeconds) {
          setRacing(false);
          playSuccess();
          return maxTransferSeconds;
        }
        return next;
      });
    }, 80);
    return () => window.clearInterval(interval);
  }, [racing, speedMultiplier, maxTransferSeconds]);

  const handleStartRace = () => {
    playClick();
    setElapsedSimSec(0);
    setRacing(true);
  };

  const handleReset = () => {
    playClick();
    setRacing(false);
    setElapsedSimSec(0);
  };

  const fileSizeMbits = fileSizeMb * 8;

  return (
    <div className="space-y-6">
      {/* Top Controls & Bits vs Bytes Formula */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
                Simulateur de débit réel
              </p>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                Choisissez la taille du fichier à transférer
              </h2>
            </div>
            <span className="font-mono text-lg font-bold text-sky-700 dark:text-sky-400 tabular-nums">
              {fileSizeMb.toLocaleString('fr-FR')} Mo
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  playClick();
                  setRacing(false);
                  setElapsedSimSec(0);
                  setFileSizeMb(preset.mb);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  fileSizeMb === preset.mb
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-600 text-sky-900 dark:text-sky-200'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="filesize-range"
              className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400"
            >
              <span>Ajuster librement (10 Mo à 20 000 Mo)</span>
              <span className="font-mono tabular-nums">
                = {fileSizeMbits.toLocaleString('fr-FR')} Mbits
              </span>
            </label>
            <input
              id="filesize-range"
              type="range"
              min={10}
              max={20000}
              step={10}
              value={fileSizeMb}
              onChange={(e) => {
                setRacing(false);
                setElapsedSimSec(0);
                setFileSizeMb(Number(e.target.value));
              }}
              className="w-full accent-sky-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleStartRace}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              {racing ? 'Course en cours...' : 'Lancer la course de téléchargement'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Educational Conversion Box: Bits vs Octets */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-sky-300 font-semibold">
              <Info className="w-4 h-4" />
              <span>Le piège classique : Mbit/s ≠ Mo/s</span>
            </div>
            <h3 className="font-display text-lg font-bold text-white">
              Pourquoi diviser le débit par 8 ?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Les opérateurs affichent le débit en <strong className="text-white">mégabits par seconde (Mbit/s)</strong>,
              alors que la taille de vos fichiers est mesurée en{' '}
              <strong className="text-white">mégaoctets (Mo)</strong>. Comme{' '}
              <span className="font-mono text-amber-300">1 octet = 8 bits</span>, il faut toujours
              diviser par 8 pour connaître le vrai débit en Mo/s !
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 space-y-1.5 font-mono text-xs">
            <p className="text-slate-400">Exemple avec une Fibre 1 Gbit/s (1 000 Mbit/s) :</p>
            <p className="text-emerald-400 font-semibold tabular-nums">
              1 000 Mbit/s ÷ 8 = 125 Mo/s max
            </p>
            <p className="text-slate-300 pt-1">
              Débit = largeur de l&apos;autoroute · Latence (ping) = temps du premier aller-retour.
            </p>
          </div>
        </div>
      </div>

      {/* Live Race Comparison Bars */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-sky-700 dark:text-sky-400" />
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Comparaison des 5 technologies pour {fileSizeMb.toLocaleString('fr-FR')} Mo
            </h3>
          </div>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {racing || elapsedSimSec > 0
              ? `Temps simulé : ${formatDuration(elapsedSimSec)} (accéléré ×${speedMultiplier.toFixed(1)})`
              : 'Cliquez sur « Lancer la course » pour animer'}
          </span>
        </div>

        <div className="space-y-4">
          {CONNECTIONS.map((conn) => {
            const moPerSec = conn.mbps / 8;
            const totalSec = fileSizeMb / moPerSec;
            const progressPct =
              elapsedSimSec === 0 && !racing
                ? 0
                : Math.min(100, Math.round((elapsedSimSec / totalSec) * 100));
            const finished = progressPct >= 100;

            return (
              <div
                key={conn.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-display font-bold text-slate-900 dark:text-slate-100">
                      {conn.label}
                    </span>
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                      {conn.mbps >= 1000 ? `${conn.mbps / 1000} Gbit/s` : `${conn.mbps} Mbit/s`} (
                      {moPerSec.toFixed(moPerSec < 10 ? 2 : 0)} Mo/s)
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      Ping ~{conn.latencyMs} ms
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs font-bold tabular-nums">
                    <span
                      className={
                        finished
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }
                    >
                      {finished ? 'Terminé · ' : ''}
                      {formatDuration(totalSec)}
                    </span>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-100 ${
                      finished ? 'bg-emerald-600' : conn.barColor
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">{conn.usage}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
