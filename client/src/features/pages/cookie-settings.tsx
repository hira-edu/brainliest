import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Cookie, Shield, Settings, BarChart, Target, 
  AlertTriangle, CheckCircle, Trash2, Download, 
  RefreshCw, Info 
} from 'lucide-react';
import { CookieManager, COOKIE_REGISTRY } from '../../utils/cookie-utils';
import { useToast } from '../shared/hooks/use-toast';

export default function CookieSettings() {
  const [preferences, setPreferences] = useState({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false
  });
  const [currentCookies, setCurrentCookies] = useState<Record<string, string>>({});
  const [hasConsented, setHasConsented] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentSettings();
    loadCurrentCookies();
  }, []);

  const loadCurrentSettings = () => {
    const { hasConsented: consented, preferences: prefs } = CookieManager.getConsentStatus();
    setHasConsented(consented);
    setPreferences(prefs);
  };

  const loadCurrentCookies = () => {
    const cookies = CookieManager.getAllCookies();
    setCurrentCookies(cookies);
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    
    try {
      CookieManager.setConsentPreferences(preferences);
      loadCurrentCookies(); // Refresh cookie list
      
      toast({
        title: "Preferences saved",
        description: "Your cookie preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save cookie preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllCookies = () => {
    CookieManager.clearAllNonEssentialCookies();
    loadCurrentSettings();
    loadCurrentCookies();
    
    toast({
      title: "Cookies cleared",
      description: "All non-essential cookies have been removed.",
    });
  };

  const handleRevokeConsent = () => {
    CookieManager.clearAllNonEssentialCookies();
    CookieManager.removeCookie('cookies_accepted');
    CookieManager.removeCookie('cookie_preferences');
    
    setHasConsented(false);
    setPreferences({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    });
    loadCurrentCookies();
    
    toast({
      title: "Consent revoked",
      description: "Your cookie consent has been revoked and non-essential cookies removed.",
    });
  };

  const updatePreference = (category: keyof typeof preferences, enabled: boolean) => {
    setPreferences(prev => ({ ...prev, [category]: enabled }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'essential': return <Shield className="w-5 h-5 text-green-600" />;
      case 'functional': return <Settings className="w-5 h-5 text-blue-600" />;
      case 'analytics': return <BarChart className="w-5 h-5 text-purple-600" />;
      case 'marketing': return <Target className="w-5 h-5 text-orange-600" />;
      default: return <Cookie className="w-5 h-5" />;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'essential':
        return 'Required for basic site functionality, security, and user authentication. These cannot be disabled.';
      case 'functional':
        return 'Enable enhanced features like remembering your preferences, settings, and providing personalized content.';
      case 'analytics':
        return 'Help us understand how visitors interact with our website by collecting and reporting information anonymously.';
      case 'marketing':
        return 'Used to track visitors across websites to display relevant advertisements and measure campaign effectiveness.';
      default:
        return '';
    }
  };

  const getCookiesForCategory = (category: string) => {
    return COOKIE_REGISTRY.filter(cookie => cookie.category === category);
  };

  const getActiveCookiesForCategory = (category: string) => {
    const categoryCookies = getCookiesForCategory(category);
    return categoryCookies.filter(cookie => currentCookies[cookie.name]);
  };

  const exportCookieData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      preferences,
      hasConsented,
      activeCookies: currentCookies,
      cookieRegistry: COOKIE_REGISTRY
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookie-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data exported",
      description: "Your cookie data has been downloaded successfully.",
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Cookie className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Cookie & Privacy Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your cookie preferences and privacy settings
            </p>
          </div>
        </div>

        {/* Status Alert */}
        {hasConsented ? (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              You have provided cookie consent. Your preferences are active.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              You have not provided cookie consent yet. Only essential cookies are active.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Manage your cookie settings quickly with these actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSavePreferences} disabled={isLoading}>
              {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Save Preferences
            </Button>
            
            <Button variant="outline" onClick={exportCookieData}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            
            <Button variant="outline" onClick={handleClearAllCookies}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Non-Essential
            </Button>
            
            {hasConsented && (
              <Button variant="destructive" onClick={handleRevokeConsent}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Revoke Consent
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cookie Categories */}
      <div className="space-y-6">
        {/* Essential Cookies */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-green-600" />
                <div>
                  <CardTitle>Essential Cookies</CardTitle>
                  <CardDescription>Always active - required for basic functionality</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {getActiveCookiesForCategory('essential').length} active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {getCategoryDescription('essential')}
            </p>

            <div className="grid gap-3">
              {getCookiesForCategory('essential').map((cookie) => (
                <div key={cookie.name} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium text-gray-800 dark:text-gray-200">
                        {cookie.name}
                      </span>
                      {currentCookies[cookie.name] && (
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{cookie.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{cookie.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Functional Cookies */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-blue-600" />
                <div>
                  <CardTitle>Functional Cookies</CardTitle>
                  <CardDescription>Enhance your experience with personalized features</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {getActiveCookiesForCategory('functional').length} active
                </Badge>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={(checked) => updatePreference('functional', checked)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {getCategoryDescription('functional')}
            </p>

            <div className="grid gap-3">
              {getCookiesForCategory('functional').map((cookie) => (
                <div key={cookie.name} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium text-gray-800 dark:text-gray-200">
                        {cookie.name}
                      </span>
                      {currentCookies[cookie.name] && (
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{cookie.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{cookie.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Cookies */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart className="w-6 h-6 text-purple-600" />
                <div>
                  <CardTitle>Analytics Cookies</CardTitle>
                  <CardDescription>Help us improve our platform through usage insights</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {getActiveCookiesForCategory('analytics').length} active
                </Badge>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => updatePreference('analytics', checked)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {getCategoryDescription('analytics')}
            </p>

            <div className="grid gap-3">
              {getCookiesForCategory('analytics').map((cookie) => (
                <div key={cookie.name} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium text-gray-800 dark:text-gray-200">
                        {cookie.name}
                      </span>
                      {currentCookies[cookie.name] && (
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{cookie.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{cookie.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Marketing Cookies */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-orange-600" />
                <div>
                  <CardTitle>Marketing Cookies</CardTitle>
                  <CardDescription>Enable personalized advertising and content</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {getActiveCookiesForCategory('marketing').length} active
                </Badge>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => updatePreference('marketing', checked)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {getCategoryDescription('marketing')}
            </p>

            <div className="grid gap-3">
              {getCookiesForCategory('marketing').map((cookie) => (
                <div key={cookie.name} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium text-gray-800 dark:text-gray-200">
                        {cookie.name}
                      </span>
                      {currentCookies[cookie.name] && (
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{cookie.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{cookie.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Footer */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              <p className="mb-2">
                <strong>Your Privacy Rights:</strong> You can change your cookie preferences at any time. 
                Essential cookies cannot be disabled as they are necessary for the website to function properly.
              </p>
              <p>
                For more information about how we use cookies and protect your privacy, please read our{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> and{' '}
                <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}