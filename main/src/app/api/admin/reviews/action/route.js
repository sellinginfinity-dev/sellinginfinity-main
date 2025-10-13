import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { reviewId, action, adminNotes } = body;

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: 'Review ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, reject, or delete' },
        { status: 400 }
      );
    }

    // Handle delete action
    if (action === 'delete') {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', reviewId);

      if (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
          { error: 'Failed to delete review' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Review deleted successfully'
      });
    }

    // Handle approve/reject actions
    const updateData = {
      is_approved: action === 'approve',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('testimonials')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: `Failed to ${action} review` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Review ${action}d successfully`,
      review: data
    });

  } catch (error) {
    console.error('Review action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
