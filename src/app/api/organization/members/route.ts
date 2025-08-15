import { NextRequest } from 'next/server';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { managementClient } from '@/lib/auth0-mgmt-client';
import { inviteMemberSchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const roles = user?.['https://agency-inc-demo.com/roles'] || [];

    if (!roles.includes('Admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orgId = user?.org_id;
    if (!orgId) {
      return Response.json(
        { error: 'Organization not found in session.' },
        { status: 400 }
      );
    }

    const members = await managementClient.organizations.getMembers({ id: orgId });
    return Response.json(members.data);
  } catch (error: any) {
    console.error('Failed to fetch organization members:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const roles = user?.['https://agency-inc-demo.com/roles'] || [];

    if (!roles.includes('Admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orgId = user?.org_id;
    if (!orgId) {
      return Response.json(
        { error: 'Organization not found in session.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = inviteMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return Response.json(
        { 
          error: 'Invalid input',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Get the organization's enabled connections
    const connections = await managementClient.organizations.getEnabledConnections({ id: orgId });
    
    // Find a database connection that supports signup
    const signupConnection = connections.data.find(conn => 
      conn.connection?.strategy === 'auth0' && conn.is_signup_enabled
    );

    if (!signupConnection) {
      return Response.json(
        { error: 'No signup-enabled database connection found for this organization' },
        { status: 400 }
      );
    }

    console.log('Using connection for invitation:', {
      connection_id: signupConnection.connection_id,
      connection_name: signupConnection.connection?.name,
      is_signup_enabled: signupConnection.is_signup_enabled,
      assign_membership_on_login: signupConnection.assign_membership_on_login
    });

    const invitation = await managementClient.organizations.createInvitation(
      { id: orgId },
      {
        invitee: { email },
        inviter: { name: user?.name || 'Administrator' },
        client_id: process.env.AUTH0_CLIENT_ID!,
        connection_id: signupConnection.connection_id,
      }
    );

    console.log('Invitation created with URL:', invitation.data);
    return Response.json(invitation.data, { status: 201 });
  } catch (error: any) {
    console.error('Failed to invite member:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: error.statusCode || 500 }
    );
  }
}