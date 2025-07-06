import { useEffect } from 'react';

export default function AuthCallback() {
  useEffect(() => {
    // Extract token from URL hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (error) {
      // Send error to parent window
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: error
      }, window.location.origin);
      window.close();
      return;
    }

    if (accessToken) {
      // Fetch user info from Google
      fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`)
        .then(response => response.json())
        .then(userInfo => {
          // Send success to parent window
          window.opener?.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            user: {
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture,
              sub: userInfo.id
            }
          }, window.location.origin);
          window.close();
        })
        .catch(error => {
          window.opener?.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: 'Failed to fetch user info'
          }, window.location.origin);
          window.close();
        });
    } else {
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: 'No access token received'
      }, window.location.origin);
      window.close();
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  );
}