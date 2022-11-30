import * as ethers from 'ethers';
import { getLogs } from './provider';

type Log = ethers.providers.Log;

interface EventRegistry {
    [topic: string]: { new(log: Log): ContractEvent },
}

const eventRegistry: EventRegistry = {};

interface ContractEventFilter {
    address?: string;
    fromBlock?: number;
    toBlock?: number;
    events?: { TOPIC: string }[];
}

export abstract class ContractEvent {
    abstract get sig(): string | undefined;

    abstract get name(): string | undefined;

    constructor(protected readonly log: Log) {}

    get address() {
        return this.log.address;
    }

    get blockNumber() {
        return this.log.blockNumber;
    }

    get blockHash() {
        return this.log.blockHash;
    }

    get transactionHash() {
        return this.log.transactionHash;
    }

    get transactionIndex() {
        return this.log.transactionIndex;
    }

    get logIndex() {
        return this.log.logIndex;
    }

    get data() {
        return this.log.data;
    }

    get topics() {
        return this.log.topics;
    }

    protected get decodedLog() {
        const fragment = ethers.utils.Fragment.from(this.sig as string) as ethers.utils.EventFragment;
        return new ethers.utils.Interface([ fragment ]).decodeEventLog(fragment, this.log.data, this.log.topics);
    }

    static register(event: { TOPIC: string, new(log: Log): ContractEvent }): void {
        if (!eventRegistry[event.TOPIC]) {
            eventRegistry[event.TOPIC] = event;
        }
    }

    static decode(log: Log): ContractEvent {
        if (eventRegistry[log.topics[0]]) {
            return new eventRegistry[log.topics[0]](log);
        } else {
            return new UnknownEvent(log);
        }
    }

    static async * get(filter: ContractEventFilter, abortSignal?: AbortSignal): AsyncIterable<ContractEvent> {
        for (const log of await getLogs({
            address: filter.address,
            fromBlock: filter.fromBlock,
            toBlock: filter.toBlock,
            topics: [ filter.events?.map(({ TOPIC }) => TOPIC) ?? null ],
        }, abortSignal)) {
            yield this.decode(log);
        }
    }
}

export class UnknownEvent extends ContractEvent {
    get sig() {
        return undefined;
    }

    get name() {
        return undefined;
    }

    get data() {
        return this.log.data;
    }

    get topics() {
        return this.log.topics;
    }
}
