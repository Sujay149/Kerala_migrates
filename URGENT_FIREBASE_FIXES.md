# 🚨 URGENT: Fix All Firebase Console Errors

## 📊 Error Analysis from Your Console:

### ❌ Error 1: Firestore Connection Failed
```
Firestore (11.10.0): WebChannelConnection RPC "Listen" stream error
```
**Fix**: Firestore database doesn't exist

### ❌ Error 2: Identity Toolkit API Error  
```
GET https://identitytoolkit.googleapis.com/v1/projects/sih-kerala
400 (Bad Request)
```
**Fix**: Identity Toolkit API not enabled

### ❌ Error 3: Configuration Not Found
```
"errors": [{"message":"CONFIGURATION_NOT_FOUND","domain":"global","reason":"invalid"}]
```
**Fix**: Firebase services not configured

---

## 🔧 IMMEDIATE FIXES REQUIRED:

### 1. 📡 Enable APIs in Google Cloud Console
Go to: https://console.cloud.google.com/apis/dashboard?project=sih-kerala

**Click "ENABLE APIS AND SERVICES" and enable:**
- ✅ Cloud Firestore API
- ✅ Identity and Access Management (IAM) API  
- ✅ Cloud Identity Toolkit API
- ✅ Firebase Management API
- ✅ Firebase Rules API

### 2. 🗄️ Create Firestore Database
Go to: https://console.firebase.google.com/project/sih-kerala/firestore

**Steps:**
1. Click "Create database"
2. Select "Start in test mode" 
3. Choose location: "us-central1"
4. Click "Done"

### 3. 🔐 Enable Authentication
Go to: https://console.firebase.google.com/project/sih-kerala/authentication

**Steps:**
1. Click "Get started"
2. Go to "Sign-in method" tab
3. Enable "Email/Password"
4. Enable "Google" (configure if needed)
5. Go to "Settings" tab → "Authorized domains"
6. Add: `localhost` and `localhost:3000`

### 4. 📦 Enable Storage
Go to: https://console.firebase.google.com/project/sih-kerala/storage

**Steps:**
1. Click "Get started"
2. Select "Start in test mode"
3. Choose same location as Firestore
4. Click "Done"

### 5. 🔑 Generate Service Account
Go to: https://console.firebase.google.com/project/sih-kerala/settings/serviceaccounts/adminsdk

**Steps:**
1. Click "Generate new private key"
2. Download the JSON file
3. Open the JSON file and copy these values to `.env.local`:
   ```
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@sih-kerala.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
   ```

---

## ✅ After Completing All Steps:

### Test Your Setup:
1. **Clear browser cache** (important!)
2. **Restart dev server**: `npm run dev`
3. **Check console** - errors should be gone
4. **Test signup** - should work without errors

### Expected Results:
- ✅ No more Firestore errors
- ✅ Authentication works
- ✅ No more 400 Bad Request errors
- ✅ Clean console logs

---

## 🆘 Still Getting Errors?

### Double-check these:
1. **Project ID** matches: `sih-kerala`
2. **All APIs enabled** in Google Cloud Console
3. **All services created** in Firebase Console
4. **Service account generated** and added to .env.local
5. **Browser cache cleared** completely

### Common Issues:
- **API billing**: Make sure billing is enabled for the project
- **Permissions**: Ensure you have owner/editor access to sih-kerala project
- **Region**: Use same region for all services (us-central1 recommended)

---

**💡 Tip**: Complete ALL steps above before testing. Partial setup will continue to show errors!