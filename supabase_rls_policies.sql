-- =====================================================
-- LUMINA PROJECT - ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Description: Políticas de seguridad para control de acceso granular
-- Admins: Bypass total en todas las tablas
-- Residents: Acceso limitado según reglas de negocio
-- =====================================================

-- =====================================================
-- PASO 1: ACTIVAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 2: CREAR FUNCIÓN HELPER PARA VERIFICAR ROL ADMIN
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 3: POLÍTICAS PARA LA TABLA profiles
-- =====================================================

-- Admin: Acceso total
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Resident: Solo puede ver su propio perfil
CREATE POLICY "Residents can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Resident: Solo puede actualizar su propio perfil (excepto role)
CREATE POLICY "Residents can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- =====================================================
-- PASO 4: POLÍTICAS PARA LA TABLA amenities
-- =====================================================

-- Admin: Acceso total
CREATE POLICY "Admins have full access to amenities"
  ON public.amenities
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Resident: Solo puede ver amenities activos
CREATE POLICY "Residents can view active amenities"
  ON public.amenities
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- =====================================================
-- PASO 5: POLÍTICAS PARA LA TABLA announcements
-- =====================================================

-- Admin: Acceso total
CREATE POLICY "Admins have full access to announcements"
  ON public.announcements
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Resident: Solo puede ver anuncios publicados
CREATE POLICY "Residents can view published announcements"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- =====================================================
-- PASO 6: POLÍTICAS PARA LA TABLA bookings
-- =====================================================

-- Admin: Acceso total
CREATE POLICY "Admins have full access to bookings"
  ON public.bookings
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Resident: Puede ver sus propias reservas
CREATE POLICY "Residents can view their own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Resident: Puede crear reservas (asegurando que user_id sea el suyo)
CREATE POLICY "Residents can create their own bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Resident: Puede cancelar (UPDATE status) sus propias reservas confirmadas
CREATE POLICY "Residents can cancel their own bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'confirmed')
  WITH CHECK (
    user_id = auth.uid() 
    AND status = 'cancelled'
    -- Asegurar que solo se pueda cambiar el status, no otros campos
    AND booking_date = (SELECT booking_date FROM public.bookings WHERE id = bookings.id)
    AND start_time = (SELECT start_time FROM public.bookings WHERE id = bookings.id)
    AND end_time = (SELECT end_time FROM public.bookings WHERE id = bookings.id)
    AND amenity_id = (SELECT amenity_id FROM public.bookings WHERE id = bookings.id)
  );

-- Resident: NO puede borrar reservas (sin política DELETE)
-- Los admins pueden borrar gracias a la política "Admins have full access to bookings"

-- =====================================================
-- PASO 7: POLÍTICAS PARA LA TABLA app_settings
-- =====================================================

-- Admin: Acceso total
CREATE POLICY "Admins have full access to app_settings"
  ON public.app_settings
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Resident: Solo puede leer la configuración
CREATE POLICY "All users can view app settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- PASO 8: COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.is_admin() IS 'Verifica si el usuario autenticado tiene rol de admin';

COMMENT ON POLICY "Admins have full access to profiles" ON public.profiles IS 'Admins pueden hacer cualquier operación en todos los perfiles';
COMMENT ON POLICY "Residents can view their own profile" ON public.profiles IS 'Residents solo ven su propio perfil';
COMMENT ON POLICY "Residents can update their own profile" ON public.profiles IS 'Residents pueden actualizar su perfil pero no cambiar su rol';

COMMENT ON POLICY "Admins have full access to amenities" ON public.amenities IS 'Admins pueden gestionar todas las amenidades';
COMMENT ON POLICY "Residents can view active amenities" ON public.amenities IS 'Residents solo ven amenidades activas';

COMMENT ON POLICY "Admins have full access to announcements" ON public.announcements IS 'Admins pueden gestionar todos los anuncios';
COMMENT ON POLICY "Residents can view published announcements" ON public.announcements IS 'Residents solo ven anuncios publicados';

COMMENT ON POLICY "Admins have full access to bookings" ON public.bookings IS 'Admins pueden gestionar todas las reservas';
COMMENT ON POLICY "Residents can view their own bookings" ON public.bookings IS 'Residents solo ven sus propias reservas';
COMMENT ON POLICY "Residents can create their own bookings" ON public.bookings IS 'Residents pueden crear nuevas reservas';
COMMENT ON POLICY "Residents can cancel their own bookings" ON public.bookings IS 'Residents pueden cancelar sus reservas confirmadas';

COMMENT ON POLICY "Admins have full access to app_settings" ON public.app_settings IS 'Admins pueden modificar la configuración de la app';
COMMENT ON POLICY "All users can view app settings" ON public.app_settings IS 'Todos los usuarios pueden leer la configuración';

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================
-- RESUMEN DE SEGURIDAD:
-- ✅ RLS activado en todas las tablas
-- ✅ Admins: Bypass total (ALL) en todas las tablas
-- ✅ Residents: Acceso limitado según reglas de negocio
--    - profiles: Solo ven/editan su propio perfil
--    - amenities: Solo ven amenities activos
--    - announcements: Solo ven anuncios publicados
--    - bookings: Ven/crean/cancelan solo sus reservas (NO pueden borrar)
--    - app_settings: Solo lectura
-- =====================================================
