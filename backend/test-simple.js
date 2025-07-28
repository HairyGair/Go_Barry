console.log('Node.js is working!');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Environment variables loaded:', Object.keys(process.env).length);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'NOT SET');
