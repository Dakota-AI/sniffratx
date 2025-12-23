# 🏗 Technical Architecture Document

## Sniffr ATX - System Architecture

**Document Version:** 1.0  
**Last Updated:** December 23, 2024  

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    React Native (Expo)                        │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │   │
│  │  │  Auth   │  │ Profile │  │   QR    │  │   Messaging     │ │   │
│  │  │ Screens │  │ Screens │  │ Scanner │  │    Screens      │ │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘ │   │
│  │       │            │            │                 │          │   │
│  │  ┌────┴────────────┴────────────┴─────────────────┴────────┐ │   │
│  │  │              Supabase Client SDK                         │ │   │
│  │  └──────────────────────────┬───────────────────────────────┘ │   │
│  └─────────────────────────────┼─────────────────────────────────┘   │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │ HTTPS / WSS
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │    Auth      │  │   Storage    │  │        Realtime          │  │
│  │  (GoTrue)    │  │   (S3-like)  │  │    (WebSocket PubSub)    │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                        │                │
│  ┌──────┴─────────────────┴────────────────────────┴───────────────┐│
│  │                      PostgreSQL Database                         ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────────────┐   ││
│  │  │ users   │ │  dogs   │ │ connections │ │    messages     │   ││
│  │  └─────────┘ └─────────┘ └─────────────┘ └─────────────────┘   ││
│  │                     + Row Level Security (RLS)                   ││
│  └──────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | React Native | 0.73+ | Cross-platform mobile |
| Platform | Expo | SDK 50+ | Build & deployment |
| Navigation | Expo Router | 3.x | File-based routing |
| Styling | NativeWind | 4.x | Tailwind for RN |
| State | React Context + Hooks | - | Local state management |
| HTTP Client | Supabase JS | 2.x | API communication |

### 2.2 Navigation Structure

```
app/
├── _layout.tsx                 # Root layout (auth check)
├── index.tsx                   # Entry point (redirect)
├── (auth)/
│   ├── _layout.tsx            # Auth stack layout
│   ├── login.tsx              # Login screen
│   ├── signup.tsx             # Signup screen
│   └── forgot-password.tsx    # Password reset
├── (onboarding)/
│   ├── _layout.tsx            # Onboarding layout
│   ├── welcome.tsx            # Welcome slides
│   ├── create-profile.tsx     # User profile setup
│   └── add-dog.tsx            # Dog profile setup
└── (tabs)/
    ├── _layout.tsx            # Tab bar layout
    ├── index.tsx              # Home (Connections)
    ├── scan.tsx               # QR Scanner
    ├── messages/
    │   ├── index.tsx          # Conversations list
    │   └── [id].tsx           # Individual conversation
    └── profile/
        ├── index.tsx          # My profile
        ├── edit.tsx           # Edit profile
        ├── my-qr.tsx          # My QR code
        └── [userId].tsx       # View other profile
```

### 2.3 Component Architecture

```
components/
├── ui/                        # Base UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Avatar.tsx
│   ├── Card.tsx
│   └── Loading.tsx
├── forms/                     # Form components
│   ├── ProfileForm.tsx
│   └── DogForm.tsx
├── features/                  # Feature-specific components
│   ├── QRCodeDisplay.tsx
│   ├── QRScanner.tsx
│   ├── ConnectionCard.tsx
│   ├── MessageBubble.tsx
│   └── DogProfileCard.tsx
└── layout/                    # Layout components
    ├── Header.tsx
    ├── TabBar.tsx
    └── SafeContainer.tsx
```

### 2.4 State Management

**Approach:** React Context + Custom Hooks (no Redux needed for MVP)

```typescript
// contexts/
├── AuthContext.tsx           // User session state
├── ProfileContext.tsx        // User & dog profile
└── ConnectionsContext.tsx    // Connections list

// hooks/
├── useAuth.ts               // Auth operations
├── useProfile.ts            // Profile CRUD
├── useDog.ts                // Dog CRUD
├── useConnections.ts        // Connection operations
└── useMessages.ts           // Messaging operations
```

---

## 3. Backend Architecture (Supabase)

### 3.1 Supabase Services Used

| Service | Purpose | Features Used |
|---------|---------|---------------|
| **Auth** | User authentication | Email/password, sessions, password reset |
| **Database** | Data persistence | PostgreSQL, RLS policies |
| **Storage** | File storage | Profile photos, dog photos |
| **Realtime** | Live updates | Message subscriptions |

### 3.2 Database Schema Overview

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for complete schema.

**Core Tables:**
- `profiles` - User profile data (extends auth.users)
- `dogs` - Dog information (1:1 with profiles for MVP)
- `connections` - User-to-user connections
- `messages` - Chat messages

### 3.3 Storage Buckets

```
storage/
├── avatars/              # User profile photos
│   └── {user_id}.jpg
└── dogs/                 # Dog photos
    └── {dog_id}/
        ├── primary.jpg
        └── {photo_id}.jpg
```

**Bucket Policies:**
- Public read for avatars and dog photos
- Authenticated write for own photos only
- Max file size: 5MB
- Allowed types: image/jpeg, image/png, image/webp

### 3.4 Row Level Security (RLS)

All tables have RLS enabled with policies:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Public | Own only | Own only | Own only |
| dogs | Public | Own only | Own only | Own only |
| connections | Connected users | Authenticated | Own only | Own only |
| messages | Connected users | Authenticated | Never | Never |

---

## 4. API Design

### 4.1 Authentication Endpoints (Supabase Auth)

```typescript
// Sign up
supabase.auth.signUp({ email, password })

// Sign in
supabase.auth.signInWithPassword({ email, password })

// Sign out
supabase.auth.signOut()

// Reset password
supabase.auth.resetPasswordForEmail(email)

// Get session
supabase.auth.getSession()
```

### 4.2 Database Operations

See [API_DESIGN.md](API_DESIGN.md) for complete API reference.

---

## 5. QR Code System

### 5.1 QR Code Content

```typescript
// QR Code payload structure
interface QRPayload {
  type: 'sniffr-atx';
  version: 1;
  userId: string;  // UUID
}

// Encoded as JSON string in QR
const qrData = JSON.stringify({
  type: 'sniffr-atx',
  version: 1,
  userId: 'abc123-def456-...'
});
```

### 5.2 QR Flow

```
┌──────────────┐         ┌──────────────┐
│   User A     │         │    User B    │
│  Shows QR    │         │   Scans QR   │
└──────┬───────┘         └──────┬───────┘
       │                        │
       │    ┌───────────────┐   │
       │    │ QR Contains   │   │
       │    │ User A's ID   │   │
       │    └───────────────┘   │
       │                        │
       │                        ▼
       │              ┌─────────────────┐
       │              │ Create pending  │
       │              │ connection req  │
       │              └────────┬────────┘
       │                       │
       ▼                       ▼
┌──────────────┐      ┌──────────────────┐
│ Notification │      │ Show User A's    │
│ "B wants to  │◄─────│ profile to B     │
│  connect"    │      │ with Accept btn  │
└──────────────┘      └──────────────────┘
```

---

## 6. Real-time Messaging

### 6.1 Supabase Realtime Setup

```typescript
// Subscribe to new messages for current user
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `receiver_id=eq.${userId}`
    },
    (payload) => {
      // Handle new message
      addMessage(payload.new);
    }
  )
  .subscribe();
```

### 6.2 Message Flow

```
┌─────────┐                              ┌─────────┐
│ User A  │                              │ User B  │
└────┬────┘                              └────┬────┘
     │                                        │
     │ 1. Insert message                      │
     ▼                                        │
┌─────────────────────────────────────────────┴──────┐
│                    Supabase                         │
│  ┌─────────────┐      ┌─────────────────────────┐  │
│  │  messages   │──────│  Realtime (postgres_    │  │
│  │   table     │      │  changes broadcast)     │  │
│  └─────────────┘      └────────────┬────────────┘  │
└────────────────────────────────────┼───────────────┘
                                     │
                                     │ 2. WebSocket push
                                     ▼
                              ┌─────────────┐
                              │   User B    │
                              │  receives   │
                              │   message   │
                              └─────────────┘
```

---

## 7. Security Architecture

### 7.1 Authentication Flow

```
┌─────────┐     ┌─────────────┐     ┌──────────────┐
│  User   │────▶│   Supabase  │────▶│   GoTrue     │
│  Login  │     │   Client    │     │   (Auth)     │
└─────────┘     └─────────────┘     └──────┬───────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │   JWT Token  │
                                    │   Returned   │
                                    └──────┬───────┘
                                           │
                      ┌────────────────────┼────────────────────┐
                      ▼                    ▼                    ▼
               ┌────────────┐      ┌────────────┐      ┌────────────┐
               │  Stored in │      │  Sent with │      │  Verified  │
               │  Secure    │      │  all API   │      │  by RLS    │
               │  Storage   │      │  requests  │      │  policies  │
               └────────────┘      └────────────┘      └────────────┘
```

### 7.2 Security Measures

| Layer | Measure |
|-------|---------|
| Transport | HTTPS/TLS for all requests |
| Auth | JWT tokens with short expiry |
| Storage | Expo SecureStore for tokens |
| Database | Row Level Security policies |
| Files | Signed URLs with expiration |
| QR | No PII in QR codes (UUID only) |

---

## 8. Performance Considerations

### 8.1 Optimization Strategies

| Area | Strategy |
|------|----------|
| **Images** | Resize before upload (max 800px), use WebP |
| **Lists** | FlatList with pagination (20 items/page) |
| **Queries** | Select only needed columns |
| **Caching** | React Query or SWR for data caching (future) |
| **Bundle** | Expo's automatic code splitting |

### 8.2 Estimated Supabase Usage (Free Tier)

| Resource | Limit | Expected Usage |
|----------|-------|----------------|
| Database | 500MB | ~50MB for 1K users |
| Storage | 1GB | ~500MB for 1K users |
| Auth | 50K MAU | Well under limit |
| Realtime | 200 concurrent | Should be fine |
| Edge Functions | 500K/month | Not using initially |

---

## 9. Deployment Architecture

### 9.1 Build & Distribution

```
┌─────────────────────────────────────────────────────────────┐
│                      Development                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────────────────────┐ │
│  │  Local  │───▶│  Expo   │───▶│  Expo Go App (testing)  │ │
│  │   Dev   │    │   CLI   │    └─────────────────────────┘ │
│  └─────────┘    └─────────┘                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Production                              │
│  ┌─────────────┐    ┌─────────────┐    ┌───────────────┐   │
│  │   GitHub    │───▶│  EAS Build  │───▶│  App Stores   │   │
│  │    Push     │    │   (cloud)   │    │  TestFlight   │   │
│  └─────────────┘    └─────────────┘    │  Play Console │   │
│                                         └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Environment Configuration

```bash
# .env.local (development)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx

# Production (EAS secrets)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
```

---

## 10. Future Considerations (Post-MVP)

### 10.1 Scalability Path
- Add Redis caching for hot data
- Implement Supabase Edge Functions for complex logic
- Add CDN for static assets
- Consider database read replicas at scale

### 10.2 Feature Additions
- Push notifications (Expo Push + Supabase Edge Functions)
- Location services (expo-location)
- Payment processing (Stripe + Supabase Edge Functions)
- Analytics (Mixpanel or Amplitude)

---

*Architecture document for Sniffr ATX MVP.*
