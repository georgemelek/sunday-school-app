# Quick Fix for Runtime Error

If you're getting the error: `TypeError: expected dynamic type 'boolean', but had type 'string'`

## Step 1: Update Database Trigger

Go to your Supabase dashboard → SQL Editor and run this:

```sql
-- Drop and recreate the trigger function with better type handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    NULLIF(TRIM(new.raw_user_meta_data->>'phone'), ''),
    COALESCE(
      CASE
        WHEN new.raw_user_meta_data->>'role' IN ('servant', 'coordinator', 'priest')
        THEN new.raw_user_meta_data->>'role'
        ELSE 'servant'
      END,
      'servant'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 2: Clean Up Existing Data (if you already registered)

If you already created a test account, clean it up:

```sql
-- Delete test profiles and users (CAREFUL - this deletes all users!)
-- Only run this if you're in development and want a fresh start
DELETE FROM auth.users;
-- Profiles will cascade delete automatically
```

## Step 3: Restart Your App

```bash
# Stop the metro bundler (Ctrl+C in terminal)
# Clear cache and restart
npm start -- --clear
```

## Alternative: Skip Database Trigger

If the trigger is still causing issues, you can disable it and let the app handle profile creation:

```sql
-- Disable trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

Then update the app to manually create profiles (the code already has this as a fallback).

## What Was Wrong?

The original trigger wasn't properly handling:
1. Empty strings for optional fields (phone)
2. Type validation for the role field
3. Duplicate insertions (ON CONFLICT clause missing)

The new version:
- Uses `NULLIF(TRIM(...), '')` to convert empty strings to NULL
- Validates role is one of the allowed values
- Uses `ON CONFLICT DO NOTHING` to prevent duplicate insert errors
