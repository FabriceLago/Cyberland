import React, { useState } from 'react';
import { FileText, Printer, Download, X, Check } from 'lucide-react';
import { playClick, playSuccess } from '../utils/sound';

interface CheatsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHEATSHEET_MD = `# Mémo Express A4 — Réseaux, Cloud & Cybersécurité (Cyberland)

## 1. Ports Essentiels à connaître
- **22 (SSH)** : Administration chiffrée (autorisé via VPN/bastion)
- **23 (Telnet)** : Administration en clair — À BLOQUER au pare-feu
- **53 (DNS)** : Traduction nom de domaine ↔ adresse IP
- **80 (HTTP)** : Web non chiffré (rediriger vers 443)
- **443 (HTTPS / TLS)** : Web chiffré de bout en bout

## 2. Modèle OSI (7 couches) & Encapsulation
- **L7 Application** (HTTPS, DNS) → Données
- **L6 Présentation** (TLS, compression) → Données
- **L5 Session** (Dialogue) → Données
- **L4 Transport** (TCP fiable / UDP temps réel + Ports) → **Segment**
- **L3 Réseau** (IP · Routeur) → **Paquet**
- **L2 Liaison** (MAC · Switch) → **Trame**
- **L1 Physique** (Fibre, Ethernet, Wi-Fi) → **Bits (0/1)**

## 3. Types de réseaux (Échelles)
- **PAN** (1–10 m) : Bluetooth, NFC, USB
- **LAN / WLAN** (10–100 m) : Ethernet (Switch) / Wi-Fi
- **MAN** (1–50 km) : Boucle fibre d'une ville ou campus
- **WAN** (> 100 km) : Câbles sous-marins, 5G, Internet
- **VPN** : Tunnel chiffré privé au-dessus d'Internet

## 4. Cloud, Conteneurs & DevOps
- **On-Premise** : Tout géré sur site · **IaaS** : VM louées · **PaaS** : Code prêt à déployer · **SaaS** : Logiciel clé en main
- **Auto-Scaling & Multi-AZ** : Élasticité au pic + bascule Load Balancer sans coupure
- **Docker** : Conteneur léger (~1s, noyau partagé) vs VM lourde (~45s, OS complet)
- **CI/CD** : Git Commit → Tests auto → Build Docker → Blue/Green ou Canary + Rollback 1 clic

## 5. Cryptographie, Wireshark/tcpdump & Azure Monitor
- **Symétrique (AES)** : 1 clé rapide · **Asymétrique** : Clé publique/privée · **Hachage + sel** : Mots de passe irréversibles
- **tcpdump & Wireshark** : \`sudo tcpdump -i eth0 -nn port 443 -w audit.pcap\` · Filtres Wireshark : \`dns\`, \`http\`, \`tcp.port == 23\`, \`Follow TCP Stream\`
- **Windows Azure Monitor** : Agent **AMA + DCR** → **Metrics** (temps réel) & **Log Analytics (KQL)** (\`Event | where EventID == 4625 | summarize count() by Computer\`) + **App Insights** & **Action Groups**
- **Débit réel & CLI** : \`1 octet = 8 bits\` · \`ping\`, \`nslookup\`, \`traceroute\`, \`netstat\`, \`curl\`

## 6. Entreprise & Architecture Moderne (AD, SOC, Kubernetes, VPN)
- **Active Directory & Kerberos** : Forêt → Domaine → OU · **KDC (port 88)** délivre **TGT + TGS** (SSO, NTP < 5 min) · **GPO** (ordre LSDOU) · **Tiering (T0/T1/T2)**
- **SOC, SIEM & SOAR** : Ingestion multi-sources → Corrélation KQL → Triage N1 (Faux/Vrai Positif) → **MITRE ATT&CK** → Confinement **SOAR/EDR**
- **Kubernetes** : **Control Plane** + Worker Nodes · **Pod** (IP éphémère) · **Deployment** (Self-Healing) · **Service** (IP/DNS stable) · **Ingress** (HTTPS) · **NetworkPolicy** (Zero Trust)
- **VPN, WireGuard & NAT** : **NAT/PAT** (IP privée ↔ IP publique) · **WireGuard** (UDP 51820) vs **IPSec** (IKEv2/ESP) · **Full Tunnel** obligatoire sur Wi-Fi public
`;

export const CheatsheetModal: React.FC<CheatsheetModalProps> = ({ isOpen, onClose }) => {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownloadMd = () => {
    playSuccess();
    const blob = new Blob([CHEATSHEET_MD], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'antiseche-a4-cyberland-reseaux-cloud.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cheatsheet-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 my-auto shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-sky-700 dark:text-sky-400" />
            <div>
              <h2
                id="cheatsheet-title"
                className="font-display text-xl font-bold text-slate-900 dark:text-slate-100"
              >
                Antisèche 1 page A4 — Réseaux, Cloud &amp; Cyber
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fiche mémo synthétique de révision · Prête à imprimer ou exporter
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            aria-label="Fermer"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Structured A4-style 2-column summary sheet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-display text-sm font-bold text-sky-800 dark:text-sky-400">
              1. Ports &amp; Protocoles clés
            </h3>
            <ul className="space-y-1 text-slate-700 dark:text-slate-300 font-mono">
              <li>22 · SSH (Admin chiffré · VPN)</li>
              <li className="text-red-700 dark:text-red-400">23 · Telnet (En clair · BLOQUER)</li>
              <li>53 · DNS (Annuaire Nom → IP)</li>
              <li>80 · HTTP (Web clair → 301 HTTPS)</li>
              <li className="text-emerald-700 dark:text-emerald-400">443 · HTTPS / TLS (Web chiffré)</li>
            </ul>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
              <strong>TCP</strong> = fiable avec ACK · <strong>UDP</strong> = temps réel (visio, jeu).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-display text-sm font-bold text-sky-800 dark:text-sky-400">
              2. Modèle OSI (L7 → L1) &amp; Encapsulation
            </h3>
            <ul className="space-y-1 text-slate-700 dark:text-slate-300">
              <li><strong className="font-mono">L7–L5</strong> Application / TLS / Session → <em>Données</em></li>
              <li><strong className="font-mono">L4</strong> Transport (TCP/UDP, Ports) → <em>Segment</em></li>
              <li><strong className="font-mono">L3</strong> Réseau (IP · Routeur) → <em>Paquet</em></li>
              <li><strong className="font-mono">L2</strong> Liaison (MAC · Switch) → <em>Trame</em></li>
              <li><strong className="font-mono">L1</strong> Physique (Fibre, Ethernet, Wi-Fi) → <em>Bits 0/1</em></li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-display text-sm font-bold text-sky-800 dark:text-sky-400">
              3. Types de réseaux &amp; Adressage
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>PAN</strong> (1–10 m, Bluetooth) → <strong>LAN / WLAN</strong> (10–100 m,
              Ethernet/Wi-Fi) → <strong>MAN</strong> (1–50 km, Ville) → <strong>WAN</strong> (&gt;100 km,
              Internet) + <strong>VPN</strong> (tunnel chiffré).
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              <strong>DHCP (DORA)</strong> attribue l&apos;IP locale · <strong>NAT</strong> partage
              1 IP publique · <span className="font-mono">1 octet = 8 bits</span> (Mbit/s ÷ 8 = Mo/s).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-display text-sm font-bold text-sky-800 dark:text-sky-400">
              4. Cloud, Docker &amp; CI/CD DevOps
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Pizzeria :</strong> On-Premise (maison) · <strong>IaaS</strong> (cuisine
              louée) · <strong>PaaS</strong> (four livré) · <strong>SaaS</strong> (restaurant).
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              <strong>Docker :</strong> noyau partagé (~1 s) vs VM (OS complet ~45 s).{' '}
              <strong>CI/CD :</strong> Tests auto → Blue/Green / Canary → Rollback 1 clic.
            </p>
          </div>

          <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-display text-sm font-bold text-sky-800 dark:text-sky-400">
                5. Cryptographie, Wireshark/tcpdump &amp; Windows Azure Monitor
              </h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>Crypto :</strong> AES (symétrique) · Publique/Privée · Hachage+sel ·{' '}
                <strong>Wireshark/tcpdump :</strong> BPF (capture) vs Display Filter (analyse .pcap) ·{' '}
                <strong>Azure Monitor :</strong> AMA + DCR → Metrics, KQL (EventID 4625), App Insights &amp; Action Groups.
              </p>
            </div>
            <div className="font-mono text-[11px] bg-slate-900 text-sky-300 rounded-lg px-3.5 py-2.5 shrink-0 space-y-0.5">
              <p>tcpdump -i eth0 -nn -w a.pcap</p>
              <p>Event | where EventID == 4625</p>
            </div>
          </div>

          <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <h3 className="font-display text-sm font-bold text-sky-800 dark:text-sky-400">
              6. Active Directory, SOC/SIEM, Kubernetes &amp; VPN/WireGuard
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Active Directory :</strong> KDC Kerberos (88, TGT/TGS), GPO (LSDOU), Tiering T0/T1/T2 ·{' '}
              <strong>SOC :</strong> SIEM + Triage N1 + MITRE ATT&amp;CK + Playbook SOAR/EDR ·{' '}
              <strong>Kubernetes :</strong> Pod → Deployment (Self-Healing) → Service (ClusterIP) → Ingress TLS &amp; NetworkPolicy ·{' '}
              <strong>VPN :</strong> WireGuard (UDP 51820) vs IPSec, Full Tunnel sur Wi-Fi public.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              playClick();
              window.print();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimer / PDF (A4)
          </button>
          <button
            type="button"
            onClick={handleDownloadMd}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
          >
            {downloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {downloaded ? 'Antisèche téléchargée (.md)' : 'Télécharger le mémo (.md)'}
          </button>
        </div>
      </div>
    </div>
  );
};
