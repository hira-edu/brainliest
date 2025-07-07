import { useState, useEffect } from "react";
import { MapPin, Globe } from "lucide-react";

interface LocationData {
  ip: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  query?: string;
  status?: string;
}

interface AutoLocationDisplayProps {
  ipAddress: string | null;
  className?: string;
}

export function AutoLocationDisplay({ ipAddress, className = "" }: AutoLocationDisplayProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ipAddress || ipAddress === 'Unknown') {
      setLocation(null);
      return;
    }

    const fetchLocation = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/geolocation/lookup/${encodeURIComponent(ipAddress)}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setLocation(data.location);
        } else {
          setError(data.message || 'Failed to fetch location');
        }
      } catch (err) {
        setError('Network error fetching location');
        console.error('Location fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [ipAddress]);

  const getCountryFlag = (countryCode?: string): string => {
    if (!countryCode) return '';
    
    const flagEmojiMap: { [key: string]: string } = {
      'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷',
      'IN': '🇮🇳', 'JP': '🇯🇵', 'KR': '🇰🇷', 'CN': '🇨🇳', 'AU': '🇦🇺',
      'BR': '🇧🇷', 'MX': '🇲🇽', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱',
      'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'RU': '🇷🇺',
      'PL': '🇵🇱', 'CZ': '🇨🇿', 'TR': '🇹🇷', 'ZA': '🇿🇦', 'NG': '🇳🇬',
      'EG': '🇪🇬', 'IL': '🇮🇱', 'AE': '🇦🇪', 'SA': '🇸🇦', 'SG': '🇸🇬',
      'TH': '🇹🇭', 'VN': '🇻🇳', 'PH': '🇵🇭', 'ID': '🇮🇩', 'MY': '🇲🇾'
    };
    
    return flagEmojiMap[countryCode.toUpperCase()] || '🌍';
  };

  const formatLocation = (location: LocationData): string => {
    const parts = [];
    
    if (location.city) parts.push(location.city);
    if (location.region) parts.push(location.region);
    if (location.country) parts.push(location.country);
    
    return parts.join(', ') || 'Unknown Location';
  };

  if (!ipAddress || ipAddress === 'Unknown') {
    return (
      <div className={`flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 ${className}`}>
        <MapPin className="h-3 w-3" />
        {ipAddress || 'Unknown'}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Location Display - Automatically appears above IP */}
      {loading && (
        <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 mb-1">
          <Globe className="h-3 w-3 animate-spin" />
          <span>Loading location...</span>
        </div>
      )}
      
      {location && !loading && (
        <div className="flex items-center gap-1 text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
          <span className="text-base">{getCountryFlag(location.countryCode)}</span>
          <span className="bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
            {formatLocation(location)}
          </span>
        </div>
      )}
      
      {error && !loading && (
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-1">
          <Globe className="h-3 w-3" />
          <span>Location unavailable</span>
        </div>
      )}
      
      {/* IP Address Display */}
      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
        <MapPin className="h-3 w-3" />
        {ipAddress}
      </div>
    </div>
  );
}