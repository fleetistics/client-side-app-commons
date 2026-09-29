import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, installApiMock, jsonResponse, renderHook } from '@test-utils';
import { makeStore } from '@/client-side.Commons/dataLayer/core/store';
import { getOutbox } from '@/client-side.Commons/dataLayer/outbox/outbox';
import { LocationService } from '@/app.Commons/services/location/locationService';
import { userApi, useSwitchUserPrivacyMode } from './myUserApi';

const PRIVACY_PATH = '/api/users/me/location-privacy';

const outboxes: ReturnType<typeof getOutbox>[] = [];
afterEach(() => {
  outboxes.splice(0).forEach((o) => o.stop());
  jest.restoreAllMocks();
});

describe('useSwitchUserPrivacyMode (offline-first)', () => {
  it('alternates on taps faster than a re-render, and queues only the final value', async () => {
    const setPrivateMode = jest.spyOn(LocationService, 'SetPrivateMode').mockImplementation(() => {});
    installApiMock({
      [`GET ${PRIVACY_PATH}`]: () => jsonResponse({ PrivacyMode: 0, LatestUpdate: 1 }),
      [`PATCH ${PRIVACY_PATH}`]: () => {
        throw new TypeError('Network request failed'); // phone is offline
      },
    });
    const store = makeStore({ autoBatch: false });
    const outbox = getOutbox(store);
    outboxes.push(outbox);
    const data = new Map<string, string>();
    await outbox.start({
      storage: { getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => void data.set(k, v) },
      getUserId: () => 7,
    });
    await store.dispatch(userApi.endpoints.getUserLocationPrivacy.initiate());

    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useSwitchUserPrivacyMode(), { wrapper });
    const toggle = result.current[2];

    // Three taps in one go - same render, nothing awaited in between.
    await act(async () => {
      const taps = [toggle(), toggle(), toggle()];
      await Promise.all(taps);
    });
    await outbox.flush();

    expect(setPrivateMode.mock.calls.map(([isPrivate]) => isPrivate)).toEqual([true, false, true]);
    const queued = store.getState().outbox.items.map((i) => i.args);
    expect(queued).toEqual([{ PrivacyMode: 1 }]);
    expect(userApi.endpoints.getUserLocationPrivacy.select()(store.getState()).data?.PrivacyMode).toBe(1);
  });
});
