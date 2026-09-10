import React, { useEffect, useImperativeHandle, useRef } from "react";
import { Animated, View } from "react-native";
import { MapMarker, Marker } from "react-native-maps";
import Svg, { Circle, Path, Polygon, Text as SvgText } from "react-native-svg";
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
        // refreshes via an explicit redraw() call, so force one on every visually-relevant change.
        // redraw() is deferred two animation frames: calling it synchronously in this effect races
        // the native UI thread's own layout/paint pass for the just-committed change (new SVG
        // shape, label opacity, etc.) — firing before that paint lands snapshots the marker
        // mid-transition, which is exactly the "partially redrawn icon" symptom seen when toggling
        // showLabel/showTriangle/showAlert. Two rAFs (one for this frame's commit to flush to the
        // native side, one for the native layout pass it triggers) reliably lands after that.
        useEffect(() => {
            let raf2: number | undefined;
            const raf1 = requestAnimationFrame(() => {
                raf2 = requestAnimationFrame(() => {
                    markerRef.current?.redraw();
                });
            });
            return () => {
                cancelAnimationFrame(raf1);
                if (raf2 !== undefined) cancelAnimationFrame(raf2);
            };
        }, [showLabel, showTriangle, showAlert, label, color, labelColor]);

        // alert badge pulsates while shown; tracksViewChanges is hardcoded true on the Marker
        // below, so the snapshot keeps re-rendering every frame (Android and iOS+Google Maps
        // only — iOS's default Apple Maps provider ignores it and renders a static one-time
        // snapshot, so the pulse won't be visible there)
        const pulseAnim = useRef(new Animated.Value(0)).current;
        useEffect(() => {
            if (!showAlert) return;
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                ])
            );
            loop.start();
            return () => loop.stop();
        }, [showAlert, pulseAnim]);
        const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
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
                <View testID="user-map-marker" style={{ flexDirection: 'column', alignItems: 'center', gap: 0, height: totalH, width: labelWidth }}>
                    {/* dot + triangle drawn as a single SVG so paint order (triangle first, dot on top)
                        is guaranteed on both iOS and Android — view-tree z-order is unreliable inside a map marker */}
                    <View style={{ width: 38, height: 40, justifyContent: 'center', alignItems: 'center' }}>
                        {/* alert replaces the standard dot entirely rather than overlaying it */}
                        {!showAlert && (
                            <Svg width={38} height={40}>
                                {showTriangle && (
                                    <Polygon
                                        points="19,0 0,38 38,38"
                                        fill="#000"
                                        stroke="#fff"
                                        strokeWidth={1}
                                        strokeLinejoin="round"
                                    />
                                )}
                                {/* dot — drawn after the triangle so it sits on top; own fill for the dot colour */}
                                <Circle cx={19} cy={26} r={11} fill={color} stroke="#fff" strokeWidth={2.5} />
                            </Svg>
                        )}
                        {showAlert && (
                            // centered on the same anchor point (19,26) as the dot, sized bigger; the whole
                            // badge (red triangle + white border + mark) pulsates with a slight scale change
                            <Animated.View
                                style={{
                                    position: 'absolute', left: -3, top: 4,
                                    width: 44, height: 44,
                                    transform: [{ scale: pulseScale }],
                                }}
                            >
                                <Svg width={44} height={44} viewBox="0 0 24 24">
                                    <Path
                                        d="M12 2 L23 22 L1 22 Z"
                                        fill="#ef4444"
                                        stroke="#ffffff"
                                        strokeWidth={2}
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                    />
                                    <SvgText x={12} y={18} textAnchor="middle" fill="#ffffff" fontSize={12} fontWeight="bold">!</SvgText>
                                </Svg>
                            </Animated.View>
                        )}
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
