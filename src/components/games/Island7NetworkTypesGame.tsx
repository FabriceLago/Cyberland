import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Star,
  ArrowRight,
  Network,
  Shield,
  Wifi,
  Globe,
  Building2,
  Smartphone,
  Cable,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island7NetworkTypesGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

type NetworkTypeChoice = 'PAN' | 'LAN' | 'WLAN' | 'MAN' | 'WAN' | 'VPN' | 'MESH' | 'BUS' | 'STAR';

interface NetworkMission {
  id: string;
  phase: 'Échelle géographique' | 'Sécurité & Accès' | 'Topologie physique';
  title: string;
  scenario: string;
  rangeHint: string;
  constraint: string;
  options: {
    id: NetworkTypeChoice;
    label: string;
    sub: string;
  }[];
  correctId: NetworkTypeChoice;
  explanation: string;
  visualScale: 'PAN' | 'LAN' | 'WLAN' | 'MAN' | 'WAN' | 'VPN' | 'TOPO';
}

const MISSIONS: NetworkMission[] = [
  {
    id: 'm1-pan',
    phase: 'Échelle géographique',
    title: 'Mission 1 · Équipement de terrain personnel',
    scenario:
      "Vous souhaitez connecter votre montre connectée, vos écouteurs audio et un capteur météo de poche à votre tablette, le tout dans un rayon de 3 mètres.",
    rangeHint: 'Portée : 1 à 10 m · Technologies : Bluetooth / NFC / USB',
    constraint: 'Faible consommation électrique et connexion personnelle immédiate.',
    options: [
      { id: 'PAN', label: 'PAN (Réseau personnel)', sub: 'Bluetooth · 1 à 10 mètres' },
      { id: 'MAN', label: 'MAN (Réseau métropolitain)', sub: 'Boucle fibre · 1 à 50 km' },
      { id: 'WAN', label: 'WAN (Réseau étendu)', sub: 'Câbles sous-marins · mondial' },
      { id: 'LAN', label: 'LAN (Réseau local filaire)', sub: 'Switch Ethernet · bâtiment' },
    ],
    correctId: 'PAN',
    explanation:
      'Le PAN (Personal Area Network) relie les appareils personnels autour d’un individu (1 à 10 m) via Bluetooth, NFC ou USB.',
    visualScale: 'PAN',
  },
  {
    id: 'm2-lan',
    phase: 'Échelle géographique',
    title: "Mission 2 · Salle informatique de l'école du village",
    scenario:
      "L'école de l'Île des Signaux installe 16 ordinateurs fixes dans un même bâtiment. Les enseignants exigent un débit très stable pour partager un serveur local sans subir d'interférences radio.",
    rangeHint: 'Portée : 10 à 100 m · Bâtiment unique',
    constraint: 'Stabilité maximale par câble Ethernet et commutateur (Switch).',
    options: [
      { id: 'PAN', label: 'PAN (Réseau personnel)', sub: 'Bluetooth · quelques mètres' },
      { id: 'LAN', label: 'LAN (Réseau local filaire)', sub: 'Ethernet + Switch · bâtiment' },
      { id: 'WAN', label: 'WAN (Réseau étendu)', sub: 'Intercontinental' },
      { id: 'MAN', label: 'MAN (Métropolitain)', sub: 'Échelle d’une ville entière' },
    ],
    correctId: 'LAN',
    explanation:
      'Un LAN (Local Area Network) filaire en Ethernet relié à un Switch est idéal pour un bâtiment unique demandant fiabilité et débit constant.',
    visualScale: 'LAN',
  },
  {
    id: 'm3-wlan',
    phase: 'Échelle géographique',
    title: 'Mission 3 · Espace nomade du Café du Port',
    scenario:
      "Les visiteurs du port arrivent avec leurs smartphones et ordinateurs portables. Ils doivent pouvoir se déplacer librement sur la terrasse et dans la salle sans tirer de câbles.",
    rangeHint: 'Portée : 10 à 80 m · Sans fil local',
    constraint: 'Mobilité des terminaux au sein d’un lieu local.',
    options: [
      { id: 'WLAN', label: 'WLAN (Réseau local sans fil)', sub: 'Bornes Wi-Fi · mobilité locale' },
      { id: 'PAN', label: 'PAN (Réseau personnel)', sub: 'Usage individuel < 10 m' },
      { id: 'MAN', label: 'MAN (Métropolitain)', sub: 'Interconnexion de ville' },
      { id: 'WAN', label: 'WAN (Réseau étendu)', sub: 'Liaison longue distance' },
    ],
    correctId: 'WLAN',
    explanation:
      'Le WLAN (Wireless LAN) est la déclinaison sans fil (Wi-Fi) du réseau local, conçue pour accueillir des appareils mobiles dans un espace donné.',
    visualScale: 'WLAN',
  },
  {
    id: 'm4-man',
    phase: 'Échelle géographique',
    title: 'Mission 4 · Boucle fibre de la capitale insulaire',
    scenario:
      "La capitale de Cyberland veut relier à 10 Gbit/s ses 4 sites municipaux (mairie, hôpital, port et université) répartis sur 18 km autour de la baie.",
    rangeHint: 'Portée : 1 à 50 km · Échelle d’une ville / campus étendu',
    constraint: 'Interconnecter plusieurs bâtiments LAN sur une même agglomération.',
    options: [
      { id: 'LAN', label: 'LAN (Réseau local)', sub: 'Limité à un bâtiment (~100 m)' },
      { id: 'PAN', label: 'PAN (Personnel)', sub: '1 à 10 mètres' },
      { id: 'MAN', label: 'MAN (Métropolitain)', sub: 'Boucle fibre · 1 à 50 km' },
      { id: 'WLAN', label: 'WLAN (Wi-Fi local)', sub: 'Couverture d’une salle' },
    ],
    correctId: 'MAN',
    explanation:
      'Le MAN (Metropolitan Area Network) fédère plusieurs LAN à l’échelle d’une ville ou d’une grande agglomération (1 à 50 km), souvent via une boucle en fibre optique.',
    visualScale: 'MAN',
  },
  {
    id: 'm5-wan',
    phase: 'Échelle géographique',
    title: "Mission 5 · Liaison entre l'Archipel et le Continent",
    scenario:
      "Cyberland doit synchroniser ses services météo avec les centres de données situés sur le continent à 3 500 km de distance, en traversant l'océan.",
    rangeHint: 'Portée : > 100 km à mondiale · Câbles sous-marins & satellites',
    constraint: 'Interconnecter des réseaux séparés par des milliers de kilomètres.',
    options: [
      { id: 'MAN', label: 'MAN (Métropolitain)', sub: 'Limité à une ville' },
      { id: 'WAN', label: 'WAN (Réseau étendu)', sub: 'Longue distance / Internet' },
      { id: 'WLAN', label: 'WLAN (Wi-Fi)', sub: 'Portée locale' },
      { id: 'LAN', label: 'LAN (Local)', sub: 'Un seul bâtiment' },
    ],
    correctId: 'WAN',
    explanation:
      'Le WAN (Wide Area Network) relie des pays et continents grâce aux câbles sous-marins en fibre optique, réseaux opérateurs et satellites. Internet est le plus grand WAN.',
    visualScale: 'WAN',
  },
  {
    id: 'm6-vpn',
    phase: 'Sécurité & Accès',
    title: 'Mission 6 · Télétravail sécurisé depuis un hôtel',
    scenario:
      "Une ingénieure en déplacement utilise le Wi-Fi public d'un hôtel sur le continent. Elle doit consulter des fichiers confidentiels hébergés sur le réseau privé interne de la Forteresse.",
    rangeHint: 'Tunnel chiffré virtuel au-dessus d’Internet (WAN)',
    constraint: 'Empêcher tout espionnage sur le Wi-Fi public et accéder au LAN privé.',
    options: [
      { id: 'PAN', label: 'PAN (Bluetooth)', sub: 'Impossible à distance' },
      { id: 'VPN', label: 'VPN (Réseau Privé Virtuel)', sub: 'Tunnel chiffré sécurisé sur WAN' },
      { id: 'WLAN', label: 'Wi-Fi public ouvert', sub: 'Non chiffré de bout en bout' },
      { id: 'MAN', label: 'MAN (Fibre urbaine)', sub: 'Ne couvre pas le continent' },
    ],
    correctId: 'VPN',
    explanation:
      'Le VPN (Virtual Private Network) crée un tunnel chiffré au-dessus d’un réseau public (Internet) pour relier de façon confidentielle un poste distant au réseau privé d’une organisation.',
    visualScale: 'VPN',
  },
  {
    id: 'm7-topo',
    phase: 'Topologie physique',
    title: 'Mission 7 · Résilience des 4 phares critiques',
    scenario:
      "Quatre phares stratégiques échangent des alertes météo. L'ancre d'un cargo risque de couper un câble sous-marin : quelle topologie garantit que le trafic trouve toujours un chemin alternatif sans couper les autres phares ?",
    rangeHint: 'Topologie physique : organisation des câbles entre les nœuds',
    constraint: 'Tolérance aux pannes maximale : aucun point unique de défaillance.',
    options: [
      {
        id: 'BUS',
        label: 'Topologie en Bus',
        sub: '1 câble unique partagé : s’il casse, tout tombe',
      },
      {
        id: 'STAR',
        label: 'Topologie en Étoile',
        sub: 'Tout passe par 1 seul nœud central (SPOF)',
      },
      {
        id: 'MESH',
        label: 'Topologie Maillée (Mesh)',
        sub: 'Plusieurs liaisons redondantes entre les phares',
      },
    ],
    correctId: 'MESH',
    explanation:
      'En topologie Maillée (Mesh), chaque phare dispose de plusieurs chemins vers les autres : si un câble casse, les paquets contournent la coupure automatiquement (principe d’Internet).',
    visualScale: 'TOPO',
  },
];

export const Island7NetworkTypesGame: React.FC<Island7NetworkTypesGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [missionIdx, setMissionIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<NetworkTypeChoice | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const mission = MISSIONS[missionIdx];
  const isAnswered = selectedChoice !== null;
  const isCorrect = selectedChoice === mission.correctId;

  const handleSelectOption = (choiceId: NetworkTypeChoice) => {
    if (isAnswered) return;
    setSelectedChoice(choiceId);
    if (choiceId === mission.correctId) {
      playSuccess();
      setScore((s) => s + 1);
    } else {
      playError();
    }
  };

  const handleNext = () => {
    playClick();
    if (missionIdx + 1 < MISSIONS.length) {
      setMissionIdx((i) => i + 1);
      setSelectedChoice(null);
    } else {
      const finalScore = score;
      const passed = finalScore >= 5;
      const stars = finalScore === MISSIONS.length ? 3 : finalScore === 6 ? 2 : passed ? 1 : 0;
      setEarnedStars(stars);
      setFinished(true);
      if (passed) {
        playVictory();
        onComplete(stars);
      } else {
        playError();
      }
    }
  };

  const handleReset = () => {
    playClick();
    setMissionIdx(0);
    setSelectedChoice(null);
    setScore(0);
    setFinished(false);
    setEarnedStars(0);
  };

  const activeRing = isAnswered ? mission.visualScale : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 65% Interactive Mission & Visual Scale Stage */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-semibold">
            Mini-jeu · Architecte des Échelles &amp; Topologies
          </span>
          <span className="font-mono text-xs text-sky-200 tabular-nums">
            {finished
              ? `Résultat : ${score}/${MISSIONS.length}`
              : `Mission ${missionIdx + 1} / ${MISSIONS.length} · Score : ${score}`}
          </span>
        </div>

        <div className="p-6 bg-[#EEF5FA] dark:bg-slate-800/70 space-y-6">
          {/* Interactive Concentric Network Scale / Topology Visualizer */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <svg
              viewBox="0 0 640 168"
              className="w-full h-auto"
              role="img"
              aria-label="Carte des échelles de réseaux PAN, LAN, WLAN, MAN, WAN et VPN"
            >
              <rect x="0" y="0" width="640" height="168" rx="10" fill="#F8FAFC" />
              {mission.visualScale === 'TOPO' ? (
                <>
                  {/* Topology visual comparison: Bus, Star, Mesh */}
                  <g transform="translate(26, 22)">
                    <rect
                      width="180"
                      height="124"
                      rx="8"
                      fill={selectedChoice === 'BUS' ? '#FEF2F2' : '#FFFFFF'}
                      stroke={selectedChoice === 'BUS' ? '#DC2626' : '#CBD5E1'}
                      strokeWidth="2"
                    />
                    <text x="90" y="24" textAnchor="middle" className="fill-slate-900 text-[11px] font-bold">
                      Bus (1 câble unique)
                    </text>
                    <line x1="25" y1="76" x2="155" y2="76" stroke="#64748B" strokeWidth="3" />
                    {[42, 74, 106, 138].map((x) => (
                      <g key={x}>
                        <line x1={x} y1="54" x2={x} y2="76" stroke="#94A3B8" strokeWidth="2" />
                        <circle cx={x} cy="50" r="8" fill="#0284C7" />
                      </g>
                    ))}
                    <text x="90" y="108" textAnchor="middle" className="fill-slate-500 text-[9.5px]">
                      1 coupure = panne globale
                    </text>
                  </g>

                  <g transform="translate(230, 22)">
                    <rect
                      width="180"
                      height="124"
                      rx="8"
                      fill={selectedChoice === 'STAR' ? '#FEF3C7' : '#FFFFFF'}
                      stroke={selectedChoice === 'STAR' ? '#D97706' : '#CBD5E1'}
                      strokeWidth="2"
                    />
                    <text x="90" y="24" textAnchor="middle" className="fill-slate-900 text-[11px] font-bold">
                      Étoile (Switch central)
                    </text>
                    {[
                      [42, 52],
                      [138, 52],
                      [42, 96],
                      [138, 96],
                    ].map(([x, y], i) => (
                      <g key={i}>
                        <line x1="90" y1="74" x2={x} y2={y} stroke="#0284C7" strokeWidth="2" />
                        <circle cx={x} cy={y} r="7" fill="#0284C7" />
                      </g>
                    ))}
                    <rect x="78" y="64" width="24" height="20" rx="4" fill="#0F172A" />
                    <text x="90" y="114" textAnchor="middle" className="fill-slate-500 text-[9.5px]">
                      Dépend du centre (SPOF)
                    </text>
                  </g>

                  <g transform="translate(434, 22)">
                    <rect
                      width="180"
                      height="124"
                      rx="8"
                      fill={isAnswered ? '#ECFDF5' : '#FFFFFF'}
                      stroke={isAnswered ? '#059669' : '#CBD5E1'}
                      strokeWidth="2"
                    />
                    <text x="90" y="24" textAnchor="middle" className="fill-slate-900 text-[11px] font-bold">
                      Maillée (Mesh résilient)
                    </text>
                    {/* All pairwise edges between 4 nodes */}
                    <line x1="48" y1="50" x2="132" y2="50" stroke="#059669" strokeWidth="2" />
                    <line x1="48" y1="92" x2="132" y2="92" stroke="#059669" strokeWidth="2" />
                    <line x1="48" y1="50" x2="48" y2="92" stroke="#059669" strokeWidth="2" />
                    <line x1="132" y1="50" x2="132" y2="92" stroke="#059669" strokeWidth="2" />
                    <line x1="48" y1="50" x2="132" y2="92" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 3" />
                    <line x1="132" y1="50" x2="48" y2="92" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 3" />
                    {[
                      [48, 50],
                      [132, 50],
                      [48, 92],
                      [132, 92],
                    ].map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r="8" fill="#059669" />
                    ))}
                    <text x="90" y="114" textAnchor="middle" className="fill-emerald-800 text-[9.5px] font-semibold">
                      Chemins multiples de secours
                    </text>
                  </g>
                </>
              ) : (
                <>
                  {/* Scale steps: PAN -> LAN/WLAN -> MAN -> WAN -> VPN */}
                  {(
                    [
                      { id: 'PAN', label: 'PAN', range: '1–10 m', x: 20 },
                      { id: 'LAN', label: 'LAN', range: '10–100 m', x: 122 },
                      { id: 'WLAN', label: 'WLAN', range: 'Wi-Fi local', x: 224 },
                      { id: 'MAN', label: 'MAN', range: '1–50 km', x: 326 },
                      { id: 'WAN', label: 'WAN', range: 'Mondial', x: 428 },
                      { id: 'VPN', label: 'VPN', range: 'Tunnel sûr', x: 530 },
                    ] as const
                  ).map((node, idx) => {
                    const highlighted = activeRing === node.id;
                    const chosen = selectedChoice === node.id;
                    return (
                      <g key={node.id}>
                        {idx < 5 && (
                          <line
                            x1={node.x + 90}
                            y1={84}
                            x2={node.x + 102}
                            y2={84}
                            stroke="#CBD5E1"
                            strokeWidth="2.5"
                          />
                        )}
                        <rect
                          x={node.x}
                          y={36}
                          width="90"
                          height="96"
                          rx="10"
                          fill={
                            highlighted
                              ? '#ECFDF5'
                              : chosen && !isCorrect
                              ? '#FEF2F2'
                              : '#FFFFFF'
                          }
                          stroke={
                            highlighted
                              ? '#059669'
                              : chosen && !isCorrect
                              ? '#DC2626'
                              : '#CBD5E1'
                          }
                          strokeWidth={highlighted || chosen ? '2.5' : '1.5'}
                        />
                        <text
                          x={node.x + 45}
                          y={74}
                          textAnchor="middle"
                          className={`text-[14px] font-mono font-bold ${
                            highlighted ? 'fill-emerald-800' : 'fill-slate-900'
                          }`}
                        >
                          {node.label}
                        </text>
                        <text
                          x={node.x + 45}
                          y={98}
                          textAnchor="middle"
                          className="fill-slate-500 text-[10px]"
                        >
                          {node.range}
                        </text>
                        <text
                          x={node.x + 45}
                          y={118}
                          textAnchor="middle"
                          className="fill-sky-700 text-[9px] font-semibold"
                        >
                          {highlighted ? 'Déployé ✓' : `Échelle ${idx + 1}`}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}
            </svg>
          </div>

          {!finished ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-sky-700 dark:text-sky-400">
                    {mission.phase}
                  </span>
                  <span className="font-mono">{mission.rangeHint}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  {mission.title}
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {mission.scenario}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <strong>Contrainte clé :</strong> {mission.constraint}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mission.options.map((opt) => {
                  const chosen = selectedChoice === opt.id;
                  const right = opt.id === mission.correctId;

                  let style =
                    'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-sky-500 hover:bg-sky-50/60 dark:hover:bg-sky-950/40';
                  if (isAnswered) {
                    if (right) {
                      style =
                        'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200';
                    } else if (chosen && !right) {
                      style =
                        'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-950 dark:text-red-200';
                    } else {
                      style =
                        'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`p-4 text-left rounded-xl border transition-colors flex items-start justify-between gap-3 ${style}`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold">{opt.label}</p>
                        <p className="text-xs opacity-80">{opt.sub}</p>
                      </div>
                      {isAnswered && right && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {isAnswered && chosen && !right && (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                  }`}
                >
                  <div className="text-xs leading-relaxed space-y-1">
                    <p className="font-bold text-sm">
                      {isCorrect
                        ? 'Excellent choix d’architecture !'
                        : `Réponse attendue : ${mission.correctId}`}
                    </p>
                    <p>{mission.explanation}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {missionIdx + 1 < MISSIONS.length ? 'Mission suivante' : 'Voir le bilan'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`p-6 rounded-xl border space-y-4 ${
                score >= 5
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-bold tabular-nums">
                    {score >= 5
                      ? `Cartographie validée : ${score} / ${MISSIONS.length} !`
                      : `Score : ${score} / ${MISSIONS.length} (objectif : 5/7)`}
                  </p>
                  <p className="text-sm mt-1 opacity-90">
                    {score >= 5
                      ? 'Vous maîtrisez parfaitement les échelles PAN, LAN, WLAN, MAN, WAN, VPN et les topologies résilientes. Badge « Cartographe des Réseaux » débloqué (+200 XP) !'
                      : 'Relisez l’animation des échelles puis retentez le défi pour atteindre au moins 5/7.'}
                  </p>
                </div>
                {earnedStars > 0 && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-6 h-6 ${
                          s <= earnedStars
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Rejouer les 7 missions
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right 35% Reference Cheatsheet & Rubric */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            Repères d&apos;échelles
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Observez la distance et le besoin (filaire, sans fil, chiffré, résilient) pour choisir
            le bon type de réseau.
          </p>
        </div>

        <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
          <li className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Smartphone className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
              PAN
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">1–10 m · Bluetooth</span>
          </li>
          <li className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Cable className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
              LAN
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">10–100 m · Ethernet</span>
          </li>
          <li className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Wifi className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
              WLAN
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">10–80 m · Wi-Fi</span>
          </li>
          <li className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Building2 className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
              MAN
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">1–50 km · Ville</span>
          </li>
          <li className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Globe className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
              WAN
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">&gt; 100 km · Mondial</span>
          </li>
          <li className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              VPN
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">Tunnel chiffré</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Network className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              Maillée (Mesh)
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">Tolérance pannes</span>
          </li>
        </ul>

        <div className="space-y-1.5 text-xs border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="font-semibold text-slate-900 dark:text-slate-100">Barème des étoiles</p>
          <p className="text-slate-600 dark:text-slate-400">1 ★ : 5 / 7 missions réussies</p>
          <p className="text-slate-600 dark:text-slate-400">2 ★ : 6 / 7 missions réussies</p>
          <p className="text-slate-600 dark:text-slate-400">3 ★ : 7 / 7 sans faute</p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Recommencer les missions
        </button>

        {isCompleted && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200">
            Badge <strong>Cartographe des Réseaux</strong> validé !
          </div>
        )}
      </div>
    </div>
  );
};
