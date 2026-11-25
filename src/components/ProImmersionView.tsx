import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Download,
  HelpCircle,
  Mail,
  MessageSquare,
  ShieldCheck,
  Terminal,
  Ticket,
  XCircle,
} from 'lucide-react';
import {
  IMMERSION_COMPANY,
  IMMERSION_DAYS,
  ImmersionDay,
} from '../data/proImmersionData';
import { getNumberedCourseName } from '../data/courseData';
import { playClick, playError, playSuccess, playVictory } from '../utils/sound';

interface ProImmersionViewProps {
  completedDays: number[];
  onCompleteDay: (dayNumber: number, xpReward: number) => void;
  onOpenIsland: (islandId: number) => void;
}

export const ProImmersionView: React.FC<ProImmersionViewProps> = ({
  completedDays,
  onCompleteDay,
  onOpenIsland,
}) => {
  const [selectedDayNum, setSelectedDayNum] = useState<number>(() => {
    const nextUnfinished = IMMERSION_DAYS.find((d) => !completedDays.includes(d.dayNumber));
    return nextUnfinished ? nextUnfinished.dayNumber : 1;
  });

  // Per-day interactive state
  const [triageChoiceByDay, setTriageChoiceByDay] = useState<Record<number, string>>({});
  const [checklistByDay, setChecklistByDay] = useState<Record<number, string[]>>({});
  const [checklistValidatedByDay, setChecklistValidatedByDay] = useState<Record<number, boolean>>({});
  const [checklistErrorByDay, setChecklistErrorByDay] = useState<Record<number, string | null>>({});

  const [auditChoiceByDay, setAuditChoiceByDay] = useState<
    Record<number, Record<string, 'keep' | 'restrict' | 'disable'>>
  >({});
  const [auditValidatedByDay, setAuditValidatedByDay] = useState<Record<number, boolean>>({});
  const [auditErrorByDay, setAuditErrorByDay] = useState<Record<number, string | null>>({});

  const [commChoiceByDay, setCommChoiceByDay] = useState<Record<number, string>>({});
  const [hintLevelByDay, setHintLevelByDay] = useState<Record<number, number>>({});
  const [copiedCv, setCopiedCv] = useState(false);

  const day: ImmersionDay =
    IMMERSION_DAYS.find((d) => d.dayNumber === selectedDayNum) ?? IMMERSION_DAYS[0];

  const isDayDone = completedDays.includes(day.dayNumber);
  const triageChoice = triageChoiceByDay[day.dayNumber] ?? null;
  const triageSelectedOpt = day.step1Triage.options.find((o) => o.id === triageChoice);
  const step1Passed = Boolean(triageSelectedOpt?.isCorrect);

  const step2Passed =
    day.step2Mode === 'checklist'
      ? Boolean(checklistValidatedByDay[day.dayNumber])
      : Boolean(auditValidatedByDay[day.dayNumber]);

  const commChoice = commChoiceByDay[day.dayNumber] ?? null;
  const commSelectedOpt = day.step3Options.find((o) => o.id === commChoice);
  const step3Passed = Boolean(commSelectedOpt?.isBest);

  const checkAndAwardCompletion = (
    nextS1: boolean,
    nextS2: boolean,
    nextS3: boolean,
    targetDay: ImmersionDay
  ) => {
    if (nextS1 && nextS2 && nextS3) {
      playVictory();
      onCompleteDay(targetDay.dayNumber, targetDay.xpReward);
    }
  };

  const handleSelectTriage = (optId: string) => {
    const opt = day.step1Triage.options.find((o) => o.id === optId);
    if (!opt) return;
    setTriageChoiceByDay((prev) => ({ ...prev, [day.dayNumber]: optId }));
    if (opt.isCorrect) {
      playSuccess();
      checkAndAwardCompletion(true, step2Passed, step3Passed, day);
    } else {
      playError();
    }
  };

  const handleToggleChecklistItem = (itemId: string) => {
    if (checklistValidatedByDay[day.dayNumber]) return;
    playClick();
    setChecklistErrorByDay((prev) => ({ ...prev, [day.dayNumber]: null }));
    setChecklistByDay((prev) => {
      const current = prev[day.dayNumber] ?? [];
      const next = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId];
      return { ...prev, [day.dayNumber]: next };
    });
  };

  const handleValidateChecklist = () => {
    const items = day.checklistItems ?? [];
    const picked = new Set(checklistByDay[day.dayNumber] ?? []);
    const expected = items.filter((i) => i.shouldSelect).map((i) => i.id);
    const forbiddenPicked = items.filter((i) => !i.shouldSelect && picked.has(i.id));
    const missingExpected = expected.filter((id) => !picked.has(id));

    if (forbiddenPicked.length === 0 && missingExpected.length === 0) {
      setChecklistValidatedByDay((prev) => ({ ...prev, [day.dayNumber]: true }));
      setChecklistErrorByDay((prev) => ({ ...prev, [day.dayNumber]: null }));
      playSuccess();
      checkAndAwardCompletion(step1Passed, true, step3Passed, day);
    } else {
      playError();
      const parts: string[] = [];
      if (missingExpected.length > 0) {
        parts.push(
          `Il manque ${missingExpected.length} action${missingExpected.length > 1 ? 's' : ''} essentielle${missingExpected.length > 1 ? 's' : ''}.`
        );
      }
      if (forbiddenPicked.length > 0) {
        parts.push(
          `${forbiddenPicked.length} action${forbiddenPicked.length > 1 ? 's' : ''} sélectionnée${forbiddenPicked.length > 1 ? 's' : ''} est risquée ou inutile (« ${forbiddenPicked[0].label} »).`
        );
      }
      setChecklistErrorByDay((prev) => ({ ...prev, [day.dayNumber]: parts.join(' ') }));
    }
  };

  const handlePickAuditAction = (rowId: string, action: 'keep' | 'restrict' | 'disable') => {
    if (auditValidatedByDay[day.dayNumber]) return;
    playClick();
    setAuditErrorByDay((prev) => ({ ...prev, [day.dayNumber]: null }));
    setAuditChoiceByDay((prev) => ({
      ...prev,
      [day.dayNumber]: {
        ...(prev[day.dayNumber] ?? {}),
        [rowId]: action,
      },
    }));
  };

  const handleValidateAuditTable = () => {
    const rows = day.auditRows ?? [];
    const choices = auditChoiceByDay[day.dayNumber] ?? {};
    const unanswered = rows.filter((r) => !choices[r.id]);
    if (unanswered.length > 0) {
      playError();
      setAuditErrorByDay((prev) => ({
        ...prev,
        [day.dayNumber]: `Choisissez une décision pour les ${unanswered.length} compte(s) restant(s).`,
      }));
      return;
    }

    const wrong = rows.filter((r) => choices[r.id] !== r.expectedAction);
    if (wrong.length === 0) {
      setAuditValidatedByDay((prev) => ({ ...prev, [day.dayNumber]: true }));
      setAuditErrorByDay((prev) => ({ ...prev, [day.dayNumber]: null }));
      playSuccess();
      checkAndAwardCompletion(step1Passed, true, step3Passed, day);
    } else {
      playError();
      setAuditErrorByDay((prev) => ({
        ...prev,
        [day.dayNumber]: `${wrong.length} décision(s) à revoir (ex. pour ${wrong[0].account} : relisez le contexte RH et le principe du moindre privilège).`,
      }));
    }
  };

  const handleSelectCommunication = (optId: string) => {
    const opt = day.step3Options.find((o) => o.id === optId);
    if (!opt) return;
    setCommChoiceByDay((prev) => ({ ...prev, [day.dayNumber]: optId }));
    if (opt.isBest) {
      playSuccess();
      checkAndAwardCompletion(step1Passed, step2Passed, true, day);
    } else {
      playError();
    }
  };

  const completedDayObjects = useMemo(
    () => IMMERSION_DAYS.filter((d) => completedDays.includes(d.dayNumber)),
    [completedDays]
  );

  const cvExportText = useMemo(() => {
    const activeList = completedDayObjects.length > 0 ? completedDayObjects : [day];
    const lines = [
      `# Immersion Professionnelle — ${IMMERSION_COMPANY.name} (${IMMERSION_COMPANY.city})`,
      `Poste simulé : ${IMMERSION_COMPANY.yourRole}`,
      `Journées validées : ${completedDays.length} / ${IMMERSION_DAYS.length}`,
      '',
      '## Réalisations prêtes pour votre CV',
      ...activeList.map((d) => `- [${d.dayLabel}] ${d.cvBullet}`),
      '',
      '## Préparation entretien (Questions & Réponses claires en français)',
      ...activeList.flatMap((d) => [
        `### ${d.dayLabel} — ${d.interviewQuestion}`,
        d.interviewAnswer,
        '',
      ]),
    ];
    return lines.join('\n');
  }, [completedDayObjects, completedDays.length, day]);

  const handleCopyCv = async () => {
    try {
      await navigator.clipboard.writeText(cvExportText);
      playSuccess();
      setCopiedCv(true);
      window.setTimeout(() => setCopiedCv(false), 2200);
    } catch {
      playClick();
    }
  };

  const handleDownloadReport = () => {
    playSuccess();
    const blob = new Blob([cvExportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bilan-immersion-pro-cyberland.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hintLevel = hintLevelByDay[day.dayNumber] ?? 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Header: Clear Francophone Beginner Positioning (No CTF clone) */}
      <section className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <p className="text-xs font-medium text-sky-700 dark:text-cyan-400">
              Immersion professionnelle francophone · Conçue pour les débutants · Référentiels ANSSI &amp; RGPD
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              Ma Première Semaine en Poste
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Loin des plateformes CTF anglophones réservées aux initiés, vivez une vraie semaine
              d&apos;intégration dans une PME française ({IMMERSION_COMPANY.name}, {IMMERSION_COMPANY.city}) :
              tickets réels, jargon traduit en français simple, décisions techniques guidées et
              communication professionnelle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 shrink-0 font-mono tabular-nums">
            <span>
              Semaine :{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {completedDays.length} / {IMMERSION_DAYS.length} jours
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Récompense :{' '}
              <strong className="text-emerald-700 dark:text-emerald-400">
                +{completedDays.length * 90} / {IMMERSION_DAYS.length * 90} XP
              </strong>
            </span>
          </div>
        </div>

        {/* Company Context Strip */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
            <Building2 className="w-3.5 h-3.5 text-sky-700 dark:text-cyan-400 shrink-0" />
            {IMMERSION_COMPANY.name} — {IMMERSION_COMPANY.sector}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            Poste : {IMMERSION_COMPANY.yourRole}
          </span>
          <span aria-hidden="true">·</span>
          <span>Tutrice : {IMMERSION_COMPANY.supervisor}</span>
        </div>

        {/* 5-Day Horizontal Selector */}
        <div
          role="tablist"
          aria-label="Choisir une journée de votre semaine en poste"
          className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2"
        >
          {IMMERSION_DAYS.map((d) => {
            const active = d.dayNumber === day.dayNumber;
            const done = completedDays.includes(d.dayNumber);
            return (
              <button
                key={d.dayNumber}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  playClick();
                  setSelectedDayNum(d.dayNumber);
                }}
                className={`text-left px-3.5 py-3 rounded-xl border transition-colors ${
                  active
                    ? 'bg-sky-700 dark:bg-cyan-500 border-sky-700 dark:border-cyan-400 text-white dark:text-slate-950'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
                  <span className="font-bold">
                    Jour {d.dayNumber} · {d.dayLabel}
                  </span>
                  {done && (
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-white dark:text-slate-950' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    />
                  )}
                </div>
                <div
                  className={`text-xs mt-1 truncate ${
                    active
                      ? 'text-sky-100 dark:text-slate-900 font-medium'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {d.roleContext}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main 2-Zone Educational Workplace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT ZONE (8 cols): Realistic Workplace Inbox + 3 Guided Operational Steps */}
        <div className="lg:col-span-8 space-y-6">
          {/* Day Briefing & Incoming Messages */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                <span className="font-semibold text-sky-700 dark:text-cyan-400">
                  {day.dayLabel} · {day.timeLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>{day.difficultyLabel}</span>
                <span aria-hidden="true">·</span>
                <span>~{day.estimatedMinutes} min</span>
                <span aria-hidden="true">·</span>
                <span>+{day.xpReward} XP</span>
                {isDayDone && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      Journée validée
                    </span>
                  </>
                )}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                {day.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {day.summary}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                Pourquoi c&apos;est clé en entreprise : {day.whyRealWorld}
              </p>
            </div>

            {/* Realistic Incoming Workplace Messages */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Messages et alertes reçus sur votre poste
              </h3>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {day.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50/70 dark:bg-slate-950/60 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                        {msg.channel === 'Email' && (
                          <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 shrink-0" />
                        )}
                        {msg.channel === 'Messagerie Équipe' && (
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        )}
                        {msg.channel === 'Ticket GLPI' && (
                          <Ticket className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        )}
                        {msg.channel === 'Alerte Console' && (
                          <Terminal className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                        <span>{msg.sender}</span>
                        <span className="font-normal text-slate-500 dark:text-slate-400">
                          — {msg.role}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {msg.channel} · {msg.time}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Objet : {msg.subject}
                    </div>
                    <p
                      className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                        msg.channel === 'Alerte Console'
                          ? 'font-mono bg-slate-900 text-slate-200 p-3 rounded-lg text-xs'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {msg.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* STEP 1: QUALIFICATION / TRIAGE */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Étape 1. Analyser et qualifier la situation
              </h3>
              {step1Passed && (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Validé
                </span>
              )}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">{day.step1Triage.prompt}</p>
            <div className="space-y-2">
              {day.step1Triage.options.map((opt) => {
                const picked = triageChoice === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectTriage(opt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-colors ${
                      picked
                        ? opt.isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-950 dark:text-emerald-100 font-semibold'
                          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-sky-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {triageSelectedOpt && (
              <p
                className={`text-xs leading-relaxed p-3 rounded-xl border ${
                  triageSelectedOpt.isCorrect
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                {triageSelectedOpt.feedback}
              </p>
            )}
          </section>

          {/* STEP 2: OPERATIONAL CHECKLIST OR INTERACTIVE AD AUDIT TABLE */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Étape 2. {day.step2Title}
              </h3>
              {step2Passed && (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Validé
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {day.step2Instruction}
            </p>

            {day.step2Mode === 'checklist' && day.checklistItems && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {day.checklistItems.map((item) => {
                    const checked = (checklistByDay[day.dayNumber] ?? []).includes(item.id);
                    const validated = Boolean(checklistValidatedByDay[day.dayNumber]);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={validated}
                        onClick={() => handleToggleChecklistItem(item.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 ${
                          validated
                            ? item.shouldSelect
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 text-slate-900 dark:text-slate-100'
                              : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                            : checked
                              ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-600 text-slate-900 dark:text-slate-100'
                              : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            checked
                              ? 'bg-sky-700 border-sky-700 text-white'
                              : 'border-slate-400 dark:border-slate-600'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </span>
                        <div className="space-y-1 text-xs sm:text-sm">
                          <div className="font-medium">{item.label}</div>
                          {validated && (
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              {item.reason}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!checklistValidatedByDay[day.dayNumber] && (
                  <button
                    type="button"
                    onClick={handleValidateChecklist}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 text-white transition-colors whitespace-nowrap"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    Appliquer ce plan d&apos;action
                  </button>
                )}

                {checklistErrorByDay[day.dayNumber] && (
                  <p className="text-xs text-rose-700 dark:text-rose-400 flex items-start gap-1.5">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{checklistErrorByDay[day.dayNumber]}</span>
                  </p>
                )}
              </div>
            )}

            {day.step2Mode === 'audit-table' && day.auditRows && (
              <div className="space-y-3">
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Compte AD &amp; Service</th>
                        <th className="py-2.5 px-3 font-semibold">Droits constatés</th>
                        <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Votre décision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {day.auditRows.map((row) => {
                        const picked = auditChoiceByDay[day.dayNumber]?.[row.id];
                        const validated = Boolean(auditValidatedByDay[day.dayNumber]);
                        return (
                          <tr key={row.id} className="bg-white dark:bg-slate-900">
                            <td className="py-3 px-3 align-top">
                              <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {row.account}
                              </div>
                              <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                                {row.department}
                              </div>
                            </td>
                            <td className="py-3 px-3 align-top text-slate-700 dark:text-slate-300">
                              <div>{row.detail}</div>
                              {validated && (
                                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                                  {row.explanation}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 align-top whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                {(
                                  [
                                    { id: 'keep', label: 'Conserver' },
                                    { id: 'restrict', label: 'Réduire' },
                                    { id: 'disable', label: 'Désactiver' },
                                  ] as const
                                ).map((btn) => {
                                  const active = picked === btn.id;
                                  return (
                                    <button
                                      key={btn.id}
                                      type="button"
                                      disabled={validated}
                                      onClick={() => handlePickAuditAction(row.id, btn.id)}
                                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold border transition-colors whitespace-nowrap ${
                                        active
                                          ? 'bg-sky-700 dark:bg-cyan-500 border-sky-700 dark:border-cyan-400 text-white dark:text-slate-950'
                                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                                      }`}
                                    >
                                      {btn.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {!auditValidatedByDay[day.dayNumber] && (
                  <button
                    type="button"
                    onClick={handleValidateAuditTable}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 text-white transition-colors whitespace-nowrap"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    Valider ma revue des 5 comptes
                  </button>
                )}

                {auditErrorByDay[day.dayNumber] && (
                  <p className="text-xs text-rose-700 dark:text-rose-400 flex items-start gap-1.5">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{auditErrorByDay[day.dayNumber]}</span>
                  </p>
                )}
              </div>
            )}
          </section>

          {/* STEP 3: PROFESSIONAL FRENCH COMMUNICATION */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Étape 3. Communiquer clairement en entreprise
              </h3>
              {step3Passed && (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Validé
                </span>
              )}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {day.step3CommunicationPrompt}
            </p>
            <div className="space-y-3">
              {day.step3Options.map((opt) => {
                const picked = commChoice === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectCommunication(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors space-y-1.5 ${
                      picked
                        ? opt.isBest
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-950 dark:text-emerald-100'
                          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200'
                        : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-sky-500'
                    }`}
                  >
                    <div className="text-xs font-bold text-sky-700 dark:text-cyan-400">
                      Option : {opt.toneLabel}
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed">« {opt.preview} »</p>
                  </button>
                );
              })}
            </div>
            {commSelectedOpt && (
              <p
                className={`text-xs leading-relaxed p-3 rounded-xl border ${
                  commSelectedOpt.isBest
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                {commSelectedOpt.feedback}
              </p>
            )}

            {isDayDone && day.dayNumber < IMMERSION_DAYS.length && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Journée {day.dayNumber} terminée (+{day.xpReward} XP ajoutés).
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedDayNum(day.dayNumber + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Passer au Jour {day.dayNumber + 1} ({IMMERSION_DAYS[day.dayNumber].dayLabel})
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT ZONE (4 cols): French Jargon Decoder, Beginner Tutor Hints & Course Bridge */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Décodeur de Jargon FR */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-cyan-400">
                <BookOpen className="w-4 h-4 shrink-0" />
                Décodeur de jargon (Français simple)
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Les termes techniques du {day.dayLabel.toLowerCase()} traduits sans détour.
              </p>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {day.jargon.map((entry) => (
                <div key={entry.term} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {entry.term}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {entry.plainFrench}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    En pratique : {entry.workplaceExample}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Coup de pouce débutant (Progressive Tutor) */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                <HelpCircle className="w-4 h-4 shrink-0" />
                Coup de pouce Tutrice (Nadia)
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {hintLevel} / 2
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Vous débutez ? Demandez un indice progressif sans aucune pénalité d&apos;XP.
            </p>
            {hintLevel >= 1 && (
              <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 leading-relaxed">
                <strong>Indice 1 :</strong> {day.beginnerHints[0]}
              </p>
            )}
            {hintLevel >= 2 && (
              <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 leading-relaxed">
                <strong>Indice 2 :</strong> {day.beginnerHints[1]}
              </p>
            )}
            {hintLevel < 2 && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setHintLevelByDay((prev) => ({
                    ...prev,
                    [day.dayNumber]: Math.min(2, (prev[day.dayNumber] ?? 0) + 1),
                  }));
                }}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors"
              >
                {hintLevel === 0 ? 'Afficher un premier indice' : 'Afficher le conseil complet'}
              </button>
            )}
          </section>

          {/* Passerelle vers le cours lié */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Besoin de revoir les bases de cette mission ?
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Ouvrez le cours illustré correspondant dans Cyberland pour ancrer le mécanisme avant
              de revenir terminer votre journée.
            </p>
            <button
              type="button"
              onClick={() => {
                playClick();
                onOpenIsland(day.relatedIslandId);
              }}
              className="w-full inline-flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
            >
              <span className="truncate">{getNumberedCourseName(day.relatedIslandId)}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </section>
        </aside>
      </div>

      {/* Career Value Section: Francophone CV Bullets & Interview Preparation */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1 max-w-2xl">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Valorisation carrière · Alternance, BTS SIO, BUT R&amp;T &amp; reconversion
            </p>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              Votre Dossier d&apos;Expérience (CV &amp; Entretien)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Chaque journée validée enrichit automatiquement vos réalisations concrètes à citer sur
              votre CV et en entretien d&apos;embauche.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void handleCopyCv()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap"
            >
              {copiedCv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCv ? 'Copié' : 'Copier pour mon CV'}
            </button>
            <button
              type="button"
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 text-white transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              Télécharger le bilan (.md)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Lignes de CV générées ({completedDays.length}/{IMMERSION_DAYS.length} débloquées)
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {IMMERSION_DAYS.map((d) => {
                const unlocked = completedDays.includes(d.dayNumber);
                return (
                  <li
                    key={d.dayNumber}
                    className={`p-3 rounded-xl border ${
                      unlocked
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100'
                        : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span className="font-mono text-[11px] font-bold block mb-0.5">
                      {d.dayLabel} {unlocked ? '· Validé' : '· À valider'}
                    </span>
                    {d.cvBullet}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Question d&apos;entretien associée ({day.dayLabel})
            </h3>
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                « {day.interviewQuestion} »
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Réponse claire et structurée à retenir :
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {day.interviewAnswer}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
