import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('GenericList Error Boundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="border border-red-200 rounded-lg p-6 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                Something went wrong
              </h3>
              <p className="text-red-600 dark:text-red-300">
                There was an error loading the table. Please try refreshing the page.
              </p>
            </div>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200">
                Error Details (Development Only)
              </summary>
              <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/40 rounded border text-sm font-mono text-red-800 dark:text-red-200 overflow-auto">
                <div className="mb-2">
                  <strong>Error:</strong> {this.state.error.message}
                </div>
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap text-xs mt-1">
                    {this.state.error.stack}
                  </pre>
                </div>
              </div>
            </details>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 