declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  id: string;
  given_name?: string;
  family_name?: string;
}

class GoogleAuthService {
  private isInitialized = false;
  private clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  async initialize(): Promise<void> {
    if (this.isInitialized || !this.clientId) {
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
          window.google.accounts.id.initialize({
            client_id: this.clientId,
            callback: this.handleCredentialResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };

      document.head.appendChild(script);
    });
  }

  private handleCredentialResponse(response: any) {
    // This will be handled by the component that calls signIn
    console.log('Google credential response:', response);
  }

  async signIn(): Promise<GoogleUser> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.clientId) {
      throw new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID environment variable.');
    }

    // Use proper OAuth 2.0 Authorization Code flow with server callback
    return this.openOAuthPopupWithCallback();
  }

  private async signInWithPopup(): Promise<GoogleUser> {
    return new Promise((resolve, reject) => {
      // If no client ID is configured, provide helpful error
      if (!this.clientId) {
        reject(new Error('Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your environment variables.'));
        return;
      }

      // Create OAuth 2.0 popup flow
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${this.clientId}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback')}&` +
        `response_type=token&` +
        `scope=openid email profile&` +
        `state=popup`;

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

      // Listen for popup completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('Sign-in cancelled by user'));
        }
      }, 1000);

      // Listen for successful authentication
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup.close();
          resolve(event.data.user);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup.close();
          reject(new Error(event.data.error || 'Authentication failed'));
        }
      };

      window.addEventListener('message', messageHandler);

      // Fallback timeout
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          reject(new Error('Authentication timeout'));
        }
      }, 60000); // 60 second timeout
    });
  }

  private async openGoogleOAuthPopup(): Promise<GoogleUser> {
    return new Promise((resolve, reject) => {
      // Use Google's OAuth 2.0 implicit flow for direct authentication
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${this.clientId}&` +
        `response_type=id_token&` +
        `scope=openid email profile&` +
        `redirect_uri=${encodeURIComponent('https://developers.google.com/oauthplayground')}&` +
        `nonce=${Date.now()}&` +
        `state=popup_auth`;

      // Open popup window
      const popup = window.open(
        authUrl,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups and try again.'));
        return;
      }

      // Monitor popup for completion
      const checkInterval = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkInterval);
            reject(new Error('Authentication cancelled by user'));
            return;
          }

          // Check if popup URL contains an ID token (limited by CORS)
          const url = popup.location.href;
          if (url.includes('id_token=')) {
            clearInterval(checkInterval);
            popup.close();
            
            // Parse the ID token from URL
            const urlParams = new URLSearchParams(url.split('#')[1]);
            const idToken = urlParams.get('id_token');
            
            if (idToken) {
              const userInfo = this.parseJWT(idToken);
              resolve(userInfo);
            } else {
              reject(new Error('Failed to get authentication token'));
            }
          }
        } catch (e) {
          // Expected - cross-origin restrictions
        }
      }, 1000);

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error('Authentication timeout - please try again'));
      }, 120000);
    });
  }

  private async openOAuthPopupWithCallback(): Promise<GoogleUser> {
    return new Promise((resolve, reject) => {
      // Generate secure state parameter
      const state = 'oauth_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      // Get current domain for proper redirect URI
      const currentOrigin = window.location.origin;
      const redirectUri = `${currentOrigin}/api/auth/oauth/google/callback`;
      
      // Create proper OAuth 2.0 Authorization Code flow URL
      const authUrl = 'https://accounts.google.com/oauth/authorize?' + 
        new URLSearchParams({
          client_id: this.clientId!,
          response_type: 'code',
          scope: 'openid email profile',
          redirect_uri: redirectUri,
          state: state,
          access_type: 'offline',
          prompt: 'select_account'
        }).toString();

      console.log('🔗 Opening Google OAuth with:', {
        clientId: this.clientId?.substring(0, 20) + '...',
        redirectUri,
        authUrl: authUrl.substring(0, 100) + '...'
      });

      // Open popup window
      const popup = window.open(
        authUrl,
        'google_oauth',
        'width=500,height=600,resizable=yes,scrollbars=yes,status=yes,location=yes'
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site and try again.'));
        return;
      }

      // Listen for callback completion via postMessage
      const messageHandler = (event: MessageEvent) => {
        console.log('📩 Received postMessage:', event.origin, event.data);
        
        // Verify origin for security
        if (event.origin !== currentOrigin) {
          console.warn('⚠️ Ignoring message from unauthorized origin:', event.origin);
          return;
        }
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.state === state) {
          clearInterval(popupChecker);
          window.removeEventListener('message', messageHandler);
          popup.close();
          
          console.log('✅ Google authentication successful:', event.data.user);
          resolve(event.data.user);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(popupChecker);
          window.removeEventListener('message', messageHandler);
          popup.close();
          
          console.error('❌ Google authentication error:', event.data);
          reject(new Error(event.data.error || 'Google authentication failed'));
        }
      };

      window.addEventListener('message', messageHandler);

      // Check if popup was closed manually
      const popupChecker = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupChecker);
          window.removeEventListener('message', messageHandler);
          reject(new Error('Authentication cancelled by user'));
        }
      }, 1000);

      // Set reasonable timeout
      setTimeout(() => {
        clearInterval(popupChecker);
        window.removeEventListener('message', messageHandler);
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error('Authentication timeout. Please try again.'));
      }, 300000); // 5 minutes timeout
    });
  }

  private parseJWT(token: string): GoogleUser {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      
      return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        id: payload.sub,
        given_name: payload.given_name,
        family_name: payload.family_name
      };
    } catch (error) {
      throw new Error('Failed to parse Google credential');
    }
  }

  async signOut(): Promise<void> {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }
  }
}

export const googleAuthService = new GoogleAuthService();