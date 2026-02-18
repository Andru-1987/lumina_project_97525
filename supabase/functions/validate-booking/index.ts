import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Get User from Auth Header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        // Initialize Admin Client (Service Role) to bypass RLS for checks
        // WE NEED THIS to check for overlaps across ALL users
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Verify the user using the token
        // We pass the token to getUser to ensure it's valid and get the user ID
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (userError || !user) {
            throw new Error('Invalid or expired token');
        }

        // Parse request body
        const { amenity_id, date, start_time, end_time } = await req.json();

        if (!amenity_id || !date || !start_time || !end_time) {
            throw new Error('Missing required fields: amenity_id, date, start_time, end_time');
        }

        console.log(`Validating booking for User ${user.id} on ${date} ${start_time}-${end_time}`);

        // 2. Fetch Building ID and Settings
        // First, get the building_id for the amenity
        const { data: amenityData, error: amenityError } = await supabaseAdmin
            .from('amenities')
            .select('building_id')
            .eq('id', amenity_id)
            .single();

        if (amenityError || !amenityData) {
            console.error('Amenity fetch error:', amenityError);
            throw new Error('Invalid amenity');
        }

        const buildingId = amenityData.building_id;

        // Now fetch settings for this building
        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('building_settings')
            .select('key, value')
            .eq('building_id', buildingId);

        if (settingsError) {
            console.error('Settings error:', settingsError);
            throw new Error('Failed to fetch building configuration');
        }

        // Convert settings array to object for easier access
        const config: Record<string, any> = {};
        settings.forEach(item => {
            config[item.key] = item.value;
        });

        const minHoursAdvance = Number(config['min_hours_advance']) || 24;
        const maxDuration = Number(config['max_duration']) || 4;
        const maxActiveBookings = Number(config['max_active_bookings']) || 3;

        // 3. Validation Logic

        const now = new Date();
        // Validate date format (simple check)
        const bookingStart = new Date(`${date}T${start_time}`);
        const bookingEnd = new Date(`${date}T${end_time}`);

        if (isNaN(bookingStart.getTime()) || isNaN(bookingEnd.getTime())) {
            throw new Error('Invalid booking date or time format');
        }

        // 3a. Check End Time > Start Time
        if (bookingEnd <= bookingStart) {
            throw new Error('End time must be after start time');
        }

        // 3b. Check Max Duration
        const durationMs = bookingEnd.getTime() - bookingStart.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);

        if (durationHours > maxDuration) {
            throw new Error(`Booking duration (${durationHours.toFixed(1)}h) exceeds the maximum allowed of ${maxDuration} hours`);
        }

        // 3c. Check Minimum Anticipation
        const msUntilStart = bookingStart.getTime() - now.getTime();
        const hoursUntilStart = msUntilStart / (1000 * 60 * 60);

        if (hoursUntilStart < minHoursAdvance) {
            throw new Error(`Bookings must be made at least ${minHoursAdvance} hours in advance. You are trying to book with ${hoursUntilStart.toFixed(1)} hours notice.`);
        }

        // 3d. Check Max Active Bookings (Bonus validation based on blueprint)
        // Count active (future) bookings for this user
        const { count: activeBookingsCount, error: countError } = await supabaseAdmin
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'confirmed')
            .gte('booking_date', now.toISOString().split('T')[0]); // Bookings from today onwards roughly

        if (!countError && activeBookingsCount !== null && activeBookingsCount >= maxActiveBookings) {
            // Check if we are strictly calculating "active" correctly. 
            // For simplicity, let's assume any confirmed future booking counts.
            // Only block if we strictly want to enforce this now. The prompt asked specifically for min_hours and max_duration.
            // I'll leave this grounded but uncommented to enforce it as it's in the settings.
            throw new Error(`You have reached the maximum of ${maxActiveBookings} active bookings.`);
        }

        // 4. Overlap Check (The Critical Part)
        // Must check against database for ANY confirmed booking on that amenity
        // Overlap formula: (StartA < EndB) and (EndA > StartB)

        // We filter by amenity and date to reduce search space
        // Note: This assumes bookings don't span across midnight for now, as per simple time fields.
        const { data: overlaps, error: overlapError } = await supabaseAdmin
            .from('bookings')
            .select('id')
            .eq('amenity_id', amenity_id)
            .eq('booking_date', date)
            .eq('status', 'confirmed')
            .lt('start_time', end_time)
            .gt('end_time', start_time);

        if (overlapError) {
            console.error('Overlap check error:', overlapError);
            throw new Error('Failed to verify schedule availability');
        }

        if (overlaps && overlaps.length > 0) {
            throw new Error('This time slot overlaps with an existing reservation.');
        }

        // 5. Insert Booking
        // We use the admin client to insert, but explicitly set the user_id
        const { data: newBooking, error: insertError } = await supabaseAdmin
            .from('bookings')
            .insert({
                amenity_id,
                user_id: user.id,
                building_id: buildingId,
                booking_date: date,
                start_time,
                end_time,
                status: 'confirmed'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            throw new Error('Failed to create booking: ' + insertError.message);
        }

        // Success response
        return new Response(
            JSON.stringify(newBooking),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error) {
        console.error('Validate-booking error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        );
    }
});
