import request from "supertest";
import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";
import { InMemoryRefreshTokenRepository } from "../src/modules/auth/refresh-token.memory.js";
import { InMemoryUserRepository } from "../src/modules/users/user.memory.js";

export function setup() {
  const env = loadEnv({ NODE_ENV: "test", JWT_ACCESS_SECRET: "test-secret-that-is-at-least-32-characters-long" });
  const users = new InMemoryUserRepository();
  const refreshTokens = new InMemoryRefreshTokenRepository();
  const app = createApp({ env, users, refreshTokens });
  const api = request(app);

  async function registerUser(overrides: Partial<{ email: string; password: string; name: string }> = {}) {
    const body = { email: "ana@example.com", password: "supersecret123", name: "Ana", ...overrides };
    const res = await api.post("/api/auth/register").send(body).expect(201);
    return res.body as { accessToken: string; refreshToken: string; user: { id: string; email: string } };
  }

  return { env, users, refreshTokens, app, api, registerUser };
}
