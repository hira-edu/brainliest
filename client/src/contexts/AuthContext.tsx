import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  isSignedIn: boolean;
  userName: string;
  signIn: (name: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userName, setUserName] = useState("");

  const signIn = (name: string) => {
    setUserName(name);
    setIsSignedIn(true);
  };

  const signOut = () => {
    setIsSignedIn(false);
    setUserName("");
  };

  return (
    <AuthContext.Provider value={{ isSignedIn, userName, signIn, signOut }}>
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