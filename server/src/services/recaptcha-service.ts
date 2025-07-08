export interface RecaptchaVerificationResult {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  challenge_ts?: string;
  'error-codes'?: string[];
}

export class RecaptchaService {
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.RECAPTCHA_SECRET_KEY || '';
    if (!this.secretKey) {
      console.warn('RECAPTCHA_SECRET_KEY not found in environment variables');
    }
  }

  async verifyToken(token: string, expectedAction?: string): Promise<RecaptchaVerificationResult> {
    if (!this.secretKey) {
      console.warn('reCAPTCHA verification skipped - no secret key configured');
      return { success: true }; // Allow requests when reCAPTCHA is not configured
    }

    if (!token) {
      console.warn('reCAPTCHA verification failed - no token provided');
      return { success: false, 'error-codes': ['missing-input-response'] };
    }

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: this.secretKey,
          response: token,
        }),
      });

      const result: RecaptchaVerificationResult = await response.json();

      // For reCAPTCHA v3, check the score and action
      if (result.success) {
        // reCAPTCHA v3 score should be above 0.5 for legitimate users
        if (result.score !== undefined && result.score < 0.5) {
          console.warn(`reCAPTCHA score too low: ${result.score}`);
          return { success: false, 'error-codes': ['low-score'] };
        }

        // Verify the action matches what we expected
        if (expectedAction && result.action !== expectedAction) {
          console.warn(`reCAPTCHA action mismatch: expected ${expectedAction}, got ${result.action}`);
          return { success: false, 'error-codes': ['action-mismatch'] };
        }

        console.log(`reCAPTCHA verification successful. Score: ${result.score}, Action: ${result.action}`);
      } else {
        console.warn('reCAPTCHA verification failed:', result['error-codes']);
      }

      return result;
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return { success: false, 'error-codes': ['verification-failed'] };
    }
  }

  isConfigured(): boolean {
    return !!this.secretKey;
  }
}

export const recaptchaService = new RecaptchaService();