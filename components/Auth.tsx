import React, { useState } from 'react';
import { UserRole } from '../types';
import { Building, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface AuthProps {
  onLogin: () => void; // Unused now but kept for prop consistency if needed
}

const Auth: React.FC<AuthProps> = () => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleDemoLogin = async (role: UserRole) => {
    setLoading(true);
    const email = role === UserRole.ADMIN ? 'admin@lumina.com' : 'residente@lumina.com';
    const password = 'Password123!';
    const fullName = role === UserRole.ADMIN ? 'Admin User' : 'Resident User';
    const apartment = role === UserRole.ADMIN ? 'Office' : '101A';

    try {
      // Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If user not found, try to sign up
        if (signInError.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                role: role.toLowerCase(),
                apartment: apartment
              }
            }
          });

          if (signUpError) throw signUpError;
          addToast('Demo account created and logged in!', 'success');
        } else {
          throw signInError;
        }
      } else {
        addToast('Welcome back to Lumina', 'success');
      }
    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative Circle */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100 rounded-bl-full opacity-50 -mr-10 -mt-10"></div>

        <div className="mb-8">
          <div className="w-12 h-12 bg-sky-500 rounded-lg flex items-center justify-center mb-4 text-white">
            <Building size={24} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">LUMINA</h1>
          <p className="text-slate-500 mt-1">Building Management System</p>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Access Mode</p>

          <button
            disabled={loading}
            onClick={() => handleDemoLogin(UserRole.ADMIN)}
            className="w-full group flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-sky-500 hover:shadow-lg hover:shadow-sky-100 transition-all duration-300 disabled:opacity-50"
          >
            <div className="text-left">
              <p className="font-bold text-slate-800">Administrator</p>
              <p className="text-xs text-slate-400">Manage building & settings</p>
            </div>
            <div className="bg-slate-100 p-2 rounded-full group-hover:bg-sky-500 group-hover:text-white transition-colors">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
            </div>
          </button>

          <button
            disabled={loading}
            onClick={() => handleDemoLogin(UserRole.RESIDENT)}
            className="w-full group flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-green-500 hover:shadow-lg hover:shadow-green-100 transition-all duration-300 disabled:opacity-50"
          >
            <div className="text-left">
              <p className="font-bold text-slate-800">Resident</p>
              <p className="text-xs text-slate-400">Book amenities & view info</p>
            </div>
            <div className="bg-slate-100 p-2 rounded-full group-hover:bg-green-500 group-hover:text-white transition-colors">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
            </div>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 text-balance">
            Using Supabase Authentication & PostgreSQL Triggers
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
