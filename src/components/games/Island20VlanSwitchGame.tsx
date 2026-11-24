import React, { useState } from 'react';
import {
  CheckCircle2,
  Network,
  RotateCcw,
  ShieldCheck,
  Star,
  Wifi,
  AlertTriangle,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island20VlanSwitchGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

type PortId = 'fa01' | 'fa02' | 'fa03' | 'fa04' | 'gi01';
type PortConfig = '' | 'vlan10-access' | 'vlan20-access' | 'vlan30-access' | 'vlan99-access' | 'trunk-8021q';

interface SwitchPortSpec {
  id: PortId;
  name: string;
  device: string;
  expected: PortConfig;
  hint: string;
}

const SWITCH_PORTS: SwitchPortSpec[] = [
  {
    id: 'fa01',
    name: 'Fa0/1',
    device: 'Poste Direction (PC-DIR)',
    expected: 'vlan10-access',
    hint: 'Port d’accès dédié au VLAN 10 (Direction).',
  },
  {
    id: 'fa02',
    name: 'Fa0/2',
    device: 'Poste Employés (PC-EMP)',
    expected: 'vlan20-access',
    hint: 'Port d’accès dédié au VLAN 20 (Employés).',
  },
  {
    id: 'fa03',
    name: 'Fa0/3',
    device: 'Borne Wi-Fi Visiteurs (AP-GUEST)',
    expected: 'vlan30-access',
    hint: 'Isoler les visiteurs dans le VLAN 30 (Invités).',
  },
  {
    id: 'fa04',
    name: 'Fa0/4',
    device: 'Serveur Fichiers & ERP (SRV-ERP)',
    expected: 'vlan99-access',
    hint: 'Segment serveur critique dans le VLAN 99 (Serveurs).',
  },
  {
    id: 'gi01',
    name: 'Gi0/1',
    device: 'Lien Uplink vers Routeur Inter-VLAN (RTR-CORE)',
    expected: 'trunk-8021q',
    hint: 'Un lien vers un routeur portant plusieurs VLAN doit être configuré en Trunk 802.1Q.',
  },
];

const PORT_OPTIONS: { value: PortConfig; label: string }[] = [
  { value: '', label: '— Choisir la configuration du port —' },
  { value: 'vlan10-access', label: 'Access · VLAN 10 (Direction)' },
  { value: 'vlan20-access', label: 'Access · VLAN 20 (Employés)' },
  { value: 'vlan30-access', label: 'Access · VLAN 30 (Invités)' },
  { value: 'vlan99-access', label: 'Access · VLAN 99 (Serveurs)' },
  { value: 'trunk-8021q', label: 'Trunk 802.1Q (Allowed: 10,20,30,99)' },
];

type WifiSecurityChoice = 'open' | 'wep' | 'wpa2-psk' | 'wpa3-enterprise';
type GuestWifiChoice = 'same-lan' | 'vlan30-isolated';

interface AclRuleSpec {
  id: string;
  flow: string;
  src: string;
  dst: string;
  expected: 'permit' | 'deny';
  rationale: string;
}

const ACL_RULES: AclRuleSpec[] = [
  {
    id: 'acl-guest-srv',
    flow: 'Wi-Fi Invités → Serveurs ERP',
    src: 'VLAN 30 (10.30.0.0/24)',
    dst: 'VLAN 99 (10.99.0.0/24)',
    expected: 'deny',
    rationale: 'Les invités ne doivent jamais pouvoir atteindre le segment des serveurs internes.',
  },
  {
    id: 'acl-guest-wan',
    flow: 'Wi-Fi Invités → Internet HTTPS (443)',
    src: 'VLAN 30 (10.30.0.0/24)',
    dst: 'WAN Internet (0.0.0.0/0)',
    expected: 'permit',
    rationale: 'Les visiteurs doivent uniquement accéder à Internet en sortie.',
  },
  {
    id: 'acl-emp-srv',
    flow: 'Postes Employés → Serveur ERP (443)',
    src: 'VLAN 20 (10.20.0.0/24)',
    dst: 'VLAN 99 (10.99.0.10:443)',
    expected: 'permit',
    rationale: 'Les employés ont besoin du port applicatif HTTPS de l’ERP interne.',
  },
  {
    id: 'acl-emp-dir',
    flow: 'Postes Employés → Partages Direction (445)',
    src: 'VLAN 20 (10.20.0.0/24)',
    dst: 'VLAN 10 (10.10.0.0/24)',
    expected: 'deny',
    rationale: 'Le cloisonnement inter-VLAN empêche tout accès latéral non autorisé vers la Direction.',
  },
];

export const Island20VlanSwitchGame: React.FC<Island20VlanSwitchGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  // Phase 1: Switch port assignment
  const [ports, setPorts] = useState<Record<PortId, PortConfig>>({
    fa01: '',
    fa02: '',
    fa03: '',
    fa04: '',
    gi01: '',
  });

  // Phase 2: Enterprise Wi-Fi security
  const [staffWifi, setStaffWifi] = useState<WifiSecurityChoice>('wpa2-psk');
  const [guestWifi, setGuestWifi] = useState<GuestWifiChoice>('same-lan');

  // Phase 3: Inter-VLAN ACL rules
  const [acls, setAcls] = useState<Record<string, 'permit' | 'deny'>>({
    'acl-guest-srv': 'permit',
    'acl-guest-wan': 'permit',
    'acl-emp-srv': 'deny',
    'acl-emp-dir': 'permit',
  });

  const handleValidatePhase1 = () => {
    const wrong = SWITCH_PORTS.filter((p) => ports[p.id] !== p.expected);
    if (wrong.length > 0) {
      playError();
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'error',
        text: `Port ${wrong[0].name} (${wrong[0].device}) mal configuré. Indice : ${wrong[0].hint}`,
      });
      return;
    }
    playSuccess();
    setFeedback({
      kind: 'ok',
      text: 'Switch configuré ! Les 4 domaines de diffusion sont isolés et le lien Trunk 802.1Q transporte les trames étiquetées vers le routeur.',
    });
    setPhase(2);
  };

  const handleValidatePhase2 = () => {
    if (staffWifi !== 'wpa3-enterprise') {
      playError();
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'error',
        text: 'Pour un réseau d’entreprise, évitez un mot de passe partagé (PSK) ou WEP : déployez WPA3-Enterprise avec authentification individuelle 802.1X / RADIUS.',
      });
      return;
    }
    if (guestWifi !== 'vlan30-isolated') {
      playError();
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'error',
        text: 'Ne placez jamais le SSID Invités sur le même LAN que les employés : isolez-le dans le VLAN 30 avec Client Isolation.',
      });
      return;
    }
    playSuccess();
    setFeedback({
      kind: 'ok',
      text: 'Wi-Fi Entreprise sécurisé ! Chaque salarié possède ses propres identifiants 802.1X/RADIUS et les visiteurs sont cloisonnés dans le VLAN 30.',
    });
    setPhase(3);
  };

  const handleValidatePhase3 = () => {
    const wrong = ACL_RULES.filter((r) => acls[r.id] !== r.expected);
    if (wrong.length > 0) {
      playError();
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'error',
        text: `Règle « ${wrong[0].flow} » incorrecte : ${wrong[0].rationale}`,
      });
      return;
    }
    playVictory();
    const earnedStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    setFeedback({
      kind: 'ok',
      text: 'Architecture Switching + VLAN 802.1Q + Wi-Fi WPA3-Enterprise + ACL Inter-VLAN validée avec succès !',
    });
    setPhase(4);
    onComplete(earnedStars);
  };

  const handleReset = () => {
    playClick();
    setPhase(1);
    setMistakes(0);
    setFeedback(null);
    setPorts({ fa01: '', fa02: '', fa03: '', fa04: '', gi01: '' });
    setStaffWifi('wpa2-psk');
    setGuestWifi('same-lan');
    setAcls({
      'acl-guest-srv': 'permit',
      'acl-guest-wan': 'permit',
      'acl-emp-srv': 'deny',
      'acl-emp-dir': 'permit',
    });
  };

  const starsEarned = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-400">
            <Network className="w-4 h-4" />
            <span>Mission Pratique · Île 20 · Switch L2, VLAN 802.1Q &amp; Wi-Fi WPA3</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Segmente le Campus Cyberland
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums">
            Étape {Math.min(phase, 3)} / 3 · Erreurs : {mistakes}
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
        {[
          { step: 1, label: '1. Ports Switch & Trunk 802.1Q' },
          { step: 2, label: '2. Wi-Fi WPA3-Enterprise' },
          { step: 3, label: '3. Filtrage ACL Inter-VLAN' },
        ].map((item) => {
          const done = phase > item.step;
          const active = phase === item.step;
          return (
            <div
              key={item.step}
              className={`px-3 py-2.5 rounded-xl border flex items-center gap-2 ${
                done
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : active
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-700 text-sky-900 dark:text-sky-200'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-500'
              }`}
            >
              {done && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />}
              <span className="truncate">{item.label}</span>
            </div>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
            feedback.kind === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          {feedback.kind === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* PHASE 1 */}
      {phase === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Assignez chaque port du switch managé <strong>SW-CAMPUS-01</strong> au bon mode (<strong>Access</strong> avec son VLAN dédié ou <strong>Trunk 802.1Q</strong> vers le routeur cœur).
          </p>

          <div className="space-y-3">
            {SWITCH_PORTS.map((port) => (
              <div
                key={port.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400">
                    Interface {port.name}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {port.device}
                  </div>
                </div>
                <select
                  value={ports[port.id]}
                  onChange={(e) => {
                    playClick();
                    setPorts((prev) => ({ ...prev, [port.id]: e.target.value as PortConfig }));
                  }}
                  aria-label={`Configuration de l'interface ${port.name}`}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {PORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleValidatePhase1}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold transition-colors"
          >
            Appliquer la configuration Switch
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PHASE 2 */}
      {phase === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Wifi className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                SSID Corporate « Cyberland-Staff »
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Choisissez le protocole de sécurité recommandé pour 150 collaborateurs avec révocation individuelle lors d’un départ.
              </p>
              <div className="space-y-2">
                {(
                  [
                    { id: 'open', label: 'Wi-Fi Ouvert (aucun chiffrement)' },
                    { id: 'wep', label: 'WEP 64 bits (hérité)' },
                    { id: 'wpa2-psk', label: 'WPA2-Personal (mot de passe unique partagé)' },
                    { id: 'wpa3-enterprise', label: 'WPA3-Enterprise (802.1X + serveur RADIUS)' },
                  ] as { id: WifiSecurityChoice; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setStaffWifi(opt.id);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                      staffWifi === opt.id
                        ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-900 dark:text-sky-200 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                SSID Visiteurs « Cyberland-Guest »
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Comment raccorder le Wi-Fi visiteurs sur la borne multi-SSID ?
              </p>
              <div className="space-y-2">
                {(
                  [
                    {
                      id: 'same-lan',
                      label: 'Même VLAN 20 que les employés pour simplifier le DHCP',
                    },
                    {
                      id: 'vlan30-isolated',
                      label: 'VLAN 30 dédié + Portail Captif + Client Isolation (L2)',
                    },
                  ] as { id: GuestWifiChoice; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setGuestWifi(opt.id);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                      guestWifi === opt.id
                        ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-900 dark:text-sky-200 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleValidatePhase2}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold transition-colors"
          >
            Valider la politique Wi-Fi
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PHASE 3 */}
      {phase === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Configurez la liste de contrôle d’accès (<strong>ACL Inter-VLAN</strong>) sur le routeur <strong>RTR-CORE</strong> afin de respecter le principe du moindre privilège.
          </p>

          <div className="space-y-3">
            {ACL_RULES.map((rule) => {
              const decision = acls[rule.id];
              return (
                <div
                  key={rule.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{rule.flow}</div>
                    <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {rule.src} → {rule.dst}
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setAcls((prev) => ({ ...prev, [rule.id]: 'permit' }));
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                        decision === 'permit'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      PERMIT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setAcls((prev) => ({ ...prev, [rule.id]: 'deny' }));
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                        decision === 'deny'
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      DENY
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleValidatePhase3}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Déployer les ACL et terminer la mission
          </button>
        </div>
      )}

      {/* PHASE 4: SUCCESS */}
      {phase === 4 && (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                MISSION ACCOMPLIE · BADGE « ARCHITECTE VLAN &amp; WI-FI »
              </p>
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
                Campus Cyberland entièrement cloisonné !
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`w-6 h-6 ${
                    s <= starsEarned
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300">
            Vous maîtrisez désormais la segmentation 802.1Q (ports Access vs Trunk), le chiffrement Wi-Fi WPA3-Enterprise avec RADIUS et les ACL de cloisonnement inter-VLAN.
            {isCompleted ? ' Île 20 validée dans votre progression.' : ''}
          </p>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Rejouer la mission
          </button>
        </div>
      )}
    </div>
  );
};
