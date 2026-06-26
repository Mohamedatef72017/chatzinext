import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { permissionModes, permissionValues } from "@/server/permissions/permissions";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 180,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["super-admin", "owner", "admin", "manager", "agent", "viewer"],
      default: "admin",
      index: true,
    },

    permissionMode: {
      type: String,
      enum: permissionModes,
      default: "role",
      index: true,
    },

    permissions: [
      {
        type: String,
        enum: permissionValues,
      },
    ],

    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    teams: [
      {
        type: Schema.Types.ObjectId,
        ref: "Team",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isSuperAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index(
  { tenantId: 1, email: 1 },
  { unique: true }
);

userSchema.index({
  tenantId: 1,
  role: 1,
  isActive: 1,
});

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User =
  (models.User as Model<UserDocument>) ||
  model<UserDocument>("User", userSchema);
