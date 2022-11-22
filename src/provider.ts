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

export async function getAccounts(): Promise<string[]> {
    return await getProvider().listAccounts();
}

export async function getBlockNumber(): Promise<number> {
    return await getProvider().getBlockNumber();
}

export async function getBlockTimestamp(blockNumber?: number): Promise<number> {
    return (await getProvider().getBlock(blockNumber ?? 'latest')).timestamp;
}

export async function getContractAddress(blockNumber: number, transactionIndex: number): Promise<string> {
    return (await (await getProvider().getBlockWithTransactions(blockNumber)).transactions[transactionIndex].wait()).contractAddress;
}

export async function getBalance(address: string): Promise<bigint> {
    return (await getProvider().getBalance(address)).toBigInt();
}

export async function getLogs(filter: ethers.providers.Filter) {
    return await getProvider().getLogs({ ...filter, fromBlock: filter.fromBlock ?? 0 });
}

export async function predictContractAddress(from: string, nonceOffset = 0) {
    const nonce = await getProvider().getTransactionCount(from) + nonceOffset;
    return ethers.utils.getContractAddress({ from, nonce });
}

export async function getStorageSlot(address: string, slot: string) {
    return await getProvider().getStorageAt(address, slot);
}
