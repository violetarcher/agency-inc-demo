import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Access requests are now handled through the auth flow, not this API endpoint
  return Response.json(
    { 
      error: 'Access requests are handled through authentication flow',
      message: 'Please use the "Request Access" button which redirects to the auth flow'
    },
    { status: 410 } // 410 Gone - indicates this endpoint is no longer used
  );
}