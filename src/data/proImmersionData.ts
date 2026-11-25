export interface JargonEntry {
  term: string;
  plainFrench: string;
  workplaceExample: string;
}

export interface WorkplaceMessage {
  channel: 'Email' | 'Messagerie Équipe' | 'Ticket GLPI' | 'Alerte Console';
  sender: string;
  role: string;
  time: string;
  subject: string;
  body: string;
}

export interface TriageQuestion {
  prompt: string;
  options: { id: string; label: string; isCorrect: boolean; feedback: string }[];
}

export interface AuditRowItem {
  id: string;
  account: string;
  department: string;
  detail: string;
  expectedAction: 'keep' | 'restrict' | 'disable';
  explanation: string;
}

export interface EmailResponseOption {
  id: string;
  toneLabel: string;
  preview: string;
  isBest: boolean;
  feedback: string;
}

export interface ImmersionDay {
  dayNumber: number;
  dayLabel: string;
  timeLabel: string;
  title: string;
  roleContext: string;
  difficultyLabel: string;
  estimatedMinutes: number;
  xpReward: number;
  relatedIslandId: number;
  summary: string;
  whyRealWorld: string;
  messages: WorkplaceMessage[];
  jargon: JargonEntry[];
  beginnerHints: [string, string];
  step1Triage: TriageQuestion;
  step2Mode: 'checklist' | 'audit-table';
  step2Title: string;
  step2Instruction: string;
  checklistItems?: {
    id: string;
    label: string;
    shouldSelect: boolean;
    reason: string;
  }[];
  auditRows?: AuditRowItem[];
  step3CommunicationPrompt: string;
  step3Options: EmailResponseOption[];
  cvBullet: string;
  interviewQuestion: string;
  interviewAnswer: string;
}

export const IMMERSION_COMPANY = {
  name: 'Atelier Nord-Val',
  sector: 'PME industrielle & e-commerce (140 collaborateurs)',
  city: 'Lyon, France',
  yourRole: 'Technicien·ne Systèmes, Réseaux & Cyber Junior',
  supervisor: 'Nadia Benali — Responsable SI & Sécurité',
  standards: 'Bonnes pratiques ANSSI · Conformité RGPD / CNIL',
};

export const IMMERSION_DAYS: ImmersionDay[] = [
  {
    dayNumber: 1,
    dayLabel: 'Lundi',
    timeLabel: '09h15',
    title: 'Premier ticket : Suspicion de phishing à la comptabilité',
    roleContext: 'Support N1 & Premiers réflexes Cyber',
    difficultyLabel: 'Grand débutant',
    estimatedMinutes: 8,
    xpReward: 90,
    relatedIslandId: 10,
    summary:
      'Claire, du service comptabilité, vient de cliquer sur un lien dans un e-mail « Facture URSSAF urgente » et a saisi ses identifiants Microsoft 365.',
    whyRealWorld:
      'En entreprise, 80 % des premiers tickets cybersécurité concernent un utilisateur qui a cliqué par erreur. Savoir réagir vite et sans culpabiliser la personne est une compétence clé dès la première semaine.',
    messages: [
      {
        channel: 'Messagerie Équipe',
        sender: 'Claire Moreau',
        role: 'Comptable fournisseurs',
        time: '09h12',
        subject: 'Besoin d’aide svp… j’ai peut-être fait une bêtise',
        body: 'Bonjour ! Je viens de recevoir un mail de « urssaf-recouvrement-fr.com » disant qu’un virement était bloqué. J’ai cliqué et tapé mon mot de passe habituel, puis la page s’est fermée. Mon compte risque quelque chose ? Je suis désolée…',
      },
      {
        channel: 'Alerte Console',
        sender: 'Console Microsoft Entra ID',
        role: 'Journal de connexions',
        time: '09h14',
        subject: 'Connexion inhabituelle détectée (claire.moreau@nord-val.fr)',
        body: 'Nouvelle session ouverte depuis Francfort (IP 185.220.101.44) à 09h13. Une règle de transfert automatique vient d’être créée sur la boîte mail vers compta-archive-ext@proton.me.',
      },
    ],
    jargon: [
      {
        term: 'Phishing (Hameçonnage)',
        plainFrench: 'Faux message imitant un organisme de confiance pour voler un mot de passe.',
        workplaceExample: 'Un faux e-mail URSSAF ou banque avec un nom de domaine légèrement différent.',
      },
      {
        term: 'Révocation de sessions',
        plainFrench: 'Déconnecter de force tous les appareils actuellement connectés au compte.',
        workplaceExample: 'Changer le mot de passe seul ne suffit pas toujours : le pirate peut garder sa session ouverte.',
      },
      {
        term: 'MFA (Double authentification)',
        plainFrench: 'Second facteur (application mobile ou clé) demandé en plus du mot de passe.',
        workplaceExample: 'Même avec le mot de passe volé, l’attaquant reste bloqué sans le code sur le téléphone.',
      },
      {
        term: 'Règle de transfert mail',
        plainFrench: 'Redirection silencieuse des e-mails reçus vers une adresse externe.',
        workplaceExample: 'Technique classique de persistance pour espionner les factures et préparer une fraude au virement.',
      },
    ],
    beginnerHints: [
      'Regardez l’alerte de 09h14 : l’attaquant est déjà connecté depuis l’étranger et a posé une règle de transfert. Il faut couper sa session ET supprimer cette règle.',
      'Pour la réponse à Claire, restez bienveillant et factuel : un collaborateur rassuré signalera toujours un incident plus vite la prochaine fois.',
    ],
    step1Triage: {
      prompt: 'Comment qualifier ce ticket dans l’outil de support (GLPI) ?',
      options: [
        {
          id: 't1',
          label: 'Priorité Basse — Demande d’information utilisateur à traiter en fin de journée',
          isCorrect: false,
          feedback: 'Une connexion étrangère est déjà active sur le compte comptable : chaque minute compte.',
        },
        {
          id: 't2',
          label: 'Incident Sécurité Priorité Haute (P1) — Compromission de compte confirmée',
          isCorrect: true,
          feedback: 'Exact : le journal confirme une connexion non autorisée et une règle de transfert malveillante.',
        },
        {
          id: 't3',
          label: 'Hors périmètre IT — Renvoyer Claire vers le site officiel de l’URSSAF',
          isCorrect: false,
          feedback: 'C’est bien au support IT/Cyber de sécuriser immédiatement le compte professionnel.',
        },
      ],
    },
    step2Mode: 'checklist',
    step2Title: 'Actions techniques immédiates sur le compte',
    step2Instruction:
      'Cochez uniquement les actions utiles et sûres à exécuter maintenant (évitez les gestes inutiles ou contre-productifs).',
    checklistItems: [
      {
        id: 'c1',
        label: 'Révoquer toutes les sessions actives et réinitialiser le mot de passe de Claire',
        shouldSelect: true,
        reason: 'Expulse immédiatement l’attaquant connecté depuis Francfort.',
      },
      {
        id: 'c2',
        label: 'Supprimer la règle de transfert vers compta-archive-ext@proton.me',
        shouldSelect: true,
        reason: 'Supprime la persistance mise en place pour espionner les factures.',
      },
      {
        id: 'c3',
        label: 'Vérifier que la double authentification (MFA) est bien active sur le compte',
        shouldSelect: true,
        reason: 'Protège le compte contre une réutilisation future du mot de passe.',
      },
      {
        id: 'c4',
        label: 'Formater immédiatement le serveur ERP de l’entreprise',
        shouldSelect: false,
        reason: 'Disproportionné et hors périmètre : seule la messagerie cloud de Claire est compromise ici.',
      },
      {
        id: 'c5',
        label: 'Envoyer un avertissement public à toute l’entreprise en citant le nom de Claire',
        shouldSelect: false,
        reason: 'À proscrire absolument : culpabiliser un salarié pousse les équipes à cacher les futurs incidents.',
      },
    ],
    step3CommunicationPrompt:
      'Quel message envoyez-vous à Claire pour la guider sans stress ?',
    step3Options: [
      {
        id: 'e1',
        toneLabel: 'Rassurant, clair et professionnel',
        preview:
          'Bonjour Claire, merci d’avoir réagi très vite ! Nous avons déconnecté l’accès suspect et nettoyé votre boîte mail. Je vous appelle dans 2 minutes pour définir un nouveau mot de passe avec votre téléphone (MFA). Aucune inquiétude, votre signalement rapide a évité tout dégât.',
        isBest: true,
        feedback:
          'Parfait : ton humain, zéro reproche, action claire et valorisation du bon réflexe de signalement.',
      },
      {
        id: 'e2',
        toneLabel: 'Sec et culpabilisant',
        preview:
          'Bonjour, vous n’auriez jamais dû cliquer sur un lien URSSAF. Votre compte est bloqué pour non-respect de la charte informatique.',
        isBest: false,
        feedback:
          'Trop brusque : en entreprise, la culture sécurité repose sur la confiance pour que les salariés osent alerter immédiatement.',
      },
      {
        id: 'e3',
        toneLabel: 'Jargon technique incompréhensible',
        preview:
          'Bonjour, nous avons effectué un revokeSignInSessions Graph API et purgé la MailboxRule d’exfiltration SMTP suite au credential harvesting.',
        isBest: false,
        feedback:
          'Un collaborateur non-IT a besoin d’un français simple et d’instructions concrètes.',
      },
    ],
    cvBullet:
      'Traitement d’incidents de phishing N1/N2 : qualification de compromission M365, révocation de sessions, suppression de règles de transfert malveillantes et accompagnement utilisateur.',
    interviewQuestion:
      'Un salarié vous dit qu’il vient de saisir son mot de passe sur un faux site. Quels sont vos 3 premiers réflexes ?',
    interviewAnswer:
      'Je le remercie pour sa réactivité, je révoque ses sessions actives tout en réinitialisant son mot de passe avec MFA, puis je vérifie les journaux de connexion et d’éventuelles règles de transfert ou d’applications tierces ajoutées à son insu.',
  },
  {
    dayNumber: 2,
    dayLabel: 'Mardi',
    timeLabel: '11h00',
    title: 'Panne réseau à l’entrepôt : les postes affichent 169.254.x.x',
    roleContext: 'Diagnostic Réseau Terrain (DHCP / VLAN)',
    difficultyLabel: 'Débutant guidé',
    estimatedMinutes: 9,
    xpReward: 90,
    relatedIslandId: 2,
    summary:
      'Les 12 postes de préparation de commandes de l’entrepôt n’arrivent plus à joindre l’ERP. Les étiquettes colis sont bloquées.',
    whyRealWorld:
      'Savoir reconnaître immédiatement une adresse APIPA (169.254.x.x) et diagnostiquer un serveur DHCP saturé fait gagner des heures de production en entreprise.',
    messages: [
      {
        channel: 'Ticket GLPI',
        sender: 'Marc Delacroix',
        role: 'Responsable logistique',
        time: '10h55',
        subject: 'URGENT — Plus d’ERP ni d’imprimantes colis à l’entrepôt',
        body: 'Depuis le redémarrage de ce matin, les 12 PC de la zone expédition affichent "Pas d’accès Internet". Les camionneurs arrivent à 13h30. Pouvez-vous regarder ?',
      },
      {
        channel: 'Alerte Console',
        sender: 'Diagnostic poste PC-ENTREPOT-04 & Serveur DHCP',
        role: 'Relevé technique',
        time: '10h58',
        subject: 'Sortie ipconfig & étendue VLAN 30 (Entrepôt)',
        body: 'PC-ENTREPOT-04 : Adresse IPv4 = 169.254.82.19 | Masque = 255.255.0.0 | Passerelle = (vide).\nServeur SRV-DHCP-01 (Étendue 192.168.30.10 – 192.168.30.60) : 51 / 51 baux utilisés (100 % saturé — durée de bail réglée sur 30 jours alors que 35 scanners Wi-Fi temporaires s’y sont connectés).',
      },
    ],
    jargon: [
      {
        term: 'APIPA (169.254.x.x)',
        plainFrench: 'Adresse de secours que Windows s’attribue tout seul quand aucun serveur DHCP ne répond.',
        workplaceExample: 'Dès que vous voyez 169.254.x.x, cherchez un souci DHCP ou un câble/VLAN coupé.',
      },
      {
        term: 'Bail DHCP (Lease)',
        plainFrench: 'Durée pendant laquelle une adresse IP est prêtée à un appareil.',
        workplaceExample: 'Un bail de 30 jours sur un réseau avec beaucoup d’appareils mobiles épuise vite la plage IP.',
      },
      {
        term: 'VLAN (Réseau virtuel)',
        plainFrench: 'Découpage logique qui sépare les services (ex : Entrepôt, Compta, Invités) sur les mêmes câbles.',
        workplaceExample: 'Séparer les scanners Wi-Fi dans un VLAN dédié évite qu’ils saturent les PC fixes.',
      },
    ],
    beginnerHints: [
      'Une adresse en 169.254.x.x indique que le PC n’a pas reçu d’adresse IP valide du serveur DHCP.',
      'Regardez la console DHCP : 51 adresses sur 51 sont occupées pendant 30 jours à cause des scanners temporaires. Il faut libérer les baux expirés, raccourcir la durée du bail et élargir la plage (ou isoler les scanners).',
    ],
    step1Triage: {
      prompt: 'Quelle est la cause racine exacte de la panne à l’entrepôt ?',
      options: [
        {
          id: 'd1',
          label: 'La fibre optique Internet de l’opérateur est coupée',
          isCorrect: false,
          feedback: 'Même sans Internet, un serveur DHCP interne continuerait à distribuer des IP en 192.168.30.x.',
        },
        {
          id: 'd2',
          label: 'L’étendue DHCP du VLAN 30 est saturée à 100 %, plaçant les PC en APIPA (169.254.x.x)',
          isCorrect: true,
          feedback: 'Bravo ! Diagnostic propre et immédiat grâce à la lecture croisée d’ipconfig et de la console DHCP.',
        },
        {
          id: 'd3',
          label: 'Le serveur ERP est piraté par un ransomware',
          isCorrect: false,
          feedback: 'Aucun indice d’attaque ici : les postes n’ont même pas d’adresse IP locale ni de passerelle.',
        },
      ],
    },
    step2Mode: 'checklist',
    step2Title: 'Plan de remise en service avant le départ des camions',
    step2Instruction: 'Sélectionnez les actions correctives durables à appliquer sur le réseau.',
    checklistItems: [
      {
        id: 'n1',
        label: 'Purger les anciens baux inactifs et agrandir la plage DHCP (ex : .10 à .200)',
        shouldSelect: true,
        reason: 'Libère immédiatement des adresses IP pour les 12 postes bloqués.',
      },
      {
        id: 'n2',
        label: 'Ramener la durée du bail DHCP de 30 jours à 8 heures (une journée de travail)',
        shouldSelect: true,
        reason: 'Évite que les appareils temporaires monopolisent la plage pendant un mois.',
      },
      {
        id: 'n3',
        label: 'Exécuter ipconfig /renew sur les postes de l’entrepôt et vérifier l’accès ERP',
        shouldSelect: true,
        reason: 'Valide concrètement la reprise d’activité auprès du métier.',
      },
      {
        id: 'n4',
        label: 'Désactiver le pare-feu Windows sur tous les postes de l’entrepôt',
        shouldSelect: false,
        reason: 'Dangereux et inutile : le pare-feu n’est pas la cause de la saturation DHCP.',
      },
    ],
    step3CommunicationPrompt: 'Comment tenez-vous informé Marc (Responsable logistique) ?',
    step3Options: [
      {
        id: 'm1',
        toneLabel: 'Clair, orienté métier et avec heure de reprise',
        preview:
          'Bonjour Marc, nous avons identifié la cause : la réserve d’adresses réseau de l’entrepôt était pleine suite aux nouveaux scanners. Je libère la plage maintenant ; les 12 postes retrouveront l’ERP d’ici 10 minutes, largement avant 13h30. Je vous confirme dès que le premier bon de livraison s’imprime.',
        isBest: true,
        feedback: 'Excellent : Marc comprend la situation sans jargon et connaît le délai exact.',
      },
      {
        id: 'm2',
        toneLabel: 'Silence radio jusqu’à 14h',
        preview: 'Ne rien répondre dans le ticket tant que le script n’est pas fini.',
        isBest: false,
        feedback: 'En entreprise, laisser un service bloqué sans nouvelles génère du stress inutile et des appels en cascade.',
      },
      {
        id: 'm3',
        toneLabel: 'Trop technique et anxiogène',
        preview: 'Votre broadcast DHCPDISCOVER échoue sur le VLAN 30 car le pool /24 est exhausté.',
        isBest: false,
        feedback: 'Traduisons toujours le diagnostic en impact concret pour nos collègues métiers.',
      },
    ],
    cvBullet:
      'Résolution d’incident réseau critique en production : diagnostic APIPA (169.254.x.x), déblocage d’étendue DHCP saturée, ajustement des baux et rétablissement du service ERP.',
    interviewQuestion:
      'Un utilisateur vous dit qu’il n’a plus de réseau et son IP commence par 169.254. Que comprenez-vous tout de suite ?',
    interviewAnswer:
      'C’est une adresse APIPA auto-attribuée par le système faute de réponse DHCP. Je vérifie le lien physique/VLAN, l’état du service DHCP, le relais DHCP si le serveur est dans un autre VLAN, et si la plage d’adresses n’est pas saturée.',
  },
  {
    dayNumber: 3,
    dayLabel: 'Mercredi',
    timeLabel: '14h30',
    title: 'Revue des droits Active Directory & principe du moindre privilège',
    roleContext: 'Administration Systèmes & Hygiène AD',
    difficultyLabel: 'Débutant guidé',
    estimatedMinutes: 10,
    xpReward: 90,
    relatedIslandId: 31,
    summary:
      'Avant un audit client, Nadia vous demande de passer en revue 5 comptes Active Directory sensibles : prestataires partis, stagiaire sur-privilégié et comptes de service.',
    whyRealWorld:
      'La revue trimestrielle des comptes AD est une mission réelle confiée très tôt aux juniors. C’est l’un des meilleurs moyens d’empêcher un ransomware de prendre le contrôle de toute l’entreprise.',
    messages: [
      {
        channel: 'Email',
        sender: 'Nadia Benali',
        role: 'Responsable SI & Sécurité',
        time: '14h20',
        subject: 'Revue rapide des comptes AD avant l’audit client de lundi',
        body: 'Salut ! Merci pour ton efficacité depuis lundi. Peux-tu regarder cet export de 5 comptes Active Directory avec le listing RH ? Repère les comptes à désactiver et ceux dont il faut réduire les droits. On valide ensemble à 15h30.',
      },
      {
        channel: 'Messagerie Équipe',
        sender: 'Sophie Laurent',
        role: 'Ressources Humaines',
        time: '14h25',
        subject: 'Confirmation départs',
        body: 'Je te confirme que Julien Garnier (prestataire ERP) a fini sa mission le 15 du mois dernier, et que Lucas Petit est bien notre stagiaire marketing actuel.',
      },
    ],
    jargon: [
      {
        term: 'Active Directory (AD)',
        plainFrench: 'L’annuaire central de l’entreprise qui gère tous les comptes, mots de passe et droits d’accès.',
        workplaceExample: 'Quand un salarié quitte l’entreprise, désactiver son compte AD coupe ses accès d’un seul coup.',
      },
      {
        term: 'Moindre privilège',
        plainFrench: 'Ne donner à chaque compte que les droits strictement nécessaires à son travail, rien de plus.',
        workplaceExample: 'Un stagiaire marketing n’a aucune raison d’être « Administrateur du domaine ».',
      },
      {
        term: 'Compte dormant (Orphelin)',
        plainFrench: 'Compte d’un ancien salarié ou prestataire laissé actif par oubli après son départ.',
        workplaceExample: 'Porte d’entrée favorite des attaquants car personne ne surveille ce compte.',
      },
    ],
    beginnerHints: [
      'Croisez les infos RH : tout prestataire parti doit être désactivé immédiatement, et un stagiaire marketing ne doit jamais appartenir au groupe « Admins du domaine ».',
      'Attention : le compte de sauvegarde planifiée et la comptable en poste ont besoin de rester actifs, mais un compte de sauvegarde n’a pas besoin de connexion interactive RDP.',
    ],
    step1Triage: {
      prompt: 'Pourquoi la présence d’un stagiaire dans le groupe « Admins du domaine » est-elle critique ?',
      options: [
        {
          id: 'a1',
          label: 'Parce que si son poste est infecté, l’attaquant obtient instantanément le contrôle total de l’entreprise',
          isCorrect: true,
          feedback: 'Exact ! Le principe du moindre privilège limite drastiquement le rayon d’explosion en cas d’incident.',
        },
        {
          id: 'a2',
          label: 'Parce que cela ralentit la vitesse Wi-Fi de son ordinateur',
          isCorrect: false,
          feedback: 'Ce n’est pas un problème de débit mais un risque majeur d’élévation de privilèges.',
        },
        {
          id: 'a3',
          label: 'Ce n’est pas grave tant qu’il a un mot de passe de 8 caractères',
          isCorrect: false,
          feedback: 'Un mot de passe court sur un compte Admin du domaine est au contraire une vulnérabilité critique.',
        },
      ],
    },
    step2Mode: 'audit-table',
    step2Title: 'Revue opérationnelle des 5 comptes Active Directory',
    step2Instruction:
      'Pour chaque compte, choisissez la décision adaptée : Conserver, Réduire les droits, ou Désactiver.',
    auditRows: [
      {
        id: 'ad-1',
        account: 'j.garnier-ext',
        department: 'Prestataire ERP (mission terminée)',
        detail: 'Accès VPN actif · Membre Utilisateurs du domaine',
        expectedAction: 'disable',
        explanation: 'Mission terminée le mois dernier : le compte et l’accès VPN doivent être désactivés immédiatement.',
      },
      {
        id: 'ad-2',
        account: 'l.petit',
        department: 'Stagiaire Marketing',
        detail: 'Membre de « Admins du domaine » (ajouté par erreur lors d’un dépannage imprimante)',
        expectedAction: 'restrict',
        explanation: 'Compte légitime mais sur-privilégié : retirer immédiatement de « Admins du domaine ».',
      },
      {
        id: 'ad-3',
        account: 'c.moreau',
        department: 'Comptabilité (en poste)',
        detail: 'Utilisateur standard · MFA activé · Accès dossier Compta uniquement',
        expectedAction: 'keep',
        explanation: 'Droits conformes au poste et protégés par MFA : à conserver tel quel.',
      },
      {
        id: 'ad-4',
        account: 'svc_backup',
        department: 'Compte de service Sauvegarde',
        detail: 'Mot de passe complexe · Ouverture de session Bureau à distance (RDP) autorisée partout',
        expectedAction: 'restrict',
        explanation: 'Un compte de service doit rester actif pour les sauvegardes, mais l’accès RDP interactif doit lui être retiré.',
      },
      {
        id: 'ad-5',
        account: 'admin_test_2022',
        department: 'Inconnu (aucune connexion depuis 410 jours)',
        detail: 'Mot de passe n’expire jamais · Membre Opérateurs de serveur',
        expectedAction: 'disable',
        explanation: 'Compte de test oublié à privilèges élevés : à désactiver immédiatement puis supprimer après vérification.',
      },
    ],
    step3CommunicationPrompt:
      'Comment présentez-vous le résultat de votre revue à Nadia (Responsable SI) ?',
    step3Options: [
      {
        id: 'c-ad1',
        toneLabel: 'Synthèse structurée + proposition de process durable',
        preview:
          'Bonjour Nadia, revue terminée : 2 comptes dormants/partis à désactiver (j.garnier-ext, admin_test_2022) et 2 réductions de droits (retrait Admin du domaine pour l.petit, retrait RDP sur svc_backup). Je propose de mettre en place un rappel mensuel avec les RH pour les fins de contrat.',
        isBest: true,
        feedback: 'Exemplaire : clair, chiffré, et force de proposition pour éviter que le problème ne se reproduise.',
      },
      {
        id: 'c-ad2',
        toneLabel: 'Suppression sans prévenir',
        preview: 'J’ai supprimé tous les comptes qui me semblaient bizarres, y compris svc_backup.',
        isBest: false,
        feedback: 'Supprimer un compte de service sans analyse casse les sauvegardes de nuit ! On restreint ou on désactive proprement avec validation.',
      },
      {
        id: 'c-ad3',
        toneLabel: 'Trop vague',
        preview: 'C’est bon j’ai regardé, il y a deux-trois trucs pas top dans l’AD.',
        isBest: false,
        feedback: 'En entreprise, on nomme toujours précisément les comptes et les actions recommandées.',
      },
    ],
    cvBullet:
      'Revue des accès Active Directory et application du principe du moindre privilège : désactivation de comptes dormants/prestataires et durcissement des comptes de service.',
    interviewQuestion:
      'Comment mettez-vous concrètement en œuvre le principe du moindre privilège dans Active Directory ?',
    interviewAnswer:
      'Je sépare les comptes standards des comptes d’administration dédiés, j’attribue les droits par groupes de sécurité liés au métier, je bloque les ouvertures de session interactives sur les comptes de service et je réalise des revues périodiques synchronisées avec les RH.',
  },
  {
    dayNumber: 4,
    dayLabel: 'Jeudi',
    timeLabel: '16h10',
    title: 'Stockage Cloud exposé & alerte Sauvegarde (RGPD / ANSSI)',
    roleContext: 'Sécurité Cloud, PRA & Conformité',
    difficultyLabel: 'Intermédiaire doux',
    estimatedMinutes: 9,
    xpReward: 90,
    relatedIslandId: 6,
    summary:
      'Un espace de stockage Cloud contenant des factures clients est accidentellement accessible en lecture publique, et la sauvegarde hors-ligne de la nuit a échoué.',
    whyRealWorld:
      'Les erreurs de configuration Cloud (buckets publics) et les sauvegardes non testées sont les deux causes les plus fréquentes d’incidents graves en PME française, avec une obligation légale RGPD (notification CNIL sous 72h en cas de fuite avérée).',
    messages: [
      {
        channel: 'Alerte Console',
        sender: 'Audit Cloud & Console Backup',
        role: 'Supervision',
        time: '16h05',
        subject: '2 alertes actives : Bucket public & Échec copie hors-ligne',
        body: '1) Conteneur Cloud « nordval-factures-2026 » : accès public anonyme = ACTIVÉ (contient noms, adresses postales et montants de 420 clients).\n2) Sauvegarde ERP : copie locale OK, mais copie hors-ligne immuable en échec depuis 4 jours (disque cible plein).',
      },
      {
        channel: 'Email',
        sender: 'Maître Hélène Caron',
        role: 'DPO externe (Protection des données)',
        time: '16h09',
        subject: 'Question RGPD sur l’alerte du stockage factures',
        body: 'Bonjour, j’ai vu passer l’alerte sur le conteneur de factures clients. Pouvez-vous couper l’accès public immédiatement et vérifier dans les journaux d’accès si des IP externes ont téléchargé des fichiers ? Si oui, le délai CNIL de 72 heures s’applique.',
      },
    ],
    jargon: [
      {
        term: 'Règle de sauvegarde 3-2-1',
        plainFrench: '3 copies des données, sur 2 supports différents, dont 1 copie hors site / hors-ligne (immuable).',
        workplaceExample: 'Indispensable contre les ransomwares qui chiffrent aussi les sauvegardes branchées au réseau.',
      },
      {
        term: 'DPO & Délai CNIL 72h',
        plainFrench: 'En cas de fuite de données personnelles en France/UE, l’entreprise dispose de 72h pour notifier la CNIL.',
        workplaceExample: 'Les noms et adresses de facturation clients sont des données personnelles protégées par le RGPD.',
      },
      {
        term: 'Sauvegarde immuable',
        plainFrench: 'Copie verrouillée en écriture pendant une durée fixée : personne ne peut la supprimer ni la chiffrer.',
        workplaceExample: 'Même avec un compte administrateur volé, le ransomware ne peut pas effacer la sauvegarde immuable.',
      },
    ],
    beginnerHints: [
      'Priorité n°1 : couper immédiatement l’accès public du bucket Cloud, puis conserver les logs d’accès pour permettre à la DPO d’évaluer s’il y a eu fuite de données personnelles.',
      'Pour la sauvegarde, sans copie hors-ligne opérationnelle, la règle 3-2-1 est cassée : il faut libérer/étendre l’espace cible et tester une restauration.',
    ],
    step1Triage: {
      prompt: 'Pourquoi devez-vous consulter les journaux d’accès du stockage Cloud juste après avoir coupé l’accès public ?',
      options: [
        {
          id: 'r1',
          label: 'Pour savoir si des données personnelles clients ont été téléchargées par des tiers (obligation RGPD / CNIL 72h)',
          isCorrect: true,
          feedback: 'Parfait : couper la fuite protège l’avenir, analyser les logs permet de remplir l’obligation légale de traçabilité.',
        },
        {
          id: 'r2',
          label: 'Pour effacer les traces afin que personne ne sache que le bucket était public',
          isCorrect: false,
          feedback: 'Jamais ! Effacer des preuves d’incident est illégal (RGPD) et empêche de protéger les clients concernés.',
        },
        {
          id: 'r3',
          label: 'Ce n’est pas utile puisque le bucket ne contenait que des factures',
          isCorrect: false,
          feedback: 'Une facture contient des noms, adresses et parfois des coordonnées bancaires : ce sont bien des données personnelles.',
        },
      ],
    },
    step2Mode: 'checklist',
    step2Title: 'Plan de remédiation Cloud & Sauvegarde',
    step2Instruction: 'Activez les mesures techniques conformes aux recommandations ANSSI & RGPD.',
    checklistItems: [
      {
        id: 'cl1',
        label: 'Passer immédiatement le conteneur « nordval-factures-2026 » en accès Privé (Block Public Access)',
        shouldSelect: true,
        reason: 'Stoppe instantanément toute exposition sur Internet.',
      },
      {
        id: 'cl2',
        label: 'Exporter les journaux d’accès Cloud des 7 derniers jours pour la DPO',
        shouldSelect: true,
        reason: 'Permet de déterminer factuellement si une notification CNIL sous 72h est nécessaire.',
      },
      {
        id: 'cl3',
        label: 'Résoudre la saturation du stockage hors-ligne, relancer la copie immuable et tester une restauration',
        shouldSelect: true,
        reason: 'Une sauvegarde non testée n’est pas une sauvegarde : la règle 3-2-1 est restaurée.',
      },
      {
        id: 'cl4',
        label: 'Désactiver les alertes de sauvegarde pour ne plus recevoir d’e-mails d’erreur',
        shouldSelect: false,
        reason: 'Masquer une alerte critique garantit de découvrir la panne le jour d’un vrai sinistre.',
      },
    ],
    step3CommunicationPrompt: 'Quelle réponse envoyez-vous à la DPO (Hélène Caron) ?',
    step3Options: [
      {
        id: 'dpo1',
        toneLabel: 'Factuel, transparent et chronologique',
        preview:
          'Bonjour Maître Caron, l’accès public du conteneur « nordval-factures-2026 » a été coupé à 16h12. Je suis en train d’extraire les journaux d’accès sur la période d’exposition afin de vous confirmer dans l’heure si des téléchargements externes ont eu lieu pour le registre RGPD.',
        isBest: true,
        feedback: 'Impeccable : horodatage précis, action immédiate réalisée et collaboration fluide avec la DPO.',
      },
      {
        id: 'dpo2',
        toneLabel: 'Minimisation sans preuve',
        preview: 'Ne vous inquiétez pas, personne ne connaît l’URL de notre bucket, il n’y a aucun risque.',
        isBest: false,
        feedback: 'Des robots scannent en permanence les buckets publics sur Internet : on s’appuie toujours sur les logs, jamais sur une supposition.',
      },
      {
        id: 'dpo3',
        toneLabel: 'Déni de responsabilité',
        preview: 'Ce n’est pas moi qui ai créé ce bucket, voyez avec l’équipe développement.',
        isBest: false,
        feedback: 'Face à une exposition de données, on sécurise d’abord et on coordonne sereinement ensuite.',
      },
    ],
    cvBullet:
      'Remédiation d’exposition Cloud (fermeture d’accès public, analyse des logs pour conformité RGPD/CNIL 72h) et remise en conformité de sauvegardes 3-2-1 immuables.',
    interviewQuestion:
      'Qu’est-ce que la règle de sauvegarde 3-2-1 et pourquoi parle-t-on aujourd’hui de copie immuable ?',
    interviewAnswer:
      'La règle 3-2-1 prévoit 3 copies des données sur 2 supports différents, dont 1 hors site. La copie immuable ajoute un verrou empêchant toute modification ou suppression, ce qui protège les sauvegardes contre les ransomwares.',
  },
  {
    dayNumber: 5,
    dayLabel: 'Vendredi',
    timeLabel: '10h00',
    title: 'Point hebdomadaire Direction & Bilan d’expérience',
    roleContext: 'Restitution RSSI, Priorisation & Valorisation CV',
    difficultyLabel: 'Synthèse métier',
    estimatedMinutes: 7,
    xpReward: 90,
    relatedIslandId: 16,
    summary:
      'C’est le point de fin de première semaine avec Nadia et le Directeur Général : vous devez résumer les actions menées et recommander les 3 priorités du trimestre sans noyer la direction sous le jargon.',
    whyRealWorld:
      'La différence entre un profil purement « CTF » et un professionnel opérationnel ? Savoir expliquer un risque technique en impact métier, prioriser les chantiers et documenter son travail.',
    messages: [
      {
        channel: 'Email',
        sender: 'Nadia Benali',
        role: 'Responsable SI & Sécurité',
        time: '09h45',
        subject: 'Point 1re semaine avec la Direction à 10h00',
        body: 'Bravo pour ta première semaine ! Pour notre point de 15 minutes avec le DG, prépare une synthèse claire : ce qu’on a sécurisé cette semaine et les 3 chantiers prioritaires à fort impact (faible coût, gros gain sécurité) pour le trimestre.',
      },
    ],
    jargon: [
      {
        term: 'Quick Win (Gain rapide)',
        plainFrench: 'Action simple et peu coûteuse qui réduit fortement un risque majeur.',
        workplaceExample: 'Généraliser la double authentification (MFA) ou bloquer les buckets publics par défaut.',
      },
      {
        term: 'Impact métier',
        plainFrench: 'Conséquence concrète d’une panne ou attaque sur l’activité (arrêts de production, chiffre d’affaires, image).',
        workplaceExample: 'Dire « 12 postes colis bloqués avant les départs camions » parle beaucoup plus à un DG que « pool DHCP saturé ».',
      },
      {
        term: 'REX (Retour d’Expérience)',
        plainFrench: 'Bilan factuel après un incident pour améliorer les procédures sans chercher de coupable.',
        workplaceExample: 'Ajouter un contrôle mensuel RH/IT après avoir trouvé des comptes d’anciens prestataires.',
      },
    ],
    beginnerHints: [
      'La Direction attend des faits simples : risques maîtrisés, temps d’arrêt évité et priorités concrètes (MFA partout, sensibilisation phishing bienveillante, sauvegardes testées).',
      'Évitez les achats démesurés non justifiés : les recommandations ANSSI commencent toujours par l’hygiène informatique de base.',
    ],
    step1Triage: {
      prompt: 'Comment structurer une restitution de 5 minutes devant un Directeur Général non technique ?',
      options: [
        {
          id: 'v1',
          label: '1) Faits et impacts métier évités · 2) Actions réalisées · 3) 3 priorités pragmatiques pour le trimestre',
          isCorrect: true,
          feedback: 'Parfait ! C’est exactement la structure attendue en comité de direction.',
        },
        {
          id: 'v2',
          label: 'Lire ligne par ligne les 400 événements des journaux Microsoft Entra ID et DHCP',
          isCorrect: false,
          feedback: 'Trop technique pour un dirigeant : gardez les journaux bruts en annexe technique.',
        },
        {
          id: 'v3',
          label: 'Dire que tout est parfait et ne mentionner aucun risque restant',
          isCorrect: false,
          feedback: 'La transparence mesurée permet d’obtenir le budget et le soutien nécessaires aux améliorations.',
        },
      ],
    },
    step2Mode: 'checklist',
    step2Title: 'Sélectionner les 3 chantiers prioritaires (Guide Hygiène ANSSI)',
    step2Instruction:
      'Choisissez les 3 chantiers à plus fort rapport efficacité/effort à proposer pour le trimestre.',
    checklistItems: [
      {
        id: 'p1',
        label: 'Généraliser la double authentification (MFA) sur 100 % des comptes mail et VPN',
        shouldSelect: true,
        reason: 'Mesure n°1 contre le vol de mots de passe et le phishing.',
      },
      {
        id: 'p2',
        label: 'Instaurer un circuit mensuel RH → IT pour désactiver les comptes dès le départ d’un salarié/prestataire',
        shouldSelect: true,
        reason: 'Supprime durablement les comptes dormants dans Active Directory.',
      },
      {
        id: 'p3',
        label: 'Automatiser un test de restauration mensuel de la sauvegarde hors-ligne 3-2-1',
        shouldSelect: true,
        reason: 'Garantit la capacité réelle à redémarrer l’entreprise après un sinistre.',
      },
      {
        id: 'p4',
        label: 'Remplacer immédiatement tous les écrans de bureau par des écrans incurvés',
        shouldSelect: false,
        reason: 'Aucun impact sur la résilience ou la cybersécurité de la PME.',
      },
    ],
    step3CommunicationPrompt:
      'Quelle phrase de conclusion utilisez-vous pour clore votre point de première semaine ?',
    step3Options: [
      {
        id: 'dg1',
        toneLabel: 'Professionnel, constructif et orienté résultats',
        preview:
          'En résumé, les 4 incidents de la semaine ont été résolus sans perte de données ni retard d’expédition. En appliquant trois mesures simples ce trimestre — MFA généralisé, revue mensuelle RH/IT des comptes et tests de restauration — nous réduisons très fortement nos risques au quotidien.',
        isBest: true,
        feedback: 'Bravo ! Vous venez de réussir votre première semaine en poste comme un vrai professionnel.',
      },
      {
        id: 'dg2',
        toneLabel: 'Alarmiste',
        preview: 'Notre réseau est une passoire absolue, nous allons forcément nous faire pirater demain.',
        isBest: false,
        feedback: 'L’alarmisme paralyse la décision ; un professionnel propose des faits et un plan d’action concret.',
      },
      {
        id: 'dg3',
        toneLabel: 'Jargon pur',
        preview: 'On doit déployer un SOAR zero-trust avec micro-segmentation L7 et threat intel STIX/TAXII dès lundi.',
        isBest: false,
        feedback: 'Avant les outils complexes, on consolide toujours les fondamentaux d’hygiène informatique.',
      },
    ],
    cvBullet:
      'Restitution sécurité auprès de la direction : synthèse d’incidents en impact métier et déploiement d’une feuille de route d’hygiène ANSSI (MFA, revue des accès RH/IT, tests de restauration).',
    interviewQuestion:
      'Si vous arrivez demain dans une PME de 150 personnes, par quelles 3 actions sécurité commencez-vous ?',
    interviewAnswer:
      'Je sécurise d’abord les identités (MFA sur messagerie et VPN + nettoyage des comptes dormants/admins), je vérifie que les sauvegardes 3-2-1 hors-ligne fonctionnent et sont testées, puis je corrige les expositions externes évidentes (mises à jour critiques et stockages publics).',
  },
];
