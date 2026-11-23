import React, { useMemo, useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Sparkles, AlertTriangle } from 'lucide-react';
import { playClick, playSuccess } from '../../utils/sound';

const FRENCH_WORDS = [
  'phare', 'corail', 'nuage', 'boussole', 'voile', 'fibre', 'lagon', 'balise',
  'soleil', 'etoile', 'ancre', 'olivier', 'sable', 'vague', 'radar', 'quai',
  'rocher', 'citadelle', 'brise', 'horizon', 'calanque', 'archipel', 'amiral', 'bateau',
];

const PRESETS = [
  { label: 'Mot courant', value: 'azerty123' },
  { label: 'Classique 8 car.', value: 'Cyber26!' },
  { label: 'Complexe 12 car.', value: 'Cyb3r#L@nd26' },
  { label: 'Phrase de passe (4 mots)', value: 'phare-corail-nuage-boussole' },
];

function formatCrackTime(seconds: number): string {
  if (seconds < 1) return 'Instantané (< 1 seconde)';
  if (seconds < 60) return `${Math.round(seconds)} secondes`;
  const mins = seconds / 60;
  if (mins < 60) return `${Math.round(mins)} minutes`;
  const hrs = mins / 60;
  if (hrs < 24) return `${Math.round(hrs)} heures`;
  const days = hrs / 24;
  if (days < 365) return `${Math.round(days)} jours`;
  const years = days / 365.25;
  if (years < 1000) return `${Math.round(years).toLocaleString('fr-FR')} ans`;
  if (years < 1e6) return `${Math.round(years / 1000).toLocaleString('fr-FR')} milliers d’années`;
  if (years < 1e9) return `${Math.round(years / 1e6).toLocaleString('fr-FR')} millions d’années`;
  return 'Plusieurs milliards d’années';
}

export const PasswordEntropyLab: React.FC = () => {
  const [password, setPassword] = useState('phare-corail-nuage-boussole');
  const [showText, setShowText] = useState(true);

  const metrics = useMemo(() => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);

    let pool = 0;
    if (hasLower) pool += 26;
    if (hasUpper) pool += 26;
    if (hasDigit) pool += 10;
    if (hasSymbol) pool += 32;

    const length = password.length;
    const entropyBits = length > 0 && pool > 0 ? Math.round(length * Math.log2(pool)) : 0;
    // Assume offline GPU rig at 10 billion guesses / second (1e10)
    const combinations = Math.pow(2, Math.min(entropyBits, 128));
    const crackSeconds = combinations / 2 / 1e10;

    let level: 'faible' | 'moyen' | 'fort' | 'excellent' = 'faible';
    if (entropyBits >= 85) level = 'excellent';
    else if (entropyBits >= 60) level = 'fort';
    else if (entropyBits >= 40) level = 'moyen';

    return { hasLower, hasUpper, hasDigit, hasSymbol, pool, length, entropyBits, crackSeconds, level };
  }, [password]);

  const generatePassphrase = () => {
    playSuccess();
    const chosen: string[] = [];
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * FRENCH_WORDS.length);
      chosen.push(FRENCH_WORDS[idx]);
    }
    setPassword(chosen.join('-'));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-1">
          <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
            Calcul 100 % local dans votre navigateur · Aucun mot de passe envoyé
          </p>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Testeur d&apos;entropie &amp; force brute GPU
          </h2>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label
            htmlFor="pwd-test-input"
            className="text-xs font-semibold text-slate-600 dark:text-slate-400"
          >
            Saisissez un mot de passe d&apos;exemple (ne saisissez jamais votre vrai mot de passe)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="pwd-test-input"
              type={showText ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={64}
              className="flex-1 px-4 py-3 font-mono text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => {
                playClick();
                setShowText((s) => !s);
              }}
              aria-label={showText ? 'Masquer' : 'Afficher'}
              className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
            >
              {showText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Presets & Passphrase generator */}
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                playClick();
                setPassword(p.value);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors"
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={generatePassphrase}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Générer une phrase secrète
          </button>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">Longueur &amp; Alphabet</p>
            <p className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {metrics.length} car. · {metrics.pool} sym.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">Entropie estimée</p>
            <p className="font-mono text-lg font-bold text-sky-700 dark:text-sky-400 tabular-nums">
              {metrics.entropyBits} bits
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">Niveau global</p>
            <p
              className={`font-display text-lg font-bold capitalize ${
                metrics.level === 'excellent' || metrics.level === 'fort'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : metrics.level === 'moyen'
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {metrics.level}
            </p>
          </div>
        </div>

        {/* Crack Time Banner */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs sm:text-sm ${
            metrics.level === 'excellent' || metrics.level === 'fort'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
          }`}
        >
          {metrics.level === 'excellent' || metrics.level === 'fort' ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-semibold">
              Temps moyen de cassage par force brute (cluster 10 milliards d&apos;essais/s) :
            </p>
            <p className="font-mono text-base font-bold tabular-nums">
              {formatCrackTime(metrics.crackSeconds)}
            </p>
          </div>
        </div>
      </section>

      {/* Right: Pedagogical Guide */}
      <aside className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-6 space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-sky-300">
            Pourquoi la longueur bat la complexité courte ?
          </p>
          <h3 className="font-display text-lg font-bold">
            Formule d&apos;entropie : E = L × log₂(N)
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Un mot de passe court de 8 caractères complexes (<span className="font-mono text-amber-300">Cyber26!</span>)
            offre environ 52 bits d&apos;entropie : un cluster moderne le casse en quelques heures.
            Une phrase secrète de 4 mots aléatoires (<span className="font-mono text-emerald-300">phare-corail-nuage-boussole</span>,
            27 caractères) dépasse les 130 bits et reste facile à mémoriser !
          </p>
        </div>

        <div className="space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-300">
          <p className="font-semibold text-white">Les 3 règles d&apos;or Cyberland :</p>
          <ul className="space-y-1.5 list-disc pl-4">
            <li>1 compte = 1 mot de passe unique (évitez la réutilisation).</li>
            <li>Utilisez un gestionnaire de mots de passe chiffré (coffre-fort).</li>
            <li>Activez la double authentification (MFA) sur chaque compte critique.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};
