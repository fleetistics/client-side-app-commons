import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@/client-side.Commons/dataLayer/store';
import { useAppSelector } from '@/client-side.Commons/dataLayer/hooks';
import { LocationProviderStatusEnum } from '@/app.Commons/services/location/locationService';
import type { LocationProviderPrecision } from '@/app.Commons/services/location/locationService';
import { GPSLocation } from '@/client-side.Commons/model/gps-location';
import { APP_CONFIG } from '@/app.Impl/configs/app-config';

// Plain, serializable snapshot of a LocationProviderStatus instance — Redux state/actions must
// stay plain objects, so the class itself is only ever used to compute this, never stored as-is.
export type LocationProviderStatusSnapshot = {
    status: LocationProviderStatusEnum;
    description: string;
    precision: LocationProviderPrecision;
};

type LocationState = {
    location: GPSLocation,
    providerStatus: LocationProviderStatusSnapshot,
    isLocationReported: boolean,
};

// Numeric literals here (not the enum members) sidestep a load-order hazard: this file and
// locationService.ts import from each other, and referencing an enum's VALUE at module top
// level can read as undefined if locationService.ts happens to load first in the cycle. These
// match LocationProviderStatusEnum.PermissonDenied / LocationProviderPrecision.NotAvailable —
// the same conservative "not authorized" default LocationProviderStatus.Denied() constructs.
const DEFAULT_PROVIDER_STATUS: LocationProviderStatusSnapshot = {
    status: -1,
    description: 'Location permission has been denied.',
    precision: 0,
};

// Matches LocationService's own default (mPrivateMode: false, mReportLocationMode: APP_CONFIG.ReportLocationMode).
const initialState: LocationState = {
    location: {},
    providerStatus: DEFAULT_PROVIDER_STATUS,
    isLocationReported: APP_CONFIG.ReportLocationMode,
};

const locationSlice = createSlice({
    name: 'location',
    initialState,
    reducers: {
        locationAcquired: (state, action: PayloadAction<GPSLocation>) => {
            state.location = action.payload;
        },
        providerStatusUpdated: (state, action: PayloadAction<LocationProviderStatusSnapshot>) => {
            const next = action.payload;
            const prev = state.providerStatus;
            // Guard here too (on top of the caller's own equals() check) so a redundant
            // dispatch never touches state — keeps the selector reference stable and
            // components reading it from re-rendering for a no-op update.
            if (prev.status === next.status && prev.precision === next.precision) return;
            state.providerStatus = next;
        },
        reportLocationStatusUpdated: (state, action: PayloadAction<boolean>) => {
            if (state.isLocationReported === action.payload) return;
            state.isLocationReported = action.payload;
        },
    },
});

export default locationSlice.reducer;
export const { locationAcquired, providerStatusUpdated, reportLocationStatusUpdated } = locationSlice.actions;

export function useLatestGPSLocation(): GPSLocation {
    return useAppSelector((state: RootState) => state.locationState.location);
}

export function useLocationProviderStatus(): LocationProviderStatusSnapshot {
    return useAppSelector(state => state.locationState.providerStatus);
}

export function useReportLocationStatus(): boolean {
    return useAppSelector(state => state.locationState.isLocationReported);
}

