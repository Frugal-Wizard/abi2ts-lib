import { JsonFragment } from '@ethersproject/abi';
import * as ethers from 'ethers';
import { Address, CallOverrides } from './common-types';
import DefaultOverrides from './default-overrides';
import { decodeError } from './error-handler';
import { getProvider } from './provider';
import { Transaction } from './transaction-wrapper';

interface ContractClass<T> {
    new (contract: ethers.Contract): T;
    readonly ABI: ReadonlyArray<JsonFragment>;
    readonly BYTECODE: string;
}

export abstract class Contract {
    constructor(protected readonly _contract: ethers.Contract) {}

    protected static async _deploy<T>(this: ContractClass<T>, linkArgs: { [placeholder: string]: string }, ctorArgs: unknown[], overrides: CallOverrides) {
        try {
            const { from, ...overridesWithoutFrom } = { ...DefaultOverrides, ...overrides };
            const signer = getProvider().getSigner(await from);
            const bytecode = Object.entries(linkArgs).reduce((bytecode, [ placeholder, address ]) => bytecode.replaceAll(placeholder, address.slice(2)), this.BYTECODE);
            const factory = new ethers.ContractFactory(this.ABI, bytecode, signer);
            return new this((await (await factory.deploy(...ctorArgs, overridesWithoutFrom)).deployed()).connect(getProvider()));
        } catch (error) {
            throw decodeError(error);
        }
    }

    protected static async _deployStatic(this: ContractClass<unknown>, linkArgs: { [placeholder: string]: string }, ctorArgs: unknown[], overrides: CallOverrides) {
        try {
            const { from, ...overridesWithoutFrom } = { ...DefaultOverrides, ...overrides };
            const signer = getProvider().getSigner(await from);
            const bytecode = Object.entries(linkArgs).reduce((bytecode, [ placeholder, address ]) => bytecode.replaceAll(placeholder, address.slice(2)), this.BYTECODE);
            const factory = new ethers.ContractFactory(this.ABI, bytecode, signer);
            const deployTransaction = factory.getDeployTransaction(...ctorArgs, overridesWithoutFrom);
            return await signer.call(deployTransaction);
        } catch (error) {
            throw decodeError(error);
        }
    }

    protected static async _deployPopulateTransaction(this: ContractClass<unknown>, linkArgs: { [placeholder: string]: string }, ctorArgs: unknown[], overrides: CallOverrides) {
        try {
            const { from, ...overridesWithoutFrom } = { ...DefaultOverrides, ...overrides };
            const signer = getProvider().getSigner(await from);
            const bytecode = Object.entries(linkArgs).reduce((bytecode, [ placeholder, address ]) => bytecode.replaceAll(placeholder, address.slice(2)), this.BYTECODE);
            const factory = new ethers.ContractFactory(this.ABI, bytecode, signer);
            return factory.getDeployTransaction(...ctorArgs, overridesWithoutFrom);
        } catch (error) {
            throw decodeError(error);
        }
    }

    static at<T>(this: ContractClass<T>, address: Address): T {
        return new this(new ethers.Contract(address, this.ABI, getProvider()));
    }

    get address(): Address {
        return this._contract.address;
    }

    async getDeployTransaction(): Promise<Transaction> {
        return this._contract.deployTransaction && new Transaction(this._contract.deployTransaction, await this._contract.deployTransaction.wait());
    }

    protected async _call(method: string, args: unknown[], overrides: CallOverrides) {
        try {
            const { from, ...overridesWithoutFrom } = { ...DefaultOverrides, ...overrides };
            const signer = getProvider().getSigner(await from);
            const response = await this._contract.connect(signer)[method](...args, overridesWithoutFrom);
            return new Transaction(response, await response.wait());
        } catch (error) {
            throw decodeError(error);
        }
    }

    protected async _callStatic(method: string, args: unknown[], overrides: CallOverrides) {
        try {
            overrides = { ...DefaultOverrides, ...overrides };
            if (!overrides.from) [ overrides.from ] = await getProvider().listAccounts();
            return await this._contract.callStatic[method](...args, overrides);
        } catch (error) {
            throw decodeError(error);
        }
    }

    protected async _populateTransaction(method: string, args: unknown[], overrides: CallOverrides) {
        try {
            return await this._contract.populateTransaction[method](...args, overrides);
        } catch (error) {
            throw decodeError(error);
        }
    }

    protected async _estimateGas(method: string, args: unknown[], overrides: CallOverrides) {
        try {
            overrides = { ...DefaultOverrides, ...overrides };
            if (!overrides.from) [ overrides.from ] = await getProvider().listAccounts();
            return (await this._contract.estimateGas[method](...args, overrides)).toBigInt();
        } catch (error) {
            throw decodeError(error);
        }
    }

    protected static _encode(this: ContractClass<unknown>, method: string, args: unknown[]) {
        try {
            return new ethers.utils.Interface(this.ABI).encodeFunctionData(method, args);
        } catch (error) {
            throw decodeError(error);
        }
    }
}
