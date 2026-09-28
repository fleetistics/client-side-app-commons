const LEVELS = ['log', 'debug', 'info', 'warn', 'error'] as const;
const originalConsole = Object.fromEntries(LEVELS.map((level) => [level, console[level]]));

// Macrotask tick: only runs once the microtask queue drains, so a write-failure ->
// console.warn -> write loop (which never drains it) hangs here rather than passing.
const flush = async () => {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setImmediate(resolve));
};

let warn: jest.Mock;
let appendFile: jest.Mock;
let log: typeof import('./logger').log;

beforeEach(() => {
  jest.resetModules();
  // Stand-ins for the real console, installed before the transport module loads so it
  // captures these as the "unpatched" console.
  warn = jest.fn();
  console.warn = warn;
  console.log = jest.fn();
  appendFile = require('react-native-blob-util').default.fs.appendFile;
  log = require('./logger').log;
  log.patchConsole();
});

afterEach(() => {
  LEVELS.forEach((level) => (console[level] = originalConsole[level]));
});

test('a failed write is reported without being routed back into the file transport', async () => {
  appendFile.mockRejectedValue(new Error('disk full'));

  console.log('first line');
  await flush();

  expect(appendFile).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toBe('blobUtilFileTransport: failed to write log line');
});

test('consecutive failures are reported once until a write succeeds again', async () => {
  appendFile.mockRejectedValue(new Error('disk full'));
  console.log('fails 1');
  console.log('fails 2');
  await flush();
  expect(appendFile).toHaveBeenCalledTimes(2);
  expect(warn).toHaveBeenCalledTimes(1);

  appendFile.mockResolvedValue(undefined);
  console.log('succeeds');
  await flush();
  expect(warn).toHaveBeenCalledTimes(1);

  appendFile.mockRejectedValue(new Error('disk full'));
  console.log('fails again');
  await flush();
  expect(warn).toHaveBeenCalledTimes(2);
});

test('a failed log-directory creation is retried on the next write', async () => {
  const mkdir: jest.Mock = require('react-native-blob-util').default.fs.mkdir;
  mkdir.mockRejectedValueOnce(new Error('storage not mounted'));

  console.log('dir creation fails');
  await flush();
  expect(appendFile).not.toHaveBeenCalled();

  console.log('dir creation succeeds');
  await flush();
  expect(mkdir).toHaveBeenCalledTimes(2);
  expect(appendFile).toHaveBeenCalledTimes(1);
});
