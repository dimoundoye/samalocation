const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/**
 * Service pour l'envoi d'e-mails
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendEmail = async (to, subject, html) => {
    try {
        // En mode développement, si SMTP n'est pas configuré, on logue l'e-mail
        if (!process.env.SMTP_USER) {
            console.log('--- EMAIL SENT (LOG) ---');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Body: ${html}`);
            console.log('------------------------');
            return true;
        }

        const info = await transporter.sendMail({
            from: `"SamaLocation" <${process.env.SMTP_FROM || 'noreply@samalocation.com'}>`,
            to,
            subject,
            html,
        });

        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #2D3FE2; text-align: center;">Bienvenue chez SamaLocation</h2>
            <p>Bonjour,</p>
            <p>Merci de vous être inscrit sur SamaLocation. Pour activer votre compte, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #2D3FE2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirmer mon compte</a>
            </div>
            <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller le lien suivant dans votre navigateur :</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
    `;

    return await sendEmail(email, 'Vérifiez votre adresse e-mail - SamaLocation', html);
};

module.exports = {
    sendEmail,
    sendVerificationEmail
};
