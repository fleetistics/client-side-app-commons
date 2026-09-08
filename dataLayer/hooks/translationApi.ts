import { apiSlice } from '@/client-side.Commons/dataLayer/apiSlice';
import { APP_CONFIG } from '@/app.Impl/configs/app-config';
import type { TranslationTable } from '@/client-side.Commons/i18n/translationTypes';

const BASE_TRANSLATIONS_URL = APP_CONFIG.BASE_API_URL + 'translations';

/**
 * STUB: shaped to match the reference implementation's contract (GET /api/translations/{lang}
 * and POST /api/translations/report), but server-side-base-api-server doesn't implement these
 * routes yet — getTranslationTable/reportUnknownTranslations will fail until it does. Update
 * the URLs here once the real endpoints exist.
 */
export const translationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTranslationTable: builder.query<
      TranslationTable,
      { lang: string; sinceUnixSeconds?: number }
    >({
      query: ({ lang, sinceUnixSeconds }) => ({
        url: `${BASE_TRANSLATIONS_URL}/${encodeURIComponent(lang)}`,
        params:
          sinceUnixSeconds === undefined
            ? undefined
            : { since: new Date(sinceUnixSeconds * 1000).toISOString() },
      }),
    }),
    reportUnknownTranslations: builder.mutation<void, string[]>({
      query: (texts) => ({
        url: `${BASE_TRANSLATIONS_URL}/report`,
        method: 'POST',
        body: { Texts: texts },
      }),
    }),
  }),
});
