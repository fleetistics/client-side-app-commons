import { Alert } from "react-native";
import { GlobalNavigate } from "./global-navigate";

export class GlobalAlert {
    public static ShowInfo(message: string, title?: string) {
        Alert.alert(
            title ?? 'Info',
            message,
            [
                {
                    text: 'Close'
                },
            ]
        );
    }
    public static ShowWarningQuestion(message: string, title?: string, clickTitle?: string, clickFunc?: () => void) {
        Alert.alert(
            title ?? 'Warning',
            message,
            [
                {
                    text: 'Close'
                },
                ...(clickTitle ? [{
                    text: clickTitle,
                    onPress: clickFunc
                }] : []),
            ]
        );
    }
    public static ShowWarning(message: string, title?: string) {
        Alert.alert(
            title ?? 'Warning',
            message,
            [
                {
                    text: 'Close'
                },
            ]
        );
    }
    public static ShowError(message: string, title?: string, retryFunc?: () => void) {
        Alert.alert(
            title ?? 'Error',
            message,
            [
                {
                    text: 'Close'
                },
                ...(retryFunc ? [{
                    text: 'Retry',
                    onPress: retryFunc
                }] : []),
                {
                    text: 'Report Issue',
                    onPress: () => GlobalNavigate('ReportIssuePage', { issueContext: message })
                },
            ]
        );
    }

}