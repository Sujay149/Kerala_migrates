console.log('🔥 Firebase Configuration Verification\n');

// Import your Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log('📋 Current Firebase Configuration:');
console.log('=====================================');
console.log(`Project ID: ${firebaseConfig.projectId}`);
console.log(`Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`Storage Bucket: ${firebaseConfig.storageBucket}`);
console.log(`App ID: ${firebaseConfig.appId}`);
console.log(`Database URL: ${firebaseConfig.databaseURL}`);
console.log(`Measurement ID: ${firebaseConfig.measurementId}\n`);

// Verify all required fields are present
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length === 0) {
  console.log('✅ All required Firebase configuration fields are present!');
} else {
  console.log('❌ Missing required Firebase configuration fields:');
  missingFields.forEach(field => console.log(`   - ${field}`));
}

// Check if we're using the new sih-kerala project
if (firebaseConfig.projectId === 'sih-kerala') {
  console.log('✅ Successfully configured for sih-kerala project!');
} else {
  console.log(`⚠️ Still using project: ${firebaseConfig.projectId}`);
}

console.log('\n🔑 Service Account Status:');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (clientEmail && clientEmail.includes('sih-kerala')) {
  console.log('✅ Service account email updated for sih-kerala');
} else {
  console.log('❌ Service account email needs to be updated');
}

if (privateKey && privateKey.includes('BEGIN PRIVATE KEY')) {
  console.log('✅ Private key is present');
} else {
  console.log('❌ Private key needs to be updated');
}

console.log('\n📱 VAPID Key Status:');
const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
if (vapidKey) {
  console.log('✅ VAPID key is present');
} else {
  console.log('❌ VAPID key is missing');
}

export default firebaseConfig;