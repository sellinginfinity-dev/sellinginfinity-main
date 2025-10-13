import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Get approved reviews ordered by creation date (newest first)
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, customer_name, rating, review_text, created_at, is_approved')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Get total count of approved reviews
    const { count, error: countError } = await supabase
      .from('testimonials')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true);

    if (countError) {
      console.error('Count error:', countError);
    }

    return NextResponse.json({
      reviews: data || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
