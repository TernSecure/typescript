{/*import admin from 'firebase-admin';
import { initializeAdminConfig } from './config';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const config = initializeAdminConfig();
    admin.initializeApp({
      credential: admin.credential.cert({
        ...config,
        privateKey: config.privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// Add explicit type annotations using the types from the admin namespace
export const adminTernSecureAuth: admin.auth.Auth = admin.auth();
export const adminTernSecureDb: admin.firestore.Firestore = admin.firestore();
export const TernSecureTenantManager: admin.auth.TenantManager = admin.auth().tenantManager();*/}