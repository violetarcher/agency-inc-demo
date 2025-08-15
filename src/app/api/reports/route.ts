import { NextRequest } from 'next/server';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { db } from '@/lib/firebase-admin';
import { createReportSchema } from '@/lib/validations';

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const user = session?.user;
    const permissions = session?.accessTokenScope?.split(' ') || [];

    if (!permissions.includes('read:reports')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const reportsCollection = db.collection('reports');
    const snapshot = await reportsCollection.orderBy('createdAt', 'desc').get();
    const reports = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
    return Response.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return Response.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
});

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const user = session?.user;
    const permissions = session?.accessTokenScope?.split(' ') || [];

    if (!permissions.includes('create:reports')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = createReportSchema.safeParse(body);

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
    const newReport = {
      title: validationResult.data.title,
      amount: validationResult.data.amount,
      author: user?.name,
      authorId: user?.sub,
      createdAt: new Date().toISOString(),
    };

    const docRef = await reportsCollection.add(newReport);
    return Response.json({ id: docRef.id, ...newReport }, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return Response.json({ error: 'Failed to create report' }, { status: 500 });
  }
});