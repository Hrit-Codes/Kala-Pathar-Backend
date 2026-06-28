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

interface SendMailOptions {
    to: string;
    subject: string; 
    html: string;
}

export const sendMail=async({to,subject,html}:SendMailOptions)=>{
    try{
        await transporter.sendMail({
            from:loadEnv.EMAIL_USER,
            to,
            subject:subject,
            html:html
        })
    }catch(error){
        console.log("Error sending mail:",error);
        throw new ApiError(500,"Failed to send email");
    }
}