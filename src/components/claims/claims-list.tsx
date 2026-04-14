'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, Calendar, FileText, Eye } from 'lucide-react';

interface Claim {
  id: string;
  serviceDate: string;
  providerName: string;
  claimAmount: number;
  status: 'pending' | 'approved' | 'denied' | 'processing';
  submittedAt: string;
  description?: string;
}

interface ClaimsListProps {
  userId?: string;
}

export function ClaimsList({ userId }: ClaimsListProps) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClaims();
  }, [userId]);

  const fetchClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📋 Fetching claims...');
      const response = await fetch('/api/claims/list');
      console.log('📋 Claims response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Claims data:', data);
        setClaims(data.claims || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to fetch claims:', response.status, errorData);
        setError(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Failed to fetch claims:', error);
      setError('Network error - failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600">Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      case 'processing':
        return <Badge className="bg-blue-600">Processing</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <FileText className="w-8 h-8 text-red-500 mb-2" />
          <h3 className="text-sm font-medium mb-1 text-red-700">Error Loading Claims</h3>
          <p className="text-xs text-muted-foreground mb-2">{error}</p>
          <Button onClick={fetchClaims} variant="outline" size="sm" className="h-7">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (claims.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">My Claims</CardTitle>
          <CardDescription className="text-xs">Your submitted claims will appear here</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <FileText className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground mb-2">No claims yet</p>
          <Button onClick={fetchClaims} variant="outline" size="sm" className="h-7">
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">My Claims</CardTitle>
            <CardDescription className="text-xs">{claims.length} claim(s)</CardDescription>
          </div>
          <Button onClick={fetchClaims} variant="outline" size="sm" disabled={loading} className="h-7 text-xs">
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {claims.map((claim) => (
          <div key={claim.id} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{claim.providerName}</p>
                <p className="text-xs text-muted-foreground">
                  #{claim.id.substring(0, 8).toUpperCase()}
                </p>
              </div>
              {getStatusBadge(claim.status)}
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Service</p>
                <p className="font-medium">{new Date(claim.serviceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-medium">${claim.claimAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Submitted</p>
                <p className="font-medium">{new Date(claim.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            </div>

            {claim.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{claim.description}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
