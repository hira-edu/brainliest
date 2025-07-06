import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { googleAuthService } from "@/lib/google-auth";

interface User {
  email: string;
  name: string;
  picture?: string;
  provider: 'email' | 'google';
}

interface AuthContextType {
  isSignedIn: boolean;
  userName: string;
  user: User | null;
  signIn: (nameOrEmail: string) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize Google Auth service
    googleAuthService.initialize().catch(console.error);
    
    // Check for existing authentication state
    const savedUser = localStorage.getItem('brainliest_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setUserName(userData.name);
        setIsSignedIn(true);
      } catch (error) {
        localStorage.removeItem('brainliest_user');
      }
    }
  }, []);

  const signIn = (nameOrEmail: string) => {
    const userData: User = {
      email: nameOrEmail.includes('@') ? nameOrEmail : `${nameOrEmail}@local.dev`,
      name: nameOrEmail,
      provider: 'email'
    };
    
    setUser(userData);
    setUserName(userData.name);
    setIsSignedIn(true);
    localStorage.setItem('brainliest_user', JSON.stringify(userData));
  };

  const signInWithGoogle = async () => {
    try {
      const googleUser = await googleAuthService.signIn();
      const userData: User = {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        provider: 'google'
      };
      
      setUser(userData);
      setUserName(userData.name);
      setIsSignedIn(true);
      localStorage.setItem('brainliest_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (user?.provider === 'google') {
        await googleAuthService.signOut();
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
    
    setIsSignedIn(false);
    setUserName("");
    setUser(null);
    localStorage.removeItem('brainliest_user');
  };

  return (
    <AuthContext.Provider value={{ 
      isSignedIn, 
      userName, 
      user,
      signIn, 
      signInWithGoogle,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}