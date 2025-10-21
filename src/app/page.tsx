'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
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
import { Shield, Users, TrendingUp, FileCheck, LogIn, AlertTriangle } from "lucide-react"

// Fictitious data for the dashboard
const kpiData = [
  { title: "Total Policies", value: "2,847", change: "+124", icon: Shield, color: "text-blue-600" },
  { title: "Active Clients", value: "1,653", change: "+89", icon: Users, color: "text-indigo-600" },
  { title: "Premium Revenue", value: "$8.4M", change: "+15.2%", icon: TrendingUp, color: "text-green-600" },
  { title: "Claims Processed", value: "156", change: "+23", icon: FileCheck, color: "text-purple-600" },
];

const recentPolicies = [
  { id: "POL-8742", client: "Harrison Estate Trust", type: "Homeowners", premium: 125000.00, status: "Active" },
  { id: "POL-8743", client: "Victoria Chen", type: "Auto & Collections", premium: 78500.00, status: "Pending" },
  { id: "POL-8744", client: "Blackstone Properties LLC", type: "Commercial", premium: 340000.00, status: "Active" },
  { id: "POL-8745", client: "The Morrison Family", type: "Yacht & Aviation", premium: 195000.00, status: "Active" },
  { id: "POL-8746", client: "Alexander Rothschild", type: "Excess Liability", premium: 89000.00, status: "Under Review" },
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
              <Shield className="h-6 w-6 text-blue-600" />
              Safe Insurance Portal
            </CardTitle>
            <CardDescription>
              Please log in to access your insurance management portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Secure access to manage policies, claims, and client portfolios.
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
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold">Insurance Portfolio Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name || user.email}! Manage your luxury insurance operations.
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
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Policies</CardTitle>
            <CardDescription>The 5 most recent policy applications and updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Coverage Type</TableHead>
                  <TableHead className="text-right">Annual Premium</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.id}</TableCell>
                    <TableCell>{policy.client}</TableCell>
                    <TableCell className="text-sm">{policy.type}</TableCell>
                    <TableCell className="text-right">${policy.premium.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-center">
                       <Badge variant={
                          policy.status === 'Active' ? 'default' :
                          policy.status === 'Pending' || policy.status === 'Under Review' ? 'secondary' :
                          'outline'
                       }>
                        {policy.status}
                       </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Coverage Distribution</CardTitle>
            <CardDescription>Breakdown of policies by coverage type.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Homeowners</span>
                <span className="text-sm text-muted-foreground">32%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: '32%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto & Collections</span>
                <span className="text-sm text-muted-foreground">24%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600" style={{ width: '24%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Excess Liability</span>
                <span className="text-sm text-muted-foreground">18%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-purple-600" style={{ width: '18%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Yacht & Aviation</span>
                <span className="text-sm text-muted-foreground">15%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-cyan-600" style={{ width: '15%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Commercial</span>
                <span className="text-sm text-muted-foreground">11%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: '11%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}