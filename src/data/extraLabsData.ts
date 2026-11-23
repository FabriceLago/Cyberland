export interface FlashcardItem {
  id: string;
  islandRef: string;
  front: string;
  back: string;
  memoryTip: string;
}

export interface CaseStudyDecision {
  id: string;
  label: string;
  options: {
    id: string;
    title: string;
    detail: string;
    score: number; // 0, 1, or 2
    feedback: string;
  }[];
}

export interface BusinessCaseStudy {
  id: string;
  title: string;
  sector: string;
  budgetHint: string;
  brief: string;
  constraints: string[];
  decisions: CaseStudyDecision[];
}

export const FLASHCARDS: FlashcardItem[] = [
  {
    id: 'fc-1',
    islandRef: 'Île 1 · Signaux',
    front: 'Quelle est la différence entre un LAN et un WAN ?',
    back: 'Un LAN (Local Area Network) relie les appareils d’un lieu restreint (maison, école, village). Un WAN (Wide Area Network) interconnecte plusieurs réseaux à grande distance, comme Internet.',
    memoryTip: 'L = Local (chez soi) · W = Wide (monde / archipel).',
  },
  {
    id: 'fc-2',
    islandRef: 'Île 1 · Paquets',
    front: 'Pourquoi découpe-t-on un gros fichier en petits paquets numérotés ?',
    back: 'Pour partager les lignes réseau entre tous les utilisateurs, contourner les pannes ou embouteillages et réassembler le fichier dans le bon ordre à l’arrivée.',
    memoryTip: '4 petits oiseaux rapides valent mieux qu’un oiseau cloué au sol.',
  },
  {
    id: 'fc-3',
    islandRef: 'Île 2 · DNS',
    front: 'À quoi sert exactement un serveur DNS ?',
    back: 'Le DNS (Domain Name System) traduit un nom de domaine lisible (ile-des-palmiers.gem) en adresse IP numérique (192.168.1.42) compréhensible par les routeurs.',
    memoryTip: 'DNS = l’annuaire téléphonique automatique d’Internet.',
  },
  {
    id: 'fc-4',
    islandRef: 'Île 2 · IP & MAC',
    front: 'Quelle différence sépare une adresse IP d’une adresse MAC ?',
    back: 'L’adresse IP sert au routage logique entre réseaux (couche 3), tandis que l’adresse MAC est l’identifiant matériel unique utilisé pour la livraison finale sur le réseau local (couche 2).',
    memoryTip: 'IP = adresse postale · MAC = numéro de série gravé sur la boîte aux lettres.',
  },
  {
    id: 'fc-5',
    islandRef: 'Île 3 · Transport',
    front: 'Quand choisir TCP plutôt qu’UDP ?',
    back: 'TCP garantit que chaque paquet arrive intact et dans l’ordre grâce aux accusés de réception (ACK) : indispensable pour le web, les fichiers et la banque.',
    memoryTip: 'TCP = Tout Contrôler Précisément.',
  },
  {
    id: 'fc-6',
    islandRef: 'Île 3 · Temps réel',
    front: 'Pourquoi privilégier UDP pour un match en direct ou un appel vidéo ?',
    back: 'UDP envoie les données en continu sans attendre d’accusé de réception : la latence reste minimale et une image perdue ne fige pas tout le direct.',
    memoryTip: 'UDP = Ultra Direct & Pressé.',
  },
  {
    id: 'fc-7',
    islandRef: 'Île 3 · Sécurité',
    front: 'Quel port standard utilise HTTPS et quel port ancien faut-il bloquer ?',
    back: 'HTTPS (web chiffré TLS) utilise le port 443 (autorisé). Telnet utilise le port 23 en clair : il doit être bloqué au pare-feu et remplacé par SSH (port 22).',
    memoryTip: '443 = Cadenas sécurisé · 23 = Danger en clair.',
  },
  {
    id: 'fc-8',
    islandRef: 'Île 4 · Cloud',
    front: 'Dans la métaphore de la Pizzeria, que représente le modèle PaaS ?',
    back: 'On vous livre la pâte et le four chaud : le fournisseur Cloud gère le matériel et le système, vous déployez simplement votre code applicatif et vos données.',
    memoryTip: 'PaaS = Plateforme prête pour vos développeurs.',
  },
  {
    id: 'fc-9',
    islandRef: 'Île 4 · Élasticité',
    front: 'Quel double avantage offre l’Auto-Scaling dans le Cloud ?',
    back: 'Il ajoute automatiquement des serveurs lors des pics de trafic (évitant la panne) et les éteint la nuit (évitant de payer pour des ressources inutilisées).',
    memoryTip: 'Élasticité = Performance le jour + Économies la nuit.',
  },
  {
    id: 'fc-10',
    islandRef: 'Île 5 · Résilience',
    front: 'Quel est le rôle d’un Load Balancer en architecture Multi-AZ ?',
    back: 'Il répartit le trafic entre plusieurs zones de disponibilité indépendantes et redirige automatiquement 100 % des visiteurs si une zone tombe en panne.',
    memoryTip: 'Pas de point unique de défaillance (zéro SPOF).',
  },
  {
    id: 'fc-11',
    islandRef: 'Île 5 · Sauvegarde',
    front: 'Pourquoi stocker les Snapshots hors de la zone principale ?',
    back: 'Si un sinistre détruit la Zone A, une sauvegarde stockée uniquement dans la Zone A est perdue. Répliquer les clichés en Zone B permet une restauration rapide.',
    memoryTip: 'Ne jamais garder le double des clés dans la même maison.',
  },
  {
    id: 'fc-12',
    islandRef: 'Île 6 · Éco-Cloud',
    front: 'Citez 3 leviers concrets du FinOps et de la sobriété Cloud.',
    back: '1) Choisir une région à électricité bas carbone, 2) Ajuster la taille des machines (Right-Sizing) et éteindre les environnements de test la nuit, 3) Purger les snapshots orphelins.',
    memoryTip: 'Moins de gaspillage = moins d’euros et moins de CO₂.',
  },
  {
    id: 'fc-13',
    islandRef: 'Île 7 · Types de réseaux',
    front: 'Classez PAN, LAN, WLAN, MAN et WAN du plus petit au plus grand.',
    back: 'PAN (1–10 m, personnel Bluetooth) → LAN / WLAN (10–100 m, bâtiment filaire ou Wi-Fi) → MAN (1–50 km, ville ou campus) → WAN (> 100 km, pays / continents comme Internet).',
    memoryTip: 'Poche (PAN) → Pièce (LAN/WLAN) → Ville (MAN) → Planète (WAN).',
  },
  {
    id: 'fc-14',
    islandRef: 'Île 7 · VPN & Topologies',
    front: 'À quoi sert un VPN et pourquoi la topologie Maillée résiste-t-elle mieux aux pannes ?',
    back: 'Un VPN crée un tunnel chiffré au-dessus d’Internet pour relier en sécurité un appareil distant à un réseau privé. En topologie Maillée (Mesh), plusieurs liaisons redondantes permettent de contourner un câble coupé.',
    memoryTip: 'VPN = tunnel blindé · Mesh = routes de secours multiples.',
  },
  {
    id: 'fc-15',
    islandRef: 'Île 8 · Modèle OSI',
    front: 'Quels équipements travaillent en Couche 2 et en Couche 3 du modèle OSI ?',
    back: 'Le Switch travaille en Couche 2 (Liaison) avec les adresses MAC et les Trames. Le Routeur travaille en Couche 3 (Réseau) avec les adresses IP et les Paquets.',
    memoryTip: 'L2 = Switch / MAC · L3 = Routeur / IP · L4 = TCP-UDP / Ports.',
  },
  {
    id: 'fc-16',
    islandRef: 'Île 9 · Conteneurs Docker',
    front: 'Quelle est la différence clé entre une Machine Virtuelle (VM) et un conteneur Docker ?',
    back: 'Une VM embarque un système d’exploitation entier (lourd, dizaines de secondes au démarrage). Un conteneur partage le noyau de l’hôte, isole l’app et démarre en ~1 seconde.',
    memoryTip: 'VM = maison entière · Conteneur = boîte standard légère.',
  },
  {
    id: 'fc-17',
    islandRef: 'Île 10 · Zero Trust',
    front: 'Un cadenas HTTPS suffit-il pour prouver qu’un site n’est pas un piège de phishing ?',
    back: 'Non ! HTTPS garantit seulement que la liaison est chiffrée, pas l’honnêteté du propriétaire. Vérifiez toujours le nom de domaine exact et protégez vos comptes par MFA.',
    memoryTip: 'Zero Trust = Ne jamais faire confiance par défaut, toujours vérifier.',
  },
  {
    id: 'fc-18',
    islandRef: 'Île 11 · Cryptographie',
    front: 'Quelle est la différence entre chiffrement symétrique (AES) et asymétrique ?',
    back: 'Le symétrique utilise une seule clé partagée (très rapide pour de gros volumes). L’asymétrique utilise une clé publique (pour verrouiller/vérifier) et une clé privée secrète (pour ouvrir/signer).',
    memoryTip: 'Symétrique = 1 clé de coffre · Asymétrique = boîte aux lettres publique + clé privée.',
  },
  {
    id: 'fc-19',
    islandRef: 'Île 11 · Hachage',
    front: 'Pourquoi utilise-t-on le hachage + sel pour stocker les mots de passe ?',
    back: 'Parce que le hachage est irréversible (impossible de retrouver le mot de passe d’origine) et le sel aléatoire empêche les attaques par tables précalculées (rainbow tables).',
    memoryTip: 'Hachage = empreinte à sens unique · Sel = grain aléatoire unique par utilisateur.',
  },
  {
    id: 'fc-20',
    islandRef: 'Île 12 · CI/CD',
    front: 'Que signifient CI et CD dans une chaîne DevOps moderne ?',
    back: 'CI (Intégration Continue) lance automatiquement les tests et le build Docker à chaque commit Git. CD (Déploiement Continu) met en ligne l’application de manière fiable et reproductible.',
    memoryTip: 'CI = Tester & Construire · CD = Livrer en sécurité.',
  },
  {
    id: 'fc-21',
    islandRef: 'Île 12 · Blue/Green & Canary',
    front: 'Comment distinguer un déploiement Blue/Green d’un déploiement Canary ?',
    back: 'En Blue/Green, deux environnements complets coexistent et on bascule 100 % du trafic d’un coup (rollback instantané). En Canary, on teste d’abord sur un petit pourcentage (ex. 10 %) avant d’élargir.',
    memoryTip: 'Blue/Green = bascule instantanée · Canary = éclaireur à 10 %.',
  },
  {
    id: 'fc-22',
    islandRef: 'Île 13 · Wireshark & tcpdump',
    front: 'Quels sont les 3 volets synchronisés de l’interface Wireshark ?',
    back: '1) Liste des paquets capturés (temps, IP, protocole, info), 2) Arbre détaillé des couches OSI (Ethernet L2 → IP L3 → TCP/UDP L4 → App L7), 3) Octets bruts en Hexadécimal et ASCII.',
    memoryTip: 'Liste → Couches → Octets : cliquer une couche surligne ses octets !',
  },
  {
    id: 'fc-23',
    islandRef: 'Île 13 · Filtres BPF vs Display',
    front: 'Quelle différence existe-t-il entre un filtre BPF (tcpdump) et un filtre d’affichage Wireshark ?',
    back: 'Le filtre BPF (ex. port 443) filtre au moment de la capture et écarte définitivement le reste. Le filtre d’affichage Wireshark (ex. http ou tcp.port == 23) masque temporairement sans supprimer de paquets du fichier .pcap.',
    memoryTip: 'BPF = tri à l’entrée · Display Filter = loupe non destructive.',
  },
  {
    id: 'fc-24',
    islandRef: 'Île 13 · Commande tcpdump',
    front: 'Que fait la commande « sudo tcpdump -i eth0 -nn port 443 -w audit.pcap » ?',
    back: 'Elle capture sur l’interface eth0 (-i) sans résolution DNS/port (-nn) uniquement le trafic du port 443 (filtre BPF) et enregistre les trames brutes dans audit.pcap (-w) pour les analyser dans Wireshark.',
    memoryTip: '-i interface · -nn numérique · -w fichier .pcap.',
  },
  {
    id: 'fc-25',
    islandRef: 'Île 14 · Windows Azure Monitor',
    front: 'Quel est le rôle d’Azure Monitor Agent (AMA) et des Data Collection Rules (DCR) sur Windows Server ?',
    back: 'L’agent AMA s’installe sur les serveurs Windows/Linux pour collecter Event Logs (ex. Security 4625) et compteurs de performance ; la DCR définit exactement quoi collecter et vers quel espace l’envoyer.',
    memoryTip: 'AMA = le collecteur sur la machine · DCR = la recette de tri.',
  },
  {
    id: 'fc-26',
    islandRef: 'Île 14 · Metrics vs Log Analytics',
    front: 'Quand utiliser Azure Monitor Metrics vs Log Analytics Workspace (KQL) ?',
    back: 'Metrics gère des valeurs numériques rapides (CPU %, alertes Autoscale en temps réel). Log Analytics conserve les journaux détaillés (EventID Windows, requêtes) à explorer avec le langage KQL.',
    memoryTip: 'Metrics = courbes & vitesse · Logs KQL = enquêtes & corrélation.',
  },
  {
    id: 'fc-27',
    islandRef: 'Île 14 · App Insights & Action Groups',
    front: 'À quoi servent Application Insights et les Action Groups dans Azure Monitor ?',
    back: 'Application Insights (APM) trace chaque requête applicative jusqu’à la base SQL pour trouver les lenteurs. Les Action Groups automatisent la réaction à une alerte (Teams/SMS + Autoscale ou Runbook).',
    memoryTip: 'App Insights = microscope applicatif · Action Group = réflexe d’urgence.',
  },
  {
    id: 'fc-28',
    islandRef: 'Île 15 · Active Directory',
    front: 'Quelle est la séquence exacte des billets Kerberos dans Active Directory ?',
    back: '1) Le client s’authentifie auprès du KDC et reçoit un TGT (Ticket Granting Ticket). 2) Il échange son TGT contre un TGS dédié au serveur visé. 3) Il présente le TGS au service sans jamais envoyer son mot de passe.',
    memoryTip: 'TGT = passeport général · TGS = billet d’entrée pour un service précis.',
  },
  {
    id: 'fc-29',
    islandRef: 'Île 15 · Défense AD',
    front: 'Comment parer le Kerberoasting (EventID 4769) et le Pass-the-Hash dans Active Directory ?',
    back: 'Contre Kerberoasting : comptes de service gMSA + chiffrement AES (bannir RC4). Contre Pass-the-Hash : modèle en Tiers (Tier 0 isolé), Credential Guard et groupe Protected Users.',
    memoryTip: 'Tier 0 (Domain Admin) ne se connecte jamais sur un PC utilisateur (Tier 2).',
  },
  {
    id: 'fc-30',
    islandRef: 'Île 16 · Centre SOC & SIEM',
    front: 'Quelle différence distingue un SIEM d’un outil SOAR dans un SOC ?',
    back: 'Le SIEM collecte, stocke et corrèle les journaux (Windows, pare-feu, DNS, EDR) pour détecter les incidents. Le SOAR orchestre et automatise la réponse via des Playbooks (isolation poste, blocage IP).',
    memoryTip: 'SIEM = les yeux qui détectent · SOAR = les mains qui ripostent.',
  },
  {
    id: 'fc-31',
    islandRef: 'Île 16 · MITRE ATT&CK',
    front: 'À quoi sert la matrice MITRE ATT&CK pour les analystes cybersécurité ?',
    back: 'C’est une base de connaissances mondiale classant les tactiques et techniques réelles des attaquants (Accès initial, Mouvement latéral, Exfiltration) afin de cartographier et renforcer la détection.',
    memoryTip: 'MITRE ATT&CK = le dictionnaire universel des méthodes d’attaque.',
  },
  {
    id: 'fc-32',
    islandRef: 'Île 17 · Kubernetes',
    front: 'Quel est le rôle d’un Service ClusterIP face aux adresses IP éphémères des Pods Kubernetes ?',
    back: 'Comme un Pod peut redémarrer avec une nouvelle IP à tout moment, le Service ClusterIP offre une IP virtuelle et un nom DNS internes stables qui répartissent le trafic vers les Pods sains.',
    memoryTip: 'Pod = mortel · Service ClusterIP = adresse interne permanente.',
  },
  {
    id: 'fc-33',
    islandRef: 'Île 17 · Sécurité K8s',
    front: 'Que signifie CrashLoopBackOff et à quoi sert une NetworkPolicy Kubernetes ?',
    back: 'CrashLoopBackOff indique un conteneur qui plante en boucle (à diagnostiquer via kubectl logs --previous). Une NetworkPolicy agit comme un pare-feu Zero Trust filtrant les échanges Pod-à-Pod.',
    memoryTip: 'CrashLoopBackOff → kubectl logs --previous · NetworkPolicy → pare-feu entre Pods.',
  },
  {
    id: 'fc-34',
    islandRef: 'Île 18 · VPN WireGuard',
    front: 'Quand choisir le Split-Tunneling plutôt que le Full-Tunneling en VPN ?',
    back: 'Le Split-Tunneling ne route que les sous-réseaux privés d’entreprise dans le tunnel VPN (ex. 10.0.2.0/24), laissant la visio et le SaaS sortir en direct pour éviter de saturer la passerelle du siège.',
    memoryTip: 'Full-Tunnel = tout passe par le siège · Split-Tunnel = seul l’intranet passe par le VPN.',
  },
  {
    id: 'fc-35',
    islandRef: 'Île 18 · NAT/PAT & Stateful',
    front: 'Comment le PAT (NAT à surcharge de ports) et le pare-feu Stateful fonctionnent-ils ensemble ?',
    back: 'Le PAT associe chaque IP privée à un port source éphémère sur l’unique IP publique du routeur. Le pare-feu Stateful mémorise l’état des sessions sortantes pour laisser revenir leurs réponses en sécurité.',
    memoryTip: 'PAT = 1 IP publique + ports distincts · Stateful = table des sessions actives.',
  },
];

export const CASE_STUDIES: BusinessCaseStudy[] = [
  {
    id: 'case-festival',
    title: 'Brief 01 · Billetterie du Festival de Cyberland',
    sector: 'Événementiel & E-commerce',
    budgetHint: 'Budget serré hors période de vente · Pics x20 à l’ouverture',
    brief:
      "Le festival annuel vend 40 000 billets en 2 heures le jour J, puis le site ne reçoit presque plus de visites pendant 10 mois. L'an dernier, le serveur unique a planté dès la première minute.",
    constraints: [
      'Encaisser un pic brutal x20 sans erreur 503',
      'Paiements bancaires obligatoirement chiffrés',
      'Ne pas payer toute l’année pour 10 serveurs inutilisés',
    ],
    decisions: [
      {
        id: 'model',
        label: '1. Modèle d’hébergement recommandé',
        options: [
          {
            id: 'onprem',
            title: 'Acheter 10 serveurs physiques sur site',
            detail: 'Achat définitif installé dans les bureaux du festival.',
            score: 0,
            feedback: 'Investissement lourd inutile pendant 10 mois sur 12 (surdimensionnement).',
          },
          {
            id: 'paas-autoscale',
            title: 'Cloud PaaS + Auto-Scaling + CDN',
            detail: 'Capacité minimale toute l’année qui monte automatiquement le jour J.',
            score: 2,
            feedback: 'Choix idéal : élasticité totale au pic et facture minimale le reste de l’année.',
          },
          {
            id: 'single-vm',
            title: '1 machine virtuelle fixe (IaaS)',
            detail: 'Une seule instance moyenne tournant toute l’année.',
            score: 1,
            feedback: 'Moins cher que l’achat physique, mais risque toujours la saturation au pic x20.',
          },
        ],
      },
      {
        id: 'transport',
        label: '2. Protocole pour le tunnel de paiement',
        options: [
          {
            id: 'udp',
            title: 'UDP sur port 5004',
            detail: 'Ultra-rapide sans accusé de réception.',
            score: 0,
            feedback: 'Dangereux pour un paiement : des paquets perdus ne seraient jamais renvoyés.',
          },
          {
            id: 'https',
            title: 'HTTPS (TLS sur TCP port 443)',
            detail: 'Fiable avec accusés de réception et chiffrement de bout en bout.',
            score: 2,
            feedback: 'Parfait : TCP garantit l’intégrité de la commande et TLS protège les données bancaires.',
          },
          {
            id: 'http',
            title: 'HTTP sur port 80',
            detail: 'TCP fiable mais sans chiffrement.',
            score: 0,
            feedback: 'Les numéros de carte circuleraient en clair sur le réseau.',
          },
        ],
      },
      {
        id: 'finops',
        label: '3. Mesure FinOps après le jour J',
        options: [
          {
            id: 'keep-max',
            title: 'Laisser les 10 serveurs actifs par sécurité',
            detail: 'Évite toute reconfiguration.',
            score: 0,
            feedback: 'Gaspillage financier et carbone inutile pendant 10 mois.',
          },
          {
            id: 'scale-down',
            title: 'Redescendre automatiquement à 1 instance minimale',
            detail: 'Règle de scale-in déclenchée dès que le CPU passe sous 25 %.',
            score: 2,
            feedback: 'Excellent réflexe FinOps : coûts et émissions alignés sur la charge réelle.',
          },
        ],
      },
    ],
  },
  {
    id: 'case-health',
    title: 'Brief 02 · Clinique Côtière (Dossiers patients 24h/24)',
    sector: 'Santé & Haute Disponibilité',
    budgetHint: 'Continuité de service critique · Données très sensibles',
    brief:
      "La clinique doit consulter les dossiers médicaux 24h/24, même en cas de coupure électrique sur l'île Est. Les données patients ne doivent jamais être exposées ni perdues.",
    constraints: [
      'Zéro interruption lors de la perte d’un centre de données',
      'Accès d’administration strictement sécurisé',
      'Sauvegardes rapides et exploitables en cas d’incident',
    ],
    decisions: [
      {
        id: 'resilience',
        label: '1. Architecture de disponibilité',
        options: [
          {
            id: 'mono-az',
            title: '2 serveurs dans la même salle (Zone A)',
            detail: 'Partagent la même alimentation électrique.',
            score: 1,
            feedback: 'Protège contre la panne d’un serveur, mais pas contre une coupure de toute la Zone A.',
          },
          {
            id: 'multi-az',
            title: 'Architecture Multi-AZ (Zone A + Zone B) derrière un Load Balancer',
            detail: 'Bascule automatique et base de données répliquée hors zone.',
            score: 2,
            feedback: 'Architecture recommandée : élimine le point unique de défaillance.',
          },
        ],
      },
      {
        id: 'admin',
        label: '2. Accès d’administration pour les techniciens',
        options: [
          {
            id: 'telnet',
            title: 'Ouvrir Telnet (port 23) sur Internet',
            detail: 'Accès direct rapide depuis n’importe où.',
            score: 0,
            feedback: 'Faille majeure : Telnet transmet les mots de passe en clair.',
          },
          {
            id: 'ssh-vpn',
            title: 'Bloquer port 23 et utiliser SSH (port 22) via VPN restreint',
            detail: 'Principe du moindre privilège avec chiffrement fort.',
            score: 2,
            feedback: 'Bonne pratique sécurité : aucune interface d’administration exposée en clair.',
          },
        ],
      },
      {
        id: 'backup',
        label: '3. Stratégie de sauvegarde',
        options: [
          {
            id: 'local-only',
            title: 'Copie mensuelle sur le même disque',
            detail: 'Simple à mettre en place.',
            score: 0,
            feedback: 'Perte pouvant atteindre 30 jours et disparition de la copie si le disque lâche.',
          },
          {
            id: 'cross-zone',
            title: 'Snapshots chiffrés fréquents répliqués en Zone B + tests de restauration',
            detail: 'Garantit un RPO court et une intégrité vérifiée.',
            score: 2,
            feedback: 'Exemplaire : une sauvegarde n’est fiable que si elle est isolée et testée.',
          },
        ],
      },
    ],
  },
  {
    id: 'case-pme',
    title: 'Brief 03 · PME de 35 salariés en travail hybride',
    sector: 'Services & Collaboration',
    budgetHint: 'Pas d’administrateur système en interne · Besoin immédiat',
    brief:
      "Une PME de conseil souhaite équiper 35 salariés (au bureau et en télétravail) d'une messagerie, d'outils de visioconférence et de documents partagés, avec un budget maîtrisé.",
    constraints: [
      'Aucune équipe IT interne pour maintenir des serveurs',
      'Visioconférences fluides à distance',
      'Démarche responsable (sobriété numérique)',
    ],
    decisions: [
      {
        id: 'cloud-type',
        label: '1. Modèle Cloud à privilégier pour la bureautique',
        options: [
          {
            id: 'saas',
            title: 'SaaS (Suite collaborative clé en main)',
            detail: 'Messagerie, visio et documents accessibles dans le navigateur.',
            score: 2,
            feedback: 'Parfait pour une PME sans équipe infra : zéro maintenance matérielle ou OS.',
          },
          {
            id: 'iaas',
            title: 'IaaS (Installer soi-même ses serveurs mail Linux)',
            detail: 'Gestion complète des mises à jour et de la sécurité.',
            score: 0,
            feedback: 'Beaucoup trop lourd sans administrateur système dédié.',
          },
        ],
      },
      {
        id: 'visio',
        label: '2. Protocole adapté pour les appels visio fluides',
        options: [
          {
            id: 'udp-visio',
            title: 'Flux temps réel basé sur UDP',
            detail: 'Privilégie la faible latence pour voix et vidéo.',
            score: 2,
            feedback: 'Exact : UDP évite les freezes dus aux retransmissions de paquets.',
          },
          {
            id: 'tcp-only',
            title: 'Transfert séquentiel strict en TCP',
            detail: 'Met la conversation en pause à chaque micro-perte.',
            score: 0,
            feedback: 'Provoque des décalages audio/vidéo très inconfortables en réunion.',
          },
        ],
      },
      {
        id: 'green',
        label: '3. Action Éco-Cloud simple pour la PME',
        options: [
          {
            id: 'region-cleanup',
            title: 'Hébergement en région bas carbone + nettoyage annuel des gros fichiers partagés',
            detail: 'Réduit l’empreinte carbone et les coûts de stockage.',
            score: 2,
            feedback: 'Très bon réflexe de sobriété numérique accessible à toute entreprise.',
          },
          {
            id: 'keep-all',
            title: 'Conserver indéfiniment 5 copies de chaque vidéo de réunion',
            detail: 'Stockage illimité sans tri.',
            score: 0,
            feedback: 'Alourdit inutilement la consommation des centres de données.',
          },
        ],
      },
    ],
  },
];
