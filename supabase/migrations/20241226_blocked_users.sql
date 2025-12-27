-- Migration: Add blocked users functionality
-- Run this in your Supabase SQL Editor

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see their own blocks (both who they blocked and who blocked them)
CREATE POLICY "Users can view their own blocks"
  ON blocked_users
  FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

-- Users can block others
CREATE POLICY "Users can block others"
  ON blocked_users
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock people they blocked
CREATE POLICY "Users can unblock"
  ON blocked_users
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- Create a function to check if two users have a block between them
CREATE OR REPLACE FUNCTION is_blocked(user1 UUID, user2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = user1 AND blocked_id = user2)
       OR (blocker_id = user2 AND blocked_id = user1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STORAGE BUCKETS FOR IMAGES
-- =====================================================
-- Note: Run these in Supabase Dashboard > Storage > New bucket
-- Or run these SQL commands:

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create dogs bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dogs', 'dogs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
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

-- Storage policies for dogs bucket
CREATE POLICY "Dog images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dogs');

CREATE POLICY "Users can upload dog photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'dogs' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update dog photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'dogs' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete dog photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'dogs' AND auth.role() = 'authenticated');
