import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Eye, EyeOff, RefreshCw } from "lucide-react";

// Import the main admin content
import AdminSimple from "@/pages/admin-simple";

export default function AdminSecure() {
  // Authentication state - ALWAYS starts as false
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState("admin@brainliest.com");
  const [adminPassword, setAdminPassword] = useState("admin123");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { toast } = useToast();

  // Clear any existing admin tokens on mount
  useEffect(() => {
    console.log('🔒 Admin Security Gate: Clearing any existing tokens');
    localStorage.removeItem('brainliest_access_token');
    localStorage.removeItem('brainliest_user');
    setIsAuthenticated(false);
    console.log('🔒 Admin Security Gate: Authentication required');
  }, []);

  const handleAdminLogin = async () => {
    setIsLoggingIn(true);
    try {
      console.log('🔐 Attempting admin authentication...');
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      });

      const result = await response.json();

      if (result.success && result.accessToken) {
        console.log('✅ Admin authentication successful');
        // Store the admin token
        localStorage.setItem('brainliest_access_token', result.accessToken);
        localStorage.setItem('brainliest_user', JSON.stringify(result.user));
        
        // Set authentication state
        setIsAuthenticated(true);
        
        toast({
          title: "Admin Access Granted",
          description: "Welcome to the Brainliest Admin Panel",
        });
      } else {
        console.log('❌ Admin authentication failed');
        toast({
          title: "Access Denied",
          description: result.message || "Invalid administrator credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Admin login error:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to authenticate admin access",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    console.log('🚪 Admin logout requested');
    localStorage.removeItem('brainliest_access_token');
    localStorage.removeItem('brainliest_user');
    setIsAuthenticated(false);
    setAdminPassword("");
    toast({
      title: "Logged Out",
      description: "Admin session ended",
    });
  };

  // SECURITY GATE: If not authenticated, ALWAYS show login screen
  if (!isAuthenticated) {
    console.log('🚫 Admin access blocked - showing authentication screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="max-w-md w-full mx-4">
            <Card className="shadow-2xl border-2 border-red-200 bg-white/95 backdrop-blur-sm">
              <CardHeader className="text-center space-y-4 pb-8">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-red-900">🔒 RESTRICTED ACCESS</h1>
                  <p className="text-red-700 mt-2 font-medium">
                    Administrator credentials required
                  </p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm font-medium text-center">
                    ⚠️ This area is restricted to authorized administrators only
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Administrator Email
                    </label>
                    <Input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="Enter your admin email"
                      className="h-11 border-red-200 focus:border-red-400"
                      disabled={isLoggingIn}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Administrator Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Enter your admin password"
                        className="h-11 pr-10 border-red-200 focus:border-red-400"
                        disabled={isLoggingIn}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && adminEmail && adminPassword) {
                            handleAdminLogin();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoggingIn}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleAdminLogin}
                  disabled={isLoggingIn || !adminEmail || !adminPassword}
                  className="w-full h-11 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Authenticate Admin Access
                    </>
                  )}
                </Button>
                
                <div className="pt-4 border-t border-red-200">
                  <div className="text-center space-y-2">
                    <p className="text-xs text-red-600 font-medium">Development Credentials</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Email: admin@brainliest.com</p>
                      <p>Password: admin123</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-red-600 font-medium">
                🛡️ Protected by enterprise security • All access attempts are logged
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED: Show admin panel with logout option
  console.log('✅ Admin authenticated - showing admin panel');
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="bg-green-100 border-b border-green-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 font-medium text-sm">
              ✅ Authenticated as Administrator
            </span>
          </div>
          <Button 
            onClick={handleAdminLogout}
            variant="outline"
            size="sm"
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <Users className="w-4 h-4 mr-2" />
            Logout Admin
          </Button>
        </div>
      </div>
      <AdminSimple />
    </div>
  );
}