import { GlobalAlert } from "@/client-side.Commons/lib/global-alert";
import { LOCATION_MESSAGES } from "./location-messages";
import { isLocationPermissionError, LocationProviderStatus, LocationProviderStatusEnum, LocationService } from "./locationService";
import BackgroundGeolocation, { AuthorizationStatus } from "react-native-background-geolocation";
import type { HttpEvent, HeartbeatEvent, Location, LocationError, ProviderChangeEvent, Subscription } from '@transistorsoft/background-geolocation-types';
import { AuthToken, createStandaloneRefreshApi, notifyAuthLost, refreshAccessToken } from "@/client-side.Commons/dataLayer/core/apiSlice";
import { APP_URLS } from "@/client-side.Impl/config/app-urls";
import { SubscribeIsAppActive } from "../app-state-context";

export class LocationProvider {
    private mWasAuthorized: boolean = true;
    private mHasShownInitialWarning = false;
    private mOnHttpSubscription: Subscription;
    private mOnLocationSubscription: Subscription;
    private mOnHeartbeatSubscription: Subscription;
    private mOnProviderChangeSubscription: Subscription;
    private mUnsubscribeIsAppActive?: () => void;
    private mIsDestroyed = false;

    private maybeShowInitialLocationWarning(current: LocationProviderStatus) {
        if (this.mHasShownInitialWarning) return;
        this.mHasShownInitialWarning = true;
        if (current.status === LocationProviderStatusEnum.Always) return;
        const { title, message } = current.status === LocationProviderStatusEnum.AppInUse
            ? LOCATION_MESSAGES.alwaysNotGranted
            : LOCATION_MESSAGES.notAvailable;
        GlobalAlert.ShowWarning(message, title);

    }
    constructor() {

        // BackgroundGeolocation.getProviderState()
        //     .then((event) => LocationService.GetInstance().UpdateProviderStatus(LocationProviderStatus.FromProviderChangeEvent(event)))
        //     .catch((error) => console.error('[LocationProvider] getProviderState failed', error));

        this.mOnHttpSubscription = BackgroundGeolocation.onHttp(async (response: HttpEvent) => {
            if (response.status === 200) return;

            if (response.status !== 401) {
                console.warn('[LocationProvider] onHttp error', response);
                BackgroundGeolocation.logger.error(`HTTP failed [${response.status}] [${response.responseText}]`);
                return;
            }

            console.log('[LocationProvider] onHttp 401 Unauthorized, refreshing auth token');
            // Shares apiSlice's single-flight refresh latch so a concurrent RTK Query
            // request hitting 401 at the same time doesn't trigger a second refresh
            // that invalidates this one's cookie (see MediaUploadService).
            const refreshed = await refreshAccessToken(createStandaloneRefreshApi('locationReport'), {});
            if (!refreshed) {
                notifyAuthLost();
                console.error('[LocationProvider] onHttp 401 Unauthorized, auth token refresh failed');
                return;
            }
            await BackgroundGeolocation.setConfig({
                http: {
                    autoSync: true, url: APP_URLS.LOCATION_REPORT_URL, headers: {
                        Authorization: `Bearer ${AuthToken.get() ?? ''}`
                    }
                }
            });
            console.log('[LocationProvider] onHttp 401 Unauthorized, auth token updated');
        });
        this.mOnLocationSubscription = BackgroundGeolocation.onLocation((location: Location) => {
            LocationService.GetInstance().CheckAndUpdateLocation(location);
        }, (error: LocationError) => {
            console.error('[LocationProvider] onLocation error', error);
        });
        this.mOnHeartbeatSubscription = BackgroundGeolocation.onHeartbeat((event: HeartbeatEvent) => {
            BackgroundGeolocation.insertLocation({ ...event.location, event: 'Heartbeat' });
        });
        this.mOnProviderChangeSubscription = BackgroundGeolocation.onProviderChange((event: ProviderChangeEvent) => {
            const isAuthorized = event.enabled && this.isAuthorizedStatus(event.status);
            if ( LocationService.GetInstance().IsLocationReported() && !isAuthorized && this.mWasAuthorized) {
                GlobalAlert.ShowWarning(
                    'Location access is off, so team location sharing will not work until it is re-enabled in Settings.',
                    'Location disabled'
                );
            }
            this.mWasAuthorized = isAuthorized;
            //LocationService.GetInstance().UpdateProviderStatus(LocationProviderStatus.FromProviderChangeEvent(event));
        });
    }
    async Init(shouldReportLocation: boolean) {

        try {
            const state = await BackgroundGeolocation.ready({
                // Geolocation Config
                geolocation: {
                    activityType: BackgroundGeolocation.ActivityType.OtherNavigation,
                    desiredAccuracy: BackgroundGeolocation.DesiredAccuracy.Medium,
                    distanceFilter: 25,
                    stationaryRadius: 25,
                    stopTimeout: 30,
                    locationAuthorizationRequest: 'Always',
                    disableLocationAuthorizationAlert: true
                },
                // Logger Config
                logger: {
                    debug: false,
                    logLevel: BackgroundGeolocation.LogLevel.Warning,
                },
                // Application config
                app: {
                    heartbeatInterval: 7200,
                    notification: {
                        priority: 1,
                    },
                    enableHeadless: true,
                    stopOnTerminate: false,   // <-- Allow the background-service to continue tracking when user closes the app.
                    startOnBoot: true,        // <-- Auto start tracking when device is powered-up.
                    backgroundPermissionRationale: {
                        title: 'Allow {applicationName} to access location in the background?',
                        message: 'Background location tracking is used for team member location sharing.',
                        positiveAction: 'Change to Always',
                        negativeAction: 'Cancel',
                    },
                },
                // Http Config
                http: {
                    autoSync: true,
                    autoSyncThreshold: 0,
                    batchSync: true,          // <-- Sync locations to server in a single HTTP request.
                    rootProperty: '.',
                    url: APP_URLS.LOCATION_REPORT_URL,
                    headers: {
                        Authorization: `Bearer ${AuthToken.get() ?? ''}`,
                    },
                },
                activity: {
                    disableMotionActivityUpdates: false,
                    stopOnStationary: false,
                    disableStopDetection: false,
                    motionTriggerDelay: 30000,
                },
            });

            if (shouldReportLocation) {
                if (!state.enabled) await BackgroundGeolocation.start();
                // By now the OS permission prompt (if any) has been asked and answered, so this
                // read reflects the real, settled outcome — unlike the early getProviderState()
                // call above, which can still catch a NotDetermined state mid-prompt.
                const providerEvent = await BackgroundGeolocation.getProviderState();
                const providerStatus = LocationProviderStatus.FromProviderChangeEvent(providerEvent);
                //LocationService.GetInstance().UpdateProviderStatus(providerStatus);
                this.maybeShowInitialLocationWarning(providerStatus);
                
                LocationService.GetInstance().GetCurrentLocationAsync();
            } else if (state.enabled) {
                await BackgroundGeolocation.stop();
            }
        } catch (error: any) {
            if (!isLocationPermissionError(error)) {
                console.error('[LocationProvider] BackgroundGeolocation.ready failed', error);
                GlobalAlert.ShowError(error?.message ?? String(error), 'Start location report failed');
            } else {
                const deniedStatus = LocationProviderStatus.Denied();
                //LocationService.GetInstance().UpdateProviderStatus(deniedStatus);
                this.maybeShowInitialLocationWarning(deniedStatus);
            }
        }
        // Destroy() may have run while ready() was pending; don't leave a listener nobody can remove.
        if (this.mIsDestroyed) return;
        this.mUnsubscribeIsAppActive = SubscribeIsAppActive((isActive) => {
            if (!isActive) return;
            LocationService.GetInstance().GetCurrentLocationAsync();
        });
    }
    public Destroy() {
        this.mIsDestroyed = true;
        this.mUnsubscribeIsAppActive?.();
        this.mUnsubscribeIsAppActive = undefined;
        this.mOnHttpSubscription.remove();
        this.mOnLocationSubscription.remove();
        this.mOnHeartbeatSubscription.remove();
        this.mOnProviderChangeSubscription.remove();
    }
    private isAuthorizedStatus(status: number): boolean {
        return status === AuthorizationStatus.Always || status === AuthorizationStatus.WhenInUse;
    }
}