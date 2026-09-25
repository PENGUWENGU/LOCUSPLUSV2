import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Compass, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Locus caught unhandled UI error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black text-white">
          <div className="w-full max-w-sm p-6 rounded-3xl locus-glass border border-white/10 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-locus-accent/15 border border-locus-accent/30 flex items-center justify-center text-locus-accent">
              <Compass className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold">Locus Simulator Ready</h2>
            <p className="text-xs text-white/60 leading-relaxed">
              Locus is running in standard web mode. No GPS hardware or paired phone is required to simulate locations or routes.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-full bg-locus-accent text-black font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restart Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
