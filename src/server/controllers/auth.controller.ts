import { ApiRequest, ApiResponse } from '../types/api';
import { authService, LoginResult, RegisterResult } from '../services/auth.service';
import { ServerCookieService } from '../services/cookie.service';

export class AuthController {
  async register(req: ApiRequest, res: ApiResponse) {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const result: RegisterResult = await authService.register(
        email,
        password,
        req.ip,
        req.get('User-Agent'),
        { firstName, lastName }
      );

      if (result.success && result.user) {
        // Set secure authentication cookies
        ServerCookieService.setAuthCookie(res, 'authToken', result.accessToken!);
        ServerCookieService.setRefreshTokenCookie(res, result.refreshToken!);
        
        res.json({
          success: true,
          user: result.user,
          message: result.message,
          requiresEmailVerification: result.requiresEmailVerification
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }

  async login(req: ApiRequest, res: ApiResponse) {
    try {
      const { email, password } = req.body;
      
      const result: LoginResult = await authService.login(
        email,
        password,
        req.ip,
        req.get('User-Agent')
      );

      if (result.success && result.user) {
        // Set secure authentication cookies
        ServerCookieService.setAuthCookie(res, 'authToken', result.accessToken!);
        ServerCookieService.setRefreshTokenCookie(res, result.refreshToken!);
        
        res.json({
          success: true,
          user: result.user,
          message: result.message
        });
      } else {
        res.status(result.accountLocked ? 423 : 401).json({
          success: false,
          message: result.message,
          accountLocked: result.accountLocked,
          lockoutExpires: result.lockoutExpires
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  async logout(req: ApiRequest, res: ApiResponse) {
    try {
      const token = ServerCookieService.getCookie(req, 'authToken');
      
      if (token) {
        await authService.logout(token);
      }
      
      // Clear authentication cookies
      ServerCookieService.clearAuthCookies(res);
      
      res.json({
        success: true,
        message: 'Successfully logged out'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during logout'
      });
    }
  }

  async verifyEmail(req: ApiRequest, res: ApiResponse) {
    try {
      const { token } = req.body;
      
      const result = await authService.verifyEmail(token);
      
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during email verification'
      });
    }
  }

  async requestPasswordReset(req: ApiRequest, res: ApiResponse) {
    try {
      const { email } = req.body;
      
      const result = await authService.requestPasswordReset(
        email,
        req.ip,
        req.get('User-Agent')
      );
      
      res.json(result);
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing password reset request'
      });
    }
  }

  async resetPassword(req: ApiRequest, res: ApiResponse) {
    try {
      const { token, newPassword } = req.body;
      
      const result = await authService.resetPassword(token, newPassword);
      
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during password reset'
      });
    }
  }
}

export const authController = new AuthController();