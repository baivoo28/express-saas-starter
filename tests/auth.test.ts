import { describe, expect, it } from "vitest";
import { setup } from "./helpers.js";

describe("auth", () => {
  it("registers a user and never leaks the password hash", async () => {
    const { registerUser } = setup();
    const body = await registerUser({ email: "  Ana@Example.com " });
    expect(body.user.email).toBe("ana@example.com");
    expect(body.accessToken).toBeTypeOf("string");
    expect(body.refreshToken).toBeTypeOf("string");
    expect(JSON.stringify(body)).not.toContain("passwordHash");
  });

  it("rejects duplicate emails with 409", async () => {
    const { api, registerUser } = setup();
    await registerUser();
    const res = await api
      .post("/api/auth/register")
      .send({ email: "ana@example.com", password: "anotherpass1", name: "Ana 2" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("validates input", async () => {
    const { api } = setup();
    const res = await api.post("/api/auth/register").send({ email: "not-an-email", password: "short", name: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { path: string }) => d.path).sort()).toEqual(["email", "name", "password"]);
  });

  it("returns 400 on malformed JSON", async () => {
    const { api } = setup();
    const res = await api.post("/api/auth/login").set("Content-Type", "application/json").send("{bad json");
    expect(res.status).toBe(400);
  });

  it("logs in with correct credentials only", async () => {
    const { api, registerUser } = setup();
    await registerUser();
    await api.post("/api/auth/login").send({ email: "ana@example.com", password: "supersecret123" }).expect(200);
    const wrong = await api.post("/api/auth/login").send({ email: "ana@example.com", password: "wrongpass" });
    expect(wrong.status).toBe(401);
    const unknown = await api.post("/api/auth/login").send({ email: "nobody@example.com", password: "whatever1" });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error.message).toBe(wrong.body.error.message);
  });

  it("rotates refresh tokens", async () => {
    const { api, registerUser } = setup();
    const { refreshToken } = await registerUser();
    const res = await api.post("/api/auth/refresh").send({ refreshToken }).expect(200);
    expect(res.body.refreshToken).not.toBe(refreshToken);
    expect(res.body.accessToken).toBeTypeOf("string");
  });

  it("detects refresh token reuse and revokes the whole session", async () => {
    const { api, registerUser } = setup();
    const { refreshToken: stolen } = await registerUser();
    const rotated = (await api.post("/api/auth/refresh").send({ refreshToken: stolen }).expect(200)).body.refreshToken;

    // Attacker replays the old token -> rejected, and the session is killed.
    await api.post("/api/auth/refresh").send({ refreshToken: stolen }).expect(401);
    // The legitimate user's newer token no longer works either.
    await api.post("/api/auth/refresh").send({ refreshToken: rotated }).expect(401);
  });

  it("logout revokes the refresh token", async () => {
    const { api, registerUser } = setup();
    const { refreshToken } = await registerUser();
    await api.post("/api/auth/logout").send({ refreshToken }).expect(204);
    await api.post("/api/auth/refresh").send({ refreshToken }).expect(401);
  });

  it("logout-all revokes every session of the user", async () => {
    const { api, registerUser } = setup();
    const first = await registerUser();
    const second = (await api.post("/api/auth/login").send({ email: "ana@example.com", password: "supersecret123" })).body;
    await api.post("/api/auth/logout-all").set("Authorization", `Bearer ${first.accessToken}`).expect(204);
    await api.post("/api/auth/refresh").send({ refreshToken: first.refreshToken }).expect(401);
    await api.post("/api/auth/refresh").send({ refreshToken: second.refreshToken }).expect(401);
  });

  it("rejects expired refresh tokens", async () => {
    const { api, registerUser, refreshTokens } = setup();
    const { refreshToken } = await registerUser();
    const { sha256 } = await import("../src/lib/crypto.js");
    const record = await refreshTokens.findByHash(sha256(refreshToken));
    record!.expiresAt = new Date(Date.now() - 1000);
    await api.post("/api/auth/refresh").send({ refreshToken }).expect(401);
  });
});
