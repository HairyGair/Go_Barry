# Quick Start - Preferences & Wizard Migration

## Files Created

### Backups (Original Supabase Files)
- `/backend/routes/preferences.js.supabase.backup` - Original preferences routes
- `/backend/routes/wizards.js.supabase.backup` - Original wizard routes

### Migrated Files (MySQL)
- `/backend/routes/preferences.js` - User preferences API (MySQL)
- `/backend/routes/wizards.js` - Wizard progress API (MySQL)

### Database Migrations
- `/backend/migrations/004_user_preferences_mysql.sql` - Preferences tables
- `/backend/migrations/005_wizard_progress_mysql.sql` - Wizard progress table

### Documentation
- `/backend/MIGRATION_SUMMARY_PREFERENCES_WIZARDS.md` - Complete migration guide

## Quick Deploy

### 1. Run Migrations
```bash
mysql -u your_user -p your_database < backend/migrations/004_user_preferences_mysql.sql
mysql -u your_user -p your_database < backend/migrations/005_wizard_progress_mysql.sql
```

### 2. Verify Tables
```sql
SHOW TABLES LIKE '%preferences%';
SHOW TABLES LIKE 'wizard_progress';
DESCRIBE user_preferences;
```

### 3. Test Endpoints
```bash
# Restart backend
npm run dev

# Test preferences
curl http://localhost:3000/api/preferences -H "Authorization: Bearer TOKEN"

# Test wizards
curl http://localhost:3000/api/wizards/recent -H "Authorization: Bearer TOKEN"
```

## Endpoints Migrated

### Preferences (6 endpoints)
- GET `/api/preferences` - Get user preferences
- PUT `/api/preferences` - Update preferences
- PATCH `/api/preferences` - Partial update
- DELETE `/api/preferences` - Reset to defaults
- POST `/api/preferences/export` - Export backup
- POST `/api/preferences/import` - Import backup

### Wizards (6 endpoints)
- POST `/api/wizards/progress` - Log wizard step
- GET `/api/wizards/progress/:id` - Get progress
- POST `/api/wizards/complete` - Complete wizard
- GET `/api/wizards/stats/usage` - Usage stats
- GET `/api/wizards/recent` - Recent assessments
- GET `/api/wizards/decisions/summary` - Decision stats

## Changes Made

### Database
- Created `user_preferences` table (MySQL)
- Created `notification_preferences` table (MySQL)
- Created `wizard_progress` table (MySQL)
- Added 3 views for optimized queries
- Added indexes on key columns

### Code
- Replaced Supabase client with MySQL query helpers
- Converted JSONB to JSON type
- Updated query patterns for MySQL
- Preserved all functionality
- Maintained backward compatibility

## Rollback (if needed)

```bash
# Restore original Supabase files
cp backend/routes/preferences.js.supabase.backup backend/routes/preferences.js
cp backend/routes/wizards.js.supabase.backup backend/routes/wizards.js

# Drop MySQL tables
mysql -e "DROP TABLE IF EXISTS wizard_progress; DROP TABLE IF EXISTS user_preferences; DROP TABLE IF EXISTS notification_preferences;"
```

## Support

See full documentation: `/backend/MIGRATION_SUMMARY_PREFERENCES_WIZARDS.md`
