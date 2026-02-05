export enum UserRole {
  ADMIN = 'ADMIN',
  RESIDENT = 'RESIDENT'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  unit?: string; // Only for residents
  avatarUrl?: string;
}

export interface Amenity {
  id: string;
  name: string;
  description: string;
  capacity: number;
  imageUrl: string;
  iconName: string; // Lucide icon name
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
}

export enum ReservationStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export interface Reservation {
  id: string;
  amenityId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: ReservationStatus;
  user?: User; // Hydrated
  amenity?: Amenity; // Hydrated
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  priority: 'LOW' | 'HIGH';
  readBy: string[]; // Array of User IDs
}

export interface AppSettings {
  minHoursAdvance: number;
  maxDuration: number;
  maxActiveBookings: number;
}