// TODO solidity-compiler-wrapper should provide a CLI command

import solc from '@frugal-wizard/solidity-compiler-wrapper';
import glob from 'glob';
import { mkdirSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';

const contractsDir = process.argv[2];
const outputDir = process.argv[3] ?? contractsDir;

for (const contractFile of glob.sync('**/*.sol', { cwd: contractsDir })) {
    console.log(`Compiling ${join(contractsDir, contractFile)}...`)
    const outputFile = join(outputDir, dirname(contractFile), `${basename(contractFile, '.sol')}.json`);
    mkdirSync(dirname(outputFile), { recursive: true });
    writeFileSync(
        outputFile,
        JSON.stringify(solc(contractsDir, contractFile, { optimizer: { enabled: true } }), null, 2)
    );
}
