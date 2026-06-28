import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

const options: SMTPTransport.Options = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

export const transporter = nodemailer.createTransport(options);

export const verifyMailer=async()=>{
    try{
        await transporter.verify();
        console.log("Mail server connected");
    }catch(error){
        console.log("Mail server connection failed",error);
    }
}