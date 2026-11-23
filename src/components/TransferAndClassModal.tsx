import React, { useState } from 'react';
import { Copy, Check, Upload, Users, Download, X, Plus, Trash2 } from 'lucide-react';
import { ISLANDS } from '../data/courseData';
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

function encodeProgress(data: TransferPayload): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return `GEM-${btoa(bin)}`;
}

function decodeProgress(code: string): TransferPayload | null {
  try {
    const trimmed = code.trim();
    const raw = trimmed.startsWith('GEM-') ? trimmed.slice(4) : trimmed;
    const bin = atob(raw);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<TransferPayload>;
    if (!Array.isArray(parsed.completedIslands)) return null;
    return {
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : 'Élève',
      completedIslands: parsed.completedIslands.filter((n) => typeof n === 'number'),
      starsByIsland:
        parsed.starsByIsland && typeof parsed.starsByIsland === 'object'
          ? parsed.starsByIsland
          : {},
      quizBonusXp: typeof parsed.quizBonusXp === 'number' ? parsed.quizBonusXp : 0,
      solvedDebugIds: Array.isArray(parsed.solvedDebugIds) ? parsed.solvedDebugIds : [],
      extraBonusXp: typeof parsed.extraBonusXp === 'number' ? parsed.extraBonusXp : 0,
    };
  } catch {
    return null;
  }
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
  const [copied, setCopied] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Teacher Class Roster (from pasted student transfer codes)
  const [roster, setRoster] = useState<TransferPayload[]>([]);
  const [teacherPaste, setTeacherPaste] = useState('');
  const [teacherError, setTeacherError] = useState<string | null>(null);

  if (!isOpen) return null;

  const myCode = encodeProgress({ ...currentProgress, name: studentName.trim() || 'Élève' });

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(myCode);
      playSuccess();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      playClick();
    }
  };

  const handleImportMyProgress = () => {
    const decoded = decodeProgress(importInput);
    if (!decoded) {
      playError();
      setImportMessage('Code invalide. Vérifiez que le code commence bien par GEM-...');
      return;
    }
    playSuccess();
    onImportProgress(decoded);
    setImportInput('');
    setImportMessage(`Progression de ${decoded.name} restaurée avec succès !`);
  };

  const handleAddStudentToRoster = () => {
    const decoded = decodeProgress(teacherPaste);
    if (!decoded) {
      playError();
      setTeacherError('Code élève invalide. Demandez à l’élève de copier son code GEM-...');
      return;
    }
    playSuccess();
    setRoster((prev) => [...prev, decoded]);
    setTeacherPaste('');
    setTeacherError(null);
  };

  const handleAddCurrentToRoster = () => {
    playSuccess();
    setRoster((prev) => [
      ...prev,
      { ...currentProgress, name: studentName.trim() || 'Élève actuel' },
    ]);
  };

  const handleExportClassCsv = () => {
    playSuccess();
    const header = 'Eleve,Iles validees (/6),Etoiles (/18),Tickets Debug (/5),XP Total';
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
            <Users className="w-5 h-5 text-sky-700 dark:text-sky-400" />
            <h2
              id="transfer-modal-title"
              className="font-display text-xl font-bold text-slate-900 dark:text-slate-100"
            >
              Code de transfert &amp; Suivi de classe
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
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              tab === 'transfer'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Code de transfert (Élève)
          </button>
          <button
            type="button"
            onClick={() => {
              playClick();
              setTab('teacher');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              tab === 'teacher'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Tableau Formateur ({roster.length})
          </button>
        </div>

        {tab === 'transfer' ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Changez d&apos;ordinateur sans perdre vos XP ni vos badges : copiez ce code et
                collez-le sur un autre poste (ou envoyez-le à votre enseignant).
              </p>
              <div className="space-y-1.5">
                <label
                  htmlFor="transfer-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Prénom / Pseudo inclus dans le code
                </label>
                <input
                  id="transfer-name"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={myCode}
                  aria-label="Votre code de transfert"
                  className="flex-1 px-3 py-2 font-mono text-xs bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg whitespace-nowrap shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Restaurer une progression depuis un code GEM-...
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder="Collez ici un code GEM-..."
                  className="flex-1 px-3 py-2 font-mono text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleImportMyProgress}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-sky-700 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  Importer
                </button>
              </div>
              {importMessage && (
                <p className="text-xs text-sky-800 dark:text-sky-300 font-medium">
                  {importMessage}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Collectez les codes <code className="font-mono">GEM-...</code> de vos élèves pour
              centraliser leurs résultats et exporter un bilan CSV de la séance.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={teacherPaste}
                onChange={(e) => setTeacherPaste(e.target.value)}
                placeholder="Coller le code GEM-... d'un élève"
                className="flex-1 px-3 py-2 font-mono text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleAddStudentToRoster}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                Ajouter l&apos;élève
              </button>
              <button
                type="button"
                onClick={handleAddCurrentToRoster}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg whitespace-nowrap shrink-0"
              >
                + Ce poste
              </button>
            </div>

            {teacherError && <p className="text-xs text-red-600 dark:text-red-400">{teacherError}</p>}

            {roster.length === 0 ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500">
                Aucun élève ajouté pour le moment. Cliquez sur <strong>+ Ce poste</strong> pour
                tester le tableau ou collez un code élève.
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
                            {stars}/18 ★
                          </td>
                          <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                            {st.solvedDebugIds.length}/5
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
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  Exporter le suivi de classe (.csv)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
