import { NextRequest, NextResponse } from 'next/server';

/**
 * Kong-Protected Analytics Endpoint
 *
 * This endpoint demonstrates how to handle requests that have been validated by Kong Gateway.
 * Kong adds custom headers with user information after validating the JWT token.
 *
 * Flow:
 * 1. Client sends request with Auth0 JWT in Authorization header
 * 2. Kong validates JWT against Auth0
 * 3. Kong forwards request with added headers (X-User-Id, X-User-Email, etc.)
 * 4. This endpoint reads Kong headers and processes the request
 */

// Handle OPTIONS preflight request
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    // Check if request came through Kong
    // Note: Uncomment this after adding Request Transformer plugin to Kong
    // const kongProtected = request.headers.get('X-Kong-Protected');
    // if (!kongProtected) {
    //   return NextResponse.json(
    //     {
    //       error: 'Unauthorized',
    //       message: 'This endpoint must be accessed through Kong Gateway'
    //     },
    //     { status: 401 }
    //   );
    // }

    // Extract user information from Kong headers
    const userId = request.headers.get('X-User-Id');
    const userEmail = request.headers.get('X-User-Email');
    const userName = request.headers.get('X-User-Name');

    // Optional: If Kong didn't add user headers, try to extract from Authorization header
    // (This happens if using JWT plugin instead of OIDC plugin)
    const authHeader = request.headers.get('Authorization');
    let tokenPayload = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Decode JWT (not validating since Kong already did that)
        const base64Payload = token.split('.')[1];
        const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
        tokenPayload = JSON.parse(payload);
      } catch (err) {
        console.error('Failed to decode JWT:', err);
      }
    }

    // Mock analytics data
    const analyticsData = {
      overview: {
        totalRequests: 15234,
        successRate: 98.5,
        avgResponseTime: 145,
        activeUsers: 342
      },
      recentActivity: [
        { timestamp: new Date().toISOString(), action: 'Document Created', user: userName || 'Unknown' },
        { timestamp: new Date(Date.now() - 300000).toISOString(), action: 'Report Submitted', user: userName || 'Unknown' },
        { timestamp: new Date(Date.now() - 600000).toISOString(), action: 'Access Granted', user: userName || 'Unknown' }
      ],
      userInfo: {
        userId: userId || tokenPayload?.sub || 'unknown',
        email: userEmail || tokenPayload?.email || 'unknown',
        name: userName || tokenPayload?.name || 'unknown'
      },
      gateway: {
        protected: true,
        gateway: 'Kong',
        version: request.headers.get('X-Gateway-Version') || 'unknown'
      }
    };

    return NextResponse.json({
      success: true,
      data: analyticsData,
      message: 'Analytics data retrieved successfully via Kong Gateway'
    });

  } catch (error: any) {
    console.error('Analytics endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if request came through Kong
    // Note: Uncomment this after adding Request Transformer plugin to Kong
    // const kongProtected = request.headers.get('X-Kong-Protected');
    // if (!kongProtected) {
    //   return NextResponse.json(
    //     {
    //       error: 'Unauthorized',
    //       message: 'This endpoint must be accessed through Kong Gateway'
    //     },
    //     { status: 401 }
    //   );
    // }

    // Extract user information from Kong headers
    const userId = request.headers.get('X-User-Id');
    const userEmail = request.headers.get('X-User-Email');

    // Parse request body
    const body = await request.json();

    // Log analytics event
    console.log('Analytics event received via Kong:', {
      userId,
      userEmail,
      event: body
    });

    return NextResponse.json({
      success: true,
      message: 'Analytics event logged successfully',
      eventId: `evt_${Date.now()}`,
      user: {
        id: userId,
        email: userEmail
      }
    });

  } catch (error: any) {
    console.error('Analytics POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}
