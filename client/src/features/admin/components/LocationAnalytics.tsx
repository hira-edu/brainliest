import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { MapPin, Search, RefreshCw, Globe, Activity } from "lucide-react";
import { apiRequest } from "../../../services/queryClient";
import { useToast } from "../../shared/hooks/use-toast";

interface LocationData {
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

interface GeolocationStats {
  totalLookups: number;
  uniqueCountries: number;
  topCountries: Array<{
    country: string;
    count: number;
  }>;
  recentLookups: Array<{
    ip: string;
    location: string;
    timestamp: string;
  }>;
  cacheHitRate: number;
  providerStats: Array<{
    name: string;
    requests: number;
    success: number;
  }>;
}

export function LocationAnalytics() {
  const [searchIp, setSearchIp] = useState("");
  const [locationResult, setLocationResult] = useState<LocationData | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch geolocation statistics
  const { data: stats, refetch: refetchStats, isLoading: statsLoading } = useQuery<GeolocationStats>({
    queryKey: ['/api/geolocation/stats'],
    queryFn: async () => {
      const response = await fetch('/api/geolocation/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch geolocation stats');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleIpLookup = async () => {
    if (!searchIp.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/geolocation/ip/${encodeURIComponent(searchIp.trim())}`);
      if (!response.ok) {
        throw new Error('Failed to lookup IP address');
      }
      const data = await response.json();
      setLocationResult(data.location || data);
    } catch (error) {
      console.error('Error looking up IP:', error);
      setLocationResult({
        ip: searchIp,
        status: 'error',
        message: 'Failed to lookup IP address'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const formatLocation = (data: LocationData): string => {
    const parts = [];
    if (data.city) parts.push(data.city);
    if (data.region) parts.push(data.region);
    if (data.country) parts.push(data.country);
    return parts.join(', ') || 'Unknown';
  };

  const getCountryFlag = (countryCode?: string): string => {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    return String.fromCodePoint(
      ...[...countryCode.toUpperCase()].map(char => char.charCodeAt(0) + 127397)
    );
  };

  return (
    <div className="space-y-6">
      {/* IP Lookup Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            IP Address Lookup
          </CardTitle>
          <CardDescription>
            Look up geolocation information for any IP address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address (e.g., 8.8.8.8)"
              value={searchIp}
              onChange={(e) => setSearchIp(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleIpLookup()}
              className="flex-1"
            />
            <Button onClick={handleIpLookup} disabled={isSearching || !searchIp.trim()}>
              {isSearching ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isSearching ? 'Looking up...' : 'Lookup'}
            </Button>
          </div>

          {locationResult && (
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Location Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="bg-blue-50 p-3 rounded-lg border">
                        <div className="text-lg font-semibold text-blue-800 mb-1">
                          {getCountryFlag(locationResult.countryCode)} {formatLocation(locationResult)}
                        </div>
                        <div className="font-mono text-sm text-gray-600">{locationResult.ip}</div>
                      </div>
                      {locationResult.countryCode && (
                        <div><strong>Country Code:</strong> {locationResult.countryCode}</div>
                      )}
                      {locationResult.timezone && (
                        <div><strong>Timezone:</strong> {locationResult.timezone}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Network Information</h4>
                    <div className="space-y-1 text-sm">
                      {locationResult.isp && (
                        <div><strong>ISP:</strong> {locationResult.isp}</div>
                      )}
                      {locationResult.org && (
                        <div><strong>Organization:</strong> {locationResult.org}</div>
                      )}
                      {locationResult.as && (
                        <div><strong>AS:</strong> {locationResult.as}</div>
                      )}
                      {locationResult.latitude && locationResult.longitude && (
                        <div><strong>Coordinates:</strong> {locationResult.latitude}, {locationResult.longitude}</div>
                      )}
                    </div>
                  </div>
                </div>
                {locationResult.status === 'error' && (
                  <div className="mt-3 text-red-600 text-sm">
                    Error: {locationResult.message}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalLookups || 0}</p>
                <p className="text-sm text-gray-600">Total Lookups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.uniqueCountries || 0}</p>
                <p className="text-sm text-gray-600">Unique Countries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.cacheHitRate ? `${stats.cacheHitRate}%` : '0%'}</p>
                <p className="text-sm text-gray-600">Cache Hit Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" />
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetchStats()}
                  disabled={statsLoading}
                >
                  {statsLoading ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Countries */}
      {stats?.topCountries && stats.topCountries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
            <CardDescription>
              Most frequently looked up countries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topCountries.slice(0, 10).map((country, index) => (
                <div key={country.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <Badge variant="outline">{country.country}</Badge>
                  </div>
                  <span className="text-sm font-medium">{country.count} lookups</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Lookups */}
      {stats?.recentLookups && stats.recentLookups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Lookups</CardTitle>
            <CardDescription>
              Latest IP address lookups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location & IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentLookups.slice(0, 10).map((lookup, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-base text-blue-600">{lookup.location}</span>
                        <span className="font-mono text-sm text-gray-600">{lookup.ip}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(lookup.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Provider Statistics */}
      {stats?.providerStats && stats.providerStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Provider Statistics</CardTitle>
            <CardDescription>
              Performance metrics for geolocation providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Success</TableHead>
                  <TableHead>Success Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.providerStats.map((provider) => (
                  <TableRow key={provider.name}>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell>{provider.requests}</TableCell>
                    <TableCell>{provider.success}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {provider.requests > 0 
                          ? Math.round((provider.success / provider.requests) * 100)
                          : 0}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}