import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Cpu,
  Globe,
  Laptop,
  Play,
  Plus,
  Power,
  RotateCcw,
  Router,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SkipForward,
  Trash2,
  XCircle,
} from 'lucide-react';
import { playClick, playError, playPacket, playSuccess, playVictory } from '../../utils/sound';

type NodeId =
  | 'pc-lan'
  | 'pc-admin'
  | 'rtr-core'
  | 'fw-edge'
  | 'srv-web'
  | 'srv-db'
  | 'ext-client';

type ZoneId = 'LAN' | 'ADMIN' | 'DMZ' | 'INTERNE' | 'WAN' | 'ANY';
type ProtocolType = 'TCP' | 'UDP' | 'ICMP';
type RuleAction = 'ALLOW' | 'DENY';

interface TopologyNode {
  id: NodeId;
  name: string;
  role: string;
  ip: string;
  zone: Exclude<ZoneId, 'ANY'>;
  kind: 'host' | 'router' | 'firewall' | 'server' | 'wan';
  x: number;
  y: number;
  online: boolean;
}

interface RouteEntry {
  id: string;
  destination: string;
  zone: Exclude<ZoneId, 'ANY'>;
  nextHop: string;
  iface: string;
  metric: number;
  enabled: boolean;
}

interface FirewallRule {
  id: string;
  name: string;
  srcZone: ZoneId;
  dstZone: ZoneId;
  protocol: ProtocolType | 'ANY';
  port: number | 'ANY';
  action: RuleAction;
  enabled: boolean;
}

interface ServerService {
  port: number;
  protocol: ProtocolType;
  name: string;
  enabled: boolean;
}

interface PacketSpec {
  srcId: 'pc-lan' | 'pc-admin' | 'ext-client';
  dstId: 'srv-web' | 'srv-db' | 'pc-lan';
  protocol: ProtocolType;
  port: number;
  ttl: number;
}

interface TraceHop {
  nodeId: NodeId;
  nodeName: string;
  layer: string;
  headerSummary: string;
  ttlAfter: number;
  status: 'ok' | 'warn' | 'blocked';
  decision: string;
  detail: string;
  latencyMs: number;
}

interface PacketEvalResult {
  delivered: boolean;
  path: NodeId[];
  hops: TraceHop[];
  matchedRuleId: string | null;
  totalLatencyMs: number;
  verdict: string;
}

interface InteractiveTopologyLabProps {
  onCompleteChallenges?: () => void;
}

const INITIAL_NODES: TopologyNode[] = [
  {
    id: 'pc-lan',
    name: 'PC-LAN-01',
    role: 'Poste Utilisateur',
    ip: '192.168.10.25',
    zone: 'LAN',
    kind: 'host',
    x: 110,
    y: 115,
    online: true,
  },
  {
    id: 'pc-admin',
    name: 'PC-ADMIN-02',
    role: 'Poste Admin IT',
    ip: '192.168.20.10',
    zone: 'ADMIN',
    kind: 'host',
    x: 110,
    y: 285,
    online: true,
  },
  {
    id: 'rtr-core',
    name: 'RTR-CORE-01',
    role: 'Routeur Cœur L3',
    ip: '192.168.10.1',
    zone: 'LAN',
    kind: 'router',
    x: 310,
    y: 200,
    online: true,
  },
  {
    id: 'fw-edge',
    name: 'FW-EDGE-01',
    role: 'Pare-feu Stateful',
    ip: '172.16.0.1',
    zone: 'DMZ',
    kind: 'firewall',
    x: 520,
    y: 200,
    online: true,
  },
  {
    id: 'srv-web',
    name: 'SRV-WEB-DMZ',
    role: 'Serveur Web Nginx',
    ip: '172.16.50.10',
    zone: 'DMZ',
    kind: 'server',
    x: 745,
    y: 95,
    online: true,
  },
  {
    id: 'srv-db',
    name: 'SRV-DB-INT',
    role: 'BDD PostgreSQL / AD',
    ip: '10.0.100.20',
    zone: 'INTERNE',
    kind: 'server',
    x: 745,
    y: 295,
    online: true,
  },
  {
    id: 'ext-client',
    name: 'EXT-CLIENT',
    role: 'Internet / Externe',
    ip: '203.0.113.45',
    zone: 'WAN',
    kind: 'wan',
    x: 520,
    y: 55,
    online: true,
  },
];

const INITIAL_ROUTES: RouteEntry[] = [
  {
    id: 'rt-lan',
    destination: '192.168.10.0/24',
    zone: 'LAN',
    nextHop: 'Direct (eth0)',
    iface: 'eth0',
    metric: 1,
    enabled: true,
  },
  {
    id: 'rt-admin',
    destination: '192.168.20.0/24',
    zone: 'ADMIN',
    nextHop: 'Direct (eth1)',
    iface: 'eth1',
    metric: 1,
    enabled: true,
  },
  {
    id: 'rt-dmz',
    destination: '172.16.50.0/24',
    zone: 'DMZ',
    nextHop: '172.16.0.1 (FW-EDGE-01)',
    iface: 'eth2',
    metric: 10,
    enabled: true,
  },
  {
    id: 'rt-int',
    destination: '10.0.100.0/24',
    zone: 'INTERNE',
    nextHop: '172.16.0.1 (FW-EDGE-01)',
    iface: 'eth2',
    metric: 10,
    enabled: true,
  },
  {
    id: 'rt-wan',
    destination: '0.0.0.0/0',
    zone: 'WAN',
    nextHop: '172.16.0.1 (Passerelle WAN)',
    iface: 'eth3',
    metric: 20,
    enabled: true,
  },
];

const INITIAL_FW_RULES: FirewallRule[] = [
  {
    id: 'R1',
    name: 'Autoriser HTTPS LAN -> DMZ',
    srcZone: 'LAN',
    dstZone: 'DMZ',
    protocol: 'TCP',
    port: 443,
    action: 'ALLOW',
    enabled: true,
  },
  {
    id: 'R2',
    name: 'Bloquer Telnet en clair (Port 23)',
    srcZone: 'ANY',
    dstZone: 'ANY',
    protocol: 'TCP',
    port: 23,
    action: 'DENY',
    enabled: false,
  },
  {
    id: 'R3',
    name: 'Accès temporaire SQL ouvert (À auditer !)',
    srcZone: 'LAN',
    dstZone: 'INTERNE',
    protocol: 'TCP',
    port: 5432,
    action: 'ALLOW',
    enabled: true,
  },
  {
    id: 'R4',
    name: 'Publier HTTPS Internet -> Web DMZ',
    srcZone: 'WAN',
    dstZone: 'DMZ',
    protocol: 'TCP',
    port: 443,
    action: 'ALLOW',
    enabled: false,
  },
  {
    id: 'R5',
    name: 'Administration SSH Admin -> BDD Interne',
    srcZone: 'ADMIN',
    dstZone: 'INTERNE',
    protocol: 'TCP',
    port: 22,
    action: 'ALLOW',
    enabled: false,
  },
];

const INITIAL_SERVICES: Record<'srv-web' | 'srv-db', ServerService[]> = {
  'srv-web': [
    { port: 443, protocol: 'TCP', name: 'Nginx HTTPS (TLS 1.3)', enabled: true },
    { port: 80, protocol: 'TCP', name: 'Nginx HTTP (Redirection)', enabled: true },
    { port: 22, protocol: 'TCP', name: 'OpenSSH Admin', enabled: false },
  ],
  'srv-db': [
    { port: 5432, protocol: 'TCP', name: 'PostgreSQL 16', enabled: true },
    { port: 22, protocol: 'TCP', name: 'OpenSSH Admin', enabled: true },
    { port: 445, protocol: 'TCP', name: 'SMB / Active Directory', enabled: true },
    { port: 53, protocol: 'UDP', name: 'DNS Interne', enabled: true },
  ],
};

const EDGES: [NodeId, NodeId, string][] = [
  ['pc-lan', 'rtr-core', 'VLAN 10'],
  ['pc-admin', 'rtr-core', 'VLAN 20'],
  ['rtr-core', 'fw-edge', 'Trunk L3'],
  ['ext-client', 'fw-edge', 'WAN Public'],
  ['fw-edge', 'srv-web', 'DMZ'],
  ['fw-edge', 'srv-db', 'Zone Interne'],
];

const PORT_PRESETS: { label: string; protocol: ProtocolType; port: number }[] = [
  { label: 'HTTPS (443)', protocol: 'TCP', port: 443 },
  { label: 'HTTP (80)', protocol: 'TCP', port: 80 },
  { label: 'SSH (22)', protocol: 'TCP', port: 22 },
  { label: 'PostgreSQL (5432)', protocol: 'TCP', port: 5432 },
  { label: 'SMB (445)', protocol: 'TCP', port: 445 },
  { label: 'DNS (53)', protocol: 'UDP', port: 53 },
  { label: 'Telnet (23)', protocol: 'TCP', port: 23 },
  { label: 'Ping ICMP', protocol: 'ICMP', port: 0 },
];

function evaluatePacketFlow(
  packet: PacketSpec,
  nodes: TopologyNode[],
  routes: RouteEntry[],
  natEnabled: boolean,
  fwRules: FirewallRule[],
  defaultPolicy: RuleAction,
  services: Record<'srv-web' | 'srv-db', ServerService[]>
): PacketEvalResult {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n])) as Record<NodeId, TopologyNode>;
  const src = byId[packet.srcId];
  const dst = byId[packet.dstId];
  const rtr = byId['rtr-core'];
  const fw = byId['fw-edge'];

  const hops: TraceHop[] = [];
  const path: NodeId[] = [src.id];
  let ttl = Math.max(1, packet.ttl);
  let matchedRuleId: string | null = null;
  let effectiveSrcIp = src.ip;

  if (!src.online) {
    hops.push({
      nodeId: src.id,
      nodeName: src.name,
      layer: 'L1/L2',
      headerSummary: `${src.ip} -> ${dst.ip}:${packet.port}`,
      ttlAfter: ttl,
      status: 'blocked',
      decision: 'Hôte source hors ligne',
      detail: `${src.name} est éteint : aucun paquet n’est émis sur l’interface réseau.`,
      latencyMs: 0,
    });
    return {
      delivered: false,
      path,
      hops,
      matchedRuleId: null,
      totalLatencyMs: 0,
      verdict: `Échec : ${src.name} est hors tension.`,
    };
  }

  hops.push({
    nodeId: src.id,
    nodeName: src.name,
    layer: 'L3/L4',
    headerSummary: `${src.ip} -> ${dst.ip} (${packet.protocol}${packet.protocol !== 'ICMP' ? `/${packet.port}` : ''})`,
    ttlAfter: ttl,
    status: 'ok',
    decision: 'Paquet émis',
    detail: `${src.name} encapsule un paquet ${packet.protocol} vers ${dst.name} (${dst.ip}) avec TTL=${ttl}.`,
    latencyMs: 1,
  });

  // Step 2: If source is LAN or ADMIN, packet must traverse RTR-CORE-01 first
  const needsRouter = src.id === 'pc-lan' || src.id === 'pc-admin';
  if (needsRouter) {
    path.push('rtr-core');
    if (!rtr.online) {
      hops.push({
        nodeId: 'rtr-core',
        nodeName: rtr.name,
        layer: 'L3',
        headerSummary: `${effectiveSrcIp} -> ${dst.ip}`,
        ttlAfter: ttl,
        status: 'blocked',
        decision: 'Routeur hors ligne',
        detail: 'RTR-CORE-01 est éteint : impossible de joindre la passerelle par défaut.',
        latencyMs: 4,
      });
      return {
        delivered: false,
        path,
        hops,
        matchedRuleId: null,
        totalLatencyMs: 5,
        verdict: 'Paquet perdu : RTR-CORE-01 est hors ligne.',
      };
    }

    ttl -= 1;
    if (ttl <= 0) {
      hops.push({
        nodeId: 'rtr-core',
        nodeName: rtr.name,
        layer: 'L3',
        headerSummary: `${effectiveSrcIp} -> ${dst.ip}`,
        ttlAfter: 0,
        status: 'blocked',
        decision: 'ICMP Time Exceeded (TTL=0)',
        detail:
          'Le routeur a décrémenté le TTL à 0 et détruit le paquet pour éviter une boucle de routage.',
        latencyMs: 3,
      });
      return {
        delivered: false,
        path,
        hops,
        matchedRuleId: null,
        totalLatencyMs: 4,
        verdict: 'Paquet rejeté sur RTR-CORE-01 : TTL expiré (0).',
      };
    }

    const matchingRoute = routes.find((rt) => rt.enabled && rt.zone === dst.zone);
    if (!matchingRoute) {
      hops.push({
        nodeId: 'rtr-core',
        nodeName: rtr.name,
        layer: 'L3',
        headerSummary: `${effectiveSrcIp} -> ${dst.ip}`,
        ttlAfter: ttl,
        status: 'blocked',
        decision: 'No Route to Host',
        detail: `Aucune route active dans la table de routage vers la zone ${dst.zone} (${dst.ip}). Réactivez la route dans RTR-CORE-01.`,
        latencyMs: 3,
      });
      return {
        delivered: false,
        path,
        hops,
        matchedRuleId: null,
        totalLatencyMs: 4,
        verdict: `Échec routage : aucune route active vers ${dst.zone}.`,
      };
    }

    if (natEnabled && dst.zone === 'WAN') {
      effectiveSrcIp = '198.51.100.1 (NAT)';
    }

    hops.push({
      nodeId: 'rtr-core',
      nodeName: rtr.name,
      layer: 'L3',
      headerSummary: `${effectiveSrcIp} -> ${dst.ip} via ${matchingRoute.iface}`,
      ttlAfter: ttl,
      status: 'ok',
      decision: `Routé (${matchingRoute.destination})`,
      detail: `Route trouvée vers ${matchingRoute.destination} via ${matchingRoute.nextHop} (métrique ${matchingRoute.metric}).${
        natEnabled ? ' NAT/PAT actif si sortie WAN.' : ''
      }`,
      latencyMs: 3,
    });
  }

  // Step 3: Firewall evaluation (except pure LAN->LAN)
  const needsFirewall = !(src.zone === 'LAN' && dst.zone === 'LAN');
  if (needsFirewall) {
    path.push('fw-edge');
    if (!fw.online) {
      hops.push({
        nodeId: 'fw-edge',
        nodeName: fw.name,
        layer: 'L3/L4',
        headerSummary: `${effectiveSrcIp} -> ${dst.ip}`,
        ttlAfter: ttl,
        status: 'blocked',
        decision: 'Pare-feu hors ligne (Fail-Closed)',
        detail: 'FW-EDGE-01 est éteint : le trafic inter-zones est interrompu.',
        latencyMs: 4,
      });
      return {
        delivered: false,
        path,
        hops,
        matchedRuleId: null,
        totalLatencyMs: hops.reduce((a, h) => a + h.latencyMs, 0),
        verdict: 'Flux coupé : FW-EDGE-01 est hors ligne.',
      };
    }

    ttl -= 1;
    if (ttl <= 0) {
      hops.push({
        nodeId: 'fw-edge',
        nodeName: fw.name,
        layer: 'L3',
        headerSummary: `${effectiveSrcIp} -> ${dst.ip}`,
        ttlAfter: 0,
        status: 'blocked',
        decision: 'ICMP Time Exceeded (TTL=0)',
        detail: 'Le TTL a atteint 0 au passage de FW-EDGE-01. Augmentez le TTL initial (ex. 64).',
        latencyMs: 3,
      });
      return {
        delivered: false,
        path,
        hops,
        matchedRuleId: null,
        totalLatencyMs: hops.reduce((a, h) => a + h.latencyMs, 0),
        verdict: 'Paquet rejeté sur FW-EDGE-01 : TTL expiré.',
      };
    }

    // First-match top-to-bottom ACL evaluation
    const matched = fwRules.find((rule) => {
      if (!rule.enabled) return false;
      const srcOk = rule.srcZone === 'ANY' || rule.srcZone === src.zone;
      const dstOk = rule.dstZone === 'ANY' || rule.dstZone === dst.zone;
      const protoOk = rule.protocol === 'ANY' || rule.protocol === packet.protocol;
      const portOk =
        rule.port === 'ANY' || packet.protocol === 'ICMP' || rule.port === packet.port;
      return srcOk && dstOk && protoOk && portOk;
    });

    const finalAction: RuleAction = matched ? matched.action : defaultPolicy;
    matchedRuleId = matched ? matched.id : 'DEFAULT';

    if (finalAction === 'DENY') {
      hops.push({
        nodeId: 'fw-edge',
        nodeName: fw.name,
        layer: 'L4 ACL',
        headerSummary: `${src.zone} -> ${dst.zone} · ${packet.protocol}/${packet.port}`,
        ttlAfter: ttl,
        status: 'blocked',
        decision: matched ? `BLOQUÉ par règle ${matched.id}` : 'BLOQUÉ par DEFAULT DENY',
        detail: matched
          ? `Règle ${matched.id} (« ${matched.name} ») a rejeté le flux ${src.zone} → ${dst.zone} (${packet.protocol}/${packet.port}).`
          : `Aucune règle ALLOW ne correspondait : la politique par défaut (${defaultPolicy}) a détruit le paquet.`,
        latencyMs: 2,
      });
      return {
        delivered: false,
        path,
        hops,
        matchedRuleId,
        totalLatencyMs: hops.reduce((a, h) => a + h.latencyMs, 0),
        verdict: matched
          ? `Bloqué par FW-EDGE-01 (règle ${matched.id} : ${matched.name}).`
          : 'Bloqué par FW-EDGE-01 (politique DEFAULT DENY).',
      };
    }

    hops.push({
      nodeId: 'fw-edge',
      nodeName: fw.name,
      layer: 'L4 ACL',
      headerSummary: `${src.zone} -> ${dst.zone} · ${packet.protocol}/${packet.port}`,
      ttlAfter: ttl,
      status: matched ? 'ok' : 'warn',
      decision: matched ? `AUTORISÉ (${matched.id})` : 'AUTORISÉ (DEFAULT ALLOW)',
      detail: matched
        ? `Règle ${matched.id} (« ${matched.name} ») autorise la session stateful vers ${dst.name}.`
        : `Attention : le paquet est passé uniquement parce que la politique par défaut est DEFAULT ALLOW !`,
      latencyMs: 2,
    });
  }

  // If destination is PC-LAN from EXT-CLIENT, route back through RTR-CORE-01
  if (src.id === 'ext-client' && dst.id === 'pc-lan') {
    path.push('rtr-core');
    if (!rtr.online || !routes.some((rt) => rt.enabled && rt.zone === 'LAN')) {
      hops.push({
        nodeId: 'rtr-core',
        nodeName: rtr.name,
        layer: 'L3',
        headerSummary: `${effectiveSrcIp} -> ${dst.ip}`,
        ttlAfter: ttl,
        status: 'blocked',
        decision: 'Route LAN absente / Routeur KO',
        detail: 'Impossible d’acheminer le paquet vers le VLAN LAN 192.168.10.0/24.',
        latencyMs: 3,
      });
      return {
        delivered: false,
        path,
        hops,
        matchedRuleId,
        totalLatencyMs: hops.reduce((a, h) => a + h.latencyMs, 0),
        verdict: 'Échec routage retour vers PC-LAN-01.',
      };
    }
    hops.push({
      nodeId: 'rtr-core',
      nodeName: rtr.name,
      layer: 'L3',
      headerSummary: `${effectiveSrcIp} -> ${dst.ip}`,
      ttlAfter: Math.max(1, ttl - 1),
      status: 'ok',
      decision: 'Routé vers LAN',
      detail: 'RTR-CORE-01 transmet la trame sur eth0 vers 192.168.10.25.',
      latencyMs: 2,
    });
  }

  // Step 4: Destination server / host check
  path.push(dst.id);
  if (!dst.online) {
    hops.push({
      nodeId: dst.id,
      nodeName: dst.name,
      layer: 'L4/L7',
      headerSummary: `${effectiveSrcIp} -> ${dst.ip}:${packet.port}`,
      ttlAfter: ttl,
      status: 'blocked',
      decision: 'Serveur cible hors ligne',
      detail: `${dst.name} est éteint : aucune réponse SYN-ACK / ICMP Echo Reply.`,
      latencyMs: 12,
    });
    return {
      delivered: false,
      path,
      hops,
      matchedRuleId,
      totalLatencyMs: hops.reduce((a, h) => a + h.latencyMs, 0),
      verdict: `Timeout : ${dst.name} est hors tension.`,
    };
  }

  if ((dst.id === 'srv-web' || dst.id === 'srv-db') && packet.protocol !== 'ICMP') {
    const serverServices = services[dst.id];
    const listening = serverServices.find(
      (s) => s.enabled && s.port === packet.port && s.protocol === packet.protocol
    );
    if (!listening) {
      hops.push({
        nodeId: dst.id,
        nodeName: dst.name,
        layer: 'L4',
        headerSummary: `${effectiveSrcIp} -> ${dst.ip}:${packet.port}`,
        ttlAfter: ttl,
        status: 'blocked',
        decision: `TCP RST · Port ${packet.port} fermé`,
        detail: `${dst.name} est joignable mais aucun service n’écoute sur ${packet.protocol}/${packet.port}. Activez le service dans l’inspecteur du serveur.`,
        latencyMs: 4,
      });
      return {
        delivered: false,
        path,
        hops,
        matchedRuleId,
        totalLatencyMs: hops.reduce((a, h) => a + h.latencyMs, 0),
        verdict: `Connexion refusée : le port ${packet.protocol}/${packet.port} est fermé sur ${dst.name}.`,
      };
    }

    hops.push({
      nodeId: dst.id,
      nodeName: dst.name,
      layer: 'L7',
      headerSummary: `${effectiveSrcIp} <-> ${dst.ip}:${packet.port}`,
      ttlAfter: ttl,
      status: 'ok',
      decision: `200 / SYN-ACK (${listening.name})`,
      detail: `Le service « ${listening.name} » répond correctement à la requête.`,
      latencyMs: 5,
    });
  } else {
    hops.push({
      nodeId: dst.id,
      nodeName: dst.name,
      layer: 'L3/L7',
      headerSummary: `${effectiveSrcIp} <-> ${dst.ip}`,
      ttlAfter: ttl,
      status: 'ok',
      decision: packet.protocol === 'ICMP' ? 'ICMP Echo Reply' : 'Paquet livré',
      detail: `${dst.name} reçoit et acquitte le flux avec succès.`,
      latencyMs: 4,
    });
  }

  const totalLatencyMs = hops.reduce((acc, h) => acc + h.latencyMs, 0);
  return {
    delivered: true,
    path,
    hops,
    matchedRuleId,
    totalLatencyMs,
    verdict: `Paquet livré à ${dst.name} en ${totalLatencyMs} ms (${hops.length - 1} sauts).`,
  };
}

export const InteractiveTopologyLab: React.FC<InteractiveTopologyLabProps> = ({
  onCompleteChallenges,
}) => {
  const [nodes, setNodes] = useState<TopologyNode[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId>('fw-edge');
  const [routes, setRoutes] = useState<RouteEntry[]>(INITIAL_ROUTES);
  const [natEnabled, setNatEnabled] = useState<boolean>(true);
  const [fwRules, setFwRules] = useState<FirewallRule[]>(INITIAL_FW_RULES);
  const [defaultPolicy, setDefaultPolicy] = useState<RuleAction>('ALLOW');
  const [services, setServices] = useState<Record<'srv-web' | 'srv-db', ServerService[]>>(
    INITIAL_SERVICES
  );

  // Packet injector state
  const [packet, setPacket] = useState<PacketSpec>({
    srcId: 'pc-lan',
    dstId: 'srv-web',
    protocol: 'TCP',
    port: 443,
    ttl: 64,
  });

  // Live trace playback state
  const [activeHopIndex, setActiveHopIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  // New Firewall rule quick form
  const [newRuleSrc, setNewRuleSrc] = useState<ZoneId>('WAN');
  const [newRuleDst, setNewRuleDst] = useState<ZoneId>('DMZ');
  const [newRuleProto, setNewRuleProto] = useState<ProtocolType | 'ANY'>('TCP');
  const [newRulePort, setNewRulePort] = useState<string>('443');
  const [newRuleAction, setNewRuleAction] = useState<RuleAction>('ALLOW');

  // Lightweight pointer drag on SVG canvas
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<NodeId | null>(null);

  const evaluation = useMemo(
    () =>
      evaluatePacketFlow(packet, nodes, routes, natEnabled, fwRules, defaultPolicy, services),
    [packet, nodes, routes, natEnabled, fwRules, defaultPolicy, services]
  );

  // Playback interval for smooth hop-by-hop packet trace (zero 3D loop!)
  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setActiveHopIndex((prev) => {
        const next = prev + 1;
        if (next >= evaluation.hops.length) {
          setIsPlaying(false);
          if (evaluation.delivered) {
            playSuccess();
          } else {
            playError();
          }
          return evaluation.hops.length - 1;
        }
        playPacket();
        return next;
      });
    }, 520);
    return () => window.clearInterval(id);
  }, [isPlaying, evaluation.hops.length, evaluation.delivered]);

  // Live validation of the 4 operational network engineering challenges
  const challenges = useMemo(() => {
    const extToWeb443 = evaluatePacketFlow(
      { srcId: 'ext-client', dstId: 'srv-web', protocol: 'TCP', port: 443, ttl: 64 },
      nodes,
      routes,
      natEnabled,
      fwRules,
      defaultPolicy,
      services
    );
    const extToDb5432 = evaluatePacketFlow(
      { srcId: 'ext-client', dstId: 'srv-db', protocol: 'TCP', port: 5432, ttl: 64 },
      nodes,
      routes,
      natEnabled,
      fwRules,
      defaultPolicy,
      services
    );
    const lanToDb5432 = evaluatePacketFlow(
      { srcId: 'pc-lan', dstId: 'srv-db', protocol: 'TCP', port: 5432, ttl: 64 },
      nodes,
      routes,
      natEnabled,
      fwRules,
      defaultPolicy,
      services
    );
    const adminToDbSsh = evaluatePacketFlow(
      { srcId: 'pc-admin', dstId: 'srv-db', protocol: 'TCP', port: 22, ttl: 64 },
      nodes,
      routes,
      natEnabled,
      fwRules,
      defaultPolicy,
      services
    );
    const lanToWeb443 = evaluatePacketFlow(
      { srcId: 'pc-lan', dstId: 'srv-web', protocol: 'TCP', port: 443, ttl: 64 },
      nodes,
      routes,
      natEnabled,
      fwRules,
      defaultPolicy,
      services
    );
    const lanTelnet = evaluatePacketFlow(
      { srcId: 'pc-lan', dstId: 'srv-web', protocol: 'TCP', port: 23, ttl: 64 },
      nodes,
      routes,
      natEnabled,
      fwRules,
      defaultPolicy,
      services
    );

    return [
      {
        id: 'c1',
        title: '1. Publier HTTPS en DMZ',
        detail: 'EXT-CLIENT → SRV-WEB-DMZ:443 livré (règle FW + service Nginx 443 actif).',
        done: extToWeb443.delivered,
      },
      {
        id: 'c2',
        title: '2. Cloisonner la BDD PostgreSQL (5432)',
        detail: 'Bloquer SQL 5432 depuis Internet ET depuis PC-LAN-01 sur FW-EDGE-01.',
        done: !extToDb5432.delivered && !lanToDb5432.delivered,
      },
      {
        id: 'c3',
        title: '3. Ouvrir SSH uniquement pour Admin',
        detail: 'PC-ADMIN-02 → SRV-DB-INT:22 autorisé (route 10.0.100.0/24 + règle FW + OpenSSH).',
        done: adminToDbSsh.delivered,
      },
      {
        id: 'c4',
        title: '4. Durcir en DEFAULT DENY + Bloquer Telnet',
        detail: 'Politique par défaut DENY, Telnet (23) bloqué, LAN → DMZ:443 maintenu.',
        done: defaultPolicy === 'DENY' && !lanTelnet.delivered && lanToWeb443.delivered,
      },
    ];
  }, [nodes, routes, natEnabled, fwRules, defaultPolicy, services]);

  const completedChallengesCount = challenges.filter((c) => c.done).length;

  useEffect(() => {
    if (completedChallengesCount === challenges.length && !rewardClaimed) {
      setRewardClaimed(true);
      playVictory();
      onCompleteChallenges?.();
    }
  }, [completedChallengesCount, challenges.length, rewardClaimed, onCompleteChallenges]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? nodes[0];

  const handleSendPacket = () => {
    playPacket();
    setActiveHopIndex(0);
    setIsPlaying(true);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    playPacket();
    setActiveHopIndex((prev) => {
      const next = prev + 1;
      if (next >= evaluation.hops.length) return 0;
      return next;
    });
  };

  const handleResetAll = () => {
    playClick();
    setNodes(INITIAL_NODES);
    setRoutes(INITIAL_ROUTES);
    setNatEnabled(true);
    setFwRules(INITIAL_FW_RULES);
    setDefaultPolicy('ALLOW');
    setServices(INITIAL_SERVICES);
    setActiveHopIndex(-1);
    setIsPlaying(false);
  };

  const toggleNodePower = (id: NodeId) => {
    playClick();
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, online: !n.online } : n)));
    setActiveHopIndex(-1);
    setIsPlaying(false);
  };

  const toggleRoute = (routeId: string) => {
    playClick();
    setRoutes((prev) =>
      prev.map((r) => (r.id === routeId ? { ...r, enabled: !r.enabled } : r))
    );
    setActiveHopIndex(-1);
    setIsPlaying(false);
  };

  const toggleFwRule = (ruleId: string) => {
    playClick();
    setFwRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
    setActiveHopIndex(-1);
    setIsPlaying(false);
  };

  const flipFwRuleAction = (ruleId: string) => {
    playClick();
    setFwRules((prev) =>
      prev.map((r) =>
        r.id === ruleId ? { ...r, action: r.action === 'ALLOW' ? 'DENY' : 'ALLOW' } : r
      )
    );
    setActiveHopIndex(-1);
    setIsPlaying(false);
  };

  const moveFwRule = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= fwRules.length) return;
    playClick();
    setFwRules((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
    setActiveHopIndex(-1);
    setIsPlaying(false);
  };

  const deleteFwRule = (ruleId: string) => {
    playClick();
    setFwRules((prev) => prev.filter((r) => r.id !== ruleId));
    setActiveHopIndex(-1);
    setIsPlaying(false);
  };

  const handleAddFwRule = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    const parsedPort =
      newRulePort.trim().toUpperCase() === 'ANY' || newRulePort.trim() === ''
        ? 'ANY'
        : Math.max(1, Math.min(65535, parseInt(newRulePort, 10) || 443));
    const nextNum = fwRules.length + 1;
    const created: FirewallRule = {
      id: `R${nextNum}-${Date.now().toString().slice(-2)}`,
      name: `${newRuleAction} ${newRuleSrc}→${newRuleDst} ${newRuleProto}/${parsedPort}`,
      srcZone: newRuleSrc,
      dstZone: newRuleDst,
      protocol: newRuleProto,
      port: parsedPort,
      action: newRuleAction,
      enabled: true,
    };
    setFwRules((prev) => [created, ...prev]);
    setActiveHopIndex(-1);
    setIsPlaying(false);
  };

  const toggleServerService = (serverId: 'srv-web' | 'srv-db', port: number) => {
    playClick();
    setServices((prev) => ({
      ...prev,
      [serverId]: prev[serverId].map((s) =>
        s.port === port ? { ...s, enabled: !s.enabled } : s
      ),
    }));
    setActiveHopIndex(-1);
    setIsPlaying(false);
  };

  // Pointer drag handlers for interactive SVG nodes
  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingNodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 860 / rect.width;
    const scaleY = 380 / rect.height;
    const nextX = Math.max(70, Math.min(790, (e.clientX - rect.left) * scaleX));
    const nextY = Math.max(48, Math.min(332, (e.clientY - rect.top) * scaleY));
    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x: nextX, y: nextY } : n))
    );
  };

  const handleSvgPointerUp = () => {
    if (draggingNodeId) setDraggingNodeId(null);
  };

  const nodeMap = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])) as Record<NodeId, TopologyNode>,
    [nodes]
  );

  // Active packet SVG coordinates for crisp lightweight pulse
  const currentHop =
    activeHopIndex >= 0 ? evaluation.hops[Math.min(activeHopIndex, evaluation.hops.length - 1)] : null;
  const activePacketNode = currentHop ? nodeMap[currentHop.nodeId] : null;

  const isEdgeInActiveTrace = (a: NodeId, b: NodeId): boolean => {
    if (activeHopIndex < 0) return false;
    const limit = Math.min(activeHopIndex, evaluation.path.length - 1);
    for (let i = 0; i < limit; i++) {
      const p1 = evaluation.path[i];
      const p2 = evaluation.path[i + 1];
      if ((p1 === a && p2 === b) || (p1 === b && p2 === a)) return true;
    }
    return false;
  };

  const renderNodeIcon = (kind: TopologyNode['kind']) => {
    switch (kind) {
      case 'router':
        return <Router className="w-4 h-4" />;
      case 'firewall':
        return <Shield className="w-4 h-4" />;
      case 'server':
        return <Server className="w-4 h-4" />;
      case 'wan':
        return <Globe className="w-4 h-4" />;
      default:
        return <Laptop className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + 4 Engineering Challenges Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1.5 max-w-3xl">
            <p className="text-xs font-medium text-sky-700 dark:text-cyan-400">
              Topologie 2D ultra-fluide · Manipulation directe Routeur L3, Pare-feu ACL, Serveurs &amp; Paquets
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Atelier Réseau Interactif : Routeurs, Pare-feu &amp; Flux de Paquets
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Cliquez sur n&apos;importe quel équipement du schéma (ou déplacez-le) pour modifier
              sa table de routage, ses règles pare-feu par priorité ou ses ports ouverts, puis
              injectez de vrais paquets IP/TCP/UDP/ICMP pour observer chaque saut.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right font-mono tabular-nums">
              <div className="text-xs text-slate-500 dark:text-slate-400">Objectifs réseau</div>
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {completedChallengesCount} / {challenges.length}
                {rewardClaimed ? ' · +120 XP' : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
          </div>
        </div>

        {/* 4 Live Auto-Verified Network Engineering Challenges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {challenges.map((ch) => (
            <div
              key={ch.id}
              className={`p-3.5 rounded-xl border text-xs space-y-1 transition-colors ${
                ch.done
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 font-semibold">
                <span className="text-slate-900 dark:text-slate-100">{ch.title}</span>
                {ch.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    À faire
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-snug">{ch.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main 2-Zone Sandbox: Left Interactive SVG Topology + Packet Injector | Right Live Device Config */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT ZONE (7 cols): Interactive Topology Canvas + Live Packet Injector + Hop Trace */}
        <div className="xl:col-span-7 space-y-5">
          {/* Interactive SVG Network Canvas */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Topologie manipulable (cliquez pour configurer · glissez pour réorganiser)
              </span>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                Politique FW :{' '}
                <strong
                  className={
                    defaultPolicy === 'DENY'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }
                >
                  DEFAULT {defaultPolicy}
                </strong>
              </span>
            </div>

            <div className="bg-slate-950 p-2 sm:p-3 overflow-x-auto">
              <svg
                ref={svgRef}
                viewBox="0 0 860 380"
                onPointerMove={handleSvgPointerMove}
                onPointerUp={handleSvgPointerUp}
                onPointerLeave={handleSvgPointerUp}
                className="w-full min-w-[640px] h-auto select-none touch-none"
                role="img"
                aria-label="Topologie réseau interactive avec postes, routeur, pare-feu et serveurs"
              >
                {/* Subtle Zone Guides */}
                <rect
                  x="18"
                  y="24"
                  width="186"
                  height="332"
                  rx="12"
                  fill="rgba(14, 165, 233, 0.05)"
                  stroke="rgba(56, 189, 248, 0.18)"
                  strokeDasharray="4 4"
                />
                <text x="32" y="44" fill="#7dd3fc" fontSize="11" fontWeight="600">
                  ZONES LAN &amp; ADMIN
                </text>

                <rect
                  x="646"
                  y="24"
                  width="196"
                  height="156"
                  rx="12"
                  fill="rgba(245, 158, 11, 0.05)"
                  stroke="rgba(251, 191, 36, 0.22)"
                  strokeDasharray="4 4"
                />
                <text x="660" y="44" fill="#fcd34d" fontSize="11" fontWeight="600">
                  ZONE DMZ
                </text>

                <rect
                  x="646"
                  y="200"
                  width="196"
                  height="156"
                  rx="12"
                  fill="rgba(16, 185, 129, 0.05)"
                  stroke="rgba(52, 211, 153, 0.22)"
                  strokeDasharray="4 4"
                />
                <text x="660" y="220" fill="#6ee7b7" fontSize="11" fontWeight="600">
                  ZONE SERVEURS INTERNES
                </text>

                {/* Network Links */}
                {EDGES.map(([aId, bId, label]) => {
                  const a = nodeMap[aId];
                  const b = nodeMap[bId];
                  const linkOnline = a.online && b.online;
                  const activeEdge = isEdgeInActiveTrace(aId, bId);
                  const blockedHere =
                    activeEdge &&
                    currentHop &&
                    currentHop.status === 'blocked' &&
                    (currentHop.nodeId === bId || currentHop.nodeId === aId);
                  const mx = (a.x + b.x) / 2;
                  const my = (a.y + b.y) / 2;

                  return (
                    <g key={`${aId}-${bId}`}>
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke={
                          !linkOnline
                            ? '#475569'
                            : blockedHere
                            ? '#f43f5e'
                            : activeEdge
                            ? '#22d3ee'
                            : '#334155'
                        }
                        strokeWidth={activeEdge ? 3.5 : 2}
                        strokeDasharray={!linkOnline ? '6 6' : activeEdge ? '8 4' : undefined}
                      />
                      <rect
                        x={mx - 34}
                        y={my - 9}
                        width="68"
                        height="18"
                        rx="4"
                        fill="#0f172a"
                        stroke="#1e293b"
                      />
                      <text
                        x={mx}
                        y={my + 3}
                        textAnchor="middle"
                        fill={activeEdge ? '#67e8f9' : '#94a3b8'}
                        fontSize="9.5"
                        fontFamily="monospace"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* Interactive Draggable / Clickable Equipment Nodes */}
                {nodes.map((node) => {
                  const isSelected = node.id === selectedNodeId;
                  const isCurrentHop = currentHop?.nodeId === node.id;
                  const isBlockedHere = isCurrentHop && currentHop.status === 'blocked';
                  const isOkHere =
                    isCurrentHop && (currentHop.status === 'ok' || currentHop.status === 'warn');

                  const borderStroke = !node.online
                    ? '#64748b'
                    : isBlockedHere
                    ? '#f43f5e'
                    : isOkHere
                    ? '#34d399'
                    : isSelected
                    ? '#38bdf8'
                    : '#475569';

                  const fillBg = !node.online
                    ? '#1e293b'
                    : node.kind === 'firewall'
                    ? '#172554'
                    : node.kind === 'router'
                    ? '#0f2942'
                    : '#0f172a';

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        playClick();
                        setSelectedNodeId(node.id);
                        setDraggingNodeId(node.id);
                      }}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <rect
                        x="-62"
                        y="-28"
                        width="124"
                        height="56"
                        rx="10"
                        fill={fillBg}
                        stroke={borderStroke}
                        strokeWidth={isSelected || isCurrentHop ? 2.5 : 1.5}
                      />
                      <text
                        x="0"
                        y="-8"
                        textAnchor="middle"
                        fill={node.online ? '#f8fafc' : '#94a3b8'}
                        fontSize="11.5"
                        fontWeight="700"
                        fontFamily="monospace"
                      >
                        {node.name}
                      </text>
                      <text
                        x="0"
                        y="7"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="9.5"
                      >
                        {node.role}
                      </text>
                      <text
                        x="0"
                        y="20"
                        textAnchor="middle"
                        fill={node.online ? '#38bdf8' : '#f43f5e'}
                        fontSize="9.5"
                        fontFamily="monospace"
                      >
                        {node.online ? node.ip : 'HORS LIGNE'}
                      </text>
                    </g>
                  );
                })}

                {/* Active Packet Indicator Badge on Current Hop */}
                {activePacketNode && currentHop && (
                  <g transform={`translate(${activePacketNode.x}, ${activePacketNode.y - 38})`}>
                    <rect
                      x="-46"
                      y="-11"
                      width="92"
                      height="20"
                      rx="6"
                      fill={currentHop.status === 'blocked' ? '#be123c' : '#0284c7'}
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="2.5"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      {currentHop.status === 'blocked'
                        ? 'DROP / RST'
                        : `${packet.protocol}:${packet.port || 'ICMP'}`}
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Live Packet Injector Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-700 dark:text-cyan-400" />
                Générateur de paquets &amp; Test de flux en direct
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {PORT_PRESETS.slice(0, 5).map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      playClick();
                      setPacket((p) => ({
                        ...p,
                        protocol: preset.protocol,
                        port: preset.port,
                      }));
                      setActiveHopIndex(-1);
                      setIsPlaying(false);
                    }}
                    className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors whitespace-nowrap ${
                      packet.protocol === preset.protocol && packet.port === preset.port
                        ? 'bg-sky-700 dark:bg-cyan-400 text-white dark:text-slate-950 border-sky-700 dark:border-cyan-400 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Source</span>
                <select
                  value={packet.srcId}
                  onChange={(e) => {
                    setPacket((p) => ({
                      ...p,
                      srcId: e.target.value as PacketSpec['srcId'],
                    }));
                    setActiveHopIndex(-1);
                  }}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                >
                  <option value="pc-lan">PC-LAN-01 (LAN)</option>
                  <option value="pc-admin">PC-ADMIN-02 (ADMIN)</option>
                  <option value="ext-client">EXT-CLIENT (WAN)</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Destination</span>
                <select
                  value={packet.dstId}
                  onChange={(e) => {
                    setPacket((p) => ({
                      ...p,
                      dstId: e.target.value as PacketSpec['dstId'],
                    }));
                    setActiveHopIndex(-1);
                  }}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                >
                  <option value="srv-web">SRV-WEB-DMZ (DMZ)</option>
                  <option value="srv-db">SRV-DB-INT (INTERNE)</option>
                  <option value="pc-lan">PC-LAN-01 (LAN)</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Protocole</span>
                <select
                  value={packet.protocol}
                  onChange={(e) => {
                    setPacket((p) => ({
                      ...p,
                      protocol: e.target.value as ProtocolType,
                    }));
                    setActiveHopIndex(-1);
                  }}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                >
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="ICMP">ICMP</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Port</span>
                <input
                  type="number"
                  min={0}
                  max={65535}
                  disabled={packet.protocol === 'ICMP'}
                  value={packet.protocol === 'ICMP' ? 0 : packet.port}
                  onChange={(e) => {
                    setPacket((p) => ({
                      ...p,
                      port: Math.max(0, Math.min(65535, Number(e.target.value) || 0)),
                    }));
                    setActiveHopIndex(-1);
                  }}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono tabular-nums disabled:opacity-50"
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">TTL initial</span>
                <select
                  value={packet.ttl}
                  onChange={(e) => {
                    setPacket((p) => ({ ...p, ttl: Number(e.target.value) }));
                    setActiveHopIndex(-1);
                  }}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono tabular-nums"
                >
                  <option value={64}>TTL 64 (Normal)</option>
                  <option value={2}>TTL 2 (Expire au FW)</option>
                  <option value={1}>TTL 1 (Expire au RTR)</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendPacket}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 transition-colors whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5" />
                  Envoyer le paquet
                </button>
                <button
                  type="button"
                  onClick={handleStepForward}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Pas à pas
                </button>
              </div>

              {activeHopIndex >= 0 && (
                <div
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    evaluation.delivered
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {evaluation.delivered ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{evaluation.verdict}</span>
                </div>
              )}
            </div>

            {/* Live Hop-by-Hop Packet Trace Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Saut</th>
                    <th className="py-2 px-3 font-semibold">Équipement · Couche</th>
                    <th className="py-2 px-3 font-semibold">En-tête &amp; Détail</th>
                    <th className="py-2 px-3 font-semibold text-right">TTL</th>
                    <th className="py-2 px-3 font-semibold text-right">Décision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {evaluation.hops.map((hop, idx) => {
                    const visible = activeHopIndex === -1 || idx <= activeHopIndex;
                    const isCurrent = idx === activeHopIndex;
                    return (
                      <tr
                        key={`${hop.nodeId}-${idx}`}
                        className={`transition-opacity ${
                          visible ? 'opacity-100' : 'opacity-30'
                        } ${isCurrent ? 'bg-sky-50/70 dark:bg-cyan-950/35' : ''}`}
                      >
                        <td className="py-2 px-3 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          #{idx + 1}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {hop.nodeName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {hop.layer} · +{hop.latencyMs} ms
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-mono text-[11px] text-sky-700 dark:text-cyan-400">
                            {hop.headerSummary}
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 mt-0.5">
                            {hop.detail}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {hop.ttlAfter}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-semibold whitespace-nowrap ${
                            hop.status === 'blocked'
                              ? 'text-rose-700 dark:text-rose-400'
                              : hop.status === 'warn'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {hop.decision}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT ZONE (5 cols): Direct Equipment Inspector & Configuration Panel */}
        <aside className="xl:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
          {/* Quick Equipment Selector Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-4">
            {nodes.map((n) => {
              const active = n.id === selectedNodeId;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedNodeId(n.id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-sky-700 dark:bg-cyan-400 text-white dark:text-slate-950 border-sky-700 dark:border-cyan-400 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {renderNodeIcon(n.kind)}
                  <span>{n.name}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Node Header & Power Switch */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span>Zone {selectedNode.zone}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedNode.ip}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                {selectedNode.name} — {selectedNode.role}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => toggleNodePower(selectedNode.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                selectedNode.online
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                  : 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {selectedNode.online ? 'En ligne' : 'Éteint'}
            </button>
          </div>

          {/* 1. ROUTER CONFIGURATION (RTR-CORE-01) */}
          {selectedNode.kind === 'router' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Traduction d&apos;adresses NAT / PAT (Sortie WAN)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Masque les IP privées 192.168.x.x derrière 198.51.100.1
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setNatEnabled((v) => !v);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    natEnabled
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {natEnabled ? 'NAT Actif' : 'NAT Coupé'}
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Table de routage L3 (cliquez pour activer / couper une route)
                </h4>
                <div className="space-y-2">
                  {routes.map((rt) => (
                    <div
                      key={rt.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="font-mono min-w-0">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {rt.destination}{' '}
                          <span className="text-sky-700 dark:text-cyan-400 font-normal">
                            ({rt.zone})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          via {rt.nextHop} · {rt.iface} · métrique {rt.metric}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleRoute(rt.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold border whitespace-nowrap shrink-0 ${
                          rt.enabled
                            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                            : 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {rt.enabled ? 'Route UP' : 'Route DOWN'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. FIREWALL CONFIGURATION (FW-EDGE-01) */}
          {selectedNode.kind === 'firewall' && (
            <div className="space-y-4">
              {/* Default Policy Switch */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Politique par défaut (si aucune règle ne correspond)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bonne pratique Zero Trust : DEFAULT DENY
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setDefaultPolicy((p) => (p === 'DENY' ? 'ALLOW' : 'DENY'));
                    setActiveHopIndex(-1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors whitespace-nowrap shrink-0 ${
                    defaultPolicy === 'DENY'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-amber-500 text-slate-950 border-amber-500'
                  }`}
                >
                  DEFAULT {defaultPolicy}
                </button>
              </div>

              {/* Ordered ACL Rules List (First Match Wins) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">
                    Règles ACL ordonnées (1re correspondance gagne)
                  </h4>
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {fwRules.filter((r) => r.enabled).length}/{fwRules.length} actives
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {fwRules.map((rule, idx) => {
                    const isMatched = evaluation.matchedRuleId === rule.id && activeHopIndex >= 0;
                    return (
                      <div
                        key={rule.id}
                        className={`p-3 rounded-xl border text-xs space-y-2 transition-colors ${
                          isMatched
                            ? 'border-sky-500 dark:border-cyan-400 bg-sky-50/60 dark:bg-cyan-950/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40'
                        } ${!rule.enabled ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 truncate">
                            #{idx + 1} · {rule.id} · {rule.srcZone} → {rule.dstZone} (
                            {rule.protocol}/{rule.port})
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              aria-label="Monter la priorité"
                              disabled={idx === 0}
                              onClick={() => moveFwRule(idx, -1)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Descendre la priorité"
                              disabled={idx === fwRules.length - 1}
                              onClick={() => moveFwRule(idx, 1)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Supprimer la règle"
                              onClick={() => deleteFwRule(rule.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-slate-600 dark:text-slate-400">{rule.name}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => flipFwRuleAction(rule.id)}
                              className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold border ${
                                rule.action === 'ALLOW'
                                  ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                                  : 'border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400'
                              }`}
                            >
                              {rule.action}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleFwRule(rule.id)}
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                rule.enabled
                                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border-slate-900 dark:border-slate-100'
                                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {rule.enabled ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Firewall Rule Form */}
              <form
                onSubmit={handleAddFwRule}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-2.5"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-sky-700 dark:text-cyan-400" />
                  Ajouter une règle pare-feu personnalisée (en tête)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <select
                    value={newRuleSrc}
                    onChange={(e) => setNewRuleSrc(e.target.value as ZoneId)}
                    className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  >
                    <option value="ANY">Src: ANY</option>
                    <option value="LAN">Src: LAN</option>
                    <option value="ADMIN">Src: ADMIN</option>
                    <option value="WAN">Src: WAN</option>
                    <option value="DMZ">Src: DMZ</option>
                  </select>
                  <select
                    value={newRuleDst}
                    onChange={(e) => setNewRuleDst(e.target.value as ZoneId)}
                    className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  >
                    <option value="DMZ">Dst: DMZ</option>
                    <option value="INTERNE">Dst: INTERNE</option>
                    <option value="LAN">Dst: LAN</option>
                    <option value="ANY">Dst: ANY</option>
                  </select>
                  <select
                    value={newRuleProto}
                    onChange={(e) => setNewRuleProto(e.target.value as ProtocolType | 'ANY')}
                    className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="ICMP">ICMP</option>
                    <option value="ANY">ANY</option>
                  </select>
                  <input
                    type="text"
                    value={newRulePort}
                    onChange={(e) => setNewRulePort(e.target.value)}
                    placeholder="Port / ANY"
                    className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                  <select
                    value={newRuleAction}
                    onChange={(e) => setNewRuleAction(e.target.value as RuleAction)}
                    className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                  >
                    <option value="ALLOW">ALLOW</option>
                    <option value="DENY">DENY</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg text-xs font-semibold bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 transition-colors"
                >
                  Insérer la règle en priorité #1
                </button>
              </form>
            </div>
          )}

          {/* 3. SERVER CONFIGURATION (SRV-WEB-DMZ / SRV-DB-INT) */}
          {(selectedNode.id === 'srv-web' || selectedNode.id === 'srv-db') && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide inline-flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-700 dark:text-cyan-400" />
                Services &amp; Ports en écoute (démarrer / couper)
              </h4>
              <div className="space-y-2">
                {services[selectedNode.id].map((svc) => (
                  <div
                    key={`${svc.protocol}-${svc.port}`}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {svc.name}
                      </div>
                      <div className="font-mono text-slate-500 dark:text-slate-400">
                        {svc.protocol}/{svc.port}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleServerService(selectedNode.id as 'srv-web' | 'srv-db', svc.port)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        svc.enabled
                          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {svc.enabled ? 'LISTEN (Ouvert)' : 'STOPPED (Fermé)'}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Astuce : coupez un service pour observer la réponse{' '}
                <code className="font-mono">TCP RST (Port fermé)</code> même si le pare-feu laisse
                passer le flux.
              </p>
            </div>
          )}

          {/* 4. HOST / WAN QUICK LAUNCH */}
          {(selectedNode.kind === 'host' || selectedNode.kind === 'wan') && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Équipement d&apos;extrémité dans la zone{' '}
                <strong className="font-mono text-slate-900 dark:text-slate-100">
                  {selectedNode.zone}
                </strong>
                . Utilisez-le comme source d&apos;un flux pour tester les règles de routage et de
                filtrage de votre infrastructure.
              </p>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setPacket((p) => ({
                    ...p,
                    srcId: selectedNode.id as PacketSpec['srcId'],
                  }));
                  setActiveHopIndex(-1);
                }}
                className="w-full py-2.5 rounded-lg text-xs font-semibold bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 transition-colors"
              >
                Définir {selectedNode.name} comme source du paquet
              </button>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5">
                  {selectedNode.kind === 'wan' ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                  )}
                  Conseil d&apos;architecture
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  {selectedNode.kind === 'wan'
                    ? 'Testez EXT-CLIENT → SRV-DB-INT:5432 pour vérifier qu’Internet ne peut jamais joindre la base de données interne.'
                    : selectedNode.id === 'pc-admin'
                    ? 'PC-ADMIN-02 appartient au VLAN 20 (ADMIN) : autorisez uniquement cette zone vers SSH (22) sur SRV-DB-INT.'
                    : 'PC-LAN-01 (VLAN 10) doit accéder au Web HTTPS en DMZ, mais pas directement au port SQL 5432.'}
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
