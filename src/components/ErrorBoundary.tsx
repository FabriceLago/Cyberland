import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erreur inattendue dans l’application.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Cyberland ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full rounded-2xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h1 className="text-lg font-extrabold">Incident détecté dans Cyberland</h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Une erreur d’exécution est survenue. Vous pouvez relancer l’interface sans perdre votre progression locale.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Recharger Cyberland
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
