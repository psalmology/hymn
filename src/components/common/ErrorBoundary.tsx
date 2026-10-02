import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error in application:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-screen flex items-center justify-center bg-[#F2F2F7] p-6 text-neutral-900 font-sans">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-black/10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-1">
              页面加载遇到异常
            </h2>
            <p className="text-[13px] text-neutral-500 mb-4 leading-normal">
              检测到运行时错误，已拦截保护。请点击下方按钮重新加载。
            </p>
            {this.state.error && (
              <div className="p-3 bg-neutral-100 rounded-xl text-left text-[11px] font-mono text-neutral-700 max-h-36 overflow-y-auto mb-4 whitespace-pre-wrap break-all">
                {this.state.error.toString()}
              </div>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-3 bg-neutral-900 text-white rounded-2xl text-[14px] font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <RefreshCw size={15} />
              <span>重新加载应用</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
