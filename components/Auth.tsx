import React, { useState } from 'react';
import { UserRole } from '../types';
import { Building, ArrowRight, Loader2, Shield, Home } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 flex items-center justify-center p-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

      <div className="ds-card w-full max-w-md p-8 relative overflow-hidden border-0 shadow-2xl rounded-2xl animate-scale-in">
        {/* Decorative gradient accent */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-sky-100 via-sky-50 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-80"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-50 to-transparent rounded-tr-full -ml-4 -mb-4 opacity-60"></div>

        <div className="relative mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center mb-5 text-white shadow-lg shadow-sky-200/50">
            <Building size={26} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">LUMINA</h1>
          <p className="text-slate-400 mt-1 text-sm">Building Management System</p>
        </div>

        <div className="relative space-y-3">
          <p className="ds-overline mb-3">Select Access Mode</p>

          <button
            disabled={loading}
            onClick={() => handleDemoLogin(UserRole.ADMIN)}
            className="w-full group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-sky-300 hover:shadow-card-hover transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                <Shield size={20} strokeWidth={1.5} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-800 text-sm">Administrator</p>
                <p className="text-xs text-slate-400 mt-0.5">Manage building & settings</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
            </div>
          </button>

          <button
            disabled={loading}
            onClick={() => handleDemoLogin(UserRole.RESIDENT)}
            className="w-full group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 hover:shadow-card-hover transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <Home size={20} strokeWidth={1.5} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-800 text-sm">Resident</p>
                <p className="text-xs text-slate-400 mt-0.5">Book amenities & view info</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
            </div>
          </button>
        </div>

        <div className="relative mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Powered by <span className="font-medium text-slate-500">Supabase</span> Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
