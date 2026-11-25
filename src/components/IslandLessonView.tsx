import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Film, Gamepad2, BookOpen, Star, Lock, Terminal, ShieldCheck, ExternalLink, Server, FileSearch } from 'lucide-react';
import {
  ASSETS,
  CareerTrack,
  getAnalystPhaseForIsland,
  getNumberedCourseName,
  getOrderedIslandsForTrack,
  getShortNumberedCourseName,
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
import { VpnConfigLiveLab } from './labs/VpnConfigLiveLab';
import { ServerConfigLiveLab } from './labs/ServerConfigLiveLab';
import { ExpertAdvancedLiveLab } from './labs/ExpertAdvancedLiveLab';
import { ADVANCED_COURSE_GUIDES, AdvancedLabId } from '../data/advancedCoursesData';
import { getMissionForIsland } from '../data/proMissionsData';
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
  onOpenVpnLab?: () => void;
  onOpenServerLab?: () => void;
  onOpenAdvancedLab?: (labId: AdvancedLabId) => void;
  onOpenMission?: (missionId: string) => void;
  onAwardLabXp?: (xp: number) => void;
}

type ModuleTab = 'animation' | 'game' | 'notions' | 'live-lab';

export const IslandLessonView: React.FC<IslandLessonViewProps> = ({
  island,
  selectedTrackId = 'all',
  completedIslands,
  starsByIsland,
  defaultSpeechRate,
  onCompleteIsland,
  onSelectIsland,
  onBackToMap,
  onOpenVpnLab,
  onOpenServerLab,
  onOpenAdvancedLab,
  onOpenMission,
  onAwardLabXp,
}) => {
  const advancedGuide = ADVANCED_COURSE_GUIDES[island.id];
  const linkedMission = getMissionForIsland(island.id);
  const [activeTab, setActiveTab] = useState<ModuleTab>(advancedGuide ? 'notions' : 'animation');
  const [coverErr, setCoverErr] = useState(false);

  useEffect(() => {
    setActiveTab(ADVANCED_COURSE_GUIDES[island.id] ? 'notions' : 'animation');
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
      : island.id === 29
      ? ASSETS.serverFirewallCover
      : island.id === 30
      ? ASSETS.azureMonitorTowerCover
      : island.id === 31
      ? ASSETS.adCitadelCover
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

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg overflow-x-auto max-w-full">
          {orderedIslands.map((item) => {
            const done = completedIslands.includes(item.id);
            const active = item.id === island.id;
            return (
              <button
                key={item.id}
                type="button"
                title={getNumberedCourseName(item, selectedTrackId)}
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
                {getShortNumberedCourseName(item, selectedTrackId)} {done ? '✓' : ''}
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
              Cours {String(stepNumber).padStart(2, '0')}/{orderedIslands.length}
            </span>
            {currentPhase && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {currentPhase.title.replace(/^Palier \d+\s*·\s*/, '')}
                </span>
              </>
            )}
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
            {getNumberedCourseName(island, selectedTrackId)}
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
          {(advancedGuide
            ? [
                {
                  id: 'notions' as ModuleTab,
                  label: '1. Cours complet (6 étapes)',
                  icon: BookOpen,
                },
                {
                  id: 'live-lab' as ModuleTab,
                  label: '2. Lab temps réel · Validation 3★',
                  icon: Terminal,
                },
              ]
            : [
                { id: 'animation' as ModuleTab, label: `1. Animation · ${island.videoDuration}`, icon: Film },
                { id: 'game' as ModuleTab, label: `2. Mini-jeu · ${island.gameTitle}`, icon: Gamepad2 },
                {
                  id: 'notions' as ModuleTab,
                  label:
                    island.id === 18
                      ? '3. Cours VPN (Création & Config)'
                      : island.id === 19
                        ? '3. Cours Serveur (Création & Config)'
                        : '3. Fiche de notions',
                  icon: BookOpen,
                },
                ...(island.id === 18
                  ? [{ id: 'live-lab' as ModuleTab, label: '4. Lab VPN temps réel', icon: Lock }]
                  : island.id === 19
                    ? [{ id: 'live-lab' as ModuleTab, label: '4. Lab Serveur temps réel', icon: Server }]
                    : []),
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
            <div className="space-y-8 pt-4 border-t border-slate-200 dark:border-slate-800">
              {/* Step-by-step VPN Creation & Configuration Course */}
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-cyan-400">
                      Cours pratique complet · Déploiement terrain Linux / WireGuard
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                      Créer et Configurer un Serveur VPN WireGuard de A à Z
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setActiveTab('live-lab');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs sm:text-sm font-bold shadow-sm transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      Ouvrir le Lab VPN temps réel
                    </button>
                    {onOpenVpnLab && (
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          onOpenVpnLab();
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Plein écran (Hub Labs)
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Un VPN d&apos;entreprise repose sur une passerelle Linux exposée sur un unique port UDP (par défaut{' '}
                  <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">51820/udp</code>
                  ). Suivez ces 6 étapes dans l&apos;ordre exact d&apos;un déploiement en production, puis reproduisez-les immédiatement dans le laboratoire temps réel.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Step 1 */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">
                      <Terminal className="w-4 h-4 shrink-0" />
                      ÉTAPE 1 · Installer WireGuard &amp; générer les clés Curve25519
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      On verrouille les droits avec <code className="font-mono">umask 077</code> (lecture réservée à <code className="font-mono">root</code>), puis on génère la paire serveur, la paire client et une clé pré-partagée (<code className="font-mono">psk</code>) post-quantique.
                    </p>
                    <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`sudo apt update && sudo apt install -y wireguard iptables
cd /etc/wireguard && umask 077
wg genkey | tee server_private.key | wg pubkey > server_public.key
wg genkey | tee client_private.key | wg pubkey > client_public.key
wg genpsk > client.psk`}
                    </pre>
                  </div>

                  {/* Step 2 */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">
                      <Terminal className="w-4 h-4 shrink-0" />
                      ÉTAPE 2 · Configurer le serveur (/etc/wireguard/wg0.conf)
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      La section <code className="font-mono">[Interface]</code> définit l&apos;IP tunnel du serveur (<code className="font-mono">10.10.0.1/24</code>), le port UDP et les règles NAT <code className="font-mono">PostUp</code>/<code className="font-mono">PostDown</code>. Chaque poste autorisé possède un bloc <code className="font-mono">[Peer]</code>.
                    </p>
                    <pre className="p-3 rounded-lg bg-slate-900 text-sky-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`[Interface]
Address = 10.10.0.1/24
ListenPort = 51820
PrivateKey = <SERVER_PRIVATE_KEY>
PostUp = iptables -t nat -A POSTROUTING -s 10.10.0.0/24 -o eth0 -j MASQUERADE
PostDown = iptables -t nat -D POSTROUTING -s 10.10.0.0/24 -o eth0 -j MASQUERADE

[Peer]
PublicKey = <CLIENT_PUBLIC_KEY>
PresharedKey = <CLIENT_PSK>
AllowedIPs = 10.10.0.2/32`}
                    </pre>
                  </div>

                  {/* Step 3 */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      ÉTAPE 3 · Activer le routage noyau (ip_forward) &amp; UFW
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Par défaut, Linux ne transfère pas les paquets entre <code className="font-mono">wg0</code> et <code className="font-mono">eth0</code>. Activez <code className="font-mono">ip_forward</code> et n&apos;ouvrez que le port UDP WireGuard sur le pare-feu.
                    </p>
                    <pre className="p-3 rounded-lg bg-slate-900 text-amber-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`echo "net.ipv4.ip_forward=1" | sudo tee /etc/sysctl.d/99-wireguard.conf
sudo sysctl -p /etc/sysctl.d/99-wireguard.conf

sudo ufw default deny incoming
sudo ufw allow 51820/udp comment "WireGuard VPN"
sudo ufw enable`}
                    </pre>
                  </div>

                  {/* Step 4 */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">
                      <Lock className="w-4 h-4 shrink-0" />
                      ÉTAPE 4 · Profil client (Full-Tunnel vs Split-Tunnel &amp; DNS)
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Utilisez <code className="font-mono">AllowedIPs = 0.0.0.0/0, ::/0</code> sur Wi-Fi public (Full-Tunnel) et forcez un <code className="font-mono">DNS</code> interne pour éliminer les fuites DNS. <code className="font-mono">PersistentKeepalive = 25</code> maintient l&apos;ouverture NAT.
                    </p>
                    <pre className="p-3 rounded-lg bg-slate-900 text-cyan-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`[Interface]
PrivateKey = <CLIENT_PRIVATE_KEY>
Address = 10.10.0.2/32
DNS = 10.10.0.1

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
PresharedKey = <CLIENT_PSK>
Endpoint = vpn.cyberland.fr:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25`}
                    </pre>
                  </div>

                  {/* Step 5 */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">
                      <Terminal className="w-4 h-4 shrink-0" />
                      ÉTAPE 5 · Démarrer l&apos;interface &amp; rendre persistant
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Montez le tunnel avec <code className="font-mono">wg-quick</code> et activez le service systemd pour un redémarrage automatique après reboot serveur.
                    </p>
                    <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`sudo chmod 600 /etc/wireguard/wg0.conf
sudo wg-quick up wg0
sudo systemctl enable wg-quick@wg0`}
                    </pre>
                  </div>

                  {/* Step 6 */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      ÉTAPE 6 · Diagnostiquer &amp; auditer en temps réel
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Vérifiez la présence d&apos;un <code className="font-mono">latest handshake</code> récent (&lt; 2 min), l&apos;IP publique de sortie et l&apos;absence de fuite DNS.
                    </p>
                    <pre className="p-3 rounded-lg bg-slate-900 text-violet-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`sudo wg show                   # Vérifie handshake & octets TX/RX
ping -c 3 192.168.10.50        # Teste l'accès au LAN interne
curl -s https://ifconfig.me    # Doit afficher l'IP du serveur VPN
dig +short intranet.corp       # Vérifie que le DNS passe par 10.10.0.1`}
                    </pre>
                  </div>
                </div>

                {/* Troubleshooting quick table */}
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/25 p-4 space-y-2">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Réflexes Analyste &amp; Dépannage rapide (Pannes VPN classiques)
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <li className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white block">Aucun handshake</span>
                      Port UDP bloqué par UFW/Cloud Security Group, ou mauvaise <code className="font-mono">PublicKey</code> / <code className="font-mono">Endpoint</code>.
                    </li>
                    <li className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white block">Handshake OK mais pas d&apos;Internet</span>
                      <code className="font-mono">net.ipv4.ip_forward=1</code> oublié ou règle <code className="font-mono">iptables MASQUERADE</code> absente.
                    </li>
                    <li className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white block">Fuite DNS sur Wi-Fi public</span>
                      Directive <code className="font-mono">DNS = 10.10.0.1</code> absente du client : les noms de domaines partent en clair vers le FAI.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Existing comparison table */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
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
            </div>
          )}

          {island.id === 19 && (
            <div className="space-y-8 pt-4 border-t border-slate-200 dark:border-slate-800">
              {/* Complete 6-Step Server Creation & Configuration Course */}
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-cyan-400">
                      Cours pratique complet · Provisioning &amp; Durcissement Linux Production
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                      Créer, Configurer et Sécuriser un Serveur Linux de A à Z
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setActiveTab('live-lab');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs sm:text-sm font-bold shadow-sm transition-colors"
                    >
                      <Server className="w-4 h-4" />
                      Ouvrir le Lab Serveur temps réel
                    </button>
                    {onOpenServerLab && (
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          onOpenServerLab();
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Plein écran (Hub Labs)
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Un serveur exposé sur Internet subit ses premiers scans automatisés en moins de 60 secondes. Suivez cette méthode terrain en 6 étapes — de la création de l&apos;instance Linux LTS jusqu&apos;à l&apos;audit{' '}
                  <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">nmap</code>
                  — puis appliquez-la immédiatement dans le laboratoire temps réel.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Step 1 */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">
                      <Server className="w-4 h-4 shrink-0" />
                      ÉTAPE 1 · Provisionner l&apos;OS LTS, Hostname &amp; mises à jour
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Déployez une VM/VPS sous <strong>Ubuntu 24.04 LTS</strong> ou <strong>Debian 12</strong> avec IP statique, pointez un enregistrement DNS <code className="font-mono">A</code> vers cette IP, nommez l&apos;hôte et patchez l&apos;OS.
                    </p>
                    <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`sudo hostnamectl set-hostname srv-web-prod-01
sudo timedatectl set-timezone Europe/Paris
sudo apt update && sudo apt upgrade -y
sudo apt install -y ufw fail2ban nginx certbot python3-certbot-nginx`}
                    </pre>
                  </div>

                  {/* Step 2 */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">
                      <Terminal className="w-4 h-4 shrink-0" />
                      ÉTAPE 2 · Créer le compte sudo &amp; déployer la clé SSH Ed25519
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Ne travaillez jamais au quotidien en <code className="font-mono">root</code>. Créez un utilisateur dédié (<code className="font-mono">deploy</code>) et copiez votre clé publique Ed25519 depuis votre poste.
                    </p>
                    <pre className="p-3 rounded-lg bg-slate-900 text-sky-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`# Sur le serveur :
sudo adduser deploy && sudo usermod -aG sudo deploy

# Depuis votre poste administrateur :
ssh-keygen -t ed25519 -C "admin@cyberland"
ssh-copy-id deploy@203.0.113.42`}
                    </pre>
                  </div>

                  {/* Step 3 */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">
                      <Lock className="w-4 h-4 shrink-0" />
                      ÉTAPE 3 · Durcir SSH (/etc/ssh/sshd_config.d/99-hardening.conf)
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Une fois la connexion par clé vérifiée dans un second terminal, coupez <code className="font-mono">root</code> et les mots de passe, puis validez la syntaxe avec <code className="font-mono">sshd -t</code> avant de recharger.
                    </p>
                    <pre className="p-3 rounded-lg bg-slate-900 text-amber-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers deploy

# Vérifier puis recharger sans couper la session :
sudo sshd -t && sudo systemctl reload ssh
sudo systemctl enable --now fail2ban`}
                    </pre>
                  </div>

                  {/* Step 4 */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">
                      <Terminal className="w-4 h-4 shrink-0" />
                      ÉTAPE 4 · Service applicatif systemd isolé sur 127.0.0.1:3000
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      L&apos;application tourne sous <code className="font-mono">deploy</code>, redémarre automatiquement en cas de crash et n&apos;écoute que sur <code className="font-mono">127.0.0.1</code> (boucle locale).
                    </p>
                    <pre className="p-3 rounded-lg bg-slate-900 text-cyan-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`# /etc/systemd/system/cyberapp.service
[Service]
User=deploy
Environment=HOST=127.0.0.1
Environment=PORT=3000
ExecStart=/usr/bin/node /srv/cyberapp/server.js
Restart=always
NoNewPrivileges=true

sudo systemctl daemon-reload && sudo systemctl enable --now cyberapp`}
                    </pre>
                  </div>

                  {/* Step 5 */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      ÉTAPE 5 · Reverse Proxy Nginx &amp; certificat HTTPS Let&apos;s Encrypt
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Nginx expose le domaine en HTTPS (TLS 1.3), ajoute les en-têtes HSTS et transmet les requêtes au backend local. Certbot automatise le certificat et son renouvellement.
                    </p>
                    <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`server {
    listen 80;
    server_name app.cyberland.fr;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d app.cyberland.fr`}
                    </pre>
                  </div>

                  {/* Step 6 */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      ÉTAPE 6 · Pare-feu UFW (Deny by Default) &amp; Audit en direct
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Bloquez tout par défaut, autorisez uniquement SSH (restreint), 80 et 443, gardez PostgreSQL (:5432) sur le réseau privé et vérifiez les ports ouverts.
                    </p>
                    <pre className="p-3 rounded-lg bg-slate-900 text-violet-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`sudo ufw default deny incoming
sudo ufw allow from 198.51.100.10 to any port 22 proto tcp
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw enable

sudo ss -tulpn                         # Vérifie les sockets locales
curl -I https://app.cyberland.fr       # Vérifie HTTP/2 200 + HSTS
nmap -Pn 203.0.113.42                  # Confirme 0 port sensible exposé`}
                    </pre>
                  </div>
                </div>

                {/* Admin Troubleshooting Box */}
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/25 p-4 space-y-2">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Réflexes Admin &amp; Incidents Serveur classiques
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <li className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white block">Erreur 502 Bad Gateway</span>
                      Nginx fonctionne mais le service backend (<code className="font-mono">cyberapp.service</code>) est arrêté ou écoute sur un autre port. Vérifiez <code className="font-mono">journalctl -u cyberapp -n 50</code>.
                    </li>
                    <li className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white block">Lockout SSH après UFW</span>
                      Ne lancez jamais <code className="font-mono">ufw enable</code> sans avoir vérifié <code className="font-mono">ufw allow 22/tcp</code> au préalable.
                    </li>
                    <li className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white block">Base de données exposée</span>
                      Si <code className="font-mono">ss -tulpn</code> affiche <code className="font-mono">0.0.0.0:5432</code>, restreignez <code className="font-mono">listen_addresses</code> au LAN privé et bloquez 5432 côté WAN.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Existing Checklist Table */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
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
          {advancedGuide && (
            <div className="space-y-8 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-cyan-400">
                      {advancedGuide.kicker}
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {advancedGuide.heading}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setActiveTab('live-lab');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs sm:text-sm font-bold shadow-sm transition-colors whitespace-nowrap"
                    >
                      <Terminal className="w-4 h-4 shrink-0" />
                      {advancedGuide.labButtonLabel}
                    </button>
                    {onOpenAdvancedLab && (
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          onOpenAdvancedLab(advancedGuide.labId);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        Plein écran (Hub Labs)
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {advancedGuide.intro}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {advancedGuide.steps.map((step) => {
                    const codeColor =
                      step.accent === 'sky'
                        ? 'text-sky-200'
                        : step.accent === 'amber'
                          ? 'text-amber-200'
                          : step.accent === 'cyan'
                            ? 'text-cyan-200'
                            : step.accent === 'violet'
                              ? 'text-violet-200'
                              : 'text-emerald-300';
                    return (
                      <div
                        key={step.stepTitle}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5"
                      >
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">
                          <Terminal className="w-4 h-4 shrink-0" />
                          <span>{step.stepTitle}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {step.explanation}
                        </p>
                        <pre
                          className={`p-3 rounded-lg bg-slate-900 ${codeColor} font-mono text-[11px] overflow-x-auto leading-relaxed`}
                        >
                          {step.code}
                        </pre>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-amber-300/70 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-900 dark:text-amber-300">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>{advancedGuide.troubleshootingTitle}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {advancedGuide.troubleshooting.map((tip) => (
                      <div
                        key={tip.symptom}
                        className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-amber-200/80 dark:border-amber-900/60 space-y-1"
                      >
                        <p className="font-bold text-slate-900 dark:text-slate-100">{tip.symptom}</p>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{tip.fix}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                    {advancedGuide.tableTitle}
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4 font-semibold">{advancedGuide.tableHeaders[0]}</th>
                          <th className="py-3 px-4 font-semibold">{advancedGuide.tableHeaders[1]}</th>
                          <th className="py-3 px-4 font-semibold">{advancedGuide.tableHeaders[2]}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {advancedGuide.tableRows.map((row) => (
                          <tr key={row.col1}>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                              {row.col1}
                            </td>
                            <td className="py-3 px-4">{row.col2}</td>
                            <td className="py-3 px-4">{row.col3}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'live-lab' && island.id === 18 && (
        <section className="space-y-4">
          <VpnConfigLiveLab onCompleteLab={() => onAwardLabXp?.(95)} />
        </section>
      )}

      {activeTab === 'live-lab' && island.id === 19 && (
        <section className="space-y-4">
          <ServerConfigLiveLab onCompleteLab={() => onAwardLabXp?.(100)} />
        </section>
      )}

      {activeTab === 'live-lab' && advancedGuide && (
        <section className="space-y-4">
          <ExpertAdvancedLiveLab
            key={advancedGuide.labId}
            labId={advancedGuide.labId}
            onCompleteLab={() => {
              onCompleteIsland(island.id, 3);
              onAwardLabXp?.(110);
            }}
          />
        </section>
      )}

      {/* Operational Bridge: Apply Course Theory on a Real SOC Incident */}
      {onOpenMission && linkedMission && (
        <section className="rounded-2xl border border-slate-200 dark:border-cyan-500/35 bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 text-xs font-mono tabular-nums text-sky-700 dark:text-cyan-400">
              <span className="font-bold">Mise en pratique terrain · {linkedMission.ticketId}</span>
              <span aria-hidden="true">·</span>
              <span>{linkedMission.severity}</span>
              <span aria-hidden="true">·</span>
              <span>{linkedMission.logs.length} journaux SIEM</span>
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              {linkedMission.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Passez de la théorie à l&apos;investigation réelle chez {linkedMission.organization} :
              corrélez les journaux bruts, extrayez les IOC en ligne de commande et déployez la règle
              Sigma (+{linkedMission.xpReward} XP).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playClick();
              onOpenMission(linkedMission.id);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 transition-colors whitespace-nowrap shrink-0"
          >
            <FileSearch className="w-4 h-4 shrink-0" />
            Enquêter sur cet incident
          </button>
        </section>
      )}

      {/* Contextual GemiBot */}
      <GemiBotGuide
        contextLabel={`Indices pour ${getNumberedCourseName(island, selectedTrackId)}`}
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
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors tabular-nums"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {getNumberedCourseName(prevIsland, selectedTrackId)}
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
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors tabular-nums"
          >
            {getNumberedCourseName(nextIsland, selectedTrackId)}
            <ArrowRight className="w-4 h-4 shrink-0" />
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
