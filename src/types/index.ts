import mongoose, { Types } from "mongoose";

export interface userTokenDetails {
  _id: mongoose.Types.ObjectId;
  role: string;
}