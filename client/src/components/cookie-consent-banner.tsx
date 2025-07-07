import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Cookie, Settings, Shield, BarChart, Target, X } from 'lucide-react';
import { CookieManager, COOKIE_REGISTRY } from '@/lib/cookie-utils';

interface CookieConsentBannerProps {
  onConsentChange?: (preferences: Record<string, boolean>) => void;
}

export default function CookieConsentBanner({ onConsentChange }: CookieConsentBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already consented
    const { hasConsented } = CookieManager.getConsentStatus();
    setShowBanner(!hasConsented);

    // Load existing preferences if they exist
    if (hasConsented) {
      const { preferences: existingPrefs } = CookieManager.getConsentStatus();
      setPreferences(existingPrefs);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    
    CookieManager.setConsentPreferences(allAccepted);
    setPreferences(allAccepted);
    setShowBanner(false);
    onConsentChange?.(allAccepted);
  };

  const handleAcceptSelected = () => {
    CookieManager.setConsentPreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
    onConsentChange?.(preferences);
  };

  const handleRejectAll = () => {
    const essentialOnly = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    
    CookieManager.setConsentPreferences(essentialOnly);
    setPreferences(essentialOnly);
    setShowBanner(false);
    onConsentChange?.(essentialOnly);
  };

  const updatePreference = (category: string, enabled: boolean) => {
    setPreferences(prev => ({ ...prev, [category]: enabled }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'essential': return <Shield className="w-4 h-4" />;
      case 'functional': return <Settings className="w-4 h-4" />;
      case 'analytics': return <BarChart className="w-4 h-4" />;
      case 'marketing': return <Target className="w-4 h-4" />;
      default: return <Cookie className="w-4 h-4" />;
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

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Consent Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-t shadow-lg">
        <Card className="max-w-6xl mx-auto">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <Cookie className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  We use cookies to enhance your experience
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                  We use essential cookies to make our site work. We'd also like to use optional cookies to understand 
                  how you use our site, improve performance, and provide personalized content. You can manage your 
                  preferences or learn more in our{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleAcceptAll}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Accept All
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setShowSettings(true)}
                    className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Customize
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    onClick={handleRejectAll}
                    className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Reject All
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRejectAll}
                className="flex-shrink-0 p-2"
                aria-label="Close and reject all cookies"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Cookie Preferences Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. You can enable or disable different categories of cookies below. 
              Note that disabling some cookies may affect your experience on our website.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Essential Cookies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Essential Cookies</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Always Active</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Required
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {getCategoryDescription('essential')}
              </p>

              <div className="grid gap-2">
                {getCookiesForCategory('essential').map((cookie) => (
                  <div key={cookie.name} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <span className="font-mono text-sm text-gray-800 dark:text-gray-200">{cookie.name}</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{cookie.description}</p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{cookie.duration}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Functional Cookies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Functional Cookies</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Optional</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={(checked) => updatePreference('functional', checked)}
                />
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {getCategoryDescription('functional')}
              </p>

              <div className="grid gap-2">
                {getCookiesForCategory('functional').map((cookie) => (
                  <div key={cookie.name} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <span className="font-mono text-sm text-gray-800 dark:text-gray-200">{cookie.name}</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{cookie.description}</p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{cookie.duration}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Analytics Cookies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart className="w-5 h-5 text-purple-600" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Analytics Cookies</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Optional</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => updatePreference('analytics', checked)}
                />
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {getCategoryDescription('analytics')}
              </p>

              <div className="grid gap-2">
                {getCookiesForCategory('analytics').map((cookie) => (
                  <div key={cookie.name} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <span className="font-mono text-sm text-gray-800 dark:text-gray-200">{cookie.name}</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{cookie.description}</p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{cookie.duration}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Marketing Cookies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-orange-600" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Marketing Cookies</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Optional</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => updatePreference('marketing', checked)}
                />
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {getCategoryDescription('marketing')}
              </p>

              <div className="grid gap-2">
                {getCookiesForCategory('marketing').map((cookie) => (
                  <div key={cookie.name} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <span className="font-mono text-sm text-gray-800 dark:text-gray-200">{cookie.name}</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{cookie.description}</p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{cookie.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t">
            <Button onClick={handleAcceptSelected} className="flex-1">
              Save Preferences
            </Button>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}