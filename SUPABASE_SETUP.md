# Supabase Setup Guide

This guide will walk you through setting up your Supabase backend for the Sunday School app.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Set project details:
   - **Name**: sunday-school-app (or your choice)
   - **Database Password**: Save this securely!
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait ~2 minutes for project to initialize

## 2. Get API Credentials

1. Go to **Project Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Long JWT token (starts with `eyJ...`)
3. Add these to `apps/mobile/.env`:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

## 3. Run Database Migrations

Go to **SQL Editor** in your Supabase dashboard and run the following SQL scripts in order:

### Migration 1: Create Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Churches table
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'official')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID REFERENCES churches(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('servant', 'coordinator', 'priest')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grades (e.g., "6th Grade Boys", "Kindergarten")
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Servant → Grade assignments (many-to-many)
CREATE TABLE servant_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(servant_id, grade_id)
);

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance records
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  present BOOLEAN NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Church invitation codes
CREATE TABLE church_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT NULL,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Migration 2: Create Indexes

```sql
-- Indexes for common queries
CREATE INDEX idx_students_grade ON students(grade_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_grade_date ON attendance(grade_id, date);
CREATE INDEX idx_servant_grades_servant ON servant_grades(servant_id);
CREATE INDEX idx_servant_grades_grade ON servant_grades(grade_id);
CREATE INDEX idx_profiles_church ON profiles(church_id);
CREATE INDEX idx_grades_church ON grades(church_id);
```

### Migration 3: Row-Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE servant_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_invitations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read profiles in their church, update only their own
CREATE POLICY "Users see profiles in their church" ON profiles
  FOR SELECT USING (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    OR id = auth.uid()
  );

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Anyone can insert their profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Churches: Anyone can read, only creators can update
CREATE POLICY "Anyone can read churches" ON churches
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create churches" ON churches
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators update churches" ON churches
  FOR UPDATE USING (created_by = auth.uid());

-- Grades: Servants see their grades, coordinators see all in church
CREATE POLICY "Users see relevant grades" ON grades
  FOR SELECT USING (
    id IN (SELECT grade_id FROM servant_grades WHERE servant_id = auth.uid())
    OR church_id IN (
      SELECT church_id FROM profiles
      WHERE id = auth.uid() AND role IN ('coordinator', 'priest')
    )
  );

CREATE POLICY "Users create grades in their church" ON grades
  FOR INSERT WITH CHECK (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users update grades in their church" ON grades
  FOR UPDATE USING (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
  );

-- Servant Grades: Servants and coordinators can manage
CREATE POLICY "Users see relevant servant_grades" ON servant_grades
  FOR SELECT USING (
    servant_id = auth.uid()
    OR grade_id IN (
      SELECT g.id FROM grades g
      JOIN profiles p ON g.church_id = p.church_id
      WHERE p.id = auth.uid() AND p.role IN ('coordinator', 'priest')
    )
  );

CREATE POLICY "Users insert servant_grades" ON servant_grades
  FOR INSERT WITH CHECK (
    servant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      JOIN grades g ON g.church_id = p.church_id
      WHERE p.id = auth.uid()
      AND p.role IN ('coordinator', 'priest')
      AND g.id = grade_id
    )
  );

-- Students: Servants see students in their grades
CREATE POLICY "Users see relevant students" ON students
  FOR SELECT USING (
    grade_id IN (SELECT grade_id FROM servant_grades WHERE servant_id = auth.uid())
    OR grade_id IN (
      SELECT g.id FROM grades g
      JOIN profiles p ON g.church_id = p.church_id
      WHERE p.id = auth.uid() AND p.role IN ('coordinator', 'priest')
    )
  );

CREATE POLICY "Servants manage students in their grades" ON students
  FOR ALL USING (
    grade_id IN (SELECT grade_id FROM servant_grades WHERE servant_id = auth.uid())
  );

-- Attendance: Servants manage their grades, coordinators read all
CREATE POLICY "Users see relevant attendance" ON attendance
  FOR SELECT USING (
    grade_id IN (SELECT grade_id FROM servant_grades WHERE servant_id = auth.uid())
    OR grade_id IN (
      SELECT g.id FROM grades g
      JOIN profiles p ON g.church_id = p.church_id
      WHERE p.id = auth.uid() AND p.role IN ('coordinator', 'priest')
    )
  );

CREATE POLICY "Servants manage attendance in their grades" ON attendance
  FOR ALL USING (
    grade_id IN (SELECT grade_id FROM servant_grades WHERE servant_id = auth.uid())
  );

-- Church Invitations: Coordinators manage invitations
CREATE POLICY "Users see invitations for their church" ON church_invitations
  FOR SELECT USING (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Coordinators create invitations" ON church_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND church_id = church_invitations.church_id
      AND role IN ('coordinator', 'priest')
    )
  );
```

### Migration 4: Database Functions

```sql
-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    NULLIF(new.raw_user_meta_data->>'phone', ''),
    COALESCE(
      CASE
        WHEN new.raw_user_meta_data->>'role' IN ('servant', 'coordinator', 'priest')
        THEN new.raw_user_meta_data->>'role'
        ELSE 'servant'
      END,
      'servant'
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

## 4. Configure Authentication

### Email Settings

1. Go to **Authentication** → **Settings**
2. Under **Email Auth**:
   - Enable "Enable email confirmations" (for production)
   - For MVP testing, you can disable this
3. Under **Email Templates**, customize if needed

### Social Auth (Optional - Post-MVP)

To enable Google/Apple login:

1. Go to **Authentication** → **Providers**
2. Enable Google:
   - Get OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)
   - Add Client ID and Client Secret
3. Enable Apple:
   - Get credentials from [Apple Developer](https://developer.apple.com)
   - Add Service ID and Key

## 5. Test Database Connection

Run this query in SQL Editor to verify setup:

```sql
-- Should return empty results (no users yet)
SELECT * FROM profiles;

-- Should return no error
SELECT * FROM churches;
SELECT * FROM grades;
SELECT * FROM students;
SELECT * FROM attendance;
```

## 6. Seed Test Data (Optional)

For local testing, you can add sample data:

```sql
-- Insert test church
INSERT INTO churches (name, city, state, status)
VALUES ('St. Mary Church', 'Naperville', 'IL', 'official')
RETURNING id;

-- Copy the UUID from above, then insert a test grade
INSERT INTO grades (church_id, name, created_by)
VALUES (
  'YOUR_CHURCH_UUID_HERE',
  '6th Grade Boys',
  auth.uid() -- Will be NULL for now, that's okay for testing
);
```

## 7. Generate TypeScript Types (Optional)

To get auto-generated TypeScript types from your schema:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > apps/mobile/src/types/database.ts
```

Replace `YOUR_PROJECT_ID` with your project reference ID from Supabase settings.

## Common Issues

### "relation does not exist" error
- Make sure you ran all migrations in order
- Check that migrations completed without errors

### RLS policy errors
- Verify you're authenticated (check `auth.uid()`)
- Test with different user roles
- Use Supabase dashboard to view RLS policy logs

### Profile not created on signup
- Check that the `handle_new_user()` trigger exists
- Verify function has `SECURITY DEFINER` (allows it to bypass RLS)

## Next Steps

After setup:
1. ✅ Mobile app can connect to Supabase
2. ✅ Users can register and login
3. ✅ Profiles are automatically created
4. 🚧 Build out church/grade/student management
5. 🚧 Implement attendance tracking
6. 🚧 Add church invitation system

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
