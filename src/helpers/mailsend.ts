import { transporter } from "../config/email";
import { loadEnv } from "../config/env";
import { ApiError } from "../utils/apiError";


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