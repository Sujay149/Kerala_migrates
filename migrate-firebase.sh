#!/bin/bash

# 🚀 Firebase Migration Script
# Run this after you've created your new Firebase project and have the credentials

echo "🔥 Starting Firebase Migration Process..."

# Backup current configuration
echo "📦 Backing up current configuration..."
cp .env.local .env.local.backup
cp firestore.rules firestore.rules.backup
cp firebase.json firebase.json.backup

# Replace configuration files
echo "🔄 Updating configuration files..."
cp .env.new-firebase .env.local
cp firestore-new.rules firestore.rules
cp firebase-new.json firebase.json

echo "✅ Configuration files updated!"
echo "📝 Next steps:"
echo "1. Edit .env.local and replace YOUR_NEW_* placeholders with actual credentials"
echo "2. Run: firebase use --add (and select your new project)"
echo "3. Run: firebase deploy --only firestore:rules"
echo "4. Run: npm run dev"
echo ""
echo "🔙 To rollback: "
echo "   cp .env.local.backup .env.local"
echo "   cp firestore.rules.backup firestore.rules" 
echo "   cp firebase.json.backup firebase.json"