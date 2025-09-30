import admin from 'firebase-admin';

/**
 * Safe initializer for Firebase Admin SDK.
 * - If FIREBASE_SERVICE_ACCOUNT_KEY is present, initialize admin and return the admin namespace.
 * - If not present, return null so callers can handle the missing credentials gracefully.
 */
export function getAdmin(): typeof admin | null {
  try {
    if (admin.apps.length) return admin;

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_PRIVATE_KEY;
    if (!raw) {
      // Credentials not provided
      return null;
    }

    // If FIREBASE_SERVICE_ACCOUNT_KEY is a JSON string, parse it. If only private key is provided, try to build a minimal service account.
    let serviceAccount: any = null;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    } catch (e) {
      // Not JSON — maybe only FIREBASE_PRIVATE_KEY is set along with FIREBASE_CLIENT_EMAIL
      const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY as string | undefined;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL as string | undefined;
      if (privateKeyRaw && clientEmail) {
        serviceAccount = {
          client_email: clientEmail,
          private_key: privateKeyRaw,
        };
      } else {
        // Could not parse credentials
        console.warn('FIREBASE_SERVICE_ACCOUNT_KEY present but could not parse it and no FIREBASE_PRIVATE_KEY+FIREBASE_CLIENT_EMAIL found');
        return null;
      }
    }

    // Normalize private_key newlines if present
    if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    return admin;
  } catch (err) {
    console.error('Error initializing Firebase Admin:', err);
    return null;
  }
}

export default getAdmin;
