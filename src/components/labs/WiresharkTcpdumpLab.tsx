import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Terminal,
  Eye,
  Filter,
  Layers,
  ShieldAlert,
  Lock,
  FileDown,
  Columns2,
  CheckCircle2,
} from 'lucide-react';
import { playClick, playPacket, playSuccess } from '../../utils/sound';

export interface CapturedPacket {
  id: number;
  time: string;
  srcIp: string;
  srcMac: string;
  srcPort?: number;
  dstIp: string;
  dstMac: string;
  dstPort?: number;
  protocol: 'DNS' | 'TCP' | 'HTTP' | 'TLSv1.3' | 'ICMP' | 'TELNET';
  length: number;
  flags?: string;
  info: string;
  severity?: 'normal' | 'warning' | 'danger' | 'secure';
  layers: {
    l1: string[];
    l2: string[];
    l3: string[];
    l4: string[];
    l7: string[];
  };
  hexRows: { offset: string; hex: string; ascii: string; layer: 'l2' | 'l3' | 'l4' | 'l7' }[];
  tcpdumpLine: string;
  tcpdumpVerbose: string;
  streamId?: 'http-login' | 'tls-bank' | 'telnet-intrusion';
  streamLine?: string;
}

export const PACKET_SCENARIO: CapturedPacket[] = [
  {
    id: 1,
    time: '0.000000',
    srcIp: '192.168.1.24',
    srcMac: 'a4:5e:60:c1:09:b2',
    srcPort: 51422,
    dstIp: '192.168.1.53',
    dstMac: '00:1a:2b:3c:4d:53',
    dstPort: 53,
    protocol: 'DNS',
    length: 78,
    info: 'Standard query 0x4a1f A portail.cyberland.gem',
    severity: 'normal',
    layers: {
      l1: ['Interface : eth0 (Mode Promiscuité actif)', 'Taille capturée : 78 octets sur le fil'],
      l2: ['Ethernet II · Src: a4:5e:60:c1:09:b2 · Dst: 00:1a:2b:3c:4d:53', 'EtherType : IPv4 (0x0800)'],
      l3: ['IPv4 · Src: 192.168.1.24 → Dst: 192.168.1.53', 'TTL: 64 · Protocole: UDP (17)'],
      l4: ['UDP · Port source: 51422 → Port destination: 53', 'Longueur: 44 octets · Checksum: valide'],
      l7: ['DNS Query · ID: 0x4a1f · Type: A (IPv4)', 'Nom demandé : portail.cyberland.gem'],
    },
    hexRows: [
      { offset: '0000', hex: '00 1a 2b 3c 4d 53 a4 5e  60 c1 09 b2 08 00', ascii: '..+<MS.^`.....', layer: 'l2' },
      { offset: '0010', hex: '45 00 00 40 1c 46 40 00  40 11 b1 e6 c0 a8 01 18', ascii: 'E..@.F@.@.......', layer: 'l3' },
      { offset: '0020', hex: 'c0 a8 01 35 c8 de 00 35  00 2c 8f 1a', ascii: '...5...5.,..', layer: 'l4' },
      { offset: '0030', hex: '4a 1f 01 00 00 01 70 6f  72 74 61 69 6c 2e 67 65', ascii: 'J.....portail.ge', layer: 'l7' },
    ],
    tcpdumpLine: '10:14:01.000000 IP 192.168.1.24.51422 > 192.168.1.53.53: 18975+ A? portail.cyberland.gem. (39)',
    tcpdumpVerbose: '    [ttl 64, id 7238, proto UDP (17), len 64] Query A? portail.cyberland.gem',
  },
  {
    id: 2,
    time: '0.004120',
    srcIp: '192.168.1.53',
    srcMac: '00:1a:2b:3c:4d:53',
    srcPort: 53,
    dstIp: '192.168.1.24',
    dstMac: 'a4:5e:60:c1:09:b2',
    dstPort: 51422,
    protocol: 'DNS',
    length: 94,
    info: 'Standard query response 0x4a1f A 10.0.2.50',
    severity: 'normal',
    layers: {
      l1: ['Interface : eth0 · Taille capturée : 94 octets'],
      l2: ['Ethernet II · Src: 00:1a:2b:3c:4d:53 · Dst: a4:5e:60:c1:09:b2'],
      l3: ['IPv4 · Src: 192.168.1.53 → Dst: 192.168.1.24 · TTL: 64'],
      l4: ['UDP · Port source: 53 → Port destination: 51422'],
      l7: ['DNS Response · ID: 0x4a1f · Réponse : portail.cyberland.gem → 10.0.2.50'],
    },
    hexRows: [
      { offset: '0000', hex: 'a4 5e 60 c1 09 b2 00 1a  2b 3c 4d 53 08 00', ascii: '.^`.....+<MS..', layer: 'l2' },
      { offset: '0010', hex: '45 00 00 50 22 09 00 00  40 11 a9 12 c0 a8 01 35', ascii: 'E..P"...@......5', layer: 'l3' },
      { offset: '0020', hex: 'c0 a8 01 18 00 35 c8 de  00 3c 1b 04', ascii: '.....5...<..', layer: 'l4' },
      { offset: '0030', hex: '4a 1f 81 80 00 01 00 01  0a 00 02 32', ascii: 'J..........2', layer: 'l7' },
    ],
    tcpdumpLine: '10:14:01.004120 IP 192.168.1.53.53 > 192.168.1.24.51422: 18975 1/0/0 A 10.0.2.50 (55)',
    tcpdumpVerbose: '    [ttl 64, proto UDP (17)] Answer: portail.cyberland.gem -> 10.0.2.50 (TTL 300s)',
  },
  {
    id: 3,
    time: '0.011400',
    srcIp: '192.168.1.24',
    srcMac: 'a4:5e:60:c1:09:b2',
    srcPort: 54012,
    dstIp: '10.0.2.50',
    dstMac: '00:1a:2b:00:00:01',
    dstPort: 80,
    protocol: 'TCP',
    length: 74,
    flags: 'SYN',
    info: '54012 → 80 [SYN] Seq=0 Win=64240 MSS=1460',
    severity: 'normal',
    layers: {
      l1: ['Interface : eth0 · Taille capturée : 74 octets'],
      l2: ['Ethernet II · Dst passerelle routeur: 00:1a:2b:00:00:01'],
      l3: ['IPv4 · Src: 192.168.1.24 → Dst: 10.0.2.50 · Protocole: TCP (6)'],
      l4: ['TCP · 54012 → 80 · Drapeau [SYN] (Étape 1/3 du Three-Way Handshake)', 'Seq=0 · Window=64240'],
      l7: ['Aucune charge utile applicative (négociation de connexion)'],
    },
    hexRows: [
      { offset: '0000', hex: '00 1a 2b 00 00 01 a4 5e  60 c1 09 b2 08 00', ascii: '..+....^`.....', layer: 'l2' },
      { offset: '0010', hex: '45 00 00 3c 8a 11 40 00  40 06 72 c1 c0 a8 01 18', ascii: 'E..<..@.@.r.....', layer: 'l3' },
      { offset: '0020', hex: '0a 00 02 32 d2 fc 00 50  00 00 00 00 00 02 fa f0', ascii: '...2...P........', layer: 'l4' },
    ],
    tcpdumpLine: '10:14:01.011400 IP 192.168.1.24.54012 > 10.0.2.50.80: Flags [S], seq 1049201, win 64240, length 0',
    tcpdumpVerbose: '    [ttl 64, DF, proto TCP (6)] TCP Handshake 1/3: SYN (demande ouverture port 80)',
    streamId: 'http-login',
  },
  {
    id: 4,
    time: '0.023890',
    srcIp: '10.0.2.50',
    srcMac: '00:1a:2b:00:00:01',
    srcPort: 80,
    dstIp: '192.168.1.24',
    dstMac: 'a4:5e:60:c1:09:b2',
    dstPort: 54012,
    protocol: 'TCP',
    length: 74,
    flags: 'SYN, ACK',
    info: '80 → 54012 [SYN, ACK] Seq=0 Ack=1 Win=65160',
    severity: 'normal',
    layers: {
      l1: ['Interface : eth0 · Taille capturée : 74 octets'],
      l2: ['Ethernet II · Src passerelle: 00:1a:2b:00:00:01 · Dst: a4:5e:60:c1:09:b2'],
      l3: ['IPv4 · Src: 10.0.2.50 → Dst: 192.168.1.24 · TTL: 58'],
      l4: ['TCP · 80 → 54012 · Drapeaux [SYN, ACK] (Étape 2/3 du Handshake)', 'Seq=0 · Ack=1'],
      l7: ['Aucune charge utile applicative'],
    },
    hexRows: [
      { offset: '0000', hex: 'a4 5e 60 c1 09 b2 00 1a  2b 00 00 01 08 00', ascii: '.^`.....+.....', layer: 'l2' },
      { offset: '0010', hex: '45 00 00 3c 00 00 40 00  3a 06 fc d2 0a 00 02 32', ascii: 'E..<..@.:......2', layer: 'l3' },
      { offset: '0020', hex: 'c0 a8 01 18 00 50 d2 fc  00 00 00 01 00 12 fe 88', ascii: '.....P..........', layer: 'l4' },
    ],
    tcpdumpLine: '10:14:01.023890 IP 10.0.2.50.80 > 192.168.1.24.54012: Flags [S.], seq 392011, ack 1049202, win 65160, length 0',
    tcpdumpVerbose: '    [ttl 58, proto TCP (6)] TCP Handshake 2/3: SYN+ACK (le serveur accepte)',
    streamId: 'http-login',
  },
  {
    id: 5,
    time: '0.024310',
    srcIp: '192.168.1.24',
    srcMac: 'a4:5e:60:c1:09:b2',
    srcPort: 54012,
    dstIp: '10.0.2.50',
    dstMac: '00:1a:2b:00:00:01',
    dstPort: 80,
    protocol: 'TCP',
    length: 66,
    flags: 'ACK',
    info: '54012 → 80 [ACK] Seq=1 Ack=1 Win=64240',
    severity: 'normal',
    layers: {
      l1: ['Interface : eth0 · Taille capturée : 66 octets'],
      l2: ['Ethernet II · Src: a4:5e:60:c1:09:b2 · Dst: 00:1a:2b:00:00:01'],
      l3: ['IPv4 · Src: 192.168.1.24 → Dst: 10.0.2.50 · TTL: 64'],
      l4: ['TCP · 54012 → 80 · Drapeau [ACK] (Étape 3/3 — Connexion établie !)'],
      l7: ['Tunnel TCP prêt à transporter les requêtes HTTP'],
    },
    hexRows: [
      { offset: '0000', hex: '00 1a 2b 00 00 01 a4 5e  60 c1 09 b2 08 00', ascii: '..+....^`.....', layer: 'l2' },
      { offset: '0010', hex: '45 00 00 34 8a 12 40 00  40 06 72 c8 c0 a8 01 18', ascii: 'E..4..@.@.r.....', layer: 'l3' },
      { offset: '0020', hex: '0a 00 02 32 d2 fc 00 50  00 00 00 01 00 10 fa f0', ascii: '...2...P........', layer: 'l4' },
    ],
    tcpdumpLine: '10:14:01.024310 IP 192.168.1.24.54012 > 10.0.2.50.80: Flags [.], ack 1, win 64240, length 0',
    tcpdumpVerbose: '    [ttl 64, proto TCP (6)] TCP Handshake 3/3: ACK (session ouverte)',
    streamId: 'http-login',
  },
  {
    id: 6,
    time: '0.031900',
    srcIp: '192.168.1.24',
    srcMac: 'a4:5e:60:c1:09:b2',
    srcPort: 54012,
    dstIp: '10.0.2.50',
    dstMac: '00:1a:2b:00:00:01',
    dstPort: 80,
    protocol: 'HTTP',
    length: 214,
    flags: 'PSH, ACK',
    info: 'POST /login HTTP/1.1 (user=camille&pass=Phare2026! — EN CLAIR !)',
    severity: 'warning',
    layers: {
      l1: ['Interface : eth0 · Taille capturée : 214 octets'],
      l2: ['Ethernet II · Src: a4:5e:60:c1:09:b2 · Dst: 00:1a:2b:00:00:01'],
      l3: ['IPv4 · Src: 192.168.1.24 → Dst: 10.0.2.50 · TTL: 64'],
      l4: ['TCP · 54012 → 80 · Drapeaux [PSH, ACK] · Port 80 NON chiffré !'],
      l7: [
        'HTTP/1.1 · Méthode : POST /login',
        'Host: portail.cyberland.gem',
        'Alerte sécurité : corps lisible en clair → user=camille&pass=Phare2026!',
      ],
    },
    hexRows: [
      { offset: '0000', hex: '00 1a 2b 00 00 01 a4 5e  60 c1 09 b2 08 00', ascii: '..+....^`.....', layer: 'l2' },
      { offset: '0010', hex: '45 00 00 c8 8a 13 40 00  40 06 72 33 c0 a8 01 18', ascii: 'E.....@.@.r3....', layer: 'l3' },
      { offset: '0020', hex: '0a 00 02 32 d2 fc 00 50  00 00 00 01 50 18 fa f0', ascii: '...2...P....P...', layer: 'l4' },
      { offset: '0030', hex: '50 4f 53 54 20 2f 6c 6f  67 69 6e 20 75 73 65 72', ascii: 'POST /login user', layer: 'l7' },
      { offset: '0040', hex: '3d 63 61 6d 69 6c 6c 65  26 70 61 73 73 3d 50 68', ascii: '=camille&pass=Ph', layer: 'l7' },
    ],
    tcpdumpLine: '10:14:01.031900 IP 192.168.1.24.54012 > 10.0.2.50.80: Flags [P.], seq 1:149, ack 1, length 148: HTTP: POST /login HTTP/1.1',
    tcpdumpVerbose: '    [ATTENTION HTTP port 80 en clair] Body: user=camille&pass=Phare2026!',
    streamId: 'http-login',
    streamLine: 'CLIENT → SERVEUR (HTTP 80) : POST /login HTTP/1.1 | user=camille&pass=Phare2026!',
  },
  {
    id: 7,
    time: '0.045120',
    srcIp: '10.0.2.50',
    srcMac: '00:1a:2b:00:00:01',
    srcPort: 80,
    dstIp: '192.168.1.24',
    dstMac: 'a4:5e:60:c1:09:b2',
    dstPort: 54012,
    protocol: 'HTTP',
    length: 148,
    flags: 'PSH, ACK',
    info: 'HTTP/1.1 200 OK (application/json)',
    severity: 'warning',
    layers: {
      l1: ['Interface : eth0 · Taille capturée : 148 octets'],
      l2: ['Ethernet II · Src: 00:1a:2b:00:00:01 · Dst: a4:5e:60:c1:09:b2'],
      l3: ['IPv4 · Src: 10.0.2.50 → Dst: 192.168.1.24 · TTL: 58'],
      l4: ['TCP · 80 → 54012 · Drapeaux [PSH, ACK]'],
      l7: ['HTTP/1.1 200 OK · Set-Cookie: session=abc982 (non chiffré !)'],
    },
    hexRows: [
      { offset: '0000', hex: 'a4 5e 60 c1 09 b2 00 1a  2b 00 00 01 08 00', ascii: '.^`.....+.....', layer: 'l2' },
      { offset: '0010', hex: '45 00 00 86 1b 02 40 00  3a 06 e1 85 0a 00 02 32', ascii: 'E.....@.:......2', layer: 'l3' },
      { offset: '0020', hex: 'c0 a8 01 18 00 50 d2 fc  00 00 00 01 50 18 fe 88', ascii: '.....P......P...', layer: 'l4' },
      { offset: '0030', hex: '48 54 54 50 2f 31 2e 31  20 32 30 30 20 4f 4b 0d', ascii: 'HTTP/1.1 200 OK.', layer: 'l7' },
    ],
    tcpdumpLine: '10:14:01.045120 IP 10.0.2.50.80 > 192.168.1.24.54012: Flags [P.], seq 1:83, ack 149, length 82: HTTP: HTTP/1.1 200 OK',
    tcpdumpVerbose: '    [HTTP 200 OK] Set-Cookie: session=abc982 (interceptable sur le réseau !)',
    streamId: 'http-login',
    streamLine: 'SERVEUR → CLIENT (HTTP 80) : HTTP/1.1 200 OK | Set-Cookie: session=abc982',
  },
  {
    id: 8,
    time: '0.078500',
    srcIp: '192.168.1.24',
    srcMac: 'a4:5e:60:c1:09:b2',
    srcPort: 54108,
    dstIp: '10.0.2.88',
    dstMac: '00:1a:2b:00:00:01',
    dstPort: 443,
    protocol: 'TLSv1.3',
    length: 296,
    flags: 'PSH, ACK',
    info: 'Application Data (HTTPS chiffré AES-256-GCM — contenu illisible)',
    severity: 'secure',
    layers: {
      l1: ['Interface : eth0 · Taille capturée : 296 octets'],
      l2: ['Ethernet II · Src: a4:5e:60:c1:09:b2 · Dst: 00:1a:2b:00:00:01'],
      l3: ['IPv4 · Src: 192.168.1.24 → Dst: 10.0.2.88 · TTL: 64'],
      l4: ['TCP · 54108 → 443 (HTTPS) · Drapeaux [PSH, ACK]'],
      l7: [
        'TLSv1.3 Record Layer : Application Data Protocol: http-over-tls',
        'Charge utile chiffrée (AES-256-GCM) : impossible à lire sans la clé de session !',
      ],
    },
    hexRows: [
      { offset: '0000', hex: '00 1a 2b 00 00 01 a4 5e  60 c1 09 b2 08 00', ascii: '..+....^`.....', layer: 'l2' },
      { offset: '0010', hex: '45 00 01 1a 90 44 40 00  40 06 6b a8 c0 a8 01 18', ascii: 'E....D@.@.k.....', layer: 'l3' },
      { offset: '0020', hex: '0a 00 02 58 d3 5c 01 bb  00 00 01 44 50 18 fa f0', ascii: '...X.\\.....DP...', layer: 'l4' },
      { offset: '0030', hex: '17 03 03 00 e2 f9 8c 3b  a1 4e d0 9b 72 e4 19 6a', ascii: '.......;.N..r..j', layer: 'l7' },
    ],
    tcpdumpLine: '10:14:01.078500 IP 192.168.1.24.54108 > 10.0.2.88.443: Flags [P.], seq 1:231, ack 1, length 230',
    tcpdumpVerbose: '    [HTTPS TLSv1.3 port 443] Payload chiffré (230 octets aléatoires illisibles)',
    streamId: 'tls-bank',
    streamLine: 'CLIENT ↔ SERVEUR (HTTPS 443) : 17 03 03 f9 8c 3b a1 4e d0 9b 72 e4 [CHIFFRÉ TLS 1.3]',
  },
  {
    id: 9,
    time: '0.112400',
    srcIp: '192.168.1.24',
    srcMac: 'a4:5e:60:c1:09:b2',
    dstIp: '10.0.2.50',
    dstMac: '00:1a:2b:00:00:01',
    protocol: 'ICMP',
    length: 98,
    info: 'Echo (ping) request id=0x03a1, seq=1/256, ttl=64',
    severity: 'normal',
    layers: {
      l1: ['Interface : eth0 · Taille capturée : 98 octets'],
      l2: ['Ethernet II · Src: a4:5e:60:c1:09:b2 · Dst: 00:1a:2b:00:00:01'],
      l3: ['IPv4 · Src: 192.168.1.24 → Dst: 10.0.2.50 · Protocole: ICMP (1)'],
      l4: ['ICMP opère en Couche 3 (pas de port TCP/UDP)'],
      l7: ['ICMP Type 8 (Echo Request) · Code 0 · Séquence 1'],
    },
    hexRows: [
      { offset: '0000', hex: '00 1a 2b 00 00 01 a4 5e  60 c1 09 b2 08 00', ascii: '..+....^`.....', layer: 'l2' },
      { offset: '0010', hex: '45 00 00 54 b2 01 40 00  40 01 4a c2 c0 a8 01 18', ascii: 'E..T..@.@.J.....', layer: 'l3' },
      { offset: '0020', hex: '08 00 4d 5b 03 a1 00 01  63 79 62 65 72 6c 61 6e', ascii: '..M[....cyberlan', layer: 'l7' },
    ],
    tcpdumpLine: '10:14:01.112400 IP 192.168.1.24 > 10.0.2.50: ICMP echo request, id 929, seq 1, length 64',
    tcpdumpVerbose: '    [ttl 64, proto ICMP (1)] Diagnostic ping envoyé vers 10.0.2.50',
  },
  {
    id: 10,
    time: '0.125100',
    srcIp: '10.0.2.50',
    srcMac: '00:1a:2b:00:00:01',
    dstIp: '192.168.1.24',
    dstMac: 'a4:5e:60:c1:09:b2',
    protocol: 'ICMP',
    length: 98,
    info: 'Echo (ping) reply id=0x03a1, seq=1/256, rtt=12.7 ms',
    severity: 'normal',
    layers: {
      l1: ['Interface : eth0 · Taille capturée : 98 octets'],
      l2: ['Ethernet II · Src: 00:1a:2b:00:00:01 · Dst: a4:5e:60:c1:09:b2'],
      l3: ['IPv4 · Src: 10.0.2.50 → Dst: 192.168.1.24 · TTL: 58'],
      l4: ['ICMP opère en Couche 3 (pas de port TCP/UDP)'],
      l7: ['ICMP Type 0 (Echo Reply) · Temps aller-retour : 12,7 ms'],
    },
    hexRows: [
      { offset: '0000', hex: 'a4 5e 60 c1 09 b2 00 1a  2b 00 00 01 08 00', ascii: '.^`.....+.....', layer: 'l2' },
      { offset: '0010', hex: '45 00 00 54 11 c4 00 00  3a 01 31 04 0a 00 02 32', ascii: 'E..T....:.1....2', layer: 'l3' },
      { offset: '0020', hex: '00 00 55 5b 03 a1 00 01  63 79 62 65 72 6c 61 6e', ascii: '..U[....cyberlan', layer: 'l7' },
    ],
    tcpdumpLine: '10:14:01.125100 IP 10.0.2.50 > 192.168.1.24: ICMP echo reply, id 929, seq 1, length 64',
    tcpdumpVerbose: '    [ttl 58, proto ICMP (1)] Réponse ping reçue en 12.7 ms',
  },
  {
    id: 11,
    time: '0.168000',
    srcIp: '185.220.101.9',
    srcMac: 'de:ad:be:ef:00:99',
    srcPort: 49110,
    dstIp: '10.0.2.50',
    dstMac: '00:1a:2b:00:00:01',
    dstPort: 23,
    protocol: 'TELNET',
    length: 74,
    flags: 'SYN',
    info: '49110 → 23 [SYN] Tentative administration Telnet en clair !',
    severity: 'danger',
    layers: {
      l1: ['Interface : eth0 · Taille capturée : 74 octets'],
      l2: ['Ethernet II · Src: de:ad:be:ef:00:99 · Dst: 00:1a:2b:00:00:01'],
      l3: ['IPv4 · Src externe suspecte: 185.220.101.9 → Dst: 10.0.2.50'],
      l4: ['TCP · 49110 → 23 (Telnet) · Drapeau [SYN] — Port obsolète et dangereux !'],
      l7: ['Alerte SOC : scan ou tentative d’intrusion sur le port 23 (non chiffré)'],
    },
    hexRows: [
      { offset: '0000', hex: '00 1a 2b 00 00 01 de ad  be ef 00 99 08 00', ascii: '..+...........', layer: 'l2' },
      { offset: '0010', hex: '45 00 00 3c 44 09 40 00  2f 06 11 a0 b9 dc 65 09', ascii: 'E..<D.@./.....e.', layer: 'l3' },
      { offset: '0020', hex: '0a 00 02 32 bf d6 00 17  00 00 00 00 00 02 72 10', ascii: '...2..........r.', layer: 'l4' },
    ],
    tcpdumpLine: '10:14:01.168000 IP 185.220.101.9.49110 > 10.0.2.50.23: Flags [S], seq 982100, win 29200, length 0',
    tcpdumpVerbose: '    [ALERTE PORT 23 TELNET] Scan externe depuis 185.220.101.9 vers port 23',
    streamId: 'telnet-intrusion',
    streamLine: 'INTRUS (185.220.101.9) → PORT 23 (Telnet) : [SYN] Tentative bloquée par le pare-feu [RST]',
  },
  {
    id: 12,
    time: '0.168450',
    srcIp: '10.0.2.50',
    srcMac: '00:1a:2b:00:00:01',
    srcPort: 23,
    dstIp: '185.220.101.9',
    dstMac: 'de:ad:be:ef:00:99',
    dstPort: 49110,
    protocol: 'TELNET',
    length: 60,
    flags: 'RST, ACK',
    info: '23 → 49110 [RST, ACK] Connexion refusée par le pare-feu',
    severity: 'danger',
    layers: {
      l1: ['Interface : eth0 · Taille capturée : 60 octets'],
      l2: ['Ethernet II · Src: 00:1a:2b:00:00:01 · Dst: de:ad:be:ef:00:99'],
      l3: ['IPv4 · Src: 10.0.2.50 → Dst: 185.220.101.9'],
      l4: ['TCP · 23 → 49110 · Drapeaux [RST, ACK] (Port fermé / bloqué)'],
      l7: ['Le pare-feu de Cyberland a rejeté la connexion Telnet'],
    },
    hexRows: [
      { offset: '0000', hex: 'de ad be ef 00 99 00 1a  2b 00 00 01 08 00', ascii: '........+.....', layer: 'l2' },
      { offset: '0010', hex: '45 00 00 28 00 00 40 00  40 06 44 b1 0a 00 02 32', ascii: 'E..(....@.D....2', layer: 'l3' },
      { offset: '0020', hex: 'b9 dc 65 09 00 17 bf d6  00 00 00 00 50 14 00 00', ascii: '..e.........P...', layer: 'l4' },
    ],
    tcpdumpLine: '10:14:01.168450 IP 10.0.2.50.23 > 185.220.101.9.49110: Flags [R.], seq 0, ack 982101, win 0, length 0',
    tcpdumpVerbose: '    [PARE-FEU] Rejet immédiat [RST, ACK] sur port 23',
    streamId: 'telnet-intrusion',
  },
];

export function matchesDisplayFilter(pkt: CapturedPacket, rawFilter: string): { valid: boolean; match: boolean } {
  const f = rawFilter.trim().toLowerCase();
  if (!f) return { valid: true, match: true };
  if (f === 'dns') return { valid: true, match: pkt.protocol === 'DNS' };
  if (f === 'http') return { valid: true, match: pkt.protocol === 'HTTP' };
  if (f === 'tls' || f === 'ssl' || f === 'https') return { valid: true, match: pkt.protocol === 'TLSv1.3' };
  if (f === 'icmp') return { valid: true, match: pkt.protocol === 'ICMP' };
  if (f === 'tcp') return { valid: true, match: pkt.protocol !== 'DNS' && pkt.protocol !== 'ICMP' };
  if (f === 'udp') return { valid: true, match: pkt.protocol === 'DNS' };
  if (f === 'telnet' || f === 'tcp.port == 23') {
    return { valid: true, match: pkt.srcPort === 23 || pkt.dstPort === 23 };
  }
  if (f === 'tcp.port == 80') return { valid: true, match: pkt.srcPort === 80 || pkt.dstPort === 80 };
  if (f === 'tcp.port == 443') return { valid: true, match: pkt.srcPort === 443 || pkt.dstPort === 443 };
  if (f === 'tcp.flags.syn == 1') return { valid: true, match: Boolean(pkt.flags?.includes('SYN')) };
  if (f.startsWith('ip.addr == ')) {
    const ip = f.replace('ip.addr == ', '').trim();
    return { valid: true, match: pkt.srcIp === ip || pkt.dstIp === ip };
  }
  // Fallback keyword search on protocol/info/IP
  const knownPrefixes = ['dns', 'http', 'tls', 'icmp', 'tcp', 'udp', 'telnet', 'ip.', '192.', '10.', '185.'];
  const looksValid = knownPrefixes.some((p) => f.startsWith(p));
  if (!looksValid) return { valid: false, match: true };
  return {
    valid: true,
    match:
      pkt.protocol.toLowerCase().includes(f) ||
      pkt.info.toLowerCase().includes(f) ||
      pkt.srcIp.includes(f) ||
      pkt.dstIp.includes(f),
  };
}

type BpfPreset = 'all' | 'port 80' | 'port 443' | 'port 53' | 'icmp' | 'port 23';

function matchesBpf(pkt: CapturedPacket, bpf: BpfPreset): boolean {
  if (bpf === 'all') return true;
  if (bpf === 'port 80') return pkt.srcPort === 80 || pkt.dstPort === 80;
  if (bpf === 'port 443') return pkt.srcPort === 443 || pkt.dstPort === 443;
  if (bpf === 'port 53') return pkt.srcPort === 53 || pkt.dstPort === 53;
  if (bpf === 'port 23') return pkt.srcPort === 23 || pkt.dstPort === 23;
  if (bpf === 'icmp') return pkt.protocol === 'ICMP';
  return true;
}

export const WiresharkTcpdumpLab: React.FC = () => {
  const [capturing, setCapturing] = useState(true);
  const [capturedCount, setCapturedCount] = useState(4);
  const [viewMode, setViewMode] = useState<'both' | 'wireshark' | 'tcpdump'>('both');
  const [displayFilter, setDisplayFilter] = useState('');
  const [selectedPacketId, setSelectedPacketId] = useState<number>(6);
  const [activeLayer, setActiveLayer] = useState<'l2' | 'l3' | 'l4' | 'l7'>('l7');
  const [showFollowStream, setShowFollowStream] = useState(false);

  // tcpdump CLI options
  const [flagNumeric, setFlagNumeric] = useState(true);
  const [flagVerbose, setFlagVerbose] = useState(false);
  const [flagWritePcap, setFlagWritePcap] = useState(true);
  const [bpfPreset, setBpfPreset] = useState<BpfPreset>('all');
  const [exportedPcap, setExportedPcap] = useState(false);

  // Continuous live packet animation
  useEffect(() => {
    if (!capturing) return;
    const timer = window.setInterval(() => {
      setCapturedCount((prev) => {
        if (prev >= PACKET_SCENARIO.length) {
          setCapturing(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1150);
    return () => window.clearInterval(timer);
  }, [capturing]);

  const capturedPackets = useMemo(
    () => PACKET_SCENARIO.slice(0, capturedCount),
    [capturedCount]
  );

  // BPF filters at capture time (kernel level)
  const bpfCapturedPackets = useMemo(
    () => capturedPackets.filter((p) => matchesBpf(p, bpfPreset)),
    [capturedPackets, bpfPreset]
  );

  // Wireshark Display filter applies AFTER capture (non-destructive)
  const filterState = useMemo(() => {
    const sampleCheck = matchesDisplayFilter(PACKET_SCENARIO[0], displayFilter);
    const list = bpfCapturedPackets.filter((p) => matchesDisplayFilter(p, displayFilter).match);
    return { valid: sampleCheck.valid, list };
  }, [bpfCapturedPackets, displayFilter]);

  const selectedPacket =
    filterState.list.find((p) => p.id === selectedPacketId) ??
    filterState.list[filterState.list.length - 1] ??
    bpfCapturedPackets[0] ??
    PACKET_SCENARIO[0];

  const tcpdumpCommand = [
    'sudo tcpdump -i eth0',
    flagNumeric ? '-nn' : '',
    flagVerbose ? '-v' : '',
    bpfPreset !== 'all' ? bpfPreset : '',
    flagWritePcap ? '-w capture_cyberland.pcap' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleRestartCapture = () => {
    playPacket();
    setCapturedCount(1);
    setCapturing(true);
  };

  const handleStepPacket = () => {
    playPacket();
    setCapturing(false);
    setCapturedCount((prev) => Math.min(PACKET_SCENARIO.length, prev + 1));
  };

  const handleDownloadTrace = () => {
    playSuccess();
    const lines = [
      `# Extrait pédagogique Cyberland — ${tcpdumpCommand}`,
      `# Paquets capturés : ${bpfCapturedPackets.length}`,
      '',
      ...bpfCapturedPackets.map((p) => `${p.tcpdumpLine}\n${p.tcpdumpVerbose}`),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capture-cyberland-tcpdump.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportedPcap(true);
    window.setTimeout(() => setExportedPcap(false), 2200);
  };

  const latestPacket = capturedPackets[capturedPackets.length - 1];

  return (
    <div className="space-y-6">
      {/* Header + Animated Capture Pipeline Diagram */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
              Laboratoire animé · Capture réseau &amp; Dissection de trames
            </p>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              Simulateur Wireshark &amp; tcpdump en direct
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Observez les paquets traverser la carte réseau <code className="font-mono">eth0</code>,
              filtrez-les au niveau noyau (<strong>BPF / tcpdump</strong>) ou à l&apos;affichage
              (<strong>Wireshark</strong>) et inspectez chaque couche OSI jusqu&apos;aux octets bruts.
            </p>
          </div>

          {/* Playback & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playClick();
                if (capturedCount >= PACKET_SCENARIO.length && !capturing) {
                  setCapturedCount(1);
                  setCapturing(true);
                } else {
                  setCapturing((c) => !c);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap"
            >
              {capturing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {capturing ? 'Pause capture' : 'Lancer capture'}
            </button>
            <button
              type="button"
              onClick={handleStepPacket}
              disabled={capturedCount >= PACKET_SCENARIO.length}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap"
            >
              <StepForward className="w-3.5 h-3.5" />
              +1 paquet
            </button>
            <button
              type="button"
              onClick={handleRestartCapture}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rejouer
            </button>
          </div>
        </div>

        {/* Live Animated Pipeline Flow Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#F4F8FC] dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              1. Carte réseau (eth0)
            </p>
            <p className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {capturedCount} / {PACKET_SCENARIO.length} trames vues
            </p>
            <p className="text-[11px] text-sky-700 dark:text-sky-400 truncate">
              {latestPacket ? `Dernière : ${latestPacket.protocol} (${latestPacket.length} o)` : 'En attente'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              2. Moteur libpcap + BPF
            </p>
            <p className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300 tabular-nums">
              Filtre : {bpfPreset === 'all' ? 'aucun (tout garder)' : bpfPreset}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
              {bpfCapturedPackets.length} conservé(s) · {capturedCount - bpfCapturedPackets.length} écarté(s)
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              3. Filtre d&apos;affichage Wireshark
            </p>
            <p className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums truncate">
              {displayFilter.trim() || 'tout afficher'}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
              {filterState.list.length} affiché(s) (non destructif)
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex flex-col justify-between gap-2">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              4. Mode d&apos;affichage
            </p>
            <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md w-fit">
              {(
                [
                  { id: 'both', label: 'Double', icon: Columns2 },
                  { id: 'wireshark', label: 'Wireshark', icon: Eye },
                  { id: 'tcpdump', label: 'tcpdump', icon: Terminal },
                ] as const
              ).map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setViewMode(m.id);
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded transition-colors whitespace-nowrap ${
                      viewMode === m.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace: Wireshark and/or tcpdump */}
      <div className={`grid grid-cols-1 ${viewMode === 'both' ? 'xl:grid-cols-12' : ''} gap-6 items-start`}>
        {/* WIRESHARK GUI PANEL */}
        {(viewMode === 'both' || viewMode === 'wireshark') && (
          <section
            className={`${
              viewMode === 'both' ? 'xl:col-span-7' : ''
            } bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden`}
          >
            <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <Eye className="w-4 h-4 text-sky-400" />
                Wireshark — Analyse graphique en 3 volets
              </span>
              <span className="font-mono text-xs text-slate-300 tabular-nums">
                Affichés : {filterState.list.length} / {bpfCapturedPackets.length}
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* Wireshark Display Filter Bar */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={displayFilter}
                      onChange={(e) => setDisplayFilter(e.target.value)}
                      placeholder="Filtre d'affichage Wireshark (ex: http, dns, tcp.port == 23, tcp.flags.syn == 1)"
                      aria-label="Filtre d'affichage Wireshark"
                      className={`w-full pl-9 pr-3 py-2 font-mono text-xs rounded-lg border transition-colors ${
                        !displayFilter.trim()
                          ? 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                          : filterState.valid
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200'
                          : 'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-950 dark:text-red-200'
                      }`}
                    />
                  </div>
                  {displayFilter && (
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setDisplayFilter('');
                      }}
                      className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 mr-1">Filtres rapides :</span>
                  {[
                    { label: 'Tout', val: '' },
                    { label: 'dns', val: 'dns' },
                    { label: 'http', val: 'http' },
                    { label: 'tls', val: 'tls' },
                    { label: 'tcp.flags.syn == 1', val: 'tcp.flags.syn == 1' },
                    { label: 'tcp.port == 23', val: 'tcp.port == 23' },
                    { label: 'icmp', val: 'icmp' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        playClick();
                        setDisplayFilter(chip.val);
                      }}
                      className={`px-2 py-1 font-mono rounded border transition-colors whitespace-nowrap ${
                        displayFilter === chip.val
                          ? 'bg-sky-700 border-sky-700 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pane 1: Packet List */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>Volet 1 · Liste des paquets capturés (cliquez pour disséquer)</span>
                  <span className="font-mono">eth0</span>
                </div>
                <div className="overflow-x-auto max-h-[225px] overflow-y-auto">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 sticky top-0">
                      <tr>
                        <th className="py-1.5 px-2.5">N°</th>
                        <th className="py-1.5 px-2.5">Temps</th>
                        <th className="py-1.5 px-2.5">Source → Dest</th>
                        <th className="py-1.5 px-2.5">Proto</th>
                        <th className="py-1.5 px-2.5">Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {filterState.list.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500 dark:text-slate-400">
                            Aucun paquet ne correspond au filtre actif.
                          </td>
                        </tr>
                      ) : (
                        filterState.list.map((pkt) => {
                          const isSelected = selectedPacket?.id === pkt.id;
                          const rowTone =
                            pkt.severity === 'danger'
                              ? 'bg-red-50/80 dark:bg-red-950/30 text-red-950 dark:text-red-200'
                              : pkt.severity === 'warning'
                              ? 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200'
                              : pkt.severity === 'secure'
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200'
                              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';

                          return (
                            <tr
                              key={pkt.id}
                              onClick={() => {
                                playClick();
                                setSelectedPacketId(pkt.id);
                              }}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-sky-700 text-white font-semibold'
                                  : `${rowTone} hover:bg-sky-50 dark:hover:bg-slate-800`
                              }`}
                            >
                              <td className="py-1.5 px-2.5 tabular-nums">{pkt.id}</td>
                              <td className="py-1.5 px-2.5 tabular-nums whitespace-nowrap">{pkt.time}</td>
                              <td className="py-1.5 px-2.5 whitespace-nowrap">
                                {pkt.srcIp} → {pkt.dstIp}
                              </td>
                              <td className="py-1.5 px-2.5 font-bold whitespace-nowrap">{pkt.protocol}</td>
                              <td className="py-1.5 px-2.5 max-w-[230px] truncate">{pkt.info}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pane 2 & Pane 3 side-by-side */}
              {selectedPacket && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Pane 2: Protocol Tree */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Volet 2 · Dissection Paquet #{selectedPacket.id}
                      </span>
                    </div>
                    <div className="p-2.5 space-y-1.5 text-[11px]">
                      {(
                        [
                          { id: 'l2', title: 'Couche 2 · Ethernet II (MAC)', items: selectedPacket.layers.l2 },
                          { id: 'l3', title: 'Couche 3 · IPv4 (Routage)', items: selectedPacket.layers.l3 },
                          { id: 'l4', title: 'Couche 4 · Transport (Ports/Flags)', items: selectedPacket.layers.l4 },
                          { id: 'l7', title: `Couche 7 · ${selectedPacket.protocol}`, items: selectedPacket.layers.l7 },
                        ] as const
                      ).map((sec) => {
                        const open = activeLayer === sec.id;
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => {
                              playClick();
                              setActiveLayer(sec.id);
                            }}
                            className={`w-full text-left p-2 rounded-lg border transition-colors ${
                              open
                                ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-slate-900 dark:text-slate-100'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <p className="font-semibold flex items-center justify-between">
                              <span>{open ? '▾' : '▸'} {sec.title}</span>
                            </p>
                            {open && (
                              <ul className="mt-1.5 pl-3 space-y-0.5 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                                {sec.items.map((line) => (
                                  <li key={line}>{line}</li>
                                ))}
                              </ul>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pane 3: Hex & ASCII + Follow Stream */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
                      <span>Volet 3 · Octets Hex / ASCII</span>
                      {selectedPacket.streamId && (
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setShowFollowStream((s) => !s);
                          }}
                          className="text-[10px] font-semibold text-sky-700 dark:text-sky-400 hover:underline whitespace-nowrap"
                        >
                          {showFollowStream ? 'Voir octets bruts' : 'Follow TCP Stream'}
                        </button>
                      )}
                    </div>

                    {showFollowStream && selectedPacket.streamId ? (
                      <div className="p-3 bg-slate-950 text-slate-100 font-mono text-[11px] space-y-2 flex-1">
                        <p className="text-sky-300 font-semibold">
                          Reconstitution du flux ({selectedPacket.streamId}) :
                        </p>
                        {PACKET_SCENARIO.filter(
                          (p) => p.streamId === selectedPacket.streamId && p.streamLine
                        ).map((p) => (
                          <p
                            key={p.id}
                            className={`p-2 rounded border ${
                              p.severity === 'secure'
                                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                                : 'bg-amber-950/60 border-amber-700 text-amber-200'
                            }`}
                          >
                            {p.streamLine}
                          </p>
                        ))}
                        <p className="text-[10px] text-slate-400 pt-1">
                          {selectedPacket.severity === 'secure'
                            ? 'Avec HTTPS (TLS 1.3), même en reconstituant tout le flux TCP, les données restent illisibles.'
                            : 'Sans chiffrement (HTTP/Telnet), Wireshark reconstitue instantanément tout le dialogue en clair !'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-950 text-slate-200 font-mono text-[10px] space-y-1 flex-1 overflow-x-auto">
                        {selectedPacket.hexRows.map((row) => {
                          const highlighted = row.layer === activeLayer;
                          return (
                            <div
                              key={row.offset}
                              className={`flex items-center justify-between gap-2 px-1.5 py-1 rounded ${
                                highlighted ? 'bg-sky-700/70 text-white font-semibold' : 'text-slate-400'
                              }`}
                            >
                              <span className="text-slate-500">{row.offset}</span>
                              <span className="flex-1 whitespace-nowrap">{row.hex}</span>
                              <span className="text-emerald-300 whitespace-nowrap">{row.ascii}</span>
                            </div>
                          );
                        })}
                        <p className="text-[10px] text-slate-400 pt-2">
                          Les octets surlignés en bleu correspondent à la couche sélectionnée dans le Volet 2.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TCPDUMP CLI PANEL */}
        {(viewMode === 'both' || viewMode === 'tcpdump') && (
          <section
            className={`${
              viewMode === 'both' ? 'xl:col-span-5' : ''
            } bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col`}
          >
            <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <Terminal className="w-4 h-4 text-emerald-400" />
                tcpdump — Capture CLI &amp; Filtre noyau BPF
              </span>
              <button
                type="button"
                onClick={handleDownloadTrace}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md transition-colors whitespace-nowrap"
              >
                {exportedPcap ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <FileDown className="w-3 h-3" />}
                {exportedPcap ? 'Exporté' : 'Exporter log'}
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Interactive Command Builder */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Composez votre commande tcpdump (options + filtre BPF) :
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setFlagNumeric((v) => !v);
                    }}
                    className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                      flagNumeric
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-600 text-sky-900 dark:text-sky-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    -nn (IP/Ports bruts)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setFlagVerbose((v) => !v);
                    }}
                    className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                      flagVerbose
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-600 text-sky-900 dark:text-sky-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    -v (Verbeux)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setFlagWritePcap((v) => !v);
                    }}
                    className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                      flagWritePcap
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 text-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    -w capture.pcap
                  </button>
                </div>

                {/* BPF Kernel Filter Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 mr-1">Filtre BPF :</span>
                  {(
                    [
                      { id: 'all', label: 'Aucun' },
                      { id: 'port 80', label: 'port 80' },
                      { id: 'port 443', label: 'port 443' },
                      { id: 'port 53', label: 'port 53' },
                      { id: 'icmp', label: 'icmp' },
                      { id: 'port 23', label: 'port 23' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setBpfPreset(opt.id);
                      }}
                      className={`px-2 py-1 font-mono rounded border transition-colors ${
                        bpfPreset === opt.id
                          ? 'bg-amber-600 border-amber-600 text-white font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Terminal Output */}
              <div className="bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-[11px] space-y-2 border border-slate-800 min-h-[290px] max-h-[380px] overflow-y-auto">
                <p className="text-emerald-400 font-semibold break-all">$ {tcpdumpCommand}</p>
                <p className="text-slate-400">
                  listening on eth0, link-type EN10MB (Ethernet), snapshot length 262144 bytes
                </p>
                {bpfCapturedPackets.length === 0 ? (
                  <p className="text-amber-300 pt-2">
                    0 paquet correspondant au filtre BPF « {bpfPreset} » pour l&apos;instant...
                  </p>
                ) : (
                  bpfCapturedPackets.map((pkt) => (
                    <div
                      key={pkt.id}
                      onClick={() => {
                        playClick();
                        setSelectedPacketId(pkt.id);
                      }}
                      className={`cursor-pointer p-1.5 rounded transition-colors ${
                        selectedPacket?.id === pkt.id
                          ? 'bg-sky-900/70 text-white'
                          : 'hover:bg-slate-900'
                      }`}
                    >
                      <p
                        className={`break-all ${
                          pkt.severity === 'danger'
                            ? 'text-red-300'
                            : pkt.severity === 'warning'
                            ? 'text-amber-300'
                            : pkt.severity === 'secure'
                            ? 'text-emerald-300'
                            : 'text-slate-200'
                        }`}
                      >
                        {pkt.tcpdumpLine}
                      </p>
                      {flagVerbose && (
                        <p className="text-slate-400 text-[10px] pl-2">{pkt.tcpdumpVerbose}</p>
                      )}
                    </div>
                  ))
                )}
                <p className="text-sky-300 pt-2 border-t border-slate-800 tabular-nums">
                  {bpfCapturedPackets.length} packets captured · {capturedCount} received by filter · 0 dropped by kernel
                </p>
              </div>

              {/* Educational Key Insight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    HTTP (80) &amp; Telnet (23)
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    En clair : un sniffer réseau lit directement mots de passe et cookies !
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    HTTPS / TLS 1.3 (443)
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Wireshark voit les IP et ports, mais la charge applicative reste chiffrée.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
