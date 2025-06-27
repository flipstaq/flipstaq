import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private resend: Resend;
  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.logger.log(`Environment check - RESEND_API_KEY present: ${!!apiKey}`);
    this.logger.log(`Environment check - EMAIL_FROM: ${process.env.EMAIL_FROM}`);
    this.logger.log(`Environment check - PLATFORM_NAME: ${process.env.PLATFORM_NAME}`);

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not found in environment variables. Email functionality will be disabled.',
      );
    } else {
      this.logger.log('Initializing Resend with API key...');
      this.resend = new Resend(apiKey);
      this.logger.log('Resend initialized successfully');
    }
  }

  async sendProductApprovalEmail(
    productTitle: string,
    sellerEmail: string,
    sellerName: string,
  ): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping email send.');
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@flipstaq.com',
        to: [sellerEmail],
        subject: 'Your product has been approved - Flipstaq',
        html: this.generateApprovalEmailHtml(productTitle, sellerName),
        text: this.generateApprovalEmailText(productTitle, sellerName),
      });

      if (error) {
        this.logger.error('Failed to send approval email:', error);
        return false;
      }

      this.logger.log(
        `Approval email sent successfully to ${sellerEmail} for product: ${productTitle}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending approval email:', error);
      return false;
    }
  }

  async sendProductRejectionEmail(
    productTitle: string,
    sellerEmail: string,
    sellerName: string,
    reason?: string,
  ): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping email send.');
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@flipstaq.com',
        to: [sellerEmail],
        subject: 'Product review update - Flipstaq',
        html: this.generateRejectionEmailHtml(productTitle, sellerName, reason),
        text: this.generateRejectionEmailText(productTitle, sellerName, reason),
      });

      if (error) {
        this.logger.error('Failed to send rejection email:', error);
        return false;
      }

      this.logger.log(
        `Rejection email sent successfully to ${sellerEmail} for product: ${productTitle}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending rejection email:', error);
      return false;
    }
  }

  async sendProductReApprovalEmail(
    productTitle: string,
    sellerEmail: string,
    sellerName: string,
    approvalReason: string,
  ): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping email send.');
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@flipstaq.com',
        to: [sellerEmail],
        subject: 'Great news! Your product has been approved - Flipstaq',
        html: this.generateReApprovalEmailHtml(productTitle, sellerName, approvalReason),
        text: this.generateReApprovalEmailText(productTitle, sellerName, approvalReason),
      });

      if (error) {
        this.logger.error('Failed to send re-approval email:', error);
        return false;
      }

      this.logger.log(
        `Re-approval email sent successfully to ${sellerEmail} for product: ${productTitle}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending re-approval email:', error);
      return false;
    }
  }

  async sendProductDeletionEmail(
    productTitle: string,
    sellerEmail: string,
    sellerName: string,
    reason: string,
  ): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping email send.');
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@flipstaq.com',
        to: [sellerEmail],
        subject: 'Product Removed - Flipstaq',
        html: this.generateDeletionEmailHtml(productTitle, sellerName, reason),
        text: this.generateDeletionEmailText(productTitle, sellerName, reason),
      });

      if (error) {
        this.logger.error('Failed to send deletion email:', error);
        return false;
      }

      this.logger.log(
        `Deletion email sent successfully to ${sellerEmail} for product: ${productTitle}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending deletion email:', error);
      return false;
    }
  }

  private generateApprovalEmailHtml(productTitle: string, sellerName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff !important; text-decoration: none !important; border-radius: 8px; margin: 20px 0; font-weight: bold; border: 2px solid #4F46E5; transition: all 0.3s ease; }
            .button:hover { background-color: #3730A3; border-color: #3730A3; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Product Approved!</h1>
            </div>
            <div class="content">
              <h2>Hi ${sellerName},</h2>
              <p>Great news! Your product <strong>"${productTitle}"</strong> has been approved and is now live on Flipstaq.</p>
              <p>Your product is now visible to all users and can receive orders. You can manage your product and view analytics from your seller dashboard.</p>
              <a href="${process.env.FRONTEND_URL || 'https://flipstaq.com'}/dashboard" class="button">View Dashboard</a>
              <p>Thank you for being part of the Flipstaq community!</p>
            </div>
            <div class="footer">
              <p>© 2025 Flipstaq. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateApprovalEmailText(productTitle: string, sellerName: string): string {
    return `
Hi ${sellerName},

Great news! Your product "${productTitle}" has been approved and is now live on Flipstaq.

Your product is now visible to all users and can receive orders. You can manage your product and view analytics from your seller dashboard.

Visit: ${process.env.FRONTEND_URL || 'https://flipstaq.com'}/dashboard

Thank you for being part of the Flipstaq community!

© 2025 Flipstaq. All rights reserved.
This is an automated message. Please do not reply to this email.
    `;
  }

  private generateRejectionEmailHtml(
    productTitle: string,
    sellerName: string,
    reason?: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .reason { background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .edit-button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff !important; text-decoration: none !important; border-radius: 8px; margin: 20px 0; font-weight: bold; border: 2px solid #4F46E5; transition: all 0.3s ease; }
            .edit-button:hover { background-color: #3730A3; border-color: #3730A3; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Product Review Update</h1>
            </div>
            <div class="content">
              <h2>Hi ${sellerName},</h2>
              <p>Thank you for submitting your product <strong>"${productTitle}"</strong> to Flipstaq.</p>
              <p>After review, we need you to make some adjustments before we can approve your product for sale.</p>
              ${reason ? `<div class="reason"><strong>Reason:</strong> ${reason}</div>` : ''}
              <p>Please update your product and resubmit it for review. You can edit your product from your seller dashboard.</p>
              <a href="${process.env.FRONTEND_URL || 'https://flipstaq.com'}/dashboard" class="edit-button">Edit Product</a>
              <p>If you have any questions, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>© 2025 Flipstaq. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateRejectionEmailText(
    productTitle: string,
    sellerName: string,
    reason?: string,
  ): string {
    return `
Hi ${sellerName},

Thank you for submitting your product "${productTitle}" to Flipstaq.

After review, we need you to make some adjustments before we can approve your product for sale.

${reason ? `Reason: ${reason}` : ''}

Please update your product and resubmit it for review. You can edit your product from your seller dashboard.

Visit: ${process.env.FRONTEND_URL || 'https://flipstaq.com'}/dashboard

If you have any questions, please contact our support team.

© 2025 Flipstaq. All rights reserved.
This is an automated message. Please do not reply to this email.
    `;
  }

  private generateReApprovalEmailHtml(
    productTitle: string,
    sellerName: string,
    approvalReason: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .reason { background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff !important; text-decoration: none !important; border-radius: 8px; margin: 20px 0; font-weight: bold; border: 2px solid #4F46E5; transition: all 0.3s ease; }
            .button:hover { background-color: #3730A3; border-color: #3730A3; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .highlight { background-color: #FEF3C7; padding: 2px 6px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Product Approved After Review!</h1>
            </div>
            <div class="content">
              <h2>Hi ${sellerName},</h2>
              <p>Excellent news! After a thorough review, your product <strong>"${productTitle}"</strong> has been <span class="highlight">approved</span> and is now live on Flipstaq.</p>
              
              <div class="reason">
                <strong>Approval Message:</strong><br>
                ${approvalReason}
              </div>
              
              <p>Your product is now visible to all users and ready to receive orders. You can manage your product and track its performance from your seller dashboard.</p>
              
              <a href="${process.env.FRONTEND_URL || 'https://flipstaq.com'}/dashboard" class="button">View Dashboard</a>
              
              <p>Thank you for your patience during the review process and for being part of the Flipstaq community!</p>
            </div>
            <div class="footer">
              <p>© 2025 Flipstaq. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateReApprovalEmailText(
    productTitle: string,
    sellerName: string,
    approvalReason: string,
  ): string {
    return `
Hi ${sellerName},

Excellent news! After a thorough review, your product "${productTitle}" has been approved and is now live on Flipstaq.

Approval Message:
${approvalReason}

Your product is now visible to all users and ready to receive orders. You can manage your product and track its performance from your seller dashboard.

Visit: ${process.env.FRONTEND_URL || 'https://flipstaq.com'}/dashboard

Thank you for your patience during the review process and for being part of the Flipstaq community!

© 2025 Flipstaq. All rights reserved.
This is an automated message. Please do not reply to this email.
    `;
  }

  private generateDeletionEmailHtml(
    productTitle: string,
    sellerName: string,
    reason: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Product Removed - ${process.env.PLATFORM_NAME || 'Flipstaq'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .highlight { background-color: #fee2e2; color: #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Product Removed</h1>
              <p>Your product has been permanently removed from ${process.env.PLATFORM_NAME || 'Flipstaq'}</p>
            </div>
            <div class="content">
              <p>Hi ${sellerName},</p>
              
              <p>We're writing to inform you that your product <strong>"${productTitle}"</strong> has been permanently removed from our platform.</p>
              
              <div class="highlight">
                <strong>Reason for removal:</strong><br>
                ${reason}
              </div>
              
              <p>This action is permanent and cannot be undone. If you believe this was done in error or if you have questions about this decision, please contact our support team.</p>
              
              <p>We appreciate your understanding and thank you for being part of the ${process.env.PLATFORM_NAME || 'Flipstaq'} community.</p>
              
              <a href="${process.env.FRONTEND_URL || 'https://flipstaq.com'}/contact" class="button">Contact Support</a>
            </div>
            <div class="footer">
              <p>© 2025 ${process.env.PLATFORM_NAME || 'Flipstaq'}. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateDeletionEmailText(
    productTitle: string,
    sellerName: string,
    reason: string,
  ): string {
    return `
Hi ${sellerName},

We're writing to inform you that your product "${productTitle}" has been permanently removed from ${process.env.PLATFORM_NAME || 'Flipstaq'}.

Reason for removal:
${reason}

This action is permanent and cannot be undone. If you believe this was done in error or if you have questions about this decision, please contact our support team.

Contact us: ${process.env.FRONTEND_URL || 'https://flipstaq.com'}/contact

We appreciate your understanding and thank you for being part of the ${process.env.PLATFORM_NAME || 'Flipstaq'} community.

© 2025 ${process.env.PLATFORM_NAME || 'Flipstaq'}. All rights reserved.
This is an automated message. Please do not reply to this email.
    `;
  }
}
