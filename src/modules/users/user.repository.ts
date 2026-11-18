import type { NewUser, User, UserUpdate } from "./user.types.js";

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * The rest of the app only talks to this interface, never to Mongoose directly.
 * That keeps business logic testable (see the in-memory implementation) and
 * lets you swap the database without touching services or routes.
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
  update(id: string, data: UserUpdate): Promise<User | null>;
  list(page: number, limit: number): Promise<Page<User>>;
}
