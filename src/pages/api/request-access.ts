import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { managementClient } from '@/lib/auth0-mgmt-client';
import { IncomingWebhook } from '@slack/webhook';

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getSession(req, res);
  const user = session?.user;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // --- Start of Logic from your Action ---
  const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_LOGIN_URL!);
  const accessRequest = req.body.accessRequest; // Get request details from the frontend

  try {
    // 1. Set the pending request metadata in Auth0
    await managementClient.users.updateAppMetadata(
        { id: user.sub },
        { pending_access_request: accessRequest }
    );

    // 2. Send the Slack notification
    const accessRequestText = `🔒 *Access Request - Analytics Dashboard*