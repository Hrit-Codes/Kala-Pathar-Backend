import mongoose, { Document } from "mongoose";

export interface IAffiliationItem {
  _id:mongoose.Types.ObjectId;
  abbreviation: string;
  name: string;
  logo: string;
  logoPublicId: string;
  logoLocalPath:string;
  logoLocalUrl:string;
  order: number;
}

export interface IPartnerSection extends Document {
  sectionTitle: string;
  sectionTagline: string;
  affiliations: IAffiliationItem[];
  badges: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const affiliationItemSchema = new mongoose.Schema<IAffiliationItem>(
  {
    abbreviation: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      required: true,
    },
    logoPublicId: {
      type: String,
      required: true,
    },
    logoLocalPath:{
      type:String,
      required:true,
    },
    logoLocalUrl:{
      type:String,
      required:true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const partnerSectionSchema = new mongoose.Schema(
  {
    sectionTitle: {
      type: String,
      required: true,
      trim: true,
    },
    sectionTagline: {
      type: String,
      required: true,
      trim: true,
    },
    affiliations: {
      type: [affiliationItemSchema],
      default: [],
      validate: {
        validator: (arr: IAffiliationItem[]) => arr.length <= 5,
        message: "A maximum of 5 affiliation entries are allowed",
      },
    },
    badges: {
        type: [String],
        default: [],
        validate: {
            validator: (arr: string[]) => arr.length >= 2 && arr.length <= 6,
            message: "Between 2 and 6 badges are required",
        },
    },
  },
  {
    timestamps: true,
  }
);

export const PartnerSection = mongoose.model<IPartnerSection>(
  "PartnerSection",
  partnerSectionSchema
);