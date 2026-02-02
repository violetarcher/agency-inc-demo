import { NextRequest } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { managementClient } from '@/lib/auth0-mgmt-client';

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();

    // Get current user metadata
    const userDetails = await managementClient.users.get({ id: userId });
    const currentMetadata = userDetails.data.user_metadata || {};

    // Merge new preferences with existing metadata
    const updatedMetadata = {
      ...currentMetadata,
      ...body,
    };

    // Update user_metadata in Auth0
    await managementClient.users.update(
      { id: userId },
      { user_metadata: updatedMetadata }
    );

    return Response.json({
      success: true,
      message: 'Preferences updated successfully',
      metadata: updatedMetadata
    });
  } catch (error: any) {
    console.error('Failed to update user preferences:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: error.statusCode || 500 }
    );
  }
}
