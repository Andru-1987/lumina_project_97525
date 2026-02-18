-- Fix: Force Recreation of Analytics View
-- The previous script used "IF NOT EXISTS", so it didn't update the existing broken view.

DROP MATERIALIZED VIEW IF EXISTS public.analytics_bookings_daily;

CREATE MATERIALIZED VIEW public.analytics_bookings_daily AS
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

CREATE UNIQUE INDEX ON public.analytics_bookings_daily (building_id, amenity_id, booking_date);

-- Ensure RLS (via security definer function) works by granting select to postgres/service_role if needed, 
-- but strictly speaking MVs don't support RLS directly the same way tables do. 
-- Our security comes from the `get_daily_analytics` RPC.

GRANT SELECT ON public.analytics_bookings_daily TO service_role;
