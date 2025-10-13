import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Map status to testimonials approval (only if provided)
    const isApproved = status === 'approved' ? true : status === 'pending' ? false : null;

    let query = supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (status !== null && status !== undefined && isApproved !== null) {
      query = query.eq('is_approved', isApproved);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch testimonials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reviews: data || [],
      status
    });

  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}