# Sniffratx - Project Context

**Last Updated:** December 23, 2024
**App Name:** Sniffr ATX
**Conversation:** sniffratx-app

---

## Quick Summary

Dog park social app for Austin, TX. Connect with other dog owners via QR code instead of exchanging phone numbers. Built with Expo + React Native + Supabase.

---

## Project Location

```
~/sniffratx-app/
```

---

## Key Credentials

- **EAS Project ID:** fd2f8973-82b6-4841-9dfa-491e63fe061a
- **Supabase Project:** sniffrATX (ref: kuoiomsljinuxjumkkvy)
- **Supabase URL:** https://kuoiomsljinuxjumkkvy.supabase.co
- **Bundle ID:** com.sniffratx.app
- **GitHub:** https://github.com/Dakota-AI/sniffratx

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native (Expo SDK 54) |
| Navigation | Expo Router |
| Backend | Supabase (Auth, DB, Storage, Realtime) |
| Build | EAS Build |
| Styling | React Native StyleSheet |

---

## App Structure

```
app/
├── _layout.tsx           # Root layout with auth check
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx         # Email/password login
│   └── signup.tsx        # Create account
├── (tabs)/
│   ├── _layout.tsx       # Tab bar (Connections, Scan, Messages, Profile)
│   ├── index.tsx         # Connections list
│   ├── scan.tsx          # QR scanner
│   ├── messages/
│   │   ├── _layout.tsx
│   │   ├── index.tsx     # Conversations list
│   │   └── [id].tsx      # Chat screen
│   └── profile/
│       ├── _layout.tsx
│       ├── index.tsx     # My profile
│       ├── edit.tsx      # Edit profile + dog
│       ├── my-qr.tsx     # QR code display
│       ├── requests.tsx  # Pending connection requests
│       └── [userId].tsx  # View other profiles
```

---

## Database Schema

**Tables:**
- `profiles` - User profiles (linked to auth.users)
- `dogs` - Dog profiles (1:1 with user for MVP)
- `connections` - User connections (pending/accepted/declined/blocked)
- `messages` - Chat messages

**Storage Buckets:**
- `avatars` - User profile photos
- `dogs` - Dog photos

---

## Features Built

1. **Auth** - Email/password signup and login via Supabase
2. **Profiles** - User profile with name, bio, photo
3. **Dogs** - Dog profile with name, breed, age, bio, photo
4. **QR Code** - Generate unique QR for easy connections
5. **Scanner** - Camera-based QR scanning
6. **Connections** - Send/accept/decline connection requests
7. **Messaging** - Real-time chat between connected users

---

## Commands

```bash
# Start development
cd ~/sniffratx-app && npx expo start

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to App Store
eas submit --platform ios

# Push database changes
supabase db push
```

---

## Current Status

### Completed
- [x] GitHub repo created
- [x] Documentation package
- [x] Expo project with EAS
- [x] All screens built (auth, tabs, profile, messages)
- [x] Supabase database schema deployed
- [x] Storage buckets created
- [x] .env configured

### In Progress
- [ ] Testing app with Expo Go
- [ ] UI polish

### Next Steps
1. Test app on device
2. Create app icon and splash screen
3. Build with EAS
4. Submit to App Store

---

## Important Files

| File | Purpose |
|------|---------|
| `.env` | Supabase credentials |
| `app.json` | Expo config, bundle IDs, plugins |
| `eas.json` | EAS build profiles |
| `lib/supabase.ts` | Supabase client |
| `types/database.ts` | TypeScript types |
| `docs/DATABASE_SCHEMA.md` | Full SQL schema |

---

## User Info

**Developer:** Dakota St. Pierre
**Goal:** Learn App Store submission process
**Location:** Austin, TX

---

*This file is maintained for conversation continuity.*
