import { JsonFragment } from '@ethersproject/abi';
import * as ethers from 'ethers';
import { Address, CallOverrides } from './common-types';
import DefaultOverrides from './default-overrides';
import { decodeError } from './error-handler';
import { getAccounts, getProvider } from './provider';
import { Transaction } from './transaction-wrapper';

interface ContractClass<T> {
    new (contract: ethers.Contract): T;
    readonly ABI: ReadonlyArray<JsonFragment>;
    readonly BYTECODE: string;
}

export type CallOptions = CallOverrides & {
    abortSignal?: AbortSignal;
};

export abstract class Contract {
    constructor(protected readonly _contract: ethers.Contract) {}

    protected static async _deploy<T>(this: ContractClass<T>, linkArgs: { [placeholder: string]: string }, ctorArgs: unknown[], options: CallOptions) {
        const { from, abortSignal, ...rest } = { ...DefaultOverrides, ...options };
        try {
            const signer = getProvider().getSigner(await from);
            const bytecode = Object.entries(linkArgs).reduce((bytecode, [ placeholder, address ]) => bytecode.replaceAll(placeholder, address.slice(2)), this.BYTECODE);
            const factory = new ethers.ContractFactory(this.ABI, bytecode, signer);
            return new this((await (await factory.deploy(...ctorArgs, rest)).deployed()).connect(getProvider()));

        } catch (error) {
            throw decodeError(error);

        } finally {
            // eslint-disable-next-line no-unsafe-finally
            if (abortSignal?.aborted) throw abortSignal.reason;
        }
    }

    protected static async _deploySendTransaction<T>(this: ContractClass<T>, linkArgs: { [placeholder: string]: string }, ctorArgs: unknown[], options: CallOptions) {
        const { from, abortSignal, ...rest } = { ...DefaultOverrides, ...options };
        try {
            const signer = getProvider().getSigner(await from);
            const bytecode = Object.entries(linkArgs).reduce((bytecode, [ placeholder, address ]) => bytecode.replaceAll(placeholder, address.slice(2)), this.BYTECODE);
            const factory = new ethers.ContractFactory(this.ABI, bytecode, signer);
            return (await factory.deploy(...ctorArgs, rest)).deployTransaction.hash;

        } catch (error) {
            throw decodeError(error);

        } finally {
            // eslint-disable-next-line no-unsafe-finally
            if (abortSignal?.aborted) throw abortSignal.reason;
        }
    }

    protected static async _deployStatic(this: ContractClass<unknown>, linkArgs: { [placeholder: string]: string }, ctorArgs: unknown[], options: CallOptions) {
        const { from, abortSignal, ...rest } = { ...DefaultOverrides, ...options };
        try {
            const signer = getProvider().getSigner(await from);
            const bytecode = Object.entries(linkArgs).reduce((bytecode, [ placeholder, address ]) => bytecode.replaceAll(placeholder, address.slice(2)), this.BYTECODE);
            const factory = new ethers.ContractFactory(this.ABI, bytecode, signer);
            const deployTransaction = factory.getDeployTransaction(...ctorArgs, rest);
            return await signer.call(deployTransaction);

        } catch (error) {
            throw decodeError(error);

        } finally {
            // eslint-disable-next-line no-unsafe-finally
            if (abortSignal?.aborted) throw abortSignal.reason;
        }
    }

    protected static async _deployPopulateTransaction(this: ContractClass<unknown>, linkArgs: { [placeholder: string]: string }, ctorArgs: unknown[], options: CallOptions) {
        const { from, abortSignal, ...rest } = { ...DefaultOverrides, ...options };
        try {
            const signer = getProvider().getSigner(await from);
            const bytecode = Object.entries(linkArgs).reduce((bytecode, [ placeholder, address ]) => bytecode.replaceAll(placeholder, address.slice(2)), this.BYTECODE);
            const factory = new ethers.ContractFactory(this.ABI, bytecode, signer);
            return factory.getDeployTransaction(...ctorArgs, rest);

        } catch (error) {
            throw decodeError(error);

        } finally {
            // eslint-disable-next-line no-unsafe-finally
            if (abortSignal?.aborted) throw abortSignal.reason;
        }
    }

    static at<T>(this: ContractClass<T>, address: Address): T {
        return new this(new ethers.Contract(address, this.ABI, getProvider()));
    }

    get address(): Address {
        return this._contract.address;
    }

    async getDeployTransaction(abortSignal?: AbortSignal): Promise<Transaction> {
        try {
            return this._contract.deployTransaction && new Transaction(this._contract.deployTransaction, await this._contract.deployTransaction.wait());

        } finally {
            // eslint-disable-next-line no-unsafe-finally
            if (abortSignal?.aborted) throw abortSignal.reason;
        }
    }

    protected async _call(method: string, args: unknown[], options: CallOptions) {
        const { from, abortSignal, ...rest } = { ...DefaultOverrides, ...options };
        try {
            const signer = getProvider().getSigner(await from);
            const response = await this._contract.connect(signer)[method](...args, rest);
            return new Transaction(response, await response.wait());

        } catch (error) {
            throw decodeError(error);

        } finally {
            // eslint-disable-next-line no-unsafe-finally
            if (abortSignal?.aborted) throw abortSignal.reason;
        }
    }

    protected async _sendTransaction(method: string, args: unknown[], options: CallOptions) {
        const { from, abortSignal, ...overridesWithoutFrom } = { ...DefaultOverrides, ...options };
        try {
            const signer = getProvider().getSigner(await from);
            const response = await this._contract.connect(signer)[method](...args, overridesWithoutFrom);
            return response.hash;

        } catch (error) {
            throw decodeError(error);

        } finally {
            // eslint-disable-next-line no-unsafe-finally
            if (abortSignal?.aborted) throw abortSignal.reason;
        }
    }

    protected async _callStatic(method: string, args: unknown[], options: CallOptions) {
        const { abortSignal, ...rest } = { ...DefaultOverrides, ...options };
        try {
            if (!rest.from) [ rest.from ] = await getAccounts();
            return await this._contract.callStatic[method](...args, rest);

        } catch (error) {
            throw decodeError(error);

        } finally {
            // eslint-disable-next-line no-unsafe-finally
            if (abortSignal?.aborted) throw abortSignal.reason;
        }
    }

    protected async _populateTransaction(method: string, args: unknown[], options: CallOptions) {
        const { abortSignal, ...rest } = { ...DefaultOverrides, ...options };
        try {
            return await this._contract.populateTransaction[method](...args, rest);

        } catch (error) {
            throw decodeError(error);

        } finally {
            // eslint-disable-next-line no-unsafe-finally
            if (abortSignal?.aborted) throw abortSignal.reason;
        }
    }

    protected async _estimateGas(method: string, args: unknown[], options: CallOptions) {
        const { abortSignal, ...rest } = { ...DefaultOverrides, ...options };
        try {
            if (!rest.from) [ rest.from ] = await getAccounts();
            return (await this._contract.estimateGas[method](...args, rest)).toBigInt();

        } catch (error) {
            throw decodeError(error);

        } finally {
            // eslint-disable-next-line no-unsafe-finally
            if (abortSignal?.aborted) throw abortSignal.reason;
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
