import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Globe2,
  RotateCcw,
  Star,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface Island21Ipv6GameProps {
  isCompleted: boolean;
  onComplete: (stars: number) => void;
}

const COMPRESSION_CHALLENGES = [
  {
    id: 'c1',
    full: '2001:0db8:0000:0000:0000:0000:0000:0001',
    options: [
      '2001:db8::1',
      '2001:db8:0:0::01',
      '2001::db8::1',
      '2001:0db8::0001',
    ],
    correct: 0,
    note: 'On supprime les zéros non significatifs à gauche (0db8 → db8, 0001 → 1) et on remplace la plus longue suite de blocs 0000 par « :: » une seule fois.',
  },
  {
    id: 'c2',
    full: 'fe80:0000:0000:0000:020c:29ff:fe4a:001f',
    options: [
      'fe80::20c:29ff:fe4a:1f',
      'fe8::20c:29ff:fe4a:1f',
      'fe80:0::020c:29ff:fe4a:1f',
      'fe80::20c:29ff::1f',
    ],
    correct: 0,
    note: 'Attention : on ne supprime jamais les zéros à droite (fe80 reste fe80), seulement les zéros de tête dans chaque groupe de 4 chiffres hexadécimaux.',
  },
];

const PREFIX_MATCHES = [
  { id: 'p1', addr: '::1/128', expected: 'loopback', label: 'Adresse de bouclage locale (Loopback)' },
  { id: 'p2', addr: 'fe80::/10', expected: 'link-local', label: 'Link-Local (communication sur le même LAN / SLAAC)' },
  { id: 'p3', addr: '2001:db8:42::/48', expected: 'global', label: 'Unicast Globale (routable sur Internet)' },
  { id: 'p4', addr: 'fc00::/7 (fd00::/8)', expected: 'ula', label: 'ULA — Unique Local Address (équivalent RFC1918 privé)' },
];

export const Island21Ipv6Game: React.FC<Island21Ipv6GameProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [compChoices, setCompChoices] = useState<Record<string, number>>({});
  const [prefixChoices, setPrefixChoices] = useState<Record<string, string>>({
    p1: '',
    p2: '',
    p3: '',
    p4: '',
  });
  const [transitionStrategy, setTransitionStrategy] = useState<string>('ipv4-only');

  const handleValidatePhase1 = () => {
    const wrong = COMPRESSION_CHALLENGES.find((c) => compChoices[c.id] !== c.correct);
    if (wrong) {
      playError();
      setMistakes((m) => m + 1);
      setFeedback({ kind: 'err', text: `Compression incorrecte pour ${wrong.full}. ${wrong.note}` });
      return;
    }
    playSuccess();
    setFeedback({
      kind: 'ok',
      text: 'Compression IPv6 maîtrisée ! Vous savez désormais lire et simplifier des adresses 128 bits.',
    });
    setPhase(2);
  };

  const handleValidatePhase2 = () => {
    const wrong = PREFIX_MATCHES.find((p) => prefixChoices[p.id] !== p.expected);
    if (wrong) {
      playError();
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'err',
        text: `Vérifiez le rôle du préfixe ${wrong.addr} (${wrong.label}).`,
      });
      return;
    }
    playSuccess();
    setFeedback({
      kind: 'ok',
      text: 'Préfixes IPv6 identifiés ! Passons au plan de transition vers IPv6.',
    });
    setPhase(3);
  };

  const handleValidatePhase3 = () => {
    if (transitionStrategy !== 'dual-stack') {
      playError();
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'err',
        text: 'Pour migrer un campus sans couper les services IPv4 existants, déployez le mode Dual-Stack (IPv4 + IPv6 simultanés) avec enregistrements DNS A et AAAA.',
      });
      return;
    }
    playVictory();
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    setPhase(4);
    setFeedback({
      kind: 'ok',
      text: 'Migration IPv6 Dual-Stack validée ! Vos serveurs répondent désormais en IPv4 (A) et IPv6 (AAAA).',
    });
    onComplete(stars);
  };

  const handleReset = () => {
    playClick();
    setPhase(1);
    setMistakes(0);
    setFeedback(null);
    setCompChoices({});
    setPrefixChoices({ p1: '', p2: '', p3: '', p4: '' });
    setTransitionStrategy('ipv4-only');
  };

  const starsEarned = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-400">
            <Globe2 className="w-4 h-4" />
            <span>Mission Pratique · Île 21 · IPv6 128 bits &amp; Dual-Stack</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            Migre l&apos;Archipel vers IPv6
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-600 dark:text-slate-400 tabular-nums">
            Étape {Math.min(phase, 3)} / 3 · Erreurs : {mistakes}
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-sans font-semibold text-slate-700 dark:text-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
            feedback.kind === 'err'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          {feedback.kind === 'err' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {phase === 1 && (
        <div className="space-y-5">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Sélectionnez la forme compressée valide (RFC 5952) pour chacune des deux adresses IPv6 ci-dessous :
          </p>
          {COMPRESSION_CHALLENGES.map((ch) => (
            <div
              key={ch.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="font-mono text-xs sm:text-sm font-bold text-sky-700 dark:text-sky-400 break-all">
                {ch.full}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ch.options.map((opt, idx) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      playClick();
                      setCompChoices((prev) => ({ ...prev, [ch.id]: idx }));
                    }}
                    className={`px-3.5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm text-left transition-colors ${
                      compChoices[ch.id] === idx
                        ? 'bg-sky-700 text-white border-sky-700 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleValidatePhase1}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold"
          >
            Valider les compressions
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {phase === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Associez chaque préfixe IPv6 à sa portée réseau :
          </p>
          <div className="space-y-3">
            {PREFIX_MATCHES.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {item.addr}
                </span>
                <select
                  value={prefixChoices[item.id]}
                  onChange={(e) => {
                    playClick();
                    setPrefixChoices((prev) => ({ ...prev, [item.id]: e.target.value }));
                  }}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
                >
                  <option value="">— Choisir la portée —</option>
                  <option value="loopback">Loopback local (équivalent 127.0.0.1)</option>
                  <option value="link-local">Link-Local (LAN uniquement, requis pour SLAAC/NDP)</option>
                  <option value="global">Unicast Globale (routable sur Internet)</option>
                  <option value="ula">ULA Privée (équivalent 10.0.0.0/8)</option>
                </select>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleValidatePhase2}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold"
          >
            Vérifier les préfixes
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {phase === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Quelle stratégie de déploiement permet de migrer les serveurs web de Cyberland vers IPv6 tout en restant 100 % accessibles aux clients IPv4 ?
          </p>
          <div className="space-y-2">
            {[
              { id: 'ipv4-only', label: 'Couper IPv4 immédiatement et n’activer qu’IPv6 sur le portail' },
              {
                id: 'dual-stack',
                label: 'Activer Dual-Stack (IPv4 + IPv6 simultanés) avec enregistrements DNS A et AAAA + SLAAC /64',
              },
              { id: 'nat-only', label: 'Désactiver le DNS et utiliser uniquement des adresses MAC' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  playClick();
                  setTransitionStrategy(opt.id);
                }}
                className={`w-full text-left p-4 rounded-xl border text-sm transition-colors ${
                  transitionStrategy === opt.id
                    ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-900 dark:text-sky-200 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleValidatePhase3}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
          >
            Déployer la migration IPv6
          </button>
        </div>
      )}

      {phase === 4 && (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Archipel prêt pour l&apos;IPv6 (340 sextillions d&apos;adresses) !
            </h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= starsEarned ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Vous maîtrisez la compression RFC 5952, les préfixes fe80::/10, ::1 et 2000::/3, ainsi que la transition Dual-Stack sans interruption.
            {isCompleted ? ' Île 21 validée.' : ''}
          </p>
        </div>
      )}
    </div>
  );
};
