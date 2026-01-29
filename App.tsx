import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import Layout from './components/Layout';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import ResidentDashboard from './components/ResidentDashboard';
import { User, UserRole, Profile } from './types';
import { supabase } from './services/supabase';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { Building } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('auth');

  // App State (Simulating Backend)
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [amenities, setAmenities] = useState<Amenity[]>(MOCK_AMENITIES);
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [settings, setSettings] = useState<AppSettings>({ bookingAnticipationDays: 1 });

  const { addToast } = useToast();

  const handleLogin = React.useCallback((email: string, role: UserRole) => {
    const user = users.find(u => u.email === email && u.role === role);
    if (user) {
      setCurrentUser(user);
      setCurrentPage(role === UserRole.ADMIN ? 'admin-dashboard' : 'resident-dashboard');
      addToast(`Welcome back, ${user.name.split(' ')[0]}`, 'success');
    }
  }, [users, addToast]);

  const handleLogout = React.useCallback(() => {
    setCurrentUser(null);
    setCurrentPage('auth');
    addToast('Logged out successfully', 'info');
  }, [addToast]);

  // --- Handlers ---

  const handleAddAmenity = React.useCallback((newAmenity: Amenity) => {
    setAmenities(prev => [...prev, newAmenity]);
    addToast('Amenity created', 'success');
  }, [addToast]);

  const handleDeleteAmenity = React.useCallback((id: string) => {
    setAmenities(prev => prev.filter(a => a.id !== id));
    addToast('Amenity deleted', 'info');
  }, [addToast]);

  const handleAddUsers = React.useCallback((newUsers: Partial<User>[]) => {
    const formattedUsers: User[] = newUsers.map((u, i) => ({
      id: `new-${crypto.randomUUID()}-${i}`,
      name: u.name || 'Unknown',
      email: u.email || '',
      role: UserRole.RESIDENT,
      unit: u.unit || 'Pending',
      avatarUrl: `https://ui-avatars.com/api/?name=${u.name}`
    }));
    setUsers(prev => [...prev, ...formattedUsers]);
  }, []);

  const handleCreateReservation = React.useCallback((res: Reservation) => {
    setReservations(prev => [...prev, res]);
  }, []);

  const handleCancelReservation = React.useCallback((id: string) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: ReservationStatus.CANCELLED } : r));
  }, []);

  const handleAnnouncement = React.useCallback((ann: Announcement) => {
    setAnnouncements(prev => [ann, ...prev]);
  }, []);

  const handleMarkAnnouncementRead = React.useCallback((id: string) => {
    setAnnouncements(prev => prev.map(a =>
      (currentUser && a.id === id) ? { ...a, readBy: [...a.readBy, currentUser.id] } : a
    ));
  }, [currentUser]);

  const unreadCount = React.useMemo(() =>
    currentUser ? announcements.filter(a => !a.readBy.includes(currentUser.id)).length : 0,
    [announcements, currentUser]
  );

  return (
    <>
      {!currentUser ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <Layout
          user={currentUser}
          onLogout={handleLogout}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          unreadNotifications={unreadCount}
        >
          {currentUser.role === UserRole.ADMIN ? (
            <AdminDashboard
              page={currentPage}
              amenities={amenities}
              users={users}
              reservations={reservations}
              settings={settings}
              onUpdateSettings={setSettings}
              onAddAmenity={handleAddAmenity}
              onDeleteAmenity={handleDeleteAmenity}
              onAddUsers={handleAddUsers}
              onCancelReservation={handleCancelReservation}
              onMakeAnnouncement={handleAnnouncement}
            />
          ) : (
            <ResidentDashboard
              page={currentPage}
              user={currentUser}
              amenities={amenities}
              reservations={reservations}
              announcements={announcements}
              settings={settings}
              onCreateReservation={handleCreateReservation}
              onCancelReservation={handleCancelReservation}
              onMarkAnnouncementRead={handleMarkAnnouncementRead}
            />
          )}
        </Layout>
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;