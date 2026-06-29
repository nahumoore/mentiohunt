import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

const ENV_KEY = "EMAIL_CRED_SECRET"
const ALGORITHM = "aes-256-gcm"

function getKey(): Buffer {
  const secret = process.env[ENV_KEY]
  if (!secret) {
    throw new Error(
      `Missing env var ${ENV_KEY}. Set it to any string (will be SHA-256 hashed to a 32-byte key).`
    )
  }
  return createHash("sha256").update(secret).digest()
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a colon-joined base64 string: `iv:authTag:ciphertext`.
 */
export function encryptSecret(plain: string): string {
  const key = getKey()
  const iv = randomBytes(12) // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":")
}

/**
 * Decrypt a payload produced by `encryptSecret`.
 * Throws if the payload is malformed or the key/authTag doesn't match.
 */
export function decryptSecret(payload: string): string {
  const key = getKey()
  const parts = payload.split(":")
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new Error("Invalid encrypted payload format.")
  }
  const iv = Buffer.from(parts[0], "base64")
  const authTag = Buffer.from(parts[1], "base64")
  const encrypted = Buffer.from(parts[2], "base64")
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}
