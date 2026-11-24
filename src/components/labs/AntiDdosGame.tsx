import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Flame,
  Gauge,
  Globe,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Users,
  Wand2,
  Zap,
} from 'lucide-react';
import { playClick, playError, playPacket, playSuccess, playVictory } from '../../utils/sound';

interface AntiDdosGameProps {
  onWinBonusXp: () => void;
  speedrunMode?: boolean;
}

type AttackVectorId = 'syn' | 'http' | 'udp';
type DefenseId = 'anycast' | 'syncookies' | 'ratelimit' | 'waf';

interface AttackScenario {
  id: AttackVectorId;
  name: string;
  layer: string;
  shortDesc: string;
  mechanism: string;
  rawVolumeLabel: string;
  baseAttackLoad: number; // 0..180 scale where 100 = server saturation capacity
  zombieCount: string;
  packetTag: string;
  recommendedDefenses: DefenseId[];
  mitigationWeights: Record<DefenseId, number>; // fraction of attack mitigated
  resolutionSteps: {
    defenseId: DefenseId;
    title: string;
    detail: string;
  }[];
  vulnerableSnippet: string;
  hardenedSnippet: string;
  configTitle: string;
}

interface DefenseControl {
  id: DefenseId;
  name: string;
  layer: string;
  shortEffect: string;
  mechanism: string;
  dropLabel: string;
}

interface TrafficSample {
  tick: number;
  incoming: number; // total load attempted (0..180)
  originLoad: number; // load reaching origin (0..100)
  blockedPct: number;
}

interface LogItem {
  id: number;
  time: string;
  level: 'alert' | 'defense' | 'info' | 'success';
  message: string;
}

interface VisualPacket {
  id: number;
  kind: 'attack' | 'legit';
  lane: number; // 0..3
  blocked: boolean;
  serverTimeout: boolean;
  dropTag: string;
  progress: number; // 0..100
}

const ATTACK_SCENARIOS: Record<AttackVectorId, AttackScenario> = {
  syn: {
    id: 'syn',
    name: 'SYN Flood (TCP)',
    layer: 'Couche 4 · Transport',
    shortDesc: 'Saturation des demi-connexions TCP (SYN sans ACK)',
    mechanism:
      'Le botnet inonde le port 443 de paquets TCP SYN avec des IP sources falsifiées. Le serveur réserve de la RAM pour chaque demi-connexion en attente d’un ACK qui n’arrive jamais, bloquant les vrais visiteurs.',
    rawVolumeLabel: '140 000 SYN/s',
    baseAttackLoad: 145,
    zombieCount: '18 400 IP zombies',
    packetTag: 'TCP SYN',
    recommendedDefenses: ['syncookies', 'anycast'],
    mitigationWeights: {
      syncookies: 0.62,
      anycast: 0.35,
      ratelimit: 0.08,
      waf: 0.03,
    },
    resolutionSteps: [
      {
        defenseId: 'syncookies',
        title: '1. Activer les SYN Cookies noyau (L4)',
        detail:
          'Le serveur ne stocke plus l’état en RAM : il encode la session dans un cookie cryptographique TCP. Les faux paquets SYN n’épuisent plus la table de connexions.',
      },
      {
        defenseId: 'anycast',
        title: '2. Activer le Scrubbing Anycast (L3/L4)',
        detail:
          'Le trafic SYN massif est absorbé et filtré sur des dizaines de points de présence mondiaux avant d’atteindre la ligne réseau du serveur d’origine.',
      },
    ],
    configTitle: 'Noyau Linux (/etc/sysctl.conf) · Protection SYN Flood',
    vulnerableSnippet: `# Serveur exposé (vulnérable)
net.ipv4.tcp_syncookies = 0
net.ipv4.tcp_max_syn_backlog = 128
# Résultat : file SYN saturée en 2 secondes`,
    hardenedSnippet: `# Serveur protégé (résilient)
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.tcp_synack_retries = 2
# + Annonce BGP Anycast vers centre de nettoyage`,
  },
  http: {
    id: 'http',
    name: 'HTTP Flood (Applicatif)',
    layer: 'Couche 7 · Application',
    shortDesc: 'Rafale de requêtes GET/POST simulant des navigateurs',
    mechanism:
      'Les machines zombies établissent de vraies connexions TCP/TLS puis bombardent /api/billets et /recherche. Chaque requête déclenche des calculs CPU et base de données jusqu’au crash (HTTP 503).',
    rawVolumeLabel: '68 000 req/s',
    baseAttackLoad: 155,
    zombieCount: '9 600 navigateurs headless',
    packetTag: 'GET /api',
    recommendedDefenses: ['ratelimit', 'waf', 'anycast'],
    mitigationWeights: {
      waf: 0.52,
      ratelimit: 0.38,
      anycast: 0.14,
      syncookies: 0.02,
    },
    resolutionSteps: [
      {
        defenseId: 'ratelimit',
        title: '1. Activer le Rate Limiting par IP (HTTP 429)',
        detail:
          'Chaque adresse IP est plafonnée à 20 requêtes/seconde. Les rafales anormales reçoivent immédiatement un code HTTP 429 sans solliciter la base de données.',
      },
      {
        defenseId: 'waf',
        title: '2. Activer le WAF Anti-Bot & Challenge JS/TLS',
        detail:
          'Le pare-feu applicatif vérifie l’empreinte TLS et exécute un micro-défi JavaScript transparent : les bots automatisés échouent et sont bloqués en périphérie.',
      },
      {
        defenseId: 'anycast',
        title: '3. Mettre en cache les pages statiques via CDN',
        detail:
          'Les ressources répétitives sont servies directement par le cache CDN, ramenant le CPU du serveur d’origine sous les 25 %.',
      },
    ],
    configTitle: 'Reverse Proxy Nginx · Rate Limiting & WAF',
    vulnerableSnippet: `# Reverse proxy sans limite (vulnérable)
location /api/ {
    proxy_pass http://origin_backend;
    # Aucune limite par IP ni filtrage bot
}`,
    hardenedSnippet: `# Protection L7 : Rate Limit + WAF Edge
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;

location /api/ {
    limit_req zone=api_limit burst=30 nodelay;
    limit_req_status 429;
    proxy_pass http://origin_backend;
}`,
  },
  udp: {
    id: 'udp',
    name: 'Amplification DNS / UDP',
    layer: 'Couche 3/4 · Volumétrique',
    shortDesc: 'Réflexion UDP ×40 saturant la bande passante réseau',
    mechanism:
      'L’attaquant envoie de minuscules requêtes DNS (60 octets) à des serveurs mal configurés en usurpant l’IP de Cyberland. Ces réflecteurs renvoient chacun 2 400 octets (facteur ×40), étouffant le lien Internet.',
    rawVolumeLabel: '48 Gbps (×40)',
    baseAttackLoad: 170,
    zombieCount: '4 200 réflecteurs DNS',
    packetTag: 'UDP 53 ×40',
    recommendedDefenses: ['anycast', 'syncookies'],
    mitigationWeights: {
      anycast: 0.68,
      syncookies: 0.29,
      ratelimit: 0.04,
      waf: 0.01,
    },
    resolutionSteps: [
      {
        defenseId: 'anycast',
        title: '1. Basculer le trafic sur le CDN Anycast (Scrubbing)',
        detail:
          'Au lieu de frapper une seule liaison de 10 Gbps, les 48 Gbps sont dilués sur 60 centres de nettoyage mondiaux capables d’absorber des Térabits/s.',
      },
      {
        defenseId: 'syncookies',
        title: '2. Appliquer le filtrage L4 UDP / BGP Flowspec',
        detail:
          'Les règles réseau jettent automatiquement les paquets UDP fragmentés et les réponses DNS non sollicitées (port source 53) avant même le pare-feu interne.',
      },
    ],
    configTitle: 'Filtrage Réseau · BGP Flowspec & Pare-feu L4',
    vulnerableSnippet: `# Lien unique exposé sans filtrage UDP
# Lien WAN 10 Gbps saturé à 48 Gbps par réponses UDP/53
iptables -P INPUT ACCEPT`,
    hardenedSnippet: `# Filtrage volumétrique en amont (Edge / Flowspec)
# 1. Rejeter les réponses DNS amplifiées non sollicitées
iptables -A INPUT -p udp --sport 53 -m state --state NEW -j DROP
# 2. Routage Anycast BGP vers Scrubbing Center (capacité 2 Tbps)`,
  },
};

const DEFENSE_CONTROLS: DefenseControl[] = [
  {
    id: 'anycast',
    name: 'CDN Anycast & Scrubbing',
    layer: 'L3/L4 · Périphérie',
    shortEffect: 'Dilue le volume massif et met en cache',
    mechanism: 'Répartit le trafic sur des dizaines de PoP et nettoie les flux volumétriques.',
    dropLabel: 'SCRUBBED',
  },
  {
    id: 'syncookies',
    name: 'SYN Cookies & Filtre L4',
    layer: 'L4 · Noyau TCP/UDP',
    shortEffect: 'Neutralise SYN Flood & paquets UDP forgés',
    mechanism: 'Valide les handshakes TCP sans RAM et filtre les paquets UDP non sollicités.',
    dropLabel: 'DROP L4',
  },
  {
    id: 'ratelimit',
    name: 'Rate Limiting par IP',
    layer: 'L7 · Reverse Proxy',
    shortEffect: 'Plafonne les rafales abusives (HTTP 429)',
    mechanism: 'Limite à 20 req/s par IP source et rejette les excès avant le backend.',
    dropLabel: 'HTTP 429',
  },
  {
    id: 'waf',
    name: 'WAF Anti-Bot & Challenge',
    layer: 'L7 · Applicatif',
    shortEffect: 'Bloque les bots HTTP via empreinte JS/TLS',
    mechanism: 'Distingue les navigateurs humains des scripts zombies en temps réel.',
    dropLabel: 'WAF BLOCK',
  },
];

const INITIAL_DEFENSES: Record<DefenseId, boolean> = {
  anycast: false,
  syncookies: false,
  ratelimit: false,
  waf: false,
};

function nowStamp(): string {
  const d = new Date();
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const AntiDdosGame: React.FC<AntiDdosGameProps> = ({
  onWinBonusXp,
  speedrunMode = false,
}) => {
  const [scenarioId, setScenarioId] = useState<AttackVectorId>('http');
  const [isRunning, setIsRunning] = useState(true);
  const [attackActive, setAttackActive] = useState(true);
  const [defenses, setDefenses] = useState<Record<DefenseId, boolean>>(INITIAL_DEFENSES);

  const [tick, setTick] = useState(0);
  const [originCpu, setOriginCpu] = useState(96);
  const [latencyMs, setLatencyMs] = useState(2150);
  const [serverHealth, setServerHealth] = useState(64);
  const [blockedTotal, setBlockedTotal] = useState(0);
  const [servedLegitTotal, setServedLegitTotal] = useState(140);
  const [droppedLegitTotal, setDroppedLegitTotal] = useState(48);

  const [stableTicks, setStableTicks] = useState(0);
  const [mitigatedVictory, setMitigatedVictory] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [isAutoSolving, setIsAutoSolving] = useState(false);
  const [autoSolveStepIndex, setAutoSolveStepIndex] = useState<number | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<'logs' | 'config'>('logs');

  const [history, setHistory] = useState<TrafficSample[]>(() =>
    Array.from({ length: 18 }, (_, i) => ({
      tick: i,
      incoming: i < 4 ? 22 : 148 + (i % 3) * 6,
      originLoad: i < 4 ? 22 : 97,
      blockedPct: 0,
    }))
  );

  const [packets, setPackets] = useState<VisualPacket[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([
    {
      id: 1,
      time: nowStamp(),
      level: 'alert',
      message: 'Alerte SOC : pic anormal HTTP Flood détecté (68 000 req/s sur /api/billets). Serveur saturé (HTTP 503).',
    },
    {
      id: 2,
      time: nowStamp(),
      level: 'info',
      message: 'Activez les défenses adaptées à gauche ou lancez la « Démo résolution guidée » pour observer la reprise en direct.',
    },
  ]);

  const packetIdRef = useRef(1);
  const logIdRef = useRef(3);
  const autoTimersRef = useRef<number[]>([]);

  const scenario = ATTACK_SCENARIOS[scenarioId];

  const appendLog = (level: LogItem['level'], message: string) => {
    logIdRef.current += 1;
    setLogs((prev) => [{ id: logIdRef.current, time: nowStamp(), level, message }, ...prev].slice(0, 14));
  };

  // Calculate mitigation effectiveness (0..0.97) for active scenario + enabled defenses
  const mitigationStats = useMemo(() => {
    let rawRatio = 0;
    const activeDropTags: string[] = [];

    (Object.keys(defenses) as DefenseId[]).forEach((defId) => {
      if (defenses[defId]) {
        const w = scenario.mitigationWeights[defId];
        rawRatio += w;
        if (w >= 0.14) {
          const ctrl = DEFENSE_CONTROLS.find((d) => d.id === defId);
          if (ctrl) activeDropTags.push(ctrl.dropLabel);
        }
      }
    });

    const clampedRatio = Math.min(0.97, rawRatio);
    const activeCount = Object.values(defenses).filter(Boolean).length;
    const recommendedActiveCount = scenario.recommendedDefenses.filter((id) => defenses[id]).length;
    const allRecommendedEnabled = recommendedActiveCount === scenario.recommendedDefenses.length;

    return {
      ratio: clampedRatio,
      pct: Math.round(clampedRatio * 100),
      activeCount,
      recommendedActiveCount,
      allRecommendedEnabled,
      primaryDropTag: activeDropTags[0] || 'BLOCKED',
    };
  }, [defenses, scenario]);

  const clearAutoTimers = () => {
    autoTimersRef.current.forEach((id) => window.clearTimeout(id));
    autoTimersRef.current = [];
  };

  useEffect(() => {
    return () => clearAutoTimers();
  }, []);

  // Main live telemetry tick (480ms)
  useEffect(() => {
    if (!isRunning) return;

    const timer = window.setInterval(() => {
      setTick((prev) => prev + 1);

      const jitter = Math.sin(Date.now() / 600) * 6 + (Math.random() * 8 - 4);
      const legitBaseLoad = 18;
      const incomingAttack = attackActive ? Math.max(40, scenario.baseAttackLoad + jitter) : 0;
      const filteredAttack = incomingAttack * mitigationStats.ratio;
      const leakedAttack = incomingAttack - filteredAttack;
      const targetCpu = Math.min(100, Math.max(12, Math.round(legitBaseLoad + leakedAttack)));

      // Smoothly transition CPU and latency
      setOriginCpu((prev) => Math.round(prev * 0.45 + targetCpu * 0.55));

      const targetLatency =
        targetCpu >= 92
          ? Math.round(1900 + Math.random() * 900)
          : targetCpu >= 70
            ? Math.round(420 + (targetCpu - 70) * 45)
            : Math.round(24 + targetCpu * 1.1);
      setLatencyMs((prev) => Math.round(prev * 0.45 + targetLatency * 0.55));

      // Server health drains under heavy load, recovers when mitigated
      setServerHealth((prev) => {
        if (targetCpu >= 85) return Math.max(8, prev - 4);
        if (targetCpu >= 65) return Math.max(18, prev - 2);
        return Math.min(100, prev + 6);
      });

      // Counters
      if (attackActive) {
        const blockedThisTick = Math.round(filteredAttack * 48);
        setBlockedTotal((prev) => prev + blockedThisTick);
      }

      if (targetCpu >= 88) {
        setDroppedLegitTotal((prev) => prev + Math.round(12 + Math.random() * 8));
        setServedLegitTotal((prev) => prev + 2);
      } else {
        setServedLegitTotal((prev) => prev + Math.round(18 + Math.random() * 7));
      }

      setHistory((prev) => {
        const nextTick = (prev[prev.length - 1]?.tick ?? 0) + 1;
        return [
          ...prev.slice(1),
          {
            tick: nextTick,
            incoming: Math.round(legitBaseLoad + incomingAttack),
            originLoad: targetCpu,
            blockedPct: attackActive ? mitigationStats.pct : 100,
          },
        ];
      });

      // Track stabilization toward victory
      const neededTicks = speedrunMode ? 2 : 6;
      if (attackActive && targetCpu <= 42 && mitigationStats.pct >= 88) {
        setStableTicks((prev) => {
          const next = Math.min(neededTicks, prev + 1);
          if (next === neededTicks && !mitigatedVictory) {
            setMitigatedVictory(true);
            playVictory();
            if (!xpAwarded) {
              setXpAwarded(true);
              onWinBonusXp();
            }
          }
          return next;
        });
      } else if (!mitigatedVictory) {
        setStableTicks((prev) => Math.max(0, prev - 1));
      }
    }, 480);

    return () => window.clearInterval(timer);
  }, [isRunning, attackActive, scenario, mitigationStats, mitigatedVictory, xpAwarded, onWinBonusXp, speedrunMode]);

  // Fast packet particle animator (70ms) for smooth real-time network flow visualization
  useEffect(() => {
    if (!isRunning) return;

    const animTimer = window.setInterval(() => {
      setPackets((prev) => {
        const moved = prev
          .map((p) => {
            const speed = p.kind === 'attack' ? 7.5 : 5.8;
            return { ...p, progress: p.progress + speed };
          })
          .filter((p) => {
            if (p.blocked) return p.progress <= 58; // stops & dissipates at shield
            if (p.serverTimeout) return p.progress <= 92;
            return p.progress <= 104;
          });

        const nextPackets = [...moved];

        // Spawn botnet attack packets
        if (attackActive) {
          const spawnCount = 2;
          for (let i = 0; i < spawnCount; i += 1) {
            if (nextPackets.length < 34) {
              packetIdRef.current += 1;
              const isBlocked = Math.random() < mitigationStats.ratio;
              nextPackets.push({
                id: packetIdRef.current,
                kind: 'attack',
                lane: Math.floor(Math.random() * 3),
                blocked: isBlocked,
                serverTimeout: false,
                dropTag: mitigationStats.primaryDropTag,
                progress: Math.random() * 6,
              });
            }
          }
        }

        // Spawn legitimate user packets
        if (Math.random() < 0.52 && nextPackets.length < 38) {
          packetIdRef.current += 1;
          nextPackets.push({
            id: packetIdRef.current,
            kind: 'legit',
            lane: 3,
            blocked: false,
            serverTimeout: originCpu >= 88,
            dropTag: '503',
            progress: 0,
          });
        }

        return nextPackets;
      });
    }, 70);

    return () => window.clearInterval(animTimer);
  }, [isRunning, attackActive, mitigationStats.ratio, mitigationStats.primaryDropTag, originCpu]);

  const handleSelectScenario = (nextId: AttackVectorId) => {
    if (nextId === scenarioId) return;
    playClick();
    clearAutoTimers();
    setIsAutoSolving(false);
    setAutoSolveStepIndex(null);
    setScenarioId(nextId);
    setDefenses(INITIAL_DEFENSES);
    setAttackActive(true);
    setIsRunning(true);
    setOriginCpu(96);
    setLatencyMs(2200);
    setServerHealth(62);
    setStableTicks(0);
    setMitigatedVictory(false);
    setPackets([]);
    const nextScenario = ATTACK_SCENARIOS[nextId];
    appendLog(
      'alert',
      `Nouvelle attaque lancée : ${nextScenario.name} (${nextScenario.rawVolumeLabel}). Le serveur d'origine est saturé.`
    );
  };

  const toggleDefense = (defId: DefenseId) => {
    clearAutoTimers();
    setIsAutoSolving(false);
    setAutoSolveStepIndex(null);

    setDefenses((prev) => {
      const nextVal = !prev[defId];
      const ctrl = DEFENSE_CONTROLS.find((d) => d.id === defId)!;
      const weight = scenario.mitigationWeights[defId];

      if (nextVal) {
        if (weight >= 0.25) {
          playSuccess();
          appendLog(
            'defense',
            `${ctrl.name} activé : filtre ~${Math.round(weight * 100)} % de cette attaque ${scenario.name} (${ctrl.dropLabel}).`
          );
        } else {
          playPacket();
          appendLog(
            'info',
            `${ctrl.name} activé, mais impact faible (~${Math.round(weight * 100)} %) face à une attaque ${scenario.layer}.`
          );
        }
      } else {
        playError();
        appendLog('alert', `${ctrl.name} désactivé : exposition accrue du serveur d'origine.`);
      }

      return { ...prev, [defId]: nextVal };
    });
  };

  const handleReset = () => {
    playClick();
    clearAutoTimers();
    setIsAutoSolving(false);
    setAutoSolveStepIndex(null);
    setDefenses(INITIAL_DEFENSES);
    setAttackActive(true);
    setIsRunning(true);
    setOriginCpu(96);
    setLatencyMs(2180);
    setServerHealth(62);
    setBlockedTotal(0);
    setStableTicks(0);
    setMitigatedVictory(false);
    setPackets([]);
    appendLog('alert', `Simulation réinitialisée : attaque ${scenario.name} sans protection active.`);
  };

  const handleGuidedResolution = () => {
    playClick();
    clearAutoTimers();
    setDefenses(INITIAL_DEFENSES);
    setAttackActive(true);
    setIsRunning(true);
    setOriginCpu(96);
    setLatencyMs(2250);
    setServerHealth(58);
    setStableTicks(0);
    setMitigatedVictory(false);
    setIsAutoSolving(true);
    setAutoSolveStepIndex(0);

    appendLog(
      'info',
      `Démo de résolution guidée démarrée pour ${scenario.name} : observation de l'attaque brute puis activation étape par étape.`
    );

    scenario.resolutionSteps.forEach((step, idx) => {
      const timerId = window.setTimeout(() => {
        playSuccess();
        setAutoSolveStepIndex(idx + 1);
        setDefenses((prev) => ({ ...prev, [step.defenseId]: true }));
        appendLog('defense', `${step.title} — ${step.detail}`);

        if (idx === scenario.resolutionSteps.length - 1) {
          const doneTimer = window.setTimeout(() => {
            setIsAutoSolving(false);
            appendLog(
              'success',
              `Résolution complète : le trafic malveillant est absorbé en périphérie et le serveur répond en HTTP 200 OK.`
            );
          }, 1800);
          autoTimersRef.current.push(doneTimer);
        }
      }, 1500 + idx * 2100);
      autoTimersRef.current.push(timerId);
    });
  };

  const serverStatus =
    originCpu >= 85
      ? {
          label: 'SATURÉ · HTTP 503',
          short: 'Saturé',
          badgeClass: 'text-rose-700 dark:text-rose-300 bg-rose-500/12 border-rose-500/30',
          barClass: 'bg-rose-500',
        }
      : originCpu >= 50
        ? {
            label: 'SOUS PRESSION · DÉGRADÉ',
            short: 'Dégradé',
            badgeClass: 'text-amber-700 dark:text-amber-300 bg-amber-500/12 border-amber-500/30',
            barClass: 'bg-amber-500',
          }
        : {
            label: 'PROTÉGÉ · HTTP 200 OK',
            short: 'Stable',
            badgeClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/12 border-emerald-500/30',
            barClass: 'bg-emerald-500',
          };

  // Build SVG polyline points for live traffic graph
  const chartWidth = 420;
  const chartHeight = 116;
  const maxLoad = 190;
  const thresholdY = chartHeight - (100 / maxLoad) * chartHeight;

  const incomingPoints = history
    .map((pt, idx) => {
      const x = (idx / Math.max(1, history.length - 1)) * chartWidth;
      const y = chartHeight - (Math.min(maxLoad, pt.incoming) / maxLoad) * chartHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const originPoints = history
    .map((pt, idx) => {
      const x = (idx / Math.max(1, history.length - 1)) * chartWidth;
      const y = chartHeight - (Math.min(maxLoad, pt.originLoad) / maxLoad) * chartHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const originAreaPath = `M 0,${chartHeight} L ${originPoints} L ${chartWidth},${chartHeight} Z`;

  return (
    <div className="space-y-5">
      {/* Header & Attack Vector Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Simulation d’Attaque DDoS en Temps Réel &amp; Remédiation
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Observez un botnet saturer le serveur Cyberland en direct, puis activez les contre-mesures réseau et applicatives pour rétablir le service.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!speedrunMode ? (
            <button
              type="button"
              onClick={handleGuidedResolution}
              disabled={isAutoSolving}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              {isAutoSolving ? 'Résolution en cours...' : 'Démo : Comment résoudre'}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              Speedrun · Résolution manuelle
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              playClick();
              setIsRunning((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Pause' : 'Reprendre'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Scenario Switcher (3 Real DDoS Vectors) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.keys(ATTACK_SCENARIOS) as AttackVectorId[]).map((id) => {
          const item = ATTACK_SCENARIOS[id];
          const isSelected = id === scenarioId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelectScenario(id)}
              className={`text-left p-3.5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-rose-50 dark:bg-rose-950/35 border-rose-400 dark:border-rose-500/60 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Flame className={`w-4 h-4 ${isSelected ? 'text-rose-500' : 'text-slate-400'}`} />
                  {item.name}
                </span>
                <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                  {item.layer}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                {item.shortDesc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Victory Banner when DDoS is neutralized */}
      {mitigatedVictory && (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700/70 bg-emerald-50 dark:bg-emerald-950/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold text-sm sm:text-base text-emerald-900 dark:text-emerald-200">
                Attaque {scenario.name} neutralisée avec succès ! (+100 XP Cyberland)
              </div>
              <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300/90 mt-0.5">
                {mitigationStats.pct} % du trafic botnet est désormais filtré avant le serveur d’origine. Les visiteurs légitimes accèdent de nouveau au site en {latencyMs} ms.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const order: AttackVectorId[] = ['http', 'syn', 'udp'];
              const next = order[(order.indexOf(scenarioId) + 1) % order.length];
              handleSelectScenario(next);
            }}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
          >
            Tester l’attaque suivante
          </button>
        </div>
      )}

      {/* Live Telemetry Strip (4 crisp KPI metrics with tabular-nums) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Trafic d’attaque</span>
            <Zap className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-1.5 text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {attackActive ? scenario.rawVolumeLabel : '0 req/s'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {attackActive ? scenario.zombieCount : 'Attaque stoppée'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Trafic filtré (Mitigation)</span>
            <Shield className="w-4 h-4 text-indigo-500" />
          </div>
          <div
            className={`mt-1.5 text-lg sm:text-xl font-black tabular-nums ${
              mitigationStats.pct >= 85
                ? 'text-emerald-600 dark:text-emerald-400'
                : mitigationStats.pct >= 40
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {mitigationStats.pct} %
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {blockedTotal.toLocaleString('fr-FR')} paquets bloqués
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>CPU Serveur d’origine</span>
            <Cpu className="w-4 h-4 text-sky-500" />
          </div>
          <div
            className={`mt-1.5 text-lg sm:text-xl font-black tabular-nums ${
              originCpu >= 85
                ? 'text-rose-600 dark:text-rose-400'
                : originCpu >= 50
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {originCpu} %
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${serverStatus.barClass}`}
              style={{ width: `${originCpu}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Latence clients</span>
            <Gauge className="w-4 h-4 text-emerald-500" />
          </div>
          <div
            className={`mt-1.5 text-lg sm:text-xl font-black tabular-nums ${
              latencyMs >= 900
                ? 'text-rose-600 dark:text-rose-400'
                : latencyMs >= 220
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {latencyMs >= 1000 ? `${(latencyMs / 1000).toFixed(1)} s` : `${latencyMs} ms`}
          </div>
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
            {serverStatus.label}
          </div>
        </div>
      </div>

      {/* Main Live Stage: Animated Network Topology + Real-Time Remediation Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left / Main Visual Stage (7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          {/* Animated Packet Flow Topology */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-4 sm:p-5 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Activity className="w-4 h-4 text-cyan-400" />
                Flux réseau temps réel · {scenario.name}
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Botnet ({scenario.packetTag})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Clients légitimes
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setAttackActive((v) => !v);
                    appendLog(
                      attackActive ? 'info' : 'alert',
                      attackActive
                        ? 'Simulation d’attaque mise en veille : trafic normal uniquement.'
                        : `Relance de la vague ${scenario.name} !`
                    );
                  }}
                  className="px-2 py-0.5 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors"
                >
                  {attackActive ? 'Couper botnet' : 'Relancer botnet'}
                </button>
              </div>
            </div>

            {/* Responsive SVG Flow Canvas */}
            <div className="relative w-full">
              <svg
                viewBox="0 0 760 270"
                className="w-full h-auto select-none"
                role="img"
                aria-label="Schéma animé du trafic DDoS, de la couche de mitigation et du serveur d'origine"
              >
                <defs>
                  <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={mitigationStats.activeCount > 0 ? '#6366f1' : '#334155'} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={mitigationStats.activeCount > 0 ? '#06b6d4' : '#1e293b'} stopOpacity="0.12" />
                  </linearGradient>
                </defs>

                {/* Subtle grid lines */}
                <line x1="175" y1="54" x2="585" y2="118" stroke="#1e293b" strokeWidth="2" strokeDasharray="5 5" />
                <line x1="175" y1="86" x2="585" y2="130" stroke="#1e293b" strokeWidth="2" strokeDasharray="5 5" />
                <line x1="175" y1="118" x2="585" y2="142" stroke="#1e293b" strokeWidth="2" strokeDasharray="5 5" />
                <line x1="175" y1="212" x2="585" y2="162" stroke="#065f46" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="5 5" />

                {/* Left Node 1: Botnet */}
                <g transform="translate(14, 24)">
                  <rect
                    width="162"
                    height="112"
                    rx="14"
                    fill="#1e1018"
                    stroke={attackActive ? '#f43f5e' : '#475569'}
                    strokeWidth="2"
                  />
                  <text x="16" y="30" fill="#fda4af" fontSize="12" fontWeight="700">
                    BOTNET MONDIAL
                  </text>
                  <text x="16" y="52" fill="#ffffff" fontSize="15" fontWeight="800">
                    {attackActive ? scenario.rawVolumeLabel : 'Inactif'}
                  </text>
                  <text x="16" y="72" fill="#cbd5e1" fontSize="11">
                    {scenario.zombieCount}
                  </text>
                  <rect x="16" y="82" width="130" height="20" rx="5" fill="#4c0519" />
                  <text x="81" y="96" textAnchor="middle" fill="#fecdd3" fontSize="10.5" fontFamily="monospace" fontWeight="700">
                    {scenario.packetTag}
                  </text>
                </g>

                {/* Left Node 2: Legitimate Users */}
                <g transform="translate(14, 168)">
                  <rect width="162" height="82" rx="14" fill="#071f1a" stroke="#10b981" strokeWidth="1.8" />
                  <text x="16" y="28" fill="#6ee7b7" fontSize="11.5" fontWeight="700">
                    CLIENTS LÉGITIMES
                  </text>
                  <text x="16" y="48" fill="#ffffff" fontSize="13.5" fontWeight="700">
                    {servedLegitTotal} servis · {droppedLegitTotal} 503
                  </text>
                  <text x="16" y="66" fill="#a7f3d0" fontSize="10.5">
                    {originCpu >= 88 ? 'Accès coupé (Timeout)' : 'Navigation fluide (200 OK)'}
                  </text>
                </g>

                {/* Center Node: Mitigation Shield Layer */}
                <g transform="translate(302, 18)">
                  <rect
                    width="156"
                    height="234"
                    rx="16"
                    fill="url(#shieldGrad)"
                    stroke={mitigationStats.pct >= 85 ? '#34d399' : mitigationStats.activeCount > 0 ? '#818cf8' : '#475569'}
                    strokeWidth="2"
                  />
                  <text x="78" y="30" textAnchor="middle" fill="#e2e8f0" fontSize="11.5" fontWeight="800">
                    BOUCLIER ANTI-DDOS
                  </text>
                  <text
                    x="78"
                    y="48"
                    textAnchor="middle"
                    fill={mitigationStats.pct >= 85 ? '#6ee7b7' : mitigationStats.activeCount > 0 ? '#a5b4fc' : '#94a3b8'}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    {mitigationStats.activeCount === 0
                      ? 'AUCUNE DÉFENSE'
                      : `FILTRAGE ${mitigationStats.pct} %`}
                  </text>

                  {/* 4 mini status slots inside the shield */}
                  {DEFENSE_CONTROLS.map((ctrl, idx) => {
                    const isOn = defenses[ctrl.id];
                    const isRec = scenario.recommendedDefenses.includes(ctrl.id);
                    const y = 64 + idx * 40;
                    return (
                      <g key={ctrl.id} transform={`translate(12, ${y})`}>
                        <rect
                          width="132"
                          height="32"
                          rx="8"
                          fill={isOn ? (isRec ? '#064e3b' : '#1e293b') : '#0f172a'}
                          stroke={isOn ? (isRec ? '#34d399' : '#6366f1') : '#334155'}
                          strokeWidth="1.2"
                        />
                        <text x="10" y="14" fill={isOn ? '#ffffff' : '#64748b'} fontSize="9.5" fontWeight="700">
                          {ctrl.name.slice(0, 18)}
                        </text>
                        <text
                          x="10"
                          y="26"
                          fill={isOn ? (isRec ? '#6ee7b7' : '#a5b4fc') : '#475569'}
                          fontSize="8.8"
                          fontFamily="monospace"
                        >
                          {isOn ? `ACTIF · ${ctrl.dropLabel}` : 'INACTIF'}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Right Node: Cyberland Origin Server */}
                <g transform="translate(580, 56)">
                  <rect
                    width="166"
                    height="158"
                    rx="16"
                    fill={originCpu >= 85 ? '#2a0a12' : originCpu >= 50 ? '#231908' : '#062019'}
                    stroke={originCpu >= 85 ? '#f43f5e' : originCpu >= 50 ? '#f59e0b' : '#10b981'}
                    strokeWidth="2.4"
                  />
                  <text x="83" y="28" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="700">
                    SERVEUR D’ORIGINE
                  </text>
                  <text x="83" y="47" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="800">
                    cyberland.app
                  </text>

                  {/* CPU Gauge Bar */}
                  <text x="18" y="74" fill="#94a3b8" fontSize="10.5" fontWeight="600">
                    CPU
                  </text>
                  <text x="148" y="74" textAnchor="end" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="700">
                    {originCpu}%
                  </text>
                  <rect x="18" y="80" width="130" height="8" rx="4" fill="#1e293b" />
                  <rect
                    x="18"
                    y="80"
                    width={Math.max(6, (originCpu / 100) * 130)}
                    height="8"
                    rx="4"
                    fill={originCpu >= 85 ? '#f43f5e' : originCpu >= 50 ? '#f59e0b' : '#10b981'}
                  />

                  {/* Health Bar */}
                  <text x="18" y="108" fill="#94a3b8" fontSize="10.5" fontWeight="600">
                    SANTÉ
                  </text>
                  <text x="148" y="108" textAnchor="end" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="700">
                    {serverHealth}%
                  </text>
                  <rect x="18" y="114" width="130" height="8" rx="4" fill="#1e293b" />
                  <rect
                    x="18"
                    y="114"
                    width={Math.max(6, (serverHealth / 100) * 130)}
                    height="8"
                    rx="4"
                    fill={serverHealth <= 35 ? '#f43f5e' : serverHealth <= 65 ? '#f59e0b' : '#34d399'}
                  />

                  {/* Status Pill inside server card */}
                  <rect
                    x="18"
                    y="130"
                    width="130"
                    height="20"
                    rx="6"
                    fill={originCpu >= 85 ? '#881337' : originCpu >= 50 ? '#78350f' : '#065f46'}
                  />
                  <text x="83" y="144" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="700">
                    {originCpu >= 85 ? 'HTTP 503 SATURÉ' : originCpu >= 50 ? 'LENT / DÉGRADÉ' : 'HTTP 200 OK'}
                  </text>
                </g>

                {/* Live Animated Packets */}
                {packets.map((pkt) => {
                  const t = Math.min(1, pkt.progress / 100);
                  const startX = 176;
                  const endX = 580;
                  const x = startX + (endX - startX) * t;

                  let startY = 86;
                  let endY = 130;
                  if (pkt.kind === 'attack') {
                    startY = 54 + pkt.lane * 32;
                    endY = 116 + pkt.lane * 14;
                  } else {
                    startY = 212;
                    endY = 162;
                  }

                  const y = startY + (endY - startY) * t;

                  // Blocked packet hits the shield around progress 42..58
                  if (pkt.blocked && pkt.progress >= 40) {
                    const fade = Math.max(0, 1 - (pkt.progress - 40) / 18);
                    return (
                      <g key={pkt.id} opacity={fade}>
                        <circle cx={304} cy={y} r={8 + (1 - fade) * 6} fill="none" stroke="#818cf8" strokeWidth="2" />
                        <text
                          x={296}
                          y={y - 8}
                          textAnchor="end"
                          fill="#a5b4fc"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="700"
                        >
                          {pkt.dropTag}
                        </text>
                      </g>
                    );
                  }

                  // Legit packet fails with 503 near overloaded server
                  if (pkt.kind === 'legit' && pkt.serverTimeout && pkt.progress >= 82) {
                    const fade = Math.max(0, 1 - (pkt.progress - 82) / 12);
                    return (
                      <g key={pkt.id} opacity={fade}>
                        <text x={568} y={y - 6} textAnchor="end" fill="#fda4af" fontSize="9.5" fontFamily="monospace" fontWeight="700">
                          503
                        </text>
                        <circle cx={x} cy={y} r="5" fill="#fb7185" />
                      </g>
                    );
                  }

                  return (
                    <circle
                      key={pkt.id}
                      cx={x}
                      cy={y}
                      r={pkt.kind === 'attack' ? 4.4 : 5}
                      fill={pkt.kind === 'attack' ? '#f43f5e' : '#34d399'}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Stabilization progress bar */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="text-slate-300">
                <span className="font-bold text-white">Objectif de défense :</span> filtrer ≥ 88 % du botnet et ramener le CPU serveur sous 42 %.
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  Stabilisation {Math.round((stableTicks / 6) * 100)} %
                </span>
                <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${(stableTicks / 6) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Traffic Graph: Raw Incoming vs Origin Server Load */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                Courbe temps réel : Trafic brut vs Charge serveur
              </h3>
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-500 inline-block" />
                  Trafic brut entrant
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded-xs bg-indigo-500/70 inline-block" />
                  Charge serveur
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-amber-500 inline-block" />
                  Seuil 503
                </span>
              </div>
            </div>

            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-28 overflow-visible">
              {/* Saturation threshold line */}
              <line
                x1="0"
                y1={thresholdY}
                x2={chartWidth}
                y2={thresholdY}
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <text x="6" y={thresholdY - 4} fill="#d97706" fontSize="9.5" fontFamily="monospace" fontWeight="700">
                Capacité max serveur (100 %)
              </text>

              {/* Origin load filled area */}
              <path
                d={originAreaPath}
                fill={originCpu >= 85 ? 'rgba(244,63,94,0.22)' : 'rgba(16,185,129,0.22)'}
              />
              <polyline
                fill="none"
                stroke={originCpu >= 85 ? '#f43f5e' : '#10b981'}
                strokeWidth="2.4"
                points={originPoints}
              />

              {/* Incoming attack dashed line */}
              <polyline
                fill="none"
                stroke="#fb7185"
                strokeWidth="1.8"
                strokeDasharray="5 3"
                points={incomingPoints}
              />
            </svg>
          </div>
        </div>

        {/* Right Column: Live Remediation Controls + Step-by-Step Guide (5 cols) */}
        <div className="xl:col-span-5 space-y-4">
          {/* Interactive Defense Switches */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                Contre-mesures en temps réel
              </h3>
              <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                {mitigationStats.activeCount}/4 actives
              </span>
            </div>

            <div className="space-y-2.5">
              {DEFENSE_CONTROLS.map((ctrl) => {
                const isOn = defenses[ctrl.id];
                const weightPct = Math.round(scenario.mitigationWeights[ctrl.id] * 100);
                const isRecommended = scenario.recommendedDefenses.includes(ctrl.id);

                return (
                  <button
                    key={ctrl.id}
                    type="button"
                    onClick={() => toggleDefense(ctrl.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isOn
                        ? isRecommended
                          ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-400 dark:border-emerald-600/70'
                          : 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700/70'
                        : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {ctrl.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {ctrl.layer}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {ctrl.shortEffect}
                        </p>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                            isOn
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isOn ? 'Actif' : 'Inactif'}
                        </span>
                        <span
                          className={`text-[10.5px] font-mono font-semibold tabular-nums ${
                            weightPct >= 25
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          Impact : -{weightPct}%
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step-by-Step "Comment résoudre cette attaque" Explainer */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Comment résoudre : {scenario.name}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              {scenario.mechanism}
            </p>

            <div className="space-y-2.5">
              {scenario.resolutionSteps.map((step, index) => {
                const isDone = defenses[step.defenseId];
                const isHighlighted = autoSolveStepIndex === index + 1;
                return (
                  <div
                    key={step.defenseId}
                    className={`p-3 rounded-xl border transition-colors ${
                      isDone
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/60'
                        : isHighlighted
                          ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-400'
                          : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {step.title}
                      </span>
                      {isDone ? (
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Appliqué
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleDefense(step.defenseId)}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Appliquer
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tabs: Live SOC Logs vs Real Server Config (Avant / Après) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 overflow-hidden">
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 px-4 pt-3">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveBottomTab('logs');
            }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
              activeBottomTab === 'logs'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Journal SOC en direct
          </button>
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveBottomTab('config');
            }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
              activeBottomTab === 'config'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            Configuration serveur (Avant / Après)
          </button>
        </div>

        {activeBottomTab === 'logs' ? (
          <div className="p-4 space-y-2 max-h-56 overflow-y-auto font-mono text-xs">
            {logs.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 last:border-0"
              >
                <span className="text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                  [{entry.time}]
                </span>
                <span
                  className={`font-bold uppercase shrink-0 ${
                    entry.level === 'alert'
                      ? 'text-rose-600 dark:text-rose-400'
                      : entry.level === 'defense'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : entry.level === 'success'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {entry.level === 'alert'
                    ? 'ALERTE'
                    : entry.level === 'defense'
                      ? 'MITIGATION'
                      : entry.level === 'success'
                        ? 'RÉSOLU'
                        : 'INFO'}
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-sans">
                  {entry.message}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500" />
                {scenario.configTitle}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Tick #{tick}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/25 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Avant (Vulnérable)
                </div>
                <pre className="text-[11.5px] font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {scenario.vulnerableSnippet}
                </pre>
              </div>
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/25 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                  <Users className="w-3.5 h-3.5" />
                  Après (Résilient en production)
                </div>
                <pre className="text-[11.5px] font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {scenario.hardenedSnippet}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
