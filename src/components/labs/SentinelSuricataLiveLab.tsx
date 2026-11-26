import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  Play,
  Radar,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import { playClick, playError, playSuccess } from '../../utils/sound';
import { sanitizeFilenameSlug } from '../../utils/safeExport';

export type SentinelSuricataLabId = 'sentinel' | 'suricata';

interface SentinelSuricataLiveLabProps {
  labId: SentinelSuricataLabId;
  onCompleteLab?: () => void;
}

interface LabObjective {
  id: string;
  label: string;
  done: boolean;
}

interface TerminalEntry {
  cmd: string;
  out: string;
  ok: boolean;
}

interface SimulatedSigninEvent {
  id: string;
  time: string;
  user: string;
  isVip: boolean;
  ip: string;
  isTrustedNat: boolean;
  resultType: string;
  attempts: number;
  app: string;
  malicious: boolean;
}

interface SimulatedSuricataFlow {
  id: string;
  flowId: string;
  srcIp: string;
  dstIp: string;
  method: string;
  uri: string;
  userAgent: string;
  label: string;
  malicious: boolean;
  isSqlmap: boolean;
  hasSqliPayload: boolean;
}

const SIMULATED_SIGNINS: SimulatedSigninEvent[] = [
  {
    id: 'evt-1',
    time: '09:12:04',
    user: 'marc.lefevre@cyberland.fr',
    isVip: false,
    ip: '198.51.100.10',
    isTrustedNat: true,
    resultType: '50126',
    attempts: 14,
    app: 'Microsoft 365',
    malicious: false,
  },
  {
    id: 'evt-2',
    time: '09:14:21',
    user: 'sophie.martin@cyberland.fr',
    isVip: false,
    ip: '198.51.100.10',
    isTrustedNat: true,
    resultType: '0',
    attempts: 1,
    app: 'SharePoint Online',
    malicious: false,
  },
  {
    id: 'evt-3',
    time: '09:16:48',
    user: 'claire.dupont@cyberland.fr',
    isVip: true,
    ip: '185.220.101.44',
    isTrustedNat: false,
    resultType: '50126',
    attempts: 18,
    app: 'Azure Portal',
    malicious: true,
  },
  {
    id: 'evt-4',
    time: '09:17:12',
    user: 'admin.tier0@cyberland.fr',
    isVip: true,
    ip: '185.220.101.44',
    isTrustedNat: false,
    resultType: '50053',
    attempts: 12,
    app: 'Microsoft Graph',
    malicious: true,
  },
  {
    id: 'evt-5',
    time: '09:18:02',
    user: 'lucas.bernard@cyberland.fr',
    isVip: false,
    ip: '203.0.113.55',
    isTrustedNat: false,
    resultType: '0',
    attempts: 1,
    app: 'Microsoft Teams',
    malicious: false,
  },
];

const SIMULATED_SURICATA_FLOWS: SimulatedSuricataFlow[] = [
  {
    id: 'flw-1',
    flowId: '194827361029401',
    srcIp: '198.51.100.24',
    dstIp: '10.10.20.15',
    method: 'GET',
    uri: '/api/v1/health',
    userAgent: 'UptimeProbe/2.1',
    label: 'Sonde de supervision HTTP légitime',
    malicious: false,
    isSqlmap: false,
    hasSqliPayload: false,
  },
  {
    id: 'flw-2',
    flowId: '194827361029418',
    srcIp: '203.0.113.41',
    dstIp: '10.10.20.15',
    method: 'GET',
    uri: '/api/v1/export?format=csv&month=11',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/131.0',
    label: 'Export CSV métier légitime',
    malicious: false,
    isSqlmap: false,
    hasSqliPayload: false,
  },
  {
    id: 'flw-3',
    flowId: '194827361029481',
    srcIp: '185.220.101.44',
    dstIp: '10.10.20.15',
    method: 'GET',
    uri: '/api/v1/export?id=1%20UNION%20SELECT%20user,hash%20FROM%20admins',
    userAgent: 'sqlmap/1.8.4#stable (https://sqlmap.org)',
    label: 'Injection SQL automatisée via sqlmap',
    malicious: true,
    isSqlmap: true,
    hasSqliPayload: true,
  },
  {
    id: 'flw-4',
    flowId: '194827361029512',
    srcIp: '45.155.205.91',
    dstIp: '10.10.20.15',
    method: 'GET',
    uri: '/api/v1/export?filter=1%20OR%201=1--',
    userAgent: 'curl/8.5.0',
    label: 'Injection SQL manuelle (OR 1=1)',
    malicious: true,
    isSqlmap: false,
    hasSqliPayload: true,
  },
  {
    id: 'flw-5',
    flowId: '194827361029559',
    srcIp: '10.10.4.12',
    dstIp: '10.10.20.15',
    method: 'POST',
    uri: '/api/v1/export',
    userAgent: 'Cyberland-Internal-Worker/3.0',
    label: 'Tâche interne depuis HOME_NET (10.10.0.0/16)',
    malicious: false,
    isSqlmap: false,
    hasSqliPayload: false,
  },
];

export const SentinelSuricataLiveLab: React.FC<SentinelSuricataLiveLabProps> = ({
  labId,
  onCompleteLab,
}) => {
  // --- Microsoft Sentinel Live State ---
  const [entraConnector, setEntraConnector] = useState(true);
  const [defenderConnector, setDefenderConnector] = useState(false);
  const [syslogAmaDcr, setSyslogAmaDcr] = useState(false);
  const [firewallBasicTier, setFirewallBasicTier] = useState(false);
  const [kqlFilterFailures, setKqlFilterFailures] = useState(true);
  const [kqlSummarizeBin, setKqlSummarizeBin] = useState(false);
  const [entityMappingEnabled, setEntityMappingEnabled] = useState(false);
  const [watchlistExcludeNat, setWatchlistExcludeNat] = useState(false);
  const [soarPlaybookArmed, setSoarPlaybookArmed] = useState(false);
  const [sentinelSimRan, setSentinelSimRan] = useState(false);

  // --- Suricata Live State ---
  const [homeNetScoped, setHomeNetScoped] = useState(false);
  const [ipsInlineMode, setIpsInlineMode] = useState(false);
  const [eveJsonEnabled, setEveJsonEnabled] = useState(true);
  const [ruleAction, setRuleAction] = useState<'alert' | 'drop'>('alert');
  const [stickyBuffersOn, setStickyBuffersOn] = useState(false);
  const [pcreGuardOn, setPcreGuardOn] = useState(false);
  const [localSidValid, setLocalSidValid] = useState(false);
  const [suricataTestRan, setSuricataTestRan] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<string>('194827361029481');

  // --- Shared Console & Artifact State ---
  const [terminalLog, setTerminalLog] = useState<TerminalEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const completedAwardedRef = useRef<boolean>(false);

  useEffect(() => {
    completedAwardedRef.current = false;
    setTerminalLog([]);
  }, [labId]);

  const appendTerminal = (cmd: string, out: string, ok: boolean) => {
    setTerminalLog((prev) => [...prev.slice(-6), { cmd, out, ok }]);
  };

  // --- Sentinel Derived Metrics ---
  const sentinelConnectorsReady =
    entraConnector && defenderConnector && syslogAmaDcr && firewallBasicTier;
  const sentinelKqlReady = kqlFilterFailures && kqlSummarizeBin;
  const sentinelDailyCost = useMemo(() => {
    let gbPerDay = 0;
    if (entraConnector) gbPerDay += 2.4;
    if (defenderConnector) gbPerDay += 4.8;
    if (syslogAmaDcr) gbPerDay += firewallBasicTier ? 6.5 : 22.0;
    const costPerDay =
      (entraConnector ? 2.4 * 4.3 : 0) +
      (defenderConnector ? 4.8 * 4.3 : 0) +
      (syslogAmaDcr ? (firewallBasicTier ? 6.5 * 0.65 : 22.0 * 4.3) : 0);
    return { gbPerDay: gbPerDay.toFixed(1), costPerDay: costPerDay.toFixed(0) };
  }, [entraConnector, defenderConnector, syslogAmaDcr, firewallBasicTier]);

  const sentinelEval = useMemo(() => {
    const matched = SIMULATED_SIGNINS.filter((evt) => {
      if (kqlFilterFailures && evt.resultType === '0') return false;
      if (kqlSummarizeBin && evt.attempts < 10) return false;
      if (watchlistExcludeNat && evt.isTrustedNat) return false;
      return true;
    });
    const truePositives = matched.filter((e) => e.malicious);
    const falsePositives = matched.filter((e) => !e.malicious);
    const incidentCount =
      truePositives.length === 0 ? 0 : entityMappingEnabled ? 1 : truePositives.length;
    return { matched, truePositives, falsePositives, incidentCount };
  }, [kqlFilterFailures, kqlSummarizeBin, watchlistExcludeNat, entityMappingEnabled]);

  // --- Suricata Derived Metrics ---
  const suricataConfigReady = homeNetScoped && ipsInlineMode && eveJsonEnabled;
  const suricataRuleHardened = stickyBuffersOn && pcreGuardOn && localSidValid;

  const suricataEval = useMemo(() => {
    const results = SIMULATED_SURICATA_FLOWS.map((flow) => {
      const fromInternal = flow.srcIp.startsWith('10.10.');
      if (homeNetScoped && fromInternal) {
        return { flow, matched: false, verdict: 'PASS' as const };
      }
      let matched = false;
      if (!stickyBuffersOn && !pcreGuardOn) {
        // Broad rule matching /api/v1/export without qualifiers causes false positives
        matched = flow.uri.includes('/api/v1/export');
      } else if (stickyBuffersOn && !pcreGuardOn) {
        matched = flow.uri.includes('/api/v1/export') && flow.isSqlmap;
      } else if (!stickyBuffersOn && pcreGuardOn) {
        matched = flow.hasSqliPayload;
      } else {
        matched =
          flow.uri.includes('/api/v1/export') && (flow.isSqlmap || flow.hasSqliPayload);
      }

      if (!matched) {
        return { flow, matched: false, verdict: 'PASS' as const };
      }
      const blocked = ruleAction === 'drop' && ipsInlineMode;
      return {
        flow,
        matched: true,
        verdict: blocked ? ('DROP' as const) : ('ALERT' as const),
      };
    });

    const truePositives = results.filter((r) => r.flow.malicious && r.matched);
    const blockedMalicious = results.filter((r) => r.flow.malicious && r.verdict === 'DROP');
    const falsePositives = results.filter((r) => !r.flow.malicious && r.matched);
    return { results, truePositives, blockedMalicious, falsePositives };
  }, [homeNetScoped, ipsInlineMode, ruleAction, stickyBuffersOn, pcreGuardOn]);

  // --- Objectives ---
  const objectives: LabObjective[] = useMemo(() => {
    if (labId === 'sentinel') {
      return [
        {
          id: 's1',
          label: 'Activer Entra ID, Defender XDR, Syslog/AMA et Basic Logs pare-feu',
          done: sentinelConnectorsReady,
        },
        {
          id: 's2',
          label: 'Construire la règle KQL (échecs ResultType != "0" + summarize bin 15m)',
          done: sentinelKqlReady,
        },
        {
          id: 's3',
          label: 'Activer Entity Mapping (Account + IP) pour fusionner en 1 incident',
          done: entityMappingEnabled,
        },
        {
          id: 's4',
          label: 'Exclure la passerelle NAT via Watchlist (0 faux positif)',
          done: watchlistExcludeNat && sentinelEval.falsePositives.length === 0,
        },
        {
          id: 's5',
          label: 'Armer le Playbook SOAR Logic App et lancer la simulation live',
          done:
            soarPlaybookArmed &&
            sentinelSimRan &&
            sentinelEval.falsePositives.length === 0 &&
            sentinelEval.truePositives.length === 2,
        },
      ];
    }
    return [
      {
        id: 'u1',
        label: 'Configurer suricata.yaml (HOME_NET RFC1918, IPS inline & eve.json)',
        done: suricataConfigReady,
      },
      {
        id: 'u2',
        label: 'Passer l’action de la signature en mode blocage IPS (drop)',
        done: ruleAction === 'drop',
      },
      {
        id: 'u3',
        label: 'Ajouter Sticky Buffers (http.uri, fast_pattern), PCRE SQLi & SID >= 1000000',
        done: suricataRuleHardened,
      },
      {
        id: 'u4',
        label: 'Rejouer le flux live avec 0 faux positif et 100% de blocage DROP',
        done:
          suricataTestRan &&
          suricataEval.falsePositives.length === 0 &&
          suricataEval.blockedMalicious.length === 2,
      },
      {
        id: 'u5',
        label: 'Vérifier la syntaxe via suricata -T ou pivoter sur flow_id dans eve.json',
        done:
          terminalLog.some(
            (entry) =>
              entry.ok &&
              (entry.cmd.includes('suricata -T') || entry.cmd.includes('jq '))
          ) && suricataRuleHardened,
      },
    ];
  }, [
    labId,
    sentinelConnectorsReady,
    sentinelKqlReady,
    entityMappingEnabled,
    watchlistExcludeNat,
    soarPlaybookArmed,
    sentinelSimRan,
    sentinelEval,
    suricataConfigReady,
    ruleAction,
    suricataRuleHardened,
    suricataTestRan,
    suricataEval,
    terminalLog,
  ]);

  const completedCount = objectives.filter((o) => o.done).length;
  const allDone = completedCount === objectives.length;

  useEffect(() => {
    if (allDone && !completedAwardedRef.current) {
      completedAwardedRef.current = true;
      playSuccess();
      onCompleteLab?.();
    }
  }, [allDone, onCompleteLab]);

  // --- Generated Live Artifacts ---
  const generatedArtifact = useMemo(() => {
    if (labId === 'sentinel') {
      return `// Microsoft Sentinel · Scheduled Analytic Rule (KQL)
// Connecteurs : ${[
        entraConnector ? 'EntraID' : null,
        defenderConnector ? 'DefenderXDR' : null,
        syslogAmaDcr ? 'Syslog-CEF(AMA/DCR)' : null,
      ]
        .filter(Boolean)
        .join(', ') || 'Aucun'}
// Plan table Pare-feu : ${firewallBasicTier ? 'Basic Logs (Optimisé)' : 'Analytics (Coût élevé)'}
${watchlistExcludeNat ? "let TrustedNAT = _GetWatchlist('TrustedNAT_IPs') | project SearchKey;\n" : ''}SigninLogs
| where TimeGenerated >= ago(15m)
${kqlFilterFailures ? '| where ResultType in ("50126", "50053", "50057")\n' : ''}${
        watchlistExcludeNat ? '| where IPAddress !in (TrustedNAT)\n' : ''
      }${
        kqlSummarizeBin
          ? '| summarize FailedAttempts = count(), TargetedUsers = make_set(UserPrincipalName) by IPAddress, bin(TimeGenerated, 15m)\n| where FailedAttempts >= 10\n'
          : '| project TimeGenerated, UserPrincipalName, IPAddress, ResultType\n'
      }
// Entity Mapping : ${
        entityMappingEnabled
          ? 'Account=UserPrincipalName, IP=IPAddress (MITRE T1110.003)'
          : 'NON CONFIGURÉ (alertes isolées)'
      }
// Automation & SOAR : ${
        soarPlaybookArmed
          ? 'Playbook Logic App [Revoke-EntraSession-And-BlockIP] (Managed Identity)'
          : 'Manuel uniquement'
      }`;
    }

    const action = ruleAction;
    const srcNet = homeNetScoped ? '$EXTERNAL_NET' : 'any';
    const dstNet = homeNetScoped ? '$HOME_NET' : 'any';
    const parts = [
      'msg:"CYBERLAND WEB-ATTACK Injection SQL sur /api/v1/export";',
      stickyBuffersOn ? 'flow:established,to_server;' : null,
      stickyBuffersOn
        ? 'http.uri; content:"/api/v1/export"; fast_pattern;'
        : 'content:"/api/v1/export";',
      pcreGuardOn
        ? 'pcre:"/(union\\s+select|or\\s+1=1|sqlmap)/i";'
        : null,
      'classtype:web-application-attack;',
      localSidValid ? 'sid:1000042; rev:1;' : 'sid:100; rev:1; # COLLISION RISQUE',
    ].filter(Boolean);

    return `# /etc/suricata/suricata.yaml
# HOME_NET: ${homeNetScoped ? '"[10.10.0.0/16]"' : '"any" (NON RESTREINT)'}
# Mode AF_PACKET: ${ipsInlineMode ? 'copy-mode: ips (Inline)' : 'IDS passif (SPAN)'}
# Sortie EVE JSON: ${eveJsonEnabled ? 'enabled: yes (/var/log/suricata/eve.json)' : 'disabled'}

# /etc/suricata/rules/local.rules
${action} http ${srcNet} any -> ${dstNet} any (${parts.join(' ')})`;
  }, [
    labId,
    entraConnector,
    defenderConnector,
    syslogAmaDcr,
    firewallBasicTier,
    kqlFilterFailures,
    kqlSummarizeBin,
    entityMappingEnabled,
    watchlistExcludeNat,
    soarPlaybookArmed,
    homeNetScoped,
    ipsInlineMode,
    eveJsonEnabled,
    ruleAction,
    stickyBuffersOn,
    pcreGuardOn,
    localSidValid,
  ]);

  const selectedEveEvent = useMemo(() => {
    const match =
      suricataEval.results.find((r) => r.flow.flowId === selectedFlowId) ??
      suricataEval.results[2];
    return {
      timestamp: '2026-11-26T09:16:48.412904+0100',
      flow_id: Number(match.flow.flowId),
      in_iface: 'eth0',
      event_type: match.matched ? 'alert' : 'http',
      src_ip: match.flow.srcIp,
      src_port: 51842,
      dest_ip: match.flow.dstIp,
      dest_port: 443,
      proto: 'TCP',
      http: {
        hostname: 'api.cyberland.fr',
        url: match.flow.uri,
        http_user_agent: match.flow.userAgent,
        http_method: match.flow.method,
      },
      ...(match.matched
        ? {
            alert: {
              action: match.verdict === 'DROP' ? 'blocked' : 'allowed',
              signature_id: localSidValid ? 1000042 : 100,
              rev: 1,
              signature: 'CYBERLAND WEB-ATTACK Injection SQL sur /api/v1/export',
              category: 'Web Application Attack',
              severity: 1,
            },
          }
        : {}),
    };
  }, [suricataEval, selectedFlowId, localSidValid]);

  const handleCopyArtifact = async () => {
    playClick();
    try {
      await navigator.clipboard.writeText(generatedArtifact);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked in some iframe sandboxes
    }
  };

  const handleDownloadArtifact = () => {
    playClick();
    const baseName = sanitizeFilenameSlug(
      labId === 'sentinel' ? 'cyberland-sentinel-rule' : 'cyberland-suricata-local',
      'cyberland-lab'
    );
    const ext = labId === 'sentinel' ? 'kql' : 'rules';
    const blob = new Blob([generatedArtifact], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    playClick();
    completedAwardedRef.current = false;
    setTerminalLog([]);
    if (labId === 'sentinel') {
      setEntraConnector(true);
      setDefenderConnector(false);
      setSyslogAmaDcr(false);
      setFirewallBasicTier(false);
      setKqlFilterFailures(true);
      setKqlSummarizeBin(false);
      setEntityMappingEnabled(false);
      setWatchlistExcludeNat(false);
      setSoarPlaybookArmed(false);
      setSentinelSimRan(false);
    } else {
      setHomeNetScoped(false);
      setIpsInlineMode(false);
      setEveJsonEnabled(true);
      setRuleAction('alert');
      setStickyBuffersOn(false);
      setPcreGuardOn(false);
      setLocalSidValid(false);
      setSuricataTestRan(false);
    }
  };

  const runSentinelSimulation = () => {
    setSentinelSimRan(true);
    const ok =
      sentinelConnectorsReady &&
      sentinelKqlReady &&
      entityMappingEnabled &&
      watchlistExcludeNat &&
      soarPlaybookArmed;
    if (ok) {
      playSuccess();
      appendTerminal(
        'sentinel-sim --run-kql --trigger-soar',
        'OK · 2 événements malveillants corrélés en 1 Incident Haute Sévérité (0 FP). Playbook Logic App exécuté : sessions Entra ID révoquées + IP 185.220.101.44 bloquée en 11s.',
        true
      );
    } else {
      playError();
      const missing: string[] = [];
      if (!sentinelConnectorsReady) missing.push('Connecteurs/Basic Logs');
      if (!sentinelKqlReady) missing.push('summarize bin(15m)');
      if (!entityMappingEnabled) missing.push('Entity Mapping');
      if (!watchlistExcludeNat) missing.push('Watchlist NAT (faux positifs actifs)');
      if (!soarPlaybookArmed) missing.push('Playbook SOAR Logic App');
      appendTerminal(
        'sentinel-sim --run-kql --trigger-soar',
        `INCOMPLET · Éléments à finaliser : ${missing.join(', ')}.`,
        false
      );
    }
  };

  const runSuricataSimulation = () => {
    setSuricataTestRan(true);
    const ok =
      suricataConfigReady &&
      ruleAction === 'drop' &&
      suricataRuleHardened &&
      suricataEval.falsePositives.length === 0 &&
      suricataEval.blockedMalicious.length === 2;
    if (ok) {
      playSuccess();
      appendTerminal(
        'suricata -r traffic_sample.pcap -S /etc/suricata/rules/local.rules',
        'OK · 5 flux rejoués · 2/2 attaques SQLi bloquées (DROP) · 0 faux positif · eve.json généré.',
        true
      );
    } else {
      playError();
      appendTerminal(
        'suricata -r traffic_sample.pcap -S /etc/suricata/rules/local.rules',
        `ATTENTION · Bloqués: ${suricataEval.blockedMalicious.length}/2 · Faux positifs: ${suricataEval.falsePositives.length} · Vérifiez HOME_NET, mode IPS, drop, sticky buffers & PCRE.`,
        false
      );
    }
  };

  const runQuickCli = (cmd: string) => {
    playClick();
    if (labId === 'sentinel') {
      if (cmd.includes('connector')) {
        appendTerminal(
          cmd,
          `EntraID=${entraConnector ? 'Connected' : 'Off'} | DefenderXDR=${
            defenderConnector ? 'Connected' : 'Off'
          } | Syslog/AMA=${syslogAmaDcr ? 'Connected' : 'Off'} | Coût estimé: ${
            sentinelDailyCost.costPerDay
          } €/j`,
          sentinelConnectorsReady
        );
      } else if (cmd.includes('validate')) {
        appendTerminal(
          cmd,
          sentinelKqlReady && entityMappingEnabled
            ? 'KQL valide · Entity Mapping: Account + IP · MITRE T1110.003 mappé.'
            : 'Avertissement : ajoutez summarize bin(15m) et Entity Mapping pour corréler les incidents.',
          sentinelKqlReady && entityMappingEnabled
        );
      } else {
        runSentinelSimulation();
      }
    } else {
      if (cmd.includes('suricata -T')) {
        if (suricataConfigReady && suricataRuleHardened) {
          playSuccess();
          appendTerminal(
            cmd,
            'Configuration provided was successfully loaded. 1 rule files processed. 1 rules successfully loaded, 0 rules failed (sid:1000042).',
            true
          );
        } else {
          playError();
          appendTerminal(
            cmd,
            'Warning: vérifiez HOME_NET RFC1918, copy-mode: ips, sticky buffers, PCRE et sid >= 1000000 avant la mise en production.',
            false
          );
        }
      } else if (cmd.includes('jq ')) {
        playSuccess();
        appendTerminal(
          cmd,
          `flow_id=${selectedEveEvent.flow_id} src=${selectedEveEvent.src_ip} type=${selectedEveEvent.event_type} action=${
            'alert' in selectedEveEvent && selectedEveEvent.alert
              ? selectedEveEvent.alert.action
              : 'pass'
          }`,
          true
        );
      } else {
        appendTerminal(
          cmd,
          'suricata-update · et/open synchronisé (34 812 signatures) · local.rules chargé · reload-rules OK.',
          true
        );
      }
    }
  };

  const isSentinel = labId === 'sentinel';
  const HeaderIcon = isSentinel ? ShieldCheck : Radar;

  return (
    <div className="space-y-6">
      {/* Lab Header */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono font-semibold text-sky-700 dark:text-cyan-400">
                {isSentinel ? 'SOC & SIEM Cloud · Microsoft Sentinel' : 'Détection Réseau · Suricata IDS/IPS'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {completedCount}/{objectives.length} objectifs validés
              </span>
              <span aria-hidden="true">·</span>
              <span className={allDone ? 'font-semibold text-emerald-700 dark:text-emerald-400' : ''}>
                {allDone ? 'Mission validée (+110 XP)' : 'En cours de configuration'}
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <HeaderIcon className="w-6 h-6 text-sky-600 dark:text-cyan-400 shrink-0" />
              {isSentinel
                ? 'Lab Temps Réel · Microsoft Sentinel (Data Connectors, KQL, Watchlist & SOAR)'
                : 'Lab Temps Réel · Suricata (suricata.yaml, Signatures IPS & EVE JSON)'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {isSentinel
                ? 'Connectez les journaux du tenant, rédigez une règle analytique KQL sans faux positifs, corrélez les entités en un incident unique et automatisez le confinement avec un Playbook Logic App.'
                : 'Configurez la sonde Suricata en mode IPS inline, construisez une signature rapide avec sticky buffers et PCRE, rejouez un trafic mixte pour atteindre 0 faux positif et pivotez dans eve.json.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser le lab
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                allDone ? 'bg-emerald-500' : 'bg-sky-600 dark:bg-cyan-400'
              }`}
              style={{ width: `${Math.round((completedCount / objectives.length) * 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Main Two-Zone Educational Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Zone (7 cols): Interactive Configuration + Live Stream Evaluator */}
        <div className="lg:col-span-7 space-y-6">
          {isSentinel ? (
            <>
              {/* Step 1: Data Connectors & Cost Tiering */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    1. Connecteurs de données (AMA / DCR) &amp; Optimisation Log Analytics
                  </h3>
                  <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    Ingestion : {sentinelDailyCost.gbPerDay} Go/j · Coût estimé :{' '}
                    <strong className="text-slate-900 dark:text-slate-100">
                      {sentinelDailyCost.costPerDay} €/j
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      label: 'Microsoft Entra ID (SigninLogs)',
                      detail: 'Authentifications & MFA · Plan Analytics',
                      active: entraConnector,
                      toggle: () => {
                        playClick();
                        setEntraConnector((v) => !v);
                      },
                    },
                    {
                      label: 'Microsoft Defender XDR',
                      detail: 'Alertes endpoints & processus · Plan Analytics',
                      active: defenderConnector,
                      toggle: () => {
                        playClick();
                        setDefenderConnector((v) => !v);
                      },
                    },
                    {
                      label: 'Syslog / CEF via AMA + DCR',
                      detail: 'Pare-feu périmétrique & sonde Suricata',
                      active: syslogAmaDcr,
                      toggle: () => {
                        playClick();
                        setSyslogAmaDcr((v) => !v);
                      },
                    },
                    {
                      label: 'Basculer CommonSecurityLog en Basic Logs',
                      detail: 'Réduit la facture pare-feu de 85 %',
                      active: firewallBasicTier,
                      toggle: () => {
                        playClick();
                        setFirewallBasicTier((v) => !v);
                      },
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.toggle}
                      className={`text-left p-3.5 rounded-xl border transition-colors ${
                        item.active
                          ? 'bg-sky-50 dark:bg-cyan-950/40 border-sky-400 dark:border-cyan-500/60'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {item.label}
                        </span>
                        <span
                          className={`text-xs font-mono font-semibold ${
                            item.active
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {item.active ? 'ACTIF' : 'INACTIF'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {item.detail}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              {/* Step 2: KQL Rule + Watchlist + SOAR */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  2. Règle analytique KQL, Watchlist &amp; Playbook SOAR
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      label: 'Filtre KQL : ResultType != "0"',
                      detail: 'Ne retient que les échecs de connexion Entra ID',
                      active: kqlFilterFailures,
                      onClick: () => {
                        playClick();
                        setKqlFilterFailures((v) => !v);
                      },
                    },
                    {
                      label: 'Agrégation : summarize by IP, bin(15m)',
                      detail: 'Déclenche uniquement au-delà de 10 échecs / 15 min',
                      active: kqlSummarizeBin,
                      onClick: () => {
                        playClick();
                        setKqlSummarizeBin((v) => !v);
                      },
                    },
                    {
                      label: 'Entity Mapping (Account + IP + MITRE)',
                      detail: 'Fusionne les alertes liées en 1 Incident corrélé',
                      active: entityMappingEnabled,
                      onClick: () => {
                        playClick();
                        setEntityMappingEnabled((v) => !v);
                      },
                    },
                    {
                      label: "Watchlist : IPAddress !in (_GetWatchlist('TrustedNAT_IPs'))",
                      detail: 'Exclut la passerelle VPN siège (198.51.100.10)',
                      active: watchlistExcludeNat,
                      onClick: () => {
                        playClick();
                        setWatchlistExcludeNat((v) => !v);
                      },
                    },
                    {
                      label: 'Automation Rule → Playbook Logic App (SOAR)',
                      detail: 'Révoque les sessions Entra ID + bloque IP via Managed Identity',
                      active: soarPlaybookArmed,
                      onClick: () => {
                        playClick();
                        setSoarPlaybookArmed((v) => !v);
                      },
                    },
                  ].map((ctrl) => (
                    <button
                      key={ctrl.label}
                      type="button"
                      onClick={ctrl.onClick}
                      className={`text-left p-3.5 rounded-xl border transition-colors ${
                        ctrl.active
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/60'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {ctrl.label}
                        </span>
                        <span
                          className={`text-xs font-mono font-semibold shrink-0 ${
                            ctrl.active
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {ctrl.active ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {ctrl.detail}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      Vrais positifs : {sentinelEval.truePositives.length}/2
                    </span>
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <span
                      className={
                        sentinelEval.falsePositives.length > 0
                          ? 'text-rose-700 dark:text-rose-400 font-semibold'
                          : 'text-emerald-700 dark:text-emerald-400 font-semibold'
                      }
                    >
                      Faux positifs : {sentinelEval.falsePositives.length}
                    </span>
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      Incidents créés : {sentinelEval.incidentCount}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={runSentinelSimulation}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Exécuter simulation KQL &amp; SOAR
                  </button>
                </div>
              </section>

              {/* Step 3: Live SigninLogs Table */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    3. Résultats en direct sur la table SigninLogs
                  </h3>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {sentinelEval.matched.length} / {SIMULATED_SIGNINS.length} lignes retenues
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="py-2 pr-3 font-semibold">Heure</th>
                        <th className="py-2 pr-3 font-semibold">Utilisateur</th>
                        <th className="py-2 pr-3 font-semibold">IP Source</th>
                        <th className="py-2 pr-3 font-semibold">Code / Échecs</th>
                        <th className="py-2 font-semibold">Statut Règle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono tabular-nums">
                      {SIMULATED_SIGNINS.map((evt) => {
                        const isHit = sentinelEval.matched.some((m) => m.id === evt.id);
                        return (
                          <tr
                            key={evt.id}
                            className={
                              isHit
                                ? evt.malicious
                                  ? 'bg-emerald-50/70 dark:bg-emerald-950/25'
                                  : 'bg-rose-50/70 dark:bg-rose-950/25'
                                : 'opacity-65'
                            }
                          >
                            <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">
                              {evt.time}
                            </td>
                            <td className="py-2.5 pr-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                              {evt.user}
                              {evt.isVip && (
                                <span className="ml-1.5 text-[11px] font-mono text-amber-700 dark:text-amber-400">
                                  [VIP]
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pr-3 text-slate-700 dark:text-slate-300">
                              {evt.ip}
                              {evt.isTrustedNat && (
                                <span className="ml-1.5 text-[11px] text-sky-700 dark:text-cyan-400">
                                  (NAT)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pr-3 text-slate-700 dark:text-slate-300">
                              {evt.resultType} · ×{evt.attempts}
                            </td>
                            <td className="py-2.5 font-sans font-semibold">
                              {isHit ? (
                                evt.malicious ? (
                                  <span className="text-emerald-700 dark:text-emerald-400">
                                    Détecté (Vrai positif)
                                  </span>
                                ) : (
                                  <span className="text-rose-700 dark:text-rose-400">
                                    Faux positif à filtrer
                                  </span>
                                )
                              ) : (
                                <span className="text-slate-500 dark:text-slate-400">Ignoré</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* Suricata Step 1: suricata.yaml */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  1. Paramétrage de la sonde (/etc/suricata/suricata.yaml)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      label: 'HOME_NET: 10.10.0.0/16',
                      detail: 'EXTERNAL_NET: "!$HOME_NET" (ignore les flux LAN internes)',
                      active: homeNetScoped,
                      toggle: () => {
                        playClick();
                        setHomeNetScoped((v) => !v);
                      },
                    },
                    {
                      label: 'AF_PACKET Inline (IPS)',
                      detail: 'copy-mode: ips entre eth0 et eth1 pour bloquer en direct',
                      active: ipsInlineMode,
                      toggle: () => {
                        playClick();
                        setIpsInlineMode((v) => !v);
                      },
                    },
                    {
                      label: 'Journalisation eve.json',
                      detail: 'Active types: [alert, http, dns, tls, flow]',
                      active: eveJsonEnabled,
                      toggle: () => {
                        playClick();
                        setEveJsonEnabled((v) => !v);
                      },
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.toggle}
                      className={`text-left p-3.5 rounded-xl border transition-colors ${
                        item.active
                          ? 'bg-sky-50 dark:bg-cyan-950/40 border-sky-400 dark:border-cyan-500/60'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {item.label}
                        </span>
                        <span
                          className={`text-xs font-mono font-semibold ${
                            item.active
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {item.active ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {item.detail}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              {/* Suricata Step 2: Signature Builder */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    2. Construction de la signature (/etc/suricata/rules/local.rules)
                  </h3>
                  <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {(['alert', 'drop'] as const).map((act) => (
                      <button
                        key={act}
                        type="button"
                        onClick={() => {
                          playClick();
                          setRuleAction(act);
                        }}
                        className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          ruleAction === act
                            ? act === 'drop'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-slate-950'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        action: {act}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Sticky Buffers + fast_pattern',
                      detail: 'flow:established,to_server + http.uri; content:"/api/v1/export"',
                      active: stickyBuffersOn,
                      toggle: () => {
                        playClick();
                        setStickyBuffersOn((v) => !v);
                      },
                    },
                    {
                      label: 'Regex PCRE SQLi & sqlmap',
                      detail: 'pcre:"/(union\\s+select|or\\s+1=1|sqlmap)/i"',
                      active: pcreGuardOn,
                      toggle: () => {
                        playClick();
                        setPcreGuardOn((v) => !v);
                      },
                    },
                    {
                      label: 'SID local normé (1000042)',
                      detail: 'Plage sid >= 1000000 + rev:1 sans collision ET/Open',
                      active: localSidValid,
                      toggle: () => {
                        playClick();
                        setLocalSidValid((v) => !v);
                      },
                    },
                  ].map((ctrl) => (
                    <button
                      key={ctrl.label}
                      type="button"
                      onClick={ctrl.toggle}
                      className={`text-left p-3.5 rounded-xl border transition-colors ${
                        ctrl.active
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/60'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {ctrl.label}
                        </span>
                        <span
                          className={`text-xs font-mono font-semibold shrink-0 ${
                            ctrl.active
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {ctrl.active ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {ctrl.detail}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      Attaques bloquées (DROP) : {suricataEval.blockedMalicious.length}/2
                    </span>
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <span
                      className={
                        suricataEval.falsePositives.length > 0
                          ? 'text-rose-700 dark:text-rose-400 font-semibold'
                          : 'text-emerald-700 dark:text-emerald-400 font-semibold'
                      }
                    >
                      Faux positifs : {suricataEval.falsePositives.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={runSuricataSimulation}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Rejouer le trafic (5 flux HTTP)
                  </button>
                </div>
              </section>

              {/* Suricata Step 3: Live Flow Table + EVE JSON Pivot */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    3. Évaluation du trafic &amp; Pivot eve.json (cliquez sur un flux)
                  </h3>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    flow_id actif : {selectedEveEvent.flow_id}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="py-2 pr-3 font-semibold">Source → Dest</th>
                        <th className="py-2 pr-3 font-semibold">Flux</th>
                        <th className="py-2 pr-3 font-semibold">Verdict Suricata</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {suricataEval.results.map(({ flow, verdict }) => {
                        const isSelected = flow.flowId === selectedFlowId;
                        const isFp = !flow.malicious && verdict !== 'PASS';
                        return (
                          <tr
                            key={flow.id}
                            onClick={() => {
                              playClick();
                              setSelectedFlowId(flow.flowId);
                            }}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-sky-50/90 dark:bg-cyan-950/40'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-2.5 pr-3 font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {flow.srcIp} → {flow.dstIp}
                            </td>
                            <td className="py-2.5 pr-3">
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {flow.label}
                              </div>
                              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                {flow.method} {flow.uri}
                              </div>
                            </td>
                            <td className="py-2.5 font-mono font-bold whitespace-nowrap">
                              {verdict === 'DROP' && (
                                <span className={isFp ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}>
                                  {isFp ? 'DROP (Faux positif !)' : 'DROP (Bloqué IPS)'}
                                </span>
                              )}
                              {verdict === 'ALERT' && (
                                <span className={isFp ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}>
                                  {isFp ? 'ALERT (Faux positif)' : 'ALERT (IDS passif)'}
                                </span>
                              )}
                              {verdict === 'PASS' && (
                                <span className={flow.malicious ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}>
                                  {flow.malicious ? 'PASS (Attaque ratée)' : 'PASS (Légitime)'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* EVE JSON Inspector */}
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>/var/log/suricata/eve.json · Pivot flow_id</span>
                    <span>event_type: {selectedEveEvent.event_type}</span>
                  </div>
                  <pre className="text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                    {JSON.stringify(selectedEveEvent, null, 2)}
                  </pre>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Right Zone (5 cols): Checklist, Generated Artifact & Live CLI Console */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mission Objectives */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              Objectifs de validation (3★)
            </h3>
            <ul className="space-y-2.5">
              {objectives.map((obj) => (
                <li
                  key={obj.id}
                  className={`flex items-start gap-2.5 text-xs p-2.5 rounded-lg border ${
                    obj.done
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {obj.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{obj.label}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Generated Production Artifact */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                {isSentinel ? 'Artefact KQL & SOAR généré' : 'Artefact suricata.yaml & local.rules'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyArtifact}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
                >
                  {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadArtifact}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exporter
                </button>
              </div>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              {generatedArtifact}
            </pre>
          </section>

          {/* Interactive CLI Console */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              {isSentinel ? 'Console Azure Sentinel CLI' : 'Console Sonde Suricata Linux'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(isSentinel
                ? [
                    'az sentinel connector list',
                    'az sentinel rule validate',
                    'sentinel-sim --run-kql --trigger-soar',
                  ]
                : [
                    'suricata -T -c /etc/suricata/suricata.yaml',
                    'jq \'select(.event_type=="alert")\' /var/log/suricata/eve.json',
                    'suricata-update && suricatasc -c reload-rules',
                  ]
              ).map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => runQuickCli(cmd)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-cyan-950/60 text-slate-800 dark:text-cyan-300 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap shrink-0"
                >
                  <Zap className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
                  {cmd.length > 36 ? `${cmd.slice(0, 36)}…` : cmd}
                </button>
              ))}
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs space-y-2.5 min-h-[120px] max-h-[240px] overflow-y-auto">
              {terminalLog.length === 0 ? (
                <p className="text-slate-500">
                  Lancez une commande ci-dessus pour auditer votre configuration en direct.
                </p>
              ) : (
                terminalLog.map((entry, i) => (
                  <div key={`${entry.cmd}-${i}`} className="space-y-1">
                    <div className="text-sky-400">$ {entry.cmd}</div>
                    <div className={entry.ok ? 'text-emerald-300' : 'text-amber-300'}>
                      {entry.out}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {allDone && (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/70 p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <p className="font-bold">
                  Atelier {isSentinel ? 'Microsoft Sentinel' : 'Suricata IDS/IPS'} maîtrisé !
                </p>
                <p>
                  Toutes les vérifications opérationnelles sont au vert : zéro faux positif, détection
                  et réponse validées. Votre progression et vos étoiles ont été enregistrées.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
