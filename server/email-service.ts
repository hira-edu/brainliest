import nodemailer from 'nodemailer';

// Email service using Gmail SMTP (forever free)
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Check for Gmail credentials
      const gmailUser = process.env.GMAIL_USER;
      const gmailPassword = process.env.GMAIL_APP_PASSWORD;

      if (gmailUser && gmailPassword) {
        // Use Gmail SMTP (free forever)
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailPassword, // App password, not regular password
          },
        });
        console.log('Email service initialized with Gmail SMTP');
      } else {
        // Fallback to console logging for development
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'unix',
          buffer: true,
        });
        console.log('Email service initialized in development mode (console logging)');
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      // Create a dummy transporter that logs to console
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

    const mailOptions = {
      from: {
        name: 'Brainliest',
        address: process.env.GMAIL_USER || 'noreply@brainliest.com'
      },
      to: email,
      subject: 'Your Brainliest Authentication Code',
      text: textContent,
      html: htmlContent,
    };

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
      return false;
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
}

export const emailService = new EmailService();