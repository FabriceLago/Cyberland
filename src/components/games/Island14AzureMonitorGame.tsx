import React, { useState } from 'react';
import {
  Activity,
  Database,
  BellRing,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Star,
  Server,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island14AzureMonitorGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

interface AzureMission {
  id: string;
  stepLabel: string;
  title: string;
  context: string;
  telemetryHint: string;
  options: { id: string; label: string; detail: string }[];
  correctId: string;
  explanation: string;
}

const MISSIONS: AzureMission[] = [
  {
    id: 'az-1',
    stepLabel: 'Mission 1/5 · Collecte Windows Server',
    title: 'Connecter 12 serveurs Windows Server à Azure Monitor',
    context:
      'Vous devez collecter les journaux Windows Security (EventID 4625) et les compteurs CPU de vos serveurs Windows sans installer de vieux agents obsolètes.',
    telemetryHint: 'Architecture recommandée Microsoft : agent unique moderne + règles centralisées.',
    options: [
      {
        id: 'a',
        label: 'Azure Monitor Agent (AMA) + Data Collection Rule (DCR)',
        detail: 'Agent unifié moderne filtrant précisément les événements et compteurs Windows',
      },
      {
        id: 'b',
        label: 'Ouvrir le port 23 Telnet sur chaque serveur Windows',
        detail: 'Protocole en clair obsolète sans collecte centralisée',
      },
      {
        id: 'c',
        label: 'Copier les fichiers C:\\Windows\\Logs sur une clé USB chaque vendredi',
        detail: 'Manuel, aucune supervision en temps réel',
      },
    ],
    correctId: 'a',
    explanation:
      'Azure Monitor Agent (AMA) associé aux Data Collection Rules (DCR) est le standard actuel pour collecter de façon sécurisée et filtrée les journaux et performances Windows & Linux.',
  },
  {
    id: 'az-2',
    stepLabel: 'Mission 2/5 · Metrics vs Log Analytics',
    title: 'Choisir le bon magasin de données pour une alerte CPU ultra-rapide',
    context:
      'Vous voulez déclencher un Auto-Scaling en moins d’une minute dès que le processeur d’un groupe de VM Windows dépasse 85 %.',
    telemetryHint: 'Besoin : série temporelle numérique légère, rafraîchie chaque minute à faible coût.',
    options: [
      {
        id: 'a',
        label: 'Azure Monitor Metrics (Série temporelle numérique)',
        detail: 'Ultra-rapide, léger et idéal pour les courbes et alertes temps réel',
      },
      {
        id: 'b',
        label: 'Archiver les logs dans un document PDF mensuel',
        detail: 'Inexploitable pour une alerte automatique',
      },
      {
        id: 'c',
        label: 'Exécuter un ping manuel depuis un poste de travail',
        detail: 'Ne mesure pas la charge CPU interne de la VM',
      },
    ],
    correctId: 'a',
    explanation:
      'Azure Monitor Metrics stocke des valeurs numériques horodatées ultra-rapides (CPU, RAM, réseau), idéales pour les graphiques temps réel et le déclenchement immédiat d’Autoscale.',
  },
  {
    id: 'az-3',
    stepLabel: 'Mission 3/5 · Requête KQL (Log Analytics)',
    title: 'Détecter une attaque brute-force RDP sur un serveur Windows',
    context:
      'Dans Log Analytics Workspace, quelle requête KQL permet de compter les échecs d’ouverture de session Windows (EventID 4625) par machine ?',
    telemetryHint: 'En KQL, on filtre avec « where » puis on agrège avec « summarize count() by ... ».',
    options: [
      {
        id: 'a',
        label: 'Event | where EventID == 4625 | summarize count() by Computer',
        detail: 'Filtre l’EventID 4625 puis compte les occurrences par serveur Windows',
      },
      {
        id: 'b',
        label: 'DELETE FROM Event WHERE EventID = 4625',
        detail: 'Instruction SQL destructive invalide en KQL',
      },
      {
        id: 'c',
        label: 'Heartbeat | where Port == 80',
        detail: 'La table Heartbeat vérifie la disponibilité de l’agent, pas les connexions Windows',
      },
    ],
    correctId: 'a',
    explanation:
      'Le langage KQL (Kusto Query Language) enchaîne les opérateurs par des pipes « | » : table Event → filtre EventID == 4625 → agrégation summarize count() by Computer.',
  },
  {
    id: 'az-4',
    stepLabel: 'Mission 4/5 · Application Insights (APM)',
    title: 'Trouver pourquoi la page de paiement met 2,4 secondes à répondre',
    context:
      'Le CPU des serveurs web est normal (35 %), mais les utilisateurs se plaignent de lenteurs sur POST /api/paiement. Quel module d’Azure Monitor inspecte les dépendances code ↔ base de données ?',
    telemetryHint: 'Cherchez l’outil d’Application Performance Monitoring (APM) qui trace chaque requête de bout en bout.',
    options: [
      {
        id: 'a',
        label: 'Application Insights (Application Map & End-to-End Transaction)',
        detail: 'Décompose la latence entre Web, API, appels SQL et exceptions applicatives',
      },
      {
        id: 'b',
        label: 'Le gestionnaire de fond d’écran Windows',
        detail: 'Aucun lien avec la supervision applicative',
      },
      {
        id: 'c',
        label: 'Uniquement la table DNS locale',
        detail: 'Ne mesure pas le temps d’exécution d’une requête SQL interne',
      },
    ],
    correctId: 'a',
    explanation:
      'Application Insights cartographie les dépendances (Application Map) et montre exactement quelle requête SQL ou API externe consomme les 2,4 secondes.',
  },
  {
    id: 'az-5',
    stepLabel: 'Mission 5/5 · Action Groups & Remédiation',
    title: 'Automatiser la réaction quand une alerte critique (Sev 1) se déclenche',
    context:
      'Votre règle d’alerte Azure Monitor détecte une panne du service IIS sur WIN-WEB-01 à 03h00 du matin. Quel composant exécute la notification ET l’action corrective automatique ?',
    telemetryHint: 'Un seul objet réutilisable regroupe SMS/Teams, Webhook, Azure Function et Automation Runbook.',
    options: [
      {
        id: 'a',
        label: 'Un Action Group (Notification Teams/SMS + Automation Runbook)',
        detail: 'Prévient l’équipe d’astreinte et relance automatiquement le service Windows',
      },
      {
        id: 'b',
        label: 'Désactiver définitivement toutes les alertes la nuit',
        detail: 'Laisse la panne active jusqu’au lendemain matin',
      },
      {
        id: 'c',
        label: 'Changer le protocole HTTPS en HTTP port 80',
        detail: 'Dégrade la sécurité sans corriger le service IIS',
      },
    ],
    correctId: 'a',
    explanation:
      'Les Action Groups d’Azure Monitor combinent notifications (e-mail, SMS, Teams, PagerDuty) et remédiation automatique (Runbook, Logic App, Webhook, Autoscale).',
  },
];

export const Island14AzureMonitorGame: React.FC<Island14AzureMonitorGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [idx, setIdx] = useState(0);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const mission = MISSIONS[idx];

  const handleValidate = () => {
    if (!chosenId || validated) return;
    setValidated(true);
    if (chosenId === mission.correctId) {
      playSuccess();
      setScore((s) => s + 1);
    } else {
      playError();
    }
  };

  const handleNext = () => {
    playClick();
    if (idx < MISSIONS.length - 1) {
      setIdx((i) => i + 1);
      setChosenId(null);
      setValidated(false);
    } else {
      const stars = score >= 5 ? 3 : score >= 3 ? 2 : 1;
      playVictory();
      setFinished(true);
      onComplete(stars);
    }
  };

  const handleRestart = () => {
    playClick();
    setIdx(0);
    setChosenId(null);
    setValidated(false);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const stars = score >= 5 ? 3 : score >= 3 ? 2 : 1;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-5 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-8 h-8 ${
                s <= stars ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-700'
              }`}
            />
          ))}
        </div>
        <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
          Supervision Azure Monitor maîtrisée — {score} / {MISSIONS.length} !
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Vous savez collecter les journaux Windows (AMA/DCR), interroger Log Analytics en KQL,
          tracer une panne avec Application Insights et automatiser vos Action Groups. Badge{' '}
          <strong>« Sentinelle Azure Monitor »</strong> débloqué !
        </p>
        <button
          type="button"
          onClick={handleRestart}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Rejouer les 5 missions
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 5 cols: Visual Architecture Telemetry Status */}
      <aside className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Activity className="w-4 h-4 text-sky-400" />
            Chaîne d&apos;observabilité Azure Monitor
          </span>
          <span className="font-mono text-xs text-slate-300 tabular-nums">
            Étape {idx + 1}/{MISSIONS.length}
          </span>
        </div>

        <div className="p-5 space-y-3">
          {[
            {
              step: 0,
              icon: Server,
              title: '1. Sources Windows & Azure + Agent AMA',
              desc: 'Event Logs, PerfCounters & Data Collection Rules (DCR)',
            },
            {
              step: 1,
              icon: Activity,
              title: '2. Azure Monitor Metrics',
              desc: 'Séries numériques temps réel (CPU, RAM, Réseau)',
            },
            {
              step: 2,
              icon: Database,
              title: '3. Log Analytics Workspace (KQL)',
              desc: 'Requêtes Kusto sur EventID, Syslog & audits',
            },
            {
              step: 3,
              icon: Activity,
              title: '4. Application Insights (APM)',
              desc: 'Traces applicatives, lenteurs SQL & exceptions',
            },
            {
              step: 4,
              icon: BellRing,
              title: '5. Alertes & Action Groups',
              desc: 'Notifications Teams/SMS, Autoscale & Runbooks',
            },
          ].map((stage) => {
            const Icon = stage.icon;
            const isCurrent = stage.step === idx;
            const isDone = stage.step < idx;
            return (
              <div
                key={stage.title}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                  isCurrent
                    ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-950 dark:text-sky-100'
                    : isDone
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">{stage.title}</p>
                  <p className="text-[11px] opacity-85">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Right 7 cols: Active Mission Decision Card */}
      <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{mission.stepLabel}</span>
          <span className="font-mono font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
            Score : {score}/{MISSIONS.length} {isCompleted ? '· Déjà validée' : ''}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            {mission.title}
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {mission.context}
          </p>
          <p className="text-xs text-sky-800 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg px-3 py-2">
            <strong>Indice d&apos;architecte :</strong> {mission.telemetryHint}
          </p>
        </div>

        <div className="space-y-2.5">
          {mission.options.map((opt) => {
            const selected = chosenId === opt.id;
            const isCorrect = opt.id === mission.correctId;
            let cls =
              'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800';
            if (validated) {
              if (isCorrect) {
                cls =
                  'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200';
              } else if (selected && !isCorrect) {
                cls =
                  'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-950 dark:text-red-200';
              }
            } else if (selected) {
              cls =
                'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-950 dark:text-sky-100';
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={validated}
                onClick={() => {
                  playClick();
                  setChosenId(opt.id);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 ${cls}`}
              >
                <div className="space-y-0.5">
                  <p className="font-mono text-xs sm:text-sm font-bold">{opt.label}</p>
                  <p className="text-xs opacity-85">{opt.detail}</p>
                </div>
                {validated && isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                )}
                {validated && selected && !isCorrect && (
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {validated && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>Explication :</strong> {mission.explanation}
          </div>
        )}

        <div className="pt-1">
          {!validated ? (
            <button
              type="button"
              disabled={!chosenId}
              onClick={handleValidate}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-45 rounded-lg transition-colors"
            >
              Valider ma décision Azure Monitor
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
            >
              {idx < MISSIONS.length - 1 ? 'Mission suivante →' : 'Terminer et obtenir mon badge'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
