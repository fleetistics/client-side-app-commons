import React, { useEffect, useRef } from 'react';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { AuthorizationStatus } from '@transistorsoft/background-geolocation-types';
import type { HttpEvent, HeartbeatEvent, Location, LocationError, ProviderChangeEvent, Subscription } from '@transistorsoft/background-geolocation-types';
import { AuthToken } from '@/client-side.Commons/dataLayer/apiSlice';
import { GlobalAlert } from '@/app.Commons/utils/global-alert';
import { LocationService, LocationProviderStatus, LocationProviderStatusEnum, isLocationPermissionError } from './locationService';
import { LOCATION_MESSAGES } from './location-messages';
import { SubscribeIsAppActive } from '../app-state-context';
import { APP_URLS } from '@/app.Impl/configs/app-urls';

// iOS's start() always resolves regardless of permission outcome (the plugin's native bridge
// never rejects it there), and even on Android a later revoke in system Settings doesn't
// reject anything at all — onProviderChange is the only cross-platform, ongoing signal for
// whether location access is actually authorized.
function isAuthorizedStatus(status: number): boolean {
    return status === AuthorizationStatus.Always || status === AuthorizationStatus.WhenInUse;
}

export function LocationProvider(props: { children: React.ReactNode, setIsLocationStarted?: (value: boolean) => void }) {
    const { setIsLocationStarted } = props;
    const wasAuthorizedRef = useRef(true);
    const hasShownInitialWarningRef = useRef(false);
    const nextAuthTokenUpdate = useRef(0);

    useEffect(() => {
        // Runs once per app start, after the OS permission prompt has actually been answered
        // (not the early getProviderState() call below, which can still read NotDetermined).
        const maybeShowInitialLocationWarning = (current: LocationProviderStatus) => {
            if (hasShownInitialWarningRef.current) return;
            hasShownInitialWarningRef.current = true;
            if (current.status === LocationProviderStatusEnum.Always) return;
            const { title, message } = current.status === LocationProviderStatusEnum.AppInUse
                ? LOCATION_MESSAGES.alwaysNotGranted
                : LOCATION_MESSAGES.notAvailable;
            GlobalAlert.ShowWarning(message, title);
        };

        BackgroundGeolocation.getProviderState()
            .then((event) => LocationService.GetInstance().UpdateProviderStatus(LocationProviderStatus.FromProviderChangeEvent(event)))
            .catch((error) => console.error('[LocationProvider] getProviderState failed', error));

        const onHttpSubscription: Subscription = BackgroundGeolocation.onHttp(async (response: HttpEvent) => {
            if (response.status !== 200) {
                if( response.status == 401) {
                    let curDate = new Date().getTime();
                    console.log(`[LocationProvider] onHttp 401 Unauthorized, updating auth token is needed ${(curDate > nextAuthTokenUpdate.current)} (curDate=${curDate}, nextAuthTokenUpdate=${nextAuthTokenUpdate.current})`);
                    
                    if(curDate > nextAuthTokenUpdate.current) {
                        nextAuthTokenUpdate.current = curDate + 60000; // update auth token every 60 seconds
                        await BackgroundGeolocation.setConfig({ http: { autoSync: true, url: APP_URLS.LOCATION_REPORT_URL, headers: {
                            Authorization: `Bearer ${AuthToken.get() ?? ''}`
                        } } });
                        console.log(`[LocationProvider] onHttp 401 Unauthorized, auth token updated`);
                        
                    }
                }                
                else {
                    console.warn('[LocationProvider] onHttp error', response);
                    BackgroundGeolocation.logger.error(`HTTP failed [${response.status}] [${response.responseText}]`);
                }
            }
        });
        const onLocationSubscription: Subscription = BackgroundGeolocation.onLocation((location: Location) => {
            LocationService.GetInstance().CheckAndUpdateLocation(location);
        }, (error: LocationError) => {
            console.error('[LocationProvider] onLocation error', error);
        });
        const onHeartbeatSubscription: Subscription = BackgroundGeolocation.onHeartbeat((event: HeartbeatEvent) => {
            BackgroundGeolocation.insertLocation({ ...event.location, event: 'Heartbeat' });
        });
        const onProviderChangeSubscription: Subscription = BackgroundGeolocation.onProviderChange((event: ProviderChangeEvent) => {
            const isAuthorized = event.enabled && isAuthorizedStatus(event.status);
            if (!isAuthorized && wasAuthorizedRef.current) {
                GlobalAlert.ShowWarning(
                    'Location access is off, so team location sharing will not work until it is re-enabled in Settings.',
                    'Location disabled'
                );
            }
            wasAuthorizedRef.current = isAuthorized;
            LocationService.GetInstance().UpdateProviderStatus(LocationProviderStatus.FromProviderChangeEvent(event));
        });

        BackgroundGeolocation.ready({
            // Geolocation Config
            geolocation: {
                activityType: BackgroundGeolocation.ActivityType.OtherNavigation,
                desiredAccuracy: BackgroundGeolocation.DesiredAccuracy.Medium,
                distanceFilter: 25,
                stationaryRadius: 25,
                stopTimeout: 30,
                locationAuthorizationRequest: 'Always',
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
                autoSync: false,  // it's important to disable autoSync on start, do not touch it
                autoSyncThreshold: 0,
                batchSync: true,          // <-- Sync locations to server in a single HTTP request.
                rootProperty: '.',
                url: '',
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
        }).then(async (state) => {
            const currentState = state.enabled ? state : await BackgroundGeolocation.start();

            // By now the OS permission prompt (if any) has been asked and answered, so this
            // read reflects the real, settled outcome — unlike the early getProviderState()
            // call above, which can still catch a NotDetermined state mid-prompt.
            const providerEvent = await BackgroundGeolocation.getProviderState();
            const providerStatus = LocationProviderStatus.FromProviderChangeEvent(providerEvent);
            LocationService.GetInstance().UpdateProviderStatus(providerStatus);
            maybeShowInitialLocationWarning(providerStatus);

            setIsLocationStarted?.(true);
            if (currentState.enabled) await LocationService.GetInstance().GetCurrentLocationAsync();
        }).catch((error: any) => {
            if (!isLocationPermissionError(error)) {
                console.error('[LocationProvider] BackgroundGeolocation.ready failed', error);
                GlobalAlert.ShowError(error?.message ?? String(error), 'Start location report failed');
            } else {
                const deniedStatus = LocationProviderStatus.Denied();
                LocationService.GetInstance().UpdateProviderStatus(deniedStatus);
                maybeShowInitialLocationWarning(deniedStatus);
            }
            setIsLocationStarted?.(true);
        });
        SubscribeIsAppActive((isActive) => {
            if (!isActive) return;
            LocationService.GetInstance().GetCurrentLocationAsync();
        });
        return () => {
            onHttpSubscription.remove();
            onLocationSubscription.remove();
            onHeartbeatSubscription.remove();
            onProviderChangeSubscription.remove();
        };
    }, [setIsLocationStarted]);

    return props.children;
}
