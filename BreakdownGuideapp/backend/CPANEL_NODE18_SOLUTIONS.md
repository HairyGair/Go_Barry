# 🔧 cPanel Node.js 18 Solutions - Try These First!

You're right - there MUST be a way to use cPanel! Let's exhaust all cPanel options before considering alternatives.

---

## Solution 1: Check What Node Versions Are Available (TRY THIS FIRST)

cPanel servers often have multiple Node.js versions installed. Let's check:

### In cPanel Terminal:

```bash
# Check current version
node --version

# Check if there are other Node binaries
ls -la /usr/bin/node*
ls -la /usr/local/bin/node*

# Check for specific versions
which node18
which node-18
ls /opt/cpanel/ea-nodejs*/bin/node
ls /opt/alt/alt-nodejs*/bin/node

# Check available versions via cPanel's node wrapper
/usr/local/bin/ea-nodejs18 --version 2>/dev/null || echo "Node 18 not found via ea-nodejs18"
/usr/local/bin/ea-nodejs20 --version 2>/dev/null || echo "Node 20 not found via ea-nodejs20"

# Check CloudLinux alt-nodejs versions
ls -la /opt/alt/alt-nodejs*/root/usr/bin/node 2>/dev/null || echo "No CloudLinux Node versions found"
```

**If you find Node 18:**
```bash
# Example paths that might exist:
/opt/cpanel/ea-nodejs18/bin/node --version
/opt/alt/alt-nodejs18/root/usr/bin/node --version
```

---

## Solution 2: Use cPanel "Setup Node.js App" with Correct Settings

The Application Manager interface you tried before might have Node 18 as an option!

### Steps:

1. **In cPanel, go to "Setup Node.js App"** (or "Application Manager")

2. **If editing existing app:**
   - Click on your existing app
   - Look for "Node.js version" dropdown
   - **Check if version 18.x is available in the dropdown**
   - If yes → Select it → Save → Restart

3. **If creating new app:**
   - Click "Create Application"
   - **Node.js version:** Look for 18.x option
   - Application mode: Production
   - Application root: `api`
   - Application startup file: `server.js`
   - Environment variables: (add all your .env variables)

4. **Important Settings:**
   - Port: Leave blank or use 3002
   - Passenger: Enabled
   - Environment variables:
     ```
     DB_HOST=localhost
     DB_USER=gobarryco_Gair
     DB_PASSWORD=Turnip1105!!!!!
     DB_NAME=gobarryco_breakdown
     JWT_SECRET=9fa4f0f326a2f2b997ebe6450b6ae5a236c8229cc43137462505b810c5c27bd792e6f97f058297758f0bc425ae36026e4cbdba91b10fef256541f3425ddd611a
     NODE_ENV=production
     ```

---

## Solution 3: Check if NVM (Node Version Manager) is Available

NVM lets you switch between Node versions easily.

### In cPanel Terminal:

```bash
# Check if nvm is installed
nvm --version

# If installed, list available versions
nvm list

# Install Node 18
nvm install 18

# Use Node 18
nvm use 18

# Make it default
nvm alias default 18

# Verify
node --version  # Should show v18.x.x

# Try starting server
cd ~/api
PORT=3002 node server.js
```

**If nvm is not installed but you have shell access:**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart shell or run:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Then install Node 18
nvm install 18
nvm use 18
```

---

## Solution 4: Use Specific Node Binary Path

If Node 18 exists but isn't the default, use the full path:

```bash
# Example - adjust path based on what you found in Solution 1
cd ~/api

# Try different possible paths:
/opt/cpanel/ea-nodejs18/bin/node server.js
/opt/alt/alt-nodejs18/root/usr/bin/node server.js
/usr/local/bin/ea-nodejs18 server.js

# If one works, create an alias
echo 'alias node18="/path/to/node18/binary"' >> ~/.bashrc
source ~/.bashrc

# Then use it
PORT=3002 node18 server.js
```

---

## Solution 5: Create .htaccess for Passenger with Specific Node Version

If using Passenger (Phusion Passenger) in Application Manager:

### Create/Edit `.htaccess` in your `public_html` or app directory:

```apache
# .htaccess in ~/public_html/api/.htaccess or wherever your app is served

PassengerEnabled on
PassengerAppRoot /home/gobarryco/api
PassengerAppType node
PassengerStartupFile server.js

# Specify Node 18 if available
PassengerNodejs /opt/cpanel/ea-nodejs18/bin/node

# Or try these paths:
# PassengerNodejs /opt/alt/alt-nodejs18/root/usr/bin/node
# PassengerNodejs /usr/local/bin/ea-nodejs18

PassengerAppEnv production
PassengerFriendlyErrorPages off

# Environment variables
SetEnv DB_HOST localhost
SetEnv DB_USER gobarryco_Gair
SetEnv DB_PASSWORD Turnip1105!!!!!
SetEnv DB_NAME gobarryco_breakdown
SetEnv JWT_SECRET 9fa4f0f326a2f2b997ebe6450b6ae5a236c8229cc43137462505b810c5c27bd792e6f97f058297758f0bc425ae36026e4cbdba91b10fef256541f3425ddd611a
SetEnv NODE_ENV production
```

---

## Solution 6: Use CloudLinux Node.js Selector (If Available)

Some cPanel hosts use CloudLinux which has a Node.js Selector:

1. **In cPanel, search for "Select Node.js version"** or "Node.js Selector"

2. **If found:**
   - Select version 18.x
   - Click "Set as current"
   - Run `source ~/.bashrc` in terminal
   - Verify: `node --version`

---

## Solution 7: Contact Pixelish with SPECIFIC Request

Don't ask for "Node 18 installation" - ask specific questions:

### Quick Email Template:

```
Subject: Quick Question - Node.js 18 Availability on Server

Hi Pixelish Support,

I'm running into compatibility issues with Node.js v22 on my account (gobarryco).

Quick questions:

1. Are there other Node.js versions already installed on the server?
   (Looking for Node 18.x specifically)

2. Can I use cPanel's "Setup Node.js App" to select Node 18?

3. Is nvm (Node Version Manager) available for my account?

4. If Node 18 isn't available, can you install it via:
   - CloudLinux Node.js Selector?
   - ea-nodejs18 package?
   - alt-nodejs18 package?

This is a production application that's completed but blocked by Node 22's
WebAssembly memory requirements on shared hosting.

Account: gobarryco
Current Node: v22.19.0
Needed: v18.20.x

Thank you!
```

---

## Solution 8: Use pm2 with Different Node Version

If pm2 is available and you find Node 18:

```bash
# Install pm2 globally (if not installed)
npm install -g pm2

# Use PM2 with specific Node version
cd ~/api
PORT=3002 pm2 start server.js --name gobarry-api --interpreter=/path/to/node18

# Examples:
pm2 start server.js --interpreter=/opt/cpanel/ea-nodejs18/bin/node
pm2 start server.js --interpreter=/opt/alt/alt-nodejs18/root/usr/bin/node

# Save configuration
pm2 save

# Set up autostart
pm2 startup
```

---

## Solution 9: Check MultiPHP Options (Some Hosts Have Multi-Node)

Similar to MultiPHP for PHP versions, some hosts have multi-Node setups:

### In cPanel:

1. Look for "MultiPHP Manager" or similar
2. Check if there's a "Node.js Manager" or "Node.js Version Manager"
3. Look in "Software" section for any Node.js configuration tools

---

## Solution 10: Compile Node 18 Locally (Advanced - Last Resort)

If you have shell access and nothing else works:

```bash
# Download Node 18 source
cd ~
wget https://nodejs.org/dist/v18.20.4/node-v18.20.4-linux-x64.tar.xz

# Extract to your home directory
tar -xf node-v18.20.4-linux-x64.tar.xz

# Create symlink or use directly
mkdir -p ~/bin
ln -s ~/node-v18.20.4-linux-x64/bin/node ~/bin/node18
ln -s ~/node-v18.20.4-linux-x64/bin/npm ~/bin/npm18

# Add to PATH
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Test
node18 --version

# Run server
cd ~/api
PORT=3002 node18 server.js
```

---

## 🎯 Action Plan - Do This Now

### Step 1: Check Available Versions (5 minutes)

```bash
# SSH into cPanel Terminal and run:
node --version
ls -la /opt/cpanel/ea-nodejs*/bin/node 2>/dev/null
ls -la /opt/alt/alt-nodejs*/root/usr/bin/node 2>/dev/null
nvm --version
```

**Paste the output here - I'll tell you exactly what to do next!**

### Step 2: Check cPanel Interface (2 minutes)

1. Go to "Setup Node.js App"
2. Take screenshot of available Node versions
3. Look for "Node.js Selector" or similar tool

### Step 3: Based on Results

- **If Node 18 is available:** Use Solution 4 or 5
- **If nvm is available:** Use Solution 3
- **If neither:** Use Solution 7 (email Pixelish specific questions)

---

## Why This Should Work

**cPanel/CloudLinux hosts typically have multiple Node versions** because:
- Different apps need different versions
- They use EasyApache (ea-nodejs packages)
- CloudLinux provides alt-nodejs packages
- Passenger supports multiple Node versions

**Node 18 is very likely already on the server** - we just need to find it and configure Passenger/pm2 to use it!

---

## Quick Commands to Run Now

Copy/paste this into cPanel Terminal:

```bash
echo "=== Current Node Version ==="
node --version

echo -e "\n=== Looking for Other Node Versions ==="
ls -la /opt/cpanel/ea-nodejs*/bin/node 2>/dev/null
ls -la /opt/alt/alt-nodejs*/root/usr/bin/node 2>/dev/null
ls -la /usr/local/bin/ea-nodejs* 2>/dev/null

echo -e "\n=== Check NVM ==="
nvm --version 2>/dev/null || echo "NVM not found"

echo -e "\n=== Check CloudLinux Selector ==="
which cl-selector 2>/dev/null || echo "CloudLinux Selector not found"

echo -e "\n=== Available Node Binaries ==="
find /opt -name "node" -type f 2>/dev/null | grep -v node_modules

echo -e "\n=== Done! ==="
echo "Paste this output and I'll tell you exactly which path to use!"
```

**Run this command and share the output - we'll find Node 18!** 🔍

---

## Bottom Line

There's a **very high chance** Node 18 is already on your cPanel server. We just need to:
1. Find where it is
2. Configure your app to use it
3. Set up Passenger or pm2 with the right path

**Don't give up on cPanel yet!** Let's find that Node 18 binary! 🚀
