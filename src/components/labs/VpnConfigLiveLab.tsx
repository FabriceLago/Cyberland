import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  KeyRound,
  Lock,
  Network,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Wifi,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface VpnConfigLiveLabProps {
  onCompleteLab?: () => void;
}

interface LogEntry {
  id: number;
  time: string;
  level: 'info' | 'ok' | 'warn' | 'err';
  text: string;
}

function generateFakeWgKey(seedTag: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  const salt = `${seedTag}-${Date.now()}-${Math.random()}`;
  let h = 2166136261;
  for (let i = 0; i < salt.length; i++) {
    h ^= salt.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = 0; i < 43; i++) {
    h = Math.imul(h ^ (i * 2654435761), 1597334677);
    out += alphabet[Math.abs(h) % alphabet.length];
  }
  return `${out}=`;
}

function nowTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export const VpnConfigLiveLab: React.FC<VpnConfigLiveLabProps> = ({ onCompleteLab }) => {
  // Cryptographic Keys
  const [serverPrivKey, setServerPrivKey] = useState('');
  const [serverPubKey, setServerPubKey] = useState('');
  const [clientPrivKey, setClientPrivKey] = useState('');
  const [clientPubKey, setClientPubKey] = useState('');
  const [pskKey, setPskKey] = useState('');

  // Server Configuration (wg0.conf)
  const [tunnelSubnet, setTunnelSubnet] = useState<'10.10.0' | '10.8.0'>('10.10.0');
  const [serverPort, setServerPort] = useState<number>(51820);
  const [ipForwardEnabled, setIpForwardEnabled] = useState(false);
  const [natMasqueradeEnabled, setNatMasqueradeEnabled] = useState(false);
  const [ufwPortOpen, setUfwPortOpen] = useState(false);
  const [peerRegistered, setPeerRegistered] = useState(false);

  // Client Configuration (client.conf)
  const [endpointPort, setEndpointPort] = useState<number>(51820);
  const [tunnelMode, setTunnelMode] = useState<'full' | 'split'>('full');
  const [dnsMode, setDnsMode] = useState<'vpn' | 'isp'>('isp');
  const [keepaliveSec, setKeepaliveSec] = useState<number>(25);

  // Live Runtime Tunnel State
  const [tunnelUp, setTunnelUp] = useState(false);
  const [handshakeAgeSec, setHandshakeAgeSec] = useState<number | null>(null);
  const [rxKb, setRxKb] = useState(0);
  const [txKb, setTxKb] = useState(0);
  const [internalPingPassed, setInternalPingPassed] = useState(false);
  const [dnsLeakCheckedClean, setDnsLeakCheckedClean] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState<'server' | 'client'>('server');
  const [copiedTab, setCopiedTab] = useState<'server' | 'client' | null>(null);
  const [xpAwarded, setXpAwarded] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      time: nowTimeStr(),
      level: 'info',
      text: 'Lab VPN Temps Réel prêt. Générez les clés Curve25519, configurez wg0.conf puis démarrez le tunnel.',
    },
  ]);

  const appendLog = (level: LogEntry['level'], text: string) => {
    setLogs((prev) => [
      ...prev.slice(-14),
      { id: Date.now() + Math.random(), time: nowTimeStr(), level, text },
    ]);
  };

  const keysReady = Boolean(serverPrivKey && serverPubKey && clientPrivKey && clientPubKey);
  const portMatches = serverPort === endpointPort;
  const canEstablishHandshake = keysReady && ufwPortOpen && peerRegistered && portMatches;
  const isConnectedLive = tunnelUp && canEstablishHandshake;
  const hasDnsLeak = isConnectedLive && dnsMode === 'isp';

  // Live telemetry ticker while tunnel is actively connected
  useEffect(() => {
    if (!isConnectedLive) {
      setHandshakeAgeSec(null);
      return;
    }
    setHandshakeAgeSec((prev) => (prev === null ? 0 : prev));
    const timer = window.setInterval(() => {
      setHandshakeAgeSec((prev) => (prev === null ? 1 : prev >= 120 ? 0 : prev + 1));
      setTxKb((prev) => prev + Math.floor(4 + Math.random() * 14));
      setRxKb((prev) => prev + Math.floor(8 + Math.random() * 26));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isConnectedLive]);

  // If user breaks a critical setting while connected, drop live handshake immediately
  useEffect(() => {
    if (tunnelUp && !canEstablishHandshake) {
      setTunnelUp(false);
      appendLog(
        'warn',
        'Tunnel interrompu : un paramètre critique (pare-feu UDP, clé Peer ou port Endpoint) a été modifié.'
      );
    }
  }, [tunnelUp, canEstablishHandshake]);

  const serverConfigText = useMemo(() => {
    const serverIp = `${tunnelSubnet}.1/24`;
    const clientIp = `${tunnelSubnet}.2/32`;
    const postUp = natMasqueradeEnabled
      ? `PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE\nPostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE`
      : `# PostUp NAT MASQUERADE désactivé (le client ne pourra pas sortir sur Internet via le VPN)`;

    return `# /etc/wireguard/wg0.conf — Serveur Passerelle Cyberland
# Routage noyau : net.ipv4.ip_forward = ${ipForwardEnabled ? '1 (ACTIF)' : '0 (INACTIF)'}
# Pare-feu UFW : ${ufwPortOpen ? `ALLOW ${serverPort}/udp` : `BLOQUÉ (${serverPort}/udp fermé)`}

[Interface]
Address = ${serverIp}
ListenPort = ${serverPort}
PrivateKey = ${serverPrivKey || '<CLÉ_PRIVÉE_SERVEUR_À_GÉNÉRER>'}
${postUp}

${
  peerRegistered
    ? `[Peer]
# Client Poste Nomade Analyste
PublicKey = ${clientPubKey || '<CLÉ_PUBLIQUE_CLIENT_À_GÉNÉRER>'}${pskKey ? `\nPresharedKey = ${pskKey}` : ''}
AllowedIPs = ${clientIp}`
    : `# [Peer] client non enregistré — cliquez sur « Autoriser le Peer client »`
}`;
  }, [
    tunnelSubnet,
    natMasqueradeEnabled,
    ipForwardEnabled,
    ufwPortOpen,
    serverPort,
    serverPrivKey,
    peerRegistered,
    clientPubKey,
    pskKey,
  ]);

  const clientConfigText = useMemo(() => {
    const clientIp = `${tunnelSubnet}.2/32`;
    const dnsLine = dnsMode === 'vpn' ? `${tunnelSubnet}.1` : '8.8.8.8 # Hors tunnel (risque fuite DNS)';
    const allowedIps =
      tunnelMode === 'full' ? '0.0.0.0/0, ::/0' : `${tunnelSubnet}.0/24, 192.168.10.0/24`;

    return `# client-nomade.conf — Poste Analyste (Wi-Fi Public)
[Interface]
PrivateKey = ${clientPrivKey || '<CLÉ_PRIVÉE_CLIENT_À_GÉNÉRER>'}
Address = ${clientIp}
DNS = ${dnsLine}

[Peer]
PublicKey = ${serverPubKey || '<CLÉ_PUBLIQUE_SERVEUR_À_GÉNÉRER>'}${pskKey ? `\nPresharedKey = ${pskKey}` : ''}
Endpoint = 203.0.113.45:${endpointPort}
AllowedIPs = ${allowedIps}${keepaliveSec > 0 ? `\nPersistentKeepalive = ${keepaliveSec}` : ''}`;
  }, [
    tunnelSubnet,
    dnsMode,
    tunnelMode,
    clientPrivKey,
    serverPubKey,
    pskKey,
    endpointPort,
    keepaliveSec,
  ]);

  // 5 Real-Time Validation Objectives
  const objectives = useMemo(
    () => [
      {
        id: 'obj-keys',
        label: 'Générer les clés Serveur & Client Curve25519',
        done: keysReady,
      },
      {
        id: 'obj-server',
        label: 'Configurer le serveur (ip_forward, NAT, UFW & Peer)',
        done: ipForwardEnabled && natMasqueradeEnabled && ufwPortOpen && peerRegistered,
      },
      {
        id: 'obj-handshake',
        label: 'Établir le Handshake WireGuard en direct (wg-quick up)',
        done: isConnectedLive,
      },
      {
        id: 'obj-dns',
        label: 'Activer Full-Tunnel + DNS interne (0 fuite DNS)',
        done: isConnectedLive && tunnelMode === 'full' && dnsMode === 'vpn' && dnsLeakCheckedClean,
      },
      {
        id: 'obj-ping',
        label: 'Valider le routage vers le LAN interne (192.168.10.50)',
        done: internalPingPassed && isConnectedLive && ipForwardEnabled,
      },
    ],
    [
      keysReady,
      ipForwardEnabled,
      natMasqueradeEnabled,
      ufwPortOpen,
      peerRegistered,
      isConnectedLive,
      tunnelMode,
      dnsMode,
      dnsLeakCheckedClean,
      internalPingPassed,
    ]
  );

  const completedObjectivesCount = objectives.filter((o) => o.done).length;
  const allObjectivesDone = completedObjectivesCount === objectives.length;

  useEffect(() => {
    if (allObjectivesDone && !xpAwarded) {
      setXpAwarded(true);
      playVictory();
      onCompleteLab?.();
      appendLog(
        'ok',
        'Félicitations ! Votre serveur et votre client VPN WireGuard sont 100 % opérationnels et durcis (+95 XP).'
      );
    }
  }, [allObjectivesDone, xpAwarded, onCompleteLab]);

  const handleGenerateKeys = () => {
    playSuccess();
    setServerPrivKey(generateFakeWgKey('srv-priv'));
    setServerPubKey(generateFakeWgKey('srv-pub'));
    setClientPrivKey(generateFakeWgKey('cli-priv'));
    setClientPubKey(generateFakeWgKey('cli-pub'));
    setPskKey(generateFakeWgKey('psk'));
    appendLog(
      'ok',
      '$ umask 077 && wg genkey | tee server.key | wg pubkey > server.pub — Paires Curve25519 + PSK générées.'
    );
  };

  const handleToggleTunnel = () => {
    if (tunnelUp) {
      playClick();
      setTunnelUp(false);
      appendLog('info', '$ wg-quick down wg0 — Interface virtuelle wg0 arrêtée proprement.');
      return;
    }

    if (!keysReady) {
      playError();
      appendLog('err', 'Échec wg-quick up : générez d’abord les clés Curve25519 Serveur & Client.');
      return;
    }
    if (!peerRegistered) {
      playError();
      appendLog(
        'err',
        'Échec Handshake : le serveur ignore la connexion car la clé publique du client n’est pas dans [Peer].'
      );
      return;
    }
    if (!ufwPortOpen) {
      playError();
      appendLog(
        'err',
        `Timeout Handshake : le pare-feu UFW bloque UDP/${serverPort} en entrée sur la passerelle.`
      );
      return;
    }
    if (!portMatches) {
      playError();
      appendLog(
        'err',
        `Échec Handshake : le client pointe sur le port ${endpointPort} alors que le serveur écoute sur ${serverPort}.`
      );
      return;
    }

    playSuccess();
    setTunnelUp(true);
    setHandshakeAgeSec(0);
    setTxKb((prev) => prev + 12);
    setRxKb((prev) => prev + 18);
    appendLog(
      'ok',
      `$ wg-quick up wg0 — Handshake Noise_IKpsk2 réussi sur 203.0.113.45:${serverPort} (ChaCha20-Poly1305).`
    );
  };

  const handleRunWgShow = () => {
    playClick();
    if (!isConnectedLive) {
      appendLog('warn', '$ wg show — Aucun handshake actif. Lancez d’abord « Démarrer le tunnel ».');
      return;
    }
    appendLog(
      'info',
      `$ wg show wg0 → peer ${clientPubKey.slice(0, 12)}... | endpoint 198.51.100.14:54102 | handshake ${handshakeAgeSec ?? 0}s | transfer ${rxKb} KiB rx / ${txKb} KiB tx`
    );
  };

  const handleRunInternalPing = () => {
    if (!isConnectedLive) {
      playError();
      appendLog('err', '$ ping 192.168.10.50 — Network is unreachable (tunnel VPN hors ligne).');
      return;
    }
    if (!ipForwardEnabled) {
      playError();
      appendLog(
        'err',
        '$ ping 192.168.10.50 — 100% packet loss ! Activez net.ipv4.ip_forward=1 sur le serveur pour router vers le LAN.'
      );
      return;
    }
    playSuccess();
    setInternalPingPassed(true);
    appendLog(
      'ok',
      `$ ping -c 3 192.168.10.50 — 3 reçus, 0 % perte, rtt avg=18.4 ms via wg0 (${tunnelSubnet}.2 → 192.168.10.50).`
    );
  };

  const handleRunPublicIpCheck = () => {
    if (!isConnectedLive) {
      playClick();
      appendLog(
        'warn',
        '$ curl ifconfig.me → 198.51.100.14 (IP directe du Wi-Fi public — trafic NON protégé par le VPN).'
      );
      return;
    }
    if (tunnelMode === 'split') {
      playClick();
      appendLog(
        'info',
        '$ curl ifconfig.me → 198.51.100.14 (Mode Split-Tunnel : seul le trafic interne passe dans le VPN).'
      );
      return;
    }
    if (!natMasqueradeEnabled) {
      playError();
      appendLog(
        'err',
        '$ curl ifconfig.me — Timeout ! En Full-Tunnel, activez iptables MASQUERADE (NAT) sur le serveur pour sortir sur Internet.'
      );
      return;
    }
    playSuccess();
    appendLog(
      'ok',
      '$ curl ifconfig.me → 203.0.113.45 (IP publique de votre passerelle VPN · trafic 100 % chiffré).'
    );
  };

  const handleRunDnsLeakTest = () => {
    if (!isConnectedLive) {
      playError();
      appendLog('err', '$ dig intranet.corp — Fuite DNS : vos requêtes partent en clair sur le Wi-Fi public !');
      return;
    }
    if (dnsMode === 'isp') {
      playError();
      appendLog(
        'warn',
        `$ dig intranet.corp — ALERTE FUITE DNS ! Le client interroge 8.8.8.8 hors VPN. Passez DNS sur ${tunnelSubnet}.1.`
      );
      return;
    }
    playSuccess();
    setDnsLeakCheckedClean(true);
    appendLog(
      'ok',
      `$ dig @${tunnelSubnet}.1 intranet.corp → 192.168.10.50 (Résolution chiffrée dans le tunnel · 0 fuite DNS).`
    );
  };

  const handleCopyConfig = async (which: 'server' | 'client') => {
    playClick();
    const content = which === 'server' ? serverConfigText : clientConfigText;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedTab(which);
      window.setTimeout(() => setCopiedTab(null), 2000);
    } catch {
      // Ignore clipboard API failure
    }
  };

  const handleDownloadConfig = (which: 'server' | 'client') => {
    playSuccess();
    const content = which === 'server' ? serverConfigText : clientConfigText;
    const filename = which === 'server' ? 'wg0.conf' : 'client-nomade.conf';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetLab = () => {
    playClick();
    setTunnelUp(false);
    setServerPrivKey('');
    setServerPubKey('');
    setClientPrivKey('');
    setClientPubKey('');
    setPskKey('');
    setIpForwardEnabled(false);
    setNatMasqueradeEnabled(false);
    setUfwPortOpen(false);
    setPeerRegistered(false);
    setServerPort(51820);
    setEndpointPort(51820);
    setTunnelMode('full');
    setDnsMode('isp');
    setKeepaliveSec(25);
    setInternalPingPassed(false);
    setDnsLeakCheckedClean(false);
    setRxKb(0);
    setTxKb(0);
    setLogs([
      {
        id: Date.now(),
        time: nowTimeStr(),
        level: 'info',
        text: 'Laboratoire réinitialisé. Prêt pour une nouvelle création de tunnel VPN WireGuard.',
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Lab Header & Live Progress */}
      <section className="rounded-2xl border border-slate-200 dark:border-cyan-500/25 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-mono font-semibold text-sky-700 dark:text-cyan-400">
              Lab Temps Réel · Création &amp; Configuration VPN WireGuard (Linux)
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Construire, Configurer et Tester un Tunnel VPN en Direct
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
              Générez de vraies clés Curve25519, activez le routage noyau, le NAT et le pare-feu
              UFW, établissez le Handshake WireGuard puis testez le tunnel face à un sniffer Wi-Fi
              public en temps réel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums">
              Objectifs :{' '}
              <strong
                className={
                  allObjectivesDone
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-sky-700 dark:text-cyan-300'
                }
              >
                {completedObjectivesCount} / {objectives.length}
              </strong>
            </div>
            <button
              type="button"
              onClick={handleToggleTunnel}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                isConnectedLive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              {isConnectedLive ? 'Arrêter wg0 (down)' : 'Démarrer le tunnel (wg-quick up)'}
            </button>
            <button
              type="button"
              onClick={handleResetLab}
              title="Réinitialiser le lab"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 Real-Time Objectives Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {objectives.map((obj, idx) => (
            <div
              key={obj.id}
              className={`rounded-xl border p-3 text-xs flex items-start gap-2 transition-colors ${
                obj.done
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                  : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  obj.done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}
              />
              <span>
                <strong className="font-mono">{idx + 1}.</strong> {obj.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Live Animated Tunnel Topology + Public Wi-Fi Sniffer */}
      <section className="rounded-2xl border border-slate-200 dark:border-cyan-500/25 bg-[#070E1D] text-slate-100 overflow-hidden shadow-lg">
        <div className="px-5 py-3 bg-[#060B16] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-semibold">
            {isConnectedLive ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            )}
            <span>
              État du tunnel :{' '}
              <strong
                className={
                  isConnectedLive
                    ? hasDnsLeak
                      ? 'text-amber-300'
                      : 'text-emerald-400'
                    : 'text-rose-400'
                }
              >
                {isConnectedLive
                  ? hasDnsLeak
                    ? 'CONNECTÉ (ALERTE FUITE DNS)'
                    : 'TUNNEL CHIFFRÉ ACTIF · ChaCha20-Poly1305'
                  : 'HORS LIGNE · TRAFIC EN CLAIR'}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] tabular-nums text-slate-300">
            <span>
              Handshake :{' '}
              <strong className="text-cyan-300">
                {handshakeAgeSec !== null ? `il y a ${handshakeAgeSec}s` : 'aucun'}
              </strong>
            </span>
            <span>
              TX/RX :{' '}
              <strong className="text-emerald-300">
                {txKb} / {rxKb} KiB
              </strong>
            </span>
            <span>
              Mode :{' '}
              <strong className="text-white">
                {tunnelMode === 'full' ? 'Full-Tunnel (0.0.0.0/0)' : 'Split-Tunnel'}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left 8 cols: Animated VPN Encapsulation SVG */}
          <div className="lg:col-span-8 p-4 sm:p-5">
            <svg
              viewBox="0 0 680 175"
              className="w-full h-auto max-h-[185px]"
              role="img"
              aria-label="Schéma temps réel du tunnel WireGuard entre le poste nomade, Internet, la passerelle VPN et le réseau interne"
            >
              {/* Tunnel Encrypted Pipe Backdrop */}
              <rect
                x="118"
                y="56"
                width="318"
                height="62"
                rx="31"
                fill={isConnectedLive ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.08)'}
                stroke={isConnectedLive ? '#10B981' : '#F43F5E'}
                strokeWidth="1.8"
                strokeDasharray={isConnectedLive ? '0' : '6 6'}
              />
              <text
                x="277"
                y="46"
                textAnchor="middle"
                className={`text-[10px] font-mono font-bold ${
                  isConnectedLive ? 'fill-emerald-300' : 'fill-rose-300'
                }`}
              >
                {isConnectedLive
                  ? `TUNNEL WIREGUARD CHIFFRÉ · UDP/${serverPort} ${pskKey ? '+ PSK' : ''}`
                  : 'WI-FI PUBLIC NON CHIFFRÉ (EN ATTENTE DU TUNNEL)'}
              </text>

              {/* Conduit Client -> Gateway */}
              <line
                x1="126"
                y1="87"
                x2="428"
                y2="87"
                stroke={isConnectedLive ? '#34D399' : '#FB7185'}
                strokeWidth="2.5"
                strokeDasharray="6 8"
                className={isConnectedLive ? 'flow-dash' : ''}
              />

              {/* Conduit Gateway -> Internal LAN */}
              <line
                x1="528"
                y1="87"
                x2="574"
                y2="87"
                stroke={isConnectedLive && ipForwardEnabled ? '#22D3EE' : '#475569'}
                strokeWidth="2.5"
                strokeDasharray="5 5"
                className={isConnectedLive && ipForwardEnabled ? 'flow-dash' : ''}
              />

              {/* Moving Encrypted Packet Dots */}
              {isConnectedLive && (
                <>
                  <motion.circle
                    r="5"
                    cy="87"
                    fill="#34D399"
                    initial={{ cx: 132 }}
                    animate={{ cx: [132, 422] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.circle
                    r="4.5"
                    cy="87"
                    fill="#22D3EE"
                    initial={{ cx: 422 }}
                    animate={{ cx: [422, 132] }}
                    transition={{ duration: 1.7, delay: 0.4, repeat: Infinity, ease: 'linear' }}
                  />
                </>
              )}

              {/* Node 1: Client Nomade */}
              <rect
                x="14"
                y="46"
                width="112"
                height="82"
                rx="10"
                fill="#0F172A"
                stroke={isConnectedLive ? '#34D399' : '#38BDF8'}
                strokeWidth="1.8"
              />
              <text x="70" y="75" textAnchor="middle" className="fill-white text-[11px] font-bold">
                POSTE CLIENT
              </text>
              <text x="70" y="93" textAnchor="middle" className="fill-cyan-300 text-[9.5px] font-mono">
                wg0 {tunnelSubnet}.2
              </text>
              <text x="70" y="110" textAnchor="middle" className="fill-slate-400 text-[9px] font-mono">
                Wi-Fi Café
              </text>

              {/* Middle Label: Public Internet / Sniffer */}
              <rect
                x="212"
                y="68"
                width="130"
                height="38"
                rx="8"
                fill="#091122"
                stroke="#334155"
              />
              <text x="277" y="84" textAnchor="middle" className="fill-slate-200 text-[9.5px] font-bold">
                INTERNET PUBLIC
              </text>
              <text x="277" y="98" textAnchor="middle" className="fill-slate-400 text-[8.5px] font-mono">
                203.0.113.45:{endpointPort}
              </text>

              {/* Node 2: Passerelle VPN Serveur */}
              <rect
                x="428"
                y="40"
                width="104"
                height="94"
                rx="10"
                fill="#0F172A"
                stroke={ufwPortOpen && peerRegistered ? '#22D3EE' : '#F59E0B'}
                strokeWidth="2"
              />
              <text x="480" y="68" textAnchor="middle" className="fill-white text-[11px] font-bold">
                SERVEUR VPN
              </text>
              <text x="480" y="86" textAnchor="middle" className="fill-cyan-300 text-[9.5px] font-mono">
                wg0 {tunnelSubnet}.1
              </text>
              <text
                x="480"
                y="103"
                textAnchor="middle"
                className={`text-[8.5px] font-mono ${ufwPortOpen ? 'fill-emerald-300' : 'fill-rose-300'}`}
              >
                UFW:{serverPort} {ufwPortOpen ? 'OK' : 'FERMÉ'}
              </text>
              <text
                x="480"
                y="119"
                textAnchor="middle"
                className={`text-[8.5px] font-mono ${ipForwardEnabled ? 'fill-emerald-300' : 'fill-amber-300'}`}
              >
                FWD:{ipForwardEnabled ? '1' : '0'} · NAT:{natMasqueradeEnabled ? 'ON' : 'OFF'}
              </text>

              {/* Node 3: LAN Interne */}
              <rect
                x="574"
                y="46"
                width="94"
                height="82"
                rx="10"
                fill="#0F172A"
                stroke={internalPingPassed ? '#34D399' : '#6366F1'}
                strokeWidth="1.6"
              />
              <text x="621" y="75" textAnchor="middle" className="fill-white text-[10.5px] font-bold">
                LAN INTERNE
              </text>
              <text x="621" y="93" textAnchor="middle" className="fill-indigo-300 text-[9px] font-mono">
                192.168.10.50
              </text>
              <text x="621" y="110" textAnchor="middle" className="fill-slate-400 text-[8.5px] font-mono">
                Intranet / ERP
              </text>
            </svg>
          </div>

          {/* Right 4 cols: Live Public Wi-Fi Sniffer View */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-[#091020] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-white">
                <Eye className="w-4 h-4 text-amber-400" />
                Vue Sniffer Wi-Fi Public
              </span>
              <Wifi className="w-4 h-4 text-slate-500" />
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#050A14] p-3 font-mono text-[11px] space-y-1.5">
              {!isConnectedLive ? (
                <>
                  <div className="text-rose-400 font-bold">
                    [EXPOSÉ] Trafic lisible en clair sur le Wi-Fi :
                  </div>
                  <div className="text-slate-300">DNS Query: intranet.corp → 8.8.8.8</div>
                  <div className="text-slate-300">GET /admin/login HTTP/1.1</div>
                  <div className="text-rose-300">Cookie: session_id=9fa2c81...</div>
                </>
              ) : (
                <>
                  <div className="text-emerald-400 font-bold">
                    [CHIFFRÉ] Seuls des paquets UDP/{serverPort} visibles :
                  </div>
                  <div className="text-cyan-300 break-all">
                    WG-DATA len=1420 aead=9c4f7a1b08e3d2...
                  </div>
                  <div className="text-slate-400">
                    Contenu interne : illisible (ChaCha20-Poly1305)
                  </div>
                  {hasDnsLeak ? (
                    <div className="text-amber-300 pt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Fuite DNS détectée vers 8.8.8.8 !
                    </div>
                  ) : (
                    <div className="text-emerald-300 pt-1">
                      DNS interne {tunnelSubnet}.1 protégé · 0 fuite
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Split Workbench: Left = Real-Time Controls | Right = Live Config Files & Diagnostic Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 cols: Creation & Configuration Controls */}
        <div className="lg:col-span-6 space-y-5">
          {/* Step 1: Key Generation */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-700 dark:text-cyan-400" />
                1. Création des clés cryptographiques (Curve25519)
              </h3>
              <span
                className={`text-xs font-mono font-bold ${
                  keysReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}
              >
                {keysReady ? 'Prêtes ✓' : 'À générer'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              WireGuard n’utilise ni mot de passe ni certificats complexes : chaque extrémité possède
              une clé privée (secrète) et échange sa clé publique + une clé pré-partagée (PSK).
            </p>

            <button
              type="button"
              onClick={handleGenerateKeys}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-bold transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {keysReady ? 'Régénérer les paires de clés + PSK' : 'Générer clés Serveur, Client + PSK'}
            </button>

            {keysReady && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 truncate">
                  <span className="text-slate-400 block">Clé Publique Serveur</span>
                  <span className="text-sky-700 dark:text-cyan-300">{serverPubKey}</span>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 truncate">
                  <span className="text-slate-400 block">Clé Publique Client</span>
                  <span className="text-emerald-700 dark:text-emerald-300">{clientPubKey}</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Server Configuration */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-sky-700 dark:text-cyan-400" />
              2. Configuration du Serveur VPN (/etc/wireguard/wg0.conf)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Sous-réseau du tunnel
                </span>
                <select
                  value={tunnelSubnet}
                  onChange={(e) => {
                    playClick();
                    setTunnelSubnet(e.target.value as '10.10.0' | '10.8.0');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                >
                  <option value="10.10.0">10.10.0.0/24 (Passerelle .1)</option>
                  <option value="10.8.0">10.8.0.0/24 (Passerelle .1)</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  ListenPort Serveur (UDP)
                </span>
                <select
                  value={serverPort}
                  onChange={(e) => {
                    playClick();
                    setServerPort(Number(e.target.value));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                >
                  <option value={51820}>51820 (Port standard WireGuard)</option>
                  <option value={443}>443 (Port alternatif UDP)</option>
                  <option value={51821}>51821 (Port personnalisé)</option>
                </select>
              </label>
            </div>

            <div className="space-y-2 text-xs">
              {[
                {
                  checked: ipForwardEnabled,
                  onChange: () => {
                    playClick();
                    setIpForwardEnabled((v) => !v);
                  },
                  label: 'Activer le routage IP noyau (sysctl -w net.ipv4.ip_forward=1)',
                  hint: 'Indispensable pour transmettre les paquets vers le LAN interne 192.168.10.0/24.',
                },
                {
                  checked: natMasqueradeEnabled,
                  onChange: () => {
                    playClick();
                    setNatMasqueradeEnabled((v) => !v);
                  },
                  label: 'Ajouter PostUp NAT MASQUERADE (iptables -t nat -A POSTROUTING)',
                  hint: 'Permet au client Full-Tunnel de sortir sur Internet avec l’IP publique du serveur.',
                },
                {
                  checked: ufwPortOpen,
                  onChange: () => {
                    playClick();
                    setUfwPortOpen((v) => !v);
                  },
                  label: `Ouvrir le pare-feu UFW sur le port UDP/${serverPort} (ufw allow ${serverPort}/udp)`,
                  hint: 'Sans cette règle, la passerelle rejette silencieusement le Handshake WireGuard.',
                },
                {
                  checked: peerRegistered,
                  onChange: () => {
                    playClick();
                    setPeerRegistered((v) => !v);
                  },
                  label: `Autoriser le [Peer] client (PublicKey + AllowedIPs = ${tunnelSubnet}.2/32)`,
                  hint: 'Déclare le poste nomade dans la liste blanche cryptographique du serveur.',
                },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 cursor-pointer hover:border-sky-400/70 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={item.onChange}
                    className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.hint}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Step 3: Client Configuration */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-700 dark:text-cyan-400" />
              3. Configuration du Client Nomade (client-nomade.conf)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Port Endpoint cible
                </span>
                <select
                  value={endpointPort}
                  onChange={(e) => {
                    playClick();
                    setEndpointPort(Number(e.target.value));
                  }}
                  className={`w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-white ${
                    portMatches
                      ? 'border-slate-300 dark:border-slate-700'
                      : 'border-rose-500 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <option value={51820}>203.0.113.45:51820</option>
                  <option value={443}>203.0.113.45:443</option>
                  <option value={51821}>203.0.113.45:51821</option>
                </select>
                {!portMatches && (
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 block">
                    Désaccord : le serveur écoute sur {serverPort}.
                  </span>
                )}
              </label>

              <label className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  PersistentKeepalive (NAT)
                </span>
                <select
                  value={keepaliveSec}
                  onChange={(e) => {
                    playClick();
                    setKeepaliveSec(Number(e.target.value));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                >
                  <option value={25}>25 secondes (Recommandé derrière NAT)</option>
                  <option value={0}>Désactivé (0 s)</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Politique AllowedIPs
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setTunnelMode('full');
                    }}
                    className={`px-2.5 py-2 rounded-lg border font-semibold transition-colors ${
                      tunnelMode === 'full'
                        ? 'bg-sky-50 dark:bg-cyan-950/60 border-sky-600 dark:border-cyan-400 text-sky-900 dark:text-cyan-200'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Full-Tunnel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setTunnelMode('split');
                    }}
                    className={`px-2.5 py-2 rounded-lg border font-semibold transition-colors ${
                      tunnelMode === 'split'
                        ? 'bg-sky-50 dark:bg-cyan-950/60 border-sky-600 dark:border-cyan-400 text-sky-900 dark:text-cyan-200'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Split-Tunnel
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Résolveur DNS du client
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setDnsMode('vpn');
                    }}
                    className={`px-2.5 py-2 rounded-lg border font-semibold transition-colors ${
                      dnsMode === 'vpn'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 text-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Interne ({tunnelSubnet}.1)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setDnsMode('isp');
                    }}
                    className={`px-2.5 py-2 rounded-lg border font-semibold transition-colors ${
                      dnsMode === 'isp'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Public (Fuite)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 cols: Real-Time Generated .conf Files + Live Diagnostic Console */}
        <div className="lg:col-span-6 space-y-5">
          {/* Generated Configuration Files */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950/60">
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/80 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setActiveConfigTab('server');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-colors ${
                    activeConfigTab === 'server'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-cyan-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  wg0.conf (Serveur)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setActiveConfigTab('client');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-colors ${
                    activeConfigTab === 'client'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-cyan-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  client-nomade.conf
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleCopyConfig(activeConfigTab)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {copiedTab === activeConfigTab ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedTab === activeConfigTab ? 'Copié' : 'Copier'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadConfig(activeConfigTab)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  .conf
                </button>
              </div>
            </div>

            <pre className="p-4 bg-[#070E1D] text-cyan-100 font-mono text-[11px] sm:text-xs leading-relaxed overflow-x-auto">
              {activeConfigTab === 'server' ? serverConfigText : clientConfigText}
            </pre>
          </div>

          {/* Live Diagnostic Commands & Console */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950/60">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Terminal className="w-4 h-4 text-sky-700 dark:text-cyan-400" />
                Console de Test &amp; Diagnostic Temps Réel
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                Live
              </span>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleToggleTunnel}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold transition-colors"
                >
                  {isConnectedLive ? 'wg-quick down wg0' : 'wg-quick up wg0'}
                </button>
                <button
                  type="button"
                  onClick={handleRunWgShow}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-semibold transition-colors"
                >
                  wg show
                </button>
                <button
                  type="button"
                  onClick={handleRunInternalPing}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-semibold transition-colors"
                >
                  ping 192.168.10.50
                </button>
                <button
                  type="button"
                  onClick={handleRunPublicIpCheck}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-semibold transition-colors"
                >
                  curl ifconfig.me
                </button>
                <button
                  type="button"
                  onClick={handleRunDnsLeakTest}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-semibold transition-colors"
                >
                  dig intranet.corp (Test DNS)
                </button>
              </div>

              <div className="rounded-xl bg-[#050A14] border border-slate-800 p-3.5 font-mono text-[11px] space-y-1.5 max-h-[240px] overflow-y-auto">
                {logs.map((entry) => (
                  <div key={entry.id} className="leading-relaxed">
                    <span className="text-slate-500 mr-2">[{entry.time}]</span>
                    <span
                      className={
                        entry.level === 'ok'
                          ? 'text-emerald-400'
                          : entry.level === 'err'
                            ? 'text-rose-400'
                            : entry.level === 'warn'
                              ? 'text-amber-300'
                              : 'text-slate-200'
                      }
                    >
                      {entry.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
