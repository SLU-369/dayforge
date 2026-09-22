export interface Sha256Hasher {
  digestUtf8(value: string): Promise<string>;
}

export class WebCryptoSha256Hasher implements Sha256Hasher {
  private readonly subtle: SubtleCrypto;

  constructor(subtle: SubtleCrypto = globalThis.crypto.subtle) {
    this.subtle = subtle;
  }

  async digestUtf8(value: string) {
    const digest = await this.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
}
