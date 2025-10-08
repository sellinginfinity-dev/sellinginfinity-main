// Test script to verify the user booking data API endpoint

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUserBookingAPI() {
  console.log('🧪 TESTING USER BOOKING DATA API');
  console.log('==================================');
  
  try {
    // First, let's get a user ID from the database
    console.log('\n📊 Step 1: Getting a user ID from the database...');
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No users found in the database');
      return;
    }
    
    const testUser = users[0];
    console.log('✅ Found test user:', testUser.email);
    
    // Test the API endpoint
    console.log('\n📊 Step 2: Testing the API endpoint...');
    
    const response = await fetch(`http://localhost:3000/api/admin/user-booking-data?userId=${testUser.id}`);
    const result = await response.json();
    
    console.log('📋 API Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ API endpoint working correctly!');
      if (result.bookingData) {
        console.log('📅 Found booking data for user');
        console.log('   - Booking Date:', result.bookingData.booking_date);
        console.log('   - Booking Time:', result.bookingData.booking_time);
        console.log('   - Product Name:', result.bookingData.products?.name);
        console.log('   - Duration:', result.bookingData.duration_minutes);
      } else {
        console.log('ℹ️ No booking data found for this user (this is normal)');
      }
    } else {
      console.log('❌ API endpoint returned error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testUserBookingAPI();
