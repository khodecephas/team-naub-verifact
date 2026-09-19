/**
 * Client-side SHA-256 via the browser's native SubtleCrypto — no network
 * call, works fully offline. This is only ever the *local* baseline; the
 * server independently recalculates the hash from the received file and
 * that server value is what becomes authoritative.
 */
export async function sha256OfBlob(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);

    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}
