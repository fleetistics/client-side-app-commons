import { AppState } from "react-native";



export type AppStateListener = (isAppActive: boolean) => void;

var mIsAppActive = true;
var mIsAppInited = false;
var mIsAppActiveIListeners: AppStateListener[] = [];
var mAppStateSubscription: any = null;
var mAppIsActiveDelayTimer: ReturnType<typeof setTimeout> | null = null;
const onAppStateChanged = (nextAppState: string) => {
    console.log(`AppStateContext::onAppStateChanged nextAppState [${nextAppState}] mIsAppActive ${mIsAppActive} mAppIsActiveDelayTimer ${mAppIsActiveDelayTimer == null}`);
    if (nextAppState === 'active') {
        if (!mIsAppActive) {
            mIsAppActive = true;
            if (mAppIsActiveDelayTimer) clearTimeout(mAppIsActiveDelayTimer);
            mAppIsActiveDelayTimer = setTimeout(() => {
                mAppIsActiveDelayTimer = null;
                if (mIsAppActive) {
                    mIsAppActiveIListeners.forEach(l => l(true));
                    //WeatherManager.GetInstance().CheckAndRefresh();
                }
            }, 1000);
        }
    } else {
        if (mAppIsActiveDelayTimer) {
            clearTimeout(mAppIsActiveDelayTimer);
            mAppIsActiveDelayTimer = null;
        }
        if (mIsAppActive) {
            mIsAppActive = false;
            mIsAppActiveIListeners.forEach(l => l(false));
            //WeatherManager.GetInstance().StopRefreshing();
        }
    }
};

export function InitAppStateListener() {
    mAppStateSubscription = AppState.addEventListener('change', onAppStateChanged);
    
    setTimeout(() => {
        console.log(`AppStateContext::InitAppStateListener - marked as Inited after timeout`);
        mIsAppInited = true;
    }, 15000);
}
export function GetIsAppActive() {
    return mIsAppActive;
}
export function GetIsAppInited() {
    return mIsAppInited;
}

export function SubscribeIsAppActive(listener: AppStateListener) {
    //console.log(`AppStateContext::SubscribeIsAppActive ln: ${mIsAppActiveIListeners.length}`);
    mIsAppActiveIListeners.push(listener);
}