import { NextRequest } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { managementClient } from '@/lib/auth0-mgmt-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const userId = user.sub;

    if (!userId) {
      return Response.json({ error: 'User ID not found' }, { status: 400 });
    }

    // Get current user metadata from Auth0
    const userDetails = await managementClient.users.get({ id: userId });
    const userMetadata = userDetails.data.user_metadata || {};

    return Response.json({
      success: true,
      user_metadata: userMetadata
    });
  } catch (error: any) {
    console.error('Failed to fetch user metadata:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: error.statusCode || 500 }
    );
  }
}
