export type SnifferNodeId =
  | 'pc-lan'
  | 'pc-admin'
  | 'sw-core'
  | 'fw-edge'
  | 'srv-web'
  | 'srv-db'
  | 'wan-net';

export type SnifferLinkId =
  | 'conn-lan-sw'
  | 'conn-admin-sw'
  | 'conn-sw-fw'
  | 'conn-fw-dmz'
  | 'conn-fw-db'
  | 'conn-fw-wan';

export type SnifferProtocol =
  | 'ARP'
  | 'DNS'
  | 'TCP'
  | 'HTTP'
  | 'TLSv1.3'
  | 'SSHv2'
  | 'ICMP'
  | 'PostgreSQL';

export type PacketLayerKey = 'l1' | 'l2' | 'l3' | 'l4' | 'l7';

export interface SnifferNode {
  id: SnifferNodeId;
  label: string;
  role: string;
  ip: string;
  mac: string;
  zone: string;
  kind: 'workstation' | 'admin' | 'switch' | 'firewall' | 'web' | 'db' | 'wan';
  x: number;
  y: number;
}

export interface SnifferConnection {
  id: SnifferLinkId;
  from: SnifferNodeId;
  to: SnifferNodeId;
  label: string;
  iface: string;
  segment: string;
  bandwidth: string;
  vlan: string;
  description: string;
  hasAnomaly: boolean;
}

export interface HexByteRow {
  offset: string;
  hex: string;
  ascii: string;
  layer: Exclude<PacketLayerKey, 'l1'>;
}

export interface SnifferFrameTemplate {
  templateId: string;
  linkId: SnifferLinkId;
  srcIp: string;
  srcMac: string;
  srcPort?: number;
  dstIp: string;
  dstMac: string;
  dstPort?: number;
  protocol: SnifferProtocol;
  length: number;
  flags?: string;
  info: string;
  classification: 'normal' | 'cleartext' | 'encrypted' | 'anomaly';
  analystNote: string;
  missionEvidenceId?: string;
  streamTranscript?: string[];
  layers: Record<PacketLayerKey, { title: string; fields: string[] }>;
  hexRows: HexByteRow[];
}

export interface CapturedSnifferFrame extends SnifferFrameTemplate {
  captureNo: number;
  timestampSec: number;
  linkLabel: string;
  iface: string;
}

export interface SnifferMission {
  id: string;
  title: string;
  hint: string;
  targetLinkId: SnifferLinkId;
  targetLinkName: string;
  objective: string;
}

export const SNIFFER_NODES: SnifferNode[] = [
  {
    id: 'pc-lan',
    label: 'PC-LAN-01',
    role: 'Poste Employé',
    ip: '192.168.10.25',
    mac: 'a4:5e:60:c1:09:25',
    zone: 'VLAN 10 · LAN',
    kind: 'workstation',
    x: 92,
    y: 90,
  },
  {
    id: 'pc-admin',
    label: 'PC-ADMIN-02',
    role: 'Poste SysAdmin',
    ip: '192.168.20.10',
    mac: '3c:22:fb:84:12:10',
    zone: 'VLAN 20 · ADMIN',
    kind: 'admin',
    x: 92,
    y: 255,
  },
  {
    id: 'sw-core',
    label: 'SW-CORE-01',
    role: 'Switch / Routeur L3',
    ip: '192.168.10.1',
    mac: '00:1a:2b:00:00:01',
    zone: 'Cœur Réseau',
    kind: 'switch',
    x: 300,
    y: 172,
  },
  {
    id: 'fw-edge',
    label: 'FW-EDGE-01',
    role: 'Pare-feu Stateful',
    ip: '172.16.0.1',
    mac: '00:1a:2b:ff:00:01',
    zone: 'Périmètre',
    kind: 'firewall',
    x: 525,
    y: 172,
  },
  {
    id: 'srv-web',
    label: 'SRV-WEB-DMZ',
    role: 'Portail Nginx',
    ip: '172.16.50.10',
    mac: '52:54:00:ab:50:10',
    zone: 'DMZ Publique',
    kind: 'web',
    x: 760,
    y: 72,
  },
  {
    id: 'srv-db',
    label: 'SRV-DB-INT',
    role: 'PostgreSQL / AD',
    ip: '10.0.100.20',
    mac: '52:54:00:cd:64:20',
    zone: 'Zone Interne',
    kind: 'db',
    x: 760,
    y: 172,
  },
  {
    id: 'wan-net',
    label: 'INTERNET (WAN)',
    role: 'Passerelle FAI',
    ip: '203.0.113.1',
    mac: 'e8:9a:8f:44:21:01',
    zone: 'Externe WAN',
    kind: 'wan',
    x: 760,
    y: 272,
  },
];

export const SNIFFER_CONNECTIONS: SnifferConnection[] = [
  {
    id: 'conn-lan-sw',
    from: 'pc-lan',
    to: 'sw-core',
    label: 'PC-LAN ↔ SW-CORE',
    iface: 'tap0 · eth0',
    segment: '192.168.10.0/24',
    bandwidth: '1 Gbps',
    vlan: 'VLAN 10',
    description: 'Accès poste utilisateur : ARP local, résolutions DNS et trafic applicatif interne.',
    hasAnomaly: true,
  },
  {
    id: 'conn-admin-sw',
    from: 'pc-admin',
    to: 'sw-core',
    label: 'PC-ADMIN ↔ SW-CORE',
    iface: 'tap1 · eth1',
    segment: '192.168.20.0/24',
    bandwidth: '1 Gbps',
    vlan: 'VLAN 20',
    description: 'Poste d’administration sécurisé : SSHv2 chiffré, diagnostics ICMP et console TLS.',
    hasAnomaly: false,
  },
  {
    id: 'conn-sw-fw',
    from: 'sw-core',
    to: 'fw-edge',
    label: 'SW-CORE ↔ FW-EDGE',
    iface: 'tap2 · trunk0',
    segment: '10.255.0.0/30',
    bandwidth: '10 Gbps',
    vlan: 'Trunk 802.1Q',
    description: 'Lien d’agrégation inter-VLAN vers le pare-feu : point idéal pour détecter scans et tunnels DNS.',
    hasAnomaly: true,
  },
  {
    id: 'conn-fw-dmz',
    from: 'fw-edge',
    to: 'srv-web',
    label: 'FW-EDGE ↔ SRV-WEB',
    iface: 'tap3 · dmz0',
    segment: '172.16.50.0/24',
    bandwidth: '10 Gbps',
    vlan: 'VLAN 50 DMZ',
    description: 'Trafic entrant vers le serveur Web DMZ : handshakes TLSv1.3, requêtes HTTP et blocages WAF.',
    hasAnomaly: true,
  },
  {
    id: 'conn-fw-db',
    from: 'fw-edge',
    to: 'srv-db',
    label: 'FW-EDGE ↔ SRV-DB',
    iface: 'tap4 · int0',
    segment: '10.0.100.0/24',
    bandwidth: '10 Gbps',
    vlan: 'VLAN 100 DB',
    description: 'Accès base de données PostgreSQL : requêtes légitimes et tentatives directes rejetées.',
    hasAnomaly: true,
  },
  {
    id: 'conn-fw-wan',
    from: 'fw-edge',
    to: 'wan-net',
    label: 'FW-EDGE ↔ WAN',
    iface: 'tap5 · wan0',
    segment: '203.0.113.0/24',
    bandwidth: '1 Gbps',
    vlan: 'Uplink FAI',
    description: 'Sortie Internet NAT : flux HTTPS externes, réponses ICMP et balises suspectes.',
    hasAnomaly: true,
  },
];

export const SNIFFER_MISSIONS: SnifferMission[] = [
  {
    id: 'ev-cleartext-http',
    title: '1. Repérer une fuite d’identifiants en clair',
    hint: 'Connectez la sonde sur PC-LAN ↔ SW-CORE et filtrez sur HTTP.',
    targetLinkId: 'conn-lan-sw',
    targetLinkName: 'PC-LAN ↔ SW-CORE',
    objective: 'Sélectionnez la trame HTTP POST contenant un mot de passe non chiffré puis marquez-la comme preuve.',
  },
  {
    id: 'ev-dns-tunnel',
    title: '2. Détecter une exfiltration par tunnel DNS',
    hint: 'Écoutez le lien trunk SW-CORE ↔ FW-EDGE et filtrez sur DNS.',
    targetLinkId: 'conn-sw-fw',
    targetLinkName: 'SW-CORE ↔ FW-EDGE',
    objective: 'Identifiez la requête DNS TXT contenant un sous-domaine hexadécimal encodé.',
  },
  {
    id: 'ev-dmz-sqli',
    title: '3. Capturer une tentative d’injection SQL en DMZ',
    hint: 'Branchez le sniffer sur FW-EDGE ↔ SRV-WEB et examinez les requêtes HTTP.',
    targetLinkId: 'conn-fw-dmz',
    targetLinkName: 'FW-EDGE ↔ SRV-WEB',
    objective: 'Repérez la trame HTTP GET contenant un payload SQLi sur /api/users.',
  },
  {
    id: 'ev-wan-c2',
    title: '4. Isoler une balise C2 sortante vers le WAN',
    hint: 'Placez la sonde sur FW-EDGE ↔ WAN et inspectez les flux HTTPS atypiques (port 8443).',
    targetLinkId: 'conn-fw-wan',
    targetLinkName: 'FW-EDGE ↔ WAN',
    objective: 'Marquez la trame sortante vers le serveur C2 198.51.100.77:8443.',
  },
];

export const FRAME_LIBRARY_BY_LINK: Record<SnifferLinkId, SnifferFrameTemplate[]> = {
  'conn-lan-sw': [
    {
      templateId: 'lan-arp-1',
      linkId: 'conn-lan-sw',
      srcIp: '192.168.10.25',
      srcMac: 'a4:5e:60:c1:09:25',
      dstIp: '192.168.10.1',
      dstMac: 'ff:ff:ff:ff:ff:ff',
      protocol: 'ARP',
      length: 42,
      info: 'Who has 192.168.10.1? Tell 192.168.10.25',
      classification: 'normal',
      analystNote: 'Diffusion ARP normale (Broadcast L2) pour découvrir l’adresse MAC de la passerelle VLAN 10.',
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap0 · eth0)',
          fields: ['Longueur sur le fil : 42 octets (336 bits)', 'Sens : PC-LAN-01 → SW-CORE-01', 'VLAN 10 (Untagged Access)'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : a4:5e:60:c1:09:25', 'MAC Destination : ff:ff:ff:ff:ff:ff (Broadcast)', 'EtherType : ARP (0x0806)'],
        },
        l3: {
          title: 'Couche 2/3 · Address Resolution Protocol (Request)',
          fields: ['Hardware Type : Ethernet (1) · Protocol : IPv4 (0x0800)', 'Opcode : Request (1)', 'Sender IP : 192.168.10.25 → Target IP : 192.168.10.1'],
        },
        l4: {
          title: 'Couche 4 · Non applicable (Protocole L2)',
          fields: ['ARP opère directement au-dessus d’Ethernet sans port TCP/UDP.'],
        },
        l7: {
          title: 'Couche 7 · Aucune charge applicative',
          fields: ['Trame d’infrastructure réseau locale.'],
        },
      },
      hexRows: [
        { offset: '0000', hex: 'ff ff ff ff ff ff a4 5e  60 c1 09 25 08 06', ascii: '.......^`..%..', layer: 'l2' },
        { offset: '0010', hex: '00 01 08 00 06 04 00 01  a4 5e 60 c1 09 25 c0 a8', ascii: '.........^`..%..', layer: 'l3' },
        { offset: '0020', hex: '0a 19 00 00 00 00 00 00  c0 a8 0a 01', ascii: '............', layer: 'l3' },
      ],
    },
    {
      templateId: 'lan-dns-2',
      linkId: 'conn-lan-sw',
      srcIp: '192.168.10.25',
      srcMac: 'a4:5e:60:c1:09:25',
      srcPort: 53104,
      dstIp: '192.168.10.1',
      dstMac: '00:1a:2b:00:00:01',
      dstPort: 53,
      protocol: 'DNS',
      length: 79,
      info: 'Standard query 0x6b21 A intranet.cyberland.local',
      classification: 'normal',
      analystNote: 'Résolution DNS standard vers le résolveur interne sur le port UDP 53.',
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap0 · eth0)',
          fields: ['Longueur capturée : 79 octets', 'Mode : Promiscuité (SPAN Port Mirroring)'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : a4:5e:60:c1:09:25', 'MAC Destination : 00:1a:2b:00:00:01', 'EtherType : IPv4 (0x0800)'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source : 192.168.10.25 → Destination : 192.168.10.1', 'TTL : 64 · Protocole : UDP (17) · ID : 0x3a10'],
        },
        l4: {
          title: 'Couche 4 · User Datagram Protocol (UDP)',
          fields: ['Port source : 53104 → Port destination : 53', 'Longueur : 45 octets · Checksum : 0x9b42 [valide]'],
        },
        l7: {
          title: 'Couche 7 · Domain Name System (Query)',
          fields: ['Transaction ID : 0x6b21 · Flags : 0x0100 (Recursion Desired)', 'Query : intranet.cyberland.local (Type A, Class IN)'],
        },
      },
      hexRows: [
        { offset: '0000', hex: '00 1a 2b 00 00 01 a4 5e  60 c1 09 25 08 00', ascii: '..+....^`..%..', layer: 'l2' },
        { offset: '0010', hex: '45 00 00 41 3a 10 40 00  40 11 8f 32 c0 a8 0a 19', ascii: 'E..A:.@.@..2....', layer: 'l3' },
        { offset: '0020', hex: 'c0 a8 0a 01 cf 70 00 35  00 2d 9b 42', ascii: '.....p.5.-.B', layer: 'l4' },
        { offset: '0030', hex: '6b 21 01 00 00 01 69 6e  74 72 61 6e 65 74 2e 6c', ascii: 'k!....intranet.l', layer: 'l7' },
      ],
    },
    {
      templateId: 'lan-tcp-syn-3',
      linkId: 'conn-lan-sw',
      srcIp: '192.168.10.25',
      srcMac: 'a4:5e:60:c1:09:25',
      srcPort: 54910,
      dstIp: '172.16.50.10',
      dstMac: '00:1a:2b:00:00:01',
      dstPort: 80,
      protocol: 'TCP',
      length: 74,
      flags: 'SYN',
      info: '54910 → 80 [SYN] Seq=0 Win=64240 MSS=1460',
      classification: 'normal',
      analystNote: 'Ouverture d’une connexion TCP vers le port 80 (HTTP non chiffré) : attention aux données qui vont suivre.',
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap0 · eth0)',
          fields: ['Longueur : 74 octets', 'Lien : PC-LAN-01 → SW-CORE-01'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : a4:5e:60:c1:09:25', 'MAC Destination : 00:1a:2b:00:00:01 (Passerelle L3)', 'EtherType : IPv4 (0x0800)'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source : 192.168.10.25 → Destination : 172.16.50.10', 'TTL : 64 · DF=1 · Protocole : TCP (6)'],
        },
        l4: {
          title: 'Couche 4 · Transmission Control Protocol (TCP)',
          fields: ['54910 → 80 · Flags : 0x002 [SYN]', 'Seq : 0 · Window : 64240 · MSS : 1460'],
        },
        l7: {
          title: 'Couche 7 · Aucune donnée (Handshake 1/3)',
          fields: ['Négociation TCP en cours avant envoi de la requête HTTP.'],
        },
      },
      hexRows: [
        { offset: '0000', hex: '00 1a 2b 00 00 01 a4 5e  60 c1 09 25 08 00', ascii: '..+....^`..%..', layer: 'l2' },
        { offset: '0010', hex: '45 00 00 3c 71 22 40 00  40 06 a4 0c c0 a8 0a 19', ascii: 'E..<q"@.@.......', layer: 'l3' },
        { offset: '0020', hex: 'ac 10 32 0a d6 7e 00 50  00 00 00 00 00 02 fa f0', ascii: '..2..~.P........', layer: 'l4' },
      ],
    },
    {
      templateId: 'lan-http-leak-4',
      linkId: 'conn-lan-sw',
      srcIp: '192.168.10.25',
      srcMac: 'a4:5e:60:c1:09:25',
      srcPort: 54910,
      dstIp: '172.16.50.10',
      dstMac: '00:1a:2b:00:00:01',
      dstPort: 80,
      protocol: 'HTTP',
      length: 318,
      flags: 'PSH, ACK',
      info: 'POST /login HTTP/1.1 (application/x-www-form-urlencoded · CLAIR)',
      classification: 'cleartext',
      missionEvidenceId: 'ev-cleartext-http',
      analystNote: 'Alerte sécurité : identifiants transmis en clair sur HTTP (port 80). Un attaquant sur le VLAN 10 peut lire user=alice et pass=Cyber2026! directement dans la trame.',
      streamTranscript: [
        '>>> CLIENT 192.168.10.25:54910 → 172.16.50.10:80',
        'POST /login HTTP/1.1',
        'Host: intranet.cyberland.local',
        'Content-Type: application/x-www-form-urlencoded',
        'Content-Length: 31',
        '',
        'user=alice.martin&pass=Cyber2026!',
        '',
        '<<< SERVEUR 172.16.50.10:80 → 192.168.10.25:54910',
        'HTTP/1.1 302 Found',
        'Set-Cookie: SESSIONID=9f20a8c41b; Path=/',
      ],
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap0 · eth0)',
          fields: ['Longueur capturée : 318 octets', 'Lien : PC-LAN-01 → SW-CORE-01'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : a4:5e:60:c1:09:25', 'MAC Destination : 00:1a:2b:00:00:01', 'EtherType : IPv4 (0x0800)'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source : 192.168.10.25 → Destination : 172.16.50.10', 'TTL : 64 · Protocole : TCP (6)'],
        },
        l4: {
          title: 'Couche 4 · Transmission Control Protocol (TCP)',
          fields: ['54910 → 80 · Flags : [PSH, ACK]', 'Seq : 1 · Ack : 1 · Payload TCP : 252 octets'],
        },
        l7: {
          title: 'Couche 7 · Hypertext Transfer Protocol (NON CHIFFRÉ)',
          fields: [
            'Méthode : POST /login HTTP/1.1',
            'Host : intranet.cyberland.local',
            'Corps intercepté en clair : user=alice.martin&pass=Cyber2026!',
            'Correction : forcer HTTPS (TLSv1.3) + HSTS et cookies Secure/HttpOnly.',
          ],
        },
      },
      hexRows: [
        { offset: '0000', hex: '00 1a 2b 00 00 01 a4 5e  60 c1 09 25 08 00', ascii: '..+....^`..%..', layer: 'l2' },
        { offset: '0010', hex: '45 00 01 30 71 24 40 00  40 06 a3 14 c0 a8 0a 19', ascii: 'E..0q$@.@.......', layer: 'l3' },
        { offset: '0020', hex: 'ac 10 32 0a d6 7e 00 50  00 00 00 01 00 00 00 01', ascii: '..2..~.P........', layer: 'l4' },
        { offset: '0030', hex: '50 4f 53 54 20 2f 6c 6f  67 69 6e 20 48 54 54 50', ascii: 'POST /login HTTP', layer: 'l7' },
        { offset: '0040', hex: '75 73 65 72 3d 61 6c 69  63 65 26 70 61 73 73 3d', ascii: 'user=alice&pass=', layer: 'l7' },
        { offset: '0050', hex: '43 79 62 65 72 32 30 32  36 21', ascii: 'Cyber2026!', layer: 'l7' },
      ],
    },
    {
      templateId: 'lan-tls-5',
      linkId: 'conn-lan-sw',
      srcIp: '192.168.10.25',
      srcMac: 'a4:5e:60:c1:09:25',
      srcPort: 55022,
      dstIp: '172.16.50.10',
      dstMac: '00:1a:2b:00:00:01',
      dstPort: 443,
      protocol: 'TLSv1.3',
      length: 248,
      flags: 'PSH, ACK',
      info: 'Application Data (Chiffré AES-256-GCM · Illisible sur le fil)',
      classification: 'encrypted',
      analystNote: 'Flux chiffré de bout en bout par TLSv1.3 : même avec une sonde sur le câble, la charge utile reste aléatoire.',
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap0 · eth0)',
          fields: ['Longueur capturée : 248 octets', 'Lien : PC-LAN-01 → SW-CORE-01'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : a4:5e:60:c1:09:25', 'MAC Destination : 00:1a:2b:00:00:01', 'EtherType : IPv4 (0x0800)'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source : 192.168.10.25 → Destination : 172.16.50.10', 'TTL : 64 · Protocole : TCP (6)'],
        },
        l4: {
          title: 'Couche 4 · Transmission Control Protocol (TCP)',
          fields: ['55022 → 443 · Flags : [PSH, ACK]', 'Seq : 518 · Ack : 1492'],
        },
        l7: {
          title: 'Couche 7 · Transport Layer Security (TLSv1.3)',
          fields: ['Content Type : Application Data (23)', 'Cipher Suite : TLS_AES_256_GCM_SHA384', 'Payload : 182 octets chiffrés authentifiés (AEAD)'],
        },
      },
      hexRows: [
        { offset: '0000', hex: '00 1a 2b 00 00 01 a4 5e  60 c1 09 25 08 00', ascii: '..+....^`..%..', layer: 'l2' },
        { offset: '0010', hex: '45 00 00 ea 92 10 40 00  40 06 81 6a c0 a8 0a 19', ascii: 'E.....@.@..j....', layer: 'l3' },
        { offset: '0020', hex: 'ac 10 32 0a d6 ee 01 bb  00 00 02 06 00 00 05 d4', ascii: '..2.............', layer: 'l4' },
        { offset: '0030', hex: '17 03 03 00 b6 8f e1 3d  c4 90 7b 2a f9 11 4e b8', ascii: '.......=..{*..N.', layer: 'l7' },
      ],
    },
  ],

  'conn-admin-sw': [
    {
      templateId: 'adm-icmp-1',
      linkId: 'conn-admin-sw',
      srcIp: '192.168.20.10',
      srcMac: '3c:22:fb:84:12:10',
      dstIp: '10.0.100.20',
      dstMac: '00:1a:2b:00:00:01',
      protocol: 'ICMP',
      length: 98,
      info: 'Echo (ping) request id=0x04a2, seq=1/256, ttl=64',
      classification: 'normal',
      analystNote: 'Test de joignabilité ICMP depuis le poste SysAdmin vers le serveur de base de données interne.',
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap1 · eth1)',
          fields: ['Longueur capturée : 98 octets', 'VLAN 20 (Admin IT)'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : 3c:22:fb:84:12:10', 'MAC Destination : 00:1a:2b:00:00:01', 'EtherType : IPv4 (0x0800)'],
        },
        l3: {
          title: 'Couche 3 · IPv4 + ICMP',
          fields: ['Source : 192.168.20.10 → Destination : 10.0.100.20', 'Protocole : ICMP (1) · Type : 8 (Echo Request) · Code : 0'],
        },
        l4: {
          title: 'Couche 4 · ICMP Diagnostic',
          fields: ['Identifier : 0x04a2 · Sequence : 1', 'Payload de test : 56 octets'],
        },
        l7: {
          title: 'Couche 7 · Non applicable',
          fields: ['Commande opérateur : ping -c 1 10.0.100.20'],
        },
      },
      hexRows: [
        { offset: '0000', hex: '00 1a 2b 00 00 01 3c 22  fb 84 12 10 08 00', ascii: '..+...<"......', layer: 'l2' },
        { offset: '0010', hex: '45 00 00 54 11 c8 40 00  40 01 7b 90 c0 a8 14 0a', ascii: 'E..T..@.@.{.....', layer: 'l3' },
        { offset: '0020', hex: '0a 00 64 14 08 00 4d 5b  04 a2 00 01', ascii: '..d...M[....', layer: 'l4' },
      ],
    },
    {
      templateId: 'adm-ssh-2',
      linkId: 'conn-admin-sw',
      srcIp: '192.168.20.10',
      srcMac: '3c:22:fb:84:12:10',
      srcPort: 58412,
      dstIp: '10.0.100.20',
      dstMac: '00:1a:2b:00:00:01',
      dstPort: 22,
      protocol: 'SSHv2',
      length: 146,
      flags: 'PSH, ACK',
      info: 'Encrypted packet (len=80 · chacha20-poly1305@openssh.com)',
      classification: 'encrypted',
      analystNote: 'Administration SSHv2 protégée par clé Ed25519 et chiffrement ChaCha20-Poly1305 : les commandes tapées sont protégées.',
      streamTranscript: [
        '>>> BANNIÈRE SSHv2 (avant chiffrement)',
        'SSH-2.0-OpenSSH_9.6p1',
        '<<< SERVEUR 10.0.100.20:22',
        'SSH-2.0-OpenSSH_9.6p1 Debian-3',
        '[Échange de clés Curve25519 terminé · Tunnel chiffré actif]',
        '[Charge utile chiffrée : 80 octets opaques]',
      ],
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap1 · eth1)',
          fields: ['Longueur : 146 octets', 'Lien : PC-ADMIN-02 → SW-CORE-01'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : 3c:22:fb:84:12:10', 'MAC Destination : 00:1a:2b:00:00:01'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source : 192.168.20.10 → Destination : 10.0.100.20', 'TTL : 64 · Protocole : TCP (6)'],
        },
        l4: {
          title: 'Couche 4 · Transmission Control Protocol (TCP)',
          fields: ['58412 → 22 · Flags : [PSH, ACK]', 'Seq : 1042 · Ack : 2318'],
        },
        l7: {
          title: 'Couche 7 · Secure Shell v2 (SSHv2)',
          fields: ['Algorithme : chacha20-poly1305@openssh.com', 'Authentification : PublicKey (Ed25519)', 'Contenu : chiffré (aucun mot de passe visible)'],
        },
      },
      hexRows: [
        { offset: '0000', hex: '00 1a 2b 00 00 01 3c 22  fb 84 12 10 08 00', ascii: '..+...<"......', layer: 'l2' },
        { offset: '0010', hex: '45 10 00 84 4a 01 40 00  40 06 43 1d c0 a8 14 0a', ascii: 'E...J.@.@.C.....', layer: 'l3' },
        { offset: '0020', hex: '0a 00 64 14 e4 2c 00 16  00 00 04 12 00 00 09 0e', ascii: '..d..,..........', layer: 'l4' },
        { offset: '0030', hex: '7c 91 d4 0a 5e f3 82 c1  19 4a b7 e2 05 33 6f a0', ascii: '|...^....J...3o.', layer: 'l7' },
      ],
    },
    {
      templateId: 'adm-tls-3',
      linkId: 'conn-admin-sw',
      srcIp: '192.168.20.10',
      srcMac: '3c:22:fb:84:12:10',
      srcPort: 59120,
      dstIp: '172.16.0.1',
      dstMac: '00:1a:2b:00:00:01',
      dstPort: 443,
      protocol: 'TLSv1.3',
      length: 517,
      flags: 'PSH, ACK',
      info: 'Client Hello (SNI=fw-edge.admin.cyberland.local)',
      classification: 'encrypted',
      analystNote: 'Connexion TLSv1.3 vers l’interface d’administration du pare-feu depuis le VLAN 20 autorisé.',
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap1 · eth1)',
          fields: ['Longueur : 517 octets', 'VLAN 20 → Passerelle Administration'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : 3c:22:fb:84:12:10', 'MAC Destination : 00:1a:2b:00:00:01'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source : 192.168.20.10 → Destination : 172.16.0.1', 'TTL : 64 · Protocole : TCP (6)'],
        },
        l4: {
          title: 'Couche 4 · Transmission Control Protocol (TCP)',
          fields: ['59120 → 443 · Flags : [PSH, ACK]', 'Seq : 1 · Ack : 1'],
        },
        l7: {
          title: 'Couche 7 · TLSv1.3 Record Layer (Client Hello)',
          fields: ['SNI : fw-edge.admin.cyberland.local', 'Supported Versions : TLS 1.3 (0x0304)', 'ALPN : h2, http/1.1'],
        },
      },
      hexRows: [
        { offset: '0000', hex: '00 1a 2b 00 00 01 3c 22  fb 84 12 10 08 00', ascii: '..+...<"......', layer: 'l2' },
        { offset: '0010', hex: '45 00 01 f7 63 82 40 00  40 06 51 8a c0 a8 14 0a', ascii: 'E...c.@.@.Q.....', layer: 'l3' },
        { offset: '0020', hex: 'ac 10 00 01 e6 f0 01 bb  00 00 00 01 00 00 00 01', ascii: '................', layer: 'l4' },
        { offset: '0030', hex: '16 03 01 01 c0 01 00 01  bc 03 03 66 77 2d 65 64', ascii: '...........fw-ed', layer: 'l7' },
      ],
    },
  ],

  'conn-sw-fw': [
    {
      templateId: 'trunk-tcp-scan-1',
      linkId: 'conn-sw-fw',
      srcIp: '192.168.10.25',
      srcMac: '00:1a:2b:00:00:01',
      srcPort: 44120,
      dstIp: '10.0.100.20',
      dstMac: '00:1a:2b:ff:00:01',
      dstPort: 445,
      protocol: 'TCP',
      length: 62,
      flags: 'SYN',
      info: '44120 → 445 [SYN] Scan latéral SMB détecté (VLAN 10 → INTERNE)',
      classification: 'anomaly',
      analystNote: 'Tentative de balayage SMB (port 445) depuis un poste LAN vers le serveur interne : signe classique de reconnaissance latérale.',
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap2 · trunk0)',
          fields: ['Longueur : 62 octets', 'Lien Trunk 10 Gbps entre SW-CORE-01 et FW-EDGE-01'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II + 802.1Q VLAN Tag',
          fields: ['MAC Source : 00:1a:2b:00:00:01 · MAC Dst : 00:1a:2b:ff:00:01', '802.1Q VLAN ID : 10 · EtherType : IPv4 (0x0800)'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source : 192.168.10.25 → Destination : 10.0.100.20', 'TTL : 63 (décrémenté par SW-CORE-01)'],
        },
        l4: {
          title: 'Couche 4 · Transmission Control Protocol (TCP)',
          fields: ['44120 → 445 (SMB/CIFS) · Flags : [SYN]', 'Window : 1024 (empreinte Nmap SYN stealth scan)'],
        },
        l7: {
          title: 'Couche 7 · Reconnaissance réseau',
          fields: ['Aucune charge utile : sonde d’ouverture de port SMB non autorisée entre VLAN 10 et Zone Interne.'],
        },
      },
      hexRows: [
        { offset: '0000', hex: '00 1a 2b ff 00 01 00 1a  2b 00 00 01 81 00 00 0a', ascii: '..+.....+.......', layer: 'l2' },
        { offset: '0010', hex: '08 00 45 00 00 2c 41 09  00 00 3f 06 b2 10 c0 a8', ascii: '..E..,A...?.....', layer: 'l3' },
        { offset: '0020', hex: '0a 19 0a 00 64 14 ac 58  01 bd 00 00 00 00 00 02', ascii: '....d..X........', layer: 'l4' },
      ],
    },
    {
      templateId: 'trunk-dns-tunnel-2',
      linkId: 'conn-sw-fw',
      srcIp: '192.168.10.25',
      srcMac: '00:1a:2b:00:00:01',
      srcPort: 61882,
      dstIp: '203.0.113.1',
      dstMac: '00:1a:2b:ff:00:01',
      dstPort: 53,
      protocol: 'DNS',
      length: 138,
      info: 'Standard query 0x99f2 TXT 636f6e666964656e7469656c.exfil.bad-domain.test',
      classification: 'anomaly',
      missionEvidenceId: 'ev-dns-tunnel',
      analystNote: 'Alerte critique : sous-domaine hexadécimal de haute entropie (« 636f6e666964656e7469656c » = "confidentiel" en ASCII) en requête DNS TXT — exfiltration par tunnel DNS !',
      streamTranscript: [
        '>>> REQUÊTE DNS SUSPECTE (UDP/53)',
        'QNAME : 636f6e666964656e7469656c.exfil.bad-domain.test',
        'QTYPE : TXT (16)',
        'Décodage hexadécimal du label : 63 6f 6e 66 69 64 65 6e 74 69 65 6c → "confidentiel"',
        'Recommandation SOC : bloquer exfil.bad-domain.test au résolveur DNS et isoler 192.168.10.25.',
      ],
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap2 · trunk0)',
          fields: ['Longueur capturée : 138 octets', 'Lien Trunk 802.1Q : SW-CORE-01 → FW-EDGE-01'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II + 802.1Q (VLAN 10)',
          fields: ['MAC Source : 00:1a:2b:00:00:01 · MAC Dst : 00:1a:2b:ff:00:01', 'VLAN Tag : 0x8100 (VLAN 10)'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source : 192.168.10.25 → Destination : 203.0.113.1', 'TTL : 63 · Protocole : UDP (17)'],
        },
        l4: {
          title: 'Couche 4 · User Datagram Protocol (UDP)',
          fields: ['Port source : 61882 → Port destination : 53', 'Longueur : 100 octets'],
        },
        l7: {
          title: 'Couche 7 · DNS Query (EXFILTRATION SUSPECTÉE)',
          fields: [
            'Transaction ID : 0x99f2 · Type : TXT (16)',
            'Label encodé : 636f6e666964656e7469656c (ASCII : "confidentiel")',
            'Domaine externe : exfil.bad-domain.test',
          ],
        },
      },
      hexRows: [
        { offset: '0000', hex: '00 1a 2b ff 00 01 00 1a  2b 00 00 01 81 00 00 0a', ascii: '..+.....+.......', layer: 'l2' },
        { offset: '0010', hex: '08 00 45 00 00 78 5c 11  40 00 3f 11 19 88 c0 a8', ascii: '..E..x\\.@.?.....', layer: 'l3' },
        { offset: '0020', hex: '0a 19 cb 00 71 01 f1 ba  00 35 00 64 c2 1e', ascii: '....q....5.d..', layer: 'l4' },
        { offset: '0030', hex: '99 f2 01 00 36 33 36 66  36 65 36 36 2e 65 78 66', ascii: '....636f6e66.exf', layer: 'l7' },
        { offset: '0040', hex: '69 6c 2e 62 61 64 2d 64  6f 6d 61 69 6e 2e 74 65', ascii: 'il.bad-domain.te', layer: 'l7' },
      ],
    },
    {
      templateId: 'trunk-tls-ok-3',
      linkId: 'conn-sw-fw',
      srcIp: '192.168.20.10',
      srcMac: '00:1a:2b:00:00:01',
      srcPort: 59310,
      dstIp: '172.16.50.10',
      dstMac: '00:1a:2b:ff:00:01',
      dstPort: 443,
      protocol: 'TLSv1.3',
      length: 196,
      flags: 'PSH, ACK',
      info: 'Application Data (VLAN 20 → DMZ · Session HTTPS valide)',
      classification: 'encrypted',
      analystNote: 'Flux HTTPS légitime depuis le VLAN Admin vers le serveur Web DMZ.',
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap2 · trunk0)',
          fields: ['Longueur : 196 octets', 'Lien Trunk 802.1Q · VLAN 20'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II + 802.1Q (VLAN 20)',
          fields: ['MAC Source : 00:1a:2b:00:00:01 · MAC Dst : 00:1a:2b:ff:00:01', 'VLAN ID : 20'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source : 192.168.20.10 → Destination : 172.16.50.10', 'TTL : 63 · Protocole : TCP (6)'],
        },
        l4: {
          title: 'Couche 4 · Transmission Control Protocol (TCP)',
          fields: ['59310 → 443 · Flags : [PSH, ACK]'],
        },
        l7: {
          title: 'Couche 7 · TLSv1.3 Application Data',
          fields: ['Flux chiffré AES-256-GCM · Intégrité vérifiée.'],
        },
      },
      hexRows: [
        { offset: '0000', hex: '00 1a 2b ff 00 01 00 1a  2b 00 00 01 81 00 00 14', ascii: '..+.....+.......', layer: 'l2' },
        { offset: '0010', hex: '08 00 45 00 00 b2 82 31  40 00 3f 06 2e 4a c0 a8', ascii: '..E....1@.?..J..', layer: 'l3' },
        { offset: '0020', hex: '14 0a ac 10 32 0a e7 ae  01 bb 00 00 04 90 00 00', ascii: '....2...........', layer: 'l4' },
        { offset: '0030', hex: '17 03 03 00 7e 3b a1 44  99 d0 2c 88 1f 6e c2 5a', ascii: '....~;.D..,..n.Z', layer: 'l7' },
      ],
    },
  ],

  'conn-fw-dmz': [
    {
      templateId: 'dmz-tls-hello-1',
      linkId: 'conn-fw-dmz',
      srcIp: '198.51.100.42',
      srcMac: '00:1a:2b:ff:00:01',
      srcPort: 49210,
      dstIp: '172.16.50.10',
      dstMac: '52:54:00:ab:50:10',
      dstPort: 443,
      protocol: 'TLSv1.3',
      length: 517,
      flags: 'PSH, ACK',
      info: 'Client Hello (SNI=app.cyberland.fr · TLS 1.3)',
      classification: 'encrypted',
      analystNote: 'Négociation HTTPS normale d’un visiteur externe vers le serveur Web DMZ.',
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap3 · dmz0)',
          fields: ['Longueur capturée : 517 octets', 'Zone : DMZ Publique (172.16.50.0/24)'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : 00:1a:2b:ff:00:01 (FW-EDGE-01)', 'MAC Dst : 52:54:00:ab:50:10 (SRV-WEB-DMZ)'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source : 198.51.100.42 → Destination : 172.16.50.10', 'TTL : 54 · Protocole : TCP (6)'],
        },
        l4: {
          title: 'Couche 4 · Transmission Control Protocol (TCP)',
          fields: ['49210 → 443 · Flags : [PSH, ACK]'],
        },
        l7: {
          title: 'Couche 7 · TLSv1.3 Handshake (Client Hello)',
          fields: ['Server Name Indication (SNI) : app.cyberland.fr', 'Version : TLS 1.3 · Key Share : X25519'],
        },
      },
      hexRows: [
        { offset: '0000', hex: '52 54 00 ab 50 10 00 1a  2b ff 00 01 08 00', ascii: 'RT..P...+.....', layer: 'l2' },
        { offset: '0010', hex: '45 00 01 f7 33 19 40 00  36 06 1c 22 c6 33 64 2a', ascii: 'E...3.@.6..".3d*', layer: 'l3' },
        { offset: '0020', hex: 'ac 10 32 0a c0 3a 01 bb  00 00 00 01 00 00 00 01', ascii: '..2..:..........', layer: 'l4' },
        { offset: '0030', hex: '16 03 01 01 c0 61 70 70  2e 63 79 62 65 72 6c 61', ascii: '.....app.cyberla', layer: 'l7' },
      ],
    },
    {
      templateId: 'dmz-http-sqli-2',
      linkId: 'conn-fw-dmz',
      srcIp: '198.51.100.91',
      srcMac: '00:1a:2b:ff:00:01',
      srcPort: 52840,
      dstIp: '172.16.50.10',
      dstMac: '52:54:00:ab:50:10',
      dstPort: 80,
      protocol: 'HTTP',
      length: 284,
      flags: 'PSH, ACK',
      info: "GET /api/users?id=1'%20OR%20'1'='1 HTTP/1.1 [SQLi DÉTECTÉE]",
      classification: 'anomaly',
      missionEvidenceId: 'ev-dmz-sqli',
      analystNote: 'Alerte WAF / Injection SQL : la requête HTTP cible /api/users avec un prédicat tautologique (\' OR \'1\'=\'1) pour contourner le filtre SQL.',
      streamTranscript: [
        '>>> ATTAQUANT 198.51.100.91:52840 → 172.16.50.10:80',
        "GET /api/users?id=1'%20OR%20'1'='1 HTTP/1.1",
        'Host: app.cyberland.fr',
        'User-Agent: sqlmap/1.8.2',
        '',
        '<<< SRV-WEB-DMZ (WAF Nginx) → 198.51.100.91',
        'HTTP/1.1 403 Forbidden',
        'X-WAF-Rule: CRS-942100-SQLI-DETECTED',
      ],
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap3 · dmz0)',
          fields: ['Longueur capturée : 284 octets', 'Lien : FW-EDGE-01 → SRV-WEB-DMZ'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : 00:1a:2b:ff:00:01', 'MAC Destination : 52:54:00:ab:50:10'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source : 198.51.100.91 → Destination : 172.16.50.10', 'TTL : 51 · Protocole : TCP (6)'],
        },
        l4: {
          title: 'Couche 4 · Transmission Control Protocol (TCP)',
          fields: ['52840 → 80 · Flags : [PSH, ACK]', 'Seq : 1 · Ack : 1 · Payload : 218 octets'],
        },
        l7: {
          title: 'Couche 7 · HTTP Request (INJECTION SQL)',
          fields: [
            "URI : /api/users?id=1'%20OR%20'1'='1",
            'User-Agent : sqlmap/1.8.2 (outil automatisé)',
            'Défense attendue : requêtes SQL paramétrées + blocage WAF HTTP 403.',
          ],
        },
      },
      hexRows: [
        { offset: '0000', hex: '52 54 00 ab 50 10 00 1a  2b ff 00 01 08 00', ascii: 'RT..P...+.....', layer: 'l2' },
        { offset: '0010', hex: '45 00 01 0e 9a 40 40 00  33 06 71 a0 c6 33 64 5b', ascii: 'E....@@.3.q..3d[', layer: 'l3' },
        { offset: '0020', hex: 'ac 10 32 0a ce 68 00 50  00 00 00 01 00 00 00 01', ascii: '..2..h.P........', layer: 'l4' },
        { offset: '0030', hex: '47 45 54 20 2f 61 70 69  2f 75 73 65 72 73 3f 69', ascii: 'GET /api/users?i', layer: 'l7' },
        { offset: '0040', hex: '64 3d 31 27 25 32 30 4f  52 25 32 30 27 31 27 3d', ascii: "d=1'%20OR%20'1'=", layer: 'l7' },
      ],
    },
    {
      templateId: 'dmz-http-403-3',
      linkId: 'conn-fw-dmz',
      srcIp: '172.16.50.10',
      srcMac: '52:54:00:ab:50:10',
      srcPort: 80,
      dstIp: '198.51.100.91',
      dstMac: '00:1a:2b:ff:00:01',
      dstPort: 52840,
      protocol: 'HTTP',
      length: 192,
      flags: 'PSH, ACK',
      info: 'HTTP/1.1 403 Forbidden (WAF · Requête SQLi rejetée)',
      classification: 'normal',
      analystNote: 'Réponse défensive du WAF Nginx confirmant le blocage de la requête malveillante.',
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap3 · dmz0)',
          fields: ['Longueur capturée : 192 octets', 'Sens : SRV-WEB-DMZ → FW-EDGE-01'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : 52:54:00:ab:50:10', 'MAC Destination : 00:1a:2b:ff:00:01'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source : 172.16.50.10 → Destination : 198.51.100.91', 'TTL : 64'],
        },
        l4: {
          title: 'Couche 4 · Transmission Control Protocol (TCP)',
          fields: ['80 → 52840 · Flags : [PSH, ACK]'],
        },
        l7: {
          title: 'Couche 7 · HTTP Response',
          fields: ['Status : 403 Forbidden', 'Header : X-WAF-Rule: CRS-942100-SQLI-DETECTED'],
        },
      },
      hexRows: [
        { offset: '0000', hex: '00 1a 2b ff 00 01 52 54  00 ab 50 10 08 00', ascii: '..+...RT..P...', layer: 'l2' },
        { offset: '0010', hex: '45 00 00 b2 22 08 40 00  40 06 d2 09 ac 10 32 0a', ascii: 'E..."@.@.....2.', layer: 'l3' },
        { offset: '0020', hex: 'c6 33 64 5b 00 50 ce 68  00 00 00 01 00 00 00 db', ascii: '.3d[.P.h........', layer: 'l4' },
        { offset: '0030', hex: '48 54 54 50 2f 31 2e 31  20 34 30 33 20 46 6f 72', ascii: 'HTTP/1.1 403 For', layer: 'l7' },
      ],
    },
  ],

  'conn-fw-db': [
    {
      templateId: 'db-pg-ok-1',
      linkId: 'conn-fw-db',
      srcIp: '172.16.50.10',
      srcMac: '00:1a:2b:ff:00:01',
      srcPort: 46812,
      dstIp: '10.0.100.20',
      dstMac: '52:54:00:cd:64:20',
      dstPort: 5432,
      protocol: 'PostgreSQL',
      length: 142,
      flags: 'PSH, ACK',
      info: 'Prepared Statement Execute: SELECT id, title FROM islands WHERE id=$1',
      classification: 'encrypted',
      analystNote: 'Requête PostgreSQL paramétrée légitime provenant du serveur Web DMZ sur le port 5432 (TLS activé).',
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap4 · int0)',
          fields: ['Longueur : 142 octets', 'Segment interne isolé : 10.0.100.0/24'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : 00:1a:2b:ff:00:01', 'MAC Destination : 52:54:00:cd:64:20'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source : 172.16.50.10 → Destination : 10.0.100.20', 'TTL : 63 · Protocole : TCP (6)'],
        },
        l4: {
          title: 'Couche 4 · Transmission Control Protocol (TCP)',
          fields: ['46812 → 5432 (PostgreSQL) · Flags : [PSH, ACK]'],
        },
        l7: {
          title: 'Couche 7 · PostgreSQL Wire Protocol (TLS)',
          fields: ['Opération : Bind / Execute ($1 = 4)', 'Règle pare-feu : ALLOW DMZ(172.16.50.10) → DB:5432'],
        },
      },
      hexRows: [
        { offset: '0000', hex: '52 54 00 cd 64 20 00 1a  2b ff 00 01 08 00', ascii: 'RT..d ..+.....', layer: 'l2' },
        { offset: '0010', hex: '45 00 00 80 18 4a 40 00  3f 06 7a 11 ac 10 32 0a', ascii: 'E....J@.?.z...2.', layer: 'l3' },
        { offset: '0020', hex: '0a 00 64 14 b6 dc 15 38  00 00 01 40 00 00 02 18', ascii: '..d....8...@....', layer: 'l4' },
        { offset: '0030', hex: '50 00 00 00 32 53 45 4c  45 43 54 20 69 64 2c 20', ascii: 'P...2SELECT id, ', layer: 'l7' },
      ],
    },
    {
      templateId: 'db-rst-deny-2',
      linkId: 'conn-fw-db',
      srcIp: '10.0.100.20',
      srcMac: '52:54:00:cd:64:20',
      srcPort: 5432,
      dstIp: '192.168.10.25',
      dstMac: '00:1a:2b:ff:00:01',
      dstPort: 50311,
      protocol: 'TCP',
      length: 54,
      flags: 'RST, ACK',
      info: '5432 → 50311 [RST, ACK] Accès direct poste LAN vers BDD refusé',
      classification: 'anomaly',
      analystNote: 'Un poste utilisateur (192.168.10.25) a tenté d’atteindre directement PostgreSQL : connexion immédiatement réinitialisée (RST).',
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap4 · int0)',
          fields: ['Longueur : 54 octets', 'Lien : SRV-DB-INT → FW-EDGE-01'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : 52:54:00:cd:64:20', 'MAC Destination : 00:1a:2b:ff:00:01'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source : 10.0.100.20 → Destination : 192.168.10.25', 'TTL : 64'],
        },
        l4: {
          title: 'Couche 4 · Transmission Control Protocol (TCP)',
          fields: ['5432 → 50311 · Flags : [RST, ACK]', 'Effet : rupture immédiate de la tentative d’accès non autorisée.'],
        },
        l7: {
          title: 'Couche 7 · Aucune donnée transmise',
          fields: ['Contrôle d’accès réseau (pg_hba.conf + pare-feu) opérationnel.'],
        },
      },
      hexRows: [
        { offset: '0000', hex: '00 1a 2b ff 00 01 52 54  00 cd 64 20 08 00', ascii: '..+...RT..d ..', layer: 'l2' },
        { offset: '0010', hex: '45 00 00 28 00 00 40 00  40 06 e8 c4 0a 00 64 14', ascii: 'E..(..@.@.....d.', layer: 'l3' },
        { offset: '0020', hex: 'c0 a8 0a 19 15 38 c4 87  00 00 00 00 00 00 00 01', ascii: '.....8..........', layer: 'l4' },
      ],
    },
  ],

  'conn-fw-wan': [
    {
      templateId: 'wan-tls-1',
      linkId: 'conn-fw-wan',
      srcIp: '203.0.113.10',
      srcMac: '00:1a:2b:ff:00:01',
      srcPort: 60144,
      dstIp: '142.250.179.78',
      dstMac: 'e8:9a:8f:44:21:01',
      dstPort: 443,
      protocol: 'TLSv1.3',
      length: 214,
      flags: 'PSH, ACK',
      info: 'Application Data (NAT Sortant 203.0.113.10 → HTTPS:443)',
      classification: 'encrypted',
      analystNote: 'Trafic HTTPS sortant standard traduit par NAT/PAT sur l’IP publique du pare-feu (203.0.113.10).',
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap5 · wan0)',
          fields: ['Longueur capturée : 214 octets', 'Lien Uplink WAN : FW-EDGE-01 → Passerelle FAI'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : 00:1a:2b:ff:00:01', 'MAC Destination : e8:9a:8f:44:21:01 (Routeur FAI)'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4 (Post-NAT)',
          fields: ['Source NAT : 203.0.113.10 → Destination : 142.250.179.78', 'TTL : 63 · Protocole : TCP (6)'],
        },
        l4: {
          title: 'Couche 4 · Transmission Control Protocol (TCP)',
          fields: ['60144 → 443 · Flags : [PSH, ACK]'],
        },
        l7: {
          title: 'Couche 7 · TLSv1.3 Application Data',
          fields: ['Connexion sortante légitime chiffrée (port 443).'],
        },
      },
      hexRows: [
        { offset: '0000', hex: 'e8 9a 8f 44 21 01 00 1a  2b ff 00 01 08 00', ascii: '...D!...+.....', layer: 'l2' },
        { offset: '0010', hex: '45 00 00 c8 3a 22 40 00  3f 06 49 71 cb 00 71 0a', ascii: 'E...:"@.?.Iq..q.', layer: 'l3' },
        { offset: '0020', hex: '8e fa b3 4e ea f0 01 bb  00 00 08 12 00 00 10 44', ascii: '...N...........D', layer: 'l4' },
        { offset: '0030', hex: '17 03 03 00 90 a9 2b f1  80 3d 7e 04 c1 5a 12 9b', ascii: '......+..=~..Z..', layer: 'l7' },
      ],
    },
    {
      templateId: 'wan-c2-beacon-2',
      linkId: 'conn-fw-wan',
      srcIp: '203.0.113.10',
      srcMac: '00:1a:2b:ff:00:01',
      srcPort: 57204,
      dstIp: '198.51.100.77',
      dstMac: 'e8:9a:8f:44:21:01',
      dstPort: 8443,
      protocol: 'HTTP',
      length: 268,
      flags: 'PSH, ACK',
      info: 'POST /beacon?host=PC-LAN-01 HTTP/1.1 → 198.51.100.77:8443 [C2 SUSPECT]',
      classification: 'anomaly',
      missionEvidenceId: 'ev-wan-c2',
      analystNote: 'Alerte C2 (Command & Control) : balise périodique sortante sur le port 8443 vers une IP externe non répertoriée (198.51.100.77) annonçant l’hôte PC-LAN-01.',
      streamTranscript: [
        '>>> BALISE C2 SORTANTE (Post-NAT 203.0.113.10 → 198.51.100.77:8443)',
        'POST /beacon?host=PC-LAN-01&interval=30s HTTP/1.1',
        'Host: 198.51.100.77:8443',
        'X-Implant-Id: cyber-implant-09',
        '',
        '{"status":"ready","priv":"user"}',
        '',
        '<<< SERVEUR C2 198.51.100.77:8443',
        'HTTP/1.1 200 OK',
        '{"cmd":"sleep 30"}',
      ],
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap5 · wan0)',
          fields: ['Longueur capturée : 268 octets', 'Lien Uplink WAN : FW-EDGE-01 → Internet'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : 00:1a:2b:ff:00:01', 'MAC Destination : e8:9a:8f:44:21:01'],
        },
        l3: {
          title: 'Couche 3 · Internet Protocol Version 4',
          fields: ['Source NAT : 203.0.113.10 → Destination : 198.51.100.77', 'TTL : 63 · Protocole : TCP (6)'],
        },
        l4: {
          title: 'Couche 4 · Transmission Control Protocol (TCP)',
          fields: ['57204 → 8443 (Port alternatif suspect) · Flags : [PSH, ACK]'],
        },
        l7: {
          title: 'Couche 7 · HTTP Beaconing (C2 MALVEILLANT)',
          fields: [
            'Endpoint : POST /beacon?host=PC-LAN-01',
            'En-tête indicateur (IOC) : X-Implant-Id: cyber-implant-09',
            'Action SOC : bloquer 198.51.100.77 sur FW-EDGE-01 et isoler PC-LAN-01.',
          ],
        },
      },
      hexRows: [
        { offset: '0000', hex: 'e8 9a 8f 44 21 01 00 1a  2b ff 00 01 08 00', ascii: '...D!...+.....', layer: 'l2' },
        { offset: '0010', hex: '45 00 00 fe 77 12 40 00  3f 06 a1 44 cb 00 71 0a', ascii: 'E...w.@.?..D..q.', layer: 'l3' },
        { offset: '0020', hex: 'c6 33 64 4d df 74 20 fb  00 00 00 01 00 00 00 01', ascii: '.3dM.t .........', layer: 'l4' },
        { offset: '0030', hex: '50 4f 53 54 20 2f 62 65  61 63 6f 6e 3f 68 6f 73', ascii: 'POST /beacon?hos', layer: 'l7' },
        { offset: '0040', hex: '74 3d 50 43 2d 4c 41 4e  2d 30 31 20 48 54 54 50', ascii: 't=PC-LAN-01 HTTP', layer: 'l7' },
      ],
    },
    {
      templateId: 'wan-icmp-3',
      linkId: 'conn-fw-wan',
      srcIp: '203.0.113.1',
      srcMac: 'e8:9a:8f:44:21:01',
      dstIp: '203.0.113.10',
      dstMac: '00:1a:2b:ff:00:01',
      protocol: 'ICMP',
      length: 70,
      info: 'Echo (ping) reply id=0x110a, seq=4/1024, ttl=59',
      classification: 'normal',
      analystNote: 'Réponse ICMP Echo Reply de la sonde de supervision WAN (latence 11 ms).',
      layers: {
        l1: {
          title: 'Couche 1 · Interface TAP (tap5 · wan0)',
          fields: ['Longueur capturée : 70 octets', 'Sens : Internet → FW-EDGE-01'],
        },
        l2: {
          title: 'Couche 2 · Ethernet II',
          fields: ['MAC Source : e8:9a:8f:44:21:01', 'MAC Destination : 00:1a:2b:ff:00:01'],
        },
        l3: {
          title: 'Couche 3 · IPv4 + ICMP',
          fields: ['Source : 203.0.113.1 → Destination : 203.0.113.10', 'Type : 0 (Echo Reply) · TTL : 59'],
        },
        l4: {
          title: 'Couche 4 · ICMP Supervision',
          fields: ['Identifier : 0x110a · Sequence : 4'],
        },
        l7: {
          title: 'Couche 7 · Non applicable',
          fields: ['Contrôle de disponibilité du lien Internet.'],
        },
      },
      hexRows: [
        { offset: '0000', hex: '00 1a 2b ff 00 01 e8 9a  8f 44 21 01 08 00', ascii: '..+......D!...', layer: 'l2' },
        { offset: '0010', hex: '45 00 00 38 19 02 00 00  3b 01 6a 8c cb 00 71 01', ascii: 'E..8....;.j...q.', layer: 'l3' },
        { offset: '0020', hex: 'cb 00 71 0a 00 00 55 12  11 0a 00 04', ascii: '..q...U.....', layer: 'l4' },
      ],
    },
  ],
};
