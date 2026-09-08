import { StackActions } from '@react-navigation/native';
import type { NavigatorPages } from '../../navigator/pages-config';
import { navigationRef } from '../../navigator/navigation-ref';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
]);
export function GlobalNavigate(name: keyof NavigatorPages, params?: any) {
    if (navigationRef.isReady()) {
        // @ts-ignore
        navigationRef.navigate(name, params);
    }

}
export function GlobalNavigateByString(name: string, params?: any) {
    if (navigationRef.isReady()) {
        // @ts-ignore
        navigationRef.navigate(name, params);
    }

}
export function GlobalNavigateBack() {
    if (navigationRef.isReady()) {
        if (navigationRef.canGoBack()) navigationRef.goBack();
        else navigationRef.dispatch(StackActions.replace('RootPage'));
    }
}
export function GetCurrentRoute() {
    if (navigationRef.isReady()) {
        return navigationRef.getCurrentRoute();
    }
}