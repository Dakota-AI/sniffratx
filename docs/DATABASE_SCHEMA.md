# 🗄 Database Schema

## Sniffr ATX - Supabase PostgreSQL Schema

**Document Version:** 1.0  
**Last Updated:** December 23, 2024  

---

## 1. Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│   auth.users    │       │    profiles     │
│─────────────────│       │─────────────────│
│ id (PK)         │◄──────│ id (PK, FK)     │
│ email           │   1:1 │ display_name    │
│ created_at      │       │ avatar_url      │
└─────────────────┘       │ bio             │
                          │ favorite_places │
                          │ created_at      │
                          │ updated_at      │
                          └────────┬────────┘
                                   │ 1:1 (MVP)
                                   ▼
                          ┌─────────────────┐
                          │      dogs       │
                          │─────────────────│
                          │ id (PK)         │
                          │ owner_id (FK)   │
                          │ name            │
                          │ breed           │
                          │ age_years       │
                          │ bio             │
                          │ photo_url       │
                          │ created_at      │
                          │ updated_at      │
                          └─────────────────┘

┌─────────────────┐
│   connections   │
│─────────────────│
│ id (PK)         │
│ requester_id(FK)│──────► profiles.id
│ addressee_id(FK)│──────► profiles.id
│ status          │       (pending/accepted/declined)
│ created_at      │
│ updated_at      │
└─────────────────┘

┌─────────────────┐
│    messages     │
│─────────────────│
│ id (PK)         │
│ sender_id (FK)  │──────► profiles.id
│ receiver_id(FK) │──────► profiles.id
│ content         │
│ read_at         │
│ created_at      │
└─────────────────┘
```

---

## 2. Table Definitions

### 2.1 Profiles Table

Extends Supabase's `auth.users` with additional profile data.

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  favorite_places TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'New User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for faster lookups
CREATE INDEX idx_profiles_display_name ON public.profiles(display_name);
```

### 2.2 Dogs Table

```sql
-- Create dogs table
CREATE TABLE public.dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT,
  age_years INTEGER,
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- MVP: One dog per user (can be relaxed later)
  CONSTRAINT unique_owner_dog UNIQUE (owner_id)
);

-- Enable RLS
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Dogs are viewable by everyone"
  ON public.dogs FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own dog"
  ON public.dogs FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own dog"
  ON public.dogs FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own dog"
  ON public.dogs FOR DELETE
  USING (auth.uid() = owner_id);

-- Indexes
CREATE INDEX idx_dogs_owner_id ON public.dogs(owner_id);
```

### 2.3 Connections Table

```sql
-- Create connection status enum
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');

-- Create connections table
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status connection_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicate connections
  CONSTRAINT unique_connection UNIQUE (requester_id, addressee_id),
  -- Prevent self-connections
  CONSTRAINT no_self_connection CHECK (requester_id != addressee_id)
);

-- Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own connections"
  ON public.connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create connection requests"
  ON public.connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update connections they're part of"
  ON public.connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete their own connection requests"
  ON public.connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Indexes
CREATE INDEX idx_connections_requester ON public.connections(requester_id);
CREATE INDEX idx_connections_addressee ON public.connections(addressee_id);
CREATE INDEX idx_connections_status ON public.connections(status);
```

### 2.4 Messages Table

```sql
-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent self-messaging
  CONSTRAINT no_self_message CHECK (sender_id != receiver_id)
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Function to check if users are connected
CREATE OR REPLACE FUNCTION public.are_connected(user1 UUID, user2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.connections
    WHERE status = 'accepted'
    AND (
      (requester_id = user1 AND addressee_id = user2)
      OR (requester_id = user2 AND addressee_id = user1)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies
CREATE POLICY "Users can view messages they sent or received"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages to connections"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND public.are_connected(sender_id, receiver_id)
  );

CREATE POLICY "Receivers can mark messages as read"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Indexes
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);
```

---

## 3. Storage Buckets

```sql
-- Create storage buckets (run in Supabase dashboard or via API)

-- Avatars bucket (user profile photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Dogs bucket (dog photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dogs', 'dogs', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for dogs
CREATE POLICY "Dog images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dogs');

CREATE POLICY "Users can upload their dog photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'dogs'
    AND EXISTS (
      SELECT 1 FROM public.dogs
      WHERE id::text = (storage.foldername(name))[1]
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their dog photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'dogs'
    AND EXISTS (
      SELECT 1 FROM public.dogs
      WHERE id::text = (storage.foldername(name))[1]
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their dog photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'dogs'
    AND EXISTS (
      SELECT 1 FROM public.dogs
      WHERE id::text = (storage.foldername(name))[1]
      AND owner_id = auth.uid()
    )
  );
```

---

## 4. Useful Views

```sql
-- View: User's connections with profile details
CREATE OR REPLACE VIEW public.connection_details AS
SELECT 
  c.id as connection_id,
  c.status,
  c.created_at as connected_at,
  CASE 
    WHEN c.requester_id = auth.uid() THEN c.addressee_id
    ELSE c.requester_id
  END as other_user_id,
  p.display_name,
  p.avatar_url,
  d.name as dog_name,
  d.breed as dog_breed,
  d.photo_url as dog_photo
FROM public.connections c
JOIN public.profiles p ON p.id = CASE 
    WHEN c.requester_id = auth.uid() THEN c.addressee_id
    ELSE c.requester_id
  END
LEFT JOIN public.dogs d ON d.owner_id = p.id
WHERE c.requester_id = auth.uid() OR c.addressee_id = auth.uid();

-- View: Conversation list with last message
CREATE OR REPLACE VIEW public.conversations AS
SELECT DISTINCT ON (other_user_id)
  CASE 
    WHEN m.sender_id = auth.uid() THEN m.receiver_id
    ELSE m.sender_id
  END as other_user_id,
  p.display_name,
  p.avatar_url,
  m.content as last_message,
  m.created_at as last_message_at,
  m.sender_id = auth.uid() as is_from_me,
  m.read_at IS NOT NULL as is_read
FROM public.messages m
JOIN public.profiles p ON p.id = CASE 
    WHEN m.sender_id = auth.uid() THEN m.receiver_id
    ELSE m.sender_id
  END
WHERE m.sender_id = auth.uid() OR m.receiver_id = auth.uid()
ORDER BY other_user_id, m.created_at DESC;
```

---

## 5. Helper Functions

```sql
-- Function: Get unread message count
CREATE OR REPLACE FUNCTION public.get_unread_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.messages
    WHERE receiver_id = auth.uid()
    AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get pending connection count
CREATE OR REPLACE FUNCTION public.get_pending_connections_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.connections
    WHERE addressee_id = auth.uid()
    AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_read(other_user UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.messages
  SET read_at = NOW()
  WHERE receiver_id = auth.uid()
  AND sender_id = other_user
  AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Realtime Configuration

Enable realtime for the messages table:

```sql
-- In Supabase Dashboard: Database > Replication
-- Or via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
```

---

## 7. Initial Setup Script

Complete SQL script to run in Supabase SQL Editor:

```sql
-- =============================================
-- SNIFFR ATX DATABASE SETUP
-- Run this entire script in Supabase SQL Editor
-- =============================================

-- 1. Create ENUM types
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  favorite_places TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create dogs table
CREATE TABLE public.dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT,
  age_years INTEGER,
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_owner_dog UNIQUE (owner_id)
);

-- 4. Create connections table
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status connection_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_connection UNIQUE (requester_id, addressee_id),
  CONSTRAINT no_self_connection CHECK (requester_id != addressee_id)
);

-- 5. Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT no_self_message CHECK (sender_id != receiver_id)
);

-- 6. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 7. Create helper function for connection check
CREATE OR REPLACE FUNCTION public.are_connected(user1 UUID, user2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.connections
    WHERE status = 'accepted'
    AND (
      (requester_id = user1 AND addressee_id = user2)
      OR (requester_id = user2 AND addressee_id = user1)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create all RLS policies (see sections above for details)
-- ... [Include all policies from sections 2.1-2.4]

-- 9. Create trigger for auto-creating profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'New User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Create indexes
CREATE INDEX idx_profiles_display_name ON public.profiles(display_name);
CREATE INDEX idx_dogs_owner_id ON public.dogs(owner_id);
CREATE INDEX idx_connections_requester ON public.connections(requester_id);
CREATE INDEX idx_connections_addressee ON public.connections(addressee_id);
CREATE INDEX idx_connections_status ON public.connections(status);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);

-- 11. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;

-- Done! ✅
```

---

*Database schema for Sniffr ATX MVP.*
