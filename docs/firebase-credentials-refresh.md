# Firebase Credentials Refresh Guide

## 🔄 Steps to Refresh Firebase Credentials (Same Project)

### 1. Generate New Web App Credentials
1. Go to Firebase Console → Project Settings → General
2. Scroll to "Your apps" section
3. Either:
   - Click on existing web app → Config
   - Or click "Add app" → Web → Create new web app

### 2. Generate New Service Account Key
1. Go to Project Settings → Service accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the credentials for .env.local

### 3. Update Environment Variables
Replace only the credentials that changed:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_APP_ID  
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL

## ✅ This Approach Keeps:
- All existing user accounts
- All Firestore data
- All storage files
- Current project settings