import * as ethers from 'ethers';
import { ContractEvent } from './event-handler';

type TransactionResponse = ethers.providers.TransactionResponse;
type TransactionReceipt = ethers.providers.TransactionReceipt;

export class Transaction {
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

    async wait(confirmations: number): Promise<void> {
        await this._response.wait(confirmations);
    }
}
