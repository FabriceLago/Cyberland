export type LearningPaceId = 'tranquille' | 'regulier' | 'intensif';

export interface LearningPaceOption {
  id: LearningPaceId;
  label: string;
  duration: string;
  detail: string;
}

export const LEARNING_PACES: LearningPaceOption[] = [
  {
    id: 'tranquille',
    label: 'Tranquille',
    duration: '10 min / jour',
    detail: 'Une notion clé ou un défi quotidien, sans pression.',
  },
  {
    id: 'regulier',
    label: 'Régulier',
    duration: '20 min / jour',
    detail: 'Une île et un atelier pratique pour ancrer vos réflexes.',
  },
  {
    id: 'intensif',
    label: 'Prépa entretien',
    duration: '45 min / jour',
    detail: 'Parcours complet, diagnostics SOC et examen blanc.',
  },
];

export function getTimeGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 13) return 'Bonjour';
  if (hour >= 13 && hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export function getFriendlyFirstName(learnerName: string): string {
  const trimmed = learnerName.trim();
  if (
    !trimmed ||
    trimmed.toLowerCase() === 'architecte explorateur' ||
    trimmed.toLowerCase() === 'explorateur cyberland'
  ) {
    return '';
  }
  return trimmed.split(/\s+/)[0] ?? '';
}

export function getHumanEncouragement(
  completedCount: number,
  totalIslands: number,
  pace: LearningPaceId,
  solvedDebugCount: number
): string {
  if (completedCount === 0) {
    if (pace === 'tranquille') {
      return 'On démarre en douceur : 10 minutes suffisent pour reconnecter votre première île.';
    }
    if (pace === 'intensif') {
      return 'Prêt pour une vraie mise en situation ? Démarrez sur l’Île 1 puis enchaînez avec un labo terrain.';
    }
    return 'Ravi de vous retrouver aujourd’hui. Installez-vous confortablement et lancez votre première étape.';
  }

  if (completedCount >= totalIslands) {
    return 'Bravo pour ce parcours complet ! Vous pouvez maintenant affûter vos réflexes sur les labos SOC et l’examen blanc.';
  }

  if (completedCount < 5) {
    return `Beau démarrage avec ${completedCount} île${completedCount > 1 ? 's' : ''} validée${completedCount > 1 ? 's' : ''}. Continuez à votre rythme, les automatismes se mettent déjà en place.`;
  }

  if (solvedDebugCount >= 3) {
    return `Déjà ${completedCount} îles et ${solvedDebugCount} incidents résolus : vos réflexes techniques se renforcent à chaque atelier.`;
  }

  return `${completedCount} îles sur ${totalIslands} déjà validées — un pas de plus aujourd’hui et le cap suivant est à vous.`;
}
