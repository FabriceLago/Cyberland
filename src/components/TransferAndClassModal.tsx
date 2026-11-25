import React, { useEffect, useState } from 'react';
import {
  Copy,
  Check,
  Upload,
  Users,
  Download,
  X,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { ISLANDS } from '../data/courseData';
import { auth } from '../firebase';
import { callSecureApi } from '../utils/secureApi';
import { playClick, playError, playSuccess } from '../utils/sound';

export interface TransferPayload {
  name: string;
  completedIslands: number[];
  starsByIsland: Record<number, number>;
  quizBonusXp: number;
  solvedDebugIds: string[];
  extraBonusXp: number;
}

interface TransferAndClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProgress: TransferPayload;
  onImportProgress: (data: TransferPayload) => void;
}

function computeXp(p: TransferPayload): number {
  const islandXp = ISLANDS.filter((i) => p.completedIslands.includes(i.id)).reduce(
    (s, i) => s + i.xpReward,
    0
  );
  return islandXp + p.quizBonusXp + p.solvedDebugIds.length * 40 + p.extraBonusXp;
}

export const TransferAndClassModal: React.FC<TransferAndClassModalProps> = ({
  isOpen,
  onClose,
  currentProgress,
  onImportProgress,
}) => {
  const [tab, setTab] = useState<'transfer' | 'teacher'>('transfer');
  const [studentName, setStudentName] = useState(currentProgress.name || 'Élève Cyberland');
  const [signedCode, setSignedCode] = useState<string>('');
  const [signingBusy, setSigningBusy] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [importInput, setImportInput] = useState('');
  const [importBusy, setImportBusy] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importIsError, setImportIsError] = useState(false);

  // Server-verified instructor access state
  const [teacherAuthStatus, setTeacherAuthStatus] = useState<'idle' | 'checking' | 'allowed' | 'denied'>('idle');
  const [teacherAuthMessage, setTeacherAuthMessage] = useState<string | null>(null);
  const [roster, setRoster] = useState<TransferPayload[]>([]);
  const [teacherPaste, setTeacherPaste] = useState('');
  const [teacherError, setTeacherError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || tab !== 'teacher') return;
    let cancelled = false;
    const checkServerInstructorRole = async () => {
      setTeacherAuthStatus('checking');
      setTeacherAuthMessage(null);
      const res = await callSecureApi<{ authorized?: boolean; role?: string; message?: string }>(
        '/api/instructor/roster-summary',
        { includeAuth: true }
      );
      if (cancelled) return;
      if (res.ok && res.data.authorized) {
        setTeacherAuthStatus('allowed');
        setTeacherAuthMessage(
          `Autorisation formateur vérifiée côté serveur (rôle : ${res.data.role}).`
        );
      } else {
        setTeacherAuthStatus('denied');
        setTeacherAuthMessage(
          `HTTP ${res.status} — ${res.data.message || 'Accès formateur refusé côté serveur.'}`
        );
      }
    };
    void checkServerInstructorRole();
    return () => {
      cancelled = true;
    };
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const handleGenerateSignedCode = async () => {
    playClick();
    setSigningBusy(true);
    setSignError(null);
    const res = await callSecureApi<{ ok?: boolean; code?: string; message?: string }>(
      '/api/transfer/sign',
      {
        method: 'POST',
        includeAuth: true,
        body: {
          progress: {
            ...currentProgress,
            name: studentName.trim().slice(0, 48) || 'Élève Cyberland',
          },
        },
      }
    );
    setSigningBusy(false);
    if (res.ok && res.data.code) {
      setSignedCode(res.data.code);
      playSuccess();
    } else {
      playError();
      setSignError(
        `HTTP ${res.status} — ${res.data.message || 'Connectez-vous avec Google pour obtenir un code signé côté serveur.'}`
      );
    }
  };

  const handleCopyCode = async () => {
    if (!signedCode) return;
    try {
      await navigator.clipboard.writeText(signedCode);
      playSuccess();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      playClick();
    }
  };

  const handleImportMyProgress = async () => {
    const trimmed = importInput.trim();
    if (!trimmed) {
      playError();
      setImportIsError(true);
      setImportMessage('Collez un code signé GEM2.<payload>.<hmac> généré par le serveur.');
      return;
    }

    setImportBusy(true);
    setImportMessage(null);
    const res = await callSecureApi<{
      ok?: boolean;
      progress?: TransferPayload;
      message?: string;
    }>('/api/transfer/verify', {
      method: 'POST',
      includeAuth: true,
      body: { code: trimmed },
    });
    setImportBusy(false);

    if (res.ok && res.data.progress) {
      playSuccess();
      onImportProgress(res.data.progress);
      setImportInput('');
      setImportIsError(false);
      setImportMessage(
        `Signature HMAC-SHA256 vérifiée côté serveur : progression de ${res.data.progress.name} restaurée.`
      );
    } else {
      playError();
      setImportIsError(true);
      setImportMessage(
        `Rejet serveur (HTTP ${res.status}) : ${res.data.message || 'Signature invalide ou code falsifié.'}`
      );
    }
  };

  const handleAddStudentToRoster = async () => {
    if (teacherAuthStatus !== 'allowed') return;
    const trimmed = teacherPaste.trim();
    if (!trimmed) return;
    setTeacherError(null);

    const res = await callSecureApi<{
      ok?: boolean;
      progress?: TransferPayload;
      message?: string;
    }>('/api/transfer/verify', {
      method: 'POST',
      includeAuth: true,
      body: { code: trimmed },
    });

    if (!res.ok || !res.data.progress) {
      playError();
      setTeacherError(
        `Code rejeté côté serveur (HTTP ${res.status}) : ${res.data.message || 'Seuls les codes GEM2 signés par le serveur sont acceptés.'}`
      );
      return;
    }

    playSuccess();
    setRoster((prev) => [...prev, res.data.progress!]);
    setTeacherPaste('');
    setTeacherError(null);
  };

  const handleExportClassCsv = () => {
    if (teacherAuthStatus !== 'allowed') return;
    playSuccess();
    const header = `Eleve,Iles validees (/${ISLANDS.length}),Etoiles,Tickets Debug,XP Total`;
    const rows = roster.map((s) => {
      const stars = Object.values(s.starsByIsland).reduce((a, b) => a + b, 0);
      return `"${s.name.replace(/"/g, '""')}",${s.completedIslands.length},${stars},${
        s.solvedDebugIds.length
      },${computeXp(s)}`;
    });
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suivi-classe-cyberland.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 my-auto shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-sky-700 dark:text-sky-400 shrink-0" />
            <h2
              id="transfer-modal-title"
              className="font-display text-xl font-bold text-slate-900 dark:text-slate-100"
            >
              Code de transfert signé &amp; Suivi de classe
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            aria-label="Fermer"
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => {
              playClick();
              setTab('transfer');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              tab === 'transfer'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Code signé serveur (Élève)
          </button>
          <button
            type="button"
            onClick={() => {
              playClick();
              setTab('teacher');
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              tab === 'teacher'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Lock className="w-3 h-3 shrink-0" />
            Tableau Formateur ({roster.length})
          </button>
        </div>

        {tab === 'transfer' ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pour empêcher toute falsification de score côté navigateur, chaque code de
                transfert (<code className="font-mono">GEM2.&lt;payload&gt;.&lt;hmac&gt;</code>) est
                signé et vérifié cryptographiquement par le serveur en HMAC-SHA256.
              </p>
              <div className="space-y-1.5">
                <label
                  htmlFor="transfer-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Prénom / Pseudo inclus dans le code signé
                </label>
                <input
                  id="transfer-name"
                  type="text"
                  maxLength={48}
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={signingBusy}
                  onClick={() => void handleGenerateSignedCode()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-60 rounded-lg whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  {signingBusy ? 'Signature serveur...' : 'Signer mon code côté serveur (HMAC-SHA256)'}
                </button>
                {!auth.currentUser && (
                  <span className="text-[11px] text-amber-700 dark:text-amber-400">
                    Connexion Google requise (vérification RS256 côté serveur)
                  </span>
                )}
              </div>

              {signError && (
                <p className="text-xs text-rose-700 dark:text-rose-400 font-mono">{signError}</p>
              )}

              {signedCode && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={signedCode}
                    aria-label="Votre code de transfert signé"
                    className="flex-1 px-3 py-2 font-mono text-xs bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg whitespace-nowrap shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                </div>
              )}
            </div>

            <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Restaurer une progression (vérification HMAC-SHA256 côté serveur)
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder="Collez ici un code signé GEM2...."
                  className="flex-1 px-3 py-2 font-mono text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  disabled={importBusy}
                  onClick={() => void handleImportMyProgress()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-sky-700 hover:bg-slate-800 disabled:opacity-60 rounded-lg whitespace-nowrap shrink-0"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  {importBusy ? 'Vérification...' : 'Vérifier & Importer'}
                </button>
              </div>
              {importMessage && (
                <p
                  className={`text-xs font-medium ${
                    importIsError
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {importMessage}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {teacherAuthStatus === 'checking' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                Vérification de votre rôle Formateur / Admin côté serveur (<code className="font-mono">GET /api/instructor/roster-summary</code>)...
              </div>
            )}

            {teacherAuthStatus === 'denied' && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Accès refusé par le serveur (contrôle RBAC actif)
                </div>
                <p className="text-xs font-mono text-rose-700 dark:text-rose-300">
                  {teacherAuthMessage}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  L&apos;onglet reste visible pour illustrer la défense en profondeur : seul un
                  compte disposant du rôle <code className="font-mono">instructor</code> ou{' '}
                  <code className="font-mono">admin</code> vérifié côté serveur peut importer et
                  exporter un suivi de classe.
                </p>
              </div>
            )}

            {teacherAuthStatus === 'allowed' && (
              <>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{teacherAuthMessage}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Collectez les codes signés <code className="font-mono">GEM2....</code> de vos
                  élèves : chaque code est contrôlé par le serveur avant ajout au bilan CSV.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={teacherPaste}
                    onChange={(e) => setTeacherPaste(e.target.value)}
                    placeholder="Coller le code signé GEM2.... d'un élève"
                    className="flex-1 px-3 py-2 font-mono text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => void handleAddStudentToRoster()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    Vérifier &amp; Ajouter
                  </button>
                </div>

                {teacherError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">{teacherError}</p>
                )}

                {roster.length === 0 ? (
                  <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500">
                    Aucun élève vérifié ajouté pour le moment. Générez un code signé{' '}
                    <code className="font-mono">GEM2.</code> dans le premier onglet pour tester la
                    vérification serveur.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="px-4 py-2.5 font-semibold">Élève</th>
                          <th className="px-4 py-2.5 font-semibold">Îles</th>
                          <th className="px-4 py-2.5 font-semibold">Étoiles</th>
                          <th className="px-4 py-2.5 font-semibold">Debug</th>
                          <th className="px-4 py-2.5 font-semibold">XP Total</th>
                          <th className="px-3 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
                        {roster.map((st, idx) => {
                          const stars = Object.values(st.starsByIsland).reduce((a, b) => a + b, 0);
                          return (
                            <tr key={`${st.name}-${idx}`} className="bg-white dark:bg-slate-900">
                              <td className="px-4 py-2.5 font-sans font-semibold text-slate-900 dark:text-slate-100">
                                {st.name}
                              </td>
                              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                                {st.completedIslands.length}/{ISLANDS.length}
                              </td>
                              <td className="px-4 py-2.5 text-amber-600 dark:text-amber-400">
                                {stars} ★
                              </td>
                              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                                {st.solvedDebugIds.length}
                              </td>
                              <td className="px-4 py-2.5 font-bold text-sky-700 dark:text-sky-400">
                                {computeXp(st)} XP
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <button
                                  type="button"
                                  aria-label="Retirer"
                                  onClick={() =>
                                    setRoster((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                  className="p-1 text-slate-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {roster.length > 0 && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleExportClassCsv}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg whitespace-nowrap"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      Exporter le suivi de classe (.csv)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
