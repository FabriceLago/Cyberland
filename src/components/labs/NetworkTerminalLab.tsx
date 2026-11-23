import React, { useEffect, useRef, useState } from 'react';
import { Terminal, CheckCircle2, RotateCcw, Send, Compass } from 'lucide-react';
import { playClick, playError, playPacket, playSuccess, playVictory } from '../../utils/sound';

interface NetworkTerminalLabProps {
  onCompleteMissions?: () => void;
}

type ShellMode = 'linux' | 'powershell';

interface TerminalLine {
  id: number;
  kind: 'cmd' | 'out' | 'ok' | 'err' | 'info';
  text: string;
}

interface MissionItem {
  id: string;
  title: string;
  hint: string;
  linuxCmd: string;
  psCmd: string;
}

interface PacketVisualState {
  activePath: 'idle' | 'dns' | 'ping' | 'trace' | 'sec' | 'ip' | 'tcpdump';
  label: string;
  hopIndex: number;
}

const MISSIONS: MissionItem[] = [
  {
    id: 'm-dns',
    title: 'Résoudre l’adresse IP de ile-des-palmiers.gem',
    hint: 'Utilisez nslookup / dig (Linux) ou Resolve-DnsName (PowerShell).',
    linuxCmd: 'nslookup ile-des-palmiers.gem',
    psCmd: 'Resolve-DnsName ile-des-palmiers.gem',
  },
  {
    id: 'm-ping',
    title: 'Vérifier la latence vers le serveur Palmiers',
    hint: 'Lancez ping (Linux) ou Test-Connection (PowerShell) vers 192.168.1.42.',
    linuxCmd: 'ping 192.168.1.42',
    psCmd: 'Test-Connection 192.168.1.42',
  },
  {
    id: 'm-trace',
    title: 'Cartographier les routeurs jusqu’au Nuage Céleste',
    hint: 'Exécutez traceroute (Linux) ou tracert (Windows) vers nuage.gem.',
    linuxCmd: 'traceroute nuage.gem',
    psCmd: 'tracert nuage.gem',
  },
  {
    id: 'm-sec',
    title: 'Auditer les ports ouverts ou tester HTTPS',
    hint: 'Tapez netstat / ip a / tcpdump (Linux) ou Get-NetTCPConnection / Test-NetConnection (PowerShell).',
    linuxCmd: 'netstat',
    psCmd: 'Test-NetConnection forteresse.gem -Port 443',
  },
];

const QUICK_LINUX = [
  'help',
  'ip a',
  'nslookup ile-des-palmiers.gem',
  'ping 192.168.1.42',
  'traceroute nuage.gem',
  'netstat',
  'tcpdump -i eth0 port 443',
  'curl https://forteresse.gem',
];

const QUICK_POWERSHELL = [
  'help',
  'ipconfig',
  'Resolve-DnsName ile-des-palmiers.gem',
  'Test-Connection 192.168.1.42',
  'tracert nuage.gem',
  'Get-NetTCPConnection',
  'Test-NetConnection forteresse.gem -Port 443',
];

const DNS_TABLE: Record<string, string> = {
  'ile-des-palmiers.gem': '192.168.1.42',
  'nuage.gem': '10.42.0.100',
  'forteresse.gem': '172.16.10.44',
  'meteo.gem': '10.42.0.80',
  'dns.gem': '10.0.0.53',
};

export const NetworkTerminalLab: React.FC<NetworkTerminalLabProps> = ({
  onCompleteMissions,
}) => {
  const [shellMode, setShellMode] = useState<ShellMode>('linux');
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 1,
      kind: 'info',
      text: 'CyberShell (Linux bash & Windows PowerShell) — Poste d’administration de Cyberland',
    },
    {
      id: 2,
      kind: 'out',
      text: 'Tapez "help" ou cliquez sur un raccourci : chaque commande anime le trajet réel du paquet ci-dessus.',
    },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [rewarded, setRewarded] = useState(false);
  const [visual, setVisual] = useState<PacketVisualState>({
    activePath: 'idle',
    label: 'En attente d’une commande réseau...',
    hopIndex: 0,
  });

  const outputRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(3);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // Animate packet hops step by step whenever a new path starts
  useEffect(() => {
    if (visual.activePath === 'idle') return;
    const maxHop = visual.activePath === 'ip' ? 1 : visual.activePath === 'dns' ? 2 : 4;
    if (visual.hopIndex >= maxHop) return;
    const t = window.setTimeout(() => {
      setVisual((prev) => ({ ...prev, hopIndex: prev.hopIndex + 1 }));
    }, 260);
    return () => window.clearTimeout(t);
  }, [visual.activePath, visual.hopIndex]);

  const triggerAnimation = (path: PacketVisualState['activePath'], label: string) => {
    setVisual({ activePath: path, label, hopIndex: 0 });
  };

  const appendLines = (entries: Omit<TerminalLine, 'id'>[]) => {
    setLines((prev) => [
      ...prev,
      ...entries.map((entry) => ({
        ...entry,
        id: nextId.current++,
      })),
    ]);
  };

  const markMission = (missionId: string) => {
    setCompletedMissions((prev) => {
      if (prev.includes(missionId)) return prev;
      const updated = [...prev, missionId];
      if (updated.length === MISSIONS.length && !rewarded) {
        setRewarded(true);
        playVictory();
        onCompleteMissions?.();
      } else {
        playSuccess();
      }
      return updated;
    });
  };

  const executeCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    setHistory((prev) => [trimmed, ...prev.slice(0, 29)]);
    setHistoryIdx(-1);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = (parts[1] ?? '').toLowerCase();

    if (cmd === 'clear' || cmd === 'cls') {
      playClick();
      setVisual({ activePath: 'idle', label: 'Console effacée.', hopIndex: 0 });
      setLines([
        {
          id: nextId.current++,
          kind: 'info',
          text: 'Terminal effacé. Tapez "help" pour revoir les commandes Linux & PowerShell.',
        },
      ]);
      return;
    }

    const promptPrefix =
      shellMode === 'linux' ? 'architecte@cyberland:~$' : 'PS C:\\Cyberland>';
    const out: Omit<TerminalLine, 'id'>[] = [{ kind: 'cmd', text: `${promptPrefix} ${trimmed}` }];

    if (cmd === 'help') {
      playClick();
      out.push(
        { kind: 'info', text: 'Commandes Linux (bash) & Windows PowerShell reconnues :' },
        { kind: 'out', text: '  ip a / ipconfig              Affiche la carte réseau, IP locale et passerelle' },
        { kind: 'out', text: '  nslookup / dig / Resolve-DnsName <domaine>   Résolution DNS (Nom → IP)' },
        { kind: 'out', text: '  ping / Test-Connection <cible>               Test ICMP et mesure de latence' },
        { kind: 'out', text: '  traceroute / tracert <cible>                 Cartographie saut par saut' },
        { kind: 'out', text: '  netstat / Get-NetTCPConnection               Liste les ports ouverts (TCP/UDP)' },
        { kind: 'out', text: '  curl / Test-NetConnection <cible>            Vérifie port 443 et certificat TLS' },
        { kind: 'out', text: '  tcpdump -i eth0 port 443                     Capture rapide des trames en CLI' }
      );
      appendLines(out);
      return;
    }

    if (cmd === 'ip' || cmd === 'ipconfig' || cmd === 'ifconfig') {
      playPacket();
      triggerAnimation('ip', 'Inspection de l’interface locale eth0 (192.168.1.24/24)');
      if (cmd === 'ipconfig') {
        out.push(
          { kind: 'info', text: 'Carte Ethernet Cyberland-LAN :' },
          { kind: 'ok', text: '   Adresse IPv4. . . . . . . . . . . . . : 192.168.1.24' },
          { kind: 'out', text: '   Masque de sous-réseau . . . . . . . . : 255.255.255.0' },
          { kind: 'out', text: '   Passerelle par défaut . . . . . . . . : 192.168.1.1' },
          { kind: 'out', text: '   Serveur DNS . . . . . . . . . . . . . : 10.0.0.53' }
        );
      } else {
        out.push(
          { kind: 'info', text: '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500' },
          { kind: 'out', text: '    link/ether a4:5e:60:c1:09:b2 brd ff:ff:ff:ff:ff:ff' },
          { kind: 'ok', text: '    inet 192.168.1.24/24 brd 192.168.1.255 scope global eth0' },
          { kind: 'out', text: '    default via 192.168.1.1 dev eth0 · DNS 10.0.0.53' }
        );
      }
      appendLines(out);
      markMission('m-sec');
      return;
    }

    if (cmd === 'nslookup' || cmd === 'dig' || cmd === 'resolve-dnsname') {
      const target = arg || 'ile-des-palmiers.gem';
      const resolved = DNS_TABLE[target];
      if (resolved) {
        playPacket();
        triggerAnimation('dns', `Requête DNS UDP:53 → ${target} = ${resolved}`);
        out.push(
          { kind: 'out', text: 'Serveur DNS : tour-dns.gem (10.0.0.53)' },
          { kind: 'ok', text: `Nom :     ${target}` },
          { kind: 'ok', text: `Adresse : ${resolved}  (Enregistrement A · TTL 300s · 4 ms)` }
        );
        appendLines(out);
        markMission('m-dns');
      } else {
        playError();
        out.push({
          kind: 'err',
          text: `** tour-dns.gem ne trouve pas "${target}" : NXDOMAIN (essayez ile-des-palmiers.gem ou nuage.gem).`,
        });
        appendLines(out);
      }
      return;
    }

    if (cmd === 'ping' || cmd === 'test-connection') {
      const target = arg || '192.168.1.42';
      const ip = DNS_TABLE[target] ?? target;
      const validIp = /^(10|172|192)\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip);
      if (validIp) {
        playPacket();
        const baseMs = ip.startsWith('192.168') ? 11 : ip.startsWith('10.42') ? 19 : 7;
        triggerAnimation('ping', `ICMP Echo Request/Reply → ${ip} (${baseMs} ms)`);
        out.push(
          { kind: 'out', text: `PING ${target} (${ip}) : 56 octets de données ICMP` },
          { kind: 'ok', text: `Réponse de ${ip} : icmp_seq=1 ttl=64 temps=${baseMs} ms` },
          { kind: 'ok', text: `Réponse de ${ip} : icmp_seq=2 ttl=64 temps=${baseMs + 1} ms` },
          { kind: 'ok', text: `Réponse de ${ip} : icmp_seq=3 ttl=64 temps=${baseMs - 1} ms` },
          {
            kind: 'info',
            text: `--- Statistiques ${target} : 3 transmis, 3 reçus, 0 % perte (moy. ${baseMs} ms) ---`,
          }
        );
        appendLines(out);
        markMission('m-ping');
      } else {
        playError();
        out.push({
          kind: 'err',
          text: `Hôte inconnu "${target}". Essayez "ping 192.168.1.42" ou "Test-Connection nuage.gem".`,
        });
        appendLines(out);
      }
      return;
    }

    if (cmd === 'traceroute' || cmd === 'tracert') {
      const target = arg || 'nuage.gem';
      const ip = DNS_TABLE[target] ?? '10.42.0.100';
      playPacket();
      triggerAnimation('trace', `Cartographie TTL 1→4 vers ${target} (${ip})`);
      out.push(
        { kind: 'out', text: `${cmd} vers ${target} (${ip}), 30 sauts max :` },
        { kind: 'out', text: ' 1  passerelle-village.lan (192.168.1.1)     2.1 ms' },
        { kind: 'out', text: ' 2  phare-port-nord.gem (10.0.1.1)           6.8 ms' },
        { kind: 'out', text: ' 3  pare-feu-forteresse.gem (172.16.0.1)    12.4 ms' },
        { kind: 'ok', text: ` 4  ${target} (${ip})               18.9 ms  [Destination atteinte]` }
      );
      appendLines(out);
      markMission('m-trace');
      return;
    }

    if (cmd === 'netstat' || cmd === 'get-nettcpconnection') {
      playPacket();
      triggerAnimation('sec', 'Audit des sockets TCP/UDP et filtrage pare-feu');
      out.push(
        { kind: 'info', text: 'Proto  Adresse locale        Port  Service         État' },
        { kind: 'ok', text: 'TCP    0.0.0.0:443           443   HTTPS (TLS)     LISTEN (Sécurisé)' },
        { kind: 'ok', text: 'TCP    10.0.0.1:22           22    SSH (Admin)     LISTEN (VPN requis)' },
        { kind: 'ok', text: 'UDP    10.0.0.53:53          53    DNS             LISTEN' },
        { kind: 'err', text: 'TCP    0.0.0.0:23            23    Telnet          BLOQUÉ par Pare-feu' }
      );
      appendLines(out);
      markMission('m-sec');
      return;
    }

    if (cmd === 'tcpdump') {
      playPacket();
      triggerAnimation('tcpdump', 'Capture BPF en direct sur eth0 (port 443 TLS 1.3)');
      out.push(
        { kind: 'info', text: 'tcpdump: écoute sur eth0 (EN10MB), filtre BPF actif...' },
        { kind: 'ok', text: '14:02:11.104 IP 192.168.1.24.54112 > 172.16.10.44.443: Flags [S], seq 10293' },
        { kind: 'ok', text: '14:02:11.116 IP 172.16.10.44.443 > 192.168.1.24.54112: Flags [S.], ack 10294' },
        { kind: 'ok', text: '14:02:11.124 IP 192.168.1.24.54112 > 172.16.10.44.443: TLSv1.3 Application Data' },
        { kind: 'info', text: '3 paquets capturés · 0 paquet perdu par le noyau' }
      );
      appendLines(out);
      markMission('m-sec');
      return;
    }

    if (cmd === 'curl' || cmd === 'test-netconnection') {
      const target = arg || 'https://forteresse.gem';
      if (target.startsWith('http://')) {
        playError();
        triggerAnimation('sec', 'Alerte HTTP port 80 en clair → Redirection 301 vers 443');
        out.push(
          { kind: 'err', text: `Connexion HTTP (port 80 non chiffré) vers ${target}` },
          { kind: 'info', text: 'HTTP/1.1 301 Moved Permanently → Redirection vers HTTPS (port 443)' }
        );
      } else {
        playPacket();
        triggerAnimation('sec', `Poignée de main TLS 1.3 réussie sur TCP 443 (${target})`);
        if (cmd === 'test-netconnection') {
          out.push(
            { kind: 'out', text: `ComputerName     : ${target}` },
            { kind: 'out', text: 'RemoteAddress    : 172.16.10.44' },
            { kind: 'out', text: 'RemotePort       : 443' },
            { kind: 'ok', text: 'TcpTestSucceeded : True  (Port HTTPS ouvert & chiffré TLS 1.3)' }
          );
        } else {
          out.push(
            { kind: 'out', text: `* Poignée de main TLS 1.3 réussie avec ${target} (port 443)` },
            { kind: 'ok', text: '* Certificat valide : CN=*.cyberland.gem · Chiffrement actif' },
            { kind: 'ok', text: '< HTTP/2 200 OK · server: CyberCloud-LB · zone: AZ-B' }
          );
        }
        markMission('m-sec');
      }
      appendLines(out);
      return;
    }

    playError();
    out.push({
      kind: 'err',
      text: `Commande inconnue : "${cmd}". Tapez "help" pour lister les commandes Linux & PowerShell.`,
    });
    appendLines(out);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const next = Math.min(history.length - 1, historyIdx + 1);
      setHistoryIdx(next);
      setInput(history[next] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx <= 0) {
        setHistoryIdx(-1);
        setInput('');
      } else {
        const next = historyIdx - 1;
        setHistoryIdx(next);
        setInput(history[next] ?? '');
      }
    }
  };

  const handleReset = () => {
    playClick();
    setCompletedMissions([]);
    setRewarded(false);
    setVisual({ activePath: 'idle', label: 'Session réinitialisée.', hopIndex: 0 });
    setLines([
      {
        id: nextId.current++,
        kind: 'info',
        text: 'Session réinitialisée. Testez vos commandes en mode Linux ou Windows PowerShell !',
      },
    ]);
  };

  const quickCommands = shellMode === 'linux' ? QUICK_LINUX : QUICK_POWERSHELL;
  const diagramNodes = [
    { x: 24, label: 'Poste Admin', sub: '192.168.1.24' },
    { x: 164, label: 'Passerelle LAN', sub: '192.168.1.1' },
    { x: 304, label: visual.activePath === 'dns' ? 'Tour DNS' : 'Phare-Routeur', sub: visual.activePath === 'dns' ? '10.0.0.53' : '10.0.1.1' },
    { x: 444, label: 'Pare-feu', sub: '172.16.0.1' },
    { x: 584, label: 'Serveur Cible', sub: visual.activePath === 'trace' ? 'nuage.gem' : 'cyberland.gem' },
  ];

  const activeNodeX = diagramNodes[Math.min(visual.hopIndex, diagramNodes.length - 1)].x + 56;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 8 cols: Animated Network Path + Interactive Dual-OS Console */}
      <div className="lg:col-span-8 space-y-4">
        {/* Live Synchronized Network Path Visualizer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Trajet réseau animé en temps réel
            </span>
            <span className="font-mono text-sky-700 dark:text-sky-400">{visual.label}</span>
          </div>
          <svg
            viewBox="0 0 720 96"
            className="w-full h-auto rounded-lg bg-[#F4F8FC] dark:bg-slate-950"
            role="img"
            aria-label="Animation réseau synchronisée avec les commandes du terminal"
          >
            <line x1="80" y1="54" x2="640" y2="54" stroke="#CBD5E1" strokeWidth="3" />
            {visual.activePath !== 'idle' && (
              <line
                x1="80"
                y1="54"
                x2={activeNodeX}
                y2="54"
                stroke="#0284C7"
                strokeWidth="4"
                style={{ transition: 'all 240ms ease-out' }}
              />
            )}
            {diagramNodes.map((n, idx) => {
              const reached = visual.activePath !== 'idle' && visual.hopIndex >= idx;
              return (
                <g key={n.label}>
                  <rect
                    x={n.x}
                    y="28"
                    width="112"
                    height="52"
                    rx="8"
                    fill={reached ? '#E0F2FE' : '#FFFFFF'}
                    stroke={reached ? '#0284C7' : '#94A3B8'}
                    strokeWidth={reached ? '2.2' : '1.5'}
                  />
                  <text
                    x={n.x + 56}
                    y="50"
                    textAnchor="middle"
                    className="fill-slate-900 text-[10px] font-bold"
                  >
                    {n.label}
                  </text>
                  <text
                    x={n.x + 56}
                    y="67"
                    textAnchor="middle"
                    className="fill-slate-600 text-[9px] font-mono"
                  >
                    {n.sub}
                  </text>
                </g>
              );
            })}
            {visual.activePath !== 'idle' && (
              <circle
                cx={activeNodeX}
                cy="16"
                r="6.5"
                fill="#059669"
                style={{ transition: 'cx 240ms ease-out' }}
              />
            )}
          </svg>
        </div>

        {/* Interactive CLI Console */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>
                {shellMode === 'linux'
                  ? 'CyberShell · Linux bash'
                  : 'CyberShell · Windows PowerShell'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 p-0.5 bg-slate-800 rounded-md">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setShellMode('linux');
                  }}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                    shellMode === 'linux'
                      ? 'bg-sky-700 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Linux (bash)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setShellMode('powershell');
                  }}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                    shellMode === 'powershell'
                      ? 'bg-sky-700 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Windows PowerShell
                </button>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            </div>
          </div>

          <div
            ref={outputRef}
            className="p-4 h-[310px] overflow-y-auto font-mono text-xs sm:text-[13px] space-y-1.5 leading-relaxed"
            aria-live="polite"
          >
            {lines.map((line) => (
              <div
                key={line.id}
                className={
                  line.kind === 'cmd'
                    ? 'text-sky-300 font-semibold pt-1.5'
                    : line.kind === 'ok'
                    ? 'text-emerald-400'
                    : line.kind === 'err'
                    ? 'text-amber-400'
                    : line.kind === 'info'
                    ? 'text-slate-200 font-semibold'
                    : 'text-slate-300 whitespace-pre-wrap'
                }
              >
                {line.text}
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <span className="font-mono text-xs text-emerald-400 shrink-0 select-none">
              {shellMode === 'linux' ? '$' : 'PS>'}
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                shellMode === 'linux'
                  ? 'Ex. ping 192.168.1.42, ip a, tcpdump -i eth0 port 443'
                  : 'Ex. Test-Connection 192.168.1.42, Resolve-DnsName nuage.gem'
              }
              aria-label="Commande terminal CyberShell"
              className="flex-1 bg-transparent font-mono text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-600 rounded-md transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Exécuter
            </button>
          </form>

          <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1">Raccourcis :</span>
            {quickCommands.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => executeCommand(cmd)}
                className="px-2.5 py-1 text-[11px] font-mono text-sky-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right 4 cols: 4 Guided Diagnostic Missions */}
      <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
              Missions de terrain CyberShell
            </p>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Carnet de diagnostic
            </h2>
          </div>
          <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {completedMissions.length}/{MISSIONS.length}
          </span>
        </div>

        <div className="space-y-3">
          {MISSIONS.map((m) => {
            const done = completedMissions.includes(m.id);
            const sample = shellMode === 'linux' ? m.linuxCmd : m.psCmd;
            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-lg border space-y-1.5 transition-colors ${
                  done
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{m.title}</p>
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Compass className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">{m.hint}</p>
                {!done && (
                  <button
                    type="button"
                    onClick={() => executeCommand(sample)}
                    className="font-mono text-[11px] font-semibold text-sky-700 dark:text-sky-400 hover:underline text-left"
                  >
                    Tester : {sample} →
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {completedMissions.length === MISSIONS.length && (
          <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
            <strong>Bravo !</strong> Les commandes Linux &amp; PowerShell sont maîtrisées (+50 XP et
            succès « Hacker Éthique » débloqué).
          </div>
        )}
      </aside>
    </div>
  );
};
