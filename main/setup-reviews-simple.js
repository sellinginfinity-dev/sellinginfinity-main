#!/usr/bin/env node

// Simple Reviews System Setup Script for Selling Infinity
// Run with: node setup-reviews-simple.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('⭐ Selling Infinity Reviews System Setup (Simple)\n');

// Check if environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ Missing Supabase environment variables!');
  console.log('Please ensure .env.local contains:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY\n');
  process.exit(1);
}

async function setupReviewsSystem() {
  try {
    console.log('🚀 Setting up reviews system...\n');

    // First, let's check if the reviews table already exists
    console.log('🔍 Checking if reviews table exists...');
    const { data: existingTables, error: tableCheckError } = await supabase
      .from('reviews')
      .select('id')
      .limit(1);

    if (existingTables && !tableCheckError) {
      console.log('✅ Reviews table already exists!');
      console.log('📊 Adding sample reviews...');
      
      // Add sample reviews
      const sampleReviews = [
        {
          name: 'Sarah Johnson',
          email: 'sarah.j@email.com',
          rating: 5,
          title: 'Game-changing training!',
          review: 'This training completely transformed my sales approach. I went from struggling to close deals to consistently exceeding my targets. The techniques are practical and immediately applicable. Highly recommend to anyone serious about improving their sales skills!',
          status: 'approved'
        },
        {
          name: 'Michael Chen',
          email: 'm.chen@email.com',
          rating: 5,
          title: 'Best investment I\'ve made',
          review: 'After taking this course, my sales increased by 150% in just 3 months. The ROI-focused approach and proven methodologies are exactly what I needed. The support team is also fantastic!',
          status: 'approved'
        },
        {
          name: 'Emily Rodriguez',
          email: 'emily.r@email.com',
          rating: 5,
          title: 'Exceeded all expectations',
          review: 'I was skeptical at first, but this training delivered beyond my expectations. The step-by-step approach made complex sales strategies easy to understand and implement. My confidence and results have improved dramatically.',
          status: 'approved'
        }
      ];

      for (const review of sampleReviews) {
        const { error } = await supabase
          .from('reviews')
          .insert([{
            ...review,
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            approved_at: new Date().toISOString()
          }]);
        
        if (error) {
          console.log('⚠️  Sample review insertion result:', error.message);
        } else {
          console.log(`✅ Added sample review: ${review.title}`);
        }
      }
    } else {
      console.log('❌ Reviews table does not exist!');
      console.log('📋 You need to create the reviews table manually in your Supabase dashboard.');
      console.log('\n🔧 Manual Setup Instructions:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the following SQL:');
      console.log('\n-- Copy and paste this SQL into your Supabase SQL Editor:\n');
      
      const sqlToRun = `
-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255) NOT NULL,
    review TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_email ON reviews(email);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow review submission" ON reviews
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow reading approved reviews" ON reviews
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Allow admin to read all reviews" ON reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@sellinginfinity.com', 'yadu@sellinginfinity.com')
        )
    );

CREATE POLICY "Allow admin to update reviews" ON reviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@sellinginfinity.com', 'yadu@sellinginfinity.com')
        )
    );

CREATE POLICY "Allow admin to delete reviews" ON reviews
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@sellinginfinity.com', 'yadu@sellinginfinity.com')
        )
    );

-- Insert sample reviews
INSERT INTO reviews (name, email, rating, title, review, status, created_at, approved_at) VALUES
('Sarah Johnson', 'sarah.j@email.com', 5, 'Game-changing training!', 'This training completely transformed my sales approach. I went from struggling to close deals to consistently exceeding my targets. The techniques are practical and immediately applicable. Highly recommend to anyone serious about improving their sales skills!', 'approved', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
('Michael Chen', 'm.chen@email.com', 5, 'Best investment I''ve made', 'After taking this course, my sales increased by 150% in just 3 months. The ROI-focused approach and proven methodologies are exactly what I needed. The support team is also fantastic!', 'approved', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
('Emily Rodriguez', 'emily.r@email.com', 5, 'Exceeded all expectations', 'I was skeptical at first, but this training delivered beyond my expectations. The step-by-step approach made complex sales strategies easy to understand and implement. My confidence and results have improved dramatically.', 'approved', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days');
      `;
      
      console.log(sqlToRun);
      console.log('\n4. After running the SQL, come back and run this script again: node setup-reviews-simple.js');
      process.exit(1);
    }

    console.log('\n🎉 Reviews system setup completed successfully!\n');
    
    console.log('📋 What was created:');
    console.log('- ✅ Reviews table with proper schema');
    console.log('- ✅ Indexes for performance');
    console.log('- ✅ Row Level Security policies');
    console.log('- ✅ Sample approved reviews');
    
    console.log('\n🔗 Next steps:');
    console.log('1. Go to your download page (/download) to test the review form');
    console.log('2. Go to /admin/reviews to manage submitted reviews');
    console.log('3. Approved reviews will automatically appear on your home page');
    console.log('4. Test the system by submitting a review and then approving it');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error setting up reviews system:', error.message);
    console.log('\n🔧 If you see table errors, please:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL provided above');
    console.log('4. Then run this script again');
    process.exit(1);
  }
}

setupReviewsSystem();
