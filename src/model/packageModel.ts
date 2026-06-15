import mongoose, { Document } from "mongoose";
import { DIFFICULTY_NAMES } from "../constants/difficulty";

export interface IPackageType extends Document {
  name: string; 
  slug: string;
  icon: string; 
  description?: string;
  hasDifficultyLevels: boolean; 
  order: number; 
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const packageDifficulty=["Beginner","Moderate","Challenging","Extreme"]

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
      unique:true,
    },
    icon: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    hasDifficultyLevels: {
      type: Boolean,
      default: false,
    },
    difficultyLevel:{
        type:String,
        enum:packageDifficulty,
        required:true,
    },
    difficulty: {
        type: String,
        enum: DIFFICULTY_NAMES,
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