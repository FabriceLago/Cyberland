import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  KeyRound,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface ChmodChallenge {
  id: string;
  file: string;
  desc: string;
  targetOctal: string;
  hint: string;
}

const CHMOD_CHALLENGES: ChmodChallenge[] = [
  {
    id: 'ssh-key',
    file: '~/.ssh/id_ed25519',
    desc: 'Clé privée SSH : lecture/écriture uniquement pour le propriétaire, rien pour le groupe ni les autres.',
    targetOctal: '600',
    hint: 'Propriétaire = r+w (6), Groupe = 0, Autres = 0 → chmod 600',
  },
  {
    id: 'web-script',
    file: '/usr/local/bin/deploy.sh',
    desc: 'Script de déploiement : propriétaire rwx, groupe et autres r-x (lecture + exécution).',
    targetOctal: '755',
    hint: 'Propriétaire = r+w+x (7), Groupe = r+x (5), Autres = r+x (5) → chmod 755',
  },
  {
    id: 'nginx-conf',
    file: '/etc/nginx/sites-available/cyberland.conf',
    desc: 'Fichier de configuration public : propriétaire rw-, groupe r--, autres r--.',
    targetOctal: '644',
    hint: 'Propriétaire = 6, Groupe = 4, Autres = 4 → chmod 644',
  },
];

export const LinuxAdminLab: React.FC = () => {
  const [tab, setTab] = useState<'chmod' | 'systemd' | 'cron'>('chmod');

  // Chmod state (9 bits: u r/w/x, g r/w/x, o r/w/x)
  const [bits, setBits] = useState<boolean[]>([true, true, false, true, false, false, true, false, false]);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [solvedChmod, setSolvedChmod] = useState<string[]>([]);

  // Systemd state
  const [nginxStatus, setNginxStatus] = useState<'failed' | 'active'>('failed');
  const [nginxEnabled, setNginxEnabled] = useState(false);
  const [configFixed, setConfigFixed] = useState(false);
  const [sysLogs, setSysLogs] = useState<string[]>([
    'nov. 23 14:12:03 srv-prod systemd[1]: Starting A high performance web server...',
    'nov. 23 14:12:03 srv-prod nginx[1482]: nginx: [emerg] unexpected end of file, expecting ";" in /etc/nginx/nginx.conf:42',
    'nov. 23 14:12:03 srv-prod systemd[1]: nginx.service: Main process exited, code=exited, status=1/FAILURE',
  ]);

  // Cron builder state
  const [cronMin, setCronMin] = useState('0');
  const [cronHour, setCronHour] = useState('3');
  const [cronDom, setCronDom] = useState('*');
  const [cronMon, setCronMon] = useState('*');
  const [cronDow, setCronDow] = useState('*');

  const calcDigit = (r: boolean, w: boolean, x: boolean) => (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0);
  const uDigit = calcDigit(bits[0], bits[1], bits[2]);
  const gDigit = calcDigit(bits[3], bits[4], bits[5]);
  const oDigit = calcDigit(bits[6], bits[7], bits[8]);
  const octal = `${uDigit}${gDigit}${oDigit}`;
  const symbolic = bits
    .map((on, idx) => (on ? ['r', 'w', 'x'][idx % 3] : '-'))
    .join('');

  const currentChallenge = CHMOD_CHALLENGES[challengeIdx];

  const checkChmod = () => {
    if (octal === currentChallenge.targetOctal) {
      playVictory();
      setSolvedChmod((prev) => (prev.includes(currentChallenge.id) ? prev : [...prev, currentChallenge.id]));
    } else {
      playError();
    }
  };

  const toggleBit = (index: number) => {
    playClick();
    setBits((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const runSystemdCmd = (cmd: 'fix' | 'restart' | 'enable') => {
    if (cmd === 'fix') {
      playSuccess();
      setConfigFixed(true);
      setSysLogs((prev) => [
        ...prev,
        '$ sudo nginx -t  → syntax is ok · test is successful (point-virgule corrigé ligne 42)',
      ]);
    } else if (cmd === 'restart') {
      if (!configFixed) {
        playError();
        setSysLogs((prev) => [
          ...prev,
          '$ sudo systemctl restart nginx → ECHEC : corrigez d’abord l’erreur de syntaxe (nginx -t) !',
        ]);
      } else {
        playVictory();
        setNginxStatus('active');
        setSysLogs((prev) => [
          ...prev,
          '$ sudo systemctl restart nginx → Active: active (running) since now',
        ]);
      }
    } else if (cmd === 'enable') {
      playSuccess();
      setNginxEnabled(true);
      setSysLogs((prev) => [
        ...prev,
        '$ sudo systemctl enable nginx → Created symlink multi-user.target.wants/nginx.service (démarrage auto actif)',
      ]);
    }
  };

  const cronExpression = `${cronMin} ${cronHour} ${cronDom} ${cronMon} ${cronDow} /usr/local/bin/backup.sh`;
  const cronSummary =
    cronMin === '0' && cronHour === '3' && cronDom === '*' && cronMon === '*' && cronDow === '*'
      ? 'Tous les jours à 03h00 (idéal pour une sauvegarde nocturne)'
      : cronMin === '*/15' && cronHour === '*'
        ? 'Toutes les 15 minutes, 24h/24'
        : cronDow === '0'
          ? `Chaque dimanche à ${cronHour}h${cronMin.padStart(2, '0')}`
          : `Exécution planifiée selon l’expression (${cronMin} ${cronHour} ${cronDom} ${cronMon} ${cronDow})`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Terminal className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Labo Administration Linux Pratique
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Maîtrisez les permissions <code className="font-mono">chmod</code>, le dépannage de services <code className="font-mono">systemd / journalctl</code> et la planification <code className="font-mono">crontab</code>.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 w-fit">
          {[
            { id: 'chmod', label: 'Permissions chmod', icon: KeyRound },
            { id: 'systemd', label: 'systemd & logs', icon: Server },
            { id: 'cron', label: 'Planificateur cron', icon: Clock },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  playClick();
                  setTab(item.id as typeof tab);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  tab === item.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'chmod' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                Calculateur interactif <code className="font-mono">chmod</code>
              </div>
              <div className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                chmod {octal} ({symbolic})
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { title: 'Propriétaire (u)', offset: 0, val: uDigit },
                { title: 'Groupe (g)', offset: 3, val: gDigit },
                { title: 'Autres (o)', offset: 6, val: oDigit },
              ].map((grp) => (
                <div
                  key={grp.title}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>{grp.title}</span>
                    <span className="font-mono text-sky-600 dark:text-sky-400">{grp.val}</span>
                  </div>
                  {(['Lecture (r=4)', 'Écriture (w=2)', 'Exécution (x=1)'] as const).map((lbl, j) => {
                    const idx = grp.offset + j;
                    const active = bits[idx];
                    return (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => toggleBit(idx)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {lbl}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-sky-700 dark:text-sky-400">
                Défi {challengeIdx + 1}/{CHMOD_CHALLENGES.length}
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {solvedChmod.length}/{CHMOD_CHALLENGES.length} réussis
              </span>
            </div>

            <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
              {currentChallenge.file}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {currentChallenge.desc}
            </p>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Indice : {currentChallenge.hint}
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={checkChmod}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Appliquer chmod {octal}
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setChallengeIdx((i) => (i + 1) % CHMOD_CHALLENGES.length);
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Défi suivant
              </button>
            </div>

            {solvedChmod.includes(currentChallenge.id) && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Permission exacte validée !
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'systemd' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                nginx.service
              </span>
              <span
                className={`text-xs font-mono font-bold uppercase ${
                  nginxStatus === 'active'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {nginxStatus === 'active' ? 'active (running)' : 'failed (exit-code)'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Lisez les logs <code className="font-mono">journalctl -u nginx</code> à droite, corrigez la configuration, redémarrez le service puis activez-le au démarrage du serveur.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => runSystemdCmd('fix')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-sky-500 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
              >
                1. Corriger nginx.conf:42 &amp; tester (sudo nginx -t)
              </button>
              <button
                type="button"
                onClick={() => runSystemdCmd('restart')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-sky-500 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-sky-500" />
                2. sudo systemctl restart nginx
              </button>
              <button
                type="button"
                onClick={() => runSystemdCmd('enable')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-sky-500 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
              >
                3. sudo systemctl enable nginx (auto au boot)
              </button>
            </div>

            {nginxStatus === 'active' && nginxEnabled && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-400 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Service Nginx réparé, actif et activé au démarrage !
              </div>
            )}
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-200 space-y-2 max-h-72 overflow-y-auto">
            <div className="text-sky-400 font-bold">$ sudo journalctl -u nginx -n 10 --no-pager</div>
            {sysLogs.map((line, i) => (
              <div
                key={i}
                className={
                  line.includes('emerg') || line.includes('FAILURE') || line.includes('ECHEC')
                    ? 'text-rose-400'
                    : line.includes('active (running)') || line.includes('successful') || line.includes('symlink')
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                }
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'cron' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Minute (0-59)', val: cronMin, set: setCronMin, opts: ['0', '*/15', '30'] },
              { label: 'Heure (0-23)', val: cronHour, set: setCronHour, opts: ['3', '*', '22'] },
              { label: 'Jour mois (1-31)', val: cronDom, set: setCronDom, opts: ['*', '1', '15'] },
              { label: 'Mois (1-12)', val: cronMon, set: setCronMon, opts: ['*', '1'] },
              { label: 'Jour sem. (0-6)', val: cronDow, set: setCronDow, opts: ['*', '0', '1-5'] },
            ].map((field) => (
              <div key={field.label} className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  {field.label}
                </label>
                <select
                  value={field.val}
                  onChange={(e) => {
                    playClick();
                    field.set(e.target.value);
                  }}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 font-mono text-xs font-bold text-slate-900 dark:text-white"
                >
                  {field.opts.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-slate-950 text-emerald-400 p-4 font-mono text-xs sm:text-sm">
            {cronExpression}
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Traduction : {cronSummary}
          </p>
        </div>
      )}
    </div>
  );
};
