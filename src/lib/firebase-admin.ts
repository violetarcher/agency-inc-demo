import * as admin from 'firebase-admin';

// Decode the base64 encoded service account key
const serviceAccountJson = Buffer.from(
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!,
  'base64'
).toString('ascii');

const serviceAccount = JSON.parse(serviceAccountJson);

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export { db };