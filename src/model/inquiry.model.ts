import mongoose from "mongoose";

export interface IInquiry extends Document {
    fullname:string,
    email:string,
    phone:string,
    subject:string,
    description:string
}

const inquirySchema= new mongoose.Schema(
    {
        fullname:{
            type:String,
            required:true,
            trim:true
        },
        email:{
            type:String,
            required:true,
            trim:true
        },
        phone:{
            type:String,
            required:true,
            trim:true
        },
        subject:{
            type:String,
            required:true,
            trim:true
        },
        description:{
            type:String,
            required:true,
            trim:true
        },
        isReplied:{
            type:Boolean,
            default:false,
        },
        repliedAt:{
            type:Date
        },
        replyMessage:{
            type:String,
            trim:true
        }
    },
    {
        timestamps:true
    }
)

inquirySchema.index({email:1});
inquirySchema.index({ isReplied: 1 });
inquirySchema.index({ createdAt: -1 });

export const Inquiry= mongoose.model<IInquiry>("Inquiry",inquirySchema) 