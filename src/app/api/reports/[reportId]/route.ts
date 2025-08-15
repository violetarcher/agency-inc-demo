import { NextRequest } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { db } from '@/lib/firebase-admin';
import { updateReportSchema } from '@/lib/validations';

export async function PUT(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = session.user;
    const permissions = session?.accessTokenScope?.split(' ') || [];

    if (!permissions.includes('edit:reports')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { reportId } = params;
    if (!reportId) {
      return Response.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = updateReportSchema.safeParse(body);

    if (!validationResult.success) {
      return Response.json(
        { 
          error: 'Invalid input',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const reportsCollection = db.collection('reports');
    const reportRef = reportsCollection.doc(reportId);
    const reportDoc = await reportRef.get();

    if (!reportDoc.exists) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    const reportData = reportDoc.data();
    
    if (reportData?.authorId !== user?.sub) {
      return Response.json(
        { error: 'Forbidden: You can only edit your own reports.' },
        { status: 403 }
      );
    }

    const updatedData = { 
      ...(validationResult.data.title && { title: validationResult.data.title }),
      ...(validationResult.data.amount !== undefined && { amount: validationResult.data.amount }),
      updatedAt: new Date().toISOString()
    };
    
    await reportRef.update(updatedData);
    return Response.json({ id: reportId, ...updatedData });
  } catch (error) {
    console.error('Error updating report:', error);
    return Response.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = session.user;
    const permissions = session?.accessTokenScope?.split(' ') || [];

    if (!permissions.includes('delete:reports')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { reportId } = params;
    if (!reportId) {
      return Response.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const reportsCollection = db.collection('reports');
    await reportsCollection.doc(reportId).delete();
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting report:', error);
    return Response.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}