import ReactNativeBlobUtil from 'react-native-blob-util';
import type { transportFunctionType } from 'react-native-logs';

export const LOG_FILES_DIR = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/logs`;

const DEFAULT_MAX_FILE_SIZE = 1024 * 1024; // 1MB
const DEFAULT_MAX_FILES = 7;
const FILE_NAME_RE = /^app-log-(\d{4}-\d{2}-\d{2})-(\d{2})\.log$/;

let MAX_FILE_SIZE = DEFAULT_MAX_FILE_SIZE;
let MAX_FILES = DEFAULT_MAX_FILES;

/**
 * Overrides the log rotation limits. Must be called before any log lines are written
 * (e.g. from initLogger) since in-flight rotation state isn't recomputed retroactively.
 */
export const configureLogRotation = (options: { maxFiles?: number; maxFileSize?: number }): void => {
  if (options.maxFiles !== undefined) MAX_FILES = options.maxFiles;
  if (options.maxFileSize !== undefined) MAX_FILE_SIZE = options.maxFileSize;
};

type RotationState = {
  day: string;
  seq: number;
  path: string;
  size: number;
};

let state: RotationState | null = null;
// Serializes writes so concurrent log() calls can't interleave appends or race the
// rotation check (size read + decide + write is not atomic otherwise).
let writeQueue: Promise<void> = Promise.resolve();
let dirReady: Promise<void> | null = null;

const pad2 = (n: number): string => String(n).padStart(2, '0');

const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const fileName = (day: string, seq: number): string => `app-log-${day}-${pad2(seq)}.log`;

const ensureLogDir = (): Promise<void> => {
  dirReady ??= ReactNativeBlobUtil.fs
    .exists(LOG_FILES_DIR)
    .then((exists) => (exists ? undefined : ReactNativeBlobUtil.fs.mkdir(LOG_FILES_DIR)));
  return dirReady;
};

/** Rotated log files on disk, oldest first (names sort chronologically: ISO date + zero-padded sequence). */
export const listLogFiles = async (): Promise<string[]> => {
  await ensureLogDir();
  const names = await ReactNativeBlobUtil.fs.ls(LOG_FILES_DIR);
  return names.filter((n) => FILE_NAME_RE.test(n)).sort();
};

const pruneOldFiles = async (): Promise<void> => {
  const files = await listLogFiles();
  const excess = files.length - MAX_FILES;
  if (excess <= 0) return;
  await Promise.all(
    files.slice(0, excess).map((name) => ReactNativeBlobUtil.fs.unlink(`${LOG_FILES_DIR}/${name}`).catch(() => {}))
  );
};

const statSizeOrZero = async (path: string): Promise<number> => {
  try {
    if (!(await ReactNativeBlobUtil.fs.exists(path))) return 0;
    const stat = await ReactNativeBlobUtil.fs.stat(path);
    return Number(stat.size) || 0;
  } catch {
    return 0;
  }
};

const ensureCurrentFile = async (nextWriteSize: number): Promise<string> => {
  const day = todayKey();

  if (!state || state.day !== day) {
    // First write of the day, or the first write since the app (re)launched: resume the
    // latest file already on disk for today instead of assuming a fresh one, in case an
    // earlier session this same day already wrote to it.
    const files = await listLogFiles();
    const seqsToday = files
      .map((f) => FILE_NAME_RE.exec(f))
      .filter((m): m is RegExpExecArray => m !== null && m[1] === day)
      .map((m) => parseInt(m[2], 10));
    const seq = seqsToday.length > 0 ? Math.max(...seqsToday) : 0;
    const path = `${LOG_FILES_DIR}/${fileName(day, seq)}`;
    state = { day, seq, path, size: await statSizeOrZero(path) };
    await pruneOldFiles();
  }

  if (state.size + nextWriteSize > MAX_FILE_SIZE) {
    const seq = state.seq + 1;
    state = { day, seq, path: `${LOG_FILES_DIR}/${fileName(day, seq)}`, size: 0 };
    await pruneOldFiles();
  }

  return state.path;
};

const appendLine = async (line: string): Promise<void> => {
  await ensureLogDir();
  const path = await ensureCurrentFile(line.length);
  await ReactNativeBlobUtil.fs.appendFile(path, line, 'utf8');
  state!.size += line.length;
};

const removeAllFiles = async (): Promise<void> => {
  const files = await listLogFiles();
  await Promise.all(files.map((name) => ReactNativeBlobUtil.fs.unlink(`${LOG_FILES_DIR}/${name}`).catch(() => {})));
  state = null;
};

/**
 * Deletes all rotated log files from disk (e.g. once they've been successfully uploaded
 * elsewhere). Queued behind writeQueue so it can't race an in-flight appendLine.
 */
export const clearLogFiles = (): Promise<void> => {
  const result = writeQueue.then(removeAllFiles);
  writeQueue = result.catch(() => {});
  return result;
};

/**
 * react-native-logs file transport backed by react-native-blob-util (already a dependency
 * here for uploads) instead of react-native-fs, so logging doesn't pull in a second native
 * filesystem module. Rotates daily and once a file passes MAX_FILE_SIZE, keeping at most
 * MAX_FILES on disk.
 */
export const blobUtilFileTransport: transportFunctionType<object> = (props) => {
  // line.length is UTF-16 code units, not bytes, so the size cap is approximate for
  // non-ASCII text — acceptable for a soft rotation threshold.
  const line = `${new Date().toISOString()} [${props.level.text.toUpperCase()}] ${props.msg}\n`;
  writeQueue = writeQueue.then(() => appendLine(line)).catch((err) => {
    console.warn('blobUtilFileTransport: failed to write log line', err);
  });
};
