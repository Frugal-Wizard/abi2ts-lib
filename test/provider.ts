import ganache, { EthereumProvider } from 'ganache';

interface Global {
    ethereum?: EthereumProvider;
}

const global = globalThis as Global;

export function setUpEthereumProvider() {
    if (!global.ethereum) {
        global.ethereum = ganache.provider({
            logging: {
                quiet: true,
            },
        });
    }
}

export function tearDownEthereumProvider() {
    delete global.ethereum;
}

export async function setAccountBalance(address: string, balance: bigint) {
    if (!global.ethereum) throw new Error('ethereum provider is not set up');
    await global.ethereum.request({ method: 'evm_setAccountBalance', params: [ address, `0x${balance.toString(16)}` ] });
}
