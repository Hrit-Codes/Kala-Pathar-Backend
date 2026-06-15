import nodemailer from "nodemailer";
import { loadEnv } from "../config/env";
import { ApiError } from "../utils/apiError";

const transporter= nodemailer.createTransport(
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

interface SendMailOptions{
    to:string,
    sub:string,
    msg:string
}

export const sendMail=async({to,sub,msg}:SendMailOptions)=>{
    try{
        await transporter.sendMail({
            from:loadEnv.EMAIL_USER,
            to,
            subject:sub,
            html:msg
        })
    }catch(error){
        console.log("Error sending mail:",error);
        throw new ApiError(500,"Failed to send email");
    }
}