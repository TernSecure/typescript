const ENCRYPTION_KEY = process.env.TERN_ENCRYPTION_KEY || "default-key-32-chars-exactly!!!!!"

// Simple encryption for cookie data
export function encrypt(text: string): string {
  const textBytes = new TextEncoder().encode(text)
  const encrypted = textBytes.map((byte, i) => byte ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
  return Buffer.from(encrypted).toString("base64url")
}

export function decrypt(encoded: string): string {
  const encrypted = Buffer.from(encoded, "base64url")
  const decrypted = new Uint8Array(encrypted).map(
    (byte, i) => byte ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length),
  )
  return new TextDecoder().decode(decrypted)
}
