import { NextRequest, NextResponse } from 'next/server';

/**
 * Kong-Protected Documents Endpoint
 *
 * This endpoint demonstrates document management protected by Kong Gateway.
 */

// Mock documents database
const mockDocuments = [
  {
    id: 'DOC-001',
    name: 'Employee Handbook 2026.pdf',
    type: 'PDF',
    size: '2.4 MB',
    lastModified: '2026-01-10T08:00:00Z'
  },
  {
    id: 'DOC-002',
    name: 'Q1 Budget Proposal.xlsx',
    type: 'Spreadsheet',
    size: '890 KB',
    lastModified: '2026-02-15T13:45:00Z'
  },
  {
    id: 'DOC-003',
    name: 'Project Timeline.docx',
    type: 'Document',
    size: '1.2 MB',
    lastModified: '2026-03-05T10:30:00Z'
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
    const type = searchParams.get('type');

    // Filter documents if type provided
    let filteredDocs = mockDocuments;
    if (type) {
      filteredDocs = mockDocuments.filter(d => d.type.toLowerCase() === type.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      data: {
        documents: filteredDocs,
        total: filteredDocs.length,
        requestedBy: {
          userId,
          email: userEmail
        }
      },
      message: 'Documents retrieved successfully via Kong Gateway'
    });

  } catch (error: any) {
    console.error('Documents GET error:', error);
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
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      );
    }

    // Create new document
    const newDocument = {
      id: `DOC-${String(mockDocuments.length + 1).padStart(3, '0')}`,
      name: body.name,
      type: body.type,
      size: body.size || 'Unknown',
      lastModified: new Date().toISOString(),
      uploadedBy: {
        userId,
        email: userEmail,
        name: userName
      }
    };

    console.log('New document created via Kong:', newDocument);

    return NextResponse.json({
      success: true,
      data: newDocument,
      message: 'Document created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Documents POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Get document ID from query
    const searchParams = request.nextUrl.searchParams;
    const docId = searchParams.get('id');

    if (!docId) {
      return NextResponse.json(
        { error: 'Missing document ID' },
        { status: 400 }
      );
    }

    console.log(`Document ${docId} deleted by user ${userId} via Kong`);

    return NextResponse.json({
      success: true,
      message: `Document ${docId} deleted successfully`
    });

  } catch (error: any) {
    console.error('Documents DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
