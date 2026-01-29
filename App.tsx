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
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        await getProfile(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        getProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setProfile(data as Profile);
        setCurrentPage(data.role === UserRole.ADMIN ? 'admin-dashboard' : 'resident-dashboard');
      } else {
        // Handle case where profile is not found
        // Could redirect to a profile creation page
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Handle error appropriately
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setCurrentPage('auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Building size={48} className="text-sky-500 animate-pulse"/>
        <p className="mt-4 text-lg">Loading LUMINA...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (!profile) {
    // This could be a profile creation screen or a more robust error/retry screen
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
          <p>No profile found. Please contact support.</p>
        </div>
    );
  }

  return (
    <Layout 
        user={profile} 
        onLogout={handleLogout} 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        unreadNotifications={0} // Will be implemented later
    >
      {profile.role === UserRole.ADMIN ? (
        <AdminDashboard page={currentPage} />
      ) : (
        <ResidentDashboard page={currentPage} user={profile}/>
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