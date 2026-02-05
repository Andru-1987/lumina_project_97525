import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import ResidentDashboard from './components/ResidentDashboard';
import { User, UserRole, Amenity, Reservation, Announcement, AppSettings, ReservationStatus } from './types';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { supabase } from './lib/supabase';

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('auth');
  const [loading, setLoading] = useState<boolean>(true);

  // App State
  const [users, setUsers] = useState<User[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    minHoursAdvance: 24,
    maxDuration: 4,
    maxActiveBookings: 3
  });

  const { addToast } = useToast();

  // --- Data Transformation Helpers ---
  const mapBooking = (b: any): Reservation => ({
    id: b.id,
    amenityId: b.amenity_id,
    userId: b.user_id,
    date: b.booking_date,
    startTime: b.start_time.substring(0, 5),
    endTime: b.end_time.substring(0, 5),
    status: b.status.toUpperCase() as ReservationStatus
  });

  const mapAmenity = (a: any): Amenity => ({
    id: a.id,
    name: a.name,
    description: a.description || '',
    capacity: a.capacity,
    imageUrl: a.image_url || `https://picsum.photos/seed/${a.id}/800/600`,
    iconName: a.icon_name || 'Home',
    openTime: a.available_from.substring(0, 5),
    closeTime: a.available_to.substring(0, 5)
  });

  const mapAnnouncement = (a: any): Announcement => ({
    id: a.id,
    title: a.title,
    message: a.content,
    date: a.created_at,
    priority: a.priority.toUpperCase() as 'LOW' | 'HIGH',
    readBy: [] // This logic might need a separate table in a real app, keeping it simple for now
  });

  const mapUser = (p: any): User => ({
    id: p.id,
    name: p.full_name,
    email: '', // We'll get this from auth.user if needed
    role: p.role.toUpperCase() as UserRole,
    unit: p.apartment,
    avatarUrl: `https://ui-avatars.com/api/?name=${p.full_name}`
  });

  // --- Auth Effect ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setCurrentPage('auth');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      const user = mapUser(data);
      setCurrentUser(user);
      if (currentPage === 'auth') {
        setCurrentPage(user.role === UserRole.ADMIN ? 'admin-dashboard' : 'resident-dashboard');
      }
    }
    setLoading(false);
  };

  // --- Data Fetching Effect ---
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      // Fetch Amenities
      const { data: amenitiesData } = await supabase.from('amenities').select('*').eq('is_active', true);
      if (amenitiesData) setAmenities(amenitiesData.map(mapAmenity));

      // Fetch Announcements
      const { data: annData } = await supabase.from('announcements').select('*').eq('is_published', true).order('created_at', { ascending: false });
      if (annData) setAnnouncements(annData.map(mapAnnouncement));

      // Fetch Bookings
      const { data: resData } = await supabase.from('bookings').select('*');
      if (resData) setReservations(resData.map(mapBooking));

      // Fetch Settings
      const { data: settingsData } = await supabase.from('app_settings').select('*');
      if (settingsData) {
        setSettings({
          minHoursAdvance: Number(settingsData.find(s => s.key === 'min_hours_advance')?.value || 24),
          maxDuration: Number(settingsData.find(s => s.key === 'max_duration')?.value || 4),
          maxActiveBookings: Number(settingsData.find(s => s.key === 'max_active_bookings')?.value || 3),
        });
      }

      // Fetch Users (Admin only)
      if (currentUser.role === UserRole.ADMIN) {
        const { data: profilesData } = await supabase.from('profiles').select('*');
        if (profilesData) setUsers(profilesData.map(mapUser));
      }
    };

    fetchData();

    // --- Realtime Subscription ---
    const bookingsSubscription = supabase
      .channel('bookings-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Realtime update (bookings):', payload);
          if (payload.eventType === 'INSERT') {
            setReservations(prev => [...prev, mapBooking(payload.new)]);
          } else if (payload.eventType === 'UPDATE') {
            setReservations(prev => prev.map(r => r.id === payload.new.id ? mapBooking(payload.new) : r));
          } else if (payload.eventType === 'DELETE') {
            setReservations(prev => prev.filter(r => r.id === payload.old.id));
          }
        }
      )
      .subscribe();

    const settingsSubscription = supabase
      .channel('settings-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_settings' },
        (payload) => {
          console.log('Realtime update (settings):', payload);
          setSettings(prev => {
            const newSettings = { ...prev };
            if (payload.new.key === 'min_hours_advance') newSettings.minHoursAdvance = Number(payload.new.value);
            if (payload.new.key === 'max_duration') newSettings.maxDuration = Number(payload.new.value);
            if (payload.new.key === 'max_active_bookings') newSettings.maxActiveBookings = Number(payload.new.value);
            return newSettings;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsSubscription);
      supabase.removeChannel(settingsSubscription);
    };
  }, [currentUser]);

  // --- Handlers ---

  const handleLogout = React.useCallback(async () => {
    await supabase.auth.signOut();
    addToast('Logged out successfully', 'info');
  }, [addToast]);

  const handleCreateReservation = React.useCallback(async (res: Reservation) => {
    const { data, error } = await supabase.functions.invoke('validate-booking', {
      body: {
        amenity_id: res.amenityId,
        date: res.date,
        start_time: res.startTime,
        end_time: res.endTime
      }
    });

    if (error) {
      let message = 'Failed to create reservation';
      try {
        const errJson = await error.context.json();
        message = errJson.error || message;
      } catch (e) {
        message = error.message || message;
      }
      addToast(message, 'error');
    } else if (data?.error) {
      addToast(data.error, 'error');
    } else {
      addToast('Reservation Confirmed!', 'success');
    }
  }, [addToast]);

  const handleCancelReservation = React.useCallback(async (id: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      addToast(error.message, 'error');
    } else {
      addToast('Reservation cancelled', 'info');
    }
  }, [addToast]);

  const handleUpdateSettings = React.useCallback(async (newSettings: AppSettings) => {
    const updates = [
      { key: 'min_hours_advance', value: newSettings.minHoursAdvance.toString() },
      { key: 'max_duration', value: newSettings.maxDuration.toString() },
      { key: 'max_active_bookings', value: newSettings.maxActiveBookings.toString() },
    ];

    const { error } = await supabase.from('app_settings').upsert(updates, { onConflict: 'key' });

    if (error) {
      addToast(error.message, 'error');
    } else {
      addToast('System settings updated successfully', 'success');
      setSettings(newSettings);
    }
  }, [addToast]);

  // Placeholder handlers for Admin actions
  const handleAddAmenity = React.useCallback((newAmenity: Amenity) => {
    addToast('Admin: Feature coming soon to DB', 'info');
  }, [addToast]);

  const handleDeleteAmenity = React.useCallback((id: string) => {
    addToast('Admin: Feature coming soon to DB', 'info');
  }, [addToast]);

  const handleAddUsers = React.useCallback((newUsers: Partial<User>[]) => {
    addToast('Admin: Bulk user import coming soon', 'info');
  }, [addToast]);

  const handleAnnouncement = React.useCallback((ann: Announcement) => {
    addToast('Admin: Announcements feature coming soon', 'info');
  }, [addToast]);

  const handleMarkAnnouncementRead = React.useCallback((id: string) => {
    setAnnouncements(prev => prev.map(a =>
      (currentUser && a.id === id) ? { ...a, readBy: [...a.readBy, currentUser.id] } : a
    ));
  }, [currentUser]);

  const unreadCount = React.useMemo(() =>
    currentUser ? announcements.filter(a => !a.readBy.includes(currentUser.id)).length : 0,
    [announcements, currentUser]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <>
      {!currentUser ? (
        <Auth onLogin={() => { }} />
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
              onUpdateSettings={handleUpdateSettings}
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
