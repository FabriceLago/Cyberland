import React, { useState } from 'react';
import { KeyRound, Lock, Hash, FileCheck2, CheckCircle2, XCircle, RotateCcw, Star } from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island11CryptoGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

type CryptoMethod = 'symmetric' | 'asymmetric' | 'hash' | 'signature';

interface CryptoMission {
  id: string;
  title: string;
  scenario: string;
  clue: string;
  correct: CryptoMethod;
  explanation: string;
}

const METHODS: {
  id: CryptoMethod;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'symmetric', label: 'Chiffrement Symétrique (AES)', short: '1 clé partagée · Très rapide', icon: Lock },
  { id: 'asymmetric', label: 'Asymétrique (Clé Publique / Privée)', short: '2 clés · Échange sécurisé', icon: KeyRound },
  { id: 'hash', label: 'Hachage + Sel (SHA-256 / Argon2)', short: 'Empreinte irréversible', icon: Hash },
  { id: 'signature', label: 'Signature & Certificat TLS', short: 'Prouve l’identité & l’intégrité', icon: FileCheck2 },
];

const MISSIONS: CryptoMission[] = [
  {
    id: 'cr-1',
    title: 'Mission 1 · Stocker 50 000 mots de passe habitants',
    scenario:
      "La base de données des comptes de Cyberland doit vérifier les mots de passe à la connexion, sans jamais pouvoir les relire en clair même si un pirate vole la base.",
    clue: 'On n’a jamais besoin de déchiffrer le mot de passe, seulement de comparer son empreinte.',
    correct: 'hash',
    explanation:
      'Le hachage avec sel (Argon2 / bcrypt / SHA-256 salé) transforme chaque mot de passe en empreinte unique et irréversible.',
  },
  {
    id: 'cr-2',
    title: 'Mission 2 · Envoyer un secret à une île jamais rencontrée',
    scenario:
      "Un navigateur visite le Phare de Cyberland pour la première fois et doit lui transmettre une clé secrète à travers un océan écouté par des pirates.",
    clue: 'Le Phare publie librement un cadenas ouvert, mais lui seul détient la clé pour l’ouvrir.',
    correct: 'asymmetric',
    explanation:
      'La cryptographie asymétrique utilise la clé publique du serveur pour chiffrer l’échange initial ; seule la clé privée du Phare peut le déchiffrer.',
  },
  {
    id: 'cr-3',
    title: 'Mission 3 · Chiffrer un flux vidéo de 4 Go en temps réel',
    scenario:
      "Une fois la session HTTPS établie et la clé de session partagée, le phare doit chiffrer très rapidement des gigaoctets de données sans ralentir le processeur.",
    clue: 'Les deux extrémités connaissent déjà la même clé temporaire et cherchent la vitesse maximale.',
    correct: 'symmetric',
    explanation:
      'Le chiffrement symétrique (AES-256) est des centaines de fois plus rapide que l’asymétrique : HTTPS l’utilise pour tout le volume de données après la poignée de main.',
  },
  {
    id: 'cr-4',
    title: 'Mission 4 · Prouver qu’une mise à jour vient bien de Cyberland',
    scenario:
      "Avant d’installer un correctif système sur les routeurs du port, les techniciens doivent être certains qu’il a été émis par l’équipe officielle et n’a pas été altéré.",
    clue: 'On signe avec la clé privée officielle, et tout le monde peut vérifier avec la clé publique.',
    correct: 'signature',
    explanation:
      'La signature numérique (et les certificats TLS) garantit à la fois l’authenticité de l’émetteur et l’intégrité exacte du fichier.',
  },
  {
    id: 'cr-5',
    title: 'Mission 5 · Chiffrer les sauvegardes disques nocturnes',
    scenario:
      "Chaque nuit, 200 Go de sauvegardes de la clinique côtière sont chiffrés dans le coffre Cloud à l’aide d’une clé conservée dans un gestionnaire de secrets (KMS).",
    clue: 'Gros volume de données à relire plus tard par la même organisation.',
    correct: 'symmetric',
    explanation:
      'Pour le chiffrement au repos (disques, backups volumineux), le chiffrement symétrique AES-256 offre une sécurité robuste et un débit maximal.',
  },
  {
    id: 'cr-6',
    title: 'Mission 6 · Vérifier l’authenticité du site banque.cyberland.gem',
    scenario:
      "Comment le navigateur d’un habitant sait-il qu’il parle bien au vrai serveur bancaire de Cyberland et non à un imposteur interceptant la connexion ?",
    clue: 'Une Autorité de Certification (CA) appose son sceau cryptographique sur la clé publique du site.',
    correct: 'signature',
    explanation:
      'Le certificat TLS signé par une Autorité de Certification lie de façon vérifiable le domaine banque.cyberland.gem à sa clé publique.',
  },
];

export const Island11CryptoGame: React.FC<Island11CryptoGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [selected, setSelected] = useState<CryptoMethod | null>(null);
  const [finished, setFinished] = useState(false);

  // Interactive mini-sandbox: live hash preview
  const [sampleText, setSampleText] = useState('Cyberland2026');
  const fakeDeterministicHash = (str: string) => {
    let h1 = 0xdeadbeef ^ str.length;
    let h2 = 0x41c6ce57 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
    return `${hex(h1)}${hex(h2)}${hex(h1 ^ h2)}${hex(h2 + 0x9e3779b9)}`;
  };

  const current = MISSIONS[stepIdx];

  const handleChoose = (method: CryptoMethod) => {
    if (selected) return;
    setSelected(method);
    if (method === current.correct) {
      playSuccess();
      setScore((s) => s + 1);
    } else {
      playError();
      setMistakes((m) => m + 1);
    }
  };

  const handleNext = () => {
    playClick();
    if (stepIdx + 1 >= MISSIONS.length) {
      setFinished(true);
      const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      if (stars >= 2) playVictory();
      onComplete(stars);
    } else {
      setStepIdx((i) => i + 1);
      setSelected(null);
    }
  };

  const handleReset = () => {
    playClick();
    setStepIdx(0);
    setScore(0);
    setMistakes(0);
    setSelected(null);
    setFinished(false);
  };

  const earnedStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;

  return (
    <div className="space-y-6">
      {/* Live Avalanche Effect Mini-Bench */}
      <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-sky-300">
            Banc d&apos;essai en direct · Effet avalanche d&apos;une fonction de hachage
          </p>
          <p className="text-xs text-slate-300">
            Modifiez ne serait-ce qu&apos;une seule lettre pour voir toute l&apos;empreinte changer :
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
          <input
            type="text"
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            maxLength={32}
            aria-label="Texte à hacher en démonstration"
            className="px-3 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-400"
          />
          <div className="px-3 py-2 text-[11px] font-mono bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 truncate flex-1">
            SHA: {fakeDeterministicHash(sampleText)}
          </div>
        </div>
      </div>

      {finished ? (
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
              Badge « Maître des Clés » débloqué !
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 tabular-nums">
              Score final : <strong>{score} / {MISSIONS.length}</strong> ({mistakes} erreur
              {mistakes > 1 ? 's' : ''}) · {earnedStars}/3 étoiles
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Rejouer les 6 missions
          </button>
        </section>
      ) : (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
                Mini-jeu · Maître des Clés {isCompleted ? '· Déjà validé' : ''}
              </p>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                {current.title}
              </h2>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
              Étape {stepIdx + 1} / {MISSIONS.length} · Score {score}
            </span>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <p className="text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
              {current.scenario}
            </p>
            <p className="text-xs text-sky-800 dark:text-sky-300">
              <strong>Indice du Phare :</strong> {current.clue}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const isPicked = selected === m.id;
              const isRight = m.id === current.correct;
              let style =
                'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-900 dark:text-slate-100';
              if (selected) {
                if (isRight) {
                  style =
                    'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200';
                } else if (isPicked) {
                  style =
                    'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-950 dark:text-red-200';
                } else {
                  style =
                    'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500';
                }
              }

              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={Boolean(selected)}
                  onClick={() => handleChoose(m.id)}
                  className={`p-4 rounded-xl border text-left transition-colors flex items-start justify-between gap-3 ${style}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="font-display text-sm font-bold">{m.label}</span>
                    </div>
                    <p className="text-xs opacity-80">{m.short}</p>
                  </div>
                  {selected && isRight && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  {selected && isPicked && !isRight && (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
              <p className="leading-relaxed">
                <strong>{selected === current.correct ? 'Exact !' : 'À retenir :'}</strong>{' '}
                {current.explanation}
              </p>
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {stepIdx + 1 >= MISSIONS.length ? 'Terminer la mission' : 'Mission suivante →'}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
