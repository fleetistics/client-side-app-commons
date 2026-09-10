import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import { APP_URLS } from '@/app.Impl/configs/app-urls';

import type { MyUserEmergencyAlertDto } from '@/app.Commons/dataLayer/model/myUserEmergencyAlertDto';

type EmergencyAlertLocation = {
  latitude?: number;
  longitude?: number;
};

export const myUserEmergencyAlertApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // A 404 (no active alert) is a normal, expected outcome here, not an error - mirrors
    // myUserApi.ts's getUserLocationPrivacy.
    getMyActiveEmergencyAlert: builder.query<MyUserEmergencyAlertDto | null, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery(APP_URLS.ACTIVE_EMERGENCY_ALERT_URL);
        if (result.error) {
          if (result.error.status === 404) return { data: null };
          return { error: result.error };
        }
        return { data: result.data as MyUserEmergencyAlertDto };
      },
      providesTags: [{ type: 'UserEmergencyAlert', id: 'ME' }],
    }),

    createMyEmergencyAlert: builder.mutation<void, EmergencyAlertLocation>({
      query: ({ latitude, longitude }) => ({
        url: APP_URLS.EMERGENCY_ALERT_URL,
        method: 'POST',
        body: { Latitude: latitude, Longitude: longitude },
      }),
      // Makes useGetMyActiveEmergencyAlertQuery/useMyActiveEmergencyAlert refetch.
      invalidatesTags: [{ type: 'UserEmergencyAlert', id: 'ME' }],
    }),

    completeMyEmergencyAlert: builder.mutation<void, EmergencyAlertLocation>({
      query: ({ latitude, longitude }) => ({
        url: APP_URLS.COMPLETE_EMERGENCY_ALERT_URL,
        method: 'POST',
        body: { CompleteLatitude: latitude, CompleteLongitude: longitude },
      }),
      invalidatesTags: [{ type: 'UserEmergencyAlert', id: 'ME' }],
    }),
  }),
});

export const {
  useGetMyActiveEmergencyAlertQuery,
  useLazyGetMyActiveEmergencyAlertQuery,
  useCreateMyEmergencyAlertMutation,
  useCompleteMyEmergencyAlertMutation,
} = myUserEmergencyAlertApi;

/** Alias for the RTK-generated `useGetMyActiveEmergencyAlertQuery`. */
export const useMyActiveEmergencyAlert = useGetMyActiveEmergencyAlertQuery;

/** Alias for the RTK-generated `useCreateMyEmergencyAlertMutation` - invalidates useMyActiveEmergencyAlert on success. */
export const useCreateMyEmergencyAlert = useCreateMyEmergencyAlertMutation;

/** Alias for the RTK-generated `useCompleteMyEmergencyAlertMutation` - invalidates useMyActiveEmergencyAlert on success. */
export const useCompleteMyEmergencyAlert = useCompleteMyEmergencyAlertMutation;
