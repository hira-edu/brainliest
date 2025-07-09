import nodemailer from 'nodemailer';
import { cleanEnv, str } from 'envalid';

// Validate environment variables
const env = cleanEnv(process.env, {
  TITAN_EMAIL: str({ default: 'noreply@brainliest.com' }),
  TITAN_PASSWORD: str({ default: 'Um@ir7156' }),
  BASE_URL: str({ default: 'http://localhost:5000' }),
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
});

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isProduction: boolean = env.NODE_ENV === 'production';

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      const titanEmail = env.TITAN_EMAIL;
      const titanPassword = env.TITAN_PASSWORD;

      this.transporter = nodemailer.createTransport({
        host: 'smtp.titan.email',
        port: 587,
        secure: false, // Use STARTTLS
        auth: {
          user: titanEmail,
          pass: titanPassword,
        },
      });

      // Verify SMTP connection
      await this.transporter.verify();
      console.log('Email service initialized with Titan Mail');
    } catch (error) {
      console.error('Failed to initialize email service:', error);

      // Only use fallback in development
      if (!this.isProduction) {
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'unix',
          buffer: true,
        });
        console.log('Email service initialized in development mode (console logging)');
      } else {
        throw new Error('Failed to initialize Titan Mail transporter');
      }
    }
  }

  async sendAuthenticationCode(email: string, code: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    const htmlContent = this.generateAuthEmailHTML(code);
    const textContent = this.generateAuthEmailText(code);
    const senderAddress = env.TITAN_EMAIL;

    const mailOptions = {
      from: { name: 'Brainliest', address: senderAddress },
      to: email,
      subject: 'Your Brainliest Authentication Code',
      text: textContent,
      html: htmlContent,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);

      if (!this.isProduction && result.response && typeof result.response === 'string') {
        console.log('\n=== AUTHENTICATION EMAIL ===');
        console.log(`To: ${email}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log('Content:');
        console.log(textContent);
        console.log('=========================\n');
      }

      console.log(`Authentication email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send authentication email:', error);

      if (!this.isProduction) {
        console.log('\n=== EMAIL FALLBACK (Console Mode) ===');
        console.log(`🔐 Authentication Code for ${email}: ${code}`);
        console.log('Note: Email delivery failed, but you can use this code for testing');
        console.log('=====================================\n');
        return true; // Allow authentication in development
      }

      return false; // Fail in production
    }
  }

  async sendEmailVerification(email: string, token: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    const verificationUrl = `${env.BASE_URL}/verify-email?token=${token}`;
    const htmlContent = this.generateVerificationEmailHTML(verificationUrl);
    const textContent = this.generateVerificationEmailText(verificationUrl);
    const senderAddress = env.TITAN_EMAIL;

    const mailOptions = {
      from: { name: 'Brainliest', address: senderAddress },
      to: email,
      subject: 'Verify Your Brainliest Account',
      text: textContent,
      html: htmlContent,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);

      if (!this.isProduction && result.response && typeof result.response === 'string') {
        console.log('\n=== EMAIL VERIFICATION (Development Mode) ===');
        console.log(`📧 To: ${email}`);
        console.log(`🔗 Verification URL: ${verificationUrl}`);
        console.log(`📋 Token: ${token}`);
        console.log('==========================================\n');
      }

      console.log(`Email verification sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send email verification:', error);

      if (!this.isProduction) {
        console.log('\n=== EMAIL VERIFICATION FALLBACK (Development Mode) ===');
        console.log(`📧 To: ${email}`);
        console.log(`🔗 Verification URL: ${verificationUrl}`);
        console.log(`📋 Token: ${token}`);
        console.log('Note: Email delivery failed, but you can use this URL/token for testing');
        console.log('====================================================\n');
        return true; // Allow verification in development
      }

      return false; // Fail in production
    }
  }

  async sendPasswordReset(email: string, token: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    const resetUrl = `${env.BASE_URL}/reset-password?token=${token}`;
    const htmlContent = this.generatePasswordResetHTML(resetUrl);
    const textContent = this.generatePasswordResetText(resetUrl);
    const senderAddress = env.TITAN_EMAIL;

    const mailOptions = {
      from: { name: 'Brainliest', address: senderAddress },
      to: email,
      subject: 'Reset Your Brainliest Password',
      text: textContent,
      html: htmlContent,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);

      if (!this.isProduction && result.response && typeof result.response === 'string') {
        console.log('\n=== PASSWORD RESET ===');
        console.log(`To: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log('=====================\n');
      }

      console.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);

      if (!this.isProduction) {
        console.log(`\n🔗 Password Reset URL for ${email}: ${resetUrl}\n`);
        return true;
      }

      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Titan Mail SMTP connection verified');
      return true;
    } catch (error) {
      console.error('Email service connection test failed:', error);
      return false;
    }
  }

  async sendTestEmail(email: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    const senderAddress = env.TITAN_EMAIL;
    const mailOptions = {
      from: { name: 'Brainliest Test', address: senderAddress },
      to: email,
      subject: 'Titan Email Test - Brainliest Platform',
      text: `
BRAINLIEST - Test Email

This is a test email sent through Titan Mail service.

Sent to: ${email}
From: ${senderAddress}
Date: ${new Date().toISOString()}

If you received this email, the Titan Email configuration is working correctly!

---
Brainliest Platform
Powered by Titan Mail
      `,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Titan Email Test</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f9; color: #333333;">
  <table role="presentation" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 700;">🧠 Brainliest</h1>
        <p style="margin: 8px 0 0; font-size: 16px; color: #ffffff;">Titan Email Test</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1f2a44;">Email Service Test Successful</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">This test email confirms that your Titan Mail configuration is working correctly.</p>
        <table role="presentation" width="100%" style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <tr>
            <td style="font-size: 14px; line-height: 1.5;">
              <strong>Recipient:</strong> ${email}<br>
              <strong>Sender:</strong> ${senderAddress}<br>
              <strong>Service:</strong> Titan Mail (smtp.titan.email)<br>
              <strong>Date:</strong> ${new Date().toLocaleString()}
            </td>
          </tr>
        </table>
        <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #4caf50;">🎉 Your Brainliest platform can now send emails through Titan Mail.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280;">
        <p style="margin: 0;">Brainliest Platform | Powered by Titan Mail</p>
        <p style="margin: 8px 0 0;">Questions? Contact us at <a href="mailto:support@brainliest.com" style="color: #4f46e5; text-decoration: none;">support@brainliest.com</a></p>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Test email sent successfully to ${email}`);
      console.log(`📧 Message ID: ${result.messageId || 'N/A'}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      return false;
    }
  }

  private generateAuthEmailHTML(code: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Brainliest Authentication Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f9; color: #333333;">
  <table role="presentation" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 700;">🧠 Brainliest</h1>
        <p style="margin: 8px 0 0; font-size: 16px; color: #ffffff;">Your Authentication Code</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1f2a44;">Welcome to Brainliest!</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">Use the verification code below to complete your sign-in:</p>
        <table role="presentation" width="100%" style="background-color: #f9fafb; padding: 20px; border-radius: 6px; text-align: center; margin: 16px 0;">
          <tr>
            <td>
              <span style="font-size: 32px; font-weight: bold; font-family: 'Courier New', monospace; color: #4f46e5; letter-spacing: 4px;">${code}</span>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">This code expires in 10 minutes</p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" style="background-color: #fef3c7; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <tr>
            <td style="font-size: 14px; line-height: 1.5; color: #92400e;">
              <strong>🔒 Security Note:</strong> If you didn’t request this code, please ignore this email. Never share your verification code with anyone.
            </td>
          </tr>
        </table>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">Once verified, you'll have access to:</p>
        <ul style="margin: 0 0 16px; padding-left: 20px; font-size: 16px; line-height: 1.5;">
          <li>All practice exams and questions</li>
          <li>AI-powered explanations and help</li>
          <li>Detailed performance analytics</li>
          <li>Discussion forums and comments</li>
          <li>Personalized study recommendations</li>
        </ul>
        <p style="margin: 0; font-size: 16px; line-height: 1.5;">Ready to boost your exam preparation? Enter your code now!</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280;">
        <p style="margin: 0;">Brainliest - Your Ultimate Exam Preparation Platform</p>
        <p style="margin: 8px 0 0;">Questions? Contact us at <a href="mailto:support@brainliest.com" style="color: #4f46e5; text-decoration: none;">support@brainliest.com</a></p>
        <p style="margin: 8px 0 0;">If you didn’t sign up for Brainliest, please ignore this email.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
  }

  private generateAuthEmailText(code: string): string {
    return `
BRAINLIEST - Authentication Code

Welcome to Brainliest!

Your verification code is: ${code}

This code expires in 10 minutes.

Enter this code to complete your sign-in and unlock access to:
- All practice exams and questions
- AI-powered explanations and help
- Detailed performance analytics
- Discussion forums and comments
- Personalized study recommendations

Security Note: If you didn’t request this code, please ignore this email. Never share your verification code with anyone.

Questions? Contact us at support@brainliest.com

---
Brainliest - Your Ultimate Exam Preparation Platform
`;
  }

  private generateVerificationEmailHTML(verificationUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Brainliest Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f9; color: #333333;">
  <table role="presentation" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 700;">🧠 Brainliest</h1>
        <p style="margin: 8px 0 0; font-size: 16px; color: #ffffff;">Verify Your Account</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1f2a44;">Welcome to Brainliest!</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">Thank you for creating your account. Please verify your email address by clicking the button below:</p>
        <table role="presentation" width="100%" style="text-align: center; margin: 16px 0;">
          <tr>
            <td>
              <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">Verify My Account</a>
            </td>
          </tr>
        </table>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">Or copy and paste this link into your browser:</p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280; background-color: #f9fafb; padding: 12px; border-radius: 6px; word-break: break-all;">${verificationUrl}</p>
        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b7280;">This verification link expires in 24 hours.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280;">
        <p style="margin: 0;">Brainliest - Your Ultimate Exam Preparation Platform</p>
        <p style="margin: 8px 0 0;">If you didn’t create this account, please ignore this email.</p>
        <p style="margin: 8px 0 0;">Questions? Contact us at <a href="mailto:support@brainliest.com" style="color: #4f46e5; text-decoration: none;">support@brainliest.com</a></p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
  }

  private generateVerificationEmailText(verificationUrl: string): string {
    return `
BRAINLIEST - Verify Your Account

Welcome to Brainliest!

Thank you for creating your account. To get started, please verify your email address by visiting this link:

${verificationUrl}

This verification link expires in 24 hours.

If you didn’t create this account, please ignore this email.

Questions? Contact us at support@brainliest.com

---
Brainliest - Your Ultimate Exam Preparation Platform
`;
  }

  private generatePasswordResetHTML(resetUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Brainliest Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f9; color: #333333;">
  <table role="presentation" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 700;">🧠 Brainliest</h1>
        <p style="margin: 8px 0 0; font-size: 16px; color: #ffffff;">Password Reset Request</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1f2a44;">Reset Your Password</h2>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">We received a request to reset your password. Click the button below to create a new password:</p>
        <table role="presentation" width="100%" style="text-align: center; margin: 16px 0;">
          <tr>
            <td>
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">Reset My Password</a>
            </td>
          </tr>
        </table>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">Or copy and paste this link into your browser:</p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280; background-color: #f9fafb; padding: 12px; border-radius: 6px; word-break: break-all;">${resetUrl}</p>
        <table role="presentation" width="100%" style="background-color: #fef3c7; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <tr>
            <td style="font-size: 14px; line-height: 1.5; color: #92400e;">
              <strong>🔒 Security Note:</strong> This password reset link expires in 1 hour. If you didn’t request this reset, please ignore this email and your password will remain unchanged.
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280;">
        <p style="margin: 0;">Brainliest - Your Ultimate Exam Preparation Platform</p>
        <p style="margin: 8px 0 0;">If you have security concerns, contact us at <a href="mailto:security@brainliest.com" style="color: #4f46e5; text-decoration: none;">security@brainliest.com</a></p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
  }

  private generatePasswordResetText(resetUrl: string): string {
    return `
BRAINLIEST - Password Reset Request

We received a request to reset your password.

To create a new password, visit this link:

${resetUrl}

This password reset link expires in 1 hour.

Security Note: If you didn’t request this reset, please ignore this email and your password will remain unchanged.

If you have security concerns, contact us at security@brainliest.com

---
Brainliest - Your Ultimate Exam Preparation Platform
`;
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default EmailService;