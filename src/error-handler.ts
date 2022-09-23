// ethers.js does not handle errors from contracts other than the one being called
// and hides away the returned data.
// At this point it just would be better to handle everything directly instead of
// going through ethers' contract objects.

import * as ethers from 'ethers';

const { utils: { toUtf8Bytes, keccak256, hexDataSlice, defaultAbiCoder } } = ethers;

type BytesLike = ethers.BytesLike;

export abstract class ContractError extends Error {
    abstract get sig(): string | undefined;

    encode(): string {
        if (!this.sig) throw new Error('missing error signature');
        const sighash = getSighash(this.sig);
        const { types, encode } = errorRegistry[sighash] || {};
        return ethers.utils.hexConcat([ sighash, defaultAbiCoder.encode(types, encode(this)) ]);
    }
}

interface ErrorDefinition {
    sig: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    factory(...args: any[]): ContractError;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    encode(error: any): unknown[];
}

interface ErrorRegistry {
    [sighash: string]: {
        types: string[],
        factory: (...args: unknown[]) => ContractError,
        encode: (error: ContractError) => unknown[],
    };
}

const errorRegistry: ErrorRegistry = {};

function getSighash(sig: string) {
    return hexDataSlice(keccak256(toUtf8Bytes(sig)), 0, 4);
}

function extractTypes(sig: string) {
    const [ types ] = sig.match(/(?<=\().*(?=\))/) || [];
    return types ? types.split(',') : [];
}

export function registerError({ sig, factory, encode }: ErrorDefinition): void {
    const sighash = getSighash(sig);
    const types = extractTypes(sig);
    if (!errorRegistry[sighash]) {
        errorRegistry[sighash] = { types, factory, encode };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decodeError(error: any): unknown {
    try {
        if (error.errorSignature) {
            const { errorSignature, errorName, errorArgs } = error;
            const sighash = getSighash(errorSignature);
            const { factory } = errorRegistry[sighash] || {};
            if (factory) {
                return factory(...errorArgs);
            } else {
                return Object.assign(new Error(`${errorName}(${errorArgs.join(', ')})`), {
                    name: errorName,
                    args: errorArgs,
                });
            }

        } else if (error.error?.data) {
            const data = error.error.data.result ?? error.error.data;
            if (data == '0x') {
                return error;
            }
            return decodeErrorData(data);

        } else if (error.error?.results) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [ { return: data } ] = Object.values<any>(error.error.results);
            if (data == '0x') {
                return error;
            }
            return decodeErrorData(data);

        } else {
            return error;
        }

    } catch (decodingError) {
        console.error(decodingError);
        return error;
    }
}

export function decodeErrorData(data: unknown): unknown {
    const sighash = hexDataSlice(data as BytesLike, 0, 4);
    const { types, factory } = errorRegistry[sighash] || {};
    if (factory) {
        return factory(...defaultAbiCoder.decode(types, hexDataSlice(data as BytesLike, 4)));
    } else {
        return new UnknownError(data as string);
    }
}

export class UnknownError extends ContractError {
    get sig() {
        return undefined;
    }

    readonly data: string;

    constructor(data: string) {
        super(data);
        this.name = 'UnknownError';
        this.data = data;
    }
}

export class DefaultError extends ContractError {
    static readonly SIG = 'Error(string)';

    get sig() {
        return DefaultError.SIG;
    }

    readonly reason: string;

    constructor(reason: string) {
        super(reason);
        this.reason = reason;
    }
}

registerError({
    sig: DefaultError.SIG,
    factory(reason: string) {
        return new DefaultError(reason);
    },
    encode(error: DefaultError) {
        return [ error.reason ];
    },
});

export class Panic extends ContractError {
    static readonly SIG = 'Panic(uint256)';

    get sig() {
        return Panic.SIG;
    }

    readonly errorCode: bigint;

    constructor(errorCode: string) {
        super(String(errorCode));
        this.name = 'Panic';
        this.errorCode = BigInt(errorCode);
    }
}

registerError({
    sig: Panic.SIG,
    factory(errorCode: string) {
        return new Panic(errorCode);
    },
    encode(error: Panic) {
        return [ error.errorCode ];
    },
});
