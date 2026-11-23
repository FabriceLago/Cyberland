import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Star,
  ArrowRight,
  Mail,
  Wifi,
  KeyRound,
  Link2,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island10CyberBayGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

interface CyberCase {
  id: string;
  channel: 'E-mail' | 'Wi-Fi Public' | 'Double Auth (MFA)' | 'Lien Web';
  title: string;
  senderOrSource: string;
  content: string;
  clueToInspect: string;
  isThreat: boolean;
  explanation: string;
}

const CYBER_CASES: CyberCase[] = [
  {
    id: 'cyb-1',
    channel: 'E-mail',
    title: 'Urgence : Votre compte Cloud sera supprimé dans 15 minutes !',
    senderOrSource: 'support@gemin1sland-securite-urgent.xyz',
    content:
      'Bonjour cher client, cliquez immédiatement sur le lien ci-dessous et saisissez votre mot de passe administrateur pour éviter la suppression définitive de vos îles.',
    clueToInspect: 'Domaine suspect (gemin1sland avec un « 1 ») + faux sentiment d’urgence.',
    isThreat: true,
    explanation:
      'Phishing classique (typosquatting) : l’expéditeur imite le vrai domaine avec un chiffre « 1 » et crée une panique artificielle pour voler le mot de passe.',
  },
  {
    id: 'cyb-2',
    channel: 'Wi-Fi Public',
    title: 'Borne « Cyberland_FREE_VIP_NO_PASSWORD »',
    senderOrSource: 'Réseau Wi-Fi ouvert (aucun chiffrement WPA3) près du quai',
    content:
      'Un panneau pirate annonce un Wi-Fi gratuit sans mot de passe demandant de se connecter avec ses identifiants bancaires pour « vérifier l’identité ».',
    clueToInspect: 'Point d’accès ouvert non chiffré (« Evil Twin ») exigeant des identifiants sensibles.',
    isThreat: true,
    explanation:
      'Attaque « Evil Twin » (faux point d’accès) : un pirate crée un Wi-Fi gratuit pour intercepter le trafic. Utilisez votre 4G/5G ou activez un VPN.',
  },
  {
    id: 'cyb-3',
    channel: 'Lien Web',
    title: 'Portail officiel de météo de l’archipel',
    senderOrSource: 'https://meteo.cyberland.gem (Certificat TLS valide)',
    content:
      'Lien ouvert depuis vos favoris habituels. Aucune faute dans le nom de domaine, protocole HTTPS actif sur port 443, aucune demande inhabituelle de mot de passe.',
    clueToInspect: 'Domaine exact vérifié + HTTPS valide + provenance sûre.',
    isThreat: false,
    explanation:
      'Connexion légitime : le nom de domaine officiel est exact, le certificat TLS est valide et la demande est cohérente.',
  },
  {
    id: 'cyb-4',
    channel: 'Double Auth (MFA)',
    title: 'Notification MFA reçue à 3h14 du matin',
    senderOrSource: 'Demande de validation : Connexion depuis un pays inconnu',
    content:
      'Votre téléphone vibre pendant votre sommeil : « Approuver la connexion administrateur sur la Forteresse ? » alors que vous n’avez rien lancé.',
    clueToInspect: 'Attaque par fatigue MFA : quelqu’un a probablement trouvé votre mot de passe.',
    isThreat: true,
    explanation:
      'Ne validez JAMAIS une notification MFA que vous n’avez pas déclenchée ! Refuser bloque l’intrus ; changez aussitôt votre mot de passe.',
  },
  {
    id: 'cyb-5',
    channel: 'E-mail',
    title: 'Rapport hebdomadaire interne de sauvegarde',
    senderOrSource: 'sauvegardes@cyberland.gem (Signé SPF/DKIM)',
    content:
      'Synthèse automatique : le snapshot chiffré de la Zone B a réussi à 02h00. Aucune pièce jointe exécutable, aucun lien demandant de mot de passe.',
    clueToInspect: 'Expéditeur interne authentifié, purement informatif, sans piège.',
    isThreat: false,
    explanation:
      'Notification légitime : domaine interne vérifié et aucune sollicitation d’identifiants ni pièce jointe piégée.',
  },
  {
    id: 'cyb-6',
    channel: 'Lien Web',
    title: 'Partage de fichier « Facture_Port.pdf.exe »',
    senderOrSource: 'Téléchargement reçu via messagerie d’un inconnu',
    content:
      'Un expéditeur inconnu vous envoie un fichier nommé Facture_Port.pdf.exe en vous demandant de désactiver votre antivirus pour l’ouvrir.',
    clueToInspect: 'Double extension (.pdf.exe = programme exécutable) + demande de couper l’antivirus.',
    isThreat: true,
    explanation:
      'Pièce jointe malveillante (malware/ransomware) déguisée en PDF grâce à une double extension. En approche Zero Trust, on bloque immédiatement.',
  },
];

export const Island10CyberBayGame: React.FC<Island10CyberBayGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [idx, setIdx] = useState(0);
  const [decision, setDecision] = useState<'allow' | 'block' | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const current = CYBER_CASES[idx];
  const answered = decision !== null;
  const userRight =
    answered &&
    ((decision === 'block' && current.isThreat) || (decision === 'allow' && !current.isThreat));

  const handleDecision = (choice: 'allow' | 'block') => {
    if (answered) return;
    setDecision(choice);
    const ok =
      (choice === 'block' && current.isThreat) || (choice === 'allow' && !current.isThreat);
    if (ok) {
      playSuccess();
      setScore((s) => s + 1);
    } else {
      playError();
    }
  };

  const handleNext = () => {
    playClick();
    if (idx + 1 < CYBER_CASES.length) {
      setIdx((i) => i + 1);
      setDecision(null);
    } else {
      const passed = score >= 4;
      const stars = score === CYBER_CASES.length ? 3 : score === 5 ? 2 : passed ? 1 : 0;
      setEarnedStars(stars);
      setFinished(true);
      if (passed) {
        playVictory();
        onComplete(stars);
      } else {
        playError();
      }
    }
  };

  const handleReset = () => {
    playClick();
    setIdx(0);
    setDecision(null);
    setScore(0);
    setFinished(false);
    setEarnedStars(0);
  };

  const ChannelIcon =
    current.channel === 'E-mail'
      ? Mail
      : current.channel === 'Wi-Fi Public'
      ? Wifi
      : current.channel === 'Double Auth (MFA)'
      ? KeyRound
      : Link2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 65% Cyber Inspection Console */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-semibold">
            Mini-jeu · Détecteur d&apos;Imposteurs (Phishing &amp; Zero Trust)
          </span>
          <span className="font-mono text-xs text-sky-200 tabular-nums">
            {finished
              ? `Score : ${score}/${CYBER_CASES.length}`
              : `Dossier ${idx + 1}/${CYBER_CASES.length} · Détections : ${score}`}
          </span>
        </div>

        <div className="p-6 bg-[#EEF5FA] dark:bg-slate-800/70 space-y-5">
          {!finished ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="inline-flex items-center gap-1.5 font-semibold text-sky-700 dark:text-sky-400">
                  <ChannelIcon className="w-4 h-4" />
                  Canal : {current.channel}
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {current.senderOrSource}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  {current.title}
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  « {current.content} »
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  disabled={answered}
                  onClick={() => handleDecision('allow')}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border transition-colors ${
                    decision === 'allow'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-200'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-emerald-500 hover:bg-emerald-50/40'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Autoriser (Légitime)
                </button>
                <button
                  type="button"
                  disabled={answered}
                  onClick={() => handleDecision('block')}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border transition-colors ${
                    decision === 'block'
                      ? 'bg-red-50 dark:bg-red-950/50 border-red-500 text-red-950 dark:text-red-200'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-red-500 hover:bg-red-50/40'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                  Bloquer &amp; Signaler (Piège)
                </button>
              </div>

              {answered && (
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    userRight
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5 text-xs leading-relaxed">
                    {userRight ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-bold">
                        {userRight
                          ? 'Bon réflexe Zero Trust !'
                          : current.isThreat
                          ? 'Attention : c’était une menace à bloquer !'
                          : 'Faux positif : ce message était légitime.'}
                      </p>
                      <p>{current.explanation}</p>
                      <p className="opacity-80">
                        <strong>Indice clé :</strong> {current.clueToInspect}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {idx + 1 < CYBER_CASES.length ? 'Dossier suivant' : 'Voir mon bilan'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`p-6 rounded-xl border space-y-4 ${
                score >= 4
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl font-bold tabular-nums">
                    {score >= 4
                      ? `Baie sécurisée : ${score} / ${CYBER_CASES.length} !`
                      : `Score : ${score} / ${CYBER_CASES.length} (objectif : 4/6)`}
                  </h3>
                  <p className="text-sm mt-1">
                    {score >= 4
                      ? 'Vous appliquez le principe Zero Trust : ne jamais faire confiance par défaut, toujours vérifier. Badge « Sentinelle Zero Trust » débloqué (+300 XP) !'
                      : 'Observez bien les domaines, extensions de fichiers et demandes MFA inattendues puis retentez.'}
                  </p>
                </div>
                {earnedStars > 0 && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-6 h-6 ${
                          s <= earnedStars
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Rejouer l&apos;inspection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right 35% Zero Trust Reflexes */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            Les 4 réflexes Zero Trust
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            « Ne jamais faire confiance par défaut, toujours vérifier. »
          </p>
        </div>

        <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
          <li className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <strong>1. Vérifier le domaine exact</strong> : méfiez-vous des lettres remplacées (l/1,
            o/0) et des urgences exagérées.
          </li>
          <li className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <strong>2. Double authentification (MFA)</strong> : bloque 99 % des vols de mots de
            passe, mais refusez toute alerte inattendue.
          </li>
          <li className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <strong>3. Wi-Fi public = non fiable</strong> : privilégiez la 4G/5G ou activez votre
            VPN chiffré.
          </li>
          <li>
            <strong>4. Extensions piégées</strong> : ne lancez jamais un fichier à double extension
            comme <span className="font-mono">.pdf.exe</span>.
          </li>
        </ul>

        <button
          type="button"
          onClick={handleReset}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Réinitialiser
        </button>

        {isCompleted && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200">
            Badge <strong>Sentinelle Zero Trust</strong> validé !
          </div>
        )}
      </div>
    </div>
  );
};
