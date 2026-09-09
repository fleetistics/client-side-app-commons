type SettingsListener = (settings: Record<string, any>) => void;
type PathListener = (value: any) => void;

/**
 * Last-known-good mirror of the resolved app-settings object (see appSettingsApi's
 * getRawClientAppUserSettings), kept outside Redux so non-React code (e.g. services
 * that read a setting once, off the render cycle) doesn't need a store reference.
 */
export class AppUserSettingsService {
    public static setAppUserSettings(settings: Record<string, any>) {
        this.mSettings = settings;
    }

    public static getAppUserSettings(): Record<string, any> {
        return this.mSettings;
    }

    public static notifyAll() {
        this.mListeners.forEach(listener => listener(this.mSettings));
    }

    public static notifyPathChanged(path: string) {
        this.mListeners.forEach(listener => listener(this.mSettings));
        this.mPathListeners.get(path)?.forEach(listener => listener(this.mSettings[path]));
    }

    public static Subscribe(listener: SettingsListener): () => void {
        this.mListeners.add(listener);
        return () => this.mListeners.delete(listener);
    }

    public static SubscribePath(path: string, listener: PathListener): () => void {
        if (!this.mPathListeners.has(path)) {
            this.mPathListeners.set(path, new Set());
        }
        this.mPathListeners.get(path)!.add(listener);
        return () => this.mPathListeners.get(path)?.delete(listener);
    }

    private static mSettings: Record<string, any> = {};
    private static mListeners: Set<SettingsListener> = new Set();
    private static mPathListeners: Map<string, Set<PathListener>> = new Map();
}
