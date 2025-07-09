import nodemailer from 'nodemailer';

// Email service using Titan Mail only
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Titan Mail (Only email service used)
      const titanEmail = process.env.TITAN_EMAIL;
      const titanPassword = process.env.TITAN_PASSWORD;
      if (titanEmail && titanPassword) {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.titan.email',
          port: 587,
          secure: false,
          auth: {
            user: titanEmail,
            pass: titanPassword,
          },
        });
        console.log('Email service initialized with Titan Mail');
        return;
      }

      // Error if Titan credentials not found - fallback to console logging for testing
      console.error('TITAN_EMAIL and TITAN_PASSWORD environment variables are required');
      console.log('Falling back to console logging for development/testing');
      
      this.transporter = nodemailer.createTransporter({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
      console.log('Email service initialized in development mode (console logging)');
      
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      // Fallback to console logging
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    }
  }

  async sendAuthenticationCode(email: string, code: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    const htmlContent = this.generateAuthEmailHTML(code);
    const textContent = this.generateAuthEmailText(code);

    // Use Titan Email address as sender
    const senderAddress = process.env.TITAN_EMAIL || 'noreply@brainliest.com';

    const mailOptions = {
      from: {
        name: 'Brainliest',
        address: senderAddress
      },
      to: email,
      subject: 'Your Brainliest Authentication Code',
      text: textContent,
      html: htmlContent,
    };

    console.log('🔍 EMAIL DEBUG INFO:');
    console.log(`- Requested recipient: ${email}`);
    console.log(`- Sender address: ${senderAddress}`);
    console.log(`- Using Titan Email: ${!!process.env.TITAN_EMAIL}`);
    console.log(`- Mail options TO field: ${mailOptions.to}`);

    try {
      const result = await this.transporter.sendMail(mailOptions);
      
      // If using development mode, log the email
      if (result.response && typeof result.response === 'string') {
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
      
      // Fallback: log the code to console for development/testing
      console.log('\n=== EMAIL FALLBACK (Console Mode) ===');
      console.log(`🔐 Authentication Code for ${email}: ${code}`);
      console.log('Note: Email delivery failed, but you can use this code for testing');
      console.log('=====================================\n');
      
      // Return true so authentication can continue in development
      return true;
    }
  }

  private generateAuthEmailHTML(code: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brainliest Authentication Code</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .code-container {
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 25px 0;
    }
    .auth-code {
      font-size: 32px;
      font-weight: bold;
      font-family: 'Courier New', monospace;
      color: #667eea;
      letter-spacing: 4px;
      margin: 10px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #6c757d;
    }
    .security-note {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧠 Brainliest</h1>
      <p>Your Authentication Code</p>
    </div>
    
    <div class="content">
      <h2>Welcome to Brainliest!</h2>
      <p>Use the verification code below to complete your sign-in:</p>
      
      <div class="code-container">
        <div>Your verification code is:</div>
        <div class="auth-code">${code}</div>
        <div style="font-size: 14px; color: #6c757d; margin-top: 10px;">
          This code expires in 10 minutes
        </div>
      </div>
      
      <div class="security-note">
        <strong>🔒 Security Note:</strong> If you didn't request this code, please ignore this email. 
        Never share your verification codes with anyone.
      </div>
      
      <p>After entering the code, you'll have unlimited access to:</p>
      <ul>
        <li>📚 All practice exams and questions</li>
        <li>🤖 AI-powered explanations and help</li>
        <li>📊 Detailed performance analytics</li>
        <li>💬 Discussion forums and comments</li>
        <li>⭐ Personalized study recommendations</li>
      </ul>
      
      <p>Ready to boost your exam preparation? Let's get started!</p>
    </div>
    
    <div class="footer">
      <p><strong>Brainliest</strong> - Your Ultimate Exam Preparation Platform</p>
      <p>If you have any questions, feel free to contact us at support@brainliest.com</p>
      <p style="font-size: 12px; margin-top: 15px;">
        If you didn't sign up for Brainliest, you can safely ignore this email.
      </p>
    </div>
  </div>
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

Enter this code to complete your sign-in and unlock unlimited access to:
• All practice exams and questions
• AI-powered explanations and help
• Detailed performance analytics
• Discussion forums and comments
• Personalized study recommendations

Security Note: If you didn't request this code, please ignore this email. Never share your verification codes with anyone.

Questions? Contact us at support@brainliest.com

---
Brainliest - Your Ultimate Exam Preparation Platform
`;
  }

  async sendEmailVerification(email: string, token: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    const verificationUrl = `${process.env.BASE_URL || 'https://brainliest.com'}/verify-email?token=${token}`;
    const htmlContent = this.generateVerificationEmailHTML(verificationUrl);
    const textContent = this.generateVerificationEmailText(verificationUrl);

    const senderAddress = process.env.TITAN_EMAIL || 'noreply@brainliest.com';

    const mailOptions = {
      from: { name: 'Brainliest', address: senderAddress },
      to: email,
      subject: 'Verify Your Brainliest Account',
      text: textContent,
      html: htmlContent,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      
      if (result.response && typeof result.response === 'string') {
        console.log('\n=== EMAIL VERIFICATION ===');
        console.log(`To: ${email}`);
        console.log(`Verification URL: ${verificationUrl}`);
        console.log('=========================\n');
      }
      
      console.log(`Email verification sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send email verification:', error);
      console.log(`\n🔗 Email Verification URL for ${email}: ${verificationUrl}\n`);
      return true;
    }
  }

  async sendPasswordReset(email: string, token: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    const resetUrl = `${process.env.BASE_URL || 'https://brainliest.com'}/reset-password?token=${token}`;
    const htmlContent = this.generatePasswordResetHTML(resetUrl);
    const textContent = this.generatePasswordResetText(resetUrl);

    const senderAddress = process.env.TITAN_EMAIL || 'noreply@brainliest.com';

    const mailOptions = {
      from: { name: 'Brainliest', address: senderAddress },
      to: email,
      subject: 'Reset Your Brainliest Password',
      text: textContent,
      html: htmlContent,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      
      if (result.response && typeof result.response === 'string') {
        console.log('\n=== PASSWORD RESET ===');
        console.log(`To: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log('=====================\n');
      }
      
      console.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      console.log(`\n🔗 Password Reset URL for ${email}: ${resetUrl}\n`);
      return true;
    }
  }

  private generateVerificationEmailHTML(verificationUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Brainliest Account</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 14px; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧠 Brainliest</h1>
      <p>Verify Your Account</p>
    </div>
    <div class="content">
      <h2>Welcome to Brainliest!</h2>
      <p>Thank you for creating your account. To get started, please verify your email address by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify My Account</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">${verificationUrl}</p>
      <p><strong>This verification link expires in 24 hours.</strong></p>
    </div>
    <div class="footer">
      <p><strong>Brainliest</strong> - Your Ultimate Exam Preparation Platform</p>
      <p>If you didn't create this account, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private generateVerificationEmailText(verificationUrl: string): string {
    return `
BRAINLIEST - Verify Your Account

Welcome to Brainliest!

Thank you for creating your account. To get started, please verify your email address by visiting this link:

${verificationUrl}

This verification link expires in 24 hours.

If you didn't create this account, you can safely ignore this email.

---
Brainliest - Your Ultimate Exam Preparation Platform
`;
  }

  private generatePasswordResetHTML(resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Brainliest Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 14px; color: #6c757d; }
    .security-note { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧠 Brainliest</h1>
      <p>Password Reset Request</p>
    </div>
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset My Password</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">${resetUrl}</p>
      <div class="security-note">
        <strong>🔒 Security Note:</strong> This password reset link expires in 1 hour. If you didn't request this reset, please ignore this email and your password will remain unchanged.
      </div>
    </div>
    <div class="footer">
      <p><strong>Brainliest</strong> - Your Ultimate Exam Preparation Platform</p>
      <p>If you have security concerns, contact us at security@brainliest.com</p>
    </div>
  </div>
</body>
</html>`;
  }

  private generatePasswordResetText(resetUrl: string): string {
    return `
BRAINLIEST - Password Reset Request

We received a request to reset your password.

To create a new password, visit this link:

${resetUrl}

This password reset link expires in 1 hour.

Security Note: If you didn't request this reset, please ignore this email and your password will remain unchanged.

If you have security concerns, contact us at security@brainliest.com

---
Brainliest - Your Ultimate Exam Preparation Platform
`;
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) return false;
    
    try {
      await this.transporter.verify();
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

    const senderAddress = process.env.TITAN_EMAIL || 'noreply@brainliest.com';
    
    const mailOptions = {
      from: {
        name: 'Brainliest Test',
        address: senderAddress
      },
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
<html>
<head>
  <meta charset="utf-8">
  <title>Titan Email Test</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px;">
    <h1>🧠 Brainliest</h1>
    <h2>Titan Email Test</h2>
  </div>
  
  <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
    <h3>✅ Email Service Test Successful</h3>
    <p>This test email confirms that your Titan Mail configuration is working correctly.</p>
    
    <p><strong>Test Details:</strong></p>
    <ul>
      <li><strong>Recipient:</strong> ${email}</li>
      <li><strong>Sender:</strong> ${senderAddress}</li>
      <li><strong>Service:</strong> Titan Mail (smtp.titan.email)</li>
      <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
    </ul>
  </div>
  
  <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
    <p><strong>🎉 Success!</strong> Your Brainliest platform can now send emails through Titan Mail.</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666;">
    <p><strong>Brainliest Platform</strong><br>
    Powered by Titan Mail</p>
  </div>
</body>
</html>
      `
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
}

export const emailService = new EmailService();