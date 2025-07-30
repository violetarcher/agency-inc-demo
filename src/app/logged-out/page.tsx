import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function LoggedOutPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
            <CardHeader>
            <CardTitle className="text-2xl font-bold">Logged Out</CardTitle>
            <CardDescription>You have been successfully logged out.</CardDescription>
            </CardHeader>
            <CardContent>
            <Button asChild className="w-full">
                <Link href="/">Log Back In</Link>
            </Button>
            </CardContent>
        </Card>
    </div>
  );
}