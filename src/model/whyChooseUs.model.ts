import mongoose, { type Document } from "mongoose";

export interface IWhyChooseUs extends Document{
    title:string,
    description:string,
    icon:string,
    order:number,
    isActive:boolean,
    createdAt?:Date;
    updatedAt?:Date;
}

const whyChooseUsSchema= new mongoose.Schema(
    {
        title:{
            type:String,
            required:true,
            trim:true
        },
        description:{
                type:String,
                required:true,
                trim:true
        },
        icon:{
            type:String,
            required:true,
        },
        order:{
            type:Number,
            default:0
        },
        isActive:{
            type:Boolean,
            default:true
        }
    },
    {
        timestamps:true
    }
)

whyChooseUsSchema.index({ order:1});

export const WhyChooseUs = mongoose.model<IWhyChooseUs>(
    "WhyChooseUs",
    whyChooseUsSchema
)