import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Star,
  ArrowRight,
  Layers,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island8OsiLayersGameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

interface OsiQuestion {
  id: string;
  itemLabel: string;
  context: string;
  correctLayer: number; // 1 to 7
  explanation: string;
}

const OSI_LAYERS = [
  { num: 7, name: 'Application', role: 'Interface & services (HTTPS, DNS, SMTP)', tcpip: 'Application' },
  { num: 6, name: 'Présentation', role: 'Encodage, compression & chiffrement TLS', tcpip: 'Application' },
  { num: 5, name: 'Session', role: 'Ouverture et maintien du dialogue', tcpip: 'Application' },
  { num: 4, name: 'Transport', role: 'Découpage en segments & ports (TCP / UDP)', tcpip: 'Transport' },
  { num: 3, name: 'Réseau', role: 'Adressage logique IP & routage', tcpip: 'Internet' },
  { num: 2, name: 'Liaison de données', role: 'Adresses MAC & commutation (Switch)', tcpip: 'Accès réseau' },
  { num: 1, name: 'Physique', role: 'Signaux électriques, lumière fibre, ondes Wi-Fi', tcpip: 'Accès réseau' },
];

const OSI_CHALLENGES: OsiQuestion[] = [
  {
    id: 'osi-1',
    itemLabel: 'Fibre optique & impulsions lumineuses (0 et 1)',
    context: 'Transport brut des bits sur le câble sous-marin entre deux îles.',
    correctLayer: 1,
    explanation:
      'La couche 1 (Physique) convertit les 0 et 1 en signaux électriques, lumineux (fibre) ou radio (Wi-Fi).',
  },
  {
    id: 'osi-2',
    itemLabel: 'Switch local & Adresse MAC (A4:5E:60:...)',
    context: 'Livraison d’une trame Ethernet entre deux cabanes du même village.',
    correctLayer: 2,
    explanation:
      'La couche 2 (Liaison) gère les trames locales et les adresses matérielles MAC lues par les commutateurs (Switch).',
  },
  {
    id: 'osi-3',
    itemLabel: 'Routeur & Adresse IP (192.168.1.42)',
    context: 'Aiguillage d’un paquet d’un sous-réseau vers un autre port de l’archipel.',
    correctLayer: 3,
    explanation:
      'La couche 3 (Réseau) assure l’adressage logique IP et le choix de l’itinéraire par les routeurs.',
  },
  {
    id: 'osi-4',
    itemLabel: 'Protocoles TCP / UDP & Numéros de port (443, 53)',
    context: 'Découpage du flux en segments numérotés avec contrôle d’erreurs ou temps réel.',
    correctLayer: 4,
    explanation:
      'La couche 4 (Transport) transporte les données de bout en bout via TCP (fiable) ou UDP (rapide) et identifie les ports.',
  },
  {
    id: 'osi-5',
    itemLabel: 'Chiffrement TLS & Compression des données',
    context: 'Traduction du message en format chiffré illisible avant son transport.',
    correctLayer: 6,
    explanation:
      'La couche 6 (Présentation) s’occupe du formatage, de l’encodage (UTF-8, JPEG), de la compression et du chiffrement.',
  },
  {
    id: 'osi-6',
    itemLabel: 'Navigateur Web (HTTPS) & Annuaire DNS',
    context: 'Interaction directe avec les logiciels utilisés par les habitants de Cyberland.',
    correctLayer: 7,
    explanation:
      'La couche 7 (Application) est la plus proche de l’utilisateur : HTTP/HTTPS, DNS, messagerie, FTP.',
  },
];

const INITIAL_ENCAP_ORDER = [
  { id: 'trame', label: 'Trame Ethernet (Couche 2 · MAC)', expectedIdx: 3 },
  { id: 'data', label: 'Données applicatives (Couche 7 · HTTPS)', expectedIdx: 0 },
  { id: 'paquet', label: 'Paquet IP (Couche 3 · Adresse IP)', expectedIdx: 2 },
  { id: 'segment', label: 'Segment TCP (Couche 4 · Port 443)', expectedIdx: 1 },
];

export const Island8OsiLayersGame: React.FC<Island8OsiLayersGameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'match' | 'encap' | 'done'>('match');
  const [qIdx, setQIdx] = useState(0);
  const [pickedLayer, setPickedLayer] = useState<number | null>(null);
  const [matchScore, setMatchScore] = useState(0);

  const [encapOrder, setEncapOrder] = useState(INITIAL_ENCAP_ORDER);
  const [encapChecked, setEncapChecked] = useState(false);
  const [encapPerfect, setEncapPerfect] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const currentQ = OSI_CHALLENGES[qIdx];

  const handlePickLayer = (layerNum: number) => {
    if (pickedLayer !== null) return;
    setPickedLayer(layerNum);
    if (layerNum === currentQ.correctLayer) {
      playSuccess();
      setMatchScore((s) => s + 1);
    } else {
      playError();
    }
  };

  const handleNextMatch = () => {
    playClick();
    if (qIdx + 1 < OSI_CHALLENGES.length) {
      setQIdx((i) => i + 1);
      setPickedLayer(null);
    } else {
      setPhase('encap');
    }
  };

  const moveItem = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= encapOrder.length) return;
    playClick();
    const copy = [...encapOrder];
    const [removed] = copy.splice(index, 1);
    copy.splice(target, 0, removed);
    setEncapOrder(copy);
    setEncapChecked(false);
  };

  const handleValidateEncap = () => {
    const isOrderCorrect = encapOrder.every((item, idx) => item.expectedIdx === idx);
    setEncapChecked(true);
    setEncapPerfect(isOrderCorrect);

    const totalPoints = matchScore + (isOrderCorrect ? 2 : 0); // max 8
    const passed = totalPoints >= 5;
    const stars = totalPoints === 8 ? 3 : totalPoints >= 6 ? 2 : passed ? 1 : 0;
    setEarnedStars(stars);

    if (isOrderCorrect || passed) {
      if (passed) {
        playVictory();
        onComplete(stars);
      } else {
        playSuccess();
      }
      setPhase('done');
    } else {
      playError();
    }
  };

  const handleReset = () => {
    playClick();
    setPhase('match');
    setQIdx(0);
    setPickedLayer(null);
    setMatchScore(0);
    setEncapOrder(INITIAL_ENCAP_ORDER);
    setEncapChecked(false);
    setEncapPerfect(false);
    setEarnedStars(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 65% Interactive 7-Layer Stack / Encapsulation Stage */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-semibold">
            Mini-jeu · Assembleur de Trames (Modèle OSI &amp; TCP/IP)
          </span>
          <span className="font-mono text-xs text-sky-200 tabular-nums">
            {phase === 'match'
              ? `Étape 1/2 · Carte ${qIdx + 1}/${OSI_CHALLENGES.length}`
              : phase === 'encap'
              ? 'Étape 2/2 · Ordre d’encapsulation'
              : `Bilan · ${matchScore}/${OSI_CHALLENGES.length} couches`}
          </span>
        </div>

        <div className="p-6 bg-[#EEF5FA] dark:bg-slate-800/70 space-y-5">
          {phase === 'match' && (
            <>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-2">
                <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                  Cliquez sur la bonne couche OSI ci-dessous pour classer cet élément :
                </p>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  {currentQ.itemLabel}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{currentQ.context}</p>
              </div>

              {/* Interactive 7-Layer Vertical Stack */}
              <div className="space-y-2">
                {OSI_LAYERS.map((layer) => {
                  const chosen = pickedLayer === layer.num;
                  const isCorrect = layer.num === currentQ.correctLayer;
                  let cls =
                    'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-sky-500 hover:bg-sky-50/70 dark:hover:bg-sky-950/40';
                  if (pickedLayer !== null) {
                    if (isCorrect) {
                      cls =
                        'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-200';
                    } else if (chosen && !isCorrect) {
                      cls =
                        'bg-red-50 dark:bg-red-950/50 border-red-400 text-red-950 dark:text-red-200';
                    } else {
                      cls =
                        'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={layer.num}
                      type="button"
                      disabled={pickedLayer !== null}
                      onClick={() => handlePickLayer(layer.num)}
                      className={`w-full px-4 py-3 rounded-xl border transition-colors flex flex-wrap items-center justify-between gap-3 text-left ${cls}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 tabular-nums">
                          L{layer.num}
                        </span>
                        <div>
                          <p className="text-sm font-bold">{layer.name}</p>
                          <p className="text-xs opacity-75">
                            Équivalent TCP/IP : {layer.tcpip}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {pickedLayer !== null && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        {pickedLayer !== null && chosen && !isCorrect && (
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {pickedLayer !== null && (
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    pickedLayer === currentQ.correctLayer
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                  }`}
                >
                  <p className="text-xs leading-relaxed">
                    <strong>
                      {pickedLayer === currentQ.correctLayer
                        ? 'Exact !'
                        : `Couche attendue : L${currentQ.correctLayer}.`}
                    </strong>{' '}
                    {currentQ.explanation}
                  </p>
                  <button
                    type="button"
                    onClick={handleNextMatch}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {qIdx + 1 < OSI_CHALLENGES.length ? 'Élément suivant' : 'Étape 2 : Encapsulation'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}

          {phase === 'encap' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-5">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                  Étape finale · Encapsulation (du haut vers le câble)
                </p>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  Remettez les 4 étapes d&apos;emballage dans l&apos;ordre d&apos;envoi
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Quand un habitant envoie un message, il part des <strong>Données</strong> en haut
                  puis s&apos;enveloppe couche par couche jusqu&apos;à la <strong>Trame</strong>.
                </p>
              </div>

              <div className="space-y-2.5">
                {encapOrder.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 tabular-nums">
                        #{idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveItem(idx, -1)}
                        aria-label="Monter"
                        className="p-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-35"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === encapOrder.length - 1}
                        onClick={() => moveItem(idx, 1)}
                        aria-label="Descendre"
                        className="p-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-35"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {encapChecked && !encapPerfect && (
                <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  L&apos;ordre n&apos;est pas encore bon ! Rappel : Données (L7) → Segment TCP (L4)
                  → Paquet IP (L3) → Trame Ethernet (L2).
                </p>
              )}

              <button
                type="button"
                onClick={handleValidateEncap}
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
              >
                Valider l&apos;encapsulation complète
              </button>
            </div>
          )}

          {phase === 'done' && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl p-6 space-y-4 text-emerald-950 dark:text-emerald-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl font-bold">
                    {earnedStars > 0
                      ? 'Labyrinthe des 7 couches maîtrisé !'
                      : 'Presque ! Réessayez pour décrocher le badge'}
                  </h3>
                  <p className="text-sm mt-1">
                    Couches identifiées : <strong>{matchScore}/{OSI_CHALLENGES.length}</strong> ·
                    Encapsulation : <strong>{encapPerfect ? 'Parfaite' : 'À revoir'}</strong>
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
                Rejouer l&apos;Assembleur de Trames
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right 35% Mnemonic & Scoring Deck */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-400">
            <Layers className="w-4 h-4" />
            <span>Astuce mnémotechnique OSI</span>
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            De L1 (bas) à L7 (haut)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            « <strong>P</strong>our <strong>L</strong>e <strong>R</strong>éseau,{' '}
            <strong>T</strong>out <strong>S</strong>e <strong>P</strong>asse <strong>A</strong>u
            sommet »
          </p>
        </div>

        <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
          {OSI_LAYERS.map((l) => (
            <li
              key={l.num}
              className="flex items-start justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
            >
              <span className="font-mono font-bold text-sky-700 dark:text-sky-400">L{l.num}</span>
              <span className="flex-1">
                <strong>{l.name}</strong> — {l.role}
              </span>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={handleReset}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Réinitialiser
        </button>

        {isCompleted && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200">
            Badge <strong>Maître des 7 Couches</strong> validé !
          </div>
        )}
      </div>
    </div>
  );
};
