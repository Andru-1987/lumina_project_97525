-- Fixes for Frontend Integration
-- 1. Helper to update settings without exposing building_id to frontend
CREATE OR REPLACE FUNCTION public.update_building_setting(
    p_key TEXT,
    p_value JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_building_id UUID;
BEGIN
    v_building_id := public.get_user_building_id();
    
    -- Ensure Admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    INSERT INTO public.building_settings (building_id, key, value)
    VALUES (v_building_id, p_key, p_value)
    ON CONFLICT (building_id, key)
    DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

    RETURN p_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
