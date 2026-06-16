import mongoose, { Document } from "mongoose";

export interface IPackageType extends Document {
  name: string;
  slug: string;
  icon: string;
  themeColor: string;
  description?: string;
  hasDifficultyLevels: boolean;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const packageTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    icon: {
      type: String,
      required: true,
    },
    themeColor: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: [/^#([0-9A-F]{6}|[0-9A-F]{3})$/, "Theme color must be a valid hex code (e.g. #10B981)"],
    },
    description: {
      type: String,
      trim: true,
    },
    hasDifficultyLevels: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

packageTypeSchema.index({ order: 1 });

export const PackageType = mongoose.model<IPackageType>(
  "PackageType",
  packageTypeSchema
);