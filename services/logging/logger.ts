import { consoleTransport, logger } from 'react-native-logs';

import { blobUtilFileTransport, configureLogRotation } from './logFileTransport';

const stringifyArg = (msg: unknown): string => {
  if (typeof msg === 'string') return msg;
  if (typeof msg === 'function') return `[function ${msg.name}()]`;
  if (msg instanceof Error) return msg.message;
  try {
    return JSON.stringify(msg);
  } catch {
    return String(msg);
  }
};

export const log = logger.createLogger({
  // Both transports run on every log call: consoleTransport keeps output visible in the
  // Metro/dev console (patchConsole would otherwise silently redirect it to file only),
  // and blobUtilFileTransport persists it to disk for log-file uploads.
  transport: [consoleTransport, blobUtilFileTransport],
  severity: 'debug',
  // Skip react-native-logs' own "<time> | console | <LEVEL> :" prefix on every message —
  // blobUtilFileTransport already stamps each line with its own ISO timestamp and level.
  formatFunc: (_level, _extension, msgs) =>
    Array.isArray(msgs) ? msgs.map(stringifyArg).join(' ') : stringifyArg(msgs),
});

export type InitLoggerOptions = {
  /** Maximum number of rotated log files kept on disk before the oldest are pruned. */
  maxLogFiles?: number;
  /** Maximum size in bytes a log file can reach before rotating to a new one. */
  maxLogFileSize?: number;
};

/** Routes console.debug/log/info/warn/error through the logger (and its file transport). */
export const initLogger = (options: InitLoggerOptions = {}): void => {
  configureLogRotation({ maxFiles: options.maxLogFiles, maxFileSize: options.maxLogFileSize });
  log.patchConsole();
};
