import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface SendEmailDto {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly emailFrom: string;

  constructor(private configService: ConfigService) {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    this.emailFrom = this.configService.get<string>(
      'EMAIL_FROM',
      'Flipstaq <noreply@flipstaq.com>',
    );

    if (!resendApiKey) {
      this.logger.warn('RESEND_API_KEY not configured, email functionality will be disabled');
    }

    this.resend = new Resend(resendApiKey);
  }
  async sendEmail({ to, subject, html }: SendEmailDto): Promise<boolean> {
    try {
      if (!this.resend) {
        this.logger.warn('Resend not configured, skipping email send');
        return false;
      }

      const { data, error } = await this.resend.emails.send({
        from: this.emailFrom,
        to: [to],
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send email via Resend:`, error);
        return false;
      }

      this.logger.log(`Email sent successfully to ${to}, ID: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending email to ${to}:`, error);
      return false;
    }
  }
  async sendVerificationEmail(
    email: string,
    firstName: string,
    verificationToken: string,
    userCountry?: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verificationLink = `${frontendUrl}/api/auth/verify?token=${verificationToken}`;

    // Define Arabic countries
    const arabicCountries = ['SA', 'AE', 'EG', 'JO', 'LB', 'KW', 'QA', 'BH', 'OM'];
    const isArabicCountry = userCountry && arabicCountries.includes(userCountry);

    const html = isArabicCountry
      ? this.generateVerificationEmailTemplateArabic(firstName, verificationLink)
      : this.generateVerificationEmailTemplateEnglish(firstName, verificationLink);

    const subject = isArabicCountry
      ? `تحقق من حساب Flipstaq الخاص بك`
      : 'Verify your Flipstaq account';

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }
  private generateVerificationEmailTemplateEnglish(
    firstName: string,
    verificationLink: string,
  ): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Flipstaq Account</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9fafb;
            }
            .container {
                background: white;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                margin: 20px 0;
            }
            .logo {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo h1 {
                color: #3b82f6;
                font-size: 28px;
                font-weight: 700;
                margin: 0;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .header h2 {
                color: #1f2937;
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 10px 0;
            }
            .header p {
                color: #6b7280;
                font-size: 16px;
                margin: 0;
            }
            .verify-button {
                display: inline-block;
                background-color: #3b82f6;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                margin: 30px 0;
                text-align: center;
            }
            .verify-button:hover {
                background-color: #2563eb;
            }
            .content {
                margin: 30px 0;
                line-height: 1.7;
            }
            .link-backup {
                background-color: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                word-break: break-all;
                font-family: monospace;
                font-size: 12px;
                color: #6b7280;
            }
            .warning {
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                border-radius: 6px;
                padding: 15px;
                margin: 30px 0;
                color: #92400e;
            }
            .footer {
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <h1>Flipstaq</h1>
            </div>
            
            <div class="header">
                <h2>Welcome to Flipstaq, ${firstName}!</h2>
                <p>Please verify your email address to get started</p>
            </div>
            
            <div class="content">
                <p>Thank you for joining <strong>Flipstaq</strong>, your trusted marketplace for buying and selling.</p>
                
                <p>To complete your registration and access all features, please verify your email address by clicking the button below:</p>
            </div>
            
            <div style="text-align: center;">
                <a href="${verificationLink}" class="verify-button">Verify Email Address</a>
            </div>
            
            <p style="text-align: center; color: #6b7280; margin: 20px 0;">
                If the button doesn't work, copy and paste this link:
            </p>
            <div class="link-backup">
                ${verificationLink}
            </div>
            
            <div class="warning">
                <strong>Security Notice:</strong> This verification link will expire in 30 minutes. If you didn't create this account, please ignore this email.
            </div>
            
            <div class="footer">
                <p><strong>Best regards,</strong><br>The Flipstaq Team</p>
                <p style="margin-top: 15px;">
                    Need help? Contact our support team.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
  private generateVerificationEmailTemplateArabic(
    firstName: string,
    verificationLink: string,
  ): string {
    return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تحقق من حساب Flipstaq الخاص بك</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9fafb;
                direction: rtl;
            }
            .container {
                background: white;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                margin: 20px 0;
                text-align: right;
            }
            .logo {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo h1 {
                color: #3b82f6;
                font-size: 28px;
                font-weight: 700;
                margin: 0;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .header h2 {
                color: #1f2937;
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 10px 0;
            }
            .header p {
                color: #6b7280;
                font-size: 16px;
                margin: 0;
            }
            .verify-button {
                display: inline-block;
                background-color: #3b82f6;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                margin: 30px 0;
                text-align: center;
            }
            .verify-button:hover {
                background-color: #2563eb;
            }
            .content {
                margin: 30px 0;
                line-height: 1.7;
            }
            .link-backup {
                background-color: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                word-break: break-all;
                font-family: monospace;
                font-size: 12px;
                color: #6b7280;
                direction: ltr;
                text-align: left;
            }
            .warning {
                background-color: #fef3c7;
                border-right: 4px solid #f59e0b;
                border-radius: 6px;
                padding: 15px;
                margin: 30px 0;
                color: #92400e;
            }
            .footer {
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <h1>Flipstaq</h1>
            </div>
            
            <div class="header">
                <h2>أهلاً بك في Flipstaq، ${firstName}!</h2>
                <p>يرجى تأكيد عنوان بريدك الإلكتروني للبدء</p>
            </div>
            
            <div class="content">
                <p>شكراً لك للانضمام إلى <strong>Flipstaq</strong>، السوق الموثوق للبيع والشراء.</p>
                
                <p>لإتمام تسجيلك والوصول إلى جميع الميزات، يرجى تأكيد عنوان بريدك الإلكتروني بالنقر على الزر أدناه:</p>
            </div>
            
            <div style="text-align: center;">
                <a href="${verificationLink}" class="verify-button">تأكيد البريد الإلكتروني</a>
            </div>
            
            <p style="text-align: center; color: #6b7280; margin: 20px 0;">
                إذا لم يعمل الزر، انسخ والصق هذا الرابط:
            </p>
            <div class="link-backup">
                ${verificationLink}
            </div>
            
            <div class="warning">
                <strong>تنبيه أمني:</strong> سينتهي صلاحية رابط التحقق هذا خلال 30 دقيقة. إذا لم تنشئ هذا الحساب، يرجى تجاهل هذا البريد الإلكتروني.
            </div>
            
            <div class="footer">
                <p><strong>مع أطيب التحيات،</strong><br>فريق Flipstaq</p>
                <p style="margin-top: 15px;">
                    تحتاج مساعدة؟ اتصل بفريق الدعم.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}
