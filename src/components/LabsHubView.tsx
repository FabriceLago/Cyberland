import React, { useState } from 'react';
import {
  Activity,
  CloudCog,
  Binary,
  ShieldAlert,
  Terminal,
  Gauge,
  GitBranch,
  Router,
  Globe,
  KeyRound,
  Radar,
  MonitorCheck,
  Siren,
  Network,
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
import { playClick } from '../utils/sound';

interface LabsHubViewProps {
  onWinDdosXp: () => void;
  onCompleteTerminalMissions?: () => void;
  onContainCrisis?: () => void;
}

type LabTab =
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
  | 'ddos';

export const LabsHubView: React.FC<LabsHubViewProps> = ({
  onWinDdosXp,
  onCompleteTerminalMissions,
  onContainCrisis,
}) => {
  const [activeLab, setActiveLab] = useState<LabTab>('crisis');

  const tabs: { id: LabTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
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
    { id: 'ddos', label: 'Anti-DDoS', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
            14 ateliers techniques interactifs · Expérimentation libre
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            Laboratoires Réseaux, Cloud &amp; Cyber
          </h1>
        </div>

        <div
          role="tablist"
          aria-label="Choisir un laboratoire"
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-lg w-fit"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeLab === tab.id;
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
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeLab === 'crisis' && <CrisisResponseLab onContainCrisis={onContainCrisis} />}
      {activeLab === 'sandbox' && <NetworkArchitectSandboxLab />}
      {activeLab === 'packet' && <PacketSimulatorView />}
      {activeLab === 'wireshark' && <WiresharkTcpdumpLab />}
      {activeLab === 'azure' && <AzureMonitorLab />}
      {activeLab === 'terminal' && (
        <NetworkTerminalLab onCompleteMissions={onCompleteTerminalMissions} />
      )}
      {activeLab === 'dhcp' && <DhcpNatLab />}
      {activeLab === 'http' && <HttpApiInspectorLab />}
      {activeLab === 'password' && <PasswordEntropyLab />}
      {activeLab === 'bandwidth' && <BandwidthCalculatorLab />}
      {activeLab === 'routing' && <DynamicRoutingLab />}
      {activeLab === 'architect' && <CloudArchitectLab />}
      {activeLab === 'ip' && <IpSubnetLab />}
      {activeLab === 'ddos' && <AntiDdosGame onWinBonusXp={onWinDdosXp} />}
    </div>
  );
};
