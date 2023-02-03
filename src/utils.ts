import * as ethers from 'ethers';
import { recursiveCastBigIntToString, recursiveCastBigNumberToBigInt } from './internal-utils';

export function parseValue(value: string | number, decimals = 18) {
    return ethers.utils.parseUnits(String(value), decimals).toBigInt();
}

export function formatValue(value: bigint, decimals = 18) {
    return ethers.utils.formatUnits(value, decimals);
}

export function abiencode(types: string[], data: unknown[]) {
    return ethers.utils.defaultAbiCoder.encode(types, data);
}

export function abidecode(types: string[], data: string): unknown {
    return recursiveCastBigNumberToBigInt(ethers.utils.defaultAbiCoder.decode(types, data));
}

export function encodeCall(name: string, argTypes: string[], argValues: unknown[]): string {
    const selector = ethers.utils.hexDataSlice(ethers.utils.id(`${name}(${argTypes.join(',')})`), 0, 4);
    const encodedArgs = abiencode(argTypes, argValues);
    return ethers.utils.hexConcat([ selector, encodedArgs ]);
}

export function digestTypedData(
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    data: Record<string, unknown>
) {
    return ethers.utils._TypedDataEncoder.hash(
        domain,
        types,
        recursiveCastBigIntToString(data) as Record<string, unknown>
    );
}

export function ecrecover(digest: string, signature: string) {
    return ethers.utils.recoverAddress(digest, signature);
}
