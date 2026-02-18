import React, { useState, useMemo } from 'react';
import { UserRole } from '../types';
import { Building, ArrowRight, Loader2, Eye, EyeOff, Mail, Lock, User, DoorOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

type AuthMode = 'login' | 'signup';

interface AuthProps {
  onLogin: () => void;
}

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Débil', color: '#ef4444' };
  if (score <= 2) return { score, label: 'Regular', color: '#f97316' };
  if (score <= 3) return { score, label: 'Buena', color: '#eab308' };
  if (score <= 4) return { score, label: 'Fuerte', color: '#22c55e' };
  return { score, label: 'Muy fuerte', color: '#10b981' };
};

const Auth: React.FC<AuthProps> = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [apartment, setApartment] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { addToast } = useToast();

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ingresá un email válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        newErrors.fullName = 'El nombre es obligatorio';
      }
      if (!apartment.trim()) {
        newErrors.apartment = 'El apartamento es obligatorio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          addToast('Email o contraseña incorrectos', 'error');
        } else {
          addToast(error.message, 'error');
        }
      } else {
        addToast('¡Bienvenido de vuelta a Lumina!', 'success');
      }
    } catch (error: any) {
      addToast(error.message || 'Error de autenticación', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'resident',
            apartment: apartment.trim()
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          addToast('Este email ya está registrado. Intentá iniciar sesión.', 'error');
        } else {
          addToast(error.message, 'error');
        }
      } else {
        addToast('¡Cuenta creada exitosamente!', 'success');
      }
    } catch (error: any) {
      addToast(error.message || 'Error al crear la cuenta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mode === 'login' ? handleLogin() : handleSignup();
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors({});
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 flex items-center justify-center p-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

      <div className="ds-card w-full max-w-md relative overflow-hidden border-0 shadow-2xl rounded-2xl animate-scale-in">
        {/* Decorative gradient accents */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-sky-100 via-sky-50 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-80"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-50 to-transparent rounded-tr-full -ml-4 -mb-4 opacity-60"></div>

        {/* Header */}
        <div className="relative px-8 pt-8 pb-2">
          <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center mb-5 text-white shadow-lg shadow-sky-200/50">
            <Building size={26} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">LUMINA</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {mode === 'login' ? 'Iniciá sesión para continuar' : 'Creá tu cuenta para empezar'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative px-8 pt-4 pb-6">
          <div className="space-y-4">

            {/* ─── Signup-only fields ─── */}
            {mode === 'signup' && (
              <div className="animate-slide-up space-y-4">
                {/* Full Name */}
                <div>
                  <label className="ds-overline block mb-1.5">Nombre completo</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setErrors(prev => ({ ...prev, fullName: '' })); }}
                      placeholder="Ej: Juan Pérez"
                      className={`ds-input w-full pl-10 ${errors.fullName ? 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''}`}
                    />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>

                {/* Apartment */}
                <div>
                  <label className="ds-overline block mb-1.5">Apartamento / Unidad</label>
                  <div className="relative">
                    <DoorOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={apartment}
                      onChange={(e) => { setApartment(e.target.value); setErrors(prev => ({ ...prev, apartment: '' })); }}
                      placeholder="Ej: 101A"
                      className={`ds-input w-full pl-10 ${errors.apartment ? 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''}`}
                    />
                  </div>
                  {errors.apartment && <p className="text-red-500 text-xs mt-1">{errors.apartment}</p>}
                </div>
              </div>
            )}

            {/* ─── Shared fields ─── */}
            {/* Email */}
            <div>
              <label className="ds-overline block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                  placeholder="nombre@ejemplo.com"
                  className={`ds-input w-full pl-10 ${errors.email ? 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="ds-overline block mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                  placeholder="Mínimo 6 caracteres"
                  className={`ds-input w-full pl-10 pr-10 ${errors.password ? 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''}`}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}

              {/* Password Strength Meter (only on signup) */}
              {mode === 'signup' && password.length > 0 && (
                <div className="mt-2 animate-fade-in">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: i <= passwordStrength.score ? passwordStrength.color : '#e2e8f0'
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs mt-1 font-medium" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg w-full mt-6 group"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          {/* Toggle mode */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={switchMode}
              className="text-sm text-slate-500 hover:text-sky-600 transition-colors"
            >
              {mode === 'login' ? (
                <>¿No tenés cuenta? <span className="font-semibold text-sky-600">Registrate</span></>
              ) : (
                <>¿Ya tenés cuenta? <span className="font-semibold text-sky-600">Iniciá sesión</span></>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="relative px-8 pb-6 pt-2 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Powered by <span className="font-medium text-slate-500">Supabase</span> Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
