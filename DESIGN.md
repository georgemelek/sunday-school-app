# Sunday School App - Technical Design Document

**Author**: Claude
**Target Audience**: Software Engineer 2
**Status**: Draft for Review
**Last Updated**: November 2024

---

## 1. Executive Summary

We're building a cross-platform (iOS + Android) Sunday School attendance app with a 1-month MVP deadline. The app supports a flexible registration model where servants can self-register and operate independently, with optional later integration when coordinators/priests join.

**Key Constraints**:
- 1-month timeline
- Developer experience: React, TypeScript, Express/Node (no SQL or mobile experience)
- Initial scale: 10 churches, 100 servants
- Budget: Minimize costs while maintaining extensibility

**Core MVP Features**:
1. Servant flow: Self-register → Add students → Take attendance
2. Coordinator flow: Register → View attendance across grades
3. Flexible church linking (servant joins coordinator's church later)

---

## 2. Architecture Decision: SQL vs NoSQL

### Your Background (DynamoDB)
You're familiar with NoSQL patterns: single-table design, GSIs, denormalization, partition keys. So why are we choosing PostgreSQL instead?

### The Case for PostgreSQL (via Supabase)

#### **Relational Data is the Dominant Pattern**
Your data model is inherently relational:
```
Church → Grades → Students
       ↘ Servants → Attendance Records
Coordinators → View All Grades in Church
```

In DynamoDB, you'd need:
- Primary table with overloaded `PK/SK` structure
- GSI for church-to-servants lookup
- GSI for grade-to-students lookup
- GSI for servant-to-grades lookup (many-to-many)
- GSI for date-based attendance queries
- Complex query patterns for coordinator views

**DynamoDB Example** (what you'd need to avoid):
```
PK                    SK                      Data
------------------------------------------------------------------
CHURCH#uuid           METADATA                {name, city, ...}
CHURCH#uuid           GRADE#uuid              {gradeName, ...}
CHURCH#uuid           SERVANT#uuid            {name, role, ...}
SERVANT#uuid          GRADE#uuid              {assignment metadata}
STUDENT#uuid          METADATA                {name, dob, ...}
STUDENT#uuid          ATTENDANCE#2024-11-28   {present: true, ...}
```

**GSIs needed**:
- GSI1: `SERVANT#uuid` → all grades
- GSI2: `GRADE#uuid` → all students
- GSI3: `DATE#GRADE#uuid` → attendance by date
- GSI4: `STUDENT#uuid` → all attendance records

This gets complex fast, and you'd be fighting the database.

#### **PostgreSQL Makes This Trivial**
```sql
-- Get all students in a servant's grades with today's attendance
SELECT s.*, a.present
FROM students s
LEFT JOIN attendance a ON s.id = a.student_id AND a.date = '2024-11-28'
WHERE s.grade_id IN (
  SELECT grade_id FROM servant_grades WHERE servant_id = $1
);
```

With DynamoDB, this is multiple queries + client-side joins.

#### **ACID Transactions Matter Here**
Consider this scenario: A servant records attendance for 20 students.

**PostgreSQL**:
```sql
BEGIN;
INSERT INTO attendance (student_id, present, date) VALUES (...); -- 20 rows
COMMIT;
```
All succeed or all fail. No partial writes.

**DynamoDB**:
- BatchWriteItem (up to 25 items) with no transaction guarantees
- Or TransactWriteItems (up to 100 items, but costly and slow)
- Partial failures require complex retry logic

For attendance records, you don't want "15 out of 20 students got recorded."

#### **Complex Queries are Common in Your App**

**Coordinator Dashboard** needs:
```sql
-- Get attendance percentage by grade for the last month
SELECT
  g.name,
  COUNT(DISTINCT a.student_id) as students_attended,
  COUNT(DISTINCT s.id) as total_students,
  (COUNT(DISTINCT CASE WHEN a.present THEN a.student_id END)::float /
   NULLIF(COUNT(DISTINCT s.id), 0) * 100) as attendance_rate
FROM grades g
JOIN students s ON g.id = s.grade_id
LEFT JOIN attendance a ON s.id = a.student_id
  AND a.date >= CURRENT_DATE - INTERVAL '30 days'
WHERE g.church_id = $1
GROUP BY g.id, g.name;
```

In DynamoDB: Query all students, query all attendance, join client-side, aggregate client-side. Slow and complex.

#### **Cost Comparison**

**Supabase (PostgreSQL)**:
- Free tier: 500MB database, 50K monthly active users, unlimited API requests
- Pro tier ($25/month): 8GB database, 100K MAU, included egress

**DynamoDB**:
- Free tier: 25 GB storage, 25 WCU, 25 RCU (runs out fast)
- With 100 servants taking attendance for 20 students each daily:
  - ~2000 writes/day × 30 = 60K writes/month
  - Coordinator views: easily 100K+ reads/month
  - Cost: ~$20-40/month for reads/writes alone
  - Plus GSI costs (doubles write costs for each GSI)

For your scale, **PostgreSQL via Supabase is cheaper and simpler**.

### Why Not MongoDB?

MongoDB (Atlas) is a valid middle ground, but:
- Similar pricing to Supabase ($25/month for M10 tier)
- You'd still need to build auth, file storage, real-time subscriptions yourself
- Less mature mobile SDKs compared to Supabase
- No built-in row-level security

**Verdict**: If you were building a chat app or event logging system (write-heavy, denormalized), DynamoDB wins. For relational CRUD with complex queries, PostgreSQL is the right tool.

---

## 3. Backend Decision: Supabase vs Custom Express/Node

### Option 1: Custom Express Backend + DynamoDB/MongoDB

**Pros**:
- Total control over API design
- Familiar stack (Express + Node)
- Can use DynamoDB if you prefer NoSQL

**Cons**:
- Need to build:
  - Auth system (JWT, password hashing, email verification, social OAuth)
  - Session management
  - Authorization middleware
  - API versioning
  - Rate limiting
  - CORS handling
  - Real-time updates (WebSockets or polling)
  - File upload handling (for future features like photos)
- Deployment complexity:
  - API hosting (AWS Lambda + API Gateway, or EC2/Fargate)
  - Database setup and management
  - CI/CD pipeline
  - Monitoring and logging
- **Time estimate**: 2-3 weeks just for backend scaffolding

**Cost** (AWS):
- Lambda + API Gateway: ~$10/month
- DynamoDB: ~$20-40/month (at scale)
- S3: ~$5/month
- CloudWatch: ~$5/month
- **Total**: $40-60/month

### Option 2: Supabase (Backend-as-a-Service)

**What You Get Out-of-the-Box**:
1. **PostgreSQL Database**: Fully managed, auto-backups
2. **Instant RESTful API**: Auto-generated from your schema
3. **GraphQL API**: Optional, for complex queries
4. **Authentication**:
   - Email/password (with email verification)
   - Social OAuth (Google, Apple, GitHub, etc.)
   - Magic links
   - JWT tokens managed automatically
5. **Row-Level Security (RLS)**: Database-level authorization
6. **Real-time Subscriptions**: WebSocket-based, built-in
7. **File Storage**: S3-compatible object storage
8. **Edge Functions**: Deno-based serverless functions (if needed)
9. **Auto-generated TypeScript types**: From your database schema

**What This Means for Your Timeline**:

Instead of this (2-3 weeks):
```typescript
// Auth system
app.post('/api/register', validateEmail, hashPassword, createUser, sendVerificationEmail);
app.post('/api/login', validateCredentials, generateJWT, setRefreshToken);
app.post('/api/refresh', validateRefreshToken, generateNewJWT);
app.get('/api/students', authenticateJWT, authorizeRole(['servant']), getStudents);

// WebSocket for real-time
io.on('connection', (socket) => {
  socket.on('subscribe:attendance', validateUser, subscribeToAttendance);
});
```

You write this (1 day):
```typescript
// That's it. Supabase handles everything above.
const { data: students } = await supabase
  .from('students')
  .select('*')
  .eq('grade_id', gradeId);

// Real-time subscription
supabase
  .channel('attendance')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' },
    (payload) => console.log(payload))
  .subscribe();
```

**RLS is Your Authorization Layer**:
Instead of middleware:
```typescript
// Express middleware (custom)
const authorizeServant = async (req, res, next) => {
  const { gradeId } = req.params;
  const servantGrades = await db.query(
    'SELECT grade_id FROM servant_grades WHERE servant_id = $1',
    [req.user.id]
  );
  if (!servantGrades.includes(gradeId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

You write SQL policies once:
```sql
-- This runs on EVERY query automatically
CREATE POLICY "Servants see only their students" ON students
  FOR SELECT USING (
    grade_id IN (
      SELECT grade_id FROM servant_grades WHERE servant_id = auth.uid()
    )
  );
```

Now every Supabase query is automatically scoped. No middleware needed.

**Auto-Generated TypeScript Types**:
```bash
npx supabase gen types typescript --project-id your-project > types/supabase.ts
```

Gives you:
```typescript
import { Database } from './types/supabase';

type Student = Database['public']['Tables']['students']['Row'];
type AttendanceInsert = Database['public']['Tables']['attendance']['Insert'];

// Full type safety for all queries
const { data } = await supabase
  .from('students')
  .select('name, date_of_birth') // TS error if field doesn't exist
  .returns<Student[]>();
```

**Cons of Supabase**:
1. **Vendor lock-in risk**: If Supabase shuts down or prices skyrocket
   - **Mitigation**: Supabase is open-source. You can self-host the entire stack on your own infrastructure.
2. **Less control over API structure**: Auto-generated REST API
   - **Mitigation**: You can add custom Edge Functions for complex logic
3. **Learning curve for SQL/RLS**: You're coming from DynamoDB
   - **Mitigation**: Simpler than learning Express auth, middleware, etc.

**Verdict**: For a 1-month deadline with no prior SQL/mobile experience, Supabase saves you 2-3 weeks of backend work. This is critical.

---

## 4. Database Schema Design

### Challenge: Flexible Church Linking

**Scenario**:
1. Servant Sarah registers, creates "St. Mary Naperville" (doesn't exist in system)
2. Servant John registers, also creates "St. Mary Naperville" (different UUID)
3. Coordinator Mike registers later, creates official "St. Mary Naperville"
4. How do Sarah and John link to Mike's church?

### Solution: Church Invitation System

#### Schema:
```sql
-- Churches can be in "pending" or "official" status
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'official')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- When a coordinator "claims" a church, we need to merge
CREATE TABLE church_merge_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_church_id UUID REFERENCES churches(id), -- Sarah's church
  to_church_id UUID REFERENCES churches(id),   -- Mike's official church
  requested_by UUID REFERENCES profiles(id),   -- Mike
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invitation codes for easy linking
CREATE TABLE church_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id),
  code TEXT UNIQUE NOT NULL, -- "STMARY2024"
  created_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMP,
  max_uses INTEGER DEFAULT NULL,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### User Flow:

**Servant Registration (Self-Service)**:
```
1. Sarah signs up
2. "Which church do you serve at?"
3. Searches "St. Mary Naperville" → not found
4. "Create new church" → Creates church (status: 'pending')
5. Sarah is now linked to her self-created church
```

**Coordinator Registration (Claims Church)**:
```
1. Mike signs up as coordinator
2. Creates "St. Mary Naperville" (status: 'official')
3. Mike generates invitation code: "STMARY2024"
4. Shares code with servants
5. Sarah enters code → her account moves to Mike's church
6. All her grades, students, attendance records migrate atomically
```

**Migration Logic** (Supabase Edge Function):
```typescript
// POST /api/join-church
export async function joinChurch(invitationCode: string, userId: string) {
  // 1. Validate invitation
  const invitation = await supabase
    .from('church_invitations')
    .select('*, churches(*)')
    .eq('code', invitationCode)
    .single();

  // 2. Atomic migration in transaction
  await supabase.rpc('migrate_user_to_church', {
    user_id: userId,
    new_church_id: invitation.church_id
  });
}

-- SQL function for atomic migration
CREATE OR REPLACE FUNCTION migrate_user_to_church(
  user_id UUID,
  new_church_id UUID
) RETURNS void AS $$
BEGIN
  -- Update user's church
  UPDATE profiles SET church_id = new_church_id WHERE id = user_id;

  -- Move all user's grades to new church
  UPDATE grades
  SET church_id = new_church_id
  WHERE id IN (
    SELECT grade_id FROM servant_grades WHERE servant_id = user_id
  );

  -- Delete old pending church if empty
  DELETE FROM churches
  WHERE created_by = user_id
    AND status = 'pending'
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE church_id = churches.id
    );
END;
$$ LANGUAGE plpgsql;
```

### Core Schema (Revised)

```sql
-- Auth handled by Supabase (auth.users table)

-- Churches
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  status TEXT DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User profiles (extends Supabase auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID REFERENCES churches(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('servant', 'coordinator', 'priest')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Grades (e.g., "6th Grade Boys", "Kindergarten")
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Servant → Grade assignments (many-to-many)
CREATE TABLE servant_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id), -- NULL for self-assigned
  created_at TIMESTAMP DEFAULT NOW(),
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, date) -- One record per student per day
);

-- Indexes for common queries
CREATE INDEX idx_students_grade ON students(grade_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_grade_date ON attendance(grade_id, date);
CREATE INDEX idx_servant_grades ON servant_grades(servant_id);
```

### Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE servant_grades ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles in their church, update only their own
CREATE POLICY "Users see profiles in their church" ON profiles
  FOR SELECT USING (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Churches: Anyone can read, only creators can update
CREATE POLICY "Anyone can read churches" ON churches
  FOR SELECT USING (true);

CREATE POLICY "Creators update churches" ON churches
  FOR UPDATE USING (created_by = auth.uid());

-- Grades: Servants see their grades, coordinators see all in church
CREATE POLICY "Servants see their grades" ON grades
  FOR SELECT USING (
    id IN (SELECT grade_id FROM servant_grades WHERE servant_id = auth.uid())
    OR church_id IN (
      SELECT church_id FROM profiles
      WHERE id = auth.uid() AND role IN ('coordinator', 'priest')
    )
  );

CREATE POLICY "Servants create grades" ON grades
  FOR INSERT WITH CHECK (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
  );

-- Students: Servants see students in their grades
CREATE POLICY "Servants see their students" ON students
  FOR SELECT USING (
    grade_id IN (SELECT grade_id FROM servant_grades WHERE servant_id = auth.uid())
    OR grade_id IN (
      SELECT g.id FROM grades g
      JOIN profiles p ON g.church_id = p.church_id
      WHERE p.id = auth.uid() AND p.role IN ('coordinator', 'priest')
    )
  );

CREATE POLICY "Servants manage their students" ON students
  FOR ALL USING (
    grade_id IN (SELECT grade_id FROM servant_grades WHERE servant_id = auth.uid())
  );

-- Attendance: Servants manage their grades, coordinators read all
CREATE POLICY "Servants manage attendance" ON attendance
  FOR ALL USING (
    grade_id IN (SELECT grade_id FROM servant_grades WHERE servant_id = auth.uid())
  );

CREATE POLICY "Coordinators read all attendance" ON attendance
  FOR SELECT USING (
    grade_id IN (
      SELECT g.id FROM grades g
      JOIN profiles p ON g.church_id = p.church_id
      WHERE p.id = auth.uid() AND p.role IN ('coordinator', 'priest')
    )
  );
```

**Why RLS Matters**:
- Authorization happens at the database level
- No way to bypass it (even if you mess up client code)
- Supabase client respects RLS automatically
- No Express middleware needed

---

## 5. Frontend Architecture

### React Native with Expo

**Why Expo over bare React Native?**

| Feature | Expo | Bare React Native |
|---------|------|-------------------|
| Setup time | 5 minutes | 2-3 hours |
| OTA updates | Built-in (fix bugs without app store review) | Manual setup |
| Build system | EAS Build (cloud-based) | Local Xcode/Android Studio |
| Push notifications | Expo Push Notifications (easy) | Manual FCM/APNs setup |
| App store submission | `eas submit` | Manual |
| Learning curve | Low | Medium-high |

For 1-month timeline, **Expo is mandatory**.

**When to eject from Expo?**
- If you need custom native modules not available in Expo
- For this app: unlikely (all features doable in Expo)

### State Management: React Context vs Zustand vs Redux

**Option 1: React Context** (Recommended for MVP)
```typescript
// auth-context.tsx
export const AuthContext = createContext<AuthContextType>(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Why Context for MVP?**
- No additional dependencies
- Simple mental model
- Good enough for ~10-15 global states
- Easy to migrate to Zustand later if needed

**Option 2: Zustand** (If you hit Context performance issues)
- Lightweight (1KB)
- Better performance than Context for frequent updates
- Simple API

**Option 3: Redux Toolkit** (Overkill for MVP)
- Only if you have very complex state logic
- Adds boilerplate

**Verdict**: Start with Context. Migrate to Zustand only if you see performance issues.

### Navigation: React Navigation

```typescript
// App.tsx structure
<NavigationContainer>
  {session ? (
    profile?.role === 'servant' ? (
      <ServantNavigator />
    ) : (
      <CoordinatorNavigator />
    )
  ) : (
    <AuthNavigator />
  )}
</NavigationContainer>

// servant-navigator.tsx
<Stack.Navigator>
  <Stack.Screen name="MyGrades" component={MyGradesScreen} />
  <Stack.Screen name="GradeDetail" component={GradeDetailScreen} />
  <Stack.Screen name="TakeAttendance" component={TakeAttendanceScreen} />
  <Stack.Screen name="AddStudent" component={AddStudentScreen} />
</Stack.Navigator>
```

### Folder Structure

```
apps/mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── StudentListItem.tsx
│   │   ├── AttendanceCheckbox.tsx
│   │   └── GradeCard.tsx
│   ├── screens/            # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── servant/
│   │   │   ├── MyGradesScreen.tsx
│   │   │   ├── GradeDetailScreen.tsx
│   │   │   └── TakeAttendanceScreen.tsx
│   │   └── coordinator/
│   │       ├── DashboardScreen.tsx
│   │       └── AttendanceReportScreen.tsx
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client setup
│   │   └── types.ts        # Auto-generated DB types
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── GradeContext.tsx
│   ├── hooks/              # Custom hooks
│   │   ├── useStudents.ts
│   │   ├── useAttendance.ts
│   │   └── useGrades.ts
│   └── utils/
│       ├── date.ts
│       └── validation.ts
├── App.tsx
└── package.json
```

### Key Custom Hooks

```typescript
// hooks/useStudents.ts
export function useStudents(gradeId: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();

    // Real-time subscription
    const subscription = supabase
      .channel(`students:grade_id=eq.${gradeId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'students', filter: `grade_id=eq.${gradeId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setStudents(prev => [...prev, payload.new as Student]);
          } else if (payload.eventType === 'UPDATE') {
            setStudents(prev => prev.map(s => s.id === payload.new.id ? payload.new as Student : s));
          } else if (payload.eventType === 'DELETE') {
            setStudents(prev => prev.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [gradeId]);

  async function fetchStudents() {
    setLoading(true);
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('grade_id', gradeId)
      .order('name');
    setStudents(data || []);
    setLoading(false);
  }

  return { students, loading, refetch: fetchStudents };
}
```

---

## 6. Authentication Strategy

### Supabase Auth Flow

**Registration**:
```typescript
// 1. Sign up user
const { data, error } = await supabase.auth.signUp({
  email: 'servant@example.com',
  password: 'secure-password',
  options: {
    data: {
      full_name: 'Sarah Smith',
      role: 'servant',
    }
  }
});

// 2. Create profile (via database trigger or manual insert)
// Trigger approach (automatic):
CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Social Login** (Google, Apple):
```typescript
// Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'myapp://auth/callback',
  }
});

// Apple
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'apple',
  options: {
    redirectTo: 'myapp://auth/callback',
  }
});
```

**Session Management**:
- Supabase automatically handles:
  - JWT token storage (secure, http-only)
  - Token refresh
  - Session persistence across app restarts
- You just need to:
  - Listen to `onAuthStateChange`
  - Update UI based on session state

### Email Verification

**Production Flow**:
```typescript
// 1. User signs up
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    emailRedirectTo: 'myapp://auth/verify',
  }
});

// 2. User receives email with magic link
// 3. User clicks link → redirects to app
// 4. App handles deep link:
useEffect(() => {
  const url = Linking.getInitialURL();
  if (url?.includes('verify')) {
    // Supabase automatically verifies on redirect
  }
}, []);
```

**MVP Shortcut**: Disable email verification in Supabase settings for faster testing.

---

## 7. Deployment Strategy

### Mobile App Deployment (Expo EAS)

**Setup** (one-time):
```bash
npm install -g eas-cli
eas login
eas build:configure
```

**Build for iOS**:
```bash
eas build --platform ios --profile preview
# Generates IPA file for TestFlight
```

**Build for Android**:
```bash
eas build --platform android --profile preview
# Generates APK for testing or AAB for Play Store
```

**Over-The-Air (OTA) Updates**:
```bash
# Push JS bundle updates without app store review
eas update --branch production --message "Fixed attendance bug"
```

Users get updates instantly on next app launch.

### Backend Deployment (Supabase)

**Setup**:
1. Create project at supabase.com
2. Run SQL migrations in dashboard
3. Configure auth providers (Google, Apple)
4. Set environment variables in Expo app:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

**Database Migrations**:
```bash
# Use Supabase CLI for version control
supabase init
supabase migration new initial_schema
# Edit migrations/xxx_initial_schema.sql
supabase db push
```

---

## 8. Cost Breakdown

### Free Tier (First 3-6 months)

**Supabase Free**:
- 500 MB database storage
- 50,000 monthly active users
- 2 GB file storage
- Unlimited API requests
- 500 MB egress
- **Cost**: $0

With 100 servants, 1000 students, 1 year of attendance:
- Students: 1000 rows × ~500 bytes = 0.5 MB
- Attendance: 1000 students × 52 weeks = 52K rows × ~200 bytes = 10 MB
- Total: ~15 MB (well under 500 MB)

**Expo**:
- Development builds: Free
- Production builds: Free (limited to 30 builds/month)
- OTA updates: Free (unlimited)
- **Cost**: $0

**Total MVP Cost**: **$0/month**

### Paid Tier (When you grow)

**Supabase Pro** ($25/month):
- 8 GB database storage
- 100,000 monthly active users
- 100 GB file storage
- 250 GB egress

**Expo EAS** ($29/month):
- Unlimited builds
- Priority build queue
- Advanced OTA update features

**Total**: **$54/month** (supports 100+ churches, 10K+ users)

### Comparison to AWS DIY

**AWS (Lambda + DynamoDB + Cognito + S3)**:
- Lambda: $10/month
- DynamoDB: $30/month
- Cognito: $5/month
- API Gateway: $10/month
- S3: $5/month
- CloudWatch: $5/month
- **Total**: $65/month + your time to build/maintain

**Verdict**: Supabase saves money and 3+ weeks of dev time.

---

## 9. MVP Implementation Timeline (4 Weeks)

### Week 1: Foundation
**Days 1-2**: Setup
- Initialize Expo project
- Set up Supabase project
- Run initial schema migration
- Configure Supabase auth providers

**Days 3-5**: Authentication
- Build login/register screens
- Implement auth context
- Add social login (Google, Apple)
- Test auth flow end-to-end

**Days 6-7**: Database + RLS
- Write all RLS policies
- Test policies with multiple user roles
- Set up auto-generated TypeScript types

### Week 2: Servant Flow
**Days 8-9**: Grade Management
- MyGrades screen (list servant's grades)
- Create grade functionality
- Grade detail screen (list students)

**Days 10-12**: Student Management
- Add student form
- Edit student form
- Student list with search/filter
- Delete student (soft delete)

**Days 13-14**: Attendance (Part 1)
- Take attendance screen (checkboxes)
- Submit attendance (batch insert)
- View past attendance

### Week 3: Coordinator Flow + Polish
**Days 15-17**: Coordinator Dashboard
- Dashboard with grade stats
- Attendance report by grade
- Date range filtering
- Export to CSV (optional)

**Days 18-19**: Church Linking
- Church invitation code generation
- Join church via code
- Migration logic (Edge Function)

**Days 20-21**: Polish
- Error handling
- Loading states
- Offline support (optimistic updates)
- Form validation

### Week 4: Testing + Deployment
**Days 22-24**: Testing
- Local testing (iOS simulator, Android emulator)
- Real device testing
- Bug fixes

**Days 25-26**: Beta Testing
- Deploy to TestFlight (iOS)
- Deploy to internal testing (Android)
- Gather feedback from 3-5 real servants

**Days 27-28**: Launch Prep
- Fix critical bugs
- Build production versions
- Submit to App Store / Play Store (review takes 1-3 days)

**Day 29-30**: Buffer for unexpected issues

---

## 10. Risks & Mitigations

### Risk 1: SQL Learning Curve
**Mitigation**:
- Use Supabase dashboard for visual query building
- Claude Code / ChatGPT for SQL help
- Most queries are simple CRUD (Supabase handles complex parts)

### Risk 2: RLS Policy Bugs (Data Leaks)
**Mitigation**:
- Test with multiple user accounts in different roles
- Use Supabase's RLS testing feature
- Start with restrictive policies, loosen as needed

### Risk 3: Scope Creep
**Mitigation**:
- Hard cut-off: Only attendance tracking for MVP
- No visits, no birthdays, no announcements in v1
- Park all feature requests for post-MVP

### Risk 4: App Store Rejection
**Mitigation**:
- Follow Apple/Google guidelines strictly
- Privacy policy required (template available)
- Test on real devices before submission

### Risk 5: Supabase Free Tier Limits
**Mitigation**:
- 500 MB is enough for 10K+ users
- Monitor usage in dashboard
- Upgrade to Pro ($25) if needed

---

## 11. Post-MVP Roadmap

### Phase 2 (Month 2-3)
- **Visits tracking**: Add `visits` table, UI for servants to log home visits
- **Birthday notifications**: Push notifications via Expo
- **Parent portal**: Add parent role, read-only attendance view
- **Multi-language support**: Arabic, Coptic (if needed)

### Phase 3 (Month 4-6)
- **Analytics dashboard**: Attendance trends, dropout alerts
- **Announcements**: Broadcast messages from coordinators
- **Curriculum sharing**: File uploads via Supabase Storage
- **Bulk import**: CSV import for students

### Phase 4 (Month 6+)
- **Multi-grade switching**: Servant serves multiple grades, switch via dropdown
- **Hierarchical permissions**: Country → State → City → Church
- **Custom reports**: Export PDFs, email reports
- **Integration**: Calendar sync (Google Calendar), SMS reminders

---

## 12. Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database** | PostgreSQL (Supabase) | Relational data, complex queries, ACID transactions |
| **Backend** | Supabase BaaS | Saves 2-3 weeks, handles auth/real-time/storage |
| **Frontend** | React Native (Expo) | Cross-platform, fast setup, OTA updates |
| **State** | React Context | Simple, no extra deps, good for MVP scale |
| **Navigation** | React Navigation | Standard for RN, well-documented |
| **Auth** | Supabase Auth | Email/password + social, built-in JWT |
| **Deployment** | EAS Build + Supabase Cloud | Zero DevOps, $0 for MVP |
| **Cost** | $0-54/month | Supabase + Expo tiers |

---

## 13. Open Questions for Review

1. **Offline support**: Should servants be able to take attendance offline and sync later? (Adds complexity, maybe post-MVP)
2. **Student photos**: Do you want to store student photos? (Uses Supabase Storage, simple to add)
3. **Attendance edits**: How far back can servants edit? (7 days, 30 days, unlimited?)
4. **Church naming conflicts**: If two coordinators create "St. Mary" churches, how do we handle? (Manual merge by admin?)
5. **Roles**: Should servants have read-only vs full access levels? (e.g., substitute servants who can only view?)

---

## Next Steps

1. **Review this doc**: Confirm architectural decisions align with your vision
2. **Answer open questions**: Clarify edge cases
3. **Initialize project**: Run setup commands, create Supabase project
4. **Start Week 1**: Begin with auth setup

Let me know if you want to proceed, and I'll start scaffolding the project structure.
