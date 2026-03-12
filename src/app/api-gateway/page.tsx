'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { MermaidDiagram } from "@/components/mermaid-diagram";

const architectureDiagram = `
graph TB
    A[Client Browser] -->|1. Request Auth0 Token| B[Auth0]
    B -->|2. Returns JWT| A
    A -->|3. Send Request<br/>Authorization: Bearer JWT| C[Kong Gateway]
    C -->|4. Validate JWT| B
    B -->|5. Validation Success| C
    C -->|6. Add User Headers<br/>X-User-Id, X-User-Email| D[Next.js API]
    D -->|7. Process & Return Data| C
    C -->|8. Return Response| A

    style A fill:#3b82f6,stroke:#1e40af,color:#fff
    style B fill:#10b981,stroke:#059669,color:#fff
    style C fill:#f59e0b,stroke:#d97706,color:#fff
    style D fill:#8b5cf6,stroke:#6d28d9,color:#fff
`;

export default function ApiGatewayPage() {
  const { user, error, isLoading: userLoading } = useUser();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Note: Kong Gateway URL - replace with your actual Kong Konnect gateway URL
  const KONG_GATEWAY_URL = process.env.NEXT_PUBLIC_KONG_GATEWAY_URL || 'http://localhost:8000';

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    // Get the Auth0 access token from the session
    const tokenResponse = await fetch('/api/auth/token');
    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }
    const { accessToken } = await tokenResponse.json();

    // Call through Kong Gateway
    const response = await fetch(`${KONG_GATEWAY_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',  // Bypass ngrok warning page
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  };

  const testAnalytics = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchWithAuth('/api/kong-protected/analytics');
      setAnalyticsData(data);
    } catch (error: any) {
      console.error('Analytics test failed:', error);
      setErrorMsg(`Analytics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Gateway Protected Endpoint</h1>
        </div>
        <p className="text-muted-foreground">
          This endpoint is protected by Kong Konnect
        </p>
      </header>

      {/* Error Display */}
      {errorMsg && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* Main Content: API Test and Architecture Diagram */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Analytics Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-blue-600" />
              Analytics API
            </CardTitle>
            <CardDescription>
              GET /api/kong-protected/analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testAnalytics}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Analytics'
              )}
            </Button>

            {analyticsData && (
              <div className="space-y-2 text-sm">
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Success
                </Badge>
                <div className="bg-gray-50 p-3 rounded text-xs">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(analyticsData.data?.overview || {}, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Architecture Diagram */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-blue-600" />
              Request Flow
            </CardTitle>
            <CardDescription>
              How Kong Gateway validates and forwards requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MermaidDiagram chart={architectureDiagram} className="flex justify-center" />
          </CardContent>
        </Card>
      </div>

      {/* Kong Features */}
      <Card>
        <CardHeader>
          <CardTitle>Kong Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid md:grid-cols-2 gap-4 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>JWT Validation</strong> - Automatic Auth0 token verification</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Rate Limiting</strong> - 100 req/min, 1000 req/hour</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>CORS Handling</strong> - Pre-configured for your domains</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Header Transformation</strong> - Adds user context headers</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
