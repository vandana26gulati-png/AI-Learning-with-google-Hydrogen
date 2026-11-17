import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class DemoErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  State
> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'The simulation encountered an unexpected error.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-center">
          <p className="font-display text-base font-semibold text-rose-200">
            Demo could not load
          </p>
          <p className="mt-1 text-xs text-rose-200/80">{this.state.message}</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, message: '' });
              this.props.onReset?.();
            }}
            className="mt-3 min-h-[40px] rounded-xl bg-slate-800 px-4 text-xs font-medium text-slate-100 hover:bg-slate-700"
          >
            Try resetting demo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
