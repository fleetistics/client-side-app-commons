import ReactNativeBlobUtil from 'react-native-blob-util';
import { gzip } from 'pako';

import { AuthToken, createStandaloneRefreshApi, notifyAuthLost, refreshAccessToken } from '@/client-side.Commons/dataLayer/apiSlice';
import { APP_URLS } from '@/app.Impl/configs/app-urls';
import { ClientSideInfoProvider } from '@/app.Impl/userSession/ClientSideInfoProvider';
import { clearLogFiles, LOG_FILES_DIR, listLogFiles } from './logFileTransport';

type LogPack = {
  fileName: string;
  gzipBytes: Uint8Array;
};

const buildLogPack = async (): Promise<LogPack | null> => {
  const names = await listLogFiles();
  if (names.length === 0) return null;

  const sections = await Promise.all(
    names.map(async (name) => {
      const content = await ReactNativeBlobUtil.fs.readFile(`${LOG_FILES_DIR}/${name}`, 'utf8');
      return `----- ${name} -----\n${content}`;
    })
  );

  const gzipBytes = gzip(sections.join('\n\n'));
  const fileName = `client-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.log.gz`;
  return { fileName, gzipBytes };
};

const postReport = (
  userDescription: string,
  clientSideInfoJson: string,
  pack: LogPack | null,
  tempPath?: string,
  issueContext?: string
) =>
  ReactNativeBlobUtil.fetch(
    'POST',
    APP_URLS.CLIENT_LOG_PACK_URL,
    { Authorization: `Bearer ${AuthToken.get() ?? ''}` },
    [
      { name: 'UserDescription', data: userDescription },
      { name: 'ClientSideInfo', data: clientSideInfoJson },
      { name: 'ClientSideDate', data: new Date().toString() },
      { name: 'IssueContext', data: issueContext ?? '' },
      ...(pack && tempPath
        ? [
            {
              name: 'file',
              filename: pack.fileName,
              type: 'application/gzip',
              data: ReactNativeBlobUtil.wrap(tempPath),
            },
          ]
        : []),
    ]
  );

/**
 * Gathers all rotated log files, gzips them into a single pack, and uploads it to
 * /api/client-log-pack alongside the user's issue description and client-side info —
 * same multipart-upload and 401-retry pattern as media uploads (nativeUploadClient.ts),
 * sharing apiSlice's single-flight refresh latch on a 401.
 *
 * Throws an Error describing the failure (auth expired, server rejection, etc.) instead
 * of returning a bare boolean, so callers can surface the actual reason to the user.
 */
export const submitIssueReport = async (userDescription: string, issueContext?: string): Promise<void> => {
  const pack = await buildLogPack();
  const clientSideInfoJson = JSON.stringify(await ClientSideInfoProvider.GetInstance().GetInfo());
  const tempPath = pack ? `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${pack.fileName}` : undefined;
  if (pack && tempPath) {
    // 'ascii' here means "array of byte values" in react-native-blob-util's encoding
    // enum, not 7-bit ASCII text — required for writing binary (gzip) data.
    await ReactNativeBlobUtil.fs.writeFile(tempPath, Array.from(pack.gzipBytes), 'ascii');
  }

  try {
    let response = await postReport(userDescription, clientSideInfoJson, pack, tempPath, issueContext);
    if (response.respInfo.status === 401) {
      const refreshed = await refreshAccessToken(createStandaloneRefreshApi('clientLogPack'), {});
      if (!refreshed) {
        notifyAuthLost();
        throw new Error('Your session has expired. Please sign in again.');
      }
      response = await postReport(userDescription, clientSideInfoJson, pack, tempPath, issueContext);
      if (response.respInfo.status === 401) {
        notifyAuthLost();
        throw new Error('Your session has expired. Please sign in again.');
      }
    }
    if (response.respInfo.status !== 200) {
      const body = await Promise.resolve(response.text()).catch(() => '');
      throw new Error(`Server rejected the report (status ${response.respInfo.status})${body ? `: ${body}` : ''}`);
    }
    if (pack) await clearLogFiles();
  } finally {
    if (tempPath) await ReactNativeBlobUtil.fs.unlink(tempPath).catch(() => {});
  }
};
