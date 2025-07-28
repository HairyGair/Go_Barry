// Test if imports are working
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

console.log('✅ Test file executed successfully');
console.log('Express:', typeof express);
console.log('Environment loaded:', !!process.env.SUPABASE_URL);
