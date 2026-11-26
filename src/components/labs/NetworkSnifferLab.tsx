import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Binary,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  FileCode2,
  Filter,
  Globe,
  Laptop,
  Layers,
  Lock,
  Network,
  Pause,
  Play,
  Radar,
  Server,
  Shield,
  ShieldAlert,
  StepForward,
  Trash2,
  Unlock,
} from 'lucide-react';
import {
  CapturedSnifferFrame,
  FRAME_LIBRARY_BY_LINK,
  PacketLayerKey,
  SNIFFER_CONNECTIONS,
  SNIFFER_MISSIONS,
  SNIFFER_NODES,
  SnifferConnection,
  SnifferLinkId,
  SnifferNode,
  SnifferProtocol,
} from '../../data/networkSnifferData';
import { sanitizeFilenameSlug } from '../../utils/safeExport';
import { playClick, playError, playPacket, playSuccess, playVictory } from '../../utils/sound';

interface NetworkSnifferLabProps {
  onCompleteChallenges?: () => void;
}

type QuickFilterId = 'all' | 'TCP' | 'HTTP' | 'TLSv1.3' | 'DNS' | 'ARP_ICMP' | 'anomaly';

const LAYER_ORDER: PacketLayerKey[] = ['l1', 'l2', 'l3', 'l4', 'l7'];

const LAYER_HIGHLIGHT_CLASSES: Record<Exclude<PacketLayerKey, 'l1'>, string> = {
  l2: 'bg-sky-100/90 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200',
  l3: 'bg-indigo-100/90 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200',
  l4: 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200',
  l7: 'bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200',
};

function matchesDisplayFilter(frame: CapturedSnifferFrame, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (q === 'alert' || q === 'anomaly' || q === 'anomalies' || q === 'suspect') {
    return frame.classification === 'anomaly' || frame.classification === 'cleartext';
  }
  if (q.startsWith('ip.addr==') || q.startsWith('ip.addr ==') || q.startsWith('ip==') || q.startsWith('ip ==')) {
    const ipVal = q.split('==')[1]?.trim() ?? '';
    return frame.srcIp.toLowerCase().includes(ipVal) || frame.dstIp.toLowerCase().includes(ipVal);
  }
  if (q.startsWith('port==') || q.startsWith('port ==') || q.startsWith('tcp.port==') || q.startsWith('tcp.port ==')) {
    const portVal = q.split('==')[1]?.trim() ?? '';
    return String(frame.srcPort ?? '') === portVal || String(frame.dstPort ?? '') === portVal;
  }

  const searchable = [
    frame.protocol,
    frame.srcIp,
    frame.dstIp,
    String(frame.srcPort ?? ''),
    String(frame.dstPort ?? ''),
    frame.info,
    frame.flags ?? '',
    frame.classification,
    frame.linkLabel,
  ]
    .join(' ')
    .toLowerCase();

  return searchable.includes(q);
}

function getProtocolTextClass(protocol: SnifferProtocol, classification: CapturedSnifferFrame['classification']): string {
  if (classification === 'anomaly') return 'text-rose-700 dark:text-rose-400 font-bold';
  if (classification === 'cleartext') return 'text-amber-700 dark:text-amber-400 font-bold';
  if (protocol === 'TLSv1.3' || protocol === 'SSHv2') return 'text-emerald-700 dark:text-emerald-400 font-semibold';
  if (protocol === 'DNS') return 'text-sky-700 dark:text-cyan-400 font-semibold';
  if (protocol === 'PostgreSQL') return 'text-indigo-700 dark:text-indigo-400 font-semibold';
  return 'text-slate-700 dark:text-slate-300 font-semibold';
}

function getClassificationLabel(classification: CapturedSnifferFrame['classification']): {
  label: string;
  className: string;
} {
  switch (classification) {
    case 'anomaly':
      return { label: 'Alerte', className: 'text-rose-700 dark:text-rose-400' };
    case 'cleartext':
      return { label: 'En clair', className: 'text-amber-700 dark:text-amber-400' };
    case 'encrypted':
      return { label: 'Chiffré', className: 'text-emerald-700 dark:text-emerald-400' };
    default:
      return { label: 'Normal', className: 'text-slate-500 dark:text-slate-400' };
  }
}

function renderNodeIcon(kind: SnifferNode['kind']) {
  const cls = 'w-4 h-4';
  switch (kind) {
    case 'workstation':
    case 'admin':
      return <Laptop className={cls} />;
    case 'switch':
      return <Network className={cls} />;
    case 'firewall':
      return <Shield className={cls} />;
    case 'web':
      return <Server className={cls} />;
    case 'db':
      return <Database className={cls} />;
    case 'wan':
      return <Globe className={cls} />;
  }
}

export const NetworkSnifferLab: React.FC<NetworkSnifferLabProps> = ({ onCompleteChallenges }) => {
  const [selectedLinkId, setSelectedLinkId] = useState<SnifferLinkId | null>(null);
  const [frames, setFrames] = useState<CapturedSnifferFrame[]>([]);
  const [selectedCaptureNo, setSelectedCaptureNo] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureSpeed, setCaptureSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [preserveAcrossLinks, setPreserveAcrossLinks] = useState(false);
  const [displayFilter, setDisplayFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilterId>('all');
  const [expandedLayers, setExpandedLayers] = useState<Record<PacketLayerKey, boolean>>({
    l1: false,
    l2: true,
    l3: true,
    l4: true,
    l7: true,
  });
  const [highlightedLayer, setHighlightedLayer] = useState<Exclude<PacketLayerKey, 'l1'> | null>('l7');
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [foundEvidenceIds, setFoundEvidenceIds] = useState<string[]>([]);
  const [evidenceFeedback, setEvidenceFeedback] = useState<string | null>(null);
  const [xpAwarded, setXpAwarded] = useState(false);

  const captureCounterRef = useRef(0);
  const linkCursorRef = useRef<Record<SnifferLinkId, number>>({
    'conn-lan-sw': 0,
    'conn-admin-sw': 0,
    'conn-sw-fw': 0,
    'conn-fw-dmz': 0,
    'conn-fw-db': 0,
    'conn-fw-wan': 0,
  });
  const startTimeRef = useRef<number>(Date.now());

  const nodesById = useMemo(() => {
    const map = {} as Record<SnifferNode['id'], SnifferNode>;
    SNIFFER_NODES.forEach((n) => {
      map[n.id] = n;
    });
    return map;
  }, []);

  const activeConnection: SnifferConnection | null = useMemo(
    () => SNIFFER_CONNECTIONS.find((c) => c.id === selectedLinkId) ?? null,
    [selectedLinkId]
  );

  const appendNextFrameForLink = useCallback((linkId: SnifferLinkId, selectIfNone = false) => {
    const conn = SNIFFER_CONNECTIONS.find((c) => c.id === linkId);
    const library = FRAME_LIBRARY_BY_LINK[linkId];
    if (!conn || !library || library.length === 0) return;

    const idx = linkCursorRef.current[linkId] % library.length;
    linkCursorRef.current[linkId] += 1;
    const tpl = library[idx];

    captureCounterRef.current += 1;
    const nextNo = captureCounterRef.current;
    const elapsedSec = Number(((Date.now() - startTimeRef.current) / 1000).toFixed(4));

    const newFrame: CapturedSnifferFrame = {
      ...tpl,
      captureNo: nextNo,
      timestampSec: Math.max(0.0001, elapsedSec),
      linkLabel: conn.label,
      iface: conn.iface,
    };

    setFrames((prev) => {
      const next = [...prev, newFrame].slice(-120);
      return next;
    });
    if (selectIfNone) {
      setSelectedCaptureNo((prev) => prev ?? nextNo);
    }
  }, []);

  // Clicking a connection in the simulator attaches the TAP sniffer and seeds initial frames immediately
  const handleSelectConnection = useCallback(
    (linkId: SnifferLinkId) => {
      playPacket();
      setSelectedLinkId(linkId);
      setShowStreamModal(false);
      setEvidenceFeedback(null);

      const conn = SNIFFER_CONNECTIONS.find((c) => c.id === linkId);
      const library = FRAME_LIBRARY_BY_LINK[linkId];
      if (!conn || !library) return;

      if (!preserveAcrossLinks) {
        captureCounterRef.current = 0;
        linkCursorRef.current[linkId] = 0;
        startTimeRef.current = Date.now();
        // Seed first 2 frames immediately so the user sees live capture right away
        const seedCount = Math.min(2, library.length);
        const seeded: CapturedSnifferFrame[] = [];
        for (let i = 0; i < seedCount; i += 1) {
          captureCounterRef.current += 1;
          linkCursorRef.current[linkId] += 1;
          seeded.push({
            ...library[i],
            captureNo: captureCounterRef.current,
            timestampSec: Number((i * 0.0142).toFixed(4)),
            linkLabel: conn.label,
            iface: conn.iface,
          });
        }
        setFrames(seeded);
        setSelectedCaptureNo(seeded[0]?.captureNo ?? null);
      } else {
        appendNextFrameForLink(linkId, true);
      }

      setIsCapturing(true);
    },
    [preserveAcrossLinks, appendNextFrameForLink]
  );

  // Live streaming timer when capturing on the selected connection
  useEffect(() => {
    if (!isCapturing || !selectedLinkId) return;
    const intervalMs = captureSpeed === 'fast' ? 1100 : captureSpeed === 'slow' ? 3200 : 1900;
    const id = window.setInterval(() => {
      appendNextFrameForLink(selectedLinkId, false);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [isCapturing, selectedLinkId, captureSpeed, appendNextFrameForLink]);

  const filteredFrames = useMemo(() => {
    return frames.filter((frame) => {
      if (quickFilter === 'TCP' && frame.protocol !== 'TCP') return false;
      if (quickFilter === 'HTTP' && frame.protocol !== 'HTTP') return false;
      if (quickFilter === 'TLSv1.3' && frame.protocol !== 'TLSv1.3' && frame.protocol !== 'SSHv2') return false;
      if (quickFilter === 'DNS' && frame.protocol !== 'DNS') return false;
      if (quickFilter === 'ARP_ICMP' && frame.protocol !== 'ARP' && frame.protocol !== 'ICMP') return false;
      if (
        quickFilter === 'anomaly' &&
        frame.classification !== 'anomaly' &&
        frame.classification !== 'cleartext'
      ) {
        return false;
      }
      return matchesDisplayFilter(frame, displayFilter);
    });
  }, [frames, quickFilter, displayFilter]);

  const selectedFrame = useMemo(() => {
    if (selectedCaptureNo === null) return filteredFrames[0] ?? null;
    return (
      filteredFrames.find((f) => f.captureNo === selectedCaptureNo) ??
      frames.find((f) => f.captureNo === selectedCaptureNo) ??
      filteredFrames[0] ??
      null
    );
  }, [filteredFrames, frames, selectedCaptureNo]);

  const anomalyCount = useMemo(
    () => frames.filter((f) => f.classification === 'anomaly' || f.classification === 'cleartext').length,
    [frames]
  );

  const toggleLayer = (layer: PacketLayerKey) => {
    playClick();
    setExpandedLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
    if (layer !== 'l1') {
      setHighlightedLayer(layer);
    }
  };

  const handleClearCapture = () => {
    playClick();
    captureCounterRef.current = 0;
    startTimeRef.current = Date.now();
    setFrames([]);
    setSelectedCaptureNo(null);
    setShowStreamModal(false);
  };

  const handleStepFrame = () => {
    if (!selectedLinkId) return;
    playPacket();
    appendNextFrameForLink(selectedLinkId, true);
  };

  const handleExportCaptureJson = () => {
    if (filteredFrames.length === 0) return;
    playSuccess();
    const payload = {
      exportedAt: new Date().toISOString(),
      connection: activeConnection?.label ?? 'multi-link',
      interface: activeConnection?.iface ?? 'tap-all',
      frameCount: filteredFrames.length,
      frames: filteredFrames.map((f) => ({
        no: f.captureNo,
        timeSec: f.timestampSec,
        source: f.srcPort ? `${f.srcIp}:${f.srcPort}` : f.srcIp,
        destination: f.dstPort ? `${f.dstIp}:${f.dstPort}` : f.dstIp,
        protocol: f.protocol,
        length: f.length,
        classification: f.classification,
        info: f.info,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyberland-capture-${sanitizeFilenameSlug(activeConnection?.id ?? 'pcap', 'pcap')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMarkEvidence = () => {
    if (!selectedFrame) return;
    if (!selectedFrame.missionEvidenceId) {
      playError();
      setEvidenceFeedback(
        'Cette trame correspond à du trafic normal ou ne fait pas partie des 4 preuves recherchées. Inspectez les trames marquées « Alerte » ou « En clair ».'
      );
      return;
    }

    const mission = SNIFFER_MISSIONS.find((m) => m.id === selectedFrame.missionEvidenceId);
    if (!mission) return;

    if (foundEvidenceIds.includes(mission.id)) {
      playClick();
      setEvidenceFeedback(`Preuve déjà enregistrée pour : ${mission.title}.`);
      return;
    }

    const nextFound = [...foundEvidenceIds, mission.id];
    setFoundEvidenceIds(nextFound);
    setEvidenceFeedback(`Preuve validée : ${mission.title} !`);

    if (nextFound.length === SNIFFER_MISSIONS.length && !xpAwarded) {
      playVictory();
      setXpAwarded(true);
      onCompleteChallenges?.();
    } else {
      playSuccess();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Overview Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-sky-700 dark:text-cyan-400">
              <span>Network Sniffer</span>
              <span aria-hidden="true">·</span>
              <span>Mini-Wireshark interactif</span>
              <span aria-hidden="true">·</span>
              <span>6 connexions réseau inspectables</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 text-balance">
              Simulateur Network Sniffer &amp; Capture de Trames
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Cliquez directement sur une connexion réseau dans le schéma ci-dessous pour y brancher
              une sonde virtuelle (TAP/SPAN). Les trames traversant ce câble s&apos;affichent en
              temps réel avec leur dissection couche par couche (Ethernet, IP, TCP/UDP, Application)
              et leur dump hexadécimal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums shrink-0 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
            <div>
              <div className="text-slate-500 dark:text-slate-400">Trames</div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                {frames.length}
              </div>
            </div>
            <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <div className="text-slate-500 dark:text-slate-400">Alertes / Clair</div>
              <div className="text-base font-bold text-rose-700 dark:text-rose-400">
                {anomalyCount}
              </div>
            </div>
            <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <div className="text-slate-500 dark:text-slate-400">Preuves (+100 XP)</div>
              <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                {foundEvidenceIds.length} / {SNIFFER_MISSIONS.length}
              </div>
            </div>
          </div>
        </div>

        {/* ZONE 1: Interactive Clickable Network Topology Simulator */}
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              1. Cliquez sur un câble réseau dans le simulateur pour démarrer la capture
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-slate-500 dark:text-slate-400">
              <span>
                Sonde active :{' '}
                <strong className="text-sky-700 dark:text-cyan-300">
                  {activeConnection ? `${activeConnection.label} (${activeConnection.iface})` : 'Aucune — cliquez sur un lien'}
                </strong>
              </span>
              {selectedLinkId && (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCapturing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  {isCapturing ? 'Capture active' : 'En pause'}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 p-3 sm:p-4 overflow-x-auto">
            <svg
              viewBox="0 0 860 345"
              className="w-full min-w-[680px] h-auto select-none"
              role="img"
              aria-label="Simulateur de topologie réseau avec connexions cliquables pour capturer les trames"
            >
              <defs>
                <pattern id="sniffer-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path
                    d="M 24 0 L 0 0 0 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.6"
                    className="text-slate-200 dark:text-slate-800/80"
                  />
                </pattern>
              </defs>

              <rect width="860" height="345" rx="10" fill="url(#sniffer-grid)" />

              {/* Subtle zone column captions */}
              <text x="92" y="24" textAnchor="middle" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono font-semibold">
                POSTES CLIENTS (LAN / ADMIN)
              </text>
              <text x="300" y="24" textAnchor="middle" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono font-semibold">
                CŒUR L3
              </text>
              <text x="525" y="24" textAnchor="middle" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono font-semibold">
                PARE-FEU
              </text>
              <text x="760" y="24" textAnchor="middle" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono font-semibold">
                DMZ · INTERNE · WAN
              </text>

              {/* Clickable Network Connections */}
              {SNIFFER_CONNECTIONS.map((conn) => {
                const a = nodesById[conn.from];
                const b = nodesById[conn.to];
                const isSelected = selectedLinkId === conn.id;
                const midX = (a.x + b.x) / 2;
                const midY = (a.y + b.y) / 2;
                const pathD = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
                const pathId = `sniffer-path-${conn.id}`;

                return (
                  <g
                    key={conn.id}
                    onClick={() => handleSelectConnection(conn.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectConnection(conn.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Capturer les trames sur la connexion ${conn.label} (${conn.iface})`}
                    className="cursor-pointer group focus:outline-none"
                  >
                    <path id={pathId} d={pathD} fill="none" />

                    {/* Wide transparent hit area for effortless clicking */}
                    <path d={pathD} fill="none" stroke="transparent" strokeWidth={26} />

                    {/* Outer glow when active */}
                    {isSelected && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={9}
                        strokeLinecap="round"
                        className="text-sky-500/25 dark:text-cyan-400/25"
                      />
                    )}

                    {/* Primary cable stroke */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={isSelected ? 3.5 : 2.5}
                      strokeDasharray={isSelected && isCapturing ? '8 5' : undefined}
                      className={
                        isSelected
                          ? 'text-sky-600 dark:text-cyan-400 transition-colors'
                          : 'text-slate-300 dark:text-slate-700 group-hover:text-sky-500 dark:group-hover:text-cyan-400 transition-colors'
                      }
                    />

                    {/* Animated traveling packet pulse on active link */}
                    {isSelected && isCapturing && (
                      <>
                        <circle r="4.5" className="fill-sky-600 dark:fill-cyan-300">
                          <animateMotion
                            dur={captureSpeed === 'fast' ? '1.1s' : captureSpeed === 'slow' ? '2.8s' : '1.8s'}
                            repeatCount="indefinite"
                          >
                            <mpath href={`#${pathId}`} />
                          </animateMotion>
                        </circle>
                        <circle r="3.5" className="fill-emerald-500 dark:fill-emerald-300">
                          <animateMotion
                            dur={captureSpeed === 'fast' ? '1.4s' : captureSpeed === 'slow' ? '3.4s' : '2.2s'}
                            begin="0.6s"
                            keyPoints="1;0"
                            keyTimes="0;1"
                            repeatCount="indefinite"
                          >
                            <mpath href={`#${pathId}`} />
                          </animateMotion>
                        </circle>
                      </>
                    )}

                    {/* Clickable TAP midpoint label */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-46"
                        y="-13"
                        width="92"
                        height="26"
                        rx="6"
                        className={
                          isSelected
                            ? 'fill-sky-700 dark:fill-cyan-500 stroke-sky-800 dark:stroke-cyan-300'
                            : 'fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700 group-hover:stroke-sky-500 dark:group-hover:stroke-cyan-400'
                        }
                        strokeWidth="1.25"
                      />
                      <text
                        y="3.5"
                        textAnchor="middle"
                        className={`text-[10px] font-mono font-bold ${
                          isSelected
                            ? 'fill-white dark:fill-slate-950'
                            : 'fill-slate-700 dark:fill-slate-200 group-hover:fill-sky-700 dark:group-hover:fill-cyan-300'
                        }`}
                      >
                        {isSelected ? `TAP · ${conn.iface.split(' ')[0]}` : conn.iface.split(' ')[0]}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Network Devices (Nodes) */}
              {SNIFFER_NODES.map((node) => {
                const isEndpointOfSelected =
                  activeConnection &&
                  (activeConnection.from === node.id || activeConnection.to === node.id);

                return (
                  <g key={node.id} transform={`translate(${node.x - 64}, ${node.y - 30})`}>
                    <rect
                      width="128"
                      height="60"
                      rx="10"
                      className={
                        isEndpointOfSelected
                          ? 'fill-white dark:fill-slate-900 stroke-sky-600 dark:stroke-cyan-400'
                          : 'fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700'
                      }
                      strokeWidth={isEndpointOfSelected ? '2' : '1.25'}
                    />
                    <foreignObject x="8" y="7" width="112" height="46">
                      <div className="flex flex-col justify-center h-full text-left">
                        <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                          <span
                            className={
                              isEndpointOfSelected
                                ? 'text-sky-600 dark:text-cyan-400 shrink-0'
                                : 'text-slate-500 dark:text-slate-400 shrink-0'
                            }
                          >
                            {renderNodeIcon(node.kind)}
                          </span>
                          <span className="text-[11px] font-bold truncate">{node.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {node.role}
                        </div>
                        <div className="text-[10px] font-mono text-sky-700 dark:text-cyan-300 truncate">
                          {node.ip}
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Accessible Quick-Select Connection Buttons (syncs with SVG click) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {SNIFFER_CONNECTIONS.map((conn) => {
              const active = selectedLinkId === conn.id;
              return (
                <button
                  key={conn.id}
                  type="button"
                  onClick={() => handleSelectConnection(conn.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border ${
                    active
                      ? 'bg-sky-700 dark:bg-cyan-500 text-white dark:text-slate-950 border-sky-700 dark:border-cyan-400'
                      : 'bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-cyan-500/60'
                  }`}
                >
                  <Radar className="w-3.5 h-3.5 shrink-0" />
                  {conn.label}
                </button>
              );
            })}
          </div>

          {activeConnection && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5">
              <span>{activeConnection.description}</span>
              <span className="font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {activeConnection.segment} · {activeConnection.vlan} · {activeConnection.bandwidth}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ZONE 2: Mini-Wireshark 3-Pane Capture Console */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {/* Capture Control Toolbar & Display Filter */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/70 dark:bg-slate-950/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!selectedLinkId}
                onClick={() => {
                  playClick();
                  setIsCapturing((prev) => !prev);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 ${
                  isCapturing
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-sky-700 hover:bg-sky-800 text-white'
                }`}
              >
                {isCapturing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isCapturing ? 'Mettre en pause' : 'Reprendre la capture'}
              </button>

              <button
                type="button"
                disabled={!selectedLinkId}
                onClick={handleStepFrame}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <StepForward className="w-3.5 h-3.5" />
                Capturer +1 trame
              </button>

              <button
                type="button"
                disabled={frames.length === 0}
                onClick={handleClearCapture}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Effacer
              </button>

              <button
                type="button"
                disabled={filteredFrames.length === 0}
                onClick={handleExportCaptureJson}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Exporter JSON
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={preserveAcrossLinks}
                  onChange={(e) => {
                    playClick();
                    setPreserveAcrossLinks(e.target.checked);
                  }}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                Conserver entre liens
              </label>

              <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800">
                {(
                  [
                    { id: 'slow', label: '0.5×' },
                    { id: 'normal', label: '1×' },
                    { id: 'fast', label: '2×' },
                  ] as const
                ).map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setCaptureSpeed(sp.id);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${
                      captureSpeed === sp.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Wireshark-style Display Filter Bar */}
          <div className="flex flex-col md:flex-row gap-2.5">
            <div className="relative flex-1">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={displayFilter}
                onChange={(e) => setDisplayFilter(e.target.value)}
                placeholder="Filtre d'affichage (ex. http, dns, ip.addr == 192.168.10.25, port == 8443, alert)..."
                aria-label="Filtre d'affichage Wireshark"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/90">
              {(
                [
                  { id: 'all', label: 'Tous' },
                  { id: 'HTTP', label: 'HTTP' },
                  { id: 'TLSv1.3', label: 'TLS/SSH' },
                  { id: 'DNS', label: 'DNS' },
                  { id: 'TCP', label: 'TCP' },
                  { id: 'ARP_ICMP', label: 'ARP/ICMP' },
                  { id: 'anomaly', label: 'Anomalies' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    playClick();
                    setQuickFilter(f.id);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    quickFilter === f.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-cyan-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pane 1: Packet List Table */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          {!selectedLinkId && frames.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Activity className="w-7 h-7 text-sky-600 dark:text-cyan-400 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Aucune connexion sélectionnée dans le simulateur
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Cliquez sur un câble réseau dans le schéma ci-dessus (par exemple{' '}
                <strong className="text-slate-700 dark:text-slate-200">PC-LAN ↔ SW-CORE</strong> ou{' '}
                <strong className="text-slate-700 dark:text-slate-200">FW-EDGE ↔ SRV-WEB</strong>)
                pour démarrer la capture des trames en direct.
              </p>
            </div>
          ) : filteredFrames.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Aucune trame ne correspond au filtre actif. Réinitialisez le filtre ou capturez une nouvelle trame.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-semibold w-12">N°</th>
                    <th className="px-3 py-2 font-semibold w-24">Temps (s)</th>
                    <th className="px-3 py-2 font-semibold">Source</th>
                    <th className="px-3 py-2 font-semibold">Destination</th>
                    <th className="px-3 py-2 font-semibold w-24">Protocole</th>
                    <th className="px-3 py-2 font-semibold w-16">Long.</th>
                    <th className="px-3 py-2 font-semibold w-20">État</th>
                    <th className="px-3 py-2 font-semibold">Info trame</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredFrames.map((frame) => {
                    const isSelected = selectedFrame?.captureNo === frame.captureNo;
                    const clsMeta = getClassificationLabel(frame.classification);
                    return (
                      <tr
                        key={frame.captureNo}
                        onClick={() => {
                          playClick();
                          setSelectedCaptureNo(frame.captureNo);
                          setShowStreamModal(false);
                          setEvidenceFeedback(null);
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-100/90 dark:bg-cyan-950/60 text-slate-950 dark:text-white'
                            : frame.classification === 'anomaly'
                              ? 'bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-800 dark:text-slate-200'
                              : frame.classification === 'cleartext'
                                ? 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-200'
                                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{frame.captureNo}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                          {frame.timestampSec.toFixed(4)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {frame.srcIp}
                          {frame.srcPort ? `:${frame.srcPort}` : ''}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {frame.dstIp}
                          {frame.dstPort ? `:${frame.dstPort}` : ''}
                        </td>
                        <td className={`px-3 py-2 whitespace-nowrap ${getProtocolTextClass(frame.protocol, frame.classification)}`}>
                          {frame.protocol}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{frame.length}</td>
                        <td className={`px-3 py-2 whitespace-nowrap font-sans font-semibold ${clsMeta.className}`}>
                          {clsMeta.label}
                        </td>
                        <td className="px-3 py-2 max-w-md truncate">{frame.info}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panes 2 & 3: Layer Dissector Tree + Synchronized Hex/ASCII Byte Dump */}
        {selectedFrame && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            {/* Pane 2: Protocol Dissector */}
            <div className="lg:col-span-7 p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <Layers className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                  Dissection de la trame #{selectedFrame.captureNo} ({selectedFrame.protocol})
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedFrame.streamTranscript && (
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setShowStreamModal((prev) => !prev);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 whitespace-nowrap shrink-0"
                    >
                      <FileCode2 className="w-3.5 h-3.5" />
                      {showStreamModal ? 'Masquer le flux' : 'Suivre le flux'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleMarkEvidence}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Marquer comme preuve
                  </button>
                </div>
              </div>

              {/* Contextual Analyst Callout */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-3.5 flex items-start gap-2.5 text-xs">
                {selectedFrame.classification === 'anomaly' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                ) : selectedFrame.classification === 'cleartext' ? (
                  <Unlock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                )}
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-slate-100">Note d&apos;analyse :</strong>{' '}
                  {selectedFrame.analystNote}
                </p>
              </div>

              {evidenceFeedback && (
                <div className="rounded-xl border border-sky-200 dark:border-cyan-800 bg-sky-50/70 dark:bg-cyan-950/30 px-3.5 py-2.5 text-xs font-semibold text-sky-900 dark:text-cyan-200">
                  {evidenceFeedback}
                </div>
              )}

              {/* Optional Reconstructed Follow Stream View */}
              {showStreamModal && selectedFrame.streamTranscript && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 text-slate-100 p-3.5 space-y-2">
                  <div className="text-[11px] font-mono text-cyan-400 font-semibold">
                    Flux applicatif reconstruit (Follow Stream)
                  </div>
                  <pre className="font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap text-slate-200">
                    {selectedFrame.streamTranscript.join('\n')}
                  </pre>
                </div>
              )}

              {/* Expandable Layer Tree */}
              <div className="space-y-1.5">
                {LAYER_ORDER.map((layerKey) => {
                  const layer = selectedFrame.layers[layerKey];
                  const isOpen = expandedLayers[layerKey];
                  const isHighlighted = layerKey !== 'l1' && highlightedLayer === layerKey;
                  return (
                    <div
                      key={layerKey}
                      className={`rounded-lg border transition-colors ${
                        isHighlighted
                          ? 'border-sky-400 dark:border-cyan-500/70 bg-sky-50/40 dark:bg-cyan-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleLayer(layerKey)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-900 dark:text-slate-100"
                      >
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          {isOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span className="truncate">{layer.title}</span>
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                          {layerKey.toUpperCase()}
                        </span>
                      </button>

                      {isOpen && (
                        <ul className="px-7 pb-2.5 space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {layer.fields.map((field) => (
                            <li key={field} className="leading-relaxed break-words">
                              {field}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pane 3: Synchronized Hex + ASCII Dump */}
            <div className="lg:col-span-5 p-4 sm:p-5 space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <Binary className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                  Octets bruts (Hexadécimal &amp; ASCII)
                </div>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedFrame.length} octets
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>Cliquez une couche pour surligner :</span>
                {(['l2', 'l3', 'l4', 'l7'] as const).map((lk) => (
                  <button
                    key={lk}
                    type="button"
                    onClick={() => {
                      playClick();
                      setHighlightedLayer(lk);
                    }}
                    className={`px-2 py-0.5 rounded border text-[11px] font-semibold transition-colors ${
                      highlightedLayer === lk
                        ? 'border-sky-500 dark:border-cyan-400 bg-sky-100 dark:bg-cyan-950 text-sky-900 dark:text-cyan-200'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lk.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 font-mono text-[11px] tabular-nums overflow-x-auto space-y-1">
                <div className="grid grid-cols-[44px_1fr_112px] gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <span>Off.</span>
                  <span>Hexadécimal</span>
                  <span>ASCII</span>
                </div>
                {selectedFrame.hexRows.map((row) => {
                  const activeRow = highlightedLayer === row.layer;
                  return (
                    <div
                      key={`${selectedFrame.captureNo}-${row.offset}`}
                      onClick={() => setHighlightedLayer(row.layer)}
                      className={`grid grid-cols-[44px_1fr_112px] gap-2 px-1.5 py-1 rounded cursor-pointer transition-colors ${
                        activeRow
                          ? LAYER_HIGHLIGHT_CLASSES[row.layer]
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-slate-400">{row.offset}</span>
                      <span className="whitespace-pre">{row.hex}</span>
                      <span className="whitespace-pre truncate">{row.ascii}</span>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Les octets de couche L2 (Ethernet), L3 (IPv4), L4 (TCP/UDP) et L7 (Application)
                sont synchronisés avec l&apos;arbre de dissection à gauche.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ZONE 3: Guided Sniffer Investigation Missions (+100 XP) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="space-y-0.5">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Missions d&apos;investigation réseau ({foundEvidenceIds.length}/{SNIFFER_MISSIONS.length})
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Branchez la sonde sur la bonne connexion, identifiez la trame malveillante ou
              vulnérable, puis cliquez sur « Marquer comme preuve » pour gagner +100 XP.
            </p>
          </div>
          {xpAwarded && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Toutes les preuves validées (+100 XP)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {SNIFFER_MISSIONS.map((m) => {
            const done = foundEvidenceIds.includes(m.id);
            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border space-y-2 transition-colors ${
                  done
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {m.title}
                  </div>
                  {done ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Validée
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectConnection(m.targetLinkId)}
                      className="text-xs font-semibold text-sky-700 dark:text-cyan-400 hover:underline whitespace-nowrap shrink-0"
                    >
                      Sonder {m.targetLinkName}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {m.objective}
                </p>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Indice : {m.hint}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
