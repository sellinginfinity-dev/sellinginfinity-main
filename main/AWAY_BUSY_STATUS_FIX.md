# 🚫 Away & Busy Status Fix Guide

## ❌ Current Issue
The `away_status` column is missing from the `calendar_events` table, causing errors when trying to create busy slots with away status.

## ✅ Solution Steps

### Step 1: Add the Missing Database Column

1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **Run this SQL command:**

```sql
-- Add away_status column to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN away_status BOOLEAN DEFAULT FALSE;

-- Add a comment to explain the column
COMMENT ON COLUMN calendar_events.away_status IS 'Indicates if the admin is away (true) or just busy (false)';

-- Update existing records to have away_status = false by default
UPDATE calendar_events 
SET away_status = FALSE 
WHERE away_status IS NULL;
```

### Step 2: Verify the Column Was Added

After running the SQL, check that the `calendar_events` table now has the `away_status` column:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'calendar_events' 
ORDER BY ordinal_position;
```

You should see `away_status` listed as a `boolean` column.

## 🎯 How Away & Busy Status Works

### Busy Status (away_status = false)
- **Purpose:** Admin is busy but still available for urgent matters
- **Title:** "Busy - Admin Block" or custom reason
- **Description:** Custom reason or "Time blocked by admin"
- **Visual:** Red badge with "Busy" text

### Away Status (away_status = true)
- **Purpose:** Admin is completely unavailable (vacation, sick, etc.)
- **Title:** "Away - Not Available"
- **Description:** "Admin is away/unavailable"
- **Visual:** Blue badge with "🚫 Away" text

## 🔧 Features Available

### 1. Calendar Management
- **Mark as Busy:** Block time slots with custom reasons
- **Mark as Away:** Set away status for complete unavailability
- **Edit Slots:** Modify existing busy/away slots
- **Delete Slots:** Remove busy/away blocks

### 2. Visual Indicators
- **Busy Slots:** Red styling with "Busy" badge
- **Away Slots:** Blue styling with "🚫 Away" badge
- **Clear Distinction:** Different colors and icons

### 3. Booking Prevention
- **Busy Slots:** Prevent new bookings during busy times
- **Away Slots:** Prevent new bookings during away periods
- **Clear Messaging:** Users see why time is unavailable

## 🚀 After Adding the Column

Once you've added the `away_status` column to your database:

1. **Restart your Next.js server** (`npm run dev`)
2. **Go to Admin Dashboard → Calendar Management**
3. **Test creating busy slots:**
   - Uncheck "Away Status" → Creates busy slot
   - Check "Away Status" → Creates away slot
4. **Verify the slots appear correctly** with proper styling

## 🎉 Expected Results

After the fix:
- ✅ No more "away_status column not found" errors
- ✅ Busy slots work with custom reasons
- ✅ Away slots work for complete unavailability
- ✅ Visual distinction between busy and away
- ✅ Proper booking prevention
- ✅ Edit and delete functionality works

## 🔍 Troubleshooting

If you still get errors after adding the column:

1. **Check column exists:**
   ```sql
   SELECT * FROM calendar_events LIMIT 1;
   ```

2. **Restart your development server:**
   ```bash
   npm run dev
   ```

3. **Clear browser cache** and refresh the admin dashboard

4. **Check browser console** for any remaining errors

## 📝 Notes

- The `away_status` column is a boolean (true/false)
- Default value is `false` (busy status)
- `true` means away status
- Existing records will be set to `false` (busy) by default
- You can change this later if needed
