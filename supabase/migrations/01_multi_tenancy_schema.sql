-- Migration: Multi-tenancy (B2B) Setup
-- Description: Adds buildings table, links other tables to it, and updates RLS.

-- 1. Create buildings table
CREATE TABLE IF NOT EXISTS public.buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert default building (Crucial for migration of existing data)
INSERT INTO public.buildings (name, address)
VALUES ('Edificio Principal', 'Calle Principal 123')
ON CONFLICT DO NOTHING;

-- 3. Add building_id to tables and migrate data
DO $$
DECLARE
    default_building_id UUID;
BEGIN
    SELECT id INTO default_building_id FROM public.buildings LIMIT 1;

    -- Profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'building_id') THEN
        ALTER TABLE public.profiles ADD COLUMN building_id UUID REFERENCES public.buildings(id);
        UPDATE public.profiles SET building_id = default_building_id WHERE building_id IS NULL;
        ALTER TABLE public.profiles ALTER COLUMN building_id SET NOT NULL;
    END IF;

    -- Amenities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amenities' AND column_name = 'building_id') THEN
        ALTER TABLE public.amenities ADD COLUMN building_id UUID REFERENCES public.buildings(id);
        UPDATE public.amenities SET building_id = default_building_id WHERE building_id IS NULL;
        ALTER TABLE public.amenities ALTER COLUMN building_id SET NOT NULL;
    END IF;

    -- Announcements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'building_id') THEN
        ALTER TABLE public.announcements ADD COLUMN building_id UUID REFERENCES public.buildings(id);
        UPDATE public.announcements SET building_id = default_building_id WHERE building_id IS NULL;
        ALTER TABLE public.announcements ALTER COLUMN building_id SET NOT NULL;
    END IF;

    -- Bookings (Denormalized building_id for RLS performance)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'building_id') THEN
        ALTER TABLE public.bookings ADD COLUMN building_id UUID REFERENCES public.buildings(id);
        UPDATE public.bookings SET building_id = default_building_id WHERE building_id IS NULL;
        ALTER TABLE public.bookings ALTER COLUMN building_id SET NOT NULL;
    END IF;
END $$;

-- 4. Migrate app_settings to building_settings
DO $$
DECLARE
    default_building_id UUID;
BEGIN
    SELECT id INTO default_building_id FROM public.buildings LIMIT 1;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_settings') THEN
        ALTER TABLE public.app_settings RENAME TO building_settings;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'building_settings' AND column_name = 'building_id') THEN
        ALTER TABLE public.building_settings ADD COLUMN building_id UUID REFERENCES public.buildings(id);
        UPDATE public.building_settings SET building_id = default_building_id WHERE building_id IS NULL;
        ALTER TABLE public.building_settings ALTER COLUMN building_id SET NOT NULL;
        
        -- Update PK to be Composite (building_id, key)
        ALTER TABLE public.building_settings DROP CONSTRAINT app_settings_pkey;
        ALTER TABLE public.building_settings ADD PRIMARY KEY (building_id, key);
    END IF;
END $$;

-- 5. Helper Function for RLS
CREATE OR REPLACE FUNCTION public.get_user_building_id()
RETURNS UUID AS $$
    SELECT building_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. Update Trigger for New Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_b_id UUID;
BEGIN
    -- Assign to the first building found (In real app, this should come from invite or metadata)
    SELECT id INTO default_b_id FROM public.buildings ORDER BY created_at ASC LIMIT 1;

    INSERT INTO public.profiles (id, full_name, role, apartment, building_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'resident'),
        NEW.raw_user_meta_data->>'apartment',
        default_b_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. RLS POLICIES (Multi-tenant enforced)

-- Enable RLS on buildings
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

-- Buildings Policies
DROP POLICY IF EXISTS "Admins can see their building" ON public.buildings;
CREATE POLICY "Admins can see their building" ON public.buildings
    FOR SELECT
    USING (id = public.get_user_building_id() OR public.is_admin());

-- Profiles Policies (Update)
DROP POLICY IF EXISTS "Residents can view their own profile" ON public.profiles;
CREATE POLICY "Residents can view profiles in their building" ON public.profiles
    FOR SELECT
    USING (building_id = public.get_user_building_id());

DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles in their building" ON public.profiles
    FOR ALL
    USING (building_id = public.get_user_building_id() AND public.is_admin());

-- Amenities Policies
DROP POLICY IF EXISTS "Residents can view active amenities" ON public.amenities;
CREATE POLICY "Residents can view active amenities in their building" ON public.amenities
    FOR SELECT
    USING (building_id = public.get_user_building_id() AND is_active = true);

DROP POLICY IF EXISTS "Admins have full access to amenities" ON public.amenities;
CREATE POLICY "Admins have full access to amenities in their building" ON public.amenities
    FOR ALL
    USING (building_id = public.get_user_building_id() AND public.is_admin());

-- Bookings Policies
DROP POLICY IF EXISTS "Residents can view their own bookings" ON public.bookings;
CREATE POLICY "Residents can view their own bookings" ON public.bookings
    FOR SELECT
    USING (auth.uid() = user_id); 

DROP POLICY IF EXISTS "Residents can create their own bookings" ON public.bookings;
CREATE POLICY "Residents can create their own bookings in their building" ON public.bookings
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND building_id = public.get_user_building_id() 
        AND building_id = (SELECT building_id FROM public.amenities WHERE id = amenity_id)
    );

DROP POLICY IF EXISTS "Admins have full access to bookings" ON public.bookings;
CREATE POLICY "Admins have full access to bookings in their building" ON public.bookings
    FOR ALL
    USING (building_id = public.get_user_building_id() AND public.is_admin());

-- Announcements Policies
DROP POLICY IF EXISTS "Residents can view published announcements" ON public.announcements;
CREATE POLICY "Residents can view published announcements in their building" ON public.announcements
    FOR SELECT
    USING (building_id = public.get_user_building_id() AND is_published = true);

DROP POLICY IF EXISTS "Admins have full access to announcements" ON public.announcements;
CREATE POLICY "Admins have full access to announcements in their building" ON public.announcements
    FOR ALL
    USING (building_id = public.get_user_building_id() AND public.is_admin());

-- Building Settings Policies
DROP POLICY IF EXISTS "All users can view app settings" ON public.building_settings;
CREATE POLICY "All users can view settings for their building" ON public.building_settings
    FOR SELECT
    USING (building_id = public.get_user_building_id());

DROP POLICY IF EXISTS "Admins have full access to app_settings" ON public.building_settings;
-- Note: Dropping old policy name might fail if table name changed, but new policy is needed.
CREATE POLICY "Admins have full access to settings in their building" ON public.building_settings
    FOR ALL
    USING (building_id = public.get_user_building_id() AND public.is_admin());

