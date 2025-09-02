import { NextRequest } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { managementClient } from '@/lib/auth0-mgmt-client';
import { accessRequestSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = accessRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return Response.json(
        { 
          error: 'Invalid input',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { role, reason } = validationResult.data;
    const userId = session.user.sub;

    // Set pending access request in user's app_metadata
    // This will be picked up by the Auth0 Action on next login
    await managementClient.users.update(
      { id: userId },
      {
        app_metadata: {
          pending_access_request: {
            role: role,
            reason: reason,
            requested_at: new Date().toISOString()
          }
        }
      }
    );

    return Response.json({ 
      message: 'Access request submitted successfully. Please log in again to trigger the notification.',
      next_step: 'logout_and_login'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to process access request:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: error.statusCode || 500 }
    );
  }
}