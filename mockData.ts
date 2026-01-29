import { Amenity, Announcement, Reservation, ReservationStatus, User, UserRole } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@edificio.com',
    role: UserRole.ADMIN,
    avatarUrl: 'https://picsum.photos/id/1/200/200'
  },
  {
    id: 'u2',
    name: 'Vecino Ejemplo',
    email: 'vecino@edificio.com',
    role: UserRole.RESIDENT,
    unit: '5-B',
    avatarUrl: 'https://picsum.photos/id/64/200/200'
  },
  {
    id: 'u3',
    name: 'Ana García',
    email: 'ana@edificio.com',
    role: UserRole.RESIDENT,
    unit: '2-A',
    avatarUrl: 'https://picsum.photos/id/65/200/200'
  }
];

export const MOCK_AMENITIES: Amenity[] = [
  {
    id: 'a1',
    name: 'Rooftop Pool',
    description: 'Infinity pool with panoramic city views.',
    capacity: 10,
    imageUrl: 'https://picsum.photos/id/10/800/600',
    iconName: 'Waves',
    openTime: '08:00',
    closeTime: '22:00'
  },
  {
    id: 'a2',
    name: 'Co-Working Space',
    description: 'Quiet area with high-speed wifi and meeting pods.',
    capacity: 20,
    imageUrl: 'https://picsum.photos/id/2/800/600',
    iconName: 'Briefcase',
    openTime: '06:00',
    closeTime: '23:00'
  },
  {
    id: 'a3',
    name: 'BBQ Area',
    description: 'Grill station perfect for weekend gatherings.',
    capacity: 15,
    imageUrl: 'https://picsum.photos/id/431/800/600',
    iconName: 'Utensils',
    openTime: '11:00',
    closeTime: '23:00'
  }
];

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'r1',
    amenityId: 'a1',
    userId: 'u2',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    startTime: '10:00',
    endTime: '12:00',
    status: ReservationStatus.CONFIRMED
  }
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'n1',
    title: 'Elevator Maintenance',
    message: 'Elevator B will be under maintenance on Tuesday from 10 AM to 2 PM.',
    date: new Date().toISOString(),
    priority: 'HIGH',
    readBy: []
  }
];