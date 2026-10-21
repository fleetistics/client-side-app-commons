import Toast from 'react-native-toast-message';
import { IGlobalToast } from '@/client-side.Commons/lib/global-toast';

export class GlobalToastImpl implements IGlobalToast {
    public ShowError(message: string) {
        Toast.show({
            type: 'error',
            swipeable: true,
            onPress: () => Toast.hide(),
            text1: message
        });
    }
    public ShowWarning(message: string) {
        Toast.show({
            type: 'warning',
            swipeable: true,
            onPress: () => Toast.hide(),
            text1: message
        });
    }
    public ShowSuccess(message: string) {
        Toast.show({
            type: 'success',
            swipeable: true,
            onPress: () => Toast.hide(),
            text1: message
        });
    }
    public HideAll() {
        Toast.hide();
    }
}
