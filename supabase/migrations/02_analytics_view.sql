-- Migration: Analytics (Materialized View)
-- Description: Creates a materialized view for daily booking statistics per building/amenity.

-- 1. Create Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS public.analytics_bookings_daily AS
SELECT
    b.building_id,
    b.amenity_id,
    a.name AS amenity_name,
    b.booking_date,
    COUNT(*) AS total_bookings,
    COUNT(*) FILTER (WHERE b.status = 'cancelled') AS cancelled_bookings,
    SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600)::DOUBLE PRECISION AS utilization_hours    
FROM
    public.bookings b
JOIN
    public.amenities a ON b.amenity_id = a.id
GROUP BY
    b.building_id,
    b.amenity_id,
    a.name,
    b.booking_date;

-- 2. Create Index for Performance
CREATE INDEX IF NOT EXISTS idx_analytics_building_date ON public.analytics_bookings_daily(building_id, booking_date);

-- 3. Function to Refresh Analytics (Can be called via Cron or Trigger)
CREATE OR REPLACE FUNCTION public.refresh_analytics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.analytics_bookings_daily;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Secure Accessor Function (Because RLS on MVs is tricky)
-- This function ensures users only see analytics for THEIR building
CREATE OR REPLACE FUNCTION public.get_daily_analytics(
    start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    amenity_name TEXT,
    booking_date DATE,
    total_bookings BIGINT,
    cancelled_bookings BIGINT,
    utilization_hours DOUBLE PRECISION
) AS $$
BEGIN
    -- Check if user is admin (optional, depending on requirements, strict B2B usually implies only admins see analytics)
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only Admins can view analytics.';
    END IF;

    RETURN QUERY
    SELECT
        mv.amenity_name,
        mv.booking_date,
        mv.total_bookings,
        mv.cancelled_bookings,
        mv.utilization_hours
    FROM
        public.analytics_bookings_daily mv
    WHERE
        mv.building_id = public.get_user_building_id()
        AND mv.booking_date BETWEEN start_date AND end_date
    ORDER BY
        mv.booking_date DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
