const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Service pour l'envoi d'e-mails
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 15000, 
    greetingTimeout: 15000,
    socketTimeout: 30000
});

const sendEmail = async (to, subject, html) => {
    try {
        console.log(`Attempting to send email to ${to} with subject "${subject}"...`);

        // PRIORITÉ 1: Utiliser Resend si la clé API est configurée
        if (resend) {
            console.log('Using Resend API for email delivery...');
            const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM || process.env.SMTP_FROM || 'onboarding@resend.dev',
                to,
                subject,
                html,
                text: html.replace(/<[^>]*>?/gm, ''), // Basic HTML strip for fallback
            });

            if (error) {
                console.error('❌ Resend Error:', error);
                throw error;
            }

            console.log('✅ Email sent via Resend:', data.id);
            return true;
        }

        // PRIORITÉ 2: Utiliser Nodemailer (fallback)
        if (!process.env.SMTP_USER) {
            console.log('--- EMAIL SENT (LOG) ---');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log('--- SMTP_USER is missing, falling back to log mode ---');
            console.log('------------------------');
            return true;
        }

        console.log(`Attempting to send email to ${to} with subject "${subject}"...`);

        const info = await transporter.sendMail({
            from: `"Samalocation" <${process.env.SMTP_FROM || 'noreply@samalocation.com'}>`,
            to,
            subject,
            html,
            text: html.replace(/<[^>]*>?/gm, ''), // Basic HTML strip for fallback
        });

        console.log('✅ Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response,
            stack: error.stack
        });
        console.error('Diagnostic - SMTP Config:', {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE,
            user: process.env.SMTP_USER ? 'Present (REDACTED)' : 'MISSING',
            from: process.env.SMTP_FROM,
            env: process.env.NODE_ENV
        });
        return false;
    }
};

const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${token}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #2D3FE2; text-align: center;">Bienvenue chez Samalocation</h2>
            <p>Bonjour,</p>
            <p>Merci de vous être inscrit sur Samalocation. Pour activer votre compte, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #2D3FE2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirmer mon compte</a>
            </div>
            <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller le lien suivant dans votre navigateur :</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
    `;

    return await sendEmail(email, 'Vérifiez votre adresse e-mail - Samalocation', html);
};

const sendResetPasswordEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${token}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #2D3FE2; text-align: center;">Réinitialisation de votre mot de passe</h2>
            <p>Bonjour,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte SamaLocation. Veuillez cliquer sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #2D3FE2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Réinitialiser mon mot de passe</a>
            </div>
            <p>Ce lien est valable pendant 1 heure.</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail en toute sécurité.</p>
            <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller le lien suivant dans votre navigateur :</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
    `;

    return await sendEmail(email, 'Réinitialisation de votre mot de passe - Samalocation', html);
};

const sendTeamInvitationLink = async (email, ownerName, token, isExistingUser = false) => {
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/accept-invitation?token=${token}`;

    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #2D3FE2; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Invitation d'Équipe</h1>
            </div>
            <div style="padding: 30px; color: #333333; line-height: 1.6;">
                <p style="font-size: 16px;">Bonjour,</p>
                <p style="font-size: 16px;"><strong>${ownerName}</strong> vous invite à rejoindre son équipe de gestion immobilière sur <strong>Samalocation</strong> en tant qu'agent.</p>
                
                <div style="background-color: #fff8f1; border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 8px;">
                    <p style="margin: 0 0 10px 0; color: #855d00; font-weight: bold; font-size: 14px;">⚠️ Information importante sur l'abonnement :</p>
                    <p style="margin: 0; color: #855d00; font-size: 14px;">
                        En acceptant ce rôle, votre compte sera rattaché à l'agence de ${ownerName}. 
                        Vous ne pourrez plus souscrire au plan <strong>Entreprise</strong>, mais vous pourrez toujours bénéficier du plan <strong>Premium</strong> pour vos activités personnelles.
                    </p>
                </div>

                <p style="font-size: 15px; color: #555555;">
                    ${isExistingUser 
                        ? "Puisque vous possédez déjà un compte Samalocation, cliquez simplement sur le bouton ci-dessous pour confirmer votre accès." 
                        : "Vous n'avez pas encore de compte ? Pas de souci ! Cliquez sur le bouton ci-dessous pour créer votre compte propriétaire et rejoindre l'équipe."}
                </p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${inviteUrl}" style="background-color: #2D3FE2; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(45, 63, 226, 0.2);">Voir l'invitation</a>
                </div>
                
                <p style="font-size: 13px; color: #888888; font-style: italic;">Note : Si vous ne vous attendiez pas à cette invitation, vous pouvez l'ignorer sans risque.</p>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="font-size: 12px; color: #999999; margin: 0;">&copy; 2024 Samalocation. Tout droit réservés.</p>
                <p style="font-size: 11px; color: #bbbbbb; margin: 5px 0 0 0;">Cet e-mail automatique a été envoyé pour le compte de ${ownerName}.</p>
            </div>
        </div>
    `;

    return await sendEmail(email, `Invitation de ${ownerName} - Samalocation`, html);
};

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendResetPasswordEmail,
    sendTeamInvitationLink
};
