import * as ethers from 'ethers';

export function recursiveCastBigNumberToBigInt(data: unknown): unknown {
    if (ethers.BigNumber.isBigNumber(data)) {
        return data.toBigInt();

    } else if (Array.isArray(data)) {
        return data.map(recursiveCastBigNumberToBigInt);

    } else if (data instanceof Object) {
        return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, recursiveCastBigNumberToBigInt(v)]));

    } else {
        return data;
    }
}

export function recursiveCastBigIntToString(data: unknown): unknown {
    if (typeof(data) == 'bigint') {
        return String(data);

    } else if (Array.isArray(data)) {
        return data.map(recursiveCastBigIntToString);

    } else if (data instanceof Object) {
        return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, recursiveCastBigIntToString(v)]));

    } else {
        return data;
    }
}
