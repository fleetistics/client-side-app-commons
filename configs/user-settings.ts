import { AppCommonUserSettingsEnum } from "./app-user-settings-enums";

export class AppCommonUserSettings {
    public static GetSettings() {
        const res = {} as any;
        res[AppCommonUserSettingsEnum.isWeatherVisible] = true;
        res[AppCommonUserSettingsEnum.mapType] = 'standard';
        res[AppCommonUserSettingsEnum.mapZoomedType] = 'hybrid';


        return res;
    }
}