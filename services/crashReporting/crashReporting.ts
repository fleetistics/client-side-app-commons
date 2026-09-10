import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { getApp } from '@react-native-firebase/app';
import { didCrashOnPreviousExecution, getCrashlytics, recordError } from '@react-native-firebase/crashlytics';
// @ts-ignore - no type defs; same internal module react-native and @react-native-firebase/crashlytics
// themselves use for unhandled-rejection tracking (see node_modules/@react-native-firebase/crashlytics/lib/handlers.ts)
import rejectionTracking from 'promise/setimmediate/rejection-tracking';

import { log } from '@/app.Commons/services/logging/logger';
import { LOG_FILES_DIR } from '@/app.Commons/services/logging/logFileTransport';

let initialized = false;

// Written by MainApplication.kt's uncaught-exception handler just before the process dies —
// covers JVM-level native crashes (e.g. the react-native-maps MarkerManager bug this all started
// from) that would otherwise only ever be visible in Crashlytics. No iOS equivalent: writing to
// a file from a signal-safe crash handler needs low-level, easy-to-get-wrong code we can't
// verify without a Mac, so on iOS we fall back to the didCrashOnPreviousExecution marker below.
const NATIVE_CRASH_FILE = `${LOG_FILES_DIR}/native-crash-pending.txt`;

const consumeNativeCrashFile = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  try {
    if (!(await ReactNativeBlobUtil.fs.exists(NATIVE_CRASH_FILE))) return;
    const content = (await ReactNativeBlobUtil.fs.readFile(NATIVE_CRASH_FILE, 'utf8')).trim();
    await ReactNativeBlobUtil.fs.unlink(NATIVE_CRASH_FILE);
    if (content) log.error(content);
  } catch (err) {
    log.error('Failed to read native-crash-pending.txt:', err);
  }
};

/**
 * Wires Crashlytics into the app's two JS-side error entry points (uncaught exceptions and
 * unhandled promise rejections) and mirrors whatever it sees into the existing file logger, so
 * a crash shows up both in Firebase and in the log pack ReportIssuePage uploads.
 *
 * Must run after getApp() is usable (i.e. after Firebase native init), and only once per
 * process — ErrorUtils/rejection-tracking hold a single global handler each, so calling this
 * twice would just wrap/replace handlers redundantly.
 */
export const initCrashReporting = async (): Promise<void> => {
  if (initialized) return;
  initialized = true;

  const crashlytics = getCrashlytics(getApp());

  // getCrashlytics() above already installed Crashlytics' own ErrorUtils handler (it does this
  // the first time the module is constructed) — that's what actually records fatal JS errors to
  // Crashlytics and re-throws into React Native's default handler afterwards. We install our own
  // handler on top of it purely to also get a line in the on-disk logger; the previous handler
  // (Crashlytics' own) still runs after ours so its recording/red-box behavior is unaffected.
  const previousHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: unknown, fatal?: boolean) => {
    log.error(fatal ? 'Fatal JS exception:' : 'JS exception:', error);
    previousHandler(error, fatal);
  });

  // Unlike ErrorUtils, rejection-tracking has no chaining concept — enable() just replaces
  // whichever handler (ours or Crashlytics' own, installed by getCrashlytics() above) was
  // registered last. So here we take over recording to Crashlytics ourselves rather than
  // relying on its now-overwritten internal handler.
  rejectionTracking.enable({
    allRejections: true,
    onUnhandled: (_id: number, error: Error) => {
      log.error('Unhandled promise rejection:', error);
      recordError(crashlytics, error);
    },
  });

  // Native crashes kill the process before any JS can run, so there's no way to log them as
  // they happen — the best we can do is pick up whatever's left over on the *next* boot.
  // consumeNativeCrashFile() gets the actual exception text for JVM-level crashes on Android
  // (see MainApplication.kt); didCrashOnPreviousExecution() is the fallback for everything that
  // doesn't cover — iOS entirely, and NDK/signal-level native crashes on Android, which bypass
  // Java's UncaughtExceptionHandler and so never reach the file MainApplication.kt writes.
  await consumeNativeCrashFile();
  const crashedLastRun = await didCrashOnPreviousExecution(crashlytics);
  if (crashedLastRun) {
    log.error('Previous app run ended in a crash (native or fatal JS) — see Crashlytics for the report.');
  }
};
