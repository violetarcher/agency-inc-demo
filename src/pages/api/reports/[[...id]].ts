import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { db } from '../../../lib/firebase-admin'; // Adjust the path based on your structure

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);
  const user = session?.user;
  const permissions = session?.accessTokenScope?.split(' ') || [];

  const { id } = req.query;
  const reportId = Array.isArray(id) ? id[0] : id;

  const reportsCollection = db.collection('reports');

  switch (req.method) {
    case 'GET':
      if (!permissions.includes('read:reports')) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      try {
        const snapshot = await reportsCollection.orderBy('createdAt', 'desc').get();
        const reports = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json(reports);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch reports' });
      }

    case 'POST':
      if (!permissions.includes('create:reports')) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      try {
        const newReport = {
          ...req.body,
          author: user?.name,
          authorId: user?.sub, 
          createdAt: new Date().toISOString(),
        };
        const docRef = await reportsCollection.add(newReport);
        return res.status(201).json({ id: docRef.id, ...newReport });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to create report' });
      }

    case 'PUT':
      if (!permissions.includes('edit:reports')) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (!reportId) {
          return res.status(400).json({ error: 'Report ID is required' });
      }
      try {
        const reportRef = reportsCollection.doc(reportId);
        const reportDoc = await reportRef.get();

        if (!reportDoc.exists) {
          return res.status(404).json({ error: 'Report not found' });
        }

        const reportData = reportDoc.data();
        
        if (reportData?.authorId !== user?.sub) {
          return res.status(403).json({ error: 'Forbidden: You can only edit your own reports.' });
        }

        const updatedData = { ...req.body, updatedAt: new Date().toISOString() };
        await reportRef.update(updatedData);
        return res.status(200).json({ id: reportId, ...updatedData });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to update report' });
      }

    case 'DELETE':
      if (!permissions.includes('delete:reports')) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (!reportId) {
        return res.status(400).json({ error: 'Report ID is required' });
      }
      try {
        await reportsCollection.doc(reportId).delete();
        return res.status(204).end();
      } catch (error) {
        return res.status(500).json({ error: 'Failed to delete report' });
      }
      
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});