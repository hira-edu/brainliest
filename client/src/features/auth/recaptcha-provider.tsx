import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

interface RecaptchaProviderProps {
  children: React.ReactNode;
}

export default function RecaptchaProvider({ children }: RecaptchaProviderProps) {
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  
  console.log('🔒 reCAPTCHA Provider initialized with key:', recaptchaSiteKey ? `${recaptchaSiteKey.substring(0, 20)}...` : 'MISSING');
  
  if (!recaptchaSiteKey) {
    console.warn('🔒 reCAPTCHA site key not found in environment variables');
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={recaptchaSiteKey}
      scriptProps={{
        async: true,
        defer: true,
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}