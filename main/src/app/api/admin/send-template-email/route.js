import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...corsHeaders, 'Access-Control-Max-Age': '86400' } });
}

export async function POST(request) {
  try {
    const { to, subject, html, templateName, provider } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Prefer Resend automatically if available unless explicitly forcing SMTP
    const smtpAvailable = !!(process.env.SMTP_HOST || (process.env.EMAIL_USER && process.env.EMAIL_PASS));
    const useSmtp = provider === 'smtp' && smtpAvailable;

    if (process.env.RESEND_API_KEY && !useSmtp) {
      try {
        const apiRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'onboarding@resend.dev',
            to: Array.isArray(to) ? to : [to],
            subject,
            html
          })
        });

        const data = await apiRes.json();
        if (!apiRes.ok) {
          const msg = data?.message || 'Failed to send email via Resend';
          return NextResponse.json({ success: false, error: msg, provider: 'resend' }, { status: apiRes.status || 500, headers: corsHeaders });
        }

        return NextResponse.json({ success: true, messageId: data?.id || 'resend', provider: 'resend', templateName }, { headers: corsHeaders });
      } catch (e) {
        console.error('Resend API error:', e);
        return NextResponse.json({ success: false, error: e.message || 'Resend API error', provider: 'resend' }, { status: 500, headers: corsHeaders });
      }
    }

    // If we reached here, either SMTP was forced or Resend is unavailable
    if (!smtpAvailable) {
      const hosted = !!process.env.VERCEL;
      const msg = hosted
        ? 'Email service not configured for production. SMTP is often blocked on hosting providers. Set RESEND_API_KEY (recommended) or EMAIL_USER/EMAIL_PASS.'
        : 'Email service not configured. Please add EMAIL_USER and EMAIL_PASS to environment variables.';
      console.error('Email configuration missing');
      return NextResponse.json(
        { success: false, error: msg, provider: 'smtp' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Create Nodemailer transporter (supports custom SMTP or Gmail)
    let transporter;
    if (process.env.SMTP_HOST) {
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_USER,
          pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
        },
        tls: {
          // Disable strict TLS validation to prevent Render certificate issues
          rejectUnauthorized: false
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
      });
    } else {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS, // App Password
        },
        tls: {
          // Disable strict TLS validation for Gmail transport on some hosts
          rejectUnauthorized: false
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
      });
    }

    // Verify connection with a timeout to avoid hanging in production
    try {
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP verification timeout')), 15000));
      await Promise.race([verifyPromise, timeoutPromise]);
    } catch (verifyError) {
      console.error('SMTP connection verification failed:', verifyError);
      return NextResponse.json(
        { success: false, error: 'Email service connection failed or timed out. Consider using RESEND_API_KEY in production.', provider: 'smtp', code: verifyError?.code || 'VERIFY_FAILED' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Send email using Nodemailer with timeout protection
    const sendPromise = transporter.sendMail({
      from: `"Selling Infinity" <${process.env.EMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP send timeout')), 20000));
    const info = await Promise.race([sendPromise, timeoutPromise]);

    console.log(`Template email sent: ${templateName} to ${to}`, info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      templateName,
      provider: 'smtp'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error sending template email:', error);
    
    // Provide helpful error messages
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your Gmail App Password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Please check your internet connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage, provider: 'smtp' },
      { status: 500, headers: corsHeaders }
    );
  }
}
