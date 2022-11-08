// TODO move type-utils to its own package

export function isNumber(value: unknown): value is number {
    return typeof(value) == 'number';
}

export function isString(value: unknown): value is string {
    return typeof(value) == 'string';
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isObject(value: unknown): value is {} {
    return value !== null && typeof(value) == 'object';
}

export function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

export function hasProperty<T, K extends string | number | symbol>(
    value: T,
    key: K
): value is T & { [k in K]: unknown };

export function hasProperty<T, K extends string | number | symbol, P>(
    value: T,
    key: K,
    typeConstraint: (value: unknown) => value is P
): value is T & { [k in K]: P };

export function hasProperty<T, K extends string | number | symbol, P>(
    value: T,
    key: K,
    typeConstraint?: (value: unknown) => value is P
) {
    if (typeConstraint) {
        return hasProperty(value, key) && typeConstraint(value[key]);
    } else {
        return key in value;
    }
}
