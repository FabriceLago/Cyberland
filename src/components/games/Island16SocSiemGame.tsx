import React, { useState } from 'react';
import {
  ShieldAlert,
  Radar,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Star,
  Zap,
  Filter,
  Activity,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island16SocSiemGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

interface SocMission {
  id: string;
  stepLabel: string;
  severity: 'CRITIQUE' | 'ÉLEVÉE' | 'FAUX POSITIF';
  title: string;
  context: string;
  siemLog: string;
  options: { id: string; label: string; detail: string }[];
  correctId: string;
  explanation: string;
}

const MISSIONS: SocMission[] = [
  {
    id: 'soc-1',
    stepLabel: 'Mission 1/5 · Corrélation SIEM',
    severity: 'ÉLEVÉE',
    title: 'Pourquoi centraliser pare-feu, DNS et Windows Events dans un SIEM ?',
    context:
      'Pris isolément, un seul échec de connexion ou une requête DNS étrange passe inaperçu. Quel est le rôle clé du moteur de corrélation d’un SIEM (ex. Microsoft Sentinel ou ELK) ?',
    siemLog: '[WIN-AD-01] Event 4625 x40 + [FW-EDGE] Port 3389 IP 185.220.101.47 + [DNS] beacon-c2.xyz',
    options: [
      {
        id: 'a',
        label: 'Croiser les journaux de sources hétérogènes dans le temps pour révéler une chaîne d’attaque coordonnée',
        detail: 'Transforme des signaux faibles isolés en un incident priorisé exploitable',
      },
      {
        id: 'b',
        label: 'Remplacer le câble Ethernet par une liaison satellite',
        detail: 'Un SIEM agit sur la collecte et l’analyse de journaux, pas sur le câblage',
      },
      {
        id: 'c',
        label: 'Supprimer tous les journaux anciens de plus de 5 minutes',
        detail: 'La rétention historique est au contraire essentielle pour l’investigation',
      },
    ],
    correctId: 'a',
    explanation:
      'Le SIEM (Security Information and Event Management) ingère les logs Windows, pare-feu, EDR et DNS afin de les corréler et détecter des scénarios complexes invisibles sur une source unique.',
  },
  {
    id: 'soc-2',
    stepLabel: 'Mission 2/5 · Triage SOC Niveau 1',
    severity: 'FAUX POSITIF',
    title: 'Distinguer un Faux Positif d’une véritable intrusion',
    context:
      'Une alerte « Pic de requêtes HTTPS vers backup.cyberland.gem à 02h00 » apparaît. Après vérification, il s’agit du serveur officiel SRV-SQL-01 exécutant la sauvegarde nocturne planifiée validée dans le calendrier IT.',
    siemLog: '[02:00:04] SRC=SRV-SQL-01 DST=backup.cyberland.gem:443 · Tâche planifiée #CHG-884 validée',
    options: [
      {
        id: 'a',
        label: 'Classer en Faux Positif bénin, documenter la preuve (#CHG-884) et affiner la règle SIEM pour exclure ce flux légitime',
        detail: 'Réduit la fatigue d’alerte (Alert Fatigue) de l’équipe SOC',
      },
      {
        id: 'b',
        label: 'Débrancher immédiatement la base de données de production pendant 48 heures',
        detail: 'Provocation d’une panne majeure sur une activité normale planifiée',
      },
      {
        id: 'c',
        label: 'Ignorer toutes les alertes SIEM du mois entier',
        detail: 'Ferait manquer de vraies intrusions critiques',
      },
    ],
    correctId: 'a',
    explanation:
      'Un analyste SOC N1 vérifie toujours le contexte (changement planifié, heure, actif source). Affiner les règles sur les faux positifs évite la saturation de la console d’alertes.',
  },
  {
    id: 'soc-3',
    stepLabel: 'Mission 3/5 · Matrice MITRE ATT&CK',
    severity: 'CRITIQUE',
    title: 'Identifier la tactique MITRE ATT&CK observée',
    context:
      'Un poste compromis PC-COMPTA-04 vient d’exécuter un scan SMB (port 445) vers 18 serveurs internes avec un compte volé afin de rebondir sur le contrôleur de domaine. Quelle tactique MITRE ATT&CK est en cours ?',
    siemLog: '[EDR] PC-COMPTA-04 → SMB:445 vers 10.0.2.10..28 · Technique T1021 (Remote Services)',
    options: [
      {
        id: 'a',
        label: 'Mouvement Latéral (Lateral Movement)',
        detail: 'L’attaquant se propage de machine en machine à l’intérieur du réseau',
      },
      {
        id: 'b',
        label: 'Compression vidéo (Codec H.265)',
        detail: 'Aucune relation avec la matrice de tactiques cyber MITRE ATT&CK',
      },
      {
        id: 'c',
        label: 'Optimisation énergétique FinOps',
        detail: 'Démarche Cloud sans rapport avec un scan SMB malveillant',
      },
    ],
    correctId: 'a',
    explanation:
      'La matrice MITRE ATT&CK fournit un vocabulaire commun mondial : rebondir d’un poste compromis vers d’autres machines via SMB/RDP/WinRM correspond au Mouvement Latéral (Lateral Movement).',
  },
  {
    id: 'soc-4',
    stepLabel: 'Mission 4/5 · Réponse automatisée SOAR',
    severity: 'CRITIQUE',
    title: 'Exécuter le Playbook SOAR de confinement d’urgence',
    context:
      'Un ransomware commence à chiffrer des fichiers sur PC-COMPTA-04 à 03h12. Quel enchaînement automatique d’un Playbook SOAR stoppe la propagation en quelques secondes ?',
    siemLog: '[ALERT SEV-1] Chiffrement massif .locked détecté sur PC-COMPTA-04 · 240 fichiers/sec',
    options: [
      {
        id: 'a',
        label: '1. Isoler le poste via l’EDR · 2. Révoquer les sessions & tickets Kerberos · 3. Bloquer l’IP C2 au pare-feu · 4. Créer le ticket d’incident',
        detail: 'Confinement ultra-rapide limitant le rayon d’impact à une seule machine',
      },
      {
        id: 'b',
        label: 'Envoyer un e-mail de sondage aux employés à 09h00 le lendemain',
        detail: 'Laisserait le ransomware chiffrer tout le réseau durant la nuit',
      },
      {
        id: 'c',
        label: 'Ouvrir tous les ports pare-feu pour voir où partent les fichiers',
        detail: 'Accélère l’exfiltration et la propagation',
      },
    ],
    correctId: 'a',
    explanation:
      'Le SOAR (Security Orchestration, Automation and Response) exécute des Playbooks en quelques secondes : isolation réseau du poste, révocation des jetons/comptes et blocage périmétrique.',
  },
  {
    id: 'soc-5',
    stepLabel: 'Mission 5/5 · Retour d’expérience (RETEX)',
    severity: 'ÉLEVÉE',
    title: 'Clôturer proprement l’incident et renforcer la détection',
    context:
      'L’incident est contenu et le poste PC-COMPTA-04 est réinstallé sainement depuis une image propre. Quelle dernière étape rend le SOC plus résilient face à la prochaine attaque ?',
    siemLog: '[INC-402] Confinement validé · Temps de détection (MTTD) : 4 min · Temps de réponse (MTTR) : 9 min',
    options: [
      {
        id: 'a',
        label: 'Rédiger le post-mortem, capitaliser les indicateurs (IOC) dans le SIEM et corriger la faille racine (phishing / MFA)',
        detail: 'Boucle d’amélioration continue qui abaisse durablement le MTTD et le MTTR',
      },
      {
        id: 'b',
        label: 'Effacer le ticket d’incident pour faire croire que rien ne s’est passé',
        detail: 'Empêche l’équipe d’apprendre et de bloquer les futurs IOC',
      },
      {
        id: 'c',
        label: 'Désinstaller l’EDR pour libérer 2 % de processeur',
        detail: 'Supprime la visibilité critique pour les prochaines attaques',
      },
    ],
    correctId: 'a',
    explanation:
      'Un SOC mature clôt chaque incident par un RETEX sans blâme : ajout des IOC (IP, domaines, hashs) en liste de blocage, création de nouvelles règles KQL et correction de la cause racine.',
  },
];

export const Island16SocSiemGame: React.FC<Island16SocSiemGameProps> = ({
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
          Quart d&apos;Analyste SOC validé — {score} / {MISSIONS.length} !
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Vous savez corréler des journaux dans un SIEM, écarter les faux positifs, classer une
          attaque selon MITRE ATT&amp;CK et lancer un Playbook SOAR. Badge{' '}
          <strong>« Analyste SOC Cyberland »</strong> débloqué !
        </p>
        <button
          type="button"
          onClick={handleRestart}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Rejouer le quart SOC
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <aside className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Radar className="w-4 h-4 text-sky-400" />
            File d&apos;alertes SIEM / SOC
          </span>
          <span className="font-mono text-xs text-slate-300 tabular-nums">
            Incident {idx + 1}/{MISSIONS.length}
          </span>
        </div>

        <div className="p-5 space-y-3">
          {[
            { step: 0, icon: Activity, title: '1. Ingestion & Corrélation SIEM', desc: 'Logs Windows + Pare-feu + DNS réunis' },
            { step: 1, icon: Filter, title: '2. Triage Faux Positif vs Intrusion', desc: 'Contexte IT et réduction de la fatigue d’alerte' },
            { step: 2, icon: ShieldAlert, title: '3. Qualification MITRE ATT&CK', desc: 'Identifier la tactique de mouvement latéral' },
            { step: 3, icon: Zap, title: '4. Playbook SOAR Automatisé', desc: 'Isolation EDR + révocation sessions en secondes' },
            { step: 4, icon: CheckCircle2, title: '5. RETEX & Enrichissement IOC', desc: 'Post-mortem, MTTD/MTTR et nouvelles règles' },
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
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {mission.stepLabel} · Gravité :{' '}
            <strong
              className={
                mission.severity === 'CRITIQUE'
                  ? 'text-red-700 dark:text-red-400'
                  : mission.severity === 'ÉLEVÉE'
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }
            >
              {mission.severity}
            </strong>
          </span>
          <span className="font-mono font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
            Score : {score}/{MISSIONS.length} {isCompleted ? '· Déjà validée' : ''}
          </span>
        </div>

        <div className="space-y-2.5">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            {mission.title}
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {mission.context}
          </p>
          <div className="p-3 rounded-lg bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto">
            {mission.siemLog}
          </div>
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
            <strong>Débriefing SOC :</strong> {mission.explanation}
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
              Valider ma décision SOC
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
            >
              {idx < MISSIONS.length - 1 ? 'Incident suivant →' : 'Clôturer le quart SOC'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
