import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside Celebration Studio:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearStorageAndReload = () => {
    try {
      localStorage.removeItem('eventos_ai_events_v3_assets');
      localStorage.removeItem('eventos_ai_events_v2_light');
    } catch (e) {
      console.warn('Could not clear local storage', e);
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#faf9f6] text-stone-900 flex flex-col items-center justify-center p-6 selection:bg-amber-100 selection:text-amber-900">
          <div className="max-w-lg w-full bg-white border border-stone-200/90 rounded-3xl p-8 shadow-xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8 text-amber-700" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                Peace of Mind Recovery
              </span>
              <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
                Celebration Studio Encountered a Hiccup
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
                Don't worry—your celebration data and vendor plans remain safely preserved. Let's get you right back to planning your dream day.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Celebration Workspace</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearStorageAndReload}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Restore Sample Blueprint</span>
              </button>
            </div>

            {this.state.error && (
              <details className="text-left pt-4 border-t border-stone-100">
                <summary className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 cursor-pointer">
                  Technical Diagnostics (for developers)
                </summary>
                <pre className="mt-2 p-3 bg-stone-900 text-amber-300 rounded-xl text-[10px] overflow-x-auto font-mono max-h-40 leading-relaxed">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
