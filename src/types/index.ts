// src/types/index.ts
import mongoose from "mongoose";
import type { IAuth } from "../model/auth.model";

export interface userTokenDetails {
  _id: mongoose.Types.ObjectId;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: userTokenDetails;
      user?:IAuth;
    }
  }
}

export {};