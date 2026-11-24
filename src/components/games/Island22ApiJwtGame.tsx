import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island22ApiJwtGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

export const Island22ApiJwtGame: React.FC<Island22ApiJwtGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [oauthChoice, setOauthChoice] = useState('implicit');
  const [jwtAction, setJwtAction] = useState('trust-payload');
  const [apiProtections, setApiProtections] = useState<string[]>([]);

  const toggleProtection = (id: string) => {
    playClick();
    setApiProtections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePhase1 = () => {
    if (oauthChoice !== 'auth-code-pkce') {
      playError();
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'err',
        text: 'Le flux Implicit est obsolète et expose le token dans l’URL. Utilisez Authorization Code + PKCE pour sécuriser les applications modernes (SPA/Mobile).',
      });
      return;
    }
    playSuccess();
    setFeedback({
      kind: 'ok',
      text: 'Parfait ! Authorization Code + PKCE protège l’échange de code contre toute interception.',
    });
    setPhase(2);
  };

  const handlePhase2 = () => {
    if (jwtAction !== 'verify-sig-exp') {
      playError();
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'err',
        text: 'Ne faites jamais confiance au payload décodé en Base64 sans vérifier la signature cryptographique (RS256/ES256), l’algorithme autorisé et la date d’expiration (exp).',
      });
      return;
    }
    playSuccess();
    setFeedback({
      kind: 'ok',
      text: 'Jeton falsifié bloqué ! Passons au blindage de la passerelle API contre IDOR et abus de requêtes.',
    });
    setPhase(3);
  };

  const handlePhase3 = () => {
    const required = ['idor-ownership', 'rate-limit', 'short-ttl'];
    const hasAll = required.every((r) => apiProtections.includes(r));
    const hasBad = apiProtections.includes('disable-tls');
    if (!hasAll || hasBad) {
      playError();
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'err',
        text: 'Activez les 3 défenses API essentielles (vérification de propriété anti-IDOR, Rate Limiting, Access Token courte durée) sans jamais désactiver TLS.',
      });
      return;
    }
    playVictory();
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    setPhase(4);
    setFeedback({
      kind: 'ok',
      text: 'Passerelle API, OAuth 2.0 + PKCE et validation JWT entièrement sécurisés !',
    });
    onComplete(stars);
  };

  const handleReset = () => {
    playClick();
    setPhase(1);
    setMistakes(0);
    setFeedback(null);
    setOauthChoice('implicit');
    setJwtAction('trust-payload');
    setApiProtections([]);
  };

  const starsEarned = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
            <KeyRound className="w-4 h-4" />
            <span>Mission Pratique · Île 22 · OAuth 2.0, JWT &amp; Passerelle API</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            Blinde la Passerelle API Cyberland
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-600 dark:text-slate-400 tabular-nums">
            Étape {Math.min(phase, 3)} / 3 · Erreurs : {mistakes}
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-sans font-semibold text-slate-700 dark:text-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
            feedback.kind === 'err'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          {feedback.kind === 'err' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {phase === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Quel flux OAuth 2.0 / OpenID Connect devez-vous choisir pour connecter une application Web SPA et une app mobile sans stocker de secret client dans le navigateur ?
          </p>
          <div className="space-y-2">
            {[
              { id: 'implicit', label: 'Implicit Flow (Access Token renvoyé directement dans le hash #URL)' },
              { id: 'password', label: 'Resource Owner Password Credentials (envoyer le mot de passe en clair)' },
              {
                id: 'auth-code-pkce',
                label: 'Authorization Code Flow + PKCE (code_verifier / code_challenge SHA-256)',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  playClick();
                  setOauthChoice(opt.id);
                }}
                className={`w-full text-left p-4 rounded-xl border text-sm transition-colors ${
                  oauthChoice === opt.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handlePhase1}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold"
          >
            Valider le flux OAuth 2.0
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {phase === 2 && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-rose-300">
            <div>Requête entrante : GET /api/v1/admin/invoices</div>
            <div>Header JWT : &#123; &quot;alg&quot;: &quot;none&quot;, &quot;typ&quot;: &quot;JWT&quot; &#125;</div>
            <div>Payload JWT : &#123; &quot;sub&quot;: &quot;42&quot;, &quot;role&quot;: &quot;admin&quot; &#125;</div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Comment le middleware de votre API doit-il traiter ce jeton ?
          </p>
          <div className="space-y-2">
            {[
              { id: 'trust-payload', label: 'Décoder le Base64 et accorder l’accès admin puisque role="admin"' },
              {
                id: 'verify-sig-exp',
                label: 'Rejeter avec HTTP 401 : imposer une liste blanche d’algorithmes (RS256) + vérifier la signature JWKS + exp/aud/iss',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  playClick();
                  setJwtAction(opt.id);
                }}
                className={`w-full text-left p-4 rounded-xl border text-sm transition-colors ${
                  jwtAction === opt.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handlePhase2}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold"
          >
            Appliquer le middleware JWT
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {phase === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Cochez les 3 contrôles indispensables sur la passerelle API pour stopper les failles OWASP API Top 10 (IDOR / BOLA, abus de requêtes, vol de jeton) :
          </p>
          <div className="space-y-2">
            {[
              {
                id: 'idor-ownership',
                label: 'Vérifier côté serveur que resource.ownerId === jwt.sub sur chaque endpoint /orders/{id} (anti-IDOR / BOLA)',
              },
              {
                id: 'rate-limit',
                label: 'Activer le Rate Limiting par IP / utilisateur (HTTP 429 Too Many Requests)',
              },
              {
                id: 'short-ttl',
                label: 'Access Token courte durée (15 min) + Refresh Token rotatif en cookie HttpOnly Secure',
              },
              {
                id: 'disable-tls',
                label: 'Désactiver HTTPS pour réduire la latence de 2 ms',
              },
            ].map((item) => {
              const checked = apiProtections.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleProtection(item.id)}
                  className={`w-full text-left p-4 rounded-xl border text-sm flex items-center gap-3 transition-colors ${
                    checked
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 ${checked ? 'text-emerald-600' : 'text-slate-400'}`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handlePhase3}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
          >
            Déployer la passerelle sécurisée
          </button>
        </div>
      )}

      {phase === 4 && (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              API &amp; OAuth 2.0 conformes OWASP API Security !
            </h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= starsEarned ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Authorization Code + PKCE, validation cryptographique RS256, protection anti-IDOR et Rate Limiting sont actifs.
            {isCompleted ? ' Île 22 validée.' : ''}
          </p>
        </div>
      )}
    </div>
  );
};
