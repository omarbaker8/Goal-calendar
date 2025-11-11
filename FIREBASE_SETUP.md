# Firebase Setup Instructions

## 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Create a project" or "Add project"
3. Enter project name (e.g., "goal-calendar")
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication
1. In the Firebase console, click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" provider
5. Add your domain to authorized domains if deploying

## 3. Enable Firestore Database
1. Click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for now (you can secure it later)
4. Select a location for your database

## 4. Get Firebase Configuration
1. Click the gear icon → Project settings
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app icon
4. Enter app nickname
5. Copy the firebaseConfig object
6. Replace the config in `static/firebase-auth.js`

## 5. Get Admin SDK Credentials
1. In Project settings, go to "Service accounts" tab
2. Click "Generate new private key"
3. Download the JSON file
4. Rename it to `firebase-config.json` and place in project root
5. Keep this file secure and never commit it to version control

## 6. Security Rules (Optional - for production)
Add these Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Environment Variables
For production, consider using environment variables:
- `SECRET_KEY`: Flask session secret key
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account JSON