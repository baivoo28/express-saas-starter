import type { Env } from "../../config/env.js";
import { randomToken, sha256, uuid } from "../../lib/crypto.js";
import { AppError } from "../../lib/errors.js";
import type { UserRepository } from "../users/user.repository.js";
import { toPublicUser, type PublicUser, type User } from "../users/user.types.js";
import { signAccessToken } from "./access-token.js";
import { DUMMY_HASH, hashPassword, verifyPassword } from "./password.js";
import type { RefreshTokenRepository } from "./refresh-token.repository.js";

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export interface AuthServiceDeps {
  env: Pick<Env, "JWT_ACCESS_SECRET" | "ACCESS_TOKEN_TTL" | "REFRESH_TOKEN_TTL_DAYS">;
  users: UserRepository;
  refreshTokens: RefreshTokenRepository;
}

export class AuthService {
  constructor(private readonly deps: AuthServiceDeps) {}

  async register(input: { email: string; password: string; name: string }): Promise<AuthResult> {
    const existing = await this.deps.users.findByEmail(input.email);
    if (existing) throw AppError.conflict("An account with this email already exists");

    const user = await this.deps.users.create({
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
    });
    return this.issueTokens(user, uuid());
  }

  async login(input: { email: string; password: string }): Promise<AuthResult> {
    const user = await this.deps.users.findByEmail(input.email);
    const ok = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw AppError.unauthorized("Invalid email or password");
    return this.issueTokens(user, uuid());
  }

  /**
   * Refresh token rotation with reuse detection:
   * every refresh returns a new token and revokes the old one. If a revoked
   * token is ever presented again, someone copied it, so the whole family
   * (that login session) is revoked.
   */
  async refresh(refreshToken: string): Promise<AuthResult> {
    const record = await this.deps.refreshTokens.findByHash(sha256(refreshToken));
    if (!record) throw AppError.unauthorized("Invalid refresh token");

    if (record.revokedAt) {
      await this.deps.refreshTokens.revokeFamily(record.family);
      throw AppError.unauthorized("Refresh token reuse detected; session revoked");
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw AppError.unauthorized("Refresh token expired");
    }

    const user = await this.deps.users.findById(record.userId);
    if (!user) throw AppError.unauthorized("Invalid refresh token");

    await this.deps.refreshTokens.revoke(record.id);
    return this.issueTokens(user, record.family);
  }

  async logout(refreshToken: string): Promise<void> {
    const record = await this.deps.refreshTokens.findByHash(sha256(refreshToken));
    if (record) await this.deps.refreshTokens.revokeFamily(record.family);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.deps.refreshTokens.revokeAllForUser(userId);
  }

  private async issueTokens(user: User, family: string): Promise<AuthResult> {
    const { env } = this.deps;
    const refreshToken = randomToken();
    await this.deps.refreshTokens.create({
      userId: user.id,
      tokenHash: sha256(refreshToken),
      family,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    });
    return {
      user: toPublicUser(user),
      accessToken: signAccessToken({ sub: user.id, role: user.role }, env.JWT_ACCESS_SECRET, env.ACCESS_TOKEN_TTL),
      refreshToken,
    };
  }
}
