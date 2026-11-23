import React, { useEffect, useState } from 'react';
import { Play, RotateCcw, Compass, Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { playClick, playError, playPacket, playSuccess, playVictory } from '../../utils/sound';

interface Island2PortGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

type DockId = 'nord' | 'est' | 'sud';
type GameState = 'TITLE_MENU' | 'PLAYING' | 'VICTORY' | 'GAME_OVER';

interface ShipPacket {
  id: number;
  domain?: string;
  ip: string;
  resolved: boolean;
  targetDock: DockId;
}

const TARGET_SHIPS = 8;
const MAX_QUEUE = 5;

const SHIP_POOL: Omit<ShipPacket, 'id'>[] = [
  { ip: '10.0.1.14', resolved: true, targetDock: 'nord' },
  { ip: '192.168.1.42', resolved: true, targetDock: 'est' },
  { domain: 'palmiers.gem', ip: '192.168.1.88', resolved: false, targetDock: 'est' },
  { ip: '172.16.0.9', resolved: true, targetDock: 'sud' },
  { domain: 'phare-nord.gem', ip: '10.0.4.21', resolved: false, targetDock: 'nord' },
  { ip: '192.168.1.15', resolved: true, targetDock: 'est' },
  { domain: 'marche-sud.gem', ip: '172.16.2.50', resolved: false, targetDock: 'sud' },
  { ip: '10.0.8.3', resolved: true, targetDock: 'nord' },
  { domain: 'atelier.gem', ip: '172.16.4.12', resolved: false, targetDock: 'sud' },
  { ip: '192.168.1.99', resolved: true, targetDock: 'est' },
];

export const Island2PortGame: React.FC<Island2PortGameProps> = ({ isCompleted, onComplete }) => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [queue, setQueue] = useState<ShipPacket[]>([]);
  const [routedCount, setRoutedCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [nextId, setNextId] = useState(1);
  const [lastLog, setLastLog] = useState<string>(
    'Consultez le préfixe IP de chaque bateau et cliquez sur le bon quai de destination.'
  );

  const startGame = () => {
    playClick();
    setQueue([
      { ...SHIP_POOL[0], id: 1 },
      { ...SHIP_POOL[1], id: 2 },
    ]);
    setNextId(3);
    setRoutedCount(0);
    setErrors(0);
    setGameState('PLAYING');
    setLastLog('Les navires arrivent dans la baie ! Aiguillez-les vers leur sous-réseau.');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const timer = window.setInterval(() => {
      setQueue((prev) => {
        if (prev.length >= MAX_QUEUE) {
          playError();
          setGameState('GAME_OVER');
          setLastLog('Le port a saturé (5 navires en attente). Relancez la partie !');
          return prev;
        }
        const template = SHIP_POOL[Math.floor(Math.random() * SHIP_POOL.length)];
        const spawned: ShipPacket = { ...template, id: Date.now() + Math.random() };
        return [...prev, spawned];
      });
    }, 3300);

    return () => window.clearInterval(timer);
  }, [gameState]);

  const activeShip = queue[0];

  const handleDnsLookup = () => {
    if (!activeShip || activeShip.resolved) return;
    playPacket();
    setQueue((prev) =>
      prev.map((ship, idx) => (idx === 0 ? { ...ship, resolved: true } : ship))
    );
    setLastLog(`Tour DNS : ${activeShip.domain} résolu en ${activeShip.ip} !`);
  };

  const handleRoute = (dock: DockId) => {
    if (gameState !== 'PLAYING' || !activeShip) return;

    if (!activeShip.resolved) {
      playError();
      setLastLog(
        `Impossible de router « ${activeShip.domain} » sans IP ! Cliquez d'abord sur la Tour DNS.`
      );
      return;
    }

    if (activeShip.targetDock === dock) {
      const nextRouted = routedCount + 1;
      setRoutedCount(nextRouted);
      setQueue((prev) => prev.slice(1));
      if (nextRouted >= TARGET_SHIPS) {
        const stars = errors === 0 ? 3 : errors <= 1 ? 2 : 1;
        playVictory();
        setGameState('VICTORY');
        setLastLog(
          `Parfait ! Tous les navires ont rejoint leur sous-réseau (${stars}/3 étoiles).`
        );
        onComplete(stars);
      } else {
        playSuccess();
        setLastLog(`Navire ${activeShip.ip} aiguillé correctement vers le Quai ${dock.toUpperCase()}.`);
      }
    } else {
      playError();
      setErrors((e) => e + 1);
      setLastLog(
        `Erreur de routage ! ${activeShip.ip} appartient au sous-réseau du Quai ${activeShip.targetDock.toUpperCase()}.`
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Port Arena */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-semibold">Mini-jeu · Aiguilleur du port</span>
          <div className="flex items-center gap-5 text-xs font-mono tabular-nums">
            <span>
              Aiguillés :{' '}
              <strong className="text-emerald-300">
                {routedCount} / {TARGET_SHIPS}
              </strong>
            </span>
            <span>
              File d&apos;attente :{' '}
              <strong className={queue.length >= 4 ? 'text-red-300' : 'text-sky-200'}>
                {queue.length} / {MAX_QUEUE}
              </strong>
            </span>
            <span>Erreurs : {errors}</span>
          </div>
        </div>

        <div className="p-6 bg-[#EEF5FA] min-h-[340px] flex flex-col justify-between gap-6">
          {gameState === 'TITLE_MENU' && (
            <div className="my-auto max-w-md mx-auto text-center space-y-4 py-6">
              <Compass className="w-10 h-10 text-sky-700 mx-auto" />
              <h3 className="font-display text-2xl font-bold text-slate-900">
                Prenez le contrôle des aiguillages
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Dirigez <strong>{TARGET_SHIPS} navires-paquets</strong> vers le bon sous-réseau
                avant que la file n&apos;atteigne {MAX_QUEUE} navires. Si un navire n&apos;affiche
                qu&apos;un nom de domaine (<code className="font-mono">.gem</code>), interrogez
                d&apos;abord la <strong>Tour DNS</strong> !
              </p>
              <button
                type="button"
                onClick={startGame}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                Démarrer le quart
              </button>
            </div>
          )}

          {gameState === 'PLAYING' && (
            <>
              {/* Active ship inspection & DNS tower */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {activeShip ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">
                        Navire en tête de file ({queue.length} en attente)
                      </p>
                      <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                        {activeShip.resolved ? activeShip.ip : activeShip.domain}
                      </p>
                      <p className="text-xs text-slate-600">
                        {activeShip.resolved
                          ? 'Adresse IP connue : sélectionnez le quai correspondant.'
                          : 'Nom de domaine détecté : résolution DNS requise avant aiguillage.'}
                      </p>
                    </div>
                    {!activeShip.resolved && (
                      <button
                        type="button"
                        onClick={handleDnsLookup}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-950 bg-amber-300 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <Search className="w-4 h-4" />
                        Interroger la Tour DNS
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-600">
                    En attente du prochain navire dans la baie...
                  </p>
                )}
              </div>

              {/* Queue visualization */}
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {queue.map((ship, idx) => (
                  <div
                    key={ship.id}
                    className={`px-3 py-2 rounded-lg border text-xs font-mono whitespace-nowrap shrink-0 ${
                      idx === 0
                        ? 'bg-sky-700 text-white border-sky-800 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {idx === 0 ? '▶ ' : ''}
                    {ship.resolved ? ship.ip : ship.domain}
                  </div>
                ))}
              </div>

              {/* 3 Routing Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { id: 'nord' as DockId, title: 'Quai Nord', subnet: '10.0.x.x' },
                    { id: 'est' as DockId, title: 'Quai Est', subnet: '192.168.x.x' },
                    { id: 'sud' as DockId, title: 'Quai Sud', subnet: '172.16.x.x' },
                  ]
                ).map((dock) => (
                  <button
                    key={dock.id}
                    type="button"
                    onClick={() => handleRoute(dock.id)}
                    className="p-4 bg-white border-2 border-slate-300 hover:border-sky-600 hover:bg-sky-50 rounded-xl text-left transition-colors space-y-1"
                  >
                    <p className="font-display text-base font-bold text-slate-900">{dock.title}</p>
                    <p className="font-mono text-xs font-semibold text-sky-700">
                      Sous-réseau {dock.subnet}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}

          {(gameState === 'VICTORY' || gameState === 'GAME_OVER') && (
            <div className="my-auto max-w-md mx-auto text-center space-y-4 py-6">
              {gameState === 'VICTORY' ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
              )}
              <h3 className="font-display text-2xl font-bold text-slate-900">
                {gameState === 'VICTORY' ? 'Port décongestionné !' : 'Saturation du port'}
              </h3>
              <p className="text-sm text-slate-600">
                {gameState === 'VICTORY'
                  ? `Vous avez aiguillé ${TARGET_SHIPS} paquets (${errors} erreur${
                      errors > 1 ? 's' : ''
                    }) et débloqué le badge Maître du Routage (+200 XP).`
                  : 'Trop de navires se sont accumulés en attente. Réessayez en résolvant vite les requêtes DNS !'}
              </p>
              <button
                type="button"
                onClick={startGame}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Rejouer
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-white border-t border-slate-200 text-xs text-slate-700">
          {lastLog}
        </div>
      </div>

      {/* Right Table de Routage Reference */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-slate-900">Table de routage du port</h3>
          <p className="text-xs text-slate-600">
            Un routeur lit le préfixe réseau de l&apos;adresse IP pour décider de la sortie.
          </p>
        </div>

        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 font-medium">Préfixe IP</th>
              <th className="py-2 font-medium">Destination</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            <tr>
              <td className="py-2.5 font-semibold text-slate-900">10.0.0.0/16</td>
              <td className="py-2.5 font-sans text-slate-700">Quai Nord</td>
            </tr>
            <tr>
              <td className="py-2.5 font-semibold text-slate-900">192.168.0.0/16</td>
              <td className="py-2.5 font-sans text-slate-700">Quai Est</td>
            </tr>
            <tr>
              <td className="py-2.5 font-semibold text-slate-900">172.16.0.0/16</td>
              <td className="py-2.5 font-sans text-slate-700">Quai Sud</td>
            </tr>
          </tbody>
        </table>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
          <p className="font-semibold text-slate-900">Règle DNS</p>
          <p>
            Tout nom de domaine finissant par <span className="font-mono">.gem</span> doit être
            traduit en IP via la Tour DNS avant de pouvoir être aiguillé.
          </p>
        </div>

        {isCompleted && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
            Badge <strong>Maître du Routage</strong> déjà obtenu. Vous pouvez rejouer pour améliorer
            votre précision !
          </div>
        )}
      </div>
    </div>
  );
};
