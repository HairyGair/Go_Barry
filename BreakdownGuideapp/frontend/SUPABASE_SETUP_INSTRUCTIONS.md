# Supabase Supervisors Table Setup Instructions

## 1. Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query" to create a new SQL script

## 2. Run the Table Setup Script

Copy and paste the contents of `supervisors-table-setup.sql` into the SQL editor and run it. This will:

- Create the `supervisors` table with proper structure and constraints
- Add indexes for performance
- Set up automatic `updated_at` timestamp updates
- Enable Row Level Security (RLS)
- Create appropriate security policies
- Insert the authorized supervisor records

## 3. Table Structure Created

The table will have the following structure:

```sql
supervisors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    depot TEXT NOT NULL CHECK (depot IN ('Washington', 'Riverside', 'Percy Main', 'Consett', 'Deptford')),
    role TEXT NOT NULL CHECK (role IN ('supervisor', 'admin', 'manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## 4. Initial Supervisor Records

The script will create records for:

- **anthony.gair@gonortheast.co.uk** (Admin, Washington)
- **lee.mutch@gonortheast.co.uk** (Admin, Washington)
- **joshua.devlin@gonortheast.co.uk** (Admin, Washington)
- **supervisor@gonortheast.co.uk** (Supervisor, Washington)
- **admin@gonortheast.co.uk** (Admin, Washington)

## 5. Authentication Setup

After running the SQL script, use the "Setup User Accounts" button in the development login page to:

- Create Supabase Auth users for each supervisor
- Link them to the supervisor records
- Set temporary passwords (`TempPassword2025!`)

## 6. Security Features

- **Row Level Security**: Enabled with appropriate policies
- **Email Uniqueness**: Enforced at database level
- **Depot Validation**: Only valid depot names allowed
- **Role Validation**: Only valid roles allowed
- **Automatic Timestamps**: `created_at` and `updated_at` managed automatically

## 7. Verification

After setup, you can verify the table exists by running:

```sql
SELECT email, name, depot, role, created_at FROM supervisors ORDER BY created_at;
```

This should return all 5 supervisor records.

## 8. Integration

The enhanced authentication service will now:

1. First check the Supabase `supervisors` table for user data
2. Fall back to local authorized list if Supabase is unavailable
3. Provide seamless authentication with proper session management
4. Support all depot locations and role types as defined in the table

## Troubleshooting

- If you get permission errors, ensure your Supabase service role key has proper permissions
- If RLS policies block access, check that the policies match your authentication setup
- For development, you can temporarily disable RLS with: `ALTER TABLE supervisors DISABLE ROW LEVEL SECURITY;`