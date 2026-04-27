# Uday - AI-Powered Communication Coaching Platform

A modern, scalable platform for improving communication skills through AI-analyzed calls between mentors and mentees.

## Features

- **Authentication**: Email and Google Sign-in based login with role-based access
- **WebRTC Calls**: Peer-to-peer audio and video calls with configurable settings
- **Role-Based System**: Separate workspaces for mentors, mentees, and admins
- **Mentor-Mentee Pairing**: Admins can assign mentors to mentees
- **Real-time Updates**: Firebase Firestore integration for live updates
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Theme**: Modern dark interface with smooth animations

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Firebase (Auth, Firestore, Realtime DB)
- **Real-time Communication**: WebRTC for peer-to-peer calls
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project with Auth and Firestore enabled
- Google OAuth credentials (for Google Sign-in)

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd uday
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Firebase project**
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Copy your Firebase config

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Firebase Configuration

1. **Enable Authentication Methods**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable "Email/Password"
   - Enable "Google" (add your OAuth client ID)

2. **Create Firestore Database**
   - Start in production mode with security rules
   - Create collections: `users`, `calls`, `callSessions`, `config`

3. **Configure Firestore Security Rules**
   ```firestore
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth.uid == userId;
       }
       match /calls/{callId} {
         allow read, write: if request.auth != null;
       }
       match /callSessions/{sessionId} {
         allow read, write: if request.auth != null;
       }
       match /config/{document=**} {
         allow read: if request.auth != null;
         allow write: if false;
       }
     }
   }
   ```

## Deployment on Vercel

### Method 1: Using Vercel Dashboard (Recommended)

1. **Push to GitHub**

   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `uday` project

3. **Configure Environment Variables**
   - In Vercel Project Settings → Environment Variables
   - Add all your Firebase credentials:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be available at `https://your-project.vercel.app`

### Method 2: Using Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Deploy**

   ```bash
   vercel
   ```

3. **Follow the prompts**
   - Choose project name
   - Confirm build settings
   - Add environment variables when prompted

4. **Set Production Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
   vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
   ```

### Post-Deployment Configuration

1. **Update Firebase Authorized Domains**
   - Go to Firebase Console → Authentication → Settings
   - Add your Vercel domain to "Authorized domains"
   - Format: `your-project.vercel.app`

2. **Update Google OAuth Redirect URIs**
   - Go to Google Cloud Console → Credentials
   - Edit your OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - `https://your-project.vercel.app`
     - `https://your-project.vercel.app/auth/callback`

3. **Enable CORS for WebRTC (if needed)**
   - In Firebase Console, configure CORS settings
   - Add your deployment domain

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── CallInterface.tsx
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useCallManager.ts
│   ├── useWebRTC.ts
│   └── useAppSettings.ts
├── lib/                # Utility libraries
│   ├── firebase.ts     # Firebase config
│   ├── firestore.ts    # Firestore queries
│   ├── auth-context.tsx
│   └── animations.ts   # Framer Motion configs
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

## Configuration

### Video Calls Toggle

Video calls can be disabled globally via Firebase:

1. Go to Firestore in Firebase Console
2. Create a document at `config/appSettings`
3. Add field: `videoCallsEnabled: true/false`

The app will read this setting in real-time and update the UI accordingly.

## Troubleshooting

### WebRTC Connection Issues

- Ensure both users have microphone/camera permissions
- Check ICE candidates are being exchanged
- Verify STUN servers are reachable

### Firebase Auth Errors

- Verify Firebase project credentials
- Ensure Authorized Domains include your deployment URL
- Check Google OAuth configuration

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## Contributing

Contributions are welcome! Please follow the code style and create pull requests for any improvements.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

- Open a GitHub issue
- Check existing documentation
- Review Firebase and WebRTC documentation
