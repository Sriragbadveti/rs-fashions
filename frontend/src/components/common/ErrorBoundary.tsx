import React, { Component, ErrorInfo, ReactNode } from "react";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F2] font-sans text-[#2A2421] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl border border-black/8 bg-white p-8 sm:p-10 shadow-xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8E3D51]/10 text-[#8E3D51] mb-5">
              <FiAlertCircle size={28} />
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-light text-[#2A2421]">
              A Moment of <span className="italic font-normal text-[#8E3D51]">Pause.</span>
            </h2>

            <p className="mt-3 text-xs leading-relaxed text-[#6E6359]">
              An unexpected interruption occurred while preparing your showroom view. Please refresh the page to resume exploring our collection.
            </p>

            <div className="mt-7 flex flex-col gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 rounded-full bg-[#8E3D51] py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-md hover:bg-[#722F40] transition-colors active:scale-95"
              >
                <FiRefreshCw size={14} />
                <span>Reload Showroom</span>
              </button>

              <a
                href="/"
                className="text-xs font-medium text-[#8C7A6B] hover:text-[#2A2421] transition-colors py-1"
              >
                Return to Homepage →
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
