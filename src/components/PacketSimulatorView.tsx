import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  SkipForward,
  RotateCcw,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Gauge,
} from 'lucide-react';
import { GemiBotGuide } from './GemiBotGuide';
import { playClick, playError, playPacket, playSuccess } from '../utils/sound';

type SimProtocol = 'https' | 'udp' | 'telnet';

interface SandboxConfig {
  dnsDown: boolean;
  routerCongested: boolean;
  cdnEnabled: boolean;
  dualCloudServer: boolean;
  simulateLoss: boolean;
}

interface StepLog {
  nodeIndex: number; // 0: Client, 1: DNS, 2: Router/CDN, 3: Firewall, 4: Cloud
  title: string;
  detail: string;
  status: 'ok' | 'warn' | 'blocked';
  latencyDeltaMs: number;
}

const NODES = [
  { id: 'client', label: 'Client', sub: '192.168.1.12', x: 64 },
  { id: 'dns', label: 'Tour DNS', sub: 'Annuaire', x: 192 },
  { id: 'router', label: 'Routeur', sub: 'Aiguillage', x: 320 },
  { id: 'firewall', label: 'Pare-feu', sub: 'Filtrage ports', x: 448 },
  { id: 'cloud', label: 'Nuage Céleste', sub: '10.42.0.80', x: 576 },
];

function buildSimulationSteps(
  protocol: SimProtocol,
  domain: string,
  sandbox: SandboxConfig
): StepLog[] {
  const port = protocol === 'https' ? 443 : protocol === 'udp' ? 5004 : 23;
  const protoLabel =
    protocol === 'https' ? 'HTTPS / TCP' : protocol === 'udp' ? 'Streaming / UDP' : 'Telnet / TCP';

  const steps: StepLog[] = [
    {
      nodeIndex: 0,
      title: '1. Préparation du paquet sur le Client',
      detail: `Votre poste prépare une requête vers ${domain} en ${protoLabel} (port ${port}). ${
        protocol === 'https'
          ? 'Le contenu est chiffré par TLS avant départ.'
          : protocol === 'telnet'
          ? 'Attention : le contenu voyage en clair sans chiffrement !'
          : 'Flux léger sans poignée de main pour minimiser la latence.'
      }`,
      status: 'ok',
      latencyDeltaMs: protocol === 'udp' ? 3 : 6,
    },
  ];

  // DNS step
  if (sandbox.dnsDown) {
    steps.push({
      nodeIndex: 1,
      title: '2. Tour DNS — PANNE (Résolution impossible)',
      detail: `Le serveur DNS est coupé ! Impossible de traduire « ${domain} » en adresse IP : le navigateur affiche ERR_NAME_NOT_RESOLVED.`,
      status: 'blocked',
      latencyDeltaMs: 120,
    });
    return steps;
  }

  steps.push({
    nodeIndex: 1,
    title: '2. Résolution via la Tour DNS',
    detail: `La Tour DNS traduit « ${domain} » en adresse IP cible : 10.42.0.80.`,
    status: 'ok',
    latencyDeltaMs: 8,
  });

  // CDN shortcut for HTTPS
  if (sandbox.cdnEnabled && protocol === 'https') {
    steps.push({
      nodeIndex: 2,
      title: '3. Cache CDN en bordure — Réponse ultra-rapide !',
      detail:
        'Un nœud CDN proche de votre île possède déjà une copie à jour de la page. Pas besoin de traverser tout l’océan jusqu’au serveur central !',
      status: 'ok',
      latencyDeltaMs: 7,
    });
    return steps;
  }

  // Router step
  const routerLatency =
    (sandbox.routerCongested ? 65 : 14) +
    (sandbox.simulateLoss && protocol !== 'udp' ? 42 : 0);

  steps.push({
    nodeIndex: 2,
    title: sandbox.simulateLoss
      ? protocol === 'udp'
        ? '3. Routeur — Perturbation sur la ligne (UDP continue)'
        : '3. Routeur — Paquet perdu puis renvoyé par TCP'
      : sandbox.routerCongested
      ? '3. Routeur saturé — File d’attente allongée'
      : '3. Routage fluide vers le sous-réseau 10.42.x.x',
    detail: sandbox.simulateLoss
      ? protocol === 'udp'
        ? "Un micro-paquet est perdu dans l'orage. Comme le protocole est UDP, aucune pause : le flux en direct continue aussitôt."
        : "Le colis n°2 n'a pas reçu d'accusé (ACK). TCP détecte la perte et réexpédie automatiquement le paquet (+42 ms)."
      : sandbox.routerCongested
      ? 'Le routeur traite trop de navires simultanément : le paquet attend dans la file (+65 ms de latence).'
      : 'Le routeur consulte sa table de routage et oriente le paquet sur la liaison fibre optique la plus rapide.',
    status: sandbox.simulateLoss || sandbox.routerCongested ? 'warn' : 'ok',
    latencyDeltaMs: routerLatency,
  });

  if (protocol === 'telnet') {
    steps.push({
      nodeIndex: 3,
      title: '4. Pare-feu — Connexion BLOQUÉE (Port 23)',
      detail:
        'Alerte sécurité : le pare-feu rejette immédiatement le port 23 (Telnet non chiffré). Le paquet n’atteint jamais le serveur Cloud !',
      status: 'blocked',
      latencyDeltaMs: 5,
    });
    return steps;
  }

  steps.push({
    nodeIndex: 3,
    title: `4. Pare-feu — Port ${port} autorisé`,
    detail:
      protocol === 'https'
        ? 'Le cadenas TLS (port 443) est vérifié. Le pare-feu laisse passer le paquet vers le Load Balancer du Cloud.'
        : 'Le flux UDP autorisé (port 5004) franchit le pare-feu avec une latence minimale.',
    status: 'ok',
    latencyDeltaMs: 5,
  });

  steps.push({
    nodeIndex: 4,
    title: sandbox.dualCloudServer
      ? '5. Nuage Céleste — Load Balancer actif (2 serveurs)'
      : '5. Arrivée dans le Nuage Céleste (1 serveur)',
    detail: sandbox.dualCloudServer
      ? 'La charge est répartie sur 2 serveurs Cloud : réponse traitée en 9 ms avec haute disponibilité !'
      : 'Un serveur unique traite la requête en 28 ms. Activez un 2e serveur en mode Bac à sable pour réduire la latence !',
    status: 'ok',
    latencyDeltaMs: sandbox.dualCloudServer ? 9 : 28,
  });

  return steps;
}

export const PacketSimulatorView: React.FC = () => {
  const [protocol, setProtocol] = useState<SimProtocol>('https');
  const [domain, setDomain] = useState('meteo.cyberland.gem');
  const [sandbox, setSandbox] = useState<SandboxConfig>({
    dnsDown: false,
    routerCongested: false,
    cdnEnabled: false,
    dualCloudServer: true,
    simulateLoss: false,
  });
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [autoPlaying, setAutoPlaying] = useState(false);

  const steps = useMemo(
    () => buildSimulationSteps(protocol, domain, sandbox),
    [protocol, domain, sandbox]
  );

  const activeStepData = currentStep >= 0 ? steps[Math.min(currentStep, steps.length - 1)] : null;
  const activeNodeIdx = activeStepData ? activeStepData.nodeIndex : 0;

  const cumulativeLatencyMs = useMemo(() => {
    if (currentStep < 0) return 0;
    return steps
      .slice(0, currentStep + 1)
      .reduce((acc, s) => acc + s.latencyDeltaMs, 0);
  }, [steps, currentStep]);

  const estimatedTotalMs = useMemo(
    () => steps.reduce((acc, s) => acc + s.latencyDeltaMs, 0),
    [steps]
  );

  useEffect(() => {
    if (!autoPlaying) return;
    const timer = window.setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= steps.length) {
          setAutoPlaying(false);
          return prev;
        }
        const st = steps[next];
        if (st.status === 'blocked') {
          playError();
        } else if (next === steps.length - 1) {
          playSuccess();
        } else {
          playPacket();
        }
        return next;
      });
    }, 1350);
    return () => window.clearInterval(timer);
  }, [autoPlaying, steps]);

  const resetPlayback = () => {
    setAutoPlaying(false);
    setCurrentStep(-1);
  };

  const toggleSandbox = (key: keyof SandboxConfig) => {
    playClick();
    setSandbox((prev) => ({ ...prev, [key]: !prev[key] }));
    resetPlayback();
  };

  const handleLaunch = () => {
    playPacket();
    setCurrentStep(0);
    setAutoPlaying(true);
  };

  const handleStepNext = () => {
    setAutoPlaying(false);
    setCurrentStep((prev) => {
      const next = Math.min(steps.length - 1, prev + 1);
      const st = steps[next];
      if (st?.status === 'blocked') playError();
      else playPacket();
      return next;
    });
  };

  const encrypted = protocol === 'https';
  const port = protocol === 'https' ? 443 : protocol === 'udp' ? 5004 : 23;

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
          Simulateur : Client → DNS → Routeur → Pare-feu → Cloud
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
          Expérimentez librement : coupez la Tour DNS, congestionnez le routeur, activez un CDN en
          bordure ou un 2e serveur Cloud pour mesurer l&apos;impact direct sur le trajet et la
          latence en millisecondes.
        </p>
      </div>

      {/* Two-Zone Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 65% Interactive Animated Map */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold">Carte réseau animée (Bac à sable)</span>
            <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
              <span className="inline-flex items-center gap-1.5 text-sky-200">
                <Gauge className="w-3.5 h-3.5" />
                Latence :{' '}
                <strong>
                  {currentStep < 0 ? `${estimatedTotalMs} ms (est.)` : `${cumulativeLatencyMs} ms`}
                </strong>
              </span>
              <span className="text-slate-300">
                {currentStep < 0 ? 'Prêt' : `Étape ${currentStep + 1}/${steps.length}`}
              </span>
            </div>
          </div>

          <div className="p-6 bg-[#EEF5FA] dark:bg-slate-800/80">
            <svg
              viewBox="0 0 640 215"
              className="w-full h-auto"
              role="img"
              aria-label="Parcours animé d'un paquet du Client jusqu'au Cloud"
            >
              {/* Connection Links */}
              {NODES.slice(0, -1).map((node, idx) => {
                const next = NODES[idx + 1];
                const reached = currentStep >= 0 && activeNodeIdx > idx;
                const blockedHere =
                  activeStepData?.status === 'blocked' && activeNodeIdx === idx + 1;
                return (
                  <line
                    key={node.id}
                    x1={node.x + 36}
                    y1={110}
                    x2={next.x - 36}
                    y2={110}
                    stroke={blockedHere ? '#DC2626' : reached ? '#0284C7' : '#CBD5E1'}
                    strokeWidth={reached ? 4 : 3}
                    strokeDasharray={reached ? 'none' : '6 5'}
                  />
                );
              })}

              {/* Network Nodes */}
              {NODES.map((node, idx) => {
                const isActive = currentStep >= 0 && activeNodeIdx === idx;
                const isPassed = currentStep >= 0 && activeNodeIdx > idx;
                const isBlocked = isActive && activeStepData?.status === 'blocked';
                const nodeIsFaulty =
                  (idx === 1 && sandbox.dnsDown) || (idx === 2 && sandbox.routerCongested);

                const subLabel =
                  idx === 1 && sandbox.dnsDown
                    ? 'HORS SERVICE'
                    : idx === 2 && sandbox.cdnEnabled && protocol === 'https'
                    ? 'CDN Bordure'
                    : idx === 2 && sandbox.routerCongested
                    ? 'CONGESTION'
                    : idx === 4 && sandbox.dualCloudServer
                    ? '2 Serveurs (LB)'
                    : node.sub;

                return (
                  <g key={node.id} transform={`translate(${node.x}, 110)`}>
                    <rect
                      x="-47"
                      y="-35"
                      width="94"
                      height="70"
                      rx="10"
                      fill={
                        isBlocked || (idx === 1 && sandbox.dnsDown)
                          ? '#FEF2F2'
                          : isActive
                          ? '#0369A1'
                          : isPassed
                          ? '#ECFDF5'
                          : '#FFFFFF'
                      }
                      stroke={
                        isBlocked || (idx === 1 && sandbox.dnsDown)
                          ? '#DC2626'
                          : nodeIsFaulty
                          ? '#D97706'
                          : isActive
                          ? '#0369A1'
                          : isPassed
                          ? '#059669'
                          : '#94A3B8'
                      }
                      strokeWidth="2"
                    />
                    <text
                      x="0"
                      y="-6"
                      textAnchor="middle"
                      className={`text-[11px] font-bold ${
                        isActive && !isBlocked ? 'fill-white' : 'fill-slate-900'
                      }`}
                    >
                      {node.label}
                    </text>
                    <text
                      x="0"
                      y="13"
                      textAnchor="middle"
                      className={`text-[9px] font-mono ${
                        isActive && !isBlocked
                          ? 'fill-sky-100'
                          : isBlocked || (idx === 1 && sandbox.dnsDown)
                          ? 'fill-red-700 font-semibold'
                          : 'fill-slate-500'
                      }`}
                    >
                      {isBlocked ? 'BLOQUÉ' : subLabel}
                    </text>
                  </g>
                );
              })}

              {/* Moving Packet Indicator */}
              {currentStep >= 0 && (
                <g
                  style={{
                    transform: `translate(${NODES[activeNodeIdx].x}px, 38px)`,
                    transition: 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <rect
                    x="-40"
                    y="-16"
                    width="80"
                    height="30"
                    rx="6"
                    fill={
                      activeStepData?.status === 'blocked'
                        ? '#DC2626'
                        : activeStepData?.status === 'warn'
                        ? '#D97706'
                        : '#059669'
                    }
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    className="fill-white text-[10px] font-mono font-bold"
                  >
                    {protocol.toUpperCase()} :{port}
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Step-by-step Pedagogical Explanation */}
          <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-4">
            {activeStepData ? (
              <div
                className={`p-4 rounded-lg border flex items-start gap-3 ${
                  activeStepData.status === 'blocked'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-950 dark:text-red-200'
                    : activeStepData.status === 'warn'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-200'
                    : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900 text-sky-950 dark:text-sky-200'
                }`}
              >
                {activeStepData.status === 'blocked' ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-sky-700 dark:text-sky-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{activeStepData.title}</p>
                    <span className="font-mono text-xs tabular-nums shrink-0">
                      +{activeStepData.latencyDeltaMs} ms
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{activeStepData.detail}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Activez ou coupez des nœuds dans le <strong>Bac à sable</strong> à droite, puis
                cliquez sur <strong>Envoyer le paquet</strong> pour mesurer le trajet et la latence.
              </p>
            )}

            {/* Live Packet Header Inspector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
              <div>
                <p className="text-slate-400 font-sans">IP Source</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">192.168.1.12</p>
              </div>
              <div>
                <p className="text-slate-400 font-sans">IP Destination</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {sandbox.dnsDown
                    ? 'Échec DNS'
                    : currentStep >= 1
                    ? '10.42.0.80'
                    : 'En attente DNS'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-sans">Port / Protocole</p>
                <p className="font-semibold text-sky-800 dark:text-sky-400">
                  {port} ({protocol.toUpperCase()})
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-sans">Chiffrement</p>
                <p
                  className={`font-semibold inline-flex items-center gap-1 ${
                    encrypted
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {encrypted ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  {encrypted ? 'TLS Actif' : 'En clair'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 35% Parameters & Sandbox Topology Controls */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Bac à sable &amp; Protocole
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Modifiez l&apos;état du réseau et observez l&apos;impact immédiat sur la latence.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="sim-domain"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Nom de domaine cible
            </label>
            <select
              id="sim-domain"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                resetPlayback();
              }}
              className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              <option value="meteo.cyberland.gem">meteo.cyberland.gem</option>
              <option value="cloud.cyberland.gem">cloud.cyberland.gem</option>
              <option value="direct-match.gem">direct-match.gem</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(
              [
                { id: 'https' as SimProtocol, label: 'HTTPS 443' },
                { id: 'udp' as SimProtocol, label: 'UDP 5004' },
                { id: 'telnet' as SimProtocol, label: 'Telnet 23' },
              ]
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  playClick();
                  setProtocol(p.id);
                  resetPlayback();
                }}
                className={`py-2 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  protocol === p.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Sandbox Node Toggles */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Contrôles Bac à sable
            </p>
            {(
              [
                {
                  key: 'dnsDown' as keyof SandboxConfig,
                  label: 'Couper la Tour DNS (simuler une panne)',
                },
                {
                  key: 'routerCongested' as keyof SandboxConfig,
                  label: 'Congestionner le Routeur (+65 ms)',
                },
                {
                  key: 'simulateLoss' as keyof SandboxConfig,
                  label: 'Simuler une perte de paquet (TCP vs UDP)',
                },
                {
                  key: 'cdnEnabled' as keyof SandboxConfig,
                  label: 'Activer un CDN en bordure (HTTPS rapide)',
                },
                {
                  key: 'dualCloudServer' as keyof SandboxConfig,
                  label: 'Activer 2e serveur Cloud (Load Balancing)',
                },
              ]
            ).map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer text-xs text-slate-700 dark:text-slate-200"
              >
                <input
                  type="checkbox"
                  checked={sandbox[item.key]}
                  onChange={() => toggleSandbox(item.key)}
                  className="w-4 h-4 accent-sky-700 shrink-0"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={handleLaunch}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Envoyer le paquet
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleStepNext}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Étape suivante
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  resetPlayback();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <GemiBotGuide
        contextLabel="Bac à sable Simulateur"
        hints={[
          "Essaie d'activer le CDN en bordure avec HTTPS : regarde la latence chuter autour de 21 ms sans même atteindre le serveur Cloud central !",
          "Coupe la Tour DNS pour voir pourquoi un site devient inaccessible même si le serveur Cloud est parfaitement en ligne.",
        ]}
      />
    </div>
  );
};
