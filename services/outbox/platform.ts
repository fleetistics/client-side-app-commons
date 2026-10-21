import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';
import type { OutboxPlatform } from '@/client-side.Commons/dataLayer/outbox/outboxTypes';
import { UserSessionContext } from '@/client-side.Commons/userSession/userSessionContext';

/**
 * React Native backing for client-side.Commons' outbox: AsyncStorage for the persisted queue,
 * the session's user id to scope it, and AppState's return-to-foreground as a send trigger
 * (the others - enqueue, app start, any successful request, backoff timer - are built in).
 */
export const reactNativeOutboxPlatform: OutboxPlatform = {
  storage: {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
  },
  // Unset until UserSessionProvider has a session; the outbox sends nothing before that.
  getUserId: () => UserSessionContext.UserId ?? undefined,
  onForeground(listener) {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') listener();
    });
    return () => subscription.remove();
  },
};
