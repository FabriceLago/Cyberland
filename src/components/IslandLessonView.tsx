import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Film, Gamepad2, BookOpen, Star } from 'lucide-react';
import {
  ASSETS,
  CareerTrack,
  getAnalystPhaseForIsland,
  getOrderedIslandsForTrack,
  IslandModule,
} from '../data/courseData';
import { GemiBotGuide } from './GemiBotGuide';
import { IslandAnimationPlayer } from './IslandAnimationPlayer';
import { Island1SignalsGame } from './games/Island1SignalsGame';
import { Island2PortGame } from './games/Island2PortGame';
import { Island3FirewallGame } from './games/Island3FirewallGame';
import { Island4CloudTycoonGame } from './games/Island4CloudTycoonGame';
import { Island5BossStormGame } from './games/Island5BossStormGame';
import { Island6EcoCloudGame } from './games/Island6EcoCloudGame';
import { Island7NetworkTypesGame } from './games/Island7NetworkTypesGame';
import { Island8OsiLayersGame } from './games/Island8OsiLayersGame';
import { Island9ContainersGame } from './games/Island9ContainersGame';
import { Island10CyberBayGame } from './games/Island10CyberBayGame';
import { Island11CryptoGame } from './games/Island11CryptoGame';
import { Island12DevOpsGame } from './games/Island12DevOpsGame';
import { Island13WiresharkGame } from './games/Island13WiresharkGame';
import { Island14AzureMonitorGame } from './games/Island14AzureMonitorGame';
import { Island15ActiveDirectoryGame } from './games/Island15ActiveDirectoryGame';
import { Island16SocSiemGame } from './games/Island16SocSiemGame';
import { Island17KubernetesGame } from './games/Island17KubernetesGame';
import { Island18VpnNatGame } from './games/Island18VpnNatGame';
import { Island19ServerFirewallGame } from './games/Island19ServerFirewallGame';
import { Island20VlanSwitchGame } from './games/Island20VlanSwitchGame';
import { Island21Ipv6Game } from './games/Island21Ipv6Game';
import { Island22ApiJwtGame } from './games/Island22ApiJwtGame';
import { playClick } from '../utils/sound';

interface IslandLessonViewProps {
  island: IslandModule;
  selectedTrackId?: CareerTrack['id'];
  completedIslands: number[];
  starsByIsland: Record<number, number>;
  defaultSpeechRate: number;
  onCompleteIsland: (islandId: number, stars: number) => void;
  onSelectIsland: (islandId: number) => void;
  onBackToMap: () => void;
}

type ModuleTab = 'animation' | 'game' | 'notions';

export const IslandLessonView: React.FC<IslandLessonViewProps> = ({
  island,
  selectedTrackId = 'all',
  completedIslands,
  starsByIsland,
  defaultSpeechRate,
  onCompleteIsland,
  onSelectIsland,
  onBackToMap,
}) => {
  const [activeTab, setActiveTab] = useState<ModuleTab>('animation');
  const [coverErr, setCoverErr] = useState(false);

  useEffect(() => {
    setActiveTab('animation');
    setCoverErr(false);
  }, [island.id]);

  const isCompleted = completedIslands.includes(island.id);
  const earnedStars = starsByIsland[island.id] ?? 0;

  const trackOrdered = getOrderedIslandsForTrack(selectedTrackId);
  const orderedIslands = trackOrdered.some((i) => i.id === island.id)
    ? trackOrdered
    : getOrderedIslandsForTrack('all');
  const currentIdx = orderedIslands.findIndex((i) => i.id === island.id);
  const prevIsland = currentIdx > 0 ? orderedIslands[currentIdx - 1] : undefined;
  const nextIsland =
    currentIdx >= 0 && currentIdx < orderedIslands.length - 1
      ? orderedIslands[currentIdx + 1]
      : undefined;
  const currentPhase = getAnalystPhaseForIsland(island.id);
  const stepNumber = currentIdx >= 0 ? currentIdx + 1 : 1;

  const coverImage =
    island.id === 1
      ? ASSETS.signalsCover
      : island.id === 7
      ? ASSETS.atollNetworksCover
      : island.id === 8
      ? ASSETS.osiLabyrinthCover
      : island.id === 9
      ? ASSETS.containersDockCover
      : island.id === 10
      ? ASSETS.cyberBayCover
      : island.id === 11
      ? ASSETS.cryptoLighthouseCover
      : island.id === 12
      ? ASSETS.devopsFactoryCover
      : island.id === 13
      ? ASSETS.wiresharkObservatoryCover
      : island.id === 14
      ? ASSETS.azureMonitorTowerCover
      : island.id === 15
      ? ASSETS.adCitadelCover
      : island.id === 16
      ? ASSETS.socCenterCover
      : island.id === 17
      ? ASSETS.k8sHarborCover
      : island.id === 18
      ? ASSETS.vpnTunnelCover
      : island.id === 19
      ? ASSETS.serverFirewallCover
      : island.id === 20
      ? ASSETS.vlanSwitchCover
      : island.id === 21
      ? ASSETS.ipv6TransitionCover
      : island.id === 22
      ? ASSETS.apiOauthJwtCover
      : island.id >= 4
      ? ASSETS.cloudSummitCover
      : null;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb & Island Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            playClick();
            onBackToMap();
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la carte de l&apos;archipel
        </button>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg overflow-x-auto">
          {orderedIslands.map((item, idx) => {
            const done = completedIslands.includes(item.id);
            const active = item.id === island.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.title}
                onClick={() => {
                  playClick();
                  onSelectIsland(item.id);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Étape {idx + 1} {done ? '✓' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Editorial Module Header */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className={`${coverImage && !coverErr ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-3`}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
              {currentPhase ? `Palier ${currentPhase.phaseNumber} · ` : ''}Étape {stepNumber}/
              {orderedIslands.length}
            </span>
            <span aria-hidden="true">·</span>
            <span>{island.category}</span>
            <span aria-hidden="true">·</span>
            <span>{island.duration}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-sky-700 dark:text-sky-400 font-semibold">
              +{island.xpReward} XP
            </span>
            <span aria-hidden="true">·</span>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Badge « {island.badgeTitle} »
                {earnedStars > 0 && (
                  <span className="inline-flex items-center gap-0.5 ml-1 text-amber-600 dark:text-amber-400">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= earnedStars
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </span>
                )}
              </span>
            ) : (
              <span>Badge à débloquer : {island.badgeTitle}</span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            {island.title}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            {island.summary}
          </p>
        </div>

        {coverImage && !coverErr && (
          <div className="lg:col-span-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-[4/3] bg-slate-100 dark:bg-slate-800">
            <img
              src={coverImage}
              alt={island.title}
              referrerPolicy="no-referrer"
              onError={() => setCoverErr(true)}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </section>

      {/* Module Workspace Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Sections du module"
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-lg"
        >
          {(
            [
              { id: 'animation' as ModuleTab, label: `1. Animation · ${island.videoDuration}`, icon: Film },
              { id: 'game' as ModuleTab, label: `2. Mini-jeu · ${island.gameTitle}`, icon: Gamepad2 },
              { id: 'notions' as ModuleTab, label: '3. Fiche de notions', icon: BookOpen },
            ]
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => {
                  playClick();
                  setActiveTab(tab.id);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Workspace View */}
      {activeTab === 'animation' && (
        <IslandAnimationPlayer
          islandId={island.id}
          defaultSpeechRate={defaultSpeechRate}
          onStartGame={() => setActiveTab('game')}
        />
      )}

      {activeTab === 'game' && (
        <div>
          {island.id === 1 && (
            <Island1SignalsGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(1, stars)}
            />
          )}
          {island.id === 2 && (
            <Island2PortGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(2, stars)}
            />
          )}
          {island.id === 3 && (
            <Island3FirewallGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(3, stars)}
            />
          )}
          {island.id === 4 && (
            <Island4CloudTycoonGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(4, stars)}
            />
          )}
          {island.id === 5 && (
            <Island5BossStormGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(5, stars)}
            />
          )}
          {island.id === 6 && (
            <Island6EcoCloudGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(6, stars)}
            />
          )}
          {island.id === 7 && (
            <Island7NetworkTypesGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(7, stars)}
            />
          )}
          {island.id === 8 && (
            <Island8OsiLayersGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(8, stars)}
            />
          )}
          {island.id === 9 && (
            <Island9ContainersGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(9, stars)}
            />
          )}
          {island.id === 10 && (
            <Island10CyberBayGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(10, stars)}
            />
          )}
          {island.id === 11 && (
            <Island11CryptoGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(11, stars)}
            />
          )}
          {island.id === 12 && (
            <Island12DevOpsGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(12, stars)}
            />
          )}
          {island.id === 13 && (
            <Island13WiresharkGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(13, stars)}
            />
          )}
          {island.id === 14 && (
            <Island14AzureMonitorGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(14, stars)}
            />
          )}
          {island.id === 15 && (
            <Island15ActiveDirectoryGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(15, stars)}
            />
          )}
          {island.id === 16 && (
            <Island16SocSiemGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(16, stars)}
            />
          )}
          {island.id === 17 && (
            <Island17KubernetesGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(17, stars)}
            />
          )}
          {island.id === 18 && (
            <Island18VpnNatGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(18, stars)}
            />
          )}
          {island.id === 19 && (
            <Island19ServerFirewallGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(19, stars)}
            />
          )}
          {island.id === 20 && (
            <Island20VlanSwitchGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(20, stars)}
            />
          )}
          {island.id === 21 && (
            <Island21Ipv6Game
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(21, stars)}
            />
          )}
          {island.id === 22 && (
            <Island22ApiJwtGame
              isCompleted={isCompleted}
              onComplete={(stars) => onCompleteIsland(22, stars)}
            />
          )}
        </div>
      )}

      {activeTab === 'notions' && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-8">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              Notions essentielles de l&apos;Île {island.id}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Synthèse claire à réviser avant le quiz ou la fiche d&apos;activité.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {island.keyTakeaways.map((item) => (
              <div
                key={item.term}
                className="p-5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5"
              >
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  {item.term}
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>

          {island.id === 7 && (
            <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-3">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  Tableau comparatif des types de réseaux
                </h3>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Type</th>
                        <th className="py-3 px-4 font-semibold">Portée</th>
                        <th className="py-3 px-4 font-semibold">Technologies clés</th>
                        <th className="py-3 px-4 font-semibold">Usage sur Cyberland</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">PAN</td>
                        <td className="py-3 px-4 font-mono tabular-nums">1 – 10 m</td>
                        <td className="py-3 px-4">Bluetooth, NFC, USB</td>
                        <td className="py-3 px-4">Montre, écouteurs et tablette de l&apos;explorateur</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">LAN</td>
                        <td className="py-3 px-4 font-mono tabular-nums">10 – 100 m</td>
                        <td className="py-3 px-4">Ethernet (RJ45), Switch</td>
                        <td className="py-3 px-4">Salle informatique de l&apos;école ou bureaux fixes</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">WLAN</td>
                        <td className="py-3 px-4 font-mono tabular-nums">10 – 80 m</td>
                        <td className="py-3 px-4">Bornes Wi-Fi (802.11)</td>
                        <td className="py-3 px-4">Smartphones et portables nomades au Café du Port</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">MAN</td>
                        <td className="py-3 px-4 font-mono tabular-nums">1 – 50 km</td>
                        <td className="py-3 px-4">Boucle fibre optique</td>
                        <td className="py-3 px-4">Mairie, hôpital, port et université de la capitale</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">WAN</td>
                        <td className="py-3 px-4 font-mono tabular-nums">&gt; 100 km</td>
                        <td className="py-3 px-4">Câbles sous-marins, 5G, Satellite</td>
                        <td className="py-3 px-4">Archipel Cyberland relié au continent (Internet)</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">VPN</td>
                        <td className="py-3 px-4 font-mono tabular-nums">Virtuel sur WAN</td>
                        <td className="py-3 px-4">Tunnel chiffré (WireGuard / IPsec)</td>
                        <td className="py-3 px-4">Télétravail chiffré vers l&apos;intranet de la Forteresse</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  Les 3 grandes topologies physiques à connaître
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
                    <p className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                      Bus (Historique)
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      Un seul câble partagé par tous les postes. Peu coûteux mais très fragile : si
                      le câble principal casse, tout le réseau tombe.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
                    <p className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                      Étoile (Standard LAN)
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      Chaque appareil est relié à un Switch central. Simple à dépanner (une panne de
                      câble n&apos;affecte qu&apos;un poste), mais le Switch central reste critique.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
                    <p className="font-display text-sm font-bold text-emerald-950 dark:text-emerald-200">
                      Maillée / Mesh (Haute résilience)
                    </p>
                    <p className="text-emerald-900 dark:text-emerald-300 leading-relaxed">
                      Chaque nœud dispose de plusieurs chemins vers les autres. Utilisée pour le
                      cœur d&apos;Internet et les phares critiques de Cyberland.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {island.id === 13 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Tableau comparatif : Wireshark vs tcpdump &amp; filtres essentiels
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Critère</th>
                      <th className="py-3 px-4 font-semibold">Wireshark (GUI)</th>
                      <th className="py-3 px-4 font-semibold">tcpdump (CLI)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Usage idéal</td>
                      <td className="py-3 px-4">Analyse approfondie sur poste, dissection 3 volets, Follow TCP Stream</td>
                      <td className="py-3 px-4">Capture rapide et légère en SSH sur serveur Linux / routeur sans écran</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Syntaxe de filtre</td>
                      <td className="py-3 px-4 font-mono">http · dns · tcp.port == 23 · tcp.flags.syn == 1</td>
                      <td className="py-3 px-4 font-mono">port 443 · host 10.0.2.50 · icmp (Filtre BPF)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Format d&apos;échange</td>
                      <td className="py-3 px-4 font-mono">Ouvre .pcap / .pcapng</td>
                      <td className="py-3 px-4 font-mono">Écrit -w capture.pcap · Lit -r capture.pcap</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {island.id === 14 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Mémo rapide Windows Azure Monitor &amp; requêtes KQL
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Composant</th>
                      <th className="py-3 px-4 font-semibold">Rôle clé</th>
                      <th className="py-3 px-4 font-semibold">Exemple Windows / Cloud</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">AMA + DCR</td>
                      <td className="py-3 px-4">Collecte filtrée sur serveurs Windows &amp; Linux</td>
                      <td className="py-3 px-4">Event Logs Security + Compteurs Perf CPU/RAM</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">Metrics</td>
                      <td className="py-3 px-4">Séries temporelles numériques ultra-rapides</td>
                      <td className="py-3 px-4">Courbe CPU % &amp; règle d&apos;alerte &gt; 85 %</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">Log Analytics (KQL)</td>
                      <td className="py-3 px-4">Recherche et corrélation dans les journaux</td>
                      <td className="py-3 px-4 font-mono">Event | where EventID == 4625 | summarize count() by Computer</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">App Insights &amp; Action Group</td>
                      <td className="py-3 px-4">Traçage applicatif (APM) + auto-réparation</td>
                      <td className="py-3 px-4">Repère une requête SQL lente + notifie Teams &amp; lance Autoscale</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {island.id === 15 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Mémo Active Directory, Kerberos &amp; GPO
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Composant AD</th>
                      <th className="py-3 px-4 font-semibold">Port / Mécanisme</th>
                      <th className="py-3 px-4 font-semibold">Rôle essentiel en entreprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">KDC / Kerberos</td>
                      <td className="py-3 px-4 font-mono">TCP/UDP 88 · TGT + TGS</td>
                      <td className="py-3 px-4">Authentification SSO par tickets sans transmettre le mot de passe en clair</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">LDAP / LDAPS</td>
                      <td className="py-3 px-4 font-mono">389 / 636 (TLS)</td>
                      <td className="py-3 px-4">Consultation de l&apos;annuaire (utilisateurs, groupes, OU, postes)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">GPO + OU</td>
                      <td className="py-3 px-4 font-mono">Ordre LSDOU</td>
                      <td className="py-3 px-4">Déploiement centralisé de la sécurité (BitLocker, pare-feu, verrouillage)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">Tiering (T0/T1/T2)</td>
                      <td className="py-3 px-4 font-mono">Moindre privilège</td>
                      <td className="py-3 px-4">Empêche le vol d&apos;identifiants Admin Domaine depuis un poste bureautique</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {island.id === 16 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Chaîne opérationnelle SOC : SIEM, MITRE ATT&amp;CK &amp; SOAR
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Pilier SOC</th>
                      <th className="py-3 px-4 font-semibold">Objectif</th>
                      <th className="py-3 px-4 font-semibold">Indicateur / Exemple</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">SIEM</td>
                      <td className="py-3 px-4">Collecte &amp; corrélation des journaux multi-sources</td>
                      <td className="py-3 px-4">25 × EventID 4625 + 1 × 4624 → Alerte Force Brute</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">Triage N1/N2</td>
                      <td className="py-3 px-4">Séparer Faux Positifs et Vrais Positifs</td>
                      <td className="py-3 px-4">Réduction du MTTD (Mean Time To Detect)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">MITRE ATT&amp;CK</td>
                      <td className="py-3 px-4">Cartographier les tactiques et techniques (TTP)</td>
                      <td className="py-3 px-4">Initial Access → Execution → Lateral Movement</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">SOAR + EDR</td>
                      <td className="py-3 px-4">Playbook de confinement automatisé</td>
                      <td className="py-3 px-4">Isolation hôte + révocation session (MTTR &lt; 1 min)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {island.id === 17 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Objets clés Kubernetes &amp; Réseau Conteneurisé
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Objet K8s</th>
                      <th className="py-3 px-4 font-semibold">Stabilité réseau</th>
                      <th className="py-3 px-4 font-semibold">Rôle dans le cluster</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">Pod</td>
                      <td className="py-3 px-4">IP éphémère</td>
                      <td className="py-3 px-4">Enveloppe d&apos;exécution d&apos;un ou plusieurs conteneurs</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">Deployment</td>
                      <td className="py-3 px-4">Auto-réparation</td>
                      <td className="py-3 px-4">Maintient N réplicas actifs et orchestre les mises à jour</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">Service (ClusterIP)</td>
                      <td className="py-3 px-4">IP &amp; DNS stables</td>
                      <td className="py-3 px-4">Point d&apos;entrée interne et répartition de charge vers les Pods</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">Ingress &amp; NetworkPolicy</td>
                      <td className="py-3 px-4">HTTPS + Zero Trust</td>
                      <td className="py-3 px-4">Expose /url en TLS et cloisonne finement les flux entre Pods</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {island.id === 18 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Comparatif NAT, Pare-feu Stateful, WireGuard &amp; IPSec
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Technologie</th>
                      <th className="py-3 px-4 font-semibold">Port / Fonctionnement</th>
                      <th className="py-3 px-4 font-semibold">Cas d&apos;usage recommandé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">NAT / PAT</td>
                      <td className="py-3 px-4">Traduction IP privée + port</td>
                      <td className="py-3 px-4">Partager 1 IPv4 publique entre tout un réseau local</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">WireGuard</td>
                      <td className="py-3 px-4 font-mono">UDP 51820 · Clés Curve25519</td>
                      <td className="py-3 px-4">VPN rapide, moderne et fluide en mobilité (roaming 4G/Wi-Fi)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">IPSec (IKEv2/ESP)</td>
                      <td className="py-3 px-4 font-mono">UDP 500/4500 · Protocole 50</td>
                      <td className="py-3 px-4">Interconnexion Site-to-Site entre pare-feux matériels et Cloud</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">Full vs Split Tunnel</td>
                      <td className="py-3 px-4">Routage 100 % vs sélectif</td>
                      <td className="py-3 px-4">Full Tunnel obligatoire sur Wi-Fi public ; Split pour économiser la bande passante</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {island.id === 19 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Checklist Réelle : Créer, Configurer un Serveur &amp; Placer le Pare-feu
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Étape</th>
                      <th className="py-3 px-4 font-semibold">Commande / Configuration clé</th>
                      <th className="py-3 px-4 font-semibold">Objectif sécurité &amp; architecture</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">1. Créer &amp; mettre à jour</td>
                      <td className="py-3 px-4 font-mono">sudo apt update &amp;&amp; sudo apt upgrade -y</td>
                      <td className="py-3 px-4">Partir sur un OS Linux LTS (Ubuntu/Debian) à jour avec IP statique</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">2. Durcir SSH</td>
                      <td className="py-3 px-4 font-mono">PermitRootLogin no · PasswordAuthentication no</td>
                      <td className="py-3 px-4">Compte sudo dédié + clé SSH Ed25519 (bloque les attaques force brute)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">3. Reverse Proxy &amp; TLS</td>
                      <td className="py-3 px-4 font-mono">nginx + certbot --nginx</td>
                      <td className="py-3 px-4">Chiffrement HTTPS sur :443 tout en gardant l&apos;application sur 127.0.0.1</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">4. Placer le Pare-feu</td>
                      <td className="py-3 px-4 font-mono">WAN → FW1 → DMZ (Web) → FW2 → LAN (DB)</td>
                      <td className="py-3 px-4">Isoler les serveurs exposés en DMZ et protéger la base de données derrière FW2</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">5. Filtrer avec UFW</td>
                      <td className="py-3 px-4 font-mono">ufw default deny incoming &amp;&amp; ufw allow 443/tcp</td>
                      <td className="py-3 px-4">Tout bloquer par défaut ; restreindre SSH (22) à l&apos;IP admin ou VPN ; bloquer 5432/23</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {island.id === 20 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Mémo Technique : Switch Access vs Trunk 802.1Q &amp; Wi-Fi Entreprise
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Notion</th>
                      <th className="py-3 px-4 font-semibold">Fonctionnement / Protocole</th>
                      <th className="py-3 px-4 font-semibold">Usage recommandé en entreprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">Port Access</td>
                      <td className="py-3 px-4">1 seul VLAN · Trames non taguées</td>
                      <td className="py-3 px-4">PC, téléphones IP, imprimantes, serveurs individuels</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">Port Trunk 802.1Q</td>
                      <td className="py-3 px-4">Multi-VLAN · Tag 4 octets (VLAN ID)</td>
                      <td className="py-3 px-4">Liaison Switch-à-Switch, Switch-à-Routeur ou borne multi-SSID</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">WPA3-Enterprise</td>
                      <td className="py-3 px-4">IEEE 802.1X + serveur RADIUS</td>
                      <td className="py-3 px-4">Wi-Fi collaborateurs avec comptes/certificats révocables</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">VLAN Invités + ACL</td>
                      <td className="py-3 px-4">Client Isolation + DENY vers LAN interne</td>
                      <td className="py-3 px-4">Sortie Internet visiteurs sans aucun accès aux serveurs internes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {island.id === 21 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Mémo IPv6 : Préfixes essentiels &amp; Equivalence IPv4
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Préfixe IPv6</th>
                      <th className="py-3 px-4 font-semibold">Équivalent IPv4</th>
                      <th className="py-3 px-4 font-semibold">Rôle réseau</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">::1/128</td>
                      <td className="py-3 px-4 font-mono">127.0.0.1</td>
                      <td className="py-3 px-4">Loopback (bouclage local de la machine)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">fe80::/10</td>
                      <td className="py-3 px-4 font-mono">169.254.0.0/16</td>
                      <td className="py-3 px-4">Link-Local (obligatoire sur chaque interface, NDP/SLAAC)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">fc00::/7 (fd00::/8)</td>
                      <td className="py-3 px-4 font-mono">10.0.0.0/8 · 192.168/16</td>
                      <td className="py-3 px-4">ULA (Unique Local Address — réseau privé interne)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">2000::/3</td>
                      <td className="py-3 px-4 font-mono">IPv4 publiques</td>
                      <td className="py-3 px-4">Unicast Globales routables sur Internet (DNS AAAA)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {island.id === 22 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Checklist OWASP API Security, OAuth 2.0 &amp; JWT
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Contrôle</th>
                      <th className="py-3 px-4 font-semibold">Bonne pratique</th>
                      <th className="py-3 px-4 font-semibold">Attaque bloquée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">OAuth 2.0 + PKCE</td>
                      <td className="py-3 px-4">Authorization Code + code_challenge SHA-256</td>
                      <td className="py-3 px-4">Vol de code d&apos;autorisation (SPA / Mobile)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">Signature JWT RS256</td>
                      <td className="py-3 px-4">Liste blanche d&apos;algorithmes + vérification JWKS/exp</td>
                      <td className="py-3 px-4">Falsification alg:none &amp; rejeu de jeton expiré</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">Contrôle IDOR/BOLA</td>
                      <td className="py-3 px-4">Vérifier resource.ownerId === jwt.sub côté serveur</td>
                      <td className="py-3 px-4">Accès aux données d&apos;un autre client par changement d&apos;ID</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">Rate Limiting</td>
                      <td className="py-3 px-4">Quotas par IP/utilisateur (HTTP 429) + Refresh HttpOnly</td>
                      <td className="py-3 px-4">Scraping massif, credential stuffing &amp; vol XSS</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Contextual GemiBot */}
      <GemiBotGuide
        contextLabel={`Indices pour ${island.title}`}
        hints={island.gemiBotHints}
      />

      {/* Footer Prev / Next Island */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        {prevIsland ? (
          <button
            type="button"
            onClick={() => {
              playClick();
              onSelectIsland(prevIsland.id);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Étape {stepNumber - 1} : {prevIsland.title.replace(/^\d+\.\s*/, '')}
          </button>
        ) : (
          <div />
        )}

        {nextIsland ? (
          <button
            type="button"
            onClick={() => {
              playClick();
              onSelectIsland(nextIsland.id);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
          >
            Étape {stepNumber + 1} : {nextIsland.title.replace(/^\d+\.\s*/, '')}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              playClick();
              onBackToMap();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
          >
            Voir mon bilan d&apos;Archipel
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
