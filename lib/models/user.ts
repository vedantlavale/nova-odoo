import { model, models, Schema, type Model, type Types } from "mongoose";

import { USER_ROLES, type UserRole } from "@/lib/roles";

export interface User {
  companyId: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  title?: string;
  managerId?: Types.ObjectId | null;
  isActive: boolean;
  resetPasswordTokenHash?: string | null;
  resetPasswordExpiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<User>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 180,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: "employee",
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordTokenHash: {
      type: String,
      default: null,
    },
    resetPasswordExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ companyId: 1, email: 1 }, { unique: true });
userSchema.index({ companyId: 1, role: 1 });
userSchema.index({ companyId: 1, managerId: 1 });

export const UserModel: Model<User> =
  (models.User as Model<User>) || model<User>("User", userSchema);
