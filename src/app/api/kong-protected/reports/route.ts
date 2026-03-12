import { NextRequest, NextResponse } from 'next/server';

/**
 * Kong-Protected Reports Endpoint
 *
 * This endpoint demonstrates CRUD operations protected by Kong Gateway.
 */

// Mock reports database
const mockReports = [
  {
    id: 'RPT-001',
    title: 'Q1 Financial Summary',
    status: 'Approved',
    amount: 45230.50,
    createdAt: '2026-01-15T10:30:00Z'
  },
  {
    id: 'RPT-002',
    title: 'Travel Expenses - March',
    status: 'Pending',
    amount: 1250.75,
    createdAt: '2026-03-10T14:20:00Z'
  },
  {
    id: 'RPT-003',
    title: 'Office Supplies - Q1',
    status: 'Approved',
    amount: 890.00,
    createdAt: '2026-02-20T09:15:00Z'
  }
];

export async function GET(request: NextRequest) {
  try {
    // Verify Kong protection
    const kongProtected = request.headers.get('X-Kong-Protected');
    if (!kongProtected) {
      return NextResponse.json(
        { error: 'This endpoint must be accessed through Kong Gateway' },
        { status: 401 }
      );
    }

    // Extract user info from Kong headers
    const userId = request.headers.get('X-User-Id');
    const userEmail = request.headers.get('X-User-Email');

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    // Filter reports if status provided
    let filteredReports = mockReports;
    if (status) {
      filteredReports = mockReports.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      data: {
        reports: filteredReports,
        total: filteredReports.length,
        requestedBy: {
          userId,
          email: userEmail
        }
      },
      message: 'Reports retrieved successfully via Kong Gateway'
    });

  } catch (error: any) {
    console.error('Reports GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify Kong protection
    const kongProtected = request.headers.get('X-Kong-Protected');
    if (!kongProtected) {
      return NextResponse.json(
        { error: 'This endpoint must be accessed through Kong Gateway' },
        { status: 401 }
      );
    }

    // Extract user info from Kong headers
    const userId = request.headers.get('X-User-Id');
    const userEmail = request.headers.get('X-User-Email');
    const userName = request.headers.get('X-User-Name');

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.amount) {
      return NextResponse.json(
        { error: 'Missing required fields: title, amount' },
        { status: 400 }
      );
    }

    // Create new report
    const newReport = {
      id: `RPT-${String(mockReports.length + 1).padStart(3, '0')}`,
      title: body.title,
      status: 'Pending',
      amount: body.amount,
      description: body.description || '',
      createdAt: new Date().toISOString(),
      createdBy: {
        userId,
        email: userEmail,
        name: userName
      }
    };

    console.log('New report created via Kong:', newReport);

    return NextResponse.json({
      success: true,
      data: newReport,
      message: 'Report created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Reports POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
