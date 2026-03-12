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
graph LR
    A[Client<br/>Browser] -->|1. Get JWT| B[Auth0]
    B -->|2. JWT Token| A
    A -->|3. API Request<br/>+ JWT| C[Kong<br/>Gateway]
    C -->|4. Validate<br/>JWT| B
    B -->|5. Valid ✓| C
    C -->|6. Request<br/>+ User Headers| D[Next.js<br/>API]
    D -->|7. Response<br/>Data| C
    C -->|8. Response| A

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
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Analytics Test */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-blue-600" />
              Analytics API
            </CardTitle>
            <CardDescription className="text-xs">
              GET /api/kong-protected/analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={testAnalytics}
              disabled={loading}
              size="sm"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Analytics'
              )}
            </Button>

            {analyticsData && (
              <div className="space-y-2">
                <Badge variant="default" className="gap-1 text-xs">
                  <CheckCircle className="h-3 w-3" />
                  Success
                </Badge>
                <div className="bg-gray-50 p-2 rounded text-xs max-h-[200px] overflow-y-auto border">
                  <pre className="whitespace-pre-wrap text-[10px] leading-tight">
                    {JSON.stringify(analyticsData.data?.overview || {}, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Architecture Diagram */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-blue-600" />
              Request Flow
            </CardTitle>
            <CardDescription className="text-xs">
              How Kong Gateway validates and forwards requests
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <MermaidDiagram chart={architectureDiagram} className="w-full" />
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
