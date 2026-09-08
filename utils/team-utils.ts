import { APP_CONFIG } from "@/app.Impl/configs/app-config";

export default class TeamUtils {
    static ParseJoinCode(value: string): string {
        if ( value.startsWith(APP_CONFIG.BASE_TEAM_JOIN_LINK + "joinCode/")) {
            return value.substring((APP_CONFIG.BASE_TEAM_JOIN_LINK + "joinCode/").length).trim();
        }
        else return value.trim();
    }
    static IsValidJoinCode(value: string): boolean {
        return /^[a-zA-Z]+$/.test(value) && value.length >= 4 && value.length <= 8;
    }
}