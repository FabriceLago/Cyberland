import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Router,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Star,
  ArrowLeftRight,
  Split,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island18VpnNatGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

interface VpnMission {
  id: string;
  stepLabel: string;
  title: string;
  context: string;
  hint: string;
  options: { id: string; label: string; detail: string }[];
  correctId: string;
  explanation: string;
}

const MISSIONS: VpnMission[] = [
  {
    id: 'vpn-1',
    stepLabel: 'Mission 1/5 · Encapsulation dans un tunnel VPN',
    title: 'Comment un VPN protège-t-il un paquet sur un Wi-Fi public ?',
    context:
      'Vous envoyez une requête interne vers 10.0.2.15 depuis le Wi-Fi d’un aéroport. Que voit un attaquant écoutant le Wi-Fi avec Wireshark si votre tunnel WireGuard est actif ?',
    hint: 'Le paquet IP privé d’origine est chiffré et enfermé à l’intérieur d’un nouveau paquet UDP externe.',
    options: [
      {
        id: 'a',
        label: 'Uniquement des paquets UDP chiffrés (port 51820) entre votre poste et la passerelle VPN : contenu et IP interne masqués',
        detail: 'L’encapsulation chiffre tout le paquet interne d’origine',
      },
      {
        id: 'b',
        label: 'L’intégralité de vos mots de passe et de vos fichiers en clair',
        detail: 'Faux : le chiffrement ChaCha20/AES rend la charge utile illisible',
      },
      {
        id: 'c',
        label: 'Aucun paquet du tout : les ondes Wi-Fi deviennent invisibles',
        detail: 'Les paquets circulent bien sur le Wi-Fi, mais encapsulés et chiffrés',
      },
    ],
    correctId: 'a',
    explanation:
      'L’encapsulation VPN enveloppe le paquet interne chiffré dans un nouvel en-tête externe (ex. UDP 51820 pour WireGuard ou ESP pour IPSec) jusqu’à la passerelle d’entreprise.',
  },
  {
    id: 'vpn-2',
    stepLabel: 'Mission 2/5 · Full-Tunnel vs Split-Tunnel',
    title: 'Choisir la bonne stratégie de routage VPN pour 300 télétravailleurs',
    context:
      'Vos 300 salariés en télétravail font des visioconférences Teams/Zoom (gros débit vidéo) et consultent parfois l’ERP interne 10.0.2.0/24. Avec le Full-Tunnel, le lien Internet du siège sature à 100 %. Que recommander ?',
    hint: 'Il est possible de ne passer dans le tunnel que le trafic privé d’entreprise, tout en protégeant la sortie directe.',
    options: [
      {
        id: 'a',
        label: 'Passer en Split-Tunneling : seuls les flux vers 10.0.2.0/24 traversent le VPN, la visio sort directement sur Internet',
        detail: 'Désature immédiatement la passerelle du siège et améliore la fluidité visio',
      },
      {
        id: 'b',
        label: 'Interdire complètement les visioconférences pendant 6 mois',
        detail: 'Bloque l’activité métier au lieu d’adapter l’architecture réseau',
      },
      {
        id: 'c',
        label: 'Désactiver le chiffrement du VPN pour gagner en débit',
        detail: 'Expose les données privées de l’ERP sur Internet',
      },
    ],
    correctId: 'a',
    explanation:
      'Le Split-Tunneling route uniquement les sous-réseaux internes (AllowedIPs = 10.0.2.0/24) dans le tunnel VPN et laisse le trafic SaaS/visio sortir directement, évitant l’effet goulot d’étranglement au siège.',
  },
  {
    id: 'vpn-3',
    stepLabel: 'Mission 3/5 · WireGuard vs IPSec',
    title: 'Pourquoi WireGuard est-il si apprécié pour les liaisons modernes ?',
    context:
      'Vous comparez IPSec (IKEv2/ESP) et WireGuard pour connecter vos postes nomades et vos sites Cloud. Quel atout technique distingue particulièrement WireGuard ?',
    hint: 'Comparez la simplicité du code, la vitesse de reconnexion mobile et la cryptographie moderne.',
    options: [
      {
        id: 'a',
        label: 'Code minimaliste (~4 000 lignes) dans le noyau, cryptographie moderne (ChaCha20/Curve25519) et reconnexion instantanée Wi-Fi ↔ 5G',
        detail: 'Surface d’attaque réduite, audit simplifié et très faible latence',
      },
      {
        id: 'b',
        label: 'WireGuard fonctionne uniquement en port 23 Telnet sans clés',
        detail: 'Faux : WireGuard utilise des paires de clés publiques/privées sur UDP',
      },
      {
        id: 'c',
        label: 'IPSec ne chiffre jamais les données en transit',
        detail: 'Faux : IPSec chiffre bien via ESP, mais sa configuration est plus complexe',
      },
    ],
    correctId: 'a',
    explanation:
      'IPSec reste un standard robuste en interconnexion d’entreprise, mais WireGuard séduit par sa base de code ultra-compacte, sa cryptographie moderne non ambiguë et son roaming transparent.',
  },
  {
    id: 'vpn-4',
    stepLabel: 'Mission 4/5 · Traduction d’adresses NAT / PAT',
    title: 'Comment 50 postes privés partagent-ils une seule IP publique ?',
    context:
      'Sur le LAN, deux postes (192.168.1.10 et 192.168.1.25) ouvrent simultanément un site HTTPS (port 443). Le routeur de bordure ne possède qu’une seule IP publique (203.0.113.5). Comment renvoie-t-il chaque réponse au bon PC ?',
    hint: 'Le routeur tient une table dynamique associant un numéro de port source unique à chaque poste interne.',
    options: [
      {
        id: 'a',
        label: 'Grâce au PAT (NAT avec surcharge de ports) : le routeur associe 203.0.113.5:51001 → .10 et 203.0.113.5:51002 → .25',
        detail: 'La table de traduction NAT/PAT aiguille chaque paquet retour vers le bon poste privé',
      },
      {
        id: 'b',
        label: 'Les 50 postes doivent se connecter à tour de rôle, un par minute',
        detail: 'Faux : des milliers de connexions coexistent simultanément grâce aux ports',
      },
      {
        id: 'c',
        label: 'Le serveur DNS invente 50 nouvelles adresses IP publiques gratuitement',
        detail: 'Le DNS ne distribue pas d’adresses IP publiques routables',
      },
    ],
    correctId: 'a',
    explanation:
      'Le PAT (Port Address Translation, ou Masquerade) réécrit l’IP source privée par l’IP publique du routeur et attribue un port source éphémère distinct par connexion dans sa table NAT.',
  },
  {
    id: 'vpn-5',
    stepLabel: 'Mission 5/5 · Pare-feu Stateful vs Stateless',
    title: 'Comprendre la différence entre filtrage Stateful et Stateless',
    context:
      'Votre pare-feu nouvelle génération autorise le trafic sortant HTTPS (port 443) depuis le LAN. Sans créer manuellement de règle entrante générique, pourquoi les réponses du serveur web parviennent-elles quand même au navigateur ?',
    hint: 'Un pare-feu à états mémorise les connexions légitimes initiées depuis l’intérieur.',
    options: [
      {
        id: 'a',
        label: 'Parce qu’un pare-feu Stateful tient une table d’états (State Table) et autorise automatiquement le trafic retour d’une session établie',
        detail: 'Bloque toute connexion entrante non sollicitée tout en laissant revenir les réponses légitimes',
      },
      {
        id: 'b',
        label: 'Parce que le pare-feu ouvre tous les ports 1 à 65535 dès qu’un navigateur démarre',
        detail: 'Ce serait une faille majeure, jamais utilisée par un pare-feu sérieux',
      },
      {
        id: 'c',
        label: 'Parce que le trafic retour passe uniquement en Bluetooth',
        detail: 'Aucun lien avec le filtrage IP/TCP',
      },
    ],
    correctId: 'a',
    explanation:
      'Contrairement à une ACL Stateless qui inspecte chaque paquet isolément, un pare-feu Stateful suit l’état de chaque session TCP/UDP et accepte dynamiquement les paquets de retour légitimes.',
  },
];

export const Island18VpnNatGame: React.FC<Island18VpnNatGameProps> = ({
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
          Tunnel VPN &amp; NAT sécurisés — {score} / {MISSIONS.length} !
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Vous maîtrisez l’encapsulation WireGuard/IPSec, le Split-Tunneling, la table PAT/NAT et
          le filtrage Stateful. Badge <strong>« Gardien du Tunnel VPN »</strong> débloqué !
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
            <Lock className="w-4 h-4 text-emerald-400" />
            Chaîne VPN, NAT &amp; Pare-feu
          </span>
          <span className="font-mono text-xs text-slate-300 tabular-nums">
            Étape {idx + 1}/{MISSIONS.length}
          </span>
        </div>

        <div className="p-5 space-y-3">
          {[
            { step: 0, icon: Lock, title: '1. Encapsulation dans le tunnel', desc: 'Paquet privé chiffré dans une enveloppe UDP/ESP' },
            { step: 1, icon: Split, title: '2. Split-Tunnel vs Full-Tunnel', desc: 'Optimiser la bande passante des télétravailleurs' },
            { step: 2, icon: ShieldCheck, title: '3. WireGuard vs IPSec (IKEv2)', desc: 'Simplicité, cryptographie moderne et roaming' },
            { step: 3, icon: ArrowLeftRight, title: '4. Table dynamique NAT / PAT', desc: 'Partager 1 IP publique grâce aux ports éphémères' },
            { step: 4, icon: Router, title: '5. Pare-feu Stateful vs Stateless', desc: 'Suivi d’état de session et trafic retour autorisé' },
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
              Valider ma décision VPN &amp; NAT
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
