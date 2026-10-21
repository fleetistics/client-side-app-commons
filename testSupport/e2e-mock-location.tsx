import { useEffect } from 'react';
import { useAppDispatch } from '@/client-side.Commons/dataLayer/core/hooks';
import { locationAcquired } from '@/app.Commons/dataLayer/api/other/locationApi';
import { E2E_MOCK_LOCATION } from '@/app.Commons/testSupport/e2e-mode';

// Rendered only under Detox (see App.tsx / isE2EMode()). Real GPS fixes are unreliable/slow on a
// test device (indoors, no last-known fix yet), so the marker the E2E map tests assert on would
// otherwise never appear. This seeds Redux with a fixed coordinate instead, independent of the
// real location provider.
export function E2EMockLocation(): null {
    const dispatch = useAppDispatch();
    useEffect(() => {
        dispatch(locationAcquired(E2E_MOCK_LOCATION));
    }, [dispatch]);
    return null;
}
