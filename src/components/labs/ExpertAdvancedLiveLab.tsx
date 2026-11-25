import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Copy,
  Crosshair,
  Download,
  FileSearch,
  FolderTree,
  Globe2,
  KeyRound,
  Lock,
  MailCheck,
  Play,
  RotateCcw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  TerminalSquare,
  Zap,
} from 'lucide-react';
import { AdvancedLabId } from '../../data/advancedCoursesData';
import { playClick, playError, playSuccess } from '../../utils/sound';

interface ExpertAdvancedLiveLabProps {
  labId: AdvancedLabId;
  onCompleteLab?: () => void;
}

interface LabObjective {
  id: string;
  label: string;
  done: boolean;
}

interface TerminalEntry {
  cmd: string;
  out: string;
  ok: boolean;
}

interface LabMeta {
  priority: number;
  title: string;
  subtitle: string;
  badgeText: string;
  artifactFilename: string;
  icon: React.ComponentType<{ className?: string }>;
}

const LAB_META: Record<AdvancedLabId, LabMeta> = {
  emailsec: {
    priority: 1,
    title: 'Lab Temps Réel · Messagerie SPF, DKIM, DMARC & En-têtes',
    subtitle:
      'Configurez les enregistrements DNS anti-usurpation, vérifiez l’alignement DMARC, neutralisez une fraude BEC et testez le rejet SMTP en direct.',
    badgeText: 'PRIORITÉ 1 · MESSAGERIE & SOC',
    artifactFilename: 'cyberland-email-dns.zone',
    icon: MailCheck,
  },
  sigmayara: {
    priority: 2,
    title: 'Lab Temps Réel · Threat Hunting, Règles Sigma & YARA',
    subtitle:
      'Rédigez une détection Sigma sans faux positifs, assemblez une signature YARA PE (MZ) et rejouez 1 200 événements Sysmon en direct.',
    badgeText: 'PRIORITÉ 2 · DETECTION ENGINEERING',
    artifactFilename: 'cyberland-hunting-rules.yml',
    icon: Crosshair,
  },
  dfir: {
    priority: 3,
    title: 'Lab Temps Réel · Forensics & Réponse à Incident (DFIR)',
    subtitle:
      'Respectez l’ordre de volatilité RFC 3227 : capturez la RAM avant l’isolation, scellez la chaîne de preuve SHA-256 et éradiquez la persistance.',
    badgeText: 'PRIORITÉ 3 · DFIR & VOLATILITÉ',
    artifactFilename: 'dfir-chain-of-custody.json',
    icon: FileSearch,
  },
  iac: {
    priority: 4,
    title: 'Lab Temps Réel · Infrastructure as Code (Terraform & Ansible)',
    subtitle:
      'Sécurisez le State distant, verrouillez le pare-feu SSH, externalisez les secrets, exécutez Plan/Apply et validez l’idempotence Ansible.',
    badgeText: 'PRIORITÉ 4 · DEVSECOPS & IAC',
    artifactFilename: 'cyberland-iac-stack.tf',
    icon: Code2,
  },
  iamcloud: {
    priority: 5,
    title: 'Lab Temps Réel · IAM Cloud, Secrets Vault & Multi-Cloud',
    subtitle:
      'Remplacez les droits Wildcard par le moindre privilège, imposez MFA & OIDC CI/CD, verrouillez le stockage objet et activez les secrets dynamiques.',
    badgeText: 'PRIORITÉ 5 · CLOUD SECURITY & IAM',
    artifactFilename: 'cyberland-iam-policy.json',
    icon: KeyRound,
  },
  bgprouting: {
    priority: 6,
    title: 'Lab Temps Réel · Routage Avancé (OSPF, BGP, RPKI) & SD-WAN',
    subtitle:
      'Convergez le backbone OSPF Area 0, filtrez vos préfixes eBGP, bloquez un BGP Hijack grâce à RPKI/ROA et basculez le trafic via SD-WAN SLA.',
    badgeText: 'PRIORITÉ 6 · ROUTAGE CORE & WAN',
    artifactFilename: 'cyberland-frr-bgp.conf',
    icon: Globe2,
  },
  linuxadmin: {
    priority: 7,
    title: 'Lab Temps Réel · Administration Linux (Permissions, Systemd, LVM & Cron)',
    subtitle:
      'Créez un compte sudo non-root, verrouillez les droits FHS, réparez le service systemd, étendez le volume LVM saturé et planifiez la sauvegarde.',
    badgeText: 'SYSTÈMES · ADMINISTRATION LINUX',
    artifactFilename: 'cyberland-linux-setup.sh',
    icon: TerminalSquare,
  },
  winserver: {
    priority: 8,
    title: 'Lab Temps Réel · Windows Server (DNS, DHCP, SMB3, IIS & PowerShell)',
    subtitle:
      'Configurez IP statique et nom serveur, déployez DNS/DHCP, chiffrez le partage SMB3/NTFS, publiez IIS HTTPS et verrouillez le Pare-feu Windows.',
    badgeText: 'SYSTÈMES · WINDOWS SERVER',
    artifactFilename: 'setup-winserver.ps1',
    icon: Server,
  },
  admastery: {
    priority: 9,
    title: 'Lab Temps Réel · Active Directory (AD DS, OU/AGDLP, GPO, Kerberos & LAPS)',
    subtitle:
      'Promouvez le contrôleur de domaine DC01, structurez les OU/AGDLP, liez les GPO LSDOU, forcez Kerberos AES-256 + LDAPS et activez Tiering/LAPS.',
    badgeText: 'IDENTITÉ · ACTIVE DIRECTORY COMPLET',
    artifactFilename: 'deploy-ad-cyberland.ps1',
    icon: FolderTree,
  },
};

export const ExpertAdvancedLiveLab: React.FC<ExpertAdvancedLiveLabProps> = ({
  labId,
  onCompleteLab,
}) => {
  const meta = LAB_META[labId];
  const HeaderIcon = meta.icon;

  // --- Lab 1: Email Security (SPF/DKIM/DMARC) ---
  const [spfMode, setSpfMode] = useState<'none' | 'softfail' | 'hardfail'>('softfail');
  const [spfLookupsFlattened, setSpfLookupsFlattened] = useState(false);
  const [dkimPublished, setDkimPublished] = useState(false);
  const [dmarcPolicy, setDmarcPolicy] = useState<'none' | 'quarantine' | 'reject'>('none');
  const [dmarcStrictAlign, setDmarcStrictAlign] = useState(false);
  const [mtaStsEnabled, setMtaStsEnabled] = useState(false);
  const [becHeaderFlagged, setBecHeaderFlagged] = useState(false);
  const [spoofTestResult, setSpoofTestResult] = useState<string | null>(null);

  // --- Lab 2: Sigma & YARA ---
  const [sigmaProcessMatch, setSigmaProcessMatch] = useState(true);
  const [sigmaParentOffice, setSigmaParentOffice] = useState(false);
  const [sigmaAdminExclusion, setSigmaAdminExclusion] = useState(false);
  const [yaraMzHeader, setYaraMzHeader] = useState(false);
  const [yaraStringsAndCondition, setYaraStringsAndCondition] = useState(false);
  const [replayRunCount, setReplayRunCount] = useState(0);

  // --- Lab 3: DFIR ---
  const [dfirRamCaptured, setDfirRamCaptured] = useState(false);
  const [dfirHostIsolated, setDfirHostIsolated] = useState(false);
  const [dfirArtifactsCollected, setDfirArtifactsCollected] = useState(false);
  const [dfirCustodySealed, setDfirCustodySealed] = useState(false);
  const [dfirPersistenceRemoved, setDfirPersistenceRemoved] = useState(false);
  const [dfirMistakeWarning, setDfirMistakeWarning] = useState<string | null>(null);

  // --- Lab 4: IaC (Terraform & Ansible) ---
  const [iacRemoteStateLock, setIacRemoteStateLock] = useState(false);
  const [iacStrictSshCidr, setIacStrictSshCidr] = useState(false);
  const [iacSecretsExternalized, setIacSecretsExternalized] = useState(false);
  const [iacPlanApplied, setIacPlanApplied] = useState(false);
  const [iacAnsibleIdempotent, setIacAnsibleIdempotent] = useState(false);

  // --- Lab 5: IAM Cloud & Secrets ---
  const [iamLeastPrivilege, setIamLeastPrivilege] = useState(false);
  const [iamMfaCondition, setIamMfaCondition] = useState(false);
  const [iamOidcEnabled, setIamOidcEnabled] = useState(false);
  const [iamPublicBlock, setIamPublicBlock] = useState(false);
  const [iamVaultDynamic, setIamVaultDynamic] = useState(false);

  // --- Lab 6: BGP / OSPF / RPKI / SD-WAN ---
  const [bgpOspfArea0, setBgpOspfArea0] = useState(false);
  const [bgpPrefixFilter, setBgpPrefixFilter] = useState(false);
  const [bgpRpkiEnabled, setBgpRpkiEnabled] = useState(false);
  const [bgpBfdFast, setBgpBfdFast] = useState(false);
  const [bgpSdwanSla, setBgpSdwanSla] = useState(false);
  const [hijackSimulated, setHijackSimulated] = useState(true);

  // --- Lab 7: Administration Linux ---
  const [linuxSudoLocked, setLinuxSudoLocked] = useState(false);
  const [linuxPermsStrict, setLinuxPermsStrict] = useState(false);
  const [linuxSystemdActive, setLinuxSystemdActive] = useState(false);
  const [linuxLvmExtended, setLinuxLvmExtended] = useState(false);
  const [linuxCronBackup, setLinuxCronBackup] = useState(false);

  // --- Lab 8: Windows Server ---
  const [winStaticIpName, setWinStaticIpName] = useState(false);
  const [winDnsDhcpReady, setWinDnsDhcpReady] = useState(false);
  const [winSmbEncrypted, setWinSmbEncrypted] = useState(false);
  const [winIisHttpsWinrm, setWinIisHttpsWinrm] = useState(false);
  const [winFirewallBackup, setWinFirewallBackup] = useState(false);

  // --- Lab 9: Active Directory Complet ---
  const [adForestPromoted, setAdForestPromoted] = useState(false);
  const [adOuAgdlpStructured, setAdOuAgdlpStructured] = useState(false);
  const [adGpoLinked, setAdGpoLinked] = useState(false);
  const [adKerberosLdaps, setAdKerberosLdaps] = useState(false);
  const [adTieringLaps, setAdTieringLaps] = useState(false);

  // --- Shared UI State ---
  const [terminalLog, setTerminalLog] = useState<TerminalEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const completedAwardedRef = useRef<boolean>(false);

  // Reset per-lab transient log & completion award when labId switches
  useEffect(() => {
    setTerminalLog([]);
    setCopied(false);
    setSpoofTestResult(null);
    setDfirMistakeWarning(null);
    completedAwardedRef.current = false;
  }, [labId]);

  // --- Objectives calculation per lab ---
  const objectives: LabObjective[] = useMemo(() => {
    switch (labId) {
      case 'emailsec':
        return [
          {
            id: 'e1',
            label: 'Publier SPF strict (-all) avec ≤ 10 lookups DNS (aplatissement actif)',
            done: spfMode === 'hardfail' && spfLookupsFlattened,
          },
          {
            id: 'e2',
            label: 'Publier la clé publique DKIM RSA 2048 bits (sélecteur s2026)',
            done: dkimPublished,
          },
          {
            id: 'e3',
            label: 'Activer DMARC p=reject avec alignement strict (aspf=s, adkim=s)',
            done: dmarcPolicy === 'reject' && dmarcStrictAlign,
          },
          {
            id: 'e4',
            label: 'Activer MTA-STS pour imposer le chiffrement SMTP STARTTLS',
            done: mtaStsEnabled,
          },
          {
            id: 'e5',
            label: 'Identifier l’anomalie BEC dans les en-têtes SMTP (Return-Path / Reply-To)',
            done: becHeaderFlagged,
          },
        ];
      case 'sigmayara':
        return [
          {
            id: 's1',
            label: 'Cibler PowerShell encodé (-enc / -EncodedCommand) dans Sigma',
            done: sigmaProcessMatch,
          },
          {
            id: 's2',
            label: 'Corréler le processus parent suspect (WINWORD.EXE / EXCEL.EXE)',
            done: sigmaParentOffice,
          },
          {
            id: 's3',
            label: 'Filtrer le compte de service légitime (SVC_SCCM_ADMIN) pour 0 % FP',
            done: sigmaAdminExclusion,
          },
          {
            id: 's4',
            label: 'Vérifier l’en-tête PE Windows (uint16(0) == 0x5A4D) dans la règle YARA',
            done: yaraMzHeader,
          },
          {
            id: 's5',
            label: 'Assembler les chaînes IOC YARA et valider le replay sur 1 200 événements',
            done: yaraStringsAndCondition && replayRunCount > 0,
          },
        ];
      case 'dfir':
        return [
          {
            id: 'd1',
            label: 'Capturer la mémoire vive (RAM) AVANT toute action destructive (RFC 3227)',
            done: dfirRamCaptured,
          },
          {
            id: 'd2',
            label: 'Isoler l’hôte compromis via l’EDR tout en gardant le canal forensique',
            done: dfirHostIsolated,
          },
          {
            id: 'd3',
            label: 'Collecter journaux Sysmon/Security (.evtx), sockets réseau et timeline $MFT',
            done: dfirArtifactsCollected,
          },
          {
            id: 'd4',
            label: 'Calculer et sceller les empreintes SHA-256 (Chaîne de preuve intacte)',
            done: dfirCustodySealed,
          },
          {
            id: 'd5',
            label: 'Éradiquer la tâche planifiée malveillante (Updater_Svchost) après preuve',
            done: dfirPersistenceRemoved,
          },
        ];
      case 'iac':
        return [
          {
            id: 'i1',
            label: 'Activer le Remote State chiffré avec verrou distribué (DynamoDB / Blob Lock)',
            done: iacRemoteStateLock,
          },
          {
            id: 'i2',
            label: 'Restreindre SSH (22/tcp) au Bastion 10.50.0.10/32 (zéro 0.0.0.0/0)',
            done: iacStrictSshCidr,
          },
          {
            id: 'i3',
            label: 'Externaliser les secrets via variables sensibles (sensitive = true)',
            done: iacSecretsExternalized,
          },
          {
            id: 'i4',
            label: 'Valider terraform plan et déployer l’infrastructure (terraform apply)',
            done: iacPlanApplied,
          },
          {
            id: 'i5',
            label: 'Vérifier l’idempotence Ansible (changed=0 sur la 2e exécution)',
            done: iacAnsibleIdempotent,
          },
        ];
      case 'iamcloud':
        return [
          {
            id: 'c1',
            label: 'Supprimer le Wildcard (*:*) et appliquer le moindre privilège ciblé',
            done: iamLeastPrivilege,
          },
          {
            id: 'c2',
            label: 'Imposer la condition MFA (aws:MultiFactorAuthPresent = true)',
            done: iamMfaCondition,
          },
          {
            id: 'c3',
            label: 'Remplacer les clés statiques CI/CD par une fédération OIDC courte durée',
            done: iamOidcEnabled,
          },
          {
            id: 'c4',
            label: 'Activer BlockPublicAccess sur le bucket Cloud de production',
            done: iamPublicBlock,
          },
          {
            id: 'c5',
            label: 'Déléguer les accès BDD à Vault (secrets dynamiques TTL 1h)',
            done: iamVaultDynamic,
          },
        ];
      case 'bgprouting':
        return [
          {
            id: 'b1',
            label: 'Établir les adjacences OSPF Backbone Area 0.0.0.0 (état FULL)',
            done: bgpOspfArea0,
          },
          {
            id: 'b2',
            label: 'Appliquer un prefix-list eBGP strict (prévention des Route Leaks)',
            done: bgpPrefixFilter,
          },
          {
            id: 'b3',
            label: 'Activer RPKI / ROA pour rejeter le détournement BGP d’AS 66600',
            done: bgpRpkiEnabled,
          },
          {
            id: 'b4',
            label: 'Activer BFD (300 ms) pour la détection ultra-rapide des coupures de lien',
            done: bgpBfdFast,
          },
          {
            id: 'b5',
            label: 'Activer la bascule SD-WAN SLA pour contourner la liaison MPLS dégradée',
            done: bgpSdwanSla,
          },
        ];
      case 'linuxadmin':
        return [
          {
            id: 'l1',
            label: 'Créer le compte admin_ops (groupe sudo) et désactiver PermitRootLogin SSH',
            done: linuxSudoLocked,
          },
          {
            id: 'l2',
            label: 'Verrouiller /srv/app (chown admin_ops:webops, chmod 750) et clé SSH (600)',
            done: linuxPermsStrict,
          },
          {
            id: 'l3',
            label: 'Activer et démarrer app-api.service avec systemd (Restart=on-failure)',
            done: linuxSystemdActive,
          },
          {
            id: 'l4',
            label: 'Étendre à chaud le volume LVM /dev/vg_data/lv_logs (+20 Go, fin saturation 98 %)',
            done: linuxLvmExtended,
          },
          {
            id: 'l5',
            label: 'Planifier la sauvegarde nocturne (cron 02h30) et auditer les ports (ss)',
            done: linuxCronBackup,
          },
        ];
      case 'winserver':
        return [
          {
            id: 'w1',
            label: 'Renommer en SRV-WIN-01 et configurer une IP fixe 10.20.0.10/24 + DNS',
            done: winStaticIpName,
          },
          {
            id: 'w2',
            label: 'Déployer les rôles DNS (zone cyberland.local) & DHCP (étendue 10.20.0.50-200)',
            done: winDnsDhcpReady,
          },
          {
            id: 'w3',
            label: 'Créer Partage_Compta en SMB3 chiffré + droits NTFS stricts (désactiver SMBv1)',
            done: winSmbEncrypted,
          },
          {
            id: 'w4',
            label: 'Publier IIS en HTTPS (443) et activer WinRM chiffré pour PowerShell Remoting',
            done: winIisHttpsWinrm,
          },
          {
            id: 'w5',
            label: 'Activer les 3 profils du Pare-feu Windows Defender & Windows Server Backup',
            done: winFirewallBackup,
          },
        ];
      case 'admastery':
        return [
          {
            id: 'a1',
            label: 'Promouvoir DC01 (forêt cyberland.local) et activer la Corbeille AD',
            done: adForestPromoted,
          },
          {
            id: 'a2',
            label: 'Structurer les OU (Tier0/1/2, Compta) et les groupes selon le modèle AGDLP',
            done: adOuAgdlpStructured,
          },
          {
            id: 'a3',
            label: 'Créer et lier les 3 GPO de sécurité (MDP 14 car., BitLocker, Pare-feu) en LSDOU',
            done: adGpoLinked,
          },
          {
            id: 'a4',
            label: 'Forcer Kerberos AES-256 (zéro RC4) et activer LDAPS (636/TLS) + Signing',
            done: adKerberosLdaps,
          },
          {
            id: 'a5',
            label: 'Appliquer le Tiering (T0/T1/T2), Windows LAPS et comptes gMSA anti-Kerberoasting',
            done: adTieringLaps,
          },
        ];
    }
  }, [
    labId,
    spfMode,
    spfLookupsFlattened,
    dkimPublished,
    dmarcPolicy,
    dmarcStrictAlign,
    mtaStsEnabled,
    becHeaderFlagged,
    sigmaProcessMatch,
    sigmaParentOffice,
    sigmaAdminExclusion,
    yaraMzHeader,
    yaraStringsAndCondition,
    replayRunCount,
    dfirRamCaptured,
    dfirHostIsolated,
    dfirArtifactsCollected,
    dfirCustodySealed,
    dfirPersistenceRemoved,
    iacRemoteStateLock,
    iacStrictSshCidr,
    iacSecretsExternalized,
    iacPlanApplied,
    iacAnsibleIdempotent,
    iamLeastPrivilege,
    iamMfaCondition,
    iamOidcEnabled,
    iamPublicBlock,
    iamVaultDynamic,
    bgpOspfArea0,
    bgpPrefixFilter,
    bgpRpkiEnabled,
    bgpBfdFast,
    bgpSdwanSla,
    linuxSudoLocked,
    linuxPermsStrict,
    linuxSystemdActive,
    linuxLvmExtended,
    linuxCronBackup,
    winStaticIpName,
    winDnsDhcpReady,
    winSmbEncrypted,
    winIisHttpsWinrm,
    winFirewallBackup,
    adForestPromoted,
    adOuAgdlpStructured,
    adGpoLinked,
    adKerberosLdaps,
    adTieringLaps,
  ]);

  const completedCount = objectives.filter((o) => o.done).length;
  const allCompleted = completedCount === objectives.length;

  useEffect(() => {
    if (allCompleted && !completedAwardedRef.current) {
      completedAwardedRef.current = true;
      playSuccess();
      onCompleteLab?.();
    }
  }, [allCompleted, onCompleteLab]);

  // --- Generated Live Config / Artifact per Lab ---
  const generatedArtifact = useMemo(() => {
    switch (labId) {
      case 'emailsec': {
        const spfQualifier = spfMode === 'hardfail' ? '-all' : spfMode === 'softfail' ? '~all' : '?all';
        const spfRecord = spfLookupsFlattened
          ? `v=spf1 ip4:203.0.113.25 ip4:198.51.100.12 include:_spf.google.com ${spfQualifier}`
          : `v=spf1 include:spf1.old.net include:spf2.crm.net include:spf3.erp.net include:_spf.google.com ${spfQualifier} ; ATTENTION: 12 lookups > 10 (PermError)`;
        const alignFlags = dmarcStrictAlign ? ' adkim=s; aspf=s;' : ' adkim=r; aspf=r;';
        return `; Zone DNS cyberland.fr — Générée en temps réel
@                     IN TXT "${spfRecord}"
${
  dkimPublished
    ? 's2026._domainkey      IN TXT "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCg..."'
    : '; [MANQUANT] Clé publique DKIM s2026._domainkey non publiée'
}
_dmarc                IN TXT "v=DMARC1; p=${dmarcPolicy}; sp=${dmarcPolicy};${alignFlags} pct=100; rua=mailto:dmarc-rua@cyberland.fr"
${
  mtaStsEnabled
    ? '_mta-sts              IN TXT "v=STSv1; id=20261124; mode=enforce"\n_smtp._tls            IN TXT "v=TLSRPTv1; rua=mailto:tls-rpt@cyberland.fr"'
    : '; [NON ACTIF] MTA-STS absent (risque downgrade STARTTLS)'
}
; Statut investigation en-tête BEC : ${becHeaderFlagged ? 'USURPATION CONFIRMÉE (Return-Path != From, Reply-To externe)' : 'En attente d’analyse SOC'}`;
      }
      case 'sigmayara':
        return `# --- RÈGLE SIGMA (YAML) ---
title: Suspicious Encoded PowerShell Spawned by Office
status: ${sigmaParentOffice && sigmaAdminExclusion ? 'production' : 'experimental'}
logsource:
  category: process_creation
  product: windows
detection:
  selection_ps:
    Image|endswith: '\\powershell.exe'
    ${sigmaProcessMatch ? "CommandLine|contains: ['-enc', '-EncodedCommand']" : '# [MANQUANT] Filtre -EncodedCommand'}
  ${
    sigmaParentOffice
      ? "selection_parent:\n    ParentImage|endswith: ['\\\\WINWORD.EXE', '\\\\EXCEL.EXE']"
      : '# [RECOMMANDÉ] Corrélation ParentImage Office non activée'
  }
  ${
    sigmaAdminExclusion
      ? "filter_admin:\n    User: 'CYBERLAND\\\\SVC_SCCM_ADMIN'"
      : '# [RISQUE FP] Aucune exclusion du compte de déploiement SCCM'
  }
  condition: selection_ps${sigmaParentOffice ? ' and selection_parent' : ''}${sigmaAdminExclusion ? ' and not filter_admin' : ''}
level: high

# --- RÈGLE YARA (.yar) ---
rule Cyberland_Dropper_Beacon {
  strings:
    ${yaraStringsAndCondition ? '$s1 = "Invoke-ReflectivePEInjection" ascii wide\n    $s2 = { 48 89 5C 24 08 57 48 83 EC 20 }' : '// [MANQUANT] Chaînes & opcodes IOC'}
  condition:
    ${yaraMzHeader ? 'uint16(0) == 0x5A4D' : '/* header MZ non vérifié */ true'}${yaraStringsAndCondition ? ' and all of ($s*)' : ''}
}`;
      case 'dfir':
        return JSON.stringify(
          {
            incident_id: 'INC-2026-0418-SRVCOMPTA',
            rfc3227_order_respected: dfirRamCaptured,
            host_isolation_edr: dfirHostIsolated ? 'ISOLATED_FORENSIC_CHANNEL_OPEN' : 'EXPOSED_ON_LAN',
            artifacts_collected: [
              ...(dfirRamCaptured ? ['ram_dump_srv-compta.raw (8.0 GiB)'] : []),
              ...(dfirArtifactsCollected
                ? ['Security.evtx', 'Sysmon.evtx', 'netstat_sockets.txt', '$MFT_timeline.csv']
                : []),
            ],
            chain_of_custody: dfirCustodySealed
              ? {
                  status: 'SEALED_SHA256',
                  ram_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                  analyst_signoff: 'SOC-DFIR-N2',
                }
              : { status: 'UNSEALED' },
            eradication: {
              malicious_task_updater_svchost: dfirPersistenceRemoved ? 'REMOVED_VERIFIED' : 'ACTIVE_PERSISTENCE',
            },
          },
          null,
          2
        );
      case 'iac':
        return `# --- main.tf (Terraform HCL) ---
terraform {
  ${
    iacRemoteStateLock
      ? `backend "s3" {
    bucket         = "cyberland-tfstate-prod"
    key            = "web/terraform.tfstate"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }`
      : '# [RISQUE] Backend local sans verrouillage (conflits d’équipe)'
  }
}

resource "aws_security_group" "web_sg" {
  name = "cyberland-web-sg"
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${iacStrictSshCidr ? '10.50.0.10/32' : '0.0.0.0/0'}"]
  }
}

${
  iacSecretsExternalized
    ? `variable "db_password" {\n  type      = string\n  sensitive = true\n}`
    : '# [FUITE CRITIQUE] password = "ProdPassword2026!" écrit en clair dans Git !'
}

# Statut déploiement : ${iacPlanApplied ? 'APPLY RÉUSSI (4 ressources conformes, 0 drift)' : 'En attente de terraform plan / apply'}
# Idempotence Ansible : ${iacAnsibleIdempotent ? 'VALIDÉE (ok=5 changed=0 failed=0)' : 'Non vérifiée'}`;
      case 'iamcloud':
        return JSON.stringify(
          {
            Version: '2012-10-17',
            Statement: [
              {
                Sid: iamLeastPrivilege ? 'ScopedReadProdBucket' : 'DangerousWildcardAdmin',
                Effect: 'Allow',
                Action: iamLeastPrivilege ? ['s3:GetObject', 's3:ListBucket'] : ['*'],
                Resource: iamLeastPrivilege
                  ? ['arn:aws:s3:::cyberland-prod-data', 'arn:aws:s3:::cyberland-prod-data/*']
                  : ['*'],
                ...(iamMfaCondition
                  ? { Condition: { Bool: { 'aws:MultiFactorAuthPresent': 'true' } } }
                  : {}),
              },
            ],
            cyberland_controls: {
              cicd_auth: iamOidcEnabled ? 'OIDC_SHORT_LIVED_TOKEN_15M' : 'STATIC_ACCESS_KEY_LEAK_RISK',
              s3_block_public_access: iamPublicBlock,
              database_secrets: iamVaultDynamic ? 'VAULT_DYNAMIC_TTL_1H' : 'STATIC_ENV_PASSWORD',
            },
          },
          null,
          2
        );
      case 'bgprouting':
        return `! Configuration FRRouting — Core Router CYBERLAND (AS 65100)
router ospf
 ospf router-id 10.255.0.1
 ${bgpOspfArea0 ? 'network 10.10.0.0/16 area 0.0.0.0\n passive-interface default\n no passive-interface eth0' : '! [MANQUANT] Backbone OSPF Area 0.0.0.0 non configuré'}
!
router bgp 65100
 bgp router-id 10.255.0.1
 neighbor 198.51.100.1 remote-as 3356
 ${bgpBfdFast ? 'neighbor 198.51.100.1 bfd' : '! BFD inactif (hold-timer BGP 90s)'}
 !
 address-family ipv4 unicast
  network 203.0.113.0/24
  ${bgpPrefixFilter ? 'neighbor 198.51.100.1 prefix-list PL-EXPORT-CYBERLAND out' : '! [DANGER ROUTE LEAK] Aucun filtre prefix-list en sortie'}
 exit-address-family
!
${bgpRpkiEnabled ? 'rpki\n rpki cache 10.255.0.50 3323 preference 1\n! Route-map RPKI-CHECK : DROP rpki invalid (AS 66600 bloqué)' : '! [VULNÉRABLE HIJACK] Validation RPKI / ROA désactivée'}
! SD-WAN Policy : ${bgpSdwanSla ? 'SLA_ACTIVE (VoIP/App -> DIA Fiber 14ms | MPLS dégradé évité)' : 'STATIC_MPLS (latence 185ms, perte 4.2%)'}`;
      case 'linuxadmin':
        return `#!/usr/bin/env bash
# Script d'administration Linux — Généré en temps réel
${
  linuxSudoLocked
    ? 'useradd -m -s /bin/bash -G sudo,webops admin_ops\nsed -i "s/^#\\?PermitRootLogin.*/PermitRootLogin no/" /etc/ssh/sshd_config && systemctl reload ssh'
    : '# [RISQUE] Connexion root SSH encore ouverte, compte admin_ops absent'
}
${
  linuxPermsStrict
    ? 'chown -R admin_ops:webops /srv/app && chmod 750 /srv/app && chmod 600 /home/admin_ops/.ssh/id_ed25519'
    : '# [EXPOSÉ] /srv/app en chmod 777 (écriture ouverte à tous !)'
}
${
  linuxSystemdActive
    ? 'systemctl daemon-reload && systemctl enable --now app-api.service # Restart=on-failure actif'
    : '# [ARRÊTÉ] app-api.service en état failed (non activé au boot)'
}
${
  linuxLvmExtended
    ? 'lvextend -L +20G -r /dev/vg_data/lv_logs # /var/log ramené de 98% -> 42%'
    : '# [ALERTE DISQUE] /var/log saturé à 98% sur /dev/vg_data/lv_logs'
}
${
  linuxCronBackup
    ? 'echo "30 2 * * * /usr/local/bin/backup-app.sh >> /var/log/backup.log 2>&1" | crontab -'
    : '# [MANQUANT] Aucune tâche cron de sauvegarde planifiée'
}`;
      case 'winserver':
        return `# Script PowerShell Windows Server — Généré en temps réel
${
  winStaticIpName
    ? 'New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 10.20.0.10 -PrefixLength 24 -DefaultGateway 10.20.0.1\nSet-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("127.0.0.1")\nRename-Computer -NewName "SRV-WIN-01"'
    : '# [NON CONFIGURÉ] Nom WIN-RAND9X et IP dynamique DHCP instable'
}
${
  winDnsDhcpReady
    ? 'Install-WindowsFeature DNS, DHCP -IncludeManagementTools\nAdd-DnsServerPrimaryZone -Name "cyberland.local" -ZoneFile "cyberland.local.dns"\nAdd-DhcpServerv4Scope -Name "LAN-Bureaux" -StartRange 10.20.0.50 -EndRange 10.20.0.200 -SubnetMask 255.255.255.0'
    : '# [MANQUANT] Rôles DNS et DHCP non installés'
}
${
  winSmbEncrypted
    ? 'New-SmbShare -Name "Partage_Compta" -Path "D:\\Partages\\Compta" -FullAccess "CYBERLAND\\GG_Compta_RW" -EncryptData $true\nSet-SmbServerConfiguration -EnableSMB1Protocol $false -Force'
    : '# [DANGER] SMBv1 actif et partage accessible à Everyone en clair'
}
${
  winIisHttpsWinrm
    ? 'Install-WindowsFeature Web-Server -IncludeManagementTools\nNew-WebBinding -Name "Default Web Site" -Protocol https -Port 443\nEnable-PSRemoting -Force'
    : '# [EXPOSÉ] Site IIS en HTTP port 80 non chiffré, WinRM inactif'
}
${
  winFirewallBackup
    ? 'Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True\nInstall-WindowsFeature Windows-Server-Backup'
    : '# [VULNÉRABLE] Pare-feu Windows désactivé et aucune sauvegarde système'
}`;
      case 'admastery':
        return `# Script PowerShell Active Directory (AD DS) — Généré en temps réel
${
  adForestPromoted
    ? 'Install-WindowsFeature AD-Domain-Services -IncludeManagementTools\nInstall-ADDSForest -DomainName "cyberland.local" -DomainNetbiosName "CYBERLAND" -InstallDns:$true\nEnable-ADOptionalFeature "Recycle Bin Feature" -Scope ForestOrConfigurationSet -Target "cyberland.local"'
    : '# [WORKGROUP] Contrôleur de Domaine DC01 non promu'
}
${
  adOuAgdlpStructured
    ? 'New-ADOrganizationalUnit -Name "IT_Tier0" ; New-ADOrganizationalUnit -Name "Serveurs_Tier1" ; New-ADOrganizationalUnit -Name "Postes_Tier2"\nNew-ADGroup -Name "GG_Compta" -GroupScope Global ; New-ADGroup -Name "DL_Compta_RW" -GroupScope DomainLocal\nAdd-ADGroupMember -Identity "DL_Compta_RW" -Members "GG_Compta"'
    : '# [DÉSORGANISÉ] Tous les comptes empilés dans le conteneur Users par défaut'
}
${
  adGpoLinked
    ? 'New-GPO -Name "SEC-Postes-Hardening" | New-GPLink -Target "OU=Postes_Tier2,DC=cyberland,DC=local"\n# Politiques actives : MDP 14 car., BitLocker, Pare-feu & blocage USB (ordre LSDOU)'
    : '# [AUCUNE GPO] Politiques de sécurité non appliquées sur les postes'
}
${
  adKerberosLdaps
    ? 'Set-ADUser -Identity "svc_app" -KerberosEncryptionType AES256\n# LDAPS (TCP 636 TLS) + LDAP Signing forcés sur DC01'
    : '# [FAIBLE] Kerberos RC4 autorisé et requêtes LDAP 389 en clair'
}
${
  adTieringLaps
    ? 'Update-LapsADSchema ; Set-LapsADComputerSelfPermission -Identity "OU=Postes_Tier2,DC=cyberland,DC=local"\nNew-ADServiceAccount -Name "gmsa_web" -DNSHostName "gmsa_web.cyberland.local"\n# Cloisonnement Tier 0 / Tier 1 / Tier 2 actif'
    : '# [CRITIQUE] Mot de passe admin local identique partout (risque Pass-the-Hash)'
}`;
    }
  }, [
    labId,
    spfMode,
    spfLookupsFlattened,
    dkimPublished,
    dmarcPolicy,
    dmarcStrictAlign,
    mtaStsEnabled,
    becHeaderFlagged,
    sigmaProcessMatch,
    sigmaParentOffice,
    sigmaAdminExclusion,
    yaraMzHeader,
    yaraStringsAndCondition,
    dfirRamCaptured,
    dfirHostIsolated,
    dfirArtifactsCollected,
    dfirCustodySealed,
    dfirPersistenceRemoved,
    iacRemoteStateLock,
    iacStrictSshCidr,
    iacSecretsExternalized,
    iacPlanApplied,
    iacAnsibleIdempotent,
    iamLeastPrivilege,
    iamMfaCondition,
    iamOidcEnabled,
    iamPublicBlock,
    iamVaultDynamic,
    bgpOspfArea0,
    bgpPrefixFilter,
    bgpRpkiEnabled,
    bgpBfdFast,
    bgpSdwanSla,
    linuxSudoLocked,
    linuxPermsStrict,
    linuxSystemdActive,
    linuxLvmExtended,
    linuxCronBackup,
    winStaticIpName,
    winDnsDhcpReady,
    winSmbEncrypted,
    winIisHttpsWinrm,
    winFirewallBackup,
    adForestPromoted,
    adOuAgdlpStructured,
    adGpoLinked,
    adKerberosLdaps,
    adTieringLaps,
  ]);

  // --- Diagnostic Terminal Commands per Lab ---
  const terminalCommands = useMemo(() => {
    switch (labId) {
      case 'emailsec':
        return [
          {
            cmd: 'dig +short TXT cyberland.fr',
            run: () => ({
              ok: spfMode === 'hardfail' && spfLookupsFlattened,
              out:
                spfMode === 'hardfail' && spfLookupsFlattened
                  ? '"v=spf1 ip4:203.0.113.25 ip4:198.51.100.12 include:_spf.google.com -all"\n[OK] 4/10 lookups DNS · Politique HardFail (-all) active.'
                  : !spfLookupsFlattened
                    ? '[ERREUR PermError] 12 lookups DNS détectés (limite RFC 7208 : 10 max) ! Aplatissez les include.'
                    : `[AVERTISSEMENT] Qualificateur actuel "${spfMode === 'softfail' ? '~all' : '?all'}" trop permissif. Passez à -all.`,
            }),
          },
          {
            cmd: 'opendkim-testkey -d cyberland.fr -s s2026 -vvv',
            run: () => ({
              ok: dkimPublished,
              out: dkimPublished
                ? 'opendkim-testkey: checking key s2026._domainkey.cyberland.fr\nopendkim-testkey: key OK (RSA-2048 validée).'
                : 'opendkim-testkey: key not found in DNS (NXDOMAIN). Publiez la clé publique DKIM.',
            }),
          },
          {
            cmd: 'dig +short TXT _dmarc.cyberland.fr',
            run: () => ({
              ok: dmarcPolicy === 'reject' && dmarcStrictAlign,
              out:
                dmarcPolicy === 'reject' && dmarcStrictAlign
                  ? '"v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; pct=100; rua=mailto:dmarc-rua@cyberland.fr"\n[OK] Rejet strict et alignement activés.'
                  : `"v=DMARC1; p=${dmarcPolicy}; adkim=${dmarcStrictAlign ? 's' : 'r'}; aspf=${dmarcStrictAlign ? 's' : 'r'}"\n[INSUFFISANT] Passez p=reject avec alignement strict.`,
            }),
          },
          {
            cmd: 'analyze-header --sample bec-pdg.eml',
            run: () => ({
              ok: becHeaderFlagged,
              out: `From: "Direction" <pdg@cyberland.fr>\nReturn-Path: <bounce@promo-evil.xyz>  [ÉCHEC ALIGNEMENT]\nReply-To: urgent-virement@gmail.com   [ALERTE BEC]\nStatut analyste : ${becHeaderFlagged ? 'CLASSÉ USURPATION BEC (bloqué)' : 'Non signalé — cliquez sur "Signaler la fraude BEC"'}`,
            }),
          },
          {
            cmd: 'mta-sts-check cyberland.fr',
            run: () => ({
              ok: mtaStsEnabled,
              out: mtaStsEnabled
                ? '[OK] _mta-sts.cyberland.fr mode=enforce · STARTTLS obligatoire avec certificat valide.'
                : '[ALERTE] Aucune politique MTA-STS : vulnérable au downgrade STARTTLS en clair.',
            }),
          },
        ];
      case 'sigmayara':
        return [
          {
            cmd: 'sigma convert -t kql rule_office_ps.yml',
            run: () => ({
              ok: sigmaProcessMatch && sigmaParentOffice && sigmaAdminExclusion,
              out: `DeviceProcessEvents\n| where FileName =~ "powershell.exe"${sigmaProcessMatch ? ' and ProcessCommandLine has_any ("-enc", "-EncodedCommand")' : ''}${sigmaParentOffice ? '\n| where InitiatingProcessFileName in~ ("WINWORD.EXE", "EXCEL.EXE")' : ''}${sigmaAdminExclusion ? '\n| where AccountName != "SVC_SCCM_ADMIN"' : ''}`,
            }),
          },
          {
            cmd: 'sigma test --replay 1200-sysmon-events.json',
            run: () => {
              const fp = !sigmaParentOffice ? 38 : !sigmaAdminExclusion ? 14 : 0;
              const tp = sigmaProcessMatch ? 3 : 0;
              return {
                ok: tp === 3 && fp === 0,
                out: `Replay terminé (1 200 événements) : Vrais Positifs = ${tp}/3 · Faux Positifs = ${fp}\nPrécision : ${tp + fp === 0 ? '0%' : `${Math.round((tp / (tp + fp)) * 100)}%`}`,
              };
            },
          },
          {
            cmd: 'yara -r cyberland_dropper.yar /samples/',
            run: () => ({
              ok: yaraMzHeader && yaraStringsAndCondition,
              out:
                yaraMzHeader && yaraStringsAndCondition
                  ? 'Cyberland_Dropper_Beacon /samples/invoice_payload.exe\nCyberland_Dropper_Beacon /samples/update_tmp.dll\n[OK] 2/2 malwares PE détectés · 0 faux positif sur fichiers texte/doc.'
                  : !yaraMzHeader
                    ? '[BRUIT] En-tête MZ (0x5A4D) absent : la règle scanne aussi les journaux texte.'
                    : '[INCOMPLET] Ajoutez les chaînes IOC ($s1/$s2) et la condition all of ($s*).',
            }),
          },
          {
            cmd: 'hunt-ioc --parent winword --last 24h',
            run: () => ({
              ok: sigmaParentOffice,
              out: sigmaParentOffice
                ? '[HUNT] 3 chaînes suspectes trouvées : WINWORD.EXE (PID 4120) -> powershell.exe -enc SQBFAFgA...'
                : '[BRUIT] 41 événements powershell.exe trouvés sans corrélation parentale Office.',
            }),
          },
          {
            cmd: 'soc-metrics --rule-noise',
            run: () => ({
              ok: sigmaAdminExclusion && sigmaParentOffice,
              out:
                sigmaAdminExclusion && sigmaParentOffice
                  ? '[OPTIMAL] Bruit SOC : 0 alerte/jour inutile · Prête pour mise en production SIEM.'
                  : '[FATIGUE ALERTE] Trop de faux positifs (compte SCCM ou processus parents non filtrés).',
            }),
          },
        ];
      case 'dfir':
        return [
          {
            cmd: 'vol3 -f ram_dump.raw windows.pstree',
            run: () => ({
              ok: dfirRamCaptured,
              out: dfirRamCaptured
                ? 'PID 4120 WINWORD.EXE\n └─ PID 5884 powershell.exe (mémoire intacte)\n    └─ PID 6112 svchost_tmp.exe [INJECTION DÉTECTÉE]'
                : '[ERREUR] Aucun dump RAM disponible. Capturez la mémoire vive en priorité (RFC 3227).',
            }),
          },
          {
            cmd: 'edr-ctl status srv-compta',
            run: () => ({
              ok: dfirHostIsolated,
              out: dfirHostIsolated
                ? 'Host: srv-compta | Status: NETWORK_ISOLATED | C2 Blocked | Forensic SSH: OPEN'
                : 'Host: srv-compta | Status: ONLINE_EXPOSED | Alerte : beacon actif vers 185.220.101.44:443 !',
            }),
          },
          {
            cmd: 'evtx-timeline --host srv-compta --top 3',
            run: () => ({
              ok: dfirArtifactsCollected,
              out: dfirArtifactsCollected
                ? '14:02:11 Sysmon EID 1  WINWORD.EXE -> powershell.exe -enc\n14:02:49 Sysmon EID 3  TCP 185.220.101.44:443\n14:03:05 Security 4698 Tâche planifiée créée : Updater_Svchost'
                : '[VIDE] Collectez les journaux .evtx, les sockets réseau et la timeline $MFT.',
            }),
          },
          {
            cmd: 'sha256sum -c chain_of_custody.sha256',
            run: () => ({
              ok: dfirCustodySealed,
              out: dfirCustodySealed
                ? 'ram_dump_srv-compta.raw: OK\nSecurity.evtx: OK\nSysmon.evtx: OK\n[OK] Intégrité forensique vérifiée (recevable en audit/justice).'
                : '[NON SCELLÉ] Calculez et horodatez les empreintes SHA-256 des preuves.',
            }),
          },
          {
            cmd: 'schtasks /query /tn Updater_Svchost',
            run: () => ({
              ok: dfirPersistenceRemoved,
              out: dfirPersistenceRemoved
                ? 'ERREUR : Le système ne trouve pas la tâche spécifiée. [OK : persistance éradiquée]'
                : 'TaskName: \\Updater_Svchost | Status: Ready | Action: C:\\ProgramData\\beacon.exe [ACTIF !]',
            }),
          },
        ];
      case 'iac':
        return [
          {
            cmd: 'terraform init -backend=true',
            run: () => ({
              ok: iacRemoteStateLock,
              out: iacRemoteStateLock
                ? 'Initializing the backend "s3" (encrypt=true, dynamodb_table=terraform-state-lock)...\n[OK] Remote State verrouillé.'
                : '[AVERTISSEMENT] State stocké en local (terraform.tfstate) sans verrou concurrent.',
            }),
          },
          {
            cmd: 'tfsec . --minimum-severity HIGH',
            run: () => ({
              ok: iacStrictSshCidr && iacSecretsExternalized,
              out:
                iacStrictSshCidr && iacSecretsExternalized
                  ? '[OK] 0 vulnérabilité CRITICAL/HIGH détectée · SSH limité au bastion et aucun secret en dur.'
                  : `${!iacStrictSshCidr ? '[CRITICAL] AWS-0107 : Port 22 ouvert sur 0.0.0.0/0\n' : ''}${!iacSecretsExternalized ? '[HIGH] GEN-003 : Mot de passe écrit en clair dans main.tf' : ''}`,
            }),
          },
          {
            cmd: 'terraform plan -out=tfplan',
            run: () => ({
              ok: iacRemoteStateLock && iacStrictSshCidr && iacSecretsExternalized,
              out:
                iacRemoteStateLock && iacStrictSshCidr && iacSecretsExternalized
                  ? 'Plan: 4 to add, 0 to change, 0 to destroy. (tfplan prêt pour apply)'
                  : 'Plan bloqué par la politique DevSecOps : corrigez d’abord le State, le CIDR SSH et les secrets.',
            }),
          },
          {
            cmd: 'terraform apply tfplan',
            run: () => ({
              ok: iacPlanApplied,
              out: iacPlanApplied
                ? 'Apply complete! Resources: 4 added, 0 changed, 0 destroyed.'
                : '[EN ATTENTE] Exécutez le déploiement terraform apply dans le panneau de contrôle.',
            }),
          },
          {
            cmd: 'ansible-playbook -i prod.ini site.yml --check',
            run: () => ({
              ok: iacAnsibleIdempotent,
              out: iacAnsibleIdempotent
                ? 'PLAY RECAP : srv-web-01 ok=5 changed=0 unreachable=0 failed=0\n[OK] Playbook 100 % idempotent.'
                : '[NON TESTÉ] Validez l’idempotence Ansible (dry-run + 2e passage à changed=0).',
            }),
          },
        ];
      case 'iamcloud':
        return [
          {
            cmd: 'aws iam simulate-principal-policy --action s3:DeleteBucket',
            run: () => ({
              ok: iamLeastPrivilege,
              out: iamLeastPrivilege
                ? 'EvalDecision: implicitDeny [OK] Le rôle n’est autorisé qu’à lire cyberland-prod-data.'
                : 'EvalDecision: allowed [CRITIQUE] Le Wildcard Action:"*" autorise la suppression complète !',
            }),
          },
          {
            cmd: 'aws iam check-mfa-enforcement',
            run: () => ({
              ok: iamMfaCondition,
              out: iamMfaCondition
                ? '[OK] Condition aws:MultiFactorAuthPresent=true active sur toutes les actions sensibles.'
                : '[DANGER] Les sessions sans MFA sont acceptées en cas de mot de passe volé.',
            }),
          },
          {
            cmd: 'ci-audit --check-cloud-creds',
            run: () => ({
              ok: iamOidcEnabled,
              out: iamOidcEnabled
                ? '[OK] Fédération OIDC GitHub/GitLab active · Jetons STS éphémères (15 min), 0 clé statique.'
                : '[ALERTE] Clé statique AKIA... trouvée dans les variables CI (durée de vie illimitée).',
            }),
          },
          {
            cmd: 'aws s3api get-public-access-block --bucket cyberland-prod-data',
            run: () => ({
              ok: iamPublicBlock,
              out: iamPublicBlock
                ? '{ "BlockPublicAcls": true, "IgnorePublicAcls": true, "BlockPublicPolicy": true, "RestrictPublicBuckets": true }'
                : '[EXPOSÉ] BlockPublicAccess désactivé : risque de fuite publique du bucket !',
            }),
          },
          {
            cmd: 'vault read database/creds/app-readonly',
            run: () => ({
              ok: iamVaultDynamic,
              out: iamVaultDynamic
                ? 'lease_duration: 1h | username: v-oidc-readonly-8f2a | password: <échéance auto>\n[OK] Secret dynamique généré et révoqué automatiquement.'
                : '[STATIQUE] La base utilise encore un mot de passe partagé non rotatif.',
            }),
          },
        ];
      case 'bgprouting':
        return [
          {
            cmd: 'vtysh -c "show ip ospf neighbor"',
            run: () => ({
              ok: bgpOspfArea0,
              out: bgpOspfArea0
                ? 'Neighbor ID  Pri  State      Dead Time  Address      Interface\n10.255.0.2     1  Full/DR    38.2s      10.10.0.2    eth0 (Area 0.0.0.0)'
                : 'No OSPF neighbors found. Configurez Area 0.0.0.0.',
            }),
          },
          {
            cmd: 'vtysh -c "show bgp ipv4 unicast summary"',
            run: () => ({
              ok: bgpPrefixFilter,
              out: bgpPrefixFilter
                ? 'Neighbor 198.51.100.1 AS 3356 | State: Established | Out-Filter: PL-EXPORT-CYBERLAND (1 prefix sent)'
                : 'Neighbor 198.51.100.1 AS 3356 | State: Established | [ALERTE] 4 820 préfixes ré-annoncés (Route Leak !)',
            }),
          },
          {
            cmd: 'vtysh -c "show bgp rpki prefix-table"',
            run: () => ({
              ok: bgpRpkiEnabled,
              out: bgpRpkiEnabled
                ? '203.0.113.0/24  AS 65100 -> RPKI VALID\n203.0.113.0/24  AS 66600 -> RPKI INVALID [DROPPED — Hijack bloqué !]'
                : '[VULNÉRABLE] RPKI non actif : l’annonce pirate d’AS 66600 détourne le trafic mondial !',
            }),
          },
          {
            cmd: 'vtysh -c "show bfd peers brief"',
            run: () => ({
              ok: bgpBfdFast,
              out: bgpBfdFast
                ? 'SessionId 101 | Peer 198.51.100.1 | Status: up | Detect-Time: 300ms'
                : 'No BFD sessions active (détection coupure lente : 90 000 ms).',
            }),
          },
          {
            cmd: 'sdwan-cli show sla-probes',
            run: () => ({
              ok: bgpSdwanSla,
              out: bgpSdwanSla
                ? 'MPLS-Link1: 185ms / 4.2% loss [DEGRADED] -> Trafic basculé automatiquement sur DIA-Fiber (14ms / 0.0% loss)'
                : 'MPLS-Link1: 185ms / 4.2% loss [ACTIF — VoIP hachée] · Politique SD-WAN SLA inactive.',
            }),
          },
        ];
      case 'linuxadmin':
        return [
          {
            cmd: 'id admin_ops && grep PermitRootLogin /etc/ssh/sshd_config',
            run: () => ({
              ok: linuxSudoLocked,
              out: linuxSudoLocked
                ? 'uid=1001(admin_ops) gid=1001(admin_ops) groups=27(sudo),1005(webops)\nPermitRootLogin no\n[OK] Compte sudo dédié actif et root SSH verrouillé.'
                : 'id: admin_ops: no such user\nPermitRootLogin yes [DANGER : connexion directe en root autorisée !]',
            }),
          },
          {
            cmd: 'ls -ld /srv/app && stat -c "%a %n" ~/.ssh/id_ed25519',
            run: () => ({
              ok: linuxPermsStrict,
              out: linuxPermsStrict
                ? 'drwxr-x--- 4 admin_ops webops 4096 /srv/app\n600 /home/admin_ops/.ssh/id_ed25519\n[OK] Permissions conformes au moindre privilège.'
                : 'drwxrwxrwx 4 root root 4096 /srv/app [CRITIQUE : chmod 777 !]\n644 ~/.ssh/id_ed25519 [ERREUR : clé SSH trop permissive]',
            }),
          },
          {
            cmd: 'systemctl status app-api.service --no-pager',
            run: () => ({
              ok: linuxSystemdActive,
              out: linuxSystemdActive
                ? '● app-api.service - API Cyberland Production\n   Loaded: loaded (enabled)\n   Active: active (running) | Restart=on-failure\n[OK] Démon actif et persistant au démarrage.'
                : '× app-api.service - API Cyberland Production\n   Loaded: loaded (disabled)\n   Active: failed (Result: exit-code)',
            }),
          },
          {
            cmd: 'df -h /var/log && lvs vg_data/lv_logs',
            run: () => ({
              ok: linuxLvmExtended,
              out: linuxLvmExtended
                ? '/dev/mapper/vg_data-lv_logs  30G  12.6G  17.4G  42% /var/log\n[OK] Extension LVM +20 Go appliquée à chaud sans interruption.'
                : '/dev/mapper/vg_data-lv_logs  10G   9.8G   200M  98% /var/log\n[CRITIQUE] Partition presque saturée : étendez le volume LVM !',
            }),
          },
          {
            cmd: 'crontab -l && ss -tulpn | grep :443',
            run: () => ({
              ok: linuxCronBackup,
              out: linuxCronBackup
                ? '30 2 * * * /usr/local/bin/backup-app.sh >> /var/log/backup.log 2>&1\ntcp LISTEN 0 511 0.0.0.0:443 users:(("nginx",pid=1402))\n[OK] Sauvegarde planifiée et écoute réseau auditée.'
                : 'no crontab for admin_ops\n[AVERTISSEMENT] Aucune sauvegarde automatisée configurée.',
            }),
          },
        ];
      case 'winserver':
        return [
          {
            cmd: 'hostname && Get-NetIPAddress -InterfaceAlias Ethernet -AddressFamily IPv4',
            run: () => ({
              ok: winStaticIpName,
              out: winStaticIpName
                ? 'SRV-WIN-01\nIPAddress: 10.20.0.10/24 | PrefixOrigin: Manual | DNS: 127.0.0.1\n[OK] Identité serveur et IP statique configurées.'
                : 'WIN-RAND9X\nIPAddress: 10.20.0.143/24 | PrefixOrigin: Dhcp [RISQUE : IP instable pour un serveur !]',
            }),
          },
          {
            cmd: 'Get-DnsServerZone && Get-DhcpServerv4Scope',
            run: () => ({
              ok: winDnsDhcpReady,
              out: winDnsDhcpReady
                ? 'Zone: cyberland.local (Primary) | A intranet -> 10.20.0.10\nScopeId: 10.20.0.0 | State: Active | Range: 10.20.0.50 - 10.20.0.200\n[OK] Services DNS et DHCP opérationnels.'
                : '[ERREUR] Les rôles Windows DNS et DHCP ne sont pas encore installés.',
            }),
          },
          {
            cmd: 'Get-SmbShare -Name Partage_Compta | Select Name,EncryptData',
            run: () => ({
              ok: winSmbEncrypted,
              out: winSmbEncrypted
                ? 'Name: Partage_Compta | EncryptData: True | SMBv1: Disabled | NTFS: GG_Compta_RW\n[OK] Partage SMB3 chiffré et droits NTFS stricts.'
                : 'Name: Partage_Compta | EncryptData: False | SMBv1: Enabled | Access: Everyone [CRITIQUE !]',
            }),
          },
          {
            cmd: 'Test-NetConnection -Port 443 localhost && Test-WSMan localhost',
            run: () => ({
              ok: winIisHttpsWinrm,
              out: winIisHttpsWinrm
                ? 'TcpTestSucceeded : True (IIS HTTPS 443 actif)\nwsmid : WinRM PowerShell Remoting opérationnel\n[OK] Portail sécurisé et administration distante prête.'
                : 'TcpTestSucceeded : False (seul HTTP 80 répond) · WinRM non activé.',
            }),
          },
          {
            cmd: 'Get-NetFirewallProfile | Select Name,Enabled',
            run: () => ({
              ok: winFirewallBackup,
              out: winFirewallBackup
                ? 'Domain: True | Private: True | Public: True\nWindows-Server-Backup: Installed (sauvegarde System State prête)'
                : 'Domain: False | Private: False | Public: False [DANGER : Pare-feu Windows coupé !]',
            }),
          },
        ];
      case 'admastery':
        return [
          {
            cmd: 'Get-ADDomain | Select DNSRoot,DomainMode,PDCEmulator',
            run: () => ({
              ok: adForestPromoted,
              out: adForestPromoted
                ? 'DNSRoot: cyberland.local | DomainMode: Windows2016Domain | PDC: dc01.cyberland.local\nCorbeille AD: Enabled [OK]'
                : '[ERREUR] Ce serveur est encore en WORKGROUP. Promouvez DC01 avec Install-ADDSForest.',
            }),
          },
          {
            cmd: 'Get-ADOrganizationalUnit -Filter * | Select Name',
            run: () => ({
              ok: adOuAgdlpStructured,
              out: adOuAgdlpStructured
                ? 'OU: IT_Tier0, Serveurs_Tier1, Postes_Tier2, Compta\nGroupes AGDLP : GG_Compta -> DL_Compta_RW [OK]'
                : 'Seule l’OU Domain Controllers existe. Structurez vos OU et groupes AGDLP.',
            }),
          },
          {
            cmd: 'gpresult /R /SCOPE COMPUTER',
            run: () => ({
              ok: adGpoLinked,
              out: adGpoLinked
                ? 'GPO appliquées (ordre LSDOU) :\n  1. Default Domain Policy (MDP 14 car.)\n  2. SEC-Postes-Hardening (BitLocker, Pare-feu, USB bloqué)\n[OK] Stratégies de groupe actives.'
                : 'Aucune GPO de durcissement personnalisée liée à OU=Postes_Tier2.',
            }),
          },
          {
            cmd: 'klist && Test-NetConnection dc01.cyberland.local -Port 636',
            run: () => ({
              ok: adKerberosLdaps,
              out: adKerberosLdaps
                ? 'Ticket TGT : krbtgt/CYBERLAND.LOCAL (EType: AES-256-CTS-HMAC-SHA1-96)\nLDAPS TCP 636 : TcpTestSucceeded = True | LDAP Signing = Required [OK]'
                : 'Ticket EType: RC4-HMAC [VULNÉRABLE] · Port 636 LDAPS fermé (LDAP 389 en clair).',
            }),
          },
          {
            cmd: 'Get-ADUser -Filter {ServicePrincipalName -ne "$null"} && Get-LapsADPassword',
            run: () => ({
              ok: adTieringLaps,
              out: adTieringLaps
                ? '[OK] 0 compte utilisateur humain avec SPN (services migrés vers gMSA)\nWindows LAPS: Mot de passe local unique & rotatif actif · Tiering T0/T1/T2 respecté.'
                : '[ALERTE KERBEROASTING] Compte svc_legacy avec SPN + mot de passe admin local partagé sur tous les PC !',
            }),
          },
        ];
    }
  }, [
    labId,
    spfMode,
    spfLookupsFlattened,
    dkimPublished,
    dmarcPolicy,
    dmarcStrictAlign,
    mtaStsEnabled,
    becHeaderFlagged,
    sigmaProcessMatch,
    sigmaParentOffice,
    sigmaAdminExclusion,
    yaraMzHeader,
    yaraStringsAndCondition,
    dfirRamCaptured,
    dfirHostIsolated,
    dfirArtifactsCollected,
    dfirCustodySealed,
    dfirPersistenceRemoved,
    iacRemoteStateLock,
    iacStrictSshCidr,
    iacSecretsExternalized,
    iacPlanApplied,
    iacAnsibleIdempotent,
    iamLeastPrivilege,
    iamMfaCondition,
    iamOidcEnabled,
    iamPublicBlock,
    iamVaultDynamic,
    bgpOspfArea0,
    bgpPrefixFilter,
    bgpRpkiEnabled,
    bgpBfdFast,
    bgpSdwanSla,
    linuxSudoLocked,
    linuxPermsStrict,
    linuxSystemdActive,
    linuxLvmExtended,
    linuxCronBackup,
    winStaticIpName,
    winDnsDhcpReady,
    winSmbEncrypted,
    winIisHttpsWinrm,
    winFirewallBackup,
    adForestPromoted,
    adOuAgdlpStructured,
    adGpoLinked,
    adKerberosLdaps,
    adTieringLaps,
  ]);

  const handleRunCommand = (cmd: string, run: () => { ok: boolean; out: string }) => {
    const res = run();
    if (res.ok) playClick();
    else playError();
    setTerminalLog((prev) => [...prev.slice(-7), { cmd, out: res.out, ok: res.ok }]);
  };

  const handleCopyArtifact = async () => {
    try {
      await navigator.clipboard.writeText(generatedArtifact);
      setCopied(true);
      playClick();
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const handleDownloadArtifact = () => {
    playClick();
    const blob = new Blob([generatedArtifact], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = meta.artifactFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetLab = () => {
    playClick();
    setTerminalLog([]);
    setSpoofTestResult(null);
    setDfirMistakeWarning(null);
    completedAwardedRef.current = false;
    switch (labId) {
      case 'emailsec':
        setSpfMode('softfail');
        setSpfLookupsFlattened(false);
        setDkimPublished(false);
        setDmarcPolicy('none');
        setDmarcStrictAlign(false);
        setMtaStsEnabled(false);
        setBecHeaderFlagged(false);
        break;
      case 'sigmayara':
        setSigmaProcessMatch(true);
        setSigmaParentOffice(false);
        setSigmaAdminExclusion(false);
        setYaraMzHeader(false);
        setYaraStringsAndCondition(false);
        setReplayRunCount(0);
        break;
      case 'dfir':
        setDfirRamCaptured(false);
        setDfirHostIsolated(false);
        setDfirArtifactsCollected(false);
        setDfirCustodySealed(false);
        setDfirPersistenceRemoved(false);
        break;
      case 'iac':
        setIacRemoteStateLock(false);
        setIacStrictSshCidr(false);
        setIacSecretsExternalized(false);
        setIacPlanApplied(false);
        setIacAnsibleIdempotent(false);
        break;
      case 'iamcloud':
        setIamLeastPrivilege(false);
        setIamMfaCondition(false);
        setIamOidcEnabled(false);
        setIamPublicBlock(false);
        setIamVaultDynamic(false);
        break;
      case 'bgprouting':
        setBgpOspfArea0(false);
        setBgpPrefixFilter(false);
        setBgpRpkiEnabled(false);
        setBgpBfdFast(false);
        setBgpSdwanSla(false);
        setHijackSimulated(true);
        break;
      case 'linuxadmin':
        setLinuxSudoLocked(false);
        setLinuxPermsStrict(false);
        setLinuxSystemdActive(false);
        setLinuxLvmExtended(false);
        setLinuxCronBackup(false);
        break;
      case 'winserver':
        setWinStaticIpName(false);
        setWinDnsDhcpReady(false);
        setWinSmbEncrypted(false);
        setWinIisHttpsWinrm(false);
        setWinFirewallBackup(false);
        break;
      case 'admastery':
        setAdForestPromoted(false);
        setAdOuAgdlpStructured(false);
        setAdGpoLinked(false);
        setAdKerberosLdaps(false);
        setAdTieringLaps(false);
        break;
    }
  };

  // --- Telemetry Strip Values ---
  const telemetryCards = useMemo(() => {
    switch (labId) {
      case 'emailsec': {
        const lookups = spfLookupsFlattened ? 4 : 12;
        const verdict =
          dmarcPolicy === 'reject' && dmarcStrictAlign
            ? '550 REJECT'
            : dmarcPolicy === 'quarantine'
              ? 'SPAM / QUAR.'
              : 'INBOX (RISQUE)';
        return [
          { label: 'Lookups SPF', value: `${lookups} / 10`, ok: spfLookupsFlattened },
          { label: 'Clé DKIM', value: dkimPublished ? 'RSA-2048 OK' : 'ABSENTE', ok: dkimPublished },
          { label: 'Verdict Spoofing', value: verdict, ok: dmarcPolicy === 'reject' && dmarcStrictAlign },
          { label: 'Transport TLS', value: mtaStsEnabled ? 'MTA-STS STRICT' : 'OPPORTUNISTE', ok: mtaStsEnabled },
        ];
      }
      case 'sigmayara': {
        const fp = !sigmaParentOffice ? 38 : !sigmaAdminExclusion ? 14 : 0;
        const tp = sigmaProcessMatch ? 3 : 0;
        const precision = tp + fp > 0 ? Math.round((tp / (tp + fp)) * 100) : 0;
        return [
          { label: 'Vrais Positifs', value: `${tp} / 3`, ok: tp === 3 },
          { label: 'Faux Positifs', value: `${fp} alertes`, ok: fp === 0 },
          { label: 'Précision SOC', value: `${precision} %`, ok: precision === 100 },
          { label: 'Signature YARA', value: yaraMzHeader && yaraStringsAndCondition ? 'PE MZ + IOC' : 'INCOMPLÈTE', ok: yaraMzHeader && yaraStringsAndCondition },
        ];
      }
      case 'dfir':
        return [
          { label: 'Intégrité RAM', value: dfirRamCaptured ? 'CAPTURÉE (8 Go)' : 'VOLATILE EN COURS', ok: dfirRamCaptured },
          { label: 'Confinement EDR', value: dfirHostIsolated ? 'ISOLÉ (C2 BLOQUÉ)' : 'EXPOSÉ LAN', ok: dfirHostIsolated },
          { label: 'Chaîne de Preuve', value: dfirCustodySealed ? 'SCELLÉE SHA-256' : 'NON SCELLÉE', ok: dfirCustodySealed },
          { label: 'Persistance', value: dfirPersistenceRemoved ? 'ÉRADIQUÉE' : 'TÂCHE ACTIVE', ok: dfirPersistenceRemoved },
        ];
      case 'iac':
        return [
          { label: 'State Terraform', value: iacRemoteStateLock ? 'REMOTE + LOCK' : 'LOCAL RISQUÉ', ok: iacRemoteStateLock },
          { label: 'Exposition SSH', value: iacStrictSshCidr ? 'BASTION /32' : '0.0.0.0/0', ok: iacStrictSshCidr },
          { label: 'Secrets Code', value: iacSecretsExternalized ? '0 SECRET DUR' : 'FUITE DÉTECTÉE', ok: iacSecretsExternalized },
          { label: 'Idempotence', value: iacAnsibleIdempotent ? 'changed=0' : 'NON VALIDÉE', ok: iacAnsibleIdempotent },
        ];
      case 'iamcloud': {
        const score =
          100 -
          (iamLeastPrivilege ? 25 : 0) -
          (iamMfaCondition ? 18 : 0) -
          (iamOidcEnabled ? 18 : 0) -
          (iamPublicBlock ? 16 : 0) -
          (iamVaultDynamic ? 15 : 0);
        return [
          { label: 'Rayon d’Impact', value: `${score} / 100`, ok: score <= 10 },
          { label: 'Droits IAM', value: iamLeastPrivilege ? 'MOINDRE PRIV.' : 'WILDCARD *:*', ok: iamLeastPrivilege },
          { label: 'Auth CI/CD', value: iamOidcEnabled ? 'OIDC 15 MIN' : 'CLÉ STATIQUE', ok: iamOidcEnabled },
          { label: 'Secrets BDD', value: iamVaultDynamic ? 'VAULT TTL 1H' : 'STATIQUE', ok: iamVaultDynamic },
        ];
      }
      case 'bgprouting':
        return [
          { label: 'Backbone OSPF', value: bgpOspfArea0 ? 'AREA 0 · FULL' : 'DOWN', ok: bgpOspfArea0 },
          { label: 'Hijack AS 66600', value: bgpRpkiEnabled ? 'BLOQUÉ (RPKI)' : 'ACTIF (DANGER)', ok: bgpRpkiEnabled },
          { label: 'Détection Lien', value: bgpBfdFast ? 'BFD 300 ms' : 'BGP 90 000 ms', ok: bgpBfdFast },
          { label: 'Latence App', value: bgpSdwanSla ? '14 ms (DIA)' : '185 ms (MPLS)', ok: bgpSdwanSla },
        ];
      case 'linuxadmin':
        return [
          { label: 'Accès SSH / Sudo', value: linuxSudoLocked ? 'SUDO · ROOT OFF' : 'ROOT OUVERT', ok: linuxSudoLocked },
          { label: 'Droits /srv/app', value: linuxPermsStrict ? '750 STRICT' : '777 EXPOSÉ', ok: linuxPermsStrict },
          { label: 'Service systemd', value: linuxSystemdActive ? 'ACTIVE (RUNNING)' : 'FAILED', ok: linuxSystemdActive },
          { label: 'Volume /var/log', value: linuxLvmExtended ? '42 % (30 Go LVM)' : '98 % SATURÉ', ok: linuxLvmExtended },
        ];
      case 'winserver':
        return [
          { label: 'Identité & IP', value: winStaticIpName ? 'SRV-WIN-01 FIXE' : 'WIN-RAND DHCP', ok: winStaticIpName },
          { label: 'Rôles DNS / DHCP', value: winDnsDhcpReady ? 'ACTIFS (150 IP)' : 'NON INSTALLÉS', ok: winDnsDhcpReady },
          { label: 'Partage SMB3', value: winSmbEncrypted ? 'CHIFFRÉ + NTFS' : 'SMBv1 / CLAIR', ok: winSmbEncrypted },
          { label: 'IIS & Pare-feu', value: winIisHttpsWinrm && winFirewallBackup ? 'HTTPS 443 + WFW' : 'HTTP 80 / OFF', ok: winIisHttpsWinrm && winFirewallBackup },
        ];
      case 'admastery':
        return [
          { label: 'Domaine AD DS', value: adForestPromoted ? 'cyberland.local' : 'WORKGROUP', ok: adForestPromoted },
          { label: 'OU & GPO (LSDOU)', value: adOuAgdlpStructured && adGpoLinked ? '5 OU · 3 GPO OK' : 'NON STRUCTURÉ', ok: adOuAgdlpStructured && adGpoLinked },
          { label: 'Kerberos & LDAP', value: adKerberosLdaps ? 'AES-256 + LDAPS' : 'RC4 + LDAP 389', ok: adKerberosLdaps },
          { label: 'Défense Tiering', value: adTieringLaps ? 'T0/T1/T2 + LAPS' : 'VULNÉRABLE PTH', ok: adTieringLaps },
        ];
    }
  }, [
    labId,
    spfLookupsFlattened,
    dkimPublished,
    dmarcPolicy,
    dmarcStrictAlign,
    mtaStsEnabled,
    sigmaProcessMatch,
    sigmaParentOffice,
    sigmaAdminExclusion,
    yaraMzHeader,
    yaraStringsAndCondition,
    dfirRamCaptured,
    dfirHostIsolated,
    dfirCustodySealed,
    dfirPersistenceRemoved,
    iacRemoteStateLock,
    iacStrictSshCidr,
    iacSecretsExternalized,
    iacAnsibleIdempotent,
    iamLeastPrivilege,
    iamMfaCondition,
    iamOidcEnabled,
    iamPublicBlock,
    iamVaultDynamic,
    bgpOspfArea0,
    bgpRpkiEnabled,
    bgpBfdFast,
    bgpSdwanSla,
    linuxSudoLocked,
    linuxPermsStrict,
    linuxSystemdActive,
    linuxLvmExtended,
    winStaticIpName,
    winDnsDhcpReady,
    winSmbEncrypted,
    winIisHttpsWinrm,
    winFirewallBackup,
    adForestPromoted,
    adOuAgdlpStructured,
    adGpoLinked,
    adKerberosLdaps,
    adTieringLaps,
  ]);

  // --- Interactive Architecture Diagram SVG per Lab ---
  const renderArchitectureDiagram = () => {
    switch (labId) {
      case 'emailsec': {
        const spoofBlocked = dmarcPolicy === 'reject' && dmarcStrictAlign;
        return (
          <svg viewBox="0 0 640 170" className="w-full h-auto" role="img" aria-label="Flux SMTP SPF DKIM DMARC">
            <rect x="14" y="42" width="138" height="82" rx="10" className="fill-rose-950/90 stroke-rose-400" strokeWidth="1.5" />
            <text x="83" y="68" textAnchor="middle" className="fill-rose-200 text-[11px] font-mono font-bold">USURPATEUR BEC</text>
            <text x="83" y="86" textAnchor="middle" className="fill-slate-300 text-[10px] font-mono">From: pdg@cyberland.fr</text>
            <text x="83" y="102" textAnchor="middle" className="fill-rose-300 text-[9px] font-mono">IP: 185.220.101.44</text>

            <line x1="152" y1="83" x2="236" y2="83" stroke={spoofBlocked ? '#f43f5e' : '#f59e0b'} strokeWidth="2.5" strokeDasharray="6 4" />

            <rect x="236" y="24" width="172" height="118" rx="10" className="fill-slate-900 stroke-cyan-400" strokeWidth="1.5" />
            <text x="322" y="48" textAnchor="middle" className="fill-cyan-300 text-[11px] font-mono font-bold">PASSERELLE MX + DNS</text>
            <text x="322" y="70" textAnchor="middle" className={`${spfMode === 'hardfail' && spfLookupsFlattened ? 'fill-emerald-300' : 'fill-amber-300'} text-[10px] font-mono`}>
              SPF: {spfMode === 'hardfail' && spfLookupsFlattened ? 'STRICT -all (4/10)' : 'FAIBLE / PERMERROR'}
            </text>
            <text x="322" y="90" textAnchor="middle" className={`${dkimPublished ? 'fill-emerald-300' : 'fill-rose-300'} text-[10px] font-mono`}>
              DKIM: {dkimPublished ? 'RSA-2048 SIGNÉ' : 'NON PUBLIÉ'}
            </text>
            <text x="322" y="110" textAnchor="middle" className={`${spoofBlocked ? 'fill-emerald-300' : 'fill-amber-300'} text-[10px] font-mono`}>
              DMARC: p={dmarcPolicy} ({dmarcStrictAlign ? 'strict' : 'relaxed'})
            </text>
            <text x="322" y="128" textAnchor="middle" className={`${mtaStsEnabled ? 'fill-emerald-300' : 'fill-slate-400'} text-[9px] font-mono`}>
              MTA-STS: {mtaStsEnabled ? 'ENFORCE TLS' : 'INACTIF'}
            </text>

            <line x1="408" y1="83" x2="486" y2="83" stroke={spoofBlocked ? '#10b981' : '#f43f5e'} strokeWidth="2.5" strokeDasharray={spoofBlocked ? '3 5' : '0'} />

            <rect
              x="486"
              y="42"
              width="140"
              height="82"
              rx="10"
              className={spoofBlocked ? 'fill-emerald-950/90 stroke-emerald-400' : 'fill-amber-950/90 stroke-amber-400'}
              strokeWidth="1.5"
            />
            <text x="556" y="70" textAnchor="middle" className="fill-white text-[11px] font-mono font-bold">
              {spoofBlocked ? '550 REJECT' : 'BOÎTE COMPTA'}
            </text>
            <text x="556" y="90" textAnchor="middle" className={spoofBlocked ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-amber-200 text-[10px] font-mono'}>
              {spoofBlocked ? 'Usurpation bloquée' : 'Mail frauduleux reçu !'}
            </text>
            <text x="556" y="108" textAnchor="middle" className="fill-slate-300 text-[9px] font-mono">
              {becHeaderFlagged ? 'BEC signalé au SOC' : 'En-tête non audité'}
            </text>
          </svg>
        );
      }
      case 'sigmayara': {
        const cleanDetection = sigmaProcessMatch && sigmaParentOffice && sigmaAdminExclusion;
        return (
          <svg viewBox="0 0 640 170" className="w-full h-auto" role="img" aria-label="Pipeline Threat Hunting Sigma et YARA">
            <rect x="14" y="34" width="150" height="98" rx="10" className="fill-slate-900 stroke-sky-400" strokeWidth="1.5" />
            <text x="89" y="58" textAnchor="middle" className="fill-sky-300 text-[11px] font-mono font-bold">FLUX SYSMON / EDR</text>
            <text x="89" y="78" textAnchor="middle" className="fill-slate-300 text-[10px] font-mono">1 200 événements / 24h</text>
            <text x="89" y="96" textAnchor="middle" className="fill-rose-300 text-[10px] font-mono">3 attaques WINWORD-&gt;PS</text>
            <text x="89" y="114" textAnchor="middle" className="fill-slate-400 text-[9px] font-mono">14 scripts SCCM légitimes</text>

            <line x1="164" y1="83" x2="232" y2="83" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="6 4" />

            <rect x="232" y="24" width="176" height="118" rx="10" className="fill-slate-900 stroke-cyan-400" strokeWidth="1.5" />
            <text x="320" y="48" textAnchor="middle" className="fill-cyan-300 text-[11px] font-mono font-bold">MOTEUR SIGMA + YARA</text>
            <text x="320" y="70" textAnchor="middle" className={`${sigmaParentOffice ? 'fill-emerald-300' : 'fill-amber-300'} text-[10px] font-mono`}>
              Parent Office: {sigmaParentOffice ? 'CORRÉLÉ' : 'NON FILTRÉ'}
            </text>
            <text x="320" y="90" textAnchor="middle" className={`${sigmaAdminExclusion ? 'fill-emerald-300' : 'fill-amber-300'} text-[10px] font-mono`}>
              Filtre SCCM: {sigmaAdminExclusion ? 'EXCLU (0 FP)' : 'BRUIT ADMIN'}
            </text>
            <text x="320" y="110" textAnchor="middle" className={`${yaraMzHeader && yaraStringsAndCondition ? 'fill-emerald-300' : 'fill-rose-300'} text-[10px] font-mono`}>
              YARA: {yaraMzHeader && yaraStringsAndCondition ? '0x5A4D + IOC' : 'INCOMPLÈTE'}
            </text>

            <line x1="408" y1="83" x2="476" y2="83" stroke={cleanDetection ? '#10b981' : '#f59e0b'} strokeWidth="2.5" />

            <rect
              x="476"
              y="34"
              width="150"
              height="98"
              rx="10"
              className={cleanDetection && yaraMzHeader && yaraStringsAndCondition ? 'fill-emerald-950/90 stroke-emerald-400' : 'fill-amber-950/90 stroke-amber-400'}
              strokeWidth="1.5"
            />
            <text x="551" y="64" textAnchor="middle" className="fill-white text-[11px] font-mono font-bold">ALERTES SOC N2</text>
            <text x="551" y="86" textAnchor="middle" className={cleanDetection ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-amber-200 text-[10px] font-mono'}>
              {cleanDetection ? '3/3 TP · 0 Faux Positif' : 'Alerte bruitée (FP > 0)'}
            </text>
            <text x="551" y="106" textAnchor="middle" className="fill-slate-300 text-[9px] font-mono">
              {replayRunCount > 0 ? `Replay validé (${replayRunCount}x)` : 'Lancez le Replay'}
            </text>
          </svg>
        );
      }
      case 'dfir':
        return (
          <svg viewBox="0 0 640 170" className="w-full h-auto" role="img" aria-label="Chaîne de réponse DFIR RFC 3227">
            {[
              { x: 14, title: '1. RAM', sub: dfirRamCaptured ? 'CAPTURÉE' : 'VOLATILE', ok: dfirRamCaptured },
              { x: 138, title: '2. EDR', sub: dfirHostIsolated ? 'ISOLÉ' : 'EXPOSÉ', ok: dfirHostIsolated },
              { x: 262, title: '3. EVTX/MFT', sub: dfirArtifactsCollected ? 'COLLECTÉS' : 'EN ATTENTE', ok: dfirArtifactsCollected },
              { x: 386, title: '4. SHA-256', sub: dfirCustodySealed ? 'SCELLÉE' : 'NON SIGNÉE', ok: dfirCustodySealed },
              { x: 510, title: '5. CLEAN', sub: dfirPersistenceRemoved ? 'ÉRADIQUÉ' : 'PERSISTANT', ok: dfirPersistenceRemoved },
            ].map((step, i) => (
              <g key={step.title}>
                {i > 0 && (
                  <line
                    x1={step.x - 14}
                    y1="85"
                    x2={step.x}
                    y2="85"
                    stroke={step.ok ? '#10b981' : '#64748b'}
                    strokeWidth="2.5"
                  />
                )}
                <rect
                  x={step.x}
                  y="42"
                  width="110"
                  height="86"
                  rx="10"
                  className={step.ok ? 'fill-emerald-950/90 stroke-emerald-400' : 'fill-slate-900 stroke-slate-600'}
                  strokeWidth="1.5"
                />
                <text x={step.x + 55} y="74" textAnchor="middle" className="fill-white text-[11px] font-mono font-bold">
                  {step.title}
                </text>
                <text
                  x={step.x + 55}
                  y="98"
                  textAnchor="middle"
                  className={`${step.ok ? 'fill-emerald-300' : 'fill-amber-300'} text-[10px] font-mono`}
                >
                  {step.sub}
                </text>
              </g>
            ))}
          </svg>
        );
      case 'iac':
        return (
          <svg viewBox="0 0 640 170" className="w-full h-auto" role="img" aria-label="Pipeline Terraform et Ansible">
            <rect x="16" y="38" width="145" height="92" rx="10" className="fill-slate-900 stroke-sky-400" strokeWidth="1.5" />
            <text x="88" y="64" textAnchor="middle" className="fill-sky-300 text-[11px] font-mono font-bold">CODE GIT (HCL)</text>
            <text x="88" y="84" textAnchor="middle" className={`${iacSecretsExternalized ? 'fill-emerald-300' : 'fill-rose-300'} text-[10px] font-mono`}>
              {iacSecretsExternalized ? '0 secret en dur' : 'Secret en clair !'}
            </text>
            <text x="88" y="104" textAnchor="middle" className={`${iacStrictSshCidr ? 'fill-emerald-300' : 'fill-rose-300'} text-[10px] font-mono`}>
              SSH: {iacStrictSshCidr ? '10.50.0.10/32' : '0.0.0.0/0 !'}
            </text>

            <line x1="161" y1="84" x2="232" y2="84" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5 4" />

            <rect x="232" y="38" width="176" height="92" rx="10" className="fill-slate-900 stroke-cyan-400" strokeWidth="1.5" />
            <text x="320" y="64" textAnchor="middle" className="fill-cyan-300 text-[11px] font-mono font-bold">TERRAFORM ENGINE</text>
            <text x="320" y="84" textAnchor="middle" className={`${iacRemoteStateLock ? 'fill-emerald-300' : 'fill-amber-300'} text-[10px] font-mono`}>
              State: {iacRemoteStateLock ? 'S3 + LOCK' : 'LOCAL'}
            </text>
            <text x="320" y="104" textAnchor="middle" className={`${iacPlanApplied ? 'fill-emerald-300' : 'fill-slate-400'} text-[10px] font-mono`}>
              {iacPlanApplied ? 'APPLY OK (4 ress.)' : 'En attente Apply'}
            </text>

            <line x1="408" y1="84" x2="478" y2="84" stroke={iacPlanApplied ? '#10b981' : '#64748b'} strokeWidth="2.5" />

            <rect
              x="478"
              y="38"
              width="146"
              height="92"
              rx="10"
              className={iacAnsibleIdempotent ? 'fill-emerald-950/90 stroke-emerald-400' : 'fill-slate-900 stroke-slate-600'}
              strokeWidth="1.5"
            />
            <text x="551" y="64" textAnchor="middle" className="fill-white text-[11px] font-mono font-bold">ANSIBLE CONFIG</text>
            <text x="551" y="86" textAnchor="middle" className={iacAnsibleIdempotent ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-amber-300 text-[10px] font-mono'}>
              {iacAnsibleIdempotent ? 'Idempotent (changed=0)' : 'Drift non vérifié'}
            </text>
            <text x="551" y="106" textAnchor="middle" className="fill-slate-300 text-[9px] font-mono">Nginx · UFW · SSH</text>
          </svg>
        );
      case 'iamcloud':
        return (
          <svg viewBox="0 0 640 170" className="w-full h-auto" role="img" aria-label="Architecture Zero Trust IAM Cloud et Vault">
            <rect x="16" y="34" width="150" height="100" rx="10" className="fill-slate-900 stroke-sky-400" strokeWidth="1.5" />
            <text x="91" y="60" textAnchor="middle" className="fill-sky-300 text-[11px] font-mono font-bold">IDENTITÉS &amp; CI/CD</text>
            <text x="91" y="82" textAnchor="middle" className={`${iamOidcEnabled ? 'fill-emerald-300' : 'fill-rose-300'} text-[10px] font-mono`}>
              CI: {iamOidcEnabled ? 'OIDC 15 min' : 'Clé statique !'}
            </text>
            <text x="91" y="102" textAnchor="middle" className={`${iamMfaCondition ? 'fill-emerald-300' : 'fill-amber-300'} text-[10px] font-mono`}>
              MFA: {iamMfaCondition ? 'EXIGÉ' : 'ABSENT'}
            </text>

            <line x1="166" y1="84" x2="236" y2="84" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="6 4" />

            <rect x="236" y="34" width="168" height="100" rx="10" className="fill-slate-900 stroke-cyan-400" strokeWidth="1.5" />
            <text x="320" y="60" textAnchor="middle" className="fill-cyan-300 text-[11px] font-mono font-bold">POLITIQUE IAM + VAULT</text>
            <text x="320" y="82" textAnchor="middle" className={`${iamLeastPrivilege ? 'fill-emerald-300' : 'fill-rose-300'} text-[10px] font-mono`}>
              {iamLeastPrivilege ? 's3:GetObject ciblé' : 'Action:* Resource:* !'}
            </text>
            <text x="320" y="102" textAnchor="middle" className={`${iamVaultDynamic ? 'fill-emerald-300' : 'fill-amber-300'} text-[10px] font-mono`}>
              Vault: {iamVaultDynamic ? 'TTL 1h auto' : 'Mot de passe fixe'}
            </text>

            <line x1="404" y1="84" x2="474" y2="84" stroke={iamPublicBlock && iamLeastPrivilege ? '#10b981' : '#f43f5e'} strokeWidth="2.5" />

            <rect
              x="474"
              y="34"
              width="150"
              height="100"
              rx="10"
              className={iamPublicBlock && iamLeastPrivilege ? 'fill-emerald-950/90 stroke-emerald-400' : 'fill-rose-950/90 stroke-rose-400'}
              strokeWidth="1.5"
            />
            <text x="549" y="62" textAnchor="middle" className="fill-white text-[11px] font-mono font-bold">DONNÉES PROD</text>
            <text x="549" y="84" textAnchor="middle" className={iamPublicBlock ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-rose-300 text-[10px] font-mono'}>
              Bucket: {iamPublicBlock ? 'PRIVÉ BLOQUÉ' : 'ACCÈS PUBLIC !'}
            </text>
            <text x="549" y="104" textAnchor="middle" className="fill-slate-300 text-[9px] font-mono">
              S3 + Base PostgreSQL
            </text>
          </svg>
        );
      case 'bgprouting':
        return (
          <svg viewBox="0 0 640 175" className="w-full h-auto" role="img" aria-label="Topologie OSPF, BGP, RPKI et SD-WAN">
            {/* Internal OSPF Core */}
            <rect x="14" y="42" width="144" height="92" rx="10" className="fill-slate-900 stroke-sky-400" strokeWidth="1.5" />
            <text x="86" y="66" textAnchor="middle" className="fill-sky-300 text-[11px] font-mono font-bold">AS 65100 · CORE</text>
            <text x="86" y="86" textAnchor="middle" className={`${bgpOspfArea0 ? 'fill-emerald-300' : 'fill-amber-300'} text-[10px] font-mono`}>
              OSPF Area 0: {bgpOspfArea0 ? 'FULL' : 'DOWN'}
            </text>
            <text x="86" y="104" textAnchor="middle" className={`${bgpPrefixFilter ? 'fill-emerald-300' : 'fill-rose-300'} text-[10px] font-mono`}>
              Filtre BGP: {bgpPrefixFilter ? 'STRICT /24' : 'LEAK !'}
            </text>
            <text x="86" y="120" textAnchor="middle" className="fill-slate-300 text-[9px] font-mono">
              BFD: {bgpBfdFast ? '300 ms' : '90 s'}
            </text>

            {/* Dual WAN Links (MPLS degraded vs DIA Fiber) */}
            <line x1="158" y1="64" x2="292" y2="48" stroke={bgpSdwanSla ? '#64748b' : '#f43f5e'} strokeWidth={bgpSdwanSla ? '1.5' : '3'} strokeDasharray="5 4" />
            <text x="225" y="44" textAnchor="middle" className="fill-rose-300 text-[9px] font-mono">MPLS 185ms (4.2%)</text>

            <line x1="158" y1="108" x2="292" y2="122" stroke={bgpSdwanSla ? '#10b981' : '#475569'} strokeWidth={bgpSdwanSla ? '3' : '1.5'} />
            <text x="225" y="136" textAnchor="middle" className={bgpSdwanSla ? 'fill-emerald-300 text-[9px] font-mono font-bold' : 'fill-slate-400 text-[9px] font-mono'}>
              DIA Fiber 14ms {bgpSdwanSla ? '(ACTIF SLA)' : '(VEILLE)'}
            </text>

            {/* Internet Transit + RPKI */}
            <rect x="292" y="24" width="152" height="122" rx="10" className="fill-slate-900 stroke-cyan-400" strokeWidth="1.5" />
            <text x="368" y="48" textAnchor="middle" className="fill-cyan-300 text-[11px] font-mono font-bold">TRANSIT AS 3356</text>
            <text x="368" y="72" textAnchor="middle" className="fill-slate-300 text-[10px] font-mono">203.0.113.0/24</text>
            <text x="368" y="96" textAnchor="middle" className={`${bgpRpkiEnabled ? 'fill-emerald-300' : 'fill-rose-300'} text-[10px] font-mono font-bold`}>
              RPKI: {bgpRpkiEnabled ? 'ROA VALIDE' : 'INACTIF'}
            </text>
            <text x="368" y="118" textAnchor="middle" className="fill-slate-400 text-[9px] font-mono">
              SD-WAN: {bgpSdwanSla ? 'BASCULE OK' : 'STATIQUE'}
            </text>

            {/* Rogue AS 66600 Hijack */}
            <line
              x1="444"
              y1="85"
              x2="494"
              y2="85"
              stroke={bgpRpkiEnabled ? '#10b981' : '#f43f5e'}
              strokeWidth="2.5"
              strokeDasharray={bgpRpkiEnabled ? '2 6' : '0'}
            />
            <rect
              x="494"
              y="42"
              width="132"
              height="92"
              rx="10"
              className={bgpRpkiEnabled ? 'fill-slate-900 stroke-emerald-400' : 'fill-rose-950/90 stroke-rose-400'}
              strokeWidth="1.5"
            />
            <text x="560" y="68" textAnchor="middle" className="fill-rose-300 text-[11px] font-mono font-bold">AS 66600 PIRATE</text>
            <text x="560" y="88" textAnchor="middle" className="fill-slate-300 text-[9px] font-mono">Annonce 203.0.113.0/24</text>
            <text x="560" y="110" textAnchor="middle" className={bgpRpkiEnabled ? 'fill-emerald-300 text-[10px] font-mono font-bold' : 'fill-rose-300 text-[10px] font-mono font-bold'}>
              {hijackSimulated ? (bgpRpkiEnabled ? 'DROP RPKI INVALID' : 'HIJACK ACTIF !') : 'EN VEILLE'}
            </text>
          </svg>
        );
      case 'linuxadmin':
        return (
          <svg viewBox="0 0 640 170" className="w-full h-auto" role="img" aria-label="Architecture Administration Linux">
            <rect x="14" y="34" width="144" height="100" rx="10" className={linuxSudoLocked ? 'fill-emerald-950/90 stroke-emerald-400' : 'fill-rose-950/90 stroke-rose-400'} strokeWidth="1.5" />
            <text x="86" y="60" textAnchor="middle" className="fill-white text-[11px] font-mono font-bold">ACCÈS &amp; SUDO</text>
            <text x="86" y="84" textAnchor="middle" className={linuxSudoLocked ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-rose-300 text-[10px] font-mono'}>
              {linuxSudoLocked ? 'admin_ops (sudo)' : 'root SSH ouvert'}
            </text>
            <text x="86" y="106" textAnchor="middle" className="fill-slate-300 text-[9px] font-mono">
              {linuxPermsStrict ? 'SSH key 600 · /srv 750' : '/srv/app 777 !'}
            </text>

            <line x1="158" y1="84" x2="226" y2="84" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5 4" />

            <rect x="226" y="34" width="186" height="100" rx="10" className="fill-slate-900 stroke-cyan-400" strokeWidth="1.5" />
            <text x="319" y="60" textAnchor="middle" className="fill-cyan-300 text-[11px] font-mono font-bold">SYSTEMD &amp; JOURNALD</text>
            <text x="319" y="84" textAnchor="middle" className={linuxSystemdActive ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-amber-300 text-[10px] font-mono'}>
              app-api: {linuxSystemdActive ? 'ACTIVE (RUNNING)' : 'FAILED'}
            </text>
            <text x="319" y="106" textAnchor="middle" className={linuxCronBackup ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-slate-400 text-[9px] font-mono'}>
              Cron Backup: {linuxCronBackup ? '02:30 PLANIFIÉ' : 'ABSENT'}
            </text>

            <line x1="412" y1="84" x2="480" y2="84" stroke={linuxLvmExtended ? '#10b981' : '#f43f5e'} strokeWidth="2.5" />

            <rect x="480" y="34" width="146" height="100" rx="10" className={linuxLvmExtended ? 'fill-emerald-950/90 stroke-emerald-400' : 'fill-amber-950/90 stroke-amber-400'} strokeWidth="1.5" />
            <text x="553" y="60" textAnchor="middle" className="fill-white text-[11px] font-mono font-bold">STOCKAGE LVM</text>
            <text x="553" y="84" textAnchor="middle" className={linuxLvmExtended ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-amber-200 text-[10px] font-mono'}>
              {linuxLvmExtended ? '/var/log 42% (30G)' : '/var/log 98% PLEIN'}
            </text>
            <text x="553" y="106" textAnchor="middle" className="fill-slate-300 text-[9px] font-mono">
              vg_data / lv_logs
            </text>
          </svg>
        );
      case 'winserver':
        return (
          <svg viewBox="0 0 640 170" className="w-full h-auto" role="img" aria-label="Architecture Windows Server">
            <rect x="14" y="34" width="146" height="100" rx="10" className={winDnsDhcpReady ? 'fill-emerald-950/90 stroke-emerald-400' : 'fill-slate-900 stroke-sky-400'} strokeWidth="1.5" />
            <text x="87" y="60" textAnchor="middle" className="fill-sky-300 text-[11px] font-mono font-bold">DNS &amp; DHCP LAN</text>
            <text x="87" y="84" textAnchor="middle" className={winStaticIpName ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-amber-300 text-[10px] font-mono'}>
              {winStaticIpName ? 'SRV-WIN-01 · .10' : 'WIN-RAND (DHCP)'}
            </text>
            <text x="87" y="106" textAnchor="middle" className={winDnsDhcpReady ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-slate-400 text-[9px] font-mono'}>
              {winDnsDhcpReady ? 'cyberland.local OK' : 'Rôles inactifs'}
            </text>

            <line x1="160" y1="84" x2="230" y2="84" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5 4" />

            <rect x="230" y="34" width="180" height="100" rx="10" className="fill-slate-900 stroke-cyan-400" strokeWidth="1.5" />
            <text x="320" y="60" textAnchor="middle" className="fill-cyan-300 text-[11px] font-mono font-bold">SMB3 &amp; IIS WEB</text>
            <text x="320" y="84" textAnchor="middle" className={winSmbEncrypted ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-rose-300 text-[10px] font-mono'}>
              SMB: {winSmbEncrypted ? 'v3 CHIFFRÉ + NTFS' : 'SMBv1 / EVERYONE'}
            </text>
            <text x="320" y="106" textAnchor="middle" className={winIisHttpsWinrm ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-amber-300 text-[10px] font-mono'}>
              IIS: {winIisHttpsWinrm ? 'HTTPS 443 + WinRM' : 'HTTP 80 EXPOSÉ'}
            </text>

            <line x1="410" y1="84" x2="478" y2="84" stroke={winFirewallBackup ? '#10b981' : '#f43f5e'} strokeWidth="2.5" />

            <rect x="478" y="34" width="148" height="100" rx="10" className={winFirewallBackup ? 'fill-emerald-950/90 stroke-emerald-400' : 'fill-rose-950/90 stroke-rose-400'} strokeWidth="1.5" />
            <text x="552" y="60" textAnchor="middle" className="fill-white text-[11px] font-mono font-bold">DEFENDER &amp; BACKUP</text>
            <text x="552" y="84" textAnchor="middle" className={winFirewallBackup ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-rose-300 text-[10px] font-mono'}>
              {winFirewallBackup ? '3 Profils WFW ON' : 'Pare-feu COUPÉ'}
            </text>
            <text x="552" y="106" textAnchor="middle" className="fill-slate-300 text-[9px] font-mono">
              {winFirewallBackup ? 'System State prêt' : '0 sauvegarde'}
            </text>
          </svg>
        );
      case 'admastery':
        return (
          <svg viewBox="0 0 640 170" className="w-full h-auto" role="img" aria-label="Architecture Active Directory AD DS">
            <rect x="14" y="34" width="146" height="100" rx="10" className={adTieringLaps ? 'fill-emerald-950/90 stroke-emerald-400' : 'fill-slate-900 stroke-sky-400'} strokeWidth="1.5" />
            <text x="87" y="60" textAnchor="middle" className="fill-sky-300 text-[11px] font-mono font-bold">POSTES TIER 2</text>
            <text x="87" y="84" textAnchor="middle" className={adGpoLinked ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-amber-300 text-[10px] font-mono'}>
              GPO: {adGpoLinked ? 'LSDOU ACTIVES' : 'NON LIÉES'}
            </text>
            <text x="87" y="106" textAnchor="middle" className={adTieringLaps ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-rose-300 text-[10px] font-mono'}>
              LAPS: {adTieringLaps ? 'MDP UNIQUE OK' : 'MDP PARTAGÉ !'}
            </text>

            <line x1="160" y1="84" x2="228" y2="84" stroke={adKerberosLdaps ? '#10b981' : '#f59e0b'} strokeWidth="2.5" strokeDasharray="5 4" />

            <rect x="228" y="26" width="184" height="116" rx="10" className={adForestPromoted ? 'fill-slate-900 stroke-cyan-400' : 'fill-rose-950/80 stroke-rose-400'} strokeWidth="1.5" />
            <text x="320" y="50" textAnchor="middle" className="fill-cyan-300 text-[11px] font-mono font-bold">DC01 · AD DS (TIER 0)</text>
            <text x="320" y="74" textAnchor="middle" className={adForestPromoted ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-rose-300 text-[10px] font-mono'}>
              {adForestPromoted ? 'cyberland.local + Corbeille' : 'WORKGROUP (Non promu)'}
            </text>
            <text x="320" y="96" textAnchor="middle" className={adKerberosLdaps ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-amber-300 text-[10px] font-mono'}>
              {adKerberosLdaps ? 'Kerberos AES-256 · LDAPS 636' : 'RC4 + LDAP 389 clair'}
            </text>
            <text x="320" y="118" textAnchor="middle" className="fill-slate-300 text-[9px] font-mono">
              KDC 88 · DNS 53 · SYSVOL
            </text>

            <line x1="412" y1="84" x2="478" y2="84" stroke={adOuAgdlpStructured ? '#10b981' : '#64748b'} strokeWidth="2.5" />

            <rect x="478" y="34" width="148" height="100" rx="10" className={adOuAgdlpStructured && adTieringLaps ? 'fill-emerald-950/90 stroke-emerald-400' : 'fill-slate-900 stroke-slate-600'} strokeWidth="1.5" />
            <text x="552" y="60" textAnchor="middle" className="fill-white text-[11px] font-mono font-bold">OU &amp; TIERING</text>
            <text x="552" y="84" textAnchor="middle" className={adOuAgdlpStructured ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-amber-300 text-[10px] font-mono'}>
              {adOuAgdlpStructured ? '5 OU · AGDLP OK' : 'Users par défaut'}
            </text>
            <text x="552" y="106" textAnchor="middle" className={adTieringLaps ? 'fill-emerald-300 text-[10px] font-mono' : 'fill-rose-300 text-[10px] font-mono'}>
              {adTieringLaps ? 'T0/T1/T2 + gMSA' : 'Kerberoasting !'}
            </text>
          </svg>
        );
    }
  };

  // --- Interactive Controls Panel per Lab ---
  const renderControls = () => {
    switch (labId) {
      case 'emailsec':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Politique SPF &amp; Optimisation des requêtes DNS
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'none', label: '?all (Neutre)' },
                    { id: 'softfail', label: '~all (SoftFail)' },
                    { id: 'hardfail', label: '-all (HardFail strict)' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setSpfMode(opt.id);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                      spfMode === opt.id
                        ? 'bg-sky-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-sky-600 dark:border-cyan-400'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSpfLookupsFlattened((v) => !v);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                  spfLookupsFlattened
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Aplatir les include SPF (12 → 4 lookups, corrige PermError)</span>
                <span className="font-mono">{spfLookupsFlattened ? 'ACTIF' : '12 LOOKUPS'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Signature DKIM, Politique DMARC &amp; MTA-STS
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setDkimPublished((v) => !v);
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                    dkimPublished
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Clé DKIM RSA-2048 (s2026)</span>
                  <span className="font-mono">{dkimPublished ? 'PUBLIÉE' : 'OFF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setMtaStsEnabled((v) => !v);
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                    mtaStsEnabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>MTA-STS (STARTTLS strict)</span>
                  <span className="font-mono">{mtaStsEnabled ? 'ENFORCE' : 'OFF'}</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['none', 'quarantine', 'reject'] as const).map((pol) => (
                  <button
                    key={pol}
                    type="button"
                    onClick={() => {
                      playClick();
                      setDmarcPolicy(pol);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                      dmarcPolicy === pol
                        ? 'bg-sky-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-sky-600 dark:border-cyan-400'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    DMARC p={pol}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setDmarcStrictAlign((v) => !v);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                    dmarcStrictAlign
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Alignement strict (aspf=s; adkim=s) : {dmarcStrictAlign ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-amber-300/70 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 space-y-2.5">
              <div className="text-xs font-bold text-amber-950 dark:text-amber-200">
                3. En-tête SMTP suspect intercepté (Fraude au Président)
              </div>
              <pre className="p-2.5 rounded-lg bg-slate-950 text-amber-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`From: "Direction Générale" <pdg@cyberland.fr>
Return-Path: <bounce@promo-evil.xyz>
Reply-To: urgent-virement@gmail.com
Received: from unknown-vps.ru (185.220.101.44) by mx-in.cyberland.fr`}
              </pre>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playSuccess();
                    setBecHeaderFlagged(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {becHeaderFlagged ? 'Fraude BEC signalée & bloquée' : 'Signaler l’usurpation BEC (Return-Path != From)'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blocked = dmarcPolicy === 'reject' && dmarcStrictAlign;
                    if (blocked) playSuccess();
                    else playError();
                    setSpoofTestResult(
                      blocked
                        ? '550 5.7.1 DMARC REJECT : L’e-mail usurpant pdg@cyberland.fr est bloqué à l’entrée SMTP.'
                        : `DANGER : L’e-mail usurpé n’est pas rejeté (politique actuelle p=${dmarcPolicy}, alignement ${dmarcStrictAlign ? 'strict' : 'relâché'}).`
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Tester un envoi Spoofing
                </button>
              </div>
              {spoofTestResult && (
                <p className="text-xs font-mono text-slate-900 dark:text-slate-100 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                  {spoofTestResult}
                </p>
              )}
            </div>
          </div>
        );

      case 'sigmayara':
        return (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Construction de la règle Sigma (SIEM) &amp; Signature YARA
            </div>
            {[
              {
                label: 'Sigma · Détecter powershell.exe avec -enc / -EncodedCommand',
                active: sigmaProcessMatch,
                toggle: () => setSigmaProcessMatch((v) => !v),
              },
              {
                label: 'Sigma · Corréler le processus parent Office (WINWORD.EXE / EXCEL.EXE)',
                active: sigmaParentOffice,
                toggle: () => setSigmaParentOffice((v) => !v),
              },
              {
                label: 'Sigma · Exclure le compte de service légitime (SVC_SCCM_ADMIN)',
                active: sigmaAdminExclusion,
                toggle: () => setSigmaAdminExclusion((v) => !v),
              },
              {
                label: 'YARA · Imposer l’en-tête exécutable PE Windows (uint16(0) == 0x5A4D)',
                active: yaraMzHeader,
                toggle: () => setYaraMzHeader((v) => !v),
              },
              {
                label: 'YARA · Ajouter les chaînes IOC ($s1/$s2) et la condition all of ($s*)',
                active: yaraStringsAndCondition,
                toggle: () => setYaraStringsAndCondition((v) => !v),
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  playClick();
                  item.toggle();
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold transition-colors ${
                  item.active
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{item.label}</span>
                <span className="font-mono shrink-0">{item.active ? 'ACTIF' : 'OFF'}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setReplayRunCount((c) => c + 1);
                if (sigmaProcessMatch && sigmaParentOffice && sigmaAdminExclusion && yaraMzHeader && yaraStringsAndCondition) {
                  playSuccess();
                } else {
                  playClick();
                }
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-bold transition-colors"
            >
              <Play className="w-4 h-4" />
              Rejouer 1 200 événements Sysmon + 8 binaires ({replayRunCount} test{replayRunCount > 1 ? 's' : ''})
            </button>
          </div>
        );

      case 'dfir':
        return (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Actions de Réponse à Incident (Ordre RFC 3227 obligatoire)
            </div>
            {dfirMistakeWarning && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{dfirMistakeWarning}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                playSuccess();
                setDfirMistakeWarning(null);
                setDfirRamCaptured(true);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold transition-colors ${
                dfirRamCaptured
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>1. Capturer l’image RAM volatile (winpmem / LiME)</span>
              <span className="font-mono">{dfirRamCaptured ? 'FAIT' : 'PRIORITÉ 1'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!dfirRamCaptured) {
                  playError();
                  setDfirMistakeWarning(
                    'Réflexe RFC 3227 : capturez d’abord la mémoire vive (RAM) avant d’isoler ou modifier l’état du serveur.'
                  );
                  return;
                }
                playClick();
                setDfirMistakeWarning(null);
                setDfirHostIsolated(true);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold transition-colors ${
                dfirHostIsolated
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>2. Isoler srv-compta via l’EDR (couper le C2 sans éteindre l’hôte)</span>
              <span className="font-mono">{dfirHostIsolated ? 'ISOLÉ' : 'ACTION'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!dfirRamCaptured) {
                  playError();
                  setDfirMistakeWarning('Capturez la RAM avant de lancer la collecte disque afin de ne pas altérer les pages mémoire.');
                  return;
                }
                playClick();
                setDfirMistakeWarning(null);
                setDfirArtifactsCollected(true);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold transition-colors ${
                dfirArtifactsCollected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>3. Collecter Sysmon/Security .evtx, sockets réseau &amp; $MFT</span>
              <span className="font-mono">{dfirArtifactsCollected ? 'COLLECTÉS' : 'ACTION'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!dfirRamCaptured || !dfirArtifactsCollected) {
                  playError();
                  setDfirMistakeWarning('Collectez la RAM et les artefacts .evtx/$MFT avant de sceller le manifeste SHA-256.');
                  return;
                }
                playClick();
                setDfirMistakeWarning(null);
                setDfirCustodySealed(true);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold transition-colors ${
                dfirCustodySealed
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>4. Sceller la Chaîne de Preuve (empreintes SHA-256 + horodatage)</span>
              <span className="font-mono">{dfirCustodySealed ? 'SCELLÉE' : 'ACTION'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!dfirCustodySealed) {
                  playError();
                  setDfirMistakeWarning('Scellez d’abord les preuves SHA-256 avant toute suppression de la persistance !');
                  return;
                }
                playSuccess();
                setDfirMistakeWarning(null);
                setDfirPersistenceRemoved(true);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold transition-colors ${
                dfirPersistenceRemoved
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>5. Éradiquer la tâche planifiée malveillante (Updater_Svchost)</span>
              <span className="font-mono">{dfirPersistenceRemoved ? 'ÉRADIQUÉE' : 'ACTION'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playError();
                setDfirMistakeWarning(
                  'Piège évité : redémarrer le serveur immédiatement aurait détruit les clés de déchiffrement et le malware résidant uniquement en RAM !'
                );
              }}
              className="w-full px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              Piège à éviter : Redémarrer immédiatement srv-compta
            </button>
          </div>
        );

      case 'iac':
        return (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sécurisation du code Terraform &amp; Idempotence Ansible
            </div>
            {[
              {
                label: '1. Activer Remote State chiffré (S3/Blob) + DynamoDB State Lock',
                active: iacRemoteStateLock,
                toggle: () => setIacRemoteStateLock((v) => !v),
              },
              {
                label: '2. Verrouiller SSH (22/tcp) sur le Bastion 10.50.0.10/32 (retirer 0.0.0.0/0)',
                active: iacStrictSshCidr,
                toggle: () => setIacStrictSshCidr((v) => !v),
              },
              {
                label: '3. Retirer le mot de passe en dur → variable sensitive = true',
                active: iacSecretsExternalized,
                toggle: () => setIacSecretsExternalized((v) => !v),
              },
            ].map((ctrl) => (
              <button
                key={ctrl.label}
                type="button"
                onClick={() => {
                  playClick();
                  ctrl.toggle();
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold transition-colors ${
                  ctrl.active
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{ctrl.label}</span>
                <span className="font-mono shrink-0">{ctrl.active ? 'CONFORME' : 'À CORRIGER'}</span>
              </button>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (!iacRemoteStateLock || !iacStrictSshCidr || !iacSecretsExternalized) {
                    playError();
                    setTerminalLog((prev) => [
                      ...prev.slice(-7),
                      {
                        cmd: 'terraform apply',
                        out: '[BLOQUÉ PAR POLICY] Sécurisez d’abord le Remote State, le CIDR SSH et les secrets avant d’appliquer.',
                        ok: false,
                      },
                    ]);
                    return;
                  }
                  playSuccess();
                  setIacPlanApplied(true);
                }}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                  iacPlanApplied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-sky-600 hover:bg-sky-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                {iacPlanApplied ? '4. Terraform Apply validé' : '4. Exécuter Plan & Apply'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!iacPlanApplied) {
                    playError();
                    setTerminalLog((prev) => [
                      ...prev.slice(-7),
                      {
                        cmd: 'ansible-playbook site.yml',
                        out: '[ERREUR] Provisionnez d’abord les serveurs avec terraform apply.',
                        ok: false,
                      },
                    ]);
                    return;
                  }
                  playSuccess();
                  setIacAnsibleIdempotent(true);
                }}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                  iacAnsibleIdempotent
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {iacAnsibleIdempotent ? '5. Ansible Idempotent (0)' : '5. Vérifier Ansible (--check)'}
              </button>
            </div>
          </div>
        );

      case 'iamcloud':
        return (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Durcissement IAM, Fédérations OIDC &amp; Coffre Secrets
            </div>
            {[
              {
                label: '1. Remplacer Action:"*" / Resource:"*" par s3:GetObject ciblé (Moindre privilège)',
                active: iamLeastPrivilege,
                toggle: () => setIamLeastPrivilege((v) => !v),
              },
              {
                label: '2. Ajouter la condition MFA obligatoire (aws:MultiFactorAuthPresent = true)',
                active: iamMfaCondition,
                toggle: () => setIamMfaCondition((v) => !v),
              },
              {
                label: '3. Supprimer les clés statiques CI/CD → Fédération OIDC (jetons 15 min)',
                active: iamOidcEnabled,
                toggle: () => setIamOidcEnabled((v) => !v),
              },
              {
                label: '4. Activer S3 BlockPublicAccess sur cyberland-prod-data',
                active: iamPublicBlock,
                toggle: () => setIamPublicBlock((v) => !v),
              },
              {
                label: '5. Activer HashiCorp Vault / Secrets Manager (identifiants BDD TTL 1h)',
                active: iamVaultDynamic,
                toggle: () => setIamVaultDynamic((v) => !v),
              },
            ].map((ctrl) => (
              <button
                key={ctrl.label}
                type="button"
                onClick={() => {
                  playClick();
                  ctrl.toggle();
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold transition-colors ${
                  ctrl.active
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{ctrl.label}</span>
                <span className="font-mono shrink-0">{ctrl.active ? 'VERROUILLÉ' : 'EXPOSÉ'}</span>
              </button>
            ))}
          </div>
        );

      case 'bgprouting':
        return (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Plan de Contrôle OSPF, Sécurité BGP/RPKI &amp; SD-WAN
            </div>
            {[
              {
                label: '1. Configurer le Backbone OSPF Area 0.0.0.0 (adjacence FULL)',
                active: bgpOspfArea0,
                toggle: () => setBgpOspfArea0((v) => !v),
              },
              {
                label: '2. Filtrer les annonces eBGP par prefix-list (bloquer les Route Leaks)',
                active: bgpPrefixFilter,
                toggle: () => setBgpPrefixFilter((v) => !v),
              },
              {
                label: '3. Activer RPKI / ROA Validation (rejeter l’annonce pirate AS 66600)',
                active: bgpRpkiEnabled,
                toggle: () => setBgpRpkiEnabled((v) => !v),
              },
              {
                label: '4. Activer BFD (300 ms) sur les sessions eBGP critiques',
                active: bgpBfdFast,
                toggle: () => setBgpBfdFast((v) => !v),
              },
              {
                label: '5. Activer la bascule SD-WAN SLA (MPLS 185ms → DIA Fiber 14ms)',
                active: bgpSdwanSla,
                toggle: () => setBgpSdwanSla((v) => !v),
              },
            ].map((ctrl) => (
              <button
                key={ctrl.label}
                type="button"
                onClick={() => {
                  playClick();
                  ctrl.toggle();
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold transition-colors ${
                  ctrl.active
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{ctrl.label}</span>
                <span className="font-mono shrink-0">{ctrl.active ? 'ACTIF' : 'OFF'}</span>
              </button>
            ))}
          </div>
        );

      case 'linuxadmin':
        return (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Actions d’Administration Linux (Ubuntu / Debian / RHEL)
            </div>
            {[
              {
                label: '1. Créer admin_ops (groupe sudo) & désactiver PermitRootLogin SSH',
                active: linuxSudoLocked,
                toggle: () => setLinuxSudoLocked((v) => !v),
              },
              {
                label: '2. Appliquer chown admin_ops:webops, chmod 750 /srv/app & clé SSH 600',
                active: linuxPermsStrict,
                toggle: () => setLinuxPermsStrict((v) => !v),
              },
              {
                label: '3. Activer & démarrer app-api.service via systemd (Restart=on-failure)',
                active: linuxSystemdActive,
                toggle: () => setLinuxSystemdActive((v) => !v),
              },
              {
                label: '4. Étendre à chaud le volume LVM /dev/vg_data/lv_logs (+20 Go)',
                active: linuxLvmExtended,
                toggle: () => setLinuxLvmExtended((v) => !v),
              },
              {
                label: '5. Planifier la sauvegarde quotidienne cron (02h30) & auditer les ports',
                active: linuxCronBackup,
                toggle: () => setLinuxCronBackup((v) => !v),
              },
            ].map((ctrl) => (
              <button
                key={ctrl.label}
                type="button"
                onClick={() => {
                  playClick();
                  ctrl.toggle();
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold transition-colors ${
                  ctrl.active
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{ctrl.label}</span>
                <span className="font-mono shrink-0">{ctrl.active ? 'APPLIQUÉ' : 'À FAIRE'}</span>
              </button>
            ))}
          </div>
        );

      case 'winserver':
        return (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Déploiement &amp; Durcissement Windows Server (PowerShell)
            </div>
            {[
              {
                label: '1. Renommer en SRV-WIN-01 et configurer IP statique 10.20.0.10/24',
                active: winStaticIpName,
                toggle: () => setWinStaticIpName((v) => !v),
              },
              {
                label: '2. Installer les rôles DNS (cyberland.local) & DHCP (étendue .50-.200)',
                active: winDnsDhcpReady,
                toggle: () => setWinDnsDhcpReady((v) => !v),
              },
              {
                label: '3. Partage SMB3 chiffré (Partage_Compta) + NTFS strict + couper SMBv1',
                active: winSmbEncrypted,
                toggle: () => setWinSmbEncrypted((v) => !v),
              },
              {
                label: '4. Publier IIS en HTTPS (443) & activer PowerShell Remoting (WinRM)',
                active: winIisHttpsWinrm,
                toggle: () => setWinIisHttpsWinrm((v) => !v),
              },
              {
                label: '5. Activer les 3 profils Pare-feu Windows Defender & Windows Backup',
                active: winFirewallBackup,
                toggle: () => setWinFirewallBackup((v) => !v),
              },
            ].map((ctrl) => (
              <button
                key={ctrl.label}
                type="button"
                onClick={() => {
                  playClick();
                  ctrl.toggle();
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold transition-colors ${
                  ctrl.active
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{ctrl.label}</span>
                <span className="font-mono shrink-0">{ctrl.active ? 'ACTIF' : 'OFF'}</span>
              </button>
            ))}
          </div>
        );

      case 'admastery':
        return (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Déploiement &amp; Sécurisation Active Directory (AD DS)
            </div>
            {[
              {
                label: '1. Promouvoir DC01 (forêt cyberland.local) & activer la Corbeille AD',
                active: adForestPromoted,
                toggle: () => setAdForestPromoted((v) => !v),
              },
              {
                label: '2. Créer les OU (Tier0/1/2, Compta) & appliquer le modèle AGDLP',
                active: adOuAgdlpStructured,
                toggle: () => setAdOuAgdlpStructured((v) => !v),
              },
              {
                label: '3. Déployer & lier les 3 GPO de sécurité (MDP 14 car., BitLocker, USB)',
                active: adGpoLinked,
                toggle: () => setAdGpoLinked((v) => !v),
              },
              {
                label: '4. Forcer Kerberos AES-256 (zéro RC4) & activer LDAPS (636/TLS)',
                active: adKerberosLdaps,
                toggle: () => setAdKerberosLdaps((v) => !v),
              },
              {
                label: '5. Activer le Tiering (T0/T1/T2), Windows LAPS & comptes gMSA',
                active: adTieringLaps,
                toggle: () => setAdTieringLaps((v) => !v),
              },
            ].map((ctrl) => (
              <button
                key={ctrl.label}
                type="button"
                onClick={() => {
                  playClick();
                  ctrl.toggle();
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold transition-colors ${
                  ctrl.active
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{ctrl.label}</span>
                <span className="font-mono shrink-0">{ctrl.active ? 'VERROUILLÉ' : 'EXPOSÉ'}</span>
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Progress Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">
              <HeaderIcon className="w-4 h-4 shrink-0" />
              <span>{meta.badgeText}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {meta.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              {meta.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-bold tabular-nums ${
                allCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              {allCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Shield className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              )}
              Objectifs : {completedCount} / {objectives.length}
            </div>
            <button
              type="button"
              onClick={handleResetLab}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Live Telemetry Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {telemetryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 px-3.5 py-3 space-y-1"
            >
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {card.label}
              </div>
              <div
                className={`font-mono text-sm font-bold tabular-nums ${
                  card.ok
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Live Architecture Diagram */}
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 overflow-x-auto">
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Schéma temps réel · Mise à jour instantanée selon votre configuration
            </span>
            <span className={allCompleted ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
              {allCompleted ? 'ARCHITECTURE CONFORME' : 'DURCISSEMENT EN COURS'}
            </span>
          </div>
          {renderArchitectureDiagram()}
        </div>
      </div>

      {/* Main Split: Left Controls + Objectives | Right Generated Artifact + Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            {renderControls()}
          </div>

          {/* 5 Auto-Validated Objectives */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Checklist de validation terrain (5 objectifs)
              </h3>
              <span className="text-xs font-mono font-semibold text-sky-700 dark:text-cyan-400 tabular-nums">
                {completedCount}/{objectives.length}
              </span>
            </div>
            <ul className="space-y-2">
              {objectives.map((obj) => (
                <li
                  key={obj.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs ${
                    obj.done
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                      : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {obj.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{obj.label}</span>
                </li>
              ))}
            </ul>
            {allCompleted && (
              <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>
                  Atelier validé à 100 % ! Vos 3 étoiles et votre bonus +110 XP ont été enregistrés.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Generated Live Config + Diagnostic Terminal */}
        <div className="lg:col-span-6 space-y-6">
          {/* Generated Artifact Viewer */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                <Code2 className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                <span>{meta.artifactFilename}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyArtifact}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadArtifact}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exporter
                </button>
              </div>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[290px]">
              {generatedArtifact}
            </pre>
          </div>

          {/* Live Diagnostic Terminal */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 text-slate-100">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
                <Terminal className="w-4 h-4" />
                <span>Console de diagnostic temps réel</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Cliquez sur une commande pour auditer votre état live
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {terminalCommands.map((item) => (
                <button
                  key={item.cmd}
                  type="button"
                  onClick={() => handleRunCommand(item.cmd, item.run)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-sky-300 transition-colors text-left"
                >
                  $ {item.cmd}
                </button>
              ))}
            </div>

            <div className="rounded-xl bg-black/70 border border-slate-800 p-3.5 font-mono text-[11px] space-y-2.5 min-h-[160px] max-h-[260px] overflow-y-auto">
              {terminalLog.length === 0 ? (
                <p className="text-slate-500">
                  En attente d&apos;une commande d&apos;audit... Modifiez les paramètres à gauche puis vérifiez le résultat en direct.
                </p>
              ) : (
                terminalLog.map((entry, idx) => (
                  <div key={`${entry.cmd}-${idx}`} className="space-y-1">
                    <div className="text-cyan-400">$ {entry.cmd}</div>
                    <pre
                      className={`whitespace-pre-wrap leading-relaxed ${
                        entry.ok ? 'text-emerald-300' : 'text-amber-300'
                      }`}
                    >
                      {entry.out}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
