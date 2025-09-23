// Force refresh script to clear React cache
console.log('Forcing frontend refresh for API configuration...');

// Clear localStorage
if (typeof localStorage !== 'undefined') {
  localStorage.clear();
  console.log('✅ Cleared localStorage');
}

// Clear sessionStorage
if (typeof sessionStorage !== 'undefined') {
  sessionStorage.clear();
  console.log('✅ Cleared sessionStorage');
}

// Force page reload
if (typeof window !== 'undefined') {
  window.location.reload(true);
  console.log('✅ Forced page reload');
}