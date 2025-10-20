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
import { ShoppingCart, Package, TrendingUp, Store, LogIn, AlertTriangle, DollarSign } from "lucide-react"

// Fictitious data for the dashboard
const kpiData = [
  { title: "Monthly Revenue", value: "$2.4M", change: "+18.2%", icon: TrendingUp, color: "text-green-600" },
  { title: "Orders This Month", value: "342", change: "+24", icon: ShoppingCart, color: "text-blue-600" },
  { title: "Active Retail Partners", value: "156", change: "+8", icon: Store, color: "text-purple-600" },
  { title: "Items Shipped", value: "8,450", change: "+156", icon: Package, color: "text-amber-600" },
];

const recentOrders = [
  { id: "ORD-2847", customer: "Pebble Beach Pro Shop", items: "Golf Balls, Gloves", amount: 12450.00, status: "Shipped" },
  { id: "ORD-2848", customer: "Golf Galaxy - Denver", items: "Titleist Clubs, Bags", amount: 34580.50, status: "Processing" },
  { id: "ORD-2849", customer: "PGA Superstore - Miami", items: "FootJoy Apparel", amount: 18920.00, status: "Shipped" },
  { id: "ORD-2850", customer: "Torrey Pines Golf Club", items: "Range Balls, Tees", amount: 5640.00, status: "Delivered" },
  { id: "ORD-2851", customer: "Dick's Sporting Goods", items: "Vokey Wedges", amount: 28750.00, status: "Processing" },
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
              <Package className="h-6 w-6 text-green-600" />
              GolfClub Pro Dashboard
            </CardTitle>
            <CardDescription>
              Please log in to access your golf equipment distribution portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You need to be logged in to manage orders, inventory, and retail partners.
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipment Sales Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name || user.email}! Here's your B2B sales overview.
          </p>
        </div>
        <Button asChild size="lg">
          <a href="http://localhost:4040/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Go to Billing
          </a>
        </Button>
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
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>The 5 most recent B2B equipment orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{order.items}</TableCell>
                    <TableCell className="text-right">${order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-center">
                       <Badge variant={
                          order.status === 'Delivered' ? 'default' :
                          order.status === 'Shipped' ? 'secondary' :
                          'outline'
                       }>
                        {order.status}
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
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best-selling equipment this month.</CardDescription>
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