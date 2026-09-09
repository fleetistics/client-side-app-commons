export default class ObjectUtils {
    /** Copies every own enumerable property of `source` onto `target`, overwriting matching keys, and returns `target`. */
    public static extendEntity<T extends Record<string, any>>(source: Record<string, any> | undefined | null, target: T): T {
        if (source) {
            Object.keys(source).forEach(key => {
                (target as Record<string, any>)[key] = source[key];
            });
        }
        return target;
    }
}
