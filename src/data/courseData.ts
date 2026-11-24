export interface IslandModule {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  duration: string;
  xpReward: number;
  badgeTitle: string;
  badgeDescription: string;
  videoTitle: string;
  videoDuration: string;
  gameTitle: string;
  notions: string[];
  summary: string;
  keyTakeaways: { term: string; detail: string }[];
  gemiBotHints: string[];
  mapPosition: { x: number; y: number };
}

export interface StoryboardShot {
  shot: number;
  timecode: string;
  visual: string;
  voiceover: string;
  animationNote: string;
}

export interface VideoStoryboard {
  islandId: number;
  title: string;
  duration: string;
  targetConcept: string;
  h5pPauseQuestion: {
    atTimecode: string;
    question: string;
    answer: string;
  };
  shots: StoryboardShot[];
}

export type AudienceLevel = 'collegiens' | 'etudiants' | 'reconversion';

export interface QuizQuestion {
  id: string;
  islandRef: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ActivitySheet {
  audienceLabel: string;
  duration: string;
  objective: string;
  prerequisites: string;
  steps: { title: string; duration: string; instructions: string }[];
  deliverable: string;
  evaluationCriteria: string[];
}

export const ASSETS = {
  archipelagoMap: '/src/assets/images/archipelago_hero_map_1795379357900.jpg',
  gemiBot: '/src/assets/images/gemibot_mascot_1795379358024.jpg',
  signalsCover: '/src/assets/images/island_signals_cover_1795379357995.jpg',
  cloudSummitCover: '/src/assets/images/island_cloud_summit_1795379358284.jpg',
  atollNetworksCover: '/src/assets/images/island_atoll_networks_cover_1795383232438.jpg',
  osiLabyrinthCover: '/src/assets/images/island_osi_labyrinth_cover_1795383613225.jpg',
  containersDockCover: '/src/assets/images/island_containers_dock_cover_1795383613755.jpg',
  cyberBayCover: '/src/assets/images/island_cyber_bay_cover_1795383613875.jpg',
  cryptoLighthouseCover: '/src/assets/images/island_crypto_lighthouse_cover_1795469409652.jpg',
  devopsFactoryCover: '/src/assets/images/island_devops_factory_cover_1795469409425.jpg',
  wiresharkObservatoryCover: '/src/assets/images/island_wireshark_observatory_cover_1795470049914.jpg',
  azureMonitorTowerCover: '/src/assets/images/island_azure_monitor_tower_cover_1795470301124.jpg',
  adCitadelCover: '/src/assets/images/island_ad_citadel_cover_1795471963243.jpg',
  socCenterCover: '/src/assets/images/island_soc_center_cover_1795471963988.jpg',
  k8sHarborCover: '/src/assets/images/island_k8s_harbor_cover_1795471963544.jpg',
  vpnTunnelCover: '/src/assets/images/island_vpn_tunnel_cover_1795471963686.jpg',
  serverFirewallCover: '/src/assets/images/server_firewall_cover_1795477193480.jpg',
  vlanSwitchCover: '/src/assets/images/vlan_switch_cover_1795477239067.jpg',
  ipv6TransitionCover: '/src/assets/images/ipv6_transition_cover_1795497511156.jpg',
  apiOauthJwtCover: '/src/assets/images/api_oauth_jwt_cover_1795497510237.jpg',
};

export interface CareerTrack {
  id: 'all' | 'network' | 'cloud-win' | 'soc-cyber';
  label: string;
  certificateTitle: string;
  description: string;
  islandIds: number[];
}

export interface AnalystLearningPhase {
  id: string;
  phaseNumber: number;
  title: string;
  subtitle: string;
  analystGoal: string;
  islandIds: number[];
}

export const ANALYST_LEARNING_PHASES: AnalystLearningPhase[] = [
  {
    id: 'phase-1-foundations',
    phaseNumber: 1,
    title: 'Palier 1 · Fondations Réseau & Protocoles',
    subtitle: 'Comprendre comment circule un paquet avant d’analyser ou défendre un réseau',
    analystGoal: 'Lire une topologie, situer une couche OSI, résoudre IP/DNS et distinguer TCP/UDP.',
    islandIds: [1, 7, 8, 2, 21, 3],
  },
  {
    id: 'phase-2-systems-segmentation',
    phaseNumber: 2,
    title: 'Palier 2 · Systèmes, Cloisonnement & Identité',
    subtitle: 'Maîtriser l’architecture réelle d’entreprise que l’analyste doit protéger',
    analystGoal: 'Comprendre VLAN 802.1Q, VPN/NAT, durcissement Linux/DMZ et authentification Active Directory.',
    islandIds: [20, 18, 19, 15],
  },
  {
    id: 'phase-3-crypto-threats-api',
    phaseNumber: 3,
    title: 'Palier 3 · Cryptographie, Menaces & Sécurité API',
    subtitle: 'Reconnaître les vecteurs d’attaque actuels et valider les mécanismes de confiance',
    analystGoal: 'Auditer TLS/hachage, repérer le phishing/Zero Trust et détecter les failles OAuth2/JWT.',
    islandIds: [11, 10, 22],
  },
  {
    id: 'phase-4-cloud-modern-infra',
    phaseNumber: 4,
    title: 'Palier 4 · Cloud, Conteneurs & Résilience',
    subtitle: 'Sécuriser et superviser les infrastructures Cloud-native modernes',
    analystGoal: 'Évaluer les responsabilités IaaS/PaaS/SaaS, Docker, Kubernetes, CI/CD et la continuité.',
    islandIds: [4, 9, 17, 12, 5, 6],
  },
  {
    id: 'phase-5-investigation-soc',
    phaseNumber: 5,
    title: 'Palier 5 · Investigation, Journaux & Réponse SOC',
    subtitle: 'Passer en conditions opérationnelles : capturer, corréler, trier et contenir',
    analystGoal: 'Disséquer des captures .pcap, interroger les logs KQL et exécuter des playbooks SIEM/SOAR.',
    islandIds: [13, 14, 16],
  },
];

export const ANALYST_FULL_ORDER: number[] = ANALYST_LEARNING_PHASES.flatMap(
  (phase) => phase.islandIds
);

export const CAREER_TRACKS: CareerTrack[] = [
  {
    id: 'all',
    label: 'Cursus Complet Analyste (22 étapes)',
    certificateTitle: 'Analyste Réseaux, Cloud & Cybersécurité',
    description:
      'Ordre recommandé en 5 paliers : fondations réseau, systèmes & AD, menaces/crypto/API, Cloud/K8s, puis investigation Wireshark, KQL et SOC/SIEM.',
    islandIds: ANALYST_FULL_ORDER,
  },
  {
    id: 'soc-cyber',
    label: 'Analyste SOC & Cybersécurité',
    certificateTitle: 'Analyste Cybersécurité & Défense SOC',
    description:
      'Progression ciblée analyste SOC : protocoles, cloisonnement VLAN/DMZ/AD, crypto & Zero Trust, API/JWT, puis Wireshark, KQL et triage SIEM/SOAR.',
    islandIds: [1, 8, 2, 3, 20, 18, 19, 15, 11, 10, 22, 13, 14, 16],
  },
  {
    id: 'network',
    label: 'Analyste & Ingénieur Réseau',
    certificateTitle: 'Spécialiste Analyse & Infrastructures Réseau',
    description:
      'Signaux, topologies, modèle OSI, IP/DNS, IPv6, TCP/UDP, VLAN/WPA3, VPN/NAT, pare-feu DMZ et capture Wireshark/tcpdump.',
    islandIds: [1, 7, 8, 2, 21, 3, 20, 18, 19, 13],
  },
  {
    id: 'cloud-win',
    label: 'Analyste Cloud & Systèmes',
    certificateTitle: 'Analyste Systèmes, Cloud & DevSecOps',
    description:
      'Durcissement Linux/DMZ, Active Directory, sécurité API/JWT, Cloud IaaS/PaaS/SaaS, Docker, Kubernetes, CI/CD, résilience et supervision Azure Monitor.',
    islandIds: [19, 15, 22, 4, 9, 17, 12, 5, 6, 14],
  },
];

export function getOrderedIslandsForTrack(trackId: CareerTrack['id']): IslandModule[] {
  const track = CAREER_TRACKS.find((t) => t.id === trackId) ?? CAREER_TRACKS[0];
  const byId = new Map(ISLANDS.map((island) => [island.id, island]));
  return track.islandIds
    .map((id) => byId.get(id))
    .filter((island): island is IslandModule => Boolean(island));
}

export function getAnalystPhaseForIsland(islandId: number): AnalystLearningPhase | undefined {
  return ANALYST_LEARNING_PHASES.find((phase) => phase.islandIds.includes(islandId));
}

export function getAnalystStepNumber(
  islandId: number,
  trackId: CareerTrack['id'] = 'all'
): number {
  const track = CAREER_TRACKS.find((t) => t.id === trackId) ?? CAREER_TRACKS[0];
  const idx = track.islandIds.indexOf(islandId);
  if (idx !== -1) return idx + 1;
  const fullIdx = ANALYST_FULL_ORDER.indexOf(islandId);
  return fullIdx !== -1 ? fullIdx + 1 : islandId;
}

export const ISLANDS: IslandModule[] = [
  {
    id: 1,
    slug: 'ile-des-signaux',
    title: "01. L'Île des Signaux",
    subtitle: 'Fondamentaux des réseaux & découpage en paquets',
    category: 'Fondamentaux',
    duration: '10 min',
    xpReward: 150,
    badgeTitle: 'Bâtisseur de Signaux',
    badgeDescription: 'A reconnecté les 4 cabanes et le phare du village dans le budget imparti.',
    videoTitle: 'Le voyage de la lettre découpée',
    videoDuration: '1 min 30',
    gameTitle: 'Connecte le village',
    notions: ['Réseau informatique', 'LAN vs WAN', 'Câble, Fibre & Wi-Fi', 'Paquets de données'],
    summary:
      "La tempête a brisé les liens locaux du village. Comprenez comment les messages voyagent sous forme de petits paquets et choisissez le bon support physique pour contourner les obstacles.",
    keyTakeaways: [
      {
        term: 'LAN (Local Area Network)',
        detail: 'Un réseau local couvrant une maison, une école ou le village de l’île.',
      },
      {
        term: 'WAN (Wide Area Network)',
        detail: 'Un réseau étendu reliant plusieurs îles ou continents entre eux (Internet).',
      },
      {
        term: 'Paquets de données',
        detail: 'Tout fichier est découpé en morceaux numérotés (1/4, 2/4...) envoyés indépendamment puis réassemblés.',
      },
      {
        term: 'Supports de transmission',
        detail: 'Cuivre (Ethernet) économique, Fibre optique ultra-rapide sur longue distance, Wi-Fi sans fil sensible aux murs et rochers.',
      },
    ],
    gemiBotHints: [
      "Astuce terrain : les ondes Wi-Fi détestent les gros rochers volcaniques ! Contournons-les au câble Ethernet.",
      "N'oublie pas : pour qu'une cabane soit en ligne, elle doit pouvoir remonter jusqu'au Phare central, directement ou via une autre cabane reliée.",
      "Un message découpé en 4 paquets voyage plus vite et résiste mieux aux bouchons qu'une seule lettre géante !",
    ],
    mapPosition: { x: 22, y: 52 },
  },
  {
    id: 2,
    slug: 'port-des-adresses',
    title: '02. Le Port des Adresses',
    subtitle: 'Adresses IP, MAC, annuaire DNS & Routage',
    category: 'Adressage',
    duration: '12 min',
    xpReward: 200,
    badgeTitle: 'Maître du Routage',
    badgeDescription: 'A aiguillé tous les navires vers leur sous-réseau sans saturer le port.',
    videoTitle: "Le facteur et l'annuaire magique",
    videoDuration: '2 min 00',
    gameTitle: 'Aiguilleur du port',
    notions: ['Adresse IP', 'Adresse MAC', 'Serveur DNS', 'Routeur & Sous-réseaux'],
    summary:
      "Les cargos de données tournent en rond dans la baie ! Apprenez comment la tour DNS traduit un nom lisible en adresse IP et comment les routeurs orientent chaque paquet vers son sous-réseau.",
    keyTakeaways: [
      {
        term: 'Adresse IP',
        detail: 'Coordonnée logique d’une machine sur un réseau (ex. 192.168.1.42), comparable à une adresse postale.',
      },
      {
        term: 'Adresse MAC',
        detail: 'Identifiant matériel unique gravé sur la carte réseau de chaque appareil, valable au niveau local.',
      },
      {
        term: 'DNS (Domain Name System)',
        detail: 'L’annuaire qui traduit un nom humain (ile-des-palmiers.gem) en adresse IP compréhensible par les machines.',
      },
      {
        term: 'Routeur',
        detail: 'Le phare aiguilleur qui lit l’adresse IP de destination et choisit le meilleur chemin vers le bon sous-réseau.',
      },
    ],
    gemiBotHints: [
      "Regarde les deux premiers nombres de l'IP : 10.0.x.x file au Quai Nord, 192.168.x.x au Quai Est, et 172.16.x.x au Quai Sud !",
      "Un bateau affiche un nom de domaine (.gem) au lieu d'une IP ? Clique vite sur la Tour DNS pour révéler ses coordonnées !",
      "Sans DNS, il faudrait mémoriser des suites de chiffres pour chaque île de l'archipel. Merci l'annuaire magique !",
    ],
    mapPosition: { x: 59, y: 58 },
  },
  {
    id: 3,
    slug: 'forteresse-protocoles',
    title: '03. La Forteresse des Protocoles',
    subtitle: 'TCP vs UDP, chiffrement HTTPS & Pare-feu',
    category: 'Sécurité',
    duration: '12 min',
    xpReward: 250,
    badgeTitle: 'Gardien de la Forteresse',
    badgeDescription: 'A filtré les ports suspects et protégé la forteresse contre les intrusions.',
    videoTitle: 'TCP le méticuleux vs UDP le pressé',
    videoDuration: '1 min 45',
    gameTitle: 'Le Gardien du Pont-Levis',
    notions: ['Protocole TCP', 'Protocole UDP', 'Chiffrement HTTPS', 'Pare-feu & Ports'],
    summary:
      "Des pirates rôdent autour des remparts ! Maîtrisez la différence entre fiabilité (TCP) et vitesse temps réel (UDP), chiffrez les échanges avec HTTPS et configurez votre pare-feu.",
    keyTakeaways: [
      {
        term: 'TCP (Transmission Control Protocol)',
        detail: 'Protocole fiable : numérote chaque paquet, attend un accusé de réception (ACK) et renvoie tout colis perdu.',
      },
      {
        term: 'UDP (User Datagram Protocol)',
        detail: 'Protocole rapide sans accusé de réception : idéal pour la vidéo en direct, la voix ou les jeux multijoueurs.',
      },
      {
        term: 'HTTPS (Port 443)',
        detail: 'Version chiffrée de HTTP via TLS : même si un pirate intercepte le paquet, le contenu reste illisible.',
      },
      {
        term: 'Pare-feu (Firewall)',
        detail: 'Filtre le trafic entrant et sortant selon des règles de ports (autoriser 443, bloquer 23 Telnet non chiffré ou signatures d’attaque).',
      },
    ],
    gemiBotHints: [
      "Port 443 (HTTPS) avec certificat valide = feu vert ! Port 23 (Telnet en clair) ou paquet malveillant = pont-levis fermé !",
      "Astuce de pro : active le blocage automatique du port 23 dans les règles du pare-feu pour gagner du temps sur les inspections manuelles.",
      "Un appel vidéo saccadé en TCP serait un cauchemar : voilà pourquoi UDP préfère avancer plutôt que d'attendre une image perdue.",
    ],
    mapPosition: { x: 49, y: 44 },
  },
  {
    id: 4,
    slug: 'ascension-nuages',
    title: "04. L'Ascension vers les Nuages",
    subtitle: 'Cloud Computing, IaaS / PaaS / SaaS & Auto-Scaling',
    category: 'Cloud',
    duration: '12 min',
    xpReward: 250,
    badgeTitle: 'Architecte du Nuage',
    badgeDescription: 'A absorbé le pic touristique grâce à l’Auto-Scaling sans ruiner l’archipel.',
    videoTitle: 'La métaphore de la Pizzeria',
    videoDuration: '2 min 00',
    gameTitle: 'Cloud Tycoon',
    notions: ['On-Premise vs Cloud', 'Virtualisation', 'IaaS, PaaS, SaaS', 'Élasticité & Auto-Scaling'],
    summary:
      "Les visiteurs affluent par vagues sur Cyberland et l'unique serveur local surchauffe. Découvrez les modèles du Cloud et pilotez l'élasticité automatique pour ajuster la capacité à la demande.",
    keyTakeaways: [
      {
        term: 'On-Premise (Sur site)',
        detail: 'Vous achetez, hébergez et entretenez vos propres machines physiques : capacité rigide et coût fixe élevé.',
      },
      {
        term: 'IaaS (Infrastructure)',
        detail: 'Location de serveurs virtuels, stockage et réseau (ex. machines virtuelles) : vous gérez le système et vos applications.',
      },
      {
        term: 'PaaS (Plateforme)',
        detail: 'Environnement prêt à déployer votre code sans gérer le matériel ni le système d’exploitation.',
      },
      {
        term: 'SaaS & Élasticité',
        detail: 'Logiciel clé en main dans le navigateur. L’Auto-Scaling ajoute des serveurs lors des pics et les coupe la nuit.',
      },
    ],
    gemiBotHints: [
      "En mode serveur local, impossible d'ajouter de la capacité : observe comme la charge dépasse 100 % au pic de midi !",
      "Active l'Auto-Scaling dans le Nuage Céleste : il ajoute des serveurs quand le trafic grimpe et les coupe la nuit pour sauver tes pièces d'or.",
      "Pense à la Pizzeria : SaaS, c'est s'asseoir à table et manger directement sans faire la vaisselle !",
    ],
    mapPosition: { x: 69, y: 31 },
  },
  {
    id: 5,
    slug: 'sommet-celeste',
    title: '05. Le Sommet Céleste',
    subtitle: 'Boss Final : Load Balancing, Zones & Sauvegardes',
    category: 'Résilience',
    duration: '15 min',
    xpReward: 350,
    badgeTitle: "Sauveur de l'Archipel",
    badgeDescription: 'A basculé le trafic en urgence vers la Zone B et restauré les données saines.',
    videoTitle: 'Résilience face à la tempête',
    videoDuration: '1 min 45',
    gameTitle: 'Sauve Cyberland de la tempête !',
    notions: ['Load Balancer', 'Zones de disponibilité', 'Bascule (Failover)', 'Sauvegarde & Snapshot'],
    summary:
      "Alerte rouge ! La tempête frappe l'Île Est (Zone A). Utilisez un répartiteur de charge, redéployez la capacité sur la Zone B et restaurez les données depuis le dernier cliché sain avant l'expiration du chrono.",
    keyTakeaways: [
      {
        term: 'Load Balancer (Répartiteur de charge)',
        detail: 'Distribue les requêtes entre plusieurs serveurs ou zones et retire automatiquement une zone en panne.',
      },
      {
        term: 'Zones de disponibilité (AZ)',
        detail: 'Centres de données isolés physiquement (électricité, réseau) au sein d’une même région Cloud.',
      },
      {
        term: 'Haute disponibilité (Failover)',
        detail: 'Capacité d’un service à rester en ligne sans interruption visible lors de la perte d’un site.',
      },
      {
        term: 'Sauvegarde (Snapshot) & RPO/RTO',
        detail: 'Copie horodatée stockée hors de la zone sinistrée pour restaurer rapidement des données intactes.',
      },
    ],
    gemiBotHints: [
      "Ordre d'intervention recommandé : 1) Isole la Zone A sinistrée, 2) Active le Load Balancer vers la Zone B, 3) Monte la capacité de la Zone B, 4) Restaure le Snapshot sain !",
      "Attention à choisir un Snapshot récent marqué SAIN — un cliché pris pendant la tempête peut être corrompu !",
      "Ne panique pas : un bon architecte suit sa check-list étape par étape sous la pression.",
    ],
    mapPosition: { x: 38, y: 74 },
  },
  {
    id: 6,
    slug: 'ile-eco-cloud',
    title: "06. L'Île Éco-Cloud",
    subtitle: 'Bonus FinOps & Sobriété numérique dans le Cloud',
    category: 'Éco-Cloud',
    duration: '10 min',
    xpReward: 250,
    badgeTitle: 'Éco-Architecte Cloud',
    badgeDescription: 'A réduit de plus de 65 % les émissions carbone et les coûts sans perte de disponibilité.',
    videoTitle: 'Un nuage sobre et efficace',
    videoDuration: '1 min 30',
    gameTitle: 'Défi Éco-Cloud',
    notions: ['FinOps', 'Green IT', 'Extinction nocturne', 'Régions bas carbone'],
    summary:
      "L'archipel est reconnecté, mais les serveurs consomment trop d'énergie la nuit et accumulent des sauvegardes inutiles. Optimisez l'empreinte carbone et la facture Cloud tout en maintenant 99 % de disponibilité.",
    keyTakeaways: [
      {
        term: 'FinOps (Optimisation financière Cloud)',
        detail: 'Discipline consistant à ajuster la taille et le nombre de ressources Cloud aux besoins réels.',
      },
      {
        term: 'Right-Sizing (Juste dimensionnement)',
        detail: 'Éviter les machines virtuelles surdimensionnées tournant à 15 % de charge.',
      },
      {
        term: 'Région bas carbone',
        detail: 'Déployer les services dans un centre de données alimenté par une électricité décarbonée (hydraulique, nucléaire, solaire).',
      },
      {
        term: 'Cycle de vie du stockage',
        detail: 'Archiver ou supprimer automatiquement les snapshots orphelins et journaux obsolètes.',
      },
    ],
    gemiBotHints: [
      "Astuce Éco-Cloud : éteindre les environnements de test la nuit coupe presque de moitié la facture et le CO₂ !",
      "Un serveur géant utilisé à 15 % gaspille de l'électricité : choisis le dimensionnement adapté (Right-Sizing).",
      "Choisir une région alimentée en énergie renouvelable ou décarbonée divise l'empreinte carbone sans ralentir les visiteurs !",
    ],
    mapPosition: { x: 31, y: 34 },
  },
  {
    id: 7,
    slug: 'atoll-des-reseaux',
    title: "07. L'Atoll des Réseaux",
    subtitle: 'Types de réseaux (PAN, LAN, WLAN, MAN, WAN, VPN) & Topologies',
    category: 'Types de réseaux',
    duration: '12 min',
    xpReward: 200,
    badgeTitle: 'Cartographe des Réseaux',
    badgeDescription: 'A sélectionné la bonne échelle réseau et la topologie résiliente pour chaque mission.',
    videoTitle: 'Des écouteurs Bluetooth aux câbles sous-marins',
    videoDuration: '1 min 45',
    gameTitle: 'Architecte des Échelles',
    notions: ['PAN & Bluetooth', 'LAN vs WLAN', 'MAN & WAN', 'VPN & Topologies'],
    summary:
      "Du bracelet connecté de l'explorateur aux câbles sous-marins reliant les continents, explorez les grandes familles de réseaux selon leur portée géographique, leur sécurité (VPN) et leur topologie physique.",
    keyTakeaways: [
      {
        term: 'PAN (Personal Area Network · 1 à 10 m)',
        detail: 'Réseau personnel reliant les équipements autour d’une seule personne : écouteurs, montre connectée, smartphone ou capteur (Bluetooth, NFC, USB).',
      },
      {
        term: 'LAN (Local Area Network · 10 à 100 m)',
        detail: 'Réseau local filaire (Ethernet + Switch) couvrant une maison, une école ou un bureau avec un débit élevé et une très grande stabilité.',
      },
      {
        term: 'WLAN (Wireless LAN · 10 à 80 m)',
        detail: 'Déclinaison sans fil (Wi-Fi) du réseau local, idéale pour connecter librement smartphones et ordinateurs portables en mobilité.',
      },
      {
        term: 'MAN (Metropolitan Area Network · 1 à 50 km)',
        detail: 'Réseau métropolitain interconnectant plusieurs bâtiments ou campus d’une même ville, généralement par boucle fibre optique à très haut débit.',
      },
      {
        term: 'WAN (Wide Area Network · > 100 km à mondial)',
        detail: 'Réseau étendu reliant des régions, pays ou continents via câbles sous-marins, liaisons opérateurs et satellites. Internet est le plus vaste WAN.',
      },
      {
        term: 'VPN & Topologies (Bus, Étoile, Maillée)',
        detail: 'Le VPN crée un tunnel chiffré privé au-dessus d’Internet. Côté câblage, la topologie Maillée (Mesh) offre des chemins de secours si un lien casse.',
      },
    ],
    gemiBotHints: [
      "Retenez cette échelle : Poche (PAN) → Pièce/Bâtiment (LAN & WLAN) → Ville (MAN) → Planète (WAN) !",
      "Besoin de mobilité sans fil dans un bâtiment ? Choisis WLAN (Wi-Fi). Besoin de débit fixe ultra-stable ? Choisis LAN (Ethernet).",
      "Si un ingénieur travaille depuis un Wi-Fi public et veut rejoindre un réseau privé interne, pense aussitôt au tunnel chiffré VPN !",
    ],
    mapPosition: { x: 79, y: 66 },
  },
  {
    id: 8,
    slug: 'labyrinthe-osi',
    title: '08. Le Labyrinthe des 7 Couches',
    subtitle: 'Modèle OSI, modèle TCP/IP & Encapsulation des trames',
    category: 'Modèle OSI',
    duration: '12 min',
    xpReward: 220,
    badgeTitle: 'Maître des 7 Couches',
    badgeDescription: 'A associé chaque équipement à sa couche OSI et ordonné l’encapsulation complète.',
    videoTitle: 'Les 7 étages de la tour postale OSI',
    videoDuration: '1 min 45',
    gameTitle: 'Assembleur de Trames',
    notions: ['7 couches OSI', 'Encapsulation', 'Switch (L2) vs Routeur (L3)', 'Modèle TCP/IP'],
    summary:
      "Comment un simple clic dans votre navigateur devient-il des impulsions lumineuses dans un câble fibre ? Descendez les 7 étages du modèle OSI pour voir chaque couche ajouter son en-tête.",
    keyTakeaways: [
      {
        term: 'Couches hautes (7 Application, 6 Présentation, 5 Session)',
        detail: 'Gèrent le dialogue applicatif (HTTPS, DNS), le chiffrement/compression (TLS) et le maintien de la session utilisateur.',
      },
      {
        term: 'Couche 4 — Transport (Segments TCP / UDP)',
        detail: 'Découpe le message, ajoute les numéros de ports (ex. 443) et gère la fiabilité ou la vitesse temps réel.',
      },
      {
        term: 'Couche 3 — Réseau (Paquets IP)',
        detail: 'Ajoute les adresses IP source et destination pour permettre aux routeurs de traverser plusieurs réseaux.',
      },
      {
        term: 'Couches 2 & 1 — Liaison (Trames MAC) & Physique (Bits)',
        detail: 'Le Switch livre localement grâce à l’adresse MAC (L2), puis le câble cuivre, la fibre ou le Wi-Fi transmet les 0 et 1 (L1).',
      },
    ],
    gemiBotHints: [
      "Astuce mnémotechnique de bas en haut (1 → 7) : Physique, Liaison, Réseau, Transport, Session, Présentation, Application !",
      "Souviens-toi de la règle d'or : le Switch travaille en Couche 2 (adresses MAC), le Routeur travaille en Couche 3 (adresses IP).",
      "Lors de l'encapsulation, on descend de l'Application (Données) vers le Transport (Segment), le Réseau (Paquet), la Liaison (Trame) puis les Bits !",
    ],
    mapPosition: { x: 18, y: 72 },
  },
  {
    id: 9,
    slug: 'chantier-conteneurs',
    title: '09. Le Chantier des Conteneurs',
    subtitle: 'Docker, Conteneurisation vs VM & Microservices',
    category: 'Conteneurs',
    duration: '12 min',
    xpReward: 240,
    badgeTitle: 'Capitaine Docker',
    badgeDescription: 'A migré un monolithe fragile vers 4 microservices isolés et résilients.',
    videoTitle: 'Du cargo géant aux conteneurs Docker',
    videoDuration: '1 min 45',
    gameTitle: 'Dock Master',
    notions: ['Machine Virtuelle vs Conteneur', 'Docker', 'Microservices', 'Isolation des pannes'],
    summary:
      "Sur les quais de Cyberland, un vieux serveur monolithique bloque tout le port dès qu'un module tombe en panne. Découvrez comment Docker emballe chaque microservice dans un conteneur léger.",
    keyTakeaways: [
      {
        term: 'Monolithe vs Microservices',
        detail: 'Dans un monolithe, un bug sur la météo fait tomber toute la billetterie. En microservices, chaque fonction est indépendante.',
      },
      {
        term: 'Machine Virtuelle (VM) vs Conteneur',
        detail: 'Une VM embarque tout un système d’exploitation complet (lourd, lent à démarrer). Un conteneur partage le noyau de l’hôte : léger et démarre en ~1 seconde.',
      },
      {
        term: 'Image Docker & Portabilité',
        detail: 'Un conteneur emporte son code et ses dépendances : « ce qui marche sur le poste du développeur marche à l’identique dans le Cloud ».',
      },
      {
        term: 'Scaling ciblé & Orchestration',
        detail: 'Au lieu de dupliquer tout un énorme serveur, on multiplie uniquement le conteneur sollicité (ex. 3 réplicas de l’API Billetterie).',
      },
    ],
    gemiBotHints: [
      "Un conteneur Docker démarre en 1 seconde et consomme 10 fois moins de RAM qu'une machine virtuelle complète !",
      "Si le conteneur Météo plante, redémarre-le en un clic : la Billetterie et le Paiement continuent de servir les touristes sans coupure.",
      "Pendant un pic d'affluence sur la billetterie, ajoute des réplicas uniquement sur le microservice Billetterie !",
    ],
    mapPosition: { x: 82, y: 42 },
  },
  {
    id: 10,
    slug: 'baie-zero-trust',
    title: '10. La Baie du Phishing & Zero Trust',
    subtitle: 'Ingénierie sociale, MFA, Wi-Fi piège & Confiance Zéro',
    category: 'Cybersécurité',
    duration: '12 min',
    xpReward: 260,
    badgeTitle: 'Sentinelle Zero Trust',
    badgeDescription: 'A déjoué les attaques de phishing, Evil Twin et fatigue MFA dans la baie.',
    videoTitle: 'Ne jamais faire confiance, toujours vérifier',
    videoDuration: '1 min 45',
    gameTitle: "Détecteur d'Imposteurs",
    notions: ['Phishing (Hameçonnage)', 'MFA (Double facteur)', 'Wi-Fi Evil Twin', 'Zero Trust'],
    summary:
      "Même la meilleure forteresse technique peut tomber si un imposteur trompe un humain ! Apprenez à inspecter les domaines suspects, déjouer les faux Wi-Fi gratuits et appliquer le modèle Zero Trust.",
    keyTakeaways: [
      {
        term: 'Phishing & Typo-squatting',
        detail: 'Les pirates imitent un site officiel en changeant une lettre ou l’extension (ex. cyber-land-login.xyz au lieu de cyberland.gem) et créent un faux sentiment d’urgence.',
      },
      {
        term: 'MFA (Authentification Multifacteur)',
        detail: 'Associe ce que vous savez (mot de passe) à ce que vous possédez (clé physique ou code temporaire) : un mot de passe volé ne suffit plus.',
      },
      {
        term: 'Wi-Fi piège (Evil Twin)',
        detail: 'Un faux point d’accès ouvert (« Free_Wifi_Port ») permet au pirate d’intercepter le trafic non chiffré. Utilisez 4G/5G ou un VPN.',
      },
      {
        term: 'Principe Zero Trust (Confiance Zéro)',
        detail: '« Ne jamais faire confiance par défaut, toujours vérifier » : chaque requête est authentifiée et limitée au moindre privilège, même depuis le réseau interne.',
      },
    ],
    gemiBotHints: [
      "Vérifie toujours l'adresse exacte de l'expéditeur et le vrai nom de domaine avant l'extension (.gem vs .xyz) !",
      "Une demande d'approbation MFA reçue à 2h du matin que tu n'as pas déclenchée ? C'est une attaque par fatigue MFA : refuse et change ton mot de passe !",
      "Un vrai cadenas HTTPS prouve que la connexion est chiffrée, PAS que le propriétaire du site est honnête : inspecte le domaine.",
    ],
    mapPosition: { x: 54, y: 22 },
  },
  {
    id: 11,
    slug: 'phare-cryptographie',
    title: '11. Le Phare de la Cryptographie',
    subtitle: 'Chiffrement symétrique AES, asymétrique, Hachage & Certificats TLS',
    category: 'Cryptographie',
    duration: '12 min',
    xpReward: 260,
    badgeTitle: 'Maître des Clés',
    badgeDescription: 'A choisi la bonne primitive cryptographique (AES, asymétrique, hachage, signature) pour chaque mission.',
    videoTitle: 'Le coffre, la boîte aux lettres et l’empreinte magique',
    videoDuration: '1 min 45',
    gameTitle: 'Maître des Clés',
    notions: ['Symétrique (AES)', 'Asymétrique (Clé Publique/Privée)', 'Hachage + Sel (SHA-256)', 'Signature & TLS'],
    summary:
      "Au sommet du phare de Cyberland, les messages traversent l'océan à la vue de tous. Découvrez quand utiliser une clé secrète rapide (AES), une paire publique/privée, une empreinte irréversible (hachage) ou une signature numérique.",
    keyTakeaways: [
      {
        term: 'Chiffrement symétrique (AES)',
        detail: 'Une même clé secrète chiffre et déchiffre. Ultra-rapide : idéal pour chiffrer des disques, sauvegardes ou flux de données volumineux.',
      },
      {
        term: 'Chiffrement asymétrique (Clé Publique / Privée)',
        detail: 'La clé publique verrouille (tout le monde peut la connaître), seule la clé privée secrète ouvre. Permet d’échanger une clé de session sur Internet sans se rencontrer.',
      },
      {
        term: 'Hachage + Sel (SHA-256 / Argon2)',
        detail: 'Transforme un texte en empreinte fixe irréversible (effet avalanche). Utilisé pour stocker les mots de passe sans jamais conserver le texte en clair.',
      },
      {
        term: 'Signature numérique & Certificat TLS',
        detail: 'Le serveur signe avec sa clé privée ; votre navigateur vérifie avec la clé publique certifiée pour prouver identité et intégrité.',
      },
    ],
    gemiBotHints: [
      "Astuce du phare : stocker des mots de passe = Hachage + Sel (jamais réversible) ; chiffrer un gros disque = Symétrique AES !",
      "En HTTPS (TLS), on combine les deux : l'asymétrique négocie en sécurité une clé de session, puis AES chiffre rapidement toute la navigation.",
      "Observe l'effet avalanche sur le banc SHA-256 : changer une seule lettre bouleverse totalement l'empreinte hexadécimale !",
    ],
    mapPosition: { x: 16, y: 24 },
  },
  {
    id: 12,
    slug: 'usine-devops-cicd',
    title: "12. L'Usine DevOps & CI/CD",
    subtitle: 'Pipeline Git, Tests auto, Build Docker, Blue/Green, Canary & Rollback',
    category: 'DevOps & CI/CD',
    duration: '12 min',
    xpReward: 280,
    badgeTitle: 'Chef de Pipeline',
    badgeDescription: 'A automatisé les tests, déployé sans coupure (Blue/Green & Canary) et annulé une panne en 1 clic.',
    videoTitle: 'De la ligne de code à la mise en ligne sans coupure',
    videoDuration: '1 min 45',
    gameTitle: 'Chef de Pipeline CI/CD',
    notions: ['Intégration Continue (CI)', 'Déploiement Continu (CD)', 'Blue/Green & Canary', 'Rollback 1 clic'],
    summary:
      "Comment livrer de nouvelles fonctionnalités dix fois par jour sur Cyberland sans jamais couper la billetterie ? Pilotez la chaîne CI/CD automatisée, testez en Canary et déclenchez un Rollback instantané au moindre bug.",
    keyTakeaways: [
      {
        term: 'Intégration Continue (CI)',
        detail: 'À chaque commit Git, le pipeline lance automatiquement les tests unitaires, l’analyse de sécurité et la construction de l’image Docker.',
      },
      {
        term: 'Déploiement Blue/Green',
        detail: 'La version actuelle (Blue) reste active pendant que la nouvelle (Green) démarre à côté : le routeur bascule en 1 seconde avec zéro interruption.',
      },
      {
        term: 'Déploiement Canary (Canari)',
        detail: 'On expose d’abord la nouveauté à 10 % des utilisateurs pour surveiller les erreurs réelles avant de généraliser à 100 %.',
      },
      {
        term: 'Rollback (Retour arrière)',
        detail: 'Si le taux d’erreurs HTTP 500 grimpe sur la nouvelle version, un clic renvoie immédiatement 100 % du trafic sur l’ancienne version saine (Blue).',
      },
    ],
    gemiBotHints: [
      "Règle d'or DevOps : un commit dont les tests unitaires échouent ne doit JAMAIS partir en production — bloque-le dès la CI !",
      "Pour une mise à jour risquée, commence par un Canary à 10 % avant d'ouvrir les vannes à tous les visiteurs.",
      "Si le taux d'erreurs grimpe sur le Canary, déclenche aussitôt un Rollback vers Blue pour protéger les utilisateurs !",
    ],
    mapPosition: { x: 84, y: 20 },
  },
  {
    id: 13,
    slug: 'observatoire-wireshark-tcpdump',
    title: "13. L'Observatoire des Paquets (Wireshark & tcpdump)",
    subtitle: 'Capture réseau en animation, filtres BPF, dissection 3 volets & .pcap',
    category: 'Analyse réseau',
    duration: '15 min',
    xpReward: 280,
    badgeTitle: 'Analyste de Trames',
    badgeDescription: 'A capturé le trafic avec tcpdump et disséqué les trames DNS, TCP, HTTP et TLS dans Wireshark.',
    videoTitle: 'Wireshark & tcpdump : sous le microscope du réseau',
    videoDuration: '2 min 15',
    gameTitle: 'Enquêteur de Trames',
    notions: ['Mode Promiscuité & libpcap', 'tcpdump & Filtres BPF', 'Wireshark (3 volets)', 'Follow TCP Stream (.pcap)'],
    summary:
      "Entrez dans l'observatoire optique de Cyberland ! Suivez en animation comment la carte réseau copie les trames via libpcap, comment tcpdump capture en ligne de commande sur serveur Linux et comment Wireshark dissèque chaque couche OSI jusqu'aux octets bruts.",
    keyTakeaways: [
      {
        term: 'Mode Promiscuité & libpcap / Npcap',
        detail: 'Permet à la carte réseau de copier toutes les trames qui passent sur le lien vers un tampon mémoire sans perturber le trafic.',
      },
      {
        term: 'tcpdump (Capture CLI & Filtre BPF)',
        detail: 'Outil léger en ligne de commande idéal sur serveur Linux sans écran : sudo tcpdump -i eth0 -nn port 443 -w audit.pcap.',
      },
      {
        term: 'Wireshark (Dissection en 3 volets)',
        detail: 'Interface graphique qui ouvre les fichiers .pcap et affiche en synchronisation : Liste des paquets, Arbre des couches OSI et Octets Hex/ASCII.',
      },
      {
        term: 'Filtre de capture (BPF) vs Filtre d’affichage',
        detail: 'Le filtre BPF (tcpdump) rejette les paquets dès la capture pour économiser le disque ; le filtre d’affichage Wireshark (ex. http, tcp.port == 23) masque sans rien supprimer.',
      },
    ],
    gemiBotHints: [
      "Workflow des pros : capture légère sur le serveur avec tcpdump (-w capture.pcap), puis analyse visuelle approfondie sur ton poste dans Wireshark !",
      "Avec « Follow TCP Stream », un flux HTTP (port 80) ou Telnet (port 23) révèle tout en clair, alors qu'HTTPS (TLS 1.3 port 443) reste totalement illisible !",
      "Dans tcpdump, ajoute toujours -nn pour éviter des résolutions DNS lentes qui polluent la capture.",
    ],
    mapPosition: { x: 58, y: 78 },
  },
  {
    id: 14,
    slug: 'tour-controle-azure-monitor',
    title: '14. La Tour de Contrôle Azure Monitor',
    subtitle: 'Windows & Microsoft Azure Monitor : AMA, Metrics, Log Analytics (KQL), App Insights & Alertes',
    category: 'Supervision Cloud',
    duration: '15 min',
    xpReward: 300,
    badgeTitle: 'Sentinelle Azure Monitor',
    badgeDescription: 'A supervisé des serveurs Windows & Cloud avec AMA, KQL, Application Insights et Action Groups.',
    videoTitle: 'Windows & Azure Monitor : de la collecte à l’auto-réparation',
    videoDuration: '2 min 15',
    gameTitle: 'Pilote Observabilité Azure',
    notions: ['Agent AMA & DCR Windows', 'Metrics vs Log Analytics', 'Requêtes KQL (Kusto)', 'App Insights & Action Groups'],
    summary:
      "Comment surveiller en temps réel des centaines de serveurs Windows, bases de données et applications web dans le Cloud ? Découvrez en animation toute la chaîne Windows Azure Monitor : collecte AMA, métriques, journaux KQL, Application Insights et alertes auto-réparatrices.",
    keyTakeaways: [
      {
        term: 'Azure Monitor Agent (AMA) & DCR',
        detail: 'Agent moderne installé sur les VM Windows Server / Linux (et hybrides via Azure Arc) qui envoie Event Logs (ex. Security 4625) et compteurs Perf selon des Data Collection Rules.',
      },
      {
        term: 'Metrics vs Log Analytics Workspace',
        detail: 'Metrics stocke des séries numériques ultra-rapides (CPU %, latence) pour les alertes immédiates ; Log Analytics stocke les événements détaillés interrogeables en KQL.',
      },
      {
        term: 'Langage KQL (Kusto Query Language)',
        detail: 'Langage de requête par pipes « | » pour filtrer et agréger des millions de logs : Event | where EventID == 4625 | summarize count() by Computer.',
      },
      {
        term: 'Application Insights & Action Groups',
        detail: 'Application Insights trace la latence code ↔ SQL (APM) ; les Action Groups déclenchent alertes Teams/SMS, Autoscale ou Runbooks d’auto-réparation.',
      },
    ],
    gemiBotHints: [
      "Retiens la règle d'or Azure Monitor : courbes numériques temps réel = Metrics ; enquêtes détaillées sur les EventID Windows = Log Analytics + KQL !",
      "L'EventID Windows 4625 signale un échec de connexion : une rafale de 4625 indique souvent une attaque brute-force RDP.",
      "Associe toujours une règle d'alerte critique à un Action Group capable à la fois de prévenir l'astreinte ET de lancer une remédiation automatique.",
    ],
    mapPosition: { x: 35, y: 18 },
  },
  {
    id: 15,
    slug: 'citadelle-active-directory',
    title: '15. La Citadelle Active Directory & Kerberos',
    subtitle: 'Annuaire Windows Enterprise : Forêt, OU, GPO, billets Kerberos (TGT/TGS) & Défense',
    category: 'Identité Windows',
    duration: '15 min',
    xpReward: 300,
    badgeTitle: 'Gardien d’Active Directory',
    badgeDescription: 'A sécurisé les tickets Kerberos, ciblé les GPO par OU et contré Kerberoasting & Pass-the-Hash.',
    videoTitle: 'Kerberos, OU/GPO & Défense Active Directory en animation',
    videoDuration: '2 min 10',
    gameTitle: 'Gardien d’Active Directory',
    notions: ['Tickets Kerberos (TGT/TGS)', 'Forêt, Domaine, OU & GPO', 'Kerberos AES vs NTLM', 'Kerberoasting & Tiering'],
    summary:
      "Comment un annuaire Windows Active Directory authentifie-t-il des milliers de postes sans envoyer les mots de passe sur le réseau ? Suivez en animation le voyage des billets Kerberos (TGT → TGS), l'application des GPO et la défense contre les attaques AD.",
    keyTakeaways: [
      {
        term: 'Protocole Kerberos (KDC, TGT & TGS)',
        detail: 'Le Contrôleur de Domaine (KDC) délivre un TGT après connexion, puis un TGS spécifique à chaque service demandé sans jamais exposer le mot de passe aux serveurs cibles.',
      },
      {
        term: 'Hiérarchie Forêt / Domaine / OU & GPO',
        detail: 'Les Unités d’Organisation (OU) classent utilisateurs et machines pour appliquer des stratégies de sécurité (GPO) ciblées et déléguer proprement les droits.',
      },
      {
        term: 'Kerberoasting (EventID 4769)',
        detail: 'Un attaquant demande des tickets TGS chiffrés en RC4 de comptes de service (SPN) pour tenter de casser leur mot de passe hors ligne. Parade : gMSA + AES.',
      },
      {
        term: 'Modèle en Tiers (Tiering) & Credential Guard',
        detail: 'Empêche les comptes Domain Admin (Tier 0) de se connecter sur les postes utilisateurs (Tier 2), bloquant le vol d’empreintes (Pass-the-Hash).',
      },
    ],
    gemiBotHints: [
      "Retiens la logique Kerberos : TGT = bracelet d'entrée du parc, TGS = billet pour une attraction précise (un serveur de fichiers ou SQL).",
      "Ne lie jamais une GPO expérimentale à tout le domaine : cible l'Unité d'Organisation (OU) du service concerné !",
      "Pour stopper le Pass-the-Hash, un Domain Admin (Tier 0) ne doit jamais ouvrir de session sur un PC bureautique ordinaire.",
    ],
    mapPosition: { x: 14, y: 38 },
  },
  {
    id: 16,
    slug: 'centre-soc-siem',
    title: '16. Le Centre SOC & SIEM',
    subtitle: 'Corrélation multi-sources, Triage N1, Matrice MITRE ATT&CK & Playbooks SOAR',
    category: 'Défense SOC',
    duration: '15 min',
    xpReward: 320,
    badgeTitle: 'Analyste SOC Cyberland',
    badgeDescription: 'A corrélé des alertes SIEM, écarté les faux positifs et orchestré un confinement SOAR.',
    videoTitle: 'Au cœur du SOC : du journal brut au Playbook SOAR',
    videoDuration: '2 min 15',
    gameTitle: 'Analyste SOC Niveau 1',
    notions: ['Corrélation SIEM', 'Faux Positifs vs Intrusion', 'Matrice MITRE ATT&CK', 'Orchestration SOAR'],
    summary:
      "Suite directe de Wireshark et Azure Monitor : découvrez comment un Security Operations Center (SOC) corrèle des millions de journaux Windows, pare-feu et DNS dans un SIEM, qualifie chaque alerte avec MITRE ATT&CK et riposte en quelques secondes via SOAR.",
    keyTakeaways: [
      {
        term: 'SIEM (Corrélation centralisée)',
        detail: 'Agrège et croise les journaux hétérogènes (Windows Events, pare-feu, DNS, EDR) pour détecter une chaîne d’attaque invisible sur une source isolée.',
      },
      {
        term: 'Triage SOC N1 & Faux Positifs',
        detail: 'Vérifier le contexte (sauvegarde planifiée, utilisateur, actif) permet d’écarter les faux positifs, affiner les règles et combattre la fatigue d’alerte.',
      },
      {
        term: 'Matrice MITRE ATT&CK',
        detail: 'Référentiel mondial classant les tactiques adverses (Accès initial, Élévation, Mouvement latéral, Exfiltration) pour parler un langage commun.',
      },
      {
        term: 'Playbook SOAR (Réponse automatisée)',
        detail: 'Exécute automatiquement en quelques secondes l’isolation EDR d’un poste, la révocation des sessions et le blocage d’une IP malveillante au pare-feu.',
      },
    ],
    gemiBotHints: [
      "Un SIEM brille par la corrélation : 1 seul log est banal, mais 40 échecs RDP + un scan SMB + un tunnel DNS en 5 minutes = alerte critique !",
      "Avant d'isoler un serveur de production, vérifie toujours s'il ne s'agit pas d'une sauvegarde nocturne planifiée (Faux Positif).",
      "MTTD = temps moyen pour détecter · MTTR = temps moyen pour contenir et réparer grâce au SOAR.",
    ],
    mapPosition: { x: 68, y: 12 },
  },
  {
    id: 17,
    slug: 'archipel-kubernetes',
    title: '17. L’Archipel Kubernetes & Conteneurs',
    subtitle: 'Orchestration K8s : Pods, Deployments, ClusterIP, Ingress TLS & NetworkPolicy',
    category: 'Orchestration',
    duration: '15 min',
    xpReward: 320,
    badgeTitle: 'Capitaine Kubernetes',
    badgeDescription: 'A orchestré un cluster de Pods résilients, corrigé un CrashLoopBackOff et activé NetworkPolicy.',
    videoTitle: 'Kubernetes en animation : Pods, Services, Ingress & Auto-guérison',
    videoDuration: '2 min 15',
    gameTitle: 'Capitaine Cluster K8s',
    notions: ['Pods & ReplicaSets', 'Auto-guérison & CrashLoopBackOff', 'Service ClusterIP & Ingress', 'NetworkPolicy Zero Trust'],
    summary:
      "Un conteneur Docker isolé est rapide, mais comment orchestrer des dizaines de microservices sur plusieurs serveurs ? Plongez en animation dans Kubernetes : auto-guérison des Pods, réseau virtuel ClusterIP, routage Ingress HTTPS et pare-feu NetworkPolicy.",
    keyTakeaways: [
      {
        term: 'Pod & Deployment (Auto-guérison)',
        detail: 'Un Deployment maintient en permanence le nombre de Pods désiré (replicas) et recrée automatiquement tout conteneur défaillant sur un nœud sain.',
      },
      {
        term: 'Diagnostic CrashLoopBackOff',
        detail: 'Indique qu’un conteneur démarre puis plante en boucle : les commandes « kubectl logs --previous » et « kubectl describe pod » révèlent la cause exacte.',
      },
      {
        term: 'Service ClusterIP & Ingress TLS',
        detail: 'ClusterIP donne une adresse DNS interne stable devant des Pods éphémères ; Ingress route le trafic HTTPS externe par nom de domaine vers le bon Service.',
      },
      {
        term: 'NetworkPolicy (Pare-feu interne)',
        detail: 'Applique le Zero Trust à l’intérieur du cluster en n’autorisant que les flux strictement nécessaires (ex. seul le Backend accède au port 5432 de la base).',
      },
    ],
    gemiBotHints: [
      "Souviens-toi : un Pod est éphémère (son IP change quand il est recréé), mais un Service ClusterIP garde toujours la même IP et le même nom DNS interne !",
      "En cas de CrashLoopBackOff, commence toujours par lire les logs de l'instance précédente (kubectl logs --previous).",
      "Sans NetworkPolicy, tous les Pods du cluster peuvent se parler librement : cloisonne toujours la base de données !",
    ],
    mapPosition: { x: 86, y: 54 },
  },
  {
    id: 18,
    slug: 'tunnel-vpn-wireguard-nat',
    title: '18. Le Tunnel VPN, WireGuard & NAT',
    subtitle: 'Encapsulation chiffrée, WireGuard vs IPSec, Split-Tunneling, NAT/PAT & Pare-feu Stateful',
    category: 'Réseaux avancés',
    duration: '15 min',
    xpReward: 320,
    badgeTitle: 'Gardien du Tunnel VPN',
    badgeDescription: 'A configuré un tunnel WireGuard, optimisé le Split-Tunneling et décodé une table NAT/PAT.',
    videoTitle: 'Encapsulation VPN, WireGuard, IPSec & Table NAT en animation',
    videoDuration: '2 min 10',
    gameTitle: 'Gardien du Tunnel VPN & NAT',
    notions: ['Encapsulation VPN chiffrée', 'WireGuard vs IPSec', 'Split-Tunnel vs Full-Tunnel', 'NAT/PAT & Pare-feu Stateful'],
    summary:
      "Comment un paquet privé traverse-t-il un Wi-Fi public sans être lu, et comment 50 postes partagent-ils une seule adresse IP publique ? Explorez en animation l'encapsulation WireGuard/IPSec, le Split-Tunneling, la table PAT/NAT et le filtrage Stateful.",
    keyTakeaways: [
      {
        term: 'Encapsulation dans un tunnel VPN',
        detail: 'Le paquet IP privé d’origine est chiffré puis enfermé dans un nouvel en-tête externe (UDP 51820 pour WireGuard ou ESP pour IPSec) jusqu’à la passerelle.',
      },
      {
        term: 'Split-Tunneling vs Full-Tunneling',
        detail: 'Full-Tunnel fait passer 100 % du trafic par le siège (filtrage maximal mais risque de saturation) ; Split-Tunnel ne passe que les flux privés dans le VPN.',
      },
      {
        term: 'Table dynamique NAT / PAT',
        detail: 'Le routeur remplace les IP privées (192.168.x.x) par son unique IP publique et associe un port source éphémère unique à chaque session.',
      },
      {
        term: 'Pare-feu Stateful vs Stateless',
        detail: 'Un pare-feu Stateful mémorise les connexions sortantes légitimes dans une table d’états et laisse revenir leurs réponses sans ouvrir les ports entrants au public.',
      },
    ],
    gemiBotHints: [
      "WireGuard brille par sa légèreté (~4 000 lignes dans le noyau Linux), sa crypto moderne (ChaCha20) et son roaming instantané entre Wi-Fi et 5G.",
      "Avec le PAT (NAT à surcharge de ports), chaque connexion reçoit un numéro de port source distinct pour que le routeur sache à quel PC rendre la réponse.",
      "Un pare-feu Stateful bloque toute connexion entrante imprévue tout en autorisant automatiquement le retour d'une requête initiée depuis le LAN.",
    ],
    mapPosition: { x: 76, y: 82 },
  },
  {
    id: 19,
    slug: 'creer-serveur-configurer-pare-feu',
    title: '19. Créer un Serveur, le Configurer & Placer un Pare-feu',
    subtitle: 'Provisioning Linux/VPS, durcissement SSH, Reverse Proxy Nginx HTTPS, architecture DMZ & règles UFW',
    category: 'Systèmes & Sécurité',
    duration: '16 min',
    xpReward: 340,
    badgeTitle: 'Bâtisseur de Serveurs & Pare-feu',
    badgeDescription: 'A créé un serveur sécurisé, positionné une DMZ entre deux pare-feux et configuré les règles UFW.',
    videoTitle: 'Création serveur, configuration Nginx/SSH & placement Pare-feu DMZ en animation',
    videoDuration: '2 min 20',
    gameTitle: 'Déploie & Blinde ton Serveur',
    notions: ['Provisioning Serveur (VPS / VM)', 'Durcissement SSH & sudo', 'Reverse Proxy Nginx & HTTPS', 'Placement Pare-feu, DMZ & UFW'],
    summary:
      'De la création d’une machine serveur vierge jusqu’à sa mise en production sécurisée : apprenez en animation comment choisir l’OS, sécuriser SSH, configurer Nginx en HTTPS, placer stratégiquement le pare-feu en architecture DMZ et appliquer la règle « Tout bloquer par défaut » avec UFW.',
    keyTakeaways: [
      {
        term: 'Création & OS Serveur (LTS)',
        detail: 'On déploie sur un serveur physique ou une VM/VPS Cloud avec un OS stable à support long (Ubuntu Server LTS / Debian) et une adresse IP statique.',
      },
      {
        term: 'Durcissement SSH dès la 1re minute',
        detail: 'Créer un utilisateur non-root avec sudo, authentifier par clé SSH Ed25519 et désactiver PermitRootLogin et les mots de passe dans /etc/ssh/sshd_config.',
      },
      {
        term: 'Où placer le Pare-feu ? (DMZ)',
        detail: 'En défense en profondeur : Internet → Pare-feu Périmétrique (FW1) → Zone DMZ (Serveur Web Nginx) → Pare-feu Interne (FW2) → Réseau Privé (Base de données).',
      },
      {
        term: 'Politique UFW « Deny by Default »',
        detail: 'Toujours commencer par ufw default deny incoming, puis n’ouvrir que 443/tcp (HTTPS), 80/tcp (redirection) et 22/tcp restreint à votre IP admin ou VPN.',
      },
    ],
    gemiBotHints: [
      'Règle d’or du pare-feu : bloquez TOUT le trafic entrant par défaut (ufw default deny incoming) puis n’ouvrez que les ports strictement nécessaires.',
      'Ne placez jamais une base de données (ports 3306 / 5432) dans la DMZ ni exposée sur Internet : elle doit rester derrière le pare-feu interne.',
      'Activez toujours la règle SSH avant de lancer « ufw enable », sinon vous risquez de vous enfermer hors de votre propre serveur !',
    ],
    mapPosition: { x: 89, y: 76 },
  },
  {
    id: 20,
    slug: 'switching-vlans-wifi-wpa3',
    title: '20. Switching, VLANs (802.1Q) & Wi-Fi Entreprise (WPA3)',
    subtitle: 'Segmentation L2 par VLAN, ports Access vs Trunk 802.1Q, routage inter-VLAN, Wi-Fi WPA3-Enterprise (802.1X/RADIUS) & isolation invités',
    category: 'Réseaux avancés',
    duration: '15 min',
    xpReward: 340,
    badgeTitle: 'Architecte VLAN & Wi-Fi',
    badgeDescription: 'A segmenté le campus en 4 VLANs 802.1Q, sécurisé le Wi-Fi en WPA3-Enterprise RADIUS et déployé les ACL inter-VLAN.',
    videoTitle: 'Commutation L2, étiquetage VLAN 802.1Q, Trunk & Wi-Fi WPA3-Enterprise en animation',
    videoDuration: '2 min 10',
    gameTitle: 'Segmente le Campus Cyberland',
    notions: ['Switch L2 & table CAM/MAC', 'VLANs & étiquette IEEE 802.1Q', 'Port Access vs Trunk & Inter-VLAN', 'Wi-Fi WPA3-Enterprise (802.1X/RADIUS)'],
    summary:
      'Un seul réseau plat expose toute l’entreprise au premier poste infecté. Apprenez à découper un switch en VLANs isolés grâce à la norme 802.1Q, à relier vos commutateurs par des liens Trunk et à déployer un Wi-Fi d’entreprise WPA3-Enterprise avec portail invités isolé.',
    keyTakeaways: [
      {
        term: 'VLAN (Virtual LAN)',
        detail: 'Découpe logiquement un même switch physique en plusieurs réseaux indépendants (Direction, Employés, Invités, Serveurs) pour contenir les diffusions et les attaques.',
      },
      {
        term: 'Access vs Trunk (IEEE 802.1Q)',
        detail: 'Un port Access relie un poste final à un unique VLAN. Un port Trunk transporte plusieurs VLANs sur un seul câble en ajoutant une étiquette 802.1Q (4 octets) contenant le VLAN ID.',
      },
      {
        term: 'Routage Inter-VLAN & ACL',
        detail: 'Deux VLANs ne communiquent pas entre eux sans routeur L3 (Router-on-a-Stick ou Switch L3) contrôlé par des listes ACL strictes.',
      },
      {
        term: 'Wi-Fi WPA3-Enterprise (802.1X/RADIUS)',
        detail: 'Chaque employé s’authentifie avec ses propres identifiants ou certificat via un serveur RADIUS (révocation instantanée), tandis que les visiteurs restent isolés sur un VLAN Invités.',
      },
    ],
    gemiBotHints: [
      'Un câble entre un PC et un switch est toujours un port Access ; un câble entre un switch et un routeur (ou deux switchs) transportant plusieurs VLANs est un port Trunk 802.1Q.',
      'Ne partagez jamais un mot de passe Wi-Fi unique (PSK) en entreprise : si un employé part, tout le monde devrait changer la clé. Utilisez WPA3-Enterprise + RADIUS.',
      'Les visiteurs sur le Wi-Fi Invités (VLAN 30) doivent sortir vers Internet mais être strictement bloqués vers le VLAN Serveurs (VLAN 99).',
    ],
    mapPosition: { x: 64, y: 86 },
  },
  {
    id: 21,
    slug: 'ipv6-transition-dual-stack',
    title: '21. IPv6 & Transition IPv4 / IPv6',
    subtitle: 'Adressage 128 bits hexadécimal, compression :: (RFC 5952), SLAAC / NDP, préfixes fe80:: et migration Dual-Stack',
    category: 'Réseaux avancés',
    duration: '14 min',
    xpReward: 340,
    badgeTitle: 'Pionnier IPv6',
    badgeDescription: 'A compressé des adresses 128 bits, classé les préfixes IPv6 et orchestré une transition Dual-Stack sans coupure.',
    videoTitle: 'Épuisement IPv4, anatomie 128 bits IPv6, SLAAC & Dual-Stack en animation',
    videoDuration: '2 min 00',
    gameTitle: "Migre l'Archipel vers IPv6",
    notions: ['Pénurie IPv4 vs 128 bits IPv6', 'Compression :: (RFC 5952)', 'SLAAC, NDP & Link-Local fe80::', 'Transition Dual-Stack & DNS AAAA'],
    summary:
      'Avec 4,3 milliards d’adresses seulement, IPv4 est saturé. Découvrez comment IPv6 débloque 340 sextillions d’adresses sur 128 bits, simplifie l’auto-configuration avec SLAAC et s’intègre en douceur grâce au Dual-Stack et aux enregistrements DNS AAAA.',
    keyTakeaways: [
      {
        term: 'Adressage 128 bits (8 blocs Hex)',
        detail: 'Une adresse IPv6 comporte 8 groupes de 4 caractères hexadécimaux séparés par « : », soit 2¹²⁸ adresses possibles — adieu la pénurie !',
      },
      {
        term: 'Règles de compression (RFC 5952)',
        detail: 'Supprimer les zéros en tête de chaque bloc (0db8 → db8) et remplacer la plus longue suite de blocs 0000 par « :: » une seule fois par adresse.',
      },
      {
        term: 'Préfixes essentiels & SLAAC',
        detail: '::1 (Loopback), fe80::/10 (Link-Local auto-configuré), fc00::/7 (ULA privé) et 2000::/3 (Unicast Global). SLAAC permet aux hôtes de s’auto-adresser via les annonces routeur (NDP).',
      },
      {
        term: 'Dual-Stack & DNS AAAA',
        detail: 'La stratégie de transition standard consiste à faire tourner IPv4 et IPv6 en parallèle (Dual-Stack) avec des enregistrements DNS A (IPv4) et AAAA (IPv6).',
      },
    ],
    gemiBotHints: [
      'Attention : le raccourci « :: » ne peut apparaître qu’une seule fois dans une adresse IPv6, sinon on ne saurait plus combien de groupes de zéros il remplace.',
      'Ne supprimez jamais les zéros à droite d’un bloc : fe80 reste fe80, jamais fe8 !',
      'En DNS, un enregistrement A renvoie une IPv4 (32 bits) et un enregistrement AAAA (quad-A) renvoie une IPv6 (128 bits).',
    ],
    mapPosition: { x: 52, y: 88 },
  },
  {
    id: 22,
    slug: 'securite-api-oauth2-jwt',
    title: '22. Sécurité API, OAuth 2.0 & JWT',
    subtitle: 'Flux Authorization Code + PKCE, anatomie & signature JWT (RS256/JWKS), défense OWASP API Top 10 (IDOR/BOLA, Rate Limit)',
    category: 'Systèmes & Sécurité',
    duration: '15 min',
    xpReward: 350,
    badgeTitle: 'Gardien des API & Jetons',
    badgeDescription: 'A sécurisé un flux OAuth 2.0 + PKCE, bloqué un JWT falsifié alg:none et protégé une passerelle API contre IDOR.',
    videoTitle: 'OAuth 2.0 PKCE, signature JWT RS256 et défenses OWASP API en animation',
    videoDuration: '2 min 05',
    gameTitle: 'Blinde la Passerelle API Cyberland',
    notions: ['OAuth 2.0 & OpenID Connect (PKCE)', 'Anatomie JWT (Header · Payload · Signature)', 'Attaque alg:none & vérification JWKS', 'Défense OWASP API (IDOR / BOLA & Rate Limit)'],
    summary:
      'Les applications modernes reposent sur des API REST/GraphQL protégées par des jetons. Apprenez à déployer OAuth 2.0 avec PKCE, à comprendre pourquoi un JWT n’est pas chiffré mais signé, et à bloquer les failles critiques comme IDOR/BOLA.',
    keyTakeaways: [
      {
        term: 'OAuth 2.0 + PKCE (OIDC)',
        detail: 'OAuth 2.0 gère l’autorisation (scopes) et OpenID Connect l’identité. Le flux Authorization Code + PKCE protège les applications Web/Mobile sans exposer de secret client.',
      },
      {
        term: 'JWT : Signé, PAS chiffré',
        detail: 'Un JSON Web Token comprend 3 parties Base64URL (Header.Payload.Signature). Tout le monde peut lire le Payload : n’y mettez jamais de mot de passe et vérifiez toujours la signature RS256/ES256.',
      },
      {
        term: 'Access Token court + Refresh Token rotatif',
        detail: 'Limitez l’Access Token à 10–15 min et stockez le Refresh Token dans un cookie HttpOnly/Secure avec rotation à chaque usage pour limiter l’impact d’un vol.',
      },
      {
        term: 'Protection IDOR / BOLA & Rate Limiting',
        detail: 'Faille n°1 OWASP API : vérifiez côté serveur que la ressource /orders/{id} appartient bien à jwt.sub, et appliquez un Rate Limiting (HTTP 429) sur chaque endpoint.',
      },
    ],
    gemiBotHints: [
      'Un JWT standard est encodé en Base64URL : n’importe qui peut le décoder en 1 seconde. Sa sécurité repose uniquement sur la vérification serveur de sa signature cryptographique.',
      'Rejetez toujours l’algorithme « none » et imposez une liste blanche stricte (ex. RS256 ou EdDSA) dans votre middleware JWT.',
      'Authentifié ≠ Autorisé : vérifier que le JWT est valide ne suffit pas, il faut aussi vérifier que l’utilisateur est bien propriétaire de la ressource demandée (anti-IDOR).',
    ],
    mapPosition: { x: 40, y: 84 },
  },
];

export interface GlossaryTerm {
  id: string;
  term: string;
  islandId: number;
  category: string;
  definition: string;
  example: string;
}

export interface DebugTicket {
  id: string;
  title: string;
  islandRef: string;
  symptom: string;
  tools: {
    id: string;
    label: string;
    output: string;
  }[];
  options: string[];
  correctIndex: number;
  explanation: string;
  xpReward: number;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'lan',
    term: 'LAN (Local Area Network)',
    islandId: 1,
    category: 'Fondamentaux',
    definition: "Réseau local reliant les appareils d'un même bâtiment, campus ou village.",
    example: 'Les 4 cabanes reliées au Phare central sur Cyberland.',
  },
  {
    id: 'wan',
    term: 'WAN (Wide Area Network)',
    islandId: 1,
    category: 'Fondamentaux',
    definition: 'Réseau étendu interconnectant plusieurs réseaux locaux à grande distance.',
    example: 'Internet ou les câbles sous-marins entre toutes les îles.',
  },
  {
    id: 'paquet',
    term: 'Paquet de données',
    islandId: 1,
    category: 'Fondamentaux',
    definition: 'Morceau numéroté d’un fichier ou message envoyé indépendamment sur le réseau.',
    example: 'Une lettre découpée en 4 morceaux (1/4 à 4/4) réassemblés à l’arrivée.',
  },
  {
    id: 'ip',
    term: 'Adresse IP',
    islandId: 2,
    category: 'Adressage',
    definition: 'Adresse numérique logique identifiant une machine afin de router les paquets entre réseaux.',
    example: '192.168.1.42 pour l’Île des Palmiers.',
  },
  {
    id: 'mac',
    term: 'Adresse MAC',
    islandId: 2,
    category: 'Adressage',
    definition: 'Identifiant matériel unique gravé sur chaque carte réseau pour la livraison locale.',
    example: 'A4:5E:60:C1:09:B2 sur la coque d’un navire dans le port.',
  },
  {
    id: 'dns',
    term: 'DNS (Domain Name System)',
    islandId: 2,
    category: 'Adressage',
    definition: 'Annuaire distribué traduisant un nom de domaine humain en adresse IP numérique.',
    example: 'ile-des-palmiers.gem → 192.168.1.42.',
  },
  {
    id: 'tcp',
    term: 'TCP',
    islandId: 3,
    category: 'Protocoles',
    definition: 'Protocole de transport fiable avec accusés de réception (ACK) et renvoi automatique des pertes.',
    example: 'Chargement de pages web, transfert bancaire, téléchargement de fichiers.',
  },
  {
    id: 'udp',
    term: 'UDP',
    islandId: 3,
    category: 'Protocoles',
    definition: 'Protocole de transport ultra-rapide sans accusé de réception, privilégiant la faible latence.',
    example: 'Match en direct, appel vidéo, jeu multijoueur en temps réel.',
  },
  {
    id: 'https',
    term: 'HTTPS / TLS (Port 443)',
    islandId: 3,
    category: 'Sécurité',
    definition: 'Chiffrement des communications web empêchant la lecture ou l’altération des données en transit.',
    example: 'Cadenas doré transformant un mot de passe en code illisible pour un pirate.',
  },
  {
    id: 'firewall',
    term: 'Pare-feu (Firewall)',
    islandId: 3,
    category: 'Sécurité',
    definition: 'Barrière filtrant le trafic réseau selon des règles de ports, adresses IP et protocoles.',
    example: 'Autoriser le port 443 (HTTPS) et bloquer le port 23 (Telnet en clair).',
  },
  {
    id: 'iaas-paas-saas',
    term: 'IaaS / PaaS / SaaS',
    islandId: 4,
    category: 'Cloud',
    definition: 'Niveaux de responsabilité partagée dans le Cloud, de l’infrastructure louée au logiciel prêt à l’emploi.',
    example: 'Cuisine louée (IaaS), pâte et four livrés (PaaS), repas servi au restaurant (SaaS).',
  },
  {
    id: 'autoscaling',
    term: 'Auto-Scaling (Élasticité)',
    islandId: 4,
    category: 'Cloud',
    definition: 'Ajustement automatique du nombre de serveurs selon la charge en temps réel.',
    example: 'Passer de 1 serveur la nuit à 4 serveurs au pic touristique de midi.',
  },
  {
    id: 'loadbalancer',
    term: 'Load Balancer & Multi-AZ',
    islandId: 5,
    category: 'Résilience',
    definition: 'Répartiteur distribuant les requêtes entre plusieurs zones de disponibilité indépendantes.',
    example: 'Basculer 100 % du trafic vers la Zone B lorsque la tempête coupe la Zone A.',
  },
  {
    id: 'finops',
    term: 'FinOps & Sobriété Cloud',
    islandId: 6,
    category: 'Éco-Cloud',
    definition: 'Pilotage conjoint des coûts et de l’empreinte carbone via l’extinction nocturne et le juste dimensionnement.',
    example: 'Déployer dans une région bas carbone et purger les sauvegardes orphelines.',
  },
  {
    id: 'pan',
    term: 'PAN (Personal Area Network)',
    islandId: 7,
    category: 'Types de réseaux',
    definition: 'Réseau personnel très courte portée (1 à 10 m) reliant les appareils autour d’un individu.',
    example: 'Écouteurs Bluetooth et capteur météo reliés à votre tablette.',
  },
  {
    id: 'wlan',
    term: 'WLAN (Wireless LAN)',
    islandId: 7,
    category: 'Types de réseaux',
    definition: 'Réseau local sans fil basé sur le Wi-Fi permettant la mobilité des appareils dans un bâtiment.',
    example: 'Les tablettes des touristes connectées aux bornes Wi-Fi du Café du Port.',
  },
  {
    id: 'man',
    term: 'MAN (Metropolitan Area Network)',
    islandId: 7,
    category: 'Types de réseaux',
    definition: 'Réseau métropolitain reliant plusieurs sites d’une même agglomération ou campus (1 à 50 km).',
    example: 'La boucle fibre 10 Gbit/s reliant mairie, port, hôpital et université sur Cyberland.',
  },
  {
    id: 'vpn-topo',
    term: 'VPN & Topologie Maillée (Mesh)',
    islandId: 7,
    category: 'Types de réseaux',
    definition: 'Le VPN chiffre un tunnel privé sur Internet ; la topologie Maillée multiplie les liens pour résister aux coupures.',
    example: 'Télétravail sécurisé vers la Forteresse et phares reliés par plusieurs câbles de secours.',
  },
  {
    id: 'modele-osi',
    term: 'Modèle OSI (7 couches)',
    islandId: 8,
    category: 'Modèle OSI',
    definition: 'Modèle de référence découpant la communication réseau en 7 couches indépendantes, de la Physique (1) à l’Application (7).',
    example: 'Couche 2 = Switch & MAC · Couche 3 = Routeur & IP · Couche 4 = TCP/UDP.',
  },
  {
    id: 'encapsulation',
    term: 'Encapsulation',
    islandId: 8,
    category: 'Modèle OSI',
    definition: 'Empilement successif d’en-têtes à chaque descente de couche : Données → Segment → Paquet → Trame → Bits.',
    example: 'Comme glisser une lettre dans une enveloppe, puis dans un colis postal, puis dans un conteneur.',
  },
  {
    id: 'conteneur-docker',
    term: 'Conteneur (Docker)',
    islandId: 9,
    category: 'Conteneurs',
    definition: 'Unité logicielle légère isolant une application et ses dépendances tout en partageant le noyau du système hôte.',
    example: 'Démarrage en ~1 seconde et ~64 Mo de RAM contre plusieurs dizaines de secondes pour une VM.',
  },
  {
    id: 'microservices',
    term: 'Architecture Microservices',
    islandId: 9,
    category: 'Conteneurs',
    definition: 'Découpage d’une application en petits services autonomes qui peuvent être mis à jour, redémarrés ou scalés séparément.',
    example: 'Séparer Billetterie, Météo, Paiement et Cache pour qu’un bug météo n’arrête jamais les ventes.',
  },
  {
    id: 'phishing-mfa',
    term: 'Phishing & MFA',
    islandId: 10,
    category: 'Cybersécurité',
    definition: 'Le phishing trompe un utilisateur pour voler ses accès ; le MFA ajoute un second facteur (clé, code) pour bloquer l’usurpation.',
    example: 'Refuser un e-mail urgent provenant de support@cyber-land.xyz et exiger une clé FIDO2.',
  },
  {
    id: 'zero-trust',
    term: 'Zero Trust (Confiance Zéro)',
    islandId: 10,
    category: 'Cybersécurité',
    definition: 'Modèle de sécurité qui vérifie systématiquement identité, appareil et autorisation minimale à chaque accès, même en interne.',
    example: 'Un prestataire n’accède qu’au microservice assigné, jamais à toute la base de données.',
  },
  {
    id: 'crypto-asym',
    term: 'Chiffrement Symétrique vs Asymétrique',
    islandId: 11,
    category: 'Cryptographie',
    definition: 'Le symétrique (AES) utilise 1 clé secrète rapide pour les gros volumes ; l’asymétrique utilise 2 clés (publique/privée) pour échanger des secrets et signer.',
    example: 'HTTPS négocie la clé en asymétrique puis chiffre toute la page en AES.',
  },
  {
    id: 'hachage-sel',
    term: 'Hachage + Sel (SHA-256 / Argon2)',
    islandId: 11,
    category: 'Cryptographie',
    definition: 'Empreinte mathématique à sens unique (irréversible) combinée à une valeur aléatoire (sel) pour protéger les mots de passe stockés en base.',
    example: 'Même si la base fuite, impossible de retrouver le mot de passe en clair.',
  },
  {
    id: 'ci-cd',
    term: 'CI/CD (Intégration & Déploiement Continus)',
    islandId: 12,
    category: 'DevOps & CI/CD',
    definition: 'Chaîne automatisée exécutant tests, scans de sécurité, build Docker et mise en production à chaque modification Git.',
    example: 'Un test cassé bloque automatiquement le déploiement avant d’atteindre Cyberland.',
  },
  {
    id: 'blue-green-canary',
    term: 'Blue/Green, Canary & Rollback',
    islandId: 12,
    category: 'DevOps & CI/CD',
    definition: 'Stratégies de mise en ligne sans coupure : bascule instantanée entre deux versions (Blue/Green), test sur 10 % (Canary) et retour arrière immédiat (Rollback).',
    example: 'Une erreur 500 sur le Canary 10 % déclenche un Rollback 1 clic vers Blue.',
  },
  {
    id: 'wireshark-dissection',
    term: 'Wireshark & Dissection 3 volets',
    islandId: 13,
    category: 'Analyse réseau',
    definition: 'Analyseur graphique de paquets réseau ouvrant les fichiers .pcap avec 3 vues synchronisées : liste de paquets, arbre des couches OSI et octets Hex/ASCII.',
    example: 'Appliquer « http » ou « tcp.port == 23 » pour inspecter une fuite en clair ou un scan.',
  },
  {
    id: 'tcpdump-bpf',
    term: 'tcpdump & Filtre BPF',
    islandId: 13,
    category: 'Analyse réseau',
    definition: 'Sniffer en ligne de commande (Linux/macOS) filtrant le trafic dès le noyau via BPF (Berkeley Packet Filter) avec une empreinte CPU minimale.',
    example: 'sudo tcpdump -i eth0 -nn port 443 -w audit.pcap.',
  },
  {
    id: 'pcap-promiscuous',
    term: 'Mode Promiscuité & Fichier .pcap',
    islandId: 13,
    category: 'Analyse réseau',
    definition: 'Le mode promiscuité autorise la carte réseau (via libpcap/Npcap) à copier toutes les trames vues sur le câble dans un fichier standard .pcap/.pcapng.',
    example: 'Capturer incident.pcap sur un serveur Linux distant puis l’analyser dans Wireshark.',
  },
  {
    id: 'azure-monitor-ama',
    term: 'Azure Monitor Agent (AMA) & DCR',
    islandId: 14,
    category: 'Supervision Cloud',
    definition: 'Agent unifié Microsoft collectant journaux Windows Event Logs, Syslog et compteurs de performance selon des Data Collection Rules centralisées.',
    example: 'Collecter les EventID 4625 et le compteur % Processor Time de 12 serveurs Windows.',
  },
  {
    id: 'log-analytics-kql',
    term: 'Log Analytics & KQL (Kusto)',
    islandId: 14,
    category: 'Supervision Cloud',
    definition: 'Entrepôt centralisé de journaux Azure Monitor interrogé par requêtes KQL enchaînées par des pipes « | » (where, summarize, project).',
    example: 'Event | where EventID == 4625 | summarize count() by Computer.',
  },
  {
    id: 'app-insights-action-group',
    term: 'Application Insights & Action Groups',
    islandId: 14,
    category: 'Supervision Cloud',
    definition: 'Application Insights trace la performance applicative (APM) de bout en bout ; les Action Groups exécutent notifications et auto-remédiations lors d’une alerte.',
    example: 'Détecter un goulot SQL de 2,4 s et déclencher Autoscale + alerte Teams.',
  },
  {
    id: 'kerberos-tgt-tgs',
    term: 'Kerberos (KDC, TGT & TGS)',
    islandId: 15,
    category: 'Identité Windows',
    definition: 'Protocole d’authentification par billets d’Active Directory évitant de transmettre le mot de passe aux serveurs cibles.',
    example: 'Obtenir un TGT auprès du KDC puis un billet TGS pour ouvrir SRV-FILES.',
  },
  {
    id: 'ou-gpo-tiering',
    term: 'OU, GPO & Modèle en Tiers (AD)',
    islandId: 15,
    category: 'Identité Windows',
    definition: 'Les Unités d’Organisation structurent l’annuaire pour cibler des stratégies GPO ; le Tiering isole les comptes Domain Admin (Tier 0) contre le Pass-the-Hash.',
    example: 'Appliquer une GPO de verrouillage uniquement sur l’OU Comptabilite.',
  },
  {
    id: 'siem-correlation',
    term: 'SIEM & Corrélation SOC',
    islandId: 16,
    category: 'Défense SOC',
    definition: 'Plateforme centralisant et corrélant en temps réel les journaux Windows, pare-feu, DNS et EDR pour détecter des chaînes d’attaque.',
    example: 'Croiser 40 EventID 4625 + un scan SMB + un domaine C2 suspect.',
  },
  {
    id: 'mitre-soar',
    term: 'MITRE ATT&CK & Playbook SOAR',
    islandId: 16,
    category: 'Défense SOC',
    definition: 'MITRE ATT&CK classe les tactiques d’attaque ; le SOAR automatise la réponse (isolation EDR, blocage IP, révocation session).',
    example: 'Stopper un mouvement latéral T1021 en isolant PC-COMPTA-04 en 5 secondes.',
  },
  {
    id: 'k8s-pods-services',
    term: 'Kubernetes : Pod, Deployment & ClusterIP',
    islandId: 17,
    category: 'Orchestration',
    definition: 'Un Deployment maintient N réplicas de Pods auto-réparés ; un Service ClusterIP fournit une IP/DNS interne stable devant des Pods éphémères.',
    example: '3 Pods api-billetterie accessibles en interne via le Service api-svc.',
  },
  {
    id: 'k8s-ingress-netpol',
    term: 'Ingress TLS & NetworkPolicy (K8s)',
    islandId: 17,
    category: 'Orchestration',
    definition: 'Ingress gère le routage HTTPS externe par nom de domaine ; NetworkPolicy cloisonne les communications internes Pod-à-Pod selon le Zero Trust.',
    example: 'Autoriser uniquement role=backend à joindre postgres-db sur le port 5432.',
  },
  {
    id: 'wireguard-ipsec-split',
    term: 'VPN WireGuard, IPSec & Split-Tunneling',
    islandId: 18,
    category: 'Réseaux avancés',
    definition: 'Encapsulent et chiffrent les paquets privés sur Internet ; le Split-Tunneling ne fait passer que le trafic d’entreprise dans le VPN.',
    example: 'AllowedIPs = 10.0.2.0/24 en WireGuard pour laisser la visio sortir en direct.',
  },
  {
    id: 'nat-pat-stateful',
    term: 'NAT / PAT & Pare-feu Stateful',
    islandId: 18,
    category: 'Réseaux avancés',
    definition: 'Le PAT traduit plusieurs IP privées derrière une IP publique via des ports éphémères ; le pare-feu Stateful suit la table d’états des sessions.',
    example: '192.168.1.10 → 203.0.113.5:51001 et trafic retour HTTPS autorisé automatiquement.',
  },
  {
    id: 'dmz',
    term: 'DMZ (Zone Démilitarisée)',
    islandId: 19,
    category: 'Systèmes & Sécurité',
    definition: 'Sous-réseau tampon isolé entre un pare-feu périmétrique (FW1) et un pare-feu interne (FW2) hébergeant les serveurs exposés à Internet.',
    example: 'Serveur Web Nginx en DMZ, tandis que PostgreSQL reste protégé dans le réseau privé derrière FW2.',
  },
  {
    id: 'nginx-proxy',
    term: 'Reverse Proxy (Nginx) & TLS',
    islandId: 19,
    category: 'Systèmes & Sécurité',
    definition: 'Serveur frontal recevant les requêtes HTTPS (:443) des clients pour les relayer vers l’application écoutant en local (127.0.0.1).',
    example: 'Nginx termine TLS Let’s Encrypt et transmet le trafic vers Node.js sur 127.0.0.1:3000.',
  },
  {
    id: 'ufw-firewall',
    term: 'UFW & Politique Deny-by-Default',
    islandId: 19,
    category: 'Systèmes & Sécurité',
    definition: 'Interface simplifiée du pare-feu Linux (nftables/iptables) appliquant le principe « tout bloquer en entrée sauf exceptions explicites ».',
    example: 'ufw default deny incoming && ufw allow 443/tcp && ufw allow from 198.51.100.10 to any port 22.',
  },
  {
    id: 'ssh-ed25519',
    term: 'Durcissement SSH (Clé Ed25519)',
    islandId: 19,
    category: 'Systèmes & Sécurité',
    definition: 'Sécurisation de l’accès distant Linux en désactivant la connexion root et les mots de passe au profit de clés asymétriques Ed25519.',
    example: 'PermitRootLogin no et PasswordAuthentication no dans /etc/ssh/sshd_config.',
  },
  {
    id: 'vlan-8021q',
    term: 'VLAN & Étiquette IEEE 802.1Q',
    islandId: 20,
    category: 'Réseaux avancés',
    definition: 'Segmentation logique d’un switch L2 en réseaux isolés ; la norme 802.1Q insère un tag de 4 octets (VLAN ID 1–4094) dans la trame Ethernet.',
    example: 'VLAN 10 Direction, VLAN 20 Employés, VLAN 30 Invités et VLAN 99 Serveurs.',
  },
  {
    id: 'trunk-access',
    term: 'Port Access vs Port Trunk',
    islandId: 20,
    category: 'Réseaux avancés',
    definition: 'Un port Access appartient à un seul VLAN pour un poste final ; un port Trunk transporte plusieurs VLANs étiquetés entre switchs ou vers un routeur.',
    example: 'Gi0/1 en mode Trunk vers le routeur cœur pour le routage Inter-VLAN.',
  },
  {
    id: 'wpa3-radius',
    term: 'Wi-Fi WPA3-Enterprise (802.1X / RADIUS)',
    islandId: 20,
    category: 'Réseaux avancés',
    definition: 'Standard Wi-Fi d’entreprise authentifiant chaque utilisateur individuellement auprès d’un serveur RADIUS avec chiffrement renforcé SAE/GCMP.',
    example: 'Révocation immédiate de l’accès Wi-Fi d’un salarié partant sans modifier le mot de passe des autres.',
  },
  {
    id: 'ipv6-slaac',
    term: 'IPv6 (128 bits) & SLAAC',
    islandId: 21,
    category: 'Réseaux avancés',
    definition: 'Protocole IP de nouvelle génération offrant 2¹²⁸ adresses ; SLAAC permet aux équipements de s’auto-attribuer une IPv6 globale sans serveur DHCPv6.',
    example: '2001:db8:42::10/64 auto-configurée à partir du préfixe annoncé par le routeur (NDP).',
  },
  {
    id: 'dual-stack-aaaa',
    term: 'Dual-Stack & DNS AAAA',
    islandId: 21,
    category: 'Réseaux avancés',
    definition: 'Cohabitation simultanée d’IPv4 et d’IPv6 sur les mêmes serveurs et routeurs, publiée dans le DNS via les enregistrements A (IPv4) et AAAA (IPv6).',
    example: 'portal.cyberland.gem résout à la fois vers 203.0.113.10 (A) et 2001:db8::10 (AAAA).',
  },
  {
    id: 'oauth2-pkce',
    term: 'OAuth 2.0 + PKCE & OpenID Connect',
    islandId: 22,
    category: 'Systèmes & Sécurité',
    definition: 'Standards modernes d’autorisation et d’authentification déléguées utilisant un défi cryptographique PKCE (SHA-256) pour sécuriser les apps Web/Mobile.',
    example: 'Connexion « Se connecter avec Google » sans jamais transmettre son mot de passe à l’application tierce.',
  },
  {
    id: 'jwt-idor',
    term: 'JWT (RS256) & Faille IDOR / BOLA',
    islandId: 22,
    category: 'Systèmes & Sécurité',
    definition: 'Jeton signé en 3 parties (Header.Payload.Signature) ; IDOR/BOLA survient lorsqu’une API ne vérifie pas que la ressource demandée appartient bien à jwt.sub.',
    example: 'Rejeter GET /api/invoices/43 par l’utilisateur #42 avec un code HTTP 403 Forbidden.',
  },
];

export const DEBUG_TICKETS: DebugTicket[] = [
  {
    id: 'dbg-1',
    title: 'Ticket #104 — Impossible de joindre meteo.cyberland.gem',
    islandRef: 'Île 2 · DNS & IP',
    symptom:
      "Un habitant signale que son navigateur affiche « Adresse introuvable » sur meteo.cyberland.gem, alors que son Wi-Fi fonctionne.",
    tools: [
      {
        id: 'ping-ip',
        label: 'ping 10.42.0.80',
        output: 'Réponse de 10.42.0.80 : temps = 14 ms · TTL=64 (4/4 paquets reçus)',
      },
      {
        id: 'nslookup',
        label: 'nslookup meteo.cyberland.gem',
        output: 'ERREUR : Délai d’attente dépassé — Aucune réponse du serveur DNS (192.168.1.53).',
      },
      {
        id: 'firewall',
        label: 'vérifier pare-feu port 443',
        output: 'Règle active : TCP 443 AUTORISÉ vers 10.42.0.80.',
      },
    ],
    options: [
      'Le câble Ethernet du serveur Cloud est débranché',
      'Le serveur DNS ne répond plus pour traduire le nom en IP',
      'Le port 443 HTTPS est bloqué par le pare-feu',
      'L’ordinateur n’a pas d’adresse MAC',
    ],
    correctIndex: 1,
    explanation:
      "Le ping direct vers l'IP 10.42.0.80 répond en 14 ms, prouvant que le réseau fonctionne. En revanche, nslookup échoue : le problème vient de la résolution DNS.",
    xpReward: 40,
  },
  {
    id: 'dbg-2',
    title: 'Ticket #118 — Saccades lors de la visioconférence du phare',
    islandRef: 'Île 3 · TCP vs UDP',
    symptom:
      "L'appel vidéo en direct entre deux îles se fige pendant 3 secondes à chaque micro-coupure radio au lieu de rester fluide.",
    tools: [
      {
        id: 'proto',
        label: 'inspecter protocole flux vidéo',
        output: 'Flux détecté : TCP port 443 · Retransmissions élevées (18 paquets réexpédiés).',
      },
      {
        id: 'dns',
        label: 'nslookup visio.gem',
        output: 'visio.gem → 10.0.4.21 (résolu en 4 ms).',
      },
      {
        id: 'cpu',
        label: 'charge serveur Cloud',
        output: 'CPU : 28 % · RAM : 41 % · État NOMINAL.',
      },
    ],
    options: [
      'Le serveur Cloud est surchargé à 100 %',
      'Le flux temps réel utilise TCP (qui met en pause pour réexpédier les pertes) au lieu d’UDP',
      'Le serveur DNS est en panne',
      'Le disque dur est saturé de sauvegardes',
    ],
    correctIndex: 1,
    explanation:
      'Pour de la vidéo en direct, TCP bloque le flux dès qu’un paquet se perd pour attendre sa retransmission. Passer sur UDP élimine ces gels d’image.',
    xpReward: 40,
  },
  {
    id: 'dbg-3',
    title: 'Ticket #129 — Connexion bloquée sur l’outil d’administration',
    islandRef: 'Île 3 · Pare-feu & Ports',
    symptom:
      "Un technicien tente de se connecter au routeur de la forteresse via un ancien client Telnet et reçoit « Connection refused ».",
    tools: [
      {
        id: 'fw-log',
        label: 'journal pare-feu',
        output: 'DROP IN=eth0 SRC=192.168.1.9 PROTO=TCP DPT=23 (Règle : Bloquer Telnet non chiffré).',
      },
      {
        id: 'ssh-check',
        label: 'tester port 22 (SSH)',
        output: 'Port 22 (SSH chiffré) : OUVERT pour le réseau d’administration interne.',
      },
      {
        id: 'ping',
        label: 'ping 192.168.1.1',
        output: 'Réponse de 192.168.1.1 : temps = 2 ms.',
      },
    ],
    options: [
      'Le pare-feu bloque volontairement le port 23 (Telnet en clair) : il faut utiliser SSH (port 22)',
      'Le routeur est éteint',
      'Il faut désactiver complètement le pare-feu',
      'L’adresse IP 192.168.1.1 est invalide',
    ],
    correctIndex: 0,
    explanation:
      'Le journal pare-feu confirme le blocage légitime du port 23 (Telnet non sécurisé). La bonne pratique est d’utiliser SSH (port 22 chiffré).',
    xpReward: 40,
  },
  {
    id: 'dbg-4',
    title: 'Ticket #142 — Site touristique lent à midi puis hors ligne',
    islandRef: 'Île 4 · Élasticité Cloud',
    symptom:
      "Chaque jour entre 12h et 14h, la billetterie de Cyberland affiche des erreurs 503 alors que tout fonctionne parfaitement le matin et le soir.",
    tools: [
      {
        id: 'metrics',
        label: 'monitoring CPU & trafic',
        output: '12h15 : Trafic 195 req/s · 1 serveur fixe actif (capacité max 55 req/s) · CPU 100 %.',
      },
      {
        id: 'autoscale',
        label: 'état Auto-Scaling',
        output: 'Auto-Scaling : DÉSACTIVÉ (Min=1, Max=1).',
      },
      {
        id: 'tls',
        label: 'certificat HTTPS',
        output: 'Certificat TLS valide jusqu’en 2028.',
      },
    ],
    options: [
      'Le certificat HTTPS a expiré',
      'L’architecture n’a qu’un seul serveur fixe sans Auto-Scaling pour absorber le pic de midi',
      'Un rocher bloque les ondes Wi-Fi du serveur',
      'Il manque une adresse MAC sur le navigateur client',
    ],
    correctIndex: 1,
    explanation:
      "La capacité fixe (55 req/s) est très inférieure au pic de midi (195 req/s). Activer l'Auto-Scaling permet d'ajouter automatiquement des serveurs durant le pic.",
    xpReward: 40,
  },
  {
    id: 'dbg-5',
    title: 'Ticket #156 — Facture Cloud doublée sans hausse de trafic',
    islandRef: 'Île 6 · FinOps & Éco-Cloud',
    symptom:
      "Le nombre de visiteurs n'a pas augmenté ce mois-ci, pourtant la facture Cloud et la consommation énergétique ont bondi de 90 %.",
    tools: [
      {
        id: 'billing',
        label: 'audit ressources Cloud',
        output: '4 serveurs de test allumés 24h/24 (CPU moyen 4 %) + 320 Go de snapshots orphelins.',
      },
      {
        id: 'traffic',
        label: 'courbe de trafic visiteurs',
        output: 'Trafic stable : 45 req/s en moyenne (identique au mois dernier).',
      },
      {
        id: 'dns-check',
        label: 'santé DNS',
        output: 'Temps de résolution : 8 ms · 100 % disponible.',
      },
    ],
    options: [
      'Une attaque pirate sur le port 443',
      'Des ressources inutilisées (serveurs de test allumés la nuit et snapshots orphelins) génèrent du gaspillage',
      'Le Load Balancer ne fonctionne plus',
      'La fibre optique coûte plus cher le week-end',
    ],
    correctIndex: 1,
    explanation:
      "L'audit FinOps révèle des serveurs de test tournant à vide 24h/24 et des clichés orphelins. Planifier leur extinction nocturne et purger le stockage résout l'anomalie.",
    xpReward: 40,
  },
  {
    id: 'dbg-6',
    title: "Ticket #168 — Accès refusé à l'intranet en télétravail",
    islandRef: 'Île 7 · Types de réseaux & VPN',
    symptom:
      "Depuis le Wi-Fi public d'un café sur le continent, une technicienne navigue normalement sur Internet mais ne parvient pas à ouvrir l'intranet interne 10.0.2.15 de Cyberland.",
    tools: [
      {
        id: 'wan-check',
        label: 'tester accès Internet (WAN)',
        output: 'Navigation HTTPS publique OK (latence 22 ms).',
      },
      {
        id: 'vpn-status',
        label: 'vérifier client VPN',
        output: 'Statut VPN : DÉCONNECTÉ · Aucun tunnel vers le LAN privé 10.0.2.0/24.',
      },
      {
        id: 'lan-check',
        label: 'santé serveur intranet',
        output: 'Serveur 10.0.2.15 EN LIGNE (accessible uniquement depuis le LAN privé ou via VPN).',
      },
    ],
    options: [
      'Le réseau Wi-Fi public est complètement coupé',
      'Le client VPN n’est pas connecté pour établir un tunnel sécurisé vers le réseau privé interne',
      'Il faut installer un câble Bluetooth de 3 000 km',
      'Le serveur intranet n’a plus de disque dur',
    ],
    correctIndex: 1,
    explanation:
      "L'intranet 10.0.2.15 est réservé au réseau privé (LAN). Depuis un accès public distant (WAN), il faut activer le client VPN pour chiffrer la connexion et rejoindre le réseau interne.",
    xpReward: 40,
  },
  {
    id: 'dbg-7',
    title: 'Ticket #181 — Le module météo bloque toute la billetterie',
    islandRef: 'Île 9 · Conteneurs & Microservices',
    symptom:
      "Un bug mineur dans le widget météo a fait saturer la mémoire du serveur unique : plus aucun visiteur ne peut acheter de billet sur Cyberland.",
    tools: [
      {
        id: 'arch-check',
        label: 'inspecter architecture serveur',
        output: 'Architecture : Monolithe unique sur 1 VM (Billetterie + Météo + Paiement dans le même processus).',
      },
      {
        id: 'logs',
        label: 'consulter journaux mémoire',
        output: 'OutOfMemoryError déclenché par meteo-widget → redémarrage complet de la VM (45 s d’arrêt).',
      },
      {
        id: 'docker-ready',
        label: 'vérifier cluster Docker',
        output: 'Hôte Docker disponible : capable d’isoler chaque service avec limite RAM dédiée.',
      },
    ],
    options: [
      'Découper l’application en microservices conteneurisés (Docker) avec isolation mémoire par service',
      'Supprimer le chiffrement HTTPS pour économiser de la RAM',
      'Passer le câble réseau en topologie Bus',
      'Redémarrer manuellement la VM toutes les 10 minutes',
    ],
    correctIndex: 0,
    explanation:
      'En isolant la Météo, la Billetterie et le Paiement dans des conteneurs Docker séparés, un crash du widget météo n’affecte jamais la vente de billets et redémarre en 1 seconde.',
    xpReward: 40,
  },
  {
    id: 'dbg-8',
    title: 'Ticket #194 — Alerte MFA suspecte à 02h14 du matin',
    islandRef: 'Île 10 · Phishing & Zero Trust',
    symptom:
      "Un administrateur reçoit 6 notifications consécutives « Approuver la connexion » sur son téléphone en pleine nuit alors qu'il ne tente pas de se connecter.",
    tools: [
      {
        id: 'auth-log',
        label: 'journal des connexions',
        output: 'Échec MFA x6 depuis IP 185.220.x.x (hors archipel) — Mot de passe correct saisi !',
      },
      {
        id: 'mail-audit',
        label: 'vérifier derniers clics e-mail',
        output: 'Hier 17h40 : ouverture du lien "https://cyber-land-rh-urgent.xyz/login".',
      },
      {
        id: 'policy',
        label: 'politique Zero Trust',
        output: 'Règle active : blocage automatique si MFA refusé + révocation immédiate de session.',
      },
    ],
    options: [
      'Accepter la notification pour faire cesser les alertes',
      'Refuser la demande (attaque par fatigue MFA suite à un phishing), révoquer les sessions et changer immédiatement le mot de passe',
      'Désactiver le MFA pour ne plus être dérangé la nuit',
      'Installer un câble fibre optique plus rapide',
    ],
    correctIndex: 1,
    explanation:
      'L’attaquant a récupéré le mot de passe via le faux site .xyz et bombarde de requêtes MFA pour pousser à l’erreur. Il faut refuser, révoquer les jetons et changer le mot de passe.',
    xpReward: 40,
  },
  {
    id: 'dbg-9',
    title: 'Ticket #205 — Audit sécurité : mots de passe lisibles dans la base',
    islandRef: 'Île 11 · Cryptographie',
    symptom:
      "Un audit de sécurité révèle que le nouveau portail touristique stocke les mots de passe chiffrés avec une clé AES unique dans le code source au lieu d'un hachage salé.",
    tools: [
      {
        id: 'db-sample',
        label: 'inspecter table users',
        output: 'alice@cyberland.gem | pwd=AES("Soleil2026!") · Clé partagée trouvée dans config.js.',
      },
      {
        id: 'crypto-policy',
        label: 'vérifier politique cryptographique',
        output: 'Exigence : empreinte irréversible salée (Argon2id ou bcrypt) — jamais réversible.',
      },
      {
        id: 'tls-check',
        label: 'contrôler certificat HTTPS',
        output: 'TLS 1.3 actif sur port 443 · Certificat valide.',
      },
    ],
    options: [
      'Migrer le stockage des mots de passe vers un hachage lent irréversible avec sel unique (Argon2 / bcrypt)',
      'Supprimer le certificat TLS 1.3 pour accélérer la connexion',
      'Stocker les mots de passe directement en texte clair dans le navigateur',
      'Remplacer le protocole TCP par UDP sur la base de données',
    ],
    correctIndex: 0,
    explanation:
      'Un mot de passe ne doit jamais être déchiffrable : on stocke une empreinte de hachage irréversible associée à un sel aléatoire par utilisateur (Argon2 / bcrypt).',
    xpReward: 40,
  },
  {
    id: 'dbg-10',
    title: 'Ticket #219 — Erreurs 500 juste après la mise en ligne v2.4',
    islandRef: 'Île 12 · DevOps & CI/CD',
    symptom:
      "Trois minutes après l'activation du déploiement Canary v2.4 sur 10 % des visiteurs, le tableau de bord signale 14 % d'erreurs HTTP 500 sur le paiement.",
    tools: [
      {
        id: 'canary-metrics',
        label: 'métriques Canary vs Blue',
        output: 'Blue v2.3 (90 % trafic) : 0,0 % erreur · Canary v2.4 (10 % trafic) : 14,2 % HTTP 500.',
      },
      {
        id: 'ci-log',
        label: 'journal pipeline CI/CD',
        output: 'Image Blue v2.3 toujours prête et chaude en mémoire · Rollback estimé : < 2 secondes.',
      },
      {
        id: 'dns-ok',
        label: 'santé DNS & Load Balancer',
        output: 'Load Balancer opérationnel · Routage pondéré actif.',
      },
    ],
    options: [
      'Passer immédiatement 100 % du trafic sur v2.4 en espérant que le bug disparaisse',
      'Déclencher un Rollback immédiat vers la version Blue v2.3 (100 % du trafic), puis corriger le bug en environnement de test',
      'Éteindre tous les serveurs de l’archipel pendant 24 heures',
      'Ouvrir le port 23 Telnet pour éditer le code en production',
    ],
    correctIndex: 1,
    explanation:
      'Le déploiement Canary a précisément joué son rôle en limitant l’incident à 10 % des visiteurs. Le bon réflexe DevOps est un Rollback instantané vers Blue v2.3 avant d’analyser le bug hors production.',
    xpReward: 40,
  },
  {
    id: 'dbg-11',
    title: 'Ticket #231 — Identifiants interceptés sur le portail interne (Wireshark)',
    islandRef: 'Île 13 · Wireshark & tcpdump',
    symptom:
      "Un analyste ouvre une capture .pcap réalisée avec tcpdump sur le réseau local et parvient à lire le mot de passe d'un employé en utilisant « Follow TCP Stream ».",
    tools: [
      {
        id: 'tcpdump-out',
        label: 'tcpdump -r incident.pcap -nn',
        output: 'IP 192.168.1.24.54012 > 10.0.2.50.80: Flags [P.], HTTP: POST /login (user=camille&pass=Phare2026!)',
      },
      {
        id: 'ws-filter',
        label: 'filtre Wireshark : tls',
        output: '0 paquet TLS/HTTPS vers 10.0.2.50 · Tout le trafic login passe sur le port 80.',
      },
      {
        id: 'dns-trace',
        label: 'vérifier résolution DNS',
        output: 'portail.cyberland.gem → 10.0.2.50 (OK).',
      },
    ],
    options: [
      'Le formulaire de connexion utilise HTTP (port 80 en clair) au lieu de HTTPS/TLS (port 443) : il faut forcer TLS et rediriger le port 80',
      'Wireshark a cassé le chiffrement AES-256 en une seconde',
      'Le serveur DNS a supprimé le certificat',
      'Il faut désactiver l’interface eth0 sur tous les postes',
    ],
    correctIndex: 0,
    explanation:
      'La capture tcpdump/Wireshark montre un POST /login sur le port 80 sans TLS : toute personne écoutant le segment réseau lit les identifiants en clair. Passer en HTTPS (port 443) chiffre la charge utile.',
    xpReward: 40,
  },
  {
    id: 'dbg-12',
    title: 'Ticket #245 — Alerte Azure Monitor : rafale EventID 4625 sur WIN-AD-01',
    islandRef: 'Île 14 · Windows Azure Monitor',
    symptom:
      "Le tableau de bord Azure Monitor déclenche une alerte sécurité critique sur le contrôleur Windows WIN-AD-01 en pleine nuit.",
    tools: [
      {
        id: 'kql-sec',
        label: 'KQL : Event | where EventID == 4625',
        output: 'WIN-AD-01 : 184 échecs d’ouverture de session RDP en 3 minutes depuis IP 185.220.101.9.',
      },
      {
        id: 'ama-hb',
        label: 'KQL : Heartbeat | summarize max(TimeGenerated)',
        output: 'Agent AMA actif sur WIN-AD-01 · DCR Windows-Security opérationnelle.',
      },
      {
        id: 'nsg-check',
        label: 'vérifier règles pare-feu Azure NSG',
        output: 'Règle trouvée : Port TCP 3389 (RDP) OUVERT à 0.0.0.0/0 (tout Internet) !',
      },
    ],
    options: [
      'L’agent AMA est en panne et invente des faux logs',
      'Une attaque brute-force RDP cible le port 3389 exposé sur Internet : bloquer 3389 public dans le NSG et utiliser Azure Bastion / VPN + MFA',
      'Il faut supprimer le Log Analytics Workspace pour effacer les alertes',
      'Le processeur manque de ventilation',
    ],
    correctIndex: 1,
    explanation:
      'La requête KQL sur l’EventID Windows 4625 révèle un brute-force RDP rendu possible par le port 3389 ouvert à 0.0.0.0/0. Il faut fermer l’exposition publique et passer par Azure Bastion ou VPN.',
    xpReward: 40,
  },
  {
    id: 'dbg-13',
    title: 'Ticket #258 — Rafale d’EventID 4769 (RC4) sur le contrôleur de domaine',
    islandRef: 'Île 15 · Active Directory & Kerberos',
    symptom:
      'Le contrôleur de domaine WIN-AD-01 enregistre 38 demandes de billets de service Kerberos (EventID 4769) en chiffrement RC4 faible depuis le poste stagiaire PC-09 en moins de 10 secondes.',
    tools: [
      {
        id: 'ad-4769',
        label: 'inspecter EventID 4769',
        output: 'PC-09 demande des billets TGS (Encryption 0x17 RC4) pour 14 comptes de service SPN (SQL, Backup, IIS).',
      },
      {
        id: 'spn-audit',
        label: 'auditer comptes de service',
        output: 'Les comptes de service utilisent des mots de passe manuels anciens (non migrés vers gMSA).',
      },
      {
        id: 'dns-ad',
        label: 'vérifier DNS interne',
        output: 'cyberland.local DNS nominal (1 ms).',
      },
    ],
    options: [
      'Une attaque Kerberoasting est en cours : isoler PC-09, réinitialiser les comptes SPN et migrer vers des comptes gMSA avec chiffrement AES',
      'Le serveur DNS a besoin d’un nouveau câble Wi-Fi',
      'Il faut ajouter PC-09 dans le groupe Domain Admins',
      'C’est normal : chaque navigateur demande 38 tickets RC4 au démarrage',
    ],
    correctIndex: 0,
    explanation:
      'Une rafale de requêtes TGS en chiffrement RC4 (0x17) vers de multiples SPN caractérise le Kerberoasting. Isoler le poste source, changer les mots de passe et adopter les gMSA + AES neutralise la menace.',
    xpReward: 40,
  },
  {
    id: 'dbg-14',
    title: 'Ticket #269 — Alerte SIEM nocturne : transfert HTTPS massif à 02h00',
    islandRef: 'Île 16 · Centre SOC & SIEM',
    symptom:
      'Le SIEM lève une alerte « Volume sortant inhabituel (42 Go) » depuis SRV-SQL-01 vers backup.cyberland.gem:443 à 02h00 du matin.',
    tools: [
      {
        id: 'chg-cal',
        label: 'vérifier calendrier IT & changements',
        output: 'Ticket #CHG-884 approuvé : Sauvegarde mensuelle complète SRV-SQL-01 vers coffre chiffré à 02h00.',
      },
      {
        id: 'ioc-check',
        label: 'vérifier réputation destination',
        output: 'backup.cyberland.gem = coffre interne certifié · 0 alerte EDR sur SRV-SQL-01.',
      },
      {
        id: 'edr-proc',
        label: 'inspecter processus source',
        output: 'Processus signé : AzureBackupAgent.exe (certificat Microsoft valide).',
      },
    ],
    options: [
      'Éteindre immédiatement tous les serveurs de l’entreprise',
      'Classer l’alerte en Faux Positif documenté (#CHG-884) et affiner la règle SIEM pour éviter la fatigue d’alerte',
      'Désactiver complètement le SIEM pour les 6 prochains mois',
      'Ouvrir le port Telnet 23 sur SRV-SQL-01',
    ],
    correctIndex: 1,
    explanation:
      'Le contexte prouve qu’il s’agit d’une sauvegarde planifiée légitime signée vers le coffre officiel. Un analyste SOC documente la preuve, classe en Faux Positif et ajuste la règle de détection.',
    xpReward: 40,
  },
  {
    id: 'dbg-15',
    title: 'Ticket #277 — Pod Kubernetes bloqué en CrashLoopBackOff après déploiement',
    islandRef: 'Île 17 · Kubernetes & Conteneurs',
    symptom:
      'Deux des trois Pods « api-billetterie » tournent normalement en v1.8, mais le nouveau Pod v1.9 reste bloqué en état CrashLoopBackOff.',
    tools: [
      {
        id: 'k8s-logs',
        label: 'kubectl logs api-billetterie-v19 --previous',
        output: 'FATAL ERROR: Missing required env variable DATABASE_URL — Process exited with code 1.',
      },
      {
        id: 'k8s-svc',
        label: 'kubectl get svc api-svc',
        output: 'Service ClusterIP 10.96.0.42 → route le trafic uniquement vers les 2 Pods sains (Readiness OK).',
      },
      {
        id: 'k8s-nodes',
        label: 'kubectl get nodes',
        output: 'node-01 Ready · node-02 Ready · CPU 34 %.',
      },
    ],
    options: [
      'Ajouter la variable manquante DATABASE_URL dans le Secret/ConfigMap du Deployment puis redéployer (ou faire un Rollback)',
      'Supprimer le Service ClusterIP pour forcer le trafic sur le Pod cassé',
      'Acheter 10 nouveaux routeurs physiques',
      'Passer le cluster Kubernetes en topologie Bus',
    ],
    correctIndex: 0,
    explanation:
      '« kubectl logs --previous » montre immédiatement la variable d’environnement manquante qui provoque l’arrêt du conteneur. Pendant ce temps, la sonde Readiness protège les utilisateurs en ne routant que vers les Pods sains.',
    xpReward: 40,
  },
  {
    id: 'dbg-16',
    title: 'Ticket #289 — Saturation du lien siège dès 09h00 avec 250 télétravailleurs',
    islandRef: 'Île 18 · VPN WireGuard & NAT',
    symptom:
      'Depuis le passage en télétravail généralisé, les appels vidéo Teams saccadent fortement et la passerelle VPN du siège affiche 99 % de bande passante saturée.',
    tools: [
      {
        id: 'vpn-route',
        label: 'inspecter politique VPN',
        output: 'Mode actuel : Full-Tunnel (AllowedIPs = 0.0.0.0/0) — 82 % du trafic VPN = flux vidéo Teams/YouTube !',
      },
      {
        id: 'lan-need',
        label: 'analyser accès privés requis',
        output: 'Seul le sous-réseau ERP interne 10.0.2.0/24 nécessite de passer par le tunnel VPN.',
      },
      {
        id: 'fw-cpu',
        label: 'santé pare-feu siège',
        output: 'CPU passerelle VPN : 96 % (goulot d’étranglement sur l’unique lien fibre du siège).',
      },
    ],
    options: [
      'Désactiver le chiffrement du VPN pour gagner 10 % de vitesse',
      'Passer en Split-Tunneling (AllowedIPs = 10.0.2.0/24) afin que seule la connexion ERP traverse le VPN et que la visio sorte directement sur Internet',
      'Interdire le télétravail définitivement',
      'Remplacer WireGuard par Telnet port 23',
    ],
    correctIndex: 1,
    explanation:
      'En Full-Tunnel, toute la vidéo des télétravailleurs fait un aller-retour inutile par le siège. Le Split-Tunneling libère instantanément la passerelle VPN tout en gardant le trafic interne chiffré.',
    xpReward: 40,
  },
  {
    id: 'dbg-17',
    title: 'Ticket #301 — Impossible de se reconnecter en SSH après activation d’UFW',
    islandRef: 'Île 19 · Serveur & Pare-feu',
    symptom:
      'Un administrateur vient de configurer son nouveau serveur Ubuntu LTS et d’exécuter « ufw default deny incoming && ufw enable ». Depuis, toutes ses connexions SSH expirent.',
    tools: [
      {
        id: 'ufw-status',
        label: 'console KVM : sudo ufw status verbose',
        output: 'Status: active · Default: deny (incoming), allow (outgoing) · Règles actives : 443/tcp ALLOW.',
      },
      {
        id: 'sshd-check',
        label: 'systemctl status ssh',
        output: 'active (running) — écoute sur 0.0.0.0:22.',
      },
      {
        id: 'nginx-check',
        label: 'curl -I https://srv.cyberland.gem',
        output: 'HTTP/2 200 OK (le site HTTPS répond normalement).',
      },
    ],
    options: [
      'Désactiver définitivement le pare-feu UFW',
      'Ajouter une règle explicite autorisant le port 22/tcp depuis l’IP d’administration/VPN (ufw allow from <IP_ADMIN> to any port 22) via la console de secours',
      'Réinstaller complètement le système Linux',
      'Ouvrir les ports 23 (Telnet) et 5432 (PostgreSQL) sur Internet',
    ],
    correctIndex: 1,
    explanation:
      'Avec « ufw default deny incoming », le port 22 est bloqué tant qu’aucune règle d’autorisation SSH n’est ajoutée. Toujours autoriser SSH (restreint à votre IP admin ou VPN) avant d’activer UFW !',
    xpReward: 45,
  },
  {
    id: 'dbg-18',
    title: 'Ticket #314 — Audit Nmap : base PostgreSQL exposée sur Internet',
    islandRef: 'Île 19 · Architecture DMZ & Pare-feu',
    symptom:
      'Un scan externe sur le serveur de production révèle que le port 5432/tcp (PostgreSQL) répond directement depuis Internet et subit des centaines de tentatives de connexion.',
    tools: [
      {
        id: 'nmap-ext',
        label: 'nmap -sV 203.0.113.42',
        output: '443/tcp OPEN nginx · 5432/tcp OPEN postgresql 16.2 · 22/tcp FILTERED.',
      },
      {
        id: 'pg-conf',
        label: 'vérifier postgresql.conf & architecture',
        output: 'listen_addresses = "*" · Serveur Web et BDD sur le même segment public sans pare-feu interne FW2.',
      },
      {
        id: 'ufw-rules',
        label: 'ufw status numbered',
        output: '[1] 443/tcp ALLOW Anywhere · [2] 5432/tcp ALLOW Anywhere.',
      },
    ],
    options: [
      'Supprimer la règle 5432/tcp publique, déplacer PostgreSQL derrière le pare-feu interne (ou lier sur 127.0.0.1 / réseau privé) et n’autoriser que le serveur Web',
      'Changer le port 5432 en port 5433 tout en le laissant ouvert à tout Internet',
      'Fermer le port 443 HTTPS des utilisateurs',
      'Désactiver Nginx et exposer Node.js en HTTP clair',
    ],
    correctIndex: 0,
    explanation:
      'Une base de données ne doit jamais être exposée directement sur Internet. Il faut révoquer la règle publique 5432, isoler la BDD dans le réseau privé (derrière FW2) ou sur l’interface locale 127.0.0.1.',
    xpReward: 45,
  },
  {
    id: 'dbg-19',
    title: 'Ticket #327 — Les postes du VLAN 20 n’obtiennent plus d’IP après changement de switch',
    islandRef: 'Île 20 · Switching & VLAN 802.1Q',
    symptom:
      'Suite au remplacement d’un switch d’étage, les postes du VLAN 10 fonctionnent, mais aucun poste du VLAN 20 (Employés) ne parvient à joindre la passerelle ou Internet.',
    tools: [
      {
        id: 'sw-uplink',
        label: 'show interfaces Gi0/1 switchport',
        output: 'Interface Gi0/1 (vers Routeur cœur) : Mode = ACCESS · Access Mode VLAN = 10 (Direction).',
      },
      {
        id: 'sw-ports',
        label: 'show vlan brief',
        output: 'VLAN 10 : Fa0/1-4 · VLAN 20 : Fa0/5-12 (ports actifs).',
      },
      {
        id: 'rtr-sub',
        label: 'show ip interface brief (Routeur)',
        output: 'Gi0/0.10 (10.10.0.1) UP · Gi0/0.20 (10.20.0.1) UP (encapsulation dot1Q 20).',
      },
    ],
    options: [
      'Passer l’interface uplink Gi0/1 en mode Trunk 802.1Q autorisant les VLANs 10 et 20',
      'Mettre tous les employés dans le VLAN 10 de la Direction',
      'Remplacer le câble Ethernet par du Bluetooth',
      'Supprimer les sous-interfaces du routeur',
    ],
    correctIndex: 0,
    explanation:
      'Le port uplink Gi0/1 étant resté en mode Access VLAN 10, les trames du VLAN 20 ne peuvent jamais traverser vers le routeur. Le passer en Trunk 802.1Q rétablit immédiatement le trafic multi-VLAN.',
    xpReward: 45,
  },
  {
    id: 'dbg-20',
    title: 'Ticket #342 — Clients mobiles 5G IPv6-only incapables de joindre le portail',
    islandRef: 'Île 21 · IPv6 & Dual-Stack',
    symptom:
      'Le serveur web dispose bien d’une adresse IPv6 active sur son interface réseau, mais les utilisateurs sur réseau mobile IPv6 reçoivent « Hôte introuvable ».',
    tools: [
      {
        id: 'dig-aaaa',
        label: 'dig AAAA portal.cyberland.gem',
        output: 'ANSWER: 0 (Aucun enregistrement AAAA configuré dans la zone DNS — seul l’enregistrement A IPv4 existe).',
      },
      {
        id: 'ip-addr6',
        label: 'ip -6 addr show eth0',
        output: 'inet6 2001:db8:42::10/64 scope global · Nginx écoute sur [::]:443.',
      },
      {
        id: 'ping6',
        label: 'ping -6 2001:db8:42::10',
        output: '64 bytes from 2001:db8:42::10: time=9.4 ms (joignable directement).',
      },
    ],
    options: [
      'Ajouter l’enregistrement DNS AAAA pointant vers 2001:db8:42::10 tout en conservant l’enregistrement A (Dual-Stack)',
      'Supprimer l’enregistrement DNS A pour couper l’accès IPv4',
      'Désactiver IPv6 sur les téléphones 5G des clients',
      'Remplacer 2001:db8:42::10 par l’adresse locale fe80::1 dans le DNS public',
    ],
    correctIndex: 0,
    explanation:
      'Le serveur répond en IPv6, mais le DNS ne publiait que l’enregistrement A (IPv4). Ajouter l’enregistrement AAAA active instantanément le Dual-Stack pour les clients IPv6 et IPv4.',
    xpReward: 45,
  },
  {
    id: 'dbg-21',
    title: 'Ticket #355 — Fuite de factures clients via modification d’ID dans l’API',
    islandRef: 'Île 22 · Sécurité API & JWT',
    symptom:
      'Un chercheur en sécurité signale qu’en étant connecté avec un compte standard, changer GET /api/invoices/101 en /api/invoices/102 retourne la facture d’un autre client.',
    tools: [
      {
        id: 'api-code',
        label: 'inspecter route /api/invoices/:id',
        output: 'const inv = await db.findInvoice(req.params.id); return res.json(inv); // Aucun contrôle inv.userId === req.user.sub !',
      },
      {
        id: 'jwt-ok',
        label: 'vérifier middleware JWT',
        output: 'Signature RS256 valide · req.user.sub = "usr_101".',
      },
      {
        id: 'tls-api',
        label: 'contrôle HTTPS',
        output: 'TLS 1.3 actif sur port 443.',
      },
    ],
    options: [
      'Corriger la faille IDOR/BOLA en vérifiant côté serveur que inv.userId === req.user.sub (ou rôle admin) avant de renvoyer la facture, sinon répondre 403 Forbidden',
      'Encoder l’ID 102 en Base64 dans l’URL sans ajouter de contrôle serveur',
      'Passer le JWT en algorithme alg:none',
      'Désactiver le pare-feu UFW',
    ],
    correctIndex: 0,
    explanation:
      'La validation du JWT prouve uniquement QUI est l’utilisateur (authentification), pas CE QU’IL a le droit de voir (autorisation). Vérifier la propriété de chaque ressource côté serveur corrige la faille IDOR/BOLA.',
    xpReward: 45,
  },
];

export const STORYBOARDS: VideoStoryboard[] = [
  {
    islandId: 1,
    title: 'Île 1 — Le voyage de la lettre découpée',
    duration: '1 min 30',
    targetConcept: 'Découpage en paquets, acheminement dynamique et supports physiques',
    h5pPauseQuestion: {
      atTimecode: '0:52',
      question: "L'oiseau n°2 rencontre un nuage d'orage et change d'itinéraire. Le message final sera-t-il perdu ?",
      answer: "Non : chaque morceau porte un numéro (2/4). Il arrive par un autre chemin et est remis dans l'ordre à l'arrivée.",
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:18',
        visual:
          "Plan large sur le village côtier de Cyberland. Un habitant tente d'attacher un parchemin géant pesant 100 kg à un seul petit oiseau voyageur qui ne parvient pas à décoller.",
        voiceover:
          "Bienvenue sur l'Île des Signaux ! Pour envoyer un gros fichier sur un réseau — comme une photo ou une vidéo — impossible de tout faire passer d'un seul bloc dans le câble.",
        animationNote: "Animation Lottie : tremblement léger des ailes + icône de poids en surbrillance.",
      },
      {
        shot: 2,
        timecode: '0:18 – 0:38',
        visual:
          "Un découpage lumineux divise proprement la lettre en 4 petites enveloppes numérotées : 1/4, 2/4, 3/4 et 4/4, portant chacune l'adresse du destinataire.",
        voiceover:
          "La solution d'Internet ? Le découpage en paquets ! Le réseau divise le message en petits morceaux numérotés, faciles et rapides à transporter.",
        animationNote: "Transition Rive interactive : clic possible pour inspecter l'en-tête d'un paquet.",
      },
      {
        shot: 3,
        timecode: '0:38 – 1:05',
        visual:
          "4 oiseaux s'envolent. Les oiseaux 1, 3 et 4 suivent la ligne de fibre lumineuse au nord ; l'oiseau 2 évite une bourrasque en passant par un relais Wi-Fi au sud.",
        voiceover:
          "Chaque paquet choisit la route la moins encombrée au moment T : cuivre, fibre optique ou ondes Wi-Fi. Ils n'ont même pas besoin d'arriver dans le même ordre !",
        animationNote: "Tracés SVG animés (stroke-dashoffset) illustrant deux chemins parallèles.",
      },
      {
        shot: 4,
        timecode: '1:05 – 1:30',
        visual:
          "Au phare d'arrivée, les 4 enveloppes se posent dans le désordre (1, 3, 4, puis 2) et se réassemblent instantanément grâce à leurs numéros pour reformer la lettre intacte.",
        voiceover:
          "À destination, l'ordinateur lit les numéros, remet les pièces dans le bon ordre et reconstitue votre fichier en quelques millisecondes. À vous de câbler le village !",
        animationNote: "Pause H5P de validation puis bouton d'accès direct au mini-jeu.",
      },
    ],
  },
  {
    islandId: 2,
    title: "Île 2 — Le facteur et l'annuaire magique",
    duration: '2 min 00',
    targetConcept: 'Résolution DNS, adresse IP et tables de routage',
    h5pPauseQuestion: {
      atTimecode: '1:10',
      question: "Pourquoi les navigateurs contactent-ils un serveur DNS avant de charger un site web ?",
      answer: "Parce que les routeurs ne comprennent que les adresses IP numériques ; le DNS traduit le nom de domaine en IP.",
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:25',
        visual:
          "Un navire-courrier quitte le quai avec une caisse marquée « ile-des-palmiers.gem ». Le capitaine gratte sa casquette : sa boussole n'accepte que des coordonnées chiffrées.",
        voiceover:
          "Sur Internet, les humains retiennent des noms faciles comme ile-des-palmiers.gem. Mais les machines, elles, ne naviguent qu'avec des adresses IP chiffrées.",
        animationNote: "Zoom sur l'étiquette du colis qui bascule du nom texte vers des coordonnées vides.",
      },
      {
        shot: 2,
        timecode: '0:25 – 0:55',
        visual:
          "Le navire lance une fusée-signal vers la haute Tour DNS au centre du port. L'opérateur feuillette un grand registre lumineux et renvoie un faisceau affichant « 192.168.1.42 ».",
        voiceover:
          "Direction la Tour DNS, l'annuaire géant du web ! En quelques millisecondes, elle associe le nom de domaine à son adresse IP exacte : 192.168.1.42.",
        animationNote: "Double flèche animée Aller (requête) / Retour (réponse IP).",
      },
      {
        shot: 3,
        timecode: '0:55 – 1:35',
        visual:
          "Vue aérienne de trois phares-routeurs dans la baie. Chaque phare lit les premiers chiffres de l'IP et oriente le faisceau lumineux vers le chenal le moins congestionné.",
        voiceover:
          "Muni de son IP, notre navire traverse les phares-routeurs. Un routeur ne connaît pas toute la planète : il sait simplement quel prochain phare rapproche le colis de son sous-réseau.",
        animationNote: "Surlignage des préfixes IP (192.168.1.x) au passage de chaque phare.",
      },
      {
        shot: 4,
        timecode: '1:35 – 2:00',
        visual:
          "Arrivé au quai local, le garde vérifie la plaque gravée sur la coque (adresse MAC) pour livrer la caisse devant la bonne cabane.",
        voiceover:
          "Une fois dans le bon port, c'est l'adresse MAC — unique à chaque appareil — qui assure la livraison finale au mètre près. Prenez les commandes des aiguillages !",
        animationNote: "Cartouche récapitulatif IP = Ville/Rue, MAC = Numéro gravé de la boîte aux lettres.",
      },
    ],
  },
  {
    islandId: 3,
    title: 'Île 3 — TCP le méticuleux vs UDP le pressé',
    duration: '1 min 45',
    targetConcept: 'Fiabilité TCP, rapidité UDP, chiffrement HTTPS et filtrage Pare-feu',
    h5pPauseQuestion: {
      atTimecode: '0:58',
      question: "Pour un match de tennis retransmis en direct vidéo, quel protocole privilégier ?",
      answer: "UDP : on préfère perdre une micro-image plutôt que de mettre le direct en pause pour réclamer un paquet perdu.",
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:30',
        visual:
          "Écran scindé. À gauche, TCP en uniforme de contrôleur tend chaque caisse avec un bordereau : « Colis 1 reçu ? — Oui, ACK ! ». La caisse 2 tombe à l'eau : il la renvoie aussitôt.",
        voiceover:
          "Pour transférer un document bancaire ou une page web, rien ne doit manquer. C'est le métier de TCP : il vérifie chaque colis avec un accusé de réception et réexpédie les pertes.",
        animationNote: "Bulles de dialogue synchronisées SYN / ACK sur rythme régulier.",
      },
      {
        shot: 2,
        timecode: '0:30 – 1:00',
        visual:
          "À droite, UDP en tenue de sport lance des balles de tennis en continu à travers le filet. Une balle rebondit dehors : il ne s'arrête pas et sert immédiatement la suivante.",
        voiceover:
          "À l'inverse, pour un appel vidéo ou un jeu en ligne, la vitesse prime ! UDP envoie les données en flux continu sans attendre de confirmation : si une image saute, le direct continue.",
        animationNote: "Chronomètre latence affiché : TCP 48 ms fiable vs UDP 14 ms direct.",
      },
      {
        shot: 3,
        timecode: '1:00 – 1:45',
        visual:
          "Un observateur indiscret tente de lire les colis qui passent. Un cadenas doré (HTTPS / Port 443) verrouille le flux : le texte « Mot de passe » devient un code indéchiffrable « #9fA!2xQ ». Le pare-feu referme le port 23.",
        voiceover:
          "Enfin, pour protéger nos échanges, le chiffrement HTTPS brouille les messages aux yeux des pirates, tandis que le pare-feu contrôle chaque port à l'entrée de la forteresse.",
        animationNote: "Effet de brouillage typographique en direct sur la chaîne de caractères.",
      },
    ],
  },
  {
    islandId: 4,
    title: 'Île 4 — La métaphore de la Pizzeria du Cloud',
    duration: '2 min 00',
    targetConcept: 'Modèles de responsabilité partagée : On-Premise, IaaS, PaaS, SaaS & Élasticité',
    h5pPauseQuestion: {
      atTimecode: '1:25',
      question: "Si vous utilisez une messagerie web ou un tableur directement dans votre navigateur, de quel modèle s'agit-il ?",
      answer: "SaaS (Software as a Service) : tout est géré par le fournisseur, comme manger directement au restaurant.",
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:30',
        visual:
          "Un habitant construit lui-même un four en briques, pétrit la pâte, paie l'électricité et fait toute la vaisselle (On-Premise). Quand 50 touristes arrivent, son unique four explose de vapeur.",
        voiceover:
          "Avec un serveur sur site — On-Premise — vous achetez et entretenez tout le matériel. Pratique par temps calme, mais impossible de pousser les murs quand les visiteurs affluent !",
        animationNote: "Jauge de charge passant de 35 % à 140 % en rouge avec alerte texte.",
      },
      {
        shot: 2,
        timecode: '0:30 – 1:15',
        visual:
          "Trois niveaux montent vers les nuages : IaaS (location d'une cuisine équipée), PaaS (pâte et four chaud livrés, vous créez juste la garniture), SaaS (vous vous asseyez au restaurant).",
        voiceover:
          "Le Cloud propose trois niveaux de confort : en IaaS vous louez l'infrastructure, en PaaS la plateforme est prête pour votre code, et en SaaS vous utilisez directement le logiciel prêt à l'emploi.",
        animationNote: "Empilement interactif de 6 couches colorées (Vous gérez vs Le Cloud gère).",
      },
      {
        shot: 3,
        timecode: '1:15 – 2:00',
        visual:
          "Un graphique jour/nuit sur Cyberland : à midi, trois nouveaux fours-serveurs apparaissent automatiquement dans le nuage ; à minuit, ils s'éteignent et le compteur de pièces d'or ralentit.",
        voiceover:
          "Le super-pouvoir du Cloud ? L'élasticité ! Grâce à l'Auto-Scaling, vos ressources grandissent pendant les pics et rétrécissent la nuit pour ne payer que ce que vous consommez.",
        animationNote: "Courbe de trafic synchronisée avec apparition/disparition des nœuds serveurs.",
      },
    ],
  },
  {
    islandId: 7,
    title: 'Île 7 — Des écouteurs Bluetooth aux câbles sous-marins',
    duration: '1 min 45',
    targetConcept: 'Classification des types de réseaux (PAN, LAN, WLAN, MAN, WAN, VPN) & Topologies',
    h5pPauseQuestion: {
      atTimecode: '1:08',
      question: "Une ville relie son hôpital, sa mairie et son université sur 15 km par fibre optique. De quel type de réseau s'agit-il ?",
      answer: "Un MAN (Metropolitan Area Network), conçu pour interconnecter plusieurs bâtiments à l'échelle d'une ville (1 à 50 km).",
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:25',
        visual:
          "Gros plan sur l'explorateur sur la plage : un halo lumineux de 3 mètres relie sa montre, ses écouteurs et sa tablette (PAN), puis la caméra recule sur le village entier relié par câbles bleus (LAN) et ondes Wi-Fi (WLAN).",
        voiceover:
          "Tous les réseaux n'ont pas la même taille ! Autour de vous sur quelques mètres, c'est le PAN en Bluetooth. Dans une école ou un bureau, on passe au LAN en câble Ethernet ou au WLAN en Wi-Fi.",
        animationNote: "Zoom arrière continu (camera pull-back) révélant des cercles concentriques.",
      },
      {
        shot: 2,
        timecode: '0:25 – 0:55',
        visual:
          "La caméra s'élève au-dessus de la capitale de Cyberland : un anneau de fibre optique lumineux relie la mairie, le port, l'hôpital et l'université sur 18 km (MAN).",
        voiceover:
          "À l'échelle d'une grande ville ou d'un campus étendu, on déploie un MAN — Metropolitan Area Network — qui fédère plusieurs réseaux locaux à très haut débit.",
        animationNote: "Pulsations lumineuses circulant le long de la boucle métropolitaine.",
      },
      {
        shot: 3,
        timecode: '0:55 – 1:25',
        visual:
          "Vue orbitale : des câbles sous-marins traversent l'océan jusqu'au continent (WAN). Un tunnel doré blindé (VPN) enveloppe un paquet parti d'un café public vers la Forteresse.",
        voiceover:
          "Pour traverser les océans, place au WAN — dont Internet est le géant mondial ! Et pour travailler en sécurité sur un réseau public, le VPN crée un tunnel privé chiffré de bout en bout.",
        animationNote: "Animation du tube transparent VPN qui masque les paquets aux regards indiscrets.",
      },
      {
        shot: 4,
        timecode: '1:25 – 1:45',
        visual:
          "Schéma comparatif de 3 topologies : Bus (un câble casse, tout s'éteint), Étoile (tout passe par un switch central) et Maillée (un câble est coupé, le paquet dévie aussitôt par un autre lien).",
        voiceover:
          "Enfin, la forme du câblage compte : contrairement au bus fragile, la topologie maillée multiplie les chemins de secours. À vous de cartographier les 7 missions de l'Atoll !",
        animationNote: "Pause H5P puis ouverture du mini-jeu Architecte des Échelles.",
      },
    ],
  },
  {
    islandId: 8,
    title: 'Île 8 — Les 7 étages de la tour postale OSI',
    duration: '1 min 45',
    targetConcept: 'Modèle OSI (couches 1 à 7), encapsulation et rôles Switch vs Routeur',
    h5pPauseQuestion: {
      atTimecode: '1:02',
      question: 'À quelle couche du modèle OSI opère un routeur qui lit l’adresse IP de destination ?',
      answer: 'À la Couche 3 (Réseau), tandis qu’un Switch opère en Couche 2 (Liaison, adresses MAC).',
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:30',
        visual:
          "Une tour méditerranéenne de 7 étages vue en coupe. Au 7e étage (Application), un navigateur prépare une requête HTTPS qui descend un escalier lumineux.",
        voiceover:
          "Pour qu'un message traverse le monde sans chaos, les ingénieurs ont divisé le travail en 7 étages : c'est le modèle OSI !",
        animationNote: "Surlignage descendant des couches 7, 6 et 5 avec icône cadenas TLS.",
      },
      {
        shot: 2,
        timecode: '0:30 – 1:05',
        visual:
          "À l'étage 4 (Transport), la donnée reçoit un badge Port 443 (Segment). À l'étage 3 (Réseau), une enveloppe IP (Paquet). À l'étage 2 (Liaison), une caisse MAC (Trame).",
        voiceover:
          "C'est l'encapsulation : chaque couche emballe le colis avec ses propres informations — ports en couche 4, IP en couche 3, MAC en couche 2.",
        animationNote: "Poupées russes colorées s'emboîtant en temps réel.",
      },
      {
        shot: 3,
        timecode: '1:05 – 1:45',
        visual:
          "Au rez-de-chaussée (Couche 1 Physique), la trame se transforme en flashs lumineux 010110 dans la fibre optique jusqu'à la tour voisine qui la déballe de 1 à 7.",
        voiceover:
          "Tout en bas, les données deviennent de purs signaux binaires 0 et 1 ! À l'arrivée, la tour destinataire fait exactement l'opération inverse.",
        animationNote: "Impulsions binaires animées suivies de la désencapsulation ascendante.",
      },
    ],
  },
  {
    islandId: 9,
    title: 'Île 9 — Du cargo géant aux conteneurs Docker',
    duration: '1 min 45',
    targetConcept: 'Conteneurisation Docker, légèreté vs VM et résilience des Microservices',
    h5pPauseQuestion: {
      atTimecode: '0:55',
      question: 'Pourquoi un conteneur démarre-t-il beaucoup plus vite qu’une Machine Virtuelle classique ?',
      answer: 'Parce qu’il partage le noyau du système hôte au lieu de démarrer un système d’exploitation complet à chaque fois.',
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:30',
        visual:
          "Sur le quai, un cargo monolithique empile caisses météo, billets et paiements en vrac. Une caisse météo fuit et fait couler tout le navire.",
        voiceover:
          "Dans une application monolithique classique, tout partage le même navire : si un petit module plante, toute la plateforme s'arrête !",
        animationNote: "Effet de bascule du monolithe avec alerte 503.",
      },
      {
        shot: 2,
        timecode: '0:30 – 1:10',
        visual:
          "4 conteneurs standardisés bleus et verts (Docker) s'empilent proprement sur un même pont (Noyau partagé), face à 4 lourdes machines virtuelles complètes (VM).",
        voiceover:
          "Avec Docker, chaque microservice voyage dans son propre conteneur léger et hermétique : démarrage en une seconde et zéro conflit de dépendances.",
        animationNote: "Comparateur animé RAM (64 Mo vs 2048 Mo) et temps de démarrage.",
      },
      {
        shot: 3,
        timecode: '1:10 – 1:45',
        visual:
          "Le conteneur Météo fume et redémarre en 1 seconde tandis que 3 réplicas du conteneur Billetterie tournent à plein régime pour la foule.",
        voiceover:
          "En cas d'incident, seul le conteneur touché redémarre. Et lors d'un pic touristique, on multiplie uniquement le service qui en a besoin !",
        animationNote: "Duplication fluide du conteneur Billetterie ×3.",
      },
    ],
  },
  {
    islandId: 10,
    title: 'Île 10 — Ne jamais faire confiance, toujours vérifier',
    duration: '1 min 45',
    targetConcept: 'Phishing, Wi-Fi Evil Twin, MFA et architecture Zero Trust',
    h5pPauseQuestion: {
      atTimecode: '1:05',
      question: 'Un site frauduleux affiche un cadenas HTTPS. Est-il forcément digne de confiance ?',
      answer: 'Non ! HTTPS chiffre le tuyau, mais un pirate peut obtenir un certificat pour un faux domaine. Il faut toujours vérifier le vrai nom de domaine.',
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:35',
        visual:
          "Un message urgent suspect « cyber-land-securite.xyz » arrive en boîte de réception. Une loupe passe sur l'adresse et révèle immédiatement l'extension piège.",
        voiceover:
          "La plupart des cyberattaques visent d'abord les humains ! Le phishing joue sur la peur ou l'urgence et maquille les noms de domaine.",
        animationNote: "Loupe interactive mettant en rouge le domaine usurpé.",
      },
      {
        shot: 2,
        timecode: '0:35 – 1:10',
        visual:
          "Un pirate crée une borne « Free_Wifi_Cyberland » sans cadenas. L'explorateur refuse, active son VPN et protège son compte par une clé MFA.",
        voiceover:
          "Méfiez-vous des Wi-Fi gratuits ouverts (Evil Twin) et activez toujours la double authentification MFA : un mot de passe volé ne suffit plus.",
        animationNote: "Bouclier à 2 clés (Mot de passe + Clé MFA) stoppant l'intrusion.",
      },
      {
        shot: 3,
        timecode: '1:10 – 1:45',
        visual:
          "À l'entrée de chaque salle de la Forteresse, un badge est vérifié individuellement selon le rôle exact du visiteur (Zero Trust).",
        voiceover:
          "C'est la philosophie Zero Trust : ne jamais faire confiance par défaut, toujours vérifier l'identité et n'accorder que le strict nécessaire.",
        animationNote: "Contrôle d'accès granulaire par badge rôle.",
      },
    ],
  },
  {
    islandId: 11,
    title: 'Île 11 — Le coffre, la boîte aux lettres et l’empreinte magique',
    duration: '1 min 45',
    targetConcept: 'Chiffrement symétrique AES, asymétrique, hachage salé et certificats TLS',
    h5pPauseQuestion: {
      atTimecode: '1:00',
      question: 'Pourquoi les sites web stockent-ils un hachage salé de votre mot de passe plutôt que le mot de passe chiffré ?',
      answer: 'Parce que le hachage est irréversible : même si la base de données est volée, personne ne peut retrouver le mot de passe d’origine.',
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:35',
        visual:
          "Au phare de Cyberland, un coffre se verrouille avec une clé symétrique dorée (AES), puis une lettre est déposée dans une boîte aux lettres publique dont seul le destinataire détient la clé privée.",
        voiceover:
          "Le chiffrement symétrique est ultra-rapide avec une seule clé, tandis que l'asymétrique sépare la clé publique pour verrouiller et la clé privée pour ouvrir !",
        animationNote: "Split-screen comparant clé unique AES et duo Clé Publique / Clé Privée.",
      },
      {
        shot: 2,
        timecode: '0:35 – 1:10',
        visual:
          "Un parchemin « Cyberland » passe dans un prisme lumineux et ressort en empreinte hexadécimale fixe. Changer une seule lettre bouleverse tout le code.",
        voiceover:
          "Le hachage, lui, est à sens unique : impossible de revenir en arrière ! Avec un sel aléatoire, c'est le bouclier idéal pour protéger les mots de passe.",
        animationNote: "Animation effet avalanche sur empreinte SHA-256.",
      },
      {
        shot: 3,
        timecode: '1:10 – 1:45',
        visual:
          "Un sceau de cire lumineux (Certificat TLS) valide l'identité du phare puis ouvre un tunnel HTTPS chiffré à grande vitesse.",
        voiceover:
          "Enfin, la signature numérique et le certificat TLS prouvent à qui vous parlez avant de lancer le chiffrement rapide de toute la session !",
        animationNote: "Poignée de main TLS suivie du flux chiffré AES.",
      },
    ],
  },
  {
    islandId: 12,
    title: 'Île 12 — De la ligne de code à la mise en ligne sans coupure',
    duration: '1 min 45',
    targetConcept: 'Pipeline CI/CD, tests automatisés, Blue/Green, Canary et Rollback',
    h5pPauseQuestion: {
      atTimecode: '1:05',
      question: 'Quel est l’intérêt d’un déploiement Canary (10 %) par rapport à une bascule directe à 100 % ?',
      answer: 'Détecter un bug réel sur une petite fraction du trafic et revenir en arrière en un clic sans impacter tous les utilisateurs.',
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:35',
        visual:
          "Dans l'usine DevOps, un développeur pousse un commit Git sur un tapis roulant automatisé : tests unitaires, scan sécurité et emballage Docker s'enchaînent.",
        voiceover:
          "Avec l'Intégration Continue (CI), chaque modification passe automatiquement au banc d'essai : si un test échoue, la chaîne s'arrête avant la mise en ligne !",
        animationNote: "Tapis roulant CI avec voyants verts/rouges par étape.",
      },
      {
        shot: 2,
        timecode: '0:35 – 1:10',
        visual:
          "Deux quais lumineux apparaissent : Blue (v2.1 en service) et Green (v2.2 prête). Le répartiteur dévie d'abord 10 % des bateaux en test Canary.",
        voiceover:
          "Côté Déploiement Continu, Blue/Green prépare la nouvelle version en parallèle, et le mode Canary la teste sur 10 % des visiteurs sans aucune coupure.",
        animationNote: "Curseur de trafic 90 % Blue / 10 % Green animé.",
      },
      {
        shot: 3,
        timecode: '1:10 – 1:45',
        visual:
          "Une alerte rouge clignote sur Green : un clic sur la commande « Rollback » ramène 100 % des visiteurs en 1 seconde sur Blue !",
        voiceover:
          "Et si un bug survient malgré tout ? Un clic sur Rollback ramène instantanément tout l'archipel sur la version saine précédente !",
        animationNote: "Bascule instantanée vers Blue avec rétablissement à 0 % d'erreur.",
      },
    ],
  },
  {
    islandId: 13,
    title: 'Île 13 — Wireshark & tcpdump : sous le microscope du réseau',
    duration: '2 min 15',
    targetConcept: 'Mode promiscuité, libpcap, tcpdump (BPF), fichier .pcap et dissection Wireshark 3 volets',
    h5pPauseQuestion: {
      atTimecode: '1:20',
      question: 'Quelle différence essentielle sépare un filtre BPF (tcpdump) d’un filtre d’affichage Wireshark ?',
      answer: 'Le filtre BPF décide quels paquets sont capturés (les autres sont ignorés), tandis que le filtre d’affichage Wireshark masque temporairement des paquets déjà enregistrés sans rien supprimer.',
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:40',
        visual:
          "Dans l'observatoire de Cyberland, un prisme optique copie les impulsions lumineuses de la carte eth0 (mode promiscuité + libpcap) sans ralentir les navires.",
        voiceover:
          "Pour analyser un réseau sans le couper, Wireshark et tcpdump activent le mode promiscuité : le pilote libpcap copie chaque trame au passage dans un tampon mémoire.",
        animationNote: "Flux continu de trames dupliquées sans latence vers le tampon.",
      },
      {
        shot: 2,
        timecode: '0:40 – 1:25',
        visual:
          "Sur un serveur Linux sans écran, la commande « tcpdump -i eth0 -nn port 443 -w audit.pcap » filtre au niveau du noyau (BPF) puis transfère audit.pcap vers Wireshark.",
        voiceover:
          "Sur serveur en ligne de commande, tcpdump filtre au plus près du noyau avec BPF et enregistre un fichier .pcap léger prêt à être inspecté visuellement.",
        animationNote: "Entonnoir BPF + transfert animé du fichier .pcap vers l'interface 3 volets.",
      },
      {
        shot: 3,
        timecode: '1:25 – 2:15',
        visual:
          "Les 3 volets de Wireshark s'illuminent tour à tour (Liste → Couches L2/L3/L4/L7 → Octets Hex/ASCII), puis « Follow TCP Stream » compare HTTP en clair et TLS 1.3 chiffré.",
        voiceover:
          "Dans Wireshark, un clic sur un paquet déplie chaque couche OSI jusqu'aux octets bruts — et prouve immédiatement pourquoi HTTPS est vital face au HTTP en clair !",
        animationNote: "Surlignage synchronisé des couches et des octets hexadécimaux.",
      },
    ],
  },
  {
    islandId: 14,
    title: 'Île 14 — Windows & Azure Monitor : de la collecte à l’auto-réparation',
    duration: '2 min 15',
    targetConcept: 'Agent AMA & DCR Windows, Metrics vs Log Analytics (KQL), Application Insights & Action Groups',
    h5pPauseQuestion: {
      atTimecode: '1:15',
      question: 'Quand choisir Azure Monitor Metrics plutôt que Log Analytics Workspace ?',
      answer: 'Metrics convient aux valeurs numériques rapides (CPU %, alertes Autoscale en temps réel), tandis que Log Analytics stocke les journaux riches (Windows EventID) à interroger en KQL.',
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:45',
        visual:
          "Des faisceaux dorés partent de serveurs Windows Server (Event Logs, PerfCounters) et d'applications Azure via l'agent AMA et les règles DCR vers la Tour de Contrôle.",
        voiceover:
          "Azure Monitor rassemble toute la télémétrie de vos serveurs Windows et ressources Cloud grâce à l'agent AMA piloté par des Data Collection Rules.",
        animationNote: "Arcs lumineux animés convergents vers les deux moteurs Metrics et Logs.",
      },
      {
        shot: 2,
        timecode: '0:45 – 1:35',
        visual:
          "Les données se séparent : à gauche une courbe CPU temps réel (Metrics), à droite une requête KQL qui filtre les EventID 4625 Windows dans Log Analytics, plus la carte Application Insights.",
        voiceover:
          "Les métriques pilotent les courbes rapides, Log Analytics permet des enquêtes KQL chirurgicales sur les événements Windows, et Application Insights localise les requêtes SQL lentes.",
        animationNote: "Animation du pipe KQL (Event | where | summarize) et trace APM.",
      },
      {
        shot: 3,
        timecode: '1:35 – 2:15',
        visual:
          "La courbe CPU franchit 85 % : une alerte Sev 1 déclenche l'Action Group qui notifie Teams et ajoute aussitôt 2 VM Windows en Autoscale.",
        voiceover:
          "Dès qu'un seuil est franchi, les Action Groups alertent l'équipe et déclenchent l'auto-réparation avant même que les utilisateurs ne remarquent un ralentissement !",
        animationNote: "Déclenchement d'alerte et lancement visuel de 2 instances de renfort.",
      },
    ],
  },
  {
    islandId: 15,
    title: 'Île 15 — Kerberos, OU/GPO & Défense Active Directory',
    duration: '2 min 10',
    targetConcept: 'Tickets Kerberos (TGT/TGS), arborescence Forêt/OU/GPO, Kerberoasting & Tiering',
    h5pPauseQuestion: {
      atTimecode: '1:05',
      question: 'Pourquoi Kerberos utilise-t-il un TGT puis un TGS au lieu d’envoyer le mot de passe au serveur de fichiers ?',
      answer: 'Pour éviter que le mot de passe ne circule ou ne soit stocké sur chaque serveur : seul le KDC vérifie l’identité et délivre des billets temporaires chiffrés.',
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:45',
        visual:
          "Un explorateur arrive aux portes dorées de la Citadelle AD : le gardien KDC lui remet un bracelet lumineux (TGT) puis un billet ciblé (TGS) pour ouvrir la salle des coffres SRV-FILES.",
        voiceover:
          "Dans Active Directory, Kerberos remplace l'envoi répété du mot de passe par des billets temporaires chiffrés : un TGT général puis un TGS dédié à chaque ressource.",
        animationNote: "Parcours animé des 3 échanges AS-REQ → TGT → TGS → Service.",
      },
      {
        shot: 2,
        timecode: '0:45 – 1:30',
        visual:
          "Vue en arbre de la Forêt et du Domaine : des parchemins GPO descendent précisément sur l'OU Comptabilite sans toucher l'OU Serveurs.",
        voiceover:
          "Les Unités d'Organisation (OU) classent utilisateurs et postes afin d'appliquer des règles de sécurité GPO chirurgicales à grande échelle.",
        animationNote: "Arborescence hiérarchique animée avec héritage visuel des GPO.",
      },
      {
        shot: 3,
        timecode: '1:30 – 2:10',
        visual:
          "Un intrus tente un Kerberoasting (EventID 4769) et un Pass-the-Hash : les barrières Tier 0 / Tier 1 / Tier 2 et les comptes gMSA bloquent son avancée.",
        voiceover:
          "Pour défendre la Citadelle, on surveille l'EventID 4769, on migre les services vers gMSA + AES et on cloisonne les administrateurs grâce au modèle en Tiers.",
        animationNote: "Affichage des 3 étages de cloisonnement Tier 0, Tier 1 et Tier 2.",
      },
    ],
  },
  {
    islandId: 16,
    title: 'Île 16 — Au cœur du SOC : du journal brut au Playbook SOAR',
    duration: '2 min 15',
    targetConcept: 'Corrélation SIEM, triage des faux positifs, MITRE ATT&CK et automatisation SOAR',
    h5pPauseQuestion: {
      atTimecode: '1:10',
      question: 'Comment un analyste SOC évite-t-il de couper à tort un serveur lors d’une alerte de transfert massif nocturne ?',
      answer: 'En vérifiant le contexte (calendrier des sauvegardes, processus signé, destination légitime) pour distinguer un faux positif d’une vraie exfiltration.',
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:45',
        visual:
          "Des faisceaux venant des phares Pare-feu, Windows AD, DNS et Azure Monitor convergent dans la coupole de verre du SIEM qui relie 3 signaux faibles en une alerte rouge.",
        voiceover:
          "Le SIEM rassemble tous les journaux de l'archipel : en corrélant plusieurs indices isolés, il révèle une attaque coordonnée en temps réel.",
        animationNote: "Faisceaux convergents animés et fusion en un ticket incident corrélé.",
      },
      {
        shot: 2,
        timecode: '0:45 – 1:35',
        visual:
          "L'analyste SOC trie la file : une sauvegarde légitime est classée Faux Positif, tandis qu'un scan SMB est relié à la colonne « Mouvement Latéral » de MITRE ATT&CK.",
        voiceover:
          "Au niveau 1, le triage élimine le bruit des faux positifs et cartographie les vraies intrusions sur la matrice MITRE ATT&CK.",
        animationNote: "Animation de tri à deux voies et surlignage de la chaîne MITRE ATT&CK.",
      },
      {
        shot: 3,
        timecode: '1:35 – 2:15',
        visual:
          "En un déclenchement SOAR, 3 chaînes automatiques s'exécutent en parallèle : isolation EDR du poste, blocage IP C2 au pare-feu et révocation des sessions.",
        voiceover:
          "Enfin, les playbooks SOAR contiennent l'incident en quelques secondes, protégeant tout l'archipel avant qu'un ransomware ne se propage.",
        animationNote: "Chronomètre MTTR affiché sous 10 secondes avec 3 voyants verts.",
      },
    ],
  },
  {
    islandId: 17,
    title: 'Île 17 — Kubernetes en animation : Pods, Services, Ingress & Auto-guérison',
    duration: '2 min 15',
    targetConcept: 'Orchestration Kubernetes, ReplicaSet, ClusterIP, Ingress TLS et NetworkPolicy',
    h5pPauseQuestion: {
      atTimecode: '1:12',
      question: 'Pourquoi les microservices communiquent-ils via un Service ClusterIP plutôt qu’en utilisant directement l’IP d’un Pod ?',
      answer: 'Parce qu’un Pod peut être détruit et recréé avec une nouvelle IP à tout moment, alors que le Service ClusterIP conserve un nom DNS et une IP stables.',
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:45',
        visual:
          "Dans le port maritime Kubernetes, 3 Pods identiques tournent sur 2 navires-nœuds. Un Pod tombe en panne : la tour de contrôle (Control Plane) en lance instantanément un remplaçant.",
        voiceover:
          "Kubernetes orchestre vos conteneurs à grande échelle : si un Pod tombe, le ReplicaSet en recrée un nouveau automatiquement pour maintenir vos 3 réplicas.",
        animationNote: "Animation de bascule et création automatique d'un Pod vert.",
      },
      {
        shot: 2,
        timecode: '0:45 – 1:35',
        visual:
          "Les requêtes HTTPS arrivent sur l'Ingress (cadenas TLS) qui trie /shop et /api vers des Services ClusterIP stables, équilibrant la charge vers les Pods.",
        voiceover:
          "L'Ingress accueille le trafic HTTPS externe et le confie aux Services ClusterIP qui masquent les adresses IP changeantes des Pods.",
        animationNote: "Flux de paquets animé Ingress → ClusterIP → 3 Pods.",
      },
      {
        shot: 3,
        timecode: '1:35 – 2:15',
        visual:
          "Une barrière lumineuse NetworkPolicy laisse passer le Backend vers PostgreSQL (5432) mais bloque net une tentative directe depuis le Frontend.",
        voiceover:
          "Enfin, les NetworkPolicies cloisonnent le réseau interne du cluster : chaque Pod ne parle qu'aux services strictement autorisés.",
        animationNote: "Paquet autorisé vert vs paquet bloqué rouge sur la frontière NetworkPolicy.",
      },
    ],
  },
  {
    islandId: 18,
    title: 'Île 18 — Encapsulation VPN, WireGuard, IPSec & Table NAT en animation',
    duration: '2 min 10',
    targetConcept: 'Encapsulation tunnel VPN, WireGuard vs IPSec, Split-Tunneling, NAT/PAT et pare-feu Stateful',
    h5pPauseQuestion: {
      atTimecode: '1:08',
      question: 'Comment un routeur NAT/PAT sait-il à quel PC du réseau local renvoyer une réponse venue d’Internet ?',
      answer: 'Grâce à sa table de traduction qui associe un numéro de port source éphémère unique à chaque adresse IP privée interne.',
    },
    shots: [
      {
        shot: 1,
        timecode: '0:00 – 0:45',
        visual:
          "Un paquet privé 10.0.2.15 entre dans le tunnel de verre sous-marin WireGuard : il est aussitôt chiffré et enveloppé dans un paquet UDP 51820 illisible pour les navires pirates en surface.",
        voiceover:
          "Un VPN protège vos échanges sur un réseau public en chiffrant le paquet privé d'origine à l'intérieur d'une nouvelle enveloppe réseau.",
        animationNote: "Double encapsulation animée (paquet interne scellé dans enveloppe externe).",
      },
      {
        shot: 2,
        timecode: '0:45 – 1:30',
        visual:
          "Deux routes se séparent en Split-Tunneling : le flux ERP 10.0.2.x emprunte le tunnel WireGuard, tandis que la visioconférence sort directement sans saturer le siège.",
        voiceover:
          "En Split-Tunneling, seul le trafic privé traverse le VPN, évitant de saturer la passerelle d'entreprise avec les visioconférences.",
        animationNote: "Aiguillage animé comparant Full-Tunnel saturé et Split-Tunnel fluide.",
      },
      {
        shot: 3,
        timecode: '1:30 – 2:10',
        visual:
          "Au routeur de bordure, deux PC privés (.10 et .25) sortent via une seule IP publique avec les ports :51001 et :51002 dans la table NAT/PAT, contrôlée par un pare-feu Stateful.",
        voiceover:
          "Et pour partager une seule IP publique entre des dizaines d'appareils, la table NAT/PAT associe un port unique à chaque session, sécurisée par le filtrage Stateful.",
        animationNote: "Mise à jour animée des lignes de la table NAT/PAT aller et retour.",
      },
    ],
  },
];

export const PRODUCTION_TOOLS = [
  {
    category: 'Animations vectorielles interactives',
    tools: 'LottieFiles & Rive',
    usage:
      'Idéal pour intégrer les paquets numérotés ou des schémas contrôlés au clic directement dans votre LMS ou site web sans alourdir la page.',
  },
  {
    category: 'Vidéos explicatives (Motion Design)',
    tools: 'Canva, Vyond, Powtoon ou Animaker',
    usage:
      'Adapté aux capsules pédagogiques de 1 min 30 à 2 min en style « archipel illustré » avec voix-off synchronisée et schémas animés.',
  },
  {
    category: 'Vidéo interactive & Quiz intégrés',
    tools: 'H5P (Moodle / WordPress)',
    usage:
      'Permet de mettre automatiquement la vidéo en pause aux timecodes clés (ex. 0:52) pour déclencher une question de compréhension avant de continuer.',
  },
];

export const AUDIENCE_QUIZZES: Record<AudienceLevel, QuizQuestion[]> = {
  collegiens: [
    {
      id: 'col-1',
      islandRef: 'Île 1 · Signaux',
      question: "Pourquoi un film envoyé sur Internet est-il découpé en milliers de petits paquets ?",
      options: [
        "Pour circuler plus vite sur le réseau et contourner les bouchons sans tout bloquer",
        "Parce que les câbles ne peuvent transporter que des fichiers audio",
        "Pour effacer automatiquement le film après lecture",
        "Uniquement pour économiser la batterie de l'écran",
      ],
      correctIndex: 0,
      explanation:
        "Découper un gros fichier en petits paquets numérotés permet de partager les lignes entre tous les utilisateurs et d'emprunter plusieurs chemins avant réassemblage.",
    },
    {
      id: 'col-2',
      islandRef: 'Île 2 · Port des Adresses',
      question: "À quoi ressemble le rôle du serveur DNS sur Cyberland ?",
      options: [
        "Un antivirus qui nettoie l'écran",
        "Un annuaire magique qui traduit un nom de site en adresse IP chiffrée",
        "Un câble sous-marin reliant deux continents",
        "Une batterie de secours pour les ordinateurs",
      ],
      correctIndex: 1,
      explanation:
        "Le DNS (Domain Name System) convertit un nom facile à retenir (comme ile-des-palmiers.gem) en adresse IP numérique (192.168.1.42).",
    },
    {
      id: 'col-3',
      islandRef: 'Île 3 · Forteresse',
      question: "Que garantit le petit cadenas HTTPS (port 443) dans la barre d'adresse ?",
      options: [
        "Que le site est gratuit",
        "Que les messages échangés sont chiffrés et illisibles pour un pirate sur le réseau",
        "Que l'ordinateur ne peut plus tomber en panne de Wi-Fi",
        "Que la vidéo se chargera en UDP",
      ],
      correctIndex: 1,
      explanation:
        "HTTPS chiffre les échanges entre votre navigateur et le serveur afin d'empêcher l'espionnage ou la modification des données en transit.",
    },
    {
      id: 'col-4',
      islandRef: 'Île 4 · Nuages',
      question: "Dans la métaphore de la Pizzeria, aller au restaurant et manger directement correspond à :",
      options: ['On-Premise (tout faire chez soi)', 'IaaS', 'PaaS', 'SaaS (logiciel prêt à l’emploi)'],
      correctIndex: 3,
      explanation:
        "En SaaS (Software as a Service), vous utilisez directement le service prêt à l'emploi (messagerie, documents en ligne) sans gérer ni serveur ni installation.",
    },
    {
      id: 'col-5',
      islandRef: 'Île 5 · Sommet Céleste',
      question: "Une tempête coupe l'électricité de la Zone A. Quel outil redirige aussitôt les visiteurs vers la Zone B ?",
      options: ['Un câble Ethernet plus long', 'Un répartiteur de charge (Load Balancer)', 'Un navigateur web', 'Un mot de passe'],
      correctIndex: 1,
      explanation:
        "Le Load Balancer surveille la santé des serveurs et bascule automatiquement le trafic vers la zone opérationnelle.",
    },
    {
      id: 'col-6',
      islandRef: 'Île 7 · Types de réseaux',
      question: "Vous connectez des écouteurs sans fil en Bluetooth à votre téléphone à 1 mètre de distance. Quel type de réseau utilisez-vous ?",
      options: ['PAN (Réseau personnel)', 'MAN (Réseau de ville)', 'WAN (Réseau mondial)', 'Serveur DNS'],
      correctIndex: 0,
      explanation:
        "Le PAN (Personal Area Network) relie vos appareils personnels à très courte portée (1 à 10 mètres) via Bluetooth, NFC ou USB.",
    },
    {
      id: 'col-7',
      islandRef: 'Île 8 · Modèle OSI',
      question: "Dans le modèle OSI, combien de couches organisent le voyage des données du câble jusqu'à l'application ?",
      options: ['3 couches', '5 couches', '7 couches', '12 couches'],
      correctIndex: 2,
      explanation:
        'Le modèle OSI comporte 7 couches standardisées : Physique (1), Liaison (2), Réseau (3), Transport (4), Session (5), Présentation (6) et Application (7).',
    },
    {
      id: 'col-8',
      islandRef: 'Île 10 · Phishing & MFA',
      question: "Vous recevez un e-mail urgent de « support@cyber-land-cadeau.xyz » réclamant votre mot de passe. Que faites-vous ?",
      options: [
        'Vous répondez tout de suite pour ne pas perdre votre compte',
        'Vous vérifiez le domaine suspect, vous ne cliquez pas et vous signalez la tentative de phishing',
        'Vous partagez le lien à toute la classe',
        'Vous désactivez votre antivirus',
      ],
      correctIndex: 1,
      explanation:
        "L'urgence artificielle et le domaine inconnu (.xyz) sont des indices typiques d'hameçonnage (phishing). Aucun service légitime ne demande votre mot de passe par e-mail.",
    },
    {
      id: 'col-9',
      islandRef: 'Île 11 · Cryptographie',
      question: "Pourquoi un site web transforme-t-il votre mot de passe en empreinte irréversible (hachage) dans sa base de données ?",
      options: [
        'Pour pouvoir vous le renvoyer par courrier postal',
        'Pour vérifier votre connexion sans jamais conserver votre vrai mot de passe en clair en cas de vol',
        'Pour réduire la taille de l’écran du navigateur',
        'Pour accélérer le Wi-Fi de la maison',
      ],
      correctIndex: 1,
      explanation:
        "Le hachage (avec sel) crée une empreinte unique à sens unique : le serveur compare l'empreinte à la connexion, mais un pirate qui vole la base ne peut pas retrouver le mot de passe d'origine.",
    },
    {
      id: 'col-10',
      islandRef: 'Île 12 · DevOps & CI/CD',
      question: "À quoi sert un bouton de « Rollback » après la mise en ligne d'une nouvelle version d'un site ?",
      options: [
        'À supprimer définitivement tous les comptes utilisateurs',
        'À revenir instantanément à la version précédente qui fonctionnait si un bug apparaît',
        'À débrancher le câble fibre optique',
        'À changer le nom de domaine du site',
      ],
      correctIndex: 1,
      explanation:
        "Le Rollback permet de basculer le trafic en quelques secondes vers l'ancienne version saine dès qu'une anomalie est détectée en production.",
    },
    {
      id: 'col-11',
      islandRef: 'Île 13 · Wireshark & tcpdump',
      question: "À quoi sert un outil comme Wireshark ou tcpdump pour un ingénieur réseau ?",
      options: [
        'À dessiner le logo du site web',
        'À capturer et observer les paquets qui circulent sur le réseau pour comprendre ou résoudre une panne',
        'À accélérer la batterie du téléphone',
        'À supprimer les adresses IP d’Internet',
      ],
      correctIndex: 1,
      explanation:
        "Wireshark (interface graphique) et tcpdump (ligne de commande) agissent comme un microscope réseau : ils capturent et décodent chaque paquet pour diagnostiquer pannes et failles.",
    },
    {
      id: 'col-12',
      islandRef: 'Île 14 · Windows Azure Monitor',
      question: "Quel est le rôle principal de Windows / Microsoft Azure Monitor dans le Cloud ?",
      options: [
        'Surveiller la santé des serveurs Windows et des applications en temps réel et déclencher des alertes en cas de problème',
        'Remplacer le câble Ethernet par du Bluetooth',
        'Écrire des devoirs automatiquement',
        'Éteindre Internet la nuit',
      ],
      correctIndex: 0,
      explanation:
        "Azure Monitor collecte les métriques (CPU, mémoire) et journaux (Windows Event Logs) afin de visualiser la santé des systèmes et alerter ou réparer automatiquement.",
    },
    {
      id: 'col-13',
      islandRef: 'Île 15 · Active Directory',
      question: "Dans un réseau Windows d'entreprise (Active Directory), à quoi servent les billets Kerberos ?",
      options: [
        'À prouver votre identité aux serveurs sans envoyer votre mot de passe en clair sur tout le réseau',
        'À accélérer la luminosité de l’écran',
        'À imprimer des cartes postales',
        'À remplacer les câbles Ethernet',
      ],
      correctIndex: 0,
      explanation:
        'Kerberos fonctionne avec des billets temporaires chiffrés (TGT puis TGS) délivrés par le Contrôleur de Domaine, ce qui évite de faire circuler votre mot de passe.',
    },
    {
      id: 'col-14',
      islandRef: 'Île 16 · Centre SOC & SIEM',
      question: "Quel est le rôle d'un centre SOC (Security Operations Center) dans une entreprise ?",
      options: [
        'Dessiner les affiches publicitaires',
        'Surveiller en continu les alertes de sécurité, repérer les cyberattaques et réagir vite pour protéger le réseau',
        'Installer des jeux vidéo sur les serveurs',
        'Couper le Wi-Fi toutes les heures',
      ],
      correctIndex: 1,
      explanation:
        'Le SOC réunit analystes et outils (SIEM, SOAR) pour détecter les intrusions en temps réel, éliminer les faux positifs et contenir les menaces.',
    },
    {
      id: 'col-15',
      islandRef: 'Île 17 · Kubernetes',
      question: "Que fait Kubernetes automatiquement si l'un des 3 conteneurs (Pods) d'un site web tombe en panne ?",
      options: [
        'Il laisse le site coupé toute la semaine',
        'Il détecte la panne et recrée automatiquement un nouveau Pod sain pour garder 3 copies actives',
        'Il supprime toute la base de données',
        'Il change l’adresse postale du serveur',
      ],
      correctIndex: 1,
      explanation:
        'L’auto-guérison (Self-Healing) est une force clé de Kubernetes : le contrôleur maintient en permanence le nombre de réplicas demandé.',
    },
    {
      id: 'col-16',
      islandRef: 'Île 18 · VPN & NAT',
      question: "Comment la box Internet de votre maison permet-elle à 10 appareils (téléphones, PC, TV) d'aller sur Internet avec une seule adresse IP publique ?",
      options: [
        'Grâce à la traduction d’adresses NAT/PAT qui note un numéro de port différent pour chaque appareil',
        'Un seul appareil peut se connecter par jour',
        'Grâce au Bluetooth 100 km',
        'En désactivant tous les mots de passe',
      ],
      correctIndex: 0,
      explanation:
        'Le routeur utilise le NAT/PAT pour partager une seule IP publique en attribuant un numéro de port distinct à chaque connexion interne.',
    },
  ],
  etudiants: [
    {
      id: 'etu-1',
      islandRef: 'Île 1 & 2 · Routage',
      question: "Quelle différence fondamentale sépare une adresse MAC d'une adresse IP ?",
      options: [
        "L'adresse MAC est attribuée par le serveur DNS, l'IP par le constructeur",
        "L'adresse MAC identifie une interface sur le réseau local (couche 2), tandis que l'IP assure le routage entre réseaux (couche 3)",
        "L'adresse IP ne change jamais alors que la MAC change à chaque connexion Wi-Fi",
        "Elles sont strictement identiques en IPv4",
      ],
      correctIndex: 1,
      explanation:
        "Dans le modèle OSI, l'adresse MAC opère en couche Liaison (LAN) et l'adresse IP opère en couche Réseau pour permettre aux routeurs d'acheminer les paquets d'un sous-réseau à l'autre.",
    },
    {
      id: 'etu-2',
      islandRef: 'Île 3 · Transport',
      question: "Pourquoi un flux VoIP ou un jeu FPS en temps réel utilise-t-il UDP plutôt que TCP ?",
      options: [
        "UDP chiffre automatiquement les paquets contrairement à TCP",
        "UDP évite le délai de poignée de main et de retransmission des paquets perdus, réduisant la latence",
        "TCP ne fonctionne pas sur la fibre optique",
        "UDP garantit que 100 % des paquets arrivent dans l'ordre exact",
      ],
      correctIndex: 1,
      explanation:
        "La retransmission TCP introduit des blocages (head-of-line blocking). En temps réel, une donnée vieille de 200 ms est inutile : UDP privilégie une latence minimale.",
    },
    {
      id: 'etu-3',
      islandRef: 'Île 3 · Pare-feu',
      question: "Vous auditez les règles entrantes d'un serveur web public. Quelle règle est la plus saine ?",
      options: [
        "Autoriser tous les ports TCP/UDP (0-65535) pour éviter tout blocage",
        "Autoriser le port 23 (Telnet) à tout Internet pour administrer facilement",
        "Autoriser uniquement le port 443 (HTTPS) au public et bloquer tout le reste par défaut (principe du moindre privilège)",
        "Désactiver HTTPS pour accélérer le pare-feu",
      ],
      correctIndex: 2,
      explanation:
        "Une politique « Deny by default » n'expose que les ports strictement nécessaires (443 pour le web sécurisé) et bannit les protocoles en clair comme Telnet (23).",
    },
    {
      id: 'etu-4',
      islandRef: 'Île 4 · Modèles Cloud',
      question: "Votre équipe veut déployer une API Node.js sans gérer les mises à jour du noyau Linux ni le matériel. Quel modèle choisir ?",
      options: ['On-Premise', 'IaaS (VM nue)', 'PaaS (Plateforme managée)', 'Colocation en baie'],
      correctIndex: 2,
      explanation:
        "En PaaS, le fournisseur gère le matériel, la virtualisation et l'OS ; l'équipe se concentre sur son code applicatif et ses données.",
    },
    {
      id: 'etu-5',
      islandRef: 'Île 5 · Résilience',
      question: "Quelle architecture garantit la continuité de service si tout un centre de données subit une coupure électrique ?",
      options: [
        "Deux machines virtuelles hébergées sur le même serveur physique",
        "Un déploiement multi-zones de disponibilité (Multi-AZ) derrière un Load Balancer avec sauvegardes répliquées",
        "Augmenter la taille du disque dur d'un seul serveur",
        "Redémarrer le routeur local toutes les nuits",
      ],
      correctIndex: 1,
      explanation:
        "Les Zones de Disponibilité (AZ) ont des alimentations et réseaux indépendants. Répartir les instances sur au moins deux AZ élimine le point unique de défaillance (SPOF).",
    },
    {
      id: 'etu-6',
      islandRef: 'Île 7 · Types de réseaux',
      question: "Quelle distinction caractérise le mieux un MAN par rapport à un LAN et un WAN ?",
      options: [
        "Le MAN fonctionne uniquement en Bluetooth",
        "Le MAN interconnecte plusieurs réseaux locaux (LAN) à l'échelle d'une ville ou métropole (1 à 50 km), avant l'échelle continentale du WAN",
        "Le MAN remplace le protocole HTTPS",
        "Le MAN ne peut relier que 2 ordinateurs maximum",
      ],
      correctIndex: 1,
      explanation:
        "Un MAN (Metropolitan Area Network) couvre une zone urbaine (1 à 50 km) pour fédérer plusieurs LAN (campus, hôpitaux, sites municipaux) via fibre optique.",
    },
    {
      id: 'etu-7',
      islandRef: 'Île 8 · Encapsulation OSI',
      question: "Quel est l'ordre exact des unités de données lors de l'encapsulation descendante (de la couche 7 vers la couche 1) ?",
      options: [
        'Bits → Trame → Paquet → Segment → Données',
        'Données → Segment (L4) → Paquet (L3) → Trame (L2) → Bits (L1)',
        'Paquet → Données → Bits → Trame → Segment',
        'Trame → Segment → Données → Paquet → Bits',
      ],
      correctIndex: 1,
      explanation:
        "En descendant la pile OSI : les Données applicatives sont découpées en Segments (TCP/UDP, L4), encapsulées en Paquets (IP, L3), puis en Trames (MAC, L2) avant d'être transmises en Bits (L1).",
    },
    {
      id: 'etu-8',
      islandRef: 'Île 9 · Docker & Conteneurs',
      question: "Pourquoi un conteneur Docker est-il beaucoup plus léger et rapide à démarrer qu'une machine virtuelle (VM) ?",
      options: [
        'Parce qu’un conteneur n’utilise pas de mémoire RAM',
        'Parce qu’il partage le noyau (kernel) du système hôte au lieu d’émuler un OS invité complet',
        'Parce qu’il fonctionne uniquement sans réseau',
        'Parce qu’il remplace le protocole IP par Bluetooth',
      ],
      correctIndex: 1,
      explanation:
        "Contrairement à une VM qui embarque un OS complet au-dessus d'un hyperviseur, un conteneur isole un processus et ses bibliothèques directement sur le noyau de l'hôte.",
    },
    {
      id: 'etu-9',
      islandRef: 'Île 11 · Cryptographie & TLS',
      question: "Lors d'une connexion HTTPS (TLS), comment coopèrent le chiffrement asymétrique et le chiffrement symétrique (AES) ?",
      options: [
        'TLS n’utilise que le hachage SHA-256 pour chiffrer les pages web',
        'L’asymétrique authentifie le serveur et échange une clé de session secrète, puis AES chiffre rapidement le flux de données',
        'AES vérifie le certificat puis l’asymétrique transfère les vidéos 4K',
        'Les deux algorithmes servent uniquement à traduire le DNS',
      ],
      correctIndex: 1,
      explanation:
        "Le chiffrement asymétrique est sûr pour l'échange initial mais coûteux en calcul : TLS l'utilise pendant la poignée de main pour établir une clé symétrique AES ultra-rapide pour la suite.",
    },
    {
      id: 'etu-10',
      islandRef: 'Île 12 · Pipeline CI/CD',
      question: "Dans un pipeline CI/CD moderne, quelle stratégie consiste à envoyer d'abord 10 % du trafic sur la nouvelle version pour observer les métriques ?",
      options: [
        'Déploiement Canary (Canari)',
        'Topologie Bus',
        'Résolution DNS inverse',
        'Attaque par déni de service',
      ],
      correctIndex: 0,
      explanation:
        "Le déploiement Canary expose une nouvelle version à une faible proportion d'utilisateurs afin de valider les taux d'erreurs et de latence avant un passage progressif à 100 %.",
    },
    {
      id: 'etu-11',
      islandRef: 'Île 13 · Wireshark & tcpdump',
      question: "Pourquoi utilise-t-on souvent « tcpdump -i eth0 -nn port 443 -w trace.pcap » sur un serveur Linux avant d'ouvrir le fichier dans Wireshark ?",
      options: [
        'Parce que Wireshark ne sait pas lire les paquets TCP',
        'Pour capturer légèrement en ligne de commande (filtre noyau BPF + pas de résolution DNS) puis analyser visuellement la trace dans Wireshark',
        'Parce que -w supprime tous les paquets HTTPS',
        'Pour chiffrer le disque dur du serveur',
      ],
      correctIndex: 1,
      explanation:
        "Les serveurs Linux n'ont pas d'interface graphique : tcpdump réalise une capture légère filtrée par BPF (-nn évite les requêtes DNS) et génère un fichier .pcap standard pour Wireshark.",
    },
    {
      id: 'etu-12',
      islandRef: 'Île 14 · Windows Azure Monitor',
      question: "Dans Azure Monitor, quelle est la différence entre Metrics et Log Analytics Workspace (KQL) ?",
      options: [
        'Metrics stocke des séries numériques temps réel légères (CPU, latence), tandis que Log Analytics stocke des journaux structurés (Windows Event Logs) interrogeables en KQL',
        'Log Analytics ne fonctionne jamais sur Windows Server',
        'Metrics sert uniquement à stocker des vidéos',
        'Ils sont strictement identiques et utilisent tous deux HTML',
      ],
      correctIndex: 0,
      explanation:
        "Metrics est optimisé pour les graphiques et alertes numériques rapides ; Log Analytics conserve les journaux détaillés permettant des analyses corrélées avec le langage KQL.",
    },
    {
      id: 'etu-13',
      islandRef: 'Île 15 · Active Directory & Kerberos',
      question: "Dans Active Directory, quelle différence sépare un TGT d'un TGS dans le protocole Kerberos ?",
      options: [
        'Le TGT (Ticket Granting Ticket) prouve votre authentification initiale auprès du KDC ; le TGS donne accès à un service précis (ex. serveur de fichiers)',
        'Le TGS sert uniquement à attribuer des adresses IP',
        'Le TGT est envoyé en clair en HTTP sur port 80',
        'Ils remplacent tous deux le serveur DNS',
      ],
      correctIndex: 0,
      explanation:
        'Lors de l’ouverture de session, le KDC remet un TGT ; ensuite, à chaque besoin d’accès à un service, le client présente son TGT pour recevoir un TGS ciblé.',
    },
    {
      id: 'etu-14',
      islandRef: 'Île 16 · SOC, SIEM & MITRE ATT&CK',
      question: "Un poste interne compromis scanne les ports SMB (445) de 15 serveurs voisins avec un compte volé. Quelle tactique MITRE ATT&CK cela illustre-t-il ?",
      options: [
        'Mouvement Latéral (Lateral Movement)',
        'Traduction NAT statique',
        'Optimisation FinOps',
        'Encapsulation Couche 1',
      ],
      correctIndex: 0,
      explanation:
        'Se propager d’une machine compromise vers d’autres systèmes internes via SMB, RDP ou WinRM correspond à la tactique de Mouvement Latéral.',
    },
    {
      id: 'etu-15',
      islandRef: 'Île 17 · Kubernetes & Réseau',
      question: "Dans Kubernetes, pourquoi placer un objet Service (ClusterIP) devant un Deployment de 3 Pods Backend ?",
      options: [
        'Pour offrir une IP virtuelle et un nom DNS internes stables malgré le renouvellement constant des IP de Pods, tout en répartissant la charge',
        'Pour supprimer complètement les certificats TLS',
        'Parce qu’un Pod ne peut jamais exécuter de conteneur Docker',
        'Pour exposer la base de données sur le port 23',
      ],
      correctIndex: 0,
      explanation:
        'Les Pods sont éphémères et changent d’IP lorsqu’ils sont recréés ; le Service ClusterIP fournit un point d’accès interne stable et équilibré via des labels.',
    },
    {
      id: 'etu-16',
      islandRef: 'Île 18 · VPN WireGuard & Pare-feu Stateful',
      question: "Quel avantage concret procure le filtrage Stateful sur un pare-feu par rapport à une liste Stateless basique ?",
      options: [
        'Il suit l’état des sessions actives (State Table) et autorise automatiquement les paquets retour légitimes sans ouvrir de ports entrants au public',
        'Il désactive la table NAT sur tous les routeurs',
        'Il chiffre automatiquement les câbles fibre optique en Bluetooth',
        'Il remplace le serveur Active Directory',
      ],
      correctIndex: 0,
      explanation:
        'Un pare-feu Stateful mémorise les connexions sortantes établies et laisse revenir leurs réponses, tout en bloquant toute tentative entrante non sollicitée.',
    },
  ],
  reconversion: [
    {
      id: 'rec-1',
      islandRef: 'Île 1 & 2 · Diagnostic',
      question: "Un collaborateur n'accède plus à intranet.gem par son nom, mais le ping vers 10.0.4.12 répond. Quel composant soupçonner en priorité ?",
      options: ['Le câble Ethernet de son poste', 'La résolution DNS', 'Son écran', 'La sauvegarde Cloud'],
      correctIndex: 1,
      explanation:
        "Si l'IP répond mais pas le nom de domaine, la connectivité réseau fonctionne : le dysfonctionnement se situe au niveau du serveur ou du cache DNS.",
    },
    {
      id: 'rec-2',
      islandRef: 'Île 3 · Sécurité SI',
      question: "Lors d'une migration, un prestataire demande d'ouvrir le port 23 (Telnet) depuis Internet. Quelle est la bonne réaction professionnelle ?",
      options: [
        "Accepter temporairement sans suivi",
        "Refuser car Telnet circule en clair ; proposer SSH (port 22) via VPN ou bastion restreint par IP",
        "Ouvrir le port 80 à la place pour l'administration",
        "Couper le pare-feu pendant la migration",
      ],
      correctIndex: 1,
      explanation:
        "Telnet transmet identifiants et commandes sans chiffrement. On le remplace par SSH chiffré, idéalement restreint à un VPN ou un bastion d'administration.",
    },
    {
      id: 'rec-3',
      islandRef: 'Île 4 · FinOps & Scalabilité',
      question: "Une boutique en ligne connaît un pic de trafic x8 lors des soldes, puis un trafic très faible la nuit. Quel levier Cloud optimise coûts et performance ?",
      options: [
        "Acheter définitivement 8 serveurs physiques sur site",
        "Configurer des règles d'Auto-Scaling (scale-out au pic, scale-in la nuit)",
        "Limiter le nombre de clients autorisés sur le site",
        "Passer la base de données en UDP",
      ],
      correctIndex: 1,
      explanation:
        "L'Auto-Scaling aligne en continu les ressources facturées sur la charge réelle (modèle OPEX à l'usage), évitant le surdimensionnement permanent.",
    },
    {
      id: 'rec-4',
      islandRef: 'Île 4 · Choix stratégique',
      question: "Une PME souhaite équiper 40 salariés d'une suite bureautique collaborative sans équipe d'administration système. Quel modèle adopter ?",
      options: ['SaaS', 'IaaS', 'Serveur bare-metal sur site', 'Développement d’un OS interne'],
      correctIndex: 0,
      explanation:
        "Le SaaS fournit immédiatement la messagerie et les outils collaboratifs avec mises à jour, sécurité et disponibilité gérées par l'éditeur.",
    },
    {
      id: 'rec-5',
      islandRef: 'Île 5 · Plan de Reprise (PRA)',
      question: "Après un incident majeur sur la Zone A, vous devez restaurer la base de données. Que vérifier avant de choisir un Snapshot ?",
      options: [
        "Prendre toujours le plus ancien pour gagner de l'espace",
        "Vérifier l'horodatage (RPO) et le statut d'intégrité sain afin de ne pas réinjecter une corruption",
        "Supprimer d'abord toutes les sauvegardes précédentes",
        "Basculer le trafic avant que la Zone B ne soit prête",
      ],
      correctIndex: 1,
      explanation:
        "En gestion de crise (PRA), on sélectionne le cliché sain le plus récent antérieur à la panne, on valide la zone de secours, puis on redirige le trafic.",
    },
    {
      id: 'rec-6',
      islandRef: 'Île 7 · VPN & Accès distant',
      question: "Un salarié en déplacement doit accéder au serveur de fichiers privé de l'entreprise depuis le Wi-Fi public d'un hôtel. Quelle solution réseau déployer ?",
      options: [
        "Exposer le serveur de fichiers directement sans mot de passe sur Internet",
        "Utiliser un VPN (Virtual Private Network) créant un tunnel chiffré jusqu'au réseau interne",
        "Utiliser une connexion Bluetooth (PAN)",
        "Remplacer le Wi-Fi de l'hôtel par un câble Bus",
      ],
      correctIndex: 1,
      explanation:
        "Le VPN encapsule et chiffre les échanges dans un tunnel sécurisé au-dessus du réseau public (WAN) pour donner accès aux ressources privées du LAN d'entreprise.",
    },
    {
      id: 'rec-7',
      islandRef: 'Île 9 · Microservices',
      question: "Quel avantage métier majeur apporte le passage d'un monolithe à des microservices conteneurisés (Docker) ?",
      options: [
        'Supprimer complètement le besoin de sauvegardes',
        'Isoler les pannes, déployer plus souvent et ne dimensionner que les services réellement sollicités',
        'Rendre le chiffrement HTTPS inutile',
        'Garantir qu’aucun bug ne peut jamais exister dans le code',
      ],
      correctIndex: 1,
      explanation:
        "Les microservices limitent le rayon d'impact d'un incident (un bug isolé ne paralyse pas tout le SI) et permettent un scaling ciblé plus économique.",
    },
    {
      id: 'rec-8',
      islandRef: 'Île 10 · Zero Trust',
      question: "Quel principe résume le mieux une stratégie de sécurité Zero Trust en entreprise ?",
      options: [
        'Faire totalement confiance à tout appareil branché sur le Wi-Fi interne',
        'Ne jamais faire confiance par défaut : vérifier systématiquement identité (MFA), état de l’appareil et privilèges minimaux',
        'Partager un unique mot de passe administrateur entre tous les services',
        'Bloquer définitivement tous les accès Internet',
      ],
      correctIndex: 1,
      explanation:
        "Le Zero Trust abandonne la confiance implicite liée au périmètre interne : chaque accès à une ressource est authentifié, chiffré et limité au strict besoin métier.",
    },
    {
      id: 'rec-9',
      islandRef: 'Île 11 · Cryptographie & Conformité',
      question: "Quelle primitive cryptographique devez-vous exiger d'un prestataire pour prouver qu'une facture électronique n'a pas été modifiée et provient bien de son émetteur ?",
      options: [
        'Une simple compression ZIP',
        'Une signature numérique basée sur une paire clé privée / clé publique et un certificat',
        'Un câble Ethernet catégorie 6',
        'Un transfert FTP sur port 21',
      ],
      correctIndex: 1,
      explanation:
        "La signature numérique scelle l'empreinte du document avec la clé privée de l'émetteur : toute modification altère l'empreinte et la vérification par clé publique prouve l'authenticité.",
    },
    {
      id: 'rec-10',
      islandRef: 'Île 12 · DevOps & Continuité',
      question: "Pourquoi les équipes DevOps privilégient-elles un déploiement Blue/Green avec pipeline CI/CD plutôt qu'une mise à jour manuelle le dimanche soir ?",
      options: [
        'Pour supprimer tous les tests avant la mise en ligne',
        'Pour automatiser les tests, livrer sans coupure de service et garantir un retour arrière (Rollback) immédiat en cas d’incident',
        'Pour augmenter le nombre de pannes visibles par les clients',
        'Pour remplacer complètement le Cloud par des disques locaux',
      ],
      correctIndex: 1,
      explanation:
        "La CI/CD fiabilise chaque livraison par des tests automatiques et l'architecture Blue/Green élimine les maintenances nocturnes en permettant bascule et Rollback en quelques secondes.",
    },
    {
      id: 'rec-11',
      islandRef: 'Île 13 · Audit réseau Wireshark',
      question: "Lors d'un audit, vous lancez « Follow TCP Stream » dans Wireshark sur un échange vers un portail interne et vous lisez le mot de passe en clair. Que démontre cette observation ?",
      options: [
        'Que le réseau utilise bien HTTPS/TLS 1.3',
        'Que l’application transmet ses identifiants sans chiffrement (HTTP port 80) et doit basculer immédiatement vers HTTPS (TLS)',
        'Que le câble fibre optique est trop long',
        'Que tcpdump a piraté le certificat TLS',
      ],
      correctIndex: 1,
      explanation:
        "Wireshark ne casse pas TLS : si un mot de passe apparaît en clair dans le flux TCP, c'est que la communication n'est pas chiffrée (HTTP/Telnet) et expose les identifiants sur le réseau.",
    },
    {
      id: 'rec-12',
      islandRef: 'Île 14 · Windows Azure Monitor',
      question: "Pour superviser un parc hybride de serveurs Windows Server (sur site + Azure) et automatiser la réponse aux incidents, quelle combinaison Azure Monitor déployer ?",
      options: [
        'Agent AMA + Data Collection Rules (DCR) + Alertes liées à des Action Groups (Teams/SMS + Runbook/Autoscale)',
        'Désactiver les journaux Windows Security pour économiser de l’espace disque',
        'Installer un navigateur web sur chaque serveur et rafraîchir la page manuellement',
        'Ouvrir le port RDP 3389 à tout Internet',
      ],
      correctIndex: 0,
      explanation:
        "L'agent AMA (et Azure Arc pour les serveurs sur site) centralise métriques et journaux Windows selon des DCR, tandis que les Action Groups automatisent notification et remédiation.",
    },
    {
      id: 'rec-13',
      islandRef: 'Île 15 · Sécurité Active Directory',
      question: "Quelle bonne pratique bloque le vol d'empreintes Domain Admin (Pass-the-Hash) lors d'une compromission d'un PC bureautique ?",
      options: [
        'Appliquer le modèle en Tiers (interdire les connexions Domain Admin sur les postes utilisateurs) + Credential Guard et groupe Protected Users',
        'Partager un compte administrateur unique entre tous les salariés',
        'Désactiver Kerberos au profit de NTLMv1',
        'Supprimer toutes les GPO du domaine',
      ],
      correctIndex: 0,
      explanation:
        'Le cloisonnement en Tiers (Tier 0 / 1 / 2) garantit qu’un compte Domain Admin ne laisse jamais son hash en mémoire sur un poste bureautique exposé.',
    },
    {
      id: 'rec-14',
      islandRef: 'Île 16 · Pilotage SOC & SOAR',
      question: "Pourquoi associer un outil SOAR (Playbooks automatisés) à un SIEM au sein d'un SOC ?",
      options: [
        'Pour contenir automatiquement en quelques secondes une attaque critique (isolation EDR, révocation session, blocage IP) même à 03h00 du matin',
        'Pour remplacer tous les sauvegardes Cloud',
        'Pour augmenter le nombre de faux positifs',
        'Pour ouvrir le port 3389 à tout Internet',
      ],
      correctIndex: 0,
      explanation:
        'L’orchestration SOAR réduit drastiquement le temps de réponse (MTTR) en exécutant des actions de confinement standardisées dès qu’une alerte critique est confirmée.',
    },
    {
      id: 'rec-15',
      islandRef: 'Île 17 · Kubernetes en production',
      question: "Dans un cluster Kubernetes en production, comment empêcher un microservice Frontend compromis de se connecter directement à la base PostgreSQL ?",
      options: [
        'Définir une NetworkPolicy n’autorisant le port 5432 de la base qu’aux seuls Pods labellisés role=backend',
        'Laisser tous les Pods communiquer librement sans règle réseau',
        'Supprimer les sondes de santé Readiness',
        'Redémarrer tous les conteneurs manuellement chaque heure',
      ],
      correctIndex: 0,
      explanation:
        'Les NetworkPolicies implémentent la micro-segmentation Zero Trust au cœur de Kubernetes en filtrant les flux Pod-à-Pod par labels et ports.',
    },
    {
      id: 'rec-16',
      islandRef: 'Île 18 · VPN & Télétravail',
      question: "Le lien Internet du siège sature car 300 télétravailleurs font passer leurs visioconférences dans un VPN Full-Tunnel. Quelle évolution d'architecture recommander ?",
      options: [
        'Passer en Split-Tunneling pour ne router dans le VPN WireGuard que les sous-réseaux privés d’entreprise et laisser les flux SaaS/visio sortir en direct',
        'Désactiver le chiffrement du VPN',
        'Passer tous les postes en Telnet port 23',
        'Supprimer le serveur DNS de l’entreprise',
      ],
      correctIndex: 0,
      explanation:
        'Le Split-Tunneling évite l’engorgement du siège (hairpinning) en ne chiffrant dans le tunnel VPN que les accès aux ressources internes privées.',
    },
    {
      id: 'rec-17',
      islandRef: 'Île 19 · Création & Durcissement Serveur',
      question: "Juste après avoir provisionné un serveur Linux Ubuntu LTS sur Internet, quelle combinaison d'actions sécurise immédiatement l'accès SSH ?",
      options: [
        'Créer un compte sudo dédié, déployer une clé SSH Ed25519 et configurer PermitRootLogin no + PasswordAuthentication no',
        'Garder le compte root avec un mot de passe simple pour dépanner vite',
        'Désactiver SSH et installer Telnet sur le port 23',
        'Ouvrir tous les ports TCP de 1 à 65535 dans UFW',
      ],
      correctIndex: 0,
      explanation:
        'La connexion root directe et l’authentification par mot de passe sont la cible n°1 des bots. Un compte non-root avec sudo + clé Ed25519 élimine les attaques par force brute.',
    },
    {
      id: 'rec-18',
      islandRef: 'Île 19 · Architecture DMZ & UFW',
      question: "Dans une architecture DMZ professionnelle, pourquoi place-t-on le serveur Web entre un pare-feu périmétrique (FW1) et un pare-feu interne (FW2) ?",
      options: [
        'Pour isoler le serveur exposé : même s’il est compromis, FW2 protège la base de données et le LAN interne en profondeur',
        'Pour permettre à Internet d’accéder directement au port 5432 de PostgreSQL',
        'Pour supprimer totalement le chiffrement HTTPS',
        'Uniquement pour augmenter la latence du réseau',
      ],
      correctIndex: 0,
      explanation:
        'La DMZ limite le rayon d’action d’une compromission web : FW1 n’autorise que HTTPS (443) vers la DMZ, et FW2 n’autorise que les flux strictement nécessaires entre le serveur Web et la base privée.',
    },
    {
      id: 'rec-19',
      islandRef: 'Île 20 · Switching & VLAN 802.1Q',
      question: "Quelle est la différence fondamentale entre un port Switch « Access » et un port « Trunk 802.1Q » ?",
      options: [
        'Access relie un terminal dans un seul VLAN ; Trunk transporte plusieurs VLANs simultanément sur un seul câble en ajoutant un tag 802.1Q',
        'Access fonctionne uniquement en Wi-Fi et Trunk uniquement en Bluetooth',
        'Trunk désactive le chiffrement TLS sur Internet',
        'Access sert à relier deux datacenters distants de 1 000 km',
      ],
      correctIndex: 0,
      explanation:
        'Un port Access appartient à un VLAN unique (PC, imprimante, serveur), tandis qu’un port Trunk étiquette chaque trame avec son numéro de VLAN (IEEE 802.1Q) pour traverser les liens inter-switchs ou vers un routeur.',
    },
    {
      id: 'rec-20',
      islandRef: 'Île 20 · Wi-Fi Entreprise WPA3',
      question: "Pourquoi déployer WPA3-Enterprise (802.1X / RADIUS) plutôt que WPA2-Personal (PSK) dans une entreprise de 200 collaborateurs ?",
      options: [
        'Chaque utilisateur dispose d’identifiants/certificats individuels révocables immédiatement sans devoir changer la clé Wi-Fi sur 200 appareils',
        'Parce que WPA3-Enterprise supprime le besoin de points d’accès Wi-Fi',
        'Pour autoriser les visiteurs à accéder aux serveurs de comptabilité',
        'Parce que WPA2-Personal ne supporte pas le protocole IP',
      ],
      correctIndex: 0,
      explanation:
        'Avec 802.1X/RADIUS, chaque collaborateur s’authentifie avec son propre compte (Active Directory / certificat). En cas de départ ou de vol d’ordinateur, on révoque uniquement son accès.',
    },
    {
      id: 'rec-21',
      islandRef: 'Île 21 · IPv6 & Transition',
      question: "Quelle est la forme compressée valide (RFC 5952) de l'adresse IPv6 2001:0db8:0000:0000:0000:0000:0042:0001 ?",
      options: [
        '2001:db8::42:1',
        '2001::db8::42:1',
        '2001:db8::0042:0001',
        '201:db8::42:1',
      ],
      correctIndex: 0,
      explanation:
        'On retire les zéros non significatifs au début de chaque bloc (0db8 → db8, 0042 → 42, 0001 → 1) et on remplace la séquence contiguë de zéros par un unique « :: ».',
    },
    {
      id: 'rec-22',
      islandRef: 'Île 22 · Sécurité API & JWT',
      question: "Pourquoi ne doit-on JAMAIS stocker un secret ou un mot de passe dans le Payload d'un jeton JWT standard (JWS) ?",
      options: [
        'Parce que le Payload est simplement encodé en Base64URL (lisible en clair par n’importe qui) : un JWS garantit l’intégrité via sa signature, pas la confidentialité',
        'Parce qu’un JWT ne supporte que les nombres entiers',
        'Parce que le Payload est automatiquement supprimé par HTTPS',
        'Parce que OAuth 2.0 interdit le format JSON',
      ],
      correctIndex: 0,
      explanation:
        'Un JWT standard (JWS) est signé pour empêcher toute falsification, mais son contenu Base64URL est lisible sans clé par quiconque possède le jeton.',
    },
  ],
};

export const ACTIVITY_SHEETS: Record<AudienceLevel, ActivitySheet> = {
  collegiens: {
    audienceLabel: 'Collégiens & Lycéens (SNT / Technologie)',
    duration: '55 minutes (1 séance de classe)',
    objective:
      'Comprendre concrètement comment une image ou un message traverse Internet, comment fonctionne un annuaire DNS et pourquoi les services utilisent le Cloud.',
    prerequisites: 'Aucun prérequis technique — usage quotidien d’un navigateur web.',
    steps: [
      {
        title: '1. Mise en situation — La tempête sur Cyberland',
        duration: '10 min',
        instructions:
          "Projeter la carte de l'archipel et lancer l'animation interactive de l'Île 1 (« Le voyage de la lettre découpée »). Faire reformuler par les élèves pourquoi 4 oiseaux réussissent là où 1 seul échoue.",
      },
      {
        title: '2. Défi en binôme — Connecter le village & Aiguiller le port',
        duration: '20 min',
        instructions:
          "En binômes sur l'application, les élèves complètent les mini-jeux des Îles 1 et 2, puis testent le Simulateur de Paquet en comparant un envoi normal et une perte de paquet.",
      },
      {
        title: '3. Atelier débranché — La Pizzeria du Cloud',
        duration: '15 min',
        instructions:
          "Distribuer 4 cartes (On-Premise, IaaS, PaaS, SaaS). Les élèves associent des usages quotidiens (jeux vidéo, Google Docs, serveur Minecraft loué, PC familial) à chaque modèle.",
      },
      {
        title: '4. Quiz flash & restitution des badges',
        duration: '10 min',
        instructions:
          "Passer le quiz niveau Collégiens / Lycéens et comparer les scores XP de la classe.",
      },
    ],
    deliverable: 'Un schéma annoté du trajet d’un message (Appareil → Wi-Fi → Routeur → DNS → Serveur Cloud).',
    evaluationCriteria: [
      'Distinguer correctement LAN et WAN sur un exemple concret.',
      'Expliquer le rôle du DNS sans jargon excessif.',
      'Identifier le rôle du cadenas HTTPS et du pare-feu.',
    ],
  },
  etudiants: {
    audienceLabel: 'Étudiants (BTS SIO, BUT Réseaux / Info, Licence)',
    duration: '1 h 30 (TD / TP guidé)',
    objective:
      'Relier les concepts réseaux fondamentaux (adressage, TCP/UDP, filtrage de ports) aux architectures Cloud résilientes (Auto-Scaling, Load Balancing Multi-AZ).',
    prerequisites: 'Notions de base en informatique générale ou début de cours Systèmes & Réseaux.',
    steps: [
      {
        title: '1. Exploration protocole — Simulateur & Inspection d’en-têtes',
        duration: '20 min',
        instructions:
          "Utiliser le Simulateur de Paquet pour comparer l'encapsulation HTTPS/TCP et UDP, observer l'impact d'une perte de paquet et le filtrage sur port 23 vs 443.",
      },
      {
        title: '2. Parcours intensif — Îles 2, 3 et 4',
        duration: '35 min',
        instructions:
          "Valider les mini-jeux Aiguilleur du port (routage par préfixe IP), Gardien du Pont-Levis (règles pare-feu) et Cloud Tycoon (dimensionnement vs Auto-Scaling).",
      },
      {
        title: '3. Exercice de crise — Boss Final du Sommet Céleste',
        duration: '20 min',
        instructions:
          "Exécuter le plan de reprise chronométré de l'Île 5 puis rédiger un mini post-mortem indiquant le RPO, le RTO observé et comment éviter une future interruption.",
      },
      {
        title: '4. Évaluation formative',
        duration: '15 min',
        instructions:
          "Réaliser le quiz niveau Étudiants (objectif ≥ 80 %) et débattre des compromis latence/fiabilité/coût.",
      },
    ],
    deliverable: 'Une fiche d’architecture 1 page comparant un hébergement mono-serveur et une architecture Multi-AZ avec Load Balancer.',
    evaluationCriteria: [
      'Justifier le choix TCP vs UDP selon le cas d’usage applicatif.',
      'Définir une politique de pare-feu minimale (principe du moindre privilège).',
      'Arbitrer entre IaaS, PaaS et SaaS avec des critères techniques et financiers.',
    ],
  },
  reconversion: {
    audienceLabel: 'Reconversion professionnelle (Technicien, Dev, Chef de projet IT)',
    duration: '2 heures (Atelier pratique orienté métier)',
    objective:
      'Acquérir un vocabulaire opérationnel fiable pour dialoguer avec des équipes Infrastructure/DevOps, diagnostiquer un incident de premier niveau et piloter un budget Cloud.',
    prerequisites: 'Appétence pour les métiers du numérique ; aucune expérience administrateur requise.',
    steps: [
      {
        title: '1. Cartographie mentale — De la prise murale au Cloud',
        duration: '25 min',
        instructions:
          "Parcourir les animations des Îles 1 et 2 et le Simulateur de Paquet pour construire une grille de diagnostic rapide (panne locale vs panne DNS vs panne serveur).",
      },
      {
        title: '2. Sécurité pragmatique — Lire une règle de pare-feu',
        duration: '30 min',
        instructions:
          "Jouer au Gardien du Pont-Levis (Île 3) et lister les ports critiques rencontrés en entreprise (22 SSH, 80 HTTP, 443 HTTPS, 23 Telnet à bannir).",
      },
      {
        title: '3. Pilotage coûts & continuité (FinOps & PRA)',
        duration: '40 min',
        instructions:
          "Comparer l'impact financier du serveur fixe face à l'Auto-Scaling sur Cloud Tycoon (Île 4), puis mener la bascule d'urgence de l'Île 5.",
      },
      {
        title: '4. Mise en situation entretien / projet',
        duration: '25 min',
        instructions:
          "Valider le quiz niveau Reconversion et présenter en 3 minutes une recommandation Cloud (SaaS/PaaS/IaaS) pour une PME fictive.",
      },
    ],
    deliverable: 'Un mémo opérationnel de 10 réflexes Réseaux & Cloud pour le support, la gestion de projet ou le développement.',
    evaluationCriteria: [
      'Diagnostiquer un problème DNS à partir de symptômes simples.',
      'Argumenter le passage CAPEX (On-Premise) vers OPEX élastique (Cloud).',
      'Appliquer une procédure structurée de bascule et restauration en cas de panne.',
    ],
  },
};
