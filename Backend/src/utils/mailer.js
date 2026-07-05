const nodemailer = require('nodemailer');

/**
 * Sends a password reset email to the user.
 * For resume/demo purposes, if no SMTP variables are set in .env,
 * it prints the reset link directly to the backend console for easy testing.
 */
const sendResetEmail = async (emailId, resetLink) => {
    // 1. Check if SMTP configuration is available in .env
    const useRealSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

    if (!useRealSMTP) {
        // Fallback: Prints to console for instant developer demonstration
        console.log("\n========================================================");
        console.log(`[MAIL MOCK] Password Reset Link for ${emailId}:`);
        console.log(resetLink);
        console.log("========================================================\n");
        return true;
    }

    try {
        // 2. Create SMTP transporter using credentials from .env
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for others
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // 3. Setup email format
        const mailOptions = {
            from: `"CodeArena Support" <${process.env.SMTP_USER}>`,
            to: emailId,
            subject: 'Reset Your Password - CodeArena',
            html: `
                <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #4f46e5;">Password Reset Request</h2>
                    <p>Hello,</p>
                    <p>You requested to reset your password for your CodeArena account. Click the button below to set a new password. This link is valid for 15 minutes.</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p>If you did not request this, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #666;">If the button above doesn't work, copy and paste this URL into your browser:</p>
                    <p style="font-size: 12px; color: #4f46e5; word-break: break-all;">${resetLink}</p>
                </div>
            `,
        };

        // 4. Send email
        await transporter.sendMail(mailOptions);
        console.log(`[MAIL] Password reset email successfully sent to ${emailId}`);
        return true;
    } catch (error) {
        console.error("Error sending email via SMTP: ", error);

        // Fallback to console print even if SMTP fails so testing never gets blocked
        console.log("\n========================================================");
        console.log(`[MAIL FALLBACK] Password Reset Link for ${emailId}:`);
        console.log(resetLink);
        console.log("========================================================\n");
        return true;
    }
};

module.exports = { sendResetEmail };
