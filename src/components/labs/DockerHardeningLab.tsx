import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Container,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { playClick, playSuccess, playVictory } from '../../utils/sound';

interface DockerRule {
  id: string;
  severity: 'CRITIQUE' | 'ÉLEVÉE' | 'MOYENNE';
  cveOrCheck: string;
  vulnLine: string;
  fixedLine: string;
  title: string;
  explanation: string;
  points: number;
}

const DOCKER_RULES: DockerRule[] = [
  {
    id: 'base-image',
    severity: 'ÉLEVÉE',
    cveOrCheck: 'CVE-2025-4102 (14 CVE)',
    vulnLine: 'FROM node:latest',
    fixedLine: 'FROM node:22-alpine3.20',
    title: 'Épingler une image minimale (Alpine / Distroless)',
    explanation:
      'Le tag « :latest » rend le build imprévisible et l’image Debian complète embarque des dizaines d’outils inutiles augmentant la surface d’attaque.',
    points: 20,
  },
  {
    id: 'hardcoded-secret',
    severity: 'CRITIQUE',
    cveOrCheck: 'CIS-DI-0010 · Secret exposé',
    vulnLine: 'ENV DB_PASSWORD="ProdPassword2026!"',
    fixedLine: '# Secrets injectés au runtime via Vault / Kubernetes Secret',
    title: 'Supprimer les secrets en dur du Dockerfile',
    explanation:
      'Toute variable ENV écrite dans un Dockerfile reste gravée en clair dans l’historique des couches (docker history / docker inspect).',
    points: 25,
  },
  {
    id: 'copy-deps',
    severity: 'MOYENNE',
    cveOrCheck: 'Supply-Chain & Cache',
    vulnLine: 'COPY . . && RUN npm install',
    fixedLine: 'COPY package*.json ./ && RUN npm ci --omit=dev',
    title: 'Utiliser npm ci --omit=dev avec lockfile strict',
    explanation:
      'npm ci garantit des versions reproductibles issues du package-lock.json et exclut les dépendances de développement en production.',
    points: 15,
  },
  {
    id: 'non-root',
    severity: 'CRITIQUE',
    cveOrCheck: 'CIS-DI-0001 · Root Container',
    vulnLine: '# Exécution par défaut en UID 0 (root)',
    fixedLine: 'USER node',
    title: 'Exécuter le processus avec un utilisateur non-root',
    explanation:
      'Si une faille RCE survient dans l’application, un processus non-root limite drastiquement le risque d’évasion de conteneur (Container Escape).',
    points: 25,
  },
  {
    id: 'healthcheck',
    severity: 'MOYENNE',
    cveOrCheck: 'CIS-DI-0006 · Observabilité',
    vulnLine: '# Aucune sonde de santé définie',
    fixedLine: 'HEALTHCHECK --interval=30s CMD wget -qO- http://127.0.0.1:3000/health || exit 1',
    title: 'Ajouter un HEALTHCHECK natif',
    explanation:
      'Permet à Docker / l’orchestrateur de détecter un processus gelé (deadlock) et de redémarrer automatiquement le conteneur.',
    points: 15,
  },
];

interface DockerHardeningLabProps {
  onHardened?: () => void;
}

export const DockerHardeningLab: React.FC<DockerHardeningLabProps> = ({ onHardened }) => {
  const [fixedIds, setFixedIds] = useState<string[]>([]);
  const [awarded, setAwarded] = useState(false);

  const score = DOCKER_RULES.filter((r) => fixedIds.includes(r.id)).reduce(
    (sum, r) => sum + r.points,
    0
  );
  const remainingCritical = DOCKER_RULES.filter(
    (r) => r.severity === 'CRITIQUE' && !fixedIds.includes(r.id)
  ).length;

  const toggleFix = (ruleId: string) => {
    setFixedIds((prev) => {
      const exists = prev.includes(ruleId);
      const next = exists ? prev.filter((id) => id !== ruleId) : [...prev, ruleId];
      if (!exists) {
        if (next.length === DOCKER_RULES.length) {
          playVictory();
          if (!awarded) {
            setAwarded(true);
            onHardened?.();
          }
        } else {
          playSuccess();
        }
      } else {
        playClick();
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-400">
            <Container className="w-4 h-4" />
            <span>DevSecOps · Scan CVE (Trivy) · CIS Docker Benchmark</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Durcissement Dockerfile &amp; Scan CVE
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Corrigez les 5 vulnérabilités détectées sur ce Dockerfile de production jusqu’à obtenir un score de conformité 100/100.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs">
            <div>
              <div className="text-slate-500">Score Sécurité</div>
              <div
                className={`font-mono font-black tabular-nums ${
                  score === 100
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : score >= 60
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {score} / 100
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <div className="text-slate-500">Critiques</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {remainingCritical}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              setFixedIds([]);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Live Dockerfile Preview */}
        <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
            <span>Dockerfile (Aperçu en direct)</span>
            <span className={score === 100 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {score === 100 ? 'BUILD CONFORME' : `${DOCKER_RULES.length - fixedIds.length} alerte(s)`}
            </span>
          </div>
          <div className="p-4 font-mono text-xs space-y-2">
            <div className="text-slate-500">WORKDIR /app</div>
            {DOCKER_RULES.map((rule) => {
              const isFixed = fixedIds.includes(rule.id);
              return (
                <div
                  key={rule.id}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    isFixed
                      ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800/70 text-rose-200'
                  }`}
                >
                  <div className="text-[10px] opacity-75 mb-0.5">
                    {isFixed ? 'CORRIGÉ' : `${rule.severity} · ${rule.cveOrCheck}`}
                  </div>
                  <code className="break-all">{isFixed ? rule.fixedLine : rule.vulnLine}</code>
                </div>
              );
            })}
            <div className="text-slate-400 pt-1">EXPOSE 3000</div>
            <div className="text-slate-400">CMD [&quot;node&quot;, &quot;server.js&quot;]</div>
          </div>
        </div>

        {/* Remediation Actions */}
        <div className="lg:col-span-6 space-y-3">
          {DOCKER_RULES.map((rule) => {
            const isFixed = fixedIds.includes(rule.id);
            return (
              <div
                key={rule.id}
                className={`p-4 rounded-xl border transition-colors ${
                  isFixed
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      {isFixed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      )}
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {rule.severity} · {rule.cveOrCheck}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {rule.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {rule.explanation}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFix(rule.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                      isFixed
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-sky-700 text-white hover:bg-sky-800'
                    }`}
                  >
                    {isFixed ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Appliqué
                      </>
                    ) : (
                      <>
                        <Wrench className="w-3.5 h-3.5" />
                        Corriger (+{rule.points})
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
