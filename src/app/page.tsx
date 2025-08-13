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
import { DollarSign, FileText, CheckCircle, Clock, LogIn, AlertTriangle } from "lucide-react"

// Fictitious data for the dashboard
const kpiData = [
  { title: "Monthly Expenses", value: "$12,450", change: "+5.2%", icon: DollarSign, color: "text-green-500" },
  { title: "Reports Submitted", value: "82", change: "+10", icon: FileText, color: "text-blue-500" },
  { title: "Pending Approval", value: "7", change: "-2", icon: Clock, color: "text-yellow-500" },
  { title: "Approved This Month", value: "75", change: "+12", icon: CheckCircle, color: "text-green-500" },
];

const recentReports = [
  { id: "REP-001", user: "Elena Rodriguez", amount: 450.00, status: "Approved" },
  { id: "REP-002", user: "Marcus Chen", amount: 125.50, status: "Pending" },
  { id: "REP-003", user: "Sophie Dubois", amount: 890.75, status: "Approved" },
  { id: "REP-004", user: "Ben Carter", amount: 320.00, status: "Rejected" },
  { id: "REP-005", user: "Elena Rodriguez", amount: 65.00, status: "Pending" },
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
              Agency Inc Dashboard
            </CardTitle>
            <CardDescription>
              Please log in to access your dashboard and manage your reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You need to be logged in to view your dashboard, submit reports, and track expenses.
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
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name || user.email}! Here's your central hub.
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
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>A list of the 5 most recently submitted reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.id}</TableCell>
                    <TableCell>{report.user}</TableCell>
                    <TableCell className="text-right">${report.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                       <Badge variant={
                          report.status === 'Approved' ? 'default' : report.status === 'Pending' ? 'secondary' : 'destructive'
                       }>
                        {report.status}
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
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Expenses by category for the current month.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>(Chart visualization would be rendered here)</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}