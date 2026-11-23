import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Zap,
  RotateCcw,
  ShieldCheck,
  Server,
  Cloud,
  Database,
  Globe,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface CloudBlock {
  id:
    | 'dnsRedundant'
    | 'cdn'
    | 'waf'
    | 'loadBalancer'
    | 'zoneA'
    | 'zoneB'
    | 'dbReplicated';
  label: string;
  role: string;
  cost: number;
  required?: boolean;
}

const BLOCKS: CloudBlock[] = [
  {
    id: 'dnsRedundant',
    label: 'DNS redondant',
    role: 'Résolution garantie même si un serveur DNS tombe',
    cost: 15,
  },
  {
    id: 'cdn',
    label: 'Cache CDN en bordure',
    role: 'Absorbe les pics de lecture et réduit la latence',
    cost: 25,
  },
  {
    id: 'waf',
    label: 'Pare-feu applicatif (WAF)',
    role: 'Bloque le port 23, les injections SQL et botnets',
    cost: 20,
  },
  {
    id: 'loadBalancer',
    label: 'Load Balancer',
    role: 'Répartit les requêtes et bascule hors panne',
    cost: 25,
  },
  {
    id: 'zoneA',
    label: 'Serveurs Zone A (Île Est)',
    role: 'Capacité principale de calcul',
    cost: 40,
    required: true,
  },
  {
    id: 'zoneB',
    label: 'Serveurs Zone B (Île Ouest)',
    role: 'Redondance physique indépendante (Multi-AZ)',
    cost: 40,
  },
  {
    id: 'dbReplicated',
    label: 'Base répliquée + Snapshots',
    role: 'Copie synchrone hors Zone A pour zéro perte',
    cost: 35,
  },
];

interface ChaosDrill {
  name: string;
  passed: boolean;
  detail: string;
}

export const CloudArchitectLab: React.FC = () => {
  const [enabled, setEnabled] = useState<Record<CloudBlock['id'], boolean>>({
    dnsRedundant: false,
    cdn: false,
    waf: true,
    loadBalancer: false,
    zoneA: true,
    zoneB: false,
    dbReplicated: false,
  });
  const [tested, setTested] = useState(false);

  const monthlyCost = useMemo(
    () => BLOCKS.reduce((sum, b) => sum + (enabled[b.id] ? b.cost : 0), 0),
    [enabled]
  );

  const drills: ChaosDrill[] = useMemo(() => {
    const zoneAFailoverOk = enabled.loadBalancer && enabled.zoneB;
    const peakOk = enabled.cdn || (enabled.loadBalancer && enabled.zoneA && enabled.zoneB);
    const securityOk = enabled.waf;
    const dataOk = enabled.dbReplicated && enabled.dnsRedundant;

    return [
      {
        name: '1. Tempête sur la Zone A (Panne centre de données)',
        passed: zoneAFailoverOk,
        detail: zoneAFailoverOk
          ? 'Réussi : le Load Balancer bascule immédiatement 100 % du trafic sur la Zone B.'
          : 'SPOF détecté : sans Load Balancer + Zone B, tout le site tombe hors ligne.',
      },
      {
        name: '2. Vague touristique x5 (Pic de charge soudain)',
        passed: peakOk,
        detail: peakOk
          ? 'Réussi : le cache CDN et/ou la répartition multi-zones absorbent la vague.'
          : 'Surcharge : un seul groupe de serveurs sans CDN sature dès le pic.',
      },
      {
        name: '3. Intrusion port 23 & injection SQL',
        passed: securityOk,
        detail: securityOk
          ? 'Réussi : le pare-feu WAF filtre les requêtes malveillantes avant vos serveurs.'
          : 'Faille critique : activez un Pare-feu WAF devant votre infrastructure.',
      },
      {
        name: '4. Panne DNS & disque principal Zone A',
        passed: dataOk,
        detail: dataOk
          ? 'Réussi : DNS redondant + base répliquée maintiennent l’accès et l’intégrité.'
          : 'Risque de perte : combinez DNS redondant et Base répliquée hors Zone A.',
      },
    ];
  }, [enabled]);

  const passedCount = drills.filter((d) => d.passed).length;

  const toggleBlock = (block: CloudBlock) => {
    if (block.required) return;
    playClick();
    setTested(false);
    setEnabled((prev) => ({ ...prev, [block.id]: !prev[block.id] }));
  };

  const runChaosTest = () => {
    setTested(true);
    if (passedCount === drills.length) {
      playVictory();
    } else if (passedCount >= 2) {
      playSuccess();
    } else {
      playError();
    }
  };

  const resetArch = () => {
    playClick();
    setTested(false);
    setEnabled({
      dnsRedundant: false,
      cdn: false,
      waf: false,
      loadBalancer: false,
      zoneA: true,
      zoneB: false,
      dbReplicated: false,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 65% Architecture Blueprint & Chaos Report */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-semibold">
            Atelier Architecte Cloud · Test de Tempête (Chaos Engineering)
          </span>
          <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
            <span>
              Coût : <strong className="text-sky-200">{monthlyCost} or/mois</strong>
            </span>
            <span>
              Résilience :{' '}
              <strong className={passedCount === 4 ? 'text-emerald-300' : 'text-amber-300'}>
                {tested ? `${passedCount}/4 tests` : 'Non testée'}
              </strong>
            </span>
          </div>
        </div>

        <div className="p-6 bg-[#EEF5FA] dark:bg-slate-950/60 space-y-5">
          {/* Interactive Visual Architecture Blueprint */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-stretch">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Globe className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                Entrée &amp; DNS
              </div>
              <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                {enabled.dnsRedundant ? 'DNS Redondant ✓' : 'DNS unique (SPOF)'}
              </p>
              <p className="text-[11px] font-mono text-sky-700 dark:text-sky-400">
                {enabled.cdn ? 'Cache CDN actif ✓' : 'Sans CDN'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                Sécurité &amp; Tri
              </div>
              <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                {enabled.waf ? 'Pare-feu WAF actif ✓' : 'WAF désactivé'}
              </p>
              <p className="text-[11px] font-mono text-sky-700 dark:text-sky-400">
                {enabled.loadBalancer ? 'Load Balancer ✓' : 'Routage direct Zone A'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Server className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                Zones de calcul
              </div>
              <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                Zone A (Est) : Active
              </p>
              <p
                className={`text-[11px] font-mono ${
                  enabled.zoneB
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {enabled.zoneB ? 'Zone B (Ouest) : Active ✓' : 'Zone B : Absente'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Database className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                Données
              </div>
              <p
                className={`text-[11px] font-mono ${
                  enabled.dbReplicated
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {enabled.dbReplicated ? 'Répliquée Multi-AZ ✓' : 'Disque unique Zone A'}
              </p>
            </div>
          </div>

          {/* Chaos Drill Results */}
          {tested ? (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rapport du Test de Tempête ({passedCount}/4 scénarios réussis)
              </p>
              {drills.map((d) => (
                <div
                  key={d.name}
                  className={`p-3.5 rounded-lg border flex items-start gap-3 text-xs ${
                    d.passed
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-950 dark:text-red-100'
                  }`}
                >
                  {d.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{d.name}</p>
                    <p className="opacity-90 mt-0.5">{d.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center space-y-2">
              <Cloud className="w-8 h-8 text-sky-700 dark:text-sky-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Assemblez vos briques à droite puis lancez le Test de Tempête
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                L&apos;audit automatique simulera une perte de Zone A, un pic x5, une attaque WAF et
                une panne de disque pour repérer chaque SPOF.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right 35% Building Blocks Selector */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            Briques d&apos;infrastructure
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Activez les composants nécessaires pour atteindre 4/4 au test de résilience.
          </p>
        </div>

        <div className="space-y-2">
          {BLOCKS.map((b) => {
            const active = enabled[b.id];
            return (
              <button
                key={b.id}
                type="button"
                disabled={b.required}
                onClick={() => toggleBlock(b)}
                className={`w-full text-left p-3 rounded-lg border transition-colors flex items-start justify-between gap-3 ${
                  active
                    ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-950 dark:text-sky-100'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                } ${b.required ? 'opacity-80 cursor-default' : ''}`}
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">
                    {active ? '✓ ' : '+ '}
                    {b.label}
                  </p>
                  <p className="text-[11px] opacity-80">{b.role}</p>
                </div>
                <span className="font-mono text-xs font-semibold shrink-0 tabular-nums">
                  {b.cost} or
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={runChaosTest}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
          >
            <Zap className="w-4 h-4" />
            Lancer le Test de Tempête
          </button>
          <button
            type="button"
            onClick={resetArch}
            aria-label="Réinitialiser l'architecture"
            className="p-2.5 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
