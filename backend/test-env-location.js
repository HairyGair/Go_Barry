// Check .env file location
import { existsSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

console.log('Current working directory:', process.cwd());
console.log('.env exists in cwd?', existsSync('.env'));
console.log('.env exists at absolute path?', existsSync('/Users/anthony/Go BARRY App/backend/.env'));

// Try loading with explicit path
const result = dotenv.config({ path: resolve(process.cwd(), '.env') });
console.log('dotenv result:', result);
console.log('SUPABASE_URL after explicit load:', process.env.SUPABASE_URL || 'NOT SET');
