# TypeRace - Setup Guide

## Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `typerace` or your preferred name
4. Enable Google Analytics (optional)
5. Click "Create Project"

### 2. Enable Authentication
1. In Firebase Console, go to **Build > Authentication**
2. Click "Get Started"
3. Enable **Email/Password** sign-in method
4. Click "Save"

### 3. Enable Realtime Database
1. In Firebase Console, go to **Build > Realtime Database**
2. Click "Create Database"
3. Choose location closest to your users
4. Start in **Test Mode** (for development)
5. Click "Enable"

### 4. Security Rules (Realtime Database)
Replace the default rules with:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        "players": {
          "$playerId": {
            ".write": "$playerId === auth.uid || !data.exists()"
          }
        }
      }
    }
  }
}
```

### 5. Get Firebase Configuration
1. In Firebase Console, click the ⚙️ (Settings) icon
2. Go to **Project Settings**
3. Scroll down to "Your apps"
4. Click the **</>** (Web) icon
5. Register your app with nickname: `TypeRace`
6. Copy the `firebaseConfig` object

### 6. Configure Environment Variables
1. Open `.env.local` in your project root
2. Replace the placeholder values with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

### 7. Run the Application
```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## Features

### Authentication System
- **Login/Register**: Email and password authentication
- **User Profile**: Display username and logout option
- **Protected Routes**: Public rooms require authentication

### Room System
- **Lobby**: Browse and join available rooms
- **Create Room**: Start a new typing race room
- **Room Limit**: Maximum 5 players per room
- **Real-time Updates**: Live player progress using Firebase Realtime Database

### Gameplay
- **Practice Mode**: Solo typing practice
- **Public Rooms**: Compete with up to 4 other players
- **Real-time Leaderboard**: Live ranking sidebar
- **Winner Announcement**: Modal showing the winner when race finishes
- **Auto-scroll Text**: Monkeytype-style text display
- **Virtual Keyboard**: Color-coded finger guidance
- **Stats Tracking**: WPM, accuracy, and progress

### Modes
- **Time Mode**: 15s, 30s, 60s, 120s
- **Words Mode**: 10, 25, 50, 100 words

## Project Structure

```
TypeRace/
├── app/
│   ├── login/           # Authentication page
│   ├── lobby/           # Room lobby page
│   ├── public/[id]/     # Dynamic public room page
│   ├── practice/        # Practice mode page
│   └── room/            # Custom room pages
├── components/          # Reusable components
├── contexts/            # React contexts (AuthContext)
├── lib/                 # Firebase configuration
├── hooks/               # Custom hooks
├── store/               # Zustand state management
├── types/               # TypeScript types
└── utils/               # Utility functions
```

## Development Notes

### Known Issues
- Test mode security rules are permissive (change for production)
- No rate limiting on room creation
- No cleanup of finished rooms

### Production Recommendations
1. Update Realtime Database security rules
2. Add rate limiting
3. Implement room cleanup cron job
4. Add email verification
5. Enable Firebase App Check
6. Add abuse reporting

## Support

For issues, please create an issue on GitHub or contact the development team.
