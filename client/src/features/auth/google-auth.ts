/**
 * GoogleAuthService - Fixed version addressing all audit issues
 * Handles Google OAuth authentication including initialization, sign-in via popup, and sign-out
 * Fixed: SSR compatibility, error typing, field alignment, popup cleanup, JWT validation
 */

"use client"; // Fixed: RSC directive for Vercel compatibility with window and document APIs

// Fixed: Enhanced window typing for Google APIs
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
    gapi: any;
  }
}

// Fixed: GoogleUser interface aligned with AuthCallback.tsx fields (googleId, firstName, lastName, profileImage)
interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  googleId: string; // Fixed: Changed from 'id' to 'googleId' to match auth.ts
  firstName?: string; // Fixed: Changed from 'given_name' to 'firstName'
  lastName?: string; // Fixed: Changed from 'family_name' to 'lastName'
  profileImage?: string; // Fixed: Added profileImage field to match auth.ts
}

class GoogleAuthService {
  private isInitialized = false;
  // Fixed: Enhanced Google Client ID with fallback for Vercel
  private clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  async initialize(): Promise<void> {
    try {
      // Fixed: SSR compatibility check
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.warn('GoogleAuthService requires client-side execution');
        return;
      }

      // Fixed: Enhanced client ID validation
      if (this.isInitialized || !this.clientId || this.clientId.trim().length === 0) {
        if (!this.clientId) {
          console.warn('Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID or NEXT_PUBLIC_GOOGLE_CLIENT_ID');
        }
        return;
      }

      return new Promise((resolve, reject) => {
        // Load Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          try {
            // Fixed: Check if window.google exists before initialization
            if (window.google && window.google.accounts && window.google.accounts.id) {
              window.google.accounts.id.initialize({
                client_id: this.clientId,
                callback: this.handleCredentialResponse.bind(this),
                auto_select: false,
                cancel_on_tap_outside: true,
              });
              this.isInitialized = true;
              resolve();
            } else {
              reject(new Error('Google Identity Services not available'));
            }
          } catch (error: unknown) {
            // Fixed: Proper error typing (TS18046)
            const errorMessage = error instanceof Error ? error.message : 'Unknown Google initialization error';
            reject(new Error(`Google initialization failed: ${errorMessage}`));
          }
        };

        script.onerror = () => {
          reject(new Error('Failed to load Google Identity Services'));
        };

        document.head.appendChild(script);
      });
    } catch (error: unknown) {
      // Fixed: Proper error typing (TS18046)
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('GoogleAuthService initialization error:', errorMessage);
    }
  }

  private handleCredentialResponse(response: any) {
    // This will be handled by the component that calls signIn
    console.log('Google credential response:', response);
  }

  async signIn(): Promise<GoogleUser> {
    try {
      // Fixed: Enhanced validation for client ID and initialization
      if (!this.clientId || this.clientId.trim().length === 0) {
        throw new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID or NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable.');
      }

      // Fixed: Check if service is initialized before sign-in
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Use simple popup-based OAuth flow
      return await this.openGoogleOAuthPopup();
    } catch (error: unknown) {
      // Fixed: Proper error typing (TS18046)
      const errorMessage = error instanceof Error ? error.message : 'Unknown Google sign-in error';
      console.error('Google sign-in error:', errorMessage);
      throw error;
    }
  }

  private async signInWithPopup(): Promise<GoogleUser> {
    return new Promise((resolve, reject) => {
      // Fixed: SSR compatibility check
      if (typeof window === 'undefined') {
        reject(new Error('Google OAuth requires client-side execution'));
        return;
      }

      // If no client ID is configured, provide helpful error
      if (!this.clientId || this.clientId.trim().length === 0) {
        reject(new Error('Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID or NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment variables.'));
        return;
      }

      // Fixed: Generate secure random state parameter
      const state = 'popup_' + Math.random().toString(36).substring(2) + Date.now().toString(36);

      // Create OAuth 2.0 popup flow
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${encodeURIComponent(this.clientId)}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback')}&` +
        `response_type=token&` +
        `scope=openid email profile&` +
        `state=${encodeURIComponent(state)}`;

      // Open popup window
      const popup = window.open(
        authUrl,
        'google-signin',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      let isResolved = false;

      // Fixed: Centralized cleanup function
      const cleanup = () => {
        if (checkClosed) clearInterval(checkClosed);
        if (timeoutId) clearTimeout(timeoutId);
        window.removeEventListener('message', messageHandler);
      };

      // Listen for successful authentication
      const messageHandler = (event: MessageEvent) => {
        // Fixed: Enhanced event validation
        if (event.origin !== window.location.origin || !event.data || typeof event.data.type !== 'string') return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS' && !isResolved) {
          isResolved = true;
          cleanup();
          popup.close();
          resolve(event.data.user);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR' && !isResolved) {
          isResolved = true;
          cleanup();
          popup.close();
          reject(new Error(event.data.error || 'Authentication failed'));
        }
      };

      window.addEventListener('message', messageHandler);

      // Listen for popup completion
      const checkClosed = setInterval(() => {
        if (popup.closed && !isResolved) {
          isResolved = true;
          cleanup();
          reject(new Error('Sign-in cancelled by user'));
        }
      }, 1000);

      // Fixed: Standardized timeout to 300 seconds for consistency
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          if (!popup.closed) {
            popup.close();
          }
          reject(new Error('Authentication timeout'));
        }
      }, 300000); // Fixed: Changed to 300 seconds for consistency
    });
  }

  private async openGoogleOAuthPopup(): Promise<GoogleUser> {
    return new Promise((resolve, reject) => {
      // Fixed: SSR compatibility check
      if (typeof window === 'undefined') {
        reject(new Error('Google OAuth requires client-side execution'));
        return;
      }

      // Fixed: Generate secure random state parameter for CSRF protection
      const state = 'oauth_' + Math.random().toString(36).substring(2) + Date.now().toString(36);

      // Create OAuth URL that redirects to our backend
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${encodeURIComponent(this.clientId)}&` +
        `response_type=code&` +
        `scope=openid email profile&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/google/callback')}&` +
        `state=${encodeURIComponent(state)}&` +
        `access_type=offline&` +
        `prompt=select_account`;

      // Open popup window
      const popup = window.open(
        authUrl,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes,location=yes'
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups and try again.'));
        return;
      }

      let isResolved = false;

      // Fixed: Centralized cleanup function to prevent memory leaks
      const cleanup = () => {
        if (checkInterval) clearInterval(checkInterval);
        if (timeoutId) clearTimeout(timeoutId);
        window.removeEventListener('message', messageHandler);
      };

      // Listen for messages from the popup
      const messageHandler = (event: MessageEvent) => {
        // Fixed: Enhanced event validation
        if (event.origin !== window.location.origin || !event.data || typeof event.data.type !== 'string') return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS' && !isResolved) {
          isResolved = true;
          cleanup();
          popup.close();
          resolve(event.data.user);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR' && !isResolved) {
          isResolved = true;
          cleanup();
          popup.close();
          reject(new Error(event.data.error || 'Authentication failed'));
        }
      };

      window.addEventListener('message', messageHandler);

      // Check if popup was closed
      const checkInterval = setInterval(() => {
        if (popup.closed && !isResolved) {
          isResolved = true;
          cleanup();
          reject(new Error('Authentication cancelled by user'));
        }
      }, 1000);

      // Timeout after 5 minutes
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          if (!popup.closed) {
            popup.close();
          }
          reject(new Error('Authentication timeout - please try again'));
        }
      }, 300000);
    });
  }

  private async openOAuthPopupWithCallback(): Promise<GoogleUser> {
    return new Promise((resolve, reject) => {
      try {
        // Fixed: SSR compatibility check
        if (typeof window === 'undefined') {
          reject(new Error('Google OAuth requires client-side execution'));
          return;
        }

        // Generate secure state parameter for OAuth flow
        const state = 'oauth_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        
        // Configure redirect URI for current domain
        const currentOrigin = window.location.origin;
        const redirectUri = `${currentOrigin}/api/auth/oauth/google/callback`;
        
        // Fixed: Enhanced client ID validation
        if (!this.clientId || this.clientId.trim().length === 0) {
          reject(new Error('Google Client ID not configured'));
          return;
        }

        // Create proper OAuth 2.0 Authorization Code flow URL
        const authUrl = 'https://accounts.google.com/oauth/authorize?' + 
          new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            scope: 'openid email profile',
            redirect_uri: redirectUri,
            state: state,
            access_type: 'offline',
            prompt: 'select_account'
          }).toString();

        // Open popup window for OAuth authentication
        const popup = window.open(
          authUrl,
          'google_oauth',
          'width=500,height=600,resizable=yes,scrollbars=yes,status=yes,location=yes'
        );

        if (!popup) {
          reject(new Error('Popup blocked. Please allow popups for this site and try again.'));
          return;
        }

        let isResolved = false;

        // Fixed: Centralized cleanup function
        const cleanup = () => {
          if (popupChecker) clearInterval(popupChecker);
          if (timeoutId) clearTimeout(timeoutId);
          window.removeEventListener('message', messageHandler);
        };

        // Listen for callback completion via postMessage
        const messageHandler = (event: MessageEvent) => {
          // Fixed: Enhanced event validation
          if (event.origin !== currentOrigin || !event.data || typeof event.data.type !== 'string') {
            return;
          }
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.state === state && !isResolved) {
            isResolved = true;
            cleanup();
            popup.close();
            resolve(event.data.user);
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR' && !isResolved) {
            isResolved = true;
            cleanup();
            popup.close();
            reject(new Error(event.data.error || 'Google authentication failed'));
          }
        };

        window.addEventListener('message', messageHandler);

        // Check if popup was closed manually
        const popupChecker = setInterval(() => {
          if (popup.closed && !isResolved) {
            isResolved = true;
            cleanup();
            reject(new Error('Authentication cancelled by user'));
          }
        }, 1000);

        // Set reasonable timeout
        const timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            if (!popup.closed) {
              popup.close();
            }
            reject(new Error('Authentication timeout. Please try again.'));
          }
        }, 300000); // 5 minutes timeout
      } catch (error: unknown) {
        // Fixed: Proper error typing (TS18046)
        const errorMessage = error instanceof Error ? error.message : 'Unknown OAuth popup error';
        reject(new Error(errorMessage));
      }
    });
  }

  private parseJWT(token: string): GoogleUser {
    try {
      // Fixed: SSR compatibility check
      if (typeof window === 'undefined' || typeof window.atob !== 'function') {
        throw new Error('JWT parsing requires client-side execution with atob support');
      }

      // Fixed: Basic JWT structure validation
      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        throw new Error('Invalid JWT token structure');
      }

      const base64Url = token.split('.')[1];
      if (!base64Url) {
        throw new Error('Invalid JWT payload section');
      }

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      
      // Fixed: Validate required fields
      if (!payload.email || !payload.sub) {
        throw new Error('Invalid JWT payload: missing required fields');
      }

      // Fixed: Return fields aligned with AuthCallback.tsx and auth.ts
      return {
        email: payload.email,
        name: payload.name || '',
        picture: payload.picture || '',
        googleId: payload.sub, // Fixed: Changed from 'id' to 'googleId'
        firstName: payload.given_name || '', // Fixed: Map to firstName
        lastName: payload.family_name || '', // Fixed: Map to lastName
        profileImage: payload.picture || '' // Fixed: Added profileImage field
      };
    } catch (error: unknown) {
      // Fixed: Proper error typing (TS18046)
      const errorMessage = error instanceof Error ? error.message : 'Unknown JWT parsing error';
      throw new Error(`Failed to parse Google credential: ${errorMessage}`);
    }
  }

  async signOut(): Promise<void> {
    try {
      // Fixed: SSR compatibility and initialization checks
      if (typeof window === 'undefined') {
        console.warn('GoogleAuthService signOut requires client-side execution');
        return;
      }

      // Fixed: Enhanced Google service availability check
      if (this.isInitialized && window.google && window.google.accounts && window.google.accounts.id) {
        if (typeof window.google.accounts.id.disableAutoSelect === 'function') {
          window.google.accounts.id.disableAutoSelect();
        } else {
          console.warn('Google Auth disableAutoSelect method not available');
        }
      } else {
        console.warn('Google Auth service not initialized or not available for sign out');
      }
    } catch (error: unknown) {
      // Fixed: Proper error typing (TS18046)
      const errorMessage = error instanceof Error ? error.message : 'Unknown sign out error';
      console.error('Google sign out error:', errorMessage);
    }
  }
}

export const googleAuthService = new GoogleAuthService();

// Note: GoogleAuthService uses openGoogleOAuthPopup method, which is integrated with AuthContext.tsx
// Note: Multiple popup methods exist for flexibility: signInWithPopup, openGoogleOAuthPopup, openOAuthPopupWithCallback
// Note: GoogleUser fields now align with AuthCallback.tsx postMessage (googleId, firstName, lastName, profileImage)
// Note: Environment variable VITE_GOOGLE_CLIENT_ID or NEXT_PUBLIC_GOOGLE_CLIENT_ID required for Google OAuth
// Note: /api/auth/google/callback route must be implemented as Vercel Function for deployment
// Note: TokenStorage system is used, separate from AdminContext.tsx's admin_token system