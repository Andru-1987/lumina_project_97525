-- Verification Script: Analytics & Settings Fixes
-- Run this in Supabase SQL Editor.

DO $$
DECLARE
    v_building_id UUID;
    v_amenity_id UUID;
    v_user_id UUID;
    v_analytics_count INTEGER;
    v_setting_val JSONB;
BEGIN
    -- 1. Setup Context (Get ID of first building/user/amenity)
    SELECT id INTO v_building_id FROM public.buildings LIMIT 1;
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    SELECT id INTO v_amenity_id FROM public.amenities WHERE building_id = v_building_id LIMIT 1;

    IF v_building_id IS NULL OR v_user_id IS NULL THEN
        RAISE NOTICE '⚠️ Skipping tests: Missing building or user data.';
        RETURN;
    END IF;

    -- 2. Test Analytics View (Fix for Type Mismatch)
    RAISE NOTICE '🧪 Testing Analytics View...';
    
    -- Insert a dummy booking
    INSERT INTO public.bookings (amenity_id, user_id, booking_date, start_time, end_time, status, building_id)
    VALUES (v_amenity_id, v_user_id, CURRENT_DATE, '10:00', '12:00', 'confirmed', v_building_id)
    ON CONFLICT DO NOTHING;

    -- Refresh View
    PERFORM public.refresh_analytics();

    -- Query via secure function (This triggers the type check)
    -- We select into variables to ensure the query actually executes and maps types
    SELECT COUNT(*) INTO v_analytics_count FROM public.get_daily_analytics(CURRENT_DATE, CURRENT_DATE);
    
    RAISE NOTICE '✅ Analytics Query Successful. Rows found: %', v_analytics_count;


    -- 3. Test Settings Update (Fix for Frontend)
    RAISE NOTICE '🧪 Testing Settings Update...';
    
    -- Call the RPC function
    PERFORM public.update_building_setting('min_hours_advance', '12'::jsonb);

    -- Verify update
    SELECT value INTO v_setting_val 
    FROM public.building_settings 
    WHERE building_id = v_building_id AND key = 'min_hours_advance';

    IF v_setting_val = '12'::jsonb THEN
        RAISE NOTICE '✅ Settings Update Successful.';
    ELSE
        RAISE WARNING '❌ Settings Update Failed. Value: %', v_setting_val;
    END IF;

END $$;
