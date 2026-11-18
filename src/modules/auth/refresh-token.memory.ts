import { uuid } from "../../lib/crypto.js";
import type { NewRefreshToken, RefreshTokenRecord, RefreshTokenRepository } from "./refresh-token.repository.js";

export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private tokens = new Map<string, RefreshTokenRecord>();

  async create(data: NewRefreshToken) {
    const record: RefreshTokenRecord = { ...data, id: uuid(), revokedAt: null };
    this.tokens.set(record.id, record);
    return record;
  }

  async findByHash(tokenHash: string) {
    for (const t of this.tokens.values()) if (t.tokenHash === tokenHash) return t;
    return null;
  }

  async revoke(id: string) {
    const t = this.tokens.get(id);
    if (t && !t.revokedAt) t.revokedAt = new Date();
  }

  async revokeFamily(family: string) {
    for (const t of this.tokens.values()) if (t.family === family && !t.revokedAt) t.revokedAt = new Date();
  }

  async revokeAllForUser(userId: string) {
    for (const t of this.tokens.values()) if (t.userId === userId && !t.revokedAt) t.revokedAt = new Date();
  }
}
