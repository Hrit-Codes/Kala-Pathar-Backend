export const inquiryReplyTemplate = (
    fullname: string,
    originalSubject: string,
    replyMessage: string
): string => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <style>
                body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
                .header { background: #1a6b3c; padding: 24px 32px; }
                .header h1 { color: #ffffff; margin: 0; font-size: 22px; }
                .body { padding: 32px; color: #333333; }
                .body p { line-height: 1.7; margin: 0 0 16px; }
                .original { background: #f9f9f9; border-left: 4px solid #1a6b3c; padding: 16px; margin: 24px 0; border-radius: 4px; }
                .original p { margin: 0; color: #555; font-size: 14px; }
                .footer { padding: 24px 32px; background: #f4f4f4; text-align: center; font-size: 12px; color: #999; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Kala Patthar Treks Expeditions</h1>
                </div>
                <div class="body">
                    <p>Dear ${fullname},</p>
                    <p>Thank you for reaching out to us. Here is our response to your inquiry:</p>
                    <div class="original">
                        <p><strong>Your inquiry:</strong> ${originalSubject}</p>
                    </div>
                    <p>${replyMessage.replace(/\n/g, "<br/>")}</p>
                    <p>If you have any further questions, feel free to reply to this email.</p>
                    <p>Warm regards,<br/><strong>Kala Patthar Expeditions Team</strong></p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Kala Patthar Expeditions & PVT.LTD. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};