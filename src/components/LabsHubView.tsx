import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Binary,
  Bug,
  CheckCircle2,
  CloudCog,
  CloudOff,
  Code2,
  Container,
  Crosshair,
  Database,
  FileKey2,
  FileSearch,
  Flag,
  Flame,
  FolderTree,
  Gauge,
  GitBranch,
  Globe,
  Globe2,
  HardDrive,
  KeyRound,
  Lock,
  MailCheck,
  MailWarning,
  MonitorCheck,
  Network,
  Radar,
  Repeat2,
  Router,
  ScanSearch,
  Server,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Terminal,
  TerminalSquare,
  Timer,
  WifiOff,
  Wrench,
} from 'lucide-react';
import { PacketSimulatorView } from './PacketSimulatorView';
import { CloudArchitectLab } from './labs/CloudArchitectLab';
import { IpSubnetLab } from './labs/IpSubnetLab';
import { AntiDdosGame } from './labs/AntiDdosGame';
import { NetworkTerminalLab } from './labs/NetworkTerminalLab';
import { BandwidthCalculatorLab } from './labs/BandwidthCalculatorLab';
import { DynamicRoutingLab } from './labs/DynamicRoutingLab';
import { DhcpNatLab } from './labs/DhcpNatLab';
import { HttpApiInspectorLab } from './labs/HttpApiInspectorLab';
import { PasswordEntropyLab } from './labs/PasswordEntropyLab';
import { WiresharkTcpdumpLab } from './labs/WiresharkTcpdumpLab';
import { AzureMonitorLab } from './labs/AzureMonitorLab';
import { CrisisResponseLab } from './labs/CrisisResponseLab';
import { NetworkArchitectSandboxLab } from './labs/NetworkArchitectSandboxLab';
import { SqlInjectionLab } from './labs/SqlInjectionLab';
import { LiveAttackLab } from './labs/LiveAttackLab';
import { SpeedrunCompletionResult, SpeedrunModeLab } from './labs/SpeedrunModeLab';
import { NmapAuditLab } from './labs/NmapAuditLab';
import { LinuxAdminLab } from './labs/LinuxAdminLab';
import { BackupPraLab } from './labs/BackupPraLab';
import { CtfGuidedLab } from './labs/CtfGuidedLab';
import { JwtTlsAuditorLab } from './labs/JwtTlsAuditorLab';
import { DockerHardeningLab } from './labs/DockerHardeningLab';
import { SocSurvivalLab } from './labs/SocSurvivalLab';
import { VpnConfigLiveLab } from './labs/VpnConfigLiveLab';
import { ServerConfigLiveLab } from './labs/ServerConfigLiveLab';
import { ExpertAdvancedLiveLab } from './labs/ExpertAdvancedLiveLab';
import { InteractiveTopologyLab } from './labs/InteractiveTopologyLab';
import { ServerDbAuthLab } from './labs/ServerDbAuthLab';
import { SocLiveMonitoringLab } from './labs/SocLiveMonitoringLab';
import { NetworkSnifferLab } from './labs/NetworkSnifferLab';
import { AdvancedLabId } from '../data/advancedCoursesData';
import { CyberAttackId } from '../data/cyberAttackSimulations';
import { EASE_SWISS, SPRING_SNAPPY } from './MotionPrimitives';
import { playClick } from '../utils/sound';

export type LabCategory = 'monitoring' | 'speedrun' | 'attacks' | 'tools';

interface LabsHubViewProps {
  initialCategory?: LabCategory;
  initialLab?: LabTab;
  onWinDdosXp: () => void;
  onCompleteTerminalMissions?: () => void;
  onContainCrisis?: () => void;
  onMasterSqli?: () => void;
  onNeutralizeCyberAttack?: (attackId: CyberAttackId) => void;
  onCompleteTopology?: () => void;
  onAwardLabXp?: (xp: number) => void;
  onCaptureCtfFlag?: (flagId: string, xp: number) => void;
  bestSocSurvivalScore?: number;
  onFinishSocSurvival?: (score: number, xpEarned: number) => void;
  bestSpeedrunByCircuit?: Record<string, number>;
  xpBoostMultiplier?: number;
  xpBoostRemainingSec?: number;
  onCompleteSpeedrun?: (result: SpeedrunCompletionResult) => void;
}

export type LabTab =
  | CyberAttackId
  | 'ddos'
  | 'sqli'
  | 'crisis'
  | 'sandbox'
  | 'packet'
  | 'wireshark'
  | 'azure'
  | 'terminal'
  | 'dhcp'
  | 'http'
  | 'password'
  | 'bandwidth'
  | 'routing'
  | 'architect'
  | 'ip'
  | 'nmap'
  | 'linux'
  | 'backup'
  | 'ctf'
  | 'survival'
  | 'jwttls'
  | 'dockersec'
  | 'vpnconfig'
  | 'serverconfig'
  | 'topology'
  | 'sniffer'
  | 'authz'
  | AdvancedLabId;

const ADVANCED_LAB_IDS: AdvancedLabId[] = [
  'emailsec',
  'sigmayara',
  'dfir',
  'iac',
  'iamcloud',
  'bgprouting',
  'linuxadmin',
  'winserver',
  'admastery',
  'sentinel',
  'suricata',
];

function isAdvancedLabId(id: LabTab): id is AdvancedLabId {
  return (ADVANCED_LAB_IDS as string[]).includes(id);
}

const CYBER_ATTACK_IDS: CyberAttackId[] = [
  'xss',
  'mitm',
  'ransomware',
  'bruteforce',
  'phishing',
  'dns',
  'ssrf',
  'csrf',
];

function isCyberAttackId(id: LabTab): id is CyberAttackId {
  return (CYBER_ATTACK_IDS as string[]).includes(id);
}

export const LabsHubView: React.FC<LabsHubViewProps> = ({
  initialCategory,
  initialLab,
  onWinDdosXp,
  onCompleteTerminalMissions,
  onContainCrisis,
  onMasterSqli,
  onNeutralizeCyberAttack,
  onCompleteTopology,
  onAwardLabXp,
  onCaptureCtfFlag,
  bestSocSurvivalScore = 0,
  onFinishSocSurvival,
  bestSpeedrunByCircuit = {},
  xpBoostMultiplier = 1,
  xpBoostRemainingSec = 0,
  onCompleteSpeedrun,
}) => {
  const [category, setCategory] = useState<LabCategory>(initialCategory ?? 'monitoring');
  const [activeLab, setActiveLab] = useState<LabTab>(initialLab ?? 'xss');
  const [neutralizedAttacks, setNeutralizedAttacks] = useState<CyberAttackId[]>([]);

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
    if (initialLab) {
      setActiveLab(initialLab);
    }
  }, [initialCategory, initialLab]);

  const attackTabs: { id: LabTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'xss', label: 'XSS & Cookie', icon: Bug },
    { id: 'mitm', label: 'MitM / ARP', icon: WifiOff },
    { id: 'ransomware', label: 'Ransomware', icon: Lock },
    { id: 'bruteforce', label: 'Force Brute', icon: KeyRound },
    { id: 'phishing', label: 'Phishing / AiTM', icon: MailWarning },
    { id: 'dns', label: 'DNS Spoofing', icon: Globe },
    { id: 'ssrf', label: 'SSRF Cloud', icon: CloudOff },
    { id: 'csrf', label: 'Attaque CSRF', icon: Repeat2 },
    { id: 'ddos', label: 'DDoS (Live)', icon: ShieldAlert },
    { id: 'sqli', label: 'Injection SQL', icon: Database },
  ];

  const toolTabs: { id: LabTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'sniffer', label: 'Network Sniffer (Mini-Wireshark)', icon: Radar },
    { id: 'authz', label: 'Contrôle d’Accès Serveur & BDD (AuthZ)', icon: ShieldAlert },
    { id: 'topology', label: 'Topologie Interactive (Routeurs · Pare-feu · Paquets)', icon: Network },
    { id: 'linuxadmin', label: 'Linux Live (Admin, Systemd & LVM)', icon: TerminalSquare },
    { id: 'winserver', label: 'Windows Server Live (DNS/DHCP/SMB)', icon: Server },
    { id: 'admastery', label: 'Active Directory Live (AD DS/GPO)', icon: FolderTree },
    { id: 'sentinel', label: 'Microsoft Sentinel Live (SIEM/KQL)', icon: ShieldCheck },
    { id: 'suricata', label: 'Suricata Live (IDS/IPS & EVE JSON)', icon: Radar },
    { id: 'serverconfig', label: 'Serveur Live (Création & Config)', icon: Server },
    { id: 'vpnconfig', label: 'VPN Live (Création & Config)', icon: Lock },
    { id: 'emailsec', label: 'P1 · Messagerie SPF/DKIM/DMARC', icon: MailCheck },
    { id: 'sigmayara', label: 'P2 · Sigma, YARA & Hunting', icon: Crosshair },
    { id: 'dfir', label: 'P3 · Forensics & DFIR', icon: FileSearch },
    { id: 'iac', label: 'P4 · Terraform & Ansible (IaC)', icon: Code2 },
    { id: 'iamcloud', label: 'P5 · IAM Cloud & Secrets', icon: KeyRound },
    { id: 'bgprouting', label: 'P6 · OSPF, BGP, RPKI & SD-WAN', icon: Globe2 },
    { id: 'ctf', label: 'CTF Guidé (5 Flags)', icon: Flag },
    { id: 'survival', label: 'Survie SOC (Vagues)', icon: Flame },
    { id: 'jwttls', label: 'JWT & TLS X.509', icon: FileKey2 },
    { id: 'dockersec', label: 'Docker DevSecOps', icon: Container },
    { id: 'nmap', label: 'Nmap & Audit Ports', icon: ScanSearch },
    { id: 'linux', label: 'Admin Linux (chmod/cron)', icon: TerminalSquare },
    { id: 'backup', label: 'Sauvegarde & PRA (3-2-1)', icon: HardDrive },
    { id: 'crisis', label: 'Crise Cyber Live', icon: Siren },
    { id: 'sandbox', label: 'Bac à sable Réseau', icon: Network },
    { id: 'terminal', label: 'CyberShell (Linux/PS)', icon: Terminal },
    { id: 'wireshark', label: 'Wireshark & tcpdump', icon: Radar },
    { id: 'azure', label: 'Azure Monitor', icon: MonitorCheck },
    { id: 'packet', label: 'Simulateur paquets', icon: Activity },
    { id: 'dhcp', label: 'DHCP & NAT', icon: Router },
    { id: 'http', label: 'API / HTTP', icon: Globe },
    { id: 'password', label: 'Mots de passe', icon: KeyRound },
    { id: 'bandwidth', label: 'Débits (Bits/Octets)', icon: Gauge },
    { id: 'routing', label: 'Routage Dynamique', icon: GitBranch },
    { id: 'architect', label: 'Architecte Cloud', icon: CloudCog },
    { id: 'ip', label: 'Calculateur IP', icon: Binary },
  ];

  const visibleTabs = category === 'attacks' ? attackTabs : toolTabs;

  const handleSwitchCategory = (nextCat: LabCategory) => {
    if (nextCat === category) return;
    playClick();
    setCategory(nextCat);
    if (nextCat === 'attacks') setActiveLab('xss');
    if (nextCat === 'tools') setActiveLab('sniffer');
  };

  const handleNeutralize = (attackId: CyberAttackId) => {
    setNeutralizedAttacks((prev) => {
      if (prev.includes(attackId)) return prev;
      onNeutralizeCyberAttack?.(attackId);
      return [...prev, attackId];
    });
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-cyan-500/20 pb-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-mono font-medium text-sky-700 dark:text-cyan-400">
              SOC Live Monitoring · 47 ateliers tactiques · Microsoft Sentinel · Suricata IDS/IPS · Network Sniffer · AuthZ Serveur &amp; BDD · Topologie Interactive · {neutralizedAttacks.length} / {CYBER_ATTACK_IDS.length} attaques live neutralisées cette session
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Laboratoires Réseaux, Cloud &amp; Cyber
            </h1>
          </div>

          {/* 4-Category Switcher with Tactical SOC sliding pill */}
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
            {(
              [
                {
                  id: 'monitoring',
                  label: 'SOC Live Monitoring',
                  icon: Radar,
                  activeBg: 'bg-sky-700 dark:bg-cyan-400',
                  activeText: 'text-white dark:text-slate-950',
                },
                {
                  id: 'speedrun',
                  label: 'Mode Speedrun (×XP)',
                  icon: Timer,
                  activeBg: 'bg-amber-500',
                  activeText: 'text-slate-950',
                },
                {
                  id: 'attacks',
                  label: 'Attaques Live (10)',
                  icon: ShieldAlert,
                  activeBg: 'bg-rose-600',
                  activeText: 'text-white',
                },
                {
                  id: 'tools',
                  label: 'CTF & Outils (36)',
                  icon: Wrench,
                  activeBg: 'bg-sky-600 dark:bg-cyan-500',
                  activeText: 'text-white dark:text-slate-950',
                },
              ] as const
            ).map((cat) => {
              const Icon = cat.icon;
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSwitchCategory(cat.id)}
                  className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    active
                      ? cat.activeText
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="labs-category-pill"
                      transition={SPRING_SNAPPY}
                      className={`absolute inset-0 rounded-lg shadow-sm ${cat.activeBg}`}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {category !== 'speedrun' && category !== 'monitoring' && (
          <div
            role="tablist"
            aria-label="Choisir un laboratoire"
            className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl w-fit"
          >
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeLab === tab.id;
              const isResolved = isCyberAttackId(tab.id) && neutralizedAttacks.includes(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    playClick();
                    setActiveLab(tab.id);
                  }}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-slate-900 dark:text-cyan-200'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="labs-subtab-pill"
                      transition={SPRING_SNAPPY}
                      className="absolute inset-0 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-cyan-500/35 shadow-sm"
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {tab.label}
                    {isResolved && (
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                        aria-label="Résolu"
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={
            category === 'speedrun' || category === 'monitoring'
              ? category
              : `${category}-${activeLab}`
          }
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: EASE_SWISS }}
        >
          {category === 'monitoring' && (
            <SocLiveMonitoringLab
              onCompleteInvestigation={(xp) => onAwardLabXp?.(xp)}
            />
          )}

          {category === 'speedrun' && (
            <SpeedrunModeLab
              bestSpeedrunByCircuit={bestSpeedrunByCircuit}
              xpBoostMultiplier={xpBoostMultiplier}
              xpBoostRemainingSec={xpBoostRemainingSec}
              onCompleteSpeedrun={(res) => onCompleteSpeedrun?.(res)}
            />
          )}

          {category !== 'speedrun' && category !== 'monitoring' && isCyberAttackId(activeLab) && (
            <LiveAttackLab
              key={activeLab}
              attackId={activeLab}
              neutralizedIds={neutralizedAttacks}
              onNeutralizeAttack={handleNeutralize}
              onSelectAttack={(nextId) => setActiveLab(nextId)}
            />
          )}

          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'sniffer' && (
            <NetworkSnifferLab onCompleteChallenges={() => onAwardLabXp?.(100)} />
          )}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'authz' && (
            <ServerDbAuthLab onCompleteHardening={() => onAwardLabXp?.(120)} />
          )}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'topology' && (
            <InteractiveTopologyLab
              onCompleteChallenges={() => {
                onCompleteTopology?.();
                onAwardLabXp?.(120);
              }}
            />
          )}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'serverconfig' && (
            <ServerConfigLiveLab onCompleteLab={() => onAwardLabXp?.(100)} />
          )}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'vpnconfig' && (
            <VpnConfigLiveLab onCompleteLab={() => onAwardLabXp?.(95)} />
          )}
          {category !== 'speedrun' && category !== 'monitoring' && isAdvancedLabId(activeLab) && (
            <ExpertAdvancedLiveLab
              key={activeLab}
              labId={activeLab}
              onCompleteLab={() => onAwardLabXp?.(110)}
            />
          )}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'ctf' && (
            <CtfGuidedLab onCaptureFlag={onCaptureCtfFlag} />
          )}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'survival' && (
            <SocSurvivalLab
              bestScore={bestSocSurvivalScore}
              onFinishRun={onFinishSocSurvival}
            />
          )}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'jwttls' && (
            <JwtTlsAuditorLab onCompleteAudit={() => onAwardLabXp?.(80)} />
          )}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'dockersec' && (
            <DockerHardeningLab onHardened={() => onAwardLabXp?.(85)} />
          )}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'nmap' && (
            <NmapAuditLab onAuditComplete={() => onAwardLabXp?.(75)} />
          )}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'linux' && <LinuxAdminLab />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'backup' && <BackupPraLab />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'ddos' && <AntiDdosGame onWinBonusXp={onWinDdosXp} />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'sqli' && <SqlInjectionLab onMasterSqli={onMasterSqli} />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'crisis' && <CrisisResponseLab onContainCrisis={onContainCrisis} />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'sandbox' && <NetworkArchitectSandboxLab />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'packet' && <PacketSimulatorView />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'wireshark' && <WiresharkTcpdumpLab />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'azure' && <AzureMonitorLab />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'terminal' && (
            <NetworkTerminalLab onCompleteMissions={onCompleteTerminalMissions} />
          )}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'dhcp' && <DhcpNatLab />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'http' && <HttpApiInspectorLab />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'password' && <PasswordEntropyLab />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'bandwidth' && <BandwidthCalculatorLab />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'routing' && <DynamicRoutingLab />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'architect' && <CloudArchitectLab />}
          {category !== 'speedrun' && category !== 'monitoring' && activeLab === 'ip' && <IpSubnetLab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
