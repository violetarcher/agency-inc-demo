import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Agency Inc.</CardTitle>
          <CardDescription>Expense Reporting Dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Please log in to manage your expense reports.</p>
          <Button asChild className="w-full">
            {/* Remember to use your actual Organization ID here */}
            <Link href="/api/auth/login?organization=org_YOUR_ORG_ID&returnTo=/dashboard">
              Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}