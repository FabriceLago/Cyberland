import React, { useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Lock,
  RotateCcw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  Terminal,
  XCircle,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island19ServerFirewallGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

type PortAction = 'allow_all' | 'allow_admin' | 'deny';

interface FirewallPortRule {
  port: string;
  service: string;
  desc: string;
  expected: PortAction;
  why: string;
}

const PORT_RULES: FirewallPortRule[] = [
  {
    port: '443 / TCP',
    service: 'HTTPS (Nginx)',
    desc: 'Trafic web chiffré des visiteurs du site public',
    expected: 'allow_all',
    why: 'Le site web public doit rester accessible à tous en HTTPS chiffré (port 443).',
  },
  {
    port: '22 / TCP',
    service: 'SSH (Administration)',
    desc: 'Accès terminal pour administrer le serveur Linux',
    expected: 'allow_admin',
    why: 'SSH ne doit jamais être ouvert au monde entier : restreignez-le à l’IP fixe de l’administrateur ou au VPN.',
  },
  {
    port: '5432 / TCP',
    service: 'PostgreSQL (Base de données)',
    desc: 'Port direct du serveur de base de données interne',
    expected: 'deny',
    why: 'Une base de données ne doit jamais être exposée sur Internet : bloquez 5432 depuis le WAN.',
  },
  {
    port: '23 / TCP',
    service: 'Telnet (Non chiffré)',
    desc: 'Protocole d’administration obsolète transmettant tout en clair',
    expected: 'deny',
    why: 'Telnet transmet les mots de passe en clair : il doit toujours être bloqué et désactivé.',
  },
  {
    port: '80 / TCP',
    service: 'HTTP (Redirection HTTPS)',
    desc: 'Redirection automatique 301 vers HTTPS + renouvellement Let’s Encrypt',
    expected: 'allow_all',
    why: 'Ouvrir 80 uniquement pour rediriger automatiquement les visiteurs vers HTTPS 443 est la bonne pratique standard.',
  },
];

const DMZ_CHOICES = [
  { id: 'fw_ext', label: 'Pare-feu Périmétrique (FW1)' },
  { id: 'web_dmz', label: 'Serveur Web Nginx (Zone DMZ)' },
  { id: 'fw_int', label: 'Pare-feu Interne (FW2)' },
  { id: 'db_lan', label: 'Base de Données (Réseau Privé)' },
];

export const Island19ServerFirewallGame: React.FC<Island19ServerFirewallGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [finishedStars, setFinishedStars] = useState<number | null>(null);

  // Stage 1: Server Creation & Hardening
  const [osChoice, setOsChoice] = useState<'ubuntu_lts' | 'desktop_home' | 'old_os'>('ubuntu_lts');
  const [sshChoice, setSshChoice] = useState<'root_pass' | 'ed25519_nonroot'>('root_pass');
  const [webChoice, setWebChoice] = useState<'direct_3000' | 'nginx_tls'>('direct_3000');

  // Stage 2: Where to place the firewall (DMZ Topology)
  const [slot1, setSlot1] = useState<string>('web_dmz');
  const [slot2, setSlot2] = useState<string>('fw_ext');
  const [slot3, setSlot3] = useState<string>('db_lan');
  const [slot4, setSlot4] = useState<string>('fw_int');

  // Stage 3: UFW Policy & Port Rules
  const [defaultPolicy, setDefaultPolicy] = useState<'allow' | 'deny'>('allow');
  const [rules, setRules] = useState<Record<string, PortAction>>({
    '443 / TCP': 'allow_all',
    '22 / TCP': 'allow_all',
    '5432 / TCP': 'allow_all',
    '23 / TCP': 'allow_all',
    '80 / TCP': 'deny',
  });

  const validateStage1 = () => {
    const errors: string[] = [];
    if (osChoice !== 'ubuntu_lts') {
      errors.push('Choisissez un OS serveur LTS maintenu (Ubuntu Server 24.04 LTS) pour recevoir les correctifs de sécurité.');
    }
    if (sshChoice !== 'ed25519_nonroot') {
      errors.push('Désactivez la connexion root par mot de passe : utilisez un compte sudo dédié + clé SSH Ed25519.');
    }
    if (webChoice !== 'nginx_tls') {
      errors.push('Placez un Reverse Proxy Nginx avec certificat HTTPS TLS devant votre application interne.');
    }

    if (errors.length > 0) {
      playError();
      setMistakes((m) => m + 1);
      setFeedback({ ok: false, text: errors[0] });
      return;
    }

    playSuccess();
    setFeedback({
      ok: true,
      text: 'Serveur créé et durci ! Passons maintenant au placement stratégique du pare-feu et de la DMZ.',
    });
    setStage(2);
  };

  const validateStage2 = () => {
    const ok =
      slot1 === 'fw_ext' &&
      slot2 === 'web_dmz' &&
      slot3 === 'fw_int' &&
      slot4 === 'db_lan';

    if (!ok) {
      playError();
      setMistakes((m) => m + 1);
      setFeedback({
        ok: false,
        text: 'Architecture incorrecte ! Rappel : Internet → Pare-feu Périmétrique (FW1) → Serveur Web en DMZ → Pare-feu Interne (FW2) → Base de Données en Réseau Privé.',
      });
      return;
    }

    playSuccess();
    setFeedback({
      ok: true,
      text: 'Architecture DMZ parfaitement placée ! Dernière étape : configurez les règles UFW du pare-feu.',
    });
    setStage(3);
  };

  const validateStage3 = () => {
    if (defaultPolicy !== 'deny') {
      playError();
      setMistakes((m) => m + 1);
      setFeedback({
        ok: false,
        text: 'Danger : la politique entrante par défaut doit être DENY (Tout bloquer par défaut), puis n’ouvrir que les ports indispensables.',
      });
      return;
    }

    const firstWrong = PORT_RULES.find((r) => rules[r.port] !== r.expected);
    if (firstWrong) {
      playError();
      setMistakes((m) => m + 1);
      setFeedback({
        ok: false,
        text: `Port ${firstWrong.port} (${firstWrong.service}) mal réglé : ${firstWrong.why}`,
      });
      return;
    }

    const earnedStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    setFinishedStars(earnedStars);
    playVictory();
    setFeedback({
      ok: true,
      text: 'Audit sécurité réussi à 100 % ! Votre serveur est prêt pour la production avec une défense en profondeur.',
    });
    onComplete(earnedStars);
  };

  const handleRestart = () => {
    playClick();
    setStage(1);
    setMistakes(0);
    setFeedback(null);
    setFinishedStars(null);
    setOsChoice('ubuntu_lts');
    setSshChoice('root_pass');
    setWebChoice('direct_3000');
    setSlot1('web_dmz');
    setSlot2('fw_ext');
    setSlot3('db_lan');
    setSlot4('fw_int');
    setDefaultPolicy('allow');
    setRules({
      '443 / TCP': 'allow_all',
      '22 / TCP': 'allow_all',
      '5432 / TCP': 'allow_all',
      '23 / TCP': 'allow_all',
      '80 / TCP': 'deny',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
            Atelier pratique guidé · 3 étapes de déploiement
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <Server className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            Déploie, Configure &amp; Blinde ton Serveur
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
          <span className="text-slate-600 dark:text-slate-400">
            Étape <strong className="text-slate-900 dark:text-white">{stage}/3</strong>
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            Erreurs : <strong className="text-rose-600 dark:text-rose-400">{mistakes}</strong>
          </span>
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-sans font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Recommencer
          </button>
        </div>
      </div>

      {/* Stepper Indicator */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { n: 1, title: '1. Créer & Durcir' },
          { n: 2, title: '2. Placer le Pare-feu (DMZ)' },
          { n: 3, title: '3. Règles UFW & Ports' },
        ].map((item) => {
          const done = stage > item.n || finishedStars !== null;
          const active = stage === item.n && finishedStars === null;
          return (
            <div
              key={item.n}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
                done
                  ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                  : active
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200'
                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="truncate">{item.title}</span>
              {done && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-xl border p-3.5 flex items-start gap-2.5 text-sm ${
            feedback.ok
              ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/35 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
          }`}
        >
          {feedback.ok ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <span className="font-medium leading-relaxed">{feedback.text}</span>
        </div>
      )}

      {/* VICTORY CARD */}
      {finishedStars !== null ? (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/30 p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
              Serveur Déployé &amp; Pare-feu Validé !
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Vous savez désormais créer un serveur Linux sécurisé, positionner une DMZ entre deux pare-feux et filtrer strictement chaque port avec UFW.
            </p>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-7 h-7 ${
                  s <= finishedStars
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-300 dark:text-slate-700'
                }`}
              />
            ))}
          </div>
          <div className="text-xs font-mono text-emerald-800 dark:text-emerald-300">
            {isCompleted ? 'Île 19 validée (+340 XP)' : 'Badge « Bâtisseur de Serveurs & Pare-feu » débloqué !'}
          </div>
        </div>
      ) : stage === 1 ? (
        /* STAGE 1: CREATE & CONFIGURE SERVER */
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Choice 1: OS */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 space-y-3">
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-500" />
                1. Système d’exploitation
              </div>
              {[
                { id: 'ubuntu_lts', label: 'Ubuntu Server 24.04 LTS', sub: '5 ans de correctifs sécurité, sans interface lourde' },
                { id: 'desktop_home', label: 'OS Grand Public Bureau', sub: 'Services inutiles ouverts, non optimisé 24/7' },
                { id: 'old_os', label: 'Linux 2016 (Fin de support)', sub: 'Plus aucun patch de sécurité critique' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    playClick();
                    setOsChoice(opt.id as typeof osChoice);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${
                    osChoice === opt.id
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className={osChoice === opt.id ? 'text-sky-100 mt-0.5' : 'text-slate-500 mt-0.5'}>
                    {opt.sub}
                  </div>
                </button>
              ))}
            </div>

            {/* Choice 2: SSH Access */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 space-y-3">
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" />
                2. Accès SSH &amp; Utilisateur
              </div>
              {[
                {
                  id: 'root_pass',
                  label: 'root + mot de passe simple',
                  sub: 'PermitRootLogin yes · cible n°1 des bots',
                },
                {
                  id: 'ed25519_nonroot',
                  label: 'Compte sudo + Clé SSH Ed25519',
                  sub: 'PermitRootLogin no · PasswordAuthentication no',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSshChoice(opt.id as typeof sshChoice);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${
                    sshChoice === opt.id
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className={sshChoice === opt.id ? 'text-sky-100 mt-0.5' : 'text-slate-500 mt-0.5'}>
                    {opt.sub}
                  </div>
                </button>
              ))}
            </div>

            {/* Choice 3: Web Exposure */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 space-y-3">
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-500" />
                3. Exposition Application Web
              </div>
              {[
                {
                  id: 'direct_3000',
                  label: 'Exposer Node/App en HTTP :3000',
                  sub: 'Sans chiffrement TLS ni reverse proxy',
                },
                {
                  id: 'nginx_tls',
                  label: 'Reverse Proxy Nginx + HTTPS TLS',
                  sub: 'Certificat Let’s Encrypt sur :443 → 127.0.0.1:3000',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    playClick();
                    setWebChoice(opt.id as typeof webChoice);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${
                    webChoice === opt.id
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className={webChoice === opt.id ? 'text-sky-100 mt-0.5' : 'text-slate-500 mt-0.5'}>
                    {opt.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={validateStage1}
            className="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm transition-colors"
          >
            Valider la configuration du serveur
          </button>
        </div>
      ) : stage === 2 ? (
        /* STAGE 2: FIREWALL PLACEMENT & DMZ TOPOLOGY */
        <div className="space-y-5">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Placez chaque équipement dans le bon ordre depuis <strong>Internet (à gauche)</strong> jusqu’au <strong>Réseau Privé (à droite)</strong> pour isoler le serveur Web dans une zone démilitarisée (DMZ) et protéger la base de données.
          </p>

          <div className="rounded-xl bg-slate-950 text-white p-4 sm:p-5 space-y-4">
            <div className="text-xs font-mono text-cyan-300 uppercase tracking-wider">
              Internet (WAN non fiable) ──▶ Emplacement 1 ──▶ Emplacement 2 ──▶ Emplacement 3 ──▶ Emplacement 4
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Emplacement 1 (Frontière WAN)', val: slot1, setter: setSlot1 },
                { label: 'Emplacement 2 (Zone exposée)', val: slot2, setter: setSlot2 },
                { label: 'Emplacement 3 (Cloison interne)', val: slot3, setter: setSlot3 },
                { label: 'Emplacement 4 (Zone critique)', val: slot4, setter: setSlot4 },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-2"
                >
                  <label className="block text-[11px] font-mono text-slate-400">{s.label}</label>
                  <select
                    value={s.val}
                    onChange={(e) => {
                      playClick();
                      s.setter(e.target.value);
                    }}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
                  >
                    {DMZ_CHOICES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={validateStage2}
            className="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm transition-colors"
          >
            Vérifier le placement du pare-feu &amp; de la DMZ
          </button>
        </div>
      ) : (
        /* STAGE 3: UFW FIREWALL RULES */
        <div className="space-y-5">
          {/* Default policy */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                Politique entrante par défaut (<code className="font-mono text-xs">ufw default ... incoming</code>)
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Que fait le pare-feu lorsqu’un paquet arrive sur un port non listé ci-dessous ?
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setDefaultPolicy('deny');
                }}
                className={`px-3.5 py-2 text-xs font-bold ${
                  defaultPolicy === 'deny'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                }`}
              >
                DENY (Bloquer tout)
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setDefaultPolicy('allow');
                }}
                className={`px-3.5 py-2 text-xs font-bold ${
                  defaultPolicy === 'allow'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                }`}
              >
                ALLOW (Tout ouvrir)
              </button>
            </div>
          </div>

          {/* Per-port UFW rules */}
          <div className="space-y-2.5">
            {PORT_RULES.map((item) => {
              const current = rules[item.port];
              return (
                <div
                  key={item.port}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400">
                        {item.port}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.service}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {(
                      [
                        { id: 'allow_all', label: 'Autoriser (Public)' },
                        { id: 'allow_admin', label: 'Restreindre IP Admin' },
                        { id: 'deny', label: 'Bloquer (DENY)' },
                      ] as { id: PortAction; label: string }[]
                    ).map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => {
                          playClick();
                          setRules((prev) => ({ ...prev, [item.port]: btn.id }));
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          current === btn.id
                            ? btn.id === 'deny'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : btn.id === 'allow_admin'
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={validateStage3}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            Lancer l’audit Pare-feu &amp; Finaliser le serveur
          </button>
        </div>
      )}
    </div>
  );
};
