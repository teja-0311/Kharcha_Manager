import mongoose, { Schema, Document, Model } from "mongoose";
import { connectUsersDB } from "@/lib/db";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      maxlength: 255,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export async function getUserModel(): Promise<Model<IUser>> {
  const conn = await connectUsersDB();
  return (conn.models.User as Model<IUser>) || conn.model<IUser>("User", UserSchema);
}
