import mongoose, { Document } from "mongoose";

export interface ISocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
}

export interface ICompanyInfo extends Document {
  companyName: string;
  officeAddress: string;
  officeTelephone: string;
  emails: string[];
  phones: string[];
  description?: string;
  logo?: string;
  logoPublicId:string;
  socialLinks?: ISocialLinks;
  createdAt?: Date;
  updatedAt?: Date;
}

const socialLinksSchema = new mongoose.Schema<ISocialLinks>(
  {
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    twitter: { type: String, trim: true },
    youtube: { type: String, trim: true },
    tiktok: { type: String, trim: true },
  },
  { _id: false }
);

const companyInfoSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    officeAddress: {
      type: String,
      required: true,
      trim: true,
    },
    officeTelephone: {
      type: String,
      required: true,
      trim: true,
    },
    emails: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: string[]) => arr.length > 0 && arr.length <= 3,
        message: "You must provide between 1 and 3 email addresses",
      },
    },
    phones: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: string[]) => arr.length > 0 && arr.length <= 2,
        message: "You must provide between 1 and 2 phone numbers",
      },
    },
    description: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      required:true
    },
    logoPublicId:{
        type:String,
        required:true,
    },
    socialLinks: {
      type: socialLinksSchema,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const CompanyInfo = mongoose.model<ICompanyInfo>(
  "CompanyInfo",
  companyInfoSchema
);