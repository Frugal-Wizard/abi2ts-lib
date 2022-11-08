import { use, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { decodeError, decodeErrorData, DefaultError, OutOfGas, RevertWithoutReason } from '../src/error-handler';
import { deployErrorTest, NoArgsError, OneArgStringError, OneArgUint256Error } from './ErrorTest';
import { setUpEthereumProvider, tearDownEthereumProvider } from './provider';

use(chaiAsPromised);

// TODO more tests for error-handler module

describe('error', () => {
    before(setUpEthereumProvider);
    after(tearDownEthereumProvider);

    describe('functions that revert', () => {
        describe('function that reverts with default error', () => {
            it('should revert with expected error', async () => {
                const contract = await deployErrorTest();
                await expect(contract.callStatic.revertWithDefaultError())
                    .to.be.rejectedWith(Error)
                    .that.eventually.satisfies((error: Error) => {
                        expect(decodeError(error))
                            .to.be.instanceOf(DefaultError)
                            .that.has.property('reason', 'error');
                        return true;
                    });
            });
        });

        describe('function that reverts without reason', () => {
            it('should revert with expected error', async () => {
                const contract = await deployErrorTest();
                await expect(contract.callStatic.revertWithoutReason())
                    .to.be.rejectedWith(Error)
                    .that.eventually.satisfies((error: Error) => {
                        expect(decodeError(error))
                            .to.be.instanceOf(RevertWithoutReason);
                        return true;
                    });
            });
        });

        describe('function that reverts with no args error', () => {
            it('should revert with expected error', async () => {
                const contract = await deployErrorTest();
                await expect(contract.callStatic.revertWithNoArgsError())
                    .to.be.rejectedWith(Error)
                    .that.eventually.satisfies((error: Error) => {
                        expect(decodeError(error))
                            .to.be.instanceOf(NoArgsError);
                        return true;
                    });
            });
        });

        describe('function that reverts with one arg (uint256) error', () => {
            it('should revert with expected error', async () => {
                const contract = await deployErrorTest();
                await expect(contract.callStatic.revertWithOneArgUint256Error())
                    .to.be.rejectedWith(Error)
                    .that.eventually.satisfies((error: Error) => {
                        expect(decodeError(error))
                            .to.be.instanceOf(OneArgUint256Error)
                            .that.has.property('uint256Arg', 1n);
                        return true;
                    });
            });
        });

        describe('function that reverts with one arg (string) error', () => {
            it('should revert with expected error', async () => {
                const contract = await deployErrorTest();
                await expect(contract.callStatic.revertWithOneArgStringError())
                    .to.be.rejectedWith(Error)
                    .that.eventually.satisfies((error: Error) => {
                        expect(decodeError(error))
                            .to.be.instanceOf(OneArgStringError)
                            .that.has.property('stringArg', 'error');
                        return true;
                    });
            });
        });
    });

    describe('other errors', () => {
        describe('call without enough gas', () => {
            it('should revert with expected error', async () => {
                const contract = await deployErrorTest();
                await expect(contract.callStatic.revertWithDefaultError({ gasLimit: 1 }))
                    .to.be.rejectedWith(Error)
                    .that.eventually.satisfies((error: Error) => {
                        expect(decodeError(error))
                            .to.be.instanceOf(OutOfGas);
                        return true;
                    });
            });
        });
    });

    describe('encode', () => {
        describe('default error', () => {
            it('should encode correctly', () => {
                const error = decodeErrorData(new DefaultError('error').encode());
                expect(error)
                    .to.be.instanceOf(DefaultError)
                    .that.has.property('reason', 'error');
            });
        });

        describe('revert without reason', () => {
            it('should encode correctly', () => {
                const error = decodeErrorData(new RevertWithoutReason().encode());
                expect(error)
                    .to.be.instanceOf(RevertWithoutReason);
            });
        });

        describe('no args error', () => {
            it('should encode correctly', () => {
                const error = decodeErrorData(new NoArgsError().encode());
                expect(error)
                    .to.be.instanceOf(NoArgsError);
            });
        });

        describe('one arg (uint256) error', () => {
            it('should encode correctly', () => {
                const error = decodeErrorData(new OneArgUint256Error(1n).encode());
                expect(error)
                    .to.be.instanceOf(OneArgUint256Error)
                    .that.has.property('uint256Arg', 1n);
            });
        });

        describe('one arg (uint256) error', () => {
            it('should encode correctly', () => {
                const error = decodeErrorData(new OneArgStringError('error').encode());
                expect(error)
                    .to.be.instanceOf(OneArgStringError)
                    .that.has.property('stringArg', 'error');
            });
        });
    });
});
