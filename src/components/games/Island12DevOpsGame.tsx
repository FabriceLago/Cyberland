import React, { useState } from 'react';
import {
  GitCommitHorizontal,
  Play,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Star,
  ArrowRightLeft,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island12DevOpsGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

type ReleaseAction = 'promote_green' | 'reject_bug' | 'rollback_blue' | 'deploy_canary';

interface PipelineRelease {
  id: string;
  version: string;
  commitMsg: string;
  unitTestsPassed: boolean;
  testLog: string;
  canaryErrorRate: number | null;
  expectedAction: ReleaseAction;
  feedback: string;
}

const RELEASES: PipelineRelease[] = [
  {
    id: 'rel-1',
    version: 'v2.1.0',
    commitMsg: 'feat(billetterie): ajout du tarif réduit étudiant',
    unitTestsPassed: true,
    testLog: '42/42 tests unitaires OK · Image Docker construite (48 Mo) · Vulnérabilités : 0',
    canaryErrorRate: 0.0,
    expectedAction: 'promote_green',
    feedback:
      'Tous les tests sont verts et le test sur la plateforme verte est sain : la bascule Blue/Green met v2.1.0 en production avec 0 seconde de coupure !',
  },
  {
    id: 'rel-2',
    version: 'v2.2.0-rc1',
    commitMsg: 'fix(paiement): refactor calcul TVA rapide',
    unitTestsPassed: false,
    testLog: 'ÉCHEC : 3 tests critiques échoués (TypeError sur montant nul) · Qualité : BLOQUÉ',
    canaryErrorRate: null,
    expectedAction: 'reject_bug',
    feedback:
      'Excellent réflexe CI : on ne déploie JAMAIS une version qui échoue aux tests automatisés. Le pipeline bloque le bug avant les utilisateurs.',
  },
  {
    id: 'rel-3',
    version: 'v2.2.1-canary',
    commitMsg: 'perf(cache): nouveau moteur de recherche des îles (10 % Canary)',
    unitTestsPassed: true,
    testLog: '45/45 tests OK · Déployé sur 10 % du trafic (Canary) → ALERTE : taux erreurs HTTP 500 à 24 % !',
    canaryErrorRate: 24,
    expectedAction: 'rollback_blue',
    feedback:
      'Un bug imprévu en production est apparu sur le déploiement Canary (10 %). Le Rollback instantané vers la version Blue saine protège 90 % des utilisateurs !',
  },
  {
    id: 'rel-4',
    version: 'v2.3.0',
    commitMsg: 'feat(meteo): nouvelle carte vents marins (tests OK, besoin test progressif)',
    unitTestsPassed: true,
    testLog: '48/48 tests OK · Changement majeur d’API → recommandation : exposer d’abord 10 % des visiteurs',
    canaryErrorRate: null,
    expectedAction: 'deploy_canary',
    feedback:
      'Déployer en mode Canary (10 % du trafic d’abord) limite les risques sur une grosse mise à jour avant de généraliser à 100 %.',
  },
];

export const Island12DevOpsGame: React.FC<Island12DevOpsGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [idx, setIdx] = useState(0);
  const [testsRun, setTestsRun] = useState(false);
  const [chosen, setChosen] = useState<ReleaseAction | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [prodVersion, setProdVersion] = useState('v2.0.0 (Blue)');
  const [finished, setFinished] = useState(false);

  const release = RELEASES[idx];

  const handleRunPipeline = () => {
    playClick();
    setTestsRun(true);
  };

  const handleDecision = (action: ReleaseAction) => {
    if (!testsRun || chosen) return;
    setChosen(action);
    if (action === release.expectedAction) {
      playSuccess();
      if (action === 'promote_green') setProdVersion(`${release.version} (Green → 100 %)`);
      if (action === 'rollback_blue') setProdVersion('v2.1.0 (Blue · Rollback sain)');
      if (action === 'deploy_canary') setProdVersion(`${release.version} (Canary 10 % actif)`);
    } else {
      playError();
      setMistakes((m) => m + 1);
    }
  };

  const handleNext = () => {
    playClick();
    if (idx + 1 >= RELEASES.length) {
      setFinished(true);
      const stars = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
      if (stars >= 2) playVictory();
      onComplete(stars);
    } else {
      setIdx((i) => i + 1);
      setTestsRun(false);
      setChosen(null);
    }
  };

  const handleReset = () => {
    playClick();
    setIdx(0);
    setTestsRun(false);
    setChosen(null);
    setMistakes(0);
    setProdVersion('v2.0.0 (Blue)');
    setFinished(false);
  };

  const earnedStars = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;

  if (finished) {
    return (
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-5">
        <div className="flex items-center justify-center gap-1.5 text-amber-500">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-7 h-7 ${
                s <= earnedStars ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-700'
              }`}
            />
          ))}
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Badge « Ingénieur DevOps CI/CD » débloqué !
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 tabular-nums">
            Toutes les livraisons ont été arbitrées ({mistakes} erreur{mistakes > 1 ? 's' : ''}) ·{' '}
            {earnedStars}/3 étoiles
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Rejouer le pipeline
        </button>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
            Mini-jeu · Chef de Pipeline CI/CD {isCompleted ? '· Déjà validé' : ''}
          </p>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Livraison {idx + 1} / {RELEASES.length} · {release.version}
          </h2>
        </div>
        <div className="text-right font-mono text-xs tabular-nums">
          <p className="text-slate-500 dark:text-slate-400">En production actuellement</p>
          <p className="font-bold text-emerald-700 dark:text-emerald-400">{prodVersion}</p>
        </div>
      </div>

      {/* Pipeline 4-Stage Visualizer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {[
          { step: '1. Git Commit', detail: release.version, status: 'done' },
          {
            step: '2. Tests Auto (CI)',
            detail: !testsRun
              ? 'En attente...'
              : release.unitTestsPassed
              ? 'PASS (Vert)'
              : 'ÉCHEC (Rouge)',
            status: !testsRun ? 'idle' : release.unitTestsPassed ? 'done' : 'fail',
          },
          {
            step: '3. Build Docker',
            detail: !testsRun ? 'En attente' : release.unitTestsPassed ? 'Image prête' : 'Annulé',
            status: !testsRun ? 'idle' : release.unitTestsPassed ? 'done' : 'fail',
          },
          {
            step: '4. Mise en prod (CD)',
            detail: chosen ? 'Arbitré' : 'Votre décision',
            status: chosen ? 'done' : 'idle',
          },
        ].map((stage) => (
          <div
            key={stage.step}
            className={`p-3.5 rounded-lg border space-y-1 ${
              stage.status === 'done'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                : stage.status === 'fail'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
                : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
            }`}
          >
            <p className="font-bold text-slate-900 dark:text-slate-100">{stage.step}</p>
            <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
              {stage.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Commit & Console Output */}
      <div className="bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2.5 border border-slate-800">
        <div className="flex items-center gap-2 text-sky-300">
          <GitCommitHorizontal className="w-4 h-4 shrink-0" />
          <span>commit {release.version} : {release.commitMsg}</span>
        </div>
        {!testsRun ? (
          <p className="text-slate-400">
            Cliquez sur « Lancer les tests CI & le monitoring » avant de décider la mise en production.
          </p>
        ) : (
          <p
            className={
              !release.unitTestsPassed || (release.canaryErrorRate ?? 0) > 5
                ? 'text-amber-300 font-semibold'
                : 'text-emerald-400 font-semibold'
            }
          >
            &gt; {release.testLog}
          </p>
        )}
      </div>

      {!testsRun ? (
        <button
          type="button"
          onClick={handleRunPipeline}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          Lancer les tests CI &amp; le monitoring
        </button>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Quelle action DevOps choisissez-vous pour cette livraison ?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                {
                  id: 'promote_green' as ReleaseAction,
                  label: 'Basculer Blue → Green (100 % prod)',
                  detail: 'Tests verts et sain : mise en ligne sans coupure.',
                  icon: ArrowRightLeft,
                },
                {
                  id: 'reject_bug' as ReleaseAction,
                  label: 'Bloquer & renvoyer au développeur',
                  detail: 'Empêcher un commit en échec CI d’atteindre la prod.',
                  icon: XCircle,
                },
                {
                  id: 'rollback_blue' as ReleaseAction,
                  label: 'Déclencher un Rollback vers Blue',
                  detail: 'Revenir en 1 clic à la version précédente face aux erreurs 500.',
                  icon: ShieldAlert,
                },
                {
                  id: 'deploy_canary' as ReleaseAction,
                  label: 'Déployer en Canary (10 % du trafic)',
                  detail: 'Tester une grosse évolution sur une fraction prudente des visites.',
                  icon: CheckCircle2,
                },
              ]
            ).map((btn) => {
              const Icon = btn.icon;
              const isPicked = chosen === btn.id;
              const isRight = btn.id === release.expectedAction;
              let cls =
                'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-900 dark:text-slate-100';
              if (chosen) {
                if (isRight) {
                  cls =
                    'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200';
                } else if (isPicked) {
                  cls =
                    'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-950 dark:text-red-200';
                } else {
                  cls =
                    'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500';
                }
              }

              return (
                <button
                  key={btn.id}
                  type="button"
                  disabled={Boolean(chosen)}
                  onClick={() => handleDecision(btn.id)}
                  className={`p-4 rounded-xl border text-left transition-colors space-y-1 ${cls}`}
                >
                  <div className="flex items-center gap-2 font-display text-sm font-bold">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{btn.label}</span>
                  </div>
                  <p className="text-xs opacity-80">{btn.detail}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {chosen && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
          <p className="leading-relaxed">
            <strong>{chosen === release.expectedAction ? 'Parfait !' : 'À retenir :'}</strong>{' '}
            {release.feedback}
          </p>
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {idx + 1 >= RELEASES.length ? 'Valider mon pipeline' : 'Livraison suivante →'}
          </button>
        </div>
      )}
    </section>
  );
};
