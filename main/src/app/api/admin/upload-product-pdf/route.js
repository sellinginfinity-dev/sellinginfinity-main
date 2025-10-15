import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for server-side storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const formData = await request.formData();
    const productId = formData.get('productId');
    const file = formData.get('file');

    if (!productId || !file) {
      return NextResponse.json({ error: 'productId and file are required' }, { status: 400 });
    }

    const filename = (file.name || '').toLowerCase();
    const isPdfMime = file.type === 'application/pdf';
    const isPdfName = filename.endsWith('.pdf');
    if (!isPdfMime && !isPdfName) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const storagePath = `products/${productId}.pdf`;

    // Ensure bucket exists; create if missing
    try {
      const { data: bucketInfo } = await supabaseAdmin.storage.getBucket('product-pdfs');
      if (!bucketInfo) {
        await supabaseAdmin.storage.createBucket('product-pdfs', { public: false });
      }
    } catch (_) {
      // ignore; upload will surface any real errors
    }

    // Upload with upsert to replace existing file
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('product-pdfs')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message || 'Failed to upload PDF' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in upload-product-pdf:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


