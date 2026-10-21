import { Alert } from 'react-native';
import { IGlobalAlert } from '@/client-side.Commons/lib/global-alert';
import { GlobalNavigate } from '@/client-side.Impl/utils/global-navigate-app';

export class GlobalAlertImpl implements IGlobalAlert {
    public ShowInfo(message: string, title?: string) {
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
    public ShowWarningQuestion(message: string, title?: string, clickTitle?: string, clickFunc?: () => void) {
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
    public ShowWarning(message: string, title?: string) {
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
    public ShowError(message: string, title?: string, retryFunc?: () => void, closeFunc?: () => void) {
        Alert.alert(
            title ?? 'Error',
            message,
            [
                {
                    text: 'Close',
                    onPress: closeFunc
                },
                ...(retryFunc ? [{
                    text: 'Retry',
                    onPress: retryFunc
                }] : []),
                {
                    text: 'Report Issue',
                    onPress: () => GlobalNavigate('ReportIssuePage', { issueContext: message })
                },
            ],
            // With a close handler the alert must only end through a button, otherwise an Android
            // tap-outside / back press would dismiss it without running closeFunc.
            closeFunc ? { cancelable: false } : undefined
        );
    }
}
