# 🛠 Setup Guide

## Sniffr ATX - Development Environment Setup

Follow these steps to get your development environment ready.

---

## Prerequisites

Before starting, ensure you have:

- [ ] **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- [ ] **Git** - [Download](https://git-scm.com/)
- [ ] **Expo Go** app on your phone - [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
- [ ] **GitHub account** - [Sign up](https://github.com/)
- [ ] **Supabase account** - [Sign up](https://supabase.com/)

Optional but recommended:
- [ ] **VS Code** - [Download](https://code.visualstudio.com/)
- [ ] iOS Simulator (requires Mac with Xcode)
- [ ] Android Emulator (via Android Studio)

---

## Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `sniffr-atx`
3. Description: `Safe, casual connections for dog owners`
4. Make it **Private** (for now)
5. Check "Add a README file"
6. Click **Create repository**

---

## Step 2: Clone Repository

```bash
# Clone your new repo
git clone https://github.com/1-20-15-11-1-4/sniffr-atx.git
cd sniffr-atx
```

---

## Step 3: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New project**
3. Fill in:
   - **Name:** `sniffr-atx`
   - **Database Password:** (generate a strong one, save it!)
   - **Region:** Select closest to Austin (e.g., `us-east-1`)
4. Click **Create new project**
5. Wait for project to provision (~2 minutes)

---

## Step 4: Get Supabase Credentials

1. In your Supabase project, go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (the long string)

---

## Step 5: Set Up Database

1. In Supabase, go to **SQL Editor**
2. Click **New query**
3. Copy the ENTIRE contents of `docs/DATABASE_SCHEMA.md` (Section 7: Initial Setup Script)
4. Paste into the SQL editor
5. Click **Run**
6. Verify tables created in **Table Editor**

---

## Step 6: Create Storage Buckets

1. In Supabase, go to **Storage**
2. Click **New bucket**
3. Create bucket named `avatars`:
   - Public bucket: **ON**
   - Click **Create bucket**
4. Create bucket named `dogs`:
   - Public bucket: **ON**
   - Click **Create bucket**

---

## Step 7: Configure Authentication

1. In Supabase, go to **Authentication** > **Providers**
2. Ensure **Email** is enabled
3. Go to **Authentication** > **URL Configuration**
4. Add to **Redirect URLs**:
   ```
   sniffratx://
   exp://localhost:19000
   ```

---

## Step 8: Initialize Expo Project

From your cloned repo directory:

```bash
# Create Expo app (this will add files to existing directory)
npx create-expo-app@latest . --template blank-typescript

# If prompted about existing files, choose to merge
```

---

## Step 9: Install Dependencies

```bash
# Supabase client
npm install @supabase/supabase-js

# Async storage for session persistence
npm install @react-native-async-storage/async-storage

# Styling
npm install nativewind
npm install --save-dev tailwindcss

# QR Code
npm install react-native-qrcode-svg react-native-svg

# Camera for scanning
npx expo install expo-camera

# Image picker
npx expo install expo-image-picker

# Expo Router (if not included)
npx expo install expo-router expo-linking expo-constants expo-status-bar
```

---

## Step 10: Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your Supabase credentials
```

Your `.env` should look like:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
```

---

## Step 11: Configure Tailwind

Create `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#10B981',
        accent: '#F59E0B',
      },
    },
  },
  plugins: [],
}
```

Update `babel.config.js`:
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
```

---

## Step 12: Create Project Structure

```bash
# Create directories
mkdir -p app/(auth)
mkdir -p app/(tabs)
mkdir -p app/(tabs)/messages
mkdir -p app/(tabs)/profile
mkdir -p app/(onboarding)
mkdir -p components/ui
mkdir -p components/features
mkdir -p components/forms
mkdir -p components/layout
mkdir -p lib
mkdir -p hooks
mkdir -p contexts
mkdir -p types
```

---

## Step 13: Create Supabase Client

Create `lib/supabase.ts`:
```typescript
import 'react-native-url-polyfill/dist/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

Also install the polyfill:
```bash
npm install react-native-url-polyfill
```

---

## Step 14: Test the Setup

```bash
# Start Expo development server
npx expo start
```

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

---

## Step 15: First Commit

```bash
git add .
git commit -m "Initial project setup with Supabase"
git push origin main
```

---

## Verification Checklist

- [ ] GitHub repo created
- [ ] Supabase project created
- [ ] Database tables visible in Supabase
- [ ] Storage buckets created
- [ ] `.env` file has correct credentials
- [ ] `npx expo start` runs without errors
- [ ] App opens on phone/simulator
- [ ] Can import Supabase client without errors

---

## Troubleshooting

### "Supabase URL is undefined"
- Make sure `.env` file is in project root
- Restart Expo server after changing `.env`
- Check that variables start with `EXPO_PUBLIC_`

### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules
  npm install
  ```

### Database tables not visible
- Make sure you ran the complete SQL script
- Check for any SQL errors in the output
- Refresh the Supabase dashboard

### Camera not working
- Check that `expo-camera` is in `package.json`
- Rebuild the app: `npx expo start -c`

---

## Next Steps

Once setup is complete:

1. Open `docs/7_DAY_SPRINT.md`
2. Start with Day 1 tasks
3. Build incrementally, commit often
4. Refer to `docs/API_DESIGN.md` for Supabase queries

**You're ready to build! 🚀**
