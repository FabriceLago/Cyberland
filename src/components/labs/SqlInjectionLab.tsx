import React, { useEffect, useRef, useState } from 'react';
import {
  Database,
  ShieldAlert,
  ShieldCheck,
  Play,
  Square,
  Code2,
  Lock,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import { playClick, playError, playPacket, playSuccess, playVictory } from '../../utils/sound';

interface SqlInjectionLabProps {
  onMasterSqli?: () => void;
  speedrunMode?: boolean;
}

interface SimulatedUser {
  id: number;
  email: string;
  role: string;
  secretNote: string;
}

const SIMULATED_USERS: SimulatedUser[] = [
  { id: 1, email: 'admin@cyberland.fr', role: 'SUPER_ADMIN', secretNote: 'Clé Coffre-Fort #9921' },
  { id: 2, email: 'alice@cyberland.fr', role: 'INGENIEUR_RESEAU', secretNote: 'Accès Pare-feu Nord' },
  { id: 3, email: 'bob@cyberland.fr', role: 'ANALYSTE_SOC', secretNote: 'Token SIEM lecture' },
  { id: 4, email: 'svc-backup@cyberland.fr', role: 'SERVICE_AUTO', secretNote: 'Snapshot Multi-AZ' },
];

interface AttackPreset {
  id: string;
  label: string;
  severity: 'normal' | 'high' | 'critical';
  emailInput: string;
  passwordInput: string;
  summary: string;
  technique: string;
}

const ATTACK_PRESETS: AttackPreset[] = [
  {
    id: 'normal',
    label: '1. Connexion normale',
    severity: 'normal',
    emailInput: 'alice@cyberland.fr',
    passwordInput: 'Cyber2026!',
    summary: 'Requête utilisateur légitime vérifiant un compte connu.',
    technique: 'Authentification standard',
  },
  {
    id: 'auth-bypass',
    label: "2. Bypass Login (' OR '1'='1' --)",
    severity: 'high',
    emailInput: "admin@cyberland.fr' OR '1'='1' --",
    passwordInput: 'nimporte-quoi',
    summary:
      "L'apostrophe ferme la chaîne, OR '1'='1' rend la condition toujours vraie et -- commente la vérification du mot de passe !",
    technique: 'Tautologie SQL + Commentaire (--)',
  },
  {
    id: 'union-dump',
    label: '3. Exfiltration UNION SELECT',
    severity: 'critical',
    emailInput: "' UNION SELECT id, email, role, secretNote FROM users --",
    passwordInput: 'x',
    summary:
      'Fusionne une seconde requête SELECT pour extraire toute la table des comptes et secrets applicatifs.',
    technique: 'UNION-Based SQL Injection',
  },
  {
    id: 'drop-table',
    label: "4. Sabotage ('; DROP TABLE users; --)",
    severity: 'critical',
    emailInput: "'; DROP TABLE users; --",
    passwordInput: 'x',
    summary:
      'Tente de fermer la première instruction avec un point-virgule pour supprimer entièrement la table users.',
    technique: 'Stacked Query Destructive',
  },
];

interface ExecutionOutcome {
  status: 'ok' | 'breached' | 'blocked_prepared' | 'blocked_validation' | 'blocked_privilege' | 'denied';
  headline: string;
  detail: string;
  rows: SimulatedUser[];
  tableDropped: boolean;
  stageReached: 1 | 2 | 3 | 4;
}

interface LogEntry {
  id: number;
  time: string;
  payload: string;
  status: ExecutionOutcome['status'];
  message: string;
}

function isSqliPayload(input: string): 'none' | 'bypass' | 'union' | 'drop' {
  const upper = input.toUpperCase();
  if (upper.includes('DROP TABLE') || upper.includes('DELETE FROM')) return 'drop';
  if (upper.includes('UNION SELECT')) return 'union';
  if (
    upper.includes("' OR '1'='1") ||
    upper.includes("' OR 1=1") ||
    upper.includes("'--") ||
    upper.includes("' --") ||
    upper.includes('OR TRUE')
  ) {
    return 'bypass';
  }
  return 'none';
}

const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const SqlInjectionLab: React.FC<SqlInjectionLabProps> = ({
  onMasterSqli,
  speedrunMode = false,
}) => {
  const [emailInput, setEmailInput] = useState("admin@cyberland.fr' OR '1'='1' --");
  const [passwordInput, setPasswordInput] = useState('inconnu');

  // Interactive defenses
  const [usePreparedStatements, setUsePreparedStatements] = useState(false);
  const [useInputValidation, setUseInputValidation] = useState(false);
  const [useLeastPrivilege, setUseLeastPrivilege] = useState(false);
  const [useGenericErrors, setUseGenericErrors] = useState(false);

  // Live simulation playback state
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoStepIndex, setAutoStepIndex] = useState(0);
  const [animProgress, setAnimProgress] = useState(0);
  const [outcome, setOutcome] = useState<ExecutionOutcome | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [breachObserved, setBreachObserved] = useState(false);
  const [masteredAwarded, setMasteredAwarded] = useState(false);

  const logIdRef = useRef(1);

  const securityScore =
    (usePreparedStatements ? 55 : 0) +
    (useInputValidation ? 20 : 0) +
    (useLeastPrivilege ? 15 : 0) +
    (useGenericErrors ? 10 : 0);

  const evaluateRequest = (
    email: string,
    password: string,
    defenses = {
      prepared: usePreparedStatements,
      validation: useInputValidation,
      privilege: useLeastPrivilege,
      generic: useGenericErrors,
    }
  ): ExecutionOutcome => {
    const kind = isSqliPayload(email);

    // 1. Input validation at API boundary
    if (defenses.validation && !STRICT_EMAIL_REGEX.test(email.trim())) {
      return {
        status: 'blocked_validation',
        headline: 'Bloqué par la validation d’entrée (Allowlist Regex)',
        detail:
          "L'API a rejeté la chaîne avant même d'appeler la base de données : format e-mail invalide (caractères SQL interdits).",
        rows: [],
        tableDropped: false,
        stageReached: 2,
      };
    }

    // 2. Prepared Statements (Parameterized Queries) — Ultimate Defense
    if (defenses.prepared) {
      if (kind !== 'none') {
        return {
          status: 'blocked_prepared',
          headline: 'Injection SQL neutralisée par Requête Préparée ($1, $2)',
          detail:
            "Le moteur SQL a compilé le plan de requête à l'avance. Votre texte malveillant a été traité comme une simple valeur littérale : aucune instruction SQL n'a été exécutée !",
          rows: [],
          tableDropped: false,
          stageReached: 4,
        };
      }
      const user = SIMULATED_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (user && password === 'Cyber2026!') {
        return {
          status: 'ok',
          headline: `Authentification réussie pour ${user.email}`,
          detail: 'Requête paramétrée exécutée proprement. Seul le compte légitime est renvoyé.',
          rows: [user],
          tableDropped: false,
          stageReached: 4,
        };
      }
      return {
        status: 'denied',
        headline: 'Identifiants invalides (0 ligne)',
        detail: defenses.generic
          ? 'Message générique renvoyé au client : aucune fuite technique sur la structure SQL.'
          : "Aucun compte ne correspond exactement à ce couple e-mail / mot de passe.",
        rows: [],
        tableDropped: false,
        stageReached: 4,
      };
    }

    // 3. Vulnerable String Concatenation path
    if (kind === 'drop') {
      if (defenses.privilege) {
        return {
          status: 'blocked_privilege',
          headline: 'DROP TABLE refusé par le Moindre Privilège SQL !',
          detail:
            "La requête reste vulnérable par concaténation, mais le compte SQL de l'application ne possède que SELECT (pas DROP) : la destruction a été bloquée.",
          rows: [],
          tableDropped: false,
          stageReached: 4,
        };
      }
      return {
        status: 'breached',
        headline: 'CRITIQUE : Table `users` supprimée (DROP TABLE) !',
        detail:
          "Sans requête préparée ni moindre privilège, l'instruction empilée a détruit la table en production.",
        rows: [],
        tableDropped: true,
        stageReached: 4,
      };
    }

    if (kind === 'union') {
      return {
        status: 'breached',
        headline: 'FUITE MASSIVE : 4 comptes & secrets exfiltrés via UNION SELECT !',
        detail:
          "La concaténation a permis à l'attaquant de greffer un second SELECT et de siphonner l'intégralité de la table `users`.",
        rows: SIMULATED_USERS,
        tableDropped: false,
        stageReached: 4,
      };
    }

    if (kind === 'bypass') {
      return {
        status: 'breached',
        headline: 'INTRUSION : Connexion Administrateur sans mot de passe !',
        detail:
          "La clause OR '1'='1' est toujours vraie et -- a ignoré la vérification du mot de passe. L'attaquant accède au compte SUPER_ADMIN.",
        rows: [SIMULATED_USERS[0]],
        tableDropped: false,
        stageReached: 4,
      };
    }

    const user = SIMULATED_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (user && password === 'Cyber2026!') {
      return {
        status: 'ok',
        headline: `Connexion normale réussie (${user.email})`,
        detail: 'Utilisateur authentifié, mais attention : le code SQL reste vulnérable aux injections.',
        rows: [user],
        tableDropped: false,
        stageReached: 4,
      };
    }

    return {
      status: 'denied',
      headline: defenses.generic
        ? 'Échec de connexion générique'
        : 'Erreur SQL exposée : 0 ligne trouvée dans cyberland_prod.users',
      detail: defenses.generic
        ? 'Aucune erreur SQL technique exposée au client.'
        : 'Attention : exposer le nom de la table dans les erreurs aide un attaquant à préparer son UNION SELECT.',
      rows: [],
      tableDropped: false,
      stageReached: 4,
    };
  };

  const runSimulation = (email: string, password: string) => {
    playPacket();
    setAnimProgress(0);
    const res = evaluateRequest(email, password);
    setOutcome(res);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setLogs((prev) => [
      {
        id: logIdRef.current++,
        time: timeStr,
        payload: email,
        status: res.status,
        message: res.headline,
      },
      ...prev.slice(0, 6),
    ]);

    if (res.status === 'breached') {
      setBreachObserved(true);
      playError();
    } else if (
      res.status === 'blocked_prepared' ||
      res.status === 'blocked_validation' ||
      res.status === 'blocked_privilege'
    ) {
      playSuccess();
      if (usePreparedStatements && isSqliPayload(email) !== 'none' && !masteredAwarded) {
        setMasteredAwarded(true);
        playVictory();
        onMasterSqli?.();
      }
    }
  };

  // Smooth SVG packet animation when an outcome is triggered
  useEffect(() => {
    if (!outcome) return;
    let frame = 0;
    const id = window.setInterval(() => {
      frame += 1;
      setAnimProgress(Math.min(100, frame * 10));
      if (frame >= 10) {
        window.clearInterval(id);
      }
    }, 55);
    return () => window.clearInterval(id);
  }, [outcome]);

  // Auto-play real-time attack wave across all 4 presets
  useEffect(() => {
    if (!autoRunning) return;
    const preset = ATTACK_PRESETS[autoStepIndex];
    if (!preset) {
      setAutoRunning(false);
      return;
    }
    setEmailInput(preset.emailInput);
    setPasswordInput(preset.passwordInput);
    runSimulation(preset.emailInput, preset.passwordInput);

    const timer = window.setTimeout(() => {
      if (autoStepIndex >= ATTACK_PRESETS.length - 1) {
        setAutoRunning(false);
        setAutoStepIndex(0);
      } else {
        setAutoStepIndex((prev) => prev + 1);
      }
    }, 2900);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunning, autoStepIndex]);

  const handleApplyAllFixes = () => {
    playSuccess();
    setUsePreparedStatements(true);
    setUseInputValidation(true);
    setUseLeastPrivilege(true);
    setUseGenericErrors(true);
    // Re-run current payload immediately to prove remediation live!
    const nextRes = evaluateRequest(emailInput, passwordInput, {
      prepared: true,
      validation: true,
      privilege: true,
      generic: true,
    });
    setOutcome(nextRes);
    setAnimProgress(0);
    if (!masteredAwarded && isSqliPayload(emailInput) !== 'none') {
      setMasteredAwarded(true);
      playVictory();
      onMasterSqli?.();
    }
  };

  const handleResetVulnerable = () => {
    playClick();
    setAutoRunning(false);
    setUsePreparedStatements(false);
    setUseInputValidation(false);
    setUseLeastPrivilege(false);
    setUseGenericErrors(false);
    setOutcome(null);
    setLogs([]);
  };

  const isBreached = outcome?.status === 'breached';
  const isBlocked =
    outcome?.status === 'blocked_prepared' ||
    outcome?.status === 'blocked_validation' ||
    outcome?.status === 'blocked_privilege';

  const packetX =
    outcome?.stageReached === 2
      ? 90 + (animProgress / 100) * 185
      : 90 + (animProgress / 100) * 455;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
            Simulation temps réel · OWASP Top 10 (A03 Injection)
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Attaque par Injection SQL &amp; Remédiation Live
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            Observez comment une concaténation SQL vulnérable laisse un attaquant contourner le
            login ou siphonner la base, puis activez les <strong>Requêtes Préparées</strong> en
            direct pour neutraliser l&apos;attaque.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Protection SQL : </span>
            <strong
              className={`font-mono tabular-nums ${
                securityScore >= 75
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : securityScore >= 55
                  ? 'text-sky-700 dark:text-sky-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {securityScore} %
            </strong>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              if (autoRunning) {
                setAutoRunning(false);
              } else {
                setAutoStepIndex(0);
                setAutoRunning(true);
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              autoRunning
                ? 'bg-red-700 hover:bg-red-800 text-white'
                : 'bg-sky-700 hover:bg-sky-800 text-white'
            }`}
          >
            {autoRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {autoRunning ? 'Arrêter la vague auto' : 'Simuler les 4 attaques en direct'}
          </button>

          <button
            type="button"
            onClick={handleResetVulnerable}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        </div>
      </section>

      {/* Live Animated SVG Pipeline Diagram */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Flux d&apos;exécution en temps réel : Client → API Backend → Moteur SQL
          </span>
          <span
            className={`font-mono font-semibold ${
              isBreached
                ? 'text-red-700 dark:text-red-400'
                : isBlocked
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {isBreached
              ? 'ALERTE : INJECTION EXÉCUTÉE'
              : isBlocked
              ? 'DÉFENSE ACTIVE : ATTAQUE BLOQUÉE'
              : usePreparedStatements
              ? 'MODE SÉCURISÉ (PREPARED STATEMENTS)'
              : 'MODE VULNÉRABLE (CONCATÉNATION)'}
          </span>
        </div>

        <svg
          viewBox="0 0 640 165"
          className="w-full h-auto rounded-lg bg-slate-950"
          role="img"
          aria-label="Schéma animé du flux d'une requête SQL entre navigateur, API et base de données"
        >
          {/* Connection lines */}
          <line x1="138" y1="78" x2="245" y2="78" stroke="#475569" strokeWidth="3" />
          <line x1="395" y1="78" x2="496" y2="78" stroke="#475569" strokeWidth="3" />

          {/* Exfiltration return arc if breached */}
          {isBreached && (
            <>
              <path
                d="M 555 112 Q 320 156 82 112"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
              <text
                x="320"
                y="148"
                textAnchor="middle"
                className="fill-red-400 text-[10px] font-mono font-bold"
              >
                FUITE DE DONNÉES VERS L&apos;ATTAQUANT !
              </text>
            </>
          )}

          {/* Node 1: Client / Attacker */}
          <rect
            x="22"
            y="40"
            width="116"
            height="72"
            rx="10"
            fill="#1E293B"
            stroke={isSqliPayload(emailInput) !== 'none' ? '#F59E0B' : '#38BDF8'}
            strokeWidth="2"
          />
          <text x="80" y="70" textAnchor="middle" className="fill-white text-[11px] font-bold">
            Formulaire Web
          </text>
          <text x="80" y="92" textAnchor="middle" className="fill-slate-300 text-[9px] font-mono">
            {isSqliPayload(emailInput) !== 'none' ? 'Payload SQLi' : 'Login standard'}
          </text>

          {/* Node 2: API Backend & Defenses */}
          <rect
            x="245"
            y="32"
            width="150"
            height="88"
            rx="10"
            fill={usePreparedStatements ? '#064E3B' : '#1E293B'}
            stroke={usePreparedStatements ? '#34D399' : '#EF4444'}
            strokeWidth="2.2"
          />
          <text x="320" y="58" textAnchor="middle" className="fill-white text-[11px] font-bold">
            Serveur API Backend
          </text>
          <text
            x="320"
            y="78"
            textAnchor="middle"
            className={`text-[9.5px] font-mono font-bold ${
              usePreparedStatements ? 'fill-emerald-300' : 'fill-red-300'
            }`}
          >
            {usePreparedStatements ? 'Prepared ($1, $2) ✓' : 'Concaténation (+) !'}
          </text>
          <text x="320" y="98" textAnchor="middle" className="fill-slate-300 text-[9px]">
            {useInputValidation ? 'Regex Allowlist : ON' : 'Validation : OFF'}
          </text>

          {/* Node 3: SQL Database */}
          <rect
            x="496"
            y="36"
            width="124"
            height="80"
            rx="10"
            fill={outcome?.tableDropped ? '#7F1D1D' : '#1E293B'}
            stroke={isBreached ? '#EF4444' : isBlocked ? '#34D399' : '#38BDF8'}
            strokeWidth="2.2"
          />
          <text x="558" y="66" textAnchor="middle" className="fill-white text-[11px] font-bold">
            Base SQL (users)
          </text>
          <text
            x="558"
            y="88"
            textAnchor="middle"
            className={`text-[9.5px] font-mono ${
              outcome?.tableDropped
                ? 'fill-red-300 font-bold'
                : useLeastPrivilege
                ? 'fill-emerald-300'
                : 'fill-amber-300'
            }`}
          >
            {outcome?.tableDropped
              ? 'TABLE SUPPRIMÉE !'
              : useLeastPrivilege
              ? 'Droits : SELECT seul'
              : 'Droits : ROOT / ALL'}
          </text>

          {/* Animated Travelling Query Packet */}
          {outcome && (
            <g transform={`translate(${packetX}, 78)`}>
              <circle
                r="8"
                fill={isBreached ? '#EF4444' : isBlocked ? '#10B981' : '#38BDF8'}
              />
              <circle
                r="13"
                fill="none"
                stroke={isBreached ? '#FCA5A5' : isBlocked ? '#6EE7B7' : '#7DD3FC'}
                strokeWidth="1.5"
                opacity="0.7"
              />
            </g>
          )}
        </svg>
      </section>

      {/* Main Split: Left Attack Console & Live SQL, Right Remediation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Attack Simulator + Live SQL Query + DB Result */}
        <div className="lg:col-span-7 space-y-5">
          {/* Interactive Login Form & Attack Presets */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  1. Tester une attaque sur le formulaire de connexion
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                POST /api/login
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2">
              {ATTACK_PRESETS.map((preset) => {
                const selected = emailInput === preset.emailInput;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setAutoRunning(false);
                      setEmailInput(preset.emailInput);
                      setPasswordInput(preset.passwordInput);
                      runSimulation(preset.emailInput, preset.passwordInput);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      selected
                        ? preset.severity === 'normal'
                          ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-900 dark:text-sky-200'
                          : 'bg-red-50 dark:bg-red-950/50 border-red-500 text-red-900 dark:text-red-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Form Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="sqli-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Champ E-mail / Identifiant (vecteur d&apos;injection)
                </label>
                <input
                  id="sqli-email"
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="sqli-pwd"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Mot de passe saisi
                </label>
                <input
                  id="sqli-pwd"
                  type="text"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAutoRunning(false);
                runSimulation(emailInput, passwordInput);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 dark:bg-sky-700 hover:bg-slate-800 dark:hover:bg-sky-800 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Envoyer la requête vers le serveur SQL
            </button>
          </section>

          {/* Live Constructed SQL Query Inspector */}
          <section className="bg-slate-950 text-slate-100 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-sky-300">
                <Database className="w-4 h-4" />
                Requête SQL interprétée en direct par la base
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  usePreparedStatements ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {usePreparedStatements ? 'Paramétrée (Sûre)' : 'Concaténée (Dangereuse)'}
              </span>
            </div>

            {!usePreparedStatements ? (
              <div className="p-3.5 rounded-lg bg-slate-900 border border-red-900/60 font-mono text-xs leading-relaxed break-all">
                <span className="text-sky-300">SELECT</span> id, email, role, secretNote{' '}
                <span className="text-sky-300">FROM</span> users{' '}
                <span className="text-sky-300">WHERE</span> email = &apos;
                <span className="bg-red-500/25 text-red-300 px-1 rounded font-bold">
                  {emailInput}
                </span>
                &apos; <span className="text-sky-300">AND</span> password = &apos;
                <span className="text-amber-300">{passwordInput}</span>&apos;;
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3.5 rounded-lg bg-slate-900 border border-emerald-800/70 font-mono text-xs leading-relaxed">
                  <span className="text-sky-300">SELECT</span> id, email, role, secretNote{' '}
                  <span className="text-sky-300">FROM</span> users{' '}
                  <span className="text-sky-300">WHERE</span> email ={' '}
                  <span className="bg-emerald-500/25 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    $1
                  </span>{' '}
                  <span className="text-sky-300">AND</span> password_hash ={' '}
                  <span className="bg-emerald-500/25 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    $2
                  </span>
                  ;
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-[11px] text-emerald-300 break-all">
                  Paramètres liés (jamais exécutés comme SQL) : $1 = {JSON.stringify(emailInput)} ·
                  $2 = &quot;argon2_hash(...)&quot;
                </div>
              </div>
            )}

            {/* Outcome & Simulated Database Output */}
            {outcome && (
              <div
                className={`p-4 rounded-lg border text-xs space-y-2.5 ${
                  isBreached
                    ? 'bg-red-950/60 border-red-500/70 text-red-100'
                    : isBlocked
                    ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-100'
                    : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {isBreached ? (
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  ) : isBlocked ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold text-sm">{outcome.headline}</p>
                    <p className="opacity-90 leading-relaxed">{outcome.detail}</p>
                  </div>
                </div>

                {outcome.rows.length > 0 && (
                  <div className="overflow-x-auto rounded-md border border-slate-700 bg-slate-950/80">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-1.5 px-2.5">id</th>
                          <th className="py-1.5 px-2.5">email</th>
                          <th className="py-1.5 px-2.5">role</th>
                          <th className="py-1.5 px-2.5">secretNote</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        {outcome.rows.map((row) => (
                          <tr key={row.id}>
                            <td className="py-1.5 px-2.5 tabular-nums">{row.id}</td>
                            <td className="py-1.5 px-2.5">{row.email}</td>
                            <td className="py-1.5 px-2.5 text-amber-300">{row.role}</td>
                            <td className="py-1.5 px-2.5 text-red-300">{row.secretNote}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Live Security Journal */}
          {logs.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Journal des tentatives en direct ({logs.length})
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {logs.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-[11px] font-mono"
                  >
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      [{entry.time}]
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 truncate max-w-[210px]">
                      {entry.payload}
                    </span>
                    <span
                      className={`font-semibold ${
                        entry.status === 'breached'
                          ? 'text-red-700 dark:text-red-400'
                          : entry.status === 'blocked_prepared' ||
                            entry.status === 'blocked_validation' ||
                            entry.status === 'blocked_privilege'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-sky-700 dark:text-sky-400'
                      }`}
                    >
                      {entry.status === 'breached'
                        ? 'INTRUSION'
                        : entry.status === 'ok'
                        ? 'OK'
                        : entry.status === 'denied'
                        ? 'REFUSÉ'
                        : 'BLOQUÉ ✓'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right 5 cols: Interactive Remediation Panel ("Comment Résoudre") */}
        <div className="lg:col-span-5 space-y-5">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>2. Comment résoudre la faille en direct</span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  Panneau de Remédiation SQL
                </h3>
              </div>
              {!speedrunMode && (
                <button
                  type="button"
                  onClick={handleApplyAllFixes}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shrink-0"
                >
                  Tout sécuriser
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {[
                {
                  id: 'prepared',
                  active: usePreparedStatements,
                  toggle: () => setUsePreparedStatements((v) => !v),
                  title: '1. Requêtes Préparées (Prepared Statements)',
                  weight: '+55 % · Défense principale',
                  desc: "Sépare totalement le code SQL ($1, $2) des données utilisateur. Même un payload ' OR 1=1 devient inoffensif.",
                },
                {
                  id: 'validation',
                  active: useInputValidation,
                  toggle: () => setUseInputValidation((v) => !v),
                  title: '2. Validation stricte (Allowlist Regex)',
                  weight: '+20 % · Défense en profondeur',
                  desc: "Rejette toute chaîne qui ne respecte pas le format d'e-mail attendu avant d'interroger la base.",
                },
                {
                  id: 'privilege',
                  active: useLeastPrivilege,
                  toggle: () => setUseLeastPrivilege((v) => !v),
                  title: '3. Moindre Privilège SQL (GRANT SELECT)',
                  weight: '+15 % · Limite l’impact',
                  desc: "Le compte applicatif ne doit jamais avoir les droits DROP, ALTER ou SUPERUSER en production.",
                },
                {
                  id: 'generic',
                  active: useGenericErrors,
                  toggle: () => setUseGenericErrors((v) => !v),
                  title: '4. Erreurs génériques & Hachage Argon2',
                  weight: '+10 % · Anti-reconnaissance',
                  desc: "Masque les messages SQL internes et stocke uniquement des empreintes salées irréversibles.",
                },
              ].map((fix) => (
                <button
                  key={fix.id}
                  type="button"
                  onClick={() => {
                    playClick();
                    fix.toggle();
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors space-y-1 ${
                    fix.active
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold">
                      {fix.active ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      {fix.title}
                    </span>
                    <span className="font-mono text-[10px] font-semibold text-sky-700 dark:text-sky-400 shrink-0">
                      {fix.active ? 'ACTIF' : fix.weight}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed pl-5">
                    {fix.desc}
                  </p>
                </button>
              ))}
            </div>

            {masteredAwarded && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-400 dark:border-emerald-700 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold">Injection SQL maîtrisée &amp; neutralisée (+80 XP) !</p>
                  <p className="text-[11px]">
                    {breachObserved
                      ? 'Vous avez constaté la faille en direct puis appliqué la bonne correction.'
                      : 'Vos requêtes paramétrées bloquent désormais toutes les tentatives SQLi.'}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Code Diff: Vulnerable vs Remediated */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-700 dark:text-sky-400" />
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                Code Backend : Avant (Vulnérable) vs Après (Sécurisé)
              </h3>
            </div>

            <div className="space-y-2.5 font-mono text-[11px]">
              <div className="p-3 rounded-lg bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900 space-y-1">
                <p className="font-sans font-bold text-red-800 dark:text-red-300">
                  ✕ À NE JAMAIS FAIRE (Concaténation directe)
                </p>
                <pre className="text-red-950 dark:text-red-200 whitespace-pre-wrap leading-relaxed">
{`const sql = "SELECT * FROM users WHERE email = '" + email + "'";
db.query(sql);`}
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-1">
                <p className="font-sans font-bold text-emerald-800 dark:text-emerald-300">
                  ✓ BONNE PRATIQUE (Requête Préparée / Paramétrée)
                </p>
                <pre className="text-emerald-950 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed">
{`const sql = "SELECT id, email, role FROM users WHERE email = $1";
db.query(sql, [email]); // Donnée isolée, jamais interprétée`}
                </pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
