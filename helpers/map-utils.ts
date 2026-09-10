import { Platform } from "react-native";
import { LatLng } from "react-native-maps";

export class MapUtils {
    public static FocusOnDelta: number = 0.02;

    public static MaxLatitudeDeltaForType: number = 0.007;

    public static ZoomToPoint(lat: number, lng: number): LatLng[] {
        return [{ latitude: lat - 0.004, longitude: lng - 0.004 }, { latitude: lat + 0.004, longitude: lng + 0.004 }];
    }
    public static ZoomToPointWide(lat: number, lng: number): LatLng[] {
        return [{ latitude: lat - 0.05, longitude: lng - 0.05 }, { latitude: lat + 0.05, longitude: lng + 0.05 }];
    }
    public static GetOpenInMapsUrl(lat: number, lng: number, label?: string): string {
        const query = label ? encodeURIComponent(label) : `${lat},${lng}`;
        return Platform.OS === 'ios'
            ? `maps:0,0?q=${query}@${lat},${lng}`
            : `geo:${lat},${lng}?q=${lat},${lng}(${query})`;
    }
}