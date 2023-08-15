import { ethers } from 'ethers';
import { recursiveCastBigNumberToBigInt } from './internal-utils';

type IntegerSize = '' |
      '8' |  '16' |  '24' |  '32' |  '40' |  '48' |  '56' |  '64' |
     '72' |  '80' |  '88' |  '96' | '104' | '112' | '120' | '128' |
    '136' | '144' | '152' | '160' | '168' | '176' | '184' | '192' |
    '200' | '208' | '216' | '224' | '232' | '240' | '248' | '256';

type IntegerType = `${'uint' | 'int'}${IntegerSize}`;

type BytesSize = '' |
     '1' |  '2' |  '3' |  '4' |  '5' |  '6' |  '7' |  '8' |
     '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16' |
    '17' | '18' | '19' | '20' | '21' | '22' | '23' | '24' |
    '25' | '26' | '27' | '28' | '29' | '30' | '32' | '32';

type BytesType = `bytes${BytesSize}`;

type Trim<T extends string> = T extends ` ${infer A}` ? Trim<A> : T extends `${infer A} ` ? Trim<A> : T;

type TupleType<T extends string> =
    T extends `${infer A},${infer B}` ?
        [ ...TupleType<A>, ...TupleType<B> ] :
        [ TypeMap<Trim<T>> ];

type TypeMap<T extends string> =
    T extends IntegerType ? bigint :
    T extends BytesType   ? string :
    T extends 'bool'      ? boolean :
    T extends 'string'    ? string :
    T extends 'address'   ? string :
    T extends `${infer A}[]` ? TypeMap<A>[] :
    T extends `tuple(${infer A})` ? TupleType<A> :
    unknown;

type TypeArrayMap<T extends readonly string[]> =
    T extends readonly [] ? [] :
    T extends readonly [infer A extends string, ...infer B extends readonly string[]] ?
        [ TypeMap<A>, ...TypeArrayMap<B> ] :
        unknown[];

export function abidecode<T extends string>(type: T, data: string): TypeMap<T>;
export function abidecode<T extends readonly string[]>(types: T, data: string): TypeArrayMap<T>;
export function abidecode(types: string | readonly string[], data: string) {
    if (typeof types == 'string') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (recursiveCastBigNumberToBigInt(ethers.utils.defaultAbiCoder.decode([types], data)) as any)[0];
    } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return recursiveCastBigNumberToBigInt(ethers.utils.defaultAbiCoder.decode(types, data)) as any;
    }
}

export function abiencode(type: string, data: unknown): string;
export function abiencode(types: string[], data: unknown[]): string;
export function abiencode(types: string | string[], data: unknown | unknown[]) {
    if (typeof types == 'string') {
        return ethers.utils.defaultAbiCoder.encode([types], [data]);
    } else {
        return ethers.utils.defaultAbiCoder.encode(types, data as unknown[]);
    }
}

export function encodeCall(name: string, argTypes: string[], argValues: unknown[]): string {
    const selector = ethers.utils.hexDataSlice(ethers.utils.id(`${name}(${argTypes.join(',')})`), 0, 4);
    const encodedArgs = abiencode(argTypes, argValues);
    return ethers.utils.hexConcat([ selector, encodedArgs ]);
}
