import { transporter } from "../config/nodemailer"


interface SendMailOptions{
    to:string,
    subject:string,
    html:string
}

export const sendMail= async({to,subject,html}:SendMailOptions):Promise<void>=>{
    await transporter.sendMail({
        from:process.env.SMTP_FROM,
        to,
        subject,
        html
    })
}