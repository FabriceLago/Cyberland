import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Binary,
  Bug,
  CheckCircle2,
  CloudCog,
  CloudOff,
  Container,
  Database,
  FileKey2,
  Flag,
  Flame,
  Gauge,
  GitBranch,
  Globe,
  HardDrive,
  KeyRound,
  Lock,
  MailWarning,
  MonitorCheck,
  Network,
  Radar,
  Repeat2,
  Router,
  ScanSearch,
  ShieldAlert,
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
import { CyberAttackId } from '../data/cyberAttackSimulations';
import { EASE_SWISS, SPRING_SNAPPY } from './MotionPrimitives';
import { playClick } from '../utils/sound';

interface LabsHubViewProps {
  onWinDdosXp: () => void;
  onCompleteTerminalMissions?: () => void;
  onContainCrisis?: () => void;
  onMasterSqli?: () => void;
  onNeutralizeCyberAttack?: (attackId: CyberAttackId) => void;
  onAwardLabXp?: (xp: number) => void;
  onCaptureCtfFlag?: (flagId: string, xp: number) => void;
  bestSocSurvivalScore?: number;
  onFinishSocSurvival?: (score: number, xpEarned: number) => void;
  bestSpeedrunByCircuit?: Record<string, number>;
  xpBoostMultiplier?: number;
  xpBoostRemainingSec?: number;
  onCompleteSpeedrun?: (result: SpeedrunCompletionResult) => void;
}

type LabCategory = 'speedrun' | 'attacks' | 'tools';

type LabTab =
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
  | 'dockersec';

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
  onWinDdosXp,
  onCompleteTerminalMissions,
  onContainCrisis,
  onMasterSqli,
  onNeutralizeCyberAttack,
  onAwardLabXp,
  onCaptureCtfFlag,
  bestSocSurvivalScore = 0,
  onFinishSocSurvival,
  bestSpeedrunByCircuit = {},
  xpBoostMultiplier = 1,
  xpBoostRemainingSec = 0,
  onCompleteSpeedrun,
}) => {
  const [category, setCategory] = useState<LabCategory>('speedrun');
  const [activeLab, setActiveLab] = useState<LabTab>('xss');
  const [neutralizedAttacks, setNeutralizedAttacks] = useState<CyberAttackId[]>([]);

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
    if (nextCat === 'tools') setActiveLab('ctf');
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
              30 ateliers tactiques · CTF · Survie SOC · {neutralizedAttacks.length} / {CYBER_ATTACK_IDS.length} attaques live neutralisées cette session
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Laboratoires Réseaux, Cloud &amp; Cyber
            </h1>
          </div>

          {/* 3-Category Switcher with Tactical SOC sliding pill */}
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
            {(
              [
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
                  label: 'CTF & Outils (20)',
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

        {category !== 'speedrun' && (
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
          key={category === 'speedrun' ? 'speedrun' : `${category}-${activeLab}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: EASE_SWISS }}
        >
          {category === 'speedrun' && (
            <SpeedrunModeLab
              bestSpeedrunByCircuit={bestSpeedrunByCircuit}
              xpBoostMultiplier={xpBoostMultiplier}
              xpBoostRemainingSec={xpBoostRemainingSec}
              onCompleteSpeedrun={(res) => onCompleteSpeedrun?.(res)}
            />
          )}

          {category !== 'speedrun' && isCyberAttackId(activeLab) && (
            <LiveAttackLab
              key={activeLab}
              attackId={activeLab}
              neutralizedIds={neutralizedAttacks}
              onNeutralizeAttack={handleNeutralize}
              onSelectAttack={(nextId) => setActiveLab(nextId)}
            />
          )}

          {category !== 'speedrun' && activeLab === 'ctf' && (
            <CtfGuidedLab onCaptureFlag={onCaptureCtfFlag} />
          )}
          {category !== 'speedrun' && activeLab === 'survival' && (
            <SocSurvivalLab
              bestScore={bestSocSurvivalScore}
              onFinishRun={onFinishSocSurvival}
            />
          )}
          {category !== 'speedrun' && activeLab === 'jwttls' && (
            <JwtTlsAuditorLab onCompleteAudit={() => onAwardLabXp?.(80)} />
          )}
          {category !== 'speedrun' && activeLab === 'dockersec' && (
            <DockerHardeningLab onHardened={() => onAwardLabXp?.(85)} />
          )}
          {category !== 'speedrun' && activeLab === 'nmap' && (
            <NmapAuditLab onAuditComplete={() => onAwardLabXp?.(75)} />
          )}
          {category !== 'speedrun' && activeLab === 'linux' && <LinuxAdminLab />}
          {category !== 'speedrun' && activeLab === 'backup' && <BackupPraLab />}
          {category !== 'speedrun' && activeLab === 'ddos' && <AntiDdosGame onWinBonusXp={onWinDdosXp} />}
          {category !== 'speedrun' && activeLab === 'sqli' && <SqlInjectionLab onMasterSqli={onMasterSqli} />}
          {category !== 'speedrun' && activeLab === 'crisis' && <CrisisResponseLab onContainCrisis={onContainCrisis} />}
          {category !== 'speedrun' && activeLab === 'sandbox' && <NetworkArchitectSandboxLab />}
          {category !== 'speedrun' && activeLab === 'packet' && <PacketSimulatorView />}
          {category !== 'speedrun' && activeLab === 'wireshark' && <WiresharkTcpdumpLab />}
          {category !== 'speedrun' && activeLab === 'azure' && <AzureMonitorLab />}
          {category !== 'speedrun' && activeLab === 'terminal' && (
            <NetworkTerminalLab onCompleteMissions={onCompleteTerminalMissions} />
          )}
          {category !== 'speedrun' && activeLab === 'dhcp' && <DhcpNatLab />}
          {category !== 'speedrun' && activeLab === 'http' && <HttpApiInspectorLab />}
          {category !== 'speedrun' && activeLab === 'password' && <PasswordEntropyLab />}
          {category !== 'speedrun' && activeLab === 'bandwidth' && <BandwidthCalculatorLab />}
          {category !== 'speedrun' && activeLab === 'routing' && <DynamicRoutingLab />}
          {category !== 'speedrun' && activeLab === 'architect' && <CloudArchitectLab />}
          {category !== 'speedrun' && activeLab === 'ip' && <IpSubnetLab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
