import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { date, startTime, endTime, reason, awayStatus } = body;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }

    // Convert date and time to ISO timestamp format
    const startDateTimeLocal = `${date}T${startTime}:00`;
    const endDateTimeLocal = `${date}T${endTime}:00`;
    
    const startDateTime = new Date(startDateTimeLocal);
    const endDateTime = new Date(endDateTimeLocal);

    // Create the update data object
    const updateData = {
      title: awayStatus ? 'Away - Not Available' : (reason || 'Busy - Admin Block'),
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      description: awayStatus ? 'Admin is away/unavailable' : (reason || 'Time blocked by admin'),
      updated_at: new Date().toISOString()
    };
    
    // Only add away_status if the column exists (will be handled by a database migration later)
    // For now, we'll use the title and description to indicate away status
    console.log('Updating slot with awayStatus:', awayStatus, 'Title:', updateData.title);
    
    // Update the blocked event in calendar_events table
    const { data, error } = await supabaseAdmin
      .from('calendar_events')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating busy slot:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update busy slot' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: data[0],
      message: 'Busy slot updated successfully'
    });

  } catch (error) {
    console.error('Error in update busy slot API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }

    // Delete the blocked event from calendar_events table
    const { error } = await supabaseAdmin
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting busy slot:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete busy slot' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Busy slot deleted successfully'
    });

  } catch (error) {
    console.error('Error in delete busy slot API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
