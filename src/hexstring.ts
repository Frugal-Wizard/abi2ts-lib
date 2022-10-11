export function hexstring(value: bigint | number): string {
    return `0x${value.toString(16)}`;
}

export function hexstringPad(hexstring: string, padding: number): string {
    const missing = padding - (hexstring.length - 2);
    if (missing <= 0) return hexstring;
    return `0x${'0'.repeat(missing)}${hexstring.slice(2)}`;
}
