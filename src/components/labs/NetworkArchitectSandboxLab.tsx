import React, { useEffect, useState } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Router,
  Server,
  Laptop,
  Lock,
  Network,
} from 'lucide-react';
import { playClick, playError, playPacket, playSuccess } from '../../utils/sound';

type FlowType = 'https' | 'telnet' | 'rdp' | 'ama';

interface SandboxConfig {
  switchEnabled: boolean;
  vlanIsolated: boolean;
  natEnabled: boolean;
  vpnEnabled: boolean;
  firewallEnabled: boolean;
  allowPort443: boolean;
  blockPort23: boolean;
  blockPublicRdp: boolean;
  amaAgentEnabled: boolean;
}

const PRESETS: { id: string; label: string; config: SandboxConfig }[] = [
  {
    id: 'secure',
    label: 'Entreprise Sécurisée (Recommandé)',
    config: {
      switchEnabled: true,
      vlanIsolated: false,
      natEnabled: true,
      vpnEnabled: true,
      firewallEnabled: true,
      allowPort443: true,
      blockPort23: true,
      blockPublicRdp: true,
      amaAgentEnabled: true,
    },
  },
  {
    id: 'vulnerable',
    label: 'Architecture Vulnérable (Audit)',
    config: {
      switchEnabled: true,
      vlanIsolated: false,
      natEnabled: true,
      vpnEnabled: false,
      firewallEnabled: false,
      allowPort443: true,
      blockPort23: false,
      blockPublicRdp: false,
      amaAgentEnabled: false,
    },
  },
  {
    id: 'broken-nat',
    label: 'Panne Routage / NAT coupé',
    config: {
      switchEnabled: true,
      vlanIsolated: false,
      natEnabled: false,
      vpnEnabled: false,
      firewallEnabled: true,
      allowPort443: true,
      blockPort23: true,
      blockPublicRdp: true,
      amaAgentEnabled: true,
    },
  },
];

const FLOWS: { id: FlowType; label: string; port: string; summary: string }[] = [
  {
    id: 'https',
    label: 'Navigation HTTPS (TCP 443)',
    port: '443',
    summary: 'Poste LAN → Switch → Routeur NAT → Pare-feu → Serveur Web HTTPS',
  },
  {
    id: 'telnet',
    label: 'Connexion Telnet en clair (TCP 23)',
    port: '23',
    summary: 'Doit être bloquée par un pare-feu sain (protocole obsolète en clair)',
  },
  {
    id: 'rdp',
    label: 'Admin Windows RDP (TCP 3389)',
    port: '3389',
    summary: 'Sécurisé uniquement si encapsulé dans le Tunnel VPN WireGuard !',
  },
  {
    id: 'ama',
    label: 'Télémétrie Azure Monitor (AMA)',
    port: '443 TLS',
    summary: 'Envoi des Event Logs Windows vers le Cloud via Agent AMA + NAT + 443',
  },
];

interface SimOutcome {
  passed: boolean;
  stopNodeIndex: number; // 0..5
  verdictTitle: string;
  verdictDetail: string;
  securityNote: string;
}

function evaluateArchitecture(cfg: SandboxConfig, flow: FlowType): SimOutcome {
  // Nodes: 0 Client, 1 Switch, 2 Routeur NAT, 3 Tunnel VPN, 4 Pare-feu, 5 Serveur cible
  if (!cfg.switchEnabled) {
    return {
      passed: false,
      stopNodeIndex: 1,
      verdictTitle: 'Paquet arrêté au Switch LAN (Couche 2)',
      verdictDetail: 'Le Switch local est hors tension : aucune trame Ethernet ne quitte le LAN.',
      securityNote: 'Activez le Switch LAN pour rétablir la connectivité locale.',
    };
  }
  if (cfg.vlanIsolated && flow !== 'https') {
    return {
      passed: false,
      stopNodeIndex: 1,
      verdictTitle: 'Bloqué par l’isolation VLAN stricte',
      verdictDetail: 'Le VLAN invité bloque les flux d’administration et de télémétrie interne.',
      securityNote: 'Bonne isolation pour un réseau invité, à assouplir pour les postes admin.',
    };
  }
  if (!cfg.natEnabled) {
    return {
      passed: false,
      stopNodeIndex: 2,
      verdictTitle: 'Paquet perdu au Routeur NAT (Couche 3)',
      verdictDetail:
        'Sans traduction NAT/PAT, l’adresse privée 192.168.1.24 n’est pas routable vers le WAN/Cloud.',
      securityNote: 'Activez le Routeur NAT/PAT pour traduire les IP privées vers l’IP publique.',
    };
  }

  if (flow === 'telnet') {
    if (cfg.firewallEnabled && cfg.blockPort23) {
      return {
        passed: false,
        stopNodeIndex: 4,
        verdictTitle: 'Telnet (port 23) bloqué par le Pare-feu — Sécurité validée !',
        verdictDetail:
          'Excellente posture : le pare-feu rejette le trafic Telnet en clair avant qu’il n’atteigne le serveur.',
        securityNote: 'Utilisez SSH (22) ou HTTPS (443) à la place de Telnet.',
      };
    }
    return {
      passed: true,
      stopNodeIndex: 5,
      verdictTitle: 'Attention : Telnet (port 23) est passé en clair !',
      verdictDetail:
        'Le paquet a atteint le serveur sans chiffrement : un pirate sur le réseau lit les mots de passe.',
      securityNote: 'Activez le Pare-feu + règle « Bloquer port 23 (Telnet) » immédiatement.',
    };
  }

  if (flow === 'rdp') {
    if (cfg.vpnEnabled) {
      return {
        passed: true,
        stopNodeIndex: 5,
        verdictTitle: 'Session RDP livrée en sécurité dans le Tunnel VPN !',
        verdictDetail:
          'Le trafic RDP 3389 est encapsulé et chiffré dans WireGuard sans exposer le port 3389 sur Internet.',
        securityNote: 'Architecture conforme Zero Trust : zéro exposition publique du RDP.',
      };
    }
    if (cfg.firewallEnabled && cfg.blockPublicRdp) {
      return {
        passed: false,
        stopNodeIndex: 4,
        verdictTitle: 'RDP public (3389) bloqué par le Pare-feu',
        verdictDetail:
          'Sans tunnel VPN actif, le pare-feu bloque à juste titre l’accès RDP direct depuis l’extérieur.',
        securityNote: 'Activez le Tunnel VPN WireGuard pour autoriser l’administration Windows.',
      };
    }
    return {
      passed: true,
      stopNodeIndex: 5,
      verdictTitle: 'Danger critique : RDP 3389 exposé directement sur Internet !',
      verdictDetail:
        'Sans VPN ni blocage pare-feu, votre serveur Windows va subir des attaques brute-force (EventID 4625).',
      securityNote: 'Activez le Pare-feu (bloquer 3389 public) + Tunnel VPN WireGuard.',
    };
  }

  if (flow === 'ama') {
    if (!cfg.amaAgentEnabled) {
      return {
        passed: false,
        stopNodeIndex: 5,
        verdictTitle: 'Aucun log reçu — Agent Azure Monitor (AMA) désactivé',
        verdictDetail:
          'Le réseau est ouvert mais l’agent AMA n’est pas installé sur le serveur Windows.',
        securityNote: 'Activez l’Agent AMA + DCR pour collecter Event Logs et métriques CPU.',
      };
    }
    if (cfg.firewallEnabled && !cfg.allowPort443) {
      return {
        passed: false,
        stopNodeIndex: 4,
        verdictTitle: 'Flux AMA bloqué au Pare-feu (Port 443 fermé)',
        verdictDetail:
          'L’agent AMA envoie sa télémétrie en HTTPS (TCP 443) : le pare-feu doit autoriser 443.',
        securityNote: 'Autorisez le port 443 sortant dans la politique pare-feu.',
      };
    }
    return {
      passed: true,
      stopNodeIndex: 5,
      verdictTitle: 'Télémétrie Windows reçue dans Azure Monitor (TLS 1.3) !',
      verdictDetail:
        'Les Event Logs Security et compteurs PerfMon transitent en HTTPS via NAT et Pare-feu vers Log Analytics.',
      securityNote: 'Supervision hybride 100 % opérationnelle.',
    };
  }

  // HTTPS flow
  if (cfg.firewallEnabled && !cfg.allowPort443) {
    return {
      passed: false,
      stopNodeIndex: 4,
      verdictTitle: 'Trafic HTTPS bloqué au Pare-feu (Port 443 fermé)',
      verdictDetail: 'La règle autorisant TCP 443 est désactivée : le site web est inaccessible.',
      securityNote: 'Ouvrez le port 443 pour permettre les connexions HTTPS sécurisées.',
    };
  }
  return {
    passed: true,
    stopNodeIndex: 5,
    verdictTitle: 'Requête HTTPS (443) livrée de bout en bout !',
    verdictDetail:
      'Le paquet traverse Switch (L2), Routeur NAT (L3), Pare-feu (L4) et atteint le serveur Web chiffré en TLS.',
    securityNote: cfg.firewallEnabled
      ? 'Architecture saine et protégée.'
      : 'Le trafic passe, mais pensez à activer le Pare-feu pour filtrer les menaces.',
  };
}

export const NetworkArchitectSandboxLab: React.FC = () => {
  const [config, setConfig] = useState<SandboxConfig>(PRESETS[0].config);
  const [flow, setFlow] = useState<FlowType>('https');
  const [simStep, setSimStep] = useState<number>(-1);
  const [simulating, setSimulating] = useState(false);
  const [outcome, setOutcome] = useState<SimOutcome | null>(null);

  const nodes = [
    { id: 'client', x: 30, label: 'Poste Client', sub: '192.168.1.24', active: true },
    {
      id: 'switch',
      x: 148,
      label: 'Switch LAN',
      sub: config.vlanIsolated ? 'VLAN isolé' : 'L2 · MAC',
      active: config.switchEnabled,
    },
    {
      id: 'nat',
      x: 266,
      label: 'Routeur NAT',
      sub: config.natEnabled ? 'PAT actif' : 'Hors service',
      active: config.natEnabled,
    },
    {
      id: 'vpn',
      x: 384,
      label: 'Tunnel VPN',
      sub: config.vpnEnabled ? 'WireGuard 51820' : 'Contourné',
      active: config.vpnEnabled,
    },
    {
      id: 'fw',
      x: 502,
      label: 'Pare-feu',
      sub: config.firewallEnabled ? 'Stateful ON' : 'Désactivé',
      active: config.firewallEnabled,
    },
    {
      id: 'server',
      x: 620,
      label: flow === 'ama' ? 'Azure Monitor' : 'Serveur Cible',
      sub: flow === 'ama' ? (config.amaAgentEnabled ? 'AMA actif' : 'Sans AMA') : '10.0.2.50',
      active: flow === 'ama' ? config.amaAgentEnabled : true,
    },
  ];

  useEffect(() => {
    if (!simulating || !outcome) return;
    if (simStep >= outcome.stopNodeIndex) {
      setSimulating(false);
      if (outcome.passed && !(flow === 'telnet' || (flow === 'rdp' && !config.vpnEnabled))) {
        playSuccess();
      } else if (flow === 'telnet' && !outcome.passed) {
        playSuccess();
      } else {
        playError();
      }
      return;
    }
    const timer = window.setTimeout(() => {
      playPacket();
      setSimStep((s) => s + 1);
    }, 360);
    return () => window.clearTimeout(timer);
  }, [simulating, simStep, outcome, flow, config.vpnEnabled]);

  const handleRunSimulation = () => {
    playClick();
    const result = evaluateArchitecture(config, flow);
    setOutcome(result);
    setSimStep(0);
    setSimulating(true);
  };

  const toggleField = (key: keyof SandboxConfig) => {
    playClick();
    setOutcome(null);
    setSimStep(-1);
    setSimulating(false);
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPreset = (preset: SandboxConfig) => {
    playClick();
    setOutcome(null);
    setSimStep(-1);
    setSimulating(false);
    setConfig(preset);
  };

  const packetX = simStep >= 0 ? nodes[Math.min(simStep, nodes.length - 1)].x + 48 : 78;

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
              Constructeur interactif · Topologie, NAT, VPN &amp; Règles Pare-feu
            </p>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              Bac à sable d&apos;Architecture Réseau
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.config)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Animated Topology Canvas */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F8FC] dark:bg-slate-950 p-4 overflow-x-auto">
          <svg
            viewBox="0 0 740 165"
            className="w-full min-w-[640px] h-auto"
            role="img"
            aria-label="Topologie interactive du bac à sable réseau"
          >
            {/* Connecting cables */}
            {nodes.slice(0, -1).map((n, idx) => {
              const next = nodes[idx + 1];
              const traversed = simStep > idx;
              return (
                <line
                  key={`${n.id}-${next.id}`}
                  x1={n.x + 96}
                  y1="78"
                  x2={next.x}
                  y2="78"
                  stroke={traversed ? '#0284C7' : '#CBD5E1'}
                  strokeWidth={traversed ? '4' : '2.5'}
                  strokeDasharray={n.active && next.active ? 'none' : '5 4'}
                />
              );
            })}

            {/* Equipment Nodes */}
            {nodes.map((node, idx) => {
              const isStoppedHere =
                outcome && !simulating && simStep === idx && !outcome.passed;
              const isSuccessEnd =
                outcome && !simulating && simStep === idx && outcome.passed;
              const stroke = isStoppedHere
                ? '#DC2626'
                : isSuccessEnd
                ? '#059669'
                : node.active
                ? '#0284C7'
                : '#94A3B8';
              const fill = isStoppedHere
                ? '#FEF2F2'
                : isSuccessEnd
                ? '#ECFDF5'
                : node.active
                ? '#FFFFFF'
                : '#F1F5F9';

              return (
                <g key={node.id}>
                  <rect
                    x={node.x}
                    y="38"
                    width="96"
                    height="80"
                    rx="10"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={simStep === idx ? '3' : '2'}
                  />
                  <text
                    x={node.x + 48}
                    y="68"
                    textAnchor="middle"
                    className="fill-slate-900 text-[10px] font-bold"
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.x + 48}
                    y="88"
                    textAnchor="middle"
                    className="fill-slate-600 text-[9px] font-mono"
                  >
                    {node.sub}
                  </text>
                  <text
                    x={node.x + 48}
                    y="108"
                    textAnchor="middle"
                    className={`text-[8px] font-bold ${
                      node.active ? 'fill-emerald-700' : 'fill-slate-400'
                    }`}
                  >
                    {node.active ? 'ACTIF' : 'INACTIF'}
                  </text>
                </g>
              );
            })}

            {/* Moving Animated Packet */}
            {simStep >= 0 && (
              <g
                style={{
                  transform: `translate(${packetX - 24}px, 8px)`,
                  transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <rect
                  width="48"
                  height="22"
                  rx="6"
                  fill={
                    outcome && !simulating && !outcome.passed
                      ? '#DC2626'
                      : config.vpnEnabled
                      ? '#059669'
                      : '#0284C7'
                  }
                />
                <text
                  x="24"
                  y="14"
                  textAnchor="middle"
                  className="fill-white text-[9px] font-mono font-bold"
                >
                  {flow.toUpperCase()}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Controls Grid: Left = Equipment & Rules, Right = Test Flow & Result */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              1. Configurer vos équipements et règles de sécurité
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {(
                [
                  { key: 'switchEnabled', label: 'Switch LAN (Couche 2)', icon: Network },
                  { key: 'vlanIsolated', label: 'Mode VLAN Invité isolé', icon: Laptop },
                  { key: 'natEnabled', label: 'Routeur NAT / PAT (Couche 3)', icon: Router },
                  { key: 'vpnEnabled', label: 'Tunnel VPN WireGuard', icon: Lock },
                  { key: 'firewallEnabled', label: 'Pare-feu Stateful actif', icon: ShieldCheck },
                  { key: 'allowPort443', label: 'Règle : Autoriser HTTPS (443)', icon: ShieldCheck },
                  { key: 'blockPort23', label: 'Règle : Bloquer Telnet (23)', icon: ShieldCheck },
                  { key: 'blockPublicRdp', label: 'Règle : Bloquer RDP public (3389)', icon: ShieldCheck },
                  { key: 'amaAgentEnabled', label: 'Agent Windows Azure Monitor (AMA)', icon: Server },
                ] as { key: keyof SandboxConfig; label: string; icon: React.ComponentType<{ className?: string }> }[]
              ).map((item) => {
                const Icon = item.icon;
                const active = config[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleField(item.key)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-colors ${
                      active
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-600 text-sky-950 dark:text-sky-100 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </span>
                    <span className="font-mono text-[11px] shrink-0">{active ? 'ON' : 'OFF'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              2. Choisir un flux à injecter
            </h3>
            <div className="space-y-2">
              {FLOWS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    playClick();
                    setFlow(f.id);
                    setOutcome(null);
                    setSimStep(-1);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    flow === f.id
                      ? 'bg-white dark:bg-slate-900 border-sky-600 text-slate-900 dark:text-slate-100'
                      : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span>{f.label}</span>
                    <span className="font-mono text-sky-700 dark:text-sky-400">{f.port}</span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5">{f.summary}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunSimulation}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                Lancer la simulation
              </button>
              <button
                type="button"
                onClick={() => applyPreset(PRESETS[0].config)}
                aria-label="Réinitialiser"
                className="p-2.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {outcome && !simulating && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  outcome.passed && !(flow === 'telnet' || (flow === 'rdp' && !config.vpnEnabled))
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200'
                    : flow === 'telnet' && !outcome.passed
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-200'
                }`}
              >
                <p className="font-bold flex items-center gap-1.5">
                  {outcome.passed && !(flow === 'telnet' || (flow === 'rdp' && !config.vpnEnabled)) ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : flow === 'telnet' && !outcome.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                  {outcome.verdictTitle}
                </p>
                <p className="leading-relaxed">{outcome.verdictDetail}</p>
                <p className="font-semibold pt-1">Conseil : {outcome.securityNote}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
