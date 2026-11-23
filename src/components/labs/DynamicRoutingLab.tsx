import React, { useMemo, useState } from 'react';
import { GitBranch, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { playClick, playError, playSuccess } from '../../utils/sound';

interface RouterNode {
  id: string;
  label: string;
  role: string;
  x: number;
  y: number;
}

interface CableEdge {
  id: string;
  from: string;
  to: string;
  costMs: number;
  label: string;
}

const ROUTERS: RouterNode[] = [
  { id: 'R1', label: 'R1 · Village', role: 'Source', x: 75, y: 150 },
  { id: 'R2', label: 'R2 · Phare Nord', role: 'Transit', x: 240, y: 65 },
  { id: 'R3', label: 'R3 · Port Sud', role: 'Transit', x: 240, y: 235 },
  { id: 'R4', label: 'R4 · Forteresse', role: 'Cœur', x: 415, y: 95 },
  { id: 'R5', label: 'R5 · Atoll Est', role: 'Secours', x: 415, y: 220 },
  { id: 'R6', label: 'R6 · Nuage Céleste', role: 'Destination', x: 565, y: 150 },
];

const CABLES: CableEdge[] = [
  { id: 'e12', from: 'R1', to: 'R2', costMs: 6, label: 'Fibre Nord' },
  { id: 'e13', from: 'R1', to: 'R3', costMs: 11, label: 'Câble Sud' },
  { id: 'e23', from: 'R2', to: 'R3', costMs: 7, label: 'Liaison Baie' },
  { id: 'e24', from: 'R2', to: 'R4', costMs: 8, label: 'Fibre Directe' },
  { id: 'e35', from: 'R3', to: 'R5', costMs: 9, label: 'Câble Corail' },
  { id: 'e45', from: 'R4', to: 'R5', costMs: 5, label: 'Pont Est' },
  { id: 'e46', from: 'R4', to: 'R6', costMs: 6, label: 'Lien Principal' },
  { id: 'e56', from: 'R5', to: 'R6', costMs: 10, label: 'Lien Secours' },
];

interface DijkstraResult {
  pathNodes: string[];
  pathEdgeIds: string[];
  totalCost: number | null;
  distances: Record<string, number>;
  nextHopFromR1: Record<string, string>;
}

function computeDijkstra(cutEdgeIds: string[]): DijkstraResult {
  const activeEdges = CABLES.filter((e) => !cutEdgeIds.includes(e.id));
  const dist: Record<string, number> = {};
  const prevNode: Record<string, string | null> = {};
  const prevEdge: Record<string, string | null> = {};
  const unvisited = new Set(ROUTERS.map((r) => r.id));

  for (const r of ROUTERS) {
    dist[r.id] = Infinity;
    prevNode[r.id] = null;
    prevEdge[r.id] = null;
  }
  dist['R1'] = 0;

  while (unvisited.size > 0) {
    let closest: string | null = null;
    let minVal = Infinity;
    for (const id of unvisited) {
      if (dist[id] < minVal) {
        minVal = dist[id];
        closest = id;
      }
    }
    if (closest === null) break;
    unvisited.delete(closest);

    for (const edge of activeEdges) {
      let neighbor: string | null = null;
      if (edge.from === closest) neighbor = edge.to;
      else if (edge.to === closest) neighbor = edge.from;
      if (!neighbor || !unvisited.has(neighbor)) continue;

      const candidate = dist[closest] + edge.costMs;
      if (candidate < dist[neighbor]) {
        dist[neighbor] = candidate;
        prevNode[neighbor] = closest;
        prevEdge[neighbor] = edge.id;
      }
    }
  }

  const nextHopFromR1: Record<string, string> = {};
  for (const r of ROUTERS) {
    if (r.id === 'R1') {
      nextHopFromR1[r.id] = 'Local';
      continue;
    }
    if (!Number.isFinite(dist[r.id])) {
      nextHopFromR1[r.id] = 'Injoignable';
      continue;
    }
    let cur = r.id;
    while (prevNode[cur] && prevNode[cur] !== 'R1') {
      cur = prevNode[cur]!;
    }
    nextHopFromR1[r.id] = cur;
  }

  if (!Number.isFinite(dist['R6'])) {
    return { pathNodes: [], pathEdgeIds: [], totalCost: null, distances: dist, nextHopFromR1 };
  }

  const pathNodes: string[] = [];
  const pathEdgeIds: string[] = [];
  let current: string | null = 'R6';
  while (current) {
    pathNodes.unshift(current);
    const pe = prevEdge[current];
    if (pe) pathEdgeIds.unshift(pe);
    current = prevNode[current];
  }

  return {
    pathNodes,
    pathEdgeIds,
    totalCost: dist['R6'],
    distances: dist,
    nextHopFromR1,
  };
}

export const DynamicRoutingLab: React.FC = () => {
  const [cutEdges, setCutEdges] = useState<string[]>([]);
  const [lastEvent, setLastEvent] = useState<string>(
    'Topologie nominale : OSPF sélectionne le chemin le plus court (20 ms) via R1 → R2 → R4 → R6.'
  );

  const result = useMemo(() => computeDijkstra(cutEdges), [cutEdges]);

  const toggleCable = (edge: CableEdge) => {
    const willCut = !cutEdges.includes(edge.id);
    const nextCut = willCut ? [...cutEdges, edge.id] : cutEdges.filter((id) => id !== edge.id);
    const nextResult = computeDijkstra(nextCut);

    setCutEdges(nextCut);

    if (willCut) {
      if (nextResult.totalCost === null) {
        playError();
        setLastEvent(
          `Coupure de "${edge.label}" (${edge.from}-${edge.to}) : aucun chemin de secours disponible vers R6 !`
        );
      } else {
        playClick();
        setLastEvent(
          `Coupure de "${edge.label}" : convergence OSPF immédiate → nouveau chemin ${nextResult.pathNodes.join(
            ' → '
          )} (${nextResult.totalCost} ms).`
        );
      }
    } else {
      playSuccess();
      setLastEvent(
        `Câble "${edge.label}" réparé : table de routage mise à jour → chemin optimal ${nextResult.pathNodes.join(
          ' → '
        )} (${nextResult.totalCost} ms).`
      );
    }
  };

  const handleReset = () => {
    playClick();
    setCutEdges([]);
    setLastEvent(
      'Tous les câbles sous-marins sont rétablis : chemin optimal R1 → R2 → R4 → R6 (20 ms).'
    );
  };

  const getRouter = (id: string) => ROUTERS.find((r) => r.id === id)!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Interactive Topology Canvas */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
              Routage dynamique OSPF / BGP · Algorithme de Dijkstra
            </p>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Cliquez sur un câble sous-marin pour simuler une panne
            </h2>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Tout réparer
          </button>
        </div>

        {/* SVG Graph */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F8FC] dark:bg-slate-800/70 p-3">
          <svg
            viewBox="0 0 640 300"
            className="w-full h-auto select-none"
            role="img"
            aria-label="Graphe interactif des 6 routeurs de Cyberland"
          >
            {/* Submarine cables */}
            {CABLES.map((edge) => {
              const a = getRouter(edge.from);
              const b = getRouter(edge.to);
              const isCut = cutEdges.includes(edge.id);
              const isOptimal = result.pathEdgeIds.includes(edge.id);
              const midX = (a.x + b.x) / 2;
              const midY = (a.y + b.y) / 2;

              return (
                <g
                  key={edge.id}
                  onClick={() => toggleCable(edge)}
                  className="cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  aria-label={`${edge.label} entre ${edge.from} et ${edge.to}, ${edge.costMs} millisecondes, ${
                    isCut ? 'coupé, cliquer pour réparer' : 'actif, cliquer pour couper'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCable(edge);
                    }
                  }}
                >
                  {/* Wide invisible hit target */}
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth="20" />
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={isCut ? '#DC2626' : isOptimal ? '#059669' : '#94A3B8'}
                    strokeWidth={isOptimal ? '5' : isCut ? '2.5' : '3'}
                    strokeDasharray={isCut ? '6 6' : 'none'}
                  />
                  {/* Cost label chip */}
                  <rect
                    x={midX - 28}
                    y={midY - 12}
                    width="56"
                    height="24"
                    rx="6"
                    fill={isCut ? '#FEE2E2' : isOptimal ? '#ECFDF5' : '#FFFFFF'}
                    stroke={isCut ? '#DC2626' : isOptimal ? '#059669' : '#CBD5E1'}
                    strokeWidth="1.5"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    textAnchor="middle"
                    className={`text-[10px] font-mono font-bold ${
                      isCut ? 'fill-red-700' : isOptimal ? 'fill-emerald-800' : 'fill-slate-700'
                    }`}
                  >
                    {isCut ? 'COUPÉ' : `${edge.costMs} ms`}
                  </text>
                </g>
              );
            })}

            {/* Router Nodes */}
            {ROUTERS.map((node) => {
              const onPath = result.pathNodes.includes(node.id);
              const isEndpoint = node.id === 'R1' || node.id === 'R6';
              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <circle
                    r={isEndpoint ? 28 : 23}
                    fill={isEndpoint ? '#0369A1' : onPath ? '#059669' : '#FFFFFF'}
                    stroke={onPath || isEndpoint ? '#0F172A' : '#64748B'}
                    strokeWidth="2.5"
                  />
                  <text
                    y="-2"
                    textAnchor="middle"
                    className={`text-[11px] font-mono font-bold ${
                      isEndpoint || onPath ? 'fill-white' : 'fill-slate-900'
                    }`}
                  >
                    {node.id}
                  </text>
                  <text
                    y="11"
                    textAnchor="middle"
                    className={`text-[8px] font-medium ${
                      isEndpoint || onPath ? 'fill-sky-100' : 'fill-slate-500'
                    }`}
                  >
                    {node.role}
                  </text>
                  <text
                    y={isEndpoint ? 43 : 38}
                    textAnchor="middle"
                    className="fill-slate-800 dark:fill-slate-200 text-[10px] font-semibold"
                  >
                    {node.label.replace(/^R\d\s·\s/, '')}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Convergence Status Banner */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs sm:text-sm ${
            result.totalCost === null
              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
          }`}
        >
          {result.totalCost === null ? (
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-semibold">{lastEvent}</p>
            <p className="text-xs opacity-90">
              {cutEdges.length} câble(s) coupé(s) ·{' '}
              {result.totalCost !== null
                ? `Latence bout-en-bout : ${result.totalCost} ms (${result.pathNodes.length - 1} sauts)`
                : 'Destination R6 isolée — réparez au moins un lien critique.'}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Live Routing Table of R1 */}
      <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <GitBranch className="w-4 h-4 text-sky-700 dark:text-sky-400" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Table calculée en direct</p>
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Table de routage de R1 (Village)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Cible</th>
                <th className="py-2.5 px-3 font-semibold">Prochain saut</th>
                <th className="py-2.5 px-3 font-semibold text-right">Coût</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
              {ROUTERS.filter((r) => r.id !== 'R1').map((r) => {
                const d = result.distances[r.id];
                const reachable = Number.isFinite(d);
                return (
                  <tr
                    key={r.id}
                    className={
                      r.id === 'R6' ? 'bg-sky-50/70 dark:bg-sky-950/40 font-semibold' : ''
                    }
                  >
                    <td className="py-2.5 px-3 text-slate-900 dark:text-slate-100">{r.id}</td>
                    <td
                      className={`py-2.5 px-3 ${
                        reachable
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {result.nextHopFromR1[r.id]}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {reachable ? `${d} ms` : '∞'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            Pourquoi Internet résiste aux coupures ?
          </p>
          <p>
            Les routeurs échangent l&apos;état de leurs liaisons (OSPF au sein d&apos;un réseau, BGP
            entre opérateurs). Dès qu&apos;un câble casse, chacun recalcule sa table de routage vers
            le meilleur chemin de secours.
          </p>
        </div>
      </aside>
    </div>
  );
};
