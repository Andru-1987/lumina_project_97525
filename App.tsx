import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import ResidentDashboard from './components/ResidentDashboard';
import { User, UserRole, Amenity, Reservation, Announcement, AppSettings, ReservationStatus } from './types';
import { MOCK_USERS, MOCK_AMENITIES, MOCK_RESERVATIONS, MOCK_ANNOUNCEMENTS } from './mockData';
import { ToastProvider, useToast } from './contexts/ToastContext';

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

  const handleLogin = (email: string, role: UserRole) => {
    const user = users.find(u => u.email === email && u.role === role);
    if (user) {
      setCurrentUser(user);
      setCurrentPage(role === UserRole.ADMIN ? 'admin-dashboard' : 'resident-dashboard');
      addToast(`Welcome back, ${user.name.split(' ')[0]}`, 'success');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('auth');
    addToast('Logged out successfully', 'info');
  };

  // --- Handlers ---

  const handleAddAmenity = (newAmenity: Amenity) => {
      setAmenities([...amenities, newAmenity]);
      addToast('Amenity created', 'success');
  };

  const handleDeleteAmenity = (id: string) => {
      setAmenities(amenities.filter(a => a.id !== id));
      addToast('Amenity deleted', 'info');
  };

  const handleAddUsers = (newUsers: Partial<User>[]) => {
      const formattedUsers: User[] = newUsers.map((u, i) => ({
          id: `new-${Date.now()}-${i}`,
          name: u.name || 'Unknown',
          email: u.email || '',
          role: UserRole.RESIDENT,
          unit: u.unit || 'Pending',
          avatarUrl: `https://ui-avatars.com/api/?name=${u.name}`
      }));
      setUsers([...users, ...formattedUsers]);
  };

  const handleCreateReservation = (res: Reservation) => {
      setReservations([...reservations, res]);
      // Simulation of a backend confirmation could go here
  };

  const handleCancelReservation = (id: string) => {
      setReservations(reservations.map(r => r.id === id ? { ...r, status: ReservationStatus.CANCELLED } : r));
  };

  const handleAnnouncement = (ann: Announcement) => {
      setAnnouncements([ann, ...announcements]);
  };

  const handleMarkAnnouncementRead = (id: string) => {
      if(!currentUser) return;
      setAnnouncements(announcements.map(a => 
          a.id === id ? { ...a, readBy: [...a.readBy, currentUser.id] } : a
      ));
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  const unreadCount = announcements.filter(a => !a.readBy.includes(currentUser.id)).length;

  return (
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