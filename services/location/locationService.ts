import BackgroundGeolocation from 'react-native-background-geolocation';
import type { Location, ProviderChangeEvent } from '@transistorsoft/background-geolocation-types';
import { AccuracyAuthorization, AuthorizationStatus } from '@transistorsoft/background-geolocation-types';
import { APP_CONFIG } from '@/app.Impl/configs/app-config';
import { APP_URLS } from '@/app.Impl/configs/app-urls';
import { store } from '@/client-side.Commons/dataLayer/core/store';
import { locationAcquired, reportLocationStatusUpdated, providerStatusUpdated } from '@/app.Commons/dataLayer/api/locationApi';
import { GPSLocation, GPSLocationAccuracy } from '@/client-side.Commons/dataLayer/model/gps-location';
import { MathUtils } from '@/client-side.Commons/helpers/math-utils';
import { AuthToken } from '@/client-side.Commons/dataLayer/core/apiSlice';

export function isLocationPermissionError(error: any): boolean {
    if (!error) return false;
    const msg = typeof error === 'string' ? error : (error.message ?? '');
    return (
        msg === 'Permission denied' ||
        error?.code === 'get_current_position_error' ||
        error?.domain === 'kCLErrorDomain'
    );
}

export enum LocationProviderStatusEnum {
    PermissonDenied = -1,
    inFlightMode = 0,
    AppInUse = 1,
    Always = 2,
}

export enum LocationProviderPrecision {
    NotAvailable = 0,
    Reduced = 1,
    Cell = 2,
    Gps = 3,
}

const LOCATION_PROVIDER_STATUS_DESCRIPTIONS: Record<LocationProviderStatusEnum, string> = {
    [LocationProviderStatusEnum.PermissonDenied]: 'Location permission has been denied.',
    [LocationProviderStatusEnum.inFlightMode]: 'Location services are turned off (e.g. flight/airplane mode).',
    [LocationProviderStatusEnum.AppInUse]: 'Location is available only while the app is in use.',
    [LocationProviderStatusEnum.Always]: 'Location is available at all times, including in the background.',
};

export class LocationProviderStatus {
    public readonly status: LocationProviderStatusEnum;
    public readonly description: string;
    public readonly precision: LocationProviderPrecision;

    constructor(status: LocationProviderStatusEnum, precision: LocationProviderPrecision) {
        this.status = status;
        this.description = LOCATION_PROVIDER_STATUS_DESCRIPTIONS[status];
        this.precision = precision;
    }

    public equals(other: LocationProviderStatus | undefined): boolean {
        return !!other && this.status === other.status && this.precision === other.precision;
    }

    public static Denied(): LocationProviderStatus {
        return new LocationProviderStatus(LocationProviderStatusEnum.PermissonDenied, LocationProviderPrecision.NotAvailable);
    }

    public static FromProviderChangeEvent(event: ProviderChangeEvent): LocationProviderStatus {
        const status = !event.enabled
            ? LocationProviderStatusEnum.inFlightMode
            : event.status === AuthorizationStatus.Always
                ? LocationProviderStatusEnum.Always
                : event.status === AuthorizationStatus.WhenInUse
                    ? LocationProviderStatusEnum.AppInUse
                    : LocationProviderStatusEnum.PermissonDenied;

        const isAuthorized = status === LocationProviderStatusEnum.Always || status === LocationProviderStatusEnum.AppInUse;
        const precision = !isAuthorized
            ? LocationProviderPrecision.NotAvailable
            : event.accuracyAuthorization === AccuracyAuthorization.Reduced
                ? LocationProviderPrecision.Reduced
                : event.gps
                    ? LocationProviderPrecision.Gps
                    : event.network
                        ? LocationProviderPrecision.Cell
                        : LocationProviderPrecision.NotAvailable;

        return new LocationProviderStatus(status, precision);
    }
}

export class LocationService {
    public static GetInstance(): LocationService {
        if (!this._instance) {
            this._instance = new LocationService();
        }
        return this._instance;
    }
    protected locationToGPSLocation(position: Location, timeStamp?:number): GPSLocation {
        let acc = GPSLocationAccuracy.Bad;
        if (position.coords.accuracy < 5) acc = GPSLocationAccuracy.Fine;
        else if (position.coords.accuracy < 20) acc = GPSLocationAccuracy.Fair;
        else if (position.coords.accuracy < 50) acc = GPSLocationAccuracy.Poor;
        return {
            Odo: position.odometer,
            Lat: MathUtils.RoundTo(position.coords.latitude, 5),
            Lng: MathUtils.RoundTo(position.coords.longitude, 5),
            Alt: position.coords.altitude ?? 0,
            Acc: acc,
            Speed:position.coords.speed,
            TimeStamp:timeStamp??Math.floor( new Date(position.timestamp).getTime() / 1000)
        };
    }
    public async GetCurrentLocationAsync(): Promise<GPSLocation> {
        try {
            var location = await BackgroundGeolocation.getCurrentPosition({
                timeout: 30,          // 30 second timeout to fetch location
                maximumAge: 5000,     // Accept the last-known-location if not older than 5000 ms.
                desiredAccuracy: 20,  // Try to fetch a location with an accuracy of 20 meters.
                samples: 3,           // How many location samples to attempt.
            });
            if ( this.CheckAndUpdateLocation(location)) return this.mLatestLocation;
            else return this.locationToGPSLocation(location);
            
        } catch (error) {
            if (this.mLatestLocation) {
                console.warn('[LocationService] getCurrentPosition failed, falling back to last known location', error);
                return this.mLatestLocation;
            }
            throw error;
        }
    }

    public CheckAndUpdateLocation(loc: Location):boolean {
        this.mLatestPlatformLocation = loc;
        if ((!loc.coords.accuracy || loc.coords.accuracy < 60) && (loc.coords.latitude && loc.coords.longitude)) {
            let tmpTimeStamp = Math.floor( new Date(loc.timestamp).getTime() / 1000);
            if (!this.mLatestLocation || ((this.mLatestLocation.TimeStamp && (tmpTimeStamp-this.mLatestLocation.TimeStamp) > 30 ) && (Math.abs(this.mLatestLocation.Lat! - loc.coords.latitude) > 0.0003 || Math.abs(this.mLatestLocation.Lng! - loc.coords.longitude) > 0.0003))) {
                //console.log(`LocationService::UpdateLocation ${tmpTimeStamp}`,loc);
                this.mLatestLocation = this.locationToGPSLocation(loc, tmpTimeStamp);
                store.dispatch(locationAcquired(this.mLatestLocation));

                return true;
            }
        }
        return false;    
    }

    public GetLatestGPSLocation(): GPSLocation {
        return this.mLatestLocation;
    }
    public GetLatestPlatformLocation(): Location | undefined {
        return this.mLatestPlatformLocation;
    }

    public GetIsLocationReported(): boolean {
        return this.mIsLocationReported;
    }

    public GetProviderStatus(): LocationProviderStatus {
        return this.mProviderStatus;
    }

    public UpdateProviderStatus(next: LocationProviderStatus): void {
        if (this.mProviderStatus.equals(next)) return;
        this.mProviderStatus = next;
        store.dispatch(providerStatusUpdated({ status: next.status, description: next.description, precision: next.precision }));
    }

    public static SetBothPrivateMode_ReportLocationMode(privateMode: boolean, reportLocationMode: boolean): void {
        LocationService.GetInstance().setBothPrivateMode_ReportLocationMode(privateMode, reportLocationMode);
    }

    public static SetPrivateMode(value: boolean): void {
        LocationService.GetInstance().setPrivateMode(value);
    }

    public static SetReportLocationMode(value: boolean): void {
        LocationService.GetInstance().setReportLocationMode(value);
    }

    private async setBothPrivateMode_ReportLocationMode(privateMode: boolean, reportLocationMode: boolean): Promise<void> {
        this.mPrivateMode = privateMode;
        this.mReportLocationMode = reportLocationMode;
        await this.applyReportLocationModeChange();
    }
    
    private async setPrivateMode(value: boolean): Promise<void> {
        this.mPrivateMode = value;
        await this.applyReportLocationModeChange();
    }

    private async setReportLocationMode(value: boolean): Promise<void> {
        this.mReportLocationMode = value;
        await this.applyReportLocationModeChange();
    }

    private async applyReportLocationModeChange(): Promise<void> {
        const next = this.mReportLocationMode && !this.mPrivateMode;
        if (next === this.mIsLocationReported) return;
        this.mIsLocationReported = next;
        store.dispatch(reportLocationStatusUpdated(next));
        console.log(`LocationService::applyReportLocationModeChange next=${next} (privateMode=${this.mPrivateMode}, reportLocationMode=${this.mReportLocationMode})`);
        try {
            if (!next) {
                await BackgroundGeolocation.setConfig({ http: { autoSync: false, url: '' } });
            } else {
                await BackgroundGeolocation.setConfig({ http: { autoSync: true, url: APP_URLS.LOCATION_REPORT_URL, headers: {
                                    Authorization: `Bearer ${AuthToken.get() ?? ''}`
                                } } });
                await this.GetCurrentLocationAsync();
                console.log(`LocationService::applyReportLocationModeChange location reported: ${JSON.stringify(this.mLatestLocation)}`);
            }
        } catch (error) {
            if (!isLocationPermissionError(error)) {
                console.error('[LocationService] applyReportLocationModeChange failed', error);
            }
        }
    }

    protected mLatestPlatformLocation?: Location;
    protected mLatestLocation: GPSLocation = {};
    protected mProviderStatus: LocationProviderStatus = LocationProviderStatus.Denied();
    protected mPrivateMode: boolean = false;
    protected mReportLocationMode: boolean = APP_CONFIG.ReportLocationMode;
    protected mIsLocationReported: boolean = this.mReportLocationMode && !this.mPrivateMode;

    private static _instance?: LocationService;
}
