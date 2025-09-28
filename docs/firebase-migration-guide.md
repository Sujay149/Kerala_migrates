# Firebase Project Migration Guide

## 🚀 Steps to Change Firebase Credentials

### 1. Create New Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project" or "Create a project"
3. Enter project name (e.g., "medibot-new" or "medibot-v2")
4. Follow setup wizard

### 2. Enable Required Services
In your new project, enable:
- ✅ Authentication (Email/Password, Google, Facebook)
- ✅ Firestore Database
- ✅ Storage
- ✅ Hosting (if needed)
- ✅ Cloud Messaging (for notifications)

### 3. Configure Authentication
1. Go to Authentication → Settings → Authorized domains
2. Add your domains:
   - localhost
   - localhost:3000
   - your-production-domain.com

### 4. Setup Firestore Rules
1. Go to Firestore → Rules
2. Copy your current rules from firestore.rules file
3. Deploy the rules

### 5. Get New Configuration
1. Go to Project Settings → General → Your apps
2. Click on Web app or create new one
3. Copy the config object

### 6. Update Environment Variables
Replace all Firebase credentials in .env.local

## ⚠️ Data Migration Considerations
- Export existing data from old project
- Import to new project using Firebase Admin SDK
- Update user authentication (users will need to re-register)
- Migrate storage files if needed

## 🔄 Rollback Plan
- Keep old credentials backed up
- Test thoroughly before going live
- Have data export ready