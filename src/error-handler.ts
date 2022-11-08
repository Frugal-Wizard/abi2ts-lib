// ethers.js does not handle errors from contracts other than the one being called
// and hides away the returned data.
// At this point it just would be better to handle everything directly instead of
// going through ethers' contract objects.

import * as ethers from 'ethers';
import { hasProperty, isArray, isNumber, isObject, isString } from './type-utils';

const { utils: { toUtf8Bytes, keccak256, hexDataSlice, defaultAbiCoder } } = ethers;

type BytesLike = ethers.BytesLike;

export class OutOfGas extends Error {
    constructor() {
        super('Out of gas');
        this.name = 'OutOfGas';
    }
}

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

interface EthersDecodedError {
    errorSignature: string;
    errorName: string;
    errorArgs: unknown[];
}

function isEthersDecodedError(error: unknown): error is EthersDecodedError {
    return isObject(error)
        && hasProperty(error, 'errorSignature', isString)
        && hasProperty(error, 'errorName', isString)
        && hasProperty(error, 'errorArgs', isArray);
}

function searchForError(error: unknown): unknown {
    if (!isObject(error)) return;
    if (
        hasProperty(error, 'message', isString) &&
        hasProperty(error, 'code', isNumber) &&
        hasProperty(error, 'data', isString)
    ) {
        if (
            error.message.includes('revert') &&
            /^0x[0-9a-fA-F]*$/.test(error.data)
        ) {
            return decodeErrorData(error.data);

        } else if (
            error.message.includes('out of gas')
        ) {
            return new OutOfGas();
        }
    }

    for (const value of Object.values(error)) {
        const error = searchForError(value);
        if (error) return error;
    }
}

export function decodeError(error: unknown): unknown {
    try {
        if (isEthersDecodedError(error)) {
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

        } else {
            return searchForError(error);
        }

    } catch (decodingError) {
        console.error(decodingError);
        return error;
    }
}

export function decodeErrorData(data: unknown): unknown {
    if (data == '0x') {
        return new RevertWithoutReason();
    }
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

export class RevertWithoutReason extends ContractError {
    get sig() {
        return undefined;
    }

    constructor() {
        super('RevertWithoutReason');
        this.name = 'RevertWithoutReason';
    }

    encode() {
        return '0x';
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
