// Test Firebase Storage Configuration
// Run: node test-storage.js

const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');

const firebaseConfig = {
  apiKey: "AIzaSyDAaetYa2rdX86TIfUrI7MSdXSVJTaMBRw",
  authDomain: "sih-kerala.firebaseapp.com",
  projectId: "sih-kerala",
  storageBucket: "sih-kerala.firebasestorage.app",
  messagingSenderId: "84752283767",
  appId: "1:84752283767:web:c3b1ca8f6afe1ba4bdee72"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function testStorageUpload() {
  try {
    console.log('🔄 Testing Firebase Storage...');
    
    // Create a test file
    const testData = Buffer.from('Hello Firebase Storage!', 'utf8');
    const storageRef = ref(storage, 'test/test-file.txt');
    
    // Upload the file
    await uploadBytes(storageRef, testData);
    console.log('✅ File uploaded successfully!');
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('✅ Download URL generated:', downloadURL);
    
  } catch (error) {
    console.error('❌ Storage test failed:', error.code, error.message);
    
    if (error.code === 'storage/unauthorized') {
      console.log('🔧 Fix: Update your Firebase Storage rules');
    } else if (error.code === 'storage/unknown' && error.status_ === 404) {
      console.log('🔧 Fix: Enable Firebase Storage in console');
      console.log('   Go to: https://console.firebase.google.com/project/sih-kerala/storage');
    }
  }
}

testStorageUpload();