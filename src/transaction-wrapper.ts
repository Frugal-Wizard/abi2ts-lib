import * as ethers from 'ethers';
import { ContractEvent } from './event-handler';
import { getProvider } from './provider';

type TransactionResponse = ethers.providers.TransactionResponse;
type TransactionReceipt = ethers.providers.TransactionReceipt;

export class Transaction {
    static async get(hash: string, abortSignal?: AbortSignal) {
        try {
            const provider = getProvider();
            const receipt = await provider.waitForTransaction(hash);
            const response = await provider.getTransaction(hash);
            return new this(response, receipt);

        } finally {
            // eslint-disable-next-line no-unsafe-finally
            if (abortSignal?.aborted) throw abortSignal.reason;
        }
    }

    private readonly _response: TransactionResponse;

    private readonly _receipt: TransactionReceipt;

    constructor(response: TransactionResponse, receipt: TransactionReceipt) {
        this._response = response;
        this._receipt = receipt;
    }

    get events(): ContractEvent[] {
        const events = [];
        for (const log of this._receipt.logs) {
            events.push(ContractEvent.decode(log));
        }
        return events;
    }

    get contractAddress() {
        return this._receipt.contractAddress;
    }

    get transactionCost() {
        const gasUsed = this._receipt.gasUsed.toBigInt();
        const effectiveGasPrice = this._receipt.effectiveGasPrice.toBigInt();
        return gasUsed * effectiveGasPrice;
    }

    async wait(confirmations: number, abortSignal?: AbortSignal): Promise<void> {
        try {
            await this._response.wait(confirmations);

        } finally {
            // eslint-disable-next-line no-unsafe-finally
            if (abortSignal?.aborted) throw abortSignal.reason;
        }
    }
}
