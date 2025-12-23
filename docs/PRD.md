# 📋 Product Requirements Document (PRD)

## Sniffr ATX - MVP v1.0

**Document Version:** 1.0  
**Last Updated:** December 23, 2024  
**Author:** Dakota St. Pierre  

---

## 1. Executive Summary

### 1.1 Product Vision
Sniffr ATX is a mobile application that enables dog owners to connect with each other at dog parks and public spaces without exchanging personal contact information. Users can share profiles via QR code, stay connected through in-app messaging, and build a community around their shared love of dogs.

### 1.2 Problem Statement
Dog parks create natural social environments where owners regularly interact while their dogs play together. However, exchanging phone numbers with strangers feels like too much commitment, and most interactions end when people leave the park. Dog owners lack a low-friction way to maintain these casual connections.

### 1.3 Target Users
**Primary:** Dog owners in Austin, TX who:
- Regularly visit dog parks
- Want to arrange playdates for their dogs
- Prefer casual connections without sharing personal contact info
- Are comfortable with mobile apps (ages 25-55)

**Demographics (Austin Market):**
- 75% pet ownership rate (highest in US)
- 68% of pet households have dogs
- Average dog owner income: $94,000
- Tech-savvy, early adopter population

---

## 2. Goals & Success Metrics

### 2.1 Business Goals
| Goal | Target | Timeline |
|------|--------|----------|
| MVP Launch | Functional app on TestFlight/Play Store | 7 days |
| Initial Users | 100 active users in Austin | 30 days post-launch |
| Connections Made | 500 total connections | 60 days post-launch |
| User Retention | 40% weekly active users | 90 days post-launch |

### 2.2 Key Performance Indicators (KPIs)
- **Daily Active Users (DAU)**
- **Connections per user** (target: 5+ average)
- **Messages sent per week**
- **QR scans per user**
- **App Store rating** (target: 4.5+)

---

## 3. User Stories

### 3.1 Core User Stories (P0 - Must Have)

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-01 | New user | Sign up with email/password | I can create an account |
| US-02 | User | Create a profile with my name and photo | Others can identify me |
| US-03 | User | Add my dog's profile (name, breed, photo, bio) | Others can learn about my dog |
| US-04 | User | Generate a unique QR code | Others can scan to connect with me |
| US-05 | User | Scan another user's QR code | I can send them a connection request |
| US-06 | User | Accept/decline connection requests | I control who I connect with |
| US-07 | User | View my list of connections | I can see all my park friends |
| US-08 | User | View a connection's profile and dog info | I can remember who they are |
| US-09 | User | Send messages to connections | I can communicate without phone numbers |
| US-10 | User | Receive messages from connections | I can stay in touch |

### 3.2 Secondary User Stories (P1 - Should Have)

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-11 | User | Add places I frequent to my profile | Others know where to find me |
| US-12 | User | Edit my profile and dog info | I can keep info up to date |
| US-13 | User | Delete a connection | I can manage my connections |
| US-14 | User | Block a user | I can prevent unwanted contact |
| US-15 | User | Log out of my account | I can secure my account |

### 3.3 Future User Stories (P2 - Nice to Have - v2.0)

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-20 | User | Broadcast "I'm at the park" | Connections know I'm available |
| US-21 | User | See who's currently at a park | I can decide where to go |
| US-22 | User | Schedule a playdate | I can plan meetups in advance |
| US-23 | User | Browse dog-friendly places | I can discover new spots |
| US-24 | User | Get push notifications | I don't miss messages |
| US-25 | User | Add multiple dogs | I can show all my pets |
| US-26 | Premium user | Get unlimited messaging | I can communicate freely |
| US-27 | Premium user | See who viewed my profile | I know who's interested |

---

## 4. Functional Requirements

### 4.1 Authentication
- Email/password signup and login
- Password reset via email
- Session persistence (stay logged in)
- Secure token storage

### 4.2 User Profile
- Required fields: Name, Profile Photo
- Optional fields: Bio, Location
- Profile visibility to connections only

### 4.3 Dog Profile
- Required fields: Name, Primary Photo
- Optional fields: Breed, Age, Bio, Additional Photos
- One dog per user (MVP)

### 4.4 QR Code System
- Generate unique QR code per user
- QR contains user ID (not sensitive data)
- Camera-based QR scanning
- Scan creates pending connection request

### 4.5 Connections
- Bidirectional connection (both must accept)
- Pending/Accepted/Declined states
- Connection list with search/filter
- Remove connection option

### 4.6 Messaging
- 1:1 text messaging
- Conversation list sorted by recent
- Real-time message delivery
- Message read receipts (optional)

### 4.7 Places (P1)
- Add favorite places to profile
- Free-text entry (MVP)
- Display on profile

---

## 5. Non-Functional Requirements

### 5.1 Performance
- App launch: < 3 seconds
- Screen transitions: < 300ms
- QR scan recognition: < 2 seconds
- Message delivery: < 1 second

### 5.2 Security
- All data transmitted over HTTPS
- Passwords hashed (Supabase handles)
- Row Level Security on all tables
- No PII in QR codes

### 5.3 Reliability
- 99.9% uptime (Supabase SLA)
- Offline handling with clear error states
- Graceful degradation

### 5.4 Compatibility
- iOS 15.0+
- Android 10+
- Optimized for iPhone 12+ and Pixel 5+

---

## 6. Design Requirements

### 6.1 Brand Guidelines
- **Primary Color:** #4F46E5 (Indigo)
- **Secondary Color:** #10B981 (Emerald)
- **Accent:** #F59E0B (Amber)
- **Typography:** System fonts (SF Pro / Roboto)
- **Tone:** Friendly, playful, trustworthy

### 6.2 UX Principles
- Maximum 3 taps to any core feature
- Clear visual feedback on all actions
- Dog-centric imagery and language
- Accessible (WCAG 2.1 AA compliance)

### 6.3 Key Screens
1. Onboarding (3 slides)
2. Sign Up / Login
3. Profile Setup (User + Dog)
4. Home (Connections List)
5. QR Code Display
6. QR Scanner
7. Connection Request
8. Profile View
9. Messages List
10. Conversation

---

## 7. Technical Constraints

### 7.1 Platform
- React Native via Expo (managed workflow)
- Expo SDK 50+
- Expo Router for navigation

### 7.2 Backend
- Supabase (PostgreSQL)
- Supabase Auth
- Supabase Storage (images)
- Supabase Realtime (messaging)

### 7.3 Third-Party Dependencies
- expo-camera (QR scanning)
- react-native-qrcode-svg (QR generation)
- expo-image-picker (photo upload)
- NativeWind (styling)

---

## 8. Out of Scope (MVP)

The following are explicitly **NOT** included in v1.0:

- Push notifications
- Social login (Apple/Google)
- Multiple dogs per user
- Location tracking / "I'm here now"
- Dog-friendly places directory
- Premium subscriptions / payments
- Admin dashboard
- Analytics integration
- In-app photo sharing
- Group messaging
- Video/voice calls

---

## 9. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low initial adoption | Medium | High | Aggressive local marketing, park presence |
| Spam/fake profiles | Low | Medium | Report/block functionality, moderation |
| QR scanning issues | Low | High | Fallback username search |
| App store rejection | Low | Medium | Follow guidelines, no prohibited content |
| Supabase limits | Low | Low | Monitor usage, upgrade plan if needed |

---

## 10. Timeline

| Day | Milestone |
|-----|-----------|
| 1 | Project setup, Auth flow complete |
| 2 | User + Dog profile creation |
| 3 | QR generation and scanning |
| 4 | Connections system |
| 5 | Messaging feature |
| 6 | Polish, bug fixes, testing |
| 7 | TestFlight/Play Store submission |

---

## 11. Approvals

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | Dakota St. Pierre | Dec 23, 2024 | _________ |

---

*Document created for Sniffr ATX MVP development sprint.*
