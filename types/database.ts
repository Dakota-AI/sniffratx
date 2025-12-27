// Database Types for Sniffr ATX
// These types match the Supabase database schema

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  favorite_places: string[];
  created_at: string;
  updated_at: string;
}

export interface Dog {
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

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

// Calendar types
export type EventType = 'playdate' | 'vet_appointment' | 'vaccination' | 'medication' | 'custom';
export type InvitationStatus = 'pending' | 'accepted' | 'declined';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

// Calendar Event
export interface CalendarEvent {
  id: string;
  owner_id: string;
  dog_id: string | null;
  event_type: EventType;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  native_calendar_id: string | null;
  recurrence: RecurrenceType;
  recurrence_end_date: string | null;
  expiration_date: string | null;
  vaccination_type: string | null;
  medication_name: string | null;
  dosage: string | null;
  created_at: string;
  updated_at: string;
}

// Playdate Invitation
export interface PlaydateInvitation {
  id: string;
  event_id: string;
  invitee_id: string;
  status: InvitationStatus;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

// Event Reminder
export interface EventReminder {
  id: string;
  event_id: string;
  remind_before_minutes: number;
  notification_sent: boolean;
  notification_id: string | null;
  created_at: string;
}

// Push Token
export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  created_at: string;
  updated_at: string;
}

// Extended types with relationships

export interface ProfileWithDog extends Profile {
  dog: Dog | null;
}

export interface ConnectionWithProfile extends Connection {
  other_user: ProfileWithDog;
}

export interface Conversation {
  other_user_id: string;
  other_user: {
    display_name: string;
    avatar_url: string | null;
  };
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

// Calendar extended types
export interface CalendarEventWithInvitations extends CalendarEvent {
  invitations: PlaydateInvitationWithProfile[];
}

export interface PlaydateInvitationWithProfile extends PlaydateInvitation {
  invitee: Profile;
}

export interface PlaydateInvitationWithEvent extends PlaydateInvitation {
  event: CalendarEventWithOwner;
}

export interface CalendarEventWithOwner extends CalendarEvent {
  owner: Profile;
}

// QR Code payload

export interface QRPayload {
  type: 'sniffr-atx';
  version: number;
  userId: string;
}

// Form types

export interface CreateProfileInput {
  display_name: string;
  bio?: string;
}

export interface UpdateProfileInput {
  display_name?: string;
  bio?: string;
  favorite_places?: string[];
}

export interface CreateDogInput {
  name: string;
  breed?: string;
  age_years?: number;
  bio?: string;
}

export interface UpdateDogInput {
  name?: string;
  breed?: string;
  age_years?: number;
  bio?: string;
}

// Calendar form types
export interface CreateEventInput {
  event_type: EventType;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time?: string;
  all_day?: boolean;
  dog_id?: string;
  recurrence?: RecurrenceType;
  recurrence_end_date?: string;
  expiration_date?: string;
  vaccination_type?: string;
  medication_name?: string;
  dosage?: string;
  invitee_ids?: string[];
  reminder_minutes?: number[];
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}

// Auth types

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

// API Response types

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code: string;
  status?: number;
}

// Supabase Database type helper
// This can be auto-generated from Supabase, but here's a basic version

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      dogs: {
        Row: Dog;
        Insert: Omit<Dog, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Dog, 'id' | 'owner_id' | 'created_at'>>;
      };
      connections: {
        Row: Connection;
        Insert: Omit<Connection, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Pick<Connection, 'status'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Pick<Message, 'read_at'>>;
      };
      calendar_events: {
        Row: CalendarEvent;
        Insert: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CalendarEvent, 'id' | 'owner_id' | 'created_at'>>;
      };
      playdate_invitations: {
        Row: PlaydateInvitation;
        Insert: Omit<PlaydateInvitation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Pick<PlaydateInvitation, 'status' | 'responded_at'>>;
      };
      event_reminders: {
        Row: EventReminder;
        Insert: Omit<EventReminder, 'id' | 'created_at'>;
        Update: Partial<Pick<EventReminder, 'notification_sent' | 'notification_id'>>;
      };
      push_tokens: {
        Row: PushToken;
        Insert: Omit<PushToken, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Pick<PushToken, 'token'>>;
      };
    };
    Enums: {
      connection_status: ConnectionStatus;
      event_type: EventType;
      invitation_status: InvitationStatus;
      recurrence_type: RecurrenceType;
    };
  };
}
