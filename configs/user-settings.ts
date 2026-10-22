import { AppUserSettingsEnum } from "./user-settings-enum";

export class AppUserSettings {
    public static GetSettings() {
        const res = {} as any;
        res[AppUserSettingsEnum.isWeatherVisible] = true;
        res[AppUserSettingsEnum.mapType] = 'standard';
        res[AppUserSettingsEnum.mapZoomedType] = 'hybrid';


        return res;
    }
}