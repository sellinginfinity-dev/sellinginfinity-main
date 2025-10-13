-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    years_of_experience VARCHAR(255),
    review TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT
);

-- Create index on email for quick lookups
CREATE INDEX IF NOT EXISTS idx_reviews_email ON reviews(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Create index on approved reviews for home page display
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(status, created_at DESC) WHERE status = 'approved';

-- Add RLS (Row Level Security) policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert reviews (for submission)
CREATE POLICY "Allow review submission" ON reviews
    FOR INSERT WITH CHECK (true);

-- Policy to allow reading approved reviews (for public display)
CREATE POLICY "Allow reading approved reviews" ON reviews
    FOR SELECT USING (status = 'approved');

-- Policy to allow admin to read all reviews
CREATE POLICY "Allow admin to read all reviews" ON reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@sellinginfinity.com', 'yadu@sellinginfinity.com')
        )
    );

-- Policy to allow admin to update review status
CREATE POLICY "Allow admin to update reviews" ON reviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@sellinginfinity.com', 'yadu@sellinginfinity.com')
        )
    );

-- Policy to allow admin to delete reviews
CREATE POLICY "Allow admin to delete reviews" ON reviews
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@sellinginfinity.com', 'yadu@sellinginfinity.com')
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Update approval/rejection timestamps
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

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- Insert some sample approved reviews for testing
INSERT INTO reviews (name, email, rating, years_of_experience, review, status, created_at, approved_at) VALUES
('Sarah Johnson', 'sarah.j@email.com', 5, '3 years in sales', 'This training completely transformed my sales approach. I went from struggling to close deals to consistently exceeding my targets. The techniques are practical and immediately applicable. Highly recommend to anyone serious about improving their sales skills!', 'approved', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
('Michael Chen', 'm.chen@email.com', 5, '7 years in business development', 'After taking this course, my sales increased by 150% in just 3 months. The ROI-focused approach and proven methodologies are exactly what I needed. The support team is also fantastic!', 'approved', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
('Emily Rodriguez', 'emily.r@email.com', 5, '2 years in marketing', 'I was skeptical at first, but this training delivered beyond my expectations. The step-by-step approach made complex sales strategies easy to understand and implement. My confidence and results have improved dramatically.', 'approved', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),
('David Thompson', 'david.t@email.com', 4, '5 years in sales management', 'Great training program with lots of practical insights. The only reason I''m not giving 5 stars is that some advanced topics could use more detail, but overall it''s excellent value for money.', 'approved', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days'),
('Lisa Wang', 'lisa.w@email.com', 5, '10 years in business', 'This isn''t just about sales - it''s about transforming your entire approach to business relationships. The training helped me build stronger connections with clients and close bigger deals. Worth every penny!', 'approved', NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days');
