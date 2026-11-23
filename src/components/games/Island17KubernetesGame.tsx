import React, { useState } from 'react';
import {
  Boxes,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Star,
  Globe,
  Shield,
  RefreshCw,
  Server,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island17KubernetesGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

interface K8sMission {
  id: string;
  stepLabel: string;
  title: string;
  context: string;
  kubectlHint: string;
  options: { id: string; label: string; detail: string }[];
  correctId: string;
  explanation: string;
}

const MISSIONS: K8sMission[] = [
  {
    id: 'k8s-1',
    stepLabel: 'Mission 1/5 · Auto-guérison (ReplicaSet)',
    title: 'Garantir 3 Pods toujours disponibles pour l’API Billetterie',
    context:
      'Vous lancez un seul conteneur Docker isolé : s’il plante, le site s’arrête. Quel objet Kubernetes maintient automatiquement le nombre souhaité (replicas: 3) et recrée un Pod défaillant ?',
    kubectlHint: 'kubectl scale deployment/billetterie --replicas=3',
    options: [
      {
        id: 'a',
        label: 'Un Deployment (qui pilote un ReplicaSet) avec replicas: 3',
        detail: 'Surveille l’état souhaité en continu et relance tout Pod en panne',
      },
      {
        id: 'b',
        label: 'Un fichier texte README.md listant les adresses MAC',
        detail: 'Un document statique n’orchestre pas les conteneurs',
      },
      {
        id: 'c',
        label: 'Désactiver le réseau bridge docker0',
        detail: 'Couperait la communication entre tous les conteneurs',
      },
    ],
    correctId: 'a',
    explanation:
      'Le Deployment Kubernetes déclare l’état désiré (ex. 3 réplicas). Le contrôleur compare en permanence l’état réel à l’état désiré et recrée instantanément un Pod qui tombe.',
  },
  {
    id: 'k8s-2',
    stepLabel: 'Mission 2/5 · Diagnostic CrashLoopBackOff',
    title: 'Réparer un Pod bloqué en statut CrashLoopBackOff',
    context:
      'Après une mise à jour, le Pod « api-paiement-7f9b » redémarre en boucle (CrashLoopBackOff). Quelle commande permet d’identifier immédiatement la cause (variable d’environnement manquante ou erreur code) ?',
    kubectlHint: 'Commencez toujours par lire les journaux et les événements du Pod défaillant.',
    options: [
      {
        id: 'a',
        label: 'kubectl logs api-paiement-7f9b --previous et kubectl describe pod api-paiement-7f9b',
        detail: 'Affiche l’erreur exacte de l’instance précédente et les événements Kubelet',
      },
      {
        id: 'b',
        label: 'Formater tous les nœuds Worker du cluster Kubernetes',
        detail: 'Détruirait toute la production au lieu de lire les logs',
      },
      {
        id: 'c',
        label: 'Passer les ports HTTPS de 443 à 23 (Telnet)',
        detail: 'Aucun lien avec le crash interne du processus conteneurisé',
      },
    ],
    correctId: 'a',
    explanation:
      'CrashLoopBackOff signifie que le processus démarre puis quitte en erreur. « kubectl logs --previous » révèle le message d’erreur exact avant le redémarrage.',
  },
  {
    id: 'k8s-3',
    stepLabel: 'Mission 3/5 · Service ClusterIP & DNS interne',
    title: 'Relier le Frontend aux Pods Backend malgré leurs IP éphémères',
    context:
      'Chaque fois qu’un Pod Backend est recréé par Kubernetes, son adresse IP change (10.244.1.12 → 10.244.2.48). Comment offrir un point d’accès interne stable et équilibré ?',
    kubectlHint: 'Les Pods sont mortels ; l’abstraction réseau qui les regroupe par labels est stable.',
    options: [
      {
        id: 'a',
        label: 'Créer un Service Kubernetes (ClusterIP) qui cible les Pods via un sélecteur de labels',
        detail: 'Fournit un nom DNS stable (ex. api-svc) et répartit la charge entre les Pods sains',
      },
      {
        id: 'b',
        label: 'Modifier manuellement le code du Frontend à chaque changement d’IP de Pod',
        detail: 'Totalement incompatible avec l’élasticité d’un cluster',
      },
      {
        id: 'c',
        label: 'Exposer directement la base de données sur Internet sans mot de passe',
        detail: 'Faille critique sans résoudre l’adressage interne',
      },
    ],
    correctId: 'a',
    explanation:
      'Un Service ClusterIP associe une IP virtuelle et un nom DNS interne permanents à un ensemble dynamique de Pods identifiés par leurs labels (app: api).',
  },
  {
    id: 'k8s-4',
    stepLabel: 'Mission 4/5 · Routage externe Ingress TLS',
    title: 'Exposer plusieurs sites HTTPS derrière une seule IP publique',
    context:
      'Vous hébergez shop.cyberland.gem et api.cyberland.gem dans le même cluster Kubernetes. Quel objet gère le routage HTTP/HTTPS par nom d’hôte et le certificat TLS ?',
    kubectlHint: 'C’est le point d’entrée Couche 7 (HTTP/HTTPS) du cluster.',
    options: [
      {
        id: 'a',
        label: 'Un Ingress (avec Ingress Controller & certificat TLS)',
        detail: 'Route shop.cyberland.gem et api.cyberland.gem vers leurs Services respectifs sur port 443',
      },
      {
        id: 'b',
        label: 'Un câble USB relié directement à chaque Pod',
        detail: 'Impossible dans un orchestrateur Cloud',
      },
      {
        id: 'c',
        label: 'Uniquement l’adresse MAC du nœud maître',
        detail: 'La couche 2 ne lit ni les noms d’hôtes HTTPS ni les URL',
      },
    ],
    correctId: 'a',
    explanation:
      'L’objet Ingress centralise le routage applicatif L7 (par domaine ou chemin /api) et la terminaison TLS, évitant de payer un Load Balancer public par microservice.',
  },
  {
    id: 'k8s-5',
    stepLabel: 'Mission 5/5 · Pare-feu interne NetworkPolicy',
    title: 'Empêcher un Pod Frontend compromis d’accéder directement à la base de données',
    context:
      'Par défaut dans Kubernetes, tous les Pods peuvent communiquer librement entre eux sur le réseau overlay. Comment appliquer le principe Zero Trust entre vos Pods ?',
    kubectlHint: 'Seul le Pod « api-backend » doit pouvoir joindre le port 5432 du Pod « postgres-db ».',
    options: [
      {
        id: 'a',
        label: 'Appliquer une NetworkPolicy n’autorisant l’entrée sur postgres-db:5432 qu’aux Pods labellisés role=backend',
        detail: 'Micro-segmentation réseau Zero Trust directement pilotée par les labels',
      },
      {
        id: 'b',
        label: 'Laisser tout ouvert car le cluster est dans le Cloud',
        detail: 'Contraire au Zero Trust : facilite les mouvements latéraux',
      },
      {
        id: 'c',
        label: 'Supprimer tous les Services ClusterIP du cluster',
        detail: 'Empêcherait l’application légitime de fonctionner',
      },
    ],
    correctId: 'a',
    explanation:
      'Les NetworkPolicies agissent comme un pare-feu distribué entre Pods : elles restreignent précisément quels labels ou namespaces peuvent dialoguer sur quel port.',
  },
];

export const Island17KubernetesGame: React.FC<Island17KubernetesGameProps> = ({
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
          Cluster Kubernetes orchestré — {score} / {MISSIONS.length} !
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Vous maîtrisez les Deployments, le débogage CrashLoopBackOff, les Services ClusterIP, le
          routage Ingress TLS et la micro-segmentation NetworkPolicy. Badge{' '}
          <strong>« Capitaine Kubernetes »</strong> débloqué !
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
      <aside className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Boxes className="w-4 h-4 text-sky-400" />
            Architecture du Cluster K8s
          </span>
          <span className="font-mono text-xs text-slate-300 tabular-nums">
            Étape {idx + 1}/{MISSIONS.length}
          </span>
        </div>

        <div className="p-5 space-y-3">
          {[
            { step: 0, icon: RefreshCw, title: '1. Deployment & ReplicaSet', desc: 'Maintien automatique de 3 Pods en santé' },
            { step: 1, icon: Server, title: '2. Débogage CrashLoopBackOff', desc: 'kubectl logs --previous & describe pod' },
            { step: 2, icon: Boxes, title: '3. Service ClusterIP (DNS interne)', desc: 'IP stable devant des Pods éphémères' },
            { step: 3, icon: Globe, title: '4. Ingress Controller (L7 HTTPS)', desc: 'Routage multi-domaines + certificats TLS' },
            { step: 4, icon: Shield, title: '5. NetworkPolicy (Zero Trust)', desc: 'Cloisonnement strict Pod-à-Pod par labels' },
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
          <p className="font-mono text-xs text-sky-900 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg px-3 py-2">
            Indice : {mission.kubectlHint}
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
                  <p className="text-xs sm:text-sm font-bold">{opt.label}</p>
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
              Valider ma décision Kubernetes
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
