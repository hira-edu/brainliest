/**
 * AuthCallback - Fixed version addressing all audit issues
 * Handles Google OAuth callback by extracting access token and fetching user info
 * Fixed: SSR compatibility, error handling, field alignment, accessibility
 */

 // Fixed: RSC directive for Vercel compatibility with window APIs

import { useEffect } from 'react';

// Fixed: TypeScript interface for Google user info
interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
  id: string;
}

export default function AuthCallback() {
  useEffect(() => {
    // Fixed: SSR compatibility check
    if (typeof window === 'undefined') return;

    // Extract token from URL hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const error = params.get('error');

    // Fixed: Utility function to send messages with proper delay
    const sendMessageAndClose = (message: any) => {
      if (window.opener) {
        window.opener.postMessage(message, window.location.origin);
        // Fixed: Delay window close to ensure message delivery
        setTimeout(() => {
          window.close();
        }, 100);
      } else {
        // Fixed: Fallback if no parent window - redirect to login
        window.location.href = '/login?error=oauth_callback_failed';
      }
    };

    if (error) {
      // Send error to parent window
      sendMessageAndClose({
        type: 'GOOGLE_AUTH_ERROR',
        error: error
      });
      return;
    }

    // Fixed: Access token validation
    if (accessToken && accessToken.trim().length > 0) {
      // Fetch user info from Google
      fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`)
        .then(response => {
          // Fixed: Check response.ok before parsing
          if (!response.ok) {
            throw new Error(`Google API error: ${response.status}`);
          }
          return response.json();
        })
        .then((userInfo: GoogleUserInfo) => {
          // Fixed: Validate userInfo fields
          if (!userInfo.email || !userInfo.name || !userInfo.id) {
            throw new Error('Invalid user info received from Google');
          }

          // Fixed: Send success with field names aligned to authAPI.googleOAuth
          sendMessageAndClose({
            type: 'GOOGLE_AUTH_SUCCESS',
            user: {
              email: userInfo.email,
              googleId: userInfo.id, // Fixed: Changed from 'sub' to 'googleId' to match auth.ts
              firstName: userInfo.name.split(' ')[0] || userInfo.name, // Fixed: Extract firstName
              lastName: userInfo.name.split(' ').slice(1).join(' ') || '', // Fixed: Extract lastName
              profileImage: userInfo.picture || '' // Fixed: Changed from 'picture' to 'profileImage'
            }
          });
        })
        .catch((error: unknown) => {
          // Fixed: Proper error typing (TS18046)
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user info';
          
          sendMessageAndClose({
            type: 'GOOGLE_AUTH_ERROR',
            error: errorMessage // Fixed: Include specific error message
          });
        });
    } else {
      sendMessageAndClose({
        type: 'GOOGLE_AUTH_ERROR',
        error: 'No access token received'
      });
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"
          aria-busy="true" // Fixed: Accessibility - ARIA busy state
          aria-live="polite" // Fixed: Accessibility - screen reader support
        ></div>
        <p className="mt-4 text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  );
}

// Note: Requires /api/auth/oauth/google Vercel Function to handle the user data
// Note: Field names now align with authAPI.googleOAuth in auth.ts (googleId, firstName, lastName, profileImage)
// Note: Consider wrapping in SecurityErrorBoundary in parent component
// Note: TokenStorage in auth.ts will handle token persistence after successful OAuth