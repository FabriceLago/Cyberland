import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Star,
  Terminal,
  Eye,
  Filter,
  Search,
} from 'lucide-react';
import { PACKET_SCENARIO, matchesDisplayFilter } from '../labs/WiresharkTcpdumpLab';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island13WiresharkGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

interface SnifferMission {
  id: string;
  badge: string;
  title: string;
  brief: string;
  suggestedFilter: string;
  mode: 'wireshark' | 'tcpdump';
  options: { id: string; label: string; detail: string }[];
  correctId: string;
  explanation: string;
}

const MISSIONS: SnifferMission[] = [
  {
    id: 'ws-1',
    badge: 'Mission 1/5 · Filtre DNS (Wireshark)',
    title: 'Retrouver l’adresse IP résolue pour portail.cyberland.gem',
    brief:
      'Activez le filtre d’affichage « dns » dans la capture animée ci-dessous et lisez la réponse du serveur DNS (paquet #2).',
    suggestedFilter: 'dns',
    mode: 'wireshark',
    options: [
      { id: 'a', label: '192.168.1.53', detail: 'Adresse du serveur DNS local' },
      { id: 'b', label: '10.0.2.50', detail: 'Réponse A retournée pour portail.cyberland.gem' },
      { id: 'c', label: '185.220.101.9', detail: 'Adresse IP externe' },
      { id: 'd', label: '10.0.2.88', detail: 'Serveur HTTPS' },
    ],
    correctId: 'b',
    explanation:
      'Le filtre « dns » isole les paquets #1 (Query) et #2 (Response). La réponse DNS indique clairement A 10.0.2.50.',
  },
  {
    id: 'ws-2',
    badge: 'Mission 2/5 · Poignée de main TCP',
    title: 'Identifier la séquence complète du Three-Way Handshake',
    brief:
      'Filtrez les drapeaux de connexion avec « tcp.flags.syn == 1 » puis observez les paquets #3, #4 et #5 pour reconnaître l’ordre d’ouverture TCP.',
    suggestedFilter: 'tcp.flags.syn == 1',
    mode: 'wireshark',
    options: [
      { id: 'a', label: 'ACK → FIN → RST', detail: 'Fermeture de session' },
      { id: 'b', label: 'SYN → SYN, ACK → ACK', detail: 'Ouverture fiable en 3 étapes (paquets #3, #4, #5)' },
      { id: 'c', label: 'DNS → ICMP → HTTP', detail: 'Protocoles applicatifs' },
      { id: 'd', label: 'UDP → TLS → PING', detail: 'Sans connexion' },
    ],
    correctId: 'b',
    explanation:
      'Dans Wireshark, toute connexion TCP commence par le trio SYN (client), SYN-ACK (serveur), puis ACK (client).',
  },
  {
    id: 'ws-3',
    badge: 'Mission 3/5 · Fuite en clair (HTTP vs TLS)',
    title: 'Trouver le mot de passe exposé sur le port 80 non chiffré',
    brief:
      'Appliquez le filtre « http » et inspectez le paquet #6 (POST /login). Quel identifiant est lisible directement dans la trame ?',
    suggestedFilter: 'http',
    mode: 'wireshark',
    options: [
      { id: 'a', label: 'Aucun, HTTP port 80 chiffre automatiquement', detail: 'Faux : port 80 est en clair' },
      { id: 'b', label: 'user=camille & pass=Phare2026!', detail: 'Lisible directement dans le paquet #6 en HTTP' },
      { id: 'c', label: 'Uniquement chiffré en AES-256-GCM', detail: 'Ceci concerne le paquet #8 en TLS 1.3' },
      { id: 'd', label: 'admin / 123456', detail: 'Absent de la capture' },
    ],
    correctId: 'b',
    explanation:
      'Sur le port 80 (HTTP), Wireshark affiche l’intégralité du corps POST en clair (Phare2026!). Sur le port 443 (TLS 1.3, paquet #8), tout est chiffré.',
  },
  {
    id: 'ws-4',
    badge: 'Mission 4/5 · Alerte intrusion Telnet',
    title: 'Repérer la source du scan bloqué sur le port 23',
    brief:
      'Filtrez sur « tcp.port == 23 » pour isoler la tentative d’administration Telnet bloquée par le pare-feu (#11 et #12). Quelle IP externe a tenté d’entrer ?',
    suggestedFilter: 'tcp.port == 23',
    mode: 'wireshark',
    options: [
      { id: 'a', label: '192.168.1.24', detail: 'Poste légitime du réseau local' },
      { id: 'b', label: '185.220.101.9 (bloquée par RST, ACK)', detail: 'Source externe sur le port 23' },
      { id: 'c', label: '192.168.1.53', detail: 'Serveur DNS interne' },
      { id: 'd', label: '10.0.2.88', detail: 'Serveur HTTPS' },
    ],
    correctId: 'b',
    explanation:
      'Le paquet #11 montre un SYN venu de 185.220.101.9 vers le port 23 (Telnet), immédiatement rejeté par un RST, ACK (#12).',
  },
  {
    id: 'ws-5',
    badge: 'Mission 5/5 · Commande tcpdump serveur Linux',
    title: 'Composer la commande tcpdump idéale sur un serveur sans écran',
    brief:
      'Vous êtes connecté en SSH sur un serveur Linux de production. Vous voulez capturer uniquement le trafic HTTPS (port 443) sur eth0 sans résolution DNS lente, et enregistrer le fichier pour l’ouvrir dans Wireshark.',
    suggestedFilter: 'tls',
    mode: 'tcpdump',
    options: [
      {
        id: 'a',
        label: 'sudo tcpdump -i eth0 -nn port 443 -w audit.pcap',
        detail: 'Interface eth0, IP/ports numériques (-nn), filtre BPF port 443, écriture .pcap',
      },
      {
        id: 'b',
        label: 'ping -c 443 eth0 > audit.txt',
        detail: 'Envoie seulement des ICMP ping',
      },
      {
        id: 'c',
        label: 'sudo tcpdump --delete-all port 80',
        detail: 'Option inexistante',
      },
      {
        id: 'd',
        label: 'nslookup 443 eth0',
        detail: 'Sert uniquement aux requêtes DNS',
      },
    ],
    correctId: 'a',
    explanation:
      'C’est le workflow standard des ingénieurs : tcpdump capture légèrement en CLI (-i eth0 -nn port 443 -w audit.pcap) puis on analyse audit.pcap dans Wireshark !',
  },
];

export const Island13WiresharkGame: React.FC<Island13WiresharkGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [missionIdx, setMissionIdx] = useState(0);
  const [filterInput, setFilterInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const mission = MISSIONS[missionIdx];
  const filteredPackets = PACKET_SCENARIO.filter(
    (p) => matchesDisplayFilter(p, filterInput).match
  );

  const handleValidate = () => {
    if (!selectedId || validated) return;
    setValidated(true);
    const isRight = selectedId === mission.correctId;
    if (isRight) {
      playSuccess();
      setScore((s) => s + 1);
    } else {
      playError();
    }
  };

  const handleNext = () => {
    playClick();
    if (missionIdx < MISSIONS.length - 1) {
      setMissionIdx((i) => i + 1);
      setSelectedId(null);
      setValidated(false);
      setFilterInput('');
    } else {
      const stars = score >= 5 ? 3 : score >= 3 ? 2 : 1;
      playVictory();
      setFinished(true);
      onComplete(stars);
    }
  };

  const handleRestart = () => {
    playClick();
    setMissionIdx(0);
    setFilterInput('');
    setSelectedId(null);
    setValidated(false);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const stars = score >= 5 ? 3 : score >= 3 ? 2 : 1;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-5 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-8 h-8 ${
                s <= stars ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-700'
              }`}
            />
          ))}
        </div>
        <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
          Enquête réseau bouclée — {score} / {MISSIONS.length} réussies !
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Vous maîtrisez la capture <code className="font-mono">tcpdump</code> et la dissection de
          trames <strong>Wireshark</strong>. Badge <strong>« Analyste de Trames »</strong> débloqué !
        </p>
        <button
          type="button"
          onClick={handleRestart}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Rejouer les 5 enquêtes
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 7 cols: Live Mini Wireshark / tcpdump Console */}
      <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            {mission.mode === 'wireshark' ? (
              <Eye className="w-4 h-4 text-sky-400" />
            ) : (
              <Terminal className="w-4 h-4 text-emerald-400" />
            )}
            Console d&apos;enquête · capture_cyberland.pcap
          </span>
          <span className="font-mono text-xs text-slate-300 tabular-nums">
            {filteredPackets.length} / {PACKET_SCENARIO.length} paquets
          </span>
        </div>

        <div className="p-4 space-y-3">
          {/* Interactive Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
                placeholder="Saisissez un filtre Wireshark (ex: dns, http, tcp.port == 23)"
                className="w-full pl-9 pr-3 py-2 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                playClick();
                setFilterInput(mission.suggestedFilter);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-lg transition-colors whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5" />
              Appliquer « {mission.suggestedFilter} »
            </button>
          </div>

          {/* Packet Trace Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[320px] overflow-y-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0">
                <tr>
                  <th className="py-2 px-2.5">N°</th>
                  <th className="py-2 px-2.5">Source → Dest</th>
                  <th className="py-2 px-2.5">Proto</th>
                  <th className="py-2 px-2.5">Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPackets.map((pkt) => (
                  <tr
                    key={pkt.id}
                    className={
                      pkt.severity === 'danger'
                        ? 'bg-red-50/70 dark:bg-red-950/30 text-red-950 dark:text-red-200'
                        : pkt.severity === 'warning'
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200'
                        : pkt.severity === 'secure'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                    }
                  >
                    <td className="py-2 px-2.5 tabular-nums font-bold">#{pkt.id}</td>
                    <td className="py-2 px-2.5 whitespace-nowrap">
                      {pkt.srcIp} → {pkt.dstIp}
                    </td>
                    <td className="py-2 px-2.5 font-bold">{pkt.protocol}</td>
                    <td className="py-2 px-2.5">{pkt.info}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-950 text-emerald-300 font-mono text-[11px] rounded-xl p-3 border border-slate-800 space-y-1">
            <p className="text-slate-400">Aperçu équivalent tcpdump :</p>
            {filteredPackets.slice(0, 2).map((p) => (
              <p key={p.id} className="truncate">
                $ {p.tcpdumpLine}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Right 5 cols: Mission Prompt & Answer */}
      <aside className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{mission.badge}</span>
          <span className="font-mono font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
            Score : {score}/{MISSIONS.length} {isCompleted ? '· Déjà validée' : ''}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            {mission.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {mission.brief}
          </p>
        </div>

        <div className="space-y-2">
          {mission.options.map((opt) => {
            const chosen = selectedId === opt.id;
            const isCorrectOpt = opt.id === mission.correctId;
            let style =
              'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800';
            if (validated) {
              if (isCorrectOpt) {
                style =
                  'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200';
              } else if (chosen && !isCorrectOpt) {
                style =
                  'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-950 dark:text-red-200';
              }
            } else if (chosen) {
              style =
                'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-sky-950 dark:text-sky-100';
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={validated}
                onClick={() => {
                  playClick();
                  setSelectedId(opt.id);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start justify-between gap-3 ${style}`}
              >
                <div className="space-y-0.5">
                  <p className="font-mono text-xs font-bold">{opt.label}</p>
                  <p className="text-xs opacity-80">{opt.detail}</p>
                </div>
                {validated && isCorrectOpt && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                )}
                {validated && chosen && !isCorrectOpt && (
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {validated && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>Explication :</strong> {mission.explanation}
          </div>
        )}

        <div className="pt-1">
          {!validated ? (
            <button
              type="button"
              disabled={!selectedId}
              onClick={handleValidate}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-45 rounded-lg transition-colors"
            >
              Valider mon analyse
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
            >
              {missionIdx < MISSIONS.length - 1 ? 'Enquête suivante →' : 'Terminer et obtenir mon badge'}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
