import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Play,
  RotateCcw,
  Server,
  ShieldAlert,
  Split,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island5BossStormGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

type BossState = 'READY' | 'ACTIVE' | 'VICTORY' | 'TIMEOUT';

export const Island5BossStormGame: React.FC<Island5BossStormGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [bossState, setBossState] = useState<BossState>('READY');
  const [timeLeft, setTimeLeft] = useState(50);

  // Runbook states
  const [zoneAIsolated, setZoneAIsolated] = useState(false);
  const [lbEnabled, setLbEnabled] = useState(false);
  const [zoneBReplicas, setZoneBReplicas] = useState(1);
  const [dbRestored, setDbRestored] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "La tempête frappe l'Île Est (Zone A). Préparez votre plan de reprise !"
  );

  const startBoss = () => {
    playClick();
    setBossState('ACTIVE');
    setTimeLeft(50);
    setZoneAIsolated(false);
    setLbEnabled(false);
    setZoneBReplicas(1);
    setDbRestored(false);
    setStatusMessage(
      'ALERTE : Zone A hors service ! Isolez la Zone A puis basculez le Load Balancer vers la Zone B.'
    );
  };

  useEffect(() => {
    if (bossState !== 'ACTIVE') return;
    const timer = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          playError();
          setBossState('TIMEOUT');
          setStatusMessage('Temps écoulé ! La tempête a interrompu les services de Cyberland.');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [bossState]);

  const handleIsolateZoneA = () => {
    if (bossState !== 'ACTIVE' || zoneAIsolated) return;
    playSuccess();
    setZoneAIsolated(true);
    setStatusMessage(
      'Étape 1/4 validée : Zone A isolée. Activez maintenant le Load Balancer vers la Zone B.'
    );
  };

  const handleEnableLb = () => {
    if (bossState !== 'ACTIVE' || lbEnabled) return;
    if (!zoneAIsolated) {
      playError();
      setStatusMessage(
        "Attention : isolez d'abord la Zone A sinistrée pour éviter d'y envoyer des requêtes en erreur !"
      );
      return;
    }
    playSuccess();
    setLbEnabled(true);
    setStatusMessage(
      'Étape 2/4 validée : 100 % du trafic redirigé vers la Zone B ! Augmentez ses réplicas à 3 pour absorber la charge.'
    );
  };

  const handleScaleZoneB = () => {
    if (bossState !== 'ACTIVE' || zoneBReplicas >= 3) return;
    const next = zoneBReplicas + 1;
    setZoneBReplicas(next);
    if (next === 3) {
      playSuccess();
      setStatusMessage(
        'Étape 3/4 validée : Zone B dimensionnée (3 réplicas). Restaurez maintenant la base depuis un Snapshot SAIN !'
      );
    } else {
      playClick();
      setStatusMessage(`Réplica ajouté sur la Zone B (${next}/3). Encore ${3 - next} pour absorber le trafic.`);
    }
  };

  const handleRestoreSnapshot = (snapshot: 'corrupted' | 'clean-recent' | 'old') => {
    if (bossState !== 'ACTIVE' || dbRestored) return;
    if (!lbEnabled || zoneBReplicas < 3) {
      playError();
      setStatusMessage(
        "Stabilisez d'abord le Load Balancer et les 3 réplicas sur la Zone B avant de restaurer les données."
      );
      return;
    }

    if (snapshot === 'corrupted') {
      playError();
      setTimeLeft((t) => Math.max(1, t - 6));
      setStatusMessage(
        'Snapshot corrompu par la tempête ! (-6 secondes). Choisissez un cliché marqué SAIN et récent.'
      );
      return;
    }

    if (snapshot === 'old') {
      playError();
      setStatusMessage(
        'Ce cliché date de 7 jours (perte de données trop importante). Un Snapshot SAIN plus récent est disponible !'
      );
      return;
    }

    const stars = timeLeft >= 25 ? 3 : timeLeft >= 12 ? 2 : 1;
    playVictory();
    setDbRestored(true);
    setBossState('VICTORY');
    setStatusMessage(
      `Cyberland sauvé en ${50 - timeLeft} secondes (${stars}/3 étoiles) ! Trafic 100 % sain sur Zone B et données restaurées.`
    );
    onComplete(stars);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 65% Crisis Control Stage */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-semibold">
            Boss Final · Sauve Cyberland de la tempête
          </span>
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <span>
              Chrono :{' '}
              <strong className={timeLeft <= 15 ? 'text-red-300' : 'text-amber-300'}>
                {timeLeft}s
              </strong>
            </span>
            <span>
              Étapes :{' '}
              <strong>
                {[zoneAIsolated, lbEnabled, zoneBReplicas >= 3, dbRestored].filter(Boolean).length}{' '}
                / 4
              </strong>
            </span>
          </div>
        </div>

        <div className="p-6 bg-[#EEF5FA] space-y-5 min-h-[360px] flex flex-col justify-center">
          {bossState === 'READY' && (
            <div className="max-w-lg mx-auto text-center space-y-4">
              <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
              <h3 className="font-display text-2xl font-bold text-slate-900">
                Alerte tempête sur la Zone A !
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Vous avez <strong>50 secondes</strong> pour sauver les services de l&apos;archipel :
                isoler la Zone A en panne, basculer le Load Balancer vers la Zone B, monter 3
                réplicas et restaurer le dernier Snapshot sain.
              </p>
              <button
                type="button"
                onClick={startBoss}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                Lancer le plan de reprise
              </button>
            </div>
          )}

          {bossState === 'ACTIVE' && (
            <>
              {/* Live Architecture Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded-xl border-2 space-y-1.5 ${
                    zoneAIsolated
                      ? 'bg-slate-100 border-slate-300 text-slate-600'
                      : 'bg-red-50 border-red-400 text-red-950'
                  }`}
                >
                  <p className="text-xs font-mono font-semibold">ZONE A · ÎLE EST</p>
                  <p className="font-display text-base font-bold">
                    {zoneAIsolated ? 'Isolée (Hors circuit)' : 'PANNE CRITIQUE'}
                  </p>
                  <p className="text-xs">
                    {zoneAIsolated ? '0 % du trafic envoyé' : '50 % requêtes en erreur 503'}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border-2 space-y-1.5 ${
                    lbEnabled
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                      : 'bg-amber-50 border-amber-400 text-amber-950'
                  }`}
                >
                  <p className="text-xs font-mono font-semibold">LOAD BALANCER</p>
                  <p className="font-display text-base font-bold">
                    {lbEnabled ? 'Failover Zone B actif' : 'Répartition dégradée'}
                  </p>
                  <p className="text-xs">
                    {lbEnabled ? '100 % routé vers Zone B' : 'En attente de bascule'}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border-2 space-y-1.5 ${
                    zoneBReplicas >= 3
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                      : 'bg-white border-sky-300 text-slate-900'
                  }`}
                >
                  <p className="text-xs font-mono font-semibold">ZONE B · ÎLE OUEST</p>
                  <p className="font-display text-base font-bold tabular-nums">
                    {zoneBReplicas} / 3 réplicas actifs
                  </p>
                  <p className="text-xs">
                    {zoneBReplicas >= 3 ? 'Capacité optimale' : 'Surcharge imminente'}
                  </p>
                </div>
              </div>

              {/* Action Console */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <p className="text-xs font-semibold text-slate-500">
                  Commandes d&apos;intervention d&apos;urgence
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    disabled={zoneAIsolated}
                    onClick={handleIsolateZoneA}
                    className={`p-3 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-2 ${
                      zoneAIsolated
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {zoneAIsolated ? '1. Zone A isolée ✓' : '1. Isoler la Zone A'}
                  </button>

                  <button
                    type="button"
                    disabled={lbEnabled}
                    onClick={handleEnableLb}
                    className={`p-3 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-2 ${
                      lbEnabled
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-sky-700 text-white border-sky-700 hover:bg-sky-800'
                    }`}
                  >
                    <Split className="w-4 h-4 shrink-0" />
                    {lbEnabled ? '2. Load Balancer OK ✓' : '2. Basculer vers Zone B'}
                  </button>

                  <button
                    type="button"
                    disabled={zoneBReplicas >= 3}
                    onClick={handleScaleZoneB}
                    className={`p-3 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-2 ${
                      zoneBReplicas >= 3
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-sky-700 text-white border-sky-700 hover:bg-sky-800'
                    }`}
                  >
                    <Server className="w-4 h-4 shrink-0" />
                    {zoneBReplicas >= 3
                      ? '3. 3 Réplicas actifs ✓'
                      : `3. Ajouter réplica (${zoneBReplicas}/3)`}
                  </button>
                </div>

                {/* Step 4: Snapshot choice */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-sky-700" />
                    4. Sélectionner la sauvegarde Cloud (Snapshot) à restaurer :
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleRestoreSnapshot('corrupted')}
                      className="p-3 text-left rounded-lg border border-slate-200 hover:border-red-400 hover:bg-red-50 transition-colors"
                    >
                      <p className="font-mono text-xs font-bold text-slate-900">snap-12h00</p>
                      <p className="text-[11px] text-red-700">Pendant panne · Intégrité douteuse</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRestoreSnapshot('clean-recent')}
                      className="p-3 text-left rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                    >
                      <p className="font-mono text-xs font-bold text-slate-900">snap-11h55</p>
                      <p className="text-[11px] text-emerald-800">Il y a 5 min · SAIN (Zone B)</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRestoreSnapshot('old')}
                      className="p-3 text-left rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-colors"
                    >
                      <p className="font-mono text-xs font-bold text-slate-900">snap-J-7</p>
                      <p className="text-[11px] text-slate-600">Il y a 7 jours · SAIN (ancien)</p>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {(bossState === 'VICTORY' || bossState === 'TIMEOUT') && (
            <div className="max-w-md mx-auto text-center space-y-4">
              {bossState === 'VICTORY' ? (
                <CheckCircle2 className="w-11 h-11 text-emerald-600 mx-auto" />
              ) : (
                <AlertTriangle className="w-11 h-11 text-red-600 mx-auto" />
              )}
              <h3 className="font-display text-2xl font-bold text-slate-900">
                {bossState === 'VICTORY'
                  ? "L'Archipel Cyberland est sauvé !"
                  : 'Tempête victorieuse'}
              </h3>
              <p className="text-sm text-slate-600">
                {bossState === 'VICTORY'
                  ? 'Vous maîtrisez la haute disponibilité Multi-AZ, le Load Balancing et la restauration de sauvegardes Cloud. Badge Sauveur de l’Archipel débloqué (+350 XP) !'
                  : 'Rejouez la procédure de crise en suivant l’ordre des 4 étapes de reprise.'}
              </p>
              <button
                type="button"
                onClick={startBoss}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Rejouer le défi final
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-white border-t border-slate-200 text-xs text-slate-700">
          {statusMessage}
        </div>
      </div>

      {/* Right PRA Checklist */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-slate-900">
            Plan de Reprise d&apos;Activité
          </h3>
          <p className="text-xs text-slate-600">
            Suivez cette procédure standard d&apos;ingénierie Cloud lors d&apos;une perte de zone.
          </p>
        </div>

        <ol className="space-y-2.5 text-xs">
          {[
            { label: 'Isoler la Zone A sinistrée', done: zoneAIsolated },
            { label: 'Basculer le Load Balancer vers la Zone B', done: lbEnabled },
            { label: 'Monter la capacité à 3 réplicas sur Zone B', done: zoneBReplicas >= 3 },
            { label: 'Restaurer le Snapshot SAIN le plus récent', done: dbRestored },
          ].map((step, i) => (
            <li
              key={step.label}
              className={`p-3 rounded-lg border flex items-center justify-between gap-2 ${
                step.done
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span>
                {i + 1}. {step.label}
              </span>
              <span className="font-mono text-[11px] shrink-0">
                {step.done ? 'OK' : 'À faire'}
              </span>
            </li>
          ))}
        </ol>

        {isCompleted && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
            Badge <strong>Sauveur de l&apos;Archipel</strong> débloqué !
          </div>
        )}
      </div>
    </div>
  );
};
