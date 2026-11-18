export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export type NewUser = Pick<User, "email" | "name" | "passwordHash"> & Partial<Pick<User, "role">>;
export type UserUpdate = Partial<Pick<User, "name" | "passwordHash" | "role">>;

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

/** Never send passwordHash (or any other internal field) to the client. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
