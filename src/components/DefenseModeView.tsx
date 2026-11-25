import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Globe,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Timer,
  XCircle,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../utils/sound';

interface DefenseModeViewProps {
  bestDefenseScore?: number;
  onFinishDefenseSession?: (score: number, neutralizedCount: number, xpEarned: number) => void;
}

type DifficultyId = 'beginner' | 'operator' | 'crisis';
type SeverityLevel = 'CRITIQUE' | 'HAUTE' | 'MOYENNE';
type AssetId = 'fw' | 'web' | 'ad' | 'db' | 'lan';

interface CountermeasureOption {
  id: string;
  label: string;
  isCorrect: boolean;
  feedback: string;
}

interface AttackTemplate {
  code: string;
  title: string;
  mitre: string;
  severity: SeverityLevel;
  targetAsset: AssetId;
  targetLabel: string;
  targetIp: string;
  sourceIpPool: string[];
  protocolPort: string;
  slaSeconds: number;
  damagePerTick: number;
  rawLog: (srcIp: string) => string;
  beginnerBrief: string;
  actions: CountermeasureOption[];
}

interface LiveAlert {
  id: string;
  timestamp: string;
  template: AttackTemplate;
  sourceIp: string;
  status: 'active' | 'neutralized' | 'breached';
  remainingSec: number;
  resolvedByLabel?: string;
  reactionSec?: number;
  spawnedAtMs: number;
}

interface DefenseLogEntry {
  id: string;
  time: string;
  kind: 'info' | 'success' | 'error' | 'alert';
  text: string;
}

const DIFFICULTY_CONFIG: Record<
  DifficultyId,
  {
    label: string;
    durationSec: number;
    spawnIntervalSec: number;
    maxConcurrent: number;
    slaMultiplier: number;
    xpCap: number;
  }
> = {
  beginner: {
    label: 'Débutant guidé (120 s)',
    durationSec: 120,
    spawnIntervalSec: 16,
    maxConcurrent: 2,
    slaMultiplier: 1.35,
    xpCap: 90,
  },
  operator: {
    label: 'Opérateur SOC (150 s)',
    durationSec: 150,
    spawnIntervalSec: 12,
    maxConcurrent: 3,
    slaMultiplier: 1,
    xpCap: 125,
  },
  crisis: {
    label: 'Crise Majeure (180 s)',
    durationSec: 180,
    spawnIntervalSec: 9,
    maxConcurrent: 4,
    slaMultiplier: 0.85,
    xpCap: 160,
  },
};

const NETWORK_ASSETS: {
  id: AssetId;
  name: string;
  role: string;
  ip: string;
  x: number;
  y: number;
}[] = [
  { id: 'fw', name: 'FW-EDGE-01', role: 'Pare-feu & WAF', ip: '198.51.100.1', x: 250, y: 150 },
  { id: 'web', name: 'SRV-WEB-DMZ', role: 'Portail E-Commerce', ip: '172.16.10.20', x: 460, y: 72 },
  { id: 'ad', name: 'DC-AD-01', role: 'Active Directory', ip: '10.10.1.10', x: 675, y: 72 },
  { id: 'db', name: 'SRV-DB-INT', role: 'Base Clients SQL', ip: '10.10.2.50', x: 675, y: 228 },
  { id: 'lan', name: 'LAN-POSTES', role: 'Postes & Compta', ip: '10.10.20.0/24', x: 460, y: 228 },
];

const ATTACK_TEMPLATES: AttackTemplate[] = [
  {
    code: 'DDOS-SYN',
    title: 'Attaque DDoS SYN Flood',
    mitre: 'T1498.001',
    severity: 'CRITIQUE',
    targetAsset: 'fw',
    targetLabel: 'FW-EDGE-01',
    targetIp: '198.51.100.1',
    sourceIpPool: ['203.0.113.84', '198.18.42.19', '185.220.101.33'],
    protocolPort: 'TCP / 443',
    slaSeconds: 26,
    damagePerTick: 2.2,
    rawLog: (src) =>
      `[FW-EDGE-01] ALERT SYN_FLOOD src=${src} dst=198.51.100.1:443 rate=48200_pps half_open_queue=96%`,
    beginnerBrief:
      'Un flot massif de demandes de connexion TCP incomplètes (SYN) sature la table de connexions du pare-feu périmétrique.',
    actions: [
      {
        id: 'a1',
        label: 'Activer SYN-Cookies et le Rate-Limiting périmétrique sur FW-EDGE-01',
        isCorrect: true,
        feedback: 'SYN-Cookies libère la file d’attente et absorbe la vague sans couper le site légitime.',
      },
      {
        id: 'a2',
        label: 'Éteindre le serveur Web de production (SRV-WEB-DMZ)',
        isCorrect: false,
        feedback: 'Contre-productif : vous provoquez vous-même l’indisponibilité recherchée par l’attaquant.',
      },
      {
        id: 'a3',
        label: 'Ouvrir le port 22 SSH sur Internet pour analyser le trafic',
        isCorrect: false,
        feedback: 'Augmente la surface d’attaque sans filtrer le SYN Flood.',
      },
      {
        id: 'a4',
        label: 'Réinitialiser tous les mots de passe Active Directory',
        isCorrect: false,
        feedback: 'Aucun compte n’est compromis : il s’agit d’une saturation réseau de couche 4.',
      },
    ],
  },
  {
    code: 'WEB-SQLI',
    title: 'Injection SQL sur le portail client',
    mitre: 'T1190',
    severity: 'CRITIQUE',
    targetAsset: 'web',
    targetLabel: 'SRV-WEB-DMZ',
    targetIp: '172.16.10.20',
    sourceIpPool: ['91.198.174.192', '45.155.205.77', '185.156.73.54'],
    protocolPort: 'HTTPS / 443',
    slaSeconds: 28,
    damagePerTick: 2.0,
    rawLog: (src) =>
      `[WAF-DMZ] CRITICAL SQLi_DETECTED src=${src} uri="/api/orders?id=1' UNION SELECT email,hash FROM users--" status=200`,
    beginnerBrief:
      'Un attaquant injecte du code SQL dans l’URL du site e-commerce pour extraire la table des comptes clients.',
    actions: [
      {
        id: 'a1',
        label: 'Passer la règle WAF Anti-SQLi en mode Blocage et bannir l’IP source',
        isCorrect: true,
        feedback: 'Les requêtes contenant des motifs SQL malveillants sont stoppées net devant SRV-WEB-DMZ.',
      },
      {
        id: 'a2',
        label: 'Augmenter la bande passante de la fibre optique',
        isCorrect: false,
        feedback: 'Le débit n’a aucun effet sur une faille applicative de type injection SQL.',
      },
      {
        id: 'a3',
        label: 'Désactiver le certificat HTTPS TLS',
        isCorrect: false,
        feedback: 'Supprimer TLS expose encore plus les données en clair sans bloquer l’injection.',
      },
      {
        id: 'a4',
        label: 'Redémarrer le service DHCP interne',
        isCorrect: false,
        feedback: 'Le serveur DHCP interne n’intervient pas dans le trafic web entrant.',
      },
    ],
  },
  {
    code: 'RANSOM-SMB',
    title: 'Propagation latérale Ransomware (SMB 445)',
    mitre: 'T1021.002',
    severity: 'CRITIQUE',
    targetAsset: 'lan',
    targetLabel: 'LAN-POSTES',
    targetIp: '10.10.20.42',
    sourceIpPool: ['10.10.20.14 (PC-COMPTA-02)', '10.10.20.31 (PC-RH-05)'],
    protocolPort: 'TCP / 445 (SMB)',
    slaSeconds: 24,
    damagePerTick: 2.5,
    rawLog: (src) =>
      `[EDR-AGENT] CRITICAL RANSOM_BEHAVIOR host=${src} action=mass_rename(.locked) lateral_scan=10.10.20.0/24:445`,
    beginnerBrief:
      'Un poste du réseau local chiffre ses fichiers et scanne le port 445 (partages Windows SMB) pour contaminer les postes voisins.',
    actions: [
      {
        id: 'a1',
        label: 'Isoler immédiatement le poste infecté via l’EDR et bloquer SMB 445 inter-postes',
        isCorrect: true,
        feedback: 'L’isolation EDR coupe la propagation en quelques secondes et protège le reste du parc.',
      },
      {
        id: 'a2',
        label: 'Envoyer un e-mail de rappel sur les mots de passe demain matin',
        isCorrect: false,
        feedback: 'Beaucoup trop lent : un ransomware peut chiffrer des dizaines de postes en quelques minutes.',
      },
      {
        id: 'a3',
        label: 'Autoriser le port 445 depuis Internet pour faire un diagnostic à distance',
        isCorrect: false,
        feedback: 'Erreur critique : exposer SMB 445 sur Internet aggrave immédiatement l’attaque.',
      },
      {
        id: 'a4',
        label: 'Payer la rançon affichée sur l’écran du poste',
        isCorrect: false,
        feedback: 'Contraire aux recommandations ANSSI : aucune garantie de déchiffrement et financement du crime.',
      },
    ],
  },
  {
    code: 'AD-KERB',
    title: 'Attaque Kerberoasting sur Active Directory',
    mitre: 'T1558.003',
    severity: 'HAUTE',
    targetAsset: 'ad',
    targetLabel: 'DC-AD-01',
    targetIp: '10.10.1.10',
    sourceIpPool: ['10.10.20.19', '10.10.20.67'],
    protocolPort: 'TCP / 88 (Kerberos)',
    slaSeconds: 30,
    damagePerTick: 1.8,
    rawLog: (src) =>
      `[DC-AD-01] EventID=4769 src=${src} service=MSSQLSvc/srv-db-int enc=0x17(RC4) anomaly=burst_18_TGS_requests`,
    beginnerBrief:
      'Un poste demande en rafale des tickets Kerberos chiffrés faiblement (RC4) pour tenter de casser hors-ligne le mot de passe d’un compte de service.',
    actions: [
      {
        id: 'a1',
        label: 'Révoquer le compte suspect, basculer le SPN en AES-256 et changer son mot de passe',
        isCorrect: true,
        feedback: 'Le ticket RC4 volé devient inutilisable et le compte compromis est contenu.',
      },
      {
        id: 'a2',
        label: 'Vider la table de routage BGP du routeur Internet',
        isCorrect: false,
        feedback: 'Attaque purement interne sur Active Directory : couper Internet ne stoppe pas Kerberos.',
      },
      {
        id: 'a3',
        label: 'Ajouter tous les utilisateurs dans le groupe Admins du domaine',
        isCorrect: false,
        feedback: 'Violent contresens du principe du moindre privilège.',
      },
      {
        id: 'a4',
        label: 'Ignorer l’alerte car le port 88 est un port légitime',
        isCorrect: false,
        feedback: '18 demandes TGS en RC4 en quelques secondes est un marqueur typique de Kerberoasting.',
      },
    ],
  },
  {
    code: 'DB-EXFIL',
    title: 'Exfiltration massive de la Base Clients',
    mitre: 'T1048',
    severity: 'CRITIQUE',
    targetAsset: 'db',
    targetLabel: 'SRV-DB-INT',
    targetIp: '10.10.2.50',
    sourceIpPool: ['172.16.10.20 → 194.26.135.88', '10.10.2.50 → 45.89.173.12'],
    protocolPort: 'TCP / 5432 → 443',
    slaSeconds: 26,
    damagePerTick: 2.3,
    rawLog: (src) =>
      `[SIEM-DLP] CRITICAL EXFILTRATION flow=${src} bytes_out=485MB table=clients_rgpd dest_reputation=C2_SUSPECT`,
    beginnerBrief:
      '485 Mo de données clients sortent anormalement de la base PostgreSQL vers un serveur inconnu à l’étranger.',
    actions: [
      {
        id: 'a1',
        label: 'Couper la sortie Internet directe de SRV-DB-INT, bloquer l’IP C2 et révoquer le compte SQL',
        isCorrect: true,
        feedback: 'Une base de données interne ne doit jamais initier de connexions sortantes vers Internet.',
      },
      {
        id: 'a2',
        label: 'Laisser le transfert finir pour ne pas corrompre le fichier exporté',
        isCorrect: false,
        feedback: 'Chaque seconde supplémentaire aggrave la fuite de données personnelles RGPD.',
      },
      {
        id: 'a3',
        label: 'Supprimer les journaux du pare-feu pour libérer du disque',
        isCorrect: false,
        feedback: 'Les journaux sont indispensables pour l’enquête et la notification CNIL.',
      },
      {
        id: 'a4',
        label: 'Ouvrir le port 5432 PostgreSQL sur la DMZ',
        isCorrect: false,
        feedback: 'Exposer davantage la base de données augmente encore le risque.',
      },
    ],
  },
  {
    code: 'SSH-BRUTE',
    title: 'Force Brute SSH sur le serveur DMZ',
    mitre: 'T1110.001',
    severity: 'MOYENNE',
    targetAsset: 'web',
    targetLabel: 'SRV-WEB-DMZ',
    targetIp: '172.16.10.20',
    sourceIpPool: ['103.75.201.14', '141.98.11.62', '89.248.165.41'],
    protocolPort: 'TCP / 22 (SSH)',
    slaSeconds: 32,
    damagePerTick: 1.3,
    rawLog: (src) =>
      `[SRV-WEB-DMZ] auth.log Failed password for root from ${src} port 51842 ssh2 (412 failures in 30s)`,
    beginnerBrief:
      'Un robot teste des centaines de mots de passe par minute sur le compte root en SSH.',
    actions: [
      {
        id: 'a1',
        label: 'Bannir l’IP source (Fail2Ban / FW), couper l’accès root SSH et imposer les clés SSH',
        isCorrect: true,
        feedback: 'L’attaque par dictionnaire échoue définitivement sans mot de passe ni accès root direct.',
      },
      {
        id: 'a2',
        label: 'Remplacer SSH par Telnet (port 23) qui est plus simple',
        isCorrect: false,
        feedback: 'Telnet transmet les mots de passe en clair sur le réseau : à bannir absolument.',
      },
      {
        id: 'a3',
        label: 'Définir le mot de passe root sur « Admin2026 »',
        isCorrect: false,
        feedback: 'Un mot de passe prévisible sera trouvé en quelques secondes par un dictionnaire.',
      },
      {
        id: 'a4',
        label: 'Couper le DNS interne de l’entreprise',
        isCorrect: false,
        feedback: 'Aucun lien avec une attaque SSH entrante par adresse IP.',
      },
    ],
  },
  {
    code: 'DNS-C2',
    title: 'Tunneling DNS / Balise C2 active',
    mitre: 'T1071.004',
    severity: 'HAUTE',
    targetAsset: 'lan',
    targetLabel: 'LAN-POSTES',
    targetIp: '10.10.20.88',
    sourceIpPool: ['10.10.20.88 → exfil.bad-cdn-sync.xyz', '10.10.20.51 → c2.update-check99.top'],
    protocolPort: 'UDP / 53 (DNS)',
    slaSeconds: 30,
    damagePerTick: 1.6,
    rawLog: (src) =>
      `[DNS-RESOLVER] WARN HIGH_ENTROPY_TXT flow=${src} queries=290/min payload=4a6f686e...`,
    beginnerBrief:
      'Un poste envoie des requêtes DNS très longues et encodées pour communiquer discrètement avec un serveur pirate (Command & Control).',
    actions: [
      {
        id: 'a1',
        label: 'Mettre le domaine malveillant en sinkhole DNS et mettre le poste en quarantaine',
        isCorrect: true,
        feedback: 'Le canal caché DNS est rompu instantanément et l’hôte infecté est isolé pour analyse.',
      },
      {
        id: 'a2',
        label: 'Bloquer totalement le port 53 UDP pour toute l’entreprise',
        isCorrect: false,
        feedback: 'Couper tout le DNS met hors service la navigation, les mails et Active Directory.',
      },
      {
        id: 'a3',
        label: 'Passer le poste en Wi-Fi Invité',
        isCorrect: false,
        feedback: 'Le malware continuera simplement son exfiltration depuis le Wi-Fi Invité.',
      },
      {
        id: 'a4',
        label: 'Mettre à jour le logo de la page d’accueil',
        isCorrect: false,
        feedback: 'Aucune action sur le poste infecté ni sur le domaine C2.',
      },
    ],
  },
  {
    code: 'M365-AITM',
    title: 'Vol de session Admin (Phishing AiTM)',
    mitre: 'T1539',
    severity: 'HAUTE',
    targetAsset: 'ad',
    targetLabel: 'DC-AD-01',
    targetIp: '10.10.1.10',
    sourceIpPool: ['185.220.101.99', '193.142.146.35'],
    protocolPort: 'HTTPS / Identity',
    slaSeconds: 28,
    damagePerTick: 1.9,
    rawLog: (src) =>
      `[ENTRA-ID] HIGH IMPOSSIBLE_TRAVEL user=admin.si@nord-val.fr src=${src} token_replay=true`,
    beginnerBrief:
      'Un pirate réutilise un cookie de session volé depuis un pays étranger pour se connecter en tant qu’administrateur sans repasser par le mot de passe.',
    actions: [
      {
        id: 'a1',
        label: 'Révoquer toutes les sessions actives, réinitialiser le mot de passe et exiger MFA FIDO2',
        isCorrect: true,
        feedback: 'La révocation invalide immédiatement le cookie de session volé par l’attaquant.',
      },
      {
        id: 'a2',
        label: 'Attendre que la session expire naturellement dans 14 jours',
        isCorrect: false,
        feedback: 'En 14 jours, un administrateur usurpé peut compromettre tout le SI.',
      },
      {
        id: 'a3',
        label: 'Changer uniquement le nom d’affichage du compte',
        isCorrect: false,
        feedback: 'Ne révoque aucun jeton d’authentification existant.',
      },
      {
        id: 'a4',
        label: 'Redémarrer la box Internet de l’accueil',
        isCorrect: false,
        feedback: 'La session cloud compromise est hébergée côté fournisseur d’identité, pas sur la box locale.',
      },
    ],
  },
];

function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

function nowTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export const DefenseModeView: React.FC<DefenseModeViewProps> = ({
  bestDefenseScore = 0,
  onFinishDefenseSession,
}) => {
  const [difficulty, setDifficulty] = useState<DifficultyId>('beginner');
  const [phase, setPhase] = useState<'ready' | 'running' | 'paused' | 'victory' | 'defeat'>('ready');

  const cfg = DIFFICULTY_CONFIG[difficulty];
  const [timeLeftSec, setTimeLeftSec] = useState<number>(cfg.durationSec);
  const [integrity, setIntegrity] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [logs, setLogs] = useState<DefenseLogEntry[]>([]);
  const [actionFeedback, setActionFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Dashboard filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'critique' | 'neutralized'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const spawnCounterRef = useRef(0);
  const ticksSinceSpawnRef = useRef(0);
  const finishedReportedRef = useRef(false);

  const pushLog = useCallback((kind: DefenseLogEntry['kind'], text: string) => {
    setLogs((prev) => [
      { id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, time: nowTimeStr(), kind, text },
      ...prev.slice(0, 29),
    ]);
  }, []);

  const spawnAlert = useCallback(
    (diff: DifficultyId) => {
      const activeCfg = DIFFICULTY_CONFIG[diff];
      setAlerts((prev) => {
        const currentActive = prev.filter((a) => a.status === 'active');
        if (currentActive.length >= activeCfg.maxConcurrent) return prev;

        const activeCodes = new Set(currentActive.map((a) => a.template.code));
        const candidates = ATTACK_TEMPLATES.filter((t) => !activeCodes.has(t.code));
        const pool = candidates.length > 0 ? candidates : ATTACK_TEMPLATES;
        const tpl = pool[Math.floor(Math.random() * pool.length)];
        const srcIp = tpl.sourceIpPool[Math.floor(Math.random() * tpl.sourceIpPool.length)];
        spawnCounterRef.current += 1;
        const id = `ALT-${String(spawnCounterRef.current).padStart(3, '0')}`;
        const sla = Math.max(14, Math.round(tpl.slaSeconds * activeCfg.slaMultiplier));

        const nextAlert: LiveAlert = {
          id,
          timestamp: nowTimeStr(),
          template: tpl,
          sourceIp: srcIp,
          status: 'active',
          remainingSec: sla,
          spawnedAtMs: Date.now(),
        };

        pushLog('alert', `[${id}] ${tpl.severity} — ${tpl.title} détectée sur ${tpl.targetLabel} (${srcIp})`);
        setSelectedAlertId((curr) => curr ?? id);
        return [nextAlert, ...prev];
      });
    },
    [pushLog]
  );

  const handleStartSession = (chosenDiff: DifficultyId = difficulty) => {
    playClick();
    const nextCfg = DIFFICULTY_CONFIG[chosenDiff];
    setDifficulty(chosenDiff);
    setTimeLeftSec(nextCfg.durationSec);
    setIntegrity(100);
    setScore(0);
    setStreak(0);
    setAlerts([]);
    setSelectedAlertId(null);
    setActionFeedback(null);
    setLogs([
      {
        id: 'log-init',
        time: nowTimeStr(),
        kind: 'info',
        text: `Garde SOC démarrée (${nextCfg.label}) — Surveillance temps réel de l'infrastructure Atelier Nord-Val active.`,
      },
    ]);
    spawnCounterRef.current = 0;
    ticksSinceSpawnRef.current = 0;
    finishedReportedRef.current = false;
    setPhase('running');
    // Spawn an immediate first alert so the dashboard is alive right away
    window.setTimeout(() => {
      spawnAlert(chosenDiff);
    }, 350);
  };

  // Real-time 1-second simulation engine
  useEffect(() => {
    if (phase !== 'running') return;

    const timer = window.setInterval(() => {
      ticksSinceSpawnRef.current += 1;

      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          setPhase('victory');
          return 0;
        }
        return prev - 1;
      });

      let tickDamage = 0;
      const expiredIds: string[] = [];

      setAlerts((prev) =>
        prev.map((al) => {
          if (al.status !== 'active') return al;
          const nextRem = al.remainingSec - 1;
          tickDamage += al.template.damagePerTick * 0.45;
          if (nextRem <= 0) {
            tickDamage += 11;
            expiredIds.push(al.id);
            return { ...al, remainingSec: 0, status: 'breached' };
          }
          return { ...al, remainingSec: nextRem };
        })
      );

      if (expiredIds.length > 0) {
        playError();
        setStreak(0);
        expiredIds.forEach((eid) => {
          pushLog('error', `[${eid}] SLA dépassé : l'attaque a impacté l'infrastructure (-11 % d'intégrité).`);
        });
      }

      if (tickDamage > 0) {
        setIntegrity((prev) => {
          const next = Math.max(0, Number((prev - tickDamage).toFixed(1)));
          if (next <= 0) {
            setPhase('defeat');
          }
          return next;
        });
      }

      if (ticksSinceSpawnRef.current >= DIFFICULTY_CONFIG[difficulty].spawnIntervalSec) {
        ticksSinceSpawnRef.current = 0;
        spawnAlert(difficulty);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, difficulty, spawnAlert, pushLog]);

  // Report XP once when a session finishes
  useEffect(() => {
    if ((phase === 'victory' || phase === 'defeat') && !finishedReportedRef.current) {
      finishedReportedRef.current = true;
      const neutralizedCount = alerts.filter((a) => a.status === 'neutralized').length;
      const xpEarned =
        phase === 'victory'
          ? Math.min(cfg.xpCap, 40 + neutralizedCount * 15)
          : Math.min(45, neutralizedCount * 10);
      if (phase === 'victory') {
        playVictory();
      } else {
        playError();
      }
      onFinishDefenseSession?.(score, neutralizedCount, xpEarned);
    }
  }, [phase, alerts, cfg.xpCap, score, onFinishDefenseSession]);

  const activeAlerts = useMemo(() => alerts.filter((a) => a.status === 'active'), [alerts]);
  const neutralizedAlerts = useMemo(() => alerts.filter((a) => a.status === 'neutralized'), [alerts]);
  const breachedAlerts = useMemo(() => alerts.filter((a) => a.status === 'breached'), [alerts]);

  const selectedAlert = useMemo(() => {
    const exact = alerts.find((a) => a.id === selectedAlertId);
    if (exact) return exact;
    return activeAlerts[0] ?? alerts[0] ?? null;
  }, [alerts, activeAlerts, selectedAlertId]);

  const filteredAlerts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return alerts.filter((a) => {
      if (statusFilter === 'active' && a.status !== 'active') return false;
      if (statusFilter === 'critique' && a.template.severity !== 'CRITIQUE') return false;
      if (statusFilter === 'neutralized' && a.status !== 'neutralized') return false;
      if (!q) return true;
      return (
        a.id.toLowerCase().includes(q) ||
        a.template.title.toLowerCase().includes(q) ||
        a.template.targetLabel.toLowerCase().includes(q) ||
        a.template.mitre.toLowerCase().includes(q) ||
        a.sourceIp.toLowerCase().includes(q)
      );
    });
  }, [alerts, statusFilter, searchQuery]);

  const handleApplyCountermeasure = (alert: LiveAlert, opt: CountermeasureOption) => {
    if (phase !== 'running' || alert.status !== 'active') return;
    if (opt.isCorrect) {
      playSuccess();
      const reactionSec = Math.max(1, Math.round((Date.now() - alert.spawnedAtMs) / 1000));
      const nextStreak = streak + 1;
      const pts = 100 + Math.min(60, alert.remainingSec * 2) + nextStreak * 15;
      setStreak(nextStreak);
      setScore((prev) => prev + pts);
      setIntegrity((prev) => Math.min(100, Number((prev + 3).toFixed(1))));
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alert.id
            ? { ...a, status: 'neutralized', resolvedByLabel: opt.label, reactionSec }
            : a
        )
      );
      setActionFeedback({ ok: true, text: `Menace neutralisée (+${pts} pts) : ${opt.feedback}` });
      pushLog('success', `[${alert.id}] Neutralisé en ${reactionSec}s — ${opt.label}`);

      // Automatically focus next active alert if any
      const nextActive = activeAlerts.find((a) => a.id !== alert.id);
      if (nextActive) {
        setSelectedAlertId(nextActive.id);
      }
    } else {
      playError();
      setStreak(0);
      setIntegrity((prev) => {
        const next = Math.max(0, Number((prev - 8).toFixed(1)));
        if (next <= 0) setPhase('defeat');
        return next;
      });
      setActionFeedback({
        ok: false,
        text: `Contre-mesure inadaptée (-8 % intégrité) : ${opt.feedback}`,
      });
      pushLog('error', `[${alert.id}] Action rejetée — ${opt.feedback}`);
    }
  };

  // Current wave (1..4) based on elapsed time
  const elapsedSec = cfg.durationSec - timeLeftSec;
  const waveNumber = Math.min(4, Math.floor(elapsedSec / (cfg.durationSec / 4)) + 1);

  const avgReactionSec = useMemo(() => {
    const times = neutralizedAlerts
      .map((a) => a.reactionSec)
      .filter((n): n is number => typeof n === 'number');
    if (times.length === 0) return null;
    return Math.round(times.reduce((s, n) => s + n, 0) / times.length);
  }, [neutralizedAlerts]);

  const threatenedAssetMap = useMemo(() => {
    const map = new Map<AssetId, LiveAlert>();
    activeAlerts.forEach((a) => {
      if (!map.has(a.template.targetAsset)) {
        map.set(a.template.targetAsset, a);
      }
    });
    return map;
  }, [activeAlerts]);

  const assetLinks: [AssetId, AssetId][] = [
    ['fw', 'web'],
    ['fw', 'lan'],
    ['web', 'ad'],
    ['web', 'db'],
    ['lan', 'ad'],
    ['lan', 'db'],
  ];

  const getAssetCoord = (id: AssetId) => NETWORK_ASSETS.find((n) => n.id === id)!;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Bar Header & Controls */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-medium text-sky-700 dark:text-cyan-400">
            Centre de Défense Temps Réel (Blue Team) · Réseau Atelier Nord-Val
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Mode Défense : Protection Réseau Live
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Surveillez votre infrastructure en direct, triez les alertes de sécurité dans le tableau
            de bord et appliquez la bonne contre-mesure avant l&apos;expiration du délai SLA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {phase === 'ready' || phase === 'victory' || phase === 'defeat' ? (
            <>
              <select
                aria-label="Niveau de garde"
                value={difficulty}
                onChange={(e) => {
                  const next = e.target.value as DifficultyId;
                  setDifficulty(next);
                  setTimeLeftSec(DIFFICULTY_CONFIG[next].durationSec);
                }}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="beginner">{DIFFICULTY_CONFIG.beginner.label}</option>
                <option value="operator">{DIFFICULTY_CONFIG.operator.label}</option>
                <option value="crisis">{DIFFICULTY_CONFIG.crisis.label}</option>
              </select>
              <button
                type="button"
                onClick={() => handleStartSession(difficulty)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4 shrink-0" />
                {phase === 'ready' ? 'Démarrer la garde' : 'Relancer une garde'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setPhase((p) => (p === 'running' ? 'paused' : 'running'));
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                {phase === 'running' ? (
                  <>
                    <Pause className="w-3.5 h-3.5 shrink-0" />
                    Mettre en pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 shrink-0" />
                    Reprendre
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleStartSession(difficulty)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                Réinitialiser
              </button>
            </>
          )}
        </div>
      </section>

      {/* 4-Column Real-Time KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">Intégrité du réseau</div>
          <div
            className={`font-mono text-2xl font-bold tabular-nums ${
              integrity >= 70
                ? 'text-emerald-700 dark:text-emerald-400'
                : integrity >= 35
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {Math.round(integrity)} %
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                integrity >= 70 ? 'bg-emerald-600' : integrity >= 35 ? 'bg-amber-500' : 'bg-rose-600'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, integrity))}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">Alertes en cours</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {activeAlerts.length}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              active{activeAlerts.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {neutralizedAlerts.length} neutralisée{neutralizedAlerts.length > 1 ? 's' : ''} ·{' '}
            {breachedAlerts.length} échappée{breachedAlerts.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">Score &amp; Série</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-sky-700 dark:text-cyan-400">
            {score.toLocaleString('fr-FR')}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">pts</span>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Série : ×{streak} · Record : {Math.max(bestDefenseScore, score).toLocaleString('fr-FR')}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Chrono de garde · Vague {waveNumber}/4
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {formatClock(timeLeftSec)}
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {phase === 'running'
              ? 'Surveillance active'
              : phase === 'paused'
                ? 'En pause'
                : phase === 'victory'
                  ? 'Garde réussie'
                  : phase === 'defeat'
                    ? 'Réseau compromis'
                    : 'Prêt à démarrer'}
          </div>
        </div>
      </section>

      {/* Post-Session Debrief Banner */}
      {(phase === 'victory' || phase === 'defeat') && (
        <section
          className={`rounded-2xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            phase === 'victory'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              {phase === 'victory' ? (
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              {phase === 'victory'
                ? 'Infrastructure protégée jusqu’à la fin de la garde !'
                : 'L’intégrité du réseau est tombée à 0 %'}
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-mono tabular-nums">
              Attaques neutralisées : {neutralizedAlerts.length} · Score final :{' '}
              {score.toLocaleString('fr-FR')} pts · Temps moyen de réaction :{' '}
              {avgReactionSec !== null ? `${avgReactionSec} s` : '—'} · Intégrité finale :{' '}
              {Math.round(integrity)} %
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleStartSession(difficulty)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-slate-900 dark:bg-cyan-400 text-white dark:text-slate-950 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 self-start md:self-auto"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            Nouvelle session de défense
          </button>
        </section>
      )}

      {/* Main Split Stage: Live 2D Network Defense Map (7 cols) + Active Countermeasure Console (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Live 2D SVG Network Map */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Carte Réseau en Temps Réel
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cliquez sur un équipement en alerte pour ouvrir sa contre-mesure immédiatement.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">● NOMINAL</span>
              <span className="text-rose-700 dark:text-rose-400 font-semibold">▲ ATTAQUE</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-2">
            <svg
              viewBox="0 0 800 300"
              className="w-full h-auto min-w-[540px]"
              role="img"
              aria-label="Topologie réseau surveillée en temps réel"
            >
              {/* Subtle coordinate grid */}
              <defs>
                <pattern id="defense-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path
                    d="M 32 0 L 0 0 0 32"
                    fill="none"
                    stroke="rgba(148,163,184,0.08)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="800" height="300" fill="url(#defense-grid)" />

              {/* Internet / WAN entry link */}
              <line
                x1={92}
                y1={150}
                x2={250}
                y2={150}
                stroke={activeAlerts.length > 0 ? '#ef4444' : '#38bdf8'}
                strokeWidth={activeAlerts.length > 0 ? 3 : 2}
                strokeDasharray="7 5"
              />

              {/* Internal network links */}
              {assetLinks.map(([aId, bId]) => {
                const a = getAssetCoord(aId);
                const b = getAssetCoord(bId);
                const underAttack = threatenedAssetMap.has(aId) || threatenedAssetMap.has(bId);
                return (
                  <line
                    key={`${aId}-${bId}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={underAttack ? '#f59e0b' : '#334155'}
                    strokeWidth={underAttack ? 2.5 : 1.8}
                    strokeDasharray={underAttack ? '6 4' : undefined}
                  />
                );
              })}

              {/* WAN Origin Node */}
              <g transform="translate(24, 114)">
                <rect
                  width="112"
                  height="72"
                  rx="10"
                  fill="#0f172a"
                  stroke={activeAlerts.length > 0 ? '#ef4444' : '#475569'}
                  strokeWidth="1.5"
                />
                <text x="56" y="29" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="700">
                  INTERNET / WAN
                </text>
                <text x="56" y="46" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                  Trafic externe
                </text>
                <text
                  x="56"
                  y="62"
                  textAnchor="middle"
                  fill={activeAlerts.length > 0 ? '#f87171' : '#38bdf8'}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {activeAlerts.length > 0 ? `${activeAlerts.length} MENACE(S)` : 'CALME'}
                </text>
              </g>

              {/* Interactive Monitored Assets */}
              {NETWORK_ASSETS.map((asset) => {
                const activeHit = threatenedAssetMap.get(asset.id);
                const isSelected = selectedAlert?.template.targetAsset === asset.id;
                const strokeColor = activeHit
                  ? activeHit.template.severity === 'CRITIQUE'
                    ? '#ef4444'
                    : '#f59e0b'
                  : isSelected
                    ? '#38bdf8'
                    : '#10b981';

                return (
                  <g
                    key={asset.id}
                    transform={`translate(${asset.x - 68}, ${asset.y - 38})`}
                    onClick={() => {
                      if (activeHit) {
                        playClick();
                        setSelectedAlertId(activeHit.id);
                      }
                    }}
                    className={activeHit ? 'cursor-pointer' : ''}
                  >
                    <rect
                      width="136"
                      height="76"
                      rx="10"
                      fill={activeHit ? '#2a1215' : '#0f172a'}
                      stroke={strokeColor}
                      strokeWidth={isSelected || activeHit ? 2.2 : 1.5}
                    />
                    <text
                      x="68"
                      y="22"
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      {asset.name}
                    </text>
                    <text x="68" y="38" textAnchor="middle" fill="#94a3b8" fontSize="9.5">
                      {asset.role}
                    </text>
                    <text
                      x="68"
                      y="52"
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {asset.ip}
                    </text>
                    <text
                      x="68"
                      y="67"
                      textAnchor="middle"
                      fill={activeHit ? '#fca5a5' : '#34d399'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="700"
                    >
                      {activeHit ? `▲ ${activeHit.id} (${activeHit.remainingSec}s)` : '● NOMINAL'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Live Defense Action Log */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 shrink-0" />
              Journal des opérations SOC (en direct)
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 max-h-40 overflow-y-auto space-y-1.5 font-mono text-[11px]">
              {logs.length === 0 ? (
                <div className="text-slate-500">
                  Cliquez sur « Démarrer la garde » pour lancer la surveillance et simuler des
                  attaques réseau en temps réel.
                </div>
              ) : (
                logs.map((entry) => (
                  <div
                    key={entry.id}
                    className={`leading-relaxed ${
                      entry.kind === 'success'
                        ? 'text-emerald-400'
                        : entry.kind === 'error'
                          ? 'text-rose-400'
                          : entry.kind === 'alert'
                            ? 'text-amber-300'
                            : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500 mr-2 tabular-nums">[{entry.time}]</span>
                    {entry.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* RIGHT: Active Alert Inspector & Countermeasure Deck */}
        <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Console de Contre-Mesure
            </h2>
            {selectedAlert && (
              <span className="font-mono text-xs font-bold tabular-nums text-sky-700 dark:text-cyan-400">
                {selectedAlert.id} · {selectedAlert.template.mitre}
              </span>
            )}
          </div>

          {!selectedAlert ? (
            <div className="py-10 text-center space-y-3">
              <Shield className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Aucune alerte sélectionnée
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Démarrez une garde de défense pour recevoir des alertes en temps réel et déployer
                vos contre-mesures réseau et système.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
                  <span
                    className={`font-bold ${
                      selectedAlert.template.severity === 'CRITIQUE'
                        ? 'text-rose-700 dark:text-rose-400'
                        : selectedAlert.template.severity === 'HAUTE'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-sky-700 dark:text-cyan-400'
                    }`}
                  >
                    {selectedAlert.template.severity} · {selectedAlert.template.protocolPort}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {selectedAlert.status === 'active'
                      ? `SLA restant : ${selectedAlert.remainingSec} s`
                      : selectedAlert.status === 'neutralized'
                        ? `Neutralisée en ${selectedAlert.reactionSec ?? 0} s`
                        : 'SLA dépassé'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedAlert.template.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                  Source : {selectedAlert.sourceIp} → Cible : {selectedAlert.template.targetLabel} (
                  {selectedAlert.template.targetIp})
                </p>
              </div>

              {/* Live Raw SIEM Log */}
              <pre className="p-3 rounded-xl bg-slate-950 text-amber-200 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {selectedAlert.template.rawLog(selectedAlert.sourceIp)}
              </pre>

              {/* Plain French Beginner Context */}
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                <strong>Ce qui se passe :</strong> {selectedAlert.template.beginnerBrief}
              </p>

              {/* Defensive Countermeasures */}
              {selectedAlert.status === 'active' ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Choisissez la contre-mesure à déployer :
                  </div>
                  {selectedAlert.template.actions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={phase !== 'running'}
                      onClick={() => handleApplyCountermeasure(selectedAlert, opt)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:border-sky-500 hover:bg-sky-50/60 dark:hover:bg-slate-800/70 disabled:opacity-50 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                    selectedAlert.status === 'neutralized'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  {selectedAlert.status === 'neutralized' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>
                    {selectedAlert.status === 'neutralized'
                      ? `Alerte clôturée via : ${selectedAlert.resolvedByLabel}`
                      : 'Cette attaque n’a pas été bloquée dans le délai imparti.'}
                  </span>
                </div>
              )}

              {actionFeedback && (
                <p
                  className={`text-xs leading-relaxed p-3 rounded-xl border ${
                    actionFeedback.ok
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  {actionFeedback.text}
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Live Security Alerts Dashboard Table */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-0.5">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-700 dark:text-cyan-400 shrink-0" />
              Tableau de Bord des Alertes de Sécurité ({filteredAlerts.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Suivi temps réel de toutes les intrusions détectées, filtrables par gravité ou statut.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer IP, cible, MITRE..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              {(
                [
                  { id: 'all', label: `Toutes (${alerts.length})` },
                  { id: 'active', label: `En cours (${activeAlerts.length})` },
                  { id: 'critique', label: 'Critiques' },
                  { id: 'neutralized', label: `Bloquées (${neutralizedAlerts.length})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    playClick();
                    setStatusFilter(f.id);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === f.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <AlertTriangle className="w-6 h-6 text-slate-400 mx-auto" />
            <p>
              {alerts.length === 0
                ? 'Aucune alerte détectée pour le moment. Lancez la garde pour simuler des attaques en direct.'
                : 'Aucune alerte ne correspond à ce filtre.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 pr-3 font-semibold whitespace-nowrap">ID · Heure</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Sévérité</th>
                  <th className="py-2.5 px-3 font-semibold">Alerte &amp; Technique MITRE</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Source → Cible</th>
                  <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">SLA</th>
                  <th className="py-2.5 pl-3 font-semibold text-right whitespace-nowrap">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredAlerts.map((al) => {
                  const isSelected = selectedAlert?.id === al.id;
                  return (
                    <tr
                      key={al.id}
                      onClick={() => {
                        playClick();
                        setSelectedAlertId(al.id);
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-sky-50/80 dark:bg-sky-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 pr-3 font-mono tabular-nums whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{al.id}</div>
                        <div className="text-[11px] text-slate-500">{al.timestamp}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            al.template.severity === 'CRITIQUE'
                              ? 'text-rose-700 dark:text-rose-400'
                              : al.template.severity === 'HAUTE'
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-sky-700 dark:text-cyan-400'
                          }
                        >
                          {al.template.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 min-w-[200px]">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {al.template.title}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {al.template.mitre} · {al.template.protocolPort}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {al.sourceIp} → {al.template.targetLabel}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-right whitespace-nowrap">
                        {al.status === 'active' ? (
                          <span
                            className={`font-bold ${
                              al.remainingSec <= 10
                                ? 'text-rose-700 dark:text-rose-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {al.remainingSec} s
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 pl-3 font-mono font-semibold text-right whitespace-nowrap">
                        {al.status === 'active' ? (
                          <span className="text-amber-700 dark:text-amber-400">▲ EN COURS</span>
                        ) : al.status === 'neutralized' ? (
                          <span className="text-emerald-700 dark:text-emerald-400">✓ BLOQUÉE</span>
                        ) : (
                          <span className="text-rose-700 dark:text-rose-400">✕ IMPACT</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Asset Reference Footer Strip (Zero fake telemetry, real monitored inventory) */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        {NETWORK_ASSETS.map((asset) => {
          const hit = threatenedAssetMap.get(asset.id);
          return (
            <div
              key={asset.id}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1"
            >
              <div className="flex items-center justify-between gap-1 font-mono font-bold text-slate-900 dark:text-slate-100">
                <span className="inline-flex items-center gap-1.5 truncate">
                  {asset.id === 'fw' && <Shield className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                  {asset.id === 'web' && <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  {asset.id === 'ad' && <Server className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  {asset.id === 'db' && <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  {asset.id === 'lan' && <Monitor className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                  {asset.name}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{asset.role}</div>
              <div
                className={`text-[11px] font-mono font-semibold ${
                  hit ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {hit ? `▲ ${hit.template.code}` : '● Protégé'}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
