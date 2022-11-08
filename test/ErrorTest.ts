import artifact from './artifacts/ErrorTest.json';
import { BigNumberish } from '../src/common-types';
import { ContractError, registerError } from '../src/error-handler';
import { getProvider } from '../src/provider';
import { ContractFactory } from 'ethers';

export async function deployErrorTest() {
    const signer = getProvider().getSigner();
    return await ContractFactory.fromSolidity(artifact.ErrorTest, signer).deploy();
}

export class NoArgsError extends ContractError {
    static readonly SIG = 'NoArgsError()';

    get sig() {
        return NoArgsError.SIG;
    }

    constructor() {
        super(`NoArgsError()`);
        this.name = 'NoArgsError';
    }
}

registerError({
    sig: NoArgsError.SIG,
    factory: () => new NoArgsError(),
    encode: () => [],
});

export class OneArgUint256Error extends ContractError {
    static readonly SIG = 'OneArgUint256Error(uint256)';

    get sig() {
        return OneArgUint256Error.SIG;
    }

    readonly uint256Arg: bigint;

    constructor(uint256Arg: bigint) {
        super(`OneArgUint256Error(${uint256Arg})`);
        this.name = 'OneArgUint256Error';
        this.uint256Arg = uint256Arg;
    }
}

registerError({
    sig: OneArgUint256Error.SIG,
    factory: (uint256Arg: BigNumberish) => new OneArgUint256Error(BigInt(String(uint256Arg))),
    encode: (error: OneArgUint256Error) => [ error.uint256Arg ],
});

export class OneArgStringError extends ContractError {
    static readonly SIG = 'OneArgStringError(string)';

    get sig() {
        return OneArgStringError.SIG;
    }

    readonly stringArg: string;

    constructor(stringArg: string) {
        super(`OneArgStringError(${stringArg})`);
        this.name = 'OneArgStringError';
        this.stringArg = stringArg;
    }
}

registerError({
    sig: OneArgStringError.SIG,
    factory: (stringArg: string) => new OneArgStringError(stringArg),
    encode: (error: OneArgStringError) => [ error.stringArg ],
});
