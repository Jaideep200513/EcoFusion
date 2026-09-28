import React, { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

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

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EcoFusion UI Error Boundary caught an error:', error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl bg-white border border-rose-200 shadow-sm max-w-xl mx-auto my-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-950">Component Render Warning</h3>
            <p className="text-xs text-slate-600 mt-1 font-mono">
              {this.state.error?.message || 'An unexpected error occurred while rendering this section.'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-lg bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Section</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
