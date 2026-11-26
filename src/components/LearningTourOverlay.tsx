import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  GraduationCap,
  X,
} from 'lucide-react';
import { AppRoute } from './Header';
import { EASE_SWISS } from './MotionPrimitives';
import { playClick, playSuccess, playVictory } from '../utils/sound';

export interface LearningTourStep {
  id: string;
  targetSelector: string;
  sectionLabel: string;
  title: string;
  description: string;
  interactiveTip: string;
  preferredPlacement?: 'bottom' | 'top';
  quickAction?: {
    label: string;
    type: 'open-course' | 'navigate';
    route?: AppRoute;
  };
}

const LEARNING_TOUR_STEPS: LearningTourStep[] = [
  {
    id: 'header',
    targetSelector: '[data-tour="tour-header"]',
    sectionLabel: 'Navigation principale',
    title: 'Explorez tous les espaces de Cyberland',
    description:
      'Cette barre vous permet de passer à tout moment de l’Archipel au Mode Défense temps réel, à l’Immersion Pro, aux Missions SOC, aux Laboratoires, au Debug, aux Quiz et au Classement.',
    interactiveTip:
      'Vous pouvez relancer ou quitter ce Mode Apprentissage quand vous le souhaitez grâce au bouton en haut à droite.',
    preferredPlacement: 'bottom',
  },
  {
    id: 'hero',
    targetSelector: '[data-tour="tour-hero"]',
    sectionLabel: 'Accueil & rythme',
    title: 'Personnalisez votre rythme et vos accès rapides',
    description:
      'Indiquez votre prénom, choisissez votre rythme du moment (Tranquille, Régulier ou Intensif) et lancez directement votre prochain cours, le Mode Défense Live ou votre semaine d’Immersion Pro.',
    interactiveTip:
      'Essayez maintenant : cliquez sur un rythme (10, 20 ou 40 min/jour) ou personnalisez votre prénom sans quitter la visite.',
    preferredPlacement: 'bottom',
    quickAction: {
      label: 'Ouvrir mon prochain cours',
      type: 'open-course',
    },
  },
  {
    id: 'map',
    targetSelector: '[data-tour="tour-map"]',
    sectionLabel: 'Carte de l’Archipel',
    title: 'Naviguez visuellement d’île en île',
    description:
      'Chaque balise numérotée représente un cours relié par des câbles sous-marins : vert pour les îles validées, bleu pour la prochaine étape recommandée.',
    interactiveTip:
      'Essayez maintenant : survolez une île sur la carte pour voir son résumé apparaître à gauche, puis cliquez dessus pour ouvrir son animation et son mini-jeu.',
    preferredPlacement: 'bottom',
  },
  {
    id: 'kpi',
    targetSelector: '[data-tour="tour-kpi"]',
    sectionLabel: 'Tableau de bord',
    title: 'Suivez vos XP, étoiles et diplôme',
    description:
      'Retrouvez ici votre expérience cumulée, le nombre d’îles reconnectées, vos étoiles de maîtrise (1 à 3 ★) ainsi que votre rang d’Architecte actuel.',
    interactiveTip:
      'Dès que vous avancez dans les cours, cliquez sur « Mon diplôme » pour générer votre certificat personnalisable en SVG ou PDF.',
    preferredPlacement: 'bottom',
  },
  {
    id: 'immersion',
    targetSelector: '[data-tour="tour-immersion"]',
    sectionLabel: 'Immersion débutant',
    title: 'Vivez votre première semaine en poste (5 jours)',
    description:
      'Conçue pour les débutants francophones : intégrez la PME Atelier Nord-Val, traitez de vrais tickets IT/Cyber avec un décodeur de jargon en français clair et préparez vos lignes de CV.',
    interactiveTip:
      'Idéal si vous débutez complètement et souhaitez comprendre le quotidien concret d’un technicien ou analyste junior.',
    preferredPlacement: 'top',
    quickAction: {
      label: 'Découvrir l’Immersion Pro',
      type: 'navigate',
      route: 'immersion',
    },
  },
  {
    id: 'missions',
    targetSelector: '[data-tour="tour-missions"]',
    sectionLabel: 'Missions SOC',
    title: 'Enquêtez sur de vrais journaux et incidents',
    description:
      'Au-delà des cours et des QCM, analysez des logs SIEM, interrogez la console forensique, extrayez les indicateurs d’attaque (IOC) et déployez la bonne règle de détection.',
    interactiveTip:
      'Chaque mission affiche son niveau de criticité (P1/P2), ses techniques MITRE ATT&CK et son temps SLA.',
    preferredPlacement: 'top',
    quickAction: {
      label: 'Ouvrir le Centre SOC',
      type: 'navigate',
      route: 'missions',
    },
  },
  {
    id: 'toolbar',
    targetSelector: '[data-tour="tour-toolbar"]',
    sectionLabel: 'Confort & outils',
    title: 'Adaptez l’affichage à votre confort',
    description:
      'Basculez entre Mode Clair et Mode Sombre, activez la Lecture facilitée ou le Mode Projection, réglez la vitesse de la voix off et ouvrez l’Antisèche A4 imprimable.',
    interactiveTip:
      'Le « Code de transfert & Mode Classe » vous permet aussi de sauvegarder ou partager votre progression sur un autre poste.',
    preferredPlacement: 'top',
  },
  {
    id: 'tracks',
    targetSelector: '[data-tour="tour-tracks"]',
    sectionLabel: 'Parcours métiers',
    title: 'Filtrez l’archipel selon votre objectif',
    description:
      'Choisissez entre le parcours complet ou une spécialisation (Réseaux, Cloud & Windows/AD, Cyber & SOC) pour filtrer instantanément la carte et la liste des cours.',
    interactiveTip:
      'Essayez maintenant : cliquez sur l’une des 4 cartes métier pour voir le compteur d’étapes s’adapter en direct.',
    preferredPlacement: 'top',
  },
  {
    id: 'roadmap',
    targetSelector: '[data-tour="tour-roadmap"]',
    sectionLabel: 'Feuille de route',
    title: 'Progressez palier par palier jusqu’au diplôme',
    description:
      'Les cours sont organisés en 6 paliers progressifs : fondamentaux réseau, systèmes (Linux, Windows Server, Active Directory), sécurité, Cloud/Kubernetes puis investigation SOC.',
    interactiveTip:
      'Chaque carte de cours combine une courte animation commentée et un atelier pratique interactif. En bas de page vous attendent vos badges et quêtes.',
    preferredPlacement: 'top',
    quickAction: {
      label: 'Lancer le Mode Défense Live',
      type: 'navigate',
      route: 'defense',
    },
  },
];

const ESSENTIAL_TOUR_STEPS: LearningTourStep[] = [
  {
    id: 'header',
    targetSelector: '[data-tour="tour-header"]',
    sectionLabel: 'Navigation ciblée',
    title: '5 espaces essentiels, sans surcharge',
    description:
      'En mode Parcours Essentiel, la barre du haut se concentre sur vos 5 outils clés : Parcours, Immersion Pro, Missions SOC, Mode Défense et Quiz/Examen.',
    interactiveTip:
      'Vous pouvez relancer ou quitter ce Mode Apprentissage à tout moment depuis le bouton en haut à droite.',
    preferredPlacement: 'bottom',
  },
  {
    id: 'hero',
    targetSelector: '[data-tour="tour-hero"]',
    sectionLabel: 'Accueil & rythme',
    title: 'Un point de départ unique et votre rythme',
    description:
      'Personnalisez votre prénom, choisissez votre rythme quotidien et cliquez sur le bouton principal pour reprendre exactement l’étape en cours du parcours.',
    interactiveTip:
      'Le sélecteur tout en haut vous permet à tout moment de basculer vers le Catalogue Complet (33 cours et tous les labos).',
    preferredPlacement: 'bottom',
    quickAction: {
      label: 'Ouvrir mon prochain cours',
      type: 'open-course',
    },
  },
  {
    id: 'map',
    targetSelector: '[data-tour="tour-map"]',
    sectionLabel: 'Carte de l’Archipel',
    title: 'Visualisez les 6 îles du socle fondamental',
    description:
      'La carte met en avant les îles du Parcours Essentiel (Signaux, IP/DNS, TCP/Pare-feu, Linux, Active Directory et SOC) tout en estompant le reste pour garder un cap clair.',
    interactiveTip:
      'Essayez maintenant : survolez une île lumineuse pour lire son aperçu, ou cliquez dessus pour lancer son cours.',
    preferredPlacement: 'bottom',
  },
  {
    id: 'kpi',
    targetSelector: '[data-tour="tour-kpi"]',
    sectionLabel: 'Tableau de bord',
    title: 'Suivez vos XP, étoiles et diplôme',
    description:
      'Suivez votre progression réelle : expérience cumulée, îles reconnectées, étoiles de maîtrise (1 à 3 ★) et accès direct à votre Diplôme d’Architecte.',
    interactiveTip:
      'Chaque cours terminé, mission SOC clôturée ou session de Mode Défense fait évoluer vos indicateurs en temps réel.',
    preferredPlacement: 'bottom',
  },
  {
    id: 'essential',
    targetSelector: '[data-tour="tour-essential"]',
    sectionLabel: 'Parcours en 6 étapes',
    title: 'Votre colonne vertébrale de zéro à opérationnel',
    description:
      'De la compréhension d’un paquet jusqu’à la topologie 2D, Linux/AD, la semaine en poste, l’enquête SIEM/Défense et l’examen blanc : chaque étape vérifie une vraie compétence.',
    interactiveTip:
      'Suivez simplement l’étape marquée « ▶ EN COURS » jusqu’au bout, puis ouvrez le Catalogue Complet si vous souhaitez aller plus loin.',
    preferredPlacement: 'top',
    quickAction: {
      label: 'Découvrir l’Immersion Pro',
      type: 'navigate',
      route: 'immersion',
    },
  },
  {
    id: 'toolbar',
    targetSelector: '[data-tour="tour-toolbar"]',
    sectionLabel: 'Confort & outils',
    title: 'Adaptez l’affichage et gardez votre antisèche',
    description:
      'Basculez entre Mode Clair/Sombre, activez la Lecture facilitée ou le Mode Projection, réglez la voix off et imprimez votre Antisèche A4.',
    interactiveTip:
      'Le « Code de transfert & Mode Classe » permet aussi de sauvegarder votre progression hors-ligne.',
    preferredPlacement: 'top',
    quickAction: {
      label: 'Lancer le Mode Défense Live',
      type: 'navigate',
      route: 'defense',
    },
  },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface LearningTourOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteTour: () => void;
  alreadyCompleted?: boolean;
  workspaceScope?: 'essential' | 'full';
  onNavigateRoute?: (route: AppRoute) => void;
  onOpenFirstCourse?: () => void;
}

export const LearningTourOverlay: React.FC<LearningTourOverlayProps> = ({
  isOpen,
  onClose,
  onCompleteTour,
  alreadyCompleted = false,
  workspaceScope = 'essential',
  onNavigateRoute,
  onOpenFirstCourse,
}) => {
  const activeSteps = workspaceScope === 'essential' ? ESSENTIAL_TOUR_STEPS : LEARNING_TOUR_STEPS;
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 392, height: 290 });

  const currentStep = activeSteps[stepIndex] ?? activeSteps[0];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === activeSteps.length - 1;

  // Reset to step 0 whenever the tour is reopened or scope changes
  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
    }
  }, [isOpen, workspaceScope]);

  const measureTarget = useCallback(() => {
    if (!isOpen) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setViewport({ width: vw, height: vh });

    const el = document.querySelector<HTMLElement>(currentStep.targetSelector);
    if (!el) {
      setTargetRect(null);
      return;
    }

    const raw = el.getBoundingClientRect();
    const pad = currentStep.id === 'header' ? 2 : 8;
    const headerFloor = currentStep.id === 'header' ? 0 : 72;

    // Clamp tall sections (like the full 6-phase roadmap) to a crisp visible spotlight window
    const clampedTop = Math.max(headerFloor, raw.top - pad);
    const clampedBottom = Math.min(vh - 12, raw.bottom + pad);
    const visibleHeight = Math.max(64, Math.min(clampedBottom - clampedTop, vh * 0.56));
    const clampedLeft = Math.max(8, raw.left - pad);
    const clampedWidth = Math.min(vw - clampedLeft - 8, raw.width + pad * 2);

    setTargetRect({
      top: clampedTop,
      left: clampedLeft,
      width: Math.max(120, clampedWidth),
      height: visibleHeight,
    });
  }, [isOpen, currentStep.id, currentStep.targetSelector]);

  // Scroll the target element smoothly into view whenever the active step changes
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    let retryTimer: number | null = null;
    let settleTimer: number | null = null;

    const focusStepTarget = (attempt: number) => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(currentStep.targetSelector);
      if (!el) {
        if (attempt < 10) {
          retryTimer = window.setTimeout(() => focusStepTarget(attempt + 1), 80);
        } else {
          setTargetRect(null);
        }
        return;
      }

      if (currentStep.id === 'header') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const rect = el.getBoundingClientRect();
        const isTall = rect.height > window.innerHeight * 0.72;
        if (isTall) {
          const targetTop = Math.max(0, window.scrollY + rect.top - 96);
          window.scrollTo({ top: targetTop, behavior: 'smooth' });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      measureTarget();
      settleTimer = window.setTimeout(() => {
        if (!cancelled) measureTarget();
      }, 360);
    };

    focusStepTarget(0);

    return () => {
      cancelled = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      if (settleTimer !== null) window.clearTimeout(settleTimer);
    };
  }, [isOpen, currentStep.id, currentStep.targetSelector, measureTarget]);

  // Keep spotlight and tooltip locked to the element during scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    let rafId = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measureTarget);
    };

    window.addEventListener('scroll', scheduleMeasure, { passive: true });
    window.addEventListener('resize', scheduleMeasure);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [isOpen, measureTarget]);

  useLayoutEffect(() => {
    if (!isOpen || !tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setTooltipSize({ width: rect.width, height: rect.height });
    }
  }, [isOpen, stepIndex, viewport.width]);

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) {
      playClick();
      setStepIndex((i) => i - 1);
    }
  }, [stepIndex]);

  const handleNext = useCallback(() => {
    if (stepIndex < activeSteps.length - 1) {
      playClick();
      setStepIndex((i) => i + 1);
    } else {
      playVictory();
      onCompleteTour();
      onClose();
    }
  }, [stepIndex, activeSteps.length, onCompleteTour, onClose]);

  const handleClose = useCallback(() => {
    playClick();
    onClose();
  }, [onClose]);

  // Keyboard shortcuts: ArrowRight / ArrowLeft / Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose, handleNext, handlePrev]);

  const tooltipPosition = useMemo(() => {
    const margin = 16;
    const cardW = Math.min(400, viewport.width - margin * 2);
    const cardH = Math.min(tooltipSize.height || 300, viewport.height - 96);

    if (!targetRect) {
      return {
        top: Math.max(84, (viewport.height - cardH) / 2),
        left: Math.max(margin, (viewport.width - cardW) / 2),
        width: cardW,
        arrowSide: 'none' as 'top' | 'bottom' | 'none',
        arrowOffsetX: cardW / 2,
      };
    }

    const gap = 16;
    const spaceBelow = viewport.height - (targetRect.top + targetRect.height) - margin;
    const spaceAbove = targetRect.top - 72 - margin;

    let place: 'bottom' | 'top' | 'floating' = 'bottom';
    if (currentStep.preferredPlacement === 'top') {
      if (spaceAbove >= cardH + gap) {
        place = 'top';
      } else if (spaceBelow >= cardH + gap) {
        place = 'bottom';
      } else {
        place = 'floating';
      }
    } else {
      if (spaceBelow >= cardH + gap) {
        place = 'bottom';
      } else if (spaceAbove >= cardH + gap) {
        place = 'top';
      } else {
        place = 'floating';
      }
    }

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const idealLeft = targetCenterX - cardW / 2;
    const clampedLeft = Math.max(margin, Math.min(viewport.width - cardW - margin, idealLeft));
    const arrowOffsetX = Math.max(24, Math.min(cardW - 24, targetCenterX - clampedLeft));

    if (place === 'bottom') {
      return {
        top: Math.min(viewport.height - cardH - margin, targetRect.top + targetRect.height + gap),
        left: clampedLeft,
        width: cardW,
        arrowSide: 'top' as const,
        arrowOffsetX,
      };
    }
    if (place === 'top') {
      return {
        top: Math.max(76, targetRect.top - cardH - gap),
        left: clampedLeft,
        width: cardW,
        arrowSide: 'bottom' as const,
        arrowOffsetX,
      };
    }

    // Tall section fallback: anchor cleanly in the bottom-right corner without blocking the spotlight
    return {
      top: Math.max(84, viewport.height - cardH - 20),
      left: Math.max(margin, viewport.width - cardW - 24),
      width: cardW,
      arrowSide: 'none' as const,
      arrowOffsetX: cardW / 2,
    };
  }, [targetRect, viewport.width, viewport.height, tooltipSize.height, currentStep.preferredPlacement]);

  const handleQuickAction = () => {
    const action = currentStep.quickAction;
    if (!action) return;
    playSuccess();
    onClose();
    if (action.type === 'open-course' && onOpenFirstCourse) {
      onOpenFirstCourse();
    } else if (action.type === 'navigate' && action.route && onNavigateRoute) {
      onNavigateRoute(action.route);
    }
  };

  const progressPct = Math.round(((stepIndex + 1) / activeSteps.length) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] pointer-events-none"
          role="dialog"
          aria-modal="false"
          aria-label="Tutoriel guidé Mode Apprentissage"
        >
          {/* Dimmed backdrop with interactive SVG cutout spotlight */}
          <motion.svg
            key="tour-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE_SWISS }}
            className="fixed inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <mask id="cyberland-learning-tour-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {targetRect && (
                  <rect
                    x={targetRect.left}
                    y={targetRect.top}
                    width={targetRect.width}
                    height={targetRect.height}
                    rx={14}
                    ry={14}
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(2, 6, 23, 0.64)"
              mask="url(#cyberland-learning-tour-mask)"
            />
          </motion.svg>

          {/* Crisp spotlight frame around the active section */}
          {targetRect && (
            <motion.div
              key={`spotlight-${currentStep.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE_SWISS }}
              style={{
                top: targetRect.top,
                left: targetRect.left,
                width: targetRect.width,
                height: targetRect.height,
              }}
              className="fixed rounded-[14px] ring-2 ring-sky-500 dark:ring-cyan-400 shadow-[0_0_0_4px_rgba(14,165,233,0.18)] pointer-events-none"
            />
          )}

          {/* Interactive anchored tooltip card */}
          <motion.div
            ref={tooltipRef}
            key={`tooltip-${currentStep.id}`}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE_SWISS }}
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              width: tooltipPosition.width,
            }}
            className="fixed z-[75] pointer-events-auto rounded-2xl border border-slate-200 dark:border-cyan-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-5 space-y-4"
          >
            {/* Directional pointer caret */}
            {tooltipPosition.arrowSide === 'top' && (
              <div
                style={{ left: tooltipPosition.arrowOffsetX - 8 }}
                className="absolute -top-2 w-4 h-4 rotate-45 bg-white dark:bg-slate-900 border-t border-l border-slate-200 dark:border-cyan-500/40"
                aria-hidden="true"
              />
            )}
            {tooltipPosition.arrowSide === 'bottom' && (
              <div
                style={{ left: tooltipPosition.arrowOffsetX - 8 }}
                className="absolute -bottom-2 w-4 h-4 rotate-45 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-cyan-500/40"
                aria-hidden="true"
              />
            )}

            {/* Top bar: unboxed metadata + close */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-sky-700 dark:text-cyan-400 font-semibold">
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Étape {String(stepIndex + 1).padStart(2, '0')} /{' '}
                    {String(activeSteps.length).padStart(2, '0')}
                  </span>
                  <span aria-hidden="true" className="text-slate-400">
                    ·
                  </span>
                  <span className="truncate font-sans font-medium text-slate-600 dark:text-slate-300">
                    {currentStep.sectionLabel}
                  </span>
                </div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {currentStep.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Quitter le Mode Apprentissage"
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thin progress bar */}
            <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-sky-600 dark:bg-cyan-400 transition-all duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Explanation prose */}
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {currentStep.description}
            </p>

            {/* Practical interactive tip */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2.5">
              <Compass className="w-4 h-4 text-sky-700 dark:text-cyan-400 shrink-0 mt-0.5" />
              <span>{currentStep.interactiveTip}</span>
            </div>

            {/* Optional direct action link to try the section */}
            {currentStep.quickAction && (
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleQuickAction}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-cyan-400 hover:text-sky-900 dark:hover:text-cyan-300 hover:underline transition-colors"
                >
                  <span>{currentStep.quickAction.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
                {isLast && !alreadyCompleted && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    <Award className="w-3.5 h-3.5 shrink-0" />
                    +25 XP à la fin
                  </span>
                )}
              </div>
            )}

            {/* Direct step jump selector */}
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1" role="tablist" aria-label="Étapes du tutoriel">
                {activeSteps.map((step, idx) => {
                  const active = idx === stepIndex;
                  const done = idx < stepIndex;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      title={`${idx + 1}. ${step.sectionLabel}`}
                      onClick={() => {
                        playClick();
                        setStepIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        active
                          ? 'w-5 bg-sky-700 dark:bg-cyan-400'
                          : done
                          ? 'w-2 bg-emerald-500 dark:bg-emerald-400 hover:opacity-80'
                          : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-500'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                ← / → · Échap
              </span>
            </div>

            {/* Footer navigation controls */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={isFirst}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                Précédent
              </button>

              <div className="flex items-center gap-2">
                {!isLast && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-3 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    Passer
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 transition-colors whitespace-nowrap shrink-0"
                >
                  {isLast ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Terminer la visite
                    </>
                  ) : (
                    <>
                      Suivant
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
