import { Schema, Types, model, type HydratedDocument } from "mongoose";
import type { NewRefreshToken, RefreshTokenRecord, RefreshTokenRepository } from "./refresh-token.repository.js";

interface RefreshTokenDoc {
  userId: Types.ObjectId;
  tokenHash: string;
  family: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

const refreshTokenSchema = new Schema<RefreshTokenDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    // TTL index: MongoDB deletes expired tokens automatically.
    expiresAt: { type: Date, required: true, expires: 0 },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const RefreshTokenModel = model<RefreshTokenDoc>("RefreshToken", refreshTokenSchema);

function toRecord(doc: HydratedDocument<RefreshTokenDoc>): RefreshTokenRecord {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    tokenHash: doc.tokenHash,
    family: doc.family,
    expiresAt: doc.expiresAt,
    revokedAt: doc.revokedAt,
  };
}

export class MongoRefreshTokenRepository implements RefreshTokenRepository {
  async create(data: NewRefreshToken) {
    return toRecord(await RefreshTokenModel.create(data));
  }

  async findByHash(tokenHash: string) {
    const doc = await RefreshTokenModel.findOne({ tokenHash });
    return doc ? toRecord(doc) : null;
  }

  async revoke(id: string) {
    await RefreshTokenModel.updateOne({ _id: id, revokedAt: null }, { revokedAt: new Date() });
  }

  async revokeFamily(family: string) {
    await RefreshTokenModel.updateMany({ family, revokedAt: null }, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string) {
    await RefreshTokenModel.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
  }
}
