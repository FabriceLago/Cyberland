import React, { useMemo, useState } from 'react';
import { CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { playClick } from '../../utils/sound';

type CidrPrefix = 8 | 16 | 24;

function toBinary8(n: number): string {
  const clamped = Math.max(0, Math.min(255, Math.floor(n || 0)));
  return clamped.toString(2).padStart(8, '0');
}

export const IpSubnetLab: React.FC = () => {
  const [ipA, setIpA] = useState<[number, number, number, number]>([192, 168, 1, 42]);
  const [ipB, setIpB] = useState<[number, number, number, number]>([192, 168, 1, 88]);
  const [cidr, setCidr] = useState<CidrPrefix>(24);

  const networkOctetsCount = cidr / 8; // 1, 2, or 3

  const analysis = useMemo(() => {
    const maskOctets = [0, 1, 2, 3].map((idx) => (idx < networkOctetsCount ? 255 : 0));
    const networkAddr = ipA.map((val, idx) => (idx < networkOctetsCount ? val : 0));
    const broadcastAddr = ipA.map((val, idx) => (idx < networkOctetsCount ? val : 255));
    const usableHosts = Math.pow(2, 32 - cidr) - 2;

    const sameSubnet = [0, 1, 2, 3].every((idx) =>
      idx < networkOctetsCount ? ipA[idx] === ipB[idx] : true
    );

    return {
      maskStr: maskOctets.join('.'),
      networkStr: networkAddr.join('.'),
      broadcastStr: broadcastAddr.join('.'),
      usableHosts,
      sameSubnet,
    };
  }, [ipA, ipB, cidr, networkOctetsCount]);

  const updateOctet = (
    setter: React.Dispatch<React.SetStateAction<[number, number, number, number]>>,
    idx: number,
    value: string
  ) => {
    const num = Math.max(0, Math.min(255, Number.parseInt(value, 10) || 0));
    setter((prev) => {
      const next = [...prev] as [number, number, number, number];
      next[idx] = num;
      return next;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 65% Binary & Network Visualization */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-semibold">
            Calculateur visuel IPv4 &amp; Sous-réseaux (Binaire / Décimal)
          </span>
          <span className="font-mono text-xs text-sky-200 tabular-nums">
            {ipA.join('.')}/{cidr}
          </span>
        </div>

        <div className="p-6 bg-[#EEF5FA] dark:bg-slate-950/60 space-y-6">
          {/* 4 Octet Visual Breakdown */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Décomposition des 32 bits de Machine A ({ipA.join('.')})
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Bleu = Partie Réseau ({cidr} bits) · Ambre = Partie Hôte ({32 - cidr} bits)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ipA.map((octet, idx) => {
                const isNetwork = idx < networkOctetsCount;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 text-center space-y-1.5 ${
                      isNetwork
                        ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-950 dark:text-sky-100'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-100'
                    }`}
                  >
                    <p className="text-[11px] font-semibold">
                      Octet {idx + 1} · {isNetwork ? 'RÉSEAU' : 'HÔTE'}
                    </p>
                    <p className="font-mono text-2xl font-bold tabular-nums">{octet}</p>
                    <p className="font-mono text-xs tracking-wider opacity-90">
                      {toBinary8(octet)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calculated Properties Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Masque de sous-réseau</p>
              <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                {analysis.maskStr}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Adresse du réseau</p>
              <p className="font-mono text-sm font-bold text-sky-800 dark:text-sky-400 mt-1 tabular-nums">
                {analysis.networkStr}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Adresse de diffusion</p>
              <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                {analysis.broadcastStr}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Machines possibles</p>
              <p className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
                {analysis.usableHosts.toLocaleString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Comparison Verdict A vs B */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${
              analysis.sameSubnet
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100'
            }`}
          >
            {analysis.sameSubnet ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <ArrowLeftRight className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="font-bold">
                {analysis.sameSubnet
                  ? `Même sous-réseau (/${cidr}) : communication directe en LAN !`
                  : `Sous-réseaux différents (/${cidr}) : passage par un Routeur obligatoire !`}
              </p>
              <p className="text-xs opacity-90">
                Machine A (<span className="font-mono">{ipA.join('.')}</span>) et Machine B (
                <span className="font-mono">{ipB.join('.')}</span>){' '}
                {analysis.sameSubnet
                  ? 'partagent le même préfixe réseau.'
                  : 'ont des préfixes réseau différents : le phare-routeur doit relayer les paquets.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right 35% Controls */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            Manipuler les adresses
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Changez le masque CIDR ou les octets pour tester si deux îles sont sur le même LAN.
          </p>
        </div>

        {/* CIDR selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Masque de sous-réseau (CIDR)
          </p>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {([8, 16, 24] as CidrPrefix[]).map((prefix) => (
              <button
                key={prefix}
                type="button"
                onClick={() => {
                  playClick();
                  setCidr(prefix);
                }}
                className={`py-2 text-xs font-mono font-semibold rounded-md transition-colors ${
                  cidr === prefix
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                /{prefix}
              </button>
            ))}
          </div>
        </div>

        {/* IP A inputs */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Adresse IP — Machine A
          </p>
          <div className="grid grid-cols-4 gap-2">
            {ipA.map((val, idx) => (
              <input
                key={`a-${idx}`}
                type="number"
                min={0}
                max={255}
                aria-label={`Machine A octet ${idx + 1}`}
                value={val}
                onChange={(e) => updateOctet(setIpA, idx, e.target.value)}
                className="w-full px-2 py-2 text-center font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
              />
            ))}
          </div>
        </div>

        {/* IP B inputs */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Adresse IP — Machine B (à comparer)
          </p>
          <div className="grid grid-cols-4 gap-2">
            {ipB.map((val, idx) => (
              <input
                key={`b-${idx}`}
                type="number"
                min={0}
                max={255}
                aria-label={`Machine B octet ${idx + 1}`}
                value={val}
                onChange={(e) => updateOctet(setIpB, idx, e.target.value)}
                className="w-full px-2 py-2 text-center font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
              />
            ))}
          </div>
        </div>

        {/* Quick presets */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Exemples rapides Cyberland
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                playClick();
                setIpA([192, 168, 1, 42]);
                setIpB([192, 168, 1, 88]);
                setCidr(24);
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md"
            >
              Même village (/24)
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setIpA([192, 168, 1, 42]);
                setIpB([192, 168, 2, 15]);
                setCidr(24);
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md"
            >
              2 sous-réseaux (/24)
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setIpA([10, 0, 1, 14]);
                setIpB([10, 0, 8, 3]);
                setCidr(16);
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md"
            >
              Port Nord (/16)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
