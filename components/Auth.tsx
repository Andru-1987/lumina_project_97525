import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Building, ArrowRight, Mail } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }

      addToast('Check your email for the login link!', 'success');
      setEmail('');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100 rounded-bl-full opacity-50 -mr-10 -mt-10"></div>
        
        <div className="mb-8">
          <div className="w-12 h-12 bg-sky-500 rounded-lg flex items-center justify-center mb-4 text-white">
            <Building size={24} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">LUMINA</h1>
          <p className="text-slate-500 mt-1">Building Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition-colors"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full group flex items-center justify-center p-4 border border-transparent rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform"/>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">Powered by Lumina Tech © 2024</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
