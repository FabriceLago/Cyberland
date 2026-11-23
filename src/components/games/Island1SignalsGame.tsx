import React, { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, Wifi, Cable, Zap, AlertTriangle } from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island1SignalsGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

type LinkKind = 'ethernet' | 'wifi' | 'fiber';

interface VillageNode {
  id: string;
  label: string;
  x: number;
  y: number;
  isRoot?: boolean;
}

interface CandidateEdge {
  id: string;
  from: string;
  to: string;
  hasRockInterference: boolean;
  isLongDistance: boolean;
  costs: Record<LinkKind, number>;
}

const BUDGET = 100;

const NODES: VillageNode[] = [
  { id: 'phare', label: 'Phare Central', x: 95, y: 155, isRoot: true },
  { id: 'cab1', label: 'Cabane Nord', x: 265, y: 65 },
  { id: 'cab2', label: 'Cabane Centre', x: 300, y: 235 },
  { id: 'cab3', label: 'Cabane Est', x: 510, y: 78 },
  { id: 'cab4', label: 'Cabane Sud', x: 525, y: 228 },
];

const EDGES: CandidateEdge[] = [
  {
    id: 'phare-cab1',
    from: 'phare',
    to: 'cab1',
    hasRockInterference: false,
    isLongDistance: false,
    costs: { ethernet: 25, wifi: 20, fiber: 35 },
  },
  {
    id: 'phare-cab2',
    from: 'phare',
    to: 'cab2',
    hasRockInterference: true,
    isLongDistance: false,
    costs: { ethernet: 25, wifi: 20, fiber: 35 },
  },
  {
    id: 'cab1-cab2',
    from: 'cab1',
    to: 'cab2',
    hasRockInterference: false,
    isLongDistance: false,
    costs: { ethernet: 20, wifi: 15, fiber: 30 },
  },
  {
    id: 'cab1-cab3',
    from: 'cab1',
    to: 'cab3',
    hasRockInterference: true,
    isLongDistance: true,
    costs: { ethernet: 40, wifi: 25, fiber: 30 },
  },
  {
    id: 'cab2-cab4',
    from: 'cab2',
    to: 'cab4',
    hasRockInterference: false,
    isLongDistance: true,
    costs: { ethernet: 35, wifi: 25, fiber: 30 },
  },
  {
    id: 'cab3-cab4',
    from: 'cab3',
    to: 'cab4',
    hasRockInterference: false,
    isLongDistance: false,
    costs: { ethernet: 20, wifi: 15, fiber: 30 },
  },
];

export const Island1SignalsGame: React.FC<Island1SignalsGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [selectedTool, setSelectedTool] = useState<LinkKind>('ethernet');
  const [placedLinks, setPlacedLinks] = useState<Record<string, LinkKind>>({});
  const [feedback, setFeedback] = useState<string>(
    'Choisissez un type de liaison puis cliquez sur les tracés pointillés pour relier les 4 cabanes au Phare.'
  );
  const [feedbackType, setFeedbackType] = useState<'info' | 'error' | 'success'>('info');
  const [won, setWon] = useState(isCompleted);

  const spent = useMemo(() => {
    return Object.entries(placedLinks).reduce((total, [edgeId, kind]) => {
      const edge = EDGES.find((e) => e.id === edgeId);
      return total + (edge ? edge.costs[kind] : 0);
    }, 0);
  }, [placedLinks]);

  const connectedNodes = useMemo(() => {
    const visited = new Set<string>(['phare']);
    const queue = ['phare'];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const edge of EDGES) {
        if (!placedLinks[edge.id]) continue;
        if (edge.from === curr && !visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push(edge.to);
        } else if (edge.to === curr && !visited.has(edge.from)) {
          visited.add(edge.from);
          queue.push(edge.from);
        }
      }
    }
    return visited;
  }, [placedLinks]);

  const connectedHutsCount = NODES.filter((n) => !n.isRoot && connectedNodes.has(n.id)).length;

  const handleToggleEdge = (edge: CandidateEdge) => {
    // If already placed, clicking removes it (refund)
    if (placedLinks[edge.id]) {
      playClick();
      const next = { ...placedLinks };
      delete next[edge.id];
      setPlacedLinks(next);
      setFeedback('Liaison retirée et budget remboursé.');
      setFeedbackType('info');
      return;
    }

    // Check rock interference for Wi-Fi
    if (selectedTool === 'wifi' && edge.hasRockInterference) {
      playError();
      setFeedback(
        'Interférence rocheuse détectée ! Les ondes Wi-Fi ne traversent pas ce mur volcanique : utilisez un câble Ethernet ou de la Fibre.'
      );
      setFeedbackType('error');
      return;
    }

    const cost = edge.costs[selectedTool];
    if (spent + cost > BUDGET) {
      playError();
      setFeedback(
        `Budget insuffisant (${BUDGET - spent} or restant pour un coût de ${cost} or). Retirez une liaison ou choisissez un support moins coûteux.`
      );
      setFeedbackType('error');
      return;
    }

    const next = { ...placedLinks, [edge.id]: selectedTool };
    setPlacedLinks(next);

    // Check win condition immediately
    const visited = new Set<string>(['phare']);
    const queue = ['phare'];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const e of EDGES) {
        if (!next[e.id]) continue;
        if (e.from === curr && !visited.has(e.to)) {
          visited.add(e.to);
          queue.push(e.to);
        } else if (e.to === curr && !visited.has(e.from)) {
          visited.add(e.from);
          queue.push(e.from);
        }
      }
    }

    const hutsOnline = NODES.filter((n) => !n.isRoot && visited.has(n.id)).length;
    if (hutsOnline === 4) {
      const totalSpent = spent + cost;
      const stars = totalSpent <= 80 ? 3 : totalSpent <= 90 ? 2 : 1;
      playVictory();
      setWon(true);
      setFeedback(
        `Bravo ! Les 4 cabanes sont reliées au Phare pour ${totalSpent} / ${BUDGET} pièces d'or (${stars}/3 étoiles).`
      );
      setFeedbackType('success');
      onComplete(stars);
    } else {
      playSuccess();
      setFeedback(
        `Liaison posée (${cost} or). ${hutsOnline}/4 cabanes connectées au réseau local.`
      );
      setFeedbackType('info');
    }
  };

  const handleReset = () => {
    playClick();
    setPlacedLinks({});
    setWon(false);
    setFeedback('Carte réinitialisée. Reliez les 4 cabanes au Phare en respectant le budget.');
    setFeedbackType('info');
  };

  const getNode = (id: string) => NODES.find((n) => n.id === id)!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 65% Interactive Village Topology */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-semibold">Mini-jeu · Connecte le village</span>
          <div className="flex items-center gap-5 text-xs font-mono tabular-nums">
            <span>
              Budget restant :{' '}
              <strong className={BUDGET - spent < 20 ? 'text-amber-300' : 'text-emerald-300'}>
                {BUDGET - spent} / {BUDGET} or
              </strong>
            </span>
            <span>
              Cabanes : <strong>{connectedHutsCount}/4</strong>
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-[#EEF5FA]">
          <svg
            viewBox="0 0 620 310"
            className="w-full h-auto select-none"
            role="img"
            aria-label="Carte interactive du village de l'Île des Signaux"
          >
            {/* Island land shape */}
            <path
              d="M 45 145 Q 65 30 270 25 Q 520 20 580 120 Q 595 255 480 285 Q 250 295 85 250 Q 30 225 45 145 Z"
              fill="#F7F5EA"
              stroke="#CBD5E1"
              strokeWidth="2"
            />

            {/* Rock Interference Zones */}
            <g transform="translate(168, 178)">
              <polygon points="0,28 18,4 44,8 56,30 32,42" fill="#94A3B8" stroke="#475569" strokeWidth="1.5" />
              <text x="28" y="54" textAnchor="middle" className="fill-slate-700 text-[9px] font-semibold">
                Rocher (Bloque Wi-Fi)
              </text>
            </g>
            <g transform="translate(362, 46)">
              <polygon points="0,24 20,2 50,8 58,28 24,38" fill="#94A3B8" stroke="#475569" strokeWidth="1.5" />
              <text x="29" y="50" textAnchor="middle" className="fill-slate-700 text-[9px] font-semibold">
                Mur rocheux
              </text>
            </g>

            {/* Interactive Candidate Edges */}
            {EDGES.map((edge) => {
              const a = getNode(edge.from);
              const b = getNode(edge.to);
              const placed = placedLinks[edge.id];
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              const strokeColor =
                placed === 'ethernet'
                  ? '#0284C7'
                  : placed === 'fiber'
                  ? '#059669'
                  : placed === 'wifi'
                  ? '#D97706'
                  : '#94A3B8';

              return (
                <g
                  key={edge.id}
                  onClick={() => handleToggleEdge(edge)}
                  className="cursor-pointer group"
                >
                  {/* Wide transparent hit area */}
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="transparent"
                    strokeWidth="26"
                  />
                  {/* Visible corridor */}
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={strokeColor}
                    strokeWidth={placed ? 5 : 2.5}
                    strokeDasharray={placed === 'wifi' ? '7 5' : placed ? 'none' : '5 5'}
                  />
                  {/* Cost label pill in SVG */}
                  <g transform={`translate(${mx}, ${my})`}>
                    <rect
                      x="-32"
                      y="-11"
                      width="64"
                      height="22"
                      rx="5"
                      fill={placed ? strokeColor : '#FFFFFF'}
                      stroke={strokeColor}
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      className={`text-[10px] font-mono font-semibold ${
                        placed ? 'fill-white' : 'fill-slate-700'
                      }`}
                    >
                      {placed
                        ? `${placed === 'ethernet' ? 'ETH' : placed === 'fiber' ? 'FIBRE' : 'Wi-Fi'}`
                        : `${edge.costs[selectedTool]} or`}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Nodes (Lighthouse & Huts) */}
            {NODES.map((node) => {
              const online = connectedNodes.has(node.id);
              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <rect
                    x="-46"
                    y="-22"
                    width="92"
                    height="44"
                    rx="9"
                    fill={node.isRoot ? '#0369A1' : online ? '#ECFDF5' : '#FFFFFF'}
                    stroke={node.isRoot ? '#0369A1' : online ? '#059669' : '#64748B'}
                    strokeWidth="2"
                  />
                  <text
                    x="0"
                    y="-3"
                    textAnchor="middle"
                    className={`text-[11px] font-bold ${
                      node.isRoot ? 'fill-white' : 'fill-slate-900'
                    }`}
                  >
                    {node.label}
                  </text>
                  <text
                    x="0"
                    y="12"
                    textAnchor="middle"
                    className={`text-[9px] font-mono font-semibold ${
                      node.isRoot
                        ? 'fill-sky-100'
                        : online
                        ? 'fill-emerald-700'
                        : 'fill-slate-500'
                    }`}
                  >
                    {node.isRoot ? 'SOURCE LAN' : online ? 'CONNECTÉE' : 'HORS LIGNE'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Status feedback bar */}
        <div
          className={`px-5 py-3.5 border-t border-slate-200 flex items-center gap-3 text-sm ${
            feedbackType === 'error'
              ? 'bg-red-50 text-red-900'
              : feedbackType === 'success'
              ? 'bg-emerald-50 text-emerald-900'
              : 'bg-white text-slate-700'
          }`}
        >
          {feedbackType === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />}
          {feedbackType === 'success' && (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span className="flex-1">{feedback}</span>
        </div>
      </div>

      {/* Right 35% Tool Selector & Objective Deck */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-slate-900">Boîte à outils réseau</h3>
          <p className="text-xs text-slate-600">
            Sélectionnez un support puis cliquez sur un corridor de la carte (recliquez pour
            retirer).
          </p>
        </div>

        <div className="space-y-2.5">
          {(
            [
              {
                id: 'ethernet' as LinkKind,
                label: 'Câble Ethernet (Cuivre)',
                desc: 'Fiable face aux rochers · 20–40 or selon distance',
                icon: Cable,
              },
              {
                id: 'wifi' as LinkKind,
                label: 'Borne Wi-Fi (Ondes)',
                desc: 'Économique (15–25 or) mais bloqué par les rochers',
                icon: Wifi,
              },
              {
                id: 'fiber' as LinkKind,
                label: 'Fibre optique',
                desc: 'Excellent sur longue distance · insensible aux rochers (30–35 or)',
                icon: Zap,
              },
            ]
          ).map((tool) => {
            const Icon = tool.icon;
            const active = selectedTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedTool(tool.id);
                }}
                className={`w-full text-left p-3.5 rounded-lg border transition-colors flex items-start gap-3 ${
                  active
                    ? 'bg-sky-50 border-sky-600 text-sky-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    active ? 'text-sky-700' : 'text-slate-400'
                  }`}
                />
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">{tool.label}</p>
                  <p className="text-xs text-slate-600">{tool.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {won && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
            <p className="text-xs font-semibold text-emerald-900">
              Badge débloqué : Bâtisseur de Signaux
            </p>
            <p className="text-xs text-emerald-800">
              Toutes les cabanes communiquent désormais avec le phare local. +150 XP acquis !
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleReset}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser le câblage
        </button>
      </div>
    </div>
  );
};
