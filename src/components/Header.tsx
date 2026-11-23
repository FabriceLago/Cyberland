import React from 'react';

export type AppRoute = 'archipel' | 'island' | 'simulateur' | 'debug' | 'storyboards' | 'quiz';

interface HeaderProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  nextIslandId: number;
  onOpenIsland: (islandId: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeRoute,
  onNavigate,
  nextIslandId,
  onOpenIsland,
}) => {
  const navItems: { id: AppRoute; label: string }[] = [
    { id: 'archipel', label: 'Archipel' },
    { id: 'simulateur', label: 'Laboratoires' },
    { id: 'debug', label: 'Debug' },
    { id: 'storyboards', label: 'Storyboards' },
    { id: 'quiz', label: 'Quiz & Fiches' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onNavigate('archipel')}
          className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 hover:text-sky-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0"
        >
          Cyberland
        </button>

        <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive =
              activeRoute === item.id || (item.id === 'archipel' && activeRoute === 'island');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-sky-700 dark:text-sky-400 after:content-[""] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-sky-700 dark:after:bg-sky-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onOpenIsland(nextIslandId)}
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Explorer l&apos;Île {nextIslandId}
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav
        aria-label="Navigation mobile"
        className="md:hidden border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto"
      >
        {navItems.map((item) => {
          const isActive =
            activeRoute === item.id || (item.id === 'archipel' && activeRoute === 'island');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
