import React, { useState } from 'react';
import {
  CheckCircle2,
  Flag,
  HelpCircle,
  Lock,
  RotateCcw,
  ShieldCheck,
  Terminal,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface CtfGuidedLabProps {
  onCaptureFlag?: (flagId: string, xp: number) => void;
}

interface CtfChallenge {
  id: string;
  category: string;
  title: string;
  difficulty: 'Facile' | 'Intermédiaire' | 'Avancé';
  points: number;
  briefing: string;
  artifactLabel: string;
  artifactContent: string;
  helperTool?: {
    label: string;
    output: string;
  };
  hints: string[];
  expectedFlag: string;
  debrief: string;
}

const CTF_CHALLENGES: CtfChallenge[] = [
  {
    id: 'ctf-crypto-b64',
    category: 'Cryptographie / Encodage',
    title: '01. Signal intercepté en Base64',
    difficulty: 'Facile',
    points: 25,
    briefing:
      'Un script d’exfiltration a laissé une chaîne encodée dans la variable d’environnement d’un conteneur. Décodez cette chaîne Base64 pour extraire le drapeau.',
    artifactLabel: 'capture_env.txt',
    artifactContent: `APP_ENV=production
SYNC_ENDPOINT=https://relay.cyberland.gem/v1
SECRET_PAYLOAD=RkxBR3tCNFMzNjRfUjNTMyF1fQ==`,
    helperTool: {
      label: 'Exécuter : echo "RkxBR3tCNFMzNjRfUjNTMyF1fQ==" | base64 -d',
      output: 'FLAG{B4S364_R3S3!u}',
    },
    hints: [
      'Le double « == » en fin de chaîne est la signature typique d’un encodage Base64 (ce n’est PAS du chiffrement).',
      'Utilisez l’outil de décodage intégré ci-dessous pour exécuter « base64 -d ».',
    ],
    expectedFlag: 'FLAG{B4S364_R3S3!u}',
    debrief:
      'Le Base64 est un simple encodage réversible sans clé secrète : ne l’utilisez jamais pour protéger des mots de passe ou des secrets.',
  },
  {
    id: 'ctf-logs-nginx',
    category: 'Forensics / Logs',
    title: '02. Intrusion dans les logs Nginx',
    difficulty: 'Facile',
    points: 30,
    briefing:
      'Un attaquant a scanné le serveur web et a réussi à exfiltrer un fichier sauvegardé par erreur dans la racine web. Repérez la seule requête ayant renvoyé un code HTTP 200 avec le drapeau.',
    artifactLabel: '/var/log/nginx/access.log',
    artifactContent: `185.220.101.4 - - [23/11/2026:03:11:02] "GET /.env HTTP/1.1" 404 153 "-" "curl/8.4"
185.220.101.4 - - [23/11/2026:03:11:04] "GET /wp-admin HTTP/1.1" 403 198 "-" "curl/8.4"
185.220.101.4 - - [23/11/2026:03:11:09] "GET /backup_2026.sql HTTP/1.1" 404 153 "-" "curl/8.4"
185.220.101.4 - - [23/11/2026:03:11:15] "GET /debug/FLAG{L0G_HUNT3R_200}.txt HTTP/1.1" 200 4120 "-" "curl/8.4"
185.220.101.4 - - [23/11/2026:03:11:22] "POST /api/login HTTP/1.1" 429 92 "-" "curl/8.4"`,
    hints: [
      'Filtrez mentalement les codes 404 (introuvable), 403 (bloqué) et 429 (rate-limited).',
      'Regardez attentivement la ligne horodatée 03:11:15 qui retourne un code HTTP 200.',
    ],
    expectedFlag: 'FLAG{L0G_HUNT3R_200}',
    debrief:
      'Toujours bloquer l’accès aux répertoires /debug ou fichiers de sauvegarde dans Nginx et surveiller les codes 200 anormaux dans le SIEM.',
  },
  {
    id: 'ctf-web-headers',
    category: 'Audit Web / HTTP',
    title: '03. Fuite dans les en-têtes HTTP',
    difficulty: 'Intermédiaire',
    points: 30,
    briefing:
      'Un développeur a laissé un en-tête personnalisé de débogage actif en production. Analysez la réponse brute de la requête « curl -I ».',
    artifactLabel: 'curl -I https://api.cyberland.gem/health',
    artifactContent: `HTTP/2 200
server: nginx/1.26.1
content-type: application/json
strict-transport-security: max-age=31536000; includeSubDomains
x-content-type-options: nosniff
x-debug-build-token: FLAG{H3AD3R_L3AK_443}
cache-control: no-store`,
    hints: [
      'Les en-têtes non standards commencent souvent par « x- ».',
      'Observez l’en-tête « x-debug-build-token ».',
    ],
    expectedFlag: 'FLAG{H3AD3R_L3AK_443}',
    debrief:
      'En production, supprimez les en-têtes de debug (X-Powered-By, X-Debug-*) et masquez la version serveur (server_tokens off dans Nginx).',
  },
  {
    id: 'ctf-dns-exfil',
    category: 'Réseau / DNS Tunneling',
    title: '04. Exfiltration cachée dans les requêtes DNS',
    difficulty: 'Intermédiaire',
    points: 35,
    briefing:
      'Un poste compromis contourne le pare-feu HTTP en découpant un secret en sous-domaines DNS vers un domaine externe. Reconstituez le drapeau à partir de la capture DNS.',
    artifactLabel: 'tcpdump -i eth0 port 53',
    artifactContent: `14:02:11.012 IP 10.20.0.45.54112 > 10.20.0.1.53: A? FLAG{.exfil.bad-actor.xyz.
14:02:11.240 IP 10.20.0.45.54118 > 10.20.0.1.53: A? DNS_TUNN3L.exfil.bad-actor.xyz.
14:02:11.519 IP 10.20.0.45.54129 > 10.20.0.1.53: A? _2026}.exfil.bad-actor.xyz.`,
    hints: [
      'Chaque requête DNS contient un morceau du message juste avant « .exfil.bad-actor.xyz ».',
      'Concaténez dans l’ordre chronologique les 3 sous-domaines : partie 1 + partie 2 + partie 3.',
    ],
    expectedFlag: 'FLAG{DNS_TUNN3L_2026}',
    debrief:
      'Le DNS Tunneling profite du fait que le port UDP/53 est souvent autorisé en sortie. Un résolveur DNS filtrant (RPZ) + détection d’entropie SIEM bloque cette exfiltration.',
  },
  {
    id: 'ctf-linux-privesc',
    category: 'Système Linux / PrivEsc',
    title: '05. Mauvaise configuration sudo (Escalade de privilèges)',
    difficulty: 'Avancé',
    points: 40,
    briefing:
      'Vous auditez un serveur Linux avec un compte standard « stagiaire ». La commande « sudo -l » révèle une règle dangereuse permettant de lire le fichier protégé /root/flag.txt.',
    artifactLabel: 'stagiaire@srv-web:~$ sudo -l',
    artifactContent: `Matching Defaults entries for stagiaire on srv-web:
    env_reset, mail_badpass

User stagiaire may run the following commands on srv-web:
    (root) NOPASSWD: /usr/bin/cat /var/log/app.log
    (root) NOPASSWD: /usr/bin/find`,
    helperTool: {
      label: 'Tester l’audit : sudo /usr/bin/find /root -name flag.txt -exec cat {} +',
      output: 'FLAG{SUDO_LEAST_PR1V}',
    },
    hints: [
      'Regardez la seconde ligne sudo : l’utilitaire « find » autorisé en root sans mot de passe permet d’exécuter n’importe quelle commande via « -exec » (GTFOBins).',
      'Lancez la commande de vérification ci-dessous pour prouver l’impact et récupérer le flag.',
    ],
    expectedFlag: 'FLAG{SUDO_LEAST_PR1V}',
    debrief:
      'N’accordez jamais NOPASSWD sudo sur des binaires capables de lancer des sous-commandes (find, vim, less, python, tar). Appliquez strictement le moindre privilège.',
  },
];

export const CtfGuidedLab: React.FC<CtfGuidedLabProps> = ({ onCaptureFlag }) => {
  const [selectedId, setSelectedId] = useState<string>(CTF_CHALLENGES[0].id);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, number>>({});
  const [toolRan, setToolRan] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const active = CTF_CHALLENGES.find((c) => c.id === selectedId) ?? CTF_CHALLENGES[0];
  const isSolved = solvedIds.includes(active.id);
  const totalPoints = CTF_CHALLENGES.filter((c) => solvedIds.includes(c.id)).reduce(
    (sum, c) => sum + c.points,
    0
  );
  const maxPoints = CTF_CHALLENGES.reduce((sum, c) => sum + c.points, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const attempt = (inputs[active.id] || '').trim();
    if (!attempt) return;

    if (attempt === active.expectedFlag) {
      if (!solvedIds.includes(active.id)) {
        const nextSolved = [...solvedIds, active.id];
        setSolvedIds(nextSolved);
        onCaptureFlag?.(active.id, active.points);
        if (nextSolved.length === CTF_CHALLENGES.length) {
          playVictory();
        } else {
          playSuccess();
        }
      } else {
        playSuccess();
      }
      setFeedback({
        kind: 'ok',
        text: `Drapeau validé (+${active.points} XP) ! ${active.debrief}`,
      });
    } else {
      playError();
      setFeedback({
        kind: 'err',
        text: 'Drapeau incorrect. Vérifiez la casse exacte et le format FLAG{...} (aidez-vous d’un indice si besoin).',
      });
    }
  };

  const handleResetAll = () => {
    playClick();
    setSolvedIds([]);
    setInputs({});
    setRevealedHints({});
    setToolRan({});
    setFeedback(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
            <Flag className="w-4 h-4" />
            <span>Épreuves Jeopardy · Cryptographie · Logs · Web · DNS · Linux</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Capture The Flag (CTF) Guidé Cyberland
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Résolvez 5 investigations réalistes en inspectant des artefacts bruts et soumettez chaque drapeau au format <code className="font-mono text-xs text-slate-900 dark:text-slate-200">FLAG&#123;...&#125;</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs">
            <div>
              <div className="text-slate-500">Drapeaux</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {solvedIds.length} / {CTF_CHALLENGES.length}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <div className="text-slate-500">Score CTF</div>
              <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {totalPoints} / {maxPoints} XP
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Main 2-column Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Challenge List */}
        <div className="lg:col-span-4 space-y-2">
          {CTF_CHALLENGES.map((ch) => {
            const done = solvedIds.includes(ch.id);
            const isSelected = ch.id === active.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedId(ch.id);
                  setFeedback(null);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  isSelected
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{ch.category} · {ch.difficulty}</span>
                  <span className="font-mono font-bold text-sky-700 dark:text-sky-400 tabular-nums">
                    +{ch.points} XP
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {ch.title}
                  </span>
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Investigation Desk */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {active.category} · Niveau {active.difficulty} · +{active.points} XP
              </p>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {active.title}
              </h3>
            </div>
            {isSolved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                Capturé
              </span>
            )}
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {active.briefing}
          </p>

          {/* Artifact Terminal */}
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              <span>{active.artifactLabel}</span>
            </div>
            <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
              {active.artifactContent}
            </pre>
          </div>

          {/* Built-in Helper Tool (for Base64 / Linux Proof) */}
          {active.helperTool && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setToolRan((prev) => ({ ...prev, [active.id]: true }));
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-mono font-semibold transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                {active.helperTool.label}
              </button>
              {toolRan[active.id] && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300">
                  → Sortie : {active.helperTool.output}
                </div>
              )}
            </div>
          )}

          {/* Flag Submission Form */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <input
              type="text"
              value={inputs[active.id] || ''}
              onChange={(e) =>
                setInputs((prev) => ({ ...prev, [active.id]: e.target.value }))
              }
              placeholder="Saisissez le drapeau : FLAG{...}"
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold transition-colors whitespace-nowrap"
            >
              <Flag className="w-4 h-4" />
              Soumettre le Flag
            </button>
          </form>

          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                feedback.kind === 'ok'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              {feedback.kind === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Progressive Hints */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Indices progressifs ({revealedHints[active.id] || 0} / {active.hints.length})
              </span>
              {(revealedHints[active.id] || 0) < active.hints.length && (
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setRevealedHints((prev) => ({
                      ...prev,
                      [active.id]: (prev[active.id] || 0) + 1,
                    }));
                  }}
                  className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline"
                >
                  Débloquer un indice
                </button>
              )}
            </div>
            {(revealedHints[active.id] || 0) > 0 && (
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {active.hints.slice(0, revealedHints[active.id] || 0).map((hint) => (
                  <li
                    key={hint}
                    className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60"
                  >
                    {hint}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {solvedIds.length === CTF_CHALLENGES.length && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
              <span>
                Félicitations ! Tous les 5 drapeaux du CTF Cyberland ont été capturés ({maxPoints} XP).
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
