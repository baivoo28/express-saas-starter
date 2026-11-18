import { createHash, randomBytes, randomUUID } from "node:crypto";

/** URL-safe random token, e.g. for refresh tokens or one-time links. */
export function randomToken(bytes = 48): string {
  return randomBytes(bytes).toString("base64url");
}

/** Tokens are stored hashed so a database leak doesn't leak usable sessions. */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export const uuid = randomUUID;
