import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { setup } from "./helpers.js";

describe("users", () => {
  it("requires a valid access token", async () => {
    const { api } = setup();
    await api.get("/api/users/me").expect(401);
    await api.get("/api/users/me").set("Authorization", "Bearer garbage").expect(401);
  });

  it("rejects tokens signed with another secret", async () => {
    const { api, registerUser } = setup();
    const { user } = await registerUser();
    const forged = jwt.sign({ sub: user.id, role: "admin" }, "attacker-secret-attacker-secret-attacker");
    await api.get("/api/users/me").set("Authorization", `Bearer ${forged}`).expect(401);
  });

  it("returns and updates the current user", async () => {
    const { api, registerUser } = setup();
    const { accessToken } = await registerUser();
    const auth = { Authorization: `Bearer ${accessToken}` };

    const me = await api.get("/api/users/me").set(auth).expect(200);
    expect(me.body.user.name).toBe("Ana");

    const updated = await api.patch("/api/users/me").set(auth).send({ name: "Ana María" }).expect(200);
    expect(updated.body.user.name).toBe("Ana María");
  });

  it("changes the password", async () => {
    const { api, registerUser } = setup();
    const { accessToken } = await registerUser();
    const auth = { Authorization: `Bearer ${accessToken}` };

    await api.post("/api/users/me/password").set(auth).send({ currentPassword: "nope", newPassword: "brandnewpass1" }).expect(400);
    await api
      .post("/api/users/me/password")
      .set(auth)
      .send({ currentPassword: "supersecret123", newPassword: "brandnewpass1" })
      .expect(204);
    await api.post("/api/auth/login").send({ email: "ana@example.com", password: "brandnewpass1" }).expect(200);
  });

  it("only lets admins list users", async () => {
    const { api, registerUser, users } = setup();
    const regular = await registerUser();
    await api.get("/api/users").set("Authorization", `Bearer ${regular.accessToken}`).expect(403);

    const admin = await registerUser({ email: "admin@example.com" });
    await users.update(admin.user.id, { role: "admin" });
    // Role lives in the access token, so log in again to get an admin token.
    const login = await api.post("/api/auth/login").send({ email: "admin@example.com", password: "supersecret123" });

    const res = await api.get("/api/users?limit=1").set("Authorization", `Bearer ${login.body.accessToken}`).expect(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).not.toHaveProperty("passwordHash");
  });

  it("returns JSON 404 for unknown routes", async () => {
    const { api } = setup();
    const res = await api.get("/api/nope").expect(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
