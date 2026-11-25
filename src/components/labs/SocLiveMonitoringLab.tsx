import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Copy,
  Filter,
  Info,
  Pause,
  Play,
  Radar,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  XCircle,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

type Severity = 'CRITIQUE' | 'HAUTE' | 'MOYENNE' | 'INFO';
type SensorType = 'FIREWALL' | 'AD-DC' | 'WAF-HTTP' | 'EDR-LINUX' | 'DNS-PROXY' | 'K8S-AUDIT';
type TriageStatus = 'pending' | 'confirmed' | 'false_positive' | 'blocked_auto';

export type SimulatedAttackScenarioId =
  | 'sqli'
  | 'kerberoast'
  | 'ssh_bruteforce'
  | 'dns_exfil'
  | 'ddos_scan'
  | 'k8s_jwt';

interface SocLogEvent {
  id: string;
  timestamp: string;
  severity: Severity;
  sensor: SensorType;
  islandName: string;
  srcIp: string;
  dstIp: string;
  port: number;
  protocol: string;
  summary: string;
  mitre: string;
  isMalicious: boolean;
  scenarioId?: SimulatedAttackScenarioId;
  rawPayload: string;
  analystExplanation: string;
  triage: TriageStatus;
}

interface SocLiveMonitoringLabProps {
  onCompleteInvestigation?: (xpEarned: number) => void;
}

const ATTACK_TEMPLATES: Record<
  SimulatedAttackScenarioId,
  {
    label: string;
    severity: Severity;
    sensor: SensorType;
    islandName: string;
    srcIpPool: string[];
    dstIp: string;
    port: number;
    protocol: string;
    mitre: string;
    summary: string;
    buildRaw: (srcIp: string, ts: string) => string;
    explanation: string;
  }
> = {
  sqli: {
    label: 'Injection SQL',
    severity: 'CRITIQUE',
    sensor: 'WAF-HTTP',
    islandName: 'Île 22 · API & Web',
    srcIpPool: ['185.220.101.47', '45.148.10.92'],
    dstIp: '172.16.10.22',
    port: 443,
    protocol: 'HTTPS',
    mitre: 'T1190',
    summary: "Tentative d'extraction SQL UNION SELECT sur /api/v1/users",
    buildRaw: (srcIp, ts) =>
      `${ts} waf-dmz-01 ALERT rule=942100 src=${srcIp} dst=172.16.10.22:443 method=GET uri="/api/v1/users?id=1%20UNION%20SELECT%20email,hash%20FROM%20admins--" status=500`,
    explanation:
      'La charge utile « UNION SELECT » tente de lire la table admins via un paramètre non préparé. C’est une attaque réelle de gravité critique à bloquer immédiatement.',
  },
  kerberoast: {
    label: 'Kerberoasting AD',
    severity: 'CRITIQUE',
    sensor: 'AD-DC',
    islandName: 'Île 15 · Citadelle AD',
    srcIpPool: ['10.20.4.88', '10.20.4.63'],
    dstIp: '10.20.0.10',
    port: 88,
    protocol: 'KERBEROS',
    mitre: 'T1558.003',
    summary: 'Demande massive de tickets TGS RC4 (EventID 4769) sur comptes SPN',
    buildRaw: (srcIp, ts) =>
      `${ts} DC-AD-01 WinEventID=4769 src=${srcIp} user="m.dupont" service="MSSQLSvc/srv-db.cyberland.local" enc_type=0x17(RC4-HMAC) status=0x0 count_60s=19`,
    explanation:
      '19 requêtes TGS en chiffrement faible RC4 (0x17) en 60 secondes trahissent une attaque Kerberoasting visant à casser hors-ligne le mot de passe d’un compte de service.',
  },
  ssh_bruteforce: {
    label: 'Brute Force SSH',
    severity: 'HAUTE',
    sensor: 'EDR-LINUX',
    islandName: 'Île 19 · Serveur Linux',
    srcIpPool: ['91.240.118.172', '194.26.135.84'],
    dstIp: '172.16.20.19',
    port: 22,
    protocol: 'SSH',
    mitre: 'T1110.001',
    summary: 'Rafale de 48 échecs SSH sur le compte root suivie d’une tentative sudo',
    buildRaw: (srcIp, ts) =>
      `${ts} srv-linux-19 sshd[4821]: Failed password for root from ${srcIp} port 51904 ssh2 (attempts=48/30s) | pam_unix: auth failure`,
    explanation:
      'Une rafale de 48 échecs d’authentification root depuis une IP publique externe caractérise un brute force SSH actif. Il faut bannir l’IP et désactiver PermitRootLogin.',
  },
  dns_exfil: {
    label: 'Exfiltration DNS',
    severity: 'HAUTE',
    sensor: 'DNS-PROXY',
    islandName: 'Île 13 · Observatoire Wireshark',
    srcIpPool: ['10.20.8.41', '10.20.8.19'],
    dstIp: '10.20.0.53',
    port: 53,
    protocol: 'UDP/DNS',
    mitre: 'T1048.003',
    summary: 'Requêtes TXT haute entropie vers un domaine C2 suspect (.xyz)',
    buildRaw: (srcIp, ts) =>
      `${ts} dns-gw-01 QUERY type=TXT src=${srcIp} qname="7a9f4c2e8b10d4f92a6c.exfil-node.xyz" entropy=4.72 resp=NOERROR bytes_out=18420`,
    explanation:
      'Les sous-domaines hexadécimaux très longs (entropie > 4.5) en requêtes TXT servent à exfiltrer des données en contournant le pare-feu HTTP.',
  },
  ddos_scan: {
    label: 'SYN Flood & Scan',
    severity: 'HAUTE',
    sensor: 'FIREWALL',
    islandName: 'Île 03 · Forteresse Pare-feu',
    srcIpPool: ['203.0.113.77', '198.51.100.204'],
    dstIp: '172.16.0.1',
    port: 443,
    protocol: 'TCP/SYN',
    mitre: 'T1498',
    summary: 'Pic de 14 200 paquets TCP SYN/s sans ACK (saturation table d’état)',
    buildRaw: (srcIp, ts) =>
      `${ts} fw-edge-01 KERNEL_DROP proto=TCP flags=SYN src=${srcIp} dst=172.16.0.1:443 pps=14200 syn_queue_usage=94% action=RATE_LIMIT`,
    explanation:
      'Une avalanche de paquets SYN sans finaliser le 3-way handshake sature la table de connexions du pare-feu. Bloquer la source et activer SYN Cookies protège l’île.',
  },
  k8s_jwt: {
    label: 'Abus Token K8s/JWT',
    severity: 'CRITIQUE',
    sensor: 'K8S-AUDIT',
    islandName: 'Île 17 · Archipel Kubernetes',
    srcIpPool: ['10.244.2.15', '10.244.1.29'],
    dstIp: '10.96.0.1',
    port: 6443,
    protocol: 'HTTPS/API',
    mitre: 'T1528',
    summary: 'Création d’un pod privileged avec montage hostPath:/etc depuis un pod web',
    buildRaw: (srcIp, ts) =>
      `${ts} kube-apiserver AUDIT verb=create resource=pods ns=prod src=${srcIp} sa=web-frontend privileged=true hostPath=/etc/shadow decision=ALERT`,
    explanation:
      'Un compte de service applicatif (web-frontend) tente de déployer un conteneur privilégié montant l’hôte. C’est une tentative d’évasion de conteneur à stopper.',
  },
};

const BENIGN_TEMPLATES: Array<{
  severity: Severity;
  sensor: SensorType;
  islandName: string;
  srcIp: string;
  dstIp: string;
  port: number;
  protocol: string;
  summary: string;
  buildRaw: (ts: string) => string;
  explanation: string;
}> = [
  {
    severity: 'INFO',
    sensor: 'WAF-HTTP',
    islandName: 'Île 04 · Sommet Cloud',
    srcIp: '10.10.1.5',
    dstIp: '172.16.10.22',
    port: 443,
    protocol: 'HTTPS',
    summary: 'Sonde de santé HTTP 200 OK depuis le répartiteur interne',
    buildRaw: (ts) =>
      `${ts} waf-dmz-01 INFO src=10.10.1.5 dst=172.16.10.22:443 method=GET uri="/healthz" status=200 latency=4ms ua="Cyberland-HealthProbe/1.0"`,
    explanation:
      'Trafic légitime : il s’agit de la sonde interne de haute disponibilité vérifiant que le serveur web répond en 200 OK.',
  },
  {
    severity: 'INFO',
    sensor: 'AD-DC',
    islandName: 'Île 15 · Citadelle AD',
    srcIp: '10.20.2.14',
    dstIp: '10.20.0.10',
    port: 88,
    protocol: 'KERBEROS',
    summary: 'Renouvellement normal de ticket TGT AES-256 pour un poste bureautique',
    buildRaw: (ts) =>
      `${ts} DC-AD-01 WinEventID=4768 src=10.20.2.14 user="c.martin" enc_type=0x12(AES256-CTS) status=0x0 result=SUCCESS`,
    explanation:
      'Trafic légitime : un poste interne renouvelle son ticket Kerberos avec chiffrement fort AES-256 (0x12).',
  },
  {
    severity: 'MOYENNE',
    sensor: 'EDR-LINUX',
    islandName: 'Île 19 · Serveur Linux',
    srcIp: '10.20.1.2',
    dstIp: '172.16.20.19',
    port: 22,
    protocol: 'SSH',
    summary: 'Connexion SSH par clé Ed25519 depuis le bastion d’administration',
    buildRaw: (ts) =>
      `${ts} srv-linux-19 sshd[9104]: Accepted publickey for ops-backup from 10.20.1.2 port 44120 ssh2: ED25519 SHA256:9xK2...scheduled-backup`,
    explanation:
      'Faux positif classique : la connexion SSH provient du bastion autorisé (10.20.1.2) par clé Ed25519 pour la sauvegarde planifiée.',
  },
  {
    severity: 'INFO',
    sensor: 'DNS-PROXY',
    islandName: 'Île 02 · Port des Adresses',
    srcIp: '10.20.3.21',
    dstIp: '10.20.0.53',
    port: 53,
    protocol: 'UDP/DNS',
    summary: 'Résolution DNS standard pour mises à jour sécurité Debian',
    buildRaw: (ts) =>
      `${ts} dns-gw-01 QUERY type=A src=10.20.3.21 qname="security.debian.org" entropy=2.14 resp=NOERROR cached=true`,
    explanation:
      'Trafic légitime : requête DNS standard de faible entropie vers un dépôt officiel de correctifs Linux.',
  },
  {
    severity: 'MOYENNE',
    sensor: 'FIREWALL',
    islandName: 'Île 03 · Forteresse Pare-feu',
    srcIp: '10.20.1.9',
    dstIp: '172.16.10.10',
    port: 443,
    protocol: 'TCP/TLS',
    summary: 'Audit planifié de validité des certificats TLS interne',
    buildRaw: (ts) =>
      `${ts} fw-edge-01 ALLOW proto=TCP src=10.20.1.9 dst=172.16.10.10:443 note="cert-monitor-cron" tls=1.3`,
    explanation:
      'Trafic légitime : le superviseur interne contrôle l’expiration des certificats TLS 1.3.',
  },
];

const SCENARIO_KEYS: SimulatedAttackScenarioId[] = [
  'sqli',
  'kerberoast',
  'ssh_bruteforce',
  'dns_exfil',
  'ddos_scan',
  'k8s_jwt',
];

function nowTimeLabel(offsetSec = 0): string {
  const d = new Date(Date.now() - offsetSec * 1000);
  return d.toTimeString().slice(0, 8);
}

let logSeq = 1000;

function createAttackLog(
  scenarioId: SimulatedAttackScenarioId,
  blockedIps: Set<string>,
  offsetSec = 0
): SocLogEvent {
  const tpl = ATTACK_TEMPLATES[scenarioId];
  const srcIp = tpl.srcIpPool[Math.floor(Math.random() * tpl.srcIpPool.length)];
  const ts = nowTimeLabel(offsetSec);
  const id = `EVT-${++logSeq}`;
  const isAlreadyBlocked = blockedIps.has(srcIp);

  return {
    id,
    timestamp: ts,
    severity: isAlreadyBlocked ? 'INFO' : tpl.severity,
    sensor: tpl.sensor,
    islandName: tpl.islandName,
    srcIp,
    dstIp: tpl.dstIp,
    port: tpl.port,
    protocol: tpl.protocol,
    summary: isAlreadyBlocked ? `[BLOQUÉ PAR PARE-FEU] ${tpl.summary}` : tpl.summary,
    mitre: tpl.mitre,
    isMalicious: true,
    scenarioId,
    rawPayload: tpl.buildRaw(srcIp, ts),
    analystExplanation: tpl.explanation,
    triage: isAlreadyBlocked ? 'blocked_auto' : 'pending',
  };
}

function createBenignLog(offsetSec = 0): SocLogEvent {
  const tpl = BENIGN_TEMPLATES[Math.floor(Math.random() * BENIGN_TEMPLATES.length)];
  const ts = nowTimeLabel(offsetSec);
  const id = `EVT-${++logSeq}`;
  return {
    id,
    timestamp: ts,
    severity: tpl.severity,
    sensor: tpl.sensor,
    islandName: tpl.islandName,
    srcIp: tpl.srcIp,
    dstIp: tpl.dstIp,
    port: tpl.port,
    protocol: tpl.protocol,
    summary: tpl.summary,
    mitre: '—',
    isMalicious: false,
    rawPayload: tpl.buildRaw(ts),
    analystExplanation: tpl.explanation,
    triage: 'pending',
  };
}

function buildInitialLogs(): SocLogEvent[] {
  const emptySet = new Set<string>();
  return [
    createAttackLog('sqli', emptySet, 2),
    createBenignLog(4),
    createAttackLog('kerberoast', emptySet, 7),
    createBenignLog(11),
    createAttackLog('ssh_bruteforce', emptySet, 15),
    createBenignLog(19),
    createBenignLog(24),
  ];
}

export const SocLiveMonitoringLab: React.FC<SocLiveMonitoringLabProps> = ({
  onCompleteInvestigation,
}) => {
  const [logs, setLogs] = useState<SocLogEvent[]>(() => buildInitialLogs());
  const [isStreaming, setIsStreaming] = useState(true);
  const [cadenceMs, setCadenceMs] = useState<2200 | 1100>(2200);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(() => null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | Severity>('ALL');
  const [sensorFilter, setSensorFilter] = useState<'ALL' | SensorType>('ALL');
  const [threatsOnly, setThreatsOnly] = useState(false);
  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [benignVerifiedCount, setBenignVerifiedCount] = useState(0);
  const [triageErrors, setTriageErrors] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    kind: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [activityBuckets, setActivityBuckets] = useState<number[]>([2, 4, 3, 5, 4, 6, 3, 5, 7, 4, 5, 6]);

  const blockedSetRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    blockedSetRef.current = new Set(blockedIps);
  }, [blockedIps]);

  // Select first log automatically if nothing selected
  useEffect(() => {
    if (!selectedLogId && logs.length > 0) {
      setSelectedLogId(logs[0].id);
    }
  }, [selectedLogId, logs]);

  // Live SIEM ingestion timer
  useEffect(() => {
    if (!isStreaming) return;
    const timer = window.setInterval(() => {
      const spawnAttack = Math.random() < 0.44;
      const nextLog = spawnAttack
        ? createAttackLog(
            SCENARIO_KEYS[Math.floor(Math.random() * SCENARIO_KEYS.length)],
            blockedSetRef.current,
            0
          )
        : createBenignLog(0);

      setLogs((prev) => [nextLog, ...prev].slice(0, 75));
      setActivityBuckets((prev) => [...prev.slice(1), spawnAttack ? 6 + Math.floor(Math.random() * 4) : 2 + Math.floor(Math.random() * 3)]);
    }, cadenceMs);

    return () => window.clearInterval(timer);
  }, [isStreaming, cadenceMs]);

  const handleInjectScenario = useCallback((scenarioId: SimulatedAttackScenarioId) => {
    playClick();
    const newEvt = createAttackLog(scenarioId, blockedSetRef.current, 0);
    setLogs((prev) => [newEvt, ...prev].slice(0, 75));
    setSelectedLogId(newEvt.id);
    setActivityBuckets((prev) => [...prev.slice(1), 9]);
    setFeedbackBanner({
      kind: 'info',
      message: `Attaque simulée « ${ATTACK_TEMPLATES[scenarioId].label} » injectée sur ${newEvt.islandName}. Inspectez l’événement à droite.`,
    });
  }, []);

  const handleReset = () => {
    playClick();
    const fresh = buildInitialLogs();
    setLogs(fresh);
    setSelectedLogId(fresh[0]?.id ?? null);
    setBlockedIps([]);
    setConfirmedCount(0);
    setBenignVerifiedCount(0);
    setTriageErrors(0);
    setSearchQuery('');
    setSeverityFilter('ALL');
    setSensorFilter('ALL');
    setThreatsOnly(false);
    setFeedbackBanner(null);
    setIsStreaming(true);
  };

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((evt) => {
      if (severityFilter !== 'ALL' && evt.severity !== severityFilter) return false;
      if (sensorFilter !== 'ALL' && evt.sensor !== sensorFilter) return false;
      if (threatsOnly && !evt.isMalicious) return false;
      if (!q) return true;
      return (
        evt.id.toLowerCase().includes(q) ||
        evt.srcIp.toLowerCase().includes(q) ||
        evt.dstIp.toLowerCase().includes(q) ||
        evt.islandName.toLowerCase().includes(q) ||
        evt.sensor.toLowerCase().includes(q) ||
        evt.mitre.toLowerCase().includes(q) ||
        evt.summary.toLowerCase().includes(q) ||
        evt.rawPayload.toLowerCase().includes(q) ||
        String(evt.port).includes(q)
      );
    });
  }, [logs, searchQuery, severityFilter, sensorFilter, threatsOnly]);

  const selectedLog = useMemo(
    () => logs.find((l) => l.id === selectedLogId) ?? filteredLogs[0] ?? null,
    [logs, selectedLogId, filteredLogs]
  );

  const correlatedForSelectedIp = useMemo(() => {
    if (!selectedLog) return { total: 0, islands: [] as string[] };
    const matches = logs.filter((l) => l.srcIp === selectedLog.srcIp);
    const islands = Array.from(new Set(matches.map((m) => m.islandName)));
    return { total: matches.length, islands };
  }, [logs, selectedLog]);

  const metrics = useMemo(() => {
    const criticalOrHigh = logs.filter(
      (l) => (l.severity === 'CRITIQUE' || l.severity === 'HAUTE') && l.triage === 'pending'
    ).length;
    const targetedIslands = new Set(
      logs.filter((l) => l.isMalicious && l.triage !== 'blocked_auto').map((l) => l.islandName)
    ).size;
    return {
      totalIngested: logs.length,
      criticalOrHigh,
      targetedIslands,
    };
  }, [logs]);

  const handleQualifyThreat = (evt: SocLogEvent) => {
    if (evt.triage !== 'pending') return;

    if (evt.isMalicious) {
      playSuccess();
      const nextConfirmed = confirmedCount + 1;
      setConfirmedCount(nextConfirmed);
      setBlockedIps((prev) => (prev.includes(evt.srcIp) ? prev : [evt.srcIp, ...prev]));
      setLogs((prev) =>
        prev.map((item) =>
          item.id === evt.id
            ? { ...item, triage: 'confirmed' }
            : item.srcIp === evt.srcIp && item.triage === 'pending' && item.isMalicious
            ? { ...item, triage: 'blocked_auto' }
            : item
        )
      );

      if (nextConfirmed >= 3 && !xpAwarded) {
        setXpAwarded(true);
        playVictory();
        onCompleteInvestigation?.(120);
        setFeedbackBanner({
          kind: 'success',
          message: `Menace ${evt.mitre} qualifiée et IP ${evt.srcIp} confinée ! Objectif SOC atteint (3/3) : +120 XP ajoutés.`,
        });
      } else {
        setFeedbackBanner({
          kind: 'success',
          message: `Correct ! ${evt.mitre} confirmée sur ${evt.islandName} et IP ${evt.srcIp} ajoutée à la liste de blocage.`,
        });
      }
    } else {
      playError();
      setTriageErrors((e) => e + 1);
      setFeedbackBanner({
        kind: 'error',
        message: `Attention : ${evt.srcIp} correspond à un trafic légitime. ${evt.analystExplanation}`,
      });
    }
  };

  const handleMarkBenign = (evt: SocLogEvent) => {
    if (evt.triage !== 'pending') return;

    if (!evt.isMalicious) {
      playSuccess();
      setBenignVerifiedCount((c) => c + 1);
      setLogs((prev) =>
        prev.map((item) => (item.id === evt.id ? { ...item, triage: 'false_positive' } : item))
      );
      setFeedbackBanner({
        kind: 'success',
        message: `Bien vu ! Trafic légitime écarté proprement (${evt.sensor} · ${evt.srcIp}).`,
      });
    } else {
      playError();
      setTriageErrors((e) => e + 1);
      setFeedbackBanner({
        kind: 'error',
        message: `Alerte manquée ! Cet événement est bien malveillant (${evt.mitre}). ${evt.analystExplanation}`,
      });
    }
  };

  const handleUnblockIp = (ip: string) => {
    playClick();
    setBlockedIps((prev) => prev.filter((item) => item !== ip));
  };

  const handleCopyIoc = (evt: SocLogEvent) => {
    playClick();
    const text = `${evt.srcIp} -> ${evt.dstIp}:${evt.port} (${evt.mitre})`;
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text);
    }
    setCopiedId(evt.id);
    window.setTimeout(() => setCopiedId((curr) => (curr === evt.id ? null : curr)), 1800);
  };

  const renderSeverityLabel = (severity: Severity) => {
    if (severity === 'CRITIQUE') {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-rose-700 dark:text-rose-400 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          CRITIQUE
        </span>
      );
    }
    if (severity === 'HAUTE') {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          HAUTE
        </span>
      );
    }
    if (severity === 'MOYENNE') {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-sky-700 dark:text-cyan-400 whitespace-nowrap">
          <Activity className="w-3.5 h-3.5 shrink-0" />
          MOYENNE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
        <Info className="w-3.5 h-3.5 shrink-0" />
        INFO
      </span>
    );
  };

  const renderTriageStatus = (triage: TriageStatus) => {
    if (triage === 'confirmed') {
      return (
        <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
          ✓ QUALIFIÉE
        </span>
      );
    }
    if (triage === 'blocked_auto') {
      return (
        <span className="font-mono text-xs font-semibold text-sky-700 dark:text-cyan-400 whitespace-nowrap">
          ✓ IP BLOQUÉE
        </span>
      );
    }
    if (triage === 'false_positive') {
      return (
        <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
          ○ LÉGITIME
        </span>
      );
    }
    return (
      <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
        ▲ À TRIER
      </span>
    );
  };

  const maxBucket = Math.max(...activityBuckets, 10);

  return (
    <div className="space-y-6">
      {/* Top Command Bar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span>Laboratoires</span>
              <span aria-hidden="true">/</span>
              <span className="text-sky-700 dark:text-cyan-400 font-semibold">
                SOC Live Monitoring
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  isStreaming
                    ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'text-amber-700 dark:text-amber-400 font-semibold'
                }
              >
                {isStreaming ? '● FLUX ACTIF' : '○ FLUX EN PAUSE'}
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              Tableau de bord SIEM &amp; Investigation temps réel
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Analysez les journaux générés en direct par les attaques simulées sur l’archipel,
              corrélez les IP suspectes, écartez les faux positifs et qualifiez 3 vraies menaces
              pour débloquer +120 XP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                playClick();
                setIsStreaming((s) => !s);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isStreaming
                  ? 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700'
                  : 'bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950'
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5 shrink-0" />
                  Mettre en pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  Reprendre le flux
                </>
              )}
            </button>

            <div
              role="group"
              aria-label="Cadence d'ingestion"
              className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setCadenceMs(2200);
                }}
                className={`px-2.5 py-2 text-xs font-mono font-semibold rounded-md transition-colors whitespace-nowrap ${
                  cadenceMs === 2200
                    ? 'bg-white dark:bg-slate-950 text-sky-700 dark:text-cyan-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setCadenceMs(1100);
                }}
                className={`px-2.5 py-2 text-xs font-mono font-semibold rounded-md transition-colors whitespace-nowrap ${
                  cadenceMs === 1100
                    ? 'bg-white dark:bg-slate-950 text-sky-700 dark:text-cyan-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Soutenu
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              Réinitialiser
            </button>
          </div>
        </div>

        {/* 4-Column Tabular KPI Strip with Live Volume Sparkbars */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Événements ingérés</span>
              <span className="font-mono tabular-nums text-sky-700 dark:text-cyan-400">
                {cadenceMs === 1100 ? '~55/min' : '~27/min'}
              </span>
            </div>
            <div className="flex items-end justify-between gap-3">
              <p className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {metrics.totalIngested}
              </p>
              <div className="flex items-end gap-1 h-7" aria-hidden="true">
                {activityBuckets.map((val, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 rounded-t-sm transition-all ${
                      val >= 7
                        ? 'bg-rose-500 dark:bg-rose-400'
                        : 'bg-sky-500/70 dark:bg-cyan-400/70'
                    }`}
                    style={{ height: `${Math.max(20, Math.round((val / maxBucket) * 100))}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Alertes critiques / hautes à trier
            </p>
            <p className="font-mono text-2xl font-bold text-rose-700 dark:text-rose-400 tabular-nums">
              {metrics.criticalOrHigh}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {blockedIps.length} IP confinée{blockedIps.length > 1 ? 's' : ''} au pare-feu
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">Îles de l’archipel ciblées</p>
            <p className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {metrics.targetedIslands} / 6
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Capteurs WAF, AD, Linux, DNS, K8s
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Objectif d’investigation
            </p>
            <p className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {Math.min(confirmedCount, 3)} / 3 menaces
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {benignVerifiedCount} légitime{benignVerifiedCount > 1 ? 's' : ''} vérifié
              {benignVerifiedCount > 1 ? 's' : ''} · {triageErrors} erreur
              {triageErrors > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Manual Attack Simulator Bar */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 mr-1 whitespace-nowrap">
            Simuler une attaque sur l’archipel :
          </span>
          {SCENARIO_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleInjectScenario(key)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:border-rose-400 dark:hover:border-rose-500/60 hover:text-rose-700 dark:hover:text-rose-300 transition-colors whitespace-nowrap"
            >
              <span>+ {ATTACK_TEMPLATES[key].label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Live Investigation Feedback Strip */}
      {feedbackBanner && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-xs sm:text-sm flex items-center justify-between gap-3 ${
            feedbackBanner.kind === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
              : feedbackBanner.kind === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
              : 'bg-sky-50 dark:bg-cyan-950/40 border-sky-200 dark:border-cyan-800 text-sky-900 dark:text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackBanner.kind === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : feedbackBanner.kind === 'error' ? (
              <XCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Radar className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs font-semibold hover:underline shrink-0"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Main 12-Column Investigation Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 columns: Filterable Live SIEM Stream Table */}
        <section className="xl:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {/* Search & Filter Controls */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrer par IP, île, MITRE (T1558), port ou log brut..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 dark:focus:border-cyan-400 font-mono"
                />
              </div>

              <select
                aria-label="Filtrer par capteur"
                value={sensorFilter}
                onChange={(e) => setSensorFilter(e.target.value as 'ALL' | SensorType)}
                className="px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">Tous capteurs</option>
                <option value="WAF-HTTP">WAF-HTTP</option>
                <option value="AD-DC">AD-DC</option>
                <option value="EDR-LINUX">EDR-LINUX</option>
                <option value="DNS-PROXY">DNS-PROXY</option>
                <option value="FIREWALL">FIREWALL</option>
                <option value="K8S-AUDIT">K8S-AUDIT</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setThreatsOnly((v) => !v);
                }}
                aria-pressed={threatsOnly}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  threatsOnly
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-500 text-rose-800 dark:text-rose-300'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <Filter className="w-3.5 h-3.5 shrink-0" />
                Alertes seules
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                role="tablist"
                aria-label="Filtre de sévérité"
                className="inline-flex flex-wrap items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                {(['ALL', 'CRITIQUE', 'HAUTE', 'MOYENNE', 'INFO'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    role="tab"
                    aria-selected={severityFilter === sev}
                    onClick={() => {
                      playClick();
                      setSeverityFilter(sev);
                    }}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      severityFilter === sev
                        ? 'bg-white dark:bg-slate-950 text-sky-800 dark:text-cyan-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {sev === 'ALL' ? 'Toutes sévérités' : sev}
                  </button>
                ))}
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                {filteredLogs.length} / {logs.length} événements affichés
              </span>
            </div>
          </div>

          {/* High-Density Tabular Log Grid */}
          {filteredLogs.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Aucun journal ne correspond à votre filtre actuel.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Élargissez votre requête ou injectez une attaque simulée ci-dessus.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSeverityFilter('ALL');
                  setSensorFilter('ALL');
                  setThreatsOnly(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 pl-4 pr-3 font-semibold whitespace-nowrap">Heure · ID</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Sévérité</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Île · Capteur</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Source → Cible</th>
                    <th className="py-2.5 px-3 font-semibold">Événement</th>
                    <th className="py-2.5 pl-3 pr-4 font-semibold text-right whitespace-nowrap">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
                  {filteredLogs.map((evt) => {
                    const isSelected = selectedLog?.id === evt.id;
                    return (
                      <tr
                        key={evt.id}
                        onClick={() => {
                          playClick();
                          setSelectedLogId(evt.id);
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-cyan-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="py-2.5 pl-4 pr-3 font-mono tabular-nums whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {evt.timestamp}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {evt.id}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {renderSeverityLabel(evt.severity)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {evt.islandName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {evt.sensor}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums whitespace-nowrap text-slate-700 dark:text-slate-300">
                          <div>{evt.srcIp}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            → {evt.dstIp}:{evt.port}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 min-w-[220px]">
                          <div className="text-slate-900 dark:text-slate-100 font-medium line-clamp-1">
                            {evt.summary}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {evt.protocol} · MITRE {evt.mitre}
                          </div>
                        </td>
                        <td className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
                          {renderTriageStatus(evt.triage)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right 4 columns: Event Inspector, IP Correlation & Analyst Triage */}
        <aside className="xl:col-span-4 space-y-5">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-700 dark:text-cyan-400 shrink-0" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Inspecteur d’investigation
                </h3>
              </div>
              {selectedLog && (
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {selectedLog.id}
                </span>
              )}
            </div>

            {!selectedLog ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                Sélectionnez un événement dans le tableau de gauche pour inspecter son journal brut
                et décider de la réponse SOC.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {renderSeverityLabel(selectedLog.severity)}
                  {renderTriageStatus(selectedLog.triage)}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {selectedLog.summary}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedLog.islandName} · {selectedLog.sensor} · MITRE {selectedLog.mitre}
                  </p>
                </div>

                {/* Key/Value Metadata Grid */}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">IP Source</dt>
                    <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {selectedLog.srcIp}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Cible &amp; Port</dt>
                    <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {selectedLog.dstIp}:{selectedLog.port}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Protocole</dt>
                    <dd className="font-mono text-slate-800 dark:text-slate-200">
                      {selectedLog.protocol}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Corrélation IP</dt>
                    <dd className="font-mono text-sky-700 dark:text-cyan-400 font-semibold tabular-nums">
                      {correlatedForSelectedIp.total} événement
                      {correlatedForSelectedIp.total > 1 ? 's' : ''} ·{' '}
                      {correlatedForSelectedIp.islands.length} île
                      {correlatedForSelectedIp.islands.length > 1 ? 's' : ''}
                    </dd>
                  </div>
                </dl>

                {/* Raw SIEM Log Snippet */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Journal brut SIEM
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyIoc(selectedLog)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 dark:text-cyan-400 hover:underline"
                    >
                      <Copy className="w-3 h-3 shrink-0" />
                      {copiedId === selectedLog.id ? 'IOC copié' : 'Copier l’IOC'}
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-950 text-cyan-200 border border-slate-800 text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all">
                    {selectedLog.rawPayload}
                  </pre>
                </div>

                {/* Pivot by IP shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setSearchQuery(selectedLog.srcIp);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:border-sky-500 dark:hover:border-cyan-400 transition-colors"
                >
                  <Search className="w-3.5 h-3.5 shrink-0" />
                  Pivoter sur tous les logs de {selectedLog.srcIp}
                </button>

                {/* Analyst Decision Buttons */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Décision d’investigation SOC :
                  </p>
                  {selectedLog.triage === 'pending' ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleQualifyThreat(selectedLog)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5 shrink-0" />
                        Qualifier comme attaque &amp; Bloquer {selectedLog.srcIp}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkBenign(selectedLog)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        Classer comme trafic légitime (Faux positif)
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        Analyse validée
                      </p>
                      <p>{selectedLog.analystExplanation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Active Firewall Blocklist */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                Liste de confinement pare-feu
              </h3>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {blockedIps.length} IP
              </span>
            </div>
            {blockedIps.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Aucune IP bloquée pour le moment. Qualifiez une attaque active pour confiner sa
                source dans tout l’archipel.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {blockedIps.map((ip) => (
                  <li key={ip} className="py-2 flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-rose-700 dark:text-rose-400 tabular-nums">
                      {ip}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUnblockIp(ip)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline"
                    >
                      Débloquer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};
