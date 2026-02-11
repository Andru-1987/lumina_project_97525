import React, { useState } from 'react';
import { UserRole } from '../types';
import { Building, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface AuthProps {
  onLogin: () => void;
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
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
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
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-card-hover relative overflow-hidden border border-neutral-200">
        {/* Decorative gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-emerald-500 to-primary-400"></div>

        <div className="mb-8 pt-4">
          <div className="w-12 h-12 bg-primary-500 rounded-btn flex items-center justify-center mb-4 text-white shadow-btn">
            <Building size={24} />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">LUMINA</h1>
          <p className="text-neutral-500 mt-1 text-sm">Building Management System</p>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Select Access Mode</p>

          <button
            disabled={loading}
            onClick={() => handleDemoLogin(UserRole.ADMIN)}
            className="w-full group flex items-center justify-between p-4 border border-neutral-200 rounded-card hover:border-primary-400 hover:shadow-card-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-left">
              <p className="font-semibold text-neutral-900">Administrator</p>
              <p className="text-xs text-neutral-400 mt-0.5">Manage building & settings</p>
            </div>
            <div className="bg-primary-50 text-primary-500 p-2.5 rounded-full group-hover:bg-primary-500 group-hover:text-white transition-all duration-200">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
            </div>
          </button>

          <button
            disabled={loading}
            onClick={() => handleDemoLogin(UserRole.RESIDENT)}
            className="w-full group flex items-center justify-between p-4 border border-neutral-200 rounded-card hover:border-emerald-400 hover:shadow-card-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-left">
              <p className="font-semibold text-neutral-900">Resident</p>
              <p className="text-xs text-neutral-400 mt-0.5">Book amenities & view info</p>
            </div>
            <div className="bg-emerald-50 text-emerald-500 p-2.5 rounded-full group-hover:bg-emerald-500 group-hover:text-white transition-all duration-200">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
            </div>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
          <p className="text-xs text-neutral-400 text-balance">
            Using Supabase Authentication & PostgreSQL Triggers
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
