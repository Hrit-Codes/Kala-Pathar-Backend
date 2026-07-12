import nodemailer from "nodemailer";
import { loadEnv } from "../config/env";

export const transporter= nodemailer.createTransport(
    {
        secure:true,
        host:"smtp.gmail.com",
        port:465,
        auth:{
            user:loadEnv.EMAIL_USER,
            pass:loadEnv.EMAIL_PASS
        }
    }
)

export const verifyEmailConnection= async()=>{
    try{
        await transporter.verify();
        console.log("Email transporter ready");
    }catch(error){
        console.log("Email transporter failed:",error);
        throw error;
    }
}