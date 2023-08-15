import * as ethers from 'ethers';
import { recursiveCastBigIntToString } from './internal-utils';

export function parseValue(value: string | number, decimals = 18) {
    return ethers.utils.parseUnits(String(value), decimals).toBigInt();
}

export function formatValue(value: bigint, decimals = 18) {
    return ethers.utils.formatUnits(value, decimals);
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
