import mongoose, { Document } from "mongoose";

export type TextAlignment = "left" | "center" | "right";
export type MediaType = "image" | "video";

export interface IHeroSection extends Document {
    eyebrow: string;
    brandName: string;
    headingLine1: string;
    headingLine2: string;
    description: string;
    primaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonText: string;
    secondaryButtonLink?: string;

    // Media
    mediaType: MediaType;
    mediaUrl: string;
    mediaPublicId: string;
    mediaLocalPath: string;
    mediaLocalUrl: string;

    // Layout
    textAlignment: TextAlignment;

    // Overlay
    overlayColor: string;   // hex e.g. "#000000"
    overlayOpacity: number; // 0 to 100

    isActive: boolean;
    order: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const heroSectionSchema=new mongoose.Schema(
    {
        eyebrow:{
            type:String,
            required:true,
            trim:true
        },
        brandName:{
            type:String,
            required:true,
            trim:true
        },
        headingLine1:{
            type:String,
            required:true,
            trim:true
        },
        headingLine2:{
            type:String,
            required:true,
            trim:true
        },
        description:{
            type:String,
            required:true,
            trim:true
        },
        primaryButtonText:{
            type:String,
            required:true,
            trim:true
        },
        primaryButtonLink:{
            type:String,
            required:true,
            trim:true
        },
        secondaryButtonText:{
            type:String,
            required:true,
            trim:true
        },
        secondaryButtonLink:{
            type:String,
            trim:true
        },
        mediaType:{
            type:String,
            enum:["image","video"],
            required:true,
            default:"image"
        },
        mediaUrl:{
            type:String,
            required:true
        },
        mediaPublicId:{
            type:String,
            required:true
        },
        mediaLocalPath:{
            type:String,
            required:true,
        },
        mediaLocalUrl:{
            type:String,
            required:true
        },
        textAlignment:{
            type:String,
            enum:["left","center","right"],
            default:"left",
            required:true
        },
        overlayColor:{
            type:String,
            required:true,
            default:"#000000",
            match:[
                /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/,
                "Overlay color must be a valid hex code e.g. #000000",
            ]
        },
        overlayOpacity:{
            type:Number,
            required:true,
            default:40,
            min:[0,"Opacity must be between 0 and 100"],
            max:[100,"Opacity msut be between 0 and 100"],
        },
        isActive:{
            type:Boolean,
            default:true
        },
        order:{
            type:Number,
            default:0,
            min:[0,"Order must be a non-negative number"],
        },
    },
    {
        timestamps:true
    }
)

heroSectionSchema.index({ order: 1 });

export const HeroSection=mongoose.model<IHeroSection>("HeroSection",heroSectionSchema);