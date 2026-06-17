import type { NextFunction, Request, Response } from "express";
import type { ObjectSchema } from "joi";
import { ApiError } from "../utils/apiError";

export const validate=(schema:ObjectSchema)=>{
    return(req:Request, res:Response, next:NextFunction)=>{
        const {error}= schema.validate(req.body,{abortEarly:false})

        if(error){
            const message= error.details.map((d)=>d.message).join(",");
            throw new ApiError(400, message);
        }

        next();
    }
}