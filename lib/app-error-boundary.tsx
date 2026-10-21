import { Component, type ErrorInfo, type ReactNode } from 'react';
import { getApp } from '@react-native-firebase/app';
import { getCrashlytics, recordError } from '@react-native-firebase/crashlytics';
import { InitError } from '@/client-side.Impl/bootstrap/init-error';
import { ReportIssuePage } from '@/pages/core/ReportIssuePage';

type AppErrorBoundaryProps = { children: ReactNode };
type AppErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showReport: boolean;
};

/**
 * Last-resort boundary for render-time errors that would otherwise crash the whole
 * app. Wraps everything in App.tsx so a crash anywhere below still leaves the user
 * with a screen instead of a blank/frozen app, and a way to send us what happened.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  // Read by a patched React Native (see patches/react-native+*.patch,
  // ErrorHandlers.js::onCaughtError) to skip the dev-only LogBox redbox for errors
  // this boundary already renders its own fallback + report-error flow for.
  // Dev-only by construction there — irrelevant, but harmless, in production.
  suppressLogBoxOnCaughtError = true;

  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, showReport: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      'AppErrorBoundary caught an unhandled error:',
      error.message,
      error.stack ?? 'no error stack',
      'Component stack:',
      errorInfo.componentStack ?? 'no component stack'
    );
    // Errors caught here never reach crashReporting.ts's global ErrorUtils handler — that's the
    // point of an error boundary, it stops propagation instead of letting the error go fatal —
    // so this is the one JS error path that has to call Crashlytics directly.
    recordError(getCrashlytics(getApp()), error);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.state.showReport) {
        return <ReportIssuePage />;
      }
      const errorMsg = `${this.state.error?.message ?? 'Unknown error'}\n\n${
        this.state.error?.stack ?? 'no error stack'
      }\n\n${this.state.errorInfo?.componentStack ?? 'no component stack'}`;
      return (
        <InitError title="App crashed" errorMsg={errorMsg} onReportError={() => this.setState({ showReport: true })} />
      );
    }
    return this.props.children;
  }
}
