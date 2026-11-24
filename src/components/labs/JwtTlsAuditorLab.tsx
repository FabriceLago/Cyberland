import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileKey2,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { playClick, playError, playSuccess } from '../../utils/sound';

interface JwtScenario {
  id: string;
  label: string;
  header: Record<string, string>;
  payload: Record<string, string | number | boolean>;
  signaturePreview: string;
  status: 'vulnerable' | 'safe';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const JWT_SCENARIOS: JwtScenario[] = [
  {
    id: 'jwt-alg-none',
    label: 'Jeton #1 — Attaque alg: none',
    header: { alg: 'none', typ: 'JWT' },
    payload: { sub: 'user_42', role: 'superadmin', iat: 1795400000, exp: 1795486400 },
    signaturePreview: '(vide — aucune signature cryptographique)',
    status: 'vulnerable',
    question: 'Pourquoi ce jeton JWT doit-il être immédiatement rejeté par l’API ?',
    options: [
      'Parce que l’en-tête impose alg="none" sans signature, permettant à n’importe qui de forger role="superadmin"',
      'Parce que le champ typ vaut JWT',
      'Parce que sub contient un underscore',
      'Parce que la date iat est au format Unix',
    ],
    correctIndex: 0,
    explanation:
      'Une librairie mal configurée acceptant alg="none" saute totalement la vérification de signature. Toujours forcer une liste blanche d’algorithmes (ex. RS256 ou EdDSA) côté serveur.',
  },
  {
    id: 'jwt-expired',
    label: 'Jeton #2 — Jeton expiré & fuite secret',
    header: { alg: 'HS256', typ: 'JWT' },
    payload: {
      sub: 'alice@cyberland.gem',
      role: 'analyst',
      exp: 1700000000,
      dbPassword: 'SuperPassword2024!',
    },
    signaturePreview: 'HMACSHA256(header + "." + payload, "secret123")',
    status: 'vulnerable',
    question: 'Quelles sont les deux failles majeures de ce jeton ?',
    options: [
      'Il utilise HS256 au lieu de HTTP/2',
      'Le payload contient un secret en clair (Base64URL est lisible par tous) et la clé HMAC est faible / le jeton est expiré',
      'L’adresse e-mail est trop courte',
      'Le rôle analyst n’est pas valide en JSON',
    ],
    correctIndex: 1,
    explanation:
      'Un JWT standard (JWS) est signé, PAS chiffré : quiconque intercepte le jeton lit tout le payload en clair ! Ne stockez jamais de mot de passe ou donnée sensible dedans et vérifiez toujours « exp ».',
  },
  {
    id: 'jwt-valid',
    label: 'Jeton #3 — Architecture RS256 conforme',
    header: { alg: 'RS256', typ: 'JWT', kid: 'key-2026-prod' },
    payload: {
      iss: 'https://auth.cyberland.gem',
      aud: 'api.cyberland.gem',
      sub: 'usr_9821',
      scope: 'read:courses',
      exp: 1795600000,
    },
    signaturePreview: 'RSASSA-PKCS1-v1_5 SHA-256 (vérifié via JWKS public)',
    status: 'safe',
    question: 'Quel est l’avantage clé de la signature asymétrique RS256 avec « iss » et « aud » ?',
    options: [
      'Seul le serveur d’authentification possède la clé privée de signature ; les microservices vérifient via la clé publique JWKS et contrôlent l’émetteur (iss) et l’audience (aud)',
      'Elle rend le jeton valable à vie sans expiration',
      'Elle chiffre le trafic TCP sans besoin de HTTPS',
      'Elle permet de supprimer OAuth 2.0',
    ],
    correctIndex: 0,
    explanation:
      'Avec RS256/ES256, aucun microservice consommateur ne détient la clé privée : même si une API secondaire est compromise, l’attaquant ne peut pas forger de nouveaux jetons.',
  },
];

interface TlsCertCase {
  id: string;
  domainRequested: string;
  subjectCn: string;
  sanList: string[];
  issuer: string;
  validUntil: string;
  signatureAlg: string;
  verdict: 'valid' | 'invalid';
  issueSummary: string;
  fixAction: string;
}

const TLS_CASES: TlsCertCase[] = [
  {
    id: 'tls-san-mismatch',
    domainRequested: 'https://api.cyberland.gem',
    subjectCn: 'www.cyberland.gem',
    sanList: ['www.cyberland.gem', 'cyberland.gem'],
    issuer: 'Let’s Encrypt R10 (Trusted Root)',
    validUntil: '2027-02-15',
    signatureAlg: 'ECDSA P-256 / SHA-256',
    verdict: 'invalid',
    issueSummary: 'Erreur ERR_CERT_COMMON_NAME_INVALID : le domaine « api.cyberland.gem » est absent de la liste SAN (Subject Alternative Name).',
    fixAction: 'Réémettre le certificat TLS en incluant « api.cyberland.gem » (ou un wildcard *.cyberland.gem) dans le champ SAN.',
  },
  {
    id: 'tls-self-signed',
    domainRequested: 'https://intranet.cyberland.gem',
    subjectCn: 'intranet.cyberland.gem',
    sanList: ['intranet.cyberland.gem'],
    issuer: 'intranet.cyberland.gem (Auto-signé)',
    validUntil: '2027-08-01',
    signatureAlg: 'RSA 2048 / SHA-256',
    verdict: 'invalid',
    issueSummary: 'Erreur SEC_ERROR_UNKNOWN_ISSUER : certificat auto-signé par une autorité non reconnue par les navigateurs (risque d’habituer les utilisateurs à cliquer « Ignorer »).',
    fixAction: 'Faire signer le certificat par une Autorité de Certification reconnue (Let’s Encrypt ou PKI interne déployée par GPO).',
  },
  {
    id: 'tls-ok',
    domainRequested: 'https://portal.cyberland.gem',
    subjectCn: 'portal.cyberland.gem',
    sanList: ['portal.cyberland.gem', 'www.portal.cyberland.gem'],
    issuer: 'DigiCert TLS RSA4096 Root G5',
    validUntil: '2027-06-30',
    signatureAlg: 'ECDSA P-256 / SHA-256 · TLS 1.3',
    verdict: 'valid',
    issueSummary: 'Chaîne de confiance valide, SAN correspondant, date non expirée et chiffrement TLS 1.3 moderne.',
    fixAction: 'Aucune anomalie critique : activer HSTS et le renouvellement automatique ACME.',
  },
];

interface JwtTlsAuditorLabProps {
  onCompleteAudit?: () => void;
}

export const JwtTlsAuditorLab: React.FC<JwtTlsAuditorLabProps> = ({ onCompleteAudit }) => {
  const [mode, setMode] = useState<'jwt' | 'tls'>('jwt');
  const [jwtIndex, setJwtIndex] = useState(0);
  const [jwtAnswers, setJwtAnswers] = useState<Record<string, number>>({});
  const [tlsChecked, setTlsChecked] = useState<Record<string, 'valid' | 'invalid'>>({});
  const [awarded, setAwarded] = useState(false);

  const activeJwt = JWT_SCENARIOS[jwtIndex];
  const selectedJwtAns = jwtAnswers[activeJwt.id];

  const handleAnswerJwt = (optIdx: number) => {
    setJwtAnswers((prev) => ({ ...prev, [activeJwt.id]: optIdx }));
    if (optIdx === activeJwt.correctIndex) {
      playSuccess();
      const nextCount = Object.entries({ ...jwtAnswers, [activeJwt.id]: optIdx }).filter(([id, val]) => {
        const sc = JWT_SCENARIOS.find((s) => s.id === id);
        return sc && sc.correctIndex === val;
      }).length;
      if (nextCount === JWT_SCENARIOS.length && !awarded) {
        setAwarded(true);
        onCompleteAudit?.();
      }
    } else {
      playError();
    }
  };

  const handleJudgeTls = (caseItem: TlsCertCase, choice: 'valid' | 'invalid') => {
    setTlsChecked((prev) => ({ ...prev, [caseItem.id]: choice }));
    if (choice === caseItem.verdict) {
      playSuccess();
    } else {
      playError();
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
            Cryptographie Appliquée · JWS/JWT · Chaîne X.509 &amp; TLS 1.3
          </p>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Décodeur &amp; Auditeur JWT / Certificats TLS
          </h2>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
          <button
            type="button"
            onClick={() => {
              playClick();
              setMode('jwt');
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              mode === 'jwt'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Auditeur JWT (3 cas)
          </button>
          <button
            type="button"
            onClick={() => {
              playClick();
              setMode('tls');
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              mode === 'tls'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileKey2 className="w-3.5 h-3.5" />
            Inspecteur TLS X.509 (3 cas)
          </button>
        </div>
      </div>

      {mode === 'jwt' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {JWT_SCENARIOS.map((sc, idx) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  playClick();
                  setJwtIndex(idx);
                }}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors ${
                  idx === jwtIndex
                    ? 'bg-sky-700 text-white border-sky-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Decoded 3-part JWT Anatomy */}
            <div className="lg:col-span-6 space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-5 font-mono text-xs">
              <div className="text-slate-400">Anatomie décodée du jeton JWT</div>

              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60">
                <div className="text-rose-400 font-bold mb-1">1. HEADER (Algorithme &amp; Type)</div>
                <pre className="text-rose-200 overflow-x-auto">
                  {JSON.stringify(activeJwt.header, null, 2)}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/60">
                <div className="text-indigo-300 font-bold mb-1">2. PAYLOAD (Claims lisibles en Base64URL)</div>
                <pre className="text-indigo-100 overflow-x-auto">
                  {JSON.stringify(activeJwt.payload, null, 2)}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-900/60">
                <div className="text-sky-300 font-bold mb-1">3. SIGNATURE CRYPTOGRAPHIQUE</div>
                <div className="text-sky-100">{activeJwt.signaturePreview}</div>
              </div>
            </div>

            {/* Audit Question */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {activeJwt.status === 'vulnerable' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                )}
                <span>Diagnostic sécurité</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                {activeJwt.question}
              </h3>

              <div className="space-y-2">
                {activeJwt.options.map((opt, idx) => {
                  const chosen = selectedJwtAns === idx;
                  const isRight = idx === activeJwt.correctIndex;
                  const revealed = selectedJwtAns !== undefined;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleAnswerJwt(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-colors ${
                        revealed
                          ? isRight
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                            : chosen
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200'
                              : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-500'
                          : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-sky-400 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {selectedJwtAns !== undefined && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong>Explication :</strong> {activeJwt.explanation}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === 'tls' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {TLS_CASES.map((cert) => {
            const verdictChoice = tlsChecked[cert.id];
            const isCorrect = verdictChoice === cert.verdict;
            return (
              <div
                key={cert.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-sky-400">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cert.domainRequested}</span>
                  </div>

                  <dl className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono">
                    <div>
                      <dt className="text-slate-500">Subject CN :</dt>
                      <dd className="text-slate-900 dark:text-slate-100 font-semibold">{cert.subjectCn}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">SAN :</dt>
                      <dd className="text-slate-800 dark:text-slate-200">{cert.sanList.join(', ')}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Émetteur (Issuer) :</dt>
                      <dd className="text-slate-800 dark:text-slate-200">{cert.issuer}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Expire le :</dt>
                      <dd className="text-slate-800 dark:text-slate-200 tabular-nums">{cert.validUntil}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Algorithme :</dt>
                      <dd className="text-slate-800 dark:text-slate-200">{cert.signatureAlg}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleJudgeTls(cert, 'valid')}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold transition-colors ${
                        verdictChoice === 'valid'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      Certificat Valide
                    </button>
                    <button
                      type="button"
                      onClick={() => handleJudgeTls(cert, 'invalid')}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold transition-colors ${
                        verdictChoice === 'invalid'
                          ? 'bg-rose-600 border-rose-600 text-white'
                          : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-rose-400'
                      }`}
                    >
                      Rejeter (Anomalie)
                    </button>
                  </div>

                  {verdictChoice && (
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        {isCorrect ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        {isCorrect ? 'Bon diagnostic !' : 'À revoir :'}
                      </div>
                      <p>{cert.issueSummary}</p>
                      <p className="font-medium pt-1">Remédiation : {cert.fixAction}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
