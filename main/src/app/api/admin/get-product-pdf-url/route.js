import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Try common storage paths and both signed/public URLs
    const candidatePaths = [
      `products/${productId}.pdf`,
      `${productId}.pdf`
    ];

    for (const p of candidatePaths) {
      // Try signed URL first (private bucket)
      const { data: signed, error: signedErr } = await supabaseAdmin
        .storage
        .from('product-pdfs')
        .createSignedUrl(p, 60);
      if (!signedErr && signed?.signedUrl) {
        return NextResponse.json({ url: signed.signedUrl, path: p, visibility: 'private' });
      }

      // Try public URL (public bucket)
      const { data: pub } = supabaseAdmin
        .storage
        .from('product-pdfs')
        .getPublicUrl(p);
      if (pub?.publicUrl) {
        // Do a lightweight HEAD to verify existence
        try {
          const head = await fetch(pub.publicUrl, { method: 'HEAD' });
          if (head.ok) {
            return NextResponse.json({ url: pub.publicUrl, path: p, visibility: 'public' });
          }
        } catch (_) {}
      }
    }

    return NextResponse.json({ error: 'PDF not found for this product' }, { status: 404 });
  } catch (error) {
    console.error('get-product-pdf-url error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


