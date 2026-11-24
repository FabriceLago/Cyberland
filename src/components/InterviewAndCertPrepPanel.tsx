import React, { useState } from 'react';
import {
  Award,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../utils/sound';

interface InterviewAndCertPrepPanelProps {
  completedIslands: number[];
  onOpenIsland?: (islandId: number) => void;
  onAwardXp?: (xp: number) => void;
}

interface CertTrack {
  id: string;
  name: string;
  vendor: string;
  level: string;
  requiredIslands: number[];
  focus: string;
}

const CERT_TRACKS: CertTrack[] = [
  {
    id: 'net-plus',
    name: 'CompTIA Network+ / CCNA Bases',
    vendor: 'Réseau & Infrastructure',
    level: 'Junior / Technicien',
    requiredIslands: [1, 2, 3, 7, 8, 13, 18, 20, 21],
    focus: 'OSI, TCP/UDP, IPv4/IPv6, VLANs 802.1Q, VPN/NAT, Wi-Fi WPA3 et diagnostic Wireshark.',
  },
  {
    id: 'sec-plus',
    name: 'CompTIA Security+ / Analyste SOC',
    vendor: 'Cybersécurité & Défense',
    level: 'Intermédiaire',
    requiredIslands: [3, 10, 11, 15, 16, 19, 20, 22],
    focus: 'Zero Trust, cryptographie, DMZ & pare-feu, Active Directory, SIEM/SOAR, OAuth2/JWT.',
  },
  {
    id: 'aws-ccp',
    name: 'AWS Cloud Practitioner / Azure AZ-900',
    vendor: 'Cloud & DevOps',
    level: 'Fondamentaux Cloud',
    requiredIslands: [4, 5, 6, 9, 12, 14, 17, 19],
    focus: 'IaaS/PaaS/SaaS, Multi-AZ, FinOps, Docker, Kubernetes, CI/CD et observabilité Azure Monitor.',
  },
];

interface InterviewQuestion {
  id: string;
  role: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  recruiterExpectation: string;
}

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'int-1',
    role: 'Admin Systèmes & Réseaux',
    prompt:
      '« Un utilisateur ne peut plus charger un site interne par son nom de domaine, mais le ping sur l’IP du serveur répond en 2 ms. Quel est votre premier diagnostic ? »',
    options: [
      'Remplacer immédiatement la carte réseau du poste',
      'Vérifier la résolution DNS (nslookup/dig, serveur DNS configuré, enregistrement A/AAAA) car la connectivité IP de couche 3 fonctionne déjà',
      'Redémarrer tous les switchs du bâtiment',
      'Désactiver le pare-feu du serveur web',
    ],
    correctIndex: 1,
    recruiterExpectation:
      'Le recruteur attend une démarche méthodique par couches (OSI) : le ping IP valide L1–L3, donc l’anomalie se situe sur le DNS (ou le service applicatif/TLS).',
  },
  {
    id: 'int-2',
    role: 'Ingénieur Sécurité / SOC',
    prompt:
      '« Quelle est la différence entre encodage (Base64), hachage (Argon2/SHA-256) et chiffrement (AES/TLS) ? Que choisissez-vous pour stocker un mot de passe en base ? »',
    options: [
      'Tous les trois sont synonymes ; on peut stocker les mots de passe en Base64',
      'Encodage = format réversible sans clé ; Chiffrement = réversible avec clé ; Hachage = irréversible. Pour un mot de passe, toujours un hachage lent salé (Argon2id ou bcrypt)',
      'Chiffrement AES avec une clé codée en dur dans le frontend',
      'Hachage MD5 sans sel pour que la connexion soit plus rapide',
    ],
    correctIndex: 1,
    recruiterExpectation:
      'Question classique n°1 en entretien cyber : montrer la distinction nette entre réversibilité et irréversibilité, et citer le sel unique + Argon2id/bcrypt.',
  },
  {
    id: 'int-3',
    role: 'Architecte Cloud / DevOps',
    prompt:
      '« Vous déployez une application web + base PostgreSQL sur un serveur neuf. Comment organisez-vous les ports et le pare-feu ? »',
    options: [
      'Ouvrir 80, 443, 22 et 5432 à 0.0.0.0/0 pour faciliter le debug',
      'Politique Deny-by-Default : exposer uniquement 443 (Nginx Reverse Proxy TLS) + 80 redirigé, SSH (22) par clé Ed25519 restreint à IP admin/VPN, et PostgreSQL isolé sur réseau privé / 127.0.0.1',
      'Exposer Node.js directement sur le port 3000 sans HTTPS ni pare-feu',
      'Installer Telnet sur le port 23 en secours',
    ],
    correctIndex: 1,
    recruiterExpectation:
      'Le recruteur évalue le réflexe défense en profondeur (DMZ / Deny-by-Default / Reverse Proxy TLS / zéro exposition de la base de données).',
  },
  {
    id: 'int-4',
    role: 'Ingénieur Réseau',
    prompt:
      '« Pourquoi segmenter un switch d’entreprise en VLANs 802.1Q et quelle est la différence entre un port Access et un port Trunk ? »',
    options: [
      'Pour isoler les domaines de diffusion et limiter les mouvements latéraux : Access relie un poste à 1 seul VLAN, Trunk transporte plusieurs VLANs étiquetés 802.1Q vers un routeur ou autre switch',
      'Les VLANs servent uniquement à augmenter la portée du Bluetooth',
      'Access et Trunk font exactement la même chose',
      'Un port Trunk désactive le chiffrement Wi-Fi',
    ],
    correctIndex: 0,
    recruiterExpectation:
      'Savoir expliquer à la fois le bénéfice performance (broadcast) et sécurité (cloisonnement), puis maîtriser Access vs Trunk 802.1Q.',
  },
  {
    id: 'int-5',
    role: 'Développeur Full-Stack / Sécurité API',
    prompt:
      '« Un client connecté en tant qu’utilisateur #42 modifie l’URL GET /api/invoices/42 en /api/invoices/43 et obtient la facture d’un autre client. De quelle faille s’agit-il et comment la corriger ? »',
    options: [
      'Une attaque DDoS ; il faut ajouter un CDN',
      'Une faille IDOR / BOLA (Broken Object Level Authorization) : il faut vérifier côté serveur que la ressource demandée appartient bien à l’identité authentifiée dans le JWT/session',
      'Une erreur DNS ; il faut vider le cache navigateur',
      'C’est normal si l’API utilise HTTPS',
    ],
    correctIndex: 1,
    recruiterExpectation:
      'Nommer IDOR / BOLA (n°1 du OWASP API Top 10) et rappeler que HTTPS ou l’authentification seule ne remplacent jamais le contrôle d’autorisation par objet.',
  },
  {
    id: 'int-6',
    role: 'SRE / Administrateur Production',
    prompt:
      '« Quelle différence faites-vous entre RPO et RTO lors d’un Plan de Reprise d’Activité (PRA) après un ransomware ? »',
    options: [
      'RPO = perte maximale de données tolérée dans le temps (fréquence des backups) ; RTO = durée maximale d’indisponibilité tolérée avant remise en service',
      'RPO = prix des disques durs ; RTO = débit de la fibre optique',
      'Les deux signifient exactement le temps de redémarrage d’un serveur',
      'Ils ne s’appliquent qu’aux réseaux Wi-Fi',
    ],
    correctIndex: 0,
    recruiterExpectation:
      'Distinguer clairement la perte de données (RPO) du temps d’arrêt (RTO) et mentionner la règle 3-2-1-1-0 (copie immuable + tests de restauration).',
  },
];

export const InterviewAndCertPrepPanel: React.FC<InterviewAndCertPrepPanelProps> = ({
  completedIslands,
  onOpenIsland,
  onAwardXp,
}) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const correctCount = INTERVIEW_QUESTIONS.filter(
    (q) => answers[q.id] === q.correctIndex
  ).length;

  const handleSubmit = () => {
    setSubmitted(true);
    if (correctCount >= 5) {
      playVictory();
    } else if (correctCount >= 3) {
      playSuccess();
    } else {
      playError();
    }
    if (correctCount > 0) {
      onAwardXp?.(correctCount * 15);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Certification Readiness Tracks */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-400">
            <GraduationCap className="w-4 h-4" />
            <span>Référentiels Officiels · Progression calculée sur vos îles validées</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Préparation aux Certifications IT &amp; Cyber
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {CERT_TRACKS.map((track) => {
            const doneCount = track.requiredIslands.filter((id) =>
              completedIslands.includes(id)
            ).length;
            const pct = Math.round((doneCount / track.requiredIslands.length) * 100);
            const missingFirst = track.requiredIslands.find(
              (id) => !completedIslands.includes(id)
            );
            return (
              <div
                key={track.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {track.vendor} · {track.level}
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    {track.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {track.focus}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-slate-400">
                      Préparation : {doneCount} / {track.requiredIslands.length} îles
                    </span>
                    <span className="font-bold text-sky-700 dark:text-sky-400 tabular-nums">
                      {pct} %
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        pct === 100 ? 'bg-emerald-600' : 'bg-sky-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {missingFirst && onOpenIsland ? (
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        onOpenIsland(missingFirst);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline pt-1"
                    >
                      Travailler l&apos;Île {missingFirst}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 pt-1">
                      <Award className="w-3.5 h-3.5" />
                      Prêt pour l&apos;examen blanc !
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Technical Recruiter Interview Simulator */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
              <Briefcase className="w-4 h-4" />
              <span>Simulation Recruteur · 6 questions pièges fréquentes en entretien</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Simulateur d&apos;Entretien Technique
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              setAnswers({});
              setSubmitted(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Recommencer
          </button>
        </div>

        <div className="space-y-5">
          {INTERVIEW_QUESTIONS.map((q, idx) => {
            const picked = answers[q.id];
            return (
              <div
                key={q.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3"
              >
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Question {idx + 1} / {INTERVIEW_QUESTIONS.length} · Poste : {q.role}
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {q.prompt}
                </p>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isPicked = picked === optIdx;
                    const isRight = optIdx === q.correctIndex;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={submitted}
                        onClick={() => {
                          playClick();
                          setAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-colors ${
                          submitted
                            ? isRight
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                              : isPicked
                                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                            : isPicked
                              ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-900 dark:text-sky-200 font-semibold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-400 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {submitted && (
                  <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    {picked === q.correctIndex ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <span>
                      <strong>Grille recruteur :</strong> {q.recruiterExpectation}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {!submitted ? (
            <button
              type="button"
              disabled={answeredCount < INTERVIEW_QUESTIONS.length}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white text-sm font-bold transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Corriger mon entretien ({answeredCount}/{INTERVIEW_QUESTIONS.length})
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              Résultat entretien : <span className="font-mono tabular-nums">{correctCount} / {INTERVIEW_QUESTIONS.length}</span> ·{' '}
              {correctCount >= 5
                ? 'Profil très solide : prêt pour un poste junior/intermédiaire !'
                : correctCount >= 3
                  ? 'Bonnes bases : approfondissez les points de la grille recruteur ci-dessus.'
                  : 'Recommandation : révisez les îles correspondantes avant votre entretien.'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
