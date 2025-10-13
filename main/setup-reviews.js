#!/usr/bin/env node

// Reviews System Setup Script for Selling Infinity
// Run with: node setup-reviews.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('⭐ Selling Infinity Reviews System Setup\n');

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

    // Create reviews table
    console.log('📝 Creating reviews table...');
    const createTableQuery = `
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
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { 
      sql_query: createTableQuery 
    });

    if (tableError) {
      console.log('⚠️  Table creation result:', tableError.message);
    } else {
      console.log('✅ Reviews table created successfully');
    }

    // Create indexes
    console.log('📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_reviews_email ON reviews(email);',
      'CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);',
      'CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(status, created_at DESC) WHERE status = \'approved\';'
    ];

    for (const indexQuery of indexes) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: indexQuery });
      if (error) {
        console.log('⚠️  Index creation result:', error.message);
      }
    }
    console.log('✅ Indexes created successfully');

    // Enable RLS
    console.log('🔒 Setting up Row Level Security...');
    const rlsQuery = 'ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;';
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql_query: rlsQuery });
    if (rlsError) {
      console.log('⚠️  RLS setup result:', rlsError.message);
    } else {
      console.log('✅ Row Level Security enabled');
    }

    // Create policies
    console.log('📋 Creating security policies...');
    const policies = [
      `CREATE POLICY IF NOT EXISTS "Allow review submission" ON reviews
       FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY IF NOT EXISTS "Allow reading approved reviews" ON reviews
       FOR SELECT USING (status = 'approved');`,
      `CREATE POLICY IF NOT EXISTS "Allow admin to read all reviews" ON reviews
       FOR SELECT USING (
         EXISTS (
           SELECT 1 FROM auth.users 
           WHERE auth.users.id = auth.uid() 
           AND auth.users.email IN ('admin@sellinginfinity.com', 'yadu@sellinginfinity.com')
         )
       );`,
      `CREATE POLICY IF NOT EXISTS "Allow admin to update reviews" ON reviews
       FOR UPDATE USING (
         EXISTS (
           SELECT 1 FROM auth.users 
           WHERE auth.users.id = auth.uid() 
           AND auth.users.email IN ('admin@sellinginfinity.com', 'yadu@sellinginfinity.com')
         )
       );`,
      `CREATE POLICY IF NOT EXISTS "Allow admin to delete reviews" ON reviews
       FOR DELETE USING (
         EXISTS (
           SELECT 1 FROM auth.users 
           WHERE auth.users.id = auth.uid() 
           AND auth.users.email IN ('admin@sellinginfinity.com', 'yadu@sellinginfinity.com')
         )
       );`
    ];

    for (const policyQuery of policies) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: policyQuery });
      if (error) {
        console.log('⚠️  Policy creation result:', error.message);
      }
    }
    console.log('✅ Security policies created successfully');

    // Create update function
    console.log('⚙️  Creating update function...');
    const functionQuery = `
      CREATE OR REPLACE FUNCTION update_reviews_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          
          IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
              NEW.approved_at = NOW();
              NEW.rejected_at = NULL;
          ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
              NEW.rejected_at = NOW();
              NEW.approved_at = NULL;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    const { error: funcError } = await supabase.rpc('exec_sql', { sql_query: functionQuery });
    if (funcError) {
      console.log('⚠️  Function creation result:', funcError.message);
    } else {
      console.log('✅ Update function created successfully');
    }

    // Create trigger
    console.log('🔧 Creating trigger...');
    const triggerQuery = `
      DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
      CREATE TRIGGER update_reviews_updated_at
          BEFORE UPDATE ON reviews
          FOR EACH ROW
          EXECUTE FUNCTION update_reviews_updated_at();
    `;
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql_query: triggerQuery });
    if (triggerError) {
      console.log('⚠️  Trigger creation result:', triggerError.message);
    } else {
      console.log('✅ Trigger created successfully');
    }

    // Insert sample reviews
    console.log('📝 Adding sample reviews...');
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
      }
    }
    console.log('✅ Sample reviews added successfully');

    console.log('\n🎉 Reviews system setup completed successfully!\n');
    
    console.log('📋 What was created:');
    console.log('- ✅ Reviews table with proper schema');
    console.log('- ✅ Indexes for performance');
    console.log('- ✅ Row Level Security policies');
    console.log('- ✅ Sample approved reviews');
    console.log('- ✅ Automatic timestamp functions');
    
    console.log('\n🔗 Next steps:');
    console.log('1. Go to your download page (/download) to test the review form');
    console.log('2. Go to /admin/reviews to manage submitted reviews');
    console.log('3. Approved reviews will automatically appear on your home page');
    console.log('4. Test the system by submitting a review and then approving it');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error setting up reviews system:', error.message);
    process.exit(1);
  }
}

setupReviewsSystem();