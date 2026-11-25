import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  Crosshair,
  FileCode2,
  FileSearch,
  FileText,
  Filter,
  Pause,
  Pin,
  PinOff,
  Play,
  RotateCcw,
  Search,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  XCircle,
} from 'lucide-react';
import {
  AssetStatus,
  IocExtractionChallenge,
  LogSeverity,
  MISSION_OPERATIONAL_PACKS,
  MissionLogEntry,
  PRO_MISSIONS,
  ProMission,
} from '../data/proMissionsData';
import { getShortNumberedCourseName } from '../data/courseData';
import { EASE_SWISS, SPRING_SNAPPY } from './MotionPrimitives';
import { playClick, playError, playPacket, playSuccess, playVictory } from '../utils/sound';

interface ProMissionsViewProps {
  initialMissionId?: string | null;
  completedMissionIds: string[];
  missionBestScores: Record<string, number>;
  onCompleteMission: (missionId: string, score: number, xpReward: number) => void;
  onOpenIsland: (islandId: number) => void;
}

type MissionTab = 'briefing' | 'siem' | 'investigation' | 'remediation';

interface CliHistoryEntry {
  id: string;
  command: string;
  output: string;
}

interface MissionSessionState {
  pinnedLogIds: string[];
  selectedLogId: string | null;
  executedCommandIds: string[];
  cliHistory: CliHistoryEntry[];
  iocInputs: Record<string, string>;
  iocVerified: Record<string, boolean>;
  selectedAnswers: Record<string, number>;
  checkedQuestions: Record<string, boolean>;
  selectedActionIds: string[];
  sigmaAnswer: number | null;
  sigmaDeployed: boolean;
  submitted: boolean;
  lastScore: number | null;
  elapsedSec: number;
}

function createInitialSession(mission: ProMission): MissionSessionState {
  return {
    pinnedLogIds: [],
    selectedLogId: mission.logs[0]?.id ?? null,
    executedCommandIds: [],
    cliHistory: [
      {
        id: 'init',
        command: 'status --ticket ' + mission.ticketId,
        output: `Session analyste ouverte pour ${mission.ticketId} (${mission.organization}).\nJournaux chargés : ${mission.logs.length} événements · Tapez "help", "grep <mot>", "ip <adresse>", "assets" ou lancez une commande forensique ci-dessus.`,
      },
    ],
    iocInputs: {},
    iocVerified: {},
    selectedAnswers: {},
    checkedQuestions: {},
    selectedActionIds: [],
    sigmaAnswer: null,
    sigmaDeployed: false,
    submitted: false,
    lastScore: null,
    elapsedSec: 0,
  };
}

function normalizeIocValue(val: string): string {
  return val.trim().toLowerCase().replace(/^["'`]+|["'`]+$/g, '');
}

function isIocMatch(challenge: IocExtractionChallenge, rawValue: string): boolean {
  const normalized = normalizeIocValue(rawValue);
  if (!normalized) return false;
  return challenge.acceptedAnswers.some((ans) => normalizeIocValue(ans) === normalized);
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getLogSeverityClass(sev: LogSeverity): string {
  switch (sev) {
    case 'CRITIQUE':
      return 'text-rose-700 dark:text-rose-400 font-semibold';
    case 'ALERTE':
      return 'text-amber-700 dark:text-amber-400 font-semibold';
    default:
      return 'text-slate-500 dark:text-slate-400';
  }
}

function getAssetStatusClass(status: AssetStatus): string {
  switch (status) {
    case 'Compromis':
      return 'text-rose-700 dark:text-rose-400 font-semibold';
    case 'Suspect':
      return 'text-amber-700 dark:text-amber-400 font-semibold';
    case 'Ciblé':
      return 'text-sky-700 dark:text-sky-400 font-semibold';
    default:
      return 'text-emerald-700 dark:text-emerald-400 font-medium';
  }
}

function getGradeFromScore(score: number): { letter: string; label: string } {
  if (score >= 92) return { letter: 'S', label: 'Analyste Lead SOC' };
  if (score >= 80) return { letter: 'A', label: 'Analyste Opérationnel' };
  if (score >= 70) return { letter: 'B', label: 'Incident Maîtrisé' };
  return { letter: 'C', label: 'Enquête Incomplète' };
}

export const ProMissionsView: React.FC<ProMissionsViewProps> = ({
  initialMissionId = null,
  completedMissionIds,
  missionBestScores,
  onCompleteMission,
  onOpenIsland,
}) => {
  const [selectedMissionId, setSelectedMissionId] = useState<string>(() => {
    if (initialMissionId && PRO_MISSIONS.some((m) => m.id === initialMissionId)) {
      return initialMissionId;
    }
    return PRO_MISSIONS[0].id;
  });
  const [activeTab, setActiveTab] = useState<MissionTab>('briefing');
  const [domainFilter, setDomainFilter] = useState<string>('Tous');
  const [timerPaused, setTimerPaused] = useState<boolean>(false);
  const [cliInput, setCliInput] = useState<string>('');
  const [sessions, setSessions] = useState<Record<string, MissionSessionState>>(() => {
    const initial: Record<string, MissionSessionState> = {};
    PRO_MISSIONS.forEach((m) => {
      initial[m.id] = createInitialSession(m);
    });
    return initial;
  });

  // SIEM filter states
  const [logSearch, setLogSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('Toutes');
  const [severityFilter, setSeverityFilter] = useState<'TOUS' | LogSeverity>('TOUS');
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    if (initialMissionId && PRO_MISSIONS.some((m) => m.id === initialMissionId)) {
      setSelectedMissionId(initialMissionId);
      setActiveTab('briefing');
    }
  }, [initialMissionId]);

  const activeMission =
    PRO_MISSIONS.find((m) => m.id === selectedMissionId) ?? PRO_MISSIONS[0];

  const operationalPack = MISSION_OPERATIONAL_PACKS[activeMission.id];
  const session = sessions[activeMission.id] ?? createInitialSession(activeMission);

  // Operational SLA elapsed timer (1s tick while mission is active & unpaused)
  useEffect(() => {
    if (timerPaused || session.submitted) return;
    const id = window.setInterval(() => {
      setSessions((prev) => {
        const current = prev[selectedMissionId];
        if (!current || current.submitted) return prev;
        return {
          ...prev,
          [selectedMissionId]: { ...current, elapsedSec: current.elapsedSec + 1 },
        };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [selectedMissionId, timerPaused, session.submitted]);

  const domains = useMemo(
    () => ['Tous', ...Array.from(new Set(PRO_MISSIONS.map((m) => m.domain)))],
    []
  );

  const visibleMissions = useMemo(() => {
    if (domainFilter === 'Tous') return PRO_MISSIONS;
    return PRO_MISSIONS.filter((m) => m.domain === domainFilter);
  }, [domainFilter]);

  const updateSession = (updater: (prev: MissionSessionState) => MissionSessionState) => {
    setSessions((prev) => ({
      ...prev,
      [activeMission.id]: updater(prev[activeMission.id] ?? createInitialSession(activeMission)),
    }));
  };

  const handleSelectMission = (mission: ProMission) => {
    playClick();
    setSelectedMissionId(mission.id);
    setActiveTab('briefing');
    setLogSearch('');
    setSourceFilter('Toutes');
    setSeverityFilter('TOUS');
    setOnlyPinned(false);
    setCopiedReport(false);
    setCliInput('');
  };

  const logSources = useMemo(
    () => ['Toutes', ...Array.from(new Set(activeMission.logs.map((l) => l.source)))],
    [activeMission]
  );

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    return activeMission.logs.filter((log) => {
      if (sourceFilter !== 'Toutes' && log.source !== sourceFilter) return false;
      if (severityFilter !== 'TOUS' && log.severity !== severityFilter) return false;
      if (onlyPinned && !session.pinnedLogIds.includes(log.id)) return false;
      if (!q) return true;
      return (
        log.summary.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.srcIp.toLowerCase().includes(q) ||
        log.dstIp.toLowerCase().includes(q) ||
        log.eventCode.toLowerCase().includes(q) ||
        log.host.toLowerCase().includes(q) ||
        log.rawPayload.toLowerCase().includes(q)
      );
    });
  }, [activeMission.logs, logSearch, sourceFilter, severityFilter, onlyPinned, session.pinnedLogIds]);

  const selectedLog: MissionLogEntry | null =
    activeMission.logs.find((l) => l.id === session.selectedLogId) ??
    filteredLogs[0] ??
    activeMission.logs[0] ??
    null;

  // Live operational metrics
  const totalTrueEvidence = activeMission.logs.filter((l) => l.isEvidence).length;
  const pinnedLogs = activeMission.logs.filter((l) => session.pinnedLogIds.includes(l.id));
  const truePositivesCount = pinnedLogs.filter((l) => l.isEvidence).length;
  const falsePositivesCount = pinnedLogs.filter((l) => !l.isEvidence).length;

  const pinnedTimeline = useMemo(
    () => [...pinnedLogs].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [pinnedLogs]
  );

  const iocChallenges = operationalPack?.iocChallenges ?? [];
  const verifiedIocsCount = iocChallenges.filter((c) => session.iocVerified[c.id]).length;

  const correctQuestionsCount = activeMission.questions.filter(
    (q) => session.checkedQuestions[q.id] && session.selectedAnswers[q.id] === q.correctIndex
  ).length;

  const totalRecommendedActions = activeMission.remediationActions.filter(
    (a) => a.isRecommended
  ).length;

  const togglePinLog = (log: MissionLogEntry) => {
    const alreadyPinned = session.pinnedLogIds.includes(log.id);
    if (alreadyPinned) {
      playClick();
      updateSession((prev) => ({
        ...prev,
        pinnedLogIds: prev.pinnedLogIds.filter((id) => id !== log.id),
      }));
      return;
    }

    if (log.isEvidence) {
      playSuccess();
    } else {
      playPacket();
    }
    updateSession((prev) => ({
      ...prev,
      selectedLogId: log.id,
      pinnedLogIds: [...prev.pinnedLogIds, log.id],
    }));
  };

  const handleRunPresetCommand = (cmdId: string) => {
    const found = activeMission.forensicCommands.find((c) => c.id === cmdId);
    if (!found) return;
    playPacket();
    updateSession((prev) => ({
      ...prev,
      executedCommandIds: prev.executedCommandIds.includes(cmdId)
        ? prev.executedCommandIds
        : [...prev.executedCommandIds, cmdId],
      cliHistory: [
        ...prev.cliHistory,
        {
          id: `${cmdId}-${Date.now()}`,
          command: found.command,
          output: found.output,
        },
      ],
    }));
  };

  const executeLiveCliQuery = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();

    if (lower === 'clear') {
      playClick();
      updateSession((prev) => ({ ...prev, cliHistory: [] }));
      return;
    }

    let output = '';

    // Check if matches one of the mission's forensic commands
    const matchedPreset = activeMission.forensicCommands.find(
      (c) =>
        c.command.toLowerCase() === lower ||
        lower.startsWith(c.command.split(' ')[0].toLowerCase()) &&
          c.command.toLowerCase().includes(lower.split(' ')[1] ?? '')
    );

    if (matchedPreset) {
      playPacket();
      output = matchedPreset.output;
      updateSession((prev) => ({
        ...prev,
        executedCommandIds: prev.executedCommandIds.includes(matchedPreset.id)
          ? prev.executedCommandIds
          : [...prev.executedCommandIds, matchedPreset.id],
        cliHistory: [
          ...prev.cliHistory,
          { id: `cli-${Date.now()}`, command: trimmed, output },
        ],
      }));
      return;
    }

    if (lower === 'help' || lower === '?') {
      output = [
        'Commandes SIEM & Forensiques disponibles :',
        '  grep <mot>       Rechercher dans tous les journaux bruts (ex. grep 4769, grep root, grep POST)',
        '  ip <adresse>     Corréler tous les événements liés à une IP source ou destination',
        '  source <nom>     Lister les journaux d’une source précise (ex. source Sysmon)',
        '  assets           Afficher l’inventaire des hôtes et leurs statuts',
        '  timeline         Afficher la chronologie de vos preuves IOC épinglées',
        '  clear            Nettoyer la console',
        'Ou cliquez directement sur un outil forensique ci-dessus (Get-ADUser, systemctl, whois, aws...).',
      ].join('\n');
    } else if (lower === 'assets') {
      output = activeMission.assets
        .map((a) => `${a.name.padEnd(22)} | ${a.ip.padEnd(15)} | ${a.status.padEnd(10)} | ${a.role}`)
        .join('\n');
    } else if (lower === 'timeline') {
      output =
        pinnedTimeline.length === 0
          ? 'Aucune preuve épinglée. Épinglez les journaux suspects dans l’onglet Journaux SIEM.'
          : pinnedTimeline
              .map(
                (l) =>
                  `[${l.timestamp}] (${l.source} ${l.eventCode}) ${l.killChainPhase ?? 'Bruit'} -> ${l.summary}`
              )
              .join('\n');
    } else if (lower.startsWith('grep ') || lower.startsWith('search ')) {
      const term = trimmed.replace(/^(grep|search)\s+/i, '').trim().toLowerCase();
      const matches = activeMission.logs.filter(
        (l) =>
          l.summary.toLowerCase().includes(term) ||
          l.rawPayload.toLowerCase().includes(term) ||
          l.eventCode.toLowerCase().includes(term) ||
          l.actor.toLowerCase().includes(term)
      );
      output =
        matches.length === 0
          ? `0 événement trouvé pour "${term}".`
          : `${matches.length} événement(s) trouvé(s) pour "${term}" :\n` +
            matches
              .map(
                (l) =>
                  `[${l.timestamp.split(' ')[1]}] ${l.severity.padEnd(8)} ${l.source} (${l.eventCode}) ${l.srcIp} -> ${l.dstIp} | ${l.summary}`
              )
              .join('\n');
    } else if (lower.startsWith('ip ')) {
      const ipQuery = trimmed.slice(3).trim();
      const matches = activeMission.logs.filter(
        (l) => l.srcIp.includes(ipQuery) || l.dstIp.includes(ipQuery) || l.rawPayload.includes(ipQuery)
      );
      output =
        matches.length === 0
          ? `Aucun flux réseau ou journal corrélé avec "${ipQuery}".`
          : `Corrélation IP "${ipQuery}" (${matches.length} hits) :\n` +
            matches
              .map(
                (l) =>
                  `[${l.timestamp}] ${l.host} · ${l.source} (${l.eventCode}) ${l.srcIp} -> ${l.dstIp} | ${l.summary}`
              )
              .join('\n');
    } else if (lower.startsWith('source ')) {
      const src = trimmed.slice(7).trim().toLowerCase();
      const matches = activeMission.logs.filter((l) => l.source.toLowerCase().includes(src));
      output =
        matches.length === 0
          ? `Aucune source trouvée pour "${src}". Sources disponibles : ${logSources.filter((s) => s !== 'Toutes').join(', ')}`
          : matches
              .map((l) => `[${l.timestamp.split(' ')[1]}] ${l.eventCode} · ${l.actor} | ${l.summary}`)
              .join('\n');
    } else {
      // Fallback: auto-search logs with the entered term for seamless UX
      const matches = activeMission.logs.filter(
        (l) =>
          l.summary.toLowerCase().includes(lower) ||
          l.rawPayload.toLowerCase().includes(lower) ||
          l.srcIp.includes(trimmed) ||
          l.dstIp.includes(trimmed)
      );
      output =
        matches.length > 0
          ? `Recherche SIEM automatique pour "${trimmed}" (${matches.length} résultat(s)) :\n` +
            matches
              .map((l) => `[${l.timestamp.split(' ')[1]}] ${l.source} (${l.eventCode}) | ${l.summary}`)
              .join('\n')
          : `Commande non reconnue : "${trimmed}". Tapez "help" ou "grep <terme>" pour interroger les journaux.`;
    }

    playPacket();
    updateSession((prev) => ({
      ...prev,
      cliHistory: [...prev.cliHistory, { id: `cli-${Date.now()}`, command: trimmed, output }],
    }));
  };

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLiveCliQuery(cliInput);
    setCliInput('');
  };

  const handleVerifyIoc = (challenge: IocExtractionChallenge) => {
    const val = session.iocInputs[challenge.id] ?? '';
    const ok = isIocMatch(challenge, val);
    if (ok) {
      playSuccess();
    } else {
      playError();
    }
    updateSession((prev) => ({
      ...prev,
      iocVerified: { ...prev.iocVerified, [challenge.id]: ok },
    }));
  };

  const handleCheckQuestion = (questionId: string, correctIndex: number) => {
    const chosen = session.selectedAnswers[questionId];
    if (chosen === undefined) return;
    if (chosen === correctIndex) {
      playSuccess();
    } else {
      playError();
    }
    updateSession((prev) => ({
      ...prev,
      checkedQuestions: { ...prev.checkedQuestions, [questionId]: true },
    }));
  };

  const toggleRemediationAction = (actionId: string) => {
    playClick();
    updateSession((prev) => {
      const exists = prev.selectedActionIds.includes(actionId);
      return {
        ...prev,
        selectedActionIds: exists
          ? prev.selectedActionIds.filter((id) => id !== actionId)
          : [...prev.selectedActionIds, actionId],
      };
    });
  };

  const handleDeploySigma = () => {
    if (!operationalPack || session.sigmaAnswer === null) return;
    const isRight = session.sigmaAnswer === operationalPack.sigmaRule.correctIndex;
    if (isRight) {
      playSuccess();
      updateSession((prev) => ({ ...prev, sigmaDeployed: true }));
    } else {
      playError();
    }
  };

  const handleSubmitIncidentReport = () => {
    // 4-pillar operational scoring (100 points total):
    // 1. SIEM Evidence pinned: 25 pts (-4 per false positive)
    const evidenceRatio = totalTrueEvidence > 0 ? truePositivesCount / totalTrueEvidence : 1;
    const evidenceScore = Math.max(0, Math.round(evidenceRatio * 25) - falsePositivesCount * 4);

    // 2. Free-text IOC extraction (Zero-QCM): 25 pts
    const iocMatchedCount = iocChallenges.filter((c) =>
      isIocMatch(c, session.iocInputs[c.id] ?? '')
    ).length;
    const iocScore =
      iocChallenges.length > 0 ? Math.round((iocMatchedCount / iocChallenges.length) * 25) : 25;

    // 3. Investigation qualification: 25 pts
    const qaCorrect = activeMission.questions.filter(
      (q) => session.selectedAnswers[q.id] === q.correctIndex
    ).length;
    const qaScore = Math.round((qaCorrect / activeMission.questions.length) * 25);

    // 4. Containment plan (20 pts) + Sigma rule deployed (5 pts)
    const selectedGood = activeMission.remediationActions.filter(
      (a) => a.isRecommended && session.selectedActionIds.includes(a.id)
    ).length;
    const selectedTraps = activeMission.remediationActions.filter(
      (a) => !a.isRecommended && session.selectedActionIds.includes(a.id)
    ).length;
    const containmentScore = Math.max(
      0,
      Math.round((selectedGood / totalRecommendedActions) * 20) - selectedTraps * 6
    );
    const sigmaBonus =
      session.sigmaDeployed ||
      (operationalPack && session.sigmaAnswer === operationalPack.sigmaRule.correctIndex)
        ? 5
        : 0;

    const finalScore = Math.max(
      0,
      Math.min(100, evidenceScore + iocScore + qaScore + containmentScore + sigmaBonus)
    );

    const allChecked: Record<string, boolean> = { ...session.checkedQuestions };
    activeMission.questions.forEach((q) => {
      if (session.selectedAnswers[q.id] !== undefined) {
        allChecked[q.id] = true;
      }
    });

    const nextIocVerified: Record<string, boolean> = { ...session.iocVerified };
    iocChallenges.forEach((c) => {
      nextIocVerified[c.id] = isIocMatch(c, session.iocInputs[c.id] ?? '');
    });

    updateSession((prev) => ({
      ...prev,
      iocVerified: nextIocVerified,
      checkedQuestions: allChecked,
      sigmaDeployed: prev.sigmaDeployed || sigmaBonus === 5,
      submitted: true,
      lastScore: finalScore,
    }));

    if (finalScore >= 70) {
      playVictory();
      onCompleteMission(activeMission.id, finalScore, activeMission.xpReward);
    } else {
      playError();
    }
  };

  const handleResetMission = () => {
    playClick();
    setSessions((prev) => ({
      ...prev,
      [activeMission.id]: createInitialSession(activeMission),
    }));
    setCopiedReport(false);
    setCliInput('');
  };

  const handleCopyMarkdownReport = () => {
    const score = session.lastScore ?? missionBestScores[activeMission.id] ?? 0;
    const lines = [
      `# Rapport Post-Mortem — ${activeMission.ticketId}`,
      `**Incident** : ${activeMission.title}`,
      `**Organisation** : ${activeMission.organization} (${activeMission.environment})`,
      `**Sévérité** : ${activeMission.severity} | **Temps d'enquête** : ${formatDuration(session.elapsedSec)} | **Score Analyste** : ${score}%`,
      '',
      '## Cause racine',
      activeMission.postMortem.rootCause,
      '',
      `## Temps de résidence (Dwell Time)`,
      activeMission.postMortem.dwellTime,
      '',
      '## Indicateurs de compromission (IOC)',
      ...activeMission.postMortem.keyIocs.map((ioc) => `- ${ioc}`),
      '',
      '## Techniques MITRE ATT&CK',
      ...activeMission.mitreTechniques.map((t) => `- ${t.id} — ${t.name}`),
      '',
      '## Règle de détection SIEM (Sigma)',
      '```yaml',
      operationalPack?.sigmaRule.yaml ?? '',
      '```',
      '',
      '## Mesures de durcissement recommandées',
      ...activeMission.postMortem.hardeningLessons.map((lesson) => `- ${lesson}`),
    ];

    try {
      void navigator.clipboard.writeText(lines.join('\n'));
      setCopiedReport(true);
      playSuccess();
      window.setTimeout(() => setCopiedReport(false), 2500);
    } catch {
      // Clipboard API unavailable
    }
  };

  const handleCopyPayload = (text: string) => {
    try {
      void navigator.clipboard.writeText(text);
      setCopiedPayload(true);
      playClick();
      window.setTimeout(() => setCopiedPayload(false), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  const averageScore = useMemo(() => {
    const scores = Object.values(missionBestScores).filter((s) => typeof s === 'number');
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((acc, s) => acc + s, 0) / scores.length);
  }, [missionBestScores]);

  const isMissionCompleted = completedMissionIds.includes(activeMission.id);
  const activeBestScore = missionBestScores[activeMission.id];
  const slaExceeded = session.elapsedSec > activeMission.slaMinutes * 60;

  const tabs: { id: MissionTab; label: string; meta: string; icon: React.ReactNode }[] = [
    {
      id: 'briefing',
      label: 'Briefing & Actifs',
      meta: `${activeMission.assets.length} hôtes`,
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'siem',
      label: 'Journaux SIEM',
      meta: `${truePositivesCount}/${totalTrueEvidence} IOC`,
      icon: <FileSearch className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'investigation',
      label: 'Investigation & CLI',
      meta: `${verifiedIocsCount}/${iocChallenges.length} extraits`,
      icon: <Terminal className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'remediation',
      label: 'Confinement & Sigma',
      meta:
        session.submitted && session.lastScore !== null
          ? `${session.lastScore}%`
          : `${session.selectedActionIds.length} actions`,
      icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header & Aggregate KPI Strip */}
      <header className="space-y-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <p className="text-xs font-medium text-sky-700 dark:text-cyan-400">
              Pratique opérationnelle SOC · Zéro théorie passive : journaux réels, CLI forensique &amp; détection Sigma
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Missions Professionnelles &amp; Investigations SOC
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Devenez opérationnel en résolvant de vrais incidents d&apos;entreprise : filtrez les
              journaux SIEM, extrayez manuellement les IOC depuis les payloads bruts, interrogez la
              console forensique, déployez la règle Sigma et confinez l&apos;attaque sous SLA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm tabular-nums shrink-0">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Missions clôturées</div>
              <div className="font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                {completedMissionIds.length} / {PRO_MISSIONS.length}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Score moyen</div>
              <div className="font-mono text-xl font-bold text-sky-700 dark:text-cyan-400">
                {averageScore !== null ? `${averageScore}%` : '—'}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Récompense</div>
              <div className="font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400">
                +{activeMission.xpReward} XP
              </div>
            </div>
          </div>
        </div>

        {/* Domain Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Domaine :
          </span>
          {domains.map((domain) => {
            const active = domainFilter === domain;
            return (
              <button
                key={domain}
                type="button"
                onClick={() => {
                  playClick();
                  setDomainFilter(domain);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-sky-700 dark:bg-cyan-400 text-white dark:text-slate-950 border-sky-700 dark:border-cyan-400 font-semibold'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {domain}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Split Workspace: Left Incident Queue + Right Active Investigation Desk */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Queue */}
        <aside className="xl:col-span-4 space-y-3" aria-label="File des incidents SOC">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              File d&apos;incidents ({visibleMissions.length})
            </span>
            <span className="font-mono tabular-nums">Triage temps réel</span>
          </div>

          <div className="space-y-2.5">
            {visibleMissions.map((mission) => {
              const isSelected = mission.id === activeMission.id;
              const isDone = completedMissionIds.includes(mission.id);
              const best = missionBestScores[mission.id];
              const mSession = sessions[mission.id];
              const mPinnedTrue = mSession
                ? mission.logs.filter((l) => l.isEvidence && mSession.pinnedLogIds.includes(l.id))
                    .length
                : 0;
              const mTotalTrue = mission.logs.filter((l) => l.isEvidence).length;

              return (
                <button
                  key={mission.id}
                  type="button"
                  onClick={() => handleSelectMission(mission)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-sky-600 dark:border-cyan-400 shadow-sm'
                      : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {mission.ticketId}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span
                        className={
                          mission.severity.startsWith('P1')
                            ? 'text-rose-700 dark:text-rose-400 font-semibold'
                            : 'text-amber-700 dark:text-amber-400 font-semibold'
                        }
                      >
                        {mission.severity}
                      </span>
                    </div>
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold font-mono tabular-nums">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        {best !== undefined ? `${best}%` : 'Clôturé'}
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        +{mission.xpReward} XP
                      </span>
                    )}
                  </div>

                  <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug mb-1.5">
                    {mission.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>{mission.organization}</span>
                    <span aria-hidden="true">·</span>
                    <span>{mission.domain}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      IOC {mPinnedTrue}/{mTotalTrue}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Workstation */}
        <section className="xl:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {/* Active Incident Banner + Live SLA Chrono */}
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {activeMission.ticketId}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      activeMission.severity.startsWith('P1')
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    {activeMission.severity}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeMission.organization}</span>
                </div>

                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {activeMission.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {activeMission.environment} · Secteur : {activeMission.sector}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Live SLA Elapsed Timer */}
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setTimerPaused((p) => !p);
                  }}
                  title={timerPaused ? 'Reprendre le chronomètre SLA' : 'Mettre le chronomètre en pause'}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono tabular-nums transition-colors whitespace-nowrap ${
                    slaExceeded
                      ? 'border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/60'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {formatDuration(session.elapsedSec)} / {activeMission.slaMinutes}:00
                  </span>
                  {timerPaused ? (
                    <Play className="w-3 h-3 shrink-0" />
                  ) : (
                    <Pause className="w-3 h-3 shrink-0" />
                  )}
                </button>

                {isMissionCompleted && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {activeBestScore ?? session.lastScore ?? 100}%
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleResetMission}
                  title="Réinitialiser cette investigation"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Réinitialiser
                </button>
              </div>
            </div>

            {/* 4-Tab Investigation Workflow Bar */}
            <div
              role="tablist"
              aria-label="Étapes de l'investigation"
              className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/70 rounded-xl border border-slate-200/70 dark:border-slate-800"
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      playClick();
                      setActiveTab(tab.id);
                    }}
                    className={`relative flex flex-col items-start px-3 py-2 rounded-lg text-left transition-colors ${
                      active
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="pro-mission-active-tab"
                        transition={SPRING_SNAPPY}
                        className="absolute inset-0 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700"
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
                      {tab.icon}
                      <span className="truncate">{tab.label}</span>
                    </span>
                    <span className="relative z-10 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                      {tab.meta}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="p-5 sm:p-6">
            <AnimatePresence mode="wait">
              {/* TAB 1: BRIEFING & ACTIFS */}
              {activeTab === 'briefing' && (
                <motion.div
                  key="briefing"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: EASE_SWISS }}
                  className="space-y-6"
                >
                  <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/60 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 dark:text-rose-300">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Alerte déclencheuse SOC / EDR
                    </div>
                    <p className="font-mono text-xs sm:text-sm text-rose-950 dark:text-rose-200 leading-relaxed">
                      {activeMission.initialAlert}
                    </p>
                  </div>

                  {/* Operational Mission Objectives Checklist */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-1">
                      <div className="text-slate-500 dark:text-slate-400">1. Triage SIEM</div>
                      <div className="font-mono font-bold text-sm tabular-nums text-slate-900 dark:text-slate-100">
                        {truePositivesCount}/{totalTrueEvidence} IOC épinglés
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-1">
                      <div className="text-slate-500 dark:text-slate-400">2. Extraction libre</div>
                      <div className="font-mono font-bold text-sm tabular-nums text-slate-900 dark:text-slate-100">
                        {verifiedIocsCount}/{iocChallenges.length} artefacts
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-1">
                      <div className="text-slate-500 dark:text-slate-400">3. Qualification</div>
                      <div className="font-mono font-bold text-sm tabular-nums text-slate-900 dark:text-slate-100">
                        {correctQuestionsCount}/{activeMission.questions.length} vérifiées
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-1">
                      <div className="text-slate-500 dark:text-slate-400">4. Règle Sigma</div>
                      <div className="font-mono font-bold text-sm tabular-nums text-slate-900 dark:text-slate-100">
                        {session.sigmaDeployed ? 'Déployée' : 'À déployer'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Contexte opérationnel
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {activeMission.summary}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Impact métier &amp; Risque
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {activeMission.businessImpact}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Techniques MITRE ATT&amp;CK suspectées
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                      {activeMission.mitreTechniques.map((tech) => (
                        <div key={tech.id} className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-sky-700 dark:text-cyan-400">
                            {tech.id}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">{tech.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
                        <Server className="w-4 h-4 text-sky-700 dark:text-cyan-400" />
                        Inventaire des actifs du périmètre
                      </h3>
                      <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {activeMission.assets.length} actifs surveillés
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold">Hôte / Actif</th>
                            <th className="py-2.5 px-3 font-semibold">Rôle</th>
                            <th className="py-2.5 px-3 font-semibold">IP / Zone</th>
                            <th className="py-2.5 px-3 font-semibold">Système</th>
                            <th className="py-2.5 px-3 font-semibold text-right">État</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {activeMission.assets.map((asset) => (
                            <tr
                              key={asset.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                {asset.name}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                                {asset.role}
                              </td>
                              <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {asset.ip}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {asset.os}
                              </td>
                              <td
                                className={`py-2.5 px-3 text-right whitespace-nowrap ${getAssetStatusClass(
                                  asset.status
                                )}`}
                              >
                                {asset.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        Cours de référence associés :
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {activeMission.relatedCourseIds.map((courseId) => (
                          <button
                            key={courseId}
                            type="button"
                            onClick={() => {
                              playClick();
                              onOpenIsland(courseId);
                            }}
                            className="text-xs font-semibold text-sky-700 dark:text-cyan-400 hover:underline whitespace-nowrap"
                          >
                            {getShortNumberedCourseName(courseId)} →
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setActiveTab('siem');
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 transition-colors whitespace-nowrap shrink-0"
                    >
                      Ouvrir les journaux SIEM ({activeMission.logs.length})
                    </button>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: EXPLORATEUR DE JOURNAUX SIEM */}
              {activeTab === 'siem' && (
                <motion.div
                  key="siem"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: EASE_SWISS }}
                  className="space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      Triez le bruit de fond et épinglez les{' '}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {totalTrueEvidence} journaux malveillants (IOC)
                      </strong>
                      . Notez les IP, comptes et artefacts bruts pour l&apos;extraction forensique.
                    </p>
                    <div className="flex items-center gap-3 text-xs font-mono tabular-nums shrink-0">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        IOC : {truePositivesCount}/{totalTrueEvidence}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span
                        className={
                          falsePositivesCount > 0
                            ? 'text-amber-700 dark:text-amber-400 font-semibold'
                            : 'text-slate-500 dark:text-slate-400'
                        }
                      >
                        Faux positifs : {falsePositivesCount}
                      </span>
                    </div>
                  </div>

                  {/* Filter Controls */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={logSearch}
                          onChange={(e) => setLogSearch(e.target.value)}
                          placeholder="Filtrer par IP, Event ID, utilisateur, commande, JSON..."
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 dark:focus:border-cyan-400"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(['TOUS', 'CRITIQUE', 'ALERTE', 'INFO'] as const).map((sev) => (
                          <button
                            key={sev}
                            type="button"
                            onClick={() => {
                              playClick();
                              setSeverityFilter(sev);
                            }}
                            className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                              severityFilter === sev
                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border-slate-900 dark:border-slate-100'
                                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            {sev === 'TOUS' ? 'Toutes' : sev}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setOnlyPinned((v) => !v);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                            onlyPinned
                              ? 'bg-sky-700 dark:bg-cyan-400 text-white dark:text-slate-950 border-sky-700 dark:border-cyan-400'
                              : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                          Épinglés ({session.pinnedLogIds.length})
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {logSources.map((src) => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => {
                            playClick();
                            setSourceFilter(src);
                          }}
                          className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 ${
                            sourceFilter === src
                              ? 'bg-sky-100 dark:bg-cyan-950/70 text-sky-900 dark:text-cyan-300 font-semibold'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {src}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* High-Density SIEM Table */}
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    {filteredLogs.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Aucun journal ne correspond à ces filtres.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setLogSearch('');
                            setSourceFilter('Toutes');
                            setSeverityFilter('TOUS');
                            setOnlyPinned(false);
                          }}
                          className="text-xs font-semibold text-sky-700 dark:text-cyan-400 hover:underline"
                        >
                          Réinitialiser les filtres SIEM
                        </button>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Horodatage</th>
                            <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Source / Code</th>
                            <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Acteur · IP</th>
                            <th className="py-2.5 px-3 font-semibold">Événement</th>
                            <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">Preuve</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {filteredLogs.map((log) => {
                            const isSelected = selectedLog?.id === log.id;
                            const isPinned = session.pinnedLogIds.includes(log.id);
                            return (
                              <tr
                                key={log.id}
                                onClick={() => {
                                  playClick();
                                  updateSession((prev) => ({ ...prev, selectedLogId: log.id }));
                                }}
                                className={`cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-sky-50/80 dark:bg-cyan-950/35'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                  <div>{log.timestamp.split(' ')[1]}</div>
                                  <div className={getLogSeverityClass(log.severity)}>
                                    {log.severity}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                                    {log.source}
                                  </div>
                                  <div className="font-mono text-slate-500 dark:text-slate-400">
                                    {log.eventCode} · {log.host}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-mono tabular-nums whitespace-nowrap">
                                  <div className="text-slate-800 dark:text-slate-200 max-w-[155px] truncate">
                                    {log.actor}
                                  </div>
                                  <div className="text-slate-500 dark:text-slate-400">
                                    {log.srcIp}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200 min-w-[220px]">
                                  {log.summary}
                                </td>
                                <td
                                  className="py-2.5 px-3 text-right whitespace-nowrap"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => togglePinLog(log)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                      isPinned
                                        ? log.isEvidence
                                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                                          : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500'
                                    }`}
                                  >
                                    {isPinned ? (
                                      <>
                                        <PinOff className="w-3 h-3" />
                                        Retirer
                                      </>
                                    ) : (
                                      <>
                                        <Pin className="w-3 h-3" />
                                        Épingler
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Raw Payload Inspector */}
                  {selectedLog && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            Payload brut
                          </span>{' '}
                          · {selectedLog.timestamp} · {selectedLog.source} ({selectedLog.eventCode}) ·{' '}
                          {selectedLog.srcIp} → {selectedLog.dstIp}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyPayload(selectedLog.rawPayload)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                          >
                            <ClipboardCopy className="w-3.5 h-3.5" />
                            {copiedPayload ? 'Copié' : 'Copier JSON'}
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePinLog(selectedLog)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 transition-colors whitespace-nowrap"
                          >
                            {session.pinnedLogIds.includes(selectedLog.id) ? (
                              <>
                                <PinOff className="w-3.5 h-3.5" />
                                Retirer des preuves
                              </>
                            ) : (
                              <>
                                <Pin className="w-3.5 h-3.5" />
                                Épingler comme preuve (IOC)
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <pre className="p-3 rounded-lg bg-slate-900 text-cyan-200 font-mono text-xs overflow-x-auto leading-relaxed select-all">
                        {selectedLog.rawPayload}
                      </pre>

                      {session.pinnedLogIds.includes(selectedLog.id) && (
                        <div
                          className={`p-3 rounded-lg text-xs border ${
                            selectedLog.isEvidence
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                          }`}
                        >
                          <span className="font-bold">
                            {selectedLog.isEvidence
                              ? `Preuve confirmée (${selectedLog.killChainPhase ?? 'IOC'}) : `
                              : 'Attention — Trafic bénin (Faux positif) : '}
                          </span>
                          {selectedLog.analystNote}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setActiveTab('investigation');
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 transition-colors whitespace-nowrap"
                    >
                      Ouvrir la Console CLI &amp; Extraction d&apos;IOC →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: INVESTIGATION CLI, EXTRACTION LIBRE D'IOC & CHRONOLOGIE */}
              {activeTab === 'investigation' && (
                <motion.div
                  key="investigation"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: EASE_SWISS }}
                  className="space-y-8"
                >
                  {/* 1. Interactive Live Forensic & SIEM CLI Terminal */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-sky-700 dark:text-cyan-400" />
                        1. Terminal d&apos;investigation SIEM &amp; Forensique (interactif)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Tapez directement vos commandes (<code className="font-mono">grep</code>,{' '}
                        <code className="font-mono">ip</code>,{' '}
                        <code className="font-mono">source</code>,{' '}
                        <code className="font-mono">assets</code>,{' '}
                        <code className="font-mono">timeline</code>) ou exécutez les outils
                        d&apos;enrichissement ci-dessous.
                      </p>
                    </div>

                    {/* Quick Forensic Command Launchers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeMission.forensicCommands.map((cmd) => {
                        const executed = session.executedCommandIds.includes(cmd.id);
                        return (
                          <button
                            key={cmd.id}
                            type="button"
                            onClick={() => handleRunPresetCommand(cmd.id)}
                            className={`text-left p-3 rounded-xl border transition-colors ${
                              executed
                                ? 'bg-slate-900 text-slate-100 border-cyan-500/50'
                                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-cyan-400'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
                              <span className="font-mono text-sky-700 dark:text-cyan-400 font-semibold">
                                {cmd.tool}
                              </span>
                              <span
                                className={
                                  executed
                                    ? 'text-emerald-400 font-semibold'
                                    : 'text-slate-500 dark:text-slate-400'
                                }
                              >
                                {executed ? 'Exécutée' : 'Exécuter'}
                              </span>
                            </div>
                            <div
                              className={`font-mono text-xs break-all ${
                                executed ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {cmd.command}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Live Terminal Output + Command Input */}
                    <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                      <div className="max-h-72 overflow-y-auto p-4 space-y-3 font-mono text-xs text-slate-200">
                        {session.cliHistory.map((entry) => (
                          <div
                            key={entry.id}
                            className="space-y-1 border-b border-slate-800/80 last:border-b-0 pb-2.5 last:pb-0"
                          >
                            <div className="text-cyan-400 font-semibold">
                              analyst@cyberland-soc:~$ {entry.command}
                            </div>
                            <pre className="whitespace-pre-wrap text-slate-200 leading-relaxed">
                              {entry.output}
                            </pre>
                          </div>
                        ))}
                      </div>

                      <form
                        onSubmit={handleCliSubmit}
                        className="flex items-center gap-2 px-3 py-2.5 bg-slate-900 border-t border-slate-800"
                      >
                        <span className="font-mono text-xs text-cyan-400 shrink-0">
                          soc:~$
                        </span>
                        <input
                          type="text"
                          value={cliInput}
                          onChange={(e) => setCliInput(e.target.value)}
                          placeholder='Ex: grep 4769 · ip 10.20.4.44 · assets · timeline · help'
                          className="flex-1 min-w-0 bg-transparent text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                        >
                          <Send className="w-3 h-3" />
                          Exécuter
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* 2. Free-Text Operational IOC Extraction (Zero-QCM) */}
                  {iocChallenges.length > 0 && (
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
                            <Crosshair className="w-4 h-4 text-sky-700 dark:text-cyan-400" />
                            2. Extraction d&apos;IOC depuis les journaux bruts (saisie libre — zéro QCM)
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Relevez et saisissez les indicateurs exacts découverts dans les logs SIEM
                            ou la console ci-dessus.
                          </p>
                        </div>
                        <span className="text-xs font-mono tabular-nums font-semibold text-sky-700 dark:text-cyan-400">
                          {verifiedIocsCount}/{iocChallenges.length} validés
                        </span>
                      </div>

                      <div className="space-y-3">
                        {iocChallenges.map((challenge) => {
                          const currentVal = session.iocInputs[challenge.id] ?? '';
                          const checkedState = session.iocVerified[challenge.id];
                          const isVerified = checkedState === true;
                          const isWrong = checkedState === false;

                          return (
                            <div
                              key={challenge.id}
                              className={`p-4 rounded-xl border space-y-2 ${
                                isVerified
                                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/25'
                                  : isWrong
                                  ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <label
                                  htmlFor={challenge.id}
                                  className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100"
                                >
                                  {challenge.label}
                                </label>
                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                  {challenge.sourceRef}
                                </span>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  id={challenge.id}
                                  type="text"
                                  value={currentVal}
                                  onChange={(e) => {
                                    const nextVal = e.target.value;
                                    updateSession((prev) => ({
                                      ...prev,
                                      iocInputs: { ...prev.iocInputs, [challenge.id]: nextVal },
                                      iocVerified: {
                                        ...prev.iocVerified,
                                        [challenge.id]: isIocMatch(challenge, nextVal)
                                          ? true
                                          : prev.iocVerified[challenge.id],
                                      },
                                    }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleVerifyIoc(challenge);
                                    }
                                  }}
                                  placeholder={challenge.placeholder}
                                  className="flex-1 min-w-0 px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-600 dark:focus:border-cyan-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleVerifyIoc(challenge)}
                                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                                >
                                  Vérifier IOC
                                </button>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="text-slate-500 dark:text-slate-400">
                                  Indice : {challenge.hint}
                                </span>
                                {isVerified && (
                                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    IOC validé ({challenge.displayAnswer})
                                  </span>
                                )}
                                {isWrong && (
                                  <span className="inline-flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Non concordant — vérifiez le payload brut SIEM
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Reconstructed Attack Timeline */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        3. Chronologie d&apos;attaque reconstituée (vos journaux épinglés)
                      </h3>
                      <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {truePositivesCount}/{totalTrueEvidence} IOC confirmés
                      </span>
                    </div>

                    {pinnedTimeline.length === 0 ? (
                      <div className="p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          Aucune preuve épinglée pour le moment. Épinglez les événements malveillants
                          dans l&apos;onglet Journaux SIEM pour bâtir la Kill Chain.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('siem')}
                          className="text-xs font-semibold text-sky-700 dark:text-cyan-400 hover:underline"
                        >
                          Ouvrir les journaux SIEM →
                        </button>
                      </div>
                    ) : (
                      <ol className="space-y-2.5">
                        {pinnedTimeline.map((item) => (
                          <li
                            key={item.id}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 text-xs font-mono tabular-nums">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {item.timestamp}
                                </span>
                                <span aria-hidden="true" className="text-slate-400">
                                  ·
                                </span>
                                <span className="text-sky-700 dark:text-cyan-400 font-semibold">
                                  {item.killChainPhase ?? 'Événement non malveillant (bruit)'}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                                {item.summary}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => togglePinLog(item)}
                              className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 whitespace-nowrap self-start sm:self-center"
                            >
                              Retirer
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {/* 4. Qualification de l'incident */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      4. Qualification technique de l&apos;incident ({correctQuestionsCount}/
                      {activeMission.questions.length} validées)
                    </h3>

                    <div className="space-y-4">
                      {activeMission.questions.map((q, idx) => {
                        const selectedIdx = session.selectedAnswers[q.id];
                        const isChecked = Boolean(session.checkedQuestions[q.id]);
                        const isCorrect = isChecked && selectedIdx === q.correctIndex;

                        return (
                          <div
                            key={q.id}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                          >
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {idx + 1}. {q.prompt}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Indice : {q.hint}
                              </p>
                            </div>

                            <div className="space-y-2">
                              {q.options.map((opt, oIdx) => {
                                const chosen = selectedIdx === oIdx;
                                let optionStyle =
                                  'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700';

                                if (isChecked && oIdx === q.correctIndex) {
                                  optionStyle =
                                    'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-medium';
                                } else if (isChecked && chosen && oIdx !== q.correctIndex) {
                                  optionStyle =
                                    'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100';
                                } else if (chosen) {
                                  optionStyle =
                                    'border-sky-600 dark:border-cyan-400 bg-sky-50 dark:bg-cyan-950/40 text-slate-900 dark:text-white font-medium';
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => {
                                      playClick();
                                      updateSession((prev) => ({
                                        ...prev,
                                        selectedAnswers: { ...prev.selectedAnswers, [q.id]: oIdx },
                                        checkedQuestions: { ...prev.checkedQuestions, [q.id]: false },
                                      }));
                                    }}
                                    className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors ${optionStyle}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <button
                                type="button"
                                disabled={selectedIdx === undefined}
                                onClick={() => handleCheckQuestion(q.id, q.correctIndex)}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 disabled:opacity-40 transition-colors"
                              >
                                Vérifier le diagnostic
                              </button>

                              {isChecked && (
                                <span
                                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                    isCorrect
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-rose-700 dark:text-rose-400'
                                  }`}
                                >
                                  {isCorrect ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                                      Diagnostic exact
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-4 h-4 shrink-0" />
                                      À corriger — consultez la preuve
                                    </>
                                  )}
                                </span>
                              )}
                            </div>

                            {isChecked && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/70 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                {q.explanation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setActiveTab('remediation');
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 transition-colors whitespace-nowrap"
                    >
                      Passer au Confinement &amp; Règle Sigma →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: CONFINEMENT, RÈGLE SIGMA & RAPPORT POST-MORTEM */}
              {activeTab === 'remediation' && (
                <motion.div
                  key="remediation"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: EASE_SWISS }}
                  className="space-y-8"
                >
                  {/* 1. Containment & Remediation Actions */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        1. Plan de confinement &amp; remédiation ({totalRecommendedActions} actions
                        attendues, évitez les pièges)
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        Sélectionnez les mesures opérationnelles conformes aux bonnes pratiques
                        CSIRT / ANSSI.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {activeMission.remediationActions.map((action) => {
                        const selected = session.selectedActionIds.includes(action.id);
                        const showReview = session.submitted;

                        let boxStyle =
                          'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700';
                        if (showReview) {
                          if (action.isRecommended && selected) {
                            boxStyle =
                              'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/35';
                          } else if (!action.isRecommended && selected) {
                            boxStyle = 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/35';
                          } else if (action.isRecommended && !selected) {
                            boxStyle = 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/25';
                          }
                        } else if (selected) {
                          boxStyle =
                            'border-sky-600 dark:border-cyan-400 bg-sky-50/80 dark:bg-cyan-950/35';
                        }

                        return (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => toggleRemediationAction(action.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-colors ${boxStyle}`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                                  selected
                                    ? 'bg-sky-700 dark:bg-cyan-400 border-sky-700 dark:border-cyan-400 text-white dark:text-slate-950'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {selected && <Check className="w-3.5 h-3.5" />}
                              </span>
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400">
                                  <span className="font-semibold text-sky-700 dark:text-cyan-400">
                                    {action.category}
                                  </span>
                                  {showReview && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span
                                        className={
                                          action.isRecommended
                                            ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                                            : 'text-rose-700 dark:text-rose-400 font-semibold'
                                        }
                                      >
                                        {action.isRecommended
                                          ? 'Action recommandée'
                                          : 'Piège dangereux à éviter'}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {action.label}
                                </p>
                                {showReview && (
                                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                                    {action.rationale}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Detection Engineering: Sigma SIEM Rule Deployment */}
                  {operationalPack && (
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
                            <FileCode2 className="w-4 h-4 text-sky-700 dark:text-cyan-400" />
                            2. Ingénierie de détection : Déploiement règle SIEM (Sigma)
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {operationalPack.sigmaRule.title} · {operationalPack.sigmaRule.logsource}
                          </p>
                        </div>
                        {session.sigmaDeployed && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            Règle active en production
                          </span>
                        )}
                      </div>

                      <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-200 font-mono text-xs overflow-x-auto leading-relaxed">
                        {operationalPack.sigmaRule.yaml}
                      </pre>

                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Validation avant mise en production : {operationalPack.sigmaRule.validationPrompt}
                        </p>
                        <div className="space-y-2">
                          {operationalPack.sigmaRule.choices.map((choice, idx) => {
                            const chosen = session.sigmaAnswer === idx;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  playClick();
                                  updateSession((prev) => ({ ...prev, sigmaAnswer: idx }));
                                }}
                                className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors ${
                                  chosen
                                    ? 'border-sky-600 dark:border-cyan-400 bg-sky-50 dark:bg-cyan-950/40 text-slate-900 dark:text-white font-medium'
                                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {choice}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            disabled={session.sigmaAnswer === null}
                            onClick={handleDeploySigma}
                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 disabled:opacity-40 transition-colors"
                          >
                            Déployer la règle dans le SIEM
                          </button>
                          {session.sigmaDeployed && (
                            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                              {operationalPack.sigmaRule.explanation}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Evaluation CTA */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      Barème : 25 SIEM + 25 IOC libres + 25 Enquête + 25 Confinement/Sigma (≥ 70%)
                    </div>
                    <button
                      type="button"
                      onClick={handleSubmitIncidentReport}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 transition-colors whitespace-nowrap"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Valider &amp; Clôturer l&apos;incident
                    </button>
                  </div>

                  {/* Evaluation Result & Post-Mortem Report */}
                  {session.submitted && session.lastScore !== null && (
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-5">
                      {(() => {
                        const grade = getGradeFromScore(session.lastScore);
                        const passed = session.lastScore >= 70;
                        return (
                          <div
                            className={`p-5 rounded-xl border ${
                              passed
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                  {passed
                                    ? `Mission clôturée en ${formatDuration(session.elapsedSec)} · +${activeMission.xpReward} XP`
                                    : 'Score insuffisant (< 70%) — Complétez vos IOC libres ou le confinement'}
                                </div>
                                <div className="font-display text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                                  Note {grade.letter} · {session.lastScore}% — {grade.label}
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                                  Preuves SIEM : {truePositivesCount}/{totalTrueEvidence} ({falsePositivesCount} FP) · IOC extraits : {verifiedIocsCount}/{iocChallenges.length} · Règle Sigma : {session.sigmaDeployed ? 'Active' : 'Non déployée'}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={handleCopyMarkdownReport}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                              >
                                <ClipboardCopy className="w-3.5 h-3.5" />
                                {copiedReport
                                  ? 'Rapport Markdown copié'
                                  : 'Copier le rapport Markdown'}
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Post-Mortem Brief */}
                      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-4">
                        <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                          Rapport Post-Mortem · {activeMission.ticketId}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              Cause racine
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                              {activeMission.postMortem.rootCause}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              Temps de résidence (Dwell Time)
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                              {activeMission.postMortem.dwellTime}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                          <div className="space-y-1.5">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              Indicateurs de compromission (IOC)
                            </div>
                            <ul className="space-y-1 font-mono text-slate-700 dark:text-slate-300">
                              {activeMission.postMortem.keyIocs.map((ioc, i) => (
                                <li key={i}>• {ioc}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-1.5">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              Durcissement durable (REX)
                            </div>
                            <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                              {activeMission.postMortem.hardeningLessons.map((lesson, i) => (
                                <li key={i}>• {lesson}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
};
