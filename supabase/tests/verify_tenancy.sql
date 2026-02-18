-- Verification Script: B2B Multi-tenancy
-- Run this in Supabase SQL Editor to verify the migration.

-- 1. Setup Test Data (Second Building)
INSERT INTO public.buildings (name, address)
VALUES ('Edificio Secundario', 'Calle Otra 456')
ON CONFLICT DO NOTHING;

-- 2. Check Schema and Data Integrity
DO $$
DECLARE
    building_a_id UUID;
    building_b_id UUID;
    null_count INTEGER;
BEGIN
    -- Get Building IDs
    SELECT id INTO building_a_id FROM public.buildings WHERE name = 'Edificio Principal' LIMIT 1;
    SELECT id INTO building_b_id FROM public.buildings WHERE name = 'Edificio Secundario' LIMIT 1;
    
    RAISE NOTICE 'Building A ID: %', building_a_id;
    RAISE NOTICE 'Building B ID: %', building_b_id;
    
    -- Check for NULL building_ids in profiles
    SELECT COUNT(*) INTO null_count FROM public.profiles WHERE building_id IS NULL;
    IF null_count > 0 THEN
        RAISE WARNING 'Found % profiles without building_id!', null_count;
    ELSE
        RAISE NOTICE '✅ All profiles have building_id.';
    END IF;

    -- Check for NULL building_ids in amenities
    SELECT COUNT(*) INTO null_count FROM public.amenities WHERE building_id IS NULL;
    IF null_count > 0 THEN
        RAISE WARNING 'Found % amenities without building_id!', null_count;
    ELSE
        RAISE NOTICE '✅ All amenities have building_id.';
    END IF;

    -- Check for NULL building_ids in bookings
    SELECT COUNT(*) INTO null_count FROM public.bookings WHERE building_id IS NULL;
    IF null_count > 0 THEN
        RAISE WARNING 'Found % bookings without building_id!', null_count;
    ELSE
        RAISE NOTICE '✅ All bookings have building_id.';
    END IF;
    
    -- Check app_settings renamed to building_settings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'building_settings') THEN
         RAISE NOTICE '✅ Table app_settings successfully renamed to building_settings.';
    ELSE
         RAISE WARNING '❌ Table building_settings NOT found (migration might have failed).';
    END IF;

END $$;
