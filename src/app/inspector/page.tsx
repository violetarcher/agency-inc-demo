import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Helper function to safely decode a JWT payload
function decodeJwtPayload(token: string) {
  try {
    const payload = Buffer.from(token.split('.')[1], 'base64').toString();
    return JSON.parse(payload);
  } catch (e) {
    return { error: "Failed to decode token." };
  }
}

// 1. Define the page component as a standalone async function
async function InspectorPage() {
  const session = await getSession();
  
  const decodedIdToken = session?.idToken ? decodeJwtPayload(session.idToken) : null;
  const decodedAccessToken = session?.accessToken ? decodeJwtPayload(session.accessToken) : null;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-3xl font-bold">Token Inspector</h1>
        <p className="text-muted-foreground">Decoded contents of your session tokens.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ID Token</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs p-4 bg-muted rounded-md overflow-x-auto max-h-96 overflow-y-auto">
              <code>{JSON.stringify(decodedIdToken, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Access Token</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs p-4 bg-muted rounded-md overflow-x-auto max-h-96 overflow-y-auto">
              <code>{JSON.stringify(decodedAccessToken, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 2. Export the component wrapped in the protector
export default withPageAuthRequired(InspectorPage, { returnTo: '/inspector' });