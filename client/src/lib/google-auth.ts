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
  sub: string;
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

    return new Promise((resolve, reject) => {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to popup
            this.signInWithPopup().then(resolve).catch(reject);
          }
        });

        // Set up credential response handler
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response: any) => {
            try {
              const userInfo = this.parseJWT(response.credential);
              resolve(userInfo);
            } catch (error) {
              reject(error);
            }
          },
        });
      } catch (error) {
        reject(error);
      }
    });
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
        sub: payload.sub
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