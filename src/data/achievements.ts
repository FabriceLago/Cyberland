export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type AchievementCategory =
  | 'Exploration'
  | 'Réseau'
  | 'Investigation'
  | 'Défense SOC'
  | 'Performance'
  | 'Maîtrise';

export type AchievementIconKey =
  | 'compass'
  | 'map'
  | 'network'
  | 'search'
  | 'shield'
  | 'flag'
  | 'zap'
  | 'activity'
  | 'graduation'
  | 'flame'
  | 'cloud'
  | 'crown';

export interface AchievementProgressSnapshot {
  completedIslands: number[];
  solvedDebugCount: number;
  ctfFlagsCount: number;
  neutralizedAttacksCount: number;
  ddosWon: boolean;
  terminalCompleted: boolean;
  crisisContained: boolean;
  speedrunsCompleted: number;
  bestExamScore: number | null;
  passedExamsCount: number;
  dailyStreak: number;
  claimedQuestsCount: number;
  bestSocSurvivalScore: number;
}

export interface AchievementProgressDetail {
  current: number;
  target: number;
  unitLabel: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  conditionLabel: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: AchievementIconKey;
  xpReward: number;
  isUnlocked: (snapshot: AchievementProgressSnapshot) => boolean;
  getProgress: (snapshot: AchievementProgressSnapshot) => AchievementProgressDetail;
}

const NETWORK_CORE_ISLANDS = [1, 2, 3, 4, 8, 20];
const CLOUD_API_ISLANDS = [13, 18, 22];

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'premier-pas',
    title: 'Premier pas',
    description: 'Vous avez posé le pied sur l’Archipel de Cyberland et validé votre toute première île.',
    conditionLabel: 'Compléter au moins 1 île du parcours',
    category: 'Exploration',
    tier: 'bronze',
    icon: 'compass',
    xpReward: 25,
    isUnlocked: (s) => s.completedIslands.length >= 1,
    getProgress: (s) => ({
      current: Math.min(s.completedIslands.length, 1),
      target: 1,
      unitLabel: 'île',
    }),
  },
  {
    id: 'explorateur-archipel',
    title: 'Explorateur Confirmé',
    description: 'Vous maîtrisez déjà plusieurs piliers fondamentaux des réseaux et des systèmes.',
    conditionLabel: 'Compléter 5 îles du parcours',
    category: 'Exploration',
    tier: 'bronze',
    icon: 'map',
    xpReward: 50,
    isUnlocked: (s) => s.completedIslands.length >= 5,
    getProgress: (s) => ({
      current: Math.min(s.completedIslands.length, 5),
      target: 5,
      unitLabel: 'îles',
    }),
  },
  {
    id: 'expert-reseau',
    title: 'Expert Réseau',
    description: 'IP, DNS, routage, pare-feu et VLAN n’ont plus aucun secret pour votre architecture.',
    conditionLabel: 'Valider les 6 îles Réseau clés (1, 2, 3, 4, 8, 20) ou 10 îles au total',
    category: 'Réseau',
    tier: 'gold',
    icon: 'network',
    xpReward: 100,
    isUnlocked: (s) =>
      NETWORK_CORE_ISLANDS.every((id) => s.completedIslands.includes(id)) ||
      s.completedIslands.length >= 10,
    getProgress: (s) => {
      const coreDone = NETWORK_CORE_ISLANDS.filter((id) =>
        s.completedIslands.includes(id)
      ).length;
      if (s.completedIslands.length >= 10) {
        return { current: 6, target: 6, unitLabel: 'îles clés' };
      }
      return { current: coreDone, target: 6, unitLabel: 'îles clés' };
    },
  },
  {
    id: 'cyber-detective',
    title: 'Cyber-Détective',
    description: 'Vous traquez les anomalies dans les logs, les paquets et les pannes réseau avec méthode.',
    conditionLabel: 'Résoudre 3 tickets Debug Express ou capturer 2 drapeaux CTF',
    category: 'Investigation',
    tier: 'silver',
    icon: 'search',
    xpReward: 75,
    isUnlocked: (s) => s.solvedDebugCount >= 3 || s.ctfFlagsCount >= 2,
    getProgress: (s) => {
      if (s.ctfFlagsCount >= 2) {
        return { current: 2, target: 2, unitLabel: 'flags CTF' };
      }
      return {
        current: Math.min(s.solvedDebugCount, 3),
        target: 3,
        unitLabel: 'tickets Debug',
      };
    },
  },
  {
    id: 'gardien-temps-reel',
    title: 'Gardien Temps Réel',
    description: 'Face aux attaques en direct, vous appliquez les bonnes contre-mesures sans paniquer.',
    conditionLabel: 'Neutraliser 3 cyberattaques Live ou repousser l’attaque DDoS',
    category: 'Défense SOC',
    tier: 'silver',
    icon: 'shield',
    xpReward: 80,
    isUnlocked: (s) => s.neutralizedAttacksCount >= 3 || s.ddosWon,
    getProgress: (s) => ({
      current: s.ddosWon ? 3 : Math.min(s.neutralizedAttacksCount, 3),
      target: 3,
      unitLabel: 'attaques neutralisées',
    }),
  },
  {
    id: 'chasseur-ctf',
    title: 'Chasseur de Drapeaux',
    description: 'Base64, Nginx, HTTP, DNS Tunneling et PrivEsc Linux : un sans-faute en CTF Jeopardy.',
    conditionLabel: 'Capturer les 5 drapeaux du Labo CTF Guidé',
    category: 'Investigation',
    tier: 'gold',
    icon: 'flag',
    xpReward: 100,
    isUnlocked: (s) => s.ctfFlagsCount >= 5,
    getProgress: (s) => ({
      current: Math.min(s.ctfFlagsCount, 5),
      target: 5,
      unitLabel: 'flags CTF',
    }),
  },
  {
    id: 'eclair-speedrun',
    title: 'Éclair du Speedrun',
    description: 'Vous savez diagnostiquer et valider une série d’ateliers sous la pression du chronomètre.',
    conditionLabel: 'Terminer au moins 1 circuit en mode Speedrun',
    category: 'Performance',
    tier: 'silver',
    icon: 'zap',
    xpReward: 60,
    isUnlocked: (s) => s.speedrunsCompleted >= 1,
    getProgress: (s) => ({
      current: Math.min(s.speedrunsCompleted, 1),
      target: 1,
      unitLabel: 'circuit',
    }),
  },
  {
    id: 'survivant-soc',
    title: 'Survivant du SOC',
    description: 'Votre sang-froid en salle de crise et face aux vagues d’alertes SIEM est exemplaire.',
    conditionLabel: 'Atteindre 300 pts en Mode Survie SOC ou contenir la Crise Cyber',
    category: 'Défense SOC',
    tier: 'gold',
    icon: 'activity',
    xpReward: 80,
    isUnlocked: (s) => s.bestSocSurvivalScore >= 300 || s.crisisContained,
    getProgress: (s) => ({
      current: s.crisisContained ? 300 : Math.min(s.bestSocSurvivalScore, 300),
      target: 300,
      unitLabel: 'pts Survie',
    }),
  },
  {
    id: 'certifie-cyberland',
    title: 'Certifié Cyberland',
    description: 'Votre score à l’Examen Final prouve une solide préparation technique.',
    conditionLabel: 'Obtenir au moins 14 / 20 à l’Examen Final',
    category: 'Maîtrise',
    tier: 'gold',
    icon: 'graduation',
    xpReward: 120,
    isUnlocked: (s) => s.bestExamScore !== null && s.bestExamScore >= 14,
    getProgress: (s) => ({
      current: s.bestExamScore !== null ? Math.min(s.bestExamScore, 14) : 0,
      target: 14,
      unitLabel: 'pts / 20',
    }),
  },
  {
    id: 'assidu-archipel',
    title: 'Assidu de l’Archipel',
    description: 'La régularité forge les meilleurs ingénieurs réseau et cybersécurité.',
    conditionLabel: 'Atteindre 3 jours de série Défi du Jour ou réclamer 2 quêtes',
    category: 'Performance',
    tier: 'bronze',
    icon: 'flame',
    xpReward: 60,
    isUnlocked: (s) => s.dailyStreak >= 3 || s.claimedQuestsCount >= 2,
    getProgress: (s) => {
      if (s.claimedQuestsCount >= 2) {
        return { current: 2, target: 2, unitLabel: 'quêtes' };
      }
      return {
        current: Math.min(s.dailyStreak, 3),
        target: 3,
        unitLabel: 'jours de série',
      };
    },
  },
  {
    id: 'architecte-cloud-api',
    title: 'Architecte Cloud & API',
    description: 'Vous maîtrisez l’écosystème moderne : Cloud, conteneurs, OAuth 2.0 et JWT.',
    conditionLabel: 'Valider les îles Cloud (13), Serveurs & Pare-feu (18) et API/JWT (22)',
    category: 'Réseau',
    tier: 'gold',
    icon: 'cloud',
    xpReward: 100,
    isUnlocked: (s) => CLOUD_API_ISLANDS.every((id) => s.completedIslands.includes(id)),
    getProgress: (s) => ({
      current: CLOUD_API_ISLANDS.filter((id) => s.completedIslands.includes(id)).length,
      target: 3,
      unitLabel: 'îles Cloud/API',
    }),
  },
  {
    id: 'maitre-archipel',
    title: 'Maître de l’Archipel',
    description: 'Exploit ultime : toutes les îles de Cyberland ont été explorées et validées.',
    conditionLabel: 'Compléter l’intégralité des 22 îles de Cyberland',
    category: 'Maîtrise',
    tier: 'platinum',
    icon: 'crown',
    xpReward: 250,
    isUnlocked: (s) => s.completedIslands.length >= 22,
    getProgress: (s) => ({
      current: Math.min(s.completedIslands.length, 22),
      target: 22,
      unitLabel: 'îles',
    }),
  },
];

export function evaluateNewlyUnlockedAchievements(
  snapshot: AchievementProgressSnapshot,
  alreadyUnlockedIds: string[]
): AchievementDefinition[] {
  const alreadySet = new Set(alreadyUnlockedIds);
  return ACHIEVEMENTS.filter((ach) => !alreadySet.has(ach.id) && ach.isUnlocked(snapshot));
}
