import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  FolderTree,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Star,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island15ActiveDirectoryGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

interface AdMission {
  id: string;
  stepLabel: string;
  title: string;
  context: string;
  hint: string;
  options: { id: string; label: string; detail: string }[];
  correctId: string;
  explanation: string;
}

const MISSIONS: AdMission[] = [
  {
    id: 'ad-1',
    stepLabel: 'Mission 1/5 · Protocole Kerberos',
    title: 'Valider l’ordre exact d’une authentification Kerberos Windows',
    context:
      'Camille ouvre sa session sur un poste Windows du domaine cyberland.local puis accède au serveur de fichiers SRV-FILES. Quelle séquence de tickets le KDC (Contrôleur de Domaine) délivre-t-il ?',
    hint: 'On obtient d’abord un billet d’entrée général (TGT), puis un billet spécifique au service visé (TGS).',
    options: [
      {
        id: 'a',
        label: '1. Authentification KDC → TGT · 2. Demande TGS → Billet service · 3. Accès SRV-FILES',
        detail: 'Le mot de passe n’est jamais envoyé au serveur de fichiers final',
      },
      {
        id: 'b',
        label: 'Envoyer le mot de passe en clair à chaque serveur du réseau toutes les 5 minutes',
        detail: 'Expose les identifiants sur tout le réseau local',
      },
      {
        id: 'c',
        label: 'Demander directement un certificat DNS au serveur DHCP',
        detail: 'DHCP et DNS ne gèrent pas les billets Kerberos',
      },
    ],
    correctId: 'a',
    explanation:
      'Kerberos repose sur un tiers de confiance (le KDC sur le Contrôleur de Domaine) : le client reçoit un TGT (Ticket Granting Ticket), l’échange contre un TGS ciblé pour SRV-FILES, puis présente ce TGS au service.',
  },
  {
    id: 'ad-2',
    stepLabel: 'Mission 2/5 · Arborescence OU & GPO',
    title: 'Déployer une règle de verrouillage d’écran uniquement sur les postes comptables',
    context:
      'Votre Active Directory comporte les Unités d’Organisation (OU) Direction, Comptabilite et Serveurs. Où lier la GPO (Group Policy Object) pour ne cibler que les postes comptables ?',
    hint: 'Les GPO s’appliquent de manière hiérarchique à tous les objets contenus dans l’OU ciblée.',
    options: [
      {
        id: 'a',
        label: 'Lier la GPO directement sur l’OU « Comptabilite »',
        detail: 'Cible précisément les postes et utilisateurs du service sans impacter les serveurs',
      },
      {
        id: 'b',
        label: 'Lier la GPO à la racine de la Forêt avec blocage sur tous les contrôleurs de domaine',
        detail: 'Risque de perturber l’ensemble des serveurs et services critiques',
      },
      {
        id: 'c',
        label: 'Configurer manuellement chaque PC avec une clé USB chaque lundi',
        detail: 'Impossible à maintenir à l’échelle et non auditable',
      },
    ],
    correctId: 'a',
    explanation:
      'Les Unités d’Organisation (OU) servent précisément à structurer l’annuaire pour déléguer l’administration et appliquer des stratégies de groupe (GPO) ciblées sans effet de bord.',
  },
  {
    id: 'ad-3',
    stepLabel: 'Mission 3/5 · Protocole NTLM vs Kerberos',
    title: 'Pourquoi désactiver NTLMv1 au profit de Kerberos (AES-256) ?',
    context:
      'Un audit de sécurité signale que d’anciens serveurs acceptent encore NTLMv1 sur le réseau interne. Quel risque majeur éliminez-vous en imposant Kerberos ?',
    hint: 'NTLM repose sur des empreintes plus fragiles et vulnérables au relais d’authentification.',
    options: [
      {
        id: 'a',
        label: 'Kerberos assure une authentification mutuelle (client + serveur) avec chiffrement fort AES et durée limitée des tickets',
        detail: 'Réduit fortement les risques de relais NTLM et d’usurpation de serveur',
      },
      {
        id: 'b',
        label: 'Kerberos permet de supprimer complètement les mots de passe et les pare-feu',
        detail: 'Faux : la défense en profondeur reste indispensable',
      },
      {
        id: 'c',
        label: 'NTLMv1 empêche le fonctionnement des câbles fibre optique',
        detail: 'NTLMv1 est un protocole d’authentification, sans lien avec la fibre',
      },
    ],
    correctId: 'a',
    explanation:
      'Contrairement à NTLM (authentification unilatérale vulnérable au NTLM Relay et au cassage hors ligne), Kerberos authentifie mutuellement client et serveur avec des tickets horodatés chiffrés en AES.',
  },
  {
    id: 'ad-4',
    stepLabel: 'Mission 4/5 · Détection Kerberoasting',
    title: 'Repérer une attaque Kerberoasting dans les journaux Windows',
    context:
      'Votre sonde Azure Monitor / SIEM remonte 42 événements Windows EventID 4769 (demande de ticket TGS chiffré en RC4) émis en 12 secondes par un simple poste utilisateur vers des comptes de service (SPN). Que se passe-t-il ?',
    hint: 'Un attaquant demande des tickets TGS de comptes de service pour casser leur mot de passe hors ligne.',
    options: [
      {
        id: 'a',
        label: 'Une tentative de Kerberoasting : isoler le poste, migrer vers gMSA (mots de passe longs auto-rotatifs) et imposer AES',
        detail: 'Les gMSA rendent le cassage hors ligne pratiquement impossible',
      },
      {
        id: 'b',
        label: 'Une simple mise à jour de l’imprimante du rez-de-chaussée',
        detail: 'Une imprimante ne demande jamais 42 TGS en RC4 vers tous les SPN',
      },
      {
        id: 'c',
        label: 'Un manque de bande passante Wi-Fi sur l’île',
        detail: 'L’EventID 4769 concerne les tickets Kerberos, pas le débit Wi-Fi',
      },
    ],
    correctId: 'a',
    explanation:
      'Une rafale d’EventID 4769 (notamment en chiffrement RC4 0x17) vers plusieurs SPN signe une attaque Kerberoasting. Les comptes gMSA (Group Managed Service Accounts) et le chiffrement AES bloquent cette menace.',
  },
  {
    id: 'ad-5',
    stepLabel: 'Mission 5/5 · Défense contre Pass-the-Hash',
    title: 'Empêcher un attaquant de voler le hash Administrateur du Domaine',
    context:
      'Un administrateur du domaine a pris l’habitude de se connecter directement avec son compte Domain Admin sur les postes bureautiques des utilisateurs pour dépanner. Quelle mesure bloque le Pass-the-Hash ?',
    hint: 'Si un poste bureautique est compromis, tout secret administrateur présent en mémoire (LSASS) peut être réutilisé.',
    options: [
      {
        id: 'a',
        label: 'Appliquer le modèle en Tiers (Tier 0 / Tier 1 / Tier 2), le groupe Protected Users et Windows Defender Credential Guard',
        detail: 'Interdit aux comptes Domain Admin de se connecter sur les postes utilisateurs',
      },
      {
        id: 'b',
        label: 'Ajouter tous les employés dans le groupe Domain Admins pour gagner du temps',
        detail: 'Brise totalement le principe du moindre privilège',
      },
      {
        id: 'c',
        label: 'Désactiver le pare-feu Windows pour accélérer les tickets Kerberos',
        detail: 'Augmente drastiquement la surface d’attaque latérale',
      },
    ],
    correctId: 'a',
    explanation:
      'Le modèle de cloisonnement en Tiers (Tiering), combiné à Credential Guard et au groupe Protected Users, empêche les empreintes Domain Admin d’apparaître en mémoire sur des postes bureautiques exposés.',
  },
];

export const Island15ActiveDirectoryGame: React.FC<Island15ActiveDirectoryGameProps> = ({
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
          Citadelle Active Directory sécurisée — {score} / {MISSIONS.length} !
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Vous maîtrisez les tickets Kerberos (TGT/TGS), le ciblage des GPO par OU et la défense
          contre le Kerberoasting et le Pass-the-Hash. Badge{' '}
          <strong>« Gardien d’Active Directory »</strong> débloqué !
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
            <KeyRound className="w-4 h-4 text-amber-400" />
            Piliers Active Directory &amp; Kerberos
          </span>
          <span className="font-mono text-xs text-slate-300 tabular-nums">
            Étape {idx + 1}/{MISSIONS.length}
          </span>
        </div>

        <div className="p-5 space-y-3">
          {[
            {
              step: 0,
              icon: KeyRound,
              title: '1. KDC & Billets Kerberos (TGT → TGS)',
              desc: 'Authentification sans exposer le mot de passe au serveur cible',
            },
            {
              step: 1,
              icon: FolderTree,
              title: '2. Forêt, Domaine, OU & GPO',
              desc: 'Hiérarchie claire et stratégies de sécurité ciblées par service',
            },
            {
              step: 2,
              icon: ShieldCheck,
              title: '3. Kerberos AES vs NTLMv1 obsolète',
              desc: 'Authentification mutuelle et fin du relais NTLM',
            },
            {
              step: 3,
              icon: AlertTriangle,
              title: '4. Détection Kerberoasting (Event 4769)',
              desc: 'Repérer les rafales RC4 et migrer vers gMSA',
            },
            {
              step: 4,
              icon: Lock,
              title: '5. Modèle en Tiers & Pass-the-Hash',
              desc: 'Cloisonner Tier 0 (Domain Admin) + Credential Guard',
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
            <strong>Indice d&apos;architecte :</strong> {mission.hint}
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
              Valider ma décision Active Directory
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
