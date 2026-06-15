import mongoose, { Document, Types } from "mongoose";

export interface IDestination extends Document {
  name: string; 
  slug: string;
  description?: string;
  image?: string;
  packageTypes: Types.ObjectId[]; 
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const destinationSchema = new mongoose.Schema(
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
    description: {
      type: String,
      trim: true,
    },
    packageTypes: [
      {
        type: mongoose.Types.ObjectId,
        ref: "PackageType",
      },
    ],
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

destinationSchema.index({ packageTypes: 1 });
destinationSchema.index({ order: 1 });

export const Destination = mongoose.model<IDestination>(
  "Destination",
  destinationSchema
);