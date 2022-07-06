import {  Wallet } from 'ethers';
import { UnsignedTransaction } from './common-types';
import { getProvider } from './provider';
import { Transaction } from './transaction-wrapper';

export interface Signer {
    readonly address: string;
    sendTransaction(tx: UnsignedTransaction): Promise<Transaction>;
}

export async function createSigner(privateKey?: string): Promise<Signer> {
    const wallet = privateKey ? new Wallet(privateKey, getProvider()) : Wallet.createRandom().connect(getProvider());
    return {
        address: await wallet.getAddress(),
        async sendTransaction(tx) {
            const response = await wallet.sendTransaction(tx);
            return new Transaction(response, await response.wait());
        },
    };
}
