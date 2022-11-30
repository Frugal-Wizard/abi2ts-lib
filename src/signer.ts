import {  Wallet } from 'ethers';
import { UnsignedTransaction } from './common-types';
import { getProvider } from './provider';
import { Transaction } from './transaction-wrapper';

export interface Signer {
    readonly address: string;
    sendTransaction(tx: UnsignedTransaction, abortSignal?: AbortSignal): Promise<Transaction>;
}

export async function createSigner(privateKey?: string, abortSignal?: AbortSignal): Promise<Signer> {
    try {
        const wallet = privateKey ? new Wallet(privateKey, getProvider()) : Wallet.createRandom().connect(getProvider());
        return {
            address: await wallet.getAddress(),
            async sendTransaction(tx, abortSignal) {
                try {
                    const response = await wallet.sendTransaction(tx);
                    return new Transaction(response, await response.wait());

                } finally {
                    // eslint-disable-next-line no-unsafe-finally
                    if (abortSignal?.aborted) throw abortSignal.reason;
                }
            },
        };

    } finally {
        // eslint-disable-next-line no-unsafe-finally
        if (abortSignal?.aborted) throw abortSignal.reason;
    }
}
