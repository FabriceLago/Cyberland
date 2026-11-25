import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Database,
  Download,
  Flame,
  Globe,
  KeyRound,
  Lock,
  Play,
  Power,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  UserCheck,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface ServerConfigLiveLabProps {
  onCompleteLab?: () => void;
}

interface ConsoleEntry {
  id: number;
  time: string;
  level: 'info' | 'ok' | 'warn' | 'err';
  text: string;
}

type OsDistro = 'ubuntu-24.04' | 'debian-12';
type ServerTier = 'starter' | 'prod';
type ConfigFileTab = 'sshd' | 'nginx' | 'systemd';

function nowTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function generateEd25519PubKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let body = '';
  let h = Date.now() ^ Math.floor(Math.random() * 1e9);
  for (let i = 0; i < 42; i++) {
    h = Math.imul(h ^ (i * 2246822519), 3266489917);
    body += chars[Math.abs(h) % chars.length];
  }
  return `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI${body} admin@poste-cyberland`;
}

export const ServerConfigLiveLab: React.FC<ServerConfigLiveLabProps> = ({ onCompleteLab }) => {
  // Step 1: Provisioning
  const [osDistro, setOsDistro] = useState<OsDistro>('ubuntu-24.04');
  const [serverTier, setServerTier] = useState<ServerTier>('prod');
  const [hostname, setHostname] = useState('srv-web-prod-01');
  const [domainName, setDomainName] = useState('app.cyberland.fr');
  const [serverCreated, setServerCreated] = useState(false);
  const [packagesUpdated, setPackagesUpdated] = useState(false);

  // Step 2: SSH & Admin Hardening
  const [sudoUserCreated, setSudoUserCreated] = useState(false);
  const [sshPubKey, setSshPubKey] = useState('');
  const [disableRootLogin, setDisableRootLogin] = useState(false);
  const [disablePasswordAuth, setDisablePasswordAuth] = useState(false);
  const [fail2banEnabled, setFail2banEnabled] = useState(false);

  // Step 3: App (systemd), Nginx & TLS
  const [appBindLocalOnly, setAppBindLocalOnly] = useState(true);
  const [appRunning, setAppRunning] = useState(false);
  const [nginxConfigured, setNginxConfigured] = useState(false);
  const [tlsEnabled, setTlsEnabled] = useState(false);

  // Step 4: Firewall UFW & DB Isolation
  const [ufwDefaultDeny, setUfwDefaultDeny] = useState(false);
  const [ufwAllowSsh, setUfwAllowSsh] = useState(false);
  const [ufwAllowHttp, setUfwAllowHttp] = useState(false);
  const [ufwAllowHttps, setUfwAllowHttps] = useState(false);
  const [ufwExposeDb, setUfwExposeDb] = useState(true);
  const [ufwEnabled, setUfwEnabled] = useState(false);

  // Live Runtime & Diagnostics
  const [uptimeSec, setUptimeSec] = useState(0);
  const [requestsServed, setRequestsServed] = useState(0);
  const [blockedProbes, setBlockedProbes] = useState(0);
  const [activeFileTab, setActiveFileTab] = useState<ConfigFileTab>('sshd');
  const [copiedTab, setCopiedTab] = useState<ConfigFileTab | null>(null);
  const [curlVerified, setCurlVerified] = useState(false);
  const [nmapCleanVerified, setNmapCleanVerified] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  const [logs, setLogs] = useState<ConsoleEntry[]>([
    {
      id: 1,
      time: nowTimeStr(),
      level: 'info',
      text: 'Console prête. Commencez par provisionner votre instance Linux LTS puis appliquez chaque couche de configuration.',
    },
  ]);

  const appendLog = (level: ConsoleEntry['level'], text: string) => {
    setLogs((prev) => [
      ...prev.slice(-15),
      { id: Date.now() + Math.random(), time: nowTimeStr(), level, text },
    ]);
  };

  // Derived security & service state
  const sshHardened =
    serverCreated &&
    sudoUserCreated &&
    Boolean(sshPubKey) &&
    disableRootLogin &&
    disablePasswordAuth;

  const httpsReady =
    serverCreated && appRunning && appBindLocalOnly && nginxConfigured && tlsEnabled;

  const firewallHardened =
    serverCreated &&
    ufwEnabled &&
    ufwDefaultDeny &&
    ufwAllowSsh &&
    ufwAllowHttps &&
    !ufwExposeDb;

  const publicIp = '203.0.113.42';
  const dbPrivateIp = '10.20.0.15';

  // Live uptime & traffic telemetry when server is provisioned
  useEffect(() => {
    if (!serverCreated) {
      setUptimeSec(0);
      return;
    }
    const timer = window.setInterval(() => {
      setUptimeSec((prev) => prev + 1);
      if (appRunning && nginxConfigured && ufwAllowHttps) {
        setRequestsServed((prev) => prev + Math.floor(2 + Math.random() * 6));
      }
      if (ufwEnabled && ufwDefaultDeny) {
        setBlockedProbes((prev) => prev + (Math.random() > 0.35 ? 1 : 0));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [serverCreated, appRunning, nginxConfigured, ufwAllowHttps, ufwEnabled, ufwDefaultDeny]);

  // 5 Auto-Validated Production Readiness Objectives
  const objectives = useMemo(
    () => [
      {
        id: 'provision',
        label: '1. Créer le serveur Linux LTS et patcher le système (apt upgrade)',
        done: serverCreated && packagesUpdated,
      },
      {
        id: 'ssh',
        label: '2. Durcir SSH : utilisateur sudo, clé Ed25519, sans root ni mot de passe',
        done: sshHardened,
      },
      {
        id: 'web',
        label: '3. Service systemd sur 127.0.0.1:3000 + Reverse Proxy Nginx HTTPS (TLS 1.3)',
        done: httpsReady,
      },
      {
        id: 'ufw',
        label: '4. Pare-feu UFW actif (deny incoming, 22/443 ouverts, port DB 5432 isolé)',
        done: firewallHardened,
      },
      {
        id: 'audit',
        label: '5. Valider en direct avec curl -I https://... et un scan nmap propre',
        done: curlVerified && nmapCleanVerified,
      },
    ],
    [serverCreated, packagesUpdated, sshHardened, httpsReady, firewallHardened, curlVerified, nmapCleanVerified]
  );

  const completedCount = objectives.filter((o) => o.done).length;
  const allComplete = completedCount === objectives.length;

  useEffect(() => {
    if (allComplete && !xpAwarded) {
      setXpAwarded(true);
      playVictory();
      onCompleteLab?.();
      appendLog(
        'ok',
        'Serveur de production validé à 100 % : SSH durci, Nginx HTTPS actif, UFW verrouillé et base isolée (+100 XP).'
      );
    }
  }, [allComplete, xpAwarded, onCompleteLab]);

  // Generated live configuration files
  const sshdConfigText = useMemo(() => {
    return [
      `# /etc/ssh/sshd_config.d/99-hardening.conf (${hostname})`,
      'Port 22',
      'Protocol 2',
      `PermitRootLogin ${disableRootLogin ? 'no' : 'yes  # RISQUE CRITIQUE'}`,
      `PasswordAuthentication ${disablePasswordAuth ? 'no' : 'yes  # VULNÉRABLE FORCE BRUTE'}`,
      'PubkeyAuthentication yes',
      'KbdInteractiveAuthentication no',
      'MaxAuthTries 3',
      'X11Forwarding no',
      sudoUserCreated ? 'AllowUsers deploy' : '# AllowUsers deploy (non créé)',
      fail2banEnabled
        ? '# Fail2ban jail [sshd] : ban 1h après 3 échecs'
        : '# Fail2ban : inactif',
    ].join('\n');
  }, [hostname, disableRootLogin, disablePasswordAuth, sudoUserCreated, fail2banEnabled]);

  const nginxConfigText = useMemo(() => {
    const cleanDomain = domainName.trim() || 'app.cyberland.fr';
    if (!nginxConfigured) {
      return `# /etc/nginx/sites-available/${cleanDomain}\n# Reverse Proxy non encore configuré.\n# Activez « Configurer le vhost Nginx » pour générer le fichier.`;
    }
    if (!tlsEnabled) {
      return [
        `# /etc/nginx/sites-available/${cleanDomain} (HTTP non chiffré)`,
        'server {',
        '    listen 80;',
        `    server_name ${cleanDomain};`,
        '',
        '    location / {',
        '        proxy_pass http://127.0.0.1:3000;',
        '        proxy_set_header Host $host;',
        '        proxy_set_header X-Real-IP $remote_addr;',
        '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
        '    }',
        '}',
        '# Attention : activez TLS (Certbot) pour chiffrer en HTTPS :443 !',
      ].join('\n');
    }
    return [
      `# /etc/nginx/sites-available/${cleanDomain} (Production HTTPS TLS 1.3)`,
      'server {',
      '    listen 80;',
      `    server_name ${cleanDomain};`,
      '    return 301 https://$host$request_uri;',
      '}',
      '',
      'server {',
      '    listen 443 ssl http2;',
      `    server_name ${cleanDomain};`,
      '',
      `    ssl_certificate     /etc/letsencrypt/live/${cleanDomain}/fullchain.pem;`,
      `    ssl_certificate_key /etc/letsencrypt/live/${cleanDomain}/privkey.pem;`,
      '    ssl_protocols       TLSv1.2 TLSv1.3;',
      '',
      '    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
      '    add_header X-Content-Type-Options "nosniff" always;',
      '    add_header X-Frame-Options "DENY" always;',
      '',
      '    location / {',
      '        proxy_pass http://127.0.0.1:3000;',
      '        proxy_http_version 1.1;',
      '        proxy_set_header Host $host;',
      '        proxy_set_header X-Real-IP $remote_addr;',
      '        proxy_set_header X-Forwarded-Proto https;',
      '    }',
      '}',
    ].join('\n');
  }, [domainName, nginxConfigured, tlsEnabled]);

  const systemdAndUfwText = useMemo(() => {
    const bindHost = appBindLocalOnly ? '127.0.0.1' : '0.0.0.0  # EXPOSE LE PORT 3000 !';
    return [
      '# /etc/systemd/system/cyberapp.service',
      '[Unit]',
      'Description=Cyberland Web API (Node.js)',
      'After=network.target',
      '',
      '[Service]',
      `User=${sudoUserCreated ? 'deploy' : 'root  # ÉVITER ROOT'}`,
      'WorkingDirectory=/srv/cyberapp',
      `Environment=HOST=${bindHost}`,
      'Environment=PORT=3000',
      `Environment=DATABASE_URL=postgres://app@${dbPrivateIp}:5432/cyberdb`,
      'ExecStart=/usr/bin/node /srv/cyberapp/server.js',
      'Restart=always',
      'NoNewPrivileges=true',
      '',
      '[Install]',
      'WantedBy=multi-user.target',
      '',
      '# --- Règles Pare-feu UFW générées ---',
      ufwDefaultDeny ? 'ufw default deny incoming' : '# ufw default deny incoming (NON CONFIGURÉ)',
      'ufw default allow outgoing',
      ufwAllowSsh ? 'ufw allow from 198.51.100.10 to any port 22 proto tcp' : '# Port 22 SSH fermé',
      ufwAllowHttp ? 'ufw allow 80/tcp' : '# Port 80 HTTP fermé',
      ufwAllowHttps ? 'ufw allow 443/tcp' : '# Port 443 HTTPS fermé',
      ufwExposeDb
        ? 'ufw allow 5432/tcp  # DANGER : PostgreSQL exposé sur Internet !'
        : '# Port 5432 PostgreSQL bloqué côté WAN (isolé sur LAN privé 10.20.0.15)',
      ufwEnabled ? 'ufw --force enable' : '# ufw non activé',
    ].join('\n');
  }, [
    appBindLocalOnly,
    sudoUserCreated,
    ufwDefaultDeny,
    ufwAllowSsh,
    ufwAllowHttp,
    ufwAllowHttps,
    ufwExposeDb,
    ufwEnabled,
  ]);

  const activeFileContent =
    activeFileTab === 'sshd'
      ? sshdConfigText
      : activeFileTab === 'nginx'
        ? nginxConfigText
        : systemdAndUfwText;

  const activeFileName =
    activeFileTab === 'sshd'
      ? '99-hardening.conf'
      : activeFileTab === 'nginx'
        ? `${domainName.trim() || 'app.cyberland.fr'}.nginx.conf`
        : 'cyberapp.service.txt';

  // Handlers
  const handleProvisionServer = () => {
    playSuccess();
    setServerCreated(true);
    setUptimeSec(1);
    const osLabel = osDistro === 'ubuntu-24.04' ? 'Ubuntu 24.04 LTS' : 'Debian 12 Bookworm';
    const specs = serverTier === 'prod' ? '4 vCPU · 8 Go RAM · 80 Go NVMe' : '2 vCPU · 4 Go RAM · 40 Go SSD';
    appendLog(
      'ok',
      `Instance ${hostname} (${osLabel}, ${specs}) provisionnée sur ${publicIp} (LAN DB ${dbPrivateIp}).`
    );
  };

  const handleUpdatePackages = () => {
    if (!serverCreated) {
      playError();
      appendLog('err', 'Créez d’abord l’instance serveur avant de lancer apt update && apt upgrade.');
      return;
    }
    playSuccess();
    setPackagesUpdated(true);
    appendLog(
      'ok',
      '$ sudo apt update && sudo apt upgrade -y → 24 paquets sécurité mis à jour (openssl, openssh-server, linux-image).'
    );
  };

  const handleCreateSudoUser = () => {
    if (!serverCreated) {
      playError();
      appendLog('err', 'Déployez le serveur avant de créer un compte administrateur.');
      return;
    }
    playSuccess();
    setSudoUserCreated(true);
    appendLog('ok', '$ sudo adduser deploy && sudo usermod -aG sudo deploy → Compte admin non-root prêt.');
  };

  const handleGenerateSshKey = () => {
    if (!serverCreated) {
      playError();
      appendLog('err', 'Provisionnez le serveur avant de déployer la clé SSH Ed25519.');
      return;
    }
    playSuccess();
    const key = generateEd25519PubKey();
    setSshPubKey(key);
    appendLog(
      'ok',
      '$ ssh-keygen -t ed25519 && ssh-copy-id deploy@203.0.113.42 → Clé Ed25519 installée dans ~/.ssh/authorized_keys (chmod 600).'
    );
  };

  const handleToggleDisablePassword = () => {
    if (!disablePasswordAuth && (!sudoUserCreated || !sshPubKey)) {
      playError();
      appendLog(
        'warn',
        'Sécurité anti-lockout : créez d’abord le compte deploy et installez sa clé Ed25519 avant de désactiver les mots de passe SSH !'
      );
      return;
    }
    playClick();
    const next = !disablePasswordAuth;
    setDisablePasswordAuth(next);
    appendLog(
      next ? 'ok' : 'warn',
      next
        ? '$ sudo sshd -t && sudo systemctl reload ssh → PasswordAuthentication no appliqué.'
        : 'PasswordAuthentication remis sur yes (risque force brute).'
    );
  };

  const handleToggleUfwEnable = () => {
    if (!serverCreated) {
      playError();
      appendLog('err', 'Déployez le serveur avant d’activer le pare-feu UFW.');
      return;
    }
    if (!ufwEnabled && ufwDefaultDeny && !ufwAllowSsh) {
      playError();
      appendLog(
        'err',
        'LOCKOUT ÉVITÉ ! Autorisez le port SSH (22/tcp) avant d’activer UFW en deny incoming, sinon vous perdez la main sur votre serveur.'
      );
      return;
    }
    playClick();
    const next = !ufwEnabled;
    setUfwEnabled(next);
    appendLog(
      next ? 'ok' : 'warn',
      next
        ? '$ sudo ufw enable → Pare-feu actif au démarrage du système.'
        : '$ sudo ufw disable → Pare-feu désactivé ! Tous les services en écoute sont exposés.'
    );
  };

  const handleRunDiagnostic = (cmd: 'systemctl' | 'ss' | 'ufw' | 'curl' | 'nmap' | 'ssh-root') => {
    if (!serverCreated) {
      playError();
      appendLog('err', `Impossible d'exécuter la commande : aucune instance serveur n'est provisionnée.`);
      return;
    }
    playClick();
    const cleanDomain = domainName.trim() || 'app.cyberland.fr';

    if (cmd === 'systemctl') {
      appendLog(
        appRunning && nginxConfigured ? 'ok' : 'warn',
        `$ systemctl status nginx cyberapp → nginx: ${nginxConfigured ? 'active (running)' : 'inactive (dead)'} | cyberapp.service: ${appRunning ? 'active (running)' : 'inactive (dead)'} | fail2ban: ${fail2banEnabled ? 'active' : 'inactive'}.`
      );
      return;
    }

    if (cmd === 'ss') {
      const listeners = ['0.0.0.0:22 (sshd)'];
      if (nginxConfigured) {
        listeners.push('0.0.0.0:80 (nginx)');
        if (tlsEnabled) listeners.push('0.0.0.0:443 (nginx)');
      }
      if (appRunning) {
        listeners.push(appBindLocalOnly ? '127.0.0.1:3000 (node)' : '0.0.0.0:3000 (node - EXPOSÉ)');
      }
      listeners.push(
        ufwExposeDb ? '0.0.0.0:5432 (postgres - DANGER)' : `${dbPrivateIp}:5432 (postgres - LAN privé)`
      );
      appendLog(
        appBindLocalOnly && !ufwExposeDb ? 'ok' : 'warn',
        `$ ss -tulpn → Sockets en écoute : ${listeners.join(' · ')}`
      );
      return;
    }

    if (cmd === 'ufw') {
      if (!ufwEnabled) {
        appendLog('warn', '$ sudo ufw status verbose → Status: inactive (aucun filtrage actif).');
        return;
      }
      const rules = [
        ufwAllowSsh ? '22/tcp ALLOW (IP admin)' : null,
        ufwAllowHttp ? '80/tcp ALLOW' : null,
        ufwAllowHttps ? '443/tcp ALLOW' : null,
        ufwExposeDb ? '5432/tcp ALLOW (DANGER WAN)' : null,
      ].filter(Boolean);
      appendLog(
        firewallHardened ? 'ok' : 'warn',
        `$ sudo ufw status verbose → Status: active | Default: ${ufwDefaultDeny ? 'deny' : 'allow'} (incoming) | Règles : ${rules.length ? rules.join(', ') : 'aucune'}.`
      );
      return;
    }

    if (cmd === 'curl') {
      if (!nginxConfigured) {
        playError();
        appendLog('err', `$ curl -I https://${cleanDomain} → Connection refused (Nginx non configuré).`);
        return;
      }
      if (!tlsEnabled) {
        playError();
        appendLog(
          'warn',
          `$ curl -I https://${cleanDomain} → SSL_ERROR_RX_RECORD_TOO_LONG : certificat TLS manquant (lancez Certbot).`
        );
        return;
      }
      if (ufwEnabled && ufwDefaultDeny && !ufwAllowHttps) {
        playError();
        appendLog(
          'err',
          `$ curl -I https://${cleanDomain} → Timeout : le pare-feu UFW bloque le port 443/tcp !`
        );
        return;
      }
      if (!appRunning) {
        playError();
        appendLog(
          'warn',
          `$ curl -I https://${cleanDomain} → HTTP/2 502 Bad Gateway (Nginx répond mais cyberapp.service est arrêté).`
        );
        return;
      }
      playSuccess();
      setCurlVerified(true);
      appendLog(
        'ok',
        `$ curl -I https://${cleanDomain} → HTTP/2 200 OK · TLSv1.3 · Strict-Transport-Security: max-age=31536000 · Backend 127.0.0.1:3000 sain.`
      );
      return;
    }

    if (cmd === 'nmap') {
      const exposed: string[] = [];
      const warnings: string[] = [];

      const checkPortVisible = (portAllowed: boolean) => !ufwEnabled || !ufwDefaultDeny || portAllowed;

      if (checkPortVisible(ufwAllowSsh)) exposed.push('22/tcp (ssh)');
      if (nginxConfigured && checkPortVisible(ufwAllowHttp)) exposed.push('80/tcp (http)');
      if (nginxConfigured && tlsEnabled && checkPortVisible(ufwAllowHttps)) exposed.push('443/tcp (https)');
      if (appRunning && !appBindLocalOnly && checkPortVisible(false)) {
        exposed.push('3000/tcp (node-dev)');
        warnings.push('port applicatif 3000 exposé directement');
      }
      if (checkPortVisible(ufwExposeDb)) {
        exposed.push('5432/tcp (postgresql)');
        warnings.push('base PostgreSQL 5432 exposée sur Internet');
      }

      if (!ufwEnabled || !ufwDefaultDeny || warnings.length > 0) {
        playError();
        appendLog(
          'err',
          `$ nmap -Pn ${publicIp} → Ports ouverts : ${exposed.join(', ') || 'aucun'}. ALERTE : ${warnings.join(' ; ') || 'UFW inactif ou permissif'} !`
        );
      } else {
        playSuccess();
        setNmapCleanVerified(true);
        appendLog(
          'ok',
          `$ nmap -Pn ${publicIp} → Audit propre ! Seuls ${exposed.join(', ')} sont visibles (997+ ports filtrés par UFW).`
        );
      }
      return;
    }

    if (cmd === 'ssh-root') {
      if (disableRootLogin && disablePasswordAuth) {
        playSuccess();
        appendLog(
          'ok',
          `$ ssh root@${publicIp} → Permission denied (publickey). L’accès root direct est correctement bloqué !`
        );
      } else {
        playError();
        appendLog(
          'err',
          `$ ssh root@${publicIp} → ALERTE : le serveur accepte encore root ou les mots de passe ! Durcissez /etc/ssh/sshd_config.`
        );
      }
    }
  };

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(activeFileContent);
      playClick();
      setCopiedTab(activeFileTab);
      window.setTimeout(() => setCopiedTab(null), 1800);
    } catch {
      // Clipboard blocked in sandbox
    }
  };

  const handleDownloadConfig = () => {
    playClick();
    const blob = new Blob([activeFileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetLab = () => {
    playClick();
    setServerCreated(false);
    setPackagesUpdated(false);
    setSudoUserCreated(false);
    setSshPubKey('');
    setDisableRootLogin(false);
    setDisablePasswordAuth(false);
    setFail2banEnabled(false);
    setAppBindLocalOnly(true);
    setAppRunning(false);
    setNginxConfigured(false);
    setTlsEnabled(false);
    setUfwDefaultDeny(false);
    setUfwAllowSsh(false);
    setUfwAllowHttp(false);
    setUfwAllowHttps(false);
    setUfwExposeDb(true);
    setUfwEnabled(false);
    setUptimeSec(0);
    setRequestsServed(0);
    setBlockedProbes(0);
    setCurlVerified(false);
    setNmapCleanVerified(false);
    setLogs([
      {
        id: Date.now(),
        time: nowTimeStr(),
        level: 'info',
        text: 'Lab serveur réinitialisé. Prêt pour un nouveau déploiement de A à Z.',
      },
    ]);
  };

  const formatUptime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}m ${String(rem).padStart(2, '0')}s`;
  };

  return (
    <div className="space-y-6">
      {/* Lab Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-sky-700 dark:text-cyan-400">
                Lab Temps Réel · Création &amp; Configuration Serveur Linux
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Objectifs : {completedCount}/{objectives.length}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                État :{' '}
                <strong
                  className={
                    !serverCreated
                      ? 'text-slate-500 dark:text-slate-400'
                      : allComplete
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                  }
                >
                  {!serverCreated
                    ? 'HORS LIGNE'
                    : allComplete
                      ? 'PRODUCTION SÉCURISÉE'
                      : 'EN CONFIGURATION'}
                </strong>
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Déployer, Durcir et Mettre en Production un Serveur Web Linux
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              Créez une instance Linux vierge, sécurisez SSH par clé Ed25519, déployez un service{' '}
              <code className="font-mono text-xs px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                systemd
              </code>{' '}
              derrière Nginx HTTPS, verrouillez le pare-feu UFW et vérifiez votre architecture en direct avec{' '}
              <code className="font-mono text-xs px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                curl
              </code>{' '}
              et{' '}
              <code className="font-mono text-xs px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                nmap
              </code>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!serverCreated ? (
              <button
                type="button"
                onClick={handleProvisionServer}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs sm:text-sm font-bold shadow-sm transition-colors whitespace-nowrap"
              >
                <Power className="w-4 h-4" />
                Provisionner le serveur
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetLab}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Réinitialiser l&apos;instance
              </button>
            )}
          </div>
        </div>

        {/* Live Telemetry Strip (tabular numerals) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5">
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Instance &amp; IP Publique</div>
            <div className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5 truncate">
              {serverCreated ? `${publicIp}` : 'Non provisionnée'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {serverCreated ? `${hostname} · ${osDistro === 'ubuntu-24.04' ? 'Ubuntu 24.04' : 'Debian 12'}` : 'Cliquez sur Provisionner'}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5">
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Uptime &amp; Patchs OS</div>
            <div className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
              {serverCreated ? formatUptime(uptimeSec) : '00m 00s'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {packagesUpdated ? 'Système à jour (apt)' : 'Mises à jour en attente'}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5">
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Trafic HTTPS servi</div>
            <div className="text-sm font-mono font-bold text-sky-700 dark:text-cyan-400 tabular-nums mt-0.5">
              {requestsServed.toLocaleString('fr-FR')} req
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {httpsReady ? 'TLS 1.3 · HTTP/2 actif' : 'Nginx / TLS incomplet'}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5">
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Scans bloqués (UFW)</div>
            <div className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
              {blockedProbes.toLocaleString('fr-FR')} sondes
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {firewallHardened ? 'Deny by default · DB isolée' : 'Surface encore exposée'}
            </div>
          </div>
        </div>
      </div>

      {/* Live Interactive Architecture Topology Diagram */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-5 space-y-3 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Activity className="w-4 h-4 shrink-0" />
            <span>Topologie Serveur en Temps Réel · Flux WAN → UFW → Nginx DMZ → App → Base Privée</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            {!serverCreated
              ? 'En attente de création d’instance'
              : ufwExposeDb
                ? 'ALERTE : Port 5432 (PostgreSQL) exposé sur Internet !'
                : !appBindLocalOnly
                  ? 'ALERTE : Port applicatif 3000 exposé hors 127.0.0.1 !'
                  : firewallHardened && httpsReady
                    ? 'Architecture DMZ conforme : seul HTTPS :443 (+ SSH restreint) est accessible'
                    : 'Configurez SSH, Nginx HTTPS et UFW pour sécuriser la chaîne complète'}
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 960 215"
            className="w-full min-w-[720px] h-auto"
            role="img"
            aria-label="Architecture serveur temps réel : Internet, Pare-feu UFW, Nginx HTTPS, Application systemd et PostgreSQL privé"
          >
            {/* Subtle technical grid */}
            <defs>
              <pattern id="srvGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="960" height="215" rx="12" fill="url(#srvGrid)" />

            {/* Zone Boxes */}
            <rect
              x="220"
              y="14"
              width="495"
              height="186"
              rx="14"
              fill="rgba(15,23,42,0.75)"
              stroke={serverCreated ? 'rgba(56,189,248,0.35)' : 'rgba(100,116,139,0.25)'}
              strokeDasharray="6 4"
            />
            <text x="236" y="34" fill="#7dd3fc" fontSize="11" fontFamily="monospace" fontWeight="700">
              SERVEUR LINUX ({hostname} · {publicIp})
            </text>

            <rect
              x="742"
              y="14"
              width="202"
              height="186"
              rx="14"
              fill={ufwExposeDb ? 'rgba(127,29,29,0.25)' : 'rgba(6,78,59,0.22)'}
              stroke={ufwExposeDb ? 'rgba(248,113,113,0.6)' : 'rgba(52,211,153,0.45)'}
              strokeDasharray="5 4"
            />
            <text
              x="756"
              y="34"
              fill={ufwExposeDb ? '#fca5a5' : '#6ee7b7'}
              fontSize="11"
              fontFamily="monospace"
              fontWeight="700"
            >
              {ufwExposeDb ? 'LAN DB (EXPOSÉ WAN !)' : 'LAN PRIVÉ ISOLÉ'}
            </text>

            {/* Connecting Lines */}
            {/* Internet -> UFW */}
            <line
              x1="168"
              y1="112"
              x2="244"
              y2="112"
              stroke={serverCreated ? '#38bdf8' : '#475569'}
              strokeWidth="2.5"
              strokeDasharray={serverCreated ? 'none' : '5 5'}
            />
            {/* UFW -> Nginx */}
            <line
              x1="376"
              y1="112"
              x2="424"
              y2="112"
              stroke={
                serverCreated && nginxConfigured && (!ufwEnabled || ufwAllowHttps)
                  ? tlsEnabled
                    ? '#10b981'
                    : '#f59e0b'
                  : '#475569'
              }
              strokeWidth="2.5"
            />
            {/* Nginx -> App */}
            <line
              x1="556"
              y1="112"
              x2="594"
              y2="112"
              stroke={serverCreated && nginxConfigured && appRunning ? '#38bdf8' : '#475569'}
              strokeWidth="2.5"
            />
            {/* App -> PostgreSQL */}
            <line
              x1="704"
              y1="112"
              x2="764"
              y2="112"
              stroke={serverCreated && appRunning ? (ufwExposeDb ? '#f87171' : '#10b981') : '#475569'}
              strokeWidth="2.5"
            />

            {/* Animated packet pulses when active */}
            {serverCreated && nginxConfigured && appRunning && (!ufwEnabled || ufwAllowHttps) && (
              <>
                <motion.circle
                  r="4.5"
                  cy="112"
                  fill={tlsEnabled ? '#34d399' : '#fbbf24'}
                  initial={{ cx: 172 }}
                  animate={{ cx: 760 }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
                />
                <motion.circle
                  r="3.5"
                  cy="112"
                  fill="#38bdf8"
                  initial={{ cx: 760 }}
                  animate={{ cx: 172 }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'linear', delay: 1.3 }}
                />
              </>
            )}

            {/* Node 1: Internet */}
            <g transform="translate(18, 62)">
              <rect
                width="150"
                height="100"
                rx="12"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="1.5"
              />
              <text x="14" y="26" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="700">
                WAN / INTERNET
              </text>
              <text x="14" y="48" fill="#f8fafc" fontSize="12" fontWeight="700">
                Clients &amp; Bots
              </text>
              <text x="14" y="68" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                HTTPS :443 → {domainName.slice(0, 14)}
              </text>
              <text x="14" y="84" fill="#fca5a5" fontSize="10" fontFamily="monospace">
                Scan SSH / :5432
              </text>
            </g>

            {/* Node 2: Firewall UFW */}
            <g transform="translate(244, 62)">
              <rect
                width="132"
                height="100"
                rx="12"
                fill="#0f172a"
                stroke={
                  !serverCreated
                    ? '#334155'
                    : firewallHardened
                      ? '#10b981'
                      : ufwEnabled
                        ? '#f59e0b'
                        : '#ef4444'
                }
                strokeWidth="2"
              />
              <text x="12" y="26" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="700">
                PARE-FEU UFW
              </text>
              <text x="12" y="48" fill="#f8fafc" fontSize="12" fontWeight="700">
                {ufwEnabled ? 'Actif' : 'Inactif'}
              </text>
              <text
                x="12"
                y="68"
                fill={ufwDefaultDeny ? '#34d399' : '#fca5a5'}
                fontSize="10"
                fontFamily="monospace"
              >
                {ufwDefaultDeny ? 'default: deny' : 'default: allow'}
              </text>
              <text x="12" y="84" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
                {[
                  ufwAllowSsh ? '22' : null,
                  ufwAllowHttp ? '80' : null,
                  ufwAllowHttps ? '443' : null,
                  ufwExposeDb ? '5432!' : null,
                ]
                  .filter(Boolean)
                  .join(', ') || 'Aucun port'}
              </text>
            </g>

            {/* Node 3: Nginx Reverse Proxy */}
            <g transform="translate(424, 62)">
              <rect
                width="132"
                height="100"
                rx="12"
                fill="#0f172a"
                stroke={
                  !serverCreated
                    ? '#334155'
                    : nginxConfigured && tlsEnabled
                      ? '#10b981'
                      : nginxConfigured
                        ? '#f59e0b'
                        : '#475569'
                }
                strokeWidth="2"
              />
              <text x="12" y="26" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="700">
                REVERSE PROXY
              </text>
              <text x="12" y="48" fill="#f8fafc" fontSize="12" fontWeight="700">
                Nginx {tlsEnabled ? 'HTTPS' : 'HTTP'}
              </text>
              <text
                x="12"
                y="68"
                fill={tlsEnabled ? '#34d399' : '#fbbf24'}
                fontSize="10"
                fontFamily="monospace"
              >
                {!nginxConfigured ? 'Non configuré' : tlsEnabled ? 'TLS 1.3 · :443' : 'Clair :80 seul'}
              </text>
              <text x="12" y="84" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                SSH: {sshHardened ? 'Ed25519 OK' : 'À durcir'}
              </text>
            </g>

            {/* Node 4: App systemd */}
            <g transform="translate(594, 62)">
              <rect
                width="110"
                height="100"
                rx="12"
                fill="#0f172a"
                stroke={
                  !serverCreated
                    ? '#334155'
                    : appRunning && appBindLocalOnly
                      ? '#38bdf8'
                      : appRunning
                        ? '#f59e0b'
                        : '#475569'
                }
                strokeWidth="2"
              />
              <text x="12" y="26" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="700">
                SYSTEMD
              </text>
              <text x="12" y="48" fill="#f8fafc" fontSize="12" fontWeight="700">
                App :3000
              </text>
              <text
                x="12"
                y="68"
                fill={appRunning ? '#38bdf8' : '#94a3b8'}
                fontSize="10"
                fontFamily="monospace"
              >
                {appRunning ? 'active' : 'stopped'}
              </text>
              <text
                x="12"
                y="84"
                fill={appBindLocalOnly ? '#34d399' : '#fca5a5'}
                fontSize="10"
                fontFamily="monospace"
              >
                {appBindLocalOnly ? '127.0.0.1' : '0.0.0.0 !'}
              </text>
            </g>

            {/* Node 5: Database */}
            <g transform="translate(764, 62)">
              <rect
                width="162"
                height="100"
                rx="12"
                fill="#0f172a"
                stroke={ufwExposeDb ? '#ef4444' : '#10b981'}
                strokeWidth="2"
              />
              <text x="12" y="26" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="700">
                BASE DE DONNÉES
              </text>
              <text x="12" y="48" fill="#f8fafc" fontSize="12" fontWeight="700">
                PostgreSQL :5432
              </text>
              <text x="12" y="68" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
                IP: {dbPrivateIp}
              </text>
              <text
                x="12"
                y="84"
                fill={ufwExposeDb ? '#fca5a5' : '#34d399'}
                fontSize="10"
                fontFamily="monospace"
              >
                {ufwExposeDb ? 'EXPOSÉE WAN !' : 'Isolée du WAN'}
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Main Split: 4 Configuration Decks (Left) + Live Config Files & Diagnostic Terminal (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT: Interactive Server Creation & Configuration Controls */}
        <div className="xl:col-span-7 space-y-5">
          {/* Deck 1: Provisioning */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  1. Création &amp; Provisioning du Serveur
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {serverCreated && packagesUpdated
                  ? 'Prêt & patché'
                  : serverCreated
                    ? 'À mettre à jour'
                    : 'Non créé'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Système d&apos;exploitation (LTS)
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {(
                    [
                      { id: 'ubuntu-24.04', label: 'Ubuntu 24.04' },
                      { id: 'debian-12', label: 'Debian 12' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setOsDistro(item.id);
                      }}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        osDistro === item.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-cyan-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Gabarit matériel (VPS / VM)
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {(
                    [
                      { id: 'starter', label: '2 vCPU · 4 Go' },
                      { id: 'prod', label: '4 vCPU · 8 Go' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setServerTier(item.id);
                      }}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        serverTier === item.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-cyan-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="srv-hostname"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 block"
                >
                  Nom d&apos;hôte (Hostname)
                </label>
                <input
                  id="srv-hostname"
                  type="text"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 28))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="srv-domain"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 block"
                >
                  Nom de domaine DNS (enregistrement A → {publicIp})
                </label>
                <input
                  id="srv-domain"
                  type="text"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value.replace(/[^a-zA-Z0-9.-]/g, '').slice(0, 42))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleProvisionServer}
                disabled={serverCreated}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                  serverCreated
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 cursor-default'
                    : 'bg-sky-600 hover:bg-sky-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950'
                }`}
              >
                {serverCreated ? <Check className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                {serverCreated ? 'Instance déployée' : 'Déployer l’instance Linux'}
              </button>

              <button
                type="button"
                onClick={handleUpdatePackages}
                disabled={!serverCreated || packagesUpdated}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  packagesUpdated
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                    : serverCreated
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                {packagesUpdated ? 'apt upgrade appliqué' : 'Lancer apt update && apt upgrade'}
              </button>
            </div>
          </section>

          {/* Deck 2: SSH & Admin Hardening */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  2. Accès Admin &amp; Durcissement SSH
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {sshHardened ? 'SSH durci' : 'Par défaut (root exposé)'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCreateSudoUser}
                disabled={!serverCreated || sudoUserCreated}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  sudoUserCreated
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                    : serverCreated
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                {sudoUserCreated ? 'Utilisateur deploy (sudo) créé' : 'Créer utilisateur sudo « deploy »'}
              </button>

              <button
                type="button"
                onClick={handleGenerateSshKey}
                disabled={!serverCreated}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  sshPubKey
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                    : serverCreated
                      ? 'border-sky-300 dark:border-cyan-700 bg-sky-50 dark:bg-cyan-950/40 text-sky-800 dark:text-cyan-300 hover:bg-sky-100 dark:hover:bg-cyan-950/70'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                {sshPubKey ? 'Régénérer clé Ed25519' : 'Générer & copier clé SSH Ed25519'}
              </button>
            </div>

            {sshPubKey && (
              <div className="p-2.5 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px] break-all">
                {sshPubKey}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                disabled={!serverCreated}
                onClick={() => {
                  playClick();
                  const next = !disableRootLogin;
                  setDisableRootLogin(next);
                  appendLog(
                    next ? 'ok' : 'warn',
                    next
                      ? 'sshd_config : PermitRootLogin no activé.'
                      : 'sshd_config : PermitRootLogin remis sur yes.'
                  );
                }}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  disableRootLogin
                    ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                } ${!serverCreated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                  PermitRootLogin no
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  {disableRootLogin ? 'Bloque SSH direct en root' : 'Root autorisé (risqué)'}
                </div>
              </button>

              <button
                type="button"
                disabled={!serverCreated}
                onClick={handleToggleDisablePassword}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  disablePasswordAuth
                    ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                } ${!serverCreated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                  PasswordAuth no
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  {disablePasswordAuth ? 'Clé Ed25519 obligatoire' : 'Mot de passe actif'}
                </div>
              </button>

              <button
                type="button"
                disabled={!serverCreated}
                onClick={() => {
                  playClick();
                  const next = !fail2banEnabled;
                  setFail2banEnabled(next);
                  appendLog(
                    next ? 'ok' : 'info',
                    next
                      ? '$ sudo systemctl enable --now fail2ban → Bannissement auto anti-brute-force actif.'
                      : 'Fail2ban arrêté.'
                  );
                }}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  fail2banEnabled
                    ? 'border-sky-400 dark:border-cyan-700 bg-sky-50/70 dark:bg-cyan-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                } ${!serverCreated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                  Fail2ban (SSH)
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  {fail2banEnabled ? 'Jail sshd active' : 'Bonus recommandé'}
                </div>
              </button>
            </div>
          </section>

          {/* Deck 3: App systemd & Nginx HTTPS */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  3. Service Applicatif (systemd) &amp; Reverse Proxy Nginx HTTPS
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {httpsReady ? 'HTTPS TLS 1.3 opérationnel' : 'En attente'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!serverCreated}
                onClick={() => {
                  playClick();
                  const next = !appRunning;
                  setAppRunning(next);
                  appendLog(
                    next ? 'ok' : 'warn',
                    next
                      ? `$ sudo systemctl enable --now cyberapp → Écoute sur ${appBindLocalOnly ? '127.0.0.1:3000' : '0.0.0.0:3000'}.`
                      : '$ sudo systemctl stop cyberapp → Application arrêtée.'
                  );
                }}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  appRunning
                    ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                } ${!serverCreated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {appRunning ? 'Service cyberapp.service actif' : 'Démarrer cyberapp.service (systemd)'}
                </div>
                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-0.5">
                  Backend Node.js sur port 3000
                </div>
              </button>

              <button
                type="button"
                disabled={!serverCreated}
                onClick={() => {
                  playClick();
                  const next = !appBindLocalOnly;
                  setAppBindLocalOnly(next);
                  appendLog(
                    next ? 'ok' : 'warn',
                    next
                      ? 'Bind applicatif restreint à 127.0.0.1:3000 (accessible uniquement via Nginx).'
                      : 'ATTENTION : Bind sur 0.0.0.0:3000 (contourne Nginx si le pare-feu est permissif) !'
                  );
                }}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  appBindLocalOnly
                    ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/30'
                    : 'border-rose-400 dark:border-rose-700 bg-rose-50/70 dark:bg-rose-950/30'
                } ${!serverCreated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Bind local : {appBindLocalOnly ? '127.0.0.1:3000' : '0.0.0.0:3000 (Risqué)'}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  {appBindLocalOnly ? 'Invisible depuis Internet' : 'Cliquez pour isoler en local'}
                </div>
              </button>

              <button
                type="button"
                disabled={!serverCreated}
                onClick={() => {
                  playClick();
                  const next = !nginxConfigured;
                  setNginxConfigured(next);
                  if (!next) setTlsEnabled(false);
                  appendLog(
                    next ? 'ok' : 'warn',
                    next
                      ? `$ sudo nginx -t && sudo systemctl reload nginx → Reverse Proxy vers 127.0.0.1:3000 actif pour ${domainName}.`
                      : 'Configuration vhost Nginx désactivée.'
                  );
                }}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  nginxConfigured
                    ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                } ${!serverCreated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {nginxConfigured ? 'Reverse Proxy Nginx configuré' : 'Configurer le vhost Nginx'}
                </div>
                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-0.5">
                  proxy_pass http://127.0.0.1:3000
                </div>
              </button>

              <button
                type="button"
                disabled={!serverCreated || !nginxConfigured}
                onClick={() => {
                  playSuccess();
                  const next = !tlsEnabled;
                  setTlsEnabled(next);
                  appendLog(
                    next ? 'ok' : 'warn',
                    next
                      ? `$ sudo certbot --nginx -d ${domainName} → Certificat TLS 1.3 Let’s Encrypt déployé + redirection 301 HTTPS + HSTS.`
                      : 'Certificat HTTPS désactivé (trafic repassé en HTTP clair).'
                  );
                }}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  tlsEnabled
                    ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                } ${!serverCreated || !nginxConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  {tlsEnabled ? 'Certificat HTTPS Let’s Encrypt actif' : 'Activer HTTPS (certbot --nginx)'}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  TLS 1.3 + redirection HTTP → HTTPS
                </div>
              </button>
            </div>
          </section>

          {/* Deck 4: Firewall UFW & Database Isolation */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  4. Pare-feu UFW &amp; Isolation de la Base de Données
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {firewallHardened ? 'Filtrage strict actif' : 'À verrouiller'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!serverCreated}
                onClick={() => {
                  playClick();
                  const next = !ufwDefaultDeny;
                  setUfwDefaultDeny(next);
                  appendLog(
                    next ? 'ok' : 'warn',
                    next
                      ? '$ sudo ufw default deny incoming → Tout trafic entrant imprévu sera bloqué.'
                      : 'Politique par défaut remise en allow incoming (dangereux).'
                  );
                }}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-colors ${
                  ufwDefaultDeny
                    ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                } ${!serverCreated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                default deny incoming
              </button>

              <button
                type="button"
                disabled={!serverCreated}
                onClick={() => {
                  playClick();
                  setUfwAllowSsh((v) => !v);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-colors ${
                  ufwAllowSsh
                    ? 'border-sky-400 dark:border-cyan-700 bg-sky-50 dark:bg-cyan-950/40 text-sky-800 dark:text-cyan-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                } ${!serverCreated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                22/tcp (SSH admin)
              </button>

              <button
                type="button"
                disabled={!serverCreated}
                onClick={() => {
                  playClick();
                  setUfwAllowHttp((v) => !v);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-colors ${
                  ufwAllowHttp
                    ? 'border-sky-400 dark:border-cyan-700 bg-sky-50 dark:bg-cyan-950/40 text-sky-800 dark:text-cyan-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                } ${!serverCreated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                80/tcp (Redir HTTP)
              </button>

              <button
                type="button"
                disabled={!serverCreated}
                onClick={() => {
                  playClick();
                  setUfwAllowHttps((v) => !v);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-colors ${
                  ufwAllowHttps
                    ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                } ${!serverCreated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                443/tcp (HTTPS)
              </button>

              <button
                type="button"
                disabled={!serverCreated}
                onClick={() => {
                  playClick();
                  const next = !ufwExposeDb;
                  setUfwExposeDb(next);
                  appendLog(
                    next ? 'err' : 'ok',
                    next
                      ? 'ALERTE : Port 5432/tcp (PostgreSQL) ouvert sur Internet !'
                      : 'Port 5432/tcp fermé côté WAN : PostgreSQL isolé sur le réseau privé 10.20.0.15.'
                  );
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-colors ${
                  ufwExposeDb
                    ? 'border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
                    : 'border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                } ${!serverCreated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Database className="w-3.5 h-3.5" />
                {ufwExposeDb ? '5432/tcp EXPOSÉ (Cliquez pour bloquer)' : '5432/tcp bloqué WAN (Isolé)'}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Pensez toujours à autoriser <code className="font-mono">22/tcp</code> avant d&apos;activer{' '}
                <code className="font-mono">ufw enable</code>.
              </div>
              <button
                type="button"
                disabled={!serverCreated}
                onClick={handleToggleUfwEnable}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  ufwEnabled
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : serverCreated
                      ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-cyan-400'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                {ufwEnabled ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                {ufwEnabled ? 'UFW Actif (Désactiver)' : 'Activer UFW (ufw enable)'}
              </button>
            </div>
          </section>
        </div>

        {/* RIGHT: Live Config Files + Diagnostic Console + Objectives */}
        <div className="xl:col-span-5 space-y-5">
          {/* Objectives Checklist */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Checklist de Mise en Production
              </h3>
              <span className="text-xs font-mono font-bold text-sky-700 dark:text-cyan-400 tabular-nums">
                {completedCount}/{objectives.length} · +100 XP
              </span>
            </div>
            <ul className="space-y-2">
              {objectives.map((obj) => (
                <li
                  key={obj.id}
                  className={`flex items-start gap-2.5 text-xs p-2.5 rounded-xl border transition-colors ${
                    obj.done
                      ? 'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/25 text-emerald-900 dark:text-emerald-200'
                      : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {obj.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{obj.label}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Real-Time Generated Configuration Files */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                {(
                  [
                    { id: 'sshd', label: 'sshd_config' },
                    { id: 'nginx', label: 'nginx.conf' },
                    { id: 'systemd', label: 'systemd & UFW' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setActiveFileTab(t.id);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-colors whitespace-nowrap ${
                      activeFileTab === t.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-cyan-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyConfig}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {copiedTab === activeFileTab ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedTab === activeFileTab ? 'Copié' : 'Copier'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadConfig}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  .conf
                </button>
              </div>
            </div>

            <pre className="p-3.5 rounded-xl bg-slate-950 text-sky-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64">
              {activeFileContent}
            </pre>
          </section>

          {/* Live Diagnostic Terminal */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
                <Terminal className="w-4 h-4" />
                Console de Diagnostic &amp; Audit Temps Réel
              </div>
              <span className="text-[11px] font-mono text-slate-400">deploy@{hostname}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'systemctl', label: 'systemctl status' },
                  { id: 'ss', label: 'ss -tulpn' },
                  { id: 'ufw', label: 'ufw status' },
                  { id: 'curl', label: 'curl -I https' },
                  { id: 'nmap', label: 'nmap audit' },
                  { id: 'ssh-root', label: 'test ssh root' },
                ] as const
              ).map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => handleRunDiagnostic(btn.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold text-cyan-300 transition-colors whitespace-nowrap"
                >
                  <Play className="w-3 h-3" />
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="rounded-xl bg-black/70 border border-slate-800 p-3 font-mono text-[11px] space-y-1.5 max-h-56 overflow-y-auto">
              {logs.map((entry) => (
                <div key={entry.id} className="leading-relaxed">
                  <span className="text-slate-500 mr-2 tabular-nums">[{entry.time}]</span>
                  <span
                    className={
                      entry.level === 'ok'
                        ? 'text-emerald-400'
                        : entry.level === 'err'
                          ? 'text-rose-400'
                          : entry.level === 'warn'
                            ? 'text-amber-300'
                            : 'text-slate-300'
                    }
                  >
                    {entry.text}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
