import React, { useState } from 'react';
import { Laptop, Smartphone, Tv, Router, Send, RotateCcw, Globe } from 'lucide-react';
import { playClick, playPacket, playSuccess } from '../../utils/sound';

interface LanDevice {
  id: string;
  name: string;
  mac: string;
  assignedIp: string | null;
  doraStep: number; // 0=none, 1=Discover, 2=Offer, 3=Request, 4=Ack
}

interface NatEntry {
  id: number;
  deviceName: string;
  privateSrc: string;
  publicMapped: string;
  destination: string;
}

const PUBLIC_BOX_IP = '82.64.119.42';

const INITIAL_DEVICES: LanDevice[] = [
  { id: 'laptop', name: 'PC Portable', mac: 'A4:5E:60:11:02:B1', assignedIp: '192.168.1.10', doraStep: 4 },
  { id: 'phone', name: 'Smartphone', mac: 'B8:27:EB:44:91:C2', assignedIp: null, doraStep: 0 },
  { id: 'tv', name: 'TV Connectée', mac: 'D0:50:99:78:3A:F0', assignedIp: null, doraStep: 0 },
];

const IP_POOL: Record<string, string> = {
  laptop: '192.168.1.10',
  phone: '192.168.1.11',
  tv: '192.168.1.12',
};

const DORA_LABELS = [
  'Non connecté',
  '1. DISCOVER — « Y a-t-il un serveur DHCP ? »',
  '2. OFFER — « Je te propose une IP libre »',
  '3. REQUEST — « J’accepte cette adresse ! »',
  '4. ACK — Bail confirmé (24h)',
];

export const DhcpNatLab: React.FC = () => {
  const [devices, setDevices] = useState<LanDevice[]>(INITIAL_DEVICES);
  const [natTable, setNatTable] = useState<NatEntry[]>([
    {
      id: 1,
      deviceName: 'PC Portable',
      privateSrc: '192.168.1.10:51420',
      publicMapped: `${PUBLIC_BOX_IP}:40101`,
      destination: 'meteo.cyberland.gem:443',
    },
  ]);
  const [nextPort, setNextPort] = useState(40102);
  const [lastLog, setLastLog] = useState(
    'La Box Cyberland possède 1 seule IP publique (82.64.119.42) et distribue des IP privées 192.168.1.x en local.'
  );

  const advanceDhcp = (deviceId: string) => {
    const target = devices.find((d) => d.id === deviceId);
    if (!target || target.doraStep >= 4) return;
    const nextStep = target.doraStep + 1;
    if (nextStep === 4) {
      playSuccess();
    } else {
      playPacket();
    }
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              doraStep: nextStep,
              assignedIp: nextStep === 4 ? IP_POOL[deviceId] : d.assignedIp,
            }
          : d
      )
    );
    setLastLog(`${target.name} → ${DORA_LABELS[nextStep]}${nextStep === 4 ? ` (${IP_POOL[deviceId]})` : ''}`);
  };

  const sendNatTraffic = (device: LanDevice) => {
    if (!device.assignedIp) return;
    playPacket();
    const localPort = 51000 + Math.floor(Math.random() * 8000);
    const mappedPort = nextPort;
    setNextPort((p) => p + 1);
    const destinations = ['cloud.cyberland.gem:443', 'video.cyberland.gem:443', 'cartes.cyberland.gem:443'];
    const dest = destinations[mappedPort % destinations.length];

    const entry: NatEntry = {
      id: Date.now(),
      deviceName: device.name,
      privateSrc: `${device.assignedIp}:${localPort}`,
      publicMapped: `${PUBLIC_BOX_IP}:${mappedPort}`,
      destination: dest,
    };
    setNatTable((prev) => [entry, ...prev.slice(0, 5)]);
    setLastLog(
      `NAT/PAT : ${entry.privateSrc} réécrit en ${entry.publicMapped} vers ${dest} pour sortir sur Internet !`
    );
  };

  const handleReset = () => {
    playClick();
    setDevices(INITIAL_DEVICES);
    setNatTable([
      {
        id: 1,
        deviceName: 'PC Portable',
        privateSrc: '192.168.1.10:51420',
        publicMapped: `${PUBLIC_BOX_IP}:40101`,
        destination: 'meteo.cyberland.gem:443',
      },
    ]);
    setNextPort(40102);
    setLastLog('Box réinitialisée. Connectez le Smartphone et la TV via DHCP (DORA) puis testez le NAT.');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Home LAN & DHCP DORA */}
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
                Étape 1 · Attribution automatique d&apos;IP locales (DORA)
              </p>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                Réseau local (LAN 192.168.1.0/24)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
          </div>

          <div className="space-y-3">
            {devices.map((dev) => {
              const Icon = dev.id === 'laptop' ? Laptop : dev.id === 'phone' ? Smartphone : Tv;
              const ready = dev.doraStep === 4;
              return (
                <div
                  key={dev.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-5 h-5 text-sky-700 dark:text-sky-400" />
                      <div>
                        <p className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                          {dev.name}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          MAC {dev.mac}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-mono text-xs font-bold tabular-nums ${
                        ready
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {dev.assignedIp ?? 'Sans IP'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {DORA_LABELS[dev.doraStep]}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {!ready ? (
                      <button
                        type="button"
                        onClick={() => advanceDhcp(dev.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
                      >
                        {dev.doraStep === 0
                          ? '1. Envoyer DHCP Discover'
                          : dev.doraStep === 1
                          ? '2. Recevoir DHCP Offer'
                          : dev.doraStep === 2
                          ? '3. Envoyer DHCP Request'
                          : '4. Confirmer DHCP Ack'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => sendNatTraffic(dev)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Envoyer requête HTTPS sur Internet (NAT)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: Box NAT/PAT Translation Table */}
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
                Étape 2 · Traduction d&apos;adresses &amp; de ports (NAT / PAT)
              </p>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                Box Routeur Cyberland
              </h2>
            </div>
            <div className="text-right font-mono text-xs">
              <p className="text-slate-500 dark:text-slate-400">IP Publique unique (WAN)</p>
              <p className="font-bold text-sky-700 dark:text-sky-400 tabular-nums">{PUBLIC_BOX_IP}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs flex items-center gap-2.5">
            <Router className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="leading-relaxed">{lastLog}</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Appareil</th>
                  <th className="py-2.5 px-3 font-semibold">IP Privée : Port</th>
                  <th className="py-2.5 px-3 font-semibold">IP Publique : Port NAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
                {natTable.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-slate-100">
                      {row.deviceName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {row.privateSrc}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400 font-semibold">
                      {row.publicMapped}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-950 dark:text-sky-200 space-y-1.5 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              Pourquoi le NAT a sauvé IPv4 ?
            </p>
            <p>
              Les adresses privées (<span className="font-mono">192.168.x.x</span>) ne sont pas
              routables sur Internet. La Box remplace l&apos;IP privée par son unique IP publique et
              mémorise un <strong>numéro de port unique</strong> dans sa table NAT pour renvoyer
              chaque réponse au bon appareil de la maison.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
