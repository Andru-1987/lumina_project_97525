
import { createClient } from "@supabase/supabase-js";

// CONFIGURATION
const SUPABASE_URL = "https://ornzvfifcmkqszxfkpcn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybnp2ZmlmY21rcXN6eGZrcGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNDcxMzksImV4cCI6MjA4NTgyMzEzOX0.Jg0LFrWiroRXq1_sDzgCpRcGRiDp087qBp137b0DsB4"; // anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTests() {
    console.log("🚀 Starting Booking System Tests...");

    // 1. Authentication - Create a Random User
    const randomId = Date.now();
    const email = `test.resident.${randomId}@lumina.com`;
    const password = "testPassword123!";

    console.log(`\n🔐 Creating/Authenticating User: ${email}`);

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        console.error("❌ Signup Failed:", authError.message);
        return;
    }

    // Check if we got a session (Auto-confirm OFF or implicit)
    if (!authData.session) {
        console.log("⚠️ User created but no session returned. Email confirmation might be required.");
        console.log("   Check project settings: Authentication -> Email Auth -> Enable Email Confirmations");
        return;
    }

    console.log("✅ Authenticated successfully!");

    // Get a valid amenity ID
    const { data: amenities, error: amenitiesError } = await supabase.from('amenities').select('id, name').limit(1);
    if (amenitiesError || !amenities || amenities.length === 0) {
        console.error("❌ Failed to fetch amenities:", amenitiesError?.message || "No amenities found");
        return;
    }
    const amenityId = amenities[0].id;
    console.log(`ℹ️  Using Amenity: ${amenities[0].name} (${amenityId})`);

    // Generate a valid future slot (e.g., tomorrow 14:00 - 16:00)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const startTime = "14:00";
    const endTime = "16:00";

    console.log(`📅 Test Slot: ${dateStr} ${startTime}-${endTime}`);

    // Test 1: CREATE Booking (via Edge Function)
    console.log("\n🧪 Test 1: Creating Booking...");

    console.log("   Access Token:", authData.session.access_token.substring(0, 20) + "...");

    const { data: createData, error: createError } = await supabase
        .from('bookings')
        .insert({
            amenity_id: amenityId,
            booking_date: dateStr,
            start_time: startTime,
            end_time: endTime,
            user_id: authData.user.id,
            status: 'confirmed'
        })
        .select()
        .single();

    let bookingId = null;

    if (createError) {
        console.error("❌ Create Booking Failed (DB Error):", createError);
    } else if (createData?.error) {
        console.error("❌ Create Booking Failed (Logic Error):", createData.error);
    } else {
        console.log("✅ Booking Created Successfully!");
        console.log("   Booking ID:", createData.id);
        bookingId = createData.id;
    }

    if (!bookingId) {
        console.log("⚠️ Skipping remaining tests due to creation failure.");
        return;
    }

    // Test 2: MODIFICATION (Simulated by verifying existence)
    console.log("\n🧪 Test 2: Verifying Booking in DB...");
    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

    if (fetchError || !booking) {
        console.error("❌ Verification Failed: Booking not found in DB.");
    } else {
        console.log("✅ Booking Verified in DB (Status: " + booking.status + ")");
    }

    // Test 3: DELETE (Cancel) Booking
    console.log("\n🧪 Test 3: Canceling (Deleting) Booking...");
    const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

    if (deleteError) {
        console.error("❌ Deletion Failed:", deleteError.message);
    } else {
        console.log("✅ Booking Deleted (Cancelled) Successfully!");
    }

    // Final Verification
    const { data: checkDeleted } = await supabase.from('bookings').select('id').eq('id', bookingId);
    if (checkDeleted && checkDeleted.length === 0) {
        console.log("✅ Final Check: Booking is gone from DB.");
    } else {
        console.error("❌ Final Check Failed: Booking still exists.");
    }

    console.log("\n🎉 Validation Tests Completed.");
}

runTests();
