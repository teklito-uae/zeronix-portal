import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Something went wrong</h1>
          <p className="text-slate-400 max-w-md mb-8">
            An unexpected error occurred while rendering this component. 
            {isDev ? " Check the details below for debugging." : " Please try refreshing the page."}
          </p>

          {isDev && this.state.error && (
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-lg p-4 mb-8 text-left overflow-auto max-h-[300px]">
              <p className="text-red-400 font-mono text-xs font-bold mb-2">Error: {this.state.error.message}</p>
              <pre className="text-slate-500 font-mono text-[10px] leading-relaxed">
                {this.state.error.stack}
              </pre>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="border-slate-800 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCcw size={16} className="mr-2" />
              Reload Page
            </Button>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Home size={16} className="mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
