import React, { useState } from 'react';
import { Download, Film, PauseCircle, Check } from 'lucide-react';
import { PRODUCTION_TOOLS, STORYBOARDS } from '../data/courseData';
import { playClick, playSuccess } from '../utils/sound';

export const StoryboardsView: React.FC = () => {
  const [selectedId, setSelectedId] = useState<number>(1);
  const [exported, setExported] = useState(false);

  const activeStoryboard =
    STORYBOARDS.find((s) => s.islandId === selectedId) ?? STORYBOARDS[0];

  const handleExportMarkdown = () => {
    playSuccess();
    const lines = [
      `# ${activeStoryboard.title}`,
      `Durée estimée : ${activeStoryboard.duration}`,
      `Concept cible : ${activeStoryboard.targetConcept}`,
      '',
      '## Découpage plan par plan',
      '',
      ...activeStoryboard.shots.map(
        (shot) =>
          `### Plan ${shot.shot} (${shot.timecode})\n- **Visuel :** ${shot.visual}\n- **Voix off :** « ${shot.voiceover} »\n- **Note animation :** ${shot.animationNote}\n`
      ),
      '## Pause interactive H5P recommandée',
      `- **Timecode :** ${activeStoryboard.h5pPauseQuestion.atTimecode}`,
      `- **Question :** ${activeStoryboard.h5pPauseQuestion.question}`,
      `- **Réponse attendue :** ${activeStoryboard.h5pPauseQuestion.answer}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyboard-cyberland-ile-${activeStoryboard.islandId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExported(true);
    window.setTimeout(() => setExported(false), 2500);
  };

  return (
    <div className="space-y-10 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-2">
          <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
            Production pédagogique · Scénarios plan par plan
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            Storyboards des vidéos animées
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
            Scripts complets (voix off, direction visuelle, timecodes et pauses quiz H5P) prêts à
            être tournés ou animés pour accompagner votre cours Cyberland.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportMarkdown}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap self-start md:self-auto"
        >
          {exported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {exported ? 'Script téléchargé' : 'Télécharger ce script (.md)'}
        </button>
      </div>

      {/* Video selector */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-lg w-fit">
        {STORYBOARDS.map((sb) => (
          <button
            key={sb.islandId}
            type="button"
            onClick={() => {
              playClick();
              setSelectedId(sb.islandId);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              selectedId === sb.islandId
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Vidéo Île {sb.islandId} · {sb.duration}
          </button>
        ))}
      </div>

      {/* Active Storyboard Sheet */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              {activeStoryboard.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Concept clé : {activeStoryboard.targetConcept}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-sky-800 dark:text-sky-400 shrink-0">
            <Film className="w-4 h-4" />
            Durée : {activeStoryboard.duration}
          </span>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {activeStoryboard.shots.map((shot) => (
            <div
              key={shot.shot}
              className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
            >
              <div className="lg:col-span-2 space-y-1">
                <p className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  Plan 0{shot.shot}
                </p>
                <p className="font-mono text-xs text-sky-700 dark:text-sky-400 tabular-nums">
                  {shot.timecode}
                </p>
              </div>

              <div className="lg:col-span-5 space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Visuel &amp; cadrage
                </p>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {shot.visual}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                  Animation : {shot.animationNote}
                </p>
              </div>

              <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-1">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Voix off</p>
                <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed">
                  « {shot.voiceover} »
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* H5P Pause Quiz Callout */}
        <div className="p-6 bg-sky-50 dark:bg-sky-950/40 border-t border-sky-200 dark:border-sky-900 flex flex-col sm:flex-row sm:items-start gap-4">
          <PauseCircle className="w-6 h-6 text-sky-700 dark:text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-sky-950 dark:text-sky-200">
              Pause interactive H5P recommandée à {activeStoryboard.h5pPauseQuestion.atTimecode}
            </p>
            <p className="text-sky-900 dark:text-sky-300">
              {activeStoryboard.h5pPauseQuestion.question}
            </p>
            <p className="text-xs text-sky-800 dark:text-sky-400 pt-1">
              <strong>Réponse attendue :</strong> {activeStoryboard.h5pPauseQuestion.answer}
            </p>
          </div>
        </div>
      </section>

      {/* Recommended Production Tools */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
          Outils recommandés pour produire vos capsules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRODUCTION_TOOLS.map((tool) => (
            <div
              key={tool.category}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-2"
            >
              <p className="text-xs font-medium text-sky-700 dark:text-sky-400">{tool.category}</p>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                {tool.tools}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {tool.usage}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
