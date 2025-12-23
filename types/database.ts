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
    };
    Enums: {
      connection_status: ConnectionStatus;
    };
  };
}
