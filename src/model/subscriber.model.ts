import mongoose from "mongoose";
import crypto from "crypto";

export interface ISubscriber extends Document{
    email:string,
    isActive:boolean,
    unsubscribeToken:string;
    subscribedAt:Date,
    unsubscribedAt?:Date;
}

const subscriberSchema= new mongoose.Schema(
    {
        email:{
            type:String,
            required:true,
            unique:true,
            trim:true,
            lowercase:true
        },
        isActive:{
            type:Boolean,
            default:true
        },
        // unsubscribeToken: {
        //     type: String,
        //     required: true,
        //     unique: true,
        //     default: () => crypto.randomBytes(32).toString("hex"),
        // },
        subscribedAt:{
            type:Date,
            default:Date.now,
        },
        unsubscribedAt:{
            type:Date
        }
    },
    { timestamps: true }
)

subscriberSchema.index({email:1});
subscriberSchema.index({isActive:1});
subscriberSchema.index({unsubscribeToken:1})

export const Subscriber=mongoose.model<ISubscriber>("Subscriber",subscriberSchema);