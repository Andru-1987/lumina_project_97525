-- =====================================================
-- LUMINA PROJECT - SUPABASE DATABASE SCHEMA
-- =====================================================
-- Description: Schema completo para sistema de gestión de reservas de edificios
-- Incluye: tablas con foreign keys y trigger de creación automática de profiles
-- RLS: NO ACTIVADO (se activará en siguiente fase)
-- =====================================================

-- =====================================================
-- 1. TABLA: profiles
-- =====================================================
-- Extiende auth.users con información adicional del usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'resident')),
  apartment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_apartment ON public.profiles(apartment);

-- =====================================================
-- 2. TABLA: amenities
-- =====================================================
-- Espacios comunes disponibles para reservar
CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  available_from TIME NOT NULL,
  available_to TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validación: horario de cierre debe ser posterior al de apertura
  CONSTRAINT valid_hours CHECK (available_to > available_from)
);

-- Índice para búsquedas por estado activo
CREATE INDEX IF NOT EXISTS idx_amenities_is_active ON public.amenities(is_active);

-- =====================================================
-- 3. TABLA: bookings
-- =====================================================
-- Reservas realizadas por los usuarios
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validación: hora de fin debe ser posterior a la de inicio
  CONSTRAINT valid_booking_times CHECK (end_time > start_time),
  
  -- Prevenir reservas duplicadas del mismo usuario en el mismo horario
  CONSTRAINT unique_user_booking UNIQUE (user_id, booking_date, start_time)
);

-- Índices para mejorar performance en consultas comunes
CREATE INDEX IF NOT EXISTS idx_bookings_amenity_id ON public.bookings(amenity_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_amenity_date ON public.bookings(amenity_id, booking_date);

-- =====================================================
-- 4. TABLA: announcements
-- =====================================================
-- Anuncios y comunicados para residentes
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por estado de publicación
CREATE INDEX IF NOT EXISTS idx_announcements_is_published ON public.announcements(is_published);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority);

-- =====================================================
-- 5. TABLA: app_settings
-- =====================================================
-- Configuración dinámica de la aplicación (key-value store)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO public.app_settings (key, value, description)
VALUES 
  ('min_hours_advance', '24'::jsonb, 'Horas mínimas de anticipación para reservar'),
  ('max_duration', '4'::jsonb, 'Duración máxima de una reserva en horas'),
  ('max_active_bookings', '3'::jsonb, 'Cantidad máxima de reservas activas por usuario')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 6. FUNCIÓN: handle_updated_at
-- =====================================================
-- Actualiza automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS: updated_at automático
-- =====================================================
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_amenities
  BEFORE UPDATE ON public.amenities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_bookings
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_announcements
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_app_settings
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 8. FUNCIÓN Y TRIGGER: on_auth_user_created
-- =====================================================
-- Crea automáticamente un perfil cuando se registra un usuario en Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, apartment)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'resident'),
    NEW.raw_user_meta_data->>'apartment'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en la tabla auth.users (ejecuta la función al crear usuario)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 9. HABILITAR REALTIME PARA BOOKINGS
-- =====================================================
-- Permite suscripciones en tiempo real a cambios en reservas
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- =====================================================
-- 10. COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE public.profiles IS 'Perfiles de usuario extendidos desde auth.users';
COMMENT ON TABLE public.amenities IS 'Espacios comunes disponibles para reservar';
COMMENT ON TABLE public.bookings IS 'Reservas realizadas por usuarios';
COMMENT ON TABLE public.announcements IS 'Anuncios y comunicados del edificio';
COMMENT ON TABLE public.app_settings IS 'Configuración dinámica de la aplicación';

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================
-- NOTA: RLS no está activado. Se debe habilitar en la siguiente fase.
-- Para activar RLS: ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
-- =====================================================
