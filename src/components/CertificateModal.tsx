import React, { useEffect, useState } from 'react';
import { Award, Download, Printer, X, Check } from 'lucide-react';
import { CAREER_TRACKS, CareerTrack, ISLANDS } from '../data/courseData';
import { getHighestUnlockedBadge } from '../data/expertiseBadges';
import { getExamMention } from './ExamBlancPanel';
import { playClick, playSuccess } from '../utils/sound';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedIslands: number[];
  starsByIsland: Record<number, number>;
  totalXp: number;
  bestExamScore?: number | null;
  passedExamsCount?: number;
  selectedTrackId?: CareerTrack['id'];
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  completedIslands,
  starsByIsland,
  totalXp,
  bestExamScore = null,
  passedExamsCount = 0,
  selectedTrackId = 'all',
}) => {
  const [learnerName, setLearnerName] = useState('Architecte Explorateur');
  const [trackId, setTrackId] = useState<CareerTrack['id']>(selectedTrackId);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    setTrackId(selectedTrackId);
  }, [selectedTrackId, isOpen]);

  if (!isOpen) return null;

  const activeTrack = CAREER_TRACKS.find((t) => t.id === trackId) ?? CAREER_TRACKS[0];
  const trackCompletedCount = activeTrack.islandIds.filter((id) =>
    completedIslands.includes(id)
  ).length;
  const trackTotalCount = activeTrack.islandIds.length;
  const trackStars = activeTrack.islandIds.reduce(
    (sum, id) => sum + (starsByIsland[id] ?? 0),
    0
  );
  const trackMaxStars = trackTotalCount * 3;

  const highestMedal = getHighestUnlockedBadge(totalXp, passedExamsCount, bestExamScore);

  const rank =
    trackCompletedCount === trackTotalCount
      ? trackId === 'all'
        ? 'Grand Architecte Céleste'
        : `Certifié · ${activeTrack.label}`
      : highestMedal
      ? highestMedal.title
      : completedIslands.length >= 10
      ? 'Ingénieur Cloud & Cyber Confirmé'
      : completedIslands.length >= 4
      ? 'Technicien Réseau & Systèmes'
      : 'Apprenti Explorateur';

  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const safeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const handleDownloadSvg = () => {
    playSuccess();
    const badgesList = ISLANDS.filter(
      (i) => activeTrack.islandIds.includes(i.id) && completedIslands.includes(i.id)
    )
      .map((i) => i.badgeTitle)
      .slice(0, 8)
      .join(' · ');

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="760" viewBox="0 0 1120 760">
  <rect width="1120" height="760" fill="#F7F9FC"/>
  <rect x="28" y="28" width="1064" height="704" rx="18" fill="#FFFFFF" stroke="#0369A1" stroke-width="4"/>
  <rect x="44" y="44" width="1032" height="672" rx="12" fill="none" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="560" y="108" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="600" fill="#0369A1" letter-spacing="2">L'ARCHIPEL DE CYBERLAND · RÉSEAUX, CLOUD &amp; CYBERSÉCURITÉ</text>
  <text x="560" y="172" text-anchor="middle" font-family="sans-serif" font-size="40" font-weight="700" fill="#0F172A">Diplôme : ${safeXml(
    activeTrack.certificateTitle
  )}</text>
  <text x="560" y="230" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#475569">Décerné avec félicitations à</text>
  <text x="560" y="302" text-anchor="middle" font-family="sans-serif" font-size="40" font-weight="700" fill="#0369A1">${safeXml(
    learnerName.trim() || 'Architecte Explorateur'
  )}</text>
  <line x1="260" y1="330" x2="860" y2="330" stroke="#CBD5E1" stroke-width="2"/>
  <text x="560" y="382" text-anchor="middle" font-family="sans-serif" font-size="17" fill="#334155">Parcours « ${safeXml(
    activeTrack.label
  )} » — ${trackCompletedCount} sur ${trackTotalCount} îles validées</text>
  <text x="560" y="418" text-anchor="middle" font-family="sans-serif" font-size="19" font-weight="700" fill="#059669">Rang obtenu : ${safeXml(
    rank
  )}${
    bestExamScore !== null
      ? ` · Examen Blanc : ${bestExamScore}/20 (${safeXml(getExamMention(bestExamScore))})`
      : ''
  }</text>
  <rect x="140" y="468" width="250" height="92" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>
  <text x="265" y="501" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#64748B">EXPÉRIENCE TOTALE</text>
  <text x="265" y="538" text-anchor="middle" font-family="monospace" font-size="26" font-weight="700" fill="#0F172A">${totalXp} XP</text>
  <rect x="435" y="468" width="250" height="92" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>
  <text x="560" y="501" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#64748B">ÉTOILES DU PARCOURS</text>
  <text x="560" y="538" text-anchor="middle" font-family="monospace" font-size="26" font-weight="700" fill="#D97706">${trackStars} / ${trackMaxStars} ★</text>
  <rect x="730" y="468" width="250" height="92" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>
  <text x="855" y="501" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#64748B">ÎLES VALIDÉES</text>
  <text x="855" y="538" text-anchor="middle" font-family="monospace" font-size="26" font-weight="700" fill="#059669">${trackCompletedCount} / ${trackTotalCount}</text>
  <text x="560" y="616" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#475569">${safeXml(
    badgesList || 'Parcours en cours sur Cyberland'
  )}</text>
  <text x="560" y="672" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#64748B">Délivré le ${safeXml(
    dateLabel
  )} · Académie interactive Cyberland</text>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diplome-cyberland-${trackId}-${(learnerName || 'architecte')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cert-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 my-auto shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-sky-700 dark:text-sky-400" />
            <h2
              id="cert-title"
              className="font-display text-xl font-bold text-slate-900 dark:text-slate-100"
            >
              Diplôme Cyberland imprimable
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            aria-label="Fermer"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name & Career Track inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="learner-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Nom et prénom sur le diplôme
            </label>
            <input
              id="learner-name"
              type="text"
              value={learnerName}
              onChange={(e) => setLearnerName(e.target.value)}
              maxLength={48}
              placeholder="Ex. Camille Laurent"
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cert-track"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Spécialité / Parcours métier
            </label>
            <select
              id="cert-track"
              value={trackId}
              onChange={(e) => {
                playClick();
                setTrackId(e.target.value as CareerTrack['id']);
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              {CAREER_TRACKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Certificate Preview (paper-style preview) */}
        <div className="bg-[#F7F9FC] border-2 border-sky-700 rounded-xl p-6 sm:p-8 text-center space-y-4">
          <p className="text-xs font-semibold text-sky-800 tracking-wide">
            L&apos;Archipel de Cyberland · Réseaux, Cloud &amp; Cybersécurité
          </p>
          <div className="space-y-1">
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {activeTrack.certificateTitle}
            </h3>
            <p className="text-xs text-slate-500">Décerné avec félicitations à</p>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-sky-800 border-b border-slate-300 pb-3 max-w-md mx-auto">
            {learnerName.trim() || 'Architecte Explorateur'}
          </p>
          <p className="text-xs text-slate-600">
            Parcours : <strong>{activeTrack.label}</strong>
          </p>
          <p className="text-sm text-slate-700">
            Rang obtenu : <strong className="text-emerald-800">{rank}</strong>
            {bestExamScore !== null && (
              <>
                {' '}
                · Examen Blanc :{' '}
                <strong className="font-mono text-sky-800 tabular-nums">
                  {bestExamScore}/20
                </strong>{' '}
                ({getExamMention(bestExamScore)})
              </>
            )}
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-[11px] text-slate-500">Expérience</p>
              <p className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                {totalXp} XP
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-[11px] text-slate-500">Étoiles parcours</p>
              <p className="font-mono text-lg font-bold text-amber-600 tabular-nums">
                {trackStars} / {trackMaxStars} ★
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-[11px] text-slate-500">Îles validées</p>
              <p className="font-mono text-lg font-bold text-emerald-700 tabular-nums">
                {trackCompletedCount} / {trackTotalCount}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500 pt-2">Délivré le {dateLabel}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              playClick();
              window.print();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimer / PDF
          </button>
          <button
            type="button"
            onClick={handleDownloadSvg}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
          >
            {downloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {downloaded ? 'Diplôme téléchargé' : 'Télécharger le diplôme (.svg)'}
          </button>
        </div>
      </div>
    </div>
  );
};
