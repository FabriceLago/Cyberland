import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Lock, Unlock, Play, RotateCcw, CheckCircle2 } from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island3FirewallGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

interface IncomingPacket {
  id: number;
  sourceIp: string;
  protocol: 'HTTPS' | 'HTTP' | 'TELNET' | 'UDP' | 'SSH';
  port: number;
  encrypted: boolean;
  payload: string;
  shouldAllow: boolean;
  reason: string;
}

const PACKET_WAVE: IncomingPacket[] = [
  {
    id: 1,
    sourceIp: '192.168.1.24',
    protocol: 'HTTPS',
    port: 443,
    encrypted: true,
    payload: 'GET /carte-archipel (Certificat TLS valide)',
    shouldAllow: true,
    reason: 'Trafic web HTTPS chiffré légitime sur le port standard 443.',
  },
  {
    id: 2,
    sourceIp: '45.83.21.9',
    protocol: 'TELNET',
    port: 23,
    encrypted: false,
    payload: 'LOGIN root / PASS 123456 (en clair !)',
    shouldAllow: false,
    reason: 'Port 23 (Telnet) non chiffré : vulnérabilité critique à bloquer.',
  },
  {
    id: 3,
    sourceIp: '10.0.2.11',
    protocol: 'UDP',
    port: 5004,
    encrypted: true,
    payload: 'Flux audio en direct — Tour de contrôle',
    shouldAllow: true,
    reason: 'Flux média UDP interne autorisé pour la communication temps réel.',
  },
  {
    id: 4,
    sourceIp: '185.199.4.77',
    protocol: 'HTTP',
    port: 80,
    encrypted: false,
    payload: "POST /login?user=admin' OR '1'='1 (Injection SQL)",
    shouldAllow: false,
    reason: 'Paquet corrompu contenant une tentative d’injection SQL non chiffrée.',
  },
  {
    id: 5,
    sourceIp: '172.16.0.18',
    protocol: 'HTTPS',
    port: 443,
    encrypted: true,
    payload: 'Sync météo Cloud · Paquet signé',
    shouldAllow: true,
    reason: 'Connexion HTTPS chiffrée conforme sur le port 443.',
  },
  {
    id: 6,
    sourceIp: '91.214.12.66',
    protocol: 'TELNET',
    port: 23,
    encrypted: false,
    payload: 'Scan de commandes système distantes',
    shouldAllow: false,
    reason: 'Tentative d’accès Telnet en clair sur le port 23.',
  },
  {
    id: 7,
    sourceIp: '203.0.113.5',
    protocol: 'SSH',
    port: 22,
    encrypted: true,
    payload: 'Brute-force 450 essais/sec (IP inconnue)',
    shouldAllow: false,
    reason: 'Attaque par force brute détectée depuis une IP externe suspecte.',
  },
  {
    id: 8,
    sourceIp: '192.168.1.42',
    protocol: 'HTTPS',
    port: 443,
    encrypted: true,
    payload: 'Sauvegarde chiffrée de l’Île des Palmiers',
    shouldAllow: true,
    reason: 'Transfert HTTPS légitime protégé par cadenas TLS.',
  },
];

export const Island3FirewallGame: React.FC<Island3FirewallGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [hp, setHp] = useState(3);
  const [score, setScore] = useState(0);
  const [autoBlockTelnet, setAutoBlockTelnet] = useState(false);
  const [log, setLog] = useState<string>(
    'Inspectez chaque paquet à l’entrée de la forteresse : autorisez les légitimes, bloquez les attaques.'
  );
  const [finished, setFinished] = useState<'none' | 'victory' | 'defeat'>('none');

  const currentPacket = PACKET_WAVE[index];

  const startGame = () => {
    playClick();
    setStarted(true);
    setIndex(0);
    setHp(3);
    setScore(0);
    setFinished('none');
    setLog('Pont-levis actif. Analysez le premier visiteur !');
  };

  const advanceWave = (nextIdx: number, nextHp: number, nextScore: number) => {
    if (nextHp <= 0) {
      playError();
      setFinished('defeat');
      return;
    }

    // Auto-block port 23 if firewall rule enabled
    let cursor = nextIdx;
    let updatedScore = nextScore;
    let autoNote = '';

    while (
      cursor < PACKET_WAVE.length &&
      autoBlockTelnet &&
      PACKET_WAVE[cursor].port === 23
    ) {
      updatedScore += 1;
      autoNote = ` (Règle Pare-feu : Port 23 Telnet #${PACKET_WAVE[cursor].id} bloqué automatiquement !)`;
      cursor += 1;
    }

    setScore(updatedScore);

    if (cursor >= PACKET_WAVE.length) {
      const stars = Math.max(1, Math.min(3, nextHp));
      playVictory();
      setFinished('victory');
      setLog(
        `Forteresse sécurisée (${stars}/3 étoiles) ! Tous les paquets ont été filtrés.${autoNote}`
      );
      onComplete(stars);
    } else {
      setIndex(cursor);
      if (autoNote) {
        setLog((prev) => prev + autoNote);
      }
    }
  };

  const handleDecision = (allow: boolean) => {
    if (!currentPacket || finished !== 'none') return;
    const isCorrect = allow === currentPacket.shouldAllow;
    if (isCorrect) {
      playSuccess();
      setLog(`Bonne décision : ${currentPacket.reason}`);
      advanceWave(index + 1, hp, score + 1);
    } else {
      playError();
      const nextHp = hp - 1;
      setHp(nextHp);
      setLog(`Erreur de filtrage ! ${currentPacket.reason}`);
      advanceWave(index + 1, nextHp, score);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Drawbridge Inspection Stage */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-semibold">Mini-jeu · Le Gardien du Pont-Levis</span>
          <div className="flex items-center gap-5 text-xs font-mono tabular-nums">
            <span>
              Paquet :{' '}
              <strong>
                {Math.min(index + 1, PACKET_WAVE.length)} / {PACKET_WAVE.length}
              </strong>
            </span>
            <span>
              Intégrité :{' '}
              <strong className={hp <= 1 ? 'text-red-300' : 'text-emerald-300'}>{hp} / 3</strong>
            </span>
          </div>
        </div>

        <div className="p-6 bg-[#EEF5FA] min-h-[340px] flex flex-col justify-center">
          {!started && (
            <div className="max-w-md mx-auto text-center space-y-4">
              <ShieldCheck className="w-10 h-10 text-sky-700 mx-auto" />
              <h3 className="font-display text-2xl font-bold text-slate-900">
                Défendez la Forteresse des Protocoles
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Des paquets se présentent au pont-levis. Vérifiez le port, le chiffrement et le
                contenu avant d&apos;autoriser ou de bloquer. Vous pouvez aussi activer des règles
                automatiques dans le pare-feu à droite.
              </p>
              <button
                type="button"
                onClick={startGame}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                Ouvrir le poste de garde
              </button>
            </div>
          )}

          {started && finished === 'none' && currentPacket && (
            <div className="space-y-5 max-w-xl mx-auto w-full">
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-xs text-slate-500">Visiteur entrant #{currentPacket.id}</p>
                    <p className="font-mono text-base font-bold text-slate-900">
                      Source : {currentPacket.sourceIp}
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-xs text-slate-500">Protocole &amp; Port</p>
                    <p className="text-base font-bold text-sky-800">
                      {currentPacket.protocol} : {currentPacket.port}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium">
                  {currentPacket.encrypted ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-800">
                      <Lock className="w-4 h-4" />
                      Connexion chiffrée (TLS / sécurisée)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-red-700">
                      <Unlock className="w-4 h-4" />
                      Données en clair (non chiffrées)
                    </span>
                  )}
                </div>

                <div className="p-3.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs break-words">
                  Contenu : {currentPacket.payload}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDecision(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Autoriser le passage
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision(false)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Bloquer au pont-levis
                </button>
              </div>
            </div>
          )}

          {finished !== 'none' && (
            <div className="max-w-md mx-auto text-center space-y-4">
              {finished === 'victory' ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              ) : (
                <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
              )}
              <h3 className="font-display text-2xl font-bold text-slate-900">
                {finished === 'victory' ? 'Forteresse protégée !' : 'Brèche dans le pare-feu'}
              </h3>
              <p className="text-sm text-slate-600">
                {finished === 'victory'
                  ? `Score : ${score}/${PACKET_WAVE.length} paquets bien traités. Badge Gardien de la Forteresse débloqué (+250 XP) !`
                  : 'Trop de menaces ont franchi le pont-levis ou de clients légitimes ont été bloqués.'}
              </p>
              <button
                type="button"
                onClick={startGame}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Recommencer la garde
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-white border-t border-slate-200 text-xs text-slate-700">
          {log}
        </div>
      </div>

      {/* Right Firewall Rules Panel */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-slate-900">Règles du Pare-feu</h3>
          <p className="text-xs text-slate-600">
            Configurez un filtre automatique et consultez le mémo des ports.
          </p>
        </div>

        <label className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={autoBlockTelnet}
            onChange={(e) => {
              playClick();
              setAutoBlockTelnet(e.target.checked);
            }}
            className="mt-0.5 w-4 h-4 accent-sky-700"
          />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-900">
              Bloquer automatiquement le port 23 (Telnet)
            </p>
            <p className="text-xs text-slate-600">
              Rejette instantanément les connexions Telnet non chiffrées.
            </p>
          </div>
        </label>

        <div className="space-y-2 text-xs">
          <p className="font-semibold text-slate-900">Mémo des ports courants</p>
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            <div className="py-2 flex justify-between">
              <span className="font-mono font-semibold text-emerald-800">443 · HTTPS</span>
              <span className="text-slate-600">Web chiffré (autorisé)</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="font-mono font-semibold text-sky-800">5004 · UDP</span>
              <span className="text-slate-600">Flux audio/vidéo direct</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="font-mono font-semibold text-amber-800">22 · SSH</span>
              <span className="text-slate-600">Admin chiffrée (vigilance brute-force)</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="font-mono font-semibold text-red-700">23 · Telnet</span>
              <span className="text-slate-600">Obsolète en clair (bloquer)</span>
            </div>
          </div>
        </div>

        {isCompleted && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
            Badge <strong>Gardien de la Forteresse</strong> validé !
          </div>
        )}
      </div>
    </div>
  );
};
