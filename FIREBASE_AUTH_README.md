# Firebase Authentication Setup

This project uses Firebase Authentication for user login and signup.

## Features Implemented

✅ **Email/Password Authentication**
- Users can sign up with email and password
- Users can log in with email and password
- Password validation (minimum 6 characters)
- Display name is saved during signup

✅ **Google Sign-In**
- One-click Google authentication
- Automatic user creation on first sign-in
- User profile data (name, email, photo) synced

✅ **Session Management**
- User session persists across page refreshes
- Automatic authentication state tracking
- Logout functionality clears session

✅ **Error Handling**
- User-friendly error messages for all auth errors
- Specific error handling for common issues:
  - Invalid credentials
  - Email already in use
  - Weak passwords
  - Network errors
  - Popup blocked issues

## Firebase Configuration

The Firebase configuration is located in `/frontend/src/config/firebase.js`

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBKIC0Hl16eMtB3CZ0LrcZE9tz2YqetOfA",
  authDomain: "storyboard-ai-fa410.firebaseapp.com",
  projectId: "storyboard-ai-fa410",
  storageBucket: "storyboard-ai-fa410.firebasestorage.app",
  messagingSenderId: "844291999753",
  appId: "1:844291999753:web:689028a7d1d327bfae90d8",
  measurementId: "G-HEHQFFXVF3"
};
```

## Important Setup Steps

### 1. Enable Authentication Methods in Firebase Console

Go to [Firebase Console](https://console.firebase.google.com/project/storyboard-ai-fa410/authentication/providers)

Enable the following sign-in methods:
- ✅ Email/Password
- ✅ Google

### 2. Configure Authorized Domains

In Firebase Console → Authentication → Settings → Authorized domains

Add your domains:
- `localhost` (for development)
- Your production domain (when deployed)

### 3. Google Sign-In Configuration

For Google Sign-In to work:
1. Go to Firebase Console → Authentication → Sign-in method → Google
2. Make sure it's enabled
3. Set the project support email
4. Add authorized domains if needed

## User Flow

### Sign Up
1. User enters name, email, and password
2. Firebase creates account
3. Display name is set
4. User is redirected to dashboard
5. Session is saved in localStorage

### Login
1. User enters email and password
2. Firebase validates credentials
3. User is redirected to dashboard
4. Session is saved in localStorage

### Google Sign-In
1. User clicks "Continue with Google"
2. Google popup appears
3. User selects Google account
4. Firebase creates/logs in user
5. User is redirected to dashboard
6. Session is saved in localStorage

### Logout
1. User clicks logout button
2. Firebase signs out user
3. localStorage is cleared
4. User is redirected to login page

## Code Structure

```
frontend/src/
├── config/
│   └── firebase.js          # Firebase configuration
├── contexts/
│   └── AuthContext.js       # Authentication context provider
├── pages/
│   ├── Login.js             # Login page with Firebase auth
│   └── Signup.js            # Signup page with Firebase auth
└── components/
    └── Header.js            # Header with logout functionality
```

## Authentication Context

The `AuthContext` provides:
- `currentUser`: Current authenticated user object
- `loading`: Loading state during auth check

Usage:
```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <div>Please log in</div>;
  
  return <div>Welcome {currentUser.displayName}!</div>;
}
```

## Security Notes

⚠️ **Important**: The API keys in the Firebase config are meant to be public (they identify your Firebase project). However, you should:

1. Set up Firebase Security Rules to protect your data
2. Configure authentication limits to prevent abuse
3. Use environment variables for sensitive backend configurations
4. Enable App Check for additional security (optional)

## Testing

To test authentication:

1. **Sign Up with Email**
   - Go to `/signup`
   - Enter name, email, password
   - Should redirect to `/dashboard`

2. **Login with Email**
   - Go to `/login`
   - Enter email and password
   - Should redirect to `/dashboard`

3. **Google Sign-In**
   - Click "Continue with Google" on login or signup page
   - Select Google account
   - Should redirect to `/dashboard`

4. **Logout**
   - Click logout button in header
   - Should redirect to `/login`

## Troubleshooting

### Popup Blocked
If Google Sign-In popup is blocked:
- Allow popups for your domain
- Check browser popup blocker settings

### Invalid Credentials
- Verify Firebase configuration is correct
- Check if authentication methods are enabled in Firebase Console
- Ensure authorized domains are configured

### Network Errors
- Check internet connection
- Verify Firebase project is active
- Check browser console for detailed errors

## Next Steps

Consider implementing:
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Protected routes (redirect to login if not authenticated)
- [ ] User profile page
- [ ] Additional OAuth providers (Facebook, Twitter, etc.)
- [ ] Multi-factor authentication
