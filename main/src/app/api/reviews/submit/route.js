import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, rating, review, yearsOfExperience } = body;

    // Validate required fields
    if (!name || !email || !rating || !review) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Optional duplicate guard: same person and same content
    const { data: existingTestimonial } = await supabase
      .from('testimonials')
      .select('id')
      .eq('customer_name', name)
      .eq('review_text', review)
      .maybeSingle();

    if (existingTestimonial) {
      return NextResponse.json(
        { error: 'You have already submitted this testimonial. Thank you!' },
        { status: 400 }
      );
    }

    // Insert into existing testimonials table (pending approval)
    const { data, error } = await supabase
      .from('testimonials')
      .insert([
        {
          customer_name: name,
          review_text: review,
          rating,
          position: null,
          company: null,
          image_url: null,
          is_approved: false,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to submit review. Please try again.' },
        { status: 500 }
      );
    }

    // Send notification to admin (optional - you can implement this later)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-admin-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'new_testimonial',
          message: `New testimonial submitted by ${name}`,
          data: {
            reviewId: data.id,
            name,
            rating,
            review
          }
        }),
      });
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      message: 'Testimonial submitted successfully',
      reviewId: data.id
    });

  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
