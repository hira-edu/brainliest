import { createHash } from 'crypto';

export interface LocationData {
  ip: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  query?: string;
  status?: string;
  message?: string;
}

export interface GeolocationProvider {
  name: string;
  getLocation(ip: string): Promise<LocationData>;
  isConfigured(): boolean;
}

/**
 * IP-API Provider (Free, no API key required)
 * Rate limit: 1000 requests per minute
 * Good for development and moderate production use
 */
class IPAPIProvider implements GeolocationProvider {
  name = 'IP-API';

  isConfigured(): boolean {
    return true; // No API key required
  }

  async getLocation(ip: string): Promise<LocationData> {
    try {
      // Skip private/local IPs
      if (this.isPrivateIP(ip)) {
        return { ip, country: 'Local Network', city: 'Local' };
      }

      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,query`);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          ip: data.query || ip,
          country: data.country,
          countryCode: data.countryCode,
          region: data.regionName,
          regionCode: data.region,
          city: data.city,
          latitude: data.lat,
          longitude: data.lon,
          timezone: data.timezone,
          isp: data.isp,
          org: data.org,
          as: data.as,
          status: data.status
        };
      } else {
        throw new Error(data.message || 'Failed to get location');
      }
    } catch (error) {
      console.error(`IP-API geolocation error for ${ip}:`, error);
      return { ip, status: 'fail', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];
    return privateRanges.some(range => range.test(ip));
  }
}

/**
 * IPStack Provider (Freemium, API key required)
 * Free tier: 1000 requests per month
 * Good for production use with API key
 */
class IPStackProvider implements GeolocationProvider {
  name = 'IPStack';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getLocation(ip: string): Promise<LocationData> {
    try {
      if (this.isPrivateIP(ip)) {
        return { ip, country: 'Local Network', city: 'Local' };
      }

      const response = await fetch(`http://api.ipstack.com/${ip}?access_key=${this.apiKey}`);
      const data = await response.json();

      if (data.success !== false) {
        return {
          ip: data.ip || ip,
          country: data.country_name,
          countryCode: data.country_code,
          region: data.region_name,
          regionCode: data.region_code,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.time_zone?.id,
          isp: data.connection?.isp,
          org: data.connection?.isp,
          as: data.connection?.isp,
          status: 'success'
        };
      } else {
        throw new Error(data.error?.info || 'Failed to get location');
      }
    } catch (error) {
      console.error(`IPStack geolocation error for ${ip}:`, error);
      return { ip, status: 'fail', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];
    return privateRanges.some(range => range.test(ip));
  }
}

/**
 * IPGeolocation Provider (Freemium, API key required)
 * Free tier: 1000 requests per month
 * Good accuracy and reliability
 */
class IPGeolocationProvider implements GeolocationProvider {
  name = 'IPGeolocation';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getLocation(ip: string): Promise<LocationData> {
    try {
      if (this.isPrivateIP(ip)) {
        return { ip, country: 'Local Network', city: 'Local' };
      }

      const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${this.apiKey}&ip=${ip}`);
      const data = await response.json();

      if (!data.message) {
        return {
          ip: data.ip || ip,
          country: data.country_name,
          countryCode: data.country_code2,
          region: data.state_prov,
          city: data.city,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          timezone: data.time_zone?.name,
          isp: data.isp,
          org: data.organization,
          as: data.isp,
          status: 'success'
        };
      } else {
        throw new Error(data.message || 'Failed to get location');
      }
    } catch (error) {
      console.error(`IPGeolocation geolocation error for ${ip}:`, error);
      return { ip, status: 'fail', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];
    return privateRanges.some(range => range.test(ip));
  }
}

/**
 * Comprehensive Geolocation Service
 * Supports multiple providers with automatic fallback
 * Includes caching to reduce API calls
 */
class GeolocationService {
  private providers: GeolocationProvider[] = [];
  private cache = new Map<string, { data: LocationData; expires: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize available providers
    this.providers = [
      new IPAPIProvider(), // Free, no API key required
    ];

    // Add premium providers if API keys are available
    const ipstackKey = process.env.IPSTACK_API_KEY;
    if (ipstackKey) {
      this.providers.push(new IPStackProvider(ipstackKey));
    }

    const ipgeolocationKey = process.env.IPGEOLOCATION_API_KEY;
    if (ipgeolocationKey) {
      this.providers.push(new IPGeolocationProvider(ipgeolocationKey));
    }

    console.log(`🌍 Geolocation service initialized with ${this.providers.length} providers:`, 
      this.providers.map(p => p.name).join(', '));
  }

  /**
   * Get location data for an IP address
   * Tries multiple providers with automatic fallback
   * Uses caching to reduce API calls
   */
  async getLocationForIP(ip: string): Promise<LocationData> {
    // Normalize IP address
    const normalizedIP = this.normalizeIP(ip);
    const cacheKey = this.getCacheKey(normalizedIP);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Try each provider until one succeeds
    let lastError: Error | null = null;
    
    for (const provider of this.providers) {
      if (!provider.isConfigured()) {
        continue;
      }

      try {
        const location = await provider.getLocation(normalizedIP);
        
        if (location.status !== 'fail') {
          // Cache successful result
          this.cache.set(cacheKey, {
            data: location,
            expires: Date.now() + this.CACHE_DURATION,
            timestamp: Date.now()
          });
          
          return location;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Provider ${provider.name} failed for IP ${normalizedIP}:`, error);
      }
    }

    // All providers failed, return basic data
    console.error(`All geolocation providers failed for IP ${normalizedIP}:`, lastError);
    return {
      ip: normalizedIP,
      status: 'fail',
      message: lastError?.message || 'All geolocation providers failed'
    };
  }

  /**
   * Get locations for multiple IPs in parallel
   */
  async getLocationsForIPs(ips: string[]): Promise<Map<string, LocationData>> {
    const results = new Map<string, LocationData>();
    
    // Process IPs in parallel with rate limiting
    const batchSize = 5; // Process 5 IPs at a time to respect rate limits
    
    for (let i = 0; i < ips.length; i += batchSize) {
      const batch = ips.slice(i, i + batchSize);
      const promises = batch.map(async (ip) => {
        const location = await this.getLocationForIP(ip);
        return { ip, location };
      });
      
      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ ip, location }) => {
        results.set(ip, location);
      });

      // Add small delay between batches to respect rate limits
      if (i + batchSize < ips.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Format location data for display
   */
  formatLocation(location: LocationData): string {
    if (location.status === 'fail') {
      return 'Unknown Location';
    }

    const parts: string[] = [];
    
    if (location.city) parts.push(location.city);
    if (location.region) parts.push(location.region);
    if (location.country) parts.push(location.country);
    
    return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
  }

  /**
   * Get flag emoji for country code
   */
  getCountryFlag(countryCode?: string): string {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    
    return String.fromCodePoint(...codePoints);
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    this.clearExpiredCache();
    return {
      size: this.cache.size,
      providers: this.providers.map(p => ({ name: p.name, configured: p.isConfigured() }))
    };
  }

  /**
   * Get comprehensive statistics for admin panel
   */
  getStatistics() {
    this.clearExpiredCache();
    
    // Get recent lookups from cache (only entries with timestamps)
    const recentLookups = Array.from(this.cache.entries())
      .filter(([key, value]) => value.timestamp) // Only include entries with timestamps
      .map(([key, value]) => ({
        ip: value.data.ip,
        location: this.formatLocation(value.data),
        country: value.data.country || 'Unknown',
        countryCode: value.data.countryCode,
        timestamp: new Date(value.timestamp).toISOString(),
        flag: this.getCountryFlag(value.data.countryCode)
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10); // Get last 10 lookups

    // Count by country for top countries
    const countryCounts = new Map<string, number>();
    Array.from(this.cache.values()).forEach(entry => {
      const country = entry.data.country;
      if (country && country !== 'Unknown') {
        countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
      }
    });

    const topCountries = Array.from(countryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    return {
      success: true,
      cache: this.getCacheStats(),
      recentLookups,
      topCountries,
      timestamp: new Date().toISOString()
    };
  }

  private normalizeIP(ip: string): string {
    // Handle IPv4-mapped IPv6 addresses
    if (ip.startsWith('::ffff:')) {
      return ip.substring(7);
    }
    return ip;
  }

  private getCacheKey(ip: string): string {
    return createHash('md5').update(ip).digest('hex');
  }
}

// Export singleton instance
export const geolocationService = new GeolocationService();

// Clear expired cache entries every hour
setInterval(() => {
  geolocationService.clearExpiredCache();
}, 60 * 60 * 1000);