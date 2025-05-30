import nodemailer from 'nodemailer';
import prisma from './prisma';

// Create transporter dynamically based on settings
async function createTransporter() {
    try {
        // Try to get settings from database first
        const emailSettings = await prisma.emailSettings.findFirst({
            where: { isEnabled: true },
            orderBy: { updatedAt: 'desc' }
        });

        if (emailSettings) {
            console.log('📧 Using database email settings');
            // Use database settings
            return nodemailer.createTransport({
                host: emailSettings.smtpHost,
                port: emailSettings.smtpPort,
                secure: emailSettings.smtpPort === 465, // true for 465, false for other ports
                auth: {
                    user: emailSettings.smtpUser,
                    pass: emailSettings.smtpPass,
                },
            });
        }
    } catch (error) {
        console.log('⚠️ Database email settings not available, using environment variables');
    }

    // Fallback to environment variables
    console.log('📧 Using environment email settings');
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'mail.antagonist.nl',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER || 'no-reply@broersverhuur.nl',
            pass: process.env.SMTP_PASS || '',
        },
    });
}

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail(options: EmailOptions) {
    try {
        // For development, just log the email instead of sending
        if (process.env.NODE_ENV === 'development') {
            console.log('📧 Email would be sent:');
            console.log('To:', options.to);
            console.log('Subject:', options.subject);
            console.log('Content:', options.text || options.html);
            return { success: true, messageId: 'dev-mode' };
        }

        const transporter = await createTransporter();

        // Get from address from database or environment
        let fromAddress;
        try {
            const emailSettings = await prisma.emailSettings.findFirst({
                where: { isEnabled: true },
                orderBy: { updatedAt: 'desc' }
            });
            fromAddress = emailSettings?.smtpFrom || process.env.SMTP_FROM || '"Broers Verhuur JobFlow" <no-reply@broersverhuur.nl>';
        } catch (error) {
            fromAddress = process.env.SMTP_FROM || '"Broers Verhuur JobFlow" <no-reply@broersverhuur.nl>';
        }

        console.log('📤 Sending email to:', options.to);
        const info = await transporter.sendMail({
            from: fromAddress,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });

        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error };
    }
}

export function createInterestConfirmationEmail(
    userName: string,
    projectName: string,
    projectCompany: string,
    notes?: string
) {
    const subject = `Interesse bevestiging - ${projectName}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${subject}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9fafb; }
                .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
                .highlight { background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 Interesse Bevestiging</h1>
                </div>
                
                <div class="content">
                    <h2>Hallo ${userName},</h2>
                    
                    <p>Je interesse in het volgende project is succesvol geregistreerd:</p>
                    
                    <div class="highlight">
                        <h3>📋 ${projectName}</h3>
                        <p><strong>Bedrijf:</strong> ${projectCompany}</p>
                        ${notes ? `<p><strong>Je notities:</strong> ${notes}</p>` : ''}
                    </div>
                    
                    <p>De projectmanager is op de hoogte gesteld van je interesse en zal contact met je opnemen voor verdere details.</p>
                    
                    <p>Je kunt je interesse en status altijd bekijken in het JobFlow dashboard onder "Mijn Projecten".</p>
                    
                    <p>Bedankt voor je interesse!</p>
                </div>
                
                <div class="footer">
                    <p>Dit is een automatisch gegenereerde email van JobFlow.<br>
                    Reageer niet op deze email.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const text = `
        Interesse Bevestiging - ${projectName}
        
        Hallo ${userName},
        
        Je interesse in het volgende project is succesvol geregistreerd:
        
        Project: ${projectName}
        Bedrijf: ${projectCompany}
        ${notes ? `Je notities: ${notes}` : ''}
        
        De projectmanager is op de hoogte gesteld van je interesse en zal contact met je opnemen voor verdere details.
        
        Je kunt je interesse en status altijd bekijken in het JobFlow dashboard onder "Mijn Projecten".
        
        Bedankt voor je interesse!
        
        ---
        Dit is een automatisch gegenereerde email van JobFlow.
        Reageer niet op deze email.
    `;

    return { subject, html, text };
}

export function createAdminNotificationEmail(
    userName: string,
    userEmail: string,
    projectName: string,
    projectCompany: string,
    notes?: string
) {
    const subject = `Nieuwe project interesse - ${projectName}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${subject}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #059669; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9fafb; }
                .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
                .highlight { background: #d1fae5; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .user-info { background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 Nieuwe Project Interesse</h1>
                </div>
                
                <div class="content">
                    <h2>Er is nieuwe interesse getoond in een project!</h2>
                    
                    <div class="user-info">
                        <h3>👤 Medewerker Details</h3>
                        <p><strong>Naam:</strong> ${userName}</p>
                        <p><strong>Email:</strong> ${userEmail}</p>
                    </div>
                    
                    <div class="highlight">
                        <h3>📋 Project Details</h3>
                        <p><strong>Project:</strong> ${projectName}</p>
                        <p><strong>Bedrijf:</strong> ${projectCompany}</p>
                        ${notes ? `<p><strong>Notities van medewerker:</strong> ${notes}</p>` : ''}
                    </div>
                    
                    <p>Log in op het JobFlow dashboard om de interesse te bekijken en contact op te nemen met de medewerker.</p>
                </div>
                
                <div class="footer">
                    <p>Dit is een automatisch gegenereerde email van JobFlow.<br>
                    Reageer niet op deze email.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const text = `
        Nieuwe Project Interesse - ${projectName}
        
        Er is nieuwe interesse getoond in een project!
        
        Medewerker Details:
        Naam: ${userName}
        Email: ${userEmail}
        
        Project Details:
        Project: ${projectName}
        Bedrijf: ${projectCompany}
        ${notes ? `Notities van medewerker: ${notes}` : ''}
        
        Log in op het JobFlow dashboard om de interesse te bekijken en contact op te nemen met de medewerker.
        
        ---
        Dit is een automatisch gegenereerde email van JobFlow.
        Reageer niet op deze email.
    `;

    return { subject, html, text };
} 