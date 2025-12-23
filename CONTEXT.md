# Sniffratx - Project Context

**Last Updated:** December 23, 2024
**Conversation ID:** sniffratx-app

---

## Project Overview

**App Name:** Sniffr ATX (sniffratx)
**Tagline:** Safe, casual connections for dog owners - without exchanging phone numbers
**Target Market:** Austin, TX dog park community

---

## What We're Building

A mobile app that lets dog owners connect at dog parks via QR code exchange instead of phone numbers. Core features:

1. **User + Dog Profiles** - Create profiles for yourself and your pup
2. **QR Code Exchange** - Generate unique QR, scan others to connect
3. **Connections List** - See all your park friends in one place
4. **In-App Messaging** - Chat without sharing personal contact info
5. **Favorite Places** - Show where you frequent with your dog

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native (Expo) |
| Navigation | Expo Router |
| Backend | Supabase (Auth, Database, Storage, Realtime) |
| Styling | NativeWind (Tailwind CSS) |
| QR Code | react-native-qrcode-svg, expo-camera |
| Build | EAS Build (cloud builds, no Xcode needed locally) |

---

## Key Files

| File | Purpose |
|------|---------|
| `docs/PRD.md` | Product requirements, user stories, features |
| `docs/ARCHITECTURE.md` | System design, component structure |
| `docs/DATABASE_SCHEMA.md` | Supabase PostgreSQL schema + RLS policies |
| `docs/API_DESIGN.md` | Supabase client API patterns |
| `docs/7_DAY_SPRINT.md` | Day-by-day development plan |
| `docs/SETUP_GUIDE.md` | Environment setup instructions |
| `types/database.ts` | TypeScript types for database models |

---

## Current Status

### Completed
- [x] Created GitHub repo: `Dakota-AI/sniffratx`
- [x] Full documentation package prepared
- [x] Database schema designed
- [x] API patterns documented
- [x] 7-day sprint plan created

### In Progress
- [ ] Push documentation to GitHub
- [ ] Initialize Expo project with EAS
- [ ] Set up Supabase project

### Next Steps
1. Push all docs to GitHub repo
2. User provides EAS project credentials
3. Initialize Expo project
4. Set up Supabase and run database schema
5. Start Day 1 of sprint: Auth flow

---

## Database Schema Summary

**Tables:**
- `profiles` - User data (extends auth.users)
- `dogs` - Dog profiles (1:1 with user for MVP)
- `connections` - User-to-user connections (pending/accepted/declined/blocked)
- `messages` - Chat messages between connected users

**Storage Buckets:**
- `avatars` - User profile photos
- `dogs` - Dog photos

---

## Design Decisions

1. **QR-first connection** - No username search in MVP, forces in-person meeting
2. **One dog per user (MVP)** - Simplifies onboarding, can expand later
3. **Supabase for everything** - Auth, DB, storage, realtime - no custom backend
4. **EAS cloud builds** - No Xcode required locally
5. **NativeWind** - Tailwind familiarity, fast styling

---

## User Context

**Developer:** Dakota St. Pierre
**Role:** AI-first developer helping startups
**Interests:** Automotive, startups, animals, outdoors
**Goal:** Learn the app store submission process by shipping a real app

---

## Important Notes

- This is Dakota's first iOS App Store submission
- Apple Developer account status: TBD (may need to enroll)
- Timeline: Aggressive - aiming to ship ASAP
- Approach: Build fast, iterate based on feedback

---

## Commands Quick Reference

```bash
# Start dev server
npx expo start

# Build for iOS (production)
eas build --platform ios --profile production

# Build for Android (production)
eas build --platform android --profile production

# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

---

*This file is maintained for conversation continuity. Update when significant progress is made.*
