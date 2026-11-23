import React, { useEffect, useState } from 'react';
import { Users, Zap, RotateCcw, Trophy, CheckCircle2, XCircle, Play } from 'lucide-react';
import { AUDIENCE_QUIZZES, QuizQuestion } from '../data/courseData';
import { playClick, playError, playSuccess, playVictory } from '../utils/sound';

function pickDuelQuestions(): QuizQuestion[] {
  const all = [
    ...AUDIENCE_QUIZZES.collegiens,
    ...AUDIENCE_QUIZZES.etudiants,
    ...AUDIENCE_QUIZZES.reconversion,
  ];
  return [...all].sort(() => Math.random() - 0.5).slice(0, 10);
}

export const ClassroomDuelPanel: React.FC = () => {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [teamAName, setTeamAName] = useState('Équipe Fibre');
  const [teamBName, setTeamBName] = useState('Équipe Nuage');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [buzzedTeam, setBuzzedTeam] = useState<'A' | 'B' | null>(null);
  const [chosenOpt, setChosenOpt] = useState<number | null>(null);

  const currentQ = questions[roundIdx];

  // Keyboard buzzers: A for Team A, L for Team B
  useEffect(() => {
    if (phase !== 'playing' || buzzedTeam !== null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 'a') {
        playClick();
        setBuzzedTeam('A');
      } else if (key === 'l') {
        playClick();
        setBuzzedTeam('B');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, buzzedTeam]);

  const startDuel = () => {
    playClick();
    setQuestions(pickDuelQuestions());
    setScoreA(0);
    setScoreB(0);
    setRoundIdx(0);
    setBuzzedTeam(null);
    setChosenOpt(null);
    setPhase('playing');
  };

  const handleAnswer = (optIdx: number) => {
    if (!currentQ || !buzzedTeam || chosenOpt !== null) return;
    setChosenOpt(optIdx);
    const correct = optIdx === currentQ.correctIndex;
    if (correct) {
      playSuccess();
      if (buzzedTeam === 'A') setScoreA((s) => s + 10);
      else setScoreB((s) => s + 10);
    } else {
      playError();
      // Give 5 bonus points to the opposing team on wrong buzzer
      if (buzzedTeam === 'A') setScoreB((s) => s + 5);
      else setScoreA((s) => s + 5);
    }
  };

  const nextRound = () => {
    playClick();
    if (roundIdx + 1 >= questions.length) {
      playVictory();
      setPhase('finished');
    } else {
      setRoundIdx((i) => i + 1);
      setBuzzedTeam(null);
      setChosenOpt(null);
    }
  };

  if (phase === 'setup') {
    return (
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 max-w-3xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
            Animation grand écran · Spécial vidéoprojecteur
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Défi Classe · Duel 2 Équipes (10 manches)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Formez deux équipes en salle : dès qu&apos;une question apparaît, l&apos;équipe la plus
            rapide buzze (au clic ou avec les touches clavier <strong className="font-mono">A</strong>{' '}
            et <strong className="font-mono">L</strong>). Bonne réponse = +10 pts ; erreur = +5 pts
            pour l&apos;équipe adverse !
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="team-a-input"
              className="text-xs font-semibold text-sky-800 dark:text-sky-300"
            >
              Nom Équipe 1 (Touche clavier : A)
            </label>
            <input
              id="team-a-input"
              type="text"
              value={teamAName}
              onChange={(e) => setTeamAName(e.target.value)}
              maxLength={24}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="team-b-input"
              className="text-xs font-semibold text-emerald-800 dark:text-emerald-300"
            >
              Nom Équipe 2 (Touche clavier : L)
            </label>
            <input
              id="team-b-input"
              type="text"
              value={teamBName}
              onChange={(e) => setTeamBName(e.target.value)}
              maxLength={24}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={startDuel}
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          Lancer le Duel en 10 manches
        </button>
      </section>
    );
  }

  if (phase === 'finished') {
    const winner =
      scoreA > scoreB
        ? teamAName || 'Équipe 1'
        : scoreB > scoreA
        ? teamBName || 'Équipe 2'
        : 'Égalité parfaite !';

    return (
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 max-w-3xl text-center space-y-6">
        <Trophy className="w-10 h-10 text-amber-500 mx-auto" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
            Fin du Défi Classe Cyberland
          </p>
          <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
            {scoreA === scoreB ? winner : `Victoire : ${winner}`}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
            <p className="text-xs font-semibold text-sky-800 dark:text-sky-300">{teamAName}</p>
            <p className="font-mono text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1">
              {scoreA} pts
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              {teamBName}
            </p>
            <p className="font-mono text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1">
              {scoreB} pts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={startDuel}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Rejouer une revanche
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Scoreboard */}
      <div className="grid grid-cols-3 gap-4 items-center bg-slate-900 text-white rounded-xl p-5">
        <div className="space-y-0.5">
          <p className="text-xs text-sky-300 font-semibold">{teamAName}</p>
          <p className="font-mono text-2xl sm:text-3xl font-bold tabular-nums">{scoreA} pts</p>
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs text-slate-400">Manche</p>
          <p className="font-mono text-lg font-bold tabular-nums">
            {roundIdx + 1} / {questions.length}
          </p>
        </div>
        <div className="text-right space-y-0.5">
          <p className="text-xs text-emerald-300 font-semibold">{teamBName}</p>
          <p className="font-mono text-2xl sm:text-3xl font-bold tabular-nums">{scoreB} pts</p>
        </div>
      </div>

      {currentQ && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">{currentQ.islandRef}</p>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* Step 1: Team Buzzers */}
          {buzzedTeam === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setBuzzedTeam('A');
                }}
                className="p-5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-display text-lg font-bold flex items-center justify-center gap-2.5 transition-colors"
              >
                <Zap className="w-5 h-5" />
                BUZZER · {teamAName} (Touche A)
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setBuzzedTeam('B');
                }}
                className="p-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-display text-lg font-bold flex items-center justify-center gap-2.5 transition-colors"
              >
                <Zap className="w-5 h-5" />
                BUZZER · {teamBName} (Touche L)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-800 dark:text-sky-300">
                <Users className="w-4 h-4" />
                <span>
                  Main à : <strong>{buzzedTeam === 'A' ? teamAName : teamBName}</strong> — choisissez
                  votre réponse !
                </span>
              </div>

              <div className="space-y-2.5">
                {currentQ.options.map((opt, optIdx) => {
                  const isPicked = chosenOpt === optIdx;
                  const isRight = optIdx === currentQ.correctIndex;
                  let cls =
                    'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800';
                  if (chosenOpt !== null) {
                    if (isRight) {
                      cls =
                        'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-semibold';
                    } else if (isPicked) {
                      cls =
                        'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-950 dark:text-red-200';
                    } else {
                      cls =
                        'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={chosenOpt !== null}
                      onClick={() => handleAnswer(optIdx)}
                      className={`w-full text-left px-4 py-3 text-sm sm:text-base rounded-lg border transition-colors flex items-center justify-between gap-3 ${cls}`}
                    >
                      <span>{opt}</span>
                      {chosenOpt !== null && isRight && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      {chosenOpt !== null && isPicked && !isRight && (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {chosenOpt !== null && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  <p className="leading-relaxed">
                    <strong>
                      {chosenOpt === currentQ.correctIndex
                        ? `+10 pts pour ${buzzedTeam === 'A' ? teamAName : teamBName} !`
                        : `Mauvaise réponse · +5 pts pour ${
                            buzzedTeam === 'A' ? teamBName : teamAName
                          } !`}
                    </strong>{' '}
                    {currentQ.explanation}
                  </p>
                  <button
                    type="button"
                    onClick={nextRound}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {roundIdx + 1 >= questions.length ? 'Voir le podium' : 'Manche suivante →'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
