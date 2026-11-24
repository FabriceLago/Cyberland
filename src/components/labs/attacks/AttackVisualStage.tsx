import React from 'react';
import { CyberAttackId } from '../../../data/cyberAttackSimulations';

interface AttackVisualStageProps {
  attackId: CyberAttackId;
  activeDefenses: Record<string, boolean>;
  attackActive: boolean;
  phase: number; // continuously increments 0..99 for smooth animation
  mitigationPct: number;
  damageCounter: number;
}

const SAMPLE_PASSWORDS = [
  'Summer2024!',
  'Cyber12345',
  'Admin@2025',
  'P@ssw0rd1!',
  'Azerty2026',
  'Welcome123',
];

export const AttackVisualStage: React.FC<AttackVisualStageProps> = ({
  attackId,
  activeDefenses,
  attackActive,
  phase,
  mitigationPct,
  damageCounter,
}) => {
  const p1 = (phase * 4) % 100;
  const p2 = (phase * 4 + 34) % 100;
  const p3 = (phase * 4 + 68) % 100;
  const isNeutralized = mitigationPct >= 85;

  const renderAnimatedDot = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    progress: number,
    color: string,
    blockedAtMid?: string
  ) => {
    const t = progress / 100;
    if (blockedAtMid && t > 0.48) {
      const mx = x1 + (x2 - x1) * 0.48;
      const my = y1 + (y2 - y1) * 0.48;
      const fade = Math.max(0, 1 - (t - 0.48) / 0.25);
      if (fade <= 0.02) return null;
      return (
        <g opacity={fade}>
          <circle cx={mx} cy={my} r={7 + (1 - fade) * 7} fill="none" stroke="#818cf8" strokeWidth="2" />
          <text
            x={mx}
            y={my - 10}
            textAnchor="middle"
            fill="#a5b4fc"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="700"
          >
            {blockedAtMid}
          </text>
        </g>
      );
    }
    const cx = x1 + (x2 - x1) * t;
    const cy = y1 + (y2 - y1) * t;
    return <circle cx={cx} cy={cy} r="5" fill={color} />;
  };

  if (attackId === 'xss') {
    const escaped = Boolean(activeDefenses.escape);
    const httpOnly = Boolean(activeDefenses.httponly);
    const csp = Boolean(activeDefenses.csp);
    const exfilBlocked = escaped || httpOnly || csp;
    const blockLabel = escaped ? 'ESCAPED' : httpOnly ? 'HTTPONLY' : 'CSP BLOCK';

    return (
      <svg viewBox="0 0 760 250" className="w-full h-auto select-none" role="img" aria-label="Animation attaque XSS et protection">
        {/* Links */}
        <line x1="178" y1="125" x2="290" y2="125" stroke="#334155" strokeWidth="2" strokeDasharray="5 4" />
        <line x1="478" y1="125" x2="590" y2="125" stroke={exfilBlocked ? '#10b981' : '#f43f5e'} strokeWidth="2" strokeDasharray="5 4" />

        {/* Node 1: Forum Comment */}
        <g transform="translate(14, 52)">
          <rect width="164" height="146" rx="14" fill="#181224" stroke={attackActive ? '#f43f5e' : '#475569'} strokeWidth="2" />
          <text x="14" y="26" fill="#fda4af" fontSize="11" fontWeight="700">FORUM CYBERLAND</text>
          <text x="14" y="46" fill="#ffffff" fontSize="12.5" fontWeight="800">Commentaire posté</text>
          <rect x="12" y="58" width="140" height="46" rx="7" fill="#0f172a" stroke="#334155" />
          <text x="18" y="76" fill={escaped ? '#6ee7b7' : '#fb7185'} fontSize="9.5" fontFamily="monospace">
            {escaped ? '&lt;script&gt;steal()' : '<script>steal()'}
          </text>
          <text x="18" y="92" fill={escaped ? '#6ee7b7' : '#fb7185'} fontSize="9.5" fontFamily="monospace">
            {escaped ? '&lt;/script&gt; (texte)' : '</script> (ACTIF)'}
          </text>
          <text x="14" y="128" fill={escaped ? '#34d399' : '#fca5a5'} fontSize="10" fontFamily="monospace" fontWeight="700">
            {escaped ? 'textContent : SÛR' : 'innerHTML : VULNÉRABLE'}
          </text>
        </g>

        {/* Node 2: Victim Browser */}
        <g transform="translate(290, 34)">
          <rect width="188" height="182" rx="16" fill="#0f172a" stroke={isNeutralized ? '#10b981' : '#f59e0b'} strokeWidth="2" />
          <text x="94" y="26" textAnchor="middle" fill="#e2e8f0" fontSize="11.5" fontWeight="800">NAVIGATEUR VICTIME</text>
          <rect x="14" y="40" width="160" height="36" rx="8" fill={escaped ? '#064e3b' : '#4c0519'} />
          <text x="94" y="55" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700">
            Moteur DOM / JS
          </text>
          <text x="94" y="69" textAnchor="middle" fill={escaped ? '#6ee7b7' : '#fecdd3'} fontSize="9" fontFamily="monospace">
            {escaped ? 'Affiché en texte brut' : 'Script malveillant exécuté !'}
          </text>

          <rect x="14" y="86" width="160" height="36" rx="8" fill={httpOnly ? '#064e3b' : '#3b0764'} />
          <text x="94" y="101" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700">
            Cookie session_id
          </text>
          <text x="94" y="115" textAnchor="middle" fill={httpOnly ? '#6ee7b7' : '#f0abfc'} fontSize="9" fontFamily="monospace">
            {httpOnly ? 'HttpOnly : INVISIBLE JS' : 'document.cookie EXPOSÉ'}
          </text>

          <rect x="14" y="132" width="160" height="36" rx="8" fill={csp ? '#064e3b' : '#1e293b'} />
          <text x="94" y="147" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700">
            Politique CSP
          </text>
          <text x="94" y="161" textAnchor="middle" fill={csp ? '#6ee7b7' : '#94a3b8'} fontSize="9" fontFamily="monospace">
            {csp ? "script-src 'self' ACTIF" : 'Aucune restriction'}
          </text>
        </g>

        {/* Node 3: Attacker Collector */}
        <g transform="translate(590, 52)">
          <rect width="156" height="146" rx="14" fill="#1e1018" stroke={exfilBlocked ? '#334155' : '#f43f5e'} strokeWidth="2" />
          <text x="14" y="26" fill="#fda4af" fontSize="11" fontWeight="700">SERVEUR ATTAQUANT</text>
          <text x="14" y="46" fill="#ffffff" fontSize="12.5" fontWeight="800">evil.site/steal</text>
          <rect x="14" y="64" width="128" height="44" rx="8" fill="#0f172a" />
          <text x="78" y="83" textAnchor="middle" fill={exfilBlocked ? '#34d399' : '#fb7185'} fontSize="11" fontFamily="monospace" fontWeight="700">
            {exfilBlocked ? '0 FUITE ACTIVE' : `${damageCounter} COOKIES VOLÉS`}
          </text>
          <text x="78" y="99" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
            {exfilBlocked ? 'Exfiltration bloquée' : 'Session piratée !'}
          </text>
        </g>

        {/* Live animated packets */}
        {attackActive && renderAnimatedDot(178, 125, 290, 125, p1, escaped ? '#34d399' : '#f43f5e')}
        {attackActive && renderAnimatedDot(178, 125, 290, 125, p2, escaped ? '#34d399' : '#f43f5e')}
        {attackActive && renderAnimatedDot(478, 125, 590, 125, p1, '#f43f5e', exfilBlocked ? blockLabel : undefined)}
        {attackActive && renderAnimatedDot(478, 125, 590, 125, p3, '#f43f5e', exfilBlocked ? blockLabel : undefined)}
      </svg>
    );
  }

  if (attackId === 'mitm') {
    const tls = Boolean(activeDefenses.tls);
    const vpn = Boolean(activeDefenses.vpn);
    const dai = Boolean(activeDefenses.dai);
    const encrypted = tls || vpn;

    return (
      <svg viewBox="0 0 760 250" className="w-full h-auto select-none" role="img" aria-label="Animation Man-in-the-Middle ARP Spoofing">
        {/* Direct safe path (Victim -> Router) */}
        <line
          x1="176"
          y1="176"
          x2="584"
          y2="176"
          stroke={dai ? '#10b981' : '#1e293b'}
          strokeWidth={dai ? 3 : 2}
          strokeDasharray={dai ? undefined : '5 5'}
        />
        {/* Hijacked ARP triangle path through attacker */}
        <line
          x1="176"
          y1="156"
          x2="310"
          y2="78"
          stroke={dai ? '#334155' : encrypted ? '#38bdf8' : '#f43f5e'}
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <line
          x1="450"
          y1="78"
          x2="584"
          y2="156"
          stroke={dai ? '#334155' : encrypted ? '#38bdf8' : '#f43f5e'}
          strokeWidth="2"
          strokeDasharray="5 4"
        />

        {/* Attacker Node Top Center */}
        <g transform="translate(285, 16)">
          <rect
            width="190"
            height="104"
            rx="14"
            fill="#1e1018"
            stroke={dai || encrypted ? '#475569' : '#f43f5e'}
            strokeWidth="2"
          />
          <text x="95" y="24" textAnchor="middle" fill="#fda4af" fontSize="11" fontWeight="800">
            ATTAQUANT MITM (ARP SPOOF)
          </text>
          <rect x="14" y="34" width="162" height="56" rx="8" fill="#0f172a" />
          <text x="95" y="54" textAnchor="middle" fill={dai ? '#34d399' : encrypted ? '#38bdf8' : '#fb7185'} fontSize="10" fontFamily="monospace" fontWeight="700">
            {dai
              ? 'ARP BLOQUÉ (SWITCH DAI)'
              : encrypted
                ? '0x9F 0xA2 E8... (CHIFFRÉ)'
                : 'POST /login pass=Super123!'}
          </text>
          <text x="95" y="74" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
            {dai ? 'Aucun paquet intercepté' : encrypted ? 'Illisible : TLS / VPN actif' : 'Identifiants lus en clair !'}
          </text>
        </g>

        {/* Left: Victim Laptop */}
        <g transform="translate(14, 126)">
          <rect width="162" height="100" rx="14" fill="#071f1a" stroke="#10b981" strokeWidth="2" />
          <text x="14" y="26" fill="#6ee7b7" fontSize="11" fontWeight="700">VICTIME (WI-FI CAFÉ)</text>
          <text x="14" y="48" fill="#ffffff" fontSize="12.5" fontWeight="800">192.168.1.24</text>
          <text x="14" y="70" fill="#a7f3d0" fontSize="10" fontFamily="monospace">
            {vpn ? 'Tunnel VPN WireGuard' : tls ? 'HTTPS TLS 1.3 + HSTS' : 'HTTP Port 80 (clair)'}
          </text>
        </g>

        {/* Right: Wi-Fi Router / Bank */}
        <g transform="translate(584, 126)">
          <rect width="162" height="100" rx="14" fill="#0f172a" stroke={isNeutralized ? '#10b981' : '#f59e0b'} strokeWidth="2" />
          <text x="14" y="26" fill="#93c5fd" fontSize="11" fontWeight="700">ROUTEUR &amp; BANQUE</text>
          <text x="14" y="48" fill="#ffffff" fontSize="12.5" fontWeight="800">192.168.1.1</text>
          <text x="14" y="70" fill={dai ? '#6ee7b7' : '#cbd5e1'} fontSize="10" fontFamily="monospace">
            {dai ? 'DAI Switch : ACTIF' : 'Table ARP usurpée'}
          </text>
        </g>

        {/* Animated packets */}
        {attackActive && !dai && (
          <>
            {renderAnimatedDot(176, 156, 310, 78, p1, encrypted ? '#38bdf8' : '#f43f5e')}
            {renderAnimatedDot(450, 78, 584, 156, p2, encrypted ? '#38bdf8' : '#f43f5e')}
          </>
        )}
        {dai && (
          <>
            {renderAnimatedDot(176, 176, 584, 176, p1, '#34d399')}
            {renderAnimatedDot(176, 176, 584, 176, p2, '#34d399')}
            {renderAnimatedDot(380, 120, 380, 172, p3, '#f43f5e', 'DAI DROP')}
          </>
        )}
      </svg>
    );
  }

  if (attackId === 'ransomware') {
    const edr = Boolean(activeDefenses.edr);
    const smb = Boolean(activeDefenses.smb);
    const backup = Boolean(activeDefenses.backup);
    const spreadStopped = edr || smb;

    const nodes = [
      { id: 'rh', x: 30, y: 88, label: 'Poste-RH-04', sub: edr ? 'ISOLÉ EDR' : '.locked', infected: !backup, isolated: edr },
      { id: 'compta', x: 230, y: 24, label: 'Poste-Compta', sub: spreadStopped || backup ? 'SAIN' : '.locked', infected: !spreadStopped && !backup },
      { id: 'files', x: 230, y: 152, label: 'Serveur Fichiers', sub: spreadStopped || backup ? 'SAIN' : 'CHIFFRÉ', infected: !spreadStopped && !backup },
      { id: 'ad', x: 430, y: 88, label: 'Active Directory', sub: spreadStopped || backup ? 'PROTÉGÉ' : 'MENACÉ', infected: !spreadStopped && !backup && phase % 20 > 6 },
      { id: 'vault', x: 604, y: 88, label: 'Backup 3-2-1', sub: backup ? 'RESTAURATION' : 'IMMUABLE', infected: false, vault: true },
    ];

    return (
      <svg viewBox="0 0 760 250" className="w-full h-auto select-none" role="img" aria-label="Animation propagation ransomware et confinement">
        {/* Network Links */}
        <line x1="162" y1="120" x2="230" y2="62" stroke={spreadStopped ? '#334155' : '#f43f5e'} strokeWidth="2" strokeDasharray="4 4" />
        <line x1="162" y1="128" x2="230" y2="184" stroke={spreadStopped ? '#334155' : '#f43f5e'} strokeWidth="2" strokeDasharray="4 4" />
        <line x1="364" y1="62" x2="430" y2="120" stroke={spreadStopped ? '#334155' : '#f43f5e'} strokeWidth="2" strokeDasharray="4 4" />
        <line x1="364" y1="184" x2="430" y2="128" stroke={spreadStopped ? '#334155' : '#f43f5e'} strokeWidth="2" strokeDasharray="4 4" />
        <line x1="564" y1="124" x2="604" y2="124" stroke={backup ? '#10b981' : '#475569'} strokeWidth="2.5" strokeDasharray={backup ? undefined : '4 4'} />

        {nodes.map((n) => (
          <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
            <rect
              width="134"
              height="72"
              rx="12"
              fill={n.vault ? '#062019' : n.isolated ? '#1e1b4b' : n.infected ? '#2a0a12' : '#0b1e26'}
              stroke={n.vault ? '#10b981' : n.isolated ? '#818cf8' : n.infected ? '#f43f5e' : '#34d399'}
              strokeWidth="2"
            />
            <text x="67" y="28" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">
              {n.label}
            </text>
            <text
              x="67"
              y="50"
              textAnchor="middle"
              fill={n.vault ? '#6ee7b7' : n.isolated ? '#a5b4fc' : n.infected ? '#fda4af' : '#6ee7b7'}
              fontSize="10"
              fontFamily="monospace"
              fontWeight="700"
            >
              {n.sub}
            </text>
          </g>
        ))}

        {/* Animated SMB Lateral Spread or Blocked Pulses */}
        {attackActive && renderAnimatedDot(162, 120, 230, 62, p1, '#f43f5e', spreadStopped ? (edr ? 'EDR' : 'SMB 445') : undefined)}
        {attackActive && renderAnimatedDot(162, 128, 230, 184, p2, '#f43f5e', spreadStopped ? (edr ? 'EDR' : 'SMB 445') : undefined)}
        {attackActive && !spreadStopped && renderAnimatedDot(364, 184, 430, 128, p3, '#f43f5e')}

        {/* Backup restoration pulses */}
        {backup && renderAnimatedDot(604, 124, 364, 184, p1, '#34d399')}
        {backup && renderAnimatedDot(604, 124, 430, 124, p2, '#34d399')}
      </svg>
    );
  }

  if (attackId === 'bruteforce') {
    const lockout = Boolean(activeDefenses.lockout);
    const mfa = Boolean(activeDefenses.mfa);
    const argon2 = Boolean(activeDefenses.argon2);
    const currentGuess = SAMPLE_PASSWORDS[Math.floor(phase / 4) % SAMPLE_PASSWORDS.length];

    return (
      <svg viewBox="0 0 760 250" className="w-full h-auto select-none" role="img" aria-label="Animation attaque par force brute et protection MFA">
        <line x1="204" y1="125" x2="310" y2="125" stroke="#334155" strokeWidth="2" strokeDasharray="5 4" />
        <line x1="478" y1="125" x2="574" y2="125" stroke={mfa || lockout ? '#10b981' : '#f43f5e'} strokeWidth="2" strokeDasharray="5 4" />

        {/* Bot Credential Stuffing */}
        <g transform="translate(14, 48)">
          <rect width="190" height="154" rx="14" fill="#1e1018" stroke={attackActive ? '#f43f5e' : '#475569'} strokeWidth="2" />
          <text x="14" y="26" fill="#fda4af" fontSize="11" fontWeight="800">SCRIPT FORCE BRUTE</text>
          <text x="14" y="48" fill="#ffffff" fontSize="12" fontWeight="700">admin@cyberland.app</text>
          <rect x="14" y="60" width="162" height="36" rx="8" fill="#0f172a" />
          <text x="95" y="82" textAnchor="middle" fill="#fb7185" fontSize="11" fontFamily="monospace" fontWeight="700">
            Test : {currentGuess}
          </text>
          <text x="14" y="120" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
            Cadence : {lockout ? 'Bloquée (HTTP 429)' : argon2 ? 'Ralentie (Argon2id)' : '480 essais / sec'}
          </text>
          <text x="14" y="138" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
            Total : {damageCounter} essais
          </text>
        </g>

        {/* Auth Gateway */}
        <g transform="translate(310, 34)">
          <rect width="168" height="182" rx="16" fill="#0f172a" stroke={isNeutralized ? '#10b981' : '#818cf8'} strokeWidth="2" />
          <text x="84" y="26" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="800">PORTAIL /API/LOGIN</text>

          <rect x="14" y="42" width="140" height="36" rx="8" fill={lockout ? '#064e3b' : '#1e293b'} />
          <text x="84" y="64" textAnchor="middle" fill={lockout ? '#6ee7b7' : '#94a3b8'} fontSize="10" fontFamily="monospace" fontWeight="700">
            {lockout ? 'RATE LIMIT 429 OK' : 'SANS VERROUILLAGE'}
          </text>

          <rect x="14" y="88" width="140" height="36" rx="8" fill={argon2 ? '#064e3b' : '#1e293b'} />
          <text x="84" y="110" textAnchor="middle" fill={argon2 ? '#6ee7b7' : '#94a3b8'} fontSize="10" fontFamily="monospace" fontWeight="700">
            {argon2 ? 'HACHAGE ARGON2ID' : 'HACHAGE RAPIDE'}
          </text>

          <rect x="14" y="134" width="140" height="36" rx="8" fill={mfa ? '#064e3b' : '#4c0519'} />
          <text x="84" y="156" textAnchor="middle" fill={mfa ? '#6ee7b7' : '#fecdd3'} fontSize="10" fontFamily="monospace" fontWeight="700">
            {mfa ? 'MFA FIDO2 / TOTP' : 'SANS MFA (EXPOSÉ)'}
          </text>
        </g>

        {/* Admin Account */}
        <g transform="translate(574, 58)">
          <rect width="172" height="134" rx="14" fill={isNeutralized ? '#062019' : '#2a0a12'} stroke={isNeutralized ? '#10b981' : '#f43f5e'} strokeWidth="2" />
          <text x="86" y="30" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="700">COMPTE ADMIN</text>
          <text x="86" y="54" textAnchor="middle" fill="#ffffff" fontSize="13.5" fontWeight="800">
            {isNeutralized ? 'VERROUILLÉ SÛR' : 'SOUS ATTAQUE'}
          </text>
          <rect x="18" y="76" width="136" height="34" rx="8" fill={isNeutralized ? '#065f46' : '#881337'} />
          <text x="86" y="97" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="700">
            {mfa ? '2e FACTEUR REQUIS' : lockout ? 'IP BANNI 429' : 'RISQUE PIRATAGE'}
          </text>
        </g>

        {attackActive && renderAnimatedDot(204, 114, 310, 114, p1, '#f43f5e', lockout ? 'HTTP 429' : undefined)}
        {attackActive && renderAnimatedDot(204, 136, 310, 136, p2, '#f43f5e', lockout ? 'HTTP 429' : undefined)}
        {attackActive && !lockout && renderAnimatedDot(478, 125, 574, 125, p3, '#f43f5e', mfa ? 'MFA BLOCK' : undefined)}
      </svg>
    );
  }

  if (attackId === 'phishing') {
    const dmarc = Boolean(activeDefenses.dmarc);
    const fido2 = Boolean(activeDefenses.fido2);
    const filter = Boolean(activeDefenses.filter);
    const mailBlocked = dmarc || filter;

    return (
      <svg viewBox="0 0 760 250" className="w-full h-auto select-none" role="img" aria-label="Animation phishing et proxy AiTM">
        <line x1="170" y1="125" x2="255" y2="125" stroke="#334155" strokeWidth="2" strokeDasharray="5 4" />
        <line x1="395" y1="125" x2="455" y2="125" stroke={mailBlocked ? '#10b981' : '#f43f5e'} strokeWidth="2" strokeDasharray="5 4" />
        <line x1="585" y1="125" x2="625" y2="125" stroke={fido2 || mailBlocked ? '#10b981' : '#f43f5e'} strokeWidth="2" strokeDasharray="5 4" />

        {/* Spoofed Mail Server */}
        <g transform="translate(14, 56)">
          <rect width="156" height="138" rx="14" fill="#1e1018" stroke="#f43f5e" strokeWidth="2" />
          <text x="12" y="26" fill="#fda4af" fontSize="10.5" fontWeight="800">MAIL USURPÉ</text>
          <text x="12" y="48" fill="#ffffff" fontSize="11" fontWeight="700">security@cyberland</text>
          <text x="12" y="68" fill="#fda4af" fontSize="9.5" fontFamily="monospace">SPF : FAIL</text>
          <text x="12" y="84" fill="#fda4af" fontSize="9.5" fontFamily="monospace">DKIM : ABSENT</text>
          <text x="12" y="108" fill="#cbd5e1" fontSize="9" fontFamily="monospace">Lien : cyber1and.com</text>
        </g>

        {/* SMTP Gateway */}
        <g transform="translate(255, 46)">
          <rect width="140" height="158" rx="14" fill="#0f172a" stroke={mailBlocked ? '#10b981' : '#475569'} strokeWidth="2" />
          <text x="70" y="26" textAnchor="middle" fill="#e2e8f0" fontSize="10.5" fontWeight="800">PASSERELLE MAIL</text>
          <rect x="12" y="44" width="116" height="42" rx="8" fill={dmarc ? '#064e3b' : '#1e293b'} />
          <text x="70" y="62" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="700">DMARC</text>
          <text x="70" y="76" textAnchor="middle" fill={dmarc ? '#6ee7b7' : '#94a3b8'} fontSize="9" fontFamily="monospace">
            {dmarc ? 'p=reject (ACTIF)' : 'p=none (EXPOSÉ)'}
          </text>
          <rect x="12" y="98" width="116" height="42" rx="8" fill={filter ? '#064e3b' : '#1e293b'} />
          <text x="70" y="116" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="700">Filtre URL</text>
          <text x="70" y="130" textAnchor="middle" fill={filter ? '#6ee7b7' : '#94a3b8'} fontSize="9" fontFamily="monospace">
            {filter ? 'BLOQUE CLONES' : 'INACTIF'}
          </text>
        </g>

        {/* AiTM Proxy */}
        <g transform="translate(455, 56)">
          <rect width="130" height="138" rx="14" fill="#1e1018" stroke={fido2 || mailBlocked ? '#475569' : '#f43f5e'} strokeWidth="2" />
          <text x="65" y="26" textAnchor="middle" fill="#fda4af" fontSize="10.5" fontWeight="800">PROXY AiTM</text>
          <text x="65" y="48" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace">cyber1and.com</text>
          <text x="65" y="84" textAnchor="middle" fill={fido2 ? '#6ee7b7' : '#fb7185'} fontSize="9.5" fontFamily="monospace" fontWeight="700">
            {fido2 ? 'FIDO2 REFUSÉ' : mailBlocked ? 'AUCUNE VICTIME' : 'VOLE SESSION'}
          </text>
        </g>

        {/* Real SSO */}
        <g transform="translate(625, 56)">
          <rect width="122" height="138" rx="14" fill={isNeutralized ? '#062019' : '#2a0a12'} stroke={isNeutralized ? '#10b981' : '#f43f5e'} strokeWidth="2" />
          <text x="61" y="28" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="800">SSO ENTREPRISE</text>
          <text x="61" y="64" textAnchor="middle" fill={fido2 ? '#6ee7b7' : '#cbd5e1'} fontSize="10" fontFamily="monospace" fontWeight="700">
            {fido2 ? 'PASSKEY FIDO2' : 'OTP SMS FAIBLE'}
          </text>
          <text x="61" y="102" textAnchor="middle" fill={isNeutralized ? '#34d399' : '#fda4af'} fontSize="10" fontWeight="700">
            {isNeutralized ? 'COMPTE SÛR' : 'JETON VOLÉ'}
          </text>
        </g>

        {attackActive && renderAnimatedDot(170, 125, 255, 125, p1, '#f43f5e', mailBlocked ? (dmarc ? 'DMARC 550' : 'URL BLOCK') : undefined)}
        {attackActive && !mailBlocked && renderAnimatedDot(395, 125, 455, 125, p2, '#f43f5e')}
        {attackActive && !mailBlocked && renderAnimatedDot(585, 125, 625, 125, p3, '#f43f5e', fido2 ? 'FIDO2' : undefined)}
      </svg>
    );
  }

  if (attackId === 'dns') {
    const dnssec = Boolean(activeDefenses.dnssec);
    const doh = Boolean(activeDefenses.doh);
    const randomize = Boolean(activeDefenses.randomize);
    const safeDns = dnssec || (doh && randomize);

    return (
      <svg viewBox="0 0 760 250" className="w-full h-auto select-none" role="img" aria-label="Animation empoisonnement DNS et validation DNSSEC">
        <line x1="176" y1="125" x2="290" y2="125" stroke={doh ? '#38bdf8' : '#475569'} strokeWidth="2.5" strokeDasharray={doh ? undefined : '5 4'} />
        <line x1="478" y1="95" x2="582" y2="62" stroke={safeDns ? '#334155' : '#f43f5e'} strokeWidth="2" strokeDasharray="5 4" />
        <line x1="478" y1="155" x2="582" y2="188" stroke={safeDns ? '#10b981' : '#334155'} strokeWidth="2.5" />

        {/* Clients */}
        <g transform="translate(14, 68)">
          <rect width="162" height="114" rx="14" fill="#071f1a" stroke="#10b981" strokeWidth="2" />
          <text x="14" y="28" fill="#6ee7b7" fontSize="11" fontWeight="700">UTILISATEURS</text>
          <text x="14" y="52" fill="#ffffff" fontSize="11.5" fontWeight="800">banque.cyberland</text>
          <text x="14" y="78" fill={doh ? '#38bdf8' : '#cbd5e1'} fontSize="10" fontFamily="monospace">
            {doh ? 'Requête DoH (443)' : 'Requête UDP 53 clair'}
          </text>
        </g>

        {/* DNS Resolver */}
        <g transform="translate(290, 38)">
          <rect width="188" height="174" rx="16" fill="#0f172a" stroke={safeDns ? '#10b981' : '#f43f5e'} strokeWidth="2" />
          <text x="94" y="26" textAnchor="middle" fill="#e2e8f0" fontSize="11.5" fontWeight="800">RÉSOLVEUR DNS</text>
          <rect x="14" y="42" width="160" height="54" rx="8" fill={safeDns ? '#064e3b' : '#4c0519'} />
          <text x="94" y="62" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700">Cache Enregistrement A</text>
          <text x="94" y="82" textAnchor="middle" fill={safeDns ? '#6ee7b7' : '#fda4af'} fontSize="11" fontFamily="monospace" fontWeight="800">
            {safeDns ? '104.21.44.12 (VRAI)' : '185.22.9.66 (FAUX!)'}
          </text>
          <text x="94" y="122" textAnchor="middle" fill={dnssec ? '#6ee7b7' : '#94a3b8'} fontSize="10" fontFamily="monospace" fontWeight="700">
            {dnssec ? 'DNSSEC RRSIG : VALIDE' : 'DNSSEC : DÉSACTIVÉ'}
          </text>
          <text x="94" y="144" textAnchor="middle" fill={randomize ? '#a5b4fc' : '#64748b'} fontSize="9.5" fontFamily="monospace">
            {randomize ? 'Port & TXID aléatoires' : 'TXID prévisible'}
          </text>
        </g>

        {/* Top Right: Rogue Clone */}
        <g transform="translate(582, 22)">
          <rect width="164" height="86" rx="12" fill="#1e1018" stroke={safeDns ? '#475569' : '#f43f5e'} strokeWidth="2" />
          <text x="14" y="26" fill="#fda4af" fontSize="10.5" fontWeight="800">SITE CLONÉ PIRATE</text>
          <text x="14" y="48" fill="#ffffff" fontSize="12" fontFamily="monospace" fontWeight="700">185.22.9.66</text>
          <text x="14" y="68" fill={safeDns ? '#34d399' : '#fb7185'} fontSize="9.5" fontFamily="monospace">
            {safeDns ? 'Réponse rejetée' : 'Vol d’identifiants !'}
          </text>
        </g>

        {/* Bottom Right: Authentic Bank */}
        <g transform="translate(582, 142)">
          <rect width="164" height="86" rx="12" fill="#062019" stroke="#10b981" strokeWidth="2" />
          <text x="14" y="26" fill="#6ee7b7" fontSize="10.5" fontWeight="800">VRAIE BANQUE</text>
          <text x="14" y="48" fill="#ffffff" fontSize="12" fontFamily="monospace" fontWeight="700">104.21.44.12</text>
          <text x="14" y="68" fill="#a7f3d0" fontSize="9.5" fontFamily="monospace">
            {safeDns ? 'Trafic authentique' : 'Contournée !'}
          </text>
        </g>

        {renderAnimatedDot(176, 125, 290, 125, p1, doh ? '#38bdf8' : '#34d399')}
        {attackActive && renderAnimatedDot(582, 62, 478, 95, p2, '#f43f5e', dnssec ? 'BOGUS SIG' : undefined)}
        {safeDns
          ? renderAnimatedDot(478, 155, 582, 188, p3, '#34d399')
          : attackActive && renderAnimatedDot(478, 95, 582, 62, p3, '#f43f5e')}
      </svg>
    );
  }

  if (attackId === 'ssrf') {
    const allowlist = Boolean(activeDefenses.allowlist);
    const imdsv2 = Boolean(activeDefenses.imdsv2);
    const egress = Boolean(activeDefenses.egress);
    const blockedInternal = allowlist || imdsv2 || egress;

    return (
      <svg viewBox="0 0 760 250" className="w-full h-auto select-none" role="img" aria-label="Animation SSRF Cloud et IMDSv2">
        {/* Cloud VPC boundary */}
        <rect x="258" y="14" width="488" height="222" rx="18" fill="#0b1224" stroke="#334155" strokeWidth="1.5" strokeDasharray="6 4" />
        <text x="276" y="34" fill="#64748b" fontSize="10.5" fontFamily="monospace" fontWeight="700">
          RÉSEAU PRIVÉ CLOUD (VPC INTERNE)
        </text>

        <line x1="176" y1="125" x2="282" y2="125" stroke="#475569" strokeWidth="2" strokeDasharray="5 4" />
        <line x1="464" y1="104" x2="554" y2="82" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="464" y1="146" x2="554" y2="178" stroke={blockedInternal ? '#334155' : '#f43f5e'} strokeWidth="2.2" strokeDasharray="5 4" />

        {/* Attacker */}
        <g transform="translate(14, 62)">
          <rect width="162" height="126" rx="14" fill="#1e1018" stroke="#f43f5e" strokeWidth="2" />
          <text x="14" y="26" fill="#fda4af" fontSize="11" fontWeight="800">ATTAQUANT WEB</text>
          <text x="14" y="48" fill="#ffffff" fontSize="10.5" fontFamily="monospace">GET /api/preview</text>
          <text x="14" y="68" fill="#fb7185" fontSize="9.5" fontFamily="monospace">?url=http://</text>
          <text x="14" y="84" fill="#fb7185" fontSize="9.5" fontFamily="monospace">169.254.169.254</text>
          <text x="14" y="108" fill="#cbd5e1" fontSize="9.5">Cible métadonnées IAM</text>
        </g>

        {/* Web Server */}
        <g transform="translate(282, 54)">
          <rect width="182" height="148" rx="14" fill="#0f172a" stroke={allowlist ? '#10b981' : '#f59e0b'} strokeWidth="2" />
          <text x="91" y="26" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="800">SERVEUR WEB /API</text>
          <rect x="14" y="42" width="154" height="40" rx="8" fill={allowlist ? '#064e3b' : '#4c0519'} />
          <text x="91" y="59" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="700">Filtre IP / CIDR</text>
          <text x="91" y="74" textAnchor="middle" fill={allowlist ? '#6ee7b7' : '#fda4af'} fontSize="9" fontFamily="monospace">
            {allowlist ? '169.254/16 BLOQUÉ' : 'TOUTES URL OUVERTES'}
          </text>
          <rect x="14" y="92" width="154" height="40" rx="8" fill={egress ? '#064e3b' : '#1e293b'} />
          <text x="91" y="109" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="700">IAM &amp; Egress</text>
          <text x="91" y="124" textAnchor="middle" fill={egress ? '#6ee7b7' : '#94a3b8'} fontSize="9" fontFamily="monospace">
            {egress ? 'MOINDRE PRIVILÈGE' : 'DROITS ADMIN LARGE'}
          </text>
        </g>

        {/* Public Internet Target */}
        <g transform="translate(554, 46)">
          <rect width="176" height="68" rx="12" fill="#071f1a" stroke="#10b981" strokeWidth="1.8" />
          <text x="88" y="28" textAnchor="middle" fill="#6ee7b7" fontSize="10.5" fontWeight="800">WEB PUBLIC AUTORISÉ</text>
          <text x="88" y="48" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace">docs.cyberland.app</text>
        </g>

        {/* Metadata Service */}
        <g transform="translate(554, 134)">
          <rect width="176" height="88" rx="12" fill={blockedInternal ? '#0f172a' : '#2a0a12'} stroke={imdsv2 ? '#10b981' : '#f43f5e'} strokeWidth="2" />
          <text x="88" y="24" textAnchor="middle" fill={imdsv2 ? '#6ee7b7' : '#fda4af'} fontSize="10.5" fontWeight="800">
            MÉTADONNÉES IAM
          </text>
          <text x="88" y="44" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="700">
            169.254.169.254
          </text>
          <text x="88" y="68" textAnchor="middle" fill={imdsv2 ? '#34d399' : '#fb7185'} fontSize="9.5" fontFamily="monospace" fontWeight="700">
            {imdsv2 ? 'IMDSv2 : TOKEN REQUIS' : 'IMDSv1 : CLÉS EXPOSÉES'}
          </text>
        </g>

        {attackActive && renderAnimatedDot(176, 125, 282, 125, p1, '#f43f5e')}
        {attackActive && renderAnimatedDot(464, 146, 554, 178, p2, '#f43f5e', blockedInternal ? (allowlist ? 'CIDR BLOCK' : 'IMDSV2 401') : undefined)}
        {renderAnimatedDot(464, 104, 554, 82, p3, '#34d399')}
      </svg>
    );
  }

  // CSRF
  const token = Boolean(activeDefenses.token);
  const samesite = Boolean(activeDefenses.samesite);
  const origin = Boolean(activeDefenses.origin);
  const csrfBlocked = token || samesite || origin;
  const csrfTag = samesite ? 'SAMESITE' : token ? '403 TOKEN' : 'ORIGIN 403';

  return (
    <svg viewBox="0 0 760 250" className="w-full h-auto select-none" role="img" aria-label="Animation attaque CSRF et jeton anti-CSRF">
      <line x1="256" y1="84" x2="546" y2="108" stroke="#10b981" strokeWidth="2" strokeDasharray="5 4" />
      <line x1="256" y1="176" x2="546" y2="144" stroke={csrfBlocked ? '#334155' : '#f43f5e'} strokeWidth="2.2" strokeDasharray="5 4" />

      {/* Victim Browser with 2 Tabs */}
      <g transform="translate(14, 24)">
        <rect width="242" height="202" rx="16" fill="#0f172a" stroke="#475569" strokeWidth="2" />
        <text x="121" y="24" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="800">NAVIGATEUR DE LA VICTIME</text>

        {/* Tab 1: Bank */}
        <rect x="14" y="38" width="214" height="68" rx="10" fill="#062019" stroke="#10b981" strokeWidth="1.5" />
        <text x="26" y="58" fill="#6ee7b7" fontSize="10.5" fontWeight="800">ONGLET 1 · banque.cyberland</text>
        <text x="26" y="76" fill="#ffffff" fontSize="10" fontFamily="monospace">Cookie : bank_session=ACTIF</text>
        <text x="26" y="94" fill="#a7f3d0" fontSize="9.5" fontFamily="monospace">
          {samesite ? 'SameSite=Strict (protégé)' : 'SameSite=None (envoyé partout)'}
        </text>

        {/* Tab 2: Evil Site */}
        <rect x="14" y="120" width="214" height="68" rx="10" fill="#2a0a12" stroke="#f43f5e" strokeWidth="1.5" />
        <text x="26" y="140" fill="#fda4af" fontSize="10.5" fontWeight="800">ONGLET 2 · promo-cadeau.site</text>
        <text x="26" y="158" fill="#ffffff" fontSize="9.5" fontFamily="monospace">POST /api/virement (caché)</text>
        <text x="26" y="176" fill="#fb7185" fontSize="9.5" fontFamily="monospace">Vers : IBAN_ATTAQUANT (-250€)</text>
      </g>

      {/* Center Shield */}
      <g transform="translate(336, 62)">
        <rect width="136" height="126" rx="14" fill="#111827" stroke={csrfBlocked ? '#10b981' : '#475569'} strokeWidth="2" />
        <text x="68" y="24" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="800">CONTRÔLE CSRF</text>
        <text x="68" y="52" textAnchor="middle" fill={samesite ? '#6ee7b7' : '#64748b'} fontSize="9.5" fontFamily="monospace" fontWeight="700">
          {samesite ? 'SameSite : OK' : 'SameSite : OFF'}
        </text>
        <text x="68" y="78" textAnchor="middle" fill={token ? '#6ee7b7' : '#64748b'} fontSize="9.5" fontFamily="monospace" fontWeight="700">
          {token ? 'CSRF Token : OK' : 'CSRF Token : OFF'}
        </text>
        <text x="68" y="104" textAnchor="middle" fill={origin ? '#6ee7b7' : '#64748b'} fontSize="9.5" fontFamily="monospace" fontWeight="700">
          {origin ? 'Origin Check : OK' : 'Origin Check : OFF'}
        </text>
      </g>

      {/* Bank Server */}
      <g transform="translate(546, 56)">
        <rect width="200" height="138" rx="14" fill={isNeutralized ? '#062019' : '#2a0a12'} stroke={isNeutralized ? '#10b981' : '#f43f5e'} strokeWidth="2" />
        <text x="100" y="28" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="800">SERVEUR BANQUE</text>
        <text x="100" y="56" textAnchor="middle" fill="#ffffff" fontSize="13.5" fontWeight="800">
          /api/virement
        </text>
        <rect x="18" y="76" width="164" height="42" rx="8" fill={csrfBlocked ? '#065f46' : '#881337'} />
        <text x="100" y="95" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="700">
          {csrfBlocked ? 'HTTP 403 REFUSÉ' : `${damageCounter} € DÉTOURNÉS !`}
        </text>
        <text x="100" y="111" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontFamily="monospace">
          {csrfBlocked ? 'Compte client intact' : 'Virement exécuté !'}
        </text>
      </g>

      {renderAnimatedDot(256, 84, 546, 108, p1, '#34d399')}
      {attackActive && renderAnimatedDot(256, 176, 546, 144, p2, '#f43f5e', csrfBlocked ? csrfTag : undefined)}
      {attackActive && renderAnimatedDot(256, 176, 546, 144, p3, '#f43f5e', csrfBlocked ? csrfTag : undefined)}
    </svg>
  );
};
