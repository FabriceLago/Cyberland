import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  Flame,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

type DisasterId = 'disk' | 'ransomware' | 'fire';

export const BackupPraLab: React.FC = () => {
  const [frequencyHours, setFrequencyHours] = useState<number>(24);
  const [hasLocalCopy, setHasLocalCopy] = useState(true);
  const [hasOffsiteCopy, setHasOffsiteCopy] = useState(false);
  const [hasImmutableWorm, setHasImmutableWorm] = useState(false);
  const [restoreTested, setRestoreTested] = useState(false);
  const [bandwidthGbps, setBandwidthGbps] = useState<number>(1);
  const [disasterResult, setDisasterResult] = useState<{
    disaster: DisasterId;
    survived: boolean;
    headline: string;
    detail: string;
  } | null>(null);

  const dataVolumeGb = 500;
  // RPO = backup cadence
  const rpoHours = frequencyHours;
  // RTO = volume / bandwidth + verification overhead
  const transferMinutes = Math.round(((dataVolumeGb * 8) / bandwidthGbps) / 60);
  const rtoMinutes = transferMinutes + (restoreTested ? 15 : 75);

  const rule321Score =
    (hasLocalCopy ? 1 : 0) +
    (hasOffsiteCopy ? 1 : 0) +
    (hasImmutableWorm ? 1 : 0) +
    (restoreTested ? 1 : 0);

  const triggerDisaster = (type: DisasterId) => {
    if (type === 'disk') {
      if (hasLocalCopy || hasOffsiteCopy) {
        playSuccess();
        setDisasterResult({
          disaster: type,
          survived: true,
          headline: `Crash disque absorbé ! Reprise estimée en ${rtoMinutes} min (RPO ${rpoHours}h).`,
          detail: 'La copie secondaire permet de reconstruire le serveur sans perte définitive.',
        });
      } else {
        playError();
        setDisasterResult({
          disaster: type,
          survived: false,
          headline: 'Perte totale : aucune sauvegarde disponible !',
          detail: 'Activez au moins une sauvegarde locale et une copie hors-site.',
        });
      }
      return;
    }

    if (type === 'ransomware') {
      if (hasImmutableWorm && hasOffsiteCopy && restoreTested) {
        playVictory();
        setDisasterResult({
          disaster: type,
          survived: true,
          headline: `Ransomware vaincu sans rançon ! Restauration propre en ${rtoMinutes} min.`,
          detail:
            'Vos snapshots immuables WORM hors-site n’ont pas pu être chiffrés et la procédure de restauration était déjà testée.',
        });
      } else {
        playError();
        setDisasterResult({
          disaster: type,
          survived: false,
          headline: 'Échec PRA face au Ransomware !',
          detail: !hasImmutableWorm
            ? 'Les attaquants ont aussi chiffré vos sauvegardes en ligne : activez l’immutabilité WORM (Object Lock) !'
            : 'Assurez-vous d’avoir une copie hors-site ET un test de restauration validé.',
        });
      }
      return;
    }

    // Datacenter fire
    if (hasOffsiteCopy) {
      playVictory();
      setDisasterResult({
        disaster: type,
        survived: true,
        headline: `Incendie Datacenter surmonté ! Bascule hors-site en ${rtoMinutes} min.`,
        detail: `Grâce à la copie géographique distante (règle 3-2-1), l’activité redémarre avec un RPO maximal de ${rpoHours}h.`,
      });
    } else {
      playError();
      setDisasterResult({
        disaster: type,
        survived: false,
        headline: 'Perte complète : toutes vos copies étaient dans le même bâtiment !',
        detail: 'La règle 3-2-1 impose au moins 1 copie stockée sur un site géographique distant.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <DatabaseBackup className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Labo Sauvegarde &amp; Plan de Reprise d’Activité (PRA · RPO / RTO)
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Configurez votre architecture de sauvegarde <strong>3-2-1-1-0</strong>, mesurez vos indicateurs <strong>RPO / RTO</strong> en direct puis déclenchez des sinistres réels.
        </p>
      </div>

      {/* Live RPO / RTO KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-4">
          <div className="text-xs font-semibold text-slate-500">RPO (Perte max de données)</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
            {rpoHours} h
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Dépend de la fréquence des snapshots
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-4">
          <div className="text-xs font-semibold text-slate-500">RTO (Temps de reprise · 500 Go)</div>
          <div className="text-2xl font-black text-sky-700 dark:text-sky-400 mt-1 tabular-nums">
            {rtoMinutes} min
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Débit {bandwidthGbps} Gbit/s + procédure {restoreTested ? 'testée' : 'non testée'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-4">
          <div className="text-xs font-semibold text-slate-500">Conformité 3-2-1-1-0</div>
          <div
            className={`text-2xl font-black mt-1 tabular-nums ${
              rule321Score === 4
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {rule321Score}/4 piliers
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {rule321Score === 4 ? 'Architecture résiliente validée' : 'Activez hors-site + immuable + test'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Configuration Panel */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            1. Paramétrer votre stratégie de sauvegarde
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                Fréquence des backups (impacte RPO)
              </label>
              <select
                value={frequencyHours}
                onChange={(e) => {
                  playClick();
                  setFrequencyHours(Number(e.target.value));
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value={24}>Toutes les 24h (1 fois / nuit)</option>
                <option value={6}>Toutes les 6h</option>
                <option value={1}>Toutes les 1h (RPO serré)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                Lien réseau de restauration (impacte RTO)
              </label>
              <select
                value={bandwidthGbps}
                onChange={(e) => {
                  playClick();
                  setBandwidthGbps(Number(e.target.value));
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value={1}>1 Gbit/s (Standard)</option>
                <option value={5}>5 Gbit/s (Fibre Pro)</option>
                <option value={10}>10 Gbit/s (Datacenter)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {[
              {
                label: 'Copie locale sur NAS distinct (2 supports différents)',
                checked: hasLocalCopy,
                toggle: () => setHasLocalCopy((v) => !v),
              },
              {
                label: 'Copie hors-site dans une autre région Cloud (1 hors-site)',
                checked: hasOffsiteCopy,
                toggle: () => setHasOffsiteCopy((v) => !v),
              },
              {
                label: 'Stockage Immuable WORM / Object Lock (anti-ransomware)',
                checked: hasImmutableWorm,
                toggle: () => setHasImmutableWorm((v) => !v),
              },
              {
                label: 'Exercice mensuel de restauration vérifié (0 erreur)',
                checked: restoreTested,
                toggle: () => setRestoreTested((v) => !v),
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  playClick();
                  item.toggle();
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-left text-xs font-semibold transition-colors ${
                  item.checked
                    ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-400 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>{item.label}</span>
                <span className="font-mono font-bold uppercase shrink-0">
                  {item.checked ? 'Actif' : 'Off'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Disaster Simulator */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-white p-5 space-y-4">
          <h3 className="text-sm font-extrabold flex items-center gap-2 text-rose-400">
            <Flame className="w-4 h-4" />
            2. Déclencher un sinistre pour tester votre PRA
          </h3>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => triggerDisaster('disk')}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900 hover:border-amber-500 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white">Crash Disque RAID Serveur</div>
                <div className="text-[11px] text-slate-400">Panne matérielle sur la machine principale</div>
              </div>
              <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => triggerDisaster('ransomware')}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900 hover:border-rose-500 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white">Attaque Ransomware Destructrice</div>
                <div className="text-[11px] text-slate-400">Tente de chiffrer serveur + sauvegardes montées</div>
              </div>
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => triggerDisaster('fire')}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900 hover:border-orange-500 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white">Incendie Datacenter Principal</div>
                <div className="text-[11px] text-slate-400">Perte totale de la salle serveur locale</div>
              </div>
              <Flame className="w-4 h-4 text-orange-400 shrink-0" />
            </button>
          </div>

          {disasterResult && (
            <div
              className={`rounded-xl border p-3.5 text-xs space-y-1 ${
                disasterResult.survived
                  ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-600 text-rose-200'
              }`}
            >
              <div className="font-extrabold flex items-center gap-1.5">
                {disasterResult.survived ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                {disasterResult.headline}
              </div>
              <p className="text-slate-200/90 leading-relaxed">{disasterResult.detail}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
