# 🚨 URGENT: Fix _operations-centre-disabled Error

## The Problem
The Metro bundler is holding onto a cached reference to `_operations-centre-disabled` folder that no longer exists. This folder was temporarily created and then moved back to `operations-centre`.

## Quick Solution (Try First)

1. **Stop the current server** - Press `Ctrl+C` in terminal
2. **Start with clear cache**:
   ```bash
   npm start -- --clear
   ```
3. **Hard refresh browser** when it opens: `Cmd+Shift+R`

## If That Doesn't Work - Complete Reset

Run these commands:
```bash
# Make scripts executable
chmod +x COMPLETE_CACHE_RESET.sh diagnose-operations-error.sh

# First, diagnose the issue
./diagnose-operations-error.sh

# Then run complete reset
./COMPLETE_CACHE_RESET.sh
```

## Manual Steps if Scripts Don't Work

1. **Close everything**:
   - All browser tabs with the app
   - Terminal windows
   - VS Code (if open)

2. **Clear caches manually**:
   ```bash
   rm -rf .expo
   rm -rf dist
   rm -rf node_modules/.cache
   rm -rf $TMPDIR/metro-*
   rm -rf $TMPDIR/haste-*
   ```

3. **Start fresh**:
   - Open new terminal
   - Navigate to Go_BARRY folder
   - Run: `npm start -- --clear`
   - Open in new incognito browser window

## Why This Happened
When I renamed `operations-centre` to `_operations-centre-disabled` and then back, the Metro bundler cached the old path. Metro's hot reloading keeps these paths in memory even after the folder is renamed.

## Prevention
Always clear Metro cache after renaming folders:
```bash
npx react-native start --reset-cache
# or
npm start -- --clear
```

The operations-centre IS properly set up - we just need to clear the stale cache reference.
