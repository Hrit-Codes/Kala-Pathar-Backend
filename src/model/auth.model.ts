import mongoose, {Document} from "mongoose";
import argon2 from "argon2";

export type UserRole="admin";

export interface IAuth extends Document{
    name:string,
    email:string,
    password:string,
    role:UserRole,
    isActive:boolean,
    comparePassword(candidPassword: string): Promise<boolean>;
    createdAt?:Date;
    updatedAt?:Date
}

const authSchema= new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            trim:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        password:{
            type:String,
            required:true,
            select:false,
        },
        role:{
            type:String,
            enum:["admin"],
            default:"admin"
        },
        isActive:{
            type:Boolean,
            default:true
        },
        refresh_token:{
            type:String
        },
    }
)

// Hash password before saving, but only if it changed
authSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await argon2.hash(this.password);
});

// Instance method to verify a login password against the stored hash
authSchema.methods.comparePassword=async function(candidPassword:string):Promise<boolean>{
    return argon2.verify(this.password, candidPassword);
};

export const Auth= mongoose.model<IAuth>("Auth", authSchema);