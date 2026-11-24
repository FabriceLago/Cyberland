import React, { useState } from 'react';
import {
  CheckCircle2,
  Play,
  Radar,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { playClick, playError, playPacket, playSuccess, playVictory } from '../../utils/sound';

interface NmapPort {
  port: number;
  proto: 'tcp' | 'udp';
  service: string;
  version: string;
  risk: 'safe' | 'warn' | 'critical';
  finding: string;
  fixCommand: string;
  shouldClose: boolean;
}

interface NmapTarget {
  id: string;
  name: string;
  ip: string;
  role: string;
  ports: NmapPort[];
}

const TARGETS: NmapTarget[] = [
  {
    id: 'web-prod',
    name: 'srv-web-prod-01',
    ip: '203.0.113.42',
    role: 'Serveur Web Public en DMZ',
    ports: [
      {
        port: 22,
        proto: 'tcp',
        service: 'ssh',
        version: 'OpenSSH 9.6p1',
        risk: 'warn',
        finding: 'SSH ouvert à 0.0.0.0/0 — restreindre à l’IP admin ou VPN.',
        fixCommand: 'sudo ufw delete allow 22 && sudo ufw allow from 198.51.100.5 to any port 22',
        shouldClose: true,
      },
      {
        port: 23,
        proto: 'tcp',
        service: 'telnet',
        version: 'Linux telnetd (clair)',
        risk: 'critical',
        finding: 'Protocole obsolète en clair : mots de passe interceptables !',
        fixCommand: 'sudo systemctl disable --now inetd && sudo ufw deny 23/tcp',
        shouldClose: true,
      },
      {
        port: 443,
        proto: 'tcp',
        service: 'https',
        version: 'nginx 1.24 (TLS 1.3)',
        risk: 'safe',
        finding: 'Service web public chiffré légitime — à conserver ouvert.',
        fixCommand: 'Port légitime à laisser ouvert.',
        shouldClose: false,
      },
      {
        port: 5432,
        proto: 'tcp',
        service: 'postgresql',
        version: 'PostgreSQL 16.1',
        risk: 'critical',
        finding: 'Base de données directement exposée sur Internet !',
        fixCommand: 'sudo ufw deny 5432/tcp && bind listen_addresses = localhost',
        shouldClose: true,
      },
    ],
  },
  {
    id: 'ad-internal',
    name: 'dc-cyberland-01',
    ip: '10.10.20.10',
    role: 'Contrôleur de Domaine & Fichiers',
    ports: [
      {
        port: 88,
        proto: 'tcp',
        service: 'kerberos',
        version: 'Microsoft Windows Kerberos',
        risk: 'safe',
        finding: 'Authentification interne Active Directory légitime.',
        fixCommand: 'Port interne requis pour Kerberos.',
        shouldClose: false,
      },
      {
        port: 445,
        proto: 'tcp',
        service: 'microsoft-ds',
        version: 'SMBv1 activé (CVE-2017-0144)',
        risk: 'critical',
        finding: 'Vulnérable à EternalBlue / propagation ransomware !',
        fixCommand: 'Set-SmbServerConfiguration -EnableSMB1Protocol $false',
        shouldClose: true,
      },
      {
        port: 3389,
        proto: 'tcp',
        service: 'ms-wbt-server',
        version: 'RDP sans NLA',
        risk: 'critical',
        finding: 'Bureau à distance exposé sans passerelle VPN ni NLA.',
        fixCommand: 'Activer NLA + restreindre RDP via VPN uniquement.',
        shouldClose: true,
      },
    ],
  },
];

interface NmapAuditLabProps {
  onAuditComplete?: () => void;
}

export const NmapAuditLab: React.FC<NmapAuditLabProps> = ({ onAuditComplete }) => {
  const [targetId, setTargetId] = useState(TARGETS[0].id);
  const [scanMode, setScanMode] = useState<'sS' | 'sV' | 'vuln'>('sV');
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [fixedPorts, setFixedPorts] = useState<Record<string, boolean>>({});
  const [awarded, setAwarded] = useState(false);

  const target = TARGETS.find((t) => t.id === targetId) ?? TARGETS[0];
  const commandStr =
    scanMode === 'sS'
      ? `nmap -sS -T4 ${target.ip}`
      : scanMode === 'sV'
        ? `nmap -sV -O ${target.ip}`
        : `nmap -sV --script vuln ${target.ip}`;

  const runScan = () => {
    playPacket();
    setScanning(true);
    setScanned(false);
    window.setTimeout(() => {
      setScanning(false);
      setScanned(true);
      playSuccess();
    }, 650);
  };

  const vulnerablePorts = target.ports.filter((p) => p.shouldClose);
  const fixedCount = vulnerablePorts.filter((p) => fixedPorts[`${target.id}-${p.port}`]).length;
  const allHardened = fixedCount === vulnerablePorts.length && vulnerablePorts.length > 0;

  const toggleFixPort = (port: NmapPort) => {
    if (!port.shouldClose) {
      playError();
      return;
    }
    const key = `${target.id}-${port.port}`;
    setFixedPorts((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const nowFixed = vulnerablePorts.filter((p) => next[`${target.id}-${p.port}`]).length;
      if (nowFixed === vulnerablePorts.length) {
        playVictory();
        if (!awarded) {
          setAwarded(true);
          onAuditComplete?.();
        }
      } else {
        playSuccess();
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Radar className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Labo Nmap &amp; Audit de Ports en Direct
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Scannez un serveur cible avec Nmap, identifiez les ports ouverts critiques et corrigez chaque exposition pour durcir la machine.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            playClick();
            setFixedPorts({});
            setScanned(false);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 w-fit"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Réinitialiser
        </button>
      </div>

      {/* Target & Scan Flag Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Cible à auditer
          </div>
          <div className="space-y-2">
            {TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  playClick();
                  setTargetId(t.id);
                  setScanned(false);
                }}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-colors ${
                  t.id === targetId
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{t.name}</span>
                  <span className="font-mono text-sky-700 dark:text-sky-400">{t.ip}</span>
                </div>
                <div className="mt-0.5 text-[11px]">{t.role}</div>
              </button>
            ))}
          </div>

          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">
            2. Type de scan Nmap
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'sS', label: '-sS (SYN)', sub: 'Rapide furtif' },
                { id: 'sV', label: '-sV (Versions)', sub: 'Bannières' },
                { id: 'vuln', label: '--script vuln', sub: 'Audit CVE' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  playClick();
                  setScanMode(opt.id);
                }}
                className={`p-2 rounded-lg border text-left text-xs ${
                  scanMode === opt.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-mono font-bold">{opt.label}</div>
                <div className={scanMode === opt.id ? 'text-indigo-100 text-[10px]' : 'text-slate-500 text-[10px]'}>
                  {opt.sub}
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={runScan}
            disabled={scanning}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-60 text-white text-sm font-bold transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            {scanning ? 'Scan des ports en cours...' : `Lancer : ${commandStr}`}
          </button>
        </div>

        {/* Live Terminal Output & Remediation Table */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-mono text-xs text-emerald-400">
              <Terminal className="w-4 h-4" />
              <span>$ {commandStr}</span>
            </div>
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              Correctifs : {fixedCount}/{vulnerablePorts.length}
            </span>
          </div>

          {!scanned ? (
            <div className="py-12 text-center text-sm text-slate-400 font-mono">
              {scanning
                ? `Envoi des sondes SYN vers ${target.ip}...`
                : 'Cliquez sur « Lancer » pour découvrir les ports ouverts sur cette machine.'}
            </div>
          ) : (
            <div className="space-y-3">
              {allHardened && (
                <div className="rounded-xl bg-emerald-950/70 border border-emerald-600/70 p-3 flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Audit validé ! Tous les ports dangereux de {target.name} sont filtrés ou durcis.
                </div>
              )}

              <div className="space-y-2">
                {target.ports.map((p) => {
                  const isFixed = Boolean(fixedPorts[`${target.id}-${p.port}`]);
                  const stateLabel = isFixed ? 'filtered' : 'open';
                  return (
                    <div
                      key={p.port}
                      className={`rounded-xl border p-3 text-xs space-y-2 ${
                        isFixed
                          ? 'bg-emerald-950/35 border-emerald-700/60'
                          : p.risk === 'critical'
                            ? 'bg-rose-950/40 border-rose-700/60'
                            : p.risk === 'warn'
                              ? 'bg-amber-950/35 border-amber-700/60'
                              : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-mono flex items-center gap-3">
                          <span className="font-bold text-white">
                            {p.port}/{p.proto}
                          </span>
                          <span
                            className={`font-bold uppercase ${
                              isFixed ? 'text-emerald-400' : p.shouldClose ? 'text-rose-400' : 'text-sky-400'
                            }`}
                          >
                            {stateLabel}
                          </span>
                          <span className="text-slate-300">{p.service}</span>
                          {scanMode !== 'sS' && (
                            <span className="text-slate-400">{p.version}</span>
                          )}
                        </div>

                        {p.shouldClose ? (
                          <button
                            type="button"
                            onClick={() => toggleFixPort(p)}
                            className={`px-2.5 py-1 rounded-lg font-sans font-bold text-[11px] transition-colors ${
                              isFixed
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 hover:bg-rose-500 text-white'
                            }`}
                          >
                            {isFixed ? 'Corrigé ✓' : 'Fermer / Durcir'}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Service légitime
                          </span>
                        )}
                      </div>

                      <div className="text-slate-300 flex items-start gap-1.5">
                        {!isFixed && p.shouldClose && (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <span>{isFixed ? `Correctif appliqué : ${p.fixCommand}` : p.finding}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
