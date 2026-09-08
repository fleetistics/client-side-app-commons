import Toast from 'react-native-toast-message';
export class GlobalToast {
    public static ShowError(message: string) {
        Toast.show({
            type: 'error',
            swipeable: true,
            onPress: () => Toast.hide(),            text1: message
        });
    }
    public static ShowWarning(message: string) {
        Toast.show({
            type: 'warning',
            swipeable: true,
            onPress: () => Toast.hide(),
            text1: message
        });
    }
    public static ShowSuccess(message: string) {
        Toast.show({
            type: 'success',
            swipeable: true,
            onPress: () => Toast.hide(),
            text1: message
        });
    }
    public static HideAll() {
        Toast.hide();
    }
}