import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';
import type { I18nPlatform } from '@/client-side.Commons/i18n/platform';

/**
 * React Native backing for client-side.Commons/i18n: AsyncStorage for the persisted language,
 * AppState for foreground/background — RN's closest match for the web adapter's
 * visibilitychange/focus. There's no separate "window focus" concept on mobile, so
 * onForeground fires only on the active-state transition.
 */
export const reactNativeI18nPlatform: I18nPlatform = {
  storage: {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
  },
  lifecycle: {
    onForeground(onRefresh) {
      const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
        if (state === 'active') {
          onRefresh();
        }
      });
      return () => subscription.remove();
    },
    onBackground(onHidden) {
      const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
        if (state === 'background' || state === 'inactive') {
          onHidden();
        }
      });
      return () => subscription.remove();
    },
  },
};
