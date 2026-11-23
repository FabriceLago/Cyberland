import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Radar,
  MonitorCheck,
  Flame,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Lock,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { playClick, playError, playPacket, playSuccess, playVictory } from '../../utils/sound';

interface CrisisResponseLabProps {
  onContainCrisis?: () => void;
}

type ToolPane = 'wireshark' | 'kql' | 'soar';

interface WirePacket {
  no: number;
  time: string;
  src: string;
  dst: string;
  proto: 'DNS' | 'SMB' | 'HTTP' | 'TLS' | 'RDP';
  info: string;
  suspicious: boolean;
}

const CRISIS_PACKETS: WirePacket[] = [
  {
    no: 1,
    time: '00:01.12',
    src: '10.0.2.14 (PC-COMPTA-04)',
    dst: '10.0.0.53',
    proto: 'DNS',
    info: 'Query A portal.cyberland.gem → 10.0.2.50',
    suspicious: false,
  },
  {
    no: 2,
    time: '00:04.45',
    src: '185.220.101.47 (Externe)',
    dst: '10.0.2.20 (WIN-FIN-02)',
    proto: 'RDP',
    info: 'TCP 51882 → 3389 · Rafale brute-force RDP (48 tentatives)',
    suspicious: true,
  },
  {
    no: 3,
    time: '00:09.02',
    src: '10.0.2.20 (WIN-FIN-02)',
    dst: '10.0.2.10 (WIN-AD-01)',
    proto: 'SMB',
    info: 'TCP 49210 → 445 · Scan mouvement latéral SMB (svc_compta)',
    suspicious: true,
  },
  {
    no: 4,
    time: '00:12.60',
    src: '10.0.2.18',
    dst: '10.42.0.100',
    proto: 'TLS',
    info: 'TLSv1.3 Application Data (port 443 · Trafic légitime)',
    suspicious: false,
  },
  {
    no: 5,
    time: '00:16.84',
    src: '10.0.2.20 (WIN-FIN-02)',
    dst: '185.220.101.47 (Externe)',
    proto: 'HTTP',
    info: 'POST /upload-c2 HTTP/1.1 · Exfiltration bilan_2026.zip (en clair)',
    suspicious: true,
  },
  {
    no: 6,
    time: '00:19.22',
    src: '10.0.2.20 (WIN-FIN-02)',
    dst: '10.0.0.53',
    proto: 'DNS',
    info: 'Query TXT x9f2a1.exfil.evil-c2.xyz (Tunnel DNS suspect)',
    suspicious: true,
  },
];

const KQL_PRESETS = [
  {
    id: 'kql-4625',
    label: 'Event | where EventID == 4625',
    query: 'Event | where EventID == 4625 | summarize Echecs=count() by Computer, Account',
    rows: [
      { col1: 'WIN-FIN-02', col2: 'svc_compta', col3: '48 échecs RDP · IP 185.220.101.47', alert: true },
      { col1: 'WIN-WEB-01', col2: 'guest', col3: '2 échecs mineurs · LAN interne', alert: false },
    ],
    insight: 'Preuve KQL : le compte « svc_compta » subit un brute-force RDP sur WIN-FIN-02 depuis 185.220.101.47.',
  },
  {
    id: 'kql-4624',
    label: 'Event | where EventID == 4624 (RDP)',
    query: 'Event | where EventID == 4624 and LogonType == 10 | project TimeGenerated, Computer, Account, IpAddress',
    rows: [
      { col1: 'WIN-FIN-02', col2: 'svc_compta', col3: 'SESSION RDP OUVERTE depuis 185.220.101.47 !', alert: true },
    ],
    insight: 'Critique : l’attaquant a réussi à ouvrir une session interactive sur WIN-FIN-02 !',
  },
  {
    id: 'kql-kerb',
    label: 'Event | where EventID == 4769 (Kerberos)',
    query: 'Event | where EventID == 4769 and TicketEncryptionType == "0x17" | summarize count() by Computer',
    rows: [
      { col1: 'WIN-FIN-02', col2: 'svc_compta', col3: '19 demandes TGS RC4 (Kerberoasting en cours)', alert: true },
    ],
    insight: 'Confirmation : WIN-FIN-02 tente une élévation de privilèges Active Directory.',
  },
];

const CONTAINMENT_ACTIONS = [
  {
    id: 'block-ip',
    label: 'Pare-feu : Bloquer l’IP C2 185.220.101.47 (Entrée + Sortie)',
    required: true,
    feedback: 'Flux d’exfiltration vers 185.220.101.47 immédiatement coupé !',
  },
  {
    id: 'isolate-host',
    label: 'SOAR / EDR : Isoler le serveur compromis WIN-FIN-02 du réseau',
    required: true,
    feedback: 'WIN-FIN-02 est placé en quarantaine : le mouvement latéral SMB est stoppé.',
  },
  {
    id: 'revoke-account',
    label: 'Active Directory : Désactiver svc_compta & révoquer ses tickets Kerberos',
    required: true,
    feedback: 'Compte svc_compta verrouillé et tickets TGT/TGS invalidés.',
  },
  {
    id: 'close-rdp',
    label: 'Pare-feu NSG : Fermer le port RDP 3389 exposé sur Internet (0.0.0.0/0)',
    required: true,
    feedback: 'Vecteur d’entrée RDP 3389 refermé (remplacé par VPN WireGuard / Bastion).',
  },
  {
    id: 'shutdown-dns',
    label: 'Action piège : Couper le serveur DNS 10.0.0.53 de toute l’entreprise',
    required: false,
    feedback: 'Erreur ! Couper le DNS central mettrait tout l’archipel hors service sans nettoyer WIN-FIN-02.',
  },
];

const INITIAL_SECONDS = 180;

export const CrisisResponseLab: React.FC<CrisisResponseLabProps> = ({ onContainCrisis }) => {
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [activeTool, setActiveTool] = useState<ToolPane>('wireshark');
  const [wireFilter, setWireFilter] = useState<'all' | 'suspicious' | 'HTTP' | 'RDP' | 'SMB'>('all');
  const [selectedKqlId, setSelectedKqlId] = useState(KQL_PRESETS[0].id);
  const [executedActions, setExecutedActions] = useState<string[]>([]);
  const [mistakeMsg, setMistakeMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<'ready' | 'active' | 'won' | 'lost'>('ready');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const anim = window.setInterval(() => setTick((t) => (t + 1) % 40), 120);
    return () => window.clearInterval(anim);
  }, []);

  useEffect(() => {
    if (!running || status !== 'active') return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setStatus('lost');
          playError();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, status]);

  const requiredIds = CONTAINMENT_ACTIONS.filter((a) => a.required).map((a) => a.id);
  const completedRequired = requiredIds.filter((id) => executedActions.includes(id)).length;
  const attackStage =
    status === 'won'
      ? 0
      : secondsLeft > 135
      ? 1
      : secondsLeft > 90
      ? 2
      : secondsLeft > 45
      ? 3
      : 4;

  const startCrisis = () => {
    playClick();
    setSecondsLeft(INITIAL_SECONDS);
    setExecutedActions([]);
    setMistakeMsg(null);
    setStatus('active');
    setRunning(true);
    setActiveTool('wireshark');
  };

  const handleAction = (actionId: string) => {
    if (status !== 'active') return;
    const act = CONTAINMENT_ACTIONS.find((a) => a.id === actionId);
    if (!act) return;

    if (!act.required) {
      playError();
      setMistakeMsg(act.feedback);
      setSecondsLeft((s) => Math.max(5, s - 15));
      return;
    }

    if (executedActions.includes(actionId)) return;
    setMistakeMsg(null);
    const next = [...executedActions, actionId];
    setExecutedActions(next);

    const allDone = requiredIds.every((id) => next.includes(id));
    if (allDone) {
      playVictory();
      setRunning(false);
      setStatus('won');
      onContainCrisis?.();
    } else {
      playSuccess();
    }
  };

  const filteredPackets = CRISIS_PACKETS.filter((p) => {
    if (wireFilter === 'all') return true;
    if (wireFilter === 'suspicious') return p.suspicious;
    return p.proto === wireFilter;
  });

  const activeKql = KQL_PRESETS.find((k) => k.id === selectedKqlId) ?? KQL_PRESETS[0];
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="space-y-6">
      {/* Top Crisis Banner + Live Animated Kill-Chain */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-red-700 dark:text-red-400">
              Scénario multi-outils temps réel · Wireshark + Azure Monitor KQL + Pare-feu SOAR
            </p>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              Gestion de Crise Cyber en Direct
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
              <Timer
                className={`w-4 h-4 ${
                  status === 'active' && secondsLeft <= 45
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-sky-700 dark:text-sky-400'
                }`}
              />
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>

            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              Confinement : {completedRequired}/{requiredIds.length}
            </span>

            {status === 'ready' ? (
              <button
                type="button"
                onClick={startCrisis}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors whitespace-nowrap"
              >
                <Play className="w-4 h-4" />
                Lancer la crise (3 min)
              </button>
            ) : (
              <button
                type="button"
                onClick={startCrisis}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Rejouer la crise
              </button>
            )}
          </div>
        </div>

        {/* Live Animated Kill-Chain SVG */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F8FC] dark:bg-slate-950 p-4">
          <svg
            viewBox="0 0 720 112"
            className="w-full h-auto"
            role="img"
            aria-label="Chronologie animée de la cyberattaque"
          >
            {[
              { x: 16, stage: 1, title: '1. Accès initial', sub: 'Brute-force RDP 3389' },
              { x: 196, stage: 2, title: '2. Compromission', sub: 'WIN-FIN-02 / svc_compta' },
              { x: 376, stage: 3, title: '3. Mouvement latéral', sub: 'Scan SMB + Kerberoasting' },
              { x: 556, stage: 4, title: '4. Exfiltration', sub: 'HTTP / DNS vers C2' },
            ].map((node, i) => {
              const reached = status === 'active' && attackStage >= node.stage;
              const contained = status === 'won';
              const stroke = contained
                ? '#059669'
                : reached
                ? '#DC2626'
                : '#94A3B8';
              const fill = contained
                ? '#ECFDF5'
                : reached
                ? '#FEF2F2'
                : '#FFFFFF';

              return (
                <g key={node.title}>
                  <rect
                    x={node.x}
                    y="16"
                    width="148"
                    height="78"
                    rx="10"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="2.2"
                  />
                  <text
                    x={node.x + 74}
                    y="45"
                    textAnchor="middle"
                    className="fill-slate-900 text-[11px] font-bold"
                  >
                    {node.title}
                  </text>
                  <text
                    x={node.x + 74}
                    y="66"
                    textAnchor="middle"
                    className="fill-slate-600 text-[9px] font-mono"
                  >
                    {node.sub}
                  </text>
                  <text
                    x={node.x + 74}
                    y="84"
                    textAnchor="middle"
                    className={`text-[9px] font-bold ${
                      contained
                        ? 'fill-emerald-700'
                        : reached
                        ? 'fill-red-700'
                        : 'fill-slate-400'
                    }`}
                  >
                    {contained ? 'NEUTRALISÉ' : reached ? 'EN COURS' : 'EN ATTENTE'}
                  </text>
                  {i < 3 && (
                    <>
                      <line
                        x1={node.x + 148}
                        y1="55"
                        x2={node.x + 180}
                        y2="55"
                        stroke={contained ? '#059669' : reached ? '#DC2626' : '#CBD5E1'}
                        strokeWidth="3"
                        strokeDasharray={contained ? 'none' : '4 3'}
                      />
                      {status === 'active' && attackStage >= node.stage && (
                        <circle
                          cx={node.x + 150 + ((tick / 40) % 1) * 28}
                          cy="55"
                          r="4.5"
                          fill="#DC2626"
                        />
                      )}
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {status === 'ready' && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>Briefing d&apos;urgence :</strong> Une intrusion active vient d&apos;être signalée
            sur Cyberland. Démarrez la crise, inspectez les trames dans <strong>Wireshark</strong>,
            confirmez le serveur et le compte compromis dans <strong>Azure Monitor (KQL)</strong>,
            puis exécutez les 4 mesures exactes de confinement dans <strong>Pare-feu &amp; SOAR</strong>{' '}
            avant la fin du chronomètre !
          </div>
        )}

        {status === 'won' && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-sm text-emerald-950 dark:text-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Crise cyber contenue avec succès (+100 XP) !</strong> Vous avez croisé
              Wireshark (IP C2 185.220.101.47), Azure Monitor KQL (WIN-FIN-02 / svc_compta) et les
              règles Pare-feu / SOAR pour stopper l&apos;exfiltration sans interrompre le DNS central.
            </div>
          </div>
        )}

        {status === 'lost' && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-sm text-red-950 dark:text-red-200 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong>Temps écoulé — Exfiltration achevée :</strong> relancez la simulation pour
              appliquer les 4 actions de confinement avant la fin des 3 minutes.
            </div>
          </div>
        )}
      </section>

      {/* Multi-Tool SOC Cockpit */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-800 rounded-lg">
            {(
              [
                { id: 'wireshark' as ToolPane, label: '1. Wireshark Live', icon: Radar },
                { id: 'kql' as ToolPane, label: '2. Azure Monitor (KQL)', icon: MonitorCheck },
                { id: 'soar' as ToolPane, label: '3. Pare-feu & SOAR (Agir)', icon: Flame },
              ]
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeTool === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    playClick();
                    setActiveTool(tab.id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-sky-700 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <span className="text-xs font-mono text-slate-400">
            Poste SOC Cyberland · Corrélation temps réel
          </span>
        </div>

        <div className="p-6">
          {activeTool === 'wireshark' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Filtrez la capture réseau pour repérer l&apos;adresse IP malveillante (C2) et le
                  serveur interne exfiltrant les données.
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'all', label: 'Tout' },
                      { id: 'suspicious', label: 'Anomalies' },
                      { id: 'RDP', label: 'tcp.port == 3389' },
                      { id: 'SMB', label: 'tcp.port == 445' },
                      { id: 'HTTP', label: 'http' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        playPacket();
                        setWireFilter(f.id);
                      }}
                      className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border transition-colors ${
                        wireFilter === f.id
                          ? 'bg-sky-700 border-sky-700 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Temps</th>
                      <th className="py-2.5 px-3">Source</th>
                      <th className="py-2.5 px-3">Destination</th>
                      <th className="py-2.5 px-3">Proto</th>
                      <th className="py-2.5 px-3">Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredPackets.map((pkt) => (
                      <tr
                        key={pkt.no}
                        className={
                          pkt.suspicious
                            ? 'bg-red-50/70 dark:bg-red-950/30 text-red-950 dark:text-red-200'
                            : 'text-slate-700 dark:text-slate-300'
                        }
                      >
                        <td className="py-2.5 px-3 tabular-nums">{pkt.no}</td>
                        <td className="py-2.5 px-3 tabular-nums">{pkt.time}</td>
                        <td className="py-2.5 px-3">{pkt.src}</td>
                        <td className="py-2.5 px-3">{pkt.dst}</td>
                        <td className="py-2.5 px-3 font-bold">{pkt.proto}</td>
                        <td className="py-2.5 px-3">{pkt.info}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTool === 'kql' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {KQL_PRESETS.map((kql) => (
                  <button
                    key={kql.id}
                    type="button"
                    onClick={() => {
                      playPacket();
                      setSelectedKqlId(kql.id);
                    }}
                    className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                      selectedKqlId === kql.id
                        ? 'bg-sky-700 border-sky-700 text-white'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {kql.label}
                  </button>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 text-sky-300 font-mono text-xs">
                {activeKql.query}
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Computer</th>
                      <th className="py-2.5 px-3">Account</th>
                      <th className="py-2.5 px-3">Résultat Log Analytics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {activeKql.rows.map((r) => (
                      <tr
                        key={`${r.col1}-${r.col2}`}
                        className={
                          r.alert
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 font-semibold'
                            : 'text-slate-700 dark:text-slate-300'
                        }
                      >
                        <td className="py-2.5 px-3">{r.col1}</td>
                        <td className="py-2.5 px-3">{r.col2}</td>
                        <td className="py-2.5 px-3">{r.col3}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-sky-900 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg px-3.5 py-2.5">
                <strong>Analyse KQL :</strong> {activeKql.insight}
              </p>
            </div>
          )}

          {activeTool === 'soar' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Exécutez les <strong>4 mesures de confinement exactes</strong> (attention à ne pas
                  couper un service vital de l&apos;entreprise !).
                </p>
                {status === 'ready' && (
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Cliquez d&apos;abord sur « Lancer la crise » en haut.
                  </span>
                )}
              </div>

              {mistakeMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-xs text-red-900 dark:text-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{mistakeMsg} (-15 s de pénalité)</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CONTAINMENT_ACTIONS.map((act) => {
                  const done = executedActions.includes(act.id);
                  return (
                    <button
                      key={act.id}
                      type="button"
                      disabled={status !== 'active' || done}
                      onClick={() => handleAction(act.id)}
                      className={`text-left p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                        done
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-800 dark:text-slate-200 disabled:opacity-55'
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm font-bold">{act.label}</p>
                        {done && <p className="text-xs text-emerald-700 dark:text-emerald-400">{act.feedback}</p>}
                      </div>
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
