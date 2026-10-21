// Set once, synchronously, from App.tsx's initialProps (see MainActivity.kt's
// getLaunchOptions() override) before any child screen mounts. Only ever true when the app was
// launched by Detox with `launchArgs: { e2eMockMap: 'true' }` — absent in every real build.
let e2eModeEnabled = false;

export function setE2EMode(enabled: boolean): void {
    e2eModeEnabled = enabled;
}

export function isE2EMode(): boolean {
    return e2eModeEnabled;
}

// Fixed coordinate the E2E suite drives the map to, so the user marker renders at a
// deterministic screen position instead of wherever the device's real GPS fix happens to be.
export const E2E_MOCK_LOCATION = { Lat: 37.4219999, Lng: -122.0840575 };
