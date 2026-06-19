import mongoose from "mongoose";

export interface IGallery extends Document {
  subtitle: string;
  title: string;
  description: string;
  image: string;
  imagePublicId: string;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const gallerySchema= new mongoose.Schema(
    {
        subtitle:{
            type:String,
            required:true,
            trim:true
        },
        title:{
            type:String,
            required:true,
            trim:true
        },
        description:{
            type:String,
            required:true,
            trim:true,
        },
        image:{
            type:String,
            required:true
        },
        imagePublicId:{
            type:String,
            required:true
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

gallerySchema.index({order:1});

export const Gallery= mongoose.model<IGallery>("Gallery",gallerySchema);