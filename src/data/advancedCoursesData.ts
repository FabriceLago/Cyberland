export type AdvancedLabId =
  | 'emailsec'
  | 'sigmayara'
  | 'dfir'
  | 'iac'
  | 'iamcloud'
  | 'bgprouting'
  | 'linuxadmin'
  | 'winserver'
  | 'admastery';

export interface CourseStepBlock {
  stepTitle: string;
  explanation: string;
  code: string;
  accent?: 'emerald' | 'sky' | 'amber' | 'cyan' | 'violet';
}

export interface TroubleshootingTip {
  symptom: string;
  fix: string;
}

export interface ComparisonRow {
  col1: string;
  col2: string;
  col3: string;
}

export interface AdvancedCourseGuide {
  islandId: number;
  labId: AdvancedLabId;
  priorityRank: number;
  kicker: string;
  heading: string;
  intro: string;
  labButtonLabel: string;
  steps: CourseStepBlock[];
  troubleshootingTitle: string;
  troubleshooting: TroubleshootingTip[];
  tableTitle: string;
  tableHeaders: [string, string, string];
  tableRows: ComparisonRow[];
}

export const ADVANCED_COURSE_GUIDES: Record<number, AdvancedCourseGuide> = {
  23: {
    islandId: 23,
    labId: 'emailsec',
    priorityRank: 1,
    kicker: 'Priorité 1 · Défense Messagerie & Anti-Usurpation (SOC / DNS)',
    heading: "Sécuriser la Messagerie (SPF, DKIM, DMARC) & Analyser les En-têtes",
    intro:
      "Plus de 80 % des intrusions démarrent par un e-mail usurpé ou une fraude au président (BEC). Apprenez à verrouiller le domaine DNS avec SPF, DKIM et DMARC en mode rejet strict, puis à disséquer un en-tête SMTP suspect en temps réel.",
    labButtonLabel: 'Ouvrir le Lab Messagerie (SPF/DKIM/DMARC)',
    steps: [
      {
        stepTitle: 'ÉTAPE 1 · Publier SPF strict (-all) dans la zone DNS',
        explanation:
          "L'enregistrement TXT SPF déclare les seuls serveurs autorisés à envoyer des e-mails au nom du domaine. Terminez toujours par -all (HardFail) et restez sous la limite de 10 requêtes DNS (include).",
        code: `; Zone DNS cyberland.fr
@   IN  TXT  "v=spf1 ip4:203.0.113.25 include:_spf.google.com -all"

# Vérification en ligne de commande :
dig +short TXT cyberland.fr | grep "v=spf1"`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 2 · Générer et publier une clé DKIM RSA 2048 bits',
        explanation:
          "DKIM signe cryptographiquement l'en-tête From, le sujet et le corps du message avec une clé privée côté serveur d'envoi. Le destinataire vérifie la signature via le sélecteur DNS _domainkey.",
        code: `opendkim-genkey -b 2048 -s s2026 -d cyberland.fr
# Publier s2026.txt dans le DNS :
s2026._domainkey.cyberland.fr. IN TXT "v=DKIM1; k=rsa; p=MIIBIjANBgkq..."

# Tester la validité cryptographique :
opendkim-testkey -d cyberland.fr -s s2026 -vvv`,
        accent: 'sky',
      },
      {
        stepTitle: 'ÉTAPE 3 · Déployer DMARC progressivement (none → quarantine → reject)',
        explanation:
          "DMARC impose l'alignement entre le domaine visible (From) et SPF/DKIM, indique l'action en cas d'échec et envoie des rapports quotidiens (rua) pour vérifier les flux légitimes avant de passer à p=reject.",
        code: `_dmarc.cyberland.fr. IN TXT "v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; pct=100; rua=mailto:dmarc-rua@cyberland.fr"

# Vérification :
dig +short TXT _dmarc.cyberland.fr`,
        accent: 'amber',
      },
      {
        stepTitle: 'ÉTAPE 4 · Comprendre l’alignement From vs Return-Path',
        explanation:
          "Un attaquant peut envoyer un mail avec son propre SPF valide (Return-Path: evil.com) tout en affichant From: pdg@cyberland.fr. Seul DMARC vérifie que le domaine authentifié correspond au champ From lu par l'utilisateur.",
        code: `From: "Direction" <pdg@cyberland.fr>
Return-Path: <bounce@promo-evil.xyz>      # Alignement SPF : ÉCHEC
DKIM-Signature: d=promo-evil.xyz          # Alignement DKIM : ÉCHEC
Authentication-Results: spf=pass; dkim=pass; dmarc=fail (p=REJECT)`,
        accent: 'cyan',
      },
      {
        stepTitle: 'ÉTAPE 5 · Lire les en-têtes Received de bas en haut',
        explanation:
          "Pour tracer l'origine réelle d'un e-mail suspect, lisez toujours les lignes Received du bas (premier relais émetteur) vers le haut (votre passerelle), et comparez l'IP source aux listes RBL/Threat Intel.",
        code: `Received: from mail.cyberland.fr (10.0.1.5) by mx-in.cyberland.fr
Received: from unknown-vps.ru (185.220.101.44) by mx-in.cyberland.fr
Reply-To: urgent-virement@gmail.com   # Indicateur typique de fraude BEC`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 6 · Renforcer le transport (STARTTLS, MTA-STS & BIMI)',
        explanation:
          "Complétez l'authentification avec MTA-STS (force TLS entre serveurs SMTP contre le downgrade MitM) et surveillez les rapports TLS-RPT ainsi que les domaines sosies (typosquatting).",
        code: `_mta-sts.cyberland.fr. IN TXT "v=STSv1; id=20261124"
_smtp._tls.cyberland.fr. IN TXT "v=TLSRPTv1; rua=mailto:tls-rpt@cyberland.fr"`,
        accent: 'violet',
      },
    ],
    troubleshootingTitle: 'Réflexes SOC Messagerie & Pièges fréquents',
    troubleshooting: [
      {
        symptom: 'Erreur PermError sur SPF',
        fix: 'Vous avez dépassé la limite stricte de 10 lookups DNS (include/a/mx). Aplatissez les blocs IP ou supprimez les prestataires obsolètes.',
      },
      {
        symptom: 'DKIM échoue après transfert',
        fix: 'Une passerelle ajoute une bannière [EXTERNE] dans le corps du mail et casse le hash DKIM. Activez ARC (Authenticated Received Chain).',
      },
      {
        symptom: 'Faux positifs après p=reject',
        fix: 'Passez toujours 2 à 4 semaines en p=none avec lecture des rapports RUA pour recenser vos outils CRM/facturation avant p=reject.',
      },
    ],
    tableTitle: 'Synthèse des 3 piliers d’authentification e-mail',
    tableHeaders: ['Protocole', 'Ce qu’il vérifie', 'Rôle critique en sécurité'],
    tableRows: [
      {
        col1: 'SPF (TXT)',
        col2: 'IP du serveur SMTP émetteur',
        col3: 'Empêche un serveur non autorisé d’émettre pour votre domaine',
      },
      {
        col1: 'DKIM (RSA/Ed25519)',
        col2: 'Signature cryptographique du message',
        col3: 'Garantit l’intégrité et survit aux transferts si le contenu reste intact',
      },
      {
        col1: 'DMARC (Policy)',
        col2: 'Alignement avec l’en-tête From visible',
        col3: 'Bloque l’usurpation (p=reject) et génère des rapports RUA quotidiens',
      },
      {
        col1: 'MTA-STS',
        col2: 'Chiffrement TLS obligatoire entre MX',
        col3: 'Bloque l’interception SMTP en clair (downgrade STARTTLS)',
      },
    ],
  },

  24: {
    islandId: 24,
    labId: 'sigmayara',
    priorityRank: 2,
    kicker: 'Priorité 2 · Détection Engineering & Threat Hunting (SOC N2/N3)',
    heading: 'Écrire des Règles Sigma, YARA & Mener un Threat Hunting',
    intro:
      "Un bon analyste ne se contente pas d'attendre les alertes par défaut du SIEM : il formalise les comportements attaquants (TTP MITRE ATT&CK) en règles Sigma portables et chasse les binaires malveillants avec YARA.",
    labButtonLabel: 'Ouvrir le Lab Sigma, YARA & Hunting',
    steps: [
      {
        stepTitle: 'ÉTAPE 1 · Cibler le sommet de la Pyramide de la Douleur',
        explanation:
          "Un hash MD5/SHA-256 ou une IP change en 10 secondes. Les règles durables ciblent les TTP (lignes de commande obfusquées, relations parent-enfant anormales comme winword.exe → powershell.exe).",
        code: `# Priorité détection (du plus fragile au plus robuste) :
1. Hash / IP / Domaine   -> Facile à contourner par l'attaquant
2. Artefacts réseau/hôte -> Utile en corrélation
3. Outils & TTP (MITRE)  -> Très coûteux à modifier (cible Sigma !)`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 2 · Anatomie d’une règle Sigma YAML',
        explanation:
          "Sigma est le format standard agnostique au SIEM. Chaque règle définit des métadonnées MITRE, un logsource (ex. process_creation Windows), un bloc detection et une condition booléenne.",
        code: `title: PowerShell Encoded Download Cradle
status: stable
level: high
tags:
  - attack.execution
  - attack.t1059.001
logsource:
  category: process_creation
  product: windows
detection:
  selection_img:
    Image|endswith: '\\powershell.exe'
  selection_cli:
    CommandLine|contains:
      - '-enc '
      - 'IEX'
      - 'DownloadString'
  filter_admin:
    ParentImage|endswith: '\\sccm-agent.exe'
  condition: selection_img and selection_cli and not filter_admin`,
        accent: 'sky',
      },
      {
        stepTitle: 'ÉTAPE 3 · Convertir Sigma vers KQL (Sentinel) ou SPL (Splunk)',
        explanation:
          "Avec sigma-cli, la même règle YAML se compile automatiquement dans le langage de requête de votre SIEM sans réécriture manuelle.",
        code: `sigma convert -t sentinel -p sysmon rules/ps_encoded_cradle.yml
# Sortie KQL générée :
SecurityEvent
| where NewProcessName endswith "\\powershell.exe"
| where CommandLine has_any ("-enc ", "IEX", "DownloadString")
| where not(ParentProcessName endswith "\\sccm-agent.exe")`,
        accent: 'amber',
      },
      {
        stepTitle: 'ÉTAPE 4 · Écrire une règle YARA pour détecter un malware',
        explanation:
          "YARA identifie des fichiers ou processus en mémoire grâce à des chaînes de caractères, séquences hexadécimales (opcodes) et conditions précises (taille, en-tête PE MZ).",
        code: `rule Suspicious_Loader_Dropper {
  meta:
    author = "Analyste Cyberland"
    severity = "critical"
    mitre = "T1055"
  strings:
    $mz   = { 4D 5A }
    $api1 = "VirtualAllocEx" ascii
    $api2 = "WriteProcessMemory" ascii
    $c2   = /https?:\\/\\/[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}/
  condition:
    $mz at 0 and filesize < 2MB and all of ($api*) and $c2
}`,
        accent: 'cyan',
      },
      {
        stepTitle: 'ÉTAPE 5 · Chasser les LOLBins (Living off the Land)',
        explanation:
          "Les attaquants détournent des outils légitimes de Windows/Linux (certutil, mshta, rundll32, curl|bash) pour passer sous les radars antivirus. Chassez leurs combinaisons parent-enfant inhabituelles.",
        code: `# Exemples de signaux faibles à chasser :
- winword.exe / excel.exe  --> cmd.exe ou powershell.exe
- certutil.exe -urlcache -split -f http://...
- lsass.exe accédé par un processus non signé (T1003.001)`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 6 · Mesurer la qualité : Vrais Positifs vs Faux Positifs',
        explanation:
          "Avant de passer une règle en production bloquante, rejouez-la sur 7 à 30 jours d'historique, ajoutez des filtres ciblés (filter_*) et documentez un playbook de réponse associé.",
        code: `yara -r rules/loader_dropper.yar /srv/quarantine/
# KPI Détection Engineering :
# Précision = TP / (TP + FP) >= 90 %
# Couverture = techniques MITRE critiques couvertes`,
        accent: 'violet',
      },
    ],
    troubleshootingTitle: 'Pièges classiques en Détection Engineering',
    troubleshooting: [
      {
        symptom: 'Tempête de faux positifs (Alert Fatigue)',
        fix: 'Votre condition est trop large (ex. détecter tout powershell.exe). Ajoutez un filtre précis (filter_admin) ou croisez avec ParentImage et CommandLine.',
      },
      {
        symptom: 'Règle YARA trop lente en scan disque',
        fix: 'Ancrez toujours la condition sur l’en-tête ($mz at 0) et une borne filesize < 5MB pour éviter d’analyser des archives géantes.',
      },
      {
        symptom: 'Contournement par casse ou guillemets',
        fix: 'Utilisez des modificateurs insensibles à la casse (nocase en YARA, |contains en Sigma) et normalisez les commandes obfusquées.',
      },
    ],
    tableTitle: 'Sigma vs YARA vs IOC statiques',
    tableHeaders: ['Outil', 'Cible d’analyse', 'Force principale'],
    tableRows: [
      {
        col1: 'Sigma (YAML)',
        col2: 'Journaux SIEM / EDR (Sysmon, Linux auditd, Cloud)',
        col3: 'Portable vers KQL, SPL, Elastic ; capture les comportements (TTP)',
      },
      {
        col1: 'YARA',
        col2: 'Fichiers, pièces jointes, dumps mémoire (RAM)',
        col3: 'Détecte les familles de malwares même si le hash SHA-256 change',
      },
      {
        col1: 'Suricata / Snort',
        col2: 'Flux réseau temps réel (PCAP / IDS)',
        col3: 'Repère les beacons C2, scans et exploits réseau en vol',
      },
    ],
  },

  25: {
    islandId: 25,
    labId: 'dfir',
    priorityRank: 3,
    kicker: 'Priorité 3 · Investigation Numérique & Réponse à Incident (DFIR)',
    heading: 'Conduire une Investigation Forensics & Répondre à un Incident',
    intro:
      "Face à une machine suspectée d'être compromise, un mauvais réflexe (comme redémarrer le serveur) détruit définitivement la mémoire vive et les preuves d'attaque. Maîtrisez l'ordre de volatilité (RFC 3227), l'intégrité SHA-256 et le confinement propre.",
    labButtonLabel: 'Ouvrir le Lab Forensics & DFIR',
    steps: [
      {
        stepTitle: 'ÉTAPE 1 · Respecter l’ordre de volatilité (RFC 3227)',
        explanation:
          "Collectez toujours du plus éphémère au plus persistant : 1) Mémoire vive (RAM), 2) Connexions réseau & processus actifs, 3) Disque & journaux, 4) Sauvegardes. Ne rebootez JAMAIS avant la capture RAM.",
        code: `# 1. Acquisition mémoire vive (Linux LiME / Windows WinPmem)
sudo insmod lime.ko "path=/mnt/forensics/srv01.lime format=lime"

# 2. Capturer immédiatement les sockets et processus actifs :
ss -tunap > /mnt/forensics/sockets.txt
ps auxwwf > /mnt/forensics/processes.txt`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 2 · Sceller la chaîne de conservation (Hash SHA-256)',
        explanation:
          "Chaque artefact collecté doit être horodaté (UTC) et accompagné de son empreinte SHA-256 sur un support en lecture seule afin de prouver qu'il n'a jamais été altéré.",
        code: `sha256sum /mnt/forensics/srv01.lime /mnt/forensics/sockets.txt > /mnt/forensics/manifest.sha256
# Vérification ultérieure avant analyse :
sha256sum -c /mnt/forensics/manifest.sha256`,
        accent: 'sky',
      },
      {
        stepTitle: 'ÉTAPE 3 · Repérer les processus cachés, binaires supprimés & C2',
        explanation:
          "Un malware tourne souvent depuis /tmp ou /dev/shm, ou supprime son propre exécutable du disque tout en restant actif en RAM (marqueur (deleted) dans /proc/<pid>/exe).",
        code: `ls -la /proc/*/exe 2>/dev/null | grep "(deleted)"
lsof -i -P -n | grep ESTABLISHED
# Exemple suspect : PID 4812 (/tmp/.kworker) -> 185.220.101.44:4444`,
        accent: 'amber',
      },
      {
        stepTitle: 'ÉTAPE 4 · Auditer les mécanismes de persistance',
        explanation:
          "Avant d'éradiquer, recensez tous les points de retour de l'attaquant : tâches cron, services systemd, clés ~/.ssh/authorized_keys sur Linux ; tâches planifiées, clés Run et services (Event 7045) sur Windows.",
        code: `# Linux :
cat /etc/crontab /var/spool/cron/crontabs/* 2>/dev/null
systemctl list-unit-files --state=enabled
cat /home/*/.ssh/authorized_keys /root/.ssh/authorized_keys

# Windows Event IDs clés :
# 4624 (Logon) · 4625 (Échec) · 4688 (Process) · 7045 (Nouveau Service)`,
        accent: 'cyan',
      },
      {
        stepTitle: 'ÉTAPE 5 · Confiner l’hôte sans couper l’investigation',
        explanation:
          "Isolez l'hôte du réseau (isolation EDR ou ACL pare-feu bloquant tout sauf votre bastion forensique) pour stopper l'exfiltration et le mouvement latéral tout en gardant la RAM intacte.",
        code: `# Isolation réseau d'urgence tout en gardant le bastion DFIR :
sudo iptables -I INPUT  -s 10.99.0.10 -j ACCEPT
sudo iptables -I OUTPUT -d 10.99.0.10 -j ACCEPT
sudo iptables -P INPUT DROP && sudo iptables -P OUTPUT DROP`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 6 · Éradiquer, reconstruire et rédiger le post-mortem',
        explanation:
          "Reconstruisez la machine depuis une image propre, révoquez tous les secrets/clés/tokens présents sur l'hôte, corrigez la faille d'entrée initiale et livrez une timeline UTC exploitable.",
        code: `# Timeline UTC (exemple de rapport DFIR) :
14:02:11 UTC - Brute-force SSH puis login clé volée (user: deploy)
14:04:39 UTC - Téléchargement /tmp/.kworker + connexion C2 :4444
14:05:12 UTC - Persistance ajoutée dans /etc/cron.d/sysupdate
14:11:00 UTC - Capture RAM + Isolation réseau + Révocation secrets`,
        accent: 'violet',
      },
    ],
    troubleshootingTitle: 'Erreurs fatales à éviter en DFIR',
    troubleshooting: [
      {
        symptom: 'Redémarrer la machine compromise',
        fix: 'Détruit 100 % de la RAM (clés de chiffrement ransomware, malwares fileless, sockets C2). Isolez le réseau mais gardez la machine allumée !',
      },
      {
        symptom: 'Écrire les outils sur le disque analysé',
        fix: 'Écrase les secteurs libres contenant des fichiers supprimés. Stockez les dumps sur un partage réseau dédié ou un volume externe.',
      },
      {
        symptom: 'Oublier la révocation des identifiants',
        fix: 'Si l’attaquant a volé des clés API, jetons AWS ou mots de passe AD en mémoire, nettoyer la VM seule ne suffit pas : faites tourner tous les secrets.',
      },
    ],
    tableTitle: 'Phases officielles de Réponse à Incident (NIST SP 800-61)',
    tableHeaders: ['Phase', 'Action prioritaire', 'Livrable attendu'],
    tableRows: [
      {
        col1: '1. Préparation',
        col2: 'Centraliser les logs (NTP UTC), préparer les playbooks',
        col3: 'Capteurs EDR/SIEM opérationnels & contacts d’astreinte',
      },
      {
        col1: '2. Détection & Analyse',
        col2: 'Collecter la RAM, vérifier les IOC et l’ampleur (scope)',
        col3: 'Qualification gravité + manifeste SHA-256',
      },
      {
        col1: '3. Confinement & Éradication',
        col2: 'Isoler l’hôte, supprimer la persistance, révoquer les clés',
        col3: 'Menace neutralisée + cause racine identifiée',
      },
      {
        col1: '4. Reprise & Post-Mortem',
        col2: 'Reconstruire sainement, surveiller, écrire de nouvelles règles Sigma',
        col3: 'Timeline UTC + plan d’actions préventives',
      },
    ],
  },

  26: {
    islandId: 26,
    labId: 'iac',
    priorityRank: 4,
    kicker: 'Priorité 4 · Automatisation & Infrastructure as Code (DevSecOps)',
    heading: 'Déployer & Durcir en Code avec Terraform et Ansible',
    intro:
      "Configurer des serveurs à la main crée des dérives impossibles à auditer. Apprenez à provisionner votre réseau Cloud (VPC, sous-réseaux, pare-feux, VM) en Terraform (déclaratif) puis à appliquer un durcissement reproductible avec Ansible.",
    labButtonLabel: 'Ouvrir le Lab Terraform & Ansible',
    steps: [
      {
        stepTitle: 'ÉTAPE 1 · Distinguer Terraform (Provisioning) et Ansible (Configuration)',
        explanation:
          "Terraform crée et fait évoluer l'infrastructure (VPC, VM, pare-feux, DNS) de façon déclarative via un fichier d'état. Ansible configure l'intérieur de l'OS (paquets, SSH, Nginx, UFW) en SSH sans agent.",
        code: `# Architecture complémentaire DevSecOps :
Terraform (.tf)  --> Crée VPC, Subnet privé, Security Group, VM Linux
Ansible   (.yml) --> Patche l'OS, durcit sshd_config, déploie Nginx & UFW`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 2 · Sécuriser le State distant (Chiffrement + Lock)',
        explanation:
          "Ne commitez jamais terraform.tfstate dans Git (il contient des métadonnées et parfois des secrets). Stockez-le dans un backend distant chiffré avec verrouillage (state locking) pour éviter les écritures concurrentes.",
        code: `terraform {
  backend "s3" {
    bucket         = "cyberland-tfstate-prod"
    key            = "infra/network/terraform.tfstate"
    region         = "eu-west-3"
    encrypt        = true
    dynamodb_table = "cyberland-tf-locks"
  }
}`,
        accent: 'sky',
      },
      {
        stepTitle: 'ÉTAPE 3 · Déclarer VPC, Subnet & Security Group strict en HCL',
        explanation:
          "Décrivez l'état cible dans main.tf. N'ouvrez jamais SSH (22) sur 0.0.0.0/0 : restreignez cidr_blocks à l'IP du bastion ou du VPN d'entreprise.",
        code: `resource "aws_security_group" "web_dmz" {
  name   = "sg-web-dmz-prod"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["198.51.100.10/32"] # Bastion uniquement
  }
}`,
        accent: 'amber',
      },
      {
        stepTitle: 'ÉTAPE 4 · Exécuter le workflow sûr : init → validate → plan → apply',
        explanation:
          "Relisez toujours le plan d'exécution avant d'appliquer : les symboles +, ~ et - indiquent exactement quelles ressources seront créées, modifiées ou détruites.",
        code: `terraform init
terraform fmt -check && terraform validate
terraform plan -out=prod.tfplan
terraform apply "prod.tfplan"`,
        accent: 'cyan',
      },
      {
        stepTitle: 'ÉTAPE 5 · Rédiger un Playbook Ansible idempotent de durcissement',
        explanation:
          "L'idempotence garantit que relancer 10 fois le même playbook produit exactement le même état sans erreur ni doublon. Testez à blanc avec --check --diff avant d'appliquer.",
        code: `- name: Durcir les serveurs web Linux
  hosts: web_prod
  become: true
  tasks:
    - name: Désactiver PermitRootLogin et mots de passe SSH
      ansible.builtin.copy:
        dest: /etc/ssh/sshd_config.d/99-hardening.conf
        content: |
          PermitRootLogin no
          PasswordAuthentication no
        mode: "0600"
      notify: Reload SSH`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 6 · Scanner la sécurité IaC & détecter la dérive (Drift)',
        explanation:
          "Intégrez Checkov ou tfsec en CI/CD pour bloquer toute règle trop permissive avant fusion, et lancez régulièrement terraform plan pour repérer toute modification manuelle hors code.",
        code: `checkov -d ./infra/          # Audit statique des fichiers .tf
ansible-playbook -i inventory.ini hardening.yml --check --diff
terraform plan -detailed-exitcode  # Exit 2 = dérive détectée !`,
        accent: 'violet',
      },
    ],
    troubleshootingTitle: 'Pièges classiques en Terraform & Ansible',
    troubleshooting: [
      {
        symptom: 'Fichier terraform.tfstate poussé dans Git',
        fix: 'Ajoutez *.tfstate* au .gitignore, migrez vers un backend chiffré (S3/Azure Storage) et faites tourner tous les secrets exposés.',
      },
      {
        symptom: 'Dérive de configuration (Configuration Drift)',
        fix: 'Quelqu’un a modifié un pare-feu à la main dans la console Cloud. Réconciliez via terraform plan/apply et interdisez les écritures manuelles en production.',
      },
      {
        symptom: 'Playbook Ansible non idempotent (shell/command)',
        fix: 'Préférez les modules natifs (apt, copy, ufw, systemd) au module shell pour éviter d’ajouter des lignes en double à chaque exécution.',
      },
    ],
    tableTitle: 'Comparatif Terraform vs Ansible',
    tableHeaders: ['Critère', 'Terraform (HCL)', 'Ansible (YAML)'],
    tableRows: [
      {
        col1: 'Approche',
        col2: 'Déclarative orientée état (State)',
        col3: 'Procédurale idempotente sans agent (SSH)',
      },
      {
        col1: 'Domaine idéal',
        col2: 'Provisioning Cloud (VPC, VM, IAM, DNS, K8s)',
        col3: 'Configuration OS, paquets, durcissement SSH/UFW',
      },
      {
        col1: 'Prévisualisation',
        col2: 'terraform plan',
        col3: 'ansible-playbook --check --diff',
      },
    ],
  },

  27: {
    islandId: 27,
    labId: 'iamcloud',
    priorityRank: 5,
    kicker: 'Priorité 5 · Identité Cloud, Secrets & Gouvernance Multi-Cloud',
    heading: 'Maîtriser l’IAM Cloud, les Rôles Temporaires & les Coffres de Secrets',
    intro:
      "Dans le Cloud, l'identité est le nouveau périmètre de sécurité. Une clé d'accès statique oubliée dans un dépôt ou une politique IAM trop large (*:*) suffit à compromettre toute une infrastructure. Apprenez à appliquer le moindre privilège et la gestion moderne des secrets.",
    labButtonLabel: 'Ouvrir le Lab IAM Cloud & Secrets',
    steps: [
      {
        stepTitle: 'ÉTAPE 1 · Éliminer les politiques jokers (*:*) par le moindre privilège',
        explanation:
          "Chaque rôle ne doit recevoir que les actions exactes nécessaires, sur les ressources nommées explicitement (ARN / Scope), idéalement assorties de conditions (IP, MFA, tags).",
        code: `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::cyberland-factures-prod/*",
    "Condition": { "Bool": { "aws:SecureTransport": "true" } }
  }]
}`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 2 · Remplacer les clés statiques (AKIA) par OIDC / STS temporaire',
        explanation:
          "Les clés longue durée fuient dans les scripts et CI/CD. Utilisez des rôles fédérés (OIDC GitHub Actions / Managed Identity Azure / Workload Identity GCP) délivrant des jetons valables 15 à 60 minutes.",
        code: `# Pipeline CI/CD sans aucune clé statique :
# 1. GitHub signe un JWT OIDC
# 2. AWS STS / Entra ID vérifie le dépôt & la branche main
# 3. Délivre un token temporaire (TTL 15 min) pour déployer`,
        accent: 'sky',
      },
      {
        stepTitle: 'ÉTAPE 3 · Protéger le compte Root & fédérer les humains (SSO + MFA)',
        explanation:
          "Verrouillez le compte racine avec une clé physique FIDO2/WebAuthn, n'y créez aucune clé d'accès API, et obligez tous les ingénieurs à passer par le SSO d'entreprise avec élévation JIT (Just-In-Time).",
        code: `# Checklist Identité Humaine :
- Compte Root : MFA matériel FIDO2, 0 clé d'accès, usage exceptionnel
- Admins : SSO SAML/OIDC + rôle temporaire 1h (PIM / IAM Identity Center)`,
        accent: 'amber',
      },
      {
        stepTitle: 'ÉTAPE 4 · Centraliser et faire tourner les secrets (Vault / Key Vault)',
        explanation:
          "Ne stockez jamais de mots de passe SQL ou clés API dans le code ou des fichiers .env en clair. Injectez-les à l'exécution depuis HashiCorp Vault, Azure Key Vault ou AWS Secrets Manager avec rotation automatique.",
        code: `# Lecture dynamique d'un secret chiffré :
vault kv get -field=db_password secret/prod/cyberapp
# Audit : chaque lecture est journalisée (qui, quand, depuis quelle IP)`,
        accent: 'cyan',
      },
      {
        stepTitle: 'ÉTAPE 5 · Verrouiller le stockage objet (S3 / Blob / GCS)',
        explanation:
          "Activez BlockPublicAccess au niveau du compte, imposez le chiffrement SSE-KMS au repos et le transit HTTPS uniquement afin d'empêcher les fuites de buckets publics.",
        code: `aws s3api put-public-access-block \\
  --bucket cyberland-factures-prod \\
  --public-access-block-configuration \\
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 6 · Auditer en continu (CloudTrail, Access Analyzer & Simulate)',
        explanation:
          "Testez vos politiques avant déploiement avec simulate-principal-policy, détectez les permissions inutilisées et alertez votre SOC sur toute création de clé d'accès ou d'utilisateur IAM.",
        code: `aws iam simulate-principal-policy \\
  --policy-source-arn arn:aws:iam::123456789012:role/app-web \\
  --action-names s3:DeleteBucket iam:CreateAccessKey
# Résultat attendu : implicitDeny`,
        accent: 'violet',
      },
    ],
    troubleshootingTitle: 'Signaux d’alerte critiques en sécurité Cloud',
    troubleshooting: [
      {
        symptom: 'Clé statique AKIA exposée sur un dépôt',
        fix: 'Désactivez et supprimez immédiatement la clé, auditez CloudTrail sur les 24 dernières heures (CreateUser, RunInstances) puis migrez vers OIDC.',
      },
      {
        symptom: 'Escalade de privilèges via iam:PassRole',
        fix: 'Un utilisateur sans droit admin peut attacher un rôle admin à une nouvelle VM. Restreignez toujours Resource sur iam:PassRole.',
      },
      {
        symptom: 'Bucket S3 ou Blob lisible anonymement',
        fix: 'Activez BlockPublicAccess au niveau de toute l’organisation (SCP / Azure Policy) et chiffrez par clé KMS gérée.',
      },
    ],
    tableTitle: 'Équivalences Sécurité Multi-Cloud',
    tableHeaders: ['Fonction', 'AWS', 'Azure / GCP'],
    tableRows: [
      {
        col1: 'Identité sans clé (Workload)',
        col2: 'IAM Role + STS / OIDC',
        col3: 'Managed Identity (Azure) / Workload Identity (GCP)',
      },
      {
        col1: 'Coffre-fort de secrets',
        col2: 'AWS Secrets Manager + KMS',
        col3: 'Azure Key Vault / GCP Secret Manager',
      },
      {
        col1: 'Journal d’audit API',
        col2: 'AWS CloudTrail',
        col3: 'Azure Activity Log / GCP Cloud Audit Logs',
      },
    ],
  },

  28: {
    islandId: 28,
    labId: 'bgprouting',
    priorityRank: 6,
    kicker: 'Priorité 6 · Réseaux Opérateurs, Routage Dynamique & SD-WAN',
    heading: 'Maîtriser OSPF, BGP, la Sécurité RPKI & le Failover SD-WAN',
    intro:
      "Dès qu'une entreprise relie plusieurs sites ou publie ses propres préfixes IP sur Internet, le routage statique ne suffit plus. Découvrez comment OSPF converge en interne, comment BGP route Internet, comment RPKI bloque les détournements de préfixes et comment le SD-WAN bascule automatiquement en cas de panne.",
    labButtonLabel: 'Ouvrir le Lab OSPF, BGP, RPKI & SD-WAN',
    steps: [
      {
        stepTitle: 'ÉTAPE 1 · Différencier IGP (OSPF) et EGP (BGP)',
        explanation:
          "OSPF fonctionne à l'intérieur d'un même Système Autonome (AS) en calculant le plus court chemin selon le coût de la bande passante. BGP relie différents AS entre eux sur Internet selon des politiques (AS_PATH, LOCAL_PREF).",
        code: `# Découpage des rôles :
OSPF (IGP) -> Backbone interne multi-routeurs (Area 0, convergence < 1s)
BGP  (EGP) -> Interconnexion FAI / Datacenters / Cloud (TCP port 179)`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 2 · Configurer une zone OSPF (Area 0) avec authentification',
        explanation:
          "Chaque routeur OSPF possède un Router-ID unique, découvre ses voisins via paquets Hello (224.0.0.5) et construit la même carte topologique (LSDB) grâce à l'algorithme de Dijkstra.",
        code: `! Configuration FRRouting / Cisco IOS (OSPF)
router ospf 1
  router-id 10.255.0.1
  network 10.10.0.0/24 area 0
  network 10.20.0.0/24 area 0
  passive-interface default
  no passive-interface eth0`,
        accent: 'sky',
      },
      {
        stepTitle: 'ÉTAPE 3 · Établir une session eBGP & filtrer les préfixes',
        explanation:
          "En BGP (TCP 179), ne publiez jamais accidentellement vos routes internes et n'acceptez jamais n'importe quel préfixe d'un pair : appliquez des prefix-lists strictes et max-prefix.",
        code: `router bgp 65100
  bgp router-id 203.0.113.1
  neighbor 198.51.100.1 remote-as 64512
  neighbor 198.51.100.1 maximum-prefix 500
  address-family ipv4 unicast
    network 203.0.113.0/24
    neighbor 198.51.100.1 prefix-list ONLY-OUR-PREFIX out`,
        accent: 'amber',
      },
      {
        stepTitle: 'ÉTAPE 4 · Bloquer le BGP Hijacking avec RPKI / ROA',
        explanation:
          "Sans protection, un AS malveillant (ou mal configuré) peut annoncer votre préfixe 203.0.113.0/24 avec un chemin plus court et détourner votre trafic. Les certificats RPKI/ROA signent cryptographiquement quel AS est autorisé à annoncer quel préfixe.",
        code: `# Validation RPKI (ROV - Route Origin Validation) :
rpki
  rpki cache 10.255.0.50 3323 preference 1
route-map RM-IN permit 10
  match rpki valid
route-map RM-IN deny 20
  match rpki invalid   # Rejette instantanément tout hijack BGP !`,
        accent: 'cyan',
      },
      {
        stepTitle: 'ÉTAPE 5 · Piloter la bascule applicative avec SD-WAN (SLA)',
        explanation:
          "Contrairement au routage classique qui ne réagit qu'à une coupure franche de lien, un contrôleur SD-WAN mesure en continu latence, gigue et perte de paquets pour basculer la VoIP/ERP de la fibre MPLS vers la fibre Internet ou la 5G.",
        code: `# Politique SLA SD-WAN (Flux critiques VoIP / ERP) :
SLA_CRITIQUE:
  max_latency_ms: 45
  max_packet_loss_pct: 1.0
  primary_link: MPLS-WAN1
  backup_link:  FIBER-IPSEC-WAN2
  failover_mode: automatic_subsecond`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 6 · Superviser et diagnostiquer OSPF & BGP en live',
        explanation:
          "Vérifiez que les voisins OSPF sont en état FULL, que les sessions BGP affichent un nombre de préfixes reçus (état Established) et que le chemin AS_PATH observé correspond à votre opérateur nominal.",
        code: `show ip ospf neighbor       # Doit afficher State: FULL
show ip bgp summary         # State/PfxRcd > 0 (Established)
show ip bgp 203.0.113.0/24  # Vérifie AS_PATH & statut RPKI Valid
traceroute -A 203.0.113.42  # Affiche chaque AS traversé`,
        accent: 'violet',
      },
    ],
    troubleshootingTitle: 'Pannes de routage avancé & diagnostics clés',
    troubleshooting: [
      {
        symptom: 'Session BGP bloquée en Active ou Idle',
        fix: 'Vérifiez la connectivité TCP port 179 (pare-feu), la correspondance exacte du numéro d’AS (remote-as) et l’authentification MD5/TCP-AO.',
      },
      {
        symptom: 'Voisin OSPF bloqué en EXSTART / INIT',
        fix: 'Incohérence de MTU entre les deux extrémités (EXSTART) ou timers Hello/Dead / numéro de zone Area différents.',
      },
      {
        symptom: 'Trafic détourné vers un AS inconnu',
        fix: 'Probable BGP Hijack ou Route Leak (annonce d’un préfixe plus spécifique /25). Publiez un ROA RPKI avec maxLength strict et contactez vos transits.',
      },
    ],
    tableTitle: 'OSPF vs BGP vs SD-WAN',
    tableHeaders: ['Technologie', 'Métrique / Critère de choix', 'Cas d’usage principal'],
    tableRows: [
      {
        col1: 'OSPF (IGP)',
        col2: 'Coût inverse de la bande passante',
        col3: 'Routage dynamique interne à haute convergence (LAN / Backbone)',
      },
      {
        col1: 'BGP + RPKI (EGP)',
        col2: 'LOCAL_PREF, AS_PATH, validation ROA',
        col3: 'Interconnexion multi-opérateurs, Datacenters et Internet',
      },
      {
        col1: 'SD-WAN',
        col2: 'Latence, gigue, perte de paquets (SLA)',
        col3: 'Agences multi-liens (MPLS + Fibre + 5G) avec bascule applicative',
      },
    ],
  },
  29: {
    islandId: 29,
    labId: 'linuxadmin',
    priorityRank: 7,
    kicker: 'Systèmes & Administration · Maîtrise complète Linux (Debian / Ubuntu / RHEL)',
    heading: 'Administration Linux : Utilisateurs, Permissions, Systemd, Stockage LVM & Journaux',
    intro:
      'Plus de 90 % des serveurs Cloud et équipements de sécurité tournent sous Linux. Apprenez à administrer proprement un système Linux en production : hiérarchie FHS, comptes sudo, permissions octales/ACL, services systemd, volumes LVM et diagnostic réseau/journaux.',
    labButtonLabel: 'Ouvrir le Lab Administration Linux',
    steps: [
      {
        stepTitle: 'ÉTAPE 1 · Comprendre la hiérarchie FHS & gérer les comptes sudo',
        explanation:
          "Sous Linux, tout est fichier : /etc contient les configurations, /var/log les journaux, /srv les données applicatives et /home les utilisateurs. Ne travaillez jamais directement en root : créez un compte nominatif dans le groupe sudo et désactivez la connexion root SSH.",
        code: `# Créer un administrateur dédié et l'ajouter au groupe sudo :
sudo useradd -m -s /bin/bash -G sudo,webops admin_ops
sudo passwd admin_ops

# Vérifier l'identité, les groupes et verrouiller SSH root :
id admin_ops
sudo sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl reload ssh`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 2 · Maîtriser les permissions (chmod, chown, umask & ACL)',
        explanation:
          "Chaque fichier possède un propriétaire (u), un groupe (g) et les autres (o) avec les bits r=4, w=2, x=1. Appliquez le moindre privilège : 750 pour un répertoire applicatif, 640 pour un fichier de configuration, et 600 impératif pour toute clé privée SSH.",
        code: `# Propriétaire + groupe applicatif et permissions strictes :
sudo chown -R admin_ops:webops /srv/app
sudo chmod 750 /srv/app
sudo chmod 640 /srv/app/config.env
chmod 600 ~/.ssh/id_ed25519

# ACL fine pour donner lecture seule à l'auditeur SOC :
sudo setfacl -m u:soc_audit:rx /var/log/app/`,
        accent: 'sky',
      },
      {
        stepTitle: 'ÉTAPE 3 · Créer et piloter un service avec systemd & journalctl',
        explanation:
          "Systemd est le gestionnaire de démarrage et de démons moderne (PID 1). Écrivez une unité .service avec redémarrage automatique (Restart=on-failure) et compte non-privilégié, puis inspectez ses journaux structurés via journalctl.",
        code: `# /etc/systemd/system/app-api.service
[Unit]
Description=API Cyberland Production
After=network-online.target

[Service]
User=admin_ops
WorkingDirectory=/srv/app
ExecStart=/usr/bin/node /srv/app/server.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target

# Activer, démarrer et suivre les logs en temps réel :
sudo systemctl daemon-reload && sudo systemctl enable --now app-api.service
journalctl -u app-api.service -n 30 --no-pager`,
        accent: 'amber',
      },
      {
        stepTitle: 'ÉTAPE 4 · Gérer le stockage, les disques et l’extension LVM à chaud',
        explanation:
          "LVM (Logical Volume Manager) permet d'agrandir une partition pleine (/var/log à 98 %) sans redémarrer le serveur ni perdre de données grâce aux 3 couches : Volume Physique (PV), Groupe de Volumes (VG) et Volume Logique (LV).",
        code: `# Diagnostiquer l'espace disque et les volumes LVM :
df -hT
lsblk -f
sudo vgs && sudo lvs

# Étendre /dev/vg_data/lv_logs de +20 Go avec redimensionnement ext4/xfs à chaud (-r) :
sudo lvextend -L +20G -r /dev/vg_data/lv_logs`,
        accent: 'cyan',
      },
      {
        stepTitle: 'ÉTAPE 5 · Automatiser les tâches récurrentes (cron & systemd timers)',
        explanation:
          "Les sauvegardes nocturnes, rotations de journaux et audits d'intégrité sont planifiés via crontab (minute heure jour mois jour_semaine) ou des systemd timers plus traçables dans journalctl.",
        code: `# Éditer la crontab (sauvegarde quotidienne à 02h30) :
30 2 * * * /usr/local/bin/backup-app.sh >> /var/log/backup.log 2>&1

# Lister les tâches planifiées et les timers systemd actifs :
crontab -l
systemctl list-timers --all`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 6 · Diagnostiquer CPU, mémoire, ports ouverts et réseau',
        explanation:
          "Lors d'un incident Linux, croisez toujours 4 réflexes : processus actifs (ps/htop), ports en écoute (ss -tulpn), table de routage/IP (ip a, ip r) et erreurs noyau/authentification (/var/log/auth.log, dmesg).",
        code: `# Ports TCP/UDP en écoute et processus associés :
sudo ss -tulpn

# Interfaces IP, routes et processus les plus gourmands :
ip -br addr && ip route
ps aux --sort=-%mem | head -n 10
sudo grep "Failed password" /var/log/auth.log | tail -n 10`,
        accent: 'violet',
      },
    ],
    troubleshootingTitle: 'Pannes Linux classiques & réflexes d’administrateur',
    troubleshooting: [
      {
        symptom: 'No space left on device alors que df -h affiche de la place',
        fix: 'Vérifiez la saturation d’inodes (df -i) causée par des millions de petits fichiers temporaires ou un fichier supprimé encore ouvert par un processus (lsof +L1).',
      },
      {
        symptom: 'Service systemd en échec immédiat (status=203/EXEC ou Permission denied)',
        fix: 'Vérifiez le chemin absolu ExecStart, le droit d’exécution (+x) du script et que le compte User= possède bien les droits de lecture sur WorkingDirectory.',
      },
      {
        symptom: 'Clé SSH refusée (Permissions 0644 are too open)',
        fix: 'OpenSSH rejette toute clé privée lisible par d’autres utilisateurs : exécutez chmod 700 ~/.ssh && chmod 600 ~/.ssh/id_ed25519.',
      },
    ],
    tableTitle: 'Commandes Linux incontournables au quotidien',
    tableHeaders: ['Domaine', 'Commande moderne', 'Rôle opérationnel'],
    tableRows: [
      {
        col1: 'Permissions & Droits',
        col2: 'chmod 750 · chown · setfacl',
        col3: 'Verrouiller l’accès aux répertoires applicatifs, secrets et logs',
      },
      {
        col1: 'Services & Journaux',
        col2: 'systemctl · journalctl -u',
        col3: 'Démarrer, activer au boot et analyser les erreurs des démons',
      },
      {
        col1: 'Stockage & LVM',
        col2: 'lsblk · df -h · lvextend -r',
        col3: 'Inspecter les partitions et agrandir un volume plein à chaud',
      },
      {
        col1: 'Réseau & Processus',
        col2: 'ip a · ss -tulpn · ps aux',
        col3: 'Auditer les ports ouverts, routes actives et processus suspects',
      },
    ],
  },
  30: {
    islandId: 30,
    labId: 'winserver',
    priorityRank: 8,
    kicker: 'Systèmes Microsoft · Déploiement & Administration Windows Server',
    heading: 'Windows Server : Configuration Initiale, Rôles DNS/DHCP/SMB, IIS & PowerShell',
    intro:
      'Windows Server est au cœur de la majorité des réseaux d’entreprise (annuaire, fichiers, DNS/DHCP interne, applications métiers). Apprenez à installer, configurer et administrer Windows Server en PowerShell (Server Core ou Desktop Experience) avec de vrais réflexes sécurité.',
    labButtonLabel: 'Ouvrir le Lab Windows Server',
    steps: [
      {
        stepTitle: 'ÉTAPE 1 · Configuration initiale en PowerShell (Nom, IP fixe & mises à jour)',
        explanation:
          "Un serveur Windows ne doit jamais rester en IP DHCP dynamique ni avec un nom aléatoire (WIN-XXXX). Configurez un nom explicite, une adresse IPv4 statique, un DNS fiable et privilégiez l'édition Server Core pour réduire la surface d'attaque.",
        code: `# Configurer IP statique, passerelle et DNS en PowerShell :
New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 10.20.0.10 -PrefixLength 24 -DefaultGateway 10.20.0.1
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("127.0.0.1","10.20.0.1")

# Renommer le serveur proprement et redémarrer :
Rename-Computer -NewName "SRV-WIN-01" -Restart`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 2 · Installer et configurer les rôles DNS & DHCP',
        explanation:
          "Le rôle DNS résout les noms internes (zone directe cyberland.local et zone inversée) tandis que le rôle DHCP distribue automatiquement IP, masque, passerelle et serveur DNS aux postes clients avec possibilité de basculement (DHCP Failover).",
        code: `# Installer les rôles DNS et DHCP avec outils d'administration :
Install-WindowsFeature -Name DNS, DHCP -IncludeManagementTools

# Créer une zone DNS primaire et un enregistrement A :
Add-DnsServerPrimaryZone -Name "cyberland.local" -ZoneFile "cyberland.local.dns"
Add-DnsServerResourceRecordA -Name "intranet" -ZoneName "cyberland.local" -IPv4Address "10.20.0.10"

# Créer une étendue DHCP (10.20.0.50 -> 10.20.0.200) :
Add-DhcpServerv4Scope -Name "LAN-Bureaux" -StartRange 10.20.0.50 -EndRange 10.20.0.200 -SubnetMask 255.255.255.0
Set-DhcpServerv4OptionValue -ScopeId 10.20.0.0 -Router 10.20.0.1 -DnsServer 10.20.0.10`,
        accent: 'sky',
      },
      {
        stepTitle: 'ÉTAPE 3 · Déployer un Serveur de Fichiers SMB3 chiffré + NTFS + VSS',
        explanation:
          "L'accès effectif à un partage Windows résulte de l'intersection la plus restrictive entre les permissions de Partage SMB et les permissions NTFS. Activez toujours le chiffrement SMB 3.1.1, désactivez SMBv1 et planifiez les clichés instantanés (Shadow Copies / VSS).",
        code: `# Créer le dossier partagé avec chiffrement SMB3 obligatoire :
New-Item -Path "D:\\Partages\\Compta" -ItemType Directory
New-SmbShare -Name "Partage_Compta" -Path "D:\\Partages\\Compta" \`
  -FullAccess "CYBERLAND\\GG_Compta_RW" -ReadAccess "CYBERLAND\\GG_Compta_RO" \`
  -EncryptData $true

# Désactiver SMBv1 (vecteur WannaCry / EternalBlue) :
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force`,
        accent: 'amber',
      },
      {
        stepTitle: 'ÉTAPE 4 · Publier une application avec IIS (HTTPS) & WinRM chiffré',
        explanation:
          "IIS (Internet Information Services) héberge les portails intranet ASP.NET/Web en entreprise. Liez un certificat TLS sur le port 443, redirigez HTTP vers HTTPS et administrez vos serveurs à distance via PowerShell Remoting (WinRM HTTPS 5986).",
        code: `# Installer IIS et activer WinRM pour l'administration distante :
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
New-WebBinding -Name "Default Web Site" -Protocol https -Port 443 -SslFlags 0

# Vérifier l'écoute HTTPS et activer PowerShell Remoting :
Enable-PSRemoting -Force
Test-NetConnection -ComputerName localhost -Port 443`,
        accent: 'cyan',
      },
      {
        stepTitle: 'ÉTAPE 5 · Durcir le Pare-feu Windows Defender & sauvegardes',
        explanation:
          "Ne désactivez jamais le Pare-feu Windows Defender pour « gagner du temps » : activez les 3 profils (Domaine, Privé, Public), autorisez uniquement les ports utiles et planifiez une sauvegarde système Bare-Metal / System State avec Windows Server Backup.",
        code: `# Vérifier et forcer l'activation des 3 profils du pare-feu :
Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True
New-NetFirewallRule -DisplayName "HTTPS Intranet" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# Installer Windows Server Backup pour sauvegarder le System State :
Install-WindowsFeature -Name Windows-Server-Backup`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 6 · Superviser les journaux Windows (Event Viewer & PowerShell)',
        explanation:
          "L'Observateur d'événements (Event Viewer) centralise les journaux System, Application et Security. Utilisez Get-WinEvent en PowerShell pour filtrer instantanément les échecs de connexion (4625), démarrages de services (7045) ou erreurs disque.",
        code: `# Rechercher les 10 dernières erreurs critiques Système :
Get-WinEvent -FilterHashtable @{LogName='System'; Level=1,2} -MaxEvents 10

# Auditer les échecs d'authentification (EventID 4625) :
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} -MaxEvents 15 |
  Select-Object TimeCreated, Message`,
        accent: 'violet',
      },
    ],
    troubleshootingTitle: 'Incidents Windows Server fréquents & résolutions',
    troubleshooting: [
      {
        symptom: 'Les postes clients ne reçoivent aucune adresse IP du serveur DHCP',
        fix: 'En domaine Active Directory, un serveur DHCP doit être explicitement autorisé dans l’AD (Add-DhcpServerInDC) et l’étendue doit être en état Active.',
      },
      {
        symptom: 'Accès refusé sur un partage réseau malgré des droits NTFS complets',
        fix: 'Windows applique l’autorisation la plus restrictive entre Partage SMB et NTFS : vérifiez que le groupe dispose bien du droit Modifier côté Partage SMB.',
      },
      {
        symptom: 'Impossible de joindre un serveur en PowerShell Remoting (WinRM)',
        fix: 'Vérifiez que le service WinRM tourne, que le profil réseau n’est pas bloqué en Public et que le port 5985/5986 est ouvert sur le pare-feu Windows.',
      },
    ],
    tableTitle: 'Rôles fondamentaux de Windows Server',
    tableHeaders: ['Rôle Windows Server', 'Ports clés', 'Fonction en entreprise'],
    tableRows: [
      {
        col1: 'DNS & DHCP Server',
        col2: 'UDP/TCP 53 · UDP 67/68',
        col3: 'Résolution de noms interne et attribution automatique des baux IP',
      },
      {
        col1: 'File Server (SMB3 + NTFS)',
        col2: 'TCP 445 (SMBv3 chiffré)',
        col3: 'Partages de fichiers chiffrés, quotas FSRM et clichés instantanés VSS',
      },
      {
        col1: 'IIS Web Server',
        col2: 'TCP 443 (HTTPS)',
        col3: 'Hébergement de portails intranet, API et reverse-proxy Windows',
      },
      {
        col1: 'WinRM & Event Log',
        col2: 'TCP 5985 / 5986 (TLS)',
        col3: 'Administration PowerShell distante et collecte d’événements SOC',
      },
    ],
  },
  31: {
    islandId: 31,
    labId: 'admastery',
    priorityRank: 9,
    kicker: 'Identité & Sécurité Entreprise · Déploiement & Durcissement Active Directory',
    heading: 'Active Directory Complet : Forêt AD DS, OU/AGDLP, GPO, Kerberos, Tiering & LAPS',
    intro:
      'Active Directory est le système nerveux de l’identité en entreprise — et la cible prioritaire des ransomwares. Maîtrisez tout son cycle de vie : promotion d’un contrôleur de domaine, organisation en OU et groupes AGDLP, déploiement de GPO, flux Kerberos/LDAPS et durcissement Tiering + LAPS.',
    labButtonLabel: 'Ouvrir le Lab Active Directory Complet',
    steps: [
      {
        stepTitle: 'ÉTAPE 1 · Installer AD DS et promouvoir le Contrôleur de Domaine (Forêt)',
        explanation:
          "Active Directory Domain Services (AD DS) repose sur une base NTDS.dit répliquée entre contrôleurs de domaine (DC) et un partage SYSVOL pour les GPO. Déployez toujours au moins 2 DC redondants et activez la Corbeille AD dès le premier jour.",
        code: `# Installer le rôle AD DS et créer la forêt cyberland.local :
Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools
Install-ADDSForest -DomainName "cyberland.local" -DomainNetbiosName "CYBERLAND" \`
  -InstallDns:$true -ForestMode "WinThreshold" -DomainMode "WinThreshold"

# Activer la Corbeille Active Directory (indispensable en cas d'erreur) :
Enable-ADOptionalFeature 'Recycle Bin Feature' -Scope ForestOrConfigurationSet \`
  -Target (Get-ADForest).Name`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 2 · Structurer les OU & appliquer le modèle AGDLP',
        explanation:
          "Séparez les objets par Unité d'Organisation (OU) selon leur niveau de privilège (Tier 0 / Tier 1 / Tier 2) et leurs besoins GPO. Pour les accès aux ressources, appliquez la règle AGDLP : Accounts → Global Groups → Domain Local Groups → Permissions.",
        code: `# Créer une arborescence OU propre par périmètre :
New-ADOrganizationalUnit -Name "IT_Tier0" -Path "DC=cyberland,DC=local"
New-ADOrganizationalUnit -Name "Serveurs_Tier1" -Path "DC=cyberland,DC=local"
New-ADOrganizationalUnit -Name "Postes_Tier2" -Path "DC=cyberland,DC=local"
New-ADOrganizationalUnit -Name "Compta" -Path "DC=cyberland,DC=local"

# Modèle AGDLP : Utilisateur -> Groupe Global -> Groupe Local de Domaine -> Droit NTFS
New-ADGroup -Name "GG_Compta" -GroupScope Global -Path "OU=Compta,DC=cyberland,DC=local"
New-ADGroup -Name "DL_Partage_Compta_RW" -GroupScope DomainLocal -Path "OU=Compta,DC=cyberland,DC=local"
Add-ADGroupMember -Identity "DL_Partage_Compta_RW" -Members "GG_Compta"`,
        accent: 'sky',
      },
      {
        stepTitle: 'ÉTAPE 3 · Créer, lier et diagnostiquer les GPO (Ordre LSDOU)',
        explanation:
          "Les stratégies de groupe (GPO) configurent automatiquement des milliers de postes (verrouillage de session, pare-feu, BitLocker, audit Sysmon). Elles s'appliquent dans l'ordre LSDOU (Local → Site → Domaine → OU) : la dernière stratégie appliquée l'emporte.",
        code: `# Créer et lier une GPO de durcissement sur l'OU Postes_Tier2 :
New-GPO -Name "SEC-Postes-Hardening" | New-GPLink -Target "OU=Postes_Tier2,DC=cyberland,DC=local"

# Forcer la mise à jour et vérifier le jeu de stratégies résultant (RSoP) :
gpupdate /force
gpresult /R /SCOPE COMPUTER`,
        accent: 'amber',
      },
      {
        stepTitle: 'ÉTAPE 4 · Comprendre et verrouiller Kerberos (TGT/TGS) & LDAPS',
        explanation:
          "Kerberos (port 88) évite de faire transiter le mot de passe sur le réseau grâce à deux tickets : le TGT (Ticket Granting Ticket) puis le TGS (Ticket de service). Forcez le chiffrement AES-256 (désactivez RC4/DES) et imposez LDAPS (636/TLS) + LDAP Signing.",
        code: `# Vérifier les tickets Kerberos actifs sur un poste :
klist

# Forcer Kerberos AES-256 sur un compte sensible et vérifier LDAPS (636) :
Set-ADUser -Identity "svc_app" -KerberosEncryptionType AES256
Test-NetConnection -ComputerName dc01.cyberland.local -Port 636`,
        accent: 'cyan',
      },
      {
        stepTitle: 'ÉTAPE 5 · Déployer le Modèle Tiering (T0/T1/T2) & Windows LAPS',
        explanation:
          "Pour stopper le mouvement latéral (Pass-the-Hash), un compte Admin du Domaine (Tier 0) ne doit JAMAIS ouvrir de session sur un serveur applicatif (Tier 1) ni sur un poste utilisateur (Tier 2). Windows LAPS attribue un mot de passe administrateur local unique et rotatif sur chaque machine.",
        code: `# Préparer le schéma AD pour Windows LAPS et autoriser la sauvegarde chiffrée :
Update-LapsADSchema
Set-LapsADComputerSelfPermission -Identity "OU=Postes_Tier2,DC=cyberland,DC=local"

# Utiliser des comptes gMSA (mots de passe 240 car. rotatifs) pour les services :
New-ADServiceAccount -Name "gmsa_web" -DNSHostName "gmsa_web.cyberland.local"`,
        accent: 'emerald',
      },
      {
        stepTitle: 'ÉTAPE 6 · Auditer et défendre l’AD contre Kerberoasting & escalades',
        explanation:
          "Surveillez en continu les groupes privilégiés (Domain Admins, Enterprise Admins), les comptes utilisateurs portant un SPN (cibles du Kerberoasting), les délégations non contraintes et les journaux critiques (EventID 4624/4625, 4769 RC4, 4728).",
        code: `# Repérer les comptes utilisateurs vulnérables au Kerberoasting (SPN actifs) :
Get-ADUser -Filter {ServicePrincipalName -ne "$null"} -Properties ServicePrincipalName |
  Select-Object SamAccountName, ServicePrincipalName

# Auditer la réplication entre contrôleurs de domaine :
repadmin /replsummary
dcdiag /q`,
        accent: 'violet',
      },
    ],
    troubleshootingTitle: 'Diagnostics Active Directory & erreurs terrain fréquentes',
    troubleshooting: [
      {
        symptom: 'Erreur Kerberos KRB_AP_ERR_SKEW (échec d’authentification au domaine)',
        fix: 'Décalage d’horloge supérieur à 5 minutes entre le poste et le contrôleur de domaine. Synchronisez tous les hôtes via NTP sur le PDC Emulator (w32tm /resync).',
      },
      {
        symptom: 'Une GPO liée à une OU ne s’applique pas aux utilisateurs',
        fix: 'Vérifiez si la GPO contient des paramètres Utilisateur alors qu’elle est liée à une OU ne contenant que des Ordinateurs (ou activez le filtrage de sécurité Authenticated Users).',
      },
      {
        symptom: 'Impossibilité de joindre un poste au domaine cyberland.local',
        fix: 'Dans 90 % des cas, le poste pointe encore sur un DNS public (8.8.8.8) au lieu de l’IP du Contrôleur de Domaine qui héberge les enregistrements SRV _ldap._tcp.',
      },
    ],
    tableTitle: 'Architecture de sécurité Active Directory (Modèle Tiering)',
    tableHeaders: ['Niveau (Tier)', 'Actifs protégés', 'Règle de cloisonnement impérative'],
    tableRows: [
      {
        col1: 'Tier 0 (Cœur AD)',
        col2: 'Contrôleurs de Domaine (DC), PKI, Entra Connect',
        col3: 'Administration uniquement depuis une station PAW dédiée, jamais sur T1/T2',
      },
      {
        col1: 'Tier 1 (Serveurs)',
        col2: 'Serveurs Web/BDD, File Servers, ERP, Hyperviseurs',
        col3: 'Comptes dédiés Tier 1 + gMSA pour les services, zéro connexion vers postes T2',
      },
      {
        col1: 'Tier 2 (Postes)',
        col2: 'PC portables, postes bureautiques, imprimantes',
        col3: 'Windows LAPS obligatoire (mot de passe local unique), utilisateurs sans droits admin',
      },
    ],
  },
};
