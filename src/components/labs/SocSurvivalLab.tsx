import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  Heart,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface SocAlertEvent {
  id: string;
  source: string;
  summary: string;
  detail: string;
  isTruePositive: boolean;
  reason: string;
}

const ALERT_POOL: SocAlertEvent[] = [
  {
    id: 'a1',
    source: 'SIEM · Auth AD',
    summary: '42 échecs EventID 4625 puis 1 succès 4624 à 03h18',
    detail: 'Compte : admin-backup · IP source : 185.220.101.9 (hors pays)',
    isTruePositive: true,
    reason: 'Attaque par force brute réussie sur un compte à privilèges en pleine nuit.',
  },
  {
    id: 'a2',
    source: 'EDR · Serveur CI',
    summary: 'Exécution planifiée /usr/bin/apt-get update à 04h00',
    detail: 'Déclencheur : systemd timer unattended-upgrades signé',
    isTruePositive: false,
    reason: 'Tâche légitime de mises à jour automatiques de sécurité.',
  },
  {
    id: 'a3',
    source: 'WAF · Portail Web',
    summary: "GET /items?id=1' UNION SELECT username,password FROM users--",
    detail: 'User-Agent: sqlmap/1.8 · 180 req/min',
    isTruePositive: true,
    reason: 'Tentative explicite d’injection SQL automatisée par sqlmap.',
  },
  {
    id: 'a4',
    source: 'DNS · Résolveur Interne',
    summary: 'Requête A normale vers api.github.com depuis runner CI',
    detail: '1 requête/min durant un pipeline de déploiement validé',
    isTruePositive: false,
    reason: 'Trafic normal d’un pipeline CI/CD autorisé.',
  },
  {
    id: 'a5',
    source: 'EDR · PC Comptabilité',
    summary: 'powershell.exe -EncodedCommand JABjAGwAaQBlAG4AdAA... depuis Excel',
    detail: 'Processus parent : EXCEL.EXE ouvrant Facture_Urgente.xlsm',
    isTruePositive: true,
    reason: 'Macro malveillante lançant un PowerShell obfusqué en Base64.',
  },
  {
    id: 'a6',
    source: 'Pare-feu · DMZ',
    summary: 'Flux HTTPS 443 sortant du serveur Nginx vers Let’s Encrypt ACME',
    detail: 'Renouvellement mensuel certbot planifié',
    isTruePositive: false,
    reason: 'Renouvellement légitime du certificat TLS Let’s Encrypt.',
  },
  {
    id: 'a7',
    source: 'Cloud IAM · AWS/Azure',
    summary: 'Création clé API permanente + attachement rôle AdministratorAccess',
    detail: 'Effectuée par un compte stagiaire via TOR Exit Node',
    isTruePositive: true,
    reason: 'Persistance et élévation de privilèges Cloud depuis un nœud anonyme.',
  },
  {
    id: 'a8',
    source: 'Switch L2 · Campus',
    summary: '400 paquets ARP Reply/sec usurpant la passerelle 10.20.0.1',
    detail: 'Port Fa0/14 (salle réunion) · MAC inconnue',
    isTruePositive: true,
    reason: 'Attaque ARP Spoofing / Man-in-the-Middle en cours sur le LAN.',
  },
  {
    id: 'a9',
    source: 'Monitoring · Prometheus',
    summary: 'Pic CPU 72 % pendant 2 minutes lors du backup nocturne compressé',
    detail: 'Processus : pg_dump + zstd · horaire attendu 02h00',
    isTruePositive: false,
    reason: 'Charge prévisible et normale de la sauvegarde planifiée.',
  },
  {
    id: 'a10',
    source: 'Proxy Web · Sortie',
    summary: 'Upload chiffré de 4,8 Go vers un serveur inconnu à 01h45',
    detail: 'Depuis SRV-FILES (serveur de fichiers ne naviguant jamais sur Internet)',
    isTruePositive: true,
    reason: 'Exfiltration massive de données préalable à un ransomware.',
  },
];

interface SocSurvivalLabProps {
  bestScore?: number;
  onFinishRun?: (score: number, xpEarned: number) => void;
}

export const SocSurvivalLab: React.FC<SocSurvivalLabProps> = ({
  bestScore = 0,
  onFinishRun,
}) => {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wave, setWave] = useState(1);
  const [currentAlert, setCurrentAlert] = useState<SocAlertEvent>(ALERT_POOL[0]);
  const [timeLeftMs, setTimeLeftMs] = useState(8000);
  const [lastFeedback, setLastFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [localBest, setLocalBest] = useState(bestScore);

  const maxTimeForWave = Math.max(3200, 8000 - (wave - 1) * 650);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const pickNextAlert = (excludeId?: string): SocAlertEvent => {
    const candidates = ALERT_POOL.filter((a) => a.id !== excludeId);
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const endGame = (finalScore: number) => {
    setPhase('gameover');
    const updatedBest = Math.max(localBest, finalScore);
    setLocalBest(updatedBest);
    const xp = Math.min(120, Math.round(finalScore / 20));
    if (finalScore >= 300) {
      playVictory();
    } else {
      playError();
    }
    if (xp > 0) {
      onFinishRun?.(finalScore, xp);
    }
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = window.setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= 100) {
          // Timeout = lose 1 life
          setLives((currentLives) => {
            const nextLives = currentLives - 1;
            playError();
            setCombo(0);
            setLastFeedback({
              ok: false,
              text: 'Temps écoulé ! L’alerte n’a pas été triée assez vite (-1 vie).',
            });
            if (nextLives <= 0) {
              setScore((s) => {
                endGame(s);
                return s;
              });
            } else {
              setCurrentAlert((curr) => pickNextAlert(curr.id));
            }
            return nextLives;
          });
          return maxTimeForWave;
        }
        return prev - 100;
      });
    }, 100);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, maxTimeForWave]);

  const handleStart = () => {
    playClick();
    setPhase('playing');
    setLives(3);
    setScore(0);
    setCombo(0);
    setWave(1);
    setLastFeedback(null);
    setCurrentAlert(pickNextAlert());
    setTimeLeftMs(8000);
  };

  const handleDecide = (classifyAsThreat: boolean) => {
    if (phase !== 'playing') return;
    const isCorrect = classifyAsThreat === currentAlert.isTruePositive;

    if (isCorrect) {
      playSuccess();
      const nextCombo = combo + 1;
      const gained = 100 + Math.min(150, nextCombo * 25);
      const nextScore = score + gained;
      const nextWave = Math.floor(nextScore / 450) + 1;
      setCombo(nextCombo);
      setScore(nextScore);
      setWave(nextWave);
      setLastFeedback({
        ok: true,
        text: `+${gained} pts (Combo ×${nextCombo}) — ${currentAlert.reason}`,
      });
      setCurrentAlert(pickNextAlert(currentAlert.id));
      setTimeLeftMs(Math.max(3200, 8000 - (nextWave - 1) * 650));
    } else {
      playError();
      const nextLives = lives - 1;
      setLives(nextLives);
      setCombo(0);
      setLastFeedback({
        ok: false,
        text: `Erreur de triage (-1 vie) : ${currentAlert.reason}`,
      });
      if (nextLives <= 0) {
        endGame(score);
      } else {
        setCurrentAlert(pickNextAlert(currentAlert.id));
        setTimeLeftMs(maxTimeForWave);
      }
    }
  };

  const pctTime = Math.max(0, Math.min(100, (timeLeftMs / maxTimeForWave) * 100));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-400">
            <Flame className="w-4 h-4" />
            <span>Mode Survie SOC · Vague Infinie · 3 Vies · Accélération Progressive</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Survie SOC : Triage sous Pression
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Les alertes arrivent de plus en plus vite : distinguez instantanément les Vrais Positifs (à confiner) des Faux Positifs (activité légitime).
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5">
          <div>
            <div className="text-slate-500">Record</div>
            <div className="font-mono font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {Math.max(bestScore, localBest)} pts
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <div className="text-slate-500">Vague</div>
            <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              #{wave}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-1" aria-label={`${lives} vies restantes`}>
            {[1, 2, 3].map((h) => (
              <Heart
                key={h}
                className={`w-4 h-4 ${
                  h <= lives
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-slate-300 dark:text-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {phase === 'idle' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Prêt pour votre garde au SOC de Cyberland ?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Vous disposez de 3 vies. Chaque bonne décision augmente votre combo et accélère la cadence des vagues.
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-colors"
          >
            <Play className="w-4 h-4" />
            Lancer la garde SOC
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          {/* Score & Timer */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              Score : {score} pts · Combo ×{combo}
            </span>
            <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {(timeLeftMs / 1000).toFixed(1)} s
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                pctTime > 40 ? 'bg-sky-600' : 'bg-rose-600'
              }`}
              style={{ width: `${pctTime}%` }}
            />
          </div>

          {/* Incoming Alert Card */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs font-mono text-amber-400 font-bold">
              {currentAlert.source}
            </div>
            <div className="text-base sm:text-lg font-bold text-white">
              {currentAlert.summary}
            </div>
            <div className="text-xs font-mono text-slate-300">{currentAlert.detail}</div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleDecide(true)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              Vrai Positif — Confiner / Bloquer
            </button>
            <button
              type="button"
              onClick={() => handleDecide(false)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Faux Positif — Activité Légitime
            </button>
          </div>

          {lastFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                lastFeedback.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              {lastFeedback.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{lastFeedback.text}</span>
            </div>
          )}
        </div>
      )}

      {phase === 'gameover' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
          <Trophy className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Fin de garde SOC · Vague #{wave}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Score final : <strong className="font-mono tabular-nums">{score} pts</strong> · Bonus XP crédité :{' '}
            <strong className="font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
              +{Math.min(120, Math.round(score / 20))} XP
            </strong>
          </p>
          {lastFeedback && (
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Dernière alerte : {lastFeedback.text}
            </p>
          )}
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold"
          >
            <RotateCcw className="w-4 h-4" />
            Rejouer une garde
          </button>
        </div>
      )}
    </div>
  );
};
