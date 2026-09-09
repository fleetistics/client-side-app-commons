import React, { useEffect, useImperativeHandle, useRef } from "react";
import { View } from "react-native";
import { MapMarker, Marker } from "react-native-maps";
import Svg, { Circle, Polygon } from "react-native-svg";
import { Text } from "@/app.Commons/components/controls/text";

type UserMapMarkerProps = {
    color: string;
    lat: number;
    lng: number;
    showLabel?: boolean;
    showTriangle?: boolean;
    showAlert?: boolean;
    label: string;
    labelColor?: string;
    onPress?: () => void;
};

export const UserMapMarker = React.forwardRef<MapMarker, UserMapMarkerProps>(
    function UserMapMarker({ color, lat, lng, showLabel, showTriangle, showAlert, label, labelColor, onPress }, forwardedRef) {
        const markerRef = useRef<MapMarker>(null);
        useImperativeHandle(forwardedRef, () => markerRef.current!, []);

        // width is estimated from the label text once at mount and frozen from then on (lazy
        // initializer, never recomputed) — react-native-maps loses track of a marker's icon
        // whenever its rendered frame changes size (seen both as the dot offsetting after a
        // showLabel toggle and as the marker vanishing entirely when the label text itself
        // changed length), so the frame must stay a fixed size for the lifetime of the marker
        const [labelWidth] = React.useState(() => Math.min(200, Math.max(38, label.length * 6 + 40)));

        // tracksViewChanges is unsupported on iOS's default Apple Maps provider (Android and
        // iOS+Google-Maps only) — there the marker image is a one-time snapshot that only
        // refreshes via an explicit redraw() call, so force one on every visually-relevant change
        useEffect(() => { markerRef.current?.redraw(); }, [showLabel, showTriangle, showAlert, label, color, labelColor]);
        // container is 40px dot row + 24px label slot, reserved even when the label is hidden, so
        // marker height stays constant; the dot's own center sits at cy=26 within that 40px row
        const totalH = 40 + 24;
        const dotCenterY = 26;
        const anchorY = dotCenterY / totalH;
        // anchor (fractional) only takes effect on Android and iOS+Google Maps — react-native-maps'
        // iOS implementation for the default Apple Maps provider ignores it entirely and instead
        // honors centerOffset (in points), so both must be set to keep the dot's true center, not
        // the container's geometric center, pinned to the coordinate on every platform/provider
        const centerOffsetY = dotCenterY - totalH / 2;

        return (
            <Marker ref={markerRef}
                title={label}
                anchor={{ x: 0.5, y: anchorY }}
                centerOffset={{ x: 0, y: centerOffsetY }}
                tracksViewChanges={true}
                coordinate={{ latitude: lat, longitude: lng }}
                onCalloutPress={() => markerRef.current?.hideCallout()}
                onPress={() => {
                    markerRef.current?.hideCallout();
                    onPress?.();
                }}
            >
                <View style={{ flexDirection: 'column', alignItems: 'center', gap: 0, height: totalH, width: labelWidth }}>
                    {/* dot + triangle drawn as a single SVG so paint order (triangle first, dot on top)
                        is guaranteed on both iOS and Android — view-tree z-order is unreliable inside a map marker */}
                    <View style={{ width: 38, height: 40, justifyContent: 'center', alignItems: 'center' }}>
                        <Svg width={38} height={40}>
                            {(showTriangle || showAlert) && (
                                <Polygon
                                    points="19,0 0,38 38,38"
                                    fill={showAlert ? '#ff0000' : '#000'}
                                    stroke="#fff"
                                    strokeWidth={1}
                                    strokeLinejoin="round"
                                />
                            )}
                            {/* dot — drawn after the triangle so it sits on top; own fill for the dot colour */}
                            <Circle cx={19} cy={26} r={11} fill={color} stroke="#fff" strokeWidth={2.5} />
                        </Svg>
                    </View>
                    <View
                        style={{
                            position: 'absolute', top: 40, alignSelf: 'center',
                            opacity: showLabel ? 1 : 0,
                            backgroundColor: color,
                            paddingHorizontal: 10, paddingVertical: 2,
                            borderRadius: 20, borderWidth: 2.5, borderColor: '#fff',
                        }}>
                        <Text numberOfLines={1} style={{ color: labelColor ?? 'white', fontSize: 10 }}>
                            {label}
                        </Text>
                    </View>
                </View>
            </Marker>
        );
    }
);
