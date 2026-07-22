import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, message }) => {
    const smtpUser = process.env.SMTP_USER;
    const rawPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
    const smtpPass = rawPass ? rawPass.replace(/\s+/g, '') : null;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = process.env.SMTP_PORT || 587;

    // Development Fallback: If SMTP credentials are missing, log to console
    if (!smtpUser || !smtpPass) {
        console.log('====================================================');
        console.log(`[SMTP Dev Mode] Target Email: ${to}`);
        console.log(`[SMTP Dev Mode] Subject: ${subject}`);
        console.log(`[SMTP Dev Mode] HTML Body generated successfully.`);
        console.log('====================================================');
        return;
    }

    try {
        const isGmail = smtpHost.includes('gmail');
        const transporter = nodemailer.createTransport(
            isGmail
                ? {
                      service: 'gmail',
                      auth: {
                          user: smtpUser,
                          pass: smtpPass,
                      },
                  }
                : {
                      host: smtpHost,
                      port: Number(smtpPort),
                      secure: Number(smtpPort) === 465,
                      auth: {
                          user: smtpUser,
                          pass: smtpPass,
                      },
                  }
        );

        const mailOptions = {
            from: `Academic Workflow Platform <${smtpUser}>`,
            to,
            subject,
            html: message,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Sent] Message sent to ${to}: ${info.messageId}`);
    } catch (error) {
        console.error(`[SMTP Failure] Failed to send email to ${to}:`, error.message);
        throw new Error(`Email dispatch failed: ${error.message}`);
    }
};
