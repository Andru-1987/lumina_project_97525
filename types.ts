import { Database } from './types/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Amenity = Database['public']['Tables']['amenities']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type Announcement = Database['public']['Tables']['announcements']['Row'];
export type AppSettings = Database['public']['Tables']['app_settings']['Row'];

export enum UserRole {
    ADMIN = 'ADMIN',
    RESIDENT = 'RESIDENT'
}

// Add any other frontend-specific types here