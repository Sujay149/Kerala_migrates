@echo off
REM 🚀 Firebase Migration Script for Windows
REM Run this after you've created your new Firebase project and have the credentials

echo 🔥 Starting Firebase Migration Process...

REM Backup current configuration
echo 📦 Backing up current configuration...
copy .env.local .env.local.backup
copy firestore.rules firestore.rules.backup
copy firebase.json firebase.json.backup

REM Replace configuration files  
echo 🔄 Updating configuration files...
copy .env.new-firebase .env.local
copy firestore-new.rules firestore.rules
copy firebase-new.json firebase.json

echo ✅ Configuration files updated!
echo 📝 Next steps:
echo 1. Edit .env.local and replace YOUR_NEW_* placeholders with actual credentials
echo 2. Run: firebase use --add (and select your new project)
echo 3. Run: firebase deploy --only firestore:rules
echo 4. Run: npm run dev
echo.
echo 🔙 To rollback:
echo    copy .env.local.backup .env.local
echo    copy firestore.rules.backup firestore.rules
echo    copy firebase.json.backup firebase.json

pause