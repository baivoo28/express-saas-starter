import { uuid } from "../../lib/crypto.js";
import type { Page, UserRepository } from "./user.repository.js";
import type { NewUser, User, UserUpdate } from "./user.types.js";

/** In-memory implementation used by the test suite. Handy for prototyping too. */
export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();

  async findById(id: string) {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string) {
    const normalized = email.toLowerCase();
    for (const user of this.users.values()) if (user.email === normalized) return user;
    return null;
  }

  async create(data: NewUser) {
    const now = new Date();
    const user: User = {
      id: uuid(),
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role ?? "user",
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  async update(id: string, data: UserUpdate) {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async list(page: number, limit: number): Promise<Page<User>> {
    const all = [...this.users.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { items: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit };
  }
}
