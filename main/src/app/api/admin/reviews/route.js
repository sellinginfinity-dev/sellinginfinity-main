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

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, content, rating = 5, position = null, company = null, image_url = null } = body || {};

    if (!name || !content) {
      return NextResponse.json({ success: false, error: 'Name and content are required' }, { status: 400 });
    }

    const insertPayload = {
      customer_name: name,
      review_text: content,
      rating: Number(rating) || 5,
      position,
      company,
      image_url,
      is_approved: false,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('testimonials')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error('Insert testimonial error:', error);
      return NextResponse.json({ success: false, error: 'Failed to add testimonial' }, { status: 500 });
    }

    return NextResponse.json({ success: true, testimonial: data });

  } catch (error) {
    console.error('Error in admin testimonials POST:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}