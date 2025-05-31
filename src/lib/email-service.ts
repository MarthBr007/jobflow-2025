import nodemailer from 'nodemailer';

export interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}

export interface EmailOptions {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        content: string | Buffer;
        contentType?: string;
    }>;
}

export class EmailService {
    private transporter: nodemailer.Transporter;
    private fromEmail: string;

    constructor(config: EmailConfig, fromEmail: string) {
        this.transporter = nodemailer.createTransport(config);
        this.fromEmail = fromEmail;
    }

    async sendEmail(options: EmailOptions): Promise<boolean> {
        try {
            const info = await this.transporter.sendMail({
                from: this.fromEmail,
                to: options.to,
                cc: options.cc,
                bcc: options.bcc,
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: options.attachments,
            });

            console.log('Email sent:', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }

    async sendContractEmail(
        recipientEmail: string,
        employeeName: string,
        contractTitle: string,
        contractPdf: string,
        contractType: 'new' | 'signed' | 'reminder'
    ): Promise<boolean> {
        const templates = this.getEmailTemplates();
        const template = templates[contractType];

        const html = template.html
            .replace('{{employeeName}}', employeeName)
            .replace('{{contractTitle}}', contractTitle)
            .replace('{{companyName}}', 'Broers Verhuur'); // This could be configurable

        const text = template.text
            .replace('{{employeeName}}', employeeName)
            .replace('{{contractTitle}}', contractTitle)
            .replace('{{companyName}}', 'Broers Verhuur');

        // Convert base64 PDF to buffer
        const pdfBuffer = Buffer.from(contractPdf.split(',')[1], 'base64');

        return this.sendEmail({
            to: recipientEmail,
            subject: template.subject.replace('{{contractTitle}}', contractTitle),
            html,
            text,
            attachments: [
                {
                    filename: `${contractTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        });
    }

    private getEmailTemplates() {
        return {
            new: {
                subject: 'Nieuw contract: {{contractTitle}}',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">📄 Nieuw Contract</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f8fafc;">
              <h2 style="color: #1e293b;">Beste {{employeeName}},</h2>
              
              <p style="color: #475569; line-height: 1.6;">
                Hierbij ontvang je jouw nieuwe arbeidscontract: <strong>{{contractTitle}}</strong>.
              </p>
              
              <div style="background-color: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e293b; margin-top: 0;">📋 Wat moet je doen?</h3>
                <ul style="color: #475569;">
                  <li>Lees het contract zorgvuldig door</li>
                  <li>Print het contract uit (2 exemplaren)</li>
                  <li>Onderteken beide exemplaren</li>
                  <li>Stuur 1 exemplaar terug naar {{companyName}}</li>
                  <li>Bewaar 1 exemplaar voor jezelf</li>
                </ul>
              </div>
              
              <p style="color: #475569; line-height: 1.6;">
                Heb je vragen over het contract? Neem dan contact met ons op.
              </p>
              
              <div style="text-align: center; margin-top: 30px;">
                <div style="background-color: #3b82f6; color: white; padding: 15px; border-radius: 8px; display: inline-block;">
                  <strong>📧 Vragen? Mail naar: info@broersverhuur.nl</strong>
                </div>
              </div>
            </div>
            
            <div style="background-color: #e2e8f0; padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
              <p style="margin: 0;">Met vriendelijke groet,<br>{{companyName}}</p>
            </div>
          </div>
        `,
                text: `
Beste {{employeeName}},

Hierbij ontvang je jouw nieuwe arbeidscontract: {{contractTitle}}.

Wat moet je doen?
- Lees het contract zorgvuldig door
- Print het contract uit (2 exemplaren)
- Onderteken beide exemplaren
- Stuur 1 exemplaar terug naar {{companyName}}
- Bewaar 1 exemplaar voor jezelf

Heb je vragen over het contract? Neem dan contact met ons op via info@broersverhuur.nl

Met vriendelijke groet,
{{companyName}}
        `,
            },
            signed: {
                subject: 'Contract ondertekend: {{contractTitle}}',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">✅ Contract Ondertekend</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f8fafc;">
              <h2 style="color: #1e293b;">Beste {{employeeName}},</h2>
              
              <p style="color: #475569; line-height: 1.6;">
                Geweldig! Jouw contract <strong>{{contractTitle}}</strong> is succesvol ondertekend en verwerkt.
              </p>
              
              <div style="background-color: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e293b; margin-top: 0;">🎉 Welkom bij het team!</h3>
                <p style="color: #475569; margin-bottom: 0;">
                  Je bent nu officieel onderdeel van {{companyName}}. We kijken ernaar uit om met je samen te werken!
                </p>
              </div>
              
              <p style="color: #475569; line-height: 1.6;">
                In de bijlage vind je een kopie van het ondertekende contract voor jouw administratie.
              </p>
            </div>
            
            <div style="background-color: #e2e8f0; padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
              <p style="margin: 0;">Met vriendelijke groet,<br>{{companyName}}</p>
            </div>
          </div>
        `,
                text: `
Beste {{employeeName}},

Geweldig! Jouw contract {{contractTitle}} is succesvol ondertekend en verwerkt.

Welkom bij het team! Je bent nu officieel onderdeel van {{companyName}}. We kijken ernaar uit om met je samen te werken!

In de bijlage vind je een kopie van het ondertekende contract voor jouw administratie.

Met vriendelijke groet,
{{companyName}}
        `,
            },
            reminder: {
                subject: 'Herinnering: Contract ondertekening - {{contractTitle}}',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">⏰ Herinnering</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f8fafc;">
              <h2 style="color: #1e293b;">Beste {{employeeName}},</h2>
              
              <p style="color: #475569; line-height: 1.6;">
                Dit is een vriendelijke herinnering voor het ondertekenen van jouw contract: <strong>{{contractTitle}}</strong>.
              </p>
              
              <div style="background-color: white; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e293b; margin-top: 0;">⚡ Actie vereist</h3>
                <p style="color: #475569; margin-bottom: 0;">
                  Graag ontvangen we het ondertekende contract zo spoedig mogelijk retour.
                </p>
              </div>
              
              <p style="color: #475569; line-height: 1.6;">
                Heb je vragen of heb je hulp nodig? Neem gerust contact met ons op.
              </p>
            </div>
            
            <div style="background-color: #e2e8f0; padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
              <p style="margin: 0;">Met vriendelijke groet,<br>{{companyName}}</p>
            </div>
          </div>
        `,
                text: `
Beste {{employeeName}},

Dit is een vriendelijke herinnering voor het ondertekenen van jouw contract: {{contractTitle}}.

Graag ontvangen we het ondertekende contract zo spoedig mogelijk retour.

Heb je vragen of heb je hulp nodig? Neem gerust contact met ons op via info@broersverhuur.nl

Met vriendelijke groet,
{{companyName}}
        `,
            },
        };
    }
}

// Default email configuration (should be moved to environment variables)
export function createEmailService(): EmailService {
    const config: EmailConfig = {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
        },
    };

    const fromEmail = process.env.FROM_EMAIL || 'noreply@broersverhuur.nl';

    return new EmailService(config, fromEmail);
} 