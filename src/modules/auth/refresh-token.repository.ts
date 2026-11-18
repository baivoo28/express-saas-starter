export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  /** All tokens created by rotating the same login share a family. */
  family: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export type NewRefreshToken = Omit<RefreshTokenRecord, "id" | "revokedAt">;

export interface RefreshTokenRepository {
  create(data: NewRefreshToken): Promise<RefreshTokenRecord>;
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revoke(id: string): Promise<void>;
  revokeFamily(family: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
