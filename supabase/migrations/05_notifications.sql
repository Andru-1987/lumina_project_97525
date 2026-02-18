-- Migration: Setup Notification Trigger
-- Description: Creates a trigger to send emails via Edge Function on new bookings.

-- 1. Enable pg_net extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Trigger Function
CREATE OR REPLACE FUNCTION public.notify_booking_created()
RETURNS TRIGGER AS $$
DECLARE
    v_user_email TEXT;
    v_amenity_name TEXT;
    request_body JSONB;
    v_project_url TEXT := 'https://ornzvfifcmkqszxfkpc.supabase.co/functions/v1/send-email'; -- REPLACE <PROJECT_REF>
    v_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybnp2ZmlmY21rcXN6eGZrcGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNDcxMzksImV4cCI6MjA4NTgyMzEzOX0.Jg0LFrWiroRXq1_sDzgCpRcGRiDp087qBp137b0DsB4'; -- REPLACE <ANON_KEY>
BEGIN
    -- Fetch User Email (Requires SECURITY DEFINER to access auth.users)
    SELECT email INTO v_user_email FROM auth.users WHERE id = NEW.user_id;
    
    -- Fetch Amenity Name
    SELECT name INTO v_amenity_name FROM public.amenities WHERE id = NEW.amenity_id;

    IF v_user_email IS NULL THEN
        -- If testing with users not in auth table, fallback or log
        RAISE WARNING 'User email not found for ID %', NEW.user_id;
        RETURN NEW;
    END IF;

    -- Construct Payload
    request_body := jsonb_build_object(
        'to', v_user_email,
        'subject', 'Booking Confirmed: ' || COALESCE(v_amenity_name, 'Unknown Amenity'),
        'html', '<h1>Booking Confirmed</h1><p>You have successfully booked <strong>' || COALESCE(v_amenity_name, 'Amenity') || '</strong> for ' || NEW.booking_date || ' from ' || NEW.start_time || ' to ' || NEW.end_time || '.</p><p>Thank you!</p>'
    );

    -- Call Edge Function using pg_net
    -- Note: This is asynchronous and won't block the transaction
    PERFORM net.http_post(
        url := v_project_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon_key
        ),
        body := request_body
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
CREATE TRIGGER on_booking_created
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_booking_created();
