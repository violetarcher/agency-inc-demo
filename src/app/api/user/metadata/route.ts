import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { managementClient } from '@/lib/auth0-mgmt-client';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { user_metadata, name } = body;

    // Update user metadata via Auth0 Management API
    const updatedUser = await managementClient.users.update(
      { id: session.user.sub! },
      {
        user_metadata,
        name,
      }
    );

    console.log('Successfully updated user metadata for:', session.user.sub);

    return NextResponse.json({
      success: true,
      message: 'User metadata updated successfully',
      user: updatedUser.data
    });
  } catch (error: unknown) {
    console.error('Error updating user metadata:', error);

    const errorObj = error as { statusCode?: number };
    if (errorObj.statusCode === 401) {
      return NextResponse.json(
        { error: 'Unauthorized: Check Management API credentials' },
        { status: 401 }
      );
    } else if (errorObj.statusCode === 403) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient scopes for user update' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user metadata', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
