import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface PasswordResetEmailData {
  email: string;
  resetToken: string;
  firstName?: string;
  lastName?: string;
}

export interface WelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyName?: string;
}

export class EmailService {
  private transporter!: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Log email configuration for debugging
      logger.info('Initializing email service with config:', {
        NODE_ENV: env.NODE_ENV,
        SMTP_HOST: env.SMTP_HOST,
        SMTP_PORT: env.SMTP_PORT,
        SMTP_USER: env.SMTP_USER ? '***configured***' : 'not set',
        FROM_EMAIL: env.FROM_EMAIL,
      });

      // Use different configurations based on environment
      if (env.NODE_ENV === 'production') {
        // Production email service (e.g., SendGrid, AWS SES)
        this.transporter = nodemailer.createTransport({
          service: 'sendgrid',
          auth: {
            user: 'apikey',
            pass: env.SENDGRID_API_KEY || 'your-sendgrid-api-key',
          },
        });
      } else {
        // Development/Test - use Ethereal Email or SMTP
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST || 'smtp.ethereal.email',
          port: parseInt(env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: env.SMTP_USER || 'ethereal.user@ethereal.email',
            pass: env.SMTP_PASS || 'ethereal.pass',
          },
        });
      }

      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw new Error('Email service initialization failed');
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: env.FROM_EMAIL || 'noreply@germy.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    try {
      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${data.resetToken}`;
      const expiresIn = '1 hour';

      const html = this.generatePasswordResetHtml({
        firstName: data.firstName || 'User',
        lastName: data.lastName || '',
        resetUrl,
        expiresIn,
      });

      const text = this.generatePasswordResetText({
        firstName: data.firstName || 'User',
        lastName: data.lastName || '',
        resetUrl,
        expiresIn,
      });

      return await this.sendEmail({
        to: data.email,
        subject: 'Password Reset Request - Germy Attendance Platform',
        html,
        text,
      });
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Send welcome email for new users
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const html = this.generateWelcomeHtml({
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        companyName: data.companyName,
      });

      const text = this.generateWelcomeText({
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        companyName: data.companyName,
      });

      return await this.sendEmail({
        to: data.email,
        subject: `Welcome to Germy Attendance Platform - ${data.role.replace(/_/g, ' ').toUpperCase()}`,
        html,
        text,
      });
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      return false;
    }
  }

  /**
   * Send account verification email
   */
  async sendVerificationEmail(email: string, verificationToken: string): Promise<boolean> {
    try {
      const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

      const html = this.generateVerificationHtml(verificationUrl);
      const text = this.generateVerificationText(verificationUrl);

      return await this.sendEmail({
        to: email,
        subject: 'Verify Your Email - Germy Attendance Platform',
        html,
        text,
      });
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      return false;
    }
  }

  /**
   * Generate password reset HTML template
   */
  private generatePasswordResetHtml(data: {
    firstName: string;
    lastName: string;
    resetUrl: string;
    expiresIn: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.firstName} ${data.lastName},</h2>
              <p>We received a request to reset your password for your Germy Attendance Platform account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${data.resetUrl}" class="button">Reset Password</a>
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link will expire in ${data.expiresIn}</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>For security, never share this link with anyone</li>
                </ul>
              </div>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">${data.resetUrl}</p>
            </div>
            <div class="footer">
              <p>This email was sent from Germy Attendance Platform</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate password reset text template
   */
  private generatePasswordResetText(data: {
    firstName: string;
    lastName: string;
    resetUrl: string;
    expiresIn: string;
  }): string {
    return `
Password Reset Request - Germy Attendance Platform

Hello ${data.firstName} ${data.lastName},

We received a request to reset your password for your Germy Attendance Platform account.

To reset your password, click the following link:
${data.resetUrl}

Important:
- This link will expire in ${data.expiresIn}
- If you didn't request this reset, please ignore this email
- For security, never share this link with anyone

If you have any questions, please contact our support team.

Best regards,
Germy Attendance Platform Team
    `;
  }

  /**
   * Generate welcome HTML template
   */
  private generateWelcomeHtml(data: {
    firstName: string;
    lastName: string;
    role: string;
    companyName?: string;
  }): string {
    const roleDisplay = data.role.replace(/_/g, ' ').toUpperCase();
    const companyInfo = data.companyName ? ` at ${data.companyName}` : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Germy</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .role-badge { background: #dbeafe; color: #1e40af; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Germy!</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.firstName} ${data.lastName},</h2>
              <p>Welcome to the Germy Attendance Platform${companyInfo}!</p>
              <p>Your account has been successfully created with the following role:</p>
              <div class="role-badge">${roleDisplay}</div>
              <p>You can now access your dashboard and start managing attendance for your team.</p>
              <a href="${env.FRONTEND_URL}/login" class="button">Access Your Dashboard</a>
              <h3>What's Next?</h3>
              <ul>
                <li>Complete your profile setup</li>
                <li>Explore the dashboard features</li>
                <li>Set up your team members (if you're an admin)</li>
                <li>Configure attendance policies</li>
              </ul>
            </div>
            <div class="footer">
              <p>Welcome to Germy Attendance Platform</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate welcome text template
   */
  private generateWelcomeText(data: {
    firstName: string;
    lastName: string;
    role: string;
    companyName?: string;
  }): string {
    const roleDisplay = data.role.replace(/_/g, ' ').toUpperCase();
    const companyInfo = data.companyName ? ` at ${data.companyName}` : '';

    return `
Welcome to Germy Attendance Platform!

Hello ${data.firstName} ${data.lastName},

Welcome to the Germy Attendance Platform${companyInfo}!

Your account has been successfully created with the role: ${roleDisplay}

You can now access your dashboard and start managing attendance for your team.

Login URL: ${env.FRONTEND_URL}/login

What's Next?
- Complete your profile setup
- Explore the dashboard features
- Set up your team members (if you're an admin)
- Configure attendance policies

If you have any questions, please contact our support team.

Best regards,
Germy Attendance Platform Team
    `;
  }

  /**
   * Generate verification HTML template
   */
  private generateVerificationHtml(verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Verify Your Email</h1>
            </div>
            <div class="content">
              <h2>Almost there!</h2>
              <p>Please verify your email address to complete your account setup.</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
            </div>
            <div class="footer">
              <p>This email was sent from Germy Attendance Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate verification text template
   */
  private generateVerificationText(verificationUrl: string): string {
    return `
Verify Your Email - Germy Attendance Platform

Almost there!

Please verify your email address to complete your account setup.

Click the following link to verify your email:
${verificationUrl}

If you have any questions, please contact our support team.

Best regards,
Germy Attendance Platform Team
    `;
  }

  /**
   * Test email service configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection test successful');
      return true;
    } catch (error) {
      logger.error('Email service connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

