# 🔌 API Design Document

## Sniffr ATX - Supabase API Reference

**Document Version:** 1.0  
**Last Updated:** December 23, 2024  

---

## 1. Overview

Sniffr ATX uses Supabase as a Backend-as-a-Service (BaaS). All API calls are made through the Supabase JavaScript client library. This document outlines the data operations for each feature.

---

## 2. Authentication API

### 2.1 Sign Up

```typescript
// lib/api/auth.ts

interface SignUpParams {
  email: string;
  password: string;
  displayName: string;
}

async function signUp({ email, password, displayName }: SignUpParams) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });
  
  if (error) throw error;
  return data;
}
```

### 2.2 Sign In

```typescript
async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}
```

### 2.3 Sign Out

```typescript
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
```

### 2.4 Get Current Session

```typescript
async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}
```

### 2.5 Reset Password

```typescript
async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'sniffratx://reset-password',
  });
  if (error) throw error;
}
```

---

## 3. Profile API

### 3.1 Get Current User Profile

```typescript
// lib/api/profile.ts

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  favorite_places: string[];
  created_at: string;
  updated_at: string;
}

async function getMyProfile(): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) throw error;
  return data;
}
```

### 3.2 Get Profile by ID

```typescript
async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}
```

### 3.3 Update Profile

```typescript
interface UpdateProfileParams {
  display_name?: string;
  bio?: string;
  favorite_places?: string[];
}

async function updateProfile(updates: UpdateProfileParams): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### 3.4 Upload Avatar

```typescript
async function uploadAvatar(file: Blob): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const filePath = `${user.id}/avatar.jpg`;
  
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });
  
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Update profile with new avatar URL
  await updateProfile({ avatar_url: publicUrl });
  
  return publicUrl;
}
```

---

## 4. Dog API

### 4.1 Types

```typescript
interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  age_years: number | null;
  bio: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateDogParams {
  name: string;
  breed?: string;
  age_years?: number;
  bio?: string;
}
```

### 4.2 Get My Dog

```typescript
async function getMyDog(): Promise<Dog | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('owner_id', user.id)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}
```

### 4.3 Get Dog by Owner ID

```typescript
async function getDogByOwner(ownerId: string): Promise<Dog | null> {
  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('owner_id', ownerId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
```

### 4.4 Create Dog

```typescript
async function createDog(params: CreateDogParams): Promise<Dog> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('dogs')
    .insert({
      owner_id: user.id,
      ...params,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### 4.5 Update Dog

```typescript
async function updateDog(dogId: string, updates: Partial<CreateDogParams>): Promise<Dog> {
  const { data, error } = await supabase
    .from('dogs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dogId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### 4.6 Upload Dog Photo

```typescript
async function uploadDogPhoto(dogId: string, file: Blob): Promise<string> {
  const filePath = `${dogId}/primary.jpg`;
  
  const { error: uploadError } = await supabase.storage
    .from('dogs')
    .upload(filePath, file, { upsert: true });
  
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('dogs')
    .getPublicUrl(filePath);

  // Update dog with new photo URL
  await supabase
    .from('dogs')
    .update({ photo_url: publicUrl })
    .eq('id', dogId);
  
  return publicUrl;
}
```

---

## 5. Connections API

### 5.1 Types

```typescript
type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
}

interface ConnectionWithProfile extends Connection {
  other_user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    dog: Dog | null;
  };
}
```

### 5.2 Get My Connections

```typescript
async function getMyConnections(status?: ConnectionStatus): Promise<ConnectionWithProfile[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('connections')
    .select(`
      *,
      requester:profiles!requester_id(id, display_name, avatar_url),
      addressee:profiles!addressee_id(id, display_name, avatar_url)
    `)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Transform to include other_user
  return data.map(conn => ({
    ...conn,
    other_user: conn.requester_id === user.id ? conn.addressee : conn.requester,
  }));
}
```

### 5.3 Get Pending Requests (received)

```typescript
async function getPendingRequests(): Promise<ConnectionWithProfile[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('connections')
    .select(`
      *,
      requester:profiles!requester_id(id, display_name, avatar_url, dogs(*))
    `)
    .eq('addressee_id', user.id)
    .eq('status', 'pending');

  if (error) throw error;
  return data;
}
```

### 5.4 Send Connection Request (after QR scan)

```typescript
async function sendConnectionRequest(addresseeId: string): Promise<Connection> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if connection already exists
  const { data: existing } = await supabase
    .from('connections')
    .select('*')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
    .single();

  if (existing) {
    throw new Error('Connection already exists');
  }

  const { data, error } = await supabase
    .from('connections')
    .insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 5.5 Respond to Connection Request

```typescript
async function respondToRequest(
  connectionId: string, 
  accept: boolean
): Promise<Connection> {
  const { data, error } = await supabase
    .from('connections')
    .update({
      status: accept ? 'accepted' : 'declined',
      updated_at: new Date().toISOString(),
    })
    .eq('id', connectionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 5.6 Remove Connection

```typescript
async function removeConnection(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', connectionId);

  if (error) throw error;
}
```

### 5.7 Block User

```typescript
async function blockUser(connectionId: string): Promise<Connection> {
  const { data, error } = await supabase
    .from('connections')
    .update({
      status: 'blocked',
      updated_at: new Date().toISOString(),
    })
    .eq('id', connectionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

## 6. Messages API

### 6.1 Types

```typescript
interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface Conversation {
  other_user_id: string;
  other_user: {
    display_name: string;
    avatar_url: string | null;
  };
  last_message: string;
  last_message_at: string;
  unread_count: number;
}
```

### 6.2 Get Conversations List

```typescript
async function getConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get all messages grouped by conversation
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id(display_name, avatar_url),
      receiver:profiles!receiver_id(display_name, avatar_url)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Group by conversation partner
  const conversationMap = new Map<string, Conversation>();
  
  for (const msg of data) {
    const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    const otherProfile = msg.sender_id === user.id ? msg.receiver : msg.sender;
    
    if (!conversationMap.has(otherId)) {
      conversationMap.set(otherId, {
        other_user_id: otherId,
        other_user: otherProfile,
        last_message: msg.content,
        last_message_at: msg.created_at,
        unread_count: 0,
      });
    }
    
    if (msg.receiver_id === user.id && !msg.read_at) {
      const conv = conversationMap.get(otherId)!;
      conv.unread_count++;
    }
  }

  return Array.from(conversationMap.values());
}
```

### 6.3 Get Messages with User

```typescript
async function getMessages(
  otherUserId: string, 
  limit = 50
): Promise<Message[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}
```

### 6.4 Send Message

```typescript
async function sendMessage(receiverId: string, content: string): Promise<Message> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 6.5 Mark Messages as Read

```typescript
async function markAsRead(otherUserId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', otherUserId)
    .eq('receiver_id', user.id)
    .is('read_at', null);

  if (error) throw error;
}
```

### 6.6 Subscribe to New Messages (Realtime)

```typescript
function subscribeToMessages(
  onMessage: (message: Message) => void
): () => void {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const channel = supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
```

---

## 7. Error Handling

### 7.1 Error Types

```typescript
// lib/api/errors.ts

export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleSupabaseError(error: any): never {
  // Auth errors
  if (error.message?.includes('Invalid login credentials')) {
    throw new APIError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }
  
  if (error.message?.includes('Email not confirmed')) {
    throw new APIError('Please verify your email', 'EMAIL_NOT_VERIFIED', 401);
  }

  // Database errors
  if (error.code === '23505') {
    throw new APIError('This record already exists', 'DUPLICATE', 409);
  }
  
  if (error.code === 'PGRST301') {
    throw new APIError('Not authorized', 'UNAUTHORIZED', 403);
  }

  // Default
  throw new APIError(
    error.message || 'An unexpected error occurred',
    error.code || 'UNKNOWN',
    error.status || 500
  );
}
```

---

## 8. API Usage Examples

### 8.1 Complete User Signup Flow

```typescript
async function completeSignup(
  email: string,
  password: string,
  displayName: string,
  dogName: string,
  dogBreed: string
) {
  // 1. Sign up
  await signUp({ email, password, displayName });
  
  // 2. Sign in (if email confirmation disabled)
  await signIn(email, password);
  
  // 3. Create dog profile
  await createDog({ name: dogName, breed: dogBreed });
}
```

### 8.2 QR Scan and Connect Flow

```typescript
async function handleQRScan(scannedData: string) {
  // 1. Parse QR data
  const payload = JSON.parse(scannedData);
  
  if (payload.type !== 'sniffr-atx') {
    throw new Error('Invalid QR code');
  }
  
  // 2. Get the scanned user's profile
  const profile = await getProfile(payload.userId);
  const dog = await getDogByOwner(payload.userId);
  
  // 3. Show confirmation UI, then...
  
  // 4. Send connection request
  await sendConnectionRequest(payload.userId);
}
```

---

*API design document for Sniffr ATX MVP.*
