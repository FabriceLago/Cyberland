export type MedalTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'emerald' | 'diamond';

export interface ExpertiseBadge {
  id: string;
  title: string;
  tierLabel: string;
  tier: MedalTier;
  description: string;
  minXp: number;
  minPassedExams: number;
  minExamScore: number | null;
  minSpeedruns?: number;
  minNeutralizedAttacks?: number;
  iconKey: 'compass' | 'zap' | 'shield' | 'cloud' | 'radar' | 'crown';
}

export interface EvaluatedExpertiseBadge extends ExpertiseBadge {
  unlocked: boolean;
  xpMet: boolean;
  examsMet: boolean;
  scoreMet: boolean;
  extraMet: boolean;
  xpProgressPct: number;
  overallProgressPct: number;
}

export const EXPERTISE_BADGES: ExpertiseBadge[] = [
  {
    id: 'medal-scout',
    title: 'Éclaireur Numérique',
    tierLabel: 'Médaille Bronze',
    tier: 'bronze',
    description:
      'Premières liaisons rétablies et maîtrise des bases du découpage en paquets et de l’adressage IP.',
    minXp: 250,
    minPassedExams: 0,
    minExamScore: null,
    iconKey: 'compass',
  },
  {
    id: 'medal-network-ninja',
    title: 'Réseau Ninja',
    tierLabel: 'Médaille Argent',
    tier: 'silver',
    description:
      'Routage IP, DNS, pare-feu, modèle OSI et premier Examen Blanc validé avec la moyenne.',
    minXp: 800,
    minPassedExams: 1,
    minExamScore: 10,
    iconKey: 'zap',
  },
  {
    id: 'medal-speedrun-flash',
    title: 'Éclair Speedrun',
    tierLabel: 'Médaille Argent',
    tier: 'silver',
    description:
      'Réactivité exceptionnelle sous pression : au moins 1 circuit Speedrun validé avec multiplicateur d’XP.',
    minXp: 600,
    minPassedExams: 0,
    minExamScore: null,
    minSpeedruns: 1,
    iconKey: 'zap',
  },
  {
    id: 'medal-threat-hunter',
    title: 'Chasseur de Menaces',
    tierLabel: 'Médaille Or',
    tier: 'gold',
    description:
      'Neutralisation en temps réel d’au moins 3 cyberattaques majeures (XSS, MitM, Ransomware, SQLi, DDoS…).',
    minXp: 1100,
    minPassedExams: 0,
    minExamScore: null,
    minNeutralizedAttacks: 3,
    iconKey: 'shield',
  },
  {
    id: 'medal-cyber-sentinel',
    title: 'Sentinelle Cyber',
    tierLabel: 'Médaille Or',
    tier: 'gold',
    description:
      'Maîtrise Zero Trust, cryptographie, Active Directory et SOC/SIEM confirmée avec mention Assez Bien.',
    minXp: 1400,
    minPassedExams: 1,
    minExamScore: 12,
    iconKey: 'shield',
  },
  {
    id: 'medal-cloud-architect',
    title: 'Cloud Architect',
    tierLabel: 'Médaille Platine',
    tier: 'platinum',
    description:
      'Architecture résiliente Multi-AZ, Docker, Kubernetes, FinOps et solide performance aux examens.',
    minXp: 2000,
    minPassedExams: 2,
    minExamScore: 14,
    iconKey: 'cloud',
  },
  {
    id: 'medal-observability',
    title: 'Maître Observabilité',
    tierLabel: 'Médaille Émeraude',
    tier: 'emerald',
    description:
      'Dissection Wireshark/tcpdump, requêtes KQL Azure Monitor et mention Très Bien à l’Examen Blanc.',
    minXp: 2600,
    minPassedExams: 2,
    minExamScore: 16,
    iconKey: 'radar',
  },
  {
    id: 'medal-legend',
    title: 'Légende de Cyberland',
    tierLabel: 'Médaille Diamant',
    tier: 'diamond',
    description:
      'Excellence absolue sur tout l’archipel et Félicitations du Jury (≥ 18/20) à l’Examen Blanc.',
    minXp: 3200,
    minPassedExams: 3,
    minExamScore: 18,
    iconKey: 'crown',
  },
];

export function evaluateExpertiseBadges(
  totalXp: number,
  passedExamsCount: number,
  bestExamScore: number | null,
  speedrunsCompleted = 0,
  neutralizedAttacksCount = 0
): EvaluatedExpertiseBadge[] {
  const safeScore = bestExamScore ?? 0;

  return EXPERTISE_BADGES.map((badge) => {
    const xpMet = totalXp >= badge.minXp;
    const examsMet = passedExamsCount >= badge.minPassedExams;
    const scoreMet = badge.minExamScore === null || safeScore >= badge.minExamScore;
    const speedrunMet = !badge.minSpeedruns || speedrunsCompleted >= badge.minSpeedruns;
    const attacksMet =
      !badge.minNeutralizedAttacks || neutralizedAttacksCount >= badge.minNeutralizedAttacks;
    const extraMet = speedrunMet && attacksMet;
    const unlocked = xpMet && examsMet && scoreMet && extraMet;

    const xpProgressPct = Math.min(100, Math.round((totalXp / badge.minXp) * 100));

    const parts: number[] = [xpProgressPct];
    if (badge.minPassedExams > 0) {
      parts.push(Math.min(100, Math.round((passedExamsCount / badge.minPassedExams) * 100)));
    }
    if (badge.minExamScore !== null) {
      parts.push(Math.min(100, Math.round((safeScore / badge.minExamScore) * 100)));
    }
    if (badge.minSpeedruns) {
      parts.push(Math.min(100, Math.round((speedrunsCompleted / badge.minSpeedruns) * 100)));
    }
    if (badge.minNeutralizedAttacks) {
      parts.push(
        Math.min(100, Math.round((neutralizedAttacksCount / badge.minNeutralizedAttacks) * 100))
      );
    }
    const overallProgressPct = Math.round(
      parts.reduce((acc, val) => acc + val, 0) / parts.length
    );

    return {
      ...badge,
      unlocked,
      xpMet,
      examsMet,
      scoreMet,
      extraMet,
      xpProgressPct,
      overallProgressPct,
    };
  });
}

export function getHighestUnlockedBadge(
  totalXp: number,
  passedExamsCount: number,
  bestExamScore: number | null,
  speedrunsCompleted = 0,
  neutralizedAttacksCount = 0
): EvaluatedExpertiseBadge | null {
  const evaluated = evaluateExpertiseBadges(
    totalXp,
    passedExamsCount,
    bestExamScore,
    speedrunsCompleted,
    neutralizedAttacksCount
  );
  const unlocked = evaluated.filter((b) => b.unlocked);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}
