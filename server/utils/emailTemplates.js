



export function generateForgotPasswordEmailTemplate(resetPasswordUrl) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Password Reset</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

        <table width="100%" cellspacing="0" cellpadding="0" style="padding:40px 0;">
            <tr>
                <td align="center">

                    <table width="600" cellspacing="0" cellpadding="0"
                        style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 5px 18px rgba(0,0,0,0.08);">

                        <!-- Header -->
                        <tr>
                            <td align="center"
                                style="background:#2563eb;padding:30px;color:#ffffff;">
                                <h1 style="margin:0;">FYM Project Management System</h1>
                                <p style="margin-top:8px;font-size:16px;">
                                    Password Reset Request
                                </p>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding:40px;color:#333;font-size:16px;line-height:1.7;">

                                <p>Hello,</p>

                                <p>
                                    We received a request to reset the password for your account.
                                    If you made this request, click the button below to create a new password.
                                </p>

                                <div style="text-align:center;margin:35px 0;">
                                    <a href="${resetPasswordUrl}"
                                        style="
                                            display:inline-block;
                                            background:#2563eb;
                                            color:#ffffff;
                                            text-decoration:none;
                                            padding:14px 32px;
                                            border-radius:6px;
                                            font-size:16px;
                                            font-weight:bold;
                                        ">
                                        Reset Password
                                    </a>
                                </div>

                                <p>
                                    If the button above doesn't work, copy and paste the following link into your browser:
                                </p>

                                <p style="word-break:break-word;">
                                    <a href="${resetPasswordUrl}" style="color:#2563eb;">
                                        ${resetPasswordUrl}
                                    </a>
                                </p>

                                <hr style="border:none;border-top:1px solid #e5e5e5;margin:35px 0;">

                                <p>
                                    <strong>Security Notice</strong>
                                </p>

                                <ul style="padding-left:20px;">
                                    <li>This password reset link is valid for <strong>15 minutes</strong>.</li>
                                    <li>This link can be used only once.</li>
                                    <li>If you did not request this password reset, you can safely ignore this email.</li>
                                    <li>Your password will remain unchanged until you create a new one.</li>
                                </ul>

                                <p style="margin-top:35px;">
                                    Thank you,<br>
                                    <strong>FYM Project Management System Team</strong>
                                </p>

                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td align="center"
                                style="background:#f8f9fa;padding:20px;color:#777;font-size:13px;">
                                This is an automated email. Please do not reply.
                                <br><br>
                                © ${new Date().getFullYear()} FYM Project Management System. All rights reserved.
                            </td>
                        </tr>

                    </table>

                </td>
            </tr>
        </table>

    </body>
    </html>
    `;
}













