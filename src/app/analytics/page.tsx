'use client';

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { user, isLoading: userLoading } = useUser();
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);

  const roles = user?.['https://agency-inc-demo.com/roles'] as string[] || [];
  const hasAnalyticsAccess = roles.includes('Data Analyst');

  const handleRequestAccess = async () => {
    setIsRequestingAccess(true);
    try {
      const prepareResponse = await fetch('/api/prepare-access-request', {
        method: 'POST',
      });
      
      if (!prepareResponse.ok) {
        throw new Error('Failed to prepare access request.');
      }

      const loginHint = encodeURIComponent(user.email);
      window.location.href = `/api/auth/login?returnTo=/analytics&login_hint=${loginHint}`;

    } catch (error) {
      console.error('Error requesting access:', error);
      alert('An error occurred. Please try again.');
      setIsRequestingAccess(false);
    }
  };

  // Renders the full dashboard for authorized users
  const renderDashboard = () => (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          View comprehensive reporting analytics and insights
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">+8.2% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Report Analytics</CardTitle>
            <CardDescription>Detailed analytics for report generation and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Advanced analytics charts and data visualizations would go here.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User Behavior</CardTitle>
            <CardDescription>Insights into user interaction patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">User behavior analytics would be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );

  // Renders the "request access" UI for unauthorized users
  const renderRequestAccess = () => (
     <div className="flex items-center justify-center h-full">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need the "Data Analyst" role to access this page.
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>Access reporting analytics and data insights</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Request access from your administrator to gain Data Analyst permissions.
              </p>
              <Button onClick={handleRequestAccess} disabled={isRequestingAccess} size="lg">
                {isRequestingAccess ? 'Requesting Access...' : 'Requesting Access'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
  );
  
  // Main return statement
  return (
    <div className="container mx-auto py-8">
      {userLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : !user ? (
        <div className="text-center">
          <p>Please log in to access analytics.</p>
          <Button asChild>
            <Link href="/api/auth/login?returnTo=/analytics">Login</Link>
          </Button>
        </div>
      ) : hasAnalyticsAccess ? (
        renderDashboard()
      ) : (
        renderRequestAccess()
      )}
    </div>
  );
}