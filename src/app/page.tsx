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
import { DollarSign, FileText, CheckCircle, Clock, LogIn, AlertTriangle, CreditCard, Calendar } from "lucide-react"

// Fictitious data for the dashboard
const kpiData = [
  { title: "Current Balance", value: "$2,847.50", change: "-$215.00", icon: DollarSign, color: "text-blue-600" },
  { title: "Next Payment Due", value: "Apr 15", change: "5 days", icon: Calendar, color: "text-orange-500" },
  { title: "Payments This Month", value: "3", change: "+1", icon: CheckCircle, color: "text-green-600" },
  { title: "Payment Methods", value: "2", change: "Active", icon: CreditCard, color: "text-blue-500" },
];

const recentTransactions = [
  { id: "PAY-1047", payee: "Jennifer Martinez", amount: 285.50, status: "Completed" },
  { id: "PAY-1046", payee: "Michael Johnson", amount: 425.00, status: "Pending" },
  { id: "PAY-1045", payee: "Sarah Thompson", amount: 315.75, status: "Completed" },
  { id: "PAY-1044", payee: "David Chen", amount: 198.00, status: "Failed" },
  { id: "PAY-1043", payee: "Emily Rodriguez", amount: 340.25, status: "Completed" },
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
              <FileText className="h-6 w-6 text-blue-600" />
              SecurePay Portal
            </CardTitle>
            <CardDescription>
              Please log in to access your dashboard and manage your payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You need to be logged in to view your dashboard, manage payment methods, and track transactions.
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
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      setSaveMessage('Error saving preferences. Please try again.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold">Payment Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name || user.email}! Manage your payments and view your account activity.
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
        {/* Recent Transactions */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your most recent payment activity and transaction history.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Payee</TableHead>
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
                        transaction.status === 'Completed' ? 'default' : transaction.status === 'Pending' ? 'secondary' : 'destructive'
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
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your notification and payment preferences.</CardDescription>
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
                  Auto-Pay Enabled
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically process scheduled payments
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
                  Receive payment alerts via email
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
                  Receive payment reminders via text
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
                  Payment Alerts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive due date and balance reminders
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