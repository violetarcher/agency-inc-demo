import { NextRequest } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { managementClient } from '@/lib/auth0-mgmt-client';
import { IncomingWebhook } from '@slack/webhook';
import { accessRequestSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const body = await request.json();
    
    // Validate the request body
    const validationResult = accessRequestSchema.safeParse(body.accessRequest || body);
    if (!validationResult.success) {
      return Response.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const accessRequest = validationResult.data;

    // Check if Slack webhook URL is configured
    if (!process.env.SLACK_WEBHOOK_LOGIN_URL) {
      console.error('SLACK_WEBHOOK_LOGIN_URL not configured');
      return Response.json(
        { error: 'Notification service not configured' },
        { status: 500 }
      );
    }

    const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_LOGIN_URL);

    // Set the pending request metadata in Auth0
    await managementClient.users.update(
      { id: user.sub },
      { app_metadata: { pending_access_request: accessRequest } }
    );

    // Send the Slack notification
    const accessRequestText = `🔒 *Access Request - Analytics Dashboard*

*User Details:*
• Name: ${user.name || user.email}
• Email: ${user.email}
• User ID: ${user.sub}
• Organization: ${user['https://agency-inc-demo.com/org_name'] || 'Unknown'}

*Request Details:*
• Requested Role: ${accessRequest.role}
• Reason: ${accessRequest.reason}

*Action Required:*
Please review this access request and update the user's roles in Auth0 if approved.`;

    await webhook.send({
      text: accessRequestText,
      username: 'Agency Inc Dashboard',
      icon_emoji: ':key:'
    });

    return Response.json({ 
      success: true, 
      message: 'Access request submitted successfully' 
    });

  } catch (error: any) {
    console.error('Access request error:', error);
    
    // If it's a validation error, return specific message
    if (error.name === 'ZodError') {
      return Response.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return Response.json(
      { 
        error: 'Failed to submit access request',
        details: error.message
      },
      { status: 500 }
    );
  }
}