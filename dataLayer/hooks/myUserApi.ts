import { apiSlice } from '@/client-side.Commons/dataLayer/apiSlice';
import { LocationService } from '@/app.Commons/services/location/locationService';

import type { User, UserPatch, UserLocationPrivacyDto, UserLocationPrivacyPatch } from '../../../app.DataLayer/model/userDto';
import { APP_CONFIG } from '@/app.Impl/configs/app-config';
const BASE_USERS_URL = APP_CONFIG.BASE_API_URL + 'users';
const LOCATION_PRIVACY_URL = BASE_USERS_URL + '/me/location-privacy';
const ACTIVE_TEAM_ID_URL = BASE_USERS_URL + '/me/active-team-id';

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyUser: builder.query<User, void>({
      query: () => BASE_USERS_URL + '/me',
      providesTags: (result) => [{ type: 'User', id: result?.Id ?? 'ME' }],
    }),
    patchUser: builder.mutation<User, { userId: number; patch: UserPatch }>({
      query: ({ userId, patch }) => ({
        url: BASE_USERS_URL + `/${userId}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _error, { userId }) => [{ type: 'User', id: userId }],
    }),

    // Standard auto-caching/refetching query — subscribers see fresh data whenever
    // patchUserLocationPrivacy's invalidatesTags fires. A 404 (no record yet for this
    // user) is a normal, expected outcome here, not an error, so this uses a custom
    // queryFn to turn it into `data: null` instead of letting it surface as `error`.
    getUserLocationPrivacy: builder.query<UserLocationPrivacyDto | null, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery(LOCATION_PRIVACY_URL);
        if (result.error) {
          if (result.error.status === 404) return { data: null };
          return { error: result.error };
        }
        return { data: result.data as UserLocationPrivacyDto };
      },
      providesTags: [{ type: 'UserLocationPrivacy', id: 'ME' }],
    }),

    // Mutation-shaped on purpose: mutations never carry providesTags, so nothing —
    // including patchUserLocationPrivacy's invalidatesTags — can ever cause this to
    // re-run on its own. Call its trigger once (e.g. from a mount effect) to load the
    // value a single time; onQueryStarted seeds getUserLocationPrivacy's own cache
    // entry with the same result, so useGetUserLocationPrivacyQuery reads it too
    // without a second request.
    loadUserLocationPrivacy: builder.mutation<UserLocationPrivacyDto | null, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery(LOCATION_PRIVACY_URL);
        if (result.error) {
          if (result.error.status === 404) return { data: null };
          return { error: result.error };
        }
        return { data: result.data as UserLocationPrivacyDto };
      },
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(userApi.util.upsertQueryData('getUserLocationPrivacy', undefined, data));
        } catch {
          // queryFulfilled already rejected — nothing to seed.
        }
      },
    }),

    patchUserLocationPrivacy: builder.mutation<UserLocationPrivacyDto, UserLocationPrivacyPatch>({
      query: (patch) => ({
        url: LOCATION_PRIVACY_URL,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: [{ type: 'UserLocationPrivacy', id: 'ME' }],
    }),

    // Mutation-shaped like loadUserLocationPrivacy — no PATCH exists for this resource, so
    // there's nothing to invalidate it and no reason for a standard cached query alongside
    // it. The schema documents only a plain 200/number response with no "absent" case, but
    // this normalizes a missing/non-numeric body to `undefined` defensively in case the
    // server omits it when the user has no active team.
    loadActiveTeamId: builder.mutation<number | undefined, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery(ACTIVE_TEAM_ID_URL);
        if (result.error) return { error: result.error };
        return { data: typeof result.data === 'number' ? result.data : undefined };
      },
    }),
  })
});

export const {
  useGetMyUserQuery,
  useLazyGetMyUserQuery,
  usePatchUserMutation,
  useGetUserLocationPrivacyQuery,
  useLazyGetUserLocationPrivacyQuery,
  useLoadUserLocationPrivacyMutation,
  usePatchUserLocationPrivacyMutation,
  useLoadActiveTeamIdMutation,
} = userApi;



/** Alias for the RTK-generated `useGetMyUserQuery`. */
export const useGetMyUser = useGetMyUserQuery;


/** Alias for the RTK-generated `usePatchUserMutation`. */
export const usePatchUser = usePatchUserMutation;

/** Alias for the RTK-generated `useGetUserLocationPrivacyQuery`. */
export const useGetUserLocationPrivacy = useGetUserLocationPrivacyQuery;

/**
 * Same cache entry as useGetUserLocationPrivacy, narrowed to the boolean the rest of the app
 * cares about — no record (null) or PrivacyMode <= 0 means location sharing is not private.
 */
export function useGetUserPrivacyMode() {
  return useGetUserLocationPrivacyQuery(undefined, {
    selectFromResult: (result) => ({
      ...result,
      data: ((result.data?.PrivacyMode) ?? 0) > 0,
    }),
  });
}

/** Alias for the RTK-generated `useLoadUserLocationPrivacyMutation` — call its trigger once (e.g. on mount) to load the value a single time without subscribing to invalidation-driven refetches. */
export const useLoadUserLocationPrivacy = useLoadUserLocationPrivacyMutation;

/** Alias for the RTK-generated `usePatchUserLocationPrivacyMutation`. */
export const usePatchUserLocationPrivacy = usePatchUserLocationPrivacyMutation;

/** Mutator counterpart to useGetUserPrivacyMode: PATCHes PrivacyMode from a single boolean. */
export function useSwitchUserPrivacyMode() {
  const [patch, result] = usePatchUserLocationPrivacyMutation();
  const switchPrivacyMode = (isPrivate: boolean) => {
    LocationService.SetPrivateMode(isPrivate);
    return patch({ PrivacyMode: isPrivate ? 1 : 0 });
  };
  return [switchPrivacyMode, result] as const;
}

/** Alias for the RTK-generated `useLoadActiveTeamIdMutation` — call its trigger once (e.g. on mount) to load the value a single time. */
export const useLoadActiveTeamId = useLoadActiveTeamIdMutation;

