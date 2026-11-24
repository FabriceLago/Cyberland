import { AppRoute } from '../components/Header';

export interface DemoSubtitleCue {
  /** Seconds from the start of the chapter */
  offsetSec: number;
  text: string;
}

export interface DemoChapter {
  id: string;
  index: number;
  title: string;
  shortLabel: string;
  startSec: number;
  durationSec: number;
  timecodeLabel: string;
  narration: string;
  captions: DemoSubtitleCue[];
  highlights: string[];
  actionLabel: string;
  targetRoute: AppRoute;
  targetIslandId?: number;
}

export const TOTAL_DEMO_DURATION_SEC = 300; // Exactement 5 minutes (05:00)

export const DEMO_CHAPTERS: DemoChapter[] = [
  {
    id: 'welcome',
    index: 1,
    title: 'Bienvenue sur Cyberland & Prise en main',
    shortLabel: 'Accueil & Rythme',
    startSec: 0,
    durationSec: 30,
    timecodeLabel: '00:00 – 00:30',
    narration:
      "Bienvenue dans la visite guidée de Cyberland. En cinq minutes, nous allons voir comment utiliser chaque espace de la plateforme pour progresser en réseaux, Cloud et cybersécurité. Dès l'accueil, personnalisez votre prénom et choisissez votre rythme quotidien : Tranquille dix minutes par jour, Régulier vingt minutes, ou Prépa entretien. Votre tableau de bord suit en temps réel votre expérience, vos étoiles et vos modules validés.",
    captions: [
      {
        offsetSec: 0,
        text: 'Bienvenue sur Cyberland : 5 minutes pour maîtriser le fonctionnement complet de la plateforme.',
      },
      {
        offsetSec: 10,
        text: 'Personnalisez votre prénom et choisissez votre rythme : Tranquille (10 min), Régulier (20 min) ou Prépa entretien.',
      },
      {
        offsetSec: 20,
        text: 'Le bandeau de progression calcule en direct votre XP, vos étoiles de maîtrise et votre rang actuel.',
      },
    ],
    highlights: [
      'Accueil personnalisé selon l’heure et modification directe du prénom',
      'Choix du rythme quotidien sauvegardé automatiquement',
      'Mode sombre/clair, lecture facilitée et mode projection en un clic',
    ],
    actionLabel: 'Ouvrir l’accueil',
    targetRoute: 'archipel',
  },
  {
    id: 'analyst-roadmap',
    index: 2,
    title: 'La Feuille de Route Analyste en 5 Paliers',
    shortLabel: 'Feuille de route',
    startSec: 30,
    durationSec: 40,
    timecodeLabel: '00:30 – 01:10',
    narration:
      "Pour devenir un bon analyste, l'ordre d'apprentissage est essentiel. Les vingt-deux étapes sont organisées en cinq paliers progressifs : d'abord les fondations réseau avec le découpage en paquets, le modèle OSI, l'adressage IP, IPv6 et TCP/UDP. Ensuite les systèmes et le cloisonnement : VLAN, VPN, Linux, pare-feu DMZ et Active Directory. Puis la cryptographie, le Zero Trust et la sécurité des API. Le quatrième palier couvre le Cloud, Docker, Kubernetes et le CI/CD, avant de culminer au cinquième palier sur l'investigation Wireshark, KQL et le centre SOC SIEM.",
    captions: [
      {
        offsetSec: 0,
        text: 'Les 22 étapes suivent l’ordre logique pour former un analyste opérationnel en 5 paliers.',
      },
      {
        offsetSec: 13,
        text: 'Paliers 1 & 2 : Fondations réseau (OSI, IP/IPv6, TCP/UDP) puis systèmes cloisonnés (VLAN, VPN, Linux, AD).',
      },
      {
        offsetSec: 26,
        text: 'Paliers 3 à 5 : Crypto & API/JWT, Cloud/Docker/Kubernetes, puis Wireshark, KQL et triage SOC/SIEM.',
      },
    ],
    highlights: [
      '5 paliers progressifs avec barres d’avancement et navigation directe',
      '4 parcours métiers filtrables (Complet, Analyste SOC, Réseau, Cloud & Systèmes)',
      'La carte interactive et le bouton « Continuer » pointent toujours vers votre prochaine étape',
    ],
    actionLabel: 'Voir la feuille de route',
    targetRoute: 'archipel',
  },
  {
    id: 'lesson-flow',
    index: 3,
    title: 'Suivre un Module : Animation, Atelier & Fiche',
    shortLabel: 'Modules & Étoiles',
    startSec: 70,
    durationSec: 40,
    timecodeLabel: '01:10 – 01:50',
    narration:
      "Chaque étape fonctionne en trois temps simples. Premier onglet : l'animation interactive commentée, découpée en scènes visuelles avec voix off synchronisée dont vous pouvez ajuster la vitesse. Deuxième onglet : l'atelier pratique interactif où vous manipulez concrètement le concept — câblage, pare-feu, requêtes ou diagnostic — pour décrocher de une à trois étoiles et vos points d'expérience. Troisième onglet : les notions clés et tableaux récapitulatifs pour ancrer l'essentiel avant de passer à l'étape suivante.",
    captions: [
      {
        offsetSec: 0,
        text: 'Chaque étape combine 3 onglets : Animation commentée, Atelier pratique et Synthèse des notions.',
      },
      {
        offsetSec: 14,
        text: 'L’animation interactive visualise chaque protocole pas à pas avec vitesse de voix off réglable.',
      },
      {
        offsetSec: 27,
        text: 'L’atelier pratique valide vos réflexes et attribue de 1 à 3 étoiles selon votre précision.',
      },
    ],
    highlights: [
      'Animations vectorielles en 4 à 5 scènes avec lecture/pause et voix off',
      'Ateliers interactifs avec droit à l’erreur et retour pédagogique immédiat',
      'Navigation Étape précédente / Étape suivante calée sur le cursus analyste',
    ],
    actionLabel: 'Tester l’Étape 1',
    targetRoute: 'island',
    targetIslandId: 1,
  },
  {
    id: 'soc-telemetry',
    index: 4,
    title: 'Salle de Veille SOC & Télémétrie en Direct',
    shortLabel: 'Salle SOC Live',
    startSec: 110,
    durationSec: 45,
    timecodeLabel: '01:50 – 02:35',
    narration:
      "Directement sur l'accueil, la Salle de Veille SOC vous permet d'observer une architecture DMZ en temps réel. En mode Flux Nominal, les paquets TLS circulent calmement entre Internet, le pare-feu WAF, vos serveurs web et la base de données privée. Cliquez sur SYN Flood pour déclencher une attaque DDoS simulée : le débit grimpe à huit virgule quatre gigabits par seconde et la santé DMZ chute. Activez ensuite la Mitigation WAF pour voir les SYN cookies plafonner l'attaque et restaurer immédiatement la disponibilité du réseau.",
    captions: [
      {
        offsetSec: 0,
        text: 'Observez en direct le chemin des paquets entre Internet, Pare-feu WAF, serveurs DMZ et base privée.',
      },
      {
        offsetSec: 16,
        text: 'Déclenchez « SYN Flood (DDoS) » : la courbe sature à 8,4 Gbps et la santé DMZ passe en alerte.',
      },
      {
        offsetSec: 31,
        text: 'Activez la Mitigation WAF : le filtrage stabilise la charge et vos compteurs SOC reflètent vos vraies réussites.',
      },
    ],
    highlights: [
      '3 modes interactifs : Flux Nominal, SYN Flood (DDoS) et Mitigation WAF',
      'Courbe de trafic animée et explication claire de chaque phénomène observé',
      'Compteurs réels reliés à vos attaques stoppées, drapeaux CTF et incidents résolus',
    ],
    actionLabel: 'Explorer la salle SOC',
    targetRoute: 'archipel',
  },
  {
    id: 'labs-hub',
    index: 5,
    title: 'Les 30 Laboratoires Techniques & CyberShell',
    shortLabel: '30 Laboratoires',
    startSec: 155,
    durationSec: 45,
    timecodeLabel: '02:35 – 03:20',
    narration:
      "L'onglet Laboratoires regroupe trente ateliers pratiques pour passer de la théorie au terrain. Vous y trouverez le Simulateur de paquets de bout en bout, le terminal CyberShell pour pratiquer Linux et PowerShell, un CTF guidé avec cinq drapeaux à capturer, le mode Survie SOC, ainsi que des auditeurs spécialisés JWT, TLS et durcissement Docker. Enfin, les circuits Speedrun chronométrés récompensent votre rapidité avec des multiplicateurs d'XP temporaires visibles dans l'en-tête.",
    captions: [
      {
        offsetSec: 0,
        text: '30 laboratoires classés par catégorie : Réseau, Défense SOC, Investigation, Cloud et Speedrun.',
      },
      {
        offsetSec: 16,
        text: 'Pratiquez le terminal CyberShell, le CTF Guidé (5 drapeaux), la Survie SOC et l’auditeur JWT/TLS.',
      },
      {
        offsetSec: 31,
        text: 'Les circuits Speedrun débloquent des boosts XP chronométrés et enregistrent vos meilleurs temps.',
      },
    ],
    highlights: [
      'Simulateur de paquets DNS → Routeur → Pare-feu → Serveur Cloud',
      'CyberShell (Linux/PowerShell), CTF Guidé, 10 Cyberattaques Live & Survie SOC',
      'Circuits Speedrun avec multiplicateur XP et suivi des records',
    ],
    actionLabel: 'Ouvrir les Laboratoires',
    targetRoute: 'simulateur',
  },
  {
    id: 'debug-exam',
    index: 6,
    title: 'Debug Express, Quiz & Examen Blanc',
    shortLabel: 'Debug & Examen',
    startSec: 200,
    durationSec: 35,
    timecodeLabel: '03:20 – 03:55',
    narration:
      "Un analyste progresse surtout en diagnostiquant des pannes réelles. Dans l'onglet Debug, résolvez des tickets d'incidents concrets — DNS cassé, règle pare-feu bloquante ou routage erroné — et révisez avec les cartes mémo interactives. Côté Quiz et Fiches, testez vos connaissances par niveau, travaillez des études de cas métier et passez l'Examen Blanc chronométré noté sur vingt pour décrocher votre mention.",
    captions: [
      {
        offsetSec: 0,
        text: 'Debug Express : résolvez des tickets d’incidents réseau et système pour ancrer vos réflexes diagnostic.',
      },
      {
        offsetSec: 12,
        text: 'Révisez rapidement grâce aux cartes mémo et à l’antisèche A4 imprimable.',
      },
      {
        offsetSec: 23,
        text: 'Passez l’Examen Blanc chronométré sur 20 pour valider votre niveau et obtenir une mention.',
      },
    ],
    highlights: [
      'Tickets d’incidents réalistes avec diagnostic guidé et explication technique',
      'Quiz adaptatifs, études de cas d’entreprise et duel de rapidité',
      'Examen Blanc chronométré sur 20 points comptant pour votre diplôme',
    ],
    actionLabel: 'Tester Debug Express',
    targetRoute: 'debug',
  },
  {
    id: 'profile-cloud',
    index: 7,
    title: 'Succès, Compte Cloud & Diplôme',
    shortLabel: 'Succès & Cloud',
    startSec: 235,
    durationSec: 35,
    timecodeLabel: '03:55 – 04:30',
    narration:
      "Dans Mon Profil et Classement, chaque étape clé débloque automatiquement l'une des douze médailles Cyberland — comme Premier pas, Expert Réseau ou Cyber-Détective — accompagnée d'un bonus d'XP. Relevez aussi le Défi du Jour pour entretenir votre série et réclamez vos quêtes hebdomadaires. En connectant votre compte Google, toute votre progression se synchronise automatiquement sur tous vos appareils, et vous pouvez générer à tout moment votre diplôme personnalisé en SVG ou PDF.",
    captions: [
      {
        offsetSec: 0,
        text: '12 médailles de succès se débloquent automatiquement au fil de vos modules, labos et enquêtes.',
      },
      {
        offsetSec: 12,
        text: 'Le Défi du Jour et les quêtes hebdomadaires récompensent votre régularité sans pression.',
      },
      {
        offsetSec: 23,
        text: 'Connectez votre compte Google pour sauvegarder dans le Cloud et éditer votre diplôme SVG/PDF.',
      },
    ],
    highlights: [
      '12 médailles filtrables par catégorie avec dates de déblocage et progression',
      'Sauvegarde Cloud automatique via Google Sign-In et classement optionnel',
      'Diplôme d’Analyste personnalisable téléchargeable en SVG ou imprimable en PDF',
    ],
    actionLabel: 'Voir mon profil',
    targetRoute: 'classement',
  },
  {
    id: 'quickstart',
    index: 8,
    title: 'Plan d’action : vos 3 premiers clics',
    shortLabel: 'Démarrer',
    startSec: 270,
    durationSec: 30,
    timecodeLabel: '04:30 – 05:00',
    narration:
      "Vous avez maintenant toutes les clés en main. Pour bien démarrer dès la fin de cette vidéo : premier clic, indiquez votre prénom et votre rythme quotidien sur l'accueil. Deuxième clic, lancez l'Étape 1 pour valider votre première animation et débloquer la médaille Premier pas. Troisième clic, ouvrez un premier laboratoire ou le Défi du Jour pour ancrer vos acquis par la pratique. Bonne exploration sur Cyberland !",
    captions: [
      {
        offsetSec: 0,
        text: '1er clic : personnalisez votre prénom et votre rythme quotidien depuis l’accueil.',
      },
      {
        offsetSec: 10,
        text: '2e clic : lancez l’Étape 1 (Signaux & Paquets) pour débloquer votre première médaille.',
      },
      {
        offsetSec: 20,
        text: '3e clic : pratiquez dans la salle SOC ou les 30 laboratoires pour transformer la théorie en réflexes.',
      },
    ],
    highlights: [
      'Étape 1 : Personnaliser son prénom et son rythme quotidien',
      'Étape 2 : Valider l’Étape 1 du Palier 1 pour décrocher « Premier pas »',
      'Étape 3 : Alterner un module et un atelier pratique chaque session',
    ],
    actionLabel: 'Démarrer l’Étape 1 maintenant',
    targetRoute: 'island',
    targetIslandId: 1,
  },
];

export function formatTimecode(seconds: number): string {
  const clamped = Math.max(0, Math.min(TOTAL_DEMO_DURATION_SEC, Math.floor(seconds)));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getChapterAtTime(seconds: number): DemoChapter {
  const clamped = Math.max(0, Math.min(TOTAL_DEMO_DURATION_SEC - 0.01, seconds));
  return (
    DEMO_CHAPTERS.find(
      (ch) => clamped >= ch.startSec && clamped < ch.startSec + ch.durationSec
    ) ?? DEMO_CHAPTERS[DEMO_CHAPTERS.length - 1]
  );
}
