import { ethers } from 'ethers';

let ethereum: ethers.providers.ExternalProvider;
let provider: ethers.providers.JsonRpcProvider | undefined;

export function getProvider(): ethers.providers.JsonRpcProvider {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalEthereum = (globalThis as any).ethereum;
    if (!provider || ethereum !== globalEthereum) {
        ethereum = globalEthereum;
        provider = new ethers.providers.Web3Provider(ethereum);
    }
    return provider;
}

export async function getAccounts(abortSignal?: AbortSignal): Promise<string[]> {
    try {
        return await getProvider().listAccounts();

    } finally {
        // eslint-disable-next-line no-unsafe-finally
        if (abortSignal?.aborted) throw abortSignal.reason;
    }
}

export async function getBlockNumber(abortSignal?: AbortSignal): Promise<number> {
    try {
        return await getProvider().getBlockNumber();

    } finally {
        // eslint-disable-next-line no-unsafe-finally
        if (abortSignal?.aborted) throw abortSignal.reason;
    }
}

export async function getBlockTimestamp(blockNumber?: number, abortSignal?: AbortSignal): Promise<number> {
    try {
        return (await getProvider().getBlock(blockNumber ?? 'latest')).timestamp;

    } finally {
        // eslint-disable-next-line no-unsafe-finally
        if (abortSignal?.aborted) throw abortSignal.reason;
    }
}

export async function getContractAddress(blockNumber: number, transactionIndex: number, abortSignal?: AbortSignal): Promise<string> {
    try {
        return (await (await getProvider().getBlockWithTransactions(blockNumber)).transactions[transactionIndex].wait()).contractAddress;

    } finally {
        // eslint-disable-next-line no-unsafe-finally
        if (abortSignal?.aborted) throw abortSignal.reason;
    }
}

export async function getBalance(address: string, abortSignal?: AbortSignal): Promise<bigint> {
    try {
        return (await getProvider().getBalance(address)).toBigInt();

    } finally {
        // eslint-disable-next-line no-unsafe-finally
        if (abortSignal?.aborted) throw abortSignal.reason;
    }
}

export async function getLogs(filter: ethers.providers.Filter, abortSignal?: AbortSignal) {
    try {
        return await getProvider().getLogs({ ...filter, fromBlock: filter.fromBlock ?? 0 });

    } finally {
        // eslint-disable-next-line no-unsafe-finally
        if (abortSignal?.aborted) throw abortSignal.reason;
    }
}

export async function predictContractAddress(from: string, nonceOffset = 0, abortSignal?: AbortSignal) {
    try {
        const nonce = await getProvider().getTransactionCount(from) + nonceOffset;
        return ethers.utils.getContractAddress({ from, nonce });

    } finally {
        // eslint-disable-next-line no-unsafe-finally
        if (abortSignal?.aborted) throw abortSignal.reason;
    }
}

export async function getStorageSlot(address: string, slot: string, abortSignal?: AbortSignal) {
    try {
        return await getProvider().getStorageAt(address, slot);

    } finally {
        // eslint-disable-next-line no-unsafe-finally
        if (abortSignal?.aborted) throw abortSignal.reason;
    }
}
