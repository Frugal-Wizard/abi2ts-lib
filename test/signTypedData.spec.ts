import { use, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ZERO_ADDRESS } from '../src/constants';
import { getAccounts, signTypedData } from '../src/provider';
import { digestTypedData, ecrecover } from '../src/utils';
import { setUpEthereumProvider, tearDownEthereumProvider } from './provider';

use(chaiAsPromised);

describe('signTypedData', () => {
    before(setUpEthereumProvider);
    after(tearDownEthereumProvider);

    it('should return valid signature', async function() {
        const [ account ] = await getAccounts();

        const domain = {
            name: 'Test',
            version: '1',
            chainId: 1337,
            verifyingContract: ZERO_ADDRESS,
        };

        const types = {
            Test: [
                { name: 'value', type: 'uint256' }
            ],
        };

        const data = {
            value: 1n
        };

        const signature = await signTypedData(account, domain, types, data);

        const digest = digestTypedData(domain, types, data);

        expect(ecrecover(digest, signature))
            .to.be.equal(account);
    });
});
