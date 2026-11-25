import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  KeyRound,
  Lock,
  LogIn,
  Play,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle } from '../../firebase';
import {
  callSecureApi,
  ServerAdminAuditOverview,
  ServerUserRole,
  ServerWhoAmIResponse,
} from '../../utils/secureApi';
import { playClick, playError, playSuccess, playVictory } from '../../utils/sound';

interface ServerDbAuthLabProps {
  onCompleteHardening?: () => void;
}

type LabTabId = 'probes' | 'hardening' | 'governance';

interface ProbeResult {
  id: string;
  label: string;
  layer: 'Serveur Express' | 'Base Firestore';
  target: string;
  statusLabel: string;
  outcome: 'BLOCKED_AS_EXPECTED' | 'ALLOWED_VERIFIED' | 'UNEXPECTED';
  latencyMs: number;
  enforcedBy: string;
  summary: string;
  rawDetail: string;
}

interface HardeningChallenge {
  id: string;
  title: string;
  flawSummary: string;
  vulnerableSnippet: string;
  serverQuestion: string;
  serverOptions: { id: string; label: string; correct: boolean }[];
  dbQuestion: string;
  dbOptions: { id: string; label: string; correct: boolean }[];
  explanation: string;
}

const HARDENING_CHALLENGES: HardeningChallenge[] = [
  {
    id: 'h-hidden-btn',
    title: '1. Bouton Admin masqué en React',
    flawSummary:
      'Le frontend cache le bouton « Exporter tous les élèves » avec `{isAdmin && <button />}` mais la route `/api/admin/audit-overview` ne vérifie ni le jeton ni le rôle.',
    vulnerableSnippet: `// Frontend uniquement (INSUFFISANT)\n{userRole === 'admin' && <button onClick={fetchAudit}>Audit</button>}\n\n// Backend vulnérable\napp.get('/api/admin/audit-overview', (req, res) => res.json(secrets));`,
    serverQuestion: 'Protection obligatoire côté serveur Express :',
    serverOptions: [
      {
        id: 's1',
        label: 'Obscurcir le nom de la route en /api/x9f2-audit-secret',
        correct: false,
      },
      {
        id: 's2',
        label: 'Appliquer requireFirebaseAuth (JWT RS256) puis requireRole("admin") sur la route',
        correct: true,
      },
      {
        id: 's3',
        label: 'Lire req.headers["x-is-admin"] envoyé par le composant React',
        correct: false,
      },
    ],
    dbQuestion: 'Protection obligatoire côté base Firestore :',
    dbOptions: [
      {
        id: 'd1',
        label: 'allow get, write: if isValidId(docId) && isAdmin(); allow list: if false;',
        correct: true,
      },
      {
        id: 'd2',
        label: 'allow read, write: if request.auth != null;',
        correct: false,
      },
      {
        id: 'd3',
        label: 'Désactiver le bouton dans l’interface pour les comptes non-admin',
        correct: false,
      },
    ],
    explanation:
      'Un attaquant peut appeler directement `/api/admin/audit-overview` avec curl ou le SDK Firestore depuis la console du navigateur. Seuls le middleware serveur ET les règles Firestore protègent réellement les données.',
  },
  {
    id: 'h-role-spoof',
    title: '2. Auto-élévation de privilèges & headers falsifiés',
    flawSummary:
      'Un utilisateur modifie son propre document `/roles/{uid}` avec `{ role: "admin" }` ou injecte `X-User-Role: admin` dans sa requête HTTP.',
    vulnerableSnippet: `// Requête forgée depuis DevTools\nfetch('/api/instructor/roster-summary', { headers: { 'X-User-Role': 'admin' } });\nawait setDoc(doc(db, 'roles', myUid), { role: 'admin' });`,
    serverQuestion: 'Comment le serveur doit-il résoudre le rôle du demandeur ?',
    serverOptions: [
      {
        id: 's1',
        label: 'Ignorer les en-têtes/body client et déduire le rôle uniquement depuis l’identité vérifiée côté serveur',
        correct: true,
      },
      {
        id: 's2',
        label: 'Accepter X-User-Role si le paramètre ?signed=true est présent dans l’URL',
        correct: false,
      },
      {
        id: 's3',
        label: 'Stocker le rôle en clair dans localStorage et le relire à chaque clic',
        correct: false,
      },
    ],
    dbQuestion: 'Règle Firestore anti-auto-élévation sur `/roles/{userId}` :',
    dbOptions: [
      {
        id: 'd1',
        label: 'allow write: if request.auth.uid == userId;',
        correct: false,
      },
      {
        id: 'd2',
        label: 'allow get: if isOwner(userId) || isAdmin(); allow create, update, delete: if isAdmin();',
        correct: true,
      },
      {
        id: 'd3',
        label: 'allow read, write: if request.auth.token.email != null;',
        correct: false,
      },
    ],
    explanation:
      'Ne faites jamais confiance au rôle fourni par le client. Dans Firestore, seul un administrateur vérifié (`email_verified == true`) peut créer ou modifier `/roles/{userId}`.',
  },
  {
    id: 'h-idor',
    title: '3. Accès horizontal non autorisé (IDOR)',
    flawSummary:
      'La route `/api/user/profile/:targetUid` renvoie les données de n’importe quel identifiant passé dans l’URL tant que le visiteur est connecté.',
    vulnerableSnippet: `// Vulnérable : vérifie seulement que l'utilisateur est connecté, pas qu'il est propriétaire\napp.get('/api/user/profile/:targetUid', requireFirebaseAuth, (req, res) => {\n  return res.json(getProfile(req.params.targetUid));\n});`,
    serverQuestion: 'Contrôle d’appartenance indispensable dans le handler Express :',
    serverOptions: [
      {
        id: 's1',
        label: 'Valider targetUid par regex et exiger req.authUser.uid === targetUid || req.authUser.role === "admin"',
        correct: true,
      },
      {
        id: 's2',
        label: 'Encoder targetUid en Base64 dans l’URL du navigateur',
        correct: false,
      },
      {
        id: 's3',
        label: 'Vérifier uniquement que req.params.targetUid n’est pas vide',
        correct: false,
      },
    ],
    dbQuestion: 'Règle Firestore équivalente sur `/user_progress/{userId}` :',
    dbOptions: [
      {
        id: 'd1',
        label: 'allow list: if request.auth != null; // Le client filtre avec where("userId", "==", uid)',
        correct: false,
      },
      {
        id: 'd2',
        label: 'allow get: if isValidId(userId) && (isOwner(userId) || isAdmin()); allow list: if false;',
        correct: true,
      },
      {
        id: 'd3',
        label: 'allow read: if resource.data.learnerName != "";',
        correct: false,
      },
    ],
    explanation:
      'Une vérification d’authentification (qui êtes-vous ?) ne remplace jamais une vérification d’autorisation sur l’objet ciblé (avez-vous le droit sur CE document ?).',
  },
  {
    id: 'h-tamper',
    title: '4. Falsification de score & champs fantômes',
    flawSummary:
      'Un élève modifie le JSON Base64 d’un code de transfert (`extraBonusXp: 999999`) ou injecte un champ fantôme `isAdmin: true` dans un document Firestore.',
    vulnerableSnippet: `// Base64 non signé = falsifiable en 5 secondes\nconst payload = JSON.parse(atob(code.slice(4))); // totalXp: 9999999 !`,
    serverQuestion: 'Comment garantir l’intégrité d’un code de transfert côté serveur ?',
    serverOptions: [
      {
        id: 's1',
        label: 'Remplacer Base64 par du hexadécimal côté navigateur',
        correct: false,
      },
      {
        id: 's2',
        label: 'Signer côté serveur avec HMAC-SHA256 (secret uniquement sur le serveur) et vérifier via timingSafeEqual + bornes strictes',
        correct: true,
      },
      {
        id: 's3',
        label: 'Mettre la clé secrète HMAC dans VITE_SECRET_KEY dans le bundle React',
        correct: false,
      },
    ],
    dbQuestion: 'Verrouillage de schéma côté Firestore contre les champs fantômes et dépassements :',
    dbOptions: [
      {
        id: 'd1',
        label: 'keys().hasOnly([...]) à la création, affectedKeys().hasOnly([...]) à la mise à jour, et bornes strictes (totalXp <= 50000)',
        correct: true,
      },
      {
        id: 'd2',
        label: 'Attribut HTML max="50000" sur le champ <input type="number" />',
        correct: false,
      },
      {
        id: 'd3',
        label: 'allow update: if request.auth.uid == userId; sans helper de validation',
        correct: false,
      },
    ],
    explanation:
      'L’intégrité des données repose sur une signature cryptographique détenue uniquement par le serveur et sur une validation stricte des clés, types et bornes dans Firestore.',
  },
];

interface AdminVaultDoc {
  policyName: string;
  minPassingScore: number;
  requireSignedTransfers: boolean;
  strictZeroTrustMode: boolean;
  updatedBy: string;
}

export const ServerDbAuthLab: React.FC<ServerDbAuthLabProps> = ({ onCompleteHardening }) => {
  const [activeTab, setActiveTab] = useState<LabTabId>('probes');
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [whoami, setWhoami] = useState<ServerWhoAmIResponse | null>(null);
  const [whoamiError, setWhoamiError] = useState<string | null>(null);
  const [loadingWhoami, setLoadingWhoami] = useState(false);

  // Live probe state
  const [probeResults, setProbeResults] = useState<Record<string, ProbeResult>>({});
  const [runningProbeId, setRunningProbeId] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);

  // Hardening challenges state
  const [selectedServerAns, setSelectedServerAns] = useState<Record<string, string>>({});
  const [selectedDbAns, setSelectedDbAns] = useState<Record<string, string>>({});
  const [validatedChallenges, setValidatedChallenges] = useState<Record<string, boolean>>({});
  const [challengeFeedback, setChallengeFeedback] = useState<Record<string, string>>({});
  const [xpAwarded, setXpAwarded] = useState(false);

  // Governance / Admin real server + Firestore console state
  const [auditOverview, setAuditOverview] = useState<ServerAdminAuditOverview | null>(null);
  const [auditDenial, setAuditDenial] = useState<string | null>(null);
  const [vaultDoc, setVaultDoc] = useState<AdminVaultDoc | null>(null);
  const [vaultDenial, setVaultDenial] = useState<string | null>(null);
  const [vaultBusy, setVaultBusy] = useState(false);
  const [vaultSavedMsg, setVaultSavedMsg] = useState<string | null>(null);
  const [draftPolicyName, setDraftPolicyName] = useState('Politique Zero-Trust Cyberland 2026');
  const [draftMinScore, setDraftMinScore] = useState(14);
  const [draftRequireSigned, setDraftRequireSigned] = useState(true);

  const [roleTargetUid, setRoleTargetUid] = useState('');
  const [roleTargetValue, setRoleTargetValue] = useState<ServerUserRole>('instructor');
  const [roleNote, setRoleNote] = useState('Formateur certifié Cyberland');
  const [roleMsg, setRoleMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const refreshWhoAmI = useCallback(async () => {
    setLoadingWhoami(true);
    setWhoamiError(null);
    try {
      const res = await callSecureApi<ServerWhoAmIResponse & { message?: string }>(
        '/api/auth/whoami',
        { includeAuth: true }
      );
      if (res.ok) {
        setWhoami(res.data);
      } else {
        setWhoami(null);
        setWhoamiError(`HTTP ${res.status} — ${res.data.message || 'Non authentifié côté serveur'}`);
      }
    } catch {
      setWhoami(null);
      setWhoamiError('Serveur API indisponible.');
    } finally {
      setLoadingWhoami(false);
    }
  }, []);

  useEffect(() => {
    void refreshWhoAmI();
  }, [user, refreshWhoAmI]);

  const runProbe = useCallback(
    async (probeId: string) => {
      setRunningProbeId(probeId);
      try {
        if (probeId === 'p-unauth-admin') {
          const res = await callSecureApi<{ error?: string; message?: string; enforcedBy?: string }>(
            '/api/admin/audit-overview',
            { includeAuth: false }
          );
          const blocked = res.status === 401;
          setProbeResults((prev) => ({
            ...prev,
            [probeId]: {
              id: probeId,
              label: 'Appel direct /api/admin/audit-overview sans jeton',
              layer: 'Serveur Express',
              target: 'GET /api/admin/audit-overview',
              statusLabel: `HTTP ${res.status}`,
              outcome: blocked ? 'BLOCKED_AS_EXPECTED' : 'UNEXPECTED',
              latencyMs: res.latencyMs,
              enforcedBy: res.data.enforcedBy || 'server-middleware:requireFirebaseAuth',
              summary: blocked
                ? 'Bloqué côté serveur : aucun jeton Bearer Firebase valide.'
                : 'Réponse inattendue.',
              rawDetail: JSON.stringify(res.data, null, 2),
            },
          }));
        } else if (probeId === 'p-spoof-headers') {
          const res = await callSecureApi<{
            error?: string;
            message?: string;
            enforcedBy?: string;
            spoofAttemptsIgnored?: string[];
            authorized?: boolean;
          }>('/api/admin/audit-overview?isAdmin=true&role=admin', {
            includeAuth: true,
            extraHeaders: {
              'X-User-Role': 'admin',
              'X-Admin': 'true',
            },
          });
          const isAdminAllowed = res.status === 200 && res.data.authorized === true;
          const isBlocked = res.status === 401 || res.status === 403;
          setProbeResults((prev) => ({
            ...prev,
            [probeId]: {
              id: probeId,
              label: 'Usurpation de rôle (X-User-Role: admin & ?isAdmin=true)',
              layer: 'Serveur Express',
              target: 'GET /api/admin/audit-overview?isAdmin=true',
              statusLabel: `HTTP ${res.status}`,
              outcome: isBlocked
                ? 'BLOCKED_AS_EXPECTED'
                : isAdminAllowed
                  ? 'ALLOWED_VERIFIED'
                  : 'UNEXPECTED',
              latencyMs: res.latencyMs,
              enforcedBy: res.data.enforcedBy || 'server-middleware:requireRole',
              summary: isBlocked
                ? `En-têtes falsifiés ignorés (${(res.data.spoofAttemptsIgnored || []).length} tentative(s) journalisée(s)) et accès refusé.`
                : 'Accès autorisé uniquement parce que votre jeton Firebase RS256 est celui de l’admin vérifié (les en-têtes falsifiés ont été ignorés et journalisés).',
              rawDetail: JSON.stringify(res.data, null, 2),
            },
          }));
        } else if (probeId === 'p-idor-profile') {
          const res = await callSecureApi<{
            error?: string;
            message?: string;
            enforcedBy?: string;
            accessBasis?: string;
          }>('/api/user/profile/uid-victime-externe-999', {
            includeAuth: true,
          });
          const isBlocked = res.status === 401 || res.status === 403;
          const isAdminVerified = res.status === 200 && res.data.accessBasis === 'VERIFIED_ADMIN';
          setProbeResults((prev) => ({
            ...prev,
            [probeId]: {
              id: probeId,
              label: 'Attaque IDOR sur le profil d’un autre utilisateur',
              layer: 'Serveur Express',
              target: 'GET /api/user/profile/uid-victime-externe-999',
              statusLabel: `HTTP ${res.status}`,
              outcome: isBlocked
                ? 'BLOCKED_AS_EXPECTED'
                : isAdminVerified
                  ? 'ALLOWED_VERIFIED'
                  : 'UNEXPECTED',
              latencyMs: res.latencyMs,
              enforcedBy: res.data.enforcedBy || 'server-route:ownership-guard',
              summary: isBlocked
                ? 'IDOR bloqué côté serveur : le contrôle UID vérifie que vous êtes bien le propriétaire.'
                : 'Autorisé uniquement en tant qu’admin vérifié (base VERIFIED_ADMIN) ; un apprenant reçoit HTTP 403.',
              rawDetail: JSON.stringify(res.data, null, 2),
            },
          }));
        } else if (probeId === 'p-forged-transfer') {
          const fakePayload = btoa(
            JSON.stringify({
              v: 2,
              uid: 'attacker-01',
              iat: Math.floor(Date.now() / 1000),
              data: {
                name: 'TricheXP',
                completedIslands: [1, 2, 3],
                starsByIsland: { 1: 3 },
                quizBonusXp: 999999,
                solvedDebugIds: [],
                extraBonusXp: 999999,
              },
            })
          )
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
          const forgedCode = `GEM2.${fakePayload}.forged_signature_000000000000`;
          const res = await callSecureApi<{ error?: string; message?: string; enforcedBy?: string }>(
            '/api/transfer/verify',
            {
              method: 'POST',
              includeAuth: false,
              body: { code: forgedCode },
            }
          );
          const blocked = res.status === 403;
          setProbeResults((prev) => ({
            ...prev,
            [probeId]: {
              id: probeId,
              label: 'Falsification Base64 d’un code de transfert (+999 999 XP)',
              layer: 'Serveur Express',
              target: 'POST /api/transfer/verify',
              statusLabel: `HTTP ${res.status}`,
              outcome: blocked ? 'BLOCKED_AS_EXPECTED' : 'UNEXPECTED',
              latencyMs: res.latencyMs,
              enforcedBy: res.data.enforcedBy || 'server-crypto:HMAC-SHA256',
              summary: blocked
                ? 'Signature HMAC-SHA256 invalide : le serveur rejette immédiatement le payload falsifié.'
                : 'Réponse inattendue.',
              rawDetail: JSON.stringify(res.data, null, 2),
            },
          }));
        } else if (probeId === 'p-firestore-role-escalation') {
          const startedAt = performance.now();
          const targetId = user?.uid || 'attacker_demo_uid';
          try {
            // Intentionally send an invalid/forged assignedBy & ghost field to prove Firestore rules ALWAYS reject untrusted role escalation
            await setDoc(doc(db, 'roles', targetId), {
              userId: targetId,
              role: 'admin',
              assignedBy: 'spoofed-client-escalation',
              note: 'Tentative auto-promotion',
              ghostPrivilege: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            setProbeResults((prev) => ({
              ...prev,
              [probeId]: {
                id: probeId,
                label: 'Escalade de rôle directe dans Firestore (/roles/{uid})',
                layer: 'Base Firestore',
                target: `setDoc(/roles/${targetId})`,
                statusLabel: 'ALLOW (ALERTE)',
                outcome: 'UNEXPECTED',
                latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
                enforcedBy: 'firestore.rules:match /roles/{userId}',
                summary: 'Écriture autorisée de manière inattendue.',
                rawDetail: 'Document écrit sans rejet.',
              },
            }));
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setProbeResults((prev) => ({
              ...prev,
              [probeId]: {
                id: probeId,
                label: 'Escalade de rôle directe dans Firestore (/roles/{uid})',
                layer: 'Base Firestore',
                target: `setDoc(/roles/${targetId})`,
                statusLabel: 'PERMISSION_DENIED',
                outcome: 'BLOCKED_AS_EXPECTED',
                latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
                enforcedBy: 'firestore.rules:isAdmin() + isValidUserRole()',
                summary:
                  'Rejeté directement par le moteur Firestore : impossible de s’auto-attribuer le rôle admin ou d’injecter un champ fantôme.',
                rawDetail: msg,
              },
            }));
          }
        } else if (probeId === 'p-firestore-admin-vault') {
          const startedAt = performance.now();
          try {
            const snap = await getDoc(doc(db, 'protected_admin_vault', 'exam_policy'));
            setProbeResults((prev) => ({
              ...prev,
              [probeId]: {
                id: probeId,
                label: 'Lecture directe du Coffre Admin Firestore',
                layer: 'Base Firestore',
                target: 'getDoc(/protected_admin_vault/exam_policy)',
                statusLabel: 'ALLOW (ADMIN VÉRIFIÉ)',
                outcome: 'ALLOWED_VERIFIED',
                latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
                enforcedBy: 'firestore.rules:isValidId(docId) && isAdmin()',
                summary: snap.exists()
                  ? 'Lecture autorisée par Firestore uniquement parce que votre compte connecté est l’administrateur vérifié.'
                  : 'Accès Admin vérifié par Firestore (le document exam_policy n’est pas encore initialisé).',
                rawDetail: snap.exists()
                  ? JSON.stringify(snap.data(), null, 2)
                  : '{ "exists": false, "ruleEvaluated": "isAdmin() == true" }',
              },
            }));
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setProbeResults((prev) => ({
              ...prev,
              [probeId]: {
                id: probeId,
                label: 'Lecture directe du Coffre Admin Firestore',
                layer: 'Base Firestore',
                target: 'getDoc(/protected_admin_vault/exam_policy)',
                statusLabel: 'PERMISSION_DENIED',
                outcome: 'BLOCKED_AS_EXPECTED',
                latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
                enforcedBy: 'firestore.rules:match /protected_admin_vault/{docId}',
                summary:
                  'Rejeté par Firestore (PERMISSION_DENIED) : même en appelant le SDK directement sans passer par les boutons, la base refuse la lecture.',
                rawDetail: msg,
              },
            }));
          }
        }
      } finally {
        setRunningProbeId(null);
      }
    },
    [user]
  );

  const handleRunAllProbes = async () => {
    playClick();
    setRunningAll(true);
    const ids = [
      'p-unauth-admin',
      'p-spoof-headers',
      'p-idor-profile',
      'p-forged-transfer',
      'p-firestore-role-escalation',
      'p-firestore-admin-vault',
    ];
    for (const id of ids) {
      await runProbe(id);
    }
    setRunningAll(false);
    playSuccess();
  };

  const handleValidateChallenge = (ch: HardeningChallenge) => {
    const sPick = selectedServerAns[ch.id];
    const dPick = selectedDbAns[ch.id];
    if (!sPick || !dPick) {
      playError();
      setChallengeFeedback((prev) => ({
        ...prev,
        [ch.id]: 'Sélectionnez à la fois le correctif serveur ET le correctif base de données.',
      }));
      return;
    }
    const sOk = ch.serverOptions.find((o) => o.id === sPick)?.correct === true;
    const dOk = ch.dbOptions.find((o) => o.id === dPick)?.correct === true;

    if (sOk && dOk) {
      playVictory();
      const nextValidated = { ...validatedChallenges, [ch.id]: true };
      setValidatedChallenges(nextValidated);
      setChallengeFeedback((prev) => ({ ...prev, [ch.id]: ch.explanation }));
      const totalSolved = Object.values(nextValidated).filter(Boolean).length;
      if (totalSolved === HARDENING_CHALLENGES.length && !xpAwarded) {
        setXpAwarded(true);
        onCompleteHardening?.();
      }
    } else {
      playError();
      setChallengeFeedback((prev) => ({
        ...prev,
        [ch.id]: !sOk && !dOk
          ? 'Les deux choix reposent encore sur une protection fragile côté client. Corrigez la couche serveur et la couche base de données.'
          : !sOk
            ? 'Le correctif base de données est bon, mais le contrôle côté serveur reste contournable.'
            : 'Le contrôle serveur est solide, mais la règle Firestore reste trop permissive.',
      }));
    }
  };

  const handleLoadGovernanceData = async () => {
    playClick();
    setVaultBusy(true);
    setAuditDenial(null);
    setVaultDenial(null);
    setVaultSavedMsg(null);

    // 1. Server-side admin audit endpoint
    const auditRes = await callSecureApi<ServerAdminAuditOverview & { message?: string }>(
      '/api/admin/audit-overview',
      { includeAuth: true }
    );
    if (auditRes.ok) {
      setAuditOverview(auditRes.data);
    } else {
      setAuditOverview(null);
      setAuditDenial(
        `Serveur Express → HTTP ${auditRes.status} : ${auditRes.data.message || 'Accès refusé'}`
      );
    }

    // 2. Database-side Firestore admin vault
    try {
      const snap = await getDoc(doc(db, 'protected_admin_vault', 'exam_policy'));
      if (snap.exists()) {
        const d = snap.data() as Partial<AdminVaultDoc>;
        const loaded: AdminVaultDoc = {
          policyName: String(d.policyName || 'Politique Zero-Trust Cyberland 2026'),
          minPassingScore: Number(d.minPassingScore ?? 14),
          requireSignedTransfers: Boolean(d.requireSignedTransfers ?? true),
          strictZeroTrustMode: Boolean(d.strictZeroTrustMode ?? true),
          updatedBy: String(d.updatedBy || ''),
        };
        setVaultDoc(loaded);
        setDraftPolicyName(loaded.policyName);
        setDraftMinScore(loaded.minPassingScore);
        setDraftRequireSigned(loaded.requireSignedTransfers);
      } else {
        setVaultDoc(null);
      }
    } catch (err) {
      setVaultDoc(null);
      setVaultDenial(
        `Firestore → PERMISSION_DENIED : ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setVaultBusy(false);
    }
  };

  const handleSaveAdminVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    playClick();
    setVaultBusy(true);
    setVaultSavedMsg(null);
    setVaultDenial(null);

    const vaultRef = doc(db, 'protected_admin_vault', 'exam_policy');
    const cleanPolicy = draftPolicyName.trim().slice(0, 80) || 'Politique Zero-Trust Cyberland';
    const cleanScore = Math.max(10, Math.min(20, Math.round(draftMinScore)));

    try {
      const existingSnap = await getDoc(vaultRef);
      if (!existingSnap.exists()) {
        await setDoc(vaultRef, {
          policyName: cleanPolicy,
          minPassingScore: cleanScore,
          requireSignedTransfers: draftRequireSigned,
          strictZeroTrustMode: true,
          updatedBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(vaultRef, {
          policyName: cleanPolicy,
          minPassingScore: cleanScore,
          requireSignedTransfers: draftRequireSigned,
          strictZeroTrustMode: true,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
      }

      // Append immutable Firestore security audit record
      const logId = `audit_${Date.now()}`;
      await setDoc(doc(db, 'security_audit_logs', logId), {
        actorUid: user.uid,
        action: 'VAULT_POLICY_UPDATED',
        targetId: 'exam_policy',
        outcome: 'ALLOW',
        createdAt: serverTimestamp(),
      });

      setVaultDoc({
        policyName: cleanPolicy,
        minPassingScore: cleanScore,
        requireSignedTransfers: draftRequireSigned,
        strictZeroTrustMode: true,
        updatedBy: user.uid,
      });
      setVaultSavedMsg('Coffre Admin sauvegardé dans Firestore + entrée immuable écrite dans security_audit_logs.');
      playSuccess();
    } catch (err) {
      playError();
      setVaultDenial(
        `Écriture refusée par Firestore : ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setVaultBusy(false);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    playClick();
    setRoleMsg(null);
    const uid = roleTargetUid.trim();
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) {
      playError();
      setRoleMsg('UID invalide (lettres, chiffres, tirets et underscores uniquement).');
      return;
    }

    // 1. Update server-side RBAC registry
    const serverRes = await callSecureApi<{ ok?: boolean; message?: string }>('/api/admin/roles', {
      method: 'POST',
      includeAuth: true,
      body: { targetUid: uid, role: roleTargetValue },
    });
    if (!serverRes.ok) {
      playError();
      setRoleMsg(`Serveur Express → HTTP ${serverRes.status} : ${serverRes.data.message || 'Refusé'}`);
      return;
    }

    // 2. Synchronize database-enforced Firestore /roles/{uid}
    try {
      const roleRef = doc(db, 'roles', uid);
      const existingSnap = await getDoc(roleRef);
      const safeNote = roleNote.trim().slice(0, 120);
      if (!existingSnap.exists()) {
        await setDoc(roleRef, {
          userId: uid,
          role: roleTargetValue,
          assignedBy: user.uid,
          note: safeNote,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(roleRef, {
          role: roleTargetValue,
          assignedBy: user.uid,
          note: safeNote,
          updatedAt: serverTimestamp(),
        });
      }
      playSuccess();
      setRoleMsg(`Rôle "${roleTargetValue}" appliqué pour ${uid} côté serveur ET dans Firestore (/roles/${uid}).`);
      setRoleTargetUid('');
      void handleLoadGovernanceData();
    } catch (err) {
      playError();
      setRoleMsg(
        `Serveur OK, mais Firestore a refusé l'écriture : ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  const solvedCount = Object.values(validatedChallenges).filter(Boolean).length;

  const probeDefs = [
    {
      id: 'p-unauth-admin',
      title: '1. Route Admin sans jeton',
      layer: 'Serveur Express',
      desc: 'Appelle directement GET /api/admin/audit-overview sans en-tête Authorization.',
    },
    {
      id: 'p-spoof-headers',
      title: '2. Usurpation X-User-Role: admin',
      layer: 'Serveur Express',
      desc: 'Injecte X-User-Role: admin, X-Admin: true et ?isAdmin=true dans la requête.',
    },
    {
      id: 'p-idor-profile',
      title: '3. IDOR sur un autre UID',
      layer: 'Serveur Express',
      desc: 'Tente de lire GET /api/user/profile/uid-victime-externe-999.',
    },
    {
      id: 'p-forged-transfer',
      title: '4. Code XP falsifié en Base64',
      layer: 'Serveur Express',
      desc: 'Soumet +999 999 XP avec une fausse signature à POST /api/transfer/verify.',
    },
    {
      id: 'p-firestore-role-escalation',
      title: '5. Auto-promotion Admin en BDD',
      layer: 'Base Firestore',
      desc: 'Appelle directement setDoc(/roles/{uid}) avec un champ fantôme et un assignateur forgé.',
    },
    {
      id: 'p-firestore-admin-vault',
      title: '6. Lecture directe Coffre Admin BDD',
      layer: 'Base Firestore',
      desc: 'Appelle directement getDoc(/protected_admin_vault/exam_policy) via le SDK Firestore.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-sky-700 dark:text-cyan-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              DÉFENSE EN PROFONDEUR · SERVEUR EXPRESS (RS256 + HMAC) &amp; RÈGLES FIRESTORE
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Contrôle d&apos;Accès Serveur &amp; Base de Données (AuthZ Live)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Masquer un bouton ou un onglet dans React ne protège jamais vos données. Testez en
              direct les contrôles cryptographiques du backend Express et les règles strictes de
              Firestore contre des appels directs contournant l&apos;interface.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!user ? (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  void signInWithGoogle();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 text-white transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                Connexion Google (tester avec jeton)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  void refreshWhoAmI();
                }}
                disabled={loadingWhoami}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loadingWhoami ? 'animate-spin' : ''}`} />
                Re-vérifier le jeton serveur
              </button>
            )}
          </div>
        </div>

        {/* Live Verified Identity Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 shrink-0" />
              Identité vérifiée côté serveur (/api/auth/whoami)
            </div>
            {whoami ? (
              <div className="font-mono text-slate-900 dark:text-slate-100 font-semibold truncate">
                {whoami.email}
              </div>
            ) : (
              <div className="font-mono text-amber-700 dark:text-amber-400 font-semibold">
                {whoamiError || 'Anonyme (HTTP 401 sur routes protégées)'}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              Rôle résolu côté serveur (non modifiable par le client)
            </div>
            <div className="font-mono font-bold text-slate-900 dark:text-slate-100 uppercase">
              {whoami ? `${whoami.role} · ${whoami.permissions.length} permissions` : 'AUCUN (ANONYMOUS)'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              Double barrière active
            </div>
            <div className="font-mono text-slate-800 dark:text-slate-200">
              RS256 JWT + HMAC-SHA256 + Firestore Rules v2
            </div>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {(
            [
              { id: 'probes', label: '1. Tests Réels Serveur & BDD (6 attaques)', icon: ShieldAlert },
              {
                id: 'hardening',
                label: `2. Atelier Correctifs (${solvedCount}/${HARDENING_CHALLENGES.length} · +120 XP)`,
                icon: Lock,
              },
              {
                id: 'governance',
                label: '3. Console Admin (Volontairement non masquée)',
                icon: Server,
              },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  playClick();
                  setActiveTab(t.id);
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-sky-700 dark:bg-cyan-500 text-white dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: REAL LIVE SERVER & FIRESTORE PROBES */}
      {activeTab === 'probes' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Banc de tests en conditions réelles (appels HTTP &amp; SDK directs)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Chaque bouton contourne volontairement l&apos;interface et exécute une vraie requête
                vers votre serveur Express ou votre base Firestore.
              </p>
            </div>
            <button
              type="button"
              disabled={runningAll}
              onClick={() => void handleRunAllProbes()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <Play className="w-3.5 h-3.5 shrink-0" />
              {runningAll ? 'Exécution en cours...' : 'Lancer les 6 tests réels'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {probeDefs.map((p) => {
              const res = probeResults[p.id];
              const busy = runningProbeId === p.id;
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono font-semibold text-sky-700 dark:text-cyan-400">
                          {p.layer}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {p.title}
                        </h4>
                      </div>
                      <button
                        type="button"
                        disabled={busy || runningAll}
                        onClick={() => {
                          playClick();
                          void runProbe(p.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-sky-500 text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Play className="w-3 h-3 shrink-0" />
                        {busy ? 'Test...' : 'Tester'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>

                  {res && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            res.outcome === 'UNEXPECTED'
                              ? 'text-rose-700 dark:text-rose-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {res.outcome === 'UNEXPECTED' ? (
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          )}
                          {res.statusLabel}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {res.latencyMs} ms · {res.enforcedBy}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {res.summary}
                      </p>
                      <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-32 leading-relaxed">
                        {res.rawDetail}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: HANDS-ON HARDENING CHALLENGES (+120 XP) */}
      {activeTab === 'hardening' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Atelier : Sécuriser 4 architectures vulnérables (Serveur + Base de données)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pour chaque faille « frontend-only », sélectionnez le verrou côté serveur Express
                ET la règle côté base de données Firestore.
              </p>
            </div>
            <div className="font-mono text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {solvedCount} / {HARDENING_CHALLENGES.length} validés {xpAwarded ? '· +120 XP attribués' : '· +120 XP'}
            </div>
          </div>

          {HARDENING_CHALLENGES.map((ch) => {
            const solved = Boolean(validatedChallenges[ch.id]);
            const feedback = challengeFeedback[ch.id];
            return (
              <div
                key={ch.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    {ch.title}
                  </h4>
                  {solved && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Double verrou validé
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {ch.flawSummary}
                </p>

                <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
                  {ch.vulnerableSnippet}
                </pre>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 shrink-0" />
                      {ch.serverQuestion}
                    </div>
                    <div className="space-y-2">
                      {ch.serverOptions.map((opt) => {
                        const checked = selectedServerAns[ch.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={solved}
                            onClick={() => {
                              playClick();
                              setSelectedServerAns((prev) => ({ ...prev, [ch.id]: opt.id }));
                            }}
                            className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-colors ${
                              checked
                                ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-slate-900 dark:text-slate-100 font-semibold'
                                : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      {ch.dbQuestion}
                    </div>
                    <div className="space-y-2">
                      {ch.dbOptions.map((opt) => {
                        const checked = selectedDbAns[ch.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={solved}
                            onClick={() => {
                              playClick();
                              setSelectedDbAns((prev) => ({ ...prev, [ch.id]: opt.id }));
                            }}
                            className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-colors ${
                              checked
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 text-slate-900 dark:text-slate-100 font-semibold'
                                : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  {!solved ? (
                    <button
                      type="button"
                      onClick={() => handleValidateChallenge(ch)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 text-white transition-colors whitespace-nowrap shrink-0"
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      Vérifier le double correctif
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Scénario sécurisé sur les deux couches.
                    </span>
                  )}
                </div>

                {feedback && (
                  <p
                    className={`text-xs leading-relaxed p-3 rounded-xl border ${
                      solved
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    {feedback}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: UNHIDDEN ADMIN GOVERNANCE CONSOLE (PROVES SERVER + DB ENFORCEMENT) */}
      {activeTab === 'governance' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1 max-w-2xl">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Console d&apos;Administration — Volontairement visible dans le DOM
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cet écran n&apos;est pas caché par le frontend : la sécurité repose exclusivement
                sur le middleware <code className="font-mono">requireRole(&apos;admin&apos;)</code>{' '}
                du serveur Express et sur <code className="font-mono">isAdmin()</code> dans
                Firestore.
              </p>
            </div>
            <button
              type="button"
              disabled={vaultBusy}
              onClick={() => void handleLoadGovernanceData()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 disabled:opacity-60 text-white transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${vaultBusy ? 'animate-spin' : ''}`} />
              Charger audit serveur &amp; Coffre Firestore
            </button>
          </div>

          {(auditDenial || vaultDenial) && (
            <div className="space-y-2">
              {auditDenial && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-mono text-rose-800 dark:text-rose-200">
                  {auditDenial}
                </div>
              )}
              {vaultDenial && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-mono text-rose-800 dark:text-rose-200">
                  {vaultDenial}
                </div>
              )}
            </div>
          )}

          {auditOverview && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 dark:text-slate-400">Requêtes auditées</div>
                  <div className="font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                    {auditOverview.stats.totalAuditedRequests}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 dark:text-slate-400">Rejets 401 / 403</div>
                  <div className="font-mono text-xl font-bold text-rose-700 dark:text-rose-400 tabular-nums mt-1">
                    {auditOverview.stats.blockedRequests}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 dark:text-slate-400">Usurpations détectées</div>
                  <div className="font-mono text-xl font-bold text-amber-700 dark:text-amber-400 tabular-nums mt-1">
                    {auditOverview.stats.spoofAttemptsBlocked}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 dark:text-slate-400">Admin vérifié</div>
                  <div className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate mt-2">
                    {auditOverview.adminEmail}
                  </div>
                </div>
              </div>

              {/* Live Server Decision Log Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Journal temps réel des décisions serveur (ALLOW / DENY)
                </h4>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Décision</th>
                        <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Route</th>
                        <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Acteur · Rôle</th>
                        <th className="py-2.5 px-3 font-semibold">Motif serveur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                      {auditOverview.recentDecisions.map((ev) => (
                        <tr key={ev.id}>
                          <td className="py-2 px-3 whitespace-nowrap tabular-nums">
                            <span
                              className={
                                ev.decision === 'ALLOW'
                                  ? 'font-bold text-emerald-700 dark:text-emerald-400'
                                  : 'font-bold text-rose-700 dark:text-rose-400'
                              }
                            >
                              {ev.decision} ({ev.statusCode})
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-slate-800 dark:text-slate-200">
                            {ev.method} {ev.path}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {ev.actorRole} · {ev.actorUid.slice(0, 12)}
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">
                            {ev.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Admin-only Firestore Vault + Role Assignment */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSaveAdminVault} className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Coffre Firestore (/protected_admin_vault/exam_policy)
                  </h4>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Nom de la politique
                    </label>
                    <input
                      type="text"
                      maxLength={80}
                      value={draftPolicyName}
                      onChange={(e) => setDraftPolicyName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Seuil d&apos;examen (/20)
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={20}
                        value={draftMinScore}
                        onChange={(e) => setDraftMinScore(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftRequireSigned}
                        onChange={(e) => setDraftRequireSigned(e.target.checked)}
                      />
                      Codes GEM2 signés requis
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={vaultBusy}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors whitespace-nowrap"
                  >
                    <Database className="w-3.5 h-3.5 shrink-0" />
                    Enregistrer dans Firestore
                  </button>
                  {vaultDoc && (
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Actif en BDD : {vaultDoc.policyName} (seuil {vaultDoc.minPassingScore}/20)
                    </p>
                  )}
                  {vaultSavedMsg && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      {vaultSavedMsg}
                    </p>
                  )}
                </form>

                <form onSubmit={handleAssignRole} className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Attribution RBAC (Serveur + Firestore /roles/&#123;uid&#125;)
                  </h4>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Firebase UID cible
                    </label>
                    <input
                      type="text"
                      maxLength={128}
                      placeholder="Ex: aBcDeFgHiJ123456"
                      value={roleTargetUid}
                      onChange={(e) => setRoleTargetUid(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Rôle
                      </label>
                      <select
                        value={roleTargetValue}
                        onChange={(e) => setRoleTargetValue(e.target.value as ServerUserRole)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      >
                        <option value="learner">learner</option>
                        <option value="instructor">instructor</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Justification
                      </label>
                      <input
                        type="text"
                        maxLength={120}
                        value={roleNote}
                        onChange={(e) => setRoleNote(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 text-white transition-colors whitespace-nowrap"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    Appliquer le rôle RBAC
                  </button>
                  {roleMsg && (
                    <p className="text-xs text-sky-800 dark:text-cyan-300 font-medium">{roleMsg}</p>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
