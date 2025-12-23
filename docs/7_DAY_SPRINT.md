# 📅 7-Day Sprint Plan

## Sniffr ATX - MVP Development Sprint

**Sprint Start:** December 24, 2024  
**Sprint End:** December 30, 2024  
**Goal:** Ship functional MVP to TestFlight/Play Store  

---

## Sprint Overview

```
┌─────┬─────────────────────┬────────────────────────────────────┐
│ Day │ Focus               │ Deliverable                        │
├─────┼─────────────────────┼────────────────────────────────────┤
│  1  │ Setup & Auth        │ Project scaffold, login/signup     │
│  2  │ Profiles            │ User + Dog profile CRUD            │
│  3  │ QR System           │ Generate QR, scan, connect         │
│  4  │ Connections         │ Connection list, view profiles     │
│  5  │ Messaging           │ Chat functionality                 │
│  6  │ Polish              │ UI cleanup, bug fixes, testing     │
│  7  │ Ship                │ Build & submit to app stores       │
└─────┴─────────────────────┴────────────────────────────────────┘
```

---

## Day 1: Project Setup & Authentication

### Morning (4 hours)

**1. Initialize Expo Project**
```bash
npx create-expo-app@latest sniffr-atx --template tabs
cd sniffr-atx
```

**2. Install Dependencies**
```bash
# Core
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage

# Navigation (if not included)
npm install expo-router

# Styling
npm install nativewind tailwindcss

# QR (install now, use later)
npm install react-native-qrcode-svg react-native-svg
npx expo install expo-camera

# Image handling
npx expo install expo-image-picker
```

**3. Configure NativeWind**
- Set up `tailwind.config.js`
- Configure `babel.config.js`
- Add global styles

**4. Set Up Supabase**
- Create Supabase project at supabase.com
- Get URL and anon key
- Create `lib/supabase.ts` client
- Create `.env` file with credentials

### Afternoon (4 hours)

**5. Implement Auth Screens**
- [ ] `app/(auth)/login.tsx` - Email/password login
- [ ] `app/(auth)/signup.tsx` - Create account
- [ ] `app/(auth)/_layout.tsx` - Auth stack layout

**6. Create Auth Context**
- [ ] `contexts/AuthContext.tsx`
- [ ] Session persistence
- [ ] Auth state listener

**7. Implement Auth Flow**
- [ ] Root layout auth check
- [ ] Redirect to login if not authenticated
- [ ] Redirect to home if authenticated

### Day 1 Checklist
- [ ] Expo project running
- [ ] Supabase connected
- [ ] Can sign up new user
- [ ] Can sign in existing user
- [ ] Can sign out
- [ ] Session persists on app restart

---

## Day 2: User & Dog Profiles

### Morning (4 hours)

**1. Run Database Setup**
- Run complete SQL script from `DATABASE_SCHEMA.md` in Supabase SQL Editor
- Verify tables created
- Test RLS policies

**2. Create Storage Buckets**
- Create `avatars` bucket (public)
- Create `dogs` bucket (public)
- Set up storage policies

**3. Build Profile Screens**
- [ ] `app/(onboarding)/create-profile.tsx` - Name, photo, bio
- [ ] `app/(tabs)/profile/index.tsx` - View my profile
- [ ] `app/(tabs)/profile/edit.tsx` - Edit profile

### Afternoon (4 hours)

**4. Build Dog Profile Screens**
- [ ] `app/(onboarding)/add-dog.tsx` - Add dog during onboarding
- [ ] Dog section on profile screen
- [ ] Edit dog functionality

**5. Image Upload**
- [ ] Avatar picker and upload
- [ ] Dog photo picker and upload
- [ ] Image compression before upload

**6. Create Profile Components**
- [ ] `components/ui/Avatar.tsx`
- [ ] `components/features/DogProfileCard.tsx`
- [ ] `components/forms/ProfileForm.tsx`
- [ ] `components/forms/DogForm.tsx`

### Day 2 Checklist
- [ ] Can create/edit user profile
- [ ] Can upload avatar
- [ ] Can create/edit dog profile
- [ ] Can upload dog photo
- [ ] Profile displays correctly
- [ ] Onboarding flow works end-to-end

---

## Day 3: QR Code System

### Morning (4 hours)

**1. QR Code Generation**
- [ ] `components/features/QRCodeDisplay.tsx`
- [ ] Generate QR with user ID payload
- [ ] `app/(tabs)/profile/my-qr.tsx` - Full screen QR display

**2. QR Code Styling**
- Add Sniffr ATX branding
- Make it look good for sharing

### Afternoon (4 hours)

**3. QR Scanner**
- [ ] `components/features/QRScanner.tsx`
- [ ] `app/(tabs)/scan.tsx` - Scanner screen
- [ ] Camera permissions handling
- [ ] QR decode and validation

**4. Connection Request Flow**
- [ ] Parse scanned QR data
- [ ] Fetch scanned user's profile
- [ ] Show profile preview modal
- [ ] "Send Connection Request" button
- [ ] Create pending connection in database

**5. Handle Edge Cases**
- Invalid QR code
- Already connected
- Scanning own QR
- User not found

### Day 3 Checklist
- [ ] QR code displays with my ID
- [ ] Can open camera and scan
- [ ] Valid QR shows user profile
- [ ] Can send connection request
- [ ] Request appears as pending in database
- [ ] Error states handled gracefully

---

## Day 4: Connections System

### Morning (4 hours)

**1. Connections List**
- [ ] `app/(tabs)/index.tsx` - Home screen with connections
- [ ] `components/features/ConnectionCard.tsx`
- [ ] Fetch and display accepted connections
- [ ] Pull-to-refresh

**2. Pending Requests**
- [ ] Pending requests section/badge
- [ ] Accept/Decline UI
- [ ] Update connection status

### Afternoon (4 hours)

**3. View Other Profiles**
- [ ] `app/(tabs)/profile/[userId].tsx` - Dynamic profile view
- [ ] Show user info + dog info
- [ ] Connection status indicator
- [ ] "Message" button (links to Day 5)

**4. Connection Management**
- [ ] Remove connection option
- [ ] Block user option
- [ ] Confirmation dialogs

**5. Empty States**
- No connections yet
- No pending requests

### Day 4 Checklist
- [ ] Connections list shows accepted connections
- [ ] Can view pending requests
- [ ] Can accept/decline requests
- [ ] Can view other user's profile
- [ ] Can remove a connection
- [ ] Empty states display correctly

---

## Day 5: Messaging

### Morning (4 hours)

**1. Conversations List**
- [ ] `app/(tabs)/messages/index.tsx`
- [ ] `components/features/ConversationCard.tsx`
- [ ] Show last message preview
- [ ] Unread indicator
- [ ] Sort by most recent

**2. Supabase Realtime Setup**
- Subscribe to new messages
- Handle incoming messages

### Afternoon (4 hours)

**3. Conversation Screen**
- [ ] `app/(tabs)/messages/[id].tsx`
- [ ] `components/features/MessageBubble.tsx`
- [ ] Fetch message history
- [ ] Message input + send button
- [ ] Auto-scroll to bottom

**4. Real-time Messages**
- [ ] New message appears instantly
- [ ] Mark messages as read on view
- [ ] Unsubscribe on unmount

**5. UX Polish**
- Keyboard avoiding view
- Loading states
- Error handling
- Empty conversation state

### Day 5 Checklist
- [ ] Conversations list displays
- [ ] Can open conversation
- [ ] Can send messages
- [ ] Messages appear in real-time
- [ ] Unread count updates
- [ ] Keyboard behavior correct

---

## Day 6: Polish & Testing

### Morning (4 hours)

**1. UI Polish**
- [ ] Consistent spacing/padding
- [ ] Loading states everywhere
- [ ] Error messages user-friendly
- [ ] Animations/transitions

**2. Navigation Polish**
- [ ] Tab bar icons
- [ ] Screen headers
- [ ] Back buttons
- [ ] Deep linking basics

### Afternoon (4 hours)

**3. Bug Fixes**
- [ ] Test all flows end-to-end
- [ ] Fix any broken functionality
- [ ] Handle edge cases

**4. Testing Checklist**
- [ ] Fresh signup flow
- [ ] Returning user login
- [ ] Profile creation/editing
- [ ] Dog creation/editing
- [ ] QR generation
- [ ] QR scanning (use two devices/simulators)
- [ ] Connection request flow
- [ ] Accepting/declining connections
- [ ] Viewing connections
- [ ] Sending messages
- [ ] Receiving messages
- [ ] Sign out

**5. Performance Check**
- [ ] App launches fast
- [ ] No memory leaks
- [ ] Images load smoothly

### Day 6 Checklist
- [ ] All features working
- [ ] No critical bugs
- [ ] UI looks polished
- [ ] App is stable

---

## Day 7: Ship It! 🚀

### Morning (4 hours)

**1. Pre-submission Prep**
- [ ] Update `app.json` with correct info
  - App name: "Sniffr ATX"
  - Bundle ID: `com.sniffratx.app`
  - Version: 1.0.0
- [ ] Create app icon (1024x1024)
- [ ] Create splash screen
- [ ] Write app description
- [ ] Take screenshots

**2. EAS Build Setup**
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Afternoon (4 hours)

**3. Create Builds**
```bash
# iOS TestFlight
eas build --platform ios --profile production

# Android Internal Testing
eas build --platform android --profile production
```

**4. Submit to Stores**
- [ ] iOS: Upload to App Store Connect → TestFlight
- [ ] Android: Upload to Play Console → Internal Testing

**5. Create Landing Page** (optional but nice)
- Simple page with:
  - App description
  - Screenshots
  - TestFlight/Play Store links
  - Contact info

**6. Announce!**
- [ ] Post on social media
- [ ] Share with friends for testing
- [ ] Prepare for feedback

### Day 7 Checklist
- [ ] iOS build successful
- [ ] Android build successful
- [ ] TestFlight build live
- [ ] Play Store internal testing live
- [ ] Landing page deployed (bonus)
- [ ] First testers invited

---

## Daily Schedule Template

```
┌────────────┬───────────────────────────────────┐
│ Time       │ Activity                          │
├────────────┼───────────────────────────────────┤
│ 8:00 AM    │ Review day's goals, coffee ☕     │
│ 8:30 AM    │ Deep work block 1                 │
│ 12:00 PM   │ Lunch break 🍕                    │
│ 1:00 PM    │ Deep work block 2                 │
│ 5:00 PM    │ Test what you built               │
│ 5:30 PM    │ Commit & push code                │
│ 6:00 PM    │ Plan tomorrow, done for day       │
└────────────┴───────────────────────────────────┘
```

---

## Scope Management

### If Running Behind
Cut these first:
1. Favorite places feature (P1)
2. Block user feature
3. Profile bio field
4. Dog bio field
5. Conversation read receipts

### If Running Ahead
Add these:
1. Profile search/username
2. Connection notes
3. Better onboarding slides
4. App analytics
5. Crashlytics

---

## Emergency Contacts

- **Supabase Docs:** https://supabase.com/docs
- **Expo Docs:** https://docs.expo.dev
- **Expo Discord:** https://chat.expo.dev
- **Stack Overflow:** Tag with `expo`, `supabase`, `react-native`

---

## Post-Sprint

After Day 7:
1. Gather feedback from testers
2. Fix critical bugs
3. Plan v1.1 features
4. Start local marketing push
5. Celebrate! 🎉

---

*You've got this, Dakota! Ship it! 🚀*
