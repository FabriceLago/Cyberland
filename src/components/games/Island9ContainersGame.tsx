import React, { useState } from 'react';
import {
  Box,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Star,
  Plus,
  RefreshCw,
  Server,
} from 'lucide-react';
import { playClick, playError, playPacket, playSuccess, playVictory } from '../../utils/sound';

interface Island9ContainersGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

interface ContainerService {
  id: string;
  name: string;
  ramMb: number;
  status: 'stopped' | 'running' | 'crashed';
  replicas: number;
}

const INITIAL_SERVICES: ContainerService[] = [
  { id: 'billetterie', name: 'API Billetterie', ramMb: 90, status: 'stopped', replicas: 1 },
  { id: 'meteo', name: 'Service Météo', ramMb: 70, status: 'stopped', replicas: 1 },
  { id: 'paiement', name: 'Module Paiement', ramMb: 85, status: 'stopped', replicas: 1 },
  { id: 'cache', name: 'Cache Redis', ramMb: 60, status: 'stopped', replicas: 1 },
];

export const Island9ContainersGame: React.FC<Island9ContainersGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [imageBuilt, setImageBuilt] = useState(false);
  const [services, setServices] = useState<ContainerService[]>(INITIAL_SERVICES);
  const [crashSimulated, setCrashSimulated] = useState(false);
  const [crashRecovered, setCrashRecovered] = useState(false);
  const [vmTestTriggered, setVmTestTriggered] = useState(false);
  const [completedNow, setCompletedNow] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const totalContainerRam = services.reduce(
    (sum, s) => sum + (s.status === 'running' ? s.ramMb * s.replicas : 0),
    0
  );
  const allRunning = services.every((s) => s.status === 'running');
  const billetterieScaled = (services.find((s) => s.id === 'billetterie')?.replicas ?? 1) >= 3;

  const missionsDone = [imageBuilt, allRunning, crashRecovered, billetterieScaled].filter(
    Boolean
  ).length;

  const handleBuildImage = () => {
    playSuccess();
    setImageBuilt(true);
  };

  const handleStartAll = () => {
    if (!imageBuilt) {
      playError();
      return;
    }
    playPacket();
    setServices((prev) => prev.map((s) => ({ ...s, status: 'running' })));
  };

  const handleSimulateCrash = () => {
    if (!allRunning) {
      playError();
      return;
    }
    playError();
    setCrashSimulated(true);
    setServices((prev) =>
      prev.map((s) => (s.id === 'paiement' ? { ...s, status: 'crashed' } : s))
    );
  };

  const handleRestartService = (id: string) => {
    playSuccess();
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'running' } : s))
    );
    if (id === 'paiement' && crashSimulated) {
      setCrashRecovered(true);
    }
  };

  const handleScaleBilletterie = () => {
    if (!allRunning) {
      playError();
      return;
    }
    playPacket();
    setServices((prev) =>
      prev.map((s) =>
        s.id === 'billetterie' ? { ...s, replicas: Math.min(4, s.replicas + 1) } : s
      )
    );
  };

  const handleValidate = () => {
    if (missionsDone < 4) {
      playError();
      return;
    }
    const stars = totalContainerRam <= 560 && vmTestTriggered ? 3 : totalContainerRam <= 650 ? 2 : 1;
    setEarnedStars(stars);
    setCompletedNow(true);
    playVictory();
    onComplete(stars);
  };

  const handleReset = () => {
    playClick();
    setImageBuilt(false);
    setServices(INITIAL_SERVICES);
    setCrashSimulated(false);
    setCrashRecovered(false);
    setVmTestTriggered(false);
    setCompletedNow(false);
    setEarnedStars(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 65% Interactive Harbor Dock: VM vs Containers */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-semibold">
            Mini-jeu · Dock Master (Conteneurs Docker &amp; Microservices)
          </span>
          <span className="font-mono text-xs text-sky-200 tabular-nums">
            RAM Conteneurs : {totalContainerRam} Mo / 2 048 Mo (VM Monolithe : 2 048 Mo)
          </span>
        </div>

        <div className="p-6 bg-[#EEF5FA] dark:bg-slate-800/70 space-y-6">
          {/* Side-by-Side Comparison Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-amber-600" />
                  Ancien Cargo : VM Monolithique
                </span>
                <span className="font-mono text-amber-700 dark:text-amber-400">45 s démarrage</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Un système complet (OS invité + 4 services mélangés) consommant 2 048 Mo fixes. Si
                Paiement plante, tout le cargo redémarre !
              </p>
              <button
                type="button"
                onClick={() => {
                  playError();
                  setVmTestTriggered(true);
                }}
                className="text-xs font-semibold text-amber-800 dark:text-amber-300 underline"
              >
                {vmTestTriggered
                  ? 'Constaté : panne globale de 45 s sur la VM !'
                  : 'Tester une panne sur la VM (comparatif)'}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-sky-900 dark:text-sky-200 inline-flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-sky-600" />
                  Quai Moderne : Conteneurs Docker
                </span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">
                  2 s démarrage
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Chaque microservice voyage dans son propre conteneur léger partageant le noyau du
                navire hôte. Isolation totale et mise à l&apos;échelle ciblée !
              </p>
              <p className="text-xs font-mono text-sky-700 dark:text-sky-400 tabular-nums">
                Économie RAM actuelle : {Math.max(0, 2048 - totalContainerRam)} Mo
              </p>
            </div>
          </div>

          {/* Step 1: Build Docker Image */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Étape 1 · Empaquetage portable
                </p>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Construire l&apos;image Docker (Dockerfile → Image)
                </h3>
              </div>
              <button
                type="button"
                disabled={imageBuilt}
                onClick={handleBuildImage}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  imageBuilt
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-sky-700 hover:bg-sky-800 text-white'
                }`}
              >
                {imageBuilt ? 'Image construite ✓' : 'docker build -t cyberland:v1'}
              </button>
            </div>

            {/* Container Dock Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className={`p-4 rounded-xl border space-y-3 transition-colors ${
                    svc.status === 'crashed'
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-400 dark:border-red-800'
                      : svc.status === 'running'
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {svc.name}
                    </span>
                    <span
                      className={`font-mono text-[11px] font-semibold ${
                        svc.status === 'crashed'
                          ? 'text-red-700 dark:text-red-400'
                          : svc.status === 'running'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {svc.status === 'crashed'
                        ? 'CRASH ISOLÉ'
                        : svc.status === 'running'
                        ? `ACTIF ×${svc.replicas}`
                        : 'ARRÊTÉ'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                    <span>{svc.ramMb * svc.replicas} Mo RAM</span>
                    {svc.status === 'crashed' && (
                      <button
                        type="button"
                        onClick={() => handleRestartService(svc.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-sans font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Relancer (2 s)
                      </button>
                    )}
                    {svc.id === 'billetterie' && svc.status === 'running' && (
                      <button
                        type="button"
                        onClick={handleScaleBilletterie}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-sans font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-md"
                      >
                        <Plus className="w-3 h-3" />
                        Réplica ({svc.replicas}/3)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Dock Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={!imageBuilt || allRunning}
                onClick={handleStartAll}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-45 rounded-lg transition-colors"
              >
                2. Déployer les 4 conteneurs
              </button>
              <button
                type="button"
                disabled={!allRunning || crashSimulated}
                onClick={handleSimulateCrash}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-950 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 disabled:opacity-45 rounded-lg transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                3. Simuler un crash sur Paiement
              </button>
            </div>
          </div>

          {completedNow && (
            <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-4 text-emerald-950 dark:text-emerald-200">
              <div className="space-y-1 text-xs">
                <p className="font-display text-lg font-bold">
                  Quai Conteneurs opérationnel ({earnedStars}/3 étoiles) !
                </p>
                <p>
                  Seul le conteneur Paiement a redémarré en 2 secondes pendant que la Météo et la
                  Billetterie restaient en ligne. Badge <strong>Capitaine Conteneurs</strong>{' '}
                  débloqué (+250 XP) !
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${
                      s <= earnedStars
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right 35% Dock Checklist */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            Check-list Dock Master
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Accomplissez les 4 manœuvres pour prouver la supériorité des conteneurs.
          </p>
        </div>

        <ul className="space-y-2.5 text-xs">
          {[
            { ok: imageBuilt, label: '1. Construire l’image Docker portable' },
            { ok: allRunning, label: '2. Démarrer les 4 microservices isolés' },
            { ok: crashRecovered, label: '3. Isoler et relancer Paiement sans couper le reste' },
            { ok: billetterieScaled, label: '4. Passer API Billetterie à 3 réplicas' },
          ].map((item) => (
            <li
              key={item.label}
              className={`flex items-start gap-2 ${
                item.ok
                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  item.ok ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-700'
                }`}
              />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>

        <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
          Bonus 3 ★ : testez aussi la panne sur l&apos;ancienne VM pour comparer l&apos;impact !
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={missionsDone < 4}
            onClick={handleValidate}
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 rounded-lg transition-colors"
          >
            Valider la mise en production
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser le quai
          </button>
        </div>

        {isCompleted && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200">
            Badge <strong>Capitaine Conteneurs</strong> validé !
          </div>
        )}
      </div>
    </div>
  );
};
