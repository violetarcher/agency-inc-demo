'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DollarSign, CheckCircle, LogIn, AlertTriangle, CreditCard, Calendar, Heart } from "lucide-react"

// Fictitious data for the dashboard
const kpiData = [
  { title: "Out-of-Pocket Remaining", value: "$1,250.00", change: "-$285.00 paid", icon: DollarSign, color: "text-blue-600" },
  { title: "Deductible Met", value: "85%", change: "$1,700 of $2,000", icon: CheckCircle, color: "text-green-600" },
  { title: "Claims This Month", value: "3", change: "+1 pending", icon: Heart, color: "text-purple-600" },
  { title: "Coverage Status", value: "Active", change: "Renews Dec 31", icon: CreditCard, color: "text-blue-500" },
];

const recentTransactions = [
  { id: "CLM-1047", payee: "Dr. Sarah Chen - Therapy", amount: 285.00, status: "Approved" },
  { id: "CLM-1046", payee: "City General Hospital - Lab Work", amount: 425.00, status: "Pending" },
  { id: "CLM-1045", payee: "Dr. Michael Torres - Consultation", amount: 315.00, status: "Approved" },
  { id: "CLM-1044", payee: "Westside Pharmacy - Prescriptions", amount: 198.00, status: "Denied" },
  { id: "CLM-1043", payee: "Advanced Imaging Center - MRI", amount: 1340.00, status: "Approved" },
];

export default function HomePage() {
  const { user, error, isLoading } = useUser();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Authentication error: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Not logged in - show login prompt
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Heart className="h-6 w-6 text-purple-600" />
              SecureHealth Portal
            </CardTitle>
            <CardDescription>
              Please log in to access your dashboard and manage your healthcare.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You need to be logged in to view your dashboard, manage healthcare claims, and track coverage.
            </p>
            <Button asChild size="lg" className="w-full">
              <a href="/api/auth/login" className="flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4" />
                Log In to Continue
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is logged in - show dashboard
  return (
    <Dashboard user={user} />
  );
}

function Dashboard({ user }: { user: any }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [preferences, setPreferences] = useState({
    autoApproveReports: false,
    emailNotifications: false,
    smsAlerts: false,
    systemAlerts: false,
  });

  // Fetch user metadata function
  const fetchMetadata = async () => {
    try {
      const response = await fetch('/api/user/metadata');
      if (response.ok) {
        const data = await response.json();
        const metadata = data.user_metadata || {};

        console.log('Fetched metadata:', metadata);

        setPreferences({
          autoApproveReports: metadata.auto_approve_reports === true,
          emailNotifications: metadata.email_notifications === true,
          smsAlerts: metadata.sms_alerts === true,
          systemAlerts: metadata.system_alerts === true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user metadata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user metadata on component mount
  useEffect(() => {
    fetchMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePreferenceChange = async (key: string, value: boolean) => {
    // Map snake_case backend keys to camelCase frontend keys
    const keyMap: { [key: string]: keyof typeof preferences } = {
      'auto_approve_reports': 'autoApproveReports',
      'email_notifications': 'emailNotifications',
      'sms_alerts': 'smsAlerts',
      'system_alerts': 'systemAlerts',
    };

    const frontendKey = keyMap[key];

    // Optimistically update UI immediately
    setPreferences(prev => ({
      ...prev,
      [frontendKey]: value,
    }));

    setIsSaving(true);
    setSaveMessage('');

    console.log('Updating preference:', key, '=', value);

    try {
      // Update user_metadata via API
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [key]: value,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Update successful, new metadata:', data.metadata);

        // Refetch metadata to ensure UI is in sync
        await fetchMetadata();
        setSaveMessage('Preferences saved successfully!');
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        setSaveMessage('Failed to save preferences. Please try again.');

        // Revert optimistic update on failure
        setPreferences(prev => ({
          ...prev,
          [frontendKey]: !value,
        }));
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      setSaveMessage('Error saving preferences. Please try again.');

      // Revert optimistic update on error
      setPreferences(prev => ({
        ...prev,
        [frontendKey]: !value,
      }));
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold">Healthcare Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name || user.email}! View your coverage, claims, and healthcare activity.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Claims */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Claims</CardTitle>
            <CardDescription>Your most recent healthcare claims and reimbursement status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Provider / Service</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.id}</TableCell>
                    <TableCell>{transaction.payee}</TableCell>
                    <TableCell className="text-right">${transaction.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={
                        transaction.status === 'Approved' ? 'default' : transaction.status === 'Pending' ? 'secondary' : 'destructive'
                      }>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Healthcare Preferences</CardTitle>
            <CardDescription>Manage your healthcare notification preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoApproveReports" className="text-sm font-medium">
                  Auto-Submit Claims
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically submit eligible claims
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${preferences.autoApproveReports ? 'text-green-600' : 'text-gray-400'}`}>
                  {preferences.autoApproveReports ? 'ON' : 'OFF'}
                </span>
                <Switch
                  id="autoApproveReports"
                  checked={preferences.autoApproveReports}
                  onCheckedChange={(checked: boolean) => handlePreferenceChange('auto_approve_reports', checked)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotifications" className="text-sm font-medium">
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive claim status updates via email
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${preferences.emailNotifications ? 'text-green-600' : 'text-gray-400'}`}>
                  {preferences.emailNotifications ? 'ON' : 'OFF'}
                </span>
                <Switch
                  id="emailNotifications"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked: boolean) => handlePreferenceChange('email_notifications', checked)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="smsAlerts" className="text-sm font-medium">
                  SMS Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive appointment and claim reminders
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${preferences.smsAlerts ? 'text-green-600' : 'text-gray-400'}`}>
                  {preferences.smsAlerts ? 'ON' : 'OFF'}
                </span>
                <Switch
                  id="smsAlerts"
                  checked={preferences.smsAlerts}
                  onCheckedChange={(checked: boolean) => handlePreferenceChange('sms_alerts', checked)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="systemAlerts" className="text-sm font-medium">
                  Coverage Alerts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive deductible and coverage updates
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${preferences.systemAlerts ? 'text-green-600' : 'text-gray-400'}`}>
                  {preferences.systemAlerts ? 'ON' : 'OFF'}
                </span>
                <Switch
                  id="systemAlerts"
                  checked={preferences.systemAlerts}
                  onCheckedChange={(checked: boolean) => handlePreferenceChange('system_alerts', checked)}
                  disabled={isSaving}
                />
              </div>
            </div>

            {saveMessage && (
              <Alert className={saveMessage.includes('success') ? 'border-green-500' : 'border-red-500'}>
                <AlertDescription>{saveMessage}</AlertDescription>
              </Alert>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Your preferences are saved automatically when you make changes.
              </p>
            </div>
            </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}