import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { EASE_SWISS } from './MotionPrimitives';
import { playClick, playPacket } from '../utils/sound';

interface IslandAnimationPlayerProps {
  islandId: number;
  defaultSpeechRate?: number;
  onStartGame: () => void;
}

interface AnimationScene {
  title: string;
  caption: string;
  conceptNote: string;
}

const SCENES_BY_ISLAND: Record<number, AnimationScene[]> = {
  1: [
    {
      title: '1. La lettre géante',
      caption:
        "Un habitant essaie d'envoyer une énorme lettre complète sur un seul oiseau voyageur. Trop lourd : impossible de décoller !",
      conceptNote: 'Problème : un fichier volumineux saturerait une ligne entière.',
    },
    {
      title: '2. Découpage en 4 paquets',
      caption:
        'Le protocole réseau découpe la lettre en 4 morceaux numérotés (1/4, 2/4, 3/4, 4/4), chacun portant son adresse de destination.',
      conceptNote: 'Concept : découpage en paquets (Packet Switching).',
    },
    {
      title: '3. Chemins multiples sur le réseau',
      caption:
        "Les 4 oiseaux s'envolent. Les paquets 1, 3 et 4 filent par la fibre au nord ; le paquet 2 contourne un orage par le relais Wi-Fi au sud.",
      conceptNote: 'Résilience : chaque paquet emprunte la meilleure route disponible.',
    },
    {
      title: '4. Réassemblage au phare',
      caption:
        "Les paquets arrivent dans le désordre (1, 3, 4 puis 2), mais grâce à leurs numéros, la lettre est reconstituée intacte !",
      conceptNote: "À l'arrivée, l'ordre original est restauré en quelques millisecondes.",
    },
  ],
  2: [
    {
      title: '1. Destination humaine : ile-des-palmiers.gem',
      caption:
        "Le capitaine du cargo connaît le nom de l'île, mais les phares du port ne comprennent que les coordonnées IP numériques.",
      conceptNote: 'Nom de domaine lisible ≠ Adresse IP numérique.',
    },
    {
      title: '2. Appel à la Tour DNS (Annuaire magique)',
      caption:
        "Le navire interroge la Tour DNS. Celle-ci consulte son registre et répond aussitôt : « ile-des-palmiers.gem = 192.168.1.42 ».",
      conceptNote: 'Résolution DNS : Nom de domaine → Adresse IP.',
    },
    {
      title: '3. Guidage par les phares-routeurs',
      caption:
        "Les routeurs lisent le préfixe 192.168.1.x et dirigent le navire d'aiguillage en aiguillage vers le bon sous-réseau.",
      conceptNote: 'Routage : choix du prochain saut vers le sous-réseau cible.',
    },
    {
      title: '4. Accostage final par adresse MAC',
      caption:
        "Dans le port local, l'adresse MAC gravée sur chaque machine garantit la livraison devant la bonne cabane.",
      conceptNote: 'IP = adresse de routage global · MAC = identifiant matériel local.',
    },
  ],
  3: [
    {
      title: '1. TCP le méticuleux (Fiabilité)',
      caption:
        'TCP numérote chaque colis et attend un accusé « ACK : bien reçu ! ». Si le colis 2 tombe à la mer, TCP le renvoie immédiatement.',
      conceptNote: 'Idéal pour : Web, e-mails, virements bancaires, téléchargements.',
    },
    {
      title: '2. UDP le pressé (Temps réel)',
      caption:
        "UDP lance des balles de tennis en continu pour un match en direct. Si une balle sort, on ne met pas le match en pause : on continue !",
      conceptNote: 'Idéal pour : Visioconférence, streaming direct, jeux multijoueurs.',
    },
    {
      title: '3. Le cadenas doré HTTPS (Port 443)',
      caption:
        'Sans chiffrement (HTTP), un pirate lit « MotDePasse ». Avec HTTPS, le message devient « #9fA!2xQ » : totalement illisible en transit.',
      conceptNote: 'TLS/HTTPS protège la confidentialité et l’intégrité des échanges.',
    },
    {
      title: '4. Le Pare-feu contrôle le pont-levis',
      caption:
        "Le pare-feu autorise le port 443 sécurisé et bloque les connexions dangereuses comme Telnet (port 23 en clair) ou les paquets corrompus.",
      conceptNote: 'Règle d’or : n’ouvrir que les ports strictement nécessaires.',
    },
  ],
  4: [
    {
      title: '1. Sur site (On-Premise) — Tout faire soi-même',
      caption:
        'Vous achetez le four, les ingrédients, payez l’électricité et faites la vaisselle. Si 100 touristes arrivent, votre unique four sature !',
      conceptNote: 'Responsabilité : 100 % à votre charge (matériel, OS, sécurité, app).',
    },
    {
      title: '2. IaaS — Louer une cuisine équipée',
      caption:
        "Le Cloud vous loue des serveurs virtuels, du stockage et du réseau. Vous choisissez le système d'exploitation et y installez vos recettes.",
      conceptNote: 'Exemples : machines virtuelles, disques Cloud, réseaux privés.',
    },
    {
      title: '3. PaaS — Pâte et four chaud livrés',
      caption:
        "Le fournisseur gère le matériel et le système. Vous assemblez simplement votre garniture (votre code applicatif) pour servir plus vite.",
      conceptNote: 'Exemples : plateformes d’hébergement d’applications managées.',
    },
    {
      title: '4. SaaS & Élasticité (Auto-Scaling)',
      caption:
        'En SaaS, vous mangez directement au restaurant (messagerie, documents en ligne). Et grâce à l’Auto-Scaling, les serveurs s’adaptent automatiquement à la foule !',
      conceptNote: 'Payer à l’usage : plus de serveurs au pic, moins la nuit.',
    },
  ],
  5: [
    {
      title: '1. Architecture normale multi-zones',
      caption:
        'Le Load Balancer répartit calmement le trafic des visiteurs entre la Zone A (Île Est) et la Zone B (Île Ouest), avec sauvegardes régulières.',
      conceptNote: 'Deux zones indépendantes éliminent le point unique de défaillance.',
    },
    {
      title: '2. Alerte : la tempête frappe la Zone A',
      caption:
        "La foudre coupe l'alimentation de la Zone A. Sans intervention ou bascule automatique, les visiteurs reçoivent une erreur de connexion.",
      conceptNote: 'Incident majeur : perte totale d’un centre de données.',
    },
    {
      title: '3. Bascule (Failover) vers la Zone B',
      caption:
        'Le Load Balancer isole la Zone A et redirige 100 % du trafic vers la Zone B, qui déploie des réplicas supplémentaires.',
      conceptNote: 'Haute disponibilité : continuité de service transparente.',
    },
    {
      title: '4. Restauration depuis le Snapshot Cloud',
      caption:
        "La base de données est restaurée depuis la dernière sauvegarde saine stockée hors de la Zone A. Cyberland est sauvé !",
      conceptNote: 'RPO minimal grâce aux sauvegardes répliquées hors zone.',
    },
  ],
  6: [
    {
      title: '1. Le piège du serveur allumé 24h/24',
      caption:
        "Surdimensionner des serveurs et les laisser tourner toute la nuit alors que l'île dort consomme de l'électricité et double la facture Cloud inutilement.",
      conceptNote: 'Gaspillage Cloud : jusqu’à 40 % d’énergie consommée pour des machines inactives.',
    },
    {
      title: '2. Choisir une région bas carbone',
      caption:
        "Déployer l'archipel dans un centre de données alimenté par une électricité décarbonée réduit immédiatement les émissions de CO₂.",
      conceptNote: 'Impact fort : l’intensité carbone varie d’un facteur 1 à 10 selon la région.',
    },
    {
      title: '3. Right-Sizing & Extinction nocturne',
      caption:
        "Ajuster la taille des instances à la charge réelle et éteindre les serveurs de test de 20h à 7h optimise à la fois le budget et le climat.",
      conceptNote: 'FinOps + Green IT : payer moins et émettre moins vont de pair.',
    },
    {
      title: '4. Purger les stockages orphelins',
      caption:
        "Supprimer les sauvegardes périmées et vieux disques oubliés libère de l'espace précieux dans le Nuage Céleste.",
      conceptNote: 'Règle de cycle de vie : archiver ou supprimer automatiquement les données inutiles.',
    },
  ],
  7: [
    {
      title: '1. PAN (1–10 m) — La bulle personnelle',
      caption:
        "Autour de l'explorateur, un réseau personnel (PAN) relie sans effort sa montre, ses écouteurs et sa tablette en Bluetooth ou NFC sur quelques mètres.",
      conceptNote: 'PAN = Personal Area Network · Portée 1 à 10 m · Bluetooth / NFC / USB.',
    },
    {
      title: '2. LAN & WLAN (10–100 m) — Le village & son Wi-Fi',
      caption:
        "À l'échelle d'une école, d'une maison ou d'un bureau, le LAN relie les postes fixes en Ethernet par Switch, tandis que le WLAN (Wi-Fi) libère la mobilité sans fil.",
      conceptNote: 'LAN = filaire ultra-stable · WLAN = réseau local sans fil (Wi-Fi).',
    },
    {
      title: '3. MAN (1–50 km) — La boucle de la cité',
      caption:
        "Pour interconnecter mairie, port, hôpital et université sur 18 km autour de la baie, la capitale de Cyberland déploie une boucle fibre optique métropolitaine (MAN).",
      conceptNote: 'MAN = Metropolitan Area Network · Fédère plusieurs LAN d’une ville.',
    },
    {
      title: '4. WAN, VPN & Topologie Maillée — Échelle mondiale',
      caption:
        "Les câbles sous-marins et satellites forment le WAN mondial (Internet). Pour joindre un LAN privé depuis un Wi-Fi public, on active un tunnel chiffré VPN ; côté câblage, la topologie Maillée assure la résilience.",
      conceptNote: 'WAN = longue distance · VPN = tunnel privé chiffré · Mesh = chemins redondants.',
    },
  ],
  8: [
    {
      title: '1. Couches hautes (7–5) : Données & Chiffrement',
      caption:
        'Votre navigateur crée une requête HTTPS (Couche 7 Application), la chiffre via TLS (Couche 6) et ouvre une session stable (Couche 5).',
      conceptNote: 'Couches 7–5 : interface humaine, formatage, chiffrement et session.',
    },
    {
      title: '2. Couche 4 (Transport) : Découpage en Segments',
      caption:
        'TCP ou UDP découpe le message et ajoute le numéro de port (ex. Port 443) pour savoir quelle application doit recevoir les données.',
      conceptNote: 'Unité Couche 4 = Segment (TCP) ou Datagramme (UDP) + Ports.',
    },
    {
      title: '3. Couche 3 (Réseau) : Enveloppe IP & Routage',
      caption:
        'La couche Réseau ajoute les adresses IP source et destination : le paquet peut désormais traverser les phares-routeurs jusqu’au bon sous-réseau.',
      conceptNote: 'Unité Couche 3 = Paquet IP · Équipement clé : le Routeur.',
    },
    {
      title: '4. Couches 2 & 1 : Trame MAC & Signaux binaires',
      caption:
        'Le Switch livre localement grâce à la Trame MAC (Couche 2), puis la carte réseau émet de vrais bits 0 et 1 (Couche 1 Physique) sur la fibre ou le Wi-Fi.',
      conceptNote: 'Encapsulation : Données → Segment → Paquet → Trame → Bits (0/1).',
    },
  ],
  9: [
    {
      title: '1. Le piège du Monolithe sur VM unique',
      caption:
        'Sur un serveur traditionnel, Billetterie, Météo et Paiement partagent la même machine virtuelle lourde (2048 Mo) : un bug météo fige tout le port.',
      conceptNote: 'Monolithe : couplage fort et redémarrage lent (45 secondes).',
    },
    {
      title: '2. Emballage léger en Conteneurs Docker',
      caption:
        'Chaque microservice est isolé dans son conteneur Docker qui partage le noyau de l’hôte : ~64 Mo de RAM et démarrage en 1 seconde !',
      conceptNote: 'Conteneur vs VM : pas de second système d’exploitation complet à charger.',
    },
    {
      title: '3. Isolation des pannes en production',
      caption:
        'Si le conteneur Météo plante, les conteneurs Billetterie, Paiement et Cache continuent de fonctionner sans aucune coupure pour les touristes.',
      conceptNote: 'Résilience par isolation : le rayon d’impact d’un bug reste confiné.',
    },
    {
      title: '4. Scaling ciblé des microservices',
      caption:
        'Lors d’un pic d’affluence sur les billets, l’orchestrateur lance 3 réplicas du seul conteneur Billetterie sans gaspiller de ressources ailleurs.',
      conceptNote: 'Agilité Cloud-Native : on multiplie exactement le service sollicité.',
    },
  ],
  10: [
    {
      title: '1. Démasquer un e-mail de Phishing',
      caption:
        'Un imposteur envoie une fausse alerte urgente depuis "support@cyber-land-urgent.xyz". Toujours inspecter le vrai nom de domaine avant de cliquer !',
      conceptNote: 'Indices phishing : urgence artificielle + domaine maquillé (typo-squatting).',
    },
    {
      title: '2. Déjouer un Wi-Fi piège (Evil Twin)',
      caption:
        'Une borne gratuite ouverte sans chiffrement au port permet à un pirate d’écouter les échanges. Préférez la 4G/5G ou activez un VPN.',
      conceptNote: 'Règle mobilité : jamais de connexion sensible sur un Wi-Fi public non protégé.',
    },
    {
      title: '3. Bouclier MFA contre le vol de mot de passe',
      caption:
        'Même si un mot de passe fuite, l’authentification multifacteur (clé physique ou code temporaire) bloque l’intrus. Et refusez toute alerte MFA inattendue !',
      conceptNote: 'MFA = Ce que je sais (mot de passe) + Ce que je possède (clé/téléphone).',
    },
    {
      title: '4. Modèle Zero Trust (Confiance Zéro)',
      caption:
        'Ne jamais faire confiance par défaut, même à l’intérieur du réseau local : chaque accès est vérifié et limité au moindre privilège.',
      conceptNote: 'Zero Trust : vérifier explicitement + moindre privilège + chiffrer partout.',
    },
  ],
  11: [
    {
      title: '1. Chiffrement symétrique (AES) — La clé ultra-rapide',
      caption:
        'Expéditeur et destinataire utilisent la même clé secrète pour verrouiller et ouvrir le coffre. Idéal pour chiffrer des gigaoctets de données en un éclair.',
      conceptNote: 'Symétrique (AES) : 1 clé partagée · Vitesse maximale · Défi : partager la clé.',
    },
    {
      title: '2. Chiffrement asymétrique — Clé Publique & Clé Privée',
      caption:
        'Chacun peut déposer un message dans votre boîte aux lettres avec votre Clé Publique, mais vous seul pouvez l’ouvrir avec votre Clé Privée gardée secrète.',
      conceptNote: 'Asymétrique : résout le partage de clé sur un réseau public (Internet).',
    },
    {
      title: '3. Hachage + Sel — L’empreinte irréversible',
      caption:
        'Un hachage SHA-256 ou Argon2 transforme un mot de passe en empreinte fixe à sens unique : changer une seule lettre bouleverse tout le résultat (effet avalanche).',
      conceptNote: 'Mots de passe : toujours hachés + salés, jamais stockés en clair ni déchiffrables.',
    },
    {
      title: '4. Signature numérique & Certificat TLS (HTTPS)',
      caption:
        'Le Phare prouve son identité via son certificat signé, négocie une clé AES en asymétrique puis ouvre un tunnel HTTPS chiffré de bout en bout.',
      conceptNote: 'TLS combine authentification (certificat), échange asymétrique et vitesse AES.',
    },
  ],
  12: [
    {
      title: '1. Commit Git & Intégration Continue (CI)',
      caption:
        'Dès qu’un développeur pousse son code sur Git, le robot CI exécute automatiquement les tests unitaires, l’analyse de sécurité et construit l’image Docker.',
      conceptNote: 'CI : détecter les bugs en 2 minutes avant qu’ils n’atteignent la production.',
    },
    {
      title: '2. Déploiement Blue/Green sans coupure',
      caption:
        'La version stable Blue continue de servir Cyberland pendant que la nouvelle version Green démarre à côté : zéro maintenance nocturne !',
      conceptNote: 'Blue/Green : deux environnements jumeaux prêts à basculer en 1 seconde.',
    },
    {
      title: '3. Éclaireur Canary (10 % du trafic)',
      caption:
        'Le Load Balancer envoie prudemment 10 % des visiteurs sur la nouveauté pour surveiller latence et taux d’erreurs HTTP 500 en conditions réelles.',
      conceptNote: 'Canary : limite le rayon d’impact d’un bug imprévu à une petite fraction.',
    },
    {
      title: '4. Promotion à 100 % ou Rollback 1 clic',
      caption:
        'Si tout est vert, Green reçoit 100 % du trafic. Si une erreur survient, un clic sur Rollback renvoie instantanément tout le monde sur Blue !',
      conceptNote: 'Sérénité DevOps : livrer souvent tout en gardant un filet de sécurité immédiat.',
    },
  ],
  13: [
    {
      title: '1. Carte réseau (eth0), Mode Promiscuité & libpcap',
      caption:
        'En mode normal, votre carte réseau ignore les trames destinées aux autres machines. En mode Promiscuité, le pilote libpcap/Npcap copie toutes les trames qui passent sur le lien dans un tampon mémoire sans jamais ralentir le trafic.',
      conceptNote: 'Fondation commune : Wireshark et tcpdump reposent tous deux sur libpcap / Npcap.',
    },
    {
      title: '2. tcpdump — Capture légère CLI & Filtre noyau BPF',
      caption:
        'Sur un serveur Linux sans écran, tcpdump applique un filtre BPF directement dans le noyau (ex. port 443). Les paquets hors filtre sont écartés avant même d’atteindre le programme : zéro surcharge CPU !',
      conceptNote: 'Commande type : sudo tcpdump -i eth0 -nn port 443 -w audit.pcap.',
    },
    {
      title: '3. Le pont .pcap : Capturer sur serveur, analyser sur poste',
      caption:
        'Les ingénieurs capturent un fichier binaire standard .pcap avec tcpdump sur le serveur distant, le rapatrient en sécurité (SCP), puis l’ouvrent dans Wireshark pour une dissection graphique confortable.',
      conceptNote: 'Workflow terrain : tcpdump (collecte serveur) → fichier .pcap → Wireshark (analyse).',
    },
    {
      title: '4. Anatomie animée de Wireshark (3 volets synchronisés)',
      caption:
        'Wireshark relie 3 vues en direct : Volet 1 (Liste des paquets), Volet 2 (Arbre des couches Ethernet L2 → IP L3 → TCP L4 → App L7) et Volet 3 (Octets bruts Hex/ASCII surlignés selon la couche choisie).',
      conceptNote: 'Chaque clic sur une couche OSI illumine ses octets exacts dans la trame binaire.',
    },
    {
      title: '5. Filtre de capture (BPF) vs Filtre d’affichage (Wireshark)',
      caption:
        'Attention à la différence : le filtre BPF écarte définitivement les paquets pendant la capture, alors que le filtre d’affichage Wireshark (ex. http, dns, tcp.port == 23) masque temporairement sans rien effacer.',
      conceptNote: 'BPF = tri définitif à la capture · Display Filter = loupe réversible à l’analyse.',
    },
    {
      title: '6. Follow TCP Stream — HTTP en clair vs HTTPS (TLS 1.3)',
      caption:
        'La fonction « Follow TCP Stream » reconstitue toute une conversation. Sur HTTP (port 80) ou Telnet (port 23), les mots de passe apparaissent en clair ; sur HTTPS (TLS 1.3 port 443), les octets restent totalement illisibles !',
      conceptNote: 'Meilleure démonstration visuelle de l’importance vitale du chiffrement TLS.',
    },
  ],
  14: [
    {
      title: '1. Collecte universelle : Windows Server, Agent AMA & DCR',
      caption:
        'Sur chaque serveur Windows Server ou VM Cloud, Azure Monitor Agent (AMA) lit les journaux Windows (Security, System) et les compteurs de performance selon une Data Collection Rule (DCR) centralisée.',
      conceptNote: 'AMA remplace les anciens agents et fonctionne aussi sur site grâce à Azure Arc.',
    },
    {
      title: '2. Deux moteurs complémentaires : Metrics vs Log Analytics',
      caption:
        'Azure Monitor sépare les flux : Metrics stocke des chiffres légers en séries temporelles (CPU %, latence — alertes en secondes) ; Log Analytics stocke les événements détaillés (EventID Windows, requêtes) pour l’enquête.',
      conceptNote: 'Metrics = vitesse & courbes temps réel · Log Analytics = profondeur & corrélation.',
    },
    {
      title: '3. Enquête dans les journaux avec KQL (Kusto Query Language)',
      caption:
        'Le langage KQL filtre des millions de lignes Windows en quelques millisecondes grâce aux pipes « | » : table Event → filtre EventID == 4625 → comptage par machine (summarize count() by Computer).',
      conceptNote: 'KQL lit de haut en bas comme un entonnoir : Table | where | summarize | top.',
    },
    {
      title: '4. Application Insights (APM & Carte des dépendances)',
      caption:
        'Quand le CPU Windows est normal mais le site reste lent, Application Insights suit la requête de bout en bout (Navigateur → API → Base SQL) et pointe exactement l’appel SQL responsable des 2,4 secondes de latence !',
      conceptNote: 'APM = visibilité interne dans le code, les exceptions et les dépendances externes.',
    },
    {
      title: '5. Alertes intelligentes & Action Groups auto-réparateurs',
      caption:
        'Dès qu’une métrique franchit son seuil (ex. CPU > 85 %) ou qu’une requête KQL détecte une attaque, une Alerte (Sev 1) active un Action Group : notification Teams/SMS + Autoscale ou Runbook de réparation.',
      conceptNote: 'Passer de la supervision passive à la remédiation automatisée 24h/24.',
    },
    {
      title: '6. Workbooks, Dashboards & Supervision Hybride (Azure Arc)',
      caption:
        'Tous les indicateurs — serveurs Windows locaux via Azure Arc, machines virtuelles Cloud, conteneurs et applications — convergent dans des tableaux de bord (Workbooks) partagés par les équipes Ops et Sécurité.',
      conceptNote: 'Une vue unifiée unique (Single Pane of Glass) pour tout le système d’information.',
    },
  ],
  15: [
    {
      title: '1. Forêt, Domaine & Unités d’Organisation (OU)',
      caption:
        'Active Directory structure l’entreprise comme un organigramme sécurisé : la Forêt englobe le Domaine (cyberland.local), lui-même découpé en Unités d’Organisation (OU) par service (Direction, IT, Finance).',
      conceptNote: 'Les OU servent à déléguer l’administration et à cibler précisément les GPO.',
    },
    {
      title: '2. Le Contrôleur de Domaine (DC) & le KDC Kerberos',
      caption:
        'Au cœur du domaine, le Contrôleur de Domaine héberge l’annuaire LDAP (port 389/636) et le centre de distribution de clés Kerberos (KDC, port 88) qui vérifie l’identité de chaque utilisateur et machine.',
      conceptNote: 'Un annuaire centralisé évite de créer des comptes locaux sur chaque PC.',
    },
    {
      title: '3. Cinématique Kerberos — Demande de TGT (AS-REQ / AS-REP)',
      caption:
        'À l’ouverture de session Windows, le poste n’envoie jamais le mot de passe en clair : il chiffre un horodatage avec sa clé pour obtenir un passeport temporaire, le Ticket Granting Ticket (TGT).',
      conceptNote: 'Kerberos exige des horloges synchronisées (NTP, écart max 5 min) contre le rejeu.',
    },
    {
      title: '4. Accès aux ressources via Ticket de Service (TGS)',
      caption:
        'Pour ouvrir un partage de fichiers ou une base SQL, le poste présente son TGT au KDC et reçoit un Ticket de Service (TGS) chiffré pour le serveur cible : c’est la magie du Single Sign-On (SSO).',
      conceptNote: '1 connexion le matin = accès fluide à tous les services autorisés sans ressaisir le mot de passe.',
    },
    {
      title: '5. GPO — Stratégies de Groupe déployées automatiquement',
      caption:
        'En liant une GPO à une OU, l’administrateur impose en un clic le verrouillage d’écran, BitLocker, les règles pare-feu Windows et les mises à jour sur 500 postes simultanément.',
      conceptNote: 'Ordre d’application LSDOU : Local → Site → Domaine → OU (la plus proche gagne).',
    },
    {
      title: '6. Durcissement AD : Moindre Privilège & Tiering',
      caption:
        'Pour bloquer les attaques Golden Ticket ou Pass-the-Hash, un Administrateur de Domaine n’ouvre jamais sa session privilégiée sur un poste bureautique ordinaire : on sépare strictement les niveaux (Tier 0, 1, 2).',
      conceptNote: 'Règle d’or AD : 1 compte standard pour les e-mails + 1 compte admin séparé pour le Tier 0.',
    },
  ],
  16: [
    {
      title: '1. Collecte multi-sources vers le SIEM',
      caption:
        'Le Centre SOC centralise en continu les journaux des pare-feux, des Contrôleurs Active Directory, des serveurs Windows/Linux et du Cloud dans un SIEM afin d’obtenir une visibilité complète.',
      conceptNote: 'Sans centralisation SIEM, les traces d’une attaque restent éparpillées et invisibles.',
    },
    {
      title: '2. Normalisation & Corrélation d’alertes',
      caption:
        'Un seul échec de connexion est anodin. Mais 25 échecs (EventID 4625) suivis d’un succès (4624) depuis un pays inhabituel déclenchent une règle de corrélation haute criticité !',
      conceptNote: 'Corréler = relier plusieurs signaux faibles pour révéler une attaque réelle.',
    },
    {
      title: '3. Triage Analyste SOC N1 : Faux Positif vs Vrai Positif',
      caption:
        'L’analyste N1 inspecte le contexte (compte, IP source, processus parent PowerShell encodé) pour distinguer une tâche légitime d’un incident réel avant d’escalader au niveau N2.',
      conceptNote: 'Un bon triage réduit la fatigue d’alertes et accélère le temps de détection (MTTD).',
    },
    {
      title: '4. Cartographie de l’attaque avec MITRE ATT&CK',
      caption:
        'Le SOC classe chaque comportement malveillant dans la matrice MITRE ATT&CK : Accès Initial (Phishing), Exécution (PowerShell), Mouvement Latéral (RDP/SMB) puis Exfiltration.',
      conceptNote: 'MITRE ATT&CK offre un langage universel pour comprendre et bloquer l’attaquant.',
    },
    {
      title: '5. Orchestration & Remédiation Automatisée (SOAR)',
      caption:
        'Dès qu’une menace est confirmée, un playbook SOAR exécute la réponse en quelques secondes : isolation réseau EDR du poste compromis, révocation de session et blocage de l’IP au pare-feu.',
      conceptNote: 'SOAR réduit le temps de réponse (MTTR) de plusieurs heures à quelques secondes.',
    },
    {
      title: '6. Retour d’expérience & Durcissement continu',
      caption:
        'Une fois la crise contenue, le SOC documente les indicateurs de compromission (IoC), crée une nouvelle règle de détection KQL et renforce les politiques pare-feu.',
      conceptNote: 'Chaque incident résolu rend Cyberland plus résilient face aux prochaines vagues.',
    },
  ],
  17: [
    {
      title: '1. Control Plane & Worker Nodes — Le cerveau du cluster',
      caption:
        'Dans un cluster Kubernetes, le Control Plane (API Server, Scheduler, etcd) orchestre les décisions tandis que les Worker Nodes exécutent concrètement les conteneurs applicatifs.',
      conceptNote: 'Architecture déclarative : on décrit l’état désiré en YAML, Kubernetes le maintient.',
    },
    {
      title: '2. Le Pod — La plus petite unité déployable',
      caption:
        'Kubernetes ne déploie pas un conteneur isolé mais un Pod : une enveloppe qui fournit une adresse IP dédiée et un espace réseau partagé à un ou plusieurs conteneurs.',
      conceptNote: 'Les Pods sont éphémères : si un Pod redémarre, son adresse IP change !',
    },
    {
      title: '3. Deployment & Auto-réparation (Self-Healing)',
      caption:
        'Si vous demandez 3 réplicas dans un Deployment et qu’un Pod plante, le contrôleur détecte l’écart immédiatement et en recrée un neuf sur un nœud sain sans intervention humaine.',
      conceptNote: 'Self-Healing : l’orchestrateur maintient toujours le nombre exact de réplicas.',
    },
    {
      title: '4. Service (ClusterIP) & DNS interne CoreDNS',
      caption:
        'Comme l’IP d’un Pod est temporaire, un objet Service offre une adresse IP stable et un nom DNS interne (ex. api-paiement.default.svc) qui répartit automatiquement la charge.',
      conceptNote: 'Le Service découple le client des IP éphémères des Pods derrière lui.',
    },
    {
      title: '5. Ingress Controller — Le portail HTTPS externe',
      caption:
        'Pour exposer les applications sur Internet en sécurité, l’Ingress Controller termine le chiffrement TLS/HTTPS et route chaque URL (/billets, /meteo) vers le bon Service interne.',
      conceptNote: '1 seul point d’entrée HTTPS gouverne finement tout le trafic entrant du cluster.',
    },
    {
      title: '6. NetworkPolicy — Micro-segmentation Zero Trust',
      caption:
        'Par défaut dans Kubernetes, tous les Pods peuvent se parler. Une NetworkPolicy applique le Zero Trust : seul le Pod API peut interroger la Base SQL sur le port 5432, tout le reste est bloqué.',
      conceptNote: 'NetworkPolicy = pare-feu logiciel interne entre Pods et Namespaces.',
    },
  ],
  18: [
    {
      title: '1. Pourquoi le NAT est indispensable en IPv4',
      caption:
        'Les adresses IPv4 publiques sont rares. Grâce au NAT (et au PAT par numéros de ports), une seule IP publique de passerelle permet à 50 postes privés (192.168.1.x) de naviguer simultanément.',
      conceptNote: 'NAT/PAT traduit IP privée + port source ↔ IP publique + port unique dans sa table.',
    },
    {
      title: '2. Port Forwarding (DNAT) vs Pare-feu Stateful',
      caption:
        'Un pare-feu Stateful autorise automatiquement la réponse à une connexion sortante que vous avez initiée, mais bloque tout flux entrant non sollicité sauf règle DNAT explicite (ex. port 443).',
      conceptNote: 'Stateful = mémoire de l’état des sessions actives (SYN → SYN-ACK → ESTABLISHED).',
    },
    {
      title: '3. Encapsulation dans un Tunnel VPN chiffré',
      caption:
        'Un VPN enveloppe intégralement votre paquet privé (en-tête IP interne + données) dans un nouveau paquet chiffré traversant Internet : votre opérateur ne voit ni le contenu ni le serveur interne.',
      conceptNote: 'Encapsulation VPN : le paquet privé voyage dans une capsule blindée sur le WAN.',
    },
    {
      title: '4. WireGuard (Moderne UDP 51820) vs IPSec (Historique)',
      caption:
        'IPSec repose sur une négociation complexe (IKEv2 + ESP), tandis que WireGuard utilise des paires de clés cryptographiques modernes et un code ultra-léger intégré au noyau Linux.',
      conceptNote: 'WireGuard : reconnexion instantanée en mobilité et performances réseau supérieures.',
    },
    {
      title: '5. VPN Nomade (Client-to-Site) vs Site-to-Site',
      caption:
        'Le VPN nomade relie un télétravailleur à l’entreprise, alors que le VPN Site-to-Site interconnecte en permanence deux passerelles (ex. siège social ↔ VPC Cloud Azure/AWS).',
      conceptNote: 'Deux usages complémentaires pour étendre un réseau privé de façon transparente.',
    },
    {
      title: '6. Split Tunneling vs Full Tunnel — Arbitrage Sécurité',
      caption:
        'En Split Tunneling, seul le trafic interne passe par le VPN (bande passante économisée). En Full Tunnel, 100 % du trafic est chiffré et filtré par le pare-feu de l’entreprise (idéal sur Wi-Fi public).',
      conceptNote: 'Sur un Wi-Fi d’hôtel ou d’aéroport, privilégiez toujours le Full Tunnel.',
    },
  ],
  19: [
    {
      title: '1. Créer un serveur : Physique vs VPS / VM Cloud & OS LTS',
      caption:
        'Pour créer un serveur, on provisionne une machine physique ou une VM/VPS dans le Cloud (vCPU, RAM, SSD NVMe, IP publique fixe) et on installe un OS serveur stable comme Ubuntu Server 24.04 LTS ou Debian sans interface graphique inutile.',
      conceptNote: 'LTS (Long Term Support) garantit 5 ans de mises à jour de sécurité critiques.',
    },
    {
      title: '2. Premier démarrage : Mises à jour, compte sudo & Durcissement SSH',
      caption:
        'Dès la création, on met à jour le système (apt update && upgrade), on crée un utilisateur non-root avec sudo, on déploie une clé SSH Ed25519 et on désactive la connexion root et par mot de passe.',
      conceptNote: 'Ne laissez jamais root + mot de passe ouverts sur le port 22 !',
    },
    {
      title: '3. Configurer le service Web : Reverse Proxy Nginx + HTTPS TLS',
      caption:
        'Votre application écoute uniquement en local (127.0.0.1:3000) gérée par systemd. Devant elle, Nginx joue le rôle de Reverse Proxy sur le port 443 avec un certificat TLS Let’s Encrypt automatique.',
      conceptNote: 'Nginx gère le chiffrement HTTPS, la compression et isole votre code applicatif.',
    },
    {
      title: '4. Où placer le Pare-feu ? Architecture DMZ & Double Cloison',
      caption:
        'On place un premier pare-feu périmétrique (FW1) entre Internet et le serveur Web en zone DMZ, puis un second pare-feu interne (FW2) entre la DMZ et la base de données sur le réseau privé.',
      conceptNote: 'Même si le serveur Web est compromis, la base de données reste isolée derrière FW2.',
    },
    {
      title: '5. Configurer les règles Pare-feu (UFW / nftables) : Tout bloquer par défaut',
      caption:
        'On applique la politique « ufw default deny incoming », puis on ouvre uniquement 443/tcp (HTTPS public), 80/tcp (redirection) et 22/tcp restreint à votre IP fixe ou VPN. Les ports 5432 et 23 sont bloqués.',
      conceptNote: 'Règle d’or : autorisez SSH AVANT d’exécuter « ufw enable ».',
    },
    {
      title: '6. Production durable : Fail2ban, Logs & Sauvegardes chiffrées',
      caption:
        'Pour garder un serveur fiable 24/7, on ajoute Fail2ban (bannit automatiquement les IP qui tentent de forcer SSH), les mises à jour automatiques de sécurité et des sauvegardes externes chiffrées (règle 3-2-1).',
      conceptNote: 'Un bon serveur est durci, filtré, supervisé et toujours restaurable.',
    },
  ],
  20: [
    {
      title: '1. Switch L2 & Limite du réseau plat (Domaine de diffusion)',
      caption:
        'Sans segmentation, tous les postes (Direction, Employés, Invités, Serveurs) partagent un seul domaine de broadcast : une infection ou un scan ARP depuis le Wi-Fi visiteurs atteint immédiatement les serveurs critiques.',
      conceptNote: 'Un réseau plat = zéro cloisonnement en cas de compromission.',
    },
    {
      title: '2. Découpage logique en VLANs (Virtual LAN)',
      caption:
        'Sur un même switch administrable, on crée des réseaux virtuels indépendants : VLAN 10 (Direction), VLAN 20 (Employés), VLAN 30 (Invités) et VLAN 99 (Serveurs). Les ports des postes sont configurés en mode Access.',
      conceptNote: 'Un port Access appartient à un seul VLAN (trames non étiquetées côté PC).',
    },
    {
      title: '3. Étiquetage IEEE 802.1Q & Lien Trunk multi-VLAN',
      caption:
        'Pour transporter les 4 VLANs sur un seul câble fibre/RJ45 vers le routeur cœur ou un second switch, on active un port Trunk qui insère une étiquette 802.1Q (4 octets avec le VLAN ID) dans chaque trame Ethernet.',
      conceptNote: 'Port Trunk = autoroute multi-VLAN avec étiquettes 802.1Q.',
    },
    {
      title: '4. Routage Inter-VLAN & Contrôle par ACL',
      caption:
        'Pour faire communiquer deux VLANs autorisés (ex. Employés → Serveur ERP), les paquets montent au routeur L3 (Router-on-a-Stick) qui applique des ACL strictes et bloque Invités → Serveurs.',
      conceptNote: 'Le routage Inter-VLAN rétablit uniquement les flux métier légitimes.',
    },
    {
      title: '5. Wi-Fi Entreprise : WPA3-Enterprise (802.1X / RADIUS)',
      caption:
        'Sur la borne Wi-Fi, le SSID Corporate utilise WPA3-Enterprise : chaque salarié s’authentifie via son compte ou certificat vérifié par le serveur RADIUS. Aucun mot de passe partagé à changer lors d’un départ.',
      conceptNote: '802.1X/RADIUS garantit l’identité individuelle et la révocation instantanée.',
    },
    {
      title: '6. Wi-Fi Visiteurs isolé (VLAN 30) & Client Isolation',
      caption:
        'Le second SSID « Cyberland-Guest » bascule automatiquement les visiteurs dans le VLAN 30 avec Client Isolation (les téléphones ne peuvent pas se voir entre eux) et accès Internet uniquement.',
      conceptNote: 'Segmentation L2 + WPA3 + ACL = campus moderne prêt pour la production.',
    },
  ],
  21: [
    {
      title: '1. Pénurie IPv4 (32 bits) vs Abondance IPv6 (128 bits)',
      caption:
        'IPv4 n’offre que 4,3 milliards d’adresses publiques, obligeant à empiler du NAT. IPv6 passe sur 128 bits : 340 sextillions d’adresses (3,4 × 10³⁸), soit assez pour donner une adresse unique à chaque appareil sur Terre.',
      conceptNote: 'IPv6 supprime le besoin de NAT et redonne une connectivité de bout en bout.',
    },
    {
      title: '2. Anatomie & Règles de compression RFC 5952',
      caption:
        'Une adresse IPv6 se lit en 8 blocs de 4 chiffres hexadécimaux séparés par « : ». On supprime les zéros en tête de chaque bloc et on remplace UNE seule fois la plus longue suite de blocs à zéro par « :: ».',
      conceptNote: 'Jamais deux « :: » dans la même adresse, sinon le routeur ne sait plus combien de zéros restaurer.',
    },
    {
      title: '3. Familles de préfixes : ::1, fe80::, fc00:: et 2000::',
      caption:
        'Chaque préfixe a un rôle précis : ::1 est la boucle locale (loopback), fe80::/10 ne sort jamais du LAN (Link-Local), fc00::/7 correspond aux réseaux privés (ULA) et 2000::/3 aux adresses publiques routables sur Internet.',
      conceptNote: 'Un même poste possède souvent simultanément une fe80:: (LAN) et une 2001:... (Internet).',
    },
    {
      title: '4. Auto-configuration sans serveur : SLAAC & NDP',
      caption:
        'Avec IPv6, ARP disparaît au profit de NDP (ICMPv6). Le poste envoie un Router Solicitation (RS), le routeur répond par un Router Advertisement (RA) avec le préfixe /64, et l’appareil génère seul son identifiant d’interface.',
      conceptNote: 'SLAAC permet le branchement réseau instantané sans même déployer de serveur DHCPv6.',
    },
    {
      title: '5. Transition en douceur : Dual-Stack, DNS AAAA & Happy Eyeballs',
      caption:
        'On ne coupe pas IPv4 du jour au lendemain : les serveurs tournent en Dual-Stack (IPv4 + IPv6) et publient des enregistrements DNS A et AAAA. Les navigateurs tentent IPv6 en priorité avec bascule rapide (Happy Eyeballs).',
      conceptNote: 'Pensez toujours à dupliquer vos règles de pare-feu sur IPv6 (ip6tables/nftables) !',
    },
  ],
  22: [
    {
      title: '1. Passerelle API (API Gateway) & Surface d’attaque moderne',
      caption:
        'Les applications mobiles et SPA parlent directement à des API JSON (/api/v1/orders). La passerelle API centralise TLS, l’authentification, les quotas (Rate Limiting) et le filtrage avant d’atteindre les microservices.',
      conceptNote: 'Cacher une URL d’API ne protège rien : chaque endpoint doit vérifier identité ET droits.',
    },
    {
      title: '2. OAuth 2.0 : Authorization Code Flow + PKCE',
      caption:
        'Pour déléguer l’accès sans jamais partager le mot de passe au client, l’app génère un code_verifier secret, envoie son hash (code_challenge), reçoit un code temporaire puis l’échange contre un jeton d’accès sécurisé.',
      conceptNote: 'PKCE empêche le vol du code d’autorisation par une application malveillante sur mobile ou SPA.',
    },
    {
      title: '3. Anatomie d’un JWT : Header · Payload · Signature',
      caption:
        'Un JSON Web Token comprend 3 parties Base64Url : l’en-tête (algorithme RS256), le payload lisible par tous (sub, role, exp) et la signature cryptographique vérifiée via la clé publique JWKS du serveur d’identité.',
      conceptNote: 'Un JWT est signé contre la falsification, mais NON chiffré : n’y mettez jamais de secret !',
    },
    {
      title: '4. Pièges JWT : alg:none, durée courte & Refresh Token',
      caption:
        'Un attaquant tente de modifier role:"admin" et de passer alg:"none" pour retirer la signature. Le backend doit imposer une liste blanche stricte d’algorithmes (RS256/ES256) et utiliser des Access Tokens courts (15 min) + Refresh Tokens rotatifs.',
      conceptNote: 'Toujours vérifier signature, algorithme attendu, émetteur (iss), audience (aud) et expiration (exp).',
    },
    {
      title: '5. Défense OWASP API Top 10 : IDOR / BOLA & Rate Limiting',
      caption:
        'Changer /factures/1042 en /factures/1043 pour lire le dossier d’un autre client est la faille #1 (BOLA/IDOR). Le serveur doit contrôler req.user.id === facture.ownerId, utiliser des UUID et limiter le débit par client.',
      conceptNote: 'Authentification (qui êtes-vous ?) ≠ Autorisation (avez-vous le droit sur CET objet ?).',
    },
  ],
};

const PIZZA_LAYERS = [
  { label: 'Application & Données', pizza: 'Votre recette / Dégustation' },
  { label: 'Environnement (Runtime)', pizza: 'Four chaud & Pâte prête' },
  { label: 'Système (OS)', pizza: 'Plan de travail & Ustensiles' },
  { label: 'Virtualisation & Serveurs', pizza: 'Cuisine & Alimentation électrique' },
];

export const IslandAnimationPlayer: React.FC<IslandAnimationPlayerProps> = ({
  islandId,
  defaultSpeechRate = 1,
  onStartGame,
}) => {
  const scenes = SCENES_BY_ISLAND[islandId] ?? SCENES_BY_ISLAND[1];
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(defaultSpeechRate);
  const [selectedCloudModel, setSelectedCloudModel] = useState<
    'onprem' | 'iaas' | 'paas' | 'saas'
  >('onprem');

  useEffect(() => {
    setSpeechRate(defaultSpeechRate);
  }, [defaultSpeechRate]);

  const speechSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    setStep(0);
    setPlaying(true);
    setIsSpeaking(false);
    if (speechSupported) {
      window.speechSynthesis.cancel();
    }
  }, [islandId, speechSupported]);

  useEffect(() => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (!voiceEnabled) return;

    const scene = scenes[step] ?? scenes[0];
    if (!scene) return;

    let cancelled = false;
    let nextStepTimeout: number | null = null;

    const utterance = new SpeechSynthesisUtterance(`${scene.title}. ${scene.caption}`);
    utterance.lang = 'fr-FR';
    utterance.rate = speechRate;
    utterance.onstart = () => {
      if (!cancelled) setIsSpeaking(true);
    };
    utterance.onend = () => {
      if (cancelled) return;
      setIsSpeaking(false);
      if (playing) {
        nextStepTimeout = window.setTimeout(() => {
          if (cancelled) return;
          setStep((prev) => {
            if (prev >= scenes.length - 1) {
              setPlaying(false);
              return prev;
            }
            return prev + 1;
          });
        }, 650);
      }
    };
    utterance.onerror = () => {
      if (!cancelled) setIsSpeaking(false);
    };
    window.speechSynthesis.speak(utterance);

    return () => {
      cancelled = true;
      if (nextStepTimeout !== null) window.clearTimeout(nextStepTimeout);
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [voiceEnabled, step, scenes, speechSupported, speechRate, playing]);

  useEffect(() => {
    if (islandId === 4) {
      const mapping: ('onprem' | 'iaas' | 'paas' | 'saas')[] = ['onprem', 'iaas', 'paas', 'saas'];
      setSelectedCloudModel(mapping[step] ?? 'onprem');
    }
  }, [islandId, step]);

  useEffect(() => {
    if (!playing || (voiceEnabled && speechSupported)) return;
    const timer = window.setInterval(() => {
      setStep((prev) => {
        if (prev >= scenes.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 4200);
    return () => window.clearInterval(timer);
  }, [playing, scenes.length, voiceEnabled, speechSupported]);

  const currentScene = scenes[step] ?? scenes[0];

  const handleStepChange = (nextStep: number) => {
    playPacket();
    setStep(Math.max(0, Math.min(scenes.length - 1, nextStep)));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 65% Stage */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-5 py-3 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold truncate">{currentScene.title}</span>
          <span className="font-mono text-xs text-slate-300 tabular-nums shrink-0">
            Plan {step + 1} / {scenes.length}
          </span>
        </div>

        {/* Interactive Visual Stage */}
        <div className="p-6 bg-[#F4F8FC] dark:bg-slate-800/70 min-h-[340px] flex flex-col justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${islandId}-${step}`}
              initial={{ opacity: 0, x: 14, scale: 0.99 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.99 }}
              transition={{ duration: 0.22, ease: EASE_SWISS }}
              className="w-full"
            >
          {islandId === 1 && <Island1Visual step={step} />}
          {islandId === 2 && <Island2Visual step={step} />}
          {islandId === 3 && <Island3Visual step={step} />}
          {islandId === 4 && (
            <Island4Visual
              model={selectedCloudModel}
              onSelectModel={(m) => {
                playClick();
                setPlaying(false);
                setSelectedCloudModel(m);
                const idx = ['onprem', 'iaas', 'paas', 'saas'].indexOf(m);
                if (idx >= 0) setStep(idx);
              }}
            />
          )}
          {islandId === 5 && <Island5Visual step={step} />}
          {islandId === 6 && <Island6Visual step={step} />}
          {islandId === 7 && (
            <Island7Visual
              step={step}
              onSelectStep={(idx) => {
                playClick();
                setPlaying(false);
                setStep(idx);
              }}
            />
          )}
          {islandId === 8 && <Island8Visual step={step} />}
          {islandId === 9 && <Island9Visual step={step} />}
          {islandId === 10 && <Island10Visual step={step} />}
          {islandId === 11 && <Island11Visual step={step} />}
          {islandId === 12 && <Island12Visual step={step} />}
          {islandId === 13 && <Island13Visual step={step} />}
          {islandId === 14 && <Island14Visual step={step} />}
          {islandId === 15 && <Island15Visual step={step} />}
          {islandId === 16 && <Island16Visual step={step} />}
          {islandId === 17 && <Island17Visual step={step} />}
          {islandId === 18 && <Island18Visual step={step} />}
          {islandId === 19 && <Island19Visual step={step} />}
          {islandId === 20 && <Island20Visual step={step} />}
          {islandId === 21 && <Island21Visual step={step} />}
          {islandId === 22 && <Island22Visual step={step} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Playback Controls Bar */}
        <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playClick();
                if (step === scenes.length - 1 && !playing) {
                  setStep(0);
                  setPlaying(true);
                } else {
                  setPlaying((p) => !p);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap"
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {playing ? 'Pause' : 'Lecture'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                handleStepChange(step - 1);
              }}
              disabled={step === 0}
              aria-label="Étape précédente"
              className="p-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                handleStepChange(step + 1);
              }}
              disabled={step === scenes.length - 1}
              aria-label="Étape suivante"
              className="p-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setStep(0);
                setPlaying(true);
              }}
              aria-label="Recommencer"
              className="p-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {speechSupported && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setVoiceEnabled((v) => !v);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                    voiceEnabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  )}
                  {voiceEnabled
                    ? isSpeaking
                      ? 'Narration synchronisée...'
                      : 'Voix off active'
                    : 'Lire la voix off'}
                </button>
                <select
                  aria-label="Vitesse de la voix off"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(Number(e.target.value))}
                  className="px-2 py-2 text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
                >
                  <option value={0.85}>0.85x</option>
                  <option value={1}>1.0x</option>
                  <option value={1.25}>1.25x</option>
                </select>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {scenes.map((s, idx) => (
              <button
                key={s.title}
                type="button"
                onClick={() => {
                  setPlaying(false);
                  handleStepChange(idx);
                }}
                aria-label={`Aller au plan ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === step
                    ? 'w-8 bg-sky-700 dark:bg-sky-400'
                    : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right 35% Voice-over & Concept Deck */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <p className="font-medium text-slate-500 dark:text-slate-400">
              Voix off synchronisée
            </p>
            {voiceEnabled && (
              <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {isSpeaking ? `Audio · ${speechRate}x` : 'Enchaînement auto'}
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            {currentScene.title}
          </h3>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {currentScene.caption}
        </p>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1">
          <p className="text-xs font-semibold text-sky-800 dark:text-sky-400">
            À retenir sur ce plan
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {currentScene.conceptNote}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">Plans de la capsule</p>
          <div className="space-y-1.5">
            {scenes.map((s, idx) => (
              <button
                key={s.title}
                type="button"
                onClick={() => {
                  setPlaying(false);
                  handleStepChange(idx);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  idx === step
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            playClick();
            onStartGame();
          }}
          className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
        >
          Passer au mini-jeu pratique
        </button>
      </div>
    </div>
  );
};

/* --- Bespoke Animated SVG Diagrams per Island --- */

const Island1Visual: React.FC<{ step: number }> = ({ step }) => (
  <svg viewBox="0 0 640 260" className="w-full h-auto" role="img" aria-label="Découpage d'une lettre en 4 paquets">
    {/* Sea / Ground */}
    <rect x="0" y="0" width="640" height="260" rx="12" fill="#EBF4FA" />
    {/* Routes */}
    <path
      d="M 115 130 Q 320 45 525 130"
      fill="none"
      stroke={step >= 2 ? '#0284C7' : '#CBD5E1'}
      strokeWidth="3"
      strokeDasharray="6 6"
    />
    <path
      d="M 115 130 Q 320 225 525 130"
      fill="none"
      stroke={step >= 2 ? '#059669' : '#CBD5E1'}
      strokeWidth="3"
      strokeDasharray="6 6"
    />
    <text x="320" y="42" textAnchor="middle" className="fill-sky-800 text-[11px] font-semibold">
      Route Nord · Fibre optique
    </text>
    <text x="320" y="232" textAnchor="middle" className="fill-emerald-800 text-[11px] font-semibold">
      Route Sud · Relais Wi-Fi (contournement orage)
    </text>

    {/* Origin Hut */}
    <rect x="30" y="95" width="90" height="70" rx="10" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
    <text x="75" y="126" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
      Cabane A
    </text>
    <text x="75" y="144" textAnchor="middle" className="fill-slate-500 text-[10px]">
      Émetteur
    </text>

    {/* Destination Lighthouse */}
    <rect x="520" y="95" width="90" height="70" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
    <text x="565" y="126" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
      Phare B
    </text>
    <text x="565" y="144" textAnchor="middle" className="fill-sky-700 text-[10px] font-semibold">
      {step === 3 ? 'Reconstitué' : 'Destinataire'}
    </text>

    {/* Step 0: Giant heavy letter */}
    {step === 0 && (
      <g transform="translate(150, 92)">
        <rect width="120" height="76" rx="8" fill="#FEF3C7" stroke="#D97706" strokeWidth="2.5" />
        <text x="60" y="34" textAnchor="middle" className="fill-amber-900 text-[12px] font-bold">
          Lettre 100 Mo
        </text>
        <text x="60" y="54" textAnchor="middle" className="fill-amber-800 text-[10px]">
          Trop lourde pour 1 oiseau
        </text>
      </g>
    )}

    {/* Step 1: Split into 4 numbered packets */}
    {step === 1 &&
      ['1/4', '2/4', '3/4', '4/4'].map((label, i) => (
        <g key={label} transform={`translate(${155 + i * 52}, 108)`}>
          <rect width="42" height="44" rx="6" fill="#0284C7" />
          <text x="21" y="26" textAnchor="middle" className="fill-white text-[12px] font-mono font-bold">
            {label}
          </text>
        </g>
      ))}

    {/* Step 2: Flying along 2 distinct routes */}
    {step === 2 && (
      <>
        {[
          { label: '1/4', x: 230, y: 74, fill: '#0284C7' },
          { label: '3/4', x: 315, y: 62, fill: '#0284C7' },
          { label: '4/4', x: 395, y: 78, fill: '#0284C7' },
          { label: '2/4', x: 310, y: 180, fill: '#059669' },
        ].map((p) => (
          <g key={p.label} transform={`translate(${p.x}, ${p.y})`}>
            <rect width="44" height="32" rx="6" fill={p.fill} />
            <text x="22" y="20" textAnchor="middle" className="fill-white text-[11px] font-mono font-bold">
              {p.label}
            </text>
          </g>
        ))}
        {/* Storm obstacle */}
        <g transform="translate(275, 118)">
          <rect width="90" height="34" rx="8" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
          <text x="45" y="21" textAnchor="middle" className="fill-red-800 text-[10px] font-semibold">
            Zone d&apos;orage
          </text>
        </g>
      </>
    )}

    {/* Step 3: Reassembled at Lighthouse */}
    {step === 3 && (
      <g transform="translate(360, 92)">
        <rect width="142" height="76" rx="8" fill="#ECFDF5" stroke="#059669" strokeWidth="2.5" />
        <text x="71" y="28" textAnchor="middle" className="fill-emerald-900 text-[11px] font-bold">
          Réassemblage 1→2→3→4
        </text>
        <text x="71" y="50" textAnchor="middle" className="fill-emerald-700 text-[11px] font-mono">
          [1/4][2/4][3/4][4/4]
        </text>
      </g>
    )}
  </svg>
);

const Island2Visual: React.FC<{ step: number }> = ({ step }) => (
  <svg viewBox="0 0 640 260" className="w-full h-auto" role="img" aria-label="Résolution DNS et Routage IP">
    <rect x="0" y="0" width="640" height="260" rx="12" fill="#EBF4FA" />
    {/* Ship */}
    <rect x="28" y="150" width="124" height="68" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
    <text x="90" y="177" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
      Navire Client
    </text>
    <text x="90" y="198" textAnchor="middle" className="fill-sky-700 text-[10px] font-mono">
      {step >= 1 ? '192.168.1.42' : 'ile-des-palmiers.gem'}
    </text>

    {/* DNS Tower */}
    <rect
      x="250"
      y="22"
      width="140"
      height="66"
      rx="10"
      fill={step === 1 ? '#FEF3C7' : '#FFFFFF'}
      stroke={step === 1 ? '#D97706' : '#94A3B8'}
      strokeWidth="2"
    />
    <text x="320" y="48" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
      Tour DNS (Annuaire)
    </text>
    <text x="320" y="68" textAnchor="middle" className="fill-amber-800 text-[10px] font-mono">
      .gem → 192.168.1.42
    </text>

    {/* Router Lighthouse */}
    <rect
      x="255"
      y="150"
      width="130"
      height="68"
      rx="10"
      fill={step === 2 ? '#E0F2FE' : '#FFFFFF'}
      stroke={step >= 2 ? '#0284C7' : '#94A3B8'}
      strokeWidth="2"
    />
    <text x="320" y="177" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
      Phare Routeur
    </text>
    <text x="320" y="198" textAnchor="middle" className="fill-slate-600 text-[10px] font-mono">
      Table : 192.168.1.x → Est
    </text>

    {/* Destination Island */}
    <rect
      x="470"
      y="150"
      width="142"
      height="68"
      rx="10"
      fill={step === 3 ? '#ECFDF5' : '#FFFFFF'}
      stroke={step === 3 ? '#059669' : '#94A3B8'}
      strokeWidth="2"
    />
    <text x="541" y="175" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
      Île des Palmiers
    </text>
    <text x="541" y="193" textAnchor="middle" className="fill-emerald-800 text-[10px] font-mono">
      IP : 192.168.1.42
    </text>
    <text x="541" y="209" textAnchor="middle" className="fill-slate-500 text-[9px] font-mono">
      MAC : A4:5E:60:C1:09
    </text>

    {/* Arrows */}
    {step >= 1 && (
      <path d="M 110 150 L 250 62" stroke="#D97706" strokeWidth="2.5" strokeDasharray="5 4" />
    )}
    {step >= 2 && <path d="M 152 184 L 255 184" stroke="#0284C7" strokeWidth="3" />}
    {step >= 3 && <path d="M 385 184 L 470 184" stroke="#059669" strokeWidth="3" />}
  </svg>
);

const Island3Visual: React.FC<{ step: number }> = ({ step }) => (
  <svg viewBox="0 0 640 260" className="w-full h-auto" role="img" aria-label="TCP vs UDP et chiffrement HTTPS">
    <rect x="0" y="0" width="640" height="260" rx="12" fill="#EBF4FA" />

    {step <= 1 ? (
      <>
        {/* Split TCP vs UDP */}
        <rect
          x="24"
          y="24"
          width="284"
          height="212"
          rx="10"
          fill="#FFFFFF"
          stroke={step === 0 ? '#0284C7' : '#CBD5E1'}
          strokeWidth={step === 0 ? '2.5' : '1.5'}
        />
        <text x="44" y="54" className="fill-sky-900 text-[14px] font-bold">
          TCP — Le méticuleux
        </text>
        <text x="44" y="76" className="fill-slate-600 text-[11px]">
          Vérifie chaque colis avec accusé (ACK)
        </text>
        <rect x="44" y="100" width="110" height="32" rx="6" fill="#0284C7" />
        <text x="99" y="120" textAnchor="middle" className="fill-white text-[11px] font-mono">
          Colis #1 →
        </text>
        <rect x="174" y="100" width="110" height="32" rx="6" fill="#ECFDF5" stroke="#059669" />
        <text x="229" y="120" textAnchor="middle" className="fill-emerald-800 text-[11px] font-mono">
          ← ACK #1 OK
        </text>
        <rect x="44" y="150" width="240" height="32" rx="6" fill="#FEF3C7" stroke="#D97706" />
        <text x="164" y="170" textAnchor="middle" className="fill-amber-900 text-[11px] font-semibold">
          Colis #2 perdu → Renvoyé automatiquement
        </text>

        <rect
          x="332"
          y="24"
          width="284"
          height="212"
          rx="10"
          fill="#FFFFFF"
          stroke={step === 1 ? '#059669' : '#CBD5E1'}
          strokeWidth={step === 1 ? '2.5' : '1.5'}
        />
        <text x="352" y="54" className="fill-emerald-900 text-[14px] font-bold">
          UDP — Le pressé
        </text>
        <text x="352" y="76" className="fill-slate-600 text-[11px]">
          Envoi continu sans attente (direct)
        </text>
        {[0, 1, 2, 3].map((b) => (
          <circle
            key={b}
            cx={380 + b * 62}
            cy={b === 2 ? 158 : 122}
            r="15"
            fill={b === 2 ? '#FCA5A5' : '#10B981'}
          />
        ))}
        <text x="352" y="204" className="fill-slate-600 text-[11px]">
          1 balle perdue ? Le match continue sans pause.
        </text>
      </>
    ) : (
      <>
        {/* HTTPS & Firewall */}
        <rect x="30" y="65" width="150" height="120" rx="10" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
        <text x="105" y="102" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
          Message d&apos;origine
        </text>
        <text x="105" y="132" textAnchor="middle" className="fill-slate-700 text-[11px] font-mono">
          &quot;Code: 4829&quot;
        </text>

        <rect
          x="220"
          y="55"
          width="200"
          height="140"
          rx="10"
          fill={step === 2 ? '#FEF3C7' : '#ECFDF5'}
          stroke={step === 2 ? '#D97706' : '#059669'}
          strokeWidth="2.5"
        />
        <text x="320" y="90" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
          {step === 2 ? 'Chiffrement HTTPS (443)' : 'Pare-feu du Pont-Levis'}
        </text>
        <text x="320" y="122" textAnchor="middle" className="fill-slate-800 text-[12px] font-mono font-bold">
          {step === 2 ? '#9fA!2xQ8k$' : 'Port 443 : AUTORISÉ'}
        </text>
        <text x="320" y="152" textAnchor="middle" className="fill-red-700 text-[11px] font-semibold">
          {step === 2 ? 'Pirate bloqué : texte illisible' : 'Port 23 (Telnet) : BLOQUÉ'}
        </text>

        <rect x="460" y="65" width="150" height="120" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
        <text x="535" y="102" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
          Forteresse Serveur
        </text>
        <text x="535" y="132" textAnchor="middle" className="fill-emerald-700 text-[11px] font-semibold">
          Échange protégé
        </text>
      </>
    )}
  </svg>
);

const Island4Visual: React.FC<{
  model: 'onprem' | 'iaas' | 'paas' | 'saas';
  onSelectModel: (m: 'onprem' | 'iaas' | 'paas' | 'saas') => void;
}> = ({ model, onSelectModel }) => {
  // Number of top layers managed by user
  const userManagedCount = model === 'onprem' ? 4 : model === 'iaas' ? 3 : model === 'paas' ? 1 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/80 rounded-lg w-fit">
        {(
          [
            { id: 'onprem', label: 'On-Premise (Maison)' },
            { id: 'iaas', label: 'IaaS (Cuisine louée)' },
            { id: 'paas', label: 'PaaS (Four livré)' },
            { id: 'saas', label: 'SaaS (Restaurant)' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectModel(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              model === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {PIZZA_LAYERS.map((layer, idx) => {
          const isUser = idx < userManagedCount;
          return (
            <div
              key={layer.label}
              className={`px-4 py-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                isUser
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-sky-50 border-sky-300 text-sky-950'
              }`}
            >
              <div>
                <p className="text-sm font-semibold">{layer.label}</p>
                <p className="text-xs opacity-80">Pizzeria : {layer.pizza}</p>
              </div>
              <span className="font-mono text-xs font-semibold shrink-0">
                {isUser ? 'Géré par VOUS' : 'Géré par le CLOUD'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Island5Visual: React.FC<{ step: number }> = ({ step }) => (
  <svg viewBox="0 0 640 260" className="w-full h-auto" role="img" aria-label="Load Balancer et bascule Multi-AZ">
    <rect x="0" y="0" width="640" height="260" rx="12" fill="#EBF4FA" />
    {/* Traffic source */}
    <rect x="24" y="96" width="118" height="68" rx="10" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
    <text x="83" y="126" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
      Visiteurs
    </text>
    <text x="83" y="146" textAnchor="middle" className="fill-sky-700 text-[10px] font-mono">
      100 % Trafic
    </text>

    {/* Load Balancer */}
    <rect x="210" y="92" width="144" height="76" rx="10" fill="#0369A1" />
    <text x="282" y="124" textAnchor="middle" className="fill-white text-[12px] font-bold">
      Load Balancer
    </text>
    <text x="282" y="146" textAnchor="middle" className="fill-sky-100 text-[10px] font-mono">
      {step >= 2 ? 'Failover → Zone B' : '50 % A · 50 % B'}
    </text>

    {/* Zone A */}
    <rect
      x="435"
      y="28"
      width="176"
      height="86"
      rx="10"
      fill={step >= 1 ? '#FEF2F2' : '#FFFFFF'}
      stroke={step >= 1 ? '#DC2626' : '#059669'}
      strokeWidth="2.5"
    />
    <text x="523" y="58" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
      Zone A (Île Est)
    </text>
    <text
      x="523"
      y="82"
      textAnchor="middle"
      className={`text-[11px] font-mono font-semibold ${
        step >= 1 ? 'fill-red-700' : 'fill-emerald-700'
      }`}
    >
      {step >= 1 ? 'PANNE TEMPÊTE (0 %)' : 'NOMINAL (50 %)'}
    </text>

    {/* Zone B */}
    <rect
      x="435"
      y="146"
      width="176"
      height="86"
      rx="10"
      fill="#ECFDF5"
      stroke="#059669"
      strokeWidth="2.5"
    />
    <text x="523" y="174" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
      Zone B (Île Ouest)
    </text>
    <text x="523" y="196" textAnchor="middle" className="fill-emerald-800 text-[11px] font-mono font-semibold">
      {step >= 2 ? 'ACTIF · 100 % TRAFIC' : 'NOMINAL (50 %)'}
    </text>
    {step === 3 && (
      <text x="523" y="216" textAnchor="middle" className="fill-sky-800 text-[10px] font-semibold">
        Snapshot Cloud restauré
      </text>
    )}

    {/* Arrows */}
    <line x1="142" y1="130" x2="210" y2="130" stroke="#0284C7" strokeWidth="3" />
    <line
      x1="354"
      y1="115"
      x2="435"
      y2="71"
      stroke={step >= 1 ? '#DC2626' : '#059669'}
      strokeWidth="2.5"
      strokeDasharray={step >= 1 ? '5 5' : 'none'}
    />
    <line
      x1="354"
      y1="145"
      x2="435"
      y2="189"
      stroke="#059669"
      strokeWidth={step >= 2 ? '4' : '2.5'}
    />
  </svg>
);

const Island6Visual: React.FC<{ step: number }> = ({ step }) => {
  const co2Bars = [110, 52, 26, 16];
  const costBars = [260, 268, 120, 88];
  const co2 = co2Bars[step] ?? 110;
  const cost = costBars[step] ?? 260;

  return (
    <svg viewBox="0 0 640 260" className="w-full h-auto" role="img" aria-label="Optimisation Éco-Cloud et FinOps">
      <rect x="0" y="0" width="640" height="260" rx="12" fill="#EBF4FA" />
      <rect x="30" y="30" width="265" height="200" rx="10" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
      <text x="50" y="60" className="fill-slate-900 text-[13px] font-bold">
        Impact carbone (kg CO₂/mois)
      </text>
      <rect x="50" y="84" width="220" height="26" rx="6" fill="#F1F5F9" />
      <rect
        x="50"
        y="84"
        width={Math.round((co2 / 120) * 220)}
        height="26"
        rx="6"
        fill={co2 <= 35 ? '#059669' : '#DC2626'}
      />
      <text x="50" y="136" className="fill-slate-800 text-[18px] font-mono font-bold">
        {co2} kg CO₂
      </text>
      <text x="50" y="160" className="fill-slate-500 text-[11px]">
        {step === 0
          ? 'Serveurs XXL allumés 24h/24'
          : step === 1
          ? 'Région décarbonée activée'
          : step === 2
          ? 'Extinction nocturne + Right-Sizing'
          : 'Stockages orphelins purgés'}
      </text>

      <rect x="345" y="30" width="265" height="200" rx="10" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
      <text x="365" y="60" className="fill-slate-900 text-[13px] font-bold">
        Facture mensuelle (or)
      </text>
      <rect x="365" y="84" width="220" height="26" rx="6" fill="#F1F5F9" />
      <rect
        x="365"
        y="84"
        width={Math.round((cost / 280) * 220)}
        height="26"
        rx="6"
        fill={cost <= 160 ? '#0284C7' : '#D97706'}
      />
      <text x="365" y="136" className="fill-slate-800 text-[18px] font-mono font-bold">
        {cost} pièces d&apos;or
      </text>
      <text x="365" y="160" className="fill-emerald-700 text-[11px] font-semibold">
        Disponibilité maintenue : 99,9 %
      </text>
    </svg>
  );
};

const NETWORK_SCALE_CARDS = [
  {
    stepIdx: 0,
    code: 'PAN',
    name: 'Personal Area Network',
    range: '1 à 10 m',
    tech: 'Bluetooth, NFC, USB',
    speed: '1 – 50 Mbit/s',
    analogy: 'Écouteurs, montre et capteur météo autour de l’explorateur.',
  },
  {
    stepIdx: 1,
    code: 'LAN / WLAN',
    name: 'Local & Wireless LAN',
    range: '10 à 100 m',
    tech: 'Ethernet (Switch) · Wi-Fi 6',
    speed: '100 Mbit/s – 10 Gbit/s',
    analogy: 'Salle informatique câblée (LAN) et terrasse Wi-Fi (WLAN) du village.',
  },
  {
    stepIdx: 2,
    code: 'MAN',
    name: 'Metropolitan Area Network',
    range: '1 à 50 km',
    tech: 'Boucle fibre optique urbaine',
    speed: '1 – 100 Gbit/s',
    analogy: 'Anneau fibre reliant mairie, hôpital, port et université de l’île.',
  },
  {
    stepIdx: 3,
    code: 'WAN & VPN',
    name: 'Wide Area & Tunnel Privé',
    range: '> 100 km à mondial',
    tech: 'Câbles sous-marins, 5G, Satellite + VPN chiffré',
    speed: 'Très haut débit global',
    analogy: 'Archipel relié au continent (WAN) + tunnel sécurisé de télétravail (VPN).',
  },
];

const Island7Visual: React.FC<{
  step: number;
  onSelectStep: (idx: number) => void;
}> = ({ step, onSelectStep }) => {
  const active = NETWORK_SCALE_CARDS[step] ?? NETWORK_SCALE_CARDS[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-900 rounded-lg w-fit">
        {NETWORK_SCALE_CARDS.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => onSelectStep(item.stepIdx)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              step === item.stepIdx
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {item.code}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Concentric Scale Diagram */}
        <div className="md:col-span-6">
          <svg
            viewBox="0 0 320 220"
            className="w-full h-auto"
            role="img"
            aria-label="Cercles concentriques des échelles PAN, LAN, MAN et WAN"
          >
            <rect x="0" y="0" width="320" height="220" rx="12" fill="#EBF4FA" />
            {/* WAN outer ellipse */}
            <ellipse
              cx="160"
              cy="112"
              rx="142"
              ry="94"
              fill={step === 3 ? '#DBEAFE' : '#FFFFFF'}
              stroke={step === 3 ? '#0369A1' : '#94A3B8'}
              strokeWidth={step === 3 ? '3' : '1.5'}
              strokeDasharray={step === 3 ? 'none' : '5 4'}
            />
            <text x="160" y="34" textAnchor="middle" className="fill-sky-900 text-[10px] font-mono font-bold">
              WAN · Mondial (+ VPN)
            </text>

            {/* MAN ellipse */}
            <ellipse
              cx="160"
              cy="120"
              rx="108"
              ry="70"
              fill={step === 2 ? '#CCFBF1' : '#F8FAFC'}
              stroke={step === 2 ? '#0D9488' : '#94A3B8'}
              strokeWidth={step === 2 ? '3' : '1.5'}
            />
            <text x="160" y="67" textAnchor="middle" className="fill-teal-900 text-[10px] font-mono font-bold">
              MAN · Ville (1–50 km)
            </text>

            {/* LAN / WLAN ellipse */}
            <ellipse
              cx="160"
              cy="130"
              rx="74"
              ry="46"
              fill={step === 1 ? '#E0F2FE' : '#FFFFFF'}
              stroke={step === 1 ? '#0284C7' : '#94A3B8'}
              strokeWidth={step === 1 ? '3' : '1.5'}
            />
            <text x="160" y="101" textAnchor="middle" className="fill-sky-800 text-[10px] font-mono font-bold">
              LAN / WLAN (10–100 m)
            </text>

            {/* PAN inner circle */}
            <ellipse
              cx="160"
              cy="142"
              rx="38"
              ry="22"
              fill={step === 0 ? '#FEF3C7' : '#F8FAFC'}
              stroke={step === 0 ? '#D97706' : '#94A3B8'}
              strokeWidth={step === 0 ? '3' : '1.5'}
            />
            <text x="160" y="146" textAnchor="middle" className="fill-amber-900 text-[10px] font-mono font-bold">
              PAN (1–10 m)
            </text>
          </svg>
        </div>

        {/* Live Telemetry Card for Active Scale */}
        <div className="md:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <div>
            <p className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400">
              {active.code} · {active.range}
            </p>
            <h4 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              {active.name}
            </h4>
          </div>
          <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <p>
              <strong>Technologies :</strong> {active.tech}
            </p>
            <p>
              <strong>Débit typique :</strong>{' '}
              <span className="font-mono tabular-nums">{active.speed}</span>
            </p>
            <p className="pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              <strong>Sur Cyberland :</strong> {active.analogy}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const OSI_VISUAL_LAYERS = [
  { num: 7, name: 'Application', unit: 'Données (HTTPS, DNS)', activeStep: 0 },
  { num: 6, name: 'Présentation', unit: 'Chiffrement TLS / Format', activeStep: 0 },
  { num: 5, name: 'Session', unit: 'Dialogue ouvert', activeStep: 0 },
  { num: 4, name: 'Transport', unit: 'Segment (TCP/UDP · Port 443)', activeStep: 1 },
  { num: 3, name: 'Réseau', unit: 'Paquet (IP · Routeur)', activeStep: 2 },
  { num: 2, name: 'Liaison', unit: 'Trame (MAC · Switch)', activeStep: 3 },
  { num: 1, name: 'Physique', unit: 'Bits 010110 (Fibre / Wi-Fi)', activeStep: 3 },
];

const Island8Visual: React.FC<{ step: number }> = ({ step }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pb-1">
      <span className="font-semibold">Descente d&apos;encapsulation (Couche 7 → Couche 1)</span>
      <span className="font-mono text-sky-700 dark:text-sky-400 font-semibold">
        {step === 0
          ? 'Données applicatives'
          : step === 1
          ? '+ En-tête TCP (Port)'
          : step === 2
          ? '+ En-tête IP (Route)'
          : '+ En-tête MAC → Bits 0/1'}
      </span>
    </div>
    {OSI_VISUAL_LAYERS.map((layer) => {
      const isCurrent = layer.activeStep === step;
      const isPassed = layer.activeStep < step;
      return (
        <div
          key={layer.num}
          className={`px-3.5 py-2 rounded-lg border flex items-center justify-between gap-3 text-xs transition-colors ${
            isCurrent
              ? 'bg-sky-700 border-sky-800 text-white font-semibold'
              : isPassed
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          <span className="font-mono font-bold">
            L{layer.num} · {layer.name}
          </span>
          <span className="font-mono text-[11px] opacity-90 text-right">{layer.unit}</span>
        </div>
      );
    })}
  </div>
);

const Island9Visual: React.FC<{ step: number }> = ({ step }) => (
  <svg viewBox="0 0 640 260" className="w-full h-auto" role="img" aria-label="Comparaison VM Monolithe vs Conteneurs Docker">
    <rect x="0" y="0" width="640" height="260" rx="12" fill="#EBF4FA" />
    {/* Left: Heavy VM */}
    <rect
      x="24"
      y="24"
      width="245"
      height="212"
      rx="10"
      fill={step === 0 ? '#FEF2F2' : '#FFFFFF'}
      stroke={step === 0 ? '#DC2626' : '#CBD5E1'}
      strokeWidth={step === 0 ? '2.5' : '1.5'}
    />
    <text x="146" y="52" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
      Monolithe sur VM classique
    </text>
    <rect x="44" y="68" width="205" height="62" rx="8" fill={step === 0 ? '#FEE2E2' : '#F1F5F9'} stroke="#94A3B8" />
    <text x="146" y="95" textAnchor="middle" className="fill-slate-900 text-[11px] font-bold">
      Billetterie + Météo + Paiement
    </text>
    <text x="146" y="114" textAnchor="middle" className="fill-red-700 text-[10px] font-semibold">
      {step === 0 ? '1 bug Météo = TOUT plante !' : 'Couplage fort'}
    </text>
    <rect x="44" y="140" width="205" height="36" rx="6" fill="#E2E8F0" />
    <text x="146" y="162" textAnchor="middle" className="fill-slate-700 text-[10px] font-mono">
      OS Complet Invité (lourd)
    </text>
    <text x="146" y="210" textAnchor="middle" className="fill-slate-600 text-[11px] font-mono font-bold">
      2 048 Mo RAM · Démarrage 45 s
    </text>

    {/* Right: Docker Microservices */}
    <rect
      x="294"
      y="24"
      width="322"
      height="212"
      rx="10"
      fill="#FFFFFF"
      stroke={step >= 1 ? '#0284C7' : '#CBD5E1'}
      strokeWidth={step >= 1 ? '2.5' : '1.5'}
    />
    <text x="455" y="52" textAnchor="middle" className="fill-sky-900 text-[13px] font-bold">
      Microservices Docker (Isolés)
    </text>

    {[
      { name: 'Billetterie', x: 312, status: step === 3 ? '×3 Réplicas' : 'OK', fill: '#0284C7' },
      { name: 'Météo', x: 386, status: step === 2 ? 'Restart 1s' : 'OK', fill: step === 2 ? '#D97706' : '#059669' },
      { name: 'Paiement', x: 460, status: 'OK', fill: '#059669' },
      { name: 'Cache', x: 534, status: 'OK', fill: '#0D9488' },
    ].map((c) => (
      <g key={c.name} transform={`translate(${c.x}, 72)`}>
        <rect width="66" height="68" rx="8" fill={c.fill} />
        <text x="33" y="29" textAnchor="middle" className="fill-white text-[10px] font-bold">
          {c.name}
        </text>
        <text x="33" y="50" textAnchor="middle" className="fill-white/95 text-[9px] font-mono">
          {c.status}
        </text>
      </g>
    ))}

    <rect x="312" y="152" width="288" height="32" rx="6" fill="#E0F2FE" stroke="#0284C7" />
    <text x="456" y="172" textAnchor="middle" className="fill-sky-900 text-[10px] font-mono font-bold">
      Moteur Docker · Noyau Hôte partagé
    </text>
    <text x="456" y="210" textAnchor="middle" className="fill-emerald-700 text-[11px] font-mono font-bold">
      ~64 Mo / conteneur · Démarrage ~1 s
    </text>
  </svg>
);

const Island10Visual: React.FC<{ step: number }> = ({ step }) => (
  <svg viewBox="0 0 640 260" className="w-full h-auto" role="img" aria-label="Défense contre le Phishing et modèle Zero Trust">
    <rect x="0" y="0" width="640" height="260" rx="12" fill="#EBF4FA" />
    {/* Threat / Signal on left */}
    <rect
      x="28"
      y="46"
      width="210"
      height="168"
      rx="10"
      fill={step <= 1 ? '#FEF2F2' : '#FFFFFF'}
      stroke={step <= 1 ? '#DC2626' : '#94A3B8'}
      strokeWidth="2"
    />
    <text x="133" y="78" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
      {step === 0
        ? 'E-mail de Phishing'
        : step === 1
        ? 'Wi-Fi piège (Evil Twin)'
        : step === 2
        ? 'Mot de passe volé'
        : 'Requête interne / externe'}
    </text>
    <text x="133" y="114" textAnchor="middle" className="fill-red-700 text-[10px] font-mono font-bold">
      {step === 0
        ? 'cyber-land-urgent.xyz'
        : step === 1
        ? 'Free_Wifi_Port (Ouvert)'
        : step === 2
        ? 'Tentative à 02h14'
        : 'Aucune confiance implicite'}
    </text>
    <text x="133" y="150" textAnchor="middle" className="fill-slate-600 text-[10px]">
      {step === 0
        ? 'Domaine maquillé + Urgence'
        : step === 1
        ? 'Risque d’interception'
        : step === 2
        ? 'Attaque par fatigue MFA'
        : 'Vérification systématique'}
    </text>

    {/* Zero Trust Shield Center */}
    <rect x="275" y="64" width="146" height="132" rx="12" fill="#0369A1" />
    <text x="348" y="102" textAnchor="middle" className="fill-white text-[13px] font-bold">
      Bouclier Zero Trust
    </text>
    <text x="348" y="128" textAnchor="middle" className="fill-sky-100 text-[10px] font-mono">
      {step === 0
        ? 'Contrôle Domaine'
        : step === 1
        ? 'Tunnel VPN chiffré'
        : step === 2
        ? 'Clé MFA requise'
        : 'Moindre Privilège'}
    </text>
    <text x="348" y="160" textAnchor="middle" className="fill-emerald-300 text-[11px] font-bold">
      VÉRIFIÉ
    </text>

    {/* Protected Resource Right */}
    <rect x="456" y="64" width="156" height="132" rx="10" fill="#ECFDF5" stroke="#059669" strokeWidth="2.5" />
    <text x="534" y="108" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
      Données Cyberland
    </text>
    <text x="534" y="138" textAnchor="middle" className="fill-emerald-800 text-[11px] font-semibold">
      Comptes protégés
    </text>
    <text x="534" y="162" textAnchor="middle" className="fill-slate-600 text-[10px] font-mono">
      Accès minimal autorisé
    </text>

    <line x1="238" y1="130" x2="275" y2="130" stroke="#0284C7" strokeWidth="3" />
    <line x1="421" y1="130" x2="456" y2="130" stroke="#059669" strokeWidth="3" />
  </svg>
);

const Island11Visual: React.FC<{ step: number }> = ({ step }) => (
  <svg viewBox="0 0 640 260" className="w-full h-auto" role="img" aria-label="Cryptographie symétrique, asymétrique, hachage et TLS">
    <rect x="0" y="0" width="640" height="260" rx="12" fill="#EBF4FA" />
    {/* Input block */}
    <rect x="26" y="64" width="160" height="132" rx="10" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
    <text x="106" y="98" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
      {step === 2 ? 'Mot de passe + Sel' : 'Donnée en clair'}
    </text>
    <text x="106" y="130" textAnchor="middle" className="fill-sky-800 text-[11px] font-mono font-bold">
      {step === 2 ? '"Phare42" + s9x!' : '"Billet #409"'}
    </text>
    <text x="106" y="160" textAnchor="middle" className="fill-slate-500 text-[10px]">
      {step === 0
        ? 'Volume important'
        : step === 1
        ? 'Échange sur Internet'
        : step === 2
        ? 'Sens unique requis'
        : 'Navigation HTTPS'}
    </text>

    {/* Crypto Engine Center */}
    <rect
      x="224"
      y="48"
      width="192"
      height="164"
      rx="12"
      fill={step === 2 ? '#FEF3C7' : step === 3 ? '#ECFDF5' : '#0369A1'}
      stroke={step === 2 ? '#D97706' : step === 3 ? '#059669' : '#0284C7'}
      strokeWidth="2.5"
    />
    <text
      x="320"
      y="86"
      textAnchor="middle"
      className={`text-[13px] font-bold ${step >= 2 ? 'fill-slate-900' : 'fill-white'}`}
    >
      {step === 0
        ? 'Symétrique (AES-256)'
        : step === 1
        ? 'Asymétrique (2 Clés)'
        : step === 2
        ? 'Hachage (SHA-256)'
        : 'Certificat TLS 1.3'}
    </text>
    <text
      x="320"
      y="122"
      textAnchor="middle"
      className={`text-[10px] font-mono font-semibold ${
        step >= 2 ? 'fill-slate-800' : 'fill-sky-100'
      }`}
    >
      {step === 0
        ? '1 Clé Secrète Partagée'
        : step === 1
        ? 'Publique → Verrouille'
        : step === 2
        ? 'Irréversible (Avalanche)'
        : 'Signature + Clé AES'}
    </text>
    <text
      x="320"
      y="156"
      textAnchor="middle"
      className={`text-[10px] font-mono ${step >= 2 ? 'fill-slate-600' : 'fill-emerald-200'}`}
    >
      {step === 0
        ? 'Ultra-rapide (Go/s)'
        : step === 1
        ? 'Privée → Ouvre seul'
        : step === 2
        ? 'Impossible à inverser'
        : 'Identité vérifiée'}
    </text>

    {/* Output block */}
    <rect x="454" y="64" width="160" height="132" rx="10" fill="#FFFFFF" stroke="#059669" strokeWidth="2.5" />
    <text x="534" y="98" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
      {step === 2 ? 'Empreinte stockée' : 'Résultat protégé'}
    </text>
    <text x="534" y="130" textAnchor="middle" className="fill-emerald-800 text-[10px] font-mono font-bold">
      {step === 2 ? '8f4b2c...91ae07' : '9x#K!4pQ2m$z'}
    </text>
    <text x="534" y="160" textAnchor="middle" className="fill-slate-600 text-[10px]">
      {step === 0
        ? 'Déchiffrable avec la clé'
        : step === 1
        ? 'Seule la clé privée lit'
        : step === 2
        ? 'Base de données sûre'
        : 'Cadenas HTTPS actif'}
    </text>

    <line x1="186" y1="130" x2="224" y2="130" stroke="#0284C7" strokeWidth="3" />
    <line x1="416" y1="130" x2="454" y2="130" stroke="#059669" strokeWidth="3" />
  </svg>
);

const Island12Visual: React.FC<{ step: number }> = ({ step }) => (
  <svg viewBox="0 0 640 260" className="w-full h-auto" role="img" aria-label="Pipeline CI/CD, Blue/Green, Canary et Rollback">
    <rect x="0" y="0" width="640" height="260" rx="12" fill="#EBF4FA" />
    {/* Top CI Pipeline bar */}
    {[
      { label: 'Git Commit', x: 24, active: step >= 0 },
      { label: 'Tests Auto', x: 146, active: step >= 0 },
      { label: 'Build Docker', x: 268, active: step >= 1 },
      { label: 'Routeur CD', x: 390, active: step >= 1 },
    ].map((stage, i) => (
      <g key={stage.label}>
        <rect
          x={stage.x}
          y="26"
          width="104"
          height="46"
          rx="8"
          fill={stage.active ? '#0369A1' : '#FFFFFF'}
          stroke={stage.active ? '#0284C7' : '#CBD5E1'}
          strokeWidth="2"
        />
        <text
          x={stage.x + 52}
          y="53"
          textAnchor="middle"
          className={`text-[11px] font-bold ${stage.active ? 'fill-white' : 'fill-slate-700'}`}
        >
          {stage.label}
        </text>
        {i < 3 && (
          <line
            x1={stage.x + 104}
            y1="49"
            x2={stage.x + 122}
            y2="49"
            stroke="#0284C7"
            strokeWidth="2.5"
          />
        )}
      </g>
    ))}

    {/* Blue vs Green production slots */}
    <rect
      x="54"
      y="104"
      width="244"
      height="126"
      rx="10"
      fill="#EFF6FF"
      stroke={step === 3 ? '#0284C7' : '#3B82F6'}
      strokeWidth={step === 3 ? '3' : '2'}
    />
    <text x="176" y="134" textAnchor="middle" className="fill-sky-950 text-[13px] font-bold">
      Environnement BLUE (v2.1 stable)
    </text>
    <text x="176" y="164" textAnchor="middle" className="fill-sky-800 text-[15px] font-mono font-bold">
      {step === 0 || step === 1 ? '100 % du trafic' : step === 2 ? '90 % du trafic' : 'ROLLBACK → 100 %'}
    </text>
    <text x="176" y="196" textAnchor="middle" className="fill-emerald-700 text-[11px] font-semibold">
      Erreurs HTTP 500 : 0,0 %
    </text>

    <rect
      x="342"
      y="104"
      width="244"
      height="126"
      rx="10"
      fill={step === 3 ? '#FEF2F2' : '#ECFDF5'}
      stroke={step === 3 ? '#DC2626' : '#059669'}
      strokeWidth={step === 2 ? '3' : '2'}
    />
    <text x="464" y="134" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
      Environnement GREEN (v2.2 neuve)
    </text>
    <text
      x="464"
      y="164"
      textAnchor="middle"
      className={`text-[15px] font-mono font-bold ${
        step === 3 ? 'fill-red-700' : 'fill-emerald-800'
      }`}
    >
      {step === 0
        ? 'En attente CI...'
        : step === 1
        ? 'Prête (0 % trafic)'
        : step === 2
        ? 'CANARY : 10 % trafic'
        : 'ISOLÉE (0 % trafic)'}
    </text>
    <text
      x="464"
      y="196"
      textAnchor="middle"
      className={`text-[11px] font-semibold ${step === 3 ? 'fill-red-700' : 'fill-slate-600'}`}
    >
      {step === 3
        ? 'Bug détecté → Rollback en 1 s !'
        : step === 2
        ? 'Surveillance temps réel active'
        : 'Zéro coupure utilisateur'}
    </text>
  </svg>
);

const Island13Visual: React.FC<{ step: number }> = ({ step }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => (t + 1) % 60);
    }, 85);
    return () => window.clearInterval(id);
  }, []);

  const progress = tick / 60; // 0..1 continuous motion
  const activeLayerIdx = Math.floor(tick / 15) % 4; // Cycles L2 -> L3 -> L4 -> L7

  return (
    <svg
      viewBox="0 0 640 270"
      className="w-full h-auto"
      role="img"
      aria-label="Animation du fonctionnement de Wireshark et tcpdump"
    >
      <rect x="0" y="0" width="640" height="270" rx="12" fill="#EBF4FA" />

      {/* Plan 0: NIC Promiscuous Mode + libpcap copy animation */}
      {step === 0 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Flux animé : Câble réseau → Carte eth0 (Promiscuité) → Tampon libpcap
          </text>
          {/* Main wire */}
          <line x1="30" y1="95" x2="610" y2="95" stroke="#0284C7" strokeWidth="5" />
          <text x="86" y="76" textAnchor="middle" className="fill-sky-900 text-[10px] font-semibold">
            Trafic Ethernet continu
          </text>
          {/* Moving packets along wire */}
          {[0, 0.33, 0.66].map((offset, i) => {
            const p = (progress + offset) % 1;
            const x = 35 + p * 540;
            const colors = ['#0284C7', '#059669', '#D97706'];
            const labels = ['DNS', 'TLS', 'HTTP'];
            return (
              <g key={i} transform={`translate(${x}, 81)`}>
                <rect width="40" height="26" rx="5" fill={colors[i]} />
                <text x="20" y="17" textAnchor="middle" className="fill-white text-[9px] font-mono font-bold">
                  {labels[i]}
                </text>
              </g>
            );
          })}

          {/* Tap / Promiscuous Mirror down to libpcap */}
          <line x1="320" y1="98" x2="320" y2="165" stroke="#D97706" strokeWidth="3" strokeDasharray="5 4" />
          <circle
            cx="320"
            cy={104 + ((progress * 2) % 1) * 56}
            r="6"
            fill="#D97706"
          />

          <rect x="205" y="166" width="230" height="76" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.5" />
          <text x="320" y="191" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            Pilote libpcap / Npcap (Mode Promiscuité)
          </text>
          <text x="320" y="211" textAnchor="middle" className="fill-sky-800 text-[10px] font-mono">
            Copie passive 100 % des trames (0 ms impact)
          </text>
          <text x="320" y="229" textAnchor="middle" className="fill-emerald-700 text-[10px] font-semibold">
            Alimente tcpdump &amp; Wireshark
          </text>
        </>
      )}

      {/* Plan 1: tcpdump CLI + BPF Kernel Filter animation */}
      {step === 1 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Animation noyau : Filtre BPF (port 443) dans tcpdump
          </text>
          {/* Incoming packets on left */}
          <line x1="30" y1="125" x2="225" y2="125" stroke="#94A3B8" strokeWidth="3" />
          {/* Accepted upper path (port 443) */}
          <line x1="345" y1="108" x2="435" y2="92" stroke="#059669" strokeWidth="3" />
          {/* Dropped lower path (other ports) */}
          <line x1="345" y1="145" x2="435" y2="195" stroke="#DC2626" strokeWidth="2.5" strokeDasharray="5 4" />

          {/* Animated packet approaching BPF */}
          <g transform={`translate(${40 + ((progress * 1.4) % 1) * 165}, 111)`}>
            <rect width="50" height="28" rx="6" fill={tick % 30 < 15 ? '#059669' : '#DC2626'} />
            <text x="25" y="18" textAnchor="middle" className="fill-white text-[9px] font-mono font-bold">
              {tick % 30 < 15 ? ':443' : ':80'}
            </text>
          </g>

          {/* BPF Gate */}
          <rect x="225" y="72" width="122" height="108" rx="10" fill="#0F172A" stroke="#0284C7" strokeWidth="2.5" />
          <text x="286" y="106" textAnchor="middle" className="fill-sky-300 text-[12px] font-bold">
            Filtre Noyau BPF
          </text>
          <text x="286" y="130" textAnchor="middle" className="fill-emerald-300 text-[11px] font-mono font-bold">
            port 443
          </text>
          <text x="286" y="156" textAnchor="middle" className="fill-slate-300 text-[9px]">
            Trie avant l&apos;espace user
          </text>

          {/* Accepted terminal box */}
          <rect x="435" y="48" width="182" height="92" rx="10" fill="#0F172A" stroke="#059669" strokeWidth="2" />
          <text x="448" y="72" className="fill-emerald-400 text-[9px] font-mono font-bold">
            $ tcpdump -i eth0 -nn port 443
          </text>
          <text x="448" y="94" className="fill-slate-200 text-[9px] font-mono">
            IP 192.168.1.24 &gt; .88.443
          </text>
          <text x="448" y="114" className="fill-sky-300 text-[9px] font-mono">
            Écrit dans audit.pcap
          </text>

          {/* Dropped box */}
          <rect x="435" y="168" width="182" height="58" rx="10" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1.5" />
          <text x="526" y="193" textAnchor="middle" className="fill-red-800 text-[10px] font-bold">
            Paquets :80 / :53 ignorés
          </text>
          <text x="526" y="212" textAnchor="middle" className="fill-red-700 text-[9px]">
            CPU &amp; disque économisés
          </text>
        </>
      )}

      {/* Plan 2: .pcap Workflow Server -> SCP -> Wireshark */}
      {step === 2 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Workflow professionnel : Serveur Linux (tcpdump) → .pcap → Poste (Wireshark)
          </text>
          <rect x="26" y="74" width="170" height="136" rx="10" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <text x="111" y="106" textAnchor="middle" className="fill-white text-[12px] font-bold">
            Serveur Linux (SSH)
          </text>
          <text x="111" y="132" textAnchor="middle" className="fill-emerald-300 text-[10px] font-mono">
            tcpdump -i eth0
          </text>
          <text x="111" y="150" textAnchor="middle" className="fill-emerald-300 text-[10px] font-mono">
            -w incident.pcap
          </text>
          <text x="111" y="182" textAnchor="middle" className="fill-slate-400 text-[9px]">
            Sans interface graphique
          </text>

          {/* Animated .pcap file traveling across */}
          <line x1="196" y1="142" x2="438" y2="142" stroke="#0284C7" strokeWidth="3" strokeDasharray="6 4" />
          <g transform={`translate(${210 + progress * 165}, 116)`}>
            <rect width="72" height="50" rx="8" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
            <text x="36" y="23" textAnchor="middle" className="fill-amber-950 text-[10px] font-mono font-bold">
              .pcap
            </text>
            <text x="36" y="39" textAnchor="middle" className="fill-amber-800 text-[8px]">
              Transfert SCP
            </text>
          </g>

          <rect x="438" y="74" width="176" height="136" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.5" />
          <text x="526" y="106" textAnchor="middle" className="fill-sky-950 text-[12px] font-bold">
            Poste Analyste
          </text>
          <text x="526" y="134" textAnchor="middle" className="fill-sky-700 text-[11px] font-bold">
            Wireshark (GUI)
          </text>
          <text x="526" y="160" textAnchor="middle" className="fill-slate-600 text-[10px]">
            Dissection visuelle &amp;
          </text>
          <text x="526" y="178" textAnchor="middle" className="fill-slate-600 text-[10px]">
            reconstitution de flux
          </text>
        </>
      )}

      {/* Plan 3: Animated 3-Pane Wireshark Anatomy */}
      {step === 3 && (
        <>
          <text x="320" y="24" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Les 3 volets synchronisés de Wireshark (balayage animé des couches)
          </text>
          {/* Pane 1 top */}
          <rect x="26" y="38" width="588" height="62" rx="8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="38" y="55" className="fill-slate-500 text-[9px] font-bold">
            VOLET 1 · LISTE DES PAQUETS
          </text>
          <rect x="36" y="62" width="568" height="28" rx="5" fill="#0369A1" />
          <text x="48" y="80" className="fill-white text-[10px] font-mono font-semibold">
            #6 · 0.031s · 192.168.1.24 → 10.0.2.50 · HTTP · POST /login HTTP/1.1
          </text>

          {/* Pane 2 bottom-left: cycling OSI layers */}
          <rect x="26" y="110" width="292" height="142" rx="8" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
          <text x="38" y="128" className="fill-sky-800 text-[9px] font-bold">
            VOLET 2 · COUCHES OSI (DÉTAILS)
          </text>
          {[
            'L2 · Ethernet II (MAC a4:5e → 00:1a)',
            'L3 · IPv4 (192.168.1.24 → 10.0.2.50)',
            'L4 · TCP (Port 54012 → 80 · PSH,ACK)',
            'L7 · HTTP POST /login (user=camille)',
          ].map((lbl, i) => (
            <g key={lbl} transform={`translate(36, ${138 + i * 26})`}>
              <rect
                width="272"
                height="22"
                rx="4"
                fill={activeLayerIdx === i ? '#0284C7' : '#F1F5F9'}
              />
              <text
                x="8"
                y="14"
                className={`text-[9px] font-mono font-semibold ${
                  activeLayerIdx === i ? 'fill-white' : 'fill-slate-700'
                }`}
              >
                {lbl}
              </text>
            </g>
          ))}

          {/* Pane 3 bottom-right: synced Hex bytes */}
          <rect x="330" y="110" width="284" height="142" rx="8" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <text x="342" y="128" className="fill-emerald-400 text-[9px] font-bold">
            VOLET 3 · OCTETS HEX / ASCII SYNCHRONISÉS
          </text>
          {[
            '0000  00 1a 2b 00 00 01 a4 5e  ..+....^',
            '0010  45 00 00 c8 c0 a8 01 18  E.......',
            '0020  d2 fc 00 50 50 18 fa f0  ...PP...',
            '0030  50 4f 53 54 20 2f 6c 6f  POST /lo',
          ].map((hex, i) => (
            <g key={hex} transform={`translate(340, ${138 + i * 26})`}>
              <rect
                width="264"
                height="22"
                rx="4"
                fill={activeLayerIdx === i ? '#0369A1' : 'transparent'}
              />
              <text
                x="6"
                y="14"
                className={`text-[9px] font-mono ${
                  activeLayerIdx === i ? 'fill-white font-bold' : 'fill-slate-400'
                }`}
              >
                {hex}
              </text>
            </g>
          ))}
        </>
      )}

      {/* Plan 4: BPF Capture Filter vs Wireshark Display Filter */}
      {step === 4 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Filtre de capture (BPF) vs Filtre d&apos;affichage (Wireshark)
          </text>
          <rect x="26" y="46" width="284" height="200" rx="10" fill="#FFFFFF" stroke="#D97706" strokeWidth="2.5" />
          <text x="168" y="74" textAnchor="middle" className="fill-amber-900 text-[12px] font-bold">
            1. Filtre de Capture (BPF / tcpdump)
          </text>
          <text x="168" y="98" textAnchor="middle" className="fill-slate-700 text-[11px] font-mono font-bold">
            port 80 and host 10.0.2.50
          </text>
          <rect x="46" y="116" width="244" height="54" rx="8" fill="#FEF3C7" />
          <text x="168" y="139" textAnchor="middle" className="fill-amber-950 text-[10px] font-semibold">
            Agit AVANT l&apos;écriture sur disque
          </text>
          <text x="168" y="157" textAnchor="middle" className="fill-amber-800 text-[10px]">
            Paquets exclus = non enregistrés
          </text>
          <text x="168" y="205" textAnchor="middle" className="fill-slate-600 text-[10px]">
            Idéal pour capturer des heures sur serveur
          </text>

          <rect x="330" y="46" width="284" height="200" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.5" />
          <text x="472" y="74" textAnchor="middle" className="fill-sky-900 text-[12px] font-bold">
            2. Filtre d&apos;Affichage (Wireshark)
          </text>
          <text x="472" y="98" textAnchor="middle" className="fill-slate-700 text-[11px] font-mono font-bold">
            http.request.method == &quot;POST&quot;
          </text>
          <rect x="350" y="116" width="244" height="54" rx="8" fill="#E0F2FE" />
          <text x="472" y="139" textAnchor="middle" className="fill-sky-950 text-[10px] font-semibold">
            Agit APRÈS capture sur le .pcap
          </text>
          <text x="472" y="157" textAnchor="middle" className="fill-sky-800 text-[10px]">
            100 % réversible (rien n&apos;est perdu !)
          </text>
          <text x="472" y="205" textAnchor="middle" className="fill-slate-600 text-[10px]">
            Permet des filtres précis sur 1 000+ protocoles
          </text>
        </>
      )}

      {/* Plan 5: Follow TCP Stream HTTP Cleartext vs TLS 1.3 Encrypted */}
      {step === 5 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Follow TCP Stream : pourquoi HTTPS (TLS) protège contre l&apos;écoute
          </text>
          {/* HTTP cleartext lane */}
          <rect x="26" y="48" width="284" height="196" rx="10" fill="#FFFBEB" stroke="#D97706" strokeWidth="2.5" />
          <text x="168" y="76" textAnchor="middle" className="fill-amber-950 text-[12px] font-bold">
            HTTP · Port 80 (En clair)
          </text>
          <rect x="44" y="94" width="248" height="92" rx="8" fill="#0F172A" />
          <text x="56" y="118" className="fill-amber-300 text-[10px] font-mono">
            POST /login HTTP/1.1
          </text>
          <text x="56" y="140" className="fill-red-400 text-[10px] font-mono font-bold">
            user=camille&amp;pass=Phare2026!
          </text>
          <text x="56" y="164" className="fill-amber-200 text-[10px] font-mono">
            Set-Cookie: session=abc982
          </text>
          <text x="168" y="216" textAnchor="middle" className="fill-red-700 text-[11px] font-bold">
            Lisible intégralement dans Wireshark !
          </text>

          {/* HTTPS TLS 1.3 lane */}
          <rect x="330" y="48" width="284" height="196" rx="10" fill="#ECFDF5" stroke="#059669" strokeWidth="2.5" />
          <text x="472" y="76" textAnchor="middle" className="fill-emerald-950 text-[12px] font-bold">
            HTTPS · Port 443 (TLS 1.3)
          </text>
          <rect x="348" y="94" width="248" height="92" rx="8" fill="#0F172A" />
          <text x="360" y="118" className="fill-emerald-300 text-[10px] font-mono">
            TLSv1.3 Application Data
          </text>
          <text x="360" y="140" className="fill-slate-400 text-[10px] font-mono">
            17 03 03 f9 8c 3b a1 4e d0 9b
          </text>
          <text x="360" y="164" className="fill-slate-400 text-[10px] font-mono">
            72 e4 19 6a 0c b8 5f 31 9a 2e
          </text>
          <text x="472" y="216" textAnchor="middle" className="fill-emerald-800 text-[11px] font-bold">
            Contenu chiffré (AES-256) : illisible !
          </text>
        </>
      )}
    </svg>
  );
};

const Island14Visual: React.FC<{ step: number }> = ({ step }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => (t + 1) % 60);
    }, 85);
    return () => window.clearInterval(id);
  }, []);

  const progress = tick / 60;
  const cpuPulse = Math.round(78 + Math.sin((tick / 60) * Math.PI * 2) * 14);

  return (
    <svg
      viewBox="0 0 640 270"
      className="w-full h-auto"
      role="img"
      aria-label="Animation du fonctionnement de Windows Azure Monitor"
    >
      <rect x="0" y="0" width="640" height="270" rx="12" fill="#EBF4FA" />

      {/* Plan 0: Windows Server + AMA + DCR -> Azure Monitor */}
      {step === 0 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Collecte animée : Serveurs Windows → Agent AMA &amp; DCR → Azure Monitor
          </text>
          {[
            { y: 54, name: 'WIN-WEB-01', sub: 'PerfCounters CPU/RAM' },
            { y: 118, name: 'WIN-AD-01', sub: 'Security EventID 4625' },
            { y: 182, name: 'Azure App Service', sub: 'Traces HTTP & SQL' },
          ].map((src, i) => (
            <g key={src.name}>
              <rect x="24" y={src.y} width="166" height="52" rx="8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
              <text x="107" y={src.y + 22} textAnchor="middle" className="fill-slate-900 text-[11px] font-bold">
                {src.name}
              </text>
              <text x="107" y={src.y + 40} textAnchor="middle" className="fill-sky-800 text-[9px] font-mono">
                {src.sub}
              </text>
              <line x1="190" y1={src.y + 26} x2="275" y2="144" stroke="#0284C7" strokeWidth="2" strokeDasharray="4 4" />
              <circle
                cx={194 + ((progress + i * 0.25) % 1) * 78}
                cy={src.y + 26 + ((progress + i * 0.25) % 1) * (144 - (src.y + 26))}
                r="5"
                fill="#0284C7"
              />
            </g>
          ))}

          {/* AMA + DCR hub */}
          <rect x="275" y="96" width="132" height="96" rx="10" fill="#0369A1" />
          <text x="341" y="130" textAnchor="middle" className="fill-white text-[12px] font-bold">
            Agent AMA
          </text>
          <text x="341" y="150" textAnchor="middle" className="fill-sky-100 text-[10px] font-mono">
            + Règles DCR
          </text>
          <text x="341" y="172" textAnchor="middle" className="fill-emerald-200 text-[9px]">
            Filtre &amp; chiffre TLS
          </text>

          <line x1="407" y1="144" x2="462" y2="144" stroke="#059669" strokeWidth="3" />
          <circle cx={412 + progress * 46} cy="144" r="5" fill="#059669" />

          <rect x="462" y="84" width="152" height="120" rx="12" fill="#ECFDF5" stroke="#059669" strokeWidth="2.5" />
          <text x="538" y="122" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            Azure Monitor
          </text>
          <text x="538" y="148" textAnchor="middle" className="fill-emerald-800 text-[10px] font-mono font-semibold">
            Metrics + Logs
          </text>
          <text x="538" y="174" textAnchor="middle" className="fill-slate-600 text-[10px]">
            Ingestion temps réel
          </text>
        </>
      )}

      {/* Plan 1: Metrics vs Log Analytics Dual Store */}
      {step === 1 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Les 2 moteurs d&apos;Azure Monitor : Metrics (Rapide) vs Logs (Riche)
          </text>
          <rect x="26" y="48" width="284" height="196" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.5" />
          <text x="168" y="76" textAnchor="middle" className="fill-sky-900 text-[13px] font-bold">
            Azure Monitor Metrics
          </text>
          <text x="168" y="96" textAnchor="middle" className="fill-slate-600 text-[10px]">
            Séries numériques horodatées (ultra-léger)
          </text>
          <polyline
            fill="none"
            stroke="#0284C7"
            strokeWidth="3"
            points={`50,170 95,155 140,162 185,130 230,${170 - cpuPulse * 0.6} 285,122`}
          />
          <text x="168" y="206" textAnchor="middle" className="fill-sky-800 text-[11px] font-mono font-bold">
            CPU Windows : {cpuPulse} % · Latence : 38 ms
          </text>
          <text x="168" y="226" textAnchor="middle" className="fill-slate-500 text-[10px]">
            Alertes rapides &amp; Autoscale
          </text>

          <rect x="330" y="48" width="284" height="196" rx="10" fill="#FFFFFF" stroke="#059669" strokeWidth="2.5" />
          <text x="472" y="76" textAnchor="middle" className="fill-emerald-900 text-[13px] font-bold">
            Log Analytics Workspace
          </text>
          <text x="472" y="96" textAnchor="middle" className="fill-slate-600 text-[10px]">
            Tables structurées (Windows Event, Syslog)
          </text>
          <rect x="348" y="112" width="248" height="72" rx="8" fill="#0F172A" />
          <text x="358" y="134" className="fill-emerald-300 text-[9px] font-mono">
            EventID 4625 · WIN-AD-01 · RDP Fail
          </text>
          <text x="358" y="152" className="fill-amber-300 text-[9px] font-mono">
            EventID 7036 · WIN-WEB-01 · IIS Restart
          </text>
          <text x="358" y="170" className="fill-sky-300 text-[9px] font-mono">
            Heartbeat · 12/12 serveurs en ligne
          </text>
          <text x="472" y="216" textAnchor="middle" className="fill-emerald-800 text-[11px] font-bold">
            Interrogeable par requêtes KQL
          </text>
        </>
      )}

      {/* Plan 2: Animated KQL Pipe Funnel */}
      {step === 2 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Entonnoir animé KQL (Kusto Query Language)
          </text>
          {[
            { y: 46, w: 540, x: 50, bg: '#0F172A', txt: 'Event   (1 200 000 journaux Windows bruts)', col: '#E2E8F0' },
            { y: 100, w: 460, x: 90, bg: '#0369A1', txt: '| where EventID == 4625   (Filtre échecs de connexion → 184 lignes)', col: '#FFFFFF' },
            { y: 154, w: 380, x: 130, bg: '#059669', txt: '| summarize Tentatives=count() by Computer', col: '#FFFFFF' },
            { y: 208, w: 300, x: 170, bg: '#FEF3C7', txt: 'Résultat : WIN-AD-01 → 184 tentatives suspectes !', col: '#78350F' },
          ].map((row, idx) => {
            const active = Math.floor(tick / 15) % 4 === idx;
            return (
              <g key={row.txt}>
                <rect
                  x={row.x}
                  y={row.y}
                  width={row.w}
                  height="42"
                  rx="8"
                  fill={row.bg}
                  stroke={active ? '#F59E0B' : 'transparent'}
                  strokeWidth="3"
                />
                <text
                  x="320"
                  y={row.y + 25}
                  textAnchor="middle"
                  fill={row.col}
                  className="text-[11px] font-mono font-bold"
                >
                  {row.txt}
                </text>
              </g>
            );
          })}
        </>
      )}

      {/* Plan 3: Application Insights End-to-End Trace */}
      {step === 3 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Application Insights (APM) — Détection d&apos;un goulot SQL
          </text>
          {[
            { x: 30, title: 'Navigateur', ms: '18 ms', ok: true },
            { x: 235, title: 'API Billetterie', ms: '42 ms', ok: true },
            { x: 440, title: 'Azure SQL DB', ms: '2 450 ms !', ok: false },
          ].map((node, i) => (
            <g key={node.title}>
              <rect
                x={node.x}
                y="84"
                width="165"
                height="108"
                rx="10"
                fill={node.ok ? '#FFFFFF' : '#FEF2F2'}
                stroke={node.ok ? '#0284C7' : '#DC2626'}
                strokeWidth="2.5"
              />
              <text x={node.x + 82} y="120" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
                {node.title}
              </text>
              <text
                x={node.x + 82}
                y="150"
                textAnchor="middle"
                className={`text-[13px] font-mono font-bold ${
                  node.ok ? 'fill-emerald-700' : 'fill-red-700'
                }`}
              >
                {node.ms}
              </text>
              <text x={node.x + 82} y="174" textAnchor="middle" className="fill-slate-500 text-[9px]">
                {node.ok ? 'Latence normale' : 'Index SQL manquant !'}
              </text>
              {i < 2 && (
                <>
                  <line x1={node.x + 165} y1="138" x2={node.x + 205} y2="138" stroke="#0284C7" strokeWidth="3" />
                  <circle cx={node.x + 168 + progress * 34} cy="138" r="5" fill={i === 1 ? '#DC2626' : '#0284C7'} />
                </>
              )}
            </g>
          ))}
          <text x="320" y="232" textAnchor="middle" className="fill-sky-900 text-[11px] font-semibold">
            Application Insights trace chaque milliseconde entre le code et la base de données.
          </text>
        </>
      )}

      {/* Plan 4: Alert Rule -> Action Group automation */}
      {step === 4 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Alerte critique (CPU &gt; 85 %) → Déclenchement Action Group
          </text>
          <rect x="26" y="76" width="166" height="122" rx="10" fill="#FEF2F2" stroke="#DC2626" strokeWidth="2.5" />
          <text x="109" y="110" textAnchor="middle" className="fill-red-900 text-[12px] font-bold">
            Règle d&apos;Alerte Sev 1
          </text>
          <text x="109" y="140" textAnchor="middle" className="fill-red-700 text-[16px] font-mono font-bold">
            CPU : {Math.max(86, cpuPulse)} %
          </text>
          <text x="109" y="170" textAnchor="middle" className="fill-red-800 text-[10px]">
            Seuil &gt; 85 % franchi
          </text>

          <line x1="192" y1="137" x2="248" y2="137" stroke="#DC2626" strokeWidth="3" />
          <circle cx={196 + progress * 48} cy="137" r="5" fill="#DC2626" />

          <rect x="248" y="88" width="136" height="98" rx="10" fill="#0369A1" />
          <text x="316" y="128" textAnchor="middle" className="fill-white text-[12px] font-bold">
            Action Group
          </text>
          <text x="316" y="152" textAnchor="middle" className="fill-sky-100 text-[10px]">
            Exécution parallèle
          </text>

          {[
            { y: 54, label: '1. Alerte Teams / SMS astreinte', fill: '#FEF3C7', stroke: '#D97706' },
            { y: 114, label: '2. Autoscale (+2 VM Windows)', fill: '#ECFDF5', stroke: '#059669' },
            { y: 174, label: '3. Runbook redémarrage service', fill: '#E0F2FE', stroke: '#0284C7' },
          ].map((act) => (
            <g key={act.label}>
              <line x1="384" y1="137" x2="424" y2={act.y + 22} stroke={act.stroke} strokeWidth="2.5" />
              <rect x="424" y={act.y} width="192" height="44" rx="8" fill={act.fill} stroke={act.stroke} strokeWidth="2" />
              <text x="520" y={act.y + 26} textAnchor="middle" className="fill-slate-900 text-[10px] font-bold">
                {act.label}
              </text>
            </g>
          ))}
        </>
      )}

      {/* Plan 5: Workbooks & Hybrid Azure Arc Cockpit */}
      {step === 5 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Vue unifiée : Workbooks Azure Monitor &amp; Serveurs Hybrides (Azure Arc)
          </text>
          <rect x="30" y="54" width="580" height="186" rx="12" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
          <text x="52" y="82" className="fill-sky-900 text-[12px] font-bold">
            Workbook Cyberland — Santé globale du système d&apos;information
          </text>
          {[
            { x: 52, title: 'Windows Sur Site', sub: 'Connecté via Azure Arc', val: '100 % OK', fill: '#ECFDF5', col: '#065F46' },
            { x: 236, title: 'VM Azure Cloud', sub: 'Agent AMA + Autoscale', val: 'CPU 41 %', fill: '#E0F2FE', col: '#075985' },
            { x: 420, title: 'Sécurité KQL', sub: 'EventID 4625 surveillé', val: '0 incident', fill: '#FEF3C7', col: '#92400E' },
          ].map((card) => (
            <g key={card.title}>
              <rect x={card.x} y="102" width="168" height="114" rx="10" fill={card.fill} />
              <text x={card.x + 84} y="132" textAnchor="middle" className="fill-slate-900 text-[11px] font-bold">
                {card.title}
              </text>
              <text x={card.x + 84} y="154" textAnchor="middle" className="fill-slate-600 text-[9px]">
                {card.sub}
              </text>
              <text x={card.x + 84} y="190" textAnchor="middle" fill={card.col} className="text-[14px] font-mono font-bold">
                {card.val}
              </text>
            </g>
          ))}
        </>
      )}
    </svg>
  );
};

/* --- Island 15: Active Directory & Kerberos --- */
const Island15Visual: React.FC<{ step: number }> = ({ step }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => (t + 1) % 40), 120);
    return () => window.clearInterval(id);
  }, []);

  const progress = tick / 40;

  return (
    <svg
      viewBox="0 0 640 260"
      className="w-full h-auto"
      role="img"
      aria-label="Animation Active Directory, Kerberos et GPO"
    >
      <rect x="0" y="0" width="640" height="260" rx="12" fill="#EBF4FA" />

      {step === 0 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Hiérarchie Active Directory : Forêt → Domaine → Unités d&apos;Organisation (OU)
          </text>
          <rect x="190" y="42" width="260" height="42" rx="8" fill="#0F172A" />
          <text x="320" y="67" textAnchor="middle" className="fill-white text-[12px] font-bold">
            Forêt &amp; Domaine : cyberland.local
          </text>
          {[
            { x: 38, title: 'OU · Direction', detail: 'GPO Chiffrement BitLocker', col: '#0369A1' },
            { x: 234, title: 'OU · Équipe IT', detail: 'Délégation + Bastion Admin', col: '#059669' },
            { x: 430, title: 'OU · Finance', detail: 'GPO Verrouillage 5 min', col: '#D97706' },
          ].map((ou) => (
            <g key={ou.title}>
              <line x1="320" y1="84" x2={ou.x + 86} y2="128" stroke="#64748B" strokeWidth="2" />
              <circle
                cx={320 + (ou.x + 86 - 320) * progress}
                cy={84 + 44 * progress}
                r="4"
                fill={ou.col}
              />
              <rect x={ou.x} y="128" width="172" height="92" rx="10" fill="#FFFFFF" stroke={ou.col} strokeWidth="2" />
              <text x={ou.x + 86} y="160" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
                {ou.title}
              </text>
              <text x={ou.x + 86} y="186" textAnchor="middle" className="fill-slate-600 text-[10px]">
                {ou.detail}
              </text>
            </g>
          ))}
        </>
      )}

      {step === 1 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Contrôleur de Domaine (DC01) — Annuaire LDAP &amp; Service Kerberos (KDC)
          </text>
          <rect x="200" y="54" width="240" height="156" rx="12" fill="#FFFFFF" stroke="#0369A1" strokeWidth="2.5" />
          <text x="320" y="84" textAnchor="middle" className="fill-sky-900 text-[13px] font-bold">
            DC01.cyberland.local
          </text>
          <rect x="224" y="102" width="192" height="38" rx="6" fill="#E0F2FE" />
          <text x="320" y="125" textAnchor="middle" className="fill-sky-900 text-[11px] font-mono font-bold">
            KDC Kerberos (Port 88)
          </text>
          <rect x="224" y="150" width="192" height="38" rx="6" fill="#ECFDF5" />
          <text x="320" y="173" textAnchor="middle" className="fill-emerald-900 text-[11px] font-mono font-bold">
            Annuaire LDAPS (Port 636)
          </text>
          <rect x="26" y="104" width="126" height="60" rx="8" fill="#FFFFFF" stroke="#64748B" strokeWidth="2" />
          <text x="89" y="138" textAnchor="middle" className="fill-slate-900 text-[11px] font-bold">
            Postes Windows
          </text>
          <rect x="488" y="104" width="126" height="60" rx="8" fill="#FFFFFF" stroke="#64748B" strokeWidth="2" />
          <text x="551" y="138" textAnchor="middle" className="fill-slate-900 text-[11px] font-bold">
            Serveurs Fichiers
          </text>
          <line x1="152" y1="134" x2="200" y2="134" stroke="#0284C7" strokeWidth="2.5" />
          <circle cx={154 + progress * 44} cy="134" r="4.5" fill="#0284C7" />
          <line x1="440" y1="134" x2="488" y2="134" stroke="#059669" strokeWidth="2.5" />
          <circle cx={442 + progress * 44} cy="134" r="4.5" fill="#059669" />
        </>
      )}

      {step === 2 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Kerberos Étape 1 : Demande &amp; délivrance du Passeport TGT
          </text>
          <rect x="34" y="84" width="160" height="106" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
          <text x="114" y="122" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            PC Alice (Windows)
          </text>
          <text x="114" y="148" textAnchor="middle" className="fill-slate-600 text-[10px]">
            Horodatage chiffré
          </text>
          <text x="114" y="168" textAnchor="middle" className="fill-emerald-700 text-[10px] font-semibold">
            Mot de passe jamais envoyé !
          </text>

          <rect x="446" y="84" width="160" height="106" rx="10" fill="#FEF3C7" stroke="#D97706" strokeWidth="2.5" />
          <text x="526" y="122" textAnchor="middle" className="fill-amber-950 text-[12px] font-bold">
            KDC (Kerberos DC)
          </text>
          <text x="526" y="148" textAnchor="middle" className="fill-amber-900 text-[10px]">
            Vérifie NTP (&lt; 5 min)
          </text>
          <text x="526" y="168" textAnchor="middle" className="fill-amber-900 text-[10px] font-mono font-bold">
            Signe le TGT (10h)
          </text>

          <line x1="194" y1="112" x2="446" y2="112" stroke="#0284C7" strokeWidth="2.5" />
          <text x="320" y="102" textAnchor="middle" className="fill-sky-900 text-[10px] font-mono font-bold">
            1. AS-REQ (Identité + Timestamp) →
          </text>
          <circle cx={200 + progress * 240} cy="112" r="5" fill="#0284C7" />

          <line x1="446" y1="162" x2="194" y2="162" stroke="#059669" strokeWidth="2.5" />
          <text x="320" y="182" textAnchor="middle" className="fill-emerald-900 text-[10px] font-mono font-bold">
            ← 2. AS-REP (Ticket TGT chiffré)
          </text>
          <circle cx={440 - progress * 240} cy="162" r="5" fill="#059669" />
        </>
      )}

      {step === 3 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Kerberos Étape 2 : Ticket de Service (TGS) &amp; Single Sign-On (SSO)
          </text>
          <rect x="26" y="96" width="144" height="92" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
          <text x="98" y="132" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            PC Alice
          </text>
          <text x="98" y="156" textAnchor="middle" className="fill-emerald-700 text-[10px] font-mono">
            Détient TGT ✓
          </text>

          <rect x="248" y="46" width="144" height="72" rx="10" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
          <text x="320" y="78" textAnchor="middle" className="fill-amber-950 text-[12px] font-bold">
            KDC (TGS)
          </text>
          <text x="320" y="98" textAnchor="middle" className="fill-amber-900 text-[10px]">
            Délivre Ticket TGS
          </text>

          <rect x="466" y="96" width="148" height="92" rx="10" fill="#ECFDF5" stroke="#059669" strokeWidth="2.5" />
          <text x="540" y="132" textAnchor="middle" className="fill-emerald-950 text-[12px] font-bold">
            Serveur Fichiers
          </text>
          <text x="540" y="156" textAnchor="middle" className="fill-emerald-800 text-[10px]">
            Accès SSO instantané
          </text>

          <path d="M 140 96 L 248 76" stroke="#D97706" strokeWidth="2.5" strokeDasharray="5 4" />
          <line x1="170" y1="146" x2="466" y2="146" stroke="#059669" strokeWidth="3" />
          <circle cx={176 + progress * 284} cy="146" r="5.5" fill="#059669" />
          <text x="320" y="168" textAnchor="middle" className="fill-emerald-900 text-[10px] font-mono font-bold">
            AP-REQ : Présentation du Ticket de Service (TGS) →
          </text>
        </>
      )}

      {step === 4 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            GPO (Stratégies de Groupe) : Diffusion automatique vers 500 postes
          </text>
          <rect x="28" y="78" width="184" height="114" rx="10" fill="#0369A1" />
          <text x="120" y="114" textAnchor="middle" className="fill-white text-[12px] font-bold">
            GPO « Sécurité Postes »
          </text>
          <text x="120" y="138" textAnchor="middle" className="fill-sky-100 text-[10px]">
            • BitLocker obligatoire
          </text>
          <text x="120" y="156" textAnchor="middle" className="fill-sky-100 text-[10px]">
            • Pare-feu Windows ON
          </text>
          <text x="120" y="174" textAnchor="middle" className="fill-sky-100 text-[10px]">
            • Écran verrouillé 5 min
          </text>
          {[0, 1, 2].map((i) => {
            const y = 58 + i * 64;
            return (
              <g key={i}>
                <line x1="212" y1="135" x2="386" y2={y + 22} stroke="#0284C7" strokeWidth="2.5" />
                <circle
                  cx={216 + (382 - 216) * progress}
                  cy={135 + (y + 22 - 135) * progress}
                  r="4.5"
                  fill="#059669"
                />
                <rect x="386" y={y} width="222" height="44" rx="8" fill="#FFFFFF" stroke="#059669" strokeWidth="2" />
                <text x="497" y={y + 26} textAnchor="middle" className="fill-slate-900 text-[11px] font-bold">
                  Poste Windows #{i + 1} · GPO appliquée ✓
                </text>
              </g>
            );
          })}
        </>
      )}

      {step === 5 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Modèle de Tiering AD : Isoler le Cœur (Tier 0) des Postes Bureautiques
          </text>
          {[
            { y: 50, tier: 'Tier 0 · Cœur Critique', desc: 'Contrôleurs de Domaine (DC), PKI, AD Connect', fill: '#FEF2F2', stroke: '#DC2626' },
            { y: 118, tier: 'Tier 1 · Serveurs Applicatifs', desc: 'Serveurs Web, SQL, Fichiers, Azure Monitor', fill: '#FEF3C7', stroke: '#D97706' },
            { y: 186, tier: 'Tier 2 · Postes Utilisateurs', desc: 'PC portables, e-mails, navigation web', fill: '#ECFDF5', stroke: '#059669' },
          ].map((t) => (
            <g key={t.tier}>
              <rect x="50" y={t.y} width="540" height="52" rx="10" fill={t.fill} stroke={t.stroke} strokeWidth="2" />
              <text x="72" y={t.y + 24} className="fill-slate-900 text-[12px] font-bold">
                {t.tier}
              </text>
              <text x="72" y={t.y + 41} className="fill-slate-700 text-[10px]">
                {t.desc}
              </text>
              <text x="570" y={t.y + 31} textAnchor="end" className="fill-slate-800 text-[10px] font-mono font-bold">
                Comptes séparés
              </text>
            </g>
          ))}
        </>
      )}
    </svg>
  );
};

/* --- Island 16: SOC, SIEM & SOAR --- */
const Island16Visual: React.FC<{ step: number }> = ({ step }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => (t + 1) % 40), 120);
    return () => window.clearInterval(id);
  }, []);

  const progress = tick / 40;

  return (
    <svg
      viewBox="0 0 640 260"
      className="w-full h-auto"
      role="img"
      aria-label="Animation Centre SOC, SIEM, MITRE ATT&CK et SOAR"
    >
      <rect x="0" y="0" width="640" height="260" rx="12" fill="#0F172A" />

      {step === 0 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-white text-[13px] font-bold">
            Ingestion SIEM : Tous les journaux convergent vers un moteur unique
          </text>
          {[
            { y: 58, label: 'Pare-feu Périmétrique', col: '#38BDF8' },
            { y: 118, label: 'Active Directory (4625/4624)', col: '#FBBF24' },
            { y: 178, label: 'Endpoints EDR & Cloud', col: '#34D399' },
          ].map((src) => (
            <g key={src.label}>
              <rect x="28" y={src.y} width="200" height="44" rx="8" fill="#1E293B" stroke={src.col} strokeWidth="2" />
              <text x="128" y={src.y + 26} textAnchor="middle" className="fill-slate-100 text-[11px] font-semibold">
                {src.label}
              </text>
              <line x1="228" y1={src.y + 22} x2="388" y2="140" stroke={src.col} strokeWidth="2" strokeDasharray="4 4" />
              <circle
                cx={232 + (384 - 232) * progress}
                cy={src.y + 22 + (140 - (src.y + 22)) * progress}
                r="4.5"
                fill={src.col}
              />
            </g>
          ))}
          <rect x="388" y="84" width="222" height="112" rx="12" fill="#0369A1" stroke="#7DD3FC" strokeWidth="2" />
          <text x="499" y="128" textAnchor="middle" className="fill-white text-[14px] font-bold">
            Moteur SIEM
          </text>
          <text x="499" y="152" textAnchor="middle" className="fill-sky-100 text-[10px]">
            Indexation · Normalisation · Règles KQL
          </text>
          <text x="499" y="176" textAnchor="middle" className="fill-amber-300 text-[11px] font-mono font-bold">
            Corrélation 24h/24
          </text>
        </>
      )}

      {step === 1 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-white text-[13px] font-bold">
            Corrélation SIEM : 3 signaux faibles = 1 Alerte Critique
          </text>
          {[
            { x: 26, title: '25 × EventID 4625', sub: 'Échecs mot de passe', col: '#F59E0B' },
            { x: 224, title: '1 × EventID 4624', sub: 'Succès IP inhabituelle', col: '#F97316' },
            { x: 422, title: 'PowerShell -enc', sub: 'Script caché exécuté', col: '#EF4444' },
          ].map((ev) => (
            <g key={ev.title}>
              <rect x={ev.x} y="56" width="184" height="72" rx="8" fill="#1E293B" stroke={ev.col} strokeWidth="2" />
              <text x={ev.x + 92} y="86" textAnchor="middle" className="fill-white text-[11px] font-mono font-bold">
                {ev.title}
              </text>
              <text x={ev.x + 92} y="108" textAnchor="middle" className="fill-slate-300 text-[10px]">
                {ev.sub}
              </text>
              <line x1={ev.x + 92} y1="128" x2="320" y2="170" stroke={ev.col} strokeWidth="2" />
            </g>
          ))}
          <rect x="130" y="170" width="380" height="62" rx="10" fill="#7F1D1D" stroke="#F87171" strokeWidth="2.5" />
          <text x="320" y="198" textAnchor="middle" className="fill-white text-[13px] font-bold">
            INCIDENT CRITIQUE (SEV 1) : Compromission de compte !
          </text>
          <text x="320" y="218" textAnchor="middle" className="fill-red-200 text-[10px] font-mono">
            MTTD &lt; 45 secondes · Escalade SOC immédiate
          </text>
        </>
      )}

      {step === 2 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-white text-[13px] font-bold">
            Triage Analyste SOC N1 : Faux Positif vs Vrai Positif
          </text>
          <rect x="30" y="64" width="275" height="162" rx="10" fill="#064E3B" stroke="#34D399" strokeWidth="2" />
          <text x="167" y="96" textAnchor="middle" className="fill-emerald-200 text-[13px] font-bold">
            Faux Positif (Bénin)
          </text>
          <text x="52" y="128" className="fill-emerald-100 text-[10px]">
            • Scan de sauvegarde planifié à 02h00
          </text>
          <text x="52" y="152" className="fill-emerald-100 text-[10px]">
            • Compte de service connu (svc-backup)
          </text>
          <text x="52" y="188" className="fill-white text-[11px] font-semibold">
            Action : Clôturer &amp; affiner la règle
          </text>

          <rect x="335" y="64" width="275" height="162" rx="10" fill="#7F1D1D" stroke="#F87171" strokeWidth="2" />
          <text x="472" y="96" textAnchor="middle" className="fill-red-200 text-[13px] font-bold">
            Vrai Positif (Menace réelle)
          </text>
          <text x="357" y="128" className="fill-red-100 text-[10px]">
            • Word lance cmd.exe → PowerShell -enc
          </text>
          <text x="357" y="152" className="fill-red-100 text-[10px]">
            • Connexion vers IP C2 externe inconnue
          </text>
          <text x="357" y="188" className="fill-white text-[11px] font-semibold">
            Action : Isoler l&apos;hôte &amp; escalader N2 !
          </text>
        </>
      )}

      {step === 3 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-white text-[13px] font-bold">
            Chaîne d&apos;attaque cartographiée sur MITRE ATT&amp;CK
          </text>
          {[
            { x: 26, code: 'TA0001', name: 'Accès Initial', sub: 'Phishing PJ' },
            { x: 178, code: 'TA0002', name: 'Exécution', sub: 'PowerShell' },
            { x: 330, code: 'TA0008', name: 'Latéralisation', sub: 'RDP / SMB' },
            { x: 482, code: 'TA0010', name: 'Exfiltration', sub: 'Fuite HTTPS' },
          ].map((stage, i) => {
            const active = Math.floor(tick / 10) === i;
            return (
              <g key={stage.code}>
                <rect
                  x={stage.x}
                  y="78"
                  width="132"
                  height="112"
                  rx="10"
                  fill={active ? '#7F1D1D' : '#1E293B'}
                  stroke={active ? '#F87171' : '#475569'}
                  strokeWidth={active ? '2.5' : '1.5'}
                />
                <text x={stage.x + 66} y="108" textAnchor="middle" className="fill-amber-300 text-[10px] font-mono font-bold">
                  {stage.code}
                </text>
                <text x={stage.x + 66} y="136" textAnchor="middle" className="fill-white text-[11px] font-bold">
                  {stage.name}
                </text>
                <text x={stage.x + 66} y="162" textAnchor="middle" className="fill-slate-300 text-[10px]">
                  {stage.sub}
                </text>
                {i < 3 && (
                  <line x1={stage.x + 132} y1="134" x2={stage.x + 152} y2="134" stroke="#F87171" strokeWidth="2.5" />
                )}
              </g>
            );
          })}
          <text x="320" y="228" textAnchor="middle" className="fill-sky-300 text-[11px] font-semibold">
            Couper la chaîne dès TA0002 empêche le mouvement latéral et le ransomware.
          </text>
        </>
      )}

      {step === 4 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-white text-[13px] font-bold">
            Playbook SOAR : Remédiation Automatisée en moins de 10 secondes
          </text>
          <rect x="28" y="90" width="150" height="84" rx="10" fill="#0369A1" stroke="#38BDF8" strokeWidth="2" />
          <text x="103" y="128" textAnchor="middle" className="fill-white text-[13px] font-bold">
            Playbook SOAR
          </text>
          <text x="103" y="150" textAnchor="middle" className="fill-sky-100 text-[10px]">
            Déclenché par SIEM
          </text>
          {[
            { y: 56, label: '1. EDR : Isoler le poste compromis', col: '#34D399' },
            { y: 112, label: '2. AD : Révoquer la session & MFA', col: '#FBBF24' },
            { y: 168, label: '3. Firewall : Bloquer IP attaquante', col: '#38BDF8' },
          ].map((act) => (
            <g key={act.label}>
              <line x1="178" y1="132" x2="262" y2={act.y + 22} stroke={act.col} strokeWidth="2.5" />
              <circle
                cx={182 + (258 - 182) * progress}
                cy={132 + (act.y + 22 - 132) * progress}
                r="4.5"
                fill={act.col}
              />
              <rect x="262" y={act.y} width="346" height="44" rx="8" fill="#1E293B" stroke={act.col} strokeWidth="2" />
              <text x="435" y={act.y + 26} textAnchor="middle" className="fill-white text-[11px] font-semibold">
                {act.label} ✓
              </text>
            </g>
          ))}
        </>
      )}

      {step === 5 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-white text-[13px] font-bold">
            Boucle d&apos;amélioration continue : Post-Mortem &amp; Nouveaux IoC
          </text>
          <rect x="40" y="64" width="560" height="164" rx="12" fill="#1E293B" stroke="#34D399" strokeWidth="2" />
          {[
            { x: 66, title: 'IoC documentés', val: 'IP, Hash SHA-256, Domaine' },
            { x: 244, title: 'Règle KQL ajoutée', val: 'Détection proactive future' },
            { x: 422, title: 'MTTR réduit', val: 'De 4 h à 12 secondes' },
          ].map((c) => (
            <g key={c.title}>
              <rect x={c.x} y="92" width="154" height="108" rx="8" fill="#0F172A" stroke="#334155" />
              <text x={c.x + 77} y="128" textAnchor="middle" className="fill-emerald-300 text-[12px] font-bold">
                {c.title}
              </text>
              <text x={c.x + 77} y="160" textAnchor="middle" className="fill-slate-300 text-[10px]">
                {c.val}
              </text>
            </g>
          ))}
        </>
      )}
    </svg>
  );
};

/* --- Island 17: Kubernetes & Container Networking --- */
const Island17Visual: React.FC<{ step: number }> = ({ step }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => (t + 1) % 40), 120);
    return () => window.clearInterval(id);
  }, []);

  const progress = tick / 40;
  const podRebooting = tick < 18;

  return (
    <svg
      viewBox="0 0 640 260"
      className="w-full h-auto"
      role="img"
      aria-label="Animation Kubernetes : Control Plane, Pods, Services, Ingress et NetworkPolicy"
    >
      <rect x="0" y="0" width="640" height="260" rx="12" fill="#EBF4FA" />

      {step === 0 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Architecture Kubernetes : Control Plane (Cerveau) → Worker Nodes (Exécution)
          </text>
          <rect x="30" y="64" width="190" height="156" rx="12" fill="#0369A1" />
          <text x="125" y="96" textAnchor="middle" className="fill-white text-[13px] font-bold">
            Control Plane
          </text>
          <text x="125" y="124" textAnchor="middle" className="fill-sky-100 text-[10px] font-mono">
            • kube-apiserver
          </text>
          <text x="125" y="146" textAnchor="middle" className="fill-sky-100 text-[10px] font-mono">
            • kube-scheduler
          </text>
          <text x="125" y="168" textAnchor="middle" className="fill-sky-100 text-[10px] font-mono">
            • etcd (État cluster)
          </text>

          {[
            { y: 64, label: 'Worker Node 1 · Pods API' },
            { y: 150, label: 'Worker Node 2 · Pods Web' },
          ].map((n) => (
            <g key={n.label}>
              <line x1="220" y1="142" x2="310" y2={n.y + 34} stroke="#0284C7" strokeWidth="2.5" />
              <circle
                cx={224 + (306 - 224) * progress}
                cy={142 + (n.y + 34 - 142) * progress}
                r="4.5"
                fill="#059669"
              />
              <rect x="310" y={n.y} width="296" height="68" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
              <text x="458" y={n.y + 38} textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
                {n.label}
              </text>
            </g>
          ))}
        </>
      )}

      {step === 1 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Le Pod : Enveloppe réseau avec IP éphémère dédiée
          </text>
          <rect x="130" y="54" width="380" height="168" rx="14" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.5" strokeDasharray="6 4" />
          <text x="320" y="84" textAnchor="middle" className="fill-sky-900 text-[13px] font-bold">
            Pod : web-cyberland-7d9f (IP : 10.244.1.14)
          </text>
          <rect x="164" y="106" width="144" height="86" rx="8" fill="#E0F2FE" stroke="#0369A1" strokeWidth="2" />
          <text x="236" y="144" textAnchor="middle" className="fill-sky-950 text-[12px] font-bold">
            Conteneur App
          </text>
          <text x="236" y="168" textAnchor="middle" className="fill-sky-800 text-[10px] font-mono">
            localhost:8080
          </text>
          <rect x="332" y="106" width="144" height="86" rx="8" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="404" y="144" textAnchor="middle" className="fill-emerald-950 text-[12px] font-bold">
            Sidecar Logs
          </text>
          <text x="404" y="168" textAnchor="middle" className="fill-emerald-800 text-[10px] font-mono">
            Réseau partagé
          </text>
        </>
      )}

      {step === 2 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Deployment (replicas: 3) — Auto-réparation (Self-Healing) en direct
          </text>
          {[
            { x: 48, title: 'Pod #1', ok: true, ip: '10.244.1.11' },
            { x: 244, title: 'Pod #2', ok: true, ip: '10.244.1.12' },
            {
              x: 440,
              title: podRebooting ? 'Pod #3 (Crash !)' : 'Pod #3 (Recréé ✓)',
              ok: !podRebooting,
              ip: podRebooting ? 'CrashLoop' : '10.244.2.19',
            },
          ].map((p) => (
            <g key={p.x}>
              <rect
                x={p.x}
                y="72"
                width="156"
                height="118"
                rx="10"
                fill={p.ok ? '#ECFDF5' : '#FEF2F2'}
                stroke={p.ok ? '#059669' : '#DC2626'}
                strokeWidth="2.5"
              />
              <text x={p.x + 78} y="114" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
                {p.title}
              </text>
              <text x={p.x + 78} y="146" textAnchor="middle" className="fill-slate-700 text-[11px] font-mono">
                {p.ip}
              </text>
            </g>
          ))}
          <text x="320" y="226" textAnchor="middle" className="fill-sky-900 text-[11px] font-semibold">
            État désiré : 3/3 · Kubernetes détecte la panne et relance un Pod sain automatiquement.
          </text>
        </>
      )}

      {step === 3 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Service (ClusterIP stable) + CoreDNS interne → Répartition vers les Pods
          </text>
          <rect x="28" y="96" width="142" height="84" rx="10" fill="#FFFFFF" stroke="#64748B" strokeWidth="2" />
          <text x="99" y="132" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            Pod Frontend
          </text>
          <text x="99" y="156" textAnchor="middle" className="fill-sky-700 text-[10px] font-mono">
            appelle svc-api
          </text>

          <rect x="228" y="84" width="176" height="108" rx="10" fill="#0369A1" />
          <text x="316" y="122" textAnchor="middle" className="fill-white text-[12px] font-bold">
            Service : svc-api
          </text>
          <text x="316" y="146" textAnchor="middle" className="fill-sky-100 text-[11px] font-mono">
            IP stable : 10.96.0.42
          </text>
          <text x="316" y="168" textAnchor="middle" className="fill-amber-200 text-[10px]">
            Load Balancing auto
          </text>

          <line x1="170" y1="138" x2="228" y2="138" stroke="#0284C7" strokeWidth="3" />
          <circle cx={174 + progress * 50} cy="138" r="4.5" fill="#0284C7" />

          {[64, 128, 192].map((y, idx) => (
            <g key={y}>
              <line x1="404" y1="138" x2="472" y2={y + 18} stroke="#059669" strokeWidth="2" />
              <circle
                cx={408 + (468 - 408) * progress}
                cy={138 + (y + 18 - 138) * progress}
                r="4"
                fill="#059669"
              />
              <rect x="472" y={y} width="140" height="38" rx="6" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
              <text x="542" y={y + 23} textAnchor="middle" className="fill-emerald-950 text-[10px] font-mono font-bold">
                Pod API #{idx + 1}
              </text>
            </g>
          ))}
        </>
      )}

      {step === 4 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Ingress Controller : Terminaison HTTPS (443) &amp; Routage par chemin URL
          </text>
          <rect x="24" y="100" width="136" height="76" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
          <text x="92" y="132" textAnchor="middle" className="fill-slate-900 text-[11px] font-bold">
            Visiteurs Web
          </text>
          <text x="92" y="154" textAnchor="middle" className="fill-emerald-700 text-[10px] font-mono">
            HTTPS :443
          </text>

          <rect x="210" y="82" width="176" height="112" rx="10" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />
          <text x="298" y="118" textAnchor="middle" className="fill-white text-[12px] font-bold">
            Ingress Controller
          </text>
          <text x="298" y="142" textAnchor="middle" className="fill-emerald-300 text-[10px] font-mono">
            Certificat TLS ✓
          </text>
          <text x="298" y="166" textAnchor="middle" className="fill-sky-200 text-[10px]">
            Route /billets &amp; /meteo
          </text>

          <line x1="160" y1="138" x2="210" y2="138" stroke="#059669" strokeWidth="3" />
          <circle cx={164 + progress * 42} cy="138" r="4.5" fill="#059669" />

          <line x1="386" y1="120" x2="454" y2="92" stroke="#0284C7" strokeWidth="2.5" />
          <rect x="454" y="66" width="160" height="52" rx="8" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
          <text x="534" y="96" textAnchor="middle" className="fill-sky-950 text-[11px] font-mono font-bold">
            /billets → svc-billets
          </text>

          <line x1="386" y1="156" x2="454" y2="184" stroke="#059669" strokeWidth="2.5" />
          <rect x="454" y="158" width="160" height="52" rx="8" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="534" y="188" textAnchor="middle" className="fill-emerald-950 text-[11px] font-mono font-bold">
            /meteo → svc-meteo
          </text>
        </>
      )}

      {step === 5 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            NetworkPolicy Zero Trust : Cloisonner l&apos;accès à la Base de Données
          </text>
          <rect x="34" y="62" width="154" height="58" rx="8" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="111" y="95" textAnchor="middle" className="fill-emerald-950 text-[11px] font-bold">
            Pod API (role: api)
          </text>

          <rect x="34" y="160" width="154" height="58" rx="8" fill="#FEF2F2" stroke="#DC2626" strokeWidth="2" />
          <text x="111" y="193" textAnchor="middle" className="fill-red-950 text-[11px] font-bold">
            Pod Blog Public
          </text>

          <rect x="434" y="102" width="174" height="84" rx="10" fill="#FFFFFF" stroke="#0369A1" strokeWidth="2.5" />
          <text x="521" y="138" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            Pod PostgreSQL
          </text>
          <text x="521" y="162" textAnchor="middle" className="fill-sky-800 text-[10px] font-mono">
            Port 5432 protégé
          </text>

          <line x1="188" y1="91" x2="434" y2="132" stroke="#059669" strokeWidth="3" />
          <circle
            cx={192 + (430 - 192) * progress}
            cy={91 + (132 - 91) * progress}
            r="5"
            fill="#059669"
          />
          <text x="310" y="96" textAnchor="middle" className="fill-emerald-800 text-[10px] font-bold">
            AUTORISÉ (role: api → 5432)
          </text>

          <line x1="188" y1="189" x2="320" y2="168" stroke="#DC2626" strokeWidth="3" strokeDasharray="5 4" />
          <rect x="292" y="150" width="96" height="32" rx="6" fill="#DC2626" />
          <text x="340" y="170" textAnchor="middle" className="fill-white text-[10px] font-bold">
            BLOQUÉ ✕
          </text>
        </>
      )}
    </svg>
  );
};

/* --- Island 18: VPN, WireGuard, IPSec & NAT --- */
const Island18Visual: React.FC<{ step: number }> = ({ step }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => (t + 1) % 40), 120);
    return () => window.clearInterval(id);
  }, []);

  const progress = tick / 40;

  return (
    <svg
      viewBox="0 0 640 260"
      className="w-full h-auto"
      role="img"
      aria-label="Animation NAT, Pare-feu Stateful, Tunnel VPN et WireGuard"
    >
      <rect x="0" y="0" width="640" height="260" rx="12" fill="#EBF4FA" />

      {step === 0 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            NAT / PAT : Traduire plusieurs IP privées derrière 1 IP publique
          </text>
          {[
            { y: 68, ip: '192.168.1.10:51200' },
            { y: 146, ip: '192.168.1.24:51201' },
          ].map((p, idx) => (
            <g key={p.ip}>
              <rect x="24" y={p.y} width="166" height="50" rx="8" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
              <text x="107" y={p.y + 29} textAnchor="middle" className="fill-slate-900 text-[10px] font-mono font-bold">
                {p.ip}
              </text>
              <line x1="190" y1={p.y + 25} x2="254" y2="132" stroke="#0284C7" strokeWidth="2.5" />
              <circle
                cx={194 + (250 - 194) * progress}
                cy={p.y + 25 + (132 - (p.y + 25)) * progress}
                r="4"
                fill={idx === 0 ? '#0284C7' : '#059669'}
              />
            </g>
          ))}
          <rect x="254" y="84" width="166" height="96" rx="10" fill="#0369A1" />
          <text x="337" y="116" textAnchor="middle" className="fill-white text-[12px] font-bold">
            Routeur NAT/PAT
          </text>
          <text x="337" y="138" textAnchor="middle" className="fill-sky-100 text-[10px] font-mono">
            IP Publique :
          </text>
          <text x="337" y="158" textAnchor="middle" className="fill-amber-200 text-[11px] font-mono font-bold">
            203.0.113.5
          </text>
          <line x1="420" y1="132" x2="486" y2="132" stroke="#059669" strokeWidth="3" />
          <circle cx={424 + progress * 58} cy="132" r="5" fill="#059669" />
          <rect x="486" y="96" width="128" height="72" rx="10" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="550" y="136" textAnchor="middle" className="fill-emerald-950 text-[12px] font-bold">
            Internet (WAN)
          </text>
        </>
      )}

      {step === 1 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Pare-feu Stateful &amp; DNAT : Mémoire des connexions légitimes
          </text>
          <rect x="30" y="72" width="150" height="120" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
          <text x="105" y="124" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            Réseau Privé
          </text>
          <text x="105" y="148" textAnchor="middle" className="fill-slate-500 text-[10px]">
            Initie HTTPS :443
          </text>

          <rect x="234" y="58" width="172" height="148" rx="10" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />
          <text x="320" y="92" textAnchor="middle" className="fill-white text-[12px] font-bold">
            Pare-feu Stateful
          </text>
          <text x="320" y="122" textAnchor="middle" className="fill-emerald-300 text-[10px] font-mono">
            Session HTTPS : OK ✓
          </text>
          <text x="320" y="148" textAnchor="middle" className="fill-red-300 text-[10px] font-mono">
            Scan entrant : DROP ✕
          </text>
          <text x="320" y="176" textAnchor="middle" className="fill-amber-300 text-[10px] font-mono">
            DNAT 443 → DMZ
          </text>

          <rect x="460" y="72" width="150" height="120" rx="10" fill="#FEF2F2" stroke="#DC2626" strokeWidth="2" />
          <text x="535" y="124" textAnchor="middle" className="fill-red-950 text-[12px] font-bold">
            Internet Public
          </text>
          <text x="535" y="148" textAnchor="middle" className="fill-red-700 text-[10px]">
            Trafic non sollicité bloqué
          </text>
        </>
      )}

      {step === 2 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Encapsulation VPN : Un paquet privé dans une capsule chiffrée
          </text>
          <rect x="52" y="64" width="536" height="134" rx="16" fill="#0F172A" stroke="#34D399" strokeWidth="3" />
          <text x="320" y="94" textAnchor="middle" className="fill-emerald-300 text-[12px] font-mono font-bold">
            Enveloppe Externe VPN (IP Publiques · UDP 51820 · Chiffrement ChaCha20)
          </text>
          <rect x="92" y="112" width="456" height="64" rx="10" fill="#1E293B" stroke="#38BDF8" strokeWidth="2" />
          <text x="320" y="140" textAnchor="middle" className="fill-white text-[12px] font-mono font-bold">
            Paquet Interne chiffré : 10.8.0.2 → 10.0.2.50 (Intranet Privé)
          </text>
          <text x="320" y="162" textAnchor="middle" className="fill-sky-300 text-[10px]">
            Totalement illisible pour le Wi-Fi public et les routeurs Internet
          </text>
          <circle cx={72 + progress * 496} cy="222" r="5" fill="#059669" />
          <line x1="68" y1="222" x2="572" y2="222" stroke="#059669" strokeWidth="2" strokeDasharray="5 4" />
        </>
      )}

      {step === 3 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            WireGuard vs IPSec : Simplicité cryptographique &amp; Performance
          </text>
          <rect x="28" y="56" width="278" height="174" rx="12" fill="#ECFDF5" stroke="#059669" strokeWidth="2.5" />
          <text x="167" y="88" textAnchor="middle" className="fill-emerald-950 text-[14px] font-bold">
            WireGuard (Moderne)
          </text>
          <text x="48" y="120" className="fill-emerald-900 text-[11px]">
            • Port UDP 51820 · ~4 000 lignes de code
          </text>
          <text x="48" y="146" className="fill-emerald-900 text-[11px]">
            • Clés publiques/privées (Curve25519)
          </text>
          <text x="48" y="172" className="fill-emerald-900 text-[11px]">
            • Roaming 4G ↔ Wi-Fi instantané
          </text>
          <text x="48" y="202" className="fill-emerald-800 text-[11px] font-bold">
            Débit élevé &amp; latence minimale
          </text>

          <rect x="334" y="56" width="278" height="174" rx="12" fill="#FFFFFF" stroke="#64748B" strokeWidth="2" />
          <text x="473" y="88" textAnchor="middle" className="fill-slate-900 text-[14px] font-bold">
            IPSec (Standard Historique)
          </text>
          <text x="354" y="120" className="fill-slate-700 text-[11px]">
            • Négociation IKEv2 (UDP 500/4500) + ESP
          </text>
          <text x="354" y="146" className="fill-slate-700 text-[11px]">
            • Supporté par tous les routeurs matériels
          </text>
          <text x="354" y="172" className="fill-slate-700 text-[11px]">
            • Configuration plus lourde et verbeuse
          </text>
          <text x="354" y="202" className="fill-slate-800 text-[11px] font-bold">
            Très répandu en Site-to-Site Cloud
          </text>
        </>
      )}

      {step === 4 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            VPN Client-to-Site (Nomade) vs VPN Site-to-Site (Passerelles)
          </text>
          <rect x="30" y="56" width="580" height="82" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
          <text x="52" y="84" className="fill-sky-900 text-[12px] font-bold">
            1. Client-to-Site (Télétravail)
          </text>
          <text x="52" y="110" className="fill-slate-600 text-[11px]">
            PC portable distant ══[ Tunnel chiffré WireGuard ]══▶ Passerelle VPN Siège
          </text>

          <rect x="30" y="152" width="580" height="82" rx="10" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="52" y="180" className="fill-emerald-900 text-[12px] font-bold">
            2. Site-to-Site (Siège ↔ Cloud Azure / AWS)
          </text>
          <text x="52" y="206" className="fill-emerald-800 text-[11px]">
            Routeur Siège (10.1.0.0/16) ══[ Tunnel IPSec Permanent ]══▶ Cloud VPC (10.2.0.0/16)
          </text>
        </>
      )}

      {step === 5 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Split Tunneling vs Full Tunnel — Protéger les nomades sur Wi-Fi public
          </text>
          <rect x="28" y="60" width="278" height="168" rx="10" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
          <text x="167" y="92" textAnchor="middle" className="fill-amber-950 text-[13px] font-bold">
            Split Tunneling
          </text>
          <text x="48" y="124" className="fill-amber-900 text-[11px]">
            • Intranet → passe par le VPN
          </text>
          <text x="48" y="148" className="fill-amber-900 text-[11px]">
            • Web public → sort en direct (local)
          </text>
          <text x="48" y="186" className="fill-amber-950 text-[10px] font-semibold">
            Avantage : débit préservé au siège
          </text>

          <rect x="334" y="60" width="278" height="168" rx="10" fill="#ECFDF5" stroke="#059669" strokeWidth="2.5" />
          <text x="473" y="92" textAnchor="middle" className="fill-emerald-950 text-[13px] font-bold">
            Full Tunnel (Sécurité max)
          </text>
          <text x="354" y="124" className="fill-emerald-900 text-[11px]">
            • 100 % du trafic passe dans le VPN
          </text>
          <text x="354" y="148" className="fill-emerald-900 text-[11px]">
            • DNS &amp; Web protégés contre l&apos;écoute
          </text>
          <text x="354" y="186" className="fill-emerald-950 text-[10px] font-semibold">
            Indispensable sur un Wi-Fi public !
          </text>
        </>
      )}
    </svg>
  );
};

const Island19Visual: React.FC<{ step: number }> = ({ step }) => {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPulse((p) => (p + 1) % 24);
    }, 150);
    return () => window.clearInterval(id);
  }, []);

  const progress = pulse / 23;

  return (
    <svg
      viewBox="0 0 640 250"
      className="w-full max-w-2xl mx-auto"
      role="img"
      aria-label="Animation création serveur, configuration SSH/Nginx et placement pare-feu DMZ"
    >
      <rect x="8" y="8" width="624" height="234" rx="14" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />

      {step === 0 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 1 · Provisioning du Serveur (VPS / VM Cloud) &amp; OS Linux LTS
          </text>
          <rect x="34" y="54" width="250" height="162" rx="12" fill="#F8FAFC" stroke="#0284C7" strokeWidth="2" />
          <text x="159" y="80" textAnchor="middle" className="fill-sky-900 text-[12px] font-bold">
            Ressources Allouées
          </text>
          <text x="54" y="108" className="fill-slate-700 text-[11px] font-mono">• CPU : 4 vCPU dédiés</text>
          <text x="54" y="132" className="fill-slate-700 text-[11px] font-mono">• RAM : 8 Go ECC</text>
          <text x="54" y="156" className="fill-slate-700 text-[11px] font-mono">• Disque : 80 Go SSD NVMe</text>
          <text x="54" y="180" className="fill-emerald-700 text-[11px] font-mono font-bold">• IP fixe : 203.0.113.42</text>

          <rect x="318" y="54" width="288" height="162" rx="12" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />
          <text x="462" y="80" textAnchor="middle" className="fill-sky-300 text-[12px] font-bold">
            Installation Ubuntu Server 24.04 LTS
          </text>
          <text x="338" y="110" className="fill-emerald-400 text-[10.5px] font-mono">$ hostnamectl set-hostname srv-prod-01</text>
          <text x="338" y="134" className="fill-slate-300 text-[10.5px] font-mono">$ apt update &amp;&amp; apt upgrade -y</text>
          <rect x="338" y="154" width="248" height="12" rx="6" fill="#1E293B" />
          <rect x="338" y="154" width={Math.max(24, progress * 248)} height="12" rx="6" fill="#10B981" />
          <text x="462" y="192" textAnchor="middle" className="fill-emerald-300 text-[10.5px] font-mono font-bold">
            Serveur prêt · Support sécurité 5 ans
          </text>
        </>
      )}

      {step === 1 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 2 · Durcissement SSH (/etc/ssh/sshd_config)
          </text>
          <rect x="34" y="56" width="268" height="160" rx="12" fill="#FFF1F2" stroke="#E11D48" strokeWidth="2" />
          <text x="168" y="82" textAnchor="middle" className="fill-rose-900 text-[12px] font-bold">
            Avant (Serveur exposé)
          </text>
          <text x="52" y="114" className="fill-rose-800 text-[11px] font-mono">PermitRootLogin yes</text>
          <text x="52" y="140" className="fill-rose-800 text-[11px] font-mono">PasswordAuthentication yes</text>
          <text x="52" y="176" className="fill-rose-700 text-[10.5px] font-semibold">
            Cible immédiate des bots force brute SSH !
          </text>

          <rect x="338" y="56" width="268" height="160" rx="12" fill="#ECFDF5" stroke="#059669" strokeWidth="2.5" />
          <text x="472" y="82" textAnchor="middle" className="fill-emerald-950 text-[12px] font-bold">
            Après (Serveur durci)
          </text>
          <text x="356" y="112" className="fill-emerald-900 text-[11px] font-mono">adduser adminops &amp;&amp; sudo</text>
          <text x="356" y="136" className="fill-emerald-900 text-[11px] font-mono">PermitRootLogin no</text>
          <text x="356" y="160" className="fill-emerald-900 text-[11px] font-mono">PasswordAuthentication no</text>
          <text x="356" y="188" className="fill-emerald-800 text-[10.5px] font-bold">
            Clé cryptographique Ed25519 obligatoire
          </text>
        </>
      )}

      {step === 2 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 3 · Configuration Web : Reverse Proxy Nginx + HTTPS TLS
          </text>
          <rect x="28" y="84" width="136" height="92" rx="12" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2" />
          <text x="96" y="116" textAnchor="middle" className="fill-sky-900 text-[11.5px] font-bold">Visiteur Web</text>
          <text x="96" y="140" textAnchor="middle" className="fill-slate-600 text-[10px] font-mono">HTTPS :443</text>

          <rect x="236" y="66" width="168" height="128" rx="12" fill="#ECFDF5" stroke="#059669" strokeWidth="2.5" />
          <text x="320" y="94" textAnchor="middle" className="fill-emerald-950 text-[12px] font-bold">Nginx Reverse Proxy</text>
          <text x="320" y="118" textAnchor="middle" className="fill-emerald-800 text-[10px] font-mono">TLS 1.3 Let&apos;s Encrypt</text>
          <text x="320" y="142" textAnchor="middle" className="fill-emerald-800 text-[10px] font-mono">proxy_pass 127.0.0.1:3000</text>
          <text x="320" y="168" textAnchor="middle" className="fill-emerald-700 text-[10px] font-bold">systemctl enable nginx</text>

          <rect x="476" y="84" width="136" height="92" rx="12" fill="#0F172A" stroke="#6366F1" strokeWidth="2" />
          <text x="544" y="116" textAnchor="middle" className="fill-white text-[11.5px] font-bold">App Interne</text>
          <text x="544" y="140" textAnchor="middle" className="fill-indigo-300 text-[10px] font-mono">127.0.0.1:3000</text>
          <text x="544" y="158" textAnchor="middle" className="fill-slate-400 text-[9.5px]">Non exposée WAN</text>

          <line x1="164" y1="130" x2="236" y2="130" stroke="#059669" strokeWidth="2.5" />
          <line x1="404" y1="130" x2="476" y2="130" stroke="#6366F1" strokeWidth="2.5" strokeDasharray="5 3" />
          <circle cx={164 + progress * 72} cy="130" r="5" fill="#059669" />
          <circle cx={404 + progress * 72} cy="130" r="5" fill="#6366F1" />
        </>
      )}

      {step === 3 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 4 · Où placer le Pare-feu ? Architecture DMZ &amp; Défense en Profondeur
          </text>
          <rect x="18" y="74" width="90" height="106" rx="10" fill="#FFF1F2" stroke="#E11D48" strokeWidth="2" />
          <text x="63" y="118" textAnchor="middle" className="fill-rose-900 text-[11px] font-bold">Internet</text>
          <text x="63" y="138" textAnchor="middle" className="fill-rose-700 text-[9.5px]">WAN public</text>

          <rect x="132" y="62" width="102" height="130" rx="10" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2.5" />
          <text x="183" y="96" textAnchor="middle" className="fill-indigo-950 text-[11px] font-bold">Pare-feu 1</text>
          <text x="183" y="114" textAnchor="middle" className="fill-indigo-700 text-[9.5px] font-mono">Périmétrique</text>
          <text x="183" y="142" textAnchor="middle" className="fill-emerald-700 text-[9.5px] font-mono font-bold">OK :443</text>
          <text x="183" y="160" textAnchor="middle" className="fill-rose-600 text-[9.5px] font-mono font-bold">DROP :5432</text>

          <rect x="258" y="62" width="114" height="130" rx="10" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
          <text x="315" y="94" textAnchor="middle" className="fill-amber-950 text-[11px] font-bold">Zone DMZ</text>
          <text x="315" y="118" textAnchor="middle" className="fill-amber-900 text-[10px]">Serveur Web</text>
          <text x="315" y="136" textAnchor="middle" className="fill-amber-800 text-[9.5px] font-mono">Nginx + App</text>

          <rect x="396" y="62" width="102" height="130" rx="10" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2.5" />
          <text x="447" y="96" textAnchor="middle" className="fill-indigo-950 text-[11px] font-bold">Pare-feu 2</text>
          <text x="447" y="114" textAnchor="middle" className="fill-indigo-700 text-[9.5px] font-mono">Interne</text>
          <text x="447" y="142" textAnchor="middle" className="fill-emerald-700 text-[9.5px] font-mono font-bold">DMZ→DB :5432</text>
          <text x="447" y="160" textAnchor="middle" className="fill-rose-600 text-[9.5px] font-mono font-bold">Reste DROP</text>

          <rect x="522" y="74" width="100" height="106" rx="10" fill="#ECFDF5" stroke="#059669" strokeWidth="2.5" />
          <text x="572" y="114" textAnchor="middle" className="fill-emerald-950 text-[11px] font-bold">LAN Privé</text>
          <text x="572" y="134" textAnchor="middle" className="fill-emerald-800 text-[9.5px] font-mono">Base SQL</text>
          <text x="572" y="152" textAnchor="middle" className="fill-emerald-700 text-[9px]">Isolée WAN</text>

          <line x1="108" y1="127" x2="132" y2="127" stroke="#059669" strokeWidth="2" />
          <line x1="234" y1="127" x2="258" y2="127" stroke="#059669" strokeWidth="2" />
          <line x1="372" y1="127" x2="396" y2="127" stroke="#059669" strokeWidth="2" />
          <line x1="498" y1="127" x2="522" y2="127" stroke="#059669" strokeWidth="2" />
          <circle cx={108 + progress * 414} cy="127" r="4.5" fill="#10B981" />

          <text x="320" y="218" textAnchor="middle" className="fill-slate-600 text-[10.5px] font-semibold">
            Double protection : FW1 filtre Internet ; FW2 protège la base de données si la DMZ est attaquée.
          </text>
        </>
      )}

      {step === 4 && (
        <>
          <text x="320" y="26" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 5 · Règles UFW : Politique « Tout bloquer par défaut »
          </text>
          <rect x="30" y="48" width="580" height="176" rx="12" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <text x="50" y="76" className="fill-amber-300 text-[11px] font-mono font-bold">
            $ sudo ufw default deny incoming   # Tout bloquer par défaut
          </text>
          <text x="50" y="102" className="fill-emerald-400 text-[11px] font-mono">
            $ sudo ufw allow 443/tcp           # HTTPS public autorisé       → ALLOW
          </text>
          <text x="50" y="128" className="fill-emerald-400 text-[11px] font-mono">
            $ sudo ufw allow 80/tcp            # Redirection HTTPS           → ALLOW
          </text>
          <text x="50" y="154" className="fill-sky-300 text-[11px] font-mono">
            $ sudo ufw allow from 203.0.113.10 to any port 22   # SSH Admin  → RESTREINT
          </text>
          <text x="50" y="180" className="fill-rose-400 text-[11px] font-mono">
            # Ports 5432 (SQL), 3306, 23 (Telnet), 445 (SMB)                 → DROP
          </text>
          <text x="50" y="206" className="fill-white text-[11px] font-mono font-bold">
            $ sudo ufw enable &amp;&amp; sudo ufw status verbose
          </text>
        </>
      )}

      {step === 5 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 6 · Maintien en Production : Fail2ban, Supervision &amp; Sauvegardes
          </text>
          {[
            {
              x: 28,
              title: 'Fail2ban Actif',
              line1: 'Bannit automatiquement',
              line2: 'toute IP après 5 échecs SSH',
              bg: '#EEF2FF',
              stroke: '#4F46E5',
            },
            {
              x: 226,
              title: 'Patchs Auto',
              line1: 'unattended-upgrades',
              line2: 'Correctifs noyau & TLS',
              bg: '#F0F9FF',
              stroke: '#0284C7',
            },
            {
              x: 424,
              title: 'Backup 3-2-1',
              line1: 'Sauvegarde chiffrée',
              line2: 'hors-site chaque nuit',
              bg: '#ECFDF5',
              stroke: '#059669',
            },
          ].map((card) => (
            <g key={card.title}>
              <rect x={card.x} y="64" width="188" height="142" rx="12" fill={card.bg} stroke={card.stroke} strokeWidth="2" />
              <text x={card.x + 94} y="102" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
                {card.title}
              </text>
              <text x={card.x + 94} y="134" textAnchor="middle" className="fill-slate-700 text-[11px]">
                {card.line1}
              </text>
              <text x={card.x + 94} y="156" textAnchor="middle" className="fill-slate-700 text-[11px]">
                {card.line2}
              </text>
            </g>
          ))}
        </>
      )}
    </svg>
  );
};

const Island20Visual: React.FC<{ step: number }> = ({ step }) => {
  return (
    <svg
      viewBox="0 0 640 260"
      className="w-full h-auto"
      role="img"
      aria-label="Animation Switching L2, VLANs 802.1Q, Trunk et Wi-Fi WPA3-Enterprise"
    >
      <rect x="0" y="0" width="640" height="260" rx="12" fill="#EBF4FA" />

      {step === 0 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 1 · Danger du Réseau Plat (1 seul domaine de broadcast)
          </text>
          <rect x="44" y="48" width="552" height="178" rx="14" fill="#FEF2F2" stroke="#DC2626" strokeWidth="2" strokeDasharray="6 4" />
          <text x="320" y="72" textAnchor="middle" className="fill-rose-700 text-[11px] font-mono font-bold">
            VLAN 1 UNIQUE — TOUS LES APPAREILS SE VOIENT DIRECTEMENT
          </text>
          {[
            { x: 70, label: 'Invité Wi-Fi', sub: 'PC infecté', bg: '#FEE2E2', stroke: '#DC2626' },
            { x: 205, label: 'Employés', sub: '192.168.1.20', bg: '#FFFFFF', stroke: '#64748B' },
            { x: 340, label: 'Direction', sub: '192.168.1.10', bg: '#FFFFFF', stroke: '#64748B' },
            { x: 475, label: 'Serveur ERP', sub: 'EXPOSÉ !', bg: '#FEF3C7', stroke: '#D97706' },
          ].map((n) => (
            <g key={n.label}>
              <rect x={n.x} y="102" width="112" height="82" rx="10" fill={n.bg} stroke={n.stroke} strokeWidth="2" />
              <text x={n.x + 56} y="138" textAnchor="middle" className="fill-slate-900 text-[11px] font-bold">
                {n.label}
              </text>
              <text x={n.x + 56} y="160" textAnchor="middle" className="fill-slate-600 text-[10px] font-mono">
                {n.sub}
              </text>
            </g>
          ))}
        </>
      )}

      {step === 1 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 2 · Segmentation Logique en 4 VLANs sur Switch Managé
          </text>
          <rect x="195" y="48" width="250" height="44" rx="8" fill="#0F172A" />
          <text x="320" y="75" textAnchor="middle" className="fill-sky-300 text-[12px] font-mono font-bold">
            SWITCH L2 · SW-CAMPUS-01
          </text>
          {[
            { x: 32, vlan: 'VLAN 10', name: 'Direction', port: 'Fa0/1 Access', bg: '#EEF2FF', stroke: '#4F46E5' },
            { x: 180, vlan: 'VLAN 20', name: 'Employés', port: 'Fa0/2 Access', bg: '#F0F9FF', stroke: '#0284C7' },
            { x: 328, vlan: 'VLAN 30', name: 'Invités', port: 'Fa0/3 Access', bg: '#FEF3C7', stroke: '#D97706' },
            { x: 476, vlan: 'VLAN 99', name: 'Serveurs', port: 'Fa0/4 Access', bg: '#ECFDF5', stroke: '#059669' },
          ].map((v) => (
            <g key={v.vlan}>
              <line x1="320" y1="92" x2={v.x + 66} y2="128" stroke={v.stroke} strokeWidth="2.5" />
              <rect x={v.x} y="128" width="132" height="96" rx="10" fill={v.bg} stroke={v.stroke} strokeWidth="2" />
              <text x={v.x + 66} y="156" textAnchor="middle" className="fill-slate-900 text-[12px] font-mono font-bold">
                {v.vlan}
              </text>
              <text x={v.x + 66} y="178" textAnchor="middle" className="fill-slate-800 text-[11px] font-bold">
                {v.name}
              </text>
              <text x={v.x + 66} y="202" textAnchor="middle" className="fill-slate-600 text-[10px] font-mono">
                {v.port}
              </text>
            </g>
          ))}
        </>
      )}

      {step === 2 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 3 · Lien Trunk IEEE 802.1Q (Étiquetage des Trames)
          </text>
          <rect x="36" y="84" width="144" height="92" rx="10" fill="#0F172A" />
          <text x="108" y="124" textAnchor="middle" className="fill-white text-[12px] font-bold">
            Switch Étage
          </text>
          <text x="108" y="146" textAnchor="middle" className="fill-sky-300 text-[10px] font-mono">
            Gi0/1 : TRUNK
          </text>

          <rect x="460" y="84" width="144" height="92" rx="10" fill="#0369A1" />
          <text x="532" y="124" textAnchor="middle" className="fill-white text-[12px] font-bold">
            Routeur Cœur
          </text>
          <text x="532" y="146" textAnchor="middle" className="fill-sky-100 text-[10px] font-mono">
            802.1Q Sub-if
          </text>

          <line x1="180" y1="130" x2="460" y2="130" stroke="#0284C7" strokeWidth="6" />
          <rect x="214" y="96" width="212" height="68" rx="8" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
          <text x="320" y="122" textAnchor="middle" className="fill-slate-900 text-[11px] font-mono font-bold">
            Trame Ethernet + Tag 802.1Q
          </text>
          <text x="320" y="146" textAnchor="middle" className="fill-sky-700 text-[11px] font-mono font-bold">
            [VLAN 10] [VLAN 20] [VLAN 30] [VLAN 99]
          </text>
        </>
      )}

      {step === 3 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 4 · Routage Inter-VLAN &amp; Filtrage par ACL
          </text>
          <rect x="34" y="64" width="160" height="68" rx="10" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2" />
          <text x="114" y="94" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            VLAN 20 Employés
          </text>
          <text x="114" y="114" textAnchor="middle" className="fill-sky-700 text-[10px] font-mono">
            10.20.0.0/24
          </text>

          <rect x="34" y="156" width="160" height="68" rx="10" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
          <text x="114" y="186" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            VLAN 30 Invités
          </text>
          <text x="114" y="206" textAnchor="middle" className="fill-amber-800 text-[10px] font-mono">
            10.30.0.0/24
          </text>

          <rect x="250" y="102" width="140" height="82" rx="10" fill="#0F172A" />
          <text x="320" y="138" textAnchor="middle" className="fill-white text-[12px] font-bold">
            Routeur + ACL
          </text>
          <text x="320" y="160" textAnchor="middle" className="fill-emerald-400 text-[10px] font-mono">
            Filtrage L3
          </text>

          <rect x="446" y="102" width="160" height="82" rx="10" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="526" y="138" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            VLAN 99 Serveurs
          </text>
          <text x="526" y="160" textAnchor="middle" className="fill-emerald-700 text-[10px] font-mono">
            ERP :443 uniquement
          </text>

          <line x1="194" y1="98" x2="250" y2="128" stroke="#059669" strokeWidth="3" />
          <line x1="390" y1="143" x2="446" y2="143" stroke="#059669" strokeWidth="3" />
          <line x1="194" y1="190" x2="250" y2="162" stroke="#DC2626" strokeWidth="3" strokeDasharray="5 4" />
          <text x="218" y="212" textAnchor="middle" className="fill-rose-700 text-[10px] font-mono font-bold">
            DENY Invités → Serveurs
          </text>
        </>
      )}

      {step === 4 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 5 · Wi-Fi Entreprise WPA3-Enterprise (802.1X / RADIUS)
          </text>
          <rect x="34" y="88" width="150" height="92" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
          <text x="109" y="124" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            Laptop Salarié
          </text>
          <text x="109" y="148" textAnchor="middle" className="fill-sky-700 text-[10px] font-mono">
            Certificat / Compte AD
          </text>

          <rect x="245" y="88" width="150" height="92" rx="10" fill="#0369A1" />
          <text x="320" y="124" textAnchor="middle" className="fill-white text-[12px] font-bold">
            Borne Wi-Fi 6/7
          </text>
          <text x="320" y="148" textAnchor="middle" className="fill-sky-100 text-[10px] font-mono">
            WPA3-Enterprise
          </text>

          <rect x="456" y="88" width="150" height="92" rx="10" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="531" y="124" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            Serveur RADIUS
          </text>
          <text x="531" y="148" textAnchor="middle" className="fill-emerald-700 text-[10px] font-mono">
            Auth 802.1X · OK
          </text>

          <line x1="184" y1="134" x2="245" y2="134" stroke="#0284C7" strokeWidth="3" />
          <line x1="395" y1="134" x2="456" y2="134" stroke="#059669" strokeWidth="3" />
        </>
      )}

      {step === 5 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 6 · Wi-Fi Visiteurs Isolé (VLAN 30) + Client Isolation
          </text>
          {[
            { x: 32, title: 'SSID Cyberland-Staff', line1: 'WPA3-Enterprise + RADIUS', line2: 'Assigné au VLAN 20', bg: '#F0F9FF', stroke: '#0284C7' },
            { x: 226, title: 'SSID Cyberland-Guest', line1: 'Portail Captif + Client Isolation', line2: 'Assigné au VLAN 30', bg: '#FEF3C7', stroke: '#D97706' },
            { x: 420, title: 'Défense L2/L3 Active', line1: 'Port Security + ACL Inter-VLAN', line2: 'Zéro mouvement latéral', bg: '#ECFDF5', stroke: '#059669' },
          ].map((c) => (
            <g key={c.title}>
              <rect x={c.x} y="68" width="188" height="140" rx="12" fill={c.bg} stroke={c.stroke} strokeWidth="2" />
              <text x={c.x + 94} y="106" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
                {c.title}
              </text>
              <text x={c.x + 94} y="138" textAnchor="middle" className="fill-slate-700 text-[11px]">
                {c.line1}
              </text>
              <text x={c.x + 94} y="162" textAnchor="middle" className="fill-slate-600 text-[10px] font-mono">
                {c.line2}
              </text>
            </g>
          ))}
        </>
      )}
    </svg>
  );
};

/* ---------- ISLAND 21: IPv6 & Transition IPv4/IPv6 ---------- */
const Island21Visual: React.FC<{ step: number }> = ({ step }) => {
  return (
    <svg viewBox="0 0 640 260" className="w-full h-full max-h-[260px]" role="img" aria-label="Animation IPv6 et transition réseau">
      <rect x="0" y="0" width="640" height="260" fill="#EBF4FA" />

      {step === 0 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 1 · IPv4 (32 bits épuisé) vs IPv6 (128 bits quasi infini)
          </text>
          <rect x="34" y="56" width="254" height="168" rx="14" fill="#FFF7ED" stroke="#EA580C" strokeWidth="2" />
          <text x="161" y="84" textAnchor="middle" className="fill-orange-900 text-[13px] font-bold">
            IPv4 — 32 bits
          </text>
          <text x="161" y="108" textAnchor="middle" className="fill-slate-800 text-[12px] font-mono font-bold">
            192.168.1.42
          </text>
          <text x="161" y="136" textAnchor="middle" className="fill-slate-700 text-[11px]">
            4,3 milliards d’adresses (2³²)
          </text>
          <rect x="64" y="156" width="194" height="44" rx="8" fill="#FFEDD5" stroke="#FB923C" />
          <text x="161" y="175" textAnchor="middle" className="fill-orange-900 text-[10px] font-bold">
            Stock RIR épuisé
          </text>
          <text x="161" y="191" textAnchor="middle" className="fill-orange-800 text-[10px]">
            NAT / CGNAT obligatoire
          </text>

          <rect x="352" y="56" width="254" height="168" rx="14" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="479" y="84" textAnchor="middle" className="fill-emerald-900 text-[13px] font-bold">
            IPv6 — 128 bits
          </text>
          <text x="479" y="108" textAnchor="middle" className="fill-slate-800 text-[11px] font-mono font-bold">
            2001:db8:cafe::1
          </text>
          <text x="479" y="136" textAnchor="middle" className="fill-slate-700 text-[11px]">
            3,4 × 10³⁸ adresses (2¹²⁸)
          </text>
          <rect x="382" y="156" width="194" height="44" rx="8" fill="#D1FAE5" stroke="#10B981" />
          <text x="479" y="175" textAnchor="middle" className="fill-emerald-900 text-[10px] font-bold">
            Connectivité bout en bout
          </text>
          <text x="479" y="191" textAnchor="middle" className="fill-emerald-800 text-[10px]">
            Sous-réseaux standard en /64
          </text>

          <text x="320" y="144" textAnchor="middle" className="fill-sky-700 text-[18px] font-black">
            →
          </text>
        </>
      )}

      {step === 1 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 2 · Compression IPv6 conforme à la RFC 5952
          </text>
          <rect x="28" y="52" width="584" height="50" rx="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1.8" />
          <text x="320" y="72" textAnchor="middle" className="fill-slate-500 text-[10px] font-bold">
            FORME COMPLÈTE (8 HEXTETS = 128 BITS)
          </text>
          <text x="320" y="92" textAnchor="middle" className="fill-slate-900 text-[12px] font-mono font-bold">
            2001 : 0db8 : 0000 : 0000 : 0000 : 0000 : 0042 : 0001
          </text>

          <line x1="320" y1="102" x2="320" y2="128" stroke="#0284C7" strokeWidth="2" strokeDasharray="4 3" />
          <text x="320" y="121" textAnchor="middle" className="fill-sky-800 text-[10px] font-bold">
            1. Retirer zéros de tête · 2. Remplacer la plus longue suite de 0000 par :: (1 seule fois)
          </text>

          <rect x="90" y="138" width="460" height="58" rx="12" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="320" y="160" textAnchor="middle" className="fill-emerald-800 text-[10px] font-bold">
            FORME COMPRESSÉE VALIDE
          </text>
          <text x="320" y="182" textAnchor="middle" className="fill-emerald-950 text-[16px] font-mono font-extrabold">
            2001:db8::42:1
          </text>

          <rect x="130" y="210" width="380" height="32" rx="8" fill="#FEF2F2" stroke="#DC2626" />
          <text x="320" y="230" textAnchor="middle" className="fill-rose-800 text-[11px] font-bold">
            Interdit : 2001::db8::1 (deux « :: » créent une ambiguïté de longueur)
          </text>
        </>
      )}

      {step === 2 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 3 · Cartographie des préfixes IPv6 à connaître par cœur
          </text>
          {[
            { x: 24, prefix: '::1/128', name: 'Loopback', desc: 'Machine locale (localhost)', bg: '#F8FAFC', stroke: '#475569' },
            { x: 174, prefix: 'fe80::/10', name: 'Link-Local', desc: 'LAN uniquement (non routé)', bg: '#FEF3C7', stroke: '#D97706' },
            { x: 324, prefix: 'fc00::/7', name: 'ULA (Privé)', desc: 'Intranet (ex. fd12:...)', bg: '#EDE9FE', stroke: '#7C3AED' },
            { x: 474, prefix: '2000::/3', name: 'Global Unicast', desc: 'Routable sur Internet', bg: '#ECFDF5', stroke: '#059669' },
          ].map((item) => (
            <g key={item.prefix}>
              <rect x={item.x} y="64" width="142" height="156" rx="12" fill={item.bg} stroke={item.stroke} strokeWidth="2" />
              <text x={item.x + 71} y="102" textAnchor="middle" className="fill-slate-900 text-[13px] font-mono font-extrabold">
                {item.prefix}
              </text>
              <text x={item.x + 71} y="136" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
                {item.name}
              </text>
              <text x={item.x + 71} y="168" textAnchor="middle" className="fill-slate-700 text-[10px]">
                {item.desc}
              </text>
            </g>
          ))}
        </>
      )}

      {step === 3 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 4 · Auto-configuration SLAAC & NDP (ICMPv6)
          </text>
          <rect x="44" y="72" width="146" height="118" rx="12" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
          <text x="117" y="102" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            Nouveau Poste
          </text>
          <text x="117" y="126" textAnchor="middle" className="fill-sky-700 text-[10px] font-mono">
            fe80::a1b2 (Link-Local)
          </text>
          <text x="117" y="152" textAnchor="middle" className="fill-emerald-700 text-[10px] font-mono font-bold">
            + 2001:db8:1::9f4e/64
          </text>
          <text x="117" y="172" textAnchor="middle" className="fill-slate-500 text-[9px]">
            DAD : vérifie unicité
          </text>

          <rect x="450" y="72" width="146" height="118" rx="12" fill="#F0F9FF" stroke="#0369A1" strokeWidth="2" />
          <text x="523" y="102" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            Routeur Passerelle
          </text>
          <text x="523" y="126" textAnchor="middle" className="fill-sky-800 text-[10px] font-mono">
            Préfixe : 2001:db8:1::/64
          </text>
          <text x="523" y="150" textAnchor="middle" className="fill-slate-600 text-[10px]">
            RDNSS : 2606:4700::1111
          </text>

          <line x1="194" y1="104" x2="444" y2="104" stroke="#0284C7" strokeWidth="2.5" />
          <text x="320" y="96" textAnchor="middle" className="fill-sky-900 text-[10px] font-bold">
            1. Router Solicitation (RS → ff02::2) →
          </text>

          <line x1="444" y1="146" x2="194" y2="146" stroke="#059669" strokeWidth="2.5" />
          <text x="320" y="138" textAnchor="middle" className="fill-emerald-900 text-[10px] font-bold">
            ← 2. Router Advertisement (RA : /64 + Gateway)
          </text>

          <rect x="120" y="210" width="400" height="32" rx="8" fill="#ECFDF5" stroke="#059669" />
          <text x="320" y="230" textAnchor="middle" className="fill-emerald-900 text-[11px] font-bold">
            Aucun broadcast ARP : NDP utilise le multicast sollicité ICMPv6 (types 133–136)
          </text>
        </>
      )}

      {step === 4 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 5 · Transition Dual-Stack, DNS AAAA & Pare-feu miroir
          </text>
          <rect x="34" y="68" width="160" height="128" rx="12" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
          <text x="114" y="98" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            Client Dual-Stack
          </text>
          <text x="114" y="124" textAnchor="middle" className="fill-slate-600 text-[10px]">
            Happy Eyeballs (RFC 8305)
          </text>
          <text x="114" y="146" textAnchor="middle" className="fill-emerald-700 text-[10px] font-bold">
            1er essai : IPv6 (AAAA)
          </text>
          <text x="114" y="168" textAnchor="middle" className="fill-orange-700 text-[10px]">
            Fallback : IPv4 (A)
          </text>

          <rect x="240" y="68" width="160" height="128" rx="12" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
          <text x="320" y="98" textAnchor="middle" className="fill-amber-950 text-[12px] font-bold">
            Pare-feu Dual-Stack
          </text>
          <text x="320" y="126" textAnchor="middle" className="fill-slate-800 text-[10px] font-mono">
            nftables inet filter
          </text>
          <text x="320" y="148" textAnchor="middle" className="fill-amber-900 text-[10px]">
            Filtre IPv4 ET IPv6
          </text>
          <text x="320" y="170" textAnchor="middle" className="fill-slate-700 text-[10px]">
            Autorise ICMPv6 NDP
          </text>

          <rect x="446" y="68" width="160" height="128" rx="12" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="526" y="98" textAnchor="middle" className="fill-emerald-950 text-[12px] font-bold">
            Serveur Web
          </text>
          <text x="526" y="126" textAnchor="middle" className="fill-emerald-800 text-[10px] font-mono">
            AAAA: 2001:db8::443
          </text>
          <text x="526" y="148" textAnchor="middle" className="fill-slate-700 text-[10px] font-mono">
            A: 203.0.113.10
          </text>
          <text x="526" y="170" textAnchor="middle" className="fill-slate-600 text-[10px]">
            listen [::]:443 ssl
          </text>

          <line x1="194" y1="132" x2="240" y2="132" stroke="#059669" strokeWidth="2.5" />
          <line x1="400" y1="132" x2="446" y2="132" stroke="#059669" strokeWidth="2.5" />
        </>
      )}
    </svg>
  );
};

/* ---------- ISLAND 22: Sécurité API, OAuth 2.0 & JWT ---------- */
const Island22Visual: React.FC<{ step: number }> = ({ step }) => {
  return (
    <svg viewBox="0 0 640 260" className="w-full h-full max-h-[260px]" role="img" aria-label="Animation Sécurité API, OAuth 2.0 et JWT">
      <rect x="0" y="0" width="640" height="260" fill="#EBF4FA" />

      {step === 0 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 1 · Passerelle API (API Gateway) & Contrôle centralisé
          </text>
          <rect x="30" y="76" width="144" height="112" rx="12" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
          <text x="102" y="112" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            SPA / Mobile
          </text>
          <text x="102" y="136" textAnchor="middle" className="fill-slate-600 text-[10px] font-mono">
            GET /api/v1/orders
          </text>
          <text x="102" y="158" textAnchor="middle" className="fill-sky-700 text-[10px] font-mono">
            Bearer eyJhbGc...
          </text>

          <rect x="234" y="60" width="172" height="144" rx="14" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2.2" />
          <text x="320" y="88" textAnchor="middle" className="fill-indigo-950 text-[12px] font-bold">
            API Gateway
          </text>
          <text x="320" y="114" textAnchor="middle" className="fill-indigo-800 text-[10px]">
            • Terminaison TLS 1.3
          </text>
          <text x="320" y="136" textAnchor="middle" className="fill-indigo-800 text-[10px]">
            • Validation JWT / JWKS
          </text>
          <text x="320" y="158" textAnchor="middle" className="fill-indigo-800 text-[10px]">
            • Rate Limiting (429)
          </text>
          <text x="320" y="180" textAnchor="middle" className="fill-indigo-800 text-[10px]">
            • Schéma JSON strict
          </text>

          <rect x="466" y="76" width="144" height="112" rx="12" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="538" y="112" textAnchor="middle" className="fill-emerald-950 text-[12px] font-bold">
            Microservices
          </text>
          <text x="538" y="136" textAnchor="middle" className="fill-emerald-800 text-[10px]">
            Contrôle RBAC / BOLA
          </text>
          <text x="538" y="158" textAnchor="middle" className="fill-slate-600 text-[10px]">
            Base de données
          </text>

          <line x1="174" y1="132" x2="234" y2="132" stroke="#4F46E5" strokeWidth="2.5" />
          <line x1="406" y1="132" x2="466" y2="132" stroke="#059669" strokeWidth="2.5" />
        </>
      )}

      {step === 1 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 2 · OAuth 2.0 Authorization Code + PKCE (S256)
          </text>
          <rect x="34" y="62" width="150" height="156" rx="12" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
          <text x="109" y="92" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
            Application Cliente
          </text>
          <text x="109" y="120" textAnchor="middle" className="fill-sky-700 text-[10px] font-mono">
            secret: code_verifier
          </text>
          <text x="109" y="144" textAnchor="middle" className="fill-slate-600 text-[10px] font-mono">
            hash: code_challenge
          </text>
          <text x="109" y="176" textAnchor="middle" className="fill-emerald-700 text-[10px] font-bold">
            Zéro mot de passe stocké
          </text>

          <rect x="456" y="62" width="150" height="156" rx="12" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="531" y="92" textAnchor="middle" className="fill-emerald-950 text-[12px] font-bold">
            Serveur IdP (OAuth)
          </text>
          <text x="531" y="120" textAnchor="middle" className="fill-slate-700 text-[10px]">
            Authentifie l’utilisateur
          </text>
          <text x="531" y="144" textAnchor="middle" className="fill-slate-700 text-[10px]">
            Vérifie SHA256(verifier)
          </text>
          <text x="531" y="176" textAnchor="middle" className="fill-emerald-800 text-[10px] font-bold">
            Émet Access + Refresh
          </text>

          <line x1="186" y1="92" x2="452" y2="92" stroke="#0284C7" strokeWidth="2" />
          <text x="320" y="84" textAnchor="middle" className="fill-sky-900 text-[10px] font-bold">
            1. /authorize + code_challenge (S256) →
          </text>

          <line x1="452" y1="130" x2="186" y2="130" stroke="#D97706" strokeWidth="2" />
          <text x="320" y="122" textAnchor="middle" className="fill-amber-900 text-[10px] font-bold">
            ← 2. Code temporaire à usage unique
          </text>

          <line x1="186" y1="168" x2="452" y2="168" stroke="#4F46E5" strokeWidth="2" />
          <text x="320" y="160" textAnchor="middle" className="fill-indigo-900 text-[10px] font-bold">
            3. /token + code + code_verifier →
          </text>

          <line x1="452" y1="204" x2="186" y2="204" stroke="#059669" strokeWidth="2.5" />
          <text x="320" y="196" textAnchor="middle" className="fill-emerald-900 text-[10px] font-bold">
            ← 4. Access Token JWT (15 min)
          </text>
        </>
      )}

      {step === 2 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 3 · Anatomie d’un JSON Web Token (JWT)
          </text>
          {[
            {
              x: 26,
              title: '1. HEADER',
              sub: 'Base64Url',
              lines: ['{ "alg": "RS256",', '  "typ": "JWT",', '  "kid": "key-2026" }'],
              bg: '#FEF2F2',
              stroke: '#E11D48',
            },
            {
              x: 226,
              title: '2. PAYLOAD (Claims)',
              sub: 'Lisible par tous !',
              lines: ['{ "sub": "u_42",', '  "role": "analyst",', '  "exp": 1795501200 }'],
              bg: '#F5F3FF',
              stroke: '#7C3AED',
            },
            {
              x: 426,
              title: '3. SIGNATURE',
              sub: 'Clé privée IdP',
              lines: ['RSASHA256(', '  header + "." + payload,', '  privateKey )'],
              bg: '#ECFDF5',
              stroke: '#059669',
            },
          ].map((part) => (
            <g key={part.title}>
              <rect x={part.x} y="56" width="188" height="154" rx="12" fill={part.bg} stroke={part.stroke} strokeWidth="2" />
              <text x={part.x + 94} y="82" textAnchor="middle" className="fill-slate-900 text-[11px] font-extrabold">
                {part.title}
              </text>
              <text x={part.x + 94} y="100" textAnchor="middle" className="fill-slate-600 text-[10px]">
                {part.sub}
              </text>
              {part.lines.map((line, i) => (
                <text key={line} x={part.x + 14} y={132 + i * 20} className="fill-slate-800 text-[10px] font-mono">
                  {line}
                </text>
              ))}
            </g>
          ))}
          <text x="220" y="138" textAnchor="middle" className="fill-slate-900 text-[20px] font-black">.</text>
          <text x="420" y="138" textAnchor="middle" className="fill-slate-900 text-[20px] font-black">.</text>

          <text x="320" y="236" textAnchor="middle" className="fill-slate-700 text-[11px] font-bold">
            Signé ≠ Chiffré : ne stockez jamais de mot de passe ou secret bancaire dans le Payload.
          </text>
        </>
      )}

      {step === 3 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 4 · Neutraliser l’attaque alg:none & sécuriser le cycle de vie
          </text>
          <rect x="34" y="60" width="268" height="162" rx="12" fill="#FEF2F2" stroke="#DC2626" strokeWidth="2" />
          <text x="168" y="88" textAnchor="middle" className="fill-rose-900 text-[12px] font-bold">
            Attaque JWT classique
          </text>
          <text x="168" y="116" textAnchor="middle" className="fill-rose-800 text-[10px] font-mono">
            Header modifié : &#123;"alg": "none"&#125;
          </text>
          <text x="168" y="138" textAnchor="middle" className="fill-rose-800 text-[10px] font-mono">
            Payload modifié : role="admin"
          </text>
          <text x="168" y="162" textAnchor="middle" className="fill-slate-700 text-[10px]">
            Signature supprimée ou jeton volé
          </text>
          <text x="168" y="186" textAnchor="middle" className="fill-rose-700 text-[10px] font-bold">
            → Refusé si le backend valide strictement
          </text>

          <rect x="338" y="60" width="268" height="162" rx="12" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="472" y="88" textAnchor="middle" className="fill-emerald-900 text-[12px] font-bold">
            Défense côté Serveur
          </text>
          <text x="472" y="116" textAnchor="middle" className="fill-emerald-900 text-[10px]">
            ✓ Liste blanche : algorithms: [&quot;RS256&quot;]
          </text>
          <text x="472" y="140" textAnchor="middle" className="fill-emerald-900 text-[10px]">
            ✓ Vérifier iss, aud et exp (≤ 15 min)
          </text>
          <text x="472" y="164" textAnchor="middle" className="fill-emerald-900 text-[10px]">
            ✓ Refresh Token en cookie HttpOnly
          </text>
          <text x="472" y="188" textAnchor="middle" className="fill-emerald-900 text-[10px]">
            ✓ Rotation + détection de réutilisation
          </text>
        </>
      )}

      {step === 4 && (
        <>
          <text x="320" y="28" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
            Étape 5 · OWASP API #1 : Bloquer IDOR / BOLA & Abus de débit
          </text>
          <rect x="34" y="62" width="180" height="156" rx="12" fill="#FFF7ED" stroke="#EA580C" strokeWidth="2" />
          <text x="124" y="92" textAnchor="middle" className="fill-orange-950 text-[12px] font-bold">
            Requête suspecte
          </text>
          <text x="124" y="122" textAnchor="middle" className="fill-slate-800 text-[10px] font-mono">
            Token sub = user_42
          </text>
          <text x="124" y="146" textAnchor="middle" className="fill-rose-700 text-[10px] font-mono font-bold">
            GET /invoices/1043
          </text>
          <text x="124" y="172" textAnchor="middle" className="fill-slate-600 text-[10px]">
            (appartient à user_99)
          </text>

          <rect x="242" y="62" width="180" height="156" rx="12" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" />
          <text x="332" y="92" textAnchor="middle" className="fill-indigo-950 text-[12px] font-bold">
            Contrôle d’objet (BOLA)
          </text>
          <text x="332" y="124" textAnchor="middle" className="fill-indigo-900 text-[10px] font-mono">
            invoice.ownerId ===
          </text>
          <text x="332" y="144" textAnchor="middle" className="fill-indigo-900 text-[10px] font-mono">
            req.user.sub ?
          </text>
          <text x="332" y="176" textAnchor="middle" className="fill-rose-700 text-[11px] font-extrabold">
            FAUX → HTTP 403
          </text>

          <rect x="450" y="62" width="156" height="156" rx="12" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
          <text x="528" y="92" textAnchor="middle" className="fill-emerald-950 text-[12px] font-bold">
            Hygiène API
          </text>
          <text x="528" y="124" textAnchor="middle" className="fill-emerald-900 text-[10px]">
            • Identifiants UUIDv4
          </text>
          <text x="528" y="148" textAnchor="middle" className="fill-emerald-900 text-[10px]">
            • Rate Limit (HTTP 429)
          </text>
          <text x="528" y="172" textAnchor="middle" className="fill-emerald-900 text-[10px]">
            • Journalisation SIEM
          </text>

          <line x1="214" y1="140" x2="242" y2="140" stroke="#EA580C" strokeWidth="2" />
          <line x1="422" y1="140" x2="450" y2="140" stroke="#059669" strokeWidth="2" />
        </>
      )}
    </svg>
  );
};








