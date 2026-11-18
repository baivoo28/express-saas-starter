import { Schema, model, type HydratedDocument } from "mongoose";
import type { Page, UserRepository } from "./user.repository.js";
import { ROLES, type NewUser, type User, type UserUpdate } from "./user.types.js";

interface UserDoc {
  email: string;
  name: string;
  passwordHash: string;
  role: (typeof ROLES)[number];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: "user", index: true },
  },
  { timestamps: true },
);

export const UserModel = model<UserDoc>("User", userSchema);

function toUser(doc: HydratedDocument<UserDoc>): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    passwordHash: doc.passwordHash,
    role: doc.role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const isObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

export class MongoUserRepository implements UserRepository {
  async findById(id: string) {
    if (!isObjectId(id)) return null;
    const doc = await UserModel.findById(id);
    return doc ? toUser(doc) : null;
  }

  async findByEmail(email: string) {
    const doc = await UserModel.findOne({ email: email.toLowerCase() });
    return doc ? toUser(doc) : null;
  }

  async create(data: NewUser) {
    return toUser(await UserModel.create(data));
  }

  async update(id: string, data: UserUpdate) {
    if (!isObjectId(id)) return null;
    const doc = await UserModel.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true });
    return doc ? toUser(doc) : null;
  }

  async list(page: number, limit: number): Promise<Page<User>> {
    const [docs, total] = await Promise.all([
      UserModel.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      UserModel.countDocuments(),
    ]);
    return { items: docs.map(toUser), total, page, limit };
  }
}
