
export function genIdentifierHash(text: string): string {
    const classRegex = /class\s+(\S+)\s+/;
    const textExec = classRegex.exec(text);
    if (!(textExec && textExec.length > 1)) {
        throw 'Invalid object to use as identifier hash!\n' + text;
    }
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const chr = text.charCodeAt(i);
        if (chr > 32) {
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
    }
    return `${textExec[1]}(${hash.toString()})`;
}