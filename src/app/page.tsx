'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useState } from 'react';
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Fuel, TrendingUp, DollarSign, Truck, LogIn, AlertTriangle, Package, Calendar } from "lucide-react"

// Fictitious data for the dashboard
const kpiData = [
  { title: "Current Tank Level", value: "62%", change: "Last fill: 15 days ago", icon: Fuel, color: "text-blue-500" },
  { title: "Monthly Usage", value: "43 gal", change: "+8 gal from last month", icon: TrendingUp, color: "text-orange-500" },
  { title: "Current Balance", value: "$245.50", change: "Due: Feb 28, 2026", icon: DollarSign, color: "text-green-500" },
  { title: "Next Delivery", value: "Feb 18", change: "Automatic delivery", icon: Truck, color: "text-purple-500" },
];

const recentDeliveries = [
  { id: "DEL-001", date: "Jan 18, 2026", gallons: 125.0, amount: 312.50, status: "Delivered" },
  { id: "DEL-002", date: "Dec 20, 2025", gallons: 98.5, amount: 246.25, status: "Delivered" },
  { id: "DEL-003", date: "Nov 15, 2025", gallons: 142.0, amount: 355.00, status: "Delivered" },
  { id: "DEL-004", date: "Oct 10, 2025", gallons: 110.0, amount: 275.00, status: "Delivered" },
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
              <Fuel className="h-6 w-6 text-blue-600" />
              MyGasHub Dashboard
            </CardTitle>
            <CardDescription>
              Please log in to manage your propane delivery and account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You need to be logged in to order propane, check tank levels, and manage delivery preferences.
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
    <PropaneDashboard user={user} />
  );
}

function PropaneDashboard({ user }: { user: any }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Get current delivery preferences from user metadata
  const userMetadata = user?.['https://agency-inc-demo.com/user_metadata'] || user?.user_metadata || {};
  const [preferences, setPreferences] = useState({
    autoDelivery: userMetadata.auto_delivery || false,
    emailNotifications: userMetadata.email_notifications || false,
    smsAlerts: userMetadata.sms_alerts || false,
    lowTankAlerts: userMetadata.low_tank_alerts || false,
  });

  const handlePreferenceChange = async (key: string, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    setIsSaving(true);
    setSaveMessage('');

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
        setSaveMessage('Preferences saved successfully!');
      } else {
        setSaveMessage('Failed to save preferences. Please try again.');
      }
    } catch (error) {
      setSaveMessage('Error saving preferences. Please try again.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold">Propane Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name || user.email}! Manage your propane delivery and account.
        </p>
      </header>

      {/* Quick Action Button */}
      <div>
        <Button size="lg" className="w-full md:w-auto">
          <Package className="mr-2 h-5 w-5" />
          Order Propane Delivery
        </Button>
      </div>

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
              <p className="text-xs text-muted-foreground">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Deliveries */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Deliveries</CardTitle>
            <CardDescription>Your propane delivery history and billing statements.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delivery ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Gallons</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">{delivery.id}</TableCell>
                    <TableCell>{delivery.date}</TableCell>
                    <TableCell className="text-right">{delivery.gallons.toFixed(1)}</TableCell>
                    <TableCell className="text-right">${delivery.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default">{delivery.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                View Consolidated Billing Statement
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Preferences */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Delivery Preferences</CardTitle>
            <CardDescription>Manage your automatic delivery settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoDelivery"
                checked={preferences.autoDelivery}
                onCheckedChange={(checked) => handlePreferenceChange('auto_delivery', checked as boolean)}
                disabled={isSaving}
              />
              <Label htmlFor="autoDelivery" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Enable automatic delivery
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailNotifications"
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => handlePreferenceChange('email_notifications', checked as boolean)}
                disabled={isSaving}
              />
              <Label htmlFor="emailNotifications" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email notifications
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="smsAlerts"
                checked={preferences.smsAlerts}
                onCheckedChange={(checked) => handlePreferenceChange('sms_alerts', checked as boolean)}
                disabled={isSaving}
              />
              <Label htmlFor="smsAlerts" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                SMS delivery alerts
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="lowTankAlerts"
                checked={preferences.lowTankAlerts}
                onCheckedChange={(checked) => handlePreferenceChange('low_tank_alerts', checked as boolean)}
                disabled={isSaving}
              />
              <Label htmlFor="lowTankAlerts" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Low tank level alerts
              </Label>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}