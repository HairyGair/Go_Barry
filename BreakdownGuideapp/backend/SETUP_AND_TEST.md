# 🚀 Backend Setup and Testing Guide

## Step 1: Run Database Migrations

Run the consolidated migration file in your MySQL database:

```bash
mysql -u your_username -p gobarryco_breakdowns < RUN_ALL_MIGRATIONS.sql
```

**If you're using phpMyAdmin:**
1. Go to phpMyAdmin
2. Select `gobarryco_breakdowns` database
3. Click "Import" tab
4. Choose `RUN_ALL_MIGRATIONS.sql`
5. Click "Go"

Expected result: You should see "All migrations completed successfully!"

---

## Step 2: Update .env File

Create or update your `/backend/.env` file with these settings:

```bash
# MySQL Database Connection (REQUIRED)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_cpanel_mysql_username
DB_PASSWORD=your_cpanel_mysql_password
DB_NAME=gobarryco_breakdowns
MYSQL_CONNECTION_LIMIT=10

# JWT Authentication (REQUIRED)
JWT_SECRET=9fa4f0f326a2f2b997ebe6450b6ae5a236c8229cc43137462505b810c5c27bd792e6f97f058297758f0bc425ae36026e4cbdba91b10fef256541f3425ddd611a
JWT_EXPIRATION=24h

# Server Configuration
PORT=3001
NODE_ENV=development

# REMOVE THESE (Supabase no longer needed):
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Step 3: Install New Dependencies

```bash
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp/backend"
npm install bcrypt jsonwebtoken
```

Expected output:
```
added 2 packages
```

---

## Step 4: Verify Installation

```bash
npm list bcrypt jsonwebtoken
```

Expected output:
```
backend@1.0.0
├── bcrypt@5.1.1
└── jsonwebtoken@9.0.2
```

---

## Step 5: Start the Server

```bash
npm run dev
```

**Expected output:**
```
✅ MySQL database connected successfully
Database: gobarryco_breakdowns
Connection pool created with 10 connections
🚀 Server running on port 3001
Server ready to accept connections
```

**If you see errors:**
- Check MySQL credentials in .env
- Verify database exists
- Check MySQL is running

---

## Step 6: Test Health Check

Open a new terminal and run:

```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "database": "mysql",
  "timestamp": "2025-10-16T23:00:00.000Z",
  "uptime": 123.456
}
```

---

## Step 7: Test Database Connection

```bash
curl http://localhost:3001/api/supervisors
```

**Expected response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "email": "anthony.gair@gonortheast.co.uk",
      "name": "Anthony Gair",
      "badge_number": "AG003",
      "depot": "SDC",
      "role": "admin"
    },
    ...
  ]
}
```

**Note:** Should return 16 supervisors

---

## Step 8: Create Test User Account

First, you need to create a password for an existing supervisor:

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "anthony.gair@gonortheast.co.uk",
    "password": "TestPassword123!",
    "name": "Anthony Gair",
    "badge_number": "AG003",
    "depot": "SDC"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Account activated successfully",
  "user": {
    "id": "...",
    "email": "anthony.gair@gonortheast.co.uk",
    "name": "Anthony Gair"
  }
}
```

---

## Step 9: Test Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "anthony.gair@gonortheast.co.uk",
    "password": "TestPassword123!"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "anthony.gair@gonortheast.co.uk",
    "name": "Anthony Gair",
    "role": "admin",
    "depot": "SDC"
  }
}
```

**Save the token** - you'll need it for authenticated requests!

---

## Step 10: Test Authenticated Endpoint

Use the token from Step 9:

```bash
curl http://localhost:3001/api/breakdowns/live \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "fleet_no": "...",
      "status": "...",
      ...
    }
  ]
}
```

---

## Step 11: Test Key Endpoints

### Test Analytics
```bash
curl http://localhost:3001/api/analytics/kpis?period=today
```

### Test Fleet
```bash
curl http://localhost:3001/api/fleet
```

### Test Activities
```bash
curl http://localhost:3001/api/activity/feed?limit=10
```

### Test Public Endpoints (No Auth Required)
```bash
curl http://localhost:3001/api/public/breakdowns/live
```

---

## Step 12: Run Automated Tests

```bash
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp/backend"

# Test supervisors endpoints
node test-supervisors-migration.js

# Test analytics endpoints
node test-analytics-endpoints.js
```

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] Migrations ran successfully (10 tables visible)
- [ ] .env file configured with MySQL credentials
- [ ] JWT_SECRET set in .env
- [ ] Dependencies installed (bcrypt, jsonwebtoken)
- [ ] Server starts without errors
- [ ] Health check returns "healthy"
- [ ] Can retrieve supervisors list
- [ ] Can create user account
- [ ] Can login and receive JWT token
- [ ] Can access protected endpoints with token
- [ ] Public endpoints work without auth
- [ ] No password_hash exposed in responses

---

## 🔥 Common Issues

### Issue: "Cannot connect to MySQL"
**Solution:** Check .env file has correct credentials

### Issue: "Table doesn't exist"
**Solution:** Run migrations again with RUN_ALL_MIGRATIONS.sql

### Issue: "Module not found: bcrypt"
**Solution:** Run `npm install bcrypt jsonwebtoken`

### Issue: "Invalid JWT"
**Solution:** Check JWT_SECRET matches in .env

### Issue: "401 Unauthorized"
**Solution:** Include `Authorization: Bearer TOKEN` header

---

## 🎯 Next Steps After Testing

1. ✅ All tests pass locally
2. Deploy to cPanel production
3. Run migrations on production database
4. Update production .env
5. Test on production domain
6. Monitor logs for 24-48 hours
7. If stable, can suspend Supabase after 2 weeks

---

## 📊 Expected Database State

After migrations, you should have:

| Table | Records |
|-------|---------|
| supervisors | 16 |
| breakdowns | 31-32 |
| engineers | 5 |
| activities | 63 |
| fleet_vehicles | 1 |
| user_preferences | 0-1 |
| notification_preferences | 0 |
| wizard_progress | 0 |
| depots | 6 |
| breakdown_events | 0 |

---

**Ready to go! 🚀**

If you encounter any issues, check the logs and let me know!
