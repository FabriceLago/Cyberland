import React from 'react';
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  FileSearch,
  Layers,
  Network,
  Play,
  ShieldAlert,
  TerminalSquare,
} from 'lucide-react';
import { SHORT_COURSE_NAMES } from '../data/courseData';
import { IMMERSION_DAYS } from '../data/proImmersionData';
import { playClick } from '../utils/sound';

export const ESSENTIAL_PATH_ISLAND_IDS = [1, 2, 3, 29, 15, 16] as const;

export interface EssentialPathStatusInput {
  completedIslands: number[];
  topologyCompleted: boolean;
  completedImmersionDaysCount: number;
  completedMissionsCount: number;
  bestDefenseScore: number;
  passedExamsCount: number;
  bestExamScore: number | null;
}

export interface EssentialNextAction {
  stepNumber: number;
  ctaLabel: string;
  target:
    | { kind: 'island'; islandId: number }
    | { kind: 'topology' }
    | { kind: 'immersion' }
    | { kind: 'missions' }
    | { kind: 'defense' }
    | { kind: 'exam' }
    | { kind: 'certificate' };
}

export function getEssentialStepMetrics(input: EssentialPathStatusInput) {
  const networkIds = [1, 2, 3];
  const systemIds = [29, 15];

  const networkDone = networkIds.filter((id) => input.completedIslands.includes(id)).length;
  const systemDone = systemIds.filter((id) => input.completedIslands.includes(id)).length;

  const step1Done = networkDone === networkIds.length;
  const step2Done = input.topologyCompleted;
  const step3Done = systemDone === systemIds.length;
  const step4Done = input.completedImmersionDaysCount >= IMMERSION_DAYS.length;
  const step5Done = input.completedMissionsCount >= 1 && input.bestDefenseScore > 0;
  const step6Done = input.passedExamsCount >= 1;

  const completedStepsCount = [
    step1Done,
    step2Done,
    step3Done,
    step4Done,
    step5Done,
    step6Done,
  ].filter(Boolean).length;

  let nextAction: EssentialNextAction;
  if (!step1Done) {
    const nextNetId = networkIds.find((id) => !input.completedIslands.includes(id)) ?? 1;
    nextAction = {
      stepNumber: 1,
      ctaLabel: `Étape 01 : ${SHORT_COURSE_NAMES[nextNetId]}`,
      target: { kind: 'island', islandId: nextNetId },
    };
  } else if (!step2Done) {
    nextAction = {
      stepNumber: 2,
      ctaLabel: 'Étape 02 : Topologie Réseau Live',
      target: { kind: 'topology' },
    };
  } else if (!step3Done) {
    const nextSysId = systemIds.find((id) => !input.completedIslands.includes(id)) ?? 29;
    nextAction = {
      stepNumber: 3,
      ctaLabel: `Étape 03 : ${SHORT_COURSE_NAMES[nextSysId]}`,
      target: { kind: 'island', islandId: nextSysId },
    };
  } else if (!step4Done) {
    nextAction = {
      stepNumber: 4,
      ctaLabel: `Étape 04 : Immersion Pro (Jour ${Math.min(IMMERSION_DAYS.length, input.completedImmersionDaysCount + 1)})`,
      target: { kind: 'immersion' },
    };
  } else if (!step5Done) {
    nextAction =
      input.completedMissionsCount < 1
        ? {
            stepNumber: 5,
            ctaLabel: 'Étape 05 : Enquête SOC (Journaux)',
            target: { kind: 'missions' },
          }
        : {
            stepNumber: 5,
            ctaLabel: 'Étape 05 : Mode Défense Live',
            target: { kind: 'defense' },
          };
  } else if (!step6Done) {
    nextAction = {
      stepNumber: 6,
      ctaLabel: 'Étape 06 : Examen Blanc & Diplôme',
      target: { kind: 'exam' },
    };
  } else {
    nextAction = {
      stepNumber: 6,
      ctaLabel: 'Générer mon Diplôme d’Architecte',
      target: { kind: 'certificate' },
    };
  }

  return {
    networkIds,
    systemIds,
    networkDone,
    systemDone,
    stepFlags: [step1Done, step2Done, step3Done, step4Done, step5Done, step6Done],
    completedStepsCount,
    totalSteps: 6,
    progressPct: Math.round((completedStepsCount / 6) * 100),
    activeStepIndex: [step1Done, step2Done, step3Done, step4Done, step5Done, step6Done].findIndex(
      (done) => !done
    ),
    nextAction,
  };
}

interface EssentialPathSectionProps extends EssentialPathStatusInput {
  onSelectIsland: (islandId: number) => void;
  onOpenTopologyLab?: () => void;
  onOpenImmersion?: () => void;
  onOpenMissions?: (missionId?: string) => void;
  onOpenDefense?: () => void;
  onOpenExam: () => void;
  onOpenCertificate: () => void;
  onOpenFullCatalog: () => void;
}

export const EssentialPathSection: React.FC<EssentialPathSectionProps> = ({
  completedIslands,
  topologyCompleted,
  completedImmersionDaysCount,
  completedMissionsCount,
  bestDefenseScore,
  passedExamsCount,
  bestExamScore,
  onSelectIsland,
  onOpenTopologyLab,
  onOpenImmersion,
  onOpenMissions,
  onOpenDefense,
  onOpenExam,
  onOpenCertificate,
  onOpenFullCatalog,
}) => {
  const metrics = getEssentialStepMetrics({
    completedIslands,
    topologyCompleted,
    completedImmersionDaysCount,
    completedMissionsCount,
    bestDefenseScore,
    passedExamsCount,
    bestExamScore,
  });

  const currentStepIdx = metrics.activeStepIndex === -1 ? 5 : metrics.activeStepIndex;

  const getStepStatus = (index: number, done: boolean) => {
    if (done) {
      return {
        label: '✓ VALIDÉE',
        textClass: 'text-emerald-700 dark:text-emerald-400',
      };
    }
    if (index === currentStepIdx) {
      return {
        label: '▶ EN COURS',
        textClass: 'text-sky-700 dark:text-cyan-400',
      };
    }
    return {
      label: '○ À SUIVRE',
      textClass: 'text-slate-500 dark:text-slate-400',
    };
  };

  const nextNetworkId =
    metrics.networkIds.find((id) => !completedIslands.includes(id)) ?? metrics.networkIds[0];
  const nextSystemId =
    metrics.systemIds.find((id) => !completedIslands.includes(id)) ?? metrics.systemIds[0];

  const steps = [
    {
      index: 0,
      number: '01',
      title: 'Fondations Réseau indispensables',
      summary:
        'Comprendre comment circulent les paquets, les adresses IP/DNS et les règles TCP/UDP avant toute spécialisation.',
      proof: `${metrics.networkDone} / 3 cours validés`,
      deliverable: 'Savoir lire une trame, résoudre un nom DNS et filtrer un port pare-feu.',
      done: metrics.stepFlags[0],
      icon: Play,
      subLinks: metrics.networkIds.map((id) => ({
        id,
        label: `${String(id).padStart(2, '0')}. ${SHORT_COURSE_NAMES[id]}`,
        done: completedIslands.includes(id),
      })),
      primaryAction: {
        label: metrics.stepFlags[0]
          ? 'Revoir les fondations'
          : `Ouvrir : ${SHORT_COURSE_NAMES[nextNetworkId]}`,
        onClick: () => onSelectIsland(nextNetworkId),
      },
    },
    {
      index: 1,
      number: '02',
      title: 'Manipuler une topologie réseau 2D réelle',
      summary:
        'Configurer routeurs, tables de routage, pare-feu DMZ et observer le transit réel des paquets sans 3D décorative.',
      proof: topologyCompleted ? 'Défis validés (1/1)' : 'Labo à valider (0/1)',
      deliverable: 'Diagnostiquer une coupure de routage ou une règle pare-feu bloquante.',
      done: metrics.stepFlags[1],
      icon: Network,
      primaryAction: {
        label: topologyCompleted ? 'Rouvrir la Topologie Live' : 'Lancer la Topologie Live',
        onClick: () => onOpenTopologyLab?.(),
      },
    },
    {
      index: 2,
      number: '03',
      title: 'Systèmes & Identité d’entreprise (Linux + Active Directory)',
      summary:
        'Maîtriser les deux socles présents dans 95 % des PME et grands comptes : un serveur Linux et un annuaire Active Directory.',
      proof: `${metrics.systemDone} / 2 cours validés`,
      deliverable: 'Gérer droits, services systemd, comptes AD, GPO et authentification Kerberos.',
      done: metrics.stepFlags[2],
      icon: TerminalSquare,
      subLinks: metrics.systemIds.map((id) => ({
        id,
        label: `${id === 29 ? 'Linux' : 'Active Directory'}`,
        done: completedIslands.includes(id),
      })),
      primaryAction: {
        label: metrics.stepFlags[2]
          ? 'Revoir Linux & AD'
          : `Ouvrir : ${SHORT_COURSE_NAMES[nextSystemId]}`,
        onClick: () => onSelectIsland(nextSystemId),
      },
    },
    {
      index: 3,
      number: '04',
      title: 'Vivre sa première semaine en poste (Immersion Pro)',
      summary:
        'Intégrer la PME Atelier Nord-Val pendant 5 jours guidés avec tickets réels, décodeur de jargon français et lignes de CV.',
      proof: `${completedImmersionDaysCount} / ${IMMERSION_DAYS.length} jours validés`,
      deliverable: 'Rédiger un diagnostic clair, auditer un compte AD et produire un dossier CV.',
      done: metrics.stepFlags[3],
      icon: Briefcase,
      primaryAction: {
        label:
          completedImmersionDaysCount === 0
            ? 'Commencer le Jour 1 (Lundi)'
            : metrics.stepFlags[3]
            ? 'Consulter mon dossier CV'
            : `Reprendre (Jour ${completedImmersionDaysCount + 1})`,
        onClick: () => onOpenImmersion?.(),
      },
    },
    {
      index: 4,
      number: '05',
      title: 'Enquêter sur des journaux SIEM & défendre en direct',
      summary:
        'Clôturer au moins une mission d’enquête sur journaux bruts (IOC + règle Sigma) et repousser une vague en Mode Défense Live.',
      proof: `Mission SOC : ${Math.min(completedMissionsCount, 1)}/1 · Défense Live : ${
        bestDefenseScore > 0 ? `${bestDefenseScore} pts` : '0/1'
      }`,
      deliverable: 'Identifier un attaquant dans les logs et appliquer la bonne contre-mesure sous SLA.',
      done: metrics.stepFlags[4],
      icon: ShieldAlert,
      primaryAction: {
        label: completedMissionsCount < 1 ? 'Enquêter (Mission SOC)' : 'Lancer Mode Défense',
        onClick: () =>
          completedMissionsCount < 1 ? onOpenMissions?.() : onOpenDefense?.(),
      },
      secondaryAction:
        completedMissionsCount < 1 && onOpenDefense
          ? {
              label: 'Mode Défense Live',
              onClick: () => onOpenDefense(),
            }
          : onOpenMissions
          ? {
              label: 'Centre Missions SOC',
              onClick: () => onOpenMissions(),
            }
          : undefined,
    },
    {
      index: 5,
      number: '06',
      title: 'Validation finale & Diplôme d’Architecte',
      summary:
        'Passer l’examen blanc chronométré (note ≥ 10/20) puis télécharger votre diplôme nominatif vérifiant le parcours complet.',
      proof:
        passedExamsCount >= 1
          ? `Validé · Meilleur score : ${bestExamScore ?? 10}/20`
          : bestExamScore !== null
          ? `Dernier essai : ${bestExamScore}/20 (objectif ≥ 10/20)`
          : 'Examen non encore passé',
      deliverable: 'Certificat imprimable PDF / SVG attestant vos compétences socles.',
      done: metrics.stepFlags[5],
      icon: Award,
      primaryAction: {
        label: passedExamsCount >= 1 ? 'Générer mon Diplôme' : 'Passer l’Examen Blanc',
        onClick: () => (passedExamsCount >= 1 ? onOpenCertificate() : onOpenExam()),
      },
      secondaryAction:
        passedExamsCount >= 1
          ? {
              label: 'Améliorer mon score',
              onClick: () => onOpenExam(),
            }
          : {
              label: 'Aperçu du diplôme',
              onClick: () => onOpenCertificate(),
            },
    },
  ];

  return (
    <section
      data-tour="tour-essential"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6"
    >
      {/* Header & overall completion gauge */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-sky-700 dark:text-cyan-400">
            Parcours Socle Complet · 6 étapes vérifiables · De zéro à opérationnel
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Un seul parcours complet, maîtrisé de bout en bout
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Plutôt que de disperser votre apprentissage entre Cloud, pentesting, IA et 3D dès le
            premier jour, suivez cette colonne vertébrale 100 % fonctionnelle : fondamentaux réseau,
            topologie 2D, Linux/AD, semaine en poste, investigation SOC et diplôme.
          </p>
        </div>

        <div className="w-full lg:w-72 shrink-0 space-y-2">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Progression du socle
            </span>
            <span className="font-mono font-bold text-sky-700 dark:text-cyan-400 tabular-nums">
              {metrics.completedStepsCount} / {metrics.totalSteps} étapes · {metrics.progressPct} %
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-sky-700 dark:bg-cyan-400 transition-all duration-300"
              style={{ width: `${metrics.progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 6 functional sequential milestones separated by crisp hairline dividers */}
      <ol className="divide-y divide-slate-200 dark:divide-slate-800">
        {steps.map((step) => {
          const status = getStepStatus(step.index, step.done);
          const isCurrent = !step.done && step.index === currentStepIdx;
          const StepIcon = step.icon;

          return (
            <li
              key={step.number}
              className={`py-5 first:pt-1 last:pb-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                isCurrent ? 'bg-sky-50/50 dark:bg-cyan-950/20 -mx-3 px-3 rounded-xl' : ''
              }`}
            >
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center font-mono text-xs font-bold tabular-nums shrink-0 mt-0.5 ${
                    step.done
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                      : isCurrent
                      ? 'bg-sky-700 dark:bg-cyan-400 border-sky-700 dark:border-cyan-400 text-white dark:text-slate-950'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                </div>

                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                    <span className={`font-mono font-bold tabular-nums ${status.textClass}`}>
                      {status.label}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                      {step.proof}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug flex items-center gap-2">
                    <StepIcon className="w-4 h-4 text-sky-700 dark:text-cyan-400 shrink-0" />
                    <span>
                      {step.number}. {step.title}
                    </span>
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    {step.summary}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Compétence vérifiée :
                    </span>{' '}
                    {step.deliverable}
                  </p>

                  {step.subLinks && (
                    <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                      {step.subLinks.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            playClick();
                            onSelectIsland(sub.id);
                          }}
                          className={`inline-flex items-center gap-1 font-medium hover:underline transition-colors ${
                            sub.done
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-sky-700 dark:text-cyan-400'
                          }`}
                        >
                          <span className="font-mono">{sub.done ? '✓' : '→'}</span>
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 pl-14 lg:pl-0">
                {step.secondaryAction && (
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      step.secondaryAction?.onClick();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    {step.secondaryAction.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    step.primaryAction.onClick();
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isCurrent
                      ? 'bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <span>{step.primaryAction.label}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Clean bridge to the optional Full Catalog without clutter */}
      <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
          <Layers className="w-4 h-4 text-sky-700 dark:text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              Prêt à élargir votre périmètre ?
            </span>{' '}
            Les 27 cours d’approfondissement (Cloud, Kubernetes, Windows Server, Microsoft Sentinel,
            Suricata IDS/IPS, Terraform, DFIR, Sigma/YARA, BGP) et l’ensemble des laboratoires
            restent accessibles en un clic dans le Catalogue Complet.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            playClick();
            onOpenFullCatalog();
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-sky-500 dark:hover:border-cyan-400 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <FileSearch className="w-3.5 h-3.5 text-sky-700 dark:text-cyan-400 shrink-0" />
          Ouvrir le Catalogue Complet (33 cours)
        </button>
      </div>
    </section>
  );
};
