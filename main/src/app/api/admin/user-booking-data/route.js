import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Get user's most recent booking with product information
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        duration_minutes,
        status,
        created_at,
        products!inner(
          name,
          description
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .order('booking_date', { ascending: false })
      .limit(1)
      .single();

    if (bookingError && bookingError.code !== 'PGRST116') {
      console.error('Error fetching user booking:', bookingError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch booking data' 
      }, { status: 500 });
    }

    // If no confirmed booking found, try to get any recent booking
    if (!booking) {
      const { data: anyBooking, error: anyBookingError } = await supabaseAdmin
        .from('bookings')
        .select(`
          id,
          booking_date,
          booking_time,
          duration_minutes,
          status,
          created_at,
          products!inner(
            name,
            description
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (anyBookingError && anyBookingError.code !== 'PGRST116') {
        console.error('Error fetching any user booking:', anyBookingError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch booking data' 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        bookingData: anyBooking || null,
        message: anyBooking ? 'Found recent booking' : 'No bookings found for this user'
      });
    }

    return NextResponse.json({ 
      success: true, 
      bookingData: booking,
      message: 'Found confirmed booking'
    });

  } catch (error) {
    console.error('Error in user booking data API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

