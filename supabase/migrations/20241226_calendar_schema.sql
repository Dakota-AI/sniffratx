-- Calendar Feature Schema for Sniffr ATX
-- Migration: 20241226_calendar_schema.sql

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Event types for calendar entries
CREATE TYPE event_type AS ENUM (
  'playdate',
  'vet_appointment',
  'vaccination',
  'medication',
  'custom'
);

-- Invitation status for playdates
CREATE TYPE invitation_status AS ENUM (
  'pending',
  'accepted',
  'declined'
);

-- Recurrence pattern for medications
CREATE TYPE recurrence_type AS ENUM (
  'none',
  'daily',
  'weekly',
  'monthly'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Main calendar events table
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES public.dogs(id) ON DELETE SET NULL,
  event_type event_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT FALSE,

  -- Native calendar sync
  native_calendar_id TEXT,

  -- Recurrence for medications
  recurrence recurrence_type DEFAULT 'none',
  recurrence_end_date DATE,

  -- Vaccination-specific fields
  expiration_date DATE,
  vaccination_type TEXT,

  -- Medication-specific fields
  medication_name TEXT,
  dosage TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Playdate invitations table
CREATE TABLE public.playdate_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status invitation_status DEFAULT 'pending' NOT NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_invitation UNIQUE (event_id, invitee_id)
);

-- Event reminders table
CREATE TABLE public.event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  remind_before_minutes INTEGER NOT NULL,
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Push notification tokens table
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_user_token UNIQUE (user_id, token)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Calendar events indexes
CREATE INDEX idx_calendar_events_owner ON public.calendar_events(owner_id);
CREATE INDEX idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX idx_calendar_events_type ON public.calendar_events(event_type);
CREATE INDEX idx_calendar_events_dog ON public.calendar_events(dog_id);
CREATE INDEX idx_calendar_events_expiration ON public.calendar_events(expiration_date)
  WHERE expiration_date IS NOT NULL;

-- Playdate invitations indexes
CREATE INDEX idx_playdate_invitations_event ON public.playdate_invitations(event_id);
CREATE INDEX idx_playdate_invitations_invitee ON public.playdate_invitations(invitee_id);
CREATE INDEX idx_playdate_invitations_status ON public.playdate_invitations(status);

-- Event reminders indexes
CREATE INDEX idx_event_reminders_event ON public.event_reminders(event_id);
CREATE INDEX idx_event_reminders_pending ON public.event_reminders(notification_sent)
  WHERE notification_sent = FALSE;

-- Push tokens indexes
CREATE INDEX idx_push_tokens_user ON public.push_tokens(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playdate_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Calendar Events Policies
CREATE POLICY "Users can view own events"
  ON public.calendar_events FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view events they are invited to"
  ON public.calendar_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.playdate_invitations
      WHERE event_id = calendar_events.id
      AND invitee_id = auth.uid()
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can create own events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own events"
  ON public.calendar_events FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own events"
  ON public.calendar_events FOR DELETE
  USING (auth.uid() = owner_id);

-- Playdate Invitations Policies
CREATE POLICY "Event owners can view invitations for their events"
  ON public.playdate_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_events
      WHERE id = playdate_invitations.event_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Invitees can view their invitations"
  ON public.playdate_invitations FOR SELECT
  USING (auth.uid() = invitee_id);

CREATE POLICY "Event owners can create invitations for connected users"
  ON public.playdate_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calendar_events
      WHERE id = event_id
      AND owner_id = auth.uid()
    )
    AND
    are_connected(auth.uid(), invitee_id)
  );

CREATE POLICY "Invitees can update their invitation status"
  ON public.playdate_invitations FOR UPDATE
  USING (auth.uid() = invitee_id)
  WITH CHECK (auth.uid() = invitee_id);

CREATE POLICY "Event owners can delete invitations"
  ON public.playdate_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_events
      WHERE id = event_id
      AND owner_id = auth.uid()
    )
  );

-- Event Reminders Policies
CREATE POLICY "Users can view reminders for own events"
  ON public.event_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_events
      WHERE id = event_reminders.event_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reminders for own events"
  ON public.event_reminders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calendar_events
      WHERE id = event_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update reminders for own events"
  ON public.event_reminders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_events
      WHERE id = event_reminders.event_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete reminders for own events"
  ON public.event_reminders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_events
      WHERE id = event_reminders.event_id
      AND owner_id = auth.uid()
    )
  );

-- Push Tokens Policies
CREATE POLICY "Users can view own push tokens"
  ON public.push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own push tokens"
  ON public.push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push tokens"
  ON public.push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens"
  ON public.push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Handle updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get expiring vaccinations for a user (within N days)
CREATE OR REPLACE FUNCTION public.get_expiring_vaccinations(user_uuid UUID, days_ahead INTEGER DEFAULT 30)
RETURNS SETOF public.calendar_events AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.calendar_events
  WHERE owner_id = user_uuid
  AND event_type = 'vaccination'
  AND expiration_date IS NOT NULL
  AND expiration_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + days_ahead);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get upcoming events for a user
CREATE OR REPLACE FUNCTION public.get_upcoming_events(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS SETOF public.calendar_events AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.calendar_events
  WHERE owner_id = user_uuid
  AND start_time >= NOW()
  ORDER BY start_time ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp on calendar_events
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update updated_at timestamp on playdate_invitations
CREATE TRIGGER update_playdate_invitations_updated_at
  BEFORE UPDATE ON public.playdate_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update updated_at timestamp on push_tokens
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- REALTIME
-- =====================================================

-- Enable realtime for calendar events and invitations
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.playdate_invitations;
